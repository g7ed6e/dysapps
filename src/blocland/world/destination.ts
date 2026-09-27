// La prochaine destination de l'élève dans son archipel : une île, une phrase et une jauge, pour « Reprendre
// l'aventure » au menu et la Carte. Code pur, déduit de la sauvegarde à chaque rendu, sans rien y ajouter.
import { getBiome, type BiomeId } from '../biomes';
import { canLaunch, type BloclandState } from '../engine';
import { CATALOG } from '../exercises';
import { archipelagoOf, islandsOf, reachableIslands } from './archipelago';
import { nextGoalInfo } from './goals';
import { villageStage } from './villageStage';
import { stageAt } from './vehicle';

export interface Destination {
  island: BiomeId;
  /** Le nom de l'île. */
  name: string;
  /** Ce qu'il y a à y faire, en une phrase qui se termine par un point. */
  text: string;
  /** La jauge (0 sur 0 quand rien ne se compte). */
  have: number;
  need: number;
}

/** Aucune mission de l'île n'a encore été jouée. */
function unexplored(state: BloclandState, island: BiomeId): boolean {
  return !CATALOG.some((e) => e.biome === island && state.progress[e.id] !== undefined);
}

/**
 * La prochaine destination, dans l'archipel où se tient le bonhomme. Ordre : le Bloc-Navire prêt à partir (le port) ;
 * une île où tout est prêt (poser un plan, construire un ouvrage), la sienne d'abord ; une île ouverte pas encore
 * explorée ; sinon l'objectif qui demande le moins de blocs. Rien à faire : le port, avec ce qu'il faut pour que le
 * village avance.
 */
export function nextDestination(state: BloclandState): Destination {
  const at = state.village.at ?? 'foret';
  const archipelago = archipelagoOf(at);
  const open = reachableIslands(state.village.bridges);
  const islands = islandsOf(archipelago.classe)
    .map((b) => b.id)
    .filter((id) => open.has(id));
  const ordered = [at, ...islands.filter((id) => id !== at)].filter((id) => open.has(id));
  const make = (island: BiomeId, text: string, have = 0, need = 0): Destination => ({ island, name: getBiome(island)?.name ?? island, text, have, need });

  const port = archipelago.port;
  const stage = stageAt(port);
  if (stage && open.has(port) && canLaunch(state, stage).ok) {
    const goal = nextGoalInfo(state, port);
    return make(port, goal?.text ?? 'Le Bloc-Navire est prêt.', 1, 1);
  }
  const goals = ordered.map((island) => ({ island, goal: nextGoalInfo(state, island) }));
  const ready = goals.find(({ goal }) => goal && goal.need > 0 && goal.have >= goal.need);
  if (ready?.goal) return make(ready.island, ready.goal.text, ready.goal.have, ready.goal.need);
  const fresh = ordered.find((island) => unexplored(state, island));
  if (fresh) return make(fresh, 'Une île à explorer : ses missions t’attendent.');
  const counted = goals.filter((g): g is { island: BiomeId; goal: NonNullable<typeof g.goal> } => g.goal !== null);
  if (counted.length) {
    const closest = counted.reduce((a, b) => (b.goal.need - b.goal.have < a.goal.need - a.goal.have ? b : a));
    return make(closest.island, closest.goal.text, closest.goal.have, closest.goal.need);
  }
  const village = villageStage(state.village, archipelago.classe);
  return make(port, village.next ?? 'Le village est complet : reviens réviser quand tu veux.');
}
