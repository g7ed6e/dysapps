import { EMPTY_STATE, type SpacedItem } from './engine';
import { exercisesOf, loadAllExercises, pickExercise } from './exercises';
import { runItems } from './exercises/run';
import { exercisesToReview, questsToReview, reviewKeys } from './review';

const ALL = await loadAllExercises();
const TODAY = '2026-09-27';
const due = (itemId: string, when = TODAY): SpacedItem => ({ itemId, due: when, stage: 0, streak: 0 });

it('les items ratés dus aujourd’hui désignent leurs exercices et leurs quêtes (îles ouvertes seulement)', () => {
  const spaced = [due('foret-echauffement-002:parapluie'), due('foret-echauffement-002:chocolat'), due('mine-filon-b:b1'), due('foret-rimes-eau:bateau', '2026-10-01')];
  expect(exercisesToReview(spaced, TODAY)).toEqual(new Set(['foret-echauffement-002', 'mine-filon-b']));
  expect(reviewKeys(spaced, 'foret-echauffement-002', TODAY).sort()).toEqual(['chocolat', 'parapluie']);
  // La Mine est fermée au début : seule la Forêt est proposée ; les rimes ne sont dues que dans quelques jours.
  expect(questsToReview(spaced, EMPTY_STATE.village.bridges, TODAY)).toEqual([
    { biome: 'foret', type: 'abattage', label: 'Abattage syllabique · Forêt des sons', path: '/aventure/foret/abattage' },
  ]);
});

it('la quête choisit la variante qui a des révisions, sans dépasser le niveau de l’élève', () => {
  const levels = exercisesOf('foret', 'abattage').map((e) => [e.id, e.level]);
  expect(levels).toContainEqual(['foret-echauffement-002', 2]);
  expect(pickExercise('foret', 'abattage', 3, {}, new Set(['foret-echauffement-002']))!.id).toBe('foret-echauffement-002');
  // Au niveau 1, la variante de niveau 2 n'est pas imposée.
  expect(pickExercise('foret', 'abattage', 1, {}, new Set(['foret-echauffement-002']))!.id).toBe('foret-echauffement-001');
});

it('les items à revoir passent en tête de la partie (écrans d’un item) ; un tri garde ses écrans', () => {
  const abattage = ALL.find((e) => e.id === 'foret-echauffement-002')!;
  const last = abattage.items[abattage.items.length - 1].key;
  for (const seed of ['a', 'b', 'c']) expect(runItems(abattage, seed, [last])[0].key).toBe(last);
  const chasse = ALL.find((e) => e.id === 'foret-chasse-son-an')!;
  const k = chasse.items[5].key;
  expect(runItems(chasse, 'a', [k]).map((i) => i.key)).toEqual(runItems(chasse, 'a').map((i) => i.key));
});
