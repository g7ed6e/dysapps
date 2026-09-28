import cabinet from './data/cabinet-nuances-1.json';
import mine from './data/mine-oreille-1.json';
import foret from './data/foret-echauffement-002.json';
import { loadAllExercises } from './index';
import { runItems } from './run';
import type { ExerciseDef, ExerciseItem } from './types';
import { shuffleRunChoices } from './shuffle';

const EXERCISES = await loadAllExercises();

const at = (item: ExerciseItem) => (item.choices as unknown[]).map(String).indexOf(String(item.answer));

it('place les réponses au hasard à chaque partie : un même item change de place d’une partie à l’autre', () => {
  for (const def of [cabinet, mine] as unknown as ExerciseDef[]) {
    const a = shuffleRunChoices(def, def.items, 'a');
    expect(shuffleRunChoices(def, def.items, 'a')).toEqual(a);
    a.forEach((item, i) => expect([...(item.choices as string[])].sort()).toEqual([...(def.items[i].choices as string[])].sort()));
    // Sur quelques parties, chaque item a vu sa bonne réponse à plusieurs places.
    for (let i = 0; i < def.items.length; i++) {
      const places = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((seed) => at(shuffleRunChoices(def, def.items, seed)[i])));
      expect(places.size, `${def.id} ${def.items[i].key}`).toBeGreaterThan(1);
    }
  }
});

it('répartit les places de la bonne réponse sur une partie : aucune colonne ne domine', () => {
  // Les exercices générés tirent la place de la réponse dans leurs générateurs (voir college.test.ts) : la partie ne
  // replace pas leurs choix.
  for (const def of (EXERCISES as ExerciseDef[]).filter((d) => !d.generate)) {
    for (const seed of ['x', 'y', 'z']) {
      const items = runItems(def, `${def.id}#${seed}`).filter(
        (i) => Array.isArray(i.choices) && i.choices.length === 2 && !/^\s*[−-]?\d/.test(String(i.choices[0])),
      );
      if (items.length < 4 || items.some((i) => at(i) < 0)) continue;
      const left = items.filter((i) => at(i) === 0).length;
      expect(Math.abs(2 * left - items.length), `${def.id} ${seed}`).toBeLessThanOrEqual(1);
    }
  }
});

it('garde les nombres dans l’ordre croissant, mais décale la fenêtre pour que la réponse change de place', () => {
  const def = foret as unknown as ExerciseDef;
  const seen = new Set<number>();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
    for (const item of shuffleRunChoices(def, def.items, seed)) {
      const values = (item.choices as string[]).map(Number);
      expect(values).toHaveLength(3);
      values.forEach((v, i) => i > 0 && expect(v).toBe(values[i - 1] + 1));
      expect(values[0]).toBeGreaterThanOrEqual(1);
      expect(values).toContain(Number(item.answer));
      seen.add(at(item));
    }
  }
  expect([...seen].sort()).toEqual([0, 1, 2]);
  // Sur une partie, la réponse n'est plus au milieu presque à chaque fois.
  const run = shuffleRunChoices(def, def.items, 'partie');
  expect(run.filter((i) => at(i) === 1).length).toBeLessThanOrEqual(Math.ceil(run.length / 3) + 1);
});

it('déplace la réponse d’une liste de nombres en retournant un piège, et l’écrit comme ses voisins', () => {
  const def = { id: 'test', items: [{ key: 'k', choices: ['−3', '1 200', '2 000,5'], answer: '1 200' }] } as unknown as ExerciseDef;
  const lists = ['a', 'b', 'c', 'd', 'e', 'f'].map((seed) => shuffleRunChoices(def, def.items, seed)[0].choices as string[]);
  const value = (c: string) => Number(c.replace('−', '-').replace(/\s/g, '').replace(',', '.'));
  for (const list of lists) {
    expect(list).toContain('1 200');
    expect(list.map(value)).toEqual([...list.map(value)].sort((a, b) => a - b));
  }
  expect(lists.flat()).toContain('2 403');
  expect(new Set(lists.map((l) => l.indexOf('1 200'))).size).toBeGreaterThan(1);
  // Une liste de nombres que l'auteur n'a pas rangée reste telle quelle.
  const loose = { id: 'l', items: [{ key: 'k', choices: ['5', '2', '9'], answer: '2' }] } as unknown as ExerciseDef;
  expect(shuffleRunChoices(loose, loose.items, 'a')[0].choices).toEqual(['5', '2', '9']);
});

it('maths générées : sur beaucoup de parties, la bonne réponse n’a pas de place favorite', () => {
  const report: string[] = [];
  for (const def of (EXERCISES as ExerciseDef[]).filter((d) => d.generate)) {
    const counts = new Map<number, number[]>();
    for (let s = 0; s < 40; s++)
      for (const item of runItems(def, `${def.id}#stat${s}`)) {
        const n = Array.isArray(item.choices) ? item.choices.length : 0;
        if (n < 2 || at(item) < 0) continue;
        if (!counts.has(n)) counts.set(n, Array(n).fill(0));
        counts.get(n)![at(item)]++;
      }
    for (const [n, byPlace] of counts) {
      const total = byPlace.reduce((a, b) => a + b, 0);
      if (total < 40) continue;
      const top = Math.max(...byPlace) / total;
      if (top > 1 / n + 0.2) report.push(`${def.id} (${n} choix) : ${byPlace.join('/')}`);
    }
  }
  expect(report).toEqual([]);
});
