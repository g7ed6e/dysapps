// Les Gardiens en cubes de Blocland (world/characters/guardians.ts) : ce que leur silhouette doit dire.
import { GUARDIAN_CUBES } from './guardians';

describe('L’Amphore peinte (DA, HG-2)', () => {
  it('a deux anses détachées du col dans sa silhouette de face : elle ne se lit pas comme un tonneau', () => {
    const cubes = GUARDIAN_CUBES['history-6e-antiquity'];
    // De face (vue le long de y), les colonnes pleines de chaque rang ; un rang troué de part et d'autre du col : les anses.
    const rangs = [...new Set(cubes.map((c) => c.z))].map((z) => [...new Set(cubes.filter((c) => c.z === z).map((c) => c.x))].sort((a, b) => a - b));
    const troues = rangs.filter((xs) => xs.length >= 2 && xs.some((x, i) => i > 0 && x - xs[i - 1] > 1));
    expect(troues.length).toBeGreaterThanOrEqual(2);
    // Un vide de chaque côté du col, symétrique.
    for (const xs of troues) {
      const vides = xs.slice(1).flatMap((x, i) => (x - xs[i] > 1 ? [xs[i] + 1] : []));
      expect(vides).toHaveLength(2);
      expect(vides[0] + vides[1]).toBe(xs[0] + xs[xs.length - 1]);
    }
  });
});

describe('Le Cerf des sous-bois (DA, SC-2)', () => {
  it('porte ses bois au-dessus de la tête, trois pointes de chaque côté', () => {
    const cubes = GUARDIAN_CUBES['life-earth-sciences-6e-living-world'];
    const haut = Math.max(...cubes.map((c) => c.z));
    const pointes = (y: number) => {
      const xs = cubes.filter((c) => c.z === haut && c.y === y).map((c) => c.x).sort((a, b) => a - b);
      return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1).length;
    };
    const cotes = [...new Set(cubes.filter((c) => c.z === haut).map((c) => c.y))];
    expect(cotes).toHaveLength(2);
    for (const y of cotes) expect(pointes(y), `côté ${y}`).toBe(3);
  });
});
