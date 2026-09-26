// Jour et nuit selon l'heure réelle de l'appareil : aube à 7 h, crépuscule à 20 h, transitions d'une heure.
// Code pur : renvoie un facteur de lumière (1 = plein jour, 0 = nuit) et une phase nommée.
// Chaque archipel a son ambiance : ciel, mer, brouillard et sol changent de teinte d'un archipel à l'autre.
import type { ArchipelagoId } from './map';

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

export interface Ambience {
  skyDay: number;
  skyNight: number;
  waterDay: number;
  waterNight: number;
  /** Couleur du sol pour la lumière d'ambiance (ce que le ciel reflète d'en bas). */
  ground: number;
  /** Portée du brouillard, en fractions de la largeur du monde (début, fin). */
  fog: [number, number];
  /** Un monde du ciel : pas de mer, un plancher de nuages. */
  sky: boolean;
}

/** L'ambiance de chaque archipel. Toutes les nuits restent un bleu de crépuscule, jamais un noir. */
export const AMBIENCE: Record<ArchipelagoId, Ambience> = {
  // Les Basses Terres : la mer tempérée, le ciel d'été.
  '6e': { skyDay: 0x8fd0f5, skyNight: 0x2c3f70, waterDay: 0x4a9be0, waterNight: 0x22437a, ground: 0x8a6a4a, fog: [1.2, 3.0], sky: false },
  // Les Collines du Large : plus froid, une mer turquoise.
  '5e': { skyDay: 0xaadcf2, skyNight: 0x27406e, waterDay: 0x3f9fc4, waterNight: 0x1f4468, ground: 0x7a8a9a, fog: [1.2, 3.0], sky: false },
  // Les Monts de Feu : un bleu profond, la brume de montagne plus proche.
  '4e': { skyDay: 0x74b0e4, skyNight: 0x233560, waterDay: 0x2c6d9c, waterNight: 0x172f52, ground: 0x6a5a58, fog: [1.0, 2.6], sky: false },
  // Les Îles du Ciel : un ciel très pâle, et des nuages à la place de la mer.
  '3e': { skyDay: 0xc4e6fb, skyNight: 0x33478a, waterDay: 0xf3f7fb, waterNight: 0x8b97b8, ground: 0xdde6f0, fog: [1.4, 3.4], sky: true },
};

/** Palette du ciel, de l'eau et de la lumière selon le moment, dans un archipel. */
export function palette(light: number, a: ArchipelagoId = '6e'): { sky: number; water: number; sun: number; sunIntensity: number; ambient: number; ground: number } {
  const amb = AMBIENCE[a];
  return {
    sky: mixColor(amb.skyNight, amb.skyDay, light),
    water: mixColor(amb.waterNight, amb.waterDay, light),
    sun: mixColor(0x8fa0d0, 0xffffff, light),
    sunIntensity: 0.6 + 0.9 * light,
    ambient: 0.7 + 0.5 * light,
    ground: amb.ground,
  };
}
