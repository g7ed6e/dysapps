// « Relier » dans la page du monde ouvert (GD-20, point 3, lot 2 ; relecture de l'expert frontend) : la passerelle n'est
// annoncée à la scène qu'une fois payée ; posée, la phrase vient, et celle d'un lieu devenu reliable la suit. La scène 3D
// n'est pas là sous jsdom : une scène simulée pose la passerelle d'un coup (comme avec « Réduire les animations »).
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { LinkedPlace } from '../../world/continu/links';
import type { LinkLayEvents, OpenWorld, OpenWorldOptions } from './scene';
import OpenWorldPage from './OpenWorldPage';

const scene = vi.hoisted(() => ({
  options: null as OpenWorldOptions | null,
  laid: [] as LinkedPlace[],
  pending: null as { place: LinkedPlace; events: LinkLayEvents } | null,
  closed: [] as readonly LinkedPlace[],
  /** Pose animée : la passerelle annoncée attend (`laying`) qu'on la finisse. */
  animated: false,
  laying: null as { place: LinkedPlace; events: LinkLayEvents } | null,
}));
vi.mock('./scene', () => ({
  createOpenWorld: (_host: HTMLElement, options: OpenWorldOptions) => {
    scene.options = options;
    scene.laid = [];
    scene.pending = null;
    scene.closed = [];
    scene.laying = null;
    const own: Partial<OpenWorld> = {
      question: () => [],
      setPlaces: () => false,
      keoAt: () => ({ x: 0, z: 0 }),
      info: () => ({ calls: 0, triangles: 0, mapMs: 0 }),
      layLink: (place, events) => {
        scene.pending = { place, events };
      },
      // Comme la scène : la passerelle annoncée se pose quand les liaisons ouvrent son lieu, ici d'un coup.
      setLinks: (links) => {
        const p = scene.pending;
        scene.pending = null;
        const opened = p && scene.closed.includes(p.place) && !links.closed.includes(p.place);
        scene.closed = links.closed;
        if (!opened) return;
        scene.laid.push(p.place);
        if (scene.animated) {
          scene.laying = p;
          return;
        }
        p.events.tap();
        p.events.laid();
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
      return pay.refuse ? { ...b, linkFromOpenWorld: () => ({ ok: false }) } : b;
    },
  };
});

beforeEach(() => {
  pay.refuse = false;
  scene.animated = false;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  sessionStorage.setItem('dysapps:title-seen', '1');
  localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: '3d', univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-letter-confusion': 6 } }));
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

/** Le lieu fermé touché dans le monde : sa fiche s'ouvre ; « Relier » y est touché. */
async function relier(place: LinkedPlace, name: string) {
  const user = userEvent.setup();
  await screen.findByRole('button', { name: /Carte/ });
  scene.options!.onClosed(place);
  const sheet = await screen.findByRole('dialog', { name });
  await user.click(within(sheet).getByRole('button', { name: /^Relier/ }));
}

test('relier les Écluses : la passerelle posée, puis « La Turbine peut être reliée. », dans la même boîte', async () => {
  renderPage();
  await relier('ecluses', 'Les Écluses');
  expect(scene.laid).toEqual(['ecluses']);
  const status = await screen.findByText('La passerelle est posée.', {}, { timeout: 2000 });
  const box = status.closest('[role="status"]')!;
  expect(box.textContent).toBe('La passerelle est posée. La Turbine peut être reliée.');
  // Deux phrases, une par ligne, séparées d'une espace pour le lecteur d'écran (« Réécouter » n'est là qu'avec une voix).
  expect(box.querySelectorAll('span')).toHaveLength(2);
});

test('un paiement refusé ne pose rien : aucune pose annoncée, aucune phrase', async () => {
  pay.refuse = true;
  renderPage();
  await relier('ecluses', 'Les Écluses');
  expect(scene.pending).toBeNull();
  expect(scene.laid).toEqual([]);
  await new Promise((r) => setTimeout(r, 700));
  expect(screen.queryByText('La passerelle est posée.')).not.toBeInTheDocument();
});

test('un toucher finit la pose et Kéo part : la phrase vient et reste écrite (consultant UX UI)', async () => {
  scene.animated = true;
  renderPage();
  await relier('ecluses', 'Les Écluses');
  expect(scene.laying?.place).toBe('ecluses');
  expect(screen.queryByText('La passerelle est posée.')).not.toBeInTheDocument();
  // « Y aller » ou un lieu touché pendant la pose : la scène la finit d'un coup (le toc, la fin), et Kéo part.
  const { events } = scene.laying!;
  act(() => {
    events.tap();
    events.laid();
    scene.options!.onDepart();
  });
  const status = await screen.findByText('La passerelle est posée.', {}, { timeout: 2000 });
  // Bien après le départ, la phrase est toujours là (elle reste 4 s par phrase).
  await act(() => new Promise((r) => setTimeout(r, 1200)));
  expect(status).toBeInTheDocument();
  expect(status.closest('[role="status"]')!.textContent).toBe('La passerelle est posée. La Turbine peut être reliée.');
});

test('sur un petit écran, une phrase à la fois : le toucher garde celle qu’on lit, puis vient la suivante ; le lecteur d’écran a les deux', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  renderPage();
  await relier('ecluses', 'Les Écluses');
  const first = await screen.findByText('La passerelle est posée.', {}, { timeout: 2000 });
  const second = screen.getByText('La Turbine peut être reliée.');
  const box = first.closest('[role="status"]')!;
  expect(box.textContent).toBe('La passerelle est posée. La Turbine peut être reliée.');
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
    expect(box.textContent).toBe('La passerelle est posée. La Turbine peut être reliée.');
  } finally {
    vi.useRealTimers();
  }
});
