// Synthèse vocale du navigateur (gratuite, sans serveur).

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Langue d'un texte lu : le français (consignes, corrections) ou l'anglais (mots et phrases travaillés en anglais). */
export type Lang = 'fr' | 'en';

/** L'accent de chaque langue : français de France, anglais britannique (celui des manuels du collège). */
export const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };

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

export function speak(text: string, rate = 0.9, onEnd?: () => void, lang: Lang = 'fr'): void {
  if (!isSpeechAvailable() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
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
