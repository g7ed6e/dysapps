// Les abords de la Mangrove : ce qui y est haut reste hors de l'anneau autour de Kéo et de la botaniste, hors du regard
// de la caméra de face, et hors de l'emprise du lieu bâti (sa passerelle en coude, son carbet), qui peut se relever
// pendant la scénette (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { MANGROVE_SURROUNDINGS, RING } from './mangroveSurroundings';
import { placeById } from './plan6e';
import { MANGROVE } from './places';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('mangrove').at;
const botaniste = scenetteHabitant('mangrove');
const target = { x: (keo.x + botaniste.x) / 2, z: keo.z };
/** Le sol de la scène : le dessus du platelage, où se tiennent Kéo et la botaniste. */
const floorY = keo.y;
const c = placeById('mangrove').center;

function vertices(): [number, number, number][] {
  const p = scenetteSurroundings('mangrove').positions;
  const out: [number, number, number][] = [];
  for (let k = 0; k < p.length; k += 3) out.push([p[k], p[k + 1], p[k + 2]]);
  return out;
}

/** La distance d'un point (x, z) au segment de `a` à `b`, dans le repère du lieu. */
function toSegment(x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const [dx, dz] = [b.x - a.x, b.z - a.z];
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
}

describe('les abords de la Mangrove', () => {
  it('ne mettent rien de haut près de Kéo, de la botaniste et de la pirogue', () => {
    for (const [x, y, z] of vertices()) {
      if (y <= floorY + 0.15) continue;
      expect(Math.hypot(x - target.x, z - target.z)).toBeGreaterThan(RING + 0.7);
    }
  });

  it('ne dressent rien devant la caméra de face, entre la scène et elle', () => {
    for (const [x, y, z] of vertices()) {
      if (z < keo.z + 4 || y < 1.2) continue;
      expect(Math.abs(x - target.x)).toBeGreaterThan(4.5);
    }
  });

  it('laissent la place à la passerelle en coude et au carbet du lieu bâti', () => {
    const W = MANGROVE.walk;
    const K = MANGROVE.carbet;
    // La passerelle et ses pieux (à une demi-largeur et 0,1 de son axe, de section 0,14) ; le carbet et son toit.
    const reach = W.width / 2 + 0.1 + 0.07;
    for (const [wx, y, wz] of vertices()) {
      if (y < 0) continue;
      const [x, z] = [wx - c.x, wz - c.z];
      expect(Math.min(toSegment(x, z, W.start, W.knee), toSegment(x, z, W.knee, W.end))).toBeGreaterThan(reach);
      const inCarbet = Math.abs(x - K.x) < (K.w + 0.7) / 2 && Math.abs(z - K.z) < (K.d + 0.8) / 2;
      expect(inCarbet).toBe(false);
    }
  });

  it('posent la cabane au bout du ponton, dans la moitié droite du cadre de face, derrière la scène', () => {
    const { cabin, pontoon } = MANGROVE_SURROUNDINGS;
    expect(cabin.dx).toBeGreaterThan(0);
    expect(cabin.dz).toBeLessThan(-8);
    // Le perron de la cabane reçoit le bout du ponton.
    expect(Math.abs(pontoon.to.dx - cabin.dx)).toBeLessThan(cabin.width / 2);
    expect(pontoon.to.dz).toBeLessThan(cabin.dz + cabin.depth / 2 + 0.15 + cabin.porch + 0.2);
  });
});
