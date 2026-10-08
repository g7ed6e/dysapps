// Types d'exercices : chaque type fournit un composant d'écran et le nombre d'items par écran.
import { createElement, type ComponentType } from 'react';
import type { ExerciseItem } from './types';
import type { Lang } from '../../core/speech';
import { AscensionScreen } from './AscensionScreen';
import { SoundHuntScreen } from './SoundHuntScreen';
import { LodeScreen } from './LodeScreen';
import { GapWordScreen } from './GapWordScreen';
import { ChoiceItem } from './ChoiceItem';
import { RhymesScreen } from './RhymesScreen';
import { DictationItem } from './DictationItem';
import { FamiliesScreen } from './FamiliesScreen';
import { EnclosureScreen } from './EnclosureScreen';
import { BossScreen } from './BossScreen';
import { CalculationScreen } from './CalculationScreen';
import { StoryScreen } from './StoryScreen';

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
  return createElement(ChoiceItem, { ...props, plainWord: true });
}

/** Type d'exercice (champ `type` du JSON, identique à l'id dans biomes.ts) → écran. */
export const SCREEN_TYPES: Record<string, ScreenType> = {
  qcm: { component: ChoiceItem, batch: 1 },
  'syllables': { component: AbattageItem, batch: 1 },
  'sorting': { component: ChoiceItem, batch: 1 },
  'sound-hunt': { component: SoundHuntScreen, batch: 4, sorting: true },
  'letter-pairs': { component: LodeScreen, batch: 1 },
  'missing-letters': { component: GapWordScreen, batch: 1 },
  'fluency': { component: AscensionScreen, batch: 'all', ordered: true },
  'rhymes': { component: RhymesScreen, batch: 4, sorting: true },
  'sound-discrimination': { component: DictationItem, batch: 1, speaksOnOpen: true },
  'sight-words': { component: DictationItem, batch: 1, speaksOnOpen: true },
  'word-families': { component: FamiliesScreen, batch: 1 },
  'word-classes': { component: EnclosureScreen, batch: 4, sorting: true },
  'e-er-ez': { component: ChoiceItem, batch: 1 },
  boss: { component: BossScreen, batch: 1, ordered: true },
  // Maths : une opération par écran, aide visuelle toujours affichée.
  'times-tables': { component: CalculationScreen, batch: 1 },
  'make-ten': { component: CalculationScreen, batch: 1 },
  'doubles-halves': { component: CalculationScreen, batch: 1 },
  'word-problems': { component: CalculationScreen, batch: 1 },
  'number-line': { component: CalculationScreen, batch: 1 },
  'equivalence': { component: CalculationScreen, batch: 1 },
  'sharing': { component: CalculationScreen, batch: 1 },
  'place-value': { component: CalculationScreen, batch: 1 },
  'ordering': { component: CalculationScreen, batch: 1 },
  'operations': { component: CalculationScreen, batch: 1 },
  'scale': { component: CalculationScreen, batch: 1 },
  'large-numbers': { component: CalculationScreen, batch: 1 },
  'thermometer': { component: CalculationScreen, batch: 1 },
  'adding': { component: CalculationScreen, batch: 1 },
  'subtracting': { component: CalculationScreen, batch: 1 },
  'fractions': { component: CalculationScreen, batch: 1 },
  'proportion-tables': { component: CalculationScreen, batch: 1 },
  'ratio-sharing': { component: CalculationScreen, batch: 1 },
  'percentages': { component: CalculationScreen, batch: 1 },
  'ratios': { component: CalculationScreen, batch: 1 },
  // Français du collège : phrase à trou et règle affichée, même écran.
  'pairs': { component: CalculationScreen, batch: 1 },
  'choices': { component: CalculationScreen, batch: 1 },
  'homophone-sentences': { component: CalculationScreen, batch: 1 },
  'past-tenses': { component: CalculationScreen, batch: 1 },
  'future-tense': { component: CalculationScreen, batch: 1 },
  'tense-recognition': { component: CalculationScreen, batch: 1 },
  'conjunctions': { component: CalculationScreen, batch: 1 },
  'tense-choice': { component: CalculationScreen, batch: 1 },
  'powers': { component: CalculationScreen, batch: 1 },
  'square-roots': { component: CalculationScreen, batch: 1 },
  'scientific-notation': { component: CalculationScreen, batch: 1 },
  'simplifying': { component: CalculationScreen, batch: 1 },
  'expanding': { component: CalculationScreen, batch: 1 },
  'equations': { component: CalculationScreen, batch: 1 },
  'past-participle': { component: CalculationScreen, batch: 1 },
  'adjectives': { component: CalculationScreen, batch: 1 },
  'subject-verb': { component: CalculationScreen, batch: 1 },
  'reflexive-verbs': { component: CalculationScreen, batch: 1 },
  'plurals': { component: CalculationScreen, batch: 1 },
  'word-forms': { component: CalculationScreen, batch: 1 },
  'word-roots': { component: CalculationScreen, batch: 1 },
  'meaning': { component: CalculationScreen, batch: 1 },
  'nuances': { component: CalculationScreen, batch: 1 },
  'pythagoras': { component: CalculationScreen, batch: 1 },
  'thales': { component: CalculationScreen, batch: 1 },
  'trigonometry': { component: CalculationScreen, batch: 1 },
  'mean': { component: CalculationScreen, batch: 1 },
  'data': { component: CalculationScreen, batch: 1 },
  'probability': { component: CalculationScreen, batch: 1 },
  'images': { component: CalculationScreen, batch: 1 },
  'linear': { component: CalculationScreen, batch: 1 },
  'graphs': { component: CalculationScreen, batch: 1 },
  'inference': { component: CalculationScreen, batch: 1 },
  'figures-of-speech': { component: CalculationScreen, batch: 1 },
  'text-connectives': { component: CalculationScreen, batch: 1 },
  'voices': { component: CalculationScreen, batch: 1 },
  // Tour du lecteur (6e) : un petit texte ou une phrase à lire, puis de qui il parle, ou l'analyse de la phrase.
  'comprehension': { component: CalculationScreen, batch: 1 },
  'sentence-order': { component: CalculationScreen, batch: 1 },
  // Anglais (lang: 'en') : les phrases à trou et les nombres sur l'écran à règle, l'écoute sur la dictée.
  'hello': { component: CalculationScreen, batch: 1 },
  'numbers': { component: CalculationScreen, batch: 1 },
  'first-listening': { component: DictationItem, batch: 1, speaksOnOpen: true },
  'signs': { component: CalculationScreen, batch: 1 },
  'story': { component: StoryScreen, batch: 1, listening: true },
  'stories': { component: StoryScreen, batch: 1, listening: true },
  'to-be': { component: CalculationScreen, batch: 1 },
  'have-got': { component: CalculationScreen, batch: 1 },
  'present-simple': { component: CalculationScreen, batch: 1 },
  'shopping': { component: CalculationScreen, batch: 1 },
  'routine': { component: CalculationScreen, batch: 1 },
  'listening': { component: DictationItem, batch: 1, speaksOnOpen: true },
  'notices': { component: CalculationScreen, batch: 1 },
  'ing': { component: CalculationScreen, batch: 1 },
  'past-simple': { component: CalculationScreen, batch: 1 },
  'comparatives': { component: CalculationScreen, batch: 1 },
  'dialogues': { component: DictationItem, batch: 1, speaksOnOpen: true },
  'quantities': { component: CalculationScreen, batch: 1 },
  'irregular-past': { component: CalculationScreen, batch: 1 },
  'future': { component: CalculationScreen, batch: 1 },
  'modals': { component: CalculationScreen, batch: 1 },
  'present-perfect': { component: CalculationScreen, batch: 1 },
  'traditions': { component: CalculationScreen, batch: 1 },
  'understanding': { component: CalculationScreen, batch: 1 },
  'linking-words': { component: CalculationScreen, batch: 1 },
  'false-friends': { component: CalculationScreen, batch: 1 },
  'media': { component: CalculationScreen, batch: 1 },
  'for-since': { component: CalculationScreen, batch: 1 },
  'if': { component: CalculationScreen, batch: 1 },
  'passive': { component: CalculationScreen, batch: 1 },
  // LV2 (lang: 'de' ou 'es'), les écrans de l'anglais : question et réponse entière, nombres, document à lire, article.
  'de-greetings': { component: CalculationScreen, batch: 1 },
  'de-numbers': { component: CalculationScreen, batch: 1 },
  'de-family': { component: CalculationScreen, batch: 1 },
  'de-articles': { component: CalculationScreen, batch: 1 },
  'es-greetings': { component: CalculationScreen, batch: 1 },
  'es-numbers': { component: CalculationScreen, batch: 1 },
  'es-family': { component: CalculationScreen, batch: 1 },
  'es-articles': { component: CalculationScreen, batch: 1 },
  // LV2 du Jardin des heures (4e) : l'heure entendue puis une scène, la journée, un document à lire, la grammaire.
  'de-time': { component: CalculationScreen, batch: 1 },
  'de-my-day': { component: CalculationScreen, batch: 1 },
  'de-timetable': { component: CalculationScreen, batch: 1 },
  'de-modals': { component: CalculationScreen, batch: 1 },
  'es-time': { component: CalculationScreen, batch: 1 },
  'es-my-day': { component: CalculationScreen, batch: 1 },
  'es-timetable': { component: CalculationScreen, batch: 1 },
  'es-ser-estar': { component: CalculationScreen, batch: 1 },
  // LV2 du Refuge des carnets (3e) : le passé du voyage, un récit à lire, voyager et comparer, relier deux idées.
  'de-past': { component: CalculationScreen, batch: 1 },
  'de-stories': { component: CalculationScreen, batch: 1 },
  'de-on-the-road': { component: CalculationScreen, batch: 1 },
  'de-connectives': { component: CalculationScreen, batch: 1 },
  'es-past': { component: CalculationScreen, batch: 1 },
  'es-stories': { component: CalculationScreen, batch: 1 },
  'es-countries': { component: CalculationScreen, batch: 1 },
  'es-connectives': { component: CalculationScreen, batch: 1 },
  // Histoire et géographie (6e) : repères et lexique en question à trou au niveau 1, un document court au niveau 2.
  'early-humans': { component: CalculationScreen, batch: 1 },
  'ancient-peoples': { component: CalculationScreen, batch: 1 },
  'roman-empire': { component: CalculationScreen, batch: 1 },
  'metropolises': { component: CalculationScreen, batch: 1 },
  'low-density': { component: CalculationScreen, batch: 1 },
  'inhabited-world': { component: CalculationScreen, batch: 1 },
  // Histoire et géographie (5e, 4e, 3e) : les mêmes écrans qu'en 6e.
  'christendoms-islam': { component: CalculationScreen, batch: 1 },
  'feudal-west': { component: CalculationScreen, batch: 1 },
  'new-worlds': { component: CalculationScreen, batch: 1 },
  population: { component: CalculationScreen, batch: 1 },
  resources: { component: CalculationScreen, batch: 1 },
  risks: { component: CalculationScreen, batch: 1 },
  enlightenment: { component: CalculationScreen, batch: 1 },
  'industrial-europe': { component: CalculationScreen, batch: 1 },
  'french-society': { component: CalculationScreen, batch: 1 },
  urbanization: { component: CalculationScreen, batch: 1 },
  mobilities: { component: CalculationScreen, batch: 1 },
  globalization: { component: CalculationScreen, batch: 1 },
  'total-wars': { component: CalculationScreen, batch: 1 },
  'world-since-1945': { component: CalculationScreen, batch: 1 },
  republic: { component: CalculationScreen, batch: 1 },
  territories: { component: CalculationScreen, batch: 1 },
  planning: { component: CalculationScreen, batch: 1 },
  'france-eu': { component: CalculationScreen, batch: 1 },
  // Sciences et technologie (6e) : une notion et son lexique, un document court (texte, tableau, schéma décrit en mots),
  // la question et trois choix, le rappel affiché, comme l'histoire-géographie.
  'living-groups': { component: CalculationScreen, batch: 1 },
  'food-growth': { component: CalculationScreen, batch: 1 },
  'planet-earth': { component: CalculationScreen, batch: 1 },
  'states-of-matter': { component: CalculationScreen, batch: 1 },
  'motion-signals': { component: CalculationScreen, batch: 1 },
  'energy-circuits': { component: CalculationScreen, batch: 1 },
  'object-function': { component: CalculationScreen, batch: 1 },
  materials: { component: CalculationScreen, batch: 1 },
  'information-networks': { component: CalculationScreen, batch: 1 },
  // Sciences et technologie (5e, 4e, 3e) : les mêmes écrans qu'en 6e.
  'active-earth': { component: CalculationScreen, batch: 1 },
  'weather-climate': { component: CalculationScreen, batch: 1 },
  'human-impact': { component: CalculationScreen, batch: 1 },
  'changes-of-state': { component: CalculationScreen, batch: 1 },
  'mixtures-density': { component: CalculationScreen, batch: 1 },
  'universe-atoms': { component: CalculationScreen, batch: 1 },
  specifications: { component: CalculationScreen, batch: 1 },
  'technical-solutions': { component: CalculationScreen, batch: 1 },
  'life-cycle': { component: CalculationScreen, batch: 1 },
  'cells-nutrition': { component: CalculationScreen, batch: 1 },
  heredity: { component: CalculationScreen, batch: 1 },
  'species-evolution': { component: CalculationScreen, batch: 1 },
  'light-sound': { component: CalculationScreen, batch: 1 },
  'electric-circuits': { component: CalculationScreen, batch: 1 },
  'chemical-reactions': { component: CalculationScreen, batch: 1 },
  'energy-chain': { component: CalculationScreen, batch: 1 },
  'information-chain': { component: CalculationScreen, batch: 1 },
  simulation: { component: CalculationScreen, batch: 1 },
  'effort-brain': { component: CalculationScreen, batch: 1 },
  'digestion-microbes': { component: CalculationScreen, batch: 1 },
  'puberty-reproduction': { component: CalculationScreen, batch: 1 },
  'motion-forces': { component: CalculationScreen, batch: 1 },
  'energy-power': { component: CalculationScreen, batch: 1 },
  'acids-bases': { component: CalculationScreen, batch: 1 },
  'computer-networks': { component: CalculationScreen, batch: 1 },
  'connected-objects': { component: CalculationScreen, batch: 1 },
  algorithms: { component: CalculationScreen, batch: 1 },
  // La question d'un bloc assemblé (GD-2) : un document à lire sur deux matières, sa question, trois choix, le rappel
  // des deux matières toujours affiché (docs/contenu/assemblage.md). Hors des îles : elle se pose à la Fabrique.
  assembly: { component: CalculationScreen, batch: 1 },
};
