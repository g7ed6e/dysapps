export type FontChoice = 'luciole' | 'opendyslexic' | 'atkinson' | 'arial';
export type ThemeChoice = 'creme' | 'nuit' | 'clair' | 'contraste';
/** La vue de Blocland : le monde en 3D, le monde en 2D (pixels, vue de dessus en oblique), ou la liste des îles. */
export type WorldViewChoice = '3d' | '2d' | 'liste';

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
  /** La vue de Blocland ; sans WebGL, le monde en 3D laisse la place à la liste, accessible. */
  worldView: WorldViewChoice;
  /** Dans le monde en 2D, marcher case par case avec une croix de direction (toucher pour aller reste possible). */
  freeWalk: boolean;
  /** Sons d'action dans le village (poser, retirer, plan terminé). */
  sounds: boolean;
  /** Ambiance sonore du village (vent, oiseaux le jour, grillons la nuit), en option. */
  ambience: boolean;
  /** Une vibration courte à la bonne réponse et à la pose d'un bloc (téléphones Android). */
  haptics: boolean;
  /** Une pastille sur l'icône de l'appli installée quand des révisions attendent. */
  appBadge: boolean;
}

/** Contraintes orthophoniques : taille ≥ 18 px, interlignage ≥ 1,5. */
export const MIN_FONT_SIZE = 18;
export const MIN_LINE_HEIGHT = 1.5;

export const DEFAULT_SETTINGS: Settings = {
  font: 'luciole',
  fontSize: 20,
  lineHeight: 1.7,
  letterSpacing: 0.03,
  wordSpacing: 0.12,
  theme: 'creme',
  speechRate: 0.9,
  autoRead: true,
  syllables: true,
  reduceMotion: false,
  worldView: '3d',
  freeWalk: false,
  sounds: true,
  ambience: false,
  haptics: true,
  appBadge: true,
};

export const FONT_LABELS: Record<FontChoice, string> = {
  luciole: 'Luciole',
  opendyslexic: 'OpenDyslexic',
  atkinson: 'Atkinson Hyperlegible',
  arial: 'Arial',
};

export const WORLD_VIEW_LABELS: Record<WorldViewChoice, string> = {
  '3d': 'Le monde en 3D',
  '2d': 'Le monde en 2D (expérimental)',
  liste: 'La liste des îles',
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
export function sanitizeSettings(input: Partial<Settings> & { view3d?: unknown }): Settings {
  const s = { ...DEFAULT_SETTINGS, ...input };
  // Avant les trois vues : un interrupteur « vues en 3D » (éteint : la liste des îles).
  if (input.worldView === undefined && input.view3d !== undefined) s.worldView = input.view3d ? '3d' : 'liste';
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
    worldView: s.worldView in WORLD_VIEW_LABELS ? s.worldView : DEFAULT_SETTINGS.worldView,
    freeWalk: Boolean(s.freeWalk),
    sounds: s.sounds === undefined ? DEFAULT_SETTINGS.sounds : Boolean(s.sounds),
    ambience: s.ambience === undefined ? DEFAULT_SETTINGS.ambience : Boolean(s.ambience),
    haptics: s.haptics === undefined ? DEFAULT_SETTINGS.haptics : Boolean(s.haptics),
    appBadge: s.appBadge === undefined ? DEFAULT_SETTINGS.appBadge : Boolean(s.appBadge),
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

/**
 * Un espacement en mots plutôt qu'en em (« 0.03 » ne dit rien à un élève) : plus serré, normal (la valeur par défaut),
 * puis un peu plus large, plus large, très large jusqu'au maximum.
 */
export function spacingWord(value: number, normal: number, max: number): string {
  const eps = 1e-6;
  if (Math.abs(value - normal) < eps) return 'Normal';
  if (value < normal) return 'Plus serré';
  const t = (value - normal) / (max - normal);
  return t <= 1 / 3 + eps ? 'Un peu plus large' : t <= 2 / 3 + eps ? 'Plus large' : 'Très large';
}

/** La vitesse de la voix en mots : lente, normale (0,8 à 1), rapide. */
export function speedWord(rate: number): string {
  return rate < 0.75 ? 'Lente' : rate <= 1.05 ? 'Normale' : 'Rapide';
}
