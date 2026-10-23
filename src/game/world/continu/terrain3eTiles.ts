// Les tuiles du 3e (découpées de ./terrain3e.ts, qui les réexporte) : la peinture du sol (le granit des flancs, l'herbe
// des Prairies, la teinte des nuages sous leur liseré), ce qui pousse (les pins, les blocs du Cirque) et les tuiles
// entières, sur le gabarit des tuiles du 6e (./terrain.ts). Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, hash2, insidePolygon, type Vec2 } from './geometry';
import { CIRQUE_AREA_3E, COLORS_3E, DETOUR_SPOTS_3E, PARVIS, PARVIS_PAVING, PATH_EDGES_3E, PATH_NODES_3E, PEAK_3E, PLACES_3E, RESERVED_3E, TERRAIN_3E } from './plan3e';
import { SHADOW_DIR_3E } from './sky';
import { drawTileWith, tileRect, type GroundPaint, type HeightField, type P3, type TileDetail } from './terrain';
import { RIM_3E } from './terrain3eEdges';
import { PRAIRIE_BANK, areteClearance, heightAt3e, landDistance3e, langueClearance, mountainDistance, prairieDistance } from './terrain3eHeight';

// ---------- La peinture du sol ----------

/** Une facette moins droite que ça est du granit (un flanc raide, une arête). */
const ROCK_UP = 0.62;
/** Une facette moins droite que ça prend son flanc (au soleil, ou à l'ombre). */
const SLOPE_UP = 0.97;
/** Sous cette hauteur, la pente qui entre dans les nuages : du granit, sous le liseré d'ardoise. */
const SHORE_ROCK = 0.35;

/**
 * Au-delà du liseré d'une Prairie, ce que la grille du sol laisse dépasser des nuages en dents de scie (lot 1, retouche 1,
 * « Reporté » : la rive en gradins) prend la teinte des nuages : ils montent contre le liseré, rien ne se voit dessous.
 */
function underPrairieRim(x: number, z: number): boolean {
  const p = { x, z };
  const pr = prairieDistance(p);
  return pr < PRAIRIE_BANK.edge[0] + 0.15 && pr >= mountainDistance(p);
}

/**
 * Une facette de la rive d'une Prairie qui touche la table en deçà du liseré (un de ses sommets passé le milieu du
 * liseré) se voit de la table : elle reste de l'herbe, quelle que soit la teinte de son milieu, caché sous le liseré.
 * Peinte de la teinte des nuages ou du granit, elle dessinait des dents de scie entre l'herbe et le liseré, surtout de
 * loin, où la grille est plus lâche (relecture des Prairies, (a) 2).
 */
function touchesPrairieTable(a: P3, b: P3, c: P3): boolean {
  // Le milieu du liseré, et non son bord intérieur : entre deux points de son tracé, le liseré passe en corde, en deçà.
  const inner = RIM_3E.inset.prairie;
  const mid = { x: (a[0] + b[0] + c[0]) / 3, z: (a[2] + b[2] + c[2]) / 3 };
  const pr = prairieDistance(mid);
  // Loin de toute rive de Prairie, ou à la montagne : rien à faire (le calcul par sommet n'est fait qu'au bord).
  if (pr > inner + 2 * TERRAIN_3E.step * TERRAIN_3E.coarse || pr < -TERRAIN_3E.step * TERRAIN_3E.coarse || pr < mountainDistance(mid)) return false;
  if (pr >= inner) return false;
  return [a, b, c].some((v) => prairieDistance({ x: v[0], z: v[2] }) >= inner);
}

/** Sur une Prairie, en deçà du milieu du liseré. */
const onPrairieTable = (p: Vec2): boolean => {
  const pr = prairieDistance(p);
  return pr >= RIM_3E.inset.prairie && pr >= mountainDistance(p);
};

/** Une facette de la table plus à plat que ceci se peint de l'herbe sans compenser sa lumière. */
const TABLE_UP = 0.995;

/** Le sens d'où vient le soleil, à plat : un flanc qui le regarde est au soleil. */
const SUN_FLAT = { x: -SHADOW_DIR_3E.x, z: -SHADOW_DIR_3E.z } as const;

/**
 * Une tache du sol, de 0 à 1 : de grands aplats aux bords souples, qui ne suivent jamais la grille (comme au 4e). Des
 * sinus en biais, sans hasard : le même sol à chaque construction.
 */
const patch = (x: number, z: number): number =>
  0.5 + 0.3 * Math.sin(x * 0.041 + z * 0.031 + 0.7) * Math.cos(z * 0.035 - x * 0.023 + 1.4) + 0.2 * Math.sin((x * 0.6 + z) * 0.05 + 0.9);

/**
 * La couleur d'un sol à plat en (x, z), à la hauteur `h` : la pente des rives, en granit ; le haut du cône et les
 * arêtes, en granit ; la langue de glace ; l'herbe grise du Cirque ; l'herbe rase partout ailleurs, en taches au soleil.
 */
function flat3e(x: number, z: number, h: number): number {
  const p = { x, z };
  if (underPrairieRim(x, z)) return COLORS_3E.cloud;
  // Sur une Prairie, en deçà du milieu du liseré : une herbe d'un seul aplat, même là où la table plonge déjà sous lui
  // (relecture des Prairies, (a) 2 ; et (a) 9 : une tache plus claire s'y lisait de près comme une plaque aux bords nets).
  if (onPrairieTable(p)) return COLORS_3E.grass;
  if (h < SHORE_ROCK) return COLORS_3E.granite;
  const k = patch(x, z);
  if (distance(p, PEAK_3E.at) < PEAK_3E.granite || areteClearance(p) < 0.4) return k < 0.6 ? COLORS_3E.granite : COLORS_3E.graniteSun;
  if (langueClearance(p) < 0) return COLORS_3E.ice;
  if (insidePolygon(p, CIRQUE_AREA_3E)) return k < 0.6 ? COLORS_3E.cirque : COLORS_3E.cirqueSun;
  return k < 0.64 ? COLORS_3E.grass : COLORS_3E.grassSun;
}

/** La teinte à l'ombre de chaque aplat du sol (jamais presque noire). */
const SHADE_OF: Readonly<Record<number, number>> = {
  [COLORS_3E.grass]: COLORS_3E.grassShade,
  [COLORS_3E.grassSun]: COLORS_3E.grass,
  [COLORS_3E.cirque]: COLORS_3E.grassShade,
  [COLORS_3E.cirqueSun]: COLORS_3E.cirque,
  [COLORS_3E.granite]: COLORS_3E.graniteShade,
  [COLORS_3E.graniteSun]: COLORS_3E.granite,
  [COLORS_3E.ice]: COLORS_3E.iceShade,
};

/**
 * La couleur d'une facette : le granit si elle est raide (au soleil, clair ; à l'ombre, plus sombre, jamais presque
 * noir) ; sur une pente douce, son aplat au soleil ou à l'ombre ; sinon, le sol à plat.
 */
function facet3e(a: P3, b: P3, c: P3): number {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  const up = Math.abs(ny) / len;
  const sign = ny < 0 ? -1 : 1;
  const toSun = (sign * (nx * SUN_FLAT.x + nz * SUN_FLAT.z)) / len;
  const sunny = toSun > 0.12;
  const x = (a[0] + b[0] + c[0]) / 3;
  const z = (a[2] + b[2] + c[2]) / 3;
  const h = (a[1] + b[1] + c[1]) / 3;
  // La table d'une Prairie, et la pente sous son liseré qu'on voit d'elle : une seule herbe. Une facette penchée vers le
  // soleil prend le ton d'ombre, une facette penchée à l'opposé le ton de soleil : éclairées, elles rendent l'herbe à
  // plat, sans aplat plus clair au bord (relecture des Prairies, (a) 2 et 9).
  if (touchesPrairieTable(a, b, c) || onPrairieTable({ x, z })) {
    if (up >= TABLE_UP) return COLORS_3E.grass;
    return toSun > 0.05 ? COLORS_3E.grassShade : toSun < -0.05 ? COLORS_3E.grassSun : COLORS_3E.grass;
  }
  if (underPrairieRim(x, z)) return COLORS_3E.cloud;
  if (up < ROCK_UP) return sunny ? COLORS_3E.graniteSun : COLORS_3E.graniteShade;
  const base = flat3e(x, z, h);
  if (up >= SLOPE_UP) return base;
  return sunny ? base : (SHADE_OF[base] ?? base);
}

/** Le 3e n'a pas d'écume : la mer de nuages est immobile et mate. */
const noFoam = (): number => 0;

/** La peinture du sol du 3e ; la jupe des tuiles un peu sous leur bord, qui ne trace plus de trait dans l'herbe. */
const PAINT_3E: GroundPaint = { facet: facet3e, flat: flat3e, foam: noFoam, skirtDrop: 0.06 };

// ---------- Ce qui pousse, et les rochers ----------

/** Les couleurs de ce qui pousse : des pins sombres sur les pentes basses (jamais sur les Prairies), des blocs de granit au Cirque. */
export const FLORA_3E_COLORS = { pine: COLORS_3E.pine, pineTop: COLORS_3E.pineShade, boulder: COLORS_3E.graniteShade, boulderTop: COLORS_3E.granite } as const;

/**
 * Où pousse un pin ou se couche un bloc : une place tous les `cell` unités au plus, gardée une fois sur `keep` (au Cirque,
 * `keepCirque`, des blocs) ; jamais à moins de `path` unités d'un chemin, de `place` du centre d'un lieu, de `cut` d'une
 * coupure, de `coast` de la rive, ni sur le Parvis, le haut du cône, les petites arches, les places réservées (les
 * Détours, les grands projets).
 */
const FLORA_KEEP = { cell: 10, keep: 0.09, keepCirque: 0.12, path: 3.2, place: 13, cut: 3, coast: 4, parvis: 8, spot: 7, peak: PEAK_3E.flank.outer } as const;

/** Les tronçons des chemins du 3e (pour garder ce qui pousse à distance). */
const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
  return PATH_EDGES_3E.map(([a, b]) => [at.get(a)!, at.get(b)!] as const);
})();

const nearPath = (p: Vec2, reach: number): boolean => SEGMENTS.some(([a, b]) => distanceToPolyline(p, [a, b]) < reach);
const nearPlace = (p: Vec2): boolean => PLACES_3E.some((pl) => Math.hypot(p.x - pl.center.x, p.z - pl.center.z) < FLORA_KEEP.place);

/** Les places gardées libres : les Détours, les grands projets. */
const SPOTS: readonly Vec2[] = [...Object.values(DETOUR_SPOTS_3E), RESERVED_3E.fusee.center, RESERVED_3E.chateau.center, RESERVED_3E.colonne.center];

/** Le Parvis : sa place et ses bâtiments. */
function nearParvis(p: Vec2): boolean {
  const l = PARVIS.toLocal(p);
  const k = FLORA_KEEP.parvis;
  const s = PARVIS_PAVING.square;
  return l.x > s.x0 - k && l.x < s.x1 + k && l.z > -k && l.z < s.z1 + k;
}

/** Un pin ou un bloc : sa place, son sol, sa taille, son quart de tour. */
interface Plant {
  x: number;
  z: number;
  y: number;
  size: number;
  yaw: number;
  pine: boolean;
}

const plantsOf = new Map<number, readonly Plant[]>();

/** Ce qui pousse dans une tuile (calculé une fois). */
function plantsIn(tx: number, tz: number): readonly Plant[] {
  const key = tz * TERRAIN_3E.tilesX + tx;
  const known = plantsOf.get(key);
  if (known) return known;
  const r = tileRect(tx, tz, TERRAIN_3E);
  const out: Plant[] = [];
  const c = FLORA_KEEP.cell;
  for (let j = Math.floor(r.minZ / c); j * c < r.maxZ; j++)
    for (let i = Math.floor(r.minX / c); i * c < r.maxX; i++) {
      const p = { x: (i + 0.15 + 0.7 * hash2(i + 211, j)) * c, z: (j + 0.15 + 0.7 * hash2(i, j + 307)) * c };
      if (p.x < r.minX || p.x >= r.maxX || p.z < r.minZ || p.z >= r.maxZ) continue;
      const cirque = insidePolygon(p, CIRQUE_AREA_3E);
      if (hash2(i + 19, j + 29) > (cirque ? FLORA_KEEP.keepCirque : FLORA_KEEP.keep)) continue;
      if (landDistance3e(p) < FLORA_KEEP.coast || distance(p, PEAK_3E.at) < FLORA_KEEP.peak) continue;
      if (areteClearance(p) < FLORA_KEEP.cut || langueClearance(p) < FLORA_KEEP.cut) continue;
      if (nearPath(p, FLORA_KEEP.path) || nearPlace(p) || nearParvis(p)) continue;
      // Pas un pin sur les Prairies : le Cèdre y est le seul arbre (relecture des Prairies, (a) 3).
      if (prairieDistance(p) >= mountainDistance(p)) continue;
      if (SPOTS.some((s) => Math.hypot(p.x - s.x, p.z - s.z) < FLORA_KEEP.spot)) continue;
      out.push({ x: p.x, z: p.z, y: heightAt3e(p), size: 0.8 + 0.5 * hash2(i + 7, j + 13), yaw: 6.283 * hash2(i + 31, j + 17), pine: !cirque });
    }
  plantsOf.set(key, out);
  return out;
}

/** Les triangles d'un pin et d'un bloc, de près et de loin (comptés sans construire). */
const PLANT_TRIANGLES = { pineNear: 12, pineFar: 6, boulder: 15 } as const;

/** Un pin : deux cônes empilés (un seul de loin) ; un bloc de granit : un bloc à pans, couché. */
function drawPlant(b: FacetBuilder, t: Plant, detail: TileDetail): number {
  const s = t.size;
  const C = FLORA_3E_COLORS;
  if (!t.pine) {
    b.prism({ x: t.x, y: t.y - 0.4, z: t.z, yaw: t.yaw }, 1.3 * s, 0.8 * s, 1.1 * s, 5, C.boulder, C.boulderTop);
    return PLANT_TRIANGLES.boulder;
  }
  if (detail === 'far') {
    b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.3 * s, 0, 4.2 * s, 6, C.pine);
    return PLANT_TRIANGLES.pineFar;
  }
  b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.4 * s, 0, 3 * s, 6, C.pine);
  b.prism({ x: t.x, y: t.y + 1.6 * s, z: t.z, yaw: t.yaw + 0.5 }, 1, 0, 2.6 * s, 6, C.pineTop);
  return PLANT_TRIANGLES.pineNear;
}

/** Ce qui pousse dans une tuile, ou son seul nombre de triangles (sans `b`). */
function drawFlora3e(tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
  let count = 0;
  for (const t of plantsIn(tx, tz)) count += b ? drawPlant(b, t, detail) : t.pine ? (detail === 'near' ? PLANT_TRIANGLES.pineNear : PLANT_TRIANGLES.pineFar) : PLANT_TRIANGLES.boulder;
  return count;
}

// ---------- Les tuiles ----------

/** Le sol d'une tuile du 3e (le premier temps de la réserve des tuiles). */
export function tileGround3e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_3E);
  return b.build();
}

/** Ce qui pousse dans une tuile du 3e (le second temps). */
export function tileFlora3e(_field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawFlora3e(tx, tz, detail, b);
  return b.build();
}

/** Une tuile du 3e entière : son sol, puis ce qui y pousse. */
export function tileFacets3e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_3E);
  drawFlora3e(tx, tz, detail, b);
  return b.build();
}

/** Le nombre de triangles de chaque tuile entière du 3e à un niveau de détail, par rang (sans rien construire). */
export function tileCounts3e(field: HeightField, detail: TileDetail): Int32Array {
  const { tilesX, tilesZ } = TERRAIN_3E;
  const out = new Int32Array(tilesX * tilesZ);
  for (let tz = 0; tz < tilesZ; tz++) for (let tx = 0; tx < tilesX; tx++) out[tz * tilesX + tx] = drawTileWith(field, tx, tz, detail, null, PAINT_3E) + drawFlora3e(tx, tz, detail, null);
  return out;
}

/** Ce qui bloque la marche libre dans une tuile du 3e (./freeWalk.ts) : chaque pin et chaque bloc, un disque chacun. */
export function obstaclesIn3e(tx: number, tz: number): { x: number; z: number; r: number }[] {
  return plantsIn(tx, tz).map((t) => ({ x: t.x, z: t.z, r: (t.pine ? 1.2 : 1.3) * t.size }));
}
