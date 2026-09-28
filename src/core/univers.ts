// L'univers de l'appareil (lot 6, docs/conception/univers.md et cadrage-archipeo.md, « Les fils du lot 6 ») : Archipéo
// ou Blocland. Il choisit le dessin du monde et le titre ; jamais les règles, jamais la progression, commune aux deux.
// Tout passe derrière `UNIVERS_OUVERT`, fausse jusqu'à la bascule : tant qu'elle l'est, l'élève ne voit rien changer
// (titre « Archipéo », monde en blocs, section Expérimental) et le champ `univers` des réglages n'est jamais écrit.
import type { AnyIconName } from '../components/Icon';

/** La bascule du lot 6 : vraie, le réglage « Univers » remplace la section Expérimental. */
export const UNIVERS_OUVERT = false;

export type UniversChoice = 'archipeo' | 'blocland';

/**
 * L'univers par défaut : Blocland, le monde en blocs auquel les élèves tiennent (décision du mainteneur, 28 septembre
 * 2026, docs/conception/univers.md §7, décision 7). Archipéo se choisit dans les Réglages.
 */
export const UNIVERS_PAR_DEFAUT: UniversChoice = 'blocland';

export interface UniversInfo {
  /** Le nom de l'univers : l'écran titre, le menu, le retour vers la Carte. */
  nom: string;
  /** La phrase sous le titre. */
  phrase: string;
  icone: AnyIconName;
  /** Le logo de l'écran titre et de la barre du haut, dans public/ (l'icône de l'appli installée est commune). */
  logo: string;
  /** La présentation dans les Réglages, lue à voix haute. */
  presentation: string;
  /** Le retour vers la Carte (l'élision d'Archipéo ne se calcule pas). */
  carte: string;
  /** La première bulle du tutoriel du village. */
  bienvenue: string;
}

// Blocland d'abord : c'est l'ordre des Réglages (Archipéo n'est pas mis en avant, mainteneur, 28 septembre 2026).
export const UNIVERS: Record<UniversChoice, UniversInfo> = {
  blocland: {
    nom: 'Blocland',
    phrase: 'Chaque bloc construit ton monde.',
    icone: 'cube',
    logo: 'blocland.svg',
    presentation: 'Un monde en cubes, où tu reconstruis le village bloc par bloc.',
    carte: 'Carte de Blocland',
    bienvenue: 'Bienvenue à Blocland ! Le village est en ruine : c’est toi qui le reconstruis, île par île.',
  },
  archipeo: {
    nom: 'Archipéo',
    phrase: 'Le savoir construit ton monde.',
    icone: 'ancre',
    logo: 'archipeo.svg',
    presentation: 'Une aventure en mer : ton savoir reconstruit l’archipel.',
    carte: 'Carte d’Archipéo',
    bienvenue: 'Bienvenue dans Archipéo ! Le village est en ruine : c’est toi qui le reconstruis, île par île.',
  },
};

export const UNIVERS_IDS = Object.keys(UNIVERS) as UniversChoice[];

/** Ce qu'il faut savoir de l'appareil pour son premier univers, lu une seule fois au premier lancement. */
export interface AvantUnivers {
  /** Une progression enregistrée (des réponses, de l'XP, une étoile). */
  progression: boolean;
}

/**
 * Le message unique qui présente Archipéo : éteint, Archipéo n'est pas mis en avant pour l'instant (mainteneur,
 * 28 septembre 2026, décision 9 de univers.md). Il se choisit dans les Réglages, sans qu'aucun écran ne le propose.
 */
export const PRESENTER_ARCHIPEO = false;

/**
 * Le premier univers d'un appareil, figé ensuite dans les réglages : toujours Blocland, l'univers par défaut. Archipéo
 * ne s'active que dans les Réglages, jamais d'office, même pour un appareil qui essayait la section Expérimental
 * (décisions 7 et 8 de univers.md). Le message unique, s'il est rallumé (`PRESENTER_ARCHIPEO`), n'est dit qu'à un
 * appareil qui a déjà une progression ; un appareil neuf n'a rien à apprendre de nouveau.
 */
export function premierUnivers({ progression }: AvantUnivers, presenter = PRESENTER_ARCHIPEO): { univers: UniversChoice; message: boolean } {
  return { univers: UNIVERS_PAR_DEFAUT, message: presenter && progression };
}

/** Une progression enregistrée, d'après les sauvegardes brutes de l'appareil (`progress` et `blocland`). */
export function aUneProgression(progress: unknown, blocland: unknown): boolean {
  const p = (progress ?? {}) as { xp?: unknown; totalAnswers?: unknown };
  const b = (blocland ?? {}) as { progress?: unknown };
  const etoiles = typeof b.progress === 'object' && b.progress !== null && Object.keys(b.progress).length > 0;
  return Number(p.xp) > 0 || Number(p.totalAnswers) > 0 || etoiles;
}

/**
 * L'univers qui se voit : celui des réglages une fois ouvert (l'univers par défaut s'il n'y en a pas) ; avant la
 * bascule, les textes restent ceux d'aujourd'hui, c'est-à-dire ceux d'Archipéo.
 */
export function titreAffiche(univers: UniversChoice | undefined, ouvert: boolean): UniversChoice {
  return ouvert ? (univers ?? UNIVERS_PAR_DEFAUT) : 'archipeo';
}

// Le message unique, noté par appareil comme ce que la baleine a déjà dit (WhaleWord), jamais dans la sauvegarde :
// `{ dit: false }` quand il reste à dire, `{ dit: true }` une fois lu ; absent, il n'y a rien à dire.
export const MESSAGE_UNIVERS_KEY = 'univers-message';

export const MESSAGE_UNIVERS = {
  titre: 'Un nouvel univers : Archipéo',
  texte:
    'Ton monde en blocs s’appelle maintenant Blocland. Archipéo est une aventure en mer. Tes étoiles, tes blocs, tes plans et tes missions restent les mêmes. Tu peux changer d’univers quand tu veux, dans les Réglages.',
  voir: 'Voir le réglage',
  rester: 'Rester dans Blocland',
};

/** La confirmation d'un changement d'univers : ce qui change, ce qui reste (univers.md §6.1). */
export const CONFIRMATION_UNIVERS = {
  titre: (vers: UniversChoice) => `Passer à ${UNIVERS[vers].nom} ?`,
  texte:
    'Ce qui change : le dessin du monde, le titre et l’histoire. Les îles gardent leur nom. Ce qui reste : tes étoiles, tes blocs, tes plans et tes missions. Le changement se voit au retour au village.',
  changer: 'Changer d’univers',
  annuler: 'Annuler',
};
