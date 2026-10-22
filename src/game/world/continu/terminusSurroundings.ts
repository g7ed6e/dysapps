/**
 * Les abords de la scénette du Terminus (lot 3 du monde ouvert du 4e, l'Épaule ; intention du directeur artistique, § 8 :
 * « la voie de garage, le banc du cheminot, la planche des sacs. Rien d'autre »). La voie de garage, la benne et le banc
 * sont au lieu (./terminus4e.ts) : ce fichier ne pose que deux pierres basses de la pierre grise des Passeurs, enfoncées
 * dans le replat, de part et d'autre de Kéo et du cheminot, jamais entre eux et la caméra (qui regarde vers l'est-nord-est,
 * depuis l'ouest-sud-ouest). Retouche 1 (directeur artistique, point 5) : la glène de câble, qui se lisait avec les pierres
 * comme des objets de réponse en l'air, est retirée ; les pierres s'enfoncent. Le sol est celui du 4e (`heightAt4e`).
 * Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { COLORS_4E } from './plan4e';
import type { RockTones } from './surroundingsKit';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** La pierre grise des Passeurs, au 4e. */
const STONE_4E: RockTones = { light: COLORS_4E.stone, shade: COLORS_4E.stoneShade, top: COLORS_4E.stoneSun };

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: 2.6, dz: -2.4, r: 0.75, h: 0.38 },
  { dx: 3.4, dz: 0.6, r: 0.6, h: 0.3 },
] as const;

/** Ce que les pierres s'enfoncent sous le replat. */
const SINK_ROCK = 0.12;

/** Les abords, pour les tests. */
export const TERMINUS_SURROUNDINGS = { rocks: ROCKS } as const;

/** Les abords du Terminus, autour du sol de sa scène (`floor`). */
export function terminusSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  for (const [k, r] of ROCKS.entries()) {
    const x = floor.x + r.dx,
      z = floor.z + r.dz;
    lowRock(b, { x, y: ground(x, z) - SINK_ROCK, z }, r.r, r.h, 41 + k, STONE_4E);
  }
}
