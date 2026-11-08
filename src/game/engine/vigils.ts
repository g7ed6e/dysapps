// Les veillées vues (GD-23, « trois veillées par niveau » ; GD-27, lot 3) dans la sauvegarde : leurs identifiants et leur
// assainissement. Une veillée vue ne se rejoue pas ; rien d'autre n'est écrit (« une veillée vue se retient sans rien
// perdre », GD-23). Leur dessin reste dans world/continu/levelVigils.ts, que le reste du jeu ne lit pas.

/**
 * Les veillées, par niveau : l'arrivée, l'embarquement d'un équipier, le départ (au 3e, la vue finale tient lieu de
 * départ : son identifiant existe, jamais écrit).
 */
export const VIGIL_IDS = ['6e-arrival', '6e-boarding', '6e-departure', '5e-arrival', '5e-boarding', '5e-departure', '4e-arrival', '4e-boarding', '4e-departure', '3e-arrival', '3e-boarding', '3e-departure'] as const;
export type VigilId = (typeof VIGIL_IDS)[number];

/** Les veillées vues, dans l'ordre de `VIGIL_IDS`, sans doublon ni inconnue (la sauvegarde). */
export function sanitizeVigils(raw: unknown): VigilId[] {
  if (!Array.isArray(raw)) return [];
  return VIGIL_IDS.filter((id) => raw.includes(id));
}
