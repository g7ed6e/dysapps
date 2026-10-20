// Le plan par niveau du monde continu (GD-22, lot 1, choix du mainteneur du 18 octobre 2026) : le monde ouvert reçoit le
// plan de son niveau, choisi par `planFor(level)`, au lieu de lire celui du 6e en dur. Un plan rassemble ce que la
// logique commune lit d'un niveau : ses lieux, ses terres, les liaisons du réseau des chemins et le pont de chaque terre,
// sa côte et son large (la Carte), l'étendue de son terrain. Deux plans sont enregistrés : celui du 6e (./plan6e.ts),
// sans rien changer à ce qu'il contient, et celui du 5e (./plan5e.ts, GD-22, lot 2). Le plan d'un autre niveau s'ajoute
// ici, avec son niveau dans `OpenWorldLevel`.
// Les identifiants des lieux et des terres sont uniques d'un niveau à l'autre : un lieu se retrouve par son seul
// identifiant (`placeById`), sans dire son niveau. Code pur.
import type { Vec2 } from './geometry';
import type { Land, LinkedLand } from './lands';
import { COAST, LANDS_6E, OFFSHORE, PATH_EDGES, PLACES, STRAITS, TERRAIN, type OpenPlace as OpenPlaceOf, type PlaceId as PlaceId6e } from './plan6e';
import { COAST_5E, LANDS_5E, LINKS_5E, PATH_EDGES_5E, PLACES_5E, TERRAIN_5E, UNPRICED_PLACES_5E, UPPER_PLACES_5E, isBuiltPlace5e, type BuiltPlace5e, type PlaceId5e } from './plan5e';

/** Un lieu, de tout niveau (ses identifiants sont uniques d'un niveau à l'autre). */
export type PlaceId = PlaceId6e | PlaceId5e;

/** Un lieu d'un plan, de tout niveau. */
export type OpenPlace = OpenPlaceOf<PlaceId>;

/** Un niveau qui a son monde ouvert (l'archipel de la grille du même nom). */
export type OpenWorldLevel = '6e' | '5e';

/** L'étendue de la carte de hauteurs d'un niveau, le pas de sa grille et ses tuiles (./plan6e.ts, `TERRAIN`). */
interface TerrainGrid {
  readonly minX: number;
  readonly minZ: number;
  readonly step: number;
  readonly tileCells: number;
  readonly coarse: number;
  readonly tilesX: number;
  readonly tilesZ: number;
}

/** Le plan d'un niveau : ce que la logique commune du monde continu et sa vue lisent de lui. */
export interface LevelPlan {
  /** Son niveau : celui des îles, des modèles (`6e-habitant-…`), de Kéo et des histoires. */
  readonly level: OpenWorldLevel;
  /** Ses lieux, dans l'ordre du plan (celui de la prochaine mission et de la liste des lieux). */
  readonly places: readonly OpenPlace[];
  /** Ses terres : celle du départ (sans terre d'avant), puis celles qu'on relie, dans l'ordre où l'on peut les relier. */
  readonly lands: readonly Land[];
  /** Les liaisons du réseau des chemins, par les identifiants de leurs nœuds (la porte d'un lieu a celui du lieu). */
  readonly pathEdges: readonly (readonly [string, string])[];
  /** Le pont de chaque terre qu'on relie : la liaison du réseau qui passe son bras de mer (de la terre d'avant à elle). */
  readonly bridges: Readonly<Partial<Record<LinkedLand, readonly [string, string]>>>;
  /** Sa côte, et ce qui dépasse au large : la boîte de la Carte. */
  readonly coast: readonly Vec2[];
  readonly offshore: readonly Vec2[];
  /** L'étendue de son terrain. */
  readonly terrain: TerrainGrid;
  /** Le prix d'une terre, par lieu : celui d'une liaison de la grille du même niveau (`LINK_PRICE`, un test le vérifie). */
  readonly pricePerPlace: number;
  /** Les lieux qui ne comptent pas dans le prix de leur terre (au 5e, l’Oracle, en option). */
  readonly unpriced: readonly PlaceId[];
  /**
   * Les lieux du haut (GD-22 : un plateau bordé de falaises) : la Carte met un triangle « en haut » à côté de leur nom ;
   * aucun au 6e, qui est à plat.
   */
  readonly upper: readonly PlaceId[];
}

/** Le plan du 6e, tiré de ./plan6e.ts tel quel. */
const PLAN_6E: LevelPlan = {
  level: '6e',
  places: PLACES,
  lands: LANDS_6E,
  pathEdges: PATH_EDGES,
  bridges: { couchant: STRAITS.couchant.bridge, large: STRAITS.large.bridge, levant: STRAITS.levant.bridge, cretes: STRAITS.cretes.bridge },
  coast: COAST,
  offshore: OFFSHORE,
  terrain: TERRAIN,
  pricePerPlace: 4,
  unpriced: [],
  upper: [],
};

/** Le plan du 5e, tiré de ./plan5e.ts (GD-22, lot 2) : quatre terres, deux étages. */
const PLAN_5E: LevelPlan = {
  level: '5e',
  places: PLACES_5E,
  lands: LANDS_5E,
  pathEdges: PATH_EDGES_5E,
  bridges: { roselieres: LINKS_5E.roselieres.bridge, contreforts: LINKS_5E.contreforts.bridge, aiguilles: LINKS_5E.aiguilles.bridge },
  coast: COAST_5E,
  offshore: [],
  terrain: TERRAIN_5E,
  pricePerPlace: 5,
  unpriced: UNPRICED_PLACES_5E,
  upper: UPPER_PLACES_5E,
};

/** Les plans enregistrés, par niveau. */
const PLANS: Readonly<Record<OpenWorldLevel, LevelPlan>> = { '6e': PLAN_6E, '5e': PLAN_5E };

/** Les niveaux qui ont leur monde ouvert (la fabrique de disposition tient la même liste, un test le vérifie). */
export const OPEN_WORLD_LEVELS = Object.keys(PLANS) as readonly OpenWorldLevel[];

/** Le plan d'un niveau. */
export const planFor = (level: OpenWorldLevel): LevelPlan => PLANS[level];

/** Tous les plans enregistrés. */
export const ALL_PLANS: readonly LevelPlan[] = Object.values(PLANS);

/** Les lieux de tous les plans. */
const ALL_PLACES: readonly OpenPlace[] = ALL_PLANS.flatMap((p) => p.places);

/** Les terres de tous les plans. */
export const ALL_LANDS: readonly Land[] = ALL_PLANS.flatMap((p) => p.lands);

/** Un lieu par son identifiant, quel que soit son niveau. */
export const placeById = (id: PlaceId): OpenPlace => ALL_PLACES.find((p) => p.id === id)!;

/** Le lieu qui reprend les missions d'une île, s'il y en a un, quel que soit son niveau. */
export const placeOfIsland = (island: string): OpenPlace | undefined => ALL_PLACES.find((p) => p.island === island);

/**
 * Une valeur par lieu d'un plan (`of`), rangée par identifiant : la construction, les traces, l'état de chaque lieu. Les
 * lieux d'un autre niveau n'y sont pas, et ne s'y lisent jamais (la page ne connaît que ceux de son plan).
 */
export const placeRecord = <T>(plan: LevelPlan, of: (id: PlaceId) => T): Record<PlaceId, T> => Object.fromEntries(plan.places.map((p) => [p.id, of(p.id)])) as Record<PlaceId, T>;

/** Les lieux du 6e, pour `sixthPlace`. */
const SIXTH: ReadonlySet<string> = new Set(PLACES.map((p) => p.id));

/** Ce lieu est-il du 6e ? */
export const isSixthPlace = (id: PlaceId): id is PlaceId6e => SIXTH.has(id);

/**
 * Un lieu du 6e, pour ce qui n'existe encore qu'au 6e (scénettes, questions dans le lieu, aménagements, remises,
 * étapes de chantier) : le 5e n'en a pas encore (GD-22, lot 2 : ses lieux sont des ruines, la scène n'y entre pas) ; un
 * lieu du 5e qui arriverait ici est une erreur de la scène, dite tout de suite.
 */
export function sixthPlace(id: PlaceId): PlaceId6e {
  if (!SIXTH.has(id)) throw new Error(`Lieu sans scénette (GD-22, lot 2) : ${id}`);
  return id as PlaceId6e;
}

/**
 * Les lieux qui ont leur scénette (questions dans le lieu, étapes de chantier, traces) : ceux du 6e, et au 5e, lieu par
 * lieu (GD-22, « un lieu complet par lot ») : ceux déjà construits (./plan5e.ts, `BUILT_PLACES_5E`, la seule liste : la
 * Montée au lot 3, le Hameau au lot 5, les Radeaux au lot 6, la Croisée au lot 7, les Instants au lot 8). Les autres lieux
 * du 5e restent des ruines.
 */
export type ScenePlaceId = PlaceId6e | BuiltPlace5e;

/** Ce lieu a-t-il sa scénette ? */
export const hasScenette = (id: PlaceId): id is ScenePlaceId => SIXTH.has(id) || isBuiltPlace5e(id);

/**
 * Un lieu qui a sa scénette (scenette.ts, questionScene.ts, questions.ts) : un autre lieu du 5e qui arriverait ici est
 * une erreur de la scène, dite tout de suite.
 */
export function scenePlace(id: PlaceId): ScenePlaceId {
  if (!hasScenette(id)) throw new Error(`Lieu sans scénette (GD-22) : ${id}`);
  return id;
}

/** Le niveau d'un lieu. */
export const levelOfPlace = (id: PlaceId): OpenWorldLevel => Object.values(PLANS).find((p) => p.places.some((q) => q.id === id))!.level;
