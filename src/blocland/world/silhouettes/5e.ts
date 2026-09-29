// Le relief de marche des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../modeleDessine/5e.ts (U2).
import type { Silhouette } from './types';

export const SILHOUETTES_5E = {
  // Le Glacier : deux pics au fond de l'île, le plus haut à gauche.
  glacier: {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
  },
  marche: { pics: [] },
  carrefour: { pics: [] },
  marais: { pics: [] },
  comptoir: { pics: [] },
  manoir: { pics: [] },
  // Le Relais des voyageurs (LV2) : une île plate, au bout de la ligne ; son relief dessiné est dans ../modeleDessine/5e.ts.
  relais: { pics: [] },
} satisfies Record<string, Silhouette>;
