// Catalogue des exercices Blocland : des fichiers JSON (data/), plus ceux dérivés des données existantes et des générateurs.
// Le bundle principal ne porte que l'index des exercices JSON (id, île, type, niveau, par le plugin
// scripts/exerciseMeta.mjs) ; leur contenu est chargé à la demande, au lancement d'une partie ou d'un Gardien.
// Le service worker met ces fichiers en cache à l'installation : ils restent disponibles hors ligne.
import { SETS } from '../../apps/homophones/data';
import type { BiomeId } from '../biomes';
import type { ExerciseDef } from './types';
import { MATHS_EXERCISES } from './maths';
import { COLLEGE_EXERCISES } from './college';
import { PROBLEMES_EXERCISES } from './problemes';

/** Ce qu'il faut d'un exercice pour les listes, les étoiles et le choix de la partie : sans ses items. */
export type ExerciseMeta = Pick<ExerciseDef, 'id' | 'biome' | 'type' | 'level'>;

const JSON_META = import.meta.glob<ExerciseMeta>('./data/*.json', { eager: true, query: '?meta', import: 'default' });
const JSON_LOADERS = import.meta.glob<ExerciseDef>('./data/*.json', { import: 'default' });
/** Chargement du contenu d'un exercice JSON, par son id. */
const LOADERS = new Map(Object.entries(JSON_META).map(([path, meta]) => [meta.id, JSON_LOADERS[path]]));

/** Tri des graines : les phrases à trous viennent de la mission Homophones (a/à, et/est, on/ont, son/sont, ce/se). */
const GRAINES_SETS = ['a', 'et', 'on', 'son', 'ce'];
const graines: ExerciseDef[] = SETS.filter((s) => GRAINES_SETS.includes(s.id)).map((set) => ({
  id: `ferme-graines-${set.id}`,
  biome: 'ferme',
  type: 'graines',
  level: 1,
  instruction: `Complète chaque phrase avec ${set.label}. Astuce : ${set.hint}`,
  target: set.label,
  items: set.sentences.map((s, i) => ({
    key: `${set.id}-${i}`,
    prompt: s.text,
    spoken: s.text.replace('…', ' (mot manquant) '),
    choices: set.choices,
    answer: s.answer,
    rule: set.rules[s.answer],
    hint: set.hint,
  })),
  feedback: { correct: 'Bien trié !', wrong: '{rule} Astuce : {hint}' },
  reward: { block: 'terre', amount: 4, xp: 12 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

/** Panneaux (Carrefour des homophones) : les autres jeux de la mission Homophones, avec la règle affichée. */
const PANNEAUX_SETS: Record<string, number> = { ces: 1, ou: 1, la: 1, leur: 1, quand: 2, peu: 2, cest: 2 };
const panneaux: ExerciseDef[] = SETS.filter((s) => s.id in PANNEAUX_SETS).map((set) => ({
  id: `carrefour-panneaux-${set.id}`,
  biome: 'carrefour',
  type: 'panneaux',
  level: PANNEAUX_SETS[set.id],
  instruction: `Complète chaque phrase avec ${set.label}. La règle est affichée : lis-la avant de répondre.`,
  target: set.label,
  items: set.sentences.map((s, i) => ({
    key: `${set.id}-${i}`,
    prompt: s.text,
    spoken: s.text.replace('…', ' (mot manquant) '),
    choices: set.choices,
    answer: s.answer,
    hint: set.hint,
    explanation: set.rules[s.answer],
    aid: { kind: 'rule-card', props: { title: set.label, lines: Object.values(set.rules) } },
  })),
  feedback: { correct: 'Bonne route !', wrong: '{explanation}' },
  reward: { block: 'panneau', amount: 4, xp: 14 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

/** Les exercices écrits en code (générateurs, dérivés de la mission Homophones) : déjà là, rien à charger. */
const CODE_EXERCISES: ExerciseDef[] = [...graines, ...MATHS_EXERCISES, ...PROBLEMES_EXERCISES, ...COLLEGE_EXERCISES, ...panneaux];

/**
 * L'ordre du catalogue : celui de la progression dans une île (il départage les variantes d'un même niveau et
 * ordonne les pages de la documentation). Un exercice JSON par son id, les exercices en code par groupe.
 * Un fichier de data/ absent de cette liste fait échouer les tests (data.test.ts).
 */
const ORDER: (string | ExerciseDef[])[] = [
  'foret-echauffement-001', 'foret-echauffement-002', 'foret-echauffement-003', 'foret-chasse-son-an', 'foret-chasse-son-on',
  'foret-chasse-son-oi', 'foret-chasse-son-in', 'foret-chasse-son-ch', 'foret-chasse-son-s', 'foret-chasse-son-in-3', 'mine-filon-b',
  'mine-filon-d', 'mine-filon-p', 'mine-filon-q', 'mine-filon-mix-1', 'mine-filon-mix-2', 'carriere-mot-troue-1',
  'carriere-mot-troue-2', graines, 'tour-ascension-mousso', 'tour-ascension-tunel', 'tour-ascension-pont',
  'foret-rimes-eau', 'foret-rimes-on', 'foret-rimes-ette', 'foret-rimes-oire', 'mine-oreille-1', 'mine-oreille-2', 'carriere-coffre-1',
  'carriere-coffre-2', 'carriere-familles-1', 'carriere-familles-2', 'ferme-enclos-1', 'ferme-enclos-2',
  'ferme-recolte-1', 'ferme-recolte-2', MATHS_EXERCISES, PROBLEMES_EXERCISES, COLLEGE_EXERCISES, panneaux, 'carrefour-aiguillage-1',
  'carrefour-aiguillage-2', 'carrefour-bifurcation-1', 'carrefour-bifurcation-2', 'marais-rives-1', 'marais-rives-2',
  'marais-brume-1', 'marais-brume-2', 'marais-roseaux-1', 'marais-roseaux-2', 'falaise-corde-1', 'falaise-corde-2',
  'falaise-paroi-1', 'falaise-paroi-2', 'falaise-sommet-1', 'falaise-sommet-2', 'cabinet-racines-1',
  'cabinet-racines-2', 'cabinet-sens-1', 'cabinet-nuances-1', 'textes-inferences-1', 'textes-inferences-2',
  'textes-figures-1', 'textes-figures-2', 'textes-rouages-1', 'textes-rouages-2', 'baie-hello-1', 'baie-hello-2',
  'baie-numbers-1', 'baie-numbers-2', 'baie-ears-1', 'baie-ears-2', 'horloge-to-be-1', 'horloge-to-be-2',
  'horloge-have-got-1', 'horloge-have-got-2', 'horloge-present-simple-1', 'horloge-present-simple-2',
  'comptoir-shopping-1', 'comptoir-shopping-2', 'comptoir-routine-1', 'comptoir-routine-2', 'comptoir-listening-1',
  'comptoir-listening-2', 'manoir-ing-1', 'manoir-ing-2', 'manoir-preterit-1', 'manoir-preterit-2',
  'manoir-comparatifs-1', 'manoir-comparatifs-2', 'theatre-dialogues-1', 'theatre-dialogues-2', 'theatre-quantites-1',
  'theatre-quantites-2', 'theatre-preterit-irregulier-1', 'theatre-preterit-irregulier-2', 'gare-futur-1',
  'gare-futur-2', 'gare-modaux-1', 'gare-modaux-2', 'gare-present-perfect-1', 'gare-present-perfect-2',
  'studio-comprendre-1', 'studio-comprendre-2', 'studio-connecteurs-1', 'studio-connecteurs-2', 'studio-faux-amis-1',
  'studio-faux-amis-2', 'chateau-for-since-1', 'chateau-for-since-2', 'chateau-if-1', 'chateau-if-2',
  'chateau-passif-1', 'chateau-passif-2',
];

const metaOf = ({ id, biome, type, level }: ExerciseMeta): ExerciseMeta => ({ id, biome, type, level });
const JSON_BY_ID = new Map(Object.values(JSON_META).map((m) => [m.id, m]));

/** Tous les exercices, sans leurs items. */
export const CATALOG: ExerciseMeta[] = ORDER.flatMap((entry) =>
  typeof entry === 'string' ? (JSON_BY_ID.has(entry) ? [JSON_BY_ID.get(entry)!] : []) : entry.map(metaOf),
);

/** Les exercices JSON de data/ que `ORDER` oublie (vide : vérifié par les tests). */
export const UNORDERED = [...JSON_BY_ID.keys()].filter((id) => !ORDER.includes(id));

/** Le contenu d'un exercice (ses items, sa consigne…), chargé à la demande pour un exercice JSON. */
export async function loadExercise(id: string): Promise<ExerciseDef | undefined> {
  const code = CODE_EXERCISES.find((e) => e.id === id);
  if (code) return code;
  return LOADERS.get(id)?.();
}

/** Tous les exercices avec leur contenu (tests, documentation générée). */
export async function loadAllExercises(): Promise<ExerciseDef[]> {
  return Promise.all(CATALOG.map(async (m) => (await loadExercise(m.id))!));
}

/** Exercices d'un type dans un biome, par niveau croissant. */
export function exercisesOf(biome: BiomeId, type: string): ExerciseMeta[] {
  return CATALOG.filter((e) => e.biome === biome && e.type === type).sort((a, b) => a.level - b.level);
}

/**
 * L'exercice à jouer : au niveau demandé (ou le plus proche en dessous), et parmi ceux-là
 * le moins joué, pour varier les contenus.
 */
export function pickExercise(
  biome: BiomeId,
  type: string,
  level: number,
  progress: Record<string, { attempts: number }> = {},
  toReview: Set<string> = new Set(),
): ExerciseMeta | undefined {
  const all = exercisesOf(biome, type);
  if (all.length === 0) return undefined;
  // Une variante qui a des items à revoir aujourd'hui passe en premier (la plus haute, sans dépasser le niveau).
  const review = all.filter((e) => toReview.has(e.id) && e.level <= level);
  if (review.length) return review[review.length - 1];
  const below = all.filter((e) => e.level <= level);
  const target = below.length ? below[below.length - 1].level : all[0].level;
  const candidates = all.filter((e) => e.level === target);
  return candidates.reduce((best, e) => ((progress[e.id]?.attempts ?? 0) < (progress[best.id]?.attempts ?? 0) ? e : best), candidates[0]);
}

/**
 * Progression d'une mission, toutes variantes et tous niveaux confondus : meilleures étoiles, meilleur score,
 * parties cumulées. `undefined` si aucune n'a été jouée. (La liste des missions ne doit pas afficher « Nouveau »
 * parce que la prochaine partie tombe sur une variante ou un niveau pas encore joué.)
 */
export function questProgress(
  biome: BiomeId,
  type: string,
  progress: Record<string, { stars: number; attempts: number; best: number }>,
): { stars: number; attempts: number; best: number } | undefined {
  const played = exercisesOf(biome, type)
    .map((e) => progress[e.id])
    .filter((p) => p !== undefined);
  if (played.length === 0) return undefined;
  return {
    stars: Math.max(...played.map((p) => p.stars)),
    attempts: played.reduce((n, p) => n + p.attempts, 0),
    best: Math.max(...played.map((p) => p.best)),
  };
}
