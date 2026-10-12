// Le décor du cœur des îles du 3e d'Archipéo, dessiné (piste 3 « hybride » au 4e et au 3e, intention du directeur
// artistique du 12 octobre 2026 : un cœur se dessine en entier ou reste en cubes, île par île). Mêmes règles qu'au 4e
// (./heartDecor4e.ts) : de 12 à 150 triangles par ensemble, le même de près et de loin, tourné avec l'île (GD-9) ; rien
// ne s'allume, rien ne bouge.
//
// Étape 2 : les cœurs que les pièces communes et les modèles du 6e et du 5e couvrent (le Phare, le Château, le Kiosque,
// le Plateau, le Tremplin, le Forum, le Refuge). Le Belvédère, les deux Observatoires, le Studio et la Ruche gardent
// leurs cubes jusqu'à l'étape 3 (le triangle de marbre, la longue-vue, le mât d'antenne, la ruche) ; le Verger et le
// Bosquet n'ont que des formes communes (l'arbre fruitier, le laurier), la tour du Phare reste la sienne (le grand
// phare, world/decor). Restent aussi les rochers de pierre. Code pur, sans Three.js.
import type { BiomeId } from '../../biomes';
import type { Faces } from '../palette';
import { darker } from './workshop';
import { milestone, OBJECT_COLORS as C, pebble, tableOnLegs } from './pieces';
import { crystalShards, type HeartDecor, type HeartDrawing } from './heartDecor';
import { flankOn, SAWN_WOOD } from './heartDecor5e';
import { flankedOn, stoneBench } from './heartDecor4e';

/** Le rose de la balle au pied du plan incliné du Tremplin (la fleur du décor qu'elle remplace). */
const BALL_PINK = 0xe8557a;

// ---------- Le Phare (fonctions, 3e) ----------

/** Les éclats de prisme (une case) : les éclats de l'obsidienne de la Lagune, en prisme au flanc sombre, sur un pied de roche. */
const prismShards: HeartDrawing = (at, pe, e) => crystalShards(at, e, flankedOn(pe, pe.apart('prisme'), 'prisme'), darker(pe.material('pierre'), 0.8));

// ---------- Le Château (grammaire anglaise, 3e) ----------

/** Les hauteurs de la tourelle : le haut du fût, de la corniche, des merlons ; le mât et la bannière d'or. */
const TURRET = { shaft: 3.5, cornice: 3.64, merlon: 4, pole: 4.9, banner: [4.42, 4.82] } as const;

/**
 * La tourelle et ses deux créneaux (trois cases, cinq de haut au milieu) : le fût de pierre de taille, sa corniche, ses
 * quatre merlons, le mât et la bannière d'or ; de chaque côté, un muret bas et son merlon. La taille au flanc sombre sur
 * le sol de taille.
 */
const turret: HeartDrawing = (at, pe) => {
  const stone = flankedOn(pe, pe.apart('taille'), 'taille');
  const T = TURRET;
  at.block(1.5, 0.5, 0.78, 0.78, 0, T.shaft, stone);
  at.block(1.5, 0.5, 0.9, 0.9, T.shaft, T.cornice, stone);
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    at.block(1.5 + dx * 0.33, 0.5 + dy * 0.33, 0.22, 0.22, T.cornice, T.merlon, stone, { bottom: true });
  for (const x of [0.5, 2.5]) {
    at.block(x, 0.5, 0.86, 0.6, 0, 0.62, stone);
    at.block(x, 0.5, 0.3, 0.44, 0.62, 0.96, stone, { bottom: true });
  }
  const gold = pe.material('or');
  at.block(1.5, 0.5, 0.06, 0.06, T.cornice, T.pole, pe.color(C.iron), { bottom: true });
  at.box(1.53, 1.92, 0.47, 0.53, T.banner[0], T.banner[1], gold, {});
};

/** La borne de pierre de taille (une case) : la borne commune, au flanc sombre sur le sol de taille. */
const tailleMilestone: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 0.92, flankedOn(pe, pe.apart('taille'), 'taille'));

// ---------- Le Kiosque (histoire, 3e) ----------

/** La pile de reliures (deux cubes) : quatre livres couchés un peu décalés, la tranche crème de leurs pages devant. */
const bookPile: HeartDrawing = (at, pe) => {
  const binding = pe.material('reliure');
  const page = pe.color(C.cream);
  const shifts = [
    [0, 0],
    [0.05, -0.04],
    [-0.04, 0.03],
    [0.03, 0.02],
  ] as const;
  const h = 0.4;
  shifts.forEach(([dx, dy], k) => {
    const [x0, x1, y0, y1] = [0.12 + dx, 0.88 + dx, 0.18 + dy, 0.82 + dy];
    const [z0, z1] = [k * h, (k + 1) * h];
    at.box(x0, x1, y0, y1, z0, z1, binding, k < shifts.length - 1 ? { bottom: true, top: true } : undefined);
    at.quad([x0 + 0.06, y0 - 0.004, z0 + 0.07], [x1 - 0.06, y0 - 0.004, z0 + 0.07], [x1 - 0.06, y0 - 0.004, z1 - 0.07], [x0 + 0.06, y0 - 0.004, z1 - 0.07], [0.5, 0.5, (z0 + z1) / 2], page);
  });
};

/** Le banc de pierre du Kiosque (une case) : la dalle claire sur ses deux pieds de pierre. */
const kioskBench: HeartDrawing = (at, pe) => stoneBench(at, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });

// ---------- Le Plateau (géographie, 3e) ----------

/** La borne de grès rose (deux cubes) au bord du chemin. */
const sandstoneMilestone: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 1.9, pe.material('gres'));

/** Le bloc de grès rose (une case) : une grosse pierre à six pans. */
const sandstoneBlock: HeartDrawing = (at, pe) => pebble(at, 0.5, 0.5, 0, 0.42, 0.72, pe.material('gres'), 6, 0.2);

// ---------- Le Tremplin (physique-chimie, 3e) ----------

/** Le plan incliné (trois cases : la balle, deux marches de planches) : le coin de planches qui monte, la balle rose au pied. */
const inclinedPlane: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  at.ramp(1.04, 2.96, 0.1, 0.9, 0, 0.12, 1.9, { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'herbe') });
  pebble(at, 0.6, 0.5, 0, 0.3, 0.56, pe.color(BALL_PINK), 7, 0.1);
};

// ---------- Le Forum (EMC, 3e) ----------

/** Le banc d'acajou (trois cases d'assise, un dossier de deux au milieu derrière) : l'assise sur trois pieds, le dossier sur deux montants. */
const mahoganyBench: HeartDrawing = (at, pe) => {
  const wood = pe.material('acajou');
  const dark = darker(wood, 0.78);
  tableOnLegs(
    at,
    0.04,
    2.96,
    0.12,
    0.9,
    0.56,
    0.16,
    wood,
    [
      [0.3, 0.5],
      [1.5, 0.5],
      [2.7, 0.5],
    ],
    0.2,
    dark.cote,
  );
  for (const x of [1.12, 1.88]) at.block(x, 1.2, 0.16, 0.16, 0, 1.9, dark, { bottom: true });
  for (const z of [0.9, 1.3, 1.7]) at.box(0.3, 2.7, 1.12, 1.28, z, z + 0.24, wood, { bottom: false });
};

// ---------- Le Refuge (allemand ou espagnol, 3e) ----------

/** La pile de bûches (deux au sol, une dessus) : trois rondins couchés le long de y, leurs bouts sciés clairs. */
const logPile: HeartDrawing = (at, pe) => {
  const bark = pe.material('tronc');
  const sawn = pe.color(SAWN_WOOD);
  for (const [x, z, r] of [
    [0.5, 0.32, 0.3],
    [1.5, 0.32, 0.3],
    [1, 0.84, 0.28],
  ] as const) {
    at.roller('y', 0.1, 0.9, x, z, r, 7, bark);
    at.standingDisc([x, 0.1, z], 'ny', r, 7, sawn);
    at.standingDisc([x, 0.9, z], 'py', r, 7, sawn);
  }
};

/** Le banc de pierre de taille du Refuge (une case). */
const refugeBench: HeartDrawing = (at, pe) => {
  const stone: Faces = pe.apart('taille');
  stoneBench(at, stone);
};

/** Le décor du cœur des îles du 3e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const HEART_DECOR_3E: Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>> = {
  'maths-3e-functions': [{ name: 'prisme', columns: [[3, 9]], drawing: prismShards }],
  'english-3e-grammar': [
    {
      name: 'tourelle',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
      ],
      drawing: turret,
    },
    { name: 'borne', columns: [[3, 9]], drawing: tailleMilestone },
  ],
  'history-3e-twentieth-century': [
    { name: 'reliures', columns: [[9, 3]], drawing: bookPile },
    { name: 'banc', columns: [[3, 9]], drawing: kioskBench },
  ],
  'geography-3e-france': [
    { name: 'borne', columns: [[9, 3]], drawing: sandstoneMilestone },
    { name: 'gres', columns: [[10, 3]], drawing: sandstoneBlock },
  ],
  'physics-chemistry-3e-motion-energy': [
    {
      name: 'plan',
      columns: [
        [9, 3],
        [10, 3],
        [11, 3],
      ],
      drawing: inclinedPlane,
    },
  ],
  'civics-3e-democratic-life': [
    {
      name: 'banc',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
        [9, 4],
      ],
      drawing: mahoganyBench,
    },
  ],
  'lv2-3e-travel': [
    {
      name: 'buches',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: logPile,
    },
    { name: 'banc', columns: [[11, 5]], drawing: refugeBench },
  ],
};
