import {
  COLLEGE_EXERCISES,
  addRelatifs,
  choices,
  compareRelatifs,
  developDouble,
  equationTwoSteps,
  factorNumber,
  factorX,
  fmt,
  mean,
  mulRelatifs,
  NOT_RIGHT,
  percentChange,
  pow,
  primeDecomposition,
  primeFactors,
  productEquation,
  pythagoreHyp,
  pythagoreSide,
  RECIPROQUE_PYTHAGORE_CHOICES,
  reciprocalPythagore,
  reciprocalThales,
  scientific,
  seededItems,
  testEquality,
  TO_FACTOR,
  thales,
  THALES_CASES,
} from './college';
import { MATHS_EXERCISES } from './maths';
import { PROBLEMES_COLLEGE_EXERCISES, PROBLEMES_EXERCISES } from './problemes';
import { runItems } from './run';
import { shuffleRunChoices } from './shuffle';
import type { ExerciseItem } from './types';

it('formate et lit les relatifs, range les réponses', () => {
  expect(fmt(-7)).toBe('−7');
  expect(fmt(1200)).toMatch(/^1.200$/);
  expect(choices(3, [5, -2, 3, 3], () => 0.5)).toEqual(['−2', '2', '3', '5']);
  // La liste reste croissante, mais la bonne réponse y prend chaque place selon le tirage.
  const rng = seededItems('places');
  const places = new Set<number>();
  for (let i = 0; i < 40; i++) {
    const list = choices(10, [2, 4, 6, 8, 12, 14, 16], rng);
    expect(list.map(Number)).toEqual([...list.map(Number)].sort((a, b) => a - b));
    places.add(list.indexOf('10'));
  }
  expect([...places].sort()).toEqual([0, 1, 2, 3]);
});

it('les générateurs de relatifs sont cohérents avec la droite', () => {
  const rng = seededItems('test');
  for (let i = 0; i < 30; i++) {
    const c = compareRelatifs(rng);
    expect(c.choices).toContain(c.answer);
    const a = addRelatifs(rng);
    const [x, y] = (a.aid as { props: { jump: [number, number] } }).props.jump;
    expect(fmt(y)).toBe(a.answer);
    const [, p, q] = String(a.prompt).match(/^(−?\d+) \+ \(?(−?\d+)\)?/)!;
    expect(Number(p.replace('−', '-')) + Number(q.replace('−', '-'))).toBe(y);
    expect(Math.abs(y)).toBeLessThanOrEqual(10);
    expect(x).toBe(Number(p.replace('−', '-')));
    const m = mulRelatifs(rng);
    expect(m.choices).toContain(m.answer);
  }
});

it('les pourcentages : nouveau prix cohérent', () => {
  const rng = seededItems('pct');
  for (let i = 0; i < 20; i++) {
    const it = percentChange(rng);
    expect(it.choices).toContain(it.answer);
    expect(String(it.answer)).toMatch(/€$/);
  }
});

it('Glacier et Marché : neuf et six exercices, huit items avec aide et explication', () => {
  const glacier = COLLEGE_EXERCISES.filter((e) => e.biome === 'glacier');
  const marche = COLLEGE_EXERCISES.filter((e) => e.biome === 'marche');
  expect(glacier).toHaveLength(9);
  expect(marche).toHaveLength(6);
  for (const def of [...glacier, ...marche]) {
    expect(def.items).toHaveLength(8);
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect(it.aid).toBeDefined();
      expect(String(it.explanation).length).toBeGreaterThan(3);
      expect(JSON.parse(JSON.stringify(it))).toEqual(it);
    }
  }
  expect(glacier[0].items.every((it) => (it.aid as { kind: string }).kind === 'number-line')).toBe(true);
  expect(marche[0].items.every((it) => (it.aid as { kind: string }).kind === 'ratio-table')).toBe(true);
});

it('Forge et Atelier : exposants lisibles, notation scientifique et équations cohérentes', () => {
  expect(pow(10, 4)).toBe('10⁴');
  expect(pow(2, 12)).toBe('2¹²');
  const rng = seededItems('forge');
  for (let i = 0; i < 20; i++) {
    const s = scientific(rng);
    expect(s.choices).toContain(s.answer);
    // « 3,4 × 10³ », ou « 8 × 10⁵ » (jamais « 8,0 × 10⁵ »).
    expect(String(s.answer)).toMatch(/^[1-9](,[1-9])? × 10[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/);
    const e = equationTwoSteps(rng);
    expect(e.choices).toContain(e.answer);
    expect((e.choices as string[]).length).toBe(4);
    const d = developDouble(rng);
    expect(d.choices).toContain(d.answer);
    expect(new Set(d.choices as string[]).size).toBe((d.choices as string[]).length);
  }
  const forge = COLLEGE_EXERCISES.filter((e) => e.biome === 'forge');
  const atelier = COLLEGE_EXERCISES.filter((e) => e.biome === 'atelier');
  expect(forge).toHaveLength(7);
  expect(atelier).toHaveLength(9);
  for (const def of [...forge, ...atelier]) {
    expect(def.items).toHaveLength(8);
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect(new Set(it.choices as string[]).size).toBe((it.choices as string[]).length);
      expect((it.aid as { kind: string }).kind).toBe('rule-card');
    }
  }
});

/** Un polynôme en x, par ses coefficients : [constante, x, x², x³]. */
type Poly = [number, number, number, number];
const ZERO: Poly = [0, 0, 0, 0];
/** « 12 », « 5x », « x », « x² » : un monôme écrit comme dans les choix. */
function monomial(text: string): Poly {
  const m = /^(\d*)(x²|x)?$/.exec(text);
  if (!m) throw new Error(`monôme illisible : ${text}`);
  const out: Poly = [...ZERO];
  out[m[2] === 'x²' ? 2 : m[2] === 'x' ? 1 : 0] = m[1] === '' ? 1 : Number(m[1]);
  return out;
}
const addPoly = (a: Poly, b: Poly, sign: 1 | -1): Poly => a.map((c, i) => c + sign * b[i]) as Poly;
function mulPoly(a: Poly, b: Poly): Poly {
  const out: Poly = [...ZERO];
  a.forEach((ca, i) =>
    b.forEach((cb, j) => {
      if (ca * cb === 0) return;
      if (i + j > 3) throw new Error('degré trop grand');
      out[i + j] += ca * cb;
    }),
  );
  return out;
}
/** « 10x + 12 » ou « 2(5x + 6) », « x(x − 2) » : le polynôme développé. */
function readPoly(text: string): Poly {
  const m = /^(?:(\S+?)\()?(\S+) ([+−]) (\S+?)\)?$/.exec(text);
  if (!m) throw new Error(`expression illisible : ${text}`);
  const sum = addPoly(monomial(m[2]), monomial(m[4]), m[3] === '+' ? 1 : -1);
  return m[1] ? mulPoly(monomial(m[1]), sum) : sum;
}
/** Les nombres d'une clé : « test-4--3-2-5-3 » donne [4, −3, 2, 5, 3]. */
const keyNumbers = (key: string) => [...key.matchAll(/-(-?\d+)/g)].map((m) => Number(m[1]));

it('Forge et Atelier, niveaux 3 et 4 : une seule réponse juste, des pièges vraisemblables, sans symbole à voix haute', () => {
  const isPrime = (n: number) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
  const most = (factors: number[]) => Math.max(...factors.map((p) => factors.filter((q) => q === p).length));
  expect(primeFactors(60)).toEqual([2, 2, 3, 5]);
  // Jamais plus de trois fois le même facteur premier.
  for (const n of TO_FACTOR) expect(most(primeFactors(n)), String(n)).toBeLessThanOrEqual(3);
  const rng = seededItems('niveaux-3');
  for (let i = 0; i < 200; i++) {
    // Facteurs premiers : un seul choix fait de nombres premiers dont le produit est le nombre.
    const d = primeDecomposition(rng);
    const [n] = keyNumbers(d.key);
    const list = d.choices as string[];
    expect(list).toHaveLength(4);
    expect(new Set(list).size).toBe(4);
    const factors = (c: string) => c.split(' × ').map(Number);
    expect(list.filter((c) => factors(c).every(isPrime) && factors(c).reduce((a, b) => a * b, 1) === n)).toEqual([d.answer]);
    // Le piège ne se joue pas sur le compte des 2 : aucun choix n'écrit un facteur plus de trois fois, ni une fois de
    // plus que la réponse quand elle en a déjà deux.
    const inAnswer = factors(String(d.answer));
    for (const c of list) {
      expect(most(factors(c)), c).toBeLessThanOrEqual(3);
      if (most(inAnswer) >= 2) expect(factors(c).length, c).toBeLessThanOrEqual(inAnswer.length);
    }
    expect(String(d.explanation)).toContain(`${n} = `);

    // Factoriser : quatre écritures différentes ; en développant, seule la réponse redonne l'expression de la clé.
    for (const f of [factorNumber(rng), factorX(rng)]) {
      const choices = f.choices as string[];
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      const sign = f.key.endsWith('-m') ? -1 : 1;
      let target: Poly;
      if (f.key.startsWith('factx-')) {
        const [b] = keyNumbers(f.key);
        target = [0, sign * b, 1, 0];
      } else {
        const [k, a, b] = keyNumbers(f.key);
        target = [sign * k * b, k * a, 0, 0];
      }
      expect(readPoly(String(f.prompt).replace(' = …', ''))).toEqual(target);
      expect(choices.filter((c) => JSON.stringify(readPoly(c)) === JSON.stringify(target))).toEqual([f.answer]);
      expect(String(f.spoken)).not.toMatch(/[−×²()…]/);
    }

    // Tester une égalité : la réponse est celle du calcul fait sur les nombres de la clé.
    const t = testEquality(rng);
    const [a, b, c, dd, x] = keyNumbers(t.key);
    expect(t.answer).toBe(a * x + b === c * x + dd ? 'oui' : 'non');
    expect(t.choices).toEqual(['non', 'oui']);
    expect(String(t.spoken)).not.toMatch(/[−=]/);

    // Équation produit : la réponse donne les deux racines de la clé, aucun piège ne les donne.
    const p = productEquation(rng);
    const pc = p.choices as string[];
    expect(pc).toHaveLength(4);
    expect(new Set(pc).size).toBe(4);
    const [r1, r2] = keyNumbers(p.key);
    const sols = (choice: string) => [...choice.matchAll(/x = (\S+)/g)].map((m) => Number(m[1].replace('−', '-'))).sort((u, v) => u - v);
    const expected = [r1, r2].sort((u, v) => u - v);
    expect(pc.filter((choice) => JSON.stringify(sols(choice)) === JSON.stringify(expected))).toEqual([p.answer]);
    expect(String(p.prompt)).toMatch(/Quelles sont les solutions \?$/);
    expect(String(p.spoken)).not.toMatch(/[−=()]/);
  }
});

it('3e : Pythagore, Thalès, moyenne cohérents ; figures et barres en données', () => {
  const rng = seededItems('3e');
  for (let i = 0; i < 20; i++) {
    const h = pythagoreHyp(rng);
    const f = (h.figure as { props: { a: number; b: number } }).props;
    expect(h.answer).toBe(`${Math.sqrt(f.a * f.a + f.b * f.b)} cm`);
    const s = pythagoreSide(rng);
    expect(s.choices).toContain(s.answer);
    const t = thales(rng);
    expect(t.choices).toContain(t.answer);
    const m = mean(rng);
    const vals = (m.aid as { props: { values: number[] } }).props.values;
    expect(Number(m.answer)).toBe(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  for (const biome of ['belvedere', 'donnees', 'phare']) {
    const defs = COLLEGE_EXERCISES.filter((e) => e.biome === biome);
    expect(defs.length).toBeGreaterThanOrEqual(3);
    for (const def of defs) {
      expect(def.items).toHaveLength(8);
      for (const it of def.items) {
        expect(it.choices).toContain(it.answer);
        expect(it.aid ?? it.figure).toBeDefined();
        expect(JSON.parse(JSON.stringify(it))).toEqual(it);
      }
    }
  }
});

it('Belvédère, réciproques : la réponse se calcule depuis l’énoncé, les pièges sont ceux des élèves', () => {
  // Les triangles « pas rectangles » le sont vraiment, et sont de vrais triangles.
  for (const [a, b, c] of NOT_RIGHT) {
    expect(a * a + b * b, `${a} ${b} ${c}`).not.toBe(c * c);
    expect(a + b).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(b);
  }
  // Réciproque de Thalès : de quoi tirer dans chaque cas ; le même coefficient ne donne jamais la même différence ;
  // quatre longueurs différentes.
  expect(THALES_CASES.parallel.length).toBeGreaterThan(8);
  expect(THALES_CASES.sameGap.length).toBeGreaterThan(8);
  expect(THALES_CASES.close.length).toBeGreaterThan(8);
  for (const t of THALES_CASES.parallel) expect(t.ab - t.am).not.toBe(t.ac - t.an);
  for (const t of Object.values(THALES_CASES).flat()) expect(new Set([t.am, t.ab, t.an, t.ac]).size).toBe(4);

  const rng = seededItems('reciproques');
  const pythAnswers = new Set<string>();
  let hypNotBC = 0;
  let sameGapSeen = 0;
  let mixedOrder = 0;
  for (let i = 0; i < 300; i++) {
    const p = reciprocalPythagore(rng);
    const [ab, ac, bc] = keyNumbers(p.key);
    const len: Record<string, number> = { AB: ab, AC: ac, BC: bc };
    const big = Object.keys(len).reduce((u, v) => (len[v] > len[u] ? v : u));
    const others = Object.keys(len).filter((s) => s !== big);
    const right = len[big] ** 2 === len[others[0]] ** 2 + len[others[1]] ** 2;
    const vertex = { AB: 'C', AC: 'B', BC: 'A' }[big];
    expect(p.answer).toBe(right ? `oui, en ${vertex}` : 'non');
    expect(p.choices).toEqual(RECIPROQUE_PYTHAGORE_CHOICES);
    expect(String(p.prompt)).toBe(`Triangle ABC : AB = ${ab} cm, AC = ${ac} cm, BC = ${bc} cm. Est-il rectangle ?`);
    expect(String(p.spoken)).not.toMatch(/[=²√÷×]|\bcm\b/);
    // La correction refait le calcul : le carré du plus grand côté et la somme des deux autres.
    expect(String(p.explanation)).toContain(`${big}² = ${len[big]}² = ${len[big] ** 2}`);
    expect(String(p.explanation)).toContain(`= ${len[others[0]] ** 2 + len[others[1]] ** 2}.`);
    // Le tableau range les côtés du plus petit au plus grand, avec leurs carrés ; l'indice, lu à voix haute, est en mots.
    const rows = (p.figure as { kind: string; props: { rows: string[][] } }).props.rows;
    expect(rows.map((r) => r[0])).toEqual(Object.keys(len).sort((u, v) => len[u] - len[v]));
    for (const [s, l, sq] of rows) expect([l, sq]).toEqual([`${len[s]} cm`, String(len[s] ** 2)]);
    expect(String(p.hint)).not.toMatch(/[=²√÷×+−]/);
    pythAnswers.add(String(p.answer));
    if (right && big !== 'BC') hypNotBC++;

    const t = reciprocalThales(rng);
    const [am, tab, an, tac] = keyNumbers(t.key);
    expect(t.answer).toBe(tab * an === tac * am ? 'oui' : 'non');
    expect(t.choices).toEqual(['non', 'oui']);
    expect(am).toBeLessThan(tab);
    expect(an).toBeLessThan(tac);
    // L'énoncé donne les quatre longueurs de la clé ; le tableau les range, petit triangle puis grand.
    const prompt = String(t.prompt);
    for (const [s, v] of [['AM', am], ['AB', tab], ['AN', an], ['AC', tac]] as const) expect(prompt).toContain(`${s} = ${v} cm`);
    expect((t.figure as { props: { rows: string[][] } }).props.rows).toEqual([
      [`AM = ${am}`, `AB = ${tab}`],
      [`AN = ${an}`, `AC = ${tac}`],
    ]);
    expect(String(t.spoken)).not.toMatch(/[=÷×()[\]]|\bcm\b/);
    expect(String(t.hint)).not.toMatch(/[=÷×−]/);
    // Deux phrases : l'énoncé avec ses longueurs, puis la question.
    expect(prompt.split(/(?<=[.?]) /)).toHaveLength(2);
    if (t.answer === 'non' && tab - am === tac - an) sameGapSeen++;
    if (prompt.indexOf('AC =') < prompt.indexOf('AN =')) mixedOrder++;
  }
  expect([...pythAnswers].sort()).toEqual(RECIPROQUE_PYTHAGORE_CHOICES);
  expect(hypNotBC).toBeGreaterThan(100);
  expect(sameGapSeen).toBeGreaterThan(40);
  expect(mixedOrder).toBeGreaterThan(100);

  // Les deux niveaux : huit items, une règle affichée, la consigne unique du niveau.
  for (const id of ['belvedere-pythagore-4', 'belvedere-thales-3']) {
    const def = COLLEGE_EXERCISES.find((e) => e.id === id)!;
    expect(def.items).toHaveLength(8);
    for (const it of def.items) expect((it.aid as { kind: string }).kind).toBe('rule-card');
  }
});

it('Glacier et Forge : pendant la partie, une seule bonne réponse et les nombres de l’énoncé', () => {
  const byId = (id: string) => COLLEGE_EXERCISES.find((d) => d.id === id)!;
  const num = (c: string) => Number(c.replace('−', '-').replace(/\s/g, ''));
  const isPrime = (n: number) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
  for (let s = 0; s < 300; s++) {
    for (const id of ['glacier-thermometre-1', 'forge-trempe-2']) {
      const def = byId(id);
      const seed = `${id}#garde${s}`;
      const raw = def.generate!(seed);
      const run = shuffleRunChoices(def, raw, seed);
      run.forEach((item, i) => {
        const list = item.choices as string[];
        // Les mêmes nombres qu'au tirage, une seule fois la bonne réponse.
        expect([...list].sort()).toEqual([...(raw[i].choices as string[])].sort());
        expect(list.filter((c) => c === item.answer)).toHaveLength(1);
        const prompt = String(item.prompt);
        if (id === 'glacier-thermometre-1') {
          const [, a, b] = /: (\S+) ou (\S+) \?/.exec(prompt)!;
          expect(a).not.toBe(b);
          expect([...list].sort()).toEqual([a, b].sort());
          const values = [num(a), num(b)];
          expect(num(String(item.answer))).toBe(prompt.includes('petit') ? Math.min(...values) : Math.max(...values));
        } else if (prompt.includes('premier')) {
          expect(list).toHaveLength(4);
          expect(list.filter((c) => isPrime(num(c)))).toEqual([item.answer]);
        } else {
          const n = Number(/de (\d+) \?/.exec(prompt)![1]);
          expect(list).toHaveLength(4);
          expect(list.filter((c) => n % num(c) === 0)).toEqual([item.answer]);
        }
      });
    }
  }
});

it('maths générées : les accords au singulier (« 1 caisse », « une pomme »), sur des centaines de parties', () => {
  const texts = (item: ExerciseItem) =>
    [item.prompt, item.spoken, item.hint, item.explanation, ...((item.choices as unknown[]) ?? [])].map(String).join(' ¦ ');
  const plural = /(?<![\d,  ])1 (caisses|boules|rouges|bleues|parts|graduations|zéros|rangs|mètres|kilos|centimètres|kilomètres)\b/;
  const gender = /\b[Uu]n (pomme|bille|crêpe|tomate)\b/;
  for (const def of [...MATHS_EXERCISES, ...COLLEGE_EXERCISES, ...PROBLEMES_EXERCISES, ...PROBLEMES_COLLEGE_EXERCISES]) {
    for (let s = 0; s < 150; s++) {
      for (const item of runItems(def, `${def.id}#accords${s}`)) {
        const t = texts(item);
        expect(t, def.id).not.toMatch(plural);
        expect(t, def.id).not.toMatch(gender);
      }
    }
  }
}, 30_000);

it('maths générées : la partie garde les choix tirés, et la bonne réponse prend chaque place (aucune au-delà de 40 %)', () => {
  const report: string[] = [];
  for (const def of [...MATHS_EXERCISES, ...COLLEGE_EXERCISES, ...PROBLEMES_EXERCISES, ...PROBLEMES_COLLEGE_EXERCISES]) {
    const byPlace = new Map<number, number[]>();
    for (let s = 0; s < 300; s++) {
      const seed = `${def.id}#places${s}`;
      const raw = def.generate!(seed);
      const run = runItems(def, seed);
      // Aucun piège inventé ni déplacé pendant la partie : les choix sont ceux des générateurs, dans leur ordre.
      expect(run.map((it) => it.choices)).toEqual(raw.map((it) => it.choices));
      for (const item of run) {
        const list = (item.choices as unknown[]).map(String);
        const place = list.indexOf(String(item.answer));
        expect(place, `${def.id} ${item.key}`).toBeGreaterThanOrEqual(0);
        expect(new Set(list).size, `${def.id} ${item.key}`).toBe(list.length);
        if (def.id === 'donnees-chances-1' && String(item.prompt).startsWith('Un sac')) expect(list, String(item.prompt)).toHaveLength(4);
        if (def.id === 'marche-balances-2') expect(list).not.toContain(`${/représente (\d+) km/.exec(String(item.prompt))![1]} km`);
        if (!byPlace.has(list.length)) byPlace.set(list.length, Array(list.length).fill(0));
        byPlace.get(list.length)![place]++;
      }
    }
    for (const [n, counts] of byPlace) {
      const total = counts.reduce((a, b) => a + b, 0);
      // Quatre réponses : aucune place au-delà de 40 % ; deux ou trois réponses (comparer, oui ou non) : 1/n + 20 points.
      const limit = n === 4 ? 0.4 : 1 / n + 0.2;
      if (Math.max(...counts) / total > limit) report.push(`${def.id} (${n} choix) : ${counts.join('/')}`);
    }
  }
  expect(report).toEqual([]);
}, 60_000);

it('Icebergs des fractions : une seule bonne réponse, calculée depuis l’énoncé, et les pièges tirés d’erreurs réelles', () => {
  const byId = (id: string) => COLLEGE_EXERCISES.find((d) => d.id === id)!;
  const parse = (f: string): [number, number] => {
    const [n, d] = f.split('/').map(Number);
    return [n, d];
  };
  const val = (f: string) => parse(f)[0] / parse(f)[1];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const irreducible = (f: string) => gcd(...parse(f)) === 1;
  const seen = { sumTrap: 0, unsimplified: 0, wrongInverse: 0, cross: 0 };
  for (let s = 0; s < 200; s++) {
    for (const level of [1, 2, 3]) {
      const def = byId(`glacier-icebergs-${level}`);
      expect(def.instruction).not.toMatch(/[/×÷]/);
      for (const item of def.generate!(`${def.id}#glace${s}`)) {
        const list = (item.choices as string[]).map(String);
        const prompt = String(item.prompt);
        const spoken = String(item.spoken);
        // Lu à voix haute sans symbole : « 3 quarts fois 2 tiers ».
        expect(spoken, spoken).not.toMatch(/[/×÷−+…]/);
        expect((item.aid as { kind: string }).kind).toBe('rule-card');
        expect(new Set(list).size).toBe(list.length);
        expect(list).toContain(item.answer);
        if (level < 3) expect((item.figure as { kind: string }).kind).toBe('compare-bars');
        const [x, op, y] = /^(\d+\/\d+) ?(\S*) ?(\d+\/\d+)/
          .exec(prompt.replace(/^Compare /, '').replace(' et ', ' ? '))!
          .slice(1);
        if (level === 1) {
          expect(list).toEqual([x, y, 'Elles sont égales']);
          const [a, b] = parse(x);
          const [c, d] = parse(y);
          const expected = a * d === b * c ? 'Elles sont égales' : a * d > b * c ? x : y;
          expect(item.answer, prompt).toBe(expected);
          continue;
        }
        expect(list.length, prompt).toBe(4);
        // Rangées de la plus petite à la plus grande.
        expect(list.map(val)).toEqual([...list.map(val)].sort((p, q) => p - q));
        const [a, b] = parse(x);
        const [c, d] = parse(y);
        const exact = { '+': a / b + c / d, '−': a / b - c / d, '×': (a * c) / (b * d), '÷': (a * d) / (b * c) }[op]!;
        const close = (v: number) => Math.abs(v - exact) < 1e-9;
        expect(close(val(String(item.answer))), prompt).toBe(true);
        expect(irreducible(String(item.answer)), prompt).toBe(true);
        if (level === 2) {
          // Aucune autre écriture de la réponse : une seule réponse juste.
          expect(list.filter((f) => close(val(f))), prompt).toEqual([item.answer]);
          if (op === '+' && list.includes(`${a + c}/${b + d}`)) seen.sumTrap++;
        } else {
          // La seule autre écriture possible de la réponse est celle qu'on a oublié de simplifier.
          const same = list.filter((f) => close(val(f)) && f !== item.answer);
          expect(same.length, prompt).toBeLessThanOrEqual(1);
          for (const f of same) expect(irreducible(f), prompt).toBe(false);
          if (same.length) seen.unsimplified++;
          expect(prompt).toMatch(/simplifiée/);
          // Jamais une fraction de l'énoncé parmi les réponses.
          for (const f of list) expect([x, y].some((o) => Math.abs(val(f) - val(o)) < 1e-9), `${prompt} ${f}`).toBe(false);
          const reduce = (n: number, m: number) => `${n / gcd(n, m)}/${m / gcd(n, m)}`;
          if (op === '÷' && list.includes(reduce(b * c, a * d))) seen.wrongInverse++;
          if (op === '×' && list.includes(reduce(a * d, b * c))) seen.cross++;
        }
      }
    }
  }
  // Les pièges annoncés sont bien là, souvent.
  for (const [trap, count] of Object.entries(seen)) expect(count, trap).toBeGreaterThan(100);
});
