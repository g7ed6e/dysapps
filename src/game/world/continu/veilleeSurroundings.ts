/**
 * Les abords de la scénette de la Veillée (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026,
 * § 6). La tonnelle, la table, les bancs et le trépied sont au lieu (./veillee4e.ts) : la scène se joue dehors, au
 * nord-est du muret (retouche 1), et ce fichier ne pose que ce qui cadre, sous le regard de la caméra qui regarde au
 * sud-ouest, vers la tonnelle et la mer : derrière l'épicier, à droite, une pile de trois bûches de bois gris, couchées
 * côte à côte ; une pierre basse derrière lui, une autre à gauche de Kéo, de la pierre grise des Passeurs. Rien en
 * rangée, rien sur le chemin. Le sol est celui du 4e (`heightAt4e`). Aplats francs, une couleur par facette. Code pur.
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

/** La pile de bûches, depuis le sol de la scène : sa place, son cap, la longueur d'une bûche, son rayon. */
const LOGS = { dx: -2.4, dz: -1.6, yaw: 0.5, len: 1.1, r: 0.13 } as const;

/** Les pierres basses, depuis le sol de la scène : leur place, leur rayon, leur hauteur. */
const ROCKS = [
  { dx: -4.2, dz: -0.4, r: 0.7, h: 0.35 },
  { dx: 3.0, dz: 2.1, r: 0.55, h: 0.3 },
] as const;

/** Les abords, pour les tests. */
export const VEILLEE_SURROUNDINGS = { logs: LOGS, rocks: ROCKS } as const;

/** Les abords de la Veillée, autour du sol de sa scène (`floor`). */
export function veilleeSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const L = LOGS;
  const x = floor.x + L.dx,
    z = floor.z + L.dz;
  const g = ground(x, z);
  // Deux bûches côte à côte, une troisième dessus, entre elles : couchées, jamais en croix.
  const c = Math.cos(L.yaw),
    s = Math.sin(L.yaw);
  for (const [off, up] of [
    [-L.r, 0],
    [L.r, 0],
    [0, 1.7 * L.r],
  ] as const)
    b.prism({ x: x + off * c, y: g + L.r + up, z: z - off * s, yaw: L.yaw, pitch: Math.PI / 2 }, L.r, L.r, L.len, 6, COLORS_4E.woodShade, COLORS_4E.wood);
  for (const [k, r] of ROCKS.entries()) {
    const rx = floor.x + r.dx,
      rz = floor.z + r.dz;
    lowRock(b, { x: rx, y: ground(rx, rz), z: rz }, r.r, r.h, 51 + k, STONE_4E);
  }
}
