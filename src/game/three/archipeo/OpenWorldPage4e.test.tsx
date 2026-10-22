// La page du monde ouvert du 4e (lot 1, « l'île entière en grandes masses » ; lot 2, la Forge ; les Coteaux) : elle donne
// à la scène le plan du 4e, ses trois terres fermées au départ ; les missions de la Forge se jouent dans sa scénette, et
// son état restauré s'écrit et se dit ; au Replat, la voix ajoute sa phrase sans l'écrire, et jamais « Aucune mission ».
// La scène 3D n'est pas là sous jsdom : une scène simulée.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { toutConstruit } from '../../world/budget';
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
            <OpenWorldPage level="4e" />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

test('la scène reçoit le plan du 4e, la Crique et l’aéronef ; ses trois terres sont fermées au départ', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.options!.plan.level).toBe('4e');
  expect(scene.world!.setPort).toHaveBeenCalled();
  expect(scene.world!.setNef).toHaveBeenCalled();
  expect([...scene.closed].sort()).toEqual(['bastion', 'coteaux', 'epaule']);
});

test('une mission de la Forge, construite au lot 2, se joue dans sa scénette ; celle d’un lieu encore en ruine, sur l’écran habituel', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onArrive('forge'));
  const sheet = await screen.findByRole('dialog', { name: 'La Forge' });
  const rows = within(sheet).getByRole('list', { name: 'Missions à la Forge' });
  await userEvent.setup().click(within(rows).getAllByRole('button')[0]);
  await vi.waitFor(() => expect(document.querySelector('.world-question')).not.toBeNull());
  expect(document.querySelector('.world-question.ecran-habituel')).toBeNull();
});

test('la Forge restaurée, son allumage fini : son état écrit, avec l’icône de l’état, puis la réplique de la chaudronnière', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onRestored!('forge'));
  const status = await screen.findByText('La Forge est restaurée.', {}, { timeout: 2000 });
  const box = status.closest('.open-world-said')!;
  expect(box.querySelector('svg')).not.toBeNull();
  expect(box.textContent).toMatch(/La Forge est restaurée\.[\s\S]*Le feu de la montagne est revenu\./);
});

test('au Replat, la voix dit le nom puis la phrase du Replat, que l’écran n’écrit jamais ; ni là ni après, « Aucune mission » (retouche 1 des Coteaux)', async () => {
  const said: string[] = [];
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = '';
      rate = 1;
      voice: unknown = null;
      onend: unknown = null;
      constructor(public text: string) {}
    },
  );
  vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => said.push(u.text) });
  localStorage.setItem('dysapps:settings', JSON.stringify({ worldView: '3d', univers: 'archipeo', autoRead: true, sounds: false }));
  // Tout est construit : ailleurs, rien à faire, la bulle « Aucune mission » est là.
  const { progress, world } = toutConstruit();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, progress, world }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText(/Aucune mission/)).toBeInTheDocument();
  act(() => scene.options!.onDetour!('replat'));
  expect(await screen.findByText('Le Replat')).toBeInTheDocument();
  await vi.waitFor(() => expect(said.join(' ')).toMatch(/endroit plat dans une pente/));
  expect(said.join(' ')).toMatch(/Le Replat\. Un replat/);
  expect(screen.queryByText(/endroit plat dans une pente/)).toBeNull();
  expect(screen.queryByText(/Aucune mission/)).toBeNull();
  // Le nom parti, la bulle ne revient pas sur un Détour.
  await vi.waitFor(() => expect(screen.queryByText('Le Replat')).toBeNull(), { timeout: 6000 });
  expect(screen.queryByText(/Aucune mission/)).toBeNull();
  expect(screen.queryByText(/endroit plat dans une pente/)).toBeNull();
}, 10000);
