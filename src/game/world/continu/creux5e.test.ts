// Le Creux (GD-22, lot 6) : le premier Détour du 5e, un palétuvier géant creusé à son pied, sa lanterne allumée, sa
// sente. Sa place (loin des chemins, des lieux et de l'eau), sa sente marchable et lisible, son coût. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { KEO_HEIGHT } from './camera';
import { CREUX, CREUX_ARCH_HEIGHT, SENTE_5E, creuxFacets, creuxTriangles } from './creux5e';
import { DETOURS_5E, detourAtPoint, detourById } from './detours';
import { buildWalkGrid, cellOf, freeRoute, isWalkable } from './freeWalk';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { planFor } from './levelPlan';
import { routeLength } from './paths';
import { COLORS_5E, CREUX_5E, PATH_EDGES_5E, PATH_NODES_5E } from './plan5e';
import { buildHeightField5e, channelClearance, landDistance5e } from './terrain5e';

const PLAN = planFor('5e');
const nodes = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
const pathDistance = (p: { x: number; z: number }) => Math.min(...PATH_EDGES_5E.map(([a, b]) => distanceToPolyline(p, [nodes.get(a)!, nodes.get(b)!])));

const lum = (c: number) => {
  const [r, g, b] = linearRgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('Le Creux, premier Détour du 5e', () => {
  it('est le seul Détour du 5e, aux Frondaisons, avec son nom ; il se reconnaît sur son seuil, au 5e seulement', () => {
    expect(DETOURS_5E).toEqual([CREUX]);
    expect(detourById('creux')).toBe(CREUX);
    expect(CREUX.land).toBe('frondaisons');
    expect(CREUX.name).toBe('Le Creux');
    expect(detourAtPoint(CREUX_5E.threshold, '5e')?.id).toBe('creux');
    expect(detourAtPoint(CREUX_5E.threshold)).toBeNull();
    expect(detourAtPoint(CREUX_5E.start, '5e')).toBeNull();
  });

  it('se tient à l’écart : loin des chemins, des lieux et de l’eau', () => {
    expect(pathDistance(CREUX_5E.center)).toBeGreaterThan(10);
    for (const p of PLAN.places) expect(distance(CREUX_5E.center, p.center), p.id).toBeGreaterThan(25);
    expect(landDistance5e(CREUX_5E.center)).toBeGreaterThan(6);
    expect(channelClearance(CREUX_5E.center)).toBeGreaterThan(6);
  });

  it('sa sente part du chemin et se marche jusqu’au seuil, au pied de l’arche', () => {
    const grid = buildWalkGrid(buildHeightField5e(), PLAN);
    const [a, b] = CREUX_5E.sente;
    expect(pathDistance(a)).toBeLessThan(0.2);
    const n = Math.ceil(distance(a, b) / 0.5);
    for (let k = 0; k <= n; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n };
      expect(isWalkable(grid, p, []), `${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBe(true);
    }
    const route = freeRoute(grid, a, b, []);
    expect(route).not.toBeNull();
    expect(routeLength(route!)).toBeLessThan(distance(a, b) * 1.3 + 1);
    expect(grid.lands[grid.land[cellOf(grid, b)]]).toBe('frondaisons');
  });

  it('dessine sa sente en pointillé, lisible sur la mousse (3:1 au moins), une fois trouvé seulement', () => {
    expect(contrast(SENTE_5E.color, COLORS_5E.moss)).toBeGreaterThanOrEqual(3);
    expect(contrast(SENTE_5E.color, COLORS_5E.mossShade)).toBeGreaterThanOrEqual(3);
    expect(creuxFacets(true).triangles).toBeGreaterThan(creuxFacets(false).triangles);
  });

  it('son arche fait deux fois Kéo à peu près ; sa lanterne brille dès le départ ; 175 triangles au plus, sente comprise', () => {
    expect(CREUX_ARCH_HEIGHT).toBeGreaterThan(1.8 * KEO_HEIGHT);
    const [r, g, b] = linearRgb(COLORS_5E.lantern);
    const f = creuxFacets(false);
    let lit = 0;
    for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) lit++;
    expect(lit).toBeGreaterThan(0);
    expect(creuxTriangles().withSente).toBeLessThanOrEqual(175);
  });
});
