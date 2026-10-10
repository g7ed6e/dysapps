// Le monde en cubes (la disposition en grille) : un cube, en cases du monde, et ce qu'on touche pour entrer quelque part.
// Les vues le dessinent (Voxel.tsx en isométrique, three/ en 3D) ; la grille et la simulation le lisent.

/**
 * Les lieux du village où l'on entre : l'école (ses trois portes, une par matière), la salle des trophées, et le lieu où
 * l'on assemble les blocs (GD-2 : la Fabrique dans Blocland, la Halle aux matériaux dans Archipéo).
 */
export type VillagePlaceId = 'school' | 'trophies' | 'assembly';
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
  /**
   * Bloc allumé : il brille de la lueur des lanternes, de jour comme de nuit, sans clignoter (GD-10 : la lanterne du phare
   * du large, une fois toutes ses cases posées, `MonumentDef.litWhenDone`). Ne compte pas sur un fantôme ni un bloc délavé.
   */
  lit?: true;
  /** Île verrouillée : couleurs délavées (la texture est gardée, effacée vers le gris). */
  muted?: boolean;
  /** Élément de décor dont le cube fait partie (« foret/arbre@12,4 ») : le décor en fait un seul dessin. */
  decor?: string;
  /**
   * Cube du sol ou de la roche d'une île (lot R2) : le rendu Archipéo le dessine en facettes (world/landMesh.ts) au
   * lieu d'un cube. Les autres vues l'ignorent.
   */
  sol?: true;
  /**
   * Cube d'une petite construction (GD-7, PR 3) : son dessous n'est pas dessiné. Posé sur le sol, il est caché ; sous un
   * porte-à-faux, il regarde vers le bas, et aucune caméra ne le voit d'en haut. Sans lui, la face du dessous d'un bloc
   * qui n'en a pas ailleurs ajouterait un appel de dessin (le maillage fait un groupe par texture et par face).
   */
  sansDessous?: true;
  /**
   * Cube d'une petite construction (GD-7, PR 3) : les objets du quai ne le voient pas (`quaySpots`, world/terrain.ts),
   * qui réservent sa place, qu'elle soit posée ou non.
   */
  petiteConstruction?: true;
  /**
   * Le dessus dessiné avec la texture des côtés (en 3D, `buildMesh`) : une porte d'une petite construction (GD-7, PR 3)
   * montre son dessus, qu'aucune porte du monde ne montre ailleurs ; dessiné à part, il ajouterait un appel de dessin.
   */
  dessusCommeLesCotes?: true;
}
