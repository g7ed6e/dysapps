import {
  BETWEEN_RULES,
  FRAME_RULES,
  ORDER_RULES,
  READ_RULES,
  VOLCAN_EXERCISES,
  WRITE_RULES,
  classesOf,
  countRules,
  inWords,
  rankName,
} from './volcan';
import { pourLaVoix } from '../../core/speech';
import type { ExerciseItem } from './types';

/** « 1 081 » ou « 3,06 » → 1081 ou 3.06. */
const num = (c: string) => Number(c.replace(/[\s  ]/g, '').replace(',', '.'));
/** « 3,06 » → 306 centièmes, sans erreur d’arrondi. */
const cents = (c: string) => Math.round(num(c) * 100);
const byId = (id: string) => VOLCAN_EXERCISES.find((d) => d.id === id)!;
const runs = (id: string, count = 200): ExerciseItem[] => {
  const def = byId(id);
  return Array.from({ length: count }, (_, s) => def.generate!(`${def.id}#volcan${s}`)).flat();
};
/** Les rangements : « 3,12 ; 3,45 ; 3,5 », l’espace insécable avant « ; », une espace demi-cadratin après. */
const SEP = '\u00a0;\u2002';
const rule = (item: ExerciseItem) => item.aid as { kind: string; props: { title: string; lines: string[] } };

/** Ce que tous les items respectent : quatre choix différents dont la réponse, lus sans symbole, la règle affichée. */
function common(item: ExerciseItem, count = 4): string[] {
  const list = (item.choices as string[]).map(String);
  expect(list, String(item.prompt)).toHaveLength(count);
  expect(new Set(list).size).toBe(count);
  expect(list).toContain(item.answer);
  expect(String(item.spoken), String(item.spoken)).not.toMatch(/[/×÷−+=…<>]|\d,\d/);
  expect(String(item.spoken)).not.toContain('…');
  // Pas de virgule de ponctuation juste après un nombre à virgule (« 3,5, c’est ») ni entre deux nombres (« 15, 4 fois »).
  expect(String(item.explanation)).not.toMatch(/\d,\d+,|\d, \d/);
  // L’indice est lu à voix haute : pas de nombre écrit avec l’espace des milliers.
  expect(String(item.hint)).not.toMatch(/\d[\s  ]\d/);
  expect(String(item.hint)).not.toBe('');
  for (const text of [item.prompt, item.hint, item.explanation, ...list]) expect(String(text)).not.toMatch(/'/);
  expect(rule(item).kind).toBe('rule-card');
  expect(JSON.parse(JSON.stringify(item))).toEqual(item);
  return list;
}

it('six exercices de huit items, une consigne sans symbole, la récompense des maths de 6e', () => {
  expect(VOLCAN_EXERCISES.map((d) => d.id)).toEqual(['maths-6e-decimals-operations-2', 'maths-6e-decimals-operations-3', 'maths-6e-decimals-scale-3', 'maths-6e-decimals-large-numbers-1', 'maths-6e-decimals-large-numbers-2', 'maths-6e-decimals-large-numbers-3']);
  for (const def of VOLCAN_EXERCISES) {
    expect(def.biome).toBe('maths-6e-decimals');
    expect(def.items).toHaveLength(8);
    expect(def.instruction).not.toMatch(/[/×÷=…+−'<>]/);
    expect(def.reward).toEqual({ block: 'maths-6e-decimals', amount: 4, xp: 12 });
  }
  // Les cartes ne donnent aucun exemple chiffré (le 0 à écrire n’en est pas un) : jamais un item recopié.
  for (const line of [READ_RULES, WRITE_RULES, ORDER_RULES, BETWEEN_RULES, FRAME_RULES, countRules('milliers')].flat()) expect(line).not.toMatch(/[1-9]|\d\d|\d,/);
});

it('les nombres en lettres : les accords de cent, vingt, mille, million et milliard', () => {
  const cases: [number, string][] = [
    [21, 'vingt et un'],
    [71, 'soixante et onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [91, 'quatre-vingt-onze'],
    [101, 'cent un'],
    [200, 'deux cents'],
    [280, 'deux cent quatre-vingts'],
    [1000, 'mille'],
    [21000, 'vingt et un mille'],
    [80000, 'quatre-vingt mille'],
    [200000, 'deux cent mille'],
    [1000000, 'un million'],
    [2040600, 'deux millions quarante mille six cents'],
    [80000000, 'quatre-vingts millions'],
    [200000000, 'deux cents millions'],
    [1000000000, 'un milliard'],
    [3000500000, 'trois milliards cinq cent mille'],
  ];
  for (const [n, words] of cases) expect(inWords(n), String(n)).toBe(words);
  expect(classesOf(2040600)).toEqual([600, 40, 2]);
  expect([3, 5, 6, 8].map(rankName)).toEqual(['unités de mille', 'centaines de mille', 'unités de millions', 'centaines de millions']);
});

it('Nombres géants, niveau 1 : le chiffre d’un rang, dans le tableau par classes, les classes mal découpées en piège', () => {
  let neighbourClass = 0;
  let milliards = 0;
  for (const item of runs('maths-6e-decimals-large-numbers-1')) {
    const list = common(item);
    const m = /^Dans ([\d\u00a0]+), quel est le chiffre des (.+) \?$/.exec(String(item.prompt))!;
    expect(m, String(item.prompt)).toBeTruthy();
    const digits = m[1].replace(/\D/g, '');
    expect(pourLaVoix(String(item.spoken))).toContain(` ${digits},`);
    const i = [...Array(digits.length).keys()].find((k) => rankName(k) === m[2])!;
    expect(i).toBeGreaterThanOrEqual(3);
    const at = (k: number) => digits[digits.length - 1 - k];
    expect(item.answer).toBe(at(i));
    expect(new Set(digits).size).toBe(digits.length);
    expect(list).toEqual([...list].sort());
    if (list.includes(at(i - 3))) neighbourClass++;
    if (digits.length === 10) milliards++;
    expect(String(item.explanation)).toMatch(new RegExp(`^Le chiffre des ${m[2]} est ${item.answer}\\. La classe des `));
    expect(item.figure).toEqual({ kind: 'class-table', props: { value: digits } });
    expect(rule(item).props.lines).toEqual(READ_RULES);
  }
  expect(neighbourClass).toBeGreaterThan(1000);
  // Jusqu’aux milliards : un nombre de dix chiffres une fois sur quatre environ.
  expect(milliards).toBeGreaterThan(250);
});

it('Nombres géants, niveau 2 : écrire en chiffres, les classes en lettres dans le tableau, le 0 oublié proposé, chaque place autant', () => {
  const places = [0, 0, 0, 0];
  for (const item of runs('maths-6e-decimals-large-numbers-2')) {
    const list = common(item);
    const words = /^Écris en chiffres : (.+)\.$/.exec(String(item.prompt))![1];
    expect(String(item.spoken)).toBe(`Écris en chiffres : ${words}.`);
    const n = num(String(item.answer));
    // La réponse se relit en lettres comme l’énoncé : une seule écriture juste.
    expect(inWords(n)).toBe(words);
    expect(list.map(num).filter((v) => inWords(v) === words)).toHaveLength(1);
    expect(list.map(num)).toEqual([...list.map(num)].sort((a, b) => a - b));
    const classes = classesOf(n);
    expect(classes).toHaveLength(3);
    // Les 0 oubliés dans toutes les classes : proposés à chaque item où la réponse n’est pas première.
    const forgotten = classes
      .map((v, cls) => (cls === classes.length - 1 ? String(v) : v === 0 ? '' : String(v)))
      .reverse()
      .join('');
    const place = list.indexOf(String(item.answer));
    places[place]++;
    if (place > 0) expect(list.map(num), String(item.prompt)).toContain(Number(forgotten));
    const shown = (item.figure as { props: { words: string[] } }).props.words;
    expect(shown).toHaveLength(classes.length);
    expect(String(item.explanation)).toMatch(new RegExp(`^On écrit ${item.answer}\\. (La classe des \\S+ est vide : on y écrit 000\\.|Dans la classe des \\S+, .+ s’écrit \\d{3}\\.)$`));
    expect(rule(item).props.lines).toEqual(WRITE_RULES);
  }
  for (const p of places) expect(p / 1600).toBeGreaterThan(0.2);
  for (const p of places) expect(p / 1600).toBeLessThan(0.3);
});

it('Nombres géants, niveau 3 : le nombre de dizaines, de centaines, de milliers ou de millions, le chiffre en piège', () => {
  const units: Record<string, number> = { dizaines: 1, centaines: 2, milliers: 3, millions: 6 };
  let digitTrap = 0;
  for (const item of runs('maths-6e-decimals-large-numbers-3')) {
    const list = common(item);
    const m = /^Combien de (\S+) y a-t-il dans ([\d\u00a0]+) \?$/.exec(String(item.prompt))!;
    expect(m, String(item.prompt)).toBeTruthy();
    const n = num(m[2]);
    const answer = Math.floor(n / 10 ** units[m[1]]);
    expect(num(String(item.answer))).toBe(answer);
    expect(answer).toBeGreaterThanOrEqual(10);
    expect(list.map(num)).toEqual([...list.map(num)].sort((a, b) => a - b));
    if (list.map(num).includes(answer % 10)) digitTrap++;
    expect(rule(item).props).toEqual({ title: `Combien de ${m[1]} ?`, lines: countRules(m[1]) });
    expect(String(item.choices)).not.toContain('\u202f');
  }
  expect(digitTrap).toBeGreaterThan(400);
});

it('Coulée de lave, niveau 2 : ranger trois décimaux, trois rangements, la lecture en entiers et l’envers toujours proposés', () => {
  const places = [0, 0, 0];
  for (const item of runs('maths-6e-decimals-operations-2')) {
    const list = common(item, 3);
    const shown = /^Range du plus petit au plus grand : (.+)$/.exec(String(item.prompt))![1].split(SEP);
    const sorted = [...shown].sort((a, b) => cents(a) - cents(b));
    expect(shown).not.toEqual(sorted);
    expect(item.answer).toBe(sorted.join(SEP));
    // « 3,5 ; 3,12 ; 3,45 » : les parties décimales lues comme des entiers (5 < 12 < 45).
    const asInteger = (c: string) => Number(c.split(',')[1]);
    expect(list).toContain([...shown].sort((a, b) => asInteger(a) - asInteger(b)).join(SEP));
    expect(list).toContain([...sorted].reverse().join(SEP));
    places[list.indexOf(String(item.answer))]++;
    expect(item.figure).toEqual({ kind: 'decimal-table', props: { rows: shown.map((c) => cents(c) * 10), padZeros: true } });
    expect(rule(item).props.lines).toEqual(ORDER_RULES);
  }
  for (const p of places) expect(p / 1600).toBeLessThan(0.4);
  for (const p of places) expect(p / 1600).toBeGreaterThan(0.27);
});

it('Coulée de lave, niveau 3 : un seul nombre entre les deux, les pièges lus en entiers', () => {
  let wholeReading = 0;
  for (const item of runs('maths-6e-decimals-operations-3')) {
    const list = common(item);
    const [, a, b] = /^Quel nombre est entre (\S+) et (\S+) \?$/.exec(String(item.prompt))!;
    const inside = list.filter((c) => cents(c) > cents(a) && cents(c) < cents(b));
    expect(inside).toEqual([item.answer]);
    // 2,8 ou 2,69 « entre 7 et 75 » : la partie décimale lue comme un entier.
    const [da, db] = [Number(a.split(',')[1]), Number(b.split(',')[1])];
    if (list.some((c) => c !== item.answer && Number(c.split(',')[1]) > da && Number(c.split(',')[1]) < db)) wholeReading++;
    expect(item.figure).toEqual({ kind: 'decimal-table', props: { rows: [cents(a) * 10, cents(b) * 10], padZeros: true } });
    expect(rule(item).props.lines).toEqual(BETWEEN_RULES);
  }
  expect(wholeReading).toBeGreaterThan(1200);
});

it('Pente graduée, niveau 3 : encadrer une fraction, la droite graduée en parts, l’entier voisin du mauvais côté en piège', () => {
  let wrongSide = 0;
  for (const item of runs('maths-6e-decimals-scale-3')) {
    const list = common(item);
    const [, n, d] = /^(\d+)\/(\d) est entre quels entiers qui se suivent \?$/.exec(String(item.prompt))!.map(Number);
    const q = Math.floor(n / d);
    expect(n % d).not.toBe(0);
    expect(item.answer).toBe(`${q} et ${q + 1}`);
    const lows = list.map((c) => Number(c.split(' ')[0]));
    expect(lows).toEqual([...lows].sort((x, y) => x - y));
    for (const c of list) expect(c).toMatch(/^(\d+) et (\d+)$/);
    if (lows.includes(q - 1) || lows.includes(q + 1)) wrongSide++;
    expect(item.figure).toEqual({ kind: 'graduated-line', props: { start: 0, units: 5, perUnit: d, point: n } });
    expect(String(item.explanation)).toMatch(new RegExp(`^${n} \\S+, c’est entre ${q} et ${q + 1}\\. En effet, `));
    expect(rule(item).props.lines).toEqual(FRAME_RULES);
  }
  expect(wrongSide).toBe(1600);
});
