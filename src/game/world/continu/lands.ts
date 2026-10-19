// Les terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) :
// au 6e, quatre bras de mer coupent l'anneau en cinq terres ; dans une terre, on va partout, sans aucun verrou entre les
// lieux ; chaque bras de mer n'a qu'un passage, le pont de sa terre, à rebâtir. On relie une terre, plus un lieu : on paie une
// fois son prix (4 ressources par lieu, `LINK_PRICE` du 6e), et chacun de ses lieux reçoit sa liaison de la grille, même
// identifiant (world/arrange.ts, `payLand`, `ensureLands`). L'ordre : le Couchant et le Levant dès le départ, le Large
// après le Couchant, les Crêtes après le Levant. Les noms des terres sont ceux que propose le consultant d'Archipéo, à
// confirmer par le mainteneur. Ce que le monde montre des terres se lit dans la grille, par la vue
// (../../three/archipeo/landLinks.ts, `openWorldLands`) : rien de neuf dans la sauvegarde. Les terres d'un niveau sont
// dans son plan (./levelPlan.ts, GD-22) ; celles du 6e, dans ./plan6e.ts (`LANDS_6E`). Code pur.
import { ALL_LANDS, type LevelPlan, type PlaceId } from './levelPlan';

/** Une terre : la Pointe du Phare (le départ, avec l'Escale), puis les quatre qu'on relie. */
export type LandId = 'pointe' | 'couchant' | 'large' | 'levant' | 'cretes';

/** Une terre qu'on relie : toutes, sauf celle du départ. */
export type LinkedLand = Exclude<LandId, 'pointe'>;

export interface Land {
  id: LandId;
  /** Son nom entier, celui de la fiche (« Le Couchant »). */
  name: string;
  /** Ses lieux, dans l'ordre du plan. */
  places: readonly PlaceId[];
  /** La terre à relier d'abord (rien pour le départ). */
  after: LandId | null;
  /** Le nom de son pont, pour les phrases (« Le pont du Couchant ») ; rien pour le départ. */
  bridgeName: string | null;
}

/** Une terre par son identifiant, quel que soit son niveau. */
export const landById = (id: LandId): Land => ALL_LANDS.find((l) => l.id === id)!;

/** La terre d'un lieu (un test vérifie que chaque lieu est dans une terre et une seule). */
export const landOf = (place: PlaceId): LandId => ALL_LANDS.find((l) => l.places.includes(place))!.id;

/** Une terre qu'on relie (toutes, sauf celle du départ, qui n'a pas de terre d'avant). */
export const isLinkedLand = (id: LandId): id is LinkedLand => landById(id).after !== null;

/** La terre de départ d'un plan : ouverte dès le début, avec le lieu de départ (au 6e, la Pointe du Phare et l'Escale). */
export const startLandOf = (plan: LevelPlan): LandId => plan.lands.find((l) => l.after === null)!.id;

const linkedOf = new WeakMap<LevelPlan, readonly LinkedLand[]>();

/** Les terres qu'on relie d'un plan, dans l'ordre. */
export function linkedLands(plan: LevelPlan): readonly LinkedLand[] {
  let out = linkedOf.get(plan);
  if (!out) linkedOf.set(plan, (out = plan.lands.map((l) => l.id).filter(isLinkedLand)));
  return out;
}

/** Le prix d'un lieu : celui d'une liaison du 6e dans la grille (`LINK_PRICE`, un test le vérifie). */
export const PRICE_PER_PLACE = 4;

/** Le prix d'une terre : 4 ressources par lieu, payé une fois. */
export const landPrice = (land: LandId): number => PRICE_PER_PLACE * landById(land).places.length;

/** La liaison du réseau des chemins qui passe le pont d'une terre (son rang dans les liaisons du plan). */
export function bridgeEdge(plan: LevelPlan, land: LinkedLand): number {
  const [a, b] = plan.bridges[land]!;
  return plan.pathEdges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));
}

const nodeLandsOf = new WeakMap<LevelPlan, ReadonlyMap<string, LandId>>();

/**
 * La terre de chaque nœud du réseau d'un plan : ses morceaux sans les ponts (un test vérifie qu'ils font exactement les
 * terres du plan), chacun nommé par les lieux qu'il porte.
 */
export function nodeLands(plan: LevelPlan): ReadonlyMap<string, LandId> {
  const known = nodeLandsOf.get(plan);
  if (known) return known;
  const start = startLandOf(plan);
  const bridges = new Set(linkedLands(plan).map((l) => bridgeEdge(plan, l)));
  const parent = new Map<string, string>();
  const root = (n: string): string => {
    let r = n;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(n, r);
    return r;
  };
  for (const [a, b] of plan.pathEdges) for (const n of [a, b]) if (!parent.has(n)) parent.set(n, n);
  plan.pathEdges.forEach(([a, b], i) => {
    if (!bridges.has(i)) parent.set(root(a), root(b));
  });
  const landOfRoot = new Map<string, LandId>();
  for (const p of plan.places) landOfRoot.set(root(p.door), landOf(p.id));
  const out = new Map([...parent.keys()].map((n) => [n, landOfRoot.get(root(n)) ?? start]));
  nodeLandsOf.set(plan, out);
  return out;
}

/** Les lieux des terres `lands`, dans l'ordre du plan. */
export const placesOfLands = (plan: LevelPlan, lands: readonly LandId[]): PlaceId[] => plan.places.map((p) => p.id).filter((id) => lands.includes(landOf(id)));

/**
 * Les terres ouvertes d'un plan, `open` disant si un lieu l'est (relié dans la grille, ou déjà joué) : le départ, chaque
 * terre dont un lieu est ouvert, et celles qu'il faut traverser pour l'atteindre (une terre ouverte ouvre la sienne
 * d'avant).
 */
export function openLands(plan: LevelPlan, open: (place: PlaceId) => boolean): Set<LandId> {
  const out = new Set<LandId>([startLandOf(plan)]);
  for (const land of plan.lands) if (land.places.some(open)) for (let l: LandId | null = land.id; l; l = landById(l).after) out.add(l);
  return out;
}

/**
 * La terre à relier d'abord pour atteindre `land` (fermée) : la plus proche du départ, parmi elle et celles d'avant,
 * dont la terre d'avant est ouverte ; c'est son pont qui arrête Kéo.
 */
export function firstClosed(land: LinkedLand, closed: readonly LinkedLand[]): LinkedLand {
  let first = land;
  for (let l: LandId | null = land; l && isLinkedLand(l); l = landById(l).after) if (closed.includes(l)) first = l;
  return first;
}

/**
 * Les terres que relier `land` rend reliables : celles qui l'attendaient (la terre d'après), encore fermées (« Le pont des
 * Crêtes peut être rebâti. »).
 */
export const landsAfter = (land: LinkedLand, closed: readonly LinkedLand[]): LinkedLand[] =>
  ALL_LANDS.map((l) => l.id).filter((l): l is LinkedLand => isLinkedLand(l) && l !== land && landById(l).after === land && closed.includes(l));

/** Le point du pont d'une terre sur la Carte, parmi ceux des lieux (`pont-couchant`). */
export type BridgeSpot = `pont-${LinkedLand}`;

/** Le point du pont d'une terre sur la Carte. */
export const bridgeSpot = (land: LinkedLand): BridgeSpot => `pont-${land}`;

/** Ce point de la Carte est-il celui d'un pont ? */
export const isBridgeSpot = (id: string): id is BridgeSpot => id.startsWith('pont-');

/** La terre du pont d'un point de la Carte. */
export const landOfBridgeSpot = (id: BridgeSpot): LinkedLand => id.slice('pont-'.length) as LinkedLand;
