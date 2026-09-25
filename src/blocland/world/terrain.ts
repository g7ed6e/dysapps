// Le terrain du village : une île par biome (relief léger, décor, créature), reliées par des ponts de bois.
// Générateur pur (sans Three.js) : testable, et partagé entre la 3D et la vue simple.
import { BIOMES, BLOCKS, type BiomeDef, type BiomeId } from '../biomes';
import { BRIDGES, ISLAND_POS, bridgeState, isBiomeUnlocked, type BridgeDef } from './archipelago';
import { CREATURE_CUBES } from '../Creatures';
import { GUARDIAN_CUBES } from '../Guardians';
import { isBossBeaten, isBossUnlocked } from '../boss';
import type { VoxelCube } from '../Voxel';
import type { Village } from '../engine';
import { PLAN_ZONE, isPlanDone, planCells, plansFor } from './plans';

/** Côté d'une île (en blocs), espace entre deux îles d'une rangée, espace entre deux rangées (l'îlot du Gardien y tient). */
export const ISLAND = 12;
export const GAP = 4;
export const ROW_GAP = 8;
/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;

const LOCKED = { top: '#d6d1c4', side: '#b9b4a8' };
const TRUNK = '#6b4a2e';
const LEAF = '#4e8f36';
const GRASS = '#6cb33f';
const DARK = '#3b2d20';
const HAY = '#e8c66f';
const SNOW = '#f4f8fb';

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
  [SNOW]: 'nuage',
  [HAY]: 'or',
};

/**
 * Coin (x, y) de l'île d'un biome, d'après sa colonne et sa rangée dans l'archipel. La rangée 0 est au fond,
 * les suivantes devant (vers la caméra). Vue depuis le côté où les créatures ont leur visage, l'axe x s'affiche
 * de droite à gauche : la colonne 0 apparaît donc à gauche.
 */
export function islandOrigin(index: number): { ox: number; oy: number } {
  const { col, row } = ISLAND_POS[BIOMES[index].id];
  const cols = Math.max(...Object.values(ISLAND_POS).map((p) => p.col)) + 1;
  return { ox: (cols - 1 - col) * (ISLAND + GAP), oy: 0 - row * (ISLAND + ROW_GAP) };
}

/** Centre d'une île (coordonnées de grille), pour y amener la caméra. */
export function islandCenter(id: BiomeId): { x: number; y: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: ox + ISLAND / 2, y: oy + ISLAND / 2 };
}

/** Étendue du monde (coordonnées de grille), ponts compris. */
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
  BIOMES.forEach((_, i) => {
    const { ox, oy } = islandOrigin(i);
    minX = Math.min(minX, ox);
    maxX = Math.max(maxX, ox + ISLAND);
    minY = Math.min(minY, oy);
    maxY = Math.max(maxY, oy + ISLAND);
  });
  return { minX, maxX, minY, maxY };
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

/**
 * Pont de bois entre deux îles voisines, à hauteur du sol : d'un bord à l'autre, au milieu du côté entre deux
 * colonnes, sur le côté droit (loin de l'îlot du Gardien) entre deux rangées. Fantôme tant qu'il n'est pas construit.
 */
function bridge(def: BridgeDef, cubes: VoxelCube[], ghost: boolean): void {
  const from = BIOMES.find((b) => b.id === def.from)!;
  const to = BIOMES.find((b) => b.id === def.to)!;
  const a = islandOrigin(BIOMES.indexOf(from));
  const b = islandOrigin(BIOMES.indexOf(to));
  const sideways = a.ox !== b.ox;
  let start: { x: number; y: number };
  let end: { x: number; y: number };
  if (sideways) {
    const forward = b.ox > a.ox;
    start = { x: forward ? a.ox + ISLAND : a.ox - 1, y: a.oy + Math.floor(ISLAND / 2) };
    end = { x: forward ? b.ox - 1 : b.ox + ISLAND, y: b.oy + Math.floor(ISLAND / 2) };
  } else {
    const forward = b.oy > a.oy;
    start = { x: a.ox + ISLAND - 1, y: forward ? a.oy + ISLAND : a.oy - 1 };
    end = { x: b.ox + ISLAND - 1, y: forward ? b.oy - 1 : b.oy + ISLAND };
  }
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  const seen = new Set<string>();
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(start.x + ((end.x - start.x) * i) / steps);
    const y = Math.round(start.y + ((end.y - start.y) * i) / steps);
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cubes.push({ x, y, z: 0, color: BLOCKS.bois.side, texture: 'planches', tag: to.id, ghost: ghost || undefined });
  }
}

/** Coordonnées du monde → case relative à une île (z relatif : 0 = premier bloc sur le sol de la zone libre). */
export function toIslandCell(id: BiomeId, x: number, y: number, z: number): { x: number; y: number; z: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: x - ox, y: y - oy, z: z - 1 };
}

/** Tous les cubes du village, étiquetés par biome. Les îles verrouillées sont en pierre grise, sans créature. */
/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(bridges: string[]): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] {
  return BIOMES.filter((b) => isBiomeUnlocked(b.id, bridges)).map((b) => {
    const { ox, oy } = islandOrigin(BIOMES.indexOf(b));
    return { id: b.id, cubes: CREATURE_CUBES[b.id], origin: { x: ox + 2, y: oy + 4, z: 1 } };
  });
}

/** L'îlot du Gardien : devant l'île (côté caméra), ISLET_W × ISLET_H cases. */
export const ISLET_W = 8;
export const ISLET_H = 4;
export function bossIsletOrigin(index: number): { x: number; y: number } {
  const { ox, oy } = islandOrigin(index);
  return { x: ox + 2, y: oy - ISLET_H - 2 };
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
    const { x, y } = bossIsletOrigin(index);
    const beaten = status === 'beaten';
    const cubes = beaten ? GUARDIAN_CUBES[b.id].map((c) => ({ ...c, color: stoneOf(c.color), top: undefined })) : GUARDIAN_CUBES[b.id];
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes, origin: { x, y, z: 1 } });
  });
  return out;
}

/** Zone des plans d'une île en coordonnées du monde (bornes hautes exclues). */
export function planZoneOf(id: BiomeId): { x0: number; y0: number; x1: number; y1: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x0: ox + PLAN_ZONE.x, y0: oy + PLAN_ZONE.y, x1: ox + PLAN_ZONE.x + PLAN_ZONE.w, y1: oy + PLAN_ZONE.y + PLAN_ZONE.h };
}

export function worldCubes(
  progress: Record<string, { stars: number }>,
  village: Village = { plans: {}, journal: [], bridges: [] },
  withCreatures = true,
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  BIOMES.forEach((biome, index) => {
    const { ox, oy } = islandOrigin(index);
    const unlocked = isBiomeUnlocked(biome.id, village.bridges);
    const block = BLOCKS[biome.block];
    const grassy =
      biome.id === 'foret' || biome.id === 'ferme' || biome.id === 'plaine' || biome.id === 'riviere' || biome.id === 'marche' || biome.id === 'carrefour';
    const h = (x: number, y: number) => groundHeight(index, x, y);
    const put: Put = (x, y, z, color) =>
      cubes.push({
        x: ox + x,
        y: oy + y,
        z,
        color: unlocked ? color : LOCKED.side,
        texture: unlocked ? TEXTURES[color] : 'pierre',
        tag: biome.id,
      });
    for (let x = 0; x < ISLAND; x++) {
      for (let y = 0; y < ISLAND; y++) {
        for (let d = 1; d <= DEPTH; d++) put(x, y, -d, BLOCKS.terre.side);
        const top = h(x, y);
        if (top > 0) put(x, y, 0, BLOCKS.terre.side);
        put(x, y, top, grassy ? GRASS : block.side);
      }
    }
    DECOR[biome.id](put, h);
    // L'îlot du Gardien, devant l'île, dès qu'il accepte le défi : une plateforme de pierre sur deux couches de terre.
    const guardian = guardianStatus(biome, progress, village.bridges);
    if (guardian !== 'hidden') {
      const { x: gx, y: gy } = bossIsletOrigin(index);
      for (let x = 0; x < ISLET_W; x++) {
        for (let y = 0; y < ISLET_H; y++) {
          for (let d = 1; d <= DEPTH; d++) cubes.push({ x: gx + x, y: gy + y, z: -d, color: BLOCKS.terre.side, texture: 'terre', tag: biome.id });
          cubes.push({ x: gx + x, y: gy + y, z: 0, color: BLOCKS.pierre.side, texture: 'pierre', tag: biome.id });
        }
      }
      // Vaincu : un bloc d'or à côté de la statue.
      if (guardian === 'beaten') cubes.push({ x: gx + ISLET_W - 1, y: gy, z: 1, color: BLOCKS.or.side, top: BLOCKS.or.top, texture: 'or', tag: biome.id });
    }
    if (unlocked && withCreatures) {
      for (const c of CREATURE_CUBES[biome.id])
        cubes.push({
          x: ox + 2 + c.x,
          y: oy + 4 + c.y,
          z: c.z + 1,
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
          const def = BLOCKS[c.block];
          const built = done.has(c.key);
          cubes.push({ x: ox + c.x, y: oy + c.y, z: c.z + 1, color: def.side, top: def.top, texture: def.texture, tag: biome.id, ghost: !built });
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
