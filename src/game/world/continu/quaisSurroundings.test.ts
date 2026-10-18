// Les abords de la scénette des Quais : leur poids en triangles, et ce qui y est haut reste hors de l'anneau où la
// rangée des réponses se pose quand la caméra tourne, et hors du regard de la caméra de face. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FacetBuilder } from './facets';
import { QUAIS_SURROUNDINGS, RING, quaisSurroundings } from './quaisSurroundings';
import { scenetteHabitant, scenetteKeo } from './scenette';

const keo = scenetteKeo('quais').at;
const docker = scenetteHabitant('quais');
// Le sol de la scène : Kéo et le docker s'y tiennent, sur la même ligne.
const floor = { x: keo.x + 4, y: keo.y, z: keo.z };
const target = { x: (keo.x + docker.x) / 2, z: keo.z };

function surroundings() {
  const b = new FacetBuilder();
  quaisSurroundings(b, floor, { open: false, posed: true });
  return b.build();
}

describe('les abords des Quais', () => {
  it('tiennent dans leur part du budget de la scénette', () => {
    const f = surroundings();
    expect(f.triangles).toBeGreaterThan(800);
    expect(f.triangles).toBeLessThanOrEqual(1300);
  });

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
