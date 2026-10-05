// La place des lieux dans leur région (GD-9, « Aménager sa région ») : chaque lieu est posé à une place de la grille
// (au pas de `STEP` cases) et tourné d'un nombre de quarts de tour. Son dessin ne bouge pas : il est tiré une fois pour
// toutes à sa place d'origine (son repère, `IslandDef.repere` dans ./map.ts), puis posé là où l'élève l'a mis. Ce fichier
// garde les poses choisies (sans elles, la carte de départ de ./map.ts) et la géométrie d'un quart de tour, sans rien
// importer du monde. Code pur, sans Three.js.
import type { BiomeId } from '../biomes';

/** Le pas de la grille des places, en cases du monde : un lieu, une arrivée, une borne s'y posent. */
export const STEP = 4;

/** Une orientation : de 0 à 3 quarts de tour. */
export type Quarts = 0 | 1 | 2 | 3;

/** Les quatre orientations, dans l'ordre. */
export const ORIENTATIONS: readonly Quarts[] = [0, 1, 2, 3];

/** Une orientation quelconque ramenée de 0 à 3. */
export function quarts(n: number): Quarts {
  return (((Math.round(n) % 4) + 4) % 4) as Quarts;
}

/**
 * La pose d'un lieu : l'origine de son repère dans le monde (le coin de son cœur d'origine 16 × 16, `IslandDef.core`) et
 * son orientation.
 */
export interface PlacePose {
  x: number;
  y: number;
  quarts: Quarts;
}

/**
 * Le milieu du cœur d'un lieu, en cases depuis l'origine de son repère, sur les deux axes : 8 pour un cœur de 16 comme
 * pour un cœur de 20 (de −2 à 18). Un lieu tourne autour de ce point : son cœur, carré, reste en place.
 */
export const CORE_MIDDLE = 8;

/**
 * Une case du repère d'un lieu (x, y relatifs à l'origine de son cœur) tournée de `q` quarts de tour autour du milieu du
 * cœur. Un quart de tour envoie le devant du lieu (y bas, côté caméra) vers l'ouest (x bas), et l'est vers le devant :
 * c'est le sens où la caméra de la vue du lieu tourne de `q × 90°` (`viewYaw`, ./terrain/view.ts).
 */
export function turnCell(x: number, y: number, q: Quarts): { x: number; y: number } {
  const m = CORE_MIDDLE;
  let cx = x;
  let cy = y;
  for (let i = 0; i < q; i++) [cx, cy] = [cy, 2 * m - 1 - cx];
  return { x: cx, y: cy };
}

/** L'inverse de `turnCell` : la case du repère d'un lieu qui, tournée de `q`, tombe en (x, y). */
export function unturnCell(x: number, y: number, q: Quarts): { x: number; y: number } {
  return turnCell(x, y, quarts(4 - q));
}

/** Un point (pas une case : un coin, un milieu) du repère d'un lieu, tourné de `q` quarts de tour autour du milieu du cœur. */
export function turnPoint(x: number, y: number, q: Quarts): { x: number; y: number } {
  const m = CORE_MIDDLE;
  let px = x;
  let py = y;
  for (let i = 0; i < q; i++) [px, py] = [py, 2 * m - px];
  return { x: px, y: py };
}

/** L'inverse de `turnPoint`. */
export function unturnPoint(x: number, y: number, q: Quarts): { x: number; y: number } {
  return turnPoint(x, y, quarts(4 - q));
}

/** Une direction (dx, dy) tournée de `q` quarts de tour, dans le même sens que `turnCell`. */
export function turnDirection(dx: number, dy: number, q: Quarts): { dx: number; dy: number } {
  let a = dx;
  let b = dy;
  for (let i = 0; i < q; i++) [a, b] = [b, -a];
  return { dx: a + 0, dy: b + 0 };
}

/** Un rectangle de cases [x0, x1) × [y0, y1). */
export interface Rectangle {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Un rectangle de cases du repère d'un lieu, tourné de `q` quarts de tour : sa largeur et sa profondeur s'échangent à chaque quart. */
export function turnRectangle(r: Rectangle, q: Quarts): Rectangle {
  const a = turnPoint(r.x0, r.y0, q);
  const b = turnPoint(r.x1, r.y1, q);
  return { x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) };
}

/** Les côtés d'un lieu, dans son repère : devant (y bas, côté caméra), à droite (x haut), derrière, à gauche. */
export type Side = 'devant' | 'droite' | 'derriere' | 'gauche';

/** Les côtés dans l'ordre d'un quart de tour à rebours : tourner un lieu d'un quart fait passer son devant à gauche. */
export const SIDES: readonly Side[] = ['devant', 'droite', 'derriere', 'gauche'];

/** La direction vers le large d'un côté, dans le repère du lieu. */
export const TOWARDS_SEA: Readonly<Record<Side, { dx: number; dy: number }>> = {
  devant: { dx: 0, dy: -1 },
  droite: { dx: 1, dy: 0 },
  derriere: { dx: 0, dy: 1 },
  gauche: { dx: -1, dy: 0 },
};

/** Le côté où passe un côté du repère d'un lieu une fois le lieu tourné de `q` quarts de tour (le devant passe à gauche au premier). */
export function turnedSide(c: Side, q: Quarts): Side {
  const d = turnDirection(TOWARDS_SEA[c].dx, TOWARDS_SEA[c].dy, q);
  return SIDES.find((k) => TOWARDS_SEA[k].dx === d.dx && TOWARDS_SEA[k].dy === d.dy)!;
}

// ---------- Les poses choisies ----------

/** Les poses choisies, lieu par lieu : un lieu absent est à sa place de la carte de départ. */
let poses: ReadonlyMap<BiomeId, PlacePose> = new Map();
let version = 0;
const caches: Map<unknown, unknown>[] = [];

/** La pose choisie d'un lieu, ou `undefined` : il est alors à sa place de la carte de départ (./map.ts). */
export function chosenPose(id: BiomeId): PlacePose | undefined {
  return poses.get(id);
}

/** Un numéro qui change à chaque fois que la disposition change (pour les caches qui lisent les places du monde). */
export function layoutVersion(): number {
  return version;
}

/**
 * Pose les lieux (la disposition d'une sauvegarde, ./savedLayout.ts) ; sans poses, la carte de départ. Ne change rien, et
 * garde les caches, si les poses sont les mêmes.
 */
export function placeIslands(nouvelles: ReadonlyMap<BiomeId, PlacePose> | null): void {
  const n = nouvelles ?? new Map<BiomeId, PlacePose>();
  const pareil =
    n.size === poses.size &&
    [...n].every(([id, p]) => {
      const q = poses.get(id);
      return q !== undefined && q.x === p.x && q.y === p.y && q.quarts === p.quarts;
    });
  if (pareil) return;
  poses = new Map(n);
  version++;
  for (const c of caches) c.clear();
}

/**
 * Une `Map` vidée à chaque changement de disposition : le cache de ce qui se lit dans les places du monde (le large,
 * les liaisons, les cadrages). Ce qui se lit dans le repère d'un lieu (sa terre, son paysage) n'en a pas besoin.
 */
export function layoutCache<K, V>(): Map<K, V> {
  const m = new Map<K, V>();
  caches.push(m as Map<unknown, unknown>);
  return m;
}

// ---------- Les modèles posés sur un lieu ----------

/**
 * Les cubes d'un modèle (un personnage, x et y depuis 0) tournés de `q` quarts de tour dans le même sens qu'un lieu
 * (`turnCell`), ramenés à x et y depuis 0.
 */
export function turnModel<C extends { x: number; y: number }>(cubes: readonly C[], q: Quarts): C[] {
  let out = [...cubes];
  for (let i = 0; i < q; i++) {
    const maxX = Math.max(...out.map((c) => c.x));
    out = out.map((c) => ({ ...c, x: c.y, y: maxX - c.x }));
  }
  return out;
}

/**
 * Un modèle posé sur un lieu (son coin `origine` et ses cubes, dans le monde du lieu posé mais pas tourné), tourné avec
 * le lieu de `q` quarts de tour autour du milieu de son cœur (`coeur` : l'origine du repère du lieu dans le monde) : le
 * coin et les cubes du même modèle, là où le lieu tourné le porte.
 */
export function turnPlacedModel<C extends { x: number; y: number }>(
  coeur: { x: number; y: number },
  origine: { x: number; y: number; z: number },
  cubes: readonly C[],
  q: Quarts,
): { origine: { x: number; y: number; z: number }; cubes: C[] } {
  if (!q || !cubes.length) return { origine, cubes: cubes as C[] };
  const w = Math.max(...cubes.map((c) => c.x)) + 1;
  const d = Math.max(...cubes.map((c) => c.y)) + 1;
  const r = turnRectangle({ x0: origine.x - coeur.x, y0: origine.y - coeur.y, x1: origine.x - coeur.x + w, y1: origine.y - coeur.y + d }, q);
  return { origine: { x: coeur.x + r.x0, y: coeur.y + r.y0, z: origine.z }, cubes: turnModel(cubes, q) };
}
