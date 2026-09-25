import {
  COLLEGE_EXERCISES,
  addRelatifs,
  choices,
  compareRelatifs,
  developDouble,
  equationTwoSteps,
  fmt,
  mulRelatifs,
  percentChange,
  pow,
  scientific,
  seededItems,
} from './college';

it('formate et lit les relatifs, range les réponses', () => {
  expect(fmt(-7)).toBe('−7');
  expect(fmt(1200)).toMatch(/^1.200$/);
  expect(choices(3, [5, -2, 3, 3], () => 0.5)).toEqual(['−2', '3', '4', '5']);
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
    expect(String(s.answer)).toMatch(/^\d,\d × 10[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/);
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
