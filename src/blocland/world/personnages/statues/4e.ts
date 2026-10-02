// Les Gardiens des Anciens Ateliers (4e) en sentinelles de pierre (lot R6), d'après l'intention du directeur
// artistique : la statue et ce qui s'allume. Sept îles (le Jardin des heures, LV2, en plus) pour 1 800 triangles,
// socles compris.
import type { BiomeId } from '../../../biomes';
import { pointe } from '../gabarit';
import { devant, facette, fuseau, pave, pose, type Anneau, type Trace, type V3 } from '../peint';
import { bandeauDuSocle, dalle, orbites, plaque, tube, veineSur, type Statue } from '../sentinelle';

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
export const TOURS_DU_SOLEIL = { monde: deFacePour(Math.sin((52 * Math.PI) / 180), -Math.cos((52 * Math.PI) / 180)), defi: 0 };

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
};
