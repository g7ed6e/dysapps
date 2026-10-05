// Point d'entrée de la 3D : Three.js n'est téléchargé qu'à la première utilisation.
import { lazy } from 'react';

export const VoxelCanvas = lazy(() => import('./VoxelCanvas'));
/** Un personnage d'Archipéo seul (lot R6, dans l’univers Archipéo (voir rendering.ts)) : la bulle d'une créature, le défi d'un Gardien. */
export const PersonnageCanvas = lazy(() => import('./PersonnageCanvas'));
export { hasWebGL } from './webgl';
export const WorldCanvas = lazy(() => import('./WorldCanvas'));
