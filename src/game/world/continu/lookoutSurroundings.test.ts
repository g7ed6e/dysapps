// Les abords de la scénette de la Vigie : rien de haut devant la caméra de face, la porte et la fenêtre du volet
// dégagées, l'échafaudage le temps du chantier seulement (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { LOOKOUT_SCAFFOLD } from './lookoutSurroundings';
import { placeById } from './plan6e';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';
import { sceneSpot } from './questionScene';
import { heightAt, standingHeight } from './terrain';

const tower = () => {
  const c = placeById('lookout').center;
  return { x: c.x, y: standingHeight(heightAt(c)), z: c.z };
};

/** Les sommets des abords, en (x, y, z). */
function vertices(posed: boolean): [number, number, number][] {
  const p = scenetteSurroundings('lookout', false, posed).positions;
  const out: [number, number, number][] = [];
  for (let k = 0; k < p.length; k += 3) out.push([p[k], p[k + 1], p[k + 2]]);
  return out;
}

describe('Les abords de la Vigie', () => {
  it('ne dressent rien entre la caméra de face et la scène (Kéo, le guetteur, la rangée des vitraux)', () => {
    const o = sceneSpot('lookout');
    const keo = scenetteKeo('lookout').at;
    const habitant = scenetteHabitant('lookout');
    const x0 = Math.min(keo.x, habitant.x) - 1.2,
      x1 = Math.max(keo.x, habitant.x) + 1.2;
    for (const posed of [false, true])
      for (const [x, y, z] of vertices(posed)) if (x > x0 && x < x1 && z > o.z + 1.4 && z < o.z + 16) expect(y).toBeLessThan(keo.y + 0.2);
  });

  it('laissent nus le pan sud de la tour, sa porte et la fenêtre du volet', () => {
    const t = tower();
    for (const [x, y, z] of vertices(false)) {
      const deg = (Math.atan2(z - t.z, x - t.x) * 180) / Math.PI;
      const r = Math.hypot(x - t.x, z - t.z);
      if (r < LOOKOUT_SCAFFOLD.outer + 0.2 && y > t.y + 0.3) expect(Math.abs(deg - 90)).toBeGreaterThan(30);
    }
  });

  it('dressent l’échafaudage tant que le haut de la tour n’est pas posé, plus ensuite', () => {
    const t = tower();
    const onGallery = (list: [number, number, number][]) =>
      list.filter(([x, y, z]) => {
        const r = Math.hypot(x - t.x, z - t.z);
        return r > LOOKOUT_SCAFFOLD.inner && r < LOOKOUT_SCAFFOLD.outer && y > t.y + LOOKOUT_SCAFFOLD.deck - 0.2;
      }).length;
    expect(onGallery(vertices(false))).toBeGreaterThan(100);
    expect(onGallery(vertices(true))).toBe(0);
  });
});
