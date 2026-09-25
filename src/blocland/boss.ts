// Le Gardien d'un biome : un défi qui enchaîne des manches de chaque quête du biome, au niveau de l'élève.
// Logique pure : déblocage, construction du défi, état « vaincu ».
import { BIOMES, type BiomeDef, type BiomeId } from './biomes';
import { levelFor, type BloclandState } from './engine';
import { SCREEN_TYPES } from './exercises/registry';
import { exercisesOf, pickExercise } from './exercises';
import type { ExerciseDef, ExerciseItem } from './exercises/types';

import { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten } from './bossCore';

/** Manches par type de quête. */
export const ROUNDS_PER_TYPE = 2;

export { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten };

/** Une manche : un écran d'un type de quête, avec ses items. */
export interface BossRound extends ExerciseItem {
  screenType: string;
  exerciseId: string;
  target?: string;
  items: ExerciseItem[];
  /** Message de correction du type d'origine (rempli par l'écran du Gardien). */
  wrong: string;
}

/** Les types de quêtes du biome qui ont du contenu. */
export function typesWithContent(biome: BiomeDef): string[] {
  return biome.exercises.filter((x) => exercisesOf(biome.id, x.id).length > 0).map((x) => x.id);
}

/** Le Gardien accepte le défi quand chaque quête du biome a au moins deux étoiles. */
export function isBossUnlocked(biome: BiomeDef, progress: Record<string, { stars: number }>): boolean {
  return typesWithContent(biome).every((type) => exercisesOf(biome.id, type).some((def) => (progress[def.id]?.stars ?? 0) >= STARS_TO_UNLOCK));
}

/** Les quêtes du biome où il manque encore des étoiles (pour l'expliquer à l'élève). */
export function missingForBoss(biome: BiomeDef, progress: Record<string, { stars: number }>): string[] {
  return biome.exercises
    .filter((x) => typesWithContent(biome).includes(x.id))
    .filter((x) => !exercisesOf(biome.id, x.id).some((def) => (progress[def.id]?.stars ?? 0) >= STARS_TO_UNLOCK))
    .map((x) => x.title);
}

export function bossesBeaten(progress: Record<string, { stars: number }>): BiomeId[] {
  return BIOMES.filter((b) => isBossBeaten(b.id, progress)).map((b) => b.id);
}

/**
 * Construit le défi : pour chaque type de quête, deux manches tirées d'un exercice au niveau de l'élève
 * (des items différents pour chaque manche ; un texte entier pour les types « tout sur un écran »).
 */
export function bossDef(biome: BiomeDef, state: BloclandState, rng: () => number = Math.random): ExerciseDef {
  const rounds: BossRound[] = [];
  for (const type of typesWithContent(biome)) {
    const def = pickExercise(biome.id, type, levelFor(state, type), state.progress);
    if (!def) continue;
    const batch = SCREEN_TYPES[type]?.batch ?? 1;
    if (batch === 'all') {
      rounds.push({ key: `${type}-0`, screenType: type, exerciseId: def.id, target: def.target, items: def.items, wrong: def.feedback.wrong });
      continue;
    }
    // Les écrans de l'exercice, dans un ordre mélangé, sans en reprendre deux fois le même.
    const screens: ExerciseItem[][] = [];
    for (let i = 0; i + batch <= def.items.length; i += batch) screens.push(def.items.slice(i, i + batch));
    for (let i = screens.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [screens[i], screens[j]] = [screens[j], screens[i]];
    }
    screens.slice(0, ROUNDS_PER_TYPE).forEach((items, i) => {
      rounds.push({ key: `${type}-${i}`, screenType: type, exerciseId: def.id, target: def.target, items, wrong: def.feedback.wrong });
    });
  }
  return {
    id: bossId(biome.id),
    biome: biome.id,
    type: 'boss',
    level: 1,
    instruction: `${biome.guardian} te lance ${rounds.length} épreuves, une de chaque quête. Prends ton temps : il ne compte pas les secondes.`,
    items: rounds,
    feedback: { correct: `${biome.guardian} hoche la tête.`, wrong: '{explain}' },
    reward: { block: 'or', amount: 3, xp: 60 },
    adaptive: { promoteAt: 1.1, demoteAt: -1 },
  };
}
