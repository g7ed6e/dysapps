// Les règles du Gardien qui ne dépendent de rien d'autre (partagées avec le continent, sans import circulaire).
import type { BiomeId } from './biomes';

/** Étoiles à obtenir dans chaque quête pour affronter le Gardien, et pour le vaincre. */
export const STARS_TO_UNLOCK = 2;
export const STARS_TO_BEAT = 2;

export const bossId = (biome: BiomeId) => `${biome}-gardien`;

export function isBossBeaten(biome: BiomeId, progress: Record<string, { stars: number }>): boolean {
  return (progress[bossId(biome)]?.stars ?? 0) >= STARS_TO_BEAT;
}
