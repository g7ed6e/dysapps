import { useSettings } from '../core/SettingsContext';
import type { WorldViewChoice } from '../core/settings';
import { hasCanvas2D } from './pixel/canvas2d';
import { hasWebGL } from './three';

/**
 * La vue du monde affichée : le monde en 3D si le réglage le demande et que l'appareil sait le dessiner ; sans WebGL,
 * le monde en 3D laisse la place au monde en 2D, qui n'est plus au choix ; sans dessin du tout, la liste (`null`).
 */
export function resolveWorldView(choice: WorldViewChoice, can: { webgl: boolean; canvas2d: boolean }): '3d' | '2d' | null {
  if (choice === '3d') return can.webgl ? '3d' : can.canvas2d ? '2d' : null;
  return null;
}

/** Blocland en monde (3D ou 2D) ou en liste (`null`). */
export function useWorldView(): '3d' | '2d' | null {
  const { settings } = useSettings();
  return resolveWorldView(settings.worldView, { webgl: settings.worldView === '3d' && hasWebGL(), canvas2d: settings.worldView === '3d' && hasCanvas2D() });
}

/** Blocland en monde plein écran (3D ou 2D) plutôt qu'en liste d'îles. */
export function useImmersive(): boolean {
  return useWorldView() !== null;
}
