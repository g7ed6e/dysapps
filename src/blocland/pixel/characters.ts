// Les personnages et les repères de la 2D, dessinés en code : le bonhomme (4 directions, 2 pas), les créatures et les
// Gardiens (tirés de leurs propres cubes, en petits pixels), les panneaux des bornes de mission, et les repères jaunes.
// Chaque sprite a un contour sombre d'un pixel, comme le décor. Rien d'emprunté.
import { shade, type VoxelCube } from '../Voxel';
import { buildTiles } from './oblique';

/** Un sprite prêt à poser : son image, et son pied (le point qui se pose au sol, dans l'image). */
export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  ax: number;
  ay: number;
}

const OUTLINE = '#2a1d14';

/**
 * Peint une grille de couleurs (`null` : transparent) dans un canvas, avec un contour sombre d'un pixel tout autour
 * de la forme (l'image a un pixel de marge de chaque côté).
 */
function paint(w: number, h: number, pixel: (x: number, y: number) => string | null, ax: number, ay: number, outline = OUTLINE): Sprite | null {
  const W = w + 2;
  const H = h + 2;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? pixel(x, y) : null);
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      let c = at(x, y);
      if (!c && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) c = outline;
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  return { canvas, w: W, h: H, ax: ax + 1, ay: ay + 1 };
}

// ---- Le bonhomme

const HAIR = '#5a3a1e';
const HAIR_LIGHT = '#7a5230';
const SKIN = '#f1c9a5';
const SKIN_DARK = '#d9a982';
const EYE = '#2f3f75';
const SHIRT = '#3f9b5a';
const SHIRT_DARK = '#2f7a45';
const PANTS = '#3b5ea8';
const PANTS_DARK = '#2c4a86';
const SHOE = '#4a3320';

export type Facing = 'down' | 'up' | 'left' | 'right';

/** Le côté vers lequel il regarde, d'après sa direction de marche (y vers le nord, donc vers le haut de l'écran). */
export function facingOf(d: { dx: number; dy: number }): Facing {
  if (Math.abs(d.dx) > Math.abs(d.dy)) return d.dx > 0 ? 'right' : 'left';
  return d.dy > 0 ? 'up' : 'down';
}

/**
 * Le bonhomme, 16 × 24 : tête, chemise verte, pantalon bleu, comme en 3D. `step` (0 ou 1) : les jambes et les bras
 * alternent quand il marche.
 */
function avatarPixel(facing: Facing, step: number) {
  const side = facing === 'left' || facing === 'right';
  const flip = facing === 'left';
  return (px: number, y: number): string | null => {
    const x = flip ? 15 - px : px;
    // La tête : 10 × 9.
    if (y >= 1 && y <= 9 && x >= 3 && x <= 12) {
      if (y <= 2) return y === 1 && x > 4 && x < 11 ? HAIR_LIGHT : HAIR;
      if (facing === 'up') return y === 9 ? SKIN_DARK : HAIR;
      if (side) {
        // Regarde à droite : l'arrière de la tête (à gauche) est en cheveux, l'œil devant.
        if (x <= 6 || (y === 3 && x <= 10)) return HAIR;
        if (y === 5 && x === 10) return EYE;
        return y === 9 ? SKIN_DARK : SKIN;
      }
      if (y === 3 || x === 3 || x === 12) return HAIR;
      if (y === 5 && (x === 5 || x === 10)) return EYE;
      if (y === 8 && (x === 7 || x === 8)) return '#b0654a';
      return y === 9 ? SKIN_DARK : SKIN;
    }
    // Le corps : 8 × 7, col sombre.
    if (y >= 10 && y <= 16 && x >= 4 && x <= 11) return y === 10 ? SHIRT_DARK : SHIRT;
    // Les bras (de face : de chaque côté, de profil : un seul, qui balance).
    if (side) {
      const swing = step ? 1 : -1;
      if (y >= 11 && y <= 15 && x >= 7 + swing && x <= 8 + swing) return y === 15 ? SKIN : SHIRT_DARK;
    } else {
      const l = step ? -1 : 0;
      const r = step ? 0 : -1;
      if (x >= 2 && x <= 3 && y >= 11 + l && y <= 16 + l) return y === 16 + l ? SKIN : SHIRT_DARK;
      if (x >= 12 && x <= 13 && y >= 11 + r && y <= 16 + r) return y === 16 + r ? SKIN : SHIRT_DARK;
    }
    // Les jambes et les chaussures.
    if (side) {
      const front = step ? 2 : 0;
      const back = step ? -1 : 0;
      if (y >= 17 && y <= 21 && x >= 5 + back && x <= 7 + back) return PANTS_DARK;
      if (y >= 17 && y <= 21 && x >= 8 + front && x <= 10 + front) return PANTS;
      if (y === 22 && ((x >= 5 + back && x <= 7 + back) || (x >= 8 + front && x <= 11 + front))) return SHOE;
      return null;
    }
    // De face ou de dos : au pas 1, la jambe gauche se lève d'un pixel.
    for (const [leg, x0] of [
      [0, 4],
      [1, 8],
    ] as const) {
      const up = step && leg === 0 ? 1 : 0;
      if (x >= x0 && x <= x0 + 3) {
        if (y >= 17 && y <= 21 - up) return leg === 0 ? PANTS : PANTS_DARK;
        if (y === 22 - up) return SHOE;
      }
    }
    return null;
  };
}

const avatarCache = new Map<string, Sprite | null>();

/** Le sprite du bonhomme, dans une direction, au pas 0 ou 1 (pied au bas du sprite, au milieu). */
export function avatarSprite(facing: Facing, step: number): Sprite | null {
  const k = `${facing}:${step}`;
  if (!avatarCache.has(k)) avatarCache.set(k, paint(16, 23, avatarPixel(facing, step), 8, 22));
  return avatarCache.get(k)!;
}

// ---- Les créatures et les Gardiens, tirés de leurs cubes

const voxelCache = new Map<string, Sprite | null>();

/**
 * Un sprite fait des cubes d'une créature, vue en oblique comme le monde, chaque cube en un petit carré de pixels
 * (dessus plus clair, face avant plus sombre) : la créature garde sa silhouette, à la taille d'un personnage (environ
 * trois cases de haut). Le pied est au milieu du bas.
 */
export function voxelSprite(key: string, cubes: VoxelCube[], muted = false): Sprite | null {
  const k = `${key}:${muted ? 1 : 0}`;
  if (voxelCache.has(k)) return voxelCache.get(k)!;
  const map = buildTiles(cubes);
  const cols = map.maxCol - map.minCol + 1;
  const rows = map.maxRow - map.minRow + 1;
  // Pixels par cube : environ 48 pixels de haut en tout, entre 2 et 4.
  const p = Math.max(2, Math.min(4, Math.round(48 / rows)));
  const fade = (c: string) => (muted ? shade(c, 0.25) : c);
  const colorAt = (x: number, y: number): string | null => {
    const t = map.tiles.get(`${map.minCol + Math.floor(x / p)},${map.minRow + Math.floor(y / p)}`);
    const f = t?.solid;
    if (!f) return null;
    const base = f.kind === 'top' ? (f.cube.top ?? shade(f.cube.color, 0.12)) : shade(f.cube.color, -0.1);
    return fade(base);
  };
  const out = paint(cols * p, rows * p, colorAt, (cols * p) / 2, rows * p - 1);
  voxelCache.set(k, out);
  return out;
}

// ---- Les panneaux des bornes de mission

const signCache = new Map<string, Sprite | null>();

/** Le panneau d'une borne de mission : un poteau de bois, une ardoise bleue et son étoile d'or. */
export function signpostSprite(muted = false): Sprite | null {
  const k = muted ? 'muted' : 'open';
  if (signCache.has(k)) return signCache.get(k)!;
  const f = (c: string) => (muted ? shade(c, 0.28) : c);
  const STAR = ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'];
  const out = paint(
    16,
    20,
    (x, y) => {
      if (y >= 11 && x >= 7 && x <= 8) return f(x === 7 ? '#9a6536' : '#77492a');
      if (y >= 1 && y <= 10 && x >= 1 && x <= 14) {
        const sx = x - 5;
        const sy = y - 3;
        if (sy >= 0 && sy < STAR.length && sx >= 0 && sx < 7 && STAR[sy][sx] === '#') return f('#f2c230');
        if (y === 1) return f('#5a6b90');
        return f(x === 1 || y === 10 ? '#26324d' : '#3a4a6a');
      }
      return null;
    },
    8,
    19,
  );
  signCache.set(k, out);
  return out;
}

// ---- Les repères jaunes

export const GOLD = '#ffc83c';
export const GOLD_DARK = '#a8741a';

/** Un losange jaune (mission à faire), centré en (cx, cy), de demi-diagonale `r` pixels d'écran. */
export function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = GOLD_DARK;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 2);
  ctx.lineTo(cx + r + 2, cy);
  ctx.lineTo(cx, cy + r + 2);
  ctx.lineTo(cx - r - 2, cy);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.fill();
}

/** Des étoiles gagnées, en petits carrés d'or côte à côte. */
export function drawStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, n: number, size: number) {
  const gap = size * 1.4;
  const x0 = cx - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = GOLD_DARK;
    ctx.fillRect(Math.round(x0 + i * gap - size / 2 - 1), Math.round(cy - size / 2 - 1), Math.round(size + 2), Math.round(size + 2));
    ctx.fillStyle = GOLD;
    ctx.fillRect(Math.round(x0 + i * gap - size / 2), Math.round(cy - size / 2), Math.round(size), Math.round(size));
  }
}

/** La flèche « Commence ici » : un chevron jaune qui pointe vers le bas. */
export function drawChevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const w = 7 * s;
  ctx.fillStyle = GOLD_DARK;
  ctx.fillRect(Math.round(cx - 2 * s - 1), Math.round(cy - 10 * s - 1), Math.round(4 * s + 2), Math.round(6 * s + 2));
  ctx.beginPath();
  ctx.moveTo(cx - w - 2, cy - 4 * s - 1);
  ctx.lineTo(cx + w + 2, cy - 4 * s - 1);
  ctx.lineTo(cx, cy + 3 * s + 2);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(Math.round(cx - 2 * s), Math.round(cy - 10 * s), Math.round(4 * s), Math.round(6 * s));
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - 4 * s);
  ctx.lineTo(cx + w, cy - 4 * s);
  ctx.lineTo(cx, cy + 3 * s);
  ctx.fill();
}

/** Pose un sprite, son pied en (sx, sy) de l'écran, à l'échelle `s` ; renvoie le rectangle occupé (pour le toucher). */
export function placeSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, sx: number, sy: number, s: number, alpha = 1) {
  const x = Math.round(sx - sprite.ax * s);
  const y = Math.round(sy - sprite.ay * s);
  const w = Math.round(sprite.w * s);
  const h = Math.round(sprite.h * s);
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(sprite.canvas, x, y, w, h);
  if (alpha < 1) ctx.globalAlpha = 1;
  return { x, y, w, h };
}

/** Une ombre ovale au sol. */
export function drawShadow(ctx: CanvasRenderingContext2D, sx: number, sy: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(20, 30, 20, 0.28)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
