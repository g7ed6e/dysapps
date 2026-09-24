import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import TablesApp from './TablesApp';

function renderApp() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <TablesApp />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('montre la grille de points avec le joker, puis joue la table de 7 jusqu’au bout', async () => {
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('button', { name: 'Table de 7' }));

  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Prendre un joker/ }));
  expect(screen.getByRole('img', { name: /rangées de 7 points|rangées de \d+ points/ })).toBeInTheDocument();

  for (let i = 0; i < 10; i++) {
    const prompt = screen.getByRole('heading', { level: 2 }).textContent!.replace(/\s/g, '');
    const [a, b] = prompt.split('=')[0].split('×').map(Number);
    await user.click(screen.getByRole('button', { name: String(a * b) }));
    await user.click(screen.getByRole('button', { name: i < 9 ? /Suivante/ : /Voir le résultat/ }));
  }
  // Première question avec joker : 0,5 point ; les 9 autres au premier essai.
  expect(screen.getByText('95 %')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Changer de quête/ }));
  expect(screen.getByRole('button', { name: 'Table de 7, record 95 %' })).toBeInTheDocument();
});
