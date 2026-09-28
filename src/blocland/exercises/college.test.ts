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
  percentChange,
  pow,
  primeDecomposition,
  primeFactors,
  productEquation,
  pythagoreHyp,
  pythagoreSide,
  scientific,
  seededItems,
  testEquality,
  TO_FACTOR,
  thales,
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

it('Glacier et Marché : six exercices chacun, huit items avec aide et explication', () => {
  const glacier = COLLEGE_EXERCISES.filter((e) => e.biome === 'glacier');
  const marche = COLLEGE_EXERCISES.filter((e) => e.biome === 'marche');
  expect(glacier).toHaveLength(6);
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
