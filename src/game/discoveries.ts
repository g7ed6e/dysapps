// Ce que dit la créature d'une île quand on y arrive : son accueil (ou ce qu'il faut pour venir, ou « pas de LV2 »),
// et, une fois par appareil, une découverte que le tutoriel ne dit plus (les ouvrages, le Bloc-Navire). Code pur, sauf
// la mémoire des découvertes déjà dites (celle des tutoriels).
import type { TextesUnivers } from '../universes';
import { SANS_LV2, type BiomeId } from './biomes';
import type { GameState } from './engine';
import { hasSeenTutorial, markTutorialSeen } from './Tutorial';
import { isBiomeUnlocked } from './world/archipelago';
import { lockedHint } from './world/goals';

/**
 * Ce que dit la créature à l'ouverture du panneau de son île : « pas de LV2 » sur l'île de la LV2 sans LV2, son accueil
 * sur une île ouverte, sinon ce qu'il faut construire pour y venir.
 */
export function accueilDeLIle(state: GameState, id: BiomeId, sansLv2: boolean, textes: TextesUnivers): string {
  if (sansLv2) return SANS_LV2;
  return isBiomeUnlocked(id, state.world.links) ? textes.creatures[id].greeting : lockedHint(state, id, textes.archipels, textes.libelles);
}

/**
 * La découverte à dire en arrivant sur une île, si elle n'a pas encore été dite sur cet appareil (elle est alors
 * retenue) : sa phrase, les ouvrages sur une île pâle, le Bloc-Navire sur le port où il attend ses blocs ; `null` sinon.
 */
export function decouverteDeLIle(
  state: GameState,
  id: BiomeId,
  { port, navire, textes }: { port: BiomeId; navire: boolean; textes: TextesUnivers },
): string | null {
  const pale = !isBiomeUnlocked(id, state.world.links);
  const auPort = !pale && id === port && navire;
  const quoi = pale ? 'decouverte-ouvrages' : auPort ? 'decouverte-navire' : null;
  if (!quoi || hasSeenTutorial(quoi)) return null;
  markTutorialSeen(quoi);
  return pale ? textes.libelles.decouverteOuvrages : textes.libelles.decouverteNavire;
}
