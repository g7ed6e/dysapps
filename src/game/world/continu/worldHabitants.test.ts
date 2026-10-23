// Les habitants hors de leur scénette, aux quatre niveaux (choix du mainteneur du 23 octobre 2026 : en modèle 3D, dans
// les scénettes et dans le monde ouvert) : chacun près de sa porte, sur le sol, ni sur un chemin (avec une marge), ni sur
// l'eau, ni dans son lieu ni sur sa scène, à sa taille de la scénette à côté de Kéo, entier dans le regard d'arrivée de
// « Y aller », hors de la bande de la bulle et du bouton, sans cacher le cœur du lieu ; sa version de loin, lue sur le
// disque, sous son plafond de triangles. Sans Three.js.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ILES } from '../../islands';
import { lireGlbTexture } from '../characters/imported/glb';
import { OPEN_WORLD_BUDGETS, openWorldCost, openWorldCost3e, openWorldCost4e, openWorldCost5e, worldHabitantsCost } from './budget';
import { COMMON_DETOUR_VIEW, KEO_WORLD_SCALE, followPose, lookUp, occlusionLift, screenOf } from './camera';
import { WHOLE, constructionFacets, doorOf, ruinFacets } from './construction';
import type { Facets } from './facets';
import { floraOf } from './flora';
import { habitantModelName } from './habitants';
import { OPEN_WORLD_LEVELS, hasScenette, levelOfPlace, planFor, type OpenWorldLevel, type PlaceId, type ScenePlaceId } from './levelPlan';
import { levelWorld } from './levelWorld';
import { arrivalViewOf, doorViewOf, placeArt } from './northShore';
import { modelOfPlace } from './places';
import { placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo } from './scenette';
import { obstaclesIn3e, walkBlocked3e } from './terrain3e';
import { obstaclesIn4e, walkBlocked4e } from './terrain4e';
import { obstaclesIn5e } from './terrain5e';
import { WORLD_HABITANTS_PER_LEVEL_MAX, WORLD_HABITANT_SPOTS, WORLD_HABITANT_TRIANGLES, hasWorldHabitant, placeWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantScale, worldHabitantYaw } from './worldHabitants';

const MODELS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/univers/archipeo/personnages/modeles');

/** La version de loin d'un habitant, lue sur le disque comme la vue la charge. */
function farModel(place: PlaceId) {
  const bytes = readFileSync(resolve(MODELS, habitantModelName(place), 'habitant-loin.glb'));
  return lireGlbTexture(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

/** La distance d'un point à un segment, à plat. */
function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

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

/** La tablette, en pixels, et la bande de la bulle et de « Y aller » en bas, au milieu (mesurées en texte normal, 8 px de marge). */
const SCREEN = { width: 1024, height: 768 };
const BAND = { left: 268, right: 756, top: 630 };
/** Les colonnes des boutons, à gauche et à droite, et le haut de l'écran. */
const EDGES = { left: 76, right: 948, top: 76 };

/** Les rayons de la végétation du 6e (ceux de la marche libre, ./freeWalk.ts). */
const FLORA_RADIUS = { pin: 0.45, palmier: 0.3, buisson: 0.55, rocher: 0.6 } as const;

/**
 * Les places serrées, que la grille a trouvées en desserrant une règle, une seule : sur le palier des Écluses, le sol
 * monte d'un demi de plus ; au pied de la Soute, que deux chemins serrent, le chemin à 0,4 de marge et la place un peu
 * plus loin derrière la porte.
 */
const SLOPE: Partial<Record<PlaceId, number>> = { ecluses: 0.6 };
const PATH_MARGIN: Partial<Record<PlaceId, number>> = { soute: 0.4 };
const ALONG: Partial<Record<PlaceId, number>> = { soute: 3 };

interface Level {
  level: OpenWorldLevel;
  ground: (x: number, z: number) => number;
  segments: (readonly [{ x: number; z: number }, { x: number; z: number }])[];
  obstacles: (tx: number, tz: number) => readonly { x: number; z: number; r: number }[];
  blocked: (p: { x: number; z: number }) => boolean;
}

const levels = new Map<OpenWorldLevel, Level>();
function levelOf(level: OpenWorldLevel): Level {
  let l = levels.get(level);
  if (l) return l;
  const plan = planFor(level);
  const world = levelWorld(level);
  const field = world.field();
  const node = (id: string) => world.net.pathNode(id).at;
  l = {
    level,
    ground: world.ground(field),
    segments: plan.pathEdges.map(([a, b]) => [node(a), node(b)] as const),
    obstacles: (tx, tz) =>
      level === '6e' ? floraOf(field, tx, tz).map((it) => ({ x: it.x, z: it.z, r: FLORA_RADIUS[it.kind] * it.scale })) : level === '5e' ? obstaclesIn5e(tx, tz) : level === '4e' ? obstaclesIn4e(tx, tz) : obstaclesIn3e(tx, tz),
    blocked: (p) => (level === '4e' ? walkBlocked4e(p) : level === '3e' ? walkBlocked3e(p) : false),
  };
  levels.set(level, l);
  return l;
}

const placed = new Map<PlaceId, Float32Array>();
/** La version de loin d'un habitant à sa place, ses sommets dans le monde. */
function placedOf(place: ScenePlaceId, ground: (x: number, z: number) => number): Float32Array {
  let p = placed.get(place);
  if (!p) placed.set(place, (p = placeWorldHabitant(place, farModel(place).positions, ground)!));
  return p;
}

/** Le rayon de l'habitant posé autour de ses pieds, à plat : en entier, et au ras du sol (ses pieds, le bas d'un manteau). */
function reachOf(place: ScenePlaceId, ground: (x: number, z: number) => number): { whole: number; feet: number } {
  const p = placedOf(place, ground);
  const at = worldHabitantAt(place, ground)!;
  let whole = 0;
  let feet = 0;
  for (let i = 0; i < p.length; i += 3) {
    const r = Math.hypot(p[i] - at.x, p[i + 2] - at.z);
    whole = Math.max(whole, r);
    if (p[i + 1] < at.y + 0.5) feet = Math.max(feet, r);
  }
  return { whole, feet };
}

/** Le regard d'arrivée de « Y aller » (three/archipeo/scene.ts, `jumpTo`) : la caméra qui suit Kéo arrêté à la porte, au cap de la porte. */
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

/** Les lieux d'un niveau dont l'habitant a une place sur le sol (et non sa place de la scénette). */
const onGround = (level: OpenWorldLevel) => planFor(level).places.map((p) => p.id as ScenePlaceId).filter((id) => WORLD_HABITANT_SPOTS[id] !== 'scenette');

describe('les habitants hors de leur scénette', () => {
  it('un par lieu fini, aux quatre niveaux, chacun avec sa version de loin sous son plafond, à la taille du modèle de la scénette', () => {
    for (const level of OPEN_WORLD_LEVELS)
      for (const p of planFor(level).places) {
        expect(hasWorldHabitant(p.id), p.id).toBe(hasScenette(p.id));
        if (!hasWorldHabitant(p.id)) continue;
        expect(existsSync(resolve(MODELS, habitantModelName(p.id), 'habitant-loin.glb')), p.id).toBe(true);
        const m = farModel(p.id);
        expect(m.indices.length / 3, p.id).toBeLessThanOrEqual(WORLD_HABITANT_TRIANGLES);
        expect(m.indices.length / 3, p.id).toBeGreaterThan(WORLD_HABITANT_TRIANGLES / 2);
        expect(m.image.mimeType, p.id).toBe('image/jpeg');
      }
  });

  it('à la taille qu’il a à côté de Kéo dans la scénette : un adulte, plus grand que Kéo', () => {
    for (const level of OPEN_WORLD_LEVELS)
      for (const p of planFor(level).places) {
        const id = p.id as ScenePlaceId;
        expect(worldHabitantScale(id), p.id).toBeCloseTo(KEO_WORLD_SCALE / scenetteKeo(id).scale, 9);
        // Kéo mesure deux unités à l'échelle 1 (`TAILLE_DU_BONHOMME`).
        const keo = 2 * KEO_WORLD_SCALE;
        expect(worldHabitantHeight(id) / keo, p.id).toBeGreaterThan(1);
        expect(worldHabitantHeight(id) / keo, p.id).toBeLessThan(1.3);
      }
  });

  it('au plus seize par niveau : autant de cases dans la texture qui réunit leurs images', () => {
    for (const level of OPEN_WORLD_LEVELS) expect(planFor(level).places.filter((p) => hasWorldHabitant(p.id)).length).toBeLessThanOrEqual(WORLD_HABITANTS_PER_LEVEL_MAX);
  });

  it('à la Gare maritime et au Fanal, à sa place de la scénette', () => {
    for (const id of ['ferry', 'fanal'] as const) {
      expect(WORLD_HABITANT_SPOTS[id], id).toBe('scenette');
      const { ground } = levelOf(levelOfPlace(id));
      expect(worldHabitantAt(id, ground), id).toEqual(scenetteHabitant(id));
    }
  });

  describe.each(OPEN_WORLD_LEVELS)('au %s', (level) => {
    it.each(onGround(level))('%s : sur le sol, à côté de sa porte, ni sur l’eau, ni sur une pente, ni sur un chemin (une marge comprise), ni sous un arbre', (id) => {
      const { ground, segments, obstacles, blocked } = levelOf(level);
      const { terrain } = planFor(level);
      const at = worldHabitantAt(id, ground)!;
      const { whole, feet } = reachOf(id, ground);
      const door = doorOf(id);
      const d = Math.hypot(at.x - door.x, at.z - door.z);
      expect(d).toBeGreaterThan(1.8);
      expect(d).toBeLessThan(6);
      expect(ground(at.x, at.z)).toBeGreaterThan(0.3);
      const around = [
        [feet, 0],
        [-feet, 0],
        [0, feet],
        [0, -feet],
      ].map(([x, z]) => ground(at.x + x, at.z + z));
      expect(Math.max(...around) - Math.min(...around)).toBeLessThan(SLOPE[id] ?? 0.4);
      for (const [x, z] of around.map((_, i) => [at.x + [feet, -feet, 0, 0][i], at.z + [0, 0, feet, -feet][i]])) expect(blocked({ x, z })).toBe(false);
      // Le chemin a 1 de demi-largeur : le bas de l'habitant reste à côté, avec une demi-unité d'herbe au moins entre eux
      // (au Hameau, ses pieds touchaient le bord du chemin clair : consultant UX UI, directeur artistique).
      expect(Math.min(...segments.map(([a, b]) => toSegment(at, a, b))) - 1 - feet).toBeGreaterThan(PATH_MARGIN[id] ?? 0.5);
      const tx = Math.floor((at.x - terrain.minX) / (terrain.tileCells * terrain.step));
      const tz = Math.floor((at.z - terrain.minZ) / (terrain.tileCells * terrain.step));
      for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) for (const o of obstacles(tx + i, tz + k)) expect(Math.hypot(o.x - at.x, o.z - at.z) - o.r).toBeGreaterThan(whole + 0.3);
    });

    // Un test par lieu ; seuls les points en faute sont gardés, pour le message (pas un `expect` par point).
    it.each(onGround(level))('%s : hors de son lieu (sa ruine, toutes ses étapes, toutes ses traces) et de sa scène ; ses pieds sur ce qui est dessous', (id) => {
      const { ground } = levelOf(level);
      const at = worldHabitantAt(id, ground)!;
      const { whole } = reachOf(id, ground);
      const top = worldHabitantHeight(id);
      const island = ILES.find((i) => i.id === planFor(level).places.find((p) => p.id === id)!.island);
      const traces = island ? island.exercises.map((e) => e.id) : [];
      const faults: string[] = [];
      for (const f of [ruinFacets(id, ground), constructionFacets(id, [WHOLE], ground), placeTrace(id, traces)])
        for (const [x, y, z] of samples(f)) {
          const r = Math.hypot(x - at.x, z - at.z);
          // Un dallage du lieu qui déborde sous ses pieds : à leur hauteur, à un rien près (`lift`).
          if (r < 0.6 && y < at.y + 0.12 && y >= at.y + 0.03) faults.push(`sous ses pieds ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
          if (y < at.y + 0.12 || y > at.y + top) continue;
          if (r <= whole + 0.2) faults.push(`contre lui ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
        }
      expect(faults.slice(0, 5)).toEqual([]);
      const s = sceneSpot(id);
      const [hx, hz] = placeArt(id)?.sceneSpot.half ?? [1.6, 1.6];
      expect(Math.abs(at.x - s.x) > hx + 0.4 || Math.abs(at.z - s.z) > hz + 0.4).toBe(true);
    });

    it.each(onGround(level))('%s : entier dans le regard d’arrivée de « Y aller », hors de la bande de la bulle et du bouton, jamais dans son axe vers le cœur du lieu, tourné vers qui arrive', (id) => {
      const { ground } = levelOf(level);
      const p = planFor(level).places.find((q) => q.id === id)!;
      const at = worldHabitantAt(id, ground)!;
      const door = doorOf(id);
      const view = doorViewOf(id);
      // À l'écran de la tablette : entier, hors des colonnes de boutons, et jamais dans la bande de la bulle et de « Y
      // aller » (au Donjon, la bulle et le bouton le coupaient à demi : référent dys, directeur artistique).
      const pose = arrivalPose(id, ground);
      const v = placedOf(id, ground);
      let [left, right, top, bottom, inBand] = [Infinity, -Infinity, Infinity, -Infinity, 0];
      for (let i = 0; i < v.length; i += 3) {
        const q = screenOf(pose, { x: v[i], y: v[i + 1], z: v[i + 2] }, SCREEN.width, SCREEN.height);
        [left, right, top, bottom] = [Math.min(left, q.x), Math.max(right, q.x), Math.min(top, q.y), Math.max(bottom, q.y)];
        if (q.x > BAND.left && q.x < BAND.right && q.y > BAND.top) inBand++;
      }
      const box = `${id} ${left.toFixed(0)} ${right.toFixed(0)} ${top.toFixed(0)} ${bottom.toFixed(0)}`;
      expect(left, box).toBeGreaterThan(EDGES.left);
      expect(right, box).toBeLessThan(EDGES.right);
      expect(top, box).toBeGreaterThan(EDGES.top);
      expect(bottom, box).toBeLessThan(SCREEN.height);
      expect(inBand, box).toBe(0);
      // La caméra qui suit, derrière Kéo arrêté à la porte (./camera.ts, `followPose`) : à 9,7 unités, au cap de la porte.
      const cam = { x: door.x + 9.7 * Math.sin(view), z: door.z + 9.7 * Math.cos(view) };
      expect(toSegment(at, cam, p.center)).toBeGreaterThan(2.2);
      // Ni loin devant la porte (entre la caméra et Kéo), ni loin derrière elle.
      const along = (at.x - door.x) * Math.sin(view) + (at.z - door.z) * Math.cos(view);
      expect(Math.abs(along)).toBeLessThan(ALONG[id] ?? 2.6);
      // Son visage vers la caméra (à moins d'un quart de tour).
      const yaw = worldHabitantYaw(id);
      expect(Math.sin(yaw) * (cam.x - at.x) + Math.cos(yaw) * (cam.z - at.z)).toBeGreaterThan(0);
    });

    it('tous ensemble en un appel, hors scénette seulement, sous l’enveloppe du niveau', () => {
      const count = planFor(level).places.filter((p) => hasWorldHabitant(p.id)).length;
      expect(worldHabitantsCost(level)).toEqual({ triangles: count * WORLD_HABITANT_TRIANGLES, calls: 1 });
      const views = level === '6e' ? [openWorldCost(0, 'monde')] : level === '5e' ? [openWorldCost5e('monde'), openWorldCost5e('depart')] : level === '4e' ? [openWorldCost4e('monde'), openWorldCost4e('depart')] : [openWorldCost3e('monde'), openWorldCost3e('depart')];
      const scenette = level === '6e' ? openWorldCost(0) : level === '5e' ? openWorldCost5e('scenette') : level === '4e' ? openWorldCost4e('scenette') : openWorldCost3e('scenette');
      expect(scenette.some((c) => c.poste === 'habitants')).toBe(false);
      for (const v of views) {
        expect(v.find((c) => c.poste === 'habitants')).toEqual({ poste: 'habitants', ...worldHabitantsCost(level) });
        expect(v.reduce((s, c) => s + c.triangles, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS[level].triangles);
        expect(v.reduce((s, c) => s + c.calls, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS[level].calls);
      }
    });
  });
});
