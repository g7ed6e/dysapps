/**
 * Les abords de la scénette du Sémaphore (GD-22, lot 14 ; intention du directeur artistique du 20 octobre 2026, « Le
 * signaleur et la scénette » : « la cour ; la façade sud de la tour, sa porte, son linteau et le trou aux quatre goujons ;
 * à gauche, derrière Kéo, un bout du muret de blocs et le large ; une roche qui cadre. Rien de plus »). La cour, la
 * façade, le muret et le signaleur sont au lieu et au décor de la scène (./semaphore5e.ts) : ce fichier ne pose que la
 * roche qui cadre, à l'est, juste au-delà du bord de la cour, du côté du signaleur et de la chaussée ; basse, à facettes,
 * de la pierre grise du plateau. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** La roche qui cadre, à l'est, depuis le sol de la scène : sa place, son rayon, sa hauteur. */
const EAST_ROCK = { dx: 7.4, dz: -0.6, r: 0.85, h: 0.95 } as const;

/** Les abords, pour les tests. */
export const SEMAPHORE_SURROUNDINGS = { rock: EAST_ROCK } as const;

/** Les abords du Sémaphore, autour du sol de sa scène (`floor`). */
export function semaphoreSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + EAST_ROCK.dx,
    z = floor.z + EAST_ROCK.dz;
  lowRock(b, { x, y: ground(x, z), z }, EAST_ROCK.r, EAST_ROCK.h, 14);
}
