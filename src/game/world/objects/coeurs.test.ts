import { afterEach, expect, it } from 'vitest';
import { type BiomeId, BIOMES } from '../../biomes';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { applyLayout } from '../appliedLayout';
import { freeSpots, moveIsland } from '../arrange';
import { islandDef } from '../map';
import { turnCell } from '../placement';
import { LAYOUT_PAD, origineDe } from '../terrain/base';
import type { FacettesDuDecor } from '../decor/brush';
import { COEURS_DU_6E, coeursDessines } from './coeurs';

afterEach(() => {
  applyLayout(undefined);
});

const nTri = (f: FacettesDuDecor) => f.positions.length / 9;

/** Les cubes du 6e tout construit, toutes commandes livrées (sans le sol). */
let mondeDu6e: ReturnType<typeof worldCubes> | null = null;
const monde = () => {
  if (!mondeDu6e) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    mondeDu6e = worldCubes('6e', progress, world, false).filter((c) => !c.sol);
  }
  return mondeDu6e;
};

/** Les cases du monde (x, y) des colonnes d'un ensemble, tournées avec son île. */
function colonnesDansLeMonde(id: BiomeId, colonnes: readonly (readonly [number, number])[]): Set<string> {
  const o = origineDe(id);
  const q = islandDef(id).quarts;
  return new Set(
    colonnes.map(([x, y]) => {
      const t = turnCell(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, q);
      return `${o.x + t.x},${o.y + t.y}`;
    }),
  );
}

it('chaque ensemble du décor du cœur des îles du 6e est dessiné, de 12 à 150 triangles, sans rien qui s’allume', () => {
  const dessines = coeursDessines('6e', monde());
  const attendus = Object.entries(COEURS_DU_6E).flatMap(([id, l]) => (l ?? []).map((e) => `coeur:${id}:${e.nom}`));
  expect(dessines.map((d) => d.id).sort()).toEqual([...attendus].sort());
  for (const d of dessines) {
    const n = nTri(d.opaque);
    expect(n, d.id).toBeGreaterThanOrEqual(12);
    expect(n, d.id).toBeLessThanOrEqual(150);
    expect(nTri(d.fire), d.id).toBe(0);
    expect(d.cellules.length, d.id).toBe(d.replaced.size);
  }
  // Toutes les îles du 6e qui ont un décor du cœur fait de main d'homme : la Forêt n'a que des arbres, la Tour sa pierre.
  expect(Object.keys(COEURS_DU_6E)).toHaveLength(14);
  expect(coeursDessines('5e', [])).toEqual([]);
});

it('un ensemble remplace tous les cubes du décor de ses colonnes, et seulement eux ; son dessin reste sur ses colonnes', () => {
  const cubes = monde();
  const dessines = new Map(coeursDessines('6e', cubes).map((d) => [d.id, d]));
  for (const [id, l] of Object.entries(COEURS_DU_6E) as [BiomeId, NonNullable<(typeof COEURS_DU_6E)[BiomeId]>][]) {
    for (const e of l) {
      const d = dessines.get(`coeur:${id}:${e.nom}`)!;
      const colonnes = colonnesDansLeMonde(id, e.colonnes);
      const siens = cubes.filter((c) => c.tag === id && !c.decor && !c.quest && !c.place && !c.bridge && !c.petiteConstruction && !c.ghost && colonnes.has(`${c.x},${c.y}`));
      expect(new Set(siens.map((c) => `${c.x},${c.y},${c.z}`)), d.id).toEqual(d.replaced);
      // Le dessin : dans l'emprise de ses colonnes (un peu de marge pour une pelle ou un rabat), pas sous son sol.
      const xs = [...colonnes].map((k) => Number(k.split(',')[0]));
      const ys = [...colonnes].map((k) => Number(k.split(',')[1]));
      const base = Math.min(...siens.map((c) => c.z));
      const p = d.opaque.positions;
      for (let i = 0; i < p.length; i += 3) {
        expect(p[i], d.id).toBeGreaterThanOrEqual(Math.min(...xs) - 0.15);
        expect(p[i], d.id).toBeLessThanOrEqual(Math.max(...xs) + 1.15);
        expect(p[i + 2], d.id).toBeGreaterThanOrEqual(Math.min(...ys) - 0.15);
        expect(p[i + 2], d.id).toBeLessThanOrEqual(Math.max(...ys) + 1.15);
        expect(p[i + 1], d.id).toBeGreaterThanOrEqual(base - 0.35);
        expect(p[i + 1], d.id).toBeLessThanOrEqual(Math.max(...siens.map((c) => c.z)) + 1.05);
      }
    }
  }
});

it('il manque un cube d’un ensemble (un lieu ou le Gardien l’a pris) : l’ensemble reste en cubes', () => {
  const cubes = monde();
  const horloge = coeursDessines('6e', cubes).find((d) => d.id === 'coeur:english-6e-grammar:horloge')!;
  const un = [...horloge.replaced][0];
  const sans = cubes.filter((c) => `${c.x},${c.y},${c.z}` !== un);
  const ids = coeursDessines('6e', sans).map((d) => d.id);
  expect(ids).not.toContain('coeur:english-6e-grammar:horloge');
  expect(ids).toContain('coeur:english-6e-grammar:rouage');
});

it('sur une île tournée (GD-9), le décor de son cœur est dessiné à sa place, tourné avec elle', () => {
  const FERME: BiomeId = 'french-6e-grammar-spelling';
  const partie = toutConstruitAvecLesCommandes();
  const spot = freeSpots(partie.world, FERME, 1)[0];
  const r = moveIsland(partie.world, FERME, spot);
  if (!r.ok) throw new Error(r.reason);
  applyLayout(r.world.layout);
  const cubes = worldCubes('6e', partie.progress, r.world, false).filter((c) => !c.sol);
  const dessines = coeursDessines('6e', cubes).filter((d) => d.id.startsWith(`coeur:${FERME}:`));
  // Le champ et un poteau au moins (l'autre poteau, sur l'île tournée, peut tomber sous une autre case prise : il reste
  // alors en cubes, comme tout ensemble incomplet).
  expect(dessines.map((d) => d.id)).toContain(`coeur:${FERME}:champ`);
  expect(dessines.length).toBeGreaterThanOrEqual(2);
  for (const d of dessines) {
    const e = (COEURS_DU_6E[FERME] ?? []).find((x) => d.id.endsWith(`:${x.nom}`))!;
    const cols = colonnesDansLeMonde(FERME, e.colonnes);
    for (const k of d.replaced) expect(cols.has(k.split(',').slice(0, 2).join(','))).toBe(true);
  }
  const champ = dessines.find((d) => d.id.endsWith(':champ'))!;
  const colonnes = colonnesDansLeMonde(FERME, (COEURS_DU_6E[FERME] ?? [])[0].colonnes);
  const p = champ.opaque.positions;
  for (let i = 0; i < p.length; i += 3) expect(colonnes.has(`${Math.floor(p[i])},${Math.floor(p[i + 2])}`)).toBe(true);
});

it('les cubes du cœur restent ceux du monde : Blocland et la vue simple les voient comme avant', () => {
  const cubes = monde();
  const avant = cubes.length;
  coeursDessines('6e', cubes);
  expect(cubes.length).toBe(avant);
  expect(BIOMES.filter((b) => b.classe === '6e' && !COEURS_DU_6E[b.id]).map((b) => b.id).sort()).toEqual(['french-6e-phonology', 'french-6e-reading']);
});
