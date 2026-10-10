import { useEffect, useState } from 'react';
import { useSettings } from '../core/SettingsContext';
import { useTextes } from '../universes';
import { BLOCKS, blockCount, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { canLaunch, nextFillable, planCellAt, planStatus, type LaunchResult, type PlanStatus } from './engine';
import { playDone, playNope, sonDePose } from './sound';
import { habillageDuMonde } from './skin';
import { voyageId } from './world/archipelago';
import { VEHICLE_STAGES, kitReady, stageAt, type VehicleStage } from './world/vehicle';
import { METAMORPHOSIS_MS } from './world/metamorphosis';
import { moinsDAnimations } from '../core/motion';
import { renduDuMonde } from './rendering';
import { placeAll, type Burst } from './cellByCellPose';
import { allerChercher } from './world/uses';
import { useHaptics } from '../core/haptics';
import { decalageDuQuai } from './world/terrain';

export interface VehicleBuilder {
  /** Le chantier de ce port : l'étape de la Nef qui s'y construit, ou `null` (pas un port, ou navire déjà parti d'ici). */
  stage: VehicleStage | null;
  status: PlanStatus | null;
  /** Peut-on embarquer, et sinon pourquoi. */
  launch: LaunchResult | null;
  /** Le kit (la voile, le haut de l'enveloppe, les ailerons) est arrivé : assez de Gardiens rallumés. */
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
 * Le chantier de la Nef sur une île-port : l'étape en cours, la pose d'un bloc (bouton ou case bleue touchée), les
 * sons et les éclats. Même mécanique que les plans des îles ; le coffre de l'étape arrive avec sa dernière case, l'XP
 * avec le voyage.
 */
export function useVehicleBuilder(island: BiomeId): VehicleBuilder {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const [notice, setNotice] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: { ile: island, local: { x: 0, y: 0, z: 0 } }, color: '#fff' });
  useEffect(() => setNotice(null), [island]);

  const here = stageAt(island);
  const previousDone = here ? here.stage === 1 || state.world.links.includes(voyageId(VEHICLE_STAGES[here.stage - 2].to)) : false;
  const stage = here && previousDone && !state.world.links.includes(voyageId(here.to)) ? here : null;
  const status = stage ? planStatus(state, stage) : null;
  const launch = stage ? canLaunch(state, stage) : null;
  const kit = stage ? kitReady(stage, state.progress) : false;
  const sound = (f: () => void) => settings.sounds && f();
  // Le son de pose de l'univers (le « clac » de Blocland, le « toc » d'Archipéo), lu une fois.
  const [playPlace] = useState(() => sonDePose(habillageDuMonde().pose));
  const haptics = useHaptics();

  const fillAt = (x: number, y: number, z: number) => {
    if (!stage) return;
    const r = fillPlan(stage, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut ${blockCount(r.block, 1)} : ${allerChercher(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc de la Nef est déjà posé.');
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
    // La clé (x, y, z) d'une case du navire est dessinée au quai : dans le repère de l'île, le cube (x, y, z + 1) décalé
    // de `decalageDuQuai` (nul tant que le quai n'a pas bougé).
    const d = stage ? decalageDuQuai(stage) : { x: 0, y: 0, z: 0 };
    setBurst((b) => ({ seq: b.seq + 1, cell: { ile: island, local: { x: x + d.x, y: y + d.y, z: z + d.z + 1 } }, color: BLOCKS[block].top }));
  };
  const finished = (done: VehicleStage) => {
    const msg = kit
      ? done.fin(textes.archipels[done.to])
      : textes.libelles.navireAttend(done.guardians, done.short);
    setNotice(msg);
    sound(playDone);
    // La voix attend la fin de la mue de la Nef (GD-15, référent dys) : dans Blocland, quand l'appareil ne demande pas
    // moins d'animations ; la mue se joue alors 3 s au plus.
    const mue = kit && renduDuMonde() !== 'archipeo' && !moinsDAnimations();
    if (settings.autoRead) window.setTimeout(() => speak(msg), mue ? METAMORPHOSIS_MS : 0);
  };
  const fillAll = () => {
    if (!stage) return;
    const { placed, last, completed } = placeAll(stage, state.world.parts[stage.id] ?? [], fillPlan);
    if (!last) return;
    burstAt(last.x, last.y, last.z, last.block);
    if (completed) return finished(stage);
    setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''} sur la Nef.`);
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
    // La case touchée est dans le repère de l'île ; la clé de la case du navire s'en déduit (`decalageDuQuai`).
    const d = decalageDuQuai(stage);
    const k = { x: c.x - d.x, y: c.y - d.y, z: c.z - d.z };
    if (!planCellAt(stage, k.x, k.y, k.z)) return false;
    fillAt(k.x, k.y, k.z);
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
