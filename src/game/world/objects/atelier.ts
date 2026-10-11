// L'atelier des objets dessinés d'Archipéo (lot 1 du 6e de la piste 3 « hybride » du directeur artistique, choisie par
// le mainteneur le 11 octobre 2026 ; « Top le style », 11 octobre 2026) : les primitives dont les petites constructions,
// le bloc d'or des Gardiens et les objets du quai sont faits, low poly en aplats francs, sans texture, dessinés par le
// code (aucun fichier importé).
//
// Un objet se dessine dans son repère de grille (x vers la droite, y vers le fond, z vers le haut, z = 0 sur le sol,
// comme world/fixtures.ts), et l'atelier le pose dans le monde (repère de Three : X = x, Y = la hauteur, Z = y), tourné
// avec son île (GD-9, `turnPoint`). Chaque facette a une couleur unie (`Teinte` : une couleur, ou le dessus et le côté
// d'une matière, choisis par la normale) ; la lumière de la scène fait le reste. Deux pinceaux : l'opaque, et le feu
// (les vitres des lanternes, allumées la nuit sans clignoter, comme celles des cours). Code pur, sans Three.js.
import { Pinceau, type Peindre, type RGB, rgb, type Trace, type V3 } from '../decor/brush';
import { lineaire } from '../landMesh';
import type { Couleur, Faces } from '../palette';
import type { Facette } from '../architecture/rooms';

/** Une couleur unie, ou les deux couleurs d'une matière : le dessus pour ce qui regarde vers le haut, le côté ailleurs. */
export type Teinte = Couleur | Faces;

const enLineaire = (c: Couleur): RGB => rgb(c).map((v) => lineaire(v / 255)) as RGB;

/** Une facette regarde vers le haut (elle prend le dessus de sa matière) au-delà de cette pente. */
const VERS_LE_HAUT = 0.6;

/** La façon de peindre une teinte : un aplat franc, le dessus ou le côté selon la normale. */
export function aplatDe(t: Teinte): Peindre {
  if (typeof t === 'number') {
    const k = enLineaire(t);
    return () => k;
  }
  const d = enLineaire(t.dessus);
  const c = enLineaire(t.cote);
  return (_p, n) => (n[1] > VERS_LE_HAUT ? d : c);
}

/** D'un point de la grille de l'objet au repère de Three, dans le monde. */
export type VersLeMonde = (x: number, y: number, z: number) => V3;

/** Les faces d'une boîte qu'on ne dessine pas : `dessous` (posée, par défaut), `dessus`, et les quatre côtés. */
export interface SansFaces {
  dessus?: boolean;
  dessous?: boolean;
  /** Le côté tourné vers +x, −x, +y, −y. */
  px?: boolean;
  nx?: boolean;
  py?: boolean;
  ny?: boolean;
}

/** Un point d'un anneau à `n` pans autour de (cx, cy), tourné de `rot` (par défaut d'un demi-pan : un pan à plat vers chaque axe). */
const surLAnneau = (cx: number, cy: number, r: number, z: number, i: number, n: number, rot = Math.PI / n): V3 => {
  const a = rot + (i / n) * Math.PI * 2;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
};

export class Atelier {
  /** Le tracé dans le repère de Three de l'objet (X, Y : la hauteur, Z), pour les primitives du décor (../decor/brush.ts). */
  readonly trace: Trace;

  constructor(
    /** Ce qui est opaque. */
    readonly opaque: Pinceau,
    /** Le feu (les vitres d'une lanterne, allumées la nuit) ; `null` : dans l'opaque (une île fermée, rien ne s'allume). */
    readonly feu: Pinceau | null,
    private readonly versLeMonde: VersLeMonde,
  ) {
    const enThree = (v: V3): V3 => versLeMonde(v[0], v[2], v[1]);
    this.trace = {
      triangle: (a, b, c, d, peindre) => opaque.triangle(enThree(a), enThree(b), enThree(c), enThree(d), peindre),
      quad: (a, b, c, d, e, peindre) => opaque.quad(enThree(a), enThree(b), enThree(c), enThree(d), enThree(e), peindre),
    };
  }

  private m(v: V3): V3 {
    return this.versLeMonde(v[0], v[1], v[2]);
  }

  /** Un triangle ; `dedans` : un point du côté opposé à sa face visible. `vitre` : dans le feu. */
  tri(a: V3, b: V3, c: V3, dedans: V3, t: Teinte, vitre = false): void {
    (vitre && this.feu ? this.feu : this.opaque).triangle(this.m(a), this.m(b), this.m(c), this.m(dedans), aplatDe(t));
  }

  /** Un quadrilatère plan (deux triangles). */
  quad(a: V3, b: V3, c: V3, d: V3, dedans: V3, t: Teinte, vitre = false): void {
    (vitre && this.feu ? this.feu : this.opaque).quad(this.m(a), this.m(b), this.m(c), this.m(d), this.m(dedans), aplatDe(t));
  }

  /** Le nombre de triangles tracés, opaque et feu. */
  get triangles(): number {
    return this.opaque.triangles + (this.feu?.triangles ?? 0);
  }

  /** Une boîte de (x0, y0, z0) à (x1, y1, z1), sans son dessous (posée) sauf demande : 10 triangles. */
  boite(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, t: Teinte, sans: SansFaces = { dessous: true }): void {
    const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    if (!sans.dessus) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, t);
    if (!sans.dessous) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c, t);
    if (!sans.px) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c, t);
    if (!sans.nx) this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], c, t);
    if (!sans.py) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], c, t);
    if (!sans.ny) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, t);
  }

  /** Une boîte centrée en (cx, cy), de `lx` × `ly`, de z0 à z1. */
  bloc(cx: number, cy: number, lx: number, ly: number, z0: number, z1: number, t: Teinte, sans?: SansFaces): void {
    this.boite(cx - lx / 2, cx + lx / 2, cy - ly / 2, cy + ly / 2, z0, z1, t, sans);
  }

  /**
   * Un tronc de prisme à `n` pans autour de (cx, cy), du rayon `r0` en z0 au rayon `r1` en z1 (`r1` nul : une pyramide),
   * son dessus fermé sauf `ouvert` ; sans dessous. `rot` : l'angle du premier sommet.
   */
  prisme(cx: number, cy: number, r0: number, r1: number, z0: number, z1: number, n: number, t: Teinte, rot = Math.PI / n, ouvert = false): void {
    const dedans: V3 = [cx, cy, z0 + (z1 - z0) * 0.3];
    for (let i = 0; i < n; i++) {
      const a0 = surLAnneau(cx, cy, r0, z0, i, n, rot);
      const a1 = surLAnneau(cx, cy, r0, z0, i + 1, n, rot);
      if (r1 <= 1e-6) this.tri(a0, a1, [cx, cy, z1], dedans, t);
      else this.quad(a0, a1, surLAnneau(cx, cy, r1, z1, i + 1, n, rot), surLAnneau(cx, cy, r1, z1, i, n, rot), dedans, t);
    }
    if (r1 > 1e-6 && !ouvert) this.disque(cx, cy, z1, r1, n, t, rot);
  }

  /** Un disque à `n` pans, tourné vers le haut (vers le bas si `dessous`). */
  disque(cx: number, cy: number, z: number, r: number, n: number, t: Teinte, rot = Math.PI / n, dessous = false): void {
    const d: V3 = [cx, cy, dessous ? z + 1 : z - 1];
    for (let i = 1; i + 1 < n; i++) this.tri(surLAnneau(cx, cy, r, z, 0, n, rot), surLAnneau(cx, cy, r, z, i, n, rot), surLAnneau(cx, cy, r, z, i + 1, n, rot), d, t);
  }

  /** La couronne plate de `r0` à `r1` à la hauteur `z`, tournée vers le haut. */
  couronne(cx: number, cy: number, z: number, r0: number, r1: number, n: number, t: Teinte, rot = Math.PI / n): void {
    const d: V3 = [cx, cy, z - 1];
    for (let i = 0; i < n; i++) this.quad(surLAnneau(cx, cy, r0, z, i, n, rot), surLAnneau(cx, cy, r0, z, i + 1, n, rot), surLAnneau(cx, cy, r1, z, i + 1, n, rot), surLAnneau(cx, cy, r1, z, i, n, rot), d, t);
  }

  /** Le flanc intérieur d'un anneau de rayon `r`, de z0 à z1, tourné vers l'axe (la paroi d'un bassin rond). */
  paroi(cx: number, cy: number, r: number, z0: number, z1: number, n: number, t: Teinte, rot = Math.PI / n): void {
    for (let i = 0; i < n; i++) {
      const m = surLAnneau(cx, cy, r * 1.5, (z0 + z1) / 2, i + 0.5, n, rot);
      this.quad(surLAnneau(cx, cy, r, z0, i, n, rot), surLAnneau(cx, cy, r, z0, i + 1, n, rot), surLAnneau(cx, cy, r, z1, i + 1, n, rot), surLAnneau(cx, cy, r, z1, i, n, rot), m, t);
    }
  }

  /** Une pyramide à base rectangulaire (centrée, de demi-côtés `dx`, `dy`), de z0 à sa pointe en z1 : 4 triangles. */
  pyramide(cx: number, cy: number, dx: number, dy: number, z0: number, z1: number, t: Teinte): void {
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
   * Une poutre de section carrée `cote` de `a` à `b` (penchée, couchée ou debout) : ses quatre flancs, ses bouts si
   * `bouts`. 8 triangles (12 avec les bouts).
   */
  poutre(a: V3, b: V3, cote: number, t: Teinte, bouts = false): void {
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d);
    const u: V3 = [d[0] / l, d[1] / l, d[2] / l];
    // Une perpendiculaire : horizontale si la poutre ne monte pas tout droit.
    const h = Math.hypot(u[0], u[1]) > 1e-3 ? ([-u[1], u[0], 0] as V3) : ([1, 0, 0] as V3);
    const hl = Math.hypot(...h);
    const p: V3 = [h[0] / hl, h[1] / hl, h[2] / hl];
    const q: V3 = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]];
    const e = cote / 2;
    const coin = (o: V3, s: number, r: number): V3 => [o[0] + (p[0] * s + q[0] * r) * e, o[1] + (p[1] * s + q[1] * r) * e, o[2] + (p[2] * s + q[2] * r) * e];
    const tour: [number, number][] = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let i = 0; i < 4; i++) {
      const [s0, r0] = tour[i];
      const [s1, r1] = tour[(i + 1) % 4];
      this.quad(coin(a, s0, r0), coin(a, s1, r1), coin(b, s1, r1), coin(b, s0, r0), m, t);
    }
    if (bouts)
      for (const o of [a, b]) {
        const pts = tour.map(([s, r]) => coin(o, s, r));
        this.quad(pts[0], pts[1], pts[2], pts[3], m, t);
      }
  }

  /** Un rouleau couché à `n` pans, d'axe x ou y, de `de` à `a` le long de cet axe, centré en (u, z) sur l'autre : sans bouts. */
  rouleau(axe: 'x' | 'y', de: number, a: number, u: number, z: number, r: number, n: number, t: Teinte): void {
    const pt = (k: number, w: number): V3 => {
      const ang = ((k + 0.5) / n) * Math.PI * 2;
      const [du, dz] = [r * Math.cos(ang), r * Math.sin(ang)];
      return axe === 'x' ? [w, u + du, z + dz] : [u + du, w, z + dz];
    };
    const m: V3 = axe === 'x' ? [(de + a) / 2, u, z] : [u, (de + a) / 2, z];
    for (let k = 0; k < n; k++) this.quad(pt(k, de), pt(k + 1, de), pt(k + 1, a), pt(k, a), m, t);
  }

  /**
   * Un toit à deux pans de (x0, y0) à (x1, y1), le faîte le long de `axe` (au milieu de l'autre côté), de l'avant-toit
   * en `zBas` au faîte en `zHaut`, épais de `epaisseur` : ses deux pans, leurs dessous, les rives de l'avant-toit et les
   * bouts en V renversé (20 triangles ; sans épaisseur, les deux pans seuls : 4) ; `pignons` : les deux pignons pleins sous lui, de `zPied` à l'avant-toit (le
   * nichoir, la vitrine), 2 ou 6 triangles de plus selon qu'ils descendent ou non.
   */
  toit(x0: number, x1: number, y0: number, y1: number, zBas: number, zHaut: number, axe: 'x' | 'y', epaisseur: number, t: Teinte, pignons?: { teinte: Teinte; zPied: number }): void {
    // Dans le repère du toit : le long du faîte `l`, en travers `w`.
    const [l0, l1, w0, w1] = axe === 'x' ? [x0, x1, y0, y1] : [y0, y1, x0, x1];
    const wm = (w0 + w1) / 2;
    const pt = (l: number, w: number, z: number): V3 => (axe === 'x' ? [l, w, z] : [w, l, z]);
    const zDe = (w: number) => (w === wm ? zHaut : zBas);
    const e = epaisseur;
    const lm = (l0 + l1) / 2;
    const sous: V3 = pt(lm, wm, zBas - 1);
    const dessus: V3 = pt(lm, wm, zHaut + 1);
    for (const w of [w0, w1]) {
      this.quad(pt(l0, w, zDe(w)), pt(l1, w, zDe(w)), pt(l1, wm, zHaut), pt(l0, wm, zHaut), sous, t);
      if (e <= 0) continue;
      this.quad(pt(l0, w, zDe(w) - e), pt(l1, w, zDe(w) - e), pt(l1, wm, zHaut - e), pt(l0, wm, zHaut - e), dessus, t);
      this.quad(pt(l0, w, zBas), pt(l1, w, zBas), pt(l1, w, zBas - e), pt(l0, w, zBas - e), pt(lm, wm, zBas - e / 2), t);
      for (const l of [l0, l1]) this.quad(pt(l, w, zBas), pt(l, wm, zHaut), pt(l, wm, zHaut - e), pt(l, w, zBas - e), pt(lm, wm, zBas), t);
    }
    if (!pignons || e <= 0) return;
    const r = (w1 - w0) * 0.06;
    for (const l of [l0, l1]) {
      const dedans = pt(lm, wm, zBas);
      // Le pignon, un peu en retrait sous la rive.
      const lr = l === l0 ? l0 + r : l1 - r;
      this.tri(pt(lr, w0 + r, zBas - e), pt(lr, w1 - r, zBas - e), pt(lr, wm, zHaut - e - r), dedans, pignons.teinte);
      if (pignons.zPied < zBas - e - 1e-6) this.quad(pt(lr, w0 + r, pignons.zPied), pt(lr, w1 - r, pignons.zPied), pt(lr, w1 - r, zBas - e), pt(lr, w0 + r, zBas - e), dedans, pignons.teinte);
    }
  }

  /**
   * Des facettes de pièce d'architecture (../architecture/rooms.ts, en part de case), posées dans la case (dx, dy, dz) ;
   * `teinte` : la couleur de chacune (`'vitre'` : dans le feu, de la couleur `vitre`).
   */
  facettes(f: readonly (Facette & { vitre?: boolean })[], dx: number, dy: number, dz: number, teinte: (f: Facette) => Teinte, vitre?: Couleur): void {
    for (const fa of f) {
      const pts = fa.points.map(([x, y, z]) => [dx + x, dy + y, dz + z] as V3);
      const c = pts.reduce<V3>((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      const dedans: V3 = [c[0] - fa.normale[0] * 0.05, c[1] - fa.normale[1] * 0.05, c[2] - fa.normale[2] * 0.05];
      const t = fa.vitre && vitre !== undefined ? vitre : teinte(fa);
      for (let i = 1; i + 1 < pts.length; i++) this.tri(pts[0], pts[i], pts[i + 1], dedans, t, Boolean(fa.vitre));
    }
  }
}

/** Un atelier sans placement (repère de l'objet = monde), pour compter les triangles d'un dessin. */
export function atelierDeCompte(): Atelier {
  return new Atelier(new Pinceau(), new Pinceau(), (x, y, z) => [x, z, y]);
}
