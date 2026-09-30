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

/**
 * Le Papillon de cuivre (DA, LV2-5) : les ailes, vues de face, en contours convexes (x, y), l'aile droite depuis sa
 * racine contre le corps (x = 0). L'aile du haut, plus grande, monte en V franc : sa pointe, à 8 blocs (le haut de la
 * sentinelle), bien au-dessus des épaules (`EPAULE`) ; l'aile du bas, petite, pend près du corps (pas une croix vue de
 * face). `ouverture` : l'angle dont chaque aile recule vers l'arrière depuis sa racine (un livre à peine ouvert vers
 * l'élève : d'en haut, un V, jamais un trait) ; `epaisseur` : la demi-épaisseur des ailes.
 */
export const PAPILLON_DE_CUIVRE = {
  haute: [
    [0, 3.9],
    [1.6, 4.2],
    [2.3, 6.2],
    // La pointe arrondie, coupée en deux sommets (consultant Archipéo) : le V reste franc, sans pointe de lance.
    [2.4, 7.3],
    [1.8, 8.0],
    [0, 5.1],
  ] as [number, number][],
  basse: [
    [0, 2.4],
    [0.65, 2.0],
    [1.2, 2.9],
    [1.1, 3.62],
    [0, 3.55],
  ] as [number, number][],
  racine: 0.14,
  ouverture: 0.25,
  epaisseur: 0.07,
  epaule: 4.9,
} as const;

/** Le tour qui montre de face, à une caméra venue de (`dx`, `dz`), une statue plate dessinée face à −Z. */
const deFacePour = (dx: number, dz: number) => Math.atan2(-dx, -dz);
/**
 * Le tour du Papillon (DA, LV2-5) : des ailes plates se lisent mal par la tranche. Dans le monde, vers le milieu des
 * caméras qui le regardent, mesurées de son îlot : celle du bonhomme sur le Refuge (77° à l'est du sud), celle du
 * bonhomme sur le Château (19°) et celle qui glisse vers lui au rallumage (85°) (three/camera.ts, `VIEW`,
 * `ISLAND_VIEW`, `viewYaw`, comme pour le Soleil de cuivre au Jardin) : tourné de 52°, aucune ne le voit à plus de 33°
 * de face. Au défi, sa caméra de trois quarts le voit à 33° : il y reste droit.
 */
export const ANGLE_DU_PAPILLON = 52;
export const TOURS_DU_PAPILLON = { monde: deFacePour(Math.sin((ANGLE_DU_PAPILLON * Math.PI) / 180), -Math.cos((ANGLE_DU_PAPILLON * Math.PI) / 180)), defi: 0 };

/** Le corps du Papillon : une colonne mince, du socle à la tête, sans visage. */
const CORPS_DU_PAPILLON: Anneau[] = [
  [1, 0.24],
  [1.5, 0.19],
  [4.6, 0.2],
  [5.5, 0.17],
];
const TETE_DU_PAPILLON: Anneau[] = [
  [5.45, 0.2],
  [5.75, 0.27],
  [6.1, 0.2],
];

/** Le repère d'une aile (`cote` : −1 à gauche, 1 à droite) : sa racine contre le corps, reculée de `ouverture`. */
const repereDAile = (cote: -1 | 1) => repere([cote * PAPILLON_DE_CUIVRE.racine, 0, 0], 0, cote * PAPILLON_DE_CUIVRE.ouverture, 0);

/** Un contour d'aile, en miroir pour l'aile gauche (dans l'ordre qui garde la face avant vers −Z). */
const contourDAile = (c: [number, number][], cote: -1 | 1): [number, number][] => (cote === 1 ? c : c.map(([x, y]): [number, number] => [-x, y]).reverse());

/** Un contour rentré vers son centre (le fil, un peu en dedans du bord ; la patine, au milieu). */
function rentre(c: [number, number][], k: number): [number, number][] {
  const [cx, cy] = [c.reduce((s, p) => s + p[0], 0) / c.length, c.reduce((s, p) => s + p[1], 0) / c.length];
  return c.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

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
          0.09 * a.veines,
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
        0.09 * a.veines,
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
      veine(T, [...ECU.map(([x, y]): [number, number] => [x * 0.86, b + (y - b) * 0.9 + 0.1]), [-0.86, b + 2.53]], 0.09 * a.veines, a.lueur, z);
      veine(
        T,
        [
          [0, b + 0.4],
          [0, b + 2.4],
        ],
        0.14 * a.veines,
        a.lueur,
        z,
      );
    },
  },
  refuge: {
    // Le Papillon de cuivre (DA, LV2-5) : une statue de cuivre patiné, sans visage ni lueur orange, sans mât ; deux paires
    // d'ailes (celles du haut plus grandes, en V franc face à la caméra), un corps en colonne, deux antennes courtes. Il
    // ne vole pas et n'a aucune animation propre. Ce qui se rallume est commun à tous les Gardiens : le fil qui suit le
    // contour de ses ailes (jamais des nervures en rayons), plus clair à chaque épreuve réussie, et, à la victoire, toute
    // la statue en Sable.
    nom: 'le Papillon de cuivre',
    allume: 'le bord de ses ailes',
    tour: TOURS_DU_PAPILLON,
    sculpture: (T, a) => {
      const P = PAPILLON_DE_CUIVRE;
      fuseau(T, CORPS_DU_PAPILLON, 6, a.pierre, { bas: false });
      fuseau(T, TETE_DU_PAPILLON, 6, a.pierre);
      // Les antennes : deux tiges courtes qui s'écartent, un petit bouton au bout.
      for (const c of [-1, 1]) {
        tube(
          T,
          [
            [c * 0.08, 6.0, 0],
            [c * 0.3, 6.55, 0.02],
            [c * 0.5, 6.95, 0.05],
          ],
          [0.045, 0.04, 0.035],
          4,
          a.pierre,
        );
        fuseau(
          T,
          [
            [6.9, 0.06],
            [7.02, 0.08],
            [7.14, 0],
          ],
          4,
          a.pierre,
          { x: c * 0.52, z: 0.05 },
        );
      }
      for (const c of [-1, 1] as const) {
        const R = pose(T, repereDAile(c));
        // Les ailes, pleines, d'une faible épaisseur ; la patine (le vert-de-gris) au milieu de celles du haut.
        for (const aile of [P.haute, P.basse]) dalle(R, contourDAile(aile, c), -P.epaisseur, P.epaisseur, a.pierre);
        const patine = contourDAile(rentre(P.haute, 0.55), c);
        facette(
          R,
          patine.map(([x, y]): V3 => [x, y, -P.epaisseur - 0.01]),
          [0, 6, 1],
          a.lichen,
        );
      }
    },
    veines: (T, a) => {
      const P = PAPILLON_DE_CUIVRE;
      const l = 0.07 * a.veines;
      // Le fil du corps, du bas de l'aile du bas jusqu'à la racine de celle du haut : il relie les quatre fils des ailes
      // (une seule lueur, jamais des rayons).
      veine(
        T,
        [
          [0, 2.3],
          [0, 5.2],
        ],
        l,
        a.lueur,
        (y) => devant(y < 5.45 ? CORPS_DU_PAPILLON : TETE_DU_PAPILLON, 6, y).z,
      );
      // Le fil de chaque aile, un peu en dedans de son bord, de sa racine à sa racine (le contour, pas des nervures).
      for (const c of [-1, 1] as const) {
        const R = pose(T, repereDAile(c));
        for (const aile of [P.haute, P.basse]) {
          // (Le long de la racine, le fil reste contre le corps, qu'il rejoint.)
          const dedans = rentre(aile, 0.86).map(([x, y], i): [number, number] => [aile[i][0] === 0 ? 0 : x, y]);
          const bord = contourDAile(dedans, c);
          const trace: [number, number][] = [...bord, bord[0]];
          veine(R, trace, l, a.lueur, () => -P.epaisseur - 0.005);
        }
      }
    },
  },
};
