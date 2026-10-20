// Les Détours du monde continu dans la sauvegarde (GD-20, déplacement libre, lot 2) : leurs identifiants et leur
// assainissement. Leur dessin et leur place restent dans world/continu/detours.ts, que le reste du jeu ne lit pas (la
// coupure du monde continu) : il en garde les mêmes identifiants, dans le même ordre (le test des Détours le vérifie).

/** Les Détours : les cinq du 6e, un par terre, puis ceux du 5e (GD-22, lot 6 : le Creux). */
export const DETOUR_IDS = ['butte-chantier', 'braise-herons', 'bout-large', 'colline-aube', 'haut-cretes', 'creux'] as const;
export type DetourId = (typeof DETOUR_IDS)[number];

/** Les Détours trouvés, dans l'ordre de `DETOUR_IDS`, sans doublon ni inconnu (la sauvegarde). */
export function sanitizeDetours(raw: unknown): DetourId[] {
  if (!Array.isArray(raw)) return [];
  return DETOUR_IDS.filter((id) => raw.includes(id));
}
