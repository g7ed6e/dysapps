// Le terrain du 3e (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses ») : une montagne seule et trois
// Prairies posées sur une mer de nuages, un seul sol juste au-dessus d'elle, jamais d'étage (fiche, § 5). La mer de
// nuages est le plan d'eau du monde ouvert, opaque et mat, à la même hauteur partout (./sea.ts) : chaque rive entre
// dessous en pente douce, comme une plage, si bien qu'aucun dessous d'île ne se voit jamais. Au centre de la montagne,
// le pic, une pyramide de neige qu'on ne visite pas, sur le haut d'un cône de granit au flanc doux ; trois coupures
// vraies vont du pic aux nuages : l'arête ouest et l'arête est, deux crêtes de granit, et la langue de glace, à plat,
// mate. Le Cirque, au nord, se lit en creux sous le pic : une levée douce longe sa rive. Le pic, ses arêtes et la langue
// de glace ne se marchent pas (`walkBlocked3e`). Les tuiles, leurs deux niveaux de détail et leurs anneaux sont ceux du
// 6e (./terrain.ts) : seuls la hauteur, la peinture et ce qui pousse changent. Le pic se voit de toute la montagne : une
// pyramide à facettes, dessinée avec les lieux (`peakFacets`). Sur la Carte, le haut du cône et les arêtes sont hachurés,
// la langue de glace une bande pâle bordée d'ardoise (`mapOverlay3e`). Code pur.
//
// Le terrain se lit en cinq modules (relecture de l'expert frontend, lot suivant, point 5), que ce fichier réexporte
// tels quels : la hauteur du sol (./terrain3eHeight.ts), les tuiles et ce qui pousse (./terrain3eTiles.ts), le pic et les
// liserés des rives (./terrain3eEdges.ts), les petites arches des Prairies (./terrain3eArches.ts), ce que la Carte ajoute
// (./terrain3eMap.ts). Ici, le sol où l'on marche, qui les réunit.
import type { HeightField } from './terrain';
import { parvisFloor } from './plan3e';
import { smallArchFloor } from './terrain3eArches';
import { groundOn3e } from './terrain3eHeight';

export { areteEstClearance, buildHeightField3e, groundOn3e, heightAt3e, landDistance3e, langueClearance, walkBlocked3e } from './terrain3eHeight';
export { FLORA_3E_COLORS, obstaclesIn3e, tileCounts3e, tileFacets3e, tileFlora3e, tileGround3e } from './terrain3eTiles';
export { peakFacets, shoreRimFacets } from './terrain3eEdges';
export { causewayParts, smallArchFacets, smallArchFloor, type Causeway } from './terrain3eArches';
export { mapOverlay3e } from './terrain3eMap';

/**
 * Le sol où l'on marche au 3e : la pierre du Parvis, la chaussée des deux petites arches des Prairies, puis la carte de
 * hauteurs. La scène (./levelWorld.ts) et le budget (./budget.ts) lisent la même (expert frontend, relecture du lot 1).
 */
export const ground3e =
  (field: HeightField) =>
  (x: number, z: number): number =>
    parvisFloor(x, z) ?? smallArchFloor(x, z) ?? groundOn3e(field, x, z);
