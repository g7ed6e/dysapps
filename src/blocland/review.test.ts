import { EMPTY_STATE, type SpacedItem } from './engine';
import { exercisesOf, loadAllExercises, pickExercise } from './exercises';
import { runItems } from './exercises/run';
import { exercisesToReview, questsToReview, reviewKeys } from './review';

const ALL = await loadAllExercises();
const TODAY = '2026-09-27';
const due = (itemId: string, when = TODAY): SpacedItem => ({ itemId, due: when, stage: 0, streak: 0 });

it('les items ratés dus aujourd’hui désignent leurs exercices et leurs missions (îles ouvertes seulement)', () => {
  const spaced = [due('french-6e-phonology-syllables-warmup-002:parapluie'), due('french-6e-phonology-syllables-warmup-002:chocolat'), due('french-6e-letter-confusion-letter-pairs-b:b1'), due('french-6e-phonology-rhymes-eau:bateau', '2026-10-01')];
  expect(exercisesToReview(spaced, TODAY)).toEqual(new Set(['french-6e-phonology-syllables-warmup-002', 'french-6e-letter-confusion-letter-pairs-b']));
  expect(reviewKeys(spaced, 'french-6e-phonology-syllables-warmup-002', TODAY).sort()).toEqual(['chocolat', 'parapluie']);
  // La Mine est fermée au début : seule la Forêt est proposée ; les rimes ne sont dues que dans quelques jours.
  expect(questsToReview(spaced, EMPTY_STATE.world.links, TODAY)).toEqual([
    { biome: 'french-6e-phonology', type: 'syllables', label: 'Abattage syllabique · Forêt des sons', path: '/aventure/foret/abattage' },
  ]);
});

it('la mission choisit la variante qui a des révisions, sans dépasser le niveau de l’élève', () => {
  const levels = exercisesOf('french-6e-phonology', 'syllables').map((e) => [e.id, e.level]);
  expect(levels).toContainEqual(['french-6e-phonology-syllables-warmup-002', 2]);
  expect(pickExercise('french-6e-phonology', 'syllables', 3, {}, new Set(['french-6e-phonology-syllables-warmup-002']))!.id).toBe('french-6e-phonology-syllables-warmup-002');
  // Au niveau 1, la variante de niveau 2 n'est pas imposée.
  expect(pickExercise('french-6e-phonology', 'syllables', 1, {}, new Set(['french-6e-phonology-syllables-warmup-002']))!.id).toBe('french-6e-phonology-syllables-warmup-001');
});

it('les items à revoir passent en tête de la partie (écrans d’un item) ; un tri garde ses écrans', () => {
  const abattage = ALL.find((e) => e.id === 'french-6e-phonology-syllables-warmup-002')!;
  const last = abattage.items[abattage.items.length - 1].key;
  for (const seed of ['a', 'b', 'c']) expect(runItems(abattage, seed, [last])[0].key).toBe(last);
  const chasse = ALL.find((e) => e.id === 'french-6e-phonology-sound-hunt-an')!;
  const k = chasse.items[5].key;
  expect(runItems(chasse, 'a', [k]).map((i) => i.key)).toEqual(runItems(chasse, 'a').map((i) => i.key));
});
