// La carte de Blocland : quatre archipels, un par classe, dans un seul repère de coordonnées. Chaque île a un cœur de
// 16 × 16 (bornes de quête, zone des plans, créature, décor) posé sur une terre bien plus large aux côtes irrégulières
// (baies, caps), avec ses collines, ses pics, ses lacs, sa végétation. Les archipels occupent des bandes de y disjointes :
// les Basses Terres (6e) au niveau de la mer, les Collines du Large (5e), les Monts de Feu (4e) et les Îles du Ciel (3e),
// chacun à son altitude, qui est une ambiance : les Îles du Ciel flottent au-dessus des nuages.
import { BIOMES, type BiomeId, type Classe } from '../biomes';

export type RegionId = 'basses-terres' | 'marais' | 'feu' | 'montagne' | 'hauteurs';
export type Relief = 'plat' | 'collines' | 'montagne' | 'volcan';

/** Un archipel par classe : la scène 3D, la Carte et la mer sont celles d'un archipel. */
export type ArchipelagoId = Classe;

export interface IslandDef {
  id: BiomeId;
  region: RegionId;
  /** Coin (x, y) du cœur 16 × 16 dans le monde. */
  core: { x: number; y: number };
  /** Altitude du sol : 0 (mer), 3 (collines), 6 (monts), 9 (sommets). */
  altitude: number;
  /** Terre en plus autour du cœur : à gauche (x plus petit), à droite, devant (y plus petit), derrière. */
  ext: { left: number; right: number; front: number; back: number };
  relief: Relief;
  seed: number;
}

/** Côté du cœur d'une île. */
export const CORE = 16;
/** Altitude par classe (uniforme dans un archipel). */
export const ALTITUDE: Record<ArchipelagoId, number> = { '6e': 0, '5e': 3, '4e': 6, '3e': 9 };

const e = (left: number, right: number, front: number, back: number) => ({ left, right, front, back });

/**
 * Les vingt îles, placées à la main. Les Basses Terres (6e) : la Forêt et la Plaine au centre. Les trois autres archipels
 * sont des bandes plus au nord (y ≈ 300, 600, 900), jamais visibles depuis la 6e : chaque archipel est sa propre scène.
 * Dans chaque archipel, l'île-port est celle dont le quai (devant, côté −y) accueille le Bloc-Navire.
 */
export const MAP: IslandDef[] = [
  // Basses Terres (6e), au niveau de la mer. Port : la Plaine.
  { id: 'foret', region: 'basses-terres', core: { x: 67, y: 59 }, altitude: 0, ext: e(6, 5, 3, 6), relief: 'collines', seed: 11 },
  { id: 'ferme', region: 'basses-terres', core: { x: 27, y: 61 }, altitude: 0, ext: e(3, 4, 2, 4), relief: 'plat', seed: 12 },
  { id: 'mine', region: 'montagne', core: { x: 96, y: 61 }, altitude: 0, ext: e(3, 4, 2, 5), relief: 'montagne', seed: 13 },
  { id: 'tour', region: 'basses-terres', core: { x: -3, y: 56 }, altitude: 0, ext: e(2, 3, 2, 3), relief: 'plat', seed: 14 },
  { id: 'carriere', region: 'montagne', core: { x: 136, y: 56 }, altitude: 0, ext: e(3, 3, 2, 4), relief: 'collines', seed: 15 },
  { id: 'plaine', region: 'basses-terres', core: { x: 64, y: 21 }, altitude: 0, ext: e(5, 5, 3, 2), relief: 'plat', seed: 16 },
  { id: 'riviere', region: 'marais', core: { x: 109, y: 19 }, altitude: 0, ext: e(4, 4, 3, 3), relief: 'plat', seed: 17 },
  { id: 'volcan', region: 'feu', core: { x: 21, y: 19 }, altitude: 0, ext: e(4, 4, 2, 6), relief: 'volcan', seed: 18 },
  // Collines du Large (5e), sur les collines : deux paires d'isthmes l'une devant l'autre. Port : le Marché.
  { id: 'glacier', region: 'montagne', core: { x: 40, y: 320 }, altitude: 3, ext: e(4, 4, 3, 6), relief: 'montagne', seed: 21 },
  { id: 'marche', region: 'marais', core: { x: 69, y: 317 }, altitude: 3, ext: e(3, 4, 2, 3), relief: 'plat', seed: 22 },
  { id: 'carrefour', region: 'basses-terres', core: { x: 40, y: 362 }, altitude: 3, ext: e(4, 4, 3, 4), relief: 'collines', seed: 23 },
  { id: 'marais', region: 'marais', core: { x: 69, y: 367 }, altitude: 3, ext: e(4, 4, 2, 4), relief: 'plat', seed: 24 },
  // Monts de Feu (4e), sur les monts : une crête en ligne brisée. Port : l'Atelier.
  { id: 'forge', region: 'feu', core: { x: 30, y: 618 }, altitude: 6, ext: e(3, 4, 2, 5), relief: 'montagne', seed: 31 },
  { id: 'atelier', region: 'hauteurs', core: { x: 62, y: 632 }, altitude: 6, ext: e(3, 3, 2, 4), relief: 'collines', seed: 32 },
  { id: 'falaise', region: 'montagne', core: { x: 94, y: 618 }, altitude: 6, ext: e(3, 4, 2, 7), relief: 'montagne', seed: 33 },
  { id: 'cabinet', region: 'hauteurs', core: { x: 126, y: 632 }, altitude: 6, ext: e(3, 3, 2, 4), relief: 'collines', seed: 34 },
  // Îles du Ciel (3e), sur les sommets : un arc, le Phare devant au centre. Port : le Phare.
  { id: 'belvedere', region: 'montagne', core: { x: 20, y: 930 }, altitude: 9, ext: e(3, 3, 2, 6), relief: 'montagne', seed: 41 },
  { id: 'phare', region: 'hauteurs', core: { x: 58, y: 912 }, altitude: 9, ext: e(3, 3, 3, 3), relief: 'collines', seed: 42 },
  { id: 'donnees', region: 'hauteurs', core: { x: 96, y: 930 }, altitude: 9, ext: e(4, 3, 3, 3), relief: 'collines', seed: 43 },
  { id: 'textes', region: 'hauteurs', core: { x: 58, y: 960 }, altitude: 9, ext: e(3, 3, 2, 5), relief: 'collines', seed: 44 },
];

/** La classe (l'archipel) d'une île. */
export function archipelagoOfIsland(id: BiomeId): ArchipelagoId {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) throw new Error(`Île inconnue : ${id}`);
  return biome.classe;
}

/** Les archipels, du premier (le départ) au dernier. */
export const ARCHIPELAGO_IDS: ArchipelagoId[] = ['6e', '5e', '4e', '3e'];

/** Les îles d'un archipel, dans l'ordre de MAP. */
export function mapOf(a: ArchipelagoId): IslandDef[] {
  return MAP.filter((d) => archipelagoOfIsland(d.id) === a);
}

/**
 * Les isthmes : deux îles voisines de même niveau, côte à côte, partagent une bande de terre. Le monde n'est plus
 * un semis d'îles : quatre paires forment de petits continents. L'ouvrage entre elles est un sentier.
 */
export const ISTHMUSES: [BiomeId, BiomeId][] = [
  ['foret', 'mine'],
  ['ferme', 'tour'],
  ['glacier', 'marche'],
  ['carrefour', 'marais'],
];

/** L'île avec laquelle une île partage un isthme, s'il y en a un. */
export function isthmusOf(id: BiomeId): BiomeId | null {
  const pair = ISTHMUSES.find(([a, b]) => a === id || b === id);
  return pair ? (pair[0] === id ? pair[1] : pair[0]) : null;
}

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

/** Bruit lissé (interpolation bilinéaire d'un bruit sur une grille de `cell` cases). */
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

/** L'île qui « possède » l'isthme (la première de la paire) et sa voisine, ou null. */
function isthmusPair(def: IslandDef): { owner: IslandDef; other: IslandDef } | null {
  const pair = ISTHMUSES.find(([a]) => a === def.id);
  if (!pair) return null;
  return { owner: def, other: islandDef(pair[1]) };
}

/** Les rangées de l'isthme entre deux îles côte à côte, pour une colonne x : bornes [y0, y1), bords adoucis par un bruit. */
function isthmusRows(owner: IslandDef, other: IslandDef, x: number): { y0: number; y1: number } {
  const y0 = Math.max(owner.core.y, other.core.y) + 1;
  const y1 = Math.min(owner.core.y + CORE, other.core.y + CORE) - 1;
  const n0 = Math.floor(smoothNoise(owner.seed + 17, x, 0, 3) * 2.5);
  const n1 = Math.floor(smoothNoise(owner.seed + 19, x, 7, 3) * 2.5);
  return { y0: y0 + n0, y1: y1 - n1 };
}

/** La case (x, y) est-elle sur l'isthme que possède cette île ? (Jamais sur la terre propre de la voisine.) */
export function inIsthmus(def: IslandDef, x: number, y: number): boolean {
  const pair = isthmusPair(def);
  if (!pair) return false;
  const { owner, other } = pair;
  const left = owner.core.x < other.core.x ? owner : other;
  const right = left === owner ? other : owner;
  if (x < left.core.x + CORE || x >= right.core.x) return false;
  const { y0, y1 } = isthmusRows(owner, other, x);
  if (y < y0 || y >= y1) return false;
  return !isLandProper(other, x, y);
}

/** Boîte englobante de la terre d'une île (bornes hautes exclues), isthme compris. */
export function landBox(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  const box = { x0: def.core.x - def.ext.left, y0: def.core.y - def.ext.front, x1: def.core.x + CORE + def.ext.right, y1: def.core.y + CORE + def.ext.back };
  const pair = isthmusPair(def);
  if (pair) {
    box.x0 = Math.min(box.x0, pair.other.core.x + CORE);
    box.x1 = Math.max(box.x1, pair.other.core.x);
  }
  return box;
}

export function inCore(def: IslandDef, x: number, y: number): boolean {
  return x >= def.core.x && x < def.core.x + CORE && y >= def.core.y && y < def.core.y + CORE;
}

/** Distance normalisée au cœur (0 sur le cœur, 1 au bord de la boîte). */
function coreDistance(def: IslandDef, x: number, y: number): number {
  const dx = x < def.core.x ? (def.core.x - x) / (def.ext.left + 0.5) : x >= def.core.x + CORE ? (x - (def.core.x + CORE - 1)) / (def.ext.right + 0.5) : 0;
  const dy = y < def.core.y ? (def.core.y - y) / (def.ext.front + 0.5) : y >= def.core.y + CORE ? (y - (def.core.y + CORE - 1)) / (def.ext.back + 0.5) : 0;
  return Math.hypot(dx, dy);
}

/**
 * La case (x, y) du monde fait-elle partie de la terre de l'île ? Le cœur toujours ; autour, une côte
 * irrégulière : baies et caps dessinés par un bruit lissé, plus un léger grain.
 */
export function isLand(def: IslandDef, x: number, y: number): boolean {
  return isLandProper(def, x, y) || inIsthmus(def, x, y);
}

/** La terre propre d'une île (sans l'isthme). */
function isLandProper(def: IslandDef, x: number, y: number): boolean {
  if (inCore(def, x, y)) return true;
  const x0 = def.core.x - def.ext.left;
  const y0 = def.core.y - def.ext.front;
  const x1 = def.core.x + CORE + def.ext.right;
  const y1 = def.core.y + CORE + def.ext.back;
  if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
  const d = coreDistance(def, x, y);
  const coast = (smoothNoise(def.seed, x, y, 5) - 0.5) * 0.7 + (noise(def.seed + 1, x, y) - 0.5) * 0.15;
  return d + coast < 0.92;
}

/** Toutes les cases de terre d'une île. */
export function landCells(def: IslandDef): { x: number; y: number }[] {
  const { x0, y0, x1, y1 } = landBox(def);
  const out: { x: number; y: number }[] = [];
  for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) if (isLand(def, x, y)) out.push({ x, y });
  return out;
}

/** Nature du sol d'une case hors du cœur. */
export type Ground = 'herbe' | 'sable' | 'roche' | 'neige' | 'eau' | 'lave' | 'glace' | 'basalte' | 'mousse';

/** Un élément de décor posé sur la terre autour du cœur. */
export type Decor = 'arbre' | 'sapin' | 'buisson' | 'fleur' | 'rocher' | 'roseau' | 'cristal' | 'souche' | 'champignon';

export interface LandCell {
  x: number;
  y: number;
  /** Hauteur du sol au-dessus de l'altitude de l'île (négatif : creux d'un lac ou d'un cratère). */
  h: number;
  ground: Ground;
  decor?: Decor;
}

/** Les pics d'une île (relatifs au coin du cœur) : centre, hauteur, rayon. */
function peaks(def: IslandDef): { x: number; y: number; h: number; r: number }[] {
  const back = def.core.y + CORE + def.ext.back - 1;
  const mid = def.core.x + CORE / 2;
  if (def.relief === 'montagne') {
    const two = def.ext.back >= 6;
    return two
      ? [
          { x: mid - 3, y: back - 1, h: 9, r: 6 },
          { x: mid + 4, y: back - 2, h: 6, r: 4 },
        ]
      : [{ x: mid + 1, y: back - 1, h: 7, r: 5 }];
  }
  if (def.relief === 'volcan') return [{ x: mid, y: back - 2, h: 8, r: 6 }];
  return [];
}

const landscapeCache = new Map<BiomeId, LandCell[]>();

/** Le paysage d'une île : chaque case de terre hors du cœur avec sa hauteur, son sol et son décor (mémorisé). */
export function landscape(def: IslandDef): LandCell[] {
  const cached = landscapeCache.get(def.id);
  if (cached) return cached;
  const out = computeLandscape(def);
  landscapeCache.set(def.id, out);
  return out;
}

function computeLandscape(def: IslandDef): LandCell[] {
  const cells = landCells(def);
  const isLandAt = (x: number, y: number) => isLand(def, x, y);
  const pk = peaks(def);
  const out: LandCell[] = [];
  for (const c of cells) {
    if (inCore(def, c.x, c.y)) continue;
    const n = smoothNoise(def.seed + 7, c.x, c.y, 4);
    const fine = noise(def.seed + 3, c.x, c.y);
    const edge = !isLandAt(c.x - 1, c.y) || !isLandAt(c.x + 1, c.y) || !isLandAt(c.x, c.y - 1) || !isLandAt(c.x, c.y + 1);
    const nearCore = coreDistance(def, c.x, c.y) < 0.35;
    if (inIsthmus(def, c.x, c.y)) {
      // L'isthme : une bande plate qui relie deux îles, herbe et sable au bord, quelques buissons.
      const sandy = edge && def.altitude === 0 && def.region !== 'feu';
      const ground: Ground = sandy ? 'sable' : def.region === 'feu' ? 'basalte' : def.region === 'marais' ? 'mousse' : def.id === 'glacier' ? 'glace' : 'herbe';
      out.push({ x: c.x, y: c.y, h: 0, ground, decor: !edge && fine > 0.8 ? pickDecor(def, ground, 0, fine) : undefined });
      continue;
    }
    // Hauteur : collines douces, puis les pics par-dessus.
    let h = def.relief === 'plat' ? (n > 0.8 ? 1 : 0) : Math.min(2, Math.floor(n * 3));
    let crater = false;
    for (const p of pk) {
      const d = Math.hypot(c.x - p.x, c.y - p.y) / p.r;
      if (d < 1) {
        const ph = Math.round(p.h * (1 - d * d));
        if (def.relief === 'volcan' && d < 0.3) {
          crater = true;
          h = Math.max(h, p.h - 2);
        } else h = Math.max(h, ph);
      }
    }
    if (edge) h = Math.min(h, 1);
    if (nearCore) h = Math.min(h, 1);
    // Sol.
    let ground: Ground = 'herbe';
    if (def.region === 'feu') ground = 'basalte';
    else if (def.region === 'hauteurs') ground = h > 0 ? 'roche' : 'herbe';
    else if (def.region === 'marais') ground = 'mousse';
    if (def.id === 'glacier') ground = 'glace';
    if (h >= 3) ground = def.region === 'feu' ? 'basalte' : 'roche';
    if (h >= 5 && def.region !== 'feu') ground = 'neige';
    if (def.id === 'glacier' && h >= 2) ground = 'neige';
    if (crater) ground = 'lave';
    if (edge && def.altitude === 0 && h === 0 && def.region !== 'feu') ground = 'sable';
    // Lacs et mares : dans un creux, loin du bord et du cœur.
    let decor: Decor | undefined;
    if (!edge && !nearCore && h === 0 && smoothNoise(def.seed + 11, c.x, c.y, 3) > 0.78 && def.relief !== 'volcan') {
      ground = 'eau';
      h = -1;
    } else if (h <= 2 && !edge && fine > 0.62) {
      decor = pickDecor(def, ground, h, fine);
    }
    out.push({ x: c.x, y: c.y, h, ground, decor });
  }
  return out;
}

function pickDecor(def: IslandDef, ground: Ground, h: number, r: number): Decor | undefined {
  if (ground === 'eau' || ground === 'lave' || ground === 'sable') return undefined;
  const t = (r - 0.62) / 0.38; // 0..1
  switch (def.region) {
    case 'basses-terres':
      return t > 0.8 ? 'arbre' : t > 0.55 ? 'buisson' : t > 0.42 ? 'fleur' : t > 0.34 ? 'champignon' : undefined;
    case 'marais':
      return t > 0.85 ? 'arbre' : t > 0.5 ? 'roseau' : t > 0.3 ? 'champignon' : undefined;
    case 'feu':
      return t > 0.85 ? 'souche' : t > 0.6 ? 'rocher' : undefined;
    case 'montagne':
      if (ground === 'neige' || ground === 'glace') return t > 0.85 ? 'rocher' : undefined;
      return t > 0.75 ? 'sapin' : t > 0.55 ? 'rocher' : t > 0.4 && h === 0 ? 'fleur' : undefined;
    case 'hauteurs':
      return t > 0.8 ? 'cristal' : t > 0.6 ? 'rocher' : t > 0.45 && h === 0 ? 'sapin' : undefined;
  }
}

/** Hauteur du sol hors du cœur (compatibilité : la même que dans `landscape`). */
export function reliefHeight(def: IslandDef, x: number, y: number): number {
  if (inCore(def, x, y)) return 0;
  const cell = landscape(def).find((c) => c.x === x && c.y === y);
  return cell ? Math.max(0, cell.h) : 0;
}
