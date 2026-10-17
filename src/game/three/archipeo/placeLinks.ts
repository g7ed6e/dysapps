// Les liaisons du monde continu lues dans la grille (GD-20, point 3, lot 1 « Relier ») : la liaison de la grille de chaque
// lieu qu'on relie, les lieux fermés, ceux qui ne sont pas encore reliables et la liaison suggérée. Un lieu dont la
// liaison part du départ a celle de la table (world/continu/links.ts, en paires d'îles résolues par `getBridge`) ; les
// quatre qui se relient après un voisin (`AFTER_NEIGHBOUR`, choix du mainteneur, 17 octobre 2026) prennent, comme la
// grille, la liaison qui se trace depuis un lieu déjà relié (`nearestDeparture`), et n'en ont aucune tant qu'aucun voisin
// n'est relié. Un lieu ouvert dans une disposition l'est dans l'autre : ouvert dans la grille (ses liaisons posées,
// `reachableIslands`), il l'est ici ; un lieu où l'élève a déjà joué avant les liaisons le reste (`playedPlaces`). Rien
// de neuf dans la sauvegarde.
import { getBridge, linkLength, nearestDeparture, reachableIslands, type BridgeDef } from '../../world/archipelago';
import type { BiomeId } from '../../biomes';
import { distance, type Vec2 } from '../../world/continu/geometry';
import { START_PLACES, closedPlaces, isLinked, linkIslands, linksFromStart, obstacleOf, type LinkedPlace } from '../../world/continu/links';
import { playedPlaces, type MissionMark } from '../../world/continu/mission';
import { placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';

/** La liaison de la grille entre deux îles, dans un sens ou dans l'autre. */
const bridgeBetween = (a: string, b: string): BridgeDef | null => getBridge(`${a}-${b}`) ?? getBridge(`${b}-${a}`) ?? null;

/** La liaison de la table d'un lieu dont la liaison part du départ, ou rien (un lieu du départ, ou d'après un voisin). */
export function linkOfPlace(place: PlaceId): BridgeDef | null {
  const pair = linkIslands(place);
  return pair ? bridgeBetween(pair[0], pair[1]) : null;
}

/**
 * La liaison que « Relier » paie pour un lieu fermé, les liaisons posées `links` : celle de la table si elle part du
 * départ ; pour un lieu d'après un voisin, celle de la grille depuis le lieu relié le plus proche qui s'en trace, ou rien
 * (pas encore reliable).
 */
export function linkToPay(place: LinkedPlace, links: readonly string[], open: Set<BiomeId> = reachableIslands([...links])): BridgeDef | null {
  if (linksFromStart(place)) return linkOfPlace(place);
  return nearestDeparture(placeById(place).island as BiomeId, [...links], open);
}

/**
 * Les voisins d'un lieu pas encore reliable : les lieux fermés d'où sa liaison de la grille se trace, une fois reliés ;
 * le plus proche de Kéo (`from`, sa passerelle démontée) d'abord.
 */
export function neighboursFirst(place: LinkedPlace, links: readonly string[], closed: readonly LinkedPlace[], from: Vec2): LinkedPlace[] {
  const island = placeById(place).island;
  return closed
    .filter((n) => n !== place)
    .filter((n) => {
      const b = bridgeBetween(placeById(n).island, island);
      return b !== null && linkLength(b, links) !== null;
    })
    .map((n) => ({ n, d: distance(from, obstacleOf(n).at) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.n);
}

/** Ce que le monde continu montre des liaisons. */
export interface OpenWorldLinks {
  /** Les lieux fermés, dans l'ordre du plan. */
  closed: LinkedPlace[];
  /**
   * Les lieux fermés pas encore reliables (après un voisin, aucun voisin relié) : leur fiche mène au voisin, la Carte ne
   * dessine pas leur embranchement, la suggestion ne les choisit jamais.
   */
  waiting: LinkedPlace[];
  /** Le lieu fermé de la liaison suggérée (la prochaine destination du jeu propose de le relier), ou rien. */
  suggested: LinkedPlace | null;
}

/**
 * Les liaisons du monde continu : `links`, les liaisons posées de la grille ; `bornes`, les missions du monde ouvert
 * (`bornesDuMondeOuvert`) ; `ouvrage`, la liaison que propose la prochaine destination, s'il y en a une.
 */
export function openWorldLinks(links: readonly string[], bornes: readonly MissionMark[], ouvrage?: string): OpenWorldLinks {
  const open = reachableIslands([...links]);
  const opened: ReadonlySet<string> = open;
  const played = new Set(playedPlaces(bornes));
  const closed = closedPlaces((id) => opened.has(placeById(id).island) || played.has(id));
  // Pas encore reliable : aucune liaison qui se trace depuis un lieu relié, et un voisin fermé à relier d'abord. Sans
  // aucun voisin fermé (une sauvegarde d'avant les liaisons, ses voisins joués sans être reliés), il reste reliable par
  // sa liaison de la table, à reposer dans la grille.
  const waiting = closed.filter((p) => !linksFromStart(p) && !linkToPay(p, links, open) && neighboursFirst(p, links, closed, placeById(p).center).length > 0);
  const bridge = ouvrage ? getBridge(ouvrage) : undefined;
  // La liaison suggérée ouvre un lieu : un seul de ses bouts est ouvert (sinon, « loin » dans la grille, rien).
  const end = bridge && opened.has(bridge.from) !== opened.has(bridge.to) ? (opened.has(bridge.from) ? bridge.to : bridge.from) : undefined;
  const target = end ? placeOfIsland(end)?.id : undefined;
  const suggested = target && isLinked(target) && closed.includes(target) && !waiting.includes(target) ? target : null;
  return { closed, waiting, suggested };
}

/**
 * La liaison que paie « Relier » pour un lieu fermé reliable : `linkToPay`, sinon (un lieu d'après un voisin dont les
 * voisins ont été joués sans être reliés, une sauvegarde d'avant les liaisons) la liaison de la grille vers le lieu du
 * départ le plus proche de lui (le Phare ou les Quais, à vol d'oiseau ; le premier du départ à égalité), qui sera à
 * reposer dans la grille. Toujours la même pour un même lieu.
 */
export function payableLink(place: LinkedPlace, links: readonly string[]): BridgeDef | null {
  const direct = linkToPay(place, links);
  if (direct) return direct;
  const here = placeById(place);
  const start = [...START_PLACES].sort((a, b) => distance(placeById(a).center, here.center) - distance(placeById(b).center, here.center))[0];
  return bridgeBetween(placeById(start).island, here.island);
}
