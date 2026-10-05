// Les bulles pratiques de première arrivée dans un archipel, après le mot d'arrivée (src/univers/baleine.ts), lues à
// voix haute, une seule fois par appareil (voir Tutorial). Partagées par le monde 3D (WorldPage) et la vue simple (la
// page du port). Les noms des archipels viennent de l'appelant : ceux de l'univers affiché (GD-1).
import type { ArchipelagoId, NomsArchipels } from './world/archipelago';

/** Ce qu'il faut savoir du Bloc-Navire en arrivant dans un archipel (rien en 6e : on y commence). */
export function pagesDArrivee(a: ArchipelagoId, noms: NomsArchipels): string[] {
  switch (a) {
    case '6e':
      return [];
    case '5e':
      return [
        'Le Bloc-Navire reste au port, sur le Marché des proportions. Pour revenir en 6e, ouvre le panneau du Marché et touche Revenir. Pour aller en 4e, il lui faut un ballon : ses blocs se posent ici.',
      ];
    case '4e':
      return [`Le Bloc-Navire est amarré à l’Atelier du calcul littéral. Son réacteur se construit ici : quand il est prêt, tu monteras jusqu’aux ${noms['3e']}.`];
    case '3e':
      return ['Le phare de Fi te guide. Le Bloc-Navire peut te ramener sur n’importe quel archipel : ouvre le panneau du Phare et choisis.'];
  }
}
