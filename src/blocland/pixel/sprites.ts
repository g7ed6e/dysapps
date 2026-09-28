// Les sprites du décor, dessinés pixel par pixel en code (formes simples, contour sombre, lumière en haut à gauche) :
// arbres ronds, sapins, buissons, fleurs, champignons, rochers, souches, roseaux, cristaux. Rien d'emprunté.

export const SPRITE_KINDS = ['arbre', 'sapin', 'buisson', 'fleur', 'champignon', 'rocher', 'souche', 'roseau', 'cristal'] as const;
export type SpriteKind = (typeof SPRITE_KINDS)[number];

interface SpriteDef {
  w: number;
  h: number;
  /** Le pied, dans le sprite : ce point se pose au milieu de la case. */
  ax: number;
  ay: number;
  /** Largeur de l'ombre au sol (0 : pas d'ombre). */
  shadow: number;
  paint: (x: number, y: number) => string | null;
}

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;

/** Une forme remplie avec un contour : `inside` dit si le pixel est dans la forme, `fill` sa couleur. */
function outlined(inside: (x: number, y: number) => boolean, fill: (x: number, y: number) => string, line: string) {
  return (x: number, y: number) => {
    if (!inside(x, y)) return null;
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return line;
    return fill(x, y);
  };
}

/** Feuillage : clair en haut à gauche, sombre en bas à droite, quelques feuilles en relief. */
const foliage = (cx: number, cy: number, r: number, base: string, light: string, dark: string) => (x: number, y: number) => {
  const lx = x - (cx - r * 0.35);
  const ly = y - (cy - r * 0.4);
  if (lx * lx + ly * ly < (r * 0.45) ** 2) return (x + y) % 5 === 0 ? base : light;
  const dx = x - (cx + r * 0.35);
  const dy = y - (cy + r * 0.35);
  if (dx * dx + dy * dy < (r * 0.55) ** 2) return (x * 3 + y) % 7 === 0 ? base : dark;
  return (x * 7 + y * 3) % 11 === 0 ? light : base;
};

const TREE_LEAF = outlined(
  (x, y) => inEllipse(x, y, 16, 12, 12.5, 11) || inEllipse(x, y, 9, 16, 7.5, 6.5) || inEllipse(x, y, 23, 16, 7.5, 6.5),
  foliage(16, 13, 13, '#3f9a36', '#6cc449', '#2c7229'),
  '#1c4118',
);
const TREE_TRUNK = outlined((x, y) => x >= 13 && x <= 18 && y >= 18 && y <= 33, (x) => (x === 14 ? '#9a6536' : '#77492a'), '#3a2213');

const PINE_SHAPE = (x: number, y: number) => {
  if (y < 1 || y > 29) return false;
  // Trois étages : chacun s'évase vers le bas.
  const tier = y < 10 ? (y - 1) / 9 : y < 20 ? (y - 7) / 13 : (y - 15) / 14;
  const half = 2 + tier * (y < 10 ? 5 : y < 20 ? 8 : 10);
  return Math.abs(x + 0.5 - 11) <= half;
};

const DEFS: Record<SpriteKind, SpriteDef> = {
  arbre: {
    w: 32,
    h: 35,
    ax: 16,
    ay: 33,
    shadow: 22,
    paint: (x, y) => TREE_LEAF(x, y) ?? TREE_TRUNK(x, y),
  },
  sapin: {
    w: 22,
    h: 35,
    ax: 11,
    ay: 33,
    shadow: 16,
    paint: (x, y) =>
      outlined(PINE_SHAPE, (px, py) => (px < 11 && (px + py) % 4 === 0 ? '#4e9c64' : px > 12 && py % 3 === 0 ? '#1f5234' : '#2e7447'), '#143522')(x, y) ??
      outlined((px, py) => px >= 9 && px <= 12 && py >= 29 && py <= 33, () => '#77492a', '#3a2213')(x, y),
  },
  buisson: {
    w: 18,
    h: 14,
    ax: 9,
    ay: 12,
    shadow: 14,
    paint: outlined(
      (x, y) => inEllipse(x, y, 9, 8, 8, 5.5) || inEllipse(x, y, 6, 5, 4.5, 4) || inEllipse(x, y, 12, 5, 4.5, 4),
      foliage(9, 7, 8, '#3f9a36', '#6cc449', '#2c7229'),
      '#1c4118',
    ),
  },
  fleur: {
    w: 16,
    h: 11,
    ax: 8,
    ay: 9,
    shadow: 0,
    paint: (x, y) => {
      const flowers: [number, number, string][] = [
        [3, 4, '#e8475a'],
        [8, 2, '#ffd23f'],
        [12, 5, '#f4f4ff'],
      ];
      for (const [fx, fy, c] of flowers) {
        if (x === fx && y === fy) return '#ffb02e';
        if (Math.abs(x - fx) + Math.abs(y - fy) === 1) return c;
        if (x === fx && y > fy + 1 && y <= fy + 4) return '#2f7a2a';
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
    paint: (x, y) =>
      outlined(
        (px, py) => inEllipse(px, py, 5, 4, 4.5, 3.5) && py <= 4,
        (px, py) => ((px === 3 && py === 2) || (px === 6 && py === 3) ? '#fff4e0' : '#d8423a'),
        '#6b1d18',
      )(x, y) ?? outlined((px, py) => px >= 4 && px <= 5 && py >= 5 && py <= 9, () => '#f3e6cc', '#8a7a5a')(x, y),
  },
  rocher: {
    w: 16,
    h: 12,
    ax: 8,
    ay: 10,
    shadow: 14,
    paint: outlined(
      (x, y) => inEllipse(x, y, 8, 7, 7.5, 5) || inEllipse(x, y, 7, 4.5, 4.5, 3.5),
      (x, y) => (x + y < 9 ? '#c4c4cc' : x + y > 16 ? '#76767f' : '#9d9da6'),
      '#44444e',
    ),
  },
  souche: {
    w: 12,
    h: 10,
    ax: 6,
    ay: 9,
    shadow: 10,
    paint: outlined(
      (x, y) => (y >= 2 && y <= 9 && x >= 1 && x <= 10) || inEllipse(x, y, 6, 2.5, 5, 2),
      (x, y) => (y <= 3 ? ((x + y) % 3 ? '#c99b63' : '#a97a45') : x % 3 === 0 ? '#6a4124' : '#86552e'),
      '#3a2213',
    ),
  },
  roseau: {
    w: 12,
    h: 18,
    ax: 6,
    ay: 17,
    shadow: 0,
    paint: (x, y) => {
      for (const [sx, top] of [
        [2, 4],
        [6, 1],
        [9, 5],
      ]) {
        if (x === sx && y >= top && y <= top + 3) return '#7a4a26';
        if (x === sx && y > top + 3 && y <= 17) return y % 4 === 0 ? '#5f9a3a' : '#3f7a2a';
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
    paint: outlined(
      (x, y) => Math.abs(x + 0.5 - 6) <= (y < 8 ? (y + 1) * 0.6 : Math.max(1, (17 - y) * 0.5)) && y >= 0 && y <= 17,
      (x) => (x < 6 ? '#b6f2fb' : '#5fcfe4'),
      '#1f6e86',
    ),
  },
};

/** La taille d'un sprite, son pied et son ombre (la 2D peinte, ./paintedSprites.ts, garde les mêmes). */
export function spriteBox(kind: SpriteKind): { w: number; h: number; ax: number; ay: number; shadow: number } {
  const { w, h, ax, ay, shadow } = DEFS[kind];
  return { w, h, ax, ay, shadow };
}

const cache = new Map<string, HTMLCanvasElement | null>();

/** Délave une couleur (île verrouillée), comme la 3D. */
function fadeRGB(r: number, g: number, b: number): [number, number, number] {
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c: number) => (c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45;
  return [mix(r), mix(g), mix(b)];
}

function spriteCanvas(kind: SpriteKind, muted: boolean): HTMLCanvasElement | null {
  const k = `${kind}:${muted ? 1 : 0}`;
  if (cache.has(k)) return cache.get(k)!;
  const def = DEFS[kind];
  const canvas = document.createElement('canvas');
  canvas.width = def.w;
  canvas.height = def.h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(def.w, def.h);
    for (let y = 0; y < def.h; y++)
      for (let x = 0; x < def.w; x++) {
        const c = def.paint(x, y);
        if (!c) continue;
        const n = parseInt(c.slice(1), 16);
        let rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        if (muted) rgb = fadeRGB(...rgb);
        const i = (y * def.w + x) * 4;
        [img.data[i], img.data[i + 1], img.data[i + 2]] = rgb;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }
  const out = ctx ? canvas : null;
  cache.set(k, out);
  return out;
}

/**
 * Dessine un sprite, son pied au point (sx, sy) de l'écran, à l'échelle `s` (pixels d'écran par pixel de sprite) ;
 * avec `shadow`, une ombre ovale au sol dessous.
 */
export function drawSprite(ctx: CanvasRenderingContext2D, kind: SpriteKind, muted: boolean, sx: number, sy: number, s: number, shadow: boolean): void {
  const def = DEFS[kind];
  if (shadow && def.shadow) {
    ctx.fillStyle = 'rgba(20, 30, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(sx + s, sy, (def.shadow / 2) * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const img = spriteCanvas(kind, muted);
  if (img) ctx.drawImage(img, Math.round(sx - def.ax * s), Math.round(sy - def.ay * s), Math.round(def.w * s), Math.round(def.h * s));
}
