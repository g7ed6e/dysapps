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
              <Route path="aventure/:biomeId?" element={<p>Le monde</p>} />
              <Route path="reglages" element={<p>Les réglages</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('sur l’écran du monde, pas de barre du haut : le menu Pause la remplace ; elle revient hors du monde', () => {
  const monde = renderAt('/aventure/foret');
  expect(screen.getByText('Le monde')).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Voir mon rôle et mes succès' })).not.toBeInTheDocument();
  expect(document.querySelector('.app-shell')!.classList.contains('immersive')).toBe(true);
  monde.unmount();
  renderAt('/reglages');
  expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
});
