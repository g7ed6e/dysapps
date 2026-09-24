import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';

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
});

it('pose, empile, retire et démonte des blocs', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 2, pierre: 1 } }));
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  expect(screen.getByRole('radio', { name: /Bois/ })).toHaveAttribute('aria-checked', 'true');

  await user.click(screen.getByRole('button', { name: 'Case 3, 4' }));
  expect(screen.getByRole('button', { name: 'Case 3, 4, 1 bloc' })).toBeInTheDocument();
  expect(saved().build).toEqual([{ x: 2, y: 3, z: 0, block: 'bois' }]);
  expect(saved().inventory.bois).toBe(1);

  await user.click(screen.getByRole('radio', { name: /Pierre/ }));
  await user.click(screen.getByRole('button', { name: 'Case 3, 4, 1 bloc' }));
  expect(screen.getByRole('button', { name: 'Case 3, 4, 2 blocs' })).toBeInTheDocument();
  expect(saved().build[1]).toEqual({ x: 2, y: 3, z: 1, block: 'pierre' });

  // Plus de pierre : message clair, rien de posé.
  await user.click(screen.getByRole('button', { name: 'Case 1, 1' }));
  expect(screen.getByRole('status')).toHaveTextContent(/plus de blocs de ce type/);
  expect(saved().build).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: /Retirer/ }));
  await user.click(screen.getByRole('button', { name: 'Case 3, 4, 2 blocs' }));
  expect(screen.getByRole('status')).toHaveTextContent(/pierre rangé/);
  expect(saved().inventory.pierre).toBe(1);

  await user.click(screen.getByRole('button', { name: /Tout démonter/ }));
  await user.click(screen.getByRole('button', { name: /Oui, tout démonter/ }));
  expect(saved().build).toEqual([]);
  expect(saved().inventory).toEqual({ bois: 2, pierre: 1 });
});

it('se pose aussi au clavier', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { sable: 1 } }));
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  screen.getByRole('button', { name: 'Case 1, 1' }).focus();
  await user.keyboard('{Enter}');
  expect(saved().build).toEqual([{ x: 0, y: 0, z: 0, block: 'sable' }]);
});

it('sans WebGL, affiche la vue simple et le signale', () => {
  renderAt('/aventure/chantier');
  expect(screen.getByText(/la 3D n’est pas disponible/)).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'Chantier en 3D' })).not.toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Chantier' })).toBeInTheDocument();
});
