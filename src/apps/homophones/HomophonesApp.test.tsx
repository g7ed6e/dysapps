import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import HomophonesApp from './HomophonesApp';

function renderApp() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <HomophonesApp />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('joue une quête ciblée jusqu’au résultat puis revient au choix du niveau', async () => {
  const user = userEvent.setup();
  renderApp();

  await user.click(screen.getByRole('button', { name: 'c’est / s’est' }));
  for (let i = 0; i < 8; i++) {
    expect(screen.getByText(`Question ${i + 1} / 8`)).toBeInTheDocument();
    // Toujours répondre « c’est » : bonne réponse ou correction directe (2 choix).
    await user.click(screen.getByRole('button', { name: 'c’est' }));
    await user.click(screen.getByRole('button', { name: i < 7 ? /Suivante/ : /Voir le résultat/ }));
  }
  expect(screen.getByText('50 %')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Changer de niveau/ }));
  expect(screen.getByRole('button', { name: /c’est \/ s’est.*50 %/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).apps['homophones:serie-cest'].bestScore).toBe(50);
});

it('lance une quête de niveau de 10 questions', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('button', { name: /Niveau 1 · Les bases/ }));
  expect(screen.getByText('Question 1 / 10')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Prendre un joker/ })).toBeInTheDocument();
});
