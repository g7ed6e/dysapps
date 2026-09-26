import cabinet from './data/cabinet-nuances-1.json';
import mine from './data/mine-oreille-1.json';
import foret from './data/foret-echauffement-001.json';
import type { ExerciseDef } from './types';
import { withShuffledChoices } from './shuffle';

it('mélange les réponses : la bonne n’est plus toujours en premier, le même item garde le même ordre', () => {
  const def = cabinet as unknown as ExerciseDef;
  const firsts = def.items.filter((item) => {
    const s = withShuffledChoices(def, item);
    expect([...(s.choices as string[])].sort()).toEqual([...(item.choices as string[])].sort());
    expect(withShuffledChoices(def, item).choices).toEqual(s.choices);
    return (s.choices as string[])[0] === item.answer;
  });
  expect(firsts.length).toBeLessThan(def.items.length);
  const dictee = mine as unknown as ExerciseDef;
  expect(dictee.items.some((item) => (withShuffledChoices(dictee, item).choices as string[])[0] !== item.answer)).toBe(true);
});

it('laisse les listes de nombres dans l’ordre', () => {
  const def = foret as unknown as ExerciseDef;
  for (const item of def.items) expect(withShuffledChoices(def, item).choices).toEqual(item.choices);
});
