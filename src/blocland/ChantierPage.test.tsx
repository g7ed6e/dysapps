import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { FREE_ZONE } from './engine';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const saved = () => JSON.parse(localStorage.getItem('dysapps:blocland')!);

it('invite à gagner des blocs quand l’inventaire est vide', () => {
  renderAt('/aventure/chantier');
  expect(screen.getByText(/Ton inventaire est vide/)).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Chantier' })).toBeInTheDocument();
  // Seule la première île est ouverte au départ.
  expect(screen.getByRole('button', { name: /^Forêt des sons/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Mine des lettres/ })).toBeDisabled();
});

it('pose, empile, retire et démonte des blocs sur la zone libre d’une île', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 2, pierre: 1 } }));
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  expect(screen.getByRole('radio', { name: /Bois/ })).toHaveAttribute('aria-checked', 'true');

  await user.click(screen.getByRole('button', { name: 'Case 3, 4' }));
  expect(screen.getByRole('button', { name: 'Case 3, 4, 1 bloc' })).toBeInTheDocument();
  expect(saved().village.placed.foret).toEqual([{ x: FREE_ZONE.x + 2, y: FREE_ZONE.y + 3, z: 0, block: 'bois' }]);
  expect(saved().inventory.bois).toBe(1);

  await user.click(screen.getByRole('radio', { name: /Pierre/ }));
  await user.click(screen.getByRole('button', { name: 'Case 3, 4, 1 bloc' }));
  expect(screen.getByRole('button', { name: 'Case 3, 4, 2 blocs' })).toBeInTheDocument();
  expect(saved().village.placed.foret[1]).toEqual({ x: FREE_ZONE.x + 2, y: FREE_ZONE.y + 3, z: 1, block: 'pierre' });

  // Plus de pierre : message clair, rien de posé.
  await user.click(screen.getByRole('button', { name: 'Case 1, 1' }));
  expect(screen.getByRole('status')).toHaveTextContent(/plus de blocs de ce type/);
  expect(saved().village.placed.foret).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: /^Retirer/ }));
  await user.click(screen.getByRole('button', { name: 'Case 3, 4, 2 blocs' }));
  expect(screen.getByRole('status')).toHaveTextContent(/pierre rangé/);
  expect(saved().inventory.pierre).toBe(1);

  await user.click(screen.getByRole('button', { name: /Tout démonter/ }));
  await user.click(screen.getByRole('button', { name: /Oui, tout démonter/ }));
  expect(saved().village.placed).toEqual({});
  expect(saved().inventory).toEqual({ bois: 2, pierre: 1 });
});

it('construit sur une autre île une fois débloquée, et rend les blocs de l’ancien chantier', async () => {
  localStorage.setItem(
    'dysapps:blocland',
    JSON.stringify({ inventory: { sable: 1 }, progress: { 'foret-x': { stars: 1, attempts: 1, best: 1 } }, build: [{ x: 0, y: 0, z: 0, block: 'bois' }] }),
  );
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  expect(saved().inventory).toEqual({ sable: 1, bois: 1 });
  await user.click(screen.getByRole('button', { name: /Mine des lettres/ }));
  await user.click(screen.getByRole('radio', { name: /Sable/ }));
  screen.getByRole('button', { name: 'Case 1, 1' }).focus();
  await user.keyboard('{Enter}');
  expect(saved().village.placed).toEqual({ mine: [{ x: FREE_ZONE.x, y: FREE_ZONE.y, z: 0, block: 'sable' }] });
});

it('sans WebGL, affiche la vue simple et le signale', () => {
  renderAt('/aventure/chantier');
  expect(screen.getByText(/la 3D n’est pas disponible/)).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /Chantier en 3D/ })).not.toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Chantier' })).toBeInTheDocument();
});
