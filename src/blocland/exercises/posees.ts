// Galets en colonnes (Rivière des fractions, 6e) : les opérations posées, puis la division euclidienne posée, puis
// la division d’un nombre décimal par un entier. Chaque item montre l’opération posée (aide `column-operation` ou
// `long-division`, voir Aids.tsx), avec un seul « ? », et la règle de la méthode (`rule-card`). Les pièges sont des
// erreurs d’élèves : la retenue oubliée, le petit chiffre ôté du grand, la ligne des dizaines sans décalage, les parties
// entière et décimale additionnées à part ; le reste plus grand que le diviseur, le 0 oublié au quotient, le dernier
// chiffre pas abaissé, le produit qui dépasse ; la virgule oubliée ou mal placée, le reste des unités perdu.
import { randomInt } from '../../core/random';
import { POSEES_NOTE } from './Aids';
import { defineData, fmt, type ItemGenerator } from './college';
import type { ExerciseDef, ExerciseItem } from './types';

type Rng = () => number;

/** Les tirages d’un item sont bornés : au-delà, le générateur a un défaut, qu’on signale plutôt que de boucler. */
const MAX_TRIES = 1000;
function draw<T>(name: string, attempt: () => T | undefined): T {
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const found = attempt();
    if (found !== undefined) return found;
  }
  throw new Error(`Galets en colonnes : aucun item ${name} trouvé en ${MAX_TRIES} tirages.`);
}

/** Les chiffres d’un entier, des unités vers la gauche : 503 → [3, 0, 5]. */
const digitsOf = (n: number): number[] => String(n).split('').reverse().map(Number);
/** Un nombre à virgule lu à voix haute, sans symbole : « 12 virgule 5 ». */
const sayDecimal = (n: number): string => String(n).replace('.', ' virgule ');
/** Un entier tiré au hasard entre min et max, dont le chiffre des unités n’est pas 0. */
const notRound = (min: number, max: number, rng: Rng): number =>
  draw('non rond', () => {
    const n = randomInt(min, max, rng);
    return n % 10 === 0 ? undefined : n;
  });

/**
 * Les quatre réponses, rangées dans l’ordre (`compare`), la place de la réponse tirée au hasard parmi celles que les
 * pièges permettent. Les pièges sont des erreurs d’élèves, le plus fréquent d’abord ; de chaque côté de la réponse, ils
 * passent avant les voisins (`fillers`, les plus proches d’abord). Un vrai piège au moins est toujours proposé, et
 * `required` (le piège que le niveau travaille, le 0 oublié) l’est toujours quand il existe. Sans place possible,
 * `undefined` : l’item est tiré à nouveau. Pas `drawChoices` : il remplit avec des voisins le côté où la place tirée
 * l’exige, quitte à ne proposer aucun vrai piège (« 55 × 32 » n’aurait plus que 1 770, 1 780 et 1 790).
 */
export function rangeChoices<T>(
  answer: T,
  traps: T[],
  fillers: T[],
  compare: (a: T, b: T) => number,
  rng: Rng,
  required?: T,
): T[] | undefined {
  const same = (a: T, b: T) => compare(a, b) === 0;
  const distinct = (list: T[]) => list.filter((t, i) => !same(t, answer) && list.findIndex((u) => same(u, t)) === i);
  const real = distinct(required === undefined ? traps : [required, ...traps]);
  const all = distinct([...real, ...fillers]);
  const below = all.filter((t) => compare(t, answer) < 0);
  const above = all.filter((t) => compare(t, answer) > 0);
  // Les vrais pièges sont en tête de leur côté : la place p garde les p premiers du dessous, les 3 − p premiers du dessus.
  const realBelow = real.filter((t) => compare(t, answer) < 0).length;
  const realAbove = real.length - realBelow;
  const keeps = (p: number) =>
    ((realBelow > 0 && p >= 1) || (realAbove > 0 && p <= 2)) &&
    (required === undefined || same(required, answer) || (compare(required, answer) < 0 ? p >= 1 : p <= 2));
  const places = [0, 1, 2, 3].filter((p) => p <= below.length && 3 - p <= above.length && keeps(p));
  if (places.length === 0) return undefined;
  const wanted = places[randomInt(0, places.length - 1, rng)];
  return [answer, ...below.slice(0, wanted), ...above.slice(0, 3 - wanted)].sort(compare);
}

/** Les voisins d’une réponse chiffrée, un, deux ou trois crans de `step` de chaque côté, les plus proches d’abord. */
const neighbours = (answer: number, step: number): number[] =>
  [1, 2, 3].flatMap((k) => [answer - k * step, answer + k * step]).filter((v) => v > 0);
const byValue = (a: number, b: number) => a - b;

// ---------- Niveau 1 : les opérations posées ----------

// Une carte par opération, la règle de l’item affiché seulement : deux lignes, l’alignement puis la retenue ou le décalage.
export const ADD_RULES = [
  'Unités sous unités, virgule sous virgule.',
  'Si une colonne fait 10 ou plus : écris les unités, retiens 1 à gauche.',
];
export const SUB_RULES = [
  'Unités sous unités, virgule sous virgule.',
  'Chiffre du haut trop petit : ajoute 10 en haut, et 1 en bas dans la colonne de gauche.',
];
// Pas « virgule sous virgule » : on ne pose que des entiers ici, et pour les décimaux la multiplication ne s’aligne pas
// sur la virgule.
export const MUL_RULES = ['Unités sous unités.', 'Ligne des dizaines : écris d’abord 0 aux unités.'];
const card = (title: string, lines: string[]) => ({ kind: 'rule-card', props: { title, lines } });

/** L’addition posée sans retenue : chaque colonne garde son chiffre des unités, la dernière s’écrit en entier. */
export function addWithoutCarry(a: number, b: number): number {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  const n = Math.max(x.length, y.length);
  let out = 0;
  for (let i = 0; i < n; i++) {
    const s = (x[i] ?? 0) + (y[i] ?? 0);
    out += (i === n - 1 ? s : s % 10) * 10 ** i;
  }
  return out;
}

/** Addition de deux décimaux, l’un à un chiffre après la virgule, l’autre à deux : virgule sous virgule. */
export const addDecimals: ItemGenerator = (rng) =>
  draw('d’addition', (): ExerciseItem | undefined => {
    const whole = randomInt(10, 89, rng);
    const tenths = randomInt(1, 9, rng);
    const units = randomInt(2, 9, rng);
    const cents = notRound(11, 99, rng);
    // En centièmes : 12,5 → 1 250 ; 3,25 → 325.
    const a = whole * 100 + tenths * 10;
    const b = units * 100 + cents;
    const sum = a + b;
    const noCarry = addWithoutCarry(a, b);
    // Au moins une retenue : sinon, le piège de la retenue oubliée serait la réponse.
    if (noCarry === sum) return undefined;
    const [x, y] = [a / 100, b / 100];
    const traps = [
      // Les parties entière et décimale additionnées à part : 12,5 + 3,25 donne 15,30 (5 et 25 font 30).
      ...(tenths + cents < 100 ? [(whole + units) * 100 + tenths + cents] : []),
      // La retenue oubliée.
      noCarry,
    ];
    // Voisins : une unité de plus ou de moins (la retenue qui passe la virgule).
    const values = rangeChoices(sum, traps, neighbours(sum, 100), byValue, rng);
    if (!values) return undefined;
    return {
      key: `add-${a}-${b}`,
      prompt: `${fmt(x)} + ${fmt(y)} = …`,
      spoken: `${sayDecimal(x)} plus ${sayDecimal(y)}, combien ?`,
      choices: values.map((v) => fmt(v / 100)),
      answer: fmt(sum / 100),
      hint: `Écris ${fmt(y)} sous ${fmt(x)}, virgule sous virgule, puis commence par la colonne de droite.`,
      explanation: `${fmt(x)} plus ${fmt(y)} égale ${fmt(sum / 100)}. Virgule sous virgule : le ${tenths} de ${fmt(x)} est aux dixièmes, il s’ajoute au ${Math.floor(cents / 10)} de ${fmt(y)}, pas à ${cents}.`,
      figure: { kind: 'column-operation', props: { op: '+', rows: [fmt(x), fmt(y)] } },
      aid: card('Addition posée', ADD_RULES),
    };
  });

/** La soustraction où l’on ôte dans chaque colonne le petit chiffre du grand, sans retenue. */
export function subtractFlipped(a: number, b: number): number {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  return x.reduce((out, d, i) => out + Math.abs(d - (y[i] ?? 0)) * 10 ** i, 0);
}

/** La soustraction où l’on ajoute 10 en haut sans ajouter 1 en bas dans la colonne de gauche. */
export function subtractWithoutCarry(a: number, b: number): number {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  return x.reduce((out, d, i) => {
    const e = y[i] ?? 0;
    return out + (d < e ? d + 10 - e : d - e) * 10 ** i;
  }, 0);
}

/** Soustraction de deux nombres à trois chiffres, avec au moins une retenue (et souvent un 0 en haut). */
export const subtractPosed: ItemGenerator = (rng) =>
  draw('de soustraction', (): ExerciseItem | undefined => {
    // Un 0 au rang des dizaines une fois sur trois : 503 − 267.
    const a = rng() < 1 / 3 ? randomInt(3, 9, rng) * 100 + randomInt(1, 9, rng) : randomInt(300, 999, rng);
    const b = randomInt(102, a - 60, rng);
    const diff = a - b;
    const flipped = subtractFlipped(a, b);
    const noCarry = subtractWithoutCarry(a, b);
    if (flipped === diff || noCarry === diff) return undefined;
    const values = rangeChoices(diff, [flipped, noCarry], neighbours(diff, 10), byValue, rng);
    if (!values) return undefined;
    // La première colonne où le chiffre du haut est trop petit (aucune retenue ne l’a encore changée).
    const i = digitsOf(a).findIndex((d, j) => d < (digitsOf(b)[j] ?? 0));
    const [top, bottom] = [digitsOf(a)[i], digitsOf(b)[i]];
    return {
      key: `sub-${a}-${b}`,
      prompt: `${fmt(a)} − ${fmt(b)} = …`,
      spoken: `${a} moins ${b}, combien ?`,
      choices: values.map(fmt),
      answer: fmt(diff),
      hint: 'Commence par les unités. Si le chiffre du haut est trop petit, prends une retenue.',
      explanation: `${a} moins ${b} égale ${diff}. ${top} moins ${bottom} ne se fait pas, et on ne calcule pas ${bottom} moins ${top} : on ajoute 10 en haut (${top + 10} moins ${bottom}), et 1 en bas dans la colonne de gauche.`,
      figure: { kind: 'column-operation', props: { op: '−', rows: [fmt(a), fmt(b)] } },
      aid: card('Soustraction posée', SUB_RULES),
    };
  });

/** Un nombre multiplié par un chiffre en oubliant les retenues : 47 × 3 donne 121 (7 × 3 = 21, on garde 1). */
export function timesDigitWithoutCarry(a: number, m: number): number {
  const x = digitsOf(a);
  return x.reduce((out, d, i) => out + (i === x.length - 1 ? d * m : (d * m) % 10) * 10 ** i, 0);
}

/** Multiplication d’un nombre à deux chiffres par un nombre à deux chiffres (de 12 à 39). */
export const multiplyPosed: ItemGenerator = (rng) =>
  draw('de multiplication', (): ExerciseItem | undefined => {
    const a = notRound(13, 98, rng);
    const tens = randomInt(1, 3, rng);
    const units = randomInt(2, 9, rng);
    const b = tens * 10 + units;
    const product = a * b;
    const noShift = a * units + a * tens;
    const noCarry = timesDigitWithoutCarry(a, units) + timesDigitWithoutCarry(a, tens) * 10;
    // Les unités entre elles, les dizaines entre elles : 47 × 23 donne 821 (4 × 2 = 8, 7 × 3 = 21).
    const pairwise = Math.floor(a / 10) * tens * 100 + (a % 10) * units;
    if (noCarry === product) return undefined;
    const values = rangeChoices(product, [noShift, noCarry, pairwise], neighbours(product, 10), byValue, rng);
    if (!values) return undefined;
    return {
      key: `mul-${a}-${b}`,
      prompt: `${fmt(a)} × ${fmt(b)} = …`,
      // L’aide dessine les deux lignes : la voix dit, comme l’écran, qu’elles se posent sur le cahier.
      spoken: `${a} fois ${b}, combien ? ${POSEES_NOTE}`,
      choices: values.map(fmt),
      answer: fmt(product),
      // Le calcul intermédiaire se garde sur le cahier, pas en tête : l’aide dessine les deux lignes à remplir.
      hint: `Sur ton cahier : ${a} fois ${units}, puis ${a} fois ${tens * 10}. Additionne les deux lignes.`,
      explanation: `${a} fois ${b} égale ${fmt(product)}. Ligne des unités : ${a} fois ${units}, ${fmt(a * units)}. Ligne des dizaines, qui commence par 0 : ${a} fois ${tens * 10}, ${fmt(a * tens * 10)}.`,
      figure: { kind: 'column-operation', props: { op: '×', rows: [fmt(a), fmt(b)] } },
      aid: card('Multiplication posée', MUL_RULES),
    };
  });

// ---------- La division posée : les étapes ----------

/** Une étape de la division posée : le nombre partagé, combien de fois le diviseur y va, le reste, le chiffre abaissé. */
export interface DivisionStep {
  part: number;
  times: number;
  rest: number;
  /** Le chiffre abaissé pour former `part` (absent pour la première étape). */
  brought?: number;
  /** Le chiffre abaissé est le premier après la virgule : la virgule va au quotient. */
  comma?: boolean;
}

/**
 * Les étapes d’une division posée, comme on l’écrit : on prend assez de chiffres à gauche pour que le diviseur y aille
 * (toute la partie entière si elle est plus petite), puis on abaisse un chiffre à chaque étape. `whole` : les chiffres
 * de la partie entière ; `decimals` : ceux après la virgule.
 */
export function divisionSteps(whole: string, decimals: string, divisor: number): DivisionStep[] {
  let i = 0;
  let part = 0;
  do part = part * 10 + Number(whole[i++]);
  while (part < divisor && i < whole.length);
  const steps: DivisionStep[] = [{ part, times: Math.floor(part / divisor), rest: part % divisor }];
  const rest = [...whole.slice(i)].map((c) => ({ digit: Number(c), comma: false }));
  [...decimals].forEach((c, j) => rest.push({ digit: Number(c), comma: j === 0 }));
  for (const { digit, comma } of rest) {
    const previous = steps[steps.length - 1];
    const p = previous.rest * 10 + digit;
    steps.push({ part: p, times: Math.floor(p / divisor), rest: p % divisor, brought: digit, comma });
  }
  return steps;
}

/**
 * Les étapes de la division où l’on écrit 0 au quotient (le chiffre abaissé forme un nombre plus petit que le
 * diviseur), une phrase chacune ; `undefined` s’il n’y en a pas. La correction ne redit que ces étapes : c’est là que se
 * fait l’erreur, le reste du calcul se relit sur le cahier.
 */
export function sayZeroSteps(steps: DivisionStep[], divisor: number): string | undefined {
  const zeros = steps.slice(1).filter((st) => st.times === 0);
  if (zeros.length === 0) return undefined;
  return zeros.map((st) => `On abaisse le ${st.brought} : ${st.part} est plus petit que ${divisor}, on écrit 0 au quotient.`).join(' ');
}

// ---------- Niveau 2 : la division euclidienne posée ----------

export const DIVISION_RULES = [
  'Le plus grand multiple du diviseur qui ne dépasse pas le nombre.',
  'Un chiffre abaissé, un chiffre au quotient, même 0.',
  'Le reste est plus petit que le diviseur.',
];

/** Un quotient et un reste. */
type QR = [number, number];
/** La réponse écrite : « 104 reste 3 », le reste lié à son mot (espace insécable) : « reste » et 3 ne se séparent pas. */
const qr = ([q, r]: QR): string => `${fmt(q)} reste\u00a0${r}`;
const compareQR = (a: QR, b: QR) => a[0] - b[0] || a[1] - b[1];
const hasZero = (q: number) => String(q).includes('0');

/** Division euclidienne d’un nombre à trois chiffres par un nombre à un chiffre ; un 0 au quotient une fois sur deux. */
export const euclidPosed: ItemGenerator = (rng) => {
  // Tiré une fois : un quotient avec un 0 est plus rare, on le cherche jusqu’à le trouver.
  const zero = rng() < 0.5;
  return draw('de division', (): ExerciseItem | undefined => {
    const d = randomInt(3, 9, rng);
    const q = randomInt(Math.ceil(100 / d), Math.floor(999 / d), rng);
    // Le reste nul une fois sur huit environ : une division qui tombe juste se reconnaît aussi.
    const r = rng() < 1 / 8 ? 0 : randomInt(1, d - 1, rng);
    const n = d * q + r;
    if (hasZero(q) !== zero || n > 999 || n < 100) return undefined;
    const steps = divisionSteps(String(n), '', d);
    const short = Math.floor(n / 10);
    const digits = String(q);
    // Le 0 oublié au quotient : toujours proposé quand le quotient a un 0.
    const zeroForgotten: QR | undefined = zero ? [Number(digits.replaceAll('0', '')), r] : undefined;
    const traps: QR[] = [
      // Le reste plus grand que le diviseur : on s’arrête un cran trop tôt à la dernière étape.
      ...(q % 10 >= 1 ? [[q - 1, r + d] as QR] : []),
      // Le produit qui dépasse : on prend le multiple le plus proche, au-dessus, et on soustrait à l’envers.
      ...(r > 0 && q % 10 <= 8 ? [[q + 1, d - r] as QR] : []),
      // Le dernier chiffre pas abaissé : la division s’arrête avant la fin.
      ...(short >= d ? [[Math.floor(short / d), short % d] as QR] : []),
    ];
    // Voisins : une erreur de soustraction sur le reste, un de plus ou un de moins ; puis une erreur de table sur le
    // dernier chiffre du quotient, le reste gardé. Aucun ne vérifie la division : d × q + r ne redonne pas le dividende.
    const slips: QR[] = [
      ...(r >= 1 ? [[q, r - 1] as QR] : []),
      ...(r + 1 < d ? [[q, r + 1] as QR] : []),
      [q - 1, r],
      [q + 1, r],
    ];
    const first = steps[0].part;
    const picked = rangeChoices<QR>([q, r], traps, slips, compareQR, rng, zeroForgotten);
    if (!picked) return undefined;
    const choices = picked.map(qr);
    return {
      key: `div-${n}-${d}`,
      prompt: `${n} ÷ ${d} : quotient et reste ?`,
      spoken: `${n} divisé par ${d} : quel est le quotient, et quel est le reste ?`,
      choices,
      answer: qr([q, r]),
      hint: `Dans ${first}, combien de fois ${d} ? Puis abaisse le chiffre suivant.`,
      // Le résultat d’abord, puis la seule étape où se fait l’erreur : le 0 au quotient, sinon le reste.
      explanation: `Quotient ${q}, reste ${r}. ${sayZeroSteps(steps, d) ?? (r === 0 ? 'Le reste est 0 : la division tombe juste.' : `Le reste, ${r}, est plus petit que ${d} : la division est finie.`)}`,
      figure: { kind: 'long-division', props: { dividend: String(n), divisor: String(d), remainder: true } },
      aid: card('Division posée', DIVISION_RULES),
    };
  });
};

// ---------- Niveau 3 : diviser un nombre décimal par un entier ----------

export const DECIMAL_DIVISION_RULES = [
  'Divise d’abord la partie entière.',
  'Tu abaisses les dixièmes : virgule au quotient.',
  'Un chiffre abaissé, un chiffre au quotient, même 0.',
];

/**
 * L’étape de la virgule, dite en une ou deux phrases : la partie entière plus petite que le diviseur (0, puis la
 * virgule), sinon le chiffre des dixièmes abaissé ; et le 0 écrit après la virgule, s’il y en a un.
 */
export function sayCommaStep(steps: DivisionStep[], divisor: number): string {
  const comma = steps.findIndex((st) => st.comma);
  if (comma < 0) throw new Error('sayCommaStep : une division sans chiffre après la virgule.');
  const at = steps[comma];
  const first =
    steps[0].times === 0
      ? `${steps[0].part} est plus petit que ${divisor} : on écrit 0, puis la virgule au quotient.`
      : `On abaisse le ${at.brought} des dixièmes : on écrit la virgule au quotient.`;
  const zero = steps.slice(comma).find((st) => st.times === 0);
  return zero ? `${first} ${zero.part} est plus petit que ${divisor} : on écrit 0 après la virgule.` : first;
}

/** Division exacte d’un décimal (moins de 100, un ou deux chiffres après la virgule) par un nombre à un chiffre. */
export const decimalDivision: ItemGenerator = (rng) =>
  draw('de division décimale', (): ExerciseItem | undefined => {
    const d = randomInt(2, 9, rng);
    const places = rng() < 0.5 ? 1 : 2;
    const scale = 10 ** places;
    // Le quotient, en dixièmes ou en centièmes : 36 pour 3,6 ; 306 pour 3,06 (un 0 après la virgule une fois sur deux).
    const q =
      places === 1 ? notRound(2, 99, rng) : rng() < 0.5 ? randomInt(1, 9, rng) * 100 + randomInt(1, 9, rng) : notRound(101, 999, rng);
    const n = q * d;
    // Le dividende garde ses chiffres après la virgule (14,4, pas 10) et reste sous 100.
    if (n % 10 === 0 || n >= 100 * scale) return undefined;
    const [whole, decimals] = [String(Math.floor(n / scale)), String(n % scale).padStart(places, '0')];
    const wholeQ = Math.floor(n / scale / d);
    const decimalsQ = Math.floor((n % scale) / d);
    // Le 0 oublié après la virgule (3,6 pour 3,06) : toujours proposé quand le quotient a un 0 aux dixièmes.
    const zeroForgotten = places === 2 && Math.floor(q / 10) % 10 === 0 ? Math.floor(q / 100) * 100 + (q % 10) * 10 : undefined;
    const traps = [
      // La virgule oubliée : 36 pour 3,6.
      q * scale,
      // La partie entière et les chiffres après la virgule divisés à part, le reste des unités perdu : 14,4 ÷ 4 donne
      // 3 et 1, écrit 3,1 ; 8,54 ÷ 7 donne 1 et 7, écrit 1,7.
      // En centièmes ou en dixièmes, sans passer par un nombre à virgule : 1,7 → 170.
      ...(Number(whole) % d !== 0 && decimalsQ >= 1 ? [wholeQ * scale + decimalsQ * 10 ** (places - String(decimalsQ).length)] : []),
      // La virgule mal placée, un rang trop à droite ou trop à gauche.
      q * 10,
      q / 10,
    ];
    // Voisins : un dixième ou un centième de plus ou de moins, le dernier chiffre du quotient.
    const values = rangeChoices(q, traps, neighbours(q, 1), byValue, rng, zeroForgotten);
    if (!values) return undefined;
    const x = n / scale;
    const steps = divisionSteps(whole, decimals, d);
    const hint =
      Number(whole) < d
        ? `${whole} est plus petit que ${d} : écris 0, puis la virgule, et abaisse le chiffre des dixièmes.`
        : `Divise d’abord ${whole}. Quand tu abaisses le chiffre des dixièmes, écris la virgule au quotient.`;
    return {
      key: `divdec-${n}-${places}-${d}`,
      prompt: `${fmt(x)} ÷ ${d} = …`,
      spoken: `${sayDecimal(x)} divisé par ${d}, combien ?`,
      choices: values.map((v) => fmt(v / scale)),
      answer: fmt(q / scale),
      hint,
      explanation: `${fmt(x)} divisé par ${d} égale ${fmt(q / scale)}. ${sayCommaStep(steps, d)}`,
      figure: { kind: 'long-division', props: { dividend: fmt(x), divisor: String(d) } },
      aid: card('Diviser un nombre décimal', DECIMAL_DIVISION_RULES),
    };
  });

// ---------- La mission ----------

const COLONNES_1 = 'Calcule l’opération posée, sans oublier les retenues.';
const COLONNES_2 = 'Pose la division : trouve le quotient et le reste.';
const COLONNES_3 = 'Divise : quand tu abaisses les dixièmes, écris la virgule au quotient.';

// La récompense des missions de la Rivière (6e) : 12 XP.
const define = (level: number, instruction: string, generators: ItemGenerator[]): ExerciseDef =>
  defineData({ biome: 'riviere', type: 'colonnes', level, instruction, generators, block: 'galet', xp: 12 });

/** Galets en colonnes, quatrième mission de la Rivière des fractions. */
export const POSEES_EXERCISES: ExerciseDef[] = [
  define(1, COLONNES_1, [subtractPosed, multiplyPosed, addDecimals]),
  define(2, COLONNES_2, [euclidPosed]),
  define(3, COLONNES_3, [decimalDivision]),
];
