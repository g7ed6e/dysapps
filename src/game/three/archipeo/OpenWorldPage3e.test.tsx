// La page du monde ouvert du 3e (lot 1, « les Îles du Ciel en grandes masses ») : elle donne à la scène le plan du 3e,
// ses trois terres fermées au départ, et ses missions passent par l'écran habituel. La scène 3D n'est pas là sous jsdom :
// une scène simulée.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import type { LinkedLand } from '../../world/continu/lands';
import type { BridgeLayEvents, OpenWorld, OpenWorldOptions } from './scene';
import OpenWorldPage from './OpenWorldPage';

const scene = vi.hoisted(() => ({
  options: null as OpenWorldOptions | null,
  closed: [] as readonly LinkedLand[],
  world: null as OpenWorld | null,
  instant: true,
  lay: null as { land: LinkedLand; events: BridgeLayEvents } | null,
}));
vi.mock('./scene', () => ({
  createOpenWorld: (_host: HTMLElement, options: OpenWorldOptions) => {
    scene.options = options;
    scene.closed = [];
    const own: Partial<OpenWorld> = {
      question: vi.fn(() => []),
      onSceneTurn: () => () => {},
      setPlaces: () => false,
      keoAt: () => ({ x: 0, z: 0 }),
      info: () => ({ calls: 0, triangles: 0, mapMs: 0 }),
      layLand: (land, events) => {
        scene.lay = { land, events };
      },
      setLands: (lands) => {
        scene.closed = lands.closed;
        const lay = scene.lay;
        if (!scene.instant || !lay || lands.closed.includes(lay.land)) return;
        scene.lay = null;
        lay.events.tap();
        lay.events.laid();
      },
    };
    scene.world = new Proxy(own, { get: (t, k: string) => (t as Record<string, unknown>)[k] ?? ((t as Record<string, unknown>)[k] = vi.fn()) }) as OpenWorld;
    return scene.world;
  },
}));


afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  scene.instant = true;
  scene.lay = null;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  sessionStorage.setItem('dysapps:title-seen', '1');
  localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: '3d', univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: {} }));
});

function renderPage() {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/adventure']}>
            <OpenWorldPage level="3e" />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

test('la scène reçoit le plan du 3e, le Parvis et l’aéronef ; ses trois terres sont fermées au départ', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.options!.plan.level).toBe('3e');
  expect(scene.world!.setPort).toHaveBeenCalled();
  expect(scene.world!.setNef).toHaveBeenCalled();
  expect([...scene.closed].sort()).toEqual(['alpages', 'cirque', 'prairies']);
});

test('une mission du Belvédère, dans le Versant ouvert, se joue sur l’écran habituel', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onArrive('belvedere'));
  const sheet = await screen.findByRole('dialog', { name: 'Le Belvédère' });
  const rows = within(sheet).getByRole('list', { name: 'Missions au Belvédère' });
  await userEvent.setup().click(within(rows).getAllByRole('button')[0]);
  await vi.waitFor(() => expect(document.querySelector('.world-question.ecran-habituel')).not.toBeNull());
  expect(scene.world!.question).not.toHaveBeenCalledWith(expect.objectContaining({ place: 'belvedere' }));
});
