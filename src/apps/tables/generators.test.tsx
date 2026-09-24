import { render, screen } from '@testing-library/react';
import { QUESTS, QUESTIONS_PER_QUEST, TABLES, numericChoices, tableQuest } from './generators';
import { formatNumber } from './format';

/** Générateur pseudo-aléatoire reproductible. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const num = (s: string) => Number(s.replace(/[\s  ]/g, ''));

/** Recalcule la réponse attendue à partir de l'énoncé, indépendamment du générateur. */
function solve(prompt: string): number {
  const p = prompt.replace(/[  ]/g, ' ');
  let m;
  if ((m = p.match(/^([\d ]+) × ([\d ]+) = …$/))) return num(m[1]) * num(m[2]);
  if ((m = p.match(/^([\d ]+) ÷ ([\d ]+) = …$/))) return num(m[1]) / num(m[2]);
  if ((m = p.match(/^(\d+) \+ … = (\d+)$/))) return num(m[2]) - num(m[1]);
  if ((m = p.match(/^Double de (\d+) = …$/))) return 2 * num(m[1]);
  if ((m = p.match(/^Moitié de (\d+) = …$/))) return num(m[1]) / 2;
  throw new Error(`Énoncé inconnu : ${prompt}`);
}

describe.each(QUESTS.map((q) => [q.id, q] as const))('quête %s', (_, quest) => {
  it('produit des questions justes, sans doublon, avec 4 choix croissants', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = quest.make(seeded(seed));
      expect(qs).toHaveLength(QUESTIONS_PER_QUEST);
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(qs.length);
      for (const q of qs) {
        const expected = solve(q.prompt);
        expect(Number.isInteger(expected)).toBe(true);
        expect(num(q.answer)).toBe(expected);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        const values = q.choices.map(num);
        expect(values.every((v) => v >= 0)).toBe(true);
        expect([...values].sort((a, b) => a - b)).toEqual(values);
        expect(q.hint).toBeTruthy();
        expect(q.spokenPrompt).not.toMatch(/[×÷…]/);
      }
    }
  });
});

it('révise une table complète de × 1 à × 10', () => {
  for (const t of TABLES) {
    const qs = tableQuest(t, seeded(t));
    expect(qs.map((q) => num(q.answer)).sort((a, b) => a - b)).toEqual(Array.from({ length: 10 }, (_, i) => t * (i + 1)));
  }
});

it('numericChoices complète les pièges manquants', () => {
  const choices = numericChoices(3, [3, -1], seeded(1));
  expect(choices).toHaveLength(4);
  expect(new Set(choices).size).toBe(4);
  expect(choices).toContain('3');
  expect(choices.map(Number).every((n) => n >= 0)).toBe(true);
});

it('formate les milliers à la française', () => {
  expect(formatNumber(4500).replace(/ /g, ' ')).toBe('4 500');
});

it('affiche une aide visuelle cohérente', () => {
  const q = QUESTS.find((x) => x.id === 'faciles')!.make(seeded(3))[0];
  render(<>{q.aid}</>);
  const [a, b] = q.prompt.split(' = ')[0].split(' × ').map(Number);
  const label = screen.getByRole('img').getAttribute('aria-label')!;
  const [rows, cols] = label.match(/\d+/g)!.map(Number);
  expect(rows * cols).toBe(a * b);
});
