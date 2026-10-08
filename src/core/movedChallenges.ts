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
export const MISSIONS_BEFORE_MOVE = {
  'maths-4e-powers': ['powers', 'square-roots', 'scientific-notation'],
  'french-4e-vocabulary': ['word-roots', 'meaning', 'nuances'],
  'maths-3e-statistics': ['mean', 'probability', 'data'],
  'french-5e-conjugation': ['past-tenses', 'future-tense', 'subjunctive', 'tense-choice'],
  'maths-5e-signed-numbers': ['thermometer', 'adding', 'subtracting', 'fractions'],
  'maths-5e-proportionality': ['proportion-tables', 'percentages', 'ratios'],
  'french-5e-homophones': ['pairs', 'choices', 'homophone-sentences'],
} as const satisfies Partial<Record<BiomeId, readonly string[]>>;

/** Un lieu touché par le déplacement : seul l'un d'eux peut garder son défi ouvert. */
export const isMovedPlace = (id: string): id is keyof typeof MISSIONS_BEFORE_MOVE => Object.hasOwn(MISSIONS_BEFORE_MOVE, id);

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
