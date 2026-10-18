// Les abords de la Gare maritime : ce qui y est haut reste hors de l'anneau où la rangée des réponses se pose quand la
// caméra tourne, et hors du regard de la caméra de face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FERRY_SURROUNDINGS, RING } from './ferrySurroundings';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('ferry').at;
const chef = scenetteHabitant('ferry');
// Le point visé : entre Kéo et le chef de gare, sur la même ligne.
const target = { x: (keo.x + chef.x) / 2, z: keo.z };

describe('les abords de la Gare maritime', () => {
  const f = scenetteSurroundings('ferry');

  it('ne mettent rien de haut dans l’anneau de la rangée des réponses, ni entre Kéo et le chef de gare', () => {
    const p = f.positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 1] <= keo.y + 0.15) continue;
      expect(Math.hypot(p[k] - target.x, p[k + 2] - target.z)).toBeGreaterThan(RING + 0.7);
    }
  });

  it('ne dressent rien devant la caméra de face, entre la rangée et elle', () => {
    const p = f.positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 2] < keo.z + 4 || p[k + 1] < 1.2) continue;
      expect(Math.abs(p[k] - target.x)).toBeGreaterThan(4.5);
    }
  });

  it('posent la gare, le bac et l’îlot à la croix au nord, derrière la scène, la gare et le débarcadère à droite', () => {
    const { station, bac, cross, landing } = FERRY_SURROUNDINGS;
    expect(station.dx).toBeGreaterThan(0);
    expect(landing.dx).toBeGreaterThan(station.dx);
    for (const dz of [station.dz, bac.dz, cross.dz]) expect(dz).toBeLessThan(-8);
    expect(cross.dz).toBeLessThan(bac.dz);
  });
});
