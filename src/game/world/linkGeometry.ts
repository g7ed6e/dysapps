// La géométrie des liaisons que pose l'élève (GD-9) : leur tracé dans la disposition du moment, posées dans l'ordre
// de la sauvegarde, et ce qu'en savent les règles (`LinkGeometry`, ./archipelago.ts) : la nature d'une liaison (un pont
// jusqu'à 36 cases, un bac au-delà, un pont dans le ciel) et si une liaison de plus tiendrait. Code pur, sans Three.js ;
// chargé au démarrage de l'application (src/main.tsx) et des tests (src/setupTests.ts), qui donnent ainsi la grille
// aux règles.
import type { BiomeId } from '../biomes';
import { type BridgeDef, type BridgeKind, BRIDGES, bridgesOf, getBridge, otherEnd, provideLinkGeometry, SHORT_LINK } from './archipelago';
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, mapOf } from './map';
import { layoutCache, layoutChanged } from './placement';
import { linkBetweenJoined, type LinkLandings, LONG_LENGTH, type LinkRoute, RegionRouter } from './routing';
import { ecueilsDe } from './terrain/sea';

// ---------- Ce que la disposition dit des liaisons ----------

/** Les liaisons à reposer (GD-9) : construites, gardées au stock, ni tracées ni dessinées tant qu'on ne les repose pas. */
let toRelink: ReadonlySet<string> = new Set();
/** Les arrivées choisies de chaque liaison (GD-9), par identifiant de liaison. */
let landings: ReadonlyMap<string, LinkLandings> = new Map();

/**
 * Ce que la disposition de la partie dit des liaisons (./appliedLayout.ts) : celles à reposer et les arrivées choisies.
 * Ne change rien, et garde les caches, si c'est le même.
 */
export function setLinkLayout(relink: ReadonlySet<string>, chosen: ReadonlyMap<string, LinkLandings>): void {
  const cle = (r: ReadonlySet<string>, l: ReadonlyMap<string, LinkLandings>) => JSON.stringify([[...r].sort(), [...l].sort(([p], [q]) => p.localeCompare(q))]);
  if (cle(relink, chosen) === cle(toRelink, landings)) return;
  toRelink = new Set(relink);
  landings = new Map(chosen);
  layoutChanged();
}

/** Les arrivées choisies d'une liaison dans la disposition de la partie. */
function chosenLandings(id: string): LinkLandings | undefined {
  return landings.get(id);
}


/** Le tracé d'une liaison seule dans la disposition (sans les autres liaisons) : ce qui fait sa nature. */
const soleRoutes = layoutCache<string, LinkRoute | null>();

/** Le traceur d'une région, sans aucune liaison : la terre, les îlots, les quais et les écueils. */
function emptyRouter(a: ArchipelagoId): RegionRouter {
  return new RegionRouter(a, { lieux: mapOf(a), ecueils: ecueilsDe(a), arriveesDeLaLiaison: chosenLandings });
}

const emptyRouters = layoutCache<ArchipelagoId, RegionRouter>();

/**
 * Le tracé d'une liaison seule dans la disposition (sans les autres liaisons). C'est aussi le tracé de repli d'une
 * liaison posée que le traceur ne refait pas (une sauvegarde d'avant GD-9, posée quand les lieux n'étaient pas à la
 * même place) : il évite la terre, les îlots des Gardiens et les écueils ; faute de quoi la liaison garde son tracé
 * d'origine (`traceDOrigine`, ./terrain/links.ts).
 */
export function soleRoute(b: BridgeDef): LinkRoute | null {
  let t = soleRoutes.get(b.id);
  if (t === undefined) {
    const a = archipelagoOfIsland(b.from);
    let vide = emptyRouters.get(a);
    if (!vide) emptyRouters.set(a, (vide = emptyRouter(a)));
    t = vide.essayer(b, LONG_LENGTH);
    soleRoutes.set(b.id, t);
  }
  return t;
}

/**
 * La nature d'une liaison dans la disposition, les liaisons `built` posées (`linkKind`, ./archipelago.ts) : un sentier
 * entre deux lieux réunis ; sinon, selon son tracé (le sien si elle est posée, celui qu'elle prendrait sinon, ou à
 * défaut celui qu'elle aurait seule), un pont jusqu'à `SHORT_LINK` cases, un bac jusqu'à 96 (un pont dans le ciel, où
 * un bac aurait ses poteaux dans le vide) ; `null` si elle ne se trace pas.
 */
function kindFromRoute(b: BridgeDef, built: readonly string[]): BridgeKind | null {
  if (linkBetweenJoined(b)) return 'sentier';
  const t = linkRoute(b, built) ?? soleRoute(b);
  if (!t) return null;
  return t.cases.length <= SHORT_LINK || DANS_LE_CIEL[archipelagoOfIsland(b.from)] ? 'pont' : 'bac';
}

/**
 * Les voisins d'un lieu dans la disposition : ceux qu'un pont relierait (une liaison qui, seule, tient en `SHORT_LINK`
 * cases), et celui avec qui il est réuni. La vue d'un lieu les cadre avec lui (`viewZone`).
 */
export function neighboursOf(id: BiomeId): BiomeId[] {
  return bridgesOf(id)
    .filter((b) => {
      if (linkBetweenJoined(b)) return true;
      const t = soleRoute(b);
      return t !== null && t.cases.length <= SHORT_LINK;
    })
    .map((b) => otherEnd(b, id));
}

/**
 * Les liaisons posées d'une région, dans l'ordre : le pont déjà construit au départ, puis celles de la sauvegarde ; sans
 * celles à reposer (GD-9), qui attendent au stock.
 */
function placedOf(a: ArchipelagoId, built: readonly string[]): BridgeDef[] {
  const out = BRIDGES.filter((b) => b.cost === 0 && archipelagoOfIsland(b.from) === a && !toRelink.has(b.id));
  for (const id of built) {
    const b = getBridge(id);
    if (b && b.cost !== 0 && archipelagoOfIsland(b.from) === a && !toRelink.has(b.id) && !out.includes(b)) out.push(b);
  }
  return out;
}

/** Les liaisons posées d'une région tracées, et le traceur qui dit si une de plus tiendrait. */
interface LinksState {
  traces: Map<string, LinkRoute | null>;
  traceur: RegionRouter;
  essais: Map<string, LinkRoute | null>;
}

const states = layoutCache<string, LinksState>();

/** Le tracé des liaisons posées d'une région (mémorisé par disposition et par liste de liaisons posées). */
function stateOf(a: ArchipelagoId, built: readonly string[]): LinksState {
  const posees = placedOf(a, built);
  const cle = `${a}|${posees.map((b) => b.id).join(',')}`;
  let e = states.get(cle);
  if (!e) {
    // Peu de listes différentes dans une partie ; on oublie les anciennes au-delà de quelques-unes.
    if (states.size > 32) states.clear();
    const traceur = emptyRouter(a);
    const traces = new Map<string, LinkRoute | null>();
    for (const b of posees) if (!linkBetweenJoined(b)) traces.set(b.id, traceur.poser(b, LONG_LENGTH));
    e = { traces, traceur, essais: new Map() };
    states.set(cle, e);
  }
  return e;
}

/**
 * Le tracé d'une liaison, celles de `built` posées : le sien si elle est posée (`null` si le traceur ne la refait pas :
 * elle garde alors son tracé d'origine, `bridgePath`), sinon celui qu'elle prendrait, posée après elles (`null` si elle
 * ne tiendrait pas). Rien pour une liaison entre deux lieux réunis (un sentier sur leur isthme).
 */
export function linkRoute(b: BridgeDef, built: readonly string[]): LinkRoute | null {
  if (linkBetweenJoined(b)) return null;
  const e = stateOf(archipelagoOfIsland(b.from), built);
  if (e.traces.has(b.id)) return e.traces.get(b.id)!;
  let t = e.essais.get(b.id);
  if (t === undefined) {
    t = e.traceur.essayer(b, LONG_LENGTH);
    e.essais.set(b.id, t);
  }
  return t;
}

/** Une liaison est-elle posée (le pont du départ, ou dans `built`) ? */
function isPlaced(b: BridgeDef, built: readonly string[]): boolean {
  return b.cost === 0 || built.includes(b.id);
}

provideLinkGeometry({
  kind: kindFromRoute,
  length(b, built) {
    if (linkBetweenJoined(b)) return 0;
    const t = linkRoute(b, built);
    if (t) return t.cases.length;
    // Une liaison posée que le traceur ne refait pas garde son tracé d'origine : elle tient.
    return isPlaced(b, built) ? 0 : null;
  },
});

// ---------- Les liaisons posées d'une partie ----------

/** Les liaisons posées d'une région (`links` : celles de la sauvegarde), dans l'ordre : le pont du départ, puis les autres. */
export function placedLinksOf(a: ArchipelagoId, links: readonly string[]): BridgeDef[] {
  return placedOf(a, links);
}

/** Les liaisons posées d'un lieu (`links` : celles de la sauvegarde). */
export function placedLinksOfPlace(id: BiomeId, links: readonly string[]): BridgeDef[] {
  return placedOf(archipelagoOfIsland(id), links).filter((b) => b.from === id || b.to === id);
}
