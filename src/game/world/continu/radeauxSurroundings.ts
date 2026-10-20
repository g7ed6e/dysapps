/**
 * Les abords de la scénette des Radeaux (GD-22, lot 6 ; intention du directeur artistique du 20 octobre 2026, § 8 : « le
 * plancher du quai, la façade de la cabane et son comptoir derrière, à gauche le bord du premier radeau et sa balance,
 * une racine en arceau qui cadre ; rien de plus »). Le plancher et le marchand sont au décor de la scène (./radeaux5e.ts),
 * la cabane, le quai et les radeaux au lieu lui-même : ce fichier ne pose que ce qui cadre, comme au Hameau, un palétuvier
 * sur la rive derrière la cabane, du côté de la terre, et une racine en arceau au bord de l'eau, de l'autre côté, hors de
 * l'anneau où la rangée des poids se pose quand la caméra tourne. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { mangroveTree, rootArch } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le palétuvier qui cadre, depuis le sol de la scène : au nord, sur la rive, derrière la cabane et à droite d'elle. */
const FRAME_TREE = { dx: -1.2, dz: -8.6, s: 1.1, yaw: 0.8 } as const;

/** La racine en arceau du bord de l'eau, à l'ouest de la cabane, depuis le sol de la scène : ses deux pieds et sa hauteur. */
const WATER_ROOT = { from: [-7.8, -0.4], to: [-9.6, -3.0], h: 1.1 } as const;

/** Les abords des Radeaux, autour du sol de leur scène (`floor`). */
export function radeauxSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  mangroveTree(b, floor.x + FRAME_TREE.dx, floor.z + FRAME_TREE.dz, FRAME_TREE.s, FRAME_TREE.yaw);
  const R = WATER_ROOT;
  rootArch(b, { x: floor.x + R.from[0], z: floor.z + R.from[1] }, { x: floor.x + R.to[0], z: floor.z + R.to[1] }, R.h, 0.3, ground);
}
