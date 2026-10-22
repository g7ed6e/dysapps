// Le terrain du 3e (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses ») : une montagne seule et trois
// Prairies posées sur une mer de nuages, un seul sol juste au-dessus d'elle, jamais d'étage (fiche, § 5). La mer de
// nuages est le plan d'eau du monde ouvert, opaque et mat, à la même hauteur partout (./sea.ts) : chaque rive entre
// dessous en pente douce, comme une plage, si bien qu'aucun dessous d'île ne se voit jamais. Au centre de la montagne,
// le pic, une pyramide de neige qu'on ne visite pas, sur le haut d'un cône de granit au flanc doux ; trois coupures
// vraies vont du pic aux nuages : l'arête ouest et l'arête est, deux crêtes de granit, et la langue de glace, à plat,
// mate. Le Cirque, au nord, se lit en creux sous le pic : une levée douce longe sa rive. Le pic, ses arêtes et la langue
// de glace ne se marchent pas (`walkBlocked3e`). Les tuiles, leurs deux niveaux de détail et leurs anneaux sont ceux du
// 6e (./terrain.ts) : seuls la hauteur, la peinture et ce qui pousse changent. Le pic se voit de toute la montagne : une
// pyramide à facettes, dessinée avec les lieux (`peakFacets`). Sur la Carte, le haut du cône et les arêtes sont hachurés,
// la langue de glace une bande pâle bordée d'ardoise (`mapOverlay3e`). Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, distanceToPolyline, hash2, insidePolygon, signedDistance, smoothstep, type Vec2 } from './geometry';
import {
  ARETES_3E,
  ARETE_EST_3E,
  ARETE_OUEST_3E,
  CIRQUE_AREA_3E,
  COLORS_3E,
  COL_3E,
  DETOUR_SPOTS_3E,
  LANGUE_3E,
  LANGUE_LOOK_3E,
  MOUNTAIN_3E,
  PARVIS,
  PARVIS_PAVING,
  PATH_EDGES_3E,
  PATH_NODES_3E,
  PEAK_3E,
  PLACES_3E,
  PRAIRIES_3E,
  RESERVED_3E,
  SMALL_ARCHES_3E,
  TERRAIN_3E,
  alongPolyline,
  parvisFloor,
} from './plan3e';
import { SHADOW_DIR_3E } from './sky';
import { drawTileWith, farHeightsOf, heightOnFar, heightOnMesh, tileRect, type GroundPaint, type HeightField, type P3, type TileDetail } from './terrain';

/** Le fond sous les nuages : la pente des rives y descend, cachée par le plan des nuages. */
const CLOUD_FLOOR = -1.5;
/**
 * Les rives : de la mer de nuages au sol, sur tant d'unités (la montagne, une pente douce comme une plage ; les Prairies,
 * leur bord à un ou deux pas au-dessus des nuages) ; sous les nuages, sur tant d'autres.
 */
const BANK = { mountain: 5, prairie: 2.2, under: 3 } as const;
/** Le sol où l'on marche : la montagne à `mountain` (son ondulation en plus), les Prairies à `prairie`, plates. */
const LEVEL = { mountain: 1.25, swell: 0.35, prairie: 1.35, prairieSwell: 0.1 } as const;
/** La levée douce le long de la rive nord du Cirque : sa hauteur, de `rise[0]` à `rise[1]` unités de la rive, jusqu'à `fade`. */
const CIRQUE_RIM = { height: 2.2, rise: [3, 10], fade: [13, 28] } as const;

/** La distance à la rive de la montagne : positive sur elle. */
const mountainDistance = (p: Vec2): number => signedDistance(p, MOUNTAIN_3E);

/** La distance à la rive de la Prairie la plus proche : positive sur elle. */
const prairieDistance = (p: Vec2): number =>
  Math.max(signedDistance(p, PRAIRIES_3E.grande), signedDistance(p, PRAIRIES_3E.deuxieme), signedDistance(p, PRAIRIES_3E.petite));

/** La distance signée à la terre : positive sur la montagne et les Prairies, négative au-dessus de la mer de nuages. */
export function landDistance3e(p: Vec2): number {
  return Math.max(mountainDistance(p), prairieDistance(p));
}

/** La distance au bord de la langue de glace : négative dedans. */
export const langueClearance = (p: Vec2): number => distanceToPolyline(p, LANGUE_3E) - LANGUE_LOOK_3E.halfWidth;

/** La distance au bord de l'arête est : négative dedans (la galerie du col la traverse). */
export const areteEstClearance = (p: Vec2): number => distanceToPolyline(p, ARETE_EST_3E) - ARETES_3E.halfWidth;

/** La distance au bord de la plus proche des deux arêtes : négative dedans. */
const areteClearance = (p: Vec2): number => Math.min(distanceToPolyline(p, ARETE_OUEST_3E), distanceToPolyline(p, ARETE_EST_3E)) - ARETES_3E.halfWidth;

/** Une ondulation lente du sol, de 0 à 1 (des sinus, aucun hasard : le même sol à chaque construction). */
const wave = (p: Vec2): number => 0.5 + 0.25 * Math.sin(p.x * 0.07 + 0.4) * Math.cos(p.z * 0.06 - 0.8) + 0.25 * Math.sin((p.x + p.z) * 0.045 + 1.3);

/** Le flanc du cône, de 0 au pied à `PEAK_3E.flank.height` au haut, en pente douce. */
const flank = (d: number): number => PEAK_3E.flank.height * (1 - smoothstep(PEAK_3E.flank.inner, PEAK_3E.flank.outer, d));

/** La crête d'une arête au-dessus du sol en `p` : haute au pied du pic, basse au bord des nuages ; nulle au col de l'arête est. */
function ridgeHeight(p: Vec2): number {
  let h = 0;
  for (const line of [ARETE_OUEST_3E, ARETE_EST_3E]) {
    const { d, s } = alongPolyline(p, line);
    if (d >= ARETES_3E.halfWidth) continue;
    let crest = ARETES_3E.low + (ARETES_3E.high - ARETES_3E.low) * Math.exp(-s / ARETES_3E.fall);
    if (line === ARETE_EST_3E) crest *= smoothstep(ARETES_3E.col[0], ARETES_3E.col[1], distance(p, COL_3E));
    h = Math.max(h, crest * (1 - (d / ARETES_3E.halfWidth) ** 2));
  }
  return h;
}

/** Le col de l'arête est : le sol y est celui du replat à moins de tant d'unités, puis rejoint le flanc du cône à tant. */
const COL_NOTCH = [12, 26] as const;

/** La levée de la rive nord du Cirque, en `p`, à `coast` unités de la rive. */
function cirqueRim(p: Vec2, coast: number): number {
  if (coast > CIRQUE_RIM.fade[1] || !insidePolygon(p, CIRQUE_AREA_3E)) return 0;
  return CIRQUE_RIM.height * smoothstep(CIRQUE_RIM.rise[0], CIRQUE_RIM.rise[1], coast) * (1 - smoothstep(CIRQUE_RIM.fade[0], CIRQUE_RIM.fade[1], coast));
}

/**
 * La hauteur du sol, avant la grille : sous les nuages, la pente des rives ; sur les Prairies, une table plate ; sur la
 * montagne, le sol ondulé, le flanc du cône, les arêtes, la levée du Cirque, la langue de glace un rien plus bas.
 */
export function heightAt3e(p: Vec2): number {
  const m = mountainDistance(p);
  const pr = prairieDistance(p);
  const coast = Math.max(m, pr);
  if (coast < 0) return CLOUD_FLOOR * smoothstep(0, BANK.under, -coast);
  if (pr >= m) return (LEVEL.prairie + LEVEL.prairieSwell * wave(p)) * smoothstep(0, BANK.prairie, pr);
  const d = distance(p, PEAK_3E.at);
  // Le col : le sol y redescend au niveau du replat (le flanc du cône s'y efface), pour que la galerie passe à plat.
  const ground = LEVEL.mountain + LEVEL.swell * wave(p) + flank(d);
  const notch = 1 - smoothstep(COL_NOTCH[0], COL_NOTCH[1], distance(p, COL_3E));
  let h = ground + (LEVEL.mountain - ground) * notch + ridgeHeight(p) + cirqueRim(p, m);
  const ice = langueClearance(p);
  if (ice < 1) h -= LANGUE_LOOK_3E.sink * (1 - smoothstep(-1, 1, ice));
  return h * smoothstep(0, BANK.mountain, m);
}

/** Le haut du cône, les arêtes et la langue de glace : on n'y marche pas (la marche libre les contourne ; un toucher mène à côté). */
export const walkBlocked3e = (p: Vec2): boolean => distance(p, PEAK_3E.at) < PEAK_3E.blocked || areteClearance(p) < 0.6 || langueClearance(p) < 0.6;

let fieldCache: HeightField | null = null;

/** La carte de hauteurs du 3e (une fois), son terrain de loin abaissé sous les chemins, comme au 6e. */
export function buildHeightField3e(): HeightField {
  if (fieldCache) return fieldCache;
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN_3E;
  const nx = tilesX * tileCells + 1;
  const nz = tilesZ * tileCells + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt3e({ x: minX + i * step, z: minZ + j * step });
  const field: HeightField = { minX, minZ, step, nx, nz, heights, far: heights };
  fieldCache = { ...field, far: farHeightsOf(field, PATH_NODES_3E, PATH_EDGES_3E, (x, z) => groundOn3e(field, x, z)) };
  return fieldCache;
}

/** Le point est-il dans la grille du 3e ? */
const inGrid = (f: HeightField, x: number, z: number): boolean => x >= f.minX && z >= f.minZ && x <= f.minX + (f.nx - 1) * f.step && z <= f.minZ + (f.nz - 1) * f.step;

/** Le sol dessiné de près du 3e en (x, z) : sur la grille, comme la tuile ; au-delà, la hauteur du plan. */
export const groundOn3e = (f: HeightField, x: number, z: number): number => (inGrid(f, x, z) ? heightOnMesh(f, x, z) : heightAt3e({ x, z }));

/**
 * Le sol où l'on marche au 3e : la pierre du Parvis, la chaussée des deux petites arches des Prairies, puis la carte de
 * hauteurs. La scène (./levelWorld.ts) et le budget (./budget.ts) lisent la même (expert frontend, relecture du lot 1).
 */
export const ground3e =
  (field: HeightField) =>
  (x: number, z: number): number =>
    parvisFloor(x, z) ?? smallArchFloor(x, z) ?? groundOn3e(field, x, z);

// ---------- La peinture du sol ----------

/** Une facette moins droite que ça est du granit (un flanc raide, une arête). */
const ROCK_UP = 0.62;
/** Une facette moins droite que ça prend son flanc (au soleil, ou à l'ombre). */
const SLOPE_UP = 0.97;
/** Sous cette hauteur, la pente qui entre dans les nuages : du granit, sous le liseré d'ardoise. */
const SHORE_ROCK = 0.35;

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
  const sunny = (sign * (nx * SUN_FLAT.x + nz * SUN_FLAT.z)) / len > 0.12;
  const x = (a[0] + b[0] + c[0]) / 3;
  const z = (a[2] + b[2] + c[2]) / 3;
  const h = (a[1] + b[1] + c[1]) / 3;
  if (up < ROCK_UP) return sunny ? COLORS_3E.graniteSun : COLORS_3E.graniteShade;
  const base = flat3e(x, z, h);
  if (up >= SLOPE_UP) return base;
  return sunny ? base : (SHADE_OF[base] ?? base);
}

/** Le 3e n'a pas d'écume : la mer de nuages est immobile et mate. */
const noFoam = (): number => 0;

const PAINT_3E: GroundPaint = { facet: facet3e, flat: flat3e, foam: noFoam };

// ---------- Ce qui pousse, et les rochers ----------

/** Les couleurs de ce qui pousse : des pins sombres sur les pentes basses et les Prairies, des blocs de granit au Cirque. */
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

// ---------- Le pic ----------

/**
 * Le pic (fiche, § 1 : « une pyramide de neige ») : une pyramide à facettes, dessinée avec les lieux pour se voir de toute
 * la montagne (le sol des tuiles s'arrête au brouillard). Chaque face, coupée en deux pans le long de sa ligne de plus
 * grande pente, à son ton de neige selon le soleil ; son pied, en granit, où le cône l'enveloppe. Le sol des tuiles, plus
 * bas sous elle, y reste caché. Aucun reflet, aucune pointe de glace.
 */
export function peakFacets(): Facets {
  const b = new FacetBuilder();
  const { at, radius, height, base, sides, yaw } = PEAK_3E;
  const corner = (k: number, r: number, y: number): P3 => {
    const a = yaw + (2 * Math.PI * k) / sides;
    return [at.x + r * Math.cos(a), y, at.z + r * Math.sin(a)];
  };
  const top: P3 = [at.x, base + height, at.z];
  // Le pied en granit jusqu'au quart de la hauteur, la neige au-dessus.
  const snowFrom = 0.26;
  const ring = (k: number): P3 => corner(k, radius * (1 - snowFrom), base + height * snowFrom);
  const lit = (a: P3, c: P3, d: P3) => {
    const ux = c[0] - a[0], uz = c[2] - a[2], vx = d[0] - a[0], vz = d[2] - a[2];
    const uy = c[1] - a[1], vy = d[1] - a[1];
    const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx;
    return nx * -SHADOW_DIR_3E.x + nz * -SHADOW_DIR_3E.z > 0;
  };
  for (let k = 0; k < sides; k++) {
    const n = k + 1;
    const a0 = corner(k, radius, base);
    const a1 = corner(n, radius, base);
    const r0 = ring(k);
    const r1 = ring(n);
    // Le milieu de la face, sur sa ligne de plus grande pente : chaque face en deux pans, l'un plus clair que l'autre.
    const midBase: P3 = [(a0[0] + a1[0]) / 2, base, (a0[2] + a1[2]) / 2];
    const midRing: P3 = [(r0[0] + r1[0]) / 2, r0[1], (r0[2] + r1[2]) / 2];
    // Vue de dehors, dans le sens inverse des aiguilles d'une montre : du coin `k + 1` au coin `k`.
    const sunny = lit(a1, a0, top);
    b.quad(a1, midBase, midRing, r1, sunny ? COLORS_3E.graniteSun : COLORS_3E.granite);
    b.quad(midBase, a0, r0, midRing, sunny ? COLORS_3E.granite : COLORS_3E.graniteShade);
    b.triangle(r1, midRing, top, sunny ? COLORS_3E.snow : COLORS_3E.snowShade);
    b.triangle(midRing, r0, top, sunny ? COLORS_3E.snowShade : COLORS_3E.snowShade);
  }
  return b.build();
}

// ---------- Le liseré d'ardoise des rives ----------

/**
 * Le liseré d'ardoise (fiche, § 5, « La limite de ce qu'on marche » ; avis dys, point 1) : à chaque rive, celle de la
 * montagne comme celle de chaque Prairie, un bourrelet de pierre continu, qui se lit par sa forme autant que par sa
 * couleur. `inset` : sa place, en deçà de la rive (la montagne, en pente douce ; les Prairies, au bord) ; `width`,
 * `height` : sa largeur et sa hauteur au-dessus du sol ; `foot` : jusqu'où ses flancs descendent ; `step` : le pas de son
 * tracé le long de la rive.
 */
const RIM_3E = { inset: { mountain: 2.2, prairie: 1.1 }, width: 0.9, height: 0.28, foot: 0.6, step: 4.5 } as const;

/** Une rive repassée à un pas régulier, fermée. */
function resampleLoop(loop: readonly Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i],
      c = loop[(i + 1) % loop.length];
    const n = Math.max(1, Math.ceil(distance(a, c) / step));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((c.x - a.x) * k) / n, z: a.z + ((c.z - a.z) * k) / n });
  }
  return out;
}

/**
 * Le liseré d'une rive : chaque point repassé, poussé vers la terre de `inset` (la normale qui entre dans le polygone),
 * posé sur le sol ; un dessus et deux flancs par tronçon.
 */
function rimOf(b: FacetBuilder, loop: readonly Vec2[], inset: number): void {
  const pts = resampleLoop(loop, RIM_3E.step);
  const n = pts.length;
  const inward = (i: number): Vec2 => {
    const a = pts[(i - 1 + n) % n],
      c = pts[(i + 1) % n];
    const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nrm = { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
    return insidePolygon({ x: pts[i].x + nrm.x * 0.5, z: pts[i].z + nrm.z * 0.5 }, loop) ? nrm : { x: -nrm.x, z: -nrm.z };
  };
  const w = RIM_3E.width / 2;
  const ring = pts.map((p, i) => {
    const m = inward(i);
    const c = { x: p.x + m.x * inset, z: p.z + m.z * inset };
    const y = Math.max(heightAt3e(c), heightAt3e({ x: c.x + m.x * w, z: c.z + m.z * w }), 0.05);
    return { out: { x: c.x - m.x * w, z: c.z - m.z * w }, in: { x: c.x + m.x * w, z: c.z + m.z * w }, y };
  });
  const up = (a: P3, c: P3, d: P3, e: P3, color: number, want: P3) => {
    const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * want[0] + ny * want[1] + nz * want[2] >= 0) b.quad(a, c, d, e, color);
    else b.quad(e, d, c, a, color);
  };
  for (let i = 0; i < n; i++) {
    const p = ring[i],
      q = ring[(i + 1) % n];
    const tp = p.y + RIM_3E.height,
      tq = q.y + RIM_3E.height;
    const m = inward(i);
    up([p.out.x, tp, p.out.z], [q.out.x, tq, q.out.z], [q.in.x, tq, q.in.z], [p.in.x, tp, p.in.z], COLORS_3E.slateTop, [0, 1, 0]);
    up([p.out.x, p.y - RIM_3E.foot, p.out.z], [q.out.x, q.y - RIM_3E.foot, q.out.z], [q.out.x, tq, q.out.z], [p.out.x, tp, p.out.z], COLORS_3E.slate, [-m.x, 0, -m.z]);
    up([p.in.x, p.y - RIM_3E.foot, p.in.z], [q.in.x, q.y - RIM_3E.foot, q.in.z], [q.in.x, tq, q.in.z], [p.in.x, tp, p.in.z], COLORS_3E.slate, [m.x, 0, m.z]);
  }
}

/** Les liserés d'ardoise des quatre rives : la montagne et les trois Prairies. */
export function shoreRimFacets(): Facets {
  const b = new FacetBuilder();
  rimOf(b, MOUNTAIN_3E, RIM_3E.inset.mountain);
  for (const loop of [PRAIRIES_3E.grande, PRAIRIES_3E.deuxieme, PRAIRIES_3E.petite]) rimOf(b, loop, RIM_3E.inset.prairie);
  return b.build();
}

// ---------- Les petites arches des Prairies ----------

/**
 * Les petites arches (fiche, § 5) et les arches basses : une chaussée de granit large comme une route, au ras des nuages,
 * parapet plein et haut des deux côtés ; dessous, une rangée d'arches basses dont les ouvertures sont à demi enfoncées
 * dans le blanc (aucune pile ne se voit plonger). `deck` : le dessus de la chaussée (celui d'un pont) ; `half` : sa
 * demi-largeur ; `ramp` : la longueur de ses rampes sur chaque rive ; `parapet` : la hauteur et l'épaisseur du parapet ;
 * `arch` : l'écart des arches, leur rayon (le haut de leur ouverture au-dessus des nuages) ; `foot` : le bas de ses murs,
 * sous les nuages.
 */
const CAUSEWAY_3E = { deck: 1.9, half: 2.1, ramp: 4, parapet: { height: 0.95, thick: 0.4 }, arch: { gap: 4.6, radius: 1.3 }, foot: -1 } as const;

/** Une chaussée : son bout `a`, son sens, la part au-dessus des nuages (`water`, depuis `a`), la hauteur de ses rives. */
export interface Causeway {
  a: Vec2;
  dir: Vec2;
  length: number;
  water: readonly [number, number];
  base: readonly [number, number];
}

/** La chaussée de la liaison `a`–`c` : ce qu'elle franchit des nuages, et le sol de ses deux rives. */
function causewayOf(a: Vec2, c: Vec2): Causeway {
  const length = distance(a, c);
  const dir = { x: (c.x - a.x) / length, z: (c.z - a.z) / length };
  let w0 = length,
    w1 = 0;
  for (let d = 0; d <= length; d += 0.1) {
    if (landDistance3e({ x: a.x + dir.x * d, z: a.z + dir.z * d }) >= 0) continue;
    w0 = Math.min(w0, d);
    w1 = Math.max(w1, d);
  }
  const at = (d: number) => ({ x: a.x + dir.x * d, z: a.z + dir.z * d });
  const base = [heightAt3e(at(w0 - CAUSEWAY_3E.ramp - 1)), heightAt3e(at(w1 + CAUSEWAY_3E.ramp + 1))] as const;
  return { a, dir, length, water: [w0, w1], base };
}

const SMALL_CAUSEWAYS: readonly Causeway[] = SMALL_ARCHES_3E.map(([u, v]) => {
  const at = (id: string) => PATH_NODES_3E.find((n) => n.id === id)!.at;
  return causewayOf(at(u), at(v));
});

/** Le dessus d'une chaussée à `d` unités de son bout `a` : sa rampe d'une rive, le plein au-dessus des nuages, l'autre rampe. */
function causewayTop(s: Causeway, d: number): number {
  const { deck, ramp } = CAUSEWAY_3E;
  const [w0, w1] = s.water;
  if (d < w0 - 1) return s.base[0] + (deck - s.base[0]) * smoothstep(w0 - 1 - ramp, w0 - 1, d);
  if (d > w1 + 1) return s.base[1] + (deck - s.base[1]) * (1 - smoothstep(w1 + 1, w1 + 1 + ramp, d));
  return deck;
}

/**
 * Le dessus des petites arches sous un point du monde (`x`, `z`), ou rien hors d'elles : Kéo s'y tient (toujours
 * ouvertes). Lue à chaque image : rien n'y est créé.
 */
export function smallArchFloor(x: number, z: number): number | null {
  for (const s of SMALL_CAUSEWAYS) {
    const dx = x - s.a.x,
      dz = z - s.a.z;
    const d = dx * s.dir.x + dz * s.dir.z;
    if (d < s.water[0] - 1 - CAUSEWAY_3E.ramp || d > s.water[1] + 1 + CAUSEWAY_3E.ramp) continue;
    if (Math.abs(-dx * s.dir.z + dz * s.dir.x) > CAUSEWAY_3E.half) continue;
    return causewayTop(s, d);
  }
  return null;
}

/** Les morceaux d'une chaussée de `d0` à `d1` unités de son bout : ses murs et ses arches (par travée), son dessus, son parapet. */
export interface CausewayParts {
  bays: Facets[];
  deck: Facets;
  parapets: Facets;
}

/**
 * Une chaussée dessinée de `d0` à `d1` le long de `s` : par travée, ses deux murs pleins jusque sous les nuages, une
 * ouverture d'arche à demi enfoncée peinte sur chacun (un demi-disque d'ardoise, son haut à `arch.radius` au-dessus des
 * nuages) ; son dessus de granit, qui suit les rampes ; les deux parapets pleins. `granite` : la pierre ; `surface` : le
 * dessus à `d` unités de `a` (celui des petites arches, ou celui d'un pont, que lit la marche : ./bridges.ts).
 */
export function causewayParts(s: Causeway, d0: number, d1: number, granite: { side: number; top: number }, surface: (d: number) => number = (d) => causewayTop(s, d)): CausewayParts {
  const { half, parapet, arch, foot } = CAUSEWAY_3E;
  const at = (d: number, v: number) => ({ x: s.a.x + s.dir.x * d - s.dir.z * v, z: s.a.z + s.dir.z * d + s.dir.x * v });
  const p3 = (d: number, v: number, y: number): P3 => {
    const q = at(d, v);
    return [q.x, y, q.z];
  };
  const bays: Facets[] = [];
  const n = Math.max(1, Math.round((d1 - d0) / arch.gap));
  const len = (d1 - d0) / n;
  for (let k = 0; k < n; k++) {
    const b = new FacetBuilder();
    const u0 = d0 + k * len,
      u1 = u0 + len;
    const t0 = surface(u0) - 0.02,
      t1 = surface(u1) - 0.02;
    // Les deux murs, tournés vers le dehors ; les deux bouts de la chaussée fermés.
    b.quad(p3(u1, half, foot), p3(u0, half, foot), p3(u0, half, t0), p3(u1, half, t1), granite.side);
    b.quad(p3(u0, -half, foot), p3(u1, -half, foot), p3(u1, -half, t1), p3(u0, -half, t0), granite.side);
    if (k === 0) b.quad(p3(u0, half, foot), p3(u0, -half, foot), p3(u0, -half, t0), p3(u0, half, t0), granite.side);
    if (k === n - 1) b.quad(p3(u1, -half, foot), p3(u1, half, foot), p3(u1, half, t1), p3(u1, -half, t1), granite.side);
    // L'ouverture d'arche, à demi enfoncée dans les nuages, peinte sur chaque mur (seulement là où le mur est haut).
    const mid = (u0 + u1) / 2;
    if (surface(mid) > arch.radius + 0.35)
      for (const side of [1, -1]) {
        const v = side * (half + 0.03);
        const steps = 5;
        for (let i = 0; i < steps; i++) {
          const a0 = (Math.PI * i) / steps,
            a1 = (Math.PI * (i + 1)) / steps;
          const c = p3(mid, v, 0);
          const e0 = p3(mid + Math.cos(a0) * arch.radius * 1.2, v, Math.sin(a0) * arch.radius);
          const e1 = p3(mid + Math.cos(a1) * arch.radius * 1.2, v, Math.sin(a1) * arch.radius);
          if (side > 0) b.triangle(c, e1, e0, COLORS_3E.slate);
          else b.triangle(c, e0, e1, COLORS_3E.slate);
        }
      }
    bays.push(b.build());
  }
  // Le dessus, par pans qui suivent les rampes.
  const deck = new FacetBuilder();
  const m = Math.max(2, Math.ceil((d1 - d0) / 3));
  for (let k = 0; k < m; k++) {
    const u0 = d0 + ((d1 - d0) * k) / m,
      u1 = d0 + ((d1 - d0) * (k + 1)) / m;
    deck.quad(p3(u0, half, surface(u0)), p3(u1, half, surface(u1)), p3(u1, -half, surface(u1)), p3(u0, -half, surface(u0)), granite.top);
  }
  // Les deux parapets pleins, d'un bout à l'autre, qui suivent le dessus.
  const rails = new FacetBuilder();
  for (const v of [half - parapet.thick / 2, -(half - parapet.thick / 2)])
    for (let k = 0; k < m; k++) {
      const u0 = d0 + ((d1 - d0) * k) / m,
        u1 = d0 + ((d1 - d0) * (k + 1)) / m;
      const a = at(u0, v),
        c = at(u1, v);
      rails.beam({ x: a.x, y: surface(u0) + parapet.height / 2, z: a.z }, { x: c.x, y: surface(u1) + parapet.height / 2, z: c.z }, parapet.height, granite.side);
    }
  return { bays, deck: deck.build(), parapets: rails.build() };
}

/** Les deux petites arches des Prairies, entières (toujours ouvertes), dans le maillage des chemins. */
export function smallArchFacets(): Facets {
  return mergeFacets(
    SMALL_CAUSEWAYS.flatMap((s) => {
      const parts = causewayParts(s, s.water[0] - 1 - CAUSEWAY_3E.ramp, s.water[1] + 1 + CAUSEWAY_3E.ramp, { side: COLORS_3E.granite, top: COLORS_3E.graniteSun });
      return [...parts.bays, parts.deck, parts.parapets];
    }),
  );
}

// ---------- Le haut du cône et les coupures sur la Carte ----------

/**
 * Les hachures sur la Carte (fiche, § 5 bis : « le pic et les deux arêtes sont hachurés, du pic aux nuages ») : des
 * bandes en biais, tous les `gap` unités, larges de `width`, posées `lift` au-dessus du sol, par pas de `step` le long
 * d'elles, sur le haut du cône et les deux arêtes. Un gris-bleu clair, espacées (comme au 4e : des rayures serrées et
 * très contrastées gênent certains lecteurs). Sur la Carte seulement, dans le maillage des lieux.
 */
const HATCH_3E = { gap: 8, width: 0.9, lift: 0.6, step: 2, color: 0xa9b3c6 } as const;

/** Ce point est-il hachuré sur la Carte (le haut du cône, une arête, sur la terre) ? */
const hatched = (p: Vec2): boolean => landDistance3e(p) > 0.5 && (distance(p, PEAK_3E.at) < PEAK_3E.blocked || areteClearance(p) < 0);

function peakMapHatch(): Facets {
  const b = new FacetBuilder();
  const { gap, width, lift, step, color } = HATCH_3E;
  const pts = [...ARETE_OUEST_3E, ...ARETE_EST_3E];
  const minX = Math.min(...pts.map((p) => p.x)) - 10,
    maxX = Math.max(...pts.map((p) => p.x)) + 10;
  const minZ = Math.min(...pts.map((p) => p.z), PEAK_3E.at.z - PEAK_3E.blocked) - 10,
    maxZ = Math.max(...pts.map((p) => p.z), PEAK_3E.at.z + PEAK_3E.blocked) + 10;
  const u = { x: Math.SQRT1_2, z: Math.SQRT1_2 };
  const v = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
  const span = Math.hypot(maxX - minX, maxZ - minZ);
  const mid = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
  const w = width / 2;
  for (let c = -span / 2; c <= span / 2; c += gap)
    for (let t = -span / 2; t < span / 2; t += step) {
      const at = (s: number) => ({ x: mid.x + v.x * c + u.x * s, z: mid.z + v.z * c + u.z * s });
      const p = at(t),
        q = at(t + step);
      if (!hatched(p) || !hatched(q)) continue;
      // Au-dessus du pic dessiné (sa pyramide) comme du sol.
      const y = Math.max(heightAt3e(p), heightAt3e(q), peakSurface(p), peakSurface(q)) + lift;
      // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
      b.quad([p.x - v.x * w, y, p.z - v.z * w], [q.x - v.x * w, y, q.z - v.z * w], [q.x + v.x * w, y, q.z + v.z * w], [p.x + v.x * w, y, p.z + v.z * w], color);
    }
  return b.build();
}

/** La hauteur de la pyramide du pic au-dessus d'un point (sa base au-delà de son pied). */
function peakSurface(p: Vec2): number {
  const { at, radius, height, base, sides, yaw } = PEAK_3E;
  const dx = p.x - at.x,
    dz = p.z - at.z;
  // La distance « en pyramide » : la plus grande projection sur la normale de chaque face, rapportée à l'apothème.
  const apothem = radius * Math.cos(Math.PI / sides);
  let r = 0;
  for (let k = 0; k < sides; k++) {
    const a = yaw + (2 * Math.PI * (k + 0.5)) / sides;
    r = Math.max(r, dx * Math.cos(a) + dz * Math.sin(a));
  }
  return r >= apothem ? 0 : base + height * (1 - r / apothem);
}

/**
 * La langue de glace sur la Carte (fiche, § 5 bis : « une bande pâle bordée d'ardoise, du pic aux nuages ») : sa bande
 * de glace, une bordure d'ardoise de chaque côté, levée au-dessus du sol de près et de loin (`lift`). `step` : son pas.
 */
const LANGUE_MAP_3E = { step: 2.5, edge: 0.7, lift: 1 } as const;

function langueMapBand(): Facets {
  const b = new FacetBuilder();
  const field = buildHeightField3e();
  const line = LANGUE_3E.filter((p, i) => i === LANGUE_3E.length - 1 || distance(p, PEAK_3E.at) > PEAK_3E.blocked * 0.6);
  const pts: Vec2[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const n = Math.max(1, Math.ceil(distance(a, c) / LANGUE_MAP_3E.step));
    for (let k = 1; k <= n; k++) pts.push({ x: a.x + ((c.x - a.x) * k) / n, z: a.z + ((c.z - a.z) * k) / n });
  }
  const y = (p: Vec2) => Math.max(heightAt3e(p), heightOnMesh(field, p.x, p.z), heightOnFar(field, p.x, p.z), 0) + LANGUE_MAP_3E.lift;
  const normal = (i: number): Vec2 => {
    const a = pts[Math.max(0, i - 1)],
      c = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    return { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
  };
  const at = (i: number, v: number): P3 => {
    const n = normal(i);
    const q = { x: pts[i].x + n.x * v, z: pts[i].z + n.z * v };
    return [q.x, y(q), q.z];
  };
  const up = (a: P3, c: P3, d: P3, e: P3, color: number) => {
    const ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
    if (ny >= 0) b.quad(a, c, d, e, color);
    else b.quad(e, d, c, a, color);
  };
  const half = LANGUE_LOOK_3E.halfWidth;
  for (let i = 1; i < pts.length; i++) {
    const strip = (v0: number, v1: number, color: number) => up(at(i - 1, v0), at(i, v0), at(i, v1), at(i - 1, v1), color);
    strip(-half, half, COLORS_3E.ice);
    strip(half, half + LANGUE_MAP_3E.edge, COLORS_3E.slate);
    strip(-half - LANGUE_MAP_3E.edge, -half, COLORS_3E.slate);
  }
  return b.build();
}

/**
 * Le liseré d'ardoise des rives sur la Carte (retouche 1 du lot 1, directeur artistique : sur la Carte, le bourrelet du
 * monde, large de 0,9 unité, ne laissait qu'un halo pâle ; fiche, § 5 bis : « chaque terre a son liseré d'ardoise ») : un
 * trait plein d'ardoise, continu, autour de la montagne et de chaque Prairie, à cheval sur la rive (`out` unités sur les
 * nuages, `in` sur la terre), assez large pour se lire au téléphone ; levé au-dessus du sol de près et de loin (`lift`),
 * à plat. `step` : son pas le long de la rive.
 */
const SHORE_MAP_3E = { out: 1.2, in: 2.4, lift: 0.8, step: 3 } as const;

function shoreMapLine(): Facets {
  const b = new FacetBuilder();
  const field = buildHeightField3e();
  const y = (p: Vec2) => Math.max(heightAt3e(p), heightOnMesh(field, p.x, p.z), heightOnFar(field, p.x, p.z), 0) + SHORE_MAP_3E.lift;
  for (const loop of [MOUNTAIN_3E, PRAIRIES_3E.grande, PRAIRIES_3E.deuxieme, PRAIRIES_3E.petite]) {
    const pts = resampleLoop(loop, SHORE_MAP_3E.step);
    const n = pts.length;
    // Le côté de la terre, pour chaque point : la normale qui entre dans la rive.
    const ring = pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n],
        c = pts[(i + 1) % n];
      const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
      let m = { x: (c.z - a.z) / l, z: -(c.x - a.x) / l };
      if (!insidePolygon({ x: p.x + m.x * 0.5, z: p.z + m.z * 0.5 }, loop)) m = { x: -m.x, z: -m.z };
      const o = { x: p.x - m.x * SHORE_MAP_3E.out, z: p.z - m.z * SHORE_MAP_3E.out };
      const e = { x: p.x + m.x * SHORE_MAP_3E.in, z: p.z + m.z * SHORE_MAP_3E.in };
      const h = Math.max(y(o), y(e));
      return { o: [o.x, h, o.z] as P3, e: [e.x, h, e.z] as P3 };
    });
    for (let i = 0; i < n; i++) {
      const p = ring[i],
        q = ring[(i + 1) % n];
      // Vu d'en haut : la face regarde le ciel, quel que soit le sens de la rive.
      const ny = (q.o[2] - p.o[2]) * (q.e[0] - p.o[0]) - (q.o[0] - p.o[0]) * (q.e[2] - p.o[2]);
      if (ny >= 0) b.quad(p.o, q.o, q.e, p.e, COLORS_3E.slate);
      else b.quad(p.e, q.e, q.o, p.o, COLORS_3E.slate);
    }
  }
  return b.build();
}

/**
 * Ce que la Carte du 3e ajoute au monde : les hachures du haut du cône et des arêtes, la bande de la langue de glace, le
 * liseré d'ardoise des rives.
 */
export const mapOverlay3e = (): Facets => mergeFacets([peakMapHatch(), langueMapBand(), shoreMapLine()]);
