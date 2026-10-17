// La remise (GD-20, point 4, piste B « La remise », choisie par le mainteneur le 17 octobre 2026 ; lot L1 « Livrer ») :
// l'élève livre les ressources d'une commande chez l'habitant, dans la scénette de son lieu, et l'aménagement se pose
// élément par élément, un par ressource livrée. Ce fichier tient ce qui se décide sans écran : les phrases des habitants
// (docs/contenu/monde-ouvert.md, que `npm run contenu` écrit dans ./mondeOuvert.json) et leurs jetons, le temps de la pose, et le délai qui la lance quand la voix ne dit pas sa fin. La commande elle-même (son
// bloc, son nombre, sa livraison) reste dans la grille : la vue la traduit (three/archipeo/remiseOf.ts). Code pur.
//
// Le déroulé (arbitrages du directeur artistique, points 5 et 6) :
// 1. la consigne, écrite et lue (« Tu livres 3 blocs de terre pour le potager. ») ; la pose ne part jamais pendant qu'une voix
//    parle : à la fin de la lecture, ou, sans voix, après un délai borné, calculé sur la longueur de la consigne ;
// 2. la pose : un temps de calme, puis chaque élément descend à sa place, l'un après l'autre ;
// 3. l'état final : tout est posé, la phrase de fin (« Le potager est en place. »), qui remplace la consigne, « Continuer ».
// Un toucher pendant 1 ou 2 mène à l'état final, jamais plus loin. Avec « Réduire les animations », tout se pose d'un
// coup. La livraison compte à l'état final, une fois.
import PHRASES from './mondeOuvert.json';

/** Les phrases des habitants du monde ouvert, avec leurs jetons (docs/contenu/monde-ouvert.md). */
export interface HabitantPhrases {
  /** La demande : le besoin, puis le lieu de la ressource et le geste. Jetons : objet, nom, au lieu. */
  ask: string;
  /** La demande d'un bloc assemblé : le lieu où l'on assemble. Jetons : objet, nom, blocs, au lieu. */
  askAssembled: string;
  /** La commande prête : le lieu de l'habitant. Jetons : objet, au lieu. */
  ready: string;
  /** La consigne de la remise. Jetons : objet, nom. */
  remise: string;
  /** La fin : l'aménagement en place. Jeton : Nom. */
  done: string;
}

export const HABITANT_PHRASES: HabitantPhrases = PHRASES;

/** Ce que les jetons valent pour une commande. */
export interface PhraseTokens {
  /** Le nombre et le nom de la ressource (« 3 blocs de terre »). */
  objet: string;
  /** Le même nom, sans nombre (« madriers »). */
  blocs: string;
  /** La petite construction, avec son article (« le potager »). */
  nom: string;
  /** Le lieu, dans sa forme « à » (« au Phare »). */
  auLieu: string;
}

/** La première lettre en capitale (« Le potager », « L’établi »). */
export const capitalized = (s: string): string => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);

/**
 * Une phrase, ses jetons remplacés ; un jeton inconnu, ou une accolade restée seule, est une erreur (le script du
 * contenu les refuse déjà).
 */
export function filled(template: string, tokens: PhraseTokens): string {
  const values: Record<string, string> = { objet: tokens.objet, blocs: tokens.blocs, nom: tokens.nom, Nom: capitalized(tokens.nom), 'au lieu': tokens.auLieu };
  const out = template.replace(/\{([^{}]+)\}/g, (_, k: string) => {
    const v = values[k];
    if (v === undefined) throw new Error(`Jeton inconnu dans une phrase d'habitant : {${k}}`);
    return v;
  });
  if (/[{}]/.test(out)) throw new Error(`Accolade seule dans une phrase d'habitant : ${template}`);
  return out;
}

/**
 * Le temps de la pose, en secondes. La remise sans toucher, sans voix, tient en 10 s au plus (directeur artistique,
 * point 5) : le délai de lecture de la consigne (`voiceFallbackMs`, allongé pour un lecteur dyslexique par le référent
 * dys), puis cette pose ; vérifié sur les phrases réelles des seize commandes du 6e (remiseOf.test.ts).
 */
export const REMISE_TIMING = {
  /** Le calme entre la fin de la consigne et le premier élément. */
  settle: 0.8,
  /** La descente d'un élément jusqu'à sa place ; le suivant part quand il est posé. */
  element: 0.4,
} as const;

/** La hauteur d'où un élément descend, en unités du monde (celle de la pose d'une partie, à l'échelle de l'objet). */
export const REMISE_DROP = 0.9;

/** Où en est la pose, `t` secondes après son départ. */
export interface RemiseMoment {
  /** Les éléments posés. */
  posed: number;
  /** L'élément qui descend, et sa part du chemin (0 en haut, 1 posé), s'il y en a un. */
  falling: { index: number; amount: number } | null;
  /** Tout est posé : l'état final. */
  done: boolean;
}

/** La durée de la pose de `elements` éléments (sans le calme, rien à poser : l'état final tout de suite). */
export const remiseDuration = (elements: number): number => (elements > 0 ? REMISE_TIMING.settle + elements * REMISE_TIMING.element : 0);

/** La pose à l'instant `t` : avec « Réduire les animations » (`reduce`), tout est posé d'un coup. */
export function remiseAt(t: number, elements: number, reduce: boolean): RemiseMoment {
  if (reduce || t >= remiseDuration(elements)) return { posed: elements, falling: null, done: true };
  const u = t - REMISE_TIMING.settle;
  if (u < 0) return { posed: 0, falling: null, done: false };
  const index = Math.min(elements - 1, Math.floor(u / REMISE_TIMING.element));
  return { posed: index, falling: { index, amount: (u - index * REMISE_TIMING.element) / REMISE_TIMING.element }, done: false };
}

/**
 * Le délai, en millisecondes, après lequel la pose part quand la voix ne dit pas sa fin (coupée, absente, ou sa fin qui
 * n'arrive pas) : le temps de lire la consigne pour un lecteur dyslexique (référent dys, relecture du lot L1 : de 7 à 10
 * caractères par seconde), 1,5 s et 110 ms par caractère, borné entre 3 et 8 s.
 */
export const VOICE_FALLBACK = { base: 1500, perChar: 110, min: 3000, max: 8000 } as const;

export function voiceFallbackMs(text: string): number {
  return Math.min(VOICE_FALLBACK.max, Math.max(VOICE_FALLBACK.min, VOICE_FALLBACK.base + text.length * VOICE_FALLBACK.perChar));
}

/**
 * Le plus long qu'on attende une voix qui parle encore (sa fin jamais dite) avant de poser quand même : la pose ne part
 * jamais pendant qu'une voix parle, sauf si elle ne s'arrête jamais.
 */
export const VOICE_CAP_MS = 12000;
