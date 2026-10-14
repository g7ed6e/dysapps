// Les cadrages prévus du monde continu (piste B) : un par rivage (./plan6e.ts, `FRAMINGS`), choisi d'après le nœud le
// plus proche de Kéo ; on passe de l'un à l'autre en douceur, la caméra toujours tournée vers le nord, au même angle,
// sans roulis ni secousse. Avec « Réduire les animations », une coupe franche. Code pur : la vue pose la caméra.
import { distance, type Vec2, type Vec3 } from './geometry';
import { PATH_NODES, type Framing, type ShoreId } from './plan6e';

/** L'angle de la caméra sous l'horizon, en radians : le monde vu d'en haut, de biais (le sud en bas de l'écran). */
export const CAMERA_PITCH = (52 * Math.PI) / 180;
/** Le champ vertical de la caméra, en degrés. */
export const CAMERA_FOV = 40;
/** La durée d'un passage d'un cadrage à l'autre, en secondes. */
export const CAMERA_BLEND_SECONDS = 1.4;

/** Une pose de caméra : sa place et le point qu'elle regarde (le haut est toujours la verticale). */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

/** Le rivage où se tient Kéo : celui du nœud le plus proche. */
export function shoreAt(p: Vec2): ShoreId {
  let best = PATH_NODES[0];
  for (const n of PATH_NODES) if (distance(p, n.at) < distance(p, best.at)) best = n;
  return best.shore;
}

/**
 * La pose d'un cadrage pour un écran de rapport `aspect` (largeur sur hauteur) : assez loin pour que le disque de son
 * rayon tienne dans le plus petit des deux champs.
 */
export function poseOf(framing: Framing, aspect: number, groundY = 1): CameraPose {
  const vHalf = ((CAMERA_FOV / 2) * Math.PI) / 180;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const half = Math.min(vHalf, hHalf);
  const dist = framing.radius / Math.sin(half);
  const target = { x: framing.target.x, y: groundY, z: framing.target.z };
  return {
    target,
    position: { x: target.x, y: target.y + dist * Math.sin(CAMERA_PITCH), z: target.z + dist * Math.cos(CAMERA_PITCH) },
  };
}

/** De 0 à 1, lent au départ et à l'arrivée. */
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

const mix = (a: Vec3, b: Vec3, u: number): Vec3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });

/** Un passage d'une pose à une autre : d'où, vers où, depuis quand (en secondes). */
export interface CameraMove {
  from: CameraPose;
  to: CameraPose;
  start: number;
}

/** La pose d'un passage au temps `t` (en secondes) ; avec `reduceMotion`, la pose d'arrivée tout de suite (coupe franche). */
export function poseAt(move: CameraMove, t: number, reduceMotion: boolean): CameraPose {
  if (reduceMotion) return move.to;
  const u = easeInOut(Math.min(1, Math.max(0, (t - move.start) / CAMERA_BLEND_SECONDS)));
  return { position: mix(move.from.position, move.to.position, u), target: mix(move.from.target, move.to.target, u) };
}

