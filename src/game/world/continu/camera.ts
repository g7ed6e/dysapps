// Les cadrages prévus du monde continu (piste B) : un par rivage (./plan6e.ts, `FRAMINGS`), choisi d'après le nœud le
// plus proche de Kéo, la caméra toujours tournée vers le nord, au même angle, sans roulis. Code pur : la vue pose la
// caméra.
import { distance, type Vec2, type Vec3 } from './geometry';
import { PATH_NODES, type Framing, type ShoreId } from './plan6e';

/** L'angle de la caméra sous l'horizon, en radians : le monde vu d'en haut, de biais (le sud en bas de l'écran). */
export const CAMERA_PITCH = (52 * Math.PI) / 180;
/** Le champ vertical de la caméra, en degrés. */
export const CAMERA_FOV = 40;

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
