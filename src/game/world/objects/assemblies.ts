// Les petites constructions du 6e d'Archipéo faites des pièces communes (piste 3 « hybride » du directeur artistique,
// choisie par le mainteneur le 11 octobre 2026) : les commandes simples (le potager de Mousso, le bac à eau de
// Bloquette, le poteau-lanterne de Grimoire, la vitrine de Tick, la placette de Boussole, l'étagère à flacons de Bulle,
// l'établi de Pince, l'urne de Voix) et les objets des quêtes d'entraide (la lanterne de Mousso, le portillon de
// Bloquette, l'escalier de Grimoire). Chacune pose, sur les cases de sa forme (world/fixtures.ts), la pièce qui leur
// va : la caisse, la dalle, le plateau sur pieds, le petit toit, le bassin, la marche, et la barrière et la lanterne sur
// poteau des cours (./pieces.ts). La matière du bloc livré est sur la plus grande face de l'objet, dans les couleurs
// mêmes du bloc (règle GD-7). La même dessinée de près et de loin (une pièce coûte moins de 120 triangles). Code pur,
// sans Three.js.
import { BLOC } from '../../biomes';
import { basin, crate, OBJECT_COLORS as C, slab, flask, postLantern, stoneStep, tableOnLegs, fencePost } from './pieces';
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
  basin(at, pe, 0.85, 3.15, 0.12, 0.88, 0, 0.64, 0.12, pebble, 0.52);
  at.box(0.73, 3.27, 0.42, 0.58, 1.48, 1.64, pe.color(C.lightWood), {});
  at.block(2, 0.5, 0.12, 0.12, 1.02, 1.48, pe.color(C.iron), {});
};

/**
 * Le poteau-lanterne de Grimoire : un socle d'obsidienne livrée (son grand dessus), une marche d'obsidienne sur la case
 * d'à côté, le pilier d'obsidienne, la tête de lanterne des cours (ses vitres allumées la nuit).
 */
const lanternPost: ObjectDrawing = (at, pe) => {
  const obsidian = pe.block(BLOC.obsidienne);
  slab(at, 0.06, 1.94, 0.1, 0.9, 0, 0.3, obsidian);
  at.block(1.5, 0.5, 0.7, 0.62, 0.3, 0.6, obsidian);
  at.block(0.5, 0.5, 0.4, 0.4, 0.3, 2, obsidian, { bottom: true });
  postLantern(at, pe, 0, 0, null, 2);
};

/**
 * La vitrine de Tick : le soubassement de bois (les portes de sa forme) et sa tablette, la vitrine de verre livré (ses
 * trois grandes faces) entre quatre montants, le petit toit dans la couverture de l'île, ses pignons crème.
 */
const displayCase: ObjectDrawing = (at, pe) => {
  const door = pe.material('porte');
  const glass = pe.block(BLOC.verre);
  at.box(0.05, 2.95, 0.1, 0.9, 0, 0.84, door, { bottom: true, top: true });
  at.box(0, 3, 0.05, 0.95, 0.84, 0.95, { dessus: door.dessus, cote: door.dessus }, {});
  at.box(0.12, 2.88, 0.2, 0.8, 0.95, 1.9, glass, { bottom: true, top: true });
  const upright = pe.color(C.wood);
  for (const x of [0.12, 1.04, 1.96, 2.88]) at.block(x, 0.5, 0.1, 0.64, 0.95, 1.9, upright, { bottom: true, top: true });
  at.roof(0, 3, 0.05, 0.95, 1.9, 2.42, 'x', 0.08, pe.roof(), { tint: pe.color(C.cream), zFoot: 1.9 });
};

/**
 * La placette de Boussole : une dalle basse de quatre cases, pavée de seize carreaux de mosaïque livrée en damier de ses
 * deux tons, une rosace crème au milieu ; la lanterne sur poteau des cours sur sa case (ses vitres allumées la nuit).
 */
const plaza: ObjectDrawing = (at, pe) => {
  const mosaic = pe.block(BLOC.mosaique);
  const [x0, x1, y0, y1, h] = [0.04, 1.96, 0.04, 1.96, 0.16];
  at.box(x0, x1, y0, y1, 0, h, mosaic, { bottom: true, top: true });
  const n = 4;
  const [px, py] = [(x1 - x0) / n, (y1 - y0) / n];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const [a, b] = [x0 + i * px, y0 + j * py];
      at.quad([a, b, h], [a + px, b, h], [a + px, b + py, h], [a, b + py, h], [1, 1, 0], (i + j) % 2 ? mosaic.cote : mosaic.dessus);
    }
  at.disc(1, 1, h + 0.012, 0.3, 8, pe.color(C.cream));
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
  at.box(0.02, 2.98, 0.1, 0.9, 0.76, 0.86, pe.color(C.lightWood), {});
  for (const x of [0.5, 2.5]) {
    at.block(x, 0.5, 0.72, 0.62, 0.86, 1.46, magnet);
    flask(at, pe, x, 0.5, 1.46, 0.36, x < 1 ? 0x6fb7c8 : 0xb98ad0);
  }
  postLantern(at, pe, 1, 0, null, 0.86);
};

/**
 * L'établi de Pince : le plateau de carton sur ses deux pieds de barrière et leur entretoise, la barre d'aimant livré
 * posée dessus (sa grande face devant, ses joints de tôle).
 */
const workbench: ObjectDrawing = (at, pe) => {
  const cardboard = pe.block(BLOC.carton);
  const magnet = pe.block(BLOC.aimant);
  const foot = pe.role('yardPost');
  tableOnLegs(at, 0.03, 2.97, 0.1, 0.9, 1, 0.22, cardboard, [
    [0.5, 0.5],
    [2.5, 0.5],
  ], 0.24, foot);
  at.box(0.62, 2.38, 0.44, 0.56, 0.3, 0.42, foot, { bottom: false, px: true, nx: true });
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

/** Les petites constructions du 6e faites de pièces communes, par identifiant (world/fixtures.ts), et leur dessin. */
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
};
