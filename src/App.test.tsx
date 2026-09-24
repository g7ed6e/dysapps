import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('affiche les matières sur l’accueil', () => {
  renderAt('/');
  expect(screen.getByRole('link', { name: /Français/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Maths/ })).toBeInTheDocument();
});

it('liste les activités d’une matière', () => {
  renderAt('/matiere/maths');
  expect(screen.getByText('Fractions')).toBeInTheDocument();
});

it('applique et sauvegarde les réglages', async () => {
  const user = userEvent.setup();
  renderAt('/reglages');
  await user.click(screen.getByLabelText('BD nuit'));
  expect(document.documentElement.dataset.theme).toBe('nuit');
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).theme).toBe('nuit');
});

it('redirige l’ancienne adresse de progression vers les succès', () => {
  renderAt('/progression');
  expect(screen.getByRole('heading', { name: /Succès/ })).toBeInTheDocument();
});

it('affiche une page introuvable', () => {
  renderAt('/nimporte-quoi');
  expect(screen.getByText(/Zone introuvable/)).toBeInTheDocument();
});
