// La page du monde ouvert du 5e (GD-22, lot 2) : elle donne à la scène le plan du 5e, rien de l'Escale, de la Nef ni des
// Détours, et ses missions passent par l'écran habituel. La scène 3D n'est pas là sous jsdom : une scène simulée.
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
            <OpenWorldPage level="5e" />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

test('la scène reçoit le plan du 5e ; ni l’Escale, ni la Nef, ni les Détours n’y sont donnés', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.options!.plan.level).toBe('5e');
  expect(scene.world!.setPort).not.toHaveBeenCalled();
  expect(scene.world!.setNef).not.toHaveBeenCalled();
  expect(scene.world!.setDetours).not.toHaveBeenCalled();
  // Les trois terres qu'on relie sont fermées au départ.
  expect([...scene.closed].sort()).toEqual(['aiguilles', 'contreforts', 'roselieres']);
});

test('une mission d’un lieu du 5e se joue sur l’écran habituel, jamais dans une scénette', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onArrive('hameau'));
  const sheet = await screen.findByRole('dialog', { name: 'Le Hameau' });
  // Aucune ligne d'habitant au 5e : le panneau commence par ses missions.
  expect(within(sheet).queryByRole('button', { name: /Reprendre|Livrer/ })).toBeNull();
  const rows = within(sheet).getByRole('list', { name: 'Missions au Hameau' });
  await userEvent.setup().click(within(rows).getAllByRole('button')[0]);
  await vi.waitFor(() => expect(document.querySelector('.world-question.ecran-habituel')).not.toBeNull());
  expect(scene.world!.question).not.toHaveBeenCalledWith(expect.objectContaining({ place: 'hameau' }));
});
