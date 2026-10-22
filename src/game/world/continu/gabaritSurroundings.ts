/**
 * Les abords de la scénette du Gabarit (lot 3 du monde ouvert du 4e ; intention du directeur artistique du 22 octobre
 * 2026, « La scénette »). L'abri du géomètre, sa table à dessin et le mur de l'atelier sont au lieu (./gabarit4e.ts) : ce
 * fichier ne pose que ce qui cadre, hors de la cour, de part et d'autre, sous le regard de la caméra qui regarde l'abri (à
 * l'est-nord-est) : trois blocs de pierre taillée posés au nord de l'abri, prêts pour l'atelier, et deux pierres basses, de
 * la pierre grise des Passeurs. Rien en rangée, rien en escalier derrière les piquets. Le sol est celui du 4e
 * (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
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

/** Les blocs taillés, depuis le sol de la scène : leur place, leur cap, leur taille. */
const BLOCKS = { dx: 1.4, dz: -4.2, yaw: 0.35, size: 0.8 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -2.6, dz: 3.8, r: 0.7, h: 0.35 },
  { dx: -3.4, dz: -2.6, r: 0.8, h: 0.4 },
] as const;

/** Les abords, pour les tests. */
export const GABARIT_SURROUNDINGS = { blocks: BLOCKS, rocks: ROCKS } as const;

/** Les abords du Gabarit, autour du sol de sa scène (`floor`). */
export function gabaritSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const K = BLOCKS;
  const x = floor.x + K.dx,
    z = floor.z + K.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.2, z, yaw: K.yaw }, [K.size * 1.6, K.size * 0.7 + 0.2, K.size], COLORS_4E.stoneShade, COLORS_4E.stoneSun);
  b.box({ x: x + 1.3, y: g - 0.2, z: z + 0.2, yaw: K.yaw - 0.2 }, [K.size * 1.2, K.size * 0.6 + 0.2, K.size], COLORS_4E.stoneShade, COLORS_4E.stone);
  b.box({ x: x + 0.3, y: g + K.size * 0.7, z: z - 0.05, yaw: K.yaw + 0.25 }, [K.size * 1.1, K.size * 0.55, K.size * 0.8], COLORS_4E.stoneShade, COLORS_4E.stoneSun);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 41 + k, STONE_4E);
  }
}
