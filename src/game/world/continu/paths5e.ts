// Le réseau des chemins du 5e (GD-22, lot 2) : ses nœuds et ses liaisons (./plan5e.ts), le plus court trajet, et son
// dessin, un ruban par liaison comme au 6e (./paths.ts, `networkRibbons`). Le ruban s'arrête aux culées d'un pont, et
// ne monte pas la falaise : la cabine de la Montée y passe (./bridges.ts la dessine). Code pur.
import { distance, type Vec2 } from './geometry';
import { createNetwork } from './network';
import type { LinkedLand } from './lands';
import { BRIDGE_ABUT } from './plan6e';
import { LINKS_5E, PATH_EDGES_5E, PATH_NODES_5E } from './plan5e';
import { networkRibbons, type RibbonNet } from './paths';
import { channelClearance, plateauShare } from './terrain5e';
import type { Facets } from './facets';

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
const RIBBONS_5E: RibbonNet = {
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

/** Les chemins du 5e : un ruban par liaison, un octogone par nœud. */
export const pathRibbons5e = (ground: (x: number, z: number) => number): Facets => networkRibbons(RIBBONS_5E, ground);
