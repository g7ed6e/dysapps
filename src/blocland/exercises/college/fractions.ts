// Icebergs des fractions (cycle 4) : comparer, additionner, soustraire, multiplier et diviser des fractions.
import { fractionWords } from '../../../core/fractions';
import { randomInt, shuffle } from '../../../core/random';
import { gcd, type ItemGenerator, MAX_TRIES, pick, type Rng } from './commun';

// ---------- Glacier : Icebergs des fractions (cycle 4) ----------

/** Une fraction : [numérateur, dénominateur], toujours positive. */
export type Fr = [number, number];

const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

export const simplify = ([n, d]: Fr): Fr => {
  const g = gcd(n, d);
  return [n / g, d / g];
};

/** « 3/4 » : l'écran l'affiche en colonne (RichText). */
export const fr = ([n, d]: Fr) => `${n}/${d}`;

/** « 3 quarts » : la même fraction, lue à voix haute. */
const frSay = ([n, d]: Fr) => fractionWords(n, d);

export const value = ([n, d]: Fr) => n / d;

/** Une fraction qui se dit en toutes lettres (« 5 douzièmes », jamais « 5 13ièmes ») et qui n'est pas un entier. */
export const speakable = ([n, d]: Fr) => Number.isInteger(n) && Number.isInteger(d) && n >= 1 && d >= 2 && !/\dième/.test(fractionWords(1, d));

/**
 * Réponses-fractions : la bonne et trois pièges, sans doublon, rangées de la plus petite à la plus grande. La place de la
 * bonne réponse est tirée parmi celles que les pièges permettent. Un piège de même valeur que la réponse n'est gardé que
 * si `unsimplified` : c'est la fraction qu'on a oublié de simplifier, et la consigne demande de simplifier jusqu'au bout.
 * Aucun piège n'est inventé : ce sont les erreurs données par le générateur.
 */
function fractionChoices(answer: Fr, traps: Fr[], rng: Rng, unsimplified = false, operands: Fr[] = []): string[] {
  // Jamais une fraction de l'énoncé proposée comme réponse.
  const seen = new Set<number>([value(answer), ...operands.map(value)]);
  const same: Fr[] = [];
  const pool: Fr[] = [];
  for (const t of traps) {
    // Jamais un entier écrit en fraction (6/6, 2/2) : ce n'est l'erreur de personne.
    if (!speakable(t) || t[0] % t[1] === 0 || fr(t) === fr(answer)) continue;
    if (value(t) === value(answer) && !operands.some((o) => value(o) === value(t))) {
      // Une écriture non simplifiée de la réponse : un seul piège de ce genre.
      if (unsimplified && same.length === 0 && gcd(t[0], t[1]) > 1) same.push(t);
      continue;
    }
    if (seen.has(value(t))) continue;
    seen.add(value(t));
    pool.push(t);
  }
  const below = shuffle(
    pool.filter((t) => value(t) < value(answer)),
    rng,
  );
  const above = shuffle(
    pool.filter((t) => value(t) > value(answer)),
    rng,
  );
  // Places possibles : la réponse (et la fraction non simplifiée, juste avant ou juste après elle) au milieu des pièges.
  const options: { wanted: number; sameFirst: boolean }[] = [];
  const others = 3 - same.length;
  for (let wanted = 0; wanted <= others; wanted++) {
    if (wanted > below.length || others - wanted > above.length) continue;
    options.push({ wanted, sameFirst: false });
    if (same.length) options.push({ wanted, sameFirst: true });
  }
  const { wanted, sameFirst } = options.length ? pick(options, rng) : { wanted: Math.min(below.length, others), sameFirst: false };
  const picked = [...below.slice(0, wanted), ...above.slice(0, others - wanted)];
  const ordered = [...picked].sort((a, b) => value(a) - value(b));
  const lower = ordered.filter((t) => value(t) < value(answer)).map(fr);
  const upper = ordered.filter((t) => value(t) > value(answer)).map(fr);
  const middle = same.length ? (sameFirst ? [fr(same[0]), fr(answer)] : [fr(answer), fr(same[0])]) : [fr(answer)];
  return [...lower, ...middle, ...upper];
}

const COMPARE_RULES = [
  'Même dénominateur : la plus grande fraction a le plus grand numérateur.',
  'Sinon, mets-les au même dénominateur : multiplie le numérateur et le dénominateur par le même nombre.',
  'Des nombres plus grands ne font pas une fraction plus grande.',
];

/** Couples de dénominateurs : l'un multiple de l'autre (5e), ou un dénominateur commun à trouver (4e), jusqu'à 24. */
const COMPARE_DENOMINATORS: [number, number][] = [
  [2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [5, 10], [5, 15], [5, 20], [6, 12], [4, 16],
  [8, 16], [2, 3], [3, 4], [4, 6], [6, 8], [3, 5], [4, 5], [6, 9], [8, 12], [4, 10],
];

const EQUAL_FRACTIONS = 'Elles sont égales';

/** Comparer deux fractions de dénominateurs différents, en les mettant au même dénominateur. */
export const compareFractionsC4: ItemGenerator = (rng) => {
  const equal = rng() < 0.25;
  let [b, d] = COMPARE_DENOMINATORS[0];
  let a = 1;
  let c = 1;
  for (let tries = 0; tries < 60; tries++) {
    [b, d] = pick(COMPARE_DENOMINATORS, rng);
    a = randomInt(1, b - 1, rng);
    if (gcd(a, b) > 1) continue;
    if (equal) {
      if ((a * d) % b !== 0) continue;
      c = (a * d) / b;
      break;
    }
    c = randomInt(1, d - 1, rng);
    if (gcd(c, d) > 1 || a * d === c * b) continue;
    // Le plus souvent, le piège classique : la fraction aux plus grands nombres est la plus petite (5/8 et 3/4).
    if (tries < 40 && rng() < 0.7 && !(c > a && c * b < a * d)) continue;
    break;
  }
  const D = lcm(b, d);
  const pair: [Fr, Fr] = rng() < 0.5 ? [[a, b], [c, d]] : [[c, d], [a, b]];
  const [x, y] = pair;
  const [fx, fy] = [fr(x), fr(y)];
  const X = (x[0] * D) / x[1];
  const Y = (y[0] * D) / y[1];
  const answer = X === Y ? EQUAL_FRACTIONS : X > Y ? fx : fy;
  const convert = [x, y]
    .filter(([, den]) => den !== D)
    .map(([num, den]) => `${fr([num, den])} = ${fr([(num * D) / den, D])}`)
    .join(' et ');
  const verdict =
    X === Y ? `Même numérateur, ${X} : elles sont égales.` : `${Math.max(X, Y)} est plus grand que ${Math.min(X, Y)}, donc ${answer} est la plus grande.`;
  return {
    key: `cmpf-${fx}-${fy}`,
    prompt: `Compare ${fx} et ${fy} : laquelle est la plus grande, ou sont-elles égales ?`,
    spoken: `Compare ${frSay(x)} et ${frSay(y)} : laquelle est la plus grande, ou sont-elles égales ?`,
    choices: [fx, fy, EQUAL_FRACTIONS],
    answer,
    hint: `Mets les deux fractions au même dénominateur, ${D}, puis compare les numérateurs.`,
    explanation: `Au même dénominateur, ${D} : ${convert}. ${verdict}`,
    figure: { kind: 'compare-bars', props: { a: x, b: y } },
    aid: { kind: 'rule-card', props: { title: 'Comparer deux fractions', lines: COMPARE_RULES } },
  };
};

const SUM_RULES = [
  'Même dénominateur d’abord : multiplie le numérateur et le dénominateur par le même nombre.',
  'Puis additionne ou soustrais les numérateurs.',
  'Le dénominateur reste le même : on n’additionne jamais les dénominateurs.',
];

/** Couples de dénominateurs : l'un multiple de l'autre surtout (5e), quelques-uns avec un dénominateur commun (4e). */
const SUM_DENOMINATORS: [number, number][] = [
  [2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [4, 16], [5, 10], [5, 15], [5, 20], [6, 12],
  [6, 18], [8, 16], [10, 20], [2, 3], [3, 4], [2, 5], [4, 6], [6, 8],
];

/** Additionner ou soustraire deux fractions : au même dénominateur, puis les numérateurs. */
export const addSubFractions: ItemGenerator = (rng) => {
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const [b, d] = pick(SUM_DENOMINATORS, rng);
    const a = randomInt(1, b - 1, rng);
    const c = randomInt(1, d - 1, rng);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) continue;
    const minus = rng() < 0.5;
    const D = lcm(b, d);
    const A = (a * D) / b;
    const C = (c * D) / d;
    if (minus && A === C) continue;
    // La première est la plus grande dans une soustraction ; au hasard dans une addition.
    const swap = minus ? A < C : rng() < 0.5;
    const [x, y]: [Fr, Fr] = swap ? [[c, d], [a, b]] : [[a, b], [c, d]];
    const [X, Y] = swap ? [C, A] : [A, C];
    const N = minus ? X - Y : X + Y;
    // Le résultat est déjà simplifié : la mission ne demande pas de simplifier à ce niveau.
    if (gcd(N, D) > 1 || !speakable([N, D])) continue;
    // Un résultat d'une seule part n'a presque aucun piège plus petit : on en tire moins.
    if (N === 1 && rng() < 0.6) continue;
    const answer: Fr = [N, D];
    const op = (p: number, q: number) => (minus ? p - q : p + q);
    const traps: Fr[] = [
      // Additionner (ou soustraire) les numérateurs et les dénominateurs.
      [op(x[0], y[0]), op(x[1], y[1])],
      // Au même dénominateur, puis additionner aussi les dénominateurs (2/4 + 1/4 = 3/8).
      ...(minus ? [] : [[N, 2 * D] as Fr]),
      // Changer de dénominateur sans changer les numérateurs.
      [op(x[0], y[0]), D],
      // Multiplier les dénominateurs, sans toucher aux numérateurs.
      [op(x[0], y[0]), x[1] * y[1]],
      // L'autre opération sur les numérateurs.
      [minus ? X + Y : X - Y, D],
      // Une erreur de calcul sur les numérateurs.
      [N + 1, D],
      [N - 1, D],
      [N + 2, D],
      [N - 2, D],
      [N + 3, D],
      [N + 4, D],
      [N + 5, D],
    ];
    const sign = minus ? '−' : '+';
    const convert = [x, y]
      .filter(([, den]) => den !== D)
      .map(([num, den]) => `${fr([num, den])} = ${fr([(num * D) / den, D])}`)
      .join(' et ');
    return {
      key: `som-${fr(x)}${sign}${fr(y)}`,
      prompt: `${fr(x)} ${sign} ${fr(y)} = …`,
      spoken: `${frSay(x)} ${minus ? 'moins' : 'plus'} ${frSay(y)}, combien ?`,
      choices: fractionChoices(answer, traps, rng),
      answer: fr(answer),
      hint: `Le même dénominateur : ${D}. Puis ${minus ? 'soustrais' : 'additionne'} les numérateurs et garde le dénominateur.`,
      explanation: `Au même dénominateur, ${D} : ${convert}. Puis ${X} ${sign} ${Y} = ${N}, et le dénominateur reste ${D} : ${fr([X, D])} ${sign} ${fr([Y, D])} = ${fr(answer)}.`,
      // Les deux fractions déjà au même dénominateur : des barres coupées en autant de parts.
      figure: { kind: 'compare-bars', props: { a: [X, D], b: [Y, D] } },
      aid: { kind: 'rule-card', props: { title: 'Additionner, soustraire', lines: SUM_RULES } },
    };
  }
  throw new Error('addSubFractions : aucune question trouvée');
};

const FRACTION_PRODUCT_RULES = [
  'Multiplier : numérateur fois numérateur, dénominateur fois dénominateur.',
  'Diviser : multiplie par l’inverse de la deuxième fraction (numérateur et dénominateur échangés).',
  'Simplifier : divise le numérateur et le dénominateur par le même nombre, jusqu’au bout.',
];

/** « On simplifie par 6 : 6/12 = 1/2. » ou « 3/8 ne se simplifie pas. » */
const simplifyText = (raw: Fr): string => {
  const g = gcd(raw[0], raw[1]);
  return g > 1 ? `On simplifie par ${g} : ${fr(raw)} = ${fr(simplify(raw))}.` : `${fr(raw)} ne se simplifie pas.`;
};

/** Une simplification arrêtée trop tôt (par 2 au lieu de 6), s'il y en a une. */
const partial = (raw: Fr): Fr[] => {
  const g = gcd(raw[0], raw[1]);
  for (let p = 2; p < g; p++) if (g % p === 0) return [[raw[0] / p, raw[1] / p]];
  return [];
};

/** Multiplier ou diviser deux fractions, puis simplifier jusqu'au bout. */
export const mulDivFractions: ItemGenerator = (rng) => {
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const divide = rng() < 0.5;
    const b = randomInt(2, 9, rng);
    const d = randomInt(2, 9, rng);
    const a = randomInt(1, b - 1, rng);
    const c = randomInt(divide ? 2 : 1, Math.max(divide ? 2 : 1, d - 1), rng);
    if (gcd(a, b) > 1 || gcd(c, d) > 1 || c >= d) continue;
    const x: Fr = [a, b];
    const y: Fr = [c, d];
    const raw: Fr = divide ? [a * d, b * c] : [a * c, b * d];
    const answer = simplify(raw);
    // La réponse n'est jamais une fraction de l'énoncé (4/9 ÷ 2/3 = 2/3).
    if (!speakable(answer) || !speakable(raw) || [x, y].some((o) => value(o) === value(answer))) continue;
    // Le plus souvent, le résultat est à simplifier.
    if (tries < 30 && gcd(raw[0], raw[1]) === 1 && rng() < 0.75) continue;
    const traps: Fr[] = divide
      ? [
          // Oublier de simplifier, ou s'arrêter trop tôt.
          raw,
          ...partial(raw),
          // Inverser la première fraction au lieu de la deuxième.
          simplify([b * c, a * d]),
          // Multiplier sans inverser.
          simplify([a * c, b * d]),
          // Inverser les deux fractions.
          simplify([b * d, a * c]),
        ]
      : [
          raw,
          ...partial(raw),
          // Le produit en croix : numérateur de l'une fois dénominateur de l'autre.
          simplify([a * d, b * c]),
          // Garder le dénominateur quand il est le même (3/5 × 2/5 = 6/5).
          ...(b === d ? [[a * c, b] as Fr] : []),
        ];
    // Une erreur de calcul sur le numérateur, en dernier recours, simplifiée comme la réponse.
    for (const k of [1, -1, 2, -2, 3, -3, 4, 5, 6]) if (answer[0] + k >= 1) traps.push(simplify([answer[0] + k, answer[1]]));
    const sign = divide ? '÷' : '×';
    const inverse: Fr = [d, c];
    const steps = divide
      ? `Diviser par ${fr(y)}, c’est multiplier par son inverse, ${fr(inverse)} : ${fr(x)} × ${fr(inverse)}. Numérateurs : ${a} × ${d} = ${raw[0]} ; dénominateurs : ${b} × ${c} = ${raw[1]}.`
      : `Numérateurs : ${a} × ${c} = ${raw[0]} ; dénominateurs : ${b} × ${d} = ${raw[1]}.`;
    return {
      key: `prod-${fr(x)}${sign}${fr(y)}`,
      // La réponse attendue est simplifiée : l'énoncé le dit, la fraction non simplifiée ne piège pas sans prévenir.
      prompt: `${fr(x)} ${sign} ${fr(y)} = … Donne la fraction simplifiée.`,
      spoken: `${frSay(x)} ${divide ? 'divisé par' : 'fois'} ${frSay(y)}, combien ? Donne la fraction simplifiée.`,
      choices: fractionChoices(answer, traps, rng, true, [x, y]),
      answer: fr(answer),
      hint: divide
        ? `Multiplie ${frSay(x)} par l’inverse de ${frSay(y)}, c’est-à-dire ${frSay(inverse)}. Puis simplifie jusqu’au bout.`
        : 'Numérateur fois numérateur, dénominateur fois dénominateur. Puis simplifie jusqu’au bout.',
      explanation: `${steps} ${simplifyText(raw)}`,
      aid: { kind: 'rule-card', props: { title: 'Multiplier, diviser', lines: FRACTION_PRODUCT_RULES } },
    };
  }
  throw new Error('mulDivFractions : aucune question trouvée');
};
