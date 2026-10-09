// Les mots d'une île qui ne sont pas du français : le latin, le grec transcrit, et les mots d'italien, d'espagnol ou
// d'anglais qu'elle cite (« ## La voix » de son Markdown, `foreignWords` de src/game/islands.ts). Partout où ils
// apparaissent (question, document, rappel, choix, indice, explication), ils s'affichent marqués dans leur langue, sans
// syllabes colorées, et la voix française dit le latin et le grec comme l'écrit leur « lu », jamais affiché ; un mot de
// langue vivante est lu par la voix de sa langue (principes dys, « Le latin et le grec »).
import type { Lang } from './speech';

/** La langue d'un mot marqué : le latin, le grec ancien transcrit en lettres latines, ou une langue vivante citée. */
type ForeignLang = 'la' | 'grc-Latn' | 'it' | 'es' | 'en';

export interface ForeignWord {
  /** Le mot, ou l'expression, tel qu'il s'écrit (« rosam », « pes, pedis », « -am »). */
  word: string;
  lang: ForeignLang;
  /** Comment la voix française le dit (« rossamm ») ; jamais pour une langue vivante, lue par sa propre voix. */
  spoken?: string;
}

/** Un morceau d'un texte : du français, ou un mot marqué. */
export interface Run {
  text: string;
  word?: ForeignWord;
}

/** Un morceau de ce que dit la voix, avec la voix qui le dit. */
export interface SpeechSegment {
  text: string;
  lang: Lang;
}

const LETTRE = '\\p{L}\\p{M}';
const ESPACES = '[\\s\\u00a0\\u202f]+';

/** La forme sous laquelle un mot se reconnaît : en minuscules, sans le trait qui montre une terminaison (ros-am). */
const cle = (s: string): string => (s.startsWith('-') ? '-' : '') + s.replace(/-/g, '').replace(/[\s  ]+/g, ' ').toLowerCase();

/**
 * Le motif d'un mot : chaque signe tel quel, une espace pour toute espace, et entre deux lettres un trait possible, celui
 * qui montre la terminaison dans un rappel (« ros-am » se reconnaît comme « rosam »).
 */
function motif(word: string): string {
  const signes = [...word];
  return signes
    .map((c, i) => {
      if (/\s/.test(c)) return ESPACES;
      // Le trait d'union reste tel quel : en mode Unicode, « \- » hors d'une classe est refusé.
      const echappe = c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
      const suivant = signes[i + 1];
      return /\p{L}/u.test(c) && suivant !== undefined && /\p{L}/u.test(suivant) ? `${echappe}-?` : echappe;
    })
    .join('');
}

interface Reconnaissance {
  re: RegExp;
  parCle: Map<string, ForeignWord>;
}

const memo = new WeakMap<readonly ForeignWord[], Reconnaissance>();

function reconnaissance(words: readonly ForeignWord[]): Reconnaissance {
  let r = memo.get(words);
  if (!r) {
    // Le plus long d'abord : « Senatus Populusque Romanus » avant « Romanus », « in villa » avant « villa ».
    const tries = [...words].sort((a, b) => b.word.length - a.word.length);
    const source = tries.map((w) => motif(w.word)).join('|');
    r = {
      re: new RegExp(`(?<![${LETTRE}-])(?:${source})(?![${LETTRE}])`, 'giu'),
      parCle: new Map(tries.map((w) => [cle(w.word), w])),
    };
    memo.set(words, r);
  }
  return r;
}

/** Le texte coupé en morceaux : le français, et chaque mot de `words` qu'il contient (sans tenir compte des majuscules). */
export function splitForeignWords(text: string, words: readonly ForeignWord[] | undefined): Run[] {
  if (!words?.length || !text) return [{ text }];
  const { re, parCle } = reconnaissance(words);
  const runs: Run[] = [];
  let fin = 0;
  re.lastIndex = 0;
  for (const m of text.matchAll(re)) {
    const word = parCle.get(cle(m[0]));
    if (!word) continue;
    if (m.index > fin) runs.push({ text: text.slice(fin, m.index) });
    runs.push({ text: m[0], word });
    fin = m.index + m[0].length;
  }
  if (fin < text.length) runs.push({ text: text.slice(fin) });
  return runs.length ? runs : [{ text }];
}

/** La voix d'une langue vivante citée ; le latin et le grec transcrit sont dits par la voix française. */
const VOIX: Partial<Record<ForeignLang, Lang>> = { it: 'it', es: 'es', en: 'en' };

/**
 * Ce que dit la voix pour un texte français : le latin et le grec remplacés par leur « lu », chaque mot de langue vivante
 * dans sa propre voix ; les morceaux d'une même voix sont réunis.
 */
export function segmentsForSpeech(text: string, words: readonly ForeignWord[] | undefined): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  for (const run of splitForeignWords(text, words)) {
    const lang = (run.word && VOIX[run.word.lang]) ?? 'fr';
    const dit = run.word?.spoken ?? run.text;
    const dernier = segments[segments.length - 1];
    if (dernier && dernier.lang === lang) dernier.text += dit;
    else segments.push({ text: dit, lang });
  }
  return segments.filter((s) => s.text.trim() !== '');
}

let courants: readonly ForeignWord[] | undefined;

/**
 * Les mots de l'île dont on joue une mission (`ForeignWordsProvider`), que la voix applique à tout texte français qu'elle
 * lit ; `undefined` hors d'une île qui en a.
 */
export function retenirMotsEtrangers(words: readonly ForeignWord[] | undefined): void {
  courants = words?.length ? words : undefined;
}

export function motsEtrangersCourants(): readonly ForeignWord[] | undefined {
  return courants;
}
