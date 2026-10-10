// Les pièces basses de la table commune (décision du directeur artistique, 8 octobre 2026) : le bac de pierre (une
// pièce de pierre seule et basse), la barrière (poteaux et lisses, repris du garde-corps de world/bridges.ts) et la
// marche (de pierre, basse). Dessinées dans leur case, en coordonnées de grille, dans l'orientation de référence de leur
// forme (./choices.ts) ; rien ne sort de la case : le toucher prend toute la case. Le dessous d'une pièce posée sur le
// sol n'est pas émis (./assembly.ts). Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import { FORMES, type Forme, type IdDeMur, type IdDePiece } from './choices';
import { boiteDansLaCase, FACES, type DessinDePiece, type Facette, type V3 } from './rooms';

/** Les mesures des pièces basses, en part de case. */
export const PIECES_BASSES = {
  /**
   * Le bac : son retrait de chaque côté, sa hauteur (sous la moitié haute de la case), et la largeur de son rebord gris,
   * autour de son dessus dans la teinte de sa matière.
   */
  bac: { retrait: 0.08, haut: 0.7, rebord: 0.1 },
  /** La barrière : le poteau (comme celui du pont), la lisse (la même que celle du garde-corps du pont). */
  poteau: 0.1,
  lisse: { largeur: 0.08, hauteur: 0.08, haut: 0.55 },
  /** La marche : sa hauteur. */
  marche: 0.3,
  /**
   * Le poteau de bois (le végétal, `tronc` : les bacs, les lanternes au bout des liaisons, la jetée) : sa section, celle
   * du corps d'une lanterne (world/construction/settings.ts, `LANTERNE.corps`), qui s'y pose juste.
   */
  woodenPost: 0.3,
} as const;

/** Les facettes d'une boîte, sauf celles dont la normale est donnée (le dessous, un bout caché dans le poteau). */
const sans = (d: DessinDePiece, ...normales: [number, number, number][]): Facette[] =>
  d.facettes.filter((f) => !normales.some((n) => f.normale[0] === n[0] && f.normale[1] === n[1] && f.normale[2] === n[2]));

/**
 * Le bac de pierre : une boîte en retrait dans sa case, moins haute qu'elle, dans la teinte de sa matière, son dessus
 * cerné d'un rebord gris (le rôle `chaperon` du kit) : quatre bandes autour du dessus (retouches du directeur
 * artistique, 8 octobre 2026 : le bac garde sa teinte). Huit triangles de plus qu'un dessus d'un tenant.
 */
export function bacDePierre(): DessinDePiece {
  const { retrait: r, haut: z, rebord: e } = PIECES_BASSES.bac;
  const corps = boiteDansLaCase(r, 1 - r, r, 1 - r, 0, z);
  const [a, b, i, j] = [r, 1 - r, r + e, 1 - r - e];
  const haut = (points: V3[], role?: 'chaperon'): Facette => ({ points, normale: [0, 0, 1], face: 'dessus', motif: 0, ...(role ? { role } : {}) });
  const dessus = [
    haut([[i, i, z], [j, i, z], [j, j, z], [i, j, z]]),
    // Le rebord : quatre trapèzes, du bord du bac au bord du dessus.
    haut([[a, a, z], [b, a, z], [j, i, z], [i, i, z]], 'chaperon'),
    haut([[b, a, z], [b, b, z], [j, j, z], [j, i, z]], 'chaperon'),
    haut([[b, b, z], [a, b, z], [i, j, z], [j, j, z]], 'chaperon'),
    haut([[a, b, z], [a, a, z], [i, i, z], [i, j, z]], 'chaperon'),
  ];
  return { facettes: [...dessus, ...corps.facettes.filter((f) => f.normale[2] <= 0)], couvre: corps.couvre };
}

/** La lisse d'une barrière, du poteau (au milieu de la case) vers le côté +x, ou d'un bout à l'autre de la case. */
function lisse(x0: number): Facette[] {
  const { largeur: w, hauteur: h, haut } = PIECES_BASSES.lisse;
  const b = boiteDansLaCase(x0, 1, 0.5 - w / 2, 0.5 + w / 2, haut - h, haut);
  // Ni le dessous (aucune caméra ne passe sous une lisse), ni le bout caché dans le poteau.
  return x0 > 0 ? sans(b, [0, 0, -1], [-1, 0, 0]) : sans(b, [0, 0, -1]);
}

/** Une lisse tournée d'un quart de tour (+x vers +y) autour du milieu de la case. */
const tourner = (f: Facette, r: number): Facette => {
  let { points, normale } = f;
  for (let i = 0; i < r; i++) {
    points = points.map(([x, y, z]) => [1 - y, x, z]);
    normale = [-normale[1], normale[0], normale[2]];
  }
  return { ...f, points, normale };
};

/** Le poteau d'une barrière, au milieu de sa case : haut (toute la case, une lanterne peut s'y poser) ou sous la lisse. */
function poteau(haut: boolean): Facette[] {
  const p = PIECES_BASSES.poteau;
  const z1 = haut ? 1 : PIECES_BASSES.lisse.haut - PIECES_BASSES.lisse.hauteur;
  const b = boiteDansLaCase(0.5 - p / 2, 0.5 + p / 2, 0.5 - p / 2, 0.5 + p / 2, 0, z1);
  // Sans dessous ; un poteau bas sans dessus, sous sa lisse.
  return haut ? sans(b, [0, 0, -1]) : sans(b, [0, 0, -1], [0, 0, 1]);
}

/**
 * La barrière d'une forme : un poteau au milieu de sa case, une lisse vers chacune de ses voisines (des barrières :
 * une barrière ne se lit que sur les barrières, ./index.ts). Le poteau est haut au bout d'une rangée, seul, dans un angle,
 * ou sous ce qui est posé dessus ; au milieu d'une rangée (`droit`), une case sur deux n'en a pas (`avecPoteau`).
 */
export function barriere(forme: Forme, dessus: boolean, avecPoteau: boolean): DessinDePiece {
  const cotes = FORMES.find((f) => f.forme === forme)!.cotes;
  const facettes: Facette[] = [];
  if (forme === 'droit') {
    // Une lisse d'un bout à l'autre ; le poteau, une case sur deux (comme le garde-corps du pont), ou sous ce qui est dessus.
    facettes.push(...lisse(0));
    if (avecPoteau || dessus) facettes.push(...poteau(dessus));
  } else {
    facettes.push(...poteau(true));
    for (let r = 0; r < 4; r++) if (cotes & (1 << r)) facettes.push(...lisse(0.5).map((f) => tourner(f, r)));
  }
  return { facettes, couvre: 0 };
}

/**
 * La marche : basse, dans la teinte de sa matière (l'escalier, brun ; retouches du directeur artistique, 8 octobre
 * 2026 : grise, elle se confondait avec le cube de Brume d'un fantôme et le dallage) ; sous ce qui est posé dessus, toute
 * la case.
 */
export function marche(dessus: boolean): DessinDePiece {
  const b = boiteDansLaCase(0, 1, 0, 1, 0, dessus ? 1 : PIECES_BASSES.marche);
  return { facettes: b.facettes, couvre: dessus ? b.couvre : FACES.bas };
}

const formeDe = (piece: IdDePiece): Forme | null => (piece.startsWith('mur.') ? (piece.split('.')[1] as Forme) : null);
const sousQuelqueChose = (piece: IdDePiece) => !piece.endsWith('.chaperon');

const BARRIERES = new Map<string, DessinDePiece>();
const MARCHES = new Map<boolean, DessinDePiece>();

/** La barrière d'un bloc, d'après sa pièce (sa forme, et ce qu'il porte) et sa case (un poteau une case sur deux). */
export function barriereDe(piece: IdDePiece, c: VoxelCube): DessinDePiece | undefined {
  const forme = formeDe(piece);
  if (!forme) return undefined;
  const dessus = sousQuelqueChose(piece);
  const avecPoteau = (((c.x + c.y) % 2) + 2) % 2 === 0;
  const k = `${forme}|${dessus}|${avecPoteau}`;
  let d = BARRIERES.get(k);
  if (!d) {
    d = barriere(forme, dessus, avecPoteau);
    BARRIERES.set(k, d);
  }
  return d;
}

/** La marche d'un bloc (un escalier), d'après sa pièce. */
export function marcheDe(piece: IdDePiece): DessinDePiece | undefined {
  return formeDe(piece) ? stepOf(sousQuelqueChose(piece)) : undefined;
}

/** La marche, faite une fois : basse, ou de toute la case sous ce qui est posé dessus (`covered`). */
export function stepOf(covered: boolean): DessinDePiece {
  let d = MARCHES.get(covered);
  if (!d) {
    d = marche(covered);
    MARCHES.set(covered, d);
  }
  return d;
}

/**
 * Le poteau de bois (intention du directeur artistique, 9 octobre 2026) : un poteau carré au milieu de sa case, de toute
 * sa hauteur, dans le brun des pilotis du kit (le rôle `pilotis`), le dessus net. Ni dessous (posé sur le sol, sur un
 * autre poteau, ou dans l'eau), ni dessus quand un poteau ou une lanterne le couvre (`dessus`). Au plus 10 triangles,
 * ceux d'un cube.
 */
export function woodenPost(dessus: boolean): DessinDePiece {
  const p = PIECES_BASSES.woodenPost;
  const b = boiteDansLaCase(0.5 - p / 2, 0.5 + p / 2, 0.5 - p / 2, 0.5 + p / 2, 0, 1, 0, 'pilotis');
  return { facettes: dessus ? sans(b, [0, 0, -1]) : sans(b, [0, 0, -1], [0, 0, 1]), couvre: 0 };
}

/** L'identifiant de la pièce seule et basse : un bloc sans voisine, au pied, sans rien au-dessus. */
export const PIECE_SEULE_ET_BASSE: IdDeMur = 'mur.seul.pied.chaperon';
