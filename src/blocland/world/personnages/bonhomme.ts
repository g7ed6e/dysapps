// Le bonhomme d'Archipéo en facettes peintes (lot R6) : l'avatar de l'élève, un collégien explorateur à la silhouette
// neutre, deux blocs de haut, la tête au sixième de sa taille. Cheveux courts en bataille, veste à capuche, sac de cuir
// à rabat sur le dos, jean. Les six pièces portent les noms de celles du bonhomme en blocs (../../Avatar.ts) et pivotent
// aux mêmes articulations (cou, hanches, épaules) : la marche (`walkPose`) les anime de la même façon.
import { BONHOMME as C, OEIL } from './couleurs';
import { devant, fuseau, parFace, pave, peindrePersonnage, pose, repere, yeux, type Anneau, type FacettesDePersonnage, type Piece, type Pot, type Trace } from './peint';

/** Sa taille, en blocs, et la hauteur de sa tête (un sixième). */
export const TAILLE_DU_BONHOMME = 2;
const COU = TAILLE_DU_BONHOMME * (5 / 6);
const HANCHES = 0.92;
const EPAULES = 1.6;

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
    const x = cote * 0.255;
    const profil: Anneau[] = [
      [0.9, 0.042, 0.042, 0, cote * 0.02],
      [1.045, 0.045, 0.045, 0, cote * 0.016],
      [1.06, 0.058, 0.058, 0, cote * 0.015],
      [1.62, 0.062],
    ];
    const peau = pot(C.peau, 'dominante');
    const veste = pot(C.veste, 'tenue');
    fuseau(T, profil, 5, parFace((k) => (k === 0 ? peau : veste)), { x });
  };

function corps(T: Trace, pot: Pot): void {
  const veste = pot(C.veste, 'tenue');
  fuseau(
    T,
    [
      [0.9, 0.195, 0.125],
      [1.1, 0.19, 0.12],
      [1.5, 0.215, 0.13],
      [1.65, 0.11, 0.085],
    ],
    8,
    veste,
  );
  // La capuche, rabattue derrière le cou.
  fuseau(
    T,
    [
      [1.56, 0.13, 0.07, 0.09],
      [1.66, 0.12, 0.08, 0.1],
      [1.7, 0.06, 0.04, 0.1],
    ],
    6,
    veste,
  );
  // Le sac sur le dos, son rabat, et la sangle en travers de la poitrine.
  pave(T, -0.13, 1.02, 0.1, 0.13, 1.44, 0.25, pot(C.sac, 'outil'));
  pave(T, -0.135, 1.3, 0.095, 0.135, 1.46, 0.265, pot(C.rabat, 'outil'));
  pave(pose(T, repere([0, 1.27, 0], 0, 0, -0.52)), -0.02, -0.32, -0.136, 0.02, 0.32, -0.108, pot(C.sac, 'outil'));
}

const TETE: Anneau[] = [
  [COU, 0.085, 0.08],
  [1.72, 0.135, 0.125],
  [1.9, 0.14, 0.13],
  [1.96, 0.125, 0.115],
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
      [1.87, 0.148, 0.138, 0.008],
      [1.94, 0.14, 0.13, 0.008],
      [1.975, 0.08, 0.075, 0.008],
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
  for (const [x, y, z, rx, rz] of meches) fuseau(pose(T, repere([x, y, z], rx, 0, rz)), meche, 3, cheveux);
  // Les oreilles.
  for (const s of [-1, 1])
    fuseau(
      T,
      [
        [1.76, 0.02, 0.03],
        [1.84, 0.02, 0.03],
      ],
      3,
      peau,
      { x: s * 0.14 },
    );
  const face = devant(TETE, 6, 1.8);
  yeux(T, pot(OEIL, 'yeux'), 0, 1.8, face.z, 0.045, 0.026);
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
