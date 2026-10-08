// Réunir deux lieux (GD-9, point 10, mot neutre `join`) : deux lieux ouverts voisins, collés à la distance minimale de
// la grille (`GAP_BETWEEN_PLACES` cases d'eau, un pas de plus au plus), côte à côte sur un côté commun, se réunissent par
// une construction de 4 cases de long sur toute la largeur de ce côté. Elle se pose élément par élément comme une
// grande construction (un plan, `JoinDef`), payée en ressources des deux lieux (la moitié de chacun), et donne de l'XP,
// sans succès ; elle ne compte pas pour l'état du village. Ici, sa forme : les cases d'eau entre les deux côtes (les
// creux d'une baie compris, deux cases au plus), à la hauteur de chaque côte, avec une marche par cran de hauteur
// (trois au plus : au-delà, la réunion n'est pas proposée). Elle se lit dans un repère qui suit la paire : `u` le long,
// depuis le bord de l'emprise du premier lieu ; `j` en travers, de gauche à droite en regardant du premier vers le
// second ; `k` la hauteur au-dessus de l'altitude. La paire bouge et tourne d'un bloc : ce repère, et les clés des cases
// posées, ne changent pas. Code pur, sans Three.js.
import { type BiomeId, type BlockId, getBiome } from '../biomes';
import type { ArchipelagoId } from './archipelagos';
import { archipelagoOfIsland } from './archipelagos';
import { joinId, pairOfJoinId } from './savedLayout';
import { GAP_BETWEEN_PLACES, landRectangle } from './footprint';
import { type IslandDef, islandDef, isLandInWorld, reliefHeight, toPlace } from './map';
import type { PlanCell, PlanDef } from './plans';
import { chosenJoins, layoutCache, STEP, type Rectangle } from './placement';

/** Combien de cases, au plus, elle entre dans une baie de chaque côte pour la rejoindre. */
export const JOIN_FILL = 2;

/** Les marches qu'elle rattrape au plus, d'une côte à l'autre (au-delà, la réunion n'est pas proposée). */
export const JOIN_MAX_STEPS = 3;

/** Sa largeur au moins, en cases (un côté commun plus étroit ne se réunit pas). */
const JOIN_MIN_WIDTH = 4;

/** Ce qu'elle rapporte, terminée (sans succès). */
const JOIN_XP = 100;

/** Une case de la construction qui réunit : son repère (`u`, `j`, `k`), sa case du monde, et le lieu qui la paie. */
interface JoinCell {
  u: number;
  j: number;
  k: number;
  x: number;
  y: number;
  z: number;
  half: 'a' | 'b';
}

/** La forme de la construction entre deux lieux posés. */
export interface JoinShape {
  /** Une case par colonne (le dessus), de la côte du premier lieu à celle du second. */
  cells: JoinCell[];
  /** Le rectangle qu'elle couvre dans le monde. */
  zone: Rectangle;
  /** Son milieu, de la côte du premier lieu à celle du second : où l'on marche, en cases du monde (z : sous les pieds). */
  deck: { x: number; y: number; z: number }[];
  /** Les marches, de 0 à `JOIN_MAX_STEPS`. */
  steps: number;
}

/** Pourquoi deux lieux ne se réunissent pas. */
type JoinRefusal = 'loin' | 'etroit' | 'marches';

/** La hauteur du sol d'une case de terre d'un lieu (posé et tourné), au-dessus de son altitude. */
function heightAt(def: IslandDef, x: number, y: number): number {
  const l = toPlace(def, x, y);
  return reliefHeight(def, def.core.x + l.x, def.core.y + l.y);
}

/**
 * Le repère de la paire : de (u, t) à une case du monde, `u` le long de l'axe qui sépare les deux lieux depuis le bord
 * de l'emprise du premier, `t` la coordonnée du monde en travers ; et `j` depuis `t`, de gauche à droite en regardant du
 * premier vers le second.
 */
interface Frame {
  gap: number;
  lo: number;
  hi: number;
  at(u: number, t: number): { x: number; y: number };
  j(t: number, lo: number, hi: number): number;
}

function frameBetween(ra: Rectangle, rb: Rectangle): Frame | null {
  const overlapY = { lo: Math.max(ra.y0, rb.y0), hi: Math.min(ra.y1, rb.y1) };
  const overlapX = { lo: Math.max(ra.x0, rb.x0), hi: Math.min(ra.x1, rb.x1) };
  if (rb.x0 >= ra.x1 && overlapY.hi > overlapY.lo)
    return { gap: rb.x0 - ra.x1, ...overlapY, at: (u, t) => ({ x: ra.x1 + u, y: t }), j: (t, _lo, hi) => hi - 1 - t };
  if (ra.x0 >= rb.x1 && overlapY.hi > overlapY.lo)
    return { gap: ra.x0 - rb.x1, ...overlapY, at: (u, t) => ({ x: ra.x0 - 1 - u, y: t }), j: (t, lo) => t - lo };
  if (rb.y0 >= ra.y1 && overlapX.hi > overlapX.lo)
    return { gap: rb.y0 - ra.y1, ...overlapX, at: (u, t) => ({ x: t, y: ra.y1 + u }), j: (t, lo) => t - lo };
  if (ra.y0 >= rb.y1 && overlapX.hi > overlapX.lo)
    return { gap: ra.y0 - rb.y1, ...overlapX, at: (u, t) => ({ x: t, y: ra.y0 - 1 - u }), j: (t, _lo, hi) => hi - 1 - t };
  return null;
}

/**
 * La forme de la construction qui réunirait deux lieux posés, ou pourquoi elle ne se pose pas : trop loin (ou pas côte à
 * côte), un côté commun trop étroit, trop de marches.
 */
function joinShapeOrWhy(da: IslandDef, db: IslandDef): JoinShape | JoinRefusal {
  const ra = landRectangle(da);
  const rb = landRectangle(db);
  const f = frameBetween(ra, rb);
  // Au plus près que la grille le permet : l'écart de règle, et moins d'un pas de plus.
  if (!f || f.gap < GAP_BETWEEN_PLACES || f.gap >= GAP_BETWEEN_PLACES + STEP) return 'loin';
  // Chaque colonne en travers : de la dernière case de terre du premier lieu à la première du second.
  const colonnes: ({ t: number; debut: number; fin: number; ha: number; hb: number } | null)[] = [];
  for (let t = f.lo; t < f.hi; t++) {
    let ua: number | null = null;
    for (let u = -1; u >= -1 - JOIN_FILL; u--) {
      const p = f.at(u, t);
      if (isLandInWorld(da, p.x, p.y)) {
        ua = u;
        break;
      }
    }
    let ub: number | null = null;
    for (let u = f.gap; u <= f.gap + JOIN_FILL; u++) {
      const p = f.at(u, t);
      if (isLandInWorld(db, p.x, p.y)) {
        ub = u;
        break;
      }
    }
    if (ua === null || ub === null) {
      colonnes.push(null);
      continue;
    }
    const pa = f.at(ua, t);
    const pb = f.at(ub, t);
    colonnes.push({ t, debut: ua + 1, fin: ub - 1, ha: heightAt(da, pa.x, pa.y), hb: heightAt(db, pb.x, pb.y) });
  }
  // La plus longue suite de colonnes qui touchent les deux côtes : sur toute la largeur du côté commun qu'elles tiennent.
  let best: { i: number; n: number } = { i: 0, n: 0 };
  for (let i = 0; i < colonnes.length; ) {
    if (!colonnes[i]) {
      i++;
      continue;
    }
    let n = 0;
    while (colonnes[i + n]) n++;
    if (n > best.n) best = { i, n };
    i += n;
  }
  if (best.n < JOIN_MIN_WIDTH) return 'etroit';
  const tenues = colonnes.slice(best.i, best.i + best.n) as NonNullable<(typeof colonnes)[number]>[];
  const ha = Math.max(...tenues.map((c) => c.ha));
  const hb = Math.max(...tenues.map((c) => c.hb));
  const steps = Math.abs(hb - ha);
  if (steps > JOIN_MAX_STEPS) return 'marches';
  const lo = tenues[0].t;
  const hi = tenues[tenues.length - 1].t + 1;
  // La hauteur le long : celle de la côte du premier, puis une marche par cran, au milieu, jusqu'à celle du second.
  const k = (u: number) => (u < 0 ? ha : u >= f.gap ? hb : ha + Math.round(((hb - ha) * (u + 0.5)) / f.gap));
  const alt = da.altitude;
  const cells: JoinCell[] = [];
  for (const c of tenues)
    for (let u = c.debut; u <= c.fin; u++) {
      const p = f.at(u, c.t);
      cells.push({ u, j: f.j(c.t, lo, hi), k: k(u), x: p.x, y: p.y, z: alt + k(u), half: u < f.gap / 2 ? 'a' : 'b' });
    }
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const zone = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 };
  // Le milieu : la colonne du milieu, de la terre du premier lieu à celle du second.
  const milieu = tenues[Math.floor(tenues.length / 2)];
  const deck: JoinShape['deck'] = [];
  for (let u = milieu.debut - 1; u <= milieu.fin + 1; u++) {
    const p = f.at(u, milieu.t);
    deck.push({ x: p.x, y: p.y, z: alt + k(u) + 1 });
  }
  return { cells, zone, deck, steps };
}

/** La forme de la construction qui réunirait deux lieux posés, ou `null`. */
export function joinShape(da: IslandDef, db: IslandDef): JoinShape | null {
  const s = joinShapeOrWhy(da, db);
  return typeof s === 'string' ? null : s;
}

// ---------- Le plan de la construction ----------

/** La construction qui réunit, comme un plan : ses cases (u, j, k), chacune payée par le bloc d'un des deux lieux. */
export interface JoinDef extends PlanDef {
  zone: 'join';
  pair: [BiomeId, BiomeId];
  archipelago: ArchipelagoId;
}

/** Le plan de la construction qui réunit deux lieux, de sa forme. */
export function joinPlan(a: BiomeId, b: BiomeId, shape: JoinShape): JoinDef {
  const bloc = (id: BiomeId): BlockId => getBiome(id)!.block;
  const cells: PlanCell[] = shape.cells.map((c) => ({ x: c.u, y: c.j, z: c.k, block: bloc(c.half === 'a' ? a : b) }));
  return {
    id: joinId(a, b),
    biome: a,
    zone: 'join',
    pair: [a, b],
    archipelago: archipelagoOfIsland(a),
    name: 'La réunion',
    origin: { x: 0, y: 0 },
    cells,
    reward: { xp: JOIN_XP, chest: {} },
    done: 'Les deux lieux sont réunis.',
  };
}

// ---------- Dans la disposition de la partie ----------

/** Deux lieux réunis dans la disposition de la partie, la forme de leur construction et son plan. */
export interface AppliedJoin {
  pair: readonly [BiomeId, BiomeId];
  shape: JoinShape;
  plan: JoinDef;
}

const appliedCache = layoutCache<ArchipelagoId, readonly AppliedJoin[]>();

/**
 * Les lieux réunis d'une région dans la disposition de la partie (./appliedLayout.ts), la forme de leur construction et
 * son plan (mémorisés tant que la disposition ne change pas). Une paire qui ne se tiendrait plus côte à côte n'y est pas.
 */
export function appliedJoins(a: ArchipelagoId): readonly AppliedJoin[] {
  let out = appliedCache.get(a);
  if (!out) {
    const liste: AppliedJoin[] = [];
    for (const pair of chosenJoins()) {
      if (archipelagoOfIsland(pair[0]) !== a) continue;
      const shape = joinShape(islandDef(pair[0]), islandDef(pair[1]));
      if (shape) liste.push({ pair, shape, plan: joinPlan(pair[0], pair[1], shape) });
    }
    appliedCache.set(a, (out = liste));
  }
  return out;
}

/** La construction qui réunit, par son identifiant, dans la disposition de la partie, ou `undefined`. */
export function getJoin(id: string): AppliedJoin | undefined {
  const pair = pairOfJoinId(id);
  if (!pair) return undefined;
  return appliedJoins(archipelagoOfIsland(pair[0])).find((j) => j.plan.id === id);
}

/** La construction qui réunit un lieu, dans la disposition de la partie, ou `undefined`. */
export function joinOf(id: BiomeId): AppliedJoin | undefined {
  return appliedJoins(archipelagoOfIsland(id)).find((j) => j.pair.includes(id));
}

/** Un plan vide, quand aucune construction qui réunit n'est ouverte (le chantier de la page reste monté). */
export const SANS_REUNION: JoinDef = {
  id: 'join.none',
  biome: 'french-6e-phonology',
  zone: 'join',
  pair: ['french-6e-phonology', 'french-6e-phonology'],
  archipelago: '6e',
  name: 'La réunion',
  origin: { x: 0, y: 0 },
  cells: [],
  reward: { xp: 0, chest: {} },
  done: '',
};
