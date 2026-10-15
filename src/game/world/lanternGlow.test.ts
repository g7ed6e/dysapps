import { describe, expect, it } from 'vitest';
import type { VoxelCube } from './cube';
import { coutDesLueurs, HALO, lueursDesLanternes, PEAU, RAYON_DE_L_EAU_MIN } from './lanternGlow';
import { lueursCost } from './budget';

const cube = (x: number, y: number, z: number, extra: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888', place: 'monument:m', ...extra });

/** Le haut du phare du large : une galerie 5 × 5 à z = 7, une lanterne en anneau 3 × 3 à z = 8, son toit à z = 9. */
function hautDuPhare(lit: boolean): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  for (let x = 1; x <= 5; x++) for (let y = 1; y <= 5; y++) if (x === 1 || x === 5 || y === 1 || y === 5 || x === 2 || x === 4 || y === 2 || y === 4) cubes.push(cube(x, y, 7));
  for (let x = 2; x <= 4; x++) for (let y = 2; y <= 4; y++) if (x !== 3 || y !== 3) cubes.push(cube(x, y, 8, lit ? { lit: true } : {}));
  for (let x = 2; x <= 4; x++) for (let y = 2; y <= 4; y++) cubes.push(cube(x, y, 9));
  return cubes;
}

describe('la lueur des lanternes allumées (GD-10)', () => {
  it('rien sans bloc allumé, ni pour un fantôme ou un bloc délavé', () => {
    expect(lueursDesLanternes(hautDuPhare(false), 0)).toBeNull();
    expect(lueursDesLanternes([cube(0, 0, 0, { lit: true, ghost: true }), cube(1, 0, 0, { lit: true, muted: true })], 0)).toBeNull();
    expect(coutDesLueurs(null)).toEqual({ triangles: 0, drawCalls: 0 });
  });

  it('un halo centré sur la lanterne, deux à trois fois plus large qu’elle', () => {
    const l = lueursDesLanternes(hautDuPhare(true), -0.45)!;
    expect(l.halos).toEqual([{ centre: [3.5, 8.5, 3.5], cote: HALO * 3 }]);
    expect(HALO).toBeGreaterThanOrEqual(2);
    expect(HALO).toBeLessThanOrEqual(3);
  });

  it('la peau couvre les quatre côtés de la lanterne, un rien au-dehors, et lit le centre plein du dégradé', () => {
    const l = lueursDesLanternes(hautDuPhare(true), null)!;
    const peau = l.positions.slice(0, 16 * 3);
    const xs = peau.filter((_, i) => i % 3 === 0);
    expect(Math.min(...xs)).toBeCloseTo(2 - PEAU);
    expect(Math.max(...xs)).toBeCloseTo(5 + PEAU);
    expect(l.uvs.slice(0, 32).every((u) => u === 0.5)).toBe(true);
  });

  it('une flaque sur chaque case de la corniche que rien ne couvre, et une sur l’eau', () => {
    const avecEau = lueursDesLanternes(hautDuPhare(true), -0.45)!;
    const sansEau = lueursDesLanternes(hautDuPhare(true), null)!;
    // 4 côtés de peau, 16 cases de corniche (le tour de la galerie), 1 carré d'eau.
    expect(sansEau.indices.length / 6).toBe(4 + 16);
    expect(avecEau.indices.length / 6).toBe(4 + 16 + 1);
    const eau = avecEau.positions.slice(-12);
    expect(eau.filter((_, i) => i % 3 === 1).every((y) => y > -0.45 && y < -0.4)).toBe(true);
    expect(Math.max(...eau.filter((_, i) => i % 3 === 0)) - 3.5).toBeGreaterThanOrEqual(RAYON_DE_L_EAU_MIN);
    // Les uv des flaques restent dans le dégradé : nulles au bord, pleines au centre.
    expect(avecEau.uvs.every((u) => u >= 0 && u <= 1)).toBe(true);
    expect(coutDesLueurs(avecEau)).toEqual({ triangles: 2 * 21 + 2, drawCalls: 2 });
  });

  it('les grands projets finis, la nuit : un maillage et un halo par monument allumé (le phare au 5e, deux en 4e, trois en 3e), rien au 6e', () => {
    expect(lueursCost('5e')).toEqual({ triangles: 44, drawCalls: 2 });
    expect(lueursCost('4e')).toEqual({ triangles: 72, drawCalls: 3 });
    expect(lueursCost('3e')).toEqual({ triangles: 54, drawCalls: 4 });
    expect(lueursCost('6e')).toEqual({ triangles: 0, drawCalls: 0 });
  });
});
