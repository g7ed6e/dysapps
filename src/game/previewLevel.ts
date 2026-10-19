// Le niveau d'essai de la pré-version (`?niveau=5e`, avant le `#`), pour le mainteneur : la partie commence au port du
// niveau demandé, comme si la Nef venait d'y accoster, sans rien d'autre de joué. Elle se joue en mémoire, la sauvegarde
// gelée comme pour la mesure automatique : la vraie partie de l'appareil revient au rechargement sans `?niveau`.
// L'adresse ne compte que sur la pré-version et les aperçus de branche (`<branche>-dysapps…workers.dev`) et sur le
// serveur de développement, jamais sur l'application publiée : aucune adresse ne change la partie d'un élève.
import { EMPTY_STATE, type GameState } from './engine/state';
import { sanitizeState } from './engine/sanitize';
import { getArchipelago, voyageId, type ArchipelagoId } from './world/archipelago';
import { ARCHIPELAGO_IDS } from './world/archipelagos';

/** L'hôte des aperçus de branche de Cloudflare (la pré-version est l'aperçu de la branche `preview`). */
const HOTE_DES_APERCUS = '-dysapps.guillaume-delahaye.workers.dev';

/** L'adresse est-elle celle d'un aperçu (la pré-version, une branche) ? */
export const estUnApercu = (hostname: string): boolean => hostname.endsWith(HOTE_DES_APERCUS);

/** Le niveau demandé par `?niveau=` sur un aperçu (`apercu`), s'il est autre que le premier ; `null` sinon. */
export function niveauDepuis(href: string, apercu: boolean): ArchipelagoId | null {
  if (!apercu) return null;
  const niveau = new URL(href, 'http://localhost/').searchParams.get('niveau');
  return ARCHIPELAGO_IDS.find((a) => a === niveau && a !== ARCHIPELAGO_IDS[0]) ?? null;
}

/** La partie au début du niveau `niveau` : les voyages jusqu'à lui faits, le bonhomme à son port, rien d'autre. */
export function partieAuDebutDe(niveau: ArchipelagoId): GameState {
  const avant = ARCHIPELAGO_IDS.slice(1, ARCHIPELAGO_IDS.indexOf(niveau) + 1);
  return sanitizeState({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, links: avant.map(voyageId), place: getArchipelago(niveau).port } });
}

/** Le niveau d'essai de cette page, ou `null`. */
export const niveauDApercu = (): ArchipelagoId | null =>
  typeof window === 'undefined' ? null : niveauDepuis(window.location.href, import.meta.env.DEV || estUnApercu(window.location.hostname));
