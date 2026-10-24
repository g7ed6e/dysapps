// Les morceaux d'un ruban de chemin réunis (./paths.ts, `joinRun`) : seulement d'un seul tenant, de même nature, et
// quand tous leurs points intérieurs sont sur la droite qui joint leurs bouts ; le ruban réuni passe par les mêmes points.
import { describe, expect, it } from 'vitest';
import { joinRun } from './paths';

const run = (n: number, deck = false): [number, number, boolean][] => Array.from({ length: n }, (_, k) => [k, k + 1, deck]);

describe('joinRun', () => {
  it('réunit un ruban droit sur un sol plat ou d’une pente égale', () => {
    expect(joinRun(run(5), () => 2)).toEqual([[0, 5, false]]);
    expect(joinRun(run(5), (d) => 0.3 * d + 1)).toEqual([[0, 5, false]]);
  });

  it('garde les morceaux là où le sol plie, jamais une dérive de proche en proche', () => {
    expect(joinRun(run(4), (d) => (d <= 2 ? 0 : d - 2))).toEqual([
      [0, 2, false],
      [2, 4, false],
    ]);
    // Une courbe douce : chaque point presque sur la droite de son voisin, pas sur celle du morceau entier.
    const joined = joinRun(run(40), (d) => 1e-5 * d * d);
    for (const [a, c] of joined) for (let d = a + 1; d < c; d++) expect(Math.abs(1e-5 * d * d - (1e-5 * a * a + ((1e-5 * (c * c - a * a)) * (d - a)) / (c - a)))).toBeLessThan(1e-4);
    expect(joined.length).toBeGreaterThan(1);
  });

  it('ne réunit ni le bois et le sable, ni deux morceaux séparés', () => {
    expect(joinRun([[0, 1, false], [1, 2, true], [2, 3, true]], () => 0)).toEqual([
      [0, 1, false],
      [1, 3, true],
    ]);
    expect(joinRun([[0, 1, false], [1.5, 2, false]], () => 0)).toEqual([
      [0, 1, false],
      [1.5, 2, false],
    ]);
  });
});
