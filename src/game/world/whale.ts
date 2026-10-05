// Le mot de la baleine (Archipéo, lot 5) : la voix de l'univers, rare, aux grandes étapes d'un archipel seulement.
// Code pur : quelles étapes sont atteintes, déduites de la sauvegarde à chaque rendu. Ce qui a déjà été dit se note
// par appareil (voir useWhaleWord), jamais dans la sauvegarde. Les créatures restent les voix de leur île. Ce que dit
// la baleine est un texte d'univers : src/univers/baleine.ts.
import type { BiomeId } from '../biomes';
import type { GameState } from '../engine';
import { BRIDGES, getArchipelago, islandsOf, isArchipelagoReached, reachableIslands, type ArchipelagoId } from './archipelago';
import { isPlanDone, plansFor } from './plans';
import { beatenGuardians } from './vehicle';

type WhaleMomentKind = 'arrivee' | 'gardiens' | 'port' | 'ouvrage';

export interface WhaleMoment {
  /** Ce qui se note « déjà dit » ; l'arrivée garde la clé de l'ancienne bulle d'accueil (`archipel-5e`…). */
  id: string;
  kind: WhaleMomentKind;
  archipelago: ArchipelagoId;
  /** L'île concernée : la caméra la cadre, la baleine passe au large. */
  island: BiomeId;
}

/**
 * Les grandes étapes atteintes dans un archipel, de la plus grande à la plus petite : l'arrivée (en 6e, la baleine se
 * présente), le dernier Gardien vaincu, l'île-port restaurée, le premier ouvrage payé par l'élève.
 */
export function reachedWhaleMoments(state: Pick<GameState, 'progress' | 'world'>, a: ArchipelagoId): WhaleMoment[] {
  const { port } = getArchipelago(a);
  const bridges = state.world.links;
  const out: WhaleMoment[] = [];
  if (!isArchipelagoReached(a, bridges)) return out;
  out.push({ id: a === '6e' ? 'baleine-6e-arrivee' : `archipel-${a}`, kind: 'arrivee', archipelago: a, island: port });
  const islands = islandsOf(a);
  if (beatenGuardians(a, state.progress) === islands.length) {
    out.push({ id: `baleine-${a}-gardiens`, kind: 'gardiens', archipelago: a, island: port });
  }
  const portPlans = plansFor(port);
  if (portPlans.length > 0 && portPlans.every((p) => isPlanDone(p, state.world.parts))) {
    out.push({ id: `baleine-${a}-port`, kind: 'port', archipelago: a, island: port });
  }
  // Le premier ouvrage payé par l'élève (le pont gratuit de la Forêt à la Plaine ne compte pas), dans l'ordre où il a
  // été construit ; l'île qu'il a ouverte est celle qu'on n'atteint plus sans lui.
  const ids = new Set(islands.map((b) => b.id));
  const first = bridges.map((id) => BRIDGES.find((b) => b.id === id)).find((b) => b && b.cost > 0 && ids.has(b.from));
  if (first) {
    const without = reachableIslands(bridges.filter((id) => id !== first.id));
    const opened = without.has(first.to) ? first.from : first.to;
    out.push({ id: `baleine-${a}-ouvrage`, kind: 'ouvrage', archipelago: a, island: opened });
  }
  return out;
}
