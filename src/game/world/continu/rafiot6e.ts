// Le Rafiot des Ferrailleurs au 6e (GD-23, « Le monde habité », lot 2 ; GD-27, « Les deux bandes, une route » : « au 6e,
// le Rafiot au loin, ses pièces sur le pont, et rien d'autre » ; GD-28 : « au 6e, aucun signe sur les lieux, la trace
// est le Rafiot ») : au mouillage dans le lagon (le 6e n'a pas de quai pour lui, consultant d'Archipéo), de flanc, près
// d'un lieu encore éteint ; quand ce lieu est rallumé, il est au mouillage près d'un autre lieu éteint, plus loin ; quand
// les trois le sont, il est parti. Il attend : aucune fumée (GD-27 : « sa fumée opaque ou absente »). Sur son pont avant,
// posées sur une caisse, trois pièces de bronze, jamais une par lieu, jamais comptées (GD-28). Il ne dit rien, rien ne
// bouge, Kéo ne l'atteint pas (il est sur l'eau). Il tient dans l'enveloppe du 6e sans hausse (mesure du 30 octobre
// 2026 : 265 triangles avant la caisse, 1 322 de marge ; rafiot6e.test.ts tient le plafond), dans le maillage des lieux :
// aucun appel de plus. Code pur ; la scène le refait avec les lieux (`LevelWorld.rafiot`).
import type { Facets } from './facets';
import { fromPlan, type PlaceId } from './plan6e';
import { rafiotFacets, type RafiotPiece, type RafiotSite } from './rafiot';
import { SHADOW_DIR } from './sky';

/** Le soleil du 6e, à plat (l'opposé des ombres peintes) : les pans de la coque au soleil ou à l'ombre. */
const SUN_6E = { x: -SHADOW_DIR.x, z: -SHADOW_DIR.z } as const;

/**
 * Où le Rafiot mouille, dans l'ordre où il s'éloigne : dans le lagon, au nord des Ruines (la rive sud, à l'ouest de
 * l'Escale : on le voit du quai, de l'autre côté de l'eau, à quarante pas) ; puis au nord de la Mangrove (la rive
 * sud-ouest) ; puis au large, à l'ouest de l'îlot de la Gare maritime, hors du lagon. De flanc vu de la rive de son
 * lieu (la proue vers l'ouest), sur l'eau, loin des chemins, des pontons, de la passe de la Nef et du bord d'eau de la
 * baleine. Les coordonnées sont celles du plan du 6e (`fromPlan`).
 */
export const RAFIOT_SPOTS_6E: readonly (RafiotSite & { readonly place: PlaceId })[] = [
  { place: 'ruins', at: fromPlan([765, 815]), yaw: Math.PI / 2 },
  { place: 'mangrove', at: fromPlan([690, 760]), yaw: Math.PI / 2 + 0.35 },
  { place: 'ferry', at: fromPlan([300, 800]), yaw: Math.PI / 2 - 0.2 },
];

/**
 * Les pièces sur le pont au 6e : trois des six (l'anneau, la cloche, le poids), une poignée, jamais une par lieu. Décision
 * du directeur artistique du 30 octobre 2026 (GD-28) : les mêmes trois au 6e, au 5e et au 4e, un nombre qui ne grandit
 * pas d'un niveau à l'autre (il se lirait comme un compteur) ; au 3e, les pièces rendues au Fanal restent (GD-25).
 */
export const RAFIOT_PIECES_6E: readonly RafiotPiece[] = ['anneau', 'cloche', 'poids'];

/** Le plafond du Rafiot du 6e : ce qu'il coûte au plus dans le maillage des lieux (rafiot6e.test.ts). */
export const RAFIOT_6E_TRIANGLES_MAX = 600;

/** Le mouillage du Rafiot : le premier dont le lieu n'est pas rallumé, ou rien (il est parti). */
export const rafiotSpot6e = (restored: (place: PlaceId) => boolean): (typeof RAFIOT_SPOTS_6E)[number] | null => RAFIOT_SPOTS_6E.find((s) => !restored(s.place)) ?? null;

const drawn = new Map<PlaceId, Facets>();

/** Le Rafiot à son mouillage du moment (dessiné une fois par mouillage), ou rien s'il est parti. */
export function rafiot6eFacets(restored: (place: PlaceId) => boolean): Facets | null {
  const spot = rafiotSpot6e(restored);
  if (!spot) return null;
  let f = drawn.get(spot.place);
  if (!f) drawn.set(spot.place, (f = rafiotFacets(spot, SUN_6E, { pieces: RAFIOT_PIECES_6E, stowed: 'bow', smoke: false })));
  return f;
}
