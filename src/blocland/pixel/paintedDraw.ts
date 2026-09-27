// Le dessin de la 2D peinte (lot R7), derrière `?rendu=archipeo` : chaque morceau de terrain est peint pixel par pixel
// dans une image (aplats de la palette, grandes taches, falaises en dégradé et en strates larges, franges en festons,
// écume, bandes claires de la mer près des rives), puis les traits (rebords, arêtes), les ombres bleutées et les
// fantômes par-dessus. Les couleurs viennent de ./painted.ts ; la géométrie des cases est celle de ./oblique.ts, la même
// qu'en pixels : les cases, les gestes et le toucher ne changent pas.
import type { VoxelCube } from '../Voxel';
import { mixColor } from '../world/daylight';
import type { DrawEnv } from './draw';
import { plateauBorder } from './draw';
import { CHUNK, TILE, type Face, type Tile, type TileMap } from './oblique';
import { FESTON, feston, motifDe, nuanceDuDessus, nuanceDuMotif, nuancer, ombreDeFalaise, ondeDesStrates, POINTILLE, rgba, strate, type Peinture } from './painted';
import { PRIORITY, columnAt, materialOf, type Material } from './surface';

type Dir = 'n' | 's' | 'e' | 'w';
const STEP: Record<Dir, [number, number]> = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] };
const DIRS: Dir[] = ['n', 's', 'e', 'w'];

interface Pixels {
  data: Uint8ClampedArray;
  w: number;
}

function put(b: Pixels, x: number, y: number, c: number) {
  const i = (y * b.w + x) * 4;
  b.data[i] = (c >> 16) & 255;
  b.data[i + 1] = (c >> 8) & 255;
  b.data[i + 2] = c & 255;
  b.data[i + 3] = 255;
}

/** Les sols qui tiennent en colonnes (orgues de basalte, colonnes de glace) plutôt qu'en strates. */
const COLONNES = new Set<Material>(['basalte', 'lave', 'glace']);
/** Les sols dont le bord déborde sur la falaise (le gazon, la neige, la mousse). */
const LEVRE = new Set<Material>(['herbe', 'neige', 'mousse']);

/** Le dessus d'une case : l'aplat de son sol, ses grandes taches, et les franges en festons du sol voisin qui mord. */
function paintTop(b: Pixels, cube: VoxelCube, x0: number, y0: number, env: DrawEnv, P: Peinture) {
  const m = materialOf(cube);
  const ground = m !== 'autre';
  const muted = Boolean(cube.muted);
  const f = P.faces(cube);
  const base = ground ? P.froid(f.dessus, cube.z + 1) : f.dessus;
  const bites: { d: Dir; color: number }[] = [];
  if (ground && env.style.edges)
    for (const d of DIRS) {
      const nb = columnAt(env.surface, cube.x + STEP[d][0], cube.y + STEP[d][1]);
      if (nb && nb.z === cube.z && nb.material !== m && nb.material !== 'autre' && PRIORITY[nb.material] > PRIORITY[m])
        bites.push({ d, color: P.froid(P.sol(nb.material, muted).dessus, cube.z + 1) });
    }
  // Les taches, aux quatre coins de la case (elles s'étalent sur neuf blocs : un dégradé linéaire suffit dedans).
  const nw = nuanceDuDessus(cube.x, cube.y + 1);
  const ne = nuanceDuDessus(cube.x + 1, cube.y + 1);
  const sw = nuanceDuDessus(cube.x, cube.y);
  const se = nuanceDuDessus(cube.x + 1, cube.y);
  const motif = motifDe(cube.texture);
  for (let py = 0; py < TILE; py++) {
    const v = (py + 0.5) / TILE;
    for (let px = 0; px < TILE; px++) {
      let c = base;
      for (const bt of bites) {
        const inward = bt.d === 'n' ? py : bt.d === 's' ? TILE - 1 - py : bt.d === 'w' ? px : TILE - 1 - px;
        const along = bt.d === 'n' || bt.d === 's' ? cube.x * TILE + px : -cube.y * TILE + py;
        if (inward < feston(along, FESTON, 1, 4.5)) c = bt.color;
      }
      let k: number;
      if (ground) {
        const u = (px + 0.5) / TILE;
        k = (nw * (1 - u) + ne * u) * (1 - v) + (sw * (1 - u) + se * u) * v;
      } else k = nuanceDuMotif(motif, px, py);
      put(b, x0 + px, y0 + py, k === 1 ? c : nuancer(c, k));
    }
  }
}

/**
 * Une face avant : la falaise (ou le mur) sous un dessus. Dégradé vertical sur toute sa hauteur, clair sous la lèvre,
 * plus sombre et bleuté au pied ; des strates larges (des colonnes dans le basalte et la glace) ; au sommet, le gazon
 * (ou la neige) qui déborde en festons, sinon une lèvre claire ; au pied d'une rive, la bande d'écume.
 */
function paintFront(b: Pixels, cube: VoxelCube, x0: number, y0: number, env: DrawEnv, P: Peinture) {
  const m = materialOf(cube);
  const ground = m !== 'autre';
  const muted = Boolean(cube.muted);
  const f = P.faces(cube);
  const col = columnAt(env.surface, cube.x, cube.y);
  const zt = Math.max(cube.z, col?.z ?? cube.z);
  const summit = cube.z === zt;
  const lip = summit && env.style.edges && LEVRE.has(m) ? P.sol(m, muted).dessus : null;
  const foam = env.style.edges && env.sea && !columnAt(env.surface, cube.x, cube.y - 1) && cube.z <= -1;
  const light = P.levre(f.cote);
  const dark = P.pied(f.cote);
  const motif = motifDe(cube.texture);
  const ondes: number[] = [];
  for (let px = 0; px < TILE; px++) ondes.push(ondeDesStrates((cube.x * TILE + px) / TILE));
  for (let py = 0; py < TILE; py++) {
    const k = ombreDeFalaise(zt - cube.z + (py + 0.5) / TILE, ground);
    const row = mixColor(light, dark, k);
    const wz = cube.z + 1 - (py + 0.5) / TILE;
    for (let px = 0; px < TILE; px++) {
      const gx = cube.x * TILE + px;
      let c = row;
      if (ground) c = nuancer(c, COLONNES.has(m) ? (Math.floor(gx / 5) % 2 ? 0.94 : 1) : strate(gx / TILE, wz, ondes[px]));
      else if (motif) c = nuancer(c, nuanceDuMotif(motif, px, py));
      if (summit) {
        if (lip !== null) {
          const d = feston(gx, FESTON, 2, 4.5);
          if (py < d) c = lip;
          else if (py < d + 2) c = mixColor(c, 0xffffff, 0.14);
        } else if (py < 2) c = mixColor(c, 0xffffff, 0.16);
      }
      if (foam && py >= TILE - feston(gx + 3, 8, 1.5, 4)) c = P.ecume;
      put(b, x0 + px, y0 + py, c);
    }
  }
}

/**
 * La mer près des rives, dans les cases vides autour du terrain : une bande de haut-fond et une bande claire, aux
 * bords ondulés ; au-delà, le large (le fond, dessiné par la vue).
 */
function paintShore(b: Pixels, map: TileMap, col: number, row: number, x0: number, y0: number, P: Peinture) {
  const rects: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dc && !dr) continue;
      if (map.tiles.get(`${col + dc},${row + dr}`)?.solid) rects.push([dc * TILE, dr * TILE]);
    }
  if (!rects.length) return;
  // Des bords qui ondulent lentement (une onde de 20 à 35 pixels) : pas de marches d'un pixel. Les sinus d'une somme
  // se calculent d'avance, par ligne et par colonne.
  const ax: number[] = [];
  const bx: number[] = [];
  const cx: number[] = [];
  const dx: number[] = [];
  for (let i = 0; i < TILE; i++) {
    const gx = col * TILE + i;
    ax.push(Math.sin(gx * 0.19), Math.cos(gx * 0.19));
    bx.push(Math.sin(-gx * 0.08), Math.cos(-gx * 0.08));
    const gy = row * TILE + i;
    cx.push(Math.sin(gy * 0.05), Math.cos(gy * 0.05));
    dx.push(Math.sin(gy * 0.23), Math.cos(gy * 0.23));
  }
  for (let py = 0; py < TILE; py++)
    for (let px = 0; px < TILE; px++) {
      let d2 = Infinity;
      for (const [rx, ry] of rects) {
        const ex = Math.max(rx - (px + 0.5), 0, px + 0.5 - (rx + TILE));
        const ey = Math.max(ry - (py + 0.5), 0, py + 0.5 - (ry + TILE));
        d2 = Math.min(d2, ex * ex + ey * ey);
      }
      if (d2 >= 200) continue;
      // 1,3 sin(0,19 gx + 0,05 gy) + 0,8 sin(0,23 gy − 0,08 gx)
      const onde =
        1.3 * (ax[px * 2] * cx[py * 2 + 1] + ax[px * 2 + 1] * cx[py * 2]) + 0.8 * (dx[py * 2] * bx[px * 2 + 1] + dx[py * 2 + 1] * bx[px * 2]);
      const rive = 3.5 + onde * 0.5;
      const pres = 12 + onde;
      if (d2 < rive * rive) put(b, x0 + px, y0 + py, P.mer.rive);
      else if (d2 < pres * pres) put(b, x0 + px, y0 + py, P.mer.pres);
    }
}

/** Une ombre douce (bleutée) : un dégradé de `n` bandes d'un pixel, de `alpha` à presque rien. */
function softShadow(ctx: CanvasRenderingContext2D, color: number, alpha: number, n: number, band: (i: number) => [number, number, number, number]) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rgba(color, +(alpha * (1 - i / n)).toFixed(3));
    const [x, y, w, h] = band(i);
    ctx.fillRect(x, y, w, h);
  }
}

/** Traits, reflets et ombres d'une face, par-dessus sa peinture (aux mêmes places que la 2D en pixels). */
function decorate(ctx: CanvasRenderingContext2D, face: Face, x: number, y: number, env: DrawEnv, P: Peinture) {
  const { cube, kind } = face;
  const at = (d: Dir) => columnAt(env.surface, cube.x + STEP[d][0], cube.y + STEP[d][1]);
  const outline = rgba(P.trait, 0.6);
  if (kind === 'top') {
    const south = at('s');
    if (env.style.edges && (!south || south.z < cube.z)) {
      // Le haut d'une falaise : un reflet clair.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(x, y + TILE - 1, TILE, 1);
    }
    if (env.style.shadows) {
      // Le soleil vient d'en haut à gauche : le relief voisin à l'ouest ombre le bord gauche, au nord le haut.
      const w = at('w');
      const n = at('n');
      if (w && w.z > cube.z) softShadow(ctx, P.ombre, 0.2, 6, (i) => [x + i, y, 1, TILE]);
      if (n && n.z > cube.z) softShadow(ctx, P.ombre, 0.2, 4, (i) => [x, y + i, TILE, 1]);
    }
    if (env.style.edges) plateauBorder(ctx, cube, x, y, env, outline);
    return;
  }
  if (env.style.edges) {
    // Les arêtes d'une falaise, là où elle tourne.
    ctx.fillStyle = outline;
    const east = at('e');
    const west = at('w');
    if (!east || east.z < cube.z) ctx.fillRect(x + TILE - 1, y, 1, TILE);
    if (!west || west.z < cube.z) ctx.fillRect(x, y, 1, TILE);
  }
  const south = at('s');
  if (env.style.shadows && south && south.z === cube.z - 1) softShadow(ctx, P.ombre, 0.26, 4, (i) => [x, y + TILE - 1 - i, TILE, 1]);
}

/** Transparence d'un fantôme et son voile bleuté : les mêmes qu'en pixels. */
const GHOST_ALPHA = 0.55;

/**
 * Un fantôme : la face du bloc à poser, bleutée, entourée d'un pointillé blanc ; entre les points blancs, des points
 * Nuit océan, pour que le pointillé se lise aussi sur la neige, le sable et la pierre claire.
 */
function drawGhost(ctx: CanvasRenderingContext2D, face: Face, x: number, y: number, P: Peinture) {
  const f = P.faces(face.cube);
  ctx.globalAlpha = GHOST_ALPHA;
  ctx.fillStyle = rgba(face.kind === 'top' ? f.dessus : f.cote);
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = 'rgba(120, 190, 255, 0.35)';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.globalAlpha = 1;
  const dots = (color: string, o: number) => {
    ctx.fillStyle = color;
    for (let i = 0; i < TILE; i += 2) {
      ctx.fillRect(x + i + o, y, 1, 1);
      ctx.fillRect(x + i + 1 - o, y + TILE - 1, 1, 1);
      ctx.fillRect(x, y + i + 1 - o, 1, 1);
      ctx.fillRect(x + TILE - 1, y + i + o, 1, 1);
    }
  };
  dots(rgba(...POINTILLE.sombre), 1);
  dots(rgba(...POINTILLE.blanc), 0);
}

/** Peint des cases dans un canvas de `cols` × `rows` cases dont le coin haut-gauche est la case (col0, row0). */
function paint(tiles: Tile[], col0: number, row0: number, cols: number, rows: number, env: DrawEnv, P: Peinture, shore: TileMap | null): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = cols * TILE;
  canvas.height = rows * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const img = ctx.createImageData(canvas.width, canvas.height);
  const b: Pixels = { data: img.data, w: canvas.width };
  if (shore)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (!shore.tiles.get(`${col0 + c},${row0 + r}`)?.solid) paintShore(b, shore, col0 + c, row0 + r, c * TILE, r * TILE, P);
  for (const t of tiles) {
    if (!t.solid) continue;
    const x = (t.col - col0) * TILE;
    const y = (t.row - row0) * TILE;
    if (t.solid.kind === 'top') paintTop(b, t.solid.cube, x, y, env, P);
    else paintFront(b, t.solid.cube, x, y, env, P);
  }
  ctx.putImageData(img, 0, 0);
  for (const t of tiles) {
    const x = (t.col - col0) * TILE;
    const y = (t.row - row0) * TILE;
    if (t.solid && (env.style.edges || env.style.shadows)) decorate(ctx, t.solid, x, y, env, P);
    if (t.ghost) drawGhost(ctx, t.ghost, x, y, P);
  }
  return canvas;
}

/** Un morceau de terrain (CHUNK × CHUNK cases), peint ; avec une mer, ses rives éclaircies. */
export function drawPaintedChunk(map: TileMap, cx: number, cy: number, env: DrawEnv, P: Peinture): HTMLCanvasElement | null {
  return paint(map.chunks.get(`${cx},${cy}`) ?? [], cx * CHUNK, cy * CHUNK, CHUNK, CHUNK, env, P, env.sea ? map : null);
}

/** Une petite carte de tuiles (le Bloc-Navire), peinte. */
export function drawPaintedTileMap(map: TileMap, env: DrawEnv, P: Peinture): { canvas: HTMLCanvasElement; col0: number; row0: number } | null {
  if (!map.tiles.size) return null;
  const canvas = paint([...map.tiles.values()], map.minCol, map.minRow, map.maxCol - map.minCol + 1, map.maxRow - map.minRow + 1, env, P, null);
  return canvas ? { canvas, col0: map.minCol, row0: map.minRow } : null;
}

/**
 * Le motif de la mer peinte, répété sous le terrain : quelques reflets horizontaux, longs et rares ; dans les Îles du
 * Ciel, de longues nappes de nuage sur le plancher. Transparent ailleurs (le fond est la couleur du large).
 */
export function seaPattern(P: Peinture, clouds: boolean): HTMLCanvasElement | null {
  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (clouds) {
    // Des nappes de nuage, plus claires, en ovales plats.
    ctx.fillStyle = rgba(mixColor(P.mer.large, 0xffffff, 0.45), 0.7);
    for (const [x, y, rx, ry] of [
      [40, 30, 34, 7],
      [140, 90, 40, 8],
      [70, 150, 30, 6],
      [170, 170, 22, 5],
    ]) {
      for (const dx of [-size, 0, size]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return canvas;
  }
  ctx.fillStyle = rgba(P.mer.reflet, 0.8);
  for (const [x, y, w] of [
    [12, 20, 38],
    [110, 64, 52],
    [50, 118, 30],
    [150, 160, 44],
    [4, 176, 24],
  ]) {
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x + 6, y + 1, w - 12, 1);
    if (x + w > size) ctx.fillRect(x - size, y, w, 1);
  }
  return canvas;
}

