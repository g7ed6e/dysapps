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
];
