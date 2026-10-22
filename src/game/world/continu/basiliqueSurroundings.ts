/**
 * Les abords de la scénette de la Basilique (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026,
 * § 7). Les colonnes, le bassin, le pavement et la halle sont au lieu (./basilique4e.ts) : ce fichier ne pose que ce qui
 * cadre, sous le regard de la caméra qui regarde à l'ouest, vers le large : derrière Kéo, à gauche, deux planches de bois
 * gris posées à plat l'une sur l'autre, de travers ; une pierre basse au nord, une autre au sud, de la pierre grise des
 * Passeurs, brutes (jamais un bloc taillé : ce sont les réponses). Rien en rangée. Le sol est celui du 4e (`heightAt4e`).
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

/** Les deux planches, depuis le sol de la scène : leur place, leur cap, leur longueur. */
const PLANKS = { dx: 1.6, dz: 4.3, yaw: 0.35, len: 2.2 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -1.4, dz: -4.4, r: 0.65, h: 0.32 },
  { dx: -3.2, dz: 4.6, r: 0.55, h: 0.3 },
] as const;

/** Les abords, pour les tests. */
export const BASILIQUE_SURROUNDINGS = { planks: PLANKS, rocks: ROCKS } as const;

/** Les abords de la Basilique, autour du sol de sa scène (`floor`). */
export function basiliqueSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const P = PLANKS;
  const x = floor.x + P.dx,
    z = floor.z + P.dz;
  const g = ground(x, z);
  b.box({ x, y: g - 0.02, z, yaw: P.yaw }, [P.len, 0.08, 0.32], COLORS_4E.woodShade, COLORS_4E.wood);
  b.box({ x: x + 0.1, y: g + 0.06, z: z + 0.05, yaw: P.yaw + 0.25 }, [P.len * 0.85, 0.08, 0.3], COLORS_4E.woodShade, COLORS_4E.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 61 + k, STONE_4E);
  }
}
