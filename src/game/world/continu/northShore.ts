// Le rivage nord du monde continu (GD-20, point 8, lot L7) : la Vigie, les Archives, l'Imprimerie ; le large (lot L9) :
// les Balises, la Gare maritime ; chacun dans son fichier (placeArt.ts). Les fichiers communs (places.ts, scenette.ts,
// questionScene.ts) les lisent ici.
import { ARCHIVES } from './archives';
import { BEACONS } from './beacons';
import { FERRY } from './ferry';
import { LOOKOUT } from './lookout';
import type { PlaceArt } from './placeArt';
import type { PlaceId } from './plan6e';
import { PRINTWORKS } from './printworks';

const ART: Partial<Record<PlaceId, PlaceArt>> = { lookout: LOOKOUT, archives: ARCHIVES, printworks: PRINTWORKS, beacons: BEACONS, ferry: FERRY };

/** Ce qu'un lieu du rivage nord ou du large apporte au monde (son dessin, sa scénette, ses traces), ou rien pour les autres lieux. */
export const placeArt = (place: PlaceId): PlaceArt | null => ART[place] ?? null;
