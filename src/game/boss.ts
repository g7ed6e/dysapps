// Le Gardien d'un biome : un défi qui enchaîne des manches de chaque mission du biome, au niveau de l'élève.
// Logique pure : déblocage, construction du défi, état « rallumé » (`beaten`).
import { BIOMES, guardianTitle, missionsJouables, type BiomeDef, type BiomeId } from './biomes';
import { levelFor, type GameState } from './engine';
import { SCREEN_TYPES } from './exercises/registry';
import { exercisesOf, loadExercise, pickExercise } from './exercises';
import { runItems } from './exercises/run';
import { isBiomeUnlocked } from './world/archipelago';
import type { ExerciseDef, ExerciseItem } from './exercises/types';
import { mulberry32, shuffle } from '../core/random';
import type { Lang } from '../core/speech';

import { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten } from './bossCore';

/** Manches par type de mission. */
export const ROUNDS_PER_TYPE = 2;

export { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId, isBossBeaten };

/** Une manche : un écran d'un type de mission, avec ses items. */
interface BossRound extends ExerciseItem {
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

/** Les types de missions du biome qui ont du contenu (sur l'île de la LV2 : celles de la langue choisie). */
export function typesWithContent(biome: BiomeDef): string[] {
  return missionsJouables(biome).filter((x) => exercisesOf(biome.id, x.id).length > 0).map((x) => x.id);
}

/** Le Gardien accepte le défi quand chaque mission du biome a au moins deux étoiles. */
export function isBossUnlocked(biome: BiomeDef, progress: Record<string, { stars: number }>): boolean {
  const types = typesWithContent(biome);
  // Sans mission à jouer (l'île de la LV2 avec « Pas de LV2 »), pas de défi.
  return types.length > 0 && types.every((type) => exercisesOf(biome.id, type).some((def) => (progress[def.id]?.stars ?? 0) >= STARS_TO_UNLOCK));
}

/**
 * Le défi se joue : débloqué (deux étoiles dans chaque mission), ou déjà gagné (on le rejoue), même si une mission
 * est arrivée depuis sur l'île sans étoile. Sans mission à jouer (l'île de la LV2 avec « Pas de LV2 »), pas de défi.
 */
export function isBossOpen(biome: BiomeDef, progress: Record<string, { stars: number }>): boolean {
  return typesWithContent(biome).length > 0 && (isBossBeaten(biome.id, progress) || isBossUnlocked(biome, progress));
}

/**
 * Où en est le Gardien d'une île : caché, en attente de son défi (une sentinelle éteinte, visible dès l'ouverture de
 * l'île, lot 6), prêt à le relever, ou rallumé.
 */
export type GuardianStatus = 'hidden' | 'waiting' | 'ready' | 'beaten';

/**
 * Sans `sentinelles`, le Gardien n'apparaît que lorsqu'il accepte le défi (son île ouverte). Avec (les deux univers
 * depuis GD-8), il est là dès l'ouverture de l'île, éteint, en attente. Un Gardien rallumé le reste : une
 * mission ajoutée plus tard à son île, encore sans étoile, ne le cache ni ne l'éteint.
 */
export function guardianStatus(biome: BiomeDef, progress: Record<string, { stars: number }>, bridges: string[], sentinelles = false): GuardianStatus {
  if (!isBiomeUnlocked(biome.id, bridges)) return 'hidden';
  if (isBossBeaten(biome.id, progress)) return 'beaten';
  if (!isBossUnlocked(biome, progress)) return sentinelles ? 'waiting' : 'hidden';
  return 'ready';
}

/** Les missions du biome où il manque encore des étoiles (pour l'expliquer à l'élève). */
export function missingForBoss(biome: BiomeDef, progress: Record<string, { stars: number }>): string[] {
  return missionsJouables(biome)
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
 * Le contenu des exercices est chargé à la demande (voir `loadExercise`). Le hasard du défi est tiré d'un coup, avant
 * le chargement (`hasard`, une graine) : deux tirages lancés ensemble (le double lancement d'un effet en développement)
 * ne se partagent pas la suite de `rng` selon l'ordre où leurs chargements arrivent, et le défi d'une île ne dépend que
 * de cette graine, ni des autres îles ni de ce qui tire au hasard pendant le chargement.
 */
export async function bossDef(biome: BiomeDef, state: GameState, rng: () => number = Math.random): Promise<ExerciseDef> {
  const hasard = mulberry32(Math.floor(rng() * 2 ** 32));
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
    const items = runItems(def, `${def.id}#gardien${Math.floor(hasard() * 2 ** 32).toString(36)}`);
    if (batch === 'all') {
      rounds.push({ key: `${type}-0`, screenType: type, exerciseId: def.id, instruction: def.instruction, target: def.target, lang: def.lang, items, wrong: def.feedback.wrong });
      return;
    }
    // Les écrans de l'exercice, dans un ordre mélangé, sans en reprendre deux fois le même.
    const ecrans: ExerciseItem[][] = [];
    for (let i = 0; i + batch <= items.length; i += batch) ecrans.push(items.slice(i, i + batch));
    shuffle(ecrans, hasard).slice(0, ROUNDS_PER_TYPE).forEach((items, i) => {
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
    reward: { block: 'trophy-gold', amount: 3, xp: 60 },
    adaptive: { promoteAt: 1.1, demoteAt: -1 },
  };
}

/** « Chasse au son » : un titre de mission cité dans une phrase. */
export function quoted(titre: string): string {
  return `«\u00a0${titre}\u00a0»`;
}
