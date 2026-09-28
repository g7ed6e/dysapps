// Le gabarit des sentinelles d'Archipéo (lot R6) : les Gardiens deviennent des statues de pierre éteintes que la
// réussite rallume. Chacune se dresse sur le même socle octogonal, huit blocs de haut socle compris, cinq cases de large
// au plus, le visage vers −Z ; une flamme facettée dort dans le foyer, au pied de la statue, et une à trois lueurs
// courent sur la pierre (ce qui s'allume sur chaque île : nervures, gemme, strates…). Rien ne bouge : pas de
// respiration, pas de geste ; seul le degré d'allumage change, de 0 (éteinte) à 1 (rallumée), et les orbites restent
// sombres à tous les degrés.
//
// Quatre pièces : le socle (et son foyer), la sculpture, la flamme et les veines, ces deux dernières marquées
// `lueur: 'allumage'`. Code pur, sans Three.js : la vue fond l'allumage sur les couleurs (`couleursAllumees`).
import { lineaire } from '../landMesh';
import type { Couleur } from '../palette';
import { clamp, rgb } from '../decor/pinceau';
import { LUEUR, SENTINELLE } from './couleurs';
import { anneauA, avant, devant, facette, fuseau, NUANCE, parFace, peindrePersonnage, yeux, type Anneau, type FacettesDePersonnage, type Peindre, type Piece, type Pot, type Trace, type V3 } from './peint';

/** La hauteur d'une sentinelle, socle compris, et celle du socle, en blocs. */
export const HAUTEUR_DE_SENTINELLE = 8;
export const HAUT_DU_SOCLE = 1;
/** La demi-largeur permise (cinq cases de large au plus). */
export const DEMI_LARGEUR_DE_SENTINELLE = 2.5;

/** Ce qu'une statue reçoit pour se dessiner : les couleurs de la pierre, prises à la demande. */
export class Atelier {
  constructor(readonly pot: Pot) {}
  get pierre(): Peindre {
    return this.pot(SENTINELLE.pierre, 'dominante');
  }
  get lichen(): Peindre {
    return this.pot(SENTINELLE.lichen, 'dominante');
  }
  get orbite(): Peindre {
    return this.pot(SENTINELLE.orbite, 'yeux');
  }
  get lueur(): Peindre {
    return this.pot(LUEUR, 'lueur');
  }
  /** La pierre, avec du lichen sur les faces que `ou(k, j)` désigne (segment `k` du bas, face `j`, `n − 1` devant). */
  moussue(ou: (k: number, j: number) => boolean): ReturnType<typeof parFace> {
    return parFace((k, j) => (ou(k, j) ? this.lichen : this.pierre));
  }
}

/** Un Gardien en sentinelle : ce qu'il est, ce qui s'allume, sa sculpture et ses veines (dessinées sur le socle). */
export interface Statue {
  nom: string;
  /** Ce qui s'allume sur la statue (les veines). */
  allume: string;
  sculpture(T: Trace, a: Atelier): void;
  veines(T: Trace, a: Atelier): void;
}

// ---------- Le socle commun, le foyer et la flamme ----------

/** Le profil du socle : un octogone au fruit léger, sa corniche en haut. */
export const SOCLE: Anneau[] = [
  [0, 1.95],
  [0.85, 1.78],
  [HAUT_DU_SOCLE, 1.88],
];
/** Le foyer, sur le devant du socle : son centre en Z et le haut de sa coupe. */
export const FOYER = { z: -1.3, haut: 1.12 } as const;

/** Le socle octogonal, le même pour toutes les sentinelles, et la coupe du foyer. */
export function socle(T: Trace, a: Atelier): void {
  fuseau(T, SOCLE, 8, a.moussue((k, j) => k === 0 && (j === 0 || j === 3 || j === 5)), { bas: false });
  fuseau(
    T,
    [
      [0.9, 0.26],
      [FOYER.haut, 0.34],
    ],
    6,
    a.pierre,
    { z: FOYER.z, bas: false },
  );
}

/** La flamme facettée, posée dans le foyer (une arête vers l'élève). */
export function flamme(T: Trace, a: Atelier): void {
  fuseau(
    T,
    [
      [FOYER.haut - 0.02, 0.13],
      [1.45, 0.24],
      [2.05, 0],
    ],
    4,
    a.lueur,
    { z: FOYER.z, rot: 0, bas: false },
  );
}

/**
 * Un bandeau de lueur sur les faces `faces` du socle (`n − 1` devant, `0` et `n − 2` ses voisines), de `y0` à `y1`,
 * posé juste devant la pierre et coupé aux arêtes du profil (la rampe du Masque).
 */
export function bandeauDuSocle(T: Trace, faces: number[], y0: number, y1: number, pe: Peindre): void {
  const n = 8;
  const ys = [y0, ...SOCLE.map((a) => a[0]).filter((y) => y > y0 && y < y1), y1];
  const coin = (j: number, y: number): V3 => {
    const r = anneauA(SOCLE, y)[1] + 0.014 / Math.cos(Math.PI / n);
    const ang = avant(n) + (j / n) * Math.PI * 2;
    return [r * Math.cos(ang), y, r * Math.sin(ang)];
  };
  for (const j of faces)
    for (let k = 0; k + 1 < ys.length; k++) T.quad(coin(j, ys[k]), coin(j + 1, ys[k]), coin(j + 1, ys[k + 1]), coin(j, ys[k + 1]), [0, (ys[k] + ys[k + 1]) / 2, 0], pe);
}

// ---------- Les petites formes des statues ----------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function unit(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/**
 * Un tube le long d'une ligne brisée (cou, corne, défense, trompe, queue) : un anneau à `n` pans par point, de rayon
 * `rayons[i]` (un rayon nul fait une pointe), fermé aux deux bouts. `aplati` écrase la section (1 : ronde).
 */
export function tube(T: Trace, points: V3[], rayons: number | number[], n: number, pe: Peindre, aplati = 1): void {
  const m = points.length;
  const R = typeof rayons === 'number' ? points.map(() => rayons) : rayons;
  const tang = points.map((_, i) => unit(sub(points[Math.min(i + 1, m - 1)], points[Math.max(i - 1, 0)])));
  let u = unit(cross(tang[0], Math.abs(tang[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const anneaux: V3[][] = points.map((p, i) => {
    const t = tang[i];
    if (i > 0) u = unit(sub(u, t.map((x) => x * dot(u, t)) as V3));
    const v = cross(t, u);
    return Array.from({ length: n }, (_, j): V3 => {
      const ang = (j / n) * Math.PI * 2 + Math.PI / n;
      const [c, s] = [Math.cos(ang) * R[i], Math.sin(ang) * R[i] * aplati];
      return [p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s];
    });
  });
  const milieu = (i: number): V3 => [(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2, (points[i][2] + points[i + 1][2]) / 2];
  for (let i = 0; i + 1 < m; i++) {
    const [A, B, d] = [anneaux[i], anneaux[i + 1], milieu(i)];
    for (let j = 0; j < n; j++) {
      const jj = (j + 1) % n;
      if (R[i] <= 1e-9) T.triangle(points[i], B[jj], B[j], d, pe);
      else if (R[i + 1] <= 1e-9) T.triangle(A[j], A[jj], points[i + 1], d, pe);
      else T.quad(A[j], A[jj], B[jj], B[j], d, pe);
    }
  }
  if (R[0] > 1e-9) facette(T, anneaux[0], milieu(0), pe);
  if (R[m - 1] > 1e-9) facette(T, anneaux[m - 1], milieu(m - 2), pe);
}

/**
 * Une veine : un mince ruban de `largeur` posé devant une surface qui regarde −Z (son plan en `zDe(y)`), le long de
 * `trace` (des points x, y). Le ruban se coupe aux hauteurs `coupures` (les arêtes d'un fuseau) pour rester sur ses faces.
 */
export function veine(T: Trace, trace: [number, number][], largeur: number, pe: Peindre, zDe: (y: number) => number, coupures: number[] = []): void {
  const pts: [number, number][] = [trace[0]];
  for (let i = 1; i < trace.length; i++) {
    const [[x0, y0], [x1, y1]] = [trace[i - 1], trace[i]];
    const cs = coupures.filter((c) => (c - y0) * (c - y1) < 0).sort((a, b) => (a - b) * Math.sign(y1 - y0));
    for (const c of cs) pts.push([x0 + ((x1 - x0) * (c - y0)) / (y1 - y0), c]);
    pts.push(trace[i]);
  }
  const h = largeur / 2;
  const z = (y: number) => zDe(y) - 0.014;
  for (let i = 1; i < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i - 1], pts[i]];
    const l = Math.hypot(x1 - x0, y1 - y0);
    if (l < 1e-6) continue;
    const [px, py] = [(-(y1 - y0) / l) * h, ((x1 - x0) / l) * h];
    const coin = (x: number, y: number): V3 => [x, y, z(y)];
    const q = [coin(x0 - px, y0 - py), coin(x1 - px, y1 - py), coin(x1 + px, y1 + py), coin(x0 + px, y0 + py)];
    facette(T, q, [(x0 + x1) / 2, (y0 + y1) / 2, z((y0 + y1) / 2) + 1], pe);
  }
}

/** Une veine sur le devant d'un fuseau (tourné par `avant`, posé en `x`, `z`). */
export function veineSur(T: Trace, profil: Anneau[], n: number, trace: [number, number][], largeur: number, pe: Peindre, o: { x?: number; z?: number } = {}): void {
  const x = o.x ?? 0;
  veine(
    T,
    trace.map(([tx, ty]) => [tx + x, ty]),
    largeur,
    pe,
    (y) => devant(profil, n, y, o.z ?? 0).z,
    profil.map((a) => a[0]),
  );
}

/** Une pièce plate devant une surface qui regarde −Z (gemme, vitrail, cadran) : un polygone de `cotes` sommets, de
 * demi-largeur `rx` et demi-hauteur `ry`, centré en (`x`, `y`), une pointe en haut. */
export function plaque(T: Trace, x: number, y: number, rx: number, ry: number, cotes: number, pe: Peindre, zDe: (y: number) => number): void {
  const pts = Array.from({ length: cotes }, (_, i): V3 => {
    const a = Math.PI / 2 + (i / cotes) * Math.PI * 2;
    const py = y + Math.sin(a) * ry;
    return [x + Math.cos(a) * rx, py, zDe(py) - 0.016];
  });
  facette(T, pts, [x, y, zDe(y) + 1], pe);
}

/** Une dalle : un contour convexe (x, y) extrudé de `z0` à `z1` (écu, stèle plate). */
export function dalle(T: Trace, contour: [number, number][], z0: number, z1: number, pe: Peindre): void {
  const m = contour.length;
  const c: V3 = [contour.reduce((s, p) => s + p[0], 0) / m, contour.reduce((s, p) => s + p[1], 0) / m, (z0 + z1) / 2];
  facette(
    T,
    contour.map(([x, y]): V3 => [x, y, z0]),
    c,
    pe,
  );
  facette(
    T,
    contour.map(([x, y]): V3 => [x, y, z1]),
    c,
    pe,
  );
  for (let i = 0; i < m; i++) {
    const [p, q] = [contour[i], contour[(i + 1) % m]];
    T.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], c, pe);
  }
}

/** Une étoile à `branches` pointes, plate devant une surface qui regarde −Z. */
export function etoile(T: Trace, x: number, y: number, r: number, branches: number, pe: Peindre, zDe: (y: number) => number): void {
  const pts = Array.from({ length: branches * 2 }, (_, i): V3 => {
    const a = Math.PI / 2 + (i / (branches * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const py = y + Math.sin(a) * rr;
    return [x + Math.cos(a) * rr, py, zDe(py) - 0.016];
  });
  facette(T, [[x, y, zDe(y) - 0.016], ...pts, pts[0]], [x, y, zDe(y) + 1], pe);
}

/** Deux orbites : deux facettes sombres tournées vers −Z, qui ne s'allument jamais (une seule si `ecart` est nul). */
export function orbites(T: Trace, a: Atelier, x: number, y: number, z: number, ecart: number, taille: number): void {
  if (ecart > 0) return yeux(T, a.orbite, x, y, z, ecart, taille);
  const [h, zz] = [taille / 2, z - 0.004];
  facette(
    T,
    [
      [x - h, y - h, zz],
      [x + h, y - h, zz],
      [x + h, y + h, zz],
      [x - h, y + h, zz],
    ],
    [x, y, zz + 1],
    a.orbite,
  );
}

// ---------- L'allumage ----------

/** Ce que devient chaque couleur de base au rallumage : de sa couleur éteinte (0) à sa couleur rallumée (1). */
const ALLUMAGE = new Map<Couleur, [Couleur, Couleur]>([
  [SENTINELLE.pierre, [SENTINELLE.pierre, SENTINELLE.rallumee]],
  [SENTINELLE.lichen, [SENTINELLE.lichen, SENTINELLE.rallumee]],
  [LUEUR, [SENTINELLE.cendre, LUEUR]],
]);

/**
 * La couleur d'une teinte de sentinelle au degré d'allumage `degre` (0 : éteinte, 1 : rallumée) : la pierre passe de
 * #8E8C84 (et son lichen) au Sable #DAA66A, la flamme et les veines de la cendre à la lueur ; les orbites ne changent pas.
 */
export function allumage(c: Couleur, degre: number): Couleur {
  const de = ALLUMAGE.get(c);
  if (!de) return c;
  const d = clamp(degre, 0, 1);
  if (d === 0) return de[0];
  if (d === 1) return de[1];
  const [a, b] = [rgb(de[0]), rgb(de[1])];
  return (Math.round(a[0] + (b[0] - a[0]) * d) << 16) | (Math.round(a[1] + (b[1] - a[1]) * d) << 8) | Math.round(a[2] + (b[2] - a[2]) * d);
}

/**
 * Le degré d'allumage d'une sentinelle : un nombre (toute la statue), ou la pierre et les lueurs (flamme et veines)
 * chacune au sien. Au défi (lot 6), les lueurs montent avec les épreuves réussies, la pierre attend la victoire.
 */
export type Allumage = number | { pierre: number; lueurs: number };

/** Le degré de la pierre et celui des lueurs, entre 0 et 1. */
export function degresDAllumage(a: Allumage): { pierre: number; lueurs: number } {
  return typeof a === 'number' ? { pierre: clamp(a, 0, 1), lueurs: clamp(a, 0, 1) } : { pierre: clamp(a.pierre, 0, 1), lueurs: clamp(a.lueurs, 0, 1) };
}

/**
 * Les couleurs d'une sentinelle au degré `degre`, sommet par sommet, dans l'espace linéaire (écrites dans `dans` s'il
 * est donné) : la teinte de `allumage`, nuancée selon la facette comme tout personnage ; une lueur perd sa nuance à
 * mesure qu'elle s'allume, et brille pleinement à 1.
 */
export function couleursAllumees(f: FacettesDePersonnage, degre: Allumage, dans = new Float32Array(f.colors.length)): Float32Array {
  const { pierre, lueurs: dl } = degresDAllumage(degre);
  const lueurs = new Set(f.palette.filter((p) => p.role === 'lueur').map((p) => p.couleur));
  for (let t = 0; t < f.teintes.length; t++) {
    const d = lueurs.has(f.teintes[t]) ? dl : pierre;
    const k = rgb(allumage(f.teintes[t], d));
    const ny = f.normals[t * 9 + 1];
    let w = NUANCE[0] + (NUANCE[1] - NUANCE[0]) * clamp(0.5 + 0.5 * ny, 0, 1);
    if (lueurs.has(f.teintes[t])) w += (1 - w) * d;
    const c = [lineaire((k[0] / 255) * w), lineaire((k[1] / 255) * w), lineaire((k[2] / 255) * w)];
    for (let s = 0; s < 3; s++) dans.set(c, t * 9 + s * 3);
  }
  return dans;
}

// ---------- La sentinelle entière ----------

/** Les quatre pièces d'une sentinelle. */
export function piecesDeSentinelle(s: Statue): Piece[] {
  const a = (pot: Pot) => new Atelier(pot);
  return [
    { nom: 'socle', pivot: [0, 0, 0], dessiner: (T, pot) => socle(T, a(pot)) },
    { nom: 'sculpture', pivot: [0, HAUT_DU_SOCLE, 0], dessiner: (T, pot) => s.sculpture(T, a(pot)) },
    { nom: 'flamme', pivot: [0, FOYER.haut, FOYER.z], lueur: 'allumage', dessiner: (T, pot) => flamme(T, a(pot)) },
    { nom: 'veines', pivot: [0, HAUT_DU_SOCLE, 0], lueur: 'allumage', dessiner: (T, pot) => s.veines(T, a(pot)) },
  ];
}

/** Une sentinelle en facettes, éteinte (ses couleurs au degré 0 ; `couleursAllumees` donne les autres). */
export function sentinelleEnFacettes(s: Statue): FacettesDePersonnage {
  const f = peindrePersonnage(piecesDeSentinelle(s));
  return { ...f, colors: couleursAllumees(f, 0) };
}
