import type { Question } from '../../components/QuizSession';
import { placeChoices } from '../../core/choices';
import { shuffle } from '../../core/random';
import rawThemes from './themes.json';

export interface Word {
  /** Le mot anglais, lu en voix anglaise. */
  en: string;
  /** Son sens, avec l'article (« le chien »). */
  fr: string;
  /** Deux écritures fautives vraisemblables (« dogg », « dogue ») pour le niveau « J'écris ». */
  traps: string[];
}

export interface Theme {
  id: string;
  label: string;
  words: Word[];
}

// Le JSON est validé par les tests (data.test.ts).
export const THEMES = rawThemes as Theme[];

export const LEVELS = [
  { level: 1, title: 'J’écoute', description: 'Un mot anglais : trouve son sens.' },
  { level: 2, title: 'Je traduis', description: 'Un mot français : trouve le mot anglais.' },
  { level: 3, title: 'J’écris', description: 'Écoute le mot anglais : trouve la bonne écriture.' },
] as const;

export type Level = (typeof LEVELS)[number]['level'];

/** Nombre de questions d'une mission par niveau. */
export const QUESTIONS_PER_QUEST = 10;

/** Nombre de réponses proposées : le mot et trois autres du même thème. */
const CHOICES = 4;

type Rng = () => number;

function question(theme: Theme, word: Word, level: Level, rng: Rng): Question {
  const id = `${theme.id}-${word.en}-${level}`;
  const explanation = `${word.en} = ${word.fr}`;
  const others = shuffle(
    theme.words.filter((w) => w !== word),
    rng,
  ).slice(0, CHOICES - 1);
  if (level === 1) {
    return { id, prompt: word.en, promptLang: 'en', choices: [word.fr, ...others.map((w) => w.fr)], answer: word.fr, explanation };
  }
  if (level === 2) {
    return { id, prompt: word.fr, choices: [word.en, ...others.map((w) => w.en)], choicesLang: 'en', answer: word.en, explanation };
  }
  // J'écris : le sens affiché, le mot lu en anglais, trois écritures dont deux fautives.
  return {
    id,
    prompt: word.fr,
    spokenPrompt: word.en,
    spokenLang: 'en',
    choices: [word.en, ...word.traps],
    choicesLang: 'en',
    answer: word.en,
    hint: 'Écoute le mot en anglais, puis regarde bien chaque lettre.',
    explanation,
  };
}

/** Mission d'un niveau : des mots tirés dans tous les thèmes, sans doublon, la bonne réponse à une place au hasard. */
export function questionsForLevel(level: Level, count = QUESTIONS_PER_QUEST, rng: Rng = Math.random): Question[] {
  const pool = THEMES.flatMap((theme) => theme.words.map((word) => ({ theme, word })));
  const picked = shuffle(pool, rng)
    .slice(0, count)
    .map(({ theme, word }) => question(theme, word, level, rng));
  return placeChoices(picked, rng);
}

/** Entraînement ciblé sur un thème : chaque mot une fois, dans un sens puis dans l'autre au hasard. */
export function questionsForTheme(themeId: string, rng: Rng = Math.random): Question[] {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return [];
  const picked = shuffle(theme.words, rng).map((word) => question(theme, word, rng() < 0.5 ? 1 : 2, rng));
  return placeChoices(picked, rng);
}
