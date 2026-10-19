// Les abords de la scénette de l'Observatoire : le même poids dans chaque état, rien sur la dalle de la scène ni entre la
// caméra de face et elle, ce qui est haut derrière la tour, l'échafaudage hors du tambour. Leur poids : ./surroundings.test.ts.
// Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { Facets } from './facets';
import { OBSERVATORY_SCAFFOLD } from './observatorySurroundings';
import { OBSERVATORY } from './places';
import { placeById } from './plan6e';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';

const c = placeById('observatory').center;
const keo = scenetteKeo('observatory').at;
const habitant = scenetteHabitant('observatory');
/** Le sol de la scène : Kéo et la photographe s'y tiennent. */
const floor = keo.y;

const points = (f: Facets) => {
  const out: { x: number; y: number; z: number }[] = [];
  for (let k = 0; k < f.positions.length; k += 3) out.push({ x: f.positions[k], y: f.positions[k + 1], z: f.positions[k + 2] });
  return out;
};

describe('Les abords de l’Observatoire', () => {
  const f = scenetteSurroundings('observatory');

  it('gardent le même poids dans chaque état (sur la terrasse posée, ils montent de son épaisseur)', () => {
    for (const posed of [false, true]) for (const open of [false, true]) expect(scenetteSurroundings('observatory', open, posed).triangles).toBe(f.triangles);
    const low = points(scenetteSurroundings('observatory', false, false));
    const high = points(scenetteSurroundings('observatory', false, true));
    // Le pied de l'échafaudage, près du tambour : plus haut de l'épaisseur de la terrasse quand elle est posée.
    const near = low.findIndex((p) => Math.hypot(p.x - c.x, p.z - c.z) < 4.7 && Math.hypot(p.x - c.x, p.z - c.z) > 3.6);
    expect(near).toBeGreaterThanOrEqual(0);
    expect(high[near].y - low[near].y).toBeCloseTo(OBSERVATORY.terrace.top, 6);
  });

  it('ne posent rien sur la dalle de Kéo et de la photographe, ni rien de haut entre la caméra de face et eux', () => {
    const x0 = keo.x - 1.2,
      x1 = habitant.x + 1.2;
    for (const p of points(f)) {
      // La dalle (son bord sud à 1,5 au sud des pieds) : seul le sable du sentier de la porte en touche le bord.
      if (p.x > x0 && p.x < x1 && p.z > keo.z - 1.5 && p.z < keo.z + 0.9) expect(p.y).toBeLessThanOrEqual(floor + 0.02);
      // Au sud, jusqu'à la caméra de face : rien qui dépasse le sol de la scène.
      if (p.x > x0 && p.x < x1 && p.z >= keo.z + 0.9 && p.z < keo.z + 14) expect(p.y).toBeLessThan(floor + 0.1);
    }
  });

  it('tiennent ce qui est haut derrière la tour, au nord de son centre (l’échafaudage, la lunette, les lanternes du pont)', () => {
    for (const p of points(f)) if (p.y > floor + 1) expect(p.z).toBeLessThan(c.z + 0.5);
  });

  it('dressent l’échafaudage hors du tambour et de sa corniche, au nord-est, sous le haut du tambour posé et sa coupole', () => {
    const S = OBSERVATORY_SCAFFOLD;
    expect(S.inner).toBeGreaterThan(OBSERVATORY.cornice.r + 0.2);
    for (const deg of S.angles) expect(deg).toBeLessThan(0);
    expect(S.top).toBeLessThan(OBSERVATORY.drum.top + OBSERVATORY.dome.r);
  });
});
