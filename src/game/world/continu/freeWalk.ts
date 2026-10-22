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
import { bridgeEdge, linkedLands, nodeLands, startLandOf, type LandId, type LinkedLand } from './lands';
import { planFor, type LevelPlan } from './levelPlan';
import { pathNode } from './paths';
import { NETWORK_3E } from './paths3e';
import { NETWORK_4E } from './paths4e';
import { NETWORK_5E } from './paths5e';
import { FAILLE_BLOCKED } from './faille5e';
import { PARVIS, PARVIS_BUILDINGS, parvisFloor } from './plan3e';
import { CRIQUE, CRIQUE_BUILDINGS, criqueFloor } from './plan4e';
import { PERCHOIR_BLOCKED } from './perchoir5e';
import { FAILLE_5E, PERCHOIR_5E, LISIERE, LISIERE_BUILDINGS, lisiereFloor } from './plan5e';
import { PORT, PORT_PAVING, TERRAIN, portFloor } from './plan6e';
import { modelOfPlace } from './places';
import { heightOnMesh, type HeightField } from './terrain';
import { obstaclesIn3e, smallArchFloor, walkBlocked3e } from './terrain3e';
import { obstaclesIn4e, walkBlocked4e } from './terrain4e';
import { obstaclesIn5e } from './terrain5e';

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

/**
 * La grille de ce qui se marche : son coin, son pas, ses cases, la sorte de chaque case et sa terre (son rang dans
 * `lands`, les terres de son plan, ou −1).
 */
export interface WalkGrid {
  minX: number;
  minZ: number;
  cell: number;
  nx: number;
  nz: number;
  kind: Uint8Array;
  land: Int8Array;
  lands: readonly LandId[];
}

/** Le plan du 6e : celui de la marche libre quand on ne dit pas le plan. */
const PLAN_6E = planFor('6e');

/**
 * Ce que la marche libre lit d'un niveau (GD-22, lot 2) : un nœud de son réseau, le sol où l'on marche toujours (la
 * pierre de l'Escale, au 6e ; de la Lisière, au 5e), ce qui bloque dans une tuile (la végétation, les aiguilles), et
 * les boîtes en plus des lieux (les bâtiments du lieu de départ).
 */
interface WalkWorld {
  node(id: string): Vec2;
  paved(x: number, z: number): boolean;
  obstacles(field: HeightField, tx: number, tz: number): readonly { x: number; z: number; r: number }[];
  boxes(block: (center: Vec2, reach: number, toLocal: (p: Vec2) => Vec2, box: { x0: number; x1: number; z0: number; z1: number }) => void): void;
  /** Un sol où l'on ne marche jamais, quelle que soit sa pente (au 4e, le sommet du volcan et la coulée figée), ou rien. */
  blocked?(p: Vec2): boolean;
}

const WALK_6E: WalkWorld = {
  node: (id) => pathNode(id).at,
  paved: (x, z) => portFloor(x, z) !== null,
  obstacles: (field, tx, tz) => floraOf(field, tx, tz).map((it) => ({ x: it.x, z: it.z, r: FLORA_RADIUS[it.kind] * it.scale })),
  boxes: (block) => block(PORT.toWorld((PORT_BUILDINGS.x0 + PORT_BUILDINGS.x1) / 2, (PORT_BUILDINGS.z0 + PORT_BUILDINGS.z1) / 2), 30, PORT.toLocal, PORT_BUILDINGS),
};

const WALK_5E: WalkWorld = {
  node: (id) => NETWORK_5E.pathNode(id).at,
  // La pierre de la Lisière, et ses bâtiments (GD-22, lot 4).
  paved: (x, z) => lisiereFloor(x, z) !== null,
  obstacles: (_field, tx, tz) => obstaclesIn5e(tx, tz),
  // Les bâtiments de la Lisière ; la fente et la paroi de la Faille, et le pied de son arbre (GD-22, lot 11) ; le muret du Perchoir (lot 16).
  boxes: (block) => {
    block(LISIERE.toWorld((LISIERE_BUILDINGS.x0 + LISIERE_BUILDINGS.x1) / 2, (LISIERE_BUILDINGS.z0 + LISIERE_BUILDINGS.z1) / 2), 30, LISIERE.toLocal, LISIERE_BUILDINGS);
    const toFaille = (p: Vec2): Vec2 => ({ x: p.x - FAILLE_5E.center.x, z: p.z - FAILLE_5E.center.z });
    for (const box of [FAILLE_BLOCKED.rift, FAILLE_BLOCKED.tree]) block(FAILLE_5E.center, 8, toFaille, box);
    // Le muret du Perchoir, bas mais qu'on ne franchit pas (GD-22, lot 16).
    const toPerchoir = (p: Vec2): Vec2 => ({ x: p.x - PERCHOIR_5E.center.x, z: p.z - PERCHOIR_5E.center.z });
    for (const box of PERCHOIR_BLOCKED) block(PERCHOIR_5E.center, 6, toPerchoir, box);
  },
};

const WALK_4E: WalkWorld = {
  node: (id) => NETWORK_4E.pathNode(id).at,
  // La pierre de la Crique, et ses bâtiments (lot 1 du 4e).
  paved: (x, z) => criqueFloor(x, z) !== null,
  obstacles: (_field, tx, tz) => obstaclesIn4e(tx, tz),
  boxes: (block) => block(CRIQUE.toWorld((CRIQUE_BUILDINGS.x0 + CRIQUE_BUILDINGS.x1) / 2, (CRIQUE_BUILDINGS.z0 + CRIQUE_BUILDINGS.z1) / 2), 30, CRIQUE.toLocal, CRIQUE_BUILDINGS),
  // Le sommet du volcan et la coulée figée, où l'on ne marche pas (le ravin, plus bas que la rive, l'est déjà).
  blocked: walkBlocked4e,
};

const WALK_3E: WalkWorld = {
  node: (id) => NETWORK_3E.pathNode(id).at,
  // La pierre du Parvis, et ses bâtiments ; la chaussée des deux petites arches des Prairies, toujours ouvertes (lot 1 du 3e).
  paved: (x, z) => parvisFloor(x, z) !== null || smallArchFloor(x, z) !== null,
  obstacles: (_field, tx, tz) => obstaclesIn3e(tx, tz),
  boxes: (block) => block(PARVIS.toWorld((PARVIS_BUILDINGS.x0 + PARVIS_BUILDINGS.x1) / 2, (PARVIS_BUILDINGS.z0 + PARVIS_BUILDINGS.z1) / 2), 30, PARVIS.toLocal, PARVIS_BUILDINGS),
  // Le pic et le haut du cône, les deux arêtes et la langue de glace, où l'on ne marche pas (les nuages, plus bas que la rive, le sont déjà).
  blocked: walkBlocked3e,
};

const WALKS: Readonly<Record<LevelPlan['level'], WalkWorld>> = { '6e': WALK_6E, '5e': WALK_5E, '4e': WALK_4E, '3e': WALK_3E };

const walkWorldOf = (plan: LevelPlan): WalkWorld => WALKS[plan.level];

/** Le rang d'une terre dans celles de la grille (toute terre y est ; sinon, une erreur plutôt qu'un rang faux). */
function landIndex(lands: readonly LandId[], l: LandId): number {
  const i = lands.indexOf(l);
  if (i < 0) throw new Error(`freeWalk : terre inconnue « ${l} »`);
  return i;
}

/** La distance d'un point au segment de `a` à `b`, et sa part le long de lui. */
function onSegment(p: Vec2, a: Vec2, b: Vec2): { d: number; t: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
  return { d: Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t), t };
}

/** Les grilles déjà tirées, par terrain (chaque niveau a le sien). */
const gridCache = new WeakMap<HeightField, WalkGrid>();

/** Tant de rangées de cases entre deux pauses du tirage (`walkGridSteps`). */
const ROWS_PER_STEP = 8;
/** De même, tant de chemins, et tant de cases quand la terre se propage. */
const EDGES_PER_STEP = 16;
const CELLS_PER_STEP = 20_000;

/** Tire la grille de ce qui se marche d'un coup (une fois par terrain : seules les terres fermées changent, à la lecture). */
export function buildWalkGrid(field: HeightField, plan: LevelPlan = PLAN_6E): WalkGrid {
  const steps = walkGridSteps(field, plan);
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/**
 * Le tirage de la grille par tranches : chaque `next()` fait quelques rangées (ou quelques tuiles de végétation) puis
 * rend la main, si bien que la vue le mène au repos sans à-coup ; le dernier rend la grille. Une grille déjà tirée pour
 * ce terrain est rendue au premier pas.
 */
export function* walkGridSteps(field: HeightField, plan: LevelPlan = PLAN_6E): Generator<void, WalkGrid, void> {
  const known = gridCache.get(field);
  if (known) return known;
  const world = walkWorldOf(plan);
  const lands = plan.lands.map((l) => l.id);
  // Les terres fermées tiennent dans un masque de 31 bits (`closedMask`).
  if (lands.length > 31) throw new Error('freeWalk : plus de 31 terres, le masque des terres fermées ne suffit plus');
  const startLand = startLandOf(plan);
  const nodeLand = nodeLands(plan);
  const T = plan.terrain;
  const { cell } = FREE_WALK;
  const minX = T.minX;
  const minZ = T.minZ;
  const nx = Math.ceil((T.tilesX * T.tileCells * T.step) / cell);
  const nz = Math.ceil((T.tilesZ * T.tileCells * T.step) / cell);
  const kind = new Uint8Array(nx * nz);
  const land = new Int8Array(nx * nz).fill(-1);
  const centerOf = (i: number, j: number): Vec2 => ({ x: minX + (i + 0.5) * cell, z: minZ + (j + 0.5) * cell });

  // Le sol : assez haut au-dessus de l'eau, pas trop raide, ou la pierre de l'Escale.
  const e = cell / 2;
  for (let j = 0; j < nz; j++) {
    if (j % ROWS_PER_STEP === ROWS_PER_STEP - 1) yield;
    for (let i = 0; i < nx; i++) {
      const p = centerOf(i, j);
      if (world.paved(p.x, p.z)) {
        kind[j * nx + i] = GROUND;
        continue;
      }
      if (world.blocked?.(p)) continue;
      const h = heightOnMesh(field, p.x, p.z);
      if (h < FREE_WALK.shore) continue;
      const gx = (heightOnMesh(field, p.x + e, p.z) - heightOnMesh(field, p.x - e, p.z)) / (2 * e);
      const gz = (heightOnMesh(field, p.x, p.z + e) - heightOnMesh(field, p.x, p.z - e)) / (2 * e);
      if (Math.hypot(gx, gz) <= FREE_WALK.slope) kind[j * nx + i] = GROUND;
    }
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
  for (let tz = 0; tz < T.tilesZ; tz++)
    for (let tx = 0; tx < T.tilesX; tx++) {
      for (const it of world.obstacles(field, tx, tz)) blockDisk(it, it.r + FREE_WALK.keo);
      yield;
    }
  for (const pl of plan.places) {
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
  world.boxes(blockBox);
  yield;

  // Les chemins, toujours marchés (la digue, les pontons, les portes des lieux, les culées), et leur terre ; sur la
  // liaison d'un pont, la part au-delà de l'arrêt de Kéo est de la terre du pont (fermée tant qu'il n'est pas rebâti).
  const bridgeOf = new Map<number, LinkedLand>(linkedLands(plan).map((l) => [bridgeEdge(plan, l), l]));
  // Les cases d'un pont : elles ne donnent pas leur terre à l'herbe voisine (la rive d'en face la prendrait).
  const onBridge = new Uint8Array(nx * nz);
  const edges = plan.pathEdges;
  for (let edge = 0; edge < edges.length; edge++) {
    if (edge % EDGES_PER_STEP === EDGES_PER_STEP - 1) yield;
    const [ia, ib] = edges[edge];
    const a = world.node(ia);
    const b = world.node(ib);
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
          l = beyond ? site.land : (nodeLand.get(edges[edge][site.nearEnd]) ?? startLand);
        } else l = nodeLand.get(t < 0.5 ? ia : ib) ?? startLand;
        // Une case déjà prise par un chemin d'une autre terre garde la sienne (un croisement près d'un pont).
        const li = landIndex(lands, l);
        if (kind[k] === PATH && land[k] >= 0 && land[k] !== li) continue;
        kind[k] = PATH;
        land[k] = li;
        onBridge[k] = site ? 1 : 0;
      }
  }
  yield;

  // La terre du reste : de proche en proche depuis les chemins, sans passer par une case de pont (sa terre est à part).
  const queue: number[] = [];
  for (let k = 0; k < kind.length; k++) if (kind[k] === PATH && !onBridge[k]) queue.push(k);
  for (let q = 0; q < queue.length; q++) {
    if (q % CELLS_PER_STEP === CELLS_PER_STEP - 1) yield;
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
  const grid: WalkGrid = { minX, minZ, cell, nx, nz, kind, land, lands };
  gridCache.set(field, grid);
  return grid;
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
const closedMask = (g: WalkGrid, closed: readonly LinkedLand[]): number => closed.reduce((m, l) => m | (1 << landIndex(g.lands, l)), 0);

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
  return walkable(g, cellOf(g, p), closedMask(g, closed));
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
  const mask = closedMask(g, closed);
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
 * La ligne de `a` à `b` se marche-t-elle, et ce qu'elle coûte ; `Infinity` si elle touche une case où l'on ne marche
 * pas. Toutes les cases qu'elle traverse sont vues, de bord à bord (jamais un coin de tronc sauté entre deux essais), et
 * chacune compte pour la longueur qu'elle y fait ; passer juste par le coin de deux cases demande que les deux autres
 * se marchent, comme un pas en diagonale.
 */
function lineCost(g: WalkGrid, a: Vec2, b: Vec2, mask: number): number {
  const len = distance(a, b);
  const x = (a.x - g.minX) / g.cell;
  const z = (a.z - g.minZ) / g.cell;
  const dx = (b.x - g.minX) / g.cell - x;
  const dz = (b.z - g.minZ) / g.cell - z;
  let i = Math.floor(x);
  let j = Math.floor(z);
  const si = Math.sign(dx);
  const sj = Math.sign(dz);
  const tdx = dx ? Math.abs(1 / dx) : Infinity;
  const tdz = dz ? Math.abs(1 / dz) : Infinity;
  let tx = dx > 0 ? (i + 1 - x) * tdx : dx < 0 ? (x - i) * tdx : Infinity;
  let tz = dz > 0 ? (j + 1 - z) * tdz : dz < 0 ? (z - j) * tdz : Infinity;
  const at = (ci: number, cj: number) => (ci < 0 || cj < 0 || ci >= g.nx || cj >= g.nz ? -1 : cj * g.nx + ci);
  let t = 0;
  let cost = 0;
  for (;;) {
    const k = at(i, j);
    if (!walkable(g, k, mask)) return Infinity;
    const next = Math.min(tx, tz, 1);
    cost += stepCost(g, k) * (next - t) * len;
    t = next;
    if (t >= 1) return cost;
    if (Math.abs(tx - tz) < 1e-9) {
      if (!walkable(g, at(i + si, j), mask) || !walkable(g, at(i, j + sj), mask)) return Infinity;
      i += si;
      j += sj;
      tx += tdx;
      tz += tdz;
    } else if (tx < tz) {
      i += si;
      tx += tdx;
    } else {
      j += sj;
      tz += tdz;
    }
  }
}

/**
 * Le trajet libre de `from` à `to`, les terres `closed` fermées (A* sur la grille, en huit directions, sans couper un
 * coin bloqué ; puis lissé : deux points se rejoignent en ligne droite si la ligne se marche et ne coûte pas plus que le
 * détour, si bien qu'un chemin proche reste pris). Les points où Kéo tourne, `from` et `to` compris ; rien si `to` ne
 * s'atteint pas (il doit se marcher : `nearestWalkable` d'abord).
 */
export function freeRoute(g: WalkGrid, from: Vec2, to: Vec2, closed: readonly LinkedLand[]): Vec2[] | null {
  const mask = closedMask(g, closed);
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
  const { cost, came, closedSet } = scratchOf(g);
  cost.fill(Infinity);
  came.fill(-1);
  closedSet.fill(0);
  const gi = goal % g.nx;
  const gj = (goal - gi) / g.nx;
  // L'estimation qui reste : la ligne droite, toute sur un chemin (elle ne surestime jamais).
  const hScale = g.cell * FREE_WALK.pathCost;
  const h = (k: number) => {
    const i = k % g.nx;
    return Math.hypot(i - gi, (k - i) / g.nx - gj) * hScale;
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
  // Le lissage : depuis chaque point gardé, le plus loin qu'on rejoint en ligne droite sans payer plus que le détour,
  // parmi les `SMOOTH_WINDOW` suivants (un long trajet ne coûte pas un essai par paire de points).
  const route: Vec2[] = [points[0]];
  if (points[0] !== from) route.unshift(from);
  let i = 0;
  while (i < points.length - 1) {
    let best = i + 1;
    for (let j = Math.min(points.length - 1, i + SMOOTH_WINDOW); j > i + 1; j--) {
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

/** Le lissage essaie la ligne droite vers tant de points suivants au plus. */
const SMOOTH_WINDOW = 40;

/** Les tableaux de travail de l'A*, faits une fois par grille et remis à zéro à chaque trajet. */
const scratch = new WeakMap<WalkGrid, { cost: Float32Array; came: Int32Array; closedSet: Uint8Array }>();
function scratchOf(g: WalkGrid) {
  let s = scratch.get(g);
  if (!s) {
    const n = g.nx * g.nz;
    s = { cost: new Float32Array(n), came: new Int32Array(n), closedSet: new Uint8Array(n) };
    scratch.set(g, s);
  }
  return s;
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
