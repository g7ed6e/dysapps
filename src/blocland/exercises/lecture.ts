import { frenchTypography } from '../../components/math/RichText';
import type { ExerciseItem } from './types';

/**
 * Ce que la lecture automatique dit en ouvrant un écran : la consigne de la mission au premier écran (`instruction`,
 * `null` ensuite), puis la question en français d'un document à lire. Une seule phrase, pour que la question ne coupe
 * pas la consigne ; le document anglais, lui, n'est lu qu'à la demande (bouton Écouter).
 */
export function autoReadText(instruction: string | null, items: ExerciseItem[] | undefined): string {
  const question = items?.length === 1 && typeof items[0].question === 'string' ? items[0].question : '';
  return [instruction, question]
    .filter((t): t is string => Boolean(t))
    .map(frenchTypography)
    .join(' ');
}
