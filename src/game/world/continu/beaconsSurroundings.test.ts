// Les abords de la scénette des Balises : ce qui est haut reste hors de l'anneau où la rangée des réponses se pose quand
// la caméra tourne, et hors du regard de la caméra de face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { BEACONS_SURROUNDINGS, CHANNEL_BUOYS, RING, SPARE_BUOY } from './beaconsSurroundings';
import { screenOf } from './camera';
import { questionLayout } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenettePose, scenetteSurroundings } from './scenette';

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

  it('n’offrent jamais plus de deux bouées dans le champ de face, ni rien en rang à compter (mission des nombres)', () => {
    const [w, h] = [1024, 768];
    const base = questionLayout({ count: 3 }, w, h);
    const stage = scenetteLayout({ count: 3 }, w, h, base).scenette!.stage;
    const { pose, shift } = scenettePose('beacons', stage, w, h);
    const look = { x: pose.target.x - pose.position.x, y: pose.target.y - pose.position.y, z: pose.target.z - pose.position.z };
    const seen = [...CHANNEL_BUOYS.map(([dx, dz]) => ({ x: floor.x + dx, y: 0, z: floor.z + dz })), { x: floor.x + SPARE_BUOY[0], y: floor.y, z: floor.z + SPARE_BUOY[1] }].filter((p) => {
      if ((p.x - pose.position.x) * look.x + (p.y - pose.position.y) * look.y + (p.z - pose.position.z) * look.z <= 0) return false;
      const q = screenOf(pose, p, w, h);
      return q.x - shift.x > 0 && q.x - shift.x < w && q.y - shift.y > 0 && q.y - shift.y < h;
    });
    expect(CHANNEL_BUOYS.length + 1).toBeLessThanOrEqual(3);
    expect(seen.length).toBeLessThanOrEqual(2);
    // Les deux bouées du chenal, loin l'une de l'autre : pas une paire qu'on lit d'un coup comme un groupe.
    const [a, c] = CHANNEL_BUOYS;
    expect(Math.hypot(a[0] - c[0], a[1] - c[1])).toBeGreaterThan(6);
  });
});
