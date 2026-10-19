// Les abords du Chantier naval : rien de haut devant la caméra de face ni près de Kéo et du charpentier, la grue hors du
// cercle où la caméra tourne, le sable sur l'ombre peinte du lieu, la cale jusque sous l'eau (leur poids :
// ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { placeById } from './plan6e';
import { sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';
import { SHIPYARD_SURROUNDINGS, sandField } from './shipyardSurroundings';
import { SHADOW_DIR } from './sky';

const keo = scenetteKeo('shipyard').at;
const charpentier = scenetteHabitant('shipyard');
const floor = sceneSpot('shipyard');
const target = { x: (keo.x + charpentier.x) / 2, z: (keo.z + charpentier.z) / 2 };
const c = placeById('shipyard').center;
const f = scenetteSurroundings('shipyard');

describe('les abords du Chantier naval', () => {
  it('ne dressent rien devant la caméra de face, entre la scène et elle', () => {
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
      if (z > floor.z + 1.3 && Math.abs(x - target.x) < 4.5) expect(y).toBeLessThan(floor.y + 0.3);
    }
  });

  it('ne mettent rien de haut près de Kéo ni du charpentier', () => {
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
      if (y < floor.y + 0.3) continue;
      for (const p of [keo, charpentier]) expect(Math.hypot(x - p.x, z - p.z)).toBeGreaterThan(1.2);
    }
  });

  it('posent la grue hors du cercle où la caméra tourne autour de la scène', () => {
    const K = SHIPYARD_SURROUNDINGS.crane;
    expect(Math.hypot(c.x + K.x - target.x, c.z + K.z - target.z)).toBeGreaterThan(12);
  });

  it('couvrent de sable l’ombre peinte du lieu (rayon 4,5, allongée à l’opposé du soleil)', () => {
    const S = SHIPYARD_SURROUNDINGS.shadow;
    for (let a = 0; a < 2 * Math.PI; a += Math.PI / 12)
      for (const r of [0, 0.5, 1]) {
        const u = r * S.along * Math.cos(a),
          v = r * S.across * Math.sin(a);
        const [x, z] = [S.x + u * SHADOW_DIR.x - v * SHADOW_DIR.z, S.z + u * SHADOW_DIR.z + v * SHADOW_DIR.x];
        if (z > SHIPYARD_SURROUNDINGS.southEdge) continue;
        expect(sandField(x, z)).toBeLessThan(0);
      }
  });

  it('descendent la cale jusque sous l’eau', () => {
    let low = Infinity;
    for (let k = 1; k < f.positions.length; k += 3) low = Math.min(low, f.positions[k]);
    expect(low).toBeLessThan(-0.3);
  });
});
