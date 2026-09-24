import { render, screen } from '@testing-library/react';
import { QUESTS, QUESTIONS_PER_QUEST } from './generators';
import { RichText } from '../../components/math/RichText';

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const val = (s: string) => {
  const [n, d] = s.split('/').map(Number);
  return d ? n / d : n;
};

/** Recalcule la bonne réponse sans passer par le générateur. */
function expected(id: string, prompt: string, choices: string[]): string {
  let m;
  if ((m = id.match(/^(lire|droite)-(\d+)-(\d+)$/))) return `${m[2]}/${m[3]}`;
  if ((m = prompt.match(/^(\d+)\/(\d+) = …\/(\d+)$/))) return String((Number(m[1]) * Number(m[3])) / Number(m[2]));
  if ((m = prompt.match(/^(\d+)\/(\d+) de (\d+) = …$/))) return String((Number(m[1]) * Number(m[3])) / Number(m[2]));
  if ((m = prompt.match(/: (\d+\/\d+) ou (\d+\/\d+) \?$/))) {
    const [a, b] = [val(m[1]), val(m[2])];
    return a === b ? choices[2] : a > b ? m[1] : m[2];
  }
  throw new Error(`Question inconnue : ${id}`);
}

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
        // Aucune autre réponse de même valeur (1/2 et 2/4 seraient toutes deux justes).
        if (/\//.test(q.answer)) {
          expect(q.choices.filter((c) => /\//.test(c) && val(c) === val(q.answer))).toHaveLength(1);
        }
        expect(q.hint).toBeTruthy();
        if (q.spokenPrompt) expect(q.spokenPrompt).not.toMatch(/\d\/\d|…/);
      }
    }
  });
});

it('affiche les fractions en colonne, lisibles par un lecteur d’écran', () => {
  render(<RichText text="2/3 = …/6" />);
  expect(screen.getByRole('img', { name: '2 tiers' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'combien sur 6' })).toBeInTheDocument();
});
