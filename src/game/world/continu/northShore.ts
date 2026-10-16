// Le rivage nord du monde continu (GD-20, point 8, lot L7) : la Vigie, les Archives, l'Imprimerie, chacun dans son
// fichier (placeArt.ts). Les fichiers communs (places.ts, scenette.ts, questionScene.ts) les lisent ici.
import { ARCHIVES } from './archives';
import { LOOKOUT } from './lookout';
import type { PlaceArt } from './placeArt';
import type { PlaceId } from './plan6e';
import { PRINTWORKS } from './printworks';

const ART: Partial<Record<PlaceId, PlaceArt>> = { lookout: LOOKOUT, archives: ARCHIVES, printworks: PRINTWORKS };

/** Ce qu'un lieu du rivage nord apporte au monde (son dessin, sa scénette, ses traces), ou rien pour les autres lieux. */
export const placeArt = (place: PlaceId): PlaceArt | null => ART[place] ?? null;
