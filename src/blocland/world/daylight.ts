// Jour et nuit selon l'heure réelle de l'appareil : aube à 7 h, crépuscule à 20 h, transitions d'une heure.
// Code pur : renvoie un facteur de lumière (1 = plein jour, 0 = nuit) et une phase nommée.

export type DayPhase = 'jour' | 'nuit' | 'aube' | 'crepuscule';

export interface Daylight {
  /** 0 (nuit) … 1 (plein jour). */
  light: number;
  phase: DayPhase;
}

export const DAWN = 7;
export const DUSK = 20;
const TRANSITION = 1;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Lumière du jour à une heure décimale (7,5 = 7 h 30). */
export function daylightAt(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24;
  if (h >= DAWN && h < DAWN + TRANSITION) return { light: smooth((h - DAWN) / TRANSITION), phase: 'aube' };
  if (h >= DUSK && h < DUSK + TRANSITION) return { light: 1 - smooth((h - DUSK) / TRANSITION), phase: 'crepuscule' };
  if (h >= DAWN + TRANSITION && h < DUSK) return { light: 1, phase: 'jour' };
  return { light: 0, phase: 'nuit' };
}

export function daylight(date = new Date()): Daylight {
  return daylightAt(date.getHours() + date.getMinutes() / 60);
}

/** Mélange linéaire de deux couleurs 0xRRGGBB. */
export function mixColor(night: number, day: number, light: number): number {
  const ch = (shift: number) => Math.round(((night >> shift) & 255) + (((day >> shift) & 255) - ((night >> shift) & 255)) * light);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Palette du ciel, de l'eau et de la lumière selon le moment. */
export function palette(light: number): { sky: number; water: number; sun: number; sunIntensity: number; ambient: number } {
  return {
    // La nuit reste lisible pour un enfant : un bleu de crépuscule, jamais un noir.
    sky: mixColor(0x2c3f70, 0x8fd0f5, light),
    water: mixColor(0x22437a, 0x4a9be0, light),
    sun: mixColor(0x8fa0d0, 0xffffff, light),
    sunIntensity: 0.6 + 0.9 * light,
    ambient: 0.7 + 0.5 * light,
  };
}
