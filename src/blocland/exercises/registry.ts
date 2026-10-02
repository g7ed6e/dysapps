// Types d'exercices : chaque type fournit un composant d'écran et le nombre d'items par écran.
import { createElement, type ComponentType } from 'react';
import type { ExerciseItem } from './types';
import type { Lang } from '../../core/speech';
import { AscensionScreen } from './AscensionScreen';
import { ChasseSonScreen } from './ChasseSonScreen';
import { FilonScreen } from './FilonScreen';
import { MotTroueScreen } from './MotTroueScreen';
import { QcmItem } from './QcmItem';
import { RimesScreen } from './RimesScreen';
import { DicteeItem } from './DicteeItem';
import { FamillesScreen } from './FamillesScreen';
import { EnclosScreen } from './EnclosScreen';
import { BossScreen } from './BossScreen';
import { CalculScreen } from './CalculScreen';
import { RecitScreen } from './RecitScreen';

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
  /** Langue du contenu de l'exercice (voir `ExerciseDef.lang`) ; français par défaut. */
  lang?: Lang;
  /** Deuxième essai : les réponses déjà tentées, barrées (écrans à choix). */
  ruledOut?: string[];
}

export interface ScreenType {
  component: ComponentType<ScreenProps>;
  /** Items par écran ; 'all' = tout l'exercice sur un écran. */
  batch: number | 'all';
  /** Les items forment une suite (paragraphes d'un texte) : on ne les mélange pas. */
  ordered?: boolean;
  /** L'écran lit lui-même son item en s'ouvrant (dictée) : la consigne n'est alors pas lue automatiquement. */
  speaksOnOpen?: boolean;
  /** Une écoute d'histoire (Story) : la lecture automatique dit la question en français, puis l'histoire dans sa langue. */
  listening?: boolean;
  /** Un tri (mots, sujets) : après une erreur, on peut refaire l'écran une fois (voir `retryAllowed`). */
  sorting?: boolean;
}

/**
 * Deuxième essai, comme dans les missions du portail : après une erreur, on peut réessayer une fois (le point compte
 * moitié). Pour un écran à choix, seulement s'il reste au moins deux réponses (avec deux choix, le second essai
 * donnerait la réponse) ; pour un tri, toujours (l'écran ne dit pas quelles cartes sont fausses). Pas au Gardien : c'est l'épreuve.
 */
export function retryAllowed(type: string, items: ExerciseItem[]): boolean {
  const screen = SCREEN_TYPES[type];
  if (!screen || type === 'boss') return false;
  if (screen.sorting) return true;
  const choices = items.length === 1 ? items[0].choices : undefined;
  return Array.isArray(choices) && choices.length >= 3;
}

/** Abattage : le mot est affiché sans syllabes en couleurs, qui donneraient la réponse. */
function AbattageItem(props: ScreenProps) {
  return createElement(QcmItem, { ...props, plainWord: true });
}

/** Type d'exercice (champ `type` du JSON, identique à l'id dans biomes.ts) → écran. */
export const SCREEN_TYPES: Record<string, ScreenType> = {
  qcm: { component: QcmItem, batch: 1 },
  'syllables': { component: AbattageItem, batch: 1 },
  'sorting': { component: QcmItem, batch: 1 },
  'sound-hunt': { component: ChasseSonScreen, batch: 4, sorting: true },
  'letter-pairs': { component: FilonScreen, batch: 1 },
  'missing-letters': { component: MotTroueScreen, batch: 1 },
  'fluency': { component: AscensionScreen, batch: 'all', ordered: true },
  'rhymes': { component: RimesScreen, batch: 4, sorting: true },
  'sound-discrimination': { component: DicteeItem, batch: 1, speaksOnOpen: true },
  'sight-words': { component: DicteeItem, batch: 1, speaksOnOpen: true },
  'word-families': { component: FamillesScreen, batch: 1 },
  'word-classes': { component: EnclosScreen, batch: 4, sorting: true },
  'e-er-ez': { component: QcmItem, batch: 1 },
  boss: { component: BossScreen, batch: 1, ordered: true },
  // Maths : une opération par écran, aide visuelle toujours affichée.
  'times-tables': { component: CalculScreen, batch: 1 },
  'make-ten': { component: CalculScreen, batch: 1 },
  'doubles-halves': { component: CalculScreen, batch: 1 },
  'word-problems': { component: CalculScreen, batch: 1 },
  'number-line': { component: CalculScreen, batch: 1 },
  'equivalence': { component: CalculScreen, batch: 1 },
  'sharing': { component: CalculScreen, batch: 1 },
  'place-value': { component: CalculScreen, batch: 1 },
  'ordering': { component: CalculScreen, batch: 1 },
  'operations': { component: CalculScreen, batch: 1 },
  'scale': { component: CalculScreen, batch: 1 },
  'large-numbers': { component: CalculScreen, batch: 1 },
  'thermometer': { component: CalculScreen, batch: 1 },
  'adding': { component: CalculScreen, batch: 1 },
  'subtracting': { component: CalculScreen, batch: 1 },
  'fractions': { component: CalculScreen, batch: 1 },
  'proportion-tables': { component: CalculScreen, batch: 1 },
  'percentages': { component: CalculScreen, batch: 1 },
  'ratios': { component: CalculScreen, batch: 1 },
  // Français du collège : phrase à trou et règle affichée, même écran.
  'pairs': { component: CalculScreen, batch: 1 },
  'choices': { component: CalculScreen, batch: 1 },
  'homophone-sentences': { component: CalculScreen, batch: 1 },
  'past-tenses': { component: CalculScreen, batch: 1 },
  'future-tense': { component: CalculScreen, batch: 1 },
  'subjunctive': { component: CalculScreen, batch: 1 },
  'tense-choice': { component: CalculScreen, batch: 1 },
  'powers': { component: CalculScreen, batch: 1 },
  'square-roots': { component: CalculScreen, batch: 1 },
  'scientific-notation': { component: CalculScreen, batch: 1 },
  'simplifying': { component: CalculScreen, batch: 1 },
  'expanding': { component: CalculScreen, batch: 1 },
  'equations': { component: CalculScreen, batch: 1 },
  'past-participle': { component: CalculScreen, batch: 1 },
  'adjectives': { component: CalculScreen, batch: 1 },
  'subject-verb': { component: CalculScreen, batch: 1 },
  'reflexive-verbs': { component: CalculScreen, batch: 1 },
  'plurals': { component: CalculScreen, batch: 1 },
  'word-forms': { component: CalculScreen, batch: 1 },
  'word-roots': { component: CalculScreen, batch: 1 },
  'meaning': { component: CalculScreen, batch: 1 },
  'nuances': { component: CalculScreen, batch: 1 },
  'pythagoras': { component: CalculScreen, batch: 1 },
  'thales': { component: CalculScreen, batch: 1 },
  'trigonometry': { component: CalculScreen, batch: 1 },
  'mean': { component: CalculScreen, batch: 1 },
  'data': { component: CalculScreen, batch: 1 },
  'probability': { component: CalculScreen, batch: 1 },
  'images': { component: CalculScreen, batch: 1 },
  'linear': { component: CalculScreen, batch: 1 },
  'graphs': { component: CalculScreen, batch: 1 },
  'inference': { component: CalculScreen, batch: 1 },
  'figures-of-speech': { component: CalculScreen, batch: 1 },
  'text-connectives': { component: CalculScreen, batch: 1 },
  'voices': { component: CalculScreen, batch: 1 },
  // Tour du lecteur (6e) : un petit texte ou une phrase à lire, puis de qui il parle, ou l'analyse de la phrase.
  'comprehension': { component: CalculScreen, batch: 1 },
  'sentence-order': { component: CalculScreen, batch: 1 },
  // Anglais (lang: 'en') : les phrases à trou et les nombres sur l'écran à règle, l'écoute sur la dictée.
  'hello': { component: CalculScreen, batch: 1 },
  'numbers': { component: CalculScreen, batch: 1 },
  'first-listening': { component: DicteeItem, batch: 1, speaksOnOpen: true },
  'signs': { component: CalculScreen, batch: 1 },
  'story': { component: RecitScreen, batch: 1, listening: true },
  'stories': { component: RecitScreen, batch: 1, listening: true },
  'to-be': { component: CalculScreen, batch: 1 },
  'have-got': { component: CalculScreen, batch: 1 },
  'present-simple': { component: CalculScreen, batch: 1 },
  'shopping': { component: CalculScreen, batch: 1 },
  'routine': { component: CalculScreen, batch: 1 },
  'listening': { component: DicteeItem, batch: 1, speaksOnOpen: true },
  'notices': { component: CalculScreen, batch: 1 },
  'ing': { component: CalculScreen, batch: 1 },
  'past-simple': { component: CalculScreen, batch: 1 },
  'comparatives': { component: CalculScreen, batch: 1 },
  'dialogues': { component: DicteeItem, batch: 1, speaksOnOpen: true },
  'quantities': { component: CalculScreen, batch: 1 },
  'irregular-past': { component: CalculScreen, batch: 1 },
  'future': { component: CalculScreen, batch: 1 },
  'modals': { component: CalculScreen, batch: 1 },
  'present-perfect': { component: CalculScreen, batch: 1 },
  'traditions': { component: CalculScreen, batch: 1 },
  'understanding': { component: CalculScreen, batch: 1 },
  'linking-words': { component: CalculScreen, batch: 1 },
  'false-friends': { component: CalculScreen, batch: 1 },
  'media': { component: CalculScreen, batch: 1 },
  'for-since': { component: CalculScreen, batch: 1 },
  'if': { component: CalculScreen, batch: 1 },
  'passive': { component: CalculScreen, batch: 1 },
  // LV2 (lang: 'de' ou 'es'), les écrans de l'anglais : question et réponse entière, nombres, document à lire, article.
  'de-greetings': { component: CalculScreen, batch: 1 },
  'de-numbers': { component: CalculScreen, batch: 1 },
  'de-family': { component: CalculScreen, batch: 1 },
  'de-articles': { component: CalculScreen, batch: 1 },
  'es-greetings': { component: CalculScreen, batch: 1 },
  'es-numbers': { component: CalculScreen, batch: 1 },
  'es-family': { component: CalculScreen, batch: 1 },
  'es-articles': { component: CalculScreen, batch: 1 },
  // LV2 du Jardin des heures (4e) : l'heure entendue puis une scène, la journée, un document à lire, la grammaire.
  'de-time': { component: CalculScreen, batch: 1 },
  'de-my-day': { component: CalculScreen, batch: 1 },
  'de-timetable': { component: CalculScreen, batch: 1 },
  'de-modals': { component: CalculScreen, batch: 1 },
  'es-time': { component: CalculScreen, batch: 1 },
  'es-my-day': { component: CalculScreen, batch: 1 },
  'es-timetable': { component: CalculScreen, batch: 1 },
  'es-ser-estar': { component: CalculScreen, batch: 1 },
  // LV2 du Refuge des carnets (3e) : le passé du voyage, un récit à lire, voyager et comparer, relier deux idées.
  'de-past': { component: CalculScreen, batch: 1 },
  'de-stories': { component: CalculScreen, batch: 1 },
  'de-on-the-road': { component: CalculScreen, batch: 1 },
  'de-connectives': { component: CalculScreen, batch: 1 },
  'es-past': { component: CalculScreen, batch: 1 },
  'es-stories': { component: CalculScreen, batch: 1 },
  'es-countries': { component: CalculScreen, batch: 1 },
  'es-connectives': { component: CalculScreen, batch: 1 },
  // La question d'un bloc assemblé (GD-2) : un document à lire sur deux matières, sa question, trois choix, le rappel
  // des deux matières toujours affiché (docs/contenu/assemblage.md). Hors des îles : elle se pose à la Fabrique.
  assembly: { component: CalculScreen, batch: 1 },
};
