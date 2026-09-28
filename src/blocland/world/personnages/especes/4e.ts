// Les habitants des Anciens Ateliers (4e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique. Braise porte une braise sur la poitrine, qui brille la nuit.
import type { BiomeId } from '../../../biomes';
import { TENUE } from '../couleurs';
import { devantDeLaTete, disque, manche, pointe, type Espece } from '../gabarit';
import { fuseau, pave, pose, repere, type Anneau } from '../peint';

/** Le devant de la tête du gabarit, en son milieu (la lentille d'Ixe s'y pose). */
const FACE = 2.26;
const LENTILLE: Anneau[] = [
  [0, 0.16],
  [0.06, 0.14],
];

export const ESPECES_4E = {
  forge: {
    nom: 'Braise',
    metier: 'forgeron',
    gabarit: 'trapu',
    dominante: 0x4a4648,
    marque: { couleur: 0x7a7674, ou: ['visage'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.37, profondeur: 0.3, tete: 0.3 },
    lueur: {
      nom: 'braise',
      sur: 'corps',
      couleur: 0xe8783a,
      dessiner: (T, k) =>
        fuseau(
          pose(T, repere([0, 1.62, -0.24], Math.PI / 2, 0, 0)),
          [
            [-0.08, 0],
            [0, 0.09],
            [0.04, 0],
          ],
          4,
          k.lueur,
        ),
    },
    outil: {
      pose: [-0.4, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.1, 0.5, 0.03, k.bois);
        pave(T, -0.14, 0.45, -0.07, 0.14, 0.6, 0.07, k.fer);
      },
    },
  },
  atelier: {
    nom: 'Ixe',
    metier: 'automate dessinateur',
    dominante: 0xc9a24a,
    marque: { couleur: 0xe0dccb, ou: [] },
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    surTete: (T, k) => {
      // La tête-lentille : un verre clair, où se posent les yeux.
      fuseau(pose(T, repere([0, FACE, devantDeLaTete(FACE) + 0.01], -Math.PI / 2, 0, 0)), LENTILLE, 6, k.marque);
    },
    yeux: { y: FACE, ecart: 0.06, taille: 0.04, z: devantDeLaTete(FACE) + 0.01 - 0.06 },
    coiffe: (T, k) => {
      // L'antenne, et son voyant.
      manche(T, 2.45, 2.66, 0.02, k.fer, 3);
      disque(T, 2.68, 0.05, 0.04, k.fer, 5);
    },
    corps: (T, k) => {
      // Les rouages des épaules, qui débordent : un automate.
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.43, 1.76, 0], Math.PI / 2, 0, 0)), 0, 0.17, 0.08, k.dom, 8);
    },
    outil: {
      // Le compas.
      pose: [0, 0, 0.1],
      dessiner: (T, k) => {
        for (const c of [-1, 1]) pave(pose(T, repere([0, 0.3, 0], 0, 0, c * 0.2)), -0.012, -0.4, -0.012, 0.012, 0, 0.012, k.fer);
        disque(T, 0.3, 0.035, 0.04, k.fer);
      },
    },
    autreMain: {
      // L'équerre.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.02, -0.05, -0.015, 0.02, 0.35, 0.015, k.bois);
        pave(T, -0.26, -0.05, -0.015, 0.02, -0.01, 0.015, k.bois);
      },
    },
  },
  falaise: {
    nom: 'Cléa',
    metier: 'cordière',
    gabarit: 'elance',
    dominante: 0xe6e0d2,
    marque: { couleur: 0x8a7a62, ou: [] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.14, r: 0.09 },
    coiffe: (T, k) => {
      // Les cornes (0,3 bloc), qui montent, s'écartent et se recourbent vers l'arrière, et les oreilles.
      for (const c of [-1, 1]) {
        fuseau(
          pose(T, repere([c * 0.12, 2.42, 0.02], 0.55, 0, -c * 0.45)),
          [
            [0, 0.065, 0.06],
            [0.14, 0.05, 0.045, 0.03],
            [0.26, 0.032, 0.03, 0.09],
            [0.34, 0, 0, 0.17],
          ],
          4,
          k.marque,
        );
        pointe(T, [c * 0.26, 2.3, 0], 0.04, 0.13, k.dom, [0, 0, -c * 1.3], 3);
      }
    },
    surTete: (T, k) => pointe(T, [0, 2.16, -0.2], 0.04, 0.14, k.marque, [Math.PI, 0, 0], 3),
    corps: (T, k) =>
      // La corde en bandoulière.
      fuseau(
        pose(T, repere([0, 1.4, 0], 0, 0, -0.6)),
        [
          [-0.035, 0.34, 0.28],
          [0.035, 0.34, 0.28],
        ],
        6,
        k.lin,
        { bas: false, haut: false },
      ),
    outil: {
      // Le piolet.
      pose: [-0.3, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.1, 0.6, 0.026, k.bois);
        pave(T, -0.03, 0.55, -0.025, 0.14, 0.61, 0.025, k.fer);
        pointe(T, [0, 0.58, 0], 0.03, 0.18, k.fer, [0, 0, Math.PI / 2 + 0.3]);
      },
    },
  },
  cabinet: {
    nom: 'Plume',
    metier: 'archiviste',
    dominante: 0x2a3040,
    marque: { couleur: 0xe8e6e0, ou: ['ventre', 'visage'] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    silhouette: { jambe: 0.05, jambes: 0.55 },
    museau: { forme: 'bec', long: 0.16, r: 0.05, y: 2.2 },
    corps: (T, k) =>
      fuseau(
        pose(T, repere([0, 0.85, 0.2], 2.3, 0, 0)),
        [
          [0, 0.08, 0.02],
          [0.55, 0.1, 0.015],
        ],
        4,
        k.dom,
      ),
    outil: {
      // Le casier de fiches.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.16, -0.06, -0.14, 0.16, 0.2, 0.14, k.bois);
        pave(T, -0.13, -0.02, -0.15, 0.13, 0.16, -0.12, k.lin);
      },
    },
  },
  theatre: {
    nom: 'Puck',
    metier: 'souffleur',
    dominante: 0x4e7a4a,
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    silhouette: { largeur: 0.27, profondeur: 0.23 },
    coiffe: (T, k) => {
      // Un béret à plat, penché (un souffleur de théâtre, pas un lutin), et deux oreilles rondes basses.
      fuseau(
        pose(T, repere([0.03, 2.47, 0], 0, 0, -0.18)),
        [
          [0, 0.27, 0.26],
          [0.06, 0.31, 0.3],
          [0.12, 0.12, 0.12],
        ],
        6,
        k.tenue,
      );
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.3, 2.3, 0.02], 0, 0, Math.PI / 2)), 0, 0.075, 0.035, k.dom, 5);
    },
    outil: { pose: [0, 0, Math.PI / 2], dessiner: (T, k) => manche(T, -0.32, 0.32, 0.055, k.lin, 5) },
    autreBras: { rx: 0.5, rz: 0.15 },
    autreMain: {
      // Le cornet, le pavillon tourné vers le dehors : il se voit de face.
      pose: [0, 0, 1.25],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.04, 0.035],
            [0.28, 0.15],
          ],
          6,
          k.laiton,
        ),
    },
  },
  gare: {
    nom: 'Vapeur',
    metier: 'chef de gare',
    dominante: 0x6e6e70,
    marque: { couleur: 0xd8d4cc, ou: ['visage', 'museau'] },
    tenue: { couleur: 0xa8443a, vetements: ['gilet'] },
    // Un blaireau : large d'épaules, la tête large sous la casquette.
    silhouette: { largeur: 0.37, profondeur: 0.28, ventre: 0.04, tete: 0.32 },
    museau: { forme: 'museau', long: 0.14, r: 0.08 },
    coiffe: (T, k) => {
      // La casquette et sa visière, qui dépasse de 0,1 bloc de chaque côté (ce qui la distingue de Plume).
      disque(T, 2.54, 0.3, 0.1, k.tenue, 8);
      pave(T, -0.4, 2.48, -0.42, 0.4, 2.52, -0.16, k.fer);
    },
    outil: {
      // La lanterne de signal.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.06, 0.02, 0.015, k.fer, 3);
        pave(T, -0.08, -0.26, -0.08, 0.08, -0.06, 0.08, k.laiton);
        pave(T, -0.085, -0.22, -0.085, 0.085, -0.1, 0.085, k.lin);
      },
    },
  },
  jardin: {
    // L'écureuil cuisinier du Jardin des heures (DA, LV2-4) : pelage châtain (pas le roux de Rouxel), une queue en
    // panache haute qui dépasse de la tête, un tablier crème uni, une louche de bois ; pas de toque.
    nom: 'Muscade',
    metier: 'cuisinier',
    dominante: 0x8a4a26,
    marque: { couleur: 0xb07a52, ou: ['museau'] },
    tenue: { couleur: 0xe2d6b8, vetements: ['tablier'] },
    silhouette: { largeur: 0.29, profondeur: 0.24 },
    museau: { forme: 'museau', long: 0.1, r: 0.08 },
    coiffe: (T, k) => {
      // Deux oreilles droites et pointues (les pinceaux de l'écureuil).
      for (const c of [-1, 1]) pointe(T, [c * 0.15, 2.4, 0.04], 0.07, 0.24, k.dom, [0, 0, -c * 0.18], 4);
    },
    corps: (T, k) =>
      // La queue en panache : elle part du bas du dos, s'épaissit et monte derrière l'épaule gauche jusqu'au-dessus de
      // la tête, son bout recourbé vers l'avant ; décalée sur le côté, elle se voit de face.
      fuseau(
        T,
        [
          [0.7, 0.07, 0.07, 0.3, -0.08],
          [1.05, 0.15, 0.13, 0.44, -0.14],
          [1.55, 0.2, 0.16, 0.5, -0.2],
          [2.05, 0.2, 0.16, 0.48, -0.24],
          [2.42, 0.15, 0.12, 0.38, -0.26],
          [2.64, 0, 0, 0.22, -0.26],
        ],
        6,
        k.dom,
      ),
    outil: {
      // La louche de bois, le cuilleron vers le haut.
      pose: [-0.2, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.08, 0.46, 0.022, k.bois);
        fuseau(
          T,
          [
            [0.44, 0.03],
            [0.49, 0.1],
            [0.56, 0.11],
          ],
          6,
          k.bois,
          { haut: false },
        );
      },
    },
  },
} satisfies Partial<Record<BiomeId, Espece>>;
