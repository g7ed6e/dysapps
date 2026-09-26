import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { WorldPage } from './WorldPage';

// Pas de WebGL dans les tests : un monde factice, qui montre l'île cadrée et laisse toucher une île.
vi.mock('./three', () => ({
  hasWebGL: () => false,
  VoxelCanvas: () => null,
  WorldCanvas: ({ focus, onPickIsland }: { focus: { island: string | null }; onPickIsland: (id: string) => void }) => (
    <div>
      <p data-testid="cadrage">{focus.island ?? 'aucune'}</p>
      <button type="button" onClick={() => onPickIsland('foret')}>
        Toucher la Forêt dans le monde
      </button>
    </div>
  ),
}));

function Where() {
  return <p data-testid="adresse">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/aventure/:biomeId?" element={<WorldPage />} />
            </Routes>
            <Where />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const sheet = () => screen.queryByRole('dialog', { name: /Forêt des sons/ });

it('replie le panneau d’une île et le rouvre, sans quitter l’île', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  expect(sheet()).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' })).toHaveAttribute('aria-pressed', 'true');

  // La croix replie le panneau : on reste sur l'île, la caméra aussi.
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');

  // Le bouton de l'île, dans la barre du bas, le rouvre ; puis le replie.
  const toggle = screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await user.click(toggle);
  expect(sheet()).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
});

it('rouvre le panneau replié quand on touche à nouveau l’île dans le monde', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(sheet()).toBeInTheDocument();
});

it('sans île ouverte, pas de panneau ni de bouton de panneau', () => {
  const { container } = renderAt('/aventure');
  expect(container.querySelector('.island-sheet')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /panneau de/ })).not.toBeInTheDocument();
});
