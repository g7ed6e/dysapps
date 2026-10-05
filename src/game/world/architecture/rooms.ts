// Les pièces d'architecture (lot 7a d'Archipéo) : la géométrie d'une pièce, dans sa case, en coordonnées de grille (x,
// y de 0 à 1, z : hauteur de 0 à 1), dans l'orientation de référence de sa forme (./choices.ts), et le masque `couvre` des
// faces de la case qu'elle ferme entièrement (une voisine n'y montre pas sa face). Rien ne sort de la case : le toucher
// retrouve la case d'une pièce, toute la case, par la table triangle → case (world/construction.ts, `caseDeLaPiece`).
//
// La couleur n'est pas ici : une facette dit si elle prend le dessus ou le côté de la matière du bloc (la palette de
// l'archipel), ou un rôle du kit (les pilotis), et son motif peint (./paint.ts : 0, aucun). Code pur, sans Three.js.

export type V3 = [number, number, number];

/** Les faces d'une case, dans le masque `couvre` (les quatre côtés dans l'ordre de `COTES`, puis le haut et le bas). */
export const FACES = { est: 1, nord: 2, ouest: 4, sud: 8, haut: 16, bas: 32 } as const;
export const TOUTES_LES_FACES = 0b111111;

/**
 * Les rôles des couleurs d'un kit (./kits/types.ts) : une pièce peut en montrer plusieurs dans sa case (le colombage sur
 * son remplissage, les pilotis sous le plancher).
 */
export type Role = 'poteau' | 'remplissage' | 'soubassement' | 'bardage' | 'pilotis' | 'chaperon';

/** Une facette d'une pièce : un polygone convexe (3 ou 4 sommets) et sa normale. */
export interface Facette {
  points: V3[];
  normale: V3;
  /** La couleur de la matière qu'elle prend : son dessus ou son côté. */
  face: 'dessus' | 'cote';
  /** La couleur d'un rôle du kit, au lieu de la matière du bloc. */
  role?: Role;
  /** Le motif peint (0 ou absent : aucun). */
  motif?: number;
}

/** Une pièce dessinée, dans l'orientation de référence de sa forme. */
export interface DessinDePiece {
  facettes: readonly Facette[];
  /** Les faces de la case qu'elle ferme entièrement (bits de `FACES`). */
  couvre: number;
  /**
   * La pièce file le long de y (dans son orientation de référence) : une rangée de pièces pareilles se dessine d'un
   * tenant (./assemblage.ts).
   */
  filant?: boolean;
}

/** Un point de la case tourné de `r` quarts de tour, dans le sens direct, autour de l'axe vertical du centre de la case. */
function tournerPoint(p: V3, r: number): V3 {
  let [x, y] = p;
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) [x, y] = [1 - y, x];
  return [x, y, p[2]];
}

/** Une direction tournée de `r` quarts de tour. */
function tournerDirection(n: V3, r: number): V3 {
  let [x, y] = n;
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) [x, y] = [-y, x];
  return [x, y, n[2]];
}

/** Un masque `couvre` tourné de `r` quarts de tour (les quatre côtés tournent, le haut et le bas restent). */
export function tournerCouvre(couvre: number, r: number): number {
  const q = ((r % 4) + 4) % 4;
  const cotes = couvre & 0b1111;
  return (((cotes << q) | (cotes >> (4 - q))) & 0b1111) | (couvre & 0b110000);
}

/** Les facettes d'une pièce posée : tournées de `r` quarts de tour, puis portées dans la case (x, y, z) du monde. */
export function facettesPosees(d: DessinDePiece, r: number, x: number, y: number, z: number): Facette[] {
  return d.facettes.map((f) => ({
    ...f,
    points: f.points.map((p) => {
      const q = tournerPoint(p, r);
      return [q[0] + x, q[1] + y, q[2] + z] as V3;
    }),
    normale: tournerDirection(f.normale, r),
  }));
}

/** Le nombre de triangles d'une pièce. */
export const trianglesDe = (d: DessinDePiece) => d.facettes.reduce((n, f) => n + f.points.length - 2, 0);

/**
 * Une boîte dans la case, de (x0, y0, z0) à (x1, y1, z1) (de 0 à 1) : ses six faces, et les faces de la case qu'elle
 * ferme (celles qu'elle touche sur toute leur étendue). Une brique pour dessiner les pièces des kits ; `role` : la
 * couleur d'un rôle du kit au lieu de la matière du bloc.
 */
export function boiteDansLaCase(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, motif = 0, role?: Role): DessinDePiece {
  const f = (points: V3[], normale: V3, face: 'dessus' | 'cote'): Facette => ({ points, normale, face, motif, ...(role ? { role } : {}) });
  const facettes = [
    f([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], 'dessus'),
    f([[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [0, 0, -1], 'cote'),
    f([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], 'cote'),
    f([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], 'cote'),
    f([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], 'cote'),
    f([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], 'cote'),
  ];
  const pleinXY = x0 <= 0 && x1 >= 1 && y0 <= 0 && y1 >= 1;
  const pleinYZ = y0 <= 0 && y1 >= 1 && z0 <= 0 && z1 >= 1;
  const pleinXZ = x0 <= 0 && x1 >= 1 && z0 <= 0 && z1 >= 1;
  let couvre = 0;
  if (pleinYZ && x1 >= 1) couvre |= FACES.est;
  if (pleinYZ && x0 <= 0) couvre |= FACES.ouest;
  if (pleinXZ && y1 >= 1) couvre |= FACES.nord;
  if (pleinXZ && y0 <= 0) couvre |= FACES.sud;
  if (pleinXY && z1 >= 1) couvre |= FACES.haut;
  if (pleinXY && z0 <= 0) couvre |= FACES.bas;
  return { facettes, couvre };
}
