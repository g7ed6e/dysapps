// Les monuments, sur leur îlot au large.
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, landCells, mapOf } from '../map';
import { BIOMES, BLOC, BLOCKS } from '../../biomes';
import { BRIDGES, getArchipelago } from '../archipelago';
import { dockBox, dockOrigin } from '../harbour';
import { MONUMENT_ISLET, type MonumentDef, monumentsOf } from '../monuments';
import { ORIGINE_DES_MONUMENTS, planCells, type PlanDef, planOrigin } from '../plans';
import type { World } from '../../engine';
import type { PlaceId, VoxelCube } from '../cube';
import { SNOW } from '../decor';
import { bossIsletOrigin, ISLET_H, ISLET_W } from './ilots';
import { bridgePath } from './liaisons';
import { whaleSpots } from './mer';
import { DEPTH, origineDe, taperLayers, TEXTURES } from './socle';

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

/**
 * Le point du monde où tombe la clé (0, 0, 0) d'un monument : une case de son plan (`planCells`, clé relative au cœur
 * de son île, figée par `ORIGINE_DES_MONUMENTS`) est dessinée en `monumentAnchor + case`. Le rendu suit l'îlot
 * (`m.islet`, la case (0, 0, 0) du plan au-dessus de son coin intérieur) ; les clés des sauvegardes, elles, ne bougent pas
 * si l'îlot ou le cœur bougent.
 */
export function monumentAnchor(m: MonumentDef): { x: number; y: number; z: number } {
  const fige = ORIGINE_DES_MONUMENTS[m.id];
  if (!fige) throw new Error(`Monument sans origine : ${m.id}`);
  return { x: m.islet.x + 1 - fige.x, y: m.islet.y + 1 - fige.y, z: (mapOf(m.archipelago)[0]?.altitude ?? 0) + 1 - fige.z };
}

/**
 * Le point du monde où tombe la clé (0, 0, 0) d'une étape du Bloc-Navire (plan du port) : une case de son plan est
 * dessinée en `ancreDuQuai + case`, comme le navire au quai (`dockOrigin`, ses cases locales). Le rendu suit le quai ;
 * les clés des sauvegardes restent celles de `ORIGINE_DU_QUAI`.
 */
export function ancreDuQuai(plan: PlanDef): { x: number; y: number; z: number } {
  const o = dockOrigin(plan.biome);
  const cle = planOrigin(plan);
  return { x: o.x - cle.x, y: o.y - cle.y, z: o.z - cle.z };
}

/**
 * Ce qui sépare la clé d'une case du Bloc-Navire de la case du plan de son île-port où elle est dessinée (le repère de
 * l'île, un cran plus bas : `rappelsDeLaVue`) : (0, 0, 0) tant que le quai est là où ses clés ont été figées.
 */
export function decalageDuQuai(plan: PlanDef): { x: number; y: number; z: number } {
  const a = ancreDuQuai(plan);
  const ile = origineDe(plan.biome);
  return { x: a.x - ile.x, y: a.y - ile.y, z: a.z - ile.z - 1 };
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
export function monumentIslets(a: ArchipelagoId, village: World, cubes: VoxelCube[]): void {
  const alt = mapOf(a)[0]?.altitude ?? 0;
  const sky = DANS_LE_CIEL[a];
  const top = sky ? SNOW : BLOCKS[BLOC.sable].side;
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
      for (let z = alt - 1; z >= bottom; z--) cubes.push({ x: c.x, y: c.y, z, color: BLOCKS[BLOC.pierre].side, texture: 'pierre', tag: m.biome, place, sol: true });
    }
    if (sky)
      for (const t of taperLayers(land)) cubes.push({ x: t.x, y: t.y, z: alt - DEPTH - t.d, color: BLOCKS[BLOC.pierre].side, texture: 'pierre', tag: m.biome, place, sol: true });
    const done = new Set(village.parts[m.id] ?? []);
    const o = monumentAnchor(m);
    for (const c of planCells(m)) {
      const bd = BLOCKS[c.block];
      cubes.push({ x: o.x + c.x, y: o.y + c.y, z: o.z + c.z, color: bd.side, top: bd.top, texture: bd.texture, tag: m.biome, ghost: !done.has(c.key), place });
    }
  }
}
