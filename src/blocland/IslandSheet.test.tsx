import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { ChantierPage } from './ChantierPage';
import { IslandSheet } from './IslandSheet';

function renderSheet(biomeId: string, onClose = () => {}) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <IslandSheet biome={getBiome(biomeId)!} onClose={onClose} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('le panneau d’une île ouverte liste ses quêtes, son Gardien verrouillé et le chantier', () => {
  renderSheet('foret');
  expect(screen.getByRole('dialog', { name: /Forêt/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Mousso');
  const quests = screen.getByRole('list', { name: 'Quêtes de l’île' });
  expect(quests.querySelectorAll('a.island-quest').length).toBeGreaterThanOrEqual(3);
  expect(screen.getAllByText('Nouveau').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText('le Grand Chêne')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /le Grand Chêne/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Construire ici/ })).toHaveAttribute('href', '/aventure/chantier?ile=foret');
});

it('une île fermée montre ses quêtes verrouillées et renvoie à l’île précédente', async () => {
  const onClose = vi.fn();
  renderSheet('mine', onClose);
  expect(document.body.textContent).toContain('Termine d’abord une quête dans Forêt');
  expect(screen.getByRole('list', { name: 'Quêtes de l’île' }).querySelectorAll('a.island-quest')).toHaveLength(0);
  expect(screen.getAllByText('Verrouillé').length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(onClose).toHaveBeenCalled();
});

function Probe() {
  const [params] = useSearchParams();
  return <p>ile={params.get('ile')}</p>;
}

it('le chantier présélectionne l’île demandée par « ?ile= » si elle est ouverte', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: { 'foret-abattage': { stars: 1, attempts: 1, best: 0.5 } } }));
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/aventure/chantier?ile=mine']}>
            <Routes>
              <Route
                path="/aventure/chantier"
                element={
                  <>
                    <Probe />
                    <ChantierPage />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  expect(screen.getByText('ile=mine')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mine des lettres' })).toHaveAttribute('aria-pressed', 'true');
});
