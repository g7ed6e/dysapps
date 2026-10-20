/**
 * Les abords de la scénette des Instants (GD-22, lot 8 ; intention du directeur artistique du 20 octobre 2026, § 7 : « le
 * plancher de l'abri, une pierre gravée derrière, une touffe de roseaux qui cadre ; rien de plus »). Le plancher est le
 * débarcadère du lieu, la pierre gravée sa première pierre, l'abri et le tailleur derrière, à droite (./instants5e.ts) :
 * ce fichier ne pose que ce qui cadre, deux touffes de roseaux droits à l'est du débarcadère, hors de l'anneau où la
 * rangée des galets se pose quand la caméra tourne. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { reeds } from './instants5e';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Les touffes qui cadrent, depuis le sol de la scène (`dx`, `dz`, hauteur) : à droite du tailleur, un peu en arrière. */
const FRAME_REEDS = [
  [5.3, -0.4, 1.6],
  [6.1, 0.5, 1.3],
] as const;

/** Les abords des Instants, autour du sol de leur scène (`floor`). */
export function instantsSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  FRAME_REEDS.forEach(([dx, dz, h], i) => {
    const x = floor.x + dx,
      z = floor.z + dz;
    reeds(b, { x, y: ground(x, z), z }, 51 + i, h);
  });
}
