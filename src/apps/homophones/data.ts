import type { Question } from '../../components/QuizSession';
import { shuffle } from '../../core/random';
import rawSets from './sets.json';

export interface HomophoneSet {
  id: string;
  level: 1 | 2 | 3;
  /** Libellé affiché, ex. « a / à ». */
  label: string;
  /** Réponses proposées, toujours dans le même ordre (repères stables pour les élèves dys). */
  choices: string[];
  /** Astuce de remplacement, proposée en joker. */
  hint: string;
  /** Règle affichée après la réponse, pour chaque choix. */
  rules: Record<string, string>;
  sentences: { text: string; answer: string }[];
}

// Le JSON est validé par les tests (data.test.ts).
export const SETS = rawSets as unknown as HomophoneSet[];

export const LEVELS = [
  { level: 1, title: 'Les bases' },
  { level: 2, title: 'Confirmé' },
  { level: 3, title: 'Expert' },
] as const;

export type Level = (typeof LEVELS)[number]['level'];

/** Nombre de questions d'une quête par niveau. */
export const QUESTIONS_PER_QUEST = 10;

export function setsForLevel(level: Level): HomophoneSet[] {
  return SETS.filter((s) => s.level === level);
}

function toQuestion(set: HomophoneSet, index: number): Question {
  const sentence = set.sentences[index];
  return {
    id: `${set.id}-${index}`,
    prompt: sentence.text,
    choices: set.choices,
    answer: sentence.answer,
    hint: set.hint,
    explanation: set.rules[sentence.answer],
  };
}

/** Quête d'un niveau : phrases tirées au hasard dans toutes ses séries, sans doublon. */
export function questionsForLevel(level: Level, count = QUESTIONS_PER_QUEST, rng = Math.random): Question[] {
  const pool = setsForLevel(level).flatMap((set) => set.sentences.map((_, i) => toQuestion(set, i)));
  return shuffle(pool, rng).slice(0, count);
}

/** Entraînement ciblé sur une seule série (toutes ses phrases, dans le désordre). */
export function questionsForSet(setId: string, rng = Math.random): Question[] {
  const set = SETS.find((s) => s.id === setId);
  if (!set) return [];
  return shuffle(
    set.sentences.map((_, i) => toQuestion(set, i)),
    rng,
  );
}
