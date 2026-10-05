import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applySettings, DEFAULT_SETTINGS, retenirReglages, sanitizeSettings, SETTINGS_KEY, type Settings } from './settings';
import { loadJSON, saveJSON } from './storage';
import { speak as speakRaw, stopSpeaking, type Lang } from './speech';
import { aUneProgression, MESSAGE_UNIVERS_KEY, premierUnivers, RENOMMAGE_KEY, renommageANoter, universAffiche, type UniversChoice } from './universe';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  /** Lit un texte à voix haute avec la vitesse choisie par l'élève (en français, sauf `lang` : anglais, allemand ou espagnol). */
  speak: (text: string, onEnd?: () => void, lang?: Lang) => void;
  stop: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Les réglages enregistrés, et le premier univers d'un appareil qui n'en a pas encore : calculé une seule fois depuis
 * sa progression, puis figé.
 */
export function lireReglages(): { settings: Settings; message: boolean } {
  const settings = sanitizeSettings(loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS));
  if (settings.univers !== undefined) return { settings, message: false };
  const { univers, message } = premierUnivers({
    progression: aUneProgression(loadJSON<unknown>('progress', {}), loadJSON<unknown>('game', {})),
  });
  return { settings: { ...settings, univers }, message };
}

/**
 * Les nouveaux noms des archipels (GD-1), notés une seule fois, au premier lancement qui les connaît : à dire à un
 * appareil qui a déjà une progression, déjà dits pour un appareil neuf. Noté avant le premier rendu du monde, qui le lit,
 * et avant que l'élève ne gagne quoi que ce soit dans la séance. Idempotent.
 */
export function noterRenommage(): void {
  const deja = loadJSON<unknown>(RENOMMAGE_KEY, null);
  // Déjà notée : rien à relire (le chemin de démarrage).
  if (deja !== null) return;
  const note = renommageANoter(deja, aUneProgression(loadJSON<unknown>('progress', {}), loadJSON<unknown>('game', {})));
  if (note) saveJSON(RENOMMAGE_KEY, note);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lus] = useState(() => {
    noterRenommage();
    return lireReglages();
  });
  const [settings, setSettings] = useState<Settings>(lus.settings);
  // Le rendu lit les réglages en mémoire dès le premier rendu du monde, avant les effets : posés ici, pendant le rendu.
  // Idempotent (la même valeur à chaque rendu), donc sans risque sous StrictMode.
  retenirReglages(settings);

  // Le message unique à dire, noté une seule fois, au premier lancement après la bascule.
  useEffect(() => {
    if (lus.message) saveJSON(MESSAGE_UNIVERS_KEY, { said: false });
  }, [lus]);

  useEffect(() => {
    applySettings(settings);
    saveJSON(SETTINGS_KEY, settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }));
  }, []);

  // « Affichage par défaut » ne touche ni à l'univers ni à la LV2 : ce ne sont pas des réglages d'affichage.
  const reset = useCallback(
    () => setSettings((prev) => ({ ...DEFAULT_SETTINGS, lv2: prev.lv2, ...(prev.univers === undefined ? {} : { univers: prev.univers }) })),
    [],
  );

  const speak = useCallback((text: string, onEnd?: () => void, lang?: Lang) => speakRaw(text, settings.speechRate, onEnd, lang), [settings.speechRate]);

  const value = useMemo(() => ({ settings, update, reset, speak, stop: stopSpeaking }), [settings, update, reset, speak]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings doit être utilisé dans <SettingsProvider>');
  return ctx;
}

/** L'univers qui se voit (titre, retour vers la Carte) : celui des réglages, Blocland par défaut. */
export function useUnivers(): UniversChoice {
  return universAffiche(useSettings().settings.univers);
}

/**
 * L'univers choisi dans les réglages, sans exiger de fournisseur (un composant rendu seul dans un test lit alors
 * l'univers par défaut). Pour les textes d'univers (`useTextes` de src/universes).
 */
export function useUniversChoisi(): UniversChoice | undefined {
  return useContext(SettingsContext)?.settings.univers;
}
