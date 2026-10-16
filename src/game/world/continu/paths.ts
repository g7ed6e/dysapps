// Les chemins aimantés (piste B) : le réseau des sentiers, de la digue et des pontons du 6e, le point du réseau le plus
// proche d'un toucher, et le plus court trajet de l'un à l'autre (A*). Le dessin des chemins (un ruban posé sur le sol,
// en bois sur l'eau) est tiré d'ici aussi. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { closestOnSegment, distance, type Vec2 } from './geometry';
import { COLORS_6E, DOCK_EDGE, FERRY_ISLET, PATH_EDGES, PATH_NODES, portFloor, type PathNode } from './plan6e';
import { lookoutRampWall } from './lookout';
import { standingHeight } from './terrain';

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

/**
 * Le dessin des chemins : un ruban par liaison, posé sur le sol (`ground`, la hauteur du sol dessiné), avec ses flancs ;
 * en bois là où le sol est sous l'eau (digue, pontons), couleur de sentier ailleurs. Un octogone couvre chaque nœud.
 * Rien sur la pierre du Port (GD-20, lot 2) : son pavage tient lieu de chemin.
 */
export function pathRibbons(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  // Le bois là où le sol est sous l'eau (la digue, les pontons) ; sur la plage, c'est encore un sentier.
  const deckAt = (p: Vec2) => ground(p.x, p.z) < 0.05;
  for (const [ia, ib] of PATH_EDGES) {
    const a = pathNode(ia).at;
    const c = pathNode(ib).at;
    const len = distance(a, c);
    const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    // Une passerelle de planches (`PLANK_BRIDGES`) : ses planches et ses pieux de bout en bout de l'eau, à la place du
    // ruban de bois.
    const planks = PLANK_BRIDGES.some(([u, v]) => (u === ia && v === ib) || (u === ib && v === ia));
    const spans: { from: Vec2; to: Vec2; y: number }[] = [];
    for (let k = 0; k < n; k++) {
      const p = { x: a.x + (dx * len * k) / n, z: a.z + (dz * len * k) / n };
      const q = { x: a.x + (dx * len * (k + 1)) / n, z: a.z + (dz * len * (k + 1)) / n };
      const mid = { x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 };
      // Sur la pierre du Port (son quai, sa place), pas de ruban : on y marche sur le pavage ; ni sur l'îlot de la Gare
      // maritime (lot L9b), dont le quai est dans le lieu.
      if (portFloor(mid.x, mid.z) !== null || onFerryIslet(mid)) continue;
      const deck = deckAt(mid);
      if (planks && deck) {
        const y = Math.max(standingHeight(ground(p.x, p.z)), standingHeight(ground(q.x, q.z))) + RIBBON_LIFT;
        const span = spans[0];
        if (span) {
          span.to = q;
          span.y = Math.max(span.y, y);
        } else spans.push({ from: p, to: q, y });
        continue;
      }
      const w = deck ? HALF_WIDTH.deck : HALF_WIDTH.path;
      const color = deck ? COLORS_6E.wood : COLORS_6E.path;
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
    }
    for (const span of spans) plankBridge(b, span.from, span.to, span.y);
  }
  dockEdge(b);
  // Le muret de la rampe de la Vigie (lot L7).
  lookoutRampWall(b);
  // Un octogone sur chaque nœud : les coudes n'ont pas de trou.
  for (const node of PATH_NODES) {
    if (portFloor(node.at.x, node.at.z) !== null || onFerryIslet(node.at)) continue;
    const y = standingHeight(ground(node.at.x, node.at.z)) + RIBBON_LIFT + 0.005;
    const deck = deckAt(node.at);
    const w = (deck ? HALF_WIDTH.deck : HALF_WIDTH.path) * 1.08;
    b.prism({ x: node.at.x, y: y - RIBBON_SIDE, z: node.at.z }, w, w, RIBBON_SIDE, 8, deck ? COLORS_6E.wood : COLORS_6E.path);
  }
  return b.build();
}

/**
 * Les liaisons qui passent l'eau sur une passerelle de planches plutôt que sur le ruban de bois : de la rive est à la
 * Turbine (lot L6a, directeur artistique : des planches qu'on lit, sur des pieux, comme aux Marais salants) ; la jetée de
 * la Gare maritime, de la côte ouest à son îlot (lot L9b).
 */
export const PLANK_BRIDGES: readonly (readonly [string, string])[] = [
  ['tur-1', 'tur-2'],
  ['lar-4', 'lar-5'],
];

/**
 * La passerelle : ses planches, son pas de pieux, leur section, le pied des pieux sous l'eau, leur tête au-dessus des
 * planches, ses deux bois (les planches en alternance, plus clair et plus sombre ; les pieux et les traverses).
 */
const PLANKS = { count: 3, width: 0.66, gap: 0.1, thick: 0.12, reach: 0.6, step: 1.9, post: 0.2, foot: -1.4, head: 0.3, woods: [COLORS_6E.wood, 0xb98c5c], dark: 0x7a5636 } as const;

/**
 * Une passerelle de planches de `from` à `to` (le bois des planches à `y`) : trois planches posées dans le sens de la
 * marche, des jours entre elles, qui débordent d'un pas sur chaque berge ; une paire de pieux à chaque bout et de place en
 * place, une traverse sous les planches à chaque paire, les têtes des pieux au-dessus des planches.
 */
function plankBridge(b: FacetBuilder, from: Vec2, to: Vec2, y: number): void {
  const P = PLANKS;
  const len = distance(from, to) || 1e-6;
  const [dx, dz] = [(to.x - from.x) / len, (to.z - from.z) / len];
  const yaw = Math.atan2(dx, dz);
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  const across = (o: number, u: number) => ({ x: mid.x + dx * u + dz * o, z: mid.z + dz * u - dx * o });
  const half = (P.count * P.width + (P.count - 1) * P.gap) / 2;
  for (let k = 0; k < P.count; k++) {
    const o = -half + P.width / 2 + k * (P.width + P.gap);
    const at = across(o, 0);
    b.box({ x: at.x, y: y - P.thick, z: at.z, yaw }, [P.width, P.thick, len + 2 * P.reach], P.woods[k % 2]);
  }
  const pairs = Math.max(2, Math.round(len / P.step) + 1);
  for (let k = 0; k < pairs; k++) {
    const u = -len / 2 + (len * k) / (pairs - 1);
    const beam = across(0, u);
    b.box({ x: beam.x, y: y - P.thick - 0.16, z: beam.z, yaw }, [2 * half + 0.5, 0.16, 0.18], P.dark);
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
