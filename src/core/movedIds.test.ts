// La migration en avant des programmes de 2025-2026 (format 4) : une partie du format 3 garde ses étoiles, sa file de
// révision et tout ce qu'elle a, quand ses exercices changent de lieu ; chaque déplacement mène à un exercice qui existe,
// et chaque item déplacé y garde sa clé.
import type { BiomeId } from '../game/biomes';
import { sanitizeState } from '../game/engine';
import { loadAllExercises } from '../game/exercises';
import { grantAccess, isBiomeUnlocked, voyageId } from '../game/world/archipelago';
import { GAME_VERSION, migrateStorage, translateGame } from './migration';
import { MOVED_EXERCISES, MOVED_ITEMS, MOVED_PATHS, movedExerciseId, movedItemId, movedPath } from './movedIds';

const EXERCISES = await loadAllExercises();
const byId = new Map(EXERCISES.map((e) => [e.id, e]));

const P = (stars: number, attempts: number, best: number) => ({ stars, attempts, best });
const S = (itemId: string, due = '2026-10-08') => ({ itemId, due, stage: 1, streak: 0 });

/** Une partie du format 3, jouée sur les exercices de 5e qui changent de lieu, et sur d'autres qui restent. */
const FORMAT_3 = {
  version: 3,
  progress: {
    'maths-5e-signed-numbers-thermometer-1': P(3, 4, 1),
    'maths-5e-signed-numbers-subtracting-1': P(2, 3, 0.8),
    'maths-5e-signed-numbers-subtracting-2': P(1, 1, 0.6),
    'maths-5e-signed-numbers-fractions-3': P(3, 2, 1),
    'maths-5e-proportionality-proportion-tables-3': P(2, 2, 0.75),
    'french-5e-homophones-choices-1': P(3, 2, 1),
    'french-5e-homophones-choices-2': P(2, 1, 0.8),
    'french-5e-homophones-choices-3': P(1, 1, 0.5),
    'french-5e-conjugation-subjunctive-1': P(2, 5, 0.9),
    'french-5e-conjugation-subjunctive-2': P(3, 1, 1),
  },
  spaced: [
    S('maths-5e-signed-numbers-subtracting-1:mul-3-4'),
    S('maths-5e-proportionality-proportion-tables-3:partage-deux-1-2-6-0-caisses'),
    S('french-5e-homophones-choices-3:french-5e-homophones-choices-3-4'),
    S('french-5e-homophones-choices-2:french-5e-homophones-choices-2-1'),
    S('french-5e-homophones-choices-2:french-5e-homophones-choices-2-5'),
    S('french-5e-homophones-choices-1:french-5e-homophones-choices-1-7'),
    S('french-5e-homophones-choices-1:french-5e-homophones-choices-1-3'),
    S('french-5e-conjugation-subjunctive-1:french-5e-conjugation-subjunctive-1-6'),
    S('french-5e-conjugation-subjunctive-2:french-5e-conjugation-subjunctive-2-0'),
    S('maths-5e-signed-numbers-thermometer-1:cmp-3-5'),
  ],
  stock: { 'maths-5e-signed-numbers': 12, 'french-5e-homophones': 4 },
  types: { subtracting: { level: 2, recent: [0.9] }, choices: { level: 3, recent: [] }, subjunctive: { level: 2, recent: [] } },
  world: { parts: { 'maths-5e-signed-numbers-1': ['0,0,0'] }, log: [], links: ['passage-5e'] },
};

it('les étoiles des exercices déplacés passent à leur nouvel identifiant ; les autres ne bougent pas', () => {
  const g = translateGame(FORMAT_3) as typeof FORMAT_3;
  expect(g.progress).toEqual({
    'maths-5e-signed-numbers-thermometer-1': P(3, 4, 1),
    'maths-4e-powers-subtracting-1': P(2, 3, 0.8),
    'maths-4e-powers-subtracting-2': P(1, 1, 0.6),
    'maths-4e-powers-subtracting-3': P(3, 2, 1),
    'maths-3e-statistics-ratio-sharing-1': P(2, 2, 0.75),
    'french-5e-homophones-choices-1': P(3, 2, 1),
    'french-5e-homophones-choices-2': P(2, 1, 0.8),
    'french-4e-vocabulary-conjunctions-1': P(1, 1, 0.5),
    'french-4e-vocabulary-conjunctions-3': P(2, 5, 0.9),
    'french-5e-conjugation-tense-recognition-1': P(3, 1, 1),
  });
  // Autant d'étoiles en tout : aucune ne se perd.
  const total = (p: Record<string, { stars: number }>) => Object.values(p).reduce((n, x) => n + x.stars, 0);
  expect(total(g.progress)).toBe(total(FORMAT_3.progress));
});

it('la file de révision suit : l’exercice change, la clé de l’item jamais', () => {
  const g = translateGame(FORMAT_3) as typeof FORMAT_3;
  expect(g.spaced.map((s) => s.itemId)).toEqual([
    'maths-4e-powers-subtracting-1:mul-3-4',
    'maths-3e-statistics-ratio-sharing-1:partage-deux-1-2-6-0-caisses',
    'french-4e-vocabulary-conjunctions-1:french-5e-homophones-choices-3-4',
    'french-4e-vocabulary-conjunctions-2:french-5e-homophones-choices-2-1',
    // Plus tôt et plutôt (homophones lexicaux, en 3e) ne sont plus au Carrefour : l'item reste dans la file, sans exercice.
    'french-5e-homophones-choices-2:french-5e-homophones-choices-2-5',
    'french-4e-vocabulary-conjunctions-2:french-5e-homophones-choices-1-7',
    'french-5e-homophones-choices-1:french-5e-homophones-choices-1-3',
    'french-4e-vocabulary-conjunctions-3:french-5e-conjugation-subjunctive-1-6',
    'french-5e-conjugation-tense-recognition-1:french-5e-conjugation-subjunctive-2-0',
    'maths-5e-signed-numbers-thermometer-1:cmp-3-5',
  ]);
  // Rien d'autre ne change dans une entrée : la date, l'étape, la série.
  expect(g.spaced.map(({ due, stage, streak }) => ({ due, stage, streak }))).toEqual(FORMAT_3.spaced.map(({ due, stage, streak }) => ({ due, stage, streak })));
});

it('le stock, les niveaux adaptés, les parties posées et les liaisons restent tels quels ; la partie passe au format 4', () => {
  const g = translateGame(FORMAT_3) as typeof FORMAT_3;
  expect(g.stock).toEqual(FORMAT_3.stock);
  expect(g.types).toEqual(FORMAT_3.types);
  expect(g.world).toEqual(FORMAT_3.world);
  expect(GAME_VERSION).toBe(4);
  expect(sanitizeState(FORMAT_3).version).toBe(4);
  expect(sanitizeState(FORMAT_3).progress['maths-4e-powers-subtracting-1']).toEqual(P(2, 3, 0.8));
});

it('une partie déjà au format 4 ne bouge plus ; un exercice déjà déplacé par un autre onglet réunit ses progressions', () => {
  const g = translateGame(FORMAT_3);
  expect(translateGame({ ...(g as object), version: 4 })).toEqual({ ...(g as object), version: 4 });
  const deux = translateGame({
    version: 3,
    progress: { 'maths-5e-signed-numbers-subtracting-1': P(1, 2, 0.5), 'maths-4e-powers-subtracting-1': P(3, 1, 1) },
    spaced: [S('maths-5e-signed-numbers-subtracting-1:mul-3-4', '2026-10-09'), S('maths-4e-powers-subtracting-1:mul-3-4', '2026-10-10')],
  }) as typeof FORMAT_3;
  expect(deux.progress).toEqual({ 'maths-4e-powers-subtracting-1': P(3, 3, 1) });
  expect(deux.spaced).toEqual([S('maths-4e-powers-subtracting-1:mul-3-4', '2026-10-09')]);
});

it('une très ancienne partie (identifiants d’avant les mots neutres) passe par les deux traductions', () => {
  const g = translateGame({ progress: { 'glacier-crevasses-1': P(2, 1, 0.9) }, spaced: [S('glacier-crevasses-1:mul-3-4')] }) as typeof FORMAT_3;
  expect(g.progress).toEqual({ 'maths-4e-powers-subtracting-1': P(2, 1, 0.9) });
  expect(g.spaced[0].itemId).toBe('maths-4e-powers-subtracting-1:mul-3-4');
});

it('la sauvegarde de l’appareil passe au format 4, et « Ma dernière mission » suit la mission déplacée', () => {
  localStorage.clear();
  localStorage.setItem('dysapps:game', JSON.stringify(FORMAT_3));
  localStorage.setItem('dysapps:resume', JSON.stringify({ path: '/adventure/maths-5e-signed-numbers/subtracting', label: 'Crevasses' }));
  migrateStorage();
  const game = JSON.parse(localStorage.getItem('dysapps:game')!) as { version: number; progress: Record<string, unknown> };
  expect(game.version).toBe(4);
  expect(game.progress['maths-4e-powers-subtracting-3']).toEqual(P(3, 2, 1));
  expect(JSON.parse(localStorage.getItem('dysapps:resume')!)).toEqual({ path: '/adventure/maths-4e-powers/subtracting', label: 'Crevasses' });
  expect(movedPath('/adventure/french-5e-conjugation/subjunctive?x=1')).toBe('/adventure/french-5e-conjugation/tense-recognition?x=1');
  expect(movedPath('/adventure/french-5e-conjugation/past-tenses')).toBe('/adventure/french-5e-conjugation/past-tenses');
});

it('chaque déplacement mène à un exercice qui existe, et chaque item déplacé y retrouve sa clé', () => {
  for (const [from, to] of Object.entries(MOVED_EXERCISES)) {
    expect(byId.has(to), `${from} → ${to} : exercice inconnu`).toBe(true);
    expect(byId.get(to)!.items.length).toBeGreaterThan(0);
  }
  // Les exercices écrits en Markdown déplacés entiers gardent les clés de leurs items (un item retiré peut manquer).
  for (const to of ['french-4e-vocabulary-conjunctions-1', 'french-4e-vocabulary-conjunctions-3', 'french-5e-conjugation-tense-recognition-1']) {
    const from = Object.keys(MOVED_EXERCISES).find((k) => MOVED_EXERCISES[k] === to)!;
    const keys = byId.get(to)!.items.map((it) => it.key);
    expect(keys.filter((k) => k.startsWith(`${from}-`)).length, to).toBeGreaterThanOrEqual(6);
  }
  for (const itemId of Object.keys(MOVED_ITEMS)) {
    const [ex, key] = movedItemId(itemId).split(':');
    expect(byId.get(ex)!.items.map((it) => it.key), itemId).toContain(key);
  }
  // Les missions déplacées existent à leur nouvelle adresse.
  for (const to of Object.values(MOVED_PATHS)) {
    const [, , biome, type] = to.split('/');
    expect(EXERCISES.some((e) => e.biome === biome && e.type === type), to).toBe(true);
  }
});

it('un exercice arrivé d’un autre lieu n’ouvre pas son lieu : ni voyage, ni étape du Bloc-Navire, et les étoiles restent', () => {
  // Un élève de 5e : ses lieux de 5e ouverts, rien au-delà.
  const links = grantAccess([], ['maths-5e-signed-numbers', 'maths-5e-proportionality', 'french-5e-conjugation']);
  const cases: [string, BiomeId][] = [
    ['maths-5e-signed-numbers-subtracting-1', 'maths-4e-powers'],
    ['french-5e-conjugation-subjunctive-1', 'french-4e-vocabulary'],
    ['maths-5e-proportionality-proportion-tables-3', 'maths-3e-statistics'],
  ];
  for (const [ancien, lieu] of cases) {
    const s = sanitizeState({ version: 3, progress: { [ancien]: P(3, 2, 1) }, world: { parts: {}, log: [], links } });
    expect(isBiomeUnlocked(lieu, s.world.links), ancien).toBe(false);
    expect(s.world.links, ancien).toEqual(links);
    expect(s.world.links).not.toContain(voyageId('4e'));
    expect(s.world.links).not.toContain(voyageId('3e'));
    expect(s.progress[movedExerciseId(ancien)], ancien).toEqual(P(3, 2, 1));
  }
  // Déplacé dans son propre lieu (des Roseaux aux Reflets du Marais), l'exercice compte encore : le Marais reste ouvert.
  const marais = sanitizeState({ version: 3, progress: { 'french-5e-conjugation-subjunctive-2': P(2, 1, 0.8) }, world: { parts: {}, log: [], links: [] } });
  expect(isBiomeUnlocked('french-5e-conjugation', marais.world.links)).toBe(true);
});
