// Types d'exercices : chaque type fournit un composant d'item.
import type { ComponentType } from 'react';
import type { ExerciseItem } from './types';
import { QcmItem } from './QcmItem';

export interface Answered {
  correct: boolean;
  /** Ce que l'élève a choisi, la bonne réponse, et ce qu'on a entendu (pour le message). */
  chosen?: string;
  answer?: string;
  heard?: unknown;
  word?: string;
}

export interface ItemProps {
  item: ExerciseItem;
  /** Défini une fois l'item joué : le composant affiche alors la correction. */
  answered: Answered | null;
  /** Le composant appelle onAnswer une seule fois par item, avec le détail pour le message. */
  onAnswer: (correct: boolean, detail?: Omit<Answered, 'correct'>) => void;
  /** Signale que l'élève a utilisé une aide (le score en tient compte). */
  onHelp: () => void;
}

/** Type d'exercice (champ `type` du JSON, identique à l'id dans biomes.ts) → composant d'item. */
export const ITEM_COMPONENTS: Record<string, ComponentType<ItemProps>> = {
  qcm: QcmItem,
  // En attendant son composant dédié (étape 3), l'abattage syllabique utilise le QCM générique.
  abattage: QcmItem,
};
