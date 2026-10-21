// Le réseau des chemins du 4e (lot 1 du monde ouvert du 4e) : ses nœuds et ses liaisons (./plan4e.ts), le plus court
// trajet, et son dessin, un ruban par liaison comme au 6e et au 5e (./paths.ts, `networkRibbons`). Le ruban s'arrête aux
// culées d'un pont : le pont du bassin, sur l'eau ; le pont du ravin et le pont de basalte, sur une coupure sèche
// (./bridges.ts les dessine). Avec eux, dans le même maillage (aucun appel de plus) : la ligne de rails en masses (son
// ballast, ses deux rails de fer rouillé, ses traverses, le butoir et les heurtoirs), la rigole couverte de la Forge,
// vide et grise, et la jetée de la Crique jusqu'à l'aire de la Nef. Code pur.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import type { LinkedLand } from './lands';
import { createNetwork } from './network';
import { BRIDGE_ABUT } from './plan6e';
import { COLORS_4E, CRIQUE, CRIQUE_PAD, LINKS_4E, PATH_EDGES_4E, PATH_NODES_4E, RAILS_4E, RIGOLE_4E, criqueFloor, type Cut4e } from './plan4e';
import { networkRibbons, type RibbonNet } from './paths';
import { standingHeight } from './terrain';
import { bassinClearance, couleeClearance, ravinClearance } from './terrain4e';

/** Le réseau du 4e. */
export const NETWORK_4E = createNetwork(PATH_NODES_4E, PATH_EDGES_4E);

/** Les terres du 4e qu'on relie, et leur passage. */
type Link4e = keyof typeof LINKS_4E;

/** Une terre qu'on relie est-elle du 4e ? */
export const isLand4e = (land: LinkedLand): land is Link4e => land in LINKS_4E;

/** La distance au bord de chaque coupure : négative dedans (l'eau du bassin, le creux du ravin, la croûte de la coulée). */
export const CUT_CLEARANCE_4E: Readonly<Record<Cut4e, (p: Vec2) => number>> = { bassin: bassinClearance, ravin: ravinClearance, coulee: couleeClearance };

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

/** La part d'un passage du 4e que prennent les culées de son pont : à moins de `BRIDGE_ABUT` unités de sa coupure, comme au 6e. */
export const passageCut4e = (a: Vec2, c: Vec2, land: Link4e): readonly [number, number] => spanWhere(a, c, (p) => CUT_CLEARANCE_4E[LINKS_4E[land].cut](p) < BRIDGE_ABUT);

/** Le passage d'une liaison du 4e, s'il y en a un. */
function passageOfEdge(ia: string, ib: string): Link4e | null {
  for (const land of Object.keys(LINKS_4E) as Link4e[]) {
    const [u, v] = LINKS_4E[land].bridge;
    if ((u === ia && v === ib) || (u === ib && v === ia)) return land;
  }
  return null;
}

const cuts = new Map<number, readonly [number, number] | null>();

/** La part d'une liaison que prend un pont (ses culées), ou rien. */
function cutOf(edge: number): readonly [number, number] | null {
  if (!cuts.has(edge)) {
    const [ia, ib] = PATH_EDGES_4E[edge];
    const land = passageOfEdge(ia, ib);
    cuts.set(edge, land ? passageCut4e(NETWORK_4E.pathNode(ia).at, NETWORK_4E.pathNode(ib).at, land) : null);
  }
  return cuts.get(edge)!;
}

/** Le réseau du 4e, pour son dessin : la pierre de la Crique n'a pas de sentier, comme l'Escale. */
export const RIBBONS_4E: RibbonNet = {
  edges: PATH_EDGES_4E,
  node: (id) => NETWORK_4E.pathNode(id),
  cut: cutOf,
  skip: (p) => criqueFloor(p.x, p.z) !== null,
  planks: () => false,
};

/**
 * La ligne de rails en masses (fiche, § 5 ; lot 1) : un ballast brun, deux rails de fer rouillé, une traverse de bois
 * tous les `sleeper` unités ; au bout de la ligne, contre la halle de l'Étalon, le butoir (un bloc de bois cerclé de
 * cuivre) ; au bout des deux voies de service de la Jonction, un heurtoir. Ni benne ni aiguillage au lot 1. Les rails
 * s'arrêtent aux culées des ponts (`railCut`) : le pont, posé, les porte de rive à rive.
 */
const RAILS_LOOK_4E = { gauge: 0.7, rail: 0.12, ballast: 1.15, ballastTop: 0.1, sleeper: 1.6, sleeperLength: 1.5, lift: 0.07 } as const;

/** Un point est-il sous un pont (dans la part que prennent ses culées) ? Les rails s'y arrêtent. */
const railCut = (p: Vec2): boolean => (Object.keys(LINKS_4E) as Link4e[]).some((land) => CUT_CLEARANCE_4E[LINKS_4E[land].cut](p) < BRIDGE_ABUT);

/** Les rails d'une ligne, sur le sol `ground` : par pas, le ballast, deux rails, une traverse ; rien sous un pont. */
function railLine(b: FacetBuilder, line: readonly Vec2[], ground: (x: number, z: number) => number): void {
  const R = RAILS_LOOK_4E;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const n = Math.max(1, Math.ceil(len / R.sleeper));
    const yaw = Math.atan2(c.x - a.x, c.z - a.z);
    for (let k = 0; k < n; k++) {
      const d = (len * (k + 0.5)) / n;
      const p = { x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len };
      if (railCut(p)) continue;
      const y = standingHeight(ground(p.x, p.z)) + R.lift;
      const piece = len / n + 0.02;
      b.box({ x: p.x, y: y - 0.25, z: p.z, yaw }, [R.ballast * 2, 0.25 + R.ballastTop, piece], COLORS_4E.ballast);
      b.box({ x: p.x, y: y + R.ballastTop, z: p.z, yaw }, [R.sleeperLength, 0.08, 0.32], COLORS_4E.woodShade, COLORS_4E.wood);
      for (const side of [-1, 1]) {
        const o = (side * R.gauge) / 2;
        b.box({ x: p.x + Math.cos(yaw) * o, y: y + R.ballastTop + 0.08, z: p.z - Math.sin(yaw) * o, yaw }, [R.rail, R.rail, piece], COLORS_4E.rustShade, COLORS_4E.rust);
      }
    }
  }
}

/** Un bloc d'arrêt au bout d'une voie (`end`, la voie venant de `from`) : le butoir de l'Étalon, un heurtoir de la Jonction. */
function stopBlock(b: FacetBuilder, from: Vec2, end: Vec2, ground: (x: number, z: number) => number, big: boolean): void {
  const yaw = Math.atan2(end.x - from.x, end.z - from.z);
  const y = standingHeight(ground(end.x, end.z)) + RAILS_LOOK_4E.lift + RAILS_LOOK_4E.ballastTop;
  const w = big ? 1.6 : 1.2;
  const h = big ? 1.1 : 0.75;
  b.box({ x: end.x, y, z: end.z, yaw }, [w, h, 0.7], COLORS_4E.woodShade, COLORS_4E.wood);
  b.box({ x: end.x, y: y + h * 0.55, z: end.z, yaw }, [w + 0.06, 0.16, 0.76], COLORS_4E.copper);
}

/** Les rails du 4e : la ligne, son embranchement, ses deux voies de service, le butoir et les heurtoirs. */
function railFacets4e(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  railLine(b, RAILS_4E.line, ground);
  railLine(b, RAILS_4E.branch, ground);
  const line = RAILS_4E.line;
  stopBlock(b, line[line.length - 2], line[line.length - 1], ground, true);
  for (const siding of RAILS_4E.sidings) {
    railLine(b, siding, ground);
    stopBlock(b, siding[0], siding[siding.length - 1], ground, false);
  }
  return b.build();
}

/**
 * La rigole de la Forge (références : couverte devant la Forge) : un canal de pierre grise, couvert de dalles sur toute
 * sa longueur, vide ; seule sa prise, au bord de la cuvette, reste ouverte (un creux gris, sans lave : la restauration
 * l'allumera). Posée sur le sol, un rien au-dessus.
 */
const RIGOLE_LOOK_4E = { width: 1.5, height: 0.35, slab: 1.3, gap: 0.12 } as const;

function rigoleFacets(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  const W = RIGOLE_LOOK_4E;
  const line = RIGOLE_4E;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const yaw = Math.atan2(c.x - a.x, c.z - a.z);
    const n = Math.max(1, Math.round(len / W.slab));
    for (let k = 0; k < n; k++) {
      const d = (len * (k + 0.5)) / n;
      const p = { x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len };
      const y = standingHeight(ground(p.x, p.z)) - 0.15;
      const open = i === 1 && k === 0;
      // Les deux murets, puis la dalle qui couvre (sauf à la prise, ouverte sur son fond gris).
      for (const side of [-1, 1]) {
        const o = side * (W.width / 2 - 0.15);
        b.box({ x: p.x + Math.cos(yaw) * o, y, z: p.z - Math.sin(yaw) * o, yaw }, [0.3, W.height, len / n], COLORS_4E.stoneShade, COLORS_4E.stone);
      }
      if (open) b.box({ x: p.x, y, z: p.z, yaw }, [W.width - 0.3, 0.12, len / n], COLORS_4E.stoneShade);
      else b.box({ x: p.x, y: y + W.height, z: p.z, yaw }, [W.width + 0.1, 0.14, len / n - W.gap], COLORS_4E.stoneShade, COLORS_4E.stoneSun);
    }
  }
  return b.build();
}

/** Le pas des pieux de la jetée, et leur pied sous l'eau. */
const JETTY_PILES = { step: 3, foot: -2.4 } as const;

/**
 * La jetée de la Crique et l'aire de la Nef (fiche, § 5) : du bout du quai, une jetée de planches sur pieux, puis l'aire
 * ronde de bois cerclée de fer, sur l'eau de la baie. Un décor : on n'y marche pas au lot 1.
 */
function criqueJettyFacets(): Facets {
  const b = new FacetBuilder();
  const { z0, z1, width, pad, radius, deck } = CRIQUE_PAD;
  const len = z1 - z0;
  b.box({ x: 0, y: deck - 0.25, z: (z0 + z1) / 2 }, [width, 0.25, len], COLORS_4E.woodShade, COLORS_4E.wood);
  for (let z = z0 + 0.6; z < z1; z += JETTY_PILES.step)
    for (const side of [-1, 1]) b.prism({ x: side * (width / 2 - 0.2), y: JETTY_PILES.foot, z }, 0.24, 0.22, deck - JETTY_PILES.foot - 0.2, 5, COLORS_4E.woodShade);
  // L'aire : un disque de planches, son cerclage de fer, ses pieux tout autour.
  b.prism({ x: pad.x, y: deck - 0.3, z: pad.z }, radius, radius, 0.3, 16, COLORS_4E.woodShade, COLORS_4E.wood);
  b.band({ x: pad.x, y: deck - 0.32, z: pad.z }, radius + 0.06, 0.36, 16, COLORS_4E.rust);
  for (let k = 0; k < 6; k++) {
    const a = (2 * Math.PI * k) / 6 + 0.26;
    b.prism({ x: pad.x + Math.cos(a) * (radius - 0.5), y: JETTY_PILES.foot, z: pad.z + Math.sin(a) * (radius - 0.5) }, 0.26, 0.24, deck - JETTY_PILES.foot - 0.3, 5, COLORS_4E.woodShade);
  }
  return placeFacets(b.build(), { x: CRIQUE.origin.x, y: 0, z: CRIQUE.origin.z, yaw: CRIQUE.yaw });
}

/** Les chemins du 4e : un ruban par liaison, un octogone par nœud ; les rails, la rigole couverte, la jetée de la Crique. */
export const pathRibbons4e = (ground: (x: number, z: number) => number): Facets =>
  mergeFacets([networkRibbons(RIBBONS_4E, ground), railFacets4e(ground), rigoleFacets(ground), criqueJettyFacets()]);
