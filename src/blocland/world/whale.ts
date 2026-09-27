// Le mot de la baleine (Archipéo, lot 5) : la voix de l'univers, rare, aux grandes étapes d'un archipel seulement.
// Code pur : quelles étapes sont atteintes, déduites de la sauvegarde à chaque rendu. Ce qui a déjà été dit se note
// par appareil (voir useWhaleWord), jamais dans la sauvegarde. Les créatures restent les voix de leur île.
import { getBiome, type BiomeId } from '../biomes';
import type { BloclandState } from '../engine';
import { ARRIVAL_STEPS } from '../arrivals';
import { BRIDGES, getArchipelago, islandsOf, isArchipelagoReached, reachableIslands, type ArchipelagoId } from './archipelago';
import { isPlanDone, plansFor } from './plans';
import { beatenGuardians } from './vehicle';

export type WhaleMomentKind = 'arrivee' | 'gardiens' | 'port' | 'ouvrage';

export interface WhaleMoment {
  /** Ce qui se note « déjà dit » ; l'arrivée garde la clé de l'ancienne bulle d'accueil (`archipel-5e`…). */
  id: string;
  kind: WhaleMomentKind;
  archipelago: ArchipelagoId;
  /** L'île concernée : la caméra la cadre, la baleine passe au large. */
  island: BiomeId;
  /** Une page, deux pour l'arrivée (la phrase de la baleine, puis la bulle pratique sur le navire). */
  pages: string[];
}

/** Les premières phrases, à l'arrivée dans un archipel (la seconde page reprend la bulle pratique d'avant). */
const ARRIVAL: Record<ArchipelagoId, string> = {
  '6e': 'Je suis la baleine. Je passe au large quand tu fais quelque chose de grand.',
  '5e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles Brumeuses : six îles, et les mêmes règles.',
  '4e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Anciens Ateliers : les vieux ateliers attendent qu’on les remette en marche.',
  '3e': 'Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles du Ciel : ici, les îles flottent dans les nuages.',
};

const nameOf = (island: BiomeId) => getBiome(island)?.name ?? island;

/**
 * Les grandes étapes atteintes dans un archipel, de la plus grande à la plus petite : l'arrivée (en 6e, la baleine se
 * présente), le dernier Gardien vaincu, l'île-port restaurée, le premier ouvrage payé par l'élève.
 */
export function reachedWhaleMoments(state: Pick<BloclandState, 'progress' | 'village'>, a: ArchipelagoId): WhaleMoment[] {
  const { port, name } = getArchipelago(a);
  const bridges = state.village.bridges;
  const out: WhaleMoment[] = [];
  if (!isArchipelagoReached(a, bridges)) return out;
  const arrival = ARRIVAL_STEPS[a];
  out.push({
    id: a === '6e' ? 'baleine-6e-arrivee' : `archipel-${a}`,
    kind: 'arrivee',
    archipelago: a,
    island: port,
    pages: [ARRIVAL[a], ...arrival.slice(1)],
  });
  const islands = islandsOf(a);
  if (beatenGuardians(a, state.progress) === islands.length) {
    out.push({ id: `baleine-${a}-gardiens`, kind: 'gardiens', archipelago: a, island: port, pages: [`Tous les Gardiens des ${name} ont reconnu ton savoir. Je l’ai vu depuis le large.`] });
  }
  const portPlans = plansFor(port);
  if (portPlans.length > 0 && portPlans.every((p) => isPlanDone(p, state.village.plans))) {
    out.push({ id: `baleine-${a}-port`, kind: 'port', archipelago: a, island: port, pages: [`${nameOf(port)} est restaurée. Tu avances bien : chaque île restaurée rend l’archipel plus beau.`] });
  }
  // Le premier ouvrage payé par l'élève (le pont gratuit de la Forêt à la Plaine ne compte pas), dans l'ordre où il a
  // été construit ; l'île qu'il a ouverte est celle qu'on n'atteint plus sans lui.
  const ids = new Set(islands.map((b) => b.id));
  const first = bridges.map((id) => BRIDGES.find((b) => b.id === id)).find((b) => b && b.cost > 0 && ids.has(b.from));
  if (first) {
    const without = reachableIslands(bridges.filter((id) => id !== first.id));
    const opened = without.has(first.to) ? first.from : first.to;
    out.push({ id: `baleine-${a}-ouvrage`, kind: 'ouvrage', archipelago: a, island: opened, pages: [`Un chemin s’ouvre vers ${nameOf(opened)}. L’archipel s’agrandit.`] });
  }
  return out;
}
