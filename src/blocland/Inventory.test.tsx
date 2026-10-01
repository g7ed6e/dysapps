import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { InventorySheet, READY_SHOWN } from './Inventory';
import { SchoolSheet } from './School';
import { TrophySheet } from './TrophySheet';

function renderIn(node: React.ReactNode) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>{node}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('« Tu peux construire » montre trois chantiers, celui de l’île du bonhomme en tête, et le reste derrière « Tout voir »', async () => {
  const user = userEvent.setup();
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 200, brique: 200, pierre: 200, sable: 200 } }));
  renderIn(<InventorySheet onClose={() => {}} />);
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).not.toContain('Touche une île');
  const now = screen.getByRole('list', { name: /Tu peux construire/ });
  expect(within(now).getAllByRole('link')).toHaveLength(READY_SHOWN);
  // Le bonhomme est sur la Forêt : son plan d'abord.
  expect(within(now).getAllByRole('link')[0]).toHaveTextContent('Plan de Forêt des sons');
  const all = screen.getByRole('button', { name: /^Tout voir \((\d+)\)$/ });
  const n = Number(/\((\d+)\)/.exec(all.textContent!)![1]);
  expect(n).toBeGreaterThan(READY_SHOWN);
  await user.click(all);
  expect(within(now).getAllByRole('link')).toHaveLength(n);
  expect(screen.queryByRole('button', { name: /Tout voir/ })).not.toBeInTheDocument();
});

it('rien à construire : pas de « Tout voir »', () => {
  renderIn(<InventorySheet onClose={() => {}} />);
  expect(document.body.textContent).toContain('Rien pour l’instant');
  expect(screen.queryByRole('button', { name: /Tout voir/ })).not.toBeInTheDocument();
});

it('l’école : une ligne pour les blocs, l’accueil de la créature dans un pli avec Écouter, les portes tout de suite', () => {
  renderIn(<SchoolSheet onClose={() => {}} />);
  expect(screen.getByText('Chaque mission ici donne des blocs.')).toBeInTheDocument();
  const more = document.querySelector<HTMLDetailsElement>('.school .sheet-more')!;
  expect(more).not.toHaveAttribute('open');
  expect(more.querySelector('summary')).toHaveTextContent('En savoir plus');
  expect(more.textContent).toContain('Bienvenue à l’école !');
  expect(screen.getByRole('list', { name: 'Les trois portes de l’école' })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('Une mission finie');
});

it('les trophées : l’accueil de la salle dans un pli, la salle tout de suite', () => {
  renderIn(<TrophySheet onClose={() => {}} />);
  const sheet = screen.getByRole('dialog', { name: /Trophées|trophées/ });
  const more = sheet.querySelector<HTMLDetailsElement>('.sheet-more')!;
  expect(more).not.toHaveAttribute('open');
  expect(more.querySelector('summary')).toHaveTextContent('En savoir plus');
  expect(more.textContent).toContain('La salle est vide pour l’instant.');
  expect(sheet.querySelector('.island-sheet-says')).toBeNull();
});
