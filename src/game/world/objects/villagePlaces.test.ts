import { describe, expect, it } from 'vitest';
import { type BiomeId, BLOCKS } from '../../biomes';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { caseDuLieu } from '../construction/buildings';
import { estUnePlaceDeTrophee, TROPHY_SLOTS } from '../trophyHall';
import { HALLE } from '../terrain/village';
import { TROPHEE } from '../construction/settings';
import type { FacettesDuDecor } from '../decor/brush';
import type { VoxelCube } from '../cube';
import type { ArchipelagoId } from '../map';
import { lineaire } from '../landMesh';
import { rgb } from '../decor/brush';
import { KITS } from '../architecture';
import { drawnVillagePlaces, replacedByPlace } from './villagePlaces';
import { paintFor } from './pieces';

const triCount = (f: FacettesDuDecor) => f.positions.length / 9;

/** Un archipel d'Archipéo tout construit (la Halle), avec `n` trophées gagnés (sans le sol). */
const worlds = new Map<string, VoxelCube[]>();
function builtWorld(a: ArchipelagoId, n: number): VoxelCube[] {
  let m = worlds.get(`${a}|${n}`);
  if (!m) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    const blockIds = Object.keys(BLOCKS) as (keyof typeof BLOCKS)[];
    const trophyItems = Array.from({ length: n }, (_, i) => blockIds[i % blockIds.length]);
    m = worldCubes(a, progress, world, false, trophyItems, false, 'halle').filter((c) => !c.sol);
    worlds.set(`${a}|${n}`, m);
  }
  return m;
}

describe.each([
  ['6e', 'french-6e-phonology'],
  ['5e', 'maths-5e-proportionality'],
] as const)('les lieux dessinés de l’île-école (%s)', (a: ArchipelagoId, SCHOOL: BiomeId) => {
  const withTrophies = (n: number) => builtWorld(a, n);

  it('les trois lieux de l’île-école : de près de 600 à 2 000 triangles, de loin 200 au plus, la salle vide comme pleine', () => {
    for (const n of [0, 6, TROPHY_SLOTS.length]) {
      const cubes = withTrophies(n);
      const near = drawnVillagePlaces(a, cubes, SCHOOL);
      const far = drawnVillagePlaces(a, cubes, null);
      expect(near.map((m) => m.id).sort()).toEqual([`lieu:${SCHOOL}:assembly`, `lieu:${SCHOOL}:school`, `lieu:${SCHOOL}:trophies`]);
      for (const m of near) {
        const t = triCount(m.opaque) + triCount(m.fire);
        expect(t, `${m.id} ${n}`).toBeGreaterThanOrEqual(600);
        expect(t, `${m.id} ${n}`).toBeLessThanOrEqual(2000);
      }
      for (const m of far) expect(triCount(m.opaque) + triCount(m.fire), `${m.id} ${n}`).toBeLessThanOrEqual(200);
    }
  });

  it('le modèle remplace les cubes du lieu, sauf les trophées, le bloc suspendu et la recette de la Halle ; on y entre toujours en le touchant', () => {
    const cubes = withTrophies(TROPHY_SLOTS.length);
    const drawn = new Map(drawnVillagePlaces(a, cubes, SCHOOL).map((m) => [m.id.split(':')[2], m]));
    for (const c of cubes) {
      if (c.ghost || (c.place !== 'school' && c.place !== 'trophies' && c.place !== 'assembly')) continue;
      const m = caseDuLieu(c);
      const k = `${c.x},${c.y},${c.z}`;
      const isReplaced = drawn.get(c.place)!.replaced.has(k);
      if (!m) {
        expect(isReplaced).toBe(false);
        continue;
      }
      const kept = (c.place === 'trophies' && estUnePlaceDeTrophee(m.x, m.y, m.z)) || (c.place === 'assembly' && ((m.x === 2 && m.y < HALLE.rang) || (m.x === 0 && m.y === 0 && m.z < 6)));
      expect(isReplaced, `${c.place} ${JSON.stringify(m)}`).toBe(!kept);
      expect(replacedByPlace(c, m)).toBe(!kept);
    }
    // Toutes les cases remplacées portent leur lieu : le toucher (la case la plus proche) y fait entrer.
    for (const [place, m] of drawn) for (const c of m.cellules) expect(cubes.find((d) => d.x === c.x && d.y === c.y && d.z === c.z)?.place).toBe(place);
  });

  it('le modèle tient dans l’emprise de ses cubes, et laisse leur place aux trophées posés sur les socles', () => {
    const cubes = withTrophies(TROPHY_SLOTS.length);
    for (const m of drawnVillagePlaces(a, cubes, SCHOOL)) {
      const members = cubes.filter((c) => m.replaced.has(`${c.x},${c.y},${c.z}`));
      const place = members[0].place;
      const all = cubes.filter((c) => c.place === place && !c.ghost);
      const [x0, x1] = [Math.min(...all.map((c) => c.x)), Math.max(...all.map((c) => c.x)) + 1];
      const [y0, y1] = [Math.min(...all.map((c) => c.y)), Math.max(...all.map((c) => c.y)) + 1];
      const zMax = Math.max(...all.map((c) => c.z)) + 1;
      const p = m.opaque.positions;
      for (let i = 0; i < p.length; i += 3) {
        expect(p[i], m.id).toBeGreaterThanOrEqual(x0 - 0.01);
        expect(p[i], m.id).toBeLessThanOrEqual(x1 + 0.01);
        expect(p[i + 2], m.id).toBeGreaterThanOrEqual(y0 - 0.01);
        expect(p[i + 2], m.id).toBeLessThanOrEqual(y1 + 0.01);
        expect(p[i + 1], m.id).toBeLessThanOrEqual(zMax + 0.01);
      }
    }
    // Rien du modèle dans la place d'un trophée (son lingot ou son cristal, plus petit que sa case, posé au bas de sa case).
    const trophyRoom = drawnVillagePlaces(a, cubes, SCHOOL).find((m) => m.id.endsWith(':trophies'))!;
    const trophyItems = cubes.filter((c) => c.place === 'trophies' && !c.ghost && !trophyRoom.replaced.has(`${c.x},${c.y},${c.z}`));
    expect(trophyItems).toHaveLength(TROPHY_SLOTS.length);
    const half = TROPHEE.bas / 2;
    const p = trophyRoom.opaque.positions;
    for (const t of trophyItems)
      for (let i = 0; i < p.length; i += 3) {
        const inside = Math.abs(p[i] - (t.x + 0.5)) < half - 1e-3 && Math.abs(p[i + 2] - (t.y + 0.5)) < half - 1e-3 && p[i + 1] > t.z + 1e-3 && p[i + 1] < t.z + TROPHEE.hauteur - 1e-3;
        expect(inside, `${JSON.stringify(t)}`).toBe(false);
      }
  });

  it('seules les vitres de l’école s’allument la nuit ; rien sur une île fermée', () => {
    const cubes = withTrophies(0);
    for (const m of drawnVillagePlaces(a, cubes, SCHOOL)) expect(triCount(m.fire) > 0, m.id).toBe(m.id.endsWith(':school'));
    const closed = cubes.map((c) => (c.place ? { ...c, muted: true } : c));
    for (const m of drawnVillagePlaces(a, closed, SCHOOL)) expect(triCount(m.fire), m.id).toBe(0);
  });

});

const SCHOOL = 'french-6e-phonology';

it('la Fabrique de Blocland (un toit plat, sa cheminée) n’est pas dessinée : seule la Halle d’Archipéo l’est', () => {
  const { progress, world } = toutConstruitAvecLesCommandes();
  const cubes = worldCubes('6e', progress, world, false, [], false, 'fabrique').filter((c) => !c.sol);
  expect(drawnVillagePlaces('6e', cubes, SCHOOL).map((m) => m.id).sort()).toEqual([`lieu:${SCHOOL}:school`, `lieu:${SCHOOL}:trophies`]);
});

it('au 5e, les lieux en pierre (intention du directeur artistique) : les murs de l’école dans la pierre grise du kit, ses chaînes d’angle dans la pierre sombre, la Halle bardée, sans brique ni marbre aux piliers', () => {
  const MARKET: BiomeId = 'maths-5e-proportionality';
  const near = new Map(drawnVillagePlaces('5e', builtWorld('5e', 0), MARKET).map((m) => [m.id.split(':')[2], m]));
  /** Les couleurs (linéaires, arrondies) d'un modèle, et celle d'une couleur du kit sous le voile. */
  const colours = (f: FacettesDuDecor) => new Set(Array.from({ length: f.colors.length / 3 }, (_, i) => [0, 1, 2].map((k) => f.colors[i * 3 + k].toFixed(4)).join(',')));
  const pe = paintFor('5e', MARKET, false);
  const key = (c: number) => rgb(c).map((v) => lineaire(v / 255).toFixed(4)).join(',');
  const role = (r: 'masonry' | 'soubassement' | 'poteau' | 'bardage') => key(pe.role(r));
  expect(KITS['5e'].couleurs).toMatchObject({ masonry: 0x7d8a86, soubassement: 0x66726f, poteau: 0x795643, bardage: 0xb1815e });
  const school = colours(near.get('school')!.opaque);
  for (const r of ['masonry', 'soubassement', 'poteau'] as const) expect(school.has(role(r)), r).toBe(true);
  expect(school.has(key(pe.material('brique').cote))).toBe(false);
  const hall = colours(near.get('assembly')!.opaque);
  for (const r of ['soubassement', 'poteau', 'bardage'] as const) expect(hall.has(role(r)), r).toBe(true);
  expect(hall.has(key(pe.material('planches').cote))).toBe(false);
  const room = colours(near.get('trophies')!.opaque);
  for (const r of ['masonry', 'soubassement'] as const) expect(room.has(role(r)), r).toBe(true);
  // Au 6e, la brique de l'école ne change pas.
  const sixth = colours(drawnVillagePlaces('6e', builtWorld('6e', 0), SCHOOL).find((m) => m.id.endsWith(':school'))!.opaque);
  expect(sixth.has(key(paintFor('6e', SCHOOL, false).material('brique').cote))).toBe(true);
});
