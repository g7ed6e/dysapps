// Le terrain du village : une île par biome (cœur 12 × 12 avec relief léger, décor et créature, posé sur une terre
// plus large au relief varié, à son altitude), reliées par des ponts et des rampes de bois.
// Générateur pur (sans Three.js) : testable, et partagé entre la 3D et la vue simple.
import { BIOMES, BLOCKS, type BiomeDef, type BiomeId } from '../biomes';
import { BRIDGES, bridgeState, isBiomeUnlocked, reachableIslands, type BridgeDef } from './archipelago';
import { CORE, MAP, inCore, isLand, islandDef, landBox, landCells, landscape, noise, type Decor, type Ground, type IslandDef, type LandCell } from './map';
import { CREATURE_CUBES } from '../Creatures';
import { GUARDIAN_CUBES } from '../Guardians';
import { isBossBeaten, isBossUnlocked } from '../boss';
import type { VoxelCube } from '../Voxel';
import type { Village } from '../engine';
import { PLAN_ZONE, isPlanDone, planCells, plansFor } from './plans';

/** Côté du cœur d'une île (en blocs). */
export const ISLAND = CORE;
/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;
/** Couches de roche qui s'amincissent sous une île en altitude (elle flotte). */
export const TAPER = 3;

const TRUNK = '#6b4a2e';
const LEAF = '#4e8f36';
const GRASS = '#6cb33f';
const DARK = '#3b2d20';
const HAY = '#e8c66f';
const SNOW = '#f4f8fb';
const MOSS = '#4f8a3a';
const BASALT = '#4a4448';
const LAVA = '#ff7a1a';
const WATER = '#4a9be0';
const PINE = '#2f6b4a';
const REED = '#8fae4f';
const CRYSTAL = '#5cd0c8';
const FLOWERS = ['#e8557a', '#f2c14e', '#f7f2e8', '#b56cd8'];
const MUSHROOM = '#d9453f';

/** Couleur délavée d'une île verrouillée (même calcul que la texture délavée en 3D). */
export function fade(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c: number) => Math.round((c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45);
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`;
}

/** Textures 3D par couleur de décor (les couleurs servent aussi à la vue simple et aux îles verrouillées). */
const TEXTURES: Record<string, string> = {
  [TRUNK]: 'tronc',
  [LEAF]: 'feuilles',
  [GRASS]: 'herbe',
  [BLOCKS.terre.side]: 'terre',
  [BLOCKS.pierre.side]: 'pierre',
  [BLOCKS.sable.side]: 'sable',
  [BLOCKS.verre.side]: 'verre',
  [BLOCKS.or.side]: 'or',
  [BLOCKS.bois.side]: 'planches',
  [BLOCKS.brique.side]: 'brique',
  [BLOCKS.galet.side]: 'galet',
  [BLOCKS.obsidienne.side]: 'obsidienne',
  [BLOCKS.glace.side]: 'glace',
  [BLOCKS.toile.side]: 'toile',
  [BLOCKS.panneau.side]: 'panneau',
  [BLOCKS.tourbe.side]: 'tourbe',
  [BLOCKS.acier.side]: 'acier',
  [BLOCKS.calque.side]: 'calque',
  [BLOCKS.ardoise.side]: 'ardoise',
  [BLOCKS.parchemin.side]: 'parchemin',
  [BLOCKS.marbre.side]: 'marbre',
  [BLOCKS.quartz.side]: 'quartz',
  [BLOCKS.prisme.side]: 'prisme',
  [BLOCKS.lentille.side]: 'lentille',
  [BLOCKS.lanterne.side]: 'lanterne',
  [BLOCKS.barriere.side]: 'barriere',
  [BLOCKS.escalier.side]: 'escalier',
  [SNOW]: 'nuage',
  [HAY]: 'or',
  [MOSS]: 'mousse',
  [BASALT]: 'basalte',
  [LAVA]: 'lave',
  [WATER]: 'eau',
  [PINE]: 'sapin',
  [CRYSTAL]: 'cristal',
};

/** Couleur du dessus d'une case de paysage selon son sol. */
const GROUND_COLOR: Record<Ground, string> = {
  herbe: GRASS,
  sable: BLOCKS.sable.side,
  roche: BLOCKS.pierre.side,
  neige: SNOW,
  eau: WATER,
  lave: LAVA,
  glace: BLOCKS.glace.side,
  basalte: BASALT,
  mousse: MOSS,
};

/** Un élément de décor posé sur une case, au-dessus de son sol (z = 1 juste au-dessus). `r` : grain 0..1 pour varier. */
function decorate(put: Put, kind: Decor, x: number, y: number, r: number): void {
  switch (kind) {
    case 'arbre':
      tree(put, x, y, 0, r > 0.5 ? 3 : 2);
      break;
    case 'sapin': {
      const tall = r > 0.5 ? 2 : 1;
      for (let z = 1; z <= tall; z++) put(x, y, z, TRUNK);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(x + dx, y + dy, tall + 1, PINE);
      put(x + 1, y, tall + 2, PINE);
      put(x - 1, y, tall + 2, PINE);
      put(x, y + 1, tall + 2, PINE);
      put(x, y - 1, tall + 2, PINE);
      put(x, y, tall + 2, PINE);
      put(x, y, tall + 3, PINE);
      break;
    }
    case 'buisson':
      put(x, y, 1, LEAF);
      if (r > 0.7) put(x + 1, y, 1, LEAF);
      break;
    case 'fleur':
      put(x, y, 1, FLOWERS[Math.floor(r * FLOWERS.length) % FLOWERS.length]);
      break;
    case 'rocher':
      put(x, y, 1, BLOCKS.pierre.side);
      if (r > 0.8) put(x, y, 2, BLOCKS.pierre.side);
      break;
    case 'roseau':
      put(x, y, 1, REED);
      put(x, y, 2, REED);
      break;
    case 'cristal':
      put(x, y, 1, CRYSTAL);
      if (r > 0.6) put(x, y, 2, CRYSTAL);
      break;
    case 'souche':
      put(x, y, 1, TRUNK);
      break;
    case 'champignon':
      put(x, y, 1, MUSHROOM);
      break;
  }
}

/** Coin (x, y) du cœur de l'île d'un biome et altitude de son sol. */
export function islandOrigin(index: number): { ox: number; oy: number; oz: number } {
  const def = islandDef(BIOMES[index].id);
  return { ox: def.core.x, oy: def.core.y, oz: def.altitude };
}

/** Centre du cœur d'une île (coordonnées de grille) et altitude, pour y amener la caméra. */
export function islandCenter(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  return { x: def.core.x + CORE / 2, y: def.core.y + CORE / 2, z: def.altitude };
}

/** Étendue du monde (coordonnées de grille), terres et îlots compris. */
export function worldBounds(): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const def of MAP) {
    const b = landBox(def);
    // Deux cases de marge : la couronne d'un grand arbre, l'écume d'une cascade débordent de la terre.
    minX = Math.min(minX, b.x0 - 2);
    maxX = Math.max(maxX, b.x1 + 2);
    minY = Math.min(minY, b.y0 - ISLET_H - 2);
    maxY = Math.max(maxY, b.y1 + 2);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * L'étendue à cadrer dans la vue d'ensemble : les îles ouvertes et celles qu'un ouvrage proposé peut atteindre,
 * avec une marge. Au début, deux îles et leurs voisines ; le cadre s'élargit à mesure que le monde s'ouvre.
 */
export function overviewBounds(bridges: string[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const open = reachableIslands(bridges);
  const shown = new Set<BiomeId>(open);
  for (const b of BRIDGES) {
    if (bridgeState(b, bridges) === 'far') continue;
    shown.add(b.from);
    shown.add(b.to);
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const id of shown) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0 - ISLET_H - 2);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX: minX - 4, maxX: maxX + 4, minY: minY - 4, maxY: maxY + 4 };
}

/** Île la plus proche d'un point de la grille (pour le toucher : une île ou le pont qui y mène). */
export function islandAt(x: number, y: number): BiomeId {
  let best: BiomeId = BIOMES[0].id;
  let bestD = Infinity;
  for (const b of BIOMES) {
    const c = islandCenter(b.id);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * Relief léger : un plateau d'un bloc de haut sur la moitié arrière de l'île (loin de la créature),
 * aux coins arrondis, différent selon l'île. Hauteur du sol (0 ou 1) pour une case de l'île.
 */
export function groundHeight(index: number, x: number, y: number): number {
  const fromBack = ISLAND - 1 - x;
  const shape = index % 3;
  // Le plateau est à l'arrière-droite, devant la zone des plans (qui reste plate).
  const inner = x >= 7 && y >= 2 && y <= 5;
  if (!inner) return 0;
  if (shape === 0) return fromBack + Math.abs(y - ISLAND / 2 + 0.5) < 7.5 ? 1 : 0;
  if (shape === 1) return y <= ISLAND / 2 + 1 || fromBack < 2 ? 1 : 0;
  return fromBack < 3 || (y >= 4 && y <= ISLAND - 5) ? 1 : 0;
}

type Put = (x: number, y: number, z: number, color: string) => void;

function tree(put: Put, x: number, y: number, base: number, tall = 2): void {
  for (let z = 1; z <= tall; z++) put(x, y, base + z, TRUNK);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(x + dx, y + dy, base + tall + 1, LEAF);
  put(x, y, base + tall + 2, LEAF);
}

/** Décor propre à chaque biome, en coordonnées relatives à l'île. `h` donne la hauteur du sol d'une case. */
const DECOR: Record<BiomeId, (put: Put, h: (x: number, y: number) => number) => void> = {
  foret: (put, h) => {
    for (const [tx, ty, tall] of [
      [8, 2, 2],
      [10, 4, 3],
      [3, 9, 2],
      [1, 10, 3],
    ] as const)
      tree(put, tx, ty, h(tx, ty), tall);
  },
  mine: (put, h) => {
    // Un amas de roche et l'entrée sombre d'une galerie.
    for (const [x, y, z] of [
      [8, 3, 1],
      [9, 3, 1],
      [9, 4, 1],
      [8, 3, 2],
    ] as const)
      put(x, y, h(x, y) + z, BLOCKS.pierre.side);
    for (const [x, y] of [
      [2, 10],
      [3, 10],
    ] as const) {
      put(x, y, h(x, y) + 1, DARK);
      put(x, y, h(x, y) + 2, DARK);
    }
    put(1, 9, h(1, 9) + 1, BLOCKS.pierre.side);
    put(4, 11, h(4, 11) + 1, BLOCKS.pierre.side);
  },
  carriere: (put, h) => {
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS.sable.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.sable.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.sable.side);
  },
  ferme: (put, h) => {
    // Un champ de blé et deux poteaux de barrière.
    for (let dy = 2; dy <= 5; dy++) {
      put(8, dy, h(8, dy) + 1, HAY);
      if (dy % 2) put(9, dy, h(9, dy) + 1, HAY);
    }
    put(6, 1, h(6, 1) + 1, TRUNK);
    put(3, 10, h(3, 10) + 1, TRUNK);
    tree(put, 4, 10, h(4, 10), 2);
  },
  tour: (put, h) => {
    // Une tour de verre avec un sommet en or.
    for (let z = 1; z <= 5; z++)
      for (const [dx, dy] of [
        [8, 4],
        [9, 4],
        [8, 5],
        [9, 5],
      ] as const)
        put(dx, dy, h(dx, dy) + z, BLOCKS.verre.side);
    put(8, 4, h(8, 4) + 6, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.pierre.side);
  },
  plaine: (put, h) => {
    // Un boulier de briques : deux rangées de cinq, séparées (on compte par cinq), et une borne de brique.
    for (let i = 0; i < 5; i++) {
      put(7 + i, 2, h(7 + i, 2) + 1, i < 3 ? BLOCKS.brique.side : BLOCKS.sable.side);
      put(7 + i, 4, h(7 + i, 4) + 1, i < 2 ? BLOCKS.brique.side : BLOCKS.sable.side);
    }
    put(3, 9, h(3, 9) + 1, BLOCKS.brique.side);
    put(3, 9, h(3, 9) + 2, BLOCKS.brique.side);
    tree(put, 1, 10, h(1, 10), 2);
  },
  riviere: (put, h) => {
    // Une mare de verre bordée de galets, un nénuphar, et des roseaux.
    for (const [x, y] of [
      [8, 3],
      [9, 3],
      [8, 4],
      [9, 4],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.verre.side);
    put(9, 4, h(9, 4) + 2, LEAF);
    for (const [x, y] of [
      [7, 2],
      [10, 5],
      [7, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.galet.side);
    put(3, 9, h(3, 9) + 1, TRUNK);
    put(3, 9, h(3, 9) + 2, TRUNK);
    put(3, 9, h(3, 9) + 3, LEAF);
    put(1, 10, h(1, 10) + 1, BLOCKS.galet.side);
  },
  volcan: (put, h) => {
    // Un petit cône de pierre au sommet incandescent, des blocs d'obsidienne épars.
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS.pierre.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.pierre.side);
    put(9, 4, h(9, 4) + 3, HAY);
    put(3, 9, h(3, 9) + 1, BLOCKS.obsidienne.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.obsidienne.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.obsidienne.side);
  },
  glacier: (put, h) => {
    // Des congères de neige et une stalagmite de glace ; un thermomètre de blocs (froid en bas, chaud en haut).
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, SNOW);
    for (let z = 1; z <= 4; z++) put(10, 3, h(10, 3) + z, z <= 2 ? BLOCKS.glace.side : z === 3 ? BLOCKS.verre.side : HAY);
    put(3, 9, h(3, 9) + 1, SNOW);
    put(1, 10, h(1, 10) + 1, BLOCKS.glace.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.glace.side);
  },
  marche: (put, h) => {
    // Un étal à auvent de toile sur des poteaux, des caisses.
    for (const [x, y] of [
      [7, 2],
      [10, 2],
      [7, 5],
      [10, 5],
    ] as const) {
      put(x, y, h(x, y) + 1, TRUNK);
      put(x, y, h(x, y) + 2, TRUNK);
    }
    for (let dx = 7; dx <= 10; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 3, BLOCKS.toile.side);
    put(8, 3, h(8, 3) + 1, BLOCKS.bois.side);
    put(9, 4, h(9, 4) + 1, BLOCKS.bois.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.bois.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.toile.side);
  },
  carrefour: (put, h) => {
    // Un poteau indicateur à trois panneaux, et une borne.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, TRUNK);
    put(8, 3, h(8, 3) + 3, BLOCKS.panneau.side);
    put(10, 3, h(10, 3) + 4, BLOCKS.panneau.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.panneau.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.pierre.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.panneau.side);
    tree(put, 7, 5, h(7, 5), 2);
  },
  marais: (put, h) => {
    // Des flaques de verre, des roseaux, une souche.
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 4],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.verre.side);
    for (const [x, y] of [
      [7, 4],
      [9, 5],
      [3, 9],
    ] as const) {
      put(x, y, h(x, y) + 1, TRUNK);
      put(x, y, h(x, y) + 2, TRUNK);
      put(x, y, h(x, y) + 3, HAY);
    }
    put(1, 10, h(1, 10) + 1, TRUNK);
  },
  forge: (put, h) => {
    // Une cheminée de pierre au sommet incandescent, une enclume d'acier, des lingots.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, z === 4 ? HAY : BLOCKS.pierre.side);
    put(8, 5, h(8, 5) + 1, BLOCKS.acier.side);
    put(10, 5, h(10, 5) + 1, BLOCKS.acier.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.or.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.acier.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.acier.side);
  },
  atelier: (put, h) => {
    // Une table à dessin (planches sur pieds) avec un calque, une pile de calques.
    put(8, 3, h(8, 3) + 1, TRUNK);
    put(10, 3, h(10, 3) + 1, TRUNK);
    for (let dx = 8; dx <= 10; dx++) put(dx, 3, h(dx, 3) + 2, BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 3, BLOCKS.calque.side);
    put(9, 5, h(9, 5) + 1, BLOCKS.calque.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.calque.side);
    put(3, 9, h(3, 9) + 2, BLOCKS.calque.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  falaise: (put, h) => {
    // Une paroi d'ardoise en escalier, une corde (barrière) qui pend, un rocher.
    for (let z = 1; z <= 4; z++) for (let dx = 0; dx < 5 - z; dx++) put(7 + dx, 2, h(7 + dx, 2) + z, BLOCKS.ardoise.side);
    put(9, 3, h(9, 3) + 1, BLOCKS.pierre.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.ardoise.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.pierre.side);
  },
  cabinet: (put, h) => {
    // Des étagères de bois chargées de parchemins, un pupitre.
    for (const x of [8, 10]) for (let z = 1; z <= 3; z++) put(x, 3, h(x, 3) + z, z === 2 ? BLOCKS.parchemin.side : BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 3, BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 1, BLOCKS.parchemin.side);
    put(8, 5, h(8, 5) + 1, BLOCKS.bois.side);
    put(8, 5, h(8, 5) + 2, BLOCKS.parchemin.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.parchemin.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.bois.side);
  },
  belvedere: (put, h) => {
    // Un kiosque : quatre colonnes de marbre et un toit de marbre, un triangle 3-4-5 au sol.
    for (const [x, y] of [
      [7, 2],
      [10, 2],
      [7, 5],
      [10, 5],
    ] as const)
      for (let z = 1; z <= 3; z++) put(x, y, h(x, y) + z, BLOCKS.marbre.side);
    for (let dx = 7; dx <= 10; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 4, BLOCKS.marbre.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.marbre.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  donnees: (put, h) => {
    // Un télescope (tronc incliné en escalier) et un dôme de quartz.
    for (let i = 0; i < 4; i++) put(7 + i, 3, h(7 + i, 3) + 1 + i, i === 3 ? BLOCKS.verre.side : TRUNK);
    put(9, 5, h(9, 5) + 1, BLOCKS.quartz.side);
    put(9, 5, h(9, 5) + 2, BLOCKS.quartz.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.quartz.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  phare: (put, h) => {
    // Un phare : tour de pierre, lanterne de prisme au sommet.
    for (let z = 1; z <= 5; z++) put(9, 3, h(9, 3) + z, z === 5 ? BLOCKS.prisme.side : BLOCKS.pierre.side);
    put(9, 3, h(9, 3) + 6, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.prisme.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  textes: (put, h) => {
    // Une lunette d'observation sur son pied, une pile de livres (planches et parchemin), une lentille au sol.
    put(9, 3, h(9, 3) + 1, BLOCKS.pierre.side);
    put(9, 3, h(9, 3) + 2, BLOCKS.pierre.side);
    for (let i = 0; i < 3; i++) put(8 + i, 4, h(8 + i, 4) + 3, i === 2 ? BLOCKS.lentille.side : TRUNK);
    put(7, 2, h(7, 2) + 1, BLOCKS.bois.side);
    put(7, 2, h(7, 2) + 2, BLOCKS.parchemin.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.lentille.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
};

const STEP = '#8f8f8f';

/**
 * Le tracé d'un ouvrage entre deux îles : de bord de terre à bord de terre, sur la ligne qui joint les deux cœurs.
 * Deux îles l'une devant l'autre : l'ouvrage part du côté droit du cœur (l'îlot du Gardien est devant, à gauche),
 * descend jusqu'au bord de l'île de devant, fait un coude, puis y entre. Chaque case a son altitude (interpolée).
 */
function bridgePath(def: BridgeDef): { x: number; y: number; z: number; climbing: boolean; dx: number; dy: number }[] {
  const a = islandDef(def.from);
  const b = islandDef(def.to);
  const vertical = Math.abs(b.core.y - a.core.y) >= Math.abs(b.core.x - a.core.x);
  const anchor = (d: IslandDef) => ({ x: d.core.x + (vertical ? CORE - 1 : CORE / 2), y: d.core.y + CORE / 2 });
  const ca = anchor(a);
  const cb = anchor(b);
  const points = [ca];
  if (vertical && ca.x !== cb.x) {
    const front = a.core.y < b.core.y ? a : b;
    const jog = front.core.y + CORE + front.ext.back + 1;
    points.push({ x: ca.x, y: jog }, { x: cb.x, y: jog });
  }
  points.push(cb);
  const cells: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (let s = 0; s + 1 < points.length; s++) {
    const p = points[s];
    const q = points[s + 1];
    const steps = Math.max(1, Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(p.x + ((q.x - p.x) * i) / steps);
      const y = Math.floor(p.y + ((q.y - p.y) * i) / steps);
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x, y });
    }
  }
  // On ne garde que la partie hors des deux terres.
  let first = cells.findIndex((c) => !isLand(a, c.x, c.y));
  let last = cells.length - 1;
  while (last > 0 && isLand(b, cells[last].x, cells[last].y)) last--;
  if (first < 0 || first > last) {
    first = 0;
    last = cells.length - 1;
  }
  const span = cells.slice(first, last + 1);
  let prevZ = a.altitude;
  return span.map((c, i) => {
    const z = Math.round(a.altitude + ((b.altitude - a.altitude) * (i + 1)) / (span.length + 1));
    const climbing = z !== prevZ;
    prevZ = z;
    const next = span[Math.min(i + 1, span.length - 1)];
    const prev = span[Math.max(i - 1, 0)];
    return { x: c.x, y: c.y, z, climbing, dx: Math.sign(next.x - prev.x), dy: Math.sign(next.y - prev.y) };
  });
}

/**
 * Un ouvrage entre deux îles, selon sa nature : pont de planches (marches quand il monte), bac (poteaux et radeau
 * au fil de l'eau), escalier taillé dans la pierre, tunnel (galerie voûtée, lanternes), col (escalier à garde-fou).
 * Fantôme tant qu'il n'est pas construit.
 */
function bridge(def: BridgeDef, cubes: VoxelCube[], ghost: boolean): void {
  const path = bridgePath(def);
  const add = (x: number, y: number, z: number, color: string, texture: string, top?: string) =>
    cubes.push({ x, y, z, color, top, texture, tag: def.to, bridge: def.id, ghost: ghost || undefined });
  const n = path.length;
  path.forEach((c, i) => {
    // Perpendiculaire au tracé (pour les arches et le garde-fou).
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    switch (def.kind) {
      case 'pont':
        add(c.x, c.y, c.z, BLOCKS.bois.side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS.escalier.top : undefined);
        break;
      case 'bac': {
        // Un radeau de trois planches au milieu, des poteaux de bois qui tiennent la corde de halage.
        const mid = Math.abs(i - (n - 1) / 2) <= 1;
        if (mid) {
          add(c.x, c.y, c.z, BLOCKS.bois.side, 'planches');
          if (i === Math.floor((n - 1) / 2)) add(c.x + px, c.y + py, c.z, BLOCKS.bois.side, 'planches');
        } else if (i % 3 === 0 || i === n - 1) add(c.x, c.y, c.z, TRUNK, 'tronc');
        break;
      }
      case 'escalier':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        break;
      case 'col':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        if (i % 2 === 0) add(c.x + px, c.y + py, c.z + 1, BLOCKS.barriere.side, 'barriere');
        break;
      case 'tunnel': {
        add(c.x, c.y, c.z, BLOCKS.bois.side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS.escalier.top : undefined);
        // Une arche de pierre toutes les trois cases, une lanterne au sommet d'une arche sur deux.
        if (i % 3 === 1 && i < n - 1) {
          for (const side of [-1, 1]) {
            add(c.x + side * px, c.y + side * py, c.z + 1, BLOCKS.pierre.side, 'pierre');
            add(c.x + side * px, c.y + side * py, c.z + 2, BLOCKS.pierre.side, 'pierre');
          }
          const lit = ((i - 1) / 3) % 2 === 0;
          add(c.x, c.y, c.z + 3, lit ? BLOCKS.lanterne.side : BLOCKS.pierre.side, lit ? 'lanterne' : 'pierre');
        }
        break;
      }
    }
  });
  // Une lanterne à chaque bout : la nuit, les chemins se devinent de loin.
  for (const c of [path[0], path[n - 1]]) if (c) add(c.x, c.y, c.z + 1, BLOCKS.lanterne.side, 'lanterne');
}

/** Coordonnées du monde → case relative à une île (z relatif : 0 = premier bloc sur le sol de la zone libre). */
export function toIslandCell(id: BiomeId, x: number, y: number, z: number): { x: number; y: number; z: number } {
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: x - ox, y: y - oy, z: z - oz - 1 };
}

/** Tous les cubes du village, étiquetés par biome. Les îles verrouillées sont en pierre grise, sans créature. */
/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(bridges: string[]): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] {
  return BIOMES.filter((b) => isBiomeUnlocked(b.id, bridges)).map((b) => {
    const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
    return { id: b.id, cubes: CREATURE_CUBES[b.id], origin: { x: ox + 2, y: oy + 4, z: oz + 1 } };
  });
}

/** L'îlot du Gardien : devant l'île (côté caméra), ISLET_W × ISLET_H cases. */
export const ISLET_W = 8;
export const ISLET_H = 4;
export function bossIsletOrigin(index: number): { x: number; y: number; z: number } {
  const def = islandDef(BIOMES[index].id);
  return { x: def.core.x + 2, y: def.core.y - def.ext.front - ISLET_H - 2, z: def.altitude };
}

export type GuardianStatus = 'hidden' | 'ready' | 'beaten';

/** Le Gardien n'apparaît que lorsqu'il accepte le défi ; vaincu, il devient une statue. */
export function guardianStatus(biome: BiomeDef, progress: Record<string, { stars: number }>, bridges: string[]): GuardianStatus {
  if (!isBiomeUnlocked(biome.id, bridges) || !isBossUnlocked(biome, progress)) return 'hidden';
  return isBossBeaten(biome.id, progress) ? 'beaten' : 'ready';
}

/** Gris de pierre de même luminosité qu'une couleur (pour la statue). */
function stoneOf(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  const g = Math.round(90 + (lum / 255) * 90);
  return `#${((g << 16) | (g << 8) | g).toString(16).padStart(6, '0')}`;
}

/** Les Gardiens visibles : en couleurs s'ils attendent le défi, en statue de pierre s'ils sont vaincus. */
export function guardianPlacements(
  progress: Record<string, { stars: number }>,
  bridges: string[],
): { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] {
  const out: { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] = [];
  BIOMES.forEach((b, index) => {
    const status = guardianStatus(b, progress, bridges);
    if (status === 'hidden') return;
    const { x, y, z } = bossIsletOrigin(index);
    const beaten = status === 'beaten';
    const cubes = beaten ? GUARDIAN_CUBES[b.id].map((c) => ({ ...c, color: stoneOf(c.color), top: undefined })) : GUARDIAN_CUBES[b.id];
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes, origin: { x, y, z: z + 1 } });
  });
  return out;
}

/** Zone des plans d'une île en coordonnées du monde (bornes hautes exclues). */
export function planZoneOf(id: BiomeId): { x0: number; y0: number; x1: number; y1: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x0: ox + PLAN_ZONE.x, y0: oy + PLAN_ZONE.y, x1: ox + PLAN_ZONE.x + PLAN_ZONE.w, y1: oy + PLAN_ZONE.y + PLAN_ZONE.h };
}

/** Roche sous le sol d'une case de paysage, selon la région et la hauteur. */
function underground(def: IslandDef, cell: LandCell, depthBelowTop: number): string {
  if (def.region === 'feu') return BASALT;
  if (cell.h - depthBelowTop >= 2 || def.region === 'hauteurs' || def.region === 'montagne') return BLOCKS.pierre.side;
  return BLOCKS.terre.side;
}

const SMOKE = '#a9a4a0';

/** Les repères : un grand ouvrage par région, visible de loin, posé sur la terre autour du cœur. */
const LANDMARK_OF: Partial<Record<BiomeId, 'grand-arbre' | 'champignon-geant' | 'fumee' | 'tour-de-guet' | 'grand-phare'>> = {
  foret: 'grand-arbre',
  marais: 'champignon-geant',
  volcan: 'fumee',
  mine: 'tour-de-guet',
  phare: 'grand-phare',
};

type Spot = { x: number; y: number; h: number };

/** Une place de `size` × `size` cases de terre, hors du cœur, à la même hauteur, la plus proche du point voulu. */
function findSpot(def: IslandDef, scenery: LandCell[], wantX: number, wantY: number, size: number): Spot | null {
  const at = new Map(scenery.map((c) => [`${c.x},${c.y}`, c]));
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const c of scenery) {
    if (c.h < 0 || c.ground === 'eau' || c.ground === 'lave') continue;
    let ok = true;
    for (let dx = 0; dx < size && ok; dx++)
      for (let dy = 0; dy < size && ok; dy++) {
        const o = at.get(`${c.x + dx},${c.y + dy}`);
        if (!o || o.h !== c.h || o.ground === 'eau' || o.ground === 'lave' || inCore(def, c.x + dx, c.y + dy)) ok = false;
      }
    if (!ok) continue;
    const d = Math.hypot(c.x - wantX, c.y - wantY);
    if (d < bestD) {
      bestD = d;
      best = { x: c.x, y: c.y, h: c.h };
    }
  }
  return best;
}

/** Pose le repère d'une île (s'il en a un). `put` travaille en coordonnées du monde, z relatif au sol de l'île. */
function landmark(def: IslandDef, scenery: LandCell[], put: (x: number, y: number, z: number, color: string) => void): void {
  const kind = LANDMARK_OF[def.id];
  if (!kind) return;
  const backY = def.core.y + CORE + 1;
  switch (kind) {
    case 'grand-arbre': {
      // Un chêne géant : tronc 2 × 2 de six blocs, large couronne en trois étages.
      const s = findSpot(def, scenery, def.core.x - 4, backY, 2);
      if (!s) return;
      for (let z = 1; z <= 6; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, TRUNK);
      for (let dx = -2; dx <= 3; dx++)
        for (let dy = -2; dy <= 3; dy++) if (Math.abs(dx - 0.5) + Math.abs(dy - 0.5) <= 4) put(s.x + dx, s.y + dy, s.h + 7, LEAF);
      for (let dx = -1; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) put(s.x + dx, s.y + dy, s.h + 8, LEAF);
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + 9, LEAF);
      return;
    }
    case 'champignon-geant': {
      // Un champignon géant : pied clair de trois blocs, chapeau rouge à points blancs.
      const s = findSpot(def, scenery, def.core.x + CORE + 2, backY, 1);
      if (!s) return;
      for (let z = 1; z <= 3; z++) put(s.x, s.y, s.h + z, BLOCKS.sable.side);
      for (let dx = -2; dx <= 2; dx++)
        for (let dy = -2; dy <= 2; dy++)
          if (Math.abs(dx) + Math.abs(dy) <= 3) put(s.x + dx, s.y + dy, s.h + 4, (dx + dy) % 2 === 0 && Math.abs(dx) + Math.abs(dy) === 2 ? SNOW : MUSHROOM);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(s.x + dx, s.y + dy, s.h + 5, MUSHROOM);
      put(s.x, s.y, s.h + 6, SNOW);
      return;
    }
    case 'fumee': {
      // Le cône fume : des volutes grises qui montent au-dessus du cratère, décalées comme au vent.
      const lava = scenery.filter((c) => c.ground === 'lave');
      if (!lava.length) return;
      const cx = Math.round(lava.reduce((a, c) => a + c.x, 0) / lava.length);
      const cy = Math.round(lava.reduce((a, c) => a + c.y, 0) / lava.length);
      const top = Math.max(...lava.map((c) => c.h)) + 2;
      const puffs: [number, number, number][] = [
        [0, 0, 2],
        [1, 0, 3],
        [0, 1, 3],
        [1, 1, 4],
        [2, 1, 5],
        [1, 2, 5],
        [2, 2, 6],
        [3, 2, 7],
      ];
      for (const [dx, dy, dz] of puffs) put(cx + dx, cy + dy, top + dz, SMOKE);
      return;
    }
    case 'tour-de-guet': {
      // Une tour de guet de pierre au sommet du pic, sa bannière de toile en haut.
      const peak = scenery.reduce((a, c) => (c.h > a.h && c.ground !== 'lave' ? c : a), scenery[0]);
      for (let z = 1; z <= 4; z++) put(peak.x, peak.y, peak.h + z, BLOCKS.pierre.side);
      put(peak.x, peak.y, peak.h + 5, BLOCKS.lanterne.side);
      put(peak.x + 1, peak.y, peak.h + 5, BLOCKS.toile.side);
      put(peak.x + 1, peak.y, peak.h + 4, BLOCKS.toile.side);
      return;
    }
    case 'grand-phare': {
      // Le grand phare : tour de pierre 2 × 2 de huit blocs, lanterne de quatre blocs au sommet, toit de prisme.
      const s = findSpot(def, scenery, def.core.x + CORE + 1, backY, 2);
      if (!s) return;
      for (let z = 1; z <= 10; z++)
        for (let dx = 0; dx < 2; dx++)
          for (let dy = 0; dy < 2; dy++)
            put(s.x + dx, s.y + dy, s.h + z, z === 9 ? BLOCKS.lanterne.side : z === 10 ? BLOCKS.prisme.side : z % 4 === 0 ? SNOW : BLOCKS.pierre.side);
      return;
    }
  }
}

/** Les cascades : d'un lac d'une île en altitude, l'eau déborde au bord le plus proche et tombe jusqu'à la mer. */
function cascades(def: IslandDef, scenery: LandCell[], put: (x: number, y: number, z: number, color: string) => void): void {
  if (def.altitude === 0) return;
  const lakes = scenery.filter((c) => c.ground === 'eau');
  if (!lakes.length) return;
  const isLandAt = (x: number, y: number) => isLand(def, x, y);
  const edges = scenery.filter(
    (c) =>
      c.h >= 0 &&
      c.ground !== 'eau' &&
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => !isLandAt(c.x + dx, c.y + dy)),
  );
  if (!edges.length) return;
  const lake = lakes[0];
  const edge = edges.reduce((a, c) => (Math.hypot(c.x - lake.x, c.y - lake.y) < Math.hypot(a.x - lake.x, a.y - lake.y) ? c : a), edges[0]);
  const out = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].find(([dx, dy]) => !isLandAt(edge.x + dx, edge.y + dy));
  if (!out) return;
  // Un filet d'eau sur la case du bord, puis la chute, jusqu'au niveau de la mer.
  put(edge.x, edge.y, edge.h + 1, WATER);
  for (let z = edge.h; z >= -def.altitude; z--) put(edge.x + out[0], edge.y + out[1], z, WATER);
  put(edge.x + 2 * out[0], edge.y + 2 * out[1], -def.altitude, SNOW);
}

/** Les nappes de brume des sommets (îles à 9) : centre, étendue et hauteur, en coordonnées de grille. */
export function mistPatches(): { x: number; y: number; z: number; w: number; h: number }[] {
  return MAP.filter((d) => d.altitude >= 9).map((d) => {
    const b = landBox(d);
    return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: d.altitude - 1.5, w: b.x1 - b.x0 + 8, h: b.y1 - b.y0 + 8 };
  });
}

export function worldCubes(
  progress: Record<string, { stars: number }>,
  village: Village = { plans: {}, journal: [], bridges: [] },
  withCreatures = true,
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  BIOMES.forEach((biome, index) => {
    const def = islandDef(biome.id);
    const { ox, oy, oz } = islandOrigin(index);
    const unlocked = isBiomeUnlocked(biome.id, village.bridges);
    const block = BLOCKS[biome.block];
    const grassy =
      biome.id === 'foret' || biome.id === 'ferme' || biome.id === 'plaine' || biome.id === 'riviere' || biome.id === 'marche' || biome.id === 'carrefour';
    const h = (x: number, y: number) => groundHeight(index, x, y);
    // Cubes du cœur (coordonnées relatives au cœur, z relatif au sol de l'île).
    // Cubes de la terre autour du cœur (coordonnées du monde). Île verrouillée : mêmes formes, couleurs délavées.
    const taken = new Set<string>();
    const putWorld = (x: number, y: number, z: number, color: string) => {
      taken.add(`${x},${y},${z}`);
      cubes.push({ x, y, z: oz + z, color: unlocked ? color : fade(color), texture: TEXTURES[color], tag: biome.id, muted: unlocked ? undefined : true });
    };
    const put: Put = (x, y, z, color) => putWorld(ox + x, oy + y, z, color);
    const land = landCells(def);
    for (const c of land) {
      if (!inCore(def, c.x, c.y)) continue;
      const x = c.x - ox;
      const y = c.y - oy;
      for (let d = 1; d <= DEPTH; d++) put(x, y, -d, BLOCKS.terre.side);
      const top = h(x, y);
      if (top > 0) put(x, y, 0, BLOCKS.terre.side);
      put(x, y, top, grassy ? GRASS : block.side);
    }
    // Le paysage autour du cœur : collines, pics, lacs, cratère, sable des plages, neige des sommets, puis le décor.
    const scenery = landscape(def);
    for (const c of scenery) {
      for (let d = 1; d <= DEPTH; d++) putWorld(c.x, c.y, Math.min(0, c.h) - d, underground(def, c, c.h + d));
      for (let z = 0; z < c.h; z++) putWorld(c.x, c.y, z, underground(def, c, c.h - z));
      putWorld(c.x, c.y, c.h, GROUND_COLOR[c.ground]);
    }
    DECOR[biome.id](put, h);
    landmark(def, scenery, (x, y, z, color) => !taken.has(`${x},${y},${z}`) && putWorld(x, y, z, color));
    cascades(def, scenery, (x, y, z, color) => !taken.has(`${x},${y},${z}`) && putWorld(x, y, z, color));
    for (const c of scenery) {
      if (!c.decor) continue;
      const r = noise(def.seed + 5, c.x, c.y);
      // Le décor ne remplace jamais un cube déjà posé (sol voisin plus haut, feuillage d'un autre arbre).
      decorate((x, y, z, color) => !taken.has(`${x},${y},${c.h + z}`) && putWorld(x, y, c.h + z, color), c.decor, c.x, c.y, r);
    }
    // Une île en altitude flotte : sa roche s'amincit dessous.
    if (def.altitude > 0) {
      let layer = new Set(land.map((c) => `${c.x},${c.y}`));
      for (let d = 1; d <= TAPER; d++) {
        const next = new Set<string>();
        for (const key of layer) {
          const [x, y] = key.split(',').map(Number);
          if ([`${x - 1},${y}`, `${x + 1},${y}`, `${x},${y - 1}`, `${x},${y + 1}`].every((k) => layer.has(k))) next.add(key);
        }
        layer = next;
        for (const key of layer) {
          const [x, y] = key.split(',').map(Number);
          if (!taken.has(`${x},${y},${-DEPTH - d}`)) putWorld(x, y, -DEPTH - d, BLOCKS.pierre.side);
        }
        if (layer.size === 0) break;
      }
    }
    // L'îlot du Gardien, devant l'île, dès qu'il accepte le défi : une plateforme de pierre sur deux couches de terre.
    const guardian = guardianStatus(biome, progress, village.bridges);
    if (guardian !== 'hidden') {
      const { x: gx, y: gy, z: gz } = bossIsletOrigin(index);
      for (let x = 0; x < ISLET_W; x++) {
        for (let y = 0; y < ISLET_H; y++) {
          for (let d = 1; d <= DEPTH; d++) cubes.push({ x: gx + x, y: gy + y, z: gz - d, color: BLOCKS.terre.side, texture: 'terre', tag: biome.id });
          cubes.push({ x: gx + x, y: gy + y, z: gz, color: BLOCKS.pierre.side, texture: 'pierre', tag: biome.id });
        }
      }
      // Vaincu : un bloc d'or à côté de la statue.
      if (guardian === 'beaten') cubes.push({ x: gx + ISLET_W - 1, y: gy, z: gz + 1, color: BLOCKS.or.side, top: BLOCKS.or.top, texture: 'or', tag: biome.id });
    }
    if (unlocked && withCreatures) {
      for (const c of CREATURE_CUBES[biome.id])
        cubes.push({
          x: ox + 2 + c.x,
          y: oy + 4 + c.y,
          z: oz + c.z + 1,
          color: c.color,
          tag: biome.id,
        });
    }
    // Les plans : cellules posées en dur ; fantômes seulement pour le plan en cours (le premier non terminé) d'une île ouverte.
    if (unlocked) {
      let ghostsShown = false;
      for (const plan of plansFor(biome.id)) {
        const done = new Set(village.plans[plan.id] ?? []);
        const finished = isPlanDone(plan, village.plans);
        if (!finished && ghostsShown) break;
        if (!finished) ghostsShown = true;
        for (const c of planCells(plan)) {
          const bd = BLOCKS[c.block];
          const built = done.has(c.key);
          cubes.push({ x: ox + c.x, y: oy + c.y, z: oz + c.z + 1, color: bd.side, top: bd.top, texture: bd.texture, tag: biome.id, ghost: !built });
        }
      }
    }
  });
  // Les ponts : en planches s'ils sont construits, en fantôme s'ils sont constructibles, absents s'ils sont trop loin.
  for (const def of BRIDGES) {
    const state = bridgeState(def, village.bridges);
    if (state !== 'far') bridge(def, cubes, state === 'buildable');
  }
  return cubes;
}
