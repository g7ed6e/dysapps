// Le réseau des chemins du 5e (GD-22, lot 2) : ses nœuds et ses liaisons (./plan5e.ts), le plus court trajet, et son
// dessin, un ruban par liaison comme au 6e (./paths.ts, `networkRibbons`). Le ruban s'arrête aux culées d'un pont, et
// ne monte pas la falaise : la cabine de la Montée y passe (./bridges.ts la dessine). Le ponton de la Lisière, au bout
// du quai, est dessiné avec eux (un décor du même maillage, aucun appel de plus). Sur le plateau, plus de sable : les
// chaussées dallées des Aiguilles (lot 13a, `causewayFacets`), dans le même maillage. Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { createNetwork } from './network';
import type { LinkedLand } from './lands';
import { lowRock } from './monteeSurroundings';
import { BRIDGE_ABUT } from './plan6e';
import { COLORS_5E, LINKS_5E, PATH_EDGES_5E, PATH_NODES_5E, QUAY_5E, lisiereFloor } from './plan5e';
import { RIBBON_LIFT, RIBBON_SIDE, RIBBON_STEP, networkRibbons, type RibbonNet } from './paths';
import { standingHeight } from './terrain';
import { channelClearance, plateauRim5e, plateauShare } from './terrain5e';

/** Le réseau du 5e. */
export const NETWORK_5E = createNetwork(PATH_NODES_5E, PATH_EDGES_5E);

/** Les terres du 5e qu'on relie, et leur passage. */
type Link5e = keyof typeof LINKS_5E;

/** La cabine de la Montée : son rail commence tant d'unités avant le pied de la falaise et finit tant après son rebord. */
const CABIN_SPAN = { before: 6, after: 1.5 } as const;

/** La part d'une liaison qu'on parcourt, de `a` à `c` par pas de `STEP` : de `from` à `to` (en unités depuis `a`), où `wet` est vrai. */
function spanWhere(a: Vec2, c: Vec2, wet: (p: Vec2) => boolean): [number, number] {
  const len = distance(a, c);
  const STEP = 0.05;
  let from = len;
  let to = 0;
  for (let d = 0; d <= len; d += STEP) {
    if (!wet({ x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len })) continue;
    from = Math.min(from, d);
    to = Math.max(to, d);
  }
  return [from, to];
}

/**
 * La part d'un passage du 5e que prennent ses ouvrages, de `a` à `c` : pour un pont, ses culées, là où l'on est à moins
 * de `BRIDGE_ABUT` unités de l'eau de son chenal (comme au 6e) ; pour la cabine, son rail, du peu avant le pied de la
 * falaise jusqu'au peu après son rebord.
 */
export function passageCut(a: Vec2, c: Vec2, land: Link5e): readonly [number, number] {
  const link = LINKS_5E[land];
  if (link.kind === 'pont') return spanWhere(a, c, (p) => channelClearance(p, link.channel) < BRIDGE_ABUT);
  const [foot, top] = spanWhere(a, c, (p) => plateauShare(p) > 0.02 && plateauShare(p) < 0.98);
  return [Math.max(0, foot - CABIN_SPAN.before), Math.min(distance(a, c), top + CABIN_SPAN.after)];
}

/** Le passage (pont ou cabine) d'une liaison du 5e, s'il y en a un. */
function passageOfEdge(ia: string, ib: string): Link5e | null {
  for (const land of Object.keys(LINKS_5E) as Link5e[]) {
    const [u, v] = LINKS_5E[land].bridge;
    if ((u === ia && v === ib) || (u === ib && v === ia)) return land;
  }
  return null;
}

/** Une terre qu'on relie est-elle du 5e ? */
export const isLand5e = (land: LinkedLand): land is Link5e => land in LINKS_5E;

const cuts = new Map<number, readonly [number, number] | null>();

/** La part d'une liaison que prend un pont ou la cabine (ses culées, son rail), ou rien. */
function cutOf(edge: number): readonly [number, number] | null {
  if (!cuts.has(edge)) {
    const [ia, ib] = PATH_EDGES_5E[edge];
    const land = passageOfEdge(ia, ib);
    cuts.set(edge, land ? passageCut(NETWORK_5E.pathNode(ia).at, NETWORK_5E.pathNode(ib).at, land) : null);
  }
  return cuts.get(edge)!;
}

/**
 * Les chaussées du plateau (GD-22, lot 13a ; intention du directeur artistique du 20 octobre 2026, partie A, et « Communs
 * des Aiguilles », point 2) : sur tout le plateau, de la gare haute de la cabine aux cinq lieux des Aiguilles, des dalles
 * chaudes (`slab`), rectangulaires, en long, à joints nets (`joint`), un liseré continu des deux côtés (`rim` de large,
 * de la couleur des joints) ; 3 unités de large (`half`). La chaussée se lit par ses joints et son liseré, jamais par sa
 * seule couleur (le contraste avec la pierre au soleil est faible). Les dalles font deux pas du ruban de long (`slabSteps`),
 * leurs joints en travers décalés d'un pas d'une moitié à l'autre. Là où elle passe à moins de `edge.reach` unités du
 * rebord du plateau, un rang de pierres brutes basses du côté du vide (`edge` : leur rayon, leur hauteur, leur écart au
 * bord de la chaussée ; aucune sous la gare haute de la cabine, longue de 4, au bout du rail), jamais un parapet. Ni
 * lanterne, ni borne, ni passerelle.
 */
export const CAUSEWAY_5E = {
  half: 1.5,
  rim: 0.2,
  joint: 0.06,
  slabSteps: 2,
  slab: 0xcfc6b4,
  line: COLORS_5E.stoneShade,
  edge: { reach: 10, r: 0.42, h: 0.3, out: 0.55, lean: 0.3, station: 4.5 },
} as const;

/** Les pans du nœud d'une chaussée : son liseré et son disque de dalle. */
const NODE_SIDES = 12;

/**
 * Le morceau [`d0`, `d1`] d'une liaison est-il à moins de `edge.station` unités de sa coupe (`cut`, la part du rail de
 * la cabine), d'un côté ou de l'autre ? Sous la gare haute, aucune pierre ; quel que soit le sens de la liaison (l'expert
 * frontend, relecture du lot 13a : la coupe au début ou à la fin).
 */
export function besideStation(cut: readonly [number, number] | null, d0: number, d1: number): boolean {
  return cut !== null && d1 > cut[0] - CAUSEWAY_5E.edge.station && d0 < cut[1] + CAUSEWAY_5E.edge.station;
}

/** Un point est-il sur le dessus du plateau, où le sable laisse la place aux chaussées ? */
const upper = (p: Vec2): boolean => plateauShare(p) > 0.5;

/** Les pas du ruban d'une liaison où passe une chaussée : de `from` à `to` unités de son premier nœud, ou rien. */
const causewaySpans = new Map<number, readonly [number, number] | null>();
function causewaySpan(edge: number): readonly [number, number] | null {
  if (!causewaySpans.has(edge)) {
    const [ia, ib] = PATH_EDGES_5E[edge];
    const a = NETWORK_5E.pathNode(ia).at;
    const c = NETWORK_5E.pathNode(ib).at;
    let span: [number, number] | null = null;
    for (const [d0, d1] of ribbonPieces(edge)) {
      if (!upper(along(a, c, (d0 + d1) / 2))) continue;
      span = span ? [span[0], d1] : [d0, d1];
    }
    causewaySpans.set(edge, span);
  }
  return causewaySpans.get(edge)!;
}

/** Le point à `d` unités de `a`, vers `c`. */
function along(a: Vec2, c: Vec2, d: number): Vec2 {
  const len = distance(a, c);
  return { x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len };
}

/** Les morceaux du ruban d'une liaison (comme ./paths.ts, `edgeRibbon`) : un par pas, sans la part d'un pont ou de la cabine. */
function ribbonPieces(edge: number): [number, number][] {
  const [ia, ib] = PATH_EDGES_5E[edge];
  const len = distance(NETWORK_5E.pathNode(ia).at, NETWORK_5E.pathNode(ib).at);
  const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
  const cut = cutOf(edge);
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const d0 = (len * k) / n;
    const d1 = (len * (k + 1)) / n;
    const spans: [number, number][] = cut ? [[d0, Math.min(d1, cut[0])], [Math.max(d0, cut[1]), d1]] : [[d0, d1]];
    for (const [s0, s1] of spans) if (s1 - s0 >= 1e-3) out.push([s0, s1]);
  }
  return out;
}

/** Le réseau du 5e, pour son dessin. */
export const RIBBONS_5E: RibbonNet = {
  edges: PATH_EDGES_5E,
  node: (id) => NETWORK_5E.pathNode(id),
  cut: cutOf,
  // La pierre de la Lisière (GD-22, lot 4) : Kéo y marche, aucun sentier n'y est dessiné, comme à l'Escale. Le dessus du
  // plateau : ses chaussées dallées remplacent le sable (lot 13a, `causewayFacets`).
  skip: (p) => lisiereFloor(p.x, p.z) !== null || upper(p),
  planks: () => false,
  width: (edge, d) => {
    const span = causewaySpan(edge);
    return span && d >= span[0] - 1e-6 && d <= span[1] + 1e-6 ? CAUSEWAY_5E.half : null;
  },
  widest: CAUSEWAY_5E.half,
};

/**
 * Les chaussées du plateau (`CAUSEWAY_5E`), sur le sol `ground` : par liaison, un morceau par pas du ruban, posé comme
 * lui (à plat en travers, à la hauteur du sol sur sa ligne, ses flancs qui descendent), ses dalles, son liseré et ses
 * joints ; sur chaque nœud du plateau, un disque de dalle sur un octogone du liseré, comme le sable au coude d'un
 * sentier ; le rang de pierres du côté du vide, près du rebord. Dans le maillage des chemins : aucun appel de plus.
 */
export function causewayFacets(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  const W = CAUSEWAY_5E;
  const inner = W.half - W.rim;
  const drop = 0.004;
  let stones = 0;
  PATH_EDGES_5E.forEach(([ia, ib], edge) => {
    const a = NETWORK_5E.pathNode(ia).at;
    const c = NETWORK_5E.pathNode(ib).at;
    const len = distance(a, c);
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    const n = Math.max(1, Math.ceil(len / RIBBON_STEP));
    // À gauche du sens de marche : (dz, −dx), à `o` unités de la ligne, à la hauteur `y`.
    const side = (v: Vec2, y: number, o: number) => [v.x + dz * o, y, v.z - dx * o] as const;
    for (const [d0, d1] of ribbonPieces(edge)) {
      const p = along(a, c, d0);
      const q = along(a, c, d1);
      const mid = along(a, c, (d0 + d1) / 2);
      if (!upper(mid)) continue;
      const yp = standingHeight(ground(p.x, p.z)) + RIBBON_LIFT;
      const yq = standingHeight(ground(q.x, q.z)) + RIBBON_LIFT;
      // Les dalles, puis le liseré de chaque côté, un rien plus bas (sous le disque d'un coude), et ses flancs.
      b.quad(side(p, yp, inner), side(p, yp, -inner), side(q, yq, -inner), side(q, yq, inner), W.slab);
      for (const s of [1, -1]) {
        const o0 = s * inner;
        const o1 = s * W.half;
        const [l0, l1] = s > 0 ? [o1, o0] : [o0, o1];
        b.quad(side(p, yp - drop, l0), side(p, yp - drop, l1), side(q, yq - drop, l1), side(q, yq - drop, l0), W.line);
        const top0 = side(p, yp - drop, o1);
        const top1 = side(q, yq - drop, o1);
        const down = (v: readonly [number, number, number]) => [v[0], v[1] - RIBBON_SIDE, v[2]] as const;
        if (s > 0) b.quad(down(top1), down(top0), top0, top1, W.line);
        else b.quad(down(top0), down(top1), top1, top0, W.line);
      }
      // Les joints : le long du milieu, et en travers, d'une moitié puis de l'autre (des dalles en long, décalées).
      const k = Math.round((d0 / len) * n);
      const yj = (y: number) => y + drop;
      const j = W.joint / 2;
      b.quad(side(p, yj(yp), j), side(p, yj(yp), -j), side(q, yj(yq), -j), side(q, yj(yq), j), W.line);
      const half = k % W.slabSteps === 0 ? 1 : -1;
      const p1 = along(a, c, Math.min(d1, d0 + W.joint));
      const y1 = yj(standingHeight(ground(p1.x, p1.z)) + RIBBON_LIFT);
      const [o0, o1] = half > 0 ? [inner, j] : [-j, -inner];
      b.quad(side(p, yj(yp), o0), side(p, yj(yp), o1), side(p1, y1, o1), side(p1, y1, o0), W.line);
      // Le rang de pierres du côté du vide, là où la chaussée passe près du rebord (et seulement d'un côté).
      const rim = plateauRim5e(mid);
      if (rim >= W.edge.reach || besideStation(cutOf(edge), d0, d1)) continue;
      const out = W.half + W.edge.out;
      const left = plateauRim5e({ x: mid.x + dz * out, z: mid.z - dx * out });
      const right = plateauRim5e({ x: mid.x - dz * out, z: mid.z + dx * out });
      if (Math.abs(left - right) < W.edge.lean) continue;
      const o = left < right ? out : -out;
      const at = { x: mid.x + dz * o, z: mid.z - dx * o };
      lowRock(b, { x: at.x, y: standingHeight(ground(at.x, at.z)), z: at.z }, W.edge.r, W.edge.h, 31 + stones++);
    }
  });
  // Les nœuds du plateau : le liseré à douze pans, ses coins au bord même des chaussées (à leur demi-largeur : aucun coin
  // ne dépasse au dehors d'un carrefour, retouche 1), et dessus le disque de dalle (les dalles se rejoignent au coude).
  const ids = new Set(PATH_EDGES_5E.flat());
  for (const id of ids) {
    const at = NETWORK_5E.pathNode(id).at;
    if (!upper(at)) continue;
    const y = standingHeight(ground(at.x, at.z)) + RIBBON_LIFT;
    const w = W.half;
    b.prism({ x: at.x, y: y - drop * 2 - RIBBON_SIDE, z: at.z }, w, w, RIBBON_SIDE, NODE_SIDES, W.line);
    const r = inner / Math.cos(Math.PI / NODE_SIDES);
    const discPoint = (k: number) => [at.x + r * Math.cos((2 * Math.PI * k) / NODE_SIDES), y, at.z + r * Math.sin((2 * Math.PI * k) / NODE_SIDES)] as const;
    for (let k = 0; k < NODE_SIDES; k++) b.triangle([at.x, y, at.z], discPoint(k + 1), discPoint(k), W.slab);
  }
  return b.build();
}

/** Le pas des pieux du ponton, le long de lui, et leur pied sous l'eau. */
const QUAY_PILES = { step: 3, foot: -2.4 } as const;

/**
 * Le ponton de la Lisière (./plan5e.ts, `QUAY_5E`) : son tablier de planches, à plat, de la rive au cœur de l'anse, des
 * lattes plus sombres en travers, ses pieux deux à deux ; à son bout, deux poteaux et leurs lanternes d'ocre (la couleur
 * de la lanterne, `COLORS_5E.lantern`, que la vue du 5e dessine sans ombre : elle se lit comme une lumière, sans rien
 * qui bouge), sous un petit toit de bois. Trois aplats : les planches, leur ombre, l'ocre des lanternes.
 */
export function quayFacets(): Facets {
  const b = new FacetBuilder();
  const { from, to, width, deck } = QUAY_5E;
  const len = distance(from, to);
  const yaw = Math.atan2(to.x - from.x, to.z - from.z);
  const along = (d: number, side: number) => ({ x: from.x + ((to.x - from.x) * d) / len + Math.cos(yaw) * side, z: from.z + ((to.z - from.z) * d) / len - Math.sin(yaw) * side });
  const mid = along(len / 2, 0);
  b.box({ x: mid.x, y: deck - 0.25, z: mid.z, yaw }, [width, 0.25, len], COLORS_5E.plankShade, COLORS_5E.plank);
  for (let d = 1.5; d < len; d += 2.5) {
    const p = along(d, 0);
    b.box({ x: p.x, y: deck, z: p.z, yaw }, [width, 0.04, 0.3], COLORS_5E.plankShade);
  }
  for (let d = 0.6; d < len; d += QUAY_PILES.step)
    for (const side of [-1, 1]) {
      const p = along(d, side * (width / 2 - 0.2));
      b.prism({ x: p.x, y: QUAY_PILES.foot, z: p.z, yaw }, 0.24, 0.22, deck - QUAY_PILES.foot - 0.2, 5, COLORS_5E.plankShade);
    }
  for (const side of [-1, 1]) {
    const p = along(len - 0.5, side * (width / 2 - 0.15));
    b.box({ x: p.x, y: deck, z: p.z, yaw }, [0.22, 1.9, 0.22], COLORS_5E.plankShade);
    b.box({ x: p.x, y: deck + 1.9, z: p.z, yaw }, [0.55, 0.6, 0.55], COLORS_5E.lantern);
    b.prism({ x: p.x, y: deck + 2.5, z: p.z, yaw: yaw + Math.PI / 4 }, 0.5, 0, 0.35, 4, COLORS_5E.plankShade);
  }
  return b.build();
}

/** Les chemins du 5e : un ruban par liaison, un octogone par nœud ; les chaussées du plateau ; et le ponton de la Lisière. */
export const pathRibbons5e = (ground: (x: number, z: number) => number): Facets => mergeFacets([networkRibbons(RIBBONS_5E, ground), causewayFacets(ground), quayFacets()]);

/**
 * Le liseré des chemins du 5e sur la Carte (référent dys, seconde relecture du lot 2) : de loin, le liseré brun du
 * sentier (`PATH_EDGE`, ./paths.ts, 0,14 unité) n'a pas un pixel et ne se lit qu'en pointillé ; le sable seul, sur la
 * pierre du plateau et sous la brume claire des terres fermées, tombait sous 3:1. Sur la Carte seulement, une bande
 * sombre de chaque côté du ruban, juste hors de son sable (la couleur sombre de la falaise), un rien au-dessus de lui :
 * elle ne couvre jamais le sable, et se lit d'au moins un pixel sur la Carte de la tablette. Ni sur l'eau (le bois des
 * pontons : un morceau dont un bout ou le milieu est sur l'eau n'en a pas), ni sur les passages (le trait double des
 * ponts et de la cabine). Dans le maillage des lieux, comme la ligne de la falaise : aucun appel de plus.
 */
export function pathMapEdges5e(ground: (x: number, z: number) => number, color: number): Facets {
  const b = new FacetBuilder();
  const { inner, outer, lift, step } = PATH_MAP_EDGE;
  PATH_EDGES_5E.forEach(([ia, ib], edge) => {
    const a = NETWORK_5E.pathNode(ia).at;
    const c = NETWORK_5E.pathNode(ib).at;
    const len = distance(a, c);
    const n = Math.max(1, Math.ceil(len / step));
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    const cut = RIBBONS_5E.cut(edge);
    const point = (d: number) => ({ x: a.x + dx * d, z: a.z + dz * d });
    const side = (v: Vec2, y: number, o: number) => [v.x + dz * o, y, v.z - dx * o] as const;
    for (let k = 0; k < n; k++) {
      const d0 = (len * k) / n;
      const d1 = (len * (k + 1)) / n;
      // Le morceau entier sur la terre, ses deux bouts et son milieu : un morceau à cheval sur la côte ne déborde pas sur l'eau.
      if ([d0, (d0 + d1) / 2, d1].some((d) => { const v = point(d); return ground(v.x, v.z) < 0.05; })) continue;
      const spans: [number, number][] = cut ? [[d0, Math.min(d1, cut[0])], [Math.max(d0, cut[1]), d1]] : [[d0, d1]];
      for (const [s0, s1] of spans) {
        if (s1 - s0 < 1e-3) continue;
        const p = point(s0);
        const q = point(s1);
        const y = Math.max(standingHeight(ground(p.x, p.z)), standingHeight(ground(q.x, q.z))) + lift;
        // Les deux bandes, du côté le plus à gauche au plus à droite : le même sens de tour que la ligne de la falaise (vers le haut).
        for (const [o0, o1] of [[inner, outer], [-outer, -inner]] as const) b.quad(side(p, y, o0), side(q, y, o0), side(q, y, o1), side(p, y, o1), color);
      }
    }
  });
  return b.build();
}

/**
 * La bande sombre des chemins sur la Carte : de `inner` (le bord du sable du ruban, ./paths.ts, `HALF_WIDTH.path` moins
 * son liseré) à `outer` unités de la ligne, `lift` au-dessus du sol (le ruban est à 0,06 : la bande ne passe pas sous
 * le terrain entre deux pas), par pas de `step` (celui du ruban).
 */
export const PATH_MAP_EDGE = { inner: 0.66, outer: 1.4, lift: 0.3, step: 1.25 } as const;
