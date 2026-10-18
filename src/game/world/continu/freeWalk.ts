// Le déplacement libre (GD-20, « Le déplacement libre », lot 1 « Toucher le sol » ; choix du mainteneur du 18 octobre
// 2026, piste 2) : Kéo quitte les chemins. Une grille de ce qui se marche couvre le monde ; un toucher sur le sol y mène
// Kéo au plus court, en contournant l'eau, les bras de mer, les pentes raides, les lieux, l'Escale, les troncs et les
// rochers ; un endroit où l'on ne marche pas le mène au plus proche où l'on marche. Les chemins restent préférés (ils
// coûtent moins), si bien qu'un long trajet les prend. La terre de chaque case vient des chemins : une terre fermée ne
// se marche pas, et un pont pas encore rebâti arrête Kéo sur sa culée, comme sur le réseau. Code pur.
import { KEO_STOP, bridgeSite } from './bridges';
import { boundsOf } from './facets';
import { floraOf, type FloraItem } from './flora';
import { distance, type Vec2 } from './geometry';
import { LANDS, LINKED_LANDS, NODE_LANDS, START_LAND, bridgeEdge, type LandId, type LinkedLand } from './lands';
import { pathNode } from './paths';
import { PATH_EDGES, PLACES, PORT, PORT_PAVING, TERRAIN, portFloor } from './plan6e';
import { modelOfPlace } from './places';
import { heightOnMesh, type HeightField } from './terrain';

/**
 * Les réglages de la grille : le pas d'une case (la moitié de celui du terrain) ; le sol le plus bas où l'on marche (au-
 * dessus, l'écume et l'eau) ; la pente la plus raide (1 à 45°) ; le rayon de Kéo, ajouté à celui de chaque obstacle ;
 * la demi-largeur où un chemin se marche, et ce qu'y coûte un pas (un pas d'herbe coûte 1) ; la distance où l'on
 * cherche le plus proche endroit où l'on marche.
 */
export const FREE_WALK = { cell: TERRAIN.step / 2, shore: 0.22, slope: 0.85, keo: 0.35, path: 1.0, pathCost: 0.6, search: 40 } as const;

/** Le rayon d'un obstacle de la végétation, rapporté à sa taille : le tronc d'un pin et son feuillage bas, un palmier, un buisson, un rocher. */
const FLORA_RADIUS: Readonly<Record<FloraItem['kind'], number>> = { pin: 0.45, palmier: 0.3, buisson: 0.55, rocher: 0.6 };

/** Les bâtiments de l'Escale, dans le repère du Port : derrière la place, de la galerie au lieu d'assemblage (l'eau au-delà). */
const PORT_BUILDINGS = { x0: PORT_PAVING.quay.x1 + 0.4, x1: PORT_PAVING.square.x1 + 0.5, z0: -8, z1: PORT_PAVING.square.z0 - 0.1 } as const;

/** Une case : bloquée, d'herbe, ou de chemin. */
const BLOCKED = 0;
const GROUND = 1;
const PATH = 2;

/** La grille de ce qui se marche : son coin, son pas, ses cases, la sorte de chaque case et sa terre (son rang dans `LANDS`, ou −1). */
export interface WalkGrid {
  minX: number;
  minZ: number;
  cell: number;
  nx: number;
  nz: number;
  kind: Uint8Array;
  land: Int8Array;
}

const LAND_INDEX = new Map<LandId, number>(LANDS.map((l, i) => [l.id, i]));

/** La distance d'un point au segment de `a` à `b`, et sa part le long de lui. */
function onSegment(p: Vec2, a: Vec2, b: Vec2): { d: number; t: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
  return { d: Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t), t };
}

let gridCache: WalkGrid | null = null;

/** Tire la grille de ce qui se marche (une fois : le plan ne change pas ; seules les terres fermées changent, à la lecture). */
export function buildWalkGrid(field: HeightField): WalkGrid {
  if (gridCache) return gridCache;
  const { cell } = FREE_WALK;
  const minX = TERRAIN.minX;
  const minZ = TERRAIN.minZ;
  const nx = Math.ceil((TERRAIN.tilesX * TERRAIN.tileCells * TERRAIN.step) / cell);
  const nz = Math.ceil((TERRAIN.tilesZ * TERRAIN.tileCells * TERRAIN.step) / cell);
  const kind = new Uint8Array(nx * nz);
  const land = new Int8Array(nx * nz).fill(-1);
  const centerOf = (i: number, j: number): Vec2 => ({ x: minX + (i + 0.5) * cell, z: minZ + (j + 0.5) * cell });

  // Le sol : assez haut au-dessus de l'eau, pas trop raide, ou la pierre de l'Escale.
  const e = cell / 2;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const p = centerOf(i, j);
      if (portFloor(p.x, p.z) !== null) {
        kind[j * nx + i] = GROUND;
        continue;
      }
      const h = heightOnMesh(field, p.x, p.z);
      if (h < FREE_WALK.shore) continue;
      const gx = (heightOnMesh(field, p.x + e, p.z) - heightOnMesh(field, p.x - e, p.z)) / (2 * e);
      const gz = (heightOnMesh(field, p.x, p.z + e) - heightOnMesh(field, p.x, p.z - e)) / (2 * e);
      if (Math.hypot(gx, gz) <= FREE_WALK.slope) kind[j * nx + i] = GROUND;
    }

  // Ce qui bloque : un disque (la végétation), ou une boîte tournée (un lieu, les bâtiments de l'Escale).
  const blockDisk = (c: Vec2, r: number) => {
    const i0 = Math.floor((c.x - r - minX) / cell);
    const i1 = Math.floor((c.x + r - minX) / cell);
    const j0 = Math.floor((c.z - r - minZ) / cell);
    const j1 = Math.floor((c.z + r - minZ) / cell);
    for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++) if (distance(centerOf(i, j), c) <= r) kind[j * nx + i] = BLOCKED;
  };
  const blockBox = (center: Vec2, reach: number, toLocal: (p: Vec2) => Vec2, box: { x0: number; x1: number; z0: number; z1: number }) => {
    // Seulement les cases à moins de `reach` du centre (la boîte y tient).
    const i0 = Math.max(0, Math.floor((center.x - reach - minX) / cell));
    const i1 = Math.min(nx - 1, Math.floor((center.x + reach - minX) / cell));
    const j0 = Math.max(0, Math.floor((center.z - reach - minZ) / cell));
    const j1 = Math.min(nz - 1, Math.floor((center.z + reach - minZ) / cell));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const l = toLocal(centerOf(i, j));
        if (l.x >= box.x0 && l.x <= box.x1 && l.z >= box.z0 && l.z <= box.z1) kind[j * nx + i] = BLOCKED;
      }
  };
  for (let tz = 0; tz < TERRAIN.tilesZ; tz++)
    for (let tx = 0; tx < TERRAIN.tilesX; tx++) for (const it of floraOf(field, tx, tz)) blockDisk(it, FLORA_RADIUS[it.kind] * it.scale + FREE_WALK.keo);
  for (const pl of PLACES) {
    const b = boundsOf(modelOfPlace(pl.id).facets);
    const c = Math.cos(pl.yaw);
    const s = Math.sin(pl.yaw);
    // Le repère du lieu : le monde tourné de son quart de tour autour de son centre (le modèle tourne de `yaw`).
    const toLocal = (p: Vec2): Vec2 => {
      const dx = p.x - pl.center.x;
      const dz = p.z - pl.center.z;
      return { x: dx * c - dz * s, z: dx * s + dz * c };
    };
    const k = FREE_WALK.keo;
    blockBox(pl.center, 16, toLocal, { x0: b.min[0] - k, x1: b.max[0] + k, z0: b.min[2] - k, z1: b.max[2] + k });
  }
  blockBox(PORT.toWorld((PORT_BUILDINGS.x0 + PORT_BUILDINGS.x1) / 2, (PORT_BUILDINGS.z0 + PORT_BUILDINGS.z1) / 2), 30, PORT.toLocal, PORT_BUILDINGS);

  // Les chemins, toujours marchés (la digue, les pontons, les portes des lieux, les culées), et leur terre ; sur la
  // liaison d'un pont, la part au-delà de l'arrêt de Kéo est de la terre du pont (fermée tant qu'il n'est pas rebâti).
  const bridgeOf = new Map<number, LinkedLand>(LINKED_LANDS.map((l) => [bridgeEdge(l), l]));
  // Les cases d'un pont : elles ne donnent pas leur terre à l'herbe voisine (la rive d'en face la prendrait).
  const onBridge = new Uint8Array(nx * nz);
  PATH_EDGES.forEach(([ia, ib], edge) => {
    const a = pathNode(ia).at;
    const b = pathNode(ib).at;
    const r = FREE_WALK.path;
    const bridge = bridgeOf.get(edge);
    const site = bridge ? bridgeSite(bridge) : null;
    const i0 = Math.floor((Math.min(a.x, b.x) - r - minX) / cell);
    const i1 = Math.floor((Math.max(a.x, b.x) + r - minX) / cell);
    const j0 = Math.floor((Math.min(a.z, b.z) - r - minZ) / cell);
    const j1 = Math.floor((Math.max(a.z, b.z) + r - minZ) / cell);
    for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++) {
        const { d, t } = onSegment(centerOf(i, j), a, b);
        if (d > r) continue;
        const k = j * nx + i;
        let l: LandId;
        if (site) {
          // Sur un pont : du côté ouvert jusqu'à l'arrêt de Kéo, sa terre d'avant ; au-delà, la terre du pont.
          const fromNear = site.nearEnd === 0 ? t : 1 - t;
          const beyond = fromNear * site.length > site.water[0] - KEO_STOP + 1e-6;
          l = beyond ? site.land : (NODE_LANDS.get(PATH_EDGES[edge][site.nearEnd]) ?? START_LAND);
        } else l = NODE_LANDS.get(t < 0.5 ? ia : ib) ?? START_LAND;
        // Une case déjà prise par un chemin d'une autre terre garde la sienne (un croisement près d'un pont).
        if (kind[k] === PATH && land[k] >= 0 && land[k] !== LAND_INDEX.get(l)) continue;
        kind[k] = PATH;
        land[k] = LAND_INDEX.get(l)!;
        onBridge[k] = site ? 1 : 0;
      }
  });

  // La terre du reste : de proche en proche depuis les chemins, sans passer par une case de pont (sa terre est à part).
  const queue: number[] = [];
  for (let k = 0; k < kind.length; k++) if (kind[k] === PATH && !onBridge[k]) queue.push(k);
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q];
    const i = k % nx;
    const j = (k - i) / nx;
    for (const [di, dj] of STEPS4) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
      const n = nj * nx + ni;
      if (kind[n] !== GROUND || land[n] >= 0) continue;
      land[n] = land[k];
      queue.push(n);
    }
  }
  // Ce qu'aucun chemin n'atteint (un îlot, un replat isolé par les pentes) ne se marche pas.
  for (let k = 0; k < kind.length; k++) if (land[k] < 0) kind[k] = BLOCKED;
  gridCache = { minX, minZ, cell, nx, nz, kind, land };
  return gridCache;
}

const STEPS4: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const STEPS8: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** Les terres où l'on ne marche pas (leurs rangs), d'une liste de terres fermées. */
const closedMask = (closed: readonly LinkedLand[]): number => closed.reduce((m, l) => m | (1 << LAND_INDEX.get(l)!), 0);

/** La case sous un point, ou −1 hors de la grille. */
export function cellOf(g: WalkGrid, p: Vec2): number {
  const i = Math.floor((p.x - g.minX) / g.cell);
  const j = Math.floor((p.z - g.minZ) / g.cell);
  return i < 0 || j < 0 || i >= g.nx || j >= g.nz ? -1 : j * g.nx + i;
}

const centerOfCell = (g: WalkGrid, k: number): Vec2 => {
  const i = k % g.nx;
  return { x: g.minX + (i + 0.5) * g.cell, z: g.minZ + ((k - i) / g.nx + 0.5) * g.cell };
};

/** Une case se marche-t-elle, les terres `mask` fermées ? */
const walkable = (g: WalkGrid, k: number, mask: number): boolean => k >= 0 && g.kind[k] !== BLOCKED && !(mask & (1 << g.land[k]));

/** Le point se marche-t-il, les terres `closed` fermées ? */
export function isWalkable(g: WalkGrid, p: Vec2, closed: readonly LinkedLand[]): boolean {
  return walkable(g, cellOf(g, p), closedMask(closed));
}

/** Le point sur un chemin ? (Kéo y suit alors le réseau, comme avant.) */
export function onPathCell(g: WalkGrid, p: Vec2): boolean {
  const k = cellOf(g, p);
  return k >= 0 && g.kind[k] === PATH;
}

/**
 * Le plus proche endroit où l'on marche autour de `p`, les terres `closed` fermées : le point lui-même s'il se marche,
 * sinon le centre de la case marchable la plus proche, à `FREE_WALK.search` unités au plus ; rien au-delà.
 */
export function nearestWalkable(g: WalkGrid, p: Vec2, closed: readonly LinkedLand[]): Vec2 | null {
  const mask = closedMask(closed);
  const k0 = cellOf(g, p);
  if (walkable(g, k0, mask)) return p;
  const i0 = Math.floor((p.x - g.minX) / g.cell);
  const j0 = Math.floor((p.z - g.minZ) / g.cell);
  const rings = Math.ceil(FREE_WALK.search / g.cell);
  let best: Vec2 | null = null;
  let bestD = Infinity;
  for (let r = 1; r <= rings; r++) {
    // Un anneau plus loin que le meilleur trouvé ne peut pas faire mieux.
    if ((r - 1) * g.cell > bestD) break;
    for (let j = j0 - r; j <= j0 + r; j++)
      for (let i = i0 - r; i <= i0 + r; i++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || i < 0 || j < 0 || i >= g.nx || j >= g.nz) continue;
        const k = j * g.nx + i;
        if (!walkable(g, k, mask)) continue;
        const c = centerOfCell(g, k);
        const d = distance(c, p);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
  }
  return best;
}

/** Ce que coûte un pas sur une case : moins sur un chemin. */
const stepCost = (g: WalkGrid, k: number) => (g.kind[k] === PATH ? FREE_WALK.pathCost : 1);

/**
 * La ligne de `a` à `b` se marche-t-elle, et ce qu'elle coûte (les cases traversées, au pas d'une demi-case) ; `Infinity`
 * si elle passe par une case où l'on ne marche pas.
 */
function lineCost(g: WalkGrid, a: Vec2, b: Vec2, mask: number): number {
  const len = distance(a, b);
  const n = Math.max(1, Math.ceil(len / (g.cell / 2)));
  let cost = 0;
  for (let s = 0; s <= n; s++) {
    const p = { x: a.x + ((b.x - a.x) * s) / n, z: a.z + ((b.z - a.z) * s) / n };
    const k = cellOf(g, p);
    if (!walkable(g, k, mask)) return Infinity;
    if (s > 0) cost += (stepCost(g, k) * len) / n;
  }
  return cost;
}

/**
 * Le trajet libre de `from` à `to`, les terres `closed` fermées (A* sur la grille, en huit directions, sans couper un
 * coin bloqué ; puis lissé : deux points se rejoignent en ligne droite si la ligne se marche et ne coûte pas plus que le
 * détour, si bien qu'un chemin proche reste pris). Les points où Kéo tourne, `from` et `to` compris ; rien si `to` ne
 * s'atteint pas (il doit se marcher : `nearestWalkable` d'abord).
 */
export function freeRoute(g: WalkGrid, from: Vec2, to: Vec2, closed: readonly LinkedLand[]): Vec2[] | null {
  const mask = closedMask(closed);
  let start = cellOf(g, from);
  const goal = cellOf(g, to);
  if (!walkable(g, goal, mask)) return null;
  // Kéo hors de la grille marchable (au bord d'un obstacle) : il part de la case marchable la plus proche.
  if (!walkable(g, start, mask)) {
    const near = nearestWalkable(g, from, closed);
    if (!near) return null;
    start = cellOf(g, near);
  }
  if (start === goal) return [from, to];
  const n = g.nx * g.nz;
  const cost = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closedSet = new Uint8Array(n);
  const goalC = centerOfCell(g, goal);
  const h = (k: number) => {
    const c = centerOfCell(g, k);
    return distance(c, goalC) * FREE_WALK.pathCost;
  };
  const heap = new MinHeap();
  cost[start] = 0;
  heap.push(start, h(start));
  while (heap.size) {
    const k = heap.pop();
    if (k === goal) break;
    if (closedSet[k]) continue;
    closedSet[k] = 1;
    const i = k % g.nx;
    const j = (k - i) / g.nx;
    for (const [di, dj, len] of STEPS8) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= g.nx || nj >= g.nz) continue;
      const m = nj * g.nx + ni;
      if (closedSet[m] || !walkable(g, m, mask)) continue;
      // En diagonale, les deux cases voisines doivent se marcher (on ne passe pas entre deux troncs).
      if (di && dj && (!walkable(g, j * g.nx + ni, mask) || !walkable(g, nj * g.nx + i, mask))) continue;
      const c = cost[k] + len * g.cell * (stepCost(g, k) + stepCost(g, m)) * 0.5;
      if (c < cost[m]) {
        cost[m] = c;
        came[m] = k;
        heap.push(m, c + h(m));
      }
    }
  }
  if (came[goal] < 0) return null;
  const cells: number[] = [];
  for (let k = goal; k !== start; k = came[k]) cells.push(k);
  cells.push(start);
  cells.reverse();
  const points = cells.map((k) => centerOfCell(g, k));
  points[0] = walkable(g, cellOf(g, from), mask) ? from : points[0];
  points[points.length - 1] = to;
  const costs = cells.map((k) => cost[k]);
  // Le lissage : depuis chaque point gardé, le plus loin qu'on rejoint en ligne droite sans payer plus que le détour.
  const route: Vec2[] = [points[0]];
  if (points[0] !== from) route.unshift(from);
  let i = 0;
  while (i < points.length - 1) {
    let best = i + 1;
    for (let j = points.length - 1; j > i + 1; j--) {
      if (lineCost(g, points[i], points[j], mask) <= costs[j] - costs[i] + 1e-3) {
        best = j;
        break;
      }
    }
    route.push(points[best]);
    i = best;
  }
  return route;
}

/** Un tas binaire de cases par priorité croissante (A*). */
class MinHeap {
  private keys: number[] = [];
  private prios: number[] = [];
  get size() {
    return this.keys.length;
  }
  push(key: number, prio: number) {
    const { keys, prios } = this;
    let i = keys.length;
    keys.push(key);
    prios.push(prio);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (prios[p] <= prios[i]) break;
      [keys[p], keys[i]] = [keys[i], keys[p]];
      [prios[p], prios[i]] = [prios[i], prios[p]];
      i = p;
    }
  }
  pop(): number {
    const { keys, prios } = this;
    const top = keys[0];
    const lastK = keys.pop()!;
    const lastP = prios.pop()!;
    if (keys.length) {
      keys[0] = lastK;
      prios[0] = lastP;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < keys.length && prios[l] < prios[m]) m = l;
        if (r < keys.length && prios[r] < prios[m]) m = r;
        if (m === i) break;
        [keys[m], keys[i]] = [keys[i], keys[m]];
        [prios[m], prios[i]] = [prios[i], prios[m]];
        i = m;
      }
    }
    return top;
  }
}
