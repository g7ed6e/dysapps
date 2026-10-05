// Le relief de marche des Îles du Ciel (3e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../modeleDessine/3e.ts (U2).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_3E = {
  // Le Belvédère : deux pics au fond de l'île, le plus haut à gauche.
  'maths-3e-geometry': {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
  },
  'maths-3e-functions': { pics: [] },
  'maths-3e-statistics': { pics: [] },
  'french-3e-close-reading': { pics: [] },
  'english-3e-comprehension': { pics: [] },
  'english-3e-grammar': { pics: [] },
  // Le Refuge des carnets (LV2) : une île basse et arrondie, à l'est du Château, sans pic (rien de vertical à côté du
  // phare) ; son lac d'altitude est dessiné à part (../map.ts, `LACS`).
  'lv2-3e-travel': { pics: [] },
} satisfies Partial<Record<BiomeId, Silhouette>>;
