// Le port d'un archipel : la jetée devant l'île-port, et la place du Bloc-Navire à côté.
// Générateur pur (coordonnées du monde), partagé par le terrain 3D, les plans du véhicule et la vue simple.
import type { BiomeId } from '../biomes';
import { ALTITUDE, CORE, archipelagoOfIsland, isLand, islandDef, type ArchipelagoId, type IslandDef } from './map';

/** Colonne de la jetée, à droite du cœur (l'îlot du Gardien occupe les colonnes 2 à 11 devant l'île). */
export const DOCK_DX = 14;
/** Cases de jetée à plat au moins, une fois au niveau de repos du navire. */
export const DOCK_FLAT = 3;

/** Encombrement du Bloc-Navire (coordonnées locales) : 5 de large (x), 11 de long (y, proue en y = 0), 11 de haut. */
export const VEHICLE_SIZE = { w: 5, d: 11, h: 11 };
/** La case du pont où le bonhomme se tient (sur le plancher, z local 0). */
export const VEHICLE_DECK = { x: 2, y: 3 };

/** Niveau du monde où repose le plancher du navire : sur l'eau (0), ou à hauteur de quai dans les Îles du Ciel. */
export function vehicleRestZ(a: ArchipelagoId): number {
  return a === '3e' ? ALTITUDE['3e'] : 0;
}

/** La dernière case de terre d'une colonne, côté mer (devant l'île) : la côte. Le cœur s'il n'y a pas de terre. */
function shoreYAt(def: IslandDef, x: number): number {
  let shore = def.core.y;
  for (let y = def.core.y; y >= def.core.y - def.ext.front - 3; y--) if (isLand(def, x, y)) shore = y;
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
  return { x0: o.x - 3, y0: o.y - 1, x1: o.x + VEHICLE_SIZE.w + 1, y1: Math.min(shoreY(port), islandDef(port).core.y + CORE) };
}
