/**
 * Les abords de la scénette des Nacelles (GD-22, lot 16 ; intention du directeur artistique du 21 octobre 2026, § 7 :
 * « le quai et le devant de la halle derrière elle ; à gauche, derrière Kéo, le pied du mât et un rouage ; une roche qui
 * cadre ; rien de plus »). Le plancher est la cour du lieu, le quai, la halle, le mât et les rouages sont au lieu et au
 * décor de la scène (./nacelles5e.ts) : ce fichier ne pose que ce qui cadre, des roches basses de la pierre du plateau, hors
 * de la cour : une à l'ouest du quai, en deçà du pied du mât, une au sud-ouest, au premier plan, sous le regard de la caméra.
 * Toutes restent basses. Le sol est celui du 5e (`heightAt5e`). Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Les roches basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -7.2, dz: 0.9, r: 0.9, h: 0.45 },
  { dx: -7.4, dz: -2.7, r: 0.8, h: 0.4 },
  { dx: -4.6, dz: 5.7, r: 0.8, h: 0.35 },
] as const;

/** Les abords, pour les tests. */
export const NACELLES_SURROUNDINGS = { rocks: ROCKS } as const;

/** Les abords des Nacelles, autour du sol de leur scène (`floor`). */
export function nacellesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const [k, r] of ROCKS.entries()) {
    const x = floor.x + r.dx,
      z = floor.z + r.dz;
    lowRock(b, { x, y: ground(x, z), z }, r.r, r.h, 12 + k);
  }
}
