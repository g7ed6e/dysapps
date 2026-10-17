// Les chemins aimantés (piste B) : le réseau des sentiers, de la digue et des pontons du 6e, le point du réseau le plus
// proche d'un toucher, et le plus court trajet de l'un à l'autre (A*). Le dessin des chemins (un ruban posé sur le sol,
// en bois sur l'eau) est tiré d'ici aussi. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { closestOnSegment, distance, type Vec2 } from './geometry';
import { BRIDGE_ABUT, COLORS_6E, DOCK_EDGE, FERRY_ISLET, PATH_EDGES, PATH_NODES, STRAITS, portFloor, type PathNode, type StraitId } from './plan6e';
import { lookoutRampWall } from './lookout';
import { standingHeight, straitClearance } from './terrain';

/** Un point du réseau : sur la liaison `edge` (son rang dans `PATH_EDGES`), à la part `t` de son premier nœud au second. */
export interface NetworkPoint {
  edge: number;
  t: number;
  at: Vec2;
}

const nodeById = new Map<string, PathNode>(PATH_NODES.map((n) => [n.id, n]));

/** Un nœud par son identifiant. */
export const pathNode = (id: string): PathNode => {
  const n = nodeById.get(id);
  if (!n) throw new Error(`Nœud inconnu : ${id}`);
  return n;
};

const ends = (edge: number): [PathNode, PathNode] => [pathNode(PATH_EDGES[edge][0]), pathNode(PATH_EDGES[edge][1])];

/** Le point du réseau le plus proche de `p` : là où va Kéo quand on touche ailleurs que sur un chemin. */
export function snapToNetwork(p: Vec2): NetworkPoint {
  let best: NetworkPoint | null = null;
  let bestD = Infinity;
  PATH_EDGES.forEach((_, edge) => {
    const [a, b] = ends(edge);
    const c = closestOnSegment(p, a.at, b.at);
    const d = distance(p, c.point);
    if (d < bestD) {
      bestD = d;
      best = { edge, t: c.t, at: c.point };
    }
  });
  return best!;
}

/** Le point du réseau sur un nœud (la porte d'un lieu). */
export function atNode(id: string): NetworkPoint {
  const edge = PATH_EDGES.findIndex(([a, b]) => a === id || b === id);
  if (edge < 0) throw new Error(`Nœud isolé : ${id}`);
  return { edge, t: PATH_EDGES[edge][0] === id ? 0 : 1, at: pathNode(id).at };
}

/**
 * Où Kéo se tient en ouvrant le monde devant un lieu : sur le chemin qui part de sa porte, à `START_DISTANCE` unités du
 * centre du lieu (directeur artistique, piste 1, puis 12 à 14 unités au lot 2 : assez loin du Phare pour qu'on voie sa
 * lanterne, Kéo et « Y aller » ensemble), ou au bout de ce chemin s'il est plus court.
 */
export const START_DISTANCE = 14;

export function startOf(door: string, center: Vec2): NetworkPoint {
  const from = atNode(door);
  const [a, b] = ends(from.edge);
  const [near, far] = from.t === 0 ? [a.at, b.at] : [b.at, a.at];
  // Le long de la liaison, de la porte vers l'autre bout : la première part `u` à la bonne distance (par dichotomie,
  // la distance au centre croissant le long du chemin qui s'en éloigne).
  const at = (u: number): Vec2 => ({ x: near.x + (far.x - near.x) * u, z: near.z + (far.z - near.z) * u });
  if (distance(at(1), center) <= START_DISTANCE) return { edge: from.edge, t: from.t === 0 ? 1 : 0, at: far };
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (distance(at(mid), center) < START_DISTANCE) lo = mid;
    else hi = mid;
  }
  return { edge: from.edge, t: from.t === 0 ? hi : 1 - hi, at: at(hi) };
}

/**
 * Le plus court trajet sur le réseau, de `from` à `to` (A*, la distance à vol d'oiseau pour estimer le reste) : la
 * suite des points où Kéo tourne, départ et arrivée compris.
 */
export function findRoute(from: NetworkPoint, to: NetworkPoint): Vec2[] {
  if (from.edge === to.edge) return dedupe([from.at, to.at]);
  // Le graphe des nœuds, plus le départ et l'arrivée posés sur leurs liaisons.
  const START = '$depart';
  const GOAL = '$arrivee';
  const pos = new Map<string, Vec2>(PATH_NODES.map((n) => [n.id, n.at]));
  pos.set(START, from.at);
  pos.set(GOAL, to.at);
  const links = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    links.set(a, [...(links.get(a) ?? []), b]);
    links.set(b, [...(links.get(b) ?? []), a]);
  };
  PATH_EDGES.forEach(([a, b], edge) => {
    if (edge !== from.edge && edge !== to.edge) link(a, b);
  });
  for (const [id, p] of [[START, from], [GOAL, to]] as const) {
    const [a, b] = PATH_EDGES[p.edge];
    link(id, a);
    link(id, b);
  }
  const h = (id: string) => distance(pos.get(id)!, to.at);
  const g = new Map<string, number>([[START, 0]]);
  const came = new Map<string, string>();
  const open = new Set([START]);
  while (open.size) {
    let current = '';
    let f = Infinity;
    for (const id of open) {
      const v = g.get(id)! + h(id);
      if (v < f) {
        f = v;
        current = id;
      }
    }
    if (current === GOAL) {
      const route: Vec2[] = [pos.get(GOAL)!];
      for (let id = GOAL; came.has(id); ) {
        id = came.get(id)!;
        route.unshift(pos.get(id)!);
      }
      return dedupe(route);
    }
    open.delete(current);
    for (const next of links.get(current) ?? []) {
      const tentative = g.get(current)! + distance(pos.get(current)!, pos.get(next)!);
      if (tentative < (g.get(next) ?? Infinity)) {
        g.set(next, tentative);
        came.set(next, current);
        open.add(next);
      }
    }
  }
  // Le réseau est d'un seul tenant (un test le vérifie) : on n'arrive jamais ici.
  return [from.at];
}

/** Sans les points répétés (un départ sur un nœud). */
function dedupe(route: Vec2[]): Vec2[] {
  return route.filter((p, i) => i === 0 || distance(p, route[i - 1]) > 1e-6);
}

/** Des points sur tout le réseau, tous les `step` unités au plus (les nœuds compris) : là où Kéo peut se tenir. */
export function networkSamples(step: number): Vec2[] {
  const out: Vec2[] = PATH_NODES.map((n) => n.at);
  for (const [ia, ib] of PATH_EDGES) {
    const a = pathNode(ia).at;
    const b = pathNode(ib).at;
    const n = Math.max(1, Math.ceil(distance(a, b) / step));
    for (let k = 1; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n });
  }
  return out;
}

/** La longueur d'un trajet. */
export function routeLength(route: readonly Vec2[]): number {
  let l = 0;
  for (let i = 1; i < route.length; i++) l += distance(route[i - 1], route[i]);
  return l;
}

/** Les demi-largeurs du ruban : un sentier sur la terre, une digue ou un ponton sur l'eau, plus larges. */
const HALF_WIDTH = { path: 0.8, deck: 1.1 };
/** Le pas des points du ruban, le long d'une liaison : celui de la grille du terrain, pour qu'il en suive les creux. */
const RIBBON_STEP = 1.25;
/** Le dessus du ruban au-dessus du sol, et la profondeur de ses flancs. */
const RIBBON_LIFT = 0.06;
const RIBBON_SIDE = 0.7;

/**
 * L'îlot de la Gare maritime (lot L9b) : le sol y est le large (hors du terrain), le quai est modelé dans le lieu ; les
 * chemins n'y dessinent rien, ni ruban de bois ni octogone.
 */
const onFerryIslet = (p: Vec2): boolean => distance(p, FERRY_ISLET.center) < FERRY_ISLET.radius;

/** Le bois là où le sol est sous l'eau (la digue, les pontons) ; sur la plage, c'est encore un sentier. */
const deckAt = (ground: (x: number, z: number) => number, p: Vec2) => ground(p.x, p.z) < 0.05;
/** La même chose en (`x`, `z`), sans objet (l'anneau sous Kéo l'appelle quand il bouge). */
const deckAtXZ = (ground: (x: number, z: number) => number, x: number, z: number) => ground(x, z) < 0.05;

/** Le bras de mer que passe la liaison de `ia` à `ib` (le pont de sa terre), ou rien. */
function straitOfEdge(ia: string, ib: string): StraitId | null {
  for (const [id, s] of Object.entries(STRAITS) as [StraitId, (typeof STRAITS)[StraitId]][]) {
    const [u, v] = s.bridge;
    if ((u === ia && v === ib) || (u === ib && v === ia)) return id;
  }
  return null;
}

/**
 * Sur la liaison d'un pont (de `a` à `c`, son bras de mer `strait`), la part où le chemin laisse la place au pont : de la
 * culée d'une rive à celle de l'autre, là où l'on est à moins de `BRIDGE_ABUT` unités de l'eau ; en unités depuis `a`.
 */
export function bridgeCut(a: Vec2, c: Vec2, strait: StraitId): readonly [number, number] {
  const len = distance(a, c);
  const STEP = 0.05;
  let from = len;
  let to = 0;
  for (let d = 0; d <= len; d += STEP) {
    if (straitClearance({ x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len }, strait) >= BRIDGE_ABUT) continue;
    from = Math.min(from, d);
    to = Math.max(to, d);
  }
  return [from, to];
}

/**
 * Le ruban d'une liaison (`edge`, son rang dans `PATH_EDGES`), posé sur le sol, avec ses flancs ; en bois là où le sol
 * est sous l'eau, couleur de sentier ailleurs. Rien sur la pierre du Port ni sur l'îlot de la Gare maritime ; rien non
 * plus sur l'eau d'une passerelle de planches (`PLANK_BRIDGES`, dessinée à part), ni sur les culées et l'eau d'un pont
 * (GD-20, point 3, « vraies terres » : ./bridges.ts le dessine).
 */
function edgeRibbon(b: FacetBuilder, ground: (x: number, z: number) => number, edge: number): void {
  const [ia, ib] = PATH_EDGES[edge];
  const a = pathNode(ia).at;
  const c = pathNode(ib).at;
  const len = distance(a, c);
  const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
  const dx = (c.x - a.x) / len;
  const dz = (c.z - a.z) / len;
  const planks = isPlankBridge(ia, ib);
  const strait = straitOfEdge(ia, ib);
  const cut = strait ? bridgeCut(a, c, strait) : null;
  const point = (d: number) => ({ x: a.x + dx * d, z: a.z + dz * d });
  // Un morceau du ruban, de `d0` à `d1` unités du premier nœud.
  const piece = (d0: number, d1: number, w: number, color: number) => {
    const p = point(d0);
    const q = point(d1);
    const yp = standingHeight(ground(p.x, p.z)) + RIBBON_LIFT;
    const yq = standingHeight(ground(q.x, q.z)) + RIBBON_LIFT;
    // À gauche du sens de marche : (dz, −dx) ; à droite : (−dz, dx).
    const pl = [p.x + dz * w, yp, p.z - dx * w] as const;
    const pr = [p.x - dz * w, yp, p.z + dx * w] as const;
    const ql = [q.x + dz * w, yq, q.z - dx * w] as const;
    const qr = [q.x - dz * w, yq, q.z + dx * w] as const;
    b.quad(pl, pr, qr, ql, color);
    // Les flancs, jusque sous le sol ou dans l'eau.
    const down = (v: readonly [number, number, number]) => [v[0], v[1] - RIBBON_SIDE, v[2]] as const;
    b.quad(down(pr), down(qr), qr, pr, color);
    b.quad(down(ql), down(pl), pl, ql, color);
  };
  for (let k = 0; k < n; k++) {
    const d0 = (len * k) / n;
    const d1 = (len * (k + 1)) / n;
    const mid = point((d0 + d1) / 2);
    // Sur la pierre du Port (son quai, sa place), pas de ruban : on y marche sur le pavage ; ni sur l'îlot de la Gare
    // maritime (lot L9b), dont le quai est dans le lieu.
    if (portFloor(mid.x, mid.z) !== null || onFerryIslet(mid)) continue;
    const deck = deckAt(ground, mid);
    if (planks && deck) continue;
    // Le ruban s'arrête à la culée du pont, de part et d'autre.
    const spans: [number, number][] = cut ? [[d0, Math.min(d1, cut[0])], [Math.max(d0, cut[1]), d1]] : [[d0, d1]];
    for (const [s0, s1] of spans) {
      if (s1 - s0 < 1e-3) continue;
      piece(s0, s1, deck ? HALF_WIDTH.deck : HALF_WIDTH.path, deck ? COLORS_6E.wood : COLORS_6E.path);
    }
  }
}

/** L'octogone d'un nœud (les coudes n'ont pas de trou), sauf sur la pierre du Port et l'îlot de la Gare maritime. */
function nodeOctagon(b: FacetBuilder, ground: (x: number, z: number) => number, id: string): void {
  const node = pathNode(id);
  if (portFloor(node.at.x, node.at.z) !== null || onFerryIslet(node.at)) return;
  const y = standingHeight(ground(node.at.x, node.at.z)) + RIBBON_LIFT + 0.005;
  const deck = deckAt(ground, node.at);
  const w = (deck ? HALF_WIDTH.deck : HALF_WIDTH.path) * 1.08;
  b.prism({ x: node.at.x, y: y - RIBBON_SIDE, z: node.at.z }, w, w, RIBBON_SIDE, 8, deck ? COLORS_6E.wood : COLORS_6E.path);
}

/** Le dessus de l'octogone d'un nœud (`node`) en (`x`, `z`), ou −∞ hors de lui. */
function nodeTopAt(x: number, z: number, ground: (x: number, z: number) => number, node: Vec2): number {
  const w = (deckAtXZ(ground, node.x, node.z) ? HALF_WIDTH.deck : HALF_WIDTH.path) * 1.08;
  return Math.hypot(x - node.x, z - node.z) <= w ? standingHeight(ground(node.x, node.z)) + RIBBON_LIFT + 0.005 : -Infinity;
}

/** Les liaisons dont le ruban passe à moins de `reach` unités de (`x`, `z`), écrites dans `out` (vidé d'abord), sans rien allouer. */
export function edgesNear(x: number, z: number, reach: number, out: number[]): number[] {
  out.length = 0;
  for (let edge = 0; edge < PATH_EDGES.length; edge++) {
    const a = pathNode(PATH_EDGES[edge][0]).at;
    const c = pathNode(PATH_EDGES[edge][1]).at;
    if (segmentDistance(x, z, a.x, a.z, c.x, c.z) < reach + HALF_WIDTH.deck * 1.08) out.push(edge);
  }
  return out;
}

/** La distance de (`x`, `z`) au segment de (`ax`, `az`) à (`cx`, `cz`). */
function segmentDistance(x: number, z: number, ax: number, az: number, cx: number, cz: number): number {
  const dx = cx - ax;
  const dz = cz - az;
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}

/**
 * Le dessus des rubans des liaisons `edges` (et des octogones de leurs nœuds) en (`x`, `z`), le plus haut, ou −∞ hors
 * d'eux : un ruban est plat en travers, à la hauteur du sol sur sa ligne, et dépasse donc du sol en travers d'une pente
 * (l'anneau clair sous Kéo passe dessus, ./terrain.ts, `ringHeights`). Sans rien allouer.
 */
export function pathTopAt(x: number, z: number, ground: (x: number, z: number) => number, edges: readonly number[]): number {
  let top = -Infinity;
  for (const edge of edges) {
    const [ia, ib] = PATH_EDGES[edge];
    const a = pathNode(ia).at;
    const c = pathNode(ib).at;
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1e-9;
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    top = Math.max(top, nodeTopAt(x, z, ground, a), nodeTopAt(x, z, ground, c));
    const d = (x - a.x) * dx + (z - a.z) * dz;
    if (d < 0 || d > len) continue;
    const across = Math.abs(-(x - a.x) * dz + (z - a.z) * dx);
    // Le ruban, de pas en pas (`RIBBON_STEP`), droit entre deux points de sa ligne.
    const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
    const k = Math.min(n - 1, Math.floor((d / len) * n));
    const d0 = (len * k) / n;
    const d1 = (len * (k + 1)) / n;
    const mx = a.x + dx * ((d0 + d1) / 2);
    const mz = a.z + dz * ((d0 + d1) / 2);
    if (across > (deckAtXZ(ground, mx, mz) ? HALF_WIDTH.deck : HALF_WIDTH.path)) continue;
    const y0 = standingHeight(ground(a.x + dx * d0, a.z + dz * d0));
    const y1 = standingHeight(ground(a.x + dx * d1, a.z + dz * d1));
    top = Math.max(top, y0 + ((y1 - y0) * (d - d0)) / (d1 - d0) + RIBBON_LIFT);
  }
  return top;
}

/**
 * Le dessin des chemins : un ruban par liaison (`edgeRibbon`), les passerelles de planches de la Turbine et de la Gare
 * maritime, le bord de quai des Quais, le muret de la rampe de la Vigie, un octogone sur chaque nœud. Rien sur la pierre
 * du Port (GD-20, lot 2) : son pavage tient lieu de chemin ; rien sur les ponts des terres (./bridges.ts).
 */
export function pathRibbons(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  PATH_EDGES.forEach((_, edge) => edgeRibbon(b, ground, edge));
  for (const [ia, ib] of PLANK_BRIDGES) {
    const span = plankSpan(ground, pathNode(ia).at, pathNode(ib).at);
    if (span) plankBridge(b, span.from, span.to, span.y);
  }
  dockEdge(b);
  // Le muret de la rampe de la Vigie (lot L7).
  lookoutRampWall(b);
  for (const node of PATH_NODES) nodeOctagon(b, ground, node.id);
  return b.build();
}

/**
 * Les liaisons qui passent l'eau sur une passerelle de planches plutôt que sur le ruban de bois : de la rive est à la
 * Turbine (lot L6a, directeur artistique : des planches qu'on lit, sur des pieux, comme aux Marais salants) ; la jetée de
 * la Gare maritime, de la côte ouest à son îlot (lot L9b). Toujours posées : dans une terre, aucun verrou entre les
 * lieux (GD-20, point 3, « vraies terres »).
 */
export const PLANK_BRIDGES: readonly (readonly [string, string])[] = [
  ['tur-1', 'tur-2'],
  ['lar-4', 'lar-5'],
];

/** La liaison de `ia` à `ib` est-elle une passerelle de planches ? */
const isPlankBridge = (ia: string, ib: string): boolean => PLANK_BRIDGES.some(([u, v]) => (u === ia && v === ib) || (u === ib && v === ia));

/**
 * Le bout de l'eau d'une passerelle de planches, de `a` à `b` (en suivant le sol `ground`) : du premier au dernier pas
 * du ruban sur l'eau, ou rien.
 */
function plankSpan(ground: (x: number, z: number) => number, a: Vec2, c: Vec2): { from: Vec2; to: Vec2; y: number } | null {
  const len = distance(a, c);
  const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
  const dx = (c.x - a.x) / len;
  const dz = (c.z - a.z) / len;
  let span: { from: Vec2; to: Vec2; y: number } | null = null;
  for (let k = 0; k < n; k++) {
    const p = { x: a.x + (dx * len * k) / n, z: a.z + (dz * len * k) / n };
    const q = { x: a.x + (dx * len * (k + 1)) / n, z: a.z + (dz * len * (k + 1)) / n };
    if (!deckAt(ground, { x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 })) continue;
    const y = Math.max(standingHeight(ground(p.x, p.z)), standingHeight(ground(q.x, q.z))) + RIBBON_LIFT;
    if (span) {
      span.to = q;
      span.y = Math.max(span.y, y);
    } else span = { from: p, to: q, y };
  }
  return span;
}

/**
 * Une passerelle de planches : ses planches, son pas de pieux, leur section, le pied des pieux sous l'eau, leur tête
 * au-dessus des planches, ses bois (les planches ; les pieux et les traverses).
 */
const PLANKS = { count: 5, width: 0.4, thick: 0.12, reach: 0.6, step: 1.9, post: 0.2, foot: -1.4, head: 0.3, dark: 0x7a5636 } as const;

/**
 * Le bois des planches d'une passerelle (GD-20, point 3, directeur artistique) : un sable plus clair que le Sable du pack
 * (#DAA66A), le dessus plus clair que le flanc, en aplats ; ses traverses franches, d'un bois plus sombre.
 */
export const NEW_WOOD = { top: 0xf0cf98, side: 0xd9b077, beam: 0x8a5f3a } as const;

/** Le repère d'une passerelle de planches de `from` à `to` : sa longueur, son cap, et un point à `o` en travers, `u` le long. */
function bridgeFrame(from: Vec2, to: Vec2) {
  const len = distance(from, to) || 1e-6;
  const [dx, dz] = [(to.x - from.x) / len, (to.z - from.z) / len];
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  return { len, yaw: Math.atan2(dx, dz), across: (o: number, u: number) => ({ x: mid.x + dx * u + dz * o, z: mid.z + dz * u - dx * o }) };
}

/**
 * Une passerelle de planches de `from` à `to` (le bois des planches à `y`) sur l'eau : ses cinq planches jointives, aux
 * bords nets, posées dans le sens de la marche, qui débordent d'un pas sur chaque berge ; une paire de pieux à chaque
 * bout et de place en place, une traverse sous les planches à chaque paire, les têtes des pieux au-dessus des planches.
 */
function plankBridge(b: FacetBuilder, from: Vec2, to: Vec2, y: number): void {
  const P = PLANKS;
  const { len, yaw, across } = bridgeFrame(from, to);
  const half = (P.count * P.width) / 2;
  for (let k = 0; k < P.count; k++) {
    const at = across(-half + P.width / 2 + k * P.width, 0);
    b.box({ x: at.x, y: y - P.thick, z: at.z, yaw }, [P.width, P.thick, len + 2 * P.reach], NEW_WOOD.side, NEW_WOOD.top);
  }
  const pairs = Math.max(2, Math.round(len / P.step) + 1);
  for (let k = 0; k < pairs; k++) {
    const u = -len / 2 + (len * k) / (pairs - 1);
    const beam = across(0, u);
    b.box({ x: beam.x, y: y - P.thick - 0.16, z: beam.z, yaw }, [2 * half + 0.5, 0.16, 0.18], NEW_WOOD.beam);
    for (const side of [-1, 1]) {
      const at = across(side * (half + 0.18), u);
      b.box({ x: at.x, y: P.foot, z: at.z, yaw }, [P.post, y + P.head - P.foot, P.post], P.dark);
    }
  }
}

/** Le bord de quai : un mur de pierre, son chaperon plus clair, et trois bittes d'amarrage. */
const DOCK_WALL = { inland: 0.45, out: 0.25, top: 0.55, bottom: -0.9, coping: 0.1, stone: 0xb9b2a3, cap: 0xd8d1c2, bollard: 0x6f8089 } as const;

/**
 * Le bord de quai du bassin des Quais (lot 3, directeur artistique) : un mur de pierre le long de sa rive nord, là où
 * accoste la barque, son chaperon clair et trois bittes d'amarrage ; dans le maillage des chemins, aucun appel de plus.
 */
function dockEdge(b: FacetBuilder): void {
  const W = DOCK_WALL;
  const { from, to } = DOCK_EDGE;
  const len = to.x - from.x;
  const at = { x: (from.x + to.x) / 2, z: from.z + (W.out - W.inland) / 2 };
  const depth = W.inland + W.out;
  b.box({ x: at.x, y: W.bottom, z: at.z }, [len, W.top - W.bottom, depth], W.stone);
  b.box({ x: at.x, y: W.top, z: at.z }, [len + 0.1, W.coping, depth + 0.1], W.cap);
  for (const k of [0.2, 0.5, 0.8]) b.prism({ x: from.x + k * len, y: W.top + W.coping, z: from.z }, 0.18, 0.15, 0.4, 8, W.bollard);
}
