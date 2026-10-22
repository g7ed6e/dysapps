/**
 * Les abords de la scénette du Chariot (lot 3 du monde ouvert du 4e ; intention du directeur artistique du 22 octobre
 * 2026, « La scénette »). La cour, l'appentis de l'ingénieure, son établi et le rebord du bassin sont au lieu
 * (./chariot4e.ts) : ce fichier ne pose que ce qui cadre, hors de la cour, de part et d'autre, sous le regard de la caméra
 * qui regarde le bout est du bassin (au nord-est) : deux tonneaux de bois debout contre l'appentis, au sud, et deux
 * pierres basses, de la pierre grise des Passeurs, à l'ouest. Rien en rangée, rien en escalier derrière les poulies. Le sol
 * est celui du 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
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

/** Les tonneaux, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const BARRELS = [
  { dx: 3.9, dz: 2.2, r: 0.34, h: 0.8 },
  { dx: 4.6, dz: 1.7, r: 0.3, h: 0.7 },
] as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -4.4, dz: 1.6, r: 0.7, h: 0.35 },
  { dx: -3.6, dz: -1.6, r: 0.6, h: 0.3 },
] as const;

/** Les abords, pour les tests. */
export const CHARIOT_SURROUNDINGS = { barrels: BARRELS, rocks: ROCKS } as const;

/** Les abords du Chariot, autour du sol de sa scène (`floor`). */
export function chariotSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const k of BARRELS) {
    const x = floor.x + k.dx,
      z = floor.z + k.dz;
    const g = ground(x, z);
    b.prism({ x, y: g - 0.1, z }, k.r, k.r, k.h + 0.1, 8, COLORS_4E.woodShade, COLORS_4E.wood);
  }
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 47 + k, STONE_4E);
  }
}
