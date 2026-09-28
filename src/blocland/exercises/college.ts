// Missions de maths du collège (cycle 4) : générateurs (reproductibles pour une graine, une graine par partie) qui produisent directement des items Blocland,
// avec leurs aides visuelles en données (droite des relatifs, tableau de proportionnalité, rappel de règle).
import { drawChoices } from '../../core/choices';
import { fractionWords } from '../../core/fractions';
import { randomInt, shuffle } from '../../core/random';
import type { BiomeId, BlockId } from '../biomes';
import { seeded } from './maths';

export const seededItems = seeded;
import type { ExerciseDef, ExerciseItem } from './types';

type Rng = () => number;
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
    // Chaque partie tire d'autres nombres : la graine change à chaque partie.
    generate: (seed) => buildDataItems(seed, generators),
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
  if (rng() < 0.5 && a > 0) a = -a;
  if (a === b) b = -b;
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
    hint: `Soustraire ${fmt(b)}, c’est ajouter son opposé : ${fmt(a)} + ${par(-b)}.`,
    explanation: `${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)} = ${fmt(d)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, d], jump: [a, d] } },
  };
};

const SIGN_RULES = [
  'Deux signes identiques : résultat positif (+ et +, − et −).',
  'Deux signes différents : résultat négatif (+ et −).',
  'Sans les signes, on multiplie comme d’habitude : 3 × 4 = 12.',
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

// ---------- Glacier : Icebergs des fractions (cycle 4) ----------

/** Une fraction : [numérateur, dénominateur], toujours positive. */
type Fr = [number, number];
/** Plafond des tirages d'une question : les tables en donnent bien avant, il garde de toute boucle sans fin. */
const MAX_TRIES = 1000;
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const simplify = ([n, d]: Fr): Fr => {
  const g = gcd(n, d);
  return [n / g, d / g];
};
/** « 3/4 » : l'écran l'affiche en colonne (RichText). */
const fr = ([n, d]: Fr) => `${n}/${d}`;
/** « 3 quarts » : la même fraction, lue à voix haute. */
const frSay = ([n, d]: Fr) => fractionWords(n, d);
const value = ([n, d]: Fr) => n / d;
/** Une fraction qui se dit en toutes lettres (« 5 douzièmes », jamais « 5 13ièmes ») et qui n'est pas un entier. */
const speakable = ([n, d]: Fr) => Number.isInteger(n) && Number.isInteger(d) && n >= 1 && d >= 2 && !/\dième/.test(fractionWords(1, d));
const pick = <T>(list: readonly T[], rng: Rng): T => list[randomInt(0, list.length - 1, rng)];

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

// ---------- Marché des proportions ----------

/** Les articles du marché : le pluriel de l'énoncé et le singulier, avec son article, de l'explication. */
const GOODS: { pl: string; one: string }[] = [
  { pl: 'pommes', one: 'Une pomme' },
  { pl: 'cahiers', one: 'Un cahier' },
  { pl: 'billes', one: 'Une bille' },
  { pl: 'crêpes', one: 'Une crêpe' },
  { pl: 'stylos', one: 'Un stylo' },
  { pl: 'tomates', one: 'Une tomate' },
];
const euro = (n: number) => `${n.toLocaleString('fr-FR')} €`;

/** Quatrième proportionnelle, coefficient entier. */
export const fourthInt: ItemGenerator = (rng) => {
  const { pl: good, one } = GOODS[randomInt(0, GOODS.length - 1, rng)];
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
    explanation: `${one} coûte ${euro(price)} (${n1 * price} ÷ ${n1}). ${n2} × ${price} = ${answer} : ${euro(answer)}.`,
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
  // Une autre quantité que celle de l'énoncé : sinon la réponse serait déjà écrite.
  let c = randomInt(2, 9, rng) * 2;
  while (c === a) c = randomInt(2, 9, rng) * 2;
  const answer = c * k;
  const f = (n: number) => n.toLocaleString('fr-FR');
  return {
    key: `fc-${a}-${k}-${c}`,
    prompt: `${a} kg coûtent ${euro(b)}. Combien coûtent ${c} kg ?`,
    spoken: `${a} kilos coûtent ${f(b)} euros. Combien coûtent ${c} kilos ?`,
    choices: choices(answer, [c * k + k, c + b, b + (c - a), c * 2].filter((t) => t > 0), rng, euro),
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
    choices: choices(answer, [n - answer, answer * 2, answer / 2, n / p].filter((t) => t > 0 && Number.isInteger(t * 10)), rng),
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
    choices: choices(answer, [down ? n + delta : n - delta, delta, n - p, n + p].filter((t) => t > 0), rng, euro),
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
  // Au moins deux heures dans l'énoncé : le passage par une heure reste une vraie étape.
  const t1 = randomInt(2, 4, rng);
  let t2 = randomInt(1, 6, rng);
  if (t2 === t1) t2 += 1;
  const answer = v * t2;
  return {
    key: `spd-${v}-${t1}-${t2}`,
    prompt: `Une voiture roule à vitesse constante : ${v * t1} km en ${t1} h. Combien de km en ${t2} h ?`,
    spoken: `Une voiture roule à vitesse constante : ${v * t1} kilomètres en ${t1} heure${t1 > 1 ? 's' : ''}. Combien de kilomètres en ${t2} heure${t2 > 1 ? 's' : ''} ?`,
    choices: choices(answer, [v * (t2 + 1), v * (t2 - 1), v * t1 + t2, v * t1 * t2].filter((t) => t > 0), rng, (n) => `${fmt(n)} km`),
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
    // La distance de 1 cm, déjà écrite dans l'énoncé, n'est jamais un piège (ni un voisin).
    choices: drawChoices(answer, [cm + kmPerCm, answer + kmPerCm, answer - kmPerCm, cm * 10], rng, { ok: (t) => t > 0 && t !== kmPerCm }).map(
      (n) => `${fmt(n)} km`,
    ),
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

// ---------- Atelier du calcul littéral ----------

const REDUCE_RULES = ['On additionne les x entre eux, et les nombres entre eux.', '3x + 5x = 8x (comme 3 pommes + 5 pommes).', 'x + x = 2x, mais x × x = x².'];
const ax = (a: number, letter = 'x') => (a === 1 ? letter : a === -1 ? `−${letter}` : `${fmt(a)}${letter}`);
const plus = (a: number) => (a < 0 ? `− ${fmt(-a)}` : `+ ${fmt(a)}`);
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
  // AN différent de AM : sinon AC serait AB, déjà écrit.
  let an = randomInt(2, 6, rng);
  while (an === am) an = randomInt(2, 6, rng);
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

// ---------- Belvédère : les réciproques ----------

const SIDES = ['AB', 'AC', 'BC'] as const;
type Side = (typeof SIDES)[number];
/** Le sommet en face d'un côté : AB fait face à C, AC à B, BC à A. */
const OPPOSITE: Record<Side, string> = { AB: 'C', AC: 'B', BC: 'A' };
/** « A B » : les lettres d'un nom de segment, lues une à une. */
const letters = (s: string) => s.split('').join(' ');

/**
 * Des triangles qui ne sont pas rectangles, tout près d'un triangle rectangle connu (6, 8, 9 à côté de 6, 8, 10) :
 * l'élève qui reconnaît deux nombres d'un triplet croit le triangle rectangle. Tous sont de vrais triangles.
 */
export const NOT_RIGHT: [number, number, number][] = [
  [4, 5, 6],
  [5, 6, 8],
  [6, 8, 9],
  [6, 8, 11],
  [5, 12, 14],
  [8, 15, 16],
  [9, 12, 16],
  [10, 12, 15],
  [12, 16, 21],
  [7, 24, 26],
];
/** Les longueurs des trois côtés : le plus grand, puis les deux autres, chacun à sa place. */
function sideLengths(big: Side, c: number, [s1, a]: [Side, number], [s2, b]: [Side, number]): Record<Side, number> {
  const len: Record<Side, number> = { AB: 0, AC: 0, BC: 0 };
  len[big] = c;
  len[s1] = a;
  len[s2] = b;
  return len;
}
export const RECIPROQUE_PYTHAGORE_CHOICES = ['non', 'oui, en A', 'oui, en B', 'oui, en C'];

/**
 * Réciproque de Pythagore : trois longueurs, le triangle est-il rectangle, et en quel sommet ? Le plus grand côté est
 * tiré parmi AB, AC et BC : l'élève qui teste toujours BC² = AB² + AC² (le plus grand côté au mauvais endroit) se
 * trompe, et les sommets au bout du plus grand côté sont les pièges. Une fois sur quatre, le triangle n'est pas
 * rectangle : chacune des quatre réponses revient aussi souvent.
 */
export const reciprocalPythagore: ItemGenerator = (rng) => {
  const right = rng() < 0.75;
  const [a, b, c] = right ? TRIPLES[randomInt(0, TRIPLES.length - 1, rng)] : NOT_RIGHT[randomInt(0, NOT_RIGHT.length - 1, rng)];
  const big = SIDES[randomInt(0, 2, rng)];
  const [s1, s2] = shuffle(
    SIDES.filter((s) => s !== big),
    rng,
  );
  const len = sideLengths(big, c, [s1, a], [s2, b]);
  // Les deux autres côtés, dans l'ordre de l'énoncé.
  const [x, y] = SIDES.filter((s) => s !== big);
  const sum = len[x] ** 2 + len[y] ** 2;
  return {
    key: `recpyth-${len.AB}-${len.AC}-${len.BC}`,
    prompt: `Triangle ABC : AB = ${len.AB} cm, AC = ${len.AC} cm, BC = ${len.BC} cm. Est-il rectangle ?`,
    spoken: `Triangle A B C : A B égale ${len.AB} centimètres, A C égale ${len.AC} centimètres, B C égale ${len.BC} centimètres. Est-il rectangle ?`,
    choices: [...RECIPROQUE_PYTHAGORE_CHOICES],
    answer: right ? `oui, en ${OPPOSITE[big]}` : 'non',
    // L'indice est lu à voix haute : les opérations en mots.
    hint: `Le plus grand côté est ${big}. Compare ${c} au carré avec ${len[x]} au carré plus ${len[y]} au carré.`,
    explanation: `Le plus grand côté est ${big}. ${big}² = ${c}² = ${c * c} ; ${x}² + ${y}² = ${len[x]}² + ${len[y]}² = ${len[x] ** 2} + ${len[y] ** 2} = ${sum}. ${
      right
        ? `C’est égal : d’après la réciproque de Pythagore, ABC est rectangle en ${OPPOSITE[big]}, le sommet en face de ${big}.`
        : `${c * c} n’est pas égal à ${sum} : ABC n’est pas rectangle.`
    }`,
    // Les côtés rangés du plus petit au plus grand, avec leurs carrés : le calcul est fait, reste à comparer et à
    // trouver le sommet en face du plus grand côté.
    figure: {
      kind: 'ratio-table',
      props: {
        cols: ['côté', 'longueur', 'carré'],
        rows: [...SIDES].sort((u, v) => len[u] - len[v]).map((s) => [s, `${len[s]} cm`, String(len[s] ** 2)]),
        caption: 'Le plus grand côté est sur la dernière ligne.',
      },
    },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Réciproque de Pythagore',
        lines: [
          'Calcule le carré du plus grand côté.',
          'Calcule la somme des carrés des deux autres côtés.',
          'Égal : rectangle, l’angle droit en face du plus grand côté. Pas égal : pas rectangle.',
          'Le théorème trouve une longueur ; la réciproque dit si le triangle est rectangle.',
        ],
      },
    },
  };
};

/** Les coefficients de la réciproque de Thalès : ceux du niveau 1, et 4. */
const RECIPROQUE_K = [1.5, 2, 2.5, 3, 4];
/** Toutes les configurations aux quatre longueurs entières et différentes (AM et AN de 2 à 6), rangées selon la réponse. */
export const THALES_CASES = (() => {
  const all: { am: number; ab: number; an: number; ac: number; k1: number; k2: number }[] = [];
  for (const am of [2, 3, 4, 5, 6])
    for (const an of [2, 3, 4, 5, 6])
      for (const k1 of RECIPROQUE_K)
        for (const k2 of RECIPROQUE_K) {
          const ab = am * k1;
          const ac = an * k2;
          if (new Set([am, ab, an, ac]).size === 4 && Number.isInteger(ab) && Number.isInteger(ac)) all.push({ am, ab, an, ac, k1, k2 });
        }
  return {
    // Même coefficient : les différences (AB − AM et AC − AN) ne sont jamais égales, puisque AM et AN ne le sont pas.
    parallel: all.filter((t) => t.k1 === t.k2),
    // Coefficients différents, mais la même différence : l'élève qui compare les différences croit les droites parallèles.
    sameGap: all.filter((t) => t.k1 !== t.k2 && t.ab - t.am === t.ac - t.an),
    // Coefficients différents et proches (0,5 ou 1 d'écart).
    close: all.filter((t) => t.k1 !== t.k2 && Math.abs(t.k1 - t.k2) <= 1 && t.ab - t.am !== t.ac - t.an),
  };
})();

/**
 * Réciproque de Thalès : M sur [AB], N sur [AC], quatre longueurs ; (MN) et (BC) sont-elles parallèles ? Pièges tirés
 * des erreurs d'élèves : la même différence sans le même coefficient (conclure sur les différences), et les longueurs
 * données dans le désordre (AC avant AN), pour qui ne compare pas les rapports dans le même sens. Le tableau les range.
 */
export const reciprocalThales: ItemGenerator = (rng) => {
  const parallel = rng() < 0.5;
  const pool = parallel ? THALES_CASES.parallel : rng() < 0.5 ? THALES_CASES.sameGap : THALES_CASES.close;
  const { am, ab, an, ac, k1, k2 } = pool[randomInt(0, pool.length - 1, rng)];
  const f = (n: number) => n.toLocaleString('fr-FR');
  // Sur chaque côté, le petit segment avant le grand, ou l'inverse.
  const first: [string, number][] = rng() < 0.5 ? [['AM', am], ['AB', ab]] : [['AB', ab], ['AM', am]];
  const second: [string, number][] = rng() < 0.5 ? [['AN', an], ['AC', ac]] : [['AC', ac], ['AN', an]];
  const given = [...first, ...second];
  const sameGap = ab - am === ac - an;
  return {
    key: `recthales-${am}-${ab}-${an}-${ac}`,
    prompt: `M est sur le segment [AB] et N sur le segment [AC], avec ${given.map(([s, v]) => `${s} = ${f(v)} cm`).join(', ')}. Les droites (MN) et (BC) sont-elles parallèles ?`,
    spoken: `M est sur le segment A B et N sur le segment A C, avec ${given.map(([s, v]) => `${letters(s)} égale ${f(v)} centimètres`).join(', ')}. Les droites M N et B C sont-elles parallèles ?`,
    choices: ['non', 'oui'],
    answer: parallel ? 'oui' : 'non',
    // L'indice est lu à voix haute : la division en mots.
    hint: 'Calcule AB divisé par AM, puis AC divisé par AN : chaque fois, le grand triangle divisé par le petit.',
    explanation: `AB ÷ AM = ${f(ab)} ÷ ${f(am)} = ${f(k1)} ; AC ÷ AN = ${f(ac)} ÷ ${f(an)} = ${f(k2)}. ${
      parallel
        ? 'Le même coefficient : d’après la réciproque de Thalès, (MN) et (BC) sont parallèles.'
        : `Les coefficients sont différents : (MN) et (BC) ne sont pas parallèles.${sameGap ? ` AB − AM = AC − AN = ${f(ab - am)} cm : la même différence ne suffit pas.` : ''}`
    }`,
    figure: {
      kind: 'ratio-table',
      props: {
        cols: ['petit triangle', 'grand triangle'],
        rows: [
          [`AM = ${f(am)}`, `AB = ${f(ab)}`],
          [`AN = ${f(an)}`, `AC = ${f(ac)}`],
        ],
      },
    },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Réciproque de Thalès',
        lines: [
          'Sur chaque ligne du tableau, le coefficient : grand triangle ÷ petit triangle.',
          'Même coefficient : les droites sont parallèles.',
          'Coefficients différents : elles ne sont pas parallèles.',
          'La même différence ne suffit pas : compare les coefficients.',
        ],
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
    // Pas 1 rouge et 1 bleue : les pièges 1/2 et 1/2 seraient la réponse, il ne resterait que trois choix.
    const blue = randomInt(red === 1 ? 2 : 1, 5, rng);
    const total = red + blue;
    const answer = `${red}/${total}`;
    const s = (k: number) => (k > 1 ? 's' : '');
    return {
      key: `proba-urne-${red}-${blue}`,
      prompt: `Un sac contient ${red} boule${s(red)} rouge${s(red)} et ${blue} bleue${s(blue)}. Probabilité de tirer une rouge = …`,
      spoken: `Un sac contient ${red} boule${s(red)} rouge${s(red)} et ${blue} boule${s(blue)} bleue${s(blue)}. Quelle est la probabilité de tirer une rouge ?`,
      choices: textChoices(answer, [`${blue}/${total}`, `${red}/${blue}`, `1/${total}`, `${total}/${red}`], rng),
      answer,
      hint: `Cas favorables : ${red} boule${s(red)} rouge${s(red)}. Cas possibles : ${total} boules en tout.`,
      explanation: `${red} boule${s(red)} rouge${s(red)} sur ${total} boules : ${answer}.`,
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

// ---------- Observatoire des données : Relevés (effectifs, fréquences, diagrammes) ----------

/** Une enquête au collège : la question posée, l'en-tête du tableau, le verbe de la question et les réponses possibles. */
export interface Survey {
  id: string;
  /** « le sport préféré » : « Enquête en 3e : le sport préféré. » */
  theme: string;
  /** L'en-tête de la colonne des réponses, dans le tableau d'effectifs. */
  column: string;
  /** « ont choisi » : « Combien d’élèves ont choisi le judo ? » */
  verb: string;
  /** Chaque réponse : l'étiquette de la barre (ou de la ligne), puis la même dans une phrase. */
  answers: [label: string, phrase: string][];
}

/** Des enquêtes du quotidien d'un collégien. Quatre réponses par diagramme : peu d'éléments à l'écran. */
export const SURVEYS: Survey[] = [
  {
    id: 'sport',
    theme: 'le sport préféré',
    column: 'Sport',
    verb: 'ont choisi',
    answers: [['Foot', 'le foot'], ['Basket', 'le basket'], ['Natation', 'la natation'], ['Danse', 'la danse'], ['Judo', 'le judo'], ['Tennis', 'le tennis']],
  },
  {
    id: 'trajet',
    theme: 'le trajet jusqu’au collège',
    column: 'Trajet',
    verb: 'viennent',
    answers: [['À pied', 'à pied'], ['Vélo', 'à vélo'], ['Bus', 'en bus'], ['Voiture', 'en voiture']],
  },
  {
    id: 'fruit',
    theme: 'le fruit préféré à la cantine',
    column: 'Fruit',
    verb: 'ont choisi',
    answers: [['Pomme', 'la pomme'], ['Banane', 'la banane'], ['Orange', 'l’orange'], ['Kiwi', 'le kiwi'], ['Poire', 'la poire']],
  },
  {
    id: 'matiere',
    theme: 'la matière préférée',
    column: 'Matière',
    verb: 'ont choisi',
    answers: [['Maths', 'les maths'], ['Français', 'le français'], ['Anglais', 'l’anglais'], ['Sciences', 'les sciences'], ['Musique', 'la musique']],
  },
];

interface Releve {
  survey: Survey;
  /** Les réponses gardées, dans l'ordre de l'enquête (l'ordre du diagramme ne change pas d'une question à l'autre). */
  rows: { label: string; phrase: string; n: number }[];
  total: number;
}

/**
 * Un relevé de quatre effectifs différents, d'au moins 2 (« 2 élèves », jamais « 1 élèves »). Sans total imposé,
 * chaque effectif va jusqu'à `max` ; avec un total, trois effectifs sont tirés et le quatrième complète, sans
 * dépasser la moitié du total (pas de barre qui écrase les autres). La réponse qui complète est tirée au hasard parmi
 * les quatre : ni la dernière barre ni la plus grande à coup sûr. Les barres restent dans l'ordre du thème.
 */
function drawReleve(rng: Rng, total?: number, max = 12): Releve {
  const survey = pick(SURVEYS, rng);
  const kept = shuffle([...survey.answers.keys()], rng)
    .slice(0, 4)
    .sort((a, b) => a - b);
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const top = total === undefined ? max : Math.floor(total / 3);
    const n = kept.map(() => randomInt(2, top, rng));
    const last = randomInt(0, 3, rng);
    if (total !== undefined) n[last] = total - n.reduce((a, v, i) => (i === last ? a : a + v), 0);
    if (n.some((v) => v < 2) || (total !== undefined && n[last] > total / 2) || new Set(n).size !== n.length) continue;
    const rows = kept.map((k, i) => ({ label: survey.answers[k][0], phrase: survey.answers[k][1], n: n[i] }));
    return { survey, rows, total: n.reduce((a, b) => a + b, 0) };
  }
  throw new Error('drawReleve : aucun relevé trouvé');
}

/** Le thème de l'enquête, en tête d'énoncé : « Enquête en 3e : le sport préféré. », lu « en troisième ». */
const intro = (survey: Survey) => `Enquête en 3e : ${survey.theme}.`;
const introSpoken = (survey: Survey) => `Enquête en troisième : ${survey.theme}.`;
const sumText = (r: Releve) => `${r.rows.map((row) => row.n).join(' + ')} = ${r.total}`;
const barList = (r: Releve) => ({ kind: 'bar-list', props: { values: r.rows.map((row) => row.n), labels: r.rows.map((row) => row.label) } });

const READ_CHART_RULES = [
  'Une barre par réponse : le nombre écrit à côté est son effectif.',
  'Effectif total : additionne les effectifs de toutes les barres, sans en oublier une.',
  'Combien de plus : le grand effectif moins le petit.',
];

/** Lire un diagramme en barres : l'effectif d'une réponse, l'effectif total, ou l'écart entre deux réponses. */
export const readChart: ItemGenerator = (rng) => {
  const r = drawReleve(rng);
  const { survey, rows, total } = r;
  const kind = randomInt(0, 2, rng);
  const aid = { kind: 'rule-card', props: { title: 'Lire un diagramme', lines: READ_CHART_RULES } };
  const base = { figure: barList(r), aid };
  const key = `rel-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}`;
  if (kind === 0) {
    const i = randomInt(0, 3, rng);
    const { label, phrase, n } = rows[i];
    const question = `Combien d’élèves ${survey.verb} ${phrase} ?`;
    return {
      ...base,
      key: `${key}-lire-${i}`,
      prompt: `${intro(survey)} ${question}`,
      spoken: `${introSpoken(survey)} ${question}`,
      // Lire la mauvaise barre.
      choices: choices(n, rows.filter((_, j) => j !== i).map((row) => row.n), rng),
      answer: fmt(n),
      hint: `Trouve la barre « ${label} » : son effectif est écrit à côté.`,
      explanation: `La barre « ${label} » porte le nombre ${n} : ${n} élèves ${survey.verb} ${phrase}.`,
    };
  }
  if (kind === 1) {
    const question = 'Quel est l’effectif total : combien d’élèves ont répondu ?';
    return {
      ...base,
      key: `${key}-total`,
      prompt: `${intro(survey)} ${question}`,
      spoken: `${introSpoken(survey)} ${question}`,
      // Une barre oubliée dans la somme, ou comptée deux fois.
      choices: choices(total, [...rows.map((row) => total - row.n), ...rows.map((row) => total + row.n)], rng),
      answer: fmt(total),
      hint: 'Additionne les effectifs des quatre barres, sans en oublier une.',
      explanation: `${sumText(r)} : ${total} élèves ont répondu.`,
    };
  }
  const [i, j] = shuffle([0, 1, 2, 3], rng).slice(0, 2);
  const [big, small] = rows[i].n > rows[j].n ? [rows[i], rows[j]] : [rows[j], rows[i]];
  const gap = big.n - small.n;
  const others = rows.filter((row) => row !== big && row !== small);
  // Les noms des barres, tels qu'ils sont écrits sur le diagramme.
  const question = `Combien d’élèves de plus pour « ${big.label} » que pour « ${small.label} » ?`;
  return {
    ...base,
    key: `${key}-ecart-${big.label}-${small.label}`,
    prompt: `${intro(survey)} ${question}`,
    spoken: `${introSpoken(survey)} ${question}`,
    choices: choices(
      gap,
      [
        // Additionner au lieu de soustraire.
        big.n + small.n,
        // Donner l'un des deux effectifs.
        big.n,
        small.n,
        // Soustraire la mauvaise barre.
        ...others.map((row) => Math.abs(big.n - row.n)),
      ].filter((t) => t > 0),
      rng,
    ),
    answer: fmt(gap),
    hint: `Lis les barres « ${big.label} » et « ${small.label} », puis enlève le petit effectif du grand.`,
    explanation: `« ${big.label} » : ${big.n} ; « ${small.label} » : ${small.n}. ${big.n} − ${small.n} = ${gap} : ${gap} élève${gap > 1 ? 's' : ''} de plus.`,
  };
};

const FREQUENCY_RULES = [
  'Effectif : le nombre d’élèves qui ont donné cette réponse.',
  'Effectif total : la somme de tous les effectifs.',
  'Fréquence = effectif ÷ effectif total. Elle est entre 0 et 1.',
  'Exemple : 3 élèves sur 10, la fréquence est 3 sur 10.',
];
/** Des effectifs totaux dont la fraction se dit en toutes lettres (« 6 vingtièmes »), jamais une classe géante. */
const FREQUENCY_TOTALS = [16, 18, 20, 24, 30];

/**
 * Pas `fractionChoices` (Icebergs) : ici, les voisins restent sur le même dénominateur (un élève de plus ou de moins),
 * et jamais la même valeur n'est proposée écrite autrement, même non simplifiée.
 * Réponses-fractions rangées de la plus petite à la plus grande : la bonne et trois pièges de valeurs différentes (une
 * seule réponse juste, jamais la même fraction écrite autrement). La place de la réponse est tirée au hasard, comme
 * avec `drawChoices`. Au-dessus de la réponse, un piège sur un autre dénominateur passe d'abord (une ligne oubliée dans
 * le total, l'effectif comparé aux autres) : sans lui, les choix donneraient l'effectif total sans le calculer. S'il
 * manque des pièges d'un côté, des voisins sur le même dénominateur (un élève de plus ou de moins).
 */
function frequencyChoices(answer: Fr, traps: Fr[], rng: Rng): string[] {
  const [n, total] = answer;
  const sameValue = (a: Fr, b: Fr) => a[0] * b[1] === b[0] * a[1];
  const picked: Fr[] = [];
  const free = (t: Fr) => !sameValue(t, answer) && !picked.some((p) => sameValue(p, t));
  // Jamais un entier écrit en fraction (20/4) : ce n'est l'erreur de personne.
  const kept = traps.filter((t, i) => speakable(t) && t[0] % t[1] !== 0 && !sameValue(t, answer) && traps.findIndex((u) => sameValue(u, t)) === i);
  const below = shuffle(
    kept.filter((t) => value(t) < value(answer)),
    rng,
  );
  const above = shuffle(
    kept.filter((t) => value(t) > value(answer)),
    rng,
  ).sort((a, b) => Number(a[1] === total) - Number(b[1] === total));
  const neighbours = (side: number): Fr[] =>
    [1, 2, 3].map((d): Fr => [n + side * d, total]).filter(([m]) => m >= 1 && m < total);
  const wanted = randomInt(0, 3, rng);
  const take = (list: Fr[], count: number) => {
    const end = picked.length + count;
    for (const t of list) if (picked.length < end && free(t)) picked.push(t);
  };
  take([...below, ...neighbours(-1)], wanted);
  take([...above, ...neighbours(1)], 3 - wanted);
  // S'il manque encore des choix (un seul élève sous la réponse), de l'autre côté.
  take([...below, ...above, ...neighbours(-1), ...neighbours(1)], 3 - picked.length);
  return [answer, ...picked].sort((a, b) => value(a) - value(b)).map(fr);
}

/** La fréquence d'une réponse, en fraction : l'effectif sur l'effectif total, lu dans un tableau. */
export const frequencyFraction: ItemGenerator = (rng) => {
  const r = drawReleve(rng, pick(FREQUENCY_TOTALS, rng));
  const { survey, rows, total } = r;
  const i = randomInt(0, 3, rng);
  const { label, phrase, n } = rows[i];
  const others = rows.filter((_, j) => j !== i);
  const answer: Fr = [n, total];
  const traps: Fr[] = [
    // Lire la mauvaise ligne.
    ...others.map((row): Fr => [row.n, total]),
    // Une ligne oubliée dans l'effectif total.
    ...others.map((row): Fr => [n, total - row.n]),
    // Comparer aux autres réponses, pas au total.
    [n, total - n],
    // Diviser le total par l'effectif.
    [total, n],
  ];
  const question = `Quelle est la fréquence des élèves qui ${survey.verb} ${phrase} ?`;
  const simple = simplify(answer);
  return {
    key: `relfreq-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}-${i}`,
    prompt: `${intro(survey)} ${question}`,
    spoken: `${introSpoken(survey)} ${question}`,
    choices: frequencyChoices(answer, traps, rng),
    answer: fr(answer),
    hint: `Additionne tous les effectifs : l’effectif total est ${total}. La fréquence, c’est l’effectif de « ${label} » sur ${total}.`,
    explanation: `Effectif total : ${sumText(r)}. « ${label} » : ${n} élèves sur ${total}, la fréquence est ${fr(answer)}${simple[1] !== total ? `, soit ${fr(simple)}` : ''}.`,
    figure: { kind: 'ratio-table', props: { cols: [survey.column, 'Effectif'], rows: rows.map((row) => [row.label, row.n]) } },
    aid: { kind: 'rule-card', props: { title: 'Effectif et fréquence', lines: FREQUENCY_RULES } },
  };
};

const PERCENT_RULES = [
  'Fréquence = effectif ÷ effectif total.',
  'En pourcentage : multiplie par 100. 0,3 donne 30 %.',
  'L’effectif n’est pas la fréquence : divise d’abord par le total.',
  'Toutes les fréquences ensemble font 100 %.',
];
/** Des effectifs totaux qui donnent des pourcentages entiers ; jamais 100, où l'effectif serait aussi le pourcentage. */
const PERCENT_TOTALS = [20, 25, 50];
const percent = (v: number) => `${fmt(v)} %`;

/** La fréquence d'une réponse en pourcentage, lue sur un diagramme en barres. */
export const frequencyPercent: ItemGenerator = (rng) => {
  const r = drawReleve(rng, pick(PERCENT_TOTALS, rng));
  const { survey, rows, total } = r;
  const i = randomInt(0, 3, rng);
  const { label, phrase, n } = rows[i];
  const p = (n * 100) / total;
  const f = n / total;
  const question = `Quelle est la fréquence des élèves qui ${survey.verb} ${phrase}, en pourcentage ?`;
  const values = drawChoices(
    p,
    [
      // L'effectif pris pour la fréquence.
      n,
      // La fréquence mal convertie : multipliée par 10, ou pas multipliée par 100.
      p / 10,
      p / 100,
      // Lire la mauvaise barre.
      ...rows.filter((_, j) => j !== i).map((row) => (row.n * 100) / total),
      // La fréquence des autres élèves.
      100 - p,
    ],
    rng,
    { step: 100 / total, neighbourOk: (v) => v > 0 && v < 100 },
  );
  return {
    key: `relpct-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}-${i}`,
    // L'effectif total est donné : l'effort porte sur le passage au pourcentage (le total est travaillé aux niveaux 1 et 2).
    prompt: `${intro(survey)} Effectif total : ${total}. ${question}`,
    spoken: `${introSpoken(survey)} L’effectif total est ${total}. ${question}`,
    choices: values.map(percent),
    answer: percent(p),
    hint: `L’effectif total est ${total}. Divise l’effectif de « ${label} » par ${total}, puis multiplie par 100.`,
    explanation: `Effectif total : ${sumText(r)}. « ${label} » : ${n} ÷ ${total} = ${fmt(f)}, et ${fmt(f)} × 100 = ${p} : la fréquence est ${percent(p)}.`,
    figure: barList(r),
    aid: { kind: 'rule-card', props: { title: 'Fréquence en pourcentage', lines: PERCENT_RULES } },
  };
};

// ---------- Phare des fonctions ----------

export const imageOf: ItemGenerator = (rng) => {
  const a = nonZero(-4, 5, rng);
  // b non nul : jamais « f(x) = 5x + 0 ».
  const b = nonZero(-6, 8, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  const expr = `f(x) = ${ax(a)} ${plus(b)}`;
  return {
    key: `img-${a}-${b}-${x}`,
    prompt: `${expr}. Image de ${fmt(x)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quelle est l’image de ${say(x)} ?`,
    choices: choices(y, [a * x - b, a + b + x, -y, y + a], rng),
    answer: fmt(y),
    hint: `Remplace x par ${fmt(x)} : ${fmt(a)} × ${par(x)} ${plus(b)}.`,
    explanation: `f(${fmt(x)}) = ${fmt(a)} × ${par(x)} ${plus(b)} = ${fmt(a * x)} ${plus(b)} = ${fmt(y)}.`,
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
  // b non nul : jamais « f(x) = 2x + 0 ».
  const b = nonZero(-5, 5, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  return {
    key: `ant-${a}-${b}-${x}`,
    prompt: `f(x) = ${ax(a)} ${plus(b)}. Antécédent de ${fmt(y)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quel est l’antécédent de ${say(y)} ?`,
    choices: choices(x, [y, -x, x + 1, x - 1], rng),
    answer: fmt(x),
    hint: `Résous ${ax(a)} ${plus(b)} = ${fmt(y)} : ${b < 0 ? `ajoute ${-b}` : `enlève ${b}`}, puis divise par ${fmt(a)}.`,
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
      spoken: `f de x égale ${say(a)} x${b === 0 ? '' : ` ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}`}. Quel est le coefficient directeur ?`,
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
  // Une fonction linéaire est aussi affine : on demande seulement si elle est linéaire (une seule réponse juste).
  const answer = b === 0 ? 'oui' : 'non';
  return {
    key: `kind-${a}-${b}`,
    prompt: `${expr}. Est-elle linéaire ?`,
    spoken: `f de x égale ${say(a)} x${b === 0 ? '' : ` ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}`}. Cette fonction est-elle linéaire ?`,
    choices: ['non', 'oui'],
    answer,
    hint: 'Linéaire : f(x) = ax, rien d’ajouté. Si on ajoute un nombre b non nul, elle est affine, mais pas linéaire.',
    explanation:
      b === 0
        ? `${expr} est de la forme ax : oui, elle est linéaire.`
        : `${expr} est de la forme ax + b avec b = ${fmt(b)} : non, elle est affine, mais pas linéaire.`,
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
const ICEBERGS = 'Compare les deux fractions : mets-les d’abord au même dénominateur.';
const ICEBERGS_SOMME = 'Mets d’abord les deux fractions au même dénominateur. Puis additionne ou soustrais les numérateurs.';
const ICEBERGS_PRODUIT = 'Calcule, puis simplifie le résultat jusqu’au bout. Pour diviser, multiplie par l’inverse de la deuxième fraction.';
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
const TREMPE_FACTEURS = 'Décompose le nombre en produit de facteurs premiers : divise par 2, puis 3, puis 5, puis 7.';
const REDUIRE = 'Réduis l’expression : regroupe les x entre eux, puis les nombres entre eux.';
const REDUIRE_MIXTE = 'Réduis l’expression : les x d’un côté, les nombres de l’autre, attention aux signes.';
const DEVELOPPER = 'Développe : distribue le nombre à chaque terme de la parenthèse.';
const DEVELOPPER_DOUBLE = 'Développe la double distributivité : chaque terme avec chaque terme, puis réduis.';
const FACTORISER = 'Factorise : trouve ce qui est commun aux deux termes et mets-le devant la parenthèse.';
const EQUILIBRE = 'Trouve x : fais la même opération des deux côtés de l’égalité.';
const EQUILIBRE_DEUX = 'Trouve x en deux étapes : d’abord le nombre seul, puis divise.';
const EQUILIBRE_TEST = 'Remplace x par sa valeur de chaque côté, puis compare les deux résultats.';
const EQUILIBRE_PRODUIT = 'Un produit est nul si l’un de ses facteurs est nul : trouve les deux solutions.';

const PYTHAGORE = 'Trouve l’hypoténuse : hypoténuse au carré égale la somme des carrés des deux autres côtés. La figure est codée.';
const PYTHAGORE_COTE = 'Trouve un côté de l’angle droit : hypoténuse au carré moins l’autre côté au carré, puis racine carrée.';
const THALES = 'Les droites sont parallèles : les longueurs du grand triangle sont celles du petit multipliées par le même nombre.';
const PYTHAGORE_RECIPROQUE = 'Le triangle est-il rectangle ? Compare le carré du plus grand côté à la somme des carrés des deux autres.';
const THALES_RECIPROQUE = 'Les droites sont-elles parallèles ? Calcule les deux coefficients, grand triangle divisé par petit, puis compare-les.';
const TRIGO = 'Choisis le bon rapport pour l’angle B : cosinus, sinus ou tangente. Le rappel est affiché.';
const MOYENNE = 'Calcule la moyenne : additionne toutes les valeurs, puis divise par leur nombre.';
const MEDIANE = 'Médiane ou étendue de la série rangée : la valeur du milieu, ou la plus grande moins la plus petite.';
const CHANCES = 'Probabilité : cas favorables sur cas possibles. Compte-les avant de répondre.';
const RELEVES = 'Lis le diagramme : chaque barre donne un effectif, le nombre d’élèves qui ont fait ce choix.';
const RELEVES_FREQUENCE = 'Trouve la fréquence : l’effectif sur l’effectif total. Additionne d’abord tous les effectifs.';
const RELEVES_POURCENTAGE = 'Donne la fréquence en pourcentage : l’effectif divisé par l’effectif total, puis multiplié par 100.';
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
  defineData({ biome: 'glacier', type: 'icebergs', level: 1, instruction: ICEBERGS, generators: [compareFractionsC4], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'icebergs', level: 2, instruction: ICEBERGS_SOMME, generators: [addSubFractions], block: 'glace' }),
  defineData({ biome: 'glacier', type: 'icebergs', level: 3, instruction: ICEBERGS_PRODUIT, generators: [mulDivFractions], block: 'glace' }),
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
  defineData({ biome: 'forge', type: 'trempe', level: 3, instruction: TREMPE_FACTEURS, generators: [primeDecomposition], block: 'acier' }),
  defineData({ biome: 'atelier', type: 'reduire', level: 1, instruction: REDUIRE, generators: [reduceSimple], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'reduire', level: 2, instruction: REDUIRE_MIXTE, generators: [reduceMixed], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'developper', level: 1, instruction: DEVELOPPER, generators: [developSimple], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'developper', level: 2, instruction: DEVELOPPER_DOUBLE, generators: [developDouble], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'developper', level: 3, instruction: FACTORISER, generators: [factorNumber, factorX], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 1, instruction: EQUILIBRE, generators: [equationOneStep], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 2, instruction: EQUILIBRE_DEUX, generators: [equationTwoSteps], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 3, instruction: EQUILIBRE_TEST, generators: [testEquality], block: 'calque' }),
  defineData({ biome: 'atelier', type: 'equilibre', level: 4, instruction: EQUILIBRE_PRODUIT, generators: [productEquation], block: 'calque' }),
  defineData({ biome: 'belvedere', type: 'pythagore', level: 1, instruction: PYTHAGORE, generators: [pythagoreHyp], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'pythagore', level: 2, instruction: PYTHAGORE_COTE, generators: [pythagoreSide], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'pythagore', level: 4, instruction: PYTHAGORE_RECIPROQUE, generators: [reciprocalPythagore], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'thales', level: 1, instruction: THALES, generators: [thales], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'thales', level: 3, instruction: THALES_RECIPROQUE, generators: [reciprocalThales], block: 'marbre' }),
  defineData({ biome: 'belvedere', type: 'trigo', level: 1, instruction: TRIGO, generators: [trigo], block: 'marbre' }),
  defineData({ biome: 'donnees', type: 'moyenne', level: 1, instruction: MOYENNE, generators: [mean], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'moyenne', level: 2, instruction: MEDIANE, generators: [medianRange], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'chances', level: 1, instruction: CHANCES, generators: [probability], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'releves', level: 1, instruction: RELEVES, generators: [readChart], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'releves', level: 2, instruction: RELEVES_FREQUENCE, generators: [frequencyFraction], block: 'quartz' }),
  defineData({ biome: 'donnees', type: 'releves', level: 3, instruction: RELEVES_POURCENTAGE, generators: [frequencyPercent], block: 'quartz' }),
  defineData({ biome: 'phare', type: 'images', level: 1, instruction: IMAGES, generators: [imageOf], block: 'prisme' }),
  defineData({ biome: 'phare', type: 'images', level: 2, instruction: ANTECEDENT, generators: [antecedent], block: 'prisme' }),
  defineData({ biome: 'phare', type: 'droites', level: 1, instruction: DROITES, generators: [linearOrAffine], block: 'prisme' }),
];
