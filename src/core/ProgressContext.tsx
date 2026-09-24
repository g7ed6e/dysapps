import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  EMPTY_PROGRESS,
  levelFromXp,
  recordAnswer,
  type IconName,
  recordSession,
  sanitizeProgress,
  type Progress,
  type ProgressUpdate,
} from './progress';
import { loadJSON, removeKey, saveJSON } from './storage';

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
  resetProgress: () => void;
  celebrations: Celebration[];
  dismissCelebration: (id: number) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const STORAGE_KEY = 'progress';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => sanitizeProgress(loadJSON(STORAGE_KEY, EMPTY_PROGRESS)));
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
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
      items.push({ id: nextId.current++, kind: 'levelup', icon: 'zap', title: 'Level up !', message: `Niveau ${info.level} · rang ${info.title}` });
    }
    for (const b of update.newBadges) {
      items.push({ id: nextId.current++, kind: 'badge', icon: b.icon, title: 'Succès débloqué', message: b.title });
    }
    if (items.length) setCelebrations((prev) => [...prev, ...items]);
    return update;
  }, []);

  const answer = useCallback(
    (correct: boolean, attempt = 1) => apply(recordAnswer(progressRef.current, correct, attempt)),
    [apply],
  );

  const completeSession = useCallback(
    (appId: string, score: number) => apply(recordSession(progressRef.current, appId, score)),
    [apply],
  );

  const resetProgress = useCallback(() => {
    removeKey(STORAGE_KEY);
    progressRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    setCelebrations([]);
  }, []);

  const dismissCelebration = useCallback((id: number) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({ progress, answer, completeSession, resetProgress, celebrations, dismissCelebration }),
    [progress, answer, completeSession, resetProgress, celebrations, dismissCelebration],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress doit être utilisé dans <ProgressProvider>');
  return ctx;
}
