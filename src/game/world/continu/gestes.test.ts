// Le geste du métier (GD-27, lot 5, piste A « l'outil qui travaille ») : le kit du directeur artistique (deux pièces,
// 60 triangles au plus, aplats jamais presque-noirs), l'outil de chaque habitant à sa droite, à hauteur de main, jamais
// à travers son corps ni sous le sol, petit à l'écran dans le regard d'arrivée (référent dys), un seul habitant actif à
// la fois (le plus proche, qui garde la main à la limite), un mouvement doux qui part du repos et y revient, bien sous
// trois variations par seconde, et le budget : un maillage par niveau, sous l'enveloppe.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGETS, openWorldCost, openWorldCost3e, openWorldCost4e, openWorldCost5e, worldGestesCost } from './budget';
import { COMMON_DETOUR_VIEW, followPose, lookUp, occlusionLift, screenOf } from './camera';
import { doorOf } from './construction';
import { FacetBuilder } from './facets';
import { linearRgb } from './geometry';
import { GESTE_CYCLE, GESTE_REACH, GESTE_SLACK, GESTE_TRIANGLES, TOOL_KIT, TOOL_OF, activeGeste, gesteCandidates, gestePhase, gesteToolOf, moveMobile, worldGestes, type MobilePiece } from './gestes';
import { OPEN_WORLD_LEVELS, hasScenette, levelOfPlace, planFor, type OpenWorldLevel, type ScenePlaceId } from './levelPlan';
import { levelWorld } from './levelWorld';
import { arrivalViewOf, doorViewOf } from './northShore';
import { modelOfPlace } from './places';
import { WORLD_HABITANTS_PER_LEVEL_MAX, hasWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantYaw } from './worldHabitants';

const SCREEN = { width: 1180, height: 820 } as const;

const grounds = new Map<OpenWorldLevel, (x: number, z: number) => number>();
function groundOf(level: OpenWorldLevel): (x: number, z: number) => number {
  let g = grounds.get(level);
  if (!g) {
    const world = levelWorld(level);
    grounds.set(level, (g = world.ground(world.field())));
  }
  return g;
}

/** Le regard d'arrivée de « Y aller », le plus près que la caméra se pose de l'habitant (worldHabitants.test.ts). */
function arrivalPose(place: ScenePlaceId, ground: (x: number, z: number) => number) {
  const p = planFor(levelOfPlace(place)).places.find((q) => q.id === place)!;
  const door = doorOf(place);
  const feet = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const view = doorViewOf(place);
  const a = arrivalViewOf(place);
  const pose = followPose(feet, occlusionLift(feet, ground, view), undefined, view, a ? 1 : 0, undefined, a ? { height: 0, back: a.back } : COMMON_DETOUR_VIEW);
  if (a) lookUp(pose, { x: p.center.x + a.look.x, y: ground(p.center.x, p.center.z) + (a.top ?? modelOfPlace(place).top), z: p.center.z + a.look.z }, feet, 1, SCREEN.height);
  return pose;
}

const toolPlaces = (level: OpenWorldLevel) => planFor(level).places.map((p) => p.id).filter((id): id is ScenePlaceId => hasWorldHabitant(id) && Boolean(TOOL_OF[id]));

describe('le kit du directeur artistique', () => {
  const kinds = Object.keys(TOOL_KIT) as (keyof typeof TOOL_KIT)[];

  it('quatorze formes et leurs variantes, deux pièces, de 20 à 60 triangles, des aplats jamais presque-noirs', () => {
    expect(kinds.length).toBeGreaterThanOrEqual(14);
    const floor = linearRgb(0x5a4a3a).reduce((s, c) => s + c, 0);
    for (const kind of kinds) {
      const tool = TOOL_KIT[kind]();
      const fixed = new FacetBuilder();
      tool.fixed(fixed);
      const mobile = new FacetBuilder();
      tool.mobile(mobile);
      const f = fixed.build(), m = mobile.build();
      expect(m.triangles, kind).toBeGreaterThan(0);
      expect(f.triangles + m.triangles, kind).toBeGreaterThanOrEqual(20);
      expect(f.triangles + m.triangles, kind).toBeLessThanOrEqual(GESTE_TRIANGLES);
      for (const p of [f, m]) for (let k = 0; k < p.colors.length; k += 3) expect(p.colors[k] + p.colors[k + 1] + p.colors[k + 2], kind).toBeGreaterThanOrEqual(floor - 1e-6);
      // Le pivot est sur la pièce mobile ou tout près (une main, un moyeu) : dans sa boîte, élargie d'un peu.
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (let k = 0; k < m.positions.length; k++) {
        lo[k % 3] = Math.min(lo[k % 3], m.positions[k]);
        hi[k % 3] = Math.max(hi[k % 3], m.positions[k]);
      }
      for (const [i, c] of [tool.pivot.x, tool.pivot.y, tool.pivot.z].entries()) {
        expect(c, kind).toBeGreaterThanOrEqual(lo[i] - 0.3);
        expect(c, kind).toBeLessThanOrEqual(hi[i] + 0.3);
      }
      // Une amplitude modérée (référent dys) : au plus 40° ou 0,5 unité.
      expect(Math.abs(tool.amplitude), kind).toBeLessThanOrEqual((40 * Math.PI) / 180 + 1e-9);
      if (tool.shift) expect(Math.hypot(tool.shift.x, tool.shift.y, tool.shift.z), kind).toBeLessThanOrEqual(0.5);
    }
  });

  it('chaque outil est à la droite de l’habitant, à hauteur de main, jamais à travers son corps ni sous ses pieds', () => {
    for (const kind of kinds) {
      const tool = TOOL_KIT[kind]();
      const b = new FacetBuilder();
      tool.fixed(b);
      tool.mobile(b);
      const f = b.build();
      let minX = Infinity, minY = Infinity, maxY = -Infinity;
      for (let k = 0; k < f.positions.length; k += 3) {
        minX = Math.min(minX, f.positions[k]);
        minY = Math.min(minY, f.positions[k + 1]);
        maxY = Math.max(maxY, f.positions[k + 1]);
      }
      expect(minX, kind).toBeGreaterThanOrEqual(0.25);
      expect(minY, kind).toBeGreaterThanOrEqual(-0.2);
      expect(maxY, kind).toBeLessThanOrEqual(3.2);
      // Le pivot à hauteur de main ou de support, au-dessus du sol.
      expect(tool.pivot.y, kind).toBeGreaterThan(0.4);
    }
  });
});

describe('les outils des habitants', () => {
  it('soixante-deux habitants ont un outil du kit : chacun un lieu à scénette, avec un habitant près de sa porte', () => {
    const places = Object.keys(TOOL_OF) as ScenePlaceId[];
    expect(places.length).toBe(62);
    for (const p of places) {
      expect(hasScenette(p), p).toBe(true);
      expect(hasWorldHabitant(p), p).toBe(true);
      expect(gesteToolOf(p), p).not.toBeNull();
    }
  });

  for (const level of OPEN_WORLD_LEVELS)
    describe(level, () => {
      const ground = groundOf(level);
      const places = toolPlaces(level);

      it('un seul maillage, au plus 60 triangles par outil, une pièce mobile par habitant, dans l’ordre du niveau', () => {
        const g = worldGestes(planFor(level).places.map((p) => p.id), ground);
        expect(g.mobiles.map((m) => m.place)).toEqual(places);
        expect(g.facets.triangles).toBeLessThanOrEqual(places.length * GESTE_TRIANGLES);
        expect(places.length).toBeLessThanOrEqual(WORLD_HABITANTS_PER_LEVEL_MAX);
        let end = 0;
        for (const m of g.mobiles) {
          expect(m.start).toBeGreaterThanOrEqual(end);
          end = m.start + m.count;
          expect(m.count % 3).toBe(0);
          expect(Math.hypot(m.axis.x, m.axis.y, m.axis.z)).toBeCloseTo(1, 6);
        }
        expect(end).toBeLessThanOrEqual(g.facets.positions.length / 3);
      });

      it('dans la ruine, ni outil ni support', () => {
        const g = worldGestes(planFor(level).places.map((p) => p.id), ground, () => false);
        expect(g.facets.triangles).toBe(0);
        expect(g.mobiles).toEqual([]);
      });

      it('à la droite de l’habitant, à côté de lui, sur le sol, à sa taille, petit à l’écran dans le regard d’arrivée', () => {
        for (const place of places) {
          const g = worldGestes([place], ground);
          const at = worldHabitantAt(place, ground)!;
          const yaw = worldHabitantYaw(place);
          const h = worldHabitantHeight(place);
          const pose = arrivalPose(place, ground);
          let sx0 = Infinity, sx1 = -Infinity, sy0 = Infinity, sy1 = -Infinity;
          for (let k = 0; k < g.facets.positions.length; k += 3) {
            const dx = g.facets.positions[k] - at.x, dy = g.facets.positions[k + 1] - at.y, dz = g.facets.positions[k + 2] - at.z;
            // Dans le repère de l'habitant : x vers sa gauche, z devant lui.
            const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
            expect(lx, place).toBeLessThanOrEqual(-0.2 * (h / 3.5));
            expect(dy, place).toBeGreaterThanOrEqual(-0.25);
            expect(dy, place).toBeLessThanOrEqual(h);
            const s = screenOf(pose, { x: g.facets.positions[k], y: g.facets.positions[k + 1], z: g.facets.positions[k + 2] }, SCREEN.width, SCREEN.height);
            sx0 = Math.min(sx0, s.x);
            sx1 = Math.max(sx1, s.x);
            sy0 = Math.min(sy0, s.y);
            sy1 = Math.max(sy1, s.y);
          }
          // Au plus un quart de la hauteur de l'écran, un sixième de sa largeur (référent dys : petit, loin de l'œil).
          expect(sy1 - sy0, place).toBeLessThanOrEqual(SCREEN.height / 4);
          expect(sx1 - sx0, place).toBeLessThanOrEqual(SCREEN.width / 6);
        }
      });

      it('compté au budget : un maillage, sous l’enveloppe du niveau hors scénette, rien pendant une scénette', () => {
        expect(worldGestesCost(level)).toEqual({ triangles: places.length * GESTE_TRIANGLES, calls: 1 });
        const views = level === '6e' ? [openWorldCost(0, 'monde')] : level === '5e' ? [openWorldCost5e('monde'), openWorldCost5e('depart')] : level === '4e' ? [openWorldCost4e('monde'), openWorldCost4e('depart')] : [openWorldCost3e('monde'), openWorldCost3e('depart')];
        const scenette = level === '6e' ? openWorldCost(0) : level === '5e' ? openWorldCost5e('scenette') : level === '4e' ? openWorldCost4e('scenette') : openWorldCost3e('scenette');
        expect(scenette.some((c) => c.poste === 'gestes')).toBe(false);
        for (const v of views) {
          expect(v.find((c) => c.poste === 'gestes')).toEqual({ poste: 'gestes', ...worldGestesCost(level) });
          expect(v.reduce((s, c) => s + c.triangles, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS[level].triangles);
          expect(v.reduce((s, c) => s + c.calls, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS[level].calls);
        }
      });
    });
});

describe('le mouvement', () => {
  it('part du repos, va au bout à mi-cycle, revient, en douceur : une seule variation par cycle de quatre secondes', () => {
    expect(gestePhase(0)).toBeCloseTo(0, 9);
    expect(gestePhase(GESTE_CYCLE / 2)).toBeCloseTo(1, 9);
    expect(gestePhase(GESTE_CYCLE)).toBeCloseTo(0, 9);
    expect(GESTE_CYCLE).toBeGreaterThanOrEqual(2);
    // Lent au départ et à l'arrivée : moins d'un centième au premier dixième de seconde.
    expect(gestePhase(0.1)).toBeLessThan(0.01);
    expect(1 - gestePhase(GESTE_CYCLE / 2 - 0.1)).toBeLessThan(0.01);
    for (let t = 0; t <= GESTE_CYCLE; t += 0.05) expect(gestePhase(t)).toBeGreaterThanOrEqual(-1e-9);
  });

  it('la pièce mobile tourne autour de son pivot : au repos elle est le maillage bâti, au bout elle est tournée de l’amplitude, les autres sommets intacts', () => {
    const ground = groundOf('6e');
    const g = worldGestes(['shipyard', 'phare'], ground);
    const rest = g.facets.positions;
    const out = rest.slice();
    const m = g.mobiles[0];
    moveMobile(rest, out, m, 0);
    expect(out).toEqual(rest);
    moveMobile(rest, out, m, 1);
    for (let k = 0; k < rest.length; k += 3) {
      const inside = k >= m.start * 3 && k < (m.start + m.count) * 3;
      const r0 = Math.hypot(rest[k] - m.pivot.x, rest[k + 1] - m.pivot.y, rest[k + 2] - m.pivot.z);
      const r1 = Math.hypot(out[k] - m.pivot.x, out[k + 1] - m.pivot.y, out[k + 2] - m.pivot.z);
      if (inside) expect(r1).toBeCloseTo(r0, 4);
      else expect([out[k], out[k + 1], out[k + 2]]).toEqual([rest[k], rest[k + 1], rest[k + 2]]);
    }
    // La tête du marteau monte (le point le plus haut de la pièce mobile est plus haut au bout qu'au repos).
    let top0 = -Infinity, top1 = -Infinity;
    for (let k = m.start * 3; k < (m.start + m.count) * 3; k += 3) {
      top0 = Math.max(top0, rest[k + 1]);
      top1 = Math.max(top1, out[k + 1]);
    }
    expect(top1).toBeGreaterThan(top0 + 0.1);
  });

  it('la navette glisse : une translation, de 0,4 au bout', () => {
    const ground = groundOf('6e');
    const g = worldGestes(['filets'], ground);
    const m = g.mobiles[0];
    expect(m.shift).toBeDefined();
    const out = g.facets.positions.slice();
    moveMobile(g.facets.positions, out, m, 1);
    const k = m.start * 3;
    expect(Math.hypot(out[k] - g.facets.positions[k], out[k + 1] - g.facets.positions[k + 1], out[k + 2] - g.facets.positions[k + 2])).toBeCloseTo(0.4 * (worldHabitantHeight('filets') / 3.5), 5);
  });

  it('un seul habitant actif : le plus proche à portée, qui garde la main jusqu’à la portée élargie ; rien hors de portée ; à égalité, l’ordre du niveau', () => {
    const ground = groundOf('6e');
    const a = worldHabitantAt('shipyard', ground)!;
    const b = worldHabitantAt('phare', ground)!;
    const candidates = gesteCandidates(['phare', 'shipyard'], ground);
    expect(candidates.map((c) => c.place)).toEqual(['phare', 'shipyard']);
    expect(candidates[1]).toEqual({ place: 'shipyard', x: a.x, z: a.z });
    expect(activeGeste({ x: a.x + 1, z: a.z }, candidates, null)).toBe('shipyard');
    expect(activeGeste({ x: a.x + GESTE_REACH + 1, z: a.z + 500 }, candidates, null)).toBeNull();
    // À la limite : celui d'avant reste tant qu'il est sous la portée élargie, même si l'autre est aussi loin.
    expect(activeGeste({ x: a.x + GESTE_REACH * 1.1, z: a.z }, candidates, 'shipyard')).toBe('shipyard');
    expect(activeGeste({ x: a.x + GESTE_REACH * GESTE_SLACK + 0.5, z: a.z }, candidates, 'shipyard')).toBeNull();
    // Un ancien actif qui n'est plus candidat (lieu caché) ne garde pas la main.
    expect(activeGeste({ x: a.x + 1, z: a.z }, candidates.slice(0, 1), 'shipyard')).toBeNull();
    // À égalité exacte, le premier de la liste.
    const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    const da = Math.hypot(mid.x - a.x, mid.z - a.z);
    if (da < GESTE_REACH) expect(activeGeste(mid, candidates, null)).toBe('phare');
    const m: MobilePiece = { place: 'phare', start: 0, count: 0, pivot: { x: 0, y: 0, z: 0 }, axis: { x: 1, y: 0, z: 0 }, amplitude: 1 };
    expect(() => moveMobile(new Float32Array(0), new Float32Array(0), m, 1)).not.toThrow();
  });
});
