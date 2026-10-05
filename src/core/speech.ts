// Synthèse vocale du navigateur (gratuite, sans serveur).

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Langue d'un texte lu : le français (consignes, corrections), ou la langue vivante travaillée (anglais, et en LV2
 * allemand ou espagnol) pour ses mots et ses phrases.
 */
export type Lang = 'fr' | 'en' | 'de' | 'es';

/**
 * L'accent de chaque langue : français de France, anglais britannique (celui des manuels du collège), allemand
 * d'Allemagne et espagnol d'Espagne (ceux des manuels de LV2).
 */
const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', es: 'es-ES' };

/** Une langue vivante lue par sa propre voix (pas le français). */
export type LangueVivante = Exclude<Lang, 'fr'>;

/** Vraie pour une langue vivante lue par sa propre voix ; fausse pour le français ou une valeur inconnue. */
export function estLangueVivante(value: unknown): value is LangueVivante {
  return value !== 'fr' && typeof value === 'string' && Object.hasOwn(LOCALES, value);
}

/** La langue vivante d'une valeur, ou `undefined` (le français, une valeur inconnue). */
export function langueVivante(value: unknown): LangueVivante | undefined {
  return estLangueVivante(value) ? value : undefined;
}

/** La voix d'une langue : l'accent attendu, installée sur l'appareil de préférence, sinon toute voix de la langue. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | undefined {
  // Certains navigateurs (Android) écrivent « en_GB ».
  const locale = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-');
  return (
    voices.find((v) => locale(v) === LOCALES[lang] && v.localService) ??
    voices.find((v) => locale(v) === LOCALES[lang]) ??
    voices.find((v) => locale(v).startsWith(`${lang}-`) || locale(v) === lang)
  );
}

/** Attribut `lang` d'un texte affiché : seulement quand il n'est pas en français (lecteurs d'écran, césure). */
export function langAttr(lang: Lang | undefined): string | undefined {
  return lang && lang !== 'fr' ? lang : undefined;
}

/**
 * L'appareil a-t-il une voix pour cette langue ? `undefined` tant que la liste des voix n'est pas chargée (elle arrive
 * après coup sur Chrome) : on ne dit « pas de voix » qu'à coup sûr.
 */
export function hasVoice(lang: Lang): boolean | undefined {
  if (!isSpeechAvailable()) return false;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;
  return pickVoice(voices, lang) !== undefined;
}

/** S'abonne à l'arrivée de la liste des voix (`voiceschanged`) ; renvoie de quoi se désabonner. */
export function ecouterVoix(rappel: () => void): () => void {
  if (!isSpeechAvailable()) return () => {};
  const synthese = window.speechSynthesis;
  synthese.addEventListener('voiceschanged', rappel);
  return () => synthese.removeEventListener('voiceschanged', rappel);
}

/**
 * Le texte tel que la voix doit le lire : les milliers écrits avec une espace insécable (« 3 822 », voir `fmt`) sont
 * recollés (« 3822 »), sinon certaines voix lisent « trois, huit cent vingt-deux ». L'affichage ne change pas, et une
 * espace ordinaire entre deux nombres (« 12 et 15 ») reste une séparation.
 */
export function pourLaVoix(text: string): string {
  return text.replace(/(\d)[\u00a0\u202f](?=\d{3}(?!\d))/g, '$1');
}

export function speak(text: string, rate = 0.9, onEnd?: () => void, lang: Lang = 'fr'): void {
  if (!isSpeechAvailable() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(pourLaVoix(text));
  utterance.lang = LOCALES[lang];
  utterance.rate = rate;
  const voice = pickVoice(window.speechSynthesis.getVoices(), lang);
  if (voice) utterance.voice = voice;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechAvailable()) window.speechSynthesis.cancel();
}

/**
 * Débloque la voix : sur iPhone, iPad et certains Android, la synthèse vocale reste muette tant qu'elle n'a pas parlé
 * une première fois pendant un geste de l'élève. Une phrase vide et silencieuse, dite au toucher de l'écran titre,
 * suffit : la consigne lue automatiquement ensuite s'entend.
 */
export function unlockSpeech(): void {
  if (!isSpeechAvailable()) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    // Voix indisponible : rien à débloquer.
  }
}
