import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { Layout } from './Layout';

// Le monde en 3D (pas de WebGL dans les tests) : l'écran du monde est en plein écran.
vi.mock('../blocland/useImmersive', () => ({ useImmersive: () => true }));

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="adventure/:biomeId?" element={<p>Le monde</p>} />
              <Route path="reglages" element={<p>Les réglages</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('Blocland : pas de barre du haut, ni dans le monde ni hors du monde ; hors du monde, le bouton Menu seul', () => {
  const monde = renderAt('/adventure/french-6e-phonology');
  expect(screen.getByText('Le monde')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Voir mon rôle et mes succès' })).not.toBeInTheDocument();
  expect(document.querySelector('.app-shell')!.classList.contains('immersive')).toBe(true);
  monde.unmount();
  renderAt('/reglages');
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
});

it('Archipéo, en pause, garde sa barre du haut hors du monde', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderAt('/reglages');
  expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
});
