/**
 * Les abords de la scénette des Terrasses (GD-22, lot 11 ; intention du directeur artistique du 20 octobre 2026, § 7 :
 * « un buisson en dôme de la plaine d'un côté, un rocher ocre bas de l'autre, hors de l'anneau des réponses ; les
 * Contreforts n'ont pas de palétuviers »). Le pavé et le riziculteur sont au décor de la scène (./terrasses5e.ts) ; le
 * tertre, le moulin, la roue et la cour au lieu lui-même, qui se voit pendant la scénette : ce fichier ne pose que ce qui
 * cadre, le buisson à l'est, au-delà du moulin, et le rocher à l'ouest de la porte. Le sol est celui du 5e
 * (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { COLORS_5E } from './plan5e';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/**
 * Le buisson en dôme, depuis le sol de la scène : à l'est, au-delà du moulin, au nord-est (retouche 1 : le chemin longe
 * maintenant l'est de la cour, et le pan de chaume tombé est devant le moulin).
 */
const BUSH = { dx: 5.8, dz: -9.6, s: 1 } as const;

/** Le rocher ocre bas, depuis le sol de la scène : au sud-ouest, à l'écart de la porte. */
const ROCK = { dx: -7.4, dz: 5.4, r: 1.3, h: 0.6 } as const;

/** Les abords des Terrasses, autour du sol de leur scène (`floor`). */
export function terrassesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + BUSH.dx,
    z = floor.z + BUSH.dz;
  const y = ground(x, z);
  b.prism({ x, y: y - 0.3, z, yaw: 0.4 }, 1.8 * BUSH.s, 1.2 * BUSH.s, 1.2 * BUSH.s, 6, FOREST_COLORS.shrub, FOREST_COLORS.shrubTop);
  b.prism({ x, y: y + 0.9 * BUSH.s, z, yaw: 0.9 }, 1.2 * BUSH.s, 0, 0.7 * BUSH.s, 6, FOREST_COLORS.shrubTop);
  const rx = floor.x + ROCK.dx,
    rz = floor.z + ROCK.dz;
  lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, ROCK.r, ROCK.h, 11, { light: COLORS_5E.ochre, shade: 0x9c8657, top: 0xc4ad78 });
}
