// Moteur Blocland : étoiles, récompenses, répétition espacée, streak et adaptation.
// Logique pure (l'heure et le hasard sont passés en paramètres) pour être testée facilement.
import type { BiomeId, BlockId } from './biomes';
import { BLOCKS, getBiome } from './biomes';
import { starsFor } from '../core/stars';
import { GAME_VERSION, translateGame } from '../core/migration';
import type { ExerciseDef, ItemResult } from './exercises/types';
import { activePlan, cellKey, getPlan, planCells, plansFor as PLANS_OF, type PlanDef } from './world/plans';
import {
  archipelagoOf,
  bridgesFromLegacyProgress,
  buildBridge as buildBridgePure,
  getArchipelago,
  getBridge,
  getVoyage,
  grantAccess,
  isBiomeUnlocked,
  legacyReachable,
  reachableIslands,
  voyageId,
  type BuildBridgeResult,
} from './world/archipelago';
import { planV1 } from './world/plansV1';
import { getMonument } from './world/monuments';
import { assemblables, lireTirage, noterQuestion, recetteDe, tirageNeuf, type TirageAssemblage } from './world/assemblage';
import { VEHICLE_STAGES, beatenGuardians, getStage, kitReady, stageFor, type VehicleStage } from './world/vehicle';

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

export interface GameState {
  /** Le format de la partie (src/core/migration.ts) : 2 depuis les mots neutres. */
  version: typeof GAME_VERSION;
  progress: Record<string, ExerciseProgress>;
  spaced: SpacedItem[];
  stock: Partial<Record<BlockId, number>>;
  streak: Streak;
  types: Record<string, TypeStats>;
  /** Nombre de coffres de régularité gagnés. */
  chests: number;
  /** Temps de lecture (secondes) par texte d'Ascension, du plus ancien au plus récent. */
  fluency: Record<string, number[]>;
  /** Le monde : les parties posées, les liaisons construites, le lieu où se tient le personnage. */
  world: World;
  /**
   * Le tirage des questions des blocs assemblés (GD-2), par bloc : l'ordre propre à l'élève, les dernières posées, les
   * manquées. Absent tant qu'aucune question n'a reçu de réponse.
   */
  assemblyDraw?: Partial<Record<BlockId, TirageAssemblage>>;
}

export interface World {
  /** Cellules déjà posées de chaque plan (clés « x,y,z » relatives à l'île). */
  parts: Record<string, string[]>;
  /** Journal de construction : un bâtiment terminé par ligne, du plus ancien au plus récent. */
  log: LogEntry[];
  /** Les ponts construits (identifiants de `world/archipelago.ts`) : ils ouvrent les îles. */
  links: string[];
  /** L'île où se tient le bonhomme (la dernière île ouverte visitée) ; la Forêt au début. */
  place?: BiomeId;
}

export interface LogEntry {
  day: string;
  part: string;
}

export const EMPTY_STATE: GameState = {
  version: GAME_VERSION,
  progress: {},
  spaced: [],
  stock: {},
  streak: { current: 0, lastDay: null, cracked: false },
  types: {},
  chests: 0,
  fluency: {},
  world: { parts: {}, log: [], links: [] },
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

export function sanitizeState(input: unknown): GameState {
  // Une partie d'avant les mots neutres (2 octobre 2026) se lit traduite : la suite ne connaît que les nouveaux noms.
  const translated = translateGame(input);
  const raw = isRecord(translated) ? translated : {};
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
        .map((s) => ({
          itemId: s.itemId as string,
          due: s.due as string,
          stage: Math.max(0, Math.min(INTERVALS.length - 1, Math.round(num(s.stage)))),
          streak: Math.max(0, Math.round(num(s.streak))),
        }))
    : [];
  const stock: Partial<Record<BlockId, number>> = {};
  if (isRecord(raw.stock)) {
    for (const [id, n] of Object.entries(raw.stock)) if (id in BLOCKS) stock[id as BlockId] = Math.max(0, Math.round(num(n)));
  }
  const st = isRecord(raw.streak) ? raw.streak : {};
  const types: Record<string, TypeStats> = {};
  if (isRecord(raw.types)) {
    for (const [id, t] of Object.entries(raw.types)) {
      if (!isRecord(t)) continue;
      types[id] = { level: Math.max(1, Math.round(num(t.level, 1))), recent: Array.isArray(t.recent) ? t.recent.map((x) => num(x)).slice(-2) : [] };
    }
  }
  const fluency: Record<string, number[]> = {};
  if (isRecord(raw.fluency)) {
    for (const [id, arr] of Object.entries(raw.fluency))
      if (Array.isArray(arr))
        fluency[id] = arr
          .map((x) => num(x))
          .filter((x) => x > 0)
          .slice(-10);
  }
  // Ancien chantier (grille 8 × 8, avant le village) : les blocs reviennent dans l'inventaire.
  if (Array.isArray(raw.build)) {
    for (const c of raw.build) {
      if (isRecord(c) && typeof c.block === 'string' && c.block in BLOCKS) stock[c.block as BlockId] = (stock[c.block as BlockId] ?? 0) + 1;
    }
  }
  const world = isRecord(raw.world) ? raw.world : {};
  // Ancienne zone libre (tapis jaune) : les blocs posés reviennent aussi dans l'inventaire.
  if (isRecord(world.placed)) {
    for (const cells of Object.values(world.placed)) {
      if (!Array.isArray(cells)) continue;
      for (const c of cells) {
        if (isRecord(c) && typeof c.block === 'string' && c.block in BLOCKS) stock[c.block as BlockId] = (stock[c.block as BlockId] ?? 0) + 1;
      }
    }
  }
  // Les plans des îles et les étapes du Bloc-Navire se rangent au même endroit.
  const anyPlan = (id: string) => getPlan(id) ?? getStage(id) ?? getMonument(id);
  const parts: Record<string, string[]> = {};
  // Les sauvegardes d'avant le nouveau dessin des bâtiments (plansV1.ts) : on les reconnaît à une case posée hors du
  // nouveau dessin (aucun ancien plan n'y est tout entier). Un plan terminé avec l'ancien dessin reste terminé, et son
  // coffre, déjà ouvert, donne ce que le nouveau donne en plus ; sinon, les blocs posés hors du nouveau dessin reviennent
  // dans l'inventaire.
  if (isRecord(world.parts)) {
    for (const [id, keys] of Object.entries(world.parts)) {
      const plan = anyPlan(id);
      if (!plan || !Array.isArray(keys)) continue;
      const cells = planCells(plan);
      const valid = new Set(cells.map((c) => c.key));
      const saved = [...new Set(keys.filter((k): k is string => typeof k === 'string'))];
      const old = saved.some((k) => !valid.has(k)) ? planV1(id) : undefined;
      if (old && [...old.blocks.keys()].every((k) => saved.includes(k))) {
        parts[id] = cells.map((c) => c.key);
        for (const [b, n] of Object.entries(plan.reward.chest)) {
          const more = (n ?? 0) - (old.chest[b as BlockId] ?? 0);
          if (more > 0) stock[b as BlockId] = (stock[b as BlockId] ?? 0) + more;
        }
        continue;
      }
      if (old)
        for (const k of saved) {
          const b = old.blocks.get(k);
          if (b && !valid.has(k)) stock[b] = (stock[b] ?? 0) + 1;
        }
      const list = saved.filter((k) => valid.has(k));
      if (list.length) parts[id] = list;
    }
  }
  const log: LogEntry[] = Array.isArray(world.log)
    ? world.log
        .filter((e): e is Record<string, unknown> => isRecord(e) && typeof e.day === 'string' && typeof e.part === 'string' && Boolean(anyPlan(e.part as string)))
        .map((e) => ({ day: e.day as string, part: e.part as string }))
        .slice(-100)
    : [];
  // Ouvrages et voyages : liste d'identifiants connus ; une sauvegarde d'avant les ponts reçoit ceux des îles déjà ouvertes.
  // Une sauvegarde du continent d'avant les archipels (escaliers, tunnels entre classes) garde toutes ses îles ouvertes :
  // les voyages et le chemin qui y mènent sont offerts.
  const rawIds = Array.isArray(world.links) ? world.links.filter((id): id is string => typeof id === 'string') : null;
  let links = rawIds ? [...new Set(rawIds.filter((id) => Boolean(getBridge(id) ?? getVoyage(id))))] : bridgesFromLegacyProgress(progress);
  if (rawIds && rawIds.some((id) => !getBridge(id) && !getVoyage(id))) links = grantAccess(links, legacyReachable(rawIds));
  // Une île où l'on a déjà joué ou vaincu le Gardien reste ouverte, quoi qu'il arrive aux ouvrages.
  const played = new Set<BiomeId>();
  for (const [id, p] of Object.entries(progress)) {
    if (p.stars < 1) continue;
    const biome = getBiome(id.slice(0, id.indexOf('-')));
    if (biome) played.add(biome.id);
  }
  links = grantAccess(links, played);
  // Un voyage fait : son étape du Bloc-Navire est forcément complète (on la dessine entière).
  for (const id of links) {
    const stage = stageFor(id);
    if (stage && (parts[stage.id]?.length ?? 0) < stage.cells.length) parts[stage.id] = planCells(stage).map((c) => c.key);
  }
  // Le bonhomme : sur une île ouverte, sinon on l'oublie (il repart de la Forêt).
  const place = typeof world.place === 'string' && getBiome(world.place) && isBiomeUnlocked(world.place as BiomeId, links) ? (world.place as BiomeId) : undefined;
  // Le tirage des questions d'assemblage : seulement pour un bloc qui a sa recette, et seulement s'il y en a un.
  const assemblyDraw: Partial<Record<BlockId, TirageAssemblage>> = {};
  if (isRecord(raw.assemblyDraw)) {
    for (const [bloc, t] of Object.entries(raw.assemblyDraw)) {
      const lu = Object.hasOwn(BLOCKS, bloc) && recetteDe(bloc as BlockId) ? lireTirage(t) : undefined;
      if (lu) assemblyDraw[bloc as BlockId] = lu;
    }
  }
  return {
    version: GAME_VERSION,
    progress,
    spaced,
    stock,
    streak: { current: Math.max(0, Math.round(num(st.current))), lastDay: typeof st.lastDay === 'string' ? st.lastDay : null, cracked: Boolean(st.cracked) },
    types,
    chests: Math.max(0, Math.round(num(raw.chests))),
    fluency,
    world: place ? { parts, log, links, place } : { parts, log, links },
    ...(Object.keys(assemblyDraw).length ? { assemblyDraw } : {}),
  };
}

// ---------- Plans (construction guidée) ----------

export interface PlanStatus {
  done: number;
  total: number;
  complete: boolean;
  /** Blocs encore à poser, par type. */
  missing: Partial<Record<BlockId, number>>;
}

export function planStatus(state: GameState, plan: PlanDef): PlanStatus {
  const done = new Set(state.world.parts[plan.id] ?? []);
  const cells = planCells(plan);
  const missing: Partial<Record<BlockId, number>> = {};
  for (const c of cells) if (!done.has(c.key)) missing[c.block] = (missing[c.block] ?? 0) + 1;
  const n = cells.filter((c) => done.has(c.key)).length;
  return { done: n, total: cells.length, complete: n === cells.length, missing };
}

export type FillReason = 'pas-dans-le-plan' | 'deja-pose' | 'plus-de-blocs';
export type FillResult =
  | { state: GameState; ok: true; block: BlockId; completed: boolean }
  | { state: GameState; ok: false; reason: FillReason; block?: BlockId };

/** Pose le bloc attendu à une cellule du plan (le type est imposé par le plan). Termine le plan si c'était la dernière. */
export function fillPlanCell(state: GameState, plan: PlanDef, x: number, y: number, z: number, today = todayISO()): FillResult {
  const cell = planCells(plan).find((c) => c.x === x && c.y === y && c.z === z);
  if (!cell) return { state, ok: false, reason: 'pas-dans-le-plan' };
  const done = state.world.parts[plan.id] ?? [];
  if (done.includes(cell.key)) return { state, ok: false, reason: 'deja-pose', block: cell.block };
  if ((state.stock[cell.block] ?? 0) <= 0) return { state, ok: false, reason: 'plus-de-blocs', block: cell.block };
  const inventory = { ...state.stock, [cell.block]: (state.stock[cell.block] ?? 0) - 1 };
  const nextDone = [...done, cell.key];
  const completed = nextDone.length === plan.cells.length;
  if (completed) for (const [b, n] of Object.entries(plan.reward.chest)) inventory[b as BlockId] = (inventory[b as BlockId] ?? 0) + (n ?? 0);
  return {
    ok: true,
    block: cell.block,
    completed,
    state: {
      ...state,
      stock: inventory,
      world: {
        ...state.world,
        parts: { ...state.world.parts, [plan.id]: nextDone },
        log: completed ? [...state.world.log, { day: today, part: plan.id }] : state.world.log,
      },
    },
  };
}

export type AssembleResult = { state: GameState; ok: true } | { state: GameState; ok: false; reason: 'pas-de-recette' | 'plus-de-blocs' };

/**
 * Assemble un bloc (GD-2) : retire les ingrédients de la recette et ajoute le bloc assemblé. Un seul à la fois, et
 * rien ne se perd : sans assez de blocs, l'inventaire ne bouge pas.
 */
export function assembleBlock(state: GameState, bloc: BlockId): AssembleResult {
  const recette = recetteDe(bloc);
  if (!recette) return { state, ok: false, reason: 'pas-de-recette' };
  if (assemblables(state.stock, recette) < 1) return { state, ok: false, reason: 'plus-de-blocs' };
  const inventory = { ...state.stock };
  for (const i of recette.ingredients) inventory[i.bloc] = (inventory[i.bloc] ?? 0) - i.n;
  inventory[bloc] = (inventory[bloc] ?? 0) + 1;
  return { state: { ...state, stock: inventory }, ok: true };
}

/** Le tirage des questions d'un bloc assemblé pour cet élève, ou un tirage neuf avec `graine`. */
export function tirageDe(state: GameState, bloc: BlockId, graine: string): TirageAssemblage {
  return state.assemblyDraw?.[bloc] ?? tirageNeuf(graine);
}

/** La réponse finale d'un élève à la question d'un bloc assemblé, et le tirage qui l'a posée. */
export interface ReponseDonnee {
  /** Les questions du bloc, dans l'ordre du fichier. */
  cles: readonly string[];
  cle: string;
  juste: boolean;
  tirage: TirageAssemblage;
}

export type ReponseAssemblage =
  | { state: GameState; assemble: true }
  | { state: GameState; assemble: false; reason: 'manquee' | 'pas-de-recette' | 'plus-de-blocs' };

/**
 * La réponse finale à la question d'un bloc assemblé (GD-2) : juste (du premier coup ou au second essai), le bloc est
 * assemblé (`assembleBlock`) ; manquée, rien n'est pris. Dans les deux cas, la question est notée dans le tirage de
 * l'élève (`tirage` : celui qui l'a tirée). Ni blocs gagnés, ni XP, ni niveau : la question ne rapporte que le bloc.
 */
export function repondreAssemblage(state: GameState, bloc: BlockId, reponse: ReponseDonnee): ReponseAssemblage {
  if (!recetteDe(bloc)) return { state, assemble: false, reason: 'pas-de-recette' };
  const tirage = noterQuestion(reponse.cles, state.assemblyDraw?.[bloc] ?? reponse.tirage, reponse.cle, reponse.juste);
  const note: GameState = { ...state, assemblyDraw: { ...state.assemblyDraw, [bloc]: tirage } };
  if (!reponse.juste) return { state: note, assemble: false, reason: 'manquee' };
  const r = assembleBlock(note, bloc);
  return r.ok ? { state: r.state, assemble: true } : { state: note, assemble: false, reason: r.reason };
}

/**
 * Défait un bloc assemblé en poche (GD-2, choix du mainteneur après la relecture UX UI) : rend tous ses ingrédients.
 * Un bloc déjà posé dans un monument reste posé ; sans bloc en poche, l'inventaire ne bouge pas.
 */
export function disassembleBlock(state: GameState, bloc: BlockId): AssembleResult {
  const recette = recetteDe(bloc);
  if (!recette) return { state, ok: false, reason: 'pas-de-recette' };
  if ((state.stock[bloc] ?? 0) < 1) return { state, ok: false, reason: 'plus-de-blocs' };
  const inventory = { ...state.stock };
  for (const i of recette.ingredients) inventory[i.bloc] = (inventory[i.bloc] ?? 0) + i.n;
  inventory[bloc] = (inventory[bloc] ?? 0) - 1;
  return { state: { ...state, stock: inventory }, ok: true };
}

/** La prochaine cellule du plan que l'on peut poser avec l'inventaire actuel (vue simple, bouton « Poser le bloc suivant »). */
export function nextFillable(state: GameState, plan: PlanDef): { x: number; y: number; z: number } | null {
  const done = new Set(state.world.parts[plan.id] ?? []);
  const cell = planCells(plan).find((c) => !done.has(c.key) && (state.stock[c.block] ?? 0) > 0);
  return cell ? { x: cell.x, y: cell.y, z: cell.z } : null;
}

/** Le plan en cours d'une île (voir plans.ts), ou le dernier si tout est terminé. */
export function currentPlan(state: GameState, island: BiomeId): { plan: PlanDef; allDone: boolean } | null {
  const active = activePlan(island, state.world.parts);
  if (active) return { plan: active, allDone: false };
  const all = PLANS_OF(island);
  return all.length ? { plan: all[all.length - 1], allDone: true } : null;
}

/** La cellule d'un plan à ces coordonnées, si elle existe (posée ou non). */
export function planCellAt(plan: PlanDef, x: number, y: number, z: number): { key: string; block: BlockId } | null {
  const c = planCells(plan).find((c) => c.x === x && c.y === y && c.z === z);
  return c ? { key: cellKey(c.x, c.y, c.z), block: c.block } : null;
}

/** Démonte tout ce qui est posé sur une île : les blocs reviennent dans l'inventaire. */
export function recordFluence(state: GameState, textId: string, seconds: number): { state: GameState; previous: number | null } {
  const history = state.fluency[textId] ?? [];
  const previous = history.length ? history[history.length - 1] : null;
  return { state: { ...state, fluency: { ...state.fluency, [textId]: [...history, Math.round(seconds)].slice(-10) } }, previous };
}

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

// ---------- Fin d'exercice ----------

export interface Completion {
  state: GameState;
  score: number;
  stars: 1 | 2 | 3;
  /** Meilleur résultat jamais obtenu sur cet exercice ? */
  newBest: boolean;
  blocks: number;
  block: BlockId;
  /** Ce qui, dans `blocks`, vient des étoiles et de la première fois. */
  bonus: { stars: number; first: number };
  xp: number;
  /** Terminé sans aide ni erreur. */
  perfect: boolean;
  streak: StreakUpdate;
  chestBlock?: BlockId;
}

/** Blocs en plus : +1 à deux étoiles, +2 à trois ; +2 la première fois qu'une mission est jouée. Rien sans bonne réponse. */
export const FIRST_TIME_BLOCKS = 2;
export function blocksBonus(stars: number, firstTime: boolean, anyCorrect = true): { stars: number; first: number } {
  if (!anyCorrect) return { stars: 0, first: 0 };
  return { stars: stars >= 3 ? 2 : stars >= 2 ? 1 : 0, first: firstTime ? FIRST_TIME_BLOCKS : 0 };
}

/** Enregistre un exercice terminé : progression, blocs, XP, répétition espacée, streak, adaptation. */
export function completeExercise(state: GameState, def: ExerciseDef, results: ItemResult[], today: string, rng: () => number = Math.random): Completion {
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
  const bonus = blocksBonus(stars, prev.attempts === 0, anyCorrect);
  const blocks = anyCorrect ? Math.max(1, Math.round(def.reward.amount * score)) + bonus.stars + bonus.first : 0;
  // XP à chaque exercice terminé ; bonus si terminé sans aide.
  const xp = Math.round(def.reward.xp * (perfect ? 1.5 : 1));

  let spaced = state.spaced;
  for (const r of results) spaced = recordSpaced(spaced, `${def.id}:${r.key}`, r.correct && r.attempts <= 1, today);

  const { streak, inventory, chests, chestBlock } = playedToday(state, def.reward.block, blocks, today, rng);

  const types = { ...state.types, [def.type]: adapt(state.types[def.type], score, def.adaptive) };

  return {
    state: { ...state, progress, spaced, stock: inventory, streak: streak.streak, types, chests },
    score,
    stars,
    newBest,
    blocks,
    block: def.reward.block,
    bonus,
    xp,
    perfect,
    streak,
    chestBlock,
  };
}

/**
 * Une mission jouée aujourd'hui : ses blocs dans l'inventaire, le streak du jour et, tous les CHEST_EVERY jours
 * d'affilée, un coffre de blocs communs. Partagé par les missions d'île et celles de l'école du village.
 */
function playedToday(
  state: GameState,
  block: BlockId,
  blocks: number,
  today: string,
  rng: () => number,
): { streak: StreakUpdate; inventory: GameState['stock']; chests: number; chestBlock?: BlockId } {
  const streak = updateStreak(state.streak, today);
  const inventory = { ...state.stock, [block]: (state.stock[block] ?? 0) + blocks };
  let chestBlock: BlockId | undefined;
  let chests = state.chests;
  if (streak.chest) {
    // Ni les blocs rares, ni les blocs assemblés (GD-2), qu'on ne gagne jamais tout faits.
    const common = (Object.keys(BLOCKS) as BlockId[]).filter((b) => !BLOCKS[b].rare && !BLOCKS[b].assemble);
    chestBlock = common[Math.floor(rng() * common.length)];
    inventory[chestBlock] = (inventory[chestBlock] ?? 0) + CHEST_BLOCKS;
    chests += 1;
  }
  return { streak, inventory, chests, chestBlock };
}

// ---------- L'école du village (les missions du portail) ----------

/** Blocs d'une mission du portail réussie en entier, avant les bonus (comme `reward.amount` d'une mission d'île). */
export const PORTAL_BLOCKS = 4;

export interface PortalCompletion {
  state: GameState;
  /** L'île de l'école de l'archipel où se tient le bonhomme : ses blocs sont gagnés. */
  school: BiomeId;
  block: BlockId;
  blocks: number;
  bonus: { stars: number; first: number };
  streak: StreakUpdate;
  chestBlock?: BlockId;
}

/**
 * Une mission du portail terminée (score entre 0 et 1) : des blocs de l'île de l'école, au même barème qu'une mission
 * d'île (proportionnels au score, +1 ou +2 selon les étoiles, +2 la première fois, rien sans bonne réponse), et le
 * streak du jour. Les étoiles et le Gardien ne changent pas : ils restent ceux des missions d'île.
 */
export function completePortalQuest(state: GameState, score: number, firstTime: boolean, today: string, rng: () => number = Math.random): PortalCompletion {
  const school = archipelagoOf(state.world.place ?? 'french-6e-phonology').school;
  const block = getBiome(school)!.block;
  const anyCorrect = score > 0;
  const bonus = blocksBonus(starsFor(score), firstTime, anyCorrect);
  const blocks = anyCorrect ? Math.max(1, Math.round(PORTAL_BLOCKS * score)) + bonus.stars + bonus.first : 0;
  const { streak, inventory, chests, chestBlock } = playedToday(state, block, blocks, today, rng);
  return { state: { ...state, stock: inventory, streak: streak.streak, chests }, school, block, blocks, bonus, streak, chestBlock };
}

/** Construit un pont en payant avec les blocs de l'inventaire. */
export function buildBridge(state: GameState, id: string): { state: GameState; result: BuildBridgeResult } {
  const result = buildBridgePure(id, state.world.links, state.stock, { progress: state.progress, plans: state.world.parts });
  if (!result.ok) return { state, result };
  return { state: { ...state, stock: result.inventory, world: { ...state.world, links: result.bridges } }, result };
}

/** Le bonhomme va sur une île ouverte (sinon, rien ne change). */
export function moveAvatar(state: GameState, to: BiomeId): GameState {
  if (!isBiomeUnlocked(to, state.world.links) || state.world.place === to) return state;
  return { ...state, world: { ...state.world, place: to } };
}

// ---------- Le Bloc-Navire ----------

/** L'étape du Bloc-Navire en cours : la première dont le voyage n'est pas fait ; `null` quand les trois voyages sont faits. */
export function currentStage(state: GameState): VehicleStage | null {
  return VEHICLE_STAGES.find((s) => !state.world.links.includes(voyageId(s.to))) ?? null;
}

export type LaunchResult =
  | { ok: true; to: BiomeId }
  | { ok: false; reason: 'loin' | 'construit' | 'blocs' | 'gardiens'; missing: number };

/** Peut-on embarquer ? Le port de départ ouvert, le voyage pas encore fait, toutes les cases posées, assez de Gardiens vaincus. */
export function canLaunch(state: GameState, stage: VehicleStage): LaunchResult {
  const bridges = state.world.links;
  if (!reachableIslands(bridges).has(stage.biome)) return { ok: false, reason: 'loin', missing: 0 };
  if (bridges.includes(voyageId(stage.to))) return { ok: false, reason: 'construit', missing: 0 };
  const status = planStatus(state, stage);
  if (!status.complete) return { ok: false, reason: 'blocs', missing: status.total - status.done };
  if (!kitReady(stage, state.progress)) return { ok: false, reason: 'gardiens', missing: stage.guardians - beatenGuardians(stage.from, state.progress) };
  return { ok: true, to: getArchipelago(stage.to).port };
}

/**
 * Largue les amarres : le voyage est fait (et le reste : on revient quand on veut), le bonhomme arrive au port d'en face.
 * Un acte explicite, jamais un effet du dernier bloc posé.
 */
export function launchVehicle(state: GameState, stage: VehicleStage): { state: GameState; result: LaunchResult } {
  const result = canLaunch(state, stage);
  if (!result.ok) return { state, result };
  return { state: { ...state, world: { ...state.world, links: [...state.world.links, voyageId(stage.to)], place: result.to } }, result };
}
