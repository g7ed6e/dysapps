// Les terres du monde continu lues dans la grille (GD-20, point 3, « vraies terres, vrais ponts ») : la table des terres
// est pure (../../world/continu/lands.ts) et ne lit pas la grille ; la grille ne lit pas le monde continu
// (../../world/arrange.ts, `payLand`, `ensureLands`, reçoivent une terre en îles, `GridLand`). Ce fichier de la vue fait
// le lien : chaque terre en îles, et ce que le monde montre des terres, tiré des liaisons posées de la grille et des
// missions jouées. Rien de neuf dans la sauvegarde. Code pur.
import type { BiomeId } from '../../biomes';
import { ARCHIPELAGOS, getBridge, reachableIslands } from '../../world/archipelago';
import type { GridLand } from '../../world/arrange';
import { isLinkedLand, landById, landOf, landPrice, landsBefore, linkedLands, openLands, planOfLand, type LandId, type LinkedLand } from '../../world/continu/lands';
import { ALL_LANDS, placeById, placeOfIsland, type LevelPlan, type PlaceId } from '../../world/continu/levelPlan';
import { playedPlaces, type MissionMark } from '../../world/continu/mission';

/** L'île du port de la grille d'un plan (celle où la grille fait arriver dans sa classe). */
const gridPortOf = (plan: LevelPlan): string | undefined => ARCHIPELAGOS.find((a) => a.classe === plan.level)?.port;

/** Les îles des lieux d'une terre. */
const islandsOf = (land: LandId): BiomeId[] => landById(land).places.map((p) => placeById(p).island as BiomeId);

/** Chaque terre en îles, de tous les plans, pour la grille : la terre d'avant, le prix (rien pour la terre de départ). */
const GRID_LANDS: ReadonlyMap<LandId, GridLand> = (() => {
  const out = new Map<LandId, GridLand>();
  for (const land of ALL_LANDS) {
    const islands = islandsOf(land.id);
    // Le port de la grille d'un plan qui le ferme (`shutPort`, au 4e), s'il est de cette terre.
    const plan = planOfLand(land.id);
    const port = plan.shutPort && land.after ? gridPortOf(plan) : undefined;
    const shut = port && islands.includes(port as BiomeId) ? (port as BiomeId) : undefined;
    const waitsFor = land.waitsFor?.map((l) => out.get(l)!);
    out.set(land.id, { islands, after: land.after ? out.get(land.after)! : null, price: land.after ? landPrice(land.id) : 0, ...(shut ? { shut } : {}), ...(waitsFor ? { waitsFor } : {}) });
  }
  return out;
})();

/** Une terre, vue de la grille. */
export const gridLand = (land: LandId): GridLand => GRID_LANDS.get(land)!;

/** Les terres d'un plan, vues de la grille, dans l'ordre (chacune après la sienne). */
export const gridLands = (plan: LevelPlan): GridLand[] => plan.lands.map((l) => gridLand(l.id));

/** Les îles des lieux où l'élève a déjà joué (`ensureLands` les ouvre, et leur terre avec eux). */
export const playedIslands = (plan: LevelPlan, bornes: readonly MissionMark[]): BiomeId[] => playedPlaces(plan, bornes).map((id) => placeById(id).island as BiomeId);

/**
 * Le lieu d'où part Kéo quand l'adresse nomme une île (`/adventure/<île>`), ou rien (le quai du lieu de départ). Au 4e
 * (`shutPort`), l'île du port de la grille, le Gabarit, fait arriver à la Crique tant que sa terre, le Bastion, est
 * fermée (`closed` ; décision du mainteneur, 21 octobre 2026) ; ouverte, Kéo part du Gabarit. Ailleurs, rien ne change.
 */
export function arrivalPlace(plan: LevelPlan, island: string | undefined, closed: readonly LinkedLand[]): PlaceId | undefined {
  const place = island ? placeOfIsland(island)?.id : undefined;
  if (!place || !plan.shutPort || island !== gridPortOf(plan)) return place;
  const land = landOf(place);
  return isLinkedLand(land) && closed.includes(land) ? undefined : place;
}

/** Ce que le monde continu montre des terres. */
export interface OpenWorldLands {
  /** Les terres fermées, dans l'ordre. */
  closed: LinkedLand[];
  /**
   * Les terres fermées pas encore reliables (leur terre d'avant est fermée, ou une terre qu'elles attendent : au 5e, les
   * Aiguilles avant les Roselières et les Contreforts) : leur fiche mène à la première d'entre elles (`firstBefore`).
   */
  waiting: LinkedLand[];
  /** La terre du pont suggéré (la prochaine destination ouvre l'un de ses lieux), jamais une terre pas encore reliable. */
  suggested: LinkedLand | null;
}

/**
 * Les terres du monde continu d'un plan : `links`, les liaisons posées de la grille ; `bornes`, les missions du monde ouvert (un
 * lieu où l'élève a déjà joué est ouvert) ; `ouvrage`, la liaison que propose la prochaine destination, s'il y en a une ;
 * `island`, l'île de cette destination.
 */
export function openWorldLands(plan: LevelPlan, links: readonly string[], bornes: readonly MissionMark[], ouvrage?: string, island?: string): OpenWorldLands {
  const islands: ReadonlySet<string> = reachableIslands([...links]);
  const played = new Set(playedPlaces(plan, bornes));
  // Le port de la grille d'un plan qui le ferme (`shutPort`, au 4e) n'ouvre pas sa terre à lui seul : il faut y avoir joué.
  const port = plan.shutPort ? gridPortOf(plan) : undefined;
  const open = openLands(plan, (id: PlaceId) => (islands.has(placeById(id).island) && placeById(id).island !== port) || played.has(id));
  const closed = linkedLands(plan).filter((l) => !open.has(l));
  const waiting = closed.filter((l) => !open.has(landById(l).after!) || landsBefore(l).some((b) => !open.has(b)));
  const bridge = ouvrage ? getBridge(ouvrage) : undefined;
  // La liaison suggérée ouvre un lieu : un seul de ses bouts est ouvert.
  const end = bridge && islands.has(bridge.from) !== islands.has(bridge.to) ? (islands.has(bridge.from) ? bridge.to : bridge.from) : undefined;
  const place = end ? placeOfIsland(end)?.id : undefined;
  const land = place ? landOf(place) : undefined;
  const fromOuvrage = land && isLinkedLand(land) && closed.includes(land) && !waiting.includes(land) ? land : null;
  // La prochaine destination se calcule pour tout le jeu (../../world/destination.ts) : la liaison qu'elle propose peut
  // être celle d'un autre niveau (au 5e, celle du 6e où l'élève joue encore), et aucun cadenas du plan n'était plein
  // (consultant UX UI, relecture du lot 2 du 5e) ; sans liaison, elle peut mener à une île d'un autre niveau. Alors, la
  // première terre du plan qu'on peut relier, dans son ordre.
  const elsewhere = place !== undefined ? !plan.places.some((p) => p.id === place) : !ouvrage && island !== undefined && !plan.places.some((p) => p.island === island);
  const suggested = fromOuvrage ?? (elsewhere ? (closed.find((l) => !waiting.includes(l)) ?? null) : null);
  return { closed, waiting, suggested };
}
