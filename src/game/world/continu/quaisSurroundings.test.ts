// Les abords de la scénette des Quais : ce qui y est haut reste hors de l'anneau où la rangée des réponses se pose quand
// la caméra tourne, et hors du regard de la caméra de face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { QUAIS_SURROUNDINGS, RING } from './quaisSurroundings';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('quais').at;
const docker = scenetteHabitant('quais');
// Le sol de la scène : Kéo et le docker s'y tiennent, sur la même ligne.
const floor = { x: keo.x + 4, y: keo.y, z: keo.z };
const target = { x: (keo.x + docker.x) / 2, z: keo.z };

const surroundings = () => scenetteSurroundings('quais');

describe('les abords des Quais', () => {
  it('ne mettent rien de haut dans l’anneau de la rangée des réponses, ni entre Kéo et le docker', () => {
    const p = surroundings().positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 1] <= floor.y + 0.15) continue;
      expect(Math.hypot(p[k] - target.x, p[k + 2] - target.z)).toBeGreaterThan(RING + 0.7);
    }
  });

  it('ne dressent rien devant la caméra de face, entre la rangée et elle', () => {
    const p = surroundings().positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 2] < floor.z + 4 || p[k + 1] < 1.2) continue;
      expect(Math.abs(p[k] - target.x)).toBeGreaterThan(4.5);
    }
  });

  it('posent la maison au nord-est du quai, derrière Kéo et le docker', () => {
    expect(QUAIS_SURROUNDINGS.house.dx).toBeGreaterThan(0);
    expect(QUAIS_SURROUNDINGS.house.dz).toBeLessThan(-8);
  });
});
