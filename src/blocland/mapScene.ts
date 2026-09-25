// La carte de Blocland en cubes : une île par biome, sa créature, son décor, et des ponts entre les îles.
import { BIOMES, BLOCKS, isBiomeUnlocked, type BiomeDef, type BiomeId } from './biomes';
import { CREATURE_CUBES } from './Creatures';
import type { VoxelCube } from './Voxel';

export const ISLAND = 7;
const GAP = 3;
const LOCKED = { top: '#d6d1c4', side: '#b9b4a8' };
const TRUNK = '#6b4a2e';
const LEAF = '#4e8f36';
const GRASS = '#6cb33f';
const DARK = '#3b2d20';
/** Textures 3D par couleur de décor (les couleurs servent au SVG et aux îles verrouillées). */
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
  '#e8c66f': 'or',
};

/**
 * Coin (x, y) de l'île d'un biome : les îles se suivent en zigzag, la première à l'x le plus grand.
 * (Vue depuis le côté où les créatures ont leur visage, l'axe x s'affiche de droite à gauche :
 * la Forêt apparaît donc à gauche.)
 */
export function islandOrigin(index: number): { ox: number; oy: number } {
  return { ox: (BIOMES.length - 1 - index) * (ISLAND + GAP), oy: index % 2 ? ISLAND - 1 : 0 };
}

type Deco = (put: (x: number, y: number, z: number, color: string) => void) => void;

/** Décor propre à chaque biome, en coordonnées relatives à l'île (moitié droite, la créature est à gauche). */
const DECOR: Record<BiomeId, Deco> = {
  foret: (put) => {
    for (const [tx, ty] of [
      [5, 1],
      [5, 5],
    ]) {
      put(tx, ty, 1, TRUNK);
      put(tx, ty, 2, TRUNK);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(tx + dx, ty + dy, 3, LEAF);
      put(tx, ty, 4, LEAF);
    }
  },
  mine: (put) => {
    put(5, 1, 1, BLOCKS.pierre.side);
    put(6, 2, 1, BLOCKS.pierre.side);
    put(5, 2, 2, BLOCKS.pierre.side);
    put(5, 5, 1, DARK);
    put(5, 5, 2, DARK);
    put(6, 5, 1, DARK);
    put(6, 5, 2, DARK);
  },
  carriere: (put) => {
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(4 + dx, 2 + dy, 1, BLOCKS.sable.side);
    put(5, 3, 2, BLOCKS.sable.side);
  },
  ferme: (put) => {
    for (let dy = 1; dy <= 5; dy++) {
      put(5, dy, 1, '#e8c66f');
      if (dy % 2) put(6, dy, 1, '#e8c66f');
    }
    put(4, 0, 1, TRUNK);
    put(4, 6, 1, TRUNK);
  },
  tour: (put) => {
    for (let z = 1; z <= 4; z++) for (const [dx, dy] of [[5, 3], [6, 3], [5, 4], [6, 4]]) put(dx, dy, z, BLOCKS.verre.side);
    put(5, 3, 5, BLOCKS.or.side);
  },
};

/** Pont de bois entre deux îles voisines, à hauteur du sol. */
function bridge(from: BiomeDef, to: BiomeDef, cubes: VoxelCube[]): void {
  const a = islandOrigin(BIOMES.indexOf(from));
  const b = islandOrigin(BIOMES.indexOf(to));
  // Du bord de l'île de départ qui fait face à l'arrivée, jusqu'au bord opposé de l'île d'arrivée.
  const forward = b.ox > a.ox;
  const start = { x: forward ? a.ox + ISLAND : a.ox - 1, y: a.oy + Math.floor(ISLAND / 2) };
  const end = { x: forward ? b.ox - 1 : b.ox + ISLAND, y: b.oy + Math.floor(ISLAND / 2) };
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  const seen = new Set<string>();
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(start.x + ((end.x - start.x) * i) / steps);
    const y = Math.round(start.y + ((end.y - start.y) * i) / steps);
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cubes.push({ x, y, z: 0, color: BLOCKS.bois.side, texture: 'planches', tag: to.id });
  }
}

/** Tous les cubes de la carte, étiquetés par biome pour le clic. */
export function mapCubes(progress: Record<string, { stars: number }>): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  BIOMES.forEach((biome, index) => {
    const { ox, oy } = islandOrigin(index);
    const unlocked = isBiomeUnlocked(biome.id, progress);
    const block = BLOCKS[biome.block];
    const put = (x: number, y: number, z: number, color: string) =>
      cubes.push({ x: ox + x, y: oy + y, z, color: unlocked ? color : LOCKED.side, texture: unlocked ? TEXTURES[color] : 'pierre', tag: biome.id });
    for (let x = 0; x < ISLAND; x++) {
      for (let y = 0; y < ISLAND; y++) {
        put(x, y, -1, BLOCKS.terre.side);
        put(x, y, 0, biome.id === 'foret' || biome.id === 'ferme' ? GRASS : block.side);
      }
    }
    DECOR[biome.id](put);
    if (unlocked) {
      for (const c of CREATURE_CUBES[biome.id]) cubes.push({ x: ox + c.x, y: oy + 1 + c.y, z: c.z + 1, color: c.color, tag: biome.id });
    }
    if (index > 0) bridge(BIOMES[index - 1], biome, cubes);
  });
  return cubes;
}
