import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';


function renderPage() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => localStorage.clear());

it('remplace la section Expérimental par la section Univers', () => {
  renderPage();
  expect(screen.getByRole('group', { name: 'Univers' })).toBeInTheDocument();
  expect(screen.queryByRole('group', { name: 'Expérimental' })).not.toBeInTheDocument();
  // Un appareil neuf est dans Blocland, l'univers par défaut.
  expect(screen.getByRole('radio', { name: /^Blocland/ })).toBeChecked();
});

it('change d’univers seulement après la confirmation, qui dit ce qui reste', async () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  const user = userEvent.setup();
  renderPage();
  expect(screen.getByRole('radio', { name: /^Blocland/ })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: /^Archipéo/ }));
  expect(screen.getByRole('radio', { name: /^Blocland/ })).toBeChecked();
  expect(screen.getByRole('group', { name: /^Passer à Archipéo\s\?$/ })).toHaveTextContent('Ce qui reste : tes étoiles, tes blocs, tes plans et tes missions.');
  await user.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(screen.queryByRole('group', { name: /^Passer à Archipéo\s\?$/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: /^Archipéo/ }));
  await user.click(screen.getByRole('button', { name: 'Changer d’univers' }));
  expect(screen.getByRole('radio', { name: /^Archipéo/ })).toBeChecked();
  expect(loadJSON<{ univers?: string }>('settings', {}).univers).toBe('archipeo');
  // La progression n'est pas touchée.
  expect(loadJSON<{ xp?: number }>('progress', {}).xp).toBe(40);
});
