// Les tuiles dessinées pour la 2D, pixel par pixel, en code (rien d'emprunté) : une palette courte et franche, des
// motifs (touffes d'herbe, grains de sable, pavés, vaguelettes) et, pour les faces avant, des falaises à strates.
// Quatre variantes par sol, choisies par la case : le sol ne se répète pas.
import { PAINTERS, SIZE, type TextureKind } from '../world/pixels';
import type { Material } from './surface';
import { fadeRgb, hexToRgb, type RGB } from '../../core/color';
import { cellHash } from '../../core/random';

/** Les couleurs de chaque sol : fond, ombre, lumière (les franges d'un sol chez son voisin les reprennent). */
export const PALETTE: Record<Exclude<Material, 'autre'>, { base: string; dark: string; light: string }> = {
  herbe: { base: '#5cb33a', dark: '#3e8a2b', light: '#8ad35c' },
  sable: { base: '#ecd8a0', dark: '#cfb479', light: '#f8edca' },
  terre: { base: '#a2703f', dark: '#7a5030', light: '#c08b56' },
  pierre: { base: '#a7a7b0', dark: '#6c6c78', light: '#cdcdd4' },
  eau: { base: '#3f8fd8', dark: '#2d6fb5', light: '#94cdf3' },
  neige: { base: '#eef4fa', dark: '#c9d7e6', light: '#ffffff' },
  mousse: { base: '#4f8a3a', dark: '#355f27', light: '#76ad55' },
  basalte: { base: '#524a50', dark: '#332d32', light: '#736a70' },
  lave: { base: '#ff7a1a', dark: '#c73f0b', light: '#ffd24a' },
  glace: { base: '#bfe6f2', dark: '#8cc2d6', light: '#f0fbff' },
};

/** Les falaises (faces avant) : la roche ou la terre sous chaque sol. */
const CLIFF: Record<Exclude<Material, 'autre'>, { base: string; dark: string; light: string }> = {
  herbe: { base: '#8a5a35', dark: '#633f24', light: '#a4703f' },
  terre: { base: '#8a5a35', dark: '#633f24', light: '#a4703f' },
  sable: { base: '#d6b977', dark: '#b39459', light: '#e8d196' },
  pierre: { base: '#85858f', dark: '#5d5d69', light: '#a2a2ac' },
  eau: { base: '#8a5a35', dark: '#633f24', light: '#a4703f' },
  neige: { base: '#b8c6d6', dark: '#8d9db0', light: '#dde6ef' },
  mousse: { base: '#5e4630', dark: '#3f2e1f', light: '#76593c' },
  basalte: { base: '#3f393e', dark: '#262226', light: '#5a5358' },
  lave: { base: '#3f393e', dark: '#262226', light: '#5a5358' },
  glace: { base: '#9fd0e2', dark: '#6fa8c0', light: '#d9f2fb' },
};

type Grid = RGB[][];
const grid = (fill: string): Grid => Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => hexToRgb(fill)));
const set = (g: Grid, x: number, y: number, c: string) => {
  if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) g[y][x] = hexToRgb(c);
};

/** Le dessus d'un sol, variante 0 à 3. */
function paintTop(m: Exclude<Material, 'autre'>, v: number): Grid {
  const p = PALETTE[m];
  const g = grid(p.base);
  const r = (i: number) => cellHash(v, i, 7 + m.length);
  switch (m) {
    case 'herbe':
      // Des touffes en V, sombres, avec un brin clair ; quelques brins isolés.
      for (let k = 0; k < 3; k++) {
        const x = 1 + Math.floor(r(k) * 12);
        const y = 2 + Math.floor(r(k + 10) * 11);
        set(g, x, y, p.dark);
        set(g, x + 2, y, p.dark);
        set(g, x + 1, y + 1, p.dark);
        set(g, x + 1, y - 1, p.light);
      }
      for (let k = 0; k < 5; k++) set(g, Math.floor(r(k + 20) * 16), Math.floor(r(k + 30) * 16), r(k + 40) > 0.5 ? p.light : p.dark);
      break;
    case 'sable':
      for (let k = 0; k < 9; k++) set(g, Math.floor(r(k) * 16), Math.floor(r(k + 50) * 16), k % 3 ? p.dark : p.light);
      break;
    case 'terre':
      for (let k = 0; k < 4; k++) {
        const x = Math.floor(r(k) * 14);
        const y = Math.floor(r(k + 9) * 14);
        set(g, x, y, p.dark);
        set(g, x + 1, y, p.dark);
        set(g, x, y - 1, p.light);
      }
      break;
    case 'pierre': {
      // Des pavés : joints sombres, lumière en haut à gauche, ombre en bas à droite.
      const off = v % 2 ? 4 : 0;
      for (let y = 0; y < SIZE; y++)
        for (let x = 0; x < SIZE; x++) {
          const row = y < 8 ? 0 : 1;
          const bx = (x + (row ? off + 4 : off)) % 8;
          const by = y % 8;
          if (by === 7 || bx === 7) set(g, x, y, p.dark);
          else if (by === 0 || bx === 0) set(g, x, y, p.light);
          else if (by === 6 || bx === 6) set(g, x, y, '#90909a');
        }
      break;
    }
    case 'eau':
      for (let k = 0; k < 3; k++) {
        const x = Math.floor(r(k) * 11);
        const y = 2 + Math.floor(r(k + 5) * 12);
        for (let i = 0; i < 4; i++) set(g, x + i, y - (i === 1 || i === 2 ? 1 : 0), p.light);
      }
      break;
    case 'neige':
      for (let k = 0; k < 6; k++) set(g, Math.floor(r(k) * 16), Math.floor(r(k + 60) * 16), k % 2 ? p.dark : p.light);
      break;
    case 'mousse':
      // Une mousse spongieuse : des coussinets sombres, une flaque de temps en temps.
      for (let k = 0; k < 4; k++) {
        const x = Math.floor(r(k) * 13);
        const y = Math.floor(r(k + 30) * 13);
        set(g, x, y, p.dark);
        set(g, x + 1, y, p.dark);
        set(g, x, y + 1, p.dark);
        set(g, x + 1, y - 1, p.light);
      }
      if (v === 3) for (let i = 0; i < 4; i++) set(g, 6 + i, 10, '#5f8fa6');
      break;
    case 'basalte':
      // Des dalles de roche volcanique : joints sombres en quinconce.
      for (let y = 0; y < SIZE; y++)
        for (let x = 0; x < SIZE; x++) {
          const bx = (x + (y < 8 ? 0 : 5) + v) % 8;
          if (y % 8 === 7 || bx === 7) set(g, x, y, p.dark);
          else if (y % 8 === 0 || bx === 0) set(g, x, y, p.light);
        }
      break;
    case 'lave':
      // Une croûte sombre qui craquelle sur le feu.
      for (let k = 0; k < 5; k++) {
        const x = Math.floor(r(k) * 14);
        const y = Math.floor(r(k + 70) * 14);
        set(g, x, y, p.dark);
        set(g, x + 1, y, p.dark);
        set(g, x + 1, y + 1, p.dark);
      }
      for (let k = 0; k < 4; k++) set(g, Math.floor(r(k + 80) * 16), Math.floor(r(k + 90) * 16), p.light);
      break;
    case 'glace':
      // Des reflets en biais.
      for (let k = 0; k < 2; k++) {
        const x0 = Math.floor(r(k) * 10);
        const y0 = 3 + Math.floor(r(k + 5) * 9);
        for (let i = 0; i < 4; i++) set(g, x0 + i, y0 - i, p.light);
      }
      for (let k = 0; k < 3; k++) set(g, Math.floor(r(k + 12) * 16), Math.floor(r(k + 22) * 16), p.dark);
      break;
  }
  return g;
}

/**
 * Une face avant : la falaise sous un sol. Des strates irrégulières, une lumière en haut et une ombre en bas ; sous
 * l'herbe (`lip`), le gazon déborde sur le haut en frange.
 */
function paintCliff(m: Exclude<Material, 'autre'>, v: number, lip: boolean): Grid {
  const c = CLIFF[m];
  const g = grid(c.base);
  if (m === 'basalte' || m === 'lave' || m === 'glace') {
    // Des orgues de basalte (ou des colonnes de glace) : des fûts verticaux.
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const col = (x + v) % 5;
        if (col === 4) set(g, x, y, c.dark);
        else if (col === 0) set(g, x, y, c.light);
        if (y % 7 === 6 && cellHash(x, v, 4) > 0.5) set(g, x, y, c.dark);
      }
    return g;
  }
  for (let x = 0; x < SIZE; x++) {
    const s1 = 5 + Math.floor(cellHash(x >> 2, v, 3) * 2);
    const s2 = 11 + Math.floor(cellHash(x >> 2, v, 5) * 2);
    set(g, x, s1, c.dark);
    set(g, x, s2, c.dark);
    set(g, x, s1 - 1, c.light);
    if (cellHash(x, v, 9) > 0.8) set(g, x, 8, c.light);
  }
  if (lip) {
    const grass = PALETTE[m === 'neige' || m === 'mousse' ? m : 'herbe'];
    for (let x = 0; x < SIZE; x++) {
      const d = 2 + Math.floor(cellHash(x, v, 11) * 3);
      for (let y = 0; y < d; y++) set(g, x, y, y === d - 1 ? grass.dark : grass.base);
    }
  }
  return g;
}

/** Délave une grille (île verrouillée), comme la 3D. */
function fade(g: Grid): Grid {
  return g.map((row) =>
    row.map(([r, gg, b]) => fadeRgb(r, gg, b)),
  );
}

function toCanvas(g: Grid): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      [img.data[i], img.data[i + 1], img.data[i + 2]] = g[y][x];
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const cache = new Map<string, HTMLCanvasElement | null>();

/** La tuile dessinée d'un dessus (`top`) ou d'une falaise (`front`, `lip` : sous le bord du sol). */
export function designedTile(m: Exclude<Material, 'autre'>, kind: 'top' | 'front', variant: number, muted = false, lip = false): HTMLCanvasElement | null {
  const k = `${m}:${kind}:${variant}:${muted ? 1 : 0}:${lip ? 1 : 0}`;
  if (cache.has(k)) return cache.get(k)!;
  const g = kind === 'top' ? paintTop(m, variant) : paintCliff(m, variant, lip);
  const out = toCanvas(muted ? fade(g) : g);
  cache.set(k, out);
  return out;
}

/**
 * Les blocs dont la texture est un grain (bon en 3D, brouillé de près en 2D) : leur dessus devient un dallage dessiné,
 * aux couleurs moyennes du bloc. Les textures à motif (planches, briques, tuiles, rails…) restent telles quelles.
 */
const GRAINY = new Set<string>([
  'obsidienne', 'marbre', 'quartz', 'ardoise', 'parchemin', 'acier', 'calque', 'velours', 'toile', 'tourbe', 'prisme',
  'lentille', 'cabine', 'cadran', 'antenne', 'taille', 'or', 'cristal',
]);

export const isGrainy = (texture: string | undefined): texture is TextureKind => Boolean(texture && GRAINY.has(texture) && texture in PAINTERS);

/** La couleur moyenne du dessus d'un bloc (sa texture peinte une fois, sans canvas). */
function averageTop(kind: TextureKind): RGB {
  let s = 1;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const sum = [0, 0, 0];
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const c = PAINTERS[kind].top(x, y, r);
      for (let i = 0; i < 3; i++) sum[i] += c[i];
    }
  return sum.map((v) => v / (SIZE * SIZE)) as RGB;
}

const shadeRGB = ([r, g, b]: RGB, k: number): RGB => [r, g, b].map((c) => Math.max(0, Math.min(255, c + 255 * k))) as RGB;

/** Un dallage aux couleurs d'un bloc : grandes dalles en quinconce, joint sombre, arête claire, quelques éclats. */
export function pavedTile(kind: TextureKind, variant: number, muted = false): HTMLCanvasElement | null {
  const k = `dalle:${kind}:${variant}:${muted ? 1 : 0}`;
  if (cache.has(k)) return cache.get(k)!;
  const base = averageTop(kind);
  const dark = shadeRGB(base, -0.2);
  const light = shadeRGB(base, 0.14);
  const g: Grid = [];
  for (let y = 0; y < SIZE; y++) {
    const row: RGB[] = [];
    for (let x = 0; x < SIZE; x++) {
      const bx = (x + (y < 8 ? 0 : 4) + variant * 2) % 8;
      const by = y % 8;
      if (by === 7 || bx === 7) row.push(dark);
      else if (by === 0 || bx === 0) row.push(light);
      else if (cellHash(x, y, variant + 40) > 0.94) row.push(shadeRGB(base, -0.08));
      else row.push(base);
    }
    g.push(row);
  }
  const out = toCanvas(muted ? fade(g) : g);
  cache.set(k, out);
  return out;
}

/** La couleur d'un sol pour ses franges (délavée sur une île verrouillée). */
export function fringeColors(m: Exclude<Material, 'autre'>, muted: boolean): { base: string; dark: string } {
  const p = PALETTE[m];
  if (!muted) return p;
  const f = (h: string) => {
    const [r, g, b] = fade([[hexToRgb(h)]])[0][0];
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };
  return { base: f(p.base), dark: f(p.dark) };
}
