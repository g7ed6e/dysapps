// L'habillage du monde de cette page (étape J6 de docs/univers/univers.md §5, rangée par J7) : celui de l'univers
// choisi, lu une fois. Les habillages eux-mêmes sont des données, dans world/skin/ (un fichier par univers) ;
// les parties de la scène, les figures et la page du monde lisent chacune la ligne qui les concerne.
import { HABILLAGES, type Habillage } from './world/skin';
import { renduDuMonde, type Rendu } from './rendering';

export { HABILLAGES, type Habillage };

/** L'habillage d'un rendu (`?rendu=blocs` sur le serveur de développement : celui de Blocland). */
export function habillageDe(rendu: Rendu): Habillage {
  return HABILLAGES[rendu === 'archipeo' ? 'archipeo' : 'blocland'];
}

/** L'habillage du monde de cette page : celui de l'univers choisi (voir rendering.ts). */
export const habillageDuMonde = (): Habillage => habillageDe(renduDuMonde());
