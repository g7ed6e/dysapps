// L'état d'une île sur la Carte, en quatre mots, déduit de la sauvegarde à chaque rendu et jamais enregistré : Fermée
// (aucun chemin d'ouvrages n'y mène), À explorer (ouverte, aucune mission jouée), En chantier, Restaurée (ses trois
// plans terminés ; « Bâtie » dans Blocland). Chaque état a son icône et son mot : il ne se lit jamais à la seule couleur (DP-08).
import type { BiomeId } from '../biomes';
import type { BloclandState } from '../engine';
import { CATALOG } from '../exercises';
import type { AnyIconName } from '../../components/Icon';
import { isBiomeUnlocked } from './archipelago';
import { isPlanDone, plansFor } from './plans';

export type IslandStateId = 'fermee' | 'a-explorer' | 'en-chantier' | 'restauree';

/** Un état d'île et son icône ; son mot est un texte d'univers (`etatsDIle`, src/univers/, U4). */
export interface IslandStateDef {
  id: IslandStateId;
  icon: AnyIconName;
}

export const ISLAND_STATES: Record<IslandStateId, IslandStateDef> = {
  fermee: { id: 'fermee', icon: 'lock' },
  'a-explorer': { id: 'a-explorer', icon: 'compass' },
  'en-chantier': { id: 'en-chantier', icon: 'hammer' },
  restauree: { id: 'restauree', icon: 'check' },
};

/** Aucune mission de l'île n'a encore été jouée. */
export function isUnexplored(state: Pick<BloclandState, 'progress'>, island: BiomeId): boolean {
  return !CATALOG.some((e) => e.biome === island && state.progress[e.id] !== undefined);
}

export function islandState(state: Pick<BloclandState, 'progress' | 'village'>, island: BiomeId): IslandStateDef {
  if (!isBiomeUnlocked(island, state.village.bridges)) return ISLAND_STATES.fermee;
  const plans = plansFor(island);
  if (plans.length > 0 && plans.every((p) => isPlanDone(p, state.village.plans))) return ISLAND_STATES.restauree;
  if (isUnexplored(state, island)) return ISLAND_STATES['a-explorer'];
  return ISLAND_STATES['en-chantier'];
}
