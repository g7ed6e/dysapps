/**
 * Les abords de la scénette de la Croisée (GD-22, lot 7 ; intention du directeur artistique du 20 octobre 2026, § 8 : « le
 * palier de la jumelle droite sur son palétuvier, et une racine en arceau à l'ouest. Rien de plus »). Le plancher et la
 * cordière sont au décor de la scène (./croisee5e.ts) ; le tronc, la cabane, la plateforme, la fourche, ses paliers et
 * leurs palétuviers au lieu lui-même, qui se voit pendant la scénette : ce fichier ne pose que la racine en arceau du
 * bord de l'eau, à l'ouest, hors de l'anneau où la rangée des bobines se pose quand la caméra tourne. Le sol est celui du
 * 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { rootArch } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** La racine en arceau du bord de l'eau, à l'ouest, depuis le sol de la scène : ses deux pieds et sa hauteur. */
const WEST_ROOT = { from: [-11, -2.35], to: [-12, -5.35], h: 1.2 } as const;

/** Les abords de la Croisée, autour du sol de sa scène (`floor`). */
export function croiseeSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const R = WEST_ROOT;
  rootArch(b, { x: floor.x + R.from[0], z: floor.z + R.from[1] }, { x: floor.x + R.to[0], z: floor.z + R.to[1] }, R.h, 0.32, ground);
}
