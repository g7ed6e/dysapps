// Le terrain du 5e (GD-22, lot 2, « toute l'île en grandes masses ») : les Hautes Brumes, une île à deux étages faits
// par la seule hauteur du sol (jamais un sol posé sur un autre). En bas, la forêt de racines (les Frondaisons, les
// Roselières) et les Contreforts, coupés de chenaux d'eau sombre, profonds, sans gué ; au nord, le plateau de pierre,
// bordé de vraies falaises (13 unités en 4), qui tombe dans la mer au nord ; le chenal de l'ouest l'entaille. Sur le
// plateau, les aiguilles de basalte, effilées et à pans (./spire5e.ts) ; dans la forêt, des palétuviers géants en masses
// (leurs racines en arceaux, une canopée basse), loin des chemins, des lieux et de l'eau. Les tuiles, leurs deux niveaux de détail et leurs anneaux sont ceux
// du 6e (./terrain.ts) : seuls la hauteur, la peinture et ce qui pousse changent. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { CHANNELS_5E, COAST_5E, COLORS_5E, CREUX_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E, PLATEAU, PLATEAU_5E, QUAY_5E, TERRAIN_5E, HUTTE_5E, inHutteClearing, inLisiereClearing, type ChannelId, type Needle } from './plan5e';
import { SHADOW_DIR_5E } from './sky';
import { spire, spireTriangles } from './spire5e';
import { drawTileWith, farHeightsOf, heightOnFar, heightOnMesh, tileRect, type GroundPaint, type HeightField, type P3, type TileDetail } from './terrain';

/** Le fond de la mer autour de l'île, et celui des chenaux : profonds, sans gué ni banc (fiche, § 5). */
const SEA_FLOOR = -1.6;
const CHANNEL_BED = -2.2;
/** La rive : de l'eau au sol de la forêt, sur tant d'unités ; sous l'eau, jusqu'au fond, sur tant d'autres. */
const BANK = { land: 4, water: 3 } as const;

const CHANNEL_LIST = Object.entries(CHANNELS_5E) as [ChannelId, (typeof CHANNELS_5E)[ChannelId]][];

/** La distance à l'eau d'un chenal (ou du plus proche) : négative dedans. */
export function channelClearance(p: Vec2, id?: ChannelId): number {
  if (id) return distanceToPolyline(p, CHANNELS_5E[id].line) - CHANNELS_5E[id].halfWidth;
  let d = Infinity;
  for (const [, c] of CHANNEL_LIST) d = Math.min(d, distanceToPolyline(p, c.line) - c.halfWidth);
  return d;
}

/** La distance signée à la terre ferme : positive sur la terre, négative dans la mer et les chenaux. */
export function landDistance5e(p: Vec2): number {
  return Math.min(signedDistance(p, COAST_5E), channelClearance(p));
}

/** Une ondulation lente du sol, de 0 à 1 (des sinus, aucun hasard : le même sol à chaque construction). */
const wave = (p: Vec2): number => 0.5 + 0.25 * Math.sin(p.x * 0.09 + 1.3) * Math.cos(p.z * 0.07 - 0.4) + 0.25 * Math.sin((p.x + p.z) * 0.045 + 2.1);

/** Le bord du plateau, un peu irrégulier : la distance signée à son polygone, bougée de deux sinus (positive dessus). */
const plateauEdge = (p: Vec2): number => signedDistance(p, PLATEAU_5E) + 1.1 * Math.sin(p.x * 0.21) + 0.7 * Math.sin(p.z * 0.33 + p.x * 0.11);

/**
 * La part du plateau en un point, de 0 (en bas) à 1 (en haut) : la falaise monte sur `PLATEAU.cliff` unités depuis son
 * pied ; la mer au nord et le chenal de l'ouest l'entaillent (leur eau la coupe, de même largeur).
 */
export function plateauShare(p: Vec2): number {
  const cut = Math.min(plateauEdge(p), signedDistance(p, COAST_5E), channelClearance(p, 'ouest'));
  return smoothstep(0, PLATEAU.cliff, cut);
}

/** Les Contreforts, à l'ouest du chenal de l'ouest : un sol un peu plus haut, ocre (de 0 à 1). */
const contreforts = (p: Vec2): number => smoothstep(-82, -104, p.x);

/** La hauteur du sol, avant la grille : la mer, les rives des chenaux, la forêt, les Contreforts, la falaise, le plateau. */
export function heightAt5e(p: Vec2): number {
  const coast = signedDistance(p, COAST_5E);
  const chan = channelClearance(p);
  const water = Math.min(coast, chan);
  const floor = 0.55 + 0.7 * wave(p) + 1.4 * contreforts(p);
  let low: number;
  if (water >= 0) low = floor * smoothstep(0, BANK.land, water);
  else low = (coast < chan ? SEA_FLOOR : CHANNEL_BED) * smoothstep(0, BANK.water, -water);
  const e = plateauShare(p);
  if (e <= 0) return low;
  const top = PLATEAU.height + 1.2 * (wave({ x: p.z * 1.3, z: p.x * 0.8 }) - 0.5);
  return low + (top - low) * e;
}

/** Le plateau est-il sous ce point (sa falaise passée) ? */
export const onPlateau = (p: Vec2): boolean => plateauShare(p) > 0.5;

let fieldCache: HeightField | null = null;

/** La carte de hauteurs du 5e (une fois), son terrain de loin abaissé sous les chemins, comme au 6e. */
export function buildHeightField5e(): HeightField {
  if (fieldCache) return fieldCache;
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN_5E;
  const nx = tilesX * tileCells + 1;
  const nz = tilesZ * tileCells + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt5e({ x: minX + i * step, z: minZ + j * step });
  const field: HeightField = { minX, minZ, step, nx, nz, heights, far: heights };
  fieldCache = { ...field, far: farHeightsOf(field, PATH_NODES_5E, PATH_EDGES_5E, (x, z) => groundOn5e(field, x, z)) };
  return fieldCache;
}

/** Le point est-il dans la grille du 5e ? */
const inGrid = (f: HeightField, x: number, z: number): boolean => x >= f.minX && z >= f.minZ && x <= f.minX + (f.nx - 1) * f.step && z <= f.minZ + (f.nz - 1) * f.step;

/** Le sol dessiné de près du 5e en (x, z) : sur la grille, comme la tuile ; au-delà, la hauteur du plan. */
export const groundOn5e = (f: HeightField, x: number, z: number): number => (inGrid(f, x, z) ? heightOnMesh(f, x, z) : heightAt5e({ x, z }));

/** Le sol dessiné de loin du 5e en (x, z). */
export const groundFar5e = (f: HeightField, x: number, z: number): number => (inGrid(f, x, z) ? heightOnFar(f, x, z) : heightAt5e({ x, z }));

// ---------- La peinture du sol ----------

/** Une facette moins droite que ça est de la roche (une falaise, la berge raide d'un chenal). */
const ROCK_UP = 0.6;
/** Une facette moins droite que ça prend son flanc (au soleil, ou à l'ombre). */
const SLOPE_UP = 0.97;
/** Au-dessus de cette hauteur, le dessus du plateau. */
const TOP_FROM = PLATEAU.height * 0.7;

/** Le sens d'où vient le soleil, à plat : un flanc qui le regarde est au soleil. */
const SUN_FLAT = { x: -SHADOW_DIR_5E.x, z: -SHADOW_DIR_5E.z } as const;

/** Une tache du sol, par cases de cinq unités : des aplats d'un seul tenant, jamais une moucheture. */
const patch = (x: number, z: number): number => hash2(Math.floor(x / 5) + 4000, Math.floor(z / 5) + 4000);

/**
 * La couleur d'un sol à plat en (x, z), à la hauteur `h`. Le dessus du plateau est de pierre (retouche du lot 2,
 * directeur artistique : il se lisait comme une prairie) : des dalles grises, claires ou plus sombres, quelques taches de
 * mousse grise ; en bas, la mousse sombre de la forêt, l'ocre des Contreforts.
 */
function flat5e(x: number, z: number, h: number): number {
  if (h > TOP_FROM) {
    const k = patch(x, z);
    return k < 0.45 ? COLORS_5E.stone : k < 0.78 ? COLORS_5E.stoneSun : COLORS_5E.plateauMoss;
  }
  if (h < 0.3) return COLORS_5E.mud;
  const p = { x, z };
  if (contreforts(p) > 0.5) return patch(x, z) < 0.6 ? COLORS_5E.ochre : COLORS_5E.mossSun;
  return COLORS_5E.moss;
}

/**
 * La couleur d'une facette : la pierre si elle est raide (au soleil bas, sa pierre claire ; à l'ombre, sa pierre sombre :
 * jamais presque noire) ; sur une pente douce, la mousse au soleil ou à l'ombre ; sinon, le sol à plat.
 */
function facet5e(a: P3, b: P3, c: P3): number {
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
  if (up < ROCK_UP) return h < 0.6 ? COLORS_5E.mud : sunny ? COLORS_5E.stone : COLORS_5E.stoneShade;
  const base = flat5e(x, z, h);
  if (up >= SLOPE_UP || base !== COLORS_5E.moss) return base;
  return sunny ? COLORS_5E.mossSun : COLORS_5E.mossShade;
}

/** Le 5e n'a pas d'écume : son eau est calme et sombre (fiche, § 2). */
const noFoam = (): number => 0;

const PAINT_5E: GroundPaint = { facet: facet5e, flat: flat5e, foam: noFoam };

// ---------- Ce qui pousse, et les aiguilles ----------

/**
 * Les couleurs de la forêt : le feuillage des palétuviers et son dessus au soleil (deux verts gris tirés vers le bleu,
 * discrets : retouche du lot 2, « le vert est trop jaune »), leurs racines et leur tronc (un bois gris-brun, jamais
 * sombre) ; aux Contreforts, des buissons d'olive sèche, vers l'ocre.
 */
export const FOREST_COLORS = {
  canopy: 0x56695a,
  canopyTop: 0x6b7d62,
  root: 0x7c7060,
  trunk: 0x6f6452,
  shrub: 0x8a8a5e,
  shrubTop: 0x9e9b6c,
} as const;

/**
 * Où pousse la forêt : une place tous les `cell` unités au plus, gardée une fois sur `keep` ; jamais à moins de `path`
 * unités d'un chemin, de `place` du centre d'un lieu (la Montée : `montee`, et `monteeSouth` au sud, sa clairière d'approche ;
 * le Hameau : `hameau`, et `hameauSouth` au sud ; la Croisée : le couloir `croiseeSouth` sur `croiseeSide` de part et
 * d'autre ; les Instants : `instants` de part et d'autre de leur chaussée, et `instantsSouth` au sud), de `quay` du ponton
 * de la Lisière, ni dans sa clairière, ni sur le
 * plateau ou sa falaise ; un tronc se tient à `dry` unités au moins de l'eau (retouche du lot 2, directeur artistique :
 * la canopée couvrait les chenaux, leur eau ne se voyait pas en 3D).
 */
const FOREST_KEEP = { cell: 6.5, keep: 0.68, path: 3.4, place: 11, montee: 15, monteeSouth: 30, hameau: 14.5, hameauSouth: 34, radeaux: 13, croiseeSouth: 30, croiseeSide: 6, instants: 12.5, instantsSouth: 30, quay: 5, cliff: 2.5, dry: 2.2, creux: 7.5, sente: 3.6 } as const;

/** L'axe de la chaussée des Instants, depuis le centre du lieu (lot 8 ; un test le relit contre ./instants5e.ts). */
export const INSTANTS_AXIS: readonly (readonly [number, number])[] = [
  [3.8, 8.2],
  [-18.4, -21.4],
];

/** Les tronçons des chemins du 5e (pour garder la forêt à distance). */
const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
  return PATH_EDGES_5E.map(([a, b]) => [at.get(a)!, at.get(b)!] as const);
})();

const nearPath = (p: Vec2, reach: number): boolean => SEGMENTS.some(([a, b]) => distanceToPolyline(p, [a, b]) < reach);

const nearPlace = (p: Vec2): boolean =>
  PLACES_5E.some((pl) => {
    const d = Math.hypot(p.x - pl.center.x, p.z - pl.center.z);
    // Au sud de la Montée, la clairière de l'approche (GD-22, lot 3) : la caméra qui arrive dans l'axe du ponton ne passe
    // jamais dans la canopée.
    if (pl.id === 'montee') return d < FOREST_KEEP.montee || (p.z > pl.center.z - 4 && d < FOREST_KEEP.monteeSouth);
    // Le Hameau (lot 5) : ses maisons et ses barques jusqu'à 13 unités du four ; au sud, l'approche de la caméra et le recul
    // de celle de la scénette sur un écran en portrait, à 23 unités (retouche 1 : une canopée y passait devant les miches).
    if (pl.id === 'hameau') return d < FOREST_KEEP.hameau || (p.z > pl.center.z + 4 && d < FOREST_KEEP.hameauSouth);
    // Les Radeaux (lot 6) : le quai et la cabane jusqu'à 12 unités du centre, et le recul de la caméra de la scénette, qui
    // regarde la façade depuis l'est-sud-est.
    if (pl.id === 'radeaux') return d < FOREST_KEEP.radeaux;
    // La Croisée (lot 7) : au sud, un couloir dans l'axe du lieu, où passent la caméra de son arrivée et celle de sa
    // scénette ; ses palétuviers des côtés restent.
    if (pl.id === 'croisee') return d < FOREST_KEEP.place || (p.z > pl.center.z + 4 && p.z < pl.center.z + FOREST_KEEP.croiseeSouth && Math.abs(p.x - pl.center.x) < FOREST_KEEP.croiseeSide);
    // Les Instants (lot 8) : le marais ouvert le long de la chaussée, du débarcadère jusqu'au bord du grand chenal
    // (`INSTANTS_AXIS`, depuis le centre ; ./instants5e.ts, `onCauseway(-6, 0)` et `onCauseway(31, 0)`) ; au sud, le recul
    // de la caméra de la scénette. Au-delà, la ligne des palétuviers fait le fond.
    if (pl.id === 'instants') {
      const [a, b] = INSTANTS_AXIS.map(([x, z]) => ({ x: pl.center.x + x, z: pl.center.z + z }));
      return d < FOREST_KEEP.place || distanceToPolyline(p, [a, b]) < FOREST_KEEP.instants || (p.z > pl.center.z + 3 && d < FOREST_KEEP.instantsSouth);
    }
    return d < FOREST_KEEP.place;
  });

/**
 * Un palétuvier (ou un buisson des Contreforts) : sa place, son sol, sa taille, son quart de tour ; `hollow` : celui du
 * Creux, dont le pied creusé est dessiné avec le Détour (./creux5e.ts) : sa couronne seule, à la hauteur `hollow`.
 */
interface Tree {
  x: number;
  z: number;
  y: number;
  size: number;
  yaw: number;
  shrub: boolean;
  hollow?: number;
}

/**
 * Le palétuvier du Creux (GD-22, lot 6) : un arbre de la forêt, élargi. Sa couronne est celle de la forêt (comptée avec
 * elle, dans le sol), plus large que celle des voisins, et monte jusqu'au-dessus du haut de son fût (`CREUX_CROWN.base`,
 * au-dessus du sol) ; aucun autre arbre à moins de `FOREST_KEEP.creux` de son pied, ni sur sa sente.
 */
export const CREUX_CROWN = { size: 1.4, base: 6.7, yaw: 0.9 } as const;

/** Le palétuvier du Creux, dans sa tuile. */
const CREUX_TREE: Tree = { x: CREUX_5E.center.x, z: CREUX_5E.center.z, y: heightAt5e(CREUX_5E.center), size: CREUX_CROWN.size, yaw: CREUX_CROWN.yaw, shrub: false, hollow: CREUX_CROWN.base };

/** Près du Creux : son pied, et sa sente (la végétation la laisse libre). */
const nearCreux = (p: Vec2): boolean => Math.hypot(p.x - CREUX_5E.center.x, p.z - CREUX_5E.center.z) < FOREST_KEEP.creux || distanceToPolyline(p, CREUX_5E.sente) < FOREST_KEEP.sente;

const treesOf = new Map<number, readonly Tree[]>();

/** Les arbres d'une tuile (calculés une fois). */
function treesIn(tx: number, tz: number): readonly Tree[] {
  const key = tz * TERRAIN_5E.tilesX + tx;
  const known = treesOf.get(key);
  if (known) return known;
  const r = tileRect(tx, tz, TERRAIN_5E);
  const out: Tree[] = [];
  const c = FOREST_KEEP.cell;
  for (let j = Math.floor(r.minZ / c); j * c < r.maxZ; j++)
    for (let i = Math.floor(r.minX / c); i * c < r.maxX; i++) {
      if (hash2(i, j) > FOREST_KEEP.keep) continue;
      const p = { x: (i + 0.15 + 0.7 * hash2(i + 101, j)) * c, z: (j + 0.15 + 0.7 * hash2(i, j + 211)) * c };
      if (p.x < r.minX || p.x >= r.maxX || p.z < r.minZ || p.z >= r.maxZ) continue;
      if (plateauEdge(p) > -FOREST_KEEP.cliff) continue;
      if (landDistance5e(p) < FOREST_KEEP.dry || signedDistance(p, COAST_5E) < 1) continue;
      if (nearPath(p, FOREST_KEEP.path) || nearPlace(p) || distanceToPolyline(p, [QUAY_5E.from, QUAY_5E.to]) < FOREST_KEEP.quay) continue;
      // La clairière de la Lisière (GD-22, lot 4) : sa place, sa rangée et leurs abords, sans un tronc.
      if (inLisiereClearing(p)) continue;
      if (nearCreux(p)) continue;
      // La Hutte (lot 8) : sa cabane, sa barque, la place de Kéo et sa sente.
      if (inHutteClearing(p)) continue;
      const shrub = contreforts(p) > 0.5;
      out.push({ x: p.x, z: p.z, y: heightAt5e(p), size: (shrub ? 0.62 : 0.85) + 0.4 * hash2(i + 7, j + 13), yaw: 6.283 * hash2(i + 31, j + 17), shrub });
    }
  if (CREUX_TREE.x >= r.minX && CREUX_TREE.x < r.maxX && CREUX_TREE.z >= r.minZ && CREUX_TREE.z < r.maxZ) out.push(CREUX_TREE);
  treesOf.set(key, out);
  return out;
}

/** Un tronçon de tronc à quatre côtés, sans dessus ni dessous. */
function trunk(b: FacetBuilder, from: readonly [number, number, number], to: readonly [number, number, number], r0: number, r1: number, color: number): void {
  const ring = (p: readonly [number, number, number], r: number) => [0, 1, 2, 3].map((k) => [p[0] + r * Math.cos((Math.PI * k) / 2 + Math.PI / 4), p[1], p[2] + r * Math.sin((Math.PI * k) / 2 + Math.PI / 4)] as const);
  const lo = ring(from, r0);
  const hi = ring(to, r1);
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.quad(lo[n], lo[k], hi[k], hi[n], color);
  }
}

/** Les triangles d'un arbre de près et de loin (comptés sans construire). */
const TREE_TRIANGLES = { near: 8 + 4 * 2 * 12 + 2 * 18, far: 3 + 15, hollowNear: 2 * 18, shrubNear: 18 + 6, shrubFar: 15 } as const;

/**
 * Un palétuvier de près : le tronc, quatre racines en arceaux (deux poutres chacune, du tronc au genou, du genou au
 * sol), la canopée basse en deux plateaux à pans ; de loin, la canopée sur une pointe à trois pans, évasée au sol comme
 * les racines, qui monte s'y perdre (trois triangles : sans elle, la canopée flottait au-dessus de la forêt). Un buisson
 * des Contreforts : un dôme bas.
 */
function drawTree(b: FacetBuilder, t: Tree, detail: TileDetail): number {
  const s = t.size;
  if (t.shrub) {
    if (detail === 'far') {
      b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.8 * s, 0.6 * s, 1.6 * s, 5, FOREST_COLORS.shrub, FOREST_COLORS.shrubTop);
      return TREE_TRIANGLES.shrubFar;
    }
    b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.8 * s, 1.2 * s, 1.2 * s, 6, FOREST_COLORS.shrub, FOREST_COLORS.shrubTop);
    b.prism({ x: t.x, y: t.y + 0.9 * s, z: t.z, yaw: t.yaw + 0.5 }, 1.2 * s, 0, 0.7 * s, 6, FOREST_COLORS.shrubTop);
    return TREE_TRIANGLES.shrubNear;
  }
  const H = t.hollow ?? (3.8 + 1.6 * ((t.yaw * 7) % 1)) * s;
  const R = 3.1 * s;
  if (detail === 'far') {
    b.prism({ x: t.x, y: t.y - 0.6, z: t.z, yaw: t.yaw }, 0.8 * s, 0, H + 0.4, 3, FOREST_COLORS.root);
    b.prism({ x: t.x, y: t.y + H - 0.6, z: t.z, yaw: t.yaw }, R, R * 0.7, 1.5 * s, 5, FOREST_COLORS.canopy, FOREST_COLORS.canopyTop);
    return TREE_TRIANGLES.far;
  }
  const y = t.y;
  if (t.hollow !== undefined) {
    // Le Creux : la couronne seule, son fût creusé est au Détour.
    crown(b, t, y, H, R, s);
    return TREE_TRIANGLES.hollowNear;
  }
  trunk(b, [t.x, y + 1.2 * s, t.z], [t.x, y + H, t.z], 0.36 * s, 0.26 * s, FOREST_COLORS.trunk);
  for (let k = 0; k < 4; k++) {
    const a = t.yaw + (k * Math.PI) / 2;
    const ca = Math.cos(a),
      sa = Math.sin(a);
    const start = { x: t.x, y: y + 1.7 * s, z: t.z };
    const knee = { x: t.x + ca * 1.2 * s, y: y + 1.3 * s + 0.3, z: t.z + sa * 1.2 * s };
    const foot = { x: t.x + ca * 2.4 * s, y: y - 0.6, z: t.z + sa * 2.4 * s };
    b.beam(start, knee, 0.24 * s, FOREST_COLORS.root);
    b.beam(knee, foot, 0.22 * s, FOREST_COLORS.root);
  }
  crown(b, t, y, H, R, s);
  return TREE_TRIANGLES.near;
}

/** La canopée basse d'un palétuvier de près : deux plateaux à pans. */
function crown(b: FacetBuilder, t: Tree, y: number, H: number, R: number, s: number): void {
  b.prism({ x: t.x, y: y + H - 0.4, z: t.z, yaw: t.yaw }, R, R * 0.8, 1.1 * s, 6, FOREST_COLORS.canopy, FOREST_COLORS.canopyTop);
  b.prism({ x: t.x + 0.9 * s * Math.cos(t.yaw), y: y + H + 0.6 * s, z: t.z + 0.9 * s * Math.sin(t.yaw), yaw: t.yaw + 0.5 }, R * 0.7, R * 0.5, 0.9 * s, 6, FOREST_COLORS.canopy, FOREST_COLORS.canopyTop);
}

/** Les aiguilles dont le pied est dans une tuile. */
const needlesIn = (tx: number, tz: number): Needle[] => {
  const r = tileRect(tx, tz, TERRAIN_5E);
  return NEEDLES_5E.filter((n) => n.at.x >= r.minX && n.at.x < r.maxX && n.at.z >= r.minZ && n.at.z < r.maxZ);
};

/** Le pied d'une aiguille s'enfonce d'autant : jamais elle ne flotte sur une pente. */
const NEEDLE_SINK = 1;

/** Une aiguille du plateau (./spire5e.ts, la famille de la Montée). La même de près et de loin : elle se voit de toute l'île. */
function drawNeedle(b: FacetBuilder, n: Needle): number {
  return spire(b, { x: n.at.x, y: heightAt5e(n.at) - NEEDLE_SINK, z: n.at.z, radius: n.radius, height: n.height + NEEDLE_SINK, sides: n.sides, turn: n.turn });
}

/** Les triangles d'une aiguille. */
const needleTriangles = (n: Needle): number => spireTriangles(n.sides);

/** Ce qui pousse dans une tuile, et ses aiguilles, ou leur seul nombre (sans `b`). */
function drawFlora5e(tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
  let count = 0;
  for (const t of treesIn(tx, tz))
    count += b ? drawTree(b, t, detail) : t.shrub ? (detail === 'near' ? TREE_TRIANGLES.shrubNear : TREE_TRIANGLES.shrubFar) : detail === 'near' ? (t.hollow !== undefined ? TREE_TRIANGLES.hollowNear : TREE_TRIANGLES.near) : TREE_TRIANGLES.far;
  for (const n of needlesIn(tx, tz)) count += b ? drawNeedle(b, n) : needleTriangles(n);
  return count;
}

// ---------- Les tuiles ----------

/** Le sol d'une tuile du 5e (le premier temps de la réserve des tuiles). */
export function tileGround5e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_5E);
  return b.build();
}

/** Ce qui pousse dans une tuile du 5e et ses aiguilles (le second temps). */
export function tileFlora5e(_field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawFlora5e(tx, tz, detail, b);
  return b.build();
}

/** Une tuile du 5e entière : son sol, puis ce qui y pousse. */
export function tileFacets5e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_5E);
  drawFlora5e(tx, tz, detail, b);
  return b.build();
}

/** Le nombre de triangles de chaque tuile entière du 5e à un niveau de détail, par rang (sans rien construire). */
export function tileCounts5e(field: HeightField, detail: TileDetail): Int32Array {
  const { tilesX, tilesZ } = TERRAIN_5E;
  const out = new Int32Array(tilesX * tilesZ);
  for (let tz = 0; tz < tilesZ; tz++) for (let tx = 0; tx < tilesX; tx++) out[tz * tilesX + tx] = drawTileWith(field, tx, tz, detail, null, PAINT_5E) + drawFlora5e(tx, tz, detail, null);
  return out;
}

/**
 * Ce qui bloque la marche libre dans une tuile du 5e (./freeWalk.ts) : le pied de chaque palétuvier, ses racines
 * comprises (un buisson, son dôme), chaque aiguille et la cabane de la Hutte ; un disque chacun (son centre, son rayon).
 */
export function obstaclesIn5e(tx: number, tz: number): { x: number; z: number; r: number }[] {
  // Le fût du Creux : son rayon, moins de quoi laisser Kéo sur le seuil, sous l'arche.
  const out = treesIn(tx, tz).map((t) => ({ x: t.x, z: t.z, r: t.hollow !== undefined ? CREUX_5E.radius - 0.65 : (t.shrub ? 1.6 : 2) * t.size }));
  for (const n of needlesIn(tx, tz)) out.push({ x: n.at.x, z: n.at.z, r: n.radius });
  // La cabane de la Hutte (lot 8), dans sa tuile.
  const r = tileRect(tx, tz, TERRAIN_5E);
  const h = HUTTE_5E.cabin;
  if (h.x >= r.minX && h.x < r.maxX && h.z >= r.minZ && h.z < r.maxZ) out.push({ x: h.x, z: h.z, r: h.r });
  return out;
}
