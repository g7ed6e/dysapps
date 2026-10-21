// Le rivage nord du monde continu (GD-20, point 8, lot L7) : la Vigie, les Archives, l'Imprimerie ; le large (lot L9) :
// les Balises, la Gare maritime ; chacun dans son fichier (placeArt.ts). Les fichiers communs (places.ts, scenette.ts,
// questionScene.ts) les lisent ici. Au 5e, la Montée (GD-22, lot 3), dans ./montee5e.ts ; le Hameau (lot 5), dans ./hameau5e.ts ;
// les Radeaux (lot 6), dans ./radeaux5e.ts ; la Croisée (lot 7), dans ./croisee5e.ts ; les Instants (lot 8), dans
// ./instants5e.ts ; les Fumerolles (lot 9), dans ./fumerolles5e.ts ; l'Étuve (lot 10), dans ./etuve5e.ts ; les
// Terrasses (lot 11), dans ./terrasses5e.ts ; l'Auberge (lot 12), dans ./auberge5e.ts ; le Donjon (lot 13a), dans
// ./donjon5e.ts.
import { ARCHIVES } from './archives';
import { AUBERGE } from './auberge5e';
import { BEACONS } from './beacons';
import { DONJON } from './donjon5e';
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

const ART: Partial<Record<PlaceId, PlaceArt>> = { lookout: LOOKOUT, archives: ARCHIVES, printworks: PRINTWORKS, beacons: BEACONS, ferry: FERRY, montee: MONTEE, hameau: HAMEAU, radeaux: RADEAUX, croisee: CROISEE, instants: INSTANTS, fumerolles: FUMEROLLES, etuve: ETUVE, terrasses: TERRASSES, auberge: AUBERGE, donjon: DONJON };

/** Ce qu'un lieu du rivage nord ou du large apporte au monde (son dessin, sa scénette, ses traces), ou rien pour les autres lieux. */
export const placeArt = (place: PlaceId): PlaceArt | null => ART[place] ?? null;

/**
 * Le cap de la caméra devant la porte d'un lieu, à l'arrivée d'un « Y aller » (`PlaceArt.doorView`) : elle regarde le lieu
 * depuis sa porte ; le nord, sans cap donné.
 */
export const doorViewOf = (place: PlaceId): number => ART[place]?.doorView ?? 0;

/**
 * Le regard d'arrivée à la porte d'un lieu trop haut pour la caméra qui suit (`PlaceArt.arrivalView`) : le bord du haut
 * qu'elle cadre, depuis le centre du lieu, et son recul ; rien : la caméra qui suit.
 */
export const arrivalViewOf = (place: PlaceId): NonNullable<PlaceArt['arrivalView']> | null => ART[place]?.arrivalView ?? null;
