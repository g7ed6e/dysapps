import { useEffect, useState } from 'react';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, ofBlock, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { canLaunch, nextFillable, planCellAt, planStatus, type LaunchResult, type PlanStatus } from './engine';
import { playDone, playNope, playPlace } from './sound';
import { voyageId } from './world/archipelago';
import { VEHICLE_STAGES, kitReady, stageAt, type VehicleStage } from './world/vehicle';
import { placeAll, type Burst } from './usePlanBuilder';
import { allerChercher } from './world/uses';
import { useHaptics } from '../core/haptics';

export interface VehicleBuilder {
  /** Le chantier de ce port : l'étape du Bloc-Navire qui s'y construit, ou `null` (pas un port, ou navire déjà parti d'ici). */
  stage: VehicleStage | null;
  status: PlanStatus | null;
  /** Peut-on embarquer, et sinon pourquoi. */
  launch: LaunchResult | null;
  /** Le kit (voile, ballon, feux) est arrivé : assez de Gardiens vaincus. */
  kit: boolean;
  canFill: boolean;
  notice: string | null;
  burst: Burst;
  fillNext: () => void;
  /** Pose d'un coup toutes les cases que l'inventaire permet. */
  fillAll: () => void;
  /** Une case touchée, en cases du plan de l'île `ile` : pose si c'est une case du navire à construire ici. */
  tryFill: (ile: BiomeId, cell: { x: number; y: number; z: number }) => boolean;
}

/**
 * Le chantier du Bloc-Navire sur une île-port : l'étape en cours, la pose d'un bloc (bouton ou case bleue touchée), les
 * sons et les éclats. Même mécanique que les plans des îles ; le coffre de l'étape arrive avec sa dernière case, l'XP
 * avec le voyage.
 */
export function useVehicleBuilder(island: BiomeId): VehicleBuilder {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const [notice, setNotice] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { ile: island, local: { x: 0, y: 0, z: 0 } }, color: '#fff' });
  useEffect(() => setNotice(null), [island]);

  const here = stageAt(island);
  const previousDone = here ? here.stage === 1 || state.village.bridges.includes(voyageId(VEHICLE_STAGES[here.stage - 2].to)) : false;
  const stage = here && previousDone && !state.village.bridges.includes(voyageId(here.to)) ? here : null;
  const status = stage ? planStatus(state, stage) : null;
  const launch = stage ? canLaunch(state, stage) : null;
  const kit = stage ? kitReady(stage, state.progress) : false;
  const sound = (f: () => void) => settings.sounds && f();
  const haptics = useHaptics();

  const fillAt = (x: number, y: number, z: number) => {
    if (!stage) return;
    const r = fillPlan(stage, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc ${ofBlock(r.block)} : ${allerChercher(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc du Bloc-Navire est déjà posé.');
      sound(playNope);
      return;
    }
    burstAt(x, y, z, r.block);
    if (r.completed) finished(stage);
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
  const finished = (done: VehicleStage) => {
    const msg = kit
      ? `Le Bloc-Navire a tous ses blocs ! ${done.done}`
      : `Le Bloc-Navire a tous ses blocs ! Il attend encore ${done.guardians} Gardien${done.guardians > 1 ? 's' : ''} vaincu${done.guardians > 1 ? 's' : ''} pour ${done.short}.`;
    setNotice(msg);
    sound(playDone);
    if (settings.autoRead) speak(msg);
  };
  const fillAll = () => {
    if (!stage) return;
    const { placed, last, completed } = placeAll(stage, state.village.plans[stage.id] ?? [], fillPlan);
    if (!last) return;
    burstAt(last.x, last.y, last.z, last.block);
    if (completed) return finished(stage);
    setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''} sur le Bloc-Navire.`);
    sound(playPlace);
    haptics.place();
  };
  const fillNext = () => {
    if (!stage) return;
    const next = nextFillable(state, stage);
    if (next) fillAt(next.x, next.y, next.z);
  };
  const tryFill = (ile: BiomeId, c: { x: number; y: number; z: number }) => {
    if (!stage || ile !== island) return false;
    if (!planCellAt(stage, c.x, c.y, c.z)) return false;
    fillAt(c.x, c.y, c.z);
    return true;
  };

  return {
    stage,
    status,
    launch,
    kit,
    canFill: Boolean(stage && status && !status.complete && nextFillable(state, stage) !== null),
    notice,
    burst,
    fillNext,
    fillAll,
    tryFill,
  };
}
