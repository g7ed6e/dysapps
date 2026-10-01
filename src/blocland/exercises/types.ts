// Format d'un exercice Blocland : un objet JSON chargé statiquement (pas de serveur).
import type { BiomeId, BlockId } from '../biomes';
import type { Lang } from '../../core/speech';

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
  /**
   * Langue du contenu travaillé : `en` pour l'anglais (prompt, spoken, word, sentence et choices affichés et lus en
   * anglais). La consigne, l'indice, l'explication et l'aide restent en français. Un item peut dire
   * `choicesLang: 'fr'` quand ses réponses sont en français (traduire un mot anglais).
   */
  lang?: Lang;
  /**
   * Précision facultative par exercice (niveau) : compétences du programme officiel travaillées, en plus de celles
   * de la mission (identifiants de src/programme/). Vérifié par les tests, affiché dans la documentation.
   */
  programme?: string[];
  /** Les items de référence (Gardien, tests). Une partie en joue une variante : voir `run.ts`. */
  items: ExerciseItem[];
  /** Exercice généré : d'autres items pour une autre graine (une par partie). */
  generate?: (seed: string) => ExerciseItem[];
  /** Nombre d'items joués par partie, tirés du lot (tous s'il n'est pas donné). */
  perRun?: number;
  feedback: {
    correct: string;
    /** Peut contenir {word}, {heard}, {answer}. */
    wrong: string;
  };
  reward: { block: BlockId; amount: number; xp: number };
  adaptive: { promoteAt: number; demoteAt: number };
}

/**
 * La question d'un bloc assemblé (GD-2) : `docs/contenu/assemblage.md`, section « Les questions », écrite par
 * `npm run contenu` dans `data/assemblage-<bloc>.json`. Les champs d'un exercice, sans île, sans récompense et sans
 * adaptation : une question d'assemblage ne rapporte ni blocs ni XP et n'adapte aucun niveau. Les compétences
 * (`programme`) valent pour tout le bloc ; une question à la fois est posée (voir `world/assemblage.ts`).
 */
export interface AssemblageDef extends Omit<ExerciseDef, 'biome' | 'reward' | 'adaptive' | 'generate' | 'perRun' | 'target'> {
  type: 'assemblage';
  /** Le bloc assemblé que la question fait gagner. */
  bloc: BlockId;
  programme: string[];
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
