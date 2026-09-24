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
  title: string;
}

const LEVEL_TITLES = [
  'Explorateur·rice',
  'Apprenti·e',
  'Curieux·se',
  'Aventurier·ère',
  'Stratège',
  'Expert·e',
  'Champion·ne',
  'Maître',
  'Légende',
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(Math.floor((level - 1) / 3), LEVEL_TITLES.length - 1)];
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForLevel: xpToNextLevel(level), title: levelTitle(level) };
}

// ---------- Badges ----------

export interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: (p: Progress) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: 'premier-pas', icon: '👣', title: 'Premier pas', description: 'Répondre à ta première question.', earned: (p) => p.totalAnswers >= 1 },
  { id: 'premiere-seance', icon: '🎒', title: 'Première séance', description: 'Terminer une séance d’exercices.', earned: (p) => p.sessionsCompleted >= 1 },
  { id: 'serie-5', icon: '🔥', title: 'En forme', description: '5 bonnes réponses d’affilée.', earned: (p) => p.bestStreak >= 5 },
  { id: 'serie-10', icon: '⚡', title: 'Inarrêtable', description: '10 bonnes réponses d’affilée.', earned: (p) => p.bestStreak >= 10 },
  { id: 'sans-faute', icon: '🌟', title: 'Sans faute', description: 'Réussir une séance à 100 %.', earned: (p) => p.perfectSessions >= 1 },
  { id: 'perseverant', icon: '🧗', title: 'Persévérant·e', description: 'Terminer 10 séances.', earned: (p) => p.sessionsCompleted >= 10 },
  { id: 'cinquante', icon: '🎯', title: '50 réponses', description: 'Répondre à 50 questions.', earned: (p) => p.totalAnswers >= 50 },
  { id: 'deux-cents', icon: '🏔️', title: '200 réponses', description: 'Répondre à 200 questions.', earned: (p) => p.totalAnswers >= 200 },
  { id: 'niveau-5', icon: '🥉', title: 'Niveau 5', description: 'Atteindre le niveau 5.', earned: (p) => levelFromXp(p.xp).level >= 5 },
  { id: 'niveau-10', icon: '🥈', title: 'Niveau 10', description: 'Atteindre le niveau 10.', earned: (p) => levelFromXp(p.xp).level >= 10 },
  { id: 'niveau-20', icon: '🥇', title: 'Niveau 20', description: 'Atteindre le niveau 20.', earned: (p) => levelFromXp(p.xp).level >= 20 },
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
