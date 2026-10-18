/**
 * Les abords d'une scénette (reprise lieu par lieu, d'après les concepts du 18 octobre 2026) : ce qui entoure Kéo et
 * l'habitant, fini tout autour puisque la caméra tourne à deux doigts (choix du mainteneur, « Caméra libre »). Ils
 * entrent dans le décor de près (./scenette.ts), fait à l'arrivée et libéré au départ : aucun appel de plus, leurs
 * triangles au plus chargé des lieux (./budget.ts).
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { PlaceId } from './plan6e';
import { quaisSurroundings } from './quaisSurroundings';
import { eclusesSurroundings } from './eclusesSurroundings';
import { saltworksSurroundings } from './saltworksSurroundings';

/** L'état du lieu : l'étape qui porte la trace posée (`posed`), la réussite montrée (`open`). */
export interface SurroundingsState {
  posed: boolean;
  open: boolean;
}

/** Les abords d'un lieu, autour du sol de sa scène (`floor`). */
export type Surroundings = (b: FacetBuilder, floor: Vec3, state: SurroundingsState) => void;

export const SURROUNDINGS: Partial<Record<PlaceId, Surroundings>> = {
  quais: quaisSurroundings,
  ecluses: eclusesSurroundings,
  saltworks: saltworksSurroundings,
};
