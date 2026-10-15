// Les habitants des Îles du Ciel (3e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique. Fi, l'allumeuse à tête-lanterne, n'a pas d'yeux ; sa lanterne et l'abdomen d'Astra brillent
// la nuit.
import type { BiomeId } from '../../../biomes';
import { TENUE, VERRE_DE_FI } from '../colors';
import { COU, disque, jalon, manche, pointe, SOMMET_DE_TETE, type Espece } from '../template';
import { devant, fuseau, parFace, pave, pose, repere } from '../painted';
import { tube } from '../sentinel';

export const ESPECES_3E = {
  'maths-3e-geometry': {
    nom: 'Théo',
    metier: 'géomètre',
    gabarit: 'elance',
    dominante: 0x7f93a6,
    marque: { couleur: 0xd8d2c4, ou: ['poitrine', 'museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    silhouette: { largeur: 0.27, profondeur: 0.24, jambes: 0.95, jambe: 0.04, tete: 0.24, teteProfondeur: 0.24 },
    museau: { forme: 'bec', long: 0.32, r: 0.045, y: 2.22 },
    coiffe: (T, k) => pointe(T, [0, 2.46, 0.08], 0.03, 0.22, k.dom, [1.2, 0, 0], 3),
    outil: { pose: [0, 0, 0], dessiner: (T, k) => jalon(T, -1.12, 1.0, 0.026, 4, k.bois, k.lin) },
    autreMain: {
      // Le fil à plomb.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.35, 0, 0.006, k.fer, 3);
        pointe(T, [0, -0.35, 0], 0.045, 0.12, k.fer, [Math.PI, 0, 0]);
      },
    },
  },
  'maths-3e-statistics': {
    nom: 'Stat',
    metier: 'astronome',
    gabarit: 'elance',
    dominante: 0x8e8272,
    marque: { couleur: 0xd8ccb4, ou: ['visage', 'ventre'] },
    tenue: { couleur: 0x2e3e5c, vetements: ['cape'] },
    silhouette: { tete: 0.32, teteProfondeur: 0.27 },
    museau: { forme: 'bec', long: 0.07, r: 0.045, y: 2.2 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.2, 2.46, 0], 0.06, 0.16, k.dom, [0, 0, -c * 0.4], 3);
    },
    outil: {
      // La lunette sur son trépied, posé au sol.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        fuseau(
          pose(T, repere([0, 0.05, 0], -1.1, 0, 0)),
          [
            [-0.2, 0.05],
            [0.32, 0.065],
          ],
          6,
          k.laiton,
        );
        for (const [rx, rz] of [
          [0.22, 0],
          [-0.12, 0.2],
          [-0.12, -0.2],
        ])
          manche(pose(T, repere([0, 0, 0], rx, 0, rz)), -1.2, 0, 0.018, k.bois, 3);
      },
    },
  },
  'maths-3e-functions': {
    nom: 'Fi',
    metier: 'allumeuse',
    gabarit: 'elance',
    dominante: 0x8a7a5a,
    tenue: { couleur: 0x2a3550, vetements: ['cire'] },
    yeux: false,
    tete: (T, k) => {
      // La tête-lanterne : un socle, quatre montants, un toit ; le verre est la pièce qui brille.
      fuseau(
        T,
        [
          [COU, 0.18],
          [2.07, 0.21],
        ],
        6,
        k.laiton,
      );
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        manche(pose(T, repere([0.17 * Math.cos(a), 0, 0.17 * Math.sin(a)])), 2.07, 2.4, 0.02, k.laiton, 3);
      }
      fuseau(
        T,
        [
          [2.39, 0.25],
          [SOMMET_DE_TETE, 0],
        ],
        6,
        k.laiton,
      );
    },
    coiffe: (T, k) => pointe(T, [0, SOMMET_DE_TETE - 0.02, 0], 0.035, 0.12, k.laiton, [0, 0, 0], 4),
    lueur: {
      // Le verre : ambre pâle et mat le jour, la lueur la nuit.
      nom: 'lanterne',
      sur: 'tete',
      couleur: VERRE_DE_FI.jour,
      nuit: VERRE_DE_FI.nuit,
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [2.07, 0.16],
            [2.39, 0.16],
          ],
          6,
          k.lueur,
        ),
    },
    outil: {
      // La burette.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        fuseau(
          T,
          [
            [-0.2, 0.1],
            [-0.06, 0.085],
            [0, 0.03],
          ],
          6,
          k.laiton,
        );
        pointe(T, [0, -0.1, -0.06], 0.02, 0.22, k.fer, [-1.1, 0, 0], 3);
      },
    },
  },
  'french-3e-close-reading': {
    nom: 'Astra',
    metier: 'copiste',
    dominante: 0x3a3a4a,
    marque: { couleur: 0xb8bcc8, ou: ['visage'] },
    // La robe au-dessus du genou (0,55 bloc), à manches courtes : les jambes et les avant-bras, sombres, se lisent d'abord.
    tenue: { couleur: TENUE.lin, vetements: ['robe'], bas: 0.55, manches: 'courtes' },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.08, 2.46, -0.02], 0.025, 0.3, k.dom, [-0.3, 0, -c * 0.75], 3);
    },
    corps: (T, k) => {
      // Les ailes claires, dressées sur le dos, qui s'écartent au-dessus des épaules.
      for (const c of [-1, 1])
        fuseau(
          pose(T, repere([c * 0.14, 1.6, 0.24], 0.35, 0, -c * 0.55)),
          [
            [0, 0.06, 0.015],
            [0.35, 0.12, 0.015],
            [0.7, 0.05, 0.015],
          ],
          4,
          k.marque,
        );
    },
    lueur: {
      nom: 'abdomen',
      sur: 'corps',
      dessiner: (T, k) =>
        fuseau(
          pose(T, repere([0, 0.95, 0.26], 1.8, 0, 0)),
          [
            [0, 0.15],
            [0.2, 0.17],
            [0.38, 0],
          ],
          6,
          k.lueur,
        ),
    },
    outil: {
      // Le livre ouvert, tenu à plat.
      pose: [-0.3, 0, 0],
      dessiner: (T, k) => {
        for (const c of [-1, 1]) {
          const P = pose(T, repere([0, 0, 0], 0, 0, -c * 0.18));
          pave(P, c < 0 ? -0.2 : 0, 0, -0.14, c < 0 ? 0 : 0.2, 0.02, 0.14, k.bois);
          pave(P, c < 0 ? -0.19 : 0, 0.02, -0.13, c < 0 ? 0 : 0.19, 0.04, 0.13, k.lin);
        }
      },
    },
  },
  'english-3e-comprehension': {
    nom: 'Écho',
    metier: 'opératrice radio',
    dominante: 0x5a4a6a,
    marque: { couleur: 0xb0a4b8, ou: ['visage'] },
    tenue: { couleur: TENUE.lin, vetements: ['ailes', 'gilet'] },
    coiffe: (T, k) => {
      // Les grandes oreilles, le casque et ses écouteurs.
      for (const c of [-1, 1]) {
        pointe(T, [c * 0.18, 2.4, 0.02], 0.13, 0.32, k.dom, [0, 0, -c * 0.6], 4);
        disque(pose(T, repere([c * 0.28, 2.28, 0], 0, 0, Math.PI / 2)), 0, 0.075, 0.05, k.laiton);
      }
      pave(T, -0.29, 2.5, -0.03, 0.29, 2.54, 0.03, k.laiton);
    },
    outil: {
      // Le micro.
      pose: [-0.3, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.25, 0.018, k.fer);
        fuseau(
          T,
          [
            [0.24, 0.04],
            [0.32, 0.05],
            [0.38, 0],
          ],
          5,
          k.laiton,
        );
      },
    },
  },
  'english-3e-grammar': {
    nom: 'Knight',
    metier: 'écuyer héraut',
    // Une souris gris froid.
    dominante: 0x8c8a84,
    marque: { couleur: 0xe0d4c8, ou: ['museau'] },
    tenue: { couleur: 0x3e5c8a, vetements: ['robe', 'ceinture'] },
    museau: { forme: 'museau', long: 0.14, r: 0.07 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.23, 2.53, 0.02], Math.PI / 2, 0, 0)), 0, 0.13, 0.03, k.dom);
    },
    outil: {
      // La bannière.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -1.12, 1.35, 0.026, k.bois);
        pave(T, 0.03, 0.8, -0.012, 0.36, 1.28, 0.012, k.tenue);
        pointe(T, [0, 1.35, 0], 0.04, 0.1, k.laiton);
      },
    },
    autreMain: {
      // Le heaume, sous le bras.
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.05, 0.13],
            [0.13, 0.14],
            [0.24, 0.07],
          ],
          6,
          k.fer,
        ),
    },
  },
  'lv2-3e-travel': {
    // La loutre factrice du Refuge des carnets (DA, LV2-5) : brun-gris (plus sombre que Tunel, plus chaud que Vapeur),
    // la gorge et le museau crème, sans masque ni moustaches ; la tête plate et large, deux petites oreilles rondes sur
    // les côtés ; une sacoche de cuir fauve unie en bandoulière (ni casquette, ni uniforme, ni cor, ni jaune) ; la queue
    // épaisse à la base, en pointe, posée au sol derrière elle, vers la droite (ni panache, ni queue qui monte). Dans la
    // main, une lettre sans rien d'écrit dessus.
    nom: 'Timbre',
    metier: 'factrice',
    dominante: 0x5c4a3e,
    marque: { couleur: 0xe2d4b6, ou: ['poitrine', 'museau'] },
    tenue: { couleur: 0xa8703a, vetements: [] },
    // La tête plate, bien plus large que haute (0,8 sur 0,5 : une loutre, pas un ours) ; le museau crème large, bas, qui
    // rejoint la gorge ; les oreilles petites, basses, sur les côtés (consultant Archipéo, retouches LV2-5).
    silhouette: { largeur: 0.27, profondeur: 0.24, jambes: 0.6, tete: 0.4, teteProfondeur: 0.25, crane: 1 },
    museau: { forme: 'museau', long: 0.09, r: 0.16, y: 2.08 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.43, 2.2, 0], 0, 0, (c * Math.PI) / 2)), 0, 0.08, 0.07, k.dom, 3);
    },
    corps: (T, k) => {
      // La queue : de la base du dos, posée au sol, vers l'arrière et la droite ; épaisse, puis en pointe.
      // Épaisse à la base (0,16), elle descend vers l'arrière et la droite jusqu'au sol : elle dépasse sur le côté, de face.
      fuseau(
        pose(T, repere([0.12, 0.3, -0.1], -(Math.PI / 2 + 0.4), -1, 0)),
        [
          [0, 0.16, 0.12],
          [0.3, 0.15, 0.1],
          [0.52, 0.1, 0.07],
          [0.74, 0, 0],
        ],
        5,
        k.dom,
      );
      // La gorge crème, du museau à la poitrine : une seule tache claire sous la tête, de face.
      const g = devant(k.torse, 8, 1.9).z;
      pave(T, -0.13, 1.76, g - 0.05, 0.13, 2.02, g + 0.02, k.marque);
      // La sacoche, sur la hanche gauche, et sa bandoulière, de l'épaule droite à la sacoche, en travers du devant.
      pave(T, -0.44, 0.72, -0.15, -0.27, 1.02, 0.13, k.tenue);
      const z = (y: number) => devant(k.torse, 8, y).z - 0.02;
      tube(
        T,
        [
          [0.24, 1.78, z(1.78) + 0.04],
          [0.02, 1.42, z(1.42)],
          [-0.22, 1.08, z(1.08) + 0.03],
          [-0.33, 1.0, -0.05],
        ],
        0.028,
        3,
        k.tenue,
        0.5,
      );
    },
    outil: {
      // Une lettre, pliée, sans rien d'écrit (aucun motif qu'on puisse lire).
      pose: [0, 0, 0],
      dessiner: (T, k) => pave(T, -0.02, -0.16, -0.12, 0.02, 0.02, 0.12, k.lin),
    },
  },
  // Les habitants d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict
  // nécessaire (budget de l'archipel). Mémo est une marmotte bibliothécaire, Jalon une fourmi arpenteuse (DA, HG-3).
  'history-3e-twentieth-century': {
    nom: 'Mémo',
    metier: 'bibliothécaire',
    dominante: 0x8a7058,
    marque: { couleur: 0xe6d8bc, ou: ['ventre', 'museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.14, r: 0.07 },
    // Ronde et dodue, la tête large : elle ne se confond ni avec Écho ni avec Astra.
    silhouette: { largeur: 0.44, ventre: 0.12, tete: 0.33, jambes: 0.6 },
    // Deux petites oreilles rondes, basses.
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.22, 2.4, 0.04], Math.PI / 2, 0, 0)), 0, 0.08, 0.04, k.dom, 5);
    },
    outil: {
      // Un livre relié de cuir, fermé.
      pose: [0, 0, 0],
      dessiner: (T, k) => pave(T, -0.12, 0, -0.04, 0.12, 0.3, 0.04, k.cuir),
    },
  },
  'geography-3e-france': {
    nom: 'Jalon',
    metier: 'arpenteuse',
    dominante: 0x6e2a22,
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    silhouette: { largeur: 0.26, ventre: 0.08 },
    // Les deux antennes de la fourmi.
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.1, 2.42, 0], 0.025, 0.26, k.dom, [-0.4, 0, -c * 0.4], 3);
    },
    // Le jalon d'arpenteur, rayé de lin et de cuir.
    outil: { pose: [0, 0, -0.05], dessiner: (T, k) => jalon(T, -1.12, 1.35, 0.026, 6, k.lin, k.cuir) },
  },
  // Les habitants de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict nécessaire, une
  // signature chacun (budget de l'archipel). Olive est un koala soigneur, Virage un tatou rouleur, Navette une chenille
  // tisseuse (DA, SC-3).
  'life-earth-sciences-3e-human-body': {
    nom: 'Olive',
    metier: 'soigneur',
    dominante: 0x8e8c88,
    marque: { couleur: 0xc4c0b8, ou: ['ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.1, r: 0.09 },
    silhouette: { largeur: 0.36, ventre: 0.08, tete: 0.3, teteProfondeur: 0.26 },
    coiffe: (T, k) => {
      // Les grandes oreilles rondes du koala, de chaque côté de la tête.
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.32, 2.36, 0.02], 0, 0, Math.PI / 2)), 0, 0.17, 0.05, k.dom, 6);
    },
    outil: {
      // La trousse de toile, sans croix : un sac de lin, sa poignée de cuir.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.14, -0.18, -0.07, 0.14, 0.02, 0.07, k.lin);
        pave(T, -0.06, 0.02, -0.02, 0.06, 0.07, 0.02, k.cuir);
      },
    },
  },
  'physics-chemistry-3e-motion-energy': {
    nom: 'Virage',
    metier: 'rouleur',
    dominante: 0xa8845e,
    marque: { couleur: 0x6e5238, ou: ['dos'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    museau: { forme: 'museau', long: 0.24, r: 0.06 },
    silhouette: { largeur: 0.33, profondeur: 0.3, tete: 0.24 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.14, 2.42, 0.05], 0.05, 0.2, k.dom, [0, 0, -c * 0.3], 3);
    },
    corps: (T, k) => {
      // La carapace en bandes, bombée sur le dos, du cou aux reins.
      fuseau(pose(T, repere([0, 1.05, 0.2], 0, 0, 0)), [[0, 0.36, 0.22], [0.4, 0.42, 0.28], [0.8, 0.36, 0.24]], 6, parFace((s) => (s % 2 ? k.marque : k.dom)), { z: 0.08 });
      pointe(T, [0, 0.8, 0.3], 0.07, 0.5, k.marque, [2.4, 0, 0], 3);
    },
    outil: {
      // Une balle de cuir (consultant d'Archipéo, relecture des captures : un chronomètre disait la course contre la
      // montre, DP-12) ; autant de facettes que lui.
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.13, 0],
            [-0.065, 0.113],
            [0.065, 0.113],
            [0.13, 0],
          ],
          5,
          k.cuir,
        ),
    },
  },
  'technology-3e-digital': {
    nom: 'Navette',
    metier: 'tisseuse',
    dominante: 0x8ab850,
    marque: { couleur: 0xbcd888, ou: ['ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    // La grosse tête ronde de la chenille sur un corps d'un seul tenant : elle ne se confond pas avec Jalon.
    silhouette: { largeur: 0.33, profondeur: 0.28, ventre: 0.03, jambes: 0.4, jambe: 0.13, tete: 0.33, teteProfondeur: 0.28, crane: 1 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.12, 2.42, 0], 0.03, 0.26, k.dom, [0, 0, -c * 0.5], 3);
    },
    corps: (T, k) => {
      // Les anneaux de la chenille, couchés derrière elle sur le sol.
      for (const [z, r] of [
        [0.32, 0.15],
        [0.56, 0.12],
      ] as const)
        fuseau(T, [[0, r * 0.6], [r, r], [r * 2, r * 0.6]], 5, k.dom, { z, bas: false });
    },
    outil: {
      // La navette de bois, en fuseau.
      pose: [-Math.PI / 2, 0, 0],
      dessiner: (T, k) => fuseau(T, [[-0.18, 0], [0, 0.04], [0.18, 0]], 4, k.bois),
    },
    autreMain: {
      // La bobine de fil.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        disque(T, 0, 0.07, 0.12, k.lin, 5);
        disque(T, 0.07, 0.09, 0.02, k.bois, 5);
      },
    },
  },
  // EMC 3e (EMC-2) : le strict nécessaire, Archipéo étant en pause. Brio, macareux orateur : le dos noir, la face et le
  // ventre blancs, le gros bec court ; rond, les pattes courtes, les ailes ouvertes ; une écharpe de lin, aucun insigne ;
  // à la main, ses notes roulées (le pupitre est sa commande).
  'civics-3e-democratic-life': {
    nom: 'Brio',
    metier: 'orateur',
    dominante: 0x2a2a30,
    marque: { couleur: 0xd8d4cc, ou: ['visage', 'ventre'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    museau: { forme: 'bec', long: 0.2, r: 0.09, y: 2.18 },
    // Le macareux : rond de corps, les pattes courtes, la grosse tête.
    silhouette: { largeur: 0.36, profondeur: 0.32, ventre: 0.1, jambes: 0.4, tete: 0.28, crane: 1 },
    // Les deux ailes ouvertes de l'orateur, qui s'adresse à tous : elles le séparent de Mémo et d'Olive en silhouette.
    bras: { rz: 0.5 },
    autreBras: { rz: 0.5 },
    corps: (T, k) => {
      // La queue courte et noire, pointée vers le sol.
      pointe(T, [0, 0.95, 0.24], 0.1, 0.28, k.dom, [2.4, 0, 0], 3);
    },
    outil: {
      // Ses notes roulées, de lin.
      pose: [0, 0, 0],
      dessiner: (T, k) => manche(T, -0.12, 0.2, 0.035, k.lin, 4),
    },
  },
  // Latin-grec 3e (LCA-2) : le strict nécessaire, Archipéo étant en pause. Stylet, huppe scribe : rose orangé, le long
  // bec fin et sombre, la huppe dressée sur la tête, les ailes rayées de sombre dans le dos ; une ceinture de cuir ; à
  // la main, le stylet de fer, et dans l'autre sa tablette de cire, le cadre de bois.
  'lca-3e-ideas': {
    nom: 'Stylet',
    metier: 'scribe',
    dominante: 0xc88a5e,
    marque: { couleur: 0x2a2420, ou: ['museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    museau: { forme: 'bec', long: 0.34, r: 0.035, y: 2.2 },
    silhouette: { largeur: 0.27, profondeur: 0.25, jambes: 0.7, jambe: 0.045, tete: 0.24 },
    coiffe: (T, k) => {
      // La huppe : trois plumes dressées, du front vers la nuque, de plus en plus couchées.
      for (const [z, rx] of [
        [-0.08, 0.15],
        [0.02, -0.2],
        [0.12, -0.55],
      ] as const)
        pointe(T, [0, 2.4, z], 0.04, 0.26, k.dom, [rx, 0, 0], 3);
    },
    corps: (T, k) => {
      // Les ailes repliées dans le dos, rayées : trois bandes sombres.
      for (const y of [1.2, 1.42, 1.64]) pave(T, -0.2, y, 0.22, 0.2, y + 0.08, 0.27, k.marque);
    },
    outil: {
      // Le stylet de fer.
      pose: [0, 0, 0],
      dessiner: (T, k) => manche(T, -0.06, 0.24, 0.012, k.fer, 3),
    },
    autreMain: {
      // La tablette de cire : le cadre de bois, la cire de lin.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.12, -0.15, -0.025, 0.12, 0.15, 0.025, k.bois);
        pave(T, -0.1, -0.13, -0.035, 0.1, 0.13, -0.02, k.lin);
      },
    },
  },
} satisfies Partial<Record<BiomeId, Espece>>;
