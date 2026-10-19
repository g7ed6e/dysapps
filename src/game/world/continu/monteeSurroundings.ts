/**
 * Les abords de la scénette de la Montée (GD-22, lot 3 ; intention du directeur artistique du 19 octobre 2026, § 5,
 * « les abords à 360° ») : au sud, le ponton, le bassin et le pied du rail sont au lieu lui-même (./montee5e.ts) ; à l'est
 * et au nord-est, la gare du pied et le rail à chevalets de la cabine sont au monde (./bridges.ts), comme au nord la
 * falaise et la brume des failles (./terrain5e.ts, ./mist5e.ts). Ce fichier pose ce qui manque autour : à l'ouest, trois
 * palétuviers sur leurs racines en arceaux, l'un portant une lanterne pendue (éteinte tant que le haut n'est pas posé,
 * d'ocre ensuite), une mare de racines où plonge une vieille chaîne ; tout autour, des roches de la pierre des aiguilles et
 * des touffes de mousse, basses au sud, sous le regard de la caméra.
 *
 * Le kit des abords (./surroundingsKit.ts) est écrit pour le 6e : ses formes servent (le rocher, la touffe), avec les tons
 * du 5e passés en paramètre, et le sol est celui du 5e (`heightAt5e`), jamais celui du 6e. Rien de haut dans l'anneau où
 * la rangée des godets se pose quand la caméra tourne (7,5 du point visé, plus une marge). Aplats francs, une couleur par
 * facette, jamais presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { COLORS_5E } from './plan5e';
import type { SurroundingsState } from './surroundings';
import { jitter, rock, tuft, type RockTones } from './surroundingsKit';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

const C = {
  root: FOREST_COLORS.root,
  trunk: FOREST_COLORS.trunk,
  canopy: FOREST_COLORS.canopy,
  canopyTop: FOREST_COLORS.canopyTop,
  water: COLORS_5E.water,
  mud: COLORS_5E.mud,
  lantern: COLORS_5E.lantern,
  // La vitre éteinte (celle de la lanterne de la Montée en ruine) et le bronze.
  glassOff: 0xbfc4b8,
  bronze: 0xb8954f,
  iron: 0x6f6a60,
  rope: 0xd8c49a,
} as const;

/** La pierre des aiguilles, pour les roches : ses deux pans et sa pointe claire. */
const STONE_5E: RockTones = { light: COLORS_5E.stone, shade: COLORS_5E.stoneShade, top: COLORS_5E.stoneSun };

/** Les deux tons des touffes : la mousse au soleil et la mousse grise du plateau. */
const MOSS_TUFT = [COLORS_5E.mossSun, COLORS_5E.plateauMoss] as const;

/** Le sol du 5e en un point du monde, enfoncé de `sink`. */
const ground = (x: number, z: number, sink = 0): number => standingHeight(heightAt5e({ x, z })) - sink;

/** Les palétuviers de l'ouest, depuis le sol de la scène : leur place, leur taille, leur cap ; le premier porte la lanterne. */
const MANGROVES = [
  { dx: -9.4, dz: -2.6, s: 1.15, yaw: 0.3 },
  { dx: -11.6, dz: 2.4, s: 0.95, yaw: 1.4 },
  { dx: -8.6, dz: -7.4, s: 1.05, yaw: 2.2 },
] as const;

/** La mare des racines, à l'ouest, où plonge la chaîne : son milieu depuis le sol de la scène, son rayon. */
const POOL = { dx: -12.4, dz: -4.6, r: 1.7 } as const;

/** Les roches, depuis le sol de la scène : à l'ouest et au nord-ouest au pied de l'aiguille, à l'est, et basses au sud. */
const ROCKS = [
  [-7.6, -9.6, 0.9, 1.1],
  [-6.2, -5.2, 0.6, 0.7],
  [-13.8, -1.2, 0.7, 0.8],
  [8.4, -4.4, 0.8, 0.9],
  [10.2, 0.6, 0.6, 0.6],
  [7.8, 4.6, 0.5, 0.45],
  [-5.8, 6.8, 0.45, 0.35],
  [4.6, 8.2, 0.4, 0.3],
  [-1.6, 9.4, 0.35, 0.25],
  [12.4, -8.6, 1.0, 1.2],
] as const;

/** Les touffes de mousse, depuis le sol de la scène. */
const TUFTS = [
  [-6.6, -1.4], [-7.2, 1.6], [-10.2, 4.6], [-5.4, 4.2], [-3.8, 6.2], [-2.4, 7.6], [2.2, 6.8], [3.6, 5.4],
  [5.8, 3.2], [6.4, 6.4], [8.8, 2.2], [9.6, -2.2], [-13, 0.4], [-9.8, -10], [1, 9.8], [-0.6, 7.2],
] as const;

/**
 * Un palétuvier en (x, z) : quatre racines en arceaux (deux brins chacune, du sol au pied du tronc), le tronc, deux
 * étages de feuillage aux tons de la canopée. Environ 110 triangles.
 */
function mangroveTree(b: FacetBuilder, x: number, z: number, s: number, yaw: number): { branch: Vec3 } {
  const y = ground(x, z);
  const knee = y + 1.3 * s;
  for (let k = 0; k < 4; k++) {
    const a = yaw + (k * Math.PI) / 2 + 0.4;
    const r = 1.4 * s;
    const fx = x + r * Math.cos(a),
      fz = z + r * Math.sin(a);
    const mx = x + r * 0.62 * Math.cos(a),
      mz = z + r * 0.62 * Math.sin(a);
    const top = { x: mx, y: knee + 0.25 * s, z: mz };
    b.beam({ x: fx, y: ground(fx, fz, 0.3), z: fz }, top, 0.16 * s, C.root);
    b.beam(top, { x, y: knee, z }, 0.16 * s, C.root);
  }
  b.prism({ x, y: knee - 0.1, z, yaw }, 0.3 * s, 0.22 * s, 3.4 * s, 5, C.trunk);
  b.prism({ x, y: knee + 2.6 * s, z, yaw: yaw + 0.3 }, 2.3 * s, 1.3 * s, 1.3 * s, 7, C.canopy, C.canopyTop);
  b.prism({ x: x + 0.3 * s, y: knee + 3.8 * s, z: z - 0.2 * s, yaw: yaw + 0.9 }, 1.5 * s, 0.4 * s, 1.2 * s, 6, C.canopy, C.canopyTop);
  // Une branche basse, vers l'est (la scène) : la lanterne y pend.
  const branch = { x: x + 1.7 * s, y: knee + 2.3 * s, z: z + 0.2 * s };
  b.beam({ x, y: knee + 2.1 * s, z }, branch, 0.12 * s, C.trunk);
  return { branch };
}

/** La lanterne pendue à une branche : sa corde, sa cage de bronze, sa vitre (éteinte ou d'ocre, sans ombre). */
function hangingLantern(b: FacetBuilder, at: Vec3, lit: boolean): void {
  const y = at.y - 1.1;
  b.beam(at, { x: at.x, y: y + 0.55, z: at.z }, 0.04, C.rope);
  b.prism({ x: at.x, y, z: at.z }, 0.2, 0.2, 0.42, 6, lit ? C.lantern : C.glassOff);
  b.prism({ x: at.x, y: y + 0.42, z: at.z, yaw: Math.PI / 6 }, 0.28, 0, 0.18, 6, C.bronze);
  b.prism({ x: at.x, y: y - 0.06, z: at.z }, 0.24, 0.24, 0.06, 6, C.bronze);
}

/** La mare des racines : son eau, un anneau de vase, et la chaîne qui y plonge, d'une racine jusque sous l'eau. */
function rootPool(b: FacetBuilder, cx: number, cz: number): void {
  const y = ground(cx, cz) + 0.04;
  const n = 8;
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const r = POOL.r * (0.85 + 0.25 * jitter(k + 41));
    return [cx + r * Math.cos(a), cz + r * Math.sin(a)] as const;
  });
  for (let k = 0; k < n; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[(k + 1) % n];
    b.triangle([cx, y, cz], [bx, y, bz], [ax, y, az], C.water);
    // La vase du bord : une bande un peu plus large, juste sous l'eau.
    const o = 1.28;
    b.quad([cx + (ax - cx) * o, y - 0.02, cz + (az - cz) * o], [ax, y - 0.02, az], [bx, y - 0.02, bz], [cx + (bx - cx) * o, y - 0.02, cz + (bz - cz) * o], C.mud);
  }
  // La chaîne : trois maillons tirés, d'une souche au bord jusqu'au milieu, sous la surface.
  const from = { x: cx + POOL.r + 0.6, y: ground(cx + POOL.r + 0.6, cz + 0.4) + 0.9, z: cz + 0.4 };
  b.prism({ x: from.x, y: from.y - 1.1, z: from.z }, 0.22, 0.18, 1.2, 5, C.trunk);
  b.beam(from, { x: cx + 0.7, y: y + 0.25, z: cz + 0.2 }, 0.08, C.iron);
  b.beam({ x: cx + 0.7, y: y + 0.25, z: cz + 0.2 }, { x: cx + 0.1, y: y - 0.3, z: cz }, 0.08, C.iron);
}

/** Les abords de la Montée, autour du sol de sa scène (`floor`). */
export function monteeSurroundings(b: FacetBuilder, floor: Vec3, state: SurroundingsState): void {
  MANGROVES.forEach((m, i) => {
    const { branch } = mangroveTree(b, floor.x + m.dx, floor.z + m.dz, m.s, m.yaw);
    if (i === 0) hangingLantern(b, branch, state.posed);
  });
  rootPool(b, floor.x + POOL.dx, floor.z + POOL.dz);
  ROCKS.forEach(([dx, dz, r, h], i) => {
    const x = floor.x + dx,
      z = floor.z + dz;
    rock(b, { x, y: ground(x, z, 0.15), z }, r, h, i + 7, STONE_5E);
  });
  TUFTS.forEach(([dx, dz], i) => {
    const x = floor.x + dx,
      z = floor.z + dz;
    tuft(b, { x, y: ground(x, z, 0.02), z }, i + 3, MOSS_TUFT, 1.3);
  });
}
