// Le bonhomme d'Archipéo en facettes peintes (lot R6) : l'avatar de l'élève, un collégien explorateur à la silhouette
// neutre, deux blocs de haut, la tête à 1/5,5 de sa taille (un collégien, pas un adulte : tête un peu forte, jambes
// courtes, poignets en haut des cuisses, bras légèrement écartés). Cheveux courts en bataille, veste à capuche, besace
// de cuir à la hanche dont le rabat Sable se voit de face, jean. Les six pièces portent les noms de celles du bonhomme en blocs (../../Avatar.ts) et pivotent
// aux mêmes articulations (cou, hanches, épaules) : la marche (`walkPose`) les anime de la même façon.
import { BONHOMME as C, OEIL } from './couleurs';
import { devant, fuseau, parFace, pave, peindrePersonnage, pose, repere, yeux, type Anneau, type FacettesDePersonnage, type Piece, type Pot, type Trace } from './peint';

/** Sa taille, en blocs, et la hauteur de sa tête (1/5,5). */
export const TAILLE_DU_BONHOMME = 2;
export const TETE_DU_BONHOMME = 1 / 5.5;
const COU = TAILLE_DU_BONHOMME * (1 - TETE_DU_BONHOMME);
/** Les hanches : les jambes 5 % plus courtes qu'au premier dessin (0,92). */
const HANCHES = 0.874;
const EPAULES = 1.56;
/** Les bras s'écartent du corps de 7° ; le poignet tombe en haut de la cuisse. */
const ECART_DES_BRAS = (7 * Math.PI) / 180;
/** La tête et les cheveux : du premier dessin (tête au sixième), agrandis vers le bas depuis le sommet. */
const K = TETE_DU_BONHOMME * 6;
const hy = (y: number) => TAILLE_DU_BONHOMME - (TAILLE_DU_BONHOMME - y) * K;
const LARGE = 1.06;

const jambe =
  (x: number): Piece['dessiner'] =>
  (T, pot) => {
    const profil: Anneau[] = [
      [0, 0.075, 0.12, -0.035],
      [0.1, 0.07, 0.1, -0.025],
      [0.12, 0.075, 0.075],
      [HANCHES, 0.085, 0.085],
    ];
    const chaussure = pot(C.chaussures, 'tenue');
    const jean = pot(C.jean, 'tenue');
    fuseau(T, profil, 6, parFace((k) => (k === 0 ? chaussure : jean)), { x, haut: false });
  };

const bras =
  (cote: -1 | 1): Piece['dessiner'] =>
  (T, pot) => {
    // Dans le repère de l'épaule, tourné vers le dehors : la main, le poignet, la manche.
    const profil: Anneau[] = [
      [-0.83, 0.042],
      [-0.69, 0.045],
      [-0.675, 0.058],
      [0.02, 0.062],
    ];
    const peau = pot(C.peau, 'dominante');
    const veste = pot(C.veste, 'tenue');
    fuseau(pose(T, repere([cote * 0.255, EPAULES, 0], 0, 0, cote * ECART_DES_BRAS)), profil, 5, parFace((k) => (k === 0 ? peau : veste)));
  };

function corps(T: Trace, pot: Pot): void {
  const veste = pot(C.veste, 'tenue');
  fuseau(
    T,
    [
      [0.86, 0.195, 0.125],
      [1.06, 0.19, 0.12],
      [1.46, 0.215, 0.13],
      [1.62, 0.11, 0.085],
    ],
    8,
    veste,
  );
  // La capuche, rabattue derrière le cou.
  fuseau(
    T,
    [
      [1.52, 0.13, 0.07, 0.09],
      [1.62, 0.12, 0.08, 0.1],
      [1.66, 0.06, 0.04, 0.1],
    ],
    6,
    veste,
  );
  // La besace à la hanche gauche, son rabat Sable (qui se voit de face et de trois quarts), et la sangle en travers
  // de la poitrine, de l'épaule droite à la hanche gauche.
  const sac = pot(C.sac, 'outil');
  pave(T, -0.31, 0.72, -0.14, -0.18, 0.96, 0.04, sac);
  pave(T, -0.315, 0.85, -0.147, -0.175, 0.97, 0.046, pot(C.rabat, 'outil'));
  pave(pose(T, repere([0, 1.24, 0], 0, 0, -0.52)), -0.02, -0.34, -0.136, 0.02, 0.3, -0.108, sac);
}

const TETE: Anneau[] = [
  [COU, 0.085 * LARGE, 0.08 * LARGE],
  [hy(1.72), 0.135 * LARGE, 0.125 * LARGE],
  [hy(1.9), 0.14 * LARGE, 0.13 * LARGE],
  [hy(1.96), 0.125 * LARGE, 0.115 * LARGE],
];

function tete(T: Trace, pot: Pot): void {
  const peau = pot(C.peau, 'dominante');
  const cheveux = pot(C.cheveux, 'dominante');
  // La tête : le visage devant ; l'arrière du crâne et le dessus sont peints en cheveux (faces 1 à 3 : l'arrière).
  fuseau(T, TETE, 6, parFace((k, j) => (k === 2 || (k === 1 && j >= 1 && j <= 3) ? cheveux : peau)), { haut: false });
  // Les cheveux : une calotte et des mèches en bataille qui ne dépassent pas les deux blocs.
  fuseau(
    T,
    [
      [hy(1.87), 0.148 * LARGE, 0.138 * LARGE, 0.008],
      [hy(1.94), 0.14 * LARGE, 0.13 * LARGE, 0.008],
      [hy(1.975), 0.08 * LARGE, 0.075 * LARGE, 0.008],
    ],
    6,
    cheveux,
    { bas: false },
  );
  const meche: Anneau[] = [
    [0, 0.035],
    [0.045, 0],
  ];
  const meches: [number, number, number, number, number][] = [
    [0, 1.955, 0.01, 0, 0],
    [-0.07, 1.93, -0.1, -0.7, 0.3],
    [0.06, 1.935, -0.11, -0.8, -0.2],
    [0.01, 1.93, 0.1, 0.8, 0],
    [0.12, 1.91, 0.01, 0, -0.9],
  ];
  for (const [x, y, z, rx, rz] of meches) fuseau(pose(T, repere([x * LARGE, hy(y), z * LARGE], rx, 0, rz)), meche, 3, cheveux);
  // Les oreilles.
  for (const s of [-1, 1])
    fuseau(
      T,
      [
        [hy(1.76), 0.02, 0.03],
        [hy(1.84), 0.02, 0.03],
      ],
      3,
      peau,
      { x: s * 0.14 * LARGE },
    );
  const y = hy(1.8);
  const face = devant(TETE, 6, y);
  yeux(T, pot(OEIL, 'yeux'), 0, y, face.z, 0.048, 0.028);
}

/** Les six pièces du bonhomme, de mêmes noms que celles du bonhomme en blocs. */
export const PIECES_DU_BONHOMME: Piece[] = [
  { nom: 'tete', pivot: [0, COU, 0], dessiner: tete },
  { nom: 'corps', pivot: [0, HANCHES, 0], dessiner: corps },
  { nom: 'bras-gauche', pivot: [-0.255, EPAULES, 0], dessiner: bras(-1) },
  { nom: 'bras-droit', pivot: [0.255, EPAULES, 0], dessiner: bras(1) },
  { nom: 'jambe-gauche', pivot: [-0.1, HANCHES, 0], dessiner: jambe(-0.1) },
  { nom: 'jambe-droite', pivot: [0.1, HANCHES, 0], dessiner: jambe(0.1) },
];

let cache: FacettesDePersonnage | null = null;

/** Le bonhomme en facettes (calculé une fois). */
export function bonhommePeint(): FacettesDePersonnage {
  cache ??= peindrePersonnage(PIECES_DU_BONHOMME);
  return cache;
}
