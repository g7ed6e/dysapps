/**
 * Les abords de la scénette de l'Abri (le Versant du 3e, GD-25 ; proposition du consultant d'Archipéo, § 5). L'abri à
 * persiennes, les pluviomètres, le mât, la roue et la table de relevés sont au lieu (./abri3e.ts) : ce fichier ne pose que
 * ce qui cadre, sous le regard de la caméra qui regarde au nord-nord-ouest, vers l'abri : à gauche, derrière Kéo, trois
 * piquets de bois gris couchés l'un sur l'autre et un bloc bas de granit ; à droite, un autre bloc. Rien en rangée, rien
 * à lire. Le sol est celui du 3e. Code pur.
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
const GRANITE_3E: RockTones = {
  light: COLORS_3E.granite,
  shade: COLORS_3E.graniteShade,
  top: COLORS_3E.graniteSun,
};

/** Le sol du 3e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt3e({ x, z }));

/** Les piquets de rechange, depuis le sol de la scène : leur place ; les blocs bas : leur place, leur rayon, leur hauteur. */
const STAKES = { dx: -4.4, dz: 1.2 } as const;
const ROCKS = [
  { dx: -5.4, dz: 3.0, r: 0.55, h: 0.32 },
  { dx: 5.0, dz: 2.2, r: 0.65, h: 0.38 },
] as const;

/** Les abords, pour les tests. */
export const ABRI_SURROUNDINGS = { stakes: STAKES, rocks: ROCKS } as const;

/** Les abords de l'Abri, autour du sol de sa scène (`floor`). */
export function abriSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + STAKES.dx,
    z = floor.z + STAKES.dz;
  const g = ground(x, z);
  for (const [i, [dy, dz]] of (
    [
      [0.06, -0.14],
      [0.06, 0.14],
      [0.18, 0],
    ] as const
  ).entries())
    b.box({ x, y: g + dy - 0.06, z: z + dz, yaw: 0.25 + i * 0.06 }, [1.3, 0.11, 0.11], COLORS_3E.woodShade, COLORS_3E.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 71 + k, GRANITE_3E);
  }
}
