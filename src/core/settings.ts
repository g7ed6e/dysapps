export type FontChoice = 'atkinson' | 'opendyslexic' | 'systeme';
export type ThemeChoice = 'bd' | 'nuit' | 'clair' | 'contraste';

export interface Settings {
  font: FontChoice;
  fontSize: number; // en px
  lineHeight: number;
  letterSpacing: number; // en em
  wordSpacing: number; // en em
  theme: ThemeChoice;
  speechRate: number;
  autoRead: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  font: 'atkinson',
  fontSize: 20,
  lineHeight: 1.7,
  letterSpacing: 0.03,
  wordSpacing: 0.12,
  theme: 'bd',
  speechRate: 0.9,
  autoRead: false,
  reduceMotion: false,
};

export const FONT_LABELS: Record<FontChoice, string> = {
  atkinson: 'Atkinson Hyperlegible',
  opendyslexic: 'OpenDyslexic',
  systeme: 'Verdana / Arial',
};

export const THEME_LABELS: Record<ThemeChoice, string> = {
  bd: 'BD',
  nuit: 'BD nuit',
  clair: 'Sobre',
  contraste: 'Contraste élevé',
};

/** Anciens noms de thèmes (première version) vers les nouveaux. */
const LEGACY_THEMES: Record<string, ThemeChoice> = { creme: 'bd', sombre: 'nuit' };

const FONT_STACKS: Record<FontChoice, string> = {
  atkinson: "'Atkinson Hyperlegible', Verdana, Arial, sans-serif",
  opendyslexic: "'OpenDyslexic', Verdana, Arial, sans-serif",
  systeme: 'Verdana, Arial, Helvetica, sans-serif',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Corrige des réglages lus depuis le stockage (valeurs manquantes ou hors bornes). */
export function sanitizeSettings(input: Partial<Settings>): Settings {
  const s = { ...DEFAULT_SETTINGS, ...input };
  if (typeof s.theme === 'string' && s.theme in LEGACY_THEMES) s.theme = LEGACY_THEMES[s.theme];
  return {
    font: s.font in FONT_STACKS ? s.font : DEFAULT_SETTINGS.font,
    fontSize: clamp(Number(s.fontSize) || DEFAULT_SETTINGS.fontSize, 16, 32),
    lineHeight: clamp(Number(s.lineHeight) || DEFAULT_SETTINGS.lineHeight, 1.3, 2.4),
    letterSpacing: clamp(Number(s.letterSpacing) || 0, 0, 0.2),
    wordSpacing: clamp(Number(s.wordSpacing) || 0, 0, 0.5),
    theme: s.theme in THEME_LABELS ? s.theme : DEFAULT_SETTINGS.theme,
    speechRate: clamp(Number(s.speechRate) || DEFAULT_SETTINGS.speechRate, 0.5, 1.3),
    autoRead: Boolean(s.autoRead),
    reduceMotion: Boolean(s.reduceMotion),
  };
}

/** Applique les réglages au document via des variables CSS et un attribut de thème. */
export function applySettings(settings: Settings, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = settings.theme;
  root.dataset.reduceMotion = String(settings.reduceMotion);
  root.style.setProperty('--font-family', FONT_STACKS[settings.font]);
  root.style.setProperty('--font-size', `${settings.fontSize}px`);
  root.style.setProperty('--line-height', String(settings.lineHeight));
  root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`);
  root.style.setProperty('--word-spacing', `${settings.wordSpacing}em`);
}
