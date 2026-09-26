// Les bulles de première arrivée dans un archipel (deux par archipel), lues à voix haute, une seule fois par appareil
// (voir Tutorial). Partagées par le monde 3D (WorldPage) et la vue simple (la page du port).
import type { ArchipelagoId } from './world/archipelago';

export const ARRIVAL_STEPS: Record<ArchipelagoId, string[]> = {
  '6e': [],
  '5e': [
    'Bienvenue dans les Collines du Large, l’archipel de 5e ! Quatre îles, plus hautes et plus fraîches. Les règles ne changent pas : quêtes, blocs, plans, Gardiens.',
    'Le Bloc-Navire reste au port, sur le Marché des proportions. Pour revenir en 6e, ouvre le panneau du Marché et touche Revenir. Pour aller en 4e, il lui faut un ballon : ses blocs se posent ici.',
  ],
  '4e': [
    'Bienvenue dans les Monts de Feu, l’archipel de 4e ! Ici, le haut-fourneau de la Forge chauffe jour et nuit.',
    'Le Bloc-Navire est amarré à l’Atelier du calcul littéral. Son réacteur se construit ici : quand il est prêt, tu monteras jusqu’aux Îles du Ciel.',
  ],
  '3e': [
    'Bienvenue dans les Îles du Ciel, l’archipel de 3e ! Les îles flottent dans les nuages : tu es tout en haut.',
    'Le phare de Fi te guide. Le Bloc-Navire peut te ramener sur n’importe quel archipel : ouvre le panneau du Phare et choisis.',
  ],
};
