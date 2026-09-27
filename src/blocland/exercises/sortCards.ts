// Écrans de tri (Chasse au son, Rimes-échelle) : l'état de chaque carte après validation, et une correction qui
// nomme toutes les erreurs, pas seulement la première.
import type { ExerciseItem } from './types';

/** trouvé : bon mot touché ; oublié : bon mot pas touché ; intrus : mauvais mot touché ; ignoré : mauvais mot laissé. */
export type CardState = 'found' | 'missed' | 'intruder' | 'ignored';

export function cardState(item: ExerciseItem, picked: boolean): CardState {
  if (item.correct) return picked ? 'found' : 'missed';
  return picked ? 'intruder' : 'ignored';
}

/** Classes CSS de la carte : vert pour un bon mot trouvé, rouge pour une erreur, neutre pour un intrus bien laissé. */
export const CARD_CLASS: Record<CardState, string> = {
  found: ' right',
  missed: ' wrong missed',
  intruder: ' wrong',
  ignored: ' ignored',
};

const list = (words: string[]) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} et ${words[words.length - 1]}` : words[0]);

/**
 * La correction complète d'un écran de tri : les bons mots oubliés, puis chaque intrus touché avec ce qu'on y entend.
 * `sound` : ce que les bons mots ont en commun (« [an] », « la fin de chapeau ») ; `heardOf` : ce qu'on entend dans un mot.
 */
export function sortSummary(
  items: ExerciseItem[],
  picked: Set<string>,
  texts: { missed: (words: string) => string; intruder: (word: string, heard: string) => string },
  heardOf: (item: ExerciseItem) => string,
): string {
  const states = items.map((it) => ({ it, state: cardState(it, picked.has(it.key)) }));
  const missed = states.filter((s) => s.state === 'missed').map((s) => String(s.it.word));
  const intruders = states.filter((s) => s.state === 'intruder').map((s) => s.it);
  const parts: string[] = [];
  if (missed.length) parts.push(texts.missed(list(missed)));
  for (const it of intruders) parts.push(texts.intruder(String(it.word), heardOf(it)));
  return parts.join(' ');
}
