// Le port des Ferrailleurs (le Cirque du 3e, GD-25 ; relecture du Cirque, correction 2) : une silhouette basse et large,
// qui se lit comme un port et jamais comme un second phare ; sa lumière éteinte d'un gris-bleu sombre, allumée d'ocre.
import { describe, expect, it } from 'vitest';
import { FacetBuilder, type Facets } from './facets';
import { FERRAILLEURS_PORT_3E, PORT_LAMP_OFF_3E, ferrailleursPort3e } from './ferrailleurs3e';
import { distance, linearRgb } from './geometry';
import { C3E } from './place3eKit';
import { PLACES_3E } from './plan3e';

function port(lit: boolean): Facets {
  const b = new FacetBuilder();
  ferrailleursPort3e(b, lit);
  return b.build();
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Le port des Ferrailleurs', () => {
  it('est bas et large : plus de trois fois plus large que haut, rien au-dessus de 11 unités', () => {
    const f = port(true);
    let x0 = Infinity, x1 = -Infinity, top = -Infinity;
    for (let i = 0; i < f.positions.length; i += 3) {
      x0 = Math.min(x0, f.positions[i]);
      x1 = Math.max(x1, f.positions[i]);
      top = Math.max(top, f.positions[i + 1]);
    }
    expect(top).toBeLessThan(11);
    expect(x1 - x0).toBeGreaterThan(3 * top);
  });

  it('est loin au nord du Fanal, au-delà de 200 unités', () => {
    const fanal = PLACES_3E.find((p) => p.id === 'fanal')!;
    expect(FERRAILLEURS_PORT_3E.at.z).toBeLessThan(fanal.center.z - 180);
    expect(distance(FERRAILLEURS_PORT_3E.at, fanal.center)).toBeGreaterThan(200);
  });

  it('a une seule lumière : éteinte gris-bleu sombre, allumée d’ocre', () => {
    const off = port(false);
    const on = port(true);
    expect(countColor(off, C3E.lantern)).toBe(0);
    expect(countColor(off, PORT_LAMP_OFF_3E)).toBeGreaterThan(0);
    expect(countColor(on, PORT_LAMP_OFF_3E)).toBe(0);
    expect(countColor(on, C3E.lantern)).toBe(countColor(off, PORT_LAMP_OFF_3E));
    expect(on.triangles).toBeLessThan(240);
  });
});
