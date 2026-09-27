// La vue oblique de la 2D, en calcul pur (testé sans canvas) : chaque cube montre son dessus et sa face avant (sud),
// comme les falaises des jeux d'aventure vus de dessus. Un bloc de haut monte d'une case à l'écran : dessus et faces
// avant tombent tous sur une grille de cases de 16 pixels. Chaque case de l'écran ne montre donc qu'une face, celle du
// cube le plus proche : le terrain devient une carte de tuiles, qu'on dessine et qu'on touche case par case.
import type { VoxelCube } from '../Voxel';
import { islandCenter, viewZone, worldBounds } from '../world/terrain';
import { ALTITUDE, type ArchipelagoId } from '../world/map';
import type { BiomeId } from '../biomes';
import type { Cell } from '../world/view';

/** Côté d'une case, en pixels de base (ceux des textures). */
export const TILE = 16;
/** Côté d'un morceau de terrain dessiné d'avance, en cases. */
export const CHUNK = 32;

export type FaceKind = 'top' | 'front';

/** Une face visible : son cube, dessus ou face avant, et sa profondeur (plus petite : plus proche de l'œil). */
export interface Face {
  cube: VoxelCube;
  kind: FaceKind;
  depth: number;
}

/** Une case de l'écran : la face pleine la plus proche, et un fantôme (bloc à poser) s'il est plus proche encore. */
export interface Tile {
  col: number;
  row: number;
  solid?: Face;
  ghost?: Face;
}

export interface TileMap {
  tiles: Map<string, Tile>;
  /** Les cases par morceau (`cx,cy`) : on dessine un morceau d'un coup. */
  chunks: Map<string, Tile[]>;
  /** Étendue en cases. */
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
}

/**
 * Position à l'écran, en pixels de base, d'un point du monde (x vers l'est, y vers le nord, z en hauteur). Le nord et
 * le haut montent tous deux à l'écran : un point plus haut d'un bloc apparaît une case plus haut.
 */
export function project(x: number, y: number, z: number): { bx: number; by: number } {
  // (+ 0 : jamais de « −0 », qui fausserait les clés des cases.)
  return { bx: x * TILE + 0, by: -(y + z) * TILE + 0 };
}

/** La case de l'écran où tombe une face : le dessus d'un cube, ou sa face avant (juste en dessous à l'écran). */
export function faceCell(c: Cell, kind: FaceKind): { col: number; row: number } {
  return { col: c.x, row: (kind === 'top' ? -(c.y + c.z + 2) : -(c.y + c.z + 1)) + 0 };
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * La carte des tuiles d'un terrain. Un dessus est visible sans cube au-dessus, une face avant sans cube devant (au
 * sud). Dans chaque case, la face du cube le plus proche l'emporte : profondeur y − z (on regarde vers le nord et vers
 * le bas). Les cubes sous `hideBelow` (sous la mer) ne sont pas dessinés. Un fantôme ne cache jamais un bloc plein.
 */
export function buildTiles(cubes: VoxelCube[], hideBelow = -Infinity): TileMap {
  const solid = new Set<string>();
  const any = new Set<string>();
  for (const c of cubes) {
    any.add(key(c.x, c.y, c.z));
    if (!c.ghost) solid.add(key(c.x, c.y, c.z));
  }
  const tiles = new Map<string, Tile>();
  const put = (c: VoxelCube, kind: FaceKind) => {
    const { col, row } = faceCell(c, kind);
    const k = `${col},${row}`;
    let t = tiles.get(k);
    if (!t) tiles.set(k, (t = { col, row }));
    const face: Face = { cube: c, kind, depth: c.y - c.z };
    if (c.ghost) {
      if (!t.ghost || face.depth < t.ghost.depth) t.ghost = face;
    } else if (!t.solid || face.depth < t.solid.depth) t.solid = face;
  };
  for (const c of cubes) {
    if (c.z < hideBelow) continue;
    const covers = c.ghost ? any : solid;
    if (!covers.has(key(c.x, c.y, c.z + 1))) put(c, 'top');
    if (!covers.has(key(c.x, c.y - 1, c.z))) put(c, 'front');
  }
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;
  const chunks = new Map<string, Tile[]>();
  for (const [k, t] of tiles) {
    // Un fantôme derrière un bloc plein ne se voit pas.
    if (t.ghost && t.solid && t.ghost.depth >= t.solid.depth) delete t.ghost;
    if (!t.solid && !t.ghost) {
      tiles.delete(k);
      continue;
    }
    minCol = Math.min(minCol, t.col);
    maxCol = Math.max(maxCol, t.col);
    minRow = Math.min(minRow, t.row);
    maxRow = Math.max(maxRow, t.row);
    const ck = `${Math.floor(t.col / CHUNK)},${Math.floor(t.row / CHUNK)}`;
    let list = chunks.get(ck);
    if (!list) chunks.set(ck, (list = []));
    list.push(t);
  }
  if (!tiles.size) return { tiles, chunks, minCol: 0, maxCol: 0, minRow: 0, maxRow: 0 };
  return { tiles, chunks, minCol, maxCol, minRow, maxRow };
}

/** Ce qu'on touche dans une case : le bloc, la case devant sa face (pour poser un bloc) et le point au sol. */
export interface Pick {
  cell: Cell;
  next: Cell;
  ground: { x: number; y: number };
}

/** Le toucher d'une case : le fantôme s'il y en a un (en chantier, c'est lui qu'on pose), sinon le bloc plein. */
export function pickTile(map: TileMap, col: number, row: number): Pick | null {
  const t = map.tiles.get(`${col},${row}`);
  const face = t?.ghost ?? t?.solid;
  if (!face) return null;
  const { x, y, z } = face.cube;
  const next = face.kind === 'top' ? { x, y, z: z + 1 } : { x, y: y - 1, z };
  return { cell: { x, y, z }, next, ground: { x: x + 0.5, y: y + 0.5 } };
}

/** La caméra de la 2D : le point regardé (en pixels de base) et l'échelle (pixels d'écran par pixel de base). */
export interface View2D {
  cx: number;
  cy: number;
  s: number;
}

/** Passage de l'écran (pixels d'écran, origine en haut à gauche) aux pixels de base, et retour. */
export function toBase(view: View2D, screen: { w: number; h: number }, sx: number, sy: number): { bx: number; by: number } {
  return { bx: (sx - screen.w / 2) / view.s + view.cx, by: (sy - screen.h / 2) / view.s + view.cy };
}
export function toScreen(view: View2D, screen: { w: number; h: number }, bx: number, by: number): { sx: number; sy: number } {
  return { sx: (bx - view.cx) * view.s + screen.w / 2, sy: (by - view.cy) * view.s + screen.h / 2 };
}

/**
 * Une échelle nette : un nombre entier de pixels d'écran par pixel de texture (chaque pixel reste un carré régulier),
 * l'entier le plus proche (un peu de marge rognée plutôt qu'une île deux fois trop petite) ou, pour que tout tienne
 * (`fit`), l'entier juste en dessous ; sous un pixel (la Carte sur un petit écran), l'échelle exacte.
 */
export function crisp(s: number, fit = false): number {
  if (s < 1) return s;
  return Math.max(1, fit ? Math.floor(s) : Math.round(s));
}

/** Cadrer un rectangle de cases de l'écran (colonnes et rangées), avec une marge en cases. */
export function fitCells(box: { minCol: number; maxCol: number; minRow: number; maxRow: number }, screen: { w: number; h: number }, margin = 1): View2D {
  const w = (box.maxCol - box.minCol + 1 + 2 * margin) * TILE;
  const h = (box.maxRow - box.minRow + 1 + 2 * margin) * TILE;
  return {
    cx: ((box.minCol + box.maxCol + 1) / 2) * TILE,
    cy: ((box.minRow + box.maxRow + 1) / 2) * TILE,
    s: Math.min(screen.w / w, screen.h / h),
  };
}

/** Cases d'île visibles de part et d'autre, en vue rapprochée (le cœur fait 16 cases). */
const ISLAND_SPAN = 26;

/**
 * Où regarde la 2D : toute la carte (la Carte), l'île ouverte en vue rapprochée, sinon l'île du bonhomme et ses
 * voisines, sinon tout le terrain.
 */
export function frame2D(
  target: { archipelago: ArchipelagoId; map: boolean; island: BiomeId | null; home: BiomeId | null },
  map: TileMap,
  screen: { w: number; h: number },
): View2D {
  if (target.map || (!target.island && !target.home)) {
    // L'archipel (ses terres, ses îlots, son port), pas les rochers semés au large.
    const b = worldBounds(target.archipelago);
    const alt = ALTITUDE[target.archipelago];
    const box = {
      minCol: Math.max(map.minCol, b.minX),
      maxCol: Math.min(map.maxCol, b.maxX),
      minRow: Math.max(map.minRow, Math.floor(project(0, b.maxY + 1, alt + 16).by / TILE)),
      maxRow: Math.min(map.maxRow, Math.ceil(project(0, b.minY, alt - 1).by / TILE)),
    };
    const v = fitCells(box, screen, 1);
    return { ...v, s: crisp(v.s, true) };
  }
  if (target.island) {
    const c = islandCenter(target.island);
    // Le milieu de l'île à hauteur du sol (le cœur est un peu au-dessus de l'altitude de base).
    const { bx, by } = project(c.x, c.y, c.z + 1);
    return { cx: bx, cy: by, s: crisp(Math.min(screen.w, screen.h) / (ISLAND_SPAN * TILE)) };
  }
  const z = viewZone(target.home!);
  const alt = islandCenter(target.home!).z + 1;
  const box = {
    minCol: z.minX,
    maxCol: z.maxX,
    minRow: Math.floor(project(0, z.maxY, alt + 2).by / TILE),
    maxRow: Math.ceil(project(0, z.minY, alt).by / TILE),
  };
  const v = fitCells(box, screen, 2);
  return { ...v, s: crisp(v.s) };
}
