// Les Gardiens de L'Horizon (3e) en sentinelles de pierre (lot R6), d'après l'intention du directeur artistique : la
// statue et ce qui s'allume. Six îles pour 1 800 triangles, socles compris.
import type { BiomeId } from '../../../biomes';
import { devant, facette, fuseau, pave, pose, repere, type Anneau, type V3 } from '../peint';
import { dalle, etoile, orbites, tube, veine, veineSur, type Statue } from '../sentinelle';
import { ailesDeployees, dragonAssis, HAUTEUR_DU_DRAGON, surLeSocle } from './communes';

const CORPS_DU_SPHINX: Anneau[] = [
  [2.2, 1.1, 1.2, 0.2],
  [3.5, 1.0, 1.1, 0.2],
  [5.2, 0.65, 0.6, -0.1],
];
/** La coiffe, élargie aux épaules en trapèze. */
const NEMES: Anneau[] = [
  [5.0, 1.4, 0.55, -0.2],
  [6.6, 0.74, 0.5, -0.2],
  [7.6, 0.5, 0.45, -0.15],
  [8, 0.2, 0.2, -0.1],
];
const FACE: Anneau[] = [
  [5.4, 0.3, 0.25, -0.6],
  [6.9, 0.38, 0.28, -0.62],
  [7.2, 0.28, 0.2, -0.58],
];

const ROBE_DU_COMPTABLE: Anneau[] = [
  [1, 1.25, 1.05],
  [3.2, 0.95, 0.8],
  [5.4, 0.6, 0.5],
];
const CHAPEAU_POINTU: Anneau[] = [
  [6.2, 0.5],
  [8, 0],
];

/** Le dragon de lumière, assis au sommet de sa colonne (à l'échelle 0,70, la colonne au tiers de la hauteur). */
const DRAGON_DU_PHARE = { e: 0.7, base: 8 - 0.7 * HAUTEUR_DU_DRAGON, ailes: 1.2 } as const;
const COLONNE: Anneau[] = [
  [1, 0.9],
  [1.3, 0.8],
  [DRAGON_DU_PHARE.base - 0.25, 0.72],
  [DRAGON_DU_PHARE.base, 1.0],
];

const ROBE_DU_LECTEUR: Anneau[] = [
  [1, 1.2, 1.0],
  [3.4, 0.9, 0.75],
  [5.9, 0.7, 0.55],
  [6.4, 0.45, 0.4],
];
const TETE_DU_LECTEUR: Anneau[] = [
  [6.3, 0.36],
  [7.4, 0.38],
  [7.6, 0.3],
];
/** Le livre ouvert du Lecteur, tenu devant lui et penché vers l'élève. */
const LIVRE_OUVERT = repere([0, 4.95, -1.15], -1.0, 0, 0);

/** Les quatre pieds de la Grande Antenne (au sol, puis au sommet) et les hauteurs de ses ceintures. */
const PIED = { bas: 1.0, haut: 0.14, sommet: 7.3 } as const;
const CEINTURES = [2.7, 4.3, 5.8];
const aLaHauteur = (y: number) => PIED.bas + ((PIED.haut - PIED.bas) * (y - 1)) / (PIED.sommet - 1);

/** La pointe de l'écu, à ~0,3 bloc au-dessus de la flamme. */
const BAS_DE_L_ECU = 2.35;
/** Le contour de l'écu (x, y), et son plan. */
const ECU: [number, number][] = (
  [
    [-1.0, 2.7],
    [-1.0, 1.3],
    [-0.6, 0.4],
    [0, 0],
    [0.6, 0.4],
    [1.0, 1.3],
    [1.0, 2.7],
  ] as [number, number][]
).map(([x, y]) => [x, BAS_DE_L_ECU + y]);
const ECU_Z = [-1.2, -0.98] as const;

export const STATUES_3E: Partial<Record<BiomeId, Statue>> = {
  belvedere: {
    nom: 'le Sphinx de marbre',
    allume: 'les rayures de sa coiffe',
    sculpture: (T, a) => {
      fuseau(
        T,
        [
          [1, 1.3, 1.0],
          [2.2, 1.2, 0.95],
        ],
        4,
        a.moussue((_k, j) => j === 0 || j === 3),
        { bas: false },
      );
      fuseau(T, CORPS_DU_SPHINX, 6, a.pierre);
      // Les deux pattes avant, du poitrail jusque sur le socle, les griffes vers l'élève (un lion à tête humaine).
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.5, 4.2, -0.6],
            [s * 0.6, 1.25, -0.95],
            [s * 0.62, 1.24, -1.62],
          ],
          [0.24, 0.24, 0.22],
          4,
          a.pierre,
        );
      fuseau(T, NEMES, 4, a.pierre, { bas: false });
      fuseau(T, FACE, 5, a.pierre, { bas: false });
      orbites(T, a, 0, 6.5, devant(FACE, 5, 6.5).z, 0.13, 0.09);
    },
    veines: (T, a) => {
      for (const s of [-1, 1])
        veineSur(
          T,
          NEMES,
          4,
          [
            [s * 0.78, 5.2],
            [s * 0.46, 6.6],
          ],
          0.09,
          a.lueur,
        );
      veineSur(
        T,
        NEMES,
        4,
        [
          [-0.32, 7.35],
          [0.32, 7.35],
        ],
        0.09,
        a.lueur,
      );
    },
  },
  donnees: {
    nom: 'le Comptable',
    allume: 'les étoiles gravées de sa robe',
    sculpture: (T, a) => {
      fuseau(T, ROBE_DU_COMPTABLE, 8, a.moussue((k, j) => k === 0 && (j === 1 || j === 4 || j === 6)), { bas: false });
      // Les manches jointes devant, les mains dedans.
      tube(
        T,
        [
          [-0.55, 5.1, 0],
          [-0.3, 4.3, -0.62],
          [0.3, 4.3, -0.62],
          [0.55, 5.1, 0],
        ],
        0.2,
        4,
        a.pierre,
      );
      fuseau(
        T,
        [
          [5.3, 0.3],
          [6.2, 0.34],
        ],
        6,
        a.pierre,
        { bas: false },
      );
      // La barbe en pointe, sous le menton.
      fuseau(
        T,
        [
          [4.8, 0, 0, -0.34],
          [5.6, 0.2, 0.12, -0.28],
        ],
        4,
        a.pierre,
        { haut: true },
      );
      fuseau(
        T,
        [
          [6.1, 0.95],
          [6.22, 0.95],
        ],
        8,
        a.pierre,
      );
      fuseau(T, CHAPEAU_POINTU, 6, a.pierre, { bas: false });
      orbites(
        T,
        a,
        0,
        5.9,
        devant(
          [
            [5.3, 0.3],
            [6.2, 0.34],
          ],
          6,
          5.9,
        ).z,
        0.11,
        0.08,
      );
    },
    veines: (T, a) => {
      etoile(T, 0, 6.75, 0.2, 4, a.lueur, (y) => devant(CHAPEAU_POINTU, 6, y).z);
      const robe = (y: number) => devant(ROBE_DU_COMPTABLE, 8, y).z;
      etoile(T, -0.28, 2.4, 0.22, 4, a.lueur, robe);
      etoile(T, 0.22, 3.3, 0.17, 4, a.lueur, robe);
    },
  },
  phare: {
    nom: 'le Dragon de lumière',
    allume: 'ses ailes de verre',
    sculpture: (T, a) => {
      fuseau(T, COLONNE, 6, a.moussue((k, j) => k === 0 || (k === 1 && j === 2)), { bas: false });
      dragonAssis(surLeSocle(T, DRAGON_DU_PHARE.base, DRAGON_DU_PHARE.e), a, 'deployees');
    },
    veines: (T, a) => ailesDeployees(surLeSocle(T, DRAGON_DU_PHARE.base, DRAGON_DU_PHARE.e), a.lueur, DRAGON_DU_PHARE.ailes),
  },
  textes: {
    nom: 'le Grand Lecteur',
    allume: 'les pages de son livre',
    sculpture: (T, a) => {
      fuseau(T, ROBE_DU_LECTEUR, 8, a.moussue((k, j) => k === 0 && j % 3 === 1), { bas: false });
      fuseau(T, TETE_DU_LECTEUR, 6, a.pierre, { bas: false });
      fuseau(
        T,
        [
          [7.5, 0.4],
          [8, 0.22],
        ],
        6,
        a.pierre,
        { bas: false },
      );
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.6, 6.0, 0],
            [s * 0.6, 5.0, -0.5],
            [s * 0.4, 4.95, -1.05],
          ],
          0.18,
          4,
          a.pierre,
        );
      pave(pose(T, LIVRE_OUVERT), -0.62, -0.08, -0.42, 0.62, 0, 0.42, a.pierre);
      orbites(T, a, 0, 6.85, devant(TETE_DU_LECTEUR, 6, 6.85).z, 0.13, 0.09);
    },
    veines: (T, a) => {
      const L = pose(T, LIVRE_OUVERT);
      for (const s of [-1, 1])
        facette(
          L,
          [
            [s * 0.57, 0.01, -0.37],
            [s * 0.03, 0.07, -0.37],
            [s * 0.03, 0.07, 0.37],
            [s * 0.57, 0.01, 0.37],
          ],
          [s * 0.3, -1, 0],
          a.lueur,
        );
    },
  },
  studio: {
    nom: 'la Grande Antenne',
    allume: 'son voyant',
    sculpture: (T, a) => {
      const coins = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      for (const [sx, sz] of coins)
        tube(
          T,
          [
            [sx * PIED.bas, 1, sz * PIED.bas],
            [sx * PIED.haut, PIED.sommet, sz * PIED.haut],
          ],
          [0.1, 0.06],
          3,
          a.pierre,
        );
      for (const y of CEINTURES) {
        const r = aLaHauteur(y);
        tube(
          T,
          [...coins, coins[0]].map(([sx, sz]): V3 => [sx * r, y, sz * r]),
          0.045,
          3,
          a.pierre,
        );
      }
      // Les croix du devant, d'une ceinture à l'autre.
      const niveaux = [1, ...CEINTURES];
      for (let i = 0; i + 1 < niveaux.length; i++) {
        const [y0, y1] = [niveaux[i], niveaux[i + 1]];
        const [r0, r1] = [aLaHauteur(y0), aLaHauteur(y1)];
        for (const s of [-1, 1])
          tube(
            T,
            [
              [s * r0, y0, -r0],
              [-s * r1, y1, -r1],
            ],
            0.035,
            3,
            a.pierre,
          );
      }
      tube(
        T,
        [
          [0, PIED.sommet - 0.3, 0],
          [0, 7.7, 0],
        ],
        0.06,
        4,
        a.pierre,
      );
      // L'antenne parabolique, tournée vers l'élève.
      const cy = 6.3;
      const z = -aLaHauteur(cy) - 0.08;
      const disque: V3[] = Array.from({ length: 6 }, (_, i) => {
        const ang = (i / 6) * Math.PI * 2;
        return [0.45 * Math.cos(ang), cy + 0.45 * Math.sin(ang), z];
      });
      facette(T, disque, [0, cy, z + 1], a.pierre);
      facette(
        T,
        disque.map(([x, y]): V3 => [x, y, z + 0.05]),
        [0, cy, z - 1],
        a.pierre,
      );
    },
    veines: (T, a) =>
      fuseau(
        T,
        [
          [7.4, 0.21],
          [7.7, 0.24],
          [8, 0],
        ],
        5,
        a.lueur,
      ),
  },
  chateau: {
    nom: 'le Dragon gallois',
    allume: 'son écu',
    sculpture: (T, a) => {
      dragonAssis(surLeSocle(T, 1, 7 / HAUTEUR_DU_DRAGON), a, 'repliees');
      dalle(T, ECU, ECU_Z[0], ECU_Z[1], a.pierre);
      // Les deux pattes qui tiennent l'écu par le haut.
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.7, BAS_DE_L_ECU + 3.1, -0.4],
            [s * 0.8, BAS_DE_L_ECU + 2.75, -1.05],
          ],
          0.16,
          3,
          a.pierre,
        );
    },
    veines: (T, a) => {
      const z = () => ECU_Z[0];
      const b = BAS_DE_L_ECU;
      veine(T, [...ECU.map(([x, y]): [number, number] => [x * 0.86, b + (y - b) * 0.9 + 0.1]), [-0.86, b + 2.53]], 0.09, a.lueur, z);
      veine(
        T,
        [
          [0, b + 0.4],
          [0, b + 2.4],
        ],
        0.14,
        a.lueur,
        z,
      );
    },
  },
};
