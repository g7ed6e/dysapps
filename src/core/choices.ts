// La place de la bonne réponse parmi les choix : jamais prévisible. Un élève retient vite « c'est le premier bouton »
// ou « c'est toujours le deuxième nombre ». Sur une série de questions, on vise pour la bonne réponse chaque place
// autant de fois (à un près), dans un ordre tiré au hasard.
// - Des mots : la bonne réponse va à sa place, les autres choix sont mélangés autour.
// - Des nombres : ils restent rangés dans l'ordre croissant (règle dys : on compare, on ne cherche pas). Des entiers
//   qui se suivent (« 2, 3, 4 syllabes ») forment une fenêtre qu'on décale (1-2-3, 2-3-4, 3-4-5). Sinon, on fait passer
//   un piège de l'autre côté de la réponse, à la même distance (réponse 56, piège 54 → 58), jusqu'à la place visée.
// - Des heures « H h MM » : rangées dans l'ordre de la journée, sans heure piège inventée. La réponse a donc la place
//   de son rang, toujours la même d'une partie à l'autre : la place visée ne s'applique pas.
// - Une date ou un nombre qui ne commence pas la chaîne (« le 20 juin ») est un mot : on n'invente pas de « 38 juin ».

import { shuffle } from './random';

type Rng = () => number;
type Choice = string | number;

interface WithChoices {
  choices?: unknown;
  answer?: unknown;
}

/** Les règles d'un tirage de réponses chiffrées (voir `drawChoices`). */
export interface DrawOptions {
  /** L'écart d'un voisin (1 pour des entiers, 100 pour des millièmes quand on vise le dixième…). */
  step?: number;
  /** Un piège acceptable (positif, pas une cote déjà affichée…). */
  ok?: (t: number) => boolean;
  /** Un voisin acceptable ; par défaut, comme un piège. */
  neighborOk?: (t: number) => boolean;
  /**
   * `false` : aucun voisin (10⁵ n'a pas de « voisin » plausible, 100 001 n'est pas une erreur d'élève). La place de la
   * réponse est alors tirée parmi celles que les pièges permettent.
   */
  neighbors?: boolean;
}

/**
 * La bonne réponse et trois pièges, rangés dans l'ordre croissant, la place de la réponse tirée au hasard (1re à
 * 4e) : on prend dans le vivier des vrais pièges autant de pièges plus petits que la place le demande, et les autres
 * plus grands. S'il en manque d'un côté, on y met des voisins proches (un, deux ou trois crans de `step`), puis, s'il
 * le faut, les pièges restants de l'autre côté. Aucun piège n'est inventé loin de la réponse.
 * Pour les exercices générés, qui gardent ces choix tels quels pendant la partie (voir `game/exercises/shuffle.ts`).
 */
export function drawChoices(
  answer: number,
  traps: readonly number[],
  rng: Rng,
  { step = 1, ok = () => true, neighborOk = ok, neighbors = true }: DrawOptions = {},
): number[] {
  // Arrondi qui efface les erreurs de virgule flottante (0,1 × 3).
  const clean = (v: number) => Number(v.toFixed(6));
  const pool = [...new Set(traps.map(clean))].filter((t) => Number.isFinite(t) && t !== answer && ok(t));
  const below = shuffle(
    pool.filter((t) => t < answer),
    rng,
  );
  const above = shuffle(
    pool.filter((t) => t > answer),
    rng,
  );
  // Sans voisins, une place que les pièges permettent d'atteindre.
  const lo = neighbors ? 0 : Math.max(0, 3 - above.length);
  const hi = neighbors ? 3 : Math.max(lo, Math.min(3, below.length));
  const wanted = lo + Math.floor(rng() * (hi - lo + 1));
  const picked = [...below.slice(0, wanted), ...above.slice(0, 3 - wanted)];
  const accepted = neighbors ? neighborOk : () => false;
  const add = (t: number, accept: (t: number) => boolean) => {
    if (picked.length < 3 && Number.isFinite(t) && t !== answer && !picked.includes(t) && accept(t)) picked.push(t);
  };
  const missing = (side: number) =>
    side < 0 ? wanted - picked.filter((t) => t < answer).length : 3 - wanted - picked.filter((t) => t > answer).length;
  // Le côté voulu d'abord : des voisins proches.
  for (const side of [-1, 1]) for (let d = 1; d <= 3 && missing(side) > 0; d++) add(clean(answer + side * d * step), accepted);
  // Puis les vrais pièges restants, de l'autre côté ; en dernier recours, des voisins un peu plus loin.
  for (const t of [...below.slice(wanted), ...above.slice(3 - wanted)]) add(t, () => true);
  for (let d = 1; picked.length < 3 && d <= 50; d++) for (const side of [-1, 1]) add(clean(answer + side * d * step), accepted);
  return [answer, ...picked].sort((a, b) => a - b);
}

export interface Parsed {
  value: number;
  decimals: number;
  unit: string;
}

/** « −1 200,5 cm » → { value: -1200.5, decimals: 1, unit: ' cm' } ; undefined si ce n'est pas un nombre. */
export function parseNumber(c: Choice): Parsed | undefined {
  if (typeof c === 'number') return Number.isFinite(c) ? { value: c, decimals: (String(c).split('.')[1] ?? '').length, unit: '' } : undefined;
  const m = /^\s*([-−]?)(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d+))?((?:[^\d/][^\d]*)?)$/.exec(c);
  if (!m) return undefined;
  const value = Number(`${m[1] ? '-' : ''}${m[2].replace(/\D/g, '')}.${m[3] ?? '0'}`);
  return { value, decimals: (m[3] ?? '').length, unit: m[4] };
}

/** « 3/5 » → 0,6, « 2 » → 2 ; undefined si ce n'est ni une fraction ni un entier. */
export function parseFraction(c: Choice): number | undefined {
  const m = /^\s*(\d+)(?:\/(\d+))?\s*$/.exec(String(c));
  return m && m[2] !== '0' ? Number(m[1]) / Number(m[2] ?? 1) : undefined;
}

/** Écrit un nombre comme ses voisins : même signe moins, même séparateur de milliers, même virgule, même unité. */
function formatLike(value: number, sample: Choice[], unit: string, decimals: number): Choice {
  if (typeof sample[0] === 'number') return value;
  const text = sample.join(' ');
  const minus = text.includes('−') ? '−' : '-';
  const comma = /\d\.\d/.test(text) ? '.' : ',';
  const thousands = /\d([   ])\d{3}(?!\d)/.exec(text)?.[1];
  const [int, dec] = Math.abs(value).toFixed(decimals).split('.');
  const grouped = thousands && int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) : int;
  const trimmed = dec?.replace(/0+$/, '');
  return `${value < 0 ? minus : ''}${grouped}${trimmed ? comma + trimmed : ''}${unit}`;
}

function sorted(values: number[]): boolean {
  return values.every((v, i) => i === 0 || v > values[i - 1]);
}

/** Des nombres rangés : la réponse amenée à la place `target` (ou au plus près), la liste toujours croissante. */
function placeNumber(choices: Choice[], parsed: Parsed[], at: number, target: number, rng: Rng, pieges: Pieges): Choice[] {
  const values = parsed.map((p) => p.value);
  const answer = values[at];
  const unit = parsed[0].unit;
  // Des entiers qui se suivent : on décale la fenêtre, sans descendre sous 1 (pas de « 0 syllabe »).
  if (parsed.every((p) => p.decimals === 0) && values.every((v, i) => i === 0 || v === values[i - 1] + 1)) {
    const start = Math.max(Math.min(1, values[0]), answer - target);
    return values.map((_, i) => formatLike(start + i, choices, unit, 0));
  }
  // Des pièges écrits exprès (13 contre 30, à l'oreille) : on ne les remplace pas par des nombres calculés.
  if (pieges === 'du-fichier') return choices;
  const decimals = Math.max(...parsed.map((p) => p.decimals));
  const round = (v: number) => Number(v.toFixed(decimals));
  const allowNegative = values.some((v) => v < 0);
  const allowZero = allowNegative || values.some((v) => v === 0);
  // Une unité qui est un nom au pluriel (« caisses ») : pas de « 1 caisses ».
  const countNoun = /\p{L}{3,}s$/u.test(unit.trim());
  const next = [...values];
  const valid = (v: number) =>
    (allowNegative || v > 0 || (allowZero && v === 0)) && !(countNoun && Math.abs(v) <= 1) && v !== answer && !next.includes(v);
  const step = 10 ** -decimals;
  /** Le piège passé de l'autre côté : à la même distance, sinon un cran plus loin, sinon au rapport inverse (×2 → ÷2). */
  const mirror = (v: number): number | undefined => {
    const away = v > answer ? -1 : 1;
    const additive = [0, 1, 2, 3].map((k) => round(2 * answer - v + away * k * step));
    const ratio = answer > 0 && v > 0 ? [round((answer * answer) / v)] : [];
    return [...additive, ...ratio].find((m) => (v > answer ? m < answer : m > answer) && valid(m));
  };
  for (let guard = 0; guard < choices.length; guard++) {
    const below = next.filter((v) => v < answer).length;
    if (below === target) break;
    // Trop de pièges sous la réponse : on en fait passer un au-dessus (et inversement).
    const candidate = shuffle(
      next.filter((v) => (below > target ? v < answer : v > answer)),
      rng,
    ).find((v) => mirror(v) !== undefined);
    if (candidate === undefined) break;
    next[next.indexOf(candidate)] = mirror(candidate)!;
  }
  if (next.every((v, i) => v === values[i])) return choices;
  return [...next].sort((a, b) => a - b).map((v) => (v === answer ? choices[at] : formatLike(v, choices, unit, decimals)));
}

/** « 9 h 45 » → 585 (minutes depuis minuit) ; undefined si ce n'est pas une heure écrite « H h MM ». */
export function parseHour(c: Choice): number | undefined {
  const m = /^(\d{1,2}) h (\d{2})$/.exec(String(c));
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
}

/**
 * Comment traiter une liste de nombres rangés : `calcules` fait passer un piège de l'autre côté de la réponse (un
 * calcul, où tout nombre voisin est un piège plausible) ; `du-fichier` garde les pièges écrits, et la réponse la
 * place de son rang (des nombres entendus, où le piège est le nombre qui sonne pareil).
 */
export type Pieges = 'calcules' | 'du-fichier';

/** Les choix d'une question, la bonne réponse visée à la place `target` (sauf des heures : la place de leur rang). */
export function placeAnswer(choices: Choice[], answer: unknown, target: number, rng: Rng, pieges: Pieges = 'calcules'): Choice[] {
  const at = choices.findIndex((c) => String(c) === String(answer));
  // Des heures (« 9 h 45 ») : rangées dans l'ordre de la journée, comme des nombres ; on n'invente pas d'heure piège,
  // la réponse garde donc la place que lui donne ce rang.
  const hours = choices.map(parseHour);
  if (hours.every((h): h is number => h !== undefined)) {
    return choices.map((c, i) => [c, hours[i]] as const).sort((a, b) => a[1] - b[1]).map(([c]) => c);
  }
  // Des fractions (« 3/5 », « 3/10 », « 3 ») : rangées comme des nombres, sans fraction piège inventée.
  const fractions = choices.map(parseFraction);
  if (choices.some((c) => String(c).includes('/')) && fractions.every((f): f is number => f !== undefined)) {
    return choices.map((c, i) => [c, fractions[i]] as const).sort((a, b) => a[1] - b[1]).map(([c]) => c);
  }
  const parsed = choices.map(parseNumber);
  if (parsed.every((p): p is Parsed => p !== undefined && p.unit === parsed[0]!.unit)) {
    // Une liste de nombres que l'auteur n'a pas rangée reste telle quelle.
    return at >= 0 && sorted(parsed.map((p) => p.value)) ? placeNumber(choices, parsed, at, target, rng, pieges) : choices;
  }
  if (at < 0) return shuffle(choices, rng);
  const others = shuffle(
    choices.filter((_, i) => i !== at),
    rng,
  );
  others.splice(Math.min(target, others.length), 0, choices[at]);
  return others;
}

/** Une série de questions, la bonne réponse de chacune à une place tirée au hasard, les places réparties. */
export function placeChoices<T extends object>(list: readonly T[], rng: Rng, pieges: Pieges = 'calcules'): T[] {
  const items = list as readonly (T & WithChoices)[];
  const sizes = items.map((item) => (Array.isArray(item.choices) && item.choices.length >= 2 ? item.choices.length : 0));
  const targets = new Map<number, number[]>();
  for (const n of new Set(sizes)) {
    if (n === 0) continue;
    const count = sizes.filter((s) => s === n).length;
    const places: number[] = [];
    while (places.length < count) places.push(...shuffle([...Array(n).keys()], rng));
    targets.set(n, shuffle(places.slice(0, count), rng));
  }
  return items.map((item, i) => {
    const n = sizes[i];
    if (n === 0) return item;
    return { ...item, choices: placeAnswer(item.choices as Choice[], item.answer, targets.get(n)!.shift()!, rng, pieges) };
  });
}
