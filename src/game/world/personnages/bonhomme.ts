// Le bonhomme d'Archipéo en facettes peintes (lot R6) : l'avatar de l'élève, un collégien explorateur à la silhouette
// neutre, deux blocs de haut, la tête à 1/5,5 de sa taille (un collégien, pas un adulte : tête un peu forte, jambes
// courtes, poignets en haut des cuisses, bras légèrement écartés). Cheveux courts en bataille, veste à capuche, sac à
// dos de cuir (la planche maître), en volume : ses deux bretelles de cuir sombre se voient de face, le sac de trois quarts
// face, son rabat Sable de trois quarts et de dos. Jean délavé clair. Les six pièces portent les noms de celles du bonhomme en blocs (../../Avatar.ts) et pivotent aux mêmes
// articulations (cou, hanches, épaules) : la marche (`walkPose`) les anime de la même façon.
import { BONHOMME as C, OEIL } from './couleurs';
import { devant, fuseau, parFace, pave, peindrePersonnage, pose, repere, yeux, type Anneau, type FacettesDePersonnage, type Peindre, type Piece, type Pot, type Trace } from './peint';

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

/** Le torse (la veste), sur lequel passent les bretelles. */
const TORSE: Anneau[] = [
  [0.86, 0.195, 0.125],
  [1.06, 0.19, 0.12],
  [1.46, 0.215, 0.13],
  [1.62, 0.11, 0.085],
];

/** Une sangle à plat (largeur `l`, épaisseur `e`), en tronçons droits le long d'une ligne `[y, z]` tracée en `x`. */
function sangle(T: Trace, x: number, ligne: [number, number][], l: number, e: number, peindre: Peindre): void {
  for (let i = 0; i + 1 < ligne.length; i++) {
    const [[y0, z0], [y1, z1]] = [ligne[i], ligne[i + 1]];
    const long = Math.hypot(y1 - y0, z1 - z0);
    pave(pose(T, repere([x, y0, z0], Math.atan2(z1 - z0, y1 - y0), 0, 0)), -l / 2, 0, -e / 2, l / 2, long, e / 2, peindre);
  }
}

function corps(T: Trace, pot: Pot): void {
  const veste = pot(C.veste, 'tenue');
  fuseau(T, TORSE, 8, veste);
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
  // Le sac à dos de cuir, en volume (DA-6) : plus large et plus profond que le dos, il déborde du torse et se lit de
  // trois quarts face ; deux poches sur ses flancs ; son rabat Sable en couvre le haut (de trois quarts et de dos).
  const sac = pot(C.sac, 'outil');
  pave(T, -0.2, 0.94, 0.11, 0.2, 1.46, 0.4, sac);
  for (const c of [-1, 1]) pave(T, c > 0 ? 0.2 : -0.25, 1.0, 0.17, c > 0 ? 0.25 : -0.2, 1.24, 0.35, sac);
  pave(T, -0.206, 1.3, 0.104, 0.206, 1.5, 0.412, pot(C.rabat, 'outil'));
  // Les deux bretelles de cuir sombre (0,06 bloc de large) : du bas de la poitrine, par-dessus l'épaule, jusqu'au haut
  // du sac. Plus de Sable devant : aucune bande claire au milieu du torse.
  const bretelles = pot(C.bretelles, 'outil');
  const avant = (y: number): [number, number] => [y, devant(TORSE, 8, y).z - 0.004];
  for (const c of [-1, 1]) sangle(T, c * 0.09, [avant(1.18), avant(1.46), [1.625, -0.02], [1.5, 0.12]], 0.06, 0.03, bretelles);
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
const PIECES_DU_BONHOMME: Piece[] = [
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
