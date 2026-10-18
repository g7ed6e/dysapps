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
import { phareSurroundings } from './phareSurroundings';
import { filetsSurroundings } from './filetsSurroundings';
import { archivesSurroundings } from './archivesSurroundings';
import { shipyardSurroundings } from './shipyardSurroundings';
import { printworksSurroundings } from './printworksSurroundings';
import { mangroveSurroundings } from './mangroveSurroundings';
import { ruinsSurroundings } from './ruinsSurroundings';
import { beaconsSurroundings } from './beaconsSurroundings';
import { ferrySurroundings } from './ferrySurroundings';

/** L'état du lieu : l'étape qui porte la trace posée (`posed`), la réussite montrée (`open`). */
export interface SurroundingsState {
  posed: boolean;
  open: boolean;
}

/** Les abords d'un lieu, autour du sol de sa scène (`floor`). */
export type Surroundings = (b: FacetBuilder, floor: Vec3, state: SurroundingsState) => void;

/**
 * Le plafond des abords d'un lieu, en triangles. Le poste de la scénette (./budget.ts) compte le lieu le plus chargé,
 * aux Filets au 18 octobre 2026 (1 876 triangles de décor de près au pire, moins le pion que son modèle remplace), pour
 * un monde à 99 960 triangles sur 100 000 : un lieu le garde sous l'enveloppe tant que son décor de près au pire, abords
 * compris et pion retiré, ne passe pas 1 916 triangles. Le test de l'enveloppe (./continu.test.ts) et celui de chaque
 * lieu du registre (./surroundings.test.ts) le vérifient.
 */
export const SURROUNDINGS_MAX = 1500;

export const SURROUNDINGS: Partial<Record<PlaceId, Surroundings>> = {
  quais: quaisSurroundings,
  ecluses: eclusesSurroundings,
  saltworks: saltworksSurroundings,
  engine: engineSurroundings,
  lookout: lookoutSurroundings,
  phare: phareSurroundings,
  filets: filetsSurroundings,
  archives: archivesSurroundings,
  shipyard: shipyardSurroundings,
  printworks: printworksSurroundings,
  mangrove: mangroveSurroundings,
  ruins: ruinsSurroundings,
  beacons: beaconsSurroundings,
  ferry: ferrySurroundings,
};
