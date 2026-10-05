import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../core/SettingsContext';
import { Tutorial, hasSeenTutorial } from './Tutorial';

const STEPS = ['Première bulle.', 'Deuxième bulle.', 'Troisième bulle.'];

function renderTuto(replay = 0) {
  return render(
    <SettingsProvider>
      <Tutorial id="test" steps={STEPS} replay={replay} />
    </SettingsProvider>,
  );
}

it('montre les bulles une à une, puis se souvient qu’on l’a vu', async () => {
  const user = userEvent.setup();
  renderTuto();
  expect(screen.getByRole('dialog')).toHaveTextContent(/Première bulle/);
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  expect(screen.getByRole('dialog')).toHaveTextContent(/Deuxième bulle/);
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  expect(screen.queryByRole('button', { name: /Suivant/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /J’ai compris/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(hasSeenTutorial('test')).toBe(true);
  // Une fois vu, il ne revient pas.
  renderTuto();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('« Passer » ferme et mémorise aussi ; « replay » le rouvre', async () => {
  const user = userEvent.setup();
  const { rerender } = renderTuto();
  await user.click(screen.getByRole('button', { name: 'Passer' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(hasSeenTutorial('test')).toBe(true);
  rerender(
    <SettingsProvider>
      <Tutorial id="test" steps={STEPS} replay={1} />
    </SettingsProvider>,
  );
  expect(screen.getByRole('dialog')).toHaveTextContent(/Première bulle/);
});
