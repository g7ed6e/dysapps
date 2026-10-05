// Le pinceau du décor d'Archipéo (lot R4, rangé à part par le socle de la piste Rendu) : des facettes peintes par
// sommet et les primitives basse résolution dont chaque forme du décor est faite (troncs de cône, icosaèdres bosselés,
// octaèdres, boîtes). Code pur, sans Three.js ; les formes (./formes.ts) le partagent, ../decorMesh.ts le lit.
import { lineaire } from '../landMesh';
import type { Couleur, Faces } from '../palette';
import { clamp } from '../../../core/math';

// ---------- Le pinceau : des facettes et leurs couleurs ----------

export type V3 = [number, number, number];
export type RGB = [number, number, number];

/** Le décor en facettes : trois sommets par triangle, repère Three (X = x, Y = hauteur, Z = y). */
export interface FacettesDuDecor {
  positions: Float32Array;
  normals: Float32Array;
  /**
   * Couleurs par sommet, dans l'espace linéaire de Three.js : entre 0 et 1, sauf le fût du phare, peint plus clair que
   * blanc (./phare.ts, `ECLAT_DU_FUT`), que l'éclairage ramène à un crème à l'écran.
   */
  colors: Float32Array;
  /** Pour chaque triangle, l'indice de son élément dans `elements` (le toucher y retrouve la case). */
  elements: Int32Array;
  /** Les couleurs de nuit, si une facette en a de propres (la lanterne du phare, claire de jour, qui brille la nuit). */
  colorsNuit?: Float32Array;
}

/** Une façon de peindre un sommet : sa position et la normale de sa facette. */
export type Peindre = (p: V3, n: V3) => RGB;

export class Pinceau {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private own: number[] = [];
  /** Les couleurs de nuit, créées au premier triangle qui en a de propres (avant lui, les mêmes que de jour). */
  private nuit: number[] | null = null;
  element = 0;
  /** Tant qu'il est posé, les facettes tracées ont aussi leurs couleurs de nuit (sinon, les mêmes que de jour). */
  deNuit: Peindre | null = null;
  /** Un triangle ; `dedans` : un point à l'intérieur du volume (la facette regarde à l'opposé). */
  triangle(a: V3, b: V3, c: V3, dedans: V3, peindre: Peindre): void {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(n[0], n[1], n[2]);
    if (len < 1e-9) return;
    n = [n[0] / len, n[1] / len, n[2] / len];
    const m = [(a[0] + b[0] + c[0]) / 3 - dedans[0], (a[1] + b[1] + c[1]) / 3 - dedans[1], (a[2] + b[2] + c[2]) / 3 - dedans[2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) {
      [b, c] = [c, b];
      n = [-n[0], -n[1], -n[2]];
    }
    for (const p of [a, b, c]) {
      this.pos.push(p[0], p[1], p[2]);
      this.nor.push(n[0], n[1], n[2]);
      const k = peindre(p, n);
      this.col.push(k[0], k[1], k[2]);
      if (this.deNuit && !this.nuit) this.nuit = this.col.slice(0, -3);
      if (this.nuit) {
        const kn = this.deNuit ? this.deNuit(p, n) : k;
        this.nuit.push(kn[0], kn[1], kn[2]);
      }
    }
    this.own.push(this.element);
  }
  /** Le nombre de triangles tracés. */
  get triangles(): number {
    return this.own.length;
  }
  quad(a: V3, b: V3, c: V3, d: V3, dedans: V3, peindre: Peindre): void {
    this.triangle(a, b, c, dedans, peindre);
    this.triangle(a, c, d, dedans, peindre);
  }
  fin(): FacettesDuDecor {
    const f: FacettesDuDecor = { positions: Float32Array.from(this.pos), normals: Float32Array.from(this.nor), colors: Float32Array.from(this.col), elements: Int32Array.from(this.own) };
    if (this.nuit) f.colorsNuit = Float32Array.from(this.nuit);
    return f;
  }
}

/** Un hasard reproductible, tiré du nom d'un élément. */
export function hasardDe(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rgb = (c: Couleur): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const hex = (s: string): Couleur => parseInt(s.slice(1), 16);
/** Une île fermée : les couleurs délavées vers le gris clair, comme le sol (./landMesh.ts). */
export const DELAVE: [Couleur, number] = [0xb8bcc0, 0.55];
/** La nuance d'un décor : du pied (plus sombre) au sommet, `PIED` à `PIED + ELAN`. */
const PIED = 0.84;
const ELAN = 0.2;

/**
 * La peinture d'une matière : la couleur de côté vers le bas, celle du dessus vers le haut, plus sombre au pied (de
 * `y0` à `y0 + h`), `v` : une variation propre à l'élément.
 */
export function peintre(f: Faces, y0: number, h: number, v = 1): Peindre {
  const dessus = rgb(f.dessus);
  const cote = rgb(f.cote);
  return (p, n) => {
    const w = clamp(0.45 + 0.6 * n[1], 0, 1);
    const t = h > 0 ? clamp((p[1] - y0) / h, 0, 1) : 1;
    const k = (PIED + ELAN * t) * v;
    return [0, 1, 2].map((j) => lineaire(((cote[j] + (dessus[j] - cote[j]) * w) / 255) * k)) as RGB;
  };
}

/** La valeur d'une couleur (canaux 0..255, pondérés comme l'œil) : pour comparer des verts entre eux. */
export const valeur = (c: RGB | Couleur): number => {
  const [r, g, b] = typeof c === 'number' ? rgb(c) : c;
  return 0.3 * r + 0.59 * g + 0.11 * b;
};

/**
 * Les deux familles de verts du feuillage (décision du directeur artistique, lot R4) : environ six arbres sur dix clairs,
 * vers `#7FB24E`, quatre profonds, vers `#3F7A3A` ; la valeur de chacune rapportée à celle de l'herbe de l'archipel
 * (`FAMILLES[].valeur` fois), à 15 % d'écart au moins.
 */
export const FAMILLES = [
  { teinte: 0x7fb24e, part: 0.6, valeur: 1.1 },
  { teinte: 0x3f7a3a, part: 0.4, valeur: 0.93 },
] as const;
/** Le dégradé d'une boule de feuillage, du bas au haut, en part de la valeur de sa famille. */
export const FEUILLAGE: [number, number] = [0.7, 1.15];
/** Les trois tailles de feuillage, en part de la taille de base. */
export const TAILLES = [0.7, 1, 1.3] as const;

/** Une boule de feuillage : de sa couleur, plus sombre en bas, plus claire en haut (de `y0` à `y0 + h` : ses sommets extrêmes). */
export function feuillage(c: RGB, y0: number, h: number): Peindre {
  return (p) => {
    const t = h > 0 ? clamp((p[1] - y0) / h, 0, 1) : 1;
    const k = FEUILLAGE[0] + (FEUILLAGE[1] - FEUILLAGE[0]) * t;
    return [0, 1, 2].map((j) => lineaire((c[j] / 255) * k)) as RGB;
  };
}

/** Ce qui brille : la couleur du dessus, pleine, sans nuance. */
export function lueur(f: Faces): Peindre {
  const c = rgb(f.dessus);
  const k = c.map((v) => lineaire(v / 255)) as RGB;
  return () => k;
}

/** Une couleur multipliée par `k` (bornée au blanc). */
export function eclaircir(c: Couleur, k: number): Couleur {
  const [r, g, b] = rgb(c).map((v) => Math.round(clamp(v * k, 0, 255)));
  return (r << 16) | (g << 8) | b;
}

// ---------- Les primitives ----------

/** Un tronc de cône à `n` pans (un cône si `r1` vaut 0), de `y0` à `y1`, tourné de `rot` ; sans fond. */
export function tronconique(P: Pinceau, cx: number, cz: number, y0: number, y1: number, r0: number, r1: number, n: number, rot: number, peindre: Peindre, chapeau = true): void {
  const bas: V3[] = [];
  const haut: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    bas.push([cx + r0 * Math.cos(a), y0, cz + r0 * Math.sin(a)]);
    haut.push([cx + r1 * Math.cos(a), y1, cz + r1 * Math.sin(a)]);
  }
  const dedans: V3 = [cx, y0 + (y1 - y0) * 0.3, cz];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (r1 <= 1e-6) P.triangle(bas[i], bas[j], [cx, y1, cz], dedans, peindre);
    else P.quad(bas[i], bas[j], haut[j], haut[i], dedans, peindre);
  }
  if (r1 > 1e-6 && chapeau) for (let i = 1; i + 1 < n; i++) P.triangle(haut[0], haut[i], haut[i + 1], [cx, y1 - 1, cz], peindre);
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_SOMMETS: V3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
].map((v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l] as V3;
});
const ICO_FACES = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

/** Un icosaèdre bosselé (feuillage, rocher, fumée) : vingt facettes, aplati de `sy`, chaque sommet décalé de ± `bosse`. */
export function icosaedre(P: Pinceau, c: V3, r: number, sy: number, bosse: number, hasard: () => number, peindre: Peindre, rot = 0): void {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts = ICO_SOMMETS.map(([x, y, z]): V3 => {
    const k = r * (1 + bosse * (hasard() * 2 - 1));
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;
    return [c[0] + rx * k, c[1] + y * k * sy, c[2] + rz * k];
  });
  for (const [i, j, k] of ICO_FACES) P.triangle(pts[i], pts[j], pts[k], c, peindre);
}

/** Un octaèdre (cristal, fleur, lanterne), étiré de `sy` ; `moitie` : la moitié du haut seulement. */
export function octaedre(P: Pinceau, c: V3, r: number, sy: number, peindre: Peindre, moitie = false, rot = 0): void {
  const pts: V3[] = [0, 1, 2, 3].map((i) => [c[0] + r * Math.cos(rot + (i * Math.PI) / 2), c[1], c[2] + r * Math.sin(rot + (i * Math.PI) / 2)]);
  const haut: V3 = [c[0], c[1] + r * sy, c[2]];
  const bas: V3 = [c[0], c[1] - r * sy, c[2]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    P.triangle(pts[i], pts[j], haut, c, peindre);
    if (!moitie) P.triangle(pts[i], pts[j], bas, c, peindre);
  }
}

/** Une boîte, sans fond : de (x0, y0, z0) à (x1, y1, z1). */
export function boite(P: Pinceau, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, peindre: Peindre): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  P.quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  P.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0), c, peindre);
  P.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  P.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), c, peindre);
  P.quad(p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0), c, peindre);
}

/**
 * Un pavé de `w` × `d` cases, de `h` de haut, posé en (`cx`, `y0`, `cz`), tourné de `rot` autour de la verticale et
 * penché de `penche` radians (de côté, autour de son pied) ; `chapeau` : avec son dessus. Sans fond.
 */
export function pave(P: Pinceau, cx: number, y0: number, cz: number, w: number, d: number, h: number, rot: number, penche: number, peindre: Peindre, chapeau = true): V3[] {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const cp = Math.cos(penche);
  const sp = Math.sin(penche);
  const coin = (u: number, v: number, y: number): V3 => {
    // Penché autour de l'axe local des v, au pied : le haut part vers les u.
    const lu = u * cp + y * sp;
    const ly = -u * sp + y * cp;
    return [cx + lu * cos - v * sin, y0 + ly, cz + lu * sin + v * cos];
  };
  const bas = [coin(-w / 2, -d / 2, 0), coin(w / 2, -d / 2, 0), coin(w / 2, d / 2, 0), coin(-w / 2, d / 2, 0)];
  const haut = [coin(-w / 2, -d / 2, h), coin(w / 2, -d / 2, h), coin(w / 2, d / 2, h), coin(-w / 2, d / 2, h)];
  const dedans = coin(0, 0, h / 2);
  for (let i = 0; i < 4; i++) P.quad(bas[i], bas[(i + 1) % 4], haut[(i + 1) % 4], haut[i], dedans, peindre);
  if (chapeau) P.quad(haut[0], haut[1], haut[2], haut[3], dedans, peindre);
  return haut;
}
