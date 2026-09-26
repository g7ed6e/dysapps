// Une partie d'un exercice : ses items, différents d'une partie à l'autre. Les exercices générés (maths) tirent
// d'autres nombres ; les exercices écrits (français) mélangent leur lot et n'en jouent qu'une partie quand il est
// large. Les réponses de chaque item sont mélangées. Tout est reproductible pour une même graine.
import { SCREEN_TYPES } from './registry';
import { seeded } from './maths';
import { withShuffledChoices } from './shuffle';
import type { ExerciseDef, ExerciseItem } from './types';

/** La graine d'une partie : l'exercice et le nombre de parties déjà jouées (chaque partie diffère de la précédente). */
export function runSeed(def: ExerciseDef, attempts: number): string {
  return attempts > 0 ? `${def.id}#${attempts}` : def.id;
}

function shuffled<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Les items d'une partie. */
export function runItems(def: ExerciseDef, seed: string): ExerciseItem[] {
  let items: ExerciseItem[];
  // Première partie : les items tels qu'ils sont écrits (l'ordre d'un premier contact est choisi) ; ensuite, ça varie.
  if (seed === runSeed(def, 0)) items = def.perRun ? def.items.slice(0, def.perRun) : def.items;
  else if (def.generate) items = def.generate(seed);
  else if (SCREEN_TYPES[def.type]?.ordered) items = def.items;
  else {
    const rng = seeded(seed);
    for (let k = 0; k < 4; k++) rng();
    items = shuffled(def.items, rng);
    if (def.perRun && def.perRun < items.length) items = items.slice(0, def.perRun);
  }
  return items.map((item) => withShuffledChoices(def, item));
}
