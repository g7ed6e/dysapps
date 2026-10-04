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
              <Route path="menu" element={<p>Le menu</p>} />
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

it('Archipéo : plus de barre du haut non plus (« 3a ») ; hors du monde, le bouton Menu seul, comme Blocland', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderAt('/reglages');
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Voir mon rôle et mes succès' })).not.toBeInTheDocument();
  expect(document.querySelector('.topbar')).toBeNull();
  expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
});

it('Pas de bouton Menu sur la page qui est elle-même le menu (vue simple)', () => {
  renderAt('/menu');
  expect(screen.getByText('Le menu')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Menu' })).not.toBeInTheDocument();
});
