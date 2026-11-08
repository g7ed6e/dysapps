// Le chemin d'une caméra entre deux poses (la vue finale du 3e, GD-25 : ./finalView3e.ts ; les veillées, GD-23 :
// ./vigil.ts) : la caméra glisse de l'une à l'autre, son regard tourne de l'un à l'autre par le plus court, sans jamais
// passer par un point proche (le regard ne plonge pas en route), et le mouvement s'adoucit au départ et à l'arrivée
// (jamais d'à-coup : avis du référent dys sur le vertige). Code pur, sans Three.js.
import type { CameraPose } from './camera';
import { smoothstep, type Vec3 } from './geometry';

/** Une pose du chemin : d'où la caméra regarde, et ce qu'elle regarde. */
export interface Shot {
  readonly position: Vec3;
  readonly target: Vec3;
}

/** La part du chemin entre les instants `a` et `b`, à l'instant `t`, adoucie au départ et à l'arrivée. */
export const ease = (a: number, b: number, t: number): number => smoothstep(a, b, t);

/** Copie `a` + (`b` − `a`)·`u` dans `out`. */
function mix(out: Vec3, a: Vec3, b: Vec3, u: number): void {
  out.x = a.x + (b.x - a.x) * u;
  out.y = a.y + (b.y - a.y) * u;
  out.z = a.z + (b.z - a.z) * u;
}

/** Le cap (depuis +z, vers +x), la pente sous l'horizon et la portée du regard d'une pose. */
function aimOf(p: Shot): { yaw: number; pitch: number; reach: number } {
  const dx = p.target.x - p.position.x,
    dy = p.target.y - p.position.y,
    dz = p.target.z - p.position.z;
  const flat = Math.hypot(dx, dz);
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(-dy, flat), reach: Math.hypot(flat, dy) };
}

/**
 * La pose entre `a` et `b` à la part `u` (de 0 à 1), remplie dans `out` : la caméra glisse de l'une à l'autre ; son
 * regard tourne de l'un à l'autre (le cap par le plus court, la pente), la portée du regard aussi.
 */
export function between(out: CameraPose, a: Shot, b: Shot, u: number): void {
  mix(out.position, a.position, b.position, u);
  const A = aimOf(a),
    B = aimOf(b);
  const yaw = A.yaw + Math.atan2(Math.sin(B.yaw - A.yaw), Math.cos(B.yaw - A.yaw)) * u;
  const pitch = A.pitch + (B.pitch - A.pitch) * u;
  const reach = A.reach + (B.reach - A.reach) * u;
  out.target.x = out.position.x + Math.sin(yaw) * Math.cos(pitch) * reach;
  out.target.y = out.position.y - Math.sin(pitch) * reach;
  out.target.z = out.position.z + Math.cos(yaw) * Math.cos(pitch) * reach;
}

/**
 * Un script de caméra que la scène joue à la place de la caméra qui suit (la vue finale du 3e, une veillée) : sa durée,
 * sa pose à chaque instant depuis la pose `from` de la caméra au moment où il commence, et ce que dure son image fixe
 * avec « Réduire les animations ».
 */
export interface CameraScript {
  readonly seconds: number;
  readonly still: number;
  pose(t: number, from: CameraPose, out: CameraPose, still?: boolean): CameraPose;
}
