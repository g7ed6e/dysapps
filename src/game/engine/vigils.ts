// Les veillées vues (GD-23, « trois veillées par niveau » ; GD-27, lot 3) dans la sauvegarde : leurs identifiants et leur
// assainissement. Une veillée vue ne se rejoue pas ; rien d'autre n'est écrit (« une veillée vue se retient sans rien
// perdre », GD-23). Leur dessin reste dans world/continu/vigils6e.ts, que le reste du jeu ne lit pas.

/** Les veillées : celles du 6e (l'arrivée, l'embarquement de la radio, le départ) ; celles des autres niveaux à la suite. */
export const VIGIL_IDS = ['6e-arrival', '6e-boarding', '6e-departure'] as const;
export type VigilId = (typeof VIGIL_IDS)[number];

/** Les veillées vues, dans l'ordre de `VIGIL_IDS`, sans doublon ni inconnue (la sauvegarde). */
export function sanitizeVigils(raw: unknown): VigilId[] {
  if (!Array.isArray(raw)) return [];
  return VIGIL_IDS.filter((id) => raw.includes(id));
}
