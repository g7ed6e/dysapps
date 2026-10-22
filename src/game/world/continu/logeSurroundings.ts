/**
 * Les abords de la scénette de la Loge (lot 3 du monde ouvert du 4e ; intention du directeur artistique du 22 octobre
 * 2026, « La scénette »). La table de coupe, les rouleaux debout et la lanterne du costumier sont à l'appentis
 * (./loge4e.ts) : ce fichier ne pose que ce qui cadre, du côté de Kéo (au nord), sous le regard de la caméra qui regarde
 * le mur de brique de l'appentis (à l'est-sud-est) : deux pièces de toile unie pliées, posées à plat l'une sur l'autre sur
 * la dalle de la cour. Rien de pendu, rien qui se lise comme un corps, rien en escalier. Le sol est celui du 4e
 * (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** La toile unie, au soleil et à l'ombre (celle des rouleaux de l'appentis), et la toile gris-bleu. */
const CLOTH = { light: 0xd2c8b4, shade: 0xb8ae9a, blue: 0x9aa4a8 } as const;

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** Les deux pièces pliées, depuis le sol de la scène : leur place, leur taille, leur tour, leur couleur. */
const FOLDS = [
  { dx: 1.55, dz: -1.35, size: [0.8, 0.14, 0.55], yaw: 0.25, color: CLOTH.light },
  { dx: 1.5, dz: -1.3, size: [0.66, 0.12, 0.46], yaw: 0.45, color: CLOTH.blue },
] as const;

/** Les abords, pour les tests. */
export const LOGE_SURROUNDINGS = { folds: FOLDS } as const;

/** Les abords de la Loge, autour du sol de sa scène (`floor`). */
export function logeSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  let y = -Infinity;
  for (const [k, f] of FOLDS.entries()) {
    const x = floor.x + f.dx,
      z = floor.z + f.dz;
    y = k === 0 ? Math.max(ground(x, z), floor.y) - 0.02 : y;
    b.box({ x, y, z, yaw: f.yaw }, [...f.size], CLOTH.shade, f.color);
    y += f.size[1];
  }
}
