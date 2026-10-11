import { expect, it } from 'vitest';
import { BLOCKS } from '../../biomes';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { caseDuLieu } from '../construction/buildings';
import { estUnePlaceDeTrophee, TROPHY_SLOTS } from '../trophyHall';
import { HALLE } from '../terrain/village';
import { TROPHEE } from '../construction/settings';
import type { FacettesDuDecor } from '../decor/brush';
import type { VoxelCube } from '../cube';
import { lieuxDessines, remplaceParLeLieu } from './lieux';

const ECOLE = 'french-6e-phonology';
const nTri = (f: FacettesDuDecor) => f.positions.length / 9;

/** Le 6e d'Archipéo tout construit (la Halle), avec `n` trophées gagnés (sans le sol). */
const mondes = new Map<number, VoxelCube[]>();
function monde(n: number): VoxelCube[] {
  let m = mondes.get(n);
  if (!m) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    const blocs = Object.keys(BLOCKS) as (keyof typeof BLOCKS)[];
    const trophees = Array.from({ length: n }, (_, i) => blocs[i % blocs.length]);
    m = worldCubes('6e', progress, world, false, trophees, false, 'halle').filter((c) => !c.sol);
    mondes.set(n, m);
  }
  return m;
}

it('les trois lieux de l’île-école : de près de 600 à 2 000 triangles, de loin 200 au plus, la salle vide comme pleine', () => {
  for (const n of [0, 6, TROPHY_SLOTS.length]) {
    const cubes = monde(n);
    const pres = lieuxDessines('6e', cubes, ECOLE);
    const loin = lieuxDessines('6e', cubes, null);
    expect(pres.map((m) => m.id).sort()).toEqual([`lieu:${ECOLE}:assembly`, `lieu:${ECOLE}:school`, `lieu:${ECOLE}:trophies`]);
    for (const m of pres) {
      const t = nTri(m.opaque) + nTri(m.fire);
      expect(t, `${m.id} ${n}`).toBeGreaterThanOrEqual(600);
      expect(t, `${m.id} ${n}`).toBeLessThanOrEqual(2000);
    }
    for (const m of loin) expect(nTri(m.opaque) + nTri(m.fire), `${m.id} ${n}`).toBeLessThanOrEqual(200);
  }
});

it('le modèle remplace les cubes du lieu, sauf les trophées, le bloc suspendu et la recette de la Halle ; on y entre toujours en le touchant', () => {
  const cubes = monde(TROPHY_SLOTS.length);
  const dessines = new Map(lieuxDessines('6e', cubes, ECOLE).map((m) => [m.id.split(':')[2], m]));
  for (const c of cubes) {
    if (c.ghost || (c.place !== 'school' && c.place !== 'trophies' && c.place !== 'assembly')) continue;
    const m = caseDuLieu(c);
    const k = `${c.x},${c.y},${c.z}`;
    const remplace = dessines.get(c.place)!.replaced.has(k);
    if (!m) {
      expect(remplace).toBe(false);
      continue;
    }
    const garde = (c.place === 'trophies' && estUnePlaceDeTrophee(m.x, m.y, m.z)) || (c.place === 'assembly' && ((m.x === 2 && m.y < HALLE.rang) || (m.x === 0 && m.y === 0 && m.z < 6)));
    expect(remplace, `${c.place} ${JSON.stringify(m)}`).toBe(!garde);
    expect(remplaceParLeLieu(c, m)).toBe(!garde);
  }
  // Toutes les cases remplacées portent leur lieu : le toucher (la case la plus proche) y fait entrer.
  for (const [lieu, m] of dessines) for (const c of m.cellules) expect(cubes.find((d) => d.x === c.x && d.y === c.y && d.z === c.z)?.place).toBe(lieu);
});

it('le modèle tient dans l’emprise de ses cubes, et laisse leur place aux trophées posés sur les socles', () => {
  const cubes = monde(TROPHY_SLOTS.length);
  for (const m of lieuxDessines('6e', cubes, ECOLE)) {
    const siens = cubes.filter((c) => m.replaced.has(`${c.x},${c.y},${c.z}`));
    const lieu = siens[0].place;
    const tous = cubes.filter((c) => c.place === lieu && !c.ghost);
    const [x0, x1] = [Math.min(...tous.map((c) => c.x)), Math.max(...tous.map((c) => c.x)) + 1];
    const [y0, y1] = [Math.min(...tous.map((c) => c.y)), Math.max(...tous.map((c) => c.y)) + 1];
    const zMax = Math.max(...tous.map((c) => c.z)) + 1;
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
  const salle = lieuxDessines('6e', cubes, ECOLE).find((m) => m.id.endsWith(':trophies'))!;
  const trophees = cubes.filter((c) => c.place === 'trophies' && !c.ghost && !salle.replaced.has(`${c.x},${c.y},${c.z}`));
  expect(trophees).toHaveLength(TROPHY_SLOTS.length);
  const demi = TROPHEE.bas / 2;
  const p = salle.opaque.positions;
  for (const t of trophees)
    for (let i = 0; i < p.length; i += 3) {
      const dedans = Math.abs(p[i] - (t.x + 0.5)) < demi - 1e-3 && Math.abs(p[i + 2] - (t.y + 0.5)) < demi - 1e-3 && p[i + 1] > t.z + 1e-3 && p[i + 1] < t.z + TROPHEE.hauteur - 1e-3;
      expect(dedans, `${JSON.stringify(t)}`).toBe(false);
    }
});

it('seules les vitres de l’école s’allument la nuit ; rien sur une île fermée', () => {
  const cubes = monde(0);
  for (const m of lieuxDessines('6e', cubes, ECOLE)) expect(nTri(m.fire) > 0, m.id).toBe(m.id.endsWith(':school'));
  const fermee = cubes.map((c) => (c.place ? { ...c, muted: true } : c));
  for (const m of lieuxDessines('6e', fermee, ECOLE)) expect(nTri(m.fire), m.id).toBe(0);
});

it('la Fabrique de Blocland (un toit plat, sa cheminée) n’est pas dessinée : seule la Halle d’Archipéo l’est', () => {
  const { progress, world } = toutConstruitAvecLesCommandes();
  const cubes = worldCubes('6e', progress, world, false, [], false, 'fabrique').filter((c) => !c.sol);
  expect(lieuxDessines('6e', cubes, ECOLE).map((m) => m.id).sort()).toEqual([`lieu:${ECOLE}:school`, `lieu:${ECOLE}:trophies`]);
});
