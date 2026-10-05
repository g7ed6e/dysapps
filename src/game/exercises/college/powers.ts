// Forge des puissances : puissances de 10, notation scientifique, puissances, racines, nombres premiers.
import { randomInt } from '../../../core/random';
import { drawChoices } from '../../../core/choices';
import { choices, fmt, type ItemGenerator, textChoices } from './common';

// ---------- Forge des puissances ----------

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };

/** « 10⁴ » avec des exposants Unicode (lisibles sans balise). */
export const pow = (base: string | number, exp: number): string =>
  `${base}${String(exp)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('')}`;

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
    // Pièges : l'exposant pris comme facteur (10 × n, 100 × n), un ou deux zéros de trop ou de moins ; jamais de
    // voisin (100 001 n'est pas une erreur d'élève).
    choices: choices(v, [10 * n, n * 100, 10 ** (n + 1), 10 ** (n - 1), 10 ** (n + 2), ...(n >= 2 ? [10 ** (n - 2)] : [])], rng, fmt, false),
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
  // « 3,4 », ou « 3 » quand le chiffre des unités de a est 0 (jamais « 3,0 »).
  const mant = (a / 10).toLocaleString('fr-FR');
  const answer = `${mant} × ${pow(10, n)}`;
  return {
    key: `sci-${a}-${n}`,
    // « en notation scientifique » : 34 × 10² est aussi égal à 3 400, mais ce n'est pas la notation scientifique.
    prompt: `${fmt(value)} en notation scientifique = …`,
    spoken: `Écris ${fmt(value)} en notation scientifique.`,
    choices: textChoices(answer, [`${a} × ${pow(10, n - 1)}`, `${mant} × ${pow(10, n - 1)}`, `${mant} × ${pow(10, n + 1)}`, `${(a / 100).toLocaleString('fr-FR')} × ${pow(10, n + 1)}`], rng),
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
        lines: ['aⁿ : a multiplié par lui-même n fois.', '2³ = 2 × 2 × 2 = 8 (pas 2 × 3 !).', 'a¹ = a et a⁰ = 1.'],
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
  // Les carrés parfaits du programme : de 1 à 144 (c4.ma.a.carres-racine), comme le rappel affiché.
  const r = randomInt(2, 12, rng);
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

/** Les questions de diviseurs possibles : n, un diviseur d (ni 1 ni n), et les non-diviseurs de part et d'autre de d. */
const DIVISOR_PAIRS = [12, 18, 20, 24, 30, 36, 42, 45, 48].flatMap((n) => {
  const divs = Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0);
  const notDivs = Array.from({ length: n }, (_, i) => i + 2).filter((x) => n % x !== 0);
  return divs.slice(1, -1).map((d) => ({
    n,
    d,
    divs,
    below: notDivs.filter((x) => x < d).reverse(),
    above: notDivs.filter((x) => x > d),
  }));
});

export const primeOrDivisor: ItemGenerator = (rng) => {
  if (rng() < 0.5) {
    const p = PRIMES[randomInt(2, PRIMES.length - 1, rng)];
    // Des non-premiers des deux côtés de p : la place de la réponse est tirée ici (les choix ne sont pas replacés).
    const traps = [p - 1, p - 3, p - 5, p + 1, p + 3, p + 5, p * 2].filter((t) => t > 1 && !isPrime(t));
    return {
      key: `prime-${p}`,
      prompt: 'Lequel est un nombre premier ?',
      spoken: 'Lequel de ces nombres est un nombre premier ?',
      // Un voisin ajouté n'est jamais premier : une seule bonne réponse.
      choices: drawChoices(p, traps, rng, { neighbourOk: (t) => t > 1 && !isPrime(t) }).map(fmt),
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
  // La place de d (1re à 4e) est tirée d'abord, puis un couple (n, d) qui la permet : assez de non-diviseurs plus
  // petits et plus grands que d (un petit diviseur n'en a souvent aucun plus petit que lui). Pièges : les non-diviseurs
  // les plus proches de d, de part et d'autre ; jamais un voisin inventé, qui pourrait être un autre diviseur.
  const wanted = randomInt(0, 3, rng);
  const pairs = DIVISOR_PAIRS.filter((q) => q.below.length >= wanted && q.above.length >= 3 - wanted);
  const { n, d, divs, below, above } = pairs[randomInt(0, pairs.length - 1, rng)];
  const picked = [...below.slice(0, wanted), ...above.slice(0, 3 - wanted)];
  return {
    key: `div-${n}-${d}`,
    prompt: `Lequel est un diviseur de ${n} ?`,
    spoken: `Lequel de ces nombres est un diviseur de ${n} ?`,
    choices: [d, ...picked].sort((a, b) => a - b).map(fmt),
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

/** Les facteurs premiers de n, du plus petit au plus grand : 60 → [2, 2, 3, 5]. */
export const primeFactors = (n: number): number[] => {
  const out: number[] = [];
  let rest = n;
  for (let p = 2; rest > 1; p++) {
    while (rest % p === 0) {
      out.push(p);
      rest /= p;
    }
  }
  return out;
};

const product = (factors: number[]) => [...factors].sort((a, b) => a - b).join(' × ');

/**
 * Les nombres à décomposer : trois facteurs premiers ou plus, tous inférieurs ou égaux à 7 (les divisions se font de
 * tête), jamais plus de trois fois le même facteur (pas 48 = 2 × 2 × 2 × 2 × 3 : on ne compte pas des 2 à l'œil).
 */
export const TO_FACTOR = [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 50, 54, 56, 60, 63, 70, 72, 75, 84, 90, 98, 100];

/** Décomposer en produit de facteurs premiers, écrit en long (« 2 × 2 × 3 × 5 ») : pas d'exposant à déchiffrer. */
export const primeDecomposition: ItemGenerator = (rng) => {
  const n = TO_FACTOR[randomInt(0, TO_FACTOR.length - 1, rng)];
  const f = primeFactors(n);
  const answer = product(f);
  const small = f[0];
  const big = f[f.length - 1];
  // Pièges, dans cet ordre : un facteur oublié, deux facteurs égaux restés ensemble (4, 9 ne sont pas premiers), la
  // division arrêtée à la première étape (par le plus petit, puis par le plus grand), un facteur de trop. Le facteur de
  // trop n'est proposé que si le plus petit facteur n'est écrit qu'une fois : le piège ne se joue jamais sur le nombre
  // de 2 à compter. Deux pièges peuvent s'écrire pareil (45 : 9 × 5 est aussi l'arrêt par 5) : on garde les trois
  // premiers différents, ici, sans compter sur le tri de `textChoices`.
  const repeated = f.find((p, i) => f[i + 1] === p);
  const candidates = [
    product(f.slice(1)),
    ...(repeated ? [product([repeated * repeated, ...f.filter((_, i) => i !== f.indexOf(repeated) && i !== f.indexOf(repeated) + 1)])] : []),
    product([small, n / small]),
    product([big, n / big]),
    ...(f.filter((p) => p === small).length === 1 ? [product([...f, small])] : []),
  ];
  const traps = candidates.filter((t, i) => t !== answer && candidates.indexOf(t) === i).slice(0, 3);
  // La chaîne des divisions : 60 = 2 × 30 = 2 × 2 × 15 = 2 × 2 × 3 × 5.
  const steps = f.slice(0, -1).map((_, i) => {
    const done = f.slice(0, i + 1);
    return `${done.join(' × ')} × ${n / done.reduce((a, b) => a * b, 1)}`;
  });
  return {
    key: `dfp-${n}`,
    prompt: `${n} en facteurs premiers = …`,
    spoken: `Décompose ${n} en produit de facteurs premiers.`,
    choices: textChoices(answer, traps, rng),
    answer,
    hint: `Divise ${n} par ${small} : ${n / small}. Continue avec ${n / small}, jusqu’à n’avoir que des nombres premiers.`,
    explanation: `${n} = ${[...steps, answer].filter((s, i, all) => all.indexOf(s) === i).join(' = ')} : tous les facteurs sont premiers.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Facteurs premiers',
        lines: [
          'Divise par 2 tant que tu peux, puis par 3, puis par 5, puis par 7.',
          'Chaque facteur doit être premier : 2, 3, 5, 7, 11, 13…',
          '4, 6, 9, 10 ne sont pas premiers : on les décompose encore.',
        ],
      },
    },
  };
};
