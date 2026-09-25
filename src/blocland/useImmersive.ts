import { useSettings } from '../core/SettingsContext';
import { hasWebGL } from './three';

/** Blocland en 3D est-il actif ? (réglage « vue 3D » et WebGL disponible) */
export function useImmersive(): boolean {
  const { settings } = useSettings();
  return settings.view3d && hasWebGL();
}
