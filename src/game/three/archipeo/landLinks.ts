// Les terres du monde continu lues dans la grille (GD-20, point 3, « vraies terres, vrais ponts ») : la table des terres
// est pure (../../world/continu/lands.ts) et ne lit pas la grille ; la grille ne lit pas le monde continu
// (../../world/arrange.ts, `payLand`, `ensureLands`, reçoivent une terre en îles, `GridLand`). Ce fichier de la vue fait
// le lien : chaque terre en îles, et ce que le monde montre des terres, tiré des liaisons posées de la grille et des
// missions jouées. Rien de neuf dans la sauvegarde. Code pur.
import type { BiomeId } from '../../biomes';
import { getBridge, reachableIslands } from '../../world/archipelago';
import type { GridLand } from '../../world/arrange';
import { isLinkedLand, landById, landOf, landPrice, linkedLands, openLands, type LandId, type LinkedLand } from '../../world/continu/lands';
import { ALL_LANDS, placeById, placeOfIsland, type LevelPlan, type PlaceId } from '../../world/continu/levelPlan';
import { playedPlaces, type MissionMark } from '../../world/continu/mission';

/** Les îles des lieux d'une terre. */
const islandsOf = (land: LandId): BiomeId[] => landById(land).places.map((p) => placeById(p).island as BiomeId);

/** Chaque terre en îles, de tous les plans, pour la grille : la terre d'avant, le prix (rien pour la terre de départ). */
const GRID_LANDS: ReadonlyMap<LandId, GridLand> = (() => {
  const out = new Map<LandId, GridLand>();
  for (const land of ALL_LANDS) out.set(land.id, { islands: islandsOf(land.id), after: land.after ? out.get(land.after)! : null, price: land.after ? landPrice(land.id) : 0 });
  return out;
})();

/** Une terre, vue de la grille. */
export const gridLand = (land: LandId): GridLand => GRID_LANDS.get(land)!;

/** Les terres d'un plan, vues de la grille, dans l'ordre (chacune après la sienne). */
export const gridLands = (plan: LevelPlan): GridLand[] => plan.lands.map((l) => gridLand(l.id));

/** Les îles des lieux où l'élève a déjà joué (`ensureLands` les ouvre, et leur terre avec eux). */
export const playedIslands = (plan: LevelPlan, bornes: readonly MissionMark[]): BiomeId[] => playedPlaces(plan, bornes).map((id) => placeById(id).island as BiomeId);

/** Ce que le monde continu montre des terres. */
export interface OpenWorldLands {
  /** Les terres fermées, dans l'ordre. */
  closed: LinkedLand[];
  /** Les terres fermées pas encore reliables (leur terre d'avant est fermée) : leur fiche mène à elle. */
  waiting: LinkedLand[];
  /** La terre du pont suggéré (la prochaine destination ouvre l'un de ses lieux), jamais une terre pas encore reliable. */
  suggested: LinkedLand | null;
}

/**
 * Les terres du monde continu d'un plan : `links`, les liaisons posées de la grille ; `bornes`, les missions du monde ouvert (un
 * lieu où l'élève a déjà joué est ouvert) ; `ouvrage`, la liaison que propose la prochaine destination, s'il y en a une.
 */
export function openWorldLands(plan: LevelPlan, links: readonly string[], bornes: readonly MissionMark[], ouvrage?: string): OpenWorldLands {
  const islands: ReadonlySet<string> = reachableIslands([...links]);
  const played = new Set(playedPlaces(plan, bornes));
  const open = openLands(plan, (id: PlaceId) => islands.has(placeById(id).island) || played.has(id));
  const closed = linkedLands(plan).filter((l) => !open.has(l));
  const waiting = closed.filter((l) => !open.has(landById(l).after!));
  const bridge = ouvrage ? getBridge(ouvrage) : undefined;
  // La liaison suggérée ouvre un lieu : un seul de ses bouts est ouvert.
  const end = bridge && islands.has(bridge.from) !== islands.has(bridge.to) ? (islands.has(bridge.from) ? bridge.to : bridge.from) : undefined;
  const place = end ? placeOfIsland(end)?.id : undefined;
  const land = place ? landOf(place) : undefined;
  const suggested = land && isLinkedLand(land) && closed.includes(land) && !waiting.includes(land) ? land : null;
  return { closed, waiting, suggested };
}
