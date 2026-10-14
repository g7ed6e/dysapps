// Ce qui tient à l'écran, mesuré avant l'affichage (lot 4, grand texte sur téléphone) : une boîte qui déborde, un mot
// coupé dans son étiquette ; et la phrase complète après une réussite. Sans DOM, pour se tester sous jsdom.

/** Les tailles d'une boîte : ce qu'elle montre, et ce que son contenu demande. */
export interface Measured {
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

/** Une boîte déborde quand son contenu demande plus que ce qu'elle montre (un pixel d'arrondi toléré). */
export function overflows(box: Measured): boolean {
  return box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1;
}

/** Un mot est coupé quand une étiquette de réponse affichée est plus étroite que son texte. */
export function wordsCut(labels: ArrayLike<Pick<Measured, 'clientWidth' | 'scrollWidth'>>): boolean {
  return Array.from(labels).some((l) => l.clientWidth > 0 && l.scrollWidth > l.clientWidth + 1);
}

/**
 * Après une réussite, au premier comme au deuxième essai (la réponse retenue est la dernière), le mot juste entre dans
 * le trou de la phrase : ce qui l'entoure, ou `null` (pas encore répondu, réponse fausse, phrase sans trou).
 */
export function filledGap(prompt: string, answer: string, results: readonly { correct: boolean }[] | undefined): { before: string; after: string } | null {
  const at = prompt.indexOf('…');
  if (at < 0 || !answer || !results?.length || !results.every((r) => r.correct)) return null;
  return { before: prompt.slice(0, at), after: prompt.slice(at + 1) };
}
