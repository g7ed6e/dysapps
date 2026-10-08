// Le port d'un archipel : la jetée devant l'île-port, et la place du Bloc-Navire à côté.
// Générateur pur (coordonnées du monde), partagé par le terrain 3D, les plans du véhicule et la vue simple.
import type { BiomeId } from '../biomes';
import { ALTITUDE, archipelagoOfIsland, coeurDe, isLand, islandDef, type ArchipelagoId, type IslandDef } from './map';

/**
 * Colonne de la jetée, à droite du cœur (jusqu'à GD-11, l'îlot du Gardien tenait les colonnes 0 à 12 devant l'île). La
 * 16 depuis que le cœur a grandi et que la côte s'est amincie (GD-11, 8 octobre 2026) : en 14, sur la côte mince du
 * Marché, la jetée partait du bord du cœur, sur la rangée de côte devant les bornes, qui reste nue.
 */
export const DOCK_DX = 16;
/** Cases de jetée à plat au moins, une fois au niveau de repos du navire. */
const DOCK_FLAT = 3;

/**
 * Encombrement du Bloc-Navire (coordonnées locales) : 5 de large (x), 11 de long (y, proue en y = 0), 11 de haut au-dessus
 * du plancher (z = 0), et 2 dessous, pour les réacteurs.
 */
export const VEHICLE_SIZE = { w: 5, d: 11, h: 11, below: 2 };
/** La case du pont où le bonhomme se tient (sur le plancher, z local 0). */
export const VEHICLE_DECK = { x: 2, y: 3 };

/**
 * Niveau du monde où repose le plancher du navire : sur l'eau (0), à hauteur de quai dans les Îles du Ciel. Aux Anciens
 * Ateliers, où il arrive par les airs et où l'on pose ses réacteurs sous la coque, il plane juste au-dessus de l'eau.
 */
export function vehicleRestZ(a: ArchipelagoId): number {
  if (a === '3e') return ALTITUDE['3e'];
  return a === '4e' ? VEHICLE_SIZE.below : 0;
}

/** Le navire flotte sur l'eau (il tangue) ; sinon il plane, au-dessus de l'eau ou des nuages. */
export const vehicleAfloat = (a: ArchipelagoId): boolean => vehicleRestZ(a) === 0;

/** La dernière case de terre d'une colonne, côté mer (devant l'île) : la côte. Le bord du cœur s'il n'y a pas de terre. */
function shoreYAt(def: IslandDef, x: number): number {
  // Depuis le bord de devant du cœur (agrandi, `coeurDe`), à travers la côte.
  const y0 = coeurDe(def).y0;
  let shore = y0;
  for (let y = y0; y >= y0 - def.ext.front - 3; y--) if (isLand(def, x, y)) shore = y;
  return shore;
}

/** La côte au pied de la jetée, en y. */
export function shoreY(port: BiomeId): number {
  const def = islandDef(port);
  return shoreYAt(def, def.core.x + DOCK_DX);
}

/** Le coin local (0, 0, 0) du navire dans le monde : à l'est de la jetée, la proue vers le large, entièrement dans l'eau. */
export function dockOrigin(port: BiomeId): { x: number; y: number; z: number } {
  const def = islandDef(port);
  const x = def.core.x + DOCK_DX + 1;
  let shore = Infinity;
  for (let dx = 0; dx < VEHICLE_SIZE.w; dx++) shore = Math.min(shore, shoreYAt(def, x + dx));
  const rest = vehicleRestZ(archipelagoOfIsland(port));
  const steps = def.altitude - rest;
  // La jetée descend d'une marche par case, puis court à plat jusqu'à la case du pont : le navire recule s'il le faut.
  const afterSteps = shoreY(port) - 1 - steps;
  const y = Math.min(shore - VEHICLE_SIZE.d, afterSteps - DOCK_FLAT - VEHICLE_DECK.y + 1);
  return { x, y, z: rest };
}

export interface DockCell {
  x: number;
  y: number;
  /** Altitude de la planche ; on marche dessus en z + 1. */
  z: number;
  /** Une marche (la jetée descend d'un bloc). */
  step: boolean;
}

/** La jetée : une colonne de planches de la côte vers le large (−y), qui descend d'une marche par case, puis longe le navire. */
export function dockCells(port: BiomeId): DockCell[] {
  const def = islandDef(port);
  const rest = vehicleRestZ(archipelagoOfIsland(port));
  const x = def.core.x + DOCK_DX;
  const end = dockOrigin(port).y + VEHICLE_DECK.y - 1;
  const cells: DockCell[] = [];
  let z = def.altitude;
  let y = shoreY(port) - 1;
  while (z > rest) {
    z--;
    cells.push({ x, y, z, step: true });
    y--;
  }
  while (y >= end) {
    cells.push({ x, y, z: rest, step: false });
    y--;
  }
  return cells;
}

/** Les poteaux de la jetée (côté ouest, une case sur trois) ; les deux derniers portent une lanterne. */
export function dockPosts(port: BiomeId): { x: number; y: number; z: number; lantern: boolean }[] {
  const cells = dockCells(port);
  const posts = cells.filter((_, i) => i % 3 === 0 || i === cells.length - 1).map((c) => ({ x: c.x - 1, y: c.y, z: c.z, lantern: false }));
  for (const p of posts.slice(-2)) p.lantern = true;
  return posts;
}

/** L'emprise du port (jetée et navire), pour cadrer la caméra et l'étendue du monde. */
export function dockBox(port: BiomeId): { x0: number; y0: number; x1: number; y1: number } {
  const o = dockOrigin(port);
  return { x0: o.x - 3, y0: o.y - 1, x1: o.x + VEHICLE_SIZE.w + 1, y1: Math.min(shoreY(port), coeurDe(islandDef(port)).y1) };
}
