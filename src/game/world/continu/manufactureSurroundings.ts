/**
 * Les abords de la scénette de la Manufacture (lot 3 du monde ouvert du 4e ; intention du directeur artistique du 22
 * octobre 2026, « La scénette »). Le dallage de la halle, le métier à bras, le banc et le panier du tisserand sont au lieu
 * (./manufacture4e.ts) : ce fichier ne pose que ce qui cadre, dans la travée ouest, du côté de Kéo (au sud), sous le
 * regard de la caméra qui regarde le pignon de brique pleine (à l'ouest) : deux pièces de toile unie roulées, couchées
 * l'une sur l'autre contre le pignon. Rien en rangée, rien en escalier derrière les bobines. Le sol est celui du 4e
 * (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** La toile unie, au soleil et à l'ombre (celle de la panière de la cour). */
const CLOTH = { light: 0xd2c8b4, shade: 0xb8ae9a } as const;

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** Les deux pièces de toile, depuis le sol de la scène : leur place, leur rayon, leur longueur (le long de z). */
const BOLTS = [
  { dx: -1.45, dz: 2.6, r: 0.2, l: 1.3, lift: 0 },
  { dx: -1.4, dz: 2.65, r: 0.18, l: 1.2, lift: 0.36 },
] as const;

/** Les abords, pour les tests. */
export const MANUFACTURE_SURROUNDINGS = { bolts: BOLTS } as const;

/** Les abords de la Manufacture, autour du sol de sa scène (`floor`). */
export function manufactureSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const k of BOLTS) {
    const x = floor.x + k.dx,
      z = floor.z + k.dz;
    const y = Math.max(ground(x, z), floor.y) + k.r + k.lift;
    b.drum({ x, y, z: z - k.l / 2, pitch: Math.PI / 2 }, k.r, k.l, 6, CLOTH.shade, CLOTH.light);
  }
}
