// La phrase visible de l'accueil d'une créature : la première phrase, ou les premières jusqu'à une longueur lisible ;
// le reste va dans un pli (« La suite »). Code pur.

/** Longueur minimale de la partie visible : « Meuh ! » seul ne dit rien, on prend la phrase suivante avec. */
export const VISIBLE_MIN = 30;

/**
 * Coupe un texte après sa première phrase, ou après les suivantes tant que la partie visible fait moins de `min`
 * caractères. Une phrase finit par « . », « ! », « ? » ou « … » suivi d'une espace. `rest` est vide si tout tient.
 */
export function firstSentences(text: string, min = VISIBLE_MIN): { first: string; rest: string } {
  const ends = /[.!?…]+[»”]?\s+/g;
  let m: RegExpExecArray | null;
  while ((m = ends.exec(text)) !== null) {
    const cut = m.index + m[0].length;
    const first = text.slice(0, cut).trim();
    if (first.length >= min) return { first, rest: text.slice(cut).trim() };
  }
  return { first: text.trim(), rest: '' };
}
