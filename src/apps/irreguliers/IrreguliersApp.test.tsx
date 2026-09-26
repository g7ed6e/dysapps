import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import IrreguliersApp from './IrreguliersApp';

it('lance une quête de 10 verbes, les réponses marquées en anglais', async () => {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <IrreguliersApp />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  await user.click(screen.getByRole('button', { name: /Niveau 1 · Les indispensables/ }));
  expect(screen.getByText('Question 1 / 10')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^(Prétérit|Participe passé) de « \w+ »/);
  const choices = screen.getAllByRole('button').filter((b) => b.classList.contains('choice'));
  expect(choices.length).toBeGreaterThanOrEqual(3);
  for (const c of choices) expect(c.querySelector('[lang="en"]')).not.toBeNull();
  expect(screen.getByRole('button', { name: /Prendre un joker/ })).toBeInTheDocument();
});
