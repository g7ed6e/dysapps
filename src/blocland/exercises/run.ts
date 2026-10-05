// Une partie d'un exercice : ses items, différents d'une partie à l'autre, même quand on recommence le jeu depuis le
// début. Chaque partie tire une graine au hasard : les exercices générés (maths) tirent d'autres nombres ; les exercices
// écrits (français) mélangent leur lot et n'en jouent qu'une partie quand il est large. Les réponses de chaque item
// changent de place. Pour une même graine, tout est reproductible (tests).
import { SCREEN_TYPES } from './registry';
import { seeded, shuffle } from '../../core/random';
import { shuffleRunChoices } from './shuffle';
import type { ExerciseDef, ExerciseItem } from './types';

/** Une part de hasard réel (pas une suite prévisible) pour la graine d'une partie. */
function randomPart(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) return Array.from(cryptoApi.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join('');
  return Math.floor(Math.random() * 2 ** 52).toString(36);
}

/** La graine d'une nouvelle partie : l'exercice et un tirage au hasard. */
export function runSeed(def: ExerciseDef): string {
  return `${def.id}#${randomPart()}`;
}

/**
 * Les items d'une partie. `review` : les clés des items à revoir aujourd'hui (répétition espacée), placés en tête de la
 * partie, donc toujours joués même quand on n'en joue qu'une partie. Seulement pour les écrans d'un item à la fois : un
 * écran de tri (quatre mots) garde sa composition, et un exercice généré tire d'autres items à chaque partie.
 */
export function runItems(def: ExerciseDef, seed: string, review: string[] = []): ExerciseItem[] {
  let items: ExerciseItem[];
  if (def.generate) items = def.generate(seed);
  else if (SCREEN_TYPES[def.type]?.ordered) items = def.items;
  else {
    const rng = seeded(seed);
    for (let k = 0; k < 4; k++) rng();
    items = shuffle(def.items, rng);
    if (review.length && SCREEN_TYPES[def.type]?.batch === 1) {
      const due = new Set(review);
      items = [...items.filter((it) => due.has(it.key)), ...items.filter((it) => !due.has(it.key))];
    }
    if (def.perRun && def.perRun < items.length) items = items.slice(0, def.perRun);
    // Un petit lot peut retomber sur l'ordre du fichier : on décale d'un cran pour ne jamais le rejouer tel quel.
    if (items.length > 1 && items.every((item, i) => item === def.items[i])) items = [...items.slice(1), items[0]];
  }
  return shuffleRunChoices(def, items, seed);
}
