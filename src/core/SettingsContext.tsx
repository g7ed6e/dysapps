import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applySettings, DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './settings';
import { loadJSON, saveJSON } from './storage';
import { speak as speakRaw, stopSpeaking } from './speech';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** Lit un texte à voix haute avec la vitesse choisie par l'élève. */
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const STORAGE_KEY = 'settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => sanitizeSettings(loadJSON(STORAGE_KEY, DEFAULT_SETTINGS)));

  useEffect(() => {
    applySettings(settings);
    saveJSON(STORAGE_KEY, settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => speakRaw(text, settings.speechRate, onEnd),
    [settings.speechRate],
  );

  const value = useMemo(() => ({ settings, update, reset, speak, stop: stopSpeaking }), [settings, update, reset, speak]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings doit être utilisé dans <SettingsProvider>');
  return ctx;
}
