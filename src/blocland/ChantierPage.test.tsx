import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { BloclandProvider } from './BloclandContext';
import { FREE_ZONE } from './engine';
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

it('propose le plan de l’île et pose ses blocs avec le bouton, jusqu’à la récompense', async () => {
  const plan = plansFor('foret')[0];
  const n = planCells(plan).length;
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: n } }));
  const user = userEvent.setup();
  renderAt('/aventure/chantier');
  expect(screen.getByRole('heading', { name: /Plan 1 \/ 3 : La cabane de Mousso/ })).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: /Avancement du plan/ })).toHaveAttribute('aria-valuenow', '0');
  const button = () => screen.getByRole('button', { name: /Poser le bloc suivant/ });
  await user.click(button());
  expect(screen.getByRole('progressbar', { name: /Avancement du plan/ })).toHaveAttribute('aria-valuenow', '1');
  expect(saved().village.plans[plan.id]).toHaveLength(1);
  for (let i = 1; i < n; i++) await user.click(button());
  expect(screen.getByText(/La cabane de Mousso : terminé/)).toBeInTheDocument();
  expect(saved().inventory).toMatchObject({ bois: 0, pierre: 3, toit: 9, porte: 1, lanterne: 1 });
  expect(saved().village.journal).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).plansCompleted).toBe(1);
  // Le plan suivant de l'île prend la suite, avec le kit du coffre (il manque encore 2 bois).
  expect(screen.getByRole('heading', { name: /Plan 2 \/ 3 : Le toit de la cabane/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeEnabled();
  expect(screen.getByRole('list', { name: /Blocs qu’il manque/ })).toHaveTextContent(/2 bois/);
  expect(screen.getByRole('region', { name: /Journal du village/ })).toHaveTextContent(/La cabane de Mousso/);
});

it('sans le bon bloc, le plan dit où le gagner', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { pierre: 2 } }));
  renderAt('/aventure/chantier');
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  expect(screen.getByRole('list', { name: /Blocs qu’il manque/ })).toHaveTextContent(/bois · à gagner dans Forêt des sons/);
});
