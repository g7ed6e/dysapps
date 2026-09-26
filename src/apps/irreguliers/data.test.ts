import { LEVELS, QUESTIONS_PER_QUEST, VERBS, choicesFor, question, questionsForLevel, regularized, verbsForLevel } from './data';

describe('verbes', () => {
  it('a soixante verbes différents, vingt par niveau', () => {
    expect(VERBS).toHaveLength(60);
    expect(new Set(VERBS.map((v) => v.base)).size).toBe(VERBS.length);
    for (const { level } of LEVELS) expect(verbsForLevel(level)).toHaveLength(20);
  });

  it.each(VERBS.map((v) => [v.base, v] as const))('%s : au moins trois réponses, la bonne comprise', (_, verb) => {
    for (const form of ['preterit', 'participle'] as const) {
      const choices = choicesFor(verb, form);
      expect(choices.length).toBeGreaterThanOrEqual(3);
      expect(choices).toContain(verb[form]);
      expect(new Set(choices).size).toBe(choices.length);
    }
    expect(verb.fr).not.toContain("'");
  });

  it('forme la fausse forme en -ed comme un élève', () => {
    expect(regularized('go')).toBe('goed');
    expect(regularized('make')).toBe('maked');
    expect(regularized('cry')).toBe('cried');
    expect(regularized('pay')).toBe('payed');
  });
});

describe('générateur', () => {
  it('tire dix verbes du niveau, sans doublon', () => {
    const qs = questionsForLevel(2);
    expect(qs).toHaveLength(QUESTIONS_PER_QUEST);
    expect(new Set(qs.map((q) => q.id.split('-')[0])).size).toBe(qs.length);
    const bases = new Set(verbsForLevel(2).map((v) => v.base));
    for (const q of qs) expect(bases.has(q.id.split('-')[0])).toBe(true);
  });

  it('pose la question en français, lit le verbe en anglais, redonne les trois formes', () => {
    const go = VERBS.find((v) => v.base === 'go')!;
    const q = question(go, 'participle');
    expect(q.prompt).toBe('Participe passé de « go » (aller) ?');
    expect(q.spokenPrompt).toBe('to go');
    expect(q.spokenLang).toBe('en');
    expect(q.choicesLang).toBe('en');
    expect(q.answer).toBe('gone');
    expect(q.choices).toEqual(['gone', 'went', 'go', 'goed']);
    expect(q.explanation).toBe('go – went – gone : aller.');
  });
});
