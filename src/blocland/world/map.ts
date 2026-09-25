// La carte de Blocland : un continent qui monte. Chaque île a un cœur de 12 × 12 (zone des plans, créature, décor)
// posé sur une terre plus large aux contours irréguliers, à une altitude qui monte avec la classe :
// 6e au niveau de la mer, 5e sur les collines, 4e sur les monts, 3e sur les sommets.
import type { BiomeId } from '../biomes';

export type RegionId = 'basses-terres' | 'marais' | 'feu' | 'montagne' | 'hauteurs';
export type Relief = 'plat' | 'collines' | 'montagne';

export interface IslandDef {
  id: BiomeId;
  region: RegionId;
  /** Coin (x, y) du cœur 12 × 12 dans le monde. */
  core: { x: number; y: number };
  /** Altitude du sol : 0 (mer), 3 (collines), 6 (monts), 9 (sommets). */
  altitude: number;
  /** Terre en plus autour du cœur : à gauche (x plus petit), à droite, devant (y plus petit), derrière. */
  ext: { left: number; right: number; front: number; back: number };
  relief: Relief;
  seed: number;
}

/** Côté du cœur d'une île. */
export const CORE = 12;
/** Altitude par classe. */
export const ALTITUDE: Record<'6e' | '5e' | '4e' | '3e', number> = { '6e': 0, '5e': 3, '4e': 6, '3e': 9 };

const e = (left: number, right: number, front: number, back: number) => ({ left, right, front, back });

/** Les vingt îles, placées à la main : la Forêt et la Plaine au centre, les sommets aux bords. */
export const MAP: IslandDef[] = [
  // Basses Terres (6e, français)
  { id: 'foret', region: 'basses-terres', core: { x: 44, y: 40 }, altitude: 0, ext: e(3, 3, 2, 3), relief: 'collines', seed: 11 },
  { id: 'ferme', region: 'basses-terres', core: { x: 22, y: 40 }, altitude: 0, ext: e(2, 3, 1, 3), relief: 'plat', seed: 12 },
  { id: 'mine', region: 'montagne', core: { x: 66, y: 40 }, altitude: 0, ext: e(2, 2, 2, 2), relief: 'collines', seed: 13 },
  { id: 'tour', region: 'basses-terres', core: { x: 0, y: 40 }, altitude: 0, ext: e(1, 2, 2, 2), relief: 'plat', seed: 14 },
  { id: 'carriere', region: 'montagne', core: { x: 88, y: 40 }, altitude: 0, ext: e(2, 2, 2, 2), relief: 'collines', seed: 15 },
  // Basses Terres (6e, maths)
  { id: 'plaine', region: 'basses-terres', core: { x: 44, y: 18 }, altitude: 0, ext: e(2, 2, 2, 1), relief: 'plat', seed: 16 },
  { id: 'riviere', region: 'marais', core: { x: 68, y: 16 }, altitude: 0, ext: e(2, 2, 2, 2), relief: 'plat', seed: 17 },
  { id: 'volcan', region: 'feu', core: { x: 20, y: 16 }, altitude: 0, ext: e(2, 2, 2, 3), relief: 'montagne', seed: 18 },
  // Collines (5e)
  { id: 'glacier', region: 'montagne', core: { x: 44, y: -6 }, altitude: 3, ext: e(2, 2, 2, 2), relief: 'montagne', seed: 21 },
  { id: 'marche', region: 'marais', core: { x: 70, y: -8 }, altitude: 3, ext: e(2, 2, 1, 2), relief: 'plat', seed: 22 },
  { id: 'carrefour', region: 'basses-terres', core: { x: 44, y: 64 }, altitude: 3, ext: e(2, 2, 2, 2), relief: 'collines', seed: 23 },
  { id: 'marais', region: 'marais', core: { x: 68, y: 66 }, altitude: 3, ext: e(3, 2, 2, 2), relief: 'plat', seed: 24 },
  // Monts (4e)
  { id: 'forge', region: 'feu', core: { x: 18, y: -8 }, altitude: 6, ext: e(2, 2, 2, 2), relief: 'montagne', seed: 31 },
  { id: 'atelier', region: 'hauteurs', core: { x: 94, y: -6 }, altitude: 6, ext: e(2, 2, 2, 2), relief: 'collines', seed: 32 },
  { id: 'falaise', region: 'montagne', core: { x: 16, y: 66 }, altitude: 6, ext: e(2, 2, 2, 3), relief: 'montagne', seed: 33 },
  { id: 'cabinet', region: 'hauteurs', core: { x: 92, y: 66 }, altitude: 6, ext: e(2, 2, 2, 2), relief: 'collines', seed: 34 },
  // Sommets (3e)
  { id: 'belvedere', region: 'montagne', core: { x: -8, y: -8 }, altitude: 9, ext: e(2, 2, 2, 2), relief: 'montagne', seed: 41 },
  { id: 'phare', region: 'hauteurs', core: { x: 18, y: -32 }, altitude: 9, ext: e(2, 2, 2, 2), relief: 'plat', seed: 42 },
  { id: 'donnees', region: 'hauteurs', core: { x: 72, y: -32 }, altitude: 9, ext: e(2, 2, 2, 2), relief: 'collines', seed: 43 },
  { id: 'textes', region: 'hauteurs', core: { x: -6, y: 66 }, altitude: 9, ext: e(2, 2, 2, 2), relief: 'collines', seed: 44 },
];

export function islandDef(id: BiomeId): IslandDef {
  const def = MAP.find((i) => i.id === id);
  if (!def) throw new Error(`Île inconnue : ${id}`);
  return def;
}

/** Bruit déterministe dans [0, 1) pour une case. */
export function noise(seed: number, x: number, y: number): number {
  let h = (seed * 374761393 + x * 668265263 + y * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bruit lissé (interpolation bilinéaire d'un bruit sur une grille de 4 cases). */
export function smoothNoise(seed: number, x: number, y: number, cell = 4): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = (x - gx * cell) / cell;
  const fy = (y - gy * cell) / cell;
  const n00 = noise(seed, gx, gy);
  const n10 = noise(seed, gx + 1, gy);
  const n01 = noise(seed, gx, gy + 1);
  const n11 = noise(seed, gx + 1, gy + 1);
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = n00 + (n10 - n00) * s(fx);
  const b = n01 + (n11 - n01) * s(fx);
  return a + (b - a) * s(fy);
}

/** Boîte englobante de la terre d'une île (bornes hautes exclues). */
export function landBox(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  return { x0: def.core.x - def.ext.left, y0: def.core.y - def.ext.front, x1: def.core.x + CORE + def.ext.right, y1: def.core.y + CORE + def.ext.back };
}

export function inCore(def: IslandDef, x: number, y: number): boolean {
  return x >= def.core.x && x < def.core.x + CORE && y >= def.core.y && y < def.core.y + CORE;
}

/** La case (x, y) du monde fait-elle partie de la terre de l'île ? Le cœur toujours ; autour, un contour irrégulier. */
export function isLand(def: IslandDef, x: number, y: number): boolean {
  if (inCore(def, x, y)) return true;
  const { x0, y0, x1, y1 } = landBox(def);
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  const dx = x < def.core.x ? (def.core.x - x) / (def.ext.left + 0.5) : x >= def.core.x + CORE ? (x - (def.core.x + CORE - 1)) / (def.ext.right + 0.5) : 0;
  const dy = y < def.core.y ? (def.core.y - y) / (def.ext.front + 0.5) : y >= def.core.y + CORE ? (y - (def.core.y + CORE - 1)) / (def.ext.back + 0.5) : 0;
  const d = Math.hypot(dx, dy);
  return d + (noise(def.seed, x, y) - 0.5) * 0.45 < 1;
}

/** Toutes les cases de terre d'une île. */
export function landCells(def: IslandDef): { x: number; y: number }[] {
  const { x0, y0, x1, y1 } = landBox(def);
  const out: { x: number; y: number }[] = [];
  for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) if (isLand(def, x, y)) out.push({ x, y });
  return out;
}

/**
 * Hauteur du sol hors du cœur (en blocs au-dessus de l'altitude de l'île) : plat, collines douces,
 * ou une montagne qui monte derrière le cœur, en terrasses.
 */
export function reliefHeight(def: IslandDef, x: number, y: number): number {
  if (inCore(def, x, y)) return 0;
  const n = smoothNoise(def.seed, x, y);
  if (def.relief === 'plat') return n > 0.85 ? 1 : 0;
  if (def.relief === 'collines') return Math.min(2, Math.floor(n * 3));
  // Montagne : un pic derrière le cœur, au milieu ; le reste en collines.
  const peak = { x: def.core.x + CORE / 2, y: def.core.y + CORE + def.ext.back };
  const behind = y >= def.core.y + CORE;
  if (!behind) return Math.min(1, Math.floor(n * 2));
  const dist = Math.hypot((x - peak.x) / (CORE / 2 + 1), (y - peak.y) / (def.ext.back + 1));
  return Math.max(1, Math.min(6, Math.round(6 * (1 - dist) + 1)));
}
