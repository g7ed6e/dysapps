// La dernière mission ouverte, pour « Ma dernière mission » (écran titre et menus) : son adresse et son nom.
import { useEffect } from 'react';
import { getBiome } from '../game/biomes';
import { isBiomeUnlocked } from '../game/world/archipelago';
import { movedPath } from './movedIds';
import { loadJSON, removeKey, saveJSON } from './storage';

const STORAGE_KEY = 'resume';

export interface Place {
  /** Adresse dans l'appli (« /adventure/french-6e-phonology/syllables », « /app/tables »). */
  path: string;
  /** Ce qu'on affiche : « Abattage syllabique · Forêt des sons ». */
  label: string;
}

/** Le lieu d'une adresse de l'aventure (`/adventure/<lieu>/…`), s'il en a un. */
const placeOfPath = (path: string) => getBiome(/^\/adventure\/([^/?#]+)/.exec(path)?.[1]);

/**
 * La dernière mission ouverte, sous son adresse d'aujourd'hui (une mission déplacée, core/movedIds.ts, suit). Avec les
 * liaisons de la partie (`links`), une adresse qui mène à un lieu fermé est ignorée : une mission arrivée dans un lieu
 * encore fermé (programmes de 2025-2026) n'est pas proposée, « Reprendre » suit la suggestion.
 */
export function lastPlace(links?: string[]): Place | null {
  const p = loadJSON<Partial<Place>>(STORAGE_KEY, {});
  if (!(typeof p.path === 'string' && p.path.startsWith('/') && typeof p.label === 'string' && p.label)) return null;
  const path = movedPath(p.path);
  const place = placeOfPath(path);
  if (links && place && !isBiomeUnlocked(place.id, links)) return null;
  return { path, label: p.label };
}

export function rememberPlace(place: Place): void {
  saveJSON(STORAGE_KEY, place);
}

export function forgetPlace(): void {
  removeKey(STORAGE_KEY);
}

/** Retient la mission ouverte (à l'ouverture de sa page). */
export function useRememberPlace(place: Place | null) {
  const path = place?.path;
  const label = place?.label;
  useEffect(() => {
    if (path && label) rememberPlace({ path, label });
  }, [path, label]);
}
