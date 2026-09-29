import { frenchTypography } from '../../components/math/RichText';
import { estLangueVivante, type Lang } from '../../core/speech';
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

/**
 * Le mot d'une dictée à choix en langue vivante (LV2-3) : un item seul dont l'énoncé a un trou (« Bl…stift »). La
 * lecture automatique le dit dans la voix de la langue dès l'ouverture de l'écran (après la consigne au premier), pour
 * que l'élève entende avant de choisir. Vide sinon.
 */
export function dicteeAutoText(items: ExerciseItem[] | undefined, lang: Lang | undefined): string {
  if (!estLangueVivante(lang) || items?.length !== 1) return '';
  const { prompt, spoken, question } = items[0];
  return typeof prompt === 'string' && prompt.includes('…') && typeof spoken === 'string' && question === undefined ? spoken : '';
}
