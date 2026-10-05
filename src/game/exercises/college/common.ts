// Ce que partagent les générateurs du collège : le type d'un générateur, l'écriture des nombres, les quatre
// réponses (nombres ou textes), le tirage reproductible des items, la définition d'une mission et les petites aides
// de tirage (pgcd, un élément au hasard).
import { drawChoices } from '../../../core/choices';
import { randomInt, seeded, shuffle } from '../../../core/random';
import type { BiomeId, BlockId } from '../../biomes';
import type { ExerciseDef, ExerciseItem } from '../types';

export const seededItems = seeded;

export type Rng = () => number;

export type ItemGenerator = (rng: Rng) => ExerciseItem;

/** « −7 » avec le vrai signe moins ; les milliers espacés ; « 0 » pour −0 (−3 × 0). */
export const fmt = (n: number): string => (n < 0 ? `−${(-n).toLocaleString('fr-FR')}` : (n + 0).toLocaleString('fr-FR'));

/** Entre parenthèses seulement s'il est négatif : « 5 », « (−3) ». */
export const par = (n: number): string => (n < 0 ? `(${fmt(n)})` : fmt(n));

/** Version lue à voix haute : « moins 7 ». */
export const say = (n: number): string => (n < 0 ? `moins ${-n}` : String(n));

/**
 * 4 réponses (la bonne + 3 pièges), sans doublon, rangées de la plus petite à la plus grande. La place de la bonne
 * réponse est tirée d'abord (1re, 2e, 3e ou 4e) : on prend ensuite les pièges plus petits et plus grands qu'il faut,
 * et des voisins proches s'il en manque d'un côté (positifs si la réponse l'est). Voir `drawChoices`.
 */
export function choices(answer: number, traps: number[], rng: Rng, format: (n: number) => string = fmt, neighbours = true): string[] {
  return drawChoices(answer, traps, rng, { neighbourOk: (t) => t > 0 || answer <= 0, neighbours }).map(format);
}

/** `count` items différents (par clé), en alternant les générateurs, tirés de façon reproductible. */
export function buildDataItems(id: string, generators: ItemGenerator[], count = 8): ExerciseItem[] {
  const rng = seeded(id);
  const items: ExerciseItem[] = [];
  const seen = new Set<string>();
  for (let tries = 0; items.length < count && tries < count * 60; tries++) {
    const it = generators[tries % generators.length](rng);
    if (seen.has(it.key)) continue;
    seen.add(it.key);
    items.push(it);
  }
  return items;
}

interface Spec {
  biome: BiomeId;
  type: string;
  level: number;
  instruction: string;
  generators: ItemGenerator[];
  block: BlockId;
  /** L’XP d’une réussite : 14 au cycle 4, 12 pour les missions de 6e (Rivière des fractions). */
  xp?: number;
}

export function defineData({ biome, type, level, instruction, generators, block, xp = 14 }: Spec): ExerciseDef {
  const id = `${biome}-${type}-${level}`;
  return {
    id,
    biome,
    type,
    level,
    instruction,
    items: buildDataItems(id, generators),
    // Chaque partie tire d'autres nombres : la graine change à chaque partie.
    generate: (seed) => buildDataItems(seed, generators),
    feedback: { correct: 'Bien calculé !', wrong: '{explanation}' },
    reward: { block, amount: 4, xp },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
}

export const nonZero = (min: number, max: number, rng: Rng): number => {
  let n = 0;
  while (n === 0) n = randomInt(min, max, rng);
  return n;
};

/** Plafond des tirages d'une question : les tables en donnent bien avant, il garde de toute boucle sans fin. */
export const MAX_TRIES = 1000;

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export const pick = <T>(list: readonly T[], rng: Rng): T => list[randomInt(0, list.length - 1, rng)];

/** Réponses textuelles : la bonne et trois pièges, sans doublon, dans un ordre mélangé mais reproductible. */
export function textChoices(answer: string, traps: string[], rng: Rng): string[] {
  const pool = [...new Set(traps)].filter((t) => t !== answer).slice(0, 3);
  return shuffle([answer, ...pool], rng);
}
