// Ce qui tient à l'écran, mesuré avant l'affichage (lot 4, grand texte sur téléphone) : une boîte qui déborde, un mot
// coupé dans son étiquette. Sans DOM : les tailles suffisent, pour se tester sous jsdom.

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
