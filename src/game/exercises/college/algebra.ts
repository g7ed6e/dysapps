// Atelier du calcul littéral : réduire, développer, factoriser, équations.
import { randomInt } from '../../../core/random';
import { choices, fmt, gcd, type ItemGenerator, nonZero, par, say, textChoices } from './common';

// ---------- Atelier du calcul littéral ----------

const REDUCE_RULES = ['On additionne les x entre eux, et les nombres entre eux.', '3x + 5x = 8x (comme 3 pommes + 5 pommes).', 'x + x = 2x, mais x × x = x².'];

export const ax = (a: number, letter = 'x') => (a === 1 ? letter : a === -1 ? `−${letter}` : `${fmt(a)}${letter}`);

export const plus = (a: number) => (a < 0 ? `− ${fmt(-a)}` : `+ ${fmt(a)}`);

/** « 4x + 3 », « 4x − 1 », « 4x » (jamais « 4x + 0 »). */
const withConst = (x: number, n: number) => (n === 0 ? ax(x) : `${ax(x)} ${plus(n)}`);

export const reduceSimple: ItemGenerator = (rng) => {
  const a = randomInt(2, 9, rng);
  let b = randomInt(2, 9, rng);
  // 2 × 2 = 2 + 2 : le piège du produit serait la réponse, il ne resterait que trois choix.
  if (a === 2 && b === 2) b = 3;
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
  const answer = withConst(sx, sn);
  return {
    key: `redm-${a}-${b}-${c}-${d}`,
    prompt: `${ax(a)} + ${b} + ${ax(c)} ${plus(d)} = …`,
    spoken: `${a} x plus ${b} plus ${c} x ${d < 0 ? 'moins' : 'plus'} ${Math.abs(d)}, combien ?`,
    // Pièges : un signe perdu, tout mis ensemble, un nombre compté avec les x, une unité d'écart (jamais « 0x » ni « −x »).
    choices: textChoices(
      answer,
      [
        [sx, b - d],
        [sx + sn, 0],
        [a + b, c + d],
        [sx, sn + 1],
        [sx, sn - 1],
      ]
        .filter(([x]) => x > 0)
        .map(([x, n]) => withConst(x, n)),
      rng,
    ),
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
    spoken: `${k} fois la parenthèse x plus ${b}. Développe.`,
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
    spoken: `La parenthèse x plus ${a}, fois la parenthèse x plus ${b}. Développe.`,
    choices: textChoices(answer, [`x² + ${fmt(a * b)}`, `x² + ${ax(a * b)} + ${fmt(a + b)}`, `${ax(2)} + ${fmt(a + b)}`, `x² + ${ax(a + b)}`], rng),
    answer,
    hint: `Quatre produits : x × x, x × ${b}, ${a} × x, ${a} × ${b}. Puis réduis.`,
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

const FACT_RULES = [
  'Factoriser, c’est le contraire de développer.',
  '6x + 15 = 3 × 2x + 3 × 5 = 3(2x + 5).',
  'x² + 4x = x × x + x × 4 = x(x + 4).',
];

/** Factoriser par un nombre : 12x − 8 = 4(3x − 2). Le facteur est le plus grand : une seule écriture juste. */
export const factorNumber: ItemGenerator = (rng) => {
  let k = randomInt(2, 6, rng);
  let a = randomInt(1, 5, rng);
  let b = randomInt(1, 7, rng);
  // Le facteur commun est bien k (a et b sans diviseur commun), et jamais l'exemple du rappel.
  while (gcd(a, b) !== 1 || (k === 3 && a === 2 && b === 5)) {
    k = randomInt(2, 6, rng);
    a = randomInt(1, 5, rng);
    b = randomInt(1, 7, rng);
  }
  const minus = rng() < 0.4;
  const op = minus ? '−' : '+';
  const expr = `${ax(k * a)} ${op} ${k * b}`;
  const answer = `${k}(${ax(a)} ${op} ${b})`;
  // Pièges : le second terme pas divisé, le premier pas divisé, le coefficient de x oublié, x mis en facteur alors qu'un terme n'en a pas,
  // le facteur pris sur le premier terme seulement.
  const traps = [
    `${k}(${ax(a)} ${op} ${k * b})`,
    `${k}(${ax(k * a)} ${op} ${b})`,
    ...(a > 1 ? [`${k}(x ${op} ${b})`, `${k * a}(x ${op} ${b})`] : []),
    `${k}x(${a} ${op} ${b})`,
  ];
  return {
    key: `fact-${k}-${a}-${b}-${minus ? 'm' : 'p'}`,
    prompt: `${expr} = …`,
    spoken: `${k * a} x ${minus ? 'moins' : 'plus'} ${k * b}. Factorise.`,
    choices: textChoices(answer, traps, rng),
    answer,
    hint: `Cherche le nombre qui divise ${k * a} et ${k * b} : ${k * a} = ${k} × ${a} et ${k * b} = ${k} × ${b}.`,
    explanation: `${ax(k * a)} = ${k} × ${ax(a)} et ${k * b} = ${k} × ${b} : le facteur commun est ${k}. Donc ${expr} = ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Factoriser', lines: FACT_RULES } },
  };
};

/** Factoriser par x : x² + 5x = x(x + 5). */
export const factorX: ItemGenerator = (rng) => {
  let b = randomInt(2, 9, rng);
  const minus = rng() < 0.4;
  if (b === 4 && !minus) b = 7;
  const op = minus ? '−' : '+';
  const expr = `x² ${op} ${ax(b)}`;
  const answer = `x(x ${op} ${b})`;
  // Pièges : le x laissé dans la parenthèse (x² ou bx), le nombre qui garde le x, x² sorti à la place de x.
  const traps = [`x(x² ${op} ${b})`, `x(x ${op} ${ax(b)})`, `${ax(b)}(x ${op} 1)`, `x²(1 ${op} ${b})`];
  return {
    key: `factx-${b}-${minus ? 'm' : 'p'}`,
    prompt: `${expr} = …`,
    spoken: `x au carré ${minus ? 'moins' : 'plus'} ${b} x. Factorise.`,
    choices: textChoices(answer, traps, rng),
    answer,
    hint: `x² = x × x et ${ax(b)} = x × ${b} : x est dans les deux termes.`,
    explanation: `x² = x × x et ${ax(b)} = x × ${b} : le facteur commun est x. Donc ${expr} = ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Factoriser', lines: FACT_RULES } },
  };
};

const TEST_RULES = [
  'Tester une égalité : on remplace x par la valeur, de chaque côté.',
  'Même résultat des deux côtés : l’égalité est vraie.',
  'Deux résultats différents : elle est fausse pour cette valeur.',
];

/** « 2 x », « x » : le coefficient lu à voix haute. */
const sayX = (a: number) => (a === 1 ? 'x' : `${a} x`);

/** Tester une égalité pour une valeur de x : 4x − 5 = 2x + 1 pour x = 3 ? */
export const testEquality: ItemGenerator = (rng) => {
  const s = randomInt(-3, 6, rng);
  const a = randomInt(2, 6, rng);
  const c = randomInt(1, a - 1, rng);
  const b = nonZero(-9, 9, rng);
  const d = (a - c) * s + b;
  const yes = rng() < 0.5;
  // Une valeur fausse proche de la solution : une unité d'écart, ou le signe perdu.
  const wrong = [s + 1, s - 1, ...(s !== 0 ? [-s] : [])];
  const t = yes ? s : wrong[randomInt(0, wrong.length - 1, rng)];
  const left = a * t + b;
  const right = c * t + d;
  const rhs = d === 0 ? ax(c) : `${ax(c)} ${plus(d)}`;
  const sayRhs = d === 0 ? sayX(c) : `${sayX(c)} ${d < 0 ? 'moins' : 'plus'} ${Math.abs(d)}`;
  return {
    key: `test-${a}-${b}-${c}-${d}-${t}`,
    prompt: `Pour x = ${fmt(t)}, l’égalité ${ax(a)} ${plus(b)} = ${rhs} est-elle vraie ?`,
    spoken: `Pour x égale ${say(t)}, l’égalité ${sayX(a)} ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)} égale ${sayRhs} est-elle vraie ?`,
    choices: ['non', 'oui'],
    answer: yes ? 'oui' : 'non',
    hint: `Remplace x par ${fmt(t)} à gauche, puis à droite, et compare les deux résultats.`,
    explanation: `À gauche : ${a} × ${par(t)} ${plus(b)} = ${fmt(left)}. À droite : ${c} × ${par(t)}${d === 0 ? '' : ` ${plus(d)}`} = ${fmt(right)}. ${
      yes ? 'Même résultat : oui, l’égalité est vraie.' : `${fmt(left)} n’est pas égal à ${fmt(right)} : non, elle est fausse pour x = ${fmt(t)}.`
    }`,
    aid: { kind: 'rule-card', props: { title: 'Tester une égalité', lines: TEST_RULES } },
  };
};

const PRODUCT_RULES = [
  'Un produit est nul si l’un de ses facteurs est nul.',
  '(x − 2)(x + 1) = 0 : x − 2 = 0 ou x + 1 = 0.',
  'Donc x = 2 ou x = −1 : le signe change.',
];

/** « x − 3 », « x + 5 », « x » (racine 0). */
const factorOf = (r: number) => (r === 0 ? 'x' : r > 0 ? `(x − ${r})` : `(x + ${-r})`);

const sayFactor = (r: number) => (r === 0 ? 'x' : `la parenthèse x ${r > 0 ? 'moins' : 'plus'} ${Math.abs(r)}`);

const solveFactor = (r: number) => (r === 0 ? 'x = 0' : `${factorOf(r).replace(/[()]/g, '')} = 0, donc x = ${fmt(r)}`);

const roots = (p: number, q: number) => (p === q ? `x = ${fmt(p)}` : `x = ${fmt(p)} ou x = ${fmt(q)}`);

/** Équation produit : (x − 3)(x + 5) = 0, ou x(x − 4) = 0. */
export const productEquation: ItemGenerator = (rng) => {
  const withX = rng() < 0.3;
  let r1 = withX ? 0 : nonZero(-7, 7, rng);
  let r2 = nonZero(-7, 7, rng);
  // Deux solutions différentes, de valeurs absolues différentes (sinon deux pièges de signe se confondraient),
  // et jamais l'exemple du rappel.
  while (Math.abs(r1) === Math.abs(r2) || (r1 === 2 && r2 === -1)) {
    r1 = withX ? 0 : nonZero(-7, 7, rng);
    r2 = nonZero(-7, 7, rng);
  }
  const answer = roots(r1, r2);
  // Pièges : le signe gardé (x − 3 donne −3), un seul signe corrigé, la solution x = 0 oubliée.
  const traps = withX ? [roots(0, -r2), `x = ${fmt(r2)}`, `x = ${fmt(-r2)}`] : [roots(-r1, -r2), roots(r1, -r2), roots(-r1, r2)];
  return {
    key: `prod-${r1}-${r2}`,
    prompt: `${factorOf(r1)}${factorOf(r2)} = 0. Quelles sont les solutions ?`,
    spoken: `${sayFactor(r1).replace(/^l/, 'L')}, fois ${sayFactor(r2)}, égale zéro. Quelles sont les solutions ?`,
    choices: textChoices(answer, traps, rng),
    answer,
    hint: 'Un des deux facteurs vaut zéro : écris les deux petites équations et résous-les.',
    explanation: `Soit ${solveFactor(r1)} ; soit ${solveFactor(r2)}. Solutions : ${answer}.`,
    aid: { kind: 'rule-card', props: { title: 'Équation produit', lines: PRODUCT_RULES } },
  };
};
