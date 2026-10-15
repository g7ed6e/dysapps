// Les accès directs du monde (décision « Sans Menu ») dans le monde continu (GD-20, lot 1) : les commandes ne s'y livrent
// pas encore ; le bouton reste à sa place, délavé, sans compteur, et son toucher ne fait que dire « indisponible pour
// l’instant », son nom aussi.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider } from './BloclandContext';
import { EMPTY_STATE } from './engine/state';
import { COMMANDES } from './world/requests';
import { WorldShortcuts } from './WorldShortcuts';

function Where() {
  return <span data-testid="adresse">{useLocation().pathname}</span>;
}

const renderShortcuts = (requestsLater: boolean) =>
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/adventure']}>
            <WorldShortcuts a="6e" requestsOpen={false} requestsLater={requestsLater} />
            <Where />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { ...EMPTY_STATE.world, requests: [COMMANDES.find((c) => c.biome === 'french-6e-phonology')!.id] } }));
});

it('une commande arrivée : le bouton la compte et ouvre la liste', async () => {
  renderShortcuts(false);
  const bouton = within(screen.getByRole('navigation', { name: 'Reprendre' })).getByRole('button', { name: /^Commandes : 1/ });
  expect(bouton).not.toHaveAttribute('aria-disabled');
  await userEvent.setup().click(bouton);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/requests');
});

it('les commandes plus tard (le monde continu) : à sa place, délavé, sans compteur ; le bouton dit « indisponible », rien ne s’ouvre', async () => {
  renderShortcuts(true);
  const colonne = screen.getByRole('navigation', { name: 'Reprendre' });
  // Reprendre, Révisions, Commandes : les mêmes, dans le même ordre.
  expect(within(colonne).getAllByRole('button')).toHaveLength(3);
  const bouton = within(colonne).getByRole('button', { name: 'Commandes : indisponible pour l’instant' });
  expect(bouton).toHaveAttribute('aria-disabled', 'true');
  expect(bouton.querySelector('.world-bar-count')).toBeNull();
  await userEvent.setup().click(bouton);
  expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
  expect(colonne).toHaveTextContent('indisponible pour l’instant');
});
