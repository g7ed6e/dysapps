// Les étiquettes de la Carte (GD-20, point 3, lot 2 des passerelles) : le cadenas de la liaison suggérée est plein, les
// autres restent creux ; tous gardent leur nom et leur phrase.
import { render } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
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

function locks(suggested: PlaceId | null) {
  const { container } = render(<MapLabels openPlaces={['phare', 'quais']} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} suggested={suggested} states={states} words={words} />);
  return [...container.querySelectorAll<HTMLElement>('.open-world-map-closed')].map((b) => ({ place: b.dataset.lieu, full: b.querySelector('.open-world-lock')!.classList.contains('suggested') }));
}

test('le cadenas de la liaison suggérée, et lui seul, est plein', () => {
  const all = locks('filets');
  expect(all).toHaveLength(14);
  expect(all.filter((l) => l.full).map((l) => l.place)).toEqual(['filets']);
});

test('sans liaison suggérée, aucun cadenas plein', () => {
  expect(locks(null).some((l) => l.full)).toBe(false);
});
