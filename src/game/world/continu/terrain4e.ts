// Le terrain du 4e (lot 1 du monde ouvert du 4e, « l'île entière en grandes masses ») : les Anciens Ateliers, une île
// longue, un seul sol en pente douce, jamais d'étage (fiche, § 5). Au sud-est, la terre rouge des Fabriques et du
// Bastion, coupés par le bassin à flot, profond, entre deux quais droits ; à l'ouest, au-delà d'un ravin sec, les verts
// brûlés des Coteaux, qui montent doucement ; au nord-ouest, le volcan calme, un cône large et bas, son cratère creusé ;
// du cratère à la mer du nord-est, la coulée figée, une bande de croûte de basalte un peu creusée, qui ferme l'Épaule au
// sud. Rien ne coule : la lave n'est qu'un liseré au bord du cratère et quelques fentes fixes dans la cuvette, au-dessus
// de la Forge (`lavaFacets` ; références : aucune lave sous le cratère ni sur les flancs). Le sommet, du cratère à la mer
// de l'ouest, ne se marche pas (`walkBlocked4e`), comme la coulée. Les tuiles, leurs deux niveaux de détail et leurs
// anneaux sont ceux du 6e (./terrain.ts) : seuls la hauteur, la peinture et ce qui pousse changent. Le volcan se voit de
// toute l'île : un cône grossier, sous le sol des tuiles, se dessine avec les lieux (`volcanoFarFacets`). Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distanceToPolyline, hash2, insidePolygon, signedDistance, smoothstep, type Vec2 } from './geometry';
import {
  BASSIN_4E,
  COAST_4E,
  COLORS_4E,
  COULEE_4E,
  CRIQUE,
  CRIQUE_PAD,
  CRIQUE_PAVING,
  CUVETTE_4E,
  DETOUR_SPOTS_4E,
  EPAVE_4E,
  PATH_EDGES_4E,
  PATH_NODES_4E,
  PLACES_4E,
  RAFIOT_4E,
  RAVIN_4E,
  RESERVED_4E,
  SUMMIT_4E,
  TERRAIN_4E,
  VOLCANO_4E,
  fromPlan4e,
  inEpaveClearing,
  nearRails4e,
} from './plan4e';
import { SHADOW_DIR_4E } from './sky';
import { drawTileWith, farHeightsOf, heightOnFar, heightOnMesh, tileRect, type GroundPaint, type HeightField, type P3, type TileDetail } from './terrain';

/** Le fond de la mer autour de l'île, et celui du bassin à flot : profonds, sans gué (fiche, § 5). */
const SEA_FLOOR = -1.6;
const DOCK_BED = -2.4;
/** La rive : de l'eau au sol, sur tant d'unités (au bord du bassin, ses quais droits : une seule) ; sous l'eau, sur tant d'autres. */
const BANK = { land: 4, dock: 1, water: 3, dockWater: 1 } as const;

/**
 * La coulée et le ravin, creusés dans le sol : de combien (`depth`), jusqu'où au plus bas (`floor`, toujours au-dessus de
 * l'eau : ni l'une ni l'autre n'est un ruisseau), et sur combien d'unités leur bord descend (`bank`).
 */
const COULEE = { depth: 1.2, floor: 0.12, bank: 2.2 } as const;
const RAVIN = { depth: 1.8, floor: 0.15, bank: 2.4 } as const;

/** La distance à l'eau du bassin à flot : négative dedans. */
export const bassinClearance = (p: Vec2): number => distanceToPolyline(p, BASSIN_4E.line) - BASSIN_4E.halfWidth;

/** La distance au bord de la coulée figée : négative dedans. */
export const couleeClearance = (p: Vec2): number => distanceToPolyline(p, COULEE_4E.line) - COULEE_4E.halfWidth;

/** La distance au bord du ravin sec : négative dedans. */
export const ravinClearance = (p: Vec2): number => distanceToPolyline(p, RAVIN_4E.line) - RAVIN_4E.halfWidth;

/** La distance signée à la terre ferme : positive sur la terre, négative dans la mer et le bassin. */
export function landDistance4e(p: Vec2): number {
  return Math.min(signedDistance(p, COAST_4E), bassinClearance(p));
}

/** Une ondulation lente du sol, de 0 à 1 (des sinus, aucun hasard : le même sol à chaque construction). */
const wave = (p: Vec2): number => 0.5 + 0.25 * Math.sin(p.x * 0.08 + 0.7) * Math.cos(p.z * 0.06 - 1.1) + 0.25 * Math.sin((p.x - p.z) * 0.05 + 1.9);

/** Les Coteaux, à l'ouest du ravin : un sol qui monte doucement vers l'ouest (de 0 à 1). */
const westRise = (p: Vec2): number => smoothstep(-60, -165, p.x);
/** L'Épaule, au nord : un sol qui monte doucement vers le nord (de 0 à 1). */
const northRise = (p: Vec2): number => smoothstep(-78, -132, p.z);

/** La hauteur du cône du volcan en un point (0 au-delà de son pied), son cratère creusé. */
function volcanoHeight(p: Vec2): number {
  const { crater, radius, height, craterRadius, craterDepth } = VOLCANO_4E;
  const d = Math.hypot(p.x - crater.x, p.z - crater.z);
  if (d >= radius) return 0;
  const cone = height * (1 - Math.max(d, craterRadius) / radius);
  return d < craterRadius ? cone - craterDepth * (1 - (d / craterRadius) ** 2) : cone;
}

/** La hauteur du sol hors des coupures : le sol des Fabriques, la montée des Coteaux et de l'Épaule, le volcan. */
const landHeight = (p: Vec2): number => 0.6 + 0.55 * wave(p) + 1.6 * westRise(p) + 1.5 * northRise(p) + volcanoHeight(p);

/** La hauteur du sol, avant la grille : la mer, le bassin et ses quais, le sol, la coulée et le ravin creusés. */
export function heightAt4e(p: Vec2): number {
  const coast = signedDistance(p, COAST_4E);
  const dock = bassinClearance(p);
  if (coast < 0 || dock < 0) return coast < dock ? SEA_FLOOR * smoothstep(0, BANK.water, -coast) : DOCK_BED * smoothstep(0, BANK.dockWater, -dock);
  let h = landHeight(p) * Math.min(smoothstep(0, BANK.land, coast), smoothstep(0, BANK.dock, dock));
  for (const [clear, cut] of [[couleeClearance(p), COULEE], [ravinClearance(p), RAVIN]] as const) {
    const k = 1 - smoothstep(0, cut.bank, clear);
    if (k > 0) h += (Math.max(Math.min(h, cut.floor), h - cut.depth) - h) * k;
  }
  return h;
}

/** Le sommet du volcan, la coulée : on n'y marche pas (la marche libre les contourne ; un toucher mène à côté). */
export const walkBlocked4e = (p: Vec2): boolean => insidePolygon(p, SUMMIT_4E) || couleeClearance(p) < 0.6 || ravinClearance(p) < 0.4;

let fieldCache: HeightField | null = null;

/** La carte de hauteurs du 4e (une fois), son terrain de loin abaissé sous les chemins, comme au 6e. */
export function buildHeightField4e(): HeightField {
  if (fieldCache) return fieldCache;
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN_4E;
  const nx = tilesX * tileCells + 1;
  const nz = tilesZ * tileCells + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt4e({ x: minX + i * step, z: minZ + j * step });
  const field: HeightField = { minX, minZ, step, nx, nz, heights, far: heights };
  fieldCache = { ...field, far: farHeightsOf(field, PATH_NODES_4E, PATH_EDGES_4E, (x, z) => groundOn4e(field, x, z)) };
  return fieldCache;
}

/** Le point est-il dans la grille du 4e ? */
const inGrid = (f: HeightField, x: number, z: number): boolean => x >= f.minX && z >= f.minZ && x <= f.minX + (f.nx - 1) * f.step && z <= f.minZ + (f.nz - 1) * f.step;

/** Le sol dessiné de près du 4e en (x, z) : sur la grille, comme la tuile ; au-delà, la hauteur du plan. */
export const groundOn4e = (f: HeightField, x: number, z: number): number => (inGrid(f, x, z) ? heightOnMesh(f, x, z) : heightAt4e({ x, z }));


// ---------- La peinture du sol ----------

/** Une facette moins droite que ça est de la roche (un flanc raide, un quai, le bord du cratère). */
const ROCK_UP = 0.6;
/** Une facette moins droite que ça prend son flanc (au soleil, ou à l'ombre). */
const SLOPE_UP = 0.97;
/** Le haut du volcan : au-dessus de cette hauteur du cône, le basalte. */
const ROCK_FROM = 5;
/** Le haut du sommet, en part de la hauteur du cône : au-dessus, la croûte. */
const SUMMIT_CRUST = 0.76;

/** Le sens d'où vient le soleil, à plat : un flanc qui le regarde est au soleil. */
const SUN_FLAT = { x: -SHADOW_DIR_4E.x, z: -SHADOW_DIR_4E.z } as const;

/**
 * Les Coteaux, en plan (fiche, § 5, et le plan des terres : à l'ouest du ravin, au sud du sommet et de la coulée) : là,
 * les verts brûlés ; ailleurs en bas, la terre rouge.
 */
const COTEAUX_AREA = [[0, 305], [370, 300], [450, 308], [560, 338], [680, 378], [800, 405], [828, 480], [812, 580], [775, 700], [735, 860], [695, 1030], [668, 1450], [0, 1450]].map((q) => fromPlan4e(q as [number, number]));

/**
 * Une tache du sol, de 0 à 1 : de grands aplats aux bords souples, d'une cinquantaine d'unités, qui ne suivent jamais la
 * grille (retouche 1 du lot 1, directeur artistique : les cases de douze unités faisaient un damier sur la Carte). Des
 * sinus en biais, sans hasard : le même sol à chaque construction.
 */
const patch = (x: number, z: number): number =>
  0.5 + 0.3 * Math.sin(x * 0.043 + z * 0.029 + 1.3) * Math.cos(z * 0.037 - x * 0.021 + 0.4) + 0.2 * Math.sin((x * 0.6 + z) * 0.052 + 2.2);

/** La part de terre de l'Épaule en un point (au nord de la coulée) : sa roche brune, plus claire que le volcan. */
const northOfCoulee = (p: Vec2): boolean => p.z < -40 && !insidePolygon(p, COTEAUX_AREA) && signedDistance(p, COTEAUX_AREA) < -2 && p.x < 75 && p.z < northEdge(p.x);

/** Le bord sud de l'Épaule : la ligne de la coulée, en `z`, à cette abscisse (le plus au sud de ses points proches). */
function northEdge(x: number): number {
  const line = COULEE_4E.line;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i];
    if ((x - a.x) * (x - b.x) <= 0) return a.z + ((b.z - a.z) * (x - a.x)) / (b.x - a.x || 1e-6);
  }
  return -Infinity;
}

/**
 * La couleur d'un sol à plat en (x, z), à la hauteur `h` : le sable au bord de l'eau ; la croûte dans la coulée ; le fond
 * sec du ravin ; le basalte chaud du volcan (au-dessus de `ROCK_FROM` de son cône) ; l'Épaule, de roche plus claire ; les
 * Coteaux, verts brûlés ; la terre rouge partout ailleurs, en taches au soleil.
 */
function flat4e(x: number, z: number, h: number): number {
  const p = { x, z };
  if (h < 0.35 && couleeClearance(p) > 0.5 && ravinClearance(p) > 0.5) return COLORS_4E.sand;
  if (couleeClearance(p) < 0.4 || insidePolygon(p, SUMMIT_4E)) return volcanoHeight(p) > SUMMIT_CRUST * VOLCANO_4E.height || couleeClearance(p) < 0.4 ? COLORS_4E.crust : COLORS_4E.basalt;
  if (ravinClearance(p) < 0.4) return COLORS_4E.gully;
  if (signedDistance(p, COAST_4E) < 2.5 && bassinClearance(p) > 2) return COLORS_4E.sand;
  const k = patch(x, z);
  if (volcanoHeight(p) > ROCK_FROM) return k < 0.62 ? COLORS_4E.basalt : COLORS_4E.basaltSun;
  if (insidePolygon(p, COTEAUX_AREA)) return k < 0.62 ? COLORS_4E.burnt : COLORS_4E.burntSun;
  if (northOfCoulee(p)) return k < 0.6 ? COLORS_4E.rockSun : COLORS_4E.burntShade;
  return k < 0.68 ? COLORS_4E.soil : COLORS_4E.soilSun;
}

/** La teinte à l'ombre de chaque aplat du sol (jamais presque noire). */
const SHADE_OF: Readonly<Record<number, number>> = {
  [COLORS_4E.soil]: COLORS_4E.soilShade,
  [COLORS_4E.soilSun]: COLORS_4E.soil,
  [COLORS_4E.burnt]: COLORS_4E.burntShade,
  [COLORS_4E.burntSun]: COLORS_4E.burnt,
  [COLORS_4E.rock]: COLORS_4E.rockShade,
  [COLORS_4E.rockSun]: COLORS_4E.rock,
  [COLORS_4E.basalt]: COLORS_4E.basaltShade,
  [COLORS_4E.basaltSun]: COLORS_4E.basalt,
  [COLORS_4E.crust]: COLORS_4E.crustShade,
};

/**
 * La couleur d'une facette : la roche si elle est raide (la pierre des quais au bord du bassin ; la croûte dans la
 * coulée ; au soleil, la roche claire ; à l'ombre, la roche sombre : jamais presque noire) ; sur une pente douce, son
 * aplat au soleil ou à l'ombre ; sinon, le sol à plat.
 */
function facet4e(a: P3, b: P3, c: P3): number {
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
  const p = { x, z };
  if (up < ROCK_UP) {
    if (bassinClearance(p) < 2) return sunny ? COLORS_4E.stoneSun : COLORS_4E.stone;
    if (couleeClearance(p) < 2) return COLORS_4E.crustShade;
    if (h < 0.4) return COLORS_4E.sand;
    if (volcanoHeight(p) > ROCK_FROM) return sunny ? COLORS_4E.basaltSun : COLORS_4E.basaltShade;
    return sunny ? COLORS_4E.rockSun : COLORS_4E.rockShade;
  }
  const base = flat4e(x, z, h);
  if (up >= SLOPE_UP || base === COLORS_4E.sand || base === COLORS_4E.gully) return base;
  return sunny ? base : (SHADE_OF[base] ?? base);
}

/** Le 4e n'a pas d'écume : la mer est calme, bleu nuit (vue globale). */
const noFoam = (): number => 0;

const PAINT_4E: GroundPaint = { facet: facet4e, flat: flat4e, foam: noFoam };

// ---------- Ce qui pousse, et les rochers ----------

/** Les couleurs de ce qui pousse : des buissons d'olive sèche sur les Coteaux, des rochers de basalte brun ailleurs. */
export const FLORA_4E_COLORS = { shrub: 0x7e7a44, shrubTop: 0x948e52, boulder: 0x6c5048, boulderTop: 0x82625a } as const;

/**
 * Où pousse un buisson ou se couche un rocher : une place tous les `cell` unités au plus, gardée une fois sur `keep`
 * (sur les Coteaux, `keepCoteaux`) ; jamais à moins de `path` unités d'un chemin ou d'un rail, de `place` du centre d'un
 * lieu, de `cut` de la coulée, du ravin ou du bassin, de `coast` de la mer, ni sur la Crique, le sommet, les places
 * réservées (les Détours, les grands projets, le Rafiot).
 */
const FLORA_KEEP = { cell: 9, keep: 0.12, keepCoteaux: 0.42, path: 3.2, place: 13, cut: 3, coast: 3, crique: 8, spot: 7 } as const;

/** Les tronçons des chemins du 4e (pour garder ce qui pousse à distance). */
const SEGMENTS: readonly (readonly [Vec2, Vec2])[] = (() => {
  const at = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
  return PATH_EDGES_4E.map(([a, b]) => [at.get(a)!, at.get(b)!] as const);
})();

const nearPath = (p: Vec2, reach: number): boolean => SEGMENTS.some(([a, b]) => distanceToPolyline(p, [a, b]) < reach);
const nearPlace = (p: Vec2): boolean => PLACES_4E.some((pl) => Math.hypot(p.x - pl.center.x, p.z - pl.center.z) < FLORA_KEEP.place);

/** Les places gardées libres : les Détours, les grands projets, le Rafiot et son quai. */
const SPOTS: readonly Vec2[] = [...Object.values(DETOUR_SPOTS_4E), RESERVED_4E.portique.center, RESERVED_4E.tour.center, RAFIOT_4E.at];

/** La Crique et son aire : sa place, son quai, sa rangée, la passerelle de l'aire. */
function nearCrique(p: Vec2): boolean {
  const l = CRIQUE.toLocal(p);
  const k = FLORA_KEEP.crique;
  return l.x > CRIQUE_PAVING.square.x0 - k && l.x < CRIQUE_PAVING.square.x1 + k && l.z > -k && l.z < CRIQUE_PAD.pad.z + k;
}

/** Un buisson ou un rocher : sa place, son sol, sa taille, son quart de tour. */
interface Plant {
  x: number;
  z: number;
  y: number;
  size: number;
  yaw: number;
  shrub: boolean;
}

const plantsOf = new Map<number, readonly Plant[]>();

/** Ce qui pousse dans une tuile (calculé une fois). */
function plantsIn(tx: number, tz: number): readonly Plant[] {
  const key = tz * TERRAIN_4E.tilesX + tx;
  const known = plantsOf.get(key);
  if (known) return known;
  const r = tileRect(tx, tz, TERRAIN_4E);
  const out: Plant[] = [];
  const c = FLORA_KEEP.cell;
  for (let j = Math.floor(r.minZ / c); j * c < r.maxZ; j++)
    for (let i = Math.floor(r.minX / c); i * c < r.maxX; i++) {
      const p = { x: (i + 0.15 + 0.7 * hash2(i + 301, j)) * c, z: (j + 0.15 + 0.7 * hash2(i, j + 411)) * c };
      if (p.x < r.minX || p.x >= r.maxX || p.z < r.minZ || p.z >= r.maxZ) continue;
      const coteaux = insidePolygon(p, COTEAUX_AREA);
      if (hash2(i + 17, j + 23) > (coteaux ? FLORA_KEEP.keepCoteaux : FLORA_KEEP.keep)) continue;
      if (signedDistance(p, COAST_4E) < FLORA_KEEP.coast || bassinClearance(p) < FLORA_KEEP.cut) continue;
      if (couleeClearance(p) < FLORA_KEEP.cut || ravinClearance(p) < FLORA_KEEP.cut || insidePolygon(p, SUMMIT_4E)) continue;
      if (nearPath(p, FLORA_KEEP.path) || nearRails4e(p, FLORA_KEEP.path) || nearPlace(p) || nearCrique(p)) continue;
      if (SPOTS.some((s) => Math.hypot(p.x - s.x, p.z - s.z) < FLORA_KEEP.spot)) continue;
      // L'Épave (lot 2) : sa coque, sa cale, Kéo devant elle et sa sente restent libres.
      if (inEpaveClearing(p)) continue;
      if (Math.hypot(p.x - CUVETTE_4E.center.x, p.z - CUVETTE_4E.center.z) < 14) continue;
      // Le cône nu au-dessus de son pied (`ROCK_FROM`) : aucun buisson ni rocher sur le basalte sombre (directeur
      // artistique, deuxième relecture du lot 1 : les buissons olive y faisaient des taches jusqu'au sommet).
      if (volcanoHeight(p) > ROCK_FROM) continue;
      out.push({ x: p.x, z: p.z, y: heightAt4e(p), size: 0.7 + 0.5 * hash2(i + 7, j + 13), yaw: 6.283 * hash2(i + 31, j + 17), shrub: coteaux });
    }
  plantsOf.set(key, out);
  return out;
}

/** Les triangles d'un buisson et d'un rocher, de près et de loin (comptés sans construire). */
const PLANT_TRIANGLES = { shrubNear: 18 + 6, shrubFar: 15, boulderNear: 15, boulderFar: 15 } as const;

/** Un buisson : un dôme bas (deux prismes de près, un de loin) ; un rocher : un bloc à pans, couché. */
function drawPlant(b: FacetBuilder, t: Plant, detail: TileDetail): number {
  const s = t.size;
  const C = FLORA_4E_COLORS;
  if (!t.shrub) {
    b.prism({ x: t.x, y: t.y - 0.4, z: t.z, yaw: t.yaw }, 1.3 * s, 0.8 * s, 1.1 * s, 5, C.boulder, C.boulderTop);
    return PLANT_TRIANGLES.boulderNear;
  }
  if (detail === 'far') {
    b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.7 * s, 0.6 * s, 1.5 * s, 5, C.shrub, C.shrubTop);
    return PLANT_TRIANGLES.shrubFar;
  }
  b.prism({ x: t.x, y: t.y - 0.3, z: t.z, yaw: t.yaw }, 1.7 * s, 1.1 * s, 1.1 * s, 6, C.shrub, C.shrubTop);
  b.prism({ x: t.x, y: t.y + 0.8 * s, z: t.z, yaw: t.yaw + 0.5 }, 1.1 * s, 0, 0.6 * s, 6, C.shrubTop);
  return PLANT_TRIANGLES.shrubNear;
}

/** Ce qui pousse dans une tuile, ou son seul nombre de triangles (sans `b`). */
function drawFlora4e(tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
  let count = 0;
  for (const t of plantsIn(tx, tz)) count += b ? drawPlant(b, t, detail) : t.shrub ? (detail === 'near' ? PLANT_TRIANGLES.shrubNear : PLANT_TRIANGLES.shrubFar) : PLANT_TRIANGLES.boulderNear;
  return count;
}

// ---------- Les tuiles ----------

/** Le sol d'une tuile du 4e (le premier temps de la réserve des tuiles). */
export function tileGround4e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_4E);
  return b.build();
}

/** Ce qui pousse dans une tuile du 4e (le second temps). */
export function tileFlora4e(_field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawFlora4e(tx, tz, detail, b);
  return b.build();
}

/** Une tuile du 4e entière : son sol, puis ce qui y pousse. */
export function tileFacets4e(field: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTileWith(field, tx, tz, detail, b, PAINT_4E);
  drawFlora4e(tx, tz, detail, b);
  return b.build();
}

/** Le nombre de triangles de chaque tuile entière du 4e à un niveau de détail, par rang (sans rien construire). */
export function tileCounts4e(field: HeightField, detail: TileDetail): Int32Array {
  const { tilesX, tilesZ } = TERRAIN_4E;
  const out = new Int32Array(tilesX * tilesZ);
  for (let tz = 0; tz < tilesZ; tz++) for (let tx = 0; tx < tilesX; tx++) out[tz * tilesX + tx] = drawTileWith(field, tx, tz, detail, null, PAINT_4E) + drawFlora4e(tx, tz, detail, null);
  return out;
}

/** La coque de l'Épave (lot 2), qu'on ne traverse pas : trois disques le long de son axe, d'ouest en est. */
export const EPAVE_HULL_DISKS: readonly { x: number; z: number; r: number }[] = [-1, 0, 1].map((k) => ({
  x: EPAVE_4E.hull.x + k * (EPAVE_4E.hull.half - 2.3),
  z: EPAVE_4E.hull.z,
  r: EPAVE_4E.hull.beam + 0.35,
}));

/**
 * Ce qui bloque la marche libre dans une tuile du 4e (./freeWalk.ts) : chaque buisson et chaque rocher, et la coque de
 * l'Épave ; un disque chacun.
 */
export function obstaclesIn4e(tx: number, tz: number): { x: number; z: number; r: number }[] {
  const out = plantsIn(tx, tz).map((t) => ({ x: t.x, z: t.z, r: (t.shrub ? 1.6 : 1.3) * t.size }));
  const r = tileRect(tx, tz, TERRAIN_4E);
  for (const d of EPAVE_HULL_DISKS) if (d.x >= r.minX && d.x < r.maxX && d.z >= r.minZ && d.z < r.maxZ) out.push(d);
  return out;
}

// ---------- Le volcan de loin, la lave figée, le panache ----------

/** Le cône grossier : ses côtés, ses rangs (de la part du rayon), et de combien il s'enfonce sous le sol des tuiles. */
const FAR_CONE = { sides: 14, rings: [1, 0.72, 0.44, 0.2, 0.095], sink: 1.1 } as const;

/**
 * Le volcan de loin (le sol des tuiles ne va pas au-delà du brouillard, à 115 unités de Kéo) : un cône grossier, ses
 * sommets sur le sol enfoncés de `FAR_CONE.sink`, si bien que le sol des tuiles le couvre de près ; de loin, seul, il
 * dessine la silhouette du volcan au-dessus de l'air ambré. Sa roche à pans, son cratère en creux, de la croûte.
 */
export function volcanoFarFacets(): Facets {
  const b = new FacetBuilder();
  const { crater, radius } = VOLCANO_4E;
  const { sides, rings, sink } = FAR_CONE;
  const at = (ring: number, k: number): P3 => {
    const a = (2 * Math.PI * k) / sides + 0.2;
    const r = radius * rings[ring];
    const p = { x: crater.x + r * Math.cos(a), z: crater.z + r * Math.sin(a) };
    return [p.x, heightAt4e(p) - sink - (ring === 0 ? 1.5 : 0), p.z];
  };
  for (let ring = 0; ring < rings.length - 1; ring++)
    for (let k = 0; k < sides; k++) {
      const a = at(ring, k),
        c = at(ring, k + 1),
        d = at(ring + 1, k + 1),
        e = at(ring + 1, k);
      const color = ring === rings.length - 2 ? COLORS_4E.crust : (ring + k) % 3 === 0 ? COLORS_4E.basaltSun : COLORS_4E.basalt;
      b.quad(a, e, d, c, color);
    }
  // Le fond du cratère : un éventail sombre (de la croûte, jamais presque noir).
  const bottom: P3 = [crater.x, heightAt4e(crater) - sink, crater.z];
  for (let k = 0; k < sides; k++) b.triangle(at(rings.length - 1, k + 1), at(rings.length - 1, k), bottom, COLORS_4E.crustShade);
  return b.build();
}

/**
 * Le liseré de lave au bord du cratère : sa demi-largeur, sa hauteur au-dessus du sol, le nombre de ses pans, et ceux
 * qui manquent (`gaps`) : un liseré coupé, jamais un anneau fermé (retouche 1 du lot 1, consultant d'Archipéo : sur la
 * Carte, un anneau rouge net se lisait comme une cible).
 */
const RIM = { half: 0.3, lift: 0.08, sides: 18, gaps: [2, 3, 7, 11, 12, 16] } as const;

/**
 * Les fentes de la cuvette (centre en unités depuis la cuvette, longueur, cap) : fines, plus rouges qu'orange, fixes ;
 * jamais sur un chemin (la cuvette est dans la coulée, où l'on ne marche pas).
 */
const CUVETTE_CRACKS: readonly (readonly [number, number, number, number])[] = [
  [-4.5, -0.6, 4.2, 0.25],
  [-0.8, 0.9, 3.6, -0.4],
  [2.6, -1.1, 3.2, 0.6],
  [5.2, 0.6, 2.4, -0.15],
  [0.6, -2.2, 2.2, 1.2],
];

/**
 * La lave figée (fiche, § 2 ; avis dys sur la lave) : un liseré fin au bord du cratère, jamais l'intérieur ; quelques
 * fentes fines dans la croûte de la cuvette, au-dessus de la Forge ; rien ailleurs (références : aucune lave sous le
 * cratère ni sur les flancs ; la rigole reste vide et couverte jusqu'à la restauration de la Forge). Une couleur seule,
 * dessinée sans ombre par la vue (une lueur fixe : rien ne coule, rien ne pulse, rien ne scintille). Moins de 2 % de
 * l'image : quelques dizaines de triangles fins.
 */
export function lavaFacets(): Facets {
  const b = new FacetBuilder();
  const { crater, craterRadius } = VOLCANO_4E;
  const ring = (k: number, r: number): P3 => {
    const a = (2 * Math.PI * k) / RIM.sides;
    const p = { x: crater.x + r * Math.cos(a), z: crater.z + r * Math.sin(a) };
    return [p.x, heightAt4e(p) + RIM.lift, p.z];
  };
  // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
  for (let k = 0; k < RIM.sides; k++) if (!(RIM.gaps as readonly number[]).includes(k)) b.quad(ring(k, craterRadius - RIM.half), ring(k + 1, craterRadius - RIM.half), ring(k + 1, craterRadius + RIM.half), ring(k, craterRadius + RIM.half), COLORS_4E.lava);
  const { center } = CUVETTE_4E;
  for (const [dx, dz, len, yaw] of CUVETTE_CRACKS) {
    const c = Math.cos(yaw) * len * 0.5,
      s = Math.sin(yaw) * len * 0.5;
    const w = 0.14;
    const pt = (u: number, v: number): P3 => {
      const p = { x: center.x + dx + u * c - v * Math.sin(yaw), z: center.z + dz + u * s + v * Math.cos(yaw) };
      return [p.x, heightAt4e(p) + 0.05, p.z];
    };
    b.quad(pt(-1, -w), pt(-1, w), pt(1, w), pt(1, -w), COLORS_4E.lava);
  }
  return b.build();
}

/**
 * Le panache (fiche, § 5 : « un panache mince et clair » ; lot 2, intention du directeur artistique, § 7 : une colonne,
 * jamais des boules) : quatre troncs de cône empilés au-dessus du cratère, chacun partant du cercle où finit le
 * précédent (`rings` : le décalage de son centre depuis le cratère et son rayon, de 2 à 4), penchés vers le sud-est,
 * immobiles. Le côté du soleil clair, l'autre à l'ombre, le dessus clair. Dessiné sans ombre par la vue, peu voilé : il se voit de toute l'île,
 * et ne se confond pas avec la fumée du Rafiot (courte, basse, sombre).
 */
export const PLUME_4E = {
  sides: 7,
  rings: [
    [0, 1, 0, 2],
    [1.4, 7, 1.2, 2.7],
    [3.4, 13, 2.9, 3.3],
    [6, 18.5, 5, 3.7],
    [9, 23.5, 7.4, 4],
  ],
} as const;

export function plumeFacets(): Facets {
  const b = new FacetBuilder();
  const { crater } = VOLCANO_4E;
  const top = landHeight(crater);
  const { sides, rings } = PLUME_4E;
  const at = (i: number, k: number): P3 => {
    const [dx, dy, dz, r] = rings[i];
    const a = (2 * Math.PI * k) / sides + i * 0.35;
    return [crater.x + dx + r * Math.cos(a), top + dy, crater.z + dz + r * Math.sin(a)];
  };
  for (let i = 0; i + 1 < rings.length; i++)
    for (let k = 0; k < sides; k++) {
      // Le côté du soleil (le sud-ouest) clair, l'autre à l'ombre : deux aplats sur la hauteur, jamais des bandes.
      const mid = (2 * Math.PI * (k + 0.5)) / sides + i * 0.35;
      const sunny = Math.cos(mid) * -0.7 + Math.sin(mid) * 0.7 > 0;
      b.quad(at(i, k + 1), at(i, k), at(i + 1, k), at(i + 1, k + 1), sunny ? COLORS_4E.smoke : COLORS_4E.smokeShade);
    }
  const last = rings.length - 1;
  const [dx, dy, dz] = rings[last];
  const c: P3 = [crater.x + dx, top + dy + 0.6, crater.z + dz];
  for (let k = 0; k < sides; k++) b.triangle(c, at(last, k + 1), at(last, k), COLORS_4E.smoke);
  return b.build();
}

// ---------- Le sommet sur la Carte ----------

/**
 * Les hachures du sommet sur la Carte (fiche, § 5 : « le sommet, hachuré, ne se marche pas ») : des bandes en biais,
 * tous les `gap` unités, larges de `width`, posées `lift` au-dessus du sol, par pas de `step` le long d'elles, dans le
 * contour du sommet. Un gris chaud à peine plus clair que le basalte, espacées (retouche 1 du lot 1, référent dys : des
 * rayures serrées et très contrastées gênent certains lecteurs) : elles se lisent, sans texte ni éblouissement. Sur la
 * Carte seulement, dans le maillage des lieux.
 */
const SUMMIT_HATCH_4E = { gap: 9, width: 0.9, lift: 0.6, step: 2, color: 0x9a8a80 } as const;

export function summitMapHatch(): Facets {
  const b = new FacetBuilder();
  const { gap, width, lift, step, color } = SUMMIT_HATCH_4E;
  const xs = SUMMIT_4E.map((p) => p.x);
  const zs = SUMMIT_4E.map((p) => p.z);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs);
  // Les bandes suivent la diagonale (1, 1)/√2 ; chacune, son décalage `c` le long de (1, −1)/√2.
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
      if (!insidePolygon(p, SUMMIT_4E) || !insidePolygon(q, SUMMIT_4E)) continue;
      const y = Math.max(heightAt4e(p), heightAt4e(q), heightAt4e(at(t + step / 2))) + lift;
      // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
      b.quad([p.x - v.x * w, y, p.z - v.z * w], [q.x - v.x * w, y, q.z - v.z * w], [q.x + v.x * w, y, q.z + v.z * w], [p.x + v.x * w, y, p.z + v.z * w], color);
    }
  return b.build();
}

// ---------- Les coupures sur la Carte ----------

/**
 * Le dessin des coupures sur la Carte (retouche 1 du lot 1, directeur artistique : « des limites de couleur qui suivent
 * la coupure, une ligne nette ») : vues de haut, les tuiles de loin font des marches de leurs cases le long du ravin et
 * de la coulée. Par-dessus, une bande qui suit la ligne de la coupure : son fond (le fond sec du ravin, la croûte de la
 * coulée), une berge sombre de chaque côté (le ravin se lit en creux à deux berges, jamais comme une marche), puis un
 * peu de la terre de chaque rive, de sa couleur, qui couvre les marches ; au milieu de la coulée, son trait fin
 * ocre-rouge, éteint (jamais la couleur de la lave). Levée au-dessus du sol de près et de loin (`lift`) : de haut, rien
 * ne la perce. `step` : son pas le long de la ligne ; `bank`, `land` : la largeur de la berge et de la rive, au-delà du
 * bord (`edge`, la part de la coupure peinte de son fond).
 */
const CUT_MAP_4E = { step: 2.5, edge: 0.4, bank: 1.2, land: 2.4, lift: 1, trace: 0.35, bankColor: 0x5e4a3e, traceColor: 0x8a4e3c } as const;

/** Une ligne repassée à un pas régulier (les coudes gardés). */
function resample(line: readonly Vec2[], step: number): Vec2[] {
  const out: Vec2[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const n = Math.max(1, Math.ceil(Math.hypot(c.x - a.x, c.z - a.z) / step));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((c.x - a.x) * k) / n, z: a.z + ((c.z - a.z) * k) / n });
  }
  return out;
}

/** La bande d'une coupure sur la Carte (son fond `fill`, sa demi-largeur `half`, son trait du milieu ou non). */
function cutBand(b: FacetBuilder, field: HeightField, line: readonly Vec2[], half: number, fill: number, trace: boolean): void {
  const C = CUT_MAP_4E;
  const pts = resample(line, C.step);
  const y = (p: Vec2) => Math.max(heightAt4e(p), heightOnMesh(field, p.x, p.z), heightOnFar(field, p.x, p.z)) + C.lift;
  // La normale de la ligne en chaque point (la moyenne de ses deux tronçons).
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
    // Vue d'en haut, dans le sens inverse des aiguilles d'une montre : la face regarde le ciel.
    const ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
    if (ny >= 0) b.quad(a, c, d, e, color);
    else b.quad(e, d, c, a, color);
  };
  const edge = half + C.edge;
  for (let i = 1; i < pts.length; i++) {
    const strip = (v0: number, v1: number, color: number) => up(at(i - 1, v0), at(i, v0), at(i, v1), at(i - 1, v1), color);
    strip(-edge, edge, fill);
    for (const s of [-1, 1]) {
      strip(s * edge, s * (edge + C.bank), C.bankColor);
      // La rive : la couleur de la terre de ce côté, prise un peu plus loin.
      const n = normal(i);
      const far = { x: pts[i].x + n.x * s * (edge + C.bank + C.land + 3), z: pts[i].z + n.z * s * (edge + C.bank + C.land + 3) };
      strip(s * (edge + C.bank), s * (edge + C.bank + C.land), flat4e(far.x, far.z, heightAt4e(far)));
    }
    if (trace) strip(-C.trace, C.trace, C.traceColor);
  }
}

/** Les coupures sur la Carte : le ravin, puis la coulée, hors du sommet (déjà hachuré) ; le bassin a ses quais droits. */
function cutMapBands4e(): Facets {
  const b = new FacetBuilder();
  const field = buildHeightField4e();
  cutBand(b, field, RAVIN_4E.line, RAVIN_4E.halfWidth, COLORS_4E.gully, false);
  const coulee = COULEE_4E.line.filter((p, i) => i === 0 || !insidePolygon(p, SUMMIT_4E));
  cutBand(b, field, coulee, COULEE_4E.halfWidth, COLORS_4E.crust, true);
  return b.build();
}

/** Ce que la Carte du 4e ajoute au monde : les hachures du sommet et le dessin des coupures. */
export const mapOverlay4e = (): Facets => mergeFacets([summitMapHatch(), cutMapBands4e()]);
