/**
 * Les abords de la scénette du Donjon (GD-22, lot 13a ; intention du directeur artistique du 20 octobre 2026, E : « le
 * pavé devant le logis, sa façade et sa porte derrière ; à gauche, le pied du piton et le bas des marches. La tour monte,
 * coupée par le haut du cadre. Rien de plus »). Le plancher est la cour du lieu, la façade, le piton et la maçonne sont au
 * lieu et au décor de la scène (./donjon5e.ts) : ce fichier ne pose que ce qui cadre, comme au Hameau, un élément de chaque
 * côté, dans le cadre de la scénette : un rocher bas à facettes à l'est, au coin du logis, hors de la cour, et un buisson
 * sec en dôme à l'ouest, devant le pied du piton, à l'écart de la herse tombée et de la brouette. Tous deux restent bas.
 * Le sol est celui du 5e (`heightAt5e`). Code pur.
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

/** Le rocher bas de l'est, depuis le sol de la scène : sa place, son rayon, sa hauteur. */
const EAST_ROCK = { dx: 6.6, dz: -1.6, r: 0.75, h: 0.4 } as const;

/** Le buisson sec de l'ouest, depuis le sol de la scène : sa place, sa taille. */
const WEST_BUSH = { dx: -6.3, dz: 0.9, s: 0.6 } as const;

/** Les abords, pour les tests. */
export const DONJON_SURROUNDINGS = { rock: EAST_ROCK, bush: WEST_BUSH } as const;

/** Les abords du Donjon, autour du sol de sa scène (`floor`). */
export function donjonSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const r = { x: floor.x + EAST_ROCK.dx, z: floor.z + EAST_ROCK.dz };
  lowRock(b, { x: r.x, y: ground(r.x, r.z), z: r.z }, EAST_ROCK.r, EAST_ROCK.h, 17);
  const w = { x: floor.x + WEST_BUSH.dx, z: floor.z + WEST_BUSH.dz };
  dryBush(b, w.x, ground(w.x, w.z), w.z, WEST_BUSH.s, 0.9);
}
