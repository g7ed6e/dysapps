// Catalogue des exercices Blocland (JSON chargés statiquement).
import type { BiomeId } from '../biomes';
import type { ExerciseDef } from './types';
import foretEchauffement from './data/foret-echauffement-001.json';

export const EXERCISES: ExerciseDef[] = [foretEchauffement as ExerciseDef];

/** Exercices d'un type dans un biome, par niveau croissant. */
export function exercisesOf(biome: BiomeId, type: string): ExerciseDef[] {
  return EXERCISES.filter((e) => e.biome === biome && e.type === type).sort((a, b) => a.level - b.level);
}

/** L'exercice le plus proche du niveau demandé (jamais au-dessus s'il existe un niveau inférieur). */
export function pickExercise(biome: BiomeId, type: string, level: number): ExerciseDef | undefined {
  const all = exercisesOf(biome, type);
  if (all.length === 0) return undefined;
  const below = all.filter((e) => e.level <= level);
  return below.length ? below[below.length - 1] : all[0];
}

export function getExercise(id: string): ExerciseDef | undefined {
  return EXERCISES.find((e) => e.id === id);
}
