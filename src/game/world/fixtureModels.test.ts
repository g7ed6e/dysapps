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
import { objetsDuQuaiDessines, tropheesDessines } from './objects/inTheWorld';
import { atelierDeCompte } from './objects/atelier';
import { barque, peintureDe } from './objects/pieces';
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

/** Les cubes du 6e tout construit, toutes commandes livrées et toutes quêtes finies (sans le sol). */
let mondeDu6e: ReturnType<typeof worldCubes> | null = null;
const monde = () => {
  if (!mondeDu6e) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    mondeDu6e = worldCubes('6e', progress, world, false).filter((c) => !c.sol);
  }
  return mondeDu6e;
};

it('toutes les petites constructions du 6e sont dessinées (seize commandes, trois objets d’entraide), et seulement elles', () => {
  const du6e = PETITES_CONSTRUCTIONS.filter((id) => BIOMES.find((b) => b.id === ileDe(id))?.classe === '6e');
  expect([...PETITES_CONSTRUCTIONS_DESSINEES].sort()).toEqual([...du6e].sort());
  expect(PETITES_CONSTRUCTIONS_DESSINEES).toHaveLength(19);
  expect(PETITES_CONSTRUCTIONS_DESSINEES.filter(aUnDessinDeLoin)).toHaveLength(8);
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
  expect(ecartDePres('6e')).toBe(Math.max(...ecarts));
  expect(ecartDePres('5e')).toBe(0);
});

it('posée, chaque petite construction remplace toutes ses cases, eau comprise, et reste dans son emprise ; sans elle, rien', () => {
  const cubes = monde();
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const ile = ileDe(id);
    const m = petitesConstructionsDessinees('6e', cubes, ile).find((d) => d.id === id);
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
    const loin = petitesConstructionsDessinees('6e', cubes, null).find((d) => d.id === id)!;
    expect(nTri(loin.opaque) + nTri(loin.fire), id).toBe(trianglesDuModele(id, true));
    // Une case manquante (la vague en cours) : pas de dessin, les cubes restent.
    const k = [...cases][0];
    expect(petitesConstructionsDessinees('6e', cubes.filter((c) => `${c.x},${c.y},${c.z}` !== k)).some((d) => d.id === id), id).toBe(false);
  }
  // Ailleurs qu'au 6e, aucune.
  expect(petitesConstructionsDessinees('5e', cubes)).toEqual([]);
});

/** Le bloc livré de chaque petite construction : celui de la commande, ou celui donné pendant la quête. */
function blocLivre(id: string): BlockId {
  const r = (REQUESTS as { fixture?: string; block: string }[]).find((q) => q.fixture === id);
  if (r) return r.block as BlockId;
  const s = (STORIES as { fixture: string; steps: { kind: string; block?: string }[] }[]).find((q) => q.fixture === id)!;
  return s.steps.find((e) => e.kind === 'give')!.block as BlockId;
}

it('règle GD-7 : la matière du bloc livré reste sur une grande face, dans les couleurs mêmes du bloc', () => {
  const cubes = monde();
  const pres = (id: string) => petitesConstructionsDessinees('6e', cubes, ileDe(id)).find((d) => d.id === id)!;
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const bloc = blocLivre(id);
    // Le bloc livré est bien dans la forme.
    expect(casesDeLaPetiteConstruction(id)!.some((c) => c.block === bloc), id).toBe(true);
    const f = couleurDeMatiere('6e', BLOCKS[bloc].texture as TextureKind);
    const cibles = [f.dessus, f.cote].map((c) => rgb(c).map((v) => lineaire(v / 255)));
    for (const loin of [false, true]) {
      const m = loin ? petitesConstructionsDessinees('6e', cubes, null).find((d) => d.id === id)! : pres(id);
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

it('le bloc d’or de chaque Gardien rallumé du 6e : un trophée de 40 à 60 triangles, dans ses deux cases de pierre et d’or', () => {
  const cubes = monde();
  const trophees = tropheesDessines('6e', cubes);
  expect(trophees).toHaveLength(BIOMES.filter((b) => b.classe === '6e').length);
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
  // Ailleurs, les cubes du kit.
  const { progress, world } = toutConstruitAvecLesCommandes();
  expect(tropheesDessines('5e', worldCubes('5e', progress, world, false))).toEqual([]);
});

it('les objets du quai du 6e : la barque, les caisses, les fanions et le foyer en pièces communes ; la fumée du foyer reste', () => {
  const cubes = monde();
  const objets = objetsDuQuaiDessines('6e', cubes);
  const genre = (id: string) => id.slice(id.lastIndexOf('/') + 1, id.indexOf('@'));
  const parGenre = new Map<string, number[]>();
  for (const o of objets) parGenre.set(genre(o.id), [...(parGenre.get(genre(o.id)) ?? []), nTri(o.opaque)]);
  expect([...parGenre.keys()].sort()).toEqual(['barque', 'caisse', 'fanion', 'foyer']);
  for (const n of parGenre.get('barque')!) {
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
  const at = atelierDeCompte();
  barque(at, peintureDe('6e', 'maths-6e-calculation', true), 'x', 4, true);
  expect(at.triangles).toBeLessThan(60);
  expect(objetsDuQuaiDessines('5e', cubes)).toEqual([]);
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
  const cubes = monde();
  const avecLanterne = PETITES_CONSTRUCTIONS_DESSINEES.filter((id) => casesDeLaPetiteConstruction(id)!.some((c) => c.block === BLOC.lanterne));
  expect(avecLanterne).toHaveLength(4);
  for (const id of PETITES_CONSTRUCTIONS_DESSINEES) {
    const m = petitesConstructionsDessinees('6e', cubes, ileDe(id)).find((d) => d.id === id)!;
    expect(nTri(m.fire), id).toBe(avecLanterne.includes(id) ? 8 : 0);
  }
  const fermee = cubes.map((c) => (c.petiteConstruction ? { ...c, muted: true } : c));
  for (const m of petitesConstructionsDessinees('6e', fermee, null)) expect(nTri(m.fire), m.id).toBe(0);
});
