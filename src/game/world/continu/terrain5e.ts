// Le terrain du 5e (GD-22, lot 2, « toute l'île en grandes masses ») : les Hautes Brumes, une île à deux étages faits
// par la seule hauteur du sol (jamais un sol posé sur un autre). En bas, la forêt de racines (les Frondaisons, les
// Roselières) et les Contreforts, coupés de chenaux d'eau sombre, profonds, sans gué ; au nord, le plateau de pierre,
// bordé de vraies falaises (13 unités en 4), qui tombe dans la mer au nord ; le chenal de l'ouest l'entaille. Sur le
// plateau, les aiguilles de basalte, effilées et à pans (./spire5e.ts) ; dans la forêt, des palétuviers géants en masses
// (leurs racines en arceaux, une canopée basse), loin des chemins, des lieux et de l'eau. Les tuiles, leurs deux niveaux de détail et leurs anneaux sont ceux
// du 6e (./terrain.ts) : seuls la hauteur, la peinture et ce qui pousse changent. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { CHANNELS_5E, COAST_5E, COLORS_5E, CREUX_5E, FAILLE_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E, PLATEAU, PLATEAU_5E, QUAY_5E, TERRAIN_5E, HUTTE_5E, inHutteClearing, inLisiereClearing, type ChannelId, type Needle } from './plan5e';
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
  return smoothstep(0, PLATEAU.cliff, plateauCut(p));
}

/** La distance au pied de la falaise du plateau, la mer et le chenal de l'ouest compris (positive vers le haut). */
const plateauCut = (p: Vec2): number => Math.min(plateauEdge(p), signedDistance(p, COAST_5E), channelClearance(p, 'ouest'));

/**
 * La distance au rebord du plateau, en haut de sa falaise (positive sur le dessus) : les chaussées posent un rang de
 * pierres du côté du vide quand elles en passent près (./paths5e.ts, `causewayFacets`).
 */
export const plateauRim5e = (p: Vec2): number => plateauCut(p) - PLATEAU.cliff;

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

/** Une facette touche la berge quand elle descend sous `top` et monte au-dessus de `under` (le niveau de l'eau : 0). */
const BANK_EDGE = { top: 0.25, under: -0.6 } as const;

/** Une facette moins droite que ça est de la roche (une falaise, la berge raide d'un chenal). */
const ROCK_UP = 0.6;
/** Une facette moins droite que ça prend son flanc (au soleil, ou à l'ombre). */
const SLOPE_UP = 0.97;
/** Au-dessus de cette hauteur, le dessus du plateau. */
const TOP_FROM = PLATEAU.height * 0.7;

/** Le sens d'où vient le soleil, à plat : un flanc qui le regarde est au soleil. */
const SUN_FLAT = { x: -SHADOW_DIR_5E.x, z: -SHADOW_DIR_5E.z } as const;

/** La bande d'herbe rase de part et d'autre de la sente de la Faille. */
export const SENTE_GRASS = 2.2;

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
  if (contreforts(p) > 0.5) {
    // Le long de la sente de la Faille, l'herbe rase : sa sente claire s'y lit (3:1), ce qu'elle ne fait pas sur l'ocre.
    if (distanceToPolyline(p, FAILLE_5E.sente) < SENTE_GRASS) return COLORS_5E.mossSun;
    return patch(x, z) < 0.6 ? COLORS_5E.ochre : COLORS_5E.mossSun;
  }
  return forestFloor(p);
}

/**
 * Le sol de la forêt noyée (piste B, choisie par le mainteneur le 21 octobre 2026 ; retouche du directeur artistique :
 * « l'eau est le sol, la terre l'exception ») : sous un bosquet, une seule nappe d'eau basse, les nappes de ses arbres
 * voisins se rejoignent ; autour, une bague de vase ; dans les clairières, la mousse, et çà et là une flaque d'un seul
 * tenant (`patch`). Aucun triangle de plus : seule la couleur des facettes du sol change. L'eau basse reste plus claire
 * que l'eau profonde des chenaux, qu'on ne traverse jamais.
 */
function forestFloor(p: Vec2): number {
  let reach = Infinity;
  for (const t of treesAround(p)) {
    const dx = p.x - t.x, dz = p.z - t.z;
    reach = Math.min(reach, (dx * dx + dz * dz) / (t.size * t.size));
  }
  if (reach < FLOOR_REACH.pool ** 2) return COLORS_5E.pool;
  if (reach < FLOOR_REACH.mud ** 2) return COLORS_5E.mud;
  return groveKeep(p) < FLOOR_REACH.clearing && patch(p.x, p.z) < FLOOR_REACH.puddle ? COLORS_5E.pool : COLORS_5E.moss;
}

/**
 * L'eau basse jusqu'à tant de fois la taille d'un arbre depuis son pied (assez pour rejoindre celle des voisins d'un
 * bosquet), la vase jusqu'à tant ; les flaques, dans les seules clairières.
 */
const FLOOR_REACH = { pool: 4.4, mud: 5.3, puddle: 0.14, clearing: 0.5 } as const;

const aroundOf = new Map<number, readonly Tree[]>();

/** Les palétuviers de la tuile d'un point et de ses huit voisines (une nappe déborde d'une tuile), une fois par tuile. */
function treesAround(p: Vec2): readonly Tree[] {
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN_5E;
  const size = step * tileCells;
  const tx = Math.floor((p.x - minX) / size);
  const tz = Math.floor((p.z - minZ) / size);
  const key = tz * tilesX + tx;
  const known = aroundOf.get(key);
  if (known) return known;
  const out: Tree[] = [];
  for (let j = tz - 1; j <= tz + 1; j++)
    for (let i = tx - 1; i <= tx + 1; i++) if (i >= 0 && j >= 0 && i < tilesX && j < tilesZ) for (const t of treesIn(i, j)) if (!t.shrub) out.push(t);
  aroundOf.set(key, out);
  return out;
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
  // La berge (retouche du directeur artistique, sur la demande du référent dys) : toute facette qui touche le bord de
  // l'eau profonde, chenal ou mer, prend la vase claire. Une bordure continue, plus claire que l'eau basse de la forêt :
  // ce qu'on ne traverse jamais se lit par sa bordure, pas par sa seule teinte.
  if (Math.min(a[1], b[1], c[1]) <= BANK_EDGE.top && Math.max(a[1], b[1], c[1]) >= BANK_EDGE.under) return COLORS_5E.bank;
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
  canopy: 0x667c60,
  canopyTop: 0x788856,
  /** Le dessous des grappes de la couronne, qu'on voit à hauteur d'enfant : un cran plus sombre, jamais presque noir. */
  canopyUnder: 0x70826c,
  /** Les roseaux et les jeunes pousses au pied des palétuviers, dans l'eau basse. */
  reed: 0x7f8c5e,
  root: 0x6e5e4c,
  trunk: 0x6f6452,
  shrub: 0x8a8a5e,
  shrubTop: 0x9e9b6c,
} as const;

/**
 * Où pousse la forêt : une place tous les `cell` unités au plus, gardée une fois sur `keep` ; jamais à moins de `path`
 * unités d'un chemin, de `place` du centre d'un lieu (la Montée : `montee`, et `monteeSouth` au sud, sa clairière d'approche ;
 * le Hameau : `hameau`, et `hameauSouth` au sud ; la Croisée : le couloir `croiseeSouth` sur `croiseeSide` de part et
 * d'autre ; les Instants : `instants` de part et d'autre de leur chaussée, et `instantsSouth` au sud ; les Terrasses :
 * `terrasses`, et `terrassesSouth` au sud ; l'Auberge : `auberge`), de `quay` du ponton de la Lisière, ni dans sa
 * clairière, ni sur le plateau ou sa falaise ; un tronc se tient à `dry` unités au moins de l'eau (retouche du lot 2,
 * directeur artistique : la canopée couvrait les chenaux, leur eau ne se voyait pas en 3D).
 */
const FOREST_KEEP = { cell: 6.5, keep: 0.68, path: 3.4, place: 11, montee: 15, monteeSouth: 30, hameau: 14.5, hameauSouth: 34, radeaux: 13, croiseeSouth: 30, croiseeSide: 6, instants: 12.5, instantsSouth: 30, terrasses: 19, terrassesSouth: 32, auberge: 13, quay: 5, cliff: 2.5, dry: 2.2, creux: 7.5, faille: 7.5, sente: 3.6 } as const;

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
    // Les Terrasses (lot 11) : le tertre, le moulin, la cour et le buisson du canal haut jusqu'à 18 unités du centre ; au
    // sud, l'approche de la caméra de la porte et le recul de celle de la scénette.
    if (pl.id === 'terrasses') return d < FOREST_KEEP.terrasses || (p.z > pl.center.z + 4 && d < FOREST_KEEP.terrassesSouth);
    // L'Auberge (lot 12) : la maison, la table et les malles jusqu'à 13 unités du centre ; aucune couronne sur le toit.
    if (pl.id === 'auberge') return d < FOREST_KEEP.auberge;
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

/**
 * Près de la Faille (GD-22, lot 11) : sa fente, son arbre de roche et sa sente (aucun buisson ; on la devine du chemin
 * entre les buissons plus loin).
 */
const nearFaille = (p: Vec2): boolean => Math.hypot(p.x - FAILLE_5E.center.x, p.z - FAILLE_5E.center.z) < FOREST_KEEP.faille || distanceToPolyline(p, FAILLE_5E.sente) < FOREST_KEEP.sente;

/**
 * Des bosquets et des clairières (piste C, choisie par le mainteneur le 21 octobre 2026) : une nappe lente, de 0 à 1, par
 * cases de `GROVE.cell` unités, lissée entre leurs coins (aucun hasard d'une construction à l'autre) ; dans un bosquet, un
 * arbre presque à chaque place, dans une clairière, un sur six : l'eau basse et la mousse s'y voient.
 */
const GROVE = { cell: 26, from: 0.36, to: 0.6, clearing: 0.16, grove: 0.96 } as const;

function groveKeep(p: Vec2): number {
  const u = p.x / GROVE.cell, v = p.z / GROVE.cell;
  const i = Math.floor(u), j = Math.floor(v);
  const fu = smoothstep(0, 1, u - i), fv = smoothstep(0, 1, v - j);
  const at = (a: number, b: number) => hash2(a + 5003, b + 7001);
  const n = (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
  return GROVE.clearing + (GROVE.grove - GROVE.clearing) * smoothstep(GROVE.from, GROVE.to, n);
}

/**
 * Trois gabarits de palétuvier : un jeune sur quatre, de rares géants (jamais à moins de `giantPath` unités d'un chemin :
 * leur couronne passerait devant la caméra), les autres adultes. Les jeunes ne se dessinent pas de loin (`farFrom`) ; le
 * fût des adultes et des géants s'allonge (`tallTrunk`, retouche du directeur artistique : des colonnes, comme la planche).
 */
const GABARITS = { young: 0.25, giant: 0.93, giantPath: 11, giantSize: 1.5, farFrom: 0.8, tall: 0.85, tallTrunk: 1.3 } as const;

const treeSize = (g: number, k: number, giantRoom: boolean): number => (g < GABARITS.young ? 0.6 + 0.15 * k : g > GABARITS.giant && giantRoom ? GABARITS.giantSize + 0.1 * k : 0.88 + 0.32 * k);

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
      const p = { x: (i + 0.15 + 0.7 * hash2(i + 101, j)) * c, z: (j + 0.15 + 0.7 * hash2(i, j + 211)) * c };
      if (hash2(i, j) > groveKeep(p)) continue;
      if (p.x < r.minX || p.x >= r.maxX || p.z < r.minZ || p.z >= r.maxZ) continue;
      if (plateauEdge(p) > -FOREST_KEEP.cliff) continue;
      if (landDistance5e(p) < FOREST_KEEP.dry || signedDistance(p, COAST_5E) < 1) continue;
      if (nearPath(p, FOREST_KEEP.path) || nearPlace(p) || distanceToPolyline(p, [QUAY_5E.from, QUAY_5E.to]) < FOREST_KEEP.quay) continue;
      // La clairière de la Lisière (GD-22, lot 4) : sa place, sa rangée et leurs abords, sans un tronc.
      if (inLisiereClearing(p)) continue;
      if (nearCreux(p) || nearFaille(p)) continue;
      // La Hutte (lot 8) : sa cabane, sa barque, la place de Kéo et sa sente.
      if (inHutteClearing(p)) continue;
      const shrub = contreforts(p) > 0.5;
      const g = hash2(i + 7, j + 13);
      const size = shrub ? 0.62 + 0.4 * g : treeSize(g, hash2(i + 59, j + 3), !nearPath(p, GABARITS.giantPath));
      out.push({ x: p.x, z: p.z, y: heightAt5e(p), size, yaw: 6.283 * hash2(i + 31, j + 17), shrub });
    }
  if (CREUX_TREE.x >= r.minX && CREUX_TREE.x < r.maxX && CREUX_TREE.z >= r.minZ && CREUX_TREE.z < r.maxZ) out.push(CREUX_TREE);
  treesOf.set(key, out);
  return out;
}

/** Un tronçon à `sides` côtés, de rayon `r0` en `from` à `r1` en `to`, sans dessus ni dessous (un fût, une racine). */
function tube(b: FacetBuilder, from: P3, to: P3, r0: number, r1: number, sides: number, color: number, turn = 0): void {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz) || 1e-6;
  const d = [dx / len, dy / len, dz / len];
  const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u0 = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
  const ul = Math.hypot(u0[0], u0[1], u0[2]);
  const u = u0.map((v) => v / ul);
  const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const ring = (p: P3, r: number) =>
    Array.from({ length: sides }, (_, k) => {
      const a = turn + (2 * Math.PI * k) / sides;
      const c = r * Math.cos(a), s = r * Math.sin(a);
      return [p[0] + c * u[0] + s * v[0], p[1] + c * u[1] + s * v[1], p[2] + c * u[2] + s * v[2]] as const;
    });
  const lo = ring(from, r0);
  const hi = ring(to, r1);
  for (let k = 0; k < sides; k++) {
    const n = (k + 1) % sides;
    b.quad(lo[k], lo[n], hi[n], hi[k], color);
  }
}

/**
 * Une grappe de la couronne, à facettes (piste A, choisie par le mainteneur le 21 octobre 2026) : un anneau bas, un
 * anneau large, une pointe au-dessus, décalée ; `under` : sa pointe de dessous, qu'on voit à hauteur d'enfant. Trois
 * aplats : le dessous, les flancs, le dessus au soleil.
 */
function clump(b: FacetBuilder, x: number, y: number, z: number, R: number, H: number, yaw: number, under: boolean): void {
  const sides = CROWN_SIDES;
  const ring = (r: number, h: number, turn: number) => Array.from({ length: sides }, (_, k) => [x + r * Math.cos(yaw + turn + (2 * Math.PI * k) / sides), y + h, z + r * Math.sin(yaw + turn + (2 * Math.PI * k) / sides)] as const);
  const low = ring(0.72 * R, 0, 0);
  const wide = ring(R, 0.42 * H, Math.PI / sides);
  const apex: P3 = [x + 0.12 * R * Math.cos(yaw), y + H, z + 0.12 * R * Math.sin(yaw)];
  for (let k = 0; k < sides; k++) {
    const n = (k + 1) % sides;
    b.triangle(low[k], wide[k], low[n], FOREST_COLORS.canopy);
    b.triangle(low[n], wide[k], wide[n], FOREST_COLORS.canopy);
    b.triangle(wide[k], apex, wide[n], FOREST_COLORS.canopyTop);
  }
  if (!under) return;
  const bottom: P3 = [x, y - 0.2 * H, z];
  for (let k = 0; k < sides; k++) b.triangle(low[k], low[(k + 1) % sides], bottom, FOREST_COLORS.canopyUnder);
}

/** Les côtés d'une grappe, d'un fût et d'une racine. */
const CROWN_SIDES = 5;
const TRUNK_SIDES = 6;
const ROOT_SIDES = 3;
/** Les racines-échasses d'un palétuvier de près, chacune en trois tronçons qui s'arquent avant de plonger. */
const ROOTS = 5;
/** Les roseaux au pied d'un palétuvier de près, dans l'eau basse : deux pointes à trois pans. */
const REEDS = 2;

/** Les triangles d'un arbre de près et de loin (comptés sans construire). */
const TREE_TRIANGLES = {
  near: 2 * 2 * TRUNK_SIDES + ROOTS * 3 * 2 * ROOT_SIDES + 3 * 4 * CROWN_SIDES + REEDS * 3,
  far: 3 + 3 * CROWN_SIDES,
  hollowNear: 3 * 4 * CROWN_SIDES,
  shrubNear: 18 + 6,
  shrubFar: 15,
} as const;

/** Les triangles d'un arbre (ou d'un buisson) à un niveau de détail ; de loin, un jeune palétuvier ne se dessine pas. */
function treeTriangles(t: Tree, detail: TileDetail): number {
  if (t.shrub) return detail === 'near' ? TREE_TRIANGLES.shrubNear : TREE_TRIANGLES.shrubFar;
  if (detail === 'far') return t.hollow === undefined && t.size < GABARITS.farFrom ? 0 : TREE_TRIANGLES.far;
  return t.hollow !== undefined ? TREE_TRIANGLES.hollowNear : TREE_TRIANGLES.near;
}

/**
 * Un palétuvier de près (piste A) : un fût à six pans, évasé au pied, en deux tronçons ; cinq racines-échasses en trois
 * tronçons, qui partent du fût, s'arquent et plongent dans l'eau basse ; la couronne en trois grappes à facettes ; deux
 * roseaux à son pied. De loin, une grappe sur une pointe à trois pans, évasée au sol comme les racines, qui monte s'y
 * perdre (sans elle, la couronne flottait au-dessus de la forêt) ; un jeune, rien. Un buisson des Contreforts : un dôme bas.
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
  const H = t.hollow ?? (3.8 + 1.6 * ((t.yaw * 7) % 1)) * s * (s >= GABARITS.tall ? GABARITS.tallTrunk : 1);
  const R = 3.1 * s;
  const y = t.y;
  if (detail === 'far') {
    if (treeTriangles(t, 'far') === 0) return 0;
    b.prism({ x: t.x, y: y - 0.6, z: t.z, yaw: t.yaw }, 0.9 * s, 0, H + 0.4, 3, FOREST_COLORS.root);
    clump(b, t.x, y + H - 0.7, t.z, R, 2 * s, t.yaw, false);
    return TREE_TRIANGLES.far;
  }
  if (t.hollow !== undefined) {
    // Le Creux : la couronne seule, son fût creusé est au Détour.
    crown(b, t, y, H, R, s);
    return TREE_TRIANGLES.hollowNear;
  }
  const knot = y + 1.5 * s;
  tube(b, [t.x, y + 0.9 * s, t.z], [t.x, knot + 0.9 * s, t.z], 0.62 * s, 0.4 * s, TRUNK_SIDES, FOREST_COLORS.trunk, t.yaw);
  tube(b, [t.x, knot + 0.9 * s, t.z], [t.x, y + H + 0.2, t.z], 0.4 * s, 0.3 * s, TRUNK_SIDES, FOREST_COLORS.trunk, t.yaw);
  for (let k = 0; k < ROOTS; k++) {
    const a = t.yaw + (2 * Math.PI * (k + 0.3 * Math.sin(k * 2.7 + t.yaw))) / ROOTS;
    const ca = Math.cos(a), sa = Math.sin(a);
    const reach = (1.9 + 0.25 * Math.sin(k * 1.9 + t.yaw * 3)) * s;
    const at = (out: number, up: number): P3 => [t.x + ca * out, up, t.z + sa * out];
    // Retouche du directeur artistique : moins de pattes, plus de souche (l'arche basse, la section plus forte, plus court).
    const start = at(0.3 * s, y + 1.15 * s);
    const arch = at(0.85 * s, y + 0.35 * H);
    const bend = at(0.62 * reach, y + 0.8 * s);
    const foot = at(reach, y - 0.5);
    tube(b, start, arch, 0.4 * s, 0.33 * s, ROOT_SIDES, FOREST_COLORS.root, a);
    tube(b, arch, bend, 0.33 * s, 0.27 * s, ROOT_SIDES, FOREST_COLORS.root, a);
    tube(b, bend, foot, 0.27 * s, 0.22 * s, ROOT_SIDES, FOREST_COLORS.root, a);
  }
  for (let k = 0; k < REEDS; k++) {
    const a = t.yaw + 1.1 + 2.4 * k;
    const r = 1.6 * s + 0.3 * k;
    b.prism({ x: t.x + r * Math.cos(a), y: y - 0.05, z: t.z + r * Math.sin(a), yaw: a }, 0.12, 0, 0.45 + 0.05 * k, 3, FOREST_COLORS.reed);
  }
  crown(b, t, y, H, R, s);
  return TREE_TRIANGLES.near;
}

/**
 * La couronne d'un palétuvier de près : trois grappes à facettes, la grande au milieu, deux plus petites de part et
 * d'autre, un peu plus bas et plus haut (la silhouette de la planche de rendu, jamais un plateau).
 */
function crown(b: FacetBuilder, t: Tree, y: number, H: number, R: number, s: number): void {
  const c = Math.cos(t.yaw), n = Math.sin(t.yaw);
  clump(b, t.x, y + H - 0.5, t.z, 0.86 * R, 2.3 * s, t.yaw, true);
  clump(b, t.x + 1.5 * s * c, y + H - 0.1, t.z + 1.5 * s * n, 0.6 * R, 1.8 * s, t.yaw + 1, true);
  clump(b, t.x - 1.3 * s * n - 0.6 * s * c, y + H + 0.7 * s, t.z + 1.3 * s * c - 0.6 * s * n, 0.55 * R, 1.6 * s, t.yaw + 2, true);
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
    count += b ? drawTree(b, t, detail) : treeTriangles(t, detail);
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
