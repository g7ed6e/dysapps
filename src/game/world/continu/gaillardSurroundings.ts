/**
 * Les abords de la scénette du Gaillard (GD-22, lot 15 ; intention du directeur artistique du 21 octobre 2026, § 10 : « la
 * cour ; le bas de la façade, sa porte et son linteau, le perron ; à gauche, derrière Kéo, un coin de cour et la bordure ;
 * une roche grise qui cadre »). Le plancher est la cour du lieu ; la façade, le perron et la bordure sont au lieu
 * (./gaillard5e.ts) : ce fichier ne pose que la roche grise qui cadre, basse, à l'est, devant le bout est de la maison, sur les
 * dalles, dans le cadre de la scénette à 1024 × 768 (un test le vérifie), à l'écart du seau et de la bordure. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { GAILLARD_LAYOUT } from './gaillard5e';
import { lowRock } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';

/** La roche basse de l'est, depuis le sol de la scène : sa place, son rayon, sa hauteur. */
const EAST_ROCK = { dx: 5.0, dz: 0.9, r: 0.7, h: 0.45 } as const;

/** Les abords, pour les tests. */
export const GAILLARD_SURROUNDINGS = { rock: EAST_ROCK } as const;

/** Les abords du Gaillard, autour du sol de sa scène (`floor`) : la roche posée sur les dalles de la cour. */
export function gaillardSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const L = GAILLARD_LAYOUT;
  const x = floor.x + EAST_ROCK.dx,
    z = floor.z + EAST_ROCK.dz;
  // `floor` est le dessus des dalles au milieu de la scène : la roche suit la cour, de là jusqu'à sa place.
  const y = floor.y + L.yardY(L.scene.dx + EAST_ROCK.dx, L.scene.dz + EAST_ROCK.dz) - L.yardY(L.scene.dx, L.scene.dz);
  lowRock(b, { x, y, z }, EAST_ROCK.r, EAST_ROCK.h, 15);
}
