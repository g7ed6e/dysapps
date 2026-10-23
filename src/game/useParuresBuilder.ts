import { useState } from 'react';
import { useSettings } from '../core/SettingsContext';
import { useHaptics } from '../core/haptics';
import { useBlocland } from './BloclandContext';
import { planStatus, type PlanStatus } from './engine';
import { playDone, sonDePose } from './sound';
import { habillageDuMonde } from './skin';
import { NEF_COMPLETE, NEF_PARURES_PLAN, PARURE_POSED, paruresOpenCells } from './world/nefParures';

/** Le chantier des parures de l'aéronef du 3e (GD-25) : ce qui est posé, « Poser », et la phrase de la dernière pose. */
export interface ParuresBuilder {
  status: PlanStatus;
  /** Au moins une case de la parure en cours peut se poser avec l'inventaire. */
  canFill: boolean;
  notice: string | null;
  /** Pose d'un coup ce que l'inventaire permet de la parure en cours : jamais le pavois avant la figure de proue. */
  fillAll: () => void;
}

/**
 * Les parures se posent comme les temps de la Nef (GD-21) : le son de pose de l'univers, puis, à la dernière case d'une
 * parure, le son de fin et sa phrase (« La figure de proue est posée. »), dite par la voix avec la lecture automatique,
 * jamais en même temps qu'un autre son. `feux` : les feux sont arrivés (la fin du pavois dit alors la Nef complète).
 */
export function useParuresBuilder(feux: boolean): ParuresBuilder {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const haptics = useHaptics();
  const [notice, setNotice] = useState<string | null>(null);
  const [playPlace] = useState(() => sonDePose(habillageDuMonde().pose));
  const plan = NEF_PARURES_PLAN;
  const status = planStatus(state, plan);
  const open = paruresOpenCells(state.world.parts);
  const canFill = open.some((c) => (state.stock[c.block] ?? 0) > 0);
  const sound = (f: () => void) => settings.sounds && f();

  const fillAll = () => {
    // La parure en cours seulement : la pose de la figure de proue ne déborde jamais sur le pavois.
    const proue = open[0]?.z === 0;
    let placed = 0;
    for (const c of open) if (fillPlan(plan, c.x, c.y, c.z).ok) placed += 1;
    if (!placed) return;
    const finished = placed === open.length;
    if (!finished) {
      setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''} sur la Nef.`);
      sound(playPlace);
      haptics.place();
      return;
    }
    const msg = proue ? PARURE_POSED[0] : feux ? NEF_COMPLETE : PARURE_POSED[1];
    setNotice(msg);
    sound(playDone);
    if (settings.autoRead) speak(msg);
  };

  return { status, canFill, notice, fillAll };
}
