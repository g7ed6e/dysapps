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

it('propose l’option latin ou grec, « Pas d’option » par défaut, indépendante de la LV2 (GD-13)', () => {
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
  const lca = screen.getByRole('group', { name: 'Option latin ou grec' });
  expect(within(lca).getByRole('radio', { name: 'Pas d’option' })).toBeChecked();
  fireEvent.click(within(lca).getByRole('radio', { name: 'Grec' }));
  expect(within(lca).getByRole('radio', { name: 'Grec' })).toBeChecked();
  // Choisir une option ne touche pas à la LV2, ni « Affichage par défaut » à l'option.
  expect(within(screen.getByRole('group', { name: 'Deuxième langue (LV2)' })).getByRole('radio', { name: 'Espagnol' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Affichage par défaut' }));
  expect(within(lca).getByRole('radio', { name: 'Grec' })).toBeChecked();
});

it('« Vue du monde » : la lumière du monde, l’heure réelle par défaut ou toujours le jour, retenue sur l’appareil', () => {
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
  const vue = screen.getByRole('group', { name: 'Vue du monde' });
  const lumiere = within(vue).getByRole('radiogroup', { name: 'La lumière du monde' });
  expect(within(lumiere).getByRole('radio', { name: 'L’heure réelle' })).toBeChecked();
  fireEvent.click(within(lumiere).getByRole('radio', { name: 'Toujours le jour' }));
  expect(within(lumiere).getByRole('radio', { name: 'Toujours le jour' })).toBeChecked();
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).worldLight).toBe('day');
});

it('« Application » : le bouton qui lance la mesure automatique', () => {
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
  expect(within(screen.getByRole('group', { name: 'Application' })).getByRole('button', { name: 'Mesurer l’appareil' })).toBeInTheDocument();
});
