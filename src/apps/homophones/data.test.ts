import { LEVELS, QUESTIONS_PER_QUEST, SETS, questionsForLevel, questionsForSet, setsForLevel } from './data';

describe('banque de phrases', () => {
  it.each(SETS.map((s) => [s.id, s] as const))('série %s cohérente', (_, set) => {
    expect([1, 2, 3]).toContain(set.level);
    expect(set.choices.length).toBeGreaterThanOrEqual(2);
    expect(new Set(set.choices).size).toBe(set.choices.length);
    expect(Object.keys(set.rules).sort()).toEqual([...set.choices].sort());
    expect(set.hint.length).toBeGreaterThan(10);
    expect(set.sentences.length).toBeGreaterThanOrEqual(8);
    for (const { text, answer } of set.sentences) {
      expect(set.choices).toContain(answer);
      // Un seul trou par phrase, jamais en début de phrase (la majuscule trahirait la réponse).
      expect(text.split('…').length - 1).toBe(1);
      expect(text.startsWith('…')).toBe(false);
      // Apostrophes typographiques partout.
      expect(text).not.toContain("'");
    }
    // Chaque réponse possible est travaillée dans au moins une phrase.
    for (const choice of set.choices) expect(set.sentences.some((s) => s.answer === choice)).toBe(true);
  });

  it('a des identifiants et des phrases uniques', () => {
    expect(new Set(SETS.map((s) => s.id)).size).toBe(SETS.length);
    const texts = SETS.flatMap((s) => s.sentences.map((x) => x.text));
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('couvre les trois niveaux', () => {
    for (const { level } of LEVELS) expect(setsForLevel(level).length).toBeGreaterThanOrEqual(4);
  });
});

describe('générateur', () => {
  it('tire une quête de niveau sans doublon, uniquement dans ce niveau', () => {
    const qs = questionsForLevel(2);
    expect(qs).toHaveLength(QUESTIONS_PER_QUEST);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    const ids = new Set(setsForLevel(2).map((s) => s.id));
    for (const q of qs) {
      expect(ids.has(q.id.split('-')[0])).toBe(true);
      expect(q.hint).toBeTruthy();
      expect(q.explanation).toBeTruthy();
    }
  });

  it('propose toutes les phrases d’une série en entraînement ciblé', () => {
    const qs = questionsForSet('peu');
    expect(qs).toHaveLength(8);
    expect(qs.every((q) => q.choices.join() === 'peu,peut,peux')).toBe(true);
    expect(questionsForSet('inconnue')).toEqual([]);
  });
});
