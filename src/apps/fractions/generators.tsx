import type { Question } from '../../components/QuizSession';
import type { QuestDef } from '../../components/QuestMenu';
import { CompareBars, DotGroups, FractionBar, FractionDisc, GraduatedLine } from '../../components/math/FractionFigures';
import { fractionWords } from '../../core/fractions';
import { randomInt, shuffle } from '../../core/random';

type Rng = () => number;
type Keyed = Question & { key: string };
type Generator = (rng: Rng) => Keyed;

export const QUESTIONS_PER_QUEST = 8;

const frac = (n: number, d: number) => `${n}/${d}`;
const value = (s: string) => {
  const [n, d] = s.split('/').map(Number);
  return n / d;
};

/** Réponses-fractions : sans doublon, rangées de la plus petite à la plus grande. */
function fractionChoices(answer: string, traps: string[], rng: Rng): string[] {
  const valid = [...new Set(traps)].filter((t) => t !== answer && /^\d+\/[1-9]\d*$/.test(t) && !t.startsWith('0/'));
  // Deux écritures de même valeur seraient toutes deux justes : on écarte les pièges équivalents.
  const distinct = valid.filter((t, i) => value(t) !== value(answer) && valid.findIndex((u) => value(u) === value(t)) === i);
  return [answer, ...shuffle(distinct, rng).slice(0, 3)].sort((a, b) => value(a) - value(b));
}

function numberChoices(answer: number, traps: number[], rng: Rng): string[] {
  const pool = [...new Set(traps)].filter((t) => Number.isInteger(t) && t > 0 && t !== answer);
  const picked = shuffle(pool, rng).slice(0, 3);
  for (let d = 1; picked.length < 3; d++) for (const t of [answer + d, answer - d]) if (t > 0 && !picked.includes(t) && picked.length < 3) picked.push(t);
  return [answer, ...picked].sort((a, b) => a - b).map(String);
}

// ---------- Lire une fraction ----------

export const readFraction: Generator = (rng) => {
  const d = randomInt(2, 10, rng);
  const n = randomInt(1, d - 1, rng);
  const disc = d <= 8 && rng() < 0.5;
  const answer = frac(n, d);
  return {
    key: answer,
    id: `lire-${n}-${d}`,
    prompt: 'Quelle fraction de la figure est coloriée ?',
    figure: disc ? <FractionDisc n={n} d={d} /> : <FractionBar n={n} d={d} />,
    choices: fractionChoices(answer, [frac(d, n), frac(d - n, d), frac(n, d - n), frac(n, d + 1), frac(n + 1, d)], rng),
    answer,
    hint: 'En bas : le nombre total de parts égales. En haut : le nombre de parts coloriées.',
    explanation: `${n} part${n > 1 ? 's' : ''} coloriée${n > 1 ? 's' : ''} sur ${d} parts égales : ${answer}.`,
  };
};

// ---------- Comparer ----------

const EQUAL = 'Elles sont égales';
const EQUIVALENT_PAIRS: [number, number, number, number][] = [
  [1, 2, 2, 4],
  [1, 2, 3, 6],
  [1, 3, 2, 6],
  [2, 3, 4, 6],
  [3, 4, 6, 8],
  [1, 4, 2, 8],
  [1, 2, 4, 8],
  [2, 5, 4, 10],
];

export const compare: Generator = (rng) => {
  const kind = randomInt(0, 2, rng);
  let a: [number, number];
  let b: [number, number];
  let hint: string;
  if (kind === 0) {
    // Même dénominateur
    const d = randomInt(3, 10, rng);
    const n1 = randomInt(1, d - 1, rng);
    let n2 = randomInt(1, d - 1, rng);
    if (n2 === n1) n2 = n1 === 1 ? 2 : n1 - 1;
    a = [n1, d];
    b = [n2, d];
    hint = 'Même nombre de parts dans l’unité : compare le nombre de parts prises.';
  } else if (kind === 1) {
    // Même numérateur : piège classique (1/5 < 1/3 même si 5 > 3)
    const n = randomInt(1, 3, rng);
    const d1 = randomInt(n + 1, 9, rng);
    let d2 = randomInt(n + 1, 10, rng);
    if (d2 === d1) d2 = d1 + 1;
    a = [n, d1];
    b = [n, d2];
    hint = 'Plus on partage l’unité en beaucoup de parts, plus chaque part est petite.';
  } else {
    const [p, q, r, s] = EQUIVALENT_PAIRS[randomInt(0, EQUIVALENT_PAIRS.length - 1, rng)];
    [a, b] = rng() < 0.5 ? [[p, q], [r, s]] : [[r, s], [p, q]];
    hint = 'Regarde les deux barres : les parties coloriées ont-elles la même longueur ?';
  }
  const fa = frac(...a);
  const fb = frac(...b);
  const va = a[0] / a[1];
  const vb = b[0] / b[1];
  const answer = va === vb ? EQUAL : va > vb ? fa : fb;
  return {
    key: [fa, fb].sort().join('|'),
    id: `cmp-${fa}-${fb}`,
    prompt: `Quelle fraction est la plus grande : ${fa} ou ${fb} ?`,
    spokenPrompt: `Quelle fraction est la plus grande : ${fractionWords(...a)} ou ${fractionWords(...b)} ?`,
    choices: [fa, fb, EQUAL],
    answer,
    hint,
    aid: <CompareBars a={a} b={b} />,
    explanation: va === vb ? `${fa} et ${fb} représentent la même part de l’unité.` : `${answer} est plus grande que ${answer === fa ? fb : fa}.`,
  };
};

// ---------- Fractions égales ----------

const BASES: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
];

export const equivalent: Generator = (rng) => {
  const [n, d] = BASES[randomInt(0, BASES.length - 1, rng)];
  const k = randomInt(2, 4, rng);
  const answer = n * k;
  return {
    key: `${n}/${d}x${k}`,
    id: `eq-${n}-${d}-${k}`,
    prompt: `${frac(n, d)} = …/${d * k}`,
    spokenPrompt: `${fractionWords(n, d)}, c’est combien de ${fractionWords(2, d * k).replace(/^2 /, '')} ?`,
    // Piège classique : ajouter au lieu de multiplier (1/2 = 3/4).
    choices: numberChoices(answer, [n + (d * k - d), answer + 1, answer - 1, n, answer + k], rng),
    answer: String(answer),
    hint: `Le nombre de parts a été multiplié par ${k} : multiplie aussi le nombre de parts prises.`,
    aid: <CompareBars a={[n, d]} b={[answer, d * k]} />,
    explanation: `${n} × ${k} = ${answer} et ${d} × ${k} = ${d * k}, donc ${frac(n, d)} = ${frac(answer, d * k)}.`,
  };
};

// ---------- Fraction d'une quantité ----------

export const ofQuantity: Generator = (rng) => {
  const d = [2, 3, 4, 5, 10][randomInt(0, 4, rng)];
  const m = randomInt(2, d === 10 ? 5 : 8, rng);
  const q = d * m;
  const n = randomInt(1, d - 1, rng);
  const answer = n * m;
  return {
    key: `${n}/${d}de${q}`,
    id: `qte-${n}-${d}-${q}`,
    prompt: `${frac(n, d)} de ${q} = …`,
    spokenPrompt: `${fractionWords(n, d)} de ${q}, combien ?`,
    choices: numberChoices(answer, [m, q - answer, answer + m, q / n, q * n], rng),
    answer: String(answer),
    hint: `Partage ${q} en ${d} parts égales, puis prends ${n} part${n > 1 ? 's' : ''}.`,
    aid: q <= 40 ? <DotGroups total={q} groups={d} taken={n} /> : undefined,
    explanation: `${q} ÷ ${d} = ${m} dans chaque part, et ${n} × ${m} = ${answer}.`,
  };
};

// ---------- Sur la droite graduée ----------

export const onLine: Generator = (rng) => {
  const d = randomInt(2, 8, rng);
  let n = randomInt(1, 2 * d - 1, rng);
  if (n === d) n += 1;
  const answer = frac(n, d);
  return {
    key: answer,
    id: `droite-${n}-${d}`,
    prompt: 'Quelle fraction repère le point ?',
    figure: <GraduatedLine start={0} units={2} perUnit={d} point={n} />,
    choices: fractionChoices(answer, [frac(n, 2 * d), frac(n + 1, d), frac(n - 1, d), frac(d, n), frac(n, d + 1)], rng),
    answer,
    hint: 'Compte en combien de parts égales est partagée l’unité (de 0 à 1), puis compte les parts jusqu’au point.',
    explanation: `L’unité est partagée en ${d} parts égales et le point est à ${n} part${n > 1 ? 's' : ''} de 0 : ${answer}.`,
  };
};

// ---------- Quêtes ----------

export function buildQuest(generators: Generator[], rng: Rng = Math.random, count = QUESTIONS_PER_QUEST): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (let tries = 0; out.length < count && tries < count * 80; tries++) {
    const q = generators[out.length % generators.length](rng);
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    out.push(q);
  }
  return shuffle(out, rng);
}

export const GENERATORS = { readFraction, compare, equivalent, ofQuantity, onLine };

export const QUESTS: (QuestDef & { makeWith: (rng: Rng) => Question[] })[] = [
  { id: 'lire', title: 'Lire une fraction', detail: 'Barres et disques', gen: readFraction },
  { id: 'comparer', title: 'Comparer', detail: 'Laquelle est la plus grande ?', gen: compare },
  { id: 'egales', title: 'Fractions égales', detail: '1/2 = 2/4 = 3/6…', gen: equivalent },
  { id: 'quantite', title: 'Fraction d’une quantité', detail: 'Les 3/4 de 20', gen: ofQuantity },
  { id: 'droite', title: 'Sur la droite graduée', detail: 'Repérer une fraction', gen: onLine },
].map(({ gen, ...q }) => ({ ...q, make: () => buildQuest([gen]), makeWith: (rng: Rng) => buildQuest([gen], rng) }));
