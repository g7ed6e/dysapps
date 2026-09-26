// La place de la bonne réponse parmi les choix : jamais prévisible. Un élève retient vite « c'est le premier bouton »
// ou « c'est toujours le deuxième nombre ». Sur une série de questions, on vise pour la bonne réponse chaque place
// autant de fois (à un près), dans un ordre tiré au hasard.
// - Des mots : la bonne réponse va à sa place, les autres choix sont mélangés autour.
// - Des nombres : ils restent rangés dans l'ordre croissant (règle dys : on compare, on ne cherche pas). Des entiers
//   qui se suivent (« 2, 3, 4 syllabes ») forment une fenêtre qu'on décale (1-2-3, 2-3-4, 3-4-5). Sinon, on fait passer
//   un piège de l'autre côté de la réponse, à la même distance (réponse 56, piège 54 → 58), jusqu'à la place visée.

type Rng = () => number;
type Choice = string | number;

interface WithChoices {
  choices?: unknown;
  answer?: unknown;
}

export function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Parsed {
  value: number;
  decimals: number;
  unit: string;
}

/** « −1 200,5 cm » → { value: -1200.5, decimals: 1, unit: ' cm' } ; undefined si ce n'est pas un nombre. */
function parseNumber(c: Choice): Parsed | undefined {
  if (typeof c === 'number') return Number.isFinite(c) ? { value: c, decimals: (String(c).split('.')[1] ?? '').length, unit: '' } : undefined;
  const m = /^\s*([-−]?)(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d+))?([^\d/]*)$/.exec(c);
  if (!m) return undefined;
  const value = Number(`${m[1] ? '-' : ''}${m[2].replace(/\D/g, '')}.${m[3] ?? '0'}`);
  return { value, decimals: (m[3] ?? '').length, unit: m[4] };
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
function placeNumber(choices: Choice[], parsed: Parsed[], at: number, target: number, rng: Rng): Choice[] {
  const values = parsed.map((p) => p.value);
  const answer = values[at];
  const unit = parsed[0].unit;
  // Des entiers qui se suivent : on décale la fenêtre, sans descendre sous 1 (pas de « 0 syllabe »).
  if (parsed.every((p) => p.decimals === 0) && values.every((v, i) => i === 0 || v === values[i - 1] + 1)) {
    const start = Math.max(Math.min(1, values[0]), answer - target);
    return values.map((_, i) => formatLike(start + i, choices, unit, 0));
  }
  const decimals = Math.max(...parsed.map((p) => p.decimals));
  const round = (v: number) => Number(v.toFixed(decimals));
  const allowNegative = values.some((v) => v < 0);
  const allowZero = allowNegative || values.some((v) => v === 0);
  const next = [...values];
  const valid = (v: number) => (allowNegative || v > 0 || (allowZero && v === 0)) && v !== answer && !next.includes(v);
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
    const candidate = shuffled(
      next.filter((v) => (below > target ? v < answer : v > answer)),
      rng,
    ).find((v) => mirror(v) !== undefined);
    if (candidate === undefined) break;
    next[next.indexOf(candidate)] = mirror(candidate)!;
  }
  if (next.every((v, i) => v === values[i])) return choices;
  return [...next].sort((a, b) => a - b).map((v) => (v === answer ? choices[at] : formatLike(v, choices, unit, decimals)));
}

/** Les choix d'une question, la bonne réponse visée à la place `target`. */
export function placeAnswer(choices: Choice[], answer: unknown, target: number, rng: Rng): Choice[] {
  const at = choices.findIndex((c) => String(c) === String(answer));
  const parsed = choices.map(parseNumber);
  if (parsed.every((p): p is Parsed => p !== undefined && p.unit === parsed[0]!.unit)) {
    // Une liste de nombres que l'auteur n'a pas rangée reste telle quelle.
    return at >= 0 && sorted(parsed.map((p) => p.value)) ? placeNumber(choices, parsed, at, target, rng) : choices;
  }
  if (at < 0) return shuffled(choices, rng);
  const others = shuffled(
    choices.filter((_, i) => i !== at),
    rng,
  );
  others.splice(Math.min(target, others.length), 0, choices[at]);
  return others;
}

/** Une série de questions, la bonne réponse de chacune à une place tirée au hasard, les places réparties. */
export function placeChoices<T extends object>(list: readonly T[], rng: Rng): T[] {
  const items = list as readonly (T & WithChoices)[];
  const sizes = items.map((item) => (Array.isArray(item.choices) && item.choices.length >= 2 ? item.choices.length : 0));
  const targets = new Map<number, number[]>();
  for (const n of new Set(sizes)) {
    if (n === 0) continue;
    const count = sizes.filter((s) => s === n).length;
    const places: number[] = [];
    while (places.length < count) places.push(...shuffled([...Array(n).keys()], rng));
    targets.set(n, shuffled(places.slice(0, count), rng));
  }
  return items.map((item, i) => {
    const n = sizes[i];
    if (n === 0) return item;
    return { ...item, choices: placeAnswer(item.choices as Choice[], item.answer, targets.get(n)!.shift()!, rng) };
  });
}
