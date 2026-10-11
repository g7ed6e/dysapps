// L'atelier des objets dessinés d'Archipéo (lot 1 du 6e de la piste 3 « hybride » du directeur artistique, choisie par
// le mainteneur le 11 octobre 2026 ; « Top le style », 11 octobre 2026) : les primitives dont les petites constructions,
// le bloc d'or des Gardiens et les objets du quai sont faits, low poly en aplats francs, sans texture, dessinés par le
// code (aucun fichier importé).
//
// Un objet se dessine dans son repère de grille (x vers la droite, y vers le fond, z vers le haut, z = 0 sur le sol,
// comme world/fixtures.ts), et l'atelier le pose dans le monde (repère de Three : X = x, Y = la hauteur, Z = y), tourné
// avec son île (GD-9, `turnPoint`). Chaque facette a une couleur unie (`Tint` : une couleur, ou le dessus et le côté
// d'une matière, choisis par la normale) ; la lumière de la scène fait le reste. Deux pinceaux : l'opaque, et le feu
// (les vitres des lanternes, allumées la nuit sans clignoter, comme celles des cours). Code pur, sans Three.js.
import { Pinceau, type Peindre, type RGB, rgb, type Trace, type V3 } from '../decor/brush';
import { lineaire } from '../landMesh';
import type { Couleur, Faces } from '../palette';
import type { Facette } from '../architecture/rooms';

/** Une couleur unie, ou les deux couleurs d'une matière : le dessus pour ce qui regarde vers le haut, le côté ailleurs. */
export type Tint = Couleur | Faces;

const toLinear = (c: Couleur): RGB => rgb(c).map((v) => lineaire(v / 255)) as RGB;

/** Une facette regarde vers le haut (elle prend le dessus de sa matière) au-delà de cette pente. */
const FACING_UP = 0.6;

/** La façon de peindre une teinte : un aplat franc, le dessus ou le côté selon la normale. */
export function flatPaint(t: Tint): Peindre {
  if (typeof t === 'number') {
    const k = toLinear(t);
    return () => k;
  }
  const d = toLinear(t.dessus);
  const c = toLinear(t.cote);
  return (_p, n) => (n[1] > FACING_UP ? d : c);
}

/** Une couleur multipliée par `k` sur ses trois canaux (plus sombre sous 1, plus claire au-dessus, bornée à 255). */
export function scaleColor(c: Couleur, k: number): Couleur {
  const ch = (shift: number) => Math.min(255, Math.round(((c >> shift) & 255) * k));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Une teinte un peu plus sombre (le second ton d'un aplat), sur les deux faces. */
export const darker = (f: Faces, k = 0.86): Faces => ({ dessus: scaleColor(f.dessus, k), cote: scaleColor(f.cote, k) });

/** D'un point de la grille de l'objet au repère de Three, dans le monde. */
export type ToWorld = (x: number, y: number, z: number) => V3;

/** Les faces d'une boîte qu'on ne dessine pas : `bottom` (posée, par défaut), `top`, et les quatre côtés. */
export interface SkipFaces {
  top?: boolean;
  bottom?: boolean;
  /** Le côté tourné vers +x, −x, +y, −y. */
  px?: boolean;
  nx?: boolean;
  py?: boolean;
  ny?: boolean;
}

/** Un point d'un anneau à `n` pans autour de (cx, cy), tourné de `rot` (par défaut d'un demi-pan : un pan à plat vers chaque axe). */
const onRing = (cx: number, cy: number, r: number, z: number, i: number, n: number, rot = Math.PI / n): V3 => {
  const a = rot + (i / n) * Math.PI * 2;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
};

/** Deux directions unitaires perpendiculaires à `d` et entre elles (horizontale d'abord, si `d` ne monte pas tout droit). */
function perpendiculars(d: V3): [V3, V3] {
  const l = Math.hypot(...d);
  const u: V3 = [d[0] / l, d[1] / l, d[2] / l];
  const h = Math.hypot(u[0], u[1]) > 1e-3 ? ([-u[1], u[0], 0] as V3) : ([1, 0, 0] as V3);
  const hl = Math.hypot(...h);
  const p: V3 = [h[0] / hl, h[1] / hl, h[2] / hl];
  const q: V3 = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]];
  return [p, q];
}

export class Workshop {
  /** Le tracé dans le repère de Three de l'objet (X, Y : la hauteur, Z), pour les primitives du décor (../decor/brush.ts). */
  readonly trace: Trace;

  constructor(
    /** Ce qui est opaque. */
    readonly opaque: Pinceau,
    /** Le feu (les vitres d'une lanterne, allumées la nuit) ; `null` : dans l'opaque (une île fermée, rien ne s'allume). */
    readonly fire: Pinceau | null,
    private readonly toWorld: ToWorld,
  ) {
    const toThree = (v: V3): V3 => toWorld(v[0], v[2], v[1]);
    this.trace = {
      triangle: (a, b, c, d, paint) => opaque.triangle(toThree(a), toThree(b), toThree(c), toThree(d), paint),
      quad: (a, b, c, d, e, paint) => opaque.quad(toThree(a), toThree(b), toThree(c), toThree(d), toThree(e), paint),
    };
  }

  private m(v: V3): V3 {
    return this.toWorld(v[0], v[1], v[2]);
  }

  /** Un triangle ; `inside` : un point du côté opposé à sa face visible. `pane` : dans le feu. */
  tri(a: V3, b: V3, c: V3, inside: V3, t: Tint, pane = false): void {
    (pane && this.fire ? this.fire : this.opaque).triangle(this.m(a), this.m(b), this.m(c), this.m(inside), flatPaint(t));
  }

  /** Un quadrilatère plan (deux triangles). */
  quad(a: V3, b: V3, c: V3, d: V3, inside: V3, t: Tint, pane = false): void {
    (pane && this.fire ? this.fire : this.opaque).quad(this.m(a), this.m(b), this.m(c), this.m(d), this.m(inside), flatPaint(t));
  }

  /** Le nombre de triangles tracés, opaque et feu. */
  get triangles(): number {
    return this.opaque.triangles + (this.fire?.triangles ?? 0);
  }

  /** Une boîte de (x0, y0, z0) à (x1, y1, z1), sans son dessous (posée) sauf demande : 10 triangles. */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t: Tint, skip: SkipFaces = { bottom: true }): void {
    const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    if (!skip.top) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, t);
    if (!skip.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c, t);
    if (!skip.px) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c, t);
    if (!skip.nx) this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], c, t);
    if (!skip.py) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], c, t);
    if (!skip.ny) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, t);
  }

  /** Une boîte centrée en (cx, cy), de `lx` × `ly`, de z0 à z1. */
  block(cx: number, cy: number, lx: number, ly: number, z0: number, z1: number, t: Tint, skip?: SkipFaces): void {
    this.box(cx - lx / 2, cx + lx / 2, cy - ly / 2, cy + ly / 2, z0, z1, t, skip);
  }

  /**
   * Un tronc de prisme à `n` pans autour de (cx, cy), du rayon `r0` en z0 au rayon `r1` en z1 (`r1` nul : une pyramide),
   * son dessus fermé sauf `open` ; sans dessous. `rot` : l'angle du premier sommet.
   */
  prism(cx: number, cy: number, r0: number, r1: number, z0: number, z1: number, n: number, t: Tint, rot = Math.PI / n, open = false): void {
    const inside: V3 = [cx, cy, z0 + (z1 - z0) * 0.3];
    for (let i = 0; i < n; i++) {
      const a0 = onRing(cx, cy, r0, z0, i, n, rot);
      const a1 = onRing(cx, cy, r0, z0, i + 1, n, rot);
      if (r1 <= 1e-6) this.tri(a0, a1, [cx, cy, z1], inside, t);
      else this.quad(a0, a1, onRing(cx, cy, r1, z1, i + 1, n, rot), onRing(cx, cy, r1, z1, i, n, rot), inside, t);
    }
    if (r1 > 1e-6 && !open) this.disc(cx, cy, z1, r1, n, t, rot);
  }

  /** Un disque à `n` pans, tourné vers le haut (vers le bas si `bottom`). */
  disc(cx: number, cy: number, z: number, r: number, n: number, t: Tint, rot = Math.PI / n, bottom = false): void {
    const d: V3 = [cx, cy, bottom ? z + 1 : z - 1];
    for (let i = 1; i + 1 < n; i++) this.tri(onRing(cx, cy, r, z, 0, n, rot), onRing(cx, cy, r, z, i, n, rot), onRing(cx, cy, r, z, i + 1, n, rot), d, t);
  }

  /** La couronne plate de `r0` à `r1` à la hauteur `z`, tournée vers le haut. */
  annulus(cx: number, cy: number, z: number, r0: number, r1: number, n: number, t: Tint, rot = Math.PI / n): void {
    const d: V3 = [cx, cy, z - 1];
    for (let i = 0; i < n; i++) this.quad(onRing(cx, cy, r0, z, i, n, rot), onRing(cx, cy, r0, z, i + 1, n, rot), onRing(cx, cy, r1, z, i + 1, n, rot), onRing(cx, cy, r1, z, i, n, rot), d, t);
  }

  /** Le flanc intérieur d'un anneau de rayon `r`, de z0 à z1, tourné vers l'axe (la paroi d'un bassin rond). */
  innerWall(cx: number, cy: number, r: number, z0: number, z1: number, n: number, t: Tint, rot = Math.PI / n): void {
    for (let i = 0; i < n; i++) {
      const m = onRing(cx, cy, r * 1.5, (z0 + z1) / 2, i + 0.5, n, rot);
      this.quad(onRing(cx, cy, r, z0, i, n, rot), onRing(cx, cy, r, z0, i + 1, n, rot), onRing(cx, cy, r, z1, i + 1, n, rot), onRing(cx, cy, r, z1, i, n, rot), m, t);
    }
  }

  /** Une pyramide à base rectangulaire (centrée, de demi-côtés `dx`, `dy`), de z0 à sa pointe en z1 : 4 triangles. */
  pyramid(cx: number, cy: number, dx: number, dy: number, z0: number, z1: number, t: Tint): void {
    const c: V3[] = [
      [cx - dx, cy - dy, z0],
      [cx + dx, cy - dy, z0],
      [cx + dx, cy + dy, z0],
      [cx - dx, cy + dy, z0],
    ];
    const d: V3 = [cx, cy, z0 + (z1 - z0) * 0.2];
    for (let i = 0; i < 4; i++) this.tri(c[i], c[(i + 1) % 4], [cx, cy, z1], d, t);
  }

  /**
   * Un coin (le pupitre d'un copiste, l'écritoire) : une boîte de (x0, y0) à (x1, y1), sans dessous, dont le dessus monte
   * de `zFront` devant (y0) à `zBack` au fond (y1). 10 triangles.
   */
  wedge(x0: number, x1: number, y0: number, y1: number, z0: number, zFront: number, zBack: number, t: Tint): void {
    const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, z0 + (Math.min(zFront, zBack) - z0) / 2];
    this.quad([x0, y0, zFront], [x1, y0, zFront], [x1, y1, zBack], [x0, y1, zBack], c, t);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, zFront], [x0, y0, zFront], c, t);
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, zBack], [x0, y1, zBack], c, t);
    for (const x of [x0, x1]) this.quad([x, y0, z0], [x, y1, z0], [x, y1, zBack], [x, y0, zFront], c, t);
  }

  /**
   * Une poutre de section carrée `side` de `a` à `b` (penchée, couchée ou debout) : ses quatre flancs, ses bouts si
   * `ends`. 8 triangles (12 avec les bouts).
   */
  beam(a: V3, b: V3, side: number, t: Tint, ends = false): void {
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d);
    const u: V3 = [d[0] / l, d[1] / l, d[2] / l];
    // Une perpendiculaire : horizontale si la poutre ne monte pas tout droit.
    const h = Math.hypot(u[0], u[1]) > 1e-3 ? ([-u[1], u[0], 0] as V3) : ([1, 0, 0] as V3);
    const hl = Math.hypot(...h);
    const p: V3 = [h[0] / hl, h[1] / hl, h[2] / hl];
    const q: V3 = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]];
    const e = side / 2;
    const corner = (o: V3, s: number, r: number): V3 => [o[0] + (p[0] * s + q[0] * r) * e, o[1] + (p[1] * s + q[1] * r) * e, o[2] + (p[2] * s + q[2] * r) * e];
    const around: [number, number][] = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let i = 0; i < 4; i++) {
      const [s0, r0] = around[i];
      const [s1, r1] = around[(i + 1) % 4];
      this.quad(corner(a, s0, r0), corner(a, s1, r1), corner(b, s1, r1), corner(b, s0, r0), m, t);
    }
    if (ends)
      for (const o of [a, b]) {
        const pts = around.map(([s, r]) => corner(o, s, r));
        this.quad(pts[0], pts[1], pts[2], pts[3], m, t);
      }
  }

  /**
   * Une pointe à `n` pans sur un axe quelconque (un éclat d'obsidienne penché, une fronde de fougère) : l'anneau de
   * rayon `r` autour de `base`, perpendiculaire à l'axe, jusqu'à la pointe `tip`. `n` triangles, sans fond (posée ou
   * enfoncée dans le sol).
   */
  spike(base: V3, tip: V3, r: number, n: number, t: Tint, rot = 0): void {
    const [p, q] = perpendiculars([tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]]);
    const ring = (i: number): V3 => {
      const a = rot + (i / n) * Math.PI * 2;
      const [c, s] = [Math.cos(a) * r, Math.sin(a) * r];
      return [base[0] + p[0] * c + q[0] * s, base[1] + p[1] * c + q[1] * s, base[2] + p[2] * c + q[2] * s];
    };
    for (let i = 0; i < n; i++) this.tri(ring(i), ring(i + 1), tip, base, t);
  }

  /**
   * Un disque debout, tourné vers `toward` (un des quatre côtés : +x, −x, +y, −y), centré en `c`, à `n` pans (le cadran
   * d'une horloge, la vitre ronde d'un pignon) : `n − 2` triangles.
   */
  standingDisc(c: V3, toward: 'px' | 'nx' | 'py' | 'ny', r: number, n: number, t: Tint, rot = 0): void {
    const plane = toward === 'px' || toward === 'nx' ? 'x' : 'y';
    const s = toward[0] === 'p' ? 1 : -1;
    const pt = (i: number): V3 => {
      const a = rot + (i / n) * Math.PI * 2;
      const [u, w] = [Math.cos(a) * r, Math.sin(a) * r];
      return plane === 'x' ? [c[0], c[1] + u, c[2] + w] : [c[0] + u, c[1], c[2] + w];
    };
    const behind: V3 = plane === 'x' ? [c[0] - s, c[1], c[2]] : [c[0], c[1] - s, c[2]];
    for (let i = 1; i + 1 < n; i++) this.tri(pt(0), pt(i), pt(i + 1), behind, t);
  }

  /** Un rouleau couché à `n` pans, d'axe x ou y, de `from` à `a` le long de cet axe, centré en (u, z) sur l'autre : sans bouts. */
  roller(axis: 'x' | 'y', from: number, a: number, u: number, z: number, r: number, n: number, t: Tint): void {
    const pt = (k: number, w: number): V3 => {
      const ang = ((k + 0.5) / n) * Math.PI * 2;
      const [du, dz] = [r * Math.cos(ang), r * Math.sin(ang)];
      return axis === 'x' ? [w, u + du, z + dz] : [u + du, w, z + dz];
    };
    const m: V3 = axis === 'x' ? [(from + a) / 2, u, z] : [u, (from + a) / 2, z];
    for (let k = 0; k < n; k++) this.quad(pt(k, from), pt(k + 1, from), pt(k + 1, a), pt(k, a), m, t);
  }

  /**
   * Un toit à deux pans de (x0, y0) à (x1, y1), le faîte le long de `axis` (au milieu de l'autre côté), de l'avant-toit
   * en `zLow` au faîte en `zHigh`, épais de `thickness` : ses deux pans, leurs dessous, les rives de l'avant-toit et les
   * bouts en V renversé (20 triangles ; sans épaisseur, les deux pans seuls : 4) ; `gables` : les deux pignons pleins sous lui, de `zFoot` à l'avant-toit (le
   * nichoir, la vitrine), 2 ou 6 triangles de plus selon qu'ils descendent ou non.
   */
  roof(x0: number, x1: number, y0: number, y1: number, zLow: number, zHigh: number, axis: 'x' | 'y', thickness: number, t: Tint, gables?: { tint: Tint; zFoot: number }): void {
    // Dans le repère du toit : le long du faîte `l`, en travers `w`.
    const [l0, l1, w0, w1] = axis === 'x' ? [x0, x1, y0, y1] : [y0, y1, x0, x1];
    const wm = (w0 + w1) / 2;
    const pt = (l: number, w: number, z: number): V3 => (axis === 'x' ? [l, w, z] : [w, l, z]);
    const zOf = (w: number) => (w === wm ? zHigh : zLow);
    const e = thickness;
    const lm = (l0 + l1) / 2;
    const under: V3 = pt(lm, wm, zLow - 1);
    const top: V3 = pt(lm, wm, zHigh + 1);
    for (const w of [w0, w1]) {
      this.quad(pt(l0, w, zOf(w)), pt(l1, w, zOf(w)), pt(l1, wm, zHigh), pt(l0, wm, zHigh), under, t);
      if (e <= 0) continue;
      this.quad(pt(l0, w, zOf(w) - e), pt(l1, w, zOf(w) - e), pt(l1, wm, zHigh - e), pt(l0, wm, zHigh - e), top, t);
      this.quad(pt(l0, w, zLow), pt(l1, w, zLow), pt(l1, w, zLow - e), pt(l0, w, zLow - e), pt(lm, wm, zLow - e / 2), t);
      for (const l of [l0, l1]) this.quad(pt(l, w, zLow), pt(l, wm, zHigh), pt(l, wm, zHigh - e), pt(l, w, zLow - e), pt(lm, wm, zLow), t);
    }
    if (!gables || e <= 0) return;
    const r = (w1 - w0) * 0.06;
    for (const l of [l0, l1]) {
      const inside = pt(lm, wm, zLow);
      // Le pignon, un peu en retrait sous la rive.
      const lr = l === l0 ? l0 + r : l1 - r;
      this.tri(pt(lr, w0 + r, zLow - e), pt(lr, w1 - r, zLow - e), pt(lr, wm, zHigh - e - r), inside, gables.tint);
      if (gables.zFoot < zLow - e - 1e-6) this.quad(pt(lr, w0 + r, gables.zFoot), pt(lr, w1 - r, gables.zFoot), pt(lr, w1 - r, zLow - e), pt(lr, w0 + r, zLow - e), inside, gables.tint);
    }
  }

  /**
   * Des facettes de pièce d'architecture (../architecture/rooms.ts, en part de case), posées dans la case (dx, dy, dz) ;
   * `tint` : la couleur de chacune (une vitre, `vitre` dans ../architecture/yardPieces.ts : dans le feu, de la couleur `pane`).
   */
  facets(f: readonly (Facette & { vitre?: boolean })[], dx: number, dy: number, dz: number, tint: (f: Facette) => Tint, pane?: Couleur): void {
    for (const fa of f) {
      const pts = fa.points.map(([x, y, z]) => [dx + x, dy + y, dz + z] as V3);
      const c = pts.reduce<V3>((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      const inside: V3 = [c[0] - fa.normale[0] * 0.05, c[1] - fa.normale[1] * 0.05, c[2] - fa.normale[2] * 0.05];
      const t = fa.vitre && pane !== undefined ? pane : tint(fa);
      for (let i = 1; i + 1 < pts.length; i++) this.tri(pts[0], pts[i], pts[i + 1], inside, t, Boolean(fa.vitre));
    }
  }
}

/** Un atelier sans placement (repère de l'objet = monde), pour compter les triangles d'un dessin. */
export function countingWorkshop(): Workshop {
  return new Workshop(new Pinceau(), new Pinceau(), (x, y, z) => [x, z, y]);
}
