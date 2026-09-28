// Les personnages de la 2D peinte (lot R6), derrière `?rendu=archipeo` : le bonhomme, les créatures et les Gardiens en
// sentinelles, rastérisés depuis leurs modèles en facettes (world/personnages/), dans la projection oblique de la vue 2D
// (./oblique.ts : un bloc vers le nord ou vers le haut monte d'une case à l'écran). Calcul pur, testé sans canvas ; le
// canvas est fait par ./paintedSprites.ts.
//
// Chaque facette prend un aplat de sa couleur (clair au-dessus, ombre bleutée du côté opposé à la lumière, qui vient
// d'en haut à gauche) ; la silhouette est bordée d'un pixel dans la teinte sombre de sa dominante, jamais d'un noir ;
// les yeux du bonhomme et des créatures font 1 × 2 pixels (debout), séparés de deux pixels de peau ; les orbites des
// sentinelles, au moins 2 × 2, séparées d'un pixel au moins. La nuit, les couleurs passent par `deNuit` au palier
// de lumière, sauf ce qui brille : la lueur de nuit (Fi, Astra, Braise) et, selon l'allumage, la flamme et les veines.
import { mixColor } from '../world/daylight';
import { LISERE_DE_NUIT } from '../world/personnages/couleurs';
import type { ArchipelagoId } from '../world/map';
import { deNuit, type Couleur } from '../world/palette';
import { rolesDesTriangles, type FacettesDePersonnage, type PieceDuModele, type Role } from '../world/personnages/peint';
import { allumage } from '../world/personnages/sentinelle';
import { NUIT_OCEAN, nuancer, sombreDe } from './painted';
import { TILE } from './oblique';

/** Pixels (de base) par bloc : l'échelle du terrain de la 2D. */
export const PAS_2D = TILE;

/**
 * La plongée des personnages : le terrain de la 2D monte d'une case par bloc vers le nord (une vue à 45°) ; les
 * personnages, debout, sont vus un peu moins d'en haut : à 45°, une visière, un feuillage ou un front avancé cacherait
 * les yeux de trois d'entre eux (le chef de gare, les sentinelles de la Forêt et du Marché). Leur hauteur est entière.
 */
export const PLONGEE = 0.7;

/**
 * Les yeux des sentinelles (leurs orbites) : au moins `OEIL_MIN` pixels de côté, séparés d'`ECART_DES_YEUX` pixel au
 * moins. Ceux du bonhomme et des créatures : `OEIL` (un pixel de large, deux de haut, debout), séparés de
 * `ECART_DES_YEUX_VIVANTS` pixels de peau, sans pont sombre entre eux (DA, 28/09).
 */
export const OEIL_MIN = 2;
export const ECART_DES_YEUX = 1;
export const OEIL = { w: 1, h: 2 } as const;
export const ECART_DES_YEUX_VIVANTS = 2;

/** La nuit, le liseré de la silhouette du côté éclairé (en haut à gauche) : un pixel clair et froid (DA, 28/09). */
export { LISERE_DE_NUIT };

/** Ce qui brille la nuit (la braise de Braise, la lanterne de Fi, l'abdomen d'Astra) : au moins 3 × 3 pixels, et un
 * halo chaud d'un pixel autour, fixe (il ne clignote pas), d'autant plus fort que la nuit est noire. */
export const LUEUR_MIN = 3;
export const HALO = 0.35;

/** La lumière de la 2D peinte, d'en haut à gauche et de devant (normalisée). */
const LUMIERE = (() => {
  const l = [-0.4, 0.8, -0.45];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((v) => v / n) as [number, number, number];
})();
/** Au-dessus : l'aplat clair ; en dessous : l'ombre. */
const SEUIL_CLAIR = 0.62;
const SEUIL_OMBRE = 0.18;

export interface OptionsDuRaster {
  archipel: ArchipelagoId;
  /** La lumière du palier (0 : nuit, 1 : plein jour). */
  light: number;
  /** La rotation du personnage autour de la verticale, en radians (0 : le visage vers l'élève). */
  angle?: number;
  /** Des pièces tournées autour de leur pivot, sur l'axe X (le pas du bonhomme), en radians. */
  gestes?: Record<string, number>;
  /** Pour une sentinelle : son degré d'allumage (0 : éteinte, 1 : rallumée). */
  allumage?: number;
  /** Pixels par bloc (par défaut, `PAS_2D`). */
  pas?: number;
  /** La plongée : ce qu'un bloc vers le nord monte à l'écran (1 : celle du terrain ; par défaut, `PLONGEE`). */
  plongee?: number;
}

/** Un personnage rastérisé : ses pixels (ligne par ligne, −1 : transparent) et son pied (le point du sol, dans l'image). */
export interface RasterDePersonnage {
  largeur: number;
  hauteur: number;
  ax: number;
  ay: number;
  pixels: Int32Array;
  /** Les yeux posés : leur coin haut gauche et leur taille, en pixels (pour les tests). */
  yeux: { x: number; y: number; w: number; h: number }[];
}

type V = [number, number, number];

function tourneX(p: V, o: V, a: number): V {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const y = p[1] - o[1];
  const z = p[2] - o[2];
  return [p[0], o[1] + y * c - z * s, o[2] + y * s + z * c];
}

function tourneY(p: V, a: number): V {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

/** La couleur d'un triangle à ce palier : l'aplat de sa facette, la nuit, et ce qui brille. */
function couleurDuTriangle(piece: PieceDuModele, role: Role, teinte: Couleur, lum: number, o: OptionsDuRaster): Couleur {
  const d = Math.min(1, Math.max(0, o.allumage ?? 0));
  const light = Math.min(1, Math.max(0, o.light));
  const base = o.allumage === undefined ? teinte : allumage(teinte, d);
  const aplat = (c: Couleur) => (lum > SEUIL_CLAIR ? mixColor(c, 0xffffff, 0.14) : lum < SEUIL_OMBRE ? mixColor(nuancer(c, 0.8), NUIT_OCEAN, 0.1) : c);
  if (role === 'lueur' && piece.lueur === 'nuit') {
    // La lueur de nuit : sa couleur de jour, et la nuit la sienne (le verre de Fi prend la lueur), jamais assombrie.
    return mixColor(deNuit(o.archipel, teinte, light), piece.nuit ?? teinte, 1 - light);
  }
  if (piece.lueur === 'allumage') {
    // La flamme et les veines : de la cendre éteintes (une pierre comme les autres), la lueur à mesure qu'elles s'allument.
    const c = d < 0.5 ? aplat(base) : base;
    return mixColor(deNuit(o.archipel, c, light), c, d);
  }
  if (role === 'yeux' || role === 'lueur') return deNuit(o.archipel, base, light);
  return deNuit(o.archipel, aplat(base), light);
}

/**
 * Rastérise un personnage en facettes dans la projection oblique de la 2D : le point (X, Y, Z) du modèle (repère de
 * Three.js, le visage vers −Z) tombe à (X, −(Y + k Z)) blocs de l'écran, `k` la plongée ; de deux facettes sur un
 * pixel, la plus proche (Z − k Y le plus petit) l'emporte, et une facette qui tourne le dos (vers le nord ou vers le
 * bas) n'est pas vue.
 */
export function rasterDuModele(f: FacettesDePersonnage, o: OptionsDuRaster): RasterDePersonnage {
  const pas = o.pas ?? PAS_2D;
  const n = f.pieces.length;
  const angle = o.angle ?? 0;
  const gestes = o.gestes ?? {};
  const k = o.plongee ?? PLONGEE;
  // Une sentinelle (on lui donne son allumage) garde ses orbites de pierre ; les autres ont des yeux vivants, posés
  // après coup (leurs facettes ne se peignent pas : la peau reste entre eux).
  const vivant = o.allumage === undefined;
  const rolesDuModele = rolesDesTriangles(f);
  // Les sommets et les normales, posés (gestes, puis rotation), puis projetés.
  const sx = new Float64Array(n * 3);
  const sy = new Float64Array(n * 3);
  const sz = new Float64Array(n * 3);
  const vu = new Uint8Array(n);
  const lum = new Float64Array(n);
  const devant = new Uint8Array(n);
  const vuDevant = (t: number) => devant[t] === 1;
  for (let t = 0; t < n; t++) {
    const piece = f.table[f.pieces[t]];
    const g = gestes[piece.nom] ?? 0;
    const pose = (p: V) => tourneY(g ? tourneX(p, piece.pivot as V, g) : p, angle);
    for (let s = 0; s < 3; s++) {
      const i = t * 9 + s * 3;
      const p = pose([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
      sx[t * 3 + s] = p[0] * pas;
      sy[t * 3 + s] = -(p[1] + k * p[2]) * pas;
      sz[t * 3 + s] = p[2] - k * p[1];
    }
    const nn = tourneY(g ? tourneX([f.normals[t * 9], f.normals[t * 9 + 1], f.normals[t * 9 + 2]], [0, 0, 0], g) : [f.normals[t * 9], f.normals[t * 9 + 1], f.normals[t * 9 + 2]], angle);
    vu[t] = k * nn[1] - nn[2] > 1e-6 ? 1 : 0;
    devant[t] = vu[t];
    if (vivant && rolesDuModele[t] === 'yeux') vu[t] = 0;
    lum[t] = nn[0] * LUMIERE[0] + nn[1] * LUMIERE[1] + nn[2] * LUMIERE[2];
  }
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < n * 3; i++) {
    x0 = Math.min(x0, sx[i]);
    x1 = Math.max(x1, sx[i]);
    y0 = Math.min(y0, sy[i]);
    y1 = Math.max(y1, sy[i]);
  }
  // Un pixel de marge tout autour, pour le bord.
  const gx = Math.floor(x0) - 1;
  const gy = Math.floor(y0) - 1;
  const largeur = Math.ceil(x1) - gx + 1;
  const hauteur = Math.ceil(y1) - gy + 1;
  const triangle = new Int32Array(largeur * hauteur).fill(-1);
  const profondeur = new Float64Array(largeur * hauteur).fill(Infinity);
  for (let t = 0; t < n; t++) {
    if (!vu[t]) continue;
    const ax = sx[t * 3] - gx;
    const ay = sy[t * 3] - gy;
    const bx = sx[t * 3 + 1] - gx;
    const by = sy[t * 3 + 1] - gy;
    const cx = sx[t * 3 + 2] - gx;
    const cy = sy[t * 3 + 2] - gy;
    const aire = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (Math.abs(aire) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const i1 = Math.min(largeur - 1, Math.ceil(Math.max(ax, bx, cx)));
    const j0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const j1 = Math.min(hauteur - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const [qx, qy] = [i + 0.5, j + 0.5];
        const w0 = ((bx - qx) * (cy - qy) - (cx - qx) * (by - qy)) / aire;
        const w1 = ((cx - qx) * (ay - qy) - (ax - qx) * (cy - qy)) / aire;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-9 || w1 < -1e-9 || w2 < -1e-9) continue;
        const z = w0 * sz[t * 3] + w1 * sz[t * 3 + 1] + w2 * sz[t * 3 + 2];
        const p = j * largeur + i;
        if (z < profondeur[p]) {
          profondeur[p] = z;
          triangle[p] = t;
        }
      }
  }

  // Les couleurs : une par triangle (calculée une fois).
  const roles = rolesDuModele;
  const couleurs = new Map<number, Couleur>();
  const couleurDe = (t: number) => {
    let c = couleurs.get(t);
    if (c === undefined) couleurs.set(t, (c = couleurDuTriangle(f.table[f.pieces[t]], roles[t], f.teintes[t], lum[t], o)));
    return c;
  };
  const pixels = new Int32Array(largeur * hauteur).fill(-1);
  const compte = new Map<Couleur, number>();
  for (let p = 0; p < pixels.length; p++) {
    const t = triangle[p];
    if (t < 0) continue;
    pixels[p] = couleurDe(t);
    if (roles[t] === 'dominante') compte.set(f.teintes[t], (compte.get(f.teintes[t]) ?? 0) + 1);
  }

  // Les yeux : au moins 2 × 2 pixels, là où l'œil est vu (devant, et pas caché), séparés d'un pixel.
  // Ce qui brille la nuit : au moins 3 × 3 pixels, et un halo chaud d'un pixel sur ce qui l'entoure.
  const light = Math.min(1, Math.max(0, o.light));
  if (light < 1) {
    let [bx0, bx1, by0, by1, nb] = [Infinity, -Infinity, Infinity, -Infinity, 0];
    let lueur: Couleur | null = null;
    for (let p = 0; p < pixels.length; p++) {
      const t = triangle[p];
      if (t < 0 || roles[t] !== 'lueur' || f.table[f.pieces[t]].lueur !== 'nuit') continue;
      const [i, j] = [p % largeur, Math.floor(p / largeur)];
      [bx0, bx1, by0, by1] = [Math.min(bx0, i), Math.max(bx1, i), Math.min(by0, j), Math.max(by1, j)];
      nb++;
      lueur ??= pixels[p];
    }
    if (nb && lueur !== null) {
      const grandir = (a: number, b: number, max: number): [number, number] => {
        const manque = LUEUR_MIN - (b - a + 1);
        if (manque <= 0) return [a, b];
        const a2 = Math.max(0, a - Math.floor(manque / 2));
        return [a2, Math.min(max - 1, a2 + LUEUR_MIN - 1)];
      };
      [bx0, bx1] = grandir(bx0, bx1, largeur);
      [by0, by1] = grandir(by0, by1, hauteur);
      // Le halo : un pixel autour, sur le personnage seulement ; la petite lueur (une seule tache) le reçoit en plein.
      for (let j = by0 - 1; j <= by1 + 1; j++)
        for (let i = bx0 - 1; i <= bx1 + 1; i++) {
          if (i < 0 || j < 0 || i >= largeur || j >= hauteur) continue;
          const p = j * largeur + i;
          const dedans = i >= bx0 && i <= bx1 && j >= by0 && j <= by1;
          // Sur le personnage seulement : la silhouette ne change pas la nuit.
          if (pixels[p] < 0) continue;
          pixels[p] = dedans ? lueur : mixColor(pixels[p], lueur, HALO * (1 - light));
        }
    }
  }

  // Les yeux vivants sont cachés du tampon : on les cherche avec leurs faces tournées vers l'élève.
  const yeuxVus = vivant ? Uint8Array.from(vu, (v, t) => (roles[t] === 'yeux' ? (vuDevant(t) ? 1 : 0) : v)) : vu;
  const yeux = poserLesYeux(f, roles, yeuxVus, sx, sy, sz, gx, gy, largeur, hauteur, profondeur, triangle, vivant);
  for (const e of yeux) {
    const c = deNuit(o.archipel, e.couleur, Math.min(1, Math.max(0, o.light)));
    for (let j = e.y; j < e.y + e.h; j++) for (let i = e.x; i < e.x + e.w; i++) if (i >= 0 && j >= 0 && i < largeur && j < hauteur) pixels[j * largeur + i] = c;
  }

  // Le bord : un pixel autour de la silhouette, dans la teinte sombre de la dominante (la plus vue) à ce palier.
  let dominante: Couleur | null = null;
  for (const [c, k] of compte) if (dominante === null || k > compte.get(dominante)!) dominante = c;
  const trait = sombreDe(deNuit(o.archipel, dominante ?? f.teintes[0] ?? 0x808080, Math.min(1, Math.max(0, o.light))));
  const plein = (i: number, j: number) => i >= 0 && j >= 0 && i < largeur && j < hauteur && pixels[j * largeur + i] >= 0;
  const bord: number[] = [];
  for (let j = 0; j < hauteur; j++)
    for (let i = 0; i < largeur; i++) {
      if (pixels[j * largeur + i] >= 0) continue;
      if (plein(i - 1, j) || plein(i + 1, j) || plein(i, j - 1) || plein(i, j + 1)) bord.push(j * largeur + i);
    }
  // La nuit, le bord du côté éclairé (à gauche et en haut de la silhouette) devient un liseré clair et froid.
  const lisere = mixColor(trait, LISERE_DE_NUIT, vivant ? 1 - light : 0);
  for (const p of bord) {
    const [i, j] = [p % largeur, Math.floor(p / largeur)];
    pixels[p] = lisere !== trait && (plein(i + 1, j) || plein(i, j + 1)) ? lisere : trait;
  }

  return { largeur, hauteur, ax: -gx, ay: -gy, pixels, yeux: yeux.map(({ x, y, w, h }) => ({ x, y, w, h })) };
}

/**
 * Les yeux vus d'un personnage : chaque œil (un amas de triangles de rôle `yeux` qui se touchent) tourné vers l'élève
 * et pas caché devient un carré d'au moins `OEIL_MIN` pixels, centré sur lui ; deux yeux côte à côte s'écartent d'au
 * moins `ECART_DES_YEUX` pixel.
 */
function poserLesYeux(
  f: FacettesDePersonnage,
  roles: Role[],
  vu: Uint8Array,
  sx: Float64Array,
  sy: Float64Array,
  sz: Float64Array,
  gx: number,
  gy: number,
  largeur: number,
  hauteur: number,
  profondeur: Float64Array,
  triangle: Int32Array,
  vivant: boolean,
): { x: number; y: number; w: number; h: number; couleur: Couleur }[] {
  const ts: number[] = [];
  for (let t = 0; t < roles.length; t++) if (roles[t] === 'yeux') ts.push(t);
  if (!ts.length) return [];
  // Les amas : deux triangles qui partagent un sommet sont du même œil.
  const parent = ts.map((_, i) => i);
  const racine = (i: number): number => (parent[i] === i ? i : (parent[i] = racine(parent[i])));
  const cle = (t: number, k: number) => `${f.positions[t * 9 + k * 3].toFixed(4)},${f.positions[t * 9 + k * 3 + 1].toFixed(4)},${f.positions[t * 9 + k * 3 + 2].toFixed(4)}`;
  const vus = new Map<string, number>();
  ts.forEach((t, i) => {
    for (let k = 0; k < 3; k++) {
      const c = cle(t, k);
      const j = vus.get(c);
      if (j === undefined) vus.set(c, i);
      else parent[racine(i)] = racine(j);
    }
  });
  const amas = new Map<number, number[]>();
  ts.forEach((t, i) => amas.set(racine(i), [...(amas.get(racine(i)) ?? []), t]));
  const yeux: { x: number; y: number; w: number; h: number; couleur: Couleur; cx: number; cy: number }[] = [];
  for (const groupe of amas.values()) {
    const vuDevant = groupe.filter((t) => vu[t]);
    if (!vuDevant.length) continue;
    let [cx, cy, cz, k] = [0, 0, 0, 0];
    let [bx0, bx1, by0, by1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const t of vuDevant)
      for (let s = 0; s < 3; s++) {
        const [x, y] = [sx[t * 3 + s] - gx, sy[t * 3 + s] - gy];
        cx += x;
        cy += y;
        cz += sz[t * 3 + s];
        k++;
        bx0 = Math.min(bx0, x);
        bx1 = Math.max(bx1, x);
        by0 = Math.min(by0, y);
        by1 = Math.max(by1, y);
      }
    [cx, cy, cz] = [cx / k, cy / k, cz / k];
    // Caché ? Le pixel sous son centre montre quelque chose de nettement plus proche que lui.
    const [pi, pj] = [Math.floor(cx), Math.floor(cy)];
    if (pi < 0 || pj < 0 || pi >= largeur || pj >= hauteur) continue;
    const p = pj * largeur + pi;
    if (triangle[p] >= 0 && !groupe.includes(triangle[p]) && profondeur[p] < cz - 0.08) continue;
    const w = vivant ? OEIL.w : Math.max(OEIL_MIN, Math.round(bx1 - bx0));
    const h = vivant ? OEIL.h : Math.max(OEIL_MIN, Math.round(by1 - by0));
    yeux.push({ x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, couleur: f.teintes[groupe[0]], cx, cy });
  }
  // Deux yeux sur les mêmes lignes, trop près : on les écarte, chacun de son côté.
  yeux.sort((a, b) => a.cx - b.cx);
  for (let i = 0; i + 1 < yeux.length; i++) {
    const [a, b] = [yeux[i], yeux[i + 1]];
    if (a.y >= b.y + b.h || b.y >= a.y + a.h) continue;
    const manque = a.x + a.w + (vivant ? ECART_DES_YEUX_VIVANTS : ECART_DES_YEUX) - b.x;
    if (manque <= 0) continue;
    a.x -= Math.floor(manque / 2);
    b.x += Math.ceil(manque / 2);
  }
  return yeux;
}
