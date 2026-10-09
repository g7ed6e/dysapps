// Les Gardiens des Îles Brumeuses (5e) en sentinelles de pierre (lot R6), d'après l'intention du directeur
// artistique : la statue et ce qui s'allume. Sept îles (le Relais des voyageurs, LV2, en plus) pour 1 800 triangles,
// socles compris.
import type { BiomeId } from '../../../biomes';
import { pointe } from '../template';
import { devant, fuseau, pave, pose, repere, type Anneau, type V3 } from '../painted';
import { dalle, orbites, plaque, tube, veine, veineSur, type Statue } from '../sentinel';

/** L'Oie d'opale : le corps ovale, de la queue aux épaules ; la tête, petite, au bout du long cou (jusqu'à huit blocs). */
const CORPS_DE_L_OIE: Anneau[] = [
  [1, 0.6, 0.8],
  [2.2, 0.95, 1.05],
  [3.4, 0.85, 0.95],
  [4.2, 0.4, 0.45],
];
const Z_DE_LA_TETE_DE_L_OIE = -0.55;
const TETE_DE_L_OIE: Anneau[] = [
  [6.3, 0.25, 0.25],
  [6.8, 0.4, 0.45],
  [7.6, 0.38, 0.42],
  [8, 0.2, 0.2],
];
/** L'aile droite de l'Oie, repliée sur le flanc (x, y) ; la gauche en miroir. */
const AILE_DE_L_OIE: [number, number][] = [
  [0.85, 3.7],
  [1.05, 3.4],
  [1.0, 1.9],
  [0.8, 2.2],
];

/** Le Phénix d'argile : le corps, de la queue aux épaules ; la tête au bout du cou court (jusqu'à huit blocs). */
const CORPS_DU_PHENIX: Anneau[] = [
  [1, 0.55, 0.75],
  [2.4, 0.85, 1.0],
  [3.8, 0.75, 0.85],
  [4.8, 0.4, 0.45],
];
const Z_DE_LA_TETE_DU_PHENIX = -0.35;
const TETE_DU_PHENIX: Anneau[] = [
  [6.0, 0.3, 0.3],
  [6.6, 0.48, 0.52],
  [7.5, 0.45, 0.48],
  [8, 0.22, 0.22],
];
/** L'aile droite du Phénix, repliée sur le flanc (x, y) ; la gauche en miroir. */
const AILE_DU_PHENIX: [number, number][] = [
  [0.8, 4.4],
  [1.0, 4.0],
  [0.95, 2.1],
  [0.75, 2.4],
];

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

/**
 * Les roues de la Diligence : x et rayon (les grandes derrière, les petites devant), posées sur le socle. Toute la
 * Diligence tient à 2,5 blocs de l'axe du socle : ses tours la gardent dans les cinq cases.
 */
const ROUES_DE_LA_DILIGENCE: [number, number][] = [
  [-1.35, 0.9],
  [1.45, 0.6],
];
/** Le tour qui montre de profil, à une caméra venue de (`dx`, `dz`), une statue dessinée de profil face à −Z. */
const deProfilPour = (dx: number, dz: number) => Math.atan2(-dx, -dz);
/**
 * Les tours de la Diligence (retouches du directeur artistique, DA, LV2-2) : de vrai profil, ses roues alignées. Dans
 * le monde, vers les caméras qui la regardent depuis l'est, mesurées de son îlot : celle du bonhomme sur le Relais
 * (0,97 ; −0,22) et celle qui glisse vers elle au rallumage (0,99 ; −0,13) (three/camera.ts, `VIEW`, `ISLAND_VIEW`,
 * `viewYaw`) ; au défi, vers sa caméra de trois quarts (Guardians.tsx, `cameraDirection` [−0,55 ; −0,85]).
 */
const TOURS_DE_LA_DILIGENCE = { monde: deProfilPour(0.98, -0.18), defi: deProfilPour(-0.55, -0.85) };
/** Le centre du cadran de la boussole, au-dessus du siège du cocher (le haut de la Diligence, vers 5 blocs). */
const BOUSSOLE = { x: 1.3, y: 4.8 };

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

/** Le Griffon d'émail, assis : le corps de lion, puis la tête d'aigle au bec avancé. */
const CORPS_DU_GRIFFON: Anneau[] = [
  [1, 1.0, 0.9],
  [3.0, 1.15, 1.0],
  [5.0, 0.8, 0.7],
  [5.6, 0.5, 0.45],
];
const TETE_DU_GRIFFON: Anneau[] = [
  [5.4, 0.55, 0.5, -0.2],
  [7.2, 0.5, 0.45, -0.3],
  [8, 0.3, 0.28, -0.3],
];

/** La Libellule de jade, debout sur sa queue : la queue fine, le thorax ; puis la tête aux gros yeux. */
const CORPS_DE_LA_LIBELLULE: Anneau[] = [
  [1, 0.18],
  [3.5, 0.22],
  [5.2, 0.35],
  [6.2, 0.4],
  [6.4, 0.3],
];
const TETE_DE_LA_LIBELLULE: Anneau[] = [
  [6.3, 0.45, 0.4],
  [7.3, 0.5, 0.45],
  [8, 0.25, 0.25],
];
/**
 * Ses deux paires d'ailes, de chaque côté, presque à plat (consultant Archipéo et DA, HG-3 : dressées, elles se
 * lisaient comme les bras d'un poteau indicateur) : la hauteur de l'attache et le sens de la flèche (−1 : la paire du
 * haut, tirée vers l'avant, côté visage ; 1 : celle du bas, tirée vers l'arrière). Vues d'en haut, les quatre ailes
 * font un X. Larges d'une case à l'attache, la pointe émoussée, sans un triangle de plus : la marge des Gardiens du 5e
 * est de quelques triangles.
 */
const AILES_DE_LA_LIBELLULE: [hauteur: number, fleche: -1 | 1][] = [
  [5.3, 1],
  [6.0, -1],
];
/** Le léger dièdre des ailes de la Libellule (radians) : la pointe relevée. */
const DIEDRE_DE_LA_LIBELLULE = 0.16;
/** Le contour d'une aile de la Libellule, à plat : (écart au corps, profondeur), la paire du haut (flèche −1). */
const AILE_DE_LA_LIBELLULE: [number, number][] = [
  [0, -0.35],
  [1.95, -0.95],
  [2.1, -0.4],
  [0, 0.25],
];
/**
 * Le repère d'une aile à plat de la Libellule (`s` : −1 à gauche, 1 à droite) : le contour (x, y) de la dalle devient
 * l'écart et la profondeur, son épaisseur la hauteur, retournée (la face −Z de la dalle regarde le ciel : la nervure s'y
 * pose) ; puis le dièdre relève la pointe.
 */
const repereDAileAPlat = (s: -1 | 1, hauteur: number) => {
  const [c, n] = [Math.cos(s * DIEDRE_DE_LA_LIBELLULE), Math.sin(s * DIEDRE_DE_LA_LIBELLULE)];
  return ([x, y, z]: [number, number, number]): [number, number, number] => [s * 0.3 + x * c + z * n, hauteur + x * n - z * c, y];
};

/**
 * Les ailes du Griffon s'ouvrent en V, chacune reculée de cet angle depuis sa racine (radians) : vues par la tranche, de
 * profil, elles se lisaient comme un obélisque (DA, relecture des planches, HG-3) ; ouvertes, elles ont de l'aire de
 * face comme de profil, dans les cinq cases.
 */
const OUVERTURE_DES_AILES = 0.55;
/** Le repère d'une aile (`s` : −1 à gauche, 1 à droite) : sa racine en `racine`, reculée de `OUVERTURE_DES_AILES`. */
const repereDAile = (s: number, racine: [number, number]) => repere([s * racine[0], 0, racine[1]], 0, -s * OUVERTURE_DES_AILES, 0);
const RACINE_DES_AILES_DU_GRIFFON: [number, number] = [0.7, 0.4];

// Les Gardiens de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le strict
// nécessaire (budget de l'archipel).

/**
 * La Tortue d'ocre, en tortue de mer couchée à plat sur son rocher (DA, relecture des captures : grimpée, elle se lisait
 * debout ; puis, rocher et carapace de la même pierre, elle se lisait comme un tas) : le rocher bas dessous, d'une pierre
 * grise qui ne se rallume pas (`SENTINELLE.roche`) ; la carapace en dôme bas, bien plus large que haute, à peine penchée
 * vers l'élève (moins de 20°), ses écailles sur le plat du dôme ; les quatre nageoires longues, qui dépassent nettement
 * de la carapace de part et d'autre ; la tête qui sort à l'avant. Une sentinelle basse, plus basse que les autres
 * (`BASSES` des tests).
 */
const ROCHER_DE_LA_TORTUE: Anneau[] = [
  [1, 1.8, 1.5, 0.45],
  [1.7, 1.6, 1.35, 0.5],
  [2.15, 1.1, 0.95, 0.55],
];
/** La carapace, dans son repère : de son ventre (y = 0) au plat du dôme, le long de son dos (Y local). */
const CARAPACE_DE_LA_TORTUE: Anneau[] = [
  [0, 1.6, 1.85],
  [0.3, 1.7, 1.95],
  [0.85, 1.3, 1.5],
  [1.25, 0.7, 0.8],
];
/** Le milieu du ventre de la carapace, posé sur le rocher, et son penché vers l'élève : 9°. */
const MILIEU_DE_LA_CARAPACE: V3 = [0, 2.0, 0.3];
const PENCHE_DE_LA_CARAPACE = 0.15;
const repereDeLaCarapace = () => repere(MILIEU_DE_LA_CARAPACE, -PENCHE_DE_LA_CARAPACE, 0, 0);
/** Le plat du dôme, où sont les écailles : un repère dont −Z sort du dos, vers le ciel et un peu vers l'élève. */
const repereDesEcailles = () => {
  const h = CARAPACE_DE_LA_TORTUE[CARAPACE_DE_LA_TORTUE.length - 1][0];
  const [s, c] = [Math.sin(PENCHE_DE_LA_CARAPACE), Math.cos(PENCHE_DE_LA_CARAPACE)];
  return repere([MILIEU_DE_LA_CARAPACE[0], MILIEU_DE_LA_CARAPACE[1] + h * c, MILIEU_DE_LA_CARAPACE[2] - h * s], Math.PI / 2 - PENCHE_DE_LA_CARAPACE, 0, 0);
};
/**
 * La tête, couchée vers l'avant (−Z) : de sa base, dans la carapace, à son museau ; le rayon vertical en second. Elle
 * sort de 0,75 devant la carapace (0,45 avant la relecture de SC-3).
 */
const TETE_DE_LA_TORTUE: Anneau[] = [
  [0, 0.38, 0.32],
  [0.4, 0.4, 0.34],
  [0.8, 0.28, 0.24],
];
const BASE_DE_LA_TETE: V3 = [0, 2.45, -1.6];
const MUSEAU_DE_LA_TORTUE = BASE_DE_LA_TETE[2] - TETE_DE_LA_TORTUE[TETE_DE_LA_TORTUE.length - 1][0];
/**
 * Les nageoires, plates, de leur attache sous le bord de la carapace à leur pointe, posée sur le rocher (x à droite) :
 * celles de devant dépassent de 0,7 la carapace, celles de derrière de 0,4.
 */
const NAGEOIRES_DE_LA_TORTUE: { points: V3[]; rayons: [number, number] }[] = [
  {
    points: [
      [1.35, 2.15, -0.85],
      [2.4, 1.75, -1.5],
    ],
    rayons: [0.2, 0.05],
  },
  {
    points: [
      [1.25, 2.1, 1.25],
      [2.1, 1.75, 2.0],
    ],
    rayons: [0.14, 0.05],
  },
];

/** Le Flamant de sel, sur une patte : le corps en œuf, le cou en S, la tête et le bec courbé vers le bas. */
const CORPS_DU_FLAMANT: Anneau[] = [
  [3.5, 0.3, 0.4, 0.2],
  [3.9, 0.75, 1.1, 0.25],
  [4.6, 0.8, 1.2, 0.3],
  [5.1, 0.4, 0.7, 0.5],
];
const TETE_DU_FLAMANT: Anneau[] = [
  [7.1, 0.3, 0.32],
  [7.7, 0.32, 0.36],
  [8, 0.15, 0.18],
];
const Z_DE_LA_TETE_DU_FLAMANT = -0.85;
/** Les grains de sel de ses ailes : un petit cube de chaque côté du corps (x, y, z de son centre, à droite). */
const GRAINS_DE_SEL: [number, number, number][] = [[0.8, 4.45, 0.35]];
const DEMI_GRAIN = 0.12;

/**
 * Le Cheval à bascule, de face (sa tête vers l'élève) : deux patins courbes le long de Z, quatre jambes écartées, le
 * corps couché le long de Z, le cou et la tête, deux oreilles.
 */
const CORPS_DU_CHEVAL: Anneau[] = [
  [-1.5, 0.45],
  [-1.1, 0.7],
  [1.0, 0.7],
  [1.5, 0.4],
];
const TETE_DU_CHEVAL: Anneau[] = [
  [5.8, 0.36, 0.55, -0.25],
  [6.8, 0.38, 0.5, -0.1],
  [7.4, 0.3, 0.4, 0],
];
const Z_DE_LA_TETE_DU_CHEVAL = -1.55;
const HAUT_DU_CORPS_DU_CHEVAL = 3.6;

export const STATUES_5E: Partial<Record<BiomeId, Statue>> = {
  'maths-5e-signed-numbers': {
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
          0.07 * a.veines,
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
        0.07 * a.veines,
        a.lueur,
        { x: -0.7, z: -0.6 },
      );
    },
  },
  'maths-5e-proportionality': {
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
  'french-5e-homophones': {
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
          0.1 * a.veines,
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
        0.1 * a.veines,
        a.lueur,
      );
    },
  },
  'french-5e-conjugation': {
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
  'english-5e-vocabulary': {
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
  'english-5e-grammar': {
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
  'lv2-5e-introductions': {
    // La Diligence de cuivre (DA, LV2-2), dessinée de profil face à −Z puis tournée vers chaque caméra (`tour`), plus
    // longue que haute : la caisse basse sur quatre roues (les grandes derrière), les bagages à l'arrière de
    // l'impériale, le siège du cocher à l'avant ; la vitre de la portière, à meneau, fait ses orbites. Ses roues portent
    // des rayons de lichen, pour ne pas se lire comme des joues. Au-dessus du siège, sur un mât court, sa boussole se
    // rallume : la seule sentinelle basse, son boîtier vers cinq blocs (retouche du directeur artistique).
    nom: 'la Diligence',
    allume: 'la boussole de son siège',
    tour: TOURS_DE_LA_DILIGENCE,
    sculpture: (T, a) => {
      for (const [x, r] of ROUES_DE_LA_DILIGENCE) {
        const y = 1 + r;
        // La roue vue, à huit pans, ses deux rayons croisés et son moyeu ; celle d'en face, à peine vue, à six.
        tube(
          T,
          [
            [x, y, -1.02],
            [x, y, -0.84],
          ],
          r,
          8,
          a.pierre,
        );
        // Le bandage de lichen, la roue de pierre dedans, les rayons, et le moyeu qui dépasse (il accroche la lumière
        // quand la pierre se rallume, d'une seule couleur) : une roue, pas une joue.
        plaque(T, x, y, r, r, 8, a.lichen, () => -1.02);
        plaque(T, x, y, r * 0.74, r * 0.74, 8, a.pierre, () => -1.04);
        plaque(T, x, y, 0.12, r * 0.8, 4, a.lichen, () => -1.06);
        plaque(T, x, y, r * 0.8, 0.12, 4, a.lichen, () => -1.06);
        tube(
          T,
          [
            [x, y, -1.02],
            [x, y, -1.24],
          ],
          0.2,
          4,
          a.pierre,
        );
        tube(
          T,
          [
            [x, y, 0.84],
            [x, y, 1.02],
          ],
          r,
          6,
          a.pierre,
        );
      }
      // Le train, la caisse basse et longue, l'impériale qui déborde et les bagages.
      pave(T, -2.1, 1.7, -0.72, 2.0, 1.98, 0.72, a.pierre);
      pave(T, -2.2, 1.98, -0.8, 0.5, 3.2, 0.8, a.pierre);
      pave(T, -2.3, 3.2, -0.92, 0.65, 3.38, 0.92, a.pierre);
      pave(T, -2.1, 3.38, -0.6, -0.9, 3.9, 0.6, a.lichen);
      // Le siège du cocher, à l'avant : son coffre, son dossier, le marchepied ; le mât court de la boussole.
      pave(T, 0.5, 2.6, -0.7, 1.7, 3.05, 0.7, a.pierre);
      pave(T, 0.5, 3.05, -0.7, 0.68, 3.6, 0.7, a.pierre);
      pave(T, 1.7, 2.2, -0.72, 2.25, 2.35, 0.72, a.pierre);
      tube(
        T,
        [
          [BOUSSOLE.x, 3.05, 0],
          [BOUSSOLE.x, BOUSSOLE.y - 0.35, 0],
        ],
        0.08,
        4,
        a.pierre,
      );
      // Le boîtier de la boussole, face à l'élève.
      pave(T, BOUSSOLE.x - 0.35, BOUSSOLE.y - 0.35, -0.18, BOUSSOLE.x + 0.35, BOUSSOLE.y + 0.35, 0.12, a.pierre);
      // La vitre de la portière, partagée par son meneau (une fenêtre, pas deux yeux) : ses orbites, à l'avant de la
      // caisse, entre la grande roue et la petite, pas au milieu (un visage entre deux joues).
      orbites(T, a, -0.25, 2.76, -0.8, 0.25, 0.42);
    },
    veines: (T, a) => {
      // Le cadran de la boussole et son aiguille.
      plaque(T, BOUSSOLE.x, BOUSSOLE.y, 0.28, 0.28, 8, a.lueur, () => -0.18);
      plaque(T, BOUSSOLE.x, BOUSSOLE.y, 0.05, 0.26, 4, a.lueur, () => -0.2);
    },
  },
  // Les Gardiens d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le
  // strict nécessaire (budget de l'archipel).
  'history-5e-middle-ages': {
    nom: 'le Griffon d’émail',
    allume: 'ses émaux',
    sculpture: (T, a) => {
      fuseau(T, CORPS_DU_GRIFFON, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      fuseau(T, TETE_DU_GRIFFON, 5, a.pierre, { bas: false });
      // Le bec d'aigle, vers l'élève ; les deux ailes levées de part et d'autre du dos.
      pointe(T, [0, 6.5, devant(TETE_DU_GRIFFON, 5, 6.5).z + 0.1], 0.2, 0.5, a.pierre, [-Math.PI / 2, 0, 0], 3);
      for (const s of [-1, 1])
        dalle(
          pose(T, repereDAile(s, RACINE_DES_AILES_DU_GRIFFON)),
          [
            [0, 2.6],
            [s * 1.4, 3.4],
            [s * 1.7, 6.3],
            [s * 0.2, 5.2],
          ],
          -0.075,
          0.075,
          a.pierre,
        );
      orbites(T, a, 0, 6.8, devant(TETE_DU_GRIFFON, 5, 6.8).z, 0.22, 0.12);
    },
    veines: (T, a) => plaque(T, 0, 3.6, 0.45, 0.6, 6, a.lueur, (y) => devant(CORPS_DU_GRIFFON, 6, y).z),
  },
  'geography-5e-resources': {
    nom: 'la Libellule de jade',
    allume: 'les nervures de ses ailes',
    sculpture: (T, a) => {
      fuseau(T, CORPS_DE_LA_LIBELLULE, 5, a.pierre, { bas: false });
      fuseau(T, TETE_DE_LA_LIBELLULE, 5, a.moussue((k, j) => k === 1 && j % 2 === 0), { bas: false });
      for (const s of [-1, 1] as const)
        for (const [hauteur, fleche] of AILES_DE_LA_LIBELLULE)
          dalle(
            pose(T, repereDAileAPlat(s, hauteur)),
            AILE_DE_LA_LIBELLULE.map(([x, y]): [number, number] => [s * x, -fleche * y]),
            -0.05,
            0.05,
            a.pierre,
          );
      orbites(T, a, 0, 7.3, devant(TETE_DE_LA_LIBELLULE, 5, 7.3).z, 0.26, 0.14);
    },
    veines: (T, a) => {
      // Une nervure sur chaque aile du haut, sur sa face tournée vers le ciel.
      for (const s of [-1, 1] as const)
        for (const [hauteur, fleche] of AILES_DE_LA_LIBELLULE.slice(1)) plaque(pose(T, repereDAileAPlat(s, hauteur)), s * 1.0, fleche * 0.3, 0.65, 0.07 * a.veines, 4, a.lueur, () => -0.05);
    },
  },
  // Les Gardiens de sciences (SC-3), au strict nécessaire comme ceux d'histoire-géographie.
  'life-earth-sciences-5e-active-planet': {
    nom: 'la Tortue d’ocre',
    allume: 'les écailles de sa carapace',
    sculpture: (T, a) => {
      fuseau(T, ROCHER_DE_LA_TORTUE, 4, a.roche, { bas: false });
      fuseau(pose(T, repereDeLaCarapace()), CARAPACE_DE_LA_TORTUE, 5, a.moussue((k, j) => k === 0 && j % 3 === 0));
      // La tête, couchée vers l'avant : son profil le long de −Z, sa base dans la carapace.
      fuseau(pose(T, repere(BASE_DE_LA_TETE, -Math.PI / 2, 0, 0)), TETE_DE_LA_TORTUE, 4, a.pierre, { bas: false });
      // Les nageoires, plates, posées sur le rocher de part et d'autre : les deux grandes devant, les deux petites derrière.
      for (const s of [-1, 1])
        for (const { points, rayons } of NAGEOIRES_DE_LA_TORTUE)
          tube(
            T,
            points.map(([x, y, z]) => [s * x, y, z]),
            rayons,
            3,
            a.pierre,
            3,
          );
      orbites(T, a, 0, BASE_DE_LA_TETE[1] + 0.06, MUSEAU_DE_LA_TORTUE, 0.12, 0.1);
    },
    // Trois écailles sur le plat du dôme, serrées : une seule lueur.
    veines: (T, a) => {
      for (const [x, y] of [
        [-0.22, -0.12],
        [0.22, -0.12],
        [0, 0.24],
      ])
        plaque(pose(T, repereDesEcailles()), x, y, 0.17 * a.veines, 0.17, 6, a.lueur, () => 0);
    },
  },
  'physics-chemistry-5e-matter-universe': {
    nom: 'le Flamant de sel',
    allume: 'les grains de sel de ses ailes',
    sculpture: (T, a) => {
      // La patte dressée ; l'autre, repliée sous le ventre.
      tube(
        T,
        [
          [0, 1.1, 0],
          [0, 2.4, 0.08],
          [0, 3.7, 0.2],
        ],
        0.19,
        3,
        a.pierre,
      );
      tube(
        T,
        [
          [0.2, 3.75, 0.35],
          [0.3, 3.05, 0.75],
        ],
        0.12,
        3,
        a.pierre,
      );
      fuseau(T, CORPS_DU_FLAMANT, 5, a.moussue((k, j) => k === 1 && j % 2 === 0), { bas: false });
      tube(
        T,
        [
          [0, 4.9, -0.55],
          [0, 5.8, -0.95],
          [0, 6.5, -0.5],
          [0, 7.2, Z_DE_LA_TETE_DU_FLAMANT],
        ],
        [0.24, 0.2, 0.2, 0.2],
        4,
        a.pierre,
      );
      fuseau(T, TETE_DU_FLAMANT, 4, a.pierre, { z: Z_DE_LA_TETE_DU_FLAMANT, bas: false });
      // Le bec courbé vers le bas, vers l'élève.
      pointe(T, [0, 7.5, devant(TETE_DU_FLAMANT, 4, 7.5, Z_DE_LA_TETE_DU_FLAMANT).z + 0.08], 0.13, 0.55, a.pierre, [-Math.PI / 2 - 0.6, 0, 0], 3);
      orbites(T, a, 0, 7.72, devant(TETE_DU_FLAMANT, 4, 7.72, Z_DE_LA_TETE_DU_FLAMANT).z, 0.14, 0.1);
    },
    // Un grain de sel sur chaque aile : deux lueurs.
    veines: (T, a) => {
      for (const s of [-1, 1])
        for (const [x, y, z] of GRAINS_DE_SEL) {
          const d = DEMI_GRAIN * a.veines;
          pave(T, s * x - d, y - d, z - d, s * x + d, y + d, z + d, a.lueur);
        }
    },
  },
  'technology-5e-design': {
    nom: 'le Cheval à bascule',
    allume: 'les taches de sa robe',
    sculpture: (T, a) => {
      for (const s of [-1, 1]) {
        // Le patin courbe, le long de Z.
        tube(
          T,
          [
            [s * 0.75, 1.62, -2.0],
            [s * 0.75, 1.13, 0],
            [s * 0.75, 1.62, 2.0],
          ],
          0.12,
          3,
          a.pierre,
        );
        // Les jambes, de devant et de derrière, écartées vers les bouts du patin.
        for (const [z0, z1] of [
          [-1.35, -0.85],
          [1.35, 0.95],
        ])
          tube(
            T,
            [
              [s * 0.72, 1.3, z0],
              [s * 0.42, HAUT_DU_CORPS_DU_CHEVAL - 0.2, z1],
            ],
            0.13,
            3,
            a.pierre,
          );
      }
      fuseau(pose(T, repere([0, HAUT_DU_CORPS_DU_CHEVAL, 0.15], Math.PI / 2, 0, 0)), CORPS_DU_CHEVAL, 6, a.moussue((k, j) => k === 1 && j === 3), { rot: Math.PI / 6 });
      tube(
        T,
        [
          [0, 3.9, -1.05],
          [0, 5.0, -1.4],
          [0, 6.0, Z_DE_LA_TETE_DU_CHEVAL],
        ],
        [0.45, 0.38, 0.35],
        4,
        a.pierre,
      );
      fuseau(T, TETE_DU_CHEVAL, 4, a.pierre, { z: Z_DE_LA_TETE_DU_CHEVAL, bas: false });
      // Deux oreilles, leur pointe exactement en haut ; la queue, tombante, derrière.
      for (const s of [-1, 1]) pointe(T, [s * 0.17, 7.35, Z_DE_LA_TETE_DU_CHEVAL + 0.05], 0.1, 0.65, a.pierre, [0, 0, 0], 3);
      pointe(T, [0, 3.8, 1.6], 0.16, 0.9, a.pierre, [Math.PI / 2 + 0.7, 0, 0], 3);
      orbites(T, a, 0, 6.95, devant(TETE_DU_CHEVAL, 4, 6.95, Z_DE_LA_TETE_DU_CHEVAL).z, 0.2, 0.12);
    },
    // Une tache sur chaque flanc, tournée vers son côté.
    veines: (T, a) => {
      for (const s of [-1, 1]) plaque(pose(T, repere([s * 0.61, HAUT_DU_CORPS_DU_CHEVAL + 0.05, 0.35], 0, -s * (Math.PI / 2), 0)), 0, 0, 0.34, 0.24 * a.veines, 6, a.lueur, () => 0);
    },
  },
  // EMC 5e (EMC-2) : le strict nécessaire, Archipéo étant en pause. L'Oie d'opale, sans flamme ni symbole : debout, le
  // corps ovale, la queue relevée derrière, le long cou dressé, la tête petite et son bec court ; les ailes repliées sur
  // les flancs, dont les plumes s'allument.
  'civics-5e-equality-solidarity': {
    nom: 'l’Oie d’opale',
    allume: 'les plumes de ses ailes',
    sansFlamme: true,
    sculpture: (T, a) => {
      fuseau(T, CORPS_DE_L_OIE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      // La queue, relevée vers l'arrière.
      pointe(T, [0, 2.8, 0.8], 0.25, 0.6, a.pierre, [Math.PI / 2 - 0.6, 0, 0], 3);
      // Le long cou, des épaules à la tête.
      tube(
        T,
        [
          [0, 4.0, -0.25],
          [0, 5.2, -0.45],
          [0, 6.4, Z_DE_LA_TETE_DE_L_OIE],
        ],
        [0.3, 0.24, 0.24],
        4,
        a.pierre,
      );
      fuseau(T, TETE_DE_L_OIE, 5, a.pierre, { z: Z_DE_LA_TETE_DE_L_OIE, bas: false });
      // Le bec, court, vers l'avant.
      pointe(T, [0, 7.1, devant(TETE_DE_L_OIE, 5, 7.1, Z_DE_LA_TETE_DE_L_OIE).z + 0.05], 0.12, 0.35, a.pierre, [-Math.PI / 2, 0, 0], 3);
      for (const c of [-1, 1]) dalle(T, AILE_DE_L_OIE.map(([x, y]): [number, number] => [c * x, y]), -0.6, 0.6, a.pierre);
      orbites(T, a, 0, 7.45, devant(TETE_DE_L_OIE, 5, 7.45, Z_DE_LA_TETE_DE_L_OIE).z, 0.2, 0.11);
    },
    veines: (T, a) => {
      // Un fil de lueur le long de chaque aile repliée, de l'épaule à la pointe.
      for (const c of [-1, 1])
        veine(
          T,
          [
            [c * 1.0, 3.5],
            [c * 0.95, 2.2],
          ],
          0.09 * a.veines,
          a.lueur,
          () => -0.62,
        );
    },
  },
  // Latin-grec 5e (LCA-2) : le strict nécessaire, Archipéo étant en pause. Le Phénix d'argile, sans flamme : il renaît
  // en se rallumant, sans feu ; un oiseau de terre cuite, les ailes repliées, la longue queue qui retombe derrière
  // jusqu'au socle, une petite huppe couchée vers l'arrière, rien de dressé.
  'lca-5e-legends': {
    nom: 'le Phénix d’argile',
    allume: 'les plumes de ses ailes',
    sansFlamme: true,
    sculpture: (T, a) => {
      fuseau(T, CORPS_DU_PHENIX, 6, a.moussue((k, j) => k === 0 && j % 2 === 1), { bas: false });
      // La longue queue, qui retombe derrière jusqu'au socle.
      tube(
        T,
        [
          [0, 2.4, 0.8],
          [0, 1.8, 1.5],
          [0, 1.05, 2.0],
        ],
        [0.35, 0.28, 0.18],
        4,
        a.pierre,
      );
      // Le cou court, des épaules à la tête.
      tube(
        T,
        [
          [0, 4.6, -0.2],
          [0, 6.1, Z_DE_LA_TETE_DU_PHENIX],
        ],
        [0.32, 0.28],
        4,
        a.pierre,
      );
      fuseau(T, TETE_DU_PHENIX, 5, a.pierre, { z: Z_DE_LA_TETE_DU_PHENIX, bas: false });
      pointe(T, [0, 6.9, devant(TETE_DU_PHENIX, 5, 6.9, Z_DE_LA_TETE_DU_PHENIX).z + 0.05], 0.12, 0.35, a.pierre, [-Math.PI / 2, 0, 0], 3);
      // La huppe, couchée vers l'arrière de la tête.
      pointe(T, [0, 7.6, Z_DE_LA_TETE_DU_PHENIX + 0.3], 0.1, 0.5, a.pierre, [Math.PI / 2 + 0.9, 0, 0], 3);
      for (const c of [-1, 1]) dalle(T, AILE_DU_PHENIX.map(([x, y]): [number, number] => [c * x, y]), -0.55, 0.55, a.pierre);
      orbites(T, a, 0, 7.25, devant(TETE_DU_PHENIX, 5, 7.25, Z_DE_LA_TETE_DU_PHENIX).z, 0.22, 0.12);
    },
    veines: (T, a) => {
      for (const c of [-1, 1])
        veine(
          T,
          [
            [c * 0.95, 4.1],
            [c * 0.9, 2.4],
          ],
          0.09 * a.veines,
          a.lueur,
          () => -0.57,
        );
    },
  },
};
