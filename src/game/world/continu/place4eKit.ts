// Le kit commun des lieux du 4e (reste des Fabriques, expert frontend, 21 octobre 2026 ; intention du Bastion du 22
// octobre 2026, « Les restes des Fabriques », point 1) : ce que la Forge, la Soute, la Porte et l'Étalon recopiaient
// chacun, et que les lieux du Bastion importent au lieu de le recopier encore : la lanterne pendue des Passeurs (d'ocre ou
// éteinte), une dalle épaisse sous un contour, le dessin d'une trace posé au centre du lieu, le sol du 4e dans le repère
// d'un lieu, le quadrilatère tourné vers le dehors, le pan de mur droit et le pan de tôle ; depuis la retouche 1 du Bastion, le plan
// du sol d'un lieu (calculé au premier usage), le triangle tourné vers le dehors et la ferrure vide. Code pur.
import { FacetBuilder, drawPosed } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

type P3 = readonly [number, number, number];

/** Les couleurs de la lanterne : l'ocre, seule lumière ; la vitre éteinte ; le chapeau de bronze (une ferrure). */
const LANTERN_4E = { lit: COLORS_5E.lantern, off: 0xbfc4b8, bronze: 0x9c8452 } as const;

/** Une lanterne pendue (sa vitre, un pavé ; son chapeau de bronze en pointe), d'ocre ou éteinte. */
export function lantern(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * s, z: top.z }, [0.24 * s, 0.3 * s, 0.24 * s], lit ? LANTERN_4E.lit : LANTERN_4E.off);
  b.prism({ x: top.x, y: top.y - 0.04 * s, z: top.z, yaw: Math.PI / 4 }, 0.21 * s, 0, 0.16 * s, 4, LANTERN_4E.bronze);
}

/** Une dalle épaisse de `by` sous un contour (son dessus, dans le sens inverse des aiguilles d'une montre vu d'en haut). */
export function slab(b: FacetBuilder, top: readonly P3[], by: number, color: number, face: number): void {
  const bot = top.map(([x, y, z]) => [x, y - by, z] as const);
  const n = top.length;
  for (let k = 1; k < n - 1; k++) b.triangle(top[0], top[k], top[k + 1], face);
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.quad(bot[k], bot[m], top[m], top[k], color);
  }
}

/** Dessine dans le repère du lieu (tourné de `yaw`), puis pose le dessin au centre du lieu (`c`), dans le monde. */
export function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void, yaw = 0): void {
  drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw }, draw);
}

/** Le sol du 4e sous un point du repère d'un lieu (centré en `center`), depuis le sol de son centre. */
export function localGround4e(center: Vec2): (lx: number, lz: number) => number {
  const h0 = standingHeight(heightAt4e(center));
  return (lx, lz) => standingHeight(heightAt4e({ x: center.x + lx, z: center.z + lz })) - h0;
}

/** Un quadrilatère tourné vers `out` (sa normale du même côté), quel que soit l'ordre de ses coins. */
export function quadOut(b: FacetBuilder, a: P3, c: P3, d: P3, e: P3, out: P3, color: number): void {
  const ux = c[0] - a[0],
    uy = c[1] - a[1],
    uz = c[2] - a[2];
  const vx = d[0] - a[0],
    vy = d[1] - a[1],
    vz = d[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.quad(a, c, d, e, color);
  else b.quad(e, d, c, a, color);
}

/**
 * Un pan de mur droit, d'ouest en est (`alongX`) ou du nord au sud, de `from` à `to` sur son axe, centré sur `at` en
 * travers, épais de `thick`, de `y0` jusqu'à `top0` à son début et `top1` à sa fin (un haut cassé en biais) : son dessus,
 * ses deux faces, ses deux bouts (le dessous ne se voit pas).
 */
export function wallRun(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, thick: number, y0: number, top0: number, top1: number, side: number, top: number): void {
  const t = thick / 2;
  const p = (u: number, v: number, y: number): P3 => (alongX ? [u, y, at + v] : [at + v, y, u]);
  const corners = [p(from, -t, 0), p(to, -t, 0), p(to, t, 0), p(from, t, 0)];
  const lo = corners.map(([x, , z]) => [x, y0, z] as P3);
  const hi = corners.map(([x, , z], k) => [x, k === 0 || k === 3 ? top0 : top1, z] as P3);
  const mid: P3 = [(lo[0][0] + lo[2][0]) / 2, (y0 + Math.max(top0, top1)) / 2, (lo[0][2] + lo[2][2]) / 2];
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    const fc: P3 = [(lo[k][0] + lo[m][0]) / 2 - mid[0], 0, (lo[k][2] + lo[m][2]) / 2 - mid[2]];
    quadOut(b, lo[k], lo[m], hi[m], hi[k], fc, side);
  }
  quadOut(b, hi[0], hi[1], hi[2], hi[3], [0, 1, 0], top);
}

/** Un pan de tôle épais de `t` (dessus et dessous), entre quatre coins dans l'ordre du tour : le dessus de `top`, le dessous de `under`. */
export function sheet(b: FacetBuilder, q: readonly P3[], t: number, top: number, under: number): void {
  const up = q.map(([x, y, z]) => [x, y + t, z] as P3);
  quadOut(b, up[0], up[1], up[2], up[3], [0, 1, 0], top);
  quadOut(b, q[0], q[1], q[2], q[3], [0, -1, 0], under);
  const cx = q.reduce((s, p) => s + p[0], 0) / 4,
    cz = q.reduce((s, p) => s + p[2], 0) / 4;
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    quadOut(b, q[k], q[m], up[m], up[k], [(q[k][0] + q[m][0]) / 2 - cx, 0, (q[k][2] + q[m][2]) / 2 - cz], under);
  }
}

/**
 * Le plan du sol d'un lieu (relecture du code du Bastion, point 5, et retouche 1, point 18) : ajusté aux moindres carrés
 * sur le sol du 4e (`localGround`, dans le repère du lieu) dans le rectangle `xs` × `zs`, relevé juste assez pour ne
 * jamais passer sous le sol. Calculé au premier usage, jamais à l'import : `northShore.ts` importe les lieux du 4e pour
 * tous les niveaux, et le 6e comme le 5e ne paient plus ce calcul. Rend la hauteur du plan en un point du repère.
 */
export function groundPlane4e(localGround: (lx: number, lz: number) => number, xs: readonly [number, number], zs: readonly [number, number]): (x: number, z: number) => number {
  let fit: { a: number; b: number; c: number } | undefined;
  const solve = () => {
    const pts: [number, number, number][] = [];
    for (let x = xs[0]; x <= xs[1] + 1e-6; x += 0.5) for (let z = zs[0]; z <= zs[1] + 1e-6; z += 0.5) pts.push([x, z, localGround(x, z)]);
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const mz = pts.reduce((s, p) => s + p[1], 0) / n;
    const my = pts.reduce((s, p) => s + p[2], 0) / n;
    let sxx = 0,
      szz = 0,
      sxz = 0,
      sxy = 0,
      szy = 0;
    for (const [x, z, y] of pts) {
      sxx += (x - mx) ** 2;
      szz += (z - mz) ** 2;
      sxz += (x - mx) * (z - mz);
      sxy += (x - mx) * (y - my);
      szy += (z - mz) * (y - my);
    }
    const det = sxx * szz - sxz * sxz;
    const b = (sxy * szz - szy * sxz) / det;
    const c = (szy * sxx - sxy * sxz) / det;
    let hi = -Infinity;
    for (const [x, z, y] of pts) hi = Math.max(hi, y - b * x - c * z);
    return { a: hi + 0.04, b, c };
  };
  return (x, z) => {
    fit ??= solve();
    return fit.a + fit.b * x + fit.c * z;
  };
}

/** Une valeur calculée au premier usage, puis gardée (le pied d'un lieu, la hauteur de sa scène : jamais à l'import). */
export function once<T>(make: () => T): () => T {
  let done = false;
  let value: T;
  return () => {
    if (!done) {
      value = make();
      done = true;
    }
    return value;
  };
}

/** Un triangle tourné vers `out` (sa normale du même côté), quel que soit l'ordre de ses coins. */
export function triOut(b: FacetBuilder, a: P3, c: P3, d: P3, out: P3, color: number): void {
  const n = [(c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]), (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]), (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/** La couleur de la ferrure vide du 4e (un fer éteint, jamais la rouille claire) et de ses chevilles nues. */
const BRACKET_4E = { plate: 0x6a483e, plateTop: 0x74524a, peg: 0x5c504c } as const;

/**
 * La ferrure vide du 4e, le signe de l'absence : une petite plaque de fer éteint, deux chevilles nues, tournée vers `n`
 * (x ou z) ; `w` la largeur de la plaque (la Loge 0,34, la Manufacture 0,4).
 */
export function emptyBracket(b: FacetBuilder, x: number, y: number, z: number, nx: number, nz: number, w = 0.34): void {
  const k = w / 0.34;
  b.box({ x, y: y - 0.12, z, yaw: Math.atan2(nx, nz) }, [w, 0.24, 0.06 * k], BRACKET_4E.plate, BRACKET_4E.plateTop);
  for (const s of [-0.09 * k, 0.09 * k]) b.box({ x: x + nx * 0.09 * k + nz * s, y: y - 0.04, z: z + nz * 0.09 * k - nx * s, yaw: Math.atan2(nx, nz) }, [0.06, 0.06, 0.12 * k], BRACKET_4E.peg);
}
/**
 * Le haut plein d'un arc rond (retouche 1 du Bastion, points 2 et 4 : « en plein cintre, plus de pans coupés ») : de
 * chaque côté (`side` −1 à gauche, +1 à droite), le mur entre la naissance (`spring`) et le haut de l'arc (`crown`), dans un
 * mur parallèle à x, de `z0` à `z0 + thick` ; l'intrados en `segs` pans le long du quart de cercle (d'un rayon `r` en
 * largeur et `crown − spring` en hauteur : un arc surbaissé si la hauteur est moindre). `inner` arrête le haut plein à
 * cette distance du milieu (un arc cassé en haut, dans une ruine). Ses deux faces de `face`, l'intrados de `soffit`.
 */
export function archSpandrel(b: FacetBuilder, z0: number, thick: number, cx: number, r: number, spring: number, crown: number, side: -1 | 1, face: number, soffit: number, inner = 0, segs = 3): void {
  const rise = crown - spring;
  const end = Math.acos(Math.min(1, inner / r));
  const arc: [number, number][] = [];
  for (let k = 0; k <= segs; k++) {
    const t = (end * k) / segs;
    arc.push([cx + side * r * Math.cos(t), spring + rise * Math.sin(t)]);
  }
  const corner: [number, number] = [cx + side * r, crown];
  let outline: [number, number][] = [corner, ...arc];
  if (inner > 1e-6) outline.push([cx + side * inner, crown]);
  // Dans le sens inverse des aiguilles d'une montre vu de +z, le coin d'abord (le dessin part de lui en éventail).
  const area = outline.reduce((s, [x, y], k) => {
    const [nx, ny] = outline[(k + 1) % outline.length];
    return s + x * ny - nx * y;
  }, 0);
  if (area < 0) outline = [outline[0], ...outline.slice(1).reverse()];
  const z1 = z0 + thick;
  for (let k = 1; k < outline.length - 1; k++) {
    const [a, c, d] = [outline[0], outline[k], outline[k + 1]];
    triOut(b, [a[0], a[1], z1], [c[0], c[1], z1], [d[0], d[1], z1], [0, 0, 1], face);
    triOut(b, [a[0], a[1], z0], [c[0], c[1], z0], [d[0], d[1], z0], [0, 0, -1], face);
  }
  for (let k = 0; k < arc.length - 1; k++) {
    const [p, q] = [arc[k], arc[k + 1]];
    const mx = (p[0] + q[0]) / 2,
      my = (p[1] + q[1]) / 2;
    quadOut(b, [p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], [cx - mx, spring - my, 0], soffit);
  }
}

/**
 * Les assises d'un pan de brique (retouche 1 du Bastion, point 3 : « des assises lisibles, un aplat d'ombre de joint ») :
 * des bandes sombres et fines à la hauteur `ys`, posées un rien devant une face de mur (`out`, la normale de la face),
 * de `a` à `b` le long du mur (`alongX` : d'ouest en est, sinon du nord au sud), sur la face à `at` en travers.
 */
export function courses(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, ys: readonly number[], out: -1 | 1, color: number): void {
  const v = at + out * 0.012;
  const p = (u: number, y: number): P3 => (alongX ? [u, y, v] : [v, y, u]);
  const n: P3 = alongX ? [0, 0, out] : [out, 0, 0];
  for (const y of ys) quadOut(b, p(from, y - 0.035), p(to, y - 0.035), p(to, y + 0.035), p(from, y + 0.035), n, color);
}
