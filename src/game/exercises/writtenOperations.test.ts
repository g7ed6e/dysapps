import {
  ADD_RULES,
  DECIMAL_DIVISION_RULES,
  DIVISION_RULES,
  MUL_RULES,
  POSEES_EXERCISES,
  SUB_RULES,
  addWithoutCarry,
  divisionSteps,
  sayCommaStep,
  sayZeroSteps,
  subtractFlipped,
  subtractWithoutCarry,
  timesDigitWithoutCarry,
} from './writtenOperations';
import type { ExerciseItem } from './types';

/** « 1 081 » ou « 3,06 » → 1081 ou 3.06. */
const num = (c: string) => Number(c.replace(/[\s  ]/g, '').replace(',', '.'));
const byId = (id: string) => POSEES_EXERCISES.find((d) => d.id === id)!;
const runs = (level: number, count = 200): ExerciseItem[] => {
  const def = byId(`maths-6e-fractions-place-value-${level}`);
  return Array.from({ length: count }, (_, s) => def.generate!(`${def.id}#posee${s}`)).flat();
};

/** La règle de l’item : une carte par opération au niveau 1, celle de la division ensuite. */
const RULES: Record<string, string[]> = {
  '+': ADD_RULES,
  '−': SUB_RULES,
  '×': MUL_RULES,
  '2': DIVISION_RULES,
  '3': DECIMAL_DIVISION_RULES,
};
const ruleOf = (level: number, item: ExerciseItem) =>
  RULES[level === 1 ? (item.figure as { props: { op: string } }).props.op : String(level)];

it('Galets en colonnes : trois niveaux de huit items, une consigne sans symbole, la règle de l’opération affichée à chaque item', () => {
  expect(POSEES_EXERCISES.map((d) => d.id)).toEqual(['maths-6e-fractions-place-value-1', 'maths-6e-fractions-place-value-2', 'maths-6e-fractions-place-value-3']);
  for (const def of POSEES_EXERCISES) {
    expect(def.biome).toBe('maths-6e-fractions');
    expect(def.type).toBe('place-value');
    expect(def.items).toHaveLength(8);
    expect(def.instruction).not.toMatch(/[/×÷=…+−]/);
    expect(def.reward).toEqual({ block: 'maths-6e-fractions', amount: 4, xp: 12 });
    for (const item of def.items) {
      const aid = item.aid as { kind: string; props: { lines: string[] } };
      expect(aid.kind).toBe('rule-card');
      expect(aid.props.lines).toEqual(ruleOf(def.level, item));
      expect(JSON.parse(JSON.stringify(item))).toEqual(item);
    }
  }
  // Les cartes ne donnent aucun exemple chiffré : jamais un item recopié. L’alignement d’abord, au niveau 1.
  for (const line of Object.values(RULES).flat()) expect(line).not.toMatch(/\d\s*[+−×÷=]|\d,\d/);
  for (const rules of [ADD_RULES, SUB_RULES]) expect(rules[0]).toBe('Unités sous unités, virgule sous virgule.');
  expect(ADD_RULES[1]).toBe('Si une colonne fait 10 ou plus : écris les unités, retiens 1 à gauche.');
  expect(MUL_RULES[0]).toBe('Unités sous unités.');
});

it('les erreurs d’élèves se calculent comme ils les font', () => {
  // 12,5 + 3,25 en centièmes, sans retenue : 1 250 + 325.
  expect(addWithoutCarry(1250, 325)).toBe(1575);
  expect(addWithoutCarry(6550, 548)).toBe(6098);
  // 503 − 267 : le petit chiffre ôté du grand (364), la retenue posée en haut mais pas en bas (346).
  expect(subtractFlipped(503, 267)).toBe(364);
  expect(subtractWithoutCarry(503, 267)).toBe(346);
  // 47 × 3 sans retenue : 7 × 3 = 21, on garde 1 ; 4 × 3 = 12.
  expect(timesDigitWithoutCarry(47, 3)).toBe(121);
});

it('la division posée : les étapes, les chiffres abaissés, le 0 au quotient et la virgule', () => {
  expect(divisionSteps('624', '', 6)).toEqual([
    { part: 6, times: 1, rest: 0 },
    { part: 2, times: 0, rest: 2, brought: 2, comma: false },
    { part: 24, times: 4, rest: 0, brought: 4, comma: false },
  ]);
  // Le premier chiffre trop petit : on en prend deux.
  expect(divisionSteps('283', '', 7).map((s) => s.part)).toEqual([28, 3]);
  // La partie entière plus petite que le diviseur : 0, puis la virgule.
  expect(divisionSteps('2', '4', 3)).toEqual([
    { part: 2, times: 0, rest: 2 },
    { part: 24, times: 8, rest: 0, brought: 4, comma: true },
  ]);
  // La correction ne redit que l’étape où se fait l’erreur : le 0 au quotient, la virgule.
  expect(sayZeroSteps(divisionSteps('624', '', 6), 6)).toBe('On abaisse le 2 : 2 est plus petit que 6, on écrit 0 au quotient.');
  expect(sayZeroSteps(divisionSteps('603', '', 6), 6)).toBe(
    'On abaisse le 0 : 0 est plus petit que 6, on écrit 0 au quotient. On abaisse le 3 : 3 est plus petit que 6, on écrit 0 au quotient.',
  );
  expect(sayZeroSteps(divisionSteps('385', '', 6), 6)).toBeUndefined();
  expect(sayCommaStep(divisionSteps('14', '4', 4), 4)).toBe('On abaisse le 4 des dixièmes : on écrit la virgule au quotient.');
  expect(() => sayCommaStep(divisionSteps('624', '', 6), 6)).toThrow();
  expect(sayCommaStep(divisionSteps('2', '4', 3), 3)).toBe('2 est plus petit que 3 : on écrit 0, puis la virgule au quotient.');
  // 6,12 ÷ 2 = 3,06.
  expect(sayCommaStep(divisionSteps('6', '12', 2), 2)).toBe(
    'On abaisse le 1 des dixièmes : on écrit la virgule au quotient. 1 est plus petit que 2 : on écrit 0 après la virgule.',
  );
});

/** Ce que tous les items de la mission respectent : quatre choix différents dont la réponse, lus sans symbole. */
function common(item: ExerciseItem): string[] {
  const list = (item.choices as string[]).map(String);
  expect(list, String(item.prompt)).toHaveLength(4);
  expect(new Set(list).size).toBe(4);
  expect(list).toContain(item.answer);
  expect(String(item.spoken), String(item.spoken)).not.toMatch(/[/×÷−+=…]|\d,\d|\d\s*-/);
  expect(String(item.hint)).not.toBe('');
  // L’indice est lu à voix haute : pas de nombre écrit avec l’espace des milliers.
  expect(String(item.hint)).not.toMatch(/\d[\s\u00a0\u202f]\d/);
  expect(String(item.prompt)).not.toMatch(/'/);
  for (const text of [item.hint, item.explanation]) expect(String(text)).not.toMatch(/'/);
  return list;
}

it('niveau 1 : l’opération posée en colonnes, la réponse calculée, et les pièges des élèves', () => {
  const seen = { noCarry: 0, flipped: 0, noShift: 0, pairwise: 0, split: 0 };
  const ops = { '+': 0, '−': 0, '×': 0 };
  for (const item of runs(1)) {
    const list = common(item);
    const m = /^(\S+) ([+−×]) (\S+) = …$/.exec(String(item.prompt))!;
    expect(m, String(item.prompt)).toBeTruthy();
    const [, x, op, y] = m as unknown as [string, string, '+' | '−' | '×', string];
    ops[op]++;
    const [a, b] = [num(x), num(y)];
    const expected = op === '+' ? Math.round((a + b) * 100) / 100 : op === '−' ? a - b : a * b;
    expect(num(String(item.answer))).toBe(expected);
    expect(String(item.explanation)).toContain(String(item.answer));
    const values = list.map(num);
    expect(values).toEqual([...values].sort((p, q) => p - q));
    for (const v of values) expect(v).toBeGreaterThan(0);
    expect(item.figure).toEqual({ kind: 'column-operation', props: { op, rows: [x, y] } });
    // La multiplication dessine ses deux lignes : la voix dit, comme l’écran, de les poser sur le cahier.
    expect(String(item.spoken)).toMatch(op === '×' ? /, combien \? Pose ces lignes sur ton cahier\.$/ : /, combien \?$/);
    // Un vrai piège au moins est proposé, jamais seulement des voisins.
    let real = 0;
    if (op === '+') {
      const [ca, cb] = [Math.round(a * 100), Math.round(b * 100)];
      const [wa, wb] = [Math.floor(a), Math.floor(b)];
      const tenths = (ca % 100) / 10;
      const cents = cb % 100;
      if (values.includes(addWithoutCarry(ca, cb) / 100)) (seen.noCarry++, real++);
      if (tenths + cents < 100 && values.some((v) => Math.abs(v - (wa + wb + (tenths + cents) / 100)) < 1e-9)) (seen.split++, real++);
    } else if (op === '−') {
      expect(subtractFlipped(a, b)).not.toBe(expected);
      if (values.includes(subtractFlipped(a, b)) || values.includes(subtractWithoutCarry(a, b))) (seen.flipped++, real++);
    } else {
      if (values.includes(a * (b % 10) + a * Math.floor(b / 10))) (seen.noShift++, real++);
      if (values.includes(timesDigitWithoutCarry(a, b % 10) + timesDigitWithoutCarry(a, Math.floor(b / 10)) * 10)) real++;
      if (values.includes(Math.floor(a / 10) * Math.floor(b / 10) * 100 + (a % 10) * (b % 10))) (seen.pairwise++, real++);
    }
    expect(real, String(item.prompt)).toBeGreaterThan(0);
  }
  for (const n of Object.values(ops)) expect(n).toBeGreaterThanOrEqual(400);
  for (const [trap, n] of Object.entries(seen)) expect(n, trap).toBeGreaterThan(100);
});

it('niveau 2 : la division euclidienne posée, quotient et reste, une seule juste, et les pièges des élèves', () => {
  const seen = { zero: 0, tooBig: 0, short: 0, overshoot: 0 };
  let withZero = 0;
  const items = runs(2);
  for (const item of items) {
    const list = common(item);
    const [, n, d] = /^(\d+) ÷ (\d) : quotient et reste \?$/.exec(String(item.prompt))!.map(Number);
    expect(n).toBeGreaterThanOrEqual(100);
    expect(n).toBeLessThanOrEqual(999);
    const [q, r] = [Math.floor(n / d), n % d];
    expect(item.answer).toBe(`${q} reste\u00a0${r}`);
    // Le résultat d’abord, puis l’étape du 0 s’il y en a un, sinon le reste plus petit que le diviseur.
    expect(String(item.explanation)).toMatch(new RegExp(`^Quotient ${q}, reste ${r}\\. `));
    if (String(q).includes('0')) expect(String(item.explanation)).toContain('on écrit 0 au quotient.');
    else if (r > 0) expect(String(item.explanation)).toContain(`Le reste, ${r}, est plus petit que ${d}`);
    expect(String(item.hint)).toBe(`Dans ${divisionSteps(String(n), '', d)[0].part}, combien de fois ${d} ? Puis abaisse le chiffre suivant.`);
    expect(String(item.spoken)).toBe(`${n} divisé par ${d} : quel est le quotient, et quel est le reste ?`);
    expect(item.figure).toEqual({ kind: 'long-division', props: { dividend: String(n), divisor: String(d), remainder: true } });
    const pairs = list.map((c) => /^([\d\s]+?) reste\u00a0(\d+)$/.exec(c)!.slice(1).map((x) => Number(x.replace(/\D/g, ''))));
    // Rangées par quotient, puis par reste ; une seule réponse vérifie n = d × q + r avec r plus petit que d.
    for (let i = 1; i < pairs.length; i++) expect(pairs[i][0] - pairs[i - 1][0] || pairs[i][1] - pairs[i - 1][1]).toBeGreaterThan(0);
    expect(pairs.filter(([pq, pr]) => pq * d + pr === n && pr < d)).toHaveLength(1);
    const has = (pq: number, pr: number) => pairs.some(([a, b]) => a === pq && b === pr);
    // Le 0 oublié, quand le quotient a un 0, est toujours proposé.
    if (String(q).includes('0')) {
      withZero++;
      expect(has(Number(String(q).replaceAll('0', '')), r), String(item.prompt)).toBe(true);
      seen.zero++;
    }
    if (has(q - 1, r + d)) seen.tooBig++;
    if (has(Math.floor(Math.floor(n / 10) / d), Math.floor(n / 10) % d)) seen.short++;
    if (r > 0 && has(q + 1, d - r)) seen.overshoot++;
  }
  // Un 0 au quotient une fois sur deux environ.
  expect(withZero / items.length).toBeGreaterThan(0.4);
  for (const [trap, n] of Object.entries(seen)) expect(n, trap).toBeGreaterThan(100);
});

it('niveau 3 : un décimal divisé par un entier, la division tombe juste, et les pièges des élèves', () => {
  const seen = { noComma: 0, shifted: 0, zero: 0, split: 0 };
  let smallWhole = 0;
  for (const item of runs(3)) {
    const list = common(item);
    const m = /^(\d+),(\d{1,2}) ÷ (\d) = …$/.exec(String(item.prompt))!;
    expect(m, String(item.prompt)).toBeTruthy();
    const [whole, decimals, d] = [m[1], m[2], Number(m[3])];
    const places = decimals.length;
    const n = Number(`${whole}${decimals}`);
    expect(decimals.endsWith('0')).toBe(false);
    expect(n % d).toBe(0);
    const q = n / d;
    const answer = num(String(item.answer));
    expect(Math.round(answer * 10 ** places)).toBe(q);
    expect(String(item.explanation)).toMatch(new RegExp(`^${whole},${decimals} divisé par ${d} égale ${item.answer}\\. `));
    expect(String(item.explanation)).toContain('la virgule au quotient.');
    expect(String(item.spoken)).toBe(`${whole} virgule ${decimals} divisé par ${d}, combien ?`);
    expect(item.figure).toEqual({ kind: 'long-division', props: { dividend: `${whole},${decimals}`, divisor: String(d) } });
    const values = list.map(num);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    // Une seule réponse multipliée par le diviseur redonne le dividende.
    expect(values.filter((v) => Math.abs(v * d - n / 10 ** places) < 1e-9)).toHaveLength(1);
    if (Number(whole) < d) smallWhole++;
    // Le 0 oublié après la virgule, s’il y a lieu : toujours proposé.
    if (places === 2 && Math.floor(q / 10) % 10 === 0) expect(values, String(item.prompt)).toContain(Math.floor(q / 100) + (q % 10) / 10);
    if (values.includes(q)) seen.noComma++;
    if (values.includes(answer * 10) || values.includes(Math.round(answer * 10 ** (places + 1)) / 10 ** (places + 2))) seen.shifted++;
    if (places === 2 && Math.floor(q / 10) % 10 === 0 && values.includes(Math.floor(q / 100) + (q % 10) / 10)) seen.zero++;
    const wholeQ = Math.floor(Number(whole) / d);
    const decQ = Math.floor(Number(decimals) / d);
    const split = Number(whole) % d !== 0 && decQ >= 1 && values.includes(Number(`${wholeQ}.${decQ}`));
    if (split) seen.split++;
    // Un vrai piège au moins, jamais seulement des voisins.
    const shifted = [q, answer * 10, Math.round(answer * 10 ** (places + 1)) / 10 ** (places + 2)];
    expect(split || shifted.some((v) => values.includes(v)) || values.includes(Math.floor(q / 100) + (q % 10) / 10), String(item.prompt)).toBe(true);
  }
  expect(smallWhole).toBeGreaterThan(20);
  for (const [trap, n] of Object.entries(seen)) expect(n, trap).toBeGreaterThan(100);
});
