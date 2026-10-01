// Les univers (lot 6) : Archipéo et Blocland habillent le même jeu de leurs textes, ceux de l'univers choisi dans les
// Réglages (Blocland par défaut). Voir docs/conception/cadrage-archipeo.md, « Les fils du lot 6 ».
import { ARCHIPEO } from './archipeo';
import { BLOCLAND } from './blocland';
import { useUniversChoisi } from '../core/SettingsContext';
import { universAffiche } from '../core/univers';
import type { Tier } from '../core/progress';
import type { TextesUnivers, UniversId } from './types';

export type { TextesUnivers, UniversId } from './types';

/** L'univers dont l'élève lit les textes : celui qu'il a choisi, Blocland s'il n'a rien choisi. */
export { universAffiche };

const TEXTES: Record<UniversId, TextesUnivers> = { archipeo: ARCHIPEO, blocland: BLOCLAND };

export function textesDe(univers: UniversId): TextesUnivers {
  return TEXTES[univers];
}

/** Les textes de l'univers affiché, pour un composant : l'univers des réglages, Blocland par défaut. */
export function useTextes(): TextesUnivers {
  return textesDe(universAffiche(useUniversChoisi()));
}

/** Le texte du panneau d'un monument dans un univers : le sien s'il le dessine autrement, sinon celui du monument. */
export function texteDuMonument(
  textes: TextesUnivers,
  monument: { id: string; description: string; done: string },
): { description: string; done: string } {
  return { description: monument.description, done: monument.done, ...textes.monuments[monument.id] };
}

/** Le titre et la condition d'un succès dans un univers : les siens s'il le nomme autrement, sinon ceux du succès. */
export function texteDuSucces(textes: TextesUnivers, succes: { id: string; title: string; description: string }): { title: string; description: string } {
  return textes.succes[succes.id] ?? { title: succes.title, description: succes.description };
}

/** Le nom d'un rôle dans un univers (« Maçon »). */
export function nomDuRole(textes: TextesUnivers, tier: Tier): string {
  return textes.roles[tier];
}
