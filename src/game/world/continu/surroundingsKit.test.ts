// Le kit commun des abords : une facette tournée vers une normale ou à l'opposé d'un point, quel que soit l'ordre de ses
// sommets ; le sapin, ses triangles et son pied. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FacetBuilder, type Facets } from './facets';
import { fir, groundAt, quadToward, triangleToward, type P3 } from './surroundingsKit';

/** La normale du premier triangle. */
const normal = (f: Facets): number[] => [f.normals[0], f.normals[1], f.normals[2]];

const one = (draw: (b: FacetBuilder) => void): Facets => {
  const b = new FacetBuilder();
  draw(b);
  return b.build();
};

describe('surroundingsKit, quadToward et triangleToward', () => {
  const square: [P3, P3, P3, P3] = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
  ];
  const reversed: [P3, P3, P3, P3] = [square[3], square[2], square[1], square[0]];

  it('tourne un quadrilatère vers la normale demandée, dans les deux sens de ses sommets', () => {
    for (const q of [square, reversed]) {
      const up = one((b) => quadToward(b, q, { normal: [0, 1, 0] }, 0xffffff));
      const down = one((b) => quadToward(b, q, { normal: [0, -1, 0] }, 0xffffff));
      expect(up.triangles).toBe(2);
      for (let k = 0; k < 6; k++) expect(up.normals[k * 3 + 1]).toBeCloseTo(1);
      for (let k = 0; k < 6; k++) expect(down.normals[k * 3 + 1]).toBeCloseTo(-1);
    }
  });

  it('tourne un triangle vers une normale ou à l’opposé d’un point', () => {
    const a: P3 = [0, 0, 0],
      c: P3 = [1, 0, 0],
      d: P3 = [0, 1, 0];
    for (const [p, q, r] of [
      [a, c, d],
      [a, d, c],
    ] as const) {
      expect(normal(one((b) => triangleToward(b, p, q, r, { normal: [0, 0, 1] }, 0xffffff)))[2]).toBeCloseTo(1);
      expect(normal(one((b) => triangleToward(b, p, q, r, { normal: [0, 0, -1] }, 0xffffff)))[2]).toBeCloseTo(-1);
      // Le cœur du volume derrière la facette (z < 0) : elle regarde vers +z ; devant, vers −z.
      expect(normal(one((b) => triangleToward(b, p, q, r, { awayFrom: [0.2, 0.2, -1] }, 0xffffff)))[2]).toBeCloseTo(1);
      expect(normal(one((b) => triangleToward(b, p, q, r, { awayFrom: [0.2, 0.2, 1] }, 0xffffff)))[2]).toBeCloseTo(-1);
    }
  });

  it('tourne un quadrilatère à l’opposé du cœur de son volume', () => {
    const f = one((b) => quadToward(b, square, { awayFrom: [0.5, 2, 0.5] }, 0xffffff));
    expect(normal(f)[1]).toBeCloseTo(-1);
  });
});

describe('surroundingsKit, fir', () => {
  it('pose un sapin de 30 triangles, son pied enfoncé de `sink` dans le sol du monde', () => {
    const [x, z] = [3, -2];
    const f = one((b) => fir(b, x, z, 1.4, 0.3, 0.15));
    expect(f.triangles).toBe(30);
    let low = Infinity;
    for (let k = 1; k < f.positions.length; k += 3) low = Math.min(low, f.positions[k]);
    expect(low).toBeCloseTo(groundAt(x, z, 0.15));
  });
});
