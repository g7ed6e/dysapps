// Moteur Blocland : étoiles, récompenses, répétition espacée, streak et adaptation.
// Logique pure (l'heure et le hasard sont passés en paramètres) pour être testée facilement.
// Ce fichier garde les plans, l'assemblage, la fin d'exercice, l'école du village et le Bloc-Navire ; à côté, dans
// ./engine/ : l'état d'une partie (`state.ts`), les dates (`dates.ts`), la lecture d'une sauvegarde (`lecture.ts`),
// l'apprentissage (`learning.ts`). Il en réexporte les noms publics.
import { type BiomeId, BIOMES, type BlockId, BLOCKS, getBiome } from './biomes';
import { cellKey, planCells, type PlanDef } from './world/plans';
import { assemblables, noterQuestion, recetteDe, type TirageAssemblage, tirageNeuf } from './world/assembly';
import { missionsTerminees, type Partie, poserLesParties } from './world/parts';
import type { ExerciseDef, ItemResult } from './exercises/types';
import { starsFor } from '../core/stars';
import { archipelagoOf, buildBridge as buildBridgePure, type BuildBridgeResult, getArchipelago, isBiomeUnlocked, reachableIslands, voyageId } from './world/archipelago';
import { beatenGuardians, kitReady, VEHICLE_STAGES, type VehicleStage } from './world/vehicle';
import type { GameState, SpacedItem } from './engine/state';
import { todayISO } from './engine/dates';
import { adapt, CHEST_BLOCKS, dueItems, recordSpaced, scoreOf, type StreakUpdate, updateStreak } from './engine/learning';
export { EMPTY_STATE, type ExerciseProgress, type GameState, type LogEntry, type SpacedItem, type Streak, type TypeStats, type World } from './engine/state';
export { addDays, daysBetween, todayISO } from './engine/dates';
export { sanitizeState } from './engine/reading';
export { adapt, CHEST_BLOCKS, CHEST_EVERY, dueItems, GRADUATE_AT, INTERVALS, levelFor, PROMOTE_AT_ONCE, recordSpaced, scoreOf, starsFor, type StreakUpdate, updateStreak } from './engine/learning';

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

/** La prochaine cellule d'un plan que l'on peut poser avec l'inventaire actuel (le Bloc-Navire, bouton « Poser le bloc suivant »). */
export function nextFillable(state: GameState, plan: PlanDef): { x: number; y: number; z: number } | null {
  const done = new Set(state.world.parts[plan.id] ?? []);
  const cell = planCells(plan).find((c) => !done.has(c.key) && (state.stock[c.block] ?? 0) > 0);
  return cell ? { x: cell.x, y: cell.y, z: cell.z } : null;
}

/** La cellule d'un plan à ces coordonnées, si elle existe (posée ou non). */
export function planCellAt(plan: PlanDef, x: number, y: number, z: number): { key: string; block: BlockId } | null {
  const c = planCells(plan).find((c) => c.x === x && c.y === y && c.z === z);
  return c ? { key: cellKey(c.x, c.y, c.z), block: c.block } : null;
}

/** Note le temps de lecture d'un texte (les dix derniers) et rend le précédent. */
export function recordFluence(state: GameState, textId: string, seconds: number): { state: GameState; previous: number | null } {
  const history = state.fluency[textId] ?? [];
  const previous = history.length ? history[history.length - 1] : null;
  return { state: { ...state, fluency: { ...state.fluency, [textId]: [...history, Math.round(seconds)].slice(-10) } }, previous };
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
  /** Une révision (GD-6, point 4) : ses blocs ne dépendent pas du score. */
  revision: boolean;
  streak: StreakUpdate;
  chestBlock?: BlockId;
  /** La partie du bâtiment du lieu posée par cette mission, la première fois qu'elle est terminée (GD-6). */
  pose?: PoseDUneMission;
}

/** Ce qu'une mission terminée a posé sur le bâtiment de son lieu : les parties et les plans qu'elles finissent. */
export interface PoseDUneMission {
  posees: Partie[];
  plansFinis: PlanDef[];
}

/**
 * Pose sur le bâtiment d'un lieu les parties dues à ses missions terminées (GD-6), sans rien prendre au stock : une
 * ligne du journal par plan fini. Sans effet si le compte y est.
 */
export function poserLesPartiesDues(state: GameState, biome: BiomeId, today = todayISO()): { state: GameState; pose: PoseDUneMission | null } {
  const r = poserLesParties(biome, state.world.parts, missionsTerminees(state.progress, biome));
  if (!r.posees.length) return { state, pose: null };
  const log = [...state.world.log, ...r.plansFinis.map((p) => ({ day: today, part: p.id }))].slice(-100);
  return { state: { ...state, world: { ...state.world, parts: r.parts, log } }, pose: { posees: r.posees, plansFinis: r.plansFinis } };
}

/**
 * Le rattrapage d'une sauvegarde d'avant GD-6 : chaque lieu reçoit les parties de ses missions déjà terminées, posées
 * d'un coup. Les plans qu'elles finissent sont rendus pour leur XP.
 */
export function rattraperLesParties(state: GameState, today = todayISO()): { state: GameState; plansFinis: PlanDef[] } {
  let next = state;
  const plansFinis: PlanDef[] = [];
  for (const b of BIOMES) {
    const r = poserLesPartiesDues(next, b.id, today);
    next = r.state;
    if (r.pose) plansFinis.push(...r.pose.plansFinis);
  }
  return { state: next, plansFinis };
}

/** Blocs en plus : +1 à deux étoiles, +2 à trois ; +2 la première fois qu'une mission est jouée. Rien sans bonne réponse. */
export const FIRST_TIME_BLOCKS = 2;

export function blocksBonus(stars: number, firstTime: boolean, anyCorrect = true): { stars: number; first: number } {
  if (!anyCorrect) return { stars: 0, first: 0 };
  return { stars: stars >= 3 ? 2 : stars >= 2 ? 1 : 0, first: firstTime ? FIRST_TIME_BLOCKS : 0 };
}

/**
 * Une partie est une révision quand l'exercice avait, au moment de la finir, des questions à revoir aujourd'hui
 * (répétition espacée) : la partie les a mises en tête (`exercises/run.ts`).
 */
export function estUneRevision(spaced: SpacedItem[], exerciseId: string, today: string): boolean {
  return dueItems(spaced, today).some((s) => s.itemId.startsWith(`${exerciseId}:`));
}

/**
 * Les blocs d'une révision finie (GD-6, point 4) : autant qu'une mission sans faute (la base de la mission et le bonus
 * de trois étoiles), quel que soit le score ; le joker et les erreurs n'en retirent rien.
 */
export function blocsDUneRevision(def: Pick<ExerciseDef, 'reward'>): number {
  return def.reward.amount + blocksBonus(3, false).stars;
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

  // Une révision (des questions de la mission étaient à revoir aujourd'hui) rapporte toujours autant, quel que soit le
  // score (GD-6, point 4) ; sinon, des blocs même avec des erreurs, jamais zéro si au moins une bonne réponse.
  const revision = estUneRevision(state.spaced, def.id, today);
  const anyCorrect = results.some((r) => r.correct);
  const bonus = revision ? { stars: 0, first: 0 } : blocksBonus(stars, prev.attempts === 0, anyCorrect);
  const blocks = revision ? blocsDUneRevision(def) : anyCorrect ? Math.max(1, Math.round(def.reward.amount * score)) + bonus.stars + bonus.first : 0;
  // XP à chaque exercice terminé ; bonus si terminé sans aide.
  const xp = Math.round(def.reward.xp * (perfect ? 1.5 : 1));

  let spaced = state.spaced;
  for (const r of results) spaced = recordSpaced(spaced, `${def.id}:${r.key}`, r.correct && r.attempts <= 1, today);

  const { streak, inventory, chests, chestBlock } = playedToday(state, def.reward.block, blocks, today, rng);

  const types = { ...state.types, [def.type]: adapt(state.types[def.type], score, def.adaptive) };

  // La première fois qu'une mission du lieu est terminée, une partie de son bâtiment se pose (GD-6).
  const posee = poserLesPartiesDues({ ...state, progress, spaced, stock: inventory, streak: streak.streak, types, chests }, def.biome, today);
  return {
    state: posee.state,
    ...(posee.pose ? { pose: posee.pose } : {}),
    score,
    stars,
    newBest,
    blocks,
    block: def.reward.block,
    bonus,
    xp,
    perfect,
    revision,
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
    // Les blocs des îles seulement : ni or ni cristal, ni blocs de finition, qui ne paient plus rien (GD-6).
    const common = [...new Set(BIOMES.map((b) => b.block))].filter((b) => !BLOCKS[b].rare && !BLOCKS[b].assemble);
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
