import { BIOMES } from '../blocland/biomes';
import { PLANS } from '../blocland/world/plans';
// Gamification : XP, niveaux et badges. Logique pure, facile à tester.

export interface AppStats {
  sessions: number;
  bestScore: number; // pourcentage 0-100
  lastPlayed: string | null; // date ISO
}

export interface Progress {
  xp: number;
  totalAnswers: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  sessionsCompleted: number;
  perfectSessions: number;
  /** Bâtiments du village terminés. */
  plansCompleted: number;
  /** Gardiens de biome vaincus. */
  bossesBeaten: number;
  badges: Record<string, string>; // id du badge -> date d'obtention (ISO)
  apps: Record<string, AppStats>;
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  totalAnswers: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  sessionsCompleted: 0,
  perfectSessions: 0,
  plansCompleted: 0,
  bossesBeaten: 0,
  badges: {},
  apps: {},
};

function nonNegativeInt(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Corrige une progression lue depuis le stockage (champs manquants, types invalides). */
export function sanitizeProgress(input: unknown): Progress {
  const raw = isRecord(input) ? input : {};
  const badges: Record<string, string> = {};
  if (isRecord(raw.badges)) {
    for (const [id, date] of Object.entries(raw.badges)) if (typeof date === 'string') badges[id] = date;
  }
  const apps: Record<string, AppStats> = {};
  if (isRecord(raw.apps)) {
    for (const [id, stats] of Object.entries(raw.apps)) {
      if (!isRecord(stats)) continue;
      apps[id] = {
        sessions: nonNegativeInt(stats.sessions),
        bestScore: Math.min(100, nonNegativeInt(stats.bestScore)),
        lastPlayed: typeof stats.lastPlayed === 'string' ? stats.lastPlayed : null,
      };
    }
  }
  return {
    xp: nonNegativeInt(raw.xp),
    totalAnswers: nonNegativeInt(raw.totalAnswers),
    correctAnswers: nonNegativeInt(raw.correctAnswers),
    currentStreak: nonNegativeInt(raw.currentStreak),
    bestStreak: nonNegativeInt(raw.bestStreak),
    sessionsCompleted: nonNegativeInt(raw.sessionsCompleted),
    plansCompleted: nonNegativeInt(raw.plansCompleted),
    bossesBeaten: nonNegativeInt(raw.bossesBeaten),
    perfectSessions: nonNegativeInt(raw.perfectSessions),
    badges,
    apps,
  };
}

/** Points gagnés. Une erreur rapporte quand même un point : on valorise l'effort. */
export const XP = {
  firstTry: 10,
  afterRetry: 5,
  effort: 1,
  sessionBonus: 20,
  perfectBonus: 15,
} as const;

// ---------- Niveaux ----------

/** XP nécessaire pour passer du niveau `level` au suivant. */
export function xpToNextLevel(level: number): number {
  return 50 + 25 * (level - 1);
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  /** Rang affiché, ex. « Argent II ». */
  title: string;
  tier: Tier;
}

export type Tier = 'bronze' | 'argent' | 'or' | 'platine' | 'diamant' | 'legende';

const TIERS: { id: Tier; name: string }[] = [
  { id: 'bronze', name: 'Bronze' },
  { id: 'argent', name: 'Argent' },
  { id: 'or', name: 'Or' },
  { id: 'platine', name: 'Platine' },
  { id: 'diamant', name: 'Diamant' },
];
const DIVISIONS = ['I', 'II', 'III'];
/** Premier niveau du rang Légende (après Diamant III). */
export const LEGEND_LEVEL = TIERS.length * DIVISIONS.length + 1;

/** Rang d'un niveau : 3 divisions par rang (Bronze I, II, III, puis Argent I…), puis Légende. */
export function rankForLevel(level: number): { title: string; tier: Tier } {
  if (level >= LEGEND_LEVEL) return { title: `Légende ${level - LEGEND_LEVEL + 1}`, tier: 'legende' };
  const index = Math.max(0, level - 1);
  const tier = TIERS[Math.floor(index / DIVISIONS.length)];
  return { title: `${tier.name} ${DIVISIONS[index % DIVISIONS.length]}`, tier: tier.id };
}

/** Niveau à partir duquel un rang est atteint (ex. Argent → 4). */
export function firstLevelOf(tier: Tier): number {
  if (tier === 'legende') return LEGEND_LEVEL;
  return TIERS.findIndex((t) => t.id === tier) * DIVISIONS.length + 1;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForLevel: xpToNextLevel(level), ...rankForLevel(level) };
}

// ---------- Succès ----------

/** Nom d'icône (voir components/Icon.tsx) : la logique reste indépendante de l'interface. */
export type IconName =
  | 'footprints'
  | 'flag'
  | 'flame'
  | 'zap'
  | 'star'
  | 'dumbbell'
  | 'target'
  | 'mountain'
  | 'medal'
  | 'trophy'
  | 'gem'
  | 'crown'
  | 'hammer'
  | 'blocks'
  | 'shield'
  | 'castle';

export interface BadgeDef {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  earned: (p: Progress) => boolean;
}

const reached = (p: Progress, tier: Tier) => levelFromXp(p.xp).level >= firstLevelOf(tier);

export const BADGES: BadgeDef[] = [
  { id: 'premier-pas', icon: 'footprints', title: 'Échauffement', description: 'Répondre à ta première question.', earned: (p) => p.totalAnswers >= 1 },
  { id: 'premiere-seance', icon: 'flag', title: 'Première quête', description: 'Terminer une quête.', earned: (p) => p.sessionsCompleted >= 1 },
  { id: 'serie-5', icon: 'flame', title: 'Combo x5', description: '5 bonnes réponses d’affilée.', earned: (p) => p.bestStreak >= 5 },
  { id: 'serie-10', icon: 'zap', title: 'Combo x10', description: '10 bonnes réponses d’affilée.', earned: (p) => p.bestStreak >= 10 },
  { id: 'sans-faute', icon: 'star', title: 'Perfect', description: 'Finir une quête à 100 %.', earned: (p) => p.perfectSessions >= 1 },
  { id: 'perseverant', icon: 'dumbbell', title: 'Acharné', description: 'Terminer 10 quêtes.', earned: (p) => p.sessionsCompleted >= 10 },
  { id: 'cinquante', icon: 'target', title: 'Rodé', description: 'Répondre à 50 questions.', earned: (p) => p.totalAnswers >= 50 },
  { id: 'deux-cents', icon: 'mountain', title: 'Vétéran', description: 'Répondre à 200 questions.', earned: (p) => p.totalAnswers >= 200 },
  { id: 'rang-argent', icon: 'medal', title: 'Rang Argent', description: 'Atteindre le rang Argent.', earned: (p) => reached(p, 'argent') },
  { id: 'rang-or', icon: 'trophy', title: 'Rang Or', description: 'Atteindre le rang Or.', earned: (p) => reached(p, 'or') },
  { id: 'rang-diamant', icon: 'gem', title: 'Rang Diamant', description: 'Atteindre le rang Diamant.', earned: (p) => reached(p, 'diamant') },
  { id: 'rang-legende', icon: 'crown', title: 'Légende', description: 'Atteindre le rang Légende.', earned: (p) => reached(p, 'legende') },
  { id: 'batisseur', icon: 'hammer', title: 'Bâtisseur', description: 'Terminer un bâtiment du village.', earned: (p) => p.plansCompleted >= 1 },
  { id: 'architecte', icon: 'blocks', title: 'Architecte', description: 'Terminer cinq bâtiments du village.', earned: (p) => p.plansCompleted >= 5 },
  {
    id: 'village',
    icon: 'crown',
    title: 'Village reconstruit',
    description: 'Terminer les quinze plans des cinq premières îles.',
    earned: (p) => p.plansCompleted >= 15,
  },
  {
    id: 'archipel-bati',
    icon: 'castle',
    title: 'Archipel bâti',
    description: `Terminer les ${PLANS.length} plans de l’archipel.`,
    earned: (p) => p.plansCompleted >= PLANS.length,
  },
  { id: 'gardien', icon: 'shield', title: 'Face au Gardien', description: 'Vaincre le Gardien d’un biome.', earned: (p) => p.bossesBeaten >= 1 },
  { id: 'cinq-iles', icon: 'shield', title: 'Maître des cinq îles', description: 'Vaincre cinq Gardiens.', earned: (p) => p.bossesBeaten >= 5 },
  { id: 'dix-gardiens', icon: 'medal', title: 'Collégien', description: 'Vaincre dix Gardiens.', earned: (p) => p.bossesBeaten >= 10 },
  {
    id: 'archipel',
    icon: 'crown',
    title: 'Maître de l’archipel',
    description: `Vaincre les ${BIOMES.length} Gardiens de l’archipel.`,
    earned: (p) => p.bossesBeaten >= BIOMES.length,
  },
];

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

function awardBadges(p: Progress, now: string): { progress: Progress; newBadges: BadgeDef[] } {
  const newBadges = BADGES.filter((b) => !p.badges[b.id] && b.earned(p));
  if (newBadges.length === 0) return { progress: p, newBadges };
  const badges = { ...p.badges };
  for (const b of newBadges) badges[b.id] = now;
  return { progress: { ...p, badges }, newBadges };
}

// ---------- Évènements ----------

export interface ProgressUpdate {
  progress: Progress;
  xpGained: number;
  newBadges: BadgeDef[];
  leveledUp: boolean;
}

function finish(before: Progress, after: Progress, xpGained: number, now: string): ProgressUpdate {
  const { progress, newBadges } = awardBadges(after, now);
  return {
    progress,
    xpGained,
    newBadges,
    leveledUp: levelFromXp(progress.xp).level > levelFromXp(before.xp).level,
  };
}

/**
 * Enregistre une réponse.
 * @param attempt numéro de l'essai (1 = premier essai)
 */
export function recordAnswer(p: Progress, correct: boolean, attempt = 1, now = new Date().toISOString()): ProgressUpdate {
  const xpGained = correct ? (attempt <= 1 ? XP.firstTry : XP.afterRetry) : XP.effort;
  const currentStreak = correct && attempt <= 1 ? p.currentStreak + 1 : correct ? p.currentStreak : 0;
  const after: Progress = {
    ...p,
    xp: p.xp + xpGained,
    totalAnswers: p.totalAnswers + 1,
    correctAnswers: p.correctAnswers + (correct ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(p.bestStreak, currentStreak),
  };
  return finish(p, after, xpGained, now);
}

/** Enregistre la fin d'une séance d'une application. `score` en pourcentage. */
/** Un bâtiment du village est terminé : XP du plan et compteur pour les succès. */
/** Un Gardien de biome vaincu (deux étoiles au défi) : compteur pour les succès. */
export function recordBoss(p: Progress, now = new Date().toISOString()): ProgressUpdate {
  return finish(p, { ...p, bossesBeaten: p.bossesBeaten + 1 }, 0, now);
}

export function recordPlan(p: Progress, xp: number, now = new Date().toISOString()): ProgressUpdate {
  const after: Progress = { ...p, xp: p.xp + xp, plansCompleted: p.plansCompleted + 1 };
  return finish(p, after, xp, now);
}

export function recordSession(p: Progress, appId: string, score: number, now = new Date().toISOString()): ProgressUpdate {
  const perfect = score >= 100;
  const xpGained = XP.sessionBonus + (perfect ? XP.perfectBonus : 0);
  const prev = p.apps[appId] ?? { sessions: 0, bestScore: 0, lastPlayed: null };
  const after: Progress = {
    ...p,
    xp: p.xp + xpGained,
    sessionsCompleted: p.sessionsCompleted + 1,
    perfectSessions: p.perfectSessions + (perfect ? 1 : 0),
    apps: {
      ...p.apps,
      [appId]: { sessions: prev.sessions + 1, bestScore: Math.max(prev.bestScore, Math.round(score)), lastPlayed: now },
    },
  };
  return finish(p, after, xpGained, now);
}
