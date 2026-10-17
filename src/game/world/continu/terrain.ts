// Le terrain du monde continu : une carte de hauteurs tirée du plan du 6e (./plan6e.ts), puis des tuiles de facettes
// en aplats (low poly d'Archipéo : une couleur par facette, sable, herbe, roche, haut de falaise). Ce qui est sous
// l'eau n'est pas dessiné : la mer le couvre. Piste 1, lot 1 : l'île agrandie est coupée en tuiles carrées à deux
// niveaux de détail (chaque case de près, une sur trois de loin), rassemblées par anneau autour de Kéo (`tileRings`) ;
// la brume cache ce qui est plus loin. Code pur : la vue (three/archipeo/) ne fait que donner ces tableaux à Three.js.
import { FacetBuilder, type Facets } from './facets';
import { SHADOW_DIR } from './sky';
import { distance, distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { BEACONS_FLAT, CLIFF, COAST, COLORS_6E, COMMONS_FLAT, DECK_HEIGHT, DOCK, ECLUSES_LANDING, ENGINE_FLAT, ISLET, LAGOON, LOOKOUT_RAMP, MANGROVE_FLAT, NORTH_FLATS, OBSERVATORY_FLAT, PASS, PATH_EDGES, PATH_NODES, PLACES, RIVER, RIVER_MOUTH, RUINS_FLAT, SALT_FLAT, SHIPYARD_FLAT, STRAITS, TERRAIN, UPLAND, type StraitId } from './plan6e';

/** Les bras de mer, dans l'ordre de `STRAITS`, et leurs noms dans le même ordre. */
const STRAIT_LIST = Object.values(STRAITS);
const STRAIT_IDS = Object.keys(STRAITS) as StraitId[];

/**
 * La distance à l'eau d'un bras de mer (GD-20, point 3, « vraies terres ») : positive sur la terre, négative dans son
 * eau ; d'un seul bras (`id`), ou du plus proche.
 */
export function straitClearance(p: Vec2, id?: StraitId): number {
  if (id) return clearanceOf(p, STRAITS[id], BRIDGE_MIDS[STRAIT_IDS.indexOf(id)]);
  let d = Infinity;
  for (let k = 0; k < STRAIT_LIST.length; k++) d = Math.min(d, clearanceOf(p, STRAIT_LIST[k], BRIDGE_MIDS[k]));
  return d;
}

/** Le milieu de l'eau d'un pont : le point de sa liaison (entre ses deux nœuds) le plus près de la ligne du bras. */
const bridgeMid = (s: (typeof STRAIT_LIST)[number]): Vec2 => {
  const [a, b] = s.bridge.map((id) => PATH_NODES.find((n) => n.id === id)!.at);
  let best = a;
  for (let k = 0; k <= 200; k++) {
    const q = { x: a.x + ((b.x - a.x) * k) / 200, z: a.z + ((b.z - a.z) * k) / 200 };
    if (distanceToPolyline(q, s.line) < distanceToPolyline(best, s.line)) best = q;
  }
  return best;
};
/** Le milieu de chaque pont, dans l'ordre de `STRAITS`. */
const BRIDGE_MIDS: readonly Vec2[] = STRAIT_LIST.map(bridgeMid);
/** Autour d'un pont, sur tant d'unités, puis fondu sur tant d'autres, la largeur du bras ne change pas (aucun évasement). */
const FLARE_KEEP = { near: 12, fade: 6 } as const;

/**
 * La distance à l'eau d'un bras de mer, ses bouts évasés en entonnoir (`flare`, relecture du lot 1), jamais près de son
 * pont : la largeur au pont reste celle d'avant.
 */
function clearanceOf(p: Vec2, s: (typeof STRAIT_LIST)[number], mid: Vec2): number {
  const ends = [s.line[0], s.line[s.line.length - 1]];
  const keep = smoothstep(FLARE_KEEP.near, FLARE_KEEP.near + FLARE_KEEP.fade, distance(p, mid));
  let half: number = s.halfWidth;
  if (keep > 0)
    for (let k = 0; k < 2; k++) {
      const [reach, extra] = s.flare[k];
      half += keep * extra * (1 - smoothstep(0, reach, distance(p, ends[k])));
    }
  return distanceToPolyline(p, s.line) - half;
}

/**
 * La distance signée à la terre ferme : positive sur la terre, négative dans l'eau (mer, lagon, passe, bassin, rivière,
 * son embouchure élargie, les bras de mer).
 */
export function landDistance(p: Vec2): number {
  const ring = Math.min(signedDistance(p, COAST), -signedDistance(p, LAGOON), -signedDistance(p, PASS), -signedDistance(p, DOCK));
  const land = Math.max(ring, signedDistance(p, ISLET));
  const river = Math.min(distanceToPolyline(p, RIVER.line) - RIVER.halfWidth, distanceToPolyline(p, RIVER_MOUTH.line) - RIVER_MOUTH.halfWidth);
  return Math.min(land, river, straitClearance(p));
}

/**
 * Les rives rocheuses des bras de mer (artiste technique 3D) : une levée de roche de `height` au-dessus de l'eau, en
 * deux gradins (`step` en `rise` unités depuis la rive, un replat jusqu'à `ledge`, puis le reste en `rise2`), qui tient
 * jusqu'à `hold`, puis rejoint le sol d'avant à `fade` ; sans plage, la roche jusqu'à `rock` unités de l'eau. Toute sa
 * hauteur à moins de `near` unités d'un pont, `low` de sa hauteur au-delà de `far`. Ni banc, ni gué, ni pierre de passage.
 */
export const STRAIT_BANK = { height: 1.8, step: 0.9, rise: 0.5, ledge: 1.4, rise2: 0.6, hold: 3.5, fade: 8, rock: 2.5, near: 9, far: 22, low: 0.55 } as const;

/**
 * La levée de roche d'un bras de mer en `p`, à `s` unités de son eau (relecture du lot 1, directeur artistique : plus de
 * canyon) : deux gradins, le premier de `step` au ras de l'eau, un replat, puis le second jusqu'à `height` (1,5 à 2
 * au-dessus de l'eau) ; toute sa hauteur près d'un pont (`near`), puis plus basse loin de lui (`low` de sa hauteur dès
 * `far`), toujours en deux gradins.
 */
function bankHeight(p: Vec2, s: number): number {
  const bridge = BRIDGE_MIDS.reduce((d, m) => Math.min(d, distance(p, m)), Infinity);
  const k = 1 - (1 - STRAIT_BANK.low) * smoothstep(STRAIT_BANK.near, STRAIT_BANK.far, bridge);
  const B = STRAIT_BANK;
  const steps = B.step * smoothstep(0, B.rise, s) + (B.height - B.step) * smoothstep(B.ledge, B.ledge + B.rise2, s);
  return k * steps * (1 - smoothstep(B.hold, B.fade, s));
}

/** La largeur de la plage, en unités (un peu moins de quatre pas). */
const BEACH = 3;
/** La hauteur du plateau de la falaise nord, et la largeur de son bord raide. */
const CLIFF_HEIGHT = 9;
const CLIFF_EDGE = 4;
/** Le fond, au large : plus bas que tout ce que la mer laisse voir. */
const DEEP = -0.35 - 4 * 0.3;

/** La boîte de la côte : au-delà, de quelques unités, c'est le large (on n'a rien à calculer). */
const COAST_BOX = COAST.reduce(
  (b, p) => ({ minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x), minZ: Math.min(b.minZ, p.z), maxZ: Math.max(b.maxZ, p.z) }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
);
const outsideCoastBox = (p: Vec2) => Math.max(COAST_BOX.minX - p.x, p.x - COAST_BOX.maxX, COAST_BOX.minZ - p.z, p.z - COAST_BOX.maxZ);

/**
 * La hauteur du sol, avant la grille : la plage presque plate, l'herbe qui monte, de longues ondulations à l'échelle de
 * la marche, la falaise nord, le haut pays de l'est.
 */
export function heightAt(p: Vec2): number {
  const h = groundHeight(p);
  // La rampe de la Vigie (lot L7) : son dessus monte en ligne droite du sol de son pied à celui du plateau ; ses flancs
  // descendent ensuite jusqu'au sol (elle ne creuse jamais : le plus haut des deux).
  const ramp = rampHeight(p);
  return ramp === null ? h : Math.max(h, ramp);
}

/** Le dessus de la rampe de la Vigie à son pied et à son haut (le sol sans elle), calculés une fois. */
let rampEnds: [number, number] | null = null;

/** La hauteur de la rampe de la Vigie au-dessus d'un point, ou rien hors de sa portée (lot L7). */
function rampHeight(p: Vec2): number | null {
  const { from, to, halfWidth, side } = LOOKOUT_RAMP;
  const dx = to.x - from.x,
    dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const t = ((p.x - from.x) * dx + (p.z - from.z) * dz) / (length * length);
  if (t < -0.05 || t > 1.05) return null;
  const lateral = Math.abs((p.x - from.x) * dz - (p.z - from.z) * dx) / length;
  // Le haut : le plateau, quelques pas après le rebord (le sol du rebord est encore la pente de la falaise).
  rampEnds ??= [groundHeight(from), Math.max(...[0, 2, 4, 6].map((k) => groundHeight({ x: to.x + (dx * k) / length, z: to.z + (dz * k) / length })))];
  const top = rampEnds[0] + (rampEnds[1] - rampEnds[0]) * Math.min(1, Math.max(0, t));
  const h = top - Math.max(0, lateral - halfWidth) / side;
  return lateral > halfWidth + top / side ? null : h;
}

/**
 * Les collines (GD-20, point 3, lot 3, deuxième levier graphique) : une colline ronde par case d'un réseau de `cell`
 * unités, sa place, sa largeur et sa hauteur tirées du hasard fixe de la case (`hash2` : le même relief à chaque
 * construction), son sommet adouci. Elles ne montent qu'à `path` unités d'un chemin, `place` du centre d'un lieu, `coast`
 * de l'eau et `strait` d'un bras de mer, de plus en plus jusqu'au bout de chaque intervalle : les chemins, les replats,
 * les plages et les rives restent ceux d'avant, la marche de Kéo aussi.
 */
const HILLS = { cell: 24, radius: [9, 15], height: [2.2, 5.5], path: [4, 14], place: [15, 26], coast: [BEACH + 1, BEACH + 12], strait: [6, 16] } as const;

/** La distance aux chemins, tirée une fois sur une grille de `PATH_GRID` unités (lue en bilinéaire). */
const PATH_GRID = 2;
let pathGrid: { minX: number; minZ: number; nx: number; nz: number; d: Float32Array } | null = null;

/** La distance d'un point au réseau des chemins (au plus `cap`, au-delà sans importance). */
function pathDistance(p: Vec2, cap: number): number {
  if (!pathGrid) {
    const minX = TERRAIN.minX - 10;
    const minZ = TERRAIN.minZ - 10;
    const nx = Math.ceil((TERRAIN.tilesX * TERRAIN.tileCells * TERRAIN.step + 20) / PATH_GRID) + 1;
    const nz = Math.ceil((TERRAIN.tilesZ * TERRAIN.tileCells * TERRAIN.step + 20) / PATH_GRID) + 1;
    const nodes = new Map(PATH_NODES.map((n) => [n.id, n.at]));
    const lines = PATH_EDGES.map(([a, b]) => [nodes.get(a)!, nodes.get(b)!]);
    const d = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const q = { x: minX + i * PATH_GRID, z: minZ + j * PATH_GRID };
        let best = 40;
        for (const line of lines) best = Math.min(best, distanceToPolyline(q, line));
        d[j * nx + i] = best;
      }
    pathGrid = { minX, minZ, nx, nz, d };
  }
  const g = pathGrid;
  const u = (p.x - g.minX) / PATH_GRID;
  const v = (p.z - g.minZ) / PATH_GRID;
  const i = Math.floor(u);
  const j = Math.floor(v);
  if (i < 0 || j < 0 || i >= g.nx - 1 || j >= g.nz - 1) return cap;
  const s = u - i;
  const t = v - j;
  const at = (di: number, dj: number) => g.d[(j + dj) * g.nx + i + di];
  return Math.min(cap, (at(0, 0) * (1 - s) + at(1, 0) * s) * (1 - t) + (at(0, 1) * (1 - s) + at(1, 1) * s) * t);
}

/** La hauteur des collines en `p`, à `d` unités de l'eau (rien sur l'eau ni près des chemins et des lieux). */
function hillsAt(p: Vec2, d: number): number {
  const H = HILLS;
  let w = smoothstep(H.coast[0], H.coast[1], d);
  if (w <= 0) return 0;
  w *= smoothstep(H.strait[0], H.strait[1], straitClearance(p));
  if (w <= 0) return 0;
  let place = Infinity;
  for (const pl of PLACES) place = Math.min(place, distance(p, pl.center));
  w *= smoothstep(H.place[0], H.place[1], place);
  if (w <= 0) return 0;
  w *= smoothstep(H.path[0], H.path[1], pathDistance(p, H.path[1]));
  if (w <= 0) return 0;
  const ci = Math.floor(p.x / H.cell);
  const cj = Math.floor(p.z / H.cell);
  let h = 0;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const i = ci + di;
      const j = cj + dj;
      const cx = (i + 0.2 + 0.6 * hash2(i, j)) * H.cell;
      const cz = (j + 0.2 + 0.6 * hash2(j + 101, i)) * H.cell;
      const r = H.radius[0] + (H.radius[1] - H.radius[0]) * hash2(i + 7, j + 13);
      const t = Math.hypot(p.x - cx, p.z - cz) / r;
      if (t >= 1) continue;
      const top = H.height[0] + (H.height[1] - H.height[0]) * hash2(i + 31, j + 57);
      // Une colline ronde : pentes droites, sommet adouci (les facettes y font les aplats de la planche).
      h = Math.max(h, top * (1 - smoothstep(0.12, 1, t)));
    }
  return h * w;
}

/** La hauteur du sol sans la rampe de la Vigie. */
function groundHeight(p: Vec2): number {
  // Loin de la côte, le large : la distance à la terre y dépasse celle à la boîte de la côte.
  if (outsideCoastBox(p) > 4) return DEEP;
  const d = landDistance(p);
  if (d < 0) return -0.35 + Math.max(d, -4) * 0.3;
  // La plage, puis l'herbe qui monte doucement vers l'intérieur.
  let h = 0.2 + 0.25 * smoothstep(0, BEACH, d) + 0.1 * Math.max(0, Math.min(d, 24) - BEACH);
  // Des bosses douces, pour que les facettes accrochent la lumière (jamais sur la plage)…
  const bumps = Math.sin(p.x * 0.45) * Math.cos(p.z * 0.38) + 0.5 * Math.sin(p.x * 0.9 + p.z * 0.7);
  h += 0.35 * bumps * smoothstep(BEACH, BEACH + 3, d);
  // … et de longues ondulations, qu'on monte et qu'on descend en marchant.
  h += 1.1 * Math.sin(p.x * 0.07 + 1.3) * Math.cos(p.z * 0.09 - 0.4) * smoothstep(BEACH, BEACH + 14, d);
  // Les collines (GD-20, point 3, lot 3 : un relief plus marqué, des silhouettes) : loin des chemins, des lieux, de la
  // côte et des bras de mer ; les chemins passent entre elles.
  h += hillsAt(p, d);
  // Les rives rocheuses des bras de mer : la levée, jamais plus bas que le sol d'avant ; avant les replats, qui ne
  // bougent pas (aucun bras de mer n'entre dans un replat ni dans son fondu).
  const s = straitClearance(p);
  if (s < STRAIT_BANK.fade) h = Math.max(h, bankHeight(p, s));
  // La falaise du nord : un plateau au-dessus, aux bords raides.
  h += CLIFF_HEIGHT * smoothstep(0, CLIFF_EDGE, signedDistance(p, CLIFF));
  // Le haut pays de l'est : une colline ronde, que la rivière entaille.
  const u = distance(p, UPLAND.center) / UPLAND.radius;
  h += UPLAND.height * smoothstep(1, 0.25, u) * smoothstep(0, 6, d);
  // Le palier de la porte des Écluses (relecture du lot 1) : aplani dans la pente de la vallée.
  const palier = smoothstep(ECLUSES_LANDING.radius + ECLUSES_LANDING.fade, ECLUSES_LANDING.radius, distance(p, ECLUSES_LANDING.center));
  if (palier > 0) h += (ECLUSES_LANDING.height - h) * palier;
  // Le replat de la Turbine (lot L6a) : aplani, puis le sol d'avant, en pente douce (loin de la rivière).
  const replat = smoothstep(ENGINE_FLAT.radius + ENGINE_FLAT.fade, ENGINE_FLAT.radius, distance(p, ENGINE_FLAT.center));
  if (replat > 0) h += (ENGINE_FLAT.height - h) * replat;
  // La vasière de la Mangrove (lot L8a) : aplanie bas, puis le sol d'avant ; au bord de l'eau, elle descend encore comme
  // la plage.
  h = lowShore(h, d, p, MANGROVE_FLAT);
  // La rive basse des Ruines (lot L8b), de même.
  h = lowShore(h, d, p, RUINS_FLAT);
  // Le tertre de l'Observatoire (lot L8c) : aplani, puis le sol d'avant, qui descend vers la grève.
  const tertre = smoothstep(OBSERVATORY_FLAT.radius + OBSERVATORY_FLAT.fade, OBSERVATORY_FLAT.radius, distance(p, OBSERVATORY_FLAT.center));
  if (tertre > 0) h += (OBSERVATORY_FLAT.height - h) * tertre;
  // Le replat de la Halle (lot L8d) : aplani, puis le sol d'avant, du village à la grève.
  const halle = smoothstep(COMMONS_FLAT.radius + COMMONS_FLAT.fade, COMMONS_FLAT.radius, distance(p, COMMONS_FLAT.center));
  if (halle > 0) h += (COMMONS_FLAT.height - h) * halle;
  // Le replat des Balises (lot L9a) : aplani, puis le sol d'avant, seulement loin de l'eau (la grève de la passe et de la
  // côte ouest descend comme la plage).
  const balises = smoothstep(BEACONS_FLAT.radius + BEACONS_FLAT.fade, BEACONS_FLAT.radius, distance(p, BEACONS_FLAT.center)) * smoothstep(0, 2, d);
  if (balises > 0) h += (BEACONS_FLAT.height - h) * balises;
  // La cour de l'Imprimerie et le parvis des Archives (lot L7) : aplanis, puis le sol d'avant, en pente douce.
  for (const f of NORTH_FLATS) {
    const k = smoothstep(f.radius + f.fade, f.radius, distance(p, f.center)) * smoothstep(0, 2, d);
    if (k > 0) h += (f.height - h) * k;
  }
  // Les grèves des Marais salants (lot L5) et du Chantier naval (lot L6b) : aplanies, puis le sol d'avant, en pente
  // douce ; au bord de l'eau, elles descendent encore comme la plage. Elles ne se touchent pas.
  for (const g of GREVES) {
    const flat = smoothstep(g.radius + g.fade, g.radius, distance(p, g.center));
    if (flat <= 0) continue;
    const level = Math.min(g.height, 0.2 + (g.height - 0.2) * smoothstep(0, BEACH, d));
    h += (level - h) * flat;
  }
  return h;
}

/** Les grèves aplanies au bord de l'eau (`heightAt`). */
const GREVES = [SALT_FLAT, SHIPYARD_FLAT] as const;

/**
 * Un rivage aplani bas (la vasière de la Mangrove, lot L8a ; la rive basse des Ruines, lot L8b) : la hauteur `h` ramenée
 * à `flat.height` dans son rayon, puis à elle-même sur `fade` unités ; à `d` unités du bord de l'eau, jamais plus haut
 * que la plage (elle descend encore vers l'eau). Le poids ne dépend que de la distance au centre, jamais de `d` : la
 * fonction ne sait pas où est l'eau. C'est `heightAt` qui ne l'appelle que sur la terre (il rend le fond de l'eau
 * avant) ; et la rive ne bouge pas, puisque `landDistance` vient du tracé de la côte, jamais des hauteurs.
 */
function lowShore(h: number, d: number, p: Vec2, flat: { center: Vec2; radius: number; fade: number; height: number }): number {
  const w = smoothstep(flat.radius + flat.fade, flat.radius, distance(p, flat.center));
  if (w <= 0) return h;
  const level = Math.min(flat.height, 0.2 + (flat.height - 0.2) * smoothstep(0, BEACH, d));
  return h + (level - h) * w;
}

/** La carte de hauteurs : une grille régulière sur l'étendue du terrain. */
export interface HeightField {
  minX: number;
  minZ: number;
  step: number;
  /** Nombre de sommets en x et en z. */
  nx: number;
  nz: number;
  heights: Float32Array;
  /**
   * Les hauteurs du terrain de loin (une case sur `TERRAIN.coarse`), aux mêmes rangs : celles du sol, abaissées sous les
   * chemins (`farHeights`) ; seuls les sommets de la grille grossière servent.
   */
  far: Float32Array;
}

let fieldCache: HeightField | null = null;

/** Tire la carte de hauteurs du plan (une fois : le plan ne change pas). */
export function buildHeightField(): HeightField {
  if (fieldCache) return fieldCache;
  const { minX, minZ, step, tileCells, tilesX, tilesZ } = TERRAIN;
  const nx = tilesX * tileCells + 1;
  const nz = tilesZ * tileCells + 1;
  const heights = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) heights[j * nx + i] = heightAt({ x: minX + i * step, z: minZ + j * step });
  const field = { minX, minZ, step, nx, nz, heights, far: heights };
  fieldCache = { ...field, far: farHeights(field) };
  return fieldCache;
}

/** Le dessus d'un chemin, au-dessus du sol sur sa ligne (`RIBBON_LIFT` de ./paths.ts), et l'air gardé sous lui de loin. */
const PATH_TOP = 0.06;
const FAR_CLEAR = 0.03;

/**
 * Le terrain de loin ne cache jamais les chemins (décision du directeur artistique, 17 octobre 2026 : ils restent continus
 * à toute distance). Ses triangles, trois fois plus grands, passent par endroits au-dessus du sol exact, où sont posés
 * les rubans des chemins (de 0,36 au plus) : de loin, un chemin s'y enterrait par tronçons. Chaque sommet de la grille
 * grossière dont un triangle couvre un point d'un chemin (sa ligne, et à 0,4 de part et d'autre) trop haut descend
 * d'autant, sous le dessus du ruban ; de loin, l'écart ne se voit pas, et la jupe des tuiles de près bouche la marche.
 */
function farHeights(f: HeightField): Float32Array {
  const out = new Float32Array(f.heights);
  const k = TERRAIN.coarse;
  const cs = f.step * k;
  const ci = Math.floor((f.nx - 1) / k);
  const cj = Math.floor((f.nz - 1) / k);
  const nodes = new Map(PATH_NODES.map((n) => [n.id, n.at]));
  // L'abaissement voulu à chaque sommet grossier (rang fin), le plus grand demandé.
  const drop = new Float32Array(out.length);
  const fine = (x: number, z: number) => heightOnMesh(f, x, z);
  for (const [ia, ib] of PATH_EDGES) {
    const a = nodes.get(ia)!;
    const c = nodes.get(ib)!;
    const len = distance(a, c) || 1e-6;
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    const n = Math.max(1, Math.ceil(len / 0.2));
    for (let q = 0; q <= n; q++) {
      const lx = a.x + dx * ((len * q) / n);
      const lz = a.z + dz * ((len * q) / n);
      const top = standingHeight(fine(lx, lz)) + PATH_TOP - FAR_CLEAR;
      for (const o of [-0.4, 0, 0.4]) {
        const x = lx + dz * o;
        const z = lz - dx * o;
        const u = (x - f.minX) / cs;
        const v = (z - f.minZ) / cs;
        const i = Math.floor(u);
        const j = Math.floor(v);
        if (i < 0 || j < 0 || i >= ci || j >= cj) continue;
        // Là où le sol exact passe déjà au-dessus du ruban (le flanc d'une pente), il le cache aussi de près.
        const want = Math.max(top, fine(x, z));
        const excess = farAt(out, f.nx, k, i, j, u - i, v - j) - want;
        if (excess <= 0) continue;
        for (const [di, dj] of CELL_CORNERS) {
          const r = (j + dj) * k * f.nx + (i + di) * k;
          drop[r] = Math.max(drop[r], excess);
        }
      }
    }
  }
  for (let r = 0; r < out.length; r++) out[r] -= drop[r];
  return out;
}

/** Les quatre coins d'une case. */
const CELL_CORNERS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
] as const;

/** La hauteur du terrain de loin dans la case grossière (`i`, `j`), à (`s`, `t`) dans la case : ses deux triangles en damier. */
function farAt(h: Float32Array, nx: number, k: number, i: number, j: number, s: number, t: number): number {
  const at = (di: number, dj: number) => h[(j + dj) * k * nx + (i + di) * k];
  const h00 = at(0, 0);
  const h10 = at(1, 0);
  const h01 = at(0, 1);
  const h11 = at(1, 1);
  if (!flipped(i, j)) return s >= t ? h00 + s * (h10 - h00) + t * (h11 - h10) : h00 + t * (h01 - h00) + s * (h11 - h01);
  return s + t <= 1 ? h00 + s * (h10 - h00) + t * (h01 - h00) : h11 + (1 - s) * (h01 - h11) + (1 - t) * (h10 - h11);
}

/** La hauteur du sol dessiné de loin en (x, z) : sur le triangle de la case grossière qui contient le point. */
export function heightOnFar(f: HeightField, x: number, z: number): number {
  const k = TERRAIN.coarse;
  const u = (x - f.minX) / (f.step * k);
  const v = (z - f.minZ) / (f.step * k);
  const i = Math.floor(u);
  const j = Math.floor(v);
  if (i < 0 || j < 0 || (i + 1) * k >= f.nx || (j + 1) * k >= f.nz) return heightAt({ x, z });
  return farAt(f.far, f.nx, k, i, j, u - i, v - j);
}

const at = (f: HeightField, i: number, j: number) => f.heights[j * f.nx + i];

/** La diagonale d'une case alterne, en damier : les facettes ne s'alignent pas toutes. */
const flipped = (i: number, j: number) => (i + j) % 2 === 1;

/**
 * La hauteur du sol dessiné de près en (x, z) : sur le triangle de la case qui contient le point, exactement comme la
 * tuile (les pieds de Kéo s'y posent, jamais dedans ni au-dessus). Hors de la grille, la hauteur du plan.
 */
export function heightOnMesh(f: HeightField, x: number, z: number): number {
  const u = (x - f.minX) / f.step;
  const v = (z - f.minZ) / f.step;
  const i = Math.floor(u);
  const j = Math.floor(v);
  if (i < 0 || j < 0 || i >= f.nx - 1 || j >= f.nz - 1) return heightAt({ x, z });
  const s = u - i;
  const t = v - j;
  const h00 = at(f, i, j);
  const h10 = at(f, i + 1, j);
  const h01 = at(f, i, j + 1);
  const h11 = at(f, i + 1, j + 1);
  if (!flipped(i, j)) {
    // Diagonale de (0,0) à (1,1).
    return s >= t ? h00 + s * (h10 - h00) + t * (h11 - h10) : h00 + t * (h01 - h00) + s * (h11 - h01);
  }
  // Diagonale de (1,0) à (0,1).
  return s + t <= 1 ? h00 + s * (h10 - h00) + t * (h01 - h00) : h11 + (1 - s) * (h01 - h11) + (1 - t) * (h10 - h11);
}

/**
 * La hauteur où l'on se tient : le sol, ou le dessus de la digue et des pontons quand le sol est sous l'eau (Kéo, les
 * chemins, le pied des lieux).
 */
export function standingHeight(ground: number): number {
  return Math.max(ground, DECK_HEIGHT);
}

/** Sous ce niveau, une case est sous l'eau : la mer la cache, elle n'est pas dessinée. */
const HIDDEN_BELOW = -0.12;

type P3 = [number, number, number];

/**
 * La grève des Marais salants (relecture du lot L5, directeur artistique) : de la vase claire sous les bassins et autour,
 * jusqu'à `inner` unités du centre de la grève plate, puis fondue vers l'herbe sur `fade` unités, en trois aplats
 * concentriques (la vase, une herbe rase sur le sable, l'herbe ; plus aucun hasard depuis le lot 3 de GD-20, point 3).
 */
const GREVE = { inner: 8, fade: 4, mud: 0xc8c2aa, sparse: 0xa9b979 } as const;

/**
 * La grève du Chantier naval (lot L6b, directeur artistique) : le sable tassé du chantier (#DAA66A, plus brun que le sable
 * chaud des plages), sous la cale, la coque et l'atelier, puis fondu vers l'herbe de même.
 */
const SHIPYARD_GREVE = { inner: 6.5, fade: 3.5, mud: 0xdaa66a, sparse: 0xb3ad68 } as const;

/** Les grèves colorées : leur centre, et leurs couleurs. */
const GREVE_COLORS = [
  { center: SALT_FLAT.center, ...GREVE },
  { center: SHIPYARD_FLAT.center, ...SHIPYARD_GREVE },
] as const;

/**
 * Le sol en aplats francs (GD-20, point 3, lot 3, deuxième levier graphique ; le mainteneur : « une couleur par facette,
 * 4-6 aplats », jamais de texture) : chaque facette prend l'un de six aplats, selon sa pente, son altitude et son
 * orientation, sans aucun tirage au hasard. Le sable au rivage ; l'herbe basse, la prairie claire des bas ; l'herbe des
 * hauteurs ; la pente, le Vert île du pack (#438B82), sur les flancs à l'ombre ; la roche, grise, sur ce qui est raide et
 * aux rives des bras de mer. Les couleurs sont celles de la matière ; la lumière (./sky.ts) les éclaire.
 */
const GROUND_TONES = {
  /** Le sable au rivage (les plages, le bord de l'eau). */
  sand: COLORS_6E.sand,
  /** Le sable mouillé, au ras de l'eau. */
  wetSand: COLORS_6E.wetSand,
  /** La prairie des bas, la plus claire. */
  low: COLORS_6E.grass,
  /** L'herbe à mi-hauteur, et les pentes douces tournées vers le soleil. */
  mid: 0x6cc28b,
  /** Les hauteurs (au-dessus de `HIGH_FROM`) et le plateau de la falaise nord. */
  high: 0x58ab7f,
  /** Les flancs à l'ombre : le Vert île. */
  slope: 0x438b82,
  /** La roche. */
  rock: COLORS_6E.rock,
} as const;

/** Les seuils des aplats : la pente (la part verticale de la normale) et l'altitude. */
const TONE = { rock: 0.62, slope: 0.86, midFrom: 2.2, highFrom: 5, sand: 2 } as const;

/** Le sens d'où vient le soleil, à plat (l'opposé des ombres peintes, ./sky.ts) : un flanc qui le regarde est au soleil. */
const SUN_FLAT = { x: -SHADOW_DIR.x, z: -SHADOW_DIR.z } as const;

/** La couleur d'un sol presque plat en (x, z), à la hauteur `h` : le sable près de l'eau, l'herbe ailleurs selon l'altitude. */
function flatColor(x: number, z: number, h: number): number {
  // Les rives des bras de mer : de la roche, jamais de sable.
  if (straitClearance({ x, z }) < STRAIT_BANK.rock) return GROUND_TONES.rock;
  if (h < 0.12) return GROUND_TONES.wetSand;
  const d = landDistance({ x, z });
  if (d < TONE.sand && h < 1.2) return GROUND_TONES.sand;
  for (const g of GREVE_COLORS) {
    const u = (distance({ x, z }, g.center) - g.inner) / g.fade;
    if (u < 1) return u < 0.33 ? g.mud : u < 0.66 ? g.sparse : GROUND_TONES.low;
  }
  if (signedDistance({ x, z }, CLIFF) > 0.6) return GROUND_TONES.high;
  return h < TONE.midFrom ? GROUND_TONES.low : h < TONE.highFrom ? GROUND_TONES.mid : GROUND_TONES.high;
}

/**
 * La couleur d'une facette : la roche si elle est raide ; sur une pente, le Vert île à l'ombre, l'herbe à mi-hauteur au
 * soleil ; sinon celle du sol à son centre.
 */
function facetColor(a: P3, b: P3, c: P3): number {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  const up = Math.abs(ny) / len;
  if (up < TONE.rock) return GROUND_TONES.rock;
  const x = (a[0] + b[0] + c[0]) / 3;
  const z = (a[2] + b[2] + c[2]) / 3;
  const h = (a[1] + b[1] + c[1]) / 3;
  const flat = flatColor(x, z, h);
  if (up >= TONE.slope || (flat !== GROUND_TONES.low && flat !== GROUND_TONES.mid && flat !== GROUND_TONES.high)) return flat;
  // La normale tournée vers le haut (le sens des triangles varie) : son côté au soleil ou à l'ombre.
  const sign = ny < 0 ? -1 : 1;
  const sunny = (sign * (nx * SUN_FLAT.x + nz * SUN_FLAT.z)) / len > 0.12;
  return sunny ? GROUND_TONES.mid : GROUND_TONES.slope;
}

/** La couleur du sol en (x, z) à la hauteur `h`, à plat (les ombres peintes la reprennent, plus sombre). */
export function groundTone(x: number, z: number, h: number): number {
  return flatColor(x, z, h);
}

/**
 * L'écume au rivage (GD-20, point 3, lot 3, cinquième levier graphique) : des bandes blanches à plat sur l'eau, le long
 * de la ligne où le sol dessiné passe sous l'eau (dans chaque facette qu'elle traverse) : une bande pleine contre le
 * rivage (`width`), puis, après `gap`, une bande plus fine (`outer`). Plus larges de loin, où les cases sont trois fois
 * plus grandes. Rien ne bouge (« Réduire les animations » n'a rien à arrêter).
 */
export const FOAM = { lift: 0.035, width: 0.3, gap: 0.4, outer: 0.16, far: 1.8, color: 0xf2f4ee } as const;

/** Le point où l'arête (p, q) passe le niveau de l'eau, ou rien. */
const waterCross = (p: P3, q: P3): [number, number] | null => {
  if (p[1] > 0 === q[1] > 0) return null;
  const t = p[1] / (p[1] - q[1]);
  return [p[0] + t * (q[0] - p[0]), p[2] + t * (q[2] - p[2])];
};

/** Les bandes d'écume d'une facette (a, b, c), ou leur seul nombre de triangles (sans `out`). */
function foam(a: P3, b: P3, c: P3, detail: TileDetail, out: FacetBuilder | null): number {
  const cuts = [waterCross(a, b), waterCross(b, c), waterCross(c, a)].filter((x): x is [number, number] => x !== null);
  if (cuts.length !== 2) return 0;
  // Vers le large : la pente de la facette, à plat, vers le bas.
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  if (ny < 0) {
    nx = -nx;
    nz = -nz;
  }
  const l = Math.hypot(nx, nz);
  if (l < 1e-9) return 0;
  const dx = nx / l, dz = nz / l;
  const k = detail === 'far' ? FOAM.far : 1;
  const bands: [number, number][] = [
    [0, FOAM.width * k],
    [(FOAM.width + FOAM.gap) * k, (FOAM.width + FOAM.gap + FOAM.outer) * k],
  ];
  if (!out) return 2 * bands.length;
  const [p, q] = cuts;
  // Tournée vers le ciel : (p, p + w, q + w, q) dans un sens, ou l'inverse.
  const ccw = (q[0] - p[0]) * dz - (q[1] - p[1]) * dx > 0;
  const y = FOAM.lift;
  for (const [from, to] of bands) {
    const p0: P3 = [p[0] + dx * from, y, p[1] + dz * from];
    const q0: P3 = [q[0] + dx * from, y, q[1] + dz * from];
    const p1: P3 = [p[0] + dx * to, y, p[1] + dz * to];
    const q1: P3 = [q[0] + dx * to, y, q[1] + dz * to];
    if (ccw) out.quad(p0, p1, q1, q0, FOAM.color);
    else out.quad(q0, q1, p1, p0, FOAM.color);
  }
  return 2 * bands.length;
}

/** Les deux niveaux de détail d'une tuile : chaque case (de près), ou une sur `TERRAIN.coarse` en chaque sens (de loin). */
export type TileDetail = 'near' | 'far';

/** Le côté d'une tuile, en unités. */
export const TILE_SIZE = TERRAIN.step * TERRAIN.tileCells;

/** La jupe sous le bord d'une tuile : elle bouche la fente entre une tuile de près et sa voisine de loin. */
const SKIRT_DEPTH = 1.2;

/**
 * Les facettes d'une tuile, ou leur seul nombre (sans `b`, rien n'est construit) : ses cases au niveau de détail
 * `detail`, sans celles qui sont sous l'eau, et une jupe sur son pourtour.
 */
export function drawTile(f: HeightField, tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
  const k = detail === 'near' ? 1 : TERRAIN.coarse;
  const n = TERRAIN.tileCells;
  const i0 = tx * n, j0 = tz * n;
  const h = detail === 'near' ? f.heights : f.far;
  const p = (i: number, j: number): P3 => [f.minX + i * f.step, h[j * f.nx + i], f.minZ + j * f.step];
  let count = 0;
  for (let j = j0; j < j0 + n; j += k)
    for (let i = i0; i < i0 + n; i += k) {
      const p00 = p(i, j), p10 = p(i + k, j), p01 = p(i, j + k), p11 = p(i + k, j + k);
      const tris: [P3, P3, P3][] = flipped(i / k, j / k)
        ? [[p00, p01, p10], [p11, p10, p01]]
        : [[p00, p11, p10], [p00, p01, p11]];
      for (const [a, bb, c] of tris) {
        // L'écume au rivage (lot 3), même sous une facette noyée : là où le sol passe sous l'eau.
        count += foam(a, bb, c, detail, b);
        if (Math.max(a[1], bb[1], c[1]) < HIDDEN_BELOW) continue;
        count++;
        b?.triangle(a, bb, c, facetColor(a, bb, c));
      }
    }
  // La jupe : le long des quatre bords, un pan vertical tourné vers le dehors.
  const edges: { from: [number, number]; di: number; dj: number; out: [number, number] }[] = [
    { from: [i0, j0], di: k, dj: 0, out: [0, -1] },
    { from: [i0 + n, j0], di: 0, dj: k, out: [1, 0] },
    { from: [i0 + n, j0 + n], di: -k, dj: 0, out: [0, 1] },
    { from: [i0, j0 + n], di: 0, dj: -k, out: [-1, 0] },
  ];
  for (const e of edges)
    for (let s = 0; s < n; s += k) {
      const ia = e.from[0] + (e.di / k) * s, ja = e.from[1] + (e.dj / k) * s;
      const a = p(ia, ja), c = p(ia + e.di, ja + e.dj);
      if (Math.max(a[1], c[1]) < HIDDEN_BELOW) continue;
      count += 2;
      if (!b) continue;
      const ad: P3 = [a[0], a[1] - SKIRT_DEPTH, a[2]];
      const cd: P3 = [c[0], c[1] - SKIRT_DEPTH, c[2]];
      // Le pan (a, c, c bas, a bas) regarde vers (dz, 0, −dx) : on le retourne s'il regarde vers le dedans.
      const dx = c[0] - a[0], dz = c[2] - a[2];
      const outward = dz * e.out[0] - dx * e.out[1] > 0;
      const color = flatColor((a[0] + c[0]) / 2, (a[2] + c[2]) / 2, (a[1] + c[1]) / 2);
      if (outward) b.quad(a, c, cd, ad, color);
      else b.quad(c, a, ad, cd, color);
    }
  return count;
}

/** Le rang d'une tuile dans la grille des tuiles (ligne par ligne, du nord au sud). */
const tileIndex = (tx: number, tz: number): number => tz * TERRAIN.tilesX + tx;

/** Les facettes d'une tuile à un niveau de détail. */
export function tileFacets(f: HeightField, tx: number, tz: number, detail: TileDetail): Facets {
  const b = new FacetBuilder();
  drawTile(f, tx, tz, detail, b);
  return b.build();
}

/** Le nombre de triangles de chaque tuile à un niveau de détail, par rang (calculé sans rien construire). */
export function tileTriangleCounts(f: HeightField, detail: TileDetail): Int32Array {
  const out = new Int32Array(TERRAIN.tilesX * TERRAIN.tilesZ);
  for (let tz = 0; tz < TERRAIN.tilesZ; tz++) for (let tx = 0; tx < TERRAIN.tilesX; tx++) out[tileIndex(tx, tz)] = drawTile(f, tx, tz, detail, null);
  return out;
}

/** La boîte d'une tuile au sol. */
export function tileRect(tx: number, tz: number): { minX: number; minZ: number; maxX: number; maxZ: number } {
  const minX = TERRAIN.minX + tx * TILE_SIZE;
  const minZ = TERRAIN.minZ + tz * TILE_SIZE;
  return { minX, minZ, maxX: minX + TILE_SIZE, maxZ: minZ + TILE_SIZE };
}

/**
 * Les anneaux : de près (`near`), les tuiles à moins de tant d'unités de Kéo, chaque case dessinée ; de loin (`far`),
 * celles jusqu'au bout de la brume, une case sur trois ; au-delà, rien. Rien non plus derrière la caméra (au sud de Kéo
 * de plus de `behind`) : elle regarde toujours vers le nord.
 */
export const RING = { near: 22, behind: 14 } as const;

/** Les tuiles de chaque anneau autour du point `focus` (des rangs, dans l'ordre de la grille), jusqu'à `far` unités. */
export function tileRings(focus: Vec2, far: number): { near: number[]; far: number[] } {
  const out = { near: [] as number[], far: [] as number[] };
  for (let tz = 0; tz < TERRAIN.tilesZ; tz++)
    for (let tx = 0; tx < TERRAIN.tilesX; tx++) {
      const r = tileRect(tx, tz);
      if (r.minZ > focus.z + RING.behind) continue;
      const dx = Math.max(r.minX - focus.x, 0, focus.x - r.maxX);
      const dz = Math.max(r.minZ - focus.z, 0, focus.z - r.maxZ);
      const d = Math.hypot(dx, dz);
      if (d <= RING.near) out.near.push(tileIndex(tx, tz));
      else if (d <= far) out.far.push(tileIndex(tx, tz));
    }
  return out;
}

/**
 * L'anneau clair sous Kéo flotte de si peu au-dessus de ce qu'il couvre (le sol, le dessus des rubans des chemins) ;
 * chaque sommet prend le plus haut de ce qui l'entoure à tant d'unités (plus que la moitié d'un pas de l'anneau) : un
 * pas qui enjambe le bord d'un chemin passe dessus, jamais dessous.
 */
export const RING_LIFT = 0.04;
const RING_REACH = 0.3;
/**
 * Il épouse une montée, mais ne plonge jamais d'une marche (directeur artistique, relecture du lot 2 : au bord d'un chemin
 * surélevé, il faisait une jupe sur le flanc) : aucun sommet à plus de tant sous les pieds de Kéo ; au-dessus d'une
 * marche ou d'une descente, il flotte un peu.
 */
export const RING_FLOOR = -0.1;

/**
 * L'anneau clair sous Kéo épouse le sol (décision du directeur artistique, 17 octobre 2026 : aucune pente ne le coupe) :
 * la hauteur de chacun de ses sommets (`xz`, leurs écarts au centre deux à deux), écrite dans `out`, depuis les pieds de
 * Kéo (`feet`) en `cx`, `cz`, juste au-dessus de `surface` (le sol dessiné où l'on se tient, ou le dessus d'un chemin,
 * qui dépasse en travers d'une pente) ; sur des planches (Kéo plus haut que ce qu'il y a sous lui), à plat sous ses
 * pieds. Sans rien allouer : la vue l'appelle quand Kéo bouge.
 */
export function ringHeights(cx: number, cz: number, feet: number, xz: Float32Array, surface: (x: number, z: number) => number, out: Float32Array): void {
  const onPlanks = feet - surface(cx, cz) > 0.1;
  const r = RING_REACH;
  for (let i = 0; i < out.length; i++) {
    if (onPlanks) {
      out[i] = RING_LIFT;
      continue;
    }
    const x = cx + xz[2 * i];
    const z = cz + xz[2 * i + 1];
    out[i] = Math.max(RING_FLOOR, Math.max(surface(x, z), surface(x + r, z), surface(x - r, z), surface(x, z + r), surface(x, z - r)) - feet + RING_LIFT);
  }
}
