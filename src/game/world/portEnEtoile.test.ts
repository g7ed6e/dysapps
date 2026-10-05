// Le port en étoile (GD-7) : les liaisons du port, leurs prix, leur tracé (les bacs en contour), et ce qu'en fait la
// caméra (le plus court chemin en cases, le cadre fixe d'une longue traversée, la vue de l'île, la vue d'ensemble).
import { BIOMES } from '../biomes';
import { ARCHIPELAGOS, BRIDGES, PRIX_DU_PORT, archipelagoOf, bridgesOf, getArchipelago } from './archipelago';
import { dockBox } from './harbour';
import { islandDef, isLand, landBox, mapOf } from './map';
import { avatarWalk } from './scene';
import { BAC_LONG, avatarRoute, bridgePath, cadreDeTraversee, overviewBounds, routeLengths, viewZone, whaleSpots, worldBounds, worldCubes } from './terrain';
import { MONUMENT_ISLET, monumentsOf } from './monuments';
import { toutConstruit } from './budget';

const etoiles = BRIDGES.filter((b) => b.etoile);
const court = (id: string) => id.replace(/(french|maths|english)-\de-/g, '');

/**
 * Les îles que le port ne touche pas encore : aucun tracé ne passe sans traverser un monument, l'îlot d'un Gardien ou la
 * clairière d'une baleine (le Manoir au 5e, le Théâtre au 4e) ; à décider (GD-7).
 */
const SANS_LIAISON_DU_PORT = ['english-5e-grammar', 'english-4e-comprehension'];

it('les liaisons du port : trois aux Premiers Rivages (depuis la Plaine et la Forêt), une, deux et deux ailleurs, aucune vers la LV2', () => {
  expect(etoiles.map((b) => court(b.id))).toEqual([
    'calculation-reading',
    'calculation-word-spelling',
    'phonology-vocabulary',
    'proportionality-homophones',
    'algebra-grammar',
    'algebra-vocabulary',
    'functions-comprehension',
    'functions-grammar',
  ]);
  for (const b of etoiles) {
    expect(b.id).toBe(`${b.from}-${b.to}`);
    const a = archipelagoOf(b.from);
    // Du port, ou au 6e de la Forêt (le couple Plaine + Forêt, déjà reliées par le pont gratuit).
    expect(a.classe === '6e' ? a.starts : [a.port], b.id).toContain(b.from);
    expect(BIOMES.find((x) => x.id === b.to)?.subject, b.id).not.toBe('lv2');
  }
  // Avec elles, le port (au 6e, la Plaine ou la Forêt) touche chaque île de sa classe, sauf la LV2.
  for (const a of ARCHIPELAGOS) {
    const centre = a.classe === '6e' ? a.starts : [a.port];
    const touchees = new Set(centre.flatMap((id) => bridgesOf(id).flatMap((b) => [b.from, b.to])));
    for (const ile of BIOMES.filter((x) => x.classe === a.classe && x.subject !== 'lv2')) expect(touchees.has(ile.id), ile.id).toBe(!SANS_LIAISON_DU_PORT.includes(ile.id));
  }
});

it('le prix du port : 4 blocs en 6e, 5 ailleurs, pour toutes les liaisons du port ; le pont gratuit et les raccourcis gardent le leur', () => {
  expect(PRIX_DU_PORT).toEqual({ '6e': 4, '5e': 5, '4e': 5, '3e': 5 });
  for (const b of BRIDGES) {
    const a = archipelagoOf(b.from);
    const centre = a.classe === '6e' ? a.starts : [a.port];
    const duPort = centre.includes(b.from) || centre.includes(b.to);
    if (b.id === 'french-6e-phonology-maths-6e-calculation') expect(b.cost).toBe(0);
    else if (duPort) expect(b.cost, b.id).toBe(PRIX_DU_PORT[a.classe]);
  }
  // Les raccourcis ne bougent pas.
  const prix = Object.fromEntries(BRIDGES.map((b) => [b.id, b.cost]));
  expect(prix['french-6e-letter-confusion-french-6e-word-spelling']).toBe(5);
  expect(prix['english-6e-vocabulary-english-6e-grammar']).toBe(4);
  expect(prix['english-5e-vocabulary-english-5e-grammar']).toBe(5);
  expect(prix['french-4e-agreement-french-4e-vocabulary']).toBe(5);
  expect(prix['maths-3e-statistics-english-3e-grammar']).toBe(7);
});

describe('le tracé des liaisons du port', () => {
  it('passe par ses points de passage, ne touche aucune autre île, reste dans l’archipel', () => {
    for (const b of etoiles) {
      const path = bridgePath(b);
      const a = archipelagoOf(b.from).classe;
      const wb = worldBounds(a);
      expect(path.length, b.id).toBeGreaterThan(10);
      for (const c of path) {
        expect(c.x >= wb.minX && c.x <= wb.maxX && c.y >= wb.minY && c.y <= wb.maxY, `${b.id} (${c.x}, ${c.y})`).toBe(true);
        for (const o of mapOf(a)) if (o.id !== b.from && o.id !== b.to) expect(isLand(o, c.x, c.y), `${b.id} sur ${o.id}`).toBe(false);
      }
      // Un pas à la fois (pas de trou), du bord de l'une au bord de l'autre.
      for (let i = 1; i < path.length; i++) expect(Math.max(Math.abs(path[i].x - path[i - 1].x), Math.abs(path[i].y - path[i - 1].y)), b.id).toBe(1);
      // Les points de passage sont sur le tracé (ceux qui sont dans l'eau).
      for (const v of b.via ?? []) if (!mapOf(a).some((o) => isLand(o, v.x, v.y))) expect(path.some((c) => c.x === v.x && c.y === v.y), `${b.id} (${v.x}, ${v.y})`).toBe(true);
    }
  });

  it('ne croise ni ne frôle un autre ouvrage (deux cases au moins)', () => {
    for (const b of etoiles) {
      const a = archipelagoOf(b.from).classe;
      const autres = BRIDGES.filter((o) => o.id !== b.id && archipelagoOf(o.from).classe === a).flatMap((o) => bridgePath(o).map((c) => ({ ...c, id: o.id })));
      for (const c of bridgePath(b)) for (const o of autres) expect(Math.max(Math.abs(o.x - c.x), Math.abs(o.y - c.y)) > 2, `${court(b.id)} près de ${court(o.id)} en (${c.x}, ${c.y})`).toBe(true);
    }
  });

  it('les baleines font surface à trois cases au moins d’une liaison du port, et les îlots des monuments restent à quatre', () => {
    for (const b of etoiles) {
      const a = archipelagoOf(b.from).classe;
      const path = bridgePath(b);
      for (const w of whaleSpots(a)) for (const c of path) expect(Math.hypot(w.x - c.x, w.y - c.y) - w.r, `${court(b.id)} : baleine en ${w.x}, ${w.y}`).toBeGreaterThanOrEqual(3);
      for (const m of monumentsOf(a))
        for (const c of path) {
          const dx = Math.max(m.islet.x - c.x, 0, c.x - (m.islet.x + MONUMENT_ISLET - 1));
          const dy = Math.max(m.islet.y - c.y, 0, c.y - (m.islet.y + MONUMENT_ISLET - 1));
          expect(Math.max(dx, dy), `${court(b.id)} : ${m.id} en (${c.x}, ${c.y})`).toBeGreaterThan(3);
        }
    }
  });

  it('la Carrière passe à l’écart de la jetée (81, 8) ; au 4e, rien au-delà de y = 655', () => {
    const carriere = bridgePath(etoiles.find((b) => b.to === 'french-6e-word-spelling')!);
    const jetee = dockBox(getArchipelago('6e').port);
    for (const c of carriere) {
      expect(Math.hypot(c.x - 81, c.y - 8), `(${c.x}, ${c.y})`).toBeGreaterThanOrEqual(8);
      expect(c.x > jetee.x1 + 4 || c.y > jetee.y1 + 4 || c.x < jetee.x0 - 4, `(${c.x}, ${c.y})`).toBe(true);
    }
    for (const b of etoiles.filter((x) => archipelagoOf(x.from).classe === '4e')) for (const c of bridgePath(b)) expect(c.y, b.id).toBeLessThanOrEqual(655);
  });

  it('un long bac a un poteau toutes les quatre cases, une lanterne à chaque bout seulement', () => {
    const { progress, world } = toutConstruit();
    const cubes = worldCubes('6e', progress, world, false);
    for (const b of etoiles.filter((x) => x.kind === 'bac' && archipelagoOf(x.from).classe === '6e')) {
      const path = bridgePath(b);
      expect(path.length).toBeGreaterThan(BAC_LONG);
      const siens = cubes.filter((c) => c.bridge === b.id);
      const poteaux = siens.filter((c) => c.texture === 'tronc' && path.some((p) => p.x === c.x && p.y === c.y));
      // Un poteau tous les quatre (moins ceux du radeau, au milieu, et ceux qu'un cube du terrain occupe déjà), et le dernier.
      expect(poteaux.length).toBeLessThanOrEqual(Math.ceil(path.length / 4) + 1);
      expect(poteaux.length).toBeGreaterThan(Math.floor(path.length / 4) - 4);
      expect(siens.filter((c) => c.texture === 'lanterne')).toHaveLength(2);
    }
  });
});

describe('la caméra et le bonhomme', () => {
  const tout = [...BRIDGES.map((b) => b.id)];

  it('le bonhomme prend le plus court chemin en cases, pas le moins d’ouvrages', () => {
    const longueur = (from: string, to: string, liens: string[]) => routeLengths(avatarRoute(from as never, to as never, liens)!).at(-1)!;
    // Tout construit, retirer un ouvrage ne raccourcit jamais le trajet : il prenait déjà le plus court.
    const iles = mapOf('6e').map((d) => d.id);
    for (const from of ['maths-6e-calculation', 'french-6e-phonology'])
      for (const to of iles) {
        if (to === from) continue;
        const l = longueur(from, to, tout);
        for (const b of BRIDGES.filter((x) => archipelagoOf(x.from).classe === '6e' && x.cost > 0)) {
          const sans = avatarRoute(from as never, to as never, tout.filter((id) => id !== b.id));
          if (sans) expect(routeLengths(sans).at(-1)!, `${court(from)} → ${court(to)} sans ${court(b.id)}`).toBeGreaterThanOrEqual(l - 1e-9);
        }
      }
    // De la Plaine à la Tour, tout construit : le long bac en contour est un peu plus court que le chemin des ponts (la
    // Forêt, la Ferme, le sentier) ; le bonhomme le prend, et la caméra cadre la traversée.
    const tour = avatarRoute('maths-6e-calculation', 'french-6e-reading', tout)!;
    expect(cadreDeTraversee('6e', tour)).not.toBeNull();
    // Sans autre chemin, il prend le long bac.
    const seul = avatarRoute('maths-6e-calculation', 'french-6e-word-spelling', ['maths-6e-calculation-french-6e-word-spelling'])!;
    expect(seul.length).toBeGreaterThan(BAC_LONG);
  });

  it('au-delà de 36 cases sur un même ouvrage, un cadre fixe du départ à l’arrivée ; sinon la caméra suit', () => {
    const long = avatarRoute('maths-6e-calculation', 'french-6e-word-spelling', ['maths-6e-calculation-french-6e-word-spelling'])!;
    const cadre = cadreDeTraversee('6e', long)!;
    expect(cadre).not.toBeNull();
    for (const p of [long[0], long[long.length - 1], ...bridgePath(etoiles.find((b) => b.to === 'french-6e-word-spelling')!)]) {
      expect(p.x >= cadre.minX && p.x <= cadre.maxX && p.y >= cadre.minY && p.y <= cadre.maxY).toBe(true);
    }
    const marche = avatarWalk({ route: long, seq: 1 }, 0, '6e')!;
    expect(marche.cadre).toEqual(cadre);
    // Un trajet ordinaire, une flânerie : pas de cadre.
    const court = avatarRoute('maths-6e-calculation', 'french-6e-phonology', tout)!;
    expect(cadreDeTraversee('6e', court)).toBeNull();
    expect(avatarWalk({ route: court, seq: 1 }, 0, '6e')!.cadre).toBeUndefined();
    expect(avatarWalk({ route: long, seq: 1, flanerie: true }, 0, '6e')!.cadre).toBeUndefined();
  });

  it('la vue de l’île ignore les liaisons du port ; la vue d’ensemble les cadre dès le départ', () => {
    // La vue d'une île du port est celle de ses voisines par les autres ouvrages (sans la LV2), comme avant GD-7.
    for (const ile of new Set(etoiles.flatMap((b) => [b.from, b.to]))) {
      const ids = [ile, ...bridgesOf(ile).filter((o) => !o.etoile).map((o) => (o.from === ile ? o.to : o.from))].filter((id) => id === ile || BIOMES.find((x) => x.id === id)?.subject !== 'lv2');
      const boxes = ids.map((id) => landBox(islandDef(id)));
      expect(viewZone(ile), ile).toEqual({ minX: Math.min(...boxes.map((x) => x.x0)), maxX: Math.max(...boxes.map((x) => x.x1)), minY: Math.min(...boxes.map((x) => x.y0)), maxY: Math.max(...boxes.map((x) => x.y1)) });
    }
    for (const a of ARCHIPELAGOS) {
      const depart = overviewBounds(a.classe, []);
      for (const b of etoiles.filter((x) => archipelagoOf(x.from).classe === a.classe))
        for (const c of bridgePath(b)) expect(c.x >= depart.minX && c.x <= depart.maxX && c.y >= depart.minY && c.y <= depart.maxY, `${b.id} (${c.x}, ${c.y})`).toBe(true);
    }
  });
});
