import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { usePlanBuilder } from './usePlanBuilder';
import { planCells, plansFor } from './world/plans';
import { IslandSheet } from './IslandSheet';

function Sheet({ biomeId, onClose }: { biomeId: string; onClose: () => void }) {
  const biome = getBiome(biomeId)!;
  const builder = usePlanBuilder(biome.id);
  return <IslandSheet biome={biome} builder={builder} onClose={onClose} />;
}

function renderSheet(biomeId: string, onClose = () => {}) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <Sheet biomeId={biomeId} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('le panneau d’une île ouverte liste ses quêtes, son Gardien verrouillé et son plan', () => {
  renderSheet('foret');
  expect(screen.getByRole('dialog', { name: /Forêt/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Mousso');
  const quests = screen.getByRole('list', { name: 'Quêtes de l’île' });
  expect(quests.querySelectorAll('a.island-quest').length).toBeGreaterThanOrEqual(3);
  expect(screen.getAllByText('Nouveau').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText('le Grand Chêne')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /le Grand Chêne/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Plan 1 \/ 3 : La cabane de Mousso/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  expect(screen.getByText(/Mes blocs/)).toHaveTextContent(/aucun/);
});

it('une île fermée montre ses quêtes verrouillées et renvoie à l’île précédente', async () => {
  const onClose = vi.fn();
  renderSheet('mine', onClose);
  expect(document.body.textContent).toContain('Construis d’abord un pont');
  expect(screen.getByRole('button', { name: /Construire/ })).toBeDisabled();
  expect(document.body.textContent).toContain('Pont vers Forêt des sons');
  expect(screen.getByRole('list', { name: 'Quêtes de l’île' }).querySelectorAll('a.island-quest')).toHaveLength(0);
  expect(screen.getAllByText('Verrouillé').length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(onClose).toHaveBeenCalled();
});

it('le panneau pose les blocs du plan avec le bouton et affiche l’avancement', async () => {
  const [plan] = plansFor('foret');
  const cells = planCells(plan);
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: cells.length } }));
  renderSheet('foret');
  await userEvent.click(screen.getByRole('button', { name: /Poser le bloc suivant/ }));
  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.village.plans[plan.id]).toHaveLength(1);
  expect(saved.inventory.bois).toBe(cells.length - 1);
  expect(screen.getByRole('progressbar', { name: /Avancement du plan/ })).toHaveAttribute('aria-valuenow', '1');
  expect(screen.getByText(/Bloc posé : 1 sur/)).toBeInTheDocument();
});
