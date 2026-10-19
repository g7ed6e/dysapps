// Le réseau des chemins d'un niveau, sans rien savoir de son niveau (GD-22, lot 2) : ses nœuds et ses liaisons, le point
// du réseau le plus proche d'un toucher, le point sur un nœud, où Kéo se tient devant un lieu, et le plus court trajet
// (A*). Le réseau du 6e (./paths.ts) et celui du 5e (./paths5e.ts) en sont deux. Code pur.
import { closestOnSegment, distance, type Vec2 } from './geometry';

/** Un nœud du réseau des chemins. */
export interface PathNode {
  id: string;
  at: Vec2;
}

/** Un point du réseau : sur la liaison `edge` (son rang dans les liaisons), à la part `t` de son premier nœud au second. */
export interface NetworkPoint {
  edge: number;
  t: number;
  at: Vec2;
}

/**
 * Où Kéo se tient en ouvrant le monde devant un lieu : sur le chemin qui part de sa porte, à `START_DISTANCE` unités du
 * centre du lieu (directeur artistique, piste 1, puis 12 à 14 unités au lot 2 : assez loin du Phare pour qu'on voie sa
 * lanterne, Kéo et « Y aller » ensemble), ou au bout de ce chemin s'il est plus court.
 */
export const START_DISTANCE = 14;

/** Ce qu'un réseau sait faire. */
export interface Network {
  readonly nodes: readonly PathNode[];
  readonly edges: readonly (readonly [string, string])[];
  pathNode(id: string): PathNode;
  snapToNetwork(p: Vec2): NetworkPoint;
  atNode(id: string): NetworkPoint;
  startOf(door: string, center: Vec2): NetworkPoint;
  findRoute(from: NetworkPoint, to: NetworkPoint): Vec2[];
  networkSamples(step: number): Vec2[];
}

/** Sans les points répétés (un départ sur un nœud). */
function dedupe(route: Vec2[]): Vec2[] {
  return route.filter((p, i) => i === 0 || distance(p, route[i - 1]) > 1e-6);
}

/** Le réseau de ces nœuds et de ces liaisons. */
export function createNetwork(nodes: readonly PathNode[], edges: readonly (readonly [string, string])[]): Network {
  const nodeById = new Map<string, PathNode>(nodes.map((n) => [n.id, n]));
  const pathNode = (id: string): PathNode => {
    const n = nodeById.get(id);
    if (!n) throw new Error(`Nœud inconnu : ${id}`);
    return n;
  };
  const ends = (edge: number): [PathNode, PathNode] => [pathNode(edges[edge][0]), pathNode(edges[edge][1])];

  /** Le point du réseau le plus proche de `p` : là où va Kéo quand on touche ailleurs que sur un chemin. */
  const snapToNetwork = (p: Vec2): NetworkPoint => {
    let best: NetworkPoint | null = null;
    let bestD = Infinity;
    edges.forEach((_, edge) => {
      const [a, b] = ends(edge);
      const c = closestOnSegment(p, a.at, b.at);
      const d = distance(p, c.point);
      if (d < bestD) {
        bestD = d;
        best = { edge, t: c.t, at: c.point };
      }
    });
    return best!;
  };

  /** Le point du réseau sur un nœud (la porte d'un lieu). */
  const atNode = (id: string): NetworkPoint => {
    const edge = edges.findIndex(([a, b]) => a === id || b === id);
    if (edge < 0) throw new Error(`Nœud isolé : ${id}`);
    return { edge, t: edges[edge][0] === id ? 0 : 1, at: pathNode(id).at };
  };

  const startOf = (door: string, center: Vec2): NetworkPoint => {
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
  };

  /**
   * Le plus court trajet sur le réseau, de `from` à `to` (A*, la distance à vol d'oiseau pour estimer le reste) : la
   * suite des points où Kéo tourne, départ et arrivée compris.
   */
  const findRoute = (from: NetworkPoint, to: NetworkPoint): Vec2[] => {
    if (from.edge === to.edge) return dedupe([from.at, to.at]);
    // Le graphe des nœuds, plus le départ et l'arrivée posés sur leurs liaisons.
    const START = '$depart';
    const GOAL = '$arrivee';
    const pos = new Map<string, Vec2>(nodes.map((n) => [n.id, n.at]));
    pos.set(START, from.at);
    pos.set(GOAL, to.at);
    const links = new Map<string, string[]>();
    const link = (a: string, b: string) => {
      links.set(a, [...(links.get(a) ?? []), b]);
      links.set(b, [...(links.get(b) ?? []), a]);
    };
    edges.forEach(([a, b], edge) => {
      if (edge !== from.edge && edge !== to.edge) link(a, b);
    });
    for (const [id, p] of [[START, from], [GOAL, to]] as const) {
      const [a, b] = edges[p.edge];
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
  };

  /** Des points sur tout le réseau, tous les `step` unités au plus (les nœuds compris) : là où Kéo peut se tenir. */
  const networkSamples = (step: number): Vec2[] => {
    const out: Vec2[] = nodes.map((n) => n.at);
    for (const [ia, ib] of edges) {
      const a = pathNode(ia).at;
      const b = pathNode(ib).at;
      const n = Math.max(1, Math.ceil(distance(a, b) / step));
      for (let k = 1; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n });
    }
    return out;
  };

  return { nodes, edges, pathNode, snapToNetwork, atNode, startOf, findRoute, networkSamples };
}
