// Les réponses possibles d'un item sont mélangées avant l'affichage : dans les fichiers, la bonne réponse est souvent
// écrite en premier, et un élève le remarque vite. Le mélange est reproductible (même ordre pour le même item), et les
// listes de nombres restent dans l'ordre (2, 3, 4 : on compte, on ne devine pas une position).
import { seeded } from './maths';
import type { ExerciseDef, ExerciseItem } from './types';

const numeric = (choices: unknown[]) => choices.every((c) => typeof c === 'number' || (typeof c === 'string' && /^-?\d+([.,]\d+)?$/.test(c.trim())));

/** L'item avec ses `choices` mélangés (les autres champs inchangés). */
export function withShuffledChoices(def: ExerciseDef, item: ExerciseItem): ExerciseItem {
  const choices = item.choices;
  if (!Array.isArray(choices) || choices.length < 2 || numeric(choices)) return item;
  const rng = seeded(`${def.id}:${item.key}`);
  // Les premiers tirages de graines voisines se ressemblent : on en jette quelques-uns.
  for (let k = 0; k < 4; k++) rng();
  const out = [...choices];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { ...item, choices: out };
}
