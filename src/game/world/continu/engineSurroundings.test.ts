// Les abords de la scénette de la Turbine : rien de haut dans le tour de la caméra ni près de Kéo et de la machiniste, la
// roue dans le bief, le bief qui descend en marches jusqu'à la rivière, le carter couché de la ruine retiré (leur poids :
// ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { ENGINE_RING, ENGINE_SURROUNDINGS, engineRace, engineWheelHub } from './engineSurroundings';
import type { Facets } from './facets';
import { drawPieces } from './places';
import { placeById } from './plan6e';
import { scenetteHabitant, scenetteKeo, scenettePose, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('engine').at;
const habitant = scenetteHabitant('engine');
const pose = scenettePose('engine', { left: 490, right: 1024, top: 90, bottom: 640 }, 1024, 768).pose;
const target = pose.target;

const points = (f: Facets): { x: number; y: number; z: number }[] => {
  const out = [];
  for (let k = 0; k < f.positions.length; k += 3) out.push({ x: f.positions[k], y: f.positions[k + 1], z: f.positions[k + 2] });
  return out;
};

describe('Les abords de la Turbine', () => {
  it('ne changent pas d’un état à l’autre', () => {
    const f = scenetteSurroundings('engine');
    expect(scenetteSurroundings('engine', true, true).triangles).toBe(f.triangles);
    expect(scenetteSurroundings('engine', false, false).triangles).toBe(f.triangles);
  });

  it('tournent autour du point visé que la caméra de la scénette garde, à la distance dite', () => {
    expect(Math.hypot(pose.position.x - target.x, pose.position.z - target.z)).toBeCloseTo(ENGINE_RING, 0);
  });

  it('restent bas près de Kéo et de la machiniste, et sous la caméra partout dans son tour', () => {
    for (const p of points(scenetteSurroundings('engine'))) {
      const r = Math.hypot(p.x - target.x, p.z - target.z);
      // À moins de 10 du point visé, rien ne dépasse le sol de la scène : de tout angle, la vue sur Kéo reste dégagée.
      if (r < 10) expect(p.y).toBeLessThan(keo.y + 0.3);
      // Dans le tour de la caméra et un peu au-delà, tout passe sous elle d'au moins deux unités.
      if (r < ENGINE_RING + 3) expect(p.y).toBeLessThan(pose.position.y - 2);
    }
    expect(Math.abs(habitant.z - keo.z)).toBeLessThan(0.1);
  });

  it('mettent la roue dans le bief, son bas dans l’eau, entre la cabane et la berge sud', () => {
    const hub = engineWheelHub();
    const pool = engineRace().find((p) => (p.from.x - hub.x) * (p.to.x - hub.x) <= 0)!;
    expect(hub.y - ENGINE_SURROUNDINGS.wheel.r).toBeLessThan(pool.level + 0.1);
    const c = placeById('engine').center;
    expect(hub.z).toBeGreaterThan(c.z + ENGINE_SURROUNDINGS.house.z);
  });

  it('font descendre le bief en marches jusqu’à la rivière', () => {
    const pools = engineRace();
    for (let k = 1; k < pools.length; k++) expect(pools[k].level).toBeLessThan(pools[k - 1].level);
    expect(pools[pools.length - 1].level).toBeGreaterThan(0);
  });

  it('ne laissent plus le carter couché de la ruine au nord-est, qui bouchait la vue de dos', () => {
    // Ce qui gît dans la ruine, dans le repère du lieu : le carter couché s'étendait au nord-est du rotor couché.
    const ruin = points(drawPieces('engine', (p) => p.stage === 'ruine')).filter((p) => p.x > 4.5 && p.z < -2.6);
    expect(ruin).toHaveLength(0);
  });
});
