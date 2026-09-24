import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadJSON, removeKey, saveJSON } from '../core/storage';
import type { BlockId } from './biomes';
import {
  EMPTY_STATE,
  clearBuild as clearBuildPure,
  completeExercise,
  dueItems,
  placeBlock as placeBlockPure,
  recordFluence as recordFluencePure,
  removeBlock as removeBlockPure,
  sanitizeState,
  todayISO,
  type BloclandState,
  type Completion,
  type PlaceResult,
} from './engine';
import type { ExerciseDef, ItemResult } from './exercises/types';

/** Sessions courtes : on propose d'arrêter après ce nombre d'exercices ou cette durée. */
export const SESSION_MAX_EXERCISES = 3;
export const SESSION_MAX_MINUTES = 10;

interface BloclandContextValue {
  state: BloclandState;
  complete: (def: ExerciseDef, results: ItemResult[]) => Completion;
  /** Items à revoir aujourd'hui. */
  dueCount: number;
  /** Exercices terminés dans cette session. */
  sessionCount: number;
  /** Faut-il proposer une pause à la fin de l'exercice en cours ? */
  pauseAfterNext: boolean;
  /** L'élève choisit de continuer : on repart pour une nouvelle petite session. */
  continueSession: () => void;
  /** Temps de lecture d'un texte d'Ascension ; renvoie le temps précédent (comparaison à soi-même). */
  recordFluence: (textId: string, seconds: number) => { previous: number | null };
  /** Construction : poser, retirer, tout démonter. */
  place: (x: number, y: number, block: BlockId) => PlaceResult;
  remove: (x: number, y: number) => BlockId | null;
  clearBuild: () => void;
  reset: () => void;
}

const BloclandContext = createContext<BloclandContextValue | null>(null);
const STORAGE_KEY = 'blocland';

export function BloclandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BloclandState>(() => sanitizeState(loadJSON(STORAGE_KEY, EMPTY_STATE)));
  const stateRef = useRef(state);
  const [sessionCount, setSessionCount] = useState(0);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    saveJSON(STORAGE_KEY, state);
  }, [state]);

  const complete = useCallback((def: ExerciseDef, results: ItemResult[]) => {
    const completion = completeExercise(stateRef.current, def, results, todayISO());
    stateRef.current = completion.state;
    setState(completion.state);
    setSessionCount((n) => n + 1);
    return completion;
  }, []);

  const recordFluence = useCallback((textId: string, seconds: number) => {
    const r = recordFluencePure(stateRef.current, textId, seconds);
    stateRef.current = r.state;
    setState(r.state);
    return { previous: r.previous };
  }, []);

  const place = useCallback((x: number, y: number, block: BlockId) => {
    const r = placeBlockPure(stateRef.current, x, y, block);
    if (r.ok) {
      stateRef.current = r.state;
      setState(r.state);
    }
    return r;
  }, []);

  const remove = useCallback((x: number, y: number) => {
    const r = removeBlockPure(stateRef.current, x, y);
    stateRef.current = r.state;
    setState(r.state);
    return r.removed;
  }, []);

  const clearBuild = useCallback(() => {
    stateRef.current = clearBuildPure(stateRef.current);
    setState(stateRef.current);
  }, []);

  const continueSession = useCallback(() => {
    setSessionCount(0);
    sessionStart.current = Date.now();
  }, []);

  const reset = useCallback(() => {
    removeKey(STORAGE_KEY);
    stateRef.current = EMPTY_STATE;
    setState(EMPTY_STATE);
  }, []);

  const pauseAfterNext = sessionCount + 1 >= SESSION_MAX_EXERCISES || Date.now() - sessionStart.current > SESSION_MAX_MINUTES * 60_000;
  const dueCount = useMemo(() => dueItems(state.spaced, todayISO()).length, [state.spaced]);

  const value = useMemo(
    () => ({ state, complete, dueCount, sessionCount, pauseAfterNext, continueSession, recordFluence, place, remove, clearBuild, reset }),
    [state, complete, dueCount, sessionCount, pauseAfterNext, continueSession, recordFluence, place, remove, clearBuild, reset],
  );
  return <BloclandContext.Provider value={value}>{children}</BloclandContext.Provider>;
}

export function useBlocland(): BloclandContextValue {
  const ctx = useContext(BloclandContext);
  if (!ctx) throw new Error('useBlocland doit être utilisé dans <BloclandProvider>');
  return ctx;
}
