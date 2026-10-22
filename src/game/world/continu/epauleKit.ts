// Ce que les trois lieux de l'Épaule du 4e partagent (le Terminus, les Orgues, la Dynamo ; intentions du directeur
// artistique du 22 octobre 2026) : les matières que les Fabriques ont apprises (le fer rouillé brun éteint, jamais la
// rouille claire du lot 1 ; le fer restauré bruni sombre ; la pierre grise des Passeurs à assises ; le bois gris de la
// ruine, le bois neuf brun), la lanterne d'ocre ou éteinte, la chape vide et ses deux goujons nus (le signe de l'absence
// du 4e, à la taille de celle de la Forge), le volume à dessus libre, le prisme à six pans des basaltes (seize
// triangles), le quadrilatère tourné vers le dehors et le fil tendu. Code pur.
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { COLORS_4E } from './plan4e';
import { COLORS_5E } from './plan5e';

type P3 = readonly [number, number, number];

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente (places.ts). */
export const SINK = -0.8;

/** Les matières de l'Épaule, communes aux trois lieux. */
export const EPAULE_COLORS = {
  stone: 0x8f8b88,
  stoneSun: 0xa29d98,
  stoneShade: 0x77736f,
  joint: 0x67635f,
  // Le fer rouillé de la ruine, brun éteint ; le fer restauré, bruni sombre (relecture de la Forge).
  rust: 0x6a483e,
  rustTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  // L'ombre d'une bouche, d'une porte ou d'une cale : un brun chaud, jamais presque noir.
  hollow: 0x5a4a44,
  canvas: 0xb8a88a,
  rope: 0x9a8668,
  leather: 0x7a5a44,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0x9c8452,
  head: 0xe3b48a,
  boots: 0x55595a,
} as const;

const C = EPAULE_COLORS;

/** Une lanterne pendue (sa vitre, un pavé ; son chapeau de bronze en pointe) : quatorze triangles, d'ocre ou éteinte. */
export function lantern(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * s, z: top.z }, [0.24 * s, 0.3 * s, 0.24 * s], lit ? C.lantern : C.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04 * s, z: top.z, yaw: Math.PI / 4 }, 0.21 * s, 0, 0.16 * s, 4, C.bronze);
}

/**
 * La chape vide (le signe de l'absence du 4e : la pièce de bronze est chez les Ferrailleurs), dans les mesures de celle de
 * la Forge (`CHAPE`) : sa largeur, sa hauteur, son épaisseur ; ses deux goujons nus, leur section. Retouche 1 de l'Épaule
 * (directeur artistique, point 10 : elle se lisait comme un petit panneau sombre) : un U ouvert vers le bas, sa traverse
 * (`yoke`) et ses deux joues (`cheek`), le vide entre elles ; les deux goujons nus en travers du vide, un cran plus clairs,
 * qui dépassent un peu des joues (le consultant d'Archipéo : le vide se lit par eux).
 */
export const CHAPE = { w: 0.72, h: 0.46, d: 0.3, yoke: 0.13, cheek: 0.14, pin: { t: 0.09, at: [0.1, 0.24], out: 0.05 } } as const;

/** La chape vide au point `at` (son dessous), au cap `yaw` : sa traverse, ses deux joues, ses deux goujons nus en travers. */
export function chape(b: FacetBuilder, at: Vec3, yaw = 0): void {
  const K = CHAPE;
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw }, (l) => {
    l.box({ x: 0, y: K.h - K.yoke, z: 0 }, [K.w, K.yoke, K.d], C.iron, C.ironTop);
    for (const s of [-1, 1]) l.box({ x: s * (K.w / 2 - K.cheek / 2), y: 0, z: 0 }, [K.cheek, K.h - K.yoke, K.d], C.iron, C.ironTop);
    for (const y of K.pin.at) l.box({ x: 0, y, z: 0 }, [K.w + 2 * K.pin.out, K.pin.t, K.pin.t], C.ironTop);
  });
}

/**
 * Un volume à dessus libre : `top`, dans le sens inverse des aiguilles d'une montre vu d'en haut, et son dessous `by` sous
 * lui ; ses côtés et son dessus (le dessous ne se voit pas).
 */
export function slab(b: FacetBuilder, given: readonly P3[], by: number, color: number, face: number): void {
  // Dans l'autre sens, le dessus regarderait le sol : il se retourne.
  const [a, c, d] = given;
  const up = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
  const top = up >= 0 ? given : [...given].reverse();
  const bot = top.map(([x, y, z]) => [x, y - by, z] as const);
  const n = top.length;
  for (let k = 1; k < n - 1; k++) b.triangle(top[0], top[k], top[k + 1], face);
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(bot[k], bot[m], top[m], top[k], color);
  }
}

/** Un quadrilatère à une face, tournée vers `hint`, quel que soit l'ordre de ses coins. */
export function quadToward(b: FacetBuilder, q: readonly [P3, P3, P3, P3], hint: P3, color: number): void {
  const [a, c, d] = q;
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const front = n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] >= 0 ? q : ([q[3], q[2], q[1], q[0]] as const);
  b.quad(front[0], front[1], front[2], front[3], color);
}

/** Un coin de l'hexagone de rayon `r` autour de (`x`, `z`), tourné de `yaw`. */
const hexCorner = (x: number, z: number, r: number, yaw: number, k: number): readonly [number, number] => {
  const a = yaw + (Math.PI * k) / 3;
  return [x + r * Math.cos(a), z + r * Math.sin(a)];
};

/**
 * Un prisme à six pans nets, debout (une colonne de basalte, un bloc, une dalle) : de `y0` à `top(k)` à chacun de ses six
 * coins (un dessus plat, ou cassé en biais) ; ses pans en tranches aux hauteurs `joints` (le joint se lit par le ton de la
 * tranche, deux tons qui alternent), son dessus en quatre triangles. Seize triangles d'une seule tranche, douze de plus
 * par joint. `edge` : le pan le plus tourné vers le soleil (`sun`, à plat) prend sa couleur claire, sur toute sa hauteur,
 * pour que les six pans se lisent de loin (retouche 1 de l'Épaule, directeur artistique, point 7) ; sans triangle de plus.
 */
export function hexColumn(b: FacetBuilder, x: number, z: number, r: number, yaw: number, y0: number, top: (k: number) => number, tones: readonly [number, number], face: number, joints: readonly number[] = [], edge?: { color: number; sun: { x: number; z: number } }): void {
  const xz = Array.from({ length: 6 }, (_, k) => hexCorner(x, z, r, yaw, k));
  // Le pan au soleil : celui dont le milieu s'écarte le plus du centre vers le soleil.
  let lit = -1;
  if (edge) {
    let best = -Infinity;
    for (let k = 0; k < 6; k++) {
      const m = (k + 1) % 6;
      const d = (xz[k][0] + xz[m][0] - 2 * x) * edge.sun.x + (xz[k][1] + xz[m][1] - 2 * z) * edge.sun.z;
      if (d > best) [best, lit] = [d, k];
    }
  }
  const levels = [y0, ...joints];
  levels.forEach((from, i) => {
    const last = i === levels.length - 1;
    const to = (k: number) => (last ? top(k) : levels[i + 1]);
    for (let k = 0; k < 6; k++) {
      const m = (k + 1) % 6;
      const [ax, az] = xz[k],
        [cx, cz] = xz[m];
      b.quad([cx, from, cz], [ax, from, az], [ax, to(k), az], [cx, to(m), cz], k === lit ? edge!.color : tones[i % 2]);
    }
  });
  const t = xz.map(([px, pz], k) => [px, top(k), pz] as P3);
  // Le dessus, vu d'en haut, dans le sens inverse des aiguilles d'une montre : (0, 5, 4), (0, 4, 3), (0, 3, 1), (1, 3, 2).
  b.triangle(t[0], t[5], t[4], face);
  b.triangle(t[0], t[4], t[3], face);
  b.triangle(t[0], t[3], t[1], face);
  b.triangle(t[1], t[3], t[2], face);
}

/** Une dalle à six pans posée à plat (son dessus seul, quatre triangles), au-dessus du sol `y`. */
export function hexPlate(b: FacetBuilder, x: number, z: number, r: number, yaw: number, y: number, color: number): void {
  const t = Array.from({ length: 6 }, (_, k) => {
    const [px, pz] = hexCorner(x, z, r, yaw, k);
    return [px, y, pz] as P3;
  });
  b.triangle(t[0], t[5], t[4], color);
  b.triangle(t[0], t[4], t[3], color);
  b.triangle(t[0], t[3], t[1], color);
  b.triangle(t[1], t[3], t[2], color);
}

/** Un fil, un étai ou un manche à trois pans, tendu entre deux points : six triangles, sans bouts. */
export function strut(b: FacetBuilder, a: P3, c: P3, r: number, color: number): void {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const k = d.map((v) => v / len);
  const ref = Math.abs(k[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [k[1] * ref[2] - k[2] * ref[1], k[2] * ref[0] - k[0] * ref[2], k[0] * ref[1] - k[1] * ref[0]];
  const ul = Math.hypot(u[0], u[1], u[2]);
  u = u.map((x) => x / ul);
  const w = [k[1] * u[2] - k[2] * u[1], k[2] * u[0] - k[0] * u[2], k[0] * u[1] - k[1] * u[0]];
  const ring = (p: P3) =>
    [0, 1, 2].map((i) => {
      const t = (2 * Math.PI * i) / 3;
      const cx = Math.cos(t) * r,
        cy = Math.sin(t) * r;
      return [p[0] + u[0] * cx + w[0] * cy, p[1] + u[1] * cx + w[1] * cy, p[2] + u[2] * cx + w[2] * cy] as const;
    });
  const A = ring(a),
    B = ring(c);
  for (let i = 0; i < 3; i++) {
    const n = (i + 1) % 3;
    b.quad(A[i], A[n], B[n], B[i], color);
  }
}

/**
 * Les assises de la pierre grise des Passeurs (retouche 1 de l'Épaule, directeur artistique, point 9 : les murs se
 * lisaient comme des aplats lisses, la remise comme un hangar de tôle) : sur les quatre faces d'un volume `size` posé en
 * `at` (son pied, comme `box`), un joint sombre à chaque hauteur de `heights` (depuis son pied), à peine hors de la face,
 * à la manière des joints du quai de la Soute. Huit triangles par joint.
 */
const COURSE = { t: 0.07, off: 0.008 } as const;

export function courses(b: FacetBuilder, at: { x: number; y: number; z: number; yaw?: number }, size: readonly [number, number, number], heights: readonly number[], color: number = EPAULE_COLORS.joint): void {
  const [w, h, d] = size;
  const hw = w / 2 + COURSE.off,
    hd = d / 2 + COURSE.off;
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw: at.yaw ?? 0 }, (l) => {
    for (const y of heights) {
      if (y <= 0.05 || y >= h - 0.05) continue;
      const y1 = y + COURSE.t;
      l.quad([-hw, y, hd], [hw, y, hd], [hw, y1, hd], [-hw, y1, hd], color);
      l.quad([hw, y, -hd], [-hw, y, -hd], [-hw, y1, -hd], [hw, y1, -hd], color);
      l.quad([hw, y, hd], [hw, y, -hd], [hw, y1, -hd], [hw, y1, hd], color);
      l.quad([-hw, y, -hd], [-hw, y, hd], [-hw, y1, hd], [-hw, y1, -hd], color);
    }
  });
}

/** Les hauteurs des assises d'un mur de pierre grise, depuis son pied visible : tous les 0,85, deux ou trois. */
export const COURSE_HEIGHTS = [0.85, 1.7, 2.55] as const;
