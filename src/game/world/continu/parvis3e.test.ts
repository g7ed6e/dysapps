// Les parures de l'aéronef du 3e (GD-25) : chacune se dessine seule, dans l'ordre ; la tête de baleine (règle des
// parures, § 6) est plus large que haute, en bronze chaud, sans vert, et tient avec les deux autres dans les 300
// triangles du poste.
import { describe, expect, it } from 'vitest';
import { NEF_PARURES, nefParuresFacets, nefParuresLocal } from './parvis3e';

/** Les couleurs (sRVB, 0 à 255) des sommets d'un dessin, ramenées du linéaire. */
function colorsOf(f: { colors: Float32Array }): Set<string> {
  const toSrgb = (c: number) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  const out = new Set<string>();
  for (let i = 0; i < f.colors.length; i += 3) out.add([f.colors[i], f.colors[i + 1], f.colors[i + 2]].map(toSrgb).join(','));
  return out;
}

describe('les parures de l’aéronef (GD-25)', () => {
  it('rien de posé, rien de dessiné ; chaque parure s’ajoute aux précédentes', () => {
    expect(nefParuresLocal([]).triangles).toBe(0);
    const counts = [1, 2, 3].map((n) => nefParuresLocal(NEF_PARURES.slice(0, n)).triangles);
    expect(counts[0]).toBeGreaterThan(0);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(nefParuresFacets(NEF_PARURES).triangles).toBe(counts[2]);
  });

  it('les trois tiennent dans les 300 triangles du poste, la tête dans environ 120', () => {
    const head = nefParuresLocal(['proue']).triangles;
    expect(head).toBeGreaterThanOrEqual(80);
    expect(head).toBeLessThanOrEqual(130);
    expect(nefParuresLocal(NEF_PARURES).triangles).toBeLessThanOrEqual(300);
  });

  it('la tête est plus large que haute, son dessus au bastingage à un dixième près, son museau 0,9 devant l’étrave', () => {
    const p = nefParuresLocal(['proue']).positions;
    const span = (k: number) => {
      let lo = Infinity,
        hi = -Infinity;
      for (let i = k; i < p.length; i += 3) {
        lo = Math.min(lo, p[i]);
        hi = Math.max(hi, p[i]);
      }
      return { lo, hi, size: hi - lo };
    };
    const [x, y, z] = [span(0), span(1), span(2)];
    expect(x.size / y.size).toBeGreaterThan(1.25);
    expect(x.size / y.size).toBeLessThan(1.6);
    expect(Math.abs(y.hi - 0.87)).toBeLessThanOrEqual(0.1);
    expect(z.size).toBeCloseTo(0.95, 1);
  });

  it('la tête est en bronze chaud (corps, soleil, ombre), sans vert ni autre teinte', () => {
    expect([...colorsOf(nefParuresLocal(['proue']))].sort()).toEqual(['138,91,44', '180,126,62', '204,151,87']);
  });
});
