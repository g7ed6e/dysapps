/**
 * Les abords de la scénette de la Porte (lot 2 du monde ouvert du 4e ; intention du directeur artistique, § 6 : la scène
 * dans le cercle des bancs, la caméra vers le portail ouvert). Les bancs, la place, le portail et la salle ronde sont au
 * lieu (./porte4e.ts) : ce fichier ne pose que ce qui cadre, au bord est de la place, derrière la caméra et sur ses
 * côtés : une pile de planches sur deux cales, deux pierres basses de la pierre grise des Passeurs. Rien sur le chemin.
 * Le sol est celui du 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { PORTE_LAYOUT } from './porte4e';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** La pile de planches, depuis le sol de la scène : sa place, son cap, ses planches. */
const PLANKS = { dx: 6.2, dz: 2.8, yaw: 0.3, w: 2.0, d: 0.32, t: 0.08, count: 3 } as const;

/** Les pierres basses, depuis le sol de la scène. */
const ROCKS = [
  { dx: 6.4, dz: -2.6, r: 0.7, h: 0.35 },
  { dx: 1.6, dz: -5.6, r: 0.6, h: 0.3 },
] as const;

/** Les abords, pour les tests. */
export const PORTE_SURROUNDINGS = { planks: PLANKS, rocks: ROCKS } as const;

/** Les abords de la Porte, autour du sol de sa scène (`floor`). */
export function porteSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const P = PLANKS;
  const x = floor.x + P.dx,
    z = floor.z + P.dz;
  const g = ground(x, z);
  for (const side of [-1, 1]) b.box({ x: x + side * 0.7 * Math.cos(P.yaw), y: g - 0.2, z: z - side * 0.7 * Math.sin(P.yaw), yaw: P.yaw + Math.PI / 2 }, [0.9, 0.3, 0.16], PORTE_LAYOUT.wood.side, PORTE_LAYOUT.wood.top);
  for (let k = 0; k < P.count; k++)
    for (const dz of [-0.2, 0.2]) b.box({ x: x + 0.02 * k, y: g + 0.1 + k * P.t, z: z + dz + 0.01 * k, yaw: P.yaw + 0.03 * k }, [P.w, P.t, P.d], PORTE_LAYOUT.wood.side, PORTE_LAYOUT.wood.top);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 41 + k, PORTE_LAYOUT.stone);
  }
}
