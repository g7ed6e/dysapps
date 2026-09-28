import {
  COLLEGE_EXERCISES,
  addRelatifs,
  choices,
  compareRelatifs,
  developDouble,
  equationTwoSteps,
  fmt,
  mean,
  mulRelatifs,
  percentChange,
  pow,
  pythagoreHyp,
  pythagoreSide,
  scientific,
  seededItems,
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
  expect(forge).toHaveLength(6);
  expect(atelier).toHaveLength(6);
  for (const def of [...forge, ...atelier]) {
    expect(def.items).toHaveLength(8);
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect(new Set(it.choices as string[]).size).toBe((it.choices as string[]).length);
      expect((it.aid as { kind: string }).kind).toBe('rule-card');
    }
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

it('Glacier et Forge : les choix qui viennent de l’énoncé ou d’une propriété ne sont pas replacés pendant la partie', () => {
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
});
