// L'habillage du monde de cette page (étape J6 de docs/univers/univers.md §5, rangée par J7) : celui de l'univers
// choisi, lu une fois. Les habillages eux-mêmes sont des données, dans world/habillage/ (un fichier par univers) ;
// les parties de la scène, la 2D, les figures et la page du monde lisent chacune la ligne qui les concerne.
import { HABILLAGES, type Habillage } from './world/habillage';
import { renduDuMonde, type Rendu } from './rendu';

export { HABILLAGES, type Habillage };

/** L'habillage d'un rendu (`?rendu=blocs` sur le serveur de développement : celui de Blocland). */
export function habillageDe(rendu: Rendu): Habillage {
  return HABILLAGES[rendu === 'archipeo' ? 'archipeo' : 'blocland'];
}

/** L'habillage du monde de cette page : celui de l'univers choisi (voir rendu.ts). */
export const habillageDuMonde = (): Habillage => habillageDe(renduDuMonde());
