// La phrase écrite et lue qui dit où est une place (GD-9, « Aménager sa région ») : « au nord de la Forêt des sons, à
// 2 cases ». La direction en mots (huit, le nord en haut de la Carte, l’est à sa droite, vue à l’écran), le voisin le plus proche, et l'écart en cases de
// la grille des places (le mot « cases » choisi par le mainteneur, 5 octobre 2026). Les noms des lieux viennent de
// l'appelant (les textes de l'univers) ; sans eux, ceux du jeu. Code pur, sans Three.js.
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { placeIn, spotOf } from './arrange';
import { archipelagoOfIsland } from './map';
import { gapBetween, landRectangle, placedIsland, poseOfSpot } from './footprint';
import { STEP, type Rectangle } from './placement';
import { placesOf } from './routing';
import { VUE_DE_LA_CARTE } from './terrain';
import type { LayoutSpot } from './savedLayout';
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
 * Les axes de l'écran de la Carte sur le sol, en cases du monde (x, y de la grille) : la droite et le haut de l'image,
 * pour la caméra de la Carte (`VUE_DE_LA_CARTE`, regardée comme three/camera/framings.ts la pose : `lookAt`, le haut
 * du monde en haut). Projection parallèle : la même à tout zoom et à toute taille d'écran ; la perspective n'y ajoute
 * que quelques degrés près des bords.
 */
const AXES_DE_LA_CARTE = (() => {
  const v = VUE_DE_LA_CARTE;
  const n = Math.hypot(v.dx, v.up, v.dy);
  const u = { x: v.dx / n, y: v.up / n, z: v.dy / n };
  // La droite : le haut du monde (0, 1, 0) vectoriel l'axe de la caméra, à plat.
  const m = Math.hypot(u.z, u.x);
  const droite = { x: u.z / m, y: 0, z: -u.x / m };
  // Le haut de l'image : l'axe de la caméra vectoriel la droite.
  const haut = { x: u.y * droite.z - u.z * droite.y, z: u.x * droite.y - u.y * droite.x };
  return { droite: { x: droite.x, y: droite.z }, haut: { x: haut.x, y: haut.z } };
})();

/**
 * La direction de `vers` vu depuis `depuis`, telle qu'on la voit sur la Carte : le nord en haut de l'image, l'est à sa
 * droite (du côté des x du monde qui descendent ; world/arrange.ts, `DIRECTION_STEP`). L'angle est pris à l'écran, pas
 * sur la grille : la caméra de la Carte, un peu penchée et tournée, le change de quelques degrés, assez pour changer
 * de mot près d'une limite entre deux secteurs.
 */
function directionOf(depuis: { x: number; y: number }, vers: { x: number; y: number }): PlaceDirection {
  const g = { x: vers.x - depuis.x, y: vers.y - depuis.y };
  const { droite, haut } = AXES_DE_LA_CARTE;
  const angle = Math.atan2(g.x * haut.x + g.y * haut.y, g.x * droite.x + g.y * droite.y);
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
