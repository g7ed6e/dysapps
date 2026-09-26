import { LEVELS, QUESTIONS_PER_QUEST, THEMES, questionsForLevel, questionsForTheme } from './data';

describe('thèmes', () => {
  it.each(THEMES.map((t) => [t.id, t] as const))('thème %s cohérent', (_, theme) => {
    expect(theme.label.length).toBeGreaterThan(3);
    expect(theme.words.length).toBeGreaterThanOrEqual(8);
    expect(new Set(theme.words.map((w) => w.en)).size).toBe(theme.words.length);
    // Deux mots d'un même thème ne partagent pas leur sens : une seule bonne réponse.
    expect(new Set(theme.words.map((w) => w.fr)).size).toBe(theme.words.length);
    for (const word of theme.words) {
      expect(word.traps).toHaveLength(2);
      expect(new Set([word.en, ...word.traps]).size).toBe(3);
      // Un piège d'orthographe n'est pas un autre mot du thème.
      for (const trap of word.traps) expect(theme.words.map((w) => w.en)).not.toContain(trap);
      // Apostrophes typographiques partout.
      expect(word.fr).not.toContain("'");
    }
  });

  it('a douze thèmes aux identifiants uniques', () => {
    expect(THEMES).toHaveLength(12);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });
});

describe('générateur', () => {
  it.each(LEVELS.map((l) => [l.level] as const))('niveau %i : dix mots différents, la réponse parmi les choix', (level) => {
    const qs = questionsForLevel(level);
    expect(qs).toHaveLength(QUESTIONS_PER_QUEST);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.explanation).toMatch(/ = /);
    }
  });

  it('lit le mot anglais en voix anglaise, et le français en voix française', () => {
    const [l1] = questionsForLevel(1, 1);
    expect(l1.promptLang).toBe('en');
    expect(l1.choicesLang).toBeUndefined();
    const [l2] = questionsForLevel(2, 1);
    expect(l2.promptLang).toBeUndefined();
    expect(l2.choicesLang).toBe('en');
    const [l3] = questionsForLevel(3, 1);
    // Le sens est affiché, le mot anglais est lu : il n'est pas écrit dans l'énoncé.
    expect(l3.spokenLang).toBe('en');
    expect(l3.spokenPrompt).toBe(l3.answer);
    expect(l3.prompt).not.toContain(l3.answer);
    expect(l3.choices).toHaveLength(3);
  });

  it('révise tout un thème', () => {
    const qs = questionsForTheme('animaux');
    expect(qs).toHaveLength(8);
    expect(questionsForTheme('inconnu')).toEqual([]);
  });
});
