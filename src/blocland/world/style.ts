// Les trois options de style de surface du lot R1 (docs/univers/archipeo/cadrage.md, point « Style en code »),
// pour les comparer en captures sur les cubes d'aujourd'hui, derrière `?rendu=archipeo&style=a|b|c` (voir ../rendu.ts).
// Code pur, sans Three.js : la vue 3D n'en tire que des couleurs et des normales de sommets. Aucune ne change la forme :
// les facettes tirées de la grille de hauteurs viennent au lot R2, les biseaux ne viendraient qu'avec un autre maillage.
//
// - (a) aplat : une couleur de la palette par face, sans texture ; seule la lumière distingue les faces.
// - (b) facettes et dégradés doux : la couleur de la palette, nuancée par sommet (plus sombre et plus froide vers la
//   mer, de larges taches claires et sombres sur les dessus), fondue d'un sommet à l'autre.
// - (c) cubes adoucis : la couleur de la palette, et des normales penchées vers les coins, qui arrondissent la lumière
//   de chaque cube comme un biseau, sans ajouter un triangle.

import { clamp, smooth } from '../../core/math';
import { cellHash } from '../../core/random';

export type StyleSurface = 'a' | 'b' | 'c';

export const STYLES: StyleSurface[] = ['a', 'b', 'c'];

/** Un bruit de valeur lissé, continu, de 0 à 1 : de larges taches, sans motif répété à l'œil. */
export function bruit(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = smooth(x - i);
  const v = smooth(y - j);
  const a = cellHash(i, j) + (cellHash(i + 1, j) - cellHash(i, j)) * u;
  const b = cellHash(i, j + 1) + (cellHash(i + 1, j + 1) - cellHash(i, j + 1)) * u;
  return a + (b - a) * v;
}

/** Bornes de la nuance (b) : jamais au point de changer la matière qu'on reconnaît. */
export const NUANCE: [number, number] = [0.78, 1.08];

/**
 * La nuance d'un sommet (option b), qui multiplie la couleur de la palette. `x`, `y`, `z` dans le repère Three (Y en
 * haut) ; `dessus` pour un sommet d'une face tournée vers le ciel. Ne dépend que de la position : deux faces voisines
 * se fondent l'une dans l'autre.
 */
export function nuanceSommet(x: number, y: number, z: number, dessus: boolean): number {
  // Plus sombre et plus froid vers la mer, plus clair vers les sommets (les falaises prennent des strates douces).
  const hauteur = 0.82 + 0.2 * smooth(clamp((y + 1) / 12, 0, 1));
  // Sur les dessus, de larges taches (9 blocs environ) un peu plus claires ou plus sombres.
  const taches = dessus ? 1 + 0.06 * (bruit(x / 9, z / 9) * 2 - 1) : 1;
  return clamp(hauteur * taches, NUANCE[0], NUANCE[1]);
}

/** Près de la mer (sous `FROID_SOUS`), la couleur se mêle de `FROID` à l'ambiance renvoyée par le sol de l'archipel. */
export const FROID = 0.1;
export const FROID_SOUS = 2;

/**
 * La part d'ambiance froide d'un sommet (option b), de 0 à `FROID` : ce qui est près de la mer tire vers la couleur
 * renvoyée par le sol et l'eau (`ambianceSol` de la palette). Les sommets sont à hauteur entière : d'un sommet à
 * l'autre, le passage se fond sur la hauteur d'un bloc.
 */
export function froidSommet(y: number): number {
  return y < FROID_SOUS ? FROID : 0;
}

/** De combien les normales penchent vers les coins (option c) : 0,5 donne un biseau d'environ 35° au coin. */
export const ADOUCI = 0.5;

/**
 * Les normales adoucies d'un quadrilatère (option c) : chaque sommet penche vers son coin du cube, la lumière s'arrondit
 * vers les arêtes. `quad` : les 4 sommets (12 nombres), `n` : la normale de la face. Renvoie 12 nombres.
 */
export function normalesAdoucies(quad: number[], n: [number, number, number]): number[] {
  const cx = (quad[0] + quad[3] + quad[6] + quad[9]) / 4;
  const cy = (quad[1] + quad[4] + quad[7] + quad[10]) / 4;
  const cz = (quad[2] + quad[5] + quad[8] + quad[11]) / 4;
  const out: number[] = [];
  for (let k = 0; k < 4; k++) {
    // Le décalage du sommet dans le plan de la face (±0,5 sur deux axes), doublé : ±1.
    const ox = (quad[k * 3] - cx) * 2 * ADOUCI;
    const oy = (quad[k * 3 + 1] - cy) * 2 * ADOUCI;
    const oz = (quad[k * 3 + 2] - cz) * 2 * ADOUCI;
    const vx = n[0] + ox;
    const vy = n[1] + oy;
    const vz = n[2] + oz;
    const len = Math.hypot(vx, vy, vz) || 1;
    out.push(vx / len, vy / len, vz / len);
  }
  return out;
}
