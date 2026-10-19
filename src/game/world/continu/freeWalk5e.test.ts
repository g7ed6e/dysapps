// La marche libre du 5e (GD-22, lot 2) : la même grille qu'au 6e, tirée du plan et du terrain du 5e, sur ses deux étages.
// Les chemins et les portes s'y marchent ; la falaise, non ; on ne monte au plateau que par la cabine de la Montée,
// reliée.
import { describe, expect, it } from 'vitest';
import { bridgeSite, clampToOpen } from './bridges';
import { buildWalkGrid, cellOf, freeRoute, isWalkable, nearestWalkable, onPathCell } from './freeWalk';
import { closestOnSegment, distance, type Vec2 } from './geometry';
import { landOf, linkedLands } from './lands';
import { planFor } from './levelPlan';
import { NETWORK_5E } from './paths5e';
import { buildHeightField5e, onPlateau, plateauShare } from './terrain5e';

const PLAN = planFor('5e');
const field = buildHeightField5e();
const grid = buildWalkGrid(field, PLAN);
const ALL_LINKED = linkedLands(PLAN);

/** Une case de la grille, en son centre. */
const centerOf = (k: number): Vec2 => {
  const i = k % grid.nx;
  return { x: grid.minX + (i + 0.5) * grid.cell, z: grid.minZ + ((k - i) / grid.nx + 0.5) * grid.cell };
};

describe('la marche libre du 5e', () => {
  it('a ses terres, et marche la porte de chaque lieu, dans sa terre', () => {
    expect(grid.lands).toEqual(PLAN.lands.map((l) => l.id));
    for (const pl of PLAN.places) {
      const door = NETWORK_5E.pathNode(pl.door).at;
      expect(onPathCell(grid, door), pl.id).toBe(true);
      expect(grid.lands[grid.land[cellOf(grid, door)]], pl.id).toBe(landOf(pl.id));
    }
  });

  it('une grille par terrain : celle du 6e n’est pas celle du 5e', () => {
    expect(buildWalkGrid(field, PLAN)).toBe(grid);
    expect(grid.lands).not.toContain('couchant');
  });

  it('ne marche pas la falaise, hors du rail de la cabine', () => {
    let cliff = 0;
    let walked = 0;
    for (let k = 0; k < grid.kind.length; k++) {
      const s = plateauShare(centerOf(k));
      if (s < 0.3 || s > 0.7) continue;
      cliff++;
      if (grid.kind[k] === 1) walked++;
    }
    expect(cliff).toBeGreaterThan(0);
    expect(walked).toBe(0);
  });

  it('le haut et le bas sont deux terres : le plateau est celle des Aiguilles', () => {
    for (const pl of PLAN.places.filter((p) => PLAN.upper.includes(p.id))) {
      const door = NETWORK_5E.pathNode(pl.door).at;
      expect(onPlateau(door), pl.id).toBe(true);
      expect(grid.lands[grid.land[cellOf(grid, door)]], pl.id).toBe('aiguilles');
    }
  });

  it('monte au plateau par la cabine reliée, et pas avant', () => {
    const start = NETWORK_5E.pathNode('port-quai').at;
    const top = NETWORK_5E.pathNode(PLAN.places.find((p) => p.id === 'semaphore')!.door).at;
    // Les Aiguilles fermées : le plateau ne se marche pas ; le plus proche endroit marchable, s'il y en a un assez près,
    // est en bas ; sinon le réseau mène Kéo au pied de la cabine (la vue le fait par `clampToOpen`), sans phrase d'échec.
    expect(isWalkable(grid, top, ['aiguilles'])).toBe(false);
    const near = nearestWalkable(grid, top, ['aiguilles']);
    expect(near === null || !onPlateau(near)).toBe(true);
    expect(clampToOpen(NETWORK_5E.snapToNetwork(top), ['aiguilles'], PLAN)).toBe(bridgeSite('aiguilles').stop);
    // Reliées : un trajet libre y mène, et il passe par la cabine (une de ses lignes droites passe près de son milieu).
    const route = freeRoute(grid, start, top, []);
    expect(route).not.toBeNull();
    const cabin = bridgeSite('aiguilles').mid;
    const pass = Math.min(...route!.slice(1).map((p, i) => distance(cabin, closestOnSegment(cabin, route![i], p).point)));
    expect(pass).toBeLessThan(2);
  });

  it('ne passe aucune terre fermée : tout fermé, le quai reste dans les Frondaisons', () => {
    const start = NETWORK_5E.pathNode('port-quai').at;
    for (const land of ALL_LINKED) {
      const far = NETWORK_5E.pathNode(PLAN.places.find((p) => landOf(p.id) === land)!.door).at;
      const route = freeRoute(grid, start, far, ALL_LINKED);
      if (route) for (const p of route) expect(grid.lands[grid.land[cellOf(grid, p)]]).not.toBe(land);
    }
  });
});
