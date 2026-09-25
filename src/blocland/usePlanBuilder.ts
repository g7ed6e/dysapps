import { useEffect, useState } from 'react';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, BLOCKS, ofBlock, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { currentPlan, nextFillable, planCellAt, planStatus, type PlanStatus } from './engine';
import { playDone, playNope, playPlace } from './sound';
import { islandOrigin, toIslandCell } from './world/terrain';
import { plansFor, type PlanDef } from './world/plans';

export interface Burst {
  seq: number;
  cell: { x: number; y: number; z: number };
  color: string;
}

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
  celebrate: (cell: { x: number; y: number; z: number }, color: string) => void;
  /** Pose le bloc attendu à une cellule du plan (coordonnées relatives à l'île). */
  fillAt: (x: number, y: number, z: number) => void;
  /** Pose le prochain bloc possible. */
  fillNext: () => void;
  /** Une case du monde touchée : pose si c'est une cellule du plan de cette île. Renvoie vrai si c'était le cas. */
  tryFill: (cell: { x: number; y: number; z: number }) => boolean;
}

/** Où gagner un type de bloc : le biome dont c'est la ressource. */
export function whereToEarn(block: BlockId): string {
  const biome = BIOMES.find((b) => b.block === block);
  return biome ? biome.name : 'le coffre du plan précédent (ou un coffre de régularité)';
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
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { x: 0, y: 0, z: 0 }, color: '#fff' });
  useEffect(() => setNotice(null), [island]);

  const plans = plansFor(island);
  const current = currentPlan(state, island);
  const plan = current?.plan ?? null;
  const status = plan ? planStatus(state, plan) : null;
  const sound = (f: () => void) => settings.sounds && f();

  const fillAt = (x: number, y: number, z: number) => {
    if (!plan) return;
    const r = fillPlan(plan, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc ${ofBlock(r.block)} : va dans ${whereToEarn(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc du plan est déjà posé.');
      sound(playNope);
      return;
    }
    const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === island));
    setBurst((b) => ({ seq: b.seq + 1, cell: { x: ox + x, y: oy + y, z: oz + z + 1 }, color: BLOCKS[r.block].top }));
    if (r.completed) {
      const chest = Object.entries(plan.reward.chest)
        .map(([b, n]) => `${n} ${BLOCKS[b as BlockId].name.toLowerCase()}`)
        .join(', ');
      const msg = `${plan.name} : terminé ! ${plan.done} Coffre : ${chest}. +${plan.reward.xp} XP.`;
      setNotice(msg);
      completePlan(plan.reward.xp);
      sound(playDone);
      if (settings.autoRead) speak(msg);
    } else {
      setNotice(`Bloc posé : ${status ? status.done + 1 : 1} sur ${status?.total ?? '?'}.`);
      sound(playPlace);
    }
  };
  const fillNext = () => {
    if (!plan) return;
    const next = nextFillable(state, plan);
    if (next) fillAt(next.x, next.y, next.z);
  };
  const tryFill = (cell: { x: number; y: number; z: number }) => {
    if (!plan) return false;
    const c = toIslandCell(island, cell.x, cell.y, cell.z);
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
    tryFill,
  };
}
