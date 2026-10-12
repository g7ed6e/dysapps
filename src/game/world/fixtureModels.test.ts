import { afterEach, expect, it } from 'vitest';
import { aUnDessinDeLoin, ecartDePres, PETITES_CONSTRUCTIONS_DESSINEES, petitesConstructionsDessinees, trianglesDuModele } from './fixtureModels';
import { barriereDeCour, FORMES, LANTERNE_DE_COUR, marcheDeCour } from './architecture';
import { toutConstruitAvecLesCommandes } from './budget';
import { worldCubes } from './terrain';
import { casesDeLaPetiteConstructionDansLeMonde } from './terrain/fixture';
import { casesDeLaPetiteConstruction, PETITES_CONSTRUCTIONS } from './fixtures';
import { type BiomeId, BIOMES, BLOC, BLOCKS, type BlockId } from '../biomes';
import { couleurDeMatiere } from './palette';
import { rgb } from './decor/brush';
import { lineaire } from './landMesh';
import type { TextureKind } from './pixels';
import { applyLayout } from './appliedLayout';
import { freeSpots, moveIsland } from './arrange';
import { type ArchipelagoId, islandDef } from './map';
import { cubesDeLaVague, sansLaPartie } from './wave';
import { drawnQuayObjects, drawnTrophies } from './objects/inTheWorld';
import { countingWorkshop } from './objects/workshop';
import { rowboat, paintFor } from './objects/pieces';
import type { FacettesDuDecor } from './decor/brush';
import REQUESTS from './requests.json';
import STORIES from './stories.json';

afterEach(() => {
  applyLayout(undefined);
});

const PUITS = 'french-6e-letter-confusion-fixture-1';
const triangles = (d: { facettes: readonly { points: unknown[] }[] }) => d.facettes.reduce((n, f) => n + f.points.length - 2, 0);
const ileDe = (id: string) => id.replace(/-fixture-\d+$/, '') as BiomeId;
const nTri = (f: FacettesDuDecor) => f.positions.length / 9;

/** Un archipel tout construit, toutes commandes livrées et toutes quêtes finies (sans le sol). */
const mondes = new Map<ArchipelagoId, ReturnType<typeof worldCubes>>();
const mondeDe = (a: ArchipelagoId) => {
  let m = mondes.get(a);
  if (!m) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    m = worldCubes(a, progress, world, false).filter((c) => !c.sol);
    mondes.set(a, m);
  }
  return m;
};
const archipelDe = (id: string) => BIOMES.find((b) => b.id === ileDe(id))!.classe;

/**
 * Les petites constructions du 4e et du 3e déjà dessinées (12 octobre 2026) : à l'étape 1, la veilleuse d'Olive ; les
 * autres gardent leurs cubes jusqu'à leur étape.
 */
const DU_COLLEGE = ['life-earth-sciences-3e-human-body-fixture-1'];

it('toutes les petites constructions du 6e (seize commandes, trois objets d’entraide) et du 5e (douze et trois) sont dessinées, et celles du 4e et du 3e de leur étape, et seulement elles', () => {
  const du6e = PETITES_CONSTRUCTIONS.filter((id) => archipelDe(id) === '6e');
  const du5e = PETITES_CONSTRUCTIONS.filter((id) => archipelDe(id) === '5e');
  expect([...PETITES_CONSTRUCTIONS_DESSINEES].sort()).toEqual([...du6e, ...du5e, ...DU_COLLEGE].sort());
  expect(du6e).toHaveLength(19);
  expect(du5e).toHaveLength(15);
  for (const id of DU_COLLEGE) expect(PETITES_CONSTRUCTIONS, id).toContain(id);
  // Huit à silhouette au 6e, quatre au 5e (la cabane, la salière, la tente, le four à pain) ; aucune encore au 4e et au 3e.
  expect(PETITES_CONSTRUCTIONS_DESSINEES.filter(aUnDessinDeLoin)).toHaveLength(12);
});

it('le puits de Tunel : de 300 à 500 triangles de près, de 30 à 50 de loin', () => {
  const pres = trianglesDuModele(PUITS, false);
  const loin = trianglesDuModele(PUITS, true);
  expect(pres).toBeGreaterThanOrEqual(300);
  expect(pres).toBeLessThanOrEqual(500);
  expect(loin).toBeGreaterThanOrEqual(30);
  expect(loin).toBeLessThanOrEqual(50);
});

it('les triangles : un objet à silhouette de 90 à 500 de près, moins de 55 de loin ; un assemblage de pièces le même de près et de loin, 200 au plus ; le budget compte l’écart de près le plus cher', () => {
  const ecarts: number[] = [];
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const pres = trianglesDuModele(id, false);
    const loin = trianglesDuModele(id, true);
    if (aUnDessinDeLoin(id)) {
      expect(pres, id).toBeGreaterThanOrEqual(90);
      expect(pres, id).toBeLessThanOrEqual(500);
      expect(loin, id).toBeLessThan(55);
      expect(loin, id).toBeLessThan(pres);
    } else {
      expect(loin, id).toBe(pres);
      expect(pres, id).toBeLessThanOrEqual(200);
    }
    ecarts.push(pres - loin);
  }
  const ecartsDu = (a: ArchipelagoId) => PETITES_CONSTRUCTIONS_DESSINEES.filter((id) => archipelDe(id) === a).map((id) => trianglesDuModele(id, false) - trianglesDuModele(id, true));
  expect(ecartDePres('6e')).toBe(Math.max(...ecartsDu('6e')));
  expect(ecartDePres('5e')).toBe(Math.max(0, ...ecartsDu('5e')));
  expect(ecarts.length).toBe(PETITES_CONSTRUCTIONS_DESSINEES.length);
  expect(ecartDePres('4e')).toBe(0);
});

it('posée, chaque petite construction remplace toutes ses cases, eau comprise, et reste dans son emprise ; sans elle, rien', () => {
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const a = archipelDe(id);
    const cubes = mondeDe(a);
    const ile = ileDe(id);
    const m = petitesConstructionsDessinees(a, cubes, ile).find((d) => d.id === id);
    expect(m, id).toBeDefined();
    const cases = casesDeLaPetiteConstructionDansLeMonde(ile, id);
    expect(m!.replaced, id).toEqual(cases);
    expect(m!.cellules, id).toHaveLength(cases.size);
    expect(nTri(m!.opaque) + nTri(m!.fire), id).toBe(trianglesDuModele(id, false));
    const xs = [...cases].map((k) => Number(k.split(',')[0]));
    const ys = [...cases].map((k) => Number(k.split(',')[1]));
    for (const f of [m!.opaque, m!.fire]) {
      const p = f.positions;
      for (let i = 0; i < p.length; i += 3) {
        expect(p[i], id).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
        expect(p[i], id).toBeLessThanOrEqual(Math.max(...xs) + 1 + 1e-6);
        expect(p[i + 2], id).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
        expect(p[i + 2], id).toBeLessThanOrEqual(Math.max(...ys) + 1 + 1e-6);
      }
    }
    // De loin sur une autre île.
    const loin = petitesConstructionsDessinees(a, cubes, null).find((d) => d.id === id)!;
    expect(nTri(loin.opaque) + nTri(loin.fire), id).toBe(trianglesDuModele(id, true));
    // Une case manquante (la vague en cours) : pas de dessin, les cubes restent.
    const k = [...cases][0];
    expect(petitesConstructionsDessinees(a, cubes.filter((c) => `${c.x},${c.y},${c.z}` !== k)).some((d) => d.id === id), id).toBe(false);
  }
  // Ailleurs que dans leur archipel, aucune.
  expect(petitesConstructionsDessinees('4e', mondeDe('6e'))).toEqual([]);
});

/** Le bloc livré de chaque petite construction : celui de la commande, ou celui donné pendant la quête. */
function blocLivre(id: string): BlockId {
  const r = (REQUESTS as { fixture?: string; block: string }[]).find((q) => q.fixture === id);
  if (r) return r.block as BlockId;
  const s = (STORIES as { fixture: string; steps: { kind: string; block?: string }[] }[]).find((q) => q.fixture === id)!;
  return s.steps.find((e) => e.kind === 'give')!.block as BlockId;
}

it('règle GD-7 : la matière du bloc livré reste sur une grande face, dans les couleurs mêmes du bloc (au moins 0,6 case d’aire, de près et de loin)', () => {
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const a = archipelDe(id);
    const cubes = mondeDe(a);
    const pres = (id: string) => petitesConstructionsDessinees(a, cubes, ileDe(id)).find((d) => d.id === id)!;
    const bloc = blocLivre(id);
    // Le bloc livré est bien dans la forme.
    expect(casesDeLaPetiteConstruction(id)!.some((c) => c.block === bloc), id).toBe(true);
    const f = couleurDeMatiere(a, BLOCKS[bloc].texture as TextureKind);
    const cibles = [f.dessus, f.cote].map((c) => rgb(c).map((v) => lineaire(v / 255)));
    for (const loin of [false, true]) {
      const m = loin ? petitesConstructionsDessinees(a, cubes, null).find((d) => d.id === id)! : pres(id);
      const { positions: p, colors: k } = m.opaque;
      let aire = 0;
      for (let t = 0; t < p.length / 9; t++) {
        const c = [k[t * 9], k[t * 9 + 1], k[t * 9 + 2]];
        if (!cibles.some((q) => q.every((v, i) => Math.abs(v - c[i]) < 1e-4))) continue;
        const [a, b, d] = [0, 1, 2].map((s) => [p[t * 9 + s * 3], p[t * 9 + s * 3 + 1], p[t * 9 + s * 3 + 2]]);
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        aire += Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
      }
      expect(aire, `${id} ${loin ? 'de loin' : 'de près'}`).toBeGreaterThanOrEqual(0.6);
    }
  }
});

it('sur une île tournée (GD-9), ses petites constructions sont dessinées à leur place, tournées avec elle', () => {
  const FERME: BiomeId = 'french-6e-grammar-spelling';
  const partie = toutConstruitAvecLesCommandes();
  const spot = freeSpots(partie.world, FERME, 1)[0];
  expect(spot).toBeDefined();
  const r = moveIsland(partie.world, FERME, spot);
  if (!r.ok) throw new Error(r.reason);
  applyLayout(r.world.layout);
  const cubes = worldCubes('6e', partie.progress, r.world, false).filter((c) => !c.sol);
  const poses = new Set(cubes.filter((c) => c.petiteConstruction && c.tag === FERME).map((c) => `${c.x},${c.y},${c.z}`));
  const ids = PETITES_CONSTRUCTIONS_DESSINEES.filter((id) => ileDe(id) === FERME);
  expect(ids).toHaveLength(2);
  expect(new Set(ids.flatMap((id) => [...casesDeLaPetiteConstructionDansLeMonde(FERME, id)]))).toEqual(poses);
  const dessinees = petitesConstructionsDessinees('6e', cubes, FERME).filter((d) => ids.includes(d.id));
  expect(dessinees).toHaveLength(2);
});

it('la pose en vague sur une île tournée (GD-9) : ses cases tournent avec l’île, la vague les pose toutes, puis le dessin les prend', () => {
  const FERME: BiomeId = 'french-6e-grammar-spelling';
  const BAC = 'french-6e-grammar-spelling-fixture-1';
  const extent = (cells: Iterable<string>) => {
    const pts = [...cells].map((k) => k.split(',').map(Number));
    const span = (i: number) => Math.max(...pts.map((p) => p[i])) - Math.min(...pts.map((p) => p[i])) + 1;
    return { x: span(0), y: span(1) };
  };
  const before = casesDeLaPetiteConstructionDansLeMonde(FERME, BAC);
  const game = toutConstruitAvecLesCommandes();
  const spot = freeSpots(game.world, FERME, 1)[0];
  const r = moveIsland(game.world, FERME, spot);
  if (!r.ok) throw new Error(r.reason);
  applyLayout(r.world.layout);
  expect(islandDef(FERME).quarts % 2).toBe(1);
  const cells = casesDeLaPetiteConstructionDansLeMonde(FERME, BAC);
  expect(cells.size).toBe(before.size);
  // Un quart de tour : la forme couchée le long de x se pose le long de y.
  expect(extent(cells)).toEqual({ x: extent(before).y, y: extent(before).x });
  // La vague (useWavePose.ts) pose exactement les cubes de ces cases, et le monde sans elle les laisse vides.
  const cubes = worldCubes('6e', game.progress, r.world, false).filter((c) => !c.sol);
  const wave = cubesDeLaVague(cubes, cells);
  expect(new Set(wave.map((c) => `${c.x},${c.y},${c.z}`))).toEqual(cells);
  expect(wave.every((c) => c.petiteConstruction && c.tag === FERME)).toBe(true);
  expect(sansLaPartie(cubes, cells).some((c) => cells.has(`${c.x},${c.y},${c.z}`))).toBe(false);
  // La vague finie, le dessin prend ces mêmes cases.
  const drawn = petitesConstructionsDessinees('6e', cubes, FERME).find((d) => d.id === BAC);
  expect(drawn?.replaced).toEqual(cells);
});

it.each(['6e', '5e', '4e', '3e'] as const)('le bloc d’or de chaque Gardien rallumé (%s) : un trophée de 40 à 60 triangles, dans ses deux cases de pierre et d’or', (a) => {
  const cubes = mondeDe(a);
  const trophees = drawnTrophies(a, cubes);
  expect(trophees).toHaveLength(BIOMES.filter((b) => b.classe === a).length);
  for (const t of trophees) {
    const n = nTri(t.opaque);
    expect(n, t.id).toBeGreaterThanOrEqual(40);
    expect(n, t.id).toBeLessThanOrEqual(60);
    expect(t.replaced.size, t.id).toBe(2);
    const [x, y] = [...t.replaced][0].split(',').map(Number);
    const textures = [...t.replaced].map((k) => cubes.find((c) => `${c.x},${c.y},${c.z}` === k)!.texture).sort();
    expect(textures, t.id).toEqual(['or', 'pierre']);
    const p = t.opaque.positions;
    for (let i = 0; i < p.length; i += 3) {
      expect(p[i]).toBeGreaterThanOrEqual(x - 1e-6);
      expect(p[i]).toBeLessThanOrEqual(x + 1 + 1e-6);
      expect(p[i + 2]).toBeGreaterThanOrEqual(y - 1e-6);
      expect(p[i + 2]).toBeLessThanOrEqual(y + 1 + 1e-6);
    }
  }
});

it.each(['6e', '5e', '4e', '3e'] as const)('les objets du quai (%s) : la barque (sauf aux Îles du Ciel), les caisses, les fanions et le foyer en pièces communes ; la fumée du foyer reste', (a) => {
  const cubes = mondeDe(a);
  const objets = drawnQuayObjects(a, cubes);
  const genre = (id: string) => id.slice(id.lastIndexOf('/') + 1, id.indexOf('@'));
  const parGenre = new Map<string, number[]>();
  for (const o of objets) parGenre.set(genre(o.id), [...(parGenre.get(genre(o.id)) ?? []), nTri(o.opaque)]);
  expect([...parGenre.keys()].sort()).toEqual(a === '3e' ? ['caisse', 'fanion', 'foyer'] : ['barque', 'caisse', 'fanion', 'foyer']);
  for (const n of parGenre.get('barque') ?? []) {
    expect(n).toBeGreaterThanOrEqual(80);
    expect(n).toBeLessThanOrEqual(120);
  }
  // Trois caisses, de 12 à 30 triangles chacune.
  for (const n of parGenre.get('caisse')!) expect(n).toBeLessThanOrEqual(90);
  for (const n of parGenre.get('fanion')!) expect(n).toBeLessThanOrEqual(40);
  for (const n of parGenre.get('foyer')!) {
    expect(n).toBeGreaterThanOrEqual(40);
    expect(n).toBeLessThanOrEqual(60);
  }
  for (const o of objets) {
    const siens = cubes.filter((c) => c.decor === o.id && c.color !== '#a9a4a0');
    expect(o.replaced, o.id).toEqual(new Set(siens.map((c) => `${c.x},${c.y},${c.z}`)));
  }
  // La barque retournée (le village qui commence) : la coque seule, moins chère.
  const at = countingWorkshop();
  rowboat(at, paintFor('6e', 'maths-6e-calculation', true), 'x', 4, true);
  expect(at.triangles).toBeLessThan(60);
});

it('les pièces de la cour : dans leur case, sans dessous, de 10 à 50 triangles ; les lisses fermées au bord de la case', () => {
  const dans = (d: { facettes: readonly { points: number[][]; normale: number[] }[] }) => {
    for (const f of d.facettes) {
      for (const q of f.points)
        for (const v of q) {
          expect(v).toBeGreaterThanOrEqual(-1e-6);
          expect(v).toBeLessThanOrEqual(1 + 1e-6);
        }
      expect(f.normale[2]).not.toBe(-1);
    }
  };
  for (const { forme } of FORMES)
    for (const dessus of ['lanterne', 'bloc', null] as const)
      for (const avecPoteau of [true, false]) {
        const d = barriereDeCour(forme, dessus, avecPoteau);
        dans(d);
        if (forme !== 'te' && forme !== 'croix') expect(triangles(d)).toBeLessThanOrEqual(50);
      }
  // Le bout d'une barrière : ses deux lisses fermées vers sa voisine, au bord de la case (l'assemblage ôte ces bouchons
  // contre la lisse voisine ; vers un fantôme, ils restent).
  const bouchons = barriereDeCour('bout', null, true).facettes.filter((f) => f.role === 'yardRail' && f.normale[0] === 1);
  expect(bouchons).toHaveLength(2);
  for (const f of bouchons) for (const q of f.points) expect(q[0]).toBeCloseTo(1);
  // Le bout dans le poteau n'est pas dessiné.
  expect(barriereDeCour('bout', null, true).facettes.filter((f) => f.role === 'yardRail' && f.normale[0] === -1)).toHaveLength(0);
  for (const vers of [0, 1, 2, 3, null]) {
    const d = marcheDeCour(vers, false);
    dans(d);
    expect(triangles(d)).toBeLessThanOrEqual(18);
    expect(d.dansLeMonde).toBe(true);
  }
  const haut = (vers: number) => marcheDeCour(vers, false).facettes.find((f) => f.normale[2] === 1 && f.points[0][2] > 0.2)!.points;
  expect(Math.min(...haut(0).map((q) => q[1]))).toBeCloseTo(0.5);
  expect(Math.max(...haut(1).map((q) => q[0]))).toBeCloseTo(0.5);
  dans({ facettes: LANTERNE_DE_COUR });
  expect(LANTERNE_DE_COUR.length).toBeGreaterThan(0);
  expect(LANTERNE_DE_COUR.filter((f) => f.vitre)).toHaveLength(4);
});

it('les lanternes des petites constructions s’allument la nuit (leurs vitres dans le feu), pas celles d’une île fermée', () => {
  const avecLanterne = PETITES_CONSTRUCTIONS_DESSINEES.filter((id) => casesDeLaPetiteConstruction(id)!.some((c) => c.block === BLOC.lanterne));
  // Quatre au 6e ; au 5e, l'écritoire de Vélin, le coffre de Sillon et la balise de Frimas ; au 3e, la veilleuse d'Olive.
  expect(avecLanterne).toHaveLength(8);
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const a = archipelDe(id);
    const m = petitesConstructionsDessinees(a, mondeDe(a), ileDe(id)).find((d) => d.id === id)!;
    expect(nTri(m.fire), id).toBe(avecLanterne.includes(id) ? 8 : 0);
  }
  for (const a of ['6e', '5e', '4e', '3e'] as const) {
    const fermee = mondeDe(a).map((c) => (c.petiteConstruction ? { ...c, muted: true } : c));
    for (const m of petitesConstructionsDessinees(a, fermee, null)) expect(nTri(m.fire), m.id).toBe(0);
  }
});

it('la veilleuse d’Olive : le pied de cire livrée sur 60 % au moins de l’aire vue, sa vitre pleine dans le feu (allumée la nuit), sans flamme ni halo', () => {
  const OLIVE = 'life-earth-sciences-3e-human-body-fixture-1';
  const ile = ileDe(OLIVE);
  const m = petitesConstructionsDessinees('3e', mondeDe('3e'), ile).find((d) => d.id === OLIVE)!;
  // Les quatre vitres de la lanterne des cours, et rien d'autre : ni flamme, ni halo.
  expect(nTri(m.fire)).toBe(8);
  expect(m.halo).toBeNull();
  const wax = couleurDeMatiere('3e', 'cire');
  const cibles = [wax.dessus, wax.cote].map((c) => rgb(c).map((v) => lineaire(v / 255)));
  const { positions: p, colors: k } = m.opaque;
  let cire = 0;
  let total = 0;
  for (let t = 0; t < p.length / 9; t++) {
    const [a, b, d] = [0, 1, 2].map((s) => [p[t * 9 + s * 3], p[t * 9 + s * 3 + 1], p[t * 9 + s * 3 + 2]]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const aire = Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
    total += aire;
    const c = [k[t * 9], k[t * 9 + 1], k[t * 9 + 2]];
    if (cibles.some((q) => q.every((x, i) => Math.abs(x - c[i]) < 1e-4))) cire += aire;
  }
  expect(cire / total).toBeGreaterThanOrEqual(0.6);
});
