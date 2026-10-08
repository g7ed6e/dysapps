// Le cœur agrandi des îles-écoles (décision du mainteneur, 01/10/2026 : « vraie terre en plus »). La Forêt d'abord, puis
// le Marché, l'Atelier et le Phare : un cœur de 20 × 20 avec sa côte d'avant tout autour, la terre gagne deux cases de chaque côté, ses
// voisines s'écartent d'autant dans MAP. Les clés de sauvegarde restent relatives à l'origine `core`, qui ne bouge pas.
import type { BiomeId } from '../biomes';
import { linkWholeRegion, VOYAGES } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { placedLinksOfPlace } from './linkGeometry';
import { dockOrigin, shoreY } from './harbor';
import {
  bornesDuCoeur,
  coeurDe,
  COTE_DU_COEUR,
  CORE,
  DECOR_DES_MARGES,
  inCoeurDOrigine,
  inCore,
  islandDef,
  isLand,
  isthmusOf,
  landBox,
  landCells,
  landscape,
  margesDuCoeur,
  mapOf,
  MAP,
  PAS_DES_JALONS,
  tirage,
  type ArchipelagoId,
} from './map';
import { ORIGINE_DU_QUAI, PLAN_ZONE, zoneDesPlans } from './plans';
import { bridgePath, creatureSpot, placeSpot, questStations, VILLAGE_PLACES } from './terrain';

/**
 * Les îles-écoles agrandies : le repère de leur dessin (leur place d'avant GD-9, qui ne bouge plus), leur côte et leur
 * archipel. Les clés de sauvegarde restent relatives à ce repère.
 */
const ECOLES: Partial<Record<BiomeId, { archipel: ArchipelagoId; core: { x: number; y: number }; ext: { left: number; right: number; front: number; back: number } }>> = {
  'french-6e-phonology': {
    archipel: '6e',
    core: { x: 67, y: 59 },
    ext: { left: 6, right: 5, front: 3, back: 6 },
  },
  'maths-5e-proportionality': {
    archipel: '5e',
    core: { x: 69, y: 317 },
    ext: { left: 3, right: 4, front: 2, back: 3 },
  },
  'maths-4e-algebra': {
    archipel: '4e',
    core: { x: 62, y: 632 },
    ext: { left: 3, right: 3, front: 2, back: 4 },
  },
  'maths-3e-functions': {
    archipel: '3e',
    core: { x: 58, y: 912 },
    ext: { left: 3, right: 3, front: 3, back: 3 },
  },
};
const IDS = Object.keys(ECOLES) as BiomeId[];

it('les îles-écoles agrandies couvrent 20 × 20 cases, de −2 à 18 autour de leur origine ; les autres îles gardent 16', () => {
  expect(COTE_DU_COEUR).toEqual(Object.fromEntries(IDS.map((id) => [id, 20])));
  for (const id of IDS) {
    const def = islandDef(id);
    const e = ECOLES[id]!;
    expect(bornesDuCoeur(def), id).toEqual({ x0: -2, y0: -2, x1: 18, y1: 18 });
    // Le repère du dessin (celui des clés de sauvegarde) et la côte ne bougent pas : la terre a deux cases de plus de chaque côté.
    expect(def.repere, id).toEqual(e.core);
    expect(def.ext, id).toEqual(e.ext);
    const box = landBox(def);
    expect([box.x0, box.y0, box.y1], id).toEqual([def.core.x - 2 - e.ext.left, def.core.y - 2 - e.ext.front, def.core.y + 18 + e.ext.back]);
    const c = coeurDe(def);
    for (let x = c.x0; x < c.x1; x++) for (let y = c.y0; y < c.y1; y++) expect(isLand(def, x, y), `${id} ${x},${y}`).toBe(true);
  }
  for (const d of MAP) if (!IDS.includes(d.id)) expect(bornesDuCoeur(d), d.id).toEqual({ x0: 0, y0: 0, x1: CORE, y1: CORE });
});

it('la côte d’une île-école est celle d’avant, repoussée de deux cases : son dessin se lit autour du cœur d’origine', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    const { x, y } = def.core;
    const r = def.repere;
    // Hors du cœur agrandi, une case se lit deux cases plus près du cœur, dans le repère du dessin ; le long du cœur,
    // le dessin s'étire.
    expect(tirage(def, x - 3, y - 3), id).toEqual({ x: r.x - 1, y: r.y - 1 });
    expect(tirage(def, x + 18, y + 20), id).toEqual({ x: r.x + 16, y: r.y + 18 });
    expect(tirage(def, x - 2, y + 17), id).toEqual({ x: r.x, y: r.y + 15 });
  }
  // Une île sans cœur agrandi ni déplacement lit son dessin à sa place.
  const volcan = islandDef('maths-6e-decimals');
  expect(tirage(volcan, volcan.core.x + 10, volcan.core.y + 20)).toEqual({ x: volcan.repere.x + 10, y: volcan.repere.y + 20 });
  // Une île écartée, puis calée sur le pas (GD-9), lit son dessin là où il a été tiré.
  const ferme = islandDef('french-6e-grammar-spelling');
  expect(ferme.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(ferme, ferme.core.x + 3, ferme.core.y + 11)).toEqual({ x: ferme.repere.x + 5, y: ferme.repere.y + 11 });
  const glacier = islandDef('maths-5e-signed-numbers');
  expect(glacier.deplacee).toEqual({ x: -2, y: 0 });
  expect(tirage(glacier, glacier.core.x + 1, glacier.core.y + 9)).toEqual({ x: glacier.repere.x + 3, y: glacier.repere.y + 9 });
});

it('les marges du cœur : une terre plate, au décor de la côte sur leur rangée extérieure, nue le long du cœur d’origine', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    const marges = margesDuCoeur(def);
    expect(marges, id).toHaveLength(20 * 20 - CORE * CORE);
    for (const m of marges) {
      expect(inCore(def, m.x, m.y)).toBe(true);
      expect(inCoeurDOrigine(def, m.x, m.y)).toBe(false);
      expect(m.h).toBe(0);
    }
    const bord = (m: { x: number; y: number }) => [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => inCoeurDOrigine(def, m.x + dx, m.y + dy)));
    expect(marges.filter((m) => bord(m) && m.decor), id).toEqual([]);
    // Pas un terrain vide : du décor sur la rangée extérieure ; au rythme de la côte quand l'enveloppe du décor de
    // l'archipel le permet (de 14 % des cases à l'Atelier, où le sapin ne pousse qu'à plat, au quart à la Forêt), allégé
    // sinon (`DECOR_DES_MARGES`).
    const exterieur = marges.filter((m) => !bord(m));
    const part = exterieur.filter((m) => m.decor).length / exterieur.length;
    const allege = DECOR_DES_MARGES[id];
    expect(part, id).toBeGreaterThan(allege ? 0.08 : 0.12);
    if (allege?.genre) expect(new Set(marges.filter((m) => m.decor).map((m) => m.decor)), id).toEqual(new Set([allege.genre]));
    if (allege?.derriere) expect(marges.filter((m) => m.decor && m.y < def.core.y), id).toEqual([]);
    // Le paysage s'arrête au bord du cœur agrandi.
    expect(landscape(def).some((l) => inCore(def, l.x, l.y)), id).toBe(false);
  }
  // Les autres îles n'ont pas de marges.
  for (const d of MAP) if (!IDS.includes(d.id)) expect(margesDuCoeur(d), d.id).toEqual([]);
  // Le Marché, le port des Îles Brumeuses, reste bas (intention du 5e, §3) : des roseaux, une case sur deux, sur les côtés et derrière.
  expect(DECOR_DES_MARGES).toEqual({ 'maths-5e-proportionality': { genre: 'roseau', unSurDeux: true, derriere: true } });
});

it('la rangée extérieure des marges est cassée de loin en loin (une pierre, une touffe, un rondin) ; la rangée où l’on marche reste nue', () => {
  // Relecture du consultant Blocland (01/10/2026) : vue de l'archipel, la bande nue le long du cœur faisait une longue
  // ligne droite. Sans allègement (`DECOR_DES_MARGES`), pas plus de `PAS_DES_JALONS` − 1 cases nues à la suite sur
  // chaque côté de la rangée extérieure.
  expect(PAS_DES_JALONS).toBe(5);
  const nues: Record<string, number> = {};
  for (const id of IDS) {
    const def = islandDef(id);
    const c = coeurDe(def);
    const decor = new Map(margesDuCoeur(def).map((m) => [`${m.x},${m.y}`, m.decor]));
    const cotes = [
      Array.from({ length: c.x1 - c.x0 }, (_, k) => `${c.x0 + k},${c.y0}`),
      Array.from({ length: c.x1 - c.x0 }, (_, k) => `${c.x0 + k},${c.y1 - 1}`),
      Array.from({ length: c.y1 - c.y0 }, (_, k) => `${c.x0},${c.y0 + k}`),
      Array.from({ length: c.y1 - c.y0 }, (_, k) => `${c.x1 - 1},${c.y0 + k}`),
    ];
    let plusLongue = 0;
    for (const cote of cotes) {
      let suite = 0;
      for (const k of cote) {
        suite = decor.get(k) ? 0 : suite + 1;
        plusLongue = Math.max(plusLongue, suite);
      }
    }
    nues[id] = plusLongue;
    if (!DECOR_DES_MARGES[id]) expect(plusLongue, id).toBeLessThan(PAS_DES_JALONS);
  }
  // Le Marché, allégé (des roseaux, une case sur deux, rien devant), garde sa rangée de devant nue.
  expect(nues).toEqual({ 'french-6e-phonology': 4, 'maths-5e-proportionality': 20, 'maths-4e-algebra': 4, 'maths-3e-functions': 4 });
});

it('dans le cœur d’une île-école, les bornes, la créature, les lieux et la zone des plans gardent leur place', () => {
  for (const id of IDS) {
    const def = islandDef(id);
    // Les bornes au pas de 4, centrées sur la visée (redistribution « Trois bandes », 02/10/2026).
    expect(questStations(id).map((s) => [s.x, s.y]), id).toEqual([
      [4, 1],
      [8, 1],
      [12, 1],
    ]);
    const spot = creatureSpot(id);
    const decorDesMarges = new Set(margesDuCoeur(def).filter((m) => m.decor).map((m) => `${m.x - def.core.x},${m.y - def.core.y}`));
    expect(decorDesMarges.has(`${spot.x},${spot.y}`), id).toBe(false);
    for (const place of ['school', 'trophies'] as const)
      expect(placeSpot(place, id), `${id} ${place}`).toMatchObject({ x: def.core.x + VILLAGE_PLACES[place].at.x, y: def.core.y + VILLAGE_PLACES[place].at.y });
  }
  // Le coin de la zone des plans ne bouge jamais (les clés de sauvegarde en dépendent) ; sur les îles-écoles, elle
  // gagne une rangée vers le fond.
  expect(PLAN_ZONE).toEqual({ x: 8, y: 10, w: 6, h: 5 });
  for (const id of IDS) expect(zoneDesPlans(id), id).toEqual({ x: 8, y: 10, w: 6, h: 6 });
});

it('les liaisons posées abordent la côte d’une île-école, jamais son cœur de 20', () => {
  const links = ARCHIPELAGO_IDS.reduce<string[]>((l, a) => linkWholeRegion(a, l), VOYAGES.map((v) => v.id));
  for (const id of IDS) {
    const def = islandDef(id);
    const c = coeurDe(def);
    for (const b of placedLinksOfPlace(id, links)) {
      const cases = bridgePath(b, links);
      expect(cases.length, b.id).toBeGreaterThan(0);
      for (const bout of [cases[0], cases.at(-1)!]) {
        if (!isLand(def, bout.x, bout.y) && !inCore(def, bout.x, bout.y)) continue;
        // Une case du tracé sur l'île : jamais dans son cœur agrandi (les bornes et les bâtiments y sont).
        expect(bout.x < c.x0 || bout.x >= c.x1 || bout.y < c.y0 || bout.y >= c.y1, `${b.id} (${bout.x}, ${bout.y})`).toBe(true);
      }
    }
  }
});

it('le quai d’une île-école qui est un port suit sa côte repoussée ; les clés de ses étapes ne bougent pas', () => {
  // La côte au pied de la jetée, devant le cœur agrandi, dans la côte dessinée du lieu ; le navire la suit. À
  // l'Atelier, il plane deux cases au-dessus de l'eau (ses réacteurs sont dessous) : la jetée y descend de deux
  // marches de moins, et le navire s'avance d'une case. Les clés des étapes, relatives au repère du dessin, ne bougent pas.
  for (const id of ['maths-5e-proportionality', 'maths-4e-algebra', 'maths-3e-functions'] as const) {
    const def = islandDef(id);
    expect(shoreY(id), id).toBeGreaterThanOrEqual(def.core.y - 2 - def.ext.front);
    expect(shoreY(id), id).toBeLessThan(def.core.y);
  }
  expect(dockOrigin('maths-5e-proportionality')).toEqual({ x: islandDef('maths-5e-proportionality').core.x + 15, y: islandDef('maths-5e-proportionality').core.y - 14, z: 0 });
  expect(ORIGINE_DU_QUAI['maths-5e-proportionality']).toEqual({ x: 15, y: -12, z: -4 });
  expect(dockOrigin('maths-4e-algebra')).toEqual({ x: islandDef('maths-4e-algebra').core.x + 15, y: islandDef('maths-4e-algebra').core.y - 15, z: 2 });
  expect(ORIGINE_DU_QUAI['maths-4e-algebra']).toEqual({ x: 15, y: -14, z: -7 });
  // Le Phare, port des Îles du Ciel, sans étape du Bloc-Navire : le navire s'y pose devant sa côte repoussée.
  expect(dockOrigin('maths-3e-functions')).toEqual({ x: islandDef('maths-3e-functions').core.x + 15, y: islandDef('maths-3e-functions').core.y - 16, z: 9 });
  expect(ORIGINE_DU_QUAI['maths-3e-functions']).toBeUndefined();
});

it('les voisines d’une île-école s’écartent : les bras de mer restent ouverts', () => {
  for (const id of IDS) {
    const { archipel } = ECOLES[id]!;
    // Entre deux îles qui ne partagent pas d'isthme, au moins deux cases d'eau.
    const iles = mapOf(archipel);
    const terres: { id: string; ile: BiomeId; cases: readonly { x: number; y: number }[] }[] = iles.map((d) => ({ id: d.id as string, ile: d.id, cases: landCells(d) }));
    for (let i = 0; i < terres.length; i++)
      for (let j = i + 1; j < terres.length; j++) {
        const [a, b] = [terres[i], terres[j]];
        if (a.ile === b.ile || isthmusOf(a.ile) === b.ile) continue;
        let ecart = Infinity;
        for (const p of a.cases) for (const q of b.cases) ecart = Math.min(ecart, Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) - 1);
        expect(ecart, `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(2);
      }
  }
});
