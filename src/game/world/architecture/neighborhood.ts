// Le voisinage d'un bloc posé (lot 7 d'Archipéo, l'architecture modulaire) : ce qu'il y a autour de lui dans le plan,
// lu sur le PLAN ENTIER, fantômes compris (décision du directeur artistique). La pièce choisie pour une case ne change
// donc pas pendant le chantier : poser la case d'à côté ne transforme pas celle-ci, seul le fantôme devient pièce.
// Code pur, sans Three.js ni matière d'archipel : la classe d'un bloc (mur ou toit) ne dépend que de sa texture.
import type { VoxelCube } from '../cube';

/** La classe d'un bloc dans l'architecture : un mur (pierre, bois, verre pris dans un mur) ou un toit. */
export type Classe = 'mur' | 'toit';

/** Les textures des toits (comme les toitures de world/construction.ts). */
const TOITS = new Set(['toit', 'tuile']);
/**
 * Ce qui ne fait pas masse dans le plan : une lanterne, posée au sommet d'un mur ou dans une cour, n'est ni mur ni toit.
 * Prise dans un mur (une fenêtre : un mur de part et d'autre sur une rangée, un mur dessous), elle fait mur : le mur
 * continue au travers de sa fenêtre, comme la vitre de world/construction.ts (`genresDesBlocs`).
 */
const HORS_MASSE = new Set(['lanterne']);

/**
 * Les quatre côtés, dans le masque `cotes` : le bit `i` est la voisine dans la direction `SIDES[i]`. L'ordre tourne dans
 * le sens direct vu du dessus (+x, puis +y, puis −x, puis −y) : tourner d'un quart de tour décale le masque d'un bit.
 * Les coins suivent le même ordre : le coin `i` est entre le côté `i` et le côté `i + 1` (le coin 0 : +x et +y).
 */
export const SIDES: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

/** Le voisinage d'un bloc : sa texture, sa classe, et celles de ses voisines dans le plan. */
export interface Voisinage {
  texture: string;
  classe: Classe;
  /** Les voisines de même classe, côte à côte (4 bits, voir `SIDES`). */
  cotes: number;
  /** Ce qui est posé (ou à poser) juste au-dessus dans le plan. */
  dessus: Classe | 'rien';
  /** Ce qui est posé (ou à poser) juste en dessous dans le plan ; `rien` : le bloc est au pied (sur le sol). */
  dessous: Classe | 'rien';
  /**
   * Le sens de la pente : les côtés où la même classe est posée (ou à poser) un cran plus haut (4 bits, voir `SIDES`).
   * Un toit en gradins monte de ce côté.
   */
  monte: number;
  /** Les côtés où la même classe est un cran plus bas : un faîte descend des deux côtés. */
  descend: number;
  /** Les coins (4 bits) où la même classe est un cran plus haut, en diagonale : le coin d'un toit en pyramide. */
  coins: number;
  /** Les côtés où un toit est posé (ou à poser), au même niveau : un mur entre deux toits est un pignon. */
  toits: number;
  /** Rien sous le bloc, ni dans le plan ni au sol (l'eau, le bord du quai) : un bâtiment de bois y prend des pilotis. */
  surLeVide: boolean;
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
  const lanternes: VoxelCube[] = [];
  for (const c of cubes) {
    if (!estDuPlan(c)) continue;
    const k = classeDe(c.texture);
    if (k) out.set(cle(c.x, c.y, c.z), k);
    else lanternes.push(c);
  }
  // Une lanterne prise dans un mur (une fenêtre) fait mur.
  const mur = (x: number, y: number, z: number) => out.get(cle(x, y, z)) === 'mur';
  for (const c of lanternes) {
    const prise = ((mur(c.x - 1, c.y, c.z) && mur(c.x + 1, c.y, c.z)) || (mur(c.x, c.y - 1, c.z) && mur(c.x, c.y + 1, c.z))) && mur(c.x, c.y, c.z - 1);
    if (prise) out.set(cle(c.x, c.y, c.z), 'mur');
  }
  return out;
}

export interface OptionsDuVoisinage {
  /**
   * La case (x, y, z) est-elle sur le vide : rien de solide dessous, jusqu'à l'eau ou au large ? Sans cette fonction,
   * rien ne l'est.
   */
  surLeVide?: (x: number, y: number, z: number) => boolean;
  /** La classe du bloc, quand elle ne se lit pas sur sa texture (un bloc d'un lieu du village : ./places.ts). */
  classe?: Classe;
}

/** Le voisinage d'un bloc du plan (`null` pour une lanterne, qui ne fait pas masse). */
export function voisinageDe(c: VoxelCube, index: IndexDuPlan, options: OptionsDuVoisinage = {}): Voisinage | null {
  const classe = options.classe ?? classeDe(c.texture);
  if (!classe) return null;
  const a = (dx: number, dy: number, dz: number) => index.get(cle(c.x + dx, c.y + dy, c.z + dz));
  let cotes = 0;
  let monte = 0;
  let descend = 0;
  let coins = 0;
  let toits = 0;
  SIDES.forEach(([dx, dy], i) => {
    const b = 1 << i;
    const cote = a(dx, dy, 0);
    if (cote === classe) cotes |= b;
    if (cote === 'toit') toits |= b;
    if (a(dx, dy, 1) === classe) monte |= b;
    if (a(dx, dy, -1) === classe) descend |= b;
    const [ex, ey] = SIDES[(i + 1) % 4];
    if (a(dx + ex, dy + ey, 1) === classe) coins |= b;
  });
  const dessous = a(0, 0, -1) ?? 'rien';
  return {
    texture: c.texture ?? '',
    classe,
    cotes,
    dessus: a(0, 0, 1) ?? 'rien',
    dessous,
    monte,
    descend,
    coins,
    toits,
    surLeVide: dessous === 'rien' && Boolean(options.surLeVide?.(c.x, c.y, c.z)),
  };
}

/** Un masque de côtés (ou de coins) tourné de `r` quarts de tour dans le sens direct (+x vers +y). */
export function tournerCotes(cotes: number, r: number): number {
  const q = ((r % 4) + 4) % 4;
  return ((cotes << q) | (cotes >> (4 - q))) & 0b1111;
}

/** Un voisinage tourné de `r` quarts de tour (le dessus et le dessous ne tournent pas). */
export function tournerVoisinage(v: Voisinage, r: number): Voisinage {
  return {
    ...v,
    cotes: tournerCotes(v.cotes, r),
    monte: tournerCotes(v.monte, r),
    descend: tournerCotes(v.descend, r),
    coins: tournerCotes(v.coins, r),
    toits: tournerCotes(v.toits, r),
  };
}
