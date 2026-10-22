/**
 * Les abords de la scénette de l'Herbier (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026, § 3).
 * La serre, la paillasse, les bacs et la citerne sont au lieu (./herbier4e.ts) : ce fichier ne pose que ce qui cadre,
 * sous le regard de la caméra qui regarde au sud-ouest, vers la mer : à droite, une pierre basse ; derrière Kéo, à gauche,
 * une pile de trois pots de grès gris retournés (jamais de terre cuite) et une autre pierre, de la pierre grise des
 * Passeurs. Rien en rangée. Le sol est celui du 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { C4E } from './place4eKit';
import { COLORS_4E } from './plan4e';
import type { RockTones } from './surroundingsKit';
import type { SurroundingsState } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** La pierre grise des Passeurs, au 4e. */
const STONE_4E: RockTones = { light: COLORS_4E.stone, shade: COLORS_4E.stoneShade, top: COLORS_4E.stoneSun };

/** Le sol du 4e en un point du monde. */
const ground = (x: number, z: number): number => standingHeight(heightAt4e({ x, z }));

/** La pile de pots retournés, depuis le sol de la scène : sa place, le rayon du plus grand. */
const POTS = { dx: 0.9, dz: 3.9, r: 0.24 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -3.5, dz: -2.1, r: 0.7, h: 0.35 },
  { dx: -1.3, dz: 3.7, r: 0.55, h: 0.3 },
] as const;

/** Les abords, pour les tests. */
export const HERBIER_SURROUNDINGS = { pots: POTS, rocks: ROCKS } as const;

/** Les abords de l'Herbier, autour du sol de sa scène (`floor`). */
export function herbierSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const x = floor.x + POTS.dx,
    z = floor.z + POTS.dz;
  const g = ground(x, z);
  // Retournés : le fond en haut, du plus grand au plus petit.
  [1, 0.85, 0.7].forEach((k, i) => b.prism({ x, y: g - 0.05 + i * 0.2, z, yaw: i * 0.5 }, POTS.r * k * 1.15, POTS.r * k * 0.9, 0.26, 6, C4E.stoneware, C4E.stonewareTop));
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 41 + k, STONE_4E);
  }
}
