import type { Question } from '../../components/QuizSession';
import { randomInt, shuffle } from '../../core/random';
import { DotArray, NumberLineJumps, PlaceValueTable, TenFrame } from './aids';
import { formatNumber as f } from './format';

type Rng = () => number;
/** Un générateur produit une question ; `key` sert à éviter les doublons dans une quête. */
export type Generator = (rng: Rng) => Question & { key: string };

export const QUESTIONS_PER_QUEST = 10;

/**
 * 4 réponses : la bonne + 3 pièges plausibles, rangées dans l'ordre croissant
 * (un repère stable, plus simple qu'un ordre aléatoire pour les élèves dyscalculiques).
 */
export function numericChoices(answer: number, traps: number[], rng: Rng): string[] {
  const candidates = [...new Set(traps.filter((n) => Number.isInteger(n) && n >= 0 && n !== answer))];
  let picked = shuffle(candidates, rng).slice(0, 3);
  // Compléter si les pièges ne suffisent pas.
  for (let d = 1; picked.length < 3; d++) {
    for (const n of [answer + d, answer - d]) if (n >= 0 && n !== answer && !picked.includes(n) && picked.length < 3) picked.push(n);
  }
  return [answer, ...picked].sort((a, b) => a - b).map(f);
}

// ---------- Tables de multiplication ----------

/** Astuce propre à chaque table, sans donner le résultat. */
function tableTip(t: number, b: number): string {
  if (b === 1) return '× 1 : le nombre ne change pas.';
  switch (t) {
    case 2:
      return `× 2, c’est le double : ${b} + ${b}.`;
    case 4:
      return `× 4 : fais le double de ${b}, puis encore le double.`;
    case 5:
      return `× 5 : calcule ${b} × 10, puis prends la moitié.`;
    case 9:
      return `× 9 : calcule ${b} × 10, puis enlève ${b}.`;
    case 10:
      return `× 10 : le chiffre des unités devient celui des dizaines, on écrit un 0 à droite.`;
    default:
      return b > 2 ? `Pars de ${t} × ${b - 1} et ajoute encore ${t}.` : `${t} × 2, c’est le double de ${t}.`;
  }
}

/** « t × b » : t est la table travaillée, b l'autre facteur (ordre parfois inversé : a × b = b × a). */
export function multiplication(t: number, b: number, swap: boolean, rng: Rng): Question & { key: string } {
  const [x, y] = swap ? [b, t] : [t, b];
  const p = t * b;
  return {
    key: `${Math.min(t, b)}x${Math.max(t, b)}`,
    id: `mul-${x}x${y}`,
    prompt: `${x} × ${y} = …`,
    spokenPrompt: `${x} fois ${y}, combien ?`,
    choices: numericChoices(p, [t * (b + 1), t * (b - 1), (t + 1) * b, (t - 1) * b, t + b, p + 1, p - 1], rng),
    answer: f(p),
    hint: tableTip(t, b),
    aid: <DotArray rows={b} cols={t} />,
    explanation: `${x} × ${y} = ${f(p)}${x !== y ? ` (et aussi ${y} × ${x})` : ''}.`,
  };
}

export const multiplicationFrom =
  (tables: number[]): Generator =>
  (rng) =>
    multiplication(tables[randomInt(0, tables.length - 1, rng)], randomInt(2, 10, rng), rng() < 0.5, rng);

export const division: Generator = (rng) => {
  const t = randomInt(2, 9, rng);
  const q = randomInt(2, 10, rng);
  const d = t * q;
  return {
    key: `${d}/${t}`,
    id: `div-${d}-${t}`,
    prompt: `${d} ÷ ${t} = …`,
    spokenPrompt: `${d} divisé par ${t}, combien ?`,
    choices: numericChoices(q, [q + 1, q - 1, q + 2, t, d - t], rng),
    answer: f(q),
    hint: `Cherche dans la table de ${t} : ${t} × combien = ${d} ?`,
    aid: <DotArray rows={q} cols={t} />,
    explanation: `${t} × ${q} = ${d}, donc ${d} ÷ ${t} = ${q}.`,
  };
};

// ---------- Compléments ----------

export const complement10: Generator = (rng) => {
  const n = randomInt(1, 9, rng);
  const a = 10 - n;
  return {
    key: `c10-${n}`,
    id: `c10-${n}`,
    prompt: `${n} + … = 10`,
    spokenPrompt: `${n} plus combien égale 10 ?`,
    choices: numericChoices(a, [a + 1, a - 1, n, a + 2], rng),
    answer: f(a),
    hint: 'Compte les cases vides de la boîte de 10.',
    aid: <TenFrame filled={n} />,
    explanation: `${n} + ${a} = 10.`,
  };
};

export const complement100: Generator = (rng) => {
  let n = randomInt(11, 89, rng);
  if (n % 10 === 0) n += randomInt(1, 9, rng);
  const a = 100 - n;
  const next = Math.ceil(n / 10) * 10;
  return {
    key: `c100-${n}`,
    id: `c100-${n}`,
    prompt: `${n} + … = 100`,
    spokenPrompt: `${n} plus combien égale 100 ?`,
    // Piège classique : oublier la retenue (37 → 73 au lieu de 63).
    choices: numericChoices(a, [a + 10, a - 10, a + 1, a - 1], rng),
    answer: f(a),
    hint: `Va d’abord jusqu’à ${next}, puis de ${next} jusqu’à 100.`,
    aid: <NumberLineJumps points={[n, next, 100]} />,
    explanation: `${n} + ${next - n} = ${next}, puis ${next} + ${100 - next} = 100 : ${n} + ${a} = 100.`,
  };
};

// ---------- Doubles et moitiés ----------

export const double: Generator = (rng) => {
  let n = randomInt(11, 49, rng);
  if (n % 10 === 0) n += 1;
  const tens = n - (n % 10);
  const units = n % 10;
  return {
    key: `dbl-${n}`,
    id: `dbl-${n}`,
    prompt: `Double de ${n} = …`,
    spokenPrompt: `Quel est le double de ${n} ?`,
    choices: numericChoices(2 * n, [2 * n + 10, 2 * n - 10, 2 * n + 2, 2 * n - 2, n + 2], rng),
    answer: f(2 * n),
    hint: `Sépare ${n} en ${tens} + ${units} : double de ${tens}, puis double de ${units}.`,
    explanation: `Double de ${tens} = ${2 * tens}, double de ${units} = ${2 * units}, donc ${2 * tens} + ${2 * units} = ${2 * n}.`,
  };
};

export const half: Generator = (rng) => {
  const m = 2 * randomInt(11, 49, rng);
  const big = Math.floor(m / 20) * 20; // la plus grande « dizaine paire »
  const rest = m - big;
  return {
    key: `half-${m}`,
    id: `half-${m}`,
    prompt: `Moitié de ${m} = …`,
    spokenPrompt: `Quelle est la moitié de ${m} ?`,
    choices: numericChoices(m / 2, [m / 2 + 5, m / 2 - 5, m / 2 + 1, m / 2 - 1, m / 2 + 10], rng),
    answer: f(m / 2),
    hint: rest ? `Sépare ${m} en ${big} + ${rest} : moitié de ${big}, puis moitié de ${rest}.` : `Moitié de ${m / 10} dizaines.`,
    explanation: rest
      ? `Moitié de ${big} = ${big / 2}, moitié de ${rest} = ${rest / 2}, donc ${big / 2} + ${rest / 2} = ${m / 2}.`
      : `Moitié de ${m} = ${m / 2}.`,
  };
};

// ---------- × et ÷ par 10, 100, 1 000 ----------


export const timesPower: Generator = (rng) => {
  const p = randomInt(1, 3, rng);
  const k = 10 ** p;
  const n = p === 3 ? randomInt(2, 99, rng) : randomInt(2, 999, rng);
  const r = n * k;
  return {
    key: `x${k}-${n}`,
    id: `x${k}-${n}`,
    prompt: `${f(n)} × ${f(k)} = …`,
    spokenPrompt: `${n} fois ${k}, combien ?`,
    choices: numericChoices(r, [n * 10 ** (p - 1), n * 10 ** (p + 1), n], rng),
    answer: f(r),
    hint: `× ${f(k)} : chaque chiffre avance de ${p} rang${p > 1 ? 's' : ''} vers la gauche.`,
    aid: <PlaceValueTable value={n} shift={p} />,
    explanation: `${f(n)} × ${f(k)} = ${f(r)} : on écrit ${p} zéro${p > 1 ? 's' : ''} à droite.`,
  };
};

export const dividePower: Generator = (rng) => {
  const p = randomInt(1, 3, rng);
  const k = 10 ** p;
  const q = randomInt(2, 99, rng);
  const m = q * k;
  return {
    key: `d${k}-${m}`,
    id: `d${k}-${m}`,
    prompt: `${f(m)} ÷ ${f(k)} = …`,
    spokenPrompt: `${m} divisé par ${k}, combien ?`,
    choices: numericChoices(q, [q * 10, m / 10 ** Math.max(p - 1, 0), q * 100, m], rng),
    answer: f(q),
    hint: `÷ ${f(k)} : chaque chiffre recule de ${p} rang${p > 1 ? 's' : ''} vers la droite.`,
    aid: <PlaceValueTable value={m} shift={-p} />,
    explanation: `${f(m)} ÷ ${f(k)} = ${f(q)} : on enlève ${p} zéro${p > 1 ? 's' : ''}.`,
  };
};


// ---------- Quêtes ----------

/** Tire `count` questions sans doublon en alternant les générateurs. */
export function buildQuest(generators: Generator[], count = QUESTIONS_PER_QUEST, rng: Rng = Math.random): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (let tries = 0; out.length < count && tries < count * 50; tries++) {
    const q = generators[out.length % generators.length](rng);
    if (seen.has(q.key)) continue;
    seen.add(q.key);
    out.push(q);
  }
  return shuffle(out, rng);
}

/** Entraînement ciblé : la table complète de t (× 1 à × 10), dans le désordre. */
export function tableQuest(t: number, rng: Rng = Math.random): Question[] {
  return shuffle(
    Array.from({ length: 10 }, (_, i) => multiplication(t, i + 1, rng() < 0.3, rng)),
    rng,
  );
}

export interface QuestDef {
  id: string;
  title: string;
  detail: string;
  make: (rng?: Rng) => Question[];
}

export const QUESTS: QuestDef[] = [
  { id: 'faciles', title: 'Tables faciles', detail: '× 2, 3, 4, 5 et 10', make: (rng) => buildQuest([multiplicationFrom([2, 3, 4, 5, 10])], undefined, rng) },
  { id: 'costaudes', title: 'Tables costaudes', detail: '× 6, 7, 8 et 9', make: (rng) => buildQuest([multiplicationFrom([6, 7, 8, 9])], undefined, rng) },
  { id: 'divisions', title: 'Divisions', detail: 'Les tables à l’envers', make: (rng) => buildQuest([division], undefined, rng) },
  { id: 'complements', title: 'Compléments', detail: 'À 10 et à 100', make: (rng) => buildQuest([complement10, complement100, complement100], undefined, rng) },
  { id: 'doubles', title: 'Doubles et moitiés', detail: 'Sépare dizaines et unités', make: (rng) => buildQuest([double, half], undefined, rng) },
  { id: 'puissances', title: '× et ÷ par 10, 100, 1\u202f000', detail: 'Le tableau de numération', make: (rng) => buildQuest([timesPower, dividePower], undefined, rng) },
];

export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
