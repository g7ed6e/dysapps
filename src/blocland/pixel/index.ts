// Point d'entrée de la vue 2D : son code n'est téléchargé qu'à la première utilisation, et sans Three.js.
import { lazy } from 'react';

export const WorldCanvas2D = lazy(() => import('./WorldCanvas2D'));
export { hasCanvas2D } from './canvas2d';
