// Une vibration courte, comme dans les jeux sur téléphone : à la bonne réponse et à la pose d'un bloc. Seuls les
// navigateurs Android savent vibrer (Safari, non : rien ne se passe). Désactivable dans les Réglages.
import { useCallback } from 'react';
import { useSettings } from './SettingsContext';

/** Vibre `ms` millisecondes si l'appareil le permet (sinon, rien). */
export function vibrate(ms: number): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    // Vibration refusée (pas de geste récent, politique du navigateur) : sans conséquence.
  }
}

/** Les deux retours de l'appli, selon le réglage « Vibrations ». */
export function useHaptics() {
  const { settings } = useSettings();
  const on = settings.haptics;
  const success = useCallback(() => on && vibrate(25), [on]);
  const place = useCallback(() => on && vibrate(12), [on]);
  return { success, place };
}
