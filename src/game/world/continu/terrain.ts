// Le terrain du monde continu : une carte de hauteurs tirée du plan du 6e (./plan6e.ts), puis des tuiles de facettes
// en aplats (low poly d'Archipéo : une couleur par facette, sable, herbe, roche, haut de falaise). Ce qui est sous
// l'eau n'est pas dessiné : la mer le couvre. Piste 1, lot 1 : l'île agrandie est coupée en tuiles carrées à deux
// niveaux de détail (chaque case de près, une sur trois de loin), rassemblées par anneau autour de Kéo (`tileRings`) ;
// la brume cache ce qui est plus loin. Code pur : la vue (three/archipeo/) ne fait que donner ces tableaux à Three.js.
import { FacetBuilder, type Facets } from './facets';
import { SHADOW_DIR } from './sky';
import { distance, distanceToPolyline, hash2, signedDistance, smoothstep, type Vec2 } from './geometry';
import { BEACONS_FLAT, CLIFF, COAST, COLORS_6E, COMMONS_FLAT, DECK_HEIGHT, DETOUR_HILL, DETOUR_HILLS, DOCK, ECLUSES_LANDING, ENGINE_FLAT, ISLET, LAGOON, LOOKOUT_RAMP, MANGROVE_FLAT, NORTH_FLATS, OBSERVATORY_FLAT, PASS, PATH_EDGES, PATH_NODES, PLACES, RIVER, RIVER_MOUTH, RUINS_FLAT, SALT_FLAT, SHIPYARD_FLAT, STRAITS, TERRAIN, UPLAND, type DetourHill, type StraitId } from './plan6e';

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
 * Les collines (GD-20, point 3, lot 3, deuxième levier graphique ; reprise d'après la relecture du directeur artistique :
 * « de vraies collines de 4 à 8 de haut, à grandes facettes, loin des chemins ») : une colline par case d'un réseau de
 * `cell` unités (à la meilleure de `tries` places tirées dans la case), en pyramide à `sides` pans (5 à 7) et petit sommet plat (`top`, la part du rayon) : chaque pan est un
 * plan, ses facettes ont toutes la même normale et se lisent comme une seule grande facette, flanc au soleil ou flanc à
 * l'ombre. Sa place, son rayon, sa hauteur et son orientation viennent du hasard fixe de la case (`hash2`). Son rayon se
 * réduit pour que toute son emprise reste à `path` unités au moins d'un chemin, `place` du centre d'un lieu, `coast` de
 * l'eau et `strait` d'un bras de mer ; trop petite (`minRadius`), elle n'est pas posée. Les chemins, les replats, les
 * plages, les rives et la marche de Kéo restent ceux d'avant.
 */
export const HILLS = { cell: 26, radius: [11, 19], height: [4, 8], sides: [5, 7], top: 0.12, minRadius: 6, tries: 4, path: 3, place: 15, coast: BEACH + 2, strait: 7 } as const;

/** Une colline posée : son centre, son rayon, sa hauteur, son nombre de pans et l'angle du premier. */
interface Hill {
  x: number;
  z: number;
  r: number;
  h: number;
  sides: number;
  turn: number;
}

/** La colline de chaque case du réseau (ou rien), tirée une fois. */
const hillCache = new Map<number, Hill | null>();

/** La colline de la case (`i`, `j`), ou rien (trop près d'un chemin, d'un lieu, de l'eau). */
function hillOf(i: number, j: number): Hill | null {
  const key = (i + 500) * 1000 + j + 500;
  const known = hillCache.get(key);
  if (known !== undefined) return known;
  const H = HILLS;
  // Quelques places tirées dans la case : la colline prend celle où elle peut être la plus large.
  let c = { x: 0, z: 0 };
  let r = -Infinity;
  for (let k = 0; k < H.tries; k++) {
    const q = { x: (i + 0.1 + 0.8 * hash2(i + 59 * k, j)) * H.cell, z: (j + 0.1 + 0.8 * hash2(j + 101 + 37 * k, i)) * H.cell };
    let place = Infinity;
    for (const pl of PLACES) place = Math.min(place, distance(q, pl.center));
    const ramp = distanceToPolyline(q, [LOOKOUT_RAMP.from, LOOKOUT_RAMP.to]) - LOOKOUT_RAMP.halfWidth;
    const room = Math.min(pathDistance(q, 40) - H.path, ramp - H.path, place - H.place, landDistance(q) - H.coast, straitClearance(q) - H.strait);
    if (room > r) {
      r = room;
      c = q;
    }
  }
  r = Math.min(r, H.radius[0] + (H.radius[1] - H.radius[0]) * hash2(i + 7, j + 13));
  let hill: Hill | null = null;
  // Une colline de Détour a pris la place (plan6e.ts, `DETOUR_HILLS`) : pas de colline tirée qui la touche.
  const nearDetour = DETOUR_HILLS.some((d) => distance(c, d.at) < r + detourReach(d));
  if (r >= H.minRadius && !nearDetour) {
    // La hauteur suit le rayon gardé : une petite colline n'est jamais une aiguille.
    const t = hash2(i + 31, j + 57);
    const h = (H.height[0] + (H.height[1] - H.height[0]) * t) * Math.min(1, r / 10);
    const sides = H.sides[0] + Math.floor(hash2(i + 3, j + 211) * (H.sides[1] - H.sides[0] + 1));
    hill = { x: c.x, z: c.z, r, h, sides, turn: hash2(j + 17, i + 5) * 2 * Math.PI };
  }
  hillCache.set(key, hill);
  return hill;
}

/** La hauteur d'une colline en `p` : une pyramide à pans plans, son sommet aplati. */
function hillHeight(hl: Hill, p: Vec2): number {
  const dx = p.x - hl.x;
  const dz = p.z - hl.z;
  if (dx * dx + dz * dz >= hl.r * hl.r) return 0;
  // La distance « polygonale » au centre : le plus grand des pas vers chaque pan, rapporté à l'apothème.
  let t = 0;
  for (let k = 0; k < hl.sides; k++) {
    const a = hl.turn + (2 * Math.PI * k) / hl.sides;
    t = Math.max(t, dx * Math.cos(a) + dz * Math.sin(a));
  }
  t /= hl.r * Math.cos(Math.PI / hl.sides);
  if (t >= 1) return 0;
  return hl.h * Math.min(1, (1 - t) / (1 - HILLS.top));
}

/** La longueur de la rampe d'une colline de Détour, du centre de son plateau à son pied. */
const rampLength = (d: DetourHill): number => DETOUR_HILL.plateau + d.height / DETOUR_HILL.ramp;

/** Jusqu'où va une colline de Détour depuis le centre de son plateau (sa rampe, plus loin que ses falaises). */
export const detourReach = (d: DetourHill): number => Math.max(rampLength(d), (DETOUR_HILL.plateau + d.height / DETOUR_HILL.cliff) / Math.cos(Math.PI / 6)) + 0.5;

/** Le pied de la rampe d'une colline de Détour, là où elle rejoint le sol. */
export function detourFoot(d: DetourHill): Vec2 {
  const l = rampLength(d);
  return { x: d.at.x + Math.cos(d.face) * l, z: d.at.z + Math.sin(d.face) * l };
}

/**
 * La hauteur d'une colline de Détour en `p`, et la part de la colline sous lui : son plateau, sa rampe (la face douce) ou
 * une falaise. Le plateau et ses six pans en falaise font un tronc de pyramide ; la rampe, droite, prolonge le plateau
 * vers `face`, ses côtés en falaise.
 */
function detourHillAt(d: DetourHill, p: Vec2): { h: number; part: 'top' | 'ramp' | 'cliff' } | null {
  const dx = p.x - d.at.x;
  const dz = p.z - d.at.z;
  const reach = DETOUR_REACH.get(d) ?? detourReach(d);
  if (dx * dx + dz * dz >= reach * reach) return null;
  const { plateau, cliff, ramp, halfWidth } = DETOUR_HILL;
  let t = 0;
  for (let k = 0; k < 6; k++) {
    const a = d.face + (Math.PI * k) / 3;
    t = Math.max(t, dx * Math.cos(a) + dz * Math.sin(a));
  }
  const body = d.height - cliff * Math.max(0, t - plateau);
  const ux = Math.cos(d.face);
  const uz = Math.sin(d.face);
  const along = dx * ux + dz * uz;
  const lateral = Math.abs(dz * ux - dx * uz);
  const slope = along > plateau ? d.height - ramp * (along - plateau) - cliff * Math.max(0, lateral - halfWidth) : -Infinity;
  const h = Math.max(body, slope);
  if (h <= 0) return null;
  if (t <= plateau) return { h, part: 'top' };
  return { h, part: slope >= body && lateral <= halfWidth ? 'ramp' : 'cliff' };
}

/** La portée de chaque colline de Détour, calculée une fois (`heightAt` la lit à chaque point). */
const DETOUR_REACH = new Map(DETOUR_HILLS.map((d) => [d, detourReach(d)]));

/** Le haut de la normale d'une facette de rampe (sa pente, 0,45), moins une marge pour les facettes de la grille. */
const RAMP_UP = 1 / Math.hypot(1, DETOUR_HILL.ramp) - 0.025;

/** La colline de Détour la plus haute en `p`, et sa part, ou rien. */
function detourAt(p: Vec2): { h: number; part: 'top' | 'ramp' | 'cliff' } | null {
  let best: { h: number; part: 'top' | 'ramp' | 'cliff' } | null = null;
  for (const d of DETOUR_HILLS) {
    const o = detourHillAt(d, p);
    if (o && (!best || o.h > best.h)) best = o;
  }
  return best;
}

/**
 * Le pan de colline sous `p` regarde-t-il le soleil ? `null` hors d'une colline ou sur son sommet plat. Le pan, pas la
 * facette : toutes les facettes d'un pan prennent le même vert, même celles qu'une arête coupe.
 */
function hillSunny(p: Vec2, up: number): boolean | null {
  // La rampe d'un Détour, toujours du vert clair du soleil, d'où qu'elle regarde : la face qui se monte se lit de loin
  // (artiste technique 3D) ; son plateau prend le vert du sol. Une facette de la rampe plus raide qu'elle (au bord, à
  // cheval sur la falaise) prend le vert d'ombre de la falaise : des flancs d'un seul tenant, sans dents de scie
  // (directeur artistique).
  const detour = detourAt(p);
  if (detour && detour.h >= hillsAtRandom(p)) return detour.part === 'top' ? null : detour.part === 'ramp' && up >= RAMP_UP;
  const ci = Math.floor(p.x / HILLS.cell);
  const cj = Math.floor(p.z / HILLS.cell);
  let best = 0;
  let sunny: boolean | null = null;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const hl = hillOf(ci + di, cj + dj);
      if (!hl) continue;
      const h = hillHeight(hl, p);
      if (h <= best) continue;
      best = h;
      if (h >= hl.h - 1e-6) {
        sunny = null;
        continue;
      }
      let k0 = 0;
      let t = -Infinity;
      for (let k = 0; k < hl.sides; k++) {
        const a = hl.turn + (2 * Math.PI * k) / hl.sides;
        const v = (p.x - hl.x) * Math.cos(a) + (p.z - hl.z) * Math.sin(a);
        if (v > t) {
          t = v;
          k0 = k;
        }
      }
      const a = hl.turn + (2 * Math.PI * k0) / hl.sides;
      sunny = Math.cos(a) * SUN_FLAT.x + Math.sin(a) * SUN_FLAT.z > 0.12;
    }
  return sunny;
}

/** La hauteur des collines en `p` (rien sur l'eau ni près des chemins et des lieux), Détours compris. */
export function hillsAt(p: Vec2): number {
  return Math.max(hillsAtRandom(p), detourAt(p)?.h ?? 0);
}

/** La hauteur des collines tirées au hasard en `p`. */
function hillsAtRandom(p: Vec2): number {
  const ci = Math.floor(p.x / HILLS.cell);
  const cj = Math.floor(p.z / HILLS.cell);
  let h = 0;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const hl = hillOf(ci + di, cj + dj);
      if (hl) h = Math.max(h, hillHeight(hl, p));
    }
  return h;
}

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

/** La hauteur du sol sans la rampe de la Vigie. */
function groundHeight(p: Vec2): number {
  // Loin de la côte, le large : la distance à la terre y dépasse celle à la boîte de la côte.
  if (outsideCoastBox(p) > 4) return DEEP;
  const d = landDistance(p);
  // Sous l'eau : le sol descend sans marche depuis la plage (la ligne d'eau dessinée suit alors la côte, sans escalier ;
  // reprise du lot 3), puis vers le fond.
  if (d < 0) return d > -1 ? 0.2 + 0.55 * d : -0.35 + Math.max(d + 1, -4) * 0.3;
  // La plage, puis l'herbe qui monte doucement vers l'intérieur.
  let h = 0.2 + 0.25 * smoothstep(0, BEACH, d) + 0.1 * Math.max(0, Math.min(d, 24) - BEACH);
  // Les collines (GD-20, point 3, lot 3 : un relief marqué, des silhouettes) : loin des chemins, des lieux, de la côte
  // et des bras de mer ; les chemins passent entre elles. Sur elles, ni bosse ni ondulation : leurs pans restent plans.
  const hill = hillsAt(p);
  const plain = 1 - smoothstep(0, 0.6, hill);
  // Des bosses douces, pour que les facettes accrochent la lumière (jamais sur la plage)…
  const bumps = Math.sin(p.x * 0.45) * Math.cos(p.z * 0.38) + 0.5 * Math.sin(p.x * 0.9 + p.z * 0.7);
  h += 0.35 * bumps * smoothstep(BEACH, BEACH + 3, d) * plain;
  // … et de longues ondulations, qu'on monte et qu'on descend en marchant.
  h += 1.1 * Math.sin(p.x * 0.07 + 1.3) * Math.cos(p.z * 0.09 - 0.4) * smoothstep(BEACH, BEACH + 14, d);
  h += hill;
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
 * jusqu'à `inner` unités du centre de la grève plate, puis fondue vers l'herbe sur `fade` unités, en aplats concentriques
 * (`bands` : jusqu'où va chacun, en part du fondu ; plus aucun hasard depuis le lot 3 de GD-20, point 3). Depuis la
 * reprise de la scénette (directeur artistique, 18 octobre 2026 : « l'herbe verte en recul, de la grève et des dunes
 * jusqu'au bord du cadre »), la vase, puis le sable des dunes (#E2CD9E), puis une herbe rase, l'herbe à 24 unités.
 */
const GREVE = { inner: 8, fade: 16, bands: [[0.25, 0xc8c2aa], [0.75, 0xe2cd9e], [1, 0xa9b979]] } as const;

/**
 * La grève du Chantier naval (lot L6b, directeur artistique) : le sable tassé du chantier (#DAA66A, plus brun que le sable
 * chaud des plages), sous la cale, la coque et l'atelier, puis fondu vers l'herbe de même.
 */
const SHIPYARD_GREVE = { inner: 6.5, fade: 3.5, bands: [[0.33, 0xdaa66a], [0.66, 0xb3ad68]] } as const;

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
  mid: 0x72c98e,
  /** Les hauteurs (au-dessus de `HIGH_FROM`) et le plateau de la falaise nord. */
  high: 0x58ab7f,
  /** Les flancs à l'ombre : le Vert île. */
  slope: 0x438b82,
  /** Les flancs des collines au soleil : un vert clair et chaud, bien séparé de la prairie et du flanc à l'ombre. */
  sunny: 0xa8dc9a,
  /**
   * Les flancs des collines à l'ombre : le Vert île, à peine plus clair (il n'est éclairé que par le ciel). Deuxième
   * reprise du lot 3 (consultant Archipéo) : le soleil (#A8DC9A, avant #9CD296) et l'ombre (#468E83, avant #4C9688)
   * plus écartés, l'herbe à mi-hauteur un peu plus claire (#72C98E, avant #6CC28B) ; la prairie des bas ne bouge pas.
   */
  hillShade: 0x468e83,
  /** La roche. */
  rock: COLORS_6E.rock,
} as const;

/**
 * Les seuils des aplats : la pente (la part verticale de la normale) et l'altitude ; une facette est sur une colline au-dessus de
 * `hill` de sa hauteur, et prend le vert de son flanc tant qu'elle n'est pas plate (`hillFlat`, le petit sommet).
 */
const TONE = { rock: 0.62, slope: 0.86, midFrom: 2.2, highFrom: 5, sand: 2, hill: 0.4, hillFlat: 0.995 } as const;

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
    if (u < 1) return g.bands.find(([until]) => u < until)?.[1] ?? GROUND_TONES.low;
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
  // Sur une colline, chaque pan prend le vert de son flanc (au soleil, ou à l'ombre), même peu pentu.
  if (hillsAt({ x, z }) > TONE.hill && up < TONE.hillFlat && flat !== GROUND_TONES.rock) {
    const sunny = hillSunny({ x, z }, up);
    if (sunny !== null) return sunny ? GROUND_TONES.sunny : GROUND_TONES.hillShade;
  }
  if (up >= TONE.slope || (flat !== GROUND_TONES.low && flat !== GROUND_TONES.mid && flat !== GROUND_TONES.high)) return flat;
  // La pente lissée autour de la facette (lot commun des scénettes, directeur artistique : « plus de moucheture ») : sur
  // une petite bosse, ses triangles voisins regardaient tantôt le soleil, tantôt l'ombre, une teinte chacun au hasard de
  // leur sens ; ils prennent maintenant tous l'aplat du plan autour d'eux, et seules les vraies pentes passent au Vert île.
  const smooth = smoothNormal(x, z);
  if (smooth.up >= TONE.slope) return flat;
  return sunSide(smooth.nx, smooth.up, smooth.nz, 1) ? GROUND_TONES.mid : GROUND_TONES.slope;
}

/** Le pas de la pente lissée, en unités : plus large qu'une case du sol de près, pour qu'une bosse n'y compte pas. */
const SMOOTH_STEP = 2.5;

/** La normale du sol lissée en (x, z) : sa pente sur `SMOOTH_STEP` unités de part et d'autre, rendue unitaire. */
function smoothNormal(x: number, z: number): { nx: number; up: number; nz: number } {
  const gx = (heightAt({ x: x + SMOOTH_STEP, z }) - heightAt({ x: x - SMOOTH_STEP, z })) / (2 * SMOOTH_STEP);
  const gz = (heightAt({ x, z: z + SMOOTH_STEP }) - heightAt({ x, z: z - SMOOTH_STEP })) / (2 * SMOOTH_STEP);
  const len = Math.hypot(gx, 1, gz);
  return { nx: -gx / len, up: 1 / len, nz: -gz / len };
}

/** Une facette de normale (`nx`, `ny`, `nz`) regarde-t-elle le soleil ? La normale tournée vers le haut (le sens des triangles varie). */
function sunSide(nx: number, ny: number, nz: number, len: number): boolean {
  const sign = ny < 0 ? -1 : 1;
  return (sign * (nx * SUN_FLAT.x + nz * SUN_FLAT.z)) / len > 0.12;
}

/** La couleur du sol en (x, z) à la hauteur `h`, à plat (les ombres peintes la reprennent, plus sombre). */
export function groundTone(x: number, z: number, h: number): number {
  return flatColor(x, z, h);
}

/**
 * L'écume au rivage (GD-20, point 3, lot 3, cinquième levier graphique ; reprise : un seul liseré lissé) : une bande
 * blanche à plat sur l'eau, de `width` unités, le long de la ligne où le sol dessiné passe sous l'eau (dans chaque
 * facette qu'elle traverse). Chaque point de la ligne s'écarte vers le large selon la pente de la distance à la terre en
 * ce point, la même pour les deux facettes qui le partagent : la bande est continue, sans escalier de cases. Plus large
 * de loin, où les cases sont trois fois plus grandes. Rien ne bouge (« Réduire les animations » n'a rien à arrêter).
 */
export const FOAM = { lift: 0.035, width: 0.42, far: 1.8, color: 0xf2f4ee } as const;

/** Le point où l'arête (p, q) passe le niveau de l'eau, ou rien. */
const waterCross = (p: P3, q: P3): [number, number] | null => {
  if (p[1] > 0 === q[1] > 0) return null;
  const t = p[1] / (p[1] - q[1]);
  return [p[0] + t * (q[0] - p[0]), p[2] + t * (q[2] - p[2])];
};

/** Le sens du large en (x, z) : l'opposé de la pente de la distance à la terre, d'une unité. */
function seaward(x: number, z: number): [number, number] {
  const e = 0.35;
  const gx = landDistance({ x: x + e, z }) - landDistance({ x: x - e, z });
  const gz = landDistance({ x, z: z + e }) - landDistance({ x, z: z - e });
  const l = Math.hypot(gx, gz) || 1;
  return [-gx / l, -gz / l];
}

/** Un triangle à plat, tourné vers le ciel quel que soit l'ordre de ses sommets. */
function skyward(out: FacetBuilder, a: P3, b: P3, c: P3): void {
  if ((b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) >= 0) out.triangle(a, b, c, FOAM.color);
  else out.triangle(a, c, b, FOAM.color);
}

/** La bande d'écume d'une facette (a, b, c), ou son seul nombre de triangles (sans `out`). */
function foam(a: P3, b: P3, c: P3, detail: TileDetail, out: FacetBuilder | null): number {
  const cuts = [waterCross(a, b), waterCross(b, c), waterCross(c, a)].filter((x): x is [number, number] => x !== null);
  if (cuts.length !== 2) return 0;
  if (!out) return 2;
  const w = FOAM.width * (detail === 'far' ? FOAM.far : 1);
  const [p, q] = cuts;
  const [px, pz] = seaward(p[0], p[1]);
  const [qx, qz] = seaward(q[0], q[1]);
  const y = FOAM.lift;
  const p0: P3 = [p[0], y, p[1]];
  const q0: P3 = [q[0], y, q[1]];
  const p1: P3 = [p[0] + px * w, y, p[1] + pz * w];
  const q1: P3 = [q[0] + qx * w, y, q[1] + qz * w];
  // Deux triangles, chacun tourné vers le ciel.
  skyward(out, p0, p1, q1);
  skyward(out, p0, q1, q0);
  return 2;
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

/**
 * Les tuiles de chaque anneau autour du point `focus` (des rangs, dans l'ordre de la grille), jusqu'à `far` unités ;
 * rien de plus de `RING.behind` derrière Kéo, la caméra tournée de `yaw` (0 : vers le nord, derrière est le sud).
 */
export function tileRings(focus: Vec2, far: number, yaw = 0): { near: number[]; far: number[] } {
  const out = { near: [] as number[], far: [] as number[] };
  const bx = Math.sin(yaw);
  const bz = Math.cos(yaw);
  for (let tz = 0; tz < TERRAIN.tilesZ; tz++)
    for (let tx = 0; tx < TERRAIN.tilesX; tx++) {
      const r = tileRect(tx, tz);
      // Le coin de la tuile le moins derrière Kéo : s'il l'est encore de plus de `RING.behind`, la tuile ne se voit pas.
      const behind = ((bx > 0 ? r.minX : r.maxX) - focus.x) * bx + ((bz > 0 ? r.minZ : r.maxZ) - focus.z) * bz;
      if (behind > RING.behind) continue;
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
