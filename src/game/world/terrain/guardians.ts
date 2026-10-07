// Les îlots des Gardiens : leurs cases, leurs marches, leurs cubes, et le Gardien en pierre ou rallumé.
import { type BiomeDef, type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { type ArchipelagoId, type Decor, type Ground, isLand, islandDef, type IslandDef, landscape, noise, smoothNoise, tirage } from '../map';
import type { VoxelCube } from '../cube';
import { chosenGuardian, type Quarts, turnModel, turnPlacedModel } from '../placement';
import { decorate } from '../decor';
import { guardianStatus } from '../../boss';
import { gardienDuMonde } from './creatures';
import { ARENA, bossIsletOrigin, caseDeLIlotDeplace, deplacementDeLIlot, glisseDeLIlot, ISLET_CENTER, ISLET_GAP, ISLET_H, ISLET_W, pointDeLIlotDeplace, reculDeLIlot, RETOUCHES_DE_L_ILOT } from './islets';
import { DEPTH, GROUND_COLOR, taperLayers, TEXTURES } from './base';
import { layoutCache } from '../placement';

/** Coin local où poser un Gardien pour qu'il soit centré sur l'îlot. */
function guardianOffset(id: BiomeId): { x: number; y: number } {
  const g = gardienDuMonde(id);
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

const isletCache = layoutCache<BiomeId, IsletCell[]>();

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
  const under = new Set(gardienDuMonde(id).map((c) => `${off.x + c.x},${off.y + c.y}`));
  const glisse = glisseDeLIlot(id);
  const recul = reculDeLIlot(id);
  const rogne = RETOUCHES_DE_L_ILOT[id]?.rogne ?? 0;
  const land = new Set<string>();
  for (let x = 0; x < ISLET_W; x++)
    for (let y = 0; y < ISLET_H; y++) {
      const dx = (x - ISLET_CENTER.x) / (ISLET_W / 2);
      const dy = (y - ISLET_CENTER.y) / (ISLET_H / 2);
      // Sa côte est tirée là où il se tenait avant de glisser sur le côté : il garde sa forme.
      const t = tirage(def, o.x + glisse + x, o.y - recul + y);
      const coast = (smoothNoise(def.seed + 7, t.x, t.y, 3) - 0.5) * 0.3;
      // Ses rangées de devant rognées (`RETOUCHES_DE_L_ILOT`) ne portent que l'emprise du Gardien.
      if (under.has(`${x},${y}`) || (y >= rogne && Math.hypot(dx, dy) + coast < 0.98)) land.add(`${x},${y}`);
    }
  const cells: IsletCell[] = [];
  // Déplacé autour de son lieu (GD-9) : le même îlot, tourné d'un bloc et posé sur son côté.
  const d = deplacementDeLIlot(def);
  for (const key of land) {
    const [x, y] = key.split(',').map(Number);
    const ax = (x - ISLET_CENTER.x) / ARENA.rx;
    const ay = (y - ISLET_CENTER.y) / ARENA.ry;
    const p = d ? caseDeLIlotDeplace(d, o.x + x, o.y + y) : { x: o.x + x, y: o.y + y };
    cells.push({
      x: p.x,
      y: p.y,
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
 * Gardien. Posées au niveau du sol de l'île (en altitude, elles flottent comme elle). Quand l'îlot a glissé sur le
 * côté (`ILOT_DE_COTE`), le gué le plus court à trois colonnes au plus de l'axe.
 */
export function bossIsletSteps(id: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(id);
  const d = deplacementDeLIlot(def);
  // Détaché de son lieu (choix 4a du mainteneur) : pas de pas japonais, il ne touche pas sa côte.
  if (d?.detache) return [];
  if (d) return pasDeLIlotDeplace(id, d);
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const axe = o.x + Math.round(ISLET_CENTER.x);
  const ilot = bossIsletCells(id);
  let gue: { x: number; back: number; coast: number } | null = null;
  for (const d of glisseDeLIlot(id) ? [0, 1, -1, 2, -2, 3, -3] : [0]) {
    const x = axe + d;
    const colonne = ilot.filter((c) => c.x === x);
    if (!colonne.length) continue;
    const back = Math.max(...colonne.map((c) => c.y));
    // La côte, droit derrière (l'îlot est toujours devant sa terre : un test le tient) ; sans elle, pas de gué.
    let coast = back + 1;
    while (coast <= back + ISLET_H + ISLET_GAP && !isLand(def, x, coast)) coast++;
    if (!isLand(def, x, coast)) continue;
    if (!gue || coast - back < gue.coast - gue.back) gue = { x, back, coast };
  }
  if (!gue) return [];
  const steps: { x: number; y: number; z: number }[] = [];
  for (let y = gue.back + 1; y < gue.coast; y++) steps.push({ x: gue.x + ((y - gue.back) % 2 === 0 ? 1 : 0), y, z: def.altitude });
  return steps;
}

/**
 * Les pas japonais d'un îlot déplacé autour de son lieu (GD-9) : du bord de l'îlot tourné vers la terre jusqu'à la côte,
 * dans l'axe du Gardien, en quinconce, au niveau du sol de l'île ; sans côte droit devant (à trois colonnes près), pas
 * de gué.
 */
function pasDeLIlotDeplace(id: BiomeId, d: NonNullable<ReturnType<typeof deplacementDeLIlot>>): { x: number; y: number; z: number }[] {
  const def = islandDef(id);
  const cells = new Set(bossIsletCells(id).map((c) => `${c.x},${c.y}`));
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const axe = caseDeLIlotDeplace(d, o.x + Math.round(ISLET_CENTER.x), o.y + Math.round(ISLET_CENTER.y));
  const { dx, dy } = d.versLaTerre;
  // Le travers de l'axe : les colonnes voisines, de part et d'autre.
  const tx = dy;
  const ty = -dx;
  let gue: { x: number; y: number; n: number } | null = null;
  for (const k of [0, 1, -1, 2, -2, 3, -3]) {
    let x = axe.x + tx * k;
    let y = axe.y + ty * k;
    if (!cells.has(`${x},${y}`)) continue;
    // Jusqu'au bord de l'îlot, puis l'eau jusqu'à la côte.
    while (cells.has(`${x + dx},${y + dy}`)) [x, y] = [x + dx, y + dy];
    let n = 1;
    while (n <= ISLET_H + ISLET_GAP && !isLand(def, x + dx * n, y + dy * n)) n++;
    if (!isLand(def, x + dx * n, y + dy * n)) continue;
    if (!gue || n < gue.n) gue = { x, y, n };
  }
  if (!gue) return [];
  const steps: { x: number; y: number; z: number }[] = [];
  for (let i = 1; i < gue.n; i++) steps.push({ x: gue.x + dx * i + (i % 2 === 0 ? tx : 0), y: gue.y + dy * i + (i % 2 === 0 ? ty : 0), z: def.altitude });
  return steps;
}

/** Le socle du bloc d'or d'un Gardien vaincu : devant lui, à sa droite, sur la terre de l'îlot. */
function trophySpot(id: BiomeId): { x: number; y: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  const d = deplacementDeLIlot(islandDef(id));
  const target = d ? pointDeLIlotDeplace(d, o.x + ISLET_CENTER.x + 3, o.y + 1) : { x: o.x + ISLET_CENTER.x + 3, y: o.y + 1 };
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

/**
 * L'îlot du Gardien en cubes : terre, sol de l'île, arène, petit décor, pas japonais, et le bloc d'or une fois vaincu.
 * Sans `pas` (une sentinelle qui attend, lot 6), l'îlot n'a pas encore ses pas japonais : le chemin s'ouvre avec le défi.
 */
export function bossIslet(biome: BiomeDef, beaten: boolean, cubes: VoxelCube[], pas = true): void {
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
    for (let d = 1; d <= DEPTH; d++) sol(c.x, c.y, gz - d, BLOCKS[BLOC.terre].side);
    // L'arène : pierre au milieu, galet sur son pourtour ; autour, le sol de l'île, et du sable au bord de la mer.
    const rim = c.arena && [`${c.x - 1},${c.y}`, `${c.x + 1},${c.y}`, `${c.x},${c.y - 1}`, `${c.x},${c.y + 1}`].some((k) => !at.get(k)?.arena);
    const top = c.arena ? (rim ? BLOCKS[BLOC.galet].side : BLOCKS[BLOC.pierre].side) : c.shore && sandy ? BLOCKS[BLOC.sable].side : ground;
    sol(c.x, c.y, gz, top);
  }
  if (gz > 0) for (const t of taperLayers(cells)) sol(t.x, t.y, gz - DEPTH - t.d, BLOCKS[BLOC.pierre].side);
  // Quelques touches du décor de l'île, hors de l'arène et loin des pieds du Gardien.
  const kinds = [...new Set(landscape(def).map((c) => c.decor).filter((k): k is Decor => !!k && SMALL_DECOR.includes(k)))];
  if (kinds.length === 0) kinds.push('rocher');
  const spots = cells
    .filter((c) => !c.arena && !c.guardian)
    .map((c) => {
      const t = tirage(def, c.x + glisseDeLIlot(def.id), c.y - reculDeLIlot(def.id));
      return { c, r: noise(def.seed + 8, t.x, t.y) };
    })
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
      block(s.x, s.y, s.z, BLOCKS[BLOC.galet].side);
      if (s.z === 0) block(s.x, s.y, -1, BLOCKS[BLOC.galet].side);
    }
  // Rallumé : un bloc d'or sur un socle de pierre, devant lui.
  if (trophy) {
    block(trophy.x, trophy.y, gz + 1, BLOCKS[BLOC.pierre].side);
    block(trophy.x, trophy.y, gz + 2, BLOCKS[BLOC.or].side, BLOCKS[BLOC.or].top);
  }
}

/**
 * La pierre éteinte d'une couleur (pour la statue d'un Gardien qui attend d'être rallumé) : un gris froid, un peu bleu,
 * plus sombre que la couleur, qui suit sa luminosité. Froid et sombre pour que les Gardiens déjà gris (le Golem, le Lion
 * de pierre, le Titan…) se voient éteints, puis rallumés dès la première épreuve (GD-8, consultant de Blocland). Les
 * tests reconnaissent cette pierre à sa teinte (vert = rouge + 8, bleu = vert + 16) : la changer, c'est changer `estPierre`.
 */
function stoneOf(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  const g = Math.round(64 + (lum / 255) * 76);
  return `#${(((g - 8) << 16) | (g << 8) | (g + 16)).toString(16).padStart(6, '0')}`;
}

/** Un Gardien éteint, en statue de pierre : chaque cube, et son dessus, en pierre éteinte (`stoneOf` ; le fondu du rallumage part de ces gris). */
export function statueDe<C extends { color: string; top?: string }>(cubes: readonly C[]): C[] {
  return cubes.map((c) => ({ ...c, color: stoneOf(c.color), top: c.top === undefined ? undefined : stoneOf(c.top) }));
}

/**
 * Un Gardien qui se rallume au défi (GD-8) : ses couleurs reviennent des pieds vers la tête, `part` de sa hauteur
 * (entre 0, tout en pierre, et 1, tout en couleurs) ; le reste en pierre.
 */
export function gardienEnPartieRallume<C extends { z: number; color: string; top?: string }>(cubes: readonly C[], part: number): C[] {
  if (part <= 0) return statueDe(cubes);
  if (part >= 1) return [...cubes];
  const zs = cubes.map((c) => c.z);
  const bas = Math.min(...zs);
  const seuil = bas + part * (Math.max(...zs) - bas + 1);
  return cubes.map((c) => (c.z < seuil ? c : { ...c, color: stoneOf(c.color), top: c.top === undefined ? undefined : stoneOf(c.top) }));
}

/**
 * Les Gardiens visibles : éteints, en statue de pierre, tant que leur défi n'est pas réussi ; rallumés, en couleurs,
 * ensuite (GD-8). Avec `sentinelles` (les deux univers depuis GD-8), ceux des îles ouvertes sont là avant que leur
 * défi soit prêt.
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
    const modele = beaten ? gardienDuMonde(b.id) : statueDe(gardienDuMonde(b.id));
    // Sur le lieu tourné (GD-9), le Gardien tourne avec son îlot.
    const def = islandDef(b.id);
    const choisi = chosenGuardian(b.id);
    if (choisi) {
      // Déplacé ou tourné (GD-9) : tourné de son orientation, au milieu de son îlot (là où il l'emporte). Détaché de son
      // lieu (choix 4a), son orientation est celle du monde : le lieu tourné ne le tourne pas.
      const tourne = turnModel(modele, choisi.at ? ((((choisi.turn - def.quarts) % 4) + 4) % 4 as Quarts) : choisi.turn);
      const w = Math.max(...tourne.map((c) => c.x)) + 1;
      const h = Math.max(...tourne.map((c) => c.y)) + 1;
      const centre = { x: x + off.x + (Math.max(...modele.map((c) => c.x)) + 1) / 2, y: y + off.y + (Math.max(...modele.map((c) => c.y)) + 1) / 2 };
      const d = deplacementDeLIlot(def);
      const m = d ? pointDeLIlotDeplace(d, centre.x, centre.y) : centre;
      const pose = turnPlacedModel(def.core, { x: Math.round(m.x - w / 2), y: Math.round(m.y - h / 2), z: z + 1 }, tourne, def.quarts);
      out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes: pose.cubes, origin: pose.origine });
      return;
    }
    const pose = turnPlacedModel(def.core, { x: x + off.x, y: y + off.y, z: z + 1 }, modele, def.quarts);
    out.push({ id: b.id, kind: 'guardian', still: true, beaten, cubes: pose.cubes, origin: pose.origine });
  });
  return out;
}
