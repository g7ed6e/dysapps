import { useEffect, useState } from 'react';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { useHaptics } from '../core/haptics';
import { BLOCKS, ofBlock, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { nextFillable, planStatus, type PlanStatus } from './engine';
import { playDone, playNope, playPlace } from './sound';
import { placeAll, whereToEarn, type Burst } from './usePlanBuilder';
import type { MonumentDef } from './world/monuments';
import { monumentAnchor, origineDe } from './world/terrain';

export interface MonumentBuilder {
  monument: MonumentDef;
  status: PlanStatus;
  canFill: boolean;
  /** Dernier message (refus, blocs posés, monument terminé). */
  notice: string | null;
  /** Éclats à dessiner dans le monde. */
  burst: Burst;
  fillNext: () => void;
  fillAll: () => void;
}

/**
 * La construction d'un monument : comme un plan d'île (le bloc suivant, ou tout ce que l'inventaire permet), sans coffre ;
 * terminé, il rapporte son XP et compte pour le succès « Patrimoine ».
 */
export function useMonumentBuilder(monument: MonumentDef): MonumentBuilder {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const { completeMonument } = useProgress();
  const haptics = useHaptics();
  const [notice, setNotice] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { ile: monument.biome, local: { x: 0, y: 0, z: 0 } }, color: '#fff' });
  useEffect(() => setNotice(null), [monument.id]);
  const status = planStatus(state, monument);
  const sound = (f: () => void) => settings.sounds && f();

  const burstAt = (x: number, y: number, z: number, block: BlockId) => {
    // L'îlot du monument est au large de son île : la case, dans le repère de l'île.
    const o = monumentAnchor(monument);
    const ile = origineDe(monument.biome);
    setBurst((b) => ({ seq: b.seq + 1, cell: { ile: monument.biome, local: { x: o.x + x - ile.x, y: o.y + y - ile.y, z: o.z + z - ile.z } }, color: BLOCKS[block].top }));
  };
  const finished = () => {
    const msg = `${monument.name} : terminé ! ${monument.done} +${monument.reward.xp} XP.`;
    setNotice(msg);
    completeMonument(monument.reward.xp);
    sound(playDone);
    if (settings.autoRead) speak(msg);
  };
  const fillNext = () => {
    const next = nextFillable(state, monument);
    if (!next) return;
    const r = fillPlan(monument, next.x, next.y, next.z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc ${ofBlock(r.block)} : va dans ${whereToEarn(r.block)}.`);
      sound(playNope);
      return;
    }
    burstAt(next.x, next.y, next.z, r.block);
    if (r.completed) return finished();
    setNotice(`Bloc posé : ${status.done + 1} sur ${status.total}.`);
    sound(playPlace);
    haptics.place();
  };
  const fillAll = () => {
    const { placed, last, completed } = placeAll(monument, state.village.plans[monument.id] ?? [], fillPlan);
    if (!last) return;
    burstAt(last.x, last.y, last.z, last.block);
    if (completed) return finished();
    const left = status.total - status.done - placed;
    setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}. Il en reste ${left} à poser : gagne les blocs qui manquent.`);
    sound(playPlace);
    haptics.place();
  };

  return {
    monument,
    status,
    canFill: !status.complete && nextFillable(state, monument) !== null,
    notice,
    burst,
    fillNext,
    fillAll,
  };
}
