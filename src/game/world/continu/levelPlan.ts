// Le plan par niveau du monde continu (GD-22, lot 1, choix du mainteneur du 18 octobre 2026) : le monde ouvert reçoit le
// plan de son niveau, choisi par `planFor(level)`, au lieu de lire celui du 6e en dur. Un plan rassemble ce que la
// logique commune lit d'un niveau : ses lieux, ses terres, les liaisons du réseau des chemins et le pont de chaque terre,
// sa côte et son large (la Carte), l'étendue de son terrain. Un seul plan est enregistré : celui du 6e (./plan6e.ts),
// sans rien changer à ce qu'il contient. Le plan d'un autre niveau s'ajoute ici, avec son niveau dans `OpenWorldLevel`.
// Les identifiants des lieux et des terres sont uniques d'un niveau à l'autre : un lieu se retrouve par son seul
// identifiant (`placeById`), sans dire son niveau. Code pur.
import type { Vec2 } from './geometry';
import type { Land, LinkedLand } from './lands';
import { COAST, LANDS_6E, OFFSHORE, PATH_EDGES, PLACES, STRAITS, TERRAIN, type OpenPlace, type PlaceId } from './plan6e';

export type { OpenPlace, PlaceId } from './plan6e';

/** Un niveau qui a son monde ouvert (l'archipel de la grille du même nom). */
export type OpenWorldLevel = '6e';

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
};

/** Les plans enregistrés, par niveau. */
const PLANS: Readonly<Record<OpenWorldLevel, LevelPlan>> = { '6e': PLAN_6E };

/** Les niveaux qui ont leur monde ouvert (la fabrique de disposition tient la même liste, un test le vérifie). */
export const OPEN_WORLD_LEVELS = Object.keys(PLANS) as readonly OpenWorldLevel[];

/** Le plan d'un niveau. */
export const planFor = (level: OpenWorldLevel): LevelPlan => PLANS[level];

/** Les lieux de tous les plans. */
const ALL_PLACES: readonly OpenPlace[] = Object.values(PLANS).flatMap((p) => p.places);

/** Les terres de tous les plans. */
export const ALL_LANDS: readonly Land[] = Object.values(PLANS).flatMap((p) => p.lands);

/** Un lieu par son identifiant, quel que soit son niveau. */
export const placeById = (id: PlaceId): OpenPlace => ALL_PLACES.find((p) => p.id === id)!;

/** Le lieu qui reprend les missions d'une île, s'il y en a un, quel que soit son niveau. */
export const placeOfIsland = (island: string): OpenPlace | undefined => ALL_PLACES.find((p) => p.island === island);

/** Le niveau d'un lieu. */
export const levelOfPlace = (id: PlaceId): OpenWorldLevel => Object.values(PLANS).find((p) => p.places.some((q) => q.id === id))!.level;
