// Les petites constructions d'Archipéo faites des pièces communes (piste 3 « hybride » du directeur artistique,
// choisie par le mainteneur le 11 octobre 2026) : au 6e, les commandes simples (le potager de Mousso, le bac à eau de
// Bloquette, le poteau-lanterne de Grimoire, la vitrine de Tick, la placette de Boussole, l'étagère à flacons de Bulle,
// l'établi de Pince, l'urne de Voix) et les objets des quêtes d'entraide (la lanterne de Mousso, le portillon de
// Bloquette, l'escalier de Grimoire) ; puis au 5e (11 octobre 2026, intention du directeur artistique) l'étagère de
// Bazar, l'abri de Kroa, la glacière de Pudding, la serre de Moustache (la vitrine de Tick), l'écritoire de Vélin, le
// coffre à graines de Sillon, le composteur d'Humus, le filtre de Perle (l'établi de Pince), la table ronde de Mie, la
// balise de Frimas (le poteau-lanterne de Grimoire) et le poteau indicateur de Sema. Chacune pose, sur les cases de sa
// forme (world/fixtures.ts), la pièce qui leur va : la caisse, la dalle, le plateau sur pieds, le petit toit, le bassin, la marche, et la barrière et la lanterne sur
// poteau des cours (./pieces.ts). La matière du bloc livré est sur la plus grande face de l'objet, dans les couleurs
// mêmes du bloc (règle GD-7). La même dessinée de près et de loin (une pièce coûte moins de 120 triangles). Code pur,
// sans Three.js.
import { BLOC, type BlockId } from '../../biomes';
import type { Faces } from '../palette';
import { darker, type Tint, type Workshop } from './workshop';
import { basin, crate, OBJECT_COLORS as C, slab, flask, postLantern, stoneStep, tableOnLegs, fencePost, heap, lectern, pebble, type Paint, signpost } from './pieces';
import type { ObjectDrawing } from './silhouettes';

/**
 * Le potager de Mousso : la jardinière de bois (son rang de bois), la terre livrée bombée dessus (sa grande face : le
 * dessus et les talus), quatre pousses vertes.
 */
const vegetablePatch: ObjectDrawing = (at, pe) => {
  const wood = pe.block(BLOC.bois);
  const earth = pe.block(BLOC.terre);
  const [x0, x1, y0, y1, h] = [0.05, 2.95, 0.1, 0.9, 0.74];
  at.box(x0, x1, y0, y1, 0, h, wood, { bottom: true, top: true });
  // Le rebord, du flanc à la terre.
  const r = 0.08;
  const c: [number, number, number] = [1.5, 0.5, h - 1];
  at.quad([x0, y0, h], [x1, y0, h], [x1 - r, y0 + r, h], [x0 + r, y0 + r, h], c, wood.dessus);
  at.quad([x1, y0, h], [x1, y1, h], [x1 - r, y1 - r, h], [x1 - r, y0 + r, h], c, wood.dessus);
  at.quad([x1, y1, h], [x0, y1, h], [x0 + r, y1 - r, h], [x1 - r, y1 - r, h], c, wood.dessus);
  at.quad([x0, y1, h], [x0, y0, h], [x0 + r, y0 + r, h], [x0 + r, y1 - r, h], c, wood.dessus);
  // Les marques des éléments (le monde ouvert : un par ressource livrée) : la jardinière, la terre, les pousses.
  at.part();
  // La terre, en tronc de pyramide sur la jardinière.
  const [bx, by, tx, ty, zt] = [(x1 - x0) / 2 - r, (y1 - y0) / 2 - r, (x1 - x0) / 2 - 0.22, (y1 - y0) / 2 - 0.2, 1.02];
  const lower = [
    [1.5 - bx, 0.5 - by],
    [1.5 + bx, 0.5 - by],
    [1.5 + bx, 0.5 + by],
    [1.5 - bx, 0.5 + by],
  ];
  const upper = [
    [1.5 - tx, 0.5 - ty],
    [1.5 + tx, 0.5 - ty],
    [1.5 + tx, 0.5 + ty],
    [1.5 - tx, 0.5 + ty],
  ];
  const d: [number, number, number] = [1.5, 0.5, h];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    at.quad([lower[i][0], lower[i][1], h], [lower[j][0], lower[j][1], h], [upper[j][0], upper[j][1], zt], [upper[i][0], upper[i][1], zt], d, earth.cote);
  }
  at.quad([upper[0][0], upper[0][1], zt], [upper[1][0], upper[1][1], zt], [upper[2][0], upper[2][1], zt], [upper[3][0], upper[3][1], zt], d, earth.dessus);
  at.part();
  // Les pousses.
  const leaf = pe.color(C.leaf);
  for (const x of [0.75, 1.25, 1.75, 2.25]) at.pyramid(x, 0.5, 0.1, 0.1, zt, zt + 0.24, leaf);
};

/**
 * Le bac à eau de Bloquette : le bassin de galets livrés (ses grandes faces devant et derrière), plein d'eau, entre les
 * deux poteaux de terre de sa forme coiffés d'une pointe, la traverse de bois et la goulotte de fer au-dessus de l'eau.
 */
const waterTrough: ObjectDrawing = (at, pe) => {
  const earth = pe.block(BLOC.terre);
  const pebble = pe.block(BLOC.galet);
  for (const x of [0.5, 3.5]) {
    at.block(x, 0.5, 0.46, 0.46, 0, 1.74, earth, { bottom: true, top: true });
    at.pyramid(x, 0.5, 0.25, 0.25, 1.74, 1.96, earth.dessus);
  }
  // Les marques des morceaux (le monde ouvert) : les poteaux, le bassin, la traverse et la goulotte.
  at.part();
  basin(at, pe, 0.85, 3.15, 0.12, 0.88, 0, 0.64, 0.12, pebble, 0.52);
  at.part();
  at.box(0.73, 3.27, 0.42, 0.58, 1.48, 1.64, pe.color(C.lightWood), {});
  at.block(2, 0.5, 0.12, 0.12, 1.02, 1.48, pe.color(C.iron), {});
};

/** Un poteau-lanterne : son socle, une marche ou un pied, son pilier, et la tête de lanterne des cours sur sa case. */
interface LanternPostShape {
  /** Le socle, de (x0, y0) à (x1, y1), haut de `h`, dans la matière livrée (son grand dessus). */
  socle: { x0: number; x1: number; y0: number; y1: number; h: number; block: BlockId };
  /** Ce qui est posé sur le socle à côté du pilier (une marche), ou à son pied : centre, côtés, haut, teinte. */
  step: { cx: number; cy: number; lx: number; ly: number; z1: number; tint: (pe: Paint) => Tint };
  /** Le pilier : son centre, son côté, son pied et sa matière, jusqu'à la tête de lanterne (dans la case `head`, en z = 2). */
  pillar: { cx: number; cy: number; side: number; z0: number; block: BlockId };
  head: readonly [number, number];
}

/** Un poteau-lanterne, d'après sa forme (ses vitres allumées la nuit). */
const lanternPostOf =
  (o: LanternPostShape): ObjectDrawing =>
  (at, pe) => {
    const { socle: s, step, pillar: p } = o;
    slab(at, s.x0, s.x1, s.y0, s.y1, 0, s.h, pe.block(s.block));
    // Les marques des éléments (le monde ouvert) : le socle, la marche, le pilier et sa lanterne.
    at.part();
    at.block(step.cx, step.cy, step.lx, step.ly, s.h, step.z1, step.tint(pe));
    at.part();
    at.block(p.cx, p.cy, p.side, p.side, p.z0, 2, pe.block(p.block), { bottom: true });
    postLantern(at, pe, o.head[0], o.head[1], null, 2);
  };

/**
 * Le poteau-lanterne de Grimoire : un socle d'obsidienne livrée (son grand dessus), une marche d'obsidienne sur la case
 * d'à côté, le pilier d'obsidienne, la tête de lanterne des cours (ses vitres allumées la nuit).
 */
const lanternPost = lanternPostOf({
  socle: { x0: 0.06, x1: 1.94, y0: 0.1, y1: 0.9, h: 0.3, block: BLOC.obsidienne },
  step: { cx: 1.5, cy: 0.5, lx: 0.7, ly: 0.62, z1: 0.6, tint: (pe) => pe.block(BLOC.obsidienne) },
  pillar: { cx: 0.5, cy: 0.5, side: 0.4, z0: 0.3, block: BLOC.obsidienne },
  head: [0, 0],
});

/**
 * La balise de Frimas (le poteau-lanterne de Grimoire, intention du directeur artistique du 11 octobre 2026) : le socle
 * carré de panneau livré (son grand dessus), le pied de pierre sombre au coin du fond, le pilier de glace, la tête de
 * lanterne des cours, son toit d'ardoise de l'île (ses vitres allumées la nuit).
 */
const beacon = lanternPostOf({
  socle: { x0: 0.06, x1: 1.94, y0: 0.06, y1: 1.94, h: 0.42, block: BLOC.panneau },
  step: { cx: 1.5, cy: 1.5, lx: 0.52, ly: 0.52, z1: 0.64, tint: (pe) => pe.role('yardStone') },
  pillar: { cx: 1.5, cy: 1.5, side: 0.36, z0: 0.64, block: BLOC.glace },
  head: [1, 1],
});

/**
 * Une vitrine de `n` cases : le soubassement de bois (les portes de sa forme) et sa tablette, la vitrine du verre livré
 * (`glass` : ses grandes faces) entre ses montants, le petit toit dans la couverture de l'île, ses pignons crème.
 */
const displayCaseOf =
  (n: number, glass: BlockId, uprights: readonly number[]): ObjectDrawing =>
  (at, pe) => {
    const door = pe.material('porte');
    const pane = pe.block(glass);
    at.box(0.05, n - 0.05, 0.1, 0.9, 0, 0.84, door, { bottom: true, top: true });
    at.box(0, n, 0.05, 0.95, 0.84, 0.95, { dessus: door.dessus, cote: door.dessus }, {});
    // Les marques des éléments (le monde ouvert) : le soubassement, la vitrine et ses montants, le toit.
    at.part();
    at.box(0.12, n - 0.12, 0.2, 0.8, 0.95, 1.9, pane, { bottom: true, top: true });
    const upright = pe.color(C.wood);
    for (const x of uprights) at.block(x, 0.5, 0.1, 0.64, 0.95, 1.9, upright, { bottom: true, top: true });
    at.part();
    at.roof(0, n, 0.05, 0.95, 1.9, 2.42, 'x', 0.08, pe.roof(), { tint: pe.color(C.cream), zFoot: 1.9 });
  };

/** La vitrine de Tick : trois cases de verre, quatre montants. */
const displayCase = displayCaseOf(3, BLOC.verre, [0.12, 1.04, 1.96, 2.88]);

/** La serre de Moustache : la vitrine de Tick sur deux cases, ses vitres du vitrail livré, trois montants. */
const greenhouse = displayCaseOf(2, BLOC.vitrail, [0.12, 1, 1.88]);

/**
 * La placette de Boussole : une dalle basse de quatre cases, pavée de seize carreaux de mosaïque livrée en damier de ses
 * deux tons, une rosace crème au milieu ; la lanterne sur poteau des cours sur sa case (ses vitres allumées la nuit).
 */
const plaza: ObjectDrawing = (at, pe) => {
  const mosaic = pe.block(BLOC.mosaique);
  const [x0, x1, y0, y1, h] = [0.04, 1.96, 0.04, 1.96, 0.16];
  at.box(x0, x1, y0, y1, 0, h, mosaic, { bottom: true, top: true });
  // Les marques des éléments (le monde ouvert) : la dalle, une moitié des carreaux, l'autre et la rosace, la lanterne.
  at.part();
  const n = 4;
  const [px, py] = [(x1 - x0) / n, (y1 - y0) / n];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === n / 2 && j === 0) at.part();
      const [a, b] = [x0 + i * px, y0 + j * py];
      at.quad([a, b, h], [a + px, b, h], [a + px, b + py, h], [a, b + py, h], [1, 1, 0], (i + j) % 2 ? mosaic.cote : mosaic.dessus);
    }
  at.disc(1, 1, h + 0.012, 0.3, 8, pe.color(C.cream));
  at.part();
  postLantern(at, pe, 2, 2, 0, 1);
};

/**
 * L'étagère à flacons de Bulle : trois caisses de carton livré (leurs grandes faces), la planche posée dessus, deux
 * blocs d'aimant aux bouts, un flacon sur chacun, la tête de lanterne des cours au milieu (ses vitres allumées la nuit).
 */
const shelf: ObjectDrawing = (at, pe) => {
  const cardboard = pe.block(BLOC.carton);
  const magnet = pe.block(BLOC.aimant);
  for (let k = 0; k < 3; k++) crate(at, k + 0.06, k + 0.94, 0.12, 0.88, 0, 0.76, cardboard, { dessus: cardboard.dessus, cote: cardboard.cote });
  // Les marques des éléments (le monde ouvert) : les caisses, la planche, les aimants, les flacons et la lanterne.
  at.part();
  at.box(0.02, 2.98, 0.1, 0.9, 0.76, 0.86, pe.color(C.lightWood), {});
  at.part();
  for (const x of [0.5, 2.5]) {
    at.block(x, 0.5, 0.72, 0.62, 0.86, 1.46, magnet);
    flask(at, pe, x, 0.5, 1.46, 0.36, x < 1 ? 0x6fb7c8 : 0xb98ad0);
  }
  postLantern(at, pe, 1, 0, null, 0.86);
};

/** Un plateau de trois cases sur deux pieds de barrière et leur entretoise (l'établi de Pince, le filtre de Perle, le banc d'Astra). */
export function benchOnPosts(at: Workshop, pe: Paint, top: Tint, zHigh: number, thick: number): void {
  const foot = pe.role('yardPost');
  tableOnLegs(at, 0.03, 2.97, 0.1, 0.9, zHigh, thick, top, [
    [0.5, 0.5],
    [2.5, 0.5],
  ], 0.24, foot);
  at.part();
  at.box(0.62, 2.38, 0.44, 0.56, 0.3, 0.42, foot, { bottom: false, px: true, nx: true });
}

/**
 * L'établi de Pince : le plateau de carton sur ses deux pieds de barrière et leur entretoise, la barre d'aimant livré
 * posée dessus (sa grande face devant, ses joints de tôle).
 */
const workbench: ObjectDrawing = (at, pe) => {
  const cardboard = pe.block(BLOC.carton);
  const magnet = pe.block(BLOC.aimant);
  benchOnPosts(at, pe, cardboard, 1, 0.22);
  // La marque de la barre (le monde ouvert) ; le plateau, ses pieds et l'entretoise ont les leurs (`tableOnLegs`, `benchOnPosts`).
  at.part();
  at.box(0.12, 2.88, 0.22, 0.78, 1, 1.5, magnet);
  const joint = pe.role('joint');
  for (const x of [0.8, 1.5, 2.2]) at.quad([x - 0.02, 0.215, 1.03], [x + 0.02, 0.215, 1.03], [x + 0.02, 0.215, 1.47], [x - 0.02, 0.215, 1.47], [x, 0.5, 1.25], joint);
};

/**
 * L'urne de Voix : le plateau épais de fossile livré (son dessus et sa grande face devant) sur ses deux pieds de
 * barrière, l'urne de craie dessus, son couvercle et sa fente sombre. Aucun symbole.
 */
const ballotBox: ObjectDrawing = (at, pe) => {
  const fossil = pe.block(BLOC.fossile);
  const chalk = pe.block(BLOC.craie);
  tableOnLegs(at, 0.03, 2.97, 0.08, 0.92, 1.05, 0.3, fossil, [
    [0.5, 0.5],
    [2.5, 0.5],
  ], 0.24, pe.role('yardPost'));
  // La marque de l'urne (le monde ouvert) ; le plateau et ses pieds ont la leur (`tableOnLegs`).
  at.part();
  at.block(1.5, 0.5, 0.56, 0.5, 1.05, 1.55, chalk, { bottom: true, top: true });
  at.prism(1.5, 0.5, 0.42, 0.3, 1.55, 1.66, 4, chalk.dessus, Math.PI / 4);
  at.quad([1.36, 0.47, 1.665], [1.64, 0.47, 1.665], [1.64, 0.53, 1.665], [1.36, 0.53, 1.665], [1.5, 0.5, 1], pe.color(C.iron));
};

/**
 * La lanterne de Mousso : un banc de bois (son rang de bois : l'assise et ses deux pieds pleins), la lanterne sur poteau
 * des cours dressée en son milieu (ses vitres allumées la nuit).
 */
const moussoLantern: ObjectDrawing = (at, pe) => {
  const wood = pe.block(BLOC.bois);
  tableOnLegs(at, 0.04, 2.96, 0.14, 0.86, 0.56, 0.14, wood, [
    [0.36, 0.5],
    [2.64, 0.5],
  ], 0.32, { dessus: wood.dessus, cote: wood.cote });
  postLantern(at, pe, 1, 0, 0.56, 2);
};

/**
 * Le portillon de Bloquette : deux piliers de galets livrés et le seuil de galet entre eux (leurs grandes faces), un
 * poteau de barrière des cours sur chaque pilier, le vantail de bois (deux montants, trois traverses, une écharpe).
 */
const wicket: ObjectDrawing = (at, pe) => {
  const pebble = pe.block(BLOC.galet);
  for (const x of [0.5, 2.5]) at.block(x, 0.5, 0.7, 0.7, 0, 1, pebble);
  at.box(0.85, 2.15, 0.18, 0.82, 0, 0.22, pebble);
  fencePost(at, pe, 0, 0, 1);
  fencePost(at, pe, 2, 0, 1);
  const door = pe.material('porte');
  for (const x of [0.96, 2.04]) at.block(x, 0.5, 0.12, 0.12, 0.24, 1.56, door, { bottom: true });
  for (const z of [0.42, 0.95, 1.42]) at.box(1.02, 1.98, 0.45, 0.55, z, z + 0.1, door, { bottom: false, px: true, nx: true });
  at.beam([1.06, 0.5, 0.5], [1.94, 0.5, 1.38], 0.08, door);
};

/**
 * L'escalier de Grimoire : trois marches de pierre (dalle claire dessus), de une à trois cases de haut, portées par les
 * colonnes d'aimant livré (leurs grandes faces de côté).
 */
const stairs: ObjectDrawing = (at, pe) => {
  const magnet = pe.block(BLOC.aimant);
  for (let k = 0; k < 3; k++) {
    const [x0, x1] = [k + 0.03, k + 0.97];
    if (k > 0) at.box(x0, x1, 0.06, 0.94, 0, k, magnet, { bottom: true, top: true });
    stoneStep(at, pe, x0, x1, 0.06, 0.94, k, k + 0.86);
  }
};

// ---------- Le 5e (piste 3 « hybride », 11 octobre 2026) ----------

/**
 * L'étagère de Bazar : la marche de panneau livré devant (son grand dessus et sa face), l'étagère de bois au fond, ses
 * deux joues, sa tablette et son dessus, trois rouleaux de toile couchés (deux en bas, un sur la tablette).
 */
const clothShelf: ObjectDrawing = (at, pe) => {
  const sign = pe.block(BLOC.panneau);
  const cloth = pe.block(BLOC.toile);
  const wood = pe.role('yardPost');
  crate(at, 0.04, 2.96, 0.08, 0.94, 0, 0.62, sign, { dessus: sign.dessus, cote: darker(sign).cote });
  for (const x of [0.13, 2.87]) at.block(x, 1.5, 0.18, 0.86, 0, 1.9, wood);
  at.box(0.22, 2.78, 1.1, 1.9, 0.9, 1.06, wood, {});
  at.box(0.04, 2.96, 1.06, 1.94, 1.9, 2.06, wood, {});
  for (const y of [1.3, 1.7]) at.roller('x', 0.22, 2.78, y, 0.24, 0.2, 6, cloth);
  at.roller('x', 0.22, 2.78, 1.5, 1.32, 0.24, 6, cloth);
};

/**
 * L'abri de Kroa : deux poteaux au fond, leur pied de barrière sur une dalle, leur haut de tourbe ; le toit de toile
 * livrée à deux pans (ses grands pans), son faîte de tourbe.
 */
const shelter: ObjectDrawing = (at, pe) => {
  const cloth = pe.block(BLOC.toile);
  const peat = pe.block(BLOC.tourbe);
  for (const x of [0.5, 2.5]) {
    at.block(x, 1.5, 0.4, 0.4, 0, 0.16, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
    at.block(x, 1.5, 0.24, 0.24, 0.16, 1, pe.role('yardPost'), { bottom: true, top: true });
    at.block(x, 1.5, 0.34, 0.34, 1, 2.1, peat, { bottom: true, top: true });
  }
  at.roof(0, 3, 0.02, 1.98, 1.9, 2.5, 'x', 0.1, cloth);
  at.box(0, 3, 0.86, 1.14, 2.44, 2.6, peat, {});
};

/**
 * La glacière de Pudding : le coffre de glace livrée (ses grandes faces), deux cerclages de fer, le couvercle de tuile
 * posé dessus en nappe épaisse, sa poignée de fer.
 */
const icebox: ObjectDrawing = (at, pe) => {
  const ice = pe.block(BLOC.glace);
  const iron = pe.color(C.iron);
  at.box(0.06, 2.94, 0.1, 0.9, 0, 0.86, ice, { bottom: true, top: true });
  for (const x of [0.7, 2.3]) at.box(x - 0.08, x + 0.08, 0.085, 0.915, 0.06, 0.86, iron, { bottom: true, top: true });
  at.box(0.02, 2.98, 0.06, 0.94, 0.86, 1.02, pe.block(BLOC.tuile), {});
  at.box(1.3, 1.7, 0.42, 0.58, 1.02, 1.17, iron, {});
};

/**
 * L'écritoire de Vélin : le pied de tourbe livrée (sa grande face devant) et sa tablette, le pupitre d'enluminure en
 * pente et son livre, la tête de lanterne des cours sur le bout (ses vitres allumées la nuit).
 */
const writingDesk: ObjectDrawing = (at, pe) => {
  const peat = pe.block(BLOC.tourbe);
  at.box(0.05, 2.95, 0.12, 0.88, 0, 0.9, peat, { bottom: true, top: true });
  at.box(0.02, 2.98, 0.08, 0.92, 0.9, 1, { dessus: peat.dessus, cote: darker(peat).cote }, {});
  lectern(at, pe, 1.1, 1.9, 0.2, 0.8, 1, pe.block(BLOC.enluminure));
  postLantern(at, pe, 2, 0, null, 1);
};

/**
 * Le coffre à graines de Sillon : le coffre d'enluminure livrée (ses grandes faces), son couvercle débordant, deux
 * pentures de fer devant, la tête de lanterne des cours posée sur le coin du fond (ses vitres allumées la nuit).
 */
const seedChest: ObjectDrawing = (at, pe) => {
  const vellum = pe.block(BLOC.enluminure);
  crate(at, 0.06, 1.94, 0.06, 1.94, 0, 0.82, vellum, { dessus: vellum.dessus, cote: darker(vellum, 0.8).cote });
  const iron = pe.color(C.iron);
  for (const x of [0.5, 1.5]) at.quad([x - 0.08, 0.054, 0.05], [x + 0.08, 0.054, 0.05], [x + 0.08, 0.054, 0.68], [x - 0.08, 0.054, 0.68], [x, 1, 0.4], iron);
  postLantern(at, pe, 1, 1, null, 0.82);
};

/**
 * Le composteur d'Humus : trois parois de bambou livré (leurs grandes faces), en U ouvert vers l'avant, le tas de
 * terre dedans, le poteau de barrière des cours derrière.
 */
const compostBin: ObjectDrawing = (at, pe) => {
  const bamboo = pe.block(BLOC.bambou);
  const h = 0.92;
  at.box(0.3, 0.56, 0.1, 1.7, 0, h, bamboo);
  at.box(2.44, 2.7, 0.1, 1.7, 0, h, bamboo);
  at.box(0.56, 2.44, 1.44, 1.7, 0, h, bamboo, { bottom: true, px: true, nx: true });
  heap(at, 1.5, 0.8, 0, 0.62, 0.6, pe.material('terre'), 6);
  fencePost(at, pe, 1, 2, 0);
};

/**
 * Le filtre de Perle (l'établi de Pince) : le plateau épais de strates livrées (ses grandes faces) sur ses deux pieds de
 * barrière, sa strate du milieu plus sombre, l'eau qui filtre en nappe dessus.
 */
const filterBench: ObjectDrawing = (at, pe) => {
  const strata = pe.block(BLOC.strate);
  benchOnPosts(at, pe, strata, 1.8, 0.8);
  at.box(0.025, 2.975, 0.095, 0.905, 1.26, 1.52, darker(strata, 0.78), { bottom: true, top: true });
  at.box(0.3, 2.7, 0.25, 0.75, 1.8, 1.83, pe.color(C.water), { bottom: true });
};

/**
 * La table ronde de Mie : le pied de pierre, le fût de bois, le plateau à huit pans de rizière livrée (son grand dessus),
 * deux sacs de farine posés dessus. Aucun symbole.
 */
const roundTable: ObjectDrawing = (at, pe) => {
  at.prism(1.5, 1.5, 0.42, 0.36, 0, 0.16, 8, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.prism(1.5, 1.5, 0.17, 0.17, 0.16, 0.86, 8, pe.role('yardPost'), Math.PI / 8, true);
  at.prism(1.5, 1.5, 1.42, 1.42, 0.86, 1.06, 8, pe.block(BLOC.riziere), Math.PI / 8);
  const flour: Faces = pe.block(BLOC.farine);
  for (const y of [0.62, 2.38]) pebble(at, 1.5, y, 1.06, 0.26, 0.4, flour, 6);
};

/**
 * Le poteau indicateur de Sema : le poteau de lambris livré (ses quatre grandes faces), sa tête en pointe, et deux
 * planches-flèches épaisses de panneau, opposées, à deux hauteurs, leurs pointes en chevron ; rien d'écrit.
 */
const signpostSema: ObjectDrawing = (at, pe) =>
  signpost(
    at,
    pe,
    1.5,
    0.5,
    2.86,
    pe.block(BLOC.lambris),
    [
      { axis: 'x', toward: -1, z: 2.5, length: 1.4 },
      { axis: 'x', toward: 1, z: 2.08, length: 1.4 },
    ],
    pe.block(BLOC.panneau),
  );

/** Les petites constructions faites de pièces communes, par identifiant (world/fixtures.ts), et leur dessin (au 6e et au 5e). */
export const ASSEMBLIES: Readonly<Record<string, ObjectDrawing>> = {
  'french-6e-phonology-fixture-1': vegetablePatch,
  'french-6e-grammar-spelling-fixture-1': waterTrough,
  'french-6e-reading-fixture-1': lanternPost,
  'english-6e-grammar-fixture-1': displayCase,
  'geography-6e-living-fixture-1': plaza,
  'physics-chemistry-6e-matter-energy-fixture-1': shelf,
  'technology-6e-objects-fixture-1': workbench,
  'civics-6e-democratic-society-fixture-1': ballotBox,
  'french-6e-phonology-fixture-2': moussoLantern,
  'french-6e-grammar-spelling-fixture-2': wicket,
  'french-6e-reading-fixture-2': stairs,
  // Le 5e.
  'maths-5e-proportionality-fixture-1': clothShelf,
  'french-5e-conjugation-fixture-1': shelter,
  'english-5e-vocabulary-fixture-1': icebox,
  'english-5e-grammar-fixture-1': greenhouse,
  'history-5e-middle-ages-fixture-1': writingDesk,
  'geography-5e-resources-fixture-1': seedChest,
  'life-earth-sciences-5e-active-planet-fixture-1': compostBin,
  'physics-chemistry-5e-matter-universe-fixture-1': filterBench,
  'civics-5e-equality-solidarity-fixture-1': roundTable,
  'maths-5e-signed-numbers-fixture-2': beacon,
  'french-5e-homophones-fixture-1': signpostSema,
};
