import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gelerSauvegarde, loadJSON, removeKey, saveJSON, trySaveJSON } from '../core/storage';
import { useProgress } from '../core/ProgressContext';
import { bacASable, remplir } from './builder';
import {
  EMPTY_STATE,
  disassembleBlock,
  buildBridge as buildBridgePure,
  completeExercise,
  completePortalQuest,
  dueItems,
  fillPlanCell as fillPlanCellPure,
  launchVehicle as launchVehiclePure,
  moveAvatar,
  rattraperLesParties,
  recordFluence as recordFluencePure,
  repondreAssemblage as repondreAssemblagePure,
  sanitizeState,
  todayISO,
  type AssembleResult,
  type GameState,
  type Completion,
  type FillResult,
  type LaunchResult,
  type PortalCompletion,
  type ReponseAssemblage,
  type ReponseDonnee,
} from './engine';
import type { BiomeId, BlockId } from './biomes';
import type { PlanDef } from './world/plans';
import type { VehicleStage } from './world/vehicle';
import type { BuildBridgeResult } from './world/archipelago';
import type { ExerciseDef, ItemResult } from './exercises/types';
import { useTextes } from '../universes';
import { archipelagoOf, getBridge, type ArchipelagoId } from './world/archipelago';
import { archipelDeLaCommande, faireArriverUneCommande, livrerLaCommande, type Livraison } from './world/requests';
import { applyLayout } from './world/appliedLayout';

/** Sessions courtes : on propose d'arrêter après ce nombre d'exercices ou cette durée. */
const SESSION_MAX_EXERCISES = 3;
const SESSION_MAX_MINUTES = 10;

interface BloclandContextValue {
  state: GameState;
  /**
   * Le numéro de la disposition du monde (GD-9, `layoutVersion`) : il change quand la place d'un lieu, une liaison à
   * reposer ou une arrivée change. Les vues qui lisent la place des lieux s'en servent pour se refaire.
   */
  disposition: number;
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
  /**
   * La réponse finale à la question d'un bloc assemblé (GD-2) : juste, le bloc est assemblé avec les blocs de
   * l'inventaire ; manquée, rien n'est pris. La question est notée dans le tirage de l'élève.
   */
  repondreAssemblage: (bloc: BlockId, reponse: ReponseDonnee) => ReponseAssemblage;
  /** Défait un bloc assemblé en poche : ses blocs reviennent (GD-2). */
  disassemble: (bloc: BlockId) => AssembleResult;
  /** Construit un pont vers une île voisine, payé avec les blocs de l'inventaire. */
  buildBridge: (id: string) => BuildBridgeResult;
  /**
   * Livre une commande prête (GD-7, PR 3) : ses blocs sortent de l'inventaire, sa petite construction se pose chez la
   * créature. Puis une autre commande peut arriver.
   */
  deliver: (id: string) => Livraison<GameState>;
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
const STORAGE_KEY = 'game';

export function BloclandProvider({ children }: { children: ReactNode }) {
  const { completePlan } = useProgress();
  // Une sauvegarde d'avant GD-6 reçoit tout de suite les parties de ses missions déjà terminées ; l'XP des plans qu'elles
  // finissent est donnée une fois, juste après (plus bas).
  const [ouverture] = useState(() => rattraperLesParties(sanitizeState(loadJSON<unknown>(STORAGE_KEY, {}))));
  const [state, setState] = useState<GameState>(ouverture.state);
  // La disposition de la partie (GD-9) posée sur le monde avant que les vues ne le lisent, à la lecture de la partie et
  // à chaque changement de `world.layout` : un calcul sans effet visible hors du monde, qui ne refait rien si la
  // disposition est la même (`applyLayout`).
  const disposition = useMemo(() => applyLayout(state.world.layout), [state.world.layout]);
  const stateRef = useRef(state);
  const rattrapes = useRef(ouverture.plansFinis);
  useEffect(() => {
    // L'XP n'est donnée que si la sauvegarde rattrapée est bien écrite : sinon, le rattrapage refait à la prochaine
    // ouverture la donnerait deux fois.
    if (rattrapes.current.length && trySaveJSON(STORAGE_KEY, ouverture.state)) for (const plan of rattrapes.current) completePlan(plan.reward.xp);
    rattrapes.current = [];
  }, [completePlan, ouverture.state]);
  const [sessionCount, setSessionCount] = useState(0);
  const sessionStart = useRef(Date.now());
  const [batisseur, setBatisseur] = useState(false);
  const batisseurRef = useRef(false);
  // Les commandes des habitants (GD-7, PR 3) n'arrivent que dans un univers qui en a les textes (`commandes`).
  const avecLesTextes = Boolean(useTextes().commandes);
  const avecCommandes = useRef(avecLesTextes);
  useEffect(() => {
    avecCommandes.current = avecLesTextes;
  }, [avecLesTextes]);
  /** À la fin d'une mission, d'un ouvrage construit ou d'une livraison dans l'archipel `a` : une commande au plus arrive. */
  const commandeQuiArrive = useCallback((s: GameState, a: ArchipelagoId): GameState => (avecCommandes.current ? faireArriverUneCommande(s, a).state : s), []);

  useEffect(() => {
    saveJSON(STORAGE_KEY, state);
  }, [state]);

  const complete = useCallback((def: ExerciseDef, results: ItemResult[]) => {
    const terminee = completeExercise(stateRef.current, def, results, todayISO());
    // La mission finie, jamais pendant sa consigne : une commande peut arriver dans l'archipel de son île.
    const completion = { ...terminee, state: commandeQuiArrive(terminee.state, archipelagoOf(def.biome).classe) };
    stateRef.current = completion.state;
    setState(completion.state);
    setSessionCount((n) => n + 1);
    // Ce qu'un plan terminé donnait passe à la mission qui le finit (GD-6) : son XP et son compteur de succès.
    for (const plan of completion.pose?.plansFinis ?? []) completePlan(plan.reward.xp);
    return completion;
  }, [completePlan, commandeQuiArrive]);

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
  /** Enregistre un état nouveau de l'assemblage (inventaire plein en mode bâtisseur) et le rend. */
  const pousser = useCallback((state: GameState): GameState => {
    const next = batisseurRef.current ? remplir(state) : state;
    stateRef.current = next;
    setState(next);
    return next;
  }, []);
  const appliquer = useCallback((r: AssembleResult): AssembleResult => (r.ok ? { ...r, state: pousser(r.state) } : r), [pousser]);
  const repondreAssemblage = useCallback(
    (bloc: BlockId, reponse: ReponseDonnee): ReponseAssemblage => {
      const r = repondreAssemblagePure(stateRef.current, bloc, reponse);
      // Une question d'assemblage compte dans l'horloge de séance comme un exercice (GD-2, choix du mainteneur).
      setSessionCount((n) => n + 1);
      return r.state === stateRef.current ? r : { ...r, state: pousser(r.state) };
    },
    [pousser],
  );
  const disassemble = useCallback((bloc: BlockId) => appliquer(disassembleBlock(stateRef.current, bloc)), [appliquer]);
  const buildBridge = useCallback((id: string) => {
    const r = buildBridgePure(stateRef.current, id);
    const bridge = getBridge(id);
    const built = r.result.ok && bridge ? commandeQuiArrive(r.state, archipelagoOf(bridge.from).classe) : r.state;
    const next = batisseurRef.current ? remplir(built) : built;
    stateRef.current = next;
    setState(next);
    return r.result;
  }, [commandeQuiArrive]);
  const deliver = useCallback(
    (id: string): Livraison<GameState> => {
      const r = livrerLaCommande(stateRef.current, id);
      if (!r.ok) return r;
      const next = pousser(commandeQuiArrive(r.state, archipelDeLaCommande(r.commande)));
      return { ...r, state: next };
    },
    [pousser, commandeQuiArrive],
  );
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
      disposition,
      complete,
      completePortal,
      dueCount,
      sessionCount,
      pauseAfterNext,
      continueSession,
      recordFluence,
      fillPlan,
      repondreAssemblage,
      disassemble,
      buildBridge,
      deliver,
      moveTo,
      launch,
      reset,
      batisseur,
      ouvrirBatisseur,
    }),
    [
      state,
      disposition,
      complete,
      completePortal,
      dueCount,
      sessionCount,
      pauseAfterNext,
      continueSession,
      recordFluence,
      fillPlan,
      repondreAssemblage,
      disassemble,
      buildBridge,
      deliver,
      moveTo,
      launch,
      reset,
      batisseur,
      ouvrirBatisseur,
    ],
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
