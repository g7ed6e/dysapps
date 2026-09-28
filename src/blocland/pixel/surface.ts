// Le sol vu de dessus, case par case : la hauteur et la matière du bloc le plus haut de chaque colonne (sans le
// décor ni les fantômes). La 2D s'en sert pour les bords entre deux sols, les rebords de falaise et les ombres.
import type { VoxelCube } from '../Voxel';
import { decorPose } from '../world/props';

/** Les matières dessinées exprès pour la 2D ; `autre` garde la texture du bloc (planches, briques…). */
export type Material = 'herbe' | 'mousse' | 'sable' | 'terre' | 'pierre' | 'basalte' | 'eau' | 'lave' | 'glace' | 'neige' | 'autre';

const BY_TEXTURE: Record<string, Material> = {
  herbe: 'herbe',
  sable: 'sable',
  terre: 'terre',
  pierre: 'pierre',
  galet: 'pierre',
  eau: 'eau',
  nuage: 'neige',
  mousse: 'mousse',
  basalte: 'basalte',
  lave: 'lave',
  glace: 'glace',
};

export function materialOf(cube: VoxelCube): Material {
  return (cube.texture && BY_TEXTURE[cube.texture]) || 'autre';
}

/**
 * Qui déborde sur qui, entre deux sols voisins à la même hauteur : l'herbe mord sur la terre, la terre sur le sable,
 * le sable sur l'eau (le sol le plus haut placé dessine sa frange chez l'autre ; la lave, liquide, ne déborde sur
 * rien). `autre` ne déborde ni ne reçoit.
 */
export const PRIORITY: Record<Material, number> = { herbe: 6, mousse: 5, neige: 5, terre: 4, basalte: 4, pierre: 3, glace: 2, sable: 1, eau: 0, lave: 0, autre: -1 };

export interface Column {
  z: number;
  material: Material;
}

export type Surface = Map<string, Column>;

/** Le haut de chaque colonne. */
export function surfaceOf(cubes: VoxelCube[]): Surface {
  const out: Surface = new Map();
  for (const c of cubes) {
    if (c.ghost || decorPose(c.decor)) continue;
    const k = `${c.x},${c.y}`;
    const cur = out.get(k);
    if (!cur || c.z > cur.z) out.set(k, { z: c.z, material: materialOf(c) });
  }
  return out;
}

export const columnAt = (s: Surface, x: number, y: number) => s.get(`${x},${y}`);
