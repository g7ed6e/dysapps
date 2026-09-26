import { EXERCISES, exercisesOf } from './index';
import { runItems, runSeed } from './run';
import type { ExerciseDef } from './types';

it('chaque partie de maths tire d’autres nombres, reproductibles pour une même graine', () => {
  const def = exercisesOf('plaine', 'tables')[0];
  const a = runItems(def, runSeed(def, 1));
  const b = runItems(def, runSeed(def, 2));
  expect(a.length).toBe(def.items.length);
  expect(runItems(def, runSeed(def, 1)).map((i) => i.key)).toEqual(a.map((i) => i.key));
  expect(a.map((i) => i.key)).not.toEqual(b.map((i) => i.key));
  // La première partie joue les items de référence.
  expect(runItems(def, runSeed(def, 0)).map((i) => i.key)).toEqual(def.items.map((i) => i.key));
});

it('un exercice écrit mélange son lot, n’en joue qu’une partie s’il est large, et garde l’ordre d’un texte', () => {
  const abattage = exercisesOf('foret', 'abattage')[0];
  expect(abattage.items.length).toBe(12);
  const run0 = runItems(abattage, runSeed(abattage, 1));
  const run1 = runItems(abattage, runSeed(abattage, 2));
  expect(run0).toHaveLength(6);
  expect(new Set(run0.map((i) => i.key)).size).toBe(6);
  expect(run0.map((i) => i.key)).not.toEqual(run1.map((i) => i.key));
  for (const item of run0) expect(abattage.items.some((i) => i.key === item.key)).toBe(true);
  // Le lot entier, mélangé, quand perRun n'est pas donné.
  const chasse = exercisesOf('foret', 'chasse-son')[0];
  const all = runItems(chasse, runSeed(chasse, 3));
  expect(all.map((i) => i.key).sort()).toEqual(chasse.items.map((i) => i.key).sort());
  // Un texte à lire : les paragraphes restent dans l'ordre.
  const texte = exercisesOf('tour', 'ascension')[0];
  expect(runItems(texte, runSeed(texte, 5)).map((i) => i.key)).toEqual(texte.items.map((i) => i.key));
});

it('les lots élargis ont des clés uniques et des réponses présentes dans les choix', () => {
  for (const def of EXERCISES as ExerciseDef[]) {
    const keys = def.items.map((i) => i.key);
    expect(new Set(keys).size, def.id).toBe(keys.length);
    for (const item of def.items)
      if (Array.isArray(item.choices) && item.answer !== undefined) expect(item.choices, `${def.id} ${item.key}`).toContain(item.answer);
    if (def.perRun) expect(def.perRun, def.id).toBeLessThanOrEqual(def.items.length);
  }
});
