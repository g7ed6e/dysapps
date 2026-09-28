// Le décor de la 2D peinte (lot R7), derrière `?rendu=archipeo` : les mêmes formes que les sprites en pixels
// (./sprites.ts : même taille, même pied, même ombre), peintes en deux ou trois aplats de la matière (world/palette.ts) :
// clair en haut à gauche, ombre bleutée en bas à droite, un contour dans la teinte sombre de la matière (jamais noir).
// Aucun grain. Les personnages (bonhomme, créatures, Gardiens en sentinelles, lot R6) sont rastérisés depuis leurs
// modèles en facettes (./personnages.ts) ; leur canvas est fait ici (`spriteDePersonnage`), par palier de lumière.
import { mixColor } from '../world/daylight';
import type { TextureKind } from '../world/pixels';
import { multiplie, type Faces } from '../world/palette';
import { NUIT_OCEAN, depuisHex, rgba, type Peinture } from './painted';
import type { SpriteKind } from './sprites';
import type { Sprite } from './characters';
import type { RasterDePersonnage } from './personnages';

/** Les trois aplats et le contour d'une matière. */
export interface Tons {
  clair: number;
  base: number;
  ombre: number;
  trait: number;
}

/** Les tons d'une matière, pour un ciel (l'ombre prend le bleu de son ambiance). */
export function tonsDe(f: Faces, ambiance: number): Tons {
  return {
    clair: mixColor(f.dessus, 0xffffff, 0.16),
    base: f.dessus,
    ombre: mixColor(multiplie(f.cote, mixColor(ambiance, NUIT_OCEAN, 0.3)), NUIT_OCEAN, 0.06),
    trait: mixColor(f.cote, NUIT_OCEAN, 0.62),
  };
}

type Role = 'clair' | 'base' | 'ombre' | 'trait';

/**
 * Le rôle d'un pixel d'une forme : le contour si un voisin est dehors, sinon clair ou ombre selon sa place dans la
 * forme (une diagonale : la lumière vient d'en haut à gauche), avec des bords nets.
 */
export function roleDe(inside: (x: number, y: number) => boolean, x: number, y: number, cx: number, cy: number, rx: number, ry: number): Role | null {
  if (!inside(x, y)) return null;
  if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return 'trait';
  const t = -((x + 0.5 - cx) / rx) * 0.7 - ((y + 0.5 - cy) / ry) * 0.75;
  if (t > 0.42) return 'clair';
  if (t < -0.38) return 'ombre';
  return 'base';
}

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;

interface Part {
  matiere: TextureKind;
  inside: (x: number, y: number) => boolean;
  /** Le centre et le rayon de la forme, pour la lumière. */
  c: [number, number, number, number];
}

interface Def {
  w: number;
  h: number;
  ax: number;
  ay: number;
  shadow: number;
  /** Du dessus vers le dessous : la première partie qui contient le pixel le peint. */
  parts: Part[];
  /** Des taches de couleur libre (les fleurs), par-dessus. */
  extra?: (x: number, y: number) => string | null;
}

const PINE_SHAPE = (x: number, y: number) => {
  if (y < 1 || y > 29) return false;
  const tier = y < 10 ? (y - 1) / 9 : y < 20 ? (y - 7) / 13 : (y - 15) / 14;
  const half = 2 + tier * (y < 10 ? 5 : y < 20 ? 8 : 10);
  return Math.abs(x + 0.5 - 11) <= half;
};

/** Les formes : celles de ./sprites.ts, sans leur grain. */
export const FORMES: Record<SpriteKind, Def> = {
  arbre: {
    w: 32,
    h: 35,
    ax: 16,
    ay: 33,
    shadow: 22,
    parts: [
      { matiere: 'feuilles', inside: (x, y) => inEllipse(x, y, 16, 12, 12.5, 11) || inEllipse(x, y, 9, 16, 7.5, 6.5) || inEllipse(x, y, 23, 16, 7.5, 6.5), c: [16, 13, 14, 11] },
      { matiere: 'tronc', inside: (x, y) => x >= 13 && x <= 18 && y >= 18 && y <= 33, c: [15.5, 26, 3, 16] },
    ],
  },
  sapin: {
    w: 22,
    h: 35,
    ax: 11,
    ay: 33,
    shadow: 16,
    parts: [
      { matiere: 'sapin', inside: PINE_SHAPE, c: [11, 16, 10, 15] },
      { matiere: 'tronc', inside: (x, y) => x >= 9 && x <= 12 && y >= 29 && y <= 33, c: [10.5, 31, 2, 3] },
    ],
  },
  buisson: {
    w: 18,
    h: 14,
    ax: 9,
    ay: 12,
    shadow: 14,
    parts: [{ matiere: 'feuilles', inside: (x, y) => inEllipse(x, y, 9, 8, 8, 5.5) || inEllipse(x, y, 6, 5, 4.5, 4) || inEllipse(x, y, 12, 5, 4.5, 4), c: [9, 7.5, 8, 5.5] }],
  },
  fleur: {
    w: 16,
    h: 11,
    ax: 8,
    ay: 9,
    shadow: 0,
    parts: [],
    extra: (x, y) => {
      for (const [fx, fy, c] of [
        [3, 4, '#e8475a'],
        [8, 2, '#ffd23f'],
        [12, 5, '#f4f4ff'],
      ] as [number, number, string][]) {
        if (x === fx && y === fy) return '#ffb02e';
        if (Math.abs(x - fx) + Math.abs(y - fy) === 1) return c;
        if (x === fx && y > fy + 1 && y <= fy + 4) return '#3f7a2a';
      }
      return null;
    },
  },
  champignon: {
    w: 10,
    h: 10,
    ax: 5,
    ay: 9,
    shadow: 8,
    parts: [
      { matiere: 'cabine', inside: (x, y) => inEllipse(x, y, 5, 4, 4.5, 3.5) && y <= 4, c: [5, 3, 4.5, 3] },
      { matiere: 'calque', inside: (x, y) => x >= 4 && x <= 5 && y >= 5 && y <= 9, c: [5, 7, 1, 3] },
    ],
  },
  rocher: {
    w: 16,
    h: 12,
    ax: 8,
    ay: 10,
    shadow: 14,
    parts: [{ matiere: 'pierre', inside: (x, y) => inEllipse(x, y, 8, 7, 7.5, 5) || inEllipse(x, y, 7, 4.5, 4.5, 3.5), c: [8, 6.5, 7.5, 5] }],
  },
  souche: {
    w: 12,
    h: 10,
    ax: 6,
    ay: 9,
    shadow: 10,
    parts: [
      // Le dessus coupé, clair, puis l'écorce.
      { matiere: 'planches', inside: (x, y) => inEllipse(x, y, 6, 2.5, 5, 2) && y <= 3, c: [6, 2.5, 5, 2] },
      { matiere: 'tronc', inside: (x, y) => (y >= 2 && y <= 9 && x >= 1 && x <= 10) || inEllipse(x, y, 6, 2.5, 5, 2), c: [6, 6, 5, 4] },
    ],
  },
  roseau: {
    w: 12,
    h: 18,
    ax: 6,
    ay: 17,
    shadow: 0,
    parts: [],
    extra: (x, y) => {
      for (const [sx, top] of [
        [2, 4],
        [6, 1],
        [9, 5],
      ]) {
        if (x >= sx && x <= sx + 1 && y >= top && y <= top + 3) return '#7a5a3c';
        if (x === sx && y > top + 3 && y <= 17) return '#4a8434';
      }
      return null;
    },
  },
  cristal: {
    w: 12,
    h: 18,
    ax: 6,
    ay: 17,
    shadow: 10,
    parts: [{ matiere: 'cristal', inside: (x, y) => Math.abs(x + 0.5 - 6) <= (y < 8 ? (y + 1) * 0.6 : Math.max(1, (17 - y) * 0.5)) && y >= 0 && y <= 17, c: [6, 8, 3, 9] }],
  },
};

const cache = new Map<string, HTMLCanvasElement | null>();

/** La clé d'un sprite peint : sa forme, l'île verrouillée ou non, l'archipel et le palier de lumière. */
export const cleDuSprite = (kind: SpriteKind, muted: boolean, P: Peinture) => `${kind}:${muted ? 1 : 0}:${P.cle}`;

/** La couleur d'un pixel d'un sprite peint (`null` : transparent). Calcul pur. */
export function pixelDuSprite(kind: SpriteKind, muted: boolean, P: Peinture, x: number, y: number): number | null {
  const def = FORMES[kind];
  const extra = def.extra?.(x, y);
  if (extra) return P.libre(depuisHex(extra), muted);
  for (const part of def.parts) {
    const [cx, cy, rx, ry] = part.c;
    const role = roleDe(part.inside, x, y, cx, cy, rx, ry);
    if (!role) continue;
    return tonsDe(P.matiere(part.matiere, muted), P.ciel.ambianceCiel)[role];
  }
  return null;
}

/**
 * Toute l'image d'un sprite peint, ligne par ligne (`null` : transparent). Un pixel seul de sa couleur (au bord d'un
 * aplat, là où la diagonale de la lumière coupe une pointe) prend la couleur la plus fréquente autour de lui : aucun
 * pixel isolé. Calcul pur.
 */
export function grilleDuSprite(kind: SpriteKind, muted: boolean, P: Peinture): (number | null)[][] {
  const def = FORMES[kind];
  const raw: (number | null)[][] = [];
  for (let y = 0; y < def.h; y++) {
    const row: (number | null)[] = [];
    for (let x = 0; x < def.w; x++) row.push(pixelDuSprite(kind, muted, P, x, y));
    raw.push(row);
  }
  if (!def.parts.length) return raw;
  const at = (x: number, y: number) => (y < 0 || y >= def.h || x < 0 || x >= def.w ? null : raw[y][x]);
  return raw.map((row, y) =>
    row.map((c, x) => {
      if (c === null) return c;
      const around = new Map<number, number>();
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const n = (dx || dy) && at(x + dx, y + dy);
          if (typeof n === 'number') around.set(n, (around.get(n) ?? 0) + 1);
        }
      if (around.has(c) || !around.size) return c;
      return [...around].sort((p, q) => q[1] - p[1])[0][0];
    }),
  );
}

function spriteCanvas(kind: SpriteKind, muted: boolean, P: Peinture): HTMLCanvasElement | null {
  const k = cleDuSprite(kind, muted, P);
  if (cache.has(k)) return cache.get(k)!;
  const def = FORMES[kind];
  const canvas = document.createElement('canvas');
  canvas.width = def.w;
  canvas.height = def.h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(def.w, def.h);
    const grid = grilleDuSprite(kind, muted, P);
    for (let y = 0; y < def.h; y++)
      for (let x = 0; x < def.w; x++) {
        const c = grid[y][x];
        if (c === null) continue;
        const i = (y * def.w + x) * 4;
        img.data[i] = (c >> 16) & 255;
        img.data[i + 1] = (c >> 8) & 255;
        img.data[i + 2] = c & 255;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }
  const out = ctx ? canvas : null;
  cache.set(k, out);
  return out;
}

/** Une ombre au sol, bleutée, au bord adouci (deux ovales : le bord plus pâle). */
export function drawPaintedShadow(ctx: CanvasRenderingContext2D, P: Peinture, sx: number, sy: number, rx: number, ry: number) {
  ctx.fillStyle = rgba(P.ombre, 0.12);
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx * 0.78, ry * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * L'ombre de contact d'une créature (DA, 28/09) : un ovale plus petit, plus sombre et net sous ses pieds, par-dessus son
 * ombre douce ; la nuit, plus marquée (la silhouette se pose sur le sol).
 */
export function drawContactShadow(ctx: CanvasRenderingContext2D, P: Peinture, sx: number, sy: number, rx: number, ry: number) {
  ctx.fillStyle = rgba(P.ombre, 0.3 + 0.2 * (1 - P.light));
  ctx.beginPath();
  ctx.ellipse(Math.round(sx), Math.round(sy), Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry)), 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Dessine un sprite peint, son pied au point (sx, sy), à l'échelle `s` ; avec `shadow`, son ombre au sol. */
export function drawPaintedSprite(ctx: CanvasRenderingContext2D, kind: SpriteKind, muted: boolean, P: Peinture, sx: number, sy: number, s: number, shadow: boolean): void {
  const def = FORMES[kind];
  if (shadow && def.shadow) drawPaintedShadow(ctx, P, sx + s, sy, (def.shadow / 2) * s, 3 * s);
  const img = spriteCanvas(kind, muted, P);
  if (img) ctx.drawImage(img, Math.round(sx - def.ax * s), Math.round(sy - def.ay * s), Math.round(def.w * s), Math.round(def.h * s));
}

const personnages = new Map<string, Sprite | null>();

/** La clé d'un personnage peint : lequel (et sa pose), l'archipel et le palier de lumière. */
export const cleDuPersonnage = (cle: string, P: Peinture) => `${cle}:${P.cle}`;

/**
 * Le sprite d'un personnage peint (lot R6) : son raster (./personnages.ts) mis dans un canvas, une fois par personnage,
 * pose et palier de lumière (la nuit en fait un autre). Le pied du sprite est celui du modèle.
 */
export function spriteDePersonnage(cle: string, P: Peinture, raster: () => RasterDePersonnage): Sprite | null {
  const k = cleDuPersonnage(cle, P);
  if (personnages.has(k)) return personnages.get(k)!;
  const r = raster();
  const canvas = document.createElement('canvas');
  canvas.width = r.largeur;
  canvas.height = r.hauteur;
  const ctx = canvas.getContext('2d');
  let out: Sprite | null = null;
  if (ctx) {
    const img = ctx.createImageData(r.largeur, r.hauteur);
    for (let p = 0; p < r.pixels.length; p++) {
      const c = r.pixels[p];
      if (c < 0) continue;
      img.data[p * 4] = (c >> 16) & 255;
      img.data[p * 4 + 1] = (c >> 8) & 255;
      img.data[p * 4 + 2] = c & 255;
      img.data[p * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    out = { canvas, w: r.largeur, h: r.hauteur, ax: r.ax, ay: r.ay };
  }
  personnages.set(k, out);
  return out;
}
