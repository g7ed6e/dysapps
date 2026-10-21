// Les habitants hors de leur scénette, au 5e (choix du mainteneur du 21 octobre 2026, « Garder au 5e ») : chacun près de
// sa porte, sur le sol, ni sur un chemin (avec une marge), ni sur l'eau, ni dans son lieu ni sur sa scène, à sa taille
// de la scénette à côté de Kéo, entier dans le regard d'arrivée de « Y aller », hors de la bande de la bulle et du
// bouton, sans cacher le cœur du lieu ; son pion seul, sans le sol de sa scène ; aucun au 6e ni au 4e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { WORLD_HABITANTS_MAX_5E, worldHabitantsCost5e } from './budget';
import { COMMON_DETOUR_VIEW, KEO_WORLD_SCALE, followPose, lookUp, occlusionLift, screenOf } from './camera';
import { WHOLE, constructionFacets, ruinFacets } from './construction';
import { FacetBuilder, type Facets } from './facets';
import { planFor } from './levelPlan';
import { levelWorld } from './levelWorld';
import { arrivalViewOf, placeArt } from './northShore';
import { NETWORK_5E } from './paths5e';
import { BUILT_PLACES_5E, PATH_EDGES_5E, PATH_NODES_5E, TERRAIN_5E, type PlaceId5e } from './plan5e';
import { placeTrace, sceneSpot } from './questionScene';
import { modelOfPlace } from './places';
import { habitantPawn, scenetteKeo } from './scenette';
import { obstaclesIn5e } from './terrain5e';
import { WORLD_HABITANT_SPOTS_5E, hasWorldHabitant, worldHabitantAt, worldHabitantFacets, worldHabitantHeight, worldHabitantScale, worldHabitantYaw } from './worldHabitants';

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

/** Le rayon du pion posé autour de ses pieds, à plat : en entier, et au ras du sol (ses pieds, le bas de sa robe). */
function reachOf(id: PlaceId5e): { whole: number; feet: number } {
  const f = worldHabitantFacets(id, ground)!;
  const at = worldHabitantAt(id, ground)!;
  let whole = 0;
  let feet = 0;
  for (const [x, y, z] of samples(f)) {
    const r = Math.hypot(x - at.x, z - at.z);
    whole = Math.max(whole, r);
    if (y < at.y + 0.5) feet = Math.max(feet, r);
  }
  return { whole, feet };
}

/** La tablette, en pixels, et la bande de la bulle et de « Y aller » en bas, au milieu (mesurées en texte normal, 8 px de marge). */
const SCREEN = { width: 1024, height: 768 };
const BAND = { left: 268, right: 756, top: 630 };
/** Les colonnes des boutons, à gauche et à droite, et le haut de l'écran. */
const EDGES = { left: 76, right: 948, top: 76 };

/**
 * Le regard d'arrivée de « Y aller » (three/archipeo/scene.ts, `jumpTo`) : la caméra qui suit Kéo arrêté à la porte, au
 * cap de la porte ; devant un lieu haut (`arrivalView`), reculée et le regard levé jusqu'à son haut (`lookUp`). Le regard
 * d'un lieu à vue de porte (`doorFrame` : le Gaillard, les Nacelles) est pris comme la caméra qui suit.
 */
function arrivalPose(id: PlaceId5e) {
  const p = PLACES.find((q) => q.id === id)!;
  const door = NETWORK_5E.pathNode(p.door).at;
  const feet = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const view = placeArt(id)!.doorView ?? 0;
  const a = arrivalViewOf(id);
  const pose = followPose(feet, occlusionLift(feet, ground, view), undefined, view, a ? 1 : 0, undefined, a ? { height: 0, back: a.back } : COMMON_DETOUR_VIEW);
  if (a) lookUp(pose, { x: p.center.x + a.look.x, y: ground(p.center.x, p.center.z) + (a.top ?? modelOfPlace(id).top), z: p.center.z + a.look.z }, feet, 1, SCREEN.height);
  return pose;
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

  it('à la taille qu’il a à côté de Kéo dans la scénette : un adulte, plus grand que Kéo', () => {
    for (const p of PLACES) {
      const id = p.id as PlaceId5e;
      expect(worldHabitantScale(id), p.id).toBeCloseTo(KEO_WORLD_SCALE / scenetteKeo(id).scale, 9);
      // Kéo mesure deux unités à l'échelle 1 (`TAILLE_DU_BONHOMME`).
      const keo = 2 * KEO_WORLD_SCALE;
      expect(worldHabitantHeight(id) / keo, p.id).toBeGreaterThan(1);
      expect(worldHabitantHeight(id) / keo, p.id).toBeLessThan(1.3);
    }
  });

  it('chacun sur le sol, à côté de sa porte : ni sur l’eau, ni sur une pente, ni sur un chemin (une marge comprise), ni sous un arbre', () => {
    for (const p of PLACES) {
      const id = p.id as PlaceId5e;
      const at = worldHabitantAt(p.id, ground)!;
      const { whole, feet } = reachOf(id);
      const door = NETWORK_5E.pathNode(p.door).at;
      const d = Math.hypot(at.x - door.x, at.z - door.z);
      expect(d, p.id).toBeGreaterThan(1.8);
      expect(d, p.id).toBeLessThan(6);
      const g = ground(at.x, at.z);
      expect(g, p.id).toBeGreaterThan(0.3);
      const around = [
        [feet, 0],
        [-feet, 0],
        [0, feet],
        [0, -feet],
      ].map(([x, z]) => ground(at.x + x, at.z + z));
      expect(Math.max(...around) - Math.min(...around), p.id).toBeLessThan(0.4);
      // Le chemin a 1 de demi-largeur : le bas de l'habitant reste à côté, avec une demi-unité d'herbe au moins entre eux
      // (au Hameau, ses pieds touchaient le bord du chemin clair : consultant UX UI, directeur artistique).
      expect(Math.min(...SEGMENTS.map(([a, b]) => toSegment(at, a, b))) - 1 - feet, p.id).toBeGreaterThan(0.5);
      const tx = Math.floor((at.x - TERRAIN_5E.minX) / (TERRAIN_5E.tileCells * TERRAIN_5E.step));
      const tz = Math.floor((at.z - TERRAIN_5E.minZ) / (TERRAIN_5E.tileCells * TERRAIN_5E.step));
      for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) for (const o of obstaclesIn5e(tx + i, tz + k)) expect(Math.hypot(o.x - at.x, o.z - at.z) - o.r, p.id).toBeGreaterThan(whole + 0.3);
    }
  });

  // Un test par lieu ; seuls les points en faute sont gardés, pour le message (pas un `expect` par point).
  it.each(PLACES.map((p) => p.id as PlaceId5e))('hors de son lieu (sa ruine, toutes ses étapes, toutes ses traces) et de sa scène ; ses pieds sur ce qui est dessous (%s)', (id) => {
    const at = worldHabitantAt(id, ground)!;
    const { whole } = reachOf(id);
    const top = worldHabitantHeight(id);
    const traces = Object.keys(placeArt(id)!.traces);
    const faults: string[] = [];
    for (const f of [ruinFacets(id, ground), constructionFacets(id, [WHOLE], ground), placeTrace(id, traces)])
      for (const [x, y, z] of samples(f)) {
        const r = Math.hypot(x - at.x, z - at.z);
        // Un dallage du lieu qui déborde sous ses pieds : à leur hauteur, à un rien près (`lift`).
        if (r < 0.6 && y < at.y + 0.12 && y >= at.y + 0.03) faults.push(`sous ses pieds ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
        if (y < at.y + 0.12 || y > at.y + top) continue;
        if (r <= whole + 0.2) faults.push(`contre lui ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
      }
    expect(faults.slice(0, 5), id).toEqual([]);
    const s = sceneSpot(id);
    const [hx, hz] = placeArt(id)!.sceneSpot.half;
    expect(Math.abs(at.x - s.x) > hx + 0.4 || Math.abs(at.z - s.z) > hz + 0.4, id).toBe(true);
  });

  it('entier dans le regard d’arrivée de « Y aller », hors de la bande de la bulle et du bouton, jamais dans son axe vers le cœur du lieu, tourné vers qui arrive', () => {
    for (const p of PLACES) {
      const id = p.id as PlaceId5e;
      const at = worldHabitantAt(p.id, ground)!;
      const door = NETWORK_5E.pathNode(p.door).at;
      const view = placeArt(p.id)!.doorView ?? 0;
      // À l'écran de la tablette : entier, hors des colonnes de boutons, et jamais dans la bande de la bulle et de « Y
      // aller » (au Donjon, la bulle et le bouton le coupaient à demi : référent dys, directeur artistique).
      const pose = arrivalPose(id);
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      let inBand = 0;
      for (const [x, y, z] of samples(worldHabitantFacets(p.id, ground)!)) {
        const q = screenOf(pose, { x, y, z }, SCREEN.width, SCREEN.height);
        left = Math.min(left, q.x);
        right = Math.max(right, q.x);
        top = Math.min(top, q.y);
        bottom = Math.max(bottom, q.y);
        if (q.x > BAND.left && q.x < BAND.right && q.y > BAND.top) inBand++;
      }
      const box = `${p.id} ${left.toFixed(0)} ${right.toFixed(0)} ${top.toFixed(0)} ${bottom.toFixed(0)}`;
      expect(left, box).toBeGreaterThan(EDGES.left);
      expect(right, box).toBeLessThan(EDGES.right);
      expect(top, box).toBeGreaterThan(EDGES.top);
      expect(bottom, box).toBeLessThan(SCREEN.height);
      expect(inBand, box).toBe(0);
      // La caméra qui suit, derrière Kéo arrêté à la porte (./camera.ts, `followPose`) : à 9,7 unités, au cap de la porte.
      const cam = { x: door.x + 9.7 * Math.sin(view), z: door.z + 9.7 * Math.cos(view) };
      expect(toSegment(at, cam, p.center), p.id).toBeGreaterThan(2.2);
      // Ni loin devant la porte (entre la caméra et Kéo), ni loin derrière elle.
      const along = (at.x - door.x) * Math.sin(view) + (at.z - door.z) * Math.cos(view);
      expect(along, p.id).toBeLessThan(2.6);
      expect(along, p.id).toBeGreaterThan(-2.6);
      // Son visage vers la caméra (à moins d'un quart de tour).
      const yaw = worldHabitantYaw(id);
      const face = { x: Math.sin(yaw), z: Math.cos(yaw) };
      expect(face.x * (cam.x - at.x) + face.z * (cam.z - at.z), p.id).toBeGreaterThan(0);
    }
  });

  // Un test par lieu, chaque point mesuré sans un `expect` par point (vingt-deux mille points en tout : un `expect` par
  // point passait les 5 s de la CI, la suite entière en parallèle).
  it.each(PLACES.map((p) => p.id as PlaceId5e))('posé à sa place, tourné : son pion (%s)', (id) => {
    const f = worldHabitantFacets(id, ground)!;
    const at = worldHabitantAt(id, ground)!;
    expect(f.triangles, id).toBe(habitantPawn(id)!.triangles);
    let reach = 0;
    let low = Infinity;
    for (const [x, y, z] of samples(f)) {
      reach = Math.max(reach, Math.hypot(x - at.x, z - at.z));
      low = Math.min(low, y);
    }
    expect(reach, id).toBeLessThan(0.9 * worldHabitantScale(id));
    expect(low, id).toBeGreaterThanOrEqual(at.y - 0.01);
  });

  it('tous ensemble sous leur plafond, sans appel de plus ; aucun hors du 5e', () => {
    expect(worldHabitantFacets('phare', ground)).toBeNull();
    const cost = worldHabitantsCost5e();
    expect(cost.calls).toBe(0);
    expect(cost.triangles).toBe(PLACES.reduce((s, p) => s + habitantPawn(p.id as PlaceId5e)!.triangles, 0));
    expect(cost.triangles).toBeLessThanOrEqual(WORLD_HABITANTS_MAX_5E);
  });
});
