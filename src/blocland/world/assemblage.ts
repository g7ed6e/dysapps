// L'assemblage des blocs (GD-2, décidée par le mainteneur le 30 septembre 2026) : un bloc assemblé par archipel, qu'aucune
// île ne donne, fait de blocs de deux îles de son archipel, dans un lieu de l'île de l'école (la Fabrique dans Blocland,
// la Halle aux matériaux dans Archipéo). Seuls les monuments de son archipel en demandent, aux endroits qui comptent.
// La recette est fixe et toujours affichée ; un toucher assemble un bloc, sans grille ni recette à deviner. Code pur,
// commun aux univers. Les recettes et les noms (du lieu et des blocs, propres à chaque univers) s'écrivent dans
// docs/contenu/assemblage.md, que `npm run contenu` recopie dans recettes.ts ; les textes d'univers les reprennent.
import type { BlockId } from '../biomes';
import type { ArchipelagoId } from './archipels';
import { ASSEMBLAGE } from './recettes';

/** L'adresse du lieu (dans le monde en 3D ou en 2D : son panneau ; en vue simple : sa page). */
export const ASSEMBLAGE_PATH = '/aventure/assemblage';

/**
 * Les univers que nomme docs/contenu/assemblage.md, par leur identifiant (ceux de `core/univers`, qu'un test compare).
 * Ce module n'importe pas la couche des univers (couches.test.ts) : ce sont les univers qui lisent ces noms, et
 * `nomDuBloc` (biomes.ts) prend l'univers choisi par `universCourant`, comme la LV2 par `lv2Courante`.
 */
export type UniversNomme = 'blocland' | 'archipeo';

/** Le nom d'un bloc dans un univers, et son pluriel quand il ne s'écrit pas en ajoutant un « s ». */
export interface NomDeBloc {
  nom: string;
  pluriel?: string;
}

/** Le lieu où l'on assemble, dans un univers. */
export interface LieuDAssemblage {
  /** Son nom, avec sa majuscule et son article : le titre de sa page (« La Fabrique »). */
  titre: string;
  /** Où c'est, après « va » : « à la Fabrique ». */
  a: string;
  /** Ce qu'on y fait, en une phrase, sous le titre (lue à voix haute). */
  presentation: string;
}

/** Ce que docs/contenu/assemblage.md donne (`npm run contenu` → recettes.ts) : le lieu et les recettes, nommés par univers. */
export interface Assemblage {
  lieu: Record<UniversNomme, LieuDAssemblage>;
  recettes: (Recette & { noms: Record<UniversNomme, NomDeBloc> })[];
}

export interface Recette {
  /** Le bloc assemblé. */
  bloc: BlockId;
  /** L'archipel dont il vient : ses ingrédients sont des blocs d'îles de cet archipel, ses monuments le demandent. */
  archipelago: ArchipelagoId;
  /**
   * Ce qu'il coûte, le bloc dont il faut le plus d'abord : trois blocs de deux îles (référent dys : deux sortes au plus,
   * de petits nombres ; directeur du contenu : trois pour un garde un monument à une séance de plus au plus).
   */
  ingredients: { bloc: BlockId; n: number }[];
}

/** Les recettes, une par archipel, dans l'ordre des archipels (docs/contenu/assemblage.md). */
export const RECETTES: Recette[] = ASSEMBLAGE.recettes.map(({ bloc, archipelago, ingredients }) => ({ bloc, archipelago, ingredients }));

/** Les noms des blocs assemblés dans un univers (les textes d'univers les reprennent). */
export function nomsAssembles(univers: UniversNomme): Partial<Record<BlockId, NomDeBloc>> {
  return Object.fromEntries(ASSEMBLAGE.recettes.map((r) => [r.bloc, r.noms[univers]]));
}

/** Le nom qu'un univers donne à un bloc assemblé (rien pour un autre bloc). */
export function nomAssemble(bloc: BlockId, univers: UniversNomme): NomDeBloc | undefined {
  return ASSEMBLAGE.recettes.find((r) => r.bloc === bloc)?.noms[univers];
}

/** Le lieu où l'on assemble, dans un univers. */
export function lieuDAssemblage(univers: UniversNomme): LieuDAssemblage {
  return ASSEMBLAGE.lieu[univers];
}

export function recetteDe(bloc: BlockId): Recette | undefined {
  return RECETTES.find((r) => r.bloc === bloc);
}

export function recetteDeLArchipel(a: ArchipelagoId): Recette | undefined {
  return RECETTES.find((r) => r.archipelago === a);
}

/** Combien de blocs de cette recette l'inventaire permet d'assembler. */
export function assemblables(inventory: Partial<Record<BlockId, number>>, r: Recette): number {
  return Math.min(...r.ingredients.map((i) => Math.floor((inventory[i.bloc] ?? 0) / i.n)));
}

/** Ce qui manque pour assembler un bloc, bloc par bloc (vide quand on peut). */
export function manquePour(inventory: Partial<Record<BlockId, number>>, r: Recette): { bloc: BlockId; n: number }[] {
  return r.ingredients.filter((i) => (inventory[i.bloc] ?? 0) < i.n).map((i) => ({ bloc: i.bloc, n: i.n - (inventory[i.bloc] ?? 0) }));
}

// ---------- Les questions (GD-2, décision du mainteneur du 1er octobre 2026) ----------
// Chaque bloc assemblé demande de répondre à une question sur les deux matières de sa recette (docs/contenu/assemblage.md,
// « Les questions »). Une question à la fois, tirée pour l'élève : une permutation des questions du bloc par tour, propre
// à l'élève (sa graine), parcourue en boucle ; jamais l'une des 6 dernières posées pour ce bloc ; une question manquée
// revient, après au moins 3 autres, dès qu'elle n'est plus parmi les 6 dernières. On note une question à sa réponse
// finale (juste, ou manquée au second essai) : quitter avant ne change rien.

/** Jamais une question parmi les dernières posées pour ce bloc (moins s'il a trop peu de questions pour cela). */
export const QUESTIONS_SANS_REDITE = 6;
/** Une question manquée revient après au moins ce nombre d'autres questions. */
export const RETOUR_DE_LA_MANQUEE = 3;
/** Un tour lu dans une sauvegarde ne dépasse pas ce nombre (une valeur abîmée ne grossit pas la graine sans fin). */
const TOUR_MAX = 100_000;
/** Au plus tant de questions manquées gardées par bloc (une sauvegarde reste petite). */
const MANQUEES_GARDEES = 24;

/** Le tirage des questions d'un bloc assemblé pour un élève : ce que la sauvegarde en retient. */
export interface TirageAssemblage {
  /** La graine de l'élève pour ce bloc, tirée une fois : l'ordre de ses questions à chaque tour. */
  graine: string;
  /** Le tour de la permutation (0, 1, 2…) : chaque tour a son ordre, et place autrement les choix. */
  tour: number;
  /** Les questions de ce tour déjà posées. Toutes posées : le tour suivant commence. */
  posees: string[];
  /** Les dernières questions posées, la plus récente à la fin (6 au plus). */
  recentes: string[];
  /** Les questions manquées qui reviendront, la plus ancienne d'abord. */
  ratees: string[];
}

/** Un tirage neuf, pour un élève qui n'a encore répondu à aucune question de ce bloc. */
export function tirageNeuf(graine: string): TirageAssemblage {
  return { graine, tour: 0, posees: [], recentes: [], ratees: [] };
}

/** Un générateur reproductible (mulberry32) : la même suite pour la même graine. */
function hasard(graine: string): () => number {
  let s = 0;
  for (const ch of graine) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** L'ordre des questions d'un tour : une permutation propre à l'élève (sa graine) et au tour. */
export function ordreDuTour(cles: readonly string[], t: Pick<TirageAssemblage, 'graine' | 'tour'>): string[] {
  const rng = hasard(`${t.graine}:${t.tour}`);
  for (let k = 0; k < 4; k++) rng();
  const out = [...cles];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Combien de dernières questions ne reviennent pas : 6, ou moins pour un bloc de 6 questions ou moins. */
function sansRedite(cles: readonly string[]): number {
  return Math.max(0, Math.min(QUESTIONS_SANS_REDITE, cles.length - 1));
}

/**
 * La question à poser (sa clé), parmi `cles` (les questions du bloc, dans l'ordre du fichier) : d'abord une question
 * manquée qui peut revenir, sinon la suivante du tour dans l'ordre de l'élève qui n'est pas parmi les dernières posées.
 */
export function prochaineQuestion(cles: readonly string[], t: TirageAssemblage): string | undefined {
  if (cles.length === 0) return undefined;
  const connues = new Set(cles);
  const recentes = t.recentes.filter((k) => connues.has(k));
  const bloquees = new Set(recentes.slice(recentes.length - sansRedite(cles)));
  // Une manquée : jamais parmi les dernières posées, et au moins RETOUR_DE_LA_MANQUEE autres depuis.
  const attente = new Set(recentes.slice(Math.max(0, recentes.length - Math.max(sansRedite(cles), RETOUR_DE_LA_MANQUEE))));
  const manquee = t.ratees.find((k) => connues.has(k) && !bloquees.has(k) && !attente.has(k));
  if (manquee) return manquee;
  const ordre = ordreDuTour(cles, t);
  const posees = new Set(t.posees);
  const suivante = ordre.find((k) => !posees.has(k) && !bloquees.has(k));
  if (suivante) return suivante;
  // Ce qui reste du tour vient d'être posé (une manquée reposée entre-temps) : une autre du tour, hors des dernières.
  const autre = ordre.find((k) => !bloquees.has(k));
  if (autre) return autre;
  // Un bloc d'une seule question.
  return ordre[0];
}

/**
 * Note la réponse finale à une question : juste (du premier coup ou au second essai) ou manquée (deux erreurs). Elle
 * entre dans les dernières posées et dans le tour ; manquée, elle reviendra ; juste, elle ne revient plus en avance.
 */
export function noterQuestion(cles: readonly string[], t: TirageAssemblage, cle: string, juste: boolean): TirageAssemblage {
  const connues = new Set(cles);
  if (!connues.has(cle)) return t;
  const recentes = [...t.recentes.filter((k) => k !== cle && connues.has(k)), cle].slice(-QUESTIONS_SANS_REDITE);
  let posees = [...new Set([...t.posees.filter((k) => connues.has(k)), cle])];
  let tour = t.tour;
  if (cles.every((k) => posees.includes(k))) {
    tour += 1;
    posees = [];
  }
  const autres = t.ratees.filter((k) => k !== cle && connues.has(k));
  const ratees = (juste ? autres : [...autres, cle]).slice(-MANQUEES_GARDEES);
  return { graine: t.graine, tour, posees, recentes, ratees };
}

/** Un tirage lu dans une sauvegarde : gardé s'il a sa graine, ses listes nettoyées ; sinon rien. */
export function lireTirage(raw: unknown): TirageAssemblage | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.graine !== 'string' || r.graine.length === 0 || r.graine.length > 64) return undefined;
  const cles = (v: unknown, max: number) =>
    Array.isArray(v) ? [...new Set(v.filter((k): k is string => typeof k === 'string' && k.length > 0 && k.length <= 64))].slice(-max) : [];
  const tour = Number(r.tour);
  return {
    graine: r.graine,
    tour: Number.isInteger(tour) && tour >= 0 ? Math.min(tour, TOUR_MAX) : 0,
    posees: cles(r.posees, 200),
    recentes: cles(r.recentes, QUESTIONS_SANS_REDITE),
    ratees: cles(r.ratees, MANQUEES_GARDEES),
  };
}
