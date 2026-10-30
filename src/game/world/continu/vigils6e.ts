// Les trois veillées du 6e (GD-23, « trois veillées par niveau » ; GD-27, « Par quels canaux le récit se raconte » ;
// lot 3) : l'arrivée et le départ cadrent le feu du niveau, la lanterne du Phare, éteinte à l'arrivée, telle qu'elle est
// au départ (la veillée de départ du 6e ne montre que son propre feu) ; l'embarquement cadre la Gare maritime rallumée,
// où la radio monte à bord (son modèle 3D n'existe pas encore, GD-19 : la veillée montre le lieu, la ligne dit
// l'équipier). Deux plans chacune, lents, le regard à peine sous l'horizon, jamais à pic ; puis la caméra revient
// derrière Kéo. Une seule ligne, littérale, le lieu nommé (docs/contenu/monde-ouvert.md, « Les veillées »). Code pur.
import type { Vec3 } from './geometry';
import PHRASES from './mondeOuvert.json';
import { FERRY_ISLET, fromPlan, placeById } from './plan6e';
import type { Vigil } from './vigil';

/** Les trois veillées d'un niveau, dans l'ordre où l'élève les voit. */
export type VigilKind = 'arrival' | 'boarding' | 'departure';

/**
 * Le Phare dans le monde : son pied (le sol de l'îlot) et sa lanterne (places.ts, `LANTERN`, 11,1 au-dessus du pied,
 * 1,5 de haut) ; les plans la gardent dans le tiers haut de l'image, la tour entière.
 */
export const PHARE_6E = { foot: fromPlan([880, 590]), ground: 3.1, lantern: { bottom: 14.2, top: 15.7 } } as const;

/** Les secondes de chaque veillée : glisser vers le premier plan, le tenir, glisser vers le second, le tenir (la ligne). */
const TIMES = { travel: 8, hold: 2, near: 5, read: 4 } as const;
/** Avec « Réduire les animations », le dernier plan tenu ce temps (le temps de lire la ligne). */
const STILL = 8;

const shot = (position: Vec3, target: Vec3, travel: number, hold: number) => ({ position, target, travel, hold });

/**
 * Le regard sur le Phare, depuis le sud-sud-ouest (la caméra qui suit regarde vers le nord, du quai de l'Escale : le
 * Phare est droit devant, de l'autre côté du lagon) : d'abord l'îlot entier, à cinquante pas, puis la tour de plus
 * près, à trente-cinq pas (l'îlot s'étend jusqu'à vingt-neuf pas au sud du Phare : la caméra reste au-dessus de
 * l'eau), le pied de la tour un peu sous le milieu de l'image : en ruine (un moignon de quatre pas) comme rallumé (la
 * lanterne à quinze), le Phare tient dans l'image, la lanterne dans son tiers haut. Le même regard à l'arrivée (la lanterne éteinte) et au départ (telle
 * qu'elle est).
 */
export const PHARE_VIGIL_6E: Vigil = {
  shots: [
    shot({ x: PHARE_6E.foot.x - 26, y: 14, z: PHARE_6E.foot.z + 56 }, { x: PHARE_6E.foot.x, y: 5, z: PHARE_6E.foot.z }, TIMES.travel, TIMES.hold),
    shot({ x: PHARE_6E.foot.x - 11, y: 10, z: PHARE_6E.foot.z + 34 }, { x: PHARE_6E.foot.x, y: 6, z: PHARE_6E.foot.z }, TIMES.near, TIMES.read),
  ],
  still: STILL,
};

/**
 * Le regard sur la Gare maritime, sur son îlot au large de la côte ouest : depuis le sud-est, au-dessus de l'eau, l'îlot
 * entier et sa jetée, puis le pavillon et son quai, plus bas et plus près.
 */
export const FERRY_VIGIL_6E: Vigil = {
  shots: [
    shot({ x: FERRY_ISLET.center.x + 19, y: 12, z: FERRY_ISLET.center.z + 35 }, { x: FERRY_ISLET.center.x, y: 3, z: FERRY_ISLET.center.z }, TIMES.travel, TIMES.hold),
    shot({ x: FERRY_ISLET.center.x + 8, y: 8, z: FERRY_ISLET.center.z + 20 }, { x: FERRY_ISLET.center.x, y: 4, z: FERRY_ISLET.center.z + 1 }, TIMES.near, TIMES.read),
  ],
  still: STILL,
};

/** La veillée de chaque moment du 6e. */
export const vigil6e = (kind: VigilKind): Vigil => (kind === 'boarding' ? FERRY_VIGIL_6E : PHARE_VIGIL_6E);

/** L'équipier qui monte à bord au 6e, par son rôle (GD-19 : son prénom ne s'affiche jamais). */
const BOARDING_6E = 'La radio';

/**
 * La ligne de la veillée `kind` au 6e : le feu nommé et son état (`lit` : la lanterne du Phare allumée, avec le haut du
 * Phare posé), ou l'équipier qui monte à bord.
 */
export function vigilWords6e(kind: VigilKind, lit: boolean): string {
  if (kind === 'boarding') return PHRASES.boarding.replace('{Équipier}', BOARDING_6E);
  return (lit ? PHRASES.fireLit : PHRASES.fireOut).replace('{Feu}', placeById('phare').name);
}
