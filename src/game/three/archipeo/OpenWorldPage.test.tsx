// « Relier » dans la page du monde ouvert (GD-20, point 3, « vraies terres, vrais ponts » ; relecture de l'expert
// frontend) : une terre payée, la scène reçoit ses terres fermées sans elle, le pont est rebâti d'un coup ; la phrase
// vient, et celle du pont devenu reliable la suit. La scène 3D n'est pas là sous jsdom : une scène simulée.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { LinkedLand } from '../../world/continu/lands';
import type { OpenWorld, OpenWorldOptions } from './scene';
import OpenWorldPage from './OpenWorldPage';

const scene = vi.hoisted(() => ({
  options: null as OpenWorldOptions | null,
  closed: [] as readonly LinkedLand[],
}));
vi.mock('./scene', () => ({
  createOpenWorld: (_host: HTMLElement, options: OpenWorldOptions) => {
    scene.options = options;
    scene.closed = [];
    const own: Partial<OpenWorld> = {
      question: () => [],
      setPlaces: () => false,
      keoAt: () => ({ x: 0, z: 0 }),
      info: () => ({ calls: 0, triangles: 0, mapMs: 0 }),
      setLands: (lands) => {
        scene.closed = lands.closed;
      },
    };
    return new Proxy(own, { get: (t, k: string) => (t as Record<string, unknown>)[k] ?? ((t as Record<string, unknown>)[k] = vi.fn()) }) as OpenWorld;
  },
}));

const pay = vi.hoisted(() => ({ refuse: false }));
vi.mock('../../BloclandContext', async (original) => {
  const m = await original<typeof import('../../BloclandContext')>();
  return {
    ...m,
    useBlocland: () => {
      const b = m.useBlocland();
      return pay.refuse ? { ...b, linkLand: () => ({ ok: false, reason: 'blocs', missing: 1 }) } : b;
    },
  };
});

// Les substitutions (matchMedia du petit écran, ResizeObserver) ne passent pas d'un test à l'autre (relecture du code).
afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  pay.refuse = false;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  sessionStorage.setItem('dysapps:title-seen', '1');
  localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: '3d', univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-letter-confusion': 12 } }));
});

function renderPage() {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/adventure']}>
            <OpenWorldPage />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

/** Un lieu d'une terre fermée touché dans le monde : la fiche de sa terre s'ouvre ; « Relier » y est touché. */
async function relier(land: LinkedLand, name: string) {
  const user = userEvent.setup();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onClosed(land));
  const sheet = await screen.findByRole('dialog', { name });
  await user.click(within(sheet).getByRole('button', { name: /^Relier/ }));
}

const BOTH = 'Le pont est rebâti. Le pont des Crêtes peut être rebâti.';

test('au départ, les quatre terres sont fermées dans la scène ; relier le Levant : le pont rebâti, puis « Le pont des Crêtes peut être rebâti. »', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.closed).toEqual(['couchant', 'large', 'levant', 'cretes']);
  await relier('levant', 'Le Levant');
  expect(scene.closed).toEqual(['couchant', 'large', 'cretes']);
  const status = await screen.findByText('Le pont est rebâti.', {}, { timeout: 2000 });
  const box = status.closest('[role="status"]')!;
  expect(box.textContent).toBe(BOTH);
  // Deux phrases, une par ligne, séparées d'une espace pour le lecteur d'écran (« Réécouter » n'est là qu'avec une voix).
  expect(box.querySelectorAll('span')).toHaveLength(2);
});

test('un paiement refusé ne relie rien : aucune terre ouverte, aucune phrase', async () => {
  pay.refuse = true;
  renderPage();
  await relier('levant', 'Le Levant');
  expect(scene.closed).toEqual(['couchant', 'large', 'levant', 'cretes']);
  await new Promise((r) => setTimeout(r, 700));
  expect(screen.queryByText('Le pont est rebâti.')).not.toBeInTheDocument();
});

test('une terre pas encore reliable : sa fiche mène à la terre d’avant', async () => {
  const user = userEvent.setup();
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onClosed('cretes'));
  const sheet = await screen.findByRole('dialog', { name: 'Les Crêtes' });
  expect(within(sheet).queryByText('Relier')).toBeNull();
  await user.click(within(sheet).getByRole('button', { name: "Les Crêtes : relie d'abord le Levant." }));
  expect(await screen.findByRole('dialog', { name: 'Le Levant' })).toBeInTheDocument();
});

test('sur un petit écran, une phrase à la fois : le toucher garde celle qu’on lit, puis vient la suivante ; le lecteur d’écran a les deux', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  renderPage();
  await relier('levant', 'Le Levant');
  const first = await screen.findByText('Le pont est rebâti.', {}, { timeout: 2000 });
  const second = screen.getByText('Le pont des Crêtes peut être rebâti.');
  const box = first.closest('[role="status"]')!;
  expect(box.textContent).toBe(BOTH);
  expect(first).not.toHaveClass('visually-hidden');
  expect(second).toHaveClass('visually-hidden');
  // Le toucher garde la première encore 4 s, puis la seconde vient à sa place.
  vi.useFakeTimers();
  try {
    fireEvent.pointerDown(box.parentElement!);
    act(() => vi.advanceTimersByTime(3900));
    expect(first).not.toHaveClass('visually-hidden');
    act(() => vi.advanceTimersByTime(200));
    expect(first).toHaveClass('visually-hidden');
    expect(second).not.toHaveClass('visually-hidden');
    expect(box.textContent).toBe(BOTH);
  } finally {
    vi.useRealTimers();
  }
});
