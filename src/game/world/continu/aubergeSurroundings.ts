/**
 * Les abords de la scénette de l'Auberge (GD-22, lot 12 ; intention du directeur artistique du 20 octobre 2026, § 8 :
 * « le parvis, la façade et sa porte derrière l'aubergiste, à gauche le bout de la grande table, une racine en arceau qui
 * cadre ; rien de plus »). Le plancher est le parvis du lieu, la façade, la table et l'aubergiste sont au lieu et au
 * décor de la scène (./auberge5e.ts) : ce fichier ne pose que ce qui cadre, comme au Hameau, un élément de chaque côté,
 * dans le cadre de la scénette (retouche 1 : à ±7,4, ils en sortaient) : une racine en arceau à l'ouest, derrière le bout
 * nord de la grande table, en deçà des malles de la ruine, et un rocher bas à facettes à l'est, entre les débris du
 * balcon tombé et le départ du ponton. Comme la façade, ils sont plus près du point visé que l'anneau où la rangée des
 * malles se pose quand la caméra tourne ; tous deux restent bas. Le sol est celui du 5e (`heightAt5e`). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock, rootArch } from './monteeSurroundings';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Le sol du 5e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** La racine en arceau de l'ouest, depuis le sol de la scène : ses deux pieds et sa hauteur (loin du chemin d'`aub-1`). */
const WEST_ROOT = { from: [-5.0, -3.3], to: [-6.4, -2.7], h: 1.0 } as const;

/** Le rocher bas de l'est, depuis le sol de la scène : sa place, son rayon, sa hauteur. */
const EAST_ROCK = { dx: 6.0, dz: 0.0, r: 0.75, h: 0.4 } as const;

/** Les abords, pour les tests. */
export const AUBERGE_SURROUNDINGS = { root: WEST_ROOT, rock: EAST_ROCK } as const;

/** Les abords de l'Auberge, autour du sol de sa scène (`floor`). */
export function aubergeSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const R = WEST_ROOT;
  rootArch(b, { x: floor.x + R.from[0], z: floor.z + R.from[1] }, { x: floor.x + R.to[0], z: floor.z + R.to[1] }, R.h, 0.3, ground);
  const x = floor.x + EAST_ROCK.dx,
    z = floor.z + EAST_ROCK.dz;
  lowRock(b, { x, y: ground(x, z), z }, EAST_ROCK.r, EAST_ROCK.h, 12);
}
