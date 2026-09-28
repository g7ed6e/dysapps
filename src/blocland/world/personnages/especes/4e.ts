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

export const ESPECES_4E: Partial<Record<BiomeId, Espece>> = {
  forge: {
    nom: 'Braise',
    metier: 'forgeron',
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
    coiffe: (T, k) => pointe(T, [0, 2.48, 0], 0.03, 0.2, k.fer, [0, 0, 0], 3),
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
    dominante: 0xe6e0d2,
    marque: { couleur: 0x8a7a62, ou: [] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.14, r: 0.09 },
    coiffe: (T, k) => {
      // Les cornes, recourbées vers l'arrière, et les oreilles.
      for (const c of [-1, 1]) {
        fuseau(
          pose(T, repere([c * 0.1, 2.46, 0.02], 0.9, 0, -c * 0.2)),
          [
            [0, 0.05],
            [0.12, 0.04, 0.04, 0.04],
            [0.24, 0, 0, 0.1],
          ],
          4,
          k.marque,
        );
        pointe(T, [c * 0.26, 2.34, 0], 0.04, 0.13, k.dom, [0, 0, -c * 1.3], 3);
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
    coiffe: (T, k) => {
      // Le bonnet pointu, et les oreilles pointues.
      fuseau(
        T,
        [
          [2.4, 0.3, 0.27],
          [2.48, 0.25, 0.22],
          [2.68, 0, 0, 0.1],
        ],
        5,
        k.tenue,
      );
      for (const c of [-1, 1]) pointe(T, [c * 0.27, 2.3, 0], 0.05, 0.16, k.dom, [0, 0, -c * 1.2], 3);
    },
    outil: { pose: [0, 0, Math.PI / 2], dessiner: (T, k) => manche(T, -0.2, 0.2, 0.05, k.lin, 5) },
    autreMain: {
      // Le cornet.
      pose: [-1.2, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [0, 0.025],
            [0.28, 0.1],
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
    museau: { forme: 'museau', long: 0.14, r: 0.08 },
    coiffe: (T, k) => {
      // La casquette et sa visière.
      disque(T, 2.54, 0.25, 0.09, k.tenue, 8);
      pave(T, -0.14, 2.49, -0.36, 0.14, 2.52, -0.18, k.fer);
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
};
