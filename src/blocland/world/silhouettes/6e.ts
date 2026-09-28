// Le relief des Premiers Rivages (6e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-6e (docs/conception/cadrage-archipeo.md §6).
import type { Silhouette } from './types';

export const SILHOUETTES_6E = {
  foret: { pics: [] },
  ferme: { pics: [] },
  // La Mine : un seul pic au fond de l'île.
  mine: { pics: [{ x: 9, y: 19, h: 7, r: 5 }] },
  tour: { pics: [] },
  carriere: { pics: [] },
  plaine: { pics: [] },
  riviere: { pics: [] },
  // Le Volcan : un cône au fond de l'île, son cratère au centre.
  volcan: { pics: [{ x: 8, y: 19, h: 8, r: 6 }] },
  baie: { pics: [] },
  horloge: { pics: [] },
} satisfies Record<string, Silhouette>;
