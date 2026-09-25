import { DotArray, TenFrame } from '../../apps/tables/aids';
import { multiplication } from '../../apps/tables/generators';
import { MATHS_EXERCISES, aidToData, buildItems, seeded, toItem } from './maths';

it('convertit une aide React en données, et une question en item lisible', () => {
  const q = multiplication(5, 3, false, () => 0.5);
  const item = toItem(q);
  expect(item.prompt).toBe('5 × 3 = …');
  expect(item.spoken).toBe('5 fois 3, combien ?');
  expect(item.answer).toBe('15');
  expect(item.choices).toContain('15');
  expect(item.aid).toEqual({ kind: 'dots', props: { rows: 3, cols: 5 } });
  expect(aidToData(TenFrame({ filled: 4 }))).toBeUndefined();
  expect(aidToData(DotArray({ rows: 1, cols: 1 }))).toBeUndefined();
  // Sérialisable : rien de React dans l'item.
  expect(JSON.parse(JSON.stringify(item))).toEqual(item);
});

it('tire des items reproductibles et tous différents', () => {
  const rng = seeded('x');
  expect(seeded('x')()).toBe(rng());
  const a = buildItems('plaine-tables-1', [() => multiplication(2, Math.ceil(Math.random() * 9) + 1, false, Math.random)], 6);
  expect(new Set(a.map((i) => i.key)).size).toBe(6);
  expect(MATHS_EXERCISES.map((e) => e.items.map((i) => i.key))).toEqual(MATHS_EXERCISES.map((e) => e.items.map((i) => i.key)));
});

it('les quêtes de la Rivière : figure ou aide sur chaque item, fractions lisibles', () => {
  const riviere = MATHS_EXERCISES.filter((e) => e.biome === 'riviere');
  expect(riviere.map((e) => e.id)).toEqual(['riviere-nenuphars-1', 'riviere-nenuphars-2', 'riviere-deux-rives-1', 'riviere-partage-1', 'riviere-partage-2']);
  for (const def of riviere) {
    expect(def.items.length).toBe(8);
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect(String(it.explanation).length).toBeGreaterThan(3);
      if (def.type === 'nenuphars') expect(it.figure).toBeDefined();
      if (def.type === 'deux-rives') expect(it.aid).toEqual({ kind: 'compare-bars', props: expect.anything() });
    }
  }
});

it('les quêtes de la Plaine : une aide visuelle et une explication sur chaque item, réponses dans l’ordre croissant', () => {
  const plaine = MATHS_EXERCISES.filter((e) => e.biome === 'plaine');
  expect(plaine.map((e) => e.id)).toEqual([
    'plaine-tables-1',
    'plaine-tables-2',
    'plaine-tables-3',
    'plaine-complements-1',
    'plaine-complements-2',
    'plaine-doubles-1',
  ]);
  for (const def of plaine) {
    expect(def.items.length).toBe(8);
    for (const it of def.items) {
      expect(String(it.explanation).length).toBeGreaterThan(3);
      expect(String(it.spoken).length).toBeGreaterThan(3);
      expect(it.choices).toContain(it.answer);
      const nums = (it.choices as string[]).map((c) => Number(c.replace(/[\s  ]/g, '')));
      expect([...nums].sort((a, b) => a - b)).toEqual(nums);
      if (def.type !== 'doubles') expect(it.aid).toBeDefined();
    }
  }
  // Niveau 1 des tables : seulement 2, 5 et 10.
  for (const it of plaine[0].items) expect(String(it.prompt)).toMatch(/^(2|5|10) × \d+|\d+ × (2|5|10) =/);
});
