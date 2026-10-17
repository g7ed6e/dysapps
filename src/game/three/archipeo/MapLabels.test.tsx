// Les étiquettes de la Carte (GD-20, point 3, « vraies terres, vrais ponts ») : un cadenas par pont à rebâtir, plein pour
// le pont suggéré seul ; les lieux des terres fermées en pastilles pâles, touchables, qui ouvrent la fiche de leur terre.
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { LINKED_LANDS, placesOfLands, type LinkedLand } from '../../world/continu/lands';
import { PLACES, type PlaceId } from '../../world/continu/plan6e';
import { MapLabels } from './MapLabels';

// Pas de ResizeObserver sous jsdom : les étiquettes ne relisent leurs tailles qu'avec lui.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const states = Object.fromEntries(PLACES.map((p) => [p.id, null])) as Record<PlaceId, null>;
const words = { 'a-explorer': 'À explorer', 'en-chantier': 'En chantier', restauree: 'Restaurée' } as never;

function renderMap(suggested: LinkedLand | null, onClosed = vi.fn()) {
  const { container } = render(
    <MapLabels openPlaces={placesOfLands(['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={onClosed} suggested={suggested} states={states} words={words} />,
  );
  const locks = [...container.querySelectorAll<HTMLElement>('.open-world-map-closed')].map((b) => ({ id: b.dataset.lieu, full: b.querySelector('.open-world-lock')!.classList.contains('suggested'), el: b }));
  const pale = [...container.querySelectorAll<HTMLElement>('.open-world-map-pale')];
  return { locks, pale, onClosed };
}

test('un cadenas par pont ; celui du pont suggéré, et lui seul, est plein', () => {
  const { locks } = renderMap('levant');
  expect(locks.map((l) => l.id)).toEqual(['pont-couchant', 'pont-large', 'pont-levant', 'pont-cretes']);
  expect(locks.filter((l) => l.full).map((l) => l.id)).toEqual(['pont-levant']);
  expect(locks[0].el.getAttribute('aria-label')).toBe('Le Couchant : fermé, le pont est à rebâtir.');
});

test('sans pont suggéré, aucun cadenas plein', () => {
  expect(renderMap(null).locks.some((l) => l.full)).toBe(false);
});

test('les lieux des terres fermées : des pastilles pâles, sans cadenas, qui ouvrent la fiche de leur terre', () => {
  const { pale, onClosed } = renderMap(null);
  expect(pale).toHaveLength(12);
  expect(pale.every((b) => !b.querySelector('.open-world-lock'))).toBe(true);
  const ruins = pale.find((b) => b.dataset.lieu === 'ruins')!;
  expect(ruins).toHaveTextContent('Les Ruines');
  fireEvent.click(ruins);
  expect(onClosed).toHaveBeenCalledWith('couchant');
});
