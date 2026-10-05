// Les polygones du sol : couper une facette au niveau de l'eau ou sous un dessus caché, son aire au sol, ses coins.
import type { Colonne } from './field';
import { COINS } from './settings';

export type V3 = [number, number, number];

export type RGB = [number, number, number];

/** Un sommet en cours de découpe : sa position et sa couleur de base (canaux 0..255). */
export interface Sommet {
  p: V3;
  c: RGB;
}

/** Garde d'un polygone convexe la part sous (ou sur) `h` le long d'un axe (la hauteur par défaut), en coupant ses arêtes. */
export function couper(poly: Sommet[], h: number, dessous: boolean, axe: 0 | 1 | 2 = 1): Sommet[] {
  const out: Sommet[] = [];
  const f = (v: Sommet) => (dessous ? h - v.p[axe] : v.p[axe] - h);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const k = fa / (fa - fb);
      out.push({ p: [0, 1, 2].map((j) => a.p[j] + (b.p[j] - a.p[j]) * k) as V3, c: [0, 1, 2].map((j) => a.c[j] + (b.c[j] - a.c[j]) * k) as RGB });
    }
  }
  return out;
}

/** L'aire d'un polygone vu de dessus. */
export function aireAuSol(poly: Sommet[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i].p;
    const q = poly[(i + 1) % poly.length].p;
    a += p[0] * q[2] - q[0] * p[2];
  }
  return Math.abs(a) / 2;
}

/** Au-delà de ce cosinus (moins de 14° de la verticale), une facette du dessous regarde trop bas pour être vue. */
export const DESSOUS_CACHE = 0.97;

/** Le cosinus de l'angle entre une facette et la verticale vers le bas (1 : elle regarde droit vers le bas). */
export function penteVersLeBas(a: V3, b: V3, c: V3): number {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]);
  return len < 1e-9 ? 1 : Math.abs(n[1]) / len;
}

/** L'indice du coin d'une colonne qui tombe sur un point de la grille. */
export function coinDe(col: Colonne, [px, py]: [number, number]): number {
  return COINS.findIndex(([ox, oy]) => col.x + ox === px && col.y + oy === py);
}

/** Garde d'un polygone convexe (s, y) la tranche entre deux hauteurs (Sutherland–Hodgman, deux coupes). */
export function clip(poly: [number, number][], y0: number, y1: number): [number, number][] {
  let out = poly;
  for (const [sign, h] of [
    [1, y0],
    [-1, y1],
  ] as [number, number][]) {
    if (!Number.isFinite(h)) continue;
    const input = out;
    out = [];
    // Dedans : sign · (y − h) ≥ 0.
    for (let i = 0; i < input.length; i++) {
      const p = input[i];
      const q = input[(i + 1) % input.length];
      const fp = sign * (p[1] - h);
      const fq = sign * (q[1] - h);
      if (fp >= 0) out.push(p);
      if (fp >= 0 !== fq >= 0) {
        const k = fp / (fp - fq);
        out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]);
      }
    }
    if (out.length < 3) return [];
  }
  return out;
}
