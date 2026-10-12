// Le décor du cœur des îles du 3e d'Archipéo, dessiné (piste 3 « hybride » au 4e et au 3e, intention du directeur
// artistique du 12 octobre 2026 : un cœur se dessine en entier ou reste en cubes, île par île). Mêmes règles qu'au 4e
// (./heartDecor4e.ts) : de 12 à 150 triangles par ensemble, le même de près et de loin, tourné avec l'île (GD-9) ; rien
// ne s'allume, rien ne bouge.
//
// Étape 2 : les cœurs que les pièces communes et les modèles du 6e et du 5e couvrent (le Phare, le Château, le Kiosque,
// le Plateau, le Tremplin, le Forum, le Refuge). Étape 3 : le Belvédère, les deux Observatoires, le Studio et la Ruche,
// faits des formes nouvelles (./silhouettes43.ts : le triangle de marbre, la longue-vue, le mât d'antenne, la ruche), et
// le laurier du Bosquet, en anneaux à huit pans. Le Verger n'a que son arbre fruitier, déjà dans les formes communes du
// décor ; la tour du Phare n'est pas posée dans Archipéo (le grand phare la remplace, `sansToursDuCoeur`). Restent les
// rochers de pierre. Les matières claires sur leur propre sol (le marbre, le quartz, la lentille, l'antenne, la taille)
// prennent un flanc sombre (`flankedOn`). Code pur, sans Three.js.
import type { BiomeId } from '../../biomes';
import type { Faces } from '../palette';
import { TRIANGLE_DU_BELVEDERE } from '../decor';
import { darker, scaleColor } from './workshop';
import { milestone, OBJECT_COLORS as C, type Paint, pebble, stoneStep, tableOnLegs } from './pieces';
import { crystalShards, flankedOn, flankOn, type HeartDecor, type HeartDrawing, SAWN_WOOD, stoneBench } from './heartDecor';
import { antennaMast, marbleTriangle, skep, spyglass } from './silhouettes43';

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

// ---------- Le Belvédère (géométrie, 3e) ----------

/** Le triangle 3-4-5 de marbre (huit cases) : le dessus de marbre, les côtés au flanc sombre sur le sol de marbre. */
const belvedereTriangle: HeartDrawing = (at, pe) => marbleTriangle(at, flankedOn(pe, pe.apart('marbre'), 'marbre'));

/** La borne de marbre (une case), au flanc sombre sur le sol de marbre. */
const marbleMilestone: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 0.92, flankedOn(pe, pe.apart('marbre'), 'marbre'));

// ---------- Les longues-vues des deux Observatoires (3e) ----------

/** Le pied de bois des longues-vues (le même qu'à la Vigie). */
const standOf = (pe: Paint): Faces => ({ dessus: pe.role('yardPost'), cote: scaleColor(pe.role('yardPost'), 0.86) });

/** Le télescope de l'Observatoire des données (quatre cases en escalier) : la longue-vue, son tube de quartz au flanc sombre. */
const dataTelescope: HeartDrawing = (at, pe) => spyglass(at, 1.2, 0.5, [0.4, 0.5, 1.4], [3.1, 0.5, 3.1], flankedOn(pe, pe.apart('quartz'), 'quartz'), standOf(pe));

/** Le dôme de quartz (deux cubes) : le pilier, sa corniche de dalle claire, la coupole à huit pans. */
const quartzDome: HeartDrawing = (at, pe) => {
  const quartz = flankedOn(pe, pe.apart('quartz'), 'quartz');
  at.block(0.5, 0.5, 0.62, 0.62, 0, 1.1, quartz, { bottom: true, top: true });
  at.block(0.5, 0.5, 0.78, 0.78, 1.1, 1.24, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.prism(0.5, 0.5, 0.42, 0.3, 1.24, 1.6, 8, quartz, Math.PI / 8, true);
  at.prism(0.5, 0.5, 0.3, 0, 1.6, 1.9, 8, quartz, Math.PI / 8);
};

/** Les éclats de quartz (une case) : au flanc sombre, sur un pied de roche. */
const quartzShards: HeartDrawing = (at, pe, e) => crystalShards(at, e, flankedOn(pe, pe.apart('quartz'), 'quartz'), darker(pe.material('pierre'), 0.8));

/** La lunette de l'Observatoire des textes (son pied de pierre, trois cases de tube au fond) : la longue-vue, son tube de lentille. */
const textTelescope: HeartDrawing = (at, pe) => spyglass(at, 1.5, 0.9, [0.12, 0.9, 1.9], [2.9, 0.9, 2.74], flankedOn(pe, pe.apart('lentille'), 'lentille'), standOf(pe));

/** La pile de livres (deux cubes) : un gros livre de planches, un livre de parchemin dessus, leurs chants sombres sur la lentille. */
const lensBooks: HeartDrawing = (at, pe) => {
  at.box(0.12, 0.88, 0.18, 0.82, 0, 0.34, flankedOn(pe, pe.material('planches'), 'lentille'));
  at.box(0.2, 0.84, 0.24, 0.78, 0.34, 0.6, flankedOn(pe, pe.apart('parchemin'), 'lentille'));
  at.box(0.16, 0.76, 0.3, 0.74, 0.6, 0.8, flankedOn(pe, pe.material('planches'), 'lentille'));
};

/** La lentille debout (une case) sur son pied de bois : ses deux faces claires, sa tranche au flanc sombre. */
const standingLens: HeartDrawing = (at, pe) => {
  const lens = pe.apart('lentille');
  const wood = standOf(pe);
  at.block(0.5, 0.5, 0.56, 0.32, 0, 0.16, wood);
  at.block(0.5, 0.5, 0.18, 0.18, 0.16, 0.34, wood, { bottom: true, top: true });
  const [r, z] = [0.32, 0.66];
  at.roller('y', 0.42, 0.58, 0.5, z, r, 8, flankOn(pe, lens.cote, 'lentille'));
  at.standingDisc([0.5, 0.42, z], 'ny', r, 8, lens.dessus, Math.PI / 8);
  at.standingDisc([0.5, 0.58, z], 'py', r, 8, lens.dessus, Math.PI / 8);
};

// ---------- Le Studio (compréhension anglaise, 3e) ----------

/** Le mât d'antenne du Studio (six cases) : sa marche de pierre, le mât d'antenne au flanc sombre sur le sol d'antennes, le voyant mat. */
const studioMast: HeartDrawing = (at, pe) => {
  stoneStep(at, pe, 0.1, 0.9, 0.1, 0.9, 0, 0.46);
  antennaMast(at, pe, 0.5, 0.5, 0.46, 5.5, flankedOn(pe, pe.apart('antenne'), 'antenne'));
};

/** L'antenne tombée (une case) : un bout de mât couché et sa barre, au flanc sombre. */
const fallenAntenna: HeartDrawing = (at, pe) => {
  const t = flankedOn(pe, pe.apart('antenne'), 'antenne');
  at.box(0.62, 0.8, 0.12, 0.88, 0, 0.16, t);
  at.box(0.06, 0.94, 0.38, 0.6, 0.16, 0.38, t, { bottom: false });
};

// ---------- La Ruche (numérique, 3e) ----------

/** La ruche en dôme (trois sur trois), sur sa pierre plate. */
const hive: HeartDrawing = (at, pe) => skep(at, pe, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });

// ---------- Le Bosquet (latin et grec, 3e) ----------

/**
 * Le laurier taillé en boule sur son tronc (deux cases : le tronc et la boule, la boule qui déborde sur la seconde) :
 * le tronc de bois, la boule de laurier en trois anneaux à huit pans.
 */
const laurel: HeartDrawing = (at, pe) => {
  const leaf = pe.material('laurier');
  const [cx, cy] = [0.8, 0.5];
  at.block(0.5, 0.5, 0.22, 0.22, 0, 1.0, pe.material('tronc'), { bottom: true, top: true });
  at.prism(cx, cy, 0.26, 0.62, 0.82, 1.24, 8, leaf, Math.PI / 8, true);
  at.prism(cx, cy, 0.62, 0.66, 1.24, 1.7, 8, leaf, Math.PI / 8, true);
  at.prism(cx, cy, 0.66, 0.28, 1.7, 2.22, 8, leaf, Math.PI / 8);
};

/** Le décor du cœur des îles du 3e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const HEART_DECOR_3E: Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>> = {
  'maths-3e-geometry': [
    { name: 'triangle', columns: TRIANGLE_DU_BELVEDERE, drawing: belvedereTriangle },
    { name: 'marbre', columns: [[3, 9]], drawing: marbleMilestone },
  ],
  'maths-3e-statistics': [
    { name: 'telescope', columns: [7, 8, 9, 10].map((x) => [x, 3] as const), drawing: dataTelescope },
    { name: 'dome', columns: [[9, 5]], drawing: quartzDome },
    { name: 'quartz', columns: [[3, 9]], drawing: quartzShards },
  ],
  'french-3e-close-reading': [
    {
      name: 'lunette',
      columns: [
        [9, 3],
        [8, 4],
        [9, 4],
        [10, 4],
      ],
      drawing: textTelescope,
    },
    { name: 'livres', columns: [[7, 2]], drawing: lensBooks },
    { name: 'lentille', columns: [[3, 9]], drawing: standingLens },
  ],
  'english-3e-comprehension': [
    { name: 'mat', columns: [[9, 3]], drawing: studioMast },
    { name: 'antenne', columns: [[3, 9]], drawing: fallenAntenna },
  ],
  'technology-3e-digital': [{ name: 'ruche', columns: [8, 9, 10].flatMap((x) => [2, 3, 4].map((y) => [x, y] as const)), drawing: hive }],
  'lca-3e-ideas': [
    {
      name: 'laurier',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: laurel,
    },
  ],
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
