// Format d'un exercice Blocland : un objet JSON chargé statiquement (pas de serveur).
import type { BiomeId, BlockId } from '../biomes';

export interface ExerciseItem {
  /** Identifiant stable de l'item (répétition espacée). */
  key: string;
  [field: string]: unknown;
}

export interface ExerciseDef {
  id: string;
  biome: BiomeId;
  /** Type d'exercice (qcm, chasse-son, filon…) : détermine le composant qui l'affiche. */
  type: string;
  level: number;
  /** Consigne unique, courte, lue à voix haute au démarrage. */
  instruction: string;
  target?: string;
  items: ExerciseItem[];
  feedback: {
    correct: string;
    /** Peut contenir {word}, {heard}, {answer}. */
    wrong: string;
  };
  reward: { block: BlockId; amount: number; xp: number };
  adaptive: { promoteAt: number; demoteAt: number };
}

/** Résultat d'un item joué. */
export interface ItemResult {
  key: string;
  correct: boolean;
  /** 1 = trouvé du premier coup. */
  attempts: number;
  usedHelp: boolean;
}

/** Remplace {word}, {heard}… par leurs valeurs. */
export function fillTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}
