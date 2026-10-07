// Aménager sa région (GD-9, L5, le cœur sans l'écran) : les actions pures qui déplacent et tournent les lieux, déplacent
// et tournent les Gardiens autour de leur lieu, déplacent les bornes dans la bande de devant et les arrivées des
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
import { detachedIsletTooClose, fittingPlaces, type FootprintPart, footprintOf, frameOf, GAP_BETWEEN_PLACES, gapBetween, LINK_GAP, placedIsland, poseOfSpot, spotInSteps, tooSmallGaps } from './footprint';
import { STEP, type Quarts, type Rectangle, SIDES, TOWARDS_SEA, turnedSide, wrapQuarts } from './placement';
import { LONG_LENGTH, possibleLandings, RegionRouter, type LinkLandings, type LinkRoute, startingPlaces, placesOf } from './routing';
import { type GuardianPlace, LAYOUT_LAST_ISLET_SPOT, LAYOUT_LAST_SPOT, type LayoutGuardian, type LayoutLanding, type LayoutSide, type LayoutSpot, type LayoutTurn, type RegionLayout } from './savedLayout';
import { reefsOutside } from './terrain/sea';
import { zoneDesPlans } from './plans';
import { AVATAR_HOME } from './terrain/base';
import { portesDesLieux } from './terrain/village';
import { creatureDuMonde, creatureSpot } from './terrain/creatures';
import { joinShape, type JoinShape } from './join';
import { QUEST_ROW, startingStations } from './terrain/markers';
import { ISLET_H, ISLET_W } from './terrain/islets';

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

/** Le Gardien d'un lieu dans un monde : son côté, sa place le long du côté, son orientation (devant, au pas 0, de face). */
export function guardianOf(world: World, id: BiomeId): LayoutGuardian {
  return regionOf(world, archipelagoOfIsland(id)).guardians?.[id] ?? { side: 'front', step: 0, turn: 0 };
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

/** Les rectangles de l'emprise d'un lieu dans un monde (son Gardien à sa place). */
function footprintIn(world: World, id: BiomeId, def: IslandDef = placeIn(world, id), gardien: LayoutGuardian | undefined = regionOf(world, archipelagoOfIsland(id)).guardians?.[id]): FootprintPart[] {
  return footprintOf(id, def, gardien);
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

/** L'îlot détaché du Gardien d'un lieu (choix 4a), dont le lieu doit se tenir loin ; rien s'il est contre son lieu. */
export function detachedIsletTooCloseTo(world: World, id: BiomeId): Rectangle[] {
  const g = guardianOf(world, id);
  return g.spot ? [footprintOf(id, placeIn(world, id), g).find((p) => p.genre === 'ilot')!] : [];
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
  return new RegionRouter(a, { lieux, ecueils, arriveesDeLaLiaison: landingsOf(r), reunions, gardiens: (id) => r.guardians?.[id] });
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
    const rs = footprintOf(g.id, def, guardianOf(world, g.id));
    if (!inFrame(a, rs) || !farEnough(rs, autres)) return false;
    // Son Gardien détaché reste où il est (choix 5a du mainteneur) : le lieu se pose loin de son îlot, comme de tout lieu.
    if (detachedIsletTooClose(rs).length && isDetached(guardianOf(world, g.id))) return false;
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
  const a = archipelagoOfIsland(id);
  const autres = othersFootprints(world, a, groupOf(world, id));
  const max = LAYOUT_LAST_SPOT[a];
  const out: LayoutSpot[] = [];
  // `autour` : seulement les places à `pas` crans au plus d'une place (le dessin d'un choix n'en montre pas d'autres).
  const [x0, x1] = autour ? [Math.max(0, autour.x - autour.pas), Math.min(max.x, autour.x + autour.pas)] : [0, max.x];
  const [y0, y1] = autour ? [Math.max(0, autour.y - autour.pas), Math.min(max.y, autour.y + autour.pas)] : [0, max.y];
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const spot: LayoutSpot = { x, y, turn };
      if (fitsAt(world, id, spot, autres)) out.push(spot);
    }
  return out;
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
 * Les lieux entrés au jeu après qu'une région a été aménagée (les deux îles d'histoire-géographie de 6e, HG-2) : absents
 * de la disposition sauvegardée, ils sont à leur place de la carte de départ. Si elle touche un lieu que l'élève a
 * déplacé, la disposition ne tiendrait plus (`fittingPlaces`) et toute la région reviendrait à la carte de départ : le
 * lieu nouveau se pose plutôt à la place libre la plus proche de sa place de départ, de face, et rien d'autre ne bouge.
 * Rend le même monde quand chaque région tient déjà, ou quand aucune place libre ne la ferait tenir (la région revient
 * alors à la carte de départ, comme avant).
 */
export function settleNewPlaces(world: World): World {
  let w = settleDetachedGuardians(world);
  for (const a of ARCHIPELAGO_IDS) {
    const r = regionOf(w, a);
    if (!r.islands || fittingPlaces(a, r.islands, r.guardians ?? {})) continue;
    const poses = r.islands;
    const bouge = (id: BiomeId) => poses[id] !== undefined || r.guardians?.[id] !== undefined;
    const ecarts = tooSmallGaps(
      a,
      placesOf(a).map((id) => placeIn(w, id)),
      bouge,
      (id) => r.guardians?.[id],
    );
    // Un lieu resté à sa place de départ ne touche jamais un lieu déplacé (`moveIsland` le refuse) : s'il le touche, il
    // est nouveau.
    const nouveaux = placesOf(a).filter((id) => !bouge(id) && ecarts.some((e) => e.place === id || e.other === id));
    if (!nouveaux.length) continue;
    let essai: World | null = w;
    for (const id of nouveaux) {
      const depart = startingIsland(id).core;
      // On cherche autour du milieu du cœur de départ, pas de son coin.
      const libre = nearestFreeSpot(essai, id, { x: depart.x + CORE / 2, y: depart.y + CORE / 2 }, 0);
      if (!libre) {
        essai = null;
        break;
      }
      const ici = regionOf(essai, a);
      essai = withRegion(essai, a, { ...ici, islands: { ...ici.islands, [id]: libre } });
    }
    const apres = essai && regionOf(essai, a);
    if (essai && apres && fittingPlaces(a, apres.islands ?? {}, apres.guardians ?? {})) w = essai;
  }
  return w;
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

// ---------- Les Gardiens ----------

/** Le côté vers lequel regarde un Gardien dans le repère de son lieu (de face, à l'orientation 0, il regarde devant). */
function facingSide(turn: LayoutTurn): LayoutSide {
  return LAYOUT_SIDE_OF[turnedSide('devant', turn as Quarts)];
}

/** Ce que regarde un Gardien : la mer (le large de son côté), son île, ou le long de la côte. */
export type GuardianFacing = 'mer' | 'ile' | 'cote';

/**
 * Ce que regarde un Gardien. Détaché de son lieu (choix 4a du mainteneur), son orientation est celle du monde : `versSonLieu`,
 * la direction de son îlot vers son lieu (dans le monde), dit s'il regarde son île, la mer (à l'opposé) ou à côté.
 */
export function guardianFacing(g: LayoutGuardian, versSonLieu?: { dx: number; dy: number }): GuardianFacing {
  if (g.spot && versSonLieu) {
    const regard = TOWARDS_SEA[turnedSide('devant', g.turn as Quarts)];
    const [ax, ay] = Math.abs(versSonLieu.dx) >= Math.abs(versSonLieu.dy) ? [Math.sign(versSonLieu.dx), 0] : [0, Math.sign(versSonLieu.dy)];
    if (regard.dx === ax && regard.dy === ay) return 'ile';
    return regard.dx === -ax && regard.dy === -ay ? 'mer' : 'cote';
  }
  const f = facingSide(g.turn);
  if (f === g.side) return 'mer';
  const oppose = LAYOUT_SIDE_OF[turnedSide(SIDE_OF[g.side], 2)];
  return f === oppose ? 'ile' : 'cote';
}

/** La phrase écrite et lue quand on tourne un Gardien. */
export const GUARDIAN_FACING_TEXT: Readonly<Record<GuardianFacing, string>> = {
  mer: 'Il regarde vers la mer.',
  ile: 'Il regarde vers son île.',
  cote: 'Il regarde le long de la côte.',
};

/** Les places le long d'un côté, en pas (`LayoutGuardian.step`, au plus 8 de chaque côté). */
const GUARDIAN_STEPS = Array.from({ length: 17 }, (_, i) => i - 8);

/** L'îlot d'un Gardien est-il détaché de son lieu (choix 4a du mainteneur) ? */
export function isDetached(g: GuardianPlace): boolean {
  return g.spot !== undefined;
}

/** Deux places d'un îlot de Gardien sont-elles la même ? */
export function sameGuardianPlace(g: GuardianPlace, h: GuardianPlace): boolean {
  if (g.spot || h.spot) return g.spot?.x === h.spot?.x && g.spot?.y === h.spot?.y;
  return g.side === h.side && g.step === h.step;
}

/** Le rectangle de l'îlot d'un Gardien à une place, dans le monde (son lieu à sa place). */
function isletAt(world: World, id: BiomeId, g: GuardianPlace): Rectangle {
  return footprintOf(id, placeIn(world, id), g).find((p) => p.genre === 'ilot')!;
}

/** Le milieu de l'îlot d'un Gardien à une place. */
export function isletMiddle(world: World, id: BiomeId, g: GuardianPlace): { x: number; y: number } {
  const r = isletAt(world, id, g);
  return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
}

/**
 * De quoi dire, place par place, si l'îlot d'un Gardien s'y pose (ce qui ne dépend pas de la place se calcule une fois :
 * les emprises des autres lieux, les liaisons posées). Contre son lieu : l'îlot longe au moins 4 cases de sa terre, à
 * l'écart de ses grandes constructions et de son quai. Détaché (choix 4a du mainteneur) : au moins `GAP_BETWEEN_PLACES`
 * cases d'eau de tout lieu, le sien compris. Toujours : dans le cadre, loin des autres lieux, et aucune liaison posée ne
 * passe dessus (aucune ne se défait).
 */
function guardianSpotTest(world: World, id: BiomeId): (g: GuardianPlace) => boolean {
  const a = archipelagoOfIsland(id);
  const def = placeIn(world, id);
  const autres = othersFootprints(world, a, id);
  const cases = [...routesIn(world, a).values()].flatMap((t) => t?.cases ?? []);
  return (g) => {
    const parts = footprintOf(id, def, g);
    const ilot = parts.find((p) => p.genre === 'ilot')!;
    if (!inFrame(a, [ilot]) || !farEnough([ilot], autres)) return false;
    if (g.spot) {
      if (detachedIsletTooClose(parts).length) return false;
    } else {
      if (!againstLand(parts)) return false;
      // Les grandes constructions et le quai de son lieu : au moins une case d'eau.
      if (parts.some((p) => p.genre !== 'ilot' && p.genre !== 'terre' && gapBetween(p, ilot) < 1)) return false;
    }
    // Les liaisons posées restent : aucune ne passe sur l'îlot (ni à moins de `LINK_GAP` cases).
    return !cases.some((c) => c.x >= ilot.x0 - LINK_GAP && c.x < ilot.x1 + LINK_GAP && c.y >= ilot.y0 - LINK_GAP && c.y < ilot.y1 + LINK_GAP);
  };
}

/** Une place libre pour l'îlot d'un Gardien (`guardianSpotTest`). */
export function isFreeGuardianSpot(world: World, id: BiomeId, g: GuardianPlace): boolean {
  return guardianSpotTest(world, id)(g);
}

/** L'îlot et la terre d'une emprise se font-ils face sur au moins 4 cases (l'îlot contre son lieu) ? */
function againstLand(parts: readonly FootprintPart[]): boolean {
  const ilot = parts.find((p) => p.genre === 'ilot')!;
  const terre = parts.find((p) => p.genre === 'terre')!;
  const face = Math.min(ilot.x1, terre.x1) - Math.max(ilot.x0, terre.x0);
  const faceY = Math.min(ilot.y1, terre.y1) - Math.max(ilot.y0, terre.y0);
  return Math.max(face, faceY) >= 4;
}

/**
 * Toutes les places de l'îlot d'un Gardien, libres ou prises : celles contre son lieu (un côté, un pas), puis les places
 * détachées de la grille de sa région où l'îlot tient dans le cadre, à 4 cases au moins de sa terre (choix 4a du
 * mainteneur) ; `autour` : seulement à
 * `r` cases au plus d'un point (le milieu de l'îlot).
 */
export function guardianPlaces(world: World, id: BiomeId, autour?: { x: number; y: number; r: number }): GuardianPlace[] {
  const a = archipelagoOfIsland(id);
  const def = placeIn(world, id);
  const out: GuardianPlace[] = [];
  const pres = (g: GuardianPlace) => {
    if (!autour) return true;
    const m = isletMiddle(world, id, g);
    return Math.max(Math.abs(m.x - autour.x), Math.abs(m.y - autour.y)) <= autour.r;
  };
  for (const cote of SIDES)
    for (const step of GUARDIAN_STEPS) {
      const g: GuardianPlace = { side: LAYOUT_SIDE_OF[cote], step };
      if (againstLand(footprintOf(id, def, g)) && pres(g)) out.push(g);
    }
  const c = frameOf(a);
  const { x: w, y: h } = LAYOUT_LAST_ISLET_SPOT[a];
  // Le milieu de l'îlot à une place détachée, depuis le coin du cadre : de quoi ne parcourir que les places autour.
  const [mx, my] = [c.x0 + ISLET_W / 2, c.y0 + ISLET_H / 2];
  const [x0, x1] = autour ? [Math.max(0, Math.ceil((autour.x - autour.r - mx) / STEP)), Math.min(w, Math.floor((autour.x + autour.r - mx) / STEP))] : [0, w];
  const [y0, y1] = autour ? [Math.max(0, Math.ceil((autour.y - autour.r - my) / STEP)), Math.min(h, Math.floor((autour.y + autour.r - my) / STEP))] : [0, h];
  // Une place détachée trop près de sa propre terre n'est une place ni contre son lieu, ni détachée : elle n'en est pas une
  // (les flèches et le doigt passent de l'une à l'autre sans s'y arrêter).
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const g: GuardianPlace = { side: 'front', step: 0, spot: { x, y } };
      if (!detachedIsletTooClose(footprintOf(id, def, g)).length) out.push(g);
    }
  return out;
}

/** Les places libres de l'îlot d'un Gardien (sa place du moment comprise) ; `autour` : près d'un point seulement. */
export function freeGuardianSpots(world: World, id: BiomeId, autour?: { x: number; y: number; r: number }): GuardianPlace[] {
  const libre = guardianSpotTest(world, id);
  return guardianPlaces(world, id, autour).filter(libre);
}

/** La place libre de l'îlot d'un Gardien la plus proche d'un point touché sur la mer de sa région. */
export function nearestGuardianSpot(world: World, id: BiomeId, point: { x: number; y: number }): GuardianPlace | null {
  return closest(freeGuardianSpots(world, id), (g) => isletMiddle(world, id, g), point);
}

/** La place de l'îlot d'un Gardien la plus proche d'un point, libre ou prise (le doigt qui glisse l'îlot, choix 1b). */
export function guardianPlaceNear(world: World, id: BiomeId, point: { x: number; y: number }, places?: readonly GuardianPlaceAt[]): GuardianPlace | null {
  const r = GUARDIAN_DRAG_REACH;
  const autour = places ?? guardianPlacesAt(world, id, { ...point, r });
  const proches = autour.filter((p) => Math.max(Math.abs(p.milieu.x - point.x), Math.abs(p.milieu.y - point.y)) <= r);
  return closest(proches, (p) => p.milieu, point)?.place ?? null;
}

/** Jusqu'où, en cases, la place de l'îlot d'un Gardien glissé se cherche autour du doigt (le milieu de l'îlot). */
const GUARDIAN_DRAG_REACH = 2 * STEP;

/** Une place de l'îlot d'un Gardien et son milieu dans le monde. */
export interface GuardianPlaceAt {
  place: GuardianPlace;
  milieu: { x: number; y: number };
}

/**
 * Les places de l'îlot d'un Gardien (`guardianPlaces`) et leur milieu : calculées une fois au départ d'un glissé
 * (choix 1b du mainteneur), puis seulement parcourues à chaque case franchie (`guardianPlaceNear`).
 */
export function guardianPlacesAt(world: World, id: BiomeId, autour?: { x: number; y: number; r: number }): GuardianPlaceAt[] {
  return guardianPlaces(world, id, autour).map((place) => ({ place, milieu: isletMiddle(world, id, place) }));
}

/**
 * Le cran suivant de l'îlot d'un Gardien dans une direction (choix 3 du mainteneur, 6 octobre 2026) : la place la plus
 * proche de ce côté, contre son lieu ou détachée (choix 4a), libre ou prise ; `null` : « Plus de place par là ».
 */
export function stepGuardianSpot(world: World, id: BiomeId, from: GuardianPlace, dir: Direction): GuardianPlace | null {
  const ici = isletMiddle(world, id, from);
  // Assez loin pour passer de l'autre côté de son lieu (sa terre et son eau) d'un seul cran.
  return nextIn(guardianPlaces(world, id, { ...ici, r: 12 * STEP }), (g) => isletMiddle(world, id, g), ici, dir);
}

/** Le monde avec un Gardien à une place (à sa place de départ, il quitte la disposition). */
function withGuardian(world: World, id: BiomeId, g: LayoutGuardian): World {
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const guardians = { ...r.guardians };
  if (g.side === 'front' && g.step === 0 && g.turn === 0 && !g.spot) delete guardians[id];
  else guardians[id] = g;
  return withRegion(world, a, { ...r, guardians });
}

/**
 * Déplace l'îlot d'un Gardien sur une place libre : contre son lieu, il garde ce qu'il regarde (la mer, son île, la côte)
 * en changeant de côté ; détaché de son lieu ou qui s'y rattache (choix 4a du mainteneur), il garde son orientation dans
 * le monde. Éteint ou rallumé, il garde son état (rien d'autre ne change).
 */
export function moveGuardian(world: World, id: BiomeId, to: GuardianPlace): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  if (!isFreeGuardianSpot(world, id, to)) return { ok: false, reason: 'occupee' };
  const g = guardianOf(world, id);
  const q = placeIn(world, id).quarts;
  if (to.spot) return { ok: true, world: withGuardian(world, id, { side: 'front', step: 0, turn: g.spot ? g.turn : wrapQuarts(g.turn + q), spot: { ...to.spot } }), relink: [] };
  if (g.spot) return { ok: true, world: withGuardian(world, id, { side: to.side, step: to.step, turn: wrapQuarts(g.turn - q) }), relink: [] };
  // Le quart de tour qui mène de son côté d'avant au nouveau : il tourne d'autant.
  const k = ([0, 1, 2, 3] as Quarts[]).find((n) => turnedSide(SIDE_OF[g.side], n) === SIDE_OF[to.side])!;
  return { ok: true, world: withGuardian(world, id, { side: to.side, step: to.step, turn: wrapQuarts(g.turn + k) }), relink: [] };
}

/** Tourne un Gardien d'un quart de tour sur son îlot (sur la grille, rien en biais). */
export function turnGuardian(world: World, id: BiomeId): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  const g = guardianOf(world, id);
  return { ok: true, world: withGuardian(world, id, { ...g, turn: ((g.turn + 1) % 4) as LayoutTurn }), relink: [] };
}

/**
 * Les Gardiens détachés dont l'îlot ne tient plus à sa place (une sauvegarde abîmée, un lieu entré au jeu depuis) :
 * chacun revient devant son lieu, tourné dans le monde comme il l'était, et rien d'autre ne bouge (choix 4a du mainteneur).
 */
function settleDetachedGuardians(world: World): World {
  let w = world;
  for (const a of ARCHIPELAGO_IDS) {
    const r = regionOf(w, a);
    for (const [id, g] of Object.entries(r.guardians ?? {}) as [BiomeId, LayoutGuardian][]) {
      if (!g.spot) continue;
      const parts = footprintIn(w, id);
      const ilot = parts.find((p) => p.genre === 'ilot')!;
      if (inFrame(a, [ilot]) && farEnough([ilot], othersFootprints(w, a, id)) && !detachedIsletTooClose(parts).length) continue;
      // Son orientation détachée est celle du monde ; contre son lieu, elle se compte depuis son lieu (comme `moveGuardian`).
      w = withGuardian(w, id, { side: 'front', step: 0, turn: wrapQuarts(g.turn - placeIn(w, id).quarts) });
    }
  }
  return w;
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
 * Ce qui, dans la disposition d'une région, s'écarte vraiment de la carte de départ : un lieu, un Gardien ou une borne
 * remis à sa place de départ n'y compte plus, ni une liste vide. Deux dispositions sont pareilles quand ceci l'est.
 */
function ecartsDeLaCarteDeDepart(world: World, a: ArchipelagoId): string {
  const r = regionOf(world, a);
  const islands = Object.entries(r.islands ?? {}).filter(([id, s]) => {
    const d = startingSpot(id as BiomeId);
    return s && (s.x !== d.x || s.y !== d.y || s.turn !== d.turn);
  });
  const guardians = Object.entries(r.guardians ?? {}).filter(([, g]) => g && (g.side !== 'front' || g.step !== 0 || g.turn !== 0 || g.spot));
  const stations = Object.entries(r.stations ?? {}).filter(([key, p]) => {
    const [id, mission] = key.split(':') as [BiomeId, string];
    const d = startingStations(id).find((st) => st.typeId === mission);
    return !d || d.x !== p.x || d.y !== p.y;
  });
  const listes = { landings: Object.entries(r.landings ?? {}), joined: r.joined ?? [], shortcuts: r.shortcuts ?? [], relink: r.relink ?? [] };
  return JSON.stringify({ islands: islands.sort(), guardians: guardians.sort(), stations: stations.sort(), ...listes });
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
 * Revient à la carte de départ dans une région (le menu, « Carte de départ ») : sa disposition est vidée (chaque Gardien
 * revient devant son lieu, détaché ou non : choix 4a du mainteneur), et les liaisons
 * à reposer redeviennent des liaisons posées. Aucune n'est perdue : les liaisons de la partie ne changent pas. Deux lieux
 * réunis ne se séparent plus (GD-9, point 10) : ils restent où ils sont, avec leurs Gardiens, et un lieu dont la place
 * de départ toucherait leur réunion reste aussi où il est ; `null` si la carte ainsi faite ne tient pas.
 */
export function backToStartingMap(world: World, a: ArchipelagoId): World | null {
  const r = regionOf(world, a);
  const joined = r.joined ?? [];
  if (!joined.length) return withRegion(world, a, {});
  const reunis = new Set<BiomeId>(joined.flat());
  const islands: NonNullable<RegionLayout['islands']> = {};
  const guardians: NonNullable<RegionLayout['guardians']> = {};
  for (const id of reunis) {
    if (r.islands?.[id]) islands[id] = r.islands[id];
    // Un Gardien détaché (choix 4a) revient devant son lieu, même réuni.
    const g = r.guardians?.[id];
    if (g && !g.spot) guardians[id] = g;
  }
  const sansLesAutres = withRegion(world, a, { islands, guardians, joined });
  const occupe = othersFootprints(sansLesAutres, a, placesOf(a).filter((id) => !reunis.has(id)));
  // Un lieu dont la place de départ touche une réunion reste où il est.
  for (const id of placesOf(a)) {
    if (reunis.has(id) || !r.islands?.[id]) continue;
    if (!farEnough(footprintOf(id, startingIsland(id)), occupe)) islands[id] = r.islands[id];
  }
  const apres = withRegion(world, a, { islands, guardians, joined });
  const tenus = fittingPlaces(a, islands, guardians);
  const zones = joinsIn(apres, a);
  if (!tenus || zones.length !== joined.length) return null;
  for (const j of zones) if (!farEnough([j.shape.zone], othersFootprints(apres, a, j.pair))) return null;
  // Les liaisons qu'une réunion empêche restent à reposer ; les autres redeviennent posées.
  const traces = routesIn(apres, a);
  const relink = (r.relink ?? []).filter((id) => traces.get(id) === null);
  return relink.length ? withRegion(apres, a, { ...regionOf(apres, a), relink }) : apres;
}
