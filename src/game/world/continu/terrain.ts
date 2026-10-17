// Le terrain du monde continu : une carte de hauteurs tirée du plan du 6e (./plan6e.ts), puis des tuiles de facettes
// en aplats (low poly d'Archipéo : une couleur par facette, sable, herbe, roche, haut de falaise). Ce qui est sous
// l'eau n'est pas dessiné : la mer le couvre. Piste 1, lot 1 : l'île agrandie est coupée en tuiles carrées à deux
// niveaux de détail (chaque case de près, une sur trois de loin), rassemblées par anneau autour de Kéo (`tileRings`) ;
// la brume cache ce qui est plus loin. Code pur : la vue (three/archipeo/) ne fait que donner ces tableaux à Three.js.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { BEACONS_FLAT, CLIFF, COAST, COLORS_6E, COMMONS_FLAT, DECK_HEIGHT, DOCK, ECLUSES_LANDING, ENGINE_FLAT, ISLET, LAGOON, LOOKOUT_RAMP, MANGROVE_FLAT, NORTH_FLATS, OBSERVATORY_FLAT, PASS, PATH_EDGES, PATH_NODES, RIVER, RIVER_MOUTH, RUINS_FLAT, SALT_FLAT, SHIPYARD_FLAT, STRAITS, TERRAIN, UPLAND, type StraitId } from './plan6e';

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
    const n = Math.max(1, Math.ceil(len / (f.step / 4)));
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
 * jusqu'à `inner` unités du centre de la grève plate, puis fondue vers l'herbe sur `fade` unités, case par case (une
 * herbe rase sur le sable entre les deux, tirée par le hasard fixe de chaque case : aucun dégradé, des aplats).
 */
const GREVE = { inner: 8, fade: 4, mud: 0xc8c2aa, sparse: 0xa9b979 } as const;

/**
 * La grève du Chantier naval (lot L6b, directeur artistique) : le sable tassé du chantier (#DAA66A, plus brun que le sable
 * chaud des plages), sous la cale, la coque et l'atelier, puis fondu vers l'herbe de même, case par case.
 */
const SHIPYARD_GREVE = { inner: 6.5, fade: 3.5, mud: 0xdaa66a, sparse: 0xb3ad68 } as const;

/** Les grèves colorées : leur centre, et leurs couleurs. */
const GREVE_COLORS = [
  { center: SALT_FLAT.center, ...GREVE },
  { center: SHIPYARD_FLAT.center, ...SHIPYARD_GREVE },
] as const;

/** La couleur d'un sol presque plat en (x, z), à la hauteur `h` : le sable près de l'eau, l'herbe ailleurs. */
function flatColor(x: number, z: number, h: number, vary: number): number {
  // Les rives des bras de mer : de la roche, jamais de sable.
  if (straitClearance({ x, z }) < STRAIT_BANK.rock) return COLORS_6E.rock;
  if (h < 0.12) return COLORS_6E.wetSand;
  const d = landDistance({ x, z });
  if (d < 1.3) return COLORS_6E.sand;
  for (const g of GREVE_COLORS) {
    const u = (distance({ x, z }, g.center) - g.inner) / g.fade + (vary - 0.5) * 0.5;
    if (u < 1) return u < 0.33 ? g.mud : u < 0.66 ? g.sparse : COLORS_6E.grass;
  }
  if (signedDistance({ x, z }, CLIFF) > 0.6) return COLORS_6E.cliffTop;
  return vary < 0.5 ? COLORS_6E.grass : 0x66b84a;
}

/** La couleur d'une facette : la roche si elle est raide, sinon celle du sol à son centre. */
function facetColor(a: P3, b: P3, c: P3, vary: number): number {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  const up = Math.abs(ny) / Math.hypot(nx, ny, nz);
  if (up < 0.62) return COLORS_6E.rock;
  return flatColor((a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3, (a[1] + b[1] + c[1]) / 3, vary);
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
function drawTile(f: HeightField, tx: number, tz: number, detail: TileDetail, b: FacetBuilder | null): number {
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
        if (Math.max(a[1], bb[1], c[1]) < HIDDEN_BELOW) continue;
        count++;
        b?.triangle(a, bb, c, facetColor(a, bb, c, hash2(i, j)));
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
      const color = flatColor((a[0] + c[0]) / 2, (a[2] + c[2]) / 2, (a[1] + c[1]) / 2, hash2(ia, ja));
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
