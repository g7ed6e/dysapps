// La marche de Kéo sur un trajet du réseau (./paths.ts) : où il en est, à vitesse constante, et où il regarde. Avec
// « Réduire les animations », il est tout de suite arrivé (comme le bonhomme du monde en grille). Code pur.
import { distance, type Vec2 } from './geometry';
import { routeLength } from './paths';
import { KEO_STEP } from './plan6e';

/**
 * La vitesse de Kéo, en unités par seconde (directeur artistique, piste 1 : 4, il était à 6) : la seule constante de
 * la marche ; la cadence de ses jambes en découle.
 */
export const WALK_SPEED = 4;

/**
 * La cadence des jambes de Kéo, en radians par seconde du cycle de marche (un cycle : deux pas) : un pas de `KEO_STEP`
 * par demi-cycle, pour que ses pieds ne glissent pas sur le sol.
 */
export const WALK_CADENCE = (Math.PI * WALK_SPEED) / KEO_STEP;

/** Un trajet en cours : ses points, sa longueur et le moment du départ (en millisecondes). */
export interface Walk {
  route: readonly Vec2[];
  length: number;
  start: number;
}

export function startWalk(route: readonly Vec2[], now: number): Walk {
  return { route, length: routeLength(route), start: now };
}

/** Où en est Kéo : sa place, son cap (l'angle autour de la verticale, le visage vers −z au cap 0), s'il marche encore. */
export interface WalkState {
  at: Vec2;
  heading: number | null;
  moving: boolean;
}

/** Le point à la distance `d` du départ, le long du trajet. */
function pointAt(route: readonly Vec2[], d: number): { at: Vec2; segment: number } {
  let rest = Math.max(0, d);
  for (let i = 1; i < route.length; i++) {
    const l = distance(route[i - 1], route[i]);
    if (rest <= l && l > 0) {
      const t = rest / l;
      return { at: { x: route[i - 1].x + t * (route[i].x - route[i - 1].x), z: route[i - 1].z + t * (route[i].z - route[i - 1].z) }, segment: i };
    }
    rest -= l;
  }
  return { at: route[route.length - 1], segment: route.length - 1 };
}

/** Le cap qui fait regarder de `a` vers `b` (le modèle regarde vers −z, comme le bonhomme du monde en grille). */
const headingTowards = (a: Vec2, b: Vec2): number => Math.atan2(-(b.x - a.x), -(b.z - a.z));

export function walkAt(walk: Walk, now: number, reduceMotion: boolean): WalkState {
  const d = reduceMotion ? walk.length : ((now - walk.start) / 1000) * WALK_SPEED;
  const done = d >= walk.length;
  const { at, segment } = pointAt(walk.route, Math.min(d, walk.length));
  const a = walk.route[Math.max(0, segment - 1)];
  const b = walk.route[segment];
  return { at, heading: a && b && distance(a, b) > 1e-6 ? headingTowards(a, b) : null, moving: !done };
}

/** Sauter le trajet (« Passer ») : Kéo est arrivé. */
export function skipWalk(walk: Walk, now: number): Walk {
  return { ...walk, start: now - (walk.length / WALK_SPEED) * 1000 - 1 };
}
