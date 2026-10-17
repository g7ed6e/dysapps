// Les terres du monde continu (GD-20, point 3, « vraies terres, vrais ponts », choix du mainteneur du 17 octobre 2026) :
// quatre bras de mer coupent l'anneau en cinq terres ; dans une terre, on va partout, sans aucun verrou entre les lieux ;
// chaque bras de mer n'a qu'un passage, le pont de sa terre, à rebâtir. On relie une terre, plus un lieu : on paie une
// fois son prix (4 ressources par lieu, `LINK_PRICE` du 6e), et chacun de ses lieux reçoit sa liaison de la grille, même
// identifiant (world/arrange.ts, `payLand`, `ensureLands`). L'ordre : le Couchant et le Levant dès le départ, le Large
// après le Couchant, les Crêtes après le Levant. Les noms des terres sont ceux que propose le consultant d'Archipéo, à
// confirmer par le mainteneur. Ce que le monde montre des terres se lit dans la grille, par la vue
// (../../three/archipeo/landLinks.ts, `openWorldLands`) : rien de neuf dans la sauvegarde. Code pur.
import { PATH_EDGES, PLACES, STRAITS, type PlaceId } from './plan6e';

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

/** La terre de départ : ouverte dès le début, avec l'Escale ; ses quatre lieux se touchent, sans bras de mer. */
export const START_LAND = 'pointe' as const satisfies LandId;

/** Les cinq terres, dans l'ordre où l'on peut les relier (chacune après la sienne). */
export const LANDS: readonly Land[] = [
  { id: 'pointe', name: 'La Pointe du Phare', places: ['phare', 'quais', 'shipyard', 'commons'], after: null, bridgeName: null },
  { id: 'couchant', name: 'Le Couchant', places: ['mangrove', 'ruins', 'observatory'], after: 'pointe', bridgeName: 'Le pont du Couchant' },
  { id: 'large', name: 'Le Large', places: ['beacons', 'ferry'], after: 'couchant', bridgeName: 'Le pont du Large' },
  { id: 'levant', name: 'Le Levant', places: ['ecluses', 'saltworks', 'engine'], after: 'pointe', bridgeName: 'Le pont du Levant' },
  { id: 'cretes', name: 'Les Crêtes', places: ['filets', 'lookout', 'archives', 'printworks'], after: 'levant', bridgeName: 'Le pont des Crêtes' },
];

/** Les terres qu'on relie, dans l'ordre. */
export const LINKED_LANDS: readonly LinkedLand[] = LANDS.map((l) => l.id).filter((id): id is LinkedLand => id !== START_LAND);

/** Une terre par son identifiant. */
export const landById = (id: LandId): Land => LANDS.find((l) => l.id === id)!;

/** La terre d'un lieu (un test vérifie que chaque lieu est dans une terre et une seule). */
export const landOf = (place: PlaceId): LandId => LANDS.find((l) => l.places.includes(place))!.id;

/** Le prix d'un lieu : celui d'une liaison du 6e dans la grille (`LINK_PRICE`, un test le vérifie). */
export const PRICE_PER_PLACE = 4;

/** Le prix d'une terre : 4 ressources par lieu, payé une fois. */
export const landPrice = (land: LandId): number => PRICE_PER_PLACE * landById(land).places.length;

/** La liaison du réseau des chemins qui passe le pont d'une terre (son rang dans `PATH_EDGES`). */
export function bridgeEdge(land: LinkedLand): number {
  const [a, b] = STRAITS[land].bridge;
  return PATH_EDGES.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));
}

/**
 * La terre de chaque nœud du réseau : ses morceaux sans les quatre ponts (un test vérifie qu'ils font exactement les
 * cinq terres), chacun nommé par les lieux qu'il porte.
 */
export const NODE_LANDS: ReadonlyMap<string, LandId> = (() => {
  const bridges = new Set(LINKED_LANDS.map(bridgeEdge));
  const parent = new Map<string, string>();
  const root = (n: string): string => {
    let r = n;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(n, r);
    return r;
  };
  for (const [a, b] of PATH_EDGES) for (const n of [a, b]) if (!parent.has(n)) parent.set(n, n);
  PATH_EDGES.forEach(([a, b], i) => {
    if (!bridges.has(i)) parent.set(root(a), root(b));
  });
  const landOfRoot = new Map<string, LandId>();
  for (const p of PLACES) landOfRoot.set(root(p.door), landOf(p.id));
  return new Map([...parent.keys()].map((n) => [n, landOfRoot.get(root(n)) ?? START_LAND]));
})();

/** Les lieux des terres `lands`, dans l'ordre du plan. */
export const placesOfLands = (lands: readonly LandId[]): PlaceId[] => PLACES.map((p) => p.id).filter((id) => lands.includes(landOf(id)));

/**
 * Les terres ouvertes, `open` disant si un lieu l'est (relié dans la grille, ou déjà joué) : le départ, chaque terre dont
 * un lieu est ouvert, et celles qu'il faut traverser pour l'atteindre (une terre ouverte ouvre la sienne d'avant).
 */
export function openLands(open: (place: PlaceId) => boolean): Set<LandId> {
  const out = new Set<LandId>([START_LAND]);
  for (const land of LANDS) if (land.places.some(open)) for (let l: LandId | null = land.id; l; l = landById(l).after) out.add(l);
  return out;
}

/**
 * La terre à relier d'abord pour atteindre `land` (fermée) : la plus proche du départ, parmi elle et celles d'avant,
 * dont la terre d'avant est ouverte ; c'est son pont qui arrête Kéo.
 */
export function firstClosed(land: LinkedLand, closed: readonly LinkedLand[]): LinkedLand {
  let first = land;
  for (let l: LandId | null = land; l && l !== START_LAND; l = landById(l).after) if (closed.includes(l)) first = l;
  return first;
}

/**
 * Les terres que relier `land` rend reliables : celles qui l'attendaient (la terre d'après), encore fermées (« Le pont des
 * Crêtes peut être rebâti. »).
 */
export const landsAfter = (land: LinkedLand, closed: readonly LinkedLand[]): LinkedLand[] => LINKED_LANDS.filter((l) => l !== land && landById(l).after === land && closed.includes(l));

/** Le point du pont d'une terre sur la Carte, parmi ceux des lieux (`pont-couchant`). */
export type BridgeSpot = `pont-${LinkedLand}`;

/** Le point du pont d'une terre sur la Carte. */
export const bridgeSpot = (land: LinkedLand): BridgeSpot => `pont-${land}`;

/** Ce point de la Carte est-il celui d'un pont ? */
export const isBridgeSpot = (id: string): id is BridgeSpot => id.startsWith('pont-');

/** La terre du pont d'un point de la Carte. */
export const landOfBridgeSpot = (id: BridgeSpot): LinkedLand => id.slice('pont-'.length) as LinkedLand;
