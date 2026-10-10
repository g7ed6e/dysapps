// Où va le bonhomme quand on touche le sol d'une île : la case touchée si l'on peut y marcher depuis là où il est, sinon
// la case accessible de cette île la plus proche du doigt. Code pur, sans Three.js : la 3D donne la case touchée, la page
// trace ensuite le chemin (grid.ts, `raccord` ou `trajet`). Aucune taille en dur : l'étendue de l'île vient de la
// carte (map.ts, `landBox`, `isLand`), et la recherche reste dans cette étendue et autour du bonhomme.
import type { Point } from './layout';
import { isLandInWorld, landBox, type IslandDef } from './map';
import type { WalkGround } from './paths';

/**
 * Autour de l'étendue de l'île et du bonhomme, où l'on cherche encore un passage, en part de la plus grande dimension
 * de l'étendue de l'île visée (chaque île a la sienne) : de quoi contourner un rivage ou traverser l'ouvrage où il se
 * trouve, sans faire le tour de l'archipel.
 */
const MARGE_DE_RECHERCHE = 0.3;

/** La marge de recherche autour de l'île `ile`, en cases (voir `MARGE_DE_RECHERCHE`). */
export function margeDeRecherche(ile: IslandDef): number {
  const box = landBox(ile);
  return Math.ceil(Math.max(box.x1 - box.x0, box.y1 - box.y0) * MARGE_DE_RECHERCHE);
}

const key = (x: number, y: number) => `${x},${y}`;

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

/** La case visée par un toucher : où le bonhomme va, et si c'est la case même que le doigt a touchée. */
export interface Arrivee {
  case: Point;
  touchee: boolean;
}

/**
 * La case où va le bonhomme quand on touche le sol de l'île `ile` en `touche` (une case du monde), en partant de
 * `depuis` (ses pieds ; un point en route peut être entre deux cases) : la case touchée si elle est sur l'île et qu'on y
 * va à pied (mêmes pas que paths.ts, `walkPath` : une marche d'un bloc, deux au départ, pas de coin d'arbre coupé),
 * sinon la case de l'île où l'on va à pied la plus proche du doigt. `null` si le toucher tombe hors de l'étendue de
 * l'île, ou si rien n'y est accessible : la page envoie alors le bonhomme à sa place habituelle.
 */
export function caseDArrivee(ground: WalkGround, ile: IslandDef, depuis: Point, touche: { x: number; y: number }): Arrivee | null {
  const box = landBox(ile);
  const tx = Math.floor(touche.x);
  const ty = Math.floor(touche.y);
  if (tx < box.x0 || tx >= box.x1 || ty < box.y0 || ty >= box.y1) return null;
  const sx = Math.round(depuis.x);
  const sy = Math.round(depuis.y);
  // Le bonhomme est déjà sur la case touchée : il y reste.
  if (sx === tx && sy === ty && isLandInWorld(ile, sx, sy)) return { case: { x: sx, y: sy, z: depuis.z }, touchee: true };
  const marge = margeDeRecherche(ile);
  const minX = Math.min(box.x0, sx) - marge;
  const maxX = Math.max(box.x1, sx) + marge;
  const minY = Math.min(box.y0, sy) - marge;
  const maxY = Math.max(box.y1, sy) + marge;
  // Tout se passe dans ce cadre (hors de lui, aucune case n'est libre) : chaque case y a son rang, et le sol de chaque
  // case ne se lit qu'une fois (`feetAt` est demandé jusqu'à vingt-quatre fois par case).
  const largeur = maxY - minY + 1;
  const rang = (x: number, y: number) => (x - minX) * largeur + (y - minY);
  const n = (maxX - minX + 1) * largeur;
  const lus = new Float64Array(n).fill(NaN);
  const feetAt = (x: number, y: number): number | undefined => {
    if (x === sx && y === sy) return depuis.z;
    if (x < minX || x > maxX || y < minY || y > maxY) return undefined;
    const i = rang(x, y);
    let z = lus[i];
    if (Number.isNaN(z)) lus[i] = z = ground.feet.get(key(x, y)) ?? Infinity;
    return z === Infinity ? undefined : z;
  };
  // Les cases où l'on va à pied depuis le bonhomme (en largeur d'abord : à distance égale du doigt, la plus proche de lui).
  const vues = new Uint8Array(n);
  vues[rang(sx, sy)] = 1;
  // La file : le rang de chaque case, dans l'ordre où elle est vue (chaque case n'y entre qu'une fois).
  const file = new Int32Array(n);
  file[0] = rang(sx, sy);
  let fin = 1;
  let best: { x: number; y: number; d: number } | null = null;
  for (let i = 0; i < fin; i++) {
    const cx = minX + Math.floor(file[i] / largeur);
    const cy = minY + (file[i] % largeur);
    const cz = feetAt(cx, cy)!;
    const depart = cx === sx && cy === sy;
    // Une case plus proche du doigt que la meilleure (seule à pouvoir la remplacer), sur l'île et pas sur un ouvrage.
    const d = (cx - tx) ** 2 + (cy - ty) ** 2;
    if (!depart && (!best || d < best.d) && isLandInWorld(ile, cx, cy) && !ground.bridge.has(key(cx, cy))) {
      best = { x: cx, y: cy, d };
      if (d === 0) break;
    }
    const reach = depart ? 2 : 1;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      const nz = feetAt(nx, ny);
      if (nz === undefined || Math.abs(nz - cz) > reach) continue;
      const k = rang(nx, ny);
      if (vues[k]) continue;
      if (dx && dy) {
        const a = feetAt(cx + dx, cy);
        const b = feetAt(cx, cy + dy);
        if (a === undefined || b === undefined || Math.abs(a - cz) > reach || Math.abs(b - cz) > reach) continue;
      }
      vues[k] = 1;
      file[fin++] = k;
    }
  }
  if (!best) return null;
  return { case: { x: best.x, y: best.y, z: ground.feet.get(key(best.x, best.y))! }, touchee: best.d === 0 };
}

/** Le doigt est tombé sur l'eau (ou la lave) : en marche, un tel toucher le fait arriver tout de suite. */
export function toucheLEau(ground: WalkGround, touche: { x: number; y: number }): boolean {
  return ground.liquid.has(key(Math.floor(touche.x), Math.floor(touche.y)));
}

/**
 * Ce qui reste d'un trajet depuis `ici`, un point en route (entre deux de ses points) : `ici`, puis les points qui
 * suivent le morceau le plus proche. Pour changer de but en chemin quand on ne peut pas y aller tout droit.
 */
export function resteDuTrajet(route: Point[], ici: Point): Point[] {
  if (route.length < 2) return [ici, ...route.slice(-1)];
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const lx = b.x - a.x;
    const ly = b.y - a.y;
    const l2 = lx * lx + ly * ly;
    const t = l2 ? Math.max(0, Math.min(1, ((ici.x - a.x) * lx + (ici.y - a.y) * ly) / l2)) : 0;
    const d = (a.x + t * lx - ici.x) ** 2 + (a.y + t * ly - ici.y) ** 2 + (a.z + t * (b.z - a.z) - ici.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return [ici, ...route.slice(best + 1)];
}
