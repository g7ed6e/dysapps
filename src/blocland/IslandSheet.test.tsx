import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { usePlanBuilder } from './usePlanBuilder';
import { useVehicleBuilder } from './useVehicleBuilder';
import { planCells, plansFor } from './world/plans';
import { VEHICLE_STAGES } from './world/vehicle';
import { IslandSheet } from './IslandSheet';

const onBoard = vi.fn();

function Sheet({ biomeId, onClose, highlight }: { biomeId: string; onClose: () => void; highlight?: string }) {
  const biome = getBiome(biomeId)!;
  const builder = usePlanBuilder(biome.id);
  const ship = useVehicleBuilder(biome.id);
  return <IslandSheet biome={biome} builder={builder} ship={ship} onBoard={onBoard} onClose={onClose} highlight={highlight} />;
}

function renderSheet(biomeId: string, onClose = () => {}, highlight?: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <Sheet biomeId={biomeId} onClose={onClose} highlight={highlight} />
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
  expect(document.body.textContent).toContain('Pas si vite ! Pour venir ici, construis le sentier depuis Forêt des sons : 3 blocs.');
  // Sans bloc : l'ouvrage est une ligne compacte qui dit ce qu'il manque, sans bouton grisé.
  expect(screen.queryByRole('button', { name: /Construire/ })).not.toBeInTheDocument();
  expect(document.body.textContent).toContain('Sentier vers Forêt des sons');
  expect(document.body.textContent).toContain('Encore 3 blocs (3 en tout)');
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

it('le port montre le chantier du Bloc-Navire : ses blocs, ses Gardiens, puis le bouton pour embarquer', async () => {
  const [coque] = VEHICLE_STAGES;
  renderSheet('plaine');
  expect(screen.getByText(/Le Bloc-Navire — Étape 1 \/ 3 : La coque et la voile/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Avancement du Bloc-Navire' })).toHaveAttribute('aria-valuenow', '0');
  expect(document.body.textContent).toContain('Gardiens : encore 3 à vaincre dans les Basses Terres pour la voile.');
  expect(screen.queryByRole('button', { name: /Embarquer/ })).not.toBeInTheDocument();
  // Pas de section navire sur une île qui n'est pas un port.
  expect(screen.queryByText(/Le Bloc-Navire —/, { selector: 'h3' })).toBeInTheDocument();
  // Tout posé et trois Gardiens vaincus : on peut embarquer.
  const plans = { [coque.id]: planCells(coque).map((c) => c.key) };
  const progress = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress, village: { plans, bridges: ['foret-mine'] } }));
  document.body.innerHTML = '';
  renderSheet('plaine');
  expect(document.body.textContent).toContain('Gardiens : c’est fait ! 3 sur 3, la voile est là.');
  expect(document.body.textContent).toContain('Le Bloc-Navire est prêt : embarque vers les Collines du Large !');
  await userEvent.click(screen.getByRole('button', { name: /Embarquer vers l’archipel de 5e — Les Collines du Large/ }));
  expect(onBoard).toHaveBeenCalledWith('5e', false);
});

it('une île d’un autre archipel dit ce qu’il manque au Bloc-Navire, sans ouvrage à proposer', () => {
  renderSheet('marche');
  expect(document.body.textContent).toContain('Pas si vite ! Mon île est dans les Collines du Large, de l’autre côté de la mer.');
  expect(document.body.textContent).toContain('Finis le Bloc-Navire sur Plaine des nombres');
  expect(screen.queryByText('Ouvrages')).not.toBeInTheDocument();
});

it('l’ouvrage touché dans le monde est mis en avant dans la liste', () => {
  renderSheet('foret', () => {}, 'foret-mine');
  const item = document.querySelector('[data-bridge="foret-mine"]');
  expect(item).not.toBeNull();
  expect(item!.className).toContain('bridge-highlight');
  expect(document.querySelectorAll('.bridge-highlight')).toHaveLength(1);
});
