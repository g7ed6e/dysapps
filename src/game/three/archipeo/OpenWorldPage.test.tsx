// « Relier » dans la page du monde ouvert (GD-20, point 3, lot 2 ; relecture de l'expert frontend) : la passerelle n'est
// annoncée à la scène qu'une fois payée ; posée, la phrase vient, et celle d'un lieu devenu reliable la suit. La scène 3D
// n'est pas là sous jsdom : une scène simulée pose la passerelle d'un coup (comme avec « Réduire les animations »).
import { render, screen, within } from '@testing-library/react';
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
}));
vi.mock('./scene', () => ({
  createOpenWorld: (_host: HTMLElement, options: OpenWorldOptions) => {
    scene.options = options;
    scene.laid = [];
    scene.pending = null;
    scene.closed = [];
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
