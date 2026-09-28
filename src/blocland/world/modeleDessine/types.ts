// Le modelé dessiné d'une île (étape U2, docs/conception/univers.md §5) : la forme que le rendu d'un univers donne au
// sol, par-dessus le relief de marche. Le relief de marche (../silhouettes/, lu par ../map.ts) porte la marche, les
// plans, les trajets et les empreintes de la grille : il est commun aux univers, et Blocland le dessine tel quel. Le
// modelé ne change que le sol à facettes d'Archipéo : ni la grille, ni les cubes de Blocland, ni la 2D.

/** Le modelé d'une île, en repère d'île (x et y en cases depuis le coin du cœur, comme ../silhouettes/types.ts). */
export interface Modele {
  /**
   * La hauteur dessinée du dessus d'une colonne de sol libre, à partir de sa hauteur de marche `h` (le z de son cube du
   * dessus, en blocs au-dessus de l'altitude de l'île). Rend un nombre entier de blocs ; rendre `h` laisse la colonne
   * telle quelle. Une colonne où quelque chose est posé (une borne, un plan, un lieu, le quai), l'eau et la lave ne
   * sont jamais modelées.
   */
  hauteur(x: number, y: number, h: number): number;
  /**
   * La matière du dessus d'une colonne modelée (une texture de ../pixels.ts, par exemple « neige » sur le gradin du haut),
   * à partir de sa hauteur dessinée `h` et de sa matière de marche ; sans cette fonction, le dessus garde sa matière.
   */
  dessus?(x: number, y: number, h: number, matiere: string | undefined): string | undefined;
}
