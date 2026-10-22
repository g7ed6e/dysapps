// Les ponts des terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre
// 2026) : un pont par bras de mer, sur la liaison du réseau qui le passe (./lands.ts, `bridgeEdge`). Avant : le chemin
// finit sur une culée de pierre, un départ d'arche brisé, deux moignons de piles debout dans l'eau, la culée jumelle en
// face ; Kéo s'arrête sur la culée, sans heurt ni son (`clampToOpen`). Après (ce lot : posé d'un coup) : pierre et bois,
// de la famille des quais de l'Escale (concept retenu, ligne 3) : les culées, trois ou quatre piles maçonnées, le tablier à
// 1,9 au-dessus de l'eau, ses garde-corps, une lanterne de chaque côté de chaque culée ; Kéo marche sur la pierre et
// sur le tablier (`bridgeFloor`). Tout entre dans le maillage des lieux, sans appel de plus ; sur la Carte, le pont se
// dessine aussi en trait double, distinct d'un chemin. Code pur.
import { FacetBuilder, boundsOf, mergeFacets, placeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { bridgeEdge, firstClosed, isLinkedLand, linkedLands, nodeLands, planOfLand, startLandOf, type LinkedLand } from './lands';
import { planFor, type LevelPlan, type OpenWorldLevel } from './levelPlan';
import { bridgeCut, pathNode, type NetworkPoint } from './paths';
import { CUT_CLEARANCE_4E, NETWORK_4E, isLand4e, passageCut4e } from './paths4e';
import { NETWORK_5E, isLand5e, passageCut } from './paths5e';
import { COLORS_4E, LINKS_4E } from './plan4e';
import { COLORS_5E, LINKS_5E } from './plan5e';
import type { StraitId } from './plan6e';
import { heightAt, standingHeight, straitClearance } from './terrain';
import { heightAt4e } from './terrain4e';
import { channelClearance, heightAt5e } from './terrain5e';

/**
 * Le pont (artiste technique 3D) : le dessus du tablier au-dessus de l'eau ; sa largeur ; le débord des culées sur l'eau ;
 * la demi-largeur des culées ; le bas de la pierre, sous l'eau ; l'épaisseur des planches ; l'écart des poteaux des
 * garde-corps, leur hauteur et leur écart à l'axe.
 */
export const BRIDGE = { deck: 1.9, width: 3.2, over: 0.5, abutHalf: 2.1, foot: -1.6, plank: 0.14, post: 1.7, rail: 1.0, railOut: 1.5 } as const;

/**
 * Les couleurs du pont : la pierre des quais de l'Escale, son dessus plus clair, le pied mouillé des piles et des
 * moignons plus sombre, leur cassure aussi ; le bois du tablier et des garde-corps ; les lanternes, leur fer et leur verre Sable.
 */
const C = {
  stone: 0xb9b2a3,
  stoneTop: 0xd8d1c2,
  pile: 0xa39b8c,
  wood: 0xa9784a,
  woodTop: 0xc6955f,
  rail: 0x8a5f3a,
  /** Les longerons sous le tablier, plus clairs que les garde-corps : vus d'en dessous, à l'ombre, jamais presque noirs (reprise du lot 3). */
  beam: 0xc79a68,
  wet: 0x958c7c,
  broken: 0x8a8273,
  iron: 0x3f4a50,
  glass: 0xdaa66a,
  /** Le verre d'une lanterne allumée, l'ocre des lieux du 4e, fixe (règle commune des ponts du 4e). */
  lit: COLORS_5E.lantern,
} as const;

/** La pierre d'un pont : ses flancs, son dessus, ses piles, leur pied mouillé, sa cassure. */
interface BridgeStone {
  stone: number;
  stoneTop: number;
  pile: number;
  wet: number;
  broken: number;
}

/** La pierre des ponts du 6e et du 5e : celle des quais de l'Escale. */
const STONE_6E: BridgeStone = { stone: C.stone, stoneTop: C.stoneTop, pile: C.pile, wet: C.wet, broken: C.broken };

/**
 * La pierre des ponts du 4e (retouche 1 du lot 1, directeur artistique) : la pierre grise des Passeurs du 4e, jamais la
 * pierre claire du 6e, qui faisait les points les plus clairs de l'image ; et le basalte de l'arche de la coulée.
 */
const STONE_4E: BridgeStone = { stone: COLORS_4E.stoneShade, stoneTop: COLORS_4E.stone, pile: 0x74695f, wet: 0x62574f, broken: 0x6c6058 };
const BASALT_4E: BridgeStone = { stone: COLORS_4E.basaltShade, stoneTop: COLORS_4E.basaltSun, pile: COLORS_4E.basalt, wet: COLORS_4E.crustShade, broken: COLORS_4E.crust };

/** Où Kéo s'arrête devant un pont pas encore rebâti : sur sa culée, à tant d'unités de l'eau (son rayon et un peu d'air). */
export const KEO_STOP = 0.9;

/**
 * Un pont : sa terre ; sa liaison du réseau et le bout de celle-ci du côté de la terre d'avant (`nearEnd`) ; ses deux
 * nœuds (`near`, du côté ouvert, puis `far`), son sens ; sur sa ligne, depuis `near` : le début de la culée de ce côté
 * (`abut[0]`), l'eau (`water`), la fin de la culée d'en face (`abut[1]`) ; le haut du sol au début de chaque culée ; où
 * Kéo s'arrête (`stop`) ; le milieu de l'eau (le cadenas, le toucher).
 */
export interface BridgeSite {
  land: LinkedLand;
  edge: number;
  nearEnd: 0 | 1;
  near: Vec2;
  dir: Vec2;
  length: number;
  abut: readonly [number, number];
  water: readonly [number, number];
  base: readonly [number, number];
  stop: NetworkPoint;
  mid: Vec2;
}

/** Le plan du 6e : celui des ponts quand on ne dit pas le plan. */
const PLAN_6E = planFor('6e');

/**
 * Ce qu'un pont lit de son niveau (GD-22, lot 2) : un nœud de son réseau, l'eau de son bras de mer ou de son chenal, la
 * part de sa liaison que prennent ses culées, le sol. Le 6e et le 5e ont chacun le leur ; un pont se retrouve par sa
 * terre (les identifiants des terres sont uniques d'un niveau à l'autre).
 */
interface BridgeWorld {
  /** La pierre de ses ponts, par terre. */
  stone(land: LinkedLand): BridgeStone;
  node(id: string): Vec2;
  clearance(p: Vec2, land: LinkedLand): number;
  cut(a: Vec2, c: Vec2, land: LinkedLand): readonly [number, number];
  height(p: Vec2): number;
}

const WORLD_6E: BridgeWorld = {
  stone: () => STONE_6E,
  node: (id) => pathNode(id).at,
  clearance: (p, land) => straitClearance(p, land as StraitId),
  cut: (a, c, land) => bridgeCut(a, c, land as StraitId),
  height: heightAt,
};

/** Hors d'un chenal (la cabine), aucune eau : la distance est toujours positive. */
const DRY = 1e9;

const WORLD_5E: BridgeWorld = {
  stone: () => STONE_6E,
  node: (id) => NETWORK_5E.pathNode(id).at,
  clearance: (p, land) => {
    const channel = isLand5e(land) ? LINKS_5E[land].channel : null;
    return channel ? channelClearance(p, channel) : DRY;
  },
  cut: (a, c, land) => (isLand5e(land) ? passageCut(a, c, land) : [0, 0]),
  height: heightAt5e,
};

/** Le 4e : le bassin à flot, le ravin et la coulée, chacun sa coupure (le ravin et la coulée sont secs). */
const WORLD_4E: BridgeWorld = {
  stone: (land) => (isLand4e(land) && LINKS_4E[land].cut === 'coulee' ? BASALT_4E : STONE_4E),
  node: (id) => NETWORK_4E.pathNode(id).at,
  clearance: (p, land) => (isLand4e(land) ? CUT_CLEARANCE_4E[LINKS_4E[land].cut](p) : DRY),
  cut: (a, c, land) => (isLand4e(land) ? passageCut4e(a, c, land) : [0, 0]),
  height: heightAt4e,
};

const BRIDGE_WORLDS: Readonly<Record<OpenWorldLevel, BridgeWorld>> = { '6e': WORLD_6E, '5e': WORLD_5E, '4e': WORLD_4E };

const worldOf = (land: LinkedLand): BridgeWorld => BRIDGE_WORLDS[planOfLand(land).level];

/** La pierre d'un pont. */
const stoneOf = (s: BridgeSite): BridgeStone => worldOf(s.land).stone(s.land);

/** Le passage d'une terre est-il la cabine de la Montée (au 5e), et non un pont ? */
export const isCabin = (land: LinkedLand): boolean => isLand5e(land) && LINKS_5E[land].kind === 'cabine';

const sites = new Map<LinkedLand, BridgeSite>();

/** Le pont d'une terre (calculé une fois). */
export function bridgeSite(land: LinkedLand): BridgeSite {
  const known = sites.get(land);
  if (known) return known;
  const world = worldOf(land);
  const plan = planOfLand(land);
  const edge = bridgeEdge(plan, land);
  const [a, b] = plan.bridges[land]!;
  const nearEnd: 0 | 1 = plan.pathEdges[edge][0] === a ? 0 : 1;
  const near = world.node(a);
  const far = world.node(b);
  const length = distance(near, far);
  const dir = { x: (far.x - near.x) / length, z: (far.z - near.z) / length };
  const at = (d: number): Vec2 => ({ x: near.x + dir.x * d, z: near.z + dir.z * d });
  // L'eau sur la ligne du chemin, de rive à rive.
  let w0 = length;
  let w1 = 0;
  const abut = world.cut(near, far, land);
  if (isCabin(land)) {
    // La cabine : son « eau » est sa montée, de son pied à son haut ; Kéo s'arrête sur la gare du pied.
    w0 = abut[0];
    w1 = abut[1];
  } else
    for (let d = 0; d <= length; d += 0.05) {
      if (world.clearance(at(d), land) >= 0) continue;
      w0 = Math.min(w0, d);
      w1 = Math.max(w1, d);
    }
  const stopD = w0 - KEO_STOP;
  const t = nearEnd === 0 ? stopD / length : 1 - stopD / length;
  const site: BridgeSite = {
    land,
    edge,
    nearEnd,
    near,
    dir,
    length,
    abut,
    water: [w0, w1],
    base: [standingHeight(world.height(at(abut[0]))), standingHeight(world.height(at(abut[1])))],
    stop: { edge, t, at: at(stopD) },
    mid: at((w0 + w1) / 2),
  };
  sites.set(land, site);
  return site;
}

/** Les ponts d'un plan (au 6e, les quatre), dans l'ordre des terres. */
export const allBridges = (plan: LevelPlan = PLAN_6E): BridgeSite[] => linkedLands(plan).map(bridgeSite);

/** Le dessus de la culée de ce côté (`side` 0) ou d'en face (1) d'un pont, à `d` unités de `near` sur sa ligne : une rampe douce du sol à la hauteur du tablier. */
function abutTop(s: BridgeSite, side: 0 | 1, d: number): number {
  const from = s.abut[side];
  const to = side === 0 ? s.water[0] + BRIDGE.over : s.water[1] - BRIDGE.over;
  const u = Math.min(1, Math.max(0, (d - from) / (to - from)));
  return s.base[side] + 0.08 + (BRIDGE.deck - s.base[side] - 0.08) * u;
}

/**
 * Le dessus d'un pont où Kéo se tient en (`x`, `z`), ou rien hors de lui : ses culées, toujours ; son tablier, seulement
 * s'il est rebâti (sa terre n'est pas dans `closed`). Lu à chaque image : rien n'est créé.
 */
export function bridgeFloor(x: number, z: number, closed: readonly LinkedLand[], plan: LevelPlan = PLAN_6E): number | null {
  let top: number | null = null;
  for (const land of linkedLands(plan)) {
    const s = bridgeSite(land);
    const dx = x - s.near.x;
    const dz = z - s.near.z;
    const d = dx * s.dir.x + dz * s.dir.z;
    const v = Math.abs(-dx * s.dir.z + dz * s.dir.x);
    if (isCabin(land)) {
      // La cabine reliée : Kéo se tient sur le plancher de la caisse, de l'arrêt du pied à celui du haut, jamais sous
      // le sol (GD-22, lot 3 : il y monte, la caisse roule).
      const stops = cabinStops(s);
      // Ses deux gares, cabine reliée ou non : leur dalle de bois (`cabinStations`), où Kéo se tient dessus.
      const [, , sl] = CABIN.station;
      if (v <= CABIN.station[0] / 2) {
        const station = d >= s.abut[0] - sl && d < stops.bottom - CABIN_CAR.half ? s.base[0] : d > s.abut[1] && d <= s.abut[1] + sl ? s.base[1] : null;
        if (station !== null) {
          const y = station + CABIN.station[1];
          top = top === null ? y : Math.max(top, y);
          continue;
        }
      }
      if (closed.includes(land) || d < stops.bottom - CABIN_CAR.half || d > stops.top + CABIN_CAR.half || v > CABIN.width / 2 + 0.2) continue;
      const y = Math.max(cabinCarFloor(s, Math.min(stops.top, Math.max(stops.bottom, d))), standingHeight(worldOf(land).height({ x, z })));
      top = top === null ? y : Math.max(top, y);
      continue;
    }
    if (d < s.abut[0] || d > s.abut[1]) continue;
    if (v > BRIDGE.abutHalf) continue;
    let y: number | null = null;
    if (d <= s.water[0] + BRIDGE.over) y = abutTop(s, 0, d);
    else if (d >= s.water[1] - BRIDGE.over) y = abutTop(s, 1, d);
    else if (v <= BRIDGE.width / 2 + 0.2 && !closed.includes(land)) y = BRIDGE.deck;
    if (y !== null) top = top === null ? y : Math.max(top, y);
  }
  return top;
}

/**
 * Le point du réseau où va Kéo, les terres `closed` fermées : dans une terre fermée, ou au-delà d'un pont pas encore
 * rebâti, il s'arrête sur la culée du pont à rebâtir d'abord (`firstClosed`), du côté ouvert ; ailleurs, le point
 * lui-même. Les terres forment un arbre depuis le départ : un trajet entre deux terres ouvertes ne passe jamais par une
 * terre fermée.
 */
export function clampToOpen(p: NetworkPoint, closed: readonly LinkedLand[], plan: LevelPlan = PLAN_6E): NetworkPoint {
  if (!closed.length) return p;
  for (const land of closed) {
    const s = bridgeSite(land);
    if (p.edge !== s.edge) continue;
    const first = firstClosed(land, closed);
    if (first !== land) return bridgeSite(first).stop;
    const beyond = s.nearEnd === 0 ? p.t > s.stop.t : p.t < s.stop.t;
    return beyond ? s.stop : p;
  }
  const land = nodeLands(plan).get(plan.pathEdges[p.edge][0]) ?? startLandOf(plan);
  return isLinkedLand(land) && closed.includes(land) ? bridgeSite(firstClosed(land, closed)).stop : p;
}

/** La zone de toucher d'un pont : un rayon autour du milieu de son eau, et, de loin, tant de pixels à l'écran au moins (48 et plus). */
export const BRIDGE_TOUCH = { radius: 5, pixels: 30 } as const;

// ---------- Le dessin ----------

/** Un repère sur la ligne d'un pont : `d` depuis `near`, `v` en travers. */
const frame = (s: BridgeSite) => (d: number, v: number) => ({ x: s.near.x + s.dir.x * d - s.dir.z * v, z: s.near.z + s.dir.z * d + s.dir.x * v });

/** Un bloc de pierre entre `d0` et `d1` sur la ligne d'un pont, large de `2 × half`, son dessus de `y0` à `y1`, son pied sous l'eau. */
function slab(b: FacetBuilder, s: BridgeSite, d0: number, d1: number, half: number, y0: number, y1: number, color: number, top: number): void {
  const at = frame(s);
  const p = (d: number, v: number, y: number) => {
    const q = at(d, v);
    return [q.x, y, q.z] as const;
  };
  const f = BRIDGE.foot;
  // Le dessus, puis les deux flancs, puis les deux bouts (les faces regardent vers le dehors).
  b.quad(p(d0, half, y0), p(d1, half, y1), p(d1, -half, y1), p(d0, -half, y0), top);
  b.quad(p(d0, -half, f), p(d0, -half, y0), p(d1, -half, y1), p(d1, -half, f), color);
  b.quad(p(d1, half, f), p(d1, half, y1), p(d0, half, y0), p(d0, half, f), color);
  b.quad(p(d1, -half, f), p(d1, -half, y1), p(d1, half, y1), p(d1, half, f), color);
  b.quad(p(d0, half, f), p(d0, half, y0), p(d0, -half, y0), p(d0, -half, f), color);
}

/** Les deux culées, de part et d'autre de l'eau : une rampe de pierre du sol jusqu'à la hauteur du tablier. */
function abutments(b: FacetBuilder, s: BridgeSite): void {
  const S = stoneOf(s);
  slab(b, s, s.abut[0], s.water[0] + BRIDGE.over, BRIDGE.abutHalf, abutTop(s, 0, s.abut[0]), BRIDGE.deck, S.stone, S.stoneTop);
  slab(b, s, s.water[1] - BRIDGE.over, s.abut[1], BRIDGE.abutHalf, BRIDGE.deck, abutTop(s, 1, s.abut[1]), S.stone, S.stoneTop);
}

/**
 * Les piles (relecture du lot 1, directeur artistique : maçonnées, de section carrée, trois ou quatre, de l'eau au
 * tablier) : leur côté ; leurs assises, de hauteurs égales du pied à leur chaperon ; le pied sombre, mouillé, jusqu'à
 * tant au-dessus de l'eau.
 */
const PILE = { side: 1.4, courses: 4, inset: 0.1, wet: 0.35 } as const;

/**
 * Le départ d'arche brisé : le bas de l'intrados contre la culée, au-dessus de l'eau ; l'épaisseur de pierre au bout,
 * au-dessus de l'intrados ; de combien son dessus penche par unité vers le bout.
 */
const ARCH = { spring: 0.25, ring: 0.45, tilt: 0.12 } as const;

/** Les piles, en part de l'eau depuis la rive de ce côté : trois sur un bras de moins de 13 unités, quatre au-delà. */
const pilesOf = (s: BridgeSite): number[] => {
  const n = s.water[1] - s.water[0] < 13 ? 3 : 4;
  return Array.from({ length: n }, (_, k) => s.water[0] + ((s.water[1] - s.water[0]) * (k + 1)) / (n + 1));
};

/** Les moignons d'un pont tombé : deux des piles, la première et la dernière. */
const stumpsOf = (s: BridgeSite): number[] => {
  const piles = pilesOf(s);
  return [piles[0], piles[piles.length - 1]];
};

/** Le cadenas d'un pont (le même sur les quatre) : au-dessus de l'eau, passé son milieu, du côté de la terre fermée. */
export function bridgeLockPoint(land: LinkedLand): Vec2 {
  const s = bridgeSite(land);
  return frame(s)(s.water[0] + (s.water[1] - s.water[0]) * 0.6, 0);
}

/**
 * Un fût de pierre de section carrée (`half` de demi-côté) à `d` sur la ligne d'un pont, du pied sous l'eau jusqu'à son
 * dessus : quatre coins à `corners` (dans l'ordre : vers `near` à gauche, loin à gauche, loin à droite, vers `near` à
 * droite) et une pointe à `peak` (sa place en part du demi-côté, sa hauteur), qui cassent le dessus en biais ; le pied
 * plus sombre jusqu'à `PILE.wet` au-dessus de l'eau.
 */
function shaft(b: FacetBuilder, s: BridgeSite, d: number, half: number, corners: readonly [number, number, number, number], peak: readonly [number, number, number], color: number, top: number): void {
  const at = frame(s);
  const off = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ] as const;
  const p = (k: number, y: number) => {
    const q = at(d + off[k][0], off[k][1]);
    return [q.x, y, q.z] as const;
  };
  const wet = PILE.wet;
  const S = stoneOf(s);
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    // Les faces regardent vers le dehors : le tour se fait dans le sens qui les tourne vers l'extérieur.
    b.quad(p(n, BRIDGE.foot), p(k, BRIDGE.foot), p(k, wet), p(n, wet), S.wet);
    b.quad(p(n, wet), p(k, wet), p(k, corners[k]), p(n, corners[n]), color);
  }
  const c = at(d + peak[0] * half, peak[1] * half);
  const apex = [c.x, peak[2], c.z] as const;
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    b.triangle(apex, p(n, corners[n]), p(k, corners[k]), top);
  }
}

/**
 * Un départ d'arche brisé, de la culée à `from` vers l'eau (`sign`, +1 vers l'autre rive), long de `length` au plus :
 * son dessus dans le prolongement de la culée, 1,8 au-dessus de l'eau, qui penche un peu vers le bout ; dessous,
 * l'intrados courbe, un quart d'arc qui descend presque à l'eau contre la culée ; le bout cassé en dents, trois rangs de
 * claveaux en escalier à travers la largeur (`teeth`, leur longueur en part de `length`), puis le vide franc jusqu'au
 * premier moignon (directeur artistique, référence `detroit-avant-42`). Rien ne descend en marches vers l'eau.
 */
function archStart(b: FacetBuilder, s: BridgeSite, from: number, sign: 1 | -1, length: number, teeth: readonly [number, number, number]): void {
  const at = frame(s);
  const S = stoneOf(s);
  const half = BRIDGE.width / 2;
  const top = (u: number) => BRIDGE.deck - 0.1 - ARCH.tilt * u;
  // L'intrados : un quart d'ellipse sur l'arc entier (`span`), de presque l'eau contre la culée jusque sous le dessus.
  const span = length * 1.3;
  const under = (u: number) => ARCH.spring + (BRIDGE.deck - 0.1 - ARCH.ring - ARCH.spring) * Math.sin((Math.PI / 2) * Math.min(1, u / span));
  const p = (u: number, v: number, h: number) => {
    const q = at(from + sign * u, v);
    return [q.x, h, q.z] as const;
  };
  // Une tranche de `u0` à `u1`, de `v0` à `v1` à travers (v0 < v1) ; ses faces tournées vers le dehors quel que soit le
  // sens du bras (`sign`), sa face du bout seulement si `end`, chaque flanc seulement s'il se voit (`sides`).
  const slice = (u0: number, u1: number, v0: number, v1: number, end: boolean, sides: readonly [boolean, boolean]) => {
    const [L, R] = sign > 0 ? [v1, v0] : [v0, v1];
    const [lOut, rOut] = sign > 0 ? [sides[1], sides[0]] : [sides[0], sides[1]];
    b.quad(p(u0, L, top(u0)), p(u1, L, top(u1)), p(u1, R, top(u1)), p(u0, R, top(u0)), S.stoneTop);
    b.quad(p(u0, R, under(u0)), p(u1, R, under(u1)), p(u1, L, under(u1)), p(u0, L, under(u0)), S.wet);
    if (lOut) b.quad(p(u0, L, under(u0)), p(u1, L, under(u1)), p(u1, L, top(u1)), p(u0, L, top(u0)), S.stone);
    if (rOut) b.quad(p(u1, R, under(u1)), p(u0, R, under(u0)), p(u0, R, top(u0)), p(u1, R, top(u1)), S.stone);
    if (end) b.quad(p(u1, L, under(u1)), p(u1, R, under(u1)), p(u1, R, top(u1)), p(u1, L, top(u1)), S.broken);
  };
  // Le corps plein jusqu'au plus court des claveaux, en deux tranches (l'intrados s'y courbe), puis chaque rang à sa
  // longueur.
  const solid = length * Math.min(...teeth);
  slice(0, solid / 2, -half, half, false, [true, true]);
  slice(solid / 2, solid, -half, half, false, [true, true]);
  const w = (2 * half) / 3;
  teeth.forEach((k, i) => {
    const end = length * k;
    if (end <= solid + 1e-6) {
      // Le rang le plus court : sa face du bout, à travers sa seule largeur.
      const v0 = -half + i * w;
      const [L, R] = sign > 0 ? [v0 + w, v0] : [v0, v0 + w];
      b.quad(p(solid, L, under(solid)), p(solid, R, under(solid)), p(solid, R, top(solid)), p(solid, L, top(solid)), S.broken);
      return;
    }
    slice(solid, end, -half + i * w, -half + (i + 1) * w, true, [i === 0 || teeth[i - 1] < k, i === 2 || teeth[i + 1] < k]);
  });
}

/** Les morceaux d'un pont rebâti, dans l'ordre de sa pose (GD-20, point 3, « La pose ») : ses piles, une à une ; son tablier ; ses garde-corps et ses lanternes. */
export interface BridgeParts {
  piles: Facets[];
  deck: Facets;
  rails: Facets;
}

/**
 * Le dessus d'un pont rebâti à `d` unités de `near` sur sa ligne : la rampe d'une culée, ou le tablier. Les garde-corps
 * et les lanternes y sont posés.
 */
export function bridgeSurface(s: BridgeSite, d: number): number {
  return d <= s.water[0] + BRIDGE.over ? abutTop(s, 0, d) : d >= s.water[1] - BRIDGE.over ? abutTop(s, 1, d) : BRIDGE.deck;
}

/** Les deux culées seules (`abutmentsOnly`), ou avec les deux départs d'arche brisés (`arches`). */
function abutmentFacets(s: BridgeSite, arches: boolean): Facets {
  const b = new FacetBuilder();
  abutments(b, s);
  if (arches) {
    archStart(b, s, s.water[0] + BRIDGE.over, 1, 2.1, [1, 0.8, 0.6]);
    archStart(b, s, s.water[1] - BRIDGE.over, -1, 1.4, [0.6, 0.8, 1]);
  }
  return b.build();
}

/**
 * Le pont pendant sa pose, sans ce qui se relève (GD-20, point 3, « La pose ») : les deux culées et les départs d'arche,
 * que le tablier vient couvrir ; les moignons ont laissé la place aux piles qui se relèvent.
 */
export const bridgeLayRest = (land: LinkedLand): Facets =>
  isCabin(land) ? cabinStations(bridgeSite(land)) : isSwing(land) ? mergeFacets([abutmentFacets(bridgeSite(land), false), swingDrum(bridgeSite(land))]) : abutmentFacets(bridgeSite(land), true);

/**
 * Les garde-corps d'un pont, d'une culée à l'autre : des poteaux de section `t` tous les `step` au plus, une main courante
 * qui suit la rampe des culées.
 */
function railings(b: FacetBuilder, s: BridgeSite, step: number, t: number, color: number): void {
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const from = s.abut[0] + 0.5;
  const to = s.abut[1] - 0.5;
  const n = Math.max(2, Math.ceil((to - from) / step) + 1);
  for (const v of [-BRIDGE.railOut, BRIDGE.railOut]) {
    let last: { x: number; y: number; z: number } | null = null;
    for (let k = 0; k < n; k++) {
      const d = from + ((to - from) * k) / (n - 1);
      const p = at(d, v);
      const y = bridgeSurface(s, d);
      b.box({ x: p.x, y, z: p.z, yaw }, [t, BRIDGE.rail, t], color);
      const head = { x: p.x, y: y + BRIDGE.rail - 0.06, z: p.z };
      if (last) b.beam(last, head, t * 0.75, color);
      last = head;
    }
  }
}

/**
 * Les quatre lanternes d'un pont, de chaque côté de chaque culée, au début du garde-corps : un mât de fer, puis une tête
 * qu'on lit (directeur artistique) : son socle, le verre Sable dans sa cage de fer (deux barreaux en croix sur chaque
 * face), son chapeau en pointe. Au 6e et au 5e, le verre Sable : aucune lumière ne s'y allume. Au 4e (règle commune des
 * ponts du 4e, convenue entre les fils le 22 octobre 2026), `lit` : le pont relié a ses lanternes allumées, le verre
 * d'ocre des lieux du 4e, fixe, sans clignotement ni halo ; le pont pas encore relié n'en a pas (elles montent du
 * tablier à la pose, déjà de leur couleur).
 */
function lanterns(b: FacetBuilder, s: BridgeSite, iron: number, lit: boolean): void {
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  for (const d of [s.abut[0] + 0.5, s.abut[1] - 0.5])
    for (const v of [-(BRIDGE.railOut + 0.35), BRIDGE.railOut + 0.35]) {
      const p = at(d, v);
      const y = bridgeSurface(s, d);
      b.box({ x: p.x, y, z: p.z, yaw }, [0.14, 1.6, 0.14], iron);
      b.box({ x: p.x, y: y + 1.6, z: p.z, yaw }, [0.46, 0.08, 0.46], iron);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.36, 0.44, 0.36], lit ? C.lit : C.glass);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.42, 0.44, 0.07], iron);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.07, 0.44, 0.42], iron);
      b.prism({ x: p.x, y: y + 2.12, z: p.z, yaw: yaw + Math.PI / 4 }, 0.36, 0, 0.32, 4, iron);
    }
}

/**
 * Les morceaux d'un pont rebâti, sans ses culées : les piles maçonnées, de l'eau jusque sous le tablier (leurs assises,
 * chacune un peu en retrait de celle du dessous tour à tour : les joints se lisent, le pied sombre, puis leur chaperon) ;
 * le tablier de planches sur ses deux longerons ; les garde-corps et les quatre lanternes.
 */
export function bridgeParts(land: LinkedLand): BridgeParts {
  const s = bridgeSite(land);
  if (isCabin(land)) return cabinParts(s);
  if (isSwing(land)) return swingParts(s);
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const pileTop = BRIDGE.deck - BRIDGE.plank - 0.24;
  const S = stoneOf(s);
  const piles = pilesOf(s).map((d) => {
    const b = new FacetBuilder();
    const p = at(d, 0);
    b.box({ x: p.x, y: BRIDGE.foot, z: p.z, yaw }, [PILE.side, PILE.wet - BRIDGE.foot, PILE.side], S.wet);
    const course = (pileTop - 0.18 - PILE.wet) / PILE.courses;
    for (let k = 0; k < PILE.courses; k++) {
      const side = PILE.side - (k % 2 ? PILE.inset : 0);
      b.box({ x: p.x, y: PILE.wet + k * course, z: p.z, yaw }, [side, course, side], k % 2 ? S.pile : S.stone);
    }
    b.box({ x: p.x, y: pileTop - 0.18, z: p.z, yaw }, [PILE.side + 0.3, 0.18, PILE.side + 0.3], S.stone, S.stoneTop);
    return b.build();
  });
  // Le tablier : deux longerons sous cinq planches jointives, d'une culée à l'autre.
  const deck = new FacetBuilder();
  const d0 = s.water[0] + BRIDGE.over - 0.3;
  const d1 = s.water[1] - BRIDGE.over + 0.3;
  for (const v of [-1, 1]) {
    const a = at(d0, v * 1.1);
    const c = at(d1, v * 1.1);
    deck.beam({ x: a.x, y: BRIDGE.deck - BRIDGE.plank - 0.12, z: a.z }, { x: c.x, y: BRIDGE.deck - BRIDGE.plank - 0.12, z: c.z }, 0.24, C.beam);
  }
  const planks = 5;
  const w = BRIDGE.width / planks;
  for (let k = 0; k < planks; k++) {
    const p = at((d0 + d1) / 2, -BRIDGE.width / 2 + w / 2 + k * w);
    deck.box({ x: p.x, y: BRIDGE.deck - BRIDGE.plank, z: p.z, yaw }, [w - 0.03, BRIDGE.plank, d1 - d0], C.wood, C.woodTop);
  }
  // Les garde-corps : des poteaux d'une culée à l'autre, une main courante qui suit la rampe des culées.
  const b = new FacetBuilder();
  railings(b, s, BRIDGE.post, 0.16, C.rail);
  lanterns(b, s, C.iron, isLand4e(land));
  return { piles, deck: deck.build(), rails: b.build() };
}

/** Où attend la caisse de la cabine : au pied, en haut, ou nulle part (elle roule, dans le maillage de la pose). */
export type CabinCar = 'bas' | 'haut' | null;

/**
 * Un pont pas encore rebâti (`before`) : les deux culées ; de chaque côté, un départ d'arche brisé, plus court côté
 * terre fermée ; deux moignons debout, de la section des piles, à leur place, cassés en biais. Rebâti : les culées, les
 * piles maçonnées, le tablier de planches, les garde-corps et les quatre lanternes (`bridgeParts`). Un seul maillage,
 * réuni à celui des lieux.
 */
export function bridgeFacets(land: LinkedLand, built: boolean, car: CabinCar = 'bas', open = false): Facets {
  const s = bridgeSite(land);
  if (isCabin(land)) {
    if (!built) return fallenCabin(s);
    const parts = cabinParts(s);
    // La caisse, à l'arrêt où elle attend (au pied, ou en haut), ou nulle part pendant un trajet (la vue la fait rouler) ;
    // en haut, ouverte (sans poteaux ni toit) quand la caméra s'en approche (`open`, cabinRide.ts, `cabinCarOpen`).
    const box = car === 'bas' ? parts.rails : car === 'haut' ? carAt(s, cabinStops(s).top, !open) : null;
    return mergeFacets([cabinStations(s), ...parts.piles, parts.deck, ...(box ? [box] : [])]);
  }
  if (isSwing(land)) {
    if (!built) return mergeFacets([abutmentFacets(s, false), swingDrum(s), swingRuin(s), swingRuinRails(s)]);
    const parts = bridgeParts(land);
    return mergeFacets([abutmentFacets(s, false), swingDrum(s), parts.deck, parts.rails]);
  }
  if (built) {
    const parts = bridgeParts(land);
    return mergeFacets([abutmentFacets(s, false), ...parts.piles, parts.deck, parts.rails]);
  }
  if (isBasaltArch(land)) return fallenArch(s);
  const b = new FacetBuilder();
  b.append(abutmentFacets(s, true));
  // Les deux moignons, de 0,7 à 1,2 au-dessus de l'eau, le dessus cassé en biais (la pierre brute, plus sombre que le
  // dessus des culées), sans dalle à plat.
  const h = PILE.side / 2;
  const [first, last] = stumpsOf(s);
  const S = stoneOf(s);
  shaft(b, s, first, h, STUMPS[0].corners, STUMPS[0].peak, S.pile, S.broken);
  shaft(b, s, last, h, STUMPS[1].corners, STUMPS[1].peak, S.pile, S.broken);
  return b.build();
}

/** Le passage d'une terre est-il le pont tournant des docks, sur le bassin à flot (au 4e) ? */
export const isSwing = (land: LinkedLand): boolean => isLand4e(land) && LINKS_4E[land].cut === 'bassin';

/**
 * Le pont tournant des docks (artiste technique 3D ; intention du directeur artistique du 22 octobre 2026, « Le pont du
 * bassin », piste C, choix du mainteneur) : le pivot, au milieu du tambour, à tant d'unités de l'eau de ce côté (le
 * tambour sous le bout côté Fabriques, au ras du quai) ; le rayon du tambour, son nombre de côtés ; la hauteur des deux
 * poutres pleines sous le tablier et leur épaisseur ; l'écart des poteaux de ses garde-corps de fer. En ruine, la volée
 * est restée ouverte : tournée de `open` vers le nord, et son bout libre affaissé, le bas de ses poutres dans l'eau,
 * basculée de `sag` sur son tambour. Retouche des captures du 22 octobre 2026 : tournée d'un quart de tour presque
 * entier et basculée de 0,19, elle filait droit dans l'axe du regard depuis le quai des Fabriques et la Soute, son tablier
 * sous l'eau dès son milieu, et ne se lisait que par son bout ; tournée de 60° (en biais, son flanc se présente au quai
 * des Fabriques et à la Soute, au sud-ouest ; son bout reste au-dessus de l'eau du bassin, au nord, loin du quai d'en
 * face ; le cadenas garde son eau libre à plus de trois unités) et à peine basculée, son tablier reste hors de l'eau sur
 * toute sa longueur : une volée entière, couchée en travers du bassin, au nord du pont.
 */
export const SWING = { pivot: 2.4, drum: 1.6, sides: 8, girder: 0.9, girderWidth: 0.3, post: 2.4, open: (60 * Math.PI) / 180, sag: 0.08 } as const;

/**
 * Le fer du pont tournant : rouillé dans la ruine (seulement là), bruni sombre une fois rebâti (fiche du 4e, les matières
 * des Passeurs). Retouche 1 du Bastion, point 7 : la rouille de la ruine un cran sous la terre rouge (la rouille claire
 * du 4e se lisait en planche orange), ses poutres plus sombres encore, et ses garde-corps tombés, d'un fer sombre.
 */
const SWING_IRON = { rust: 0x8a5a4a, rustShade: 0x5e3e36, fallen: 0x4e3a34, iron: 0x5c504c, ironTop: 0x6c5e58 } as const;

/** Le pivot du pont tournant sur sa ligne (`d` depuis `near`), et la hauteur du dessus de son tambour, où portent les poutres. */
export function swingPivot(s: BridgeSite): { d: number; y: number } {
  return { d: s.water[0] + SWING.pivot, y: BRIDGE.deck - BRIDGE.plank - SWING.girder };
}

/** Le tablier de la volée, d'une culée à l'autre (sur la ligne du pont), comme celui des autres ponts. */
const swingSpan = (s: BridgeSite): readonly [number, number] => [s.water[0] + BRIDGE.over - 0.3, s.water[1] - BRIDGE.over + 0.3];

/**
 * La volée fermée (à sa place de pont rebâti) : un tablier de tôle sur deux poutres pleines et profondes, sans treillis,
 * sans pile ni pied dans l'eau ; `rust` : rouillée, comme dans la ruine.
 */
function swingDeck(s: BridgeSite, rust: boolean): Facets {
  const b = new FacetBuilder();
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const [d0, d1] = swingSpan(s);
  const side = rust ? SWING_IRON.rustShade : SWING_IRON.iron;
  const top = rust ? SWING_IRON.rust : SWING_IRON.ironTop;
  const mid = at((d0 + d1) / 2, 0);
  b.box({ x: mid.x, y: BRIDGE.deck - BRIDGE.plank, z: mid.z, yaw }, [BRIDGE.width, BRIDGE.plank, d1 - d0], side, top);
  const low = swingPivot(s).y;
  for (const v of [-1, 1]) {
    const p = at((d0 + d1) / 2, v * (BRIDGE.width / 2 - SWING.girderWidth / 2 - 0.05));
    b.box({ x: p.x, y: low, z: p.z, yaw }, [SWING.girderWidth, SWING.girder, d1 - d0], side, rust ? side : top);
  }
  return b.build();
}

/**
 * Les garde-corps de la volée de la ruine, dans la volée fermée (`swingPosed` les couche avec elle) : celui du sud rabattu
 * à plat sur le tablier, sa main courante et cinq montants ; celui du nord debout près du pivot, puis plié vers le bout
 * libre, sa main courante en deux pans (retouche 1 du Bastion, point 7 : on lit un pont de fer resté ouvert, pas une
 * planche). Ils ne sont pas dans la pose : le pont rebâti a les siens, qui montent du tablier.
 */
function swingFallenRails(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  const at = frame(s);
  const [d0, d1] = swingSpan(s);
  const half = BRIDGE.railOut;
  const P = (d: number, v: number, h: number) => {
    const p = at(d, v);
    return { x: p.x, y: BRIDGE.deck + h, z: p.z };
  };
  const t = 0.1;
  const c = SWING_IRON.fallen;
  // Le sud, couché vers le milieu du tablier : sa main courante et deux montants, à ses bouts.
  const [a, e] = [d0 + 0.6, d1 - 1.2];
  rod(b, P(a, -half + BRIDGE.rail * 0.9, 0.06), P(e, -half + BRIDGE.rail * 0.85, 0.06), t, c);
  for (let k = 0; k < 2; k++) {
    const d = a + (e - a) * k;
    rod(b, P(d, -half, 0.05), P(d + 0.1, -half + BRIDGE.rail * 0.9, 0.06), t * 0.8, c);
  }
  // Le nord, debout près du pivot, puis plié vers le bout libre.
  const bend = d0 + (d1 - d0) * 0.42;
  for (const d of [a, bend]) rod(b, P(d, half, 0), P(d, half, BRIDGE.rail), t * 0.8, c);
  rod(b, P(a, half, BRIDGE.rail), P(bend, half, BRIDGE.rail), t, c);
  rod(b, P(bend, half, BRIDGE.rail), P(e, half + 0.5, 0.15), t, c);
  return b.build();
}

/**
 * Une barre de fer fine tendue de `a` à `c` : trois faces (section en triangle, de côté `t`), sans bouts (on ne les voit
 * pas à cette épaisseur), soit six triangles au lieu des douze d'un pavé.
 */
function rod(b: FacetBuilder, a: { x: number; y: number; z: number }, c: { x: number; y: number; z: number }, t: number, color: number): void {
  const dx = c.x - a.x, dy = c.y - a.y, dz = c.z - a.z;
  const len = Math.hypot(dx, dy, dz) || 1e-6;
  const d = [dx / len, dy / len, dz / len];
  const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u0 = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
  const ul = Math.hypot(u0[0], u0[1], u0[2]);
  const u = u0.map((x) => x / ul);
  const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const r = t * 0.58;
  const ring = (p: { x: number; y: number; z: number }) =>
    [0, 1, 2].map((k) => {
      const ang = (k * 2 * Math.PI) / 3;
      const cu = Math.cos(ang) * r, cv = Math.sin(ang) * r;
      return [p.x + cu * u[0] + cv * v[0], p.y + cu * u[1] + cv * v[1], p.z + cu * u[2] + cv * v[2]] as const;
    });
  const [A, B] = [ring(a), ring(c)];
  for (let k = 0; k < 3; k++) {
    const n = (k + 1) % 3;
    b.quad(A[k], A[n], B[n], B[k], color);
  }
}

/** Le tambour, le pivot : un cylindre bas de pierre grise cerclé de fer, sous le bout côté Fabriques, du fond jusque sous les poutres. */
function swingDrum(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  const S = stoneOf(s);
  const pivot = swingPivot(s);
  const p = frame(s)(pivot.d, 0);
  b.prism({ x: p.x, y: BRIDGE.foot, z: p.z, yaw: Math.PI / SWING.sides }, SWING.drum, SWING.drum, pivot.y - BRIDGE.foot, SWING.sides, S.stone, S.stoneTop);
  b.band({ x: p.x, y: pivot.y - 0.4, z: p.z, yaw: Math.PI / SWING.sides }, SWING.drum + 0.05, 0.22, SWING.sides, SWING_IRON.iron);
  return b.build();
}

/** La bascule et le tour de la volée, leurs cosinus et sinus (calculés une fois par image, jamais par sommet). */
export interface SwingTurn {
  cs: number;
  ss: number;
  ct: number;
  st: number;
}

/** Écrit dans `out` les cosinus et sinus de la bascule `sag` et du tour `turn` de la volée (rien n'est créé). */
export function swingTurn(sag: number, turn: number, out: SwingTurn): SwingTurn {
  out.cs = Math.cos(sag);
  out.ss = Math.sin(sag);
  out.ct = Math.cos(turn);
  out.st = Math.sin(turn);
  return out;
}

/**
 * Un sommet de la volée fermée (`x`, `y`, `z`, dans le monde) basculé sur son tambour (`pivot`, son bout libre vers le
 * bas) puis tourné autour du pivot (vers le nord, la mer du nord), selon `r` (./bridgeLay.ts le calcule une fois par
 * image), écrit dans `out` à `o` ; `normal` : un vecteur (sans déplacement). Rien n'est créé.
 */
export function swingMove(s: BridgeSite, pivot: { readonly d: number; readonly y: number }, r: SwingTurn, x: number, y: number, z: number, out: Float32Array, o: number, normal = false): void {
  const dx = normal ? x : x - s.near.x;
  const dz = normal ? z : z - s.near.z;
  const u = dx * s.dir.x + dz * s.dir.z - (normal ? 0 : pivot.d);
  const w = -dx * s.dir.z + dz * s.dir.x;
  const h = normal ? y : y - pivot.y;
  const u1 = u * r.cs + h * r.ss;
  const h1 = h * r.cs - u * r.ss;
  const d = (normal ? 0 : pivot.d) + u1 * r.ct + w * r.st;
  const v = -u1 * r.st + w * r.ct;
  out[o] = (normal ? 0 : s.near.x) + s.dir.x * d - s.dir.z * v;
  out[o + 1] = (normal ? 0 : pivot.y) + h1;
  out[o + 2] = (normal ? 0 : s.near.z) + s.dir.z * d + s.dir.x * v;
}

/** La volée basculée de `sag` et tournée de `turn` (normales comprises), depuis la volée fermée `f`. */
function swingPosed(s: BridgeSite, f: Facets, sag: number, turn: number): Facets {
  const positions = new Float32Array(f.positions.length);
  const normals = new Float32Array(f.normals.length);
  const pivot = swingPivot(s);
  const r = swingTurn(sag, turn, { cs: 1, ss: 0, ct: 1, st: 0 });
  for (let i = 0; i < f.positions.length; i += 3) {
    swingMove(s, pivot, r, f.positions[i], f.positions[i + 1], f.positions[i + 2], positions, i);
    swingMove(s, pivot, r, f.normals[i], f.normals[i + 1], f.normals[i + 2], normals, i, true);
  }
  return { positions, normals, colors: f.colors, triangles: f.triangles };
}

/**
 * La volée de la ruine : entière, rouillée, restée ouverte en biais sur son tambour (`SWING.open`), couchée au-dessus de
 * l'eau du bassin, au nord du pont, son bout libre affaissé, le bas de ses poutres dans l'eau ; ses garde-corps tombés
 * à part (`swingRuinRails`), ni lanternes : ceux du pont rebâti montent du tablier à la pose. L'eau reste libre entre les
 * culées, sous le cadenas.
 */
export const swingRuin = (s: BridgeSite): Facets => swingPosed(s, swingDeck(s, true), SWING.sag, SWING.open);

/** Les garde-corps tombés de la volée de la ruine, couchés avec elle (hors de la pose). */
const swingRuinRails = (s: BridgeSite): Facets => swingPosed(s, swingFallenRails(s), SWING.sag, SWING.open);

/** La volée rouillée, fermée : ses couleurs sont celles d'où part le fondu de la pose (./bridgeLay.ts). */
export const swingRustDeck = (land: LinkedLand): Facets => swingDeck(bridgeSite(land), true);

/** Le pont tournant rebâti, sans ses culées ni son tambour : la volée (`deck`), ses garde-corps de fer et ses quatre lanternes (`rails`). */
function swingParts(s: BridgeSite): BridgeParts {
  const b = new FacetBuilder();
  railings(b, s, SWING.post, 0.12, SWING_IRON.iron);
  lanterns(b, s, SWING_IRON.iron, true);
  return { piles: [], deck: swingDeck(s, false), rails: b.build() };
}

/** Le passage d'une terre est-il l'arche de basalte de la coulée (au 4e) ? */
const isBasaltArch = (land: LinkedLand): boolean => isLand4e(land) && LINKS_4E[land].cut === 'coulee';

/**
 * L'arche de basalte tombée en partie, sur la coulée du 4e (GD-24, « Avant de relier » ; retouche 1 du lot 1, directeur
 * artistique : sa ruine à elle, pas celle des deux autres ponts) : ses deux culées de basalte, chacune avec le départ de
 * son arche, long du côté des Fabriques, court du côté de l'Épaule ; le parapet plein des deux côtés de chaque culée ;
 * entre les deux, le tablier manque, et trois claveaux tombés gisent sur la croûte. Rien n'y est de la lave.
 */
function fallenArch(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  abutments(b, s);
  const span = s.water[1] - s.water[0];
  archStart(b, s, s.water[0] + BRIDGE.over, 1, span * 0.36, [1, 0.8, 0.62]);
  archStart(b, s, s.water[1] - BRIDGE.over, -1, span * 0.18, [0.7, 1, 0.85]);
  const at = frame(s);
  const S = stoneOf(s);
  // Le parapet plein, sur chaque culée, des deux côtés : un mur bas qui suit la rampe.
  for (const [d0, d1] of [
    [s.abut[0] + 0.6, s.water[0] + BRIDGE.over + span * 0.3],
    [s.water[1] - BRIDGE.over - span * 0.12, s.abut[1] - 0.6],
  ] as const)
    for (const v of [-(BRIDGE.abutHalf - 0.3), BRIDGE.abutHalf - 0.3]) {
      const top = (d: number) => (d <= s.water[0] + BRIDGE.over ? abutTop(s, 0, d) : d >= s.water[1] - BRIDGE.over ? abutTop(s, 1, d) : BRIDGE.deck - 0.1 - ARCH.tilt * Math.abs(d - (d < (s.water[0] + s.water[1]) / 2 ? s.water[0] + BRIDGE.over : s.water[1] - BRIDGE.over)));
      const a = at(d0, v),
        c = at(d1, v);
      b.beam({ x: a.x, y: top(d0) + ARCH_PARAPET.height / 2, z: a.z }, { x: c.x, y: top(d1) + ARCH_PARAPET.height / 2, z: c.z }, ARCH_PARAPET.height, S.stone);
    }
  // Les claveaux tombés, sur la croûte, au milieu de la coulée.
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  ARCH_FALLEN.forEach(([u, v, size, turn, tilt]) => {
    const p = at(s.water[0] + span * u, v);
    b.box({ x: p.x, y: worldOf(s.land).height(p) - 0.35, z: p.z, yaw: yaw + turn, pitch: tilt }, [size * 1.4, size * 0.9, size], S.stone, S.stoneTop);
  });
  return b.build();
}

/** Le parapet de l'arche : sa hauteur (et son épaisseur) au-dessus du dessus de la culée. */
const ARCH_PARAPET = { height: 0.7 } as const;

/** Les claveaux tombés de l'arche : leur place (en part de la coulée, puis en travers), leur taille, leur cap, leur bascule. */
const ARCH_FALLEN: readonly (readonly [number, number, number, number, number])[] = [
  [0.45, -0.6, 1.1, 0.4, 0.3],
  [0.58, 0.9, 0.9, 1.3, -0.25],
  [0.7, -0.2, 0.8, 2.2, 0.15],
];

/** Les deux moignons d'un pont tombé : la hauteur de leurs quatre coins, et la pointe de leur cassure. */
const STUMPS = [
  { corners: [1.2, 0.65, 0.7, 1.15], peak: [-0.8, 0.7, 1.2] },
  { corners: [0.65, 1.1, 1.2, 0.75], peak: [0.7, -0.6, 1.2] },
] as const;

/** Le haut moyen d'un moignon au-dessus de l'eau : une pile qui se relève à sa place part de là. */
export const STUMP_TOP = (STUMPS[0].corners.reduce((a, c) => a + c, 0) + STUMPS[1].corners.reduce((a, c) => a + c, 0)) / 8;

/** Les piles d'un pont qui prennent la place d'un moignon : la première et la dernière. */
export const stumpPile = (land: LinkedLand, k: number): boolean => k === 0 || k === pilesOf(bridgeSite(land)).length - 1;

/**
 * Le pont sur la Carte (référent dys : la coupure bleue nette, et le pont en trait double, d'une autre forme que le
 * tiret d'un chemin) : deux traits clairs bordés de Nuit océan, d'une culée à l'autre, levés au-dessus du tablier pour
 * se lire de haut.
 */
export function bridgeMapMark(land: LinkedLand): Facets {
  const b = new FacetBuilder();
  const s = bridgeSite(land);
  const at = frame(s);
  // La cabine monte : son trait suit son rail, levé de même.
  const cabin = isCabin(land);
  const yAt = (d: number) => (cabin ? cabinRail(s, Math.min(s.abut[1], Math.max(s.abut[0], d))) : BRIDGE.deck) + 1.5;
  const strip = (v: number, half: number, lift: number, color: number) => {
    const d0 = s.abut[0] - half * 0.5;
    const d1 = s.abut[1] + half * 0.5;
    const p = (d: number, o: number) => {
      const q = at(d, v + o);
      return [q.x, yAt(d) + lift, q.z] as const;
    };
    b.quad(p(d0, half), p(d1, half), p(d1, -half), p(d0, -half), color);
  };
  for (const v of [-1.5, 1.5]) {
    strip(v, 0.75, 0, 0x142b38);
    strip(v, 0.42, 0.05, 0xf2dfb4);
  }
  return b.build();
}

// ---------- La cabine de la Montée (le 5e, GD-22, lot 2) ----------

/**
 * La cabine (artiste technique 3D) : l'écart de ses deux rails, leur section, l'écart des chevalets qui les portent,
 * la taille de la cabine (largeur, hauteur, longueur), celle des deux gares.
 */
const CABIN = { width: 2.4, gauge: 0.9, rail: 0.22, trestle: 5, box: [2.2, 2, 2.6], station: [4.2, 0.5, 4] } as const;

/**
 * Les couleurs de la cabine : le bois des chevalets, des gares et du plancher de la caisse, le fer des rails (un gris
 * chaud), la caisse de bronze et son toit. Le bois est celui du rail neuf de la Montée (montee5e.ts, `newWood` et
 * `newShade`) : sous la lumière chaude du 5e, un brun désaturé autour de #A87A50 à l'écran (seconde relecture du lot 3 :
 * #C6955F et #A9784A y donnaient un orange vif) ; l'orange reste aux lanternes et à la lueur.
 */
const CABIN_COLORS = { wood: 0x8c766a, woodTop: 0xa68672, rail: 0x7d7468, body: 0x9c8452, roof: 0x6f8089, broken: 0x8a8273 } as const;

/** Le dessus du rail de la cabine à `d` unités de `near` : en ligne droite du pied (sur le sol) au haut (sur le plateau). */
function cabinRail(s: BridgeSite, d: number): number {
  const u = Math.min(1, Math.max(0, (d - s.abut[0]) / (s.abut[1] - s.abut[0])));
  return s.base[0] + 0.1 + (s.base[1] - s.base[0]) * u;
}

/** Les deux gares : une dalle de bois au pied du rail, une autre en haut, sur le plateau. */
function cabinStations(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const [w, h, l] = CABIN.station;
  for (const [d, base] of [
    [s.abut[0] - l / 2, s.base[0]],
    [s.abut[1] + l / 2, s.base[1]],
  ] as const) {
    const p = at(d, 0);
    b.box({ x: p.x, y: base - 0.6, z: p.z, yaw }, [w, h + 0.6, l], CABIN_COLORS.wood, CABIN_COLORS.woodTop);
  }
  return b.build();
}

/** Les rails de `from` à `to` (en unités depuis `near`), les chevalets dessous, du sol au rail. */
function cabinTrack(rails: FacetBuilder, posts: FacetBuilder, s: BridgeSite, from: number, to: number): void {
  const at = frame(s);
  const ground = worldOf(s.land).height;
  for (const v of [-CABIN.gauge, CABIN.gauge]) {
    const a = at(from, v);
    const c = at(to, v);
    rails.beam({ x: a.x, y: cabinRail(s, from) + 0.1, z: a.z }, { x: c.x, y: cabinRail(s, to) + 0.1, z: c.z }, CABIN.rail, CABIN_COLORS.rail);
  }
  const n = Math.max(1, Math.floor((to - from) / CABIN.trestle));
  for (let k = 0; k <= n; k++) {
    const d = from + ((to - from) * k) / n;
    const top = cabinRail(s, d);
    const p = at(d, 0);
    const low = ground(p);
    if (top - low < 0.8) continue;
    for (const v of [-CABIN.gauge, CABIN.gauge]) {
      const q = at(d, v);
      posts.beam({ x: q.x, y: low - 0.5, z: q.z }, { x: q.x, y: top, z: q.z }, 0.3, CABIN_COLORS.wood);
    }
  }
}

/**
 * La caisse de la cabine (GD-22, lot 3 : une seule caisse, celle du passage) : un plancher toujours de niveau, ouvert aux
 * deux bouts (Kéo y entre au pied, en ressort en haut), deux murets sur les côtés, quatre poteaux et un toit à deux pans ;
 * dessous, son châssis en coin, qui épouse la pente du rail. `half` : sa demi-longueur le long du rail ; `floor` : le
 * plancher au-dessus du rail, à son bout du haut ; `wall`, `posts` : la hauteur des murets et des poteaux, sous le toit
 * (première relecture du lot 3 : la tête de Kéo, 2,4 unités debout, passait dans le toit ; il y tient avec une demi-unité
 * de marge, `KEO_ROOM`).
 */
export const CABIN_CAR = { half: 0.8, width: 2, floor: 0.3, plank: 0.12, wall: 0.85, posts: 2.95 } as const;

/** La hauteur de Kéo debout dans la caisse (ses cheveux compris) : le toit commence au moins une demi-unité plus haut. */
export const KEO_ROOM = 2.45;

/** Le haut d'un rail par unité de longueur : la pente de la cabine. */
const cabinSlope = (s: BridgeSite): number => (s.base[1] - s.base[0]) / (s.abut[1] - s.abut[0]);

/**
 * Le plancher de la caisse dont le milieu est à `d` sur la ligne de la cabine : au-dessus du rail à son bout du haut
 * (le rail ne la traverse jamais) ; au pied, posée sur la gare, au ras du sol.
 */
export function cabinCarFloor(s: BridgeSite, d: number): number {
  return cabinRail(s, d + CABIN_CAR.half) + CABIN_CAR.floor;
}

/**
 * Les deux arrêts de la caisse, sur la ligne de la cabine : au pied, son bout du haut au départ du rail (elle repose sur
 * la gare) ; en haut, son bout du haut à la fin du rail, contre la gare du plateau.
 */
export function cabinStops(s: BridgeSite): { bottom: number; top: number } {
  return { bottom: s.abut[0] - CABIN_CAR.half + 0.1, top: s.abut[1] - CABIN_CAR.half };
}

/** Le point de la ligne de la cabine à `d` (son axe). */
export const cabinPoint = (s: BridgeSite, d: number): Vec2 => frame(s)(d, 0);

/** Le cap de la caisse (son avant vers le haut du rail), comme celui d'un objet posé (`placeFacets`). */
export const cabinYaw = (s: BridgeSite): number => Math.atan2(s.dir.x, s.dir.z);

/**
 * La caisse seule, dans son repère : le milieu de son plancher en 0, son avant (le haut du rail) vers +z. Son châssis
 * descend jusqu'au rail, au bout du bas, selon la pente `slope`. Environ 150 triangles.
 */
function carFacets(slope: number, roof: boolean): Facets {
  const b = new FacetBuilder();
  const { half, width, plank, wall, posts } = CABIN_CAR;
  const w = width / 2;
  const col = CABIN_COLORS;
  // Le plancher, de niveau.
  b.box({ x: 0, y: -plank, z: 0 }, [width, plank, 2 * half], col.wood, col.woodTop);
  // Le châssis : deux longerons en pente sous chaque rail, du bout du haut (au ras du rail) au bout du bas (plus bas), et
  // les montants qui portent le plancher au bout du bas.
  const drop = slope * 2 * half;
  for (const v of [-CABIN.gauge, CABIN.gauge]) {
    b.beam({ x: v, y: -plank - 0.02, z: half }, { x: v, y: -plank - drop, z: -half }, 0.16, col.rail);
    b.beam({ x: v, y: -plank, z: -half + 0.08 }, { x: v, y: -plank - drop, z: -half + 0.08 }, 0.16, col.wood);
  }
  // Les murets des deux côtés : la porte est aux deux bouts.
  for (const x of [-w + 0.06, w - 0.06]) b.box({ x, y: 0, z: 0 }, [0.12, wall, 2 * half], col.body, col.woodTop);
  // Les quatre poteaux et le toit ; sans eux, la caisse ouverte de la gare du haut (`cabinCarOpen`).
  if (!roof) return b.build();
  for (const x of [-w + 0.06, w - 0.06]) for (const z of [-half + 0.06, half - 0.06]) b.box({ x, y: 0, z }, [0.12, posts, 0.12], col.wood);
  b.gableRoof({ x: 0, y: posts, z: 0, yaw: Math.PI / 2 }, 2 * half + 0.3, width + 0.3, 0.55, col.roof, col.body);
  return b.build();
}

const cars = new Map<string, Facets>();

/** La caisse de la cabine d'une terre, dans son repère (faite une fois) : la vue la pose et la fait rouler. `roof` : avec ses poteaux et son toit. */
export function cabinCarFacets(land: LinkedLand, roof = true): Facets {
  const k = `${land}|${roof}`;
  let f = cars.get(k);
  if (!f) cars.set(k, (f = carFacets(cabinSlope(bridgeSite(land)), roof)));
  return f;
}

/** La caisse posée à `d` sur la ligne de la cabine, dans le monde. */
function carAt(s: BridgeSite, d: number, roof = true): Facets {
  const p = cabinPoint(s, d);
  return placeFacets(cabinCarFacets(s.land, roof), { x: p.x, y: cabinCarFloor(s, d), z: p.z, yaw: cabinYaw(s) });
}

/** La caisse qui attend à sa gare (`bas` ou `haut`), dans le monde, avec son toit ou ouverte. */
export function cabinCarParked(land: LinkedLand, car: 'bas' | 'haut', roof = true): Facets {
  const s = bridgeSite(land);
  const stops = cabinStops(s);
  return carAt(s, car === 'bas' ? stops.bottom : stops.top, roof);
}

/**
 * La boîte de la caisse qui attend à sa gare (`bas` ou `haut`), dans le monde : la vue en fait la cible d'un toucher (la
 * caisse touchée lance le trajet, comme le bouton ; première relecture du lot 3).
 */
export function cabinCarBox(land: LinkedLand, car: 'bas' | 'haut'): { min: [number, number, number]; max: [number, number, number] } {
  return boundsOf(cabinCarParked(land, car));
}

/** La caisse de la ruine, couchée à côté du rail au pied. */
function lyingBox(b: FacetBuilder, s: BridgeSite, d: number): void {
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const [w, h, l] = CABIN.box;
  const p = at(d, CABIN.width + 1.2);
  const y = worldOf(s.land).height(p) - 0.3;
  b.box({ x: p.x, y, z: p.z, yaw: yaw + 0.5, pitch: 0.25 }, [h, w, l], CABIN_COLORS.body, CABIN_COLORS.broken);
}

/** La cabine reliée, sans ses gares : les chevalets (`piles`), les rails (`deck`), la caisse au pied (`rails`). */
function cabinParts(s: BridgeSite): BridgeParts {
  const rails = new FacetBuilder();
  const posts = new FacetBuilder();
  cabinTrack(rails, posts, s, s.abut[0], s.abut[1]);
  return { piles: [posts.build()], deck: rails.build(), rails: carAt(s, cabinStops(s).bottom) };
}

/**
 * La cabine tombée : ses deux gares ; le rail cassé, son bas jusqu'aux deux cinquièmes de la montée, son haut depuis les
 * trois quarts, le vide entre les deux ; la caisse couchée au pied, à côté du rail.
 */
function fallenCabin(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  b.append(cabinStations(s));
  const posts = new FacetBuilder();
  const span = s.abut[1] - s.abut[0];
  cabinTrack(b, posts, s, s.abut[0], s.abut[0] + span * 0.4);
  cabinTrack(b, posts, s, s.abut[0] + span * 0.75, s.abut[1]);
  b.append(posts.build());
  lyingBox(b, s, s.abut[0] + 1);
  return b.build();
}
