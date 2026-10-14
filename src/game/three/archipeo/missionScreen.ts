// L'ouverture d'une mission à l'arrivée de Kéo, branchée pour le prototype sur l'écran de mission actuel
// (/adventure/:île/:mission, ExercisePage) : le contenu, la correction, les étoiles et le retour restent ceux
// d'aujourd'hui. La mission jouée dans le monde (lot 4) viendra derrière la même interface (`MissionInteraction`).
import type { MissionInteraction } from '../../world/continu/mission';
import { placeById } from '../../world/continu/plan6e';

/** L'écran de mission actuel : on y va par son adresse, comme depuis le panneau d'une île. */
export function missionScreenInteraction(navigate: (path: string) => void): MissionInteraction {
  return {
    open: (placeId, missionId) => navigate(`/adventure/${placeById(placeId).island}/${missionId}`),
  };
}
