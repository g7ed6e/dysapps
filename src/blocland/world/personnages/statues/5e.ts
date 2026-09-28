// Les Gardiens des Îles Brumeuses (5e) en sentinelles de pierre (lot R6), d'après l'intention du directeur
// artistique : la statue et ce qui s'allume. Six îles pour 1 800 triangles, socles compris.
import type { BiomeId } from '../../../biomes';
import { pointe } from '../gabarit';
import { devant, fuseau, pave, type Anneau } from '../peint';
import { orbites, tube, veineSur, type Statue } from '../sentinelle';

const TETE_DU_MAMMOUTH: Anneau[] = [
  [5.0, 0.8, 0.75, -1.2],
  [6.8, 0.85, 0.75, -1.25],
  [7.6, 0.6, 0.55, -1.1],
  [8, 0.25, 0.25, -1.0],
];
/** Une patte-colonne du Mammouth, à six pans, le pied évasé. */
const PATTE_DU_MAMMOUTH: Anneau[] = [
  [1, 0.5],
  [1.35, 0.4],
  [3.4, 0.37],
];
/** Les quatre pattes du Mammouth : x, z. */
const PATTES: [number, number][] = [
  [-0.7, -0.6],
  [0.7, -0.6],
  [-0.7, 1.2],
  [0.7, 1.2],
];

const CAPE: Anneau[] = [
  [1, 1.25, 1.0],
  [3.5, 1.0, 0.85],
  [5.6, 0.75, 0.6],
  [6.1, 0.45, 0.4],
];
const TETE_DU_COLPORTEUR: Anneau[] = [
  [6.0, 0.36],
  [6.9, 0.38],
  [7.05, 0.3],
];

const NEMES_COUCHE: Anneau[] = [
  [5.4, 0.95, 0.5, -0.55],
  [6.8, 0.75, 0.5, -0.6],
  [8, 0.45, 0.4, -0.5],
];
const FACE_DU_SPHINX: Anneau[] = [
  [5.7, 0.34, 0.28, -0.98],
  [7.0, 0.4, 0.3, -1.0],
  [7.4, 0.28, 0.2, -0.95],
];

const CORPS_DE_L_HYDRE: Anneau[] = [
  [1, 1.3, 1.0],
  [2.4, 1.2, 0.95],
  [3.6, 0.7, 0.6],
];
/** Les trois cous de l'Hydre en chandelier : leur ligne, leur tête (le haut du cou) et leur collerette (hauteur, x, z). */
const COUS: { ligne: [number, number, number][]; collerette: [number, number, number] }[] = [
  {
    ligne: [
      [0, 3.3, 0],
      [0, 5.5, -0.2],
      [0, 7.28, -0.3],
    ],
    collerette: [5.9, 0, -0.22],
  },
  ...[-1, 1].map((s) => ({
    ligne: [
      [s * 0.5, 3.1, 0],
      [s * 1.35, 4.4, 0],
      [s * 1.5, 6.2, -0.1],
    ] as [number, number, number][],
    collerette: [5.3, s * 1.43, -0.05] as [number, number, number],
  })),
];
const teteDHydre = (y: number): Anneau[] => [
  [y, 0.36, 0.32],
  [y + 0.5, 0.33, 0.3, -0.2],
  [y + 0.72, 0.14, 0.12, -0.15],
];

const ROBE_DE_LA_REINE: Anneau[] = [
  [1, 1.3, 1.1],
  [3.0, 1.0, 0.85],
  [5.2, 0.62, 0.5],
  [5.9, 0.45, 0.38],
];
const TETE_DE_LA_REINE: Anneau[] = [
  [5.8, 0.32],
  [6.7, 0.36],
  [7.0, 0.28],
];

const VOILE: Anneau[] = [
  [1, 1.35, 1.2],
  [2.0, 1.1, 1.0],
  [5.0, 0.8, 0.7],
  [6.8, 0.62, 0.55],
  [7.6, 0.45, 0.42],
  [8, 0],
];

export const STATUES_5E: Partial<Record<BiomeId, Statue>> = {
  glacier: {
    nom: 'le Mammouth',
    allume: 'ses veines de givre',
    sculpture: (T, a) => {
      for (const [x, z] of PATTES) fuseau(T, PATTE_DU_MAMMOUTH, 6, a.moussue((k, j) => k === 0 && j === 1), { x, z, bas: false, haut: false });
      tube(
        T,
        [
          [0, 4.3, 1.4],
          [0, 4.6, 0.3],
          [0, 4.7, -0.7],
        ],
        [1.1, 1.4, 1.3],
        6,
        a.pierre,
      );
      fuseau(T, TETE_DU_MAMMOUTH, 6, a.pierre, { bas: false });
      tube(
        T,
        [
          [0, 5.6, -1.75],
          [0.05, 4.4, -2.05],
          [0.3, 3.4, -1.95],
          [0.7, 3.0, -1.6],
        ],
        [0.3, 0.25, 0.18, 0.12],
        4,
        a.pierre,
      );
      for (const s of [-1, 1]) {
        tube(
          T,
          [
            [s * 0.45, 5.3, -1.6],
            [s * 0.6, 4.3, -2.05],
            [s * 0.85, 3.95, -2.3],
            [s * 1.05, 4.35, -2.35],
          ],
          [0.14, 0.12, 0.09, 0],
          3,
          a.pierre,
        );
        pointe(T, [s * 0.75, 6.4, -1.0], 0.55, 0.95, a.pierre, [0, 0, -s * 1.9], 4, 0.08);
      }
      orbites(T, a, 0, 6.5, devant(TETE_DU_MAMMOUTH, 6, 6.5).z, 0.24, 0.12);
    },
    veines: (T, a) => {
      for (const s of [-1, 1])
        veineSur(
          T,
          TETE_DU_MAMMOUTH,
          6,
          [
            [s * 0.1, 7.55],
            [s * 0.28, 7.1],
            [s * 0.18, 6.8],
          ],
          0.07,
          a.lueur,
        );
      veineSur(
        T,
        PATTE_DU_MAMMOUTH,
        6,
        [
          [0, 1.25],
          [0.08, 2.2],
          [-0.05, 3.1],
        ],
        0.07,
        a.lueur,
        { x: -0.7, z: -0.6 },
      );
    },
  },
  marche: {
    nom: 'le Colporteur',
    allume: 'sa lanterne',
    sculpture: (T, a) => {
      fuseau(T, CAPE, 8, a.moussue((k, j) => k === 0 && (j === 1 || j === 4 || j === 6)), { bas: false });
      fuseau(T, TETE_DU_COLPORTEUR, 6, a.pierre, { bas: false });
      // Le chapeau : un large bord et sa calotte.
      fuseau(
        T,
        [
          [6.95, 1.0, 0.95],
          [7.1, 1.0, 0.95],
        ],
        8,
        a.pierre,
      );
      fuseau(
        T,
        [
          [7.05, 0.5],
          [8, 0.4],
        ],
        6,
        a.pierre,
        { bas: false },
      );
      // Le bras qui tend la lanterne, son anse, et la hotte sur le dos.
      tube(
        T,
        [
          [0.65, 5.4, -0.2],
          [0.85, 4.6, -0.8],
          [0.85, 4.7, -1.35],
        ],
        [0.2, 0.18, 0.15],
        4,
        a.pierre,
      );
      tube(
        T,
        [
          [0.85, 4.45, -1.45],
          [0.85, 4.66, -1.4],
        ],
        0.03,
        3,
        a.pierre,
      );
      pave(T, -0.5, 3.8, 0.5, 0.5, 5.2, 1.05, a.pierre);
      orbites(T, a, 0, 6.45, devant(TETE_DU_COLPORTEUR, 6, 6.45).z, 0.13, 0.09);
    },
    veines: (T, a) =>
      fuseau(
        T,
        [
          [3.7, 0.2],
          [4.2, 0.24],
          [4.45, 0],
        ],
        4,
        a.lueur,
        { x: 0.85, z: -1.45 },
      ),
  },
  carrefour: {
    nom: 'le Sphinx couché',
    allume: 'les bandes de sa coiffe',
    sculpture: (T, a) => {
      pave(T, -1.4, 1, -0.95, 1.4, 3.6, 1.5, a.pierre);
      tube(
        T,
        [
          [0, 4.3, 1.55],
          [0, 4.4, -0.2],
        ],
        [0.75, 0.8],
        6,
        a.pierre,
      );
      fuseau(
        T,
        [
          [3.6, 0.72, 0.6, -0.55],
          [5.7, 0.58, 0.5, -0.65],
        ],
        5,
        a.pierre,
        { bas: false },
      );
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.4, 3.8, -0.4],
            [s * 0.4, 3.8, -1.5],
          ],
          0.22,
          3,
          a.pierre,
        );
      fuseau(T, NEMES_COUCHE, 4, a.moussue((k, j) => k === 1 && j === 0));
      fuseau(T, FACE_DU_SPHINX, 5, a.pierre, { bas: false });
      orbites(T, a, 0, 6.6, devant(FACE_DU_SPHINX, 5, 6.6).z, 0.14, 0.1);
    },
    veines: (T, a) => {
      for (const s of [-1, 1])
        veineSur(
          T,
          NEMES_COUCHE,
          4,
          [
            [s * 0.47, 5.5],
            [s * 0.45, 6.7],
          ],
          0.1,
          a.lueur,
        );
      veineSur(
        T,
        NEMES_COUCHE,
        4,
        [
          [-0.38, 7.55],
          [0.38, 7.55],
        ],
        0.1,
        a.lueur,
      );
    },
  },
  marais: {
    nom: 'l’Hydre',
    allume: 'ses collerettes',
    sculpture: (T, a) => {
      fuseau(T, CORPS_DE_L_HYDRE, 6, a.moussue((k, j) => k === 0 && j !== 5), { bas: false });
      for (const { ligne } of COUS) {
        tube(T, ligne, [0.4, 0.3, 0.27], 4, a.pierre);
        const [x, y, z] = ligne[2];
        fuseau(T, teteDHydre(y), 4, a.pierre, { x, z });
        orbites(T, a, x, y + 0.3, devant(teteDHydre(y), 4, y + 0.3, z).z, 0.1, 0.08);
      }
    },
    veines: (T, a) => {
      for (const {
        collerette: [y, x, z],
      } of COUS)
        fuseau(
          T,
          [
            [y, 0.42],
            [y + 0.14, 0.48],
          ],
          5,
          a.lueur,
          { x, z, bas: false },
        );
    },
  },
  comptoir: {
    nom: 'la Reine',
    allume: 'son sceptre et sa couronne',
    sculpture: (T, a) => {
      fuseau(T, ROBE_DE_LA_REINE, 8, a.moussue((k, j) => k === 0 && (j === 0 || j === 3 || j === 5)), { bas: false });
      fuseau(T, TETE_DE_LA_REINE, 6, a.pierre, { bas: false });
      tube(
        T,
        [
          [-0.6, 5.55, 0],
          [-0.95, 4.6, -0.2],
          [-0.65, 3.9, -0.75],
        ],
        0.17,
        4,
        a.pierre,
      );
      tube(
        T,
        [
          [0.6, 5.55, 0],
          [1.05, 4.7, -0.35],
          [0.95, 4.9, -0.85],
        ],
        0.17,
        4,
        a.pierre,
      );
      tube(
        T,
        [
          [0.95, 3.0, -0.85],
          [0.95, 7.0, -0.85],
        ],
        0.07,
        4,
        a.pierre,
      );
      orbites(T, a, 0, 6.4, devant(TETE_DE_LA_REINE, 6, 6.4).z, 0.12, 0.08);
    },
    veines: (T, a) => {
      fuseau(
        T,
        [
          [7.0, 0],
          [7.2, 0.16],
          [7.45, 0],
        ],
        4,
        a.lueur,
        { x: 0.95, z: -0.85 },
      );
      fuseau(
        T,
        [
          [6.85, 0.37],
          [7.2, 0.41],
        ],
        6,
        a.lueur,
        { bas: false, haut: false },
      );
      pointe(T, [0, 7.18, -0.34], 0.09, 0.82, a.lueur, [0, 0, 0], 3);
      for (const s of [-1, 1]) pointe(T, [s * 0.34, 7.18, 0], 0.08, 0.6, a.lueur, [0, 0, 0], 3);
    },
  },
  manoir: {
    nom: 'le Spectre',
    allume: 'la lanterne sous son voile',
    sculpture: (T, a) => {
      fuseau(T, VOILE, 8, a.moussue((k, j) => k === 0 && j % 3 === 0), { bas: false });
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.6, 5.8, -0.1],
            [s * 0.5, 4.7, -0.75],
            [s * 0.18, 4.45, -1.0],
          ],
          [0.2, 0.2, 0.15],
          4,
          a.pierre,
        );
    },
    veines: (T, a) =>
      fuseau(
        T,
        [
          [3.7, 0.2],
          [4.2, 0.25],
          [4.45, 0.08],
        ],
        4,
        a.lueur,
        { z: -1.1 },
      ),
  },
};
