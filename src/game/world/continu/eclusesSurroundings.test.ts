// Les abords de la scénette des Écluses : légers, bas dans le tour de la caméra, rien sous les pieds de Kéo et de
// l'éclusier ni devant le sas, le canal raccordé de chaque côté. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { eclusesSurroundings } from './eclusesSurroundings';
import { FacetBuilder, type Facets } from './facets';
import { LOCK, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo } from './scenette';

const floor = sceneSpot('ecluses');
const around = (open = false, posed = true): Facets => {
  const b = new FacetBuilder();
  eclusesSurroundings(b, floor, { open, posed });
  return b.build();
};

/** Les sommets des abords, depuis le milieu du sas. */
const points = (f: Facets): { dx: number; dy: number; dz: number }[] => {
  const out = [];
  for (let k = 0; k < f.positions.length; k += 3) out.push({ dx: f.positions[k] - floor.x, dy: f.positions[k + 1] - floor.y, dz: f.positions[k + 2] - floor.z });
  return out;
};

describe('Les abords des Écluses', () => {
  it('tiennent dans leur part du budget de la scénette, et ne changent pas d’un état à l’autre', () => {
    const f = around();
    expect(f.triangles).toBeGreaterThan(0);
    expect(f.triangles).toBeLessThanOrEqual(1500);
    expect(around(true, true).triangles).toBe(f.triangles);
    expect(around(false, false).triangles).toBe(f.triangles);
  });

  it('restent bas dans le tour de la caméra : ce qui est haut (sapins, maison) est plus loin qu’elle', () => {
    // La caméra de la scénette tourne à quelque 18,5 unités du sas, 9 au-dessus du sol de la scène.
    for (const p of points(around())) if (Math.hypot(p.dx, p.dz) < 20.5) expect(p.dy).toBeLessThan(2.5);
  });

  it('ne mettent rien sous les pieds de Kéo et de l’éclusier, ni devant le sas, au-dessus du sol de la scène', () => {
    const keo = scenetteKeo('ecluses').at, habitant = scenetteHabitant('ecluses');
    expect(keo.y).toBe(floor.y);
    for (const p of points(around())) {
      // Les dalles de la scène, entre le dos des dalles et le bord du canal (sa margelle au ras du sol).
      if (Math.abs(p.dx) <= 5.8 && p.dz > -0.8 && p.dz < LOCK.front - 0.3) expect(p.dy).toBeLessThanOrEqual(0.03);
    }
    expect(Math.abs(habitant.z - floor.z)).toBeLessThan(0.8);
  });

  it('raccordent le canal de chaque côté : la voûte à l’ouest, la porte d’aval à l’est', () => {
    const pts = points(around());
    const inCanal = (p: { dz: number }) => p.dz > LOCK.front && p.dz < LOCK.back;
    expect(pts.some((p) => inCanal(p) && p.dx < -LOCK.reach + 0.1 && p.dy > 1)).toBe(true);
    expect(pts.some((p) => inCanal(p) && p.dx > LOCK.reach - 0.5 && p.dy > 0.2)).toBe(true);
  });
});
