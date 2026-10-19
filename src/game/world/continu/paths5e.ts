// Le réseau des chemins du 5e (GD-22, lot 2) : ses nœuds et ses liaisons (./plan5e.ts), le plus court trajet, et son
// dessin, un ruban par liaison comme au 6e (./paths.ts, `networkRibbons`). Le ruban s'arrête aux culées d'un pont, et
// ne monte pas la falaise : la cabine de la Montée y passe (./bridges.ts la dessine). Le ponton de la Lisière, au bout
// du quai, est dessiné avec eux (un décor du même maillage, aucun appel de plus). Code pur.
import { FacetBuilder, mergeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { createNetwork } from './network';
import type { LinkedLand } from './lands';
import { BRIDGE_ABUT } from './plan6e';
import { COLORS_5E, LINKS_5E, PATH_EDGES_5E, PATH_NODES_5E, QUAY_5E } from './plan5e';
import { networkRibbons, type RibbonNet } from './paths';
import { channelClearance, plateauShare } from './terrain5e';

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

/** Le réseau du 5e, pour son dessin. */
export const RIBBONS_5E: RibbonNet = {
  edges: PATH_EDGES_5E,
  node: (id) => NETWORK_5E.pathNode(id),
  cut: (edge) => {
    if (!cuts.has(edge)) {
      const [ia, ib] = PATH_EDGES_5E[edge];
      const land = passageOfEdge(ia, ib);
      cuts.set(edge, land ? passageCut(NETWORK_5E.pathNode(ia).at, NETWORK_5E.pathNode(ib).at, land) : null);
    }
    return cuts.get(edge)!;
  },
  skip: () => false,
  planks: () => false,
};

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

/** Les chemins du 5e : un ruban par liaison, un octogone par nœud ; et le ponton de la Lisière. */
export const pathRibbons5e = (ground: (x: number, z: number) => number): Facets => mergeFacets([networkRibbons(RIBBONS_5E, ground), quayFacets()]);
