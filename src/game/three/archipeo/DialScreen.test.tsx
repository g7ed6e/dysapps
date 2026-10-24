// Le geste « régler » (GD-26) : un cran par appui, la valeur cachée jusqu'à « Valider », la réponse réglée jugée comme
// un choix ; et la correction d'une manche à geste dit l'explication de chaque fiche mal rangée.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../../../core/SettingsContext';
import { powerOfTenReverse } from '../../exercises/college/powers';
import { EMPTY_RANGEMENT, drop, take } from '../../world/continu/rangement';
import type { ScenetteLayout } from '../../world/continu/scenette';
import { DialScreen, dialOf } from './DialScreen';
import { QuestionContext } from './placeScreen';
import { sortAnswer } from './SortScreen';

const item = { ...powerOfTenReverse(() => 0.5), placeScene: { kind: 'column' } };
const dial = dialOf(item)!;

function play(onAnswer = vi.fn()) {
  const layout = { low: false, slots: [], aid: null, scenette: { validate: null } } as unknown as ScenetteLayout;
  render(
    <SettingsProvider>
      <QuestionContext.Provider value={{ place: 'forge' as never, layout, show: () => {}, instruction: '', simple: true, lowScreen: false }}>
        <DialScreen items={[item]} answered={null} onAnswer={onAnswer} onHelp={() => {}} level={1} exerciseId="maths-4e-powers-powers-1" />
      </QuestionContext.Provider>
    </SettingsProvider>,
  );
  return onAnswer;
}

it('règle un coup par appui, sans montrer la valeur, puis juge le nombre de coups', async () => {
  expect(dial.min).toBe(1);
  expect(dial.max).toBe(7);
  const onAnswer = play();
  const user = userEvent.setup();
  const validate = screen.getByRole('button', { name: /Valider/ });
  expect(validate).toBeDisabled();
  for (let i = 0; i < dial.answer; i++) await user.click(screen.getByRole('button', { name: 'Un coup de plus' }));
  expect(screen.getByRole('status')).toHaveTextContent(`${dial.answer} coups sur 7`);
  expect(screen.getByRole('status')).not.toHaveTextContent('=');
  await user.click(validate);
  expect(onAnswer).toHaveBeenCalledWith({ results: [{ key: item.key, correct: true }], detail: { chosen: String((item as Record<string, unknown>).answer) } });
});

it('ne règle pas sous zéro ni au-delà de sept coups', async () => {
  play();
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Un coup de moins' })).toBeDisabled();
  for (let i = 0; i < 8; i++) await user.click(screen.getByRole('button', { name: 'Un coup de plus' }));
  expect(screen.getByRole('status')).toHaveTextContent('7 coups sur 7');
  expect(screen.getByRole('button', { name: 'Un coup de plus' })).toBeDisabled();
});

it('dit l’explication de chaque fiche mal rangée, une à une', () => {
  const fiches = [
    { key: 'a', gesture: 'ranger', subject: 'la baleine', choices: ['poisson', 'mammifère'], answer: 'mammifère', explanation: 'La baleine a des mamelles.' },
    { key: 'b', gesture: 'ranger', subject: 'le manchot', choices: ['oiseau', 'poisson'], answer: 'oiseau', explanation: 'Le manchot a des plumes.' },
  ];
  const s = drop(take(drop(take(EMPTY_RANGEMENT, 'a'), 'poisson'), 'b'), 'poisson');
  expect(sortAnswer(fiches, s)).toEqual({
    results: [
      { key: 'a', correct: false },
      { key: 'b', correct: false },
    ],
    detail: { explanation: 'La baleine a des mamelles. Le manchot a des plumes.' },
  });
});
