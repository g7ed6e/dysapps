/**
 * Les abords de la scénette de la Forge (lot 2 du monde ouvert du 4e ; intention du directeur artistique, § 8 : « le
 * dallage de la cour, l'établi, des tôles debout contre l'appentis, la bigorne. Rien d'autre »). Le dallage, l'établi,
 * la bigorne et les tôles debout sont au lieu (./forge4e.ts) : ce fichier ne pose que ce qui cadre, hors de la cour, à
 * l'est, derrière l'établi, sous le regard de la caméra (qui regarde vers l'est-sud-est) : une pile de tôles à plat sur
 * deux cales, et deux pierres basses, de la pierre grise des Passeurs. Le sol est celui du 4e (`heightAt4e`). Aplats
 * francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import { FORGE_LAYOUT } from './forge4e';
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

/** La pile de tôles, depuis le sol de la scène : sa place, son cap, ses tôles (largeur, profondeur, épaisseur). */
const SHEETS = { dx: 6.6, dz: -0.6, yaw: 0.25, w: 1.6, d: 1.0, t: 0.07, count: 4 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: 7.2, dz: -3.6, r: 0.8, h: 0.4 },
  { dx: 5.2, dz: 2.8, r: 0.7, h: 0.35 },
] as const;

/** Les abords, pour les tests. */
export const FORGE_SURROUNDINGS = { sheets: SHEETS, rocks: ROCKS } as const;

/** Les abords de la Forge, autour du sol de sa scène (`floor`). */
export function forgeSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const S = SHEETS;
  const x = floor.x + S.dx,
    z = floor.z + S.dz;
  const g = ground(x, z);
  for (const side of [-1, 1]) b.box({ x: x + side * 0.55 * Math.cos(S.yaw), y: g - 0.3, z: z - side * 0.55 * Math.sin(S.yaw), yaw: S.yaw }, [0.18, 0.42, S.d], COLORS_4E.woodShade, COLORS_4E.wood);
  for (let k = 0; k < S.count; k++)
    b.box({ x: x + 0.03 * k, y: g + 0.12 + k * S.t, z: z + 0.02 * k, yaw: S.yaw + 0.04 * k }, [S.w, S.t, S.d], FORGE_LAYOUT.sheet.shade, FORGE_LAYOUT.sheet.top);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 31 + k, STONE_4E);
  }
}
