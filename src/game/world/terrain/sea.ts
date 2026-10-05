// Le large : les baleines, le décor de la mer et les nappes de brume.
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, landBox, landCells, mapOf } from '../map';
import { BIOMES } from '../../biomes';
import { dockBox } from '../harbour';
import { BRIDGES, getArchipelago } from '../archipelago';
import { MONUMENT_ISLET, monumentsOf } from '../monuments';
import type { VoxelCube } from '../cube';
import { semerLaMer } from '../decor';
import { bossIsletOrigin, ISLET_H, ISLET_W } from './islets';
import { bridgePath } from './links';
import { worldBounds } from './view';

/**
 * Les baleines replacées à la main, quand la clairière choisie par `whaleSpots` se cache derrière une île dans la vue
 * de l'archipel depuis le port (DA, 01/10/2026 : au 5e, celle de 91, 345 nageait derrière le Marché et seul son souffle
 * se voyait). `de` : la clairière choisie ; `vers` : la nouvelle, en eau libre ; le rond y garde trois cases de toute
 * terre, îlot ou ponton (`r` = éloignement − 3, comme ailleurs). Vérifié par terrain.test.ts et three/baleines.test.ts.
 */
export const BALEINES_REPLACEES: Readonly<Partial<Record<ArchipelagoId, readonly { de: { x: number; y: number }; vers: { x: number; y: number } }[]>>> = {
  '5e': [{ de: { x: 91, y: 345 }, vers: { x: 97, y: 344 } }],
};

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
  // Les liaisons du port (GD-7) passent au large : une baleine n'y fait pas surface (les autres ouvrages, entre deux îles
  // proches, sont déjà loin des clairières).
  for (const br of BRIDGES) if (br.etoile && archipelagoOfIsland(br.from) === a) land.push(...bridgePath(br));
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
  // Une baleine ne plonge pas sur l'îlot d'un monument (à deux cases près, comme `monumentBlocked`).
  const surUnMonument = (x: number, y: number, r: number) =>
    monumentsOf(a).some((m) => {
      const px = Math.max(m.islet.x, Math.min(x, m.islet.x + MONUMENT_ISLET - 1));
      const py = Math.max(m.islet.y, Math.min(y, m.islet.y + MONUMENT_ISLET - 1));
      return Math.hypot(px - x, py - y) < r + 2;
    });
  const spots: { x: number; y: number; r: number }[] = [];
  for (const c of candidates) {
    if (c.r < 4) continue;
    if (surUnMonument(c.x, c.y, Math.min(c.r, 9))) continue;
    if (spots.some((s) => Math.hypot(s.x - c.x, s.y - c.y) < s.r + c.r + 20)) continue;
    spots.push({ x: c.x, y: c.y, r: Math.min(c.r, 9) });
    if (spots.length === 4) break;
  }
  for (const { de, vers } of BALEINES_REPLACEES[a] ?? []) {
    const i = spots.findIndex((s) => s.x === de.x && s.y === de.y);
    if (i >= 0) spots[i] = { x: vers.x, y: vers.y, r: Math.min(clearance(vers.x, vers.y) - 3, 9) };
  }
  // Dans un ordre qui ne dépend que de leur place (d'ouest en est, puis de l'avant vers l'arrière) : chaque baleine garde son rythme
  // (`three/offshore.ts` le tire de son rang) quand une île grandit et que les notes des clairières changent.
  spots.sort((p, q) => p.x - q.x || p.y - q.y);
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
