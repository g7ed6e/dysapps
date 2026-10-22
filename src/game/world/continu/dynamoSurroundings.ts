/**
 * Les abords de la scénette de la Dynamo (lot 3 du monde ouvert du 4e, l'Épaule ; intention du directeur artistique, § 8 :
 * « la façade, le banc, la dynamo. Rien d'autre »). La façade, la dynamo et le banc sont au lieu (./dynamo4e.ts) : ce
 * fichier ne pose que ce qui cadre, de part et d'autre de Kéo et de l'électricienne, jamais entre eux et la caméra (qui
 * regarde vers l'est-nord-est, depuis l'ouest-sud-ouest) : une caisse de bois fermée à droite de l'électricienne, hors du
 * chemin du pont, et deux pierres grises basses. Le sol est celui du 4e (`heightAt4e`). Aplats francs, une couleur par
 * facette. Code pur.
 */
import { DYNAMO_LAYOUT } from './dynamo4e';
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

/** La caisse fermée, depuis le sol de la scène : sa place, son cap, sa taille. */
const CRATE = { dx: 1.4, dz: 2.6, yaw: 0.35, s: 0.6 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: 3.6, dz: -1.4, r: 0.7, h: 0.35 },
  { dx: 2.6, dz: 1.2, r: 0.55, h: 0.28 },
] as const;

/** Les abords, pour les tests. */
export const DYNAMO_SURROUNDINGS = { crate: CRATE, rocks: ROCKS } as const;

/** Les abords de la Dynamo, autour du sol de sa scène (`floor`). */
export function dynamoSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + CRATE.dx,
    z = floor.z + CRATE.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.05, z, yaw: CRATE.yaw }, [CRATE.s * 1.3, CRATE.s, CRATE.s], DYNAMO_LAYOUT.colors.woodShade, DYNAMO_LAYOUT.colors.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 61 + k, STONE_4E);
  }
}
