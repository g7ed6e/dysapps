// Les réglages du sol en facettes (lots R1 à R4 de la piste Rendu) : le niveau de l'eau, le rivage, les taches, les
// strates, la frange et le fondu, le contraste, l'ombre des pentes, le socle des décors, les éboulis.
import type { Couleur } from '../palette';

/** Le niveau de l'eau dans la vue 3D (`WATER_LEVEL` de three/WorldCanvas.tsx). */
export const NIVEAU_EAU = -0.45;

/** Là où la côte d'une île au niveau de la mer rejoint l'eau : juste au-dessus. */
export const RIVAGE = -0.25;

/** Sous l'eau, rien ne se voit : les falaises s'arrêtent là (sauf dans le ciel, où il n'y a pas d'eau). */
export const PLANCHER = -1;

/** Les taches sur les dessus (option b, redosée sur les facettes) : ± 8 %, sur 9 blocs environ. */
export const TACHES = 0.08;

/** Les strates des falaises : ± 5 %, sur les côtés seulement ; ± 3 % sur une paroi de plus de 4 blocs de haut. */
export const STRATES = 0.05;

export const STRATES_HAUTES = 0.03;

/** Au-delà de cette hauteur (en blocs), une paroi prend les strates discrètes. */
export const PAROI_HAUTE = 4;

/**
 * La frange de sable, au bord de la mer : la part de la case côté mer en sable pur (0,55 : un peu plus que la dernière
 * demi-case), puis le fondu vers le dessus, sur au plus `FONDU` de case.
 */
export const FRANGE = 0.55;

export const FONDU = 0.3;

/**
 * Deux dessus voisins de couleurs trop différentes (plus que ça, en distance entre couleurs 0..255) ne se fondent pas
 * d'un coin à l'autre, sur deux cases : chacun garde sa couleur et le passage se fait au bord, sur `FONDU` de case de
 * chaque côté (une dalle claire contre la roche, comme le sable au rivage). Les voisins proches (herbe et mousse, galet
 * et pierre) se fondent toujours d'un coin à l'autre.
 */
export const CONTRASTE = 100;

/** Les bornes de la nuance des pentes et des parois (option b). */
export const NUANCE_SOL: [number, number] = [0.82, 1.08];

/** Une pente à l'ombre reste au moins à cette part de la lumière d'un dessus plat. */
export const PENTE_OMBRE = 0.85;

/** Une case où seul un décor est posé descend si son socle dépasserait la pente de plus que ça. */
export const SOCLE_MAX = 0.25;

/** Une colonne dont la paroi plonge dans la mer de plus haut que ça (en blocs) prend un pied d'éboulis. */
export const COLONNE_HAUTE = 3;

/** La hauteur des éboulis du pied, au-dessus de `RIVAGE`. */
export const EBOULIS = 0.45;

/** Une île fermée : les couleurs délavées vers le gris clair (comme three/surface.ts). */
export const DELAVE: [Couleur, number] = [0xb8bcc0, 0.55];

/** Les quatre coins d'une case, dans l'ordre : (x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1). */
export const COINS: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
