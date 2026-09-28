import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applySettings, DEFAULT_SETTINGS, sanitizeSettings, SETTINGS_KEY, type Settings } from './settings';
import { loadJSON, saveJSON } from './storage';
import { speak as speakRaw, stopSpeaking, type Lang } from './speech';
import { aUneProgression, MESSAGE_UNIVERS_KEY, premierUnivers, UNIVERS_OUVERT, titreAffiche, type UniversChoice } from './univers';
import { retenirReglages } from '../blocland/rendu';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** Lit un texte à voix haute avec la vitesse choisie par l'élève (en français, sauf `lang: 'en'`). */
  speak: (text: string, onEnd?: () => void, lang?: Lang) => void;
  stop: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Les réglages enregistrés, et, une fois l'univers ouvert, le premier univers d'un appareil qui n'en a pas encore :
 * calculé une seule fois depuis sa progression, puis figé. Fermé, `univers` n'est jamais écrit : un appareil neuf
 * aujourd'hui ne restera pas figé sur un choix fait avant la bascule.
 */
export function lireReglages(ouvert = UNIVERS_OUVERT): Settings {
  const settings = sanitizeSettings(loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS));
  if (!ouvert || settings.univers !== undefined) return settings;
  const { univers, message } = premierUnivers({
    progression: aUneProgression(loadJSON<unknown>('progress', {}), loadJSON<unknown>('blocland', {})),
    experimental: settings.renduArchipeo,
  });
  if (message) saveJSON(MESSAGE_UNIVERS_KEY, { dit: false });
  return { ...settings, univers };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const lus = lireReglages();
    retenirReglages(lus);
    return lus;
  });

  useEffect(() => {
    applySettings(settings);
    saveJSON(SETTINGS_KEY, settings);
    retenirReglages(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }));
  }, []);

  // « Affichage par défaut » garde l'univers : ce n'est pas un réglage d'affichage.
  const reset = useCallback(() => setSettings((prev) => (prev.univers === undefined ? DEFAULT_SETTINGS : { ...DEFAULT_SETTINGS, univers: prev.univers })), []);

  const speak = useCallback((text: string, onEnd?: () => void, lang?: Lang) => speakRaw(text, settings.speechRate, onEnd, lang), [settings.speechRate]);

  const value = useMemo(() => ({ settings, update, reset, speak, stop: stopSpeaking }), [settings, update, reset, speak]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings doit être utilisé dans <SettingsProvider>');
  return ctx;
}

/** L'univers qui se voit (titre, retour vers la Carte) : celui des réglages une fois ouvert, Archipéo avant. */
export function useUnivers(): UniversChoice {
  return titreAffiche(useSettings().settings.univers, UNIVERS_OUVERT);
}
