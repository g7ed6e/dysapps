// Le relief de marche des Anciens Ateliers (4e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../modeleDessine/4e.ts (U2).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_4E = {
  // La Forge : un seul pic au fond de l'île.
  'maths-4e-powers': { pics: [{ x: 9, y: 19, h: 7, r: 5 }] },
  'maths-4e-algebra': { pics: [] },
  // La Falaise : deux pics au fond de l'île, le plus haut à gauche.
  'french-4e-agreement': {
    pics: [
      { x: 5, y: 21, h: 9, r: 6 },
      { x: 12, y: 20, h: 6, r: 4 },
    ],
  },
  'french-4e-vocabulary': { pics: [] },
  'english-4e-comprehension': { pics: [] },
  'english-4e-grammar': { pics: [] },
  // Le Jardin des heures (LV2) : une île plate, au bout est de la crête, sans pic (aucune verticale à côté de la grue).
  'lv2-4e-daily-life': { pics: [] },
} satisfies Partial<Record<BiomeId, Silhouette>>;
