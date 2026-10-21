// Les habitants hors de leur scénette (choix du mainteneur du 21 octobre 2026, « Comme au 6e ») : au 5e, chacun près de
// sa porte, sur le sol, ni sur un chemin, ni sur l'eau, ni dans son lieu ni sur sa scène, dans le regard d'arrivée de
// « Y aller » sans cacher le cœur du lieu ; son pion seul, sans le sol de sa scène ; aucun au 6e ni au 4e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { WORLD_HABITANTS_MAX_5E, worldHabitantsCost5e } from './budget';
import { WHOLE, constructionFacets, ruinFacets } from './construction';
import { FacetBuilder, type Facets } from './facets';
import { planFor } from './levelPlan';
import { levelWorld } from './levelWorld';
import { placeArt } from './northShore';
import { NETWORK_5E } from './paths5e';
import { BUILT_PLACES_5E, PATH_EDGES_5E, PATH_NODES_5E, TERRAIN_5E, type PlaceId5e } from './plan5e';
import { placeTrace, sceneSpot } from './questionScene';
import { habitantPawn } from './scenette';
import { obstaclesIn5e } from './terrain5e';
import { WORLD_HABITANT_SPOTS_5E, hasWorldHabitant, worldHabitantAt, worldHabitantFacets, worldHabitantYaw } from './worldHabitants';

const PLAN = planFor('5e');
const world = levelWorld('5e');
const ground = world.ground(world.field());
const PLACES = PLAN.places;

/** La distance d'un point à un segment, à plat. */
function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

const nodes = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
const SEGMENTS = PATH_EDGES_5E.map(([a, b]) => [nodes.get(a)!, nodes.get(b)!] as const);

/** Des points de chaque triangle (ses sommets, ses milieux, son centre) : pour trouver ce qui touche l'habitant. */
function* samples(f: Facets): Generator<[number, number, number]> {
  const weights = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0.5, 0.5, 0],
    [0, 0.5, 0.5],
    [0.5, 0, 0.5],
    [1 / 3, 1 / 3, 1 / 3],
  ];
  const p = f.positions;
  for (let i = 0; i < p.length; i += 9)
    for (const [u, v, w] of weights) yield [p[i] * u + p[i + 3] * v + p[i + 6] * w, p[i + 1] * u + p[i + 4] * v + p[i + 7] * w, p[i + 2] * u + p[i + 5] * v + p[i + 8] * w];
}

describe('les habitants hors de leur scénette', () => {
  it('au 5e, un par lieu fini ; aucun au 6e ni au 4e', () => {
    expect(Object.keys(WORLD_HABITANT_SPOTS_5E).sort()).toEqual(Object.keys(BUILT_PLACES_5E).sort());
    for (const p of PLACES) expect(hasWorldHabitant(p.id), p.id).toBe(true);
    for (const level of ['6e', '4e'] as const) for (const p of planFor(level).places) expect(hasWorldHabitant(p.id), p.id).toBe(false);
  });

  it('le pion seul : le décor de près dessine le sol de la scène d’abord, le pion ensuite', () => {
    for (const p of PLACES) {
      const art = placeArt(p.id)!;
      const origin = { x: 0, y: 0, z: 0 };
      const noSphere = () => {};
      const floor = new FacetBuilder();
      art.decor(floor, origin, origin, noSphere, false);
      const whole = new FacetBuilder();
      art.decor(whole, origin, origin, noSphere, true);
      const f = floor.build().positions;
      expect(Array.from(whole.build().positions.slice(0, f.length)), p.id).toEqual(Array.from(f));
      const pawn = habitantPawn(p.id as PlaceId5e)!;
      expect(pawn.triangles, p.id).toBeGreaterThan(100);
      // Debout sur ses pieds, à la taille d'un habitant, autour de son axe.
      let low = Infinity;
      let high = -Infinity;
      let wide = 0;
      for (const [x, y, z] of samples(pawn)) {
        low = Math.min(low, y);
        high = Math.max(high, y);
        wide = Math.max(wide, Math.hypot(x, z));
      }
      expect(low, p.id).toBeGreaterThanOrEqual(-0.01);
      expect(high, p.id).toBeGreaterThan(1.2);
      expect(high, p.id).toBeLessThan(1.8);
      expect(wide, p.id).toBeLessThan(0.9);
    }
  });

  it('chacun sur le sol, à côté de sa porte : ni sur l’eau, ni sur une pente, ni sur un chemin, ni sous un arbre', () => {
    for (const p of PLACES) {
      const at = worldHabitantAt(p.id, ground)!;
      const door = NETWORK_5E.pathNode(p.door).at;
      const d = Math.hypot(at.x - door.x, at.z - door.z);
      expect(d, p.id).toBeGreaterThan(1.8);
      expect(d, p.id).toBeLessThan(5);
      const g = ground(at.x, at.z);
      expect(g, p.id).toBeGreaterThan(0.3);
      const around = [
        [0.5, 0],
        [-0.5, 0],
        [0, 0.5],
        [0, -0.5],
      ].map(([x, z]) => ground(at.x + x, at.z + z));
      expect(Math.max(...around) - Math.min(...around), p.id).toBeLessThan(0.35);
      // Le chemin a 1 de demi-largeur : l'habitant (0,4 de demi-largeur au plus) reste à côté.
      expect(Math.min(...SEGMENTS.map(([a, b]) => toSegment(at, a, b))), p.id).toBeGreaterThan(1.8);
      const tx = Math.floor((at.x - TERRAIN_5E.minX) / (TERRAIN_5E.tileCells * TERRAIN_5E.step));
      const tz = Math.floor((at.z - TERRAIN_5E.minZ) / (TERRAIN_5E.tileCells * TERRAIN_5E.step));
      for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) for (const o of obstaclesIn5e(tx + i, tz + k)) expect(Math.hypot(o.x - at.x, o.z - at.z) - o.r, p.id).toBeGreaterThan(0.8);
    }
  });

  it('hors de son lieu (sa ruine, toutes ses étapes, toutes ses traces) et de sa scène ; ses pieds sur ce qui est dessous', () => {
    for (const p of PLACES) {
      const at = worldHabitantAt(p.id, ground)!;
      const traces = Object.keys(placeArt(p.id)!.traces);
      for (const f of [ruinFacets(p.id, ground), constructionFacets(p.id, [WHOLE], ground), placeTrace(p.id, traces)])
        for (const [x, y, z] of samples(f)) {
          const r = Math.hypot(x - at.x, z - at.z);
          // Un dallage du lieu qui déborde sous ses pieds : à leur hauteur, à un rien près (`lift`).
          if (r < 0.6 && y < at.y + 0.12) expect(y, `${p.id} ${x.toFixed(2)} ${z.toFixed(2)}`).toBeLessThan(at.y + 0.03);
          if (y < at.y + 0.12 || y > at.y + 1.8) continue;
          expect(r, `${p.id} ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`).toBeGreaterThan(0.9);
        }
      const s = sceneSpot(p.id);
      const [hx, hz] = placeArt(p.id)!.sceneSpot.half;
      expect(Math.abs(at.x - s.x) > hx + 0.4 || Math.abs(at.z - s.z) > hz + 0.4, p.id).toBe(true);
    }
  });

  it('dans le regard d’arrivée de « Y aller », jamais dans son axe vers le cœur du lieu, tourné vers qui arrive', () => {
    for (const p of PLACES) {
      const at = worldHabitantAt(p.id, ground)!;
      const door = NETWORK_5E.pathNode(p.door).at;
      const view = placeArt(p.id)!.doorView ?? 0;
      // La caméra qui suit, derrière Kéo arrêté à la porte (./camera.ts, `followPose`) : à 9,7 unités, au cap de la porte.
      const cam = { x: door.x + 9.7 * Math.sin(view), z: door.z + 9.7 * Math.cos(view) };
      const ahead = { x: -Math.sin(view), z: -Math.cos(view) };
      const v = { x: at.x - cam.x, z: at.z - cam.z };
      const angle = Math.abs(Math.atan2(v.x * ahead.z - v.z * ahead.x, v.x * ahead.x + v.z * ahead.z));
      expect(angle, p.id).toBeLessThan((28 * Math.PI) / 180);
      expect(toSegment(at, cam, p.center), p.id).toBeGreaterThan(2.2);
      // Ni loin devant la porte (entre la caméra et Kéo), ni loin derrière elle.
      const along = (at.x - door.x) * Math.sin(view) + (at.z - door.z) * Math.cos(view);
      expect(along, p.id).toBeLessThan(1.7);
      expect(along, p.id).toBeGreaterThan(-2.6);
      // Son visage vers la caméra (à moins d'un quart de tour).
      const yaw = worldHabitantYaw(p.id as PlaceId5e);
      const face = { x: Math.sin(yaw), z: Math.cos(yaw) };
      expect(face.x * (cam.x - at.x) + face.z * (cam.z - at.z), p.id).toBeGreaterThan(0);
    }
  });

  it('posé à sa place, tourné : son pion, tous ensemble sous leur plafond, sans appel de plus', () => {
    for (const p of PLACES) {
      const f = worldHabitantFacets(p.id, ground)!;
      const at = worldHabitantAt(p.id, ground)!;
      expect(f.triangles, p.id).toBe(habitantPawn(p.id as PlaceId5e)!.triangles);
      for (const [x, y, z] of samples(f)) {
        expect(Math.hypot(x - at.x, z - at.z), p.id).toBeLessThan(0.9);
        expect(y, p.id).toBeGreaterThanOrEqual(at.y - 0.01);
      }
    }
    expect(worldHabitantFacets('phare', ground)).toBeNull();
    const cost = worldHabitantsCost5e();
    expect(cost.calls).toBe(0);
    expect(cost.triangles).toBe(PLACES.reduce((s, p) => s + habitantPawn(p.id as PlaceId5e)!.triangles, 0));
    expect(cost.triangles).toBeLessThanOrEqual(WORLD_HABITANTS_MAX_5E);
  });
});
