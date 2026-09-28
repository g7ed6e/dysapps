// Les habitants des Premiers Rivages (6e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après
// l'intention du directeur artistique. Budget serré : dix îles pour 2 500 triangles.
import type { BiomeId } from '../../../biomes';
import { SABLE } from '../../palette';
import { TENUE } from '../couleurs';
import { disque, jalon, manche, pointe, type Espece } from '../gabarit';
import { devant, fuseau, parFace, pave, pose, repere, type Anneau } from '../peint';

const BOSSE: Anneau[] = [
  [2.4, 0.085],
  [2.54, 0.08],
  [2.62, 0],
];

export const ESPECES_6E: Partial<Record<BiomeId, Espece>> = {
  foret: {
    nom: 'Mousso',
    metier: 'charpentier',
    dominante: 0x4c7a3b,
    marque: { couleur: 0x8a887e, ou: ['ventre'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.36, profondeur: 0.29, tete: 0.3, teteProfondeur: 0.26 },
    coiffe: (T, k) => {
      pointe(T, [-0.05, 2.47, 0], 0.05, 0.14, k.dom, [0.3, 0, 0.4]);
      pointe(T, [0.06, 2.47, 0.02], 0.045, 0.12, k.dom, [-0.2, 0, -0.5]);
    },
    outil: {
      pose: [-0.5, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.12, 0.55, 0.03, k.bois);
        pave(T, -0.15, 0.5, -0.09, 0.15, 0.7, 0.09, k.bois);
      },
    },
  },
  mine: {
    nom: 'Tunel',
    metier: 'mineur',
    dominante: 0x7a5236,
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    silhouette: { ventre: 0.04 },
    museau: { forme: 'museau', long: 0.2, r: 0.08 },
    yeux: { taille: 0.036, ecart: 0.09 },
    coiffe: (T, k) => {
      // Le casque de mineur et sa lampe.
      fuseau(
        T,
        [
          [2.36, 0.255, 0.235],
          [2.5, 0.24, 0.22],
          [2.6, 0.13, 0.12],
        ],
        6,
        k.laiton,
      );
      pave(T, -0.05, 2.43, -0.26, 0.05, 2.53, -0.19, k.fer);
    },
    outil: {
      pose: [-0.3, 0, 0.3],
      dessiner: (T, k) => {
        manche(T, -0.12, 0.72, 0.03, k.bois);
        pointe(T, [0, 0.68, 0], 0.045, 0.3, k.fer, [0, 0, -Math.PI / 2 - 0.25]);
        pointe(T, [0, 0.68, 0], 0.045, 0.3, k.fer, [0, 0, Math.PI / 2 + 0.25]);
      },
    },
  },
  carriere: {
    nom: 'Rouxel',
    metier: 'tailleur de pierre',
    dominante: 0xb8662e,
    marque: { couleur: 0xe6d8c0, ou: ['poitrine', 'museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.24, r: 0.09 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.13, 2.44, 0.03], 0.07, 0.2, k.dom, [0, 0, -c * 0.25]);
    },
    corps: (T, k) => {
      // La queue touffue, au bout clair.
      fuseau(
        pose(T, repere([0, 0.75, 0.22], 1.9, 0, 0)),
        [
          [0, 0.05],
          [0.22, 0.12],
          [0.48, 0],
        ],
        5,
        parFace((s) => (s === 1 ? k.marque : k.dom)),
      );
    },
    outil: {
      pose: [-0.4, 0, 0.1],
      dessiner: (T, k) => {
        manche(T, -0.06, 0.42, 0.028, k.bois);
        pave(T, -0.1, 0.38, -0.07, 0.1, 0.52, 0.07, k.fer);
      },
    },
    autreMain: { pose: [-0.6, 0, 0], dessiner: (T, k) => manche(T, -0.04, 0.3, 0.024, k.fer) },
  },
  ferme: {
    nom: 'Bloquette',
    metier: 'fermière',
    dominante: 0xe6e0d2,
    marque: { couleur: 0x3a3430, ou: ['museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.38, profondeur: 0.32, ventre: 0.03, tete: 0.25, teteProfondeur: 0.23 },
    museau: { forme: 'museau', long: 0.1, r: 0.1, y: 2.12 },
    coiffe: (T, k) => {
      // Le toupet de laine, les oreilles sombres.
      fuseau(
        T,
        [
          [2.46, 0.14],
          [2.56, 0.1],
          [2.6, 0],
        ],
        5,
        k.dom,
      );
      for (const c of [-1, 1]) pointe(T, [c * 0.2, 2.34, 0], 0.04, 0.14, k.marque, [0, 0, -c * 1.3], 3);
    },
    outil: {
      pose: [0, 0, 0.08],
      dessiner: (T, k) => {
        manche(T, -1.1, 0.75, 0.026, k.bois);
        pave(T, -0.2, 0.7, -0.03, 0.2, 0.78, 0.03, k.bois);
      },
    },
    autreMain: {
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.22, 0.12],
            [0, 0.17],
          ],
          6,
          k.bois,
          { haut: false },
        ),
    },
  },
  tour: {
    nom: 'Grimoire',
    metier: 'relieur copiste',
    dominante: 0x6e6a86,
    marque: { couleur: 0x4c4866, ou: [] },
    tenue: { couleur: TENUE.lin, vetements: ['robe'] },
    museau: { forme: 'museau', long: 0.08, r: 0.09 },
    corps: (T, k) => {
      // La carapace, sur le dos.
      fuseau(
        pose(T, repere([0, 1.25, 0.12], Math.PI / 2, 0, 0)),
        [
          [0, 0.34, 0.44],
          [0.14, 0.3, 0.4],
          [0.24, 0],
        ],
        6,
        k.marque,
      );
    },
    outil: {
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.045, -0.05, -0.16, 0.045, 0.37, 0.16, k.bois);
        pave(T, -0.036, -0.035, -0.172, 0.036, 0.355, 0.14, k.lin);
      },
    },
  },
  plaine: {
    nom: 'Coco',
    metier: 'arpenteuse',
    dominante: 0xa8443a,
    marque: { couleur: 0x2e2a28, ou: ['ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['elytres', 'ceinture'] },
    silhouette: { largeur: 0.36, profondeur: 0.3, ventre: 0.04 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.07, 2.47, -0.02], 0.02, 0.22, k.marque, [-0.3, 0, -c * 0.35], 3);
    },
    outil: { pose: [0, 0, 0], dessiner: (T, k) => jalon(T, -1.12, 0.9, 0.028, 4, k.bois, k.lin) },
  },
  riviere: {
    nom: 'Nénu',
    metier: 'passeuse',
    dominante: 0x6f8f3e,
    tenue: { couleur: SABLE, vetements: ['cire'] },
    silhouette: { tete: 0.33, teteProfondeur: 0.23, jambe: 0.11 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) fuseau(T, BOSSE, 5, k.dom, { x: c * 0.17, z: -0.05 });
    },
    yeux: { y: 2.5, ecart: 0.17, taille: 0.036, z: devant(BOSSE, 5, 2.5, -0.05).z },
    outil: { pose: [0.05, 0, -0.1], dessiner: (T, k) => manche(T, -1.12, 1.4, 0.028, k.bois) },
  },
  volcan: {
    nom: 'Lavi',
    metier: 'fondeuse',
    dominante: 0xc8702e,
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { tete: 0.26, teteProfondeur: 0.27 },
    museau: { forme: 'museau', long: 0.12, r: 0.1 },
    corps: (T, k) =>
      fuseau(
        pose(T, repere([0, 0.7, 0.22], 2.2, 0, 0)),
        [
          [0, 0.1],
          [0.3, 0.07],
          [0.55, 0],
        ],
        5,
        k.dom,
      ),
    outil: {
      pose: [-0.9, 0, 0],
      dessiner: (T, k) => {
        for (const c of [-1, 1]) pave(pose(T, repere([0, 0, 0], 0, 0, c * 0.06)), -0.02, -0.05, -0.02, 0.02, 0.8, 0.02, k.fer);
      },
    },
  },
  baie: {
    nom: 'Robin',
    metier: 'amarreur',
    dominante: 0x70563f,
    marque: { couleur: 0xc8703a, ou: ['poitrine'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    silhouette: { largeur: 0.36, profondeur: 0.3, ventre: 0.06, jambe: 0.05, jambes: 0.55 },
    museau: { forme: 'bec', long: 0.12, r: 0.05, y: 2.2 },
    corps: (T, k) => {
      // Le cordage à l'épaule, en travers du torse, et la queue.
      fuseau(
        pose(T, repere([0, 1.4, 0], 0, 0, 0.6)),
        [
          [-0.035, 0.39, 0.33],
          [0.035, 0.39, 0.33],
        ],
        6,
        k.lin,
        { bas: false, haut: false },
      );
      fuseau(
        pose(T, repere([0, 0.8, 0.24], 2.0, 0, 0)),
        [
          [0, 0.1, 0.02],
          [0.3, 0.14, 0.015],
        ],
        4,
        k.dom,
      );
    },
    outil: { pose: [Math.PI / 2, 0, 0], dessiner: (T, k) => disque(T, 0, 0.17, 0.08, k.lin) },
  },
  horloge: {
    nom: 'Tick',
    metier: 'horloger',
    dominante: 0x6e5a48,
    marque: { couleur: 0xd8c8a8, ou: ['museau', 'visage'] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.2, r: 0.08 },
    corps: (T, k) => {
      // Les piquants du dos.
      const piquants: [number, number, number, number, number][] = [
        [-0.15, 1.6, 0.22, 1.2, 0.3],
        [0.15, 1.6, 0.22, 1.2, -0.3],
        [0, 1.3, 0.26, 1.4, 0],
        [0, 1.85, 0.16, 1.0, 0],
      ];
      for (const [x, y, z, rx, rz] of piquants) pointe(T, [x, y, z], 0.07, 0.2, k.dom, [rx, 0, rz], 3);
    },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.1, 2.44, 0.1], 0.06, 0.16, k.dom, [0.8, 0, -c * 0.3], 3);
    },
    outil: {
      pose: [-0.2, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.02, 0.2, 0.024, k.bois);
        disque(pose(T, repere([0, 0.31, 0], Math.PI / 2, 0, 0)), 0, 0.11, 0.03, k.laiton, 8);
      },
    },
    autreMain: { pose: [Math.PI / 2, 0, 0], dessiner: (T, k) => disque(T, 0.02, 0.14, 0.08, k.laiton, 8) },
  },
};
