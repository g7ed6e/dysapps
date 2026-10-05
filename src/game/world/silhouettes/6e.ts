// Le relief de marche des Premiers Rivages (6e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../drawnModel/6e.ts (U2).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_6E = {
  'french-6e-phonology': { pics: [] },
  'french-6e-grammar-spelling': { pics: [] },
  // La Mine : un seul pic au fond de l'île.
  'french-6e-letter-confusion': { pics: [{ x: 9, y: 19, h: 7, r: 5 }] },
  'french-6e-reading': { pics: [] },
  'french-6e-word-spelling': { pics: [] },
  'maths-6e-calculation': { pics: [] },
  'maths-6e-fractions': { pics: [] },
  // Le Volcan : un cône au fond de l'île, son cratère au centre.
  'maths-6e-decimals': { pics: [{ x: 8, y: 19, h: 8, r: 6 }] },
  'english-6e-vocabulary': { pics: [] },
  'english-6e-grammar': { pics: [] },
} satisfies Partial<Record<BiomeId, Silhouette>>;
