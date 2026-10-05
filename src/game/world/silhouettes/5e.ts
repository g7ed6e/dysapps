// Le relief de marche des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../modeleDessine/5e.ts (U2).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_5E = {
  // Le Glacier : deux pics au fond de l'île, le plus haut à gauche.
  'maths-5e-signed-numbers': {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
  },
  'maths-5e-proportionality': { pics: [] },
  'french-5e-homophones': { pics: [] },
  'french-5e-conjugation': { pics: [] },
  'english-5e-vocabulary': { pics: [] },
  'english-5e-grammar': { pics: [] },
  // Le Relais des voyageurs (LV2) : une île plate, au bout de la ligne ; son relief dessiné est dans ../modeleDessine/5e.ts.
  'lv2-5e-introductions': { pics: [] },
} satisfies Partial<Record<BiomeId, Silhouette>>;
