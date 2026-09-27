// Le dessin de la 2D sur un canvas : les images des faces (textures de world/pixels.ts, assombries pour les faces
// avant), et les morceaux de terrain dessinés d'avance. Rien ici ne décide de ce qui est visible (voir oblique.ts).
import { shade, type VoxelCube } from '../Voxel';
import { PAINTERS, SIZE, faceCanvas, type TextureKind } from '../world/pixels';
import { CHUNK, TILE, type Face, type FaceKind, type Tile, type TileMap } from './oblique';

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

function drawFace(ctx: CanvasRenderingContext2D, face: Face, x: number, y: number) {
  const img = faceImage(face.cube, face.kind);
  if (img) ctx.drawImage(img, x, y);
}

/** Dessine un morceau de terrain (CHUNK × CHUNK cases) dans son canvas, à l'échelle des textures. */
export function drawChunk(map: TileMap, cx: number, cy: number): HTMLCanvasElement | null {
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
    if (t.solid) drawFace(ctx, t.solid, x, y);
    if (t.ghost) {
      ctx.globalAlpha = GHOST_ALPHA;
      drawFace(ctx, t.ghost, x, y);
      ctx.fillStyle = 'rgba(120, 190, 255, 0.35)';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.globalAlpha = 1;
    }
  }
  return canvas;
}
