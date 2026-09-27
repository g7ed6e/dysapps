import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  EMPTY_PROGRESS,
  levelFromXp,
  recordAnswer,
  type IconName,
  recordBoss,
  recordMonument,
  recordPlan,
  recordVoyage,
  recordSession,
  sanitizeProgress,
  type Progress,
  type ProgressUpdate,
} from './progress';
import { loadJSON, removeKey, saveJSON } from './storage';
import { forgetPlace } from './lastPlace';

export interface Celebration {
  id: number;
  kind: 'levelup' | 'badge';
  icon: IconName;
  title: string;
  message: string;
}

interface ProgressContextValue {
  progress: Progress;
  answer: (correct: boolean, attempt?: number) => ProgressUpdate;
  completeSession: (appId: string, score: number) => ProgressUpdate;
  /** Un bâtiment du village terminé : XP et succès. */
  completePlan: (xp: number) => ProgressUpdate;
  /** Un monument terminé : XP et succès. */
  completeMonument: (xp: number) => ProgressUpdate;
  /** Un Gardien de biome vaincu : succès. */
  beatBoss: () => ProgressUpdate;
  /** Un voyage du Bloc-Navire : l'XP de l'étape et les succès de voyage. */
  launchVoyage: (xp: number) => ProgressUpdate;
  resetProgress: () => void;
  celebrations: Celebration[];
  dismissCelebration: (id: number) => void;
  /** Vrai pendant une partie : les récompenses attendent la fin pour ne rien cacher (voir `useHoldCelebrations`). */
  celebrationsHeld: boolean;
  holdCelebrations: (hold: boolean) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const STORAGE_KEY = 'progress';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => sanitizeProgress(loadJSON(STORAGE_KEY, EMPTY_PROGRESS)));
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  // Nombre de parties en cours qui retiennent les récompenses (0 : on les montre).
  const [holds, setHolds] = useState(0);
  const holdCelebrations = useCallback((hold: boolean) => setHolds((n) => Math.max(0, n + (hold ? 1 : -1))), []);
  // Référence synchrone pour enchaîner plusieurs évènements dans le même rendu.
  const progressRef = useRef(progress);
  const nextId = useRef(1);

  useEffect(() => {
    saveJSON(STORAGE_KEY, progress);
  }, [progress]);

  const apply = useCallback((update: ProgressUpdate) => {
    progressRef.current = update.progress;
    setProgress(update.progress);
    const items: Celebration[] = [];
    if (update.leveledUp) {
      const info = levelFromXp(update.progress.xp);
      items.push({ id: nextId.current++, kind: 'levelup', icon: 'zap', title: 'Niveau supérieur !', message: `Niveau ${info.level} · rang ${info.title}` });
    }
    for (const b of update.newBadges) {
      items.push({ id: nextId.current++, kind: 'badge', icon: b.icon, title: 'Succès débloqué', message: b.title });
    }
    if (items.length) setCelebrations((prev) => [...prev, ...items]);
    return update;
  }, []);

  const answer = useCallback((correct: boolean, attempt = 1) => apply(recordAnswer(progressRef.current, correct, attempt)), [apply]);

  const completeSession = useCallback((appId: string, score: number) => apply(recordSession(progressRef.current, appId, score)), [apply]);

  const completePlan = useCallback((xp: number) => apply(recordPlan(progressRef.current, xp)), [apply]);
  const beatBoss = useCallback(() => apply(recordBoss(progressRef.current)), [apply]);
  const completeMonument = useCallback((xp: number) => apply(recordMonument(progressRef.current, xp)), [apply]);
  const launchVoyage = useCallback((xp: number) => apply(recordVoyage(progressRef.current, xp)), [apply]);

  const resetProgress = useCallback(() => {
    removeKey(STORAGE_KEY);
    forgetPlace();
    progressRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    setCelebrations([]);
  }, []);

  const dismissCelebration = useCallback((id: number) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      progress,
      answer,
      completeSession,
      completePlan,
      completeMonument,
      beatBoss,
      launchVoyage,
      resetProgress,
      celebrations,
      dismissCelebration,
      celebrationsHeld: holds > 0,
      holdCelebrations,
    }),
    [progress, answer, completeSession, completePlan, completeMonument, beatBoss, launchVoyage, resetProgress, celebrations, dismissCelebration, holds, holdCelebrations],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress doit être utilisé dans <ProgressProvider>');
  return ctx;
}
