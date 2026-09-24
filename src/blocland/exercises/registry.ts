// Types d'exercices : chaque type fournit un composant d'écran et le nombre d'items par écran.
import type { ComponentType } from 'react';
import type { ExerciseItem } from './types';
import { AscensionScreen } from './AscensionScreen';
import { ChasseSonScreen } from './ChasseSonScreen';
import { FilonScreen } from './FilonScreen';
import { MotTroueScreen } from './MotTroueScreen';
import { QcmItem } from './QcmItem';

export interface ScreenAnswer {
  /** Résultat par item de l'écran. */
  results: { key: string; correct: boolean }[];
  /** Détails pour le message de correction ({chosen}, {answer}…). */
  detail?: Record<string, unknown>;
}

export interface ScreenProps {
  /** Les items de cet écran (1 pour un QCM, 4 pour une chasse au son, tous pour un texte). */
  items: ExerciseItem[];
  /** Défini une fois l'écran joué : le composant affiche alors la correction. */
  answered: ScreenAnswer | null;
  /** Le composant appelle onAnswer une seule fois par écran. */
  onAnswer: (answer: ScreenAnswer) => void;
  /** Signale que l'élève a utilisé une aide (le score en tient compte). */
  onHelp: () => void;
  /** Niveau adapté de ce type d'exercice (vitesse, difficulté). */
  level: number;
  /** Paramètres de l'exercice (son cible, lettre cible…). */
  target?: string;
  exerciseId: string;
}

export interface ScreenType {
  component: ComponentType<ScreenProps>;
  /** Items par écran ; 'all' = tout l'exercice sur un écran. */
  batch: number | 'all';
}

/** Type d'exercice (champ `type` du JSON, identique à l'id dans biomes.ts) → écran. */
export const SCREEN_TYPES: Record<string, ScreenType> = {
  qcm: { component: QcmItem, batch: 1 },
  abattage: { component: QcmItem, batch: 1 },
  graines: { component: QcmItem, batch: 1 },
  'chasse-son': { component: ChasseSonScreen, batch: 4 },
  filon: { component: FilonScreen, batch: 1 },
  'mot-troue': { component: MotTroueScreen, batch: 1 },
  ascension: { component: AscensionScreen, batch: 'all' },
};
