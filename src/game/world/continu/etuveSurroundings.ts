/**
 * Les abords de la scénette de l'Étuve (GD-22, lot 10 ; intention du directeur artistique du 20 octobre 2026, § 9 : « un
 * buisson d'olive sèche d'un côté, un rocher ocre bas de l'autre, hors de l'anneau des réponses ; les Contreforts n'ont ni
 * palétuvier ni racine en arceau »). Le plancher et le souffleur de verre sont au décor de la scène (./etuve5e.ts) ; le
 * four, le chalet, l'établi, le parvis et les bassins au lieu lui-même, qui se voit pendant la scénette : ce fichier ne
 * pose que ce qui cadre, le buisson à l'est, au-delà du chalet, et le rocher à l'ouest, au sud du chemin. Le sol est
 * celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { OCHRE_ROCK } from './etuve5e';
import { lowRock } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le buisson d'olive sèche, depuis le sol de la scène : à l'est, au-delà du chalet ; sa taille, son cap. */
const BUSH = { dx: 7.6, dz: 1.4, s: 0.9, yaw: 0.7 } as const;

/** Le rocher ocre bas, depuis le sol de la scène : à l'ouest, au sud du chemin ; son rayon. */
const ROCK = { dx: -11, dz: 5.6, r: 0.9 } as const;

/** Les abords de l'Étuve, autour du sol de sa scène (`floor`). */
export function etuveSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + BUSH.dx,
    z = floor.z + BUSH.dz;
  const y = ground(x, z);
  // Le buisson des Contreforts (./terrain5e.ts, de près) : un dôme bas à six pans, sa pointe.
  b.prism({ x, y: y - 0.3, z, yaw: BUSH.yaw }, 1.8 * BUSH.s, 1.2 * BUSH.s, 1.2 * BUSH.s, 6, FOREST_COLORS.shrub, FOREST_COLORS.shrubTop);
  b.prism({ x, y: y + 0.9 * BUSH.s, z, yaw: BUSH.yaw + 0.5 }, 1.2 * BUSH.s, 0, 0.7 * BUSH.s, 6, FOREST_COLORS.shrubTop);
  const rx = floor.x + ROCK.dx,
    rz = floor.z + ROCK.dz;
  lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, ROCK.r, ROCK.r * 0.5, 11, OCHRE_ROCK);
}
