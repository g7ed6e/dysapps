// La mue de la Nef (GD-15), en logique pure : chaque cube de la nouvelle forme vient du cube le plus proche de la forme
// d'avant qui a la même apparence ; ceux qu'elle ne garde pas rapetissent sur place, les neufs grandissent à leur case.
// La scène 3D (three/ship.ts) ne fait que dessiner les poses que donne `metamorphosisPose`.
import type { VoxelCube } from './cube';

/** La durée de la mue : 3 secondes au plus (GD-15, avis du référent dys) ; un toucher la termine. */
export const METAMORPHOSIS_MS = 3000;

/** Le vol d'un cube : d'où il part, où il arrive (`null` : il n'existe pas de ce côté), et à quoi il ressemble. */
export interface Flight {
  cube: VoxelCube;
  from: { x: number; y: number; z: number } | null;
  to: { x: number; y: number; z: number } | null;
}

const apparence = (c: VoxelCube) => `${c.texture ?? ''}|${c.color}|${c.top ?? ''}`;
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

/**
 * Les vols d'une forme à l'autre. Les cubes d'arrivée se servent dans l'ordre de leur hauteur (du bas vers le haut),
 * chacun prenant le cube de départ libre le plus proche de même apparence : le résultat ne dépend que des deux formes.
 */
export function metamorphosisFlights(before: readonly VoxelCube[], after: readonly VoxelCube[]): Flight[] {
  const libres = new Map<string, VoxelCube[]>();
  for (const c of before) libres.set(apparence(c), [...(libres.get(apparence(c)) ?? []), c]);
  const flights: Flight[] = [];
  const ordre = [...after].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
  for (const c of ordre) {
    const pile = libres.get(apparence(c)) ?? [];
    let best = -1;
    for (let i = 0; i < pile.length; i++) if (best < 0 || distance(pile[i], c) < distance(pile[best], c)) best = i;
    const from = best >= 0 ? pile.splice(best, 1)[0] : null;
    flights.push({ cube: c, from: from && { x: from.x, y: from.y, z: from.z }, to: { x: c.x, y: c.y, z: c.z } });
  }
  for (const pile of libres.values()) for (const c of pile) flights.push({ cube: c, from: { x: c.x, y: c.y, z: c.z }, to: null });
  return flights;
}

/** Une douce accélération puis un arrêt doux, sans rebond. */
const douce = (k: number) => k * k * (3 - 2 * k);

/**
 * La pose d'un cube à l'avancement `k` (0 à 1) : ceux qui partent rapetissent pendant le premier tiers, ceux qui volent
 * traversent pendant les deux tiers du milieu, en passant un peu au-dessus de leur chemin, et les neufs grandissent
 * pendant le dernier tiers.
 */
export function metamorphosisPose(f: Flight, k: number): { x: number; y: number; z: number; scale: number } {
  const t = Math.min(1, Math.max(0, k));
  if (f.from && !f.to) return { ...f.from, scale: 1 - douce(Math.min(1, t * 3)) };
  if (!f.from && f.to) return { ...f.to, scale: douce(Math.max(0, t * 3 - 2)) };
  const a = f.from!;
  const b = f.to!;
  const u = douce(Math.min(1, Math.max(0, (t - 1 / 6) * 1.5)));
  const arc = Math.sin(Math.PI * u) * Math.min(2, distance(a, b) / 4);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u + arc, scale: 1 };
}
