import { useEffect } from 'react';
import { useSettings } from '../core/SettingsContext';
import { startAmbience, stopAmbience } from './sound';
import { daylight } from './world/daylight';

/** Ambiance sonore du village (option) : démarre en entrant dans une page du monde, s'arrête en la quittant. */
export function useAmbience(forceDay: boolean): void {
  const { settings } = useSettings();
  const on = settings.ambience && settings.sounds;
  useEffect(() => {
    if (!on) return;
    // Le navigateur exige un geste de l'élève avant de jouer un son : on démarre au premier toucher.
    const start = () => startAmbience(!forceDay && daylight().light < 0.5);
    start();
    window.addEventListener('pointerdown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      stopAmbience();
    };
  }, [on, forceDay]);
}
