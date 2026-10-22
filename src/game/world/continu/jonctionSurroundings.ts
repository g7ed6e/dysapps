/**
 * Les abords de la scénette de la Jonction (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026,
 * § 5). Les voies, leur ballast et le heurtoir sont au lieu et aux rails (./jonction4e.ts, ./paths4e.ts) : ce fichier ne
 * pose que ce qui cadre, sous le regard de la caméra qui regarde à l'ouest-sud-ouest : à gauche, une caisse de bois gris
 * pleine de ballast et une pierre basse ; au fond, une autre pierre, de la pierre grise des Passeurs. Rien en rangée,
 * rien sur une voie. Le sol est celui du 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
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

/** La caisse de ballast, depuis le sol de la scène : sa place, son cap, son côté. */
const CRATE = { dx: -1.55, dz: 3.33, yaw: 0.4, size: 0.8 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -0.32, dz: 3.52, r: 0.6, h: 0.32 },
  { dx: -3.63, dz: 0.26, r: 0.7, h: 0.35 },
] as const;

/** Les abords, pour les tests. */
export const JONCTION_SURROUNDINGS = { crate: CRATE, rocks: ROCKS } as const;

/** Les abords de la Jonction, autour du sol de sa scène (`floor`). */
export function jonctionSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const K = CRATE;
  const x = floor.x + K.dx,
    z = floor.z + K.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.2, z, yaw: K.yaw }, [K.size, K.size * 0.6 + 0.2, K.size * 0.7], COLORS_4E.woodShade, COLORS_4E.ballast);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 61 + k, STONE_4E);
  }
}
