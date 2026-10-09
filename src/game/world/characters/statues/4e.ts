// Les Gardiens des Anciens Ateliers (4e) en sentinelles de pierre (lot R6), d'après l'intention du directeur
// artistique : la statue et ce qui s'allume. Sept îles (le Jardin des heures, LV2, en plus) pour 1 800 triangles,
// socles compris.
import type { BiomeId } from '../../../biomes';
import { anneau, pointe } from '../template';
import { devant, facette, fuseau, pave, pose, type Anneau, type Trace, type V3 } from '../painted';
import { bandeauDuSocle, dalle, orbites, plaque, tube, veine, veineSur, type Statue } from '../sentinel';

/**
 * Le Soleil de cuivre (DA, LV2-4, retouches du consultant Archipéo adoptées par le DA le 28/09) : un disque de cuivre
 * patiné, debout, et ses huit rayons droits, égaux et pointus (jamais un rouage : ni dents carrées, ni alternance de
 * longs et de courts, ni anneau au bord). Le disque, plus petit que les rayons ne sont longs, à dix-huit pans. Sans
 * mât : il repose sur la pointe de son rayon du bas, enfoncée dans un berceau de pierre sur le socle ; toute la
 * sentinelle tient dans les cinq cases, et sous 5,2 blocs dans le monde (environ 4). `enfonce` : ce que la pointe du bas
 * entre dans le berceau.
 */
export const SOLEIL_DE_CUIVRE = { rayon: 1.15, pans: 18, bout: 2.4, base: 0.26, berceau: 1.3, enfonce: 0.22, epaisseur: 0.25, rayons: 8 } as const;
const CENTRE_DU_SOLEIL = SOLEIL_DE_CUIVRE.berceau + SOLEIL_DE_CUIVRE.bout - SOLEIL_DE_CUIVRE.enfonce;
/** Les directions des rayons : le haut, puis de 45° en 45°. */
const DIRECTIONS_DES_RAYONS = Array.from({ length: SOLEIL_DE_CUIVRE.rayons }, (_, k): [number, number] => {
  const a = Math.PI / 2 + (k / SOLEIL_DE_CUIVRE.rayons) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
});
/** Le tour qui montre de face, à une caméra venue de (`dx`, `dz`), une statue plate dessinée face à −Z. */
const deFacePour = (dx: number, dz: number) => Math.atan2(-dx, -dz);
/**
 * Le tour du Soleil (DA, LV2-4) : un disque se lit mal par la tranche. Dans le monde, vers le milieu des caméras qui le
 * regardent, mesurées de son îlot : celle du bonhomme sur le Jardin (72° à l'est du sud), celle du bonhomme sur le
 * Théâtre (20 à 42°) et celle qui glisse vers lui au rallumage (85°) (three/camera.ts, `VIEW`, `ISLAND_VIEW`,
 * `viewYaw`) : tourné de 52°, aucune ne le voit à plus de 33° de face. Au défi, sa caméra de trois quarts
 * (Guardians.tsx, `cameraDirection` [−0,55 ; −0,85]) le voit à 33° : il y reste droit.
 */
const TOURS_DU_SOLEIL = { monde: deFacePour(Math.sin((52 * Math.PI) / 180), -Math.cos((52 * Math.PI) / 180)), defi: 0 };

const TORSE_DU_TITAN: Anneau[] = [
  [2.8, 1.25, 0.8],
  [4.4, 1.6, 0.95],
  [6.4, 2.5, 1.1],
];
const TETE_DU_TITAN: Anneau[] = [
  [6.3, 0.45, 0.45, -0.1],
  [7.6, 0.45, 0.42, -0.15],
  [8, 0.3, 0.28, -0.12],
];

const TORSE_DU_GOLEM: Anneau[] = [
  [3.0, 1.4, 0.8],
  [5.6, 1.6, 0.9],
];
const TETE_DU_GOLEM: Anneau[] = [
  [5.6, 0.7, 0.6],
  [6.5, 0.7, 0.6],
];
/** Les plateaux de la balance : leur x et la hauteur de leur bord. */
const PLATEAUX = { x: 1.95, y: 6.3 } as const;

/** De combien le Bélier se hausse sur sa corniche (le bout de ses cornes à huit blocs). */
const LEVE = 0.156;
const haut = (T: Trace): Trace => pose(T, (p) => [p[0], p[1] + LEVE, p[2]]);

const CORNICHE: Anneau[] = [
  [1, 1.5, 1.2],
  [2.5, 1.3, 1.0, 0.1, 0.1],
  [4.0 + LEVE, 1.45, 1.15, 0, -0.1],
];
const TETE_DU_BELIER: Anneau[] = [
  [5.9, 0.3, 0.28, -1.25],
  [6.9, 0.42, 0.4, -0.95],
  [7.3, 0.34, 0.3, -0.85],
];
/** La spirale d'une corne de bélier, du haut de la tête vers l'arrière, puis en bas et en avant. */
function spirale(s: number): V3[] {
  return Array.from({ length: 6 }, (_, i) => {
    const t = i / 5;
    const th = t * Math.PI * 1.6;
    const R = 0.62 - 0.3 * t;
    return [s * (0.32 + 0.4 * t), 7.08 + R * Math.cos(th), -0.8 + R * Math.sin(th)];
  });
}

const HIBOU: Anneau[] = [
  [1.2, 0.8, 0.7],
  [2.4, 1.1, 0.95],
  [5.0, 1.15, 0.95],
  [6.6, 0.95, 0.85],
  [7.4, 0.85, 0.75],
];
/** Le livre sous l'aile du Hibou : x0, x1, y0, y1, z0, z1. */
const LIVRE = [0.95, 1.35, 3.4, 4.6, -1.3, 0.3] as const;

const STELE: Anneau[] = [
  [1, 1.1, 0.7],
  [5.0, 0.8, 0.55],
];
const MASQUE: Anneau[] = [
  [4.6, 0.7, 0.35, -0.2],
  [5.6, 1.15, 0.45, -0.3],
  [7.2, 1.1, 0.45, -0.3],
  [8, 0.6, 0.3, -0.2],
];

const CHEMINEE: Anneau[] = [
  [5.5, 0.28],
  [7.4, 0.3],
  [8, 0.45],
];

/** Le Paon de faïence : le corps, puis la petite tête au bout du cou. */
const CORPS_DU_PAON: Anneau[] = [
  [1, 0.7, 0.8],
  [2.6, 0.85, 0.95],
  [3.6, 0.55, 0.6],
];
const TETE_DU_PAON: Anneau[] = [
  [6.4, 0.32, 0.3, -0.3],
  [7.2, 0.32, 0.3, -0.3],
  [7.5, 0.12, 0.12, -0.3],
];
/** La roue du paon, derrière lui : son pied et son rayon, et le plan de son devant. */
const ROUE = { y: 3.0, r: 2.4, z: 0.9 } as const;
/** Les yeux de la roue, sur son devant. */
const YEUX_DE_LA_ROUE: [number, number][] = [
  [-1.3, 4.4],
  [0, 4.9],
  [1.3, 4.4],
];

/** Le Poulpe de corail : la tête dressée, du pied des bras au sommet. */
const TETE_DU_POULPE: Anneau[] = [
  [1, 0.9, 0.85],
  [2.0, 1.0, 0.95],
  [3.6, 1.3, 1.2],
  [5.6, 1.15, 1.05],
  [7.3, 0.6, 0.55],
  [8, 0.2, 0.2],
];

// Les Gardiens de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le strict
// nécessaire (budget de l'archipel).

/** La Girafe d'ambre, de face : quatre jambes, le corps court, le long cou penché vers l'élève, la tête et ses ossicônes. */
const CORPS_DE_LA_GIRAFE: Anneau[] = [
  [3.2, 0.75, 1.15, 0.1],
  [3.9, 0.8, 1.2, 0.1],
  [4.4, 0.55, 0.9, 0],
];
const COU_DE_LA_GIRAFE: Anneau[] = [
  [4.0, 0.42, 0.42, -0.3],
  [6.7, 0.28, 0.28, -0.75],
];
const TETE_DE_LA_GIRAFE: Anneau[] = [
  [6.5, 0.3, 0.4, -0.95],
  [7.3, 0.3, 0.45, -1.1],
  [7.6, 0.2, 0.3, -1.05],
];

/**
 * La Cloche de cobalt sous son portique (deux poteaux, une poutre), et sa petite lampe sur poteau, à droite ; le fil de
 * cuivre va du portique à la lampe (aucun éclair).
 */
const CLOCHE: Anneau[] = [
  [3.4, 1.05],
  [3.65, 1.0],
  [4.4, 0.75],
  [5.9, 0.62],
  [6.5, 0.32],
];
const POTEAUX_DU_PORTIQUE = 1.35;
const BAS_DE_LA_POUTRE = 6.95;
const LAMPE = { x: 2.12, z: -0.3, bas: 7.12, haut: 7.6 } as const;

/**
 * Le tour du Grand-bi (DA, relecture des captures SC-3) : dessiné de profil face à −Z, il se voyait par la tranche depuis
 * l'est, d'où le regardent la caméra du Bassin (0,72 ; −0,16, `viewYaw` −32°) et celle qui glisse vers lui au rallumage ;
 * tourné vers elles comme la Diligence, sa grande roue et ses rayons de face. Au défi, sa caméra de trois quarts
 * (Guardians.tsx, `cameraDirection` [−0,55 ; −0,85]) le voit déjà de face : il y reste droit.
 */
const TOURS_DU_GRAND_BI = { monde: deFacePour(0.72, -0.16), defi: 0 };
/** Le Grand-bi d'érable, de profil face à l'élève : la grande roue (centre, rayon), la petite roue derrière. */
const GRANDE_ROUE = { x: -0.05, y: 3.45, r: 2.3, epaisseur: 0.1 } as const;
const PETITE_ROUE = { x: 1.9, y: 1.55, r: 0.45 } as const;
/** La plaque du guidon, où sont les yeux : un hexagone pointe en haut, son sommet en haut de la sentinelle. */
const PLAQUE_DU_GUIDON = { x: -0.15, y: 7.45, r: 0.55 } as const;

/** Le Lynx d'agate, assis : le corps, des hanches aux épaules ; la tête, au-dessus, un peu en avant. */
const CORPS_DU_LYNX: Anneau[] = [
  [1, 0.8, 0.95],
  [2.3, 0.9, 0.95],
  [3.8, 0.65, 0.65],
  [5.0, 0.45, 0.45],
];
const Z_DE_LA_TETE_DU_LYNX = -0.3;
const TETE_DU_LYNX: Anneau[] = [
  [5.0, 0.35, 0.35],
  [5.6, 0.58, 0.52],
  [6.5, 0.52, 0.47],
  [7.1, 0.25, 0.25],
];

/** La Cigale d'argile, accrochée à son pieu, la tête en haut, le dos vers l'élève : l'abdomen, du bout au thorax. */
const CORPS_DE_LA_CIGALE: Anneau[] = [
  [2.9, 0.08, 0.08],
  [3.6, 0.38, 0.3],
  [5.4, 0.5, 0.38],
  [6.5, 0.45, 0.35],
];
const TETE_DE_LA_CIGALE: Anneau[] = [
  [6.5, 0.5, 0.34],
  [7.0, 0.56, 0.36],
  [7.4, 0.2, 0.2],
];
/** Le plan des ailes repliées de la Cigale, devant son dos (vers −Z). */
const Z_DES_AILES_DE_LA_CIGALE = -0.42;
/** L'aile droite de la Cigale, repliée en long sur le dos (x, y) ; la gauche en miroir. */
const AILE_DE_LA_CIGALE: [number, number][] = [
  [0.04, 6.45],
  [0.62, 6.25],
  [0.58, 3.7],
  [0.08, 2.85],
];
/** La nervure de lueur d'une aile de la Cigale (x, y), le long de son bord extérieur. */
const NERVURE_DE_LA_CIGALE: [number, number][] = [
  [0.2, 6.2],
  [0.42, 5.0],
  [0.32, 3.5],
];

export const STATUES_4E: Partial<Record<BiomeId, Statue>> = {
  'maths-4e-powers': {
    nom: 'le Titan',
    allume: 'son cœur de forge',
    sculpture: (T, a) => {
      for (const s of [-1, 1])
        fuseau(
          T,
          [
            [1, 0.5],
            [3.0, 0.45],
          ],
          4,
          a.moussue((_k, j) => j === 0),
          { x: s * 0.6, bas: false, haut: false },
        );
      fuseau(T, TORSE_DU_TITAN, 4, a.pierre);
      fuseau(T, TETE_DU_TITAN, 5, a.pierre, { bas: false });
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 1.55, 6.1, 0],
            [s * 1.85, 4.5, -0.1],
            [s * 1.75, 3.1, -0.3],
          ],
          [0.45, 0.4, 0.42],
          5,
          a.pierre,
        );
      orbites(T, a, 0, 7.0, devant(TETE_DU_TITAN, 5, 7.0).z, 0.18, 0.13);
    },
    veines: (T, a) => {
      const z = (y: number) => devant(TORSE_DU_TITAN, 4, y).z;
      plaque(T, 0, 5.0, 0.36, 0.36, 8, a.lueur, z);
      for (const s of [-1, 1])
        veineSur(
          T,
          TORSE_DU_TITAN,
          4,
          [
            [s * 0.3, 5.3],
            [s * 0.75, 5.75],
            [s * 0.95, 6.3],
          ],
          0.08 * a.veines,
          a.lueur,
        );
    },
  },
  'maths-4e-algebra': {
    nom: 'le Golem des équations',
    allume: 'les plateaux de sa balance',
    sculpture: (T, a) => {
      for (const s of [-1, 1]) pave(T, s * 0.25, 1, -0.4, s * 0.95, 3.1, 0.45, a.pierre);
      fuseau(T, TORSE_DU_GOLEM, 4, a.moussue((_k, j) => j === 1));
      fuseau(T, TETE_DU_GOLEM, 4, a.pierre, { bas: false });
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * 1.5, 5.3, 0],
            [s * 1.6, 3.6, -0.2],
          ],
          0.35,
          4,
          a.pierre,
        );
      // Le fléau sur la tête : son pied, sa barre, sa pointe, et les chaînes des plateaux.
      tube(
        T,
        [
          [0, 6.5, -0.1],
          [0, 7.6, -0.1],
        ],
        0.1,
        4,
        a.pierre,
      );
      pave(T, -2.1, 7.6, -0.2, 2.1, 7.8, 0, a.pierre);
      pointe(T, [0, 7.8, -0.1], 0.1, 0.2, a.pierre, [0, 0, 0], 4);
      for (const s of [-1, 1])
        tube(
          T,
          [
            [s * PLATEAUX.x, 7.6, -0.1],
            [s * PLATEAUX.x, PLATEAUX.y, -0.1],
          ],
          0.03,
          3,
          a.pierre,
        );
      orbites(T, a, 0, 6.1, devant(TETE_DU_GOLEM, 4, 6.1).z, 0.2, 0.13);
    },
    veines: (T, a) => {
      for (const s of [-1, 1])
        fuseau(
          T,
          [
            [PLATEAUX.y - 0.25, 0.2],
            [PLATEAUX.y, 0.42],
          ],
          6,
          a.lueur,
          { x: s * PLATEAUX.x, z: -0.1 },
        );
      // Le signe égal, gravé sur la poitrine.
      for (const y of [4.55, 4.85])
        veineSur(
          T,
          TORSE_DU_GOLEM,
          4,
          [
            [-0.35, y],
            [0.35, y],
          ],
          0.12 * a.veines,
          a.lueur,
        );
    },
  },
  'french-4e-agreement': {
    nom: 'le Bélier',
    allume: 'les spirales de ses cornes',
    sculpture: (T, a) => {
      fuseau(T, CORNICHE, 5, a.moussue((k, j) => (k === 0 && j !== 4) || (k === 1 && j === 1)), { bas: false });
      const H = haut(T);
      tube(
        H,
        [
          [0, 5.1, 1.2],
          [0, 5.2, -0.3],
        ],
        [0.8, 0.9],
        6,
        a.pierre,
      );
      for (const x of [-0.45, 0.45])
        for (const z of [-0.2, 0.9])
          fuseau(
            H,
            [
              [4.0, 0.18],
              [4.8, 0.2],
            ],
            4,
            a.pierre,
            { x, z, bas: false, haut: false },
          );
      fuseau(H, TETE_DU_BELIER, 5, a.pierre);
      orbites(H, a, 0, 6.72, devant(TETE_DU_BELIER, 5, 6.72).z, 0.2, 0.1);
    },
    veines: (T, a) => {
      for (const s of [-1, 1]) tube(haut(T), spirale(s), [0.2, 0.18, 0.15, 0.12, 0.09, 0.05], 3, a.lueur);
    },
  },
  'french-4e-vocabulary': {
    nom: 'le Hibou',
    allume: 'la tranche du livre sous son aile',
    sculpture: (T, a) => {
      fuseau(T, HIBOU, 6, a.moussue((k, j) => k === 0 && j % 2 === 0));
      for (const s of [-1, 1]) {
        pointe(T, [s * 0.5, 7.3, -0.1], 0.14, 0.7 / Math.cos(0.3), a.pierre, [0, 0, -s * 0.3], 3);
        fuseau(
          T,
          [
            [2.4, 0.25, 0.62, 0.1],
            [5.9, 0.16, 0.8, 0.15],
          ],
          4,
          a.pierre,
          { x: s * 1.2 },
        );
      }
      const [x0, x1, y0, y1, z0, z1] = LIVRE;
      pave(T, x0, y0, z0, x1, y1, z1, a.pierre);
      const z = devant(HIBOU, 6, 6.6).z;
      orbites(T, a, 0, 6.6, z, 0.3, 0.28);
      pointe(T, [0, 6.28, z + 0.04], 0.1, 0.36, a.pierre, [-(Math.PI / 2 + 0.4), 0, 0], 3);
    },
    veines: (T, a) => {
      const [x0, x1, y0, y1, z0] = LIVRE;
      const z = z0 - 0.014;
      const dos: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, z + 1];
      facette(
        T,
        [
          [x0 + 0.06, y0 + 0.06, z],
          [x1 - 0.06, y0 + 0.06, z],
          [x1 - 0.06, y1 - 0.06, z],
          [x0 + 0.06, y1 - 0.06, z],
        ],
        dos,
        a.lueur,
      );
      // Le signet qui pend.
      facette(
        T,
        [
          [1.12, y0 - 0.5, z],
          [1.2, y0 - 0.5, z],
          [1.2, y0 + 0.06, z],
          [1.12, y0 + 0.06, z],
        ],
        dos,
        a.lueur,
      );
    },
  },
  'english-4e-comprehension': {
    nom: 'le Masque',
    allume: 'la rampe de son socle',
    sculpture: (T, a) => {
      fuseau(T, STELE, 4, a.moussue((_k, j) => j === 0 || j === 2), { bas: false });
      fuseau(T, MASQUE, 8, a.pierre);
      const z = (y: number) => devant(MASQUE, 8, y).z;
      pointe(T, [0, 6.0, z(6.0) + 0.05], 0.12, 0.3, a.pierre, [-(Math.PI / 2 + 0.3), 0, 0], 3);
      orbites(T, a, 0, 6.6, z(6.6), 0.42, 0.3);
      // La bouche, droite et neutre, sombre comme les orbites.
      veineSur(
        T,
        MASQUE,
        8,
        [
          [-0.36, 5.4],
          [0.36, 5.4],
        ],
        0.1 * a.veines,
        a.orbite,
      );
    },
    // La rampe, allumée sur tout l'avant du socle (la face du devant et ses deux voisines).
    veines: (T, a) => bandeauDuSocle(T, [6, 7, 0], 0.64, 0.82, a.lueur),
  },
  'lv2-4e-daily-life': {
    // Le Soleil de cuivre (DA, LV2-4) : un disque de cuivre patiné, sans visage ni lueur orange, ses huit rayons droits
    // et pointus. Ce qui se rallume est commun à tous les Gardiens : le fil de ses rayons, plus clair à chaque épreuve
    // réussie du défi, et, à la victoire, toute la statue en Sable. Sans mât.
    nom: 'le Soleil de cuivre',
    allume: 'ses rayons',
    tour: TOURS_DU_SOLEIL,
    sculpture: (T, a) => {
      const S = SOLEIL_DE_CUIVRE;
      const c = CENTRE_DU_SOLEIL;
      // Le berceau de pierre, sur le socle, où s'enfonce la pointe du rayon du bas.
      pave(T, -0.55, 1, -0.4, 0.55, S.berceau, 0.4, a.pierre);
      // Le disque : dix-huit pans, patiné au milieu (le vert-de-gris, en lichen), le bord de cuivre en pierre.
      const disque = Array.from({ length: S.pans }, (_, i): [number, number] => {
        const t = Math.PI / 2 + (i / S.pans) * Math.PI * 2;
        return [S.rayon * Math.cos(t), c + S.rayon * Math.sin(t)];
      });
      dalle(T, disque, -S.epaisseur, S.epaisseur, a.pierre);
      plaque(T, 0, c, S.rayon * 0.72, S.rayon * 0.72, S.pans, a.lichen, () => -S.epaisseur);
      // Les rayons : des triangles pointus, tous égaux, du bord du disque (un peu dedans) jusqu'à la pointe.
      for (const [dx, dy] of DIRECTIONS_DES_RAYONS) {
        const [px, py] = [-dy, dx];
        const pt = (r: number, w: number): [number, number] => [r * dx + w * px, c + r * dy + w * py];
        const r0 = S.rayon - 0.15;
        dalle(T, [pt(r0, -S.base), pt(S.bout, 0), pt(r0, S.base)], -S.epaisseur * 0.8, S.epaisseur * 0.8, a.pierre);
      }
    },
    veines: (T, a) => {
      const S = SOLEIL_DE_CUIVRE;
      const c = CENTRE_DU_SOLEIL;
      // Le fil de chaque rayon : il part du cœur du disque (les huit s'y rejoignent, une seule lueur en étoile) et court
      // sur la face avant du rayon presque jusqu'à la pointe, effilé comme lui, sans jamais le déborder (à mi-largeur du
      // rayon au plus). Pas d'anneau au bord du disque : il ferait une roue dentée.
      const [zd, zr] = [-S.epaisseur - 0.03, -S.epaisseur * 0.8 - 0.014];
      const r0 = S.rayon - 0.15;
      const demi = (r: number) => (S.base * (S.bout - r)) / (S.bout - r0);
      const [coeur, ra, rb] = [0.3, S.rayon, S.bout - 0.25];
      const [ha, hb] = [Math.min(0.05 * a.veines, demi(ra) * 0.5), Math.min(0.012 * a.veines, demi(rb) * 0.5)];
      for (const [dx, dy] of DIRECTIONS_DES_RAYONS) {
        const [px, py] = [-dy, dx];
        const p = (r: number, w: number, z: number): V3 => [r * dx + w * px, c + r * dy + w * py, z];
        facette(T, [p(coeur, -ha, zd), p(ra, -ha, zd), p(ra, ha, zd), p(coeur, ha, zd)], [0, c, zd + 1], a.lueur);
        facette(T, [p(ra, -ha, zr), p(rb, -hb, zr), p(rb, hb, zr), p(ra, ha, zr)], [0, c, zr + 1], a.lueur);
      }
    },
  },
  'english-4e-grammar': {
    nom: 'la Locomotive',
    allume: 'son fanal',
    sculpture: (T, a) => {
      pave(T, -1.0, 1, -0.95, 1.0, 3.6, 1.4, a.pierre);
      for (const s of [-1, 1]) pave(T, s * 0.5, 3.6, -1.5, s * 0.7, 3.72, 1.9, a.pierre);
      for (const s of [-1, 1])
        for (const z of [-0.8, 0.6])
          tube(
            T,
            [
              [s * 0.62, 4.2, z],
              [s * 0.86, 4.2, z],
            ],
            0.5,
            5,
            a.pierre,
          );
      tube(
        T,
        [
          [0, 4.9, -1.4],
          [0, 4.9, 0.6],
        ],
        0.8,
        8,
        a.pierre,
      );
      pave(T, -0.95, 3.9, 0.5, 0.95, 6.4, 1.8, a.pierre);
      pave(T, -1.1, 6.4, 0.4, 1.1, 6.6, 1.95, a.pierre);
      fuseau(T, CHEMINEE, 6, a.pierre, { z: -0.9, bas: false });
      pave(T, -0.95, 3.75, -1.6, 0.95, 4.2, -1.45, a.pierre);
    },
    veines: (T, a) => {
      plaque(T, 0, 4.9, 0.3, 0.3, 8, a.lueur, () => -1.4);
      for (const s of [-1, 1]) plaque(T, s * 0.65, 3.98, 0.1, 0.1, 4, a.lueur, () => -1.6);
    },
  },
  // Les Gardiens d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ces sentinelles n'ont que le
  // strict nécessaire (budget de l'archipel). Le Paon de faïence ne porte aucun symbole national (DA, HG-3).
  'history-4e-revolutions': {
    nom: 'le Paon de faïence',
    allume: 'les yeux de sa roue',
    sculpture: (T, a) => {
      // La roue déployée derrière lui, en éventail.
      const bord: [number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        const t = Math.PI * (0.08 + (0.84 * i) / 6);
        bord.push([Math.cos(t) * ROUE.r, ROUE.y + Math.sin(t) * ROUE.r]);
      }
      dalle(T, [[0, ROUE.y - 0.6], ...bord], ROUE.z, ROUE.z + 0.15, a.pierre);
      fuseau(T, CORPS_DU_PAON, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      tube(
        T,
        [
          [0, 3.4, -0.1],
          [0, 5.0, -0.3],
          [0, 6.5, -0.3],
        ],
        0.22,
        4,
        a.pierre,
      );
      fuseau(T, TETE_DU_PAON, 5, a.pierre, { bas: false });
      pointe(T, [0, 6.8, devant(TETE_DU_PAON, 5, 6.8).z + 0.05], 0.08, 0.3, a.pierre, [-Math.PI / 2, 0, 0], 3);
      pointe(T, [0, 7.45, -0.3], 0.08, 0.55, a.pierre, [0, 0, 0], 3);
      orbites(T, a, 0, 7.0, devant(TETE_DU_PAON, 5, 7.0).z, 0.14, 0.07);
    },
    veines: (T, a) => {
      for (const [x, y] of YEUX_DE_LA_ROUE) plaque(T, x, y, 0.24 * a.veines, 0.3 * a.veines, 6, a.lueur, () => ROUE.z);
    },
  },
  'geography-4e-globalization': {
    nom: 'le Poulpe de corail',
    allume: 'ses ventouses',
    sculpture: (T, a) => {
      fuseau(T, TETE_DU_POULPE, 6, a.moussue((k, j) => k === 0 && j % 2 === 1), { bas: false });
      // Les huit bras, étalés tout autour sur le socle, le bout relevé.
      for (let k = 0; k < 8; k++) {
        const t = (k * Math.PI) / 4 + Math.PI / 8;
        const [c, s] = [Math.cos(t), Math.sin(t)];
        tube(
          T,
          [
            [c * 0.8, 1.5, s * 0.8],
            [c * 1.6, 1.1, s * 1.6],
            [c * 2.1, 1.4, s * 2.1],
          ],
          [0.3, 0.2, 0],
          3,
          a.pierre,
        );
      }
      orbites(T, a, 0, 3.6, devant(TETE_DU_POULPE, 6, 3.6).z, 0.42, 0.16);
    },
    veines: (T, a) => {
      // Trois ventouses sur le devant, sous les yeux.
      for (const x of [-0.5, 0, 0.5]) plaque(T, x, 2.3, 0.14 * a.veines, 0.14 * a.veines, 6, a.lueur, (y) => devant(TETE_DU_POULPE, 6, y).z);
    },
  },
  // Les Gardiens de sciences (SC-3), au strict nécessaire comme ceux d'histoire-géographie.
  'life-earth-sciences-4e-cells-evolution': {
    nom: 'la Girafe d’ambre',
    allume: 'les taches de son cou',
    sculpture: (T, a) => {
      for (const [x, z] of [
        [-0.5, -0.75],
        [0.5, -0.75],
        [-0.5, 0.9],
        [0.5, 0.9],
      ])
        tube(
          T,
          [
            [x, 1, z],
            [x * 0.9, 3.4, z * 0.8],
          ],
          0.14,
          4,
          a.pierre,
        );
      fuseau(T, CORPS_DE_LA_GIRAFE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0));
      fuseau(T, COU_DE_LA_GIRAFE, 6, a.pierre, { bas: false });
      fuseau(T, TETE_DE_LA_GIRAFE, 5, a.pierre, { bas: false });
      // Les deux ossicônes, leur bout en haut de la sentinelle ; deux oreilles sur les côtés.
      for (const s of [-1, 1]) {
        pointe(T, [s * 0.14, 7.5, -0.95], 0.08, 0.5, a.pierre, [0, 0, 0], 3);
        pointe(T, [s * 0.26, 7.35, -0.95], 0.08, 0.32, a.pierre, [0, 0, -s * 1.2], 3);
      }
      orbites(T, a, 0, 7.12, devant(TETE_DE_LA_GIRAFE, 5, 7.12).z, 0.18, 0.1);
    },
    // Deux taches sur le devant du cou.
    veines: (T, a) => {
      for (const y of [4.8, 5.85]) plaque(T, 0, y, 0.13 * a.veines, 0.2, 6, a.lueur, (yy) => devant(COU_DE_LA_GIRAFE, 6, yy).z);
    },
  },
  'physics-chemistry-4e-signals-circuits': {
    nom: 'la Cloche de cobalt',
    allume: 'son fil de cuivre, jusqu’à la lampe',
    sculpture: (T, a) => {
      for (const s of [-1, 1]) fuseau(T, [[1, 0.17], [BAS_DE_LA_POUTRE, 0.14]], 4, s < 0 ? a.moussue((_, j) => j === 1) : a.pierre, { x: s * POTEAUX_DU_PORTIQUE, bas: false, haut: false });
      pave(T, -POTEAUX_DU_PORTIQUE - 0.25, BAS_DE_LA_POUTRE, -0.18, POTEAUX_DU_PORTIQUE + 0.25, 7.3, 0.18, a.pierre);
      // L'anneau qui tient la cloche sous la poutre, puis la cloche.
      pave(T, -0.12, 6.4, -0.12, 0.12, BAS_DE_LA_POUTRE, 0.12, a.pierre);
      fuseau(T, CLOCHE, 6, a.moussue((k, j) => k === 0 && j % 2 === 0));
      // La lampe sur son poteau : le poteau, la cage (le verre, dans les veines), le chapeau dont la pointe est en haut.
      fuseau(T, [[1, 0.1], [LAMPE.bas, 0.08]], 4, a.pierre, { x: LAMPE.x, z: LAMPE.z, bas: false });
      pointe(T, [LAMPE.x, LAMPE.haut, LAMPE.z], 0.27, 8 - LAMPE.haut, a.pierre, [0, 0, 0], 4);
      orbites(T, a, 0, 4.85, devant(CLOCHE, 6, 4.85).z, 0.3, 0.16);
    },
    // Le fil de cuivre, de la poutre jusqu'à la lampe, et le verre de la lampe : une seule lueur.
    veines: (T, a) => {
      tube(
        T,
        [
          [POTEAUX_DU_PORTIQUE + 0.2, 7.3, 0],
          [1.8, 7.7, -0.15],
          [LAMPE.x, LAMPE.haut - 0.05, LAMPE.z],
        ],
        0.06 * a.veines,
        4,
        a.lueur,
      );
      fuseau(T, [[LAMPE.bas, 0.17], [LAMPE.haut, 0.21]], 6, a.lueur, { x: LAMPE.x, z: LAMPE.z });
    },
  },
  'technology-4e-modeling': {
    nom: 'le Grand-bi d’érable',
    allume: 'les rayons de sa roue',
    tour: TOURS_DU_GRAND_BI,
    sculpture: (T, a) => {
      anneau(T, [GRANDE_ROUE.x, GRANDE_ROUE.y, 0], GRANDE_ROUE.r, GRANDE_ROUE.epaisseur, a.pierre, [0, 0, 0], 10, 3);
      anneau(T, [PETITE_ROUE.x, PETITE_ROUE.y, 0], PETITE_ROUE.r, GRANDE_ROUE.epaisseur, a.pierre, [0, 0, 0], 6, 3);
      // La fourche, du moyeu au guidon ; le cadre courbe, du guidon à la petite roue ; la selle ; le guidon.
      tube(
        T,
        [
          [GRANDE_ROUE.x, GRANDE_ROUE.y, -0.2],
          [GRANDE_ROUE.x - 0.05, 6.3, -0.1],
        ],
        0.1,
        4,
        a.pierre,
      );
      tube(
        T,
        [
          [GRANDE_ROUE.x, 6.2, 0],
          [1.0, 5.6, 0],
          [1.7, 3.6, 0],
          [PETITE_ROUE.x, PETITE_ROUE.y, 0],
        ],
        0.1,
        4,
        a.pierre,
      );
      pave(T, 0.15, 6.15, -0.2, 0.75, 6.35, 0.2, a.pierre);
      tube(
        T,
        [
          [GRANDE_ROUE.x - 0.05, 6.25, 0],
          [PLAQUE_DU_GUIDON.x, PLAQUE_DU_GUIDON.y - PLAQUE_DU_GUIDON.r, 0],
        ],
        0.09,
        4,
        a.pierre,
      );
      tube(
        T,
        [
          [PLAQUE_DU_GUIDON.x, 6.75, -0.7],
          [PLAQUE_DU_GUIDON.x, 6.75, 0.7],
        ],
        0.08,
        4,
        a.pierre,
      );
      const hexagone = Array.from({ length: 6 }, (_, i): [number, number] => {
        const t = Math.PI / 2 + (i * Math.PI) / 3;
        return [PLAQUE_DU_GUIDON.x + Math.cos(t) * PLAQUE_DU_GUIDON.r, PLAQUE_DU_GUIDON.y + Math.sin(t) * PLAQUE_DU_GUIDON.r];
      });
      dalle(T, hexagone, -0.08, 0.08, a.pierre);
      orbites(T, a, PLAQUE_DU_GUIDON.x, PLAQUE_DU_GUIDON.y, -0.08, 0.2, 0.14);
    },
    // Trois rayons de la grande roue, qui se croisent au moyeu : une seule lueur.
    veines: (T, a) => {
      for (const t of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
        const [dx, dy] = [Math.cos(t) * (GRANDE_ROUE.r - 0.05), Math.sin(t) * (GRANDE_ROUE.r - 0.05)];
        tube(
          T,
          [
            [GRANDE_ROUE.x - dx, GRANDE_ROUE.y - dy, 0],
            [GRANDE_ROUE.x + dx, GRANDE_ROUE.y + dy, 0],
          ],
          0.05 * a.veines,
          3,
          a.lueur,
        );
      }
    },
  },
  // EMC 4e (EMC-2) : le strict nécessaire, Archipéo étant en pause. Le Lynx d'agate, sans flamme ni symbole, vigilant,
  // jamais menaçant : assis, les pattes de devant droites, la tête haute, la collerette sur les joues, les oreilles à
  // pinceaux, la queue courte ; les taches de son pelage s'allument.
  'civics-4e-rights-freedoms': {
    nom: 'le Lynx d’agate',
    allume: 'les taches de son pelage',
    sansFlamme: true,
    sculpture: (T, a) => {
      fuseau(T, CORPS_DU_LYNX, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
      // Les pattes de devant, droites, du sol à la poitrine.
      for (const x of [-0.3, 0.3])
        tube(
          T,
          [
            [x, 1, -0.75],
            [x * 0.9, 3.8, -0.5],
          ],
          0.14,
          4,
          a.pierre,
        );
      // La queue courte, posée derrière.
      pointe(T, [0, 1.3, 0.85], 0.16, 0.45, a.pierre, [Math.PI / 2 - 0.3, 0, 0], 3);
      fuseau(T, TETE_DU_LYNX, 5, a.pierre, { z: Z_DE_LA_TETE_DU_LYNX, bas: false });
      // Le museau, court, vers l'avant.
      pointe(T, [0, 5.85, devant(TETE_DU_LYNX, 5, 5.85, Z_DE_LA_TETE_DU_LYNX).z + 0.05], 0.16, 0.25, a.pierre, [-Math.PI / 2, 0, 0], 3);
      for (const s of [-1, 1]) {
        // La collerette, de chaque côté des joues, vers le bas.
        pointe(T, [s * 0.48, 5.8, Z_DE_LA_TETE_DU_LYNX - 0.1], 0.15, 0.35, a.pierre, [0, 0, s * (Math.PI / 2 + 0.6)], 3);
        // Les oreilles et leurs pinceaux : une pointe haute et fine, droite, son bout en haut de la sentinelle.
        pointe(T, [s * 0.24, 7.0, Z_DE_LA_TETE_DU_LYNX], 0.12, 1.0, a.pierre, [0, 0, 0], 3);
      }
      orbites(T, a, 0, 6.25, devant(TETE_DU_LYNX, 5, 6.25, Z_DE_LA_TETE_DU_LYNX).z, 0.2, 0.1);
    },
    // Trois taches sur le devant du corps, sous la tête.
    veines: (T, a) => {
      for (const [x, y] of [
        [-0.3, 2.4],
        [0.3, 3.0],
        [-0.15, 3.7],
      ])
        plaque(T, x, y, 0.13 * a.veines, 0.15, 6, a.lueur, (yy) => devant(CORPS_DU_LYNX, 6, yy).z);
    },
  },
  // Latin-grec 4e (LCA-2) : le strict nécessaire, Archipéo étant en pause. La Cigale d'argile, sans flamme : accrochée en
  // haut d'un pieu, la tête en haut, le dos tourné vers l'élève comme une cigale de terre cuite au mur d'une maison ; les ailes
  // repliées en long sur le dos, leurs nervures s'allument ; les gros yeux sur les côtés de la tête.
  'lca-4e-cities': {
    nom: 'la Cigale d’argile',
    allume: 'les nervures de ses ailes',
    sansFlamme: true,
    sculpture: (T, a) => {
      // Le pieu, derrière elle, du socle au-dessus de sa tête.
      fuseau(
        T,
        [
          [1, 0.3],
          [8, 0.26],
        ],
        5,
        a.moussue((k, j) => k === 0 && j % 2 === 0),
        { z: 0.45 },
      );
      fuseau(T, CORPS_DE_LA_CIGALE, 6, a.pierre, { bas: false });
      fuseau(T, TETE_DE_LA_CIGALE, 6, a.pierre, { bas: false });
      // Les gros yeux, de chaque côté de la tête.
      for (const s of [-1, 1]) pointe(T, [s * 0.5, 6.95, -0.1], 0.16, 0.2, a.pierre, [0, 0, -s * (Math.PI / 2)], 4);
      for (const c of [-1, 1])
        dalle(
          T,
          AILE_DE_LA_CIGALE.map(([x, y]): [number, number] => [c * x, y]),
          Z_DES_AILES_DE_LA_CIGALE - 0.08,
          Z_DES_AILES_DE_LA_CIGALE,
          a.pierre,
        );
      orbites(T, a, 0, 7.05, devant(TETE_DE_LA_CIGALE, 6, 7.05).z, 0.22, 0.1);
    },
    // Une nervure de lueur sur chaque aile, le long de son bord.
    veines: (T, a) => {
      for (const c of [-1, 1])
        veine(
          T,
          NERVURE_DE_LA_CIGALE.map(([x, y]): [number, number] => [c * x, y]),
          0.09 * a.veines,
          a.lueur,
          () => Z_DES_AILES_DE_LA_CIGALE - 0.08,
        );
    },
  },
};
