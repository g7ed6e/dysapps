// Point d'entrée de la vue 2D, qui n'est pas un repli de la 3D : aucun écran ne l'affiche aujourd'hui, elle servira
// de base à un univers dessiné en 2D. Son code n'est chargé qu'à la demande, et sans Three.js.
import { lazy } from 'react';

export const WorldCanvas2D = lazy(() => import('./WorldCanvas2D'));
export { hasCanvas2D } from './canvas2d';
