// Aménager sa région (GD-9, L5, le cœur sans l'écran) : les actions pures qui déplacent et tournent les lieux (chacun
// emporte son Gardien, qui se tient sur son île depuis GD-11), déplacent les bornes dans la bande de devant et les arrivées des
// liaisons, reposent une liaison à reposer, et reviennent à la carte de départ. Chacune lit le monde d'une partie
// (`World` : ses liaisons posées et sa disposition, `world.layout`) et en rend un autre, sans rien toucher d'autre :
// ni la disposition appliquée au monde (./appliedLayout.ts), ni les caches. Après chaque action, une liaison posée qui
// ne se trace plus devient une liaison à reposer (`relink`) ; rien ne se perd : elle reste construite, ses lieux restent
// ouverts, et on la repose gratuitement entre deux voisins au choix (`relinkBetween`). Deux lieux ouverts au plus près
// se réunissent (`joinIslands`, GD-9, point 10) : la paire entre dans la disposition (`joined`), bouge et tourne d'un
// bloc autour du premier, ne se sépare plus ; la forme de leur construction est dans ./join.ts. Code pur, sans Three.js.
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { BRIDGES, type BridgeDef, getBridge, isBiomeUnlocked, reachableIslands } from './archipelago';
import { ARCHIPELAGO_IDS, type ArchipelagoId, archipelagoOfIsland, bornesDuCoeur, CORE, type IslandDef, startingIsland } from './map';
import { SIDE_OF, LAYOUT_SIDE_OF } from './appliedLayout';
import { fittingPlaces, type FootprintPart, footprintOf, frameOf, GAP_BETWEEN_PLACES, gapBetween, placedIsland, poseOfSpot, spotInSteps, tooSmallGaps } from './footprint';
import { STEP, type Rectangle, wrapQuarts } from './placement';
import { LONG_LENGTH, possibleLandings, RegionRouter, type LinkLandings, type LinkRoute, startingPlaces, placesOf } from './routing';
import { LAYOUT_LAST_SPOT, type LayoutLanding, type LayoutSpot, type LayoutTurn, type RegionLayout } from './savedLayout';
import { reefsOutside } from './terrain/sea';
import { zoneDesPlans } from './plans';
import { AVATAR_HOME } from './terrain/base';
import { portesDesLieux } from './terrain/village';
import { creatureDuMonde, creatureSpot } from './terrain/creatures';
import { joinShape, type JoinShape } from './join';
import { QUEST_ROW, startingStations } from './terrain/markers';

// ---------- Les mots communs ----------

/**
 * Une direction des flèches du mode « Aménager », en mots, telle que l'élève la voit sur la Carte : le nord en haut de
 * l'écran (y du monde qui monte), l'est à droite. La caméra de la Carte regarde depuis le côté des y bas : les x du monde
 * qui montent vont vers la GAUCHE de l'écran ; l'est est donc du côté des x qui descendent (three/arrangeDirections.test.ts
 * le vérifie sur la projection de la caméra).
 */
export type Direction = 'nord' | 'sud' | 'est' | 'ouest';

export const DIRECTIONS: readonly Direction[] = ['nord', 'est', 'sud', 'ouest'];

/** Le pas d'une direction dans le monde (l'est vers les x qui descendent, à droite de l'écran de la Carte). */
export const DIRECTION_STEP: Readonly<Record<Direction, { dx: number; dy: number }>> = {
  nord: { dx: 0, dy: 1 },
  est: { dx: -1, dy: 0 },
  sud: { dx: 0, dy: -1 },
  ouest: { dx: 1, dy: 0 },
};

/** Ce que dit le jeu quand une flèche ne trouve plus de place libre dans sa direction. */
export const NO_MORE_ROOM = 'Plus de place par là.';

/** Pourquoi une action ne se fait pas. */
type ArrangeRefusal =
  /** Le lieu de départ (en 6e, les deux lieux ouverts au départ) ne bouge pas. */
  | 'fixe'
  /** Ce n'est pas une place libre (hors du cadre, trop près d'un lieu, hors de la bande…). */
  | 'occupee'
  /** Un lieu, une borne, une liaison inconnus. */
  | 'inconnu'
  /** Ces deux lieux ne se réunissent pas (déjà réunis, pas voisins, pas ouverts). */
  | 'reunis'
  /** Pas une liaison à reposer, ou une liaison qui ne se poserait pas là. */
  | 'liaison';

/** Le résultat d'une action : le monde d'après, et les liaisons que l'action a rendues « à reposer ». */
export type ArrangeResult = { ok: true; world: World; relink: string[] } | { ok: false; reason: ArrangeRefusal };

// ---------- La disposition d'une région ----------

/** La disposition d'une région dans un monde (vide : la carte de départ). */
function regionOf(world: World, a: ArchipelagoId): RegionLayout {
  return world.layout?.[a] ?? {};
}

/** Le monde avec une autre disposition pour une région ; une région vide disparaît, une disposition vide aussi. */
function withRegion(world: World, a: ArchipelagoId, r: RegionLayout): World {
  const propre: RegionLayout = {};
  for (const [k, v] of Object.entries(r) as [keyof RegionLayout, unknown][]) {
    const vide = v === undefined || (Array.isArray(v) ? v.length === 0 : typeof v === 'object' && v !== null && Object.keys(v).length === 0);
    if (!vide) (propre as Record<string, unknown>)[k] = v;
  }
  const layout = { ...world.layout };
  if (Object.keys(propre).length) layout[a] = propre;
  else delete layout[a];
  const { layout: _avant, ...reste } = world;
  return Object.keys(layout).length ? { ...reste, layout } : reste;
}

/** Le lieu de départ d'une région (en 6e, les deux lieux ouverts au départ) : il ne bouge pas, c'est le repère. */
export function isFixedPlace(id: BiomeId): boolean {
  return startingPlaces(archipelagoOfIsland(id)).includes(id);
}

/** La place d'un lieu sur la carte de départ, en pas depuis le coin du cadre de sa région. */
export function startingSpot(id: BiomeId): LayoutSpot {
  const d = startingIsland(id);
  const s = spotInSteps(archipelagoOfIsland(id), d.core.x, d.core.y);
  // La carte de départ est calée sur le pas (GD-9, L2) : un test le tient.
  if (!s) throw new Error(`${id} n'est pas sur la grille de sa région.`);
  return { x: s.i, y: s.j, turn: 0 };
}

/** La place et l'orientation d'un lieu dans un monde. */
export function spotOf(world: World, id: BiomeId): LayoutSpot {
  return regionOf(world, archipelagoOfIsland(id)).islands?.[id] ?? startingSpot(id);
}

/** Le lieu dans un monde, à sa place (sans passer par la disposition appliquée). */
export function placeIn(world: World, id: BiomeId): IslandDef {
  const s = regionOf(world, archipelagoOfIsland(id)).islands?.[id];
  return s ? placedIsland(id, poseOfSpot(archipelagoOfIsland(id), s)) : startingIsland(id);
}

/** Le lieu avec lequel un lieu est réuni dans un monde, s'il l'est. */
export function joinedWith(world: World, id: BiomeId): BiomeId | null {
  const p = regionOf(world, archipelagoOfIsland(id)).joined?.find(([x, y]) => x === id || y === id);
  return p ? (p[0] === id ? p[1] : p[0]) : null;
}

/** Les lieux réunis d'une région dans un monde, et la forme de la construction qui les réunit (là où ils sont). */
export function joinsIn(world: World, a: ArchipelagoId): { pair: [BiomeId, BiomeId]; shape: JoinShape }[] {
  const out: { pair: [BiomeId, BiomeId]; shape: JoinShape }[] = [];
  for (const pair of regionOf(world, a).joined ?? []) {
    const shape = joinShape(placeIn(world, pair[0]), placeIn(world, pair[1]));
    if (shape) out.push({ pair, shape });
  }
  return out;
}

/** Les rectangles de l'emprise d'un lieu dans un monde. */
function footprintIn(world: World, id: BiomeId, def: IslandDef = placeIn(world, id)): FootprintPart[] {
  return footprintOf(id, def);
}

/** Des rectangles tiennent-ils dans le cadre de la région ? */
function inFrame(a: ArchipelagoId, rs: readonly Rectangle[]): boolean {
  const c = frameOf(a);
  return rs.every((r) => r.x0 >= c.x0 && r.y0 >= c.y0 && r.x1 <= c.x1 && r.y1 <= c.y1);
}

/**
 * Les emprises des autres lieux d'une région, dans un monde, et les constructions qui réunissent deux autres lieux
 * (`sauf` : un lieu, ou les deux lieux réunis qui bougent ensemble).
 */
function othersFootprints(world: World, a: ArchipelagoId, sauf: BiomeId | readonly BiomeId[]): Rectangle[] {
  const hors = typeof sauf === 'string' ? [sauf] : sauf;
  return [
    ...placesOf(a)
      .filter((id) => !hors.includes(id))
      .flatMap((id) => footprintIn(world, id)),
    ...joinsIn(world, a)
      .filter((j) => !j.pair.some((id) => hors.includes(id)))
      .map((j) => j.shape.zone),
  ];
}

/** Les emprises des autres lieux d'une région, et leurs réunions (`othersFootprints`), pour le dessin du glissé. */
export function othersFootprintsOf(world: World, a: ArchipelagoId, sauf: readonly BiomeId[]): Rectangle[] {
  return othersFootprints(world, a, sauf);
}

/** Les emprises des autres lieux d'une région que `sauf` (et des réunions sans lui), chacune avec ses lieux. */
function othersFootprintsByPlace(world: World, a: ArchipelagoId, sauf: BiomeId): { lieux: readonly BiomeId[]; r: Rectangle }[] {
  return [
    ...placesOf(a)
      .filter((id) => id !== sauf)
      .flatMap((id) => footprintIn(world, id).map((r) => ({ lieux: [id], r }))),
    ...joinsIn(world, a)
      .filter((j) => !j.pair.includes(sauf))
      .map((j) => ({ lieux: j.pair, r: j.shape.zone })),
  ];
}

/** Des rectangles laissent-ils au moins `GAP_BETWEEN_PLACES` cases d'eau à ceux des autres ? */
function farEnough(rs: readonly Rectangle[], autres: readonly Rectangle[]): boolean {
  return rs.every((r) => autres.every((o) => gapBetween(r, o) >= GAP_BETWEEN_PLACES));
}

// ---------- Les liaisons ----------

/** Les arrivées choisies des liaisons d'une région, au format du traceur. */
function landingsOf(r: RegionLayout): (id: string) => LinkLandings | undefined {
  return (id) => {
    const l = r.landings?.[id];
    return l && { from: { cote: SIDE_OF[l.from.side], pas: l.from.step }, to: { cote: SIDE_OF[l.to.side], pas: l.to.step } };
  };
}

/** Les liaisons posées d'une région dans un monde, dans leur ordre (le pont du départ, puis la sauvegarde), sans celles à reposer. */
function placedLinks(world: World, a: ArchipelagoId): BridgeDef[] {
  const relink = new Set(regionOf(world, a).relink ?? []);
  const out = BRIDGES.filter((b) => b.cost === 0 && archipelagoOfIsland(b.from) === a && !relink.has(b.id));
  for (const id of world.links) {
    const b = getBridge(id);
    if (b && b.cost !== 0 && archipelagoOfIsland(b.from) === a && !relink.has(b.id) && !out.includes(b)) out.push(b);
  }
  return out;
}

/** Le traceur d'une région dans un monde, sans liaison posée. */
function routerOf(world: World, a: ArchipelagoId): RegionRouter {
  const r = regionOf(world, a);
  const lieux = placesOf(a).map((id) => placeIn(world, id));
  // Les écueils qu'un lieu posé dessus cache ne barrent rien (GD-9, « Cacher »).
  const ecueils = reefsOutside(a, placesOf(a).flatMap((id) => footprintIn(world, id)));
  const reunions = joinsIn(world, a).map((j) => ({ pair: j.pair, zone: j.shape.zone }));
  return new RegionRouter(a, { lieux, ecueils, arriveesDeLaLiaison: landingsOf(r), reunions });
}

/** Les tracés des liaisons posées d'une région dans un monde, dans leur ordre (`null` : elle ne se trace pas). */
export function routesIn(world: World, a: ArchipelagoId): Map<string, LinkRoute | null> {
  const t = routerOf(world, a);
  const out = new Map<string, LinkRoute | null>();
  for (const b of placedLinks(world, a)) out.set(b.id, t.poser(b, LONG_LENGTH));
  return out;
}

/**
 * Le monde d'après une action dans la région `a` : les liaisons posées qui se traçaient avant et ne se tracent plus
 * deviennent des liaisons à reposer (une liaison qui ne se traçait déjà pas, d'une sauvegarde d'avant, reste comme
 * elle est : son tracé de repli).
 */
function settle(avant: World, apres: World, a: ArchipelagoId): ArrangeResult {
  const traces = routesIn(avant, a);
  const nouvelles = routesIn(apres, a);
  const cassees = [...nouvelles].filter(([id, t]) => t === null && traces.get(id)).map(([id]) => id);
  if (!cassees.length) return { ok: true, world: apres, relink: [] };
  const r = regionOf(apres, a);
  return { ok: true, world: withRegion(apres, a, { ...r, relink: [...(r.relink ?? []), ...cassees] }), relink: cassees };
}

/** Les liaisons que ferait passer « à reposer » le lieu `id` posé à `spot` (le fantôme les montre barrées). */
export function linksBrokenBy(world: World, id: BiomeId, spot: LayoutSpot): string[] {
  const r = moveIsland(world, id, spot);
  return r.ok ? r.relink : [];
}

/** Les liaisons à reposer d'une région (la pastille du bouton « Aménager » en dit le nombre). */
export function linksToRelink(world: World, a: ArchipelagoId): string[] {
  return regionOf(world, a).relink ?? [];
}

/**
 * Repose une liaison à reposer, gratuitement, entre deux lieux voisins au choix (`to` : l'identifiant de la liaison
 * entre eux ; la même, si elle tient de nouveau). La liaison posée doit se tracer dans la disposition, sans défaire
 * les autres, et garder ouverts tous les lieux ouverts : rien ne se perd.
 */
export function relinkBetween(world: World, from: string, to: string): ArrangeResult {
  const ancienne = getBridge(from);
  const nouvelle = getBridge(to);
  if (!ancienne || !nouvelle) return { ok: false, reason: 'inconnu' };
  const a = archipelagoOfIsland(ancienne.from);
  const r = regionOf(world, a);
  if (!(r.relink ?? []).includes(from) || archipelagoOfIsland(nouvelle.from) !== a) return { ok: false, reason: 'liaison' };
  if (to !== from && (world.links.includes(to) || nouvelle.cost === 0)) return { ok: false, reason: 'liaison' };
  const links = world.links.map((id) => (id === from ? to : id));
  const apres = withRegion({ ...world, links }, a, { ...r, relink: (r.relink ?? []).filter((id) => id !== from) });
  // Tous les lieux ouverts le restent.
  const ouverts = reachableIslands(world.links);
  const encore = reachableIslands(links);
  if ([...ouverts].some((id) => !encore.has(id))) return { ok: false, reason: 'liaison' };
  // Elle se trace, après les autres, et ne défait aucune d'elles.
  const traces = routesIn(apres, a);
  if (!traces.get(to)) return { ok: false, reason: 'liaison' };
  const avant = routesIn(world, a);
  if ([...avant].some(([id, t]) => t && !traces.get(id))) return { ok: false, reason: 'liaison' };
  return { ok: true, world: apres, relink: [] };
}

/**
 * Les liaisons entre lesquelles reposer une liaison à reposer : celles qui se poseraient (voir `relinkBetween`), de
 * la plus courte à la plus longue.
 */
export function relinkChoices(world: World, from: string): string[] {
  const ancienne = getBridge(from);
  if (!ancienne) return [];
  const a = archipelagoOfIsland(ancienne.from);
  const out: { id: string; n: number }[] = [];
  for (const b of BRIDGES) {
    if (archipelagoOfIsland(b.from) !== a) continue;
    const r = relinkBetween(world, from, b.id);
    if (!r.ok) continue;
    out.push({ id: b.id, n: routesIn(r.world, a).get(b.id)?.cases.length ?? 0 });
  }
  return out.sort((p, q) => p.n - q.n).map((x) => x.id);
}

// ---------- Les lieux ----------

/**
 * Un lieu posé à une place, et le lieu avec lequel il est réuni, s'il l'est : la paire bouge d'un bloc. Le second suit
 * le premier du même pas ; tourné, il tourne autour du milieu du premier, du même nombre de quarts de tour.
 */
function companions(world: World, id: BiomeId, spot: LayoutSpot): { id: BiomeId; spot: LayoutSpot }[] {
  const p = joinedWith(world, id);
  if (!p) return [{ id, spot }];
  const s0 = spotOf(world, id);
  const q0 = spotOf(world, p);
  const q = wrapQuarts(spot.turn - s0.turn);
  let dx = q0.x - s0.x;
  let dy = q0.y - s0.y;
  // Un quart de tour (le sens de `turnPoint`, ./placement.ts) : (dx, dy) devient (dy, −dx).
  for (let i = 0; i < q; i++) [dx, dy] = [dy, -dx];
  return [
    { id, spot },
    { id: p, spot: { x: spot.x + dx, y: spot.y + dy, turn: ((q0.turn + q) % 4) as LayoutTurn } },
  ];
}

/** Un lieu (et celui avec lequel il est réuni) tiennent-ils à une place, loin des emprises `autres` ? */
function fitsAt(world: World, id: BiomeId, spot: LayoutSpot, autres: readonly Rectangle[]): boolean {
  const a = archipelagoOfIsland(id);
  const max = LAYOUT_LAST_SPOT[a];
  const groupe = companions(world, id, spot);
  const defs: IslandDef[] = [];
  for (const g of groupe) {
    if (g.spot.x < 0 || g.spot.y < 0 || g.spot.x > max.x || g.spot.y > max.y) return false;
    const def = placedIsland(g.id, poseOfSpot(a, g.spot));
    const rs = footprintOf(g.id, def);
    if (!inFrame(a, rs) || !farEnough(rs, autres)) return false;
    defs.push(def);
  }
  if (defs.length < 2) return true;
  // La construction qui les réunit suit la paire : dans le cadre, loin des autres.
  const forme = joinShape(defs[0], defs[1]);
  return forme !== null && inFrame(a, [forme.zone]) && farEnough([forme.zone], autres);
}

/** Les lieux qui bougent avec un lieu : lui, et celui avec lequel il est réuni. */
function groupOf(world: World, id: BiomeId): BiomeId[] {
  const p = joinedWith(world, id);
  return p ? [id, p] : [id];
}

/** Les places libres d’un lieu dans un monde (à son orientation `turn`, la sienne par défaut), dans l’ordre de la grille ; `autour` : à quelques crans d’une place seulement. */
export function freeSpots(world: World, id: BiomeId, turn: LayoutTurn = spotOf(world, id).turn, autour?: { x: number; y: number; pas: number }): LayoutSpot[] {
  return [...spotsThatFit(world, id, turn, autour)];
}

/** Le lieu a-t-il au moins une place libre dans son archipel, à cette orientation ? (S'arrête à la première.) */
export function hasFreeSpot(world: World, id: BiomeId, turn: LayoutTurn): boolean {
  return !spotsThatFit(world, id, turn).next().done;
}

/** Les places libres d'un lieu, une à une (voir `freeSpots`). */
function* spotsThatFit(world: World, id: BiomeId, turn: LayoutTurn, autour?: { x: number; y: number; pas: number }): Generator<LayoutSpot> {
  const a = archipelagoOfIsland(id);
  const autres = othersFootprints(world, a, groupOf(world, id));
  const max = LAYOUT_LAST_SPOT[a];
  // `autour` : seulement les places à `pas` crans au plus d'une place (le dessin d'un choix n'en montre pas d'autres).
  const [x0, x1] = autour ? [Math.max(0, autour.x - autour.pas), Math.min(max.x, autour.x + autour.pas)] : [0, max.x];
  const [y0, y1] = autour ? [Math.max(0, autour.y - autour.pas), Math.min(max.y, autour.y + autour.pas)] : [0, max.y];
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const spot: LayoutSpot = { x, y, turn };
      if (fitsAt(world, id, spot, autres)) yield spot;
    }
}

/** Une place est-elle libre pour un lieu (et celui avec lequel il est réuni) ? */
export function isFreeSpot(world: World, id: BiomeId, spot: LayoutSpot): boolean {
  return fitsAt(world, id, spot, othersFootprints(world, archipelagoOfIsland(id), groupOf(world, id)));
}

/** Le milieu du cœur d'un lieu posé à une place, en cases du monde. */
function middleOf(a: ArchipelagoId, spot: LayoutSpot): { x: number; y: number } {
  const p = poseOfSpot(a, spot);
  return { x: p.x + 8, y: p.y + 8 };
}

/**
 * La place libre la plus proche d'un point touché sur la mer (en cases du monde), pour un lieu à son orientation : le
 * fantôme s'y cale. `null` s'il n'y en a aucune.
 */
export function nearestFreeSpot(world: World, id: BiomeId, point: { x: number; y: number }, turn?: LayoutTurn): LayoutSpot | null {
  const a = archipelagoOfIsland(id);
  return closest(freeSpots(world, id, turn), (s) => middleOf(a, s), point);
}

/** L'élément de `items` dont la place est la plus proche d'un point (le premier à égalité). */
export function closest<T>(items: readonly T[], at: (t: T) => { x: number; y: number }, point: { x: number; y: number }): T | null {
  let best: T | null = null;
  let d = Infinity;
  for (const t of items) {
    const p = at(t);
    const e = Math.hypot(p.x - point.x, p.y - point.y);
    if (e < d) {
      d = e;
      best = t;
    }
  }
  return best;
}

/**
 * Le suivant d'une place dans une direction parmi des places possibles : la plus proche plus loin dans cette direction,
 * dans le quart de plan qu'elle regarde (pas plus de côté que d'avance), la moins de côté à avance égale ; `null` : plus
 * de place par là (`NO_MORE_ROOM`).
 */
export function nextIn<T>(items: readonly T[], at: (t: T) => { x: number; y: number }, from: { x: number; y: number }, dir: Direction): T | null {
  const { dx, dy } = DIRECTION_STEP[dir];
  let best: T | null = null;
  let score: [number, number] = [Infinity, Infinity];
  for (const t of items) {
    const p = at(t);
    const avance = (p.x - from.x) * dx + (p.y - from.y) * dy;
    const cote = Math.abs((p.x - from.x) * dy - (p.y - from.y) * dx);
    if (avance <= 0 || cote > avance) continue;
    if (avance < score[0] || (avance === score[0] && cote < score[1])) {
      best = t;
      score = [avance, cote];
    }
  }
  return best;
}

/**
 * La place de la grille d'un lieu (à l'orientation `turn`) dont le milieu est le plus près d'un point, libre ou prise (le
 * doigt qui glisse le lieu, 7 octobre 2026, choix 1b du mainteneur) ; `null` si, là, lui ou le lieu qui lui est réuni
 * sortirait de la grille.
 */
export function spotNear(world: World, id: BiomeId, point: { x: number; y: number }, turn: LayoutTurn): LayoutSpot | null {
  const a = archipelagoOfIsland(id);
  const c = frameOf(a);
  const max = LAYOUT_LAST_SPOT[a];
  const borne = (v: number, m: number) => Math.min(m, Math.max(0, v));
  const spot: LayoutSpot = { x: borne(Math.round((point.x - 8 - c.x0) / STEP), max.x), y: borne(Math.round((point.y - 8 - c.y0) / STEP), max.y), turn };
  for (const g of companions(world, id, spot)) if (g.spot.x < 0 || g.spot.y < 0 || g.spot.x > max.x || g.spot.y > max.y) return null;
  return spot;
}

/**
 * Le cran suivant d'un lieu dans une direction (les flèches ; 6 octobre 2026, choix 3 du mainteneur) : une place de la
 * grille plus loin, libre ou prise (le fantôme y montre alors une croix grise, et « Poser » s'éteint), jamais la place
 * libre suivante plus loin sur la carte ; `null` seulement au bord de la carte : « Plus de place par là ». Deux lieux
 * réunis restent tous deux sur la grille.
 */
export function stepSpot(world: World, id: BiomeId, from: LayoutSpot, dir: Direction): LayoutSpot | null {
  const max = LAYOUT_LAST_SPOT[archipelagoOfIsland(id)];
  const { dx, dy } = DIRECTION_STEP[dir];
  const spot: LayoutSpot = { x: from.x + dx, y: from.y + dy, turn: from.turn };
  for (const g of companions(world, id, spot)) if (g.spot.x < 0 || g.spot.y < 0 || g.spot.x > max.x || g.spot.y > max.y) return null;
  return spot;
}

/**
 * Déplace (et oriente) un lieu à une place libre ; deux lieux réunis bougent ensemble (le second suit le premier).
 * Le lieu de départ ne bouge pas, ni le lieu qui lui est réuni.
 */
export function moveIsland(world: World, id: BiomeId, spot: LayoutSpot): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  if (groupOf(world, id).some(isFixedPlace)) return { ok: false, reason: 'fixe' };
  if (!isFreeSpot(world, id, spot)) return { ok: false, reason: 'occupee' };
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const islands = { ...r.islands };
  for (const g of companions(world, id, spot)) {
    const depart = startingSpot(g.id);
    // À sa place de départ, sans rotation : le lieu n'est plus dans la disposition.
    if (g.spot.x === depart.x && g.spot.y === depart.y && g.spot.turn === 0) delete islands[g.id];
    else islands[g.id] = { x: g.spot.x, y: g.spot.y, turn: g.spot.turn };
  }
  return settle(world, withRegion(world, a, { ...r, islands }), a);
}

/**
 * Une disposition sauvegardée qui ne tient plus sur la grille de sa région (`fittingPlaces`) : un lieu entré au jeu
 * après l'aménagement de la région (HG-2, HG-3, SC-3), à sa place de la carte de départ, chevauche un lieu que l'élève a
 * déplacé ; ou les îles ont grandi (GD-11, 8 octobre 2026) et deux lieux ne laissent plus assez d'eau entre eux, ou un
 * lieu déplacé sort du cadre. Plutôt que de ramener toute la région à la carte de départ, une paire réunie trop
 * rapprochée s'écarte d'abord d'un pas, toujours réunie (`separateJoinedPairs`) ; puis les lieux qui ne tiennent plus
 * se décalent, un à un, chacun à la place libre la plus proche de la sienne, à son orientation (de face s'il n'y en a
 * pas) ; jamais le lieu de départ ni ce qui lui est réuni, et chacun une fois au plus. Des deux ordres essayés
 * (`shiftUntilFitting`), on garde celui qui respecte le mieux les choix de l'élève (`shiftCost`). Rien d'autre ne
 * bouge, et aucune progression ne se perd : les liaisons, les réunions, les bornes et les chantiers ne sont pas dans
 * les places. Rend le même monde quand chaque région tient déjà, ou quand aucun décalage ne la fait tenir (la région
 * revient alors à la carte de départ, comme avant). Appelée à la lecture de la partie (`BloclandContext`), elle ne
 * change aucun format (pas de migration) : la disposition décalée s'enregistre avec la partie suivante.
 */
export function settleNewPlaces(world: World): World {
  let w = world;
  for (const a of ARCHIPELAGO_IDS) {
    const avant = regionOf(w, a).islands;
    if (!avant || fittingPlaces(a, avant)) continue;
    // Une paire réunie que l'agrandissement a trop rapprochée s'écarte d'abord d'un pas, réunie ; puis, comme les
    // autres lieux, elle se décale d'un bloc.
    const ecarte = separateJoinedPairs(w, a);
    // Deux ordres possibles (`shiftUntilFitting`) : celui qui garde le mieux les choix de l'élève (`shiftCost`) ; le
    // premier à égalité.
    const essais = [shiftUntilFitting(ecarte, a, true), shiftUntilFitting(ecarte, a, false)].filter((x): x is World => x !== null);
    const cout = (x: World) => shiftCost(w, x, a);
    const mieux = essais.reduce<World | null>((m, x) => (m === null || cout(x) < cout(m) ? x : m), null);
    if (mieux) w = mieux;
  }
  return w;
}

/**
 * Les paires réunies d'une région que les îles agrandies (GD-11) ont trop rapprochées l'une de l'autre (moins de
 * `GAP_BETWEEN_PLACES` cases d'eau entre leurs terres : chacune a pris deux cases de terre par côté, un pas en tout) :
 * l'un des deux lieux, jamais un lieu de départ, s'écarte d'un pas de l'autre, en x ou en y, là où leur construction
 * se pose encore (`joinShape`). La paire reste réunie, et sa construction aussi. Une paire qui ne s'écarte pas reste
 * telle quelle : la région ne tient pas et revient à la carte de départ, sans rien perdre (`settleNewPlaces`).
 */
function separateJoinedPairs(world: World, a: ArchipelagoId): World {
  let w = world;
  const tropPres = (d: IslandDef, e: IslandDef) => tooSmallGaps(a, [d, e]).some((g) => g.other !== null);
  const max = LAYOUT_LAST_SPOT[a];
  for (const [p, q] of regionOf(w, a).joined ?? []) {
    if (!tropPres(placeIn(w, p), placeIn(w, q))) continue;
    const ecart = [q, p]
      .filter((id) => !isFixedPlace(id))
      .flatMap((id) => {
        const autre = id === p ? q : p;
        const [s, t] = [spotOf(w, id), spotOf(w, autre)];
        return [
          { x: s.x + Math.sign(s.x - t.x), y: s.y },
          { x: s.x, y: s.y + Math.sign(s.y - t.y) },
        ]
          .filter((c) => (c.x !== s.x || c.y !== s.y) && c.x >= 0 && c.y >= 0 && c.x <= max.x && c.y <= max.y)
          .map((c) => ({ id, spot: { ...c, turn: s.turn } }));
      })
      .find(({ id, spot }) => {
        const d = placedIsland(id, poseOfSpot(a, spot));
        const [dp, dq] = id === p ? [d, placeIn(w, q)] : [placeIn(w, p), d];
        return !tropPres(dp, dq) && joinShape(dp, dq) !== null;
      });
    if (!ecart) continue;
    const r = regionOf(w, a);
    const islands = { ...r.islands };
    const depart = startingSpot(ecart.id);
    if (ecart.spot.x === depart.x && ecart.spot.y === depart.y && ecart.spot.turn === 0) delete islands[ecart.id];
    else islands[ecart.id] = ecart.spot;
    w = withRegion(w, a, { ...r, islands });
  }
  return w;
}

/**
 * Ce que coûte un décalage : d'abord les pas des lieux que l'élève avait déplacés (on garde ses choix autant que
 * possible), puis le nombre de lieux décalés, puis la somme de leurs pas.
 */
function shiftCost(avant: World, apres: World, a: ArchipelagoId): number {
  const choisis = regionOf(avant, a).islands ?? {};
  let cout = 0;
  for (const id of placesOf(a)) {
    const s = spotOf(avant, id);
    const t = spotOf(apres, id);
    if (s.x === t.x && s.y === t.y && s.turn === t.turn) continue;
    const pas = Math.abs(s.x - t.x) + Math.abs(s.y - t.y) + (s.turn === t.turn ? 0 : 1);
    cout += (choisis[id] ? pas * 1_000_000 : 0) + 1000 + pas;
  }
  return cout;
}

/**
 * Décale un à un les lieux d'une région qui ne tiennent plus (`settleNewPlaces`) jusqu'à ce qu'elle tienne ; `null` si
 * l'un d'eux ne trouve aucune place libre. Un lieu qui sort du cadre se décale le premier (lui seul le peut) ; puis,
 * selon `unmovedFirst`, un lieu resté à sa place de départ avant un lieu déplacé, ou l'inverse.
 */
function shiftUntilFitting(world: World, a: ArchipelagoId, unmovedFirst: boolean): World | null {
  let monde = world;
  const decales = new Set<BiomeId>();
  for (;;) {
    const ici = regionOf(monde, a);
    const poses = ici.islands ?? {};
    if (fittingPlaces(a, poses)) return monde;
    const bouge = (id: BiomeId) => poses[id] !== undefined;
    const courant = monde;
    const ecarts = tooSmallGaps(
      a,
      placesOf(a).map((id) => placeIn(courant, id)),
      bouge,
    );
    const horsCadre = placesOf(a).filter((id) => ecarts.some((e) => e.place === id && e.other === null));
    const enCause = placesOf(a).filter((id) => ecarts.some((e) => e.place === id || e.other === id));
    // Un lieu resté à sa place de départ qui chevauche un lieu déplacé y est entré après lui (HG-2, SC-3).
    const nouveaux = enCause.filter((id) => !bouge(id) && ecarts.some((e) => e.gap <= 0 && e.other !== null && ((e.place === id && bouge(e.other)) || (e.other === id && bouge(e.place)))));
    const restes = enCause.filter((id) => !bouge(id) && !nouveaux.includes(id));
    const ordre = unmovedFirst ? [...nouveaux, ...enCause.filter(bouge), ...restes] : [...enCause.filter(bouge), ...nouveaux, ...restes];
    const peutBouger = (id: BiomeId) => !groupOf(courant, id).some((g) => isFixedPlace(g) || decales.has(g));
    const id = [...horsCadre, ...ordre].find(peutBouger);
    if (!id) return null;
    for (const g of groupOf(courant, id)) decales.add(g);
    const depuis = poses[id];
    const depart = startingIsland(id).core;
    // On cherche autour du milieu de son cœur (d'origine), pas de son coin.
    const point = depuis ? middleOf(a, depuis) : { x: depart.x + CORE / 2, y: depart.y + CORE / 2 };
    const turn = depuis?.turn ?? 0;
    const libre = nearestFreeSpot(courant, id, point, turn) ?? (turn ? nearestFreeSpot(courant, id, point, 0) : null);
    if (!libre) return null;
    const islands = { ...poses };
    for (const g of companions(courant, id, libre)) {
      const s0 = startingSpot(g.id);
      // À sa place de départ, sans rotation : le lieu n'est plus dans la disposition.
      if (g.spot.x === s0.x && g.spot.y === s0.y && g.spot.turn === 0) delete islands[g.id];
      else islands[g.id] = { x: g.spot.x, y: g.spot.y, turn: g.spot.turn };
    }
    monde = withRegion(courant, a, { ...ici, islands });
  }
}

/** Les lieux d'une région où le lieu `id` est (avec celui avec lequel il est réuni) quand il est posé à `spot`. */
export function groupAt(world: World, id: BiomeId, spot: LayoutSpot): { id: BiomeId; def: IslandDef }[] {
  const a = archipelagoOfIsland(id);
  return companions(world, id, spot).map((g) => ({ id: g.id, def: placedIsland(g.id, poseOfSpot(a, g.spot)) }));
}

// ---------- Réunir deux lieux (GD-9, point 10) ----------

/**
 * Les lieux avec lesquels un lieu peut se réunir dans un monde : ouverts tous deux, aucun déjà réuni, voisins au plus
 * près de la grille sur un côté commun (`joinShape`), et la construction loin des autres lieux.
 */
export function joinCandidates(world: World, id: BiomeId): BiomeId[] {
  return joinableFrom(world, id, placeIn(world, id));
}

/**
 * Les lieux avec lesquels un lieu se réunirait s'il était posé à `spot` (6 octobre 2026, choix 2a du mainteneur : ces
 * places portent l'icône de « Réunir ») ; vide pour deux lieux déjà réunis.
 */
export function joinCandidatesAt(world: World, id: BiomeId, spot: LayoutSpot): BiomeId[] {
  return joinsAround(world, id)(spot).map((j) => j.id);
}

/**
 * Pour un lieu, de quoi dire, place par place, avec quels voisins il se réunirait s'il était posé là, et où irait leur
 * construction (`zone`, sur l'eau entre les deux terres) : l'icône de « Réunir » s'y pose (choix 2a du mainteneur). Ce
 * qui ne dépend pas de la place (les emprises des autres lieux, qui est ouvert) se calcule une fois : le dessin d'un
 * choix le demande pour chacune de ses places.
 */
export function joinsAround(world: World, id: BiomeId): (spot: LayoutSpot) => { id: BiomeId; zone: Rectangle }[] {
  const a = archipelagoOfIsland(id);
  if (!getBiome(id) || joinedWith(world, id) || !isBiomeUnlocked(id, world.links)) return () => [];
  const voisins = placesOf(a)
    .filter((b) => b !== id && !joinedWith(world, b) && isBiomeUnlocked(b, world.links))
    .map((b) => ({ id: b, def: placeIn(world, b) }));
  // Les emprises de tous les autres, chacune avec son lieu : celle du voisin essayé ne compte pas.
  const autres = othersFootprintsByPlace(world, a, id);
  return (spot) => {
    const def = placedIsland(id, poseOfSpot(a, spot));
    const out: { id: BiomeId; zone: Rectangle }[] = [];
    for (const v of voisins) {
      const forme = joinShape(def, v.def);
      if (forme && autres.every((o) => o.lieux.includes(v.id) || gapBetween(forme.zone, o.r) >= GAP_BETWEEN_PLACES)) out.push({ id: v.id, zone: forme.zone });
    }
    return out;
  };
}

/** Les voisins avec lesquels un lieu, posé comme `def`, se réunirait (les règles de `joinCandidates`). */
function joinableFrom(world: World, id: BiomeId, def: IslandDef): BiomeId[] {
  if (!getBiome(id) || joinedWith(world, id) || !isBiomeUnlocked(id, world.links)) return [];
  const a = archipelagoOfIsland(id);
  return placesOf(a).filter((b) => {
    if (b === id || joinedWith(world, b) || !isBiomeUnlocked(b, world.links)) return false;
    const forme = joinShape(def, placeIn(world, b));
    return forme !== null && farEnough([forme.zone], othersFootprints(world, a, [id, b]));
  });
}

/**
 * Réunit deux lieux : la paire entre dans la disposition (`joined`) et sa construction se pose ensuite élément par
 * élément, depuis le panneau du lieu. Leur liaison, et toute liaison qui passait là, deviennent des liaisons à reposer.
 */
export function joinIslands(world: World, id: BiomeId, other: BiomeId): ArrangeResult {
  if (!getBiome(id) || !getBiome(other)) return { ok: false, reason: 'inconnu' };
  if (!joinCandidates(world, id).includes(other)) return { ok: false, reason: 'reunis' };
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  return settle(world, withRegion(world, a, { ...r, joined: [...(r.joined ?? []), [id, other]] }), a);
}

/**
 * Tourne un lieu d'un quart de tour (le devant passe à gauche) : à sa place s'il y tient, sinon à la place libre la
 * plus proche ; `occupee` s'il n'en a aucune.
 */
export function turnIsland(world: World, id: BiomeId): ArrangeResult {
  const s = spotOf(world, id);
  const turn = ((s.turn + 1) % 4) as LayoutTurn;
  const ici = { ...s, turn };
  if (groupOf(world, id).some(isFixedPlace)) return { ok: false, reason: 'fixe' };
  if (isFreeSpot(world, id, ici)) return moveIsland(world, id, ici);
  const a = archipelagoOfIsland(id);
  const proche = nearestFreeSpot(world, id, middleOf(a, s), turn);
  return proche ? moveIsland(world, id, proche) : { ok: false, reason: 'occupee' };
}

// ---------- Les bornes ----------

/** La place d'une borne dans le repère de son lieu (clé « lieu:mission ») dans un monde, ou `null` si elle n'existe pas. */
export function stationOf(world: World, key: string): { x: number; y: number } | null {
  const [id, mission] = key.split(':') as [BiomeId, string];
  if (!getBiome(id)) return null;
  const moved = regionOf(world, archipelagoOfIsland(id)).stations?.[key];
  if (moved) return moved;
  const st = startingStations(id).find((s) => s.typeId === mission);
  return st ? { x: st.x, y: st.y } : null;
}

/**
 * Les places de la bande de devant d'un lieu (dans son repère) : sa rangée de bornes, au pas de 4, sur toute la largeur
 * du cœur (aux places des bornes des îles-écoles sur un cœur de 20).
 */
export function stationBand(id: BiomeId): { x: number; y: number }[] {
  const b = bornesDuCoeur(startingIsland(id));
  const out: { x: number; y: number }[] = [];
  for (let x = b.x0 + 2; x < b.x1; x += STEP) out.push({ x, y: QUEST_ROW });
  return out;
}

/** Une case du repère et ses huit voisines. */
function around(x: number, y: number): string[] {
  const out: string[] = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.push(`${x + dx},${y + dy}`);
  return out;
}

/**
 * Les places libres d'une borne : la bande de devant de son lieu, hors des chantiers, de l'habitant, du départ du
 * bonhomme, jamais devant la porte d'un bâtiment ni sur une case autour, ni à côté d'une autre borne ; et sa place de
 * départ, tant qu'aucune autre borne ne s'en est approchée.
 */
export function freeStationSpots(world: World, key: string): { x: number; y: number }[] {
  const [id] = key.split(':') as [BiomeId];
  if (!stationOf(world, key)) return [];
  const pris = new Set<string>();
  const z = zoneDesPlans(id);
  for (let x = z.x - 1; x <= z.x + z.w; x++) for (let y = z.y - 1; y <= z.y + z.h; y++) pris.add(`${x},${y}`);
  const c = creatureSpot(id);
  for (const m of creatureDuMonde(id)) for (const k of around(c.x + m.x, c.y + m.y)) pris.add(k);
  for (const k of around(AVATAR_HOME.x, AVATAR_HOME.y)) pris.add(k);
  for (const p of portesDesLieux(id)) {
    const [x, y] = p.split(',').map(Number);
    for (const k of around(x, y)) pris.add(k);
  }
  const autresPres = new Set<string>();
  for (const st of startingStations(id)) {
    const autre = `${id}:${st.typeId}`;
    if (autre === key) continue;
    const p = stationOf(world, autre)!;
    for (const k of around(p.x, p.y)) {
      pris.add(k);
      autresPres.add(k);
    }
  }
  // Sa place de départ lui reste toujours ouverte, si aucune autre borne ne s'en est approchée.
  const [, mission] = key.split(':');
  const depart = startingStations(id).find((st) => st.typeId === mission)!;
  const candidates = [...stationBand(id)];
  if (!candidates.some((p) => p.x === depart.x && p.y === depart.y)) candidates.push({ x: depart.x, y: depart.y });
  return candidates.filter((p) => !pris.has(`${p.x},${p.y}`) || (p.x === depart.x && p.y === depart.y && !autresPres.has(`${p.x},${p.y}`)));
}

/** Déplace une borne à une place libre de la bande de devant de son lieu (elle tourne avec lui). */
export function moveStation(world: World, key: string, to: { x: number; y: number }): ArrangeResult {
  if (!stationOf(world, key)) return { ok: false, reason: 'inconnu' };
  if (!freeStationSpots(world, key).some((p) => p.x === to.x && p.y === to.y)) return { ok: false, reason: 'occupee' };
  const [id, mission] = key.split(':') as [BiomeId, string];
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const stations = { ...r.stations };
  const depart = startingStations(id).find((s) => s.typeId === mission);
  if (depart && depart.x === to.x && depart.y === to.y) delete stations[key];
  else stations[key] = { x: to.x, y: to.y };
  return { ok: true, world: withRegion(world, a, { ...r, stations }), relink: [] };
}

/**
 * Toutes les places d'une borne, libres ou prises (choix 3 du mainteneur : une flèche avance d'un cran, même sur une
 * place prise) : la bande de devant de son lieu, et sa place de départ.
 */
export function stationSpots(world: World, key: string): { x: number; y: number }[] {
  const [id, mission] = key.split(':') as [BiomeId, string];
  if (!stationOf(world, key)) return [];
  const depart = startingStations(id).find((st) => st.typeId === mission)!;
  const out = [...stationBand(id)];
  if (!out.some((p) => p.x === depart.x && p.y === depart.y)) out.push({ x: depart.x, y: depart.y });
  return out;
}

// ---------- Les arrivées ----------

/** Un bout d'une liaison : celui de son lieu `from` ou celui de son lieu `to`. */
export type LinkEnd = 'from' | 'to';

/**
 * Les arrivées libres d'un bout d'une liaison posée : celles de la côte de son lieu (une par côté, au pas, hors de la
 * bande des bornes), sauf un côté déjà pris par l'arrivée choisie d'une autre liaison de ce lieu (au point de départ,
 * chaque arrivée une fois).
 */
export function freeLandings(world: World, linkId: string, end: LinkEnd): LayoutLanding[] {
  const b = getBridge(linkId);
  if (!b || !(b.cost === 0 || world.links.includes(linkId))) return [];
  const id = end === 'from' ? b.from : b.to;
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const depart = startingPlaces(a).includes(id);
  const prises = new Set<string>();
  for (const [autre, l] of Object.entries(r.landings ?? {})) {
    if (autre === linkId) continue;
    const ob = getBridge(autre);
    if (!ob) continue;
    for (const [bout, lieu] of [['from', ob.from], ['to', ob.to]] as const) if (lieu === id) prises.add(depart ? `${l[bout].side}|${l[bout].step}` : l[bout].side);
  }
  return possibleLandings(placeIn(world, id))
    .map((l) => ({ side: LAYOUT_SIDE_OF[l.cote], step: l.pas }))
    .filter((l) => !prises.has(depart ? `${l.side}|${l.step}` : l.side));
}

/** Toutes les arrivées d'un bout d'une liaison, libres ou prises : la côte de son lieu, une par côté, au pas. */
export function landingSpots(world: World, linkId: string, end: LinkEnd): LayoutLanding[] {
  const b = getBridge(linkId);
  if (!b) return [];
  return possibleLandings(placeIn(world, end === 'from' ? b.from : b.to)).map((l) => ({ side: LAYOUT_SIDE_OF[l.cote], step: l.pas }));
}

/**
 * Déplace une arrivée d'une liaison posée : la liaison repart de là (ses deux bouts sont alors gardés, l'autre là où
 * le traceur l'avait mise). Un tracé impossible fait d'elle une liaison à reposer.
 */
export function moveLanding(world: World, linkId: string, end: LinkEnd, to: LayoutLanding): ArrangeResult {
  const b = getBridge(linkId);
  if (!b) return { ok: false, reason: 'inconnu' };
  if (!freeLandings(world, linkId, end).some((l) => l.side === to.side && l.step === to.step)) return { ok: false, reason: 'occupee' };
  const a = archipelagoOfIsland(b.from);
  const r = regionOf(world, a);
  const actuelle = r.landings?.[linkId] ?? currentLandings(world, linkId);
  if (!actuelle) return { ok: false, reason: 'liaison' };
  const landings = { ...r.landings, [linkId]: { ...actuelle, [end]: to } };
  return settle(world, withRegion(world, a, { ...r, landings }), a);
}

/** Les arrivées d'une liaison posée telles que le traceur les a choisies, ou `null` si elle ne se trace pas. */
export function currentLandings(world: World, linkId: string): { from: LayoutLanding; to: LayoutLanding } | null {
  const b = getBridge(linkId);
  if (!b) return null;
  const t = routesIn(world, archipelagoOfIsland(b.from)).get(linkId);
  if (!t) return null;
  return { from: { side: LAYOUT_SIDE_OF[t.depuis.cote], step: t.depuis.pas }, to: { side: LAYOUT_SIDE_OF[t.vers.cote], step: t.vers.pas } };
}

// ---------- La carte de départ ----------

/**
 * Ce qui, dans la disposition d'une région, s'écarte vraiment de la carte de départ : un lieu ou une borne remis à sa place de départ n'y compte plus, ni une liste vide. Deux dispositions sont pareilles quand ceci l'est.
 */
function ecartsDeLaCarteDeDepart(world: World, a: ArchipelagoId): string {
  const r = regionOf(world, a);
  const islands = Object.entries(r.islands ?? {}).filter(([id, s]) => {
    const d = startingSpot(id as BiomeId);
    return s && (s.x !== d.x || s.y !== d.y || s.turn !== d.turn);
  });
  const stations = Object.entries(r.stations ?? {}).filter(([key, p]) => {
    const [id, mission] = key.split(':') as [BiomeId, string];
    const d = startingStations(id).find((st) => st.typeId === mission);
    return !d || d.x !== p.x || d.y !== p.y;
  });
  const listes = { landings: Object.entries(r.landings ?? {}), joined: r.joined ?? [], shortcuts: r.shortcuts ?? [], relink: r.relink ?? [] };
  return JSON.stringify({ islands: islands.sort(), stations: stations.sort(), ...listes });
}

/**
 * « Carte de départ », au menu : ce que donnerait le retour, avant de le proposer. `pareille` : rien ne changerait (la
 * région est déjà à sa carte de départ) ; `bloquee` : des lieux réunis empêchent le retour (rien ne changerait non
 * plus, et on le dit avant de demander) ; `possible` : le retour change la carte.
 */
export function startingMapState(world: World, a: ArchipelagoId): 'pareille' | 'bloquee' | 'possible' {
  const apres = backToStartingMap(world, a);
  if (!apres) return 'bloquee';
  return ecartsDeLaCarteDeDepart(apres, a) === ecartsDeLaCarteDeDepart(world, a) ? 'pareille' : 'possible';
}

/**
 * Revient à la carte de départ dans une région (le menu, « Carte de départ ») : sa disposition est vidée, et les
 * liaisons à reposer redeviennent des liaisons posées. Aucune n'est perdue : les liaisons de la partie ne changent pas. Deux lieux
 * réunis ne se séparent plus (GD-9, point 10) : ils restent où ils sont, et un lieu dont la place
 * de départ toucherait leur réunion reste aussi où il est ; `null` si la carte ainsi faite ne tient pas.
 */
export function backToStartingMap(world: World, a: ArchipelagoId): World | null {
  const r = regionOf(world, a);
  const joined = r.joined ?? [];
  if (!joined.length) return withRegion(world, a, {});
  const reunis = new Set<BiomeId>(joined.flat());
  const islands: NonNullable<RegionLayout['islands']> = {};
  for (const id of reunis) if (r.islands?.[id]) islands[id] = r.islands[id];
  const sansLesAutres = withRegion(world, a, { islands, joined });
  const occupe = othersFootprints(sansLesAutres, a, placesOf(a).filter((id) => !reunis.has(id)));
  // Un lieu dont la place de départ touche une réunion reste où il est.
  for (const id of placesOf(a)) {
    if (reunis.has(id) || !r.islands?.[id]) continue;
    if (!farEnough(footprintOf(id, startingIsland(id)), occupe)) islands[id] = r.islands[id];
  }
  const apres = withRegion(world, a, { islands, joined });
  const tenus = fittingPlaces(a, islands);
  const zones = joinsIn(apres, a);
  if (!tenus || zones.length !== joined.length) return null;
  for (const j of zones) if (!farEnough([j.shape.zone], othersFootprints(apres, a, j.pair))) return null;
  // Les liaisons qu'une réunion empêche restent à reposer ; les autres redeviennent posées.
  const traces = routesIn(apres, a);
  const relink = (r.relink ?? []).filter((id) => traces.get(id) === null);
  return relink.length ? withRegion(apres, a, { ...regionOf(apres, a), relink }) : apres;
}
