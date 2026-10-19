// Les étiquettes de la Carte (GD-20, point 3, « vraies terres, vrais ponts ») : un cadenas par pont à rebâtir, plein pour
// le pont suggéré seul ; les lieux des terres fermées en pastilles pâles, touchables, qui ouvrent la fiche de leur terre.
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { type LinkedLand, linkedLands, placesOfLands } from '../../world/continu/lands';
import { PLACES, type PlaceId } from '../../world/continu/plan6e';
import { MapLabels } from './MapLabels';
import type { MapSpotOnScreen } from './scene';
import { planFor } from '../../world/continu/levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LINKED_LANDS = linkedLands(PLAN);

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
    <MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={onClosed} suggested={suggested} states={states} words={words} />,
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

test('au 5e (GD-22) : un triangle « en haut » dans la dernière ligne du nom de chaque lieu du plateau, et dit ; sur « Toi » quand Kéo y monte', () => {
  const plan5 = planFor('5e');
  const placer: { current: ((spots: readonly MapSpotOnScreen[]) => void) | null } = { current: null };
  const { container } = render(
    <MapLabels places={plan5.places} openPlaces={placesOfLands(plan5, ['frondaisons'])} closedLands={linkedLands(plan5)} onPick={() => {}} placer={placer} onClosed={() => {}} states={{}} words={words} upper={plan5.upper} />,
  );
  for (const p of plan5.places) {
    const el = container.querySelector<HTMLElement>(`[data-lieu="${p.id}"]`)!;
    const up = el.querySelector('.open-world-map-up');
    expect(Boolean(up), p.id).toBe(plan5.upper.includes(p.id));
    if (!up) continue;
    // Collé au nom : dans sa dernière ligne, qui ne se coupe pas.
    const lines = el.querySelectorAll('.open-world-map-line');
    expect(up.parentElement).toBe(lines[lines.length - 1]);
    expect(el.getAttribute('aria-label')).toContain(`${p.name}, en haut`);
  }
  const keo = container.querySelector<HTMLElement>('[data-lieu="keo"]')!;
  placer.current!([{ id: 'keo', x: 10, y: 10, shown: true, up: true }]);
  expect(keo.dataset.haut).toBe('oui');
  expect(keo.getAttribute('aria-label')).toBe('Toi : Kéo est ici, en haut');
  placer.current!([{ id: 'keo', x: 10, y: 10, shown: true, up: false }]);
  expect(keo.dataset.haut).toBe('non');
  expect(keo.getAttribute('aria-label')).toBe('Toi : Kéo est ici');
});

test('au 6e, aucun triangle « en haut »', () => {
  const { container } = render(
    <MapLabels places={PLAN.places} openPlaces={placesOfLands(PLAN, ['pointe'])} closedLands={LINKED_LANDS} onPick={() => {}} placer={{ current: null }} onClosed={() => {}} states={states} words={words} upper={PLAN.upper} />,
  );
  expect(container.querySelector('.open-world-map-up')).toBeNull();
});
