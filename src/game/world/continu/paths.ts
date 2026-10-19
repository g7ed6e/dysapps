// Les chemins aimantés (piste B) : le réseau des sentiers, de la digue et des pontons du 6e, le point du réseau le plus
// proche d'un toucher, et le plus court trajet de l'un à l'autre (A*). Le dessin des chemins (un ruban posé sur le sol,
// en bois sur l'eau) est tiré d'ici aussi. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { createNetwork } from './network';
import { BRIDGE_ABUT, COLORS_6E, DOCK_EDGE, FERRY_ISLET, PATH_EDGES, PATH_NODES, STRAITS, portFloor, type StraitId } from './plan6e';
import { lookoutRampWall } from './lookout';
import { standingHeight, straitClearance } from './terrain';

/** Le réseau du 6e (./network.ts). */
const NET = createNetwork(PATH_NODES, PATH_EDGES);

export type { NetworkPoint } from './network';
export { START_DISTANCE } from './network';

/** Un nœud par son identifiant. */
export const pathNode = NET.pathNode;

/** Le point du réseau le plus proche de `p` : là où va Kéo quand on touche ailleurs que sur un chemin. */
export const snapToNetwork = NET.snapToNetwork;

/** Le point du réseau sur un nœud (la porte d'un lieu). */
export const atNode = NET.atNode;

/** Où Kéo se tient en ouvrant le monde devant un lieu (./network.ts, `START_DISTANCE`). */
export const startOf = NET.startOf;

/** Le plus court trajet sur le réseau, de `from` à `to` (A*). */
export const findRoute = NET.findRoute;

/** Des points sur tout le réseau, tous les `step` unités au plus (les nœuds compris) : là où Kéo peut se tenir. */
export const networkSamples = NET.networkSamples;

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
 * Le liseré de terre d'un sentier (GD-20, point 3, lot 3, décision du directeur artistique du 17 octobre 2026) : une
 * bande brune (`COLORS_6E.pathEdge`) de `width` unités de chaque côté, dans la largeur du ruban (au moins 2 px à
 * 40 unités, où la brume commence), posée `drop` unité sous le sable du sentier : là où deux rubans se croisent (au
 * creux d'un coude), le sable de l'un passe sur le liseré de l'autre. Ses flancs sont du même brun.
 */
const PATH_EDGE = { width: 0.14, drop: 0.004 } as const;

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
 * Ce que le dessin des rubans lit d'un réseau (GD-22, lot 2 : le même dessin pour le 6e et le 5e) : ses liaisons et ses
 * nœuds ; la part d'une liaison qu'un pont prend (ses culées, `cut`), ou rien ; les endroits où l'on ne dessine rien
 * (`skip` : la pierre du Port, l'îlot de la Gare maritime) ; les liaisons posées en planches, dessinées à part.
 */
export interface RibbonNet {
  edges: readonly (readonly [string, string])[];
  node(id: string): { at: Vec2 };
  cut(edge: number): readonly [number, number] | null;
  skip(p: Vec2): boolean;
  planks(ia: string, ib: string): boolean;
}

/** Le réseau du 6e, pour son dessin. */
const RIBBONS_6E: RibbonNet = {
  edges: PATH_EDGES,
  node: (id) => pathNode(id),
  cut: (edge) => {
    const [ia, ib] = PATH_EDGES[edge];
    const strait = straitOfEdge(ia, ib);
    return strait ? bridgeCut(pathNode(ia).at, pathNode(ib).at, strait) : null;
  },
  skip: (p) => portFloor(p.x, p.z) !== null || onFerryIslet(p),
  planks: (ia, ib) => isPlankBridge(ia, ib),
};

/**
 * Le ruban d'une liaison (`edge`, son rang dans `PATH_EDGES`), posé sur le sol, avec ses flancs ; en bois là où le sol
 * est sous l'eau, couleur de sentier ailleurs. Rien sur la pierre du Port ni sur l'îlot de la Gare maritime ; rien non
 * plus sur l'eau de la passerelle de la Turbine ni de la jetée (`PLANK_BRIDGES`, dessinées à part), ni sur les culées
 * et l'eau d'un pont (GD-20, point 3, « vraies terres » : ./bridges.ts le dessine). `tint` : son sable seul, repeint
 * (`pathSand`).
 */
function edgeRibbon(b: FacetBuilder, ground: (x: number, z: number) => number, edge: number, tint?: SandTint, net: RibbonNet = RIBBONS_6E): void {
  const [ia, ib] = net.edges[edge];
  const a = net.node(ia).at;
  const c = net.node(ib).at;
  const len = distance(a, c);
  const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
  const dx = (c.x - a.x) / len;
  const dz = (c.z - a.z) / len;
  const planks = net.planks(ia, ib);
  const cut = net.cut(edge);
  const point = (d: number) => ({ x: a.x + dx * d, z: a.z + dz * d });
  // Un morceau du ruban, de `d0` à `d1` unités du premier nœud.
  const piece = (d0: number, d1: number, w: number, deck: boolean) => {
    const p = point(d0);
    const q = point(d1);
    const yp = standingHeight(ground(p.x, p.z)) + RIBBON_LIFT;
    const yq = standingHeight(ground(q.x, q.z)) + RIBBON_LIFT;
    // À gauche du sens de marche : (dz, −dx) ; à droite : (−dz, dx), à `o` unités de la ligne et `y` sous le dessus.
    const left = (v: Vec2, y: number, o: number) => [v.x + dz * o, y, v.z - dx * o] as const;
    const right = (v: Vec2, y: number, o: number) => [v.x - dz * o, y, v.z + dx * o] as const;
    const down = (v: readonly [number, number, number]) => [v[0], v[1] - RIBBON_SIDE, v[2]] as const;
    const pl = left(p, yp, w);
    const pr = right(p, yp, w);
    const ql = left(q, yq, w);
    const qr = right(q, yq, w);
    const i = w - PATH_EDGE.width;
    if (tint) {
      // Le sable seul, d'une autre couleur, un rien au-dessus de celui du sentier (`pathSand`).
      if (!deck) b.quad(left(p, yp + tint.lift, i), right(p, yp + tint.lift, i), right(q, yq + tint.lift, i), left(q, yq + tint.lift, i), tint.color);
      return;
    }
    if (deck) {
      b.quad(pl, pr, qr, ql, COLORS_6E.wood);
      b.quad(down(pr), down(qr), qr, pr, COLORS_6E.wood);
      b.quad(down(ql), down(pl), pl, ql, COLORS_6E.wood);
      return;
    }
    // Le sable du sentier, puis son liseré de chaque côté, un peu plus bas, et les flancs du liseré.
    const e = PATH_EDGE.drop;
    b.quad(left(p, yp, i), right(p, yp, i), right(q, yq, i), left(q, yq, i), COLORS_6E.path);
    const lpe = left(p, yp - e, w), rpe = right(p, yp - e, w), lqe = left(q, yq - e, w), rqe = right(q, yq - e, w);
    b.quad(lpe, left(p, yp - e, i), left(q, yq - e, i), lqe, COLORS_6E.pathEdge);
    b.quad(right(p, yp - e, i), rpe, rqe, right(q, yq - e, i), COLORS_6E.pathEdge);
    b.quad(down(rpe), down(rqe), rqe, rpe, COLORS_6E.pathEdge);
    b.quad(down(lqe), down(lpe), lpe, lqe, COLORS_6E.pathEdge);
  };
  for (let k = 0; k < n; k++) {
    const d0 = (len * k) / n;
    const d1 = (len * (k + 1)) / n;
    const mid = point((d0 + d1) / 2);
    // Sur la pierre du Port (son quai, sa place), pas de ruban : on y marche sur le pavage ; ni sur l'îlot de la Gare
    // maritime (lot L9b), dont le quai est dans le lieu.
    if (net.skip(mid)) continue;
    const deck = deckAt(ground, mid);
    if (planks && deck) continue;
    // Le ruban s'arrête à la culée du pont, de part et d'autre.
    const spans: [number, number][] = cut ? [[d0, Math.min(d1, cut[0])], [Math.max(d0, cut[1]), d1]] : [[d0, d1]];
    for (const [s0, s1] of spans) {
      if (s1 - s0 < 1e-3) continue;
      piece(s0, s1, deck ? HALF_WIDTH.deck : HALF_WIDTH.path, deck);
    }
  }
}

/** Le sable d'un sentier repeint : sa couleur, et sa hauteur au-dessus du sable du sentier. */
export interface SandTint {
  color: number;
  lift: number;
}

/**
 * Le sable d'un bout du réseau, repeint d'une autre couleur (le décor de près d'une scénette : le sable tassé de la
 * saline, plus foncé que le sel) : sur chaque liaison de `edges` (ses deux nœuds), le sable de son ruban, dans les mêmes
 * morceaux, un rien au-dessus ; sur chaque nœud de `nodes`, son disque de sable. Le liseré brun et le bois restent ceux
 * du monde. Deux triangles par morceau, douze par nœud.
 */
export function pathSand(b: FacetBuilder, ground: (x: number, z: number) => number, edges: readonly (readonly [string, string])[], nodes: readonly string[], tint: SandTint): void {
  for (const [ia, ib] of edges) {
    const edge = PATH_EDGES.findIndex(([a, c]) => (a === ia && c === ib) || (a === ib && c === ia));
    if (edge < 0) throw new Error(`Liaison inconnue : ${ia}, ${ib}`);
    edgeRibbon(b, ground, edge, tint);
  }
  for (const id of nodes) {
    const node = pathNode(id);
    if (deckAt(ground, node.at)) continue;
    const y = standingHeight(ground(node.at.x, node.at.z)) + RIBBON_LIFT + tint.lift;
    const r = (HALF_WIDTH.path - PATH_EDGE.width) / Math.cos(Math.PI / NODE_SAND_SIDES);
    const at = (k: number) => [node.at.x + r * Math.cos((2 * Math.PI * k) / NODE_SAND_SIDES), y, node.at.z + r * Math.sin((2 * Math.PI * k) / NODE_SAND_SIDES)] as const;
    for (let k = 0; k < NODE_SAND_SIDES; k++) b.triangle([node.at.x, y, node.at.z], at(k + 1), at(k), tint.color);
  }
}

/** L'octogone d'un nœud (les coudes n'ont pas de trou), sauf sur la pierre du Port et l'îlot de la Gare maritime. */
function nodeOctagon(b: FacetBuilder, ground: (x: number, z: number) => number, id: string, net: RibbonNet = RIBBONS_6E): void {
  const node = net.node(id);
  if (net.skip(node.at)) return;
  const y = standingHeight(ground(node.at.x, node.at.z)) + RIBBON_LIFT + 0.005;
  const deck = deckAt(ground, node.at);
  const w = (deck ? HALF_WIDTH.deck : HALF_WIDTH.path) * 1.08;
  if (deck) {
    b.prism({ x: node.at.x, y: y - RIBBON_SIDE, z: node.at.z }, w, w, RIBBON_SIDE, 8, COLORS_6E.wood);
    return;
  }
  // Un sentier : l'octogone en brun du liseré, sous les rubans (il ferme le liseré au dehors d'un coude), et dessus un
  // disque de sable, du rayon du sable des rubans (le sable se rejoint au coude, sans trait brun en travers).
  const base = y - 0.005 - 2 * PATH_EDGE.drop;
  b.prism({ x: node.at.x, y: base - RIBBON_SIDE, z: node.at.z }, w, w, RIBBON_SIDE, 8, COLORS_6E.pathEdge);
  const r = (HALF_WIDTH.path - PATH_EDGE.width) / Math.cos(Math.PI / NODE_SAND_SIDES);
  const yy = y - 0.005;
  const at = (k: number) => [node.at.x + r * Math.cos((2 * Math.PI * k) / NODE_SAND_SIDES), yy, node.at.z + r * Math.sin((2 * Math.PI * k) / NODE_SAND_SIDES)] as const;
  for (let k = 0; k < NODE_SAND_SIDES; k++) b.triangle([node.at.x, yy, node.at.z], at(k + 1), at(k), COLORS_6E.path);
}

/** Les côtés du disque de sable d'un nœud : assez pour qu'il couvre le sable des rubans qui y arrivent. */
const NODE_SAND_SIDES = 12;

/** Le dessus de l'octogone d'un nœud (`node`) en (`x`, `z`), ou −∞ hors de lui. */
function nodeTopAt(x: number, z: number, ground: (x: number, z: number) => number, node: Vec2): number {
  const w = (deckAtXZ(ground, node.x, node.z) ? HALF_WIDTH.deck : HALF_WIDTH.path) * 1.08;
  return Math.hypot(x - node.x, z - node.z) <= w ? standingHeight(ground(node.x, node.z)) + RIBBON_LIFT + 0.005 : -Infinity;
}

/** Les liaisons dont le ruban passe à moins de `reach` unités de (`x`, `z`), écrites dans `out` (vidé d'abord), sans rien allouer. */
export function edgesNear(x: number, z: number, reach: number, out: number[], net: RibbonNet = RIBBONS_6E): number[] {
  out.length = 0;
  for (let edge = 0; edge < net.edges.length; edge++) {
    const a = net.node(net.edges[edge][0]).at;
    const c = net.node(net.edges[edge][1]).at;
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
export function pathTopAt(x: number, z: number, ground: (x: number, z: number) => number, edges: readonly number[], net: RibbonNet = RIBBONS_6E): number {
  let top = -Infinity;
  for (const edge of edges) {
    const [ia, ib] = net.edges[edge];
    const a = net.node(ia).at;
    const c = net.node(ib).at;
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
 * Le dessin des chemins : un ruban par liaison (`edgeRibbon`), la passerelle de planches de la Turbine et la jetée de la
 * Gare maritime, le bord de quai des Quais, le muret de la rampe de la Vigie, un octogone sur chaque nœud. Rien sur la pierre
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
 * Le dessin d'un autre réseau (GD-22, lot 2 : le 5e) : un ruban par liaison et un octogone par nœud, comme au 6e, sans
 * ses ouvrages propres (passerelles, bord de quai, rampe).
 */
export function networkRibbons(net: RibbonNet, ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  net.edges.forEach((_, edge) => edgeRibbon(b, ground, edge, undefined, net));
  const ids = new Set(net.edges.flat());
  for (const id of ids) nodeOctagon(b, ground, id, net);
  return b.build();
}

/**
 * Les liaisons qui passent l'eau sur des planches posées sur des pieux plutôt que sur le ruban de bois : la passerelle
 * de la rive est à la Turbine (lot L6a, directeur artistique : des planches qu'on lit, sur des pieux, comme aux Marais
 * salants) ; la jetée de la Gare maritime, de la côte ouest à son îlot (lot L9b ; « jetée », jamais « passerelle » :
 * consultant d'Archipéo, relecture du lot 1 des « vraies terres »). Toujours posées : dans une terre, aucun verrou entre
 * les lieux (GD-20, point 3, « vraies terres »).
 */
export const PLANK_BRIDGES: readonly (readonly [string, string])[] = [
  ['tur-1', 'tur-2'],
  ['lar-4', 'lar-5'],
];

/** La liaison de `ia` à `ib` passe-t-elle l'eau sur des planches (la passerelle de la Turbine, la jetée) ? */
const isPlankBridge = (ia: string, ib: string): boolean => PLANK_BRIDGES.some(([u, v]) => (u === ia && v === ib) || (u === ib && v === ia));

/**
 * Le bout de l'eau de planches posées (passerelle ou jetée), de `a` à `b` (en suivant le sol `ground`) : du premier
 * au dernier pas du ruban sur l'eau, ou rien.
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
 * Les planches posées (la passerelle de la Turbine, la jetée de la Gare maritime) : leurs planches, le pas des pieux,
 * leur section, le pied des pieux sous l'eau, leur tête au-dessus des planches, leurs bois (les planches ; les pieux et
 * les traverses).
 */
const PLANKS = { count: 5, width: 0.4, thick: 0.12, reach: 0.6, step: 1.9, post: 0.2, foot: -1.4, head: 0.3, dark: 0x7a5636 } as const;

/**
 * Le bois des planches d'une passerelle ou de la jetée (GD-20, point 3, directeur artistique) : un sable plus clair que le Sable du pack
 * (#DAA66A), le dessus plus clair que le flanc, en aplats ; ses traverses franches, d'un bois plus sombre.
 */
export const NEW_WOOD = { top: 0xf0cf98, side: 0xd9b077, beam: 0x8a5f3a } as const;

/** Le repère de planches posées (passerelle ou jetée) de `from` à `to` : longueur, cap, point à `o` en travers, `u` le long. */
function bridgeFrame(from: Vec2, to: Vec2) {
  const len = distance(from, to) || 1e-6;
  const [dx, dz] = [(to.x - from.x) / len, (to.z - from.z) / len];
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  return { len, yaw: Math.atan2(dx, dz), across: (o: number, u: number) => ({ x: mid.x + dx * u + dz * o, z: mid.z + dz * u - dx * o }) };
}

/**
 * Une passerelle ou une jetée de planches de `from` à `to` (le bois des planches à `y`) sur l'eau : cinq planches
 * jointives, aux bords nets, posées dans le sens de la marche, qui débordent d'un pas sur chaque berge ; une paire de
 * pieux à chaque bout et de place en place, une traverse sous les planches à chaque paire, les têtes des pieux
 * au-dessus des planches.
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
