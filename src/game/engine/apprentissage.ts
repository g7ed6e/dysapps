// L'apprentissage : le score et les étoiles d'une session, la série de jours (et ses coffres), la répétition espacée
// et l'adaptation du niveau. Calculs purs, l'heure passée en paramètre.
import type { ExerciseDef, ItemResult } from '../exercises/types';
import { starsFor } from '../../core/stars';
import type { GameState, SpacedItem, Streak, TypeStats } from './etat';
import { addDays, daysBetween } from './dates';

/** Intervalles de la répétition espacée, en jours. */
export const INTERVALS = [1, 3, 7, 15];

/** Réussites d'affilée pour sortir de la file. */
export const GRADUATE_AT = 3;

/** Jours d'affilée pour gagner un coffre. */
export const CHEST_EVERY = 3;

export const CHEST_BLOCKS = 6;

// ---------- Score et étoiles ----------

/** Score entre 0 et 1 : 1 point du premier coup, ½ point après une erreur ou avec de l'aide. */
export function scoreOf(results: ItemResult[]): number {
  if (results.length === 0) return 0;
  const points = results.reduce((sum, r) => sum + (r.correct ? (r.attempts <= 1 && !r.usedHelp ? 1 : 0.5) : 0), 0);
  return points / results.length;
}

/** 1 étoile = terminé, 2 = ≥ 70 %, 3 = ≥ 90 % (règle commune au portail, dans `core/stars.ts`). */
export { starsFor };

// ---------- Streak quotidien ----------

export interface StreakUpdate {
  streak: Streak;
  /** Le streak vient d'être réparé ou prolongé aujourd'hui. */
  extended: boolean;
  chest: boolean;
}

export function updateStreak(streak: Streak, today: string): StreakUpdate {
  if (streak.lastDay === today) return { streak, extended: false, chest: false };
  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : Infinity;
  let current: number;
  let cracked = false;
  if (gap === 1) current = streak.current + 1;
  else if (gap === 2 && !streak.cracked) {
    // Un jour manqué : fissure, mais on continue.
    current = streak.current + 1;
    cracked = true;
  } else current = 1;
  const next = { current, lastDay: today, cracked };
  return { streak: next, extended: true, chest: current > 0 && current % CHEST_EVERY === 0 };
}

// ---------- Répétition espacée ----------

export function recordSpaced(queue: SpacedItem[], itemId: string, correct: boolean, today: string): SpacedItem[] {
  const rest = queue.filter((s) => s.itemId !== itemId);
  const existing = queue.find((s) => s.itemId === itemId);
  if (!correct) return [...rest, { itemId, due: addDays(today, INTERVALS[0]), stage: 0, streak: 0 }];
  if (!existing) return queue; // réussi et pas en file : rien à faire
  const streak = existing.streak + 1;
  if (streak >= GRADUATE_AT) return rest; // sort de la file
  const stage = Math.min(existing.stage + 1, INTERVALS.length - 1);
  return [...rest, { itemId, due: addDays(today, INTERVALS[stage]), stage, streak }];
}

export function dueItems(queue: SpacedItem[], today: string): SpacedItem[] {
  return queue.filter((s) => s.due <= today).sort((a, b) => a.due.localeCompare(b.due));
}

// ---------- Adaptation ----------

/** Note à partir de laquelle une seule session suffit pour monter d'un niveau. */
export const PROMOTE_AT_ONCE = 0.95;

/**
 * Monte après 1 session quasi parfaite (≥ 95 %) ou 2 sessions ≥ promoteAt ; descend après 2 sessions ≤ demoteAt.
 * Jamais affiché comme « niveau baissé ».
 */
export function adapt(stats: TypeStats | undefined, score: number, def: ExerciseDef['adaptive']): TypeStats {
  const level = stats?.level ?? 1;
  const recent = [...(stats?.recent ?? []), score].slice(-2);
  if (score >= PROMOTE_AT_ONCE && def.promoteAt <= 1) return { level: level + 1, recent: [] };
  if (recent.length === 2 && recent.every((s) => s >= def.promoteAt)) return { level: level + 1, recent: [] };
  if (recent.length === 2 && recent.every((s) => s <= def.demoteAt)) return { level: Math.max(1, level - 1), recent: [] };
  return { level, recent };
}

export function levelFor(state: GameState, type: string): number {
  return state.types[type]?.level ?? 1;
}
