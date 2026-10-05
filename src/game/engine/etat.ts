// L'état d'une partie de Blocland (ce que la sauvegarde garde) et la partie neuve.
import { GAME_VERSION } from '../../core/migration';
import type { BiomeId, BlockId } from '../biomes';
import type { TirageAssemblage } from '../world/assemblage';

export interface ExerciseProgress {
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  /** Meilleur score, entre 0 et 1. */
  best: number;
}

export interface SpacedItem {
  itemId: string;
  /** Date ISO (AAAA-MM-JJ) à partir de laquelle l'item est à revoir. */
  due: string;
  /** Étape dans les intervalles J+1, J+3, J+7, J+15. */
  stage: number;
  /** Réussites d'affilée depuis le dernier échec. */
  streak: number;
}

export interface Streak {
  current: number;
  lastDay: string | null;
  /** Un jour manqué fissure le streak ; on le répare en jouant le lendemain. */
  cracked: boolean;
}

export interface TypeStats {
  level: number;
  /** Scores des dernières sessions à ce niveau. */
  recent: number[];
}

export interface GameState {
  /** Le format de la partie (src/core/migration.ts) : 2 depuis les mots neutres. */
  version: typeof GAME_VERSION;
  progress: Record<string, ExerciseProgress>;
  spaced: SpacedItem[];
  stock: Partial<Record<BlockId, number>>;
  streak: Streak;
  types: Record<string, TypeStats>;
  /** Nombre de coffres de régularité gagnés. */
  chests: number;
  /** Temps de lecture (secondes) par texte d'Ascension, du plus ancien au plus récent. */
  fluency: Record<string, number[]>;
  /** Le monde : les parties posées, les liaisons construites, le lieu où se tient le personnage. */
  world: World;
  /**
   * Le tirage des questions des blocs assemblés (GD-2), par bloc : l'ordre propre à l'élève, les dernières posées, les
   * manquées. Absent tant qu'aucune question n'a reçu de réponse.
   */
  assemblyDraw?: Partial<Record<BlockId, TirageAssemblage>>;
}

export interface World {
  /** Cellules déjà posées de chaque plan (clés « x,y,z » relatives à l'île). */
  parts: Record<string, string[]>;
  /** Journal de construction : un bâtiment terminé par ligne, du plus ancien au plus récent. */
  log: LogEntry[];
  /** Les ponts construits (identifiants de `world/archipelago.ts`) : ils ouvrent les îles. */
  links: string[];
  /** L'île où se tient le bonhomme (la dernière île ouverte visitée) ; la Forêt au début. */
  place?: BiomeId;
  /**
   * Les commandes des habitants arrivées et pas encore livrées (GD-7, PR 3 : world/commandes.ts), dans l'ordre
   * d'arrivée, la plus ancienne en tête. Absent tant qu'aucune n'est arrivée, et dans une sauvegarde d'avant les
   * commandes. Une commande livrée en sort : sa petite construction est alors dans `parts`.
   */
  requests?: string[];
}

export interface LogEntry {
  day: string;
  part: string;
}

export const EMPTY_STATE: GameState = {
  version: GAME_VERSION,
  progress: {},
  spaced: [],
  stock: {},
  streak: { current: 0, lastDay: null, cracked: false },
  types: {},
  chests: 0,
  fluency: {},
  world: { parts: {}, log: [], links: [] },
};
