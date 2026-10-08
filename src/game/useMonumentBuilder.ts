import { useEffect, useState } from 'react';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { useHaptics } from '../core/haptics';
import { BLOCKS, blockCount, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { nextFillable, planStatus, type PlanStatus } from './engine';
import { playDone, playNope, sonDePose } from './sound';
import { habillageDuMonde } from './skin';
import { placeAll, type Burst } from './cellByCellPose';
import { allerChercher } from './world/uses';
import type { MonumentDef } from './world/monuments';
import type { PlanDef } from './world/plans';
import type { JoinDef } from './world/join';
import type { Point } from './world/layout';
import { monumentAnchor, origineDe } from './world/terrain';
import { islandDef, toPlace } from './world/map';
import { texteDuMonument, useTextes } from '../universes';

/** Le chantier d'une grande construction (un monument, la construction qui réunit deux lieux), case par case. */
export interface BigBuilder<P extends PlanDef = PlanDef> {
  plan: P;
  status: PlanStatus;
  canFill: boolean;
  /** Dernier message (refus, blocs posés, construction terminée). */
  notice: string | null;
  /** Éclats à dessiner dans le monde. */
  burst: Burst;
  fillNext: () => void;
  fillAll: () => void;
}

export interface MonumentBuilder extends BigBuilder<MonumentDef> {
  monument: MonumentDef;
}

interface Options {
  /** Son nom, dans la phrase de fin. */
  nom: string;
  /** Ce que dit la fin. */
  fin: string;
  /** Le lieu et le point du monde (une case dans le repère du lieu) d'une case du plan, pour ses éclats. */
  ancre: (x: number, y: number, z: number) => { ile: BiomeId; local: Point };
  /** Terminée : son XP (et, pour un monument, son succès). */
  terminer: (xp: number) => void;
}

/** Une grande construction : le bloc suivant, ou tout ce que l'inventaire permet, sans coffre ; terminée, son XP. */
function useBigBuilder<P extends PlanDef>(plan: P, { nom, fin, ancre, terminer }: Options): BigBuilder<P> {
  const { state, fillPlan } = useBlocland();
  const { settings, speak } = useSettings();
  const haptics = useHaptics();
  const [notice, setNotice] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst>({ seq: 0, cell: ancre(0, 0, 0), color: '#fff' });
  useEffect(() => setNotice(null), [plan.id]);
  const status = planStatus(state, plan);
  const sound = (f: () => void) => settings.sounds && f();
  // Le son de pose de l'univers (le « clac » de Blocland, le « toc » d'Archipéo), lu une fois.
  const [playPlace] = useState(() => sonDePose(habillageDuMonde().pose));

  const burstAt = (x: number, y: number, z: number, block: BlockId) => setBurst((b) => ({ seq: b.seq + 1, cell: ancre(x, y, z), color: BLOCKS[block].top }));
  const finished = () => {
    const msg = `${nom} : terminé ! ${fin} +${plan.reward.xp} XP.`;
    setNotice(msg);
    terminer(plan.reward.xp);
    sound(playDone);
    if (settings.autoRead) speak(msg);
  };
  const fillNext = () => {
    const next = nextFillable(state, plan);
    if (!next) return;
    const r = fillPlan(plan, next.x, next.y, next.z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut ${blockCount(r.block, 1)} : ${allerChercher(r.block)}.`);
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
    const { placed, last, completed } = placeAll(plan, state.world.parts[plan.id] ?? [], fillPlan);
    if (!last) return;
    burstAt(last.x, last.y, last.z, last.block);
    if (completed) return finished();
    const left = status.total - status.done - placed;
    setNotice(`${placed} bloc${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}. Il en reste ${left} à poser : gagne les blocs qui manquent.`);
    sound(playPlace);
    haptics.place();
  };

  return {
    plan,
    status,
    canFill: !status.complete && nextFillable(state, plan) !== null,
    notice,
    burst,
    fillNext,
    fillAll,
  };
}

/**
 * La construction d'un monument : comme un plan d'île (le bloc suivant, ou tout ce que l'inventaire permet), sans coffre ;
 * terminé, il rapporte son XP et compte pour le succès « Patrimoine ».
 */
export function useMonumentBuilder(monument: MonumentDef): MonumentBuilder {
  const { completeMonument } = useProgress();
  const { done } = texteDuMonument(useTextes(), monument);
  const b = useBigBuilder(monument, {
    nom: monument.name,
    fin: done,
    // L'îlot du monument est au large de son île : la case, dans le repère de l'île.
    ancre: (x, y, z) => {
      const o = monumentAnchor(monument);
      const ile = origineDe(monument.biome);
      return { ile: monument.biome, local: { x: o.x + x - ile.x, y: o.y + y - ile.y, z: o.z + z - ile.z } };
    },
    terminer: completeMonument,
  });
  return { ...b, monument };
}

/**
 * La construction qui réunit deux lieux (GD-9, point 10) : comme un monument, case par case ; terminée, elle rapporte son
 * XP, sans succès. Son nom et sa phrase de fin viennent de l'univers (« La digue », « La jetée »).
 */
export function useJoinBuilder(join: JoinDef, shape: { cells: readonly { u: number; j: number; k: number; x: number; y: number; z: number }[] } | null): BigBuilder<JoinDef> {
  const { completeJoin } = useProgress();
  const textes = useTextes();
  return useBigBuilder(join, {
    nom: textes.reunion?.nom ?? join.name,
    fin: textes.reunion?.fini ?? join.done,
    // La case dans le monde (la forme de la paire), dans le repère du premier lieu.
    ancre: (x, y, z) => {
      const c = shape?.cells.find((k) => k.u === x && k.j === y && k.k === z);
      const ile = origineDe(join.pair[0]);
      const l = c ? toPlace(islandDef(join.pair[0]), c.x, c.y) : { x: 0, y: 0 };
      return { ile: join.pair[0], local: { x: l.x, y: l.y, z: c ? c.z - ile.z : 0 } };
    },
    terminer: completeJoin,
  });
}
