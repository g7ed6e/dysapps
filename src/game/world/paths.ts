// Les chemins du bonhomme sur une île : de son point de départ au premier ouvrage, d'un ouvrage au suivant, du dernier
// ouvrage à sa place. Il marche sur le sol (jamais sur l'eau ni la lave), ne monte ou ne descend qu'un bloc à la fois,
// contourne les arbres, les rochers, les bornes, les maisons et les créatures. Code pur : la grille vient des cubes du
// monde, le chemin est un plus court chemin (huit directions), redressé en lignes droites là où le sol est plat et libre.
import type { VoxelCube } from './cube';
import { decorPose } from './decor';
import type { BiomeId } from '../biomes';

/** Une case du monde. */
export interface Cell {
  x: number;
  y: number;
  z: number;
}

/** Une créature (ou un Gardien) à sa place : ses cubes, sa case, et comment elle se promène. */
export interface CreaturePlacement {
  id: BiomeId;
  cubes: VoxelCube[];
  origin: Cell;
  /** Une créature se promène ; un Gardien reste à sa place, sur son île. */
  kind?: 'creature' | 'guardian';
  still?: boolean;
  /** Les pas possibles depuis sa place (sinon ceux par défaut). */
  steps?: [number, number][];
  /** Un Gardien vaincu (en statue de pierre, ou sa sentinelle rallumée) : il ne porte plus de signe (world/affordance.ts). */
  beaten?: boolean;
  /** L'échelle de son dessin autour de son pied (un Gardien de Blocland : 0,5, GD-11) ; 1 sans elle. */
  echelle?: number;
  /** Les cases qu'il occupe au sol, à la place de celles de ses cubes (le carré d'un Gardien, GD-11). */
  cases?: { x: number; y: number }[];
}

/** Le décor qu'on enjambe (bas, au ras du sol) ; le reste barre le passage. */
export const LOW: ReadonlySet<string> = new Set(['fleur', 'champignon', 'roseau']);

/** Le genre d'un élément de décor d'après son nom (« foret/cœur:arbre@8,2 » : un arbre). */
function decorKind(decor: string): string {
  const name = decor.slice(decor.lastIndexOf('/') + 1).replace(/^cœur:/, '');
  const at = name.indexOf('@');
  return at < 0 ? name : name.slice(0, at);
}

/** Le sol où l'on peut marcher : la hauteur des pieds de chaque case libre (le dessus du bloc le plus haut, + 1). */
export interface WalkGround {
  feet: Map<string, number>;
  /** Les colonnes dont le dessus est de l'eau ou de la lave (on n'y marche pas). */
  liquid: Set<string>;
  /** Les colonnes d'un ouvrage (pont, gué…) : on y passe, on ne s'y arrête pas quand on touche le sol. */
  bridge: Set<string>;
}

const key = (x: number, y: number) => `${x},${y}`;

/**
 * La grille de marche d'un archipel : le haut de chaque colonne (sans le décor ni les fantômes), moins l'eau, la lave,
 * les bornes de mission, les cases où un décor haut occupe la place du corps (tronc, feuillage bas, rocher), celles des
 * créatures et les cases `reservees` (l'emprise des lieux du village, la place d'une travée à venir comprise : le
 * bonhomme ne s'arrête pas là où une travée arrivera, terrain.ts, `casesDesLieux`).
 */
export function walkGround(cubes: VoxelCube[], creatures: CreaturePlacement[] = [], reservees: Iterable<{ x: number; y: number }> = []): WalkGround {
  const top = new Map<string, { z: number; liquid: boolean }>();
  for (const c of cubes) {
    if (c.ghost || decorPose(c.decor)) continue;
    const k = key(c.x, c.y);
    const cur = top.get(k);
    if (!cur || c.z > cur.z) top.set(k, { z: c.z, liquid: c.texture === 'eau' || c.texture === 'lave' });
  }
  const blocked = new Set<string>();
  const bridge = new Set<string>();
  for (const c of cubes) if (c.bridge && !c.ghost) bridge.add(key(c.x, c.y));
  // Une borne de mission, même basse, ne se piétine pas ; l'école non plus.
  for (const c of cubes) if ((c.quest || c.place) && !c.ghost) blocked.add(key(c.x, c.y));
  for (const c of cubes) {
    if (c.ghost || !decorPose(c.decor) || LOW.has(decorKind(c.decor!))) continue;
    const k = key(c.x, c.y);
    const ground = top.get(k);
    // Le corps occupe les deux blocs au-dessus du sol : un feuillage plus haut laisse passer dessous.
    if (!ground || c.z <= ground.z + 2) blocked.add(k);
  }
  for (const r of reservees) blocked.add(key(r.x, r.y));
  for (const cr of creatures) {
    if (cr.cases) {
      for (const c of cr.cases) blocked.add(key(c.x, c.y));
      continue;
    }
    const steps: [number, number][] = [[0, 0], ...(cr.steps ?? [])];
    for (const [sx, sy] of steps)
      for (const c of cr.cubes) blocked.add(key(Math.floor(cr.origin.x + sx + c.x), Math.floor(cr.origin.y + sy + c.y)));
  }
  const feet = new Map<string, number>();
  const liquid = new Set<string>();
  for (const [k, t] of top) {
    if (t.liquid) liquid.add(k);
    else if (!blocked.has(k)) feet.set(k, t.z + 1);
  }
  return { feet, liquid, bridge };
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Le plus loin qu'on cherche autour des deux bouts (en cases) : un chemin reste sur l'île, sans faire le tour du monde. */
const MARGIN = 24;

/**
 * Le chemin à pied de `from` à `to` (x, y, z des pieds), ou `null` s'il n'y en a pas : les deux bouts sont toujours
 * acceptés (le pied d'un ouvrage, la place du bonhomme), même si la grille ne les connaît pas, et l'on y descend ou
 * monte de deux blocs au plus. Diagonale permise seulement si les deux cases qu'elle frôle sont libres (on ne coupe
 * pas le coin d'un arbre).
 */
export function walkPath(ground: WalkGround, from: Cell, to: Cell): Cell[] | null {
  const sx = Math.round(from.x);
  const sy = Math.round(from.y);
  const tx = Math.round(to.x);
  const ty = Math.round(to.y);
  if (sx === tx && sy === ty) return [from, to];
  const minX = Math.min(sx, tx) - MARGIN;
  const maxX = Math.max(sx, tx) + MARGIN;
  const minY = Math.min(sy, ty) - MARGIN;
  const maxY = Math.max(sy, ty) + MARGIN;
  // Tout se passe dans ce cadre (hors de lui, aucune case n'est libre) : chaque case y a son rang, et le sol de chaque
  // case ne se lit qu'une fois (`feetAt` est demandé jusqu'à vingt-quatre fois par case).
  const largeur = maxY - minY + 1;
  const rang = (x: number, y: number) => (x - minX) * largeur + (y - minY);
  const n = (maxX - minX + 1) * largeur;
  const lus = new Float64Array(n).fill(NaN);
  const feetAt = (x: number, y: number): number | undefined => {
    if (x === sx && y === sy) return from.z;
    if (x === tx && y === ty) return to.z;
    if (x < minX || x > maxX || y < minY || y > maxY) return undefined;
    const i = rang(x, y);
    let z = lus[i];
    if (Number.isNaN(z)) lus[i] = z = ground.feet.get(key(x, y)) ?? Infinity;
    return z === Infinity ? undefined : z;
  };
  // A* : distance parcourue + distance à vol d'oiseau (octile).
  const h = (x: number, y: number) => {
    const dx = Math.abs(x - tx);
    const dy = Math.abs(y - ty);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  const g = new Float64Array(n).fill(Infinity);
  g[rang(sx, sy)] = 0;
  const prev = new Int32Array(n).fill(-1);
  const open: { x: number; y: number; f: number }[] = [{ x: sx, y: sy, f: h(sx, sy) }];
  const done = new Uint8Array(n);
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
    const cur = open.splice(best, 1)[0];
    const ck = rang(cur.x, cur.y);
    if (done[ck]) continue;
    done[ck] = 1;
    if (cur.x === tx && cur.y === ty) break;
    const cz = feetAt(cur.x, cur.y)!;
    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nz = feetAt(nx, ny);
      // Au pied d'un ouvrage (une pierre de gué posée sur le sol, un tablier), on descend ou monte d'une marche de plus.
      const reach = (cur.x === sx && cur.y === sy) || (nx === tx && ny === ty) ? 2 : 1;
      if (nz === undefined || Math.abs(nz - cz) > reach) continue;
      if (dx && dy) {
        const a = feetAt(cur.x + dx, cur.y);
        const b = feetAt(cur.x, cur.y + dy);
        if (a === undefined || b === undefined || Math.abs(a - cz) > reach || Math.abs(b - cz) > reach) continue;
      }
      const nk = rang(nx, ny);
      const cost = g[ck] + (dx && dy ? Math.SQRT2 : 1) + (nz !== cz ? 0.5 : 0);
      if (cost < g[nk]) {
        g[nk] = cost;
        prev[nk] = ck;
        open.push({ x: nx, y: ny, f: cost + h(nx, ny) });
      }
    }
  }
  const end = rang(tx, ty);
  if (prev[end] < 0) return null;
  const cells: Cell[] = [];
  for (let k = end; k >= 0; k = prev[k]) {
    const x = minX + Math.floor(k / largeur);
    const y = minY + (k % largeur);
    cells.unshift({ x, y, z: feetAt(x, y)! });
  }
  cells[0] = from;
  cells[cells.length - 1] = to;
  return straighten(cells, feetAt);
}

/**
 * Redresse un chemin en escalier : on saute d'un point au plus lointain qu'on voit en ligne droite, tant que toutes les
 * cases traversées sont libres et à la même hauteur (une marche garde ses points : le bonhomme la monte sur place).
 */
function straighten(cells: Cell[], feetAt: (x: number, y: number) => number | undefined): Cell[] {
  const out = [cells[0]];
  let i = 0;
  while (i < cells.length - 1) {
    let j = i + 1;
    for (let k = cells.length - 1; k > i + 1; k--) {
      if (clear(cells[i], cells[k], feetAt)) {
        j = k;
        break;
      }
    }
    out.push(cells[j]);
    i = j;
  }
  return out;
}

/** Les cases que le corps frôle autour d'un point de la ligne (un tiers de case de chaque côté). */
const FROLEES: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.3, 0.3],
  [-0.3, -0.3],
  [0.3, -0.3],
  [-0.3, 0.3],
];

/**
 * La ligne droite de `a` à `b` ne passe que par des cases libres, à la hauteur de `a` (bords compris, de près). Deux
 * points voisins de la ligne frôlent le plus souvent les mêmes cases : une case déjà vue au point d'avant (et libre,
 * sans quoi on serait sorti) ne se relit pas.
 */
function clear(a: Cell, b: Cell, feetAt: (x: number, y: number) => number | undefined): boolean {
  if (a.z !== b.z) return false;
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 3);
  const avant = new Float64Array(FROLEES.length * 2).fill(NaN);
  for (let s = 0; s <= n; s++) {
    const t = s / n;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    for (let o = 0; o < FROLEES.length; o++) {
      const cx = Math.round(x + FROLEES[o][0]);
      const cy = Math.round(y + FROLEES[o][1]);
      if (cx === avant[2 * o] && cy === avant[2 * o + 1]) continue;
      if (feetAt(cx, cy) !== a.z) return false;
      avant[2 * o] = cx;
      avant[2 * o + 1] = cy;
    }
  }
  return true;
}
