// Le kit commun des lieux du 4e (reste des Fabriques, expert frontend, 21 octobre 2026 ; intention du Bastion du 22
// octobre 2026, « Les restes des Fabriques », point 1) : ce que la Forge, la Soute, la Porte et l'Étalon recopiaient
// chacun, et que les lieux du Bastion importent au lieu de le recopier encore : la lanterne pendue des Passeurs (d'ocre ou
// éteinte), une dalle épaisse sous un contour, le dessin d'une trace posé au centre du lieu, le sol du 4e dans le repère
// d'un lieu, et le quadrilatère tourné vers le dehors. Code pur.
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
