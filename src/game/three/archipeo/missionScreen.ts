// « Vue simple » d'une question du monde ouvert (lot 4) : l'écran classique de la même mission (/adventure/:île/:mission,
// ExercisePage), par son adresse, comme depuis le panneau d'une île ; le contenu, la correction et les étoiles sont
// ceux du jeu commun.
import type { MissionInteraction } from '../../world/continu/mission';
import { placeById } from '../../world/continu/plan6e';

/** L'écran de mission classique : on y va par son adresse, comme depuis le panneau d'une île. */
export function missionScreenInteraction(navigate: (path: string) => void): MissionInteraction {
  return {
    open: (placeId, missionId) => navigate(`/adventure/${placeById(placeId).island}/${missionId}`),
  };
}
