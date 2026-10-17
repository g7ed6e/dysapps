// Les ponts des terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre
// 2026) : un pont par bras de mer, sur la liaison du réseau qui le passe (./lands.ts, `bridgeEdge`). Avant : le chemin
// finit sur une culée de pierre, un départ d'arche brisé, deux moignons de piles dans l'eau, la culée jumelle en face ;
// Kéo s'arrête sur la culée, sans heurt ni son (`clampToOpen`). Après (ce lot : posé d'un coup) : pierre et bois, de la
// famille des quais de l'Escale (concept retenu, ligne 3) : les culées, deux piles de pierre, le tablier de planches à
// 1,9 au-dessus de l'eau, ses garde-corps, une lanterne de chaque côté de chaque culée ; Kéo marche sur la pierre et
// sur le tablier (`bridgeFloor`). Tout entre dans le maillage des lieux, sans appel de plus ; sur la Carte, le pont se
// dessine aussi en trait double, distinct d'un chemin. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { LINKED_LANDS, bridgeEdge, firstClosed, NODE_LANDS, START_LAND, type LinkedLand } from './lands';
import { bridgeCut, pathNode, type NetworkPoint } from './paths';
import { PATH_EDGES, STRAITS } from './plan6e';
import { heightAt, standingHeight, straitClearance } from './terrain';

/**
 * Le pont (artiste technique 3D) : le dessus du tablier au-dessus de l'eau ; sa largeur ; le débord des culées sur l'eau ;
 * la demi-largeur des culées ; le bas de la pierre, sous l'eau ; l'épaisseur des planches ; l'écart des poteaux des
 * garde-corps, leur hauteur et leur écart à l'axe.
 */
export const BRIDGE = { deck: 1.9, width: 3.2, over: 0.5, abutHalf: 2.1, foot: -1.6, plank: 0.14, post: 1.7, rail: 1.0, railOut: 1.5 } as const;

/** Les couleurs du pont : la pierre des quais de l'Escale, son dessus plus clair ; le bois du tablier et des garde-corps ; les lanternes. */
const C = {
  stone: 0xb9b2a3,
  stoneTop: 0xd8d1c2,
  pile: 0xa39b8c,
  wood: 0xa9784a,
  woodTop: 0xc6955f,
  rail: 0x8a5f3a,
  iron: 0x3f4a50,
  glass: 0xf2dfb4,
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

const sites = new Map<LinkedLand, BridgeSite>();

/** Le pont d'une terre (calculé une fois). */
export function bridgeSite(land: LinkedLand): BridgeSite {
  const known = sites.get(land);
  if (known) return known;
  const edge = bridgeEdge(land);
  const [a, b] = STRAITS[land].bridge;
  const nearEnd: 0 | 1 = PATH_EDGES[edge][0] === a ? 0 : 1;
  const near = pathNode(a).at;
  const far = pathNode(b).at;
  const length = distance(near, far);
  const dir = { x: (far.x - near.x) / length, z: (far.z - near.z) / length };
  const at = (d: number): Vec2 => ({ x: near.x + dir.x * d, z: near.z + dir.z * d });
  // L'eau sur la ligne du chemin, de rive à rive.
  let w0 = length;
  let w1 = 0;
  for (let d = 0; d <= length; d += 0.05) {
    if (straitClearance(at(d), land) >= 0) continue;
    w0 = Math.min(w0, d);
    w1 = Math.max(w1, d);
  }
  const abut = bridgeCut(near, far, land);
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
    base: [standingHeight(heightAt(at(abut[0]))), standingHeight(heightAt(at(abut[1])))],
    stop: { edge, t, at: at(stopD) },
    mid: at((w0 + w1) / 2),
  };
  sites.set(land, site);
  return site;
}

/** Les quatre ponts, dans l'ordre des terres. */
export const allBridges = (): BridgeSite[] => LINKED_LANDS.map(bridgeSite);

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
export function bridgeFloor(x: number, z: number, closed: readonly LinkedLand[]): number | null {
  let top: number | null = null;
  for (const land of LINKED_LANDS) {
    const s = bridgeSite(land);
    const dx = x - s.near.x;
    const dz = z - s.near.z;
    const d = dx * s.dir.x + dz * s.dir.z;
    if (d < s.abut[0] || d > s.abut[1]) continue;
    const v = Math.abs(-dx * s.dir.z + dz * s.dir.x);
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
export function clampToOpen(p: NetworkPoint, closed: readonly LinkedLand[]): NetworkPoint {
  if (!closed.length) return p;
  for (const land of closed) {
    const s = bridgeSite(land);
    if (p.edge !== s.edge) continue;
    const first = firstClosed(land, closed);
    if (first !== land) return bridgeSite(first).stop;
    const beyond = s.nearEnd === 0 ? p.t > s.stop.t : p.t < s.stop.t;
    return beyond ? s.stop : p;
  }
  const land = NODE_LANDS.get(PATH_EDGES[p.edge][0]) ?? START_LAND;
  return land !== START_LAND && closed.includes(land) ? bridgeSite(firstClosed(land, closed)).stop : p;
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

/** Les deux piles, au tiers et aux deux tiers de l'eau (leur pied et leur part). */
const pilesOf = (s: BridgeSite): number[] => [1 / 3, 2 / 3].map((k) => s.water[0] + (s.water[1] - s.water[0]) * k);

/**
 * Un pont pas encore rebâti (`before`) : les deux culées ; de chaque côté, un départ d'arche brisé, une pierre penchée
 * vers l'eau ; deux moignons de piles qui affleurent. Rebâti : les culées, les piles, le tablier de planches, les
 * garde-corps et les quatre lanternes. Un seul maillage, réuni à celui des lieux.
 */
export function bridgeFacets(land: LinkedLand, built: boolean): Facets {
  const b = new FacetBuilder();
  const s = bridgeSite(land);
  const at = frame(s);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  abutments(b, s);
  if (!built) {
    // Le départ d'arche brisé : de chaque culée, une pierre qui avance sur l'eau et s'arrête net, penchée.
    for (const [from, sign] of [
      [s.water[0] + BRIDGE.over, 1],
      [s.water[1] - BRIDGE.over, -1],
    ] as const) {
      const a = at(from, 0);
      const c = at(from + sign * 1.6, 0.3 * sign);
      b.beam({ x: a.x, y: BRIDGE.deck - 0.45, z: a.z }, { x: c.x, y: BRIDGE.deck - 1.05, z: c.z }, 0.9, C.pile);
    }
    // Les moignons des piles, à peine hors de l'eau, leur cassure de biais.
    for (const [k, d] of pilesOf(s).entries()) {
      const p = at(d, 0);
      b.box({ x: p.x, y: BRIDGE.foot, z: p.z, yaw }, [BRIDGE.width + 0.4, -BRIDGE.foot + 0.35 + 0.15 * k, 1.1], C.pile, C.stoneTop);
    }
    return b.build();
  }
  // Les piles, jusque sous le tablier, et leur chaperon.
  for (const d of pilesOf(s)) {
    const p = at(d, 0);
    b.box({ x: p.x, y: BRIDGE.foot, z: p.z, yaw }, [BRIDGE.width + 0.4, BRIDGE.deck - 0.4 - BRIDGE.foot, 1.1], C.pile, C.stoneTop);
    b.box({ x: p.x, y: BRIDGE.deck - 0.4, z: p.z, yaw }, [BRIDGE.width + 0.6, 0.18, 1.3], C.stone, C.stoneTop);
  }
  // Le tablier : deux longerons sous cinq planches jointives, d'une culée à l'autre.
  const d0 = s.water[0] + BRIDGE.over - 0.3;
  const d1 = s.water[1] - BRIDGE.over + 0.3;
  for (const v of [-1, 1]) {
    const a = at(d0, v * 1.1);
    const c = at(d1, v * 1.1);
    b.beam({ x: a.x, y: BRIDGE.deck - BRIDGE.plank - 0.12, z: a.z }, { x: c.x, y: BRIDGE.deck - BRIDGE.plank - 0.12, z: c.z }, 0.24, C.rail);
  }
  const planks = 5;
  const w = BRIDGE.width / planks;
  for (let k = 0; k < planks; k++) {
    const p = at((d0 + d1) / 2, -BRIDGE.width / 2 + w / 2 + k * w);
    b.box({ x: p.x, y: BRIDGE.deck - BRIDGE.plank, z: p.z, yaw }, [w - 0.03, BRIDGE.plank, d1 - d0], C.wood, C.woodTop);
  }
  // Les garde-corps : des poteaux d'une culée à l'autre, une main courante qui suit la rampe des culées.
  const from = s.abut[0] + 0.5;
  const to = s.abut[1] - 0.5;
  const n = Math.max(2, Math.ceil((to - from) / BRIDGE.post) + 1);
  const surface = (d: number) => (d <= s.water[0] + BRIDGE.over ? abutTop(s, 0, d) : d >= s.water[1] - BRIDGE.over ? abutTop(s, 1, d) : BRIDGE.deck);
  for (const v of [-BRIDGE.railOut, BRIDGE.railOut]) {
    let last: { x: number; y: number; z: number } | null = null;
    for (let k = 0; k < n; k++) {
      const d = from + ((to - from) * k) / (n - 1);
      const p = at(d, v);
      const y = surface(d);
      b.box({ x: p.x, y, z: p.z, yaw }, [0.16, BRIDGE.rail, 0.16], C.rail);
      const head = { x: p.x, y: y + BRIDGE.rail - 0.06, z: p.z };
      if (last) b.beam(last, head, 0.12, C.rail);
      last = head;
    }
  }
  // Les lanternes, de chaque côté de chaque culée, au début du garde-corps : un mât de fer, la lanterne, son chapeau.
  for (const d of [s.abut[0] + 0.5, s.abut[1] - 0.5])
    for (const v of [-(BRIDGE.railOut + 0.35), BRIDGE.railOut + 0.35]) {
      const p = at(d, v);
      const y = surface(d);
      b.box({ x: p.x, y, z: p.z, yaw }, [0.16, 1.7, 0.16], C.iron);
      b.box({ x: p.x, y: y + 1.7, z: p.z, yaw }, [0.34, 0.4, 0.34], C.iron, C.glass);
      b.prism({ x: p.x, y: y + 2.1, z: p.z, yaw }, 0.3, 0, 0.28, 4, C.iron);
    }
  return b.build();
}

/**
 * Le pont sur la Carte (référent dys : la coupure bleue nette, et le pont en trait double, d'une autre forme que le
 * tiret d'un chemin) : deux traits clairs bordés de Nuit océan, d'une culée à l'autre, levés au-dessus du tablier pour
 * se lire de haut.
 */
export function bridgeMapMark(land: LinkedLand): Facets {
  const b = new FacetBuilder();
  const s = bridgeSite(land);
  const at = frame(s);
  const y = BRIDGE.deck + 1.5;
  const strip = (v: number, half: number, lift: number, color: number) => {
    const d0 = s.abut[0] - half * 0.5;
    const d1 = s.abut[1] + half * 0.5;
    const p = (d: number, o: number) => {
      const q = at(d, v + o);
      return [q.x, y + lift, q.z] as const;
    };
    b.quad(p(d0, half), p(d1, half), p(d1, -half), p(d0, -half), color);
  };
  for (const v of [-1.5, 1.5]) {
    strip(v, 0.75, 0, 0x142b38);
    strip(v, 0.42, 0.05, 0xf2dfb4);
  }
  return b.build();
}
