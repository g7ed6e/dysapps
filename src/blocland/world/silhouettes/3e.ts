// Le relief de marche des Îles du Ciel (3e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../modeleDessine/3e.ts (U2).
import type { Silhouette } from './types';

export const SILHOUETTES_3E = {
  // Le Belvédère : deux pics au fond de l'île, le plus haut à gauche.
  belvedere: {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
  },
  phare: { pics: [] },
  donnees: { pics: [] },
  textes: { pics: [] },
  studio: { pics: [] },
  chateau: { pics: [] },
} satisfies Record<string, Silhouette>;
