// Les Détours du monde continu dans la sauvegarde (GD-20, déplacement libre, lot 2) : leurs identifiants et leur
// assainissement. Leur dessin et leur place restent dans world/continu/detours.ts, que le reste du jeu ne lit pas (la
// coupure du monde continu) : il en garde les mêmes identifiants, dans le même ordre (le test des Détours le vérifie).

/** Les cinq Détours, un par terre. */
export const DETOUR_IDS = ['butte-chantier', 'braise-herons', 'bout-large', 'colline-aube', 'haut-cretes'] as const;
export type DetourId = (typeof DETOUR_IDS)[number];

/** Les Détours trouvés, dans l'ordre de `DETOUR_IDS`, sans doublon ni inconnu (la sauvegarde). */
export function sanitizeDetours(raw: unknown): DetourId[] {
  if (!Array.isArray(raw)) return [];
  return DETOUR_IDS.filter((id) => raw.includes(id));
}
