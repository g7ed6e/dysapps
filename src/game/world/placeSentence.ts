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

/** Les huit directions, dans le sens inverse des aiguilles d'une montre depuis l'est (à l'écran), avec leur préposition. */
const DIRECTIONS = ['à l’est', 'au nord-est', 'au nord', 'au nord-ouest', 'à l’ouest', 'au sud-ouest', 'au sud', 'au sud-est'] as const;

/**
 * La direction en mots de `vers` vu depuis `depuis` (« au nord »), telle qu'on la voit sur la Carte : le nord en haut
 * (y qui monte), l'est à droite, du côté des x du monde qui descendent (la caméra de la Carte regarde depuis les y bas ;
 * world/arrange.ts, `DIRECTION_STEP`).
 */
export function directionWords(depuis: { x: number; y: number }, vers: { x: number; y: number }): string {
  const angle = Math.atan2(vers.y - depuis.y, depuis.x - vers.x);
  const secteur = (((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return DIRECTIONS[secteur];
}

const milieu = (r: Rectangle) => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });

/** « à 2 cases » : un écart d'eau en cases de la grille des places (au pas de 4), une au moins. */
export function distanceWords(ecart: number): string {
  const n = Math.max(1, Math.round(ecart / STEP));
  return `à ${n} case${n > 1 ? 's' : ''}`;
}

/**
 * Où est un lieu à une place (la sienne par défaut) : « au nord de la Forêt des sons, à 2 cases », par rapport à son
 * voisin le plus proche (l'écart d'eau le plus petit entre leurs terres ; le premier dans l'ordre des données à
 * égalité).
 */
export function placeSentence(world: World, id: BiomeId, spot: LayoutSpot = spotOf(world, id), nom: PlaceName = NOM_DU_JEU): string {
  const a = archipelagoOfIsland(id);
  const ici = landRectangle(placedIsland(id, poseOfSpot(a, spot)));
  let voisin: { id: BiomeId; r: Rectangle; ecart: number } | null = null;
  for (const autre of placesOf(a)) {
    if (autre === id) continue;
    const r = landRectangle(placeIn(world, autre));
    const ecart = gapBetween(ici, r);
    if (!voisin || ecart < voisin.ecart) voisin = { id: autre, r, ecart };
  }
  if (!voisin) return '';
  return `${directionWords(milieu(voisin.r), milieu(ici))} ${ofPlace(nom(voisin.id))}, ${distanceWords(voisin.ecart)}`;
}

/** Où est l'îlot d'un Gardien autour de son lieu (à sa place par défaut) : « au nord de son île ». */
export function guardianSentence(world: World, id: BiomeId, g: Pick<LayoutGuardian, 'side' | 'step'> = guardianOf(world, id)): string {
  const def: IslandDef = placeIn(world, id);
  const parts = footprintOf(id, def, g);
  const terre = parts.find((p) => p.genre === 'terre')!;
  const ilot = parts.find((p) => p.genre === 'ilot')!;
  return `${directionWords(milieu(terre), milieu(ilot))} de son île`;
}
