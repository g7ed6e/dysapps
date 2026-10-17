// La ligne de l'habitant (GD-20, point 4, lot L1) : sa commande prête (« Livrer »), ses révisions (« Reprendre »), ce qui
// manque (« Y aller ») ; une seule à la fois. La liste « Commandes » du monde ouvert : une ligne par commande ouverte.
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { sanitizeState } from '../../engine';
import { COMMANDES } from '../../world/requests';
import { CommandsSheet, HabitantLine } from './HabitantLine';
import { commandLines, habitantLineOf, placeOfCommande } from './remiseOf';

const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
const boutique = COMMANDES.find((c) => placeOfCommande(c) === 'quais')!;
const ESCALE = 'Le Chantier de l’Escale';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
});

function wrap(ui: ReactNode) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('prête : le rôle, « Livre les … au Phare. », « Réécouter » et « Livrer », qui ouvre la remise', async () => {
  const state = sanitizeState({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } });
  const onDeliver = vi.fn();
  wrap(<HabitantLine place="phare" line={habitantLineOf(state, 'phare', ESCALE)} onDeliver={onDeliver} onGo={vi.fn()} />);
  const group = screen.getByRole('group');
  expect(group).toHaveTextContent('La gardienne du phare');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Livre les 3 blocs de terre au Phare\./);
  expect(within(group).queryByRole('button', { name: /Y aller/ })).toBeNull();
  await userEvent.setup().click(within(group).getByRole('button', { name: /Livrer/ }));
  expect(onDeliver).toHaveBeenCalledWith(potager.id);
});

it('il manque des blocs : la demande et « Y aller » vers le lieu de la ressource', async () => {
  const state = sanitizeState({ stock: {}, world: { links: [], requests: [potager.id] } });
  const onGo = vi.fn();
  const line = habitantLineOf(state, 'phare', ESCALE);
  wrap(<HabitantLine place="phare" line={line} onDeliver={vi.fn()} onGo={onGo} />);
  const group = screen.getByRole('group');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Il me faut 3 blocs de terre pour le potager\. Joue une mission aux Filets\./);
  await userEvent.setup().click(within(group).getByRole('button', { name: /Y aller/ }));
  expect(onGo).toHaveBeenCalledWith({ place: 'filets' });
});

it('rien à dire : pas de ligne', () => {
  const { container } = wrap(<HabitantLine place="phare" line={null} onDeliver={vi.fn()} onGo={vi.fn()} />);
  expect(container.querySelector('.habitant-line')).toBeNull();
});

it('la liste « Commandes » : chaque commande ouverte, sa phrase, « Y aller » vers l’habitant qui attend sa livraison', async () => {
  const state = sanitizeState({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [boutique.id, potager.id] } });
  const onGo = vi.fn();
  const onClose = vi.fn();
  wrap(<CommandsSheet lines={commandLines(state, ESCALE)} onGo={onGo} onClose={onClose} />);
  const sheet = screen.getByRole('dialog', { name: /Commandes/ });
  const rows = within(sheet).getAllByRole('listitem');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent('Le docker');
  expect(rows[1]).toHaveTextContent('La gardienne du phare');
  await userEvent.setup().click(within(rows[1]).getByRole('button', { name: 'Y aller : Le Phare' }));
  expect(onGo).toHaveBeenCalledWith({ place: 'phare' });
  await userEvent.setup().keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});
