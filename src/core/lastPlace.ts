// La dernière quête ouverte, pour le bouton « Continuer » (écran titre et menus) : son adresse et son nom.
import { useEffect } from 'react';
import { loadJSON, removeKey, saveJSON } from './storage';

const STORAGE_KEY = 'reprise';

export interface Place {
  /** Adresse dans l'appli (« /aventure/foret/abattage », « /app/tables »). */
  path: string;
  /** Ce qu'on affiche : « Abattage syllabique · Forêt des sons ». */
  label: string;
}

export function lastPlace(): Place | null {
  const p = loadJSON<Partial<Place>>(STORAGE_KEY, {});
  return typeof p.path === 'string' && p.path.startsWith('/') && typeof p.label === 'string' && p.label ? { path: p.path, label: p.label } : null;
}

export function rememberPlace(place: Place): void {
  saveJSON(STORAGE_KEY, place);
}

export function forgetPlace(): void {
  removeKey(STORAGE_KEY);
}

/** Retient la quête ouverte (à l'ouverture de sa page). */
export function useRememberPlace(place: Place | null) {
  const path = place?.path;
  const label = place?.label;
  useEffect(() => {
    if (path && label) rememberPlace({ path, label });
  }, [path, label]);
}
