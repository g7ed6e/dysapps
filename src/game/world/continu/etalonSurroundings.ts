/**
 * Les abords de la scénette de l'Étalon (lot 2 du monde ouvert du 4e ; intention du directeur artistique, § 7). La cour,
 * la halle, la bascule, le tonneau et les cuves sont au lieu (./etalon4e.ts) : ce fichier ne pose que ce qui cadre, hors
 * de la cour, de part et d'autre, sous le regard de la caméra qui regarde le mur des niches (au nord) : deux caisses de
 * bois gris l'une sur l'autre contre le flanc est de la halle, et deux pierres basses, de la pierre grise des Passeurs.
 * Rien en rangée, rien en escalier derrière les poids (avis dys, 5). Le sol est celui du 4e (`heightAt4e`). Aplats
 * francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { COLORS_4E } from './plan4e';
import type { RockTones } from './surroundingsKit';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** La pierre grise des Passeurs, au 4e. */
const STONE_4E: RockTones = { light: COLORS_4E.stone, shade: COLORS_4E.stoneShade, top: COLORS_4E.stoneSun };

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** Les deux caisses, depuis le sol de la scène : leur place, leur cap, leur côté. */
const CRATES = { dx: 7.3, dz: -2.6, yaw: 0.3, size: 0.9 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -5.6, dz: 3.2, r: 0.7, h: 0.35 },
  { dx: 7.0, dz: 2.4, r: 0.8, h: 0.4 },
] as const;

/** Les abords, pour les tests. */
export const ETALON_SURROUNDINGS = { crates: CRATES, rocks: ROCKS } as const;

/** Les abords de l'Étalon, autour du sol de sa scène (`floor`). */
export function etalonSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const K = CRATES;
  const x = floor.x + K.dx,
    z = floor.z + K.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.2, z, yaw: K.yaw }, [K.size, K.size + 0.2, K.size], COLORS_4E.woodShade, COLORS_4E.wood);
  b.box({ x: x + 0.1, y: g + K.size, z: z + 0.05, yaw: K.yaw + 0.35 }, [K.size * 0.8, K.size * 0.8, K.size * 0.8], COLORS_4E.woodShade, COLORS_4E.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 37 + k, STONE_4E);
  }
}
