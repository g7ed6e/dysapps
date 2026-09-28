import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';

it('propose la LV2, l’espagnol par défaut, et garde le choix de l’allemand ou de « Pas de LV2 »', () => {
  localStorage.clear();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  const lv2 = screen.getByRole('group', { name: 'Deuxième langue (LV2)' });
  expect(within(lv2).getByRole('radio', { name: 'Espagnol' })).toBeChecked();
  fireEvent.click(within(lv2).getByRole('radio', { name: 'Allemand' }));
  expect(within(lv2).getByRole('radio', { name: 'Allemand' })).toBeChecked();
  fireEvent.click(within(lv2).getByRole('radio', { name: 'Pas de LV2' }));
  expect(within(lv2).getByRole('radio', { name: 'Pas de LV2' })).toBeChecked();
  expect(within(lv2).queryByRole('button', { name: /Tester la voix/ })).not.toBeInTheDocument();
  // « Affichage par défaut » ne touche pas à la LV2.
  fireEvent.click(screen.getByRole('button', { name: 'Affichage par défaut' }));
  expect(within(lv2).getByRole('radio', { name: 'Pas de LV2' })).toBeChecked();
});
