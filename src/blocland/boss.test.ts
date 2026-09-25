import { BIOMES, getBiome } from './biomes';
import { EMPTY_STATE, type BloclandState, type ExerciseProgress } from './engine';
import { exercisesOf } from './exercises';
import { SCREEN_TYPES } from './exercises/registry';
import { ROUNDS_PER_TYPE, bossDef, bossId, bossesBeaten, isBossBeaten, isBossUnlocked, missingForBoss, typesWithContent } from './boss';

/** Deux étoiles sur un exercice de chaque type du biome. */
function starsEverywhere(biomeId: string, stars: 0 | 1 | 2 | 3 = 2): Record<string, ExerciseProgress> {
  const biome = getBiome(biomeId)!;
  const progress: Record<string, ExerciseProgress> = {};
  for (const type of typesWithContent(biome)) progress[exercisesOf(biome.id, type)[0].id] = { stars, attempts: 1, best: 0.8 };
  return progress;
}

it('le Gardien se débloque avec deux étoiles dans chaque quête du biome, et dit ce qui manque', () => {
  const foret = getBiome('foret')!;
  expect(isBossUnlocked(foret, {})).toBe(false);
  expect(missingForBoss(foret, {})).toEqual(['Abattage syllabique', 'Chasse au son', 'Rimes-échelle']);
  const partial = starsEverywhere('foret');
  delete partial[exercisesOf('foret', 'rimes')[0].id];
  expect(isBossUnlocked(foret, partial)).toBe(false);
  expect(missingForBoss(foret, partial)).toEqual(['Rimes-échelle']);
  expect(isBossUnlocked(foret, starsEverywhere('foret', 1))).toBe(false);
  expect(isBossUnlocked(foret, starsEverywhere('foret'))).toBe(true);
  expect(missingForBoss(foret, starsEverywhere('foret'))).toEqual([]);
});

it('construit un défi avec deux manches par type de quête, aux items de l’exercice, sans doublon', () => {
  for (const biome of BIOMES) {
    const state: BloclandState = { ...EMPTY_STATE, progress: starsEverywhere(biome.id) };
    const def = bossDef(biome, state, () => 0.5);
    expect(def.id).toBe(bossId(biome.id));
    expect(def.type).toBe('boss');
    expect(def.reward.block).toBe('or');
    expect(def.instruction).toContain(biome.guardian);
    const types = typesWithContent(biome);
    const expected = types.reduce((n, t) => n + (SCREEN_TYPES[t].batch === 'all' ? 1 : ROUNDS_PER_TYPE), 0);
    expect(def.items).toHaveLength(expected);
    expect(new Set(def.items.map((r) => r.key)).size).toBe(def.items.length);
    for (const round of def.items) {
      const type = String(round.screenType);
      expect(types).toContain(type);
      const batch = SCREEN_TYPES[type].batch;
      const items = round.items as { key: string }[];
      expect(items.length).toBe(batch === 'all' ? exercisesOf(biome.id, type)[0].items.length : batch);
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

it('est vaincu avec deux étoiles au défi', () => {
  expect(isBossBeaten('foret', {})).toBe(false);
  expect(isBossBeaten('foret', { 'foret-gardien': { stars: 1 } })).toBe(false);
  expect(isBossBeaten('foret', { 'foret-gardien': { stars: 2 } })).toBe(true);
  expect(bossesBeaten({ 'foret-gardien': { stars: 3 }, 'tour-gardien': { stars: 2 } })).toEqual(['foret', 'tour']);
});
