// Le réseau des chemins du 3e (lot 1 du monde ouvert du 3e) : ses nœuds et ses liaisons (./plan3e.ts), le plus court
// trajet, et son dessin, un ruban par liaison comme au 6e, au 5e et au 4e (./paths.ts, `networkRibbons`). Le ruban
// s'arrête aux culées d'un passage : le pont du glacier, sur la langue de glace ; la galerie du col, dans l'arête ; les
// arches basses, sur les nuages (./bridges.ts les dessine). Avec eux, dans le même maillage (aucun appel de plus) : le
// liseré d'ardoise de toutes les rives, les deux petites arches des Prairies, toujours ouvertes, et l'aire de la Nef au
// milieu du Parvis, un disque de pierre cerclé de métal. Code pur.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import type { LinkedLand } from './lands';
import { createNetwork } from './network';
import { BRIDGE_ABUT } from './plan6e';
import { COLORS_3E, LINKS_3E, PARVIS, PARVIS_PAD, PATH_EDGES_3E, PATH_NODES_3E, parvisFloor, type Cut3e } from './plan3e';
import { networkRibbons, type RibbonNet } from './paths';
import { areteEstClearance, landDistance3e, langueClearance, shoreRimFacets, smallArchFacets, smallArchFloor } from './terrain3e';

/** Le réseau du 3e. */
export const NETWORK_3E = createNetwork(PATH_NODES_3E, PATH_EDGES_3E);

/** Les terres du 3e qu'on relie, et leur passage. */
type Link3e = keyof typeof LINKS_3E;

/** Une terre qu'on relie est-elle du 3e ? */
export const isLand3e = (land: LinkedLand): land is Link3e => land in LINKS_3E;

/**
 * La distance au bord de chaque coupure : négative dedans (la langue de glace, l'arête du col, les nuages entre le
 * Versant et la grande Prairie).
 */
export const CUT_CLEARANCE_3E: Readonly<Record<Cut3e, (p: Vec2) => number>> = { glace: langueClearance, col: areteEstClearance, nuages: landDistance3e };

/** La part d'une liaison, de `a` à `c`, où `inside` est vrai (de `from` à `to` unités depuis `a`). */
function spanWhere(a: Vec2, c: Vec2, inside: (p: Vec2) => boolean): [number, number] {
  const len = distance(a, c);
  const STEP = 0.05;
  let from = len;
  let to = 0;
  for (let d = 0; d <= len; d += STEP) {
    if (!inside({ x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len })) continue;
    from = Math.min(from, d);
    to = Math.max(to, d);
  }
  return [from, to];
}

/** La part d'un passage du 3e que prennent les culées de son ouvrage : à moins de `BRIDGE_ABUT` unités de sa coupure, comme au 6e. */
export const passageCut3e = (a: Vec2, c: Vec2, land: Link3e): readonly [number, number] => spanWhere(a, c, (p) => CUT_CLEARANCE_3E[LINKS_3E[land].cut](p) < BRIDGE_ABUT);

/** Le passage d'une liaison du 3e, s'il y en a un. */
function passageOfEdge(ia: string, ib: string): Link3e | null {
  for (const land of Object.keys(LINKS_3E) as Link3e[]) {
    const [u, v] = LINKS_3E[land].bridge;
    if ((u === ia && v === ib) || (u === ib && v === ia)) return land;
  }
  return null;
}

const cuts = new Map<number, readonly [number, number] | null>();

/** La part d'une liaison que prend un passage (ses culées), ou rien. */
function cutOf(edge: number): readonly [number, number] | null {
  if (!cuts.has(edge)) {
    const [ia, ib] = PATH_EDGES_3E[edge];
    const land = passageOfEdge(ia, ib);
    cuts.set(edge, land ? passageCut3e(NETWORK_3E.pathNode(ia).at, NETWORK_3E.pathNode(ib).at, land) : null);
  }
  return cuts.get(edge)!;
}

/**
 * Le réseau du 3e, pour son dessin : ni la pierre du Parvis ni la chaussée des petites arches n'ont de sentier. Les
 * chemins sont de pierre claire froide, bordés d'un liseré d'ardoise bas (lot du Versant ; directeur artistique, lot 1,
 * point 9, et relecture des lieux, point 22 : la pierre claire ne se détache de l'herbe qu'à 1,8 contre 1, le liseré est
 * obligatoire) : à juger contre le sable du lot 1 sur captures.
 */
export const RIBBONS_3E: RibbonNet = {
  edges: PATH_EDGES_3E,
  node: (id) => NETWORK_3E.pathNode(id),
  cut: cutOf,
  skip: (p) => parvisFloor(p.x, p.z) !== null || smallArchFloor(p.x, p.z) !== null,
  planks: () => false,
  look: { path: COLORS_3E.parvis, edge: COLORS_3E.slate },
};

/** Le métal qui cercle l'aire de la Nef : un gris bleuté, plus sombre que la pierre claire (jamais presque noir). */
const PAD_RING = 0x6b7690;

/**
 * L'aire de la Nef (fiche, § 5) : au milieu de la place du Parvis, un disque de pierre claire, à peine plus haut que la
 * place, cerclé de métal. Un décor : on y marche comme sur la place.
 */
function parvisPadFacets(): Facets {
  const b = new FacetBuilder();
  const { center, radius, deck } = PARVIS_PAD;
  b.prism({ x: center.x, y: deck - 0.2, z: center.z }, radius, radius, 0.2, 16, COLORS_3E.graniteSun, COLORS_3E.parvis);
  b.band({ x: center.x, y: deck - 0.22, z: center.z }, radius + 0.06, 0.28, 16, PAD_RING);
  return placeFacets(b.build(), { x: PARVIS.origin.x, y: 0, z: PARVIS.origin.z, yaw: PARVIS.yaw });
}

/** Les chemins du 3e : un ruban par liaison, un octogone par nœud ; le liseré d'ardoise des rives, les petites arches, l'aire de la Nef. */
export const pathRibbons3e = (ground: (x: number, z: number) => number): Facets =>
  mergeFacets([networkRibbons(RIBBONS_3E, ground), shoreRimFacets(), smallArchFacets(), parvisPadFacets()]);
