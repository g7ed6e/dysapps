// Le monde en cubes (la disposition en grille) : un cube, en cases du monde, et ce qu'on touche pour entrer quelque part.
// Les vues le dessinent (Voxel.tsx en isométrique, three/ en 3D, pixel/ en 2D) ; la grille et la simulation le lisent.

/** Les lieux du village où l'on entre : l'école (ses trois portes, une par matière) et la salle des trophées. */
export type VillagePlaceId = 'ecole' | 'trophees';
/** Ce qu'on touche pour y entrer : un lieu du village, ou un monument (« monument:<identifiant du monument> »). */
export type PlaceId = VillagePlaceId | `monument:${string}`;

export interface VoxelCube {
  x: number;
  y: number;
  z: number;
  /** Couleur de base ; les faces du dessus et de droite sont dérivées automatiquement. */
  color: string;
  /** Couleur explicite du dessus (ex. bloc avec une face « herbe »). */
  top?: string;
  /** Étiquette de sélection en 3D (ex. l'identifiant d'un biome). */
  tag?: string;
  /** Cube d'un pont : l'identifiant du pont. */
  bridge?: string;
  /** Cube d'une borne de mission : « île:mission ». */
  quest?: string;
  /** Cube d'un lieu du village qu'on touche pour y entrer (l'école, la salle des trophées). */
  place?: PlaceId;
  /** Cellule de plan encore à poser : dessinée translucide. */
  ghost?: boolean;
  /** Texture pixel en 3D ; sans texture, une couleur unie légèrement grainée. */
  texture?: string;
  /** Île verrouillée : couleurs délavées (la texture est gardée, effacée vers le gris). */
  muted?: boolean;
  /** Élément de décor dont le cube fait partie (« foret/arbre@12,4 ») : la vue 2D en fait un seul dessin. */
  decor?: string;
  /**
   * Cube du sol ou de la roche d'une île (lot R2) : le rendu Archipéo le dessine en facettes (world/landMesh.ts) au
   * lieu d'un cube. Les autres vues l'ignorent.
   */
  sol?: true;
}
