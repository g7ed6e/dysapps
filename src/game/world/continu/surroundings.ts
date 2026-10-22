/**
 * Les abords d'une scénette (reprise lieu par lieu, d'après les concepts du 18 octobre 2026) : ce qui entoure Kéo et
 * l'habitant, fini tout autour puisque la caméra tourne à deux doigts (choix du mainteneur, « Caméra libre »). Ils
 * entrent dans le décor de près (./scenette.ts), fait à l'arrivée et libéré au départ : aucun appel de plus, leurs
 * triangles au plus chargé des lieux (./budget.ts). Les lieux partagent un kit (./surroundingsKit.ts).
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { ScenePlaceId as PlaceId } from './levelPlan';
import { aubergeSurroundings } from './aubergeSurroundings';
import { nacellesSurroundings } from './nacellesSurroundings';
import { forgeSurroundings } from './forgeSurroundings';
import { souteSurroundings } from './souteSurroundings';
import { terminusSurroundings } from './terminusSurroundings';
import { orguesSurroundings } from './orguesSurroundings';
import { dynamoSurroundings } from './dynamoSurroundings';
import { porteSurroundings } from './porteSurroundings';
import { etalonSurroundings } from './etalonSurroundings';
import { chariotSurroundings } from './chariotSurroundings';
import { gabaritSurroundings } from './gabaritSurroundings';
import { manufactureSurroundings } from './manufactureSurroundings';
import { logeSurroundings } from './logeSurroundings';
import { herbierSurroundings } from './herbierSurroundings';
import { belvedereSurroundings } from './belvedereSurroundings';
import { grenierSurroundings } from './grenierSurroundings';
import { jonctionSurroundings } from './jonctionSurroundings';
import { veilleeSurroundings } from './veilleeSurroundings';
import { basiliqueSurroundings } from './basiliqueSurroundings';
import { rochesSurroundings } from './rochesSurroundings';
import { croiseeSurroundings } from './croiseeSurroundings';
import { donjonSurroundings } from './donjonSurroundings';
import { fumerollesSurroundings } from './fumerollesSurroundings';
import { gaillardSurroundings } from './gaillardSurroundings';
import { hameauSurroundings } from './hameauSurroundings';
import { instantsSurroundings } from './instantsSurroundings';
import { etuveSurroundings } from './etuveSurroundings';
import { monteeSurroundings } from './monteeSurroundings';
import { radeauxSurroundings } from './radeauxSurroundings';
import { terrassesSurroundings } from './terrassesSurroundings';
import { semaphoreSurroundings } from './semaphoreSurroundings';
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
import { oracleSurroundings } from './oracleSurroundings';
import { mangroveSurroundings } from './mangroveSurroundings';
import { ruinsSurroundings } from './ruinsSurroundings';
import { beaconsSurroundings } from './beaconsSurroundings';
import { ferrySurroundings } from './ferrySurroundings';
import { commonsSurroundings } from './commonsSurroundings';
import { observatorySurroundings } from './observatorySurroundings';

/**
 * L'état du lieu : l'étape qui porte la trace posée (`posed`), la réussite montrée (`open`), l'étape du haut posée
 * (`topped` : le carbet de la Mangrove relevé, ses abords changent ; faux par défaut, l'état le plus chargé).
 */
export interface SurroundingsState {
  posed: boolean;
  open: boolean;
  topped?: boolean;
}

/** Les abords d'un lieu, autour du sol de sa scène (`floor`). */
export type Surroundings = (b: FacetBuilder, floor: Vec3, state: SurroundingsState) => void;

/**
 * Le plafond des abords d'un lieu, en triangles. Le poste de la scénette (./budget.ts) compte le lieu le plus chargé,
 * aux Filets au 18 octobre 2026 (1 876 triangles de décor de près au pire, moins le pion que son modèle remplace), pour
 * un monde à 99 960 triangles sur 100 000 (100 094 sur 100 140 depuis les bêtes des côtes, 19 octobre 2026) : un lieu le garde sous l'enveloppe tant que son décor de près au pire, abords
 * compris et pion retiré, ne passe pas 1 916 triangles. Le test de l'enveloppe (./continu.test.ts) et celui de chaque
 * lieu du registre (./surroundings.test.ts) le vérifient.
 */
export const SURROUNDINGS_MAX = 1500;

export const SURROUNDINGS: Partial<Record<PlaceId, Surroundings>> = {
  // Le 5e (GD-22, lot 3) : la Montée ; lot 5 : le Hameau ; lot 6 : les Radeaux ; lot 7 : la Croisée ; lot 8 : les Instants ;
  // lot 9 : les Fumerolles ; lot 10 : l'Étuve ; lot 11 : les Terrasses ; lot 12 : l'Auberge ; lot 13a : le Donjon ; lot 13b : l'Oracle ;
  // lot 14 : le Sémaphore ; lot 15 : le Gaillard ; lot 16 : les Nacelles. Le 4e : la Forge et l'Étalon (lot 2) ; le Terminus,
  // les Orgues et la Dynamo (lot 3).
  montee: monteeSurroundings,
  hameau: hameauSurroundings,
  radeaux: radeauxSurroundings,
  croisee: croiseeSurroundings,
  instants: instantsSurroundings,
  fumerolles: fumerollesSurroundings,
  etuve: etuveSurroundings,
  terrasses: terrassesSurroundings,
  auberge: aubergeSurroundings,
  donjon: donjonSurroundings,
  oracle: oracleSurroundings,
  semaphore: semaphoreSurroundings,
  gaillard: gaillardSurroundings,
  nacelles: nacellesSurroundings,
  forge: forgeSurroundings,
  soute: souteSurroundings,
  porte: porteSurroundings,
  etalon: etalonSurroundings,
  gabarit: gabaritSurroundings,
  chariot: chariotSurroundings,
  manufacture: manufactureSurroundings,
  loge: logeSurroundings,
  terminus: terminusSurroundings,
  orgues: orguesSurroundings,
  dynamo: dynamoSurroundings,
  herbier: herbierSurroundings,
  roches: rochesSurroundings,
  jonction: jonctionSurroundings,
  veillee: veilleeSurroundings,
  basilique: basiliqueSurroundings,
  belvedere: belvedereSurroundings,
  grenier: grenierSurroundings,
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
  commons: commonsSurroundings,
  observatory: observatorySurroundings,
};
