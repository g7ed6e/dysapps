import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gelerSauvegarde, loadJSON, removeKey, saveJSON } from '../core/storage';
import { bacASable, remplir } from './batisseur';
import {
  EMPTY_STATE,
  buildBridge as buildBridgePure,
  completeExercise,
  completePortalQuest,
  dueItems,
  fillPlanCell as fillPlanCellPure,
  launchVehicle as launchVehiclePure,
  moveAvatar,
  recordFluence as recordFluencePure,
  sanitizeState,
  todayISO,
  type BloclandState,
  type Completion,
  type FillResult,
  type LaunchResult,
  type PortalCompletion,
} from './engine';
import type { BiomeId } from './biomes';
import type { PlanDef } from './world/plans';
import type { VehicleStage } from './world/vehicle';
import type { BuildBridgeResult } from './world/archipelago';
import type { ExerciseDef, ItemResult } from './exercises/types';

/** Sessions courtes : on propose d'arrêter après ce nombre d'exercices ou cette durée. */
export const SESSION_MAX_EXERCISES = 3;
export const SESSION_MAX_MINUTES = 10;

interface BloclandContextValue {
  state: BloclandState;
  complete: (def: ExerciseDef, results: ItemResult[]) => Completion;
  /** Une mission du portail (l'école du village) terminée, score entre 0 et 1 : des blocs de l'île de l'école. */
  completePortal: (score: number, firstTime: boolean) => PortalCompletion;
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
  /** Pose le bloc attendu à une cellule d'un plan. */
  fillPlan: (plan: PlanDef, x: number, y: number, z: number) => FillResult;
  /** Construit un pont vers une île voisine, payé avec les blocs de l'inventaire. */
  buildBridge: (id: string) => BuildBridgeResult;
  /** Le bonhomme va sur une île ouverte. */
  moveTo: (id: BiomeId) => void;
  /** Largue les amarres du Bloc-Navire : le voyage est fait, le bonhomme arrive au port d'en face. */
  launch: (stage: VehicleStage) => LaunchResult;
  reset: () => void;
  /** Le mode bâtisseur est-il ouvert ? (une copie de la partie, en mémoire seulement) */
  batisseur: boolean;
  /** Ouvre le mode bâtisseur : la sauvegarde est gelée, la partie devient un bac à sable. */
  ouvrirBatisseur: () => void;
}

const BloclandContext = createContext<BloclandContextValue | null>(null);
const STORAGE_KEY = 'blocland';

export function BloclandProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BloclandState>(() => sanitizeState(loadJSON<unknown>(STORAGE_KEY, {})));
  const stateRef = useRef(state);
  const [sessionCount, setSessionCount] = useState(0);
  const sessionStart = useRef(Date.now());
  const [batisseur, setBatisseur] = useState(false);
  const batisseurRef = useRef(false);

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

  const completePortal = useCallback((score: number, firstTime: boolean) => {
    const completion = completePortalQuest(stateRef.current, score, firstTime, todayISO());
    stateRef.current = completion.state;
    setState(completion.state);
    return completion;
  }, []);

  const recordFluence = useCallback((textId: string, seconds: number) => {
    const r = recordFluencePure(stateRef.current, textId, seconds);
    stateRef.current = r.state;
    setState(r.state);
    return { previous: r.previous };
  }, []);

  const fillPlan = useCallback((plan: PlanDef, x: number, y: number, z: number) => {
    const r = fillPlanCellPure(stateRef.current, plan, x, y, z);
    if (r.ok) {
      const next = batisseurRef.current ? remplir(r.state) : r.state;
      stateRef.current = next;
      setState(next);
      return { ...r, state: next };
    }
    return r;
  }, []);
  const buildBridge = useCallback((id: string) => {
    const r = buildBridgePure(stateRef.current, id);
    const next = batisseurRef.current ? remplir(r.state) : r.state;
    stateRef.current = next;
    setState(next);
    return r.result;
  }, []);
  const moveTo = useCallback((id: BiomeId) => {
    const next = moveAvatar(stateRef.current, id);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
  }, []);
  const launch = useCallback((stage: VehicleStage) => {
    const r = launchVehiclePure(stateRef.current, stage);
    if (r.result.ok) {
      stateRef.current = r.state;
      setState(r.state);
    }
    return r.result;
  }, []);
  const continueSession = useCallback(() => {
    setSessionCount(0);
    sessionStart.current = Date.now();
  }, []);

  const ouvrirBatisseur = useCallback(() => {
    if (batisseurRef.current) return;
    gelerSauvegarde();
    batisseurRef.current = true;
    setBatisseur(true);
    stateRef.current = bacASable(stateRef.current);
    setState(stateRef.current);
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
      completePortal,
      dueCount,
      sessionCount,
      pauseAfterNext,
      continueSession,
      recordFluence,
      fillPlan,
      buildBridge,
      moveTo,
      launch,
      reset,
      batisseur,
      ouvrirBatisseur,
    }),
    [state, complete, completePortal, dueCount, sessionCount, pauseAfterNext, continueSession, recordFluence, fillPlan, buildBridge, moveTo, launch, reset, batisseur, ouvrirBatisseur],
  );
  return <BloclandContext.Provider value={value}>{children}</BloclandContext.Provider>;
}

/** Le contexte s'il y en a un : une mission du portail se joue aussi hors de Blocland (tests, intégrations). */
export function useOptionalBlocland(): BloclandContextValue | null {
  return useContext(BloclandContext);
}

export function useBlocland(): BloclandContextValue {
  const ctx = useContext(BloclandContext);
  if (!ctx) throw new Error('useBlocland doit être utilisé dans <BloclandProvider>');
  return ctx;
}
