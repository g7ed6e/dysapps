/**
 * Les abords d'une scénette (reprise lieu par lieu, d'après les concepts du 18 octobre 2026) : ce qui entoure Kéo et
 * l'habitant, fini tout autour puisque la caméra tourne à deux doigts (choix du mainteneur, « Caméra libre »). Ils
 * entrent dans le décor de près (./scenette.ts), fait à l'arrivée et libéré au départ : aucun appel de plus, leurs
 * triangles au plus chargé des lieux (./budget.ts). Les lieux partagent un kit (./surroundingsKit.ts).
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { PlaceId } from './plan6e';
import { quaisSurroundings } from './quaisSurroundings';
import { eclusesSurroundings } from './eclusesSurroundings';
import { saltworksSurroundings } from './saltworksSurroundings';
import { engineSurroundings } from './engineSurroundings';
import { lookoutSurroundings } from './lookoutSurroundings';

/** L'état du lieu : l'étape qui porte la trace posée (`posed`), la réussite montrée (`open`). */
export interface SurroundingsState {
  posed: boolean;
  open: boolean;
}

/** Les abords d'un lieu, autour du sol de sa scène (`floor`). */
export type Surroundings = (b: FacetBuilder, floor: Vec3, state: SurroundingsState) => void;

/**
 * Le plafond des abords d'un lieu, en triangles. Le poste de la scénette (./budget.ts) compte le lieu le plus chargé :
 * aux Écluses, au 18 octobre 2026, 1 413 triangles d'abords et 250 pour le reste du décor de près à la réussite, moins le
 * pion que son modèle remplace, pour un monde à 99 747 triangles sur 100 000. Au plafond, les Écluses mettraient le
 * monde à 99 834 ; un autre lieu le garde sous 100 000 tant que le reste de son décor de près, moins son pion, ne passe
 * pas 410 triangles. Le test de chaque lieu du registre le vérifie (./surroundings.test.ts).
 */
export const SURROUNDINGS_MAX = 1500;

export const SURROUNDINGS: Partial<Record<PlaceId, Surroundings>> = {
  quais: quaisSurroundings,
  ecluses: eclusesSurroundings,
  saltworks: saltworksSurroundings,
  engine: engineSurroundings,
  lookout: lookoutSurroundings,
};
