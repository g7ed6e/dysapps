import { useEffect, useState } from 'react';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, blockCount, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { currentPlan, nextFillable, planCellAt, planStatus, type FillResult, type PlanStatus } from './engine';
import { playDone, playNope, playPlace } from './sound';
import { planCells, plansFor, type PlanDef } from './world/plans';
import { allerChercher, whereToEarn } from './world/uses';
import type { Ancrage } from './world/disposition';
import type { Burst } from './world/view';
import { useHaptics } from '../core/haptics';

export type { Burst } from './world/view';

export interface PlanBuilder {
  island: BiomeId;
  /** Le plan en cours (le premier non terminé, sinon le dernier). */
  plan: PlanDef | null;
  status: PlanStatus | null;
  index: number;
  total: number;
  allDone: boolean;
  canFill: boolean;
  /** Dernier message (refus, bloc posé, plan terminé). */
  notice: string | null;
  /** Éclats à dessiner dans le monde 3D. */
  burst: Burst;
  /** Des éclats de fête à un endroit du monde (coordonnées du monde), sans poser de bloc. */
  celebrate: (cell: Ancrage, color: string) => void;
  /** Pose le bloc attendu à une cellule du plan (coordonnées relatives à l'île). */
  fillAt: (x: number, y: number, z: number) => void;
  /** Pose le prochain bloc possible. */
  fillNext: () => void;
  /** Pose d'un coup tous les blocs du plan que l'inventaire permet (les grands bâtiments ont beaucoup de cases). */
  fillAll: () => void;
  /** Une case touchée du plan de l'île `ile` (cases de la sauvegarde) : pose si c'est une cellule du plan en cours. Renvoie vrai si c'était le cas. */
  tryFill: (ile: BiomeId, cell: { x: number; y: number; z: number }) => boolean;
}

export { whereToEarn };

/**
 * Pose d'un coup toutes les cases d'un plan (île, Bloc-Navire) que l'inventaire permet, dans l'ordre du plan. Le contexte
 * suit l'inventaire à chaque pose : une case dont le bloc manque est sautée.
 */
export function placeAll(
  plan: PlanDef,
  done: string[],
  fillPlan: (plan: PlanDef, x: number, y: number, z: number) => FillResult,
): { placed: number; last: { x: number; y: number; z: number; block: BlockId } | null; completed: boolean } {
  const already = new Set(done);
  let placed = 0;
  let last: { x: number; y: number; z: number; block: BlockId } | null = null;
  let completed = false;
  for (const c of planCells(plan)) {
    if (already.has(c.key)) continue;
    const r = fillPlan(plan, c.x, c.y, c.z);
    if (!r.ok) continue;
    placed += 1;
    last = { x: c.x, y: c.y, z: c.z, block: r.block };
    if (r.completed) completed = true;
  }
  return { placed, last, completed };
}

/**
 * La construction guidée d'une île : le plan en cours, la pose d'un bloc (par le bouton ou en touchant un fantôme
 * dans le monde), les sons, les éclats, le coffre et la phrase de la créature quand le plan est terminé.
 */
export function usePlanBuilder(island: BiomeId): PlanBuilder {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const { completePlan } = useProgress();
  const [notice, setNotice] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { ile: island, local: { x: 0, y: 0, z: 0 } }, color: '#fff' });
  useEffect(() => setNotice(null), [island]);

  const plans = plansFor(island);
  const current = currentPlan(state, island);
  const plan = current?.plan ?? null;
  const status = plan ? planStatus(state, plan) : null;
  const sound = (f: () => void) => settings.sounds && f();
  const haptics = useHaptics();

  const fillAt = (x: number, y: number, z: number) => {
    if (!plan) return;
    const r = fillPlan(plan, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut ${blockCount(r.block, 1)} : ${allerChercher(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc du plan est déjà posé.');
      sound(playNope);
      return;
    }
    burstAt(x, y, z, r.block);
    if (r.completed) finished(plan);
    else {
      setNotice(`Bloc posé : ${status ? status.done + 1 : 1} sur ${status?.total ?? '?'}.`);
      sound(playPlace);
      haptics.place();
    }
  };
  const burstAt = (x: number, y: number, z: number, block: BlockId) => {
    // Dans le repère de l'île, la case de plan (x, y, z) est le cube (x, y, z + 1).
    setBurst((b) => ({ seq: b.seq + 1, cell: { ile: island, local: { x, y, z: z + 1 } }, color: BLOCKS[block].top }));
  };
  // Le plan terminé : la phrase de la créature, le coffre, l'XP, le son.
  const finished = (done: PlanDef) => {
    const chest = Object.entries(done.reward.chest)
      .map(([b, n]) => blockCount(b as BlockId, n))
      .join(', ');
    const msg = `${done.name} : terminé ! ${done.done} Coffre : ${chest}. +${done.reward.xp} XP.`;
    setNotice(msg);
    completePlan(done.reward.xp);
    sound(playDone);
    if (settings.autoRead) speak(msg);
  };
  const fillAll = () => {
    if (!plan) return;
    const { placed, last, completed } = placeAll(plan, state.village.plans[plan.id] ?? [], fillPlan);
    if (!last) return;
    burstAt(last.x, last.y, last.z, last.block);
    if (completed) return finished(plan);
    const left = (status?.total ?? 0) - (status?.done ?? 0) - placed;
    setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}. ${left > 0 ? `Il en reste ${left} à poser : gagne les blocs qui manquent.` : ''}`.trim());
    sound(playPlace);
    haptics.place();
  };
  const fillNext = () => {
    if (!plan) return;
    const next = nextFillable(state, plan);
    if (next) fillAt(next.x, next.y, next.z);
  };
  const tryFill = (ile: BiomeId, c: { x: number; y: number; z: number }) => {
    if (!plan || ile !== island) return false;
    if (!planCellAt(plan, c.x, c.y, c.z)) return false;
    fillAt(c.x, c.y, c.z);
    return true;
  };

  return {
    island,
    plan,
    status,
    index: plan ? plans.indexOf(plan) + 1 : 0,
    total: plans.length,
    allDone: current?.allDone ?? false,
    canFill: Boolean(plan && status && !status.complete && nextFillable(state, plan) !== null),
    notice,
    burst,
    celebrate: (cell, color) => setBurst((b) => ({ seq: b.seq + 1, cell, color })),
    fillAt,
    fillNext,
    fillAll,
    tryFill,
  };
}
