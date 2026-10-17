// La ligne de l'habitant (GD-20, point 4, lot L1) : sa commande prête (« Livrer »), ses révisions (« Reprendre »), ce qui
// manque (« Y aller ») ; une seule à la fois ; un bouton plein seulement pour la suggestion. La liste « Commandes » du
// monde ouvert : une ligne par commande ouverte. Le panneau du lieu : le focus sur le bouton de la ligne de l'habitant.
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { sanitizeState } from '../../engine';
import { lieuDAssemblage } from '../../world/assembly';
import { PLACES } from '../../world/continu/plan6e';
import { COMMANDES } from '../../world/requests';
import { CommandsSheet, HabitantLine } from './HabitantLine';
import { PlacePanel } from './PlacePanel';
import { commandLines, habitantLineOf, placeOfCommande, sourceOf } from './remiseOf';

const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
const boutique = COMMANDES.find((c) => placeOfCommande(c) === 'quais')!;
const ENTREPOT = lieuDAssemblage('archipeo').a;

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

it('prête : le rôle, « Livre 3 blocs de terre au Phare. », « Réécouter » et « Livrer », qui ouvre la remise ; plein seulement s’il porte la suggestion', async () => {
  const state = sanitizeState({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } });
  const onDeliver = vi.fn();
  const { rerender } = wrap(<HabitantLine place="phare" line={habitantLineOf(state, 'phare', ENTREPOT)} suggested={potager.id} onDeliver={onDeliver} onGo={vi.fn()} />);
  const group = screen.getByRole('group');
  expect(group).toHaveTextContent('La gardienne du phare');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Livre 3 blocs de terre au Phare\./);
  expect(within(group).queryByRole('button', { name: /Y aller/ })).toBeNull();
  expect(within(group).getByRole('button', { name: /Livrer/ })).toHaveClass('primary');
  await userEvent.setup().click(within(group).getByRole('button', { name: /Livrer/ }));
  expect(onDeliver).toHaveBeenCalledWith(potager.id);
  // Une autre suggestion : « Livrer » reste simple.
  rerender(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <HabitantLine place="phare" line={habitantLineOf(state, 'phare', ENTREPOT)} suggested={null} onDeliver={onDeliver} onGo={vi.fn()} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  expect(screen.getByRole('button', { name: /Livrer/ })).not.toHaveClass('primary');
});

it('il manque des blocs : la demande et « Y aller » vers le lieu de la ressource, jamais plein', async () => {
  const state = sanitizeState({ stock: {}, world: { links: [], requests: [potager.id] } });
  const onGo = vi.fn();
  const line = habitantLineOf(state, 'phare', ENTREPOT);
  wrap(<HabitantLine place="phare" line={line} suggested={potager.id} onDeliver={vi.fn()} onGo={onGo} />);
  const group = screen.getByRole('group');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Il me faut 3 blocs de terre\. C’est pour le potager\. Joue une mission aux Filets\./);
  const go = within(group).getByRole('button', { name: 'Y aller : Les Filets' });
  expect(go).not.toHaveClass('primary');
  await userEvent.setup().click(go);
  expect(onGo).toHaveBeenCalledWith({ place: 'filets' });
});

it('un bloc assemblé : « Y aller » dit le nom entier du lieu d’assemblage, celui de la grille', () => {
  const assemblee = COMMANDES.find((c) => placeOfCommande(c) && sourceOf(c) && 'port' in sourceOf(c)!)!;
  const place = placeOfCommande(assemblee)!;
  const state = sanitizeState({ stock: {}, world: { links: [], requests: [assemblee.id] } });
  wrap(<HabitantLine place={place} line={habitantLineOf(state, place, ENTREPOT)} suggested={null} onDeliver={vi.fn()} onGo={vi.fn()} />);
  const group = screen.getByRole('group');
  expect(group.textContent).toMatch(/à l’Entrepôt des matériaux\./);
  expect(within(group).getByRole('button', { name: 'Y aller : L’Entrepôt des matériaux' })).toBeInTheDocument();
});

it('rien à dire : pas de ligne', () => {
  const { container } = wrap(<HabitantLine place="phare" line={null} suggested={null} onDeliver={vi.fn()} onGo={vi.fn()} />);
  expect(container.querySelector('.habitant-line')).toBeNull();
});

it('le panneau du lieu : le focus sur le bouton de la ligne de l’habitant, pas sur la première mission ; au retour d’une mission, sur sa ligne', () => {
  const state = sanitizeState({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } });
  const phare = PLACES.find((p) => p.id === 'phare')!;
  const missions = [
    { ile: phare.island, mission: 'a', etat: 'new' as const },
    { ile: phare.island, mission: 'b', etat: 2 },
  ];
  const panel = (focus: string | null) => (
    <PlacePanel place={phare} missions={missions} suggested={null} focus={focus} onPlay={vi.fn()} onClose={vi.fn()} habitant={<HabitantLine place="phare" line={habitantLineOf(state, 'phare', ENTREPOT)} suggested={potager.id} onDeliver={vi.fn()} onGo={vi.fn()} />} />
  );
  const { unmount } = wrap(panel(null));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Livrer/ }));
  unmount();
  wrap(panel('b'));
  expect(document.activeElement).not.toBe(screen.getByRole('button', { name: /Livrer/ }));
  expect(document.activeElement?.closest('li')).not.toBeNull();
});

it('la liste « Commandes » : chaque commande ouverte, sa phrase, « Y aller » vers l’habitant qui attend sa livraison', async () => {
  const state = sanitizeState({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [boutique.id, potager.id] } });
  const onGo = vi.fn();
  const onClose = vi.fn();
  wrap(<CommandsSheet lines={commandLines(state, ENTREPOT)} suggested={potager.id} onGo={onGo} onClose={onClose} />);
  const sheet = screen.getByRole('dialog', { name: /Commandes/ });
  const rows = within(sheet).getAllByRole('listitem');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent('Le docker');
  expect(rows[1]).toHaveTextContent('La gardienne du phare');
  // Seul « Y aller » de la commande que porte la suggestion est plein.
  expect(within(rows[0]).getByRole('button', { name: /Y aller/ })).not.toHaveClass('primary');
  expect(within(rows[1]).getByRole('button', { name: 'Y aller : Le Phare' })).toHaveClass('primary');
  await userEvent.setup().click(within(rows[1]).getByRole('button', { name: 'Y aller : Le Phare' }));
  expect(onGo).toHaveBeenCalledWith({ place: 'phare' });
  await userEvent.setup().keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});
