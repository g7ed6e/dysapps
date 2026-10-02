// La prochaine destination de l'élève dans son archipel : une île, une phrase et une jauge, pour « Reprendre
// l'aventure » au menu et la Carte. Code pur, déduit de la sauvegarde à chaque rendu, sans rien y ajouter.
import { getBiome, type BiomeId } from '../biomes';
import { canLaunch, type GameState } from '../engine';
import { archipelagoOf, islandsOf, reachableIslands, type MotsDesGardiens, type NomsArchipels } from './archipelago';
import { nextGoalInfo } from './goals';
import { isUnexplored } from './islandState';
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

/**
 * La prochaine destination, dans l'archipel où se tient le bonhomme. Ordre : le Bloc-Navire prêt à partir (le port) ;
 * une île où tout est prêt (poser un plan, construire un ouvrage), la sienne d'abord ; une île ouverte pas encore
 * explorée ; sinon l'objectif qui demande le moins de blocs. Rien à faire : le port, avec ce qu'il faut pour que le
 * village avance. `noms` : les noms des archipels de l'univers affiché ; `mots` : ses mots pour les Gardiens.
 */
export function nextDestination(state: GameState, noms: NomsArchipels, mots: MotsDesGardiens): Destination {
  const at = state.world.place ?? 'french-6e-phonology';
  const archipelago = archipelagoOf(at);
  const open = reachableIslands(state.world.links);
  const islands = islandsOf(archipelago.classe)
    .map((b) => b.id)
    .filter((id) => open.has(id));
  const ordered = [at, ...islands.filter((id) => id !== at)].filter((id) => open.has(id));
  const make = (island: BiomeId, text: string, have = 0, need = 0): Destination => ({ island, name: getBiome(island)?.name ?? island, text, have, need });

  const port = archipelago.port;
  const stage = stageAt(port);
  if (stage && open.has(port) && canLaunch(state, stage).ok) {
    const goal = nextGoalInfo(state, port, noms, mots);
    return make(port, goal?.text ?? 'Le Bloc-Navire est prêt.', 1, 1);
  }
  const goals = ordered.map((island) => ({ island, goal: nextGoalInfo(state, island, noms, mots) }));
  const ready = goals.find(({ goal }) => goal && goal.need > 0 && goal.have >= goal.need);
  if (ready?.goal) return make(ready.island, ready.goal.text, ready.goal.have, ready.goal.need);
  const fresh = ordered.find((island) => isUnexplored(state, island));
  if (fresh) return make(fresh, 'Une île à explorer : ses missions t’attendent.');
  const counted = goals.filter((g): g is { island: BiomeId; goal: NonNullable<typeof g.goal> } => g.goal !== null);
  if (counted.length) {
    const closest = counted.reduce((a, b) => (b.goal.need - b.goal.have < a.goal.need - a.goal.have ? b : a));
    return make(closest.island, closest.goal.text, closest.goal.have, closest.goal.need);
  }
  const village = villageStage(state.world, archipelago.classe, noms);
  return make(port, village.next ?? 'Le village est complet : reviens réviser quand tu veux.');
}
