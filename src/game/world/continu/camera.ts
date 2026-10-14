// La caméra du monde continu (piste 1, lot 1, choix du mainteneur du 14 octobre 2026) : elle suit Kéo de trois quarts,
// de 4 à 5 m de haut et 6 m derrière lui, toujours tournée vers le nord (jamais libre, jamais de roulis) ; Kéo y tient
// environ un sixième de la hauteur de l'écran, un peu sous le milieu, et le haut de l'image garde l'horizon, où le
// repère du lieu suivant dépasse la brume. Elle ne bouge pas tant que Kéo reste dans une petite zone morte, puis le
// rattrape en douceur ; avec « Réduire les animations », elle le suit d'un bloc (coupe franche). Si le relief passe
// entre elle et Kéo, elle monte juste assez pour le voir. Le cadrage d'une question (./questionScene.ts) garde l'angle
// de toujours (`CAMERA_PITCH`, `CAMERA_FOV`). Code pur : la vue pose la caméra.
import type { Vec3 } from './geometry';
import type { PlaceId } from './plan6e';
import { modelOfPlace } from './places';

/** L'angle de la caméra d'une question sous l'horizon, en radians : le lieu vu d'en haut, de biais (le sud en bas). */
export const CAMERA_PITCH = (52 * Math.PI) / 180;
/** Le champ vertical de la caméra d'une question, en degrés. */
export const CAMERA_FOV = 40;

/**
 * Une pose de caméra : sa place, le point qu'elle regarde (le haut est toujours la verticale), son champ vertical en
 * degrés, et le décentrement de l'objectif, `lens`, en part de la demi-largeur de l'écran (0 : le point regardé au
 * milieu). La caméra qui suit Kéo ne se décentre pas.
 */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
  lens: number;
}

/** La hauteur de Kéo dans la scène (son corps à l'échelle de la vue, un peu de marge). */
export const KEO_HEIGHT = 2.6;
/** Au-dessus du sommet d'un lieu, en unités : là où se pose la marque (la vue lit la même valeur). */
export const MARK_LIFT = 1.2;

/**
 * La caméra qui suit Kéo, en unités (Kéo mesure 2,4 unités pour 1,5 m : une unité fait environ 0,62 m) : `height`
 * au-dessus de ses pieds (4,3 m), `back` derrière lui, au sud (6 m) ; son champ vertical (en degrés), réglé pour que Kéo
 * tienne environ un sixième de la hauteur de l'écran ; `keoOnScreen`, la place du milieu de Kéo depuis le haut de
 * l'écran (en part de sa hauteur), assez bas pour laisser l'horizon en haut, assez haut pour rester au-dessus de
 * « Y aller ».
 */
export const FOLLOW = { height: 7, back: 9.7, fov: 56, keoOnScreen: 0.62 } as const;
/** Le milieu de Kéo au-dessus de ses pieds : le point que la caméra garde à sa place à l'écran. */
const KEO_MIDDLE = 1.2;
/** La distance du point regardé à la caméra : sans effet sur l'image (seule la direction compte). */
const LOOK_DISTANCE = 10;

const tanHalf = (fov: number) => Math.tan(((fov / 2) * Math.PI) / 180);

/** L'angle sous l'horizon d'une caméra à `height` au-dessus des pieds de Kéo : son milieu reste à `keoOnScreen`. */
function followPitch(height: number): number {
  const toKeo = Math.atan2(height - KEO_MIDDLE, FOLLOW.back);
  return toKeo - Math.atan((2 * FOLLOW.keoOnScreen - 1) * tanHalf(FOLLOW.fov));
}

/**
 * La pose de la caméra qui suit le point `focus` (les pieds de Kéo, lissés), montée de `lift` au-dessus d'un relief ;
 * remplie dans `out` s'il est donné (la vue la refait à chaque image sans rien créer).
 */
export function followPose(focus: Vec3, lift = 0, out?: CameraPose): CameraPose {
  const height = FOLLOW.height + lift;
  const pitch = followPitch(height);
  const pose = out ?? { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: FOLLOW.fov, lens: 0 };
  pose.position.x = focus.x;
  pose.position.y = focus.y + height;
  pose.position.z = focus.z + FOLLOW.back;
  pose.target.x = focus.x;
  pose.target.y = pose.position.y - LOOK_DISTANCE * Math.sin(pitch);
  pose.target.z = pose.position.z - LOOK_DISTANCE * Math.cos(pitch);
  pose.fov = FOLLOW.fov;
  pose.lens = 0;
  return pose;
}

/**
 * La poursuite : la zone morte autour du point suivi, en unités (Kéo peut s'y déplacer sans que l'image bouge), la
 * vitesse du rattrapage (par seconde : la part du retard rattrapée suit 1 − e^(−rate·dt)), et l'écart au-delà duquel
 * la caméra ne rattrape plus mais saute (un trajet passé, un retour de question).
 */
export const FOLLOW_SMOOTHING = { deadZone: 0.8, rate: 8, jump: 12 } as const;

/**
 * Avance le point suivi `focus` vers Kéo (`keo`, ses pieds) pour une image de `dt` secondes ; il est modifié sur place
 * (rien n'est créé à chaque image). Avec « Réduire les animations », ou de trop loin, il saute sur Kéo.
 */
export function followStep(focus: Vec3, keo: Vec3, dt: number, reduceMotion: boolean): void {
  const dx = keo.x - focus.x;
  const dz = keo.z - focus.z;
  const d = Math.hypot(dx, dz);
  if (reduceMotion || d > FOLLOW_SMOOTHING.jump) {
    focus.x = keo.x;
    focus.y = keo.y;
    focus.z = keo.z;
    return;
  }
  const k = 1 - Math.exp(-FOLLOW_SMOOTHING.rate * Math.max(0, dt));
  if (d > FOLLOW_SMOOTHING.deadZone) {
    const pull = ((d - FOLLOW_SMOOTHING.deadZone) * k) / d;
    focus.x += dx * pull;
    focus.z += dz * pull;
  }
  focus.y += (keo.y - focus.y) * k;
}

/**
 * Ce que le relief doit laisser entre la vue et Kéo : la ligne de sa tête à la caméra passe à tant d'unités au moins
 * au-dessus du sol ; les points essayés sur cette ligne ; la montée au plus (au-delà, la falaise gagne : elle n'est
 * jamais plus haute dans le prototype).
 */
const OCCLUSION = { clearance: 0.6, samples: 12, maxLift: 14 } as const;

/**
 * De combien monter la caméra pour que le relief (`ground`, la hauteur du sol en x, z) ne cache pas Kéo, dont les
 * pieds sont en `focus` : 0 le plus souvent. La caméra regarde toujours vers le nord : la ligne reste au-dessus de x.
 */
export function occlusionLift(focus: Vec3, ground: (x: number, z: number) => number): number {
  const head = focus.y + KEO_HEIGHT * 0.8;
  const rise = FOLLOW.height - KEO_HEIGHT * 0.8;
  let need = 0;
  for (let s = 1; s <= OCCLUSION.samples; s++) {
    const t = s / OCCLUSION.samples;
    const g = ground(focus.x, focus.z + t * FOLLOW.back) + OCCLUSION.clearance;
    // La ligne passe à head + t·(rise + lift) : il faut lift ≥ (g − head) / t − rise.
    need = Math.max(need, (g - head) / t - rise);
  }
  return Math.min(need, OCCLUSION.maxLift);
}

/** La montée suit le relief : vite quand il faut monter (Kéo ne reste pas caché), doucement pour redescendre. */
const LIFT_RATE = { up: 8, down: 2 } as const;

/** La montée de la caméra à l'image suivante, vers `target` ; d'un bloc avec « Réduire les animations ». */
export function liftStep(current: number, target: number, dt: number, reduceMotion: boolean): number {
  if (reduceMotion) return target;
  const rate = target > current ? LIFT_RATE.up : LIFT_RATE.down;
  return current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));
}

/**
 * La brume, en unités depuis la caméra : elle commence à `near` et couvre tout à `far` (le large et les lieux loin de
 * Kéo s'y fondent ; seul le repère du lieu suivant la dépasse). Pendant une question, la caméra est plus loin du lieu :
 * la brume s'écarte (`question`).
 */
export const WORLD_FOG = { near: 40, far: 115, question: { near: 160, far: 420 } } as const;

/** Le point de la marque d'un lieu, depuis son pied (son centre au sol) : au-dessus de son sommet. */
export function markOffset(id: PlaceId): Vec3 {
  return { x: 0, y: modelOfPlace(id).top + MARK_LIFT, z: 0 };
}

/** La place d'un point à l'écran, en pixels depuis le coin haut gauche, pour une pose et un écran donnés. */
export function screenOf(pose: CameraPose, p: Vec3, width: number, height: number): { x: number; y: number } {
  const fx = pose.target.x - pose.position.x, fy = pose.target.y - pose.position.y, fz = pose.target.z - pose.position.z;
  const fl = Math.hypot(fx, fy, fz);
  const f = { x: fx / fl, y: fy / fl, z: fz / fl };
  // La droite et le haut de la caméra, sans roulis (le haut est la verticale, comme `lookAt` dans la vue).
  const rl = Math.hypot(f.z, f.x) || 1;
  const right = { x: -f.z / rl, z: f.x / rl };
  const ux = -f.y * f.x, uy = 1 - f.y * f.y, uz = -f.y * f.z;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const rx = p.x - pose.position.x, ry = p.y - pose.position.y, rz = p.z - pose.position.z;
  const depth = rx * f.x + ry * f.y + rz * f.z;
  const half = tanHalf(pose.fov) * depth;
  const sx = (rx * right.x + rz * right.z) / (half * (width / height)) + pose.lens;
  const sy = (rx * ux + ry * uy + rz * uz) / ul / half;
  return { x: ((sx + 1) / 2) * width, y: ((1 - sy) / 2) * height };
}
