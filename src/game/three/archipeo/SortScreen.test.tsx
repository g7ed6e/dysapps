// La correction du geste « ranger » est celle de l'Enclos de la grille, mot pour mot (avis d'architecture, lot L4) :
// le même choix, rendu par EnclosureScreen et par sortAnswer, donne les mêmes résultats et le même détail.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../../../core/SettingsContext';
import { EnclosureScreen } from '../../exercises/EnclosureScreen';
import { loadAllExercises } from '../../exercises';
import { EMPTY_RANGEMENT, drop, take } from '../../world/continu/rangement';
import type { ScenetteLayout } from '../../world/continu/scenette';
import { QuestionContext } from './placeScreen';
import { SortScreen, sortAnswer } from './SortScreen';

const ALL = await loadAllExercises();

it.each([1, 2])('niveau %i : les résultats et le détail sont ceux d’EnclosureScreen', async (level) => {
  const items = ALL.find((e) => e.id === `french-6e-grammar-spelling-word-classes-${level}`)!.items.slice(0, 4);
  // Le premier au singulier, les autres au pluriel : une erreur au moins, quelles que soient les réponses.
  const pick = (i: number) => (i === 0 ? 'singulier' : 'pluriel');
  const onAnswer = vi.fn();
  render(
    <SettingsProvider>
      <EnclosureScreen items={items} answered={null} onAnswer={onAnswer} onHelp={() => {}} level={1} exerciseId="" />
    </SettingsProvider>,
  );
  const user = userEvent.setup();
  for (const [i, it] of items.entries()) {
    const group = screen.getByRole('group', { name: `Verbe pour ${String(it.subject)}` });
    await user.click(within(group).getAllByRole('button')[pick(i) === 'pluriel' ? 1 : 0]);
  }
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  let s = EMPTY_RANGEMENT;
  items.forEach((it, i) => (s = drop(take(s, it.key), pick(i))));
  expect(sortAnswer(items, s)).toEqual(onAnswer.mock.calls[0][0]);
});

it('au Donjon, le panier de l’Hégire se pose devant la porte de son siècle (placer, GD-26)', async () => {
  const item = ALL.find((e) => e.id === 'history-5e-middle-ages-christendoms-islam-2')!.items.find((it) => it.gesture === 'placer')!;
  const layout = { low: false, slots: [], aid: null, scenette: { validate: null } } as unknown as ScenetteLayout;
  const onAnswer = vi.fn();
  render(
    <SettingsProvider>
      <QuestionContext.Provider value={{ place: 'donjon' as never, layout, show: () => {}, instruction: '', simple: true, lowScreen: false, quiet: false }}>
        <SortScreen items={[{ ...item, placeScene: { kind: 'column' } }]} answered={null} onAnswer={onAnswer} onHelp={() => {}} level={2} exerciseId="history-5e-middle-ages-christendoms-islam-2" />
      </QuestionContext.Provider>
    </SettingsProvider>,
  );
  const user = userEvent.setup();
  expect(screen.getAllByText('622 : l’Hégire').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: /au VIIe siècle/ }));
  await user.click(screen.getByRole('button', { name: /Valider/ }));
  expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ results: [{ key: item.key, correct: true }] }));
});
