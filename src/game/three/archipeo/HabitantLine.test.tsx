// La ligne de l'habitant (GD-20, point 4, lot L1) : sa commande prête (« Livrer »), ses révisions (« Reprendre »), ce qui
// manque (« Y aller ») ; une seule à la fois ; un bouton plein seulement pour la suggestion. La liste « Commandes » du
// monde ouvert : une ligne par commande ouverte. Le panneau du lieu : le focus sur le bouton de la ligne de l'habitant.
// Lot L2 : l'étape d'entraide (« Donner », « Apporter ») juste après la commande prête, avant les révisions ; ce qui
// manque pour donner en dernier ; « Reprendre » jamais plein (la suggestion ne le porte jamais) ; l'entraide en tête de
// la liste « Commandes ». Lot L3 : « Reprendre » lance la révision dans la scène du lieu (`onReprendre`).
import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { sanitizeState, todayISO } from '../../engine';
import { CATALOG } from '../../exercises';
import { STORIES } from '../../world/stories';
import { lieuDAssemblage } from '../../world/assembly';
import { PLACES } from '../../world/continu/plan6e';
import { COMMANDES } from '../../world/requests';
import { CommandsSheet, HabitantLine } from './HabitantLine';
import { PlacePanel } from './PlacePanel';
import { commandLines, entraideLineOf, entraideListLine, habitantLineOf, placeOfCommande, sourceOf } from './remiseOf';

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

const lanterne = STORIES.find((x) => x.id === 'story-6e-1')!;
const avecLanterne = (step: number, stock: Record<string, number> = {}, requests: string[] = []) => sanitizeState({ stock, world: { links: [], requests, stories: [{ id: lanterne.id, step }] } });
/** Une révision due au Phare (l'île de Mousso), dans la sauvegarde que lit la ligne. */
function revisionDueAuPhare() {
  const syllabes = CATALOG.find((e) => e.biome === PLACES.find((p) => p.id === 'phare')!.island && e.type === 'syllables')!;
  localStorage.setItem('dysapps:game', JSON.stringify({ spaced: [{ itemId: `${syllabes.id}:cabane`, due: todayISO(), stage: 0, streak: 0 }], progress: { [syllabes.id]: { stars: 1, attempts: 1, best: 0.3 } } }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'map-reshaped': true, 'baleine-6e-arrivee': true, 'baleine-6e-ouvrage': true }));
}

it('« Apporter » : la phrase de l’étape et son bouton, avant les révisions dues ; plein seulement s’il porte la suggestion', async () => {
  revisionDueAuPhare();
  const state = avecLanterne(2);
  const onEntraide = vi.fn();
  wrap(<HabitantLine place="phare" line={null} entraide={entraideLineOf(state, 'phare', ENTREPOT)} suggested={lanterne.id} onDeliver={vi.fn()} onEntraide={onEntraide} onGo={vi.fn()} />);
  const group = screen.getByRole('group');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Apporte la lanterne au Phare\./);
  expect(within(group).queryByRole('link', { name: /Reprendre/ })).toBeNull();
  const bouton = within(group).getByRole('button', { name: /Apporter/ });
  expect(bouton).toHaveClass('primary');
  await userEvent.setup().click(bouton);
  expect(onEntraide).toHaveBeenCalledWith(lanterne.id);
});

it('la commande prête passe avant l’étape d’entraide ; une seule ligne à la fois', () => {
  const state = avecLanterne(2, { [potager.block]: potager.count }, [potager.id]);
  wrap(<HabitantLine place="phare" line={habitantLineOf(state, 'phare', ENTREPOT)} entraide={entraideLineOf(state, 'phare', ENTREPOT)} suggested={null} onDeliver={vi.fn()} onGo={vi.fn()} />);
  expect(screen.getAllByRole('group')).toHaveLength(1);
  expect(screen.getByRole('button', { name: /Livrer/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Apporter/ })).toBeNull();
});

it('les révisions dues : « Reprendre » simple dans le monde ouvert, avant ce qui manque pour donner', () => {
  revisionDueAuPhare();
  wrap(<HabitantLine place="phare" line={null} suggested={null} onDeliver={vi.fn()} onGo={vi.fn()} />);
  const reprendre = screen.getByRole('link', { name: /Reprendre/ });
  expect(reprendre).not.toHaveClass('primary');
  expect(screen.getByRole('button', { name: 'Plus tard' })).toBeInTheDocument();
});

it('dans le monde ouvert, « Reprendre » lance la révision dans la scène du lieu (lot L3) : un bouton, simple, jamais un lien', async () => {
  revisionDueAuPhare();
  const onReprendre = vi.fn();
  wrap(<HabitantLine place="phare" line={null} suggested={null} onDeliver={vi.fn()} onReprendre={onReprendre} onGo={vi.fn()} />);
  expect(screen.queryByRole('link', { name: /Reprendre/ })).toBeNull();
  const reprendre = screen.getByRole('button', { name: /Reprendre/ });
  expect(reprendre).not.toHaveClass('primary');
  await userEvent.setup().click(reprendre);
  expect(onReprendre).toHaveBeenCalledTimes(1);
});

it('ce qui manque pour donner : la demande, « Y aller » vers le lieu de la ressource, jamais plein', async () => {
  const state = avecLanterne(1, { 'french-6e-phonology': 1 });
  const onGo = vi.fn();
  wrap(<HabitantLine place="quais" line={null} entraide={entraideLineOf(state, 'quais', ENTREPOT)} suggested={lanterne.id} onDeliver={vi.fn()} onGo={onGo} />);
  const group = screen.getByRole('group');
  expect(group.textContent?.replace(/\s+/g, ' ')).toMatch(/Il me faut 2 blocs de bois\. C’est pour la lanterne\. Joue une mission au Phare\./);
  const go = within(group).getByRole('button', { name: 'Y aller : Le Phare' });
  expect(go).not.toHaveClass('primary');
  await userEvent.setup().click(go);
  expect(onGo).toHaveBeenCalledWith({ place: 'phare' });
});

it('la liste « Commandes » : l’entraide en tête, son signe (l’objet, « Étape 1 sur 3 ») et « Y aller » vers son lieu', async () => {
  const state = avecLanterne(0, {}, [potager.id]);
  const onGo = vi.fn();
  wrap(<CommandsSheet lines={commandLines(state, ENTREPOT)} entraide={entraideListLine(state, () => true, ENTREPOT)} suggested={lanterne.id} onGo={onGo} onClose={vi.fn()} />);
  const rows = within(screen.getByRole('dialog', { name: /Commandes/ })).getAllByRole('listitem');
  expect(rows).toHaveLength(2);
  expect(within(rows[0]).getByRole('img', { name: 'Entraide : la lanterne. Étape 1 sur 3.' })).toBeInTheDocument();
  expect(rows[0].textContent?.replace(/\s+/g, ' ')).toMatch(/Joue une mission aux Quais\./);
  const go = within(rows[0]).getByRole('button', { name: 'Y aller : Les Quais' });
  expect(go).toHaveClass('primary');
  await userEvent.setup().click(go);
  expect(onGo).toHaveBeenCalledWith({ place: 'quais' });
});
