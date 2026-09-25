export type FontChoice = 'luciole' | 'opendyslexic' | 'atkinson' | 'arial';
export type ThemeChoice = 'creme' | 'nuit' | 'clair' | 'contraste';

export interface Settings {
  font: FontChoice;
  fontSize: number; // en px, jamais moins de 18
  lineHeight: number; // jamais moins de 1,5
  letterSpacing: number; // en em
  wordSpacing: number; // en em
  theme: ThemeChoice;
  speechRate: number;
  /** Lire les consignes et les messages à voix haute dès qu'ils apparaissent. */
  autoRead: boolean;
  /** Surligner les syllabes en couleurs alternées. */
  syllables: boolean;
  reduceMotion: boolean;
  /** Vues 3D (Three.js) quand WebGL est disponible ; sinon la vue simple, accessible. */
  view3d: boolean;
  /** Sons d'action dans le village (poser, retirer, plan terminé). */
  sounds: boolean;
  /** Ambiance sonore du village (vent, oiseaux le jour, grillons la nuit), en option. */
  ambience: boolean;
}

/** Contraintes orthophoniques : taille ≥ 18 px, interlignage ≥ 1,5. */
export const MIN_FONT_SIZE = 18;
export const MIN_LINE_HEIGHT = 1.5;

export const DEFAULT_SETTINGS: Settings = {
  // Luciole est la police recommandée : elle devient le défaut dès que ses fichiers sont installés (voir README).
  font: 'atkinson',
  fontSize: 20,
  lineHeight: 1.7,
  letterSpacing: 0.03,
  wordSpacing: 0.12,
  theme: 'creme',
  speechRate: 0.9,
  autoRead: true,
  syllables: true,
  reduceMotion: false,
  view3d: true,
  sounds: true,
  ambience: false,
};

export const FONT_LABELS: Record<FontChoice, string> = {
  luciole: 'Luciole',
  opendyslexic: 'OpenDyslexic',
  atkinson: 'Atkinson Hyperlegible',
  arial: 'Arial',
};

export const THEME_LABELS: Record<ThemeChoice, string> = {
  creme: 'Crème',
  nuit: 'Nuit',
  clair: 'Clair',
  contraste: 'Contraste élevé',
};

/** Anciens identifiants (versions précédentes) vers les nouveaux. */
const LEGACY_THEMES: Record<string, ThemeChoice> = { bd: 'creme', sombre: 'nuit' };
const LEGACY_FONTS: Record<string, FontChoice> = { systeme: 'arial' };

const FONT_STACKS: Record<FontChoice, string> = {
  luciole: "'Luciole', 'Atkinson Hyperlegible', Arial, sans-serif",
  opendyslexic: "'OpenDyslexic', Arial, sans-serif",
  atkinson: "'Atkinson Hyperlegible', Arial, sans-serif",
  arial: 'Arial, Helvetica, sans-serif',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Corrige des réglages lus depuis le stockage (valeurs manquantes ou hors bornes). */
export function sanitizeSettings(input: Partial<Settings>): Settings {
  const s = { ...DEFAULT_SETTINGS, ...input };
  if (typeof s.theme === 'string' && s.theme in LEGACY_THEMES) s.theme = LEGACY_THEMES[s.theme];
  if (typeof s.font === 'string' && s.font in LEGACY_FONTS) s.font = LEGACY_FONTS[s.font];
  return {
    font: s.font in FONT_STACKS ? s.font : DEFAULT_SETTINGS.font,
    fontSize: clamp(Number(s.fontSize) || DEFAULT_SETTINGS.fontSize, MIN_FONT_SIZE, 32),
    lineHeight: clamp(Number(s.lineHeight) || DEFAULT_SETTINGS.lineHeight, MIN_LINE_HEIGHT, 2.4),
    letterSpacing: clamp(Number(s.letterSpacing) || 0, 0, 0.2),
    wordSpacing: clamp(Number(s.wordSpacing) || 0, 0, 0.5),
    theme: s.theme in THEME_LABELS ? s.theme : DEFAULT_SETTINGS.theme,
    speechRate: clamp(Number(s.speechRate) || DEFAULT_SETTINGS.speechRate, 0.5, 1.3),
    autoRead: s.autoRead === undefined ? DEFAULT_SETTINGS.autoRead : Boolean(s.autoRead),
    syllables: s.syllables === undefined ? DEFAULT_SETTINGS.syllables : Boolean(s.syllables),
    reduceMotion: Boolean(s.reduceMotion),
    view3d: s.view3d === undefined ? DEFAULT_SETTINGS.view3d : Boolean(s.view3d),
    sounds: s.sounds === undefined ? DEFAULT_SETTINGS.sounds : Boolean(s.sounds),
    ambience: s.ambience === undefined ? DEFAULT_SETTINGS.ambience : Boolean(s.ambience),
  };
}

/** Applique les réglages au document via des variables CSS et un attribut de thème. */
export function applySettings(settings: Settings, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = settings.theme;
  root.dataset.reduceMotion = String(settings.reduceMotion);
  root.dataset.syllables = String(settings.syllables);
  root.style.setProperty('--font-family', FONT_STACKS[settings.font]);
  root.style.setProperty('--font-size', `${settings.fontSize}px`);
  root.style.setProperty('--line-height', String(settings.lineHeight));
  root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  root.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
}

/** Vérifie si une police est réellement chargée (Luciole doit être installée à la main). */
export async function isFontAvailable(family: string): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) return false;
  try {
    const faces = await document.fonts.load(`18px '${family}'`);
    return faces.length > 0;
  } catch {
    return false;
  }
}
