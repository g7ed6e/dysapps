import { useSettings } from '../core/SettingsContext';
import type { WorldViewChoice } from '../core/settings';
import { hasWebGL } from './three';

/**
 * Le monde en 3D si le réglage le demande et que l'appareil sait le dessiner ; sinon la liste des îles. Sans WebGL,
 * l'élève a la vue simple (décision du mainteneur, 29 septembre 2026).
 */
export function montreLeMonde(choice: WorldViewChoice, webgl: boolean): boolean {
  return choice === '3d' && webgl;
}

/** Blocland en monde 3D plein écran plutôt qu'en liste d'îles. */
export function useImmersive(): boolean {
  const { settings } = useSettings();
  // WebGL n'est sondé que si l'élève a choisi la 3D : aucun contexte créé pour la liste.
  return montreLeMonde(settings.worldView, settings.worldView === '3d' && hasWebGL());
}
