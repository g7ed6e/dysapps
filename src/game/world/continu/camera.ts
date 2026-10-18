// La caméra du monde continu (piste 1, lot 1, choix du mainteneur du 14 octobre 2026) : elle suit Kéo de trois quarts,
// de 4 à 5 m de haut et 6 m derrière lui, tournée vers le nord par défaut, jamais de roulis ; depuis le 18 octobre 2026
// (GD-20, « Le déplacement libre », rotation libre, piste 1), l'élève la tourne autour de Kéo (`yaw`) ; Kéo y tient
// environ un sixième de la hauteur de l'écran, un peu sous le milieu, et le haut de l'image garde l'horizon, où le
// repère du lieu suivant dépasse la brume. Elle ne bouge pas tant que Kéo reste dans une petite zone morte, puis le
// rattrape en douceur ; avec « Réduire les animations », elle le suit d'un bloc (coupe franche). Si le relief passe
// entre elle et Kéo, elle monte juste assez pour le voir. La caméra d'une scénette (./scenette.ts) garde le champ de
// toujours (`CAMERA_FOV`). Code pur : la vue pose la caméra.
import type { Vec3 } from './geometry';
import type { PlaceId } from './plan6e';
import { modelOfPlace } from './places';

/** Le champ vertical de la caméra d'une scénette, en degrés. */
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

/**
 * L'angle sous l'horizon d'une caméra à `height` au-dessus des pieds de Kéo et `back` derrière lui : son milieu reste à
 * `keoOnScreen`.
 */
function followPitch(height: number, back: number = FOLLOW.back): number {
  const toKeo = Math.atan2(height - KEO_MIDDLE, back);
  return toKeo - Math.atan((2 * FOLLOW.keoOnScreen - 1) * tanHalf(FOLLOW.fov));
}

/** Un angle ramené entre −π et π (le plus court chemin d'une rotation). */
export const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * La vue d'un Détour (GD-20, déplacement libre, lot 2) : Kéo arrêté sur un Détour, la caméra monte de `height` et
 * recule jusqu'à `back` fois sa distance (référent dys : 1,6 au plus), sans tourner ; elle monte en `up` secondes et
 * revient en `down`, d'un coup avec « Réduire les animations ».
 */
const DETOUR_VIEW = { height: 8, back: 1.6, up: 1.2, down: 0.8 } as const;

/**
 * La pose de la caméra qui suit le point `focus` (les pieds de Kéo, lissés), montée de `lift` au-dessus d'un relief,
 * tournée de `yaw` autour de lui (en radians, depuis le sud : 0 au sud, tournée vers le nord ; π/2 à l'est, tournée
 * vers l'ouest), et montée de la part `rise` de la vue d'un Détour (0 : la caméra qui suit, 1 : toute la vue) ; remplie
 * dans `out` s'il est donné (la vue la refait à chaque image sans rien créer).
 */
export function followPose(focus: Vec3, lift = 0, out?: CameraPose, yaw = 0, rise = 0): CameraPose {
  const height = FOLLOW.height + lift + DETOUR_VIEW.height * rise;
  const back = FOLLOW.back * (1 + (DETOUR_VIEW.back - 1) * rise);
  const pitch = followPitch(height, back);
  const pose = out ?? { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: FOLLOW.fov, lens: 0 };
  const bx = Math.sin(yaw);
  const bz = Math.cos(yaw);
  pose.position.x = focus.x + back * bx;
  pose.position.y = focus.y + height;
  pose.position.z = focus.z + back * bz;
  pose.target.x = pose.position.x - LOOK_DISTANCE * Math.cos(pitch) * bx;
  pose.target.y = pose.position.y - LOOK_DISTANCE * Math.sin(pitch);
  pose.target.z = pose.position.z - LOOK_DISTANCE * Math.cos(pitch) * bz;
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
 * pieds sont en `focus`, la caméra tournée de `yaw` : 0 le plus souvent.
 */
export function occlusionLift(focus: Vec3, ground: (x: number, z: number) => number, yaw = 0): number {
  const bx = Math.sin(yaw);
  const bz = Math.cos(yaw);
  const head = focus.y + KEO_HEIGHT * 0.8;
  const rise = FOLLOW.height - KEO_HEIGHT * 0.8;
  let need = 0;
  for (let s = 1; s <= OCCLUSION.samples; s++) {
    const t = s / OCCLUSION.samples;
    const g = ground(focus.x + t * FOLLOW.back * bx, focus.z + t * FOLLOW.back * bz) + OCCLUSION.clearance;
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
 * Le regard levé (lot 2, choix du directeur artistique) : Kéo arrêté à moins de `within` unités du Phare, la caméra
 * lève le regard pour faire entrer la lanterne avec un peu d'air au-dessus (`air`, en part de la hauteur de l'écran),
 * sans reculer ; Kéo reste entier au-dessus de « Y aller » (ses pieds à `footRoom` pixels au moins du bas de l'écran : le
 * bouton, 72 px avec sa marge, et un peu d'air ; sur la capture de la tablette, une dizaine de pixels entre les
 * semelles et le haut du bouton). Si les deux ne tiennent pas, la caméra descend un peu, jusqu'à `lowest` unités au-dessus des
 * pieds de Kéo (le regard moins plongeant : retour du directeur artistique), puis l'air de la lanterne se réduit
 * jusqu'à `minAir` ; Kéo passe toujours avant la lanterne. Jamais pendant la marche ; le passage dure `seconds` à la
 * montée, `down` au retour (d'un bloc avec « Réduire les animations »).
 */
export const LOOK_UP = { within: 24, air: 0.08, minAir: 0.02, footRoom: 78, lowest: 2.4, seconds: 0.8, down: 0.4 } as const;

/**
 * Lève le regard de `pose` (remplie sur place) de la part `amount` (0 : la caméra qui suit, 1 : le regard levé) pour
 * que `top` (le haut de la lanterne) entre à l'écran ; les pieds de Kéo (`feet`) restent au-dessus du bas de l'écran
 * de `footRoom` pixels, sur un écran de `height` pixels. La caméra garde sa direction et ne recule pas : seuls sa
 * hauteur et son angle sous l'horizon changent.
 */
export function lookUp(pose: CameraPose, top: Vec3, feet: Vec3, amount: number, height: number): void {
  if (amount <= 0) return;
  const p = pose.position;
  const y0 = p.y;
  // La direction du regard, à plat (vers le nord quand la caméra n'est pas tournée).
  const flat = Math.hypot(pose.target.x - p.x, pose.target.z - p.z) || 1e-9;
  const fx = (pose.target.x - p.x) / flat;
  const fz = (pose.target.z - p.z) / flat;
  const pitch0 = Math.atan2(y0 - pose.target.y, flat);
  const t = tanHalf(pose.fov);
  const dTop = Math.max(0.1, (top.x - p.x) * fx + (top.z - p.z) * fz);
  const dFeet = Math.max(0.1, (feet.x - p.x) * fx + (feet.z - p.z) * fz);
  // L'angle le plus bas, sous l'axe, où les pieds restent au-dessus de « Y aller ».
  const feetMax = Math.atan((1 - 2 * Math.min(0.45, LOOK_UP.footRoom / Math.max(1, height))) * t);
  // Le regard qui met la lanterne à `air` du haut de l'écran, d'une caméra à la hauteur `y`, et l'angle des pieds.
  const solve = (y: number, air: number) => ({ pitch: Math.atan((1 - 2 * air) * t) - Math.atan2(top.y - y, dTop), feet: Math.atan2(y - feet.y, dFeet) });
  const low = Math.min(y0, feet.y + LOOK_UP.lowest);
  const STEPS = 16;
  let found: { y: number; pitch: number } | null = null;
  for (let k = 0; k <= STEPS && !found; k++) {
    const y = y0 + ((low - y0) * k) / STEPS;
    const s = solve(y, LOOK_UP.air);
    if (s.feet - s.pitch <= feetMax) found = { y, pitch: s.pitch };
  }
  for (let k = 1; k <= STEPS && !found; k++) {
    const s = solve(low, LOOK_UP.air + ((LOOK_UP.minAir - LOOK_UP.air) * k) / STEPS);
    if (s.feet - s.pitch <= feetMax) found = { y: low, pitch: s.pitch };
  }
  if (!found) {
    const s = solve(low, LOOK_UP.minAir);
    found = { y: low, pitch: s.feet - feetMax };
  }
  // La lanterne est déjà à l'écran : rien ne change (le regard ne baisse jamais).
  if (found.y === y0 && found.pitch >= pitch0) return;
  // Un départ et une arrivée en douceur.
  const u = Math.min(1, amount);
  const k = u * u * (3 - 2 * u);
  const a = pitch0 + (found.pitch - pitch0) * k;
  p.y = y0 + (found.y - y0) * k;
  pose.target.x = p.x + LOOK_DISTANCE * Math.cos(a) * fx;
  pose.target.y = p.y - LOOK_DISTANCE * Math.sin(a);
  pose.target.z = p.z + LOOK_DISTANCE * Math.cos(a) * fz;
}

/**
 * L'avancée de la vue d'un Détour à l'image suivante, vers `wanted` (0 ou 1), de façon linéaire ; d'un bloc avec
 * « Réduire les animations ». La vue en prend `detourRise` (un départ franc, une arrivée douce).
 */
export function detourViewStep(current: number, wanted: 0 | 1, dt: number, reduceMotion: boolean): number {
  if (reduceMotion) return wanted;
  const step = Math.max(0, dt) / (wanted > current ? DETOUR_VIEW.up : DETOUR_VIEW.down);
  return wanted > current ? Math.min(1, current + step) : Math.max(0, current - step);
}

/** La part de la vue d'un Détour pour une avancée `t` (de 0 à 1) : elle ralentit en arrivant (référent dys). */
export const detourRise = (t: number): number => t * (2 - t);

/** La part du regard levé à l'image suivante, vers `wanted` (0 ou 1) ; d'un bloc avec « Réduire les animations ». */
export function lookUpStep(current: number, wanted: 0 | 1, dt: number, reduceMotion: boolean): number {
  if (reduceMotion) return wanted;
  const step = Math.max(0, dt) / (wanted > current ? LOOK_UP.seconds : LOOK_UP.down);
  return wanted > current ? Math.min(1, current + step) : Math.max(0, current - step);
}

/**
 * La brume, en unités depuis la caméra : elle commence à `near` et couvre tout à `far` (le large et les lieux loin de
 * Kéo s'y fondent ; seul le repère du lieu suivant la dépasse). Une scénette la garde : sa caméra est près.
 */
export const WORLD_FOG = { near: 40, far: 115 } as const;

/**
 * Les lieux dont la marque se pose à côté de leur sommet, à droite, plutôt qu'au-dessus : le Phare, dont la lanterne
 * reste ainsi à découvert (retour du directeur artistique, lot 2). Le point est au bord de la lanterne, sous son toit.
 */
const MARK_BESIDE: Partial<Record<PlaceId, { x: number; drop: number }>> = { phare: { x: 1.5, drop: 1.4 } };

/** La marque d'un lieu se pose-t-elle à côté de son sommet (à droite du point) ? */
export const markBeside = (id: PlaceId): boolean => id in MARK_BESIDE;

/** Le point de la marque d'un lieu, depuis son pied (son centre au sol) : au-dessus de son sommet, ou à côté. */
export function markOffset(id: PlaceId): Vec3 {
  const beside = MARK_BESIDE[id];
  if (beside) return { x: beside.x, y: modelOfPlace(id).top - beside.drop, z: 0 };
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

/**
 * Un point tourné de `angle` autour de l'axe vertical qui passe par `pivot` (sa hauteur gardée), dans le sens de la
 * caméra qui suit Kéo (`occlusionLift`) : un point au sud du pivot (vers +z) passe en (sin a, cos a) de lui. La caméra
 * d'une scénette tourne ainsi autour de son point visé (« caméra libre », lot commun des scénettes).
 */
export function orbitAround(point: Vec3, pivot: Vec3, angle: number): Vec3 {
  const dx = point.x - pivot.x;
  const dz = point.z - pivot.z;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: pivot.x + dx * c + dz * s, y: point.y, z: pivot.z - dx * s + dz * c };
}
