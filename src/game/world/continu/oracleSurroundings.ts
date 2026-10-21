/**
 * Les abords de la scénette de l'Oracle (GD-22, lot 13b ; intention du directeur artistique du 20 octobre 2026, M : « le
 * décor de près : la grotte. Le fond de l'abri avec ses panneaux, le bassin, un montant du porche ; les deux retours de
 * roche cadrent »). Le plancher est le sol de l'abri, le fond, les retours, le bassin et le conteur sont au lieu et au
 * décor de la scène (./oracle5e.ts) : ce fichier ne pose que ce qui cadre, comme au Hameau, un élément de chaque côté,
 * au pied de la paroi, hors de la bouche : un rocher bas à facettes à l'ouest et un buisson sec en dôme à l'est, entre la
 * perche du conteur et le signe de l'absence, sans le couvrir. Tous deux restent bas. Le sol est celui du 5e
 * (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import { dryBush } from './fumerolles5e';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le rocher bas de l'ouest, depuis le sol de la scène : sa place, son rayon, sa hauteur. */
const WEST_ROCK = { dx: -4.1, dz: 1.2, r: 0.6, h: 0.38 } as const;

/** Le buisson sec de l'est, depuis le sol de la scène : sa place, sa taille. */
const EAST_BUSH = { dx: 6.7, dz: 1.0, s: 0.45 } as const;

/** Les abords, pour les tests. */
export const ORACLE_SURROUNDINGS = { rock: WEST_ROCK, bush: EAST_BUSH } as const;

/** Les abords de l'Oracle, autour du sol de sa scène (`floor`). */
export function oracleSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const r = { x: floor.x + WEST_ROCK.dx, z: floor.z + WEST_ROCK.dz };
  lowRock(b, { x: r.x, y: ground(r.x, r.z), z: r.z }, WEST_ROCK.r, WEST_ROCK.h, 19);
  const e = { x: floor.x + EAST_BUSH.dx, z: floor.z + EAST_BUSH.dz };
  dryBush(b, e.x, ground(e.x, e.z), e.z, EAST_BUSH.s, 0.3);
}
