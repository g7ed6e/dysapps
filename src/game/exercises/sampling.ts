// Les outils de tirage des missions de maths écrites item par item (Galets en colonnes, le Volcan des décimaux) : un
// tirage borné, la carte de règle, et les quatre réponses rangées dans l’ordre, un vrai piège au moins.
import { randomInt } from '../../core/random';

type Rng = () => number;

/** Les tirages d’un item sont bornés : au-delà, le générateur a un défaut, qu’on signale plutôt que de boucler. */
const MAX_TRIES = 1000;

/** Un tirage borné, dont l’erreur nomme la mission (`prefix`) et l’item cherché. */
export const boundedDraw =
  (prefix: string) =>
  <T>(name: string, attempt: () => T | undefined): T => {
    for (let tries = 0; tries < MAX_TRIES; tries++) {
      const found = attempt();
      if (found !== undefined) return found;
    }
    throw new Error(`${prefix} : aucun item ${name} trouvé en ${MAX_TRIES} tirages.`);
  };

/** La carte de règle d’un item (aide `rule-card`). */
export const ruleCard = (title: string, lines: string[]) => ({ kind: 'rule-card', props: { title, lines } });

/** L’ordre croissant de deux nombres. */
export const byValue = (a: number, b: number) => a - b;

/**
 * Les quatre réponses, rangées dans l’ordre (`compare`), la place de la réponse tirée au hasard parmi celles que les
 * pièges permettent. Les pièges sont des erreurs d’élèves, le plus fréquent d’abord ; de chaque côté de la réponse, ils
 * passent avant les voisins (`fillers`, les plus proches d’abord). Un vrai piège au moins est toujours proposé, et
 * `required` (le piège que le niveau travaille, le 0 oublié) l’est toujours quand il existe. Sans place possible,
 * `undefined` : l’item est tiré à nouveau. Pas `drawChoices` : il remplit avec des voisins le côté où la place tirée
 * l’exige, quitte à ne proposer aucun vrai piège (« 55 × 32 » n’aurait plus que 1 770, 1 780 et 1 790).
 */
export function rangeChoices<T>(
  answer: T,
  traps: T[],
  fillers: T[],
  compare: (a: T, b: T) => number,
  rng: Rng,
  required?: T,
): T[] | undefined {
  const same = (a: T, b: T) => compare(a, b) === 0;
  const distinct = (list: T[]) => list.filter((t, i) => !same(t, answer) && list.findIndex((u) => same(u, t)) === i);
  const real = distinct(required === undefined ? traps : [required, ...traps]);
  const all = distinct([...real, ...fillers]);
  const below = all.filter((t) => compare(t, answer) < 0);
  const above = all.filter((t) => compare(t, answer) > 0);
  // Les vrais pièges sont en tête de leur côté : la place p garde les p premiers du dessous, les 3 − p premiers du dessus.
  const realBelow = real.filter((t) => compare(t, answer) < 0).length;
  const realAbove = real.length - realBelow;
  const keeps = (p: number) =>
    ((realBelow > 0 && p >= 1) || (realAbove > 0 && p <= 2)) &&
    (required === undefined || same(required, answer) || (compare(required, answer) < 0 ? p >= 1 : p <= 2));
  const places = [0, 1, 2, 3].filter((p) => p <= below.length && 3 - p <= above.length && keeps(p));
  if (places.length === 0) return undefined;
  const wanted = places[randomInt(0, places.length - 1, rng)];
  return [answer, ...below.slice(0, wanted), ...above.slice(0, 3 - wanted)].sort(compare);
}
