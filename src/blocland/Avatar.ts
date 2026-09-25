// Le bonhomme : l'avatar de l'élève, dessiné en cubes comme les créatures. Il se tient sur l'île où l'on est,
// et marche d'île en île le long des ouvrages construits : on voit d'un coup d'œil jusqu'où on est arrivé.
import { fromLayers } from './Creatures';
import type { VoxelCube } from './Voxel';

/** Trois cubes de large, deux de profond, six de haut : bottes, salopette bleue, tee-shirt jaune, tête, casquette rouge. */
export const AVATAR_CUBES: VoxelCube[] = fromLayers(
  [
    ['b.b', '...'],
    ['b.b', '...'],
    ['SSS', '...'],
    ['JSJ', '...'],
    ['PPP', '...'],
    ['CCC', 'C..'],
  ],
  { b: '#3b2d20', S: '#3f6fb5', J: '#f2c944', P: '#f1c9a5', C: '#d9453f' },
);

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };
