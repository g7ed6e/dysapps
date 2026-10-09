// Les Gardiens des Premiers Rivages (6e) en sentinelles de pierre (lot R6), d'après l'intention du directeur
// artistique : la statue et ce qui s'allume. Budget serré : quinze îles, socles compris (world/budget.ts).
import type { BiomeId } from '../../../biomes';
import { pointe } from '../template';
import { devant, fuseau, parFace, pave, pose, repere, type Anneau } from '../painted';
import { dalle, orbites, plaque, tube, veine, veineSur, type Statue } from '../sentinel';
import { deTroisQuarts, dragonAssis, surLeSocle, ventreDuDragon, HAUTEUR_DU_DRAGON } from './common';

const TRONC: Anneau[] = [
  [1, 0.85],
  [1.6, 0.55],
  [4.4, 0.48],
];
/** Les trois étages de la couronne du Grand Chêne : bas, rayon du bas, haut, rayon du haut. */
const ETAGES: [number, number, number, number][] = [
  [4.2, 1.75, 5.2, 1.25],
  [5.3, 1.5, 6.35, 1.0],
  [6.45, 1.2, 8, 0.35],
];

const TORSE_DU_GOLEM: Anneau[] = [
  [2.3, 1.0, 0.7],
  [5.3, 1.4, 0.9],
  [6.1, 1.0, 0.72],
];
const TETE_DU_GOLEM: Anneau[] = [
  [5.9, 0.55, 0.5, -0.12],
  [7.5, 0.52, 0.48, -0.18],
  [8, 0.3, 0.28, -0.12],
];

/** Les couches de la stèle de la Dune : bas, haut, demi-largeur, demi-profondeur, décalage en X. */
const COUCHES: [number, number, number, number, number][] = [
  [1, 2.5, 1.45, 0.95, 0],
  [2.5, 3.9, 1.25, 0.85, 0.08],
  [3.9, 5.2, 1.08, 0.75, -0.06],
  [5.2, 6.4, 0.9, 0.64, 0.05],
];
const coucheDeDune = ([y0, y1, rx, rz]: (typeof COUCHES)[number]): Anneau[] => [
  [y0, rx, rz],
  [y1, rx * 0.93, rz * 0.93],
];

/** La tête du Taureau, décalée vers la gauche de son corps couché. */
const X_DU_TAUREAU = -0.8;
const TETE_DU_TAUREAU: Anneau[] = [
  [5.1, 0.42, 0.4, -1.3],
  [5.6, 0.55, 0.5, -1.2],
  [6.6, 0.58, 0.5, -1.0],
  [6.9, 0.4, 0.35, -0.95],
];

const CHOUETTE: Anneau[] = [
  [1.2, 0.75, 0.65],
  [2.2, 1.15, 0.95],
  [4.6, 1.25, 1.0],
  [6.2, 1.05, 0.9],
  [7.5, 0.95, 0.85],
  [8, 0.55, 0.5],
];

const HANNETON: Anneau[] = [
  [1.3, 0.7, 0.5],
  [2.4, 1.3, 0.85],
  [5.0, 1.35, 0.9],
  [6.2, 0.95, 0.7],
];
const TETE_DU_HANNETON: Anneau[] = [
  [6.1, 0.7, 0.55],
  [7.0, 0.62, 0.5],
  [7.35, 0.35, 0.3],
];

/** Le Brochet dressé, la queue en bas : son corps, qui s'arrête à la tête (la mâchoire en bec est à part). */
const BROCHET: Anneau[] = [
  [1.6, 0.3, 0.2],
  [2.4, 0.55, 0.32],
  [4.6, 0.85, 0.45],
  [6.2, 0.68, 0.4, 0, -0.05],
  [6.85, 0.42, 0.3, 0, -0.18],
];
/** Les deux lobes de la caudale en éventail (x > 0 ; l'autre en miroir) et la dorsale, près de la queue, côté +X. */
const CAUDALE: [number, number][] = [
  [0, 1.55],
  [0.1, 1.0],
  [0.9, 1.0],
  [1.25, 2.2],
  [0.25, 2.05],
];
const DORSALE: [number, number][] = [
  [0.5, 2.5],
  [1.05, 2.3],
  [1.0, 3.25],
  [0.72, 3.55],
];

/** La tête du Lion, décalée vers la gauche de son corps couché. */
const X_DU_LION = -0.75;
const CRINIERE: Anneau[] = [
  [5.7, 0.95, 0.8, -0.55],
  [7.0, 1.05, 0.9, -0.6],
  [8, 0.5, 0.45, -0.55],
];
const MUFLE: Anneau[] = [
  [5.95, 0.36, 0.3, -1.35],
  [6.75, 0.5, 0.36, -1.35],
  [7.2, 0.38, 0.3, -1.3],
];
/** Le quai du Lion, avant d'être tourné : x0, z0, x1, z1. */
const QUAI = [-1.6, -1.2, 1.3, 0.8] as const;
/** La lanterne du Lion (×1,9), posée sur le quai. */
const LANTERNE_DU_LION: Anneau[] = [
  [3.9, 0.38],
  [5.1, 0.47],
  [5.7, 0],
];

const TOUR_DU_COUCOU: Anneau[] = [
  [1, 1.2, 1.0],
  [5.9, 1.05, 0.9],
];

/** L'Amphore peinte : le pied, la panse, l'épaule, le col et la lèvre. */
const AMPHORE: Anneau[] = [
  [1, 0.5],
  [1.7, 0.42],
  [2.8, 1.25],
  [4.6, 1.4],
  [5.9, 0.85],
  [6.5, 0.42],
  [7.6, 0.42],
  [8, 0.62],
];

/** Le Castor de glaise, assis : le corps, puis la tête au museau avancé. */
const CORPS_DU_CASTOR: Anneau[] = [
  [1, 1.0, 0.85],
  [3.0, 1.2, 1.0],
  [5.0, 0.85, 0.75],
  [5.6, 0.5, 0.45],
];
const TETE_DU_CASTOR: Anneau[] = [
  [5.4, 0.62, 0.55, -0.15],
  [7.3, 0.58, 0.52, -0.3],
  [8, 0.3, 0.28, -0.3],
];

/** Le corps du Cerf des sous-bois, couché le long de X (`repere`, un quart de tour) : la croupe, le ventre, le poitrail. */
const CORPS_DU_CERF: Anneau[] = [
  [0, 0.42],
  [0.5, 0.68],
  [2.3, 0.66],
  [2.8, 0.4],
];
/** La tête du Cerf, au bout du cou, le museau en bas. */
const TETE_DU_CERF: Anneau[] = [
  [4.6, 0.22],
  [5.0, 0.32],
  [5.6, 0.3],
  [5.9, 0.16],
];

/** Le ballon de l'Alambic de verre : le fond, la panse, l'épaule, le col et sa lèvre. */
const BALLON: Anneau[] = [
  [3.0, 0.35],
  [3.4, 1.0],
  [4.3, 1.25],
  [5.2, 1.0],
  [5.7, 0.34],
  [7.7, 0.28],
  [8, 0.38],
];
/**
 * L'Hirondelle de nacre (DA, relecture des captures emc-2 : un oiseau, pas un totem) : le corps fuselé, des pattes aux
 * épaules, puis la tête, ronde et courte, jusqu'à huit blocs.
 */
const CORPS_DE_L_HIRONDELLE: Anneau[] = [
  [1, 0.3],
  [2.4, 0.78, 0.66],
  [4.8, 0.74, 0.62],
  [6.15, 0.45, 0.42],
];
const TETE_DE_L_HIRONDELLE: Anneau[] = [
  [6.0, 0.42, 0.4],
  [6.6, 0.68, 0.62],
  [7.5, 0.66, 0.6],
  [8, 0.3, 0.28],
];
/**
 * L'aile droite de l'Hirondelle, de face (x, y), en faux : de l'épaule, elle file vers l'extérieur, puis plonge vers sa
 * pointe, presque au socle ; deux pièces convexes, l'emplanture et la lame, qui se touchent sur son bord intérieur, droit.
 * La gauche en miroir.
 */
const EMPLANTURE_DE_L_AILE: [number, number][] = [
  [0.3, 6.4],
  [1.5, 5.9],
  [1.84, 4.4],
  [0.45, 4.5],
];
const LAME_DE_L_AILE: [number, number][] = [
  [1.5, 5.9],
  [2.35, 4.7],
  [2.5, 1.5],
];
/** Le brin droit de sa queue fourchue (x, y), derrière le corps, qui s'écarte sous lui en pointe pour se voir de face ; le gauche en miroir. */
const BRIN_DE_LA_QUEUE: [number, number][] = [
  [0, 3.1],
  [0.5, 3.1],
  [1.9, 1.75],
];

/** Le petit flacon où tombe le bec. */
const FLACON: Anneau[] = [
  [1, 0.42],
  [1.8, 0.45],
  [2.2, 0.16],
  [2.6, 0.16],
];

export const STATUES_6E: Partial<Record<BiomeId, Statue>> = {
  'french-6e-phonology': {
    nom: 'le Grand Chêne',
    allume: 'les nervures de sa couronne',
    sculpture: (T, a) => {
      fuseau(T, TRONC, 5, a.moussue((k, j) => k === 0 && j !== 4), { bas: false, haut: false });
      for (const [y0, r0, y1, r1] of ETAGES)
        fuseau(
          T,
          [
            [y0, r0],
            [y1, r1],
          ],
          6,
          a.pierre,
        );
      orbites(T, a, 0, 3.3, devant(TRONC, 5, 3.3).z, 0.14, 0.15);
    },
    veines: (T, a) => {
      for (const [y0, r0, y1, r1] of ETAGES)
        veineSur(
          T,
          [
            [y0, r0],
            [y1, r1],
          ],
          6,
          [
            [-0.32, y1 - 0.12],
            [0, y0 + 0.14],
            [0.32, y1 - 0.12],
          ],
          0.08 * a.veines,
          a.lueur,
        );
    },
  },
  'french-6e-letter-confusion': {
    nom: 'le Golem de roche',
    allume: 'la gemme de sa poitrine',
    sculpture: (T, a) => {
      for (const s of [-1, 1])
        fuseau(
          T,
          [
            [1, 0.45],
            [2.6, 0.38],
          ],
          5,
          a.moussue((_k, j) => j === 1),
          { x: s * 0.55, bas: false, haut: false },
        );
      fuseau(T, TORSE_DU_GOLEM, 6, a.pierre);
      fuseau(T, TETE_DU_GOLEM, 5, a.pierre, { bas: false });
      for (const s of [-1, 1])
        fuseau(
          T,
          [
            [2.8, 0.36, 0.36, 0, s * 0.12],
            [5.5, 0.42],
          ],
          4,
          a.moussue((_k, j) => j === 2),
          { x: s * 1.5 },
        );
      orbites(T, a, 0, 7.0, devant(TETE_DU_GOLEM, 5, 7.0).z, 0.2, 0.14);
    },
    veines: (T, a) => {
      plaque(T, 0, 4.4, 0.28, 0.38, 4, a.lueur, (y) => devant(TORSE_DU_GOLEM, 6, y).z);
      veineSur(
        T,
        TORSE_DU_GOLEM,
        6,
        [
          [-0.22, 4.15],
          [-0.5, 3.5],
          [-0.42, 2.8],
        ],
        0.07 * a.veines,
        a.lueur,
      );
      veineSur(
        T,
        TORSE_DU_GOLEM,
        6,
        [
          [0.2, 4.72],
          [0.55, 5.2],
        ],
        0.07 * a.veines,
        a.lueur,
      );
    },
  },
  'french-6e-word-spelling': {
    nom: 'la Dune vivante',
    allume: 'ses strates',
    sculpture: (T, a) => {
      COUCHES.forEach((c, i) => fuseau(T, coucheDeDune(c), 4, i === 0 ? a.moussue((_k, j) => j === 0 || j === 2) : a.pierre, { x: c[4], bas: i > 0 }));
      fuseau(
        T,
        [
          [6.4, 0.72, 0.52],
          [7.3, 0.55, 0.42],
          [8, 0],
        ],
        4,
        a.pierre,
      );
      const c = COUCHES[3];
      orbites(T, a, c[4], 5.85, devant(coucheDeDune(c), 4, 5.85).z, 0.2, 0.13);
    },
    veines: (T, a) => {
      for (const c of COUCHES.slice(0, 3)) {
        const w = c[2] * 0.93 * Math.SQRT1_2 * 0.85;
        const y = c[1] - 0.28;
        veineSur(
          T,
          coucheDeDune(c),
          4,
          [
            [-w, y],
            [-w * 0.2, y + 0.08],
            [w, y - 0.04],
          ],
          // Au moins 0,12 de large (référent dys, 28/09) : plus fine, la veine se perdait sur le grès, éteinte ou non.
          0.12 * a.veines,
          a.lueur,
          { x: c[4] },
        );
      }
    },
  },
  'french-6e-grammar-spelling': {
    nom: 'le Taureau couché',
    allume: 'son joug',
    sculpture: (T, a) => {
      // Couché de trois-quarts sur son pilier, l'avant vers l'élève, la tête tournée vers lui.
      const C = deTroisQuarts(T, X_DU_TAUREAU);
      fuseau(
        C,
        [
          [1, 1.65, 1.15],
          [3.2, 1.55, 1.05],
        ],
        4,
        a.moussue((_k, j) => j === 0 || j === 2),
        { bas: false },
      );
      tube(
        C,
        [
          [1.45, 4.15, 0.2],
          [-0.5, 4.25, 0],
        ],
        [0.95, 1.05],
        6,
        a.pierre,
      );
      fuseau(T, TETE_DU_TAUREAU, 5, a.pierre, { x: X_DU_TAUREAU });
      for (const s of [-1, 1])
        tube(
          T,
          [
            [X_DU_TAUREAU + s * 0.42, 6.65, -0.95],
            [X_DU_TAUREAU + s * 1.0, 7.05, -0.95],
            [X_DU_TAUREAU + s * 1.12, 8, -1.05],
          ],
          [0.15, 0.1, 0],
          4,
          a.pierre,
        );
      orbites(T, a, X_DU_TAUREAU, 6.3, devant(TETE_DU_TAUREAU, 5, 6.3).z, 0.22, 0.13);
    },
    veines: (T, a) => pave(T, X_DU_TAUREAU - 1.1, 5.3, -0.62, X_DU_TAUREAU + 1.1, 5.55, -0.38, a.lueur),
  },
  'french-6e-reading': {
    nom: 'la Chouette de verre',
    allume: 'le vitrail de son poitrail',
    sculpture: (T, a) => {
      fuseau(T, CHOUETTE, 6, a.moussue((k, j) => k === 0 && j !== 5));
      for (const s of [-1, 1])
        fuseau(
          T,
          [
            [2.4, 0.25, 0.62, 0.1],
            [5.9, 0.16, 0.8, 0.15],
          ],
          4,
          a.pierre,
          { x: s * 1.22 },
        );
      const z = devant(CHOUETTE, 6, 6.85).z;
      orbites(T, a, 0, 6.85, z, 0.3, 0.3);
      pointe(T, [0, 6.5, z + 0.04], 0.1, 0.36, a.pierre, [-(Math.PI / 2 + 0.4), 0, 0], 3);
    },
    veines: (T, a) => {
      const z = (y: number) => devant(CHOUETTE, 6, y).z;
      plaque(T, 0, 4.95, 0.18, 0.32, 4, a.lueur, z);
      plaque(T, -0.32, 4.15, 0.16, 0.28, 4, a.lueur, z);
      plaque(T, 0.32, 4.15, 0.16, 0.28, 4, a.lueur, z);
    },
  },
  'maths-6e-calculation': {
    nom: 'le Hanneton de bronze',
    allume: 'la jointure de ses élytres',
    sculpture: (T, a) => {
      fuseau(T, HANNETON, 6, a.moussue((k, j) => k === 0 && j % 2 === 1));
      fuseau(T, TETE_DU_HANNETON, 5, a.pierre, { bas: false });
      for (const s of [-1, 1]) {
        pointe(T, [s * 0.3, 7.2, -0.15], 0.06, 0.8514, a.pierre, [0, 0, -s * 0.35], 3);
        for (let i = 0; i < 3; i++) pointe(T, [s * 1.1, 2.3 + i * 1.3, 0.2], 0.12, 0.9, a.pierre, [0, 0, -s * (2.0 - i * 0.35)], 3);
      }
      orbites(T, a, 0, 6.7, devant(TETE_DU_HANNETON, 5, 6.7).z, 0.2, 0.13);
    },
    veines: (T, a) => {
      veineSur(
        T,
        HANNETON,
        6,
        [
          [0, 1.7],
          [0, 5.9],
        ],
        0.09 * a.veines,
        a.lueur,
      );
      veineSur(
        T,
        HANNETON,
        6,
        [
          [-0.45, 5.92],
          [0.45, 5.92],
        ],
        0.08 * a.veines,
        a.lueur,
      );
    },
  },
  'maths-6e-fractions': {
    nom: 'le Brochet d’argent',
    allume: 'la bande de son flanc',
    sculpture: (T, a) => {
      fuseau(T, BROCHET, 6, a.moussue((k, j) => k === 0 && j !== 5));
      // La caudale en éventail, posée sur le socle, et la dorsale, en plaques minces.
      for (const s of [-1, 1])
        dalle(
          T,
          CAUDALE.map(([x, y]): [number, number] => [s * x, y]),
          -0.07,
          0.07,
          a.pierre,
        );
      dalle(T, DORSALE, -0.06, 0.06, a.pierre);
      // La tête levée, la mâchoire en bec entrouverte : le bec du haut, long, jusqu'au sommet, celui du bas, plus court.
      pointe(T, [-0.2, 6.75, 0], 0.3, 1.25 / Math.cos(0.32), a.pierre, [0, 0, 0.32], 4, 0.2);
      pointe(T, [0.02, 6.7, 0], 0.22, 0.75, a.pierre, [0, 0, -0.2], 4, 0.16);
      orbites(T, a, -0.15, 6.45, devant(BROCHET, 6, 6.45).z, 0, 0.15);
    },
    veines: (T, a) => {
      veineSur(
        T,
        BROCHET,
        6,
        [
          [0, 2.5],
          [0.1, 3.8],
          [0, 5.2],
          [-0.08, 6.1],
        ],
        0.16 * a.veines,
        a.lueur,
      );
      veineSur(
        T,
        BROCHET,
        6,
        [
          [-0.24, 3.4],
          [-0.2, 4.2],
        ],
        0.12 * a.veines,
        a.lueur,
      );
    },
  },
  'maths-6e-decimals': {
    nom: 'le Dragon de cendre',
    allume: 'son ventre de braise',
    sculpture: (T, a) => dragonAssis(surLeSocle(T, 1, 7 / HAUTEUR_DU_DRAGON), a, 'repliees'),
    veines: (T, a) => ventreDuDragon(surLeSocle(T, 1, 7 / HAUTEUR_DU_DRAGON), a),
  },
  'english-6e-vocabulary': {
    nom: 'le Lion de pierre',
    allume: 'la lanterne devant ses pattes',
    sculpture: (T, a) => {
      // Couché de trois-quarts sur son quai, les pattes devant lui ; seule la tête se tourne vers l'élève.
      const C = deTroisQuarts(T, X_DU_LION);
      pave(C, QUAI[0], 1, QUAI[1], QUAI[2], 3.9, QUAI[3], a.pierre);
      tube(
        C,
        [
          [1.3, 4.6, 0.15],
          [-0.3, 4.75, 0],
        ],
        [0.7, 0.85],
        6,
        a.pierre,
      );
      for (const s of [-1, 1])
        tube(
          C,
          [
            [X_DU_LION + s * 0.45, 4.15, -0.1],
            [X_DU_LION + s * 0.45, 4.15, -0.62],
          ],
          0.25,
          3,
          a.pierre,
        );
      fuseau(T, CRINIERE, 6, a.moussue((k, j) => k === 1 && (j === 1 || j === 3)), { x: X_DU_LION, bas: false });
      fuseau(T, MUFLE, 5, a.pierre, { x: X_DU_LION, bas: false });
      orbites(T, a, X_DU_LION, 6.62, devant(MUFLE, 5, 6.62).z, 0.18, 0.12);
    },
    // La lanterne, près de deux fois plus grande, posée sur le quai devant les pattes.
    veines: (T, a) => fuseau(deTroisQuarts(T, X_DU_LION), LANTERNE_DU_LION, 4, a.lueur, { x: X_DU_LION, z: -0.9 }),
  },
  'english-6e-grammar': {
    nom: 'le Coucou',
    allume: 'son cadran',
    sculpture: (T, a) => {
      fuseau(T, TOUR_DU_COUCOU, 4, a.moussue((_k, j) => j === 0), { bas: false });
      fuseau(
        T,
        [
          [5.8, 1.5, 1.3],
          [6.0, 1.45, 1.25],
          [8, 0],
        ],
        4,
        a.pierre,
      );
      // Les deux poids en pomme de pin, au bout de leurs chaînes.
      for (const s of [-1, 1]) {
        tube(
          T,
          [
            [s * 0.45, 3.0, -0.95],
            [s * 0.45, 2.2, -0.95],
          ],
          0.04,
          3,
          a.pierre,
        );
        pointe(T, [s * 0.45, 2.25, -0.95], 0.14, 0.7, a.pierre, [Math.PI, 0, 0], 4);
      }
      // L'oiseau à sa fenêtre, au-dessus du cadran.
      tube(
        T,
        [
          [0, 5.2, -0.85],
          [0, 5.3, -1.4],
        ],
        [0.28, 0.22],
        5,
        a.pierre,
      );
      pointe(T, [0, 5.3, -1.38], 0.07, 0.28, a.pierre, [-Math.PI / 2, 0, 0], 3);
      orbites(T, a, 0, 5.42, -1.42, 0.11, 0.07);
      // Les aiguilles, devant le cadran.
      const z = devant(TOUR_DU_COUCOU, 4, 3.8).z - 0.03;
      pave(T, -0.03, 3.8, z - 0.02, 0.03, 4.25, z, a.pierre);
      pave(T, -0.03, 3.77, z - 0.02, 0.32, 3.83, z, a.pierre);
    },
    veines: (T, a) => plaque(T, 0, 3.8, 0.6, 0.6, 8, a.lueur, (y) => devant(TOUR_DU_COUCOU, 4, y).z),
  },
  // Archipéo est en pause (2 octobre 2026) : ces deux sentinelles n'ont que le strict nécessaire (budget de l'archipel).
  'history-6e-antiquity': {
    nom: 'l’Amphore peinte',
    allume: 'ses bandes peintes',
    sculpture: (T, a) => {
      fuseau(T, AMPHORE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      // Les deux anses, du col à l'épaule.
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.4, 7.3, 0],
            [s * 1.0, 7.1, 0],
            [s * 0.95, 5.95, 0],
          ],
          0.1,
          3,
          a.pierre,
        );
      orbites(T, a, 0, 5.1, devant(AMPHORE, 6, 5.1).z, 0.3, 0.16);
    },
    veines: (T, a) => {
      // Deux bandes peintes, sur la panse et sous l'épaule.
      for (const y of [3.6, 5.6])
        veineSur(
          T,
          AMPHORE,
          6,
          [
            [-0.6, y],
            [0.6, y],
          ],
          0.09 * a.veines,
          a.lueur,
        );
    },
  },
  'geography-6e-living': {
    nom: 'le Castor de glaise',
    allume: 'les traits de son pelage',
    sculpture: (T, a) => {
      fuseau(T, CORPS_DU_CASTOR, 6, a.moussue((k, j) => k === 0 && j % 2 === 1), { bas: false });
      fuseau(T, TETE_DU_CASTOR, 5, a.pierre, { bas: false });
      // La queue en dalle plate, posée derrière lui.
      pave(T, -0.55, 1, 0.8, 0.55, 1.25, 2.3, a.pierre);
      orbites(T, a, 0, 7.0, devant(TETE_DU_CASTOR, 5, 7.0).z, 0.2, 0.12);
    },
    veines: (T, a) => plaque(T, 0, 3.0, 0.45, 0.6, 6, a.lueur, (y) => devant(CORPS_DU_CASTOR, 6, y).z),
  },
  // Archipéo est en pause (2 octobre 2026) : ces trois sentinelles n'ont que le strict nécessaire (budget de l'archipel).
  'life-earth-sciences-6e-living-world': {
    nom: 'le Cerf des sous-bois',
    allume: 'la mousse de son flanc',
    sculpture: (T, a) => {
      // Debout, de profil (DA, SC-2) : quatre pattes, le corps le long de X, le cou et la tête au bout, la mousse au dos.
      for (const x of [-1.2, 0.6]) for (const z of [-0.25, 0.25]) tube(T, [[x, 1, z], [x, 2.75, z]], 0.13, 3, a.pierre);
      fuseau(pose(T, repere([-1.7, 3.3, 0], 0, 0, -Math.PI / 2)), CORPS_DU_CERF, 6, a.moussue((k, j) => k === 1 && j % 2 === 0), { bas: false });
      tube(T, [[0.8, 3.5, 0], [1.2, 4.7, 0]], 0.24, 4, a.pierre);
      fuseau(T, TETE_DU_CERF, 5, a.pierre, { x: 1.25, bas: false });
      orbites(T, a, 1.25, 5.3, devant(TETE_DU_CERF, 5, 5.3).z, 0.15, 0.1);
      // Les bois ramifiés : de chaque côté une perche et deux andouillers, trois pointes ; la perche finit à huit blocs.
      for (const c of [-1, 1]) {
        const x = (d: number) => 1.25 + c * d;
        tube(T, [[x(0.15), 5.75, 0], [x(0.5), 6.6, 0], [x(0.8), 8, 0]], [0.07, 0.07, 0], 3, a.pierre);
        tube(T, [[x(0.4), 6.3, 0], [x(0.25), 7.1, 0]], [0.06, 0], 3, a.pierre);
        tube(T, [[x(0.62), 7.1, 0], [x(1.1), 7.5, 0]], [0.06, 0], 3, a.pierre);
      }
    },
    veines: (T, a) => plaque(T, -0.3, 3.3, 0.7, 0.28, 6, a.lueur, () => -0.6),
  },
  'physics-chemistry-6e-matter-energy': {
    nom: 'l’Alambic de verre',
    allume: 'le liquide de son ballon',
    sansFlamme: true,
    sculpture: (T, a) => {
      // Le trépied de bois, le ballon et son long col, le bec courbe qui descend dans un petit flacon. Aucune flamme.
      for (const t of [0, 1, 2]) {
        const ang = (t / 3) * Math.PI * 2 + Math.PI / 2;
        tube(T, [[Math.cos(ang) * 0.9, 1, Math.sin(ang) * 0.9], [Math.cos(ang) * 0.6, 3.2, Math.sin(ang) * 0.6]], 0.09, 3, a.pierre);
      }
      fuseau(T, BALLON, 7, a.moussue((k, j) => k === 0 && j % 3 === 0), { bas: false });
      tube(T, [[0.2, 7.2, 0], [1.1, 7.4, 0], [1.8, 6.3, 0], [1.9, 2.7, 0]], 0.1, 4, a.pierre);
      fuseau(T, FLACON, 6, a.pierre, { x: 1.9, bas: false });
      orbites(T, a, 0, 4.6, devant(BALLON, 7, 4.6).z, 0.3, 0.15);
    },
    veines: (T, a) => plaque(T, 0, 3.8, 0.6, 0.3, 6, a.lueur, (y) => devant(BALLON, 7, y).z),
  },
  'technology-6e-objects': {
    nom: 'l’Automate de laiton',
    allume: 'les boutons de sa poitrine',
    sculpture: (T, a) => {
      // Trapu, sans antenne ni visage-écran (DA, SC-2) : deux jambes courtes, un corps carré, une tête-cube à deux
      // hublots sur un cou court, la grande clé de remontage dans le dos.
      for (const x of [-0.55, 0.25]) pave(T, x, 1, -0.35, x + 0.3, 2.8, 0.35, a.pierre);
      pave(T, -1, 2.8, -0.7, 1, 5.8, 0.7, a.pierre);
      for (const c of [-1, 1]) pave(T, c > 0 ? 1 : -1.3, 3.9, -0.25, c > 0 ? 1.3 : -1, 5.6, 0.25, a.pierre);
      pave(T, -0.3, 5.8, -0.3, 0.3, 6.6, 0.3, a.pierre);
      pave(T, -0.62, 6.6, -0.6, 0.62, 8, 0.6, a.pierre);
      orbites(T, a, 0, 7.3, -0.6, 0.28, 0.22);
      // La clé : une tige, puis l'anneau de la poignée, debout derrière le dos.
      tube(T, [[0, 4.4, 0.7], [0, 4.4, 1.15]], 0.08, 3, a.pierre);
      const anneauDeLaCle = Array.from({ length: 7 }, (_, i): [number, number, number] => {
        const ang = (i / 6) * Math.PI * 2;
        return [Math.cos(ang) * 0.45, 4.4 + Math.sin(ang) * 0.45, 1.2];
      });
      tube(T, anneauDeLaCle, 0.08, 3, a.pierre);
    },
    veines: (T, a) => {
      // Les trois boutons en colonne sur la poitrine.
      for (const y of [3.6, 4.3, 5.0]) plaque(T, 0, y, 0.16, 0.16, 5, a.lueur, () => -0.7);
    },
  },
  // EMC 6e (EMC-2) : le strict nécessaire, Archipéo étant en pause. L'Hirondelle de nacre, sans flamme ni symbole : de
  // face, la tête ronde et courte, le bec fin, les ailes ouvertes en faux qui plongent jusqu'au socle, la queue fourchue
  // qui s'écarte sous le corps ; le dos de nacre, le ventre blanc, la gorge rose une fois rallumée (DA, relecture des
  // captures emc-2). Ce sont les plumes de ses ailes qui s'allument.
  'civics-6e-democratic-society': {
    nom: 'l’Hirondelle de nacre',
    allume: 'les plumes de ses ailes',
    sansFlamme: true,
    sculpture: (T, a) => {
      // Le ventre blanc devant (la face 5), la gorge rose en haut de la poitrine ; le reste de nacre.
      fuseau(T, CORPS_DE_L_HIRONDELLE, 6, parFace((k, j) => (j === 5 ? (k === 2 ? a.gorge : a.ventre) : k === 1 && (j === 0 || j === 4) ? a.ventre : a.nacre)), { bas: false });
      // La tête : la gorge rose sous le bec (la face de devant, en bas), le reste de nacre.
      fuseau(T, TETE_DE_L_HIRONDELLE, 5, parFace((k, j) => (k === 0 && j === 4 ? a.gorge : a.nacre)), { bas: false });
      // Le bec, fin et court, vers l'avant.
      pointe(T, [0, 6.75, devant(TETE_DE_L_HIRONDELLE, 5, 6.75).z + 0.05], 0.1, 0.5, a.nacre, [-Math.PI / 2, 0, 0], 3);
      // Les ailes en faux, minces : l'emplanture, puis la lame qui plonge.
      for (const c of [-1, 1])
        for (const piece of [EMPLANTURE_DE_L_AILE, LAME_DE_L_AILE]) dalle(T, piece.map(([x, y]): [number, number] => [c * x, y]), -0.12, 0.12, a.nacre);
      // La queue fourchue, derrière : deux brins qui s'écartent vers le bas, de part et d'autre du corps.
      for (const c of [-1, 1]) dalle(T, BRIN_DE_LA_QUEUE.map(([x, y]): [number, number] => [c * x, y]), 0.15, 0.3, a.nacre);
      orbites(T, a, 0, 7.15, devant(TETE_DE_L_HIRONDELLE, 5, 7.15).z, 0.28, 0.13);
    },
    veines: (T, a) => {
      // Un fil de lueur le long de chaque aile, de l'épaule à la lame.
      for (const c of [-1, 1])
        veine(
          T,
          [
            [c * 0.75, 6.05],
            [c * 1.7, 5.3],
            [c * 2.25, 3.0],
          ],
          0.09 * a.veines,
          a.lueur,
          () => -0.13,
        );
    },
  },
};
