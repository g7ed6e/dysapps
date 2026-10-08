import type { FormeDeLIle } from '../formes';

// Le relief de marche d'une île (commun aux univers : la grille, la marche, les plans et Blocland le lisent ; le relief
// propre au dessin d'Archipéo s'écrit dans ../drawnModel/, étape U2), écrit en repère d'île (le socle de la piste Rendu, docs/univers/archipeo/cadrage.md §6) :
// x et y en cases depuis le coin du cœur 16 × 16 (x vers la droite, y vers l'arrière de l'île), sans rien savoir de sa
// place dans le monde. La grille (../map.ts) le pose à la place de l'île ; J5 (docs/conception/separation-jeu-rendu.md)
// n'aura rien à réécrire.

/** Un pic : son centre, sa hauteur au-dessus de l'altitude de l'île (en blocs) et son rayon (en cases). */
interface Pic {
  x: number;
  y: number;
  h: number;
  r: number;
}

/**
 * Le relief propre d'une île : ses pics (un volcan a son cratère au centre de son pic). Sans pic : collines ou plaine.
 * `forme` (GD-12) : la forme de sa terre autour du cœur, prise dans le catalogue (../formes.ts) et orientée dans le
 * repère de l'île ; sans elle, la côte mince de GD-11 autour du cœur.
 */
export interface Silhouette {
  pics: Pic[];
  forme?: FormeDeLIle;
  /**
   * Les coins du cœur qui restent carrés (GD-12, point 4), dans le repère de l'île, quand une petite construction ou un
   * objet de quête se tient contre eux (../formes.test.ts le vérifie) ; le carré du Gardien, lui, se voit dans ../map.ts.
   */
  squareCorners?: readonly CoreCorner[];
}

/** Un coin du cœur d'une île, dans son repère : devant (y plus petit) ou au fond, à gauche (x plus petit) ou à droite. */
type CoreCorner = 'devant-gauche' | 'devant-droite' | 'fond-gauche' | 'fond-droite';
