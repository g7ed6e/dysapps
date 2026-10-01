import { act, render, screen } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { Celebrations } from './Celebrations';

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

function Plan() {
  const { completePlan } = useProgress();
  return (
    <button type="button" onClick={() => completePlan(230)}>
      Finir
    </button>
  );
}

it('un rôle nouveau s’explique et reste affiché jusqu’au toucher : le temps de lire le métier (GD-1)', () => {
  vi.useFakeTimers();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <Celebrations />
        <Plan />
      </ProgressProvider>
    </SettingsProvider>,
  );
  act(() => screen.getByRole('button', { name: 'Finir' }).click());
  // Le niveau supérieur se ferme seul…
  expect(screen.getByText(/Nouveau rôle : Maçon/)).toBeInTheDocument();
  // … comme les autres succès ; puis le succès du rôle dit le métier, et reste.
  for (let i = 0; i < 6 && !screen.queryByText(/Devenir Maçon/); i++) act(() => vi.advanceTimersByTime(5000));
  const succes = screen.getByText('Devenir Maçon : tu poses les blocs bien droits.');
  act(() => vi.advanceTimersByTime(20000));
  expect(succes).toBeInTheDocument();
  act(() => screen.getByRole('button', { name: 'Fermer' }).click());
  expect(screen.queryByText(/Devenir Maçon/)).not.toBeInTheDocument();
});
