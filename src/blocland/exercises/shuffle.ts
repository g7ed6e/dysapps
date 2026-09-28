// Les réponses possibles des items d'une partie sont placées avec la graine de la partie : la bonne réponse change de
// place d'une partie à l'autre, et sur une partie elle prend chaque place autant de fois (voir `core/choices.ts`).
// Les listes de nombres restent dans l'ordre croissant.
// Un exercice généré (maths) tire déjà la place de la réponse dans ses générateurs, avec ses vrais pièges : ses choix
// restent tels quels (replacer une réponse chiffrée inventerait des pièges, ou changerait les nombres de l'énoncé).
import { placeChoices } from '../../core/choices';
import { seeded } from './maths';
import type { ExerciseDef, ExerciseItem } from './types';

/** Les items d'une partie, leurs `choices` placés au hasard. */
export function shuffleRunChoices(def: ExerciseDef, items: ExerciseItem[], seed: string): ExerciseItem[] {
  if (def.generate) return items;
  const rng = seeded(`${seed}:choix:${def.id}`);
  // Les premiers tirages de graines voisines se ressemblent : on en jette quelques-uns.
  for (let k = 0; k < 4; k++) rng();
  return placeChoices(items, rng);
}
