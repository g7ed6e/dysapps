// Le décor rangé : les cubes d'un même élément (un arbre, un buisson…) deviennent un seul objet, posé à sa place (la 2D
// le dessine en sprite, pixel/). Calcul pur, sans Three.js ni canvas : le terrain garde ses autres cubes.
import type { VoxelCube } from '../Voxel';

/** Les genres de décor rangés en objets (les sprites de la 2D) ; les autres restent des cubes. */
export const PROP_KINDS = ['arbre', 'sapin', 'buisson', 'fleur', 'champignon', 'rocher', 'souche', 'roseau', 'cristal'] as const;
export type PropKind = (typeof PROP_KINDS)[number];

export interface Prop {
  id: string;
  kind: PropKind;
  /** La case où il pousse (le pied du tronc, sinon son cube le plus bas). */
  x: number;
  y: number;
  /** La hauteur du sol sous lui (le haut du cube sur lequel il est posé). */
  z: number;
  muted: boolean;
}

/** Une borne de mission, dessinée en panneau : sa mission (« île:mission ») et sa case (z : le haut du sol dessous). */
export interface Station {
  quest: string;
  x: number;
  y: number;
  z: number;
  muted: boolean;
}

/** Le genre d'un élément de décor d'après son nom (« foret/cœur:arbre@8,2 » : un arbre). */
export function kindOf(decor: string): string {
  const name = decor.slice(decor.lastIndexOf('/') + 1).replace(/^cœur:/, '');
  return name.slice(0, name.indexOf('@'));
}

/**
 * Sépare le décor du terrain : chaque élément d'un genre rangé (`PROP_KINDS`) devient un objet, chaque borne de mission
 * un panneau ; leurs cubes quittent le terrain. Les autres cubes (et le décor d'un autre genre) restent des cubes.
 */
export function propsOf(cubes: VoxelCube[]): { props: Prop[]; stations: Station[]; terrain: VoxelCube[] } {
  const groups = new Map<string, VoxelCube[]>();
  const quests = new Map<string, VoxelCube[]>();
  const terrain: VoxelCube[] = [];
  for (const c of cubes) {
    if (c.quest) {
      const list = quests.get(c.quest);
      if (list) list.push(c);
      else quests.set(c.quest, [c]);
    } else if (c.decor && (PROP_KINDS as readonly string[]).includes(kindOf(c.decor))) {
      const list = groups.get(c.decor);
      if (list) list.push(c);
      else groups.set(c.decor, [c]);
    } else terrain.push(c);
  }
  const props: Prop[] = [];
  for (const [id, list] of groups) {
    const kind = kindOf(id) as PropKind;
    // Le pied : le cube de tronc le plus bas s'il y en a (un arbre), sinon le plus bas de tous.
    const trunk = list.filter((c) => c.texture === 'tronc');
    const foot = (trunk.length ? trunk : list).reduce((a, b) => (b.z < a.z ? b : a));
    props.push({ id, kind, x: foot.x, y: foot.y, z: foot.z, muted: Boolean(foot.muted) });
  }
  const stations: Station[] = [...quests].map(([quest, list]) => {
    const foot = list.reduce((a, b) => (b.z < a.z ? b : a));
    return { quest, x: foot.x, y: foot.y, z: foot.z, muted: Boolean(foot.muted) };
  });
  return { props, stations, terrain };
}
