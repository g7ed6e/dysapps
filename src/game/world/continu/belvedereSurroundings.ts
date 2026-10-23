/**
 * Les abords de la scénette du Belvédère (le Versant du 3e, GD-25 ; proposition du consultant d'Archipéo, § 3). La
 * terrasse, son muret, le gnomon, les solides et l'abri de la topographe sont au lieu (./belvedere3e.ts) : ce fichier ne
 * pose que ce qui cadre, sous le regard de la caméra qui regarde au nord-ouest, vers le gnomon, le pic et le Fanal :
 * au-delà du muret, à gauche, deux blocs bas de granit dans l'herbe ; à droite, un troisième. Rien en rangée, rien à lire.
 * Le sol est celui du 3e (`heightAt3e`). Aplats francs, une couleur par facette. Code pur.
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

/** Les blocs bas, depuis le sol de la scène : leur place, leur rayon, leur hauteur ; tous hors de la terrasse. */
const ROCKS = [
  { dx: -9.4, dz: -5.6, r: 0.8, h: 0.45 },
  { dx: -11.2, dz: -2.4, r: 0.55, h: 0.3 },
  { dx: 5.6, dz: -5.4, r: 0.7, h: 0.4 },
] as const;

/** Les abords, pour les tests. */
export const BELVEDERE_SURROUNDINGS = { rocks: ROCKS } as const;

/** Les abords du Belvédère, autour du sol de sa scène (`floor`). */
export function belvedereSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const [k, r] of ROCKS.entries()) {
    const x = floor.x + r.dx,
      z = floor.z + r.dz;
    lowRock(b, { x, y: ground(x, z), z }, r.r, r.h, 53 + k, GRANITE_3E);
  }
}
