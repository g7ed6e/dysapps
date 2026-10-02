import { BIOMES, getBiome, guardianTitle } from './biomes';
import { EMPTY_STATE, type GameState, type ExerciseProgress } from './engine';
import { exercisesOf, loadExercise } from './exercises';
import { SCREEN_TYPES } from './exercises/registry';
import { ROUNDS_PER_TYPE, bossDef, bossId, bossesBeaten, guardianStatus, isBossBeaten, isBossOpen, isBossUnlocked, missingForBoss, typesWithContent } from './boss';

/** Deux étoiles sur un exercice de chaque type du biome. */
function starsEverywhere(biomeId: string, stars: 0 | 1 | 2 | 3 = 2): Record<string, ExerciseProgress> {
  const biome = getBiome(biomeId)!;
  const progress: Record<string, ExerciseProgress> = {};
  for (const type of typesWithContent(biome)) progress[exercisesOf(biome.id, type)[0].id] = { stars, attempts: 1, best: 0.8 };
  return progress;
}

it('le Gardien se débloque avec deux étoiles dans chaque mission du biome, et dit ce qui manque', () => {
  const foret = getBiome('french-6e-phonology')!;
  expect(isBossUnlocked(foret, {})).toBe(false);
  expect(missingForBoss(foret, {})).toEqual(['Abattage syllabique', 'Chasse au son', 'Rimes-échelle']);
  const partial = starsEverywhere('french-6e-phonology');
  delete partial[exercisesOf('french-6e-phonology', 'rhymes')[0].id];
  expect(isBossUnlocked(foret, partial)).toBe(false);
  expect(missingForBoss(foret, partial)).toEqual(['Rimes-échelle']);
  expect(isBossUnlocked(foret, starsEverywhere('french-6e-phonology', 1))).toBe(false);
  expect(isBossUnlocked(foret, starsEverywhere('french-6e-phonology'))).toBe(true);
  expect(missingForBoss(foret, starsEverywhere('french-6e-phonology'))).toEqual([]);
});

it('construit un défi avec deux manches par type de mission, aux items de l’exercice, sans doublon', async () => {
  for (const biome of BIOMES) {
    const state: GameState = { ...EMPTY_STATE, progress: starsEverywhere(biome.id) };
    const def = await bossDef(biome, state, () => 0.5);
    expect(def.id).toBe(bossId(biome.id));
    expect(def.type).toBe('boss');
    expect(def.reward.block).toBe('or');
    expect(def.instruction).toMatch(new RegExp(`^${guardianTitle(biome)} te lance`));
    const types = typesWithContent(biome);
    const expected = types.reduce((n, t) => n + (SCREEN_TYPES[t].batch === 'all' ? 1 : ROUNDS_PER_TYPE), 0);
    expect(def.items).toHaveLength(expected);
    expect(new Set(def.items.map((r) => r.key)).size).toBe(def.items.length);
    for (const round of def.items) {
      const type = String(round.screenType);
      expect(types).toContain(type);
      const batch = SCREEN_TYPES[type].batch;
      const items = round.items as { key: string }[];
      expect(items.length).toBe(batch === 'all' ? (await loadExercise(exercisesOf(biome.id, type)[0].id))!.items.length : batch);
      if (batch !== 'all') expect(String(round.wrong).length).toBeGreaterThan(0);
    }
    // Deux manches du même type ne reprennent pas les mêmes items.
    for (const type of types) {
      const rounds = def.items.filter((r) => r.screenType === type);
      const keys = rounds.flatMap((r) => (r.items as { key: string }[]).map((i) => i.key));
      expect(new Set(keys).size).toBe(keys.length);
    }
  }
});

it('un Gardien vaincu le reste, même si une mission sans étoile arrive sur son île', () => {
  const foret = getBiome('french-6e-phonology')!;
  // Une mission ajoutée après la victoire : les étoiles d'une mission manquent, le défi reste gagné.
  const avantLaMission = { ...starsEverywhere('french-6e-phonology'), [bossId('french-6e-phonology')]: { stars: 2 } };
  delete avantLaMission[exercisesOf('french-6e-phonology', 'rhymes')[0].id];
  expect(isBossUnlocked(foret, avantLaMission)).toBe(false);
  expect(guardianStatus(foret, avantLaMission, [])).toBe('beaten');
  expect(guardianStatus(foret, avantLaMission, [], true)).toBe('beaten');
  // Et son défi reste ouvert : une revanche.
  expect(isBossOpen(foret, avantLaMission)).toBe(true);
  // Sans victoire, les états ne changent pas.
  const sansVictoire = { ...avantLaMission };
  delete sansVictoire[bossId('french-6e-phonology')];
  expect(guardianStatus(foret, sansVictoire, [])).toBe('hidden');
  expect(guardianStatus(foret, sansVictoire, [], true)).toBe('waiting');
  expect(isBossOpen(foret, sansVictoire)).toBe(false);
  expect(guardianStatus(foret, starsEverywhere('french-6e-phonology'), [])).toBe('ready');
});

it('est vaincu avec deux étoiles au défi', () => {
  expect(isBossBeaten('french-6e-phonology', {})).toBe(false);
  expect(isBossBeaten('french-6e-phonology', { 'french-6e-phonology-challenge': { stars: 1 } })).toBe(false);
  expect(isBossBeaten('french-6e-phonology', { 'french-6e-phonology-challenge': { stars: 2 } })).toBe(true);
  expect(bossesBeaten({ 'french-6e-phonology-challenge': { stars: 3 }, 'french-6e-reading-challenge': { stars: 2 } })).toEqual(['french-6e-phonology', 'french-6e-reading']);
});
