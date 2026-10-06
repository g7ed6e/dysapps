// La vue du portrait d'un Gardien d'Archipéo (la fiche, le défi) quand celle de tous ne le lit pas. Sans les modèles :
// la page du défi la lit sans charger les personnages en facettes (CharacterSvg.tsx, PersonnageCanvas.tsx, à la demande).
import type { BiomeId } from '../../biomes';

/** La vue du portrait d'un Gardien qui ne se lit pas dans celle de tous : sa rotation et sa plongée (`OptionsDuPortrait`). */
export interface GuardianPortraitView {
  angle: number;
  plongee: number;
}

/**
 * Les Gardiens dont le portrait (la fiche, le défi) se prend sous une autre vue que celle de tous, le modèle inchangé :
 * la Libellule de jade, de face et en plongée légère, se lisait comme une croix (DA, HG-3) ; de trois quarts, par
 * au-dessus comme la caméra du monde, ses quatre ailes à plat se lisent en X.
 */
const GUARDIAN_PORTRAIT_VIEWS: Partial<Record<BiomeId, GuardianPortraitView>> = {
  'geography-5e-resources': { angle: -0.8, plongee: 0.9 },
};

/** La vue du portrait du Gardien d'une île (voir `GUARDIAN_PORTRAIT_VIEWS`), `null` pour celle de tous. */
export function guardianPortraitView(id: BiomeId): GuardianPortraitView | null {
  return GUARDIAN_PORTRAIT_VIEWS[id] ?? null;
}

/**
 * La même vue pour la scène 3D du défi (`PersonnageCanvas`) : d'où la caméra regarde (x, z, le visage vers −Z) et sa
 * plongée (la hauteur pour un pas à l'horizontale).
 */
export function guardianCameraOf(view: GuardianPortraitView): { direction: [number, number]; elevation: number } {
  return { direction: [Math.sin(view.angle), -Math.cos(view.angle)], elevation: Math.tan(view.plongee) };
}
