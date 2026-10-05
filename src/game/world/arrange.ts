// Aménager sa région (GD-9, L5, le cœur sans l'écran) : les actions pures qui déplacent et tournent les lieux, déplacent
// et tournent les Gardiens autour de leur lieu, déplacent les bornes dans la bande de devant et les arrivées des
// liaisons, reposent une liaison à reposer, et reviennent à la carte de départ. Chacune lit le monde d'une partie
// (`World` : ses liaisons posées et sa disposition, `world.layout`) et en rend un autre, sans rien toucher d'autre :
// ni la disposition appliquée au monde (./appliedLayout.ts), ni les caches. Après chaque action, une liaison posée qui
// ne se trace plus devient une liaison à reposer (`relink`) ; rien ne se perd : elle reste construite, ses lieux restent
// ouverts, et on la repose gratuitement entre deux voisins au choix (`relinkBetween`). Code pur, sans Three.js.
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { BRIDGES, type BridgeDef, getBridge, reachableIslands } from './archipelago';
import { type ArchipelagoId, archipelagoOfIsland, bornesDuCoeur, type IslandDef, isLandInWorld, startingIsland } from './map';
import { SIDE_OF, LAYOUT_SIDE_OF } from './appliedLayout';
import { type FootprintPart, footprintOf, frameOf, GAP_BETWEEN_PLACES, gapBetween, LINK_GAP, placedIsland, poseOfSpot, spotInSteps } from './footprint';
import { STEP, type Quarts, type Rectangle, SIDES, turnDirection, turnedSide } from './placement';
import { LONG_LENGTH, possibleLandings, RegionRouter, type LinkLandings, type LinkRoute, startingPlaces, placesOf } from './routing';
import { LAYOUT_LAST_SPOT, type LayoutGuardian, type LayoutLanding, type LayoutSide, type LayoutSpot, type LayoutTurn, type RegionLayout } from './savedLayout';
import { ecueilsDe } from './terrain/sea';
import { zoneDesPlans } from './plans';
import { AVATAR_HOME } from './terrain/base';
import { portesDesLieux } from './terrain/village';
import { creatureDuMonde, creatureSpot } from './terrain/creatures';
import { QUEST_ROW, questStations } from './terrain/markers';

// ---------- Les mots communs ----------

/** Une direction des flèches du mode « Aménager », en mots : le nord est au fond de la Carte (y haut), l'est à droite. */
export type Direction = 'nord' | 'sud' | 'est' | 'ouest';

export const DIRECTIONS: readonly Direction[] = ['nord', 'est', 'sud', 'ouest'];

/** Le pas d'une direction dans le monde. */
export const DIRECTION_STEP: Readonly<Record<Direction, { dx: number; dy: number }>> = {
  nord: { dx: 0, dy: 1 },
  est: { dx: 1, dy: 0 },
  sud: { dx: 0, dy: -1 },
  ouest: { dx: -1, dy: 0 },
};

/** Pourquoi une action ne se fait pas. */
type ArrangeRefusal =
  /** Le lieu de départ (en 6e, les deux lieux ouverts au départ) ne bouge pas. */
  | 'fixe'
  /** Ce n'est pas une place libre (hors du cadre, trop près d'un lieu, sur un écueil, hors de la bande…). */
  | 'occupee'
  /** Un lieu, une borne, une liaison inconnus. */
  | 'inconnu'
  /** Deux lieux réunis bougent ensemble : le geste viendra avec la construction qui réunit. */
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
function joinedWith(world: World, id: BiomeId): BiomeId | null {
  const p = regionOf(world, archipelagoOfIsland(id)).joined?.find(([x, y]) => x === id || y === id);
  return p ? (p[0] === id ? p[1] : p[0]) : null;
}

/** Les rectangles de l'emprise d'un lieu dans un monde (son Gardien à sa place). */
function footprintIn(world: World, id: BiomeId, def: IslandDef = placeIn(world, id), gardien: LayoutGuardian | undefined = regionOf(world, archipelagoOfIsland(id)).guardians?.[id]): Rectangle[] {
  return footprintOf(id, def, gardien);
}

/**
 * Une emprise tombe-t-elle sur un écueil (GD-9 : les écueils de la mer restent fixes, une place libre ne tombe jamais
 * sur l'un d'eux) ? Sur une case de la terre du lieu, ou sur ses îlots (Gardien, grande construction, quai).
 */
function onReef(a: ArchipelagoId, def: IslandDef, parts: readonly FootprintPart[]): boolean {
  for (const k of ecueilsDe(a)) {
    const [x, y] = k.split(',').map(Number);
    for (const p of parts) {
      if (x < p.x0 || x >= p.x1 || y < p.y0 || y >= p.y1) continue;
      if (p.genre !== 'terre') return true;
      if (isLandInWorld(def, x, y)) return true;
    }
  }
  return false;
}

/** Des rectangles tiennent-ils dans le cadre de la région ? */
function inFrame(a: ArchipelagoId, rs: readonly Rectangle[]): boolean {
  const c = frameOf(a);
  return rs.every((r) => r.x0 >= c.x0 && r.y0 >= c.y0 && r.x1 <= c.x1 && r.y1 <= c.y1);
}

/** Les emprises des autres lieux d'une région, dans un monde. */
function othersFootprints(world: World, a: ArchipelagoId, sauf: BiomeId): Rectangle[] {
  return placesOf(a)
    .filter((id) => id !== sauf)
    .flatMap((id) => footprintIn(world, id));
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
  return new RegionRouter(a, { lieux, ecueils: ecueilsDe(a), arriveesDeLaLiaison: landingsOf(r) });
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

/** Les places libres d'un lieu dans un monde (à son orientation `turn`, la sienne par défaut), dans l'ordre de la grille. */
export function freeSpots(world: World, id: BiomeId, turn: LayoutTurn = spotOf(world, id).turn): LayoutSpot[] {
  const a = archipelagoOfIsland(id);
  const autres = othersFootprints(world, a, id);
  const gardien = guardianOf(world, id);
  const max = LAYOUT_LAST_SPOT[a];
  const out: LayoutSpot[] = [];
  for (let y = 0; y <= max.y; y++)
    for (let x = 0; x <= max.x; x++) {
      const spot: LayoutSpot = { x, y, turn };
      const def = placedIsland(id, poseOfSpot(a, spot));
      const rs = footprintOf(id, def, gardien);
      if (inFrame(a, rs) && farEnough(rs, autres) && !onReef(a, def, rs)) out.push(spot);
    }
  return out;
}

/** Une place est-elle libre pour un lieu ? */
export function isFreeSpot(world: World, id: BiomeId, spot: LayoutSpot): boolean {
  const a = archipelagoOfIsland(id);
  const max = LAYOUT_LAST_SPOT[a];
  if (spot.x < 0 || spot.y < 0 || spot.x > max.x || spot.y > max.y) return false;
  const def = placedIsland(id, poseOfSpot(a, spot));
  const rs = footprintOf(id, def, guardianOf(world, id));
  return inFrame(a, rs) && farEnough(rs, othersFootprints(world, a, id)) && !onReef(a, def, rs);
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
function closest<T>(items: readonly T[], at: (t: T) => { x: number; y: number }, point: { x: number; y: number }): T | null {
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
function nextIn<T>(items: readonly T[], at: (t: T) => { x: number; y: number }, from: { x: number; y: number }, dir: Direction): T | null {
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

/** La place libre suivante d'un lieu dans une direction (les flèches), depuis `from` ; `null` : « Plus de place par là ». */
export function nextFreeSpot(world: World, id: BiomeId, from: LayoutSpot, dir: Direction): LayoutSpot | null {
  return nextIn(freeSpots(world, id, from.turn), (s) => s, from, dir);
}

/** Déplace (et oriente) un lieu à une place libre. Le lieu de départ ne bouge pas. */
export function moveIsland(world: World, id: BiomeId, spot: LayoutSpot): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  if (isFixedPlace(id)) return { ok: false, reason: 'fixe' };
  if (joinedWith(world, id)) return { ok: false, reason: 'reunis' };
  if (!isFreeSpot(world, id, spot)) return { ok: false, reason: 'occupee' };
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const islands = { ...r.islands };
  const depart = startingSpot(id);
  // À sa place de départ, sans rotation : le lieu n'est plus dans la disposition.
  if (spot.x === depart.x && spot.y === depart.y && spot.turn === 0) delete islands[id];
  else islands[id] = { x: spot.x, y: spot.y, turn: spot.turn };
  return settle(world, withRegion(world, a, { ...r, islands }), a);
}

/**
 * Tourne un lieu d'un quart de tour (le devant passe à gauche) : à sa place s'il y tient, sinon à la place libre la
 * plus proche ; `occupee` s'il n'en a aucune.
 */
export function turnIsland(world: World, id: BiomeId): ArrangeResult {
  const s = spotOf(world, id);
  const turn = ((s.turn + 1) % 4) as LayoutTurn;
  const ici = { ...s, turn };
  if (isFixedPlace(id)) return { ok: false, reason: 'fixe' };
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

export function guardianFacing(g: LayoutGuardian): GuardianFacing {
  const f = facingSide(g.turn);
  if (f === g.side) return 'mer';
  const oppose = LAYOUT_SIDE_OF[turnedSide(SIDE_OF[g.side], 2)];
  return f === oppose ? 'ile' : 'cote';
}

/** Les places le long d'un côté, en pas (`LayoutGuardian.step`, au plus 8 de chaque côté). */
const GUARDIAN_STEPS = Array.from({ length: 17 }, (_, i) => i - 8);

/** Le rectangle de l'îlot d'un Gardien à une place, dans le monde (son lieu à sa place). */
function isletAt(world: World, id: BiomeId, g: Pick<LayoutGuardian, 'side' | 'step'>): Rectangle {
  return footprintOf(id, placeIn(world, id), g).find((p) => p.genre === 'ilot')!;
}

/** Le milieu de l'îlot d'un Gardien à une place. */
function isletMiddle(world: World, id: BiomeId, g: Pick<LayoutGuardian, 'side' | 'step'>): { x: number; y: number } {
  const r = isletAt(world, id, g);
  return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
}

/**
 * Une place libre pour l'îlot d'un Gardien : contre son lieu (l'îlot longe au moins 4 cases de sa terre), dans le
 * cadre, loin des autres lieux et des écueils, à l'écart de la terre, des grandes constructions et du quai de son lieu,
 * et des liaisons posées (aucune ne se défait).
 */
function isFreeGuardianSpot(world: World, id: BiomeId, g: Pick<LayoutGuardian, 'side' | 'step'>): boolean {
  const a = archipelagoOfIsland(id);
  const def = placeIn(world, id);
  const parts = footprintOf(id, def, g);
  const ilot = parts.find((p) => p.genre === 'ilot')!;
  const terre = parts.find((p) => p.genre === 'terre')!;
  // Contre son lieu : l'îlot et la terre se font face sur au moins 4 cases.
  const face = Math.min(ilot.x1, terre.x1) - Math.max(ilot.x0, terre.x0);
  const faceY = Math.min(ilot.y1, terre.y1) - Math.max(ilot.y0, terre.y0);
  if (Math.max(face, faceY) < 4) return false;
  if (!inFrame(a, [ilot]) || onReef(a, def, [ilot]) || !farEnough([ilot], othersFootprints(world, a, id))) return false;
  // Les grandes constructions et le quai de son lieu : au moins une case d'eau.
  if (parts.some((p) => p.genre !== 'ilot' && p.genre !== 'terre' && gapBetween(p, ilot) < 1)) return false;
  // Les liaisons posées restent : aucune ne passe sur l'îlot (ni à moins de `LINK_GAP` cases).
  for (const t of routesIn(world, a).values())
    for (const c of t?.cases ?? []) if (c.x >= ilot.x0 - LINK_GAP && c.x < ilot.x1 + LINK_GAP && c.y >= ilot.y0 - LINK_GAP && c.y < ilot.y1 + LINK_GAP) return false;
  return true;
}

/** Les places libres de l'îlot d'un Gardien autour de son lieu (sa place du moment comprise). */
export function freeGuardianSpots(world: World, id: BiomeId): Pick<LayoutGuardian, 'side' | 'step'>[] {
  const out: Pick<LayoutGuardian, 'side' | 'step'>[] = [];
  for (const cote of SIDES) for (const step of GUARDIAN_STEPS) if (isFreeGuardianSpot(world, id, { side: LAYOUT_SIDE_OF[cote], step })) out.push({ side: LAYOUT_SIDE_OF[cote], step });
  return out;
}

/** La place libre de l'îlot d'un Gardien la plus proche d'un point touché sur la mer autour de son lieu. */
export function nearestGuardianSpot(world: World, id: BiomeId, point: { x: number; y: number }): Pick<LayoutGuardian, 'side' | 'step'> | null {
  return closest(freeGuardianSpots(world, id), (g) => isletMiddle(world, id, g), point);
}

/** La place libre suivante de l'îlot d'un Gardien dans une direction ; `null` : « Plus de place par là ». */
export function nextGuardianSpot(world: World, id: BiomeId, from: Pick<LayoutGuardian, 'side' | 'step'>, dir: Direction): Pick<LayoutGuardian, 'side' | 'step'> | null {
  return nextIn(freeGuardianSpots(world, id), (g) => isletMiddle(world, id, g), isletMiddle(world, id, from), dir);
}

/** Le monde avec un Gardien à une place (à sa place de départ, il quitte la disposition). */
function withGuardian(world: World, id: BiomeId, g: LayoutGuardian): World {
  const a = archipelagoOfIsland(id);
  const r = regionOf(world, a);
  const guardians = { ...r.guardians };
  if (g.side === 'front' && g.step === 0 && g.turn === 0) delete guardians[id];
  else guardians[id] = g;
  return withRegion(world, a, { ...r, guardians });
}

/**
 * Déplace l'îlot d'un Gardien autour de son lieu, sur une place libre ; il garde ce qu'il regarde (la mer, son île,
 * la côte) en changeant de côté. Éteint ou rallumé, il garde son état (rien d'autre ne change).
 */
export function moveGuardian(world: World, id: BiomeId, to: Pick<LayoutGuardian, 'side' | 'step'>): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  if (!isFreeGuardianSpot(world, id, to)) return { ok: false, reason: 'occupee' };
  const g = guardianOf(world, id);
  // Le quart de tour qui mène de son côté d'avant au nouveau : il tourne d'autant.
  const q = ([0, 1, 2, 3] as Quarts[]).find((k) => turnedSide(SIDE_OF[g.side], k) === SIDE_OF[to.side])!;
  return { ok: true, world: withGuardian(world, id, { side: to.side, step: to.step, turn: ((g.turn + q) % 4) as LayoutTurn }), relink: [] };
}

/** Tourne un Gardien d'un quart de tour sur son îlot (sur la grille, rien en biais). */
export function turnGuardian(world: World, id: BiomeId): ArrangeResult {
  if (!getBiome(id)) return { ok: false, reason: 'inconnu' };
  const g = guardianOf(world, id);
  return { ok: true, world: withGuardian(world, id, { ...g, turn: ((g.turn + 1) % 4) as LayoutTurn }), relink: [] };
}

// ---------- Les bornes ----------

/** La place d'une borne dans le repère de son lieu (clé « lieu:mission ») dans un monde, ou `null` si elle n'existe pas. */
export function stationOf(world: World, key: string): { x: number; y: number } | null {
  const [id, mission] = key.split(':') as [BiomeId, string];
  if (!getBiome(id)) return null;
  const moved = regionOf(world, archipelagoOfIsland(id)).stations?.[key];
  if (moved) return moved;
  const st = questStations(id).find((s) => s.typeId === mission);
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
  for (const st of questStations(id)) {
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
  const depart = questStations(id).find((st) => st.typeId === mission)!;
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
  const depart = questStations(id).find((s) => s.typeId === mission);
  if (depart && depart.x === to.x && depart.y === to.y) delete stations[key];
  else stations[key] = { x: to.x, y: to.y };
  return { ok: true, world: withRegion(world, a, { ...r, stations }), relink: [] };
}

/** La place libre suivante d'une borne dans une direction (dans le monde, son lieu tourné) ; `null` : « Plus de place par là ». */
export function nextStationSpot(world: World, key: string, dir: Direction): { x: number; y: number } | null {
  const [id] = key.split(':') as [BiomeId];
  const from = stationOf(world, key);
  if (!from) return null;
  // Les flèches parlent du monde : la direction est ramenée dans le repère du lieu tourné.
  const q = spotOf(world, id).turn;
  const d = DIRECTION_STEP[dir];
  const local = turnDirection(d.dx, d.dy, ((4 - q) % 4) as Quarts);
  const dirLocale = DIRECTIONS.find((k) => DIRECTION_STEP[k].dx === local.dx && DIRECTION_STEP[k].dy === local.dy)!;
  return nextIn(freeStationSpots(world, key), (p) => p, from, dirLocale);
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
 * Revient à la carte de départ dans une région (le menu, « Carte de départ ») : sa disposition est vidée, et les liaisons
 * à reposer redeviennent des liaisons posées. Aucune n'est perdue : les liaisons de la partie ne changent pas.
 */
export function backToStartingMap(world: World, a: ArchipelagoId): World {
  return withRegion(world, a, {});
}
