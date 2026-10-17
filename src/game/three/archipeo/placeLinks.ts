// Les liaisons du monde continu lues dans la grille (GD-20, point 3, lot 1 « Relier ») : la liaison de la grille de chaque
// lieu qu'on relie (la table du monde continu, world/continu/links.ts, en paires d'îles résolues par `getBridge`), les
// lieux fermés et la liaison suggérée. Un lieu ouvert dans une disposition l'est dans l'autre : ouvert dans la grille
// (ses liaisons posées, `reachableIslands`), il l'est ici ; un lieu où l'élève a déjà joué avant les liaisons le reste
// (`playedPlaces`). Rien de neuf dans la sauvegarde.
import { getBridge, reachableIslands, type BridgeDef } from '../../world/archipelago';
import { closedPlaces, isLinked, linkIslands, type LinkedPlace } from '../../world/continu/links';
import { playedPlaces, type MissionMark } from '../../world/continu/mission';
import { placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';

/** La liaison de la grille qui relie un lieu (dans un sens ou dans l'autre), ou rien (un lieu du départ). */
export function linkOfPlace(place: PlaceId): BridgeDef | null {
  const pair = linkIslands(place);
  if (!pair) return null;
  return getBridge(`${pair[0]}-${pair[1]}`) ?? getBridge(`${pair[1]}-${pair[0]}`) ?? null;
}

/** Ce que le monde continu montre des liaisons. */
export interface OpenWorldLinks {
  /** Les lieux fermés, dans l'ordre du plan. */
  closed: LinkedPlace[];
  /** Le lieu fermé de la liaison suggérée (la prochaine destination du jeu propose de le relier), ou rien. */
  suggested: LinkedPlace | null;
}

/**
 * Les liaisons du monde continu : `links`, les liaisons posées de la grille ; `bornes`, les missions du monde ouvert
 * (`bornesDuMondeOuvert`) ; `ouvrage`, la liaison que propose la prochaine destination, s'il y en a une.
 */
export function openWorldLinks(links: readonly string[], bornes: readonly MissionMark[], ouvrage?: string): OpenWorldLinks {
  const open: ReadonlySet<string> = reachableIslands([...links]);
  const played = new Set(playedPlaces(bornes));
  const closed = closedPlaces((id) => open.has(placeById(id).island) || played.has(id));
  const bridge = ouvrage ? getBridge(ouvrage) : undefined;
  const target = bridge ? placeOfIsland(open.has(bridge.from) ? bridge.to : bridge.from)?.id : undefined;
  const suggested = target && isLinked(target) && closed.includes(target) ? target : null;
  return { closed, suggested };
}
