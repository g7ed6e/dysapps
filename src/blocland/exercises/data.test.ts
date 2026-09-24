import { BIOMES, BLOCKS } from '../biomes';
import { EXERCISES, exercisesOf, pickExercise } from './index';
import { SCREEN_TYPES } from './registry';
import { fillTemplate } from './types';

describe.each(EXERCISES.map((e) => [e.id, e] as const))('exercice %s', (_, def) => {
  it('est complet et cohérent', () => {
    const biome = BIOMES.find((b) => b.id === def.biome)!;
    expect(biome).toBeTruthy();
    expect(biome.exercises.map((x) => x.id)).toContain(def.type);
    expect(SCREEN_TYPES[def.type]).toBeTruthy();
    expect(def.level).toBeGreaterThanOrEqual(1);
    expect(def.instruction.length).toBeGreaterThan(10);
    expect(def.instruction).not.toContain("'");
    expect(def.items.length).toBeGreaterThanOrEqual(4);
    expect(new Set(def.items.map((i) => i.key)).size).toBe(def.items.length);
    expect(BLOCKS[def.reward.block]).toBeTruthy();
    expect(def.reward.amount).toBeGreaterThan(0);
    expect(def.reward.xp).toBeGreaterThan(0);
    expect(def.adaptive.promoteAt).toBeGreaterThan(def.adaptive.demoteAt);
    expect(def.feedback.correct).toBeTruthy();
    // Les variables du message de correction existent dans les items.
    for (const v of def.feedback.wrong.matchAll(/\{(\w+)\}/g)) {
      const name = v[1];
      const known = ['target', 'chosen', 'mined', 'missed'].includes(name) || def.items.every((i) => name in i);
      expect(known, `variable {${name}} inconnue`).toBe(true);
    }
  });
});

it('chasse au son : 4 mots par écran, 2 à 3 bons par écran, pictogramme et son entendu', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'chasse-son')) {
    expect(def.items.length % 4).toBe(0);
    for (let i = 0; i < def.items.length; i += 4) {
      const screen = def.items.slice(i, i + 4);
      const good = screen.filter((it) => it.correct).length;
      expect(good, `${def.id} écran ${i / 4}`).toBeGreaterThanOrEqual(2);
      expect(good).toBeLessThanOrEqual(3);
    }
    for (const it of def.items) {
      expect(String(it.image).length).toBeGreaterThan(0);
      expect(String(it.heard)).toMatch(/^\[.+\]$/);
    }
  }
});

it('filon : moitié de lettres cibles, lettres proches seulement', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'filon')) {
    expect(def.items.filter((i) => i.correct).length).toBe(def.items.length / 2);
    for (const it of def.items) {
      expect(['b', 'd', 'p', 'q']).toContain(it.letter);
      expect(it.correct).toBe(it.letter === def.target);
    }
  }
});

it('mot troué : le trou reconstitue le mot, 3 blocs dont la réponse', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'mot-troue')) {
    for (const it of def.items) {
      expect(`${it.before}${it.answer}${it.after}`).toBe(it.word);
      expect(it.choices).toHaveLength(3);
      expect(it.choices).toContain(it.answer);
      expect(new Set(it.choices as string[]).size).toBe(3);
    }
  }
});

it('tri des graines : construit depuis les homophones, avec règle et astuce', () => {
  const defs = EXERCISES.filter((e) => e.type === 'graines');
  expect(defs.map((d) => d.id).sort()).toEqual(['ferme-graines-a', 'ferme-graines-ce', 'ferme-graines-et', 'ferme-graines-on', 'ferme-graines-son']);
  for (const def of defs) for (const it of def.items) {
    expect(String(it.prompt)).toContain('…');
    expect(it.choices).toContain(it.answer);
    expect(String(it.rule).length).toBeGreaterThan(5);
    expect(fillTemplate(def.feedback.wrong, it)).not.toMatch(/\{\w+\}/);
  }
});

it('ascension : textes de 60 à 120 mots en 3 à 5 paragraphes', () => {
  const defs = EXERCISES.filter((e) => e.type === 'ascension');
  expect(defs.length).toBeGreaterThanOrEqual(3);
  for (const def of defs) {
    const words = def.items.reduce((n, it) => n + String(it.text).split(/\s+/).length, 0);
    expect(words).toBeGreaterThanOrEqual(60);
    expect(words).toBeLessThanOrEqual(120);
    expect(def.items.length).toBeGreaterThanOrEqual(3);
    expect(def.items.length).toBeLessThanOrEqual(5);
  }
});

it('chaque type de chaque biome a au moins un exercice', () => {
  for (const biome of BIOMES) {
    const withContent = biome.exercises.filter((x) => exercisesOf(biome.id, x.id).length > 0);
    expect(withContent.length, biome.id).toBeGreaterThanOrEqual(1);
  }
});

it('pickExercise varie entre les exercices d’un même niveau (le moins joué d’abord)', () => {
  const first = pickExercise('foret', 'chasse-son', 1)!;
  expect(first.level).toBe(1);
  const second = pickExercise('foret', 'chasse-son', 1, { [first.id]: { attempts: 1 } })!;
  expect(second.id).not.toBe(first.id);
  expect(second.level).toBe(1);
  // Niveau 2 demandé : on reste au niveau 2 ; niveau 9 : le plus haut disponible.
  expect(pickExercise('foret', 'chasse-son', 2)!.level).toBe(2);
  expect(pickExercise('foret', 'chasse-son', 9)!.level).toBe(2);
  expect(pickExercise('foret', 'rimes', 1)).toBeUndefined();
});
