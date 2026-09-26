// Les quêtes de maths de Blocland : construites à partir des générateurs des quêtes existantes (tables, fractions,
// décimaux), avec un tirage reproductible par exercice. Les aides visuelles (grille de points, boîte de dix, droite…)
// sont décrites en données (type + propriétés) pour rester sérialisables ; l'écran « calcul » les redessine.
import { isValidElement, type ReactNode } from 'react';
import type { Question } from '../../components/QuizSession';
import { CompareBars, DotGroups, FractionBar, FractionDisc, GraduatedLine } from '../../components/math/FractionFigures';
import { DecimalTable } from '../../apps/decimaux/DecimalTable';
import { DotArray, NumberLineJumps, PlaceValueTable, TenFrame } from '../../apps/tables/aids';
import { BarList, NumberLineInt, RatioTable, RightTriangle, RuleCard, ThalesFigure } from './Aids';
import { complement10, complement100, double, half, multiplicationFrom } from '../../apps/tables/generators';
import { compare as compareDecimals, complementToOne, decimalFraction, onLine as decimalOnLine, readDigit, timesPower } from '../../apps/decimaux/generators';
import { compare as compareFractions, equivalent, ofQuantity, onLine as fractionOnLine, readFraction } from '../../apps/fractions/generators';
import type { BiomeId, BlockId } from '../biomes';
import type { ExerciseDef, ExerciseItem } from './types';

/** Une aide visuelle décrite en données : le nom de la figure et ses propriétés. */
export interface AidData {
  kind: string;
  props: Record<string, unknown>;
}

/** Figures connues, par nom (l'écran fait la conversion inverse). */
export const AID_COMPONENTS: Record<string, (props: never) => ReactNode> = {
  dots: DotArray,
  ten: TenFrame,
  jumps: NumberLineJumps,
  places: PlaceValueTable,
  'fraction-bar': FractionBar,
  'fraction-disc': FractionDisc,
  'compare-bars': CompareBars,
  'graduated-line': GraduatedLine,
  'dot-groups': DotGroups,
  'decimal-table': DecimalTable,
  'number-line': NumberLineInt,
  'ratio-table': RatioTable,
  'rule-card': RuleCard,
  'right-triangle': RightTriangle,
  'thales-figure': ThalesFigure,
  'bar-list': BarList,
};

/** Un élément React (aide d'un générateur) → sa description en données. */
export function aidToData(node: ReactNode): AidData | undefined {
  if (!isValidElement(node)) return undefined;
  const kind = Object.entries(AID_COMPONENTS).find(([, c]) => c === node.type)?.[0];
  if (!kind) return undefined;
  return { kind, props: { ...(node.props as Record<string, unknown>) } };
}

/** Générateur pseudo-aléatoire reproductible (mulberry32) : le même exercice à chaque chargement. */
export function seeded(seed: string): () => number {
  let s = 0;
  for (const ch of seed) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Generator = (rng: () => number) => Question & { key: string };

/** Un item Blocland à partir d'une question de quête. */
export function toItem(q: Question & { key: string }): ExerciseItem {
  const item: ExerciseItem = {
    key: q.key,
    prompt: q.prompt,
    spoken: q.spokenPrompt ?? q.prompt,
    choices: q.choices,
    answer: q.answer,
    hint: q.hint ?? '',
    explanation: q.explanation ?? '',
  };
  const aid = aidToData(q.aid);
  if (aid) item.aid = aid;
  const figure = aidToData(q.figure);
  if (figure) item.figure = figure;
  return item;
}

/** `count` items différents (par clé), en alternant les générateurs, tirés de façon reproductible. */
export function buildItems(id: string, generators: Generator[], count = 8): ExerciseItem[] {
  const rng = seeded(id);
  const items: ExerciseItem[] = [];
  const seen = new Set<string>();
  for (let tries = 0; items.length < count && tries < count * 40; tries++) {
    const q = generators[tries % generators.length](rng);
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    items.push(toItem(q));
  }
  return items;
}

interface Spec {
  biome: BiomeId;
  type: string;
  level: number;
  instruction: string;
  generators: Generator[];
  block: BlockId;
  count?: number;
}

function define({ biome, type, level, instruction, generators, block, count }: Spec): ExerciseDef {
  const id = `${biome}-${type}-${level}`;
  return {
    id,
    biome,
    type,
    level,
    instruction,
    items: buildItems(id, generators, count),
    // Chaque partie tire d'autres nombres : la graine change avec le nombre de parties jouées.
    generate: (seed) => buildItems(seed, generators, count),
    feedback: { correct: 'Bien calculé !', wrong: '{explanation}' },
    reward: { block, amount: 4, xp: 12 },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
}

// ---------- Plaine des nombres (calcul mental) ----------

const TABLES = 'Calcule la multiplication. La grille de points te montre le résultat : compte les rangées, par cinq.';
const COMPLEMENTS = 'Trouve le nombre qui manque pour arriver à dix, ou à cent. Regarde la boîte de dix ou la droite.';
const DOUBLES = 'Trouve le double ou la moitié. Sépare le nombre en dizaines et en unités, puis assemble.';

// ---------- Rivière des fractions ----------

const NENUPHARS = 'Regarde la figure : en bas, le nombre de parts égales ; en haut, le nombre de parts coloriées.';
const NENUPHARS_LINE = 'Sur la droite, compte en combien de parts est coupée l’unité, puis compte les parts jusqu’au point.';
const DEUX_RIVES = 'Compare les deux fractions. Les barres te montrent laquelle est la plus grande.';
const PARTAGE = 'Partage la quantité en parts égales, puis prends le nombre de parts demandé. Les points t’aident.';
const PARTAGE_EGALES = 'Deux fractions égales : le nombre de parts a été multiplié, multiplie aussi les parts prises.';

// ---------- Volcan des décimaux ----------

const CRATERE = 'Repère la virgule : juste avant, les unités ; juste après, les dixièmes, puis les centièmes. Lis le rang demandé dans le tableau.';
const CRATERE_FRACTION = 'Une fraction décimale devient un nombre à virgule : le dernier chiffre du haut va dans la colonne du bas.';
const CRATERE_POWER = 'Multiplier ou diviser par 10, 100, 1 000 : chaque chiffre change de rang. Le tableau te montre le déplacement.';
const COULEE = 'Compare les deux décimaux dans le tableau, rang par rang, depuis la gauche. Le plus long n’est pas toujours le plus grand.';
const PENTE = 'Sur la droite, l’unité est coupée en dix : chaque graduation vaut un dixième. Lis le nombre repéré par le point.';
const PENTE_UN = 'Trouve ce qui manque pour arriver à 1. La droite ou les bonds t’aident à compter.';

export const MATHS_EXERCISES: ExerciseDef[] = [
  define({ biome: 'plaine', type: 'tables', level: 1, instruction: TABLES, generators: [multiplicationFrom([2, 5, 10])], block: 'brique' }),
  define({ biome: 'plaine', type: 'tables', level: 2, instruction: TABLES, generators: [multiplicationFrom([3, 4])], block: 'brique' }),
  define({ biome: 'plaine', type: 'tables', level: 3, instruction: TABLES, generators: [multiplicationFrom([6, 7, 8, 9])], block: 'brique' }),
  define({ biome: 'plaine', type: 'complements', level: 1, instruction: COMPLEMENTS, generators: [complement10], block: 'brique' }),
  define({ biome: 'plaine', type: 'complements', level: 2, instruction: COMPLEMENTS, generators: [complement100], block: 'brique' }),
  define({ biome: 'plaine', type: 'doubles', level: 1, instruction: DOUBLES, generators: [double, half], block: 'brique' }),
  // Rivière des fractions
  define({ biome: 'riviere', type: 'nenuphars', level: 1, instruction: NENUPHARS, generators: [readFraction], block: 'galet' }),
  define({ biome: 'riviere', type: 'nenuphars', level: 2, instruction: NENUPHARS_LINE, generators: [fractionOnLine], block: 'galet' }),
  define({ biome: 'riviere', type: 'deux-rives', level: 1, instruction: DEUX_RIVES, generators: [compareFractions], block: 'galet' }),
  define({ biome: 'riviere', type: 'partage', level: 1, instruction: PARTAGE, generators: [ofQuantity], block: 'galet' }),
  define({ biome: 'riviere', type: 'partage', level: 2, instruction: PARTAGE_EGALES, generators: [equivalent], block: 'galet' }),
  // Volcan des décimaux
  define({ biome: 'volcan', type: 'cratere', level: 1, instruction: CRATERE, generators: [readDigit], block: 'obsidienne' }),
  define({ biome: 'volcan', type: 'cratere', level: 2, instruction: CRATERE_FRACTION, generators: [decimalFraction], block: 'obsidienne' }),
  define({ biome: 'volcan', type: 'cratere', level: 3, instruction: CRATERE_POWER, generators: [timesPower], block: 'obsidienne' }),
  define({ biome: 'volcan', type: 'coulee', level: 1, instruction: COULEE, generators: [compareDecimals], block: 'obsidienne' }),
  define({ biome: 'volcan', type: 'pente', level: 1, instruction: PENTE, generators: [decimalOnLine], block: 'obsidienne' }),
  define({ biome: 'volcan', type: 'pente', level: 2, instruction: PENTE_UN, generators: [complementToOne], block: 'obsidienne' }),
];
