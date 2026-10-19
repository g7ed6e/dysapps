// Les abords de la scénette des Archives : la maison de la copiste reste à l'est du muret du parvis et au sud du pan de
// roche (rien ne les traverse quand les abords du lieu sont posés), dans la moitié droite du cadre de départ ; rien de
// haut entre la caméra de départ et la scène (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { ARCHIVES_SURROUNDINGS, MURET_EAST } from './archivesSurroundings';
import { scenetteHabitant, scenetteKeo, scenetteStartYaw, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('archives').at;
const habitant = scenetteHabitant('archives');
// Le sol de la scène : Kéo et la copiste s'y tiennent, de part et d'autre de son milieu.
const floor = { x: (keo.x + habitant.x) / 2, y: keo.y, z: keo.z - 0.25 };
const target = { x: floor.x, z: floor.z + 0.3 };
const vertices = () => {
  const p = scenetteSurroundings('archives').positions;
  const out: [number, number, number][] = [];
  for (let k = 0; k < p.length; k += 3) out.push([p[k] - floor.x, p[k + 1] - floor.y, p[k + 2] - floor.z]);
  return out;
};

describe('les abords des Archives', () => {
  it('ne traversent ni le muret du parvis, ni le pan de roche de l’éperon', () => {
    for (const [x, y, z] of vertices()) {
      // Le muret : de part et d'autre du parvis, de 6,2 à 1,3 au nord du sol de la scène.
      if (z > -6.2 && z < -1.3 && y > -0.3) expect(Math.abs(x)).toBeGreaterThan(MURET_EAST + 0.05);
      // Le pan de roche de l'est : de 4,15 à 6,6 à l'est, au nord de sa face.
      if (z < -5.95 && x > 4.1) expect(x).toBeGreaterThan(6.6);
    }
  });

  it('ne dressent rien entre la caméra de départ et la scène', () => {
    const yaw = scenetteStartYaw('archives');
    const dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
    for (const [x, y, z] of vertices()) {
      const along = (x - (target.x - floor.x)) * dir.x + (z - (target.z - floor.z)) * dir.z;
      const across = (x - (target.x - floor.x)) * dir.z - (z - (target.z - floor.z)) * dir.x;
      if (along > 1.5 && Math.abs(across) < 6) expect(y).toBeLessThan(0.3);
    }
  });

  it('posent la maison à l’est de la façade, au sud du pan de roche, sa façade vers la scène', () => {
    const H = ARCHIVES_SURROUNDINGS.house;
    expect(H.dx).toBeGreaterThan(6);
    expect(H.dz).toBeGreaterThan(-5.95);
    expect(Math.sin(H.yaw)).toBeLessThan(0);
  });
});
