// Les habitants des Premiers Rivages (6e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après
// l'intention du directeur artistique. Budget serré : dix îles pour 2 500 triangles.
import type { BiomeId } from '../../../biomes';
import { SABLE } from '../../palette';
import { TENUE } from '../couleurs';
import { anneau, disque, jalon, manche, pointe, type Espece } from '../gabarit';
import { anneauA, devant, facette, fuseau, parFace, pave, pose, repere, type Anneau, type V3 } from '../peint';

/** Les élytres de Coco, en losange (l'arête au milieu du dos) : elles débordent des épaules. */
const ELYTRES: Anneau[] = [
  [0.45, 0.62, 0.07, 0.33],
  [1.3, 0.58, 0.07, 0.31],
  [1.86, 0.4, 0.05, 0.23],
];

const BOSSE: Anneau[] = [
  [2.4, 0.085],
  [2.54, 0.08],
  [2.62, 0],
];

export const ESPECES_6E = {
  'french-6e-phonology': {
    nom: 'Mousso',
    metier: 'charpentier',
    dominante: 0x4c7a3b,
    // Le plastron de pierre claire, tout le devant du torse : de face, il détache Mousso de l'herbe (DA, 2D, 28/09).
    marque: { couleur: 0xb3ae9f, ou: ['plastron'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.36, profondeur: 0.29, tete: 0.3, teteProfondeur: 0.26 },
    coiffe: (T, k) => {
      // Une touffe de pousses sur la tête.
      pointe(T, [-0.08, 2.46, 0], 0.07, 0.2, k.dom, [0.2, 0, 0.5]);
      pointe(T, [0.02, 2.47, 0.02], 0.07, 0.22, k.dom, [-0.1, 0, -0.1]);
      pointe(T, [0.1, 2.46, 0.02], 0.06, 0.18, k.dom, [-0.3, 0, -0.7]);
    },
    corps: (T, k) => {
      // Les épaules de mousse, en mottes : un golem large du haut.
      for (const c of [-1, 1])
        fuseau(
          T,
          [
            [1.52, 0.13, 0.15],
            [1.76, 0.2, 0.2],
            [1.94, 0.1, 0.11],
          ],
          4,
          k.dom,
          { x: c * 0.42 },
        );
    },
    outil: {
      pose: [-0.5, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.12, 0.55, 0.03, k.bois);
        pave(T, -0.2, 0.48, -0.1, 0.2, 0.74, 0.1, k.bois);
      },
    },
  },
  'french-6e-letter-confusion': {
    nom: 'Tunel',
    metier: 'mineur',
    gabarit: 'trapu',
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
        { bas: false },
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
  'french-6e-word-spelling': {
    nom: 'Rouxel',
    metier: 'tailleur de pierre',
    dominante: 0xb8662e,
    marque: { couleur: 0xe6d8c0, ou: ['poitrine', 'museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.24, r: 0.09 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.15, 2.43, 0.03], 0.09, 0.28, k.dom, [0, 0, -c * 0.35]);
    },
    corps: (T, k) => {
      // La queue touffue au bout clair, relevée sur le côté : elle se voit de face.
      fuseau(
        pose(T, repere([-0.12, 0.8, 0.24], 1.2, 0, 0.8)),
        [
          [0, 0.07],
          [0.2, 0.18],
          [0.44, 0.17],
          [0.66, 0],
        ],
        5,
        parFace((s) => (s === 2 ? k.marque : k.dom)),
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
  'french-6e-grammar-spelling': {
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
  'french-6e-reading': {
    nom: 'Grimoire',
    metier: 'relieur copiste',
    gabarit: 'trapu',
    dominante: 0x6e6a86,
    marque: { couleur: 0x4c4866, ou: [] },
    // Une tunique à mi-cuisse : les jambes et la carapace, violettes, se lisent d'abord.
    tenue: { couleur: TENUE.lin, vetements: ['robe'], bas: 0.5 },
    // Une tête de tortue : large, plate sur le dessus, le museau en avant.
    silhouette: { tete: 0.3, teteProfondeur: 0.28, crane: 1 },
    museau: { forme: 'museau', long: 0.1, r: 0.1, y: 2.15 },
    corps: (T, k) => {
      // La carapace en dôme sur le dos : elle déborde du tronc de 0,2 bloc derrière et de 0,1 au-dessus des épaules,
      // de chaque côté de la tête (un octogone, un sommet à mi-hauteur de l'épaule : son bord monte en arc).
      fuseau(
        pose(T, repere([0, 1.37, 0.1], Math.PI / 2, 0, 0)),
        [
          [0, 0.55, 0.81],
          [0.24, 0.42, 0.62],
          [0.34, 0],
        ],
        8,
        k.marque,
        { rot: 0 },
      );
    },
    outil: {
      // Le livre, tenu couverture en avant (0,5 bloc de haut).
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.2, -0.08, -0.05, 0.2, 0.42, 0.05, k.bois);
        pave(T, -0.19, -0.07, -0.04, 0.21, 0.41, 0.04, k.lin);
      },
    },
  },
  'maths-6e-calculation': {
    nom: 'Coco',
    metier: 'arpenteuse',
    dominante: 0xa8443a,
    marque: { couleur: 0x5a2a24, ou: [] },
    tenue: { couleur: TENUE.lin, vetements: ['ceinture'] },
    silhouette: { largeur: 0.36, profondeur: 0.3, ventre: 0.04 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.07, 2.47, -0.02], 0.02, 0.22, k.marque, [-0.3, 0, -c * 0.35], 3);
    },
    corps: (T, k) => {
      // Les élytres en cape, rouges, et leurs trois points brun sombre (0,12 bloc).
      fuseau(T, ELYTRES, 4, k.dom, { rot: 0 });
      const points: [number, number, number][] = [
        [-0.24, 1.4, 0.06],
        [0.24, 1.4, 0.06],
        [0, 0.85, 0.06],
      ];
      for (const [x, y, r] of points) {
        const [, rx, rz, dz] = anneauA(ELYTRES, y);
        const z = dz + rz * (1 - Math.max(0, Math.abs(x) - r) / rx) + 0.006;
        const pts: V3[] = Array.from({ length: 6 }, (_, i) => [x + r * Math.cos((i * Math.PI) / 3), y + r * Math.sin((i * Math.PI) / 3), z]);
        facette(T, pts, [x, y, z - 1], k.marque);
      }
    },
    outil: { pose: [0, 0, 0], dessiner: (T, k) => jalon(T, -1.12, 0.9, 0.028, 4, k.bois, k.lin) },
  },
  'maths-6e-fractions': {
    nom: 'Nénu',
    metier: 'passeuse',
    gabarit: 'elance',
    dominante: 0x6f8f3e,
    // Le ciré en tunique courte (les jambes vertes dès mi-cuisse), ouvert de l'ourlet au cou sur le devant, à manches
    // courtes : les jambes, le poitrail et les avant-bras, verts, se lisent d'abord.
    tenue: { couleur: SABLE, vetements: ['cire'], bas: 0.635, manches: 'courtes', ouvert: true },
    silhouette: { tete: 0.33, teteProfondeur: 0.23, jambe: 0.11 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) fuseau(T, BOSSE, 5, k.dom, { x: c * 0.17, z: -0.05 });
    },
    yeux: { y: 2.5, ecart: 0.17, taille: 0.036, z: devant(BOSSE, 5, 2.5, -0.05).z },
    outil: { pose: [0.05, 0, -0.1], dessiner: (T, k) => manche(T, -1.12, 1.4, 0.028, k.bois) },
  },
  'maths-6e-decimals': {
    nom: 'Lavi',
    metier: 'fondeuse',
    dominante: 0xd08a3a,
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    // Une tête de salamandre, large et plate.
    silhouette: { tete: 0.34, teteProfondeur: 0.27, crane: 0.95 },
    museau: { forme: 'museau', long: 0.12, r: 0.12, y: 2.15 },
    bras: { rx: 0.7, rz: 0.1 },
    corps: (T, k) =>
      // La longue queue, qui traîne au sol et s'enroule sur le côté.
      fuseau(
        pose(T, repere([0.05, 0.5, 0.12], Math.PI / 2 - 0.25, 0, 0)),
        [
          [0, 0.11],
          [0.22, 0.09, 0.09, 0.02, 0.06],
          [0.42, 0.065, 0.065, 0.04, 0.22],
          [0.58, 0, 0, 0.05, 0.44],
        ],
        5,
        k.dom,
      ),
    outil: {
      // La longue pince (1,2 bloc), tenue en travers du corps : elle se voit de face.
      pose: [0, -0.3, 1.05],
      dessiner: (T, k) => {
        for (const c of [-1, 1]) {
          manche(pose(T, repere([0, -0.3, 0], 0, 0, c * 0.04)), 0, 1.2, 0.026, k.fer, 3);
          pointe(T, [c * 0.03, 0.84, 0], 0.035, 0.1, k.fer, [0, 0, -c * 0.5], 3);
        }
      },
    },
  },
  'english-6e-vocabulary': {
    nom: 'Robin',
    metier: 'amarreur',
    dominante: 0x70563f,
    marque: { couleur: 0xc8703a, ou: ['plastron'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    silhouette: { largeur: 0.36, profondeur: 0.3, ventre: 0.06, jambe: 0.05, jambes: 0.55 },
    museau: { forme: 'bec', long: 0.12, r: 0.05, y: 2.2 },
    corps: (T, k) => {
      // La queue relevée.
      fuseau(
        pose(T, repere([0, 0.8, 0.24], 2.0, 0, 0)),
        [
          [0, 0.1, 0.02],
          [0.3, 0.14, 0.015],
        ],
        4,
        k.dom,
      );
      // Le cordage : un anneau de corde (0,55 bloc) passé à l'épaule gauche, le bras au milieu, sans le toucher ; il se
      // voit de face et de trois quarts.
      anneau(T, [-0.44, 1.62, -0.02], 0.24, 0.035, k.lin, [0, 0.35, 0], 6);
    },
    outil: {
      // Le bout du cordage, qui pend de la main.
      pose: [0, 0, 0],
      dessiner: (T, k) => manche(T, -0.4, 0.04, 0.035, k.lin, 4),
    },
  },
  'english-6e-grammar': {
    nom: 'Tick',
    metier: 'horloger',
    dominante: 0x6a6258,
    marque: { couleur: 0xd8c8a8, ou: ['museau', 'visage', 'ventre'] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.2, r: 0.08 },
    // Un hérisson : rond, sur de courtes pattes (15 % plus courtes que celles du gabarit), que le ventre clair arrête net.
    silhouette: { largeur: 0.36, profondeur: 0.3, ventre: 0.06, jambes: 0.6 },
    corps: (T, k) => {
      // Les piquants du dos, en éventail : ils dépassent des épaules et de la tête.
      const piquants: [number, number, number, number, number][] = [
        [-0.26, 1.72, 0.12, 0.6, 1.05],
        [0.26, 1.72, 0.12, 0.6, -1.05],
        [-0.22, 1.35, 0.18, 0.9, 1.25],
        [0.22, 1.35, 0.18, 0.9, -1.25],
        [0, 1.3, 0.26, 1.4, 0],
        [0, 1.8, 0.16, 1.0, 0],
      ];
      for (const [x, y, z, rx, rz] of piquants) pointe(T, [x, y, z], 0.08, 0.36, k.dom, [rx, 0, rz], 3);
    },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.14, 2.4, 0.1], 0.07, 0.26, k.dom, [0.6, 0, -c * 0.7], 3);
      pointe(T, [0, 2.44, 0.12], 0.07, 0.26, k.dom, [0.9, 0, 0], 3);
    },
    outil: {
      pose: [-0.2, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.02, 0.2, 0.024, k.bois);
        disque(pose(T, repere([0, 0.31, 0], Math.PI / 2, 0, 0)), 0, 0.11, 0.03, k.laiton, 6);
      },
    },
    // L'horloge de laiton, tenue cadran en avant.
    autreBras: { rx: 0.35, rz: 0.2 },
    autreMain: { pose: [Math.PI / 2, 0, 0], dessiner: (T, k) => disque(T, 0.06, 0.2, 0.08, k.laiton, 6) },
  },
} satisfies Partial<Record<BiomeId, Espece>>;
