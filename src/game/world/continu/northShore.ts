// Le rivage nord du monde continu (GD-20, point 8, lot L7) : la Vigie, les Archives, l'Imprimerie ; le large (lot L9) :
// les Balises, la Gare maritime ; chacun dans son fichier (placeArt.ts). Les fichiers communs (places.ts, scenette.ts,
// questionScene.ts) les lisent ici. Au 5e, la Montée (GD-22, lot 3), dans ./montee5e.ts ; le Hameau (lot 5), dans ./hameau5e.ts ;
// les Radeaux (lot 6), dans ./radeaux5e.ts ; la Croisée (lot 7), dans ./croisee5e.ts ; les Instants (lot 8), dans
// ./instants5e.ts ; les Fumerolles (lot 9), dans ./fumerolles5e.ts ; l'Étuve (lot 10), dans ./etuve5e.ts ; les
// Terrasses (lot 11), dans ./terrasses5e.ts.
import { ARCHIVES } from './archives';
import { BEACONS } from './beacons';
import { FERRY } from './ferry';
import { LOOKOUT } from './lookout';
import type { PlaceArt } from './placeArt';
import type { PlaceId } from './levelPlan';
import { CROISEE } from './croisee5e';
import { FUMEROLLES } from './fumerolles5e';
import { HAMEAU } from './hameau5e';
import { INSTANTS } from './instants5e';
import { ETUVE } from './etuve5e';
import { MONTEE } from './montee5e';
import { PRINTWORKS } from './printworks';
import { RADEAUX } from './radeaux5e';
import { TERRASSES } from './terrasses5e';

const ART: Partial<Record<PlaceId, PlaceArt>> = { lookout: LOOKOUT, archives: ARCHIVES, printworks: PRINTWORKS, beacons: BEACONS, ferry: FERRY, montee: MONTEE, hameau: HAMEAU, radeaux: RADEAUX, croisee: CROISEE, instants: INSTANTS, fumerolles: FUMEROLLES, etuve: ETUVE, terrasses: TERRASSES };

/** Ce qu'un lieu du rivage nord ou du large apporte au monde (son dessin, sa scénette, ses traces), ou rien pour les autres lieux. */
export const placeArt = (place: PlaceId): PlaceArt | null => ART[place] ?? null;

/**
 * Le cap de la caméra devant la porte d'un lieu, à l'arrivée d'un « Y aller » (`PlaceArt.doorView`) : elle regarde le lieu
 * depuis sa porte ; le nord, sans cap donné.
 */
export const doorViewOf = (place: PlaceId): number => ART[place]?.doorView ?? 0;
