/**
 * Les abords de la scénette du Grenier (le Versant du 3e, GD-25 ; proposition du consultant d'Archipéo, § 4). Le grenier,
 * ses sacs, ses mesures, ses casiers et la meule sont au lieu (./grenier3e.ts) : ce fichier ne pose que ce qui cadre,
 * sous le regard de la caméra qui regarde au nord, vers le grenier : à gauche, derrière Kéo, une pile de bûches de bois
 * gris et un bloc bas de granit ; à droite, un autre bloc. Rien en rangée, rien à lire. Le sol est celui du 3e. Code pur.
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

/** La pile de bûches, depuis le sol de la scène : sa place ; les blocs bas : leur place, leur rayon, leur hauteur. */
const LOGS = { dx: -4.6, dz: 0.6 } as const;
const ROCKS = [
  { dx: -5.6, dz: 2.6, r: 0.6, h: 0.35 },
  { dx: 5.2, dz: 1.8, r: 0.7, h: 0.4 },
] as const;

/** Les abords, pour les tests. */
export const GRENIER_SURROUNDINGS = { logs: LOGS, rocks: ROCKS } as const;

/** Les abords du Grenier, autour du sol de sa scène (`floor`). */
export function grenierSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + LOGS.dx,
    z = floor.z + LOGS.dz;
  const g = ground(x, z);
  for (const [i, [dy, dz]] of (
    [
      [0.2, -0.3],
      [0.2, 0.3],
      [0.55, 0],
    ] as const
  ).entries())
    b.drum({ x: x - 0.7, y: g + dy, z: z + dz, yaw: Math.PI / 2 + i * 0.05, pitch: Math.PI / 2 }, 0.2, 1.4, 6, COLORS_3E.woodShade, COLORS_3E.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 61 + k, GRANITE_3E);
  }
}
