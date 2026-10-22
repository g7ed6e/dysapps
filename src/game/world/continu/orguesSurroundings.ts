/**
 * Les abords de la scénette des Orgues (lot 3 du monde ouvert du 4e, l'Épaule ; intention du directeur artistique, § 8 :
 * « le dallage, l'abri, son auvent. Rien d'autre »). Le dallage et l'abri sont au lieu (./orgues4e.ts) : ce fichier ne
 * pose que ce qui cadre, de part et d'autre de Kéo et du carrier, jamais entre eux et la caméra (qui regarde vers le
 * nord-ouest, vers le front, depuis le sud-est) : un bloc hexagonal bas à gauche de Kéo, un autre à droite du carrier,
 * du basalte des colonnes, et une pierre grise basse. Rien au sud de z = 5,5. Aplats francs, une couleur par facette.
 * Code pur.
 */
import { hexColumn } from './epauleKit';
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { ORGUES_LAYOUT } from './orgues4e';
import type { RockTones } from './surroundingsKit';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const L = ORGUES_LAYOUT;

/** La pierre grise des Passeurs, au 4e. */
const STONE_4E: RockTones = { light: L.colors.stone, shade: L.colors.stoneShade, top: L.colors.stoneSun };

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** Les blocs hexagonaux bas, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const BLOCKS = [
  { dx: -2.8, dz: 2.5, r: 0.6, h: 0.55 },
  { dx: 2.4, dz: -0.2, r: 0.55, h: 0.75 },
] as const;

/** La pierre basse, depuis le sol de la scène. */
const ROCK = { dx: -3.4, dz: 1.2, r: 0.6, h: 0.3 } as const;

/** Les abords, pour les tests. */
export const ORGUES_SURROUNDINGS = { blocks: BLOCKS, rock: ROCK } as const;

/** Les abords des Orgues, autour du sol de sa scène (`floor`). */
export function orguesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const [k, o] of BLOCKS.entries()) {
    const x = floor.x + o.dx,
      z = floor.z + o.dz;
    const g = ground(x, z);
    hexColumn(b, x, z, o.r, 0.4 * k, g - 0.3, () => g + o.h, [L.colors.column, L.colors.columnJoint], L.colors.columnSun);
  }
  const x = floor.x + ROCK.dx,
    z = floor.z + ROCK.dz;
  lowRock(b, { x, y: ground(x, z), z }, ROCK.r, ROCK.h, 51, STONE_4E);
}
