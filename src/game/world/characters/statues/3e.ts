// Les Gardiens de L'Horizon (3e) en sentinelles de pierre (lot R6), d'après l'intention du directeur artistique : la
// statue et ce qui s'allume. Six îles pour 1 800 triangles, socles compris.
import type { BiomeId } from '../../../biomes';
import { pointe } from '../template';
import { devant, facette, fuseau, pave, pose, repere, type Anneau, type Trace, type V3 } from '../painted';
import { dalle, etoile, orbites, plaque, tube, veine, veineSur, type Statue } from '../sentinel';
import { ailesDeployees, dragonAssis, HAUTEUR_DU_DRAGON, surLeSocle } from './common';

/** L'Étourneau d'étain, debout sur ses pattes : le corps, du ventre aux épaules ; la tête au bout du cou court (huit blocs). */
const CORPS_DE_L_ETOURNEAU: Anneau[] = [
  [2.4, 0.5, 0.65],
  [3.4, 0.85, 0.95],
  [4.8, 0.75, 0.85],
  [5.8, 0.4, 0.45],
];
const Z_DE_LA_TETE_DE_L_ETOURNEAU = -0.35;
const TETE_DE_L_ETOURNEAU: Anneau[] = [
  [6.2, 0.3, 0.3],
  [6.8, 0.46, 0.48],
  [7.6, 0.42, 0.45],
  [8, 0.2, 0.2],
];
/** L'aile droite de l'Étourneau, repliée sur le flanc et le dos (x, y) ; la gauche en miroir. */
const AILE_DE_L_ETOURNEAU: [number, number][] = [
  [0.8, 5.4],
  [1.0, 5.0],
  [0.9, 3.0],
  [0.7, 3.3],
];
/** Le fil de lueur d'une aile de l'Étourneau, sur son flanc (z, y), le long de `AILE_DE_L_ETOURNEAU`. */
const FIL_DE_L_AILE_DE_L_ETOURNEAU: [number, number][] = [
  [-0.4, 4.85],
  [0.15, 4.1],
  [0.4, 3.3],
];

/** Le Centaure d'argile : le corps du cheval, couché le long de Z, du poitrail à la croupe (le long, la largeur, la hauteur). */
const CORPS_DU_CENTAURE: Anneau[] = [
  [0, 0.45, 0.5],
  [0.4, 0.62, 0.62],
  [1.8, 0.6, 0.6],
  [2.3, 0.4, 0.45],
];
/** Le buste, dressé sur le poitrail ; la tête au-dessus (huit blocs). */
const BUSTE_DU_CENTAURE: Anneau[] = [
  [3.0, 0.45, 0.38],
  [4.4, 0.55, 0.4],
  [5.6, 0.6, 0.42],
  [6.0, 0.28, 0.28],
];
const Z_DU_BUSTE_DU_CENTAURE = -0.35;
const TETE_DU_CENTAURE: Anneau[] = [
  [6.0, 0.24, 0.24],
  [6.5, 0.4, 0.4],
  [7.5, 0.38, 0.4],
  [8, 0.2, 0.2],
];
/** Le motif de lueur de chaque flanc du cheval (z, y) : une ligne brisée, de l'épaule à la croupe. */
const MOTIF_DU_FLANC_DU_CENTAURE: [number, number][] = [
  [-0.1, 2.75],
  [0.45, 3.0],
  [1.0, 2.75],
  [1.5, 3.0],
];

/**
 * Le flanc d'une sentinelle, en dalle le long de Z (`s` : −1 à gauche, 1 à droite ; `x`, son écart à l'axe) : le −Z
 * d'une veine y regarde vers l'extérieur, et son x court le long de Z (comme `surLeFlanc` des Îles Brumeuses).
 */
const surLeFlanc = (T: Trace, s: -1 | 1, x: number) => pose(T, repere([s * x, 0, 0], 0, -s * (Math.PI / 2), 0));

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
const TOURS_DU_PAPILLON = { monde: deFacePour(Math.sin((ANGLE_DU_PAPILLON * Math.PI) / 180), -Math.cos((ANGLE_DU_PAPILLON * Math.PI) / 180)), defi: 0 };

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

/**
 * La Colombe d'albâtre, posée : le corps, puis un cou étroit d'où la tête sort vers l'avant (DA, relecture des planches :
 * pas un obélisque).
 */
const CORPS_DE_LA_COLOMBE: Anneau[] = [
  [1, 0.85, 1.1, 0.4],
  [2.6, 1.1, 1.4, 0.3],
  [4.2, 0.9, 1.1, 0.1],
  [5.2, 0.42, 0.45, -0.3],
];
const TETE_DE_LA_COLOMBE: Anneau[] = [
  [5.1, 0.42, 0.45, -0.45],
  [6.2, 0.55, 0.6, -0.8],
  [7.2, 0.45, 0.5, -0.8],
  [8, 0.15, 0.2, -0.75],
];
/** À quelle hauteur les yeux, sur les côtés de la tête, et à quelle distance de son axe. */
const OEIL_DE_LA_COLOMBE = { y: 6.75, x: 0.5 } as const;
/**
 * Le tour de la Colombe (DA, relecture des planches) : de trois quarts, le côté du rameau vers l'élève, comme le
 * Papillon de cuivre ; dans le monde comme au défi.
 */
const TOURS_DE_LA_COLOMBE = { monde: -0.6, defi: -0.6 };

/** Le Cerf de lauze, couché : le corps, le cou qui se lève ; puis la tête. */
const CORPS_DU_CERF: Anneau[] = [
  [1, 1.1, 1.3, 0.2],
  [2.6, 1.1, 1.4, 0.2],
  [3.4, 0.8, 0.9, 0],
  [4.4, 0.45, 0.45, -0.5],
];
const TETE_DU_CERF: Anneau[] = [
  [4.2, 0.45, 0.5, -0.6],
  [5.4, 0.42, 0.5, -0.8],
  [5.8, 0.2, 0.25, -0.9],
];

// Les Gardiens de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le strict
// nécessaire (budget de l'archipel).

/**
 * Le Dauphin de turquoise, dressé en bond au-dessus de son rocher : les nageoires de la queue posées sur le rocher, le
 * corps arqué, la tête en haut et le rostre vers l'élève, l'aileron sur le dos.
 */
const ROCHER_DU_DAUPHIN: Anneau[] = [
  [1, 1.2, 0.95],
  [2.2, 1.0, 0.9],
  [2.8, 0.6, 0.55],
];
const DOS_DU_DAUPHIN: V3[] = [
  [0, 2.85, 0.3],
  [0, 3.8, 0.6],
  [0, 5.0, 0.55],
  [0, 6.1, 0.1],
  [0, 6.9, -0.45],
];
const TETE_DU_DAUPHIN: Anneau[] = [
  [6.7, 0.5, 0.55],
  [7.5, 0.45, 0.5],
  [8, 0],
];
const Z_DE_LA_TETE_DU_DAUPHIN = -0.5;

/** Le Kangourou de rubis, assis sur sa queue : les grands pieds, les cuisses, le corps, la tête, les oreilles hautes. */
const CUISSE_DU_KANGOUROU: Anneau[] = [
  [1.3, 0.45, 0.6],
  [2.2, 0.55, 0.75],
  [3.0, 0.35, 0.5],
];
const X_DES_CUISSES = 0.52;
const Z_DES_CUISSES = 0.1;
const CORPS_DU_KANGOUROU: Anneau[] = [
  [2.2, 0.75, 0.65, 0.3],
  [3.6, 0.8, 0.7, 0.2],
  [5.0, 0.55, 0.5, 0],
  [5.6, 0.35, 0.35, -0.1],
];
const TETE_DU_KANGOUROU: Anneau[] = [
  [5.5, 0.4, 0.45, -0.15],
  [6.4, 0.38, 0.5, -0.35],
  [6.8, 0.22, 0.3, -0.3],
];
const PIED_DES_OREILLES = 6.65;
const PENTE_DES_OREILLES = 0.15;
/** Un ressort gravé sur le devant d'une cuisse : un zigzag (x, y). */
const RESSORT: [number, number][] = [
  [0, 1.5],
  [0.2, 1.75],
  [-0.2, 2.05],
  [0.2, 2.35],
  [-0.2, 2.65],
  [0, 2.85],
];

/**
 * L'Abeille de topaze, posée sur une fleur : la tige et la corolle, l'abdomen couché vers l'arrière, le thorax, la tête
 * aux antennes, les ailes ouvertes en V (sans dard).
 */
const COROLLE: Anneau[] = [
  [4.5, 0.25],
  [4.9, 1.1],
  [5.05, 1.15],
];
const ABDOMEN_DE_L_ABEILLE: Anneau[] = [
  [-0.5, 0.5],
  [0.1, 0.65],
  [0.7, 0.45],
  [1.0, 0],
];
const THORAX_DE_L_ABEILLE: Anneau[] = [
  [5.2, 0.45],
  [5.7, 0.6],
  [6.3, 0.5],
  [6.6, 0.25],
];
const TETE_DE_L_ABEILLE: Anneau[] = [
  [6.4, 0.45, 0.4],
  [7.1, 0.48, 0.42],
  [7.4, 0.25, 0.25],
];
const Z_DE_LA_TETE_DE_L_ABEILLE = -0.75;
/** Une aile de l'Abeille (`s` : −1 à gauche, 1 à droite), dans son repère, ouverte en V vers l'arrière. */
const AILE_DE_L_ABEILLE: [number, number][] = [
  [0, 5.9],
  [1.5, 6.5],
  [1.8, 7.4],
  [0.5, 7.25],
];
const repereDAileDAbeille = (s: number) => repere([s * 0.35, 0, 0.05], 0, -s * 0.5, 0);

export const STATUES_3E: Partial<Record<BiomeId, Statue>> = {
  'maths-3e-geometry': {
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
  'maths-3e-statistics': {
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
  'maths-3e-functions': {
    nom: 'le Dragon de lumière',
    allume: 'ses ailes de verre',
    sculpture: (T, a) => {
      fuseau(T, COLONNE, 6, a.moussue((k, j) => k === 0 || (k === 1 && j === 2)), { bas: false });
      dragonAssis(surLeSocle(T, DRAGON_DU_PHARE.base, DRAGON_DU_PHARE.e), a, 'deployees');
    },
    veines: (T, a) => ailesDeployees(surLeSocle(T, DRAGON_DU_PHARE.base, DRAGON_DU_PHARE.e), a.lueur, DRAGON_DU_PHARE.ailes),
  },
  'french-3e-close-reading': {
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
  'english-3e-comprehension': {
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
  'english-3e-grammar': {
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
  'lv2-3e-travel': {
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
  // Les Gardiens d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le
  // strict nécessaire (budget de l'archipel). La Colombe d'albâtre porte un rameau, aucune arme (DA, HG-3).
  'history-3e-twentieth-century': {
    nom: 'la Colombe d’albâtre',
    allume: 'ses plumes',
    tour: TOURS_DE_LA_COLOMBE,
    sculpture: (T, a) => {
      fuseau(T, CORPS_DE_LA_COLOMBE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      fuseau(T, TETE_DE_LA_COLOMBE, 5, a.pierre, { bas: false });
      // La queue relevée derrière elle, puis le bec, vers l'avant.
      dalle(
        T,
        [
          [-0.5, 2.2],
          [0.5, 2.2],
          [0.8, 4.4],
          [-0.8, 4.4],
        ],
        1.3,
        1.5,
        a.pierre,
      );
      const bec = devant(TETE_DE_LA_COLOMBE, 5, 6.6).z;
      pointe(T, [0, 6.6, bec + 0.05], 0.12, 0.35, a.pierre, [-Math.PI / 2, 0, 0], 3);
      // Le rameau, d'un seul côté du bec (jamais en travers : de face, il faisait un masque, DA) : une tige fine en biais,
      // deux feuilles plates au bout, assez grandes pour se lire de loin (DA, relecture des planches, HG-3).
      const z = bec - 0.3;
      tube(
        T,
        [
          [0.1, 6.5, z],
          [0.6, 6.05, z - 0.05],
          [1.05, 5.6, z],
        ],
        0.045,
        3,
        a.rameau,
      );
      for (const f of [
        [
          [0.55, 6.05],
          [1.03, 6.53],
          [1.27, 6.29],
          [0.87, 5.89],
        ],
        [
          [1.0, 5.6],
          [1.56, 5.84],
          [1.72, 5.36],
          [1.16, 5.28],
        ],
      ] as [number, number][][])
        dalle(T, f, z - 0.03, z + 0.03, a.rameau);
      // Les yeux, sur les côtés de la tête.
      const tete = TETE_DE_LA_COLOMBE[1][3]!;
      for (const s of [-1, 1]) orbites(pose(T, repere([s * OEIL_DE_LA_COLOMBE.x, OEIL_DE_LA_COLOMBE.y, tete], 0, -s * (Math.PI / 2), 0)), a, 0, 0, 0, 0, 0.12);
    },
    veines: (T, a) => {
      // Trois rangs de plumes sur la poitrine, en chevrons.
      for (const y of [2.4, 3.3, 4.2])
        veineSur(
          T,
          CORPS_DE_LA_COLOMBE,
          6,
          [
            [-0.5, y + 0.15],
            [0, y - 0.1],
            [0.5, y + 0.15],
          ],
          0.09 * a.veines,
          a.lueur,
        );
    },
  },
  'geography-3e-france': {
    nom: 'le Cerf de lauze',
    // Ce qui s'allume, ce que dit le texte : les lauzes de sa poitrine (HG-3, sans un triangle de plus).
    allume: 'les lauzes de sa poitrine',
    sculpture: (T, a) => {
      fuseau(T, CORPS_DU_CERF, 6, a.moussue((k, j) => k === 0 && j % 2 === 1), { bas: false });
      fuseau(T, TETE_DU_CERF, 5, a.pierre, { bas: false });
      // Les bois, qui s'ouvrent au-dessus de lui, un andouiller chacun.
      for (const s of [-1, 1]) {
        tube(
          T,
          [
            [s * 0.25, 5.5, -0.6],
            [s * 0.8, 6.7, -0.4],
            [s * 1.3, 8, -0.3],
          ],
          [0.1, 0.08, 0],
          3,
          a.pierre,
        );
        tube(
          T,
          [
            [s * 0.8, 6.7, -0.4],
            [s * 0.5, 7.5, -0.55],
          ],
          [0.07, 0],
          3,
          a.pierre,
        );
      }
      orbites(T, a, 0, 5.0, devant(TETE_DU_CERF, 5, 5.0).z, 0.26, 0.1);
    },
    // Deux lauzes sur la poitrine.
    veines: (T, a) => {
      for (const y of [2.0, 2.9]) plaque(T, 0, y, 0.5, 0.3, 6, a.lueur, (yy) => devant(CORPS_DU_CERF, 6, yy).z);
    },
  },
  // Les Gardiens de sciences (SC-3), au strict nécessaire comme ceux d'histoire-géographie.
  'life-earth-sciences-3e-human-body': {
    nom: 'le Dauphin de turquoise',
    allume: 'les reflets de son dos',
    sculpture: (T, a) => {
      fuseau(T, ROCHER_DU_DAUPHIN, 5, a.moussue((k, j) => k === 0 && j % 2 === 1), { bas: false });
      // Les deux lobes de la queue, à plat sur le rocher.
      for (const s of [-1, 1])
        dalle(
          pose(T, repere([0, 2.86, 0.3], Math.PI / 2, 0, 0)),
          [
            [0, -0.1],
            [s * 1.0, 0.5],
            [0, 0.25],
          ],
          -0.06,
          0.06,
          a.pierre,
        );
      tube(T, DOS_DU_DAUPHIN, [0.25, 0.5, 0.68, 0.62, 0.48], 6, a.pierre);
      fuseau(T, TETE_DU_DAUPHIN, 6, a.pierre, { z: Z_DE_LA_TETE_DU_DAUPHIN, bas: false });
      pointe(T, [0, 7.15, devant(TETE_DU_DAUPHIN, 6, 7.15, Z_DE_LA_TETE_DU_DAUPHIN).z + 0.1], 0.17, 0.5, a.pierre, [-Math.PI / 2, 0, 0], 4);
      // L'aileron, sur le dos ; deux petites nageoires sur les côtés.
      dalle(
        pose(T, repere([0, 0, 0], 0, Math.PI / 2, 0)),
        [
          [-0.95, 4.5],
          [-1.75, 5.5],
          [-0.55, 5.35],
        ],
        -0.06,
        0.06,
        a.pierre,
      );
      for (const s of [-1, 1]) pointe(T, [s * 0.5, 6.05, -0.05], 0.13, 0.55, a.pierre, [0.4, 0, -s * 2.0], 3);
      orbites(T, a, 0, 7.45, devant(TETE_DU_DAUPHIN, 6, 7.45, Z_DE_LA_TETE_DU_DAUPHIN).z, 0.24, 0.12);
    },
    // Un reflet sur chaque flanc, sous l'aileron, tourné vers son côté.
    veines: (T, a) => {
      for (const s of [-1, 1]) plaque(pose(T, repere([s * 0.7, 4.75, 0.5], 0, -s * (Math.PI / 2), 0)), 0, 0, 0.32, 0.16 * a.veines, 6, a.lueur, () => 0);
    },
  },
  'physics-chemistry-3e-motion-energy': {
    nom: 'le Kangourou de rubis',
    allume: 'les ressorts de ses pattes',
    sculpture: (T, a) => {
      for (const s of [-1, 1]) {
        pave(T, s * 0.28, 1, -0.85, s * 0.78, 1.28, 0.45, a.pierre);
        fuseau(T, CUISSE_DU_KANGOUROU, 5, a.moussue((k, j) => k === 0 && j === 2), { x: s * X_DES_CUISSES, z: Z_DES_CUISSES, bas: false });
        // Les bras, courts, devant la poitrine.
        tube(
          T,
          [
            [s * 0.45, 4.6, -0.35],
            [s * 0.3, 4.0, -0.75],
          ],
          [0.14, 0.1],
          3,
          a.pierre,
        );
        // Les oreilles hautes, un peu écartées : leur pointe en haut de la sentinelle.
        pointe(T, [s * 0.2, PIED_DES_OREILLES, -0.25], 0.2, (8 - PIED_DES_OREILLES) / Math.cos(PENTE_DES_OREILLES), a.pierre, [0, 0, -s * PENTE_DES_OREILLES], 3, 0.08);
      }
      tube(
        T,
        [
          [0, 1.9, 0.75],
          [0, 1.25, 1.6],
          [0, 1.1, 2.2],
        ],
        [0.32, 0.22, 0.1],
        3,
        a.pierre,
      );
      fuseau(T, CORPS_DU_KANGOUROU, 5, a.pierre, { bas: false });
      fuseau(T, TETE_DU_KANGOUROU, 5, a.pierre, { bas: false });
      orbites(T, a, 0, 6.35, devant(TETE_DU_KANGOUROU, 5, 6.35).z, 0.19, 0.1);
    },
    // Un ressort gravé sur chaque cuisse : deux lueurs.
    veines: (T, a) => {
      for (const s of [-1, 1]) veineSur(T, CUISSE_DU_KANGOUROU, 5, RESSORT, 0.08 * a.veines, a.lueur, { x: s * X_DES_CUISSES, z: Z_DES_CUISSES });
    },
  },
  'technology-3e-digital': {
    nom: 'l’Abeille de topaze',
    allume: 'les cases de ses ailes',
    sculpture: (T, a) => {
      fuseau(T, [[1, 0.2], [4.55, 0.17]], 4, a.pierre, { bas: false, haut: false });
      fuseau(T, COROLLE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      // L'abdomen rayé (une bande de lichen), couché vers l'arrière ; le thorax ; la tête.
      fuseau(pose(T, repere([0, 5.75, 0.6], Math.PI / 2, 0, 0)), ABDOMEN_DE_L_ABEILLE, 5, a.moussue((k) => k === 1));
      fuseau(T, THORAX_DE_L_ABEILLE, 5, a.pierre, { z: -0.3, bas: false });
      fuseau(T, TETE_DE_L_ABEILLE, 6, a.pierre, { z: Z_DE_LA_TETE_DE_L_ABEILLE, bas: false });
      for (const s of [-1, 1]) {
        tube(
          T,
          [
            [s * 0.15, 7.3, -0.85],
            [s * 0.3, 7.75, -0.95],
            [s * 0.5, 8, -1.25],
          ],
          [0.06, 0.05, 0],
          3,
          a.pierre,
        );
        dalle(
          pose(T, repereDAileDAbeille(s)),
          AILE_DE_L_ABEILLE.map(([x, y]): [number, number] => [s * x, y]),
          -0.05,
          0.05,
          a.pierre,
        );
      }
      orbites(T, a, 0, 6.95, devant(TETE_DE_L_ABEILLE, 6, 6.95, Z_DE_LA_TETE_DE_L_ABEILLE).z, 0.22, 0.14);
    },
    // Deux cases hexagonales sur chaque aile, côte à côte : deux lueurs.
    veines: (T, a) => {
      for (const s of [-1, 1]) for (const [x, y] of [[0.75, 6.65], [1.2, 6.85]]) plaque(pose(T, repereDAileDAbeille(s)), s * x, y, 0.2 * a.veines, 0.2, 6, a.lueur, () => -0.05);
    },
  },
  // EMC 3e (EMC-2) : le strict nécessaire, Archipéo étant en pause. L'Étourneau d'étain, sans flamme ni symbole :
  // debout sur ses pattes, le corps rond, la queue courte, le bec long et pointu ; les ailes repliées sur le dos, dont
  // les plumes s'allument, un fil sur le flanc de chacune.
  'civics-3e-democratic-life': {
    nom: 'l’Étourneau d’étain',
    allume: 'les plumes de son dos',
    sansFlamme: true,
    sculpture: (T, a) => {
      // Les pattes, du socle au ventre.
      for (const x of [-0.3, 0.3])
        tube(
          T,
          [
            [x, 1, -0.1],
            [x, 2.6, 0],
          ],
          0.12,
          4,
          a.pierre,
        );
      fuseau(T, CORPS_DE_L_ETOURNEAU, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      // La queue courte, vers l'arrière et le bas.
      pointe(T, [0, 3.4, 0.8], 0.25, 0.8, a.pierre, [Math.PI / 2 + 0.5, 0, 0], 3);
      // Le cou court, des épaules à la tête.
      tube(
        T,
        [
          [0, 5.6, -0.2],
          [0, 6.4, Z_DE_LA_TETE_DE_L_ETOURNEAU],
        ],
        [0.32, 0.28],
        4,
        a.pierre,
      );
      fuseau(T, TETE_DE_L_ETOURNEAU, 5, a.pierre, { z: Z_DE_LA_TETE_DE_L_ETOURNEAU, bas: false });
      // Le bec long et pointu, vers l'avant.
      pointe(T, [0, 7.05, devant(TETE_DE_L_ETOURNEAU, 5, 7.05, Z_DE_LA_TETE_DE_L_ETOURNEAU).z + 0.05], 0.12, 0.55, a.pierre, [-Math.PI / 2, 0, 0], 3);
      for (const c of [-1, 1]) dalle(T, AILE_DE_L_ETOURNEAU.map(([x, y]): [number, number] => [c * x, y]), -0.55, 0.6, a.pierre);
      orbites(T, a, 0, 7.4, devant(TETE_DE_L_ETOURNEAU, 5, 7.4, Z_DE_LA_TETE_DE_L_ETOURNEAU).z, 0.2, 0.11);
    },
    // Un fil de lueur sur le flanc de chaque aile, de l'épaule (devant, en haut) à la pointe (derrière, en bas).
    veines: (T, a) => {
      for (const s of [-1, 1] as const)
        veine(
          surLeFlanc(T, s, 1.0),
          FIL_DE_L_AILE_DE_L_ETOURNEAU.map(([z, y]): [number, number] => [s * z, y]),
          0.09 * a.veines,
          a.lueur,
          (y) => -0.05 * ((y - 3.0) / 2.4),
        );
    },
  },
  // Latin-grec 3e (LCA-2) : le strict nécessaire, Archipéo étant en pause. Le Centaure d'argile, sans flamme, sans arme
  // (ni arc ni lance) ni dieu : le corps du cheval couché vers l'arrière sur ses quatre pattes, la queue, le buste dressé
  // sur le poitrail ; il tient devant lui un livre ouvert ; les motifs de ses flancs s'allument.
  'lca-3e-ideas': {
    nom: 'le Centaure d’argile',
    allume: 'les motifs de son flanc',
    sansFlamme: true,
    sculpture: (T, a) => {
      // Les quatre pattes, du socle au ventre.
      for (const x of [-0.35, 0.35])
        for (const z of [-0.2, 1.5])
          tube(
            T,
            [
              [x, 1, z],
              [x, 2.4, z],
            ],
            0.13,
            3,
            a.pierre,
          );
      fuseau(pose(T, repere([0, 2.85, -0.45], Math.PI / 2, 0, 0)), CORPS_DU_CENTAURE, 5, a.moussue((k, j) => k === 1 && j % 2 === 0));
      // La queue, qui retombe derrière la croupe.
      pointe(T, [0, 3.0, 1.75], 0.14, 0.8, a.pierre, [Math.PI / 2 + 1.0, 0, 0], 3);
      fuseau(T, BUSTE_DU_CENTAURE, 5, a.pierre, { z: Z_DU_BUSTE_DU_CENTAURE, bas: false });
      // Les bras, des épaules au livre ; le livre ouvert, tenu devant la poitrine.
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 0.55, 5.4, Z_DU_BUSTE_DU_CENTAURE],
            [s * 0.45, 4.7, -0.9],
          ],
          0.12,
          4,
          a.pierre,
        );
      pave(T, -0.5, 4.5, -1.05, 0.5, 5.05, -0.9, a.pierre);
      fuseau(T, TETE_DU_CENTAURE, 5, a.pierre, { z: Z_DU_BUSTE_DU_CENTAURE, bas: false });
      orbites(T, a, 0, 7.05, devant(TETE_DU_CENTAURE, 5, 7.05, Z_DU_BUSTE_DU_CENTAURE).z, 0.2, 0.1);
    },
    // Un motif de lueur sur chaque flanc du cheval, une ligne brisée de l'épaule à la croupe.
    veines: (T, a) => {
      for (const s of [-1, 1] as const)
        veine(
          surLeFlanc(T, s, 0.6),
          MOTIF_DU_FLANC_DU_CENTAURE.map(([z, y]): [number, number] => [s * z, y]),
          0.09 * a.veines,
          a.lueur,
          () => 0,
        );
    },
  },
};
