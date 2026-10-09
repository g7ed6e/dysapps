// Synthèse vocale du navigateur (gratuite, sans serveur).
import { motsEtrangersCourants, segmentsForSpeech } from './foreignWords';

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Langue d'un texte lu : le français (consignes, corrections), ou la langue vivante travaillée (anglais, et en LV2
 * allemand ou espagnol) pour ses mots et ses phrases ; l'italien seulement pour un mot cité sur l'île du latin et du grec
 * (./foreignWords.ts).
 */
export type Lang = 'fr' | 'en' | 'de' | 'es' | 'it';

/**
 * L'accent de chaque langue : français de France, anglais britannique (celui des manuels du collège), allemand
 * d'Allemagne et espagnol d'Espagne (ceux des manuels de LV2).
 */
const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', es: 'es-ES', it: 'it-IT' };

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
export function pourLaVoix(text: string, lang: Lang = 'fr'): string {
  const recolle = text.replace(/(\d)[\u00a0\u202f](?=\d{3}(?!\d))/g, '$1');
  // Les chiffres romains ne se lisent en mots qu'en français : « If I had » reste de l'anglais.
  if (lang !== 'fr') return recolle;
  return recolle
    .replace(/(?<!\p{L})([IVXL]+)(?:er|e)(?=[\s\u00a0]+(?:siècles?|République)\b)/gu, (tout, romain: string) => siecleEnMots(romain) ?? tout)
    // Un souverain : « Louis XIV », « François Ier ». Un « I » seul n'en est jamais un (« Can I », « Because I »).
    .replace(/(?<!\p{L})(\p{Lu}\p{Ll}+)[\s\u00a0]+(Ier|[IVX]{2,}|V|X)(?![\p{L}\d])/gu, (tout, nom: string, romain: string) =>
      PAS_UN_SOUVERAIN.has(nom) ? tout : `${nom} ${souverainEnMots(romain) ?? romain}`,
    )
    // Le point de « J.-C. » qui finit une phrase reste un point, pour la pause.
    .replace(/\bJ\.-C\.(?=\s+\p{Lu}|\s*$)/gu, 'Jésus-Christ.')
    .replace(/\bJ\.-C\./g, 'Jésus-Christ');
}

const ROMAINS: Readonly<Record<string, number>> = { I: 1, V: 5, X: 10, L: 50 };
const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];

/**
 * « VIIIe » (devant « siècle » ou « République ») tel qu'on le dit : « huitième ». Les chiffres romains et l'exposant se lisent sinon lettre
 * par lettre (« V, I, I, I, e »). Jusqu'au XXIe siècle ; au-delà, ou pour une suite qui n'est pas un nombre, rien.
 */
function siecleEnMots(romain: string): string | undefined {
  const n = romainEnNombre(romain);
  if (n === undefined) return undefined;
  if (n === 1) return 'premier';
  const cardinal = cardinalEnMots(n);
  // « cinq » prend un u, « neuf » change son f en v, le e final tombe (« quatre », « onze »).
  return `${cardinal.replace(/q$/, 'qu').replace(/f$/, 'v').replace(/e$/, '')}ième`;
}

/** Les mots à majuscule qui précèdent un chiffre romain sans être un nom de souverain (« Le XIV », « Chapitre III »). */
const PAS_UN_SOUVERAIN: ReadonlySet<string> = new Set(['Le', 'La', 'Les', 'Au', 'Aux', 'Du', 'Des', 'De', 'En', 'Soit', 'Chapitre', 'Tome', 'Acte']);

/** « Louis XIV », « François Ier », « Napoléon III » tels qu'on les dit : « quatorze », « premier », « trois ». */
function souverainEnMots(romain: string): string | undefined {
  if (romain === 'Ier') return 'premier';
  const n = romainEnNombre(romain);
  return n === undefined ? undefined : cardinalEnMots(n);
}

/** Les chiffres romains bien formés de 1 à 39 (« VV » ou « IIII » n'en sont pas). */
const ROMAIN_VALIDE = /^X{0,3}(IX|IV|V?I{0,3})$/;

function romainEnNombre(romain: string): number | undefined {
  if (!ROMAIN_VALIDE.test(romain)) return undefined;
  let n = 0;
  for (let i = 0; i < romain.length; i++) {
    const v = ROMAINS[romain[i]];
    const suivant = ROMAINS[romain[i + 1]] ?? 0;
    n += v < suivant ? -v : v;
  }
  return n < 1 || n > 21 ? undefined : n;
}

function cardinalEnMots(n: number): string {
  return n <= 16 ? UNITES[n] : n < 20 ? `dix-${UNITES[n - 10]}` : n === 20 ? 'vingt' : 'vingt-et-un';
}

/**
 * Lit un texte. Sur une île qui a des mots marqués (le latin, le grec, une langue vivante citée : ./foreignWords.ts), un
 * texte français se lit en morceaux, chacun dans sa voix ; `onEnd` vient après le dernier.
 */
export function speak(text: string, rate = 0.9, onEnd?: () => void, lang: Lang = 'fr'): void {
  if (!isSpeechAvailable() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const segments = lang === 'fr' ? segmentsForSpeech(text, motsEtrangersCourants()) : [{ text, lang }];
  const voices = window.speechSynthesis.getVoices();
  segments.forEach((s, i) => {
    const utterance = new SpeechSynthesisUtterance(pourLaVoix(s.text, s.lang));
    utterance.lang = LOCALES[s.lang];
    utterance.rate = rate;
    const voice = pickVoice(voices, s.lang);
    if (voice) utterance.voice = voice;
    if (onEnd && i === segments.length - 1) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  });
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
