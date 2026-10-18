// Les abords de la scénette des Balises : ce qui est haut reste hors de l'anneau où la rangée des réponses se pose quand
// la caméra tourne, et hors du regard de la caméra de face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { BEACONS_SURROUNDINGS, RING } from './beaconsSurroundings';
import { scenetteHabitant, scenetteKeo, scenettePose, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('beacons').at;
const pilot = scenetteHabitant('beacons');
// Le sol de la scène : Kéo et le pilote s'y tiennent, sur la même ligne.
const floor = { x: (keo.x + pilot.x) / 2, y: keo.y, z: keo.z };
const target = { x: (keo.x + pilot.x) / 2, z: keo.z };
const camera = scenettePose('beacons', { left: 480, top: 0, right: 1024, bottom: 600 }, 1024, 768).pose.position;

const surroundings = () => scenetteSurroundings('beacons');

describe('les abords des Balises', () => {
  it('ne mettent rien de haut dans l’anneau de la rangée des réponses, ni entre Kéo et le pilote', () => {
    const p = surroundings().positions;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k + 1] <= floor.y + 0.15) continue;
      expect(Math.hypot(p[k] - target.x, p[k + 2] - target.z)).toBeGreaterThan(RING + 0.7);
    }
  });

  it('ne dressent rien devant la caméra de face, entre la scène et elle', () => {
    // Au sud de la scène, dans la bande que la caméra de face regarde : à ras du sol de la scène près d'elle, plus bas que
    // son regard plus loin (la caméra regarde vers le bas : ce qui est presque sous elle sort du cadre).
    expect(camera.z).toBeGreaterThan(floor.z + 10);
    const p = surroundings().positions;
    for (let k = 0; k < p.length; k += 3) {
      const [x, y, z] = [p[k], p[k + 1], p[k + 2]];
      if (Math.abs(x - target.x) > 4.5 || z < floor.z + 1.5 || z > camera.z) continue;
      expect(y).toBeLessThan(floor.y + (z < floor.z + 9 ? 0.3 : 1.0));
    }
  });

  it('posent le ponton et la cabane de guet à droite du cadre de face, vers le large, le voilier au-delà', () => {
    expect(BEACONS_SURROUNDINGS.pontoon.dx).toBeGreaterThan(pilot.x - floor.x);
    expect(BEACONS_SURROUNDINGS.hut.dz).toBeLessThan(-RING - 4);
    expect(BEACONS_SURROUNDINGS.sailboat.dz).toBeLessThan(BEACONS_SURROUNDINGS.hut.dz);
  });
});
