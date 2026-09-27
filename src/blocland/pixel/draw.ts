// Le dessin de la 2D sur un canvas : les images des faces (textures de world/pixels.ts, assombries pour les faces
// avant), et les morceaux de terrain dessinés d'avance. Rien ici ne décide de ce qui est visible (voir oblique.ts).
import { shade, type VoxelCube } from '../Voxel';
import { PAINTERS, SIZE, faceCanvas, type TextureKind } from '../world/pixels';
import { CHUNK, TILE, type Face, type FaceKind, type Tile, type TileMap } from './oblique';
import type { STYLE } from './style';
import { PRIORITY, columnAt, materialOf, type Surface } from './surface';
import { designedTile, fringeColors, hash, isGrainy, pavedTile } from './tiles';

const images = new Map<string, HTMLCanvasElement | null>();

function blank(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  return ctx ? { canvas, ctx } : null;
}

/** Les faces avant sont dans l'ombre : le soleil vient d'en haut, un peu du nord. */
const FRONT_SHADOW = 0.24;

/**
 * L'image 16 × 16 d'une face : la texture du bloc (dessus, ou côté pour la face avant), délavée si l'île est
 * verrouillée ; sans texture, sa couleur, plus claire au-dessus et plus sombre devant, comme dans les petits cubes SVG.
 * Une fine ligne claire marque l'arête du haut d'une face avant : les falaises se lisent.
 */
export function faceImage(cube: VoxelCube, kind: FaceKind): HTMLCanvasElement | null {
  const texture = cube.texture && cube.texture in PAINTERS ? (cube.texture as TextureKind) : null;
  const k = `${texture ?? `${cube.color}/${cube.top ?? ''}`}:${kind}:${cube.muted ? 1 : 0}`;
  if (images.has(k)) return images.get(k)!;
  const b = blank();
  if (b) {
    const { ctx } = b;
    if (texture) {
      const src = faceCanvas(texture, kind === 'top' ? 'top' : 'side', cube.muted);
      if (src) ctx.drawImage(src, 0, 0);
    } else {
      ctx.fillStyle = kind === 'top' ? (cube.top ?? shade(cube.color, 0.16)) : cube.color;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    if (kind === 'front') {
      ctx.fillStyle = `rgba(20, 16, 30, ${FRONT_SHADOW})`;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(0, 0, SIZE, 1);
    }
  }
  const out = b?.canvas ?? null;
  images.set(k, out);
  return out;
}

/** Transparence d'un fantôme (un bloc du plan encore à poser), bleuté comme en 3D. */
const GHOST_ALPHA = 0.55;

/** Ce que le dessin d'un morceau doit savoir en plus des tuiles : le sol voisin, le style, la mer. */
export interface DrawEnv {
  surface: Surface;
  style: typeof STYLE;
  /** Une mer autour (pas dans les Îles du Ciel) : l'écume au pied des rives. */
  sea: boolean;
}

/** L'image d'une face : dessinée pour la 2D si le style le veut et si son sol en a une, sinon la texture du bloc. */
function tileImage(face: Face, env: DrawEnv): HTMLCanvasElement | null {
  const { cube, kind } = face;
  const m = materialOf(cube);
  if (env.style.designed && m !== 'autre') {
    const variant = Math.floor(hash(cube.x, cube.y, cube.z) * 4);
    const top = columnAt(env.surface, cube.x, cube.y);
    const lip = kind === 'front' && (m === 'herbe' || m === 'neige' || m === 'mousse') && top?.z === cube.z;
    return designedTile(m, kind, variant, Boolean(cube.muted), lip);
  }
  // Le sol en grain du cœur d'une île (obsidienne, marbre, ardoise…) : un dallage à ses couleurs.
  if (env.style.designed && kind === 'top' && isGrainy(cube.texture)) return pavedTile(cube.texture, Math.floor(hash(cube.x, cube.y, 3) * 4), Boolean(cube.muted));
  return faceImage(cube, kind);
}

type Dir = 'n' | 's' | 'e' | 'w';
const STEP: Record<Dir, [number, number]> = { n: [0, 1], s: [0, -1], e: [1, 0], w: [-1, 0] };

/** Une frange irrégulière d'un sol voisin, le long d'un bord de la case (dessinée chez le sol le moins prioritaire). */
function fringe(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Dir, colors: { base: string; dark: string }, seed: number) {
  for (let i = 0; i < TILE; i++) {
    const d = 1 + Math.floor(hash(i >> 1, seed, 13) * 3);
    for (let k = 0; k < d; k++) {
      ctx.fillStyle = k === d - 1 ? colors.dark : colors.base;
      const [px, py] = dir === 'n' ? [i, k] : dir === 's' ? [i, TILE - 1 - k] : dir === 'w' ? [k, i] : [TILE - 1 - k, i];
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

/** Le contour des plateaux et des falaises. */
const OUTLINE = 'rgba(28, 36, 24, 0.6)';
const INNER_LIGHT = 'rgba(255, 255, 255, 0.22)';

/**
 * Le rebord d'un plateau, là où le sol descend au nord, à l'est ou à l'ouest (au sud, c'est la falaise) : un trait
 * sombre dehors, un reflet clair dedans, les coins saillants arrondis ; un coin rentrant (le sol ne descend qu'en
 * diagonale) marqué d'un point sombre.
 */
function plateauBorder(ctx: CanvasRenderingContext2D, cube: VoxelCube, x: number, y: number, env: DrawEnv) {
  const lower = (dx: number, dy: number) => {
    const c = columnAt(env.surface, cube.x + dx, cube.y + dy);
    return !c || c.z < cube.z;
  };
  const n = lower(0, 1);
  const e = lower(1, 0);
  const w = lower(-1, 0);
  const s = lower(0, -1);
  const px = (px: number, py: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  ctx.fillStyle = OUTLINE;
  if (n) ctx.fillRect(x, y, TILE, 1);
  if (e) ctx.fillRect(x + TILE - 1, y, 1, TILE);
  if (w) ctx.fillRect(x, y, 1, TILE);
  ctx.fillStyle = INNER_LIGHT;
  if (n) ctx.fillRect(x + (w ? 1 : 0), y + 1, TILE - (w ? 1 : 0) - (e ? 1 : 0), 1);
  if (w) ctx.fillRect(x + 1, y + (n ? 2 : 0), 1, TILE - (n ? 2 : 0));
  // Coins saillants : on arrondit (le pixel du coin s'efface dans le contour, le suivant marque la courbe).
  const corner = (cx: number, cy: number, ix: number, iy: number) => {
    px(cx, cy, OUTLINE);
    px(ix, cy, OUTLINE);
    px(cx, iy, OUTLINE);
    px(ix, iy, OUTLINE);
  };
  if (n && e) corner(TILE - 1, 0, TILE - 2, 1);
  if (n && w) corner(0, 0, 1, 1);
  if (s && e) corner(TILE - 1, TILE - 1, TILE - 2, TILE - 2);
  if (s && w) corner(0, TILE - 1, 1, TILE - 2);
  // Coins rentrants.
  if (!n && !e && lower(1, 1)) px(TILE - 1, 0, OUTLINE);
  if (!n && !w && lower(-1, 1)) px(0, 0, OUTLINE);
}

/** Bords (B) et ombres (E) d'une face pleine, par-dessus son image. */
function decorateFace(ctx: CanvasRenderingContext2D, face: Face, x: number, y: number, env: DrawEnv) {
  const { cube, kind } = face;
  const m = materialOf(cube);
  const at = (d: Dir) => columnAt(env.surface, cube.x + STEP[d][0], cube.y + STEP[d][1]);
  if (kind === 'top') {
    for (const d of ['n', 's', 'e', 'w'] as Dir[]) {
      const nb = at(d);
      if (env.style.edges) {
        // L'herbe voisine mord sur le sable, le sable sur l'eau… (seulement à la même hauteur).
        if (nb && nb.z === cube.z && nb.material !== m && m !== 'autre' && nb.material !== 'autre' && PRIORITY[nb.material] > PRIORITY[m])
          fringe(ctx, x, y, d, fringeColors(nb.material, Boolean(cube.muted)), cube.x * 31 + cube.y * 17 + d.charCodeAt(0));
        if (d === 's' && (!nb || nb.z < cube.z)) {
          // Le haut d'une falaise : un reflet clair.
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(x, y + TILE - 1, TILE, 1);
        }
      }
      if (env.style.shadows && nb && nb.z > cube.z) {
        // Le relief voisin fait de l'ombre : à l'ouest, il assombrit le bord gauche ; au nord, le pied de sa falaise.
        ctx.fillStyle = 'rgba(20, 24, 40, 0.22)';
        if (d === 'w') {
          ctx.fillRect(x, y, 3, TILE);
          ctx.fillRect(x + 3, y, 2, TILE);
        } else if (d === 'n') {
          ctx.fillRect(x, y, TILE, 2);
          ctx.fillRect(x, y + 2, TILE, 1);
        }
      }
    }
    if (env.style.edges) plateauBorder(ctx, cube, x, y, env);
    return;
  }
  // Face avant.
  const south = at('s');
  if (env.style.edges && env.sea && !south && cube.z <= -1) {
    // L'écume au pied d'une rive, sur la mer.
    for (let i = 0; i < TILE; i++) {
      const h = 1 + Math.floor(hash(cube.x, i, 21) * 2);
      ctx.fillStyle = '#f4fbff';
      ctx.fillRect(x + i, y + TILE - h, 1, h);
    }
  }
  if (env.style.edges) {
    // Les arêtes d'une falaise : un trait sombre là où elle tourne (la colonne voisine est plus basse).
    ctx.fillStyle = OUTLINE;
    const east = at('e');
    const west = at('w');
    if (!east || east.z < cube.z) ctx.fillRect(x + TILE - 1, y, 1, TILE);
    if (!west || west.z < cube.z) ctx.fillRect(x, y, 1, TILE);
  }
  if (env.style.shadows && south && south.z < cube.z && south.z === cube.z - 1) {
    // Le pied de la falaise, où elle rejoint le sol plus bas.
    ctx.fillStyle = 'rgba(20, 16, 30, 0.3)';
    ctx.fillRect(x, y + TILE - 2, TILE, 2);
  }
}

function drawFace(ctx: CanvasRenderingContext2D, face: Face, x: number, y: number, env: DrawEnv) {
  const img = tileImage(face, env);
  if (img) ctx.drawImage(img, x, y);
}

/** Dessine un morceau de terrain (CHUNK × CHUNK cases) dans son canvas, à l'échelle des textures. */
export function drawChunk(map: TileMap, cx: number, cy: number, env: DrawEnv): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = CHUNK * TILE;
  canvas.height = CHUNK * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const tiles: Tile[] = map.chunks.get(`${cx},${cy}`) ?? [];
  for (const t of tiles) {
    const x = (t.col - cx * CHUNK) * TILE;
    const y = (t.row - cy * CHUNK) * TILE;
    if (t.solid) {
      drawFace(ctx, t.solid, x, y, env);
      if (env.style.edges || env.style.shadows) decorateFace(ctx, t.solid, x, y, env);
    }
    if (t.ghost) {
      ctx.globalAlpha = GHOST_ALPHA;
      drawFace(ctx, t.ghost, x, y, env);
      ctx.fillStyle = 'rgba(120, 190, 255, 0.35)';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.globalAlpha = 1;
    }
  }
  return canvas;
}
