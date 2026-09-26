import type { Question } from '../../components/QuizSession';
import { placeChoices } from '../../core/choices';
import { shuffle } from '../../core/random';
import rawVerbs from './verbs.json';

export interface Verb {
  /** Base verbale (« go »). */
  base: string;
  /** Prétérit (« went ») ; « was / were » pour be. */
  preterit: string;
  /** Participe passé (« gone »). */
  participle: string;
  /** Sens en français. */
  fr: string;
  level: 1 | 2 | 3;
  /** Erreurs d'élève vraisemblables, proposées quand les formes se ressemblent (« putted », « buyed »). */
  traps?: string[];
  /** false : pas de fausse forme en -ed (« beed » n'aurait pas de sens). */
  regular?: boolean;
}

// Le JSON est validé par les tests (data.test.ts).
export const VERBS = rawVerbs as Verb[];

export const LEVELS = [
  { level: 1, title: 'Les indispensables' },
  { level: 2, title: 'Les fréquents' },
  { level: 3, title: 'Pour aller plus loin' },
] as const;

export type Level = (typeof LEVELS)[number]['level'];

export type Form = 'preterit' | 'participle';

/** Nombre de questions d'une quête par niveau. */
export const QUESTIONS_PER_QUEST = 10;

/** Nombre de réponses proposées (moins quand il n'y a pas assez de pièges différents). */
const CHOICES = 4;

type Rng = () => number;

export const FORM_NAME: Record<Form, string> = { preterit: 'Prétérit', participle: 'Participe passé' };

/** La faute la plus fréquente : traiter le verbe comme un verbe régulier (goed, buyed, studyed → studied). */
export function regularized(base: string): string {
  if (base.endsWith('e')) return `${base}d`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ied`;
  return `${base}ed`;
}

/** Les réponses proposées : la bonne, l'autre forme, la base, la fausse forme en -ed, puis les pièges, sans doublon. */
export function choicesFor(verb: Verb, form: Form): string[] {
  const answer = verb[form];
  const other = form === 'preterit' ? verb.participle : verb.preterit;
  const candidates = [answer, other, verb.base, ...(verb.regular === false ? [] : [regularized(verb.base)]), ...(verb.traps ?? [])];
  return [...new Set(candidates)].slice(0, CHOICES);
}

export function question(verb: Verb, form: Form): Question {
  return {
    id: `${verb.base}-${form}`,
    prompt: `${FORM_NAME[form]} de « ${verb.base} » (${verb.fr}) ?`,
    spokenPrompt: `to ${verb.base}`,
    spokenLang: 'en',
    choices: choicesFor(verb, form),
    choicesLang: 'en',
    answer: verb[form],
    hint: form === 'preterit' ? 'Le prétérit est la deuxième forme : base – prétérit – participe passé.' : 'Le participe passé est la troisième forme : base – prétérit – participe passé.',
    explanation: `${verb.base} – ${verb.preterit} – ${verb.participle} : ${verb.fr}.`,
  };
}

export function verbsForLevel(level: Level): Verb[] {
  return VERBS.filter((v) => v.level === level);
}

/** Quête d'un niveau : des verbes tirés au hasard, au prétérit ou au participe passé, sans doublon. */
export function questionsForLevel(level: Level, count = QUESTIONS_PER_QUEST, rng: Rng = Math.random): Question[] {
  const picked = shuffle(verbsForLevel(level), rng)
    .slice(0, count)
    .map((verb) => question(verb, rng() < 0.5 ? 'preterit' : 'participle'));
  return placeChoices(picked, rng);
}
