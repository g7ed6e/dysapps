// Le décor de la 2D : les cubes d'un même élément (un arbre, un buisson…) deviennent un seul objet, dessiné en sprite
// à sa place. Calcul pur : le terrain garde ses autres cubes.
import type { VoxelCube } from '../Voxel';
import { SPRITE_KINDS, type SpriteKind } from './sprites';

export interface Prop {
  id: string;
  kind: SpriteKind;
  /** La case où il pousse (le pied du tronc, sinon son cube le plus bas). */
  x: number;
  y: number;
  /** La hauteur du sol sous lui (le haut du cube sur lequel il est posé). */
  z: number;
  muted: boolean;
}

/** Le genre d'un élément de décor d'après son nom (« foret/cœur:arbre@8,2 » : un arbre). */
export function kindOf(decor: string): string {
  const name = decor.slice(decor.lastIndexOf('/') + 1).replace(/^cœur:/, '');
  return name.slice(0, name.indexOf('@'));
}

/**
 * Sépare le décor du terrain : chaque élément dont on sait dessiner le sprite devient un objet ; ses cubes quittent le
 * terrain. Les autres cubes (et le décor sans sprite) restent des cubes.
 */
export function propsOf(cubes: VoxelCube[]): { props: Prop[]; terrain: VoxelCube[] } {
  const groups = new Map<string, VoxelCube[]>();
  const terrain: VoxelCube[] = [];
  for (const c of cubes) {
    if (c.decor && (SPRITE_KINDS as readonly string[]).includes(kindOf(c.decor))) {
      const list = groups.get(c.decor);
      if (list) list.push(c);
      else groups.set(c.decor, [c]);
    } else terrain.push(c);
  }
  const props: Prop[] = [];
  for (const [id, list] of groups) {
    const kind = kindOf(id) as SpriteKind;
    // Le pied : le cube de tronc le plus bas s'il y en a (un arbre), sinon le plus bas de tous.
    const trunk = list.filter((c) => c.texture === 'tronc');
    const foot = (trunk.length ? trunk : list).reduce((a, b) => (b.z < a.z ? b : a));
    props.push({ id, kind, x: foot.x, y: foot.y, z: foot.z, muted: Boolean(foot.muted) });
  }
  return { props, terrain };
}
