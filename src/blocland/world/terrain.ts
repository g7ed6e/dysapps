// Le terrain du village : une île par biome (cœur 16 × 16 avec bornes de mission, relief léger, décor et créature, posé sur une terre
// plus large au relief varié, à son altitude), reliées par des ponts et des rampes de bois.
// Générateur pur (sans Three.js) : testable, et partagé entre la 3D et la vue simple. Le décor (arbres, décor du cœur,
// repères, cascades, habillage de la mer) est dessiné par ./decor.ts, et posé ici.
import { BIOMES, BLOCKS, type BiomeDef, type BiomeId } from '../biomes';
import { ARCHIPELAGOS, BRIDGES, bridgeState, bridgesOf, getArchipelago, isBiomeUnlocked, islandsOf, otherEnd, reachableIslands, type BridgeDef } from './archipelago';
import { walkPath, type WalkGround } from './paths';
import {
  CORE,
  archipelagoOfIsland,
  DANS_LE_CIEL,
  inCore,
  isLand,
  islandDef,
  landBox,
  landCells,
  landscape,
  smoothNoise,
  mapOf,
  noise,
  type ArchipelagoId,
  type Decor,
  type Ground,
  type IslandDef,
  type LandCell,
} from './map';
import { DOCK_DX, VEHICLE_DECK, dockBox, dockCells, dockOrigin, dockPosts, shoreY, vehicleRestZ } from './harbour';
import { villageStage } from './villageStage';
import { kitReady, launchedStages, stageBuildingAt } from './vehicle';
import { groundLevelAt } from './ground';
import { CREATURE_CUBES } from './personnages/creatures';
import { GUARDIAN_CUBES } from './personnages/gardiens';
import { guardianStatus } from '../boss';
import type { PlaceId, VillagePlaceId, VoxelCube } from './cube';
import type { Village } from '../engine';
import { PLAN_ZONE, isPlanDone, planCells, plansFor } from './plans';
import { MONUMENT_ISLET, monumentsOf, type MonumentDef } from './monuments';
import {
  BASALT,
  CRYSTAL,
  DARK,
  DECOR,
  GRASS,
  HAY,
  LAVA,
  LEAF,
  MOSS,
  PINE,
  PUFFS,
  SMOKE,
  SNOW,
  TRUNK,
  WATER,
  cascades,
  decorate,
  landmark,
  semerLaMer,
  type Put,
} from './decor';

/** Côté du cœur d'une île (en blocs). */
export const ISLAND = CORE;
/** Nombre de couches de terre sous le sol (visibles au-dessus de l'eau, sur les berges). */
export const DEPTH = 2;
/** Couches de roche qui s'amincissent sous une île en altitude (elle flotte). */
export const TAPER = 3;


/** Couleur délavée d'une île verrouillée (même calcul que la texture délavée en 3D). */
export function fade(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const mix = (c: number) => Math.round((c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45);
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`;
}

/** Textures 3D par couleur de décor (les couleurs servent aussi à la vue simple et aux îles verrouillées). */
const TEXTURES: Record<string, string> = {
  [TRUNK]: 'tronc',
  [LEAF]: 'feuilles',
  [GRASS]: 'herbe',
  [BLOCKS.terre.side]: 'terre',
  [BLOCKS.pierre.side]: 'pierre',
  [BLOCKS.sable.side]: 'sable',
  [BLOCKS.verre.side]: 'verre',
  [BLOCKS.or.side]: 'or',
  [BLOCKS.bois.side]: 'planches',
  [BLOCKS.brique.side]: 'brique',
  [BLOCKS.galet.side]: 'galet',
  [BLOCKS.obsidienne.side]: 'obsidienne',
  [BLOCKS.glace.side]: 'glace',
  [BLOCKS.toile.side]: 'toile',
  [BLOCKS.panneau.side]: 'panneau',
  [BLOCKS.tourbe.side]: 'tourbe',
  [BLOCKS.acier.side]: 'acier',
  [BLOCKS.calque.side]: 'calque',
  [BLOCKS.ardoise.side]: 'ardoise',
  [BLOCKS.parchemin.side]: 'parchemin',
  [BLOCKS.marbre.side]: 'marbre',
  [BLOCKS.quartz.side]: 'quartz',
  [BLOCKS.prisme.side]: 'prisme',
  [BLOCKS.lentille.side]: 'lentille',
  [BLOCKS.cabine.side]: 'cabine',
  [BLOCKS.cadran.side]: 'cadran',
  [BLOCKS.tuile.side]: 'tuile',
  [BLOCKS.lambris.side]: 'lambris',
  [BLOCKS.velours.side]: 'velours',
  [BLOCKS.rail.side]: 'rail',
  [BLOCKS.antenne.side]: 'antenne',
  [BLOCKS.taille.side]: 'taille',
  [BLOCKS.lanterne.side]: 'lanterne',
  [BLOCKS.barriere.side]: 'barriere',
  [BLOCKS.escalier.side]: 'escalier',
  [SNOW]: 'nuage',
  [HAY]: 'or',
  [MOSS]: 'mousse',
  [BASALT]: 'basalte',
  [LAVA]: 'lave',
  [WATER]: 'eau',
  [PINE]: 'sapin',
  [CRYSTAL]: 'cristal',
};

/** Couleur du dessus d'une case de paysage selon son sol. */
const GROUND_COLOR: Record<Ground, string> = {
  herbe: GRASS,
  sable: BLOCKS.sable.side,
  roche: BLOCKS.pierre.side,
  neige: SNOW,
  eau: WATER,
  lave: LAVA,
  glace: BLOCKS.glace.side,
  basalte: BASALT,
  mousse: MOSS,
};

/** Coin (x, y) du cœur de l'île d'un biome et altitude de son sol. */
export function islandOrigin(index: number): { ox: number; oy: number; oz: number } {
  const def = islandDef(BIOMES[index].id);
  return { ox: def.core.x, oy: def.core.y, oz: def.altitude };
}

/** Centre du cœur d'une île (coordonnées de grille) et altitude, pour y amener la caméra. */
export function islandCenter(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  return { x: def.core.x + CORE / 2, y: def.core.y + CORE / 2, z: def.altitude };
}

/** Étendue d'un archipel (coordonnées de grille), terres, îlots et port compris. */
export function worldBounds(a: ArchipelagoId): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const def of mapOf(a)) {
    const b = landBox(def);
    // Deux cases de marge : la couronne d'un grand arbre, l'écume d'une cascade débordent de la terre.
    minX = Math.min(minX, b.x0 - 2);
    maxX = Math.max(maxX, b.x1 + 2);
    minY = Math.min(minY, b.y0 - ISLET_H - ISLET_GAP);
    maxY = Math.max(maxY, b.y1 + 2);
  }
  const dock = dockBox(getArchipelago(a).port);
  minX = Math.min(minX, dock.x0 - 2);
  maxX = Math.max(maxX, dock.x1 + 2);
  minY = Math.min(minY, dock.y0 - 2);
  return { minX, maxX, minY, maxY };
}

/**
 * L'étendue à cadrer dans la vue d'ensemble : les îles ouvertes et celles qu'un ouvrage proposé peut atteindre,
 * avec une marge. Au début, deux îles et leurs voisines ; le cadre s'élargit à mesure que le monde s'ouvre.
 */
export function overviewBounds(a: ArchipelagoId, bridges: string[]): { minX: number; maxX: number; minY: number; maxY: number } {
  const open = reachableIslands(bridges);
  const shown = new Set<BiomeId>([...open].filter((id) => archipelagoOfIsland(id) === a));
  for (const b of BRIDGES) {
    if (archipelagoOfIsland(b.from) !== a || bridgeState(b, bridges) === 'far') continue;
    shown.add(b.from);
    shown.add(b.to);
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const id of shown) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0 - ISLET_H - ISLET_GAP);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX: minX - 4, maxX: maxX + 4, minY: minY - 4, maxY: maxY + 4 };
}

/** Pivot maximal de la caméra vers le cœur du continent (radians) : le nord reste reconnaissable. */
export const VIEW_YAW_MAX = (40 * Math.PI) / 180;

/**
 * La zone que la caméra cadre quand le bonhomme se tient sur une île : cette île et ses voisines (reliées par un
 * ouvrage, construit ou non). Sur une île du bord, les voisines tirent l'image vers le continent : moins de mer.
 */
export function viewZone(home: BiomeId): { minX: number; maxX: number; minY: number; maxY: number } {
  const ids = new Set<BiomeId>([home]);
  for (const b of bridgesOf(home)) ids.add(otherEnd(b, home));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const id of ids) {
    const b = landBox(islandDef(id));
    minX = Math.min(minX, b.x0);
    maxX = Math.max(maxX, b.x1);
    minY = Math.min(minY, b.y0);
    maxY = Math.max(maxY, b.y1);
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Le pivot de la caméra depuis une île : vers la colonne centrale du continent, borné à VIEW_YAW_MAX de part et
 * d'autre du nord (plein pivot à 50 cases du centre). Positif : la caméra se place à l'ouest et regarde vers l'est.
 */
export function viewYaw(home: BiomeId): number {
  const c = islandCenter(home);
  const b = worldBounds(archipelagoOfIsland(home));
  // Seul l'écart est-ouest compte : la caméra regarde toujours vers le nord, on la tourne vers la colonne centrale.
  const dx = (b.minX + b.maxX) / 2 - c.x;
  return VIEW_YAW_MAX * Math.max(-1, Math.min(1, dx / 50));
}

/** Île la plus proche d'un point de la grille d'un archipel (pour le toucher : une île ou le pont qui y mène). */
export function islandAt(a: ArchipelagoId, x: number, y: number): BiomeId {
  const islands = islandsOf(a);
  let best: BiomeId = islands[0].id;
  let bestD = Infinity;
  for (const b of islands) {
    const c = islandCenter(b.id);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * Relief léger : un plateau d'un bloc de haut sur la moitié arrière de l'île (loin de la créature),
 * aux coins arrondis, différent selon l'île. Hauteur du sol (0 ou 1) pour une case de l'île.
 */
/**
 * Le décor et le relief du cœur sont dessinés sur une grille de 12 × 12 (LAYOUT), posée dans le cœur de 16 × 16
 * avec une marge : les trois rangées de devant accueillent les bornes de mission, les colonnes de côté restent libres.
 */
const LAYOUT = 12;
export const LAYOUT_PAD = { x: 2, y: 3 };

export function groundHeight(index: number, x: number, y: number): number {
  const lx = x - LAYOUT_PAD.x;
  const ly = y - LAYOUT_PAD.y;
  if (lx < 0 || ly < 0 || lx >= LAYOUT || ly >= LAYOUT) return 0;
  const fromBack = LAYOUT - 1 - lx;
  const shape = index % 3;
  // Le plateau est à l'arrière-droite, devant la zone des plans (qui reste plate).
  const inner = lx >= 7 && ly >= 2 && ly <= 5;
  if (!inner) return 0;
  if (shape === 0) return fromBack + Math.abs(ly - LAYOUT / 2 + 0.5) < 7.5 ? 1 : 0;
  if (shape === 1) return ly <= LAYOUT / 2 + 1 || fromBack < 2 ? 1 : 0;
  return fromBack < 3 || (ly >= 4 && ly <= LAYOUT - 5) ? 1 : 0;
}

/**
 * Les bornes de mission d'une île : une par mission, alignées sur la rangée de devant (côté caméra), en cases relatives
 * au cœur. On touche une borne pour lancer sa mission.
 */
export const QUEST_ROW = 1;
export function questStations(id: BiomeId): { typeId: string; x: number; y: number }[] {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) return [];
  return biome.exercises.map((ex, i) => ({ typeId: ex.id, x: 3 + 3 * i, y: QUEST_ROW }));
}

const STEP = '#8f8f8f';

/**
 * Les ports d'attache d'une île (étape J5) : là où chacun de ses ouvrages la touche, la première case de l'ouvrage de
 * son côté, dans le repère de l'île. Une côte dessinée par île (R4b) les lit pour laisser l'ouvrage aborder.
 */
export function portsDAttache(id: BiomeId): { ouvrage: string; local: { x: number; y: number; z: number } }[] {
  const o = origineDe(id);
  return bridgesOf(id).map((def) => {
    const path = bridgePath(def);
    const c = def.from === id ? path[0] : path[path.length - 1];
    return { ouvrage: def.id, local: { x: c.x - o.x, y: c.y - o.y, z: c.z - o.z } };
  });
}

/**
 * Le tracé d'un ouvrage entre deux îles : de bord de terre à bord de terre, sur la ligne qui joint les deux cœurs.
 * Deux îles l'une devant l'autre : l'ouvrage part du côté droit du cœur (l'îlot du Gardien est devant, à gauche),
 * descend jusqu'au bord de l'île de devant, fait un coude, puis y entre. Chaque case a son altitude (interpolée).
 */
export function bridgePath(def: BridgeDef): { x: number; y: number; z: number; climbing: boolean; dx: number; dy: number }[] {
  const a = islandDef(def.from);
  const b = islandDef(def.to);
  const vertical = Math.abs(b.core.y - a.core.y) >= Math.abs(b.core.x - a.core.x);
  const anchor = (d: IslandDef) => ({ x: d.core.x + (vertical ? CORE - 1 : CORE / 2), y: d.core.y + CORE / 2 });
  const ca = anchor(a);
  const cb = anchor(b);
  const points = [ca];
  if (vertical && ca.x !== cb.x) {
    const front = a.core.y < b.core.y ? a : b;
    const jog = front.core.y + CORE + front.ext.back + 1;
    points.push({ x: ca.x, y: jog }, { x: cb.x, y: jog });
  }
  points.push(cb);
  const cells: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (let s = 0; s + 1 < points.length; s++) {
    const p = points[s];
    const q = points[s + 1];
    const steps = Math.max(1, Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(p.x + ((q.x - p.x) * i) / steps);
      const y = Math.floor(p.y + ((q.y - p.y) * i) / steps);
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x, y });
    }
  }
  // Un sentier suit la terre : de bord de cœur à bord de cœur, posé sur le sol. Les autres ouvrages franchissent
  // l'eau : on ne garde que la partie hors des deux terres.
  let first = cells.findIndex((c) => (def.kind === 'sentier' ? !inCore(a, c.x, c.y) : !isLand(a, c.x, c.y)));
  let last = cells.length - 1;
  while (last > 0 && (def.kind === 'sentier' ? inCore(b, cells[last].x, cells[last].y) : isLand(b, cells[last].x, cells[last].y))) last--;
  if (first < 0 || first > last) {
    first = 0;
    last = cells.length - 1;
  }
  const span = cells.slice(first, last + 1);
  let prevZ = a.altitude;
  return span.map((c, i) => {
    const z = def.kind === 'sentier' ? groundLevelAt(c.x, c.y) : Math.round(a.altitude + ((b.altitude - a.altitude) * (i + 1)) / (span.length + 1));
    const climbing = z !== prevZ;
    prevZ = z;
    const next = span[Math.min(i + 1, span.length - 1)];
    const prev = span[Math.max(i - 1, 0)];
    return { x: c.x, y: c.y, z, climbing, dx: Math.sign(next.x - prev.x), dy: Math.sign(next.y - prev.y) };
  });
}

/**
 * Un ouvrage entre deux îles, selon sa nature : pont de planches (marches quand il monte), bac (poteaux et radeau
 * au fil de l'eau), escalier taillé dans la pierre, tunnel (galerie voûtée, lanternes), col (escalier à garde-fou).
 * Fantôme tant qu'il n'est pas construit.
 */
function bridge(def: BridgeDef, cubes: VoxelCube[], ghost: boolean, occupied: Set<string>): void {
  const path = bridgePath(def);
  const onPath = new Set(path.map((c) => `${c.x},${c.y}`));
  // Un cube d'ouvrage ne remplace jamais un cube du terrain (un buisson sur l'isthme, par exemple).
  const add = (x: number, y: number, z: number, color: string, texture: string, top?: string) => {
    const key = `${x},${y},${z}`;
    if (occupied.has(key)) return;
    occupied.add(key);
    cubes.push({ x, y, z, color, top, texture, tag: def.to, bridge: def.id, ghost: ghost || undefined });
  };
  // À côté du passage (pilier, garde-fou, poteau) : jamais sur une case du tracé, où le bonhomme marche.
  const beside = (x: number, y: number, z: number, color: string, texture: string) => {
    if (onPath.has(`${x},${y}`)) return;
    add(x, y, z, color, texture);
  };
  const n = path.length;
  path.forEach((c, i) => {
    // Perpendiculaire au tracé (pour les arches et le garde-fou).
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    switch (def.kind) {
      case 'sentier':
        // Des pierres de gué une case sur deux, posées sur le sol de l'isthme.
        if (i % 2 === 0) add(c.x, c.y, c.z + 1, BLOCKS.galet.side, 'galet');
        break;
      case 'pont':
        add(c.x, c.y, c.z, BLOCKS.bois.side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS.escalier.top : undefined);
        break;
      case 'bac': {
        // Un radeau de trois planches au milieu, des poteaux de bois qui tiennent la corde de halage.
        const mid = Math.abs(i - (n - 1) / 2) <= 1;
        if (mid) {
          add(c.x, c.y, c.z, BLOCKS.bois.side, 'planches');
          if (i === Math.floor((n - 1) / 2)) add(c.x + px, c.y + py, c.z, BLOCKS.bois.side, 'planches');
        } else if (i % 3 === 0 || i === n - 1) add(c.x, c.y, c.z, TRUNK, 'tronc');
        break;
      }
      case 'escalier':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        break;
      case 'col':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        if (i % 2 === 0) beside(c.x + px, c.y + py, c.z + 1, BLOCKS.barriere.side, 'barriere');
        break;
      case 'tunnel': {
        add(c.x, c.y, c.z, BLOCKS.bois.side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS.escalier.top : undefined);
        // Une arche de pierre toutes les trois cases, une lanterne au sommet d'une arche sur deux.
        if (i % 3 === 1 && i < n - 1) {
          // Assez haute pour que le bonhomme (deux blocs) passe dessous : piliers de trois, clé de voûte au quatrième.
          for (const side of [-1, 1]) for (let up = 1; up <= 3; up++) beside(c.x + side * px, c.y + side * py, c.z + up, BLOCKS.pierre.side, 'pierre');
          const lit = ((i - 1) / 3) % 2 === 0;
          add(c.x, c.y, c.z + 4, lit ? BLOCKS.lanterne.side : BLOCKS.pierre.side, lit ? 'lanterne' : 'pierre');
        }
        break;
      }
    }
  });
  // Une lanterne sur un poteau à chaque bout, à côté du passage (le bonhomme ne la traverse pas) : la nuit, les
  // chemins se devinent de loin.
  for (const c of [path[0], path[n - 1]]) {
    if (!c) continue;
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    const base = def.kind === 'sentier' ? c.z + 1 : c.z;
    beside(c.x + px, c.y + py, base, TRUNK, 'tronc');
    beside(c.x + px, c.y + py, base + 1, BLOCKS.lanterne.side, 'lanterne');
  }
}

let sentierCache: Set<string> | null = null;
/** Les cases des sentiers (pierres de gué) et leurs voisines : le décor des isthmes les laisse libres (feuillages compris). */
function nearSentier(x: number, y: number): boolean {
  if (!sentierCache) sentierCache = new Set(BRIDGES.filter((b) => b.kind === 'sentier').flatMap((b) => bridgePath(b).map((c) => `${c.x},${c.y}`)));
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (sentierCache.has(`${x + dx},${y + dy}`)) return true;
  return false;
}

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };

/** Où le bonhomme se tient sur une île (coordonnées du monde, z sous ses pieds : le dessus du bloc de sol). */
export function avatarHome(id: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  // Le bloc de sol du cœur est en z = altitude (+ 1 sur le plateau) : on se tient sur son dessus, comme les créatures.
  const z = def.altitude + groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y) + 1;
  return { x: def.core.x + AVATAR_HOME.x, y: def.core.y + AVATAR_HOME.y, z };
}

/**
 * L'itinéraire du bonhomme d'une île à une autre, en marchant sur les ouvrages construits (le plus court chemin en
 * nombre d'ouvrages), ou `null` s'il n'y en a pas. Une suite de points (x, y, z du sol sous ses pieds). Une île
 * traversée n'est pas un détour par sa place : il va d'un ouvrage au suivant. Avec la grille de marche (`ground`), il
 * suit le sol et contourne arbres, bornes, maisons et créatures ; sans elle, il va en ligne droite.
 */
export function avatarRoute(from: BiomeId, to: BiomeId, bridges: string[], ground?: WalkGround): { x: number; y: number; z: number }[] | null {
  if (from === to) return [avatarHome(from)];
  const built = (b: BridgeDef) => bridgeState(b, bridges) === 'built';
  const prev = new Map<BiomeId, BridgeDef | null>([[from, null]]);
  const queue: BiomeId[] = [from];
  while (queue.length && !prev.has(to)) {
    const here = queue.shift()!;
    for (const b of bridgesOf(here)) {
      if (!built(b)) continue;
      const there = otherEnd(b, here);
      if (prev.has(there)) continue;
      prev.set(there, b);
      queue.push(there);
    }
  }
  if (!prev.has(to)) return null;
  const hops: { def: BridgeDef; from: BiomeId; to: BiomeId }[] = [];
  let at = to;
  while (prev.get(at)) {
    const b = prev.get(at)!;
    const before = otherEnd(b, at);
    hops.unshift({ def: b, from: before, to: at });
    at = before;
  }
  const route: { x: number; y: number; z: number }[] = [avatarHome(from)];
  // Sur une île : de là où il est jusqu'au point suivant, à pied (ou tout droit, sans grille).
  const walkTo = (next: { x: number; y: number; z: number }) => {
    const here = route[route.length - 1];
    const path = ground ? walkPath(ground, here, next) : null;
    route.push(...(path ? path.slice(1) : [next]));
  };
  for (const hop of hops) {
    // Sur un ouvrage on marche sur le tablier (z + 1) ; sur un sentier, de pierre de gué en pierre de gué (la pierre
    // est posée sur le sol en z + 1, on marche dessus : z + 2).
    const deck =
      hop.def.kind === 'sentier'
        ? bridgePath(hop.def)
            .map((c, i) => ({ x: c.x, y: c.y, z: c.z + 2, stone: i % 2 === 0 }))
            .filter((c) => c.stone)
            .map(({ x, y, z }) => ({ x, y, z }))
        : bridgePath(hop.def).map((c) => ({ x: c.x, y: c.y, z: c.z + 1 }));
    if (hop.def.from !== hop.from) deck.reverse();
    if (!deck.length) continue;
    walkTo(deck[0]);
    route.push(...deck.slice(1));
  }
  walkTo(avatarHome(to));
  return route;
}

/**
 * Le chemin du bonhomme de son île jusqu'au pont du Bloc-Navire : le long de la rangée de devant (sous les bornes),
 * puis la jetée planche par planche, puis le bastingage et le pont. À rebours, c'est le débarquement.
 */
export function boardingRoute(port: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(port);
  const home = avatarHome(port);
  const o = dockOrigin(port);
  const top = def.altitude + 1;
  const route = [home, { x: def.core.x + 1, y: def.core.y, z: top }, { x: def.core.x + DOCK_DX, y: def.core.y, z: top }];
  for (const c of dockCells(port)) {
    route.push({ x: c.x, y: c.y, z: c.z + 1 });
    if (c.y === o.y + VEHICLE_DECK.y) break;
  }
  // Le bastingage (une case au-dessus du plancher), puis le pont.
  route.push({ x: o.x, y: o.y + VEHICLE_DECK.y, z: o.z + 2 }, { x: o.x + VEHICLE_DECK.x, y: o.y + VEHICLE_DECK.y, z: o.z + 1 });
  return route;
}

/** Distance à plat parcourue depuis le départ, à chaque point d'un itinéraire (la dernière est sa longueur). */
export function routeLengths(route: { x: number; y: number }[]): number[] {
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
  return cum;
}

/**
 * Le point d'un itinéraire à une distance donnée du départ : on avance au même pas quelle que soit la longueur des
 * segments (une case de pont, une pierre de gué sur deux, ou toute une île d'un coup).
 */
export function routeAt(route: { x: number; y: number; z: number }[], cum: number[], d: number): { x: number; y: number; z: number } {
  const last = route.length - 1;
  if (last <= 0 || d >= cum[last]) return { ...route[last] };
  let i = 0;
  while (i < last - 1 && cum[i + 1] <= d) i++;
  const span = cum[i + 1] - cum[i];
  const f = span > 0 ? Math.max(0, d - cum[i]) / span : 1;
  const a = route[i];
  const b = route[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
}

/** Tous les cubes du village, étiquetés par biome. Les îles verrouillées sont en pierre grise, sans créature. */
/** Les pas d'une créature qui se promène : une case à gauche ou en arrière (jamais vers les plans). */
export const CREATURE_STEPS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [0, 1],
  [-1, 1],
];

const creatureSpots = new Map<BiomeId, CreatureSpot>();

export interface CreatureSpot {
  x: number;
  y: number;
  /** Les pas qu'elle peut faire sans rien toucher (toujours au moins « rester là »). */
  steps: [number, number][];
}

/**
 * Où la créature d'une île se tient (case relative au cœur) : la place la plus proche de (2, 4) où elle et ses pas
 * ne touchent ni le décor, ni la zone des plans, ni le bonhomme, ni une colline, ni l'eau. On préfère une place
 * d'où elle peut se promener ; sinon elle reste immobile.
 */
export function creatureSpot(id: BiomeId): CreatureSpot {
  const known = creatureSpots.get(id);
  if (known) return known;
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const blocked = new Set<string>();
  DECOR[id](
    (x, y) => blocked.add(`${x + LAYOUT_PAD.x},${y + LAYOUT_PAD.y}`),
    (x, y) => groundHeight(index, x + LAYOUT_PAD.x, y + LAYOUT_PAD.y),
  );
  for (const st of questStations(id)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${st.x + dx},${st.y + dy}`);
  for (let x = PLAN_ZONE.x; x < PLAN_ZONE.x + PLAN_ZONE.w; x++) for (let y = PLAN_ZONE.y; y < PLAN_ZONE.y + PLAN_ZONE.h; y++) blocked.add(`${x},${y}`);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${AVATAR_HOME.x + dx},${AVATAR_HOME.y + dy}`);
  for (const k of placeCells(id)) blocked.add(k);
  for (let x = 0; x < CORE; x++) for (let y = 0; y < CORE; y++) if (groundHeight(index, x, y) > 0) blocked.add(`${x},${y}`);
  // Hors du cœur : la terre plate et nue seulement (pas l'eau, pas un arbre, pas une pente).
  const scenery = new Map(landscape(def).map((c) => [`${c.x - def.core.x},${c.y - def.core.y}`, c]));
  const free = (x: number, y: number) => {
    if (blocked.has(`${x},${y}`)) return false;
    if (x >= 0 && y >= 0 && x < CORE && y < CORE) return true;
    const c = scenery.get(`${x},${y}`);
    return Boolean(c) && c!.h === 0 && !c!.decor && c!.ground !== 'eau' && c!.ground !== 'lave';
  };
  const cubes = CREATURE_CUBES[id];
  const fits = (x: number, y: number, [sx, sy]: [number, number]) => cubes.every((c) => free(x + sx + c.x, y + sy + c.y));
  let best: CreatureSpot | null = null;
  let bestScore = Infinity;
  for (let x = -2; x < CORE; x++) {
    for (let y = 0; y < CORE; y++) {
      if (!fits(x, y, [0, 0])) continue;
      const steps = CREATURE_STEPS.filter((st) => fits(x, y, st));
      const score = Math.abs(x - 2) + Math.abs(y - 4) - 2 * (steps.length - 1);
      if (score < bestScore) {
        best = { x, y, steps };
        bestScore = score;
      }
    }
  }
  const spot = best ?? { x: 2, y: 4, steps: [[0, 0]] };
  creatureSpots.set(id, spot);
  return spot;
}

/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(
  a: ArchipelagoId,
  bridges: string[],
): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number }; steps: [number, number][] }[] {
  return islandsOf(a)
    .filter((b) => isBiomeUnlocked(b.id, bridges))
    .map((b) => {
      const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
      const spot = creatureSpot(b.id);
      return { id: b.id, cubes: CREATURE_CUBES[b.id], origin: { x: ox + spot.x, y: oy + spot.y, z: oz + 1 }, steps: spot.steps };
    });
}

/** L'îlot du Gardien : une petite île devant la sienne (côté caméra), tenue dans ISLET_W × ISLET_H cases (les Gardiens font jusqu’à 9 × 8). */
export const ISLET_W = 13;
export const ISLET_H = 12;
/** Cases d'eau entre l'îlot et la terre de son île : les pas japonais les franchissent. */
export const ISLET_GAP = 3;
/** Centre de l'îlot (coordonnées locales) : le Gardien s'y dresse, au milieu de l'arène. */
const ISLET_CENTER = { x: 6, y: 5.5 };
/** Demi-axes de l'arène pavée (un carré aux coins arrondis, plus petit que le Gardien : il déborde sur l'herbe). */
const ARENA = { rx: 4.5, ry: 4 };

export function bossIsletOrigin(index: number): { x: number; y: number; z: number } {
  const def = islandDef(BIOMES[index].id);
  return { x: def.core.x, y: def.core.y - def.ext.front - ISLET_H - ISLET_GAP, z: def.altitude };
}

/** Le milieu de l'îlot du Gardien, en cases du monde, à mi-hauteur de sa sentinelle (la caméra la cadre là, lot 6). */
export function bossIsletCenter(id: BiomeId): { x: number; y: number; z: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: o.x + ISLET_CENTER.x, y: o.y + ISLET_CENTER.y, z: o.z + 4 };
}

/** Coin local où poser un Gardien pour qu'il soit centré sur l'îlot. */
function guardianOffset(id: BiomeId): { x: number; y: number } {
  const g = GUARDIAN_CUBES[id];
  const mid = (vals: number[]) => (Math.min(...vals) + Math.max(...vals)) / 2;
  return { x: Math.round(ISLET_CENTER.x - mid(g.map((c) => c.x))), y: Math.round(ISLET_CENTER.y - mid(g.map((c) => c.y))) };
}

export interface IsletCell {
  /** Coordonnées du monde. */
  x: number;
  y: number;
  /** Pavé de l'arène (pierre, bordée de galet). */
  arena: boolean;
  /** Sous les pieds du Gardien. */
  guardian: boolean;
  /** Au bord de l'eau (une voisine n'est pas de la terre). */
  shore: boolean;
}

const isletCache = new Map<BiomeId, IsletCell[]>();
/**
 * La terre de l'îlot : une ellipse à la côte irrégulière (bruit lissé, comme les îles), qui porte toujours
 * l'emprise entière de son Gardien ; au milieu, l'arène pavée. Calculée une fois par île.
 */
export function bossIsletCells(id: BiomeId): IsletCell[] {
  const known = isletCache.get(id);
  if (known) return known;
  const def = islandDef(id);
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const off = guardianOffset(id);
  const under = new Set(GUARDIAN_CUBES[id].map((c) => `${off.x + c.x},${off.y + c.y}`));
  const land = new Set<string>();
  for (let x = 0; x < ISLET_W; x++)
    for (let y = 0; y < ISLET_H; y++) {
      const dx = (x - ISLET_CENTER.x) / (ISLET_W / 2);
      const dy = (y - ISLET_CENTER.y) / (ISLET_H / 2);
      const coast = (smoothNoise(def.seed + 7, o.x + x, o.y + y, 3) - 0.5) * 0.3;
      if (under.has(`${x},${y}`) || Math.hypot(dx, dy) + coast < 0.98) land.add(`${x},${y}`);
    }
  const cells: IsletCell[] = [];
  for (const key of land) {
    const [x, y] = key.split(',').map(Number);
    const ax = (x - ISLET_CENTER.x) / ARENA.rx;
    const ay = (y - ISLET_CENTER.y) / ARENA.ry;
    cells.push({
      x: o.x + x,
      y: o.y + y,
      arena: ax ** 4 + ay ** 4 <= 1,
      guardian: under.has(key),
      shore: [`${x - 1},${y}`, `${x + 1},${y}`, `${x},${y - 1}`, `${x},${y + 1}`].some((k) => !land.has(k)),
    });
  }
  isletCache.set(id, cells);
  return cells;
}

/**
 * Les pas japonais : des pierres en quinconce dans l'eau, du fond de l'îlot à la côte de l'île, dans l'axe du
 * Gardien. Posées au niveau du sol de l'île (en altitude, elles flottent comme elle).
 */
export function bossIsletSteps(id: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(id);
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const x = o.x + Math.round(ISLET_CENTER.x);
  const back = Math.max(...bossIsletCells(id).filter((c) => c.x === x).map((c) => c.y));
  let coast = back + 1;
  while (!isLand(def, x, coast)) coast++;
  const steps: { x: number; y: number; z: number }[] = [];
  for (let y = back + 1; y < coast; y++) steps.push({ x: x + ((y - back) % 2 === 0 ? 1 : 0), y, z: def.altitude });
  return steps;
}

/** Le socle du bloc d'or d'un Gardien vaincu : devant lui, à sa droite, sur la terre de l'îlot. */
function trophySpot(id: BiomeId): { x: number; y: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const target = { x: o.x + ISLET_CENTER.x + 3, y: o.y + 1 };
  const free = bossIsletCells(id).filter((c) => !c.guardian && !c.shore);
  free.sort((p, q) => Math.abs(p.x - target.x) + Math.abs(p.y - target.y) - (Math.abs(q.x - target.x) + Math.abs(q.y - target.y)));
  return free[0];
}

/** Le sol de l'îlot hors de l'arène : celui qui domine sur l'île (sans les plages, l'eau ni la lave). */
function isletGround(def: IslandDef): string {
  const count = new Map<Ground, number>();
  for (const c of landscape(def)) if (c.ground !== 'sable' && c.ground !== 'eau' && c.ground !== 'lave') count.set(c.ground, (count.get(c.ground) ?? 0) + 1);
  let best: Ground = 'herbe';
  for (const [g, n] of count) if (n > (count.get(best) ?? 0)) best = g;
  return GROUND_COLOR[best];
}

/** Le petit décor de l'îlot : celui de l'île, sans les arbres (ils cacheraient le Gardien). */
const SMALL_DECOR: Decor[] = ['buisson', 'fleur', 'rocher', 'roseau', 'cristal', 'souche', 'champignon'];

/** Sous une terre en altitude, la roche s'amincit : chaque couche garde les cases dont les quatre voisines étaient au-dessus. */
function taperLayers(cells: { x: number; y: number }[]): { x: number; y: number; d: number }[] {
  const out: { x: number; y: number; d: number }[] = [];
  let layer = new Set(cells.map((c) => `${c.x},${c.y}`));
  for (let d = 1; d <= TAPER; d++) {
    const next = new Set<string>();
    for (const key of layer) {
      const [x, y] = key.split(',').map(Number);
      if ([`${x - 1},${y}`, `${x + 1},${y}`, `${x},${y - 1}`, `${x},${y + 1}`].every((k) => layer.has(k))) next.add(key);
    }
    layer = next;
    for (const key of layer) {
      const [x, y] = key.split(',').map(Number);
      out.push({ x, y, d });
    }
    if (layer.size === 0) break;
  }
  return out;
}

/**
 * L'îlot du Gardien en cubes : terre, sol de l'île, arène, petit décor, pas japonais, et le bloc d'or une fois vaincu.
 * Sans `pas` (une sentinelle qui attend, lot 6), l'îlot n'a pas encore ses pas japonais : le chemin s'ouvre avec le défi.
 */
function bossIslet(biome: BiomeDef, beaten: boolean, cubes: VoxelCube[], pas = true): void {
  const def = islandDef(biome.id);
  const gz = def.altitude;
  const tag = biome.id;
  const cells = bossIsletCells(biome.id);
  const at = new Map(cells.map((c) => [`${c.x},${c.y}`, c]));
  const block = (x: number, y: number, z: number, color: string, top?: string) =>
    cubes.push({ x, y, z, color, top, texture: TEXTURES[color], tag });
  // Le sol et la roche de l'îlot : en facettes dans le rendu Archipéo.
  const sol = (x: number, y: number, z: number, color: string) => cubes.push({ x, y, z, color, texture: TEXTURES[color], tag, sol: true });
  const ground = isletGround(def);
  const sandy = gz === 0 && def.region !== 'feu';
  for (const c of cells) {
    for (let d = 1; d <= DEPTH; d++) sol(c.x, c.y, gz - d, BLOCKS.terre.side);
    // L'arène : pierre au milieu, galet sur son pourtour ; autour, le sol de l'île, et du sable au bord de la mer.
    const rim = c.arena && [`${c.x - 1},${c.y}`, `${c.x + 1},${c.y}`, `${c.x},${c.y - 1}`, `${c.x},${c.y + 1}`].some((k) => !at.get(k)?.arena);
    const top = c.arena ? (rim ? BLOCKS.galet.side : BLOCKS.pierre.side) : c.shore && sandy ? BLOCKS.sable.side : ground;
    sol(c.x, c.y, gz, top);
  }
  if (gz > 0) for (const t of taperLayers(cells)) sol(t.x, t.y, gz - DEPTH - t.d, BLOCKS.pierre.side);
  // Quelques touches du décor de l'île, hors de l'arène et loin des pieds du Gardien.
  const kinds = [...new Set(landscape(def).map((c) => c.decor).filter((k): k is Decor => !!k && SMALL_DECOR.includes(k)))];
  if (kinds.length === 0) kinds.push('rocher');
  const spots = cells
    .filter((c) => !c.arena && !c.guardian)
    .map((c) => ({ c, r: noise(def.seed + 8, c.x, c.y) }))
    .sort((p, q) => q.r - p.r)
    .slice(0, 5);
  const trophy = beaten ? trophySpot(biome.id) : null;
  // Deux touches voisines peuvent vouloir la même case (deux buissons qui se touchent) : un seul cube par case.
  const placed = new Set<string>();
  for (const { c, r } of spots) {
    decorate(
      (x, y, z, color) => {
        const cell = at.get(`${x},${y}`);
        if (!cell || cell.arena || cell.guardian || (trophy && x === trophy.x && y === trophy.y)) return;
        const key = `${x},${y},${z}`;
        if (placed.has(key)) return;
        placed.add(key);
        block(x, y, gz + z, color);
      },
      kinds[Math.floor(r * 97) % kinds.length],
      c.x,
      c.y,
      r,
    );
  }
  if (pas)
    for (const s of bossIsletSteps(biome.id)) {
      block(s.x, s.y, s.z, BLOCKS.galet.side);
      if (s.z === 0) block(s.x, s.y, -1, BLOCKS.galet.side);
    }
  // Vaincu : un bloc d'or sur un socle de pierre, devant la statue.
  if (trophy) {
    block(trophy.x, trophy.y, gz + 1, BLOCKS.pierre.side);
    block(trophy.x, trophy.y, gz + 2, BLOCKS.or.side, BLOCKS.or.top);
  }
}

/** Gris de pierre de même luminosité qu'une couleur (pour la statue). */
function stoneOf(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  const g = Math.round(90 + (lum / 255) * 90);
  return `#${((g << 16) | (g << 8) | g).toString(16).padStart(6, '0')}`;
}

/**
 * Les Gardiens visibles : en couleurs s'ils attendent le défi, en statue de pierre s'ils sont vaincus. Avec
 * `sentinelles` (Archipéo, lot 6), ceux des îles ouvertes sont là avant que leur défi soit prêt.
 */
export function guardianPlacements(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  bridges: string[],
  sentinelles = false,
): { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] {
  const out: { id: BiomeId; kind: 'guardian'; still: true; beaten: boolean; cubes: VoxelCube[]; origin: { x: number; y: number; z: number } }[] = [];
  BIOMES.forEach((b, index) => {
    if (b.classe !== a) return;
    const status = guardianStatus(b, progress, bridges, sentinelles);
    if (status === 'hidden') return;
    const { x, y, z } = bossIsletOrigin(index);
    const off = guardianOffset(b.id);
    const beaten = status === 'beaten';
    const cubes = beaten ? GUARDIAN_CUBES[b.id].map((c) => ({ ...c, color: stoneOf(c.color), top: undefined })) : GUARDIAN_CUBES[b.id];
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes, origin: { x: x + off.x, y: y + off.y, z: z + 1 } });
  });
  return out;
}

/** Zone des plans d'une île en coordonnées du monde (bornes hautes exclues). */
export function planZoneOf(id: BiomeId): { x0: number; y0: number; x1: number; y1: number } {
  const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x0: ox + PLAN_ZONE.x, y0: oy + PLAN_ZONE.y, x1: ox + PLAN_ZONE.x + PLAN_ZONE.w, y1: oy + PLAN_ZONE.y + PLAN_ZONE.h };
}

/** Roche sous le sol d'une case de paysage, selon la région et la hauteur. */
function underground(def: IslandDef, cell: LandCell, depthBelowTop: number): string {
  if (def.region === 'feu') return BASALT;
  if (cell.h - depthBelowTop >= 2 || def.region === 'hauteurs' || def.region === 'montagne') return BLOCKS.pierre.side;
  return BLOCKS.terre.side;
}

const whaleCache = new Map<ArchipelagoId, { x: number; y: number; r: number }[]>();
export function whaleSpots(a: ArchipelagoId): { x: number; y: number; r: number }[] {
  const known = whaleCache.get(a);
  if (known) return known;
  // Les Îles du Ciel n'ont pas de mer : pas de baleines.
  if (DANS_LE_CIEL[a]) {
    whaleCache.set(a, []);
    return [];
  }
  const land: { x: number; y: number }[] = [];
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) land.push(c);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) land.push({ x: o.x + x, y: o.y + y });
  }
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) land.push({ x, y });
  const b = worldBounds(a);
  const clearance = (x: number, y: number) => {
    let best = Infinity;
    for (const c of land) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < best) best = d;
    }
    return best;
  };
  // Les baleines préfèrent le large : on note chaque clairière par sa largeur et son éloignement du centre.
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const candidates: { x: number; y: number; r: number; score: number }[] = [];
  for (let x = b.minX + 8; x <= b.maxX - 8; x += 3)
    for (let y = b.minY + 8; y <= b.maxY - 8; y += 3) {
      const r = clearance(x, y) - 3;
      candidates.push({ x, y, r, score: Math.min(r, 9) + Math.hypot(x - cx, y - cy) * 0.12 });
    }
  candidates.sort((p, q) => q.score - p.score);
  const spots: { x: number; y: number; r: number }[] = [];
  for (const c of candidates) {
    if (c.r < 4) continue;
    if (spots.some((s) => Math.hypot(s.x - c.x, s.y - c.y) < s.r + c.r + 20)) continue;
    spots.push({ x: c.x, y: c.y, r: Math.min(c.r, 9) });
    if (spots.length === 4) break;
  }
  whaleCache.set(a, spots);
  return spots;
}

const seaCache = new Map<ArchipelagoId, VoxelCube[]>();
/**
 * L'habillage de la mer : des rochers qui affleurent (galet et pierre, un à quatre cubes) et des bancs de sable au
 * ras de l'eau, semés au hasard (bruit fixe) dans l'eau libre, à cinq cases au moins de toute terre, de tout îlot,
 * de tout ouvrage et des ronds des baleines. Plus denses au large, autour du continent, là où l'écran montrait
 * la mer seule. Calculé une fois.
 */
export function seaDecor(a: ArchipelagoId): VoxelCube[] {
  const known = seaCache.get(a);
  if (known) return known;
  // Les Îles du Ciel : des nuages à la place de la mer, rien à semer.
  if (DANS_LE_CIEL[a]) {
    seaCache.set(a, []);
    return [];
  }
  const solid = new Set<string>();
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) solid.add(`${c.x},${c.y}`);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) solid.add(`${o.x + x},${o.y + y}`);
  }
  for (const def of BRIDGES.filter((br) => archipelagoOfIsland(br.from) === a))
    for (const c of bridgePath(def)) for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) solid.add(`${c.x + dx},${c.y + dy}`);
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0 - 1; x <= dock.x1 + 1; x++) for (let y = dock.y0 - 1; y <= dock.y1 + 1; y++) solid.add(`${x},${y}`);
  // Les îlots des monuments.
  for (const m of monumentsOf(a)) for (let x = 0; x < MONUMENT_ISLET; x++) for (let y = 0; y < MONUMENT_ISLET; y++) solid.add(`${m.islet.x + x},${m.islet.y + y}`);
  const whales = whaleSpots(a);
  const b = worldBounds(a);
  const free = (x: number, y: number) => {
    for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (solid.has(`${x + dx},${y + dy}`)) return false;
    return whales.every((w) => Math.hypot(w.x - x, w.y - y) > w.r + 4);
  };
  const cubes = semerLaMer(a, b, free);
  seaCache.set(a, cubes);
  return cubes;
}

/** Les nappes de brume des sommets (îles à 9) : centre, étendue et hauteur, en coordonnées de grille. */
export function mistPatches(a: ArchipelagoId): { x: number; y: number; z: number; w: number; h: number }[] {
  return mapOf(a)
    .filter((d) => d.altitude >= 9)
    .map((d) => {
      const b = landBox(d);
      return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: d.altitude - 1.5, w: b.x1 - b.x0 + 8, h: b.y1 - b.y0 + 8 };
    });
}

/** La fumée d'un foyer du quai : les cinq premières volutes, et les cases qu'elles surplombent. */
const HEARTH_PUFFS = PUFFS.slice(0, 5);
const SMOKE_DRIFT: [number, number][] = HEARTH_PUFFS.map(([dx, dy]) => [dx, dy]);

/** La longueur d'une barque (sa largeur est de 2). */
const BOAT_LENGTH = 4;

/** Une barque en cubes : un fond de 4 × 2 (la coque), la proue et la poupe relevées d'un bloc, le long de x ou de y. */
function boatCells(along: 'x' | 'y', overturned = false): { dx: number; dy: number; dz: number; end: boolean }[] {
  const out: { dx: number; dy: number; dz: number; end: boolean }[] = [];
  for (let i = 0; i < BOAT_LENGTH; i++)
    for (let j = 0; j < 2; j++) {
      const [dx, dy] = along === 'x' ? [i, j] : [j, i];
      const end = i === 0 || i === BOAT_LENGTH - 1;
      // Retournée (échouée), la coque est en haut et la proue et la poupe posent sur le sable.
      out.push({ dx, dy, dz: overturned ? 1 : 0, end: false });
      if (end) out.push({ dx, dy, dz: overturned ? 0 : 1, end: true });
    }
  return out;
}

/** Les objets du quai posés sur la terre de l'île-port : leur coin et leurs cases au sol. */
interface QuaySpot {
  x: number;
  y: number;
  /** Le niveau où poser l'objet (le dessus du sol + 1). */
  z: number;
  cells: [number, number][];
}

/**
 * Les places des objets du quai sur la terre de l'île-port (la barque tirée sur la grève, les fanions, les caisses, le
 * foyer), au plus près du pied de la jetée. Une place est de la terre plate et nue (le sol de l'île, rien dessus), jamais sur le
 * chemin du bonhomme vers le navire, ni sur la zone des plans, une borne, un lieu, la créature ou sa place à lui ;
 * les objets ne se touchent pas. Les places ne dépendent pas de l'état du village : un objet ne change pas de place.
 */
function quaySpots(port: BiomeId, cubes: VoxelCube[]): { boat: QuaySpot | null; flags: (QuaySpot | null)[]; crates: QuaySpot | null; hearth: QuaySpot | null } {
  const def = islandDef(port);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const top = new Map<string, VoxelCube>();
  for (const c of cubes) {
    const k = `${c.x},${c.y}`;
    const t = top.get(k);
    if (!t || c.z > t.z) top.set(k, c);
  }
  const banned = new Set<string>();
  const ban = (x: number, y: number) => banned.add(`${x},${y}`);
  const core = (x: number, y: number) => ban(def.core.x + x, def.core.y + y);
  for (let x = PLAN_ZONE.x; x < PLAN_ZONE.x + PLAN_ZONE.w; x++) for (let y = PLAN_ZONE.y; y < PLAN_ZONE.y + PLAN_ZONE.h; y++) core(x, y);
  for (const st of questStations(port)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(st.x + dx, st.y + dy);
  for (const k of placeCells(port)) {
    const [x, y] = k.split(',').map(Number);
    core(x, y);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) core(AVATAR_HOME.x + dx, AVATAR_HOME.y + dy);
  const spot = creatureSpot(port);
  for (const [sx, sy] of [[0, 0], ...spot.steps]) for (const c of CREATURE_CUBES[port]) core(spot.x + sx + c.x, spot.y + sy + c.y);
  // Le chemin du bonhomme vers le navire (en ligne droite, d'un point au suivant), jusqu'à la jetée.
  const route = boardingRoute(port);
  for (let i = 1; i < route.length; i++) {
    const [p, q] = [route[i - 1], route[i]];
    const n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), 1);
    for (let t = 0; t <= n; t++) ban(Math.round(p.x + ((q.x - p.x) * t) / n), Math.round(p.y + ((q.y - p.y) * t) / n));
  }
  // La cale, sur la côte devant la barque amarrée (à l'ouest de la jetée) : rien ne s'y pose, la barque reste lisible.
  for (let x = X - 4; x < X; x++) for (let y = S; y <= S + 1; y++) ban(x, y);
  // Les ouvrages qui partent de l'île-port, et une case autour.
  for (const b of BRIDGES.filter((d) => d.from === port || d.to === port))
    for (const c of bridgePath(b)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) ban(c.x + dx, c.y + dy);
  // Le niveau du sol de chaque case : le cœur (et son plateau), ou la terre autour.
  const index = BIOMES.findIndex((b) => b.id === port);
  const land = new Map(landscape(def).map((c) => [`${c.x},${c.y}`, c]));
  const ground = (x: number, y: number): number | null => {
    if (inCore(def, x, y)) return def.altitude + groundHeight(index, x - def.core.x, y - def.core.y);
    const c = land.get(`${x},${y}`);
    return c && c.h >= 0 && !c.decor && c.ground !== 'eau' && c.ground !== 'lave' ? def.altitude + c.h : null;
  };
  /** Le dessus du sol nu d'une case libre, `null` si quelque chose y est posé ou si ce n'est pas de la terre. */
  const free = (x: number, y: number): number | null => {
    if (banned.has(`${x},${y}`) || y < S) return null;
    const t = top.get(`${x},${y}`);
    const z = ground(x, y);
    if (z === null || !t || t.z !== z || t.ghost || t.decor || t.quest || t.place || t.bridge || t.texture === 'eau' || t.texture === 'lave') return null;
    return z;
  };
  /** `air` : les cases que l'objet surplombe (la fumée), jamais au-dessus du chemin du bonhomme. */
  const find = (wantX: number, wantY: number, cells: [number, number][], air: [number, number][] = []): QuaySpot | null => {
    let best: QuaySpot | null = null;
    let bestD = Infinity;
    for (let x = X - 12; x <= X + 10; x++)
      for (let y = S; y <= def.core.y + 8; y++) {
        const zs = cells.map(([dx, dy]) => free(x + dx, y + dy));
        if (zs.some((z) => z === null || z !== zs[0])) continue;
        // Au-dessus des cases surplombées, rien de plus haut qu'un bloc (pas d'arbre dans la fumée).
        if (air.some(([dx, dy]) => banned.has(`${x + dx},${y + dy}`) || y + dy < S || (top.get(`${x + dx},${y + dy}`)?.z ?? -Infinity) > zs[0]! + 1)) continue;
        // Au plus près de la côte d'abord, puis du pied de la jetée.
        const d = Math.abs(x - wantX) + 3 * Math.abs(y - wantY);
        if (d < bestD) {
          bestD = d;
          best = { x, y, z: zs[0]! + 1, cells };
        }
      }
    // Une case de marge : les objets ne se touchent pas.
    if (best) for (const [dx, dy] of cells) for (let ex = -1; ex <= 1; ex++) for (let ey = -1; ey <= 1; ey++) ban(best.x + dx + ex, best.y + dy + ey);
    return best;
  };
  const rect = (w: number, d: number): [number, number][] => Array.from({ length: w * d }, (_, i) => [i % w, Math.floor(i / w)]);
  const sea = archipelagoOfIsland(port) !== '3e';
  const boat = sea ? find(X - 5, S, rect(BOAT_LENGTH, 2)) : null;
  const crates = find(X - 2, S, rect(2, 1));
  // Un fanion de chaque côté du pied de la jetée, sa toile (une case à côté du mât) au-dessus du sol nu.
  const flags = [find(X - 2, S, [[0, 0], [-1, 0]]), find(X + 2, S, [[0, 0], [1, 0]])];
  const hearth = find(X + 3, S + 1, [[0, 0]], SMOKE_DRIFT);
  return { boat, flags, crates, hearth };
}

/**
 * Le port de l'archipel : la jetée de planches qui descend de la côte vers le large, ses poteaux et ses lanternes, et ce
 * que montre l'état du village (`villageStage`), chaque état gardant ce qu'apportent les précédents : 1, lanternes
 * éteintes et une barque grise retournée sur la grève ; 2, lanternes allumées, la barque redressée ; 3, la barque amarrée
 * contre la jetée, un foyer qui fume ; 4, une seconde barque sur la grève, des caisses, deux fanions ; 5, une lanterne
 * sur chaque poteau et un feu de port au bout de la jetée. Rien sur la jetée ni à la place du navire ; pas de barque
 * dans les Îles du Ciel. Le Bloc-Navire amarré à côté n'est pas dans le terrain : il tangue, c'est un objet à part
 * (`vehiclePlacement`).
 */
function harbour(a: ArchipelagoId, village: Pick<Village, 'plans' | 'bridges'>, cubes: VoxelCube[]): void {
  const port = getArchipelago(a).port;
  const rank = villageStage(village, a).rank;
  const def = islandDef(port);
  const rest = vehicleRestZ(a);
  const X = def.core.x + DOCK_DX;
  const S = shoreY(port);
  const spots = quaySpots(port, cubes);
  const lantern = (x: number, y: number, z: number) =>
    cubes.push({ x, y, z, color: BLOCKS.lanterne.side, top: BLOCKS.lanterne.top, texture: 'lanterne', tag: port });
  const cells = dockCells(port);
  for (const c of cells)
    cubes.push({ x: c.x, y: c.y, z: c.z, color: BLOCKS.bois.side, top: c.step ? BLOCKS.escalier.top : undefined, texture: c.step ? 'escalier' : 'planches', tag: port });
  for (const p of dockPosts(port)) {
    cubes.push({ x: p.x, y: p.y, z: p.z, color: TRUNK, texture: 'tronc', tag: port });
    // Éteintes, les lanternes du bout de la jetée ne sont qu'un bouchon de bois (pas de lueur la nuit).
    if (rank >= 5 || (p.lantern && rank >= 2)) lantern(p.x, p.y, p.z + 1);
    else if (p.lantern) cubes.push({ x: p.x, y: p.y, z: p.z + 1, color: BLOCKS.bois.side, top: BLOCKS.bois.top, texture: 'planches', tag: port });
  }
  // Le feu de port, au large du bout de la jetée (à l'ouest de la proue du navire) : un pilier de pierre et sa lanterne.
  if (rank >= 5) {
    const end = cells[cells.length - 1];
    for (let z = 0; z < 3; z++) cubes.push({ x: end.x, y: end.y - 1, z: rest + z, color: BLOCKS.pierre.side, top: BLOCKS.pierre.top, texture: 'pierre', tag: port });
    lantern(end.x, end.y - 1, rest + 3);
  }
  const prop = (kind: string, at: QuaySpot) => `${port}/${kind}@${at.x},${at.y}`;
  const boatAt = (x: number, y: number, z: number, along: 'x' | 'y', decor: string, overturned = false, faded = false) => {
    for (const c of boatCells(along, overturned)) {
      // La coque goudronnée, d'une couleur unie sombre (elle ne se confond pas avec les planches de la jetée, et n'ajoute
      // pas de matériau : la mine a déjà ce brun), la proue et la poupe en bois clair.
      const b = c.end ? BLOCKS.bois : { side: DARK, top: DARK, texture: undefined };
      cubes.push({ x: x + c.dx, y: y + c.dy, z: z + c.dz, color: faded ? fade(b.side) : b.side, top: faded ? fade(b.top) : b.top, texture: b.texture, tag: port, decor, muted: faded || undefined });
    }
  };
  // La barque de la grève : grise et retournée (1), redressée (2) ; elle part à l'eau (3) ; une seconde la remplace (4).
  if (spots.boat && rank !== 3) boatAt(spots.boat.x, spots.boat.y, spots.boat.z, 'x', prop('barque', spots.boat), rank === 1, rank === 1);
  // Amarrée à l'ouest de la jetée, entre les poteaux et l'îlot du Gardien (une case d'eau autour), au plus près de la côte.
  if (a !== '3e' && rank >= 3) {
    const bx = X - 3;
    const islet = new Set([...bossIsletCells(port), ...bossIsletSteps(port)].flatMap((c) => [-1, 0, 1].flatMap((ex) => [-1, 0, 1].map((ey) => `${c.x + ex},${c.y + ey}`))));
    const clear = (by: number) => [0, 1].every((dx) => Array.from({ length: BOAT_LENGTH }, (_, dy) => [bx + dx, by + dy]).every(([x, y]) => !isLand(def, x, y) && !islet.has(`${x},${y}`)));
    for (let by = S - BOAT_LENGTH; by > cells[cells.length - 1].y; by--)
      if (clear(by)) {
        boatAt(bx, by, rest, 'y', `${port}/barque@${bx},${by}`);
        break;
      }
  }
  if (rank >= 3 && spots.hearth) {
    // Le foyer : une pierre, et sa fumée qui monte au vent.
    const { x, y, z: base } = spots.hearth;
    const decor = prop('foyer', spots.hearth);
    cubes.push({ x, y, z: base, color: BLOCKS.pierre.side, top: DARK, texture: 'pierre', tag: port, decor });
    for (const [dx, dy, dz] of HEARTH_PUFFS) cubes.push({ x: x + dx, y: y + dy, z: base + dz - 1, color: SMOKE, tag: port, decor });
  }
  if (rank >= 4) {
    if (spots.crates) {
      const { x, y, z: base } = spots.crates;
      const decor = prop('caisse', spots.crates);
      for (const [dx, dz] of [
        [0, 0],
        [1, 0],
        [0, 1],
      ])
        cubes.push({ x: x + dx, y, z: base + dz, color: BLOCKS.bois.side, top: BLOCKS.bois.top, texture: 'planches', tag: port, decor });
    }
    spots.flags.forEach((f) => {
      if (!f) return;
      const decor = prop('fanion', f);
      const base = f.z;
      for (let z = 0; z < 3; z++) cubes.push({ x: f.x, y: f.y, z: base + z, color: TRUNK, texture: 'tronc', tag: port, decor });
      // La toile flotte du côté opposé à la jetée.
      cubes.push({ x: f.x + f.cells[1][0], y: f.y, z: base + 2, color: BLOCKS.toile.side, top: BLOCKS.toile.top, texture: 'toile', tag: port, decor });
    });
  }
}

export interface VehiclePlacement {
  /** L'île-port où le navire est amarré. */
  port: BiomeId;
  /** Le coin local (0, 0, 0) du navire dans le monde. */
  origin: { x: number; y: number; z: number };
  /** Les cubes du navire, en coordonnées locales ; en fantôme, les cases encore à poser (ou le kit qui n'est pas arrivé). */
  cubes: VoxelCube[];
  /** Le navire flotte sur l'eau (il tangue) ou plane à hauteur de quai (les Îles du Ciel). */
  afloat: boolean;
  /** L'étape en chantier sur ce port, s'il y en a une. */
  building: string | null;
}

/**
 * Le Bloc-Navire au quai du port de l'archipel. Les étapes déjà parties sont dessinées entières (le navire les porte
 * partout où il accoste) ; celle qui se construit ici montre ses cases posées en dur et les autres en fantôme ; son kit
 * (voile, ballon, feux) arrive avec les Gardiens.
 */
export function vehiclePlacement(a: ArchipelagoId, progress: Record<string, { stars: number }>, village: Village): VehiclePlacement {
  const port = getArchipelago(a).port;
  const origin = dockOrigin(port);
  const cubes: VoxelCube[] = [];
  const put = (c: { x: number; y: number; z: number; block: keyof typeof BLOCKS }, ghost: boolean) => {
    const bd = BLOCKS[c.block];
    cubes.push({ x: c.x, y: c.y, z: c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: port, ghost: ghost || undefined });
  };
  const bridges = village.bridges;
  for (const stage of launchedStages(bridges)) for (const c of [...stage.cells, ...stage.kit]) put(c, false);
  // Le chantier de ce port : l'étape qui s'y construit, si l'étape d'avant est partie.
  const building = stageBuildingAt(port, bridges);
  if (building) {
    const done = new Set(village.plans[building.id] ?? []);
    const placed = planCells(building);
    building.cells.forEach((c, i) => put(c, !done.has(placed[i].key)));
    const kit = kitReady(building, progress);
    for (const c of building.kit) put(c, !kit);
  }
  return { port, origin, cubes, afloat: !DANS_LE_CIEL[a], building: building?.id ?? null };
}

// ---------- Les lieux du village : l'école et la salle des trophées ----------

/** Encombrement de l'école : 5 cases de large (x), 4 de profondeur (y), la façade et sa porte côté caméra (y bas). */
export const SCHOOL_SIZE = { w: 5, d: 4 };
/** Le coin de l'école dans le cœur de son île : devant à droite, entre les bornes de mission et le bord (la rangée de devant reste libre pour marcher jusqu'au port). */
export const SCHOOL_AT = { x: 11, y: 1 };
/** La salle des trophées : 4 × 3 cases, ouverte devant, au milieu du cœur (derrière les bornes, à côté de la place de la créature, devant la zone des plans). */
export const TROPHY_SIZE = { w: 4, d: 3 };
export const TROPHY_AT = { x: 4, y: 8 };

/** Les lieux du village, posés sur l'île de l'école de chaque archipel : leur coin dans le cœur, leur taille, la colonne de leur porte. */
export const VILLAGE_PLACES: Record<VillagePlaceId, { at: { x: number; y: number }; size: { w: number; d: number }; door: number }> = {
  ecole: { at: SCHOOL_AT, size: SCHOOL_SIZE, door: 2 },
  trophees: { at: TROPHY_AT, size: TROPHY_SIZE, door: 2 },
};
const PLACE_IDS = Object.keys(VILLAGE_PLACES) as VillagePlaceId[];

/** Un lieu posé sur une île : le coin de sa façade (coordonnées du monde) et son sol (z relatif au sol de l'île). */
export interface PlaceSpot {
  x: number;
  y: number;
  h: number;
}

const isSchoolIsland = (id: BiomeId) => ARCHIPELAGOS.some((a) => a.school === id);

/** La place d'un lieu du village sur l'île de l'école de son archipel, `null` ailleurs. */
export function placeSpot(place: VillagePlaceId, id: BiomeId): PlaceSpot | null {
  if (!isSchoolIsland(id)) return null;
  const { at, size } = VILLAGE_PLACES[place];
  const def = islandDef(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  let h = 0;
  for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) h = Math.max(h, groundHeight(index, at.x + dx, at.y + dy));
  return { x: def.core.x + at.x, y: def.core.y + at.y, h };
}

/** Les cases qu'occupent les lieux du village (coordonnées relatives au cœur). */
function placeCells(id: BiomeId): Set<string> {
  const out = new Set<string>();
  if (!isSchoolIsland(id)) return out;
  for (const place of PLACE_IDS) {
    const { at, size } = VILLAGE_PLACES[place];
    for (let dx = 0; dx < size.w; dx++) for (let dy = 0; dy < size.d; dy++) out.add(`${at.x + dx},${at.y + dy}`);
  }
  return out;
}

/** La porte d'un lieu : la case devant elle, où le bonhomme s'arrête (coordonnées du monde, z : le sol sous ses pieds). */
export function placeDoor(place: VillagePlaceId, id: BiomeId): { x: number; y: number; z: number } | null {
  const s = placeSpot(place, id);
  if (!s) return null;
  const { at, door } = VILLAGE_PLACES[place];
  const index = BIOMES.findIndex((b) => b.id === id);
  return { x: s.x + door, y: s.y - 1, z: islandDef(id).altitude + groundHeight(index, at.x + door, at.y - 1) + 1 };
}

function placeCube(place: PlaceId, x: number, y: number, z: number, block: keyof typeof BLOCKS, island: BiomeId, unlocked: boolean): VoxelCube {
  const b = BLOCKS[block];
  return { x, y, z, color: unlocked ? b.side : fade(b.side), top: b.top, texture: b.texture, tag: island, place, muted: unlocked ? undefined : true };
}

type ModelCube = { x: number; y: number; z: number; block: keyof typeof BLOCKS };

/**
 * Les cubes de l'école (coordonnées relatives à son coin, z = 1 au-dessus du sol) : murs de brique aux coins de pierre de
 * taille, une porte au milieu de la façade entre deux fenêtres, un toit à deux pans et un clocheton à cloche d'or.
 */
export function schoolModel(): ModelCube[] {
  const out: ModelCube[] = [];
  const { w, d } = SCHOOL_SIZE;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < d; y++)
      for (let z = 1; z <= 3; z++) {
        const corner = (x === 0 || x === w - 1) && (y === 0 || y === d - 1);
        const front = y === 0;
        const block = front && x === 2 && z <= 2 ? 'porte' : front && (x === 1 || x === 3) && z === 2 ? 'verre' : corner ? 'taille' : 'brique';
        out.push({ x, y, z, block });
      }
  // Le toit : un rang débordant de tuiles rouges, puis le faîte au milieu.
  for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) out.push({ x, y, z: 4, block: 'toit' });
  for (let x = 0; x < w; x++) for (const y of [1, 2]) out.push({ x, y, z: 5, block: 'toit' });
  // Le clocheton au-dessus de la porte, et sa cloche.
  out.push({ x: 2, y: 1, z: 6, block: 'taille' });
  out.push({ x: 2, y: 1, z: 7, block: 'or' });
  return out;
}

/**
 * Les places des trophées, dans l'ordre où elles se remplissent : d'abord sur les socles de marbre (bien en vue, sous
 * le toit), puis sur le faîte, puis en second rang sur les socles, puis au bord du toit. Une place par succès.
 */
export const TROPHY_SLOTS: { x: number; y: number; z: number }[] = [
  ...[
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [0, 1],
    [3, 1],
  ].map(([x, y]) => ({ x, y, z: 2 })),
  ...[0, 1, 2, 3].map((x) => ({ x, y: 1, z: 6 })),
  ...[
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [0, 1],
    [3, 1],
  ].map(([x, y]) => ({ x, y, z: 3 })),
  ...[0, 1, 2, 3].flatMap((x) => [
    { x, y: 0, z: 5 },
    { x, y: 2, z: 5 },
  ]),
];

/**
 * La salle des trophées (coordonnées relatives à son coin) : un pavillon ouvert devant, quatre colonnes de marbre, un
 * fond de velours rouge, des socles de marbre, un toit de pierre de taille au faîte d'or. `trophies` : le bloc de chaque
 * succès gagné, posé à sa place (voir TROPHY_SLOTS).
 */
export function trophyModel(trophies: (keyof typeof BLOCKS)[] = []): ModelCube[] {
  const out: ModelCube[] = [];
  const { w, d } = TROPHY_SIZE;
  for (let x = 0; x < w; x++)
    for (let y = 0; y < d; y++) {
      const corner = (x === 0 || x === w - 1) && (y === 0 || y === d - 1);
      if (corner) for (let z = 1; z <= 3; z++) out.push({ x, y, z, block: 'marbre' });
      else if (y === d - 1) for (let z = 1; z <= 3; z++) out.push({ x, y, z, block: 'velours' });
      else out.push({ x, y, z: 1, block: 'marbre' });
    }
  for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) out.push({ x, y, z: 4, block: 'taille' });
  for (let x = 0; x < w; x++) out.push({ x, y: 1, z: 5, block: 'or' });
  trophies.slice(0, TROPHY_SLOTS.length).forEach((block, i) => out.push({ ...TROPHY_SLOTS[i], block }));
  return out;
}

// ---------- Les monuments, sur leur îlot au large ----------

/**
 * Où un îlot de monument ne va pas : la terre des îles et leur abord (trois cases), les îlots des Gardiens, le port et sa
 * jetée, les ouvrages et leur abord, la place des baleines. Sert à placer les monuments (une fois) et à le vérifier.
 */
export function monumentBlocked(a: ArchipelagoId): (x: number, y: number) => boolean {
  const solid = new Set<string>();
  const near = (x: number, y: number, r: number) => {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) solid.add(`${x + dx},${y + dy}`);
  };
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) near(c.x, c.y, 3);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) near(o.x + x, o.y + y, 2);
  }
  for (const def of BRIDGES.filter((br) => archipelagoOfIsland(br.from) === a)) for (const c of bridgePath(def)) near(c.x, c.y, 3);
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) near(x, y, 3);
  const whales = whaleSpots(a);
  return (x, y) => solid.has(`${x},${y}`) || whales.some((w) => Math.hypot(w.x - x, w.y - y) < w.r + 2);
}

/** L'îlot d'un monument est-il libre (toutes ses cases) ? */
export function monumentIsletFree(a: ArchipelagoId, x0: number, y0: number, blocked = monumentBlocked(a)): boolean {
  for (let x = x0; x < x0 + MONUMENT_ISLET; x++) for (let y = y0; y < y0 + MONUMENT_ISLET; y++) if (blocked(x, y)) return false;
  return true;
}

/** Le point du monde où se trouve la case (0, 0, 0) d'un monument (le dessus de son îlot). */
export function monumentAnchor(m: MonumentDef): { x: number; y: number; z: number } {
  const def = islandDef(m.biome);
  return { x: def.core.x, y: def.core.y, z: (mapOf(m.archipelago)[0]?.altitude ?? 0) + 1 };
}

/** Le milieu de l'îlot d'un monument, à mi-hauteur du monument (pour y cadrer la caméra). */
export function monumentCenter(m: MonumentDef): { x: number; y: number; z: number } {
  return { x: m.islet.x + (MONUMENT_ISLET - 1) / 2, y: m.islet.y + (MONUMENT_ISLET - 1) / 2, z: (mapOf(m.archipelago)[0]?.altitude ?? 0) + 3 };
}

/**
 * Les îlots des monuments d'un archipel et leurs monuments : un îlot rond de sable (de neige dans les Îles du Ciel) au
 * niveau du sol de l'archipel, sa roche jusqu'à la mer (ou qui s'amincit sous lui dans le ciel), puis les cases du
 * monument, posées ou en fantôme. Tous leurs cubes se touchent pour ouvrir le panneau du monument.
 */
function monumentIslets(a: ArchipelagoId, village: Village, cubes: VoxelCube[]): void {
  const alt = mapOf(a)[0]?.altitude ?? 0;
  const sky = DANS_LE_CIEL[a];
  const top = sky ? SNOW : BLOCKS.sable.side;
  for (const m of monumentsOf(a)) {
    const place: PlaceId = `monument:${m.id}`;
    const n = MONUMENT_ISLET;
    const land: { x: number; y: number }[] = [];
    for (let dx = 0; dx < n; dx++)
      for (let dy = 0; dy < n; dy++) {
        // Les coins arrondis.
        const cx = Math.abs(dx - (n - 1) / 2);
        const cy = Math.abs(dy - (n - 1) / 2);
        if (cx + cy > n - 3) continue;
        land.push({ x: m.islet.x + dx, y: m.islet.y + dy });
      }
    for (const c of land) {
      cubes.push({ x: c.x, y: c.y, z: alt, color: top, texture: TEXTURES[top], tag: m.biome, place, sol: true });
      const bottom = sky ? alt - DEPTH : -DEPTH;
      for (let z = alt - 1; z >= bottom; z--) cubes.push({ x: c.x, y: c.y, z, color: BLOCKS.pierre.side, texture: 'pierre', tag: m.biome, place, sol: true });
    }
    if (sky)
      for (const t of taperLayers(land)) cubes.push({ x: t.x, y: t.y, z: alt - DEPTH - t.d, color: BLOCKS.pierre.side, texture: 'pierre', tag: m.biome, place, sol: true });
    const done = new Set(village.plans[m.id] ?? []);
    const o = monumentAnchor(m);
    for (const c of planCells(m)) {
      const bd = BLOCKS[c.block];
      cubes.push({ x: o.x + c.x, y: o.y + c.y, z: o.z + c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: m.biome, ghost: !done.has(c.key), place });
    }
  }
}

/** L'origine du repère d'une île : le coin de son cœur, à l'altitude de l'île (le point 0, 0, 0 de l'île). */
export function origineDe(id: BiomeId): { x: number; y: number; z: number } {
  const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: ox, y: oy, z: oz };
}

/**
 * Les cubes d'une île dans son repère (étape J5). Pour l'instant, l'île est calculée en cases du monde (map.ts place
 * son cœur dans le monde) puis ramenée à son origine ; R4b et la suite écrivent en repère d'île. Le sol, le paysage, le décor, les bornes, les lieux, l'îlot du
 * Gardien, la créature et les plans, en cases depuis le coin du cœur, z depuis l'altitude de l'île. Une case de plan
 * (c.x, c.y, c.z) y est le cube (c.x, c.y, c.z + 1). `voisins` : ce que les îles déjà posées occupent, en cases du monde
 * (une cascade ne tombe jamais sur la terre de l'île voisine) ; l'île y ajoute ses cubes.
 */
export function cubesDeLIle(
  id: BiomeId,
  progress: Record<string, { stars: number }>,
  village: Village = { plans: {}, journal: [], bridges: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  voisins: Set<string> = new Set(),
  /** Archipéo (lot 6) : l'îlot et la sentinelle, avant que le défi soit prêt. */
  sentinelles = false,
): VoxelCube[] {
  const index = BIOMES.findIndex((b) => b.id === id);
  const cubes: VoxelCube[] = [];
  poserLIle(BIOMES[index], index, progress, village, withCreatures, trophies, voisins, cubes, sentinelles);
  const { ox, oy, oz } = islandOrigin(index);
  for (const c of cubes) {
    c.x -= ox;
    c.y -= oy;
    c.z -= oz;
  }
  return cubes;
}

/**
 * Tous les cubes d'un archipel, en cases du monde : chaque île née dans son repère (`cubesDeLIle`) et posée à sa place
 * par la grille, puis ce qui est entre les îles (le port, les îlots des monuments, la mer habillée, les ouvrages).
 */
export function worldCubes(
  a: ArchipelagoId,
  progress: Record<string, { stars: number }>,
  village: Village = { plans: {}, journal: [], bridges: [] },
  withCreatures = true,
  /** Les succès gagnés, un bloc par succès : les trophées de la salle des trophées. */
  trophies: (keyof typeof BLOCKS)[] = [],
  /** Archipéo (lot 6) : l'îlot et la sentinelle de chaque île ouverte, avant que son défi soit prêt. */
  sentinelles = false,
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  // Tout ce qui est déjà posé dans la scène : une cascade ne tombe jamais sur la terre de l'île voisine.
  const placed = new Set<string>();
  for (const biome of BIOMES) {
    if (biome.classe !== a) continue;
    const o = origineDe(biome.id);
    for (const c of cubesDeLIle(biome.id, progress, village, withCreatures, trophies, placed, sentinelles)) {
      c.x += o.x;
      c.y += o.y;
      c.z += o.z;
      cubes.push(c);
    }
  }
  return entreLesIles(a, village, cubes);
}

/** Une île posée en cases du monde, ajoutée à `cubes` ; `placed` : ce que la scène occupe déjà (l'île y ajoute les siens). */
function poserLIle(
  biome: (typeof BIOMES)[number],
  index: number,
  progress: Record<string, { stars: number }>,
  village: Village,
  withCreatures: boolean,
  trophies: (keyof typeof BLOCKS)[],
  placed: Set<string>,
  cubes: VoxelCube[],
  sentinelles = false,
): void {
  const def = islandDef(biome.id);
  const { ox, oy, oz } = islandOrigin(index);
  const unlocked = isBiomeUnlocked(biome.id, village.bridges);
  const block = BLOCKS[biome.block];
  const grassy =
    biome.id === 'foret' || biome.id === 'ferme' || biome.id === 'plaine' || biome.id === 'riviere' || biome.id === 'marche' || biome.id === 'carrefour';
  const h = (x: number, y: number) => groundHeight(index, x, y);
  // Cubes du cœur (coordonnées relatives au cœur, z relatif au sol de l'île).
  // Cubes de la terre autour du cœur (coordonnées du monde). Île verrouillée : mêmes formes, couleurs délavées.
  const taken = new Set<string>();
  const putWorld = (x: number, y: number, z: number, color: string, decor?: string, sol?: true) => {
    taken.add(`${x},${y},${z}`);
    placed.add(`${x},${y},${oz + z}`);
    cubes.push({
      x,
      y,
      z: oz + z,
      color: unlocked ? color : fade(color),
      texture: TEXTURES[color],
      tag: biome.id,
      muted: unlocked ? undefined : true,
      decor: decor ? `${biome.id}/${decor}` : undefined,
      ...(sol ? { sol } : {}),
    });
  };
  // Le sol et la roche de l'île : le rendu Archipéo les dessine en facettes (world/landMesh.ts).
  const putSol = (x: number, y: number, z: number, color: string) => putWorld(x, y, z, color, undefined, true);
  // (Le décor du cœur est en coordonnées du cœur : son nom le dit, pour ne pas croiser celui du paysage.)
  const put: Put = (x, y, z, color, decor) => putWorld(ox + x, oy + y, z, color, decor && `cœur:${decor}`);
  // Le décor du cœur est dessiné sur la grille 12 × 12, décalée de la marge.
  // … sauf sur les cases de l’école et de la salle des trophées (un feuillage voisin ne traverse pas leur toit).
  const placesAt = placeCells(biome.id);
  const putDecor: Put = (x, y, z, color, decor) =>
    !placesAt.has(`${LAYOUT_PAD.x + x},${LAYOUT_PAD.y + y}`) && put(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, z, color, decor);
  const land = landCells(def);
  for (const c of land) {
    if (!inCore(def, c.x, c.y)) continue;
    const x = c.x - ox;
    const y = c.y - oy;
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, -d, BLOCKS.terre.side);
    const top = h(x, y);
    if (top > 0) putSol(c.x, c.y, 0, BLOCKS.terre.side);
    putSol(c.x, c.y, top, grassy ? GRASS : block.side);
  }
  // Le paysage autour du cœur : collines, pics, lacs, cratère, sable des plages, neige des sommets, puis le décor.
  const scenery = landscape(def);
  for (const c of scenery) {
    for (let d = 1; d <= DEPTH; d++) putSol(c.x, c.y, Math.min(0, c.h) - d, underground(def, c, c.h + d));
    for (let z = 0; z < c.h; z++) putSol(c.x, c.y, z, underground(def, c, c.h - z));
    putSol(c.x, c.y, c.h, GROUND_COLOR[c.ground]);
  }
  DECOR[biome.id](putDecor, (x, y) => h(x + LAYOUT_PAD.x, y + LAYOUT_PAD.y));
  // Les bornes de mission : un socle du bloc de l'île, une ardoise étoilée dessus. Délavées avec l'île quand elle est fermée.
  for (const st of questStations(biome.id)) {
    const quest = `${biome.id}:${st.typeId}`;
    const base = h(st.x, st.y);
    const tone = (c: string) => (unlocked ? c : fade(c));
    const muted = unlocked ? undefined : true;
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 1,
      color: tone(block.side),
      top: block.top,
      texture: block.texture,
      tag: biome.id,
      quest,
      muted,
    });
    cubes.push({
      x: ox + st.x,
      y: oy + st.y,
      z: oz + base + 2,
      color: tone('#3a4a6a'),
      top: '#2f3d5c',
      texture: 'borne',
      tag: biome.id,
      quest,
      muted,
    });
    taken.add(`${ox + st.x},${oy + st.y},${base + 1}`);
    taken.add(`${ox + st.x},${oy + st.y},${base + 2}`);
  }
  // L'école et la salle des trophées (sur l'île de l'école de l'archipel) : on les touche pour entrer, comme une borne.
  for (const place of PLACE_IDS) {
    const spot = placeSpot(place, biome.id);
    if (!spot) continue;
    const { at, size } = VILLAGE_PLACES[place];
    // Le soubassement rattrape une marche du sol.
    for (let dx = 0; dx < size.w; dx++)
      for (let dy = 0; dy < size.d; dy++)
        for (let z = h(at.x + dx, at.y + dy) + 1; z <= spot.h; z++) cubes.push(placeCube(place, spot.x + dx, spot.y + dy, oz + z, 'taille', biome.id, unlocked));
    for (const m of place === 'ecole' ? schoolModel() : trophyModel(trophies))
      cubes.push(placeCube(place, spot.x + m.x, spot.y + m.y, oz + spot.h + m.z, m.block, biome.id, unlocked));
  }
  landmark(def, scenery, (x, y, z, color, decor) => !taken.has(`${x},${y},${z}`) && putWorld(x, y, z, color, decor));
  cascades(def, scenery, (x, y, z, color, decor) => !taken.has(`${x},${y},${z}`) && !placed.has(`${x},${y},${oz + z}`) && putWorld(x, y, z, color, decor));
  for (const c of scenery) {
    if (!c.decor || nearSentier(c.x, c.y)) continue;
    const r = noise(def.seed + 5, c.x, c.y);
    // Le décor ne remplace jamais un cube déjà posé (sol voisin plus haut, feuillage d'un autre arbre).
    // … ni ne déborde au-dessus du cœur (la zone des plans doit rester libre).
    decorate(
      (x, y, z, color, decor) => !inCore(def, x, y) && !taken.has(`${x},${y},${c.h + z}`) && putWorld(x, y, c.h + z, color, decor),
      c.decor,
      c.x,
      c.y,
      r,
    );
  }
  // Une île en altitude flotte : sa roche s'amincit dessous.
  if (def.altitude > 0)
    for (const t of taperLayers(land)) if (!taken.has(`${t.x},${t.y},${-DEPTH - t.d}`)) putSol(t.x, t.y, -DEPTH - t.d, BLOCKS.pierre.side);
  // L'îlot du Gardien, devant l'île, dès qu'il accepte le défi : une petite île, son arène et ses pas japonais. Une
  // sentinelle (lot 6) est là dès l'ouverture de l'île, sans les pas japonais tant qu'elle attend.
  const guardian = guardianStatus(biome, progress, village.bridges, sentinelles);
  if (guardian !== 'hidden') bossIslet(biome, guardian === 'beaten', cubes, guardian !== 'waiting');
  if (unlocked && withCreatures) {
    const spot = creatureSpot(biome.id);
    for (const c of CREATURE_CUBES[biome.id])
      cubes.push({
        x: ox + spot.x + c.x,
        y: oy + spot.y + c.y,
        z: oz + c.z + 1,
        color: c.color,
        tag: biome.id,
      });
  }
  // Les plans : cellules posées en dur ; fantômes seulement pour le plan en cours (le premier non terminé) d'une île ouverte.
  if (unlocked) {
    let ghostsShown = false;
    for (const plan of plansFor(biome.id)) {
      const done = new Set(village.plans[plan.id] ?? []);
      const finished = isPlanDone(plan, village.plans);
      if (!finished && ghostsShown) break;
      if (!finished) ghostsShown = true;
      for (const c of planCells(plan)) {
        const bd = BLOCKS[c.block];
        const built = done.has(c.key);
        cubes.push({ x: ox + c.x, y: oy + c.y, z: oz + c.z + 1, color: bd.side, top: bd.top, texture: bd.texture, tag: biome.id, ghost: !built });
      }
    }
  }
}

/** Ce qui est entre les îles, en cases du monde, ajouté à `cubes` : le port, les îlots des monuments, la mer, les ouvrages. */
function entreLesIles(a: ArchipelagoId, village: Village, cubes: VoxelCube[]): VoxelCube[] {
  // Le port : la jetée (le Bloc-Navire est un objet à part, voir vehiclePlacement).
  harbour(a, village, cubes);
  // Les monuments, chacun sur son îlot au large : bâtis, ou en fantômes à construire.
  monumentIslets(a, village, cubes);
  // La mer habillée : rochers et bancs de sable, loin de tout (jamais sous un ouvrage, ni sur l'îlot d'un monument).
  for (const c of seaDecor(a)) cubes.push(c);
  // Les ponts : en planches s'ils sont construits, en fantôme s'ils sont constructibles, absents s'ils sont trop loin.
  const occupied = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  for (const def of BRIDGES) {
    if (archipelagoOfIsland(def.from) !== a) continue;
    const state = bridgeState(def, village.bridges);
    if (state !== 'far') bridge(def, cubes, state === 'buildable', occupied);
  }
  return cubes;
}
