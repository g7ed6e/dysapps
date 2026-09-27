// La salle des trophées : un trophée par succès gagné, posé dans le village. Le bloc dit la famille du succès.
import { BADGES, type Progress } from '../core/progress';
import type { BlockId } from './biomes';

export const TROPHIES_TITLE = 'Salle des trophées';
/** L'adresse de la salle (dans le monde : son panneau ; en vue simple : la page Succès). */
export const TROPHIES_PATH = '/aventure/trophees';

/** Le bloc du trophée d'un succès : cristal pour les rangs, quartz pour les Gardiens, lentille pour les voyages, marbre pour les monuments, or sinon. */
export function trophyBlock(badgeId: string): BlockId {
  if (badgeId.startsWith('rang-')) return 'cristal';
  if (['gardien', 'cinq-iles', 'dix-gardiens', 'archipel'].includes(badgeId)) return 'quartz';
  if (['capitaine', 'aeronaute', 'pilote-du-ciel'].includes(badgeId)) return 'lentille';
  if (badgeId === 'patrimoine') return 'marbre';
  return 'or';
}

/** Les trophées posés : un bloc par succès gagné, dans l'ordre des succès. */
export function trophies(badges: Progress['badges']): BlockId[] {
  return BADGES.filter((b) => badges[b.id]).map((b) => trophyBlock(b.id));
}
