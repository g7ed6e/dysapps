// Le relief des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-5e (docs/conception/cadrage-archipeo.md §6).
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
} satisfies Record<string, Silhouette>;
