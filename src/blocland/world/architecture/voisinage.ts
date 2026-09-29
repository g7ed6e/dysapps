// Le voisinage d'un bloc posé (lot 7a d'Archipéo, l'architecture modulaire) : ce qu'il y a autour de lui dans le plan,
// lu sur le PLAN ENTIER, fantômes compris (décision du directeur artistique). La pièce choisie pour une case ne change
// donc pas pendant le chantier : poser la case d'à côté ne transforme pas celle-ci, seul le fantôme devient pièce.
// Code pur, sans Three.js ni matière d'archipel : la classe d'un bloc (mur ou toit) ne dépend que de sa texture.
import type { VoxelCube } from '../cube';

/** La classe d'un bloc dans l'architecture : un mur (pierre, bois, verre pris dans un mur) ou un toit. */
export type Classe = 'mur' | 'toit';

/** Les textures des toits (comme les toitures de world/construction.ts). */
const TOITS = new Set(['toit', 'tuile']);
/** Ce qui ne fait pas masse dans le plan : une lanterne, posée au sommet d'un mur ou dans une cour, n'est ni mur ni toit. */
const HORS_MASSE = new Set(['lanterne']);

/**
 * Les quatre côtés, dans le masque `cotes` : le bit `i` est la voisine dans la direction `COTES[i]`. L'ordre tourne dans
 * le sens direct vu du dessus (+x, puis +y, puis −x, puis −y) : tourner d'un quart de tour décale le masque d'un bit.
 */
export const COTES: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

/** Le voisinage d'un bloc : sa texture, sa classe, et celles de ses voisines dans le plan. */
export interface Voisinage {
  texture: string;
  classe: Classe;
  /** Les voisines de même classe, côte à côte (4 bits, voir `COTES`). */
  cotes: number;
  /** Ce qui est posé (ou à poser) juste au-dessus dans le plan. */
  dessus: Classe | 'rien';
  /** Ce qui est posé (ou à poser) juste en dessous dans le plan ; `rien` : le bloc est au pied (sur le sol). */
  dessous: Classe | 'rien';
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Un cube fait-il partie d'un plan (un bâtiment, un ouvrage, un monument) ? Pas le sol, ni le décor, ni une borne, ni un
 * ouvrage entre deux îles (les ponts ont leurs modèles) ; un fantôme, si : la règle lit le plan entier.
 */
export function estDuPlan(c: VoxelCube): boolean {
  return !c.sol && !c.decor && !c.quest && !c.bridge;
}

/** La classe d'un bloc, ou `null` s'il ne fait pas masse (une lanterne). */
export function classeDe(texture: string | undefined): Classe | null {
  if (HORS_MASSE.has(texture ?? '')) return null;
  return TOITS.has(texture ?? '') ? 'toit' : 'mur';
}

/** Les cases du plan (clé `x,y,z`), fantômes compris, et leur classe. */
export type IndexDuPlan = Map<string, Classe>;

export function indexDuPlan(cubes: readonly VoxelCube[]): IndexDuPlan {
  const out: IndexDuPlan = new Map();
  for (const c of cubes) {
    if (!estDuPlan(c)) continue;
    const k = classeDe(c.texture);
    if (k) out.set(cle(c.x, c.y, c.z), k);
  }
  return out;
}

/** Le voisinage d'un bloc du plan (`null` pour une lanterne, qui ne fait pas masse). */
export function voisinageDe(c: VoxelCube, index: IndexDuPlan): Voisinage | null {
  const classe = classeDe(c.texture);
  if (!classe) return null;
  let cotes = 0;
  COTES.forEach(([dx, dy], i) => {
    if (index.get(cle(c.x + dx, c.y + dy, c.z)) === classe) cotes |= 1 << i;
  });
  return {
    texture: c.texture ?? '',
    classe,
    cotes,
    dessus: index.get(cle(c.x, c.y, c.z + 1)) ?? 'rien',
    dessous: index.get(cle(c.x, c.y, c.z - 1)) ?? 'rien',
  };
}

/** Un masque de côtés tourné de `r` quarts de tour dans le sens direct (+x vers +y). */
export function tournerCotes(cotes: number, r: number): number {
  const q = ((r % 4) + 4) % 4;
  return ((cotes << q) | (cotes >> (4 - q))) & 0b1111;
}

/** Un voisinage tourné de `r` quarts de tour (le dessus et le dessous ne tournent pas). */
export function tournerVoisinage(v: Voisinage, r: number): Voisinage {
  return { ...v, cotes: tournerCotes(v.cotes, r) };
}
