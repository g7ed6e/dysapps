// Les personnages d'Archipéo en facettes peintes (lot R6) : le bonhomme, les créatures et, plus tard, les sentinelles,
// dessinés par le code en quelques primitives basse résolution, à côté de leurs modèles en cubes (./creatures.ts,
// ./guardians.ts, qui gardent l'emprise au sol). Code pur, sans Three.js : la vue 3D en fait un maillage. Repère de
// Three.js, en blocs : X à droite, Y en haut (les pieds en 0), le visage vers −Z.
//
// Un personnage est une liste de pièces (tête, corps, bras…) : chacune pivote autour de son `pivot` et chaque triangle
// sait à quelle pièce il appartient, et de quelle couleur de base il est peint (le rôle de cette couleur : dominante,
// tenue, outil, yeux ou lueur). Le pinceau du décor (../decor/brush.ts) oriente et colore les facettes.
import { lineaire } from '../landMesh';
import type { Couleur } from '../palette';
import { clamp } from '../../../core/math';
import { Pinceau, rgb, type Peindre, type RGB, type V3 } from '../decor/brush';

export type { V3, Peindre } from '../decor/brush';

/** Ce qui trace des triangles : le pinceau, ou une pose qui déplace ce qu'on lui donne avant de le tracer. */
export interface Trace {
  /** Un triangle ; `dedans` : un point à l'intérieur du volume (la facette regarde à l'opposé). */
  triangle(a: V3, b: V3, c: V3, dedans: V3, peindre: Peindre): void;
  quad(a: V3, b: V3, c: V3, d: V3, dedans: V3, peindre: Peindre): void;
}

/**
 * Le rôle d'une couleur dans un personnage : la dominante (le pelage, la peau ; sa marque, ventre ou tête, en fait
 * partie), la tenue (lin ou cuir), l'outil (bois, fer, laiton), les yeux, et ce qui brille (la nuit, ou au rallumage).
 */
type Role = 'dominante' | 'tenue' | 'outil' | 'yeux' | 'lueur';

/** Ce qui peint : une couleur de base et son rôle, nuancée selon la facette (les lueurs ne le sont pas). */
export type Pot = (c: Couleur, role: Role) => Peindre;

/** Une pièce d'un personnage : elle pivote d'un bloc autour de `pivot` (tête, bras, outil…). */
export interface Piece {
  nom: string;
  pivot: V3;
  /** Une pièce qui brille : la nuit (lanterne de Fi, abdomen d'Astra, braise de Braise), ou au rallumage (sentinelles). */
  lueur?: 'nuit' | 'allumage';
  /** La couleur que prend la nuit une pièce qui brille, si elle n'est pas celle dont elle est peinte (le verre de Fi). */
  nuit?: Couleur;
  /**
   * La part de son allumage qu'une pièce qui brille emprunte à la lueur (1 par défaut : pleinement émissive) ; en
   * dessous, elle garde un peu de l'ombre de ses facettes (les veines du Lion de pierre, « légèrement émissives »).
   */
  glowWeight?: number;
  /**
   * Pour une pièce qui brille au rallumage : le degré qu'elle a déjà au premier pas des lueurs (`FIRST_STEP`, ./glow.ts),
   * pour monter plus vite au début (les veines du Lion de pierre) ; sans lui, elle suit les lueurs.
   */
  firstStepGlow?: number;
  dessiner(T: Trace, pot: Pot): void;
}

/** Ce que la vue sait d'une pièce, sans son dessin. */
type PieceDuModele = Omit<Piece, 'dessiner'>;

/** Un personnage en facettes : trois sommets par triangle, et pour chaque triangle sa pièce et sa couleur de base. */
export interface FacettesDePersonnage {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js. */
  colors: Float32Array;
  /** Pour chaque triangle, l'indice de sa pièce dans `table`. */
  pieces: Int32Array;
  /** Pour chaque triangle, sa couleur de base (0xRRGGBB, avant la nuance). */
  teintes: Int32Array;
  table: PieceDuModele[];
  /** Les couleurs de base du personnage, dans l'ordre où elles sont peintes, avec leur rôle. */
  palette: { couleur: Couleur; role: Role }[];
}

/** La nuance d'une facette selon qu'elle regarde le ciel ou le sol : de `NUANCE[0]` (dessous) à `NUANCE[1]` (dessus). */
export const NUANCE: [number, number] = [0.84, 1];

function nuance(c: Couleur): Peindre {
  const k = rgb(c);
  return (_p, n) => {
    const w = NUANCE[0] + (NUANCE[1] - NUANCE[0]) * clamp(0.5 + 0.5 * n[1], 0, 1);
    return [0, 1, 2].map((j) => lineaire((k[j] / 255) * w)) as RGB;
  };
}

function plein(c: Couleur): Peindre {
  const k = rgb(c).map((v) => lineaire(v / 255)) as RGB;
  return () => k;
}

/** Peint un personnage : ses pièces, dans l'ordre, dans un seul jeu de facettes. */
export function peindrePersonnage(pieces: Piece[]): FacettesDePersonnage {
  if (pieces.length > 255) throw new Error('Trop de pièces');
  const P = new Pinceau();
  const palette: { couleur: Couleur; role: Role }[] = [];
  const pots = new Map<string, Peindre>();
  const indexDe = new Map<Peindre, number>();
  const pot: Pot = (c, role) => {
    const cle = `${c}:${role}`;
    let pe = pots.get(cle);
    if (!pe) {
      pe = role === 'lueur' ? plein(c) : nuance(c);
      pots.set(cle, pe);
      indexDe.set(pe, palette.length);
      palette.push({ couleur: c, role });
    }
    return pe;
  };
  pieces.forEach((piece, i) => {
    const T: Trace = {
      triangle(a, b, c, dedans, pe) {
        const k = indexDe.get(pe);
        if (k === undefined) throw new Error(`${piece.nom} : une couleur hors du pot`);
        P.element = i | (k << 8);
        P.triangle(a, b, c, dedans, pe);
      },
      quad(a, b, c, d, dedans, pe) {
        T.triangle(a, b, c, dedans, pe);
        T.triangle(a, c, d, dedans, pe);
      },
    };
    piece.dessiner(T, pot);
  });
  const f = P.fin();
  return {
    positions: f.positions,
    normals: f.normals,
    colors: f.colors,
    pieces: f.elements.map((e) => e & 255),
    teintes: f.elements.map((e) => palette[e >> 8].couleur),
    table: pieces.map(({ nom, pivot, lueur, nuit, glowWeight, firstStepGlow }) => ({
      nom,
      pivot,
      ...(lueur ? { lueur } : {}),
      ...(nuit !== undefined ? { nuit } : {}),
      ...(glowWeight !== undefined ? { glowWeight } : {}),
      ...(firstStepGlow !== undefined ? { firstStepGlow } : {}),
    })),
    palette,
  };
}

/**
 * Le rôle de chaque triangle : celui de sa couleur de base. Une couleur peinte sous deux rôles (la lueur et une
 * autre) n'est une lueur que dans une pièce qui brille.
 */
function rolesDesTriangles(f: FacettesDePersonnage): Role[] {
  const roles = new Map<Couleur, Role[]>();
  for (const p of f.palette) roles.set(p.couleur, [...(roles.get(p.couleur) ?? []), p.role]);
  return Array.from(f.teintes, (c, t) => {
    const r = roles.get(c) ?? ['dominante'];
    if (r.includes('lueur') && f.table[f.pieces[t]].lueur) return 'lueur';
    return r.find((x) => x !== 'lueur') ?? r[0];
  });
}

/**
 * La couleur de nuit de chaque triangle qui brille la nuit (la lanterne de Fi, l'abdomen d'Astra, la braise de
 * Braise), ou `null` : sa propre couleur, ou celle que sa pièce prend la nuit (le verre de Fi).
 */
export function lueursDeNuit(f: FacettesDePersonnage): (Couleur | null)[] {
  const roles = rolesDesTriangles(f);
  return roles.map((r, t) => {
    const piece = f.table[f.pieces[t]];
    return r === 'lueur' && piece.lueur === 'nuit' ? (piece.nuit ?? f.teintes[t]) : null;
  });
}

// ---------- Les poses : tracer ailleurs, tourné ----------

/** Trace ce qu'on lui donne après l'avoir déplacé par `f`. */
export function pose(T: Trace, f: (p: V3) => V3): Trace {
  return {
    triangle: (a, b, c, dedans, pe) => T.triangle(f(a), f(b), f(c), f(dedans), pe),
    quad: (a, b, c, d, dedans, pe) => T.quad(f(a), f(b), f(c), f(d), f(dedans), pe),
  };
}

/**
 * Un repère : tourne un point autour de l'origine (d'abord de `rz` autour de Z, puis de `rx` autour de X, puis de `ry`
 * autour de Y, en radians), puis le porte en `o`.
 */
export function repere(o: V3, rx = 0, ry = 0, rz = 0): (p: V3) => V3 {
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
  return ([x, y, z]) => {
    const x1 = x * cz - y * sz;
    const y1 = x * sz + y * cz;
    const y2 = y1 * cx - z * sx;
    const z2 = y1 * sx + z * cx;
    const x3 = x1 * cy + z2 * sy;
    const z3 = -x1 * sy + z2 * cy;
    return [o[0] + x3, o[1] + y2, o[2] + z3];
  };
}

// ---------- Les primitives ----------

/** Un anneau d'un fuseau : sa hauteur, ses rayons en X et en Z (`rz` vaut `rx` par défaut), son décalage en X et Z. */
export type Anneau = [y: number, rx: number, rz?: number, dz?: number, dx?: number];

/** La rotation qui tourne une face du fuseau vers −Z (le visage) : la face `n − 1`, entre les sommets `n − 1` et 0. */
export const avant = (n: number) => -Math.PI / 2 + Math.PI / n;

/** Comment peindre un fuseau : une couleur pour tout, ou une par face (segment `k` du bas, face `j`, `n − 1` devant). */
export type PeindreFuseau = Peindre | ((k: number, j: number) => Peindre);

export interface OptionsDuFuseau {
  x?: number;
  z?: number;
  /** La rotation des sommets ; par défaut `avant(n)`, une face plate vers −Z. */
  rot?: number;
  /** Fermer le bas, le haut (par défaut, oui). */
  bas?: boolean;
  haut?: boolean;
}

/**
 * Un fuseau : des anneaux à `n` pans de bas en haut (`y` croissant), reliés par des quadrilatères, fermés en bas et en
 * haut. Un anneau de rayon nul est une pointe. Chaque segment compte `2n` triangles (`n` s'il finit en pointe), chaque
 * fond `n − 2`. Deux anneaux ne sont jamais à la même hauteur (l'orientation des facettes en dépend).
 */
export function fuseau(T: Trace, profil: Anneau[], n: number, peindre: PeindreFuseau, o: OptionsDuFuseau = {}): void {
  const cx = o.x ?? 0;
  const cz = o.z ?? 0;
  const rot = o.rot ?? avant(n);
  const pe = (k: number, j: number): Peindre => (isPeindreParFace(peindre) ? peindre(k, j) : peindre);
  const centres: V3[] = profil.map(([y, , , dz = 0, dx = 0]) => [cx + dx, y, cz + dz]);
  const pointe = profil.map(([, rx, rz = rx]) => rx <= 1e-9 && rz <= 1e-9);
  const anneaux: V3[][] = profil.map(([y, rx, rz = rx, dz = 0, dx = 0]) =>
    Array.from({ length: n }, (_, j): V3 => {
      const a = rot + (j / n) * Math.PI * 2;
      return [cx + dx + rx * Math.cos(a), y, cz + dz + rz * Math.sin(a)];
    }),
  );
  for (let k = 0; k + 1 < profil.length; k++) {
    const A = anneaux[k];
    const B = anneaux[k + 1];
    const dedans: V3 = [(centres[k][0] + centres[k + 1][0]) / 2, (centres[k][1] + centres[k + 1][1]) / 2, (centres[k][2] + centres[k + 1][2]) / 2];
    for (let j = 0; j < n; j++) {
      const i = (j + 1) % n;
      if (pointe[k]) T.triangle(centres[k], B[i], B[j], dedans, pe(k, j));
      else if (pointe[k + 1]) T.triangle(A[j], A[i], centres[k + 1], dedans, pe(k, j));
      else T.quad(A[j], A[i], B[i], B[j], dedans, pe(k, j));
    }
  }
  const dernier = profil.length - 1;
  if (o.bas !== false && !pointe[0]) {
    const dedans: V3 = [centres[0][0], centres[0][1] + 1, centres[0][2]];
    for (let j = 1; j + 1 < n; j++) T.triangle(anneaux[0][0], anneaux[0][j], anneaux[0][j + 1], dedans, pe(0, -1));
  }
  if (o.haut !== false && !pointe[dernier]) {
    const dedans: V3 = [centres[dernier][0], centres[dernier][1] - 1, centres[dernier][2]];
    for (let j = 1; j + 1 < n; j++) T.triangle(anneaux[dernier][0], anneaux[dernier][j], anneaux[dernier][j + 1], dedans, pe(dernier - 1, -2));
  }
}

const PAR_FACE = Symbol('parFace');
function isPeindreParFace(p: PeindreFuseau): p is (k: number, j: number) => Peindre {
  return (p as { [PAR_FACE]?: boolean })[PAR_FACE] === true;
}

/**
 * Une peinture face par face d'un fuseau : `choix(k, j)` reçoit le segment (du bas) et la face (`n − 1` devant ; −1 le
 * fond du bas, −2 le fond du haut).
 */
export function parFace(choix: (k: number, j: number) => Peindre): PeindreFuseau {
  const f = (k: number, j: number) => choix(k, j);
  return Object.assign(f, { [PAR_FACE]: true });
}

/** L'anneau d'un profil à la hauteur `y` (entre deux anneaux, par interpolation ; au bord, le premier ou le dernier). */
export function anneauA(profil: Anneau[], y: number): [number, number, number, number, number] {
  let k = 0;
  while (k + 2 < profil.length && profil[k + 1][0] < y) k++;
  const [y0, rx0, rz0 = rx0, dz0 = 0, dx0 = 0] = profil[k];
  const [y1, rx1, rz1 = rx1, dz1 = 0, dx1 = 0] = profil[k + 1];
  const t = clamp((y - y0) / (y1 - y0), 0, 1);
  const l = (a: number, b: number) => a + (b - a) * t;
  return [y, l(rx0, rx1), l(rz0, rz1), l(dz0, dz1), l(dx0, dx1)];
}

/** Le devant d'un fuseau (tourné par `avant`) à la hauteur `y` : le `z` de sa face avant et sa demi-largeur. */
export function devant(profil: Anneau[], n: number, y: number, z = 0): { z: number; demiLargeur: number } {
  const [, rx, rz, dz] = anneauA(profil, y);
  return { z: z + dz - rz * Math.cos(Math.PI / n), demiLargeur: rx * Math.sin(Math.PI / n) };
}

/** Une boîte fermée, de (x0, y0, z0) à (x1, y1, z1) : douze triangles. */
export function pave(T: Trace, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, peindre: Peindre): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  T.quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  T.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), c, peindre);
  T.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0), c, peindre);
  T.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  T.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0), c, peindre);
  T.quad(p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0), c, peindre);
}

/** Une facette plate (un polygone convexe, en éventail), qui regarde à l'opposé de `dos`. */
export function facette(T: Trace, pts: V3[], dos: V3, peindre: Peindre): void {
  for (let i = 1; i + 1 < pts.length; i++) T.triangle(pts[0], pts[i], pts[i + 1], dos, peindre);
}

/** Les deux yeux : deux petites facettes carrées tournées vers −Z, posées devant `z`, à ± `ecart` du milieu `x`. */
export function yeux(T: Trace, peindre: Peindre, x: number, y: number, z: number, ecart: number, taille: number): void {
  const h = taille / 2;
  const zz = z - 0.004;
  for (const s of [-1, 1]) {
    const cx = x + s * ecart;
    facette(T, [[cx - h, y - h, zz], [cx + h, y - h, zz], [cx + h, y + h, zz], [cx - h, y + h, zz]], [cx, y, zz + 1], peindre);
  }
}
