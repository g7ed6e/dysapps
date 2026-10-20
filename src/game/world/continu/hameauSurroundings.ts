/**
 * Les abords de la scénette du Hameau (GD-22, lot 5 ; intention du directeur artistique du 20 octobre 2026, § 5 : « le
 * plancher du ponton, la bouche du four derrière, une racine qui cadre ; rien de plus »). Le plancher et le boulanger
 * sont au décor de la scène (./hameau5e.ts), le four, les maisons et le ponton au lieu lui-même : ce fichier ne pose que
 * ce qui cadre, un palétuvier sur ses racines à l'est, hors de l'anneau où la rangée des miches se pose quand la caméra
 * tourne, et une racine en arceau au bord de l'eau, à l'ouest. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { mangroveTree, rootArch } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le palétuvier qui cadre, depuis le sol de la scène : à l'est, derrière la maison du boulanger. */
const FRAME_TREE = { dx: 10.4, dz: 1.2, s: 1.1, yaw: 2.6 } as const;

/** La racine en arceau du bord de l'eau, à l'ouest, depuis le sol de la scène : ses deux pieds et sa hauteur. */
const WEST_ROOT = { from: [-8.2, 3.8], to: [-10.2, 1.6], h: 1.1 } as const;

/** Les abords du Hameau, autour du sol de sa scène (`floor`). */
export function hameauSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  mangroveTree(b, floor.x + FRAME_TREE.dx, floor.z + FRAME_TREE.dz, FRAME_TREE.s, FRAME_TREE.yaw);
  const R = WEST_ROOT;
  rootArch(b, { x: floor.x + R.from[0], z: floor.z + R.from[1] }, { x: floor.x + R.to[0], z: floor.z + R.to[1] }, R.h, 0.3, ground);
}
