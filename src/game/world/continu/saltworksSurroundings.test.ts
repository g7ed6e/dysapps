import { describe, expect, it } from 'vitest';
import { FacetBuilder } from './facets';
import { saltworksSurroundings } from './saltworksSurroundings';
import { scenetteHabitant, scenetteKeo } from './scenette';
import { sceneSpot } from './questionScene';

/** Le sol de la scène des Marais salants : le dessus du muret (scenette.ts, `saltLevee`). */
const floor = () => {
  const o = sceneSpot('saltworks');
  return { x: o.x, y: o.y + 0.35, z: o.z };
};

describe('Les abords des Marais salants', () => {
  const b = new FacetBuilder();
  saltworksSurroundings(b, floor(), { posed: true, open: false });
  const f = b.build();

  it('tiennent dans leur part du budget de la scénette', () => {
    expect(f.triangles).toBeGreaterThan(600);
    expect(f.triangles).toBeLessThanOrEqual(1500);
  });

  it('ne dressent rien entre la caméra de face et la scène (Kéo, la saunière, la rangée des réponses)', () => {
    const o = floor();
    const keo = scenetteKeo('saltworks').at;
    const habitant = scenetteHabitant('saltworks');
    // La bande où la caméra de face regarde la scène et la rangée : au sud du muret, entre Kéo et la saunière élargis.
    const x0 = Math.min(keo.x, habitant.x) - 1.2,
      x1 = Math.max(keo.x, habitant.x) + 1.2;
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
      if (x > x0 && x < x1 && z > o.z + 1.4 && z < o.z + 11) expect(y).toBeLessThan(o.y);
    }
  });
});
