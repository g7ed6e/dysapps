// Les habitants des Anciens Ateliers (4e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique. Braise porte une braise sur la poitrine, qui brille la nuit.
import type { BiomeId } from '../../../biomes';
import { TENUE } from '../colors';
import { devantDeLaTete, disque, manche, pointe, type Espece } from '../template';
import { fuseau, pave, pose, repere, type Anneau } from '../painted';

/** Le devant de la tête du gabarit, en son milieu (la lentille d'Ixe s'y pose). */
const FACE = 2.26;
const LENTILLE: Anneau[] = [
  [0, 0.16],
  [0.06, 0.14],
];

export const ESPECES_4E = {
  'maths-4e-powers': {
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
  'maths-4e-algebra': {
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
  'french-4e-agreement': {
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
  'french-4e-vocabulary': {
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
  'english-4e-comprehension': {
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
  'english-4e-grammar': {
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
  'lv2-4e-daily-life': {
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
  // Les habitants d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict
  // nécessaire (budget de l'archipel). Typo est une souris imprimeuse, Fret un crabe grutier (DA, HG-3).
  'history-4e-revolutions': {
    nom: 'Typo',
    metier: 'imprimeuse',
    dominante: 0x8c8a86,
    marque: { couleur: 0xe0a0a8, ou: ['museau'] },
    tenue: { couleur: 0x2e2622, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.16, r: 0.06 },
    // Mince, les deux grandes oreilles rondes de la souris, la longue queue fine levée derrière elle : elle ne se confond
    // pas avec Muscade.
    silhouette: { largeur: 0.27, ventre: 0.01 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.27, 2.48, 0.03], Math.PI / 2, 0, 0)), 0, 0.21, 0.04, k.dom, 6);
    },
    corps: (T, k) =>
      fuseau(
        pose(T, repere([0.1, 0.75, 0.2], 0.7, 0, -0.5)),
        [
          [0, 0.04],
          [0.25, 0.035],
          [0.5, 0.03],
          [0.7, 0],
        ],
        4,
        k.marque,
      ),
    outil: {
      // Le rouleau d'encre : un manche, le rouleau sombre.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.25, 0.02, k.bois, 3);
        pave(T, -0.12, 0.25, -0.04, 0.12, 0.33, 0.04, k.fer);
      },
    },
  },
  'geography-4e-globalization': {
    nom: 'Fret',
    metier: 'grutier',
    dominante: 0xc8502e,
    marque: { couleur: 0xe8a080, ou: ['ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    // Large et plat, le casque à large bord, une grosse pince à la main gauche : il ne se confond pas avec Braise.
    silhouette: { largeur: 0.44, profondeur: 0.22, ventre: 0.02, tete: 0.33, crane: 1 },
    coiffe: (T, k) => disque(T, 2.42, 0.38, 0.06, k.laiton, 8),
    autreBras: { rz: 0.35 },
    autreMain: { pose: [0, 0, 0], dessiner: (T, k) => pointe(T, [0, -0.05, 0], 0.14, 0.35, k.dom, [Math.PI, 0, 0], 4, 0.06) },
    outil: {
      // Le crochet de la grue : un câble, le crochet de fer.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.1, 0.25, 0.012, k.fer, 3);
        pointe(T, [0, -0.1, 0], 0.05, 0.12, k.fer, [Math.PI, 0, 0], 3);
      },
    },
  },
  // Les habitants de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict nécessaire, une
  // signature chacun (budget de l'archipel). Nectar est un colibri butineur (carnet de naturaliste), Radar un suricate guetteur, Manivelle une
  // otarie maquettiste (DA, SC-3).
  'life-earth-sciences-4e-cells-evolution': {
    nom: 'Nectar',
    metier: 'naturaliste',
    dominante: 0x3a8a62,
    marque: { couleur: 0xc0708e, ou: ['poitrine'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    // Le très long bec fin du colibri.
    museau: { forme: 'bec', long: 0.5, r: 0.03, y: 2.2 },
    silhouette: { largeur: 0.26, profondeur: 0.24, tete: 0.25 },
    corps: (T, k) => {
      // Les deux ailes levées en V dans le dos.
      for (const c of [-1, 1]) pointe(T, [c * 0.18, 1.7, 0.2], 0.12, 0.75, k.dom, [0.3, 0, -c * 0.6], 3, 0.03);
    },
    outil: {
      // Une fleur cueillie : une tige de bois, la corolle de lin.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.3, 0.015, k.bois, 3);
        disque(T, 0.33, 0.09, 0.04, k.lin, 5);
      },
    },
    autreMain: {
      // Le carnet de naturaliste.
      pose: [0, 0, 0],
      dessiner: (T, k) => pave(T, -0.1, -0.12, -0.03, 0.1, 0.12, 0.03, k.cuir),
    },
  },
  'physics-chemistry-4e-signals-circuits': {
    nom: 'Radar',
    metier: 'guetteur',
    dominante: 0xc0a074,
    marque: { couleur: 0x5a4030, ou: ['visage'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    museau: { forme: 'museau', long: 0.12, r: 0.06 },
    // Le suricate debout : mince, haut sur pattes, les épaules étroites.
    silhouette: { largeur: 0.24, profondeur: 0.22, ventre: 0.04, jambes: 0.85, jambe: 0.07, tete: 0.23 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.22, 2.32, 0.04], 0, 0, Math.PI / 2)), 0, 0.07, 0.03, k.marque, 5);
    },
    corps: (T, k) => {
      // La queue, tendue jusqu'au sol derrière lui : il s'y appuie pour guetter.
      pointe(T, [0, 0.8, 0.2], 0.07, 0.84, k.dom, [2.75, 0, 0], 3);
    },
    outil: {
      // La longue-vue de laiton, levée.
      pose: [-1.1, 0, 0],
      dessiner: (T, k) => manche(T, -0.1, 0.4, 0.045, k.laiton, 5),
    },
  },
  'technology-4e-modeling': {
    nom: 'Manivelle',
    metier: 'maquettiste',
    dominante: 0x5e4c42,
    marque: { couleur: 0x8a786a, ou: ['museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.16, r: 0.08 },
    // L'otarie : un long corps fuselé, la petite tête ronde, des nageoires au sol.
    silhouette: { largeur: 0.38, profondeur: 0.3, ventre: 0.06, jambes: 0.35, jambe: 0.12, tete: 0.22, crane: 0.95 },
    corps: (T, k) => {
      // Les nageoires de derrière, à plat sur le sol, ouvertes.
      for (const c of [-1, 1]) pave(pose(T, repere([c * 0.25, 0, 0.3], 0, c * 0.5, 0)), -0.08, 0, -0.05, 0.08, 0.04, 0.38, k.dom);
    },
    outil: {
      // La coque de maquette, de bois, tenue par sa quille ; une petite manivelle de laiton sort de son flanc, l'axe puis
      // le bras qui monte (consultant d'Archipéo, relecture des captures : sans elle, rien ne la nommait).
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        fuseau(pose(T, repere([0, 0.1, 0], Math.PI / 2, 0, 0)), [[-0.22, 0], [-0.1, 0.09, 0.06], [0.14, 0.1, 0.07], [0.22, 0]], 5, k.bois);
        pave(T, 0.06, 0.085, -0.015, 0.16, 0.115, 0.015, k.laiton);
        pave(T, 0.13, 0.115, -0.015, 0.16, 0.22, 0.015, k.laiton);
      },
    },
  },
  // EMC 4e (EMC-2) : le strict nécessaire, Archipéo étant en pause. Loquet, pangolin portier : trapu, brun d'olive,
  // le museau long et fin, le dos couvert d'écailles plus sombres en rangées décalées ; sa queue large posée au sol
  // derrière lui (DA, captures emc-4e-3e-1) ; une
  // écharpe de lin, aucun uniforme ni insigne ; à la main, la grande clé de laiton de la porte (un outil, jamais une arme).
  'civics-4e-rights-freedoms': {
    nom: 'Loquet',
    metier: 'portier',
    dominante: 0x7e6440,
    marque: { couleur: 0xe0bfa0, ou: ['visage', 'ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    museau: { forme: 'museau', long: 0.2, r: 0.06 },
    // Le pangolin debout : haut sur pattes, la petite tête au crâne bas.
    silhouette: { largeur: 0.31, profondeur: 0.28, ventre: 0.08, jambes: 0.6, tete: 0.19, crane: 0.9 },
    corps: (T, k) => {
      // La queue du pangolin, large et plate, posée au sol derrière lui (DA, captures emc-4e-3e-1) : une pointe aplatie.
      pointe(T, [0, 1.0, 0.2], 0.27, 0.9, k.dom, [2.6, 0, 0], 4, 0.1);
      // Les écailles du dos, du brun du cuir, plus sombre que son pelage, en rangées décalées d'un côté à l'autre.
      for (const [y, x] of [
        [1.15, -0.1],
        [1.42, 0.1],
        [1.69, -0.1],
      ] as const)
        pave(T, x - 0.17, y, 0.24, x + 0.17, y + 0.18, 0.3, k.cuir);
    },
    outil: {
      // La grande clé de laiton : la tige, le panneton en bas, l'anneau en haut.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.36, 0.02, k.laiton, 4);
        pave(T, 0.02, -0.05, -0.015, 0.09, 0.03, 0.015, k.laiton);
        disque(pose(T, repere([0, 0.42, 0], Math.PI / 2, 0, 0)), 0, 0.07, 0.03, k.laiton, 6);
      },
    },
  },
  // Latin-grec 4e (LCA-2) : le strict nécessaire, Archipéo étant en pause. Figue, âne porteur d'eau : gris, trapu, le
  // museau clair, deux longues oreilles dressées ; une écharpe de lin ; à la main, une outre de cuir (l'eau de la
  // fontaine). Ni casque ni couronne.
  'lca-4e-cities': {
    nom: 'Figue',
    metier: 'porteur d’eau',
    dominante: 0x8c8a86,
    marque: { couleur: 0xdcd6cc, ou: ['museau', 'ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    museau: { forme: 'museau', long: 0.14, r: 0.11 },
    // L'âne : large de corps, le ventre rond, la grosse tête.
    silhouette: { largeur: 0.46, profondeur: 0.36, ventre: 0.14, jambes: 0.45, tete: 0.29, crane: 1 },
    coiffe: (T, k) => {
      // Les longues oreilles de l'âne, dressées, un peu écartées.
      for (const c of [-1, 1]) pointe(T, [c * 0.13, 2.32, 0], 0.07, 0.36, k.dom, [0, 0, -c * 0.2], 4, 0.04);
    },
    outil: {
      // L'outre de cuir, tenue par le col : la panse ronde, le col noué.
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.3, 0],
            [-0.26, 0.1],
            [-0.12, 0.14],
            [0, 0.08],
            [0.06, 0.06],
          ],
          6,
          k.cuir,
        ),
    },
  },
} satisfies Partial<Record<BiomeId, Espece>>;
