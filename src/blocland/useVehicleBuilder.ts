import { useEffect, useState } from 'react';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, BLOCKS, ofBlock, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { canLaunch, nextFillable, planCellAt, planStatus, type LaunchResult, type PlanStatus } from './engine';
import { playDone, playNope, playPlace } from './sound';
import { voyageId } from './world/archipelago';
import { VEHICLE_STAGES, kitReady, stageAt, type VehicleStage } from './world/vehicle';
import { islandOrigin, toIslandCell } from './world/terrain';
import { whereToEarn, type Burst } from './usePlanBuilder';

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
  /** Une case du monde touchée : pose si c'est une case du navire à construire ici. */
  tryFill: (cell: { x: number; y: number; z: number }) => boolean;
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
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { x: 0, y: 0, z: 0 }, color: '#fff' });
  useEffect(() => setNotice(null), [island]);

  const here = stageAt(island);
  const previousDone = here ? here.stage === 1 || state.village.bridges.includes(voyageId(VEHICLE_STAGES[here.stage - 2].to)) : false;
  const stage = here && previousDone && !state.village.bridges.includes(voyageId(here.to)) ? here : null;
  const status = stage ? planStatus(state, stage) : null;
  const launch = stage ? canLaunch(state, stage) : null;
  const kit = stage ? kitReady(stage, state.progress) : false;
  const sound = (f: () => void) => settings.sounds && f();

  const fillAt = (x: number, y: number, z: number) => {
    if (!stage) return;
    const r = fillPlan(stage, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc ${ofBlock(r.block)} : va dans ${whereToEarn(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc du Bloc-Navire est déjà posé.');
      sound(playNope);
      return;
    }
    const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === island));
    setBurst((b) => ({ seq: b.seq + 1, cell: { x: ox + x, y: oy + y, z: oz + z + 1 }, color: BLOCKS[r.block].top }));
    if (r.completed) {
      const msg = kit
        ? `Le Bloc-Navire a tous ses blocs ! ${stage.done}`
        : `Le Bloc-Navire a tous ses blocs ! Il attend encore ${stage.guardians} Gardien${stage.guardians > 1 ? 's' : ''} vaincu${stage.guardians > 1 ? 's' : ''} pour ${stage.short}.`;
      setNotice(msg);
      sound(playDone);
      if (settings.autoRead) speak(msg);
    } else {
      setNotice(`Bloc posé : ${status ? status.done + 1 : 1} sur ${status?.total ?? '?'}.`);
      sound(playPlace);
    }
  };
  const fillNext = () => {
    if (!stage) return;
    const next = nextFillable(state, stage);
    if (next) fillAt(next.x, next.y, next.z);
  };
  const tryFill = (cell: { x: number; y: number; z: number }) => {
    if (!stage) return false;
    const c = toIslandCell(island, cell.x, cell.y, cell.z);
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
    tryFill,
  };
}
