import { EXERCISES, exercisesOf } from './index';
import { SCREEN_TYPES } from './registry';
import { runItems, runSeed } from './run';
import type { ExerciseDef } from './types';

const keysOf = (def: ExerciseDef, seed: string) => runItems(def, seed).map((i) => i.key);

it('chaque partie tire une graine au hasard, même quand on recommence le jeu depuis le début', () => {
  const def = exercisesOf('plaine', 'tables')[0];
  const seeds = new Set(Array.from({ length: 50 }, () => runSeed(def)));
  expect(seeds.size).toBe(50);
  for (const seed of seeds) expect(seed.startsWith(`${def.id}#`)).toBe(true);
});

it('chaque partie de maths (école et collège) tire d’autres nombres, reproductibles pour une même graine', () => {
  const generated = (EXERCISES as ExerciseDef[]).filter((d) => d.generate);
  expect(generated.length).toBeGreaterThan(40);
  for (const def of generated) {
    const a = runItems(def, `${def.id}#a`);
    expect(a.length, def.id).toBe(def.items.length);
    expect(runItems(def, `${def.id}#a`)).toEqual(a);
    expect(keysOf(def, `${def.id}#a`), def.id).not.toEqual(keysOf(def, `${def.id}#b`));
  }
});

it('aucune partie ne rejoue les questions dans l’ordre du fichier, ni deux fois dans le même ordre', () => {
  for (const def of EXERCISES as ExerciseDef[]) {
    if (SCREEN_TYPES[def.type]?.ordered || def.items.length < 4) continue;
    const runs = Array.from({ length: 20 }, (_, k) => keysOf(def, `${def.id}#p${k}`).join(' '));
    const fileOrder = def.items.map((i) => i.key).join(' ');
    expect(runs.filter((r) => fileOrder.startsWith(r)), def.id).toEqual([]);
    // Deux parties de suite dans le même ordre : seulement par hasard, rarement.
    expect(new Set(runs).size, def.id).toBeGreaterThanOrEqual(runs.length - 1);
  }
});

it('un exercice écrit mélange son lot, n’en joue qu’une partie s’il est large, et garde l’ordre d’un texte', () => {
  const abattage = exercisesOf('foret', 'abattage')[0];
  expect(abattage.items.length).toBe(12);
  const run0 = runItems(abattage, 'a');
  const run1 = runItems(abattage, 'b');
  expect(run0).toHaveLength(6);
  expect(new Set(run0.map((i) => i.key)).size).toBe(6);
  expect(run0.map((i) => i.key)).not.toEqual(run1.map((i) => i.key));
  for (const item of run0) expect(abattage.items.some((i) => i.key === item.key)).toBe(true);
  // Le lot entier, mélangé, quand perRun n'est pas donné.
  const chasse = exercisesOf('foret', 'chasse-son')[0];
  expect(keysOf(chasse, 'c').sort()).toEqual(chasse.items.map((i) => i.key).sort());
  // Un texte à lire : les paragraphes restent dans l'ordre.
  const texte = exercisesOf('tour', 'ascension')[0];
  expect(keysOf(texte, runSeed(texte))).toEqual(texte.items.map((i) => i.key));
});

it('les lots élargis ont des clés uniques et des réponses présentes dans les choix', () => {
  for (const def of EXERCISES as ExerciseDef[]) {
    const keys = def.items.map((i) => i.key);
    expect(new Set(keys).size, def.id).toBe(keys.length);
    for (const item of runItems(def, runSeed(def)))
      if (Array.isArray(item.choices) && item.answer !== undefined) expect(item.choices.map(String), `${def.id} ${item.key}`).toContain(String(item.answer));
    if (def.perRun) expect(def.perRun, def.id).toBeLessThanOrEqual(def.items.length);
  }
});
