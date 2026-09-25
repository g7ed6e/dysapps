import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadJSON, removeKey, saveJSON } from '../core/storage';
import type { BiomeId, BlockId } from './biomes';
import {
  EMPTY_STATE,
  clearIsland as clearIslandPure,
  completeExercise,
  dueItems,
  placeAt as placeAtPure,
  placeOnColumn as placeOnColumnPure,
  recordFluence as recordFluencePure,
  removeAt as removeAtPure,
  removeFromColumn as removeFromColumnPure,
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
  /** Construction sur la zone libre d'une île : à une case précise (3D) ou au sommet d'une colonne (vue simple). */
  placeAt: (island: BiomeId, x: number, y: number, z: number, block: BlockId) => PlaceResult;
  placeOnColumn: (island: BiomeId, x: number, y: number, block: BlockId) => PlaceResult;
  removeAt: (island: BiomeId, x: number, y: number, z: number) => BlockId | null;
  removeFromColumn: (island: BiomeId, x: number, y: number) => BlockId | null;
  clearIsland: (island: BiomeId) => void;
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

  const applyPlace = (r: PlaceResult) => {
    if (r.ok) {
      stateRef.current = r.state;
      setState(r.state);
    }
    return r;
  };
  const placeAt = useCallback(
    (island: BiomeId, x: number, y: number, z: number, block: BlockId) => applyPlace(placeAtPure(stateRef.current, island, x, y, z, block)),
    [],
  );
  const placeOnColumn = useCallback(
    (island: BiomeId, x: number, y: number, block: BlockId) => applyPlace(placeOnColumnPure(stateRef.current, island, x, y, block)),
    [],
  );
  const applyRemove = (r: { state: BloclandState; removed: BlockId | null }) => {
    stateRef.current = r.state;
    setState(r.state);
    return r.removed;
  };
  const removeAt = useCallback((island: BiomeId, x: number, y: number, z: number) => applyRemove(removeAtPure(stateRef.current, island, x, y, z)), []);
  const removeFromColumn = useCallback((island: BiomeId, x: number, y: number) => applyRemove(removeFromColumnPure(stateRef.current, island, x, y)), []);
  const clearIsland = useCallback((island: BiomeId) => {
    stateRef.current = clearIslandPure(stateRef.current, island);
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
    () => ({
      state,
      complete,
      dueCount,
      sessionCount,
      pauseAfterNext,
      continueSession,
      recordFluence,
      placeAt,
      placeOnColumn,
      removeAt,
      removeFromColumn,
      clearIsland,
      reset,
    }),
    [
      state,
      complete,
      dueCount,
      sessionCount,
      pauseAfterNext,
      continueSession,
      recordFluence,
      placeAt,
      placeOnColumn,
      removeAt,
      removeFromColumn,
      clearIsland,
      reset,
    ],
  );
  return <BloclandContext.Provider value={value}>{children}</BloclandContext.Provider>;
}

export function useBlocland(): BloclandContextValue {
  const ctx = useContext(BloclandContext);
  if (!ctx) throw new Error('useBlocland doit être utilisé dans <BloclandProvider>');
  return ctx;
}
