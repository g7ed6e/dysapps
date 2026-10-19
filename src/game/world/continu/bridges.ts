// Les ponts des terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre
// 2026) : un pont par bras de mer, sur la liaison du réseau qui le passe (./lands.ts, `bridgeEdge`). Avant : le chemin
// finit sur une culée de pierre, un départ d'arche brisé, deux moignons de piles debout dans l'eau, la culée jumelle en
// face ; Kéo s'arrête sur la culée, sans heurt ni son (`clampToOpen`). Après (ce lot : posé d'un coup) : pierre et bois,
// de la famille des quais de l'Escale (concept retenu, ligne 3) : les culées, trois ou quatre piles maçonnées, le tablier à
// 1,9 au-dessus de l'eau, ses garde-corps, une lanterne de chaque côté de chaque culée ; Kéo marche sur la pierre et
// sur le tablier (`bridgeFloor`). Tout entre dans le maillage des lieux, sans appel de plus ; sur la Carte, le pont se
// dessine aussi en trait double, distinct d'un chemin. Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { bridgeEdge, firstClosed, isLinkedLand, linkedLands, nodeLands, planOfLand, startLandOf, type LinkedLand } from './lands';
import { planFor, type LevelPlan } from './levelPlan';
import { bridgeCut, pathNode, type NetworkPoint } from './paths';
import { NETWORK_5E, isLand5e, passageCut } from './paths5e';
import { LINKS_5E } from './plan5e';
import type { StraitId } from './plan6e';
import { heightAt, standingHeight, straitClearance } from './terrain';
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
} as const;

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
  node(id: string): Vec2;
  clearance(p: Vec2, land: LinkedLand): number;
  cut(a: Vec2, c: Vec2, land: LinkedLand): readonly [number, number];
  height(p: Vec2): number;
}

const WORLD_6E: BridgeWorld = {
  node: (id) => pathNode(id).at,
  clearance: (p, land) => straitClearance(p, land as StraitId),
  cut: (a, c, land) => bridgeCut(a, c, land as StraitId),
  height: heightAt,
};

/** Hors d'un chenal (la cabine), aucune eau : la distance est toujours positive. */
const DRY = 1e9;

const WORLD_5E: BridgeWorld = {
  node: (id) => NETWORK_5E.pathNode(id).at,
  clearance: (p, land) => {
    const channel = isLand5e(land) ? LINKS_5E[land].channel : null;
    return channel ? channelClearance(p, channel) : DRY;
  },
  cut: (a, c, land) => (isLand5e(land) ? passageCut(a, c, land) : [0, 0]),
  height: heightAt5e,
};

const worldOf = (land: LinkedLand): BridgeWorld => (planOfLand(land).level === '5e' ? WORLD_5E : WORLD_6E);

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
    if (d < s.abut[0] || d > s.abut[1]) continue;
    const v = Math.abs(-dx * s.dir.z + dz * s.dir.x);
    if (isCabin(land)) {
      // La cabine reliée : Kéo monte sur son rail, en ligne droite de son pied à son haut, jamais sous le sol.
      if (closed.includes(land) || v > CABIN.width / 2 + 0.2) continue;
      const y = Math.max(cabinRail(s, d), standingHeight(worldOf(land).height({ x, z })));
      top = top === null ? y : Math.max(top, y);
      continue;
    }
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
  slab(b, s, s.abut[0], s.water[0] + BRIDGE.over, BRIDGE.abutHalf, abutTop(s, 0, s.abut[0]), BRIDGE.deck, C.stone, C.stoneTop);
  slab(b, s, s.water[1] - BRIDGE.over, s.abut[1], BRIDGE.abutHalf, BRIDGE.deck, abutTop(s, 1, s.abut[1]), C.stone, C.stoneTop);
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
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    // Les faces regardent vers le dehors : le tour se fait dans le sens qui les tourne vers l'extérieur.
    b.quad(p(n, BRIDGE.foot), p(k, BRIDGE.foot), p(k, wet), p(n, wet), C.wet);
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
    b.quad(p(u0, L, top(u0)), p(u1, L, top(u1)), p(u1, R, top(u1)), p(u0, R, top(u0)), C.stoneTop);
    b.quad(p(u0, R, under(u0)), p(u1, R, under(u1)), p(u1, L, under(u1)), p(u0, L, under(u0)), C.wet);
    if (lOut) b.quad(p(u0, L, under(u0)), p(u1, L, under(u1)), p(u1, L, top(u1)), p(u0, L, top(u0)), C.stone);
    if (rOut) b.quad(p(u1, R, under(u1)), p(u0, R, under(u0)), p(u0, R, top(u0)), p(u1, R, top(u1)), C.stone);
    if (end) b.quad(p(u1, L, under(u1)), p(u1, R, under(u1)), p(u1, R, top(u1)), p(u1, L, top(u1)), C.broken);
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
      b.quad(p(solid, L, under(solid)), p(solid, R, under(solid)), p(solid, R, top(solid)), p(solid, L, top(solid)), C.broken);
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
export const bridgeLayRest = (land: LinkedLand): Facets => (isCabin(land) ? cabinStations(bridgeSite(land)) : abutmentFacets(bridgeSite(land), true));

/**
 * Les morceaux d'un pont rebâti, sans ses culées : les piles maçonnées, de l'eau jusque sous le tablier (leurs assises,
 * chacune un peu en retrait de celle du dessous tour à tour : les joints se lisent, le pied sombre, puis leur chaperon) ;
 * le tablier de planches sur ses deux longerons ; les garde-corps et les quatre lanternes.
 */
export function bridgeParts(land: LinkedLand): BridgeParts {
  const s = bridgeSite(land);
  if (isCabin(land)) return cabinParts(s);
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const pileTop = BRIDGE.deck - BRIDGE.plank - 0.24;
  const piles = pilesOf(s).map((d) => {
    const b = new FacetBuilder();
    const p = at(d, 0);
    b.box({ x: p.x, y: BRIDGE.foot, z: p.z, yaw }, [PILE.side, PILE.wet - BRIDGE.foot, PILE.side], C.wet);
    const course = (pileTop - 0.18 - PILE.wet) / PILE.courses;
    for (let k = 0; k < PILE.courses; k++) {
      const side = PILE.side - (k % 2 ? PILE.inset : 0);
      b.box({ x: p.x, y: PILE.wet + k * course, z: p.z, yaw }, [side, course, side], k % 2 ? C.pile : C.stone);
    }
    b.box({ x: p.x, y: pileTop - 0.18, z: p.z, yaw }, [PILE.side + 0.3, 0.18, PILE.side + 0.3], C.stone, C.stoneTop);
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
  const from = s.abut[0] + 0.5;
  const to = s.abut[1] - 0.5;
  const n = Math.max(2, Math.ceil((to - from) / BRIDGE.post) + 1);
  for (const v of [-BRIDGE.railOut, BRIDGE.railOut]) {
    let last: { x: number; y: number; z: number } | null = null;
    for (let k = 0; k < n; k++) {
      const d = from + ((to - from) * k) / (n - 1);
      const p = at(d, v);
      const y = bridgeSurface(s, d);
      b.box({ x: p.x, y, z: p.z, yaw }, [0.16, BRIDGE.rail, 0.16], C.rail);
      const head = { x: p.x, y: y + BRIDGE.rail - 0.06, z: p.z };
      if (last) b.beam(last, head, 0.12, C.rail);
      last = head;
    }
  }
  // Les lanternes, de chaque côté de chaque culée, au début du garde-corps : un mât de fer, puis une tête qu'on lit
  // (directeur artistique) : son socle, le verre Sable dans sa cage de fer (deux barreaux en croix sur chaque face), son
  // chapeau en pointe.
  for (const d of [s.abut[0] + 0.5, s.abut[1] - 0.5])
    for (const v of [-(BRIDGE.railOut + 0.35), BRIDGE.railOut + 0.35]) {
      const p = at(d, v);
      const y = bridgeSurface(s, d);
      b.box({ x: p.x, y, z: p.z, yaw }, [0.14, 1.6, 0.14], C.iron);
      b.box({ x: p.x, y: y + 1.6, z: p.z, yaw }, [0.46, 0.08, 0.46], C.iron);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.36, 0.44, 0.36], C.glass);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.42, 0.44, 0.07], C.iron);
      b.box({ x: p.x, y: y + 1.68, z: p.z, yaw }, [0.07, 0.44, 0.42], C.iron);
      b.prism({ x: p.x, y: y + 2.12, z: p.z, yaw: yaw + Math.PI / 4 }, 0.36, 0, 0.32, 4, C.iron);
    }
  return { piles, deck: deck.build(), rails: b.build() };
}

/**
 * Un pont pas encore rebâti (`before`) : les deux culées ; de chaque côté, un départ d'arche brisé, plus court côté
 * terre fermée ; deux moignons debout, de la section des piles, à leur place, cassés en biais. Rebâti : les culées, les
 * piles maçonnées, le tablier de planches, les garde-corps et les quatre lanternes (`bridgeParts`). Un seul maillage,
 * réuni à celui des lieux.
 */
export function bridgeFacets(land: LinkedLand, built: boolean): Facets {
  const s = bridgeSite(land);
  if (isCabin(land)) {
    if (!built) return fallenCabin(s);
    const parts = cabinParts(s);
    return mergeFacets([cabinStations(s), ...parts.piles, parts.deck, parts.rails]);
  }
  if (built) {
    const parts = bridgeParts(land);
    return mergeFacets([abutmentFacets(s, false), ...parts.piles, parts.deck, parts.rails]);
  }
  const b = new FacetBuilder();
  b.append(abutmentFacets(s, true));
  // Les deux moignons, de 0,7 à 1,2 au-dessus de l'eau, le dessus cassé en biais (la pierre brute, plus sombre que le
  // dessus des culées), sans dalle à plat.
  const h = PILE.side / 2;
  const [first, last] = stumpsOf(s);
  shaft(b, s, first, h, STUMPS[0].corners, STUMPS[0].peak, C.pile, C.broken);
  shaft(b, s, last, h, STUMPS[1].corners, STUMPS[1].peak, C.pile, C.broken);
  return b.build();
}

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

/** Les couleurs de la cabine : le bois des chevalets et des gares, le fer des rails (un gris chaud), la caisse de bronze et son toit. */
const CABIN_COLORS = { wood: 0xa9784a, woodTop: 0xc6955f, rail: 0x7d7468, body: 0x9c8452, roof: 0x6f8089, broken: 0x8a8273 } as const;

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

/** La caisse de la cabine, posée à `d` sur le rail, ou couchée à côté (`lying`). */
function cabinBox(b: FacetBuilder, s: BridgeSite, d: number, lying: boolean): void {
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const [w, h, l] = CABIN.box;
  if (lying) {
    const p = at(d, CABIN.width + 1.2);
    const y = worldOf(s.land).height(p) - 0.3;
    b.box({ x: p.x, y, z: p.z, yaw: yaw + 0.5, pitch: 0.25 }, [h, w, l], CABIN_COLORS.body, CABIN_COLORS.broken);
    return;
  }
  const p = at(d, 0);
  const y = cabinRail(s, d) + 0.25;
  b.box({ x: p.x, y, z: p.z, yaw }, [w, h, l], CABIN_COLORS.body);
  b.gableRoof({ x: p.x, y: y + h, z: p.z, yaw: yaw + Math.PI / 2 }, l + 0.3, w + 0.3, 0.7, CABIN_COLORS.roof, CABIN_COLORS.body);
}

/** La cabine reliée, sans ses gares : les chevalets (`piles`), les rails (`deck`), la caisse au pied (`rails`). */
function cabinParts(s: BridgeSite): BridgeParts {
  const rails = new FacetBuilder();
  const posts = new FacetBuilder();
  cabinTrack(rails, posts, s, s.abut[0], s.abut[1]);
  const box = new FacetBuilder();
  cabinBox(box, s, s.abut[0] + CABIN.box[2], false);
  return { piles: [posts.build()], deck: rails.build(), rails: box.build() };
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
  cabinBox(b, s, s.abut[0] + 1, true);
  return b.build();
}
