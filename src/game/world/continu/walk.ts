// La marche de Kéo sur un trajet du réseau (./paths.ts) : où il en est, à vitesse constante, et où il regarde. Avec
// « Réduire les animations », il est tout de suite arrivé (comme le bonhomme du monde en grille). Un trajet peut passer
// la cabine de la Montée (GD-22, lot 3, ./cabinRide.ts) : Kéo s'arrête dans la caisse, elle roule, il en ressort ; avec
// « Réduire les animations », un fondu court par la couleur de la brume, jamais par le noir (`veil`). Code pur.
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

/**
 * Le trajet de la cabine (intention du directeur artistique, § 4 ; à confirmer par le référent dys) : la montée ou la
 * descente en `seconds`, départ et arrivée amortis ; un temps à l'arrêt avant et après (`board` : Kéo entre dans la
 * caisse, en ressort) ; avec « Réduire les animations », le fondu de la brume (`fade` pour venir, autant pour partir).
 */
export const RIDE = { seconds: 4, board: 0.4, fade: 0.3 } as const;

/**
 * Un trajet en cours : ses points, sa longueur et le moment du départ (en millisecondes) ; la part qui se fait dans la
 * caisse de la cabine (`ride`, en distances le long du trajet), s'il y en a une.
 */
export interface Walk {
  route: readonly Vec2[];
  length: number;
  start: number;
  /** La part dans la caisse, et le cap de Kéo pendant qu'elle roule (vers où elle va), calculé une fois au départ. */
  ride?: { from: number; to: number; heading: number };
}

export function startWalk(route: readonly Vec2[], now: number, ride?: { from: number; to: number } | null): Walk {
  if (!ride) return { route, length: routeLength(route), start: now };
  const heading = headingTowards(pointAt(route, ride.from).at, pointAt(route, ride.to).at);
  return { route, length: routeLength(route), start: now, ride: { from: ride.from, to: ride.to, heading } };
}

/**
 * Où en est Kéo : sa place, son cap (l'angle autour de la verticale, le visage vers −z au cap 0), s'il marche encore ;
 * dans la caisse de la cabine, sa part du trajet de 0 à 1 (`riding`, `null` hors de la caisse) ; le voile de la brume,
 * de 0 à 1 (avec « Réduire les animations », pendant le fondu ; 0 sinon).
 */
export interface WalkState {
  at: Vec2;
  heading: number | null;
  moving: boolean;
  riding: number | null;
  veil: number;
}

/** La durée d'un trajet, en secondes. */
export function walkSeconds(walk: Walk, reduceMotion: boolean): number {
  if (!walk.ride) return reduceMotion ? 0 : walk.length / WALK_SPEED;
  if (reduceMotion) return 2 * RIDE.fade;
  return (walk.length - (walk.ride.to - walk.ride.from)) / WALK_SPEED + 2 * RIDE.board + RIDE.seconds;
}

/**
 * La distance faite au bout de `t` secondes d'un trajet qui passe la cabine, et la part du trajet dans la caisse : la
 * marche jusqu'à l'arrêt, l'arrêt, le roulement (adouci au départ et à l'arrivée, sans à-coup : un demi-cosinus),
 * l'arrêt, la marche.
 */
function rideDistance(ride: { from: number; to: number }, t: number): { d: number; riding: number | null } {
  const walkIn = ride.from / WALK_SPEED;
  if (t < walkIn) return { d: t * WALK_SPEED, riding: null };
  const inCar = 2 * RIDE.board + RIDE.seconds;
  if (t < walkIn + inCar) {
    const u = Math.min(1, Math.max(0, (t - walkIn - RIDE.board) / RIDE.seconds));
    const e = (1 - Math.cos(Math.PI * u)) / 2;
    return { d: ride.from + (ride.to - ride.from) * e, riding: e };
  }
  return { d: ride.to + (t - walkIn - inCar) * WALK_SPEED, riding: null };
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
  const t = (now - walk.start) / 1000;
  let d: number;
  let riding: number | null = null;
  let veil = 0;
  let done: boolean;
  if (walk.ride && reduceMotion) {
    // Le fondu : la brume monte, Kéo passe d'un bout à l'autre, la brume se retire.
    const f = RIDE.fade;
    d = t < f ? 0 : walk.length;
    veil = t < f ? Math.max(0, t / f) : Math.max(0, 1 - (t - f) / f);
    done = t >= 2 * f;
    if (done) veil = 0;
  } else if (walk.ride) {
    const r = rideDistance(walk.ride, t);
    d = r.d;
    riding = r.riding;
    done = d >= walk.length;
  } else {
    d = reduceMotion ? walk.length : t * WALK_SPEED;
    done = d >= walk.length;
  }
  const { at, segment } = pointAt(walk.route, Math.min(d, walk.length));
  const a = walk.route[Math.max(0, segment - 1)];
  const b = walk.route[segment];
  // Dans la caisse, Kéo regarde où elle va (le haut ou le bas du rail) : son cap, calculé au départ, ne bouge pas.
  const heading = walk.ride && riding !== null ? walk.ride.heading : a && b && distance(a, b) > 1e-6 ? headingTowards(a, b) : null;
  return { at, heading, moving: !done, riding: done ? null : riding, veil };
}

/** Sauter le trajet (« Passer ») : Kéo est arrivé. */
export function skipWalk(walk: Walk, now: number): Walk {
  return { ...walk, start: now - walkSeconds(walk, false) * 1000 - 1 };
}
