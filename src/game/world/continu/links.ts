// Les liaisons du monde continu (GD-20, point 3, lot 1 « Relier », choix du mainteneur du 17 octobre 2026 : la piste A du
// directeur artistique, « la passerelle démontée ») : aucune liaison nouvelle, chaque lieu fermé s'ouvre par une liaison
// de la grille du 6e (même identifiant, même prix, payée par `buildBridge` ; la vue la résout, `getBridge`). Au départ,
// comme dans la grille, le Phare et les Quais sont ouverts, reliés par la digue ; les quatorze autres lieux sont fermés.
// Sur l'embranchement qui mène à la porte d'un lieu fermé, hors de sa brume, jamais sur un chemin de passage, le chemin
// s'arrête au bord d'un ruisseau peint à plat entre deux levées de terre ; il ne reste que les pieux, deux traverses et
// un bout de corde coupée. À la Turbine et à la Gare maritime, la vraie eau reste : leurs passerelles de planches n'ont
// plus que leurs pieux. Relié, le lieu garde une passerelle neuve, de planches jointives aux bords nets sur deux
// traverses franches, d'un bois plus clair que celui des chemins. Kéo s'arrête au bord (`clampToOpen`). Tout entre dans
// le maillage des lieux, sans appel de plus ; sur la Carte seule, le chemin d'un lieu fermé se dessine en tirets. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { PATH_EDGES, PLACES, placeById, portFloor, type PlaceId } from './plan6e';
import { NEW_WOOD, edgeRibbon, isPlankBridge, nodeOctagon, pathNode, pathRibbons, plankBridge, plankSpan, type NetworkPoint, type RibbonLook } from './paths';
import { heightAt, standingHeight } from './terrain';
import { underVeil } from './veil';

/** Les lieux ouverts au départ, comme dans la grille : le Phare et les Quais, reliés par la digue (gratuite). */
export const START_PLACES = ['phare', 'quais'] as const satisfies readonly PlaceId[];

/** Un lieu qu'on relie : tous, sauf ceux du départ. */
export type LinkedPlace = Exclude<PlaceId, (typeof START_PLACES)[number]>;

/**
 * La table lieu → liaison : pour chaque lieu fermé, le lieu de départ d'où part sa liaison, selon le tronc par lequel
 * Kéo y arrive (les Quais pour l'est et le nord, le Phare, par l'Escale, pour le sud et le large). La liaison est celle
 * de la grille entre les îles des deux lieux (`linkIslands`) : la grille ne rend « loin » qu'une liaison dont aucun bout
 * n'est ouvert, et ces deux-là le sont dès le départ.
 */
export const PLACE_LINKS: Readonly<Record<LinkedPlace, (typeof START_PLACES)[number]>> = {
  filets: 'quais',
  ecluses: 'quais',
  saltworks: 'quais',
  engine: 'quais',
  shipyard: 'quais',
  lookout: 'quais',
  archives: 'quais',
  printworks: 'quais',
  mangrove: 'phare',
  ruins: 'phare',
  observatory: 'phare',
  commons: 'phare',
  beacons: 'phare',
  ferry: 'phare',
};

/** Le lieu se relie-t-il (il n'est pas du départ) ? */
export const isLinked = (place: PlaceId): place is LinkedPlace => !(START_PLACES as readonly PlaceId[]).includes(place);

/** Les deux îles de la liaison d'un lieu (le départ, puis le lieu), que la vue résout en liaison de la grille ; rien au départ. */
export function linkIslands(place: PlaceId): readonly [string, string] | null {
  return isLinked(place) ? [placeById(PLACE_LINKS[place]).island, placeById(place).island] : null;
}

/**
 * Les lieux fermés : ceux qu'on relie et qui ne sont pas ouverts (`open` : la vue y passe la grille, ses îles reliées, et
 * les lieux déjà joués), dans l'ordre du plan.
 */
export const closedPlaces = (open: (place: PlaceId) => boolean): LinkedPlace[] => PLACES.map((p) => p.id).filter((id): id is LinkedPlace => isLinked(id) && !open(id));

// ---------- Les embranchements ----------

const degree = new Map<string, number>();
for (const [a, b] of PATH_EDGES) {
  degree.set(a, (degree.get(a) ?? 0) + 1);
  degree.set(b, (degree.get(b) ?? 0) + 1);
}

/**
 * L'embranchement d'un lieu : de sa porte jusqu'au premier carrefour (un nœud où se croisent trois chemins au moins).
 * `edges` : ses liaisons, de la porte au carrefour ; `nodes` : ses nœuds, la porte comprise, sans le carrefour.
 */
export interface Branch {
  junction: string;
  edges: readonly number[];
  nodes: readonly string[];
}

/** L'embranchement qui mène à la porte d'un lieu. */
export function branchOf(place: PlaceId): Branch {
  const known = branches.get(place);
  if (known) return known;
  const door = placeById(place).door;
  const edges: number[] = [];
  const nodes: string[] = [door];
  let here = door;
  let prev: number | null = null;
  for (;;) {
    const next = PATH_EDGES.map((e, i) => ({ e, i })).filter(({ e, i }) => i !== prev && (e[0] === here || e[1] === here));
    if (next.length !== 1) throw new Error(`La porte de ${place} n'est pas au bout d'un embranchement (${here})`);
    const { e, i } = next[0];
    edges.push(i);
    prev = i;
    here = e[0] === here ? e[1] : e[0];
    if ((degree.get(here) ?? 0) >= 3) break;
    nodes.push(here);
  }
  const b = { junction: here, edges, nodes };
  branches.set(place, b);
  return b;
}
const branches = new Map<PlaceId, Branch>();

// ---------- Les passerelles démontées ----------

/**
 * La passerelle démontée d'un lieu : sur la liaison `edge` de son embranchement ; `toward`, le sens de la marche vers le
 * lieu ; `at`, le milieu du ruisseau (ou de l'eau) ; `bank`, le bord où Kéo s'arrête, du côté ouvert ; `beyond`, les
 * liaisons de l'embranchement entre elle et la porte ; `water`, le bout d'eau d'une passerelle de planches (la Turbine, la
 * Gare maritime), sinon rien (le ruisseau peint).
 */
export interface LinkObstacle {
  place: LinkedPlace;
  edge: number;
  /** Le bout de `edge` du côté du lieu (0 : son premier nœud, 1 : le second). */
  placeEnd: 0 | 1;
  at: Vec2;
  toward: Vec2;
  bank: NetworkPoint;
  beyond: readonly number[];
  water: { from: Vec2; to: Vec2; y: number } | null;
}

/**
 * Les marges entre une passerelle démontée et le pourtour de la brume de son lieu, en unités : son milieu à 2,5 unités au
 * moins (artiste technique 3D), et toute la passerelle, levées comprises, à 1 au moins : on la voit entière, hors du banc.
 */
export const VEIL_MARGIN = { middle: 2.5, whole: 1 } as const;

/**
 * Le ruisseau peint : sa largeur dans le sens du chemin, sa longueur en travers, son eau ; les levées de terre de ses
 * deux bords (largeur, hauteur, terre) ; les pieux (section, hauteur au-dessus du sol, écart au chemin, bois patiné) ;
 * le bout de corde coupée ; le bord où Kéo s'arrête, à tant d'unités du milieu du ruisseau.
 */
const STREAM = {
  width: 1.3,
  across: 5.6,
  water: 0x3e9fb2,
  levee: { width: 0.7, height: 0.32, earth: 0x8c6f4c, top: 0x9a7d58 },
  post: { size: 0.22, height: 1.0, out: 1.15, wood: 0x7a5636 },
  rope: { thick: 0.07, color: 0xd2bd8f },
  bank: 1.9,
} as const;

/** Le pont neuf d'un ruisseau : trois planches jointives, leur épaisseur, leur débord sur chaque berge, leur hauteur au-dessus du sol. */
const DECK = { count: 3, width: 0.56, thick: 0.1, reach: 0.75, lift: 0.3 } as const;

/** Les pieux d'un ruisseau, de part et d'autre de l'eau et de ses levées, depuis son milieu ; la demi-longueur du pont neuf. */
const POST_U = STREAM.width / 2 + STREAM.levee.width + 0.1;
const DECK_HALF = POST_U + DECK.reach;

/** Le bas des planches du pont neuf (le haut des traverses) : au-dessus du plus haut sol sous les pieux. */
function deckBase(o: LinkObstacle, ground: (x: number, z: number) => number): number {
  const at = frame(o);
  let top = -Infinity;
  for (const u of [-POST_U, POST_U])
    for (const v of [-STREAM.post.out, STREAM.post.out]) {
      const p = at(u, v);
      top = Math.max(top, standingHeight(ground(p.x, p.z)));
    }
  return top + DECK.lift;
}

/** Un point d'une liaison, à sa part `t`. */
function along(edge: number, t: number): Vec2 {
  const a = pathNode(PATH_EDGES[edge][0]).at;
  const b = pathNode(PATH_EDGES[edge][1]).at;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}

/** La passerelle démontée d'un lieu (calculée une fois). */
export function obstacleOf(place: LinkedPlace): LinkObstacle {
  const known = obstacles.get(place);
  if (known) return known;
  const branch = branchOf(place);
  // Le long de l'embranchement, de la porte vers le carrefour, par petits pas.
  const STEP = 0.25;
  let found: LinkObstacle | null = null;
  for (const [k, edge] of branch.edges.entries()) {
    const [a, b] = PATH_EDGES[edge];
    // Le bout du côté du lieu : celui d'où l'on vient en remontant l'embranchement.
    const placeEnd: 0 | 1 = a === branch.nodes[k] ? 0 : 1;
    const from = pathNode(placeEnd === 0 ? a : b).at;
    const to = pathNode(placeEnd === 0 ? b : a).at;
    const len = distance(from, to);
    const out = { x: (to.x - from.x) / len, z: (to.z - from.z) / len };
    const toward = { x: -out.x, z: -out.z };
    const tOf = (d: number) => (placeEnd === 0 ? d / len : 1 - d / len);
    if (isPlankBridge(a, b)) {
      // La vraie eau : la passerelle de planches, sans ses planches ; Kéo s'arrête sur la berge, avant l'eau.
      const span = plankSpan((x, z) => heightAt({ x, z }), from, to);
      if (!span) continue;
      const near = distance(span.to, to) < distance(span.from, to) ? span.to : span.from;
      const stop = Math.min(len, distance(from, near) + STREAM.bank * 0.6);
      found = {
        place,
        edge,
        placeEnd,
        at: { x: (span.from.x + span.to.x) / 2, z: (span.from.z + span.to.z) / 2 },
        toward,
        bank: { edge, t: tOf(stop), at: along(edge, tOf(stop)) },
        beyond: branch.edges.slice(0, k),
        water: span,
      };
      break;
    }
    // Le ruisseau peint : le premier point où il tient entier hors de la brume, sur la terre ferme, loin des coudes.
    const half = STREAM.width / 2 + STREAM.levee.width;
    // Le bord où Kéo s'arrête peut toucher le carrefour (un embranchement court : les Ruines), jamais le ruisseau.
    // Loin d'un coude (ses levées ne passent pas sur l'autre chemin du coude), au moins à un pas de la porte.
    const start = half + (k === 0 ? 1 : 2.5);
    for (let d = start; d + half + 0.6 <= len; d += STEP) {
      const c = { x: from.x + out.x * d, z: from.z + out.z * d };
      const inner = { x: c.x - out.x * half, z: c.z - out.z * half };
      if (underVeil(place, inner, VEIL_MARGIN.whole) || underVeil(place, c, VEIL_MARGIN.middle)) continue;
      if (heightAt(c) < 0.3 || portFloor(c.x, c.z) !== null) continue;
      const stop = Math.min(len, d + STREAM.bank);
      found = { place, edge, placeEnd, at: c, toward, bank: { edge, t: tOf(stop), at: along(edge, tOf(stop)) }, beyond: branch.edges.slice(0, k), water: null };
      break;
    }
    if (found) break;
  }
  if (!found) throw new Error(`Aucune place pour la passerelle de ${place}`);
  obstacles.set(place, found);
  return found;
}
const obstacles = new Map<LinkedPlace, LinkObstacle>();

/** Toutes les passerelles, dans l'ordre du plan. */
export const allObstacles = (): LinkObstacle[] => PLACES.map((p) => p.id).filter(isLinked).map(obstacleOf);

/**
 * Le point du réseau où va Kéo, les lieux `closed` fermés : au-delà d'une passerelle démontée (vers la porte de son lieu),
 * il s'arrête au bord, du côté ouvert (`bank`) ; ailleurs, le point lui-même. Le reste du réseau ne passe jamais par un
 * embranchement (un test le vérifie) : la marche n'a rien d'autre à éviter.
 */
export function clampToOpen(p: NetworkPoint, closed: readonly LinkedPlace[]): NetworkPoint {
  for (const place of closed) {
    const o = obstacleOf(place);
    if (o.beyond.includes(p.edge)) return o.bank;
    if (p.edge !== o.edge) continue;
    if (o.placeEnd === 0 ? p.t < o.bank.t : p.t > o.bank.t) return o.bank;
  }
  return p;
}

/** La zone de toucher d'une passerelle : un rayon autour d'elle, et, de loin, tant de pixels à l'écran au moins (48 et plus). */
export const OBSTACLE_TOUCH = { radius: 3.2, pixels: 30 } as const;

// ---------- Le dessin ----------

/** Un repère au milieu du ruisseau : `u` dans le sens de la marche vers le lieu, `v` en travers (à sa droite). */
function frame(o: LinkObstacle) {
  const d = o.toward;
  return (u: number, v: number): Vec2 => ({ x: o.at.x + d.x * u - d.z * v, z: o.at.z + d.z * u + d.x * v });
}

/**
 * Une levée de terre de `p` à `q` (au sol), de section en toit, large dans le sens `thick` (le sens du chemin) : sa base
 * enfouie un peu, ses deux pans en aplats (le pan vers le lieu un peu plus clair).
 */
function levee(b: FacetBuilder, ground: (x: number, z: number) => number, p: Vec2, q: Vec2, thick: Vec2): void {
  const L = STREAM.levee;
  const w = L.width / 2;
  const y = (v: Vec2) => standingHeight(ground(v.x, v.z));
  const side = (v: Vec2, s: number) => ({ x: v.x + thick.x * w * s, z: v.z + thick.z * w * s });
  const pl = side(p, -1), pr = side(p, 1), ql = side(q, -1), qr = side(q, 1);
  const top = (v: Vec2) => [v.x, y(v) + L.height, v.z] as const;
  const foot = (v: Vec2) => [v.x, y(v) - 0.1, v.z] as const;
  const ridgeP = top(p);
  const ridgeQ = top(q);
  b.quad(foot(pl), foot(ql), ridgeQ, ridgeP, L.earth);
  b.quad(foot(qr), foot(pr), ridgeP, ridgeQ, L.top);
  b.triangle(foot(pr), foot(pl), ridgeP, L.earth);
  b.triangle(foot(ql), foot(qr), ridgeQ, L.earth);
}

/**
 * Le dessin d'une passerelle : le ruisseau peint entre ses deux levées, et ses pieux ; démontée (`linked` faux), deux
 * traverses et le bout de corde coupée ; reliée, le pont neuf. À la Turbine et à la Gare maritime, la passerelle de
 * planches sur la vraie eau, sans ses planches tant qu'elle n'est pas reliée.
 */
export function linkFacets(o: LinkObstacle, linked: boolean, ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  if (o.water) {
    plankBridge(b, o.water.from, o.water.to, o.water.y, linked);
    if (!linked) rope(b, o, ground);
    return b.build();
  }
  const at = frame(o);
  const S = STREAM;
  const n = 4;
  // L'eau, immobile, à plat sur le sol, au-dessus du ruban du chemin.
  for (let k = 0; k < n; k++) {
    const v0 = -S.across / 2 + (S.across * k) / n;
    const v1 = -S.across / 2 + (S.across * (k + 1)) / n;
    const corners = [at(-S.width / 2, v0), at(-S.width / 2, v1), at(S.width / 2, v1), at(S.width / 2, v0)].map((p) => [p.x, standingHeight(ground(p.x, p.z)) + 0.1, p.z] as const);
    b.quad(corners[0], corners[1], corners[2], corners[3], S.water);
  }
  // Les deux levées, de part et d'autre de l'eau, un peu plus longues qu'elle.
  for (const u of [-1, 1]) {
    const c = S.width / 2 + S.levee.width / 2;
    for (let k = 0; k < n; k++) {
      const v0 = -(S.across + 0.4) / 2 + ((S.across + 0.4) * k) / n;
      const v1 = -(S.across + 0.4) / 2 + ((S.across + 0.4) * (k + 1)) / n;
      levee(b, ground, at(u * c, v0), at(u * c, v1), o.toward);
    }
  }
  // Les pieux : deux sur chaque bord, de part et d'autre du chemin.
  const yaw = Math.atan2(o.toward.x, o.toward.z);
  for (const u of [-POST_U, POST_U])
    for (const v of [-S.post.out, S.post.out]) {
      const p = at(u, v);
      b.box({ x: p.x, y: standingHeight(ground(p.x, p.z)) - 0.3, z: p.z, yaw }, [S.post.size, S.post.height + 0.3, S.post.size], S.post.wood);
    }
  // Les deux traverses, d'un pieu à l'autre sur chaque bord, à la hauteur où reposaient les planches.
  const deckY = deckBase(o, ground);
  for (const u of [-POST_U, POST_U]) {
    const a = at(u, -S.post.out - 0.15);
    const c = at(u, S.post.out + 0.15);
    b.beam({ x: a.x, y: deckY - 0.09, z: a.z }, { x: c.x, y: deckY - 0.09, z: c.z }, 0.18, linked ? NEW_WOOD.beam : S.post.wood);
  }
  if (linked) {
    // Le pont neuf : trois planches jointives, aux bords nets, posées sur les traverses dans le sens de la marche.
    for (let k = 0; k < DECK.count; k++) {
      const v = -(DECK.count * DECK.width) / 2 + DECK.width / 2 + k * DECK.width;
      const p = at(0, v);
      b.box({ x: p.x, y: deckY, z: p.z, yaw }, [DECK.width, DECK.thick, 2 * DECK_HALF], NEW_WOOD.side, NEW_WOOD.top);
    }
  } else rope(b, o, ground);
  return b.build();
}

/**
 * Le bout de corde coupée, côté ouvert : tendue de la tête d'un pieu vers l'eau, elle pend, son bout effiloché ; de
 * l'autre bord, l'autre moitié pend contre son pieu.
 */
function rope(b: FacetBuilder, o: LinkObstacle, ground: (x: number, z: number) => number): void {
  const R = STREAM.rope;
  const at = frame(o);
  const near = o.water ? -distance(o.water.from, o.water.to) / 2 - 0.2 : -POST_U;
  const far = -near;
  const v = STREAM.post.out;
  const y0 = (p: Vec2) => (o.water ? o.water.y : standingHeight(ground(p.x, p.z))) + STREAM.post.height - 0.05;
  const head = at(near, v);
  const h = y0(head);
  const points = [
    { u: near, y: h },
    { u: near + 0.35, y: h - 0.25 },
    { u: near + 0.55, y: h - 0.55 },
    { u: near + 0.6, y: h - 0.8 },
  ];
  for (let k = 0; k + 1 < points.length; k++) {
    const p = at(points[k].u, v);
    const q = at(points[k + 1].u, v);
    b.beam({ x: p.x, y: points[k].y, z: p.z }, { x: q.x, y: points[k + 1].y, z: q.z }, R.thick, R.color);
  }
  // Le bout effiloché : deux brins courts, écartés.
  const end = at(points[3].u, v);
  for (const s of [-1, 1]) {
    const tip = at(points[3].u + 0.08, v + s * 0.08);
    b.beam({ x: end.x, y: points[3].y, z: end.z }, { x: tip.x, y: points[3].y - 0.16, z: tip.z }, R.thick * 0.7, R.color);
  }
  // L'autre moitié, de l'autre bord, qui pend contre son pieu.
  const other = at(far, v);
  const oh = y0(other);
  const low = at(far - 0.2, v);
  b.beam({ x: other.x, y: oh, z: other.z }, { x: low.x, y: oh - 0.6, z: low.z }, R.thick, R.color);
}

/**
 * Les embranchements des lieux qu'on relie : leurs liaisons et leurs nœuds (sans le carrefour), que le maillage des lieux
 * dessine ; le maillage figé des chemins ne les a pas (`openPathRibbons`).
 */
export const BRANCH_EDGES: ReadonlySet<number> = new Set(PLACES.map((p) => p.id).filter(isLinked).flatMap((id) => branchOf(id).edges));
export const BRANCH_NODES: ReadonlySet<string> = new Set(PLACES.map((p) => p.id).filter(isLinked).flatMap((id) => branchOf(id).nodes));

/** Le maillage figé des chemins : tout le réseau sans les embranchements des lieux qu'on relie. */
export const openPathRibbons = (ground: (x: number, z: number) => number): Facets => pathRibbons(ground, BRANCH_EDGES, BRANCH_NODES);

/**
 * Le chemin de l'embranchement d'un lieu, du carrefour à sa porte : plein dans le monde et pour un lieu relié sur la
 * Carte ; sur la Carte, pour un lieu fermé, en tirets (`dashes`), plus épais pour la liaison suggérée (`thick`).
 */
export function branchRibbons(place: LinkedPlace, look: RibbonLook, ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  const branch = branchOf(place);
  for (const edge of branch.edges) edgeRibbon(b, ground, edge, look);
  if (look === 'solid') for (const id of branch.nodes) nodeOctagon(b, ground, id);
  return b.build();
}

/** Le dessus des planches du pont neuf d'une passerelle (sur un ruisseau peint ; rien sur la vraie eau). */
export const deckTop = (o: LinkObstacle, ground: (x: number, z: number) => number): number | null => (o.water ? null : deckBase(o, ground) + DECK.thick);

/**
 * La hauteur dont le pont neuf d'une passerelle reliée soulève Kéo en `p` (il marche sur ses planches, sans heurt : une
 * rampe courte à chaque bout), `top` le dessus de ses planches (`deckTop`), `here` le sol où Kéo se tient ; 0 ailleurs.
 * Sans rien allouer : la vue l'appelle à chaque image.
 */
export function deckLift(p: Vec2, o: LinkObstacle, top: number, here: number): number {
  const dx = p.x - o.at.x;
  const dz = p.z - o.at.z;
  const u = dx * o.toward.x + dz * o.toward.z;
  const v = -dx * o.toward.z + dz * o.toward.x;
  if (Math.abs(v) > (DECK.count * DECK.width) / 2 + 0.3 || Math.abs(u) > DECK_HALF) return 0;
  const ramp = Math.min(1, (DECK_HALF - Math.abs(u)) / DECK.reach);
  return Math.max(0, (top - here) * ramp);
}

/** Les nœuds d'un réseau sans les embranchements fermés (`closed`) : la marche n'y passe pas au-delà d'une passerelle démontée. */
export function reachableNodes(from: string, closed: readonly LinkedPlace[]): Set<string> {
  const cut = new Set(closed.flatMap((p) => [...obstacleOf(p).beyond, obstacleOf(p).edge]));
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    PATH_EDGES.forEach(([a, b], i) => {
      if (cut.has(i) || (a !== here && b !== here)) return;
      const there = a === here ? b : a;
      if (seen.has(there)) return;
      seen.add(there);
      queue.push(there);
    });
  }
  return seen;
}
