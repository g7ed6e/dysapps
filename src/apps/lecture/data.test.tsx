import { TEXTS, questionsFor, segmentsOf } from './data';

describe.each(TEXTS.map((t) => [t.id, t] as const))('texte %s', (_, text) => {
  it('est complet et cohérent', () => {
    expect(text.title && text.author && text.source).toBeTruthy();
    const segs = segmentsOf(text);
    expect(segs.length).toBeGreaterThanOrEqual(10);
    for (const s of segs) expect(s).not.toContain("'");
    expect(text.questions).toHaveLength(5);
    for (const q of text.questions) {
      expect(q.choices).toHaveLength(3);
      expect(new Set(q.choices).size).toBe(3);
      expect(q.choices).toContain(q.answer);
      const [from, to] = q.lines;
      expect(from).toBeGreaterThanOrEqual(1);
      expect(to).toBeGreaterThanOrEqual(from);
      expect(to).toBeLessThanOrEqual(segs.length);
      expect(q.explanation).toBeTruthy();
    }
    // La bonne réponse n'est pas toujours au même endroit.
    expect(new Set(text.questions.map((q) => q.choices.indexOf(q.answer))).size).toBeGreaterThan(1);
    for (const g of text.glossary) expect(g.definition.length).toBeGreaterThan(3);
  });

  it('donne un joker qui renvoie au bon passage', () => {
    for (const q of questionsFor(text)) {
      expect(q.hint).toMatch(/^Relis /);
      expect(q.aid).toBeTruthy();
    }
  });
});

it('propose des fables en vers et des récits en prose', () => {
  expect(TEXTS.some((t) => t.kind === 'vers')).toBe(true);
  expect(TEXTS.some((t) => t.kind === 'prose')).toBe(true);
  expect(new Set(TEXTS.map((t) => t.id)).size).toBe(TEXTS.length);
});
