import { BIOMES, BLOCKS } from '../biomes';
import { EXERCISES, exercisesOf, pickExercise, questProgress } from './index';
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
      const known = ['target', 'chosen', 'mined', 'missed', 'verb'].includes(name) || def.items.every((i) => name in i);
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
      // La cible est celle du bloc quand elle change à chaque bloc (filon mélangé), sinon celle de l'exercice.
      expect(it.correct).toBe(it.letter === (it.target ?? def.target));
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
  for (const def of defs)
    for (const it of def.items) {
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

it('rimes : 4 mots par écran, 2 à 3 qui riment, pictogramme et fin entendue', () => {
  const defs = EXERCISES.filter((e) => e.type === 'rimes');
  expect(defs.length).toBeGreaterThanOrEqual(3);
  for (const def of defs) {
    expect(def.target).toBeTruthy();
    expect(def.items.length % 4).toBe(0);
    for (let i = 0; i < def.items.length; i += 4) {
      const good = def.items.slice(i, i + 4).filter((it) => it.correct).length;
      expect(good, `${def.id} écran ${i / 4}`).toBeGreaterThanOrEqual(2);
      expect(good).toBeLessThanOrEqual(3);
    }
    for (const it of def.items) {
      expect(String(it.image).length).toBeGreaterThan(0);
      expect(String(it.ending)).toMatch(/^\[.+\]$/);
    }
  }
});

it('dictées à choix (oreille, coffre) : le mot est parmi 2 ou 3 écritures différentes, avec un indice', () => {
  const defs = EXERCISES.filter((e) => e.type === 'oreille' || e.type === 'coffre');
  expect(defs.length).toBeGreaterThanOrEqual(4);
  for (const def of defs)
    for (const it of def.items) {
      const choices = it.choices as string[];
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(3);
      expect(new Set(choices).size).toBe(choices.length);
      expect(choices).toContain(it.answer);
      expect(it.answer).toBe(it.word);
      expect(String(it.hint).length).toBeGreaterThan(5);
    }
});

it('familles : le morceau choisi et la racine reconstituent le mot', () => {
  const defs = EXERCISES.filter((e) => e.type === 'familles');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs)
    for (const it of def.items) {
      expect(['prefix', 'suffix']).toContain(it.slot);
      expect(it.slot === 'prefix' ? `${it.answer}${it.root}` : `${it.root}${it.answer}`).toBe(it.word);
      expect(it.choices).toHaveLength(3);
      expect(it.choices).toContain(it.answer);
      expect(String(it.meaning).length).toBeGreaterThan(5);
    }
});

it('enclos : 4 sujets par écran, réponse singulier ou pluriel, avec une explication', () => {
  const defs = EXERCISES.filter((e) => e.type === 'enclos');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs) {
    expect(def.items.length % 4).toBe(0);
    for (const it of def.items) {
      expect(['singulier', 'pluriel']).toContain(it.answer);
      expect(it.singular).not.toBe(it.plural);
      expect(String(it.why).length).toBeGreaterThan(10);
    }
  }
});

it('récolte : phrase à trou, trois terminaisons, règle', () => {
  const defs = EXERCISES.filter((e) => e.type === 'recolte');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs)
    for (const it of def.items) {
      expect(String(it.prompt)).toContain('…');
      expect(it.choices).toEqual(['é', 'er', 'ez']);
      expect(it.choices).toContain(it.answer);
      expect(String(it.rule).length).toBeGreaterThan(10);
    }
});

it('plus aucun type d’exercice n’est « bientôt » : chaque type déclaré a du contenu', () => {
  for (const biome of BIOMES) for (const x of biome.exercises) expect(exercisesOf(biome.id, x.id).length, `${biome.id}/${x.id}`).toBeGreaterThanOrEqual(1);
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
  expect(pickExercise('foret', 'rimes', 1)?.type).toBe('rimes');
  expect(pickExercise('tour', 'inconnu', 1)).toBeUndefined();
});

it('questProgress garde la progression d’une quête quand la partie suivante tombe sur une autre variante', () => {
  expect(questProgress('foret', 'chasse-son', {})).toBeUndefined();
  const first = pickExercise('foret', 'chasse-son', 1)!;
  const progress = { [first.id]: { stars: 2, attempts: 1, best: 0.8 } };
  // La prochaine partie proposée est une autre variante, jamais jouée…
  const next = pickExercise('foret', 'chasse-son', 1, progress)!;
  expect(next.id).not.toBe(first.id);
  expect(progress[next.id]).toBeUndefined();
  // … mais la quête affiche toujours ses étoiles.
  expect(questProgress('foret', 'chasse-son', progress)).toEqual({ stars: 2, attempts: 1, best: 0.8 });
  // Toutes variantes et niveaux confondus : meilleures étoiles, meilleur score, parties cumulées.
  const level2 = exercisesOf('foret', 'chasse-son').find((e) => e.level === 2)!;
  const more = { ...progress, [next.id]: { stars: 1, attempts: 2, best: 0.5 }, [level2.id]: { stars: 3, attempts: 1, best: 0.95 } };
  expect(questProgress('foret', 'chasse-son', more)).toEqual({ stars: 3, attempts: 4, best: 0.95 });
  // Les exercices d’autres quêtes ne comptent pas.
  expect(questProgress('foret', 'rimes', more)).toBeUndefined();
});

it('français du collège : phrase à trou (ou question), 2 à 3 choix, règle affichée et explication', () => {
  const defs = EXERCISES.filter((e) => ['carrefour', 'marais', 'falaise', 'cabinet', 'textes'].includes(e.biome));
  expect(
    defs
      .filter((e) => e.type === 'panneaux')
      .map((e) => e.id)
      .sort(),
  ).toEqual(['ces', 'cest', 'la', 'leur', 'ou', 'peu', 'quand'].map((s) => `carrefour-panneaux-${s}`).sort());
  expect(defs.length).toBe(33);
  for (const def of defs)
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect((it.choices as string[]).length).toBeGreaterThanOrEqual(2);
      expect(new Set(it.choices as string[]).size).toBe((it.choices as string[]).length);
      expect((it.aid as { kind: string }).kind).toBe('rule-card');
      expect(String(it.explanation).length).toBeGreaterThan(5);
      expect(String(it.spoken)).not.toContain('…');
    }
});
