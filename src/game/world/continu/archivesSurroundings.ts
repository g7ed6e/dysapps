/**
 * Les abords de la scénette des Archives (d'après les concepts du 18 octobre 2026, « scenettes-6e-archives-42 » et
 * « -2026 », et l'avis du directeur artistique) : à l'est de la façade, adossée au pan de roche de l'éperon et à la
 * falaise, la maison à colombages de la copiste (le kit commun, ./surroundingsKit.ts), son toit d'ardoise où manquent
 * quelques ardoises, le voligeage à nu ; sur sa façade, un auvent de toile ouvert sur des casiers de bois pleins de
 * rouleaux et de boîtes à fiches, sur un plancher de planches ; des marches de pierre vers la scène, des dalles de pierre
 * chaude au pied, des caisses, un tonneau, une pile d'ardoises neuves. Fini tout autour, puisque la caméra tourne : à
 * l'ouest, sur la grève, un ponton court et des caisses qui attendent la barque ; des rochers à facettes de pierre
 * chaude et des touffes au pied de la falaise et sur la grève.
 *
 * La maison se tient à l'est du muret du parvis (le lieu, ./archives.ts) et au sud du pan de roche : rien ne la traverse
 * quand les abords du lieu sont posés. Rien de haut entre la caméra de départ et la scène (Kéo, la copiste, la rangée des
 * tiroirs). Aplats francs, une couleur par facette, jamais presque noir. Code pur, sans Three.js.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, GREEN_TUFT, STONE, TIMBER, barrel, groundAt, pontoon, rock, timberHouse, tuft, type P3 } from './surroundingsKit';
import { heightAt } from './terrain';

const C = {
  /** Le plancher de l'auvent et les casiers : le bois des planches du kit, les montants un ton plus sombre. */
  plank: TIMBER.plank,
  plankSide: TIMBER.plankSide,
  seam: TIMBER.seam,
  shelf: 0xa9784a,
  shelfSide: 0x8a6440,
  /** La toile de l'auvent : deux bandes, la crème et le Sable du pack (#DAA66A), en alternance. */
  canvas: 0xf0e2bc,
  canvasAlt: 0xdaa66a,
  /** Les rouleaux : le papier crème, son bout un ton plus foncé (jamais un blanc pur) ; les boîtes à fiches. */
  scroll: 0xeee2c4,
  scrollEnd: 0xd3bf96,
  fileBox: 0xb98049,
  fileBoxTop: 0xc8923a,
  /** Les dalles chaudes du pied de la maison (celles des scènes, lot commun), leur tranche. */
  paving: 0xd6b98e,
  pavingSide: 0xb0926a,
  /** Les caisses : le bois du docker (scenette.ts), leurs lattes plus sombres. */
  crate: 0xb5793f,
  crateTop: 0xc98d50,
  slat: 0x9a6a3e,
  /** Le voligeage à nu sous les ardoises manquantes (celui du kit), les ardoises neuves de la pile. */
  bare: 0xb98f5c,
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
} as const;

/**
 * Les mesures des abords, depuis le sol de la scène : la maison (son milieu, son cap : la façade vers l'ouest-sud-ouest,
 * vers la scène ; sa largeur, sa profondeur, ses murs, sa pente), le plancher de l'auvent (sa largeur le long de la
 * façade, depuis le bout gauche, et sa profondeur), le ponton de la grève.
 */
export const ARCHIVES_SURROUNDINGS = {
  house: { dx: 7.1, dz: -3.7, yaw: -0.9, width: 3.2, depth: 2.3, wall: 1.6, slope: 0.8 },
  porch: { u0: -0.95, u1: 1.7, depth: 0.85 },
  jetty: { dx: -11.8, from: 2.6, to: 7.2, width: 1.3, top: 0.55 },
} as const;

/** Le bord est du muret du parvis (archives.ts, `PARVIS.wall` et sa demi-largeur), depuis le sol de la scène : la maison reste à l'est. */
export const MURET_EAST = 4.45 + 0.18;

export function archivesSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  house(b, floor);
  shore(b, floor);
  rocks(b, floor);
}

/** Le repère de la maison : (u le long de la façade, de gauche à droite vu de dehors ; w vers la façade) au monde. */
function frame(f: Vec3) {
  const H = ARCHIVES_SURROUNDINGS.house;
  const c = Math.cos(H.yaw),
    s = Math.sin(H.yaw);
  const x = f.x + H.dx,
    z = f.z + H.dz;
  const at = (u: number, w: number) => ({ x: x + u * c + w * s, z: z - u * s + w * c });
  const P = (u: number, v: number, w: number): P3 => {
    const p = at(u, w);
    return [p.x, v, p.z];
  };
  return { at, P, yaw: H.yaw };
}

/** Le plus bas du sol sous des points du repère de la maison. */
function lowest(at: (u: number, w: number) => { x: number; z: number }, pts: readonly (readonly [number, number])[]): number {
  return Math.min(...pts.map(([u, w]) => heightAt(at(u, w))));
}

/** Un quad vu des deux côtés (la toile de l'auvent, ses festons). */
function sheet(b: FacetBuilder, a: P3, c: P3, d: P3, e: P3, color: number): void {
  b.quad(a, c, d, e, color);
  b.quad(e, d, c, a, color);
}

/**
 * La maison de la copiste (le kit commun, sur son socle de pierre), son toit où manquent quelques ardoises, puis, sur
 * sa façade, le plancher, les casiers, l'auvent, les marches ; au pied, les dalles, les caisses, le tonneau.
 */
function house(b: FacetBuilder, f: Vec3): void {
  const H = ARCHIVES_SURROUNDINGS.house;
  const { at, P, yaw } = frame(f);
  const o = at(0, 0);
  const floor = timberHouse(b, { x: o.x, z: o.z, yaw, width: H.width, depth: H.depth, wall: H.wall, slope: H.slope, door: 0x7a5538 });
  missingSlates(b, P, floor);
  porch(b, at, P, floor);
  foot(b, at, floor);
}

/**
 * Les ardoises manquantes : sur le pan de la façade, trois trous où le voligeage se voit, de tailles inégales ; un sur
 * le revers. Le pan comme celui du kit (`roof`, ./surroundingsKit.ts) : l'égout débordant de 0,45, les rives de 0,2.
 */
function missingSlates(b: FacetBuilder, P: (u: number, v: number, w: number) => P3, floor: number): void {
  const H = ARCHIVES_SURROUNDINGS.house;
  const over = 0.45,
    side = 0.2;
  const run = H.depth / 2 + over;
  const yE = -H.slope * over,
    yR = (H.slope * H.depth) / 2;
  const span = H.width + 2 * side;
  const len = Math.hypot(run, H.slope * run);
  const top = floor + H.wall;
  for (const sgn of [1, -1]) {
    const ny = run / len,
      nw = (sgn * H.slope * run) / len;
    const pt = (p: number, t: number): P3 => {
      const u = sgn > 0 ? -H.width / 2 - side + p * span : H.width / 2 + side - p * span;
      return P(u, top + yE + t * (yR - yE) + ny * 0.03, sgn * run * (1 - t) + nw * 0.03);
    };
    const holes = sgn > 0 ? HOLES_FRONT : HOLES_BACK;
    for (const [p0, t0, p1, t1] of holes) b.quad(pt(p0, t0), pt(p1, t0), pt(p1, t1), pt(p0, t1), C.bare);
  }
}

/** Les trous du toit, sur un pan (de gauche à droite vu de son côté, de l'égout au faîtage, en parts du pan). */
const HOLES_FRONT: readonly (readonly [number, number, number, number])[] = [
  [0.58, 0.28, 0.68, 0.42],
  [0.72, 0.52, 0.8, 0.63],
  [0.24, 0.66, 0.31, 0.78],
];
const HOLES_BACK: readonly (readonly [number, number, number, number])[] = [[0.4, 0.4, 0.5, 0.55]];

/**
 * Le plancher de planches devant la façade, sous l'auvent, au niveau du sol de la maison ; les casiers contre le mur, à
 * droite de la porte, leurs rouleaux et leurs boîtes ; l'auvent de toile à bandes et ses festons, sur deux poteaux ; deux
 * marches de pierre au bout sud du plancher, vers la scène ; une pile d'ardoises neuves devant la porte.
 */
function porch(b: FacetBuilder, at: (u: number, w: number) => { x: number; z: number }, P: (u: number, v: number, w: number) => P3, floor: number): void {
  const H = ARCHIVES_SURROUNDINGS.house;
  const R = ARCHIVES_SURROUNDINGS.porch;
  const w0 = H.depth / 2,
    w1 = w0 + R.depth;
  const yaw = H.yaw;
  // Le plancher, jusqu'au plus bas du sol sous lui ; ses joints, en travers.
  const low = lowest(at, [[R.u0, w0], [R.u1, w0], [R.u0, w1], [R.u1, w1]]) - 0.1;
  const mid = at((R.u0 + R.u1) / 2, (w0 + w1) / 2);
  b.box({ x: mid.x, y: low, z: mid.z, yaw }, [R.u1 - R.u0, floor - low, R.depth], C.plankSide, C.plank);
  for (let u = R.u0 + 0.45; u < R.u1 - 0.1; u += 0.45) b.quad(P(u - 0.02, floor + 0.01, w1), P(u + 0.02, floor + 0.01, w1), P(u + 0.02, floor + 0.01, w0), P(u - 0.02, floor + 0.01, w0), C.seam);
  // Les casiers : trois montants, quatre tablettes, contre le mur (la fenêtre derrière eux).
  const cu0 = 0.12,
    cu1 = 1.5,
    cd = 0.46,
    ch = 1.42;
  const cw = w0 + 0.02 + cd / 2;
  for (const u of [cu0 + 0.04, (cu0 + cu1) / 2, cu1 - 0.04]) {
    const p = at(u, cw);
    b.box({ x: p.x, y: floor, z: p.z, yaw }, [0.08, ch, cd], C.shelfSide, C.shelf);
  }
  const shelves = [0, 0.47, 0.94, ch - 0.05];
  for (const v of shelves) {
    const p = at((cu0 + cu1) / 2, cw);
    b.box({ x: p.x, y: floor + v, z: p.z, yaw }, [cu1 - cu0, 0.05, cd], C.shelfSide, C.shelf);
  }
  // Le contenu : des rouleaux couchés, leur bout tourné vers dehors, et des boîtes à fiches (rien d'écrit).
  const cells = [
    [cu0 + 0.36, 0, 'scrolls'],
    [cu1 - 0.36, 0, 'boxes'],
    [cu0 + 0.36, 1, 'boxes'],
    [cu1 - 0.36, 1, 'scrolls'],
    [cu0 + 0.36, 2, 'scrolls'],
    [cu1 - 0.36, 2, 'scrolls'],
  ] as const;
  for (const [u, row, kind] of cells) {
    const v = floor + shelves[row] + 0.05;
    if (kind === 'scrolls') {
      for (const [du, dv, r] of [[-0.15, 0, 0.11], [0.09, 0, 0.1], [-0.03, 0.2, 0.1]] as const) {
        const p = at(u + du, w0 + 0.04);
        b.drum({ x: p.x, y: v + r + dv, z: p.z, yaw, pitch: Math.PI / 2 }, r, cd - 0.06, 5, C.scrollEnd, C.scroll);
      }
    } else {
      for (const du of [-0.15, 0.15]) {
        const p = at(u + du, cw);
        b.box({ x: p.x, y: v, z: p.z, yaw }, [0.24, 0.3, cd - 0.08], C.fileBox, C.fileBoxTop);
      }
    }
  }
  // L'auvent : cinq bandes de toile, du haut du mur jusqu'au-dessus du bord du plancher, et leurs festons.
  const a0 = cu0 - 0.25,
    a1 = R.u1 + 0.05;
  const vIn = floor + H.wall - 0.12,
    vOut = floor + H.wall - 0.5,
    wOut = w1 + 0.12;
  const n = 5;
  for (let k = 0; k < n; k++) {
    const u0 = a0 + ((a1 - a0) * k) / n,
      u1 = a0 + ((a1 - a0) * (k + 1)) / n;
    const color = k % 2 ? C.canvasAlt : C.canvas;
    sheet(b, P(u0, vIn, w0 + 0.03), P(u0, vOut, wOut), P(u1, vOut, wOut), P(u1, vIn, w0 + 0.03), color);
    // Le feston : un demi-losange qui pend sous le bord.
    const um = (u0 + u1) / 2;
    b.triangle(P(u0, vOut, wOut), P(um, vOut - 0.16, wOut), P(u1, vOut, wOut), color);
    b.triangle(P(u1, vOut, wOut), P(um, vOut - 0.16, wOut), P(u0, vOut, wOut), color);
  }
  // Les deux poteaux de l'auvent, aux coins du plancher.
  for (const u of [a0 + 0.06, a1 - 0.06]) {
    const p = at(u, wOut - 0.06);
    b.beam({ x: p.x, y: floor, z: p.z }, { x: p.x, y: vOut + 0.02, z: p.z }, 0.1, C.shelfSide);
  }
  // Deux marches de pierre au bout sud du plancher, jusqu'au sol.
  const ground = heightAt(at(R.u1 + 0.75, (w0 + w1) / 2));
  for (let k = 0; k < 2; k++) {
    const p = at(R.u1 + 0.17 + k * 0.32, (w0 + w1) / 2);
    const foot = groundAt(p.x, p.z, 0.12);
    const top = floor - ((k + 1) * (floor - ground)) / 3;
    b.box({ x: p.x, y: foot, z: p.z, yaw }, [0.32, Math.max(0.08, top - foot), R.depth - 0.1], STONE.side, STONE.top);
  }
  // La pile d'ardoises neuves, devant la porte, sur le plancher : trois lits, de deux bleus.
  const pile = at(-0.75, w1 - 0.3);
  for (let k = 0; k < 3; k++) b.box({ x: pile.x, y: floor + k * 0.05, z: pile.z, yaw: yaw + 0.15 * k }, [0.42, 0.05, 0.28], C.slate, k % 2 ? C.slateLight : C.slate);
}

/** Une caisse posée en (x, y, z), de côté `s`, tournée de `yaw` : la caisse, et deux lattes sur deux de ses faces. */
function crate(b: FacetBuilder, x: number, y: number, z: number, s: number, yaw: number): void {
  b.box({ x, y, z, yaw }, [s, s, s], C.crate, C.crateTop);
  const c = Math.cos(yaw),
    sn = Math.sin(yaw);
  for (const [nu, nw] of [[0, 1], [1, 0]] as const) {
    // La face de normale (nu, nw) dans le repère de la caisse ; sa latte en travers, à mi-hauteur.
    const off = s / 2 + 0.01;
    const cx = x + (nu * c + nw * sn) * off,
      cz = z + (-nu * sn + nw * c) * off;
    const tu = { x: nw * c - nu * sn, z: -nw * sn - nu * c };
    const h = s / 2;
    const half = s / 2 - 0.03;
    const q = (a: number, v: number): P3 => [cx + tu.x * a, y + v, cz + tu.z * a];
    b.quad(q(half, h - 0.05), q(-half, h - 0.05), q(-half, h + 0.05), q(half, h + 0.05), C.slat);
  }
}

/** Au pied de la maison : les dalles de pierre chaude devant le plancher, les caisses au bout des marches, le tonneau. */
function foot(b: FacetBuilder, at: (u: number, w: number) => { x: number; z: number }, _floor: number): void {
  const H = ARCHIVES_SURROUNDINGS.house;
  const R = ARCHIVES_SURROUNDINGS.porch;
  const yaw = H.yaw;
  // Les dalles : deux rangs devant le plancher et les marches, à joints décalés, posées sur le sol (rien ne flotte).
  const w = H.depth / 2 + R.depth;
  for (const [row, starts] of [[0, [0.35, 1.0, 1.7, 2.35]], [1, [0.65, 1.35, 2.05]]] as const) {
    for (const u of starts) {
      const len = 0.62,
        dep = 0.5;
      const wc = w + 0.3 + row * 0.55;
      const p = at(u + len / 2, wc);
      const corners = [at(u, wc - dep / 2), at(u + len, wc - dep / 2), at(u, wc + dep / 2), at(u + len, wc + dep / 2)].map((q) => heightAt(q));
      const lo = Math.min(...corners) - 0.06,
        hi = Math.max(...corners) + 0.05;
      b.box({ x: p.x, y: lo, z: p.z, yaw: yaw + 0.04 * (row ? 1 : -1) }, [len, hi - lo, dep], C.pavingSide, C.paving);
    }
  }
  // Les caisses : deux côte à côte au sud des marches, une troisième dessus ; une au pignon est.
  for (const [u, ww, s, turn, on] of [
    [R.u1 + 1.05, w - 0.5, 0.5, 0.1, false],
    [R.u1 + 1.1, w - 1.08, 0.46, -0.15, false],
    [R.u1 + 1.07, w - 0.75, 0.4, 0.35, true],
    [H.width / 2 + 0.55, -0.5, 0.5, 0.2, false],
  ] as const) {
    const p = at(u, ww);
    const y = on ? heightAt(at(R.u1 + 1.05, w - 0.5)) - 0.04 + 0.5 : heightAt(p) - 0.04;
    crate(b, p.x, y, p.z, s, yaw + turn);
  }
  const t = at(H.width / 2 + 0.6, 0.4);
  barrel(b, t.x, heightAt(t) - 0.04, t.z);
}

/**
 * La grève, à l'ouest de la scène : un ponton court qui descend dans le lagon, deux caisses et un tonneau au bout, qui
 * attendent la barque ; des touffes d'herbe sèche le long du rivage.
 */
function shore(b: FacetBuilder, f: Vec3): void {
  const J = ARCHIVES_SURROUNDINGS.jetty;
  const x = f.x + J.dx;
  pontoon(b, { from: { x, z: f.z + J.from }, to: { x, z: f.z + J.to }, width: J.width, top: J.top, pairs: 4 });
  crate(b, x - 0.2, J.top, f.z + J.to - 0.55, 0.48, 0.2);
  crate(b, x + 0.25, J.top, f.z + J.to - 1.15, 0.44, -0.3);
  barrel(b, x - 0.25, J.top, f.z + J.to - 1.5);
  for (const [dx, dz, seed] of TUFTS) {
    const p = { x: f.x + dx, z: f.z + dz };
    const g = heightAt(p);
    tuft(b, { x: p.x, y: g - 0.04, z: p.z }, seed, g < 1 ? DRY_TUFT : GREEN_TUFT, 1.1);
  }
}

/** Les touffes : (dx, dz, graine), sur la grève à l'ouest, au pied de la maison, contre la falaise. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [-6.6, 3.2, 1],
  [-9.6, 2.4, 2],
  [-10.8, 4.6, 3],
  [-7.4, 1.6, 4],
  [9.4, -3.2, 5],
  [10.2, -5.6, 6],
  [8.2, -7.0, 7],
  [-11.6, 0.6, 8],
];

/** Les rochers à facettes (le kit commun) : (dx, dz, rayon, hauteur, graine). */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [9.6, -7.4, 1.0, 1.1, 3],
  [10.8, -2.4, 0.8, 0.7, 5],
  [-10.2, 1.4, 0.9, 0.8, 7],
  [-6.2, 4.6, 0.7, 0.5, 9],
  [-11.4, 6.2, 1.1, 0.9, 11],
  [-9.8, -2.6, 1.0, 1.0, 13],
];

function rocks(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz, r, h, seed] of ROCKS) {
    const x = f.x + dx,
      z = f.z + dz;
    rock(b, { x, y: groundAt(x, z, 0.05), z }, r, h, seed);
  }
}

