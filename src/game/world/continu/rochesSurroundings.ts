/**
 * Les abords de la scénette des Roches (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026, § 4).
 * La salle, la table, les casiers et le pied de la loupe sont au lieu (./roches4e.ts) : ce fichier ne pose que ce qui
 * cadre, sous le regard de la caméra qui regarde au sud-ouest par le côté sud ouvert : au-delà du seuil, une caisse de
 * bois gris pleine de pierres et une pierre basse, de la pierre grise des Passeurs. Rien en rangée. Le sol est celui du
 * 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
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

/** La caisse de pierres, depuis le sol de la scène : sa place, son cap, son côté. */
const CRATE = { dx: -1.4, dz: 2.7, yaw: 0.4, size: 0.8 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [{ dx: 0.8, dz: 3.6, r: 0.6, h: 0.32 }] as const;

/** Les abords, pour les tests. */
export const ROCHES_SURROUNDINGS = { crate: CRATE, rocks: ROCKS } as const;

/** Les abords des Roches, autour du sol de sa scène (`floor`). */
export function rochesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const K = CRATE;
  const x = floor.x + K.dx,
    z = floor.z + K.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.2, z, yaw: K.yaw }, [K.size, K.size * 0.6 + 0.2, K.size * 0.7], COLORS_4E.woodShade, COLORS_4E.stone);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 53 + k, STONE_4E);
  }
}
