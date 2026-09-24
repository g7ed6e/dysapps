// Moteur Blocland : étoiles, récompenses, répétition espacée, streak et adaptation.
// Logique pure (l'heure et le hasard sont passés en paramètres) pour être testée facilement.
import type { BlockId } from './biomes';
import { BLOCKS } from './biomes';
import type { ExerciseDef, ItemResult } from './exercises/types';

export interface ExerciseProgress {
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  /** Meilleur score, entre 0 et 1. */
  best: number;
}

export interface SpacedItem {
  itemId: string;
  /** Date ISO (AAAA-MM-JJ) à partir de laquelle l'item est à revoir. */
  due: string;
  /** Étape dans les intervalles J+1, J+3, J+7, J+15. */
  stage: number;
  /** Réussites d'affilée depuis le dernier échec. */
  streak: number;
}

export interface Streak {
  current: number;
  lastDay: string | null;
  /** Un jour manqué fissure le streak ; on le répare en jouant le lendemain. */
  cracked: boolean;
}

export interface TypeStats {
  level: number;
  /** Scores des dernières sessions à ce niveau. */
  recent: number[];
}

export interface BloclandState {
  progress: Record<string, ExerciseProgress>;
  spaced: SpacedItem[];
  inventory: Partial<Record<BlockId, number>>;
  streak: Streak;
  types: Record<string, TypeStats>;
  /** Nombre de coffres de régularité gagnés. */
  chests: number;
  /** Temps de lecture (secondes) par texte d'Ascension, du plus ancien au plus récent. */
  fluence: Record<string, number[]>;
  /** La construction : un bloc par case et par hauteur. */
  build: BuildCell[];
}

export interface BuildCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
}

/** Grille de construction : GRID_SIZE × GRID_SIZE cases, MAX_HEIGHT blocs de haut. */
export const GRID_SIZE = 8;
export const MAX_HEIGHT = 6;

export const EMPTY_STATE: BloclandState = {
  progress: {},
  spaced: [],
  inventory: {},
  streak: { current: 0, lastDay: null, cracked: false },
  types: {},
  chests: 0,
  fluence: {},
  build: [],
};

/** Intervalles de la répétition espacée, en jours. */
export const INTERVALS = [1, 3, 7, 15];
/** Réussites d'affilée pour sortir de la file. */
export const GRADUATE_AT = 3;
/** Jours d'affilée pour gagner un coffre. */
export const CHEST_EVERY = 3;
export const CHEST_BLOCKS = 6;

// ---------- Dates ----------

export function todayISO(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// ---------- Validation ----------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const num = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

export function sanitizeState(input: unknown): BloclandState {
  const raw = isRecord(input) ? input : {};
  const progress: Record<string, ExerciseProgress> = {};
  if (isRecord(raw.progress)) {
    for (const [id, p] of Object.entries(raw.progress)) {
      if (!isRecord(p)) continue;
      progress[id] = {
        stars: Math.max(0, Math.min(3, Math.round(num(p.stars)))) as 0 | 1 | 2 | 3,
        attempts: Math.max(0, Math.round(num(p.attempts))),
        best: Math.max(0, Math.min(1, num(p.best))),
      };
    }
  }
  const spaced: SpacedItem[] = Array.isArray(raw.spaced)
    ? raw.spaced
        .filter((s): s is Record<string, unknown> => isRecord(s) && typeof s.itemId === 'string' && typeof s.due === 'string')
        .map((s) => ({ itemId: s.itemId as string, due: s.due as string, stage: Math.max(0, Math.min(INTERVALS.length - 1, Math.round(num(s.stage)))), streak: Math.max(0, Math.round(num(s.streak))) }))
    : [];
  const inventory: Partial<Record<BlockId, number>> = {};
  if (isRecord(raw.inventory)) {
    for (const [id, n] of Object.entries(raw.inventory)) if (id in BLOCKS) inventory[id as BlockId] = Math.max(0, Math.round(num(n)));
  }
  const st = isRecord(raw.streak) ? raw.streak : {};
  const types: Record<string, TypeStats> = {};
  if (isRecord(raw.types)) {
    for (const [id, t] of Object.entries(raw.types)) {
      if (!isRecord(t)) continue;
      types[id] = { level: Math.max(1, Math.round(num(t.level, 1))), recent: Array.isArray(t.recent) ? t.recent.map((x) => num(x)).slice(-2) : [] };
    }
  }
  const fluence: Record<string, number[]> = {};
  if (isRecord(raw.fluence)) {
    for (const [id, arr] of Object.entries(raw.fluence)) if (Array.isArray(arr)) fluence[id] = arr.map((x) => num(x)).filter((x) => x > 0).slice(-10);
  }
  const build: BuildCell[] = [];
  if (Array.isArray(raw.build)) {
    for (const c of raw.build) {
      if (!isRecord(c) || !(typeof c.block === 'string' && c.block in BLOCKS)) continue;
      const x = Math.round(num(c.x, -1));
      const y = Math.round(num(c.y, -1));
      const z = Math.round(num(c.z, -1));
      if (x < 0 || y < 0 || z < 0 || x >= GRID_SIZE || y >= GRID_SIZE || z >= MAX_HEIGHT) continue;
      if (build.some((b) => b.x === x && b.y === y && b.z === z)) continue;
      build.push({ x, y, z, block: c.block as BlockId });
    }
  }
  return {
    progress,
    spaced,
    inventory,
    streak: { current: Math.max(0, Math.round(num(st.current))), lastDay: typeof st.lastDay === 'string' ? st.lastDay : null, cracked: Boolean(st.cracked) },
    types,
    chests: Math.max(0, Math.round(num(raw.chests))),
    fluence,
    build,
  };
}

// ---------- Construction ----------

export function columnHeight(build: BuildCell[], x: number, y: number): number {
  return build.filter((c) => c.x === x && c.y === y).length;
}

export type PlaceResult = { state: BloclandState; ok: true } | { state: BloclandState; ok: false; reason: 'hors-grille' | 'plus-de-blocs' | 'trop-haut' };

/** Pose un bloc du type choisi au sommet de la colonne (x, y) ; consomme un bloc de l'inventaire. */
export function placeBlock(state: BloclandState, x: number, y: number, block: BlockId): PlaceResult {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return { state, ok: false, reason: 'hors-grille' };
  if ((state.inventory[block] ?? 0) <= 0) return { state, ok: false, reason: 'plus-de-blocs' };
  const z = columnHeight(state.build, x, y);
  if (z >= MAX_HEIGHT) return { state, ok: false, reason: 'trop-haut' };
  return {
    ok: true,
    state: {
      ...state,
      build: [...state.build, { x, y, z, block }],
      inventory: { ...state.inventory, [block]: (state.inventory[block] ?? 0) - 1 },
    },
  };
}

/** Retire le bloc du sommet de la colonne (x, y) ; il revient dans l'inventaire. */
export function removeBlock(state: BloclandState, x: number, y: number): { state: BloclandState; removed: BlockId | null } {
  const column = state.build.filter((c) => c.x === x && c.y === y);
  if (column.length === 0) return { state, removed: null };
  const top = column.reduce((a, b) => (b.z > a.z ? b : a));
  return {
    removed: top.block,
    state: {
      ...state,
      build: state.build.filter((c) => c !== top),
      inventory: { ...state.inventory, [top.block]: (state.inventory[top.block] ?? 0) + 1 },
    },
  };
}

/** Démonte toute la construction : tous les blocs reviennent dans l'inventaire. */
export function clearBuild(state: BloclandState): BloclandState {
  const inventory = { ...state.inventory };
  for (const c of state.build) inventory[c.block] = (inventory[c.block] ?? 0) + 1;
  return { ...state, build: [], inventory };
}

/** Enregistre un temps de lecture ; renvoie le temps précédent pour se comparer à soi-même. */
export function recordFluence(state: BloclandState, textId: string, seconds: number): { state: BloclandState; previous: number | null } {
  const history = state.fluence[textId] ?? [];
  const previous = history.length ? history[history.length - 1] : null;
  return { state: { ...state, fluence: { ...state.fluence, [textId]: [...history, Math.round(seconds)].slice(-10) } }, previous };
}

// ---------- Score et étoiles ----------

/** Score entre 0 et 1 : 1 point du premier coup, ½ point après une erreur ou avec de l'aide. */
export function scoreOf(results: ItemResult[]): number {
  if (results.length === 0) return 0;
  const points = results.reduce((sum, r) => sum + (r.correct ? (r.attempts <= 1 && !r.usedHelp ? 1 : 0.5) : 0), 0);
  return points / results.length;
}

/** 1 étoile = terminé, 2 = ≥ 70 %, 3 = ≥ 90 %. */
export function starsFor(score: number): 1 | 2 | 3 {
  return score >= 0.9 ? 3 : score >= 0.7 ? 2 : 1;
}

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

/** Monte après 2 sessions ≥ promoteAt, descend après 2 sessions ≤ demoteAt. Jamais affiché comme « niveau baissé ». */
export function adapt(stats: TypeStats | undefined, score: number, def: ExerciseDef['adaptive']): TypeStats {
  const level = stats?.level ?? 1;
  const recent = [...(stats?.recent ?? []), score].slice(-2);
  if (recent.length === 2 && recent.every((s) => s >= def.promoteAt)) return { level: level + 1, recent: [] };
  if (recent.length === 2 && recent.every((s) => s <= def.demoteAt)) return { level: Math.max(1, level - 1), recent: [] };
  return { level, recent };
}

export function levelFor(state: BloclandState, type: string): number {
  return state.types[type]?.level ?? 1;
}

// ---------- Fin d'exercice ----------

export interface Completion {
  state: BloclandState;
  score: number;
  stars: 1 | 2 | 3;
  /** Meilleur résultat jamais obtenu sur cet exercice ? */
  newBest: boolean;
  blocks: number;
  block: BlockId;
  xp: number;
  /** Terminé sans aide ni erreur. */
  perfect: boolean;
  streak: StreakUpdate;
  chestBlock?: BlockId;
}

/** Enregistre un exercice terminé : progression, blocs, XP, répétition espacée, streak, adaptation. */
export function completeExercise(state: BloclandState, def: ExerciseDef, results: ItemResult[], today: string, rng: () => number = Math.random): Completion {
  const score = scoreOf(results);
  const stars = starsFor(score);
  const perfect = results.every((r) => r.correct && r.attempts <= 1 && !r.usedHelp);
  const prev = state.progress[def.id] ?? { stars: 0, attempts: 0, best: 0 };
  const newBest = score > prev.best;
  const progress = {
    ...state.progress,
    [def.id]: { stars: Math.max(prev.stars, stars) as 1 | 2 | 3, attempts: prev.attempts + 1, best: Math.max(prev.best, score) },
  };

  // Des blocs même avec des erreurs, jamais zéro si au moins une bonne réponse.
  const anyCorrect = results.some((r) => r.correct);
  const blocks = anyCorrect ? Math.max(1, Math.round(def.reward.amount * score)) : 0;
  // XP à chaque exercice terminé ; bonus si terminé sans aide.
  const xp = Math.round(def.reward.xp * (perfect ? 1.5 : 1));

  let spaced = state.spaced;
  for (const r of results) spaced = recordSpaced(spaced, `${def.id}:${r.key}`, r.correct && r.attempts <= 1, today);

  const streak = updateStreak(state.streak, today);
  const inventory = { ...state.inventory, [def.reward.block]: (state.inventory[def.reward.block] ?? 0) + blocks };
  let chestBlock: BlockId | undefined;
  let chests = state.chests;
  if (streak.chest) {
    const common = (Object.keys(BLOCKS) as BlockId[]).filter((b) => !BLOCKS[b].rare);
    chestBlock = common[Math.floor(rng() * common.length)];
    inventory[chestBlock] = (inventory[chestBlock] ?? 0) + CHEST_BLOCKS;
    chests += 1;
  }

  const types = { ...state.types, [def.type]: adapt(state.types[def.type], score, def.adaptive) };

  return {
    state: { ...state, progress, spaced, inventory, streak: streak.streak, types, chests },
    score,
    stars,
    newBest,
    blocks,
    block: def.reward.block,
    xp,
    perfect,
    streak,
    chestBlock,
  };
}
