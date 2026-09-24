import type { Question } from '../../components/QuizSession';
import type { QuestDef } from '../../components/QuestMenu';
import { GraduatedLine } from '../../components/math/FractionFigures';
import { randomInt, shuffle } from '../../core/random';
import { NumberLineJumps } from '../tables/aids';
import { DecimalTable } from './DecimalTable';
import { SCALE, digitsOf, formatDecimal as f } from './decimal';

type Rng = () => number;
type Keyed = Question & { key: string };
type Generator = (rng: Rng) => Keyed;

export const QUESTIONS_PER_QUEST = 8;

/** Réponses décimales sans doublon de valeur, de la plus petite à la plus grande. */
function decimalChoices(answer: number, traps: number[], rng: Rng): string[] {
  const pool = [...new Set(traps)].filter((t) => Number.isInteger(t) && t >= 0 && t !== answer && t < 100000 * SCALE);
  const picked = shuffle(pool, rng).slice(0, 3);
  for (let d = 100; picked.length < 3; d += 100) for (const t of [answer + d, answer - d]) if (t >= 0 && !picked.includes(t) && picked.length < 3) picked.push(t);
  return [answer, ...picked].sort((a, b) => a - b).map(f);
}

// ---------- Lire un décimal ----------

const RANKS = [
  { name: 'dizaines', pos: -2 },
  { name: 'unités', pos: -1 },
  { name: 'dixièmes', pos: 0 },
  { name: 'centièmes', pos: 1 },
  { name: 'millièmes', pos: 2 },
];

export const readDigit: Generator = (rng) => {
  // Chiffres tous différents : une seule réponse possible.
  const pool = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const decCount = randomInt(2, 3, rng);
  const int = pool[0] * 10 + pool[1];
  const decDigits = pool.slice(2, 2 + decCount);
  const th = int * SCALE + Number(decDigits.join('').padEnd(3, '0'));
  const { int: intStr, dec } = digitsOf(th);
  const ranks = RANKS.filter((r) => r.pos < dec.length);
  const rank = ranks[randomInt(0, ranks.length - 1, rng)];
  const digit = rank.pos < 0 ? intStr[intStr.length + rank.pos] : dec[rank.pos];
  const all = [...intStr, ...dec].filter((d) => d !== digit);
  const choices = [digit, ...shuffle(all, rng).slice(0, 3)].sort();
  return {
    key: `${th}-${rank.name}`,
    id: `lire-${th}-${rank.name}`,
    prompt: `Dans ${f(th)}, quel est le chiffre des ${rank.name} ?`,
    choices,
    answer: digit,
    hint: 'Repère la virgule : juste avant, les unités ; juste après, les dixièmes, puis les centièmes, puis les millièmes.',
    aid: <DecimalTable rows={[th]} />,
    explanation: `Dans ${f(th)}, le chiffre des ${rank.name} est ${digit}.`,
  };
};

// ---------- Comparer ----------

const EQUAL = 'Ils sont égaux';

export const compare: Generator = (rng) => {
  const u = randomInt(0, 9, rng);
  const kind = randomInt(0, 3, rng);
  let a: number;
  let b: number;
  if (kind === 0 || kind === 1) {
    // Piège : « le plus long est le plus grand » (3,5 contre 3,45).
    const t = randomInt(1, 8, rng);
    a = u * SCALE + t * 100;
    b = u * SCALE + randomInt(0, 9, rng) * 100 + randomInt(1, 9, rng) * 10;
    if (kind === 1) b = u * SCALE + (t - 1) * 100 + randomInt(10, 99, rng); // 3,5 contre 3,4x
  } else if (kind === 2) {
    // Même nombre de chiffres
    a = u * SCALE + randomInt(10, 99, rng) * 10;
    b = u * SCALE + randomInt(10, 99, rng) * 10;
    if (a === b) b += 10;
  } else {
    // Égaux avec un zéro en plus : 2,7 et 2,70
    a = u * SCALE + randomInt(1, 9, rng) * 100;
    b = a;
  }
  const [fa, fb] = [f(a), a === b ? `${f(b)}0` : f(b)];
  const answer = a === b ? EQUAL : a > b ? fa : fb;
  return {
    key: [a, b].sort().join('|'),
    id: `cmp-${a}-${b}`,
    prompt: `Quel est le plus grand : ${fa} ou ${fb} ?`,
    choices: [fa, fb, EQUAL],
    answer,
    hint: 'Complète avec des 0 pour avoir autant de chiffres après la virgule, puis compare chiffre par chiffre depuis la gauche.',
    aid: <DecimalTable rows={[a, b]} padZeros />,
    explanation: a === b ? `${fa} = ${fb} : un 0 à la fin de la partie décimale ne change rien.` : `${answer} est plus grand que ${answer === fa ? fb : fa}.`,
  };
};

// ---------- Droite graduée ----------

export const onLine: Generator = (rng) => {
  const start = randomInt(0, 9, rng);
  const k = randomInt(1, 9, rng);
  const th = start * SCALE + k * 100;
  return {
    key: String(th),
    id: `droite-${th}`,
    prompt: 'Quel nombre repère le point ?',
    figure: <GraduatedLine start={start} units={1} perUnit={10} point={k} />,
    // Pièges : 2,04 (dixième lu comme centième), graduation voisine, chiffres inversés.
    choices: decimalChoices(th, [start * SCALE + k * 10, th + 100, th - 100, k * SCALE + start * 100, start * SCALE + k], rng),
    answer: f(th),
    hint: 'L’unité est partagée en 10 parts égales : chaque graduation vaut un dixième (0,1).',
    explanation: `${k} graduation${k > 1 ? 's' : ''} après ${start} : ${start} + ${f(k * 100)} = ${f(th)}.`,
  };
};

// ---------- Fractions décimales ----------

export const decimalFraction: Generator = (rng) => {
  const p = randomInt(1, 3, rng);
  const den = 10 ** p;
  const num = p === 1 ? randomInt(1, 99, rng) : p === 2 ? randomInt(1, 999, rng) : randomInt(1, 9999, rng);
  const th = (num * SCALE) / den;
  return {
    key: `${num}/${den}`,
    id: `frac-${num}-${den}`,
    prompt: `${num}/${den} = …`,
    spokenPrompt: `${num} ${den === 10 ? 'dixièmes' : den === 100 ? 'centièmes' : 'millièmes'}, quel nombre décimal ?`,
    choices: decimalChoices(th, [th * 10, th / 10, th * 100, th / 100].filter((t) => Number.isInteger(t)), rng),
    answer: f(th),
    hint: `${den === 10 ? 'Dixièmes' : den === 100 ? 'Centièmes' : 'Millièmes'} : le dernier chiffre de ${num} va dans la colonne des ${den === 10 ? 'dixièmes' : den === 100 ? 'centièmes' : 'millièmes'}.`,
    aid: <DecimalTable rows={[th]} caption={`${num}/${den} placé dans le tableau`} />,
    explanation: `${num}/${den} = ${f(th)}.`,
  };
};

// ---------- × et ÷ par 10, 100, 1 000 ----------

export const timesPower: Generator = (rng) => {
  const p = randomInt(1, 3, rng);
  const k = 10 ** p;
  const divide = rng() < 0.5;
  let th: number;
  let result: number;
  if (divide) {
    // Départ avec au plus un chiffre après la virgule : le résultat reste au millième.
    th = p === 3 ? randomInt(1, 999, rng) * SCALE : randomInt(11, 999, rng) * 100;
    result = th / k;
  } else {
    // Départ du type 34,56 ou 7,5
    th = randomInt(1, 99, rng) * SCALE + (rng() < 0.5 ? randomInt(1, 9, rng) * 100 : randomInt(11, 99, rng) * 10);
    result = th * k;
  }
  const op = divide ? '÷' : '×';
  // Pièges : mauvais nombre de rangs, nombre inchangé (« on ajoute un 0 » : 3,45 × 10 = 3,450).
  const traps = [result * 10, result / 10, th, divide ? result * 100 : result / 100];
  const dir = divide ? 'droite' : 'gauche';
  return {
    key: `${op}${k}-${th}`,
    id: `pow-${divide ? 'd' : 'x'}${k}-${th}`,
    prompt: `${f(th)} ${op} ${k.toLocaleString('fr-FR')} = …`,
    spokenPrompt: `${f(th)} ${divide ? 'divisé par' : 'fois'} ${k}, combien ?`,
    choices: decimalChoices(result, traps, rng),
    answer: f(result),
    hint: `${op} ${k.toLocaleString('fr-FR')} : chaque chiffre se déplace de ${p} rang${p > 1 ? 's' : ''} vers la ${dir}. Ce n’est pas la virgule qui bouge !`,
    aid: <DecimalTable rows={[th]} caption={`Déplace chaque chiffre de ${p} rang${p > 1 ? 's' : ''} vers la ${dir}.`} />,
    explanation: `${f(th)} ${op} ${k.toLocaleString('fr-FR')} = ${f(result)}.`,
  };
};

// ---------- Compléter à 1 ----------

export const complementToOne: Generator = (rng) => {
  const hundredths = rng() < 0.6;
  const th = hundredths ? randomInt(11, 89, rng) * 10 : randomInt(1, 9, rng) * 100;
  if (hundredths && th % 100 === 0) return complementToOne(rng);
  const answer = SCALE - th;
  const next = Math.ceil(th / 100) * 100;
  return {
    key: `c1-${th}`,
    id: `c1-${th}`,
    prompt: `${f(th)} + … = 1`,
    spokenPrompt: `${f(th)} plus combien égale 1 ?`,
    // Piège : oublier la retenue (0,35 + 0,75).
    choices: decimalChoices(answer, [answer + 100, answer - 100, answer + 10, answer - 10], rng),
    answer: f(answer),
    hint: hundredths ? `Va d’abord jusqu’à ${f(next)}, puis de ${f(next)} jusqu’à 1.` : 'Compte les dixièmes qui manquent pour arriver à 10 dixièmes.',
    aid: hundredths ? <NumberLineJumps points={[th / SCALE, next / SCALE, 1]} /> : <GraduatedLine start={0} units={1} perUnit={10} point={th / 100} />,
    explanation: `${f(th)} + ${f(answer)} = 1.`,
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

export const QUESTS: (QuestDef & { makeWith: (rng: Rng) => Question[] })[] = [
  { id: 'lire', title: 'Lire un décimal', detail: 'Dixièmes, centièmes, millièmes', gen: readDigit },
  { id: 'comparer', title: 'Comparer', detail: '3,5 ou 3,45 ?', gen: compare },
  { id: 'droite', title: 'Sur la droite graduée', detail: 'Repérer au dixième', gen: onLine },
  { id: 'fractions', title: 'Fractions décimales', detail: '37/100 = 0,37', gen: decimalFraction },
  { id: 'puissances', title: '× et ÷ par 10, 100, 1 000', detail: 'Les chiffres se déplacent', gen: timesPower },
  { id: 'complements', title: 'Compléter à 1', detail: '0,35 + … = 1', gen: complementToOne },
].map(({ gen, ...q }) => ({ ...q, make: () => buildQuest([gen]), makeWith: (rng: Rng) => buildQuest([gen], rng) }));
