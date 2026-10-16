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

/** Ce qu'une boîte qui défile montre de haut en bas : ses bords à l'écran et ses bordures (`clientTop`). */
interface Scroller {
  clientTop: number;
  clientHeight: number;
  getBoundingClientRect(): Pick<DOMRect, 'top'>;
}

/**
 * De combien de pixels la plus basse de ces cibles passe sous le bord d'une boîte qui défile (0 : toutes visibles), à
 * sa position du moment, `reserve` pixels gardés au bas (le repère « Suite plus bas ») : en C (GD-20, point 8, lot L6a),
 * les réponses ne passent jamais sous le pli de la colonne.
 */
export function belowFold(box: Scroller, targets: ArrayLike<{ getBoundingClientRect(): Pick<DOMRect, 'bottom'> }>, reserve = 0): number {
  const bottom = box.getBoundingClientRect().top + box.clientTop + box.clientHeight - reserve;
  let worst = 0;
  for (const t of Array.from(targets)) worst = Math.max(worst, t.getBoundingClientRect().bottom - bottom);
  return worst > 1 ? worst : 0;
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

/** Un rectangle à l'écran, en pixels. */
export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Un repère de la scène (une fraction sous un sas) ne se montre que si son point est dans la scène visible : dans
 * l'écran, à `margin` pixels du bord au moins (l'étiquette y tient entière), hors du panneau de la question (relecture
 * de L3 : « 1/4 » coupé au bord d'un téléphone, sous le panneau). Ce qu'il dit reste dans le panneau ou dans « Vue
 * simple ».
 */
export function inVisibleScene(point: { x: number; y: number }, width: number, height: number, panel: ScreenRect | null, margin = 24): boolean {
  const { x, y } = point;
  if (x < margin || x > width - margin || y < 0 || y > height - margin) return false;
  return !panel || x < panel.left || x > panel.right || y < panel.top || y > panel.bottom;
}

/**
 * Où se pose un repère de la scène (un entier de la jauge des Marais salants) face aux boutons du haut (« Vue simple »
 * et la pause, `bar`, avec `gap` pixels d'air) : à sa place (`place`) ; s'il passerait sous eux, juste sous son point
 * (`dessous` : `lowered`, l'étiquette posée là, le haut sur son point, mesurée ainsi) ; sinon caché (`cache`). Relecture du
 * lot L5, consultant UX UI : un nombre de la jauge ne passe jamais sous un bouton.
 */
export function labelBesideBar(label: ScreenRect, lowered: ScreenRect, bar: ScreenRect, gap = 4): 'place' | 'dessous' | 'cache' {
  const under = (r: ScreenRect) => r.left < bar.right + gap && r.right > bar.left - gap && r.top < bar.bottom + gap && r.bottom > bar.top - gap;
  if (!under(label)) return 'place';
  return under(lowered) ? 'cache' : 'dessous';
}
