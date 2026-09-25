import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { planCells, plansFor } from './world/plans';

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

it('invite à gagner des blocs quand l’inventaire est vide, et ne propose plus de zone libre', () => {
  renderAt('/aventure/chantier');
  expect(screen.getByText(/Ton inventaire est vide/)).toBeInTheDocument();
  expect(screen.getByRole('group', { name: 'Chantier' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Forêt des sons/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Mine des lettres/ })).toBeDisabled();
  expect(screen.queryByRole('button', { name: /Retirer/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/tapis jaune|zone libre/i)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
});

it('montre l’inventaire en lecture et pose les blocs du plan avec le bouton', async () => {
  const [plan] = plansFor('foret');
  const cells = planCells(plan);
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: cells.length, pierre: 1 } }));
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  expect(screen.getByRole('list', { name: 'Blocs dans l’inventaire' })).toHaveTextContent(/Bois/);
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Poser le bloc suivant/ }));
  expect(saved().village.plans[plan.id]).toHaveLength(1);
  expect(saved().inventory.bois).toBe(cells.length - 1);
  expect(screen.getByRole('status')).toHaveTextContent(/1 bloc posé sur/);
});

it('les anciens blocs de la zone libre reviennent dans l’inventaire', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { sable: 1 }, village: { placed: { foret: [{ x: 0, y: 0, z: 0, block: 'bois' }] } } }));
  renderAt('/aventure/chantier');
  expect(saved().inventory).toEqual({ sable: 1, bois: 1 });
  expect(saved().village.placed).toBeUndefined();
});
