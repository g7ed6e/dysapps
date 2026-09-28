// Le Gardien d'un biome : un défi qui enchaîne des manches de chaque mission du biome, au niveau de l'élève.
// Logique pure : déblocage, construction du défi, état « vaincu ».
import { BIOMES, guardianTitle, type BiomeDef, type BiomeId } from './biomes';
import { levelFor, type BloclandState } from './engine';
import { SCREEN_TYPES } from './exercises/registry';
import { exercisesOf, loadExercise, pickExercise } from './exercises';
import { runItems } from './exercises/run';
import { isBiomeUnlocked } from './world/archipelago';
import type { ExerciseDef, ExerciseItem } from './exercises/types';
import type { Lang } from '../core/speech';

import { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten } from './bossCore';

/** Manches par type de mission. */
export const ROUNDS_PER_TYPE = 2;

export { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten };

/** Une manche : un écran d'un type de mission, avec ses items. */
export interface BossRound extends ExerciseItem {
  screenType: string;
  exerciseId: string;
  /** Consigne de la mission d'origine, affichée au-dessus de la manche. */
  instruction: string;
  target?: string;
  /** Langue du contenu de la mission d'origine. */
  lang?: Lang;
  items: ExerciseItem[];
  /** Message de correction du type d'origine (rempli par l'écran du Gardien). */
  wrong: string;
}

/** Les types de missions du biome qui ont du contenu. */
export function typesWithContent(biome: BiomeDef): string[] {
  return biome.exercises.filter((x) => exercisesOf(biome.id, x.id).length > 0).map((x) => x.id);
}

/** Le Gardien accepte le défi quand chaque mission du biome a au moins deux étoiles. */
export function isBossUnlocked(biome: BiomeDef, progress: Record<string, { stars: number }>): boolean {
  return typesWithContent(biome).every((type) => exercisesOf(biome.id, type).some((def) => (progress[def.id]?.stars ?? 0) >= STARS_TO_UNLOCK));
}

export type GuardianStatus = 'hidden' | 'ready' | 'beaten';

/** Le Gardien n'apparaît que lorsqu'il accepte le défi (son île ouverte) ; vaincu, il devient une statue. */
export function guardianStatus(biome: BiomeDef, progress: Record<string, { stars: number }>, bridges: string[]): GuardianStatus {
  if (!isBiomeUnlocked(biome.id, bridges) || !isBossUnlocked(biome, progress)) return 'hidden';
  return isBossBeaten(biome.id, progress) ? 'beaten' : 'ready';
}

/** Les missions du biome où il manque encore des étoiles (pour l'expliquer à l'élève). */
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
 * Construit le défi : pour chaque type de mission, deux manches tirées d'un exercice au niveau de l'élève
 * (des items différents pour chaque manche ; un texte entier pour les types « tout sur un écran »). Les items sont
 * ceux d'une partie tirée au hasard : d'autres nombres, d'autres mots, et des réponses qui changent de place.
 * Le contenu des exercices est chargé à la demande (voir `loadExercise`).
 */
export async function bossDef(biome: BiomeDef, state: BloclandState, rng: () => number = Math.random): Promise<ExerciseDef> {
  const types = typesWithContent(biome);
  const defs = await Promise.all(
    types.map((type) => {
      const picked = pickExercise(biome.id, type, levelFor(state, type), state.progress);
      return picked ? loadExercise(picked.id) : undefined;
    }),
  );
  const rounds: BossRound[] = [];
  types.forEach((type, t) => {
    const def = defs[t];
    if (!def) return;
    const batch = SCREEN_TYPES[type]?.batch ?? 1;
    const items = runItems(def, `${def.id}#gardien${Math.floor(rng() * 2 ** 32).toString(36)}`);
    if (batch === 'all') {
      rounds.push({ key: `${type}-0`, screenType: type, exerciseId: def.id, instruction: def.instruction, target: def.target, lang: def.lang, items, wrong: def.feedback.wrong });
      return;
    }
    // Les écrans de l'exercice, dans un ordre mélangé, sans en reprendre deux fois le même.
    const screens: ExerciseItem[][] = [];
    for (let i = 0; i + batch <= items.length; i += batch) screens.push(items.slice(i, i + batch));
    for (let i = screens.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [screens[i], screens[j]] = [screens[j], screens[i]];
    }
    screens.slice(0, ROUNDS_PER_TYPE).forEach((items, i) => {
      rounds.push({ key: `${type}-${i}`, screenType: type, exerciseId: def.id, instruction: def.instruction, target: def.target, lang: def.lang, items, wrong: def.feedback.wrong });
    });
  });
  return {
    id: bossId(biome.id),
    biome: biome.id,
    type: 'boss',
    level: 1,
    instruction: `${guardianTitle(biome)} te lance ${rounds.length} épreuves, une de chaque mission. Prends ton temps : il ne compte pas les secondes.`,
    items: rounds,
    feedback: { correct: `${guardianTitle(biome)} hoche la tête.`, wrong: '{explain}' },
    reward: { block: 'or', amount: 3, xp: 60 },
    adaptive: { promoteAt: 1.1, demoteAt: -1 },
  };
}
