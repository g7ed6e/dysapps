// Point d'entrée de la 3D : Three.js n'est téléchargé qu'à la première utilisation.
import { lazy } from 'react';

export const VoxelCanvas = lazy(() => import('./VoxelCanvas'));
export { hasWebGL } from './webgl';
