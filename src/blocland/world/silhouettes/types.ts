// Le relief de marche d'une île (commun aux univers : la grille, la marche, les plans et Blocland le lisent ; le relief
// propre au dessin d'Archipéo s'écrit dans ../modeleDessine/, étape U2), écrit en repère d'île (le socle de la piste Rendu, docs/univers/archipeo/cadrage.md §6) :
// x et y en cases depuis le coin du cœur 16 × 16 (x vers la droite, y vers l'arrière de l'île), sans rien savoir de sa
// place dans le monde. La grille (../map.ts) le pose à la place de l'île ; J5 (docs/conception/separation-jeu-rendu.md)
// n'aura rien à réécrire.

/** Un pic : son centre, sa hauteur au-dessus de l'altitude de l'île (en blocs) et son rayon (en cases). */
export interface Pic {
  x: number;
  y: number;
  h: number;
  r: number;
}

/** Le relief propre d'une île : ses pics (un volcan a son cratère au centre de son pic). Sans pic : collines ou plaine. */
export interface Silhouette {
  pics: Pic[];
}
