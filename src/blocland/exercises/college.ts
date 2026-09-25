// Quêtes de maths du collège (cycle 4) : générateurs reproductibles qui produisent directement des items Blocland,
// avec leurs aides visuelles en données (droite des relatifs, tableau de proportionnalité, rappel de règle).
import { randomInt, shuffle } from '../../core/random';
import type { BiomeId, BlockId } from '../biomes';
import { seeded } from './maths';

export const seededItems = seeded;
import type { ExerciseDef, ExerciseItem } from './types';

type Rng = () => number;
export type ItemGenerator = (rng: Rng) => ExerciseItem;

/** « −7 » avec le vrai signe moins ; les milliers espacés. */
export const fmt = (n: number): string => (n < 0 ? `−${(-n).toLocaleString('fr-FR')}` : n.toLocaleString('fr-FR'));
/** Entre parenthèses seulement s'il est négatif : « 5 », « (−3) ». */
export const par = (n: number): string => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** Version lue à voix haute : « moins 7 ». */
export const say = (n: number): string => (n < 0 ? `moins ${-n}` : String(n));

/** 4 réponses (la bonne + 3 pièges), sans doublon, rangées de la plus petite à la plus grande. */
export function choices(answer: number, traps: number[], rng: Rng, format: (n: number) => string = fmt): string[] {
  const pool = [...new Set(traps)].filter((t) => Number.isFinite(t) && t !== answer);
  const picked = shuffle(pool, rng).slice(0, 3);
  for (let d = 1; picked.length < 3; d++) for (const t of [answer + d, answer - d]) if (!picked.includes(t) && picked.length < 3) picked.push(t);
  return [answer, ...picked].sort((a, b) => a - b).map(format);
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
}

export function defineData({ biome, type, level, instruction, generators, block }: Spec): ExerciseDef {
  const id = `${biome}-${type}-${level}`;
  return {
    id,
    biome,
    type,
    level,
    instruction,
    items: buildDataItems(id, generators),
    feedback: { correct: 'Bien calculé !', wrong: '{explanation}' },
    reward: { block, amount: 4, xp: 14 },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
}

const nonZero = (min: number, max: number, rng: Rng): number => {
  let n = 0;
  while (n === 0) n = randomInt(min, max, rng);
  return n;
};

// ---------- Glacier des relatifs ----------

/** Comparer deux relatifs. */
export const compareRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  if (a === b) b = -b;
  if (rng() < 0.5 && a > 0) a = -a;
  const small = rng() < 0.5;
  const answer = small ? Math.min(a, b) : Math.max(a, b);
  return {
    key: `cmp-${a}-${b}-${small ? 'min' : 'max'}`,
    prompt: `Quel est le plus ${small ? 'petit' : 'grand'} : ${fmt(a)} ou ${fmt(b)} ?`,
    spoken: `Quel est le plus ${small ? 'petit' : 'grand'} : ${say(a)} ou ${say(b)} ?`,
    choices: [a, b].sort((x, y) => x - y).map(fmt),
    answer: fmt(answer),
    hint: 'Sur la droite, le plus petit est toujours à gauche. Un nombre négatif est plus petit que zéro.',
    explanation: `${fmt(answer)} est plus ${small ? 'à gauche' : 'à droite'} sur la droite : c’est le plus ${small ? 'petit' : 'grand'}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, b] } },
  };
};

/** Lire un relatif repéré sur la droite. */
export const readRelatif: ItemGenerator = (rng) => {
  const v = nonZero(-9, 9, rng);
  return {
    key: `read-${v}`,
    prompt: 'Quel nombre repère le point ?',
    spoken: 'Quel nombre repère le point sur la droite ?',
    choices: choices(v, [-v, v + 1, v - 1, v + 2], rng),
    answer: fmt(v),
    hint: 'Compte les graduations depuis zéro : vers la gauche, le nombre est négatif.',
    explanation: `Le point est à ${Math.abs(v)} graduation${Math.abs(v) > 1 ? 's' : ''} ${v < 0 ? 'à gauche' : 'à droite'} de zéro : ${fmt(v)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [v] } },
  };
};

/** Addition de relatifs, avec le bond sur la droite. */
export const addRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  // Le résultat reste sur la droite (de −10 à 10).
  while (Math.abs(a + b) > 10) {
    a = nonZero(-9, 9, rng);
    b = nonZero(-9, 9, rng);
  }
  const s = a + b;
  return {
    key: `add-${a}-${b}`,
    prompt: `${fmt(a)} + ${par(b)} = …`,
    spoken: `${say(a)} plus ${say(b)}, combien ?`,
    choices: choices(s, [a - b, -s, Math.abs(a) + Math.abs(b), s + 1, s - 1], rng),
    answer: fmt(s),
    hint: `Pars de ${fmt(a)} et fais un bond de ${Math.abs(b)} vers la ${b > 0 ? 'droite' : 'gauche'}.`,
    explanation: `De ${fmt(a)}, ${b > 0 ? 'on avance' : 'on recule'} de ${Math.abs(b)} : on arrive à ${fmt(s)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, s], jump: [a, s] } },
  };
};

/** Soustraction : soustraire, c'est ajouter l'opposé. */
export const subRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  while (Math.abs(a - b) > 10) {
    a = nonZero(-9, 9, rng);
    b = nonZero(-9, 9, rng);
  }
  const d = a - b;
  return {
    key: `sub-${a}-${b}`,
    prompt: `${fmt(a)} − ${par(b)} = …`,
    spoken: `${say(a)} moins ${say(b)}, combien ?`,
    choices: choices(d, [a + b, -d, b - a, d + 1, d - 1], rng),
    answer: fmt(d),
    hint: `Soustraire ${fmt(b)}, c’est ajouter son opposé : ${fmt(a)} + (${fmt(-b)}).`,
    explanation: `${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)} = ${fmt(d)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, d], jump: [a, d] } },
  };
};

const SIGN_RULES = [
  'Deux signes identiques : résultat positif (+ et +, − et −).',
  'Deux signes différents : résultat négatif (+ et −).',
  'Le résultat a la même valeur que sans les signes.',
];

export const mulRelatifs: ItemGenerator = (rng) => {
  const a = nonZero(-9, 9, rng);
  let b = nonZero(2, 9, rng);
  if (rng() < 0.5) b = -b;
  const p = a * b;
  return {
    key: `mul-${a}-${b}`,
    prompt: `${par(a)} × ${par(b)} = …`,
    spoken: `${say(a)} fois ${say(b)}, combien ?`,
    choices: choices(p, [-p, a + b, p + a, p - b], rng),
    answer: fmt(p),
    hint: 'Regarde les signes d’abord, puis multiplie les nombres sans les signes.',
    explanation: `${Math.sign(a) === Math.sign(b) ? 'Signes identiques : résultat positif' : 'Signes différents : résultat négatif'}, et ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(p)}. Donc ${fmt(p)}.`,
    aid: { kind: 'rule-card', props: { title: 'Règle des signes', lines: SIGN_RULES } },
  };
};

export const divRelatifs: ItemGenerator = (rng) => {
  let q = nonZero(-9, 9, rng);
  let b = nonZero(2, 9, rng);
  if (rng() < 0.5) b = -b;
  if (Math.abs(q) === 1) q = q * 3;
  const a = q * b;
  return {
    key: `div-${a}-${b}`,
    prompt: `${par(a)} ÷ ${par(b)} = …`,
    spoken: `${say(a)} divisé par ${say(b)}, combien ?`,
    choices: choices(q, [-q, q + 1, q - 1, a - b], rng),
    answer: fmt(q),
    hint: `Cherche ${fmt(b)} × combien = ${fmt(a)}. Même règle des signes que pour la multiplication.`,
    explanation: `${par(b)} × ${par(q)} = ${fmt(a)}, donc ${fmt(a)} ÷ ${par(b)} = ${fmt(q)}.`,
    aid: { kind: 'rule-card', props: { title: 'Règle des signes', lines: SIGN_RULES } },
  };
};

// ---------- Marché des proportions ----------

const GOODS = ['pommes', 'cahiers', 'billes', 'crêpes', 'stylos', 'tomates'];
const euro = (n: number) => `${n.toLocaleString('fr-FR')} €`;

/** Quatrième proportionnelle, coefficient entier. */
export const fourthInt: ItemGenerator = (rng) => {
  const good = GOODS[randomInt(0, GOODS.length - 1, rng)];
  const n1 = randomInt(2, 6, rng);
  const price = randomInt(2, 5, rng);
  const n2 = randomInt(n1 + 1, 12, rng);
  const answer = n2 * price;
  return {
    key: `fi-${good}-${n1}-${price}-${n2}`,
    prompt: `${n1} ${good} coûtent ${euro(n1 * price)}. Combien coûtent ${n2} ${good} ?`,
    spoken: `${n1} ${good} coûtent ${n1 * price} euros. Combien coûtent ${n2} ${good} ?`,
    choices: choices(answer, [n2 * price + price, n2 * price - price, n1 * price + n2, n2 + price], rng, euro),
    answer: euro(answer),
    hint: `Trouve d’abord le prix d’un seul : ${n1 * price} ÷ ${n1}. Puis multiplie par ${n2}.`,
    explanation: `Un ${good.slice(0, -1)} coûte ${euro(price)} (${n1 * price} ÷ ${n1}). ${n2} × ${price} = ${answer} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: [good, 'prix'],
        rows: [
          [n1, euro(n1 * price)],
          [n2, '?'],
        ],
        caption: 'Tableau de proportionnalité',
      },
    },
  };
};

/** Quatrième proportionnelle par le coefficient (× 1,5 ; × 2,5) ou par le passage à l'unité non entier. */
export const fourthCoef: ItemGenerator = (rng) => {
  const k = [1.5, 2.5, 0.5, 3.5][randomInt(0, 3, rng)];
  const a = randomInt(2, 9, rng) * 2;
  const b = a * k;
  const c = randomInt(2, 9, rng) * 2;
  const answer = c * k;
  const f = (n: number) => n.toLocaleString('fr-FR');
  return {
    key: `fc-${a}-${k}-${c}`,
    prompt: `${a} kg coûtent ${euro(b)}. Combien coûtent ${c} kg ?`,
    spoken: `${a} kilos coûtent ${f(b)} euros. Combien coûtent ${c} kilos ?`,
    choices: choices(answer, [c * k + k, c + b, b + (c - a), c * 2], rng, euro),
    answer: euro(answer),
    hint: `Le coefficient est ${f(k)} : on multiplie les kilos par ${f(k)} pour avoir le prix.`,
    explanation: `${b} ÷ ${a} = ${f(k)}, donc ${c} × ${f(k)} = ${f(answer)} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['kilos', 'prix'],
        rows: [
          [a, euro(b)],
          [c, '?'],
        ],
        caption: `Coefficient : × ${f(k)}`,
      },
    },
  };
};

/** Prendre un pourcentage d'un nombre. */
export const percentOf: ItemGenerator = (rng) => {
  const p = [10, 20, 25, 50, 75, 5][randomInt(0, 5, rng)];
  const n = randomInt(2, 12, rng) * 20;
  const answer = (n * p) / 100;
  return {
    key: `pct-${p}-${n}`,
    prompt: `${p} % de ${n} = …`,
    spoken: `${p} pour cent de ${n}, combien ?`,
    choices: choices(answer, [n - answer, answer * 2, answer / 2, n / p], rng),
    answer: fmt(answer),
    hint: `${p} % de ${n}, c’est ${n} × ${p} ÷ 100. Astuce : 10 %, c’est diviser par 10 ; 50 %, la moitié ; 25 %, le quart.`,
    explanation: `${n} × ${p} ÷ 100 = ${answer}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['pour cent', 'valeur'],
        rows: [
          ['100 %', n],
          [`${p} %`, '?'],
        ],
      },
    },
  };
};

/** Augmenter ou baisser de p %. */
export const percentChange: ItemGenerator = (rng) => {
  const p = [10, 20, 25, 50][randomInt(0, 3, rng)];
  const n = randomInt(2, 10, rng) * 20;
  const down = rng() < 0.5;
  const delta = (n * p) / 100;
  const answer = down ? n - delta : n + delta;
  return {
    key: `chg-${p}-${n}-${down ? 'd' : 'u'}`,
    prompt: `Un article coûte ${euro(n)}. Son prix ${down ? 'baisse' : 'augmente'} de ${p} %. Nouveau prix ?`,
    spoken: `Un article coûte ${n} euros. Son prix ${down ? 'baisse' : 'augmente'} de ${p} pour cent. Quel est le nouveau prix ?`,
    choices: choices(answer, [down ? n + delta : n - delta, delta, n - p, n + p], rng, euro),
    answer: euro(answer),
    hint: `Calcule d’abord ${p} % de ${n} (${delta}), puis ${down ? 'enlève' : 'ajoute'} cette somme.`,
    explanation: `${p} % de ${n} = ${delta}. ${n} ${down ? '−' : '+'} ${delta} = ${answer} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['pour cent', 'euros'],
        rows: [
          ['100 %', n],
          [`${p} %`, delta],
          [`${down ? '100 − ' : '100 + '}${p} %`, '?'],
        ],
      },
    },
  };
};

/** Vitesse constante : distance pour une autre durée. */
export const speed: ItemGenerator = (rng) => {
  const v = randomInt(3, 12, rng) * 10;
  const t1 = randomInt(1, 4, rng);
  let t2 = randomInt(1, 6, rng);
  if (t2 === t1) t2 += 1;
  const answer = v * t2;
  return {
    key: `spd-${v}-${t1}-${t2}`,
    prompt: `Une voiture roule à vitesse constante : ${v * t1} km en ${t1} h. Combien de km en ${t2} h ?`,
    spoken: `Une voiture roule à vitesse constante : ${v * t1} kilomètres en ${t1} heure${t1 > 1 ? 's' : ''}. Combien de kilomètres en ${t2} heure${t2 > 1 ? 's' : ''} ?`,
    choices: choices(answer, [v * (t2 + 1), v * (t2 - 1), v * t1 + t2, v * t1 * t2], rng, (n) => `${fmt(n)} km`),
    answer: `${fmt(answer)} km`,
    hint: `En 1 h : ${v * t1} ÷ ${t1} = ${v} km. Puis × ${t2}.`,
    explanation: `${v} km par heure, donc ${v} × ${t2} = ${answer} km.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['heures', 'km'],
        rows: [
          [t1, v * t1],
          [1, v],
          [t2, '?'],
        ],
      },
    },
  };
};

/** Échelle d'une carte. */
export const mapScale: ItemGenerator = (rng) => {
  const kmPerCm = [2, 5, 10, 25][randomInt(0, 3, rng)];
  const cm = randomInt(2, 9, rng);
  const answer = cm * kmPerCm;
  return {
    key: `scale-${kmPerCm}-${cm}`,
    prompt: `Sur la carte, 1 cm représente ${kmPerCm} km. Que représentent ${cm} cm ?`,
    spoken: `Sur la carte, 1 centimètre représente ${kmPerCm} kilomètres. Que représentent ${cm} centimètres ?`,
    choices: choices(answer, [cm + kmPerCm, answer + kmPerCm, answer - kmPerCm, cm * 10], rng, (n) => `${fmt(n)} km`),
    answer: `${fmt(answer)} km`,
    hint: `Chaque centimètre vaut ${kmPerCm} km : multiplie ${cm} par ${kmPerCm}.`,
    explanation: `${cm} × ${kmPerCm} = ${answer} km.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['cm sur la carte', 'km réels'],
        rows: [
          [1, kmPerCm],
          [cm, '?'],
        ],
      },
    },
  };
};

// ---------- Forge des puissances ----------

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
/** « 10⁴ » avec des exposants Unicode (lisibles sans balise). */
export const pow = (base: string | number, exp: number): string =>
  `${base}${String(exp)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')}`;

/** Réponses textuelles : la bonne et trois pièges, sans doublon, dans un ordre mélangé mais reproductible. */
export function textChoices(answer: string, traps: string[], rng: Rng): string[] {
  const pool = [...new Set(traps)].filter((t) => t !== answer).slice(0, 3);
  return shuffle([answer, ...pool], rng);
}

const POW10_RULES = [
  '10ⁿ, c’est 1 suivi de n zéros : 10³ = 1 000.',
  '10⁰ = 1. 10¹ = 10.',
  'Multiplier par 10ⁿ décale chaque chiffre de n rangs vers la gauche.',
];

export const powerOfTen: ItemGenerator = (rng) => {
  const n = randomInt(1, 6, rng);
  const v = 10 ** n;
  return {
    key: `p10-${n}`,
    prompt: `${pow(10, n)} = …`,
    spoken: `10 puissance ${n}, combien ?`,
    choices: choices(v, [10 * n, 10 ** (n + 1), 10 ** (n - 1), n * 100], rng),
    answer: fmt(v),
    hint: `Écris 1, puis ${n} zéro${n > 1 ? 's' : ''}.`,
    explanation: `${pow(10, n)} = 1 suivi de ${n} zéro${n > 1 ? 's' : ''} = ${fmt(v)}.`,
    aid: { kind: 'rule-card', props: { title: 'Puissances de 10', lines: POW10_RULES } },
  };
};

/** L'inverse : 1 000 = 10 puissance combien ? */
export const powerOfTenReverse: ItemGenerator = (rng) => {
  const n = randomInt(2, 7, rng);
  const answer = pow(10, n);
  return {
    key: `p10r-${n}`,
    prompt: `${fmt(10 ** n)} = …`,
    spoken: `${fmt(10 ** n)}, c’est 10 puissance combien ?`,
    choices: textChoices(answer, [pow(10, n - 1), pow(10, n + 1), pow(n, 10), pow(10, n * 10)], rng),
    answer,
    hint: 'Compte les zéros : c’est l’exposant.',
    explanation: `${fmt(10 ** n)} a ${n} zéros : c’est ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Puissances de 10', lines: POW10_RULES } },
  };
};

const SCI_RULES = [
  'Notation scientifique : a × 10ⁿ avec 1 ≤ a < 10 (un seul chiffre avant la virgule).',
  'n = le nombre de rangs dont la virgule se déplace.',
  '3 400 = 3,4 × 10³ (la virgule a reculé de 3 rangs).',
];

export const scientific: ItemGenerator = (rng) => {
  const a = randomInt(11, 99, rng);
  const n = randomInt(2, 6, rng);
  const value = a * 10 ** (n - 1);
  const mant = `${Math.floor(a / 10)},${a % 10}`;
  const answer = `${mant} × ${pow(10, n)}`;
  return {
    key: `sci-${a}-${n}`,
    prompt: `${fmt(value)} = …`,
    spoken: `Écris ${fmt(value)} en notation scientifique.`,
    choices: textChoices(answer, [`${a} × ${pow(10, n - 1)}`, `${mant} × ${pow(10, n - 1)}`, `${mant} × ${pow(10, n + 1)}`, `0,${a} × ${pow(10, n + 1)}`], rng),
    answer,
    hint: 'Un seul chiffre avant la virgule, puis compte de combien de rangs la virgule a bougé.',
    explanation: `${fmt(value)} = ${mant} × ${pow(10, n)} : la virgule recule de ${n} rangs.`,
    aid: { kind: 'rule-card', props: { title: 'Notation scientifique', lines: SCI_RULES } },
  };
};

export const powerOfNumber: ItemGenerator = (rng) => {
  const b = randomInt(2, 6, rng);
  const n = b <= 3 ? randomInt(2, 5, rng) : randomInt(2, 3, rng);
  const v = b ** n;
  return {
    key: `pow-${b}-${n}`,
    prompt: `${pow(b, n)} = …`,
    spoken: `${b} puissance ${n}, combien ?`,
    choices: choices(v, [b * n, b ** (n - 1), b ** (n + 1), b + n], rng),
    answer: fmt(v),
    hint: `${pow(b, n)}, c’est ${b} multiplié par lui-même ${n} fois : ${Array(n).fill(b).join(' × ')}.`,
    explanation: `${Array(n).fill(b).join(' × ')} = ${fmt(v)}.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Puissance d’un nombre',
        lines: [`${pow('a', 'n' as unknown as number)} : a multiplié par lui-même n fois.`, '2³ = 2 × 2 × 2 = 8 (pas 2 × 3 !).', 'a¹ = a et a⁰ = 1.'],
      },
    },
  };
};

const PROD_RULES = [
  'aⁿ × aᵐ = aⁿ⁺ᵐ : on additionne les exposants.',
  'aⁿ ÷ aᵐ = aⁿ⁻ᵐ : on soustrait les exposants.',
  '(aⁿ)ᵐ = aⁿˣᵐ : on multiplie les exposants.',
];

export const productOfPowers: ItemGenerator = (rng) => {
  const b = randomInt(2, 7, rng);
  const n = randomInt(2, 6, rng);
  const m = randomInt(2, 6, rng);
  const divide = rng() < 0.4 && n > m;
  const e = divide ? n - m : n + m;
  const answer = pow(b, e);
  return {
    key: `pp-${b}-${n}-${m}-${divide ? 'd' : 'x'}`,
    prompt: `${pow(b, n)} ${divide ? '÷' : '×'} ${pow(b, m)} = …`,
    spoken: `${b} puissance ${n} ${divide ? 'divisé par' : 'fois'} ${b} puissance ${m}, combien ?`,
    choices: textChoices(answer, [pow(b, n * m), pow(b * b, e), pow(b, divide ? n + m : n - m), pow(b, e + 1)], rng),
    answer,
    hint: divide ? 'Même base : on soustrait les exposants.' : 'Même base : on additionne les exposants.',
    explanation: `${pow(b, n)} ${divide ? '÷' : '×'} ${pow(b, m)} = ${b} puissance ${n} ${divide ? '−' : '+'} ${m} = ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Même base', lines: PROD_RULES } },
  };
};

export const squareRoot: ItemGenerator = (rng) => {
  const r = randomInt(2, 15, rng);
  const v = r * r;
  return {
    key: `sqrt-${v}`,
    prompt: `√${v} = …`,
    spoken: `Racine carrée de ${v}, combien ?`,
    choices: choices(r, [v / 2, r + 1, r - 1, r * 2], rng),
    answer: fmt(r),
    hint: `Cherche le nombre qui, multiplié par lui-même, donne ${v}.`,
    explanation: `${r} × ${r} = ${v}, donc √${v} = ${r}.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Racine carrée',
        lines: [
          '√a est le nombre positif dont le carré est a.',
          '√49 = 7 car 7 × 7 = 49.',
          'Carrés à connaître : 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.',
        ],
      },
    },
  };
};

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const isPrime = (n: number) => n > 1 && PRIMES.includes(n);

export const primeOrDivisor: ItemGenerator = (rng) => {
  if (rng() < 0.5) {
    const p = PRIMES[randomInt(2, PRIMES.length - 1, rng)];
    const traps = [p + 1, p + 3, p * 2].filter((t) => !isPrime(t));
    while (traps.length < 3) traps.push(randomInt(4, 50, rng) * 2);
    return {
      key: `prime-${p}`,
      prompt: 'Lequel est un nombre premier ?',
      spoken: 'Lequel de ces nombres est un nombre premier ?',
      choices: [p, ...traps.slice(0, 3)].sort((a, b) => a - b).map(fmt),
      answer: fmt(p),
      hint: 'Un nombre premier a exactement deux diviseurs : 1 et lui-même. Élimine les pairs (sauf 2) et les multiples de 3 et de 5.',
      explanation: `${p} n’est divisible que par 1 et par ${p} : c’est un nombre premier.`,
      aid: {
        kind: 'rule-card',
        props: {
          title: 'Nombres premiers',
          lines: ['Exactement deux diviseurs : 1 et lui-même.', '2, 3, 5, 7, 11, 13, 17, 19, 23, 29…', 'Un nombre pair (sauf 2) n’est jamais premier.'],
        },
      },
    };
  }
  const n = [12, 18, 20, 24, 30, 36, 42, 45, 48][randomInt(0, 8, rng)];
  const divs = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
  const d = divs[randomInt(1, divs.length - 2, rng)];
  const notDivs = [d + 1, d + 2, d + 3, d + 5].filter((x) => n % x !== 0);
  return {
    key: `div-${n}-${d}`,
    prompt: `Lequel est un diviseur de ${n} ?`,
    spoken: `Lequel de ces nombres est un diviseur de ${n} ?`,
    choices: [d, ...notDivs.slice(0, 3)].sort((a, b) => a - b).map(fmt),
    answer: fmt(d),
    hint: `Un diviseur de ${n} : la division ${n} ÷ d tombe juste, sans reste.`,
    explanation: `${n} ÷ ${d} = ${n / d}, sans reste : ${d} est un diviseur de ${n}.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Diviseurs',
        lines: [
          `Diviseurs de ${n} : ${divs.join(', ')}.`,
          'd divise n quand n ÷ d tombe juste.',
          'Critères : pair → divisible par 2 ; somme des chiffres multiple de 3 → par 3 ; finit par 0 ou 5 → par 5.',
        ],
      },
    },
  };
};

// ---------- Atelier du calcul littéral ----------

const REDUCE_RULES = ['On additionne les x entre eux, et les nombres entre eux.', '3x + 5x = 8x (comme 3 pommes + 5 pommes).', 'x + x = 2x, mais x × x = x².'];
const ax = (a: number, letter = 'x') => (a === 1 ? letter : a === -1 ? `−${letter}` : `${fmt(a)}${letter}`);
const plus = (a: number) => (a < 0 ? `− ${fmt(-a)}` : `+ ${fmt(a)}`);

export const reduceSimple: ItemGenerator = (rng) => {
  const a = randomInt(2, 9, rng);
  const b = randomInt(2, 9, rng);
  const s = a + b;
  return {
    key: `red-${a}-${b}`,
    prompt: `${ax(a)} + ${ax(b)} = …`,
    spoken: `${a} x plus ${b} x, combien ?`,
    choices: textChoices(ax(s), [`${fmt(a * b)}x`, `${fmt(s)}x²`, fmt(s), `${fmt(a * b)}x²`], rng),
    answer: ax(s),
    hint: `${a} x et ${b} x, c’est ${a} + ${b} fois x.`,
    explanation: `${ax(a)} + ${ax(b)} = (${a} + ${b})x = ${ax(s)}.`,
    aid: { kind: 'rule-card', props: { title: 'Réduire', lines: REDUCE_RULES } },
  };
};

export const reduceMixed: ItemGenerator = (rng) => {
  const a = randomInt(2, 7, rng);
  const b = randomInt(1, 9, rng);
  const c = randomInt(1, 5, rng);
  const d = randomInt(-6, 6, rng) || 2;
  const sx = a + c;
  const sn = b + d;
  const answer = sn === 0 ? ax(sx) : `${ax(sx)} ${plus(sn)}`;
  return {
    key: `redm-${a}-${b}-${c}-${d}`,
    prompt: `${ax(a)} + ${b} + ${ax(c)} ${plus(d)} = …`,
    spoken: `${a} x plus ${b} plus ${c} x ${d < 0 ? 'moins' : 'plus'} ${Math.abs(d)}, combien ?`,
    choices: textChoices(answer, [`${ax(sx)} ${plus(b - d)}`, `${ax(sx + sn)}`, `${ax(a + b)} ${plus(c + d)}`, `${ax(sx)} ${plus(sn + 1)}`], rng),
    answer,
    hint: 'Regroupe d’abord les x, puis les nombres seuls.',
    explanation: `Les x : ${a} + ${c} = ${sx}. Les nombres : ${b} ${plus(d)} = ${fmt(sn)}. Résultat : ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Réduire', lines: REDUCE_RULES } },
  };
};

const DEV_RULES = [
  'k(a + b) = ka + kb : on distribue k à chaque terme.',
  '3(x + 4) = 3x + 12.',
  '(a + b)(c + d) = ac + ad + bc + bd : chaque terme avec chaque terme.',
];

export const developSimple: ItemGenerator = (rng) => {
  const k = randomInt(2, 7, rng);
  const b = randomInt(1, 9, rng);
  const answer = `${ax(k)} + ${fmt(k * b)}`;
  return {
    key: `dev-${k}-${b}`,
    prompt: `${k}(x + ${b}) = …`,
    spoken: `${k} facteur de x plus ${b}, développe.`,
    choices: textChoices(answer, [`${ax(k)} + ${b}`, `x + ${fmt(k * b)}`, `${ax(k)} + ${fmt(k + b)}`, `${ax(k + b)}`], rng),
    answer,
    hint: `Multiplie ${k} par x, puis ${k} par ${b}.`,
    explanation: `${k} × x = ${ax(k)} et ${k} × ${b} = ${k * b}, donc ${k}(x + ${b}) = ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Développer', lines: DEV_RULES } },
  };
};

export const developDouble: ItemGenerator = (rng) => {
  const a = randomInt(1, 6, rng);
  const b = randomInt(1, 6, rng);
  const answer = `x² + ${ax(a + b)} + ${fmt(a * b)}`;
  return {
    key: `devd-${a}-${b}`,
    prompt: `(x + ${a})(x + ${b}) = …`,
    spoken: `x plus ${a}, facteur de x plus ${b}, développe.`,
    choices: textChoices(answer, [`x² + ${fmt(a * b)}`, `x² + ${ax(a * b)} + ${fmt(a + b)}`, `${ax(2)} + ${fmt(a + b)}`, `x² + ${ax(a + b)}`], rng),
    answer,
    hint: 'Quatre produits : x × x, x × b, a × x, a × b. Puis réduis.',
    explanation: `x² + ${ax(b)} + ${ax(a)} + ${a * b} = ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Double distributivité', lines: DEV_RULES } },
  };
};

const EQ_RULES = [
  'Une équation reste vraie si on fait la même opération des deux côtés.',
  'x + 7 = 12 → on enlève 7 des deux côtés → x = 5.',
  '3x = 15 → on divise par 3 des deux côtés → x = 5.',
];

export const equationOneStep: ItemGenerator = (rng) => {
  const x = randomInt(-6, 12, rng);
  const mul = rng() < 0.4;
  if (mul) {
    const k = randomInt(2, 9, rng);
    return {
      key: `eq1m-${k}-${x}`,
      prompt: `${ax(k)} = ${fmt(k * x)}. Alors x = …`,
      spoken: `${k} x égale ${say(k * x)}. Combien vaut x ?`,
      choices: choices(x, [k * x - k, -x, x + k, k], rng),
      answer: fmt(x),
      hint: `Divise les deux côtés par ${k}.`,
      explanation: `${fmt(k * x)} ÷ ${k} = ${fmt(x)}.`,
      aid: { kind: 'rule-card', props: { title: 'Équation', lines: EQ_RULES } },
    };
  }
  const b = randomInt(1, 15, rng);
  return {
    key: `eq1a-${b}-${x}`,
    prompt: `x + ${b} = ${fmt(x + b)}. Alors x = …`,
    spoken: `x plus ${b} égale ${say(x + b)}. Combien vaut x ?`,
    choices: choices(x, [x + 2 * b, -x, x + b, b], rng),
    answer: fmt(x),
    hint: `Enlève ${b} des deux côtés.`,
    explanation: `${fmt(x + b)} − ${b} = ${fmt(x)}.`,
    aid: { kind: 'rule-card', props: { title: 'Équation', lines: EQ_RULES } },
  };
};

export const equationTwoSteps: ItemGenerator = (rng) => {
  const x = randomInt(-5, 9, rng);
  const k = randomInt(2, 6, rng);
  const b = randomInt(-9, 9, rng) || 3;
  const r = k * x + b;
  return {
    key: `eq2-${k}-${b}-${x}`,
    prompt: `${ax(k)} ${plus(b)} = ${fmt(r)}. Alors x = …`,
    spoken: `${k} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)} égale ${say(r)}. Combien vaut x ?`,
    choices: choices(x, [(r + b) / k, -x, r - b, x + 1].filter(Number.isInteger), rng),
    answer: fmt(x),
    hint: `D’abord ${b < 0 ? 'ajoute' : 'enlève'} ${Math.abs(b)} des deux côtés, puis divise par ${k}.`,
    explanation: `${fmt(r)} ${plus(-b)} = ${fmt(r - b)}, puis ${fmt(r - b)} ÷ ${k} = ${fmt(x)}.`,
    aid: { kind: 'rule-card', props: { title: 'Équation en deux étapes', lines: EQ_RULES } },
  };
};

// ---------- Belvédère de Thalès ----------

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
  [12, 16, 20],
  [7, 24, 25],
  [15, 20, 25],
];

export const pythagoreHyp: ItemGenerator = (rng) => {
  const [a, b, c] = TRIPLES[randomInt(0, TRIPLES.length - 1, rng)];
  return {
    key: `pyth-h-${a}-${b}`,
    prompt: `Triangle ABC rectangle en A, AB = ${a} cm et AC = ${b} cm. BC = …`,
    spoken: `Triangle A B C rectangle en A, A B égale ${a} centimètres et A C égale ${b} centimètres. Combien mesure B C, l’hypoténuse ?`,
    choices: choices(c, [a + b, c + 1, c - 1, b * 2], rng, (n) => `${fmt(n)} cm`),
    answer: `${fmt(c)} cm`,
    hint: `BC² = AB² + AC² = ${a * a} + ${b * b}. Puis la racine carrée.`,
    explanation: `BC² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, donc BC = √${c * c} = ${c} cm.`,
    figure: { kind: 'right-triangle', props: { a, b, c: '?', labels: ['A', 'B', 'C'] } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Pythagore',
        lines: [
          'Dans un triangle rectangle, hypoténuse² = côté² + côté².',
          'L’hypoténuse est le plus grand côté, en face de l’angle droit.',
          'Pour la trouver : additionne les carrés, puis racine carrée.',
        ],
      },
    },
  };
};

export const pythagoreSide: ItemGenerator = (rng) => {
  const [a, b, c] = TRIPLES[randomInt(0, TRIPLES.length - 1, rng)];
  return {
    key: `pyth-s-${a}-${c}`,
    prompt: `Triangle ABC rectangle en A, BC = ${c} cm et AB = ${a} cm. AC = …`,
    spoken: `Triangle A B C rectangle en A, B C égale ${c} centimètres et A B égale ${a} centimètres. Combien mesure A C ?`,
    choices: choices(b, [c + a, b + 1, b - 1, c - a], rng, (n) => `${fmt(n)} cm`),
    answer: `${fmt(b)} cm`,
    hint: `AC² = BC² − AB² = ${c * c} − ${a * a}. Puis la racine carrée.`,
    explanation: `AC² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, donc AC = √${b * b} = ${b} cm.`,
    figure: { kind: 'right-triangle', props: { a, b: '?', c, labels: ['A', 'B', 'C'] } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Pythagore (un côté)',
        lines: ['côté² = hypoténuse² − autre côté².', 'On soustrait, puis racine carrée.', 'L’hypoténuse BC est en face de l’angle droit A.'],
      },
    },
  };
};

export const thales: ItemGenerator = (rng) => {
  const k = [2, 3, 1.5, 2.5][randomInt(0, 3, rng)];
  const am = randomInt(2, 6, rng);
  const ab = am * k;
  const an = randomInt(2, 6, rng);
  const ac = an * k;
  const f = (n: number) => n.toLocaleString('fr-FR');
  return {
    key: `thales-${am}-${k}-${an}`,
    prompt: `(MN) est parallèle à (BC). AM = ${f(am)}, AB = ${f(ab)}, AN = ${f(an)}. AC = …`,
    spoken: `M N est parallèle à B C. A M égale ${f(am)}, A B égale ${f(ab)}, A N égale ${f(an)}. Combien mesure A C ?`,
    choices: choices(ac, [an + (ab - am), ac + 1, an * 2, ab], rng, f),
    answer: f(ac),
    hint: `AM / AB = AN / AC : ${f(am)} / ${f(ab)} = ${f(an)} / AC. Le coefficient est × ${f(k)}.`,
    explanation: `AB = AM × ${f(k)}, donc AC = AN × ${f(k)} = ${f(ac)}.`,
    figure: { kind: 'thales-figure', props: { am: f(am), ab: f(ab), an: f(an), ac: '?' } },
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['petit triangle', 'grand triangle'],
        rows: [
          [f(am), f(ab)],
          [f(an), '?'],
        ],
        caption: `Coefficient : × ${f(k)}`,
      },
    },
  };
};

export const trigo: ItemGenerator = (rng) => {
  const kind = ['cos', 'sin', 'tan'][randomInt(0, 2, rng)];
  const [a, b, c] = TRIPLES[randomInt(0, 3, rng)];
  // Angle en B : côté adjacent AB = a, côté opposé AC = b, hypoténuse BC = c.
  const answer = kind === 'cos' ? `${a} / ${c}` : kind === 'sin' ? `${b} / ${c}` : `${b} / ${a}`;
  return {
    key: `trig-${kind}-${a}-${b}`,
    prompt: `Triangle ABC rectangle en A. AB = ${a}, AC = ${b}, BC = ${c}. ${kind} B̂ = …`,
    spoken: `Triangle A B C rectangle en A. A B égale ${a}, A C égale ${b}, B C égale ${c}. Que vaut ${kind === 'cos' ? 'cosinus' : kind === 'sin' ? 'sinus' : 'tangente'} de l’angle B ?`,
    choices: textChoices(answer, [`${a} / ${c}`, `${b} / ${c}`, `${b} / ${a}`, `${c} / ${a}`], rng),
    answer,
    hint: `Pour l’angle B : adjacent = AB (${a}), opposé = AC (${b}), hypoténuse = BC (${c}). ${kind === 'cos' ? 'cos = adjacent / hypoténuse' : kind === 'sin' ? 'sin = opposé / hypoténuse' : 'tan = opposé / adjacent'}.`,
    explanation: `${kind} B̂ = ${kind === 'cos' ? 'adjacent / hypoténuse' : kind === 'sin' ? 'opposé / hypoténuse' : 'opposé / adjacent'} = ${answer}.`,
    figure: { kind: 'right-triangle', props: { a, b, c, labels: ['A', 'B', 'C'], angle: 'B' } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'CAH SOH TOA',
        lines: [
          'cos = Adjacent / Hypoténuse.',
          'sin = Opposé / Hypoténuse.',
          'tan = Opposé / Adjacent.',
          'L’hypoténuse est en face de l’angle droit ; l’adjacent touche l’angle.',
        ],
      },
    },
  };
};

// ---------- Observatoire des données ----------

const series = (rng: Rng, n: number, max: number) => Array.from({ length: n }, () => randomInt(1, max, rng));

export const mean: ItemGenerator = (rng) => {
  let s = series(rng, randomInt(4, 5, rng), 12);
  let sum = s.reduce((a, b) => a + b, 0);
  while (sum % s.length !== 0) {
    s = series(rng, s.length, 12);
    sum = s.reduce((a, b) => a + b, 0);
  }
  const m = sum / s.length;
  return {
    key: `mean-${s.join('-')}`,
    prompt: `Notes : ${s.join(' ; ')}. Moyenne = …`,
    spoken: `Les notes sont ${s.join(', ')}. Quelle est la moyenne ?`,
    choices: choices(m, [sum, Math.max(...s), m + 1, m - 1], rng),
    answer: fmt(m),
    hint: `Additionne tout (${sum}), puis divise par le nombre de notes (${s.length}).`,
    explanation: `${s.join(' + ')} = ${sum}, et ${sum} ÷ ${s.length} = ${m}.`,
    // Les barres seulement : la valeur repère n'est pas dessinée, sinon elle donnerait la réponse.
    aid: { kind: 'bar-list', props: { values: s } },
  };
};

export const medianRange: ItemGenerator = (rng) => {
  const s = series(rng, 5, 15).sort((a, b) => a - b);
  const med = s[2];
  const range = s[4] - s[0];
  const askRange = rng() < 0.4;
  return {
    key: `med-${s.join('-')}-${askRange ? 'r' : 'm'}`,
    prompt: `Série rangée : ${s.join(' ; ')}. ${askRange ? 'Étendue' : 'Médiane'} = …`,
    spoken: `La série rangée est ${s.join(', ')}. Quelle est ${askRange ? 'l’étendue' : 'la médiane'} ?`,
    choices: choices(askRange ? range : med, askRange ? [s[4], s[0], range + 1, med] : [s[1], s[3], (s[0] + s[4]) / 2, range].filter(Number.isInteger), rng),
    answer: fmt(askRange ? range : med),
    hint: askRange
      ? 'Étendue = plus grande valeur − plus petite valeur.'
      : 'Médiane : la valeur du milieu de la série rangée (autant de valeurs avant qu’après).',
    explanation: askRange ? `${s[4]} − ${s[0]} = ${range}.` : `Cinq valeurs rangées : la troisième, ${med}, est au milieu.`,
    aid: { kind: 'bar-list', props: { values: s } },
  };
};

export const probability: ItemGenerator = (rng) => {
  const kind = randomInt(0, 2, rng);
  if (kind === 0) {
    const red = randomInt(1, 5, rng);
    const blue = randomInt(1, 5, rng);
    const total = red + blue;
    const answer = `${red}/${total}`;
    return {
      key: `proba-urne-${red}-${blue}`,
      prompt: `Un sac contient ${red} boule${red > 1 ? 's' : ''} rouge${red > 1 ? 's' : ''} et ${blue} bleue${blue > 1 ? 's' : ''}. Probabilité de tirer une rouge = …`,
      spoken: `Un sac contient ${red} boules rouges et ${blue} boules bleues. Quelle est la probabilité de tirer une rouge ?`,
      choices: textChoices(answer, [`${blue}/${total}`, `${red}/${blue}`, `1/${total}`, `${total}/${red}`], rng),
      answer,
      hint: `Cas favorables : ${red} rouges. Cas possibles : ${total} boules en tout.`,
      explanation: `${red} boules rouges sur ${total} boules : ${answer}.`,
      aid: {
        kind: 'rule-card',
        props: {
          title: 'Probabilité',
          lines: ['Probabilité = cas favorables / cas possibles.', 'Toujours entre 0 (impossible) et 1 (certain).', 'Un dé équilibré : chaque face a 1/6.'],
        },
      },
    };
  }
  const faces = [1, 2, 3, 4, 5, 6];
  const even = kind === 1;
  const fav = even ? faces.filter((f) => f % 2 === 0) : faces.filter((f) => f > 4);
  const answer = even ? '3/6' : '2/6';
  return {
    key: `proba-de-${even ? 'pair' : 'sup4'}`,
    prompt: `On lance un dé à 6 faces. Probabilité d’obtenir ${even ? 'un nombre pair' : 'plus de 4'} = …`,
    spoken: `On lance un dé à six faces. Quelle est la probabilité d’obtenir ${even ? 'un nombre pair' : 'plus de 4'} ?`,
    choices: textChoices(answer, ['1/6', '4/6', '5/6', even ? '2/6' : '3/6'], rng),
    answer,
    hint: `Faces qui conviennent : ${fav.join(', ')}. Faces possibles : 6.`,
    explanation: `${fav.length} face${fav.length > 1 ? 's' : ''} sur 6 : ${answer}.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Probabilité',
        lines: ['Probabilité = cas favorables / cas possibles.', 'Dé à 6 faces : 6 cas possibles.', `Faces qui conviennent ici : ${fav.join(', ')}.`],
      },
    },
  };
};

// ---------- Phare des fonctions ----------

export const imageOf: ItemGenerator = (rng) => {
  const a = nonZero(-4, 5, rng);
  const b = randomInt(-6, 8, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  const expr = `f(x) = ${ax(a)} ${plus(b)}`;
  return {
    key: `img-${a}-${b}-${x}`,
    prompt: `${expr}. Image de ${fmt(x)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quelle est l’image de ${say(x)} ?`,
    choices: choices(y, [a * x - b, a + b + x, -y, y + a], rng),
    answer: fmt(y),
    hint: `Remplace x par ${fmt(x)} : ${a} × ${par(x)} ${plus(b)}.`,
    explanation: `f(${fmt(x)}) = ${a} × ${par(x)} ${plus(b)} = ${fmt(a * x)} ${plus(b)} = ${fmt(y)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['x', 'f(x)'],
        rows: [
          [fmt(x - 1), fmt(a * (x - 1) + b)],
          [fmt(x), '?'],
          [fmt(x + 1), fmt(a * (x + 1) + b)],
        ],
        caption: 'Tableau de valeurs',
      },
    },
  };
};

export const antecedent: ItemGenerator = (rng) => {
  const a = nonZero(-3, 4, rng);
  const b = randomInt(-5, 5, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  return {
    key: `ant-${a}-${b}-${x}`,
    prompt: `f(x) = ${ax(a)} ${plus(b)}. Antécédent de ${fmt(y)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quel est l’antécédent de ${say(y)} ?`,
    choices: choices(x, [y, -x, x + 1, x - 1], rng),
    answer: fmt(x),
    hint: `Résous ${ax(a)} ${plus(b)} = ${fmt(y)} : enlève ${fmt(b)}, puis divise par ${fmt(a)}.`,
    explanation: `${ax(a)} = ${fmt(y)} ${plus(-b)} = ${fmt(y - b)}, donc x = ${fmt(y - b)} ÷ ${par(a)} = ${fmt(x)}.`,
    aid: { kind: 'ratio-table', props: { cols: ['x', 'f(x)'], rows: [['?', fmt(y)]], caption: 'On cherche x tel que f(x) = ' + fmt(y) } },
  };
};

export const linearOrAffine: ItemGenerator = (rng) => {
  const a = nonZero(-4, 5, rng);
  const b = rng() < 0.4 ? 0 : nonZero(-6, 6, rng);
  const expr = b === 0 ? `f(x) = ${ax(a)}` : `f(x) = ${ax(a)} ${plus(b)}`;
  const askCoef = rng() < 0.5;
  if (askCoef) {
    return {
      key: `coef-${a}-${b}`,
      prompt: `${expr}. Coefficient directeur = …`,
      spoken: `f de x égale ${say(a)} x ${b === 0 ? '' : (b < 0 ? 'moins ' : 'plus ') + Math.abs(b)}. Quel est le coefficient directeur ?`,
      choices: choices(a, [b, -a, a + b, 1], rng),
      answer: fmt(a),
      hint: 'Le coefficient directeur est le nombre devant x.',
      explanation: `Dans ${expr}, le nombre devant x est ${fmt(a)}.`,
      aid: {
        kind: 'rule-card',
        props: {
          title: 'Linéaire, affine',
          lines: [
            'f(x) = ax : fonction linéaire (droite qui passe par l’origine).',
            'f(x) = ax + b : fonction affine (a = coefficient directeur, b = ordonnée à l’origine).',
            'a positif : la droite monte. a négatif : elle descend.',
          ],
        },
      },
    };
  }
  const answer = b === 0 ? 'linéaire' : 'affine';
  return {
    key: `kind-${a}-${b}`,
    prompt: `${expr}. Cette fonction est …`,
    spoken: `f de x égale ${say(a)} x ${b === 0 ? '' : (b < 0 ? 'moins ' : 'plus ') + Math.abs(b)}. Cette fonction est linéaire ou affine ?`,
    choices: ['affine', 'linéaire'],
    answer,
    hint: 'Linéaire : f(x) = ax, rien d’ajouté. Affine : f(x) = ax + b.',
    explanation: b === 0 ? `${expr} est de la forme ax : linéaire.` : `${expr} est de la forme ax + b avec b = ${fmt(b)} : affine.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Linéaire, affine',
        lines: [
          'f(x) = ax : fonction linéaire (droite qui passe par l’origine).',
          'f(x) = ax + b : fonction affine (a = coefficient directeur, b = ordonnée à l’origine).',
          'Une fonction linéaire est aussi affine, avec b = 0.',
        ],
      },
    },
  };
};

// ---------- Les exercices ----------

const THERMO = 'Compare les deux nombres. Sur la droite, le plus petit est toujours à gauche.';
const THERMO_READ = 'Lis le nombre repéré par le point. À gauche de zéro, il est négatif.';
const BANQUISE = 'Additionne les deux relatifs. Le bond sur la droite te montre le chemin.';
const BANQUISE_SUB = 'Soustraire un nombre, c’est ajouter son opposé. Suis le bond sur la droite.';
const CREVASSES = 'Multiplie. Regarde les signes d’abord, la règle est affichée.';
const CREVASSES_DIV = 'Divise. Même règle des signes que la multiplication.';
const ETALS = 'Complète le tableau de proportionnalité : passe par le prix d’un seul.';
const ETALS_COEF = 'Complète le tableau : trouve le coefficient qui fait passer d’une colonne à l’autre.';
const REMISES = 'Prends le pourcentage du nombre. Le tableau te rappelle que 100 % est le tout.';
const REMISES_CHANGE = 'Calcule le nouveau prix après la hausse ou la baisse, en deux étapes.';
const BALANCES = 'Vitesse constante : trouve la distance en une heure, puis multiplie.';
const BALANCES_SCALE = 'Échelle : chaque centimètre de la carte vaut la même distance réelle.';

const ETINCELLES = 'Écris la puissance de 10 en nombre : un 1 suivi d’autant de zéros que l’exposant.';
const ETINCELLES_SCI = 'Écris le nombre en notation scientifique : un seul chiffre avant la virgule, fois une puissance de 10.';
const ENCLUME = 'Calcule la puissance : le nombre multiplié par lui-même, autant de fois que l’exposant.';
const ENCLUME_PROD = 'Même base : additionne les exposants pour un produit, soustrais-les pour un quotient.';
const TREMPE = 'Trouve la racine carrée : le nombre qui, multiplié par lui-même, donne celui-ci.';
const TREMPE_PRIME = 'Nombres premiers et diviseurs : la règle et les critères sont affichés.';
const REDUIRE = 'Réduis l’expression : regroupe les x entre eux, puis les nombres entre eux.';
const REDUIRE_MIXTE = 'Réduis l’expression : les x d’un côté, les nombres de l’autre, attention aux signes.';
const DEVELOPPER = 'Développe : distribue le nombre à chaque terme de la parenthèse.';
const DEVELOPPER_DOUBLE = 'Développe la double distributivité : chaque terme avec chaque terme, puis réduis.';
const EQUILIBRE = 'Trouve x : fais la même opération des deux côtés de l’égalité.';
const EQUILIBRE_DEUX = 'Trouve x en deux étapes : d’abord le nombre seul, puis divise.';

const PYTHAGORE = 'Trouve l’hypoténuse : hypoténuse au carré égale la somme des carrés des deux autres côtés. La figure est codée.';
const PYTHAGORE_COTE = 'Trouve un côté de l’angle droit : hypoténuse au carré moins l’autre côté au carré, puis racine carrée.';
const THALES = 'Les droites sont parallèles : les longueurs du grand triangle sont celles du petit multipliées par le même nombre.';
const TRIGO = 'Choisis le bon rapport pour l’angle B : cosinus, sinus ou tangente. Le rappel est affiché.';
const MOYENNE = 'Calcule la moyenne : additionne toutes les valeurs, puis divise par leur nombre.';
const MEDIANE = 'Médiane ou étendue de la série rangée : la valeur du milieu, ou la plus grande moins la plus petite.';
const CHANCES = 'Probabilité : cas favorables sur cas possibles. Compte-les avant de répondre.';
const IMAGES = 'Calcule l’image : remplace x par le nombre dans la formule. Le tableau de valeurs t’aide.';
const ANTECEDENT = 'Trouve l’antécédent : résous l’équation f(x) égale le nombre donné.';
const DROITES = 'Coefficient directeur, fonction linéaire ou affine : la règle est affichée.';

export const COLLEGE_EXERCISES: ExerciseDef[] = [
  defineData({ biome: 'glacier', type: 'thermometre', level: 1, instruction: THERMO, generators: [compareRelatifs], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'thermometre', level: 2, instruction: THERMO_READ, generators: [readRelatif], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'banquise', level: 1, instruction: BANQUISE, generators: [addRelatifs], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'banquise', level: 2, instruction: BANQUISE_SUB, generators: [subRelatifs], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'crevasses', level: 1, instruction: CREVASSES, generators: [mulRelatifs], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'crevasses', level: 2, instruction: CREVASSES_DIV, generators: [divRelatifs], block: 'glace' }),
  defineData({ biome: 'marche', type: 'etals', level: 1, instruction: ETALS, generators: [fourthInt], block: 'toile' }),
  defineData({ biome: 'marche', type: 'etals', level: 2, instruction: ETALS_COEF, generators: [fourthCoef], block: 'toile' }),
  defineData({ biome: 'marche', type: 'remises', level: 1, instruction: REMISES, generators: [percentOf], block: 'toile' }),
  defineData({ biome: 'marche', type: 'remises', level: 2, instruction: REMISES_CHANGE, generators: [percentChange], block: 'toile' }),
  defineData({ biome: 'marche', type: 'balances', level: 1, instruction: BALANCES, generators: [speed], block: 'toile' }),
  defineData({ biome: 'marche', type: 'balances', level: 2, instruction: BALANCES_SCALE, generators: [mapScale], block: 'toile' }),
  defineData({ biome: 'forge', type: 'etincelles', level: 1, instruction: ETINCELLES, generators: [powerOfTen, powerOfTenReverse], block: 'acier' }),
  defineData({ biome: 'forge', type: 'etincelles', level: 2, instruction: ETINCELLES_SCI, generators: [scientific], block: 'acier' }),
  defineData({ biome: 'forge', type: 'enclume', level: 1, instruction: ENCLUME, generators: [powerOfNumber], block: 'acier' }),
  defineData({ biome: 'forge', type: 'enclume', level: 2, instruction: ENCLUME_PROD, generators: [productOfPowers], block: 'acier' }),
  defineData({ biome: 'forge', type: 'trempe', level: 1, instruction: TREMPE, generators: [squareRoot], block: 'acier' }),
  defineData({ biome: 'forge', type: 'trempe', level: 2, instruction: TREMPE_PRIME, generators: [primeOrDivisor], block: 'acier' }),
  defineData({ biome: 'atelier', type: 'reduire', level: 1, instruction: REDUIRE, generators: [reduceSimple], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'reduire', level: 2, instruction: REDUIRE_MIXTE, generators: [reduceMixed], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'developper', level: 1, instruction: DEVELOPPER, generators: [developSimple], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'developper', level: 2, instruction: DEVELOPPER_DOUBLE, generators: [developDouble], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 1, instruction: EQUILIBRE, generators: [equationOneStep], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 2, instruction: EQUILIBRE_DEUX, generators: [equationTwoSteps], block: 'calque' }),
  defineData({ biome: 'belvedere', type: 'pythagore', level: 1, instruction: PYTHAGORE, generators: [pythagoreHyp], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'pythagore', level: 2, instruction: PYTHAGORE_COTE, generators: [pythagoreSide], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'thales', level: 1, instruction: THALES, generators: [thales], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'trigo', level: 1, instruction: TRIGO, generators: [trigo], block: 'marbre' }),
  defineData({ biome: 'donnees', type: 'moyenne', level: 1, instruction: MOYENNE, generators: [mean], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'moyenne', level: 2, instruction: MEDIANE, generators: [medianRange], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'chances', level: 1, instruction: CHANCES, generators: [probability], block: 'quartz' }),
  defineData({ biome: 'phare', type: 'images', level: 1, instruction: IMAGES, generators: [imageOf], block: 'prisme' }),
  defineData({ biome: 'phare', type: 'images', level: 2, instruction: ANTECEDENT, generators: [antecedent], block: 'prisme' }),
  defineData({ biome: 'phare', type: 'droites', level: 1, instruction: DROITES, generators: [linearOrAffine], block: 'prisme' }),
];
