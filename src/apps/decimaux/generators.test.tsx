import { render, screen } from '@testing-library/react';
import { QUESTS, QUESTIONS_PER_QUEST } from './generators';
import { DecimalTable } from './DecimalTable';
import { formatDecimal, parseDecimal } from './decimal';

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANK: Record<string, number> = { dizaines: -2, unités: -1, dixièmes: 0, centièmes: 1, millièmes: 2 };
const nb = (s: string) => s.replace(/[  ]/g, ' ');

/** Recalcule la bonne réponse à partir de l'énoncé, en millièmes entiers. */
function expected(id: string, prompt: string, choices: string[]): string {
  const p = nb(prompt);
  let m;
  if ((m = p.match(/^Dans ([\d,]+), quel est le chiffre des ([^\s?]+) \?$/))) {
    const [int, dec] = m[1].split(',');
    const pos = RANK[m[2]];
    return pos < 0 ? int[int.length + pos] : dec[pos];
  }
  if ((m = p.match(/^Quel est le plus grand : ([\d,]+) ou ([\d,]+) \?$/))) {
    const [a, b] = [parseDecimal(m[1]), parseDecimal(m[2])];
    return a === b ? choices[2] : a > b ? m[1] : m[2];
  }
  if ((m = id.match(/^droite-(\d+)$/))) return formatDecimal(Number(m[1]));
  if ((m = p.match(/^(\d+)\/(\d+) = …$/))) return formatDecimal((Number(m[1]) * 1000) / Number(m[2]));
  if ((m = p.match(/^([\d ,]+) ([×÷]) ([\d ]+) = …$/))) {
    const th = parseDecimal(m[1]);
    const k = Number(m[3].replace(/ /g, ''));
    return formatDecimal(m[2] === '×' ? th * k : th / k);
  }
  if ((m = p.match(/^([\d,]+) \+ … = 1$/))) return formatDecimal(1000 - parseDecimal(m[1]));
  throw new Error(`Question inconnue : ${prompt}`);
}

it('formate et relit les décimaux sans erreur d’arrondi', () => {
  expect(formatDecimal(3450)).toBe('3,45');
  expect(formatDecimal(7000)).toBe('7');
  expect(formatDecimal(5)).toBe('0,005');
  expect(nb(formatDecimal(34_560_000))).toBe('34 560');
  expect(parseDecimal('3,45')).toBe(3450);
  expect(parseDecimal('34 560')).toBe(34_560_000);
  expect(parseDecimal('0,1') + parseDecimal('0,2')).toBe(parseDecimal('0,3'));
});

describe.each(QUESTS.map((q) => [q.id, q] as const))('quête %s', (_, quest) => {
  it('produit des questions justes, sans doublon, avec une seule bonne réponse', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = quest.makeWith(seeded(seed));
      expect(qs).toHaveLength(QUESTIONS_PER_QUEST);
      expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
      for (const q of qs) {
        expect(q.answer).toBe(expected(q.id, q.prompt, q.choices));
        expect(q.choices).toContain(q.answer);
        expect(new Set(q.choices).size).toBe(q.choices.length);
        expect(q.choices.length).toBeGreaterThanOrEqual(3);
        // Jamais deux choix de même valeur (sauf « 2,7 ou 2,70 », où la réponse est « égaux »).
        const numeric = q.choices.filter((c) => /^[\d\s ,]+$/.test(c)).map(parseDecimal);
        if (!/égaux/.test(q.answer)) expect(new Set(numeric).size).toBe(numeric.length);
        expect(q.hint).toBeTruthy();
      }
    }
  });
});

it('aligne les décimaux dans le tableau en complétant par des zéros', () => {
  render(<DecimalTable rows={[3500, 3450]} padZeros />);
  const rows = screen.getAllByRole('row').slice(1).map((r) => r.textContent);
  expect(rows).toEqual(['350', '345']);
});
