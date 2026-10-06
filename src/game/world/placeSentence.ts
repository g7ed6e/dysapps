// La phrase écrite et lue qui dit où est une place (GD-9, « Aménager sa région ») : « au nord de la Forêt des sons, à
// 2 cases ». La direction en mots (huit, le nord en haut de la Carte, l’est à sa droite), le voisin le plus proche, et l'écart en cases de
// la grille des places (le mot « cases » choisi par le mainteneur, 5 octobre 2026). Les noms des lieux viennent de
// l'appelant (les textes de l'univers) ; sans eux, ceux du jeu. Code pur, sans Three.js.
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { guardianOf, placeIn, spotOf } from './arrange';
import { archipelagoOfIsland, type IslandDef } from './map';
import { footprintOf, gapBetween, landRectangle, placedIsland, poseOfSpot } from './footprint';
import { STEP, type Rectangle } from './placement';
import { placesOf } from './routing';
import type { LayoutGuardian, LayoutSpot } from './savedLayout';
import { ofPlace } from './placeArticle';

export { ofPlace, thePlace, toPlace } from './placeArticle';

/** Le nom d'un lieu dans l'univers en cours. */
export type PlaceName = (id: BiomeId) => string;

const NOM_DU_JEU: PlaceName = (id) => getBiome(id)?.name ?? id;

/**
 * Les huit directions, dans le sens inverse des aiguilles d'une montre depuis l'est (à l'écran) : leur mot (« nord-ouest »,
 * écrit à côté de la flèche en grand texte), leur préposition (« au nord-ouest », pour la phrase lue), et leur flèche.
 */
export const DIRECTIONS = [
  { mot: 'est', avec: 'à l’est', icone: 'est' },
  { mot: 'nord-est', avec: 'au nord-est', icone: 'nordEst' },
  { mot: 'nord', avec: 'au nord', icone: 'nord' },
  { mot: 'nord-ouest', avec: 'au nord-ouest', icone: 'nordOuest' },
  { mot: 'ouest', avec: 'à l’ouest', icone: 'ouest' },
  { mot: 'sud-ouest', avec: 'au sud-ouest', icone: 'sudOuest' },
  { mot: 'sud', avec: 'au sud', icone: 'sud' },
  { mot: 'sud-est', avec: 'au sud-est', icone: 'sudEst' },
] as const;

/** Une des huit directions. */
type PlaceDirection = (typeof DIRECTIONS)[number];

/**
 * La direction de `vers` vu depuis `depuis`, telle qu'on la voit sur la Carte : le nord en haut (y qui monte), l'est à
 * droite, du côté des x du monde qui descendent (la caméra de la Carte regarde depuis les y bas ; world/arrange.ts,
 * `DIRECTION_STEP`).
 */
function directionOf(depuis: { x: number; y: number }, vers: { x: number; y: number }): PlaceDirection {
  const angle = Math.atan2(vers.y - depuis.y, depuis.x - vers.x);
  const secteur = (((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return DIRECTIONS[secteur];
}

/** La direction en mots de `vers` vu depuis `depuis` (« au nord »). */
export function directionWords(depuis: { x: number; y: number }, vers: { x: number; y: number }): string {
  return directionOf(depuis, vers).avec;
}

const milieu = (r: Rectangle) => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });

/** Un écart d'eau en cases de la grille des places (au pas de 4), une au moins. */
function casesOf(ecart: number): number {
  return Math.max(1, Math.round(ecart / STEP));
}

/** « 2 cases », « 1 case ». */
export function casesWord(n: number): string {
  return `${n} case${n > 1 ? 's' : ''}`;
}

/** « à 2 cases » : un écart d'eau en cases de la grille des places, une au moins. */
export function distanceWords(ecart: number): string {
  return `à ${casesWord(casesOf(ecart))}`;
}

/**
 * Où est un lieu, en signes (GD-9, piste A, « des signes à la place des phrases ») : le voisin repère, la direction et
 * l'écart en cases. La ligne écrite les montre dans l'ordre de la voix (« Mine des lettres ↖ 4 ⬚ ») ; la voix les dit en
 * mots (`placeSignsSentence`).
 */
export interface PlaceSigns {
  /** Le nom du voisin le plus proche, dans l'univers en cours. */
  voisin: string;
  direction: PlaceDirection;
  cases: number;
}

/** « au nord-ouest de la Mine des lettres, à 4 cases » : la ligne de signes, en mots. */
export function placeSignsSentence(s: PlaceSigns): string {
  return `${s.direction.avec} ${ofPlace(s.voisin)}, à ${casesWord(s.cases)}`;
}

/**
 * Où est un lieu à une place (la sienne par défaut) : « au nord de la Forêt des sons, à 2 cases », par rapport à son
 * voisin le plus proche (l'écart d'eau le plus petit entre leurs terres ; le premier dans l'ordre des données à
 * égalité).
 */
export function placeSentence(world: World, id: BiomeId, spot: LayoutSpot = spotOf(world, id), nom: PlaceName = NOM_DU_JEU): string {
  const s = placeSigns(world, id, spot, nom);
  return s ? placeSignsSentence(s) : '';
}

/** Où est un lieu à une place (la sienne par défaut), en signes : son voisin le plus proche, la direction, l'écart. */
export function placeSigns(world: World, id: BiomeId, spot: LayoutSpot = spotOf(world, id), nom: PlaceName = NOM_DU_JEU): PlaceSigns | null {
  const a = archipelagoOfIsland(id);
  const ici = landRectangle(placedIsland(id, poseOfSpot(a, spot)));
  let voisin: { id: BiomeId; r: Rectangle; ecart: number } | null = null;
  for (const autre of placesOf(a)) {
    if (autre === id) continue;
    const r = landRectangle(placeIn(world, autre));
    const ecart = gapBetween(ici, r);
    if (!voisin || ecart < voisin.ecart) voisin = { id: autre, r, ecart };
  }
  if (!voisin) return null;
  return { voisin: nom(voisin.id), direction: directionOf(milieu(voisin.r), milieu(ici)), cases: casesOf(voisin.ecart) };
}

/** Où est l'îlot d'un Gardien autour de son lieu (à sa place par défaut) : « au nord de son île ». */
export function guardianSentence(world: World, id: BiomeId, g: Pick<LayoutGuardian, 'side' | 'step'> = guardianOf(world, id)): string {
  const def: IslandDef = placeIn(world, id);
  const parts = footprintOf(id, def, g);
  const terre = parts.find((p) => p.genre === 'terre')!;
  const ilot = parts.find((p) => p.genre === 'ilot')!;
  return `${directionWords(milieu(terre), milieu(ilot))} de son île`;
}
