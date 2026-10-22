/**
 * Les abords de la scénette du Jardin (le Versant du 3e, GD-25 ; proposition du consultant d'Archipéo, § 6). Les carrés,
 * le mur des espaliers, la fontaine, le séchoir et le mortier sont au lieu (./jardin3e.ts) : ce fichier ne pose que ce qui
 * cadre, sous le regard de la caméra qui regarde au nord, vers le mur : à gauche, derrière Kéo, trois pots de terre vides
 * retournés en pile et un bloc bas de granit ; à droite, un autre bloc. Rien en rangée, rien à lire. Le sol est celui du
 * 3e. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { COLORS_3E } from './plan3e';
import type { RockTones } from './surroundingsKit';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

/** Le granit bleuté des Passeurs, au 3e. */
const GRANITE_3E: RockTones = { light: COLORS_3E.granite, shade: COLORS_3E.graniteShade, top: COLORS_3E.graniteSun };

/** Le sol du 3e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt3e({ x, z }));

/** La terre cuite des pots, celle des réponses (./jardin3e.ts), et le fond retourné, au soleil. */
const POT = 0xa8755a;
const POT_TOP = 0xb98a6e;

/** La pile de pots vides, depuis le sol de la scène : sa place ; les blocs bas : leur place, leur rayon, leur hauteur. */
const POTS = { dx: -3.6, dz: 1.7 } as const;
const ROCKS = [
  { dx: -5.4, dz: 3.2, r: 0.55, h: 0.32 },
  { dx: 5.0, dz: 2.6, r: 0.65, h: 0.38 },
] as const;

/** Les abords, pour les tests. */
export const JARDIN_SURROUNDINGS = { pots: POTS, rocks: ROCKS } as const;

/** Les abords du Jardin, autour du sol de sa scène (`floor`). */
export function jardinSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + POTS.dx,
    z = floor.z + POTS.dz;
  const g = ground(x, z);
  // Trois pots retournés : deux côte à côte, le troisième dessus.
  for (const [dx, dy] of [
    [-0.17, 0],
    [0.17, 0],
    [0, 0.24],
  ] as const)
    b.prism({ x: x + dx, y: g + dy - 0.02, z }, 0.16, 0.11, 0.24, 7, POT, POT_TOP);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 81 + k, GRANITE_3E);
  }
}
