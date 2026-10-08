// Catalogue des exercices Blocland : des fichiers JSON (data/), plus ceux dérivés des données existantes et des générateurs.
// Le bundle principal ne porte que l'index des exercices JSON (id, île, type, niveau, par le plugin
// scripts/exerciseMeta.mjs) ; leur contenu est chargé à la demande, au lancement d'une partie ou d'un Gardien.
// Le service worker met ces fichiers en cache à l'installation : ils restent disponibles hors ligne.
import { SETS } from '../../apps/homophones/data';
import type { BiomeId, BlockId } from '../biomes';
import type { AssemblageDef, ExerciseDef } from './types';
import { MATHS_EXERCISES } from './maths';
import { COLLEGE_EXERCISES } from './college';
import { POSEES_EXERCISES } from './writtenOperations';
import { VOLCAN_EXERCISES } from './volcano';
import { PROBLEMES_COLLEGE_EXERCISES, PROBLEMES_EXERCISES } from './problems';

/** Ce qu'il faut d'un exercice pour les listes, les étoiles et le choix de la partie : sans ses items. */
export type ExerciseMeta = Pick<ExerciseDef, 'id' | 'biome' | 'type' | 'level'>;

const JSON_META = import.meta.glob<ExerciseMeta>('./data/*.json', { eager: true, query: '?meta', import: 'default' });
const JSON_LOADERS = import.meta.glob<ExerciseDef>('./data/*.json', { import: 'default' });
/** Chargement du contenu d'un exercice JSON, par son id. */
const LOADERS = new Map(Object.entries(JSON_META).map(([path, meta]) => [meta.id, JSON_LOADERS[path]]));

/** Tri des graines : les phrases à trous viennent de la mission Homophones (a/à, et/est, on/ont, son/sont, ce/se). */
const GRAINES_SETS = ['a', 'et', 'on', 'son', 'ce'];
const graines: ExerciseDef[] = SETS.filter((s) => GRAINES_SETS.includes(s.id)).map((set) => ({
  id: `french-6e-grammar-spelling-sorting-${set.id}`,
  biome: 'french-6e-grammar-spelling',
  type: 'sorting',
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
  reward: { block: 'french-6e-grammar-spelling', amount: 4, xp: 12 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

/** Panneaux (Carrefour des homophones) : les autres jeux de la mission Homophones, avec la règle affichée. */
// ou / où et quand / quant / qu’en (des conjonctions, en 4e avec les programmes de 2026) restent au portail seulement.
const PANNEAUX_SETS: Record<string, number> = { ces: 1, la: 1, leur: 1, peu: 2, cest: 2 };
const panneaux: ExerciseDef[] = SETS.filter((s) => s.id in PANNEAUX_SETS).map((set) => ({
  id: `french-5e-homophones-pairs-${set.id}`,
  biome: 'french-5e-homophones',
  type: 'pairs',
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
  reward: { block: 'french-5e-homophones', amount: 4, xp: 14 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
}));

/** Les exercices écrits en code (générateurs, dérivés de la mission Homophones) : déjà là, rien à charger. */
const CODE_EXERCISES: ExerciseDef[] = [...graines, ...MATHS_EXERCISES, ...POSEES_EXERCISES, ...VOLCAN_EXERCISES, ...PROBLEMES_EXERCISES, ...COLLEGE_EXERCISES, ...PROBLEMES_COLLEGE_EXERCISES, ...panneaux];

/**
 * L'ordre du catalogue : celui de la progression dans une île (il départage les variantes d'un même niveau et
 * ordonne les pages de la documentation). Un exercice JSON par son id, les exercices en code par groupe.
 * Un fichier de data/ absent de cette liste fait échouer les tests (data.test.ts).
 */
const ORDER: (string | ExerciseDef[])[] = [
  'french-6e-phonology-syllables-warmup-001', 'french-6e-phonology-syllables-warmup-002', 'french-6e-phonology-syllables-warmup-003', 'french-6e-phonology-sound-hunt-an', 'french-6e-phonology-sound-hunt-on',
  'french-6e-phonology-sound-hunt-oi', 'french-6e-phonology-sound-hunt-in', 'french-6e-phonology-sound-hunt-ch', 'french-6e-phonology-sound-hunt-s', 'french-6e-phonology-sound-hunt-in-3', 'french-6e-letter-confusion-letter-pairs-b',
  'french-6e-letter-confusion-letter-pairs-d', 'french-6e-letter-confusion-letter-pairs-p', 'french-6e-letter-confusion-letter-pairs-q', 'french-6e-letter-confusion-letter-pairs-mix-1', 'french-6e-letter-confusion-letter-pairs-mix-2', 'french-6e-word-spelling-missing-letters-1',
  'french-6e-word-spelling-missing-letters-2', graines, 'french-6e-reading-fluency-mousso', 'french-6e-reading-fluency-tunel', 'french-6e-reading-fluency-pont', 'french-6e-reading-comprehension-1', 'french-6e-reading-comprehension-2', 'french-6e-reading-sentence-order-1', 'french-6e-reading-sentence-order-2', 'french-6e-reading-sentence-order-3',
  'french-6e-phonology-rhymes-eau', 'french-6e-phonology-rhymes-on', 'french-6e-phonology-rhymes-ette', 'french-6e-phonology-rhymes-oire', 'french-6e-letter-confusion-sound-discrimination-1', 'french-6e-letter-confusion-sound-discrimination-2', 'french-6e-word-spelling-sight-words-1',
  'french-6e-word-spelling-sight-words-2', 'french-6e-word-spelling-sight-words-3', 'french-6e-word-spelling-sight-words-4', 'french-6e-word-spelling-word-families-1', 'french-6e-word-spelling-word-families-2', 'french-6e-word-spelling-word-forms-1', 'french-6e-word-spelling-word-forms-2', 'french-6e-grammar-spelling-word-classes-1', 'french-6e-grammar-spelling-word-classes-2',
  'french-6e-grammar-spelling-e-er-ez-1', 'french-6e-grammar-spelling-e-er-ez-2', 'french-6e-grammar-spelling-plurals-1', 'french-6e-grammar-spelling-plurals-2', MATHS_EXERCISES, POSEES_EXERCISES, VOLCAN_EXERCISES, PROBLEMES_EXERCISES, COLLEGE_EXERCISES, PROBLEMES_COLLEGE_EXERCISES, panneaux, 'french-5e-homophones-choices-1',
  'french-5e-homophones-choices-2', 'french-5e-homophones-choices-3', 'french-5e-homophones-homophone-sentences-1', 'french-5e-homophones-homophone-sentences-2', 'french-5e-conjugation-past-tenses-1', 'french-5e-conjugation-past-tenses-2',
  'french-5e-conjugation-future-tense-1', 'french-5e-conjugation-future-tense-2', 'french-5e-conjugation-tense-recognition-1', 'french-5e-conjugation-tense-recognition-2', 'french-5e-conjugation-tense-choice-1', 'french-5e-conjugation-tense-choice-2', 'french-5e-conjugation-tense-choice-3', 'french-4e-agreement-past-participle-1', 'french-4e-agreement-past-participle-2',
  'french-4e-agreement-adjectives-1', 'french-4e-agreement-adjectives-2', 'french-4e-agreement-subject-verb-1', 'french-4e-agreement-subject-verb-2', 'french-4e-agreement-reflexive-verbs-1', 'french-4e-agreement-reflexive-verbs-2', 'french-4e-agreement-reflexive-verbs-3', 'french-4e-vocabulary-word-roots-1',
  'french-4e-vocabulary-word-roots-2', 'french-4e-vocabulary-meaning-1', 'french-4e-vocabulary-meaning-2', 'french-4e-vocabulary-meaning-3', 'french-4e-vocabulary-nuances-1', 'french-4e-vocabulary-nuances-2', 'french-4e-vocabulary-nuances-3',
  'french-4e-vocabulary-conjunctions-1', 'french-4e-vocabulary-conjunctions-2', 'french-4e-vocabulary-conjunctions-3',
  'french-3e-close-reading-inference-1', 'french-3e-close-reading-inference-2', 'french-3e-close-reading-inference-3',
  'french-3e-close-reading-figures-of-speech-1', 'french-3e-close-reading-figures-of-speech-2', 'french-3e-close-reading-figures-of-speech-3', 'french-3e-close-reading-text-connectives-1', 'french-3e-close-reading-text-connectives-2', 'french-3e-close-reading-text-connectives-3', 'french-3e-close-reading-voices-1', 'french-3e-close-reading-voices-2', 'french-3e-close-reading-voices-3', 'english-6e-vocabulary-hello-1', 'english-6e-vocabulary-hello-2',
  'english-6e-vocabulary-numbers-1', 'english-6e-vocabulary-numbers-2', 'english-6e-vocabulary-first-listening-1', 'english-6e-vocabulary-first-listening-2', 'english-6e-vocabulary-signs-1', 'english-6e-vocabulary-signs-2', 'english-6e-grammar-to-be-1', 'english-6e-grammar-to-be-2',
  'english-6e-grammar-have-got-1', 'english-6e-grammar-have-got-2', 'english-6e-grammar-present-simple-1', 'english-6e-grammar-present-simple-2',
  'english-6e-grammar-story-1', 'english-6e-grammar-story-2',
  'english-5e-vocabulary-shopping-1', 'english-5e-vocabulary-shopping-2', 'english-5e-vocabulary-routine-1', 'english-5e-vocabulary-routine-2', 'english-5e-vocabulary-listening-1',
  'english-5e-vocabulary-listening-2', 'english-5e-vocabulary-notices-1', 'english-5e-vocabulary-notices-2', 'english-5e-grammar-ing-1', 'english-5e-grammar-ing-2', 'english-5e-grammar-past-simple-1', 'english-5e-grammar-past-simple-2',
  'english-5e-grammar-comparatives-1', 'english-5e-grammar-comparatives-2', 'english-4e-comprehension-dialogues-1', 'english-4e-comprehension-dialogues-2', 'english-4e-comprehension-quantities-1',
  'english-4e-comprehension-quantities-2', 'english-4e-comprehension-irregular-past-1', 'english-4e-comprehension-irregular-past-2',
  'english-4e-comprehension-stories-1', 'english-4e-comprehension-stories-2', 'english-4e-grammar-future-1',
  'english-4e-grammar-future-2', 'english-4e-grammar-modals-1', 'english-4e-grammar-modals-2', 'english-4e-grammar-present-perfect-1', 'english-4e-grammar-present-perfect-2', 'english-4e-grammar-traditions-1', 'english-4e-grammar-traditions-2',
  'english-3e-comprehension-understanding-1', 'english-3e-comprehension-understanding-2', 'english-3e-comprehension-linking-words-1', 'english-3e-comprehension-linking-words-2', 'english-3e-comprehension-false-friends-1',
  'english-3e-comprehension-false-friends-2', 'english-3e-comprehension-media-1', 'english-3e-comprehension-media-2', 'english-3e-grammar-for-since-1', 'english-3e-grammar-for-since-2', 'english-3e-grammar-if-1', 'english-3e-grammar-if-2',
  'english-3e-grammar-passive-1', 'english-3e-grammar-passive-2',
  // Histoire et géographie (Fouille des siècles, Pointe des paysages, 6e).
  'history-6e-antiquity-early-humans-1', 'history-6e-antiquity-early-humans-2', 'history-6e-antiquity-ancient-peoples-1', 'history-6e-antiquity-ancient-peoples-2', 'history-6e-antiquity-roman-empire-1', 'history-6e-antiquity-roman-empire-2',
  'geography-6e-living-metropolises-1', 'geography-6e-living-metropolises-2', 'geography-6e-living-low-density-1', 'geography-6e-living-low-density-2', 'geography-6e-living-inhabited-world-1', 'geography-6e-living-inhabited-world-2',
  // Histoire et géographie (Bourg des chroniques, Delta des ressources, 5e ; Imprimerie des révolutions, Escale des
  // échanges, 4e ; Kiosque des témoins, Plateau des territoires, 3e).
  'history-5e-middle-ages-christendoms-islam-1', 'history-5e-middle-ages-christendoms-islam-2', 'history-5e-middle-ages-feudal-west-1', 'history-5e-middle-ages-feudal-west-2', 'history-5e-middle-ages-new-worlds-1', 'history-5e-middle-ages-new-worlds-2',
  'geography-5e-resources-population-1', 'geography-5e-resources-population-2', 'geography-5e-resources-resources-1', 'geography-5e-resources-resources-2', 'geography-5e-resources-risks-1', 'geography-5e-resources-risks-2',
  'history-4e-revolutions-enlightenment-1', 'history-4e-revolutions-enlightenment-2', 'history-4e-revolutions-industrial-europe-1', 'history-4e-revolutions-industrial-europe-2', 'history-4e-revolutions-french-society-1', 'history-4e-revolutions-french-society-2',
  'geography-4e-globalization-urbanization-1', 'geography-4e-globalization-urbanization-2', 'geography-4e-globalization-mobilities-1', 'geography-4e-globalization-mobilities-2', 'geography-4e-globalization-globalization-1', 'geography-4e-globalization-globalization-2',
  'history-3e-twentieth-century-total-wars-1', 'history-3e-twentieth-century-total-wars-2', 'history-3e-twentieth-century-world-since-1945-1', 'history-3e-twentieth-century-world-since-1945-2', 'history-3e-twentieth-century-republic-1', 'history-3e-twentieth-century-republic-2',
  'geography-3e-france-territories-1', 'geography-3e-france-territories-2', 'geography-3e-france-planning-1', 'geography-3e-france-planning-2', 'geography-3e-france-france-eu-1', 'geography-3e-france-france-eu-2',
  // Sciences et technologie (Vallée du vivant, Laboratoire des éléments, Hangar des inventions, 6e).
  'life-earth-sciences-6e-living-world-living-groups-1', 'life-earth-sciences-6e-living-world-living-groups-2', 'life-earth-sciences-6e-living-world-food-growth-1', 'life-earth-sciences-6e-living-world-food-growth-2',
  'life-earth-sciences-6e-living-world-planet-earth-1', 'life-earth-sciences-6e-living-world-planet-earth-2',
  'physics-chemistry-6e-matter-energy-states-of-matter-1', 'physics-chemistry-6e-matter-energy-states-of-matter-2', 'physics-chemistry-6e-matter-energy-motion-signals-1', 'physics-chemistry-6e-matter-energy-motion-signals-2',
  'physics-chemistry-6e-matter-energy-energy-circuits-1', 'physics-chemistry-6e-matter-energy-energy-circuits-2',
  'technology-6e-objects-object-function-1', 'technology-6e-objects-object-function-2', 'technology-6e-objects-materials-1', 'technology-6e-objects-materials-2',
  'technology-6e-objects-information-networks-1', 'technology-6e-objects-information-networks-2',
  // Sciences et technologie de la 5e à la 3e (SC-3).
  // Prairie des climats, Saline des mélanges, Menuiserie des objets, 5e.
  'life-earth-sciences-5e-active-planet-active-earth-1', 'life-earth-sciences-5e-active-planet-active-earth-2', 'life-earth-sciences-5e-active-planet-weather-climate-1',
  'life-earth-sciences-5e-active-planet-weather-climate-2', 'life-earth-sciences-5e-active-planet-human-impact-1', 'life-earth-sciences-5e-active-planet-human-impact-2',
  'physics-chemistry-5e-matter-universe-changes-of-state-1', 'physics-chemistry-5e-matter-universe-changes-of-state-2', 'physics-chemistry-5e-matter-universe-mixtures-density-1',
  'physics-chemistry-5e-matter-universe-mixtures-density-2', 'physics-chemistry-5e-matter-universe-universe-atoms-1', 'physics-chemistry-5e-matter-universe-universe-atoms-2',
  'technology-5e-design-specifications-1', 'technology-5e-design-specifications-2', 'technology-5e-design-technical-solutions-1',
  'technology-5e-design-technical-solutions-2', 'technology-5e-design-life-cycle-1', 'technology-5e-design-life-cycle-2',
  // Source des espèces, Vigie des signaux, Bassin des maquettes, 4e.
  'life-earth-sciences-4e-cells-evolution-cells-nutrition-1', 'life-earth-sciences-4e-cells-evolution-cells-nutrition-2', 'life-earth-sciences-4e-cells-evolution-heredity-1',
  'life-earth-sciences-4e-cells-evolution-heredity-2', 'life-earth-sciences-4e-cells-evolution-species-evolution-1', 'life-earth-sciences-4e-cells-evolution-species-evolution-2',
  'physics-chemistry-4e-signals-circuits-light-sound-1', 'physics-chemistry-4e-signals-circuits-light-sound-2', 'physics-chemistry-4e-signals-circuits-electric-circuits-1',
  'physics-chemistry-4e-signals-circuits-electric-circuits-2', 'physics-chemistry-4e-signals-circuits-chemical-reactions-1', 'physics-chemistry-4e-signals-circuits-chemical-reactions-2',
  'technology-4e-modeling-energy-chain-1', 'technology-4e-modeling-energy-chain-2', 'technology-4e-modeling-information-chain-1',
  'technology-4e-modeling-information-chain-2', 'technology-4e-modeling-simulation-1', 'technology-4e-modeling-simulation-2',
  // Verger de la santé, Tremplin des forces, Ruche des réseaux, 3e.
  'life-earth-sciences-3e-human-body-effort-brain-1', 'life-earth-sciences-3e-human-body-effort-brain-2', 'life-earth-sciences-3e-human-body-digestion-microbes-1',
  'life-earth-sciences-3e-human-body-digestion-microbes-2', 'life-earth-sciences-3e-human-body-puberty-reproduction-1', 'life-earth-sciences-3e-human-body-puberty-reproduction-2',
  'physics-chemistry-3e-motion-energy-motion-forces-1', 'physics-chemistry-3e-motion-energy-motion-forces-2', 'physics-chemistry-3e-motion-energy-energy-power-1',
  'physics-chemistry-3e-motion-energy-energy-power-2', 'physics-chemistry-3e-motion-energy-acids-bases-1', 'physics-chemistry-3e-motion-energy-acids-bases-2',
  'technology-3e-digital-computer-networks-1', 'technology-3e-digital-computer-networks-2', 'technology-3e-digital-connected-objects-1',
  'technology-3e-digital-connected-objects-2', 'technology-3e-digital-algorithms-1', 'technology-3e-digital-algorithms-2',
  // LV2 (Relais des voyageurs, 5e) : une mission par langue et par thème, l’allemand puis l’espagnol.
  'lv2-5e-introductions-de-greetings-1', 'lv2-5e-introductions-de-greetings-2', 'lv2-5e-introductions-de-numbers-1', 'lv2-5e-introductions-de-numbers-2', 'lv2-5e-introductions-de-family-1',
  'lv2-5e-introductions-de-family-2', 'lv2-5e-introductions-de-articles-1', 'lv2-5e-introductions-de-articles-2', 'lv2-5e-introductions-es-greetings-1', 'lv2-5e-introductions-es-greetings-2',
  'lv2-5e-introductions-es-numbers-1', 'lv2-5e-introductions-es-numbers-2', 'lv2-5e-introductions-es-family-1', 'lv2-5e-introductions-es-family-2', 'lv2-5e-introductions-es-articles-1',
  'lv2-5e-introductions-es-articles-2',
  // LV2 (Jardin des heures, 4e) : de même, l’allemand puis l’espagnol.
  'lv2-4e-daily-life-de-time-1', 'lv2-4e-daily-life-de-time-2', 'lv2-4e-daily-life-de-my-day-1', 'lv2-4e-daily-life-de-my-day-2', 'lv2-4e-daily-life-de-timetable-1',
  'lv2-4e-daily-life-de-timetable-2', 'lv2-4e-daily-life-de-modals-1', 'lv2-4e-daily-life-de-modals-2', 'lv2-4e-daily-life-es-time-1', 'lv2-4e-daily-life-es-time-2',
  'lv2-4e-daily-life-es-my-day-1', 'lv2-4e-daily-life-es-my-day-2', 'lv2-4e-daily-life-es-timetable-1', 'lv2-4e-daily-life-es-timetable-2', 'lv2-4e-daily-life-es-ser-estar-1',
  'lv2-4e-daily-life-es-ser-estar-2',
  // LV2 (Refuge des carnets, 3e) : de même, l’allemand puis l’espagnol.
  'lv2-3e-travel-de-past-1', 'lv2-3e-travel-de-past-2', 'lv2-3e-travel-de-stories-1', 'lv2-3e-travel-de-stories-2', 'lv2-3e-travel-de-on-the-road-1',
  'lv2-3e-travel-de-on-the-road-2', 'lv2-3e-travel-de-connectives-1', 'lv2-3e-travel-de-connectives-2', 'lv2-3e-travel-es-past-1', 'lv2-3e-travel-es-past-2',
  'lv2-3e-travel-es-stories-1', 'lv2-3e-travel-es-stories-2', 'lv2-3e-travel-es-countries-1', 'lv2-3e-travel-es-countries-2', 'lv2-3e-travel-es-connectives-1',
  'lv2-3e-travel-es-connectives-2',
];

const metaOf = ({ id, biome, type, level }: ExerciseMeta): ExerciseMeta => ({ id, biome, type, level });
const JSON_BY_ID = new Map(Object.values(JSON_META).map((m) => [m.id, m]));

/** Tous les exercices, sans leurs items. */
export const CATALOG: ExerciseMeta[] = ORDER.flatMap((entry) =>
  typeof entry === 'string' ? (JSON_BY_ID.has(entry) ? [JSON_BY_ID.get(entry)!] : []) : entry.map(metaOf),
);

/**
 * Les exercices JSON de data/ que `ORDER` oublie (vide : vérifié par les tests). Les questions des blocs assemblés
 * (`type: 'assembly'`) n'y sont pas : elles ne sont pas dans une île, et ne sont pas au catalogue.
 */
export const UNORDERED = [...JSON_BY_ID.values()].filter((m) => m.type !== 'assembly' && !ORDER.includes(m.id)).map((m) => m.id);

/** L'identifiant des questions d'un bloc assemblé (GD-2) : data/assembly-<bloc>.json. */
export function assemblageId(bloc: BlockId): string {
  return `assembly-${bloc}`;
}

/** Les blocs assemblés qui ont leurs questions (docs/contenu/assemblage.md, « Les questions »). */
export const BLOCS_A_QUESTIONS: BlockId[] = [...JSON_BY_ID.values()]
  .filter((m) => m.type === 'assembly')
  .map((m) => m.id.slice('assembly-'.length) as BlockId);

/** Les questions d'un bloc assemblé, chargées à la demande comme un exercice JSON. */
export async function loadAssemblage(bloc: BlockId): Promise<AssemblageDef | undefined> {
  return (await LOADERS.get(assemblageId(bloc))?.()) as AssemblageDef | undefined;
}

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
