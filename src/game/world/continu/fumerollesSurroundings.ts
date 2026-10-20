/**
 * Les abords de la scénette des Fumerolles (GD-22, lot 9 ; intention du directeur artistique du 20 octobre 2026, § 9 : « la
 * dalle ; la façade de la cabane derrière la sondeuse ; à gauche, derrière Kéo, une bouche de la margelle et son panache ;
 * une roche ocre qui cadre. Rien de plus »). La dalle, la cabane, les bouches et leurs panaches sont au lieu lui-même, qui
 * se voit pendant la scénette (./fumerolles5e.ts) : ce fichier ne pose que ce qui cadre, un rocher d'ocre à facettes à
 * l'est et un buisson sec en dôme à l'ouest, hors de l'anneau où la rangée des galets se pose quand la caméra tourne, et
 * hors de la dalle. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { OCHRE_ROCK, dryBush } from './fumerolles5e';
import type { SurroundingsState } from './surroundings';
import { rock } from './surroundingsKit';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le rocher d'ocre qui cadre, depuis le sol de la scène : à l'est, au sud-est de la cabane ; son rayon, sa hauteur. */
const EAST_ROCK = { dx: 8.6, dz: 0.8, r: 1.3, h: 1.5 } as const;

/** Le buisson sec en dôme, depuis le sol de la scène : à l'ouest, au sud-ouest de la dalle ; sa taille. */
const WEST_BUSH = { dx: -11.2, dz: 0.3, s: 1 } as const;

/** Les abords des Fumerolles, autour du sol de leur scène (`floor`). */
export function fumerollesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const r = { x: floor.x + EAST_ROCK.dx, z: floor.z + EAST_ROCK.dz };
  rock(b, { x: r.x, y: ground(r.x, r.z), z: r.z }, EAST_ROCK.r, EAST_ROCK.h, 9, OCHRE_ROCK);
  const w = { x: floor.x + WEST_BUSH.dx, z: floor.z + WEST_BUSH.dz };
  dryBush(b, w.x, ground(w.x, w.z), w.z, WEST_BUSH.s, 0.7);
}
