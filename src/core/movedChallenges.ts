// Les défis des Gardiens ouverts avant les programmes de 2025-2026 (lot du 7 octobre 2026, movedIds.ts) : un lieu qui
// reçoit une mission, ou qui en perd une, change la règle de son défi (deux étoiles dans chaque mission). Un défi ouvert
// avant le déplacement reste ouvert jusqu'à ce qu'il soit réussi (décision proposée par le directeur artistique, à
// confirmer par le mainteneur) : à la migration vers le format 4 (migration.ts), la règle se lit avec les missions
// d'avant, sur la progression d'avant. Données figées, comme movedIds.ts : elles décrivent le jeu d'avant le lot.
import type { BiomeId } from '../game/biomes';
import { STARS_TO_BEAT, STARS_TO_UNLOCK, bossId } from '../game/bossCore';

/**
 * Les missions des lieux touchés, telles qu'elles étaient au format 3 : les missions d'aujourd'hui, moins les arrivées
 * (le Fourneau à la Forge, les Liens au Cabinet, les Cargaisons à l'Observatoire, les Reflets au Marais), plus les départs
 * (le subjonctif au Marais, `subtracting` au Glacier). Le Marché et le Carrefour gardent leurs missions, mais un de
 * leurs exercices est parti : leur règle se lit aussi sur la progression d'avant.
 */
const MISSIONS_BEFORE_MOVE = {
  'maths-4e-powers': ['powers', 'square-roots', 'scientific-notation'],
  'french-4e-vocabulary': ['word-roots', 'meaning', 'nuances'],
  'maths-3e-statistics': ['mean', 'probability', 'data'],
  'french-5e-conjugation': ['past-tenses', 'future-tense', 'subjunctive', 'tense-choice'],
  'maths-5e-signed-numbers': ['thermometer', 'adding', 'subtracting', 'fractions'],
  'maths-5e-proportionality': ['proportion-tables', 'percentages', 'ratios'],
  'french-5e-homophones': ['pairs', 'choices', 'homophone-sentences'],
} as const satisfies Partial<Record<BiomeId, readonly string[]>>;

/**
 * GD-14 (format 5, 9 octobre 2026) : les lieux qui reçoivent une mission pour couvrir le programme, avec leurs missions
 * d'avant, par langue sur le lieu de la LV2. Un défi ouvert avant l'ajout le reste jusqu'à ce qu'il soit réussi, comme
 * au déplacement. Données figées : elles décrivent le jeu d'avant le lot.
 */
const MISSIONS_BEFORE_ADDITIONS: Partial<Record<BiomeId, readonly (readonly string[])[]>> = {
  'english-3e-grammar': [['for-since', 'if', 'passive']],
  'english-4e-grammar': [['future', 'modals', 'present-perfect', 'traditions']],
  'english-5e-grammar': [['ing', 'past-simple', 'comparatives']],
  'english-5e-vocabulary': [['shopping', 'routine', 'listening', 'notices']],
  'english-6e-vocabulary': [['hello', 'numbers', 'first-listening', 'signs']],
  'french-3e-close-reading': [['inference', 'figures-of-speech', 'text-connectives', 'voices']],
  'french-4e-agreement': [['past-participle', 'adjectives', 'subject-verb', 'reflexive-verbs']],
  'french-5e-conjugation': [['past-tenses', 'future-tense', 'tense-recognition', 'tense-choice']],
  'french-5e-homophones': [['pairs', 'choices', 'homophone-sentences']],
  'french-6e-reading': [['fluency', 'comprehension', 'sentence-order']],
  'history-6e-antiquity': [['early-humans', 'ancient-peoples', 'roman-empire']],
  'life-earth-sciences-6e-living-world': [['living-groups', 'food-growth', 'planet-earth']],
  'lv2-3e-travel': [['es-past', 'es-stories', 'es-countries', 'es-connectives'], ['de-past', 'de-stories', 'de-on-the-road', 'de-connectives']],
  'lv2-4e-daily-life': [['es-time', 'es-my-day', 'es-timetable', 'es-ser-estar'], ['de-time', 'de-my-day', 'de-timetable', 'de-modals']],
  'lv2-5e-introductions': [['es-greetings', 'es-numbers', 'es-family', 'es-articles'], ['de-greetings', 'de-numbers', 'de-family', 'de-articles']],
  'maths-3e-functions': [['images', 'linear', 'graphs']],
  'maths-3e-geometry': [['pythagoras', 'thales', 'trigonometry']],
  'maths-4e-algebra': [['simplifying', 'expanding', 'equations']],
  'maths-4e-powers': [['powers', 'square-roots', 'scientific-notation', 'subtracting']],
  'maths-5e-proportionality': [['proportion-tables', 'percentages', 'ratios']],
  'maths-5e-signed-numbers': [['thermometer', 'adding', 'fractions']],
  'maths-6e-calculation': [['times-tables', 'make-ten', 'doubles-halves', 'word-problems']],
  'maths-6e-decimals': [['ordering', 'operations', 'scale', 'large-numbers']],
  'maths-6e-fractions': [['number-line', 'equivalence', 'sharing', 'place-value']],
  'physics-chemistry-6e-matter-energy': [['states-of-matter', 'motion-signals', 'energy-circuits']],
  'technology-3e-digital': [['computer-networks', 'connected-objects', 'algorithms']],
  'technology-4e-modeling': [['energy-chain', 'information-chain', 'simulation']],
  'technology-5e-design': [['specifications', 'technical-solutions', 'life-cycle']],
  'technology-6e-objects': [['object-function', 'materials', 'information-networks']],
};

/** Un lieu touché par le déplacement ou par l'ajout de missions : seul l'un d'eux peut garder son défi ouvert. */
export const isMovedPlace = (id: string): id is BiomeId => Object.hasOwn(MISSIONS_BEFORE_MOVE, id) || Object.hasOwn(MISSIONS_BEFORE_ADDITIONS, id);

/** Les étoiles d'une progression encore brute (lue avant sanitize), 0 si elle est illisible. */
function starsOf(p: unknown): number {
  if (typeof p !== 'object' || p === null) return 0;
  const n = Number((p as { stars?: unknown }).stars);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Les lieux touchés dont le défi était ouvert, et pas encore réussi, sur la progression d'avant le déplacement
 * (identifiants du format 3) : deux étoiles dans un exercice de chacune des missions d'avant. Un exercice s'appelle
 * `<lieu>-<mission>-<suite>` ; aucune mission de la table n'en préfixe une autre.
 */
export function challengesOpenBeforeMove(progress: Readonly<Record<string, unknown>>): string[] {
  const won = Object.entries(progress)
    .filter(([, p]) => starsOf(p) >= STARS_TO_UNLOCK)
    .map(([id]) => id);
  return (Object.keys(MISSIONS_BEFORE_MOVE) as (keyof typeof MISSIONS_BEFORE_MOVE)[])
    .filter((place) => starsOf(progress[bossId(place)]) < STARS_TO_BEAT)
    .filter((place) => MISSIONS_BEFORE_MOVE[place].every((m) => won.some((id) => id.startsWith(`${place}-${m}-`))));
}

/**
 * Les lieux dont le défi était ouvert, et pas encore réussi, avant l'ajout des missions de GD-14 (progression au format
 * 4) : deux étoiles dans un exercice de chacune des missions d'avant ; sur le lieu de la LV2, de l'une des deux langues.
 */
export function challengesOpenBeforeAdditions(progress: Readonly<Record<string, unknown>>): string[] {
  const won = Object.entries(progress)
    .filter(([, p]) => starsOf(p) >= STARS_TO_UNLOCK)
    .map(([id]) => id);
  // Object.entries perd le type des clés : ce sont bien des lieux.
  return (Object.entries(MISSIONS_BEFORE_ADDITIONS) as [BiomeId, readonly (readonly string[])[]][])
    .filter(([place]) => starsOf(progress[bossId(place)]) < STARS_TO_BEAT)
    .filter(([place, avant]) => avant.some((missions) => missions.every((m) => won.some((id) => id.startsWith(`${place}-${m}-`)))))
    .map(([place]) => place);
}
