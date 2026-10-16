// La liste des lieux ouverts, sur la Carte (bouton « Lieux », GD-20, « La Carte au plus grand texte ») : l'ordre de jeu
// (l'Escale, puis PLACES), les lieux ouverts seuls, l'état écrit et dit, une seule ligne mise en avant, une ligne qui y
// mène, Échap en deux temps (la liste, puis la Carte) et le focus rendu à « Lieux ».
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { getBiome } from '../../biomes';
import { PLACES, placeById, type PlaceId } from '../../world/continu/plan6e';
import { NEXT_MISSION_WORD, PLACES_TITLE, PlacesSheet, placesRows, usePlacesList, type PlacesRow } from './PlacesSheet';

const WORDS = { fermee: 'Fermée', 'a-explorer': 'À explorer', 'en-chantier': 'En chantier', restauree: 'Restaurée' } as const;
const NO_STATE = Object.fromEntries(PLACES.map((p) => [p.id, null])) as Record<PlaceId, null>;
const STATES = { ...NO_STATE, quais: 'en-chantier', phare: 'restauree', ecluses: 'restauree' } as const;

it('les lignes suivent l’ordre de jeu : l’Escale, puis les lieux ouverts dans l’ordre de PLACES, jamais un fermé', () => {
  // Donnés dans le désordre : l'ordre de la liste ne dépend pas de celui des lieux ouverts.
  const open: PlaceId[] = ['archives', 'quais', 'phare', 'ecluses'];
  const rows = placesRows(open, STATES, WORDS, 'quais', 'L’Escale');
  expect(rows.map((r) => r.id)).toEqual(['port', ...PLACES.map((p) => p.id).filter((id) => open.includes(id))]);
  expect(rows[0]).toMatchObject({ name: 'L’Escale', icon: 'ancre', state: null, next: false });
  // L'icône du lieu : celle de son île, la même que la pastille réduite de la Carte.
  for (const r of rows.slice(1)) expect(r.icon).toBe(getBiome(placeById(r.id as PlaceId).island)!.icon);
  // Le mot de l'état, accordé, et « À explorer » sans partie posée.
  expect(Object.fromEntries(rows.slice(1).map((r) => [r.id, r.state!.word]))).toEqual({ phare: 'Restauré', quais: 'En chantier', ecluses: 'Restaurées', archives: 'À explorer' });
  expect(rows.filter((r) => r.next).map((r) => r.id)).toEqual(['quais']);
  // Sans Escale (un univers qui n'en a pas), les lieux seuls.
  expect(placesRows(open, STATES, WORDS, null)[0].id).toBe('phare');
});

it('les Ruines relevées, jamais « restaurées » : le mot du geste du lieu, comme sur la Carte (lot L8b)', () => {
  const rows = placesRows(['ruins', 'mangrove'], { ...NO_STATE, ruins: 'restauree', mangrove: 'restauree' }, WORDS, null);
  expect(Object.fromEntries(rows.map((r) => [r.id, r.state!.word]))).toEqual({ mangrove: 'Restaurée', ruins: 'Relevées' });
});

function renderSheet(rows: PlacesRow[]) {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <PlacesSheet rows={rows} onPick={onPick} onClose={onClose} />
      </ProgressProvider>
    </SettingsProvider>,
  );
  const sheet = screen.getByRole('dialog', { name: PLACES_TITLE });
  return { onPick, onClose, sheet, rows: within(sheet).getAllByRole('button').filter((b) => b.classList.contains('lieux-row')) };
}

it('une ligne par lieu : le nom, l’état écrit et dit, « Prochaine mission » écrit sur la seule ligne mise en avant ; une ligne touchée y mène', async () => {
  const { rows, onPick, sheet } = renderSheet(placesRows(['quais', 'phare', 'archives'], STATES, WORDS, 'archives', 'L’Escale'));
  expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual([
    'Y aller : L’Escale',
    'Y aller : Le Phare, restauré',
    'Y aller : Les Quais, en chantier',
    'Y aller : Les Archives, à explorer, prochaine mission',
  ]);
  expect(rows[2].querySelector('.lieux-row-text')).toHaveTextContent('Les Quais');
  expect(rows[2].querySelector('.lieux-row-state')).toHaveTextContent('En chantier');
  expect(rows.filter((r) => r.getAttribute('aria-current') === 'step')).toEqual([rows[3]]);
  expect(rows[3]).toHaveTextContent(NEXT_MISSION_WORD);
  expect(rows.filter((r) => r.textContent?.includes(NEXT_MISSION_WORD))).toHaveLength(1);
  // À l'ouverture, le focus sur la première ligne (l'Escale) : la liste est en haut.
  expect(rows[0]).toHaveFocus();
  expect(within(sheet).queryByText('Rien d’autre d’ouvert')).toBeNull();
  await userEvent.setup().click(rows[2]);
  expect(onPick).toHaveBeenCalledWith('quais');
});

it('un dialogue non modal (« Retour » et « Lieux » restent actifs à côté), le repère « Suite plus bas » caché aux lecteurs d’écran', () => {
  const { sheet } = renderSheet(placesRows(['quais', 'phare'], STATES, WORDS, 'quais', 'L’Escale'));
  expect(sheet).toHaveAttribute('aria-modal', 'false');
  expect(sheet.querySelector('.lieux-repere')).toHaveAttribute('aria-hidden', 'true');
  expect(within(sheet).queryByRole('img', { name: 'Suite plus bas' })).toBeNull();
});

it('l’Escale seule : une ligne, et « Rien d’autre d’ouvert » écrit, jamais un panneau vide', () => {
  const { rows, sheet } = renderSheet(placesRows([], NO_STATE, WORDS, null, 'L’Escale'));
  expect(rows).toHaveLength(1);
  expect(within(sheet).getByText('Rien d’autre d’ouvert')).toBeInTheDocument();
});

/** La Carte et sa barre, réduites à ce que la liste touche : « Lieux », la liste, et la Carte qu'Échap ferme. */
function MapHarness({ onCloseMap }: { onCloseMap(): void }) {
  const [mapOpen, setMapOpen] = useState(true);
  const list = usePlacesList(mapOpen, () => {
    onCloseMap();
    setMapOpen(false);
  });
  return (
    <SettingsProvider>
      <ProgressProvider>
        {!mapOpen && (
          <button type="button" onClick={() => setMapOpen(true)}>
            Carte
          </button>
        )}
        {mapOpen && (
          <button type="button" ref={list.button} aria-expanded={list.open} onClick={list.toggle}>
            Lieux
          </button>
        )}
        {list.open && <PlacesSheet rows={placesRows(['phare'], NO_STATE, WORDS, 'phare', 'L’Escale')} onPick={() => setMapOpen(false)} onClose={list.close} />}
      </ProgressProvider>
    </SettingsProvider>
  );
}

it('Échap ferme la liste d’abord (le focus revient sur « Lieux »), puis la Carte ; la croix rend le focus aussi', async () => {
  const user = userEvent.setup();
  const onCloseMap = vi.fn();
  render(<MapHarness onCloseMap={onCloseMap} />);
  const lieux = screen.getByRole('button', { name: 'Lieux' });
  await user.click(lieux);
  expect(lieux).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Y aller : L’Escale' })).toHaveFocus();
  act(() => void fireEvent.keyDown(window, { key: 'Escape' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(onCloseMap).not.toHaveBeenCalled();
  expect(lieux).toHaveFocus();
  expect(lieux).toHaveAttribute('aria-expanded', 'false');
  // La croix : la liste seule se ferme, le focus revient sur « Lieux ».
  await user.click(lieux);
  await user.click(screen.getByRole('button', { name: `Fermer : ${PLACES_TITLE}` }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(lieux).toHaveFocus();
  expect(onCloseMap).not.toHaveBeenCalled();
  // Liste fermée, Échap ferme la Carte.
  act(() => void fireEvent.keyDown(window, { key: 'Escape' }));
  expect(onCloseMap).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Lieux' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Carte' }));
  expect(screen.getByRole('button', { name: 'Lieux' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('une ligne choisie ferme la Carte et la liste : la Carte rouverte ne la montre pas d’office', async () => {
  const user = userEvent.setup();
  render(<MapHarness onCloseMap={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Lieux' }));
  await user.click(screen.getByRole('button', { name: 'Y aller : Le Phare, à explorer, prochaine mission' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Lieux' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Carte' }));
  expect(screen.getByRole('button', { name: 'Lieux' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('dialog')).toBeNull();
});
