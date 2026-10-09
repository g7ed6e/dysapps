// La migration en avant des programmes de 2025-2026 (format 4) : une partie du format 3 garde ses étoiles, sa file de
// révision et tout ce qu'elle a, quand ses exercices changent de lieu ; chaque déplacement mène à un exercice qui existe,
// et chaque item déplacé y garde sa clé.
import { getBiome, type BiomeId } from '../game/biomes';
import { poserLesPartiesDues, rattraperLesParties, sanitizeState } from '../game/engine';
import { partiesDe, partiesPosees, prochainePartie } from '../game/world/parts';
import { planCells, plansFor, type PlanDef } from '../game/world/plans';
import { loadAllExercises, questProgress } from '../game/exercises';
import { grantAccess, isBiomeUnlocked, voyageId } from '../game/world/archipelago';
import { lastPlace } from './lastPlace';
import { GAME_VERSION, migrateStorage, translateGame } from './migration';
import { MOVED_EXERCISES, MOVED_ITEMS, MOVED_PATHS, RETIRED_ITEMS, movedExerciseId, movedItemId, movedPath } from './movedIds';

const EXERCISES = await loadAllExercises();
const byId = new Map(EXERCISES.map((e) => [e.id, e]));

/** Le libellé d'une mission tel que sa page le retient (ExercisePage). */
const labelOf = (place: string, mission: string) => {
  const b = getBiome(place)!;
  return `${b.exercises.find((e) => e.id === mission)!.title} · ${b.name}`;
};
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
    // Les Étals et les Icebergs perdent leur niveau 3 : leurs étoiles restent aussi dans la mission, au niveau 2, avec leur
    // meilleur score, sans partie de plus. L'Aiguillage a déjà mieux au niveau 2 : rien ne change.
    'maths-5e-proportionality-proportion-tables-2': P(2, 0, 0.75),
    'maths-5e-signed-numbers-fractions-2': P(3, 0, 1),
  });
  // Aucune étoile ne se perd : chaque exercice d'avant a les siennes sous son identifiant d'aujourd'hui.
  for (const [id, p] of Object.entries(FORMAT_3.progress)) expect(g.progress[movedExerciseId(id) as keyof typeof g.progress], id).toEqual(p);
});

it('la file de révision suit : l’exercice change, la clé de l’item jamais', () => {
  const g = translateGame(FORMAT_3) as typeof FORMAT_3;
  expect(g.spaced.map((s) => s.itemId)).toEqual([
    'maths-4e-powers-subtracting-1:mul-3-4',
    'maths-3e-statistics-ratio-sharing-1:partage-deux-1-2-6-0-caisses',
    'french-4e-vocabulary-conjunctions-1:french-5e-homophones-choices-3-4',
    'french-4e-vocabulary-conjunctions-2:french-5e-homophones-choices-2-1',
    // Plus tôt et plutôt (homophones lexicaux, en 3e) ne sont plus au Carrefour : l'item retiré quitte la file.
    'french-4e-vocabulary-conjunctions-2:french-5e-homophones-choices-1-7',
    'french-5e-homophones-choices-1:french-5e-homophones-choices-1-3',
    'french-4e-vocabulary-conjunctions-3:french-5e-conjugation-subjunctive-1-6',
    'french-5e-conjugation-tense-recognition-1:french-5e-conjugation-subjunctive-2-0',
    'maths-5e-signed-numbers-thermometer-1:cmp-3-5',
  ]);
  // Rien d'autre ne change dans une entrée : la date, l'étape, la série.
  const kept = FORMAT_3.spaced.filter((x) => !RETIRED_ITEMS.has(x.itemId));
  expect(g.spaced.map(({ due, stage, streak }) => ({ due, stage, streak }))).toEqual(kept.map(({ due, stage, streak }) => ({ due, stage, streak })));
});

it('le stock, les niveaux adaptés, les parties posées et les liaisons restent tels quels ; la partie passe au dernier format', () => {
  const g = translateGame(FORMAT_3) as typeof FORMAT_3;
  expect(g.stock).toEqual(FORMAT_3.stock);
  expect(g.types).toEqual(FORMAT_3.types);
  expect(g.world).toEqual(FORMAT_3.world);
  expect(GAME_VERSION).toBe(5);
  expect(sanitizeState(FORMAT_3).version).toBe(5);
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

it('la sauvegarde de l’appareil passe au dernier format, et « Ma dernière mission » suit la mission déplacée, sous son nouveau nom', () => {
  localStorage.clear();
  localStorage.setItem('dysapps:game', JSON.stringify(FORMAT_3));
  localStorage.setItem('dysapps:resume', JSON.stringify({ path: '/adventure/maths-5e-signed-numbers/subtracting', label: 'Crevasses' }));
  migrateStorage();
  const game = JSON.parse(localStorage.getItem('dysapps:game')!) as { version: number; progress: Record<string, unknown> };
  expect(game.version).toBe(5);
  expect(game.progress['maths-4e-powers-subtracting-3']).toEqual(P(3, 2, 1));
  // L'adresse reste celle d'avant dans la sauvegarde : lastPlace la suit à la lecture, avec le libellé de sa nouvelle place.
  expect(JSON.parse(localStorage.getItem('dysapps:resume')!)).toEqual({ path: '/adventure/maths-5e-signed-numbers/subtracting', label: 'Crevasses' });
  expect(lastPlace()).toEqual({ path: '/adventure/maths-4e-powers/subtracting', label: labelOf('maths-4e-powers', 'subtracting') });
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

/**
 * Les clés des exercices écrits touchés par le lot, telles qu'elles étaient au format 3 (figées, comme movedIds.ts) :
 * huit items chacun, `<exercice>-<n>`, sauf les Panneaux de ou / où et quand / quant / qu'en.
 */
const WRITTEN_BEFORE_MOVE: Record<string, string[]> = Object.fromEntries([
  ...[
    'french-5e-homophones-choices-1',
    'french-5e-homophones-choices-2',
    'french-5e-homophones-choices-3',
    'french-5e-homophones-homophone-sentences-2',
    'french-5e-conjugation-subjunctive-1',
    'french-5e-conjugation-subjunctive-2',
  ].map((id) => [id, Array.from({ length: 8 }, (_, i) => `${id}-${i}`)]),
  ['french-5e-homophones-pairs-ou', Array.from({ length: 8 }, (_, i) => `ou-${i}`)],
  ['french-5e-homophones-pairs-quand', Array.from({ length: 8 }, (_, i) => `quand-${i}`)],
]);

it('chaque item écrit, déplacé ou resté, retrouve sa clé dans son exercice, ou est retiré (et quitte la file)', () => {
  for (const [from, keys] of Object.entries(WRITTEN_BEFORE_MOVE))
    for (const key of keys) {
      const itemId = `${from}:${key}`;
      if (RETIRED_ITEMS.has(itemId)) continue;
      const [ex, k] = movedItemId(itemId).split(':');
      expect(byId.get(ex)?.items.map((it) => it.key) ?? [], `${itemId} → ${ex}`).toContain(k);
    }
  // Un item retiré n'a plus de place nulle part : ni sous son identifiant, ni sous celui du déplacement.
  for (const itemId of RETIRED_ITEMS) {
    expect(Object.keys(WRITTEN_BEFORE_MOVE), itemId).toContain(itemId.slice(0, itemId.lastIndexOf(':')));
    const [ex, k] = movedItemId(itemId).split(':');
    expect(byId.get(ex)?.items.map((it) => it.key) ?? [], itemId).not.toContain(k);
  }
  const g = translateGame({ version: 3, spaced: [...RETIRED_ITEMS].map((id) => S(id)) }) as typeof FORMAT_3;
  expect(g.spaced).toEqual([]);
});

it('les étoiles d’une mission ne baissent jamais : l’Aiguillage, les Étals et les Icebergs, qui perdent un niveau', () => {
  const avant = {
    version: 3,
    progress: {
      'french-5e-homophones-choices-1': P(1, 2, 0.5),
      'french-5e-homophones-choices-3': P(3, 1, 1),
      'maths-5e-proportionality-proportion-tables-1': P(1, 1, 0.5),
      'maths-5e-proportionality-proportion-tables-3': P(3, 1, 1),
      'maths-5e-signed-numbers-fractions-3': P(2, 1, 0.8),
    },
  };
  const s = sanitizeState(avant);
  for (const [biome, type, stars] of [
    ['french-5e-homophones', 'choices', 3],
    ['maths-5e-proportionality', 'proportion-tables', 3],
    ['maths-5e-signed-numbers', 'fractions', 2],
  ] as const)
    expect(questProgress(biome, type, s.progress)?.stars, `${biome} ${type}`).toBe(stars);
  // Le niveau parti garde aussi ses étoiles à sa nouvelle place (les Liens du Cabinet).
  expect(questProgress('french-4e-vocabulary', 'conjunctions', s.progress)?.stars).toBe(3);
});

it('le bâtiment d’un lieu qui perd ou reçoit une mission : rien de posé ne disparaît, aucune partie n’est annoncée en trop', () => {
  const [p0, p1, p2] = plansFor('maths-5e-signed-numbers');
  const all = (plan: PlanDef) => planCells(plan).map((c) => c.key);
  // L'ancienne première partie d'un Glacier à quatre missions : le bas du premier plan, une partie de ses cases.
  const bas = [...planCells(p0)].sort((a, b) => a.z - b.z).slice(0, Math.ceil(planCells(p0).length / 2)).map((c) => c.key);
  const ouvrir = (progress: Record<string, unknown>, parts: Record<string, string[]>) =>
    rattraperLesParties(sanitizeState({ version: 3, progress, world: { parts, log: [], links: ['passage-5e'] } }), '2026-10-08').state;
  const garde = (s: { world: { parts: Record<string, string[]> } }, parts: Record<string, string[]>) => {
    for (const [plan, keys] of Object.entries(parts)) expect(s.world.parts[plan], plan).toEqual(expect.arrayContaining(keys));
  };
  // Le Glacier a reçu deux missions au 9 octobre 2026 (GD-14) : cinq parties ; l'igloo n'a que deux rangées, il se
  // coupe en deux, et le dôme aussi.
  expect(partiesDe('maths-5e-signed-numbers').map((p) => p.nom).at(-1)).toBe(p2.name);

  // 1 partie sur 4, posée par le Thermomètre (qui reste) : le premier plan s'achève à l'ouverture, rien ne s'enlève.
  const un = ouvrir({ 'maths-5e-signed-numbers-thermometer-1': P(2, 1, 0.8) }, { [p0.id]: bas });
  garde(un, { [p0.id]: bas });
  expect(partiesPosees('maths-5e-signed-numbers', un.world.parts)).toBe(1);
  // 1 partie sur 4, posée par les Crevasses (parties à la Forge) : le bas reste posé ; la partie suivante est le haut
  // de l'igloo (GD-14).
  const crevasses = ouvrir({ 'maths-5e-signed-numbers-subtracting-1': P(2, 1, 0.8) }, { [p0.id]: bas });
  garde(crevasses, { [p0.id]: bas });
  expect(partiesPosees('maths-5e-signed-numbers', crevasses.world.parts)).toBe(1);
  expect(prochainePartie('maths-5e-signed-numbers', crevasses.world.parts)?.nom).toBe('Le haut de l’igloo de Frimas');
  // 3 parties sur 4 (le premier plan entier, le deuxième) : 4 sur 5, la suivante est le troisième plan.
  const trois = ouvrir(
    { 'maths-5e-signed-numbers-thermometer-1': P(2, 1, 0.8), 'maths-5e-signed-numbers-adding-1': P(2, 1, 0.8), 'maths-5e-signed-numbers-subtracting-1': P(2, 1, 0.8) },
    { [p0.id]: all(p0), [p1.id]: all(p1) },
  );
  garde(trois, { [p0.id]: all(p0), [p1.id]: all(p1) });
  expect(partiesPosees('maths-5e-signed-numbers', trois.world.parts)).toBe(4);
  expect(prochainePartie('maths-5e-signed-numbers', trois.world.parts)?.nom).toBe(p2.name);

  // La Forge finie à 3 sur 3 reçoit le Fourneau (puis Volumes, GD-14) : cinq parties, toutes posées ; le Fourneau joué n'en pose aucune.
  const forge = plansFor('maths-4e-powers');
  const finie = Object.fromEntries(forge.map((p) => [p.id, all(p)]));
  const f = ouvrir({ 'maths-4e-powers-powers-1': P(3, 1, 1), 'maths-4e-powers-square-roots-1': P(3, 1, 1), 'maths-4e-powers-scientific-notation-1': P(3, 1, 1) }, finie);
  garde(f, finie);
  expect(partiesDe('maths-4e-powers')).toHaveLength(5);
  expect(prochainePartie('maths-4e-powers', f.world.parts)).toBeNull();
  const fourneau = poserLesPartiesDues({ ...f, progress: { ...f.progress, 'maths-4e-powers-subtracting-1': { stars: 2, attempts: 1, best: 0.8 } } }, 'maths-4e-powers', '2026-10-08');
  expect(fourneau.pose).toBeNull();
});
