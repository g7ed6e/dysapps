// Le Volcan des décimaux (6e) : sa quatrième mission, Nombres géants (le chiffre d’un rang dans un grand nombre, écrire
// en chiffres un nombre écrit en lettres, le nombre de dizaines, de centaines, de milliers ou de millions), et les
// niveaux de plus de la Coulée de lave (ranger trois décimaux, en intercaler un entre deux) et de la Pente graduée
// (encadrer une fraction entre deux entiers qui se suivent). Chaque item montre ce que l’élève manipule (le tableau de
// numération par classes, le tableau des décimaux, la droite graduée) et la règle de son geste (`rule-card`). Les pièges
// sont des erreurs d’élèves : les classes mal découpées, le 0 oublié dans une classe, le chiffre des milliers pris pour
// le nombre de milliers ; « 3,12 > 3,9 » parce que 12 > 9 ; l’entier voisin pris du mauvais côté, la fraction toujours
// plus petite que 1.
import { fractionWords } from '../../core/fractions';
import { randomInt, shuffle } from '../../core/random';
import { defineData, fmt, type ItemGenerator } from './college';
import { boundedDraw, byValue, rangeChoices, ruleCard as card } from './tirage';
import type { ExerciseDef, ExerciseItem } from './types';

const draw = boundedDraw('Volcan des décimaux');

// ---------- Les nombres en lettres ----------

const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

/**
 * Un nombre de 1 à 99 en lettres (orthographe traditionnelle, admise comme celle de 1990 : les classes se séparent
 * aux espaces). `final` : « quatre-vingts » prend son s quand rien ne le suit, sauf devant « mille ».
 */
function below100(n: number, final: boolean): string {
  if (n <= 16) return UNITS[n];
  if (n < 20) return `dix-${UNITS[n - 10]}`;
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t < 7) return u === 0 ? TENS[t] : u === 1 ? `${TENS[t]} et un` : `${TENS[t]}-${UNITS[u]}`;
  if (t === 7) return u === 1 ? 'soixante et onze' : `soixante-${below100(10 + u, final)}`;
  if (n === 80) return final ? 'quatre-vingts' : 'quatre-vingt';
  return `quatre-vingt-${below100(n - 80, final)}`;
}

/** Un nombre de 1 à 999 en lettres ; `final` : « cents » et « quatre-vingts » prennent leur s (pas devant « mille »). */
function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 0) return below100(r, final);
  const hundreds = h === 1 ? 'cent' : `${UNITS[h]} cent${r === 0 && final ? 's' : ''}`;
  return r === 0 ? hundreds : `${hundreds} ${below100(r, final)}`;
}

/** Une classe en lettres, avec son nom : « quarante mille », « deux millions », « six cents » ; vide pour 0. */
export function classInWords(value: number, cls: number): string {
  if (value === 0) return '';
  if (cls === 0) return below1000(value, true);
  if (cls === 1) return value === 1 ? 'mille' : `${below1000(value, false)} mille`;
  // Million et milliard sont des noms : ils prennent un s, et « cents », « quatre-vingts » gardent le leur devant eux.
  const noun = cls === 2 ? 'million' : 'milliard';
  return value === 1 ? `un ${noun}` : `${below1000(value, true)} ${noun}s`;
}

/** Un entier en lettres, jusqu’aux milliards : « deux millions quarante mille six cents ». */
export function inWords(n: number): string {
  if (n === 0) return 'zéro';
  if (n >= 10 ** 12) throw new Error(`inWords : ${n} dépasse les milliards.`);
  return classesOf(n)
    .map((v, cls) => classInWords(v, cls))
    .reverse()
    .filter(Boolean)
    .join(' ');
}

// ---------- Nombres géants ----------

/** Les classes d’un entier, des unités vers la gauche : 2 040 600 → [600, 40, 2]. */
export function classesOf(n: number): number[] {
  const out: number[] = [];
  do {
    out.push(n % 1000);
    n = Math.floor(n / 1000);
  } while (n > 0);
  return out;
}
const fromClasses = (classes: number[]): number => classes.reduce((sum, v, i) => sum + v * 1000 ** i, 0);

const CLASS_NAMES = ['unités', 'mille', 'millions', 'milliards'];
/**
 * Un grand nombre écrit pour Nombres géants : les classes séparées par une espace insécable pleine (U+00A0), plus large
 * que l’espace fine de `fmt`, pour que l’œil les voie ; `pourLaVoix` les recolle aussi pour la voix.
 */
const big = (n: number): string => fmt(n).replace(/\u202f/g, '\u00a0');

const RANK_NAMES = ['unités', 'dizaines', 'centaines'];
/** Le nom d’un rang, compté depuis les unités : 5 → « centaines de mille ». */
export function rankName(i: number): string {
  const rank = RANK_NAMES[i % 3];
  const cls = Math.floor(i / 3);
  return cls === 0 ? rank : `${rank} de ${CLASS_NAMES[cls]}`;
}

export const READ_RULES = ['Coupe par trois chiffres, depuis la droite.', 'Une classe : centaines, dizaines, unités.'];

/** Niveau 1 : le chiffre d’un rang dans un nombre de sept à dix chiffres (jusqu’aux milliards), tous différents. */
export const rankDigit: ItemGenerator = (rng) => {
  const length = randomInt(7, 10, rng);
  const pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rng).slice(0, length);
  // Le premier chiffre n’est jamais 0 : on l’échange avec un autre.
  if (pool[0] === 0) [pool[0], pool[1]] = [pool[1], pool[0]];
  const text = pool.join('');
  const n = Number(text);
  const digitAt = (i: number) => text[length - 1 - i];
  // Un rang des mille, des millions ou des milliards : ceux des unités, le Cratère les travaille déjà.
  const i = randomInt(3, length - 1, rng);
  const digit = digitAt(i);
  // Les pièges : le même rang dans la classe voisine (les classes mal découpées), puis le rang voisin, puis le suivant.
  const traps = [i - 3, i + 3, i + 1, i - 1, i - 2, i + 2].filter((j) => j >= 0 && j < length).map(digitAt);
  const choices = [digit, ...traps.slice(0, 3)].sort();
  const cls = Math.floor(i / 3);
  const classText = String(classesOf(n)[cls]).padStart(cls === Math.floor((length - 1) / 3) ? 1 : 3, '0');
  return {
    key: `rang-${n}-${i}`,
    prompt: `Dans ${big(n)}, quel est le chiffre des ${rankName(i)} ?`,
    spoken: `Dans ${big(n)}, quel est le chiffre des ${rankName(i)} ?`,
    choices,
    answer: digit,
    hint: `Trouve d’abord la classe des ${CLASS_NAMES[cls]}, puis ses ${RANK_NAMES[i % 3]}.`,
    explanation: `Le chiffre des ${rankName(i)} est ${digit}. La classe des ${CLASS_NAMES[cls]}, c’est ${classText} : ${digit} est aux ${RANK_NAMES[i % 3]}.`,
    figure: { kind: 'class-table', props: { value: text } },
    aid: card('Lire un grand nombre', READ_RULES),
  };
};

export const WRITE_RULES = ['Chaque classe a trois chiffres.', 'Il en manque : écris des 0 devant.'];

/** Une classe écrite sans ses 0 de tête (vide pour 0), comme l’élève qui les oublie : 40 → « 40 ». */
const unpadded = (v: number) => (v === 0 ? '' : String(v));
/** Le nombre écrit classe par classe ; `write` dit comment écrire chaque classe (la première, toujours sans 0 devant). */
const concat = (classes: number[], write: (v: number, cls: number) => string): number =>
  Number(
    classes
      .map((v, cls) => (cls === classes.length - 1 ? String(v) : write(v, cls)))
      .reverse()
      .join(''),
  );

/**
 * Niveau 2 : écrire en chiffres un nombre écrit en lettres, jusqu’aux millions (les milliards sont aux niveaux 1 et 3 : en
 * lettres, l’énoncé passerait sur trois lignes), avec une classe incomplète au moins.
 */
export const writeInDigits: ItemGenerator = (rng) => {
  // La place de la réponse, tirée une fois : on cherche un item qui la permet.
  const wanted = randomInt(0, 3, rng);
  return draw('à écrire en chiffres', (): ExerciseItem | undefined => {
    // Les classes des mille et des unités. Une classe pleine reste courte à lire : des centaines, puis rien, une dizaine
    // ronde ou un nombre jusqu’à seize.
    const lower = Array.from({ length: 2 }, () => {
      const r = rng();
      if (r < 0.25) return 0;
      if (r < 0.7) return randomInt(1, 99, rng);
      const rest = rng() < 0.4 ? 0 : rng() < 0.5 ? randomInt(1, 6, rng) * 10 : randomInt(1, 16, rng);
      return randomInt(1, 9, rng) * 100 + rest;
    });
    const classes = [...lower, randomInt(1, 99, rng)];
    // Une classe incomplète au moins (c’est là que se font les erreurs), et pas toutes vides.
    const incomplete = lower.map((v, cls) => ({ v, cls })).filter(({ v }) => v < 100);
    if (incomplete.length === 0 || lower.every((v) => v === 0)) return undefined;
    const n = fromClasses(classes);
    // Les 0 oubliés dans toutes les classes : l’erreur la plus fréquente, toujours proposée.
    const forgotten = concat(classes, unpadded);
    const traps = [
      // Les 0 oubliés dans une seule classe.
      ...incomplete.map(({ cls: c }) => concat(classes, (v, cls) => (cls === c ? unpadded(v) : String(v).padStart(3, '0')))),
      // Un seul 0 devant un chiffre seul : sept dans la classe des unités → 07.
      ...incomplete
        .filter(({ v }) => v > 0 && v < 10)
        .map(({ v: w, cls: c }) => concat(classes, (v, cls) => (cls === c ? `0${w}` : String(v).padStart(3, '0')))),
      // Une classe vide écrite d’un seul 0 : cinquante-huit millions sept cents → 580 700.
      ...incomplete
        .filter(({ v }) => v === 0)
        .map(({ cls: c }) => concat(classes, (v, cls) => (cls === c ? '0' : String(v).padStart(3, '0')))),
      // Le nombre de la classe écrit à gauche de la classe (quarante mille → 400 000), ou au milieu (six → 060).
      ...incomplete
        .filter(({ v }) => v > 0)
        .flatMap(({ v, cls: c }) => (v < 10 ? [v * 100, v * 10] : [v * 10]).map((w) => fromClasses(classes.map((x, cls) => (cls === c ? w : x))))),
    ];
    // Pas les millions écrits en entier puis le reste à la suite (58 000 000 700) : l’erreur existe, mais sa réponse de
    // quatorze caractères déborde de son bouton en OpenDyslexic.
    // Aucun voisin inventé : un 0 de plus ou de moins à la fin n’est pas une erreur d’élève. Sans trois pièges, on retire.
    // Le 0 oublié, toujours plus petit que la réponse, est proposé à chaque item où elle n’est pas première ; une fois sur
    // quatre, elle est première, avec trois pièges plus grands (la classe écrite à gauche ou au milieu) : chaque place
    // revient autant de fois. La place est tirée d’abord, l’item est tiré à nouveau si ses pièges ne la permettent pas.
    const values = rangeChoices(n, traps, [], byValue, rng, wanted === 0 ? undefined : forgotten);
    if (!values || values.indexOf(n) !== wanted) return undefined;
    const words = inWords(n);
    // La classe incomplète la plus à gauche : c’est elle que la correction explique.
    const { v, cls } = incomplete[incomplete.length - 1];
    const step =
      v === 0
        ? `La classe des ${CLASS_NAMES[cls]} est vide : on y écrit 000.`
        : `Dans la classe des ${CLASS_NAMES[cls]}, ${below1000(v, cls !== 1)} s’écrit ${String(v).padStart(3, '0')}.`;
    return {
      key: `ecrire-${n}`,
      // Des traits d’union ordinaires, pas insécables : aux grands réglages sur un téléphone, « quarante-six » insécable
      // ne tient pas dans la ligne et se coupe au milieu d’une lettre ; la coupure après le trait d’union gêne moins.
      prompt: `Écris en chiffres : ${words}.`,
      spoken: `Écris en chiffres : ${words}.`,
      choices: values.map(big),
      answer: big(n),
      hint: `Dans la classe des ${CLASS_NAMES[cls]}, écris trois chiffres : des 0 devant s’il en manque, ou 000 si elle est vide.`,
      explanation: `On écrit ${big(n)}. ${step}`,
      // Dans le tableau, le nombre de chaque classe sans le nom de la classe, que l’en-tête donne : « quarante » sous « mille ».
      figure: { kind: 'class-table', props: { words: classes.map((w, c) => (w === 0 ? '' : below1000(w, c !== 1))).reverse() } },
      aid: card('Écrire un grand nombre', WRITE_RULES),
    };
  });
};

// Chaque unité avec sa case du tableau : les milliers, c’est la colonne U de la classe des mille (l’énoncé dit « milliers »,
// le tableau « mille » et « U » : la règle fait le lien).
const COUNT_UNITS = [
  { name: 'dizaines', power: 1, column: 'D', inClass: 'unités' },
  { name: 'centaines', power: 2, column: 'C', inClass: 'unités' },
  { name: 'milliers', power: 3, column: 'U', inClass: 'mille' },
  { name: 'millions', power: 6, column: 'U', inClass: 'millions' },
];
/** La case du tableau d’une unité : « la colonne U de la classe des mille ». */
const columnOf = (unit: string): string => {
  const { column, inClass } = COUNT_UNITS.find((u) => u.name === unit)!;
  return `la colonne ${column} de la classe des ${inClass}`;
};
/** La règle du niveau 3, pour l’unité de l’item affiché. */
export const countRules = (unit: string): string[] => [`Tous les chiffres, de la gauche aux ${unit}.`, `Les ${unit}, c’est ${columnOf(unit)}.`];

/**
 * Niveau 3 : le nombre de dizaines, de centaines, de milliers ou de millions d’un nombre de six à neuf chiffres. Les
 * milliards restent au niveau 1 : une réponse de dix chiffres ne tiendrait pas dans son bouton en OpenDyslexic.
 */
export const countOf: ItemGenerator = (rng) =>
  draw('« combien de »', (): ExerciseItem | undefined => {
    const length = randomInt(6, 9, rng);
    const n = randomInt(10 ** (length - 1), 10 ** length - 1, rng);
    const { name, power } = COUNT_UNITS[randomInt(0, COUNT_UNITS.length - 1, rng)];
    const answer = Math.floor(n / 10 ** power);
    // Deux chiffres au moins : sinon, le chiffre et le nombre se confondent.
    if (answer < 10) return undefined;
    const digit = answer % 10;
    const traps = [
      // Le chiffre des milliers pris pour le nombre de milliers.
      digit,
      // Le nombre de milliers confondu avec sa valeur : 3 456 milliers écrit 3 456 000.
      answer * 10 ** power,
      // La classe seule : les milliers de 3 456 789 lus 456.
      ...(power === 3 && n >= 10 ** 6 ? [answer % 1000] : []),
      // Les chiffres pris à droite du rang, pas à gauche : les milliers de 3 456 789 lus 6 789.
      n % 10 ** (power + 1),
      // Un chiffre de trop, un chiffre de moins : le rang voisin.
      Math.floor(n / 10 ** (power - 1)),
      Math.floor(n / 10 ** (power + 1)),
    ];
    // Le nombre lui-même, recopié de l’énoncé, s’il le faut d’un côté.
    const values = rangeChoices(answer, traps, [n], byValue, rng);
    if (!values) return undefined;
    return {
      key: `combien-${n}-${power}`,
      prompt: `Combien de ${name} y a-t-il dans ${big(n)} ?`,
      spoken: `Combien de ${name} y a-t-il dans ${big(n)} ?`,
      choices: values.map(big),
      answer: big(answer),
      hint: `Repère ${columnOf(name)}, puis prends aussi tous les chiffres à sa gauche.`,
      explanation: `Il y a ${big(answer)} ${name} dans ${big(n)}. Les ${name}, c’est ${columnOf(name)} : on prend tous les chiffres jusqu’à elle, pas seulement le ${digit}.`,
      figure: { kind: 'class-table', props: { value: String(n) } },
      aid: card(`Combien de ${name} ?`, countRules(name)),
    };
  });

// ---------- Coulée de lave : ranger, intercaler ----------

/** Un décimal en centièmes (345 → 3,45), écrit à la française. */
const dec = (hundredths: number): string => fmt(hundredths / 100);
/** Lu à voix haute, sans symbole : « 3 virgule 45 ». */
const sayDec = (hundredths: number): string => dec(hundredths).replace(',', ' virgule ');
/** Le tableau des décimaux, les nombres complétés par des 0 grisés (il compte en millièmes). */
const table = (hundredths: number[]) => ({ kind: 'decimal-table', props: { rows: hundredths.map((h) => h * 10), padZeros: true } });

export const ORDER_RULES = ['Même nombre de chiffres après la virgule.', 'Compare les dixièmes, puis les centièmes.'];

/**
 * Niveau 2 de la Coulée : ranger trois décimaux de même partie entière, l’un à un chiffre après la virgule, plus grand
 * qu’un autre qui en a deux (3,5 et 3,45). Trois réponses, des rangements, chacune lue sur une ligne : le bon, celui de
 * la partie décimale lue comme un entier (3,5 ; 3,12 ; 3,45), et l’ordre à l’envers ; la réponse à une place tirée.
 */
export const orderDecimals: ItemGenerator = (rng) =>
  draw('à ranger', (): ExerciseItem | undefined => {
    const u = randomInt(0, 9, rng);
    const t = randomInt(3, 9, rng);
    const x = u * 100 + t * 10;
    const y = u * 100 + randomInt(1, t - 1, rng) * 10 + randomInt(1, 9, rng);
    const z = u * 100 + randomInt(10, 99, rng);
    if (z % 10 === 0 || z === y) return undefined;
    const sorted = [x, y, z].sort(byValue);
    // La partie décimale lue comme un entier : 3,5 → 5, 3,45 → 45 (« 3,12 > 3,9 parce que 12 > 9 »).
    const asInteger = (v: number) => (v % 10 === 0 ? (v % 100) / 10 : v % 100);
    const wholeReading = [x, y, z].sort((a, b) => asInteger(a) - asInteger(b));
    // Les nombres séparés par « ; » : l’espace insécable avant (le « ; » ne commence jamais une ligne), une espace demi-cadratin
    // après, plus large que l’espace d’un mot ; on ne coupe jamais à l’intérieur d’un nombre.
    const say = (list: number[]) => list.map(dec).join('\u00a0;\u2002');
    // Les pièges : la lecture en entiers, l’ordre à l’envers (du plus grand au plus petit) ; s’ils se confondent, on retire.
    const traps = [...new Set([wholeReading, [...sorted].reverse()].map(say))];
    if (traps.length < 2) return undefined;
    const choices = shuffle(traps, rng);
    choices.splice(randomInt(0, 2, rng), 0, say(sorted));
    // L’énoncé ne les donne jamais déjà rangés.
    const shown = shuffle([x, y, z], rng);
    if (say(shown) === say(sorted)) return undefined;
    return {
      key: `ranger-${sorted.join('-')}`,
      prompt: `Range du plus petit au plus grand : ${say(shown)}`,
      spoken: `Range du plus petit au plus grand : ${shown.map(sayDec).join(', ')}.`,
      choices,
      answer: say(sorted),
      hint: 'Compare d’abord les dixièmes, puis les centièmes.',
      explanation: `Rangés : ${say(sorted)}. En effet, ${dec(x)} s’écrit aussi ${dec(x)}0 : ${x % 100} centièmes, c’est plus que les ${y % 100} centièmes de ${dec(y)}.`,
      figure: table(shown),
      aid: card('Ranger des décimaux', ORDER_RULES),
    };
  });

export const BETWEEN_RULES = ['Même nombre de chiffres après la virgule.', 'Cherche entre les deux, rang par rang.'];

/**
 * Niveau 3 de la Coulée : un décimal entre 2,7 et 2,75. Les pièges lisent la partie décimale comme un entier (2,8 et
 * 2,69 « entre 7 et 75 ») ; les voisins sont juste au-delà des bornes.
 */
export const betweenDecimals: ItemGenerator = (rng) =>
  draw('à intercaler', (): ExerciseItem | undefined => {
    const u = randomInt(0, 9, rng);
    const t = randomInt(2, 8, rng);
    const c = randomInt(2, 8, rng);
    const a = u * 100 + t * 10;
    const b = a + c;
    const answer = a + randomInt(1, c - 1, rng);
    const traps = [u * 100 + (t + 1) * 10, u * 100 + (t - 1) * 10 + randomInt(1, 9, rng)];
    const fillers = [b + 1, a - 1, b + 2, a - 2].filter((v) => v >= 0);
    const values = rangeChoices(answer, traps, fillers, byValue, rng);
    if (!values) return undefined;
    return {
      key: `entre-${a}-${b}-${answer}`,
      prompt: `Quel nombre est entre ${dec(a)} et ${dec(b)} ?`,
      spoken: `Quel nombre est entre ${sayDec(a)} et ${sayDec(b)} ?`,
      choices: values.map(dec),
      answer: dec(answer),
      hint: `Écris ${dec(a)} avec deux chiffres après la virgule, comme ${dec(b)}.`,
      explanation: `${dec(answer)} est entre ${dec(a)} et ${dec(b)}. En effet, ${dec(a)} s’écrit aussi ${dec(a)}0 : ${answer % 100} centièmes, c’est entre ${a % 100} et ${b % 100} centièmes.`,
      figure: table([a, b]),
      aid: card('Intercaler un décimal', BETWEEN_RULES),
    };
  });

// ---------- Pente graduée : encadrer une fraction ----------

export const FRAME_RULES = ['Dans la table du nombre du bas, encadre celui du haut.', 'Le nombre de fois donne les deux entiers.'];

/** Deux entiers qui se suivent. */
type Pair = [number, number];
const pairText = ([a, b]: Pair) => `${a} et ${b}`;
const byLower = (a: Pair, b: Pair) => a[0] - b[0];

/**
 * Niveau 3 de la Pente : les deux entiers qui se suivent et encadrent une fraction plus grande que 1, la droite de 0 à 5
 * graduée en parts de l’unité. Pièges : l’entier voisin pris du mauvais côté (2 et 3, ou 4 et 5, pour 17/5), la
 * fraction toujours plus petite que 1 (0 et 1).
 */
export const frameFraction: ItemGenerator = (rng) =>
  draw('à encadrer', (): ExerciseItem | undefined => {
    const d = randomInt(2, 6, rng);
    const q = randomInt(1, 4, rng);
    const n = q * d + randomInt(1, d - 1, rng);
    const traps: Pair[] = [
      [q - 1, q],
      [q + 1, q + 2],
    ];
    if (q >= 2) traps.push([0, 1]);
    // Voisins : un entier plus loin de chaque côté, puis deux (la réponse prend ainsi chaque place).
    const neighbours: Pair[] = [
      [q - 2, q - 1],
      [q + 2, q + 3],
      [q - 3, q - 2],
      [q + 3, q + 4],
    ];
    const fillers = neighbours.filter(([lo]) => lo >= 0);
    const values = rangeChoices<Pair>([q, q + 1], traps, fillers, byLower, rng);
    if (!values) return undefined;
    const words = fractionWords(n, d);
    return {
      key: `encadrer-${n}-${d}`,
      prompt: `${n}/${d} est entre quels entiers qui se suivent ?`,
      spoken: `${words} est entre quels entiers qui se suivent ?`,
      choices: values.map(pairText),
      answer: pairText([q, q + 1]),
      hint: `Dans la table de ${d}, cherche les deux résultats autour de ${n}. La droite te permet de vérifier.`,
      explanation: `${words}, c’est entre ${q} et ${q + 1}. En effet, ${q} fois ${d} font ${q * d} et ${q + 1} fois ${d} font ${(q + 1) * d} : ${n} est entre les deux.`,
      figure: { kind: 'graduated-line', props: { start: 0, units: 5, perUnit: d, point: n } },
      aid: card('Encadrer une fraction', FRAME_RULES),
    };
  });

// ---------- Les exercices ----------

const GEANTS_1 = 'Trouve le chiffre du rang demandé. Le tableau range le nombre en classes de trois chiffres.';
const GEANTS_2 = 'Écris le nombre en chiffres : trois chiffres dans chaque classe du tableau.';
const GEANTS_3 = 'Compte les dizaines, les centaines, les milliers ou les millions : prends tous les chiffres jusqu’à ce rang.';
const COULEE_RANGER = 'Range les trois nombres du plus petit au plus grand. Le tableau les aligne rang par rang.';
const COULEE_ENTRE = 'Trouve le nombre qui se place entre les deux. Le tableau leur donne autant de chiffres après la virgule.';
const PENTE_ENCADRER = 'Trouve les deux entiers qui se suivent et encadrent la fraction. La droite est graduée en parts égales.';

// La récompense des missions du Volcan (6e) : 12 XP et de l’obsidienne, comme celles de maths.ts.
const define = (type: string, level: number, instruction: string, generators: ItemGenerator[]): ExerciseDef =>
  defineData({ biome: 'volcan', type, level, instruction, generators, block: 'obsidienne', xp: 12 });

/** Nombres géants, et les niveaux de plus de la Coulée de lave et de la Pente graduée. */
export const VOLCAN_EXERCISES: ExerciseDef[] = [
  define('coulee', 2, COULEE_RANGER, [orderDecimals]),
  define('coulee', 3, COULEE_ENTRE, [betweenDecimals]),
  define('pente', 3, PENTE_ENCADRER, [frameFraction]),
  define('geants', 1, GEANTS_1, [rankDigit]),
  define('geants', 2, GEANTS_2, [writeInDigits]),
  define('geants', 3, GEANTS_3, [countOf]),
];
