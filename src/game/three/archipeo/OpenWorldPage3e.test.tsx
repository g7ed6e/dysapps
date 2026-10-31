// La page du monde ouvert du 3e (lot 1, « les Îles du Ciel en grandes masses ») : elle donne à la scène le plan du 3e,
// ses trois terres fermées au départ ; les missions d'un lieu construit (le Belvédère, au lot du Versant) se jouent dans sa
// scénette. La scène 3D n'est pas là sous jsdom :
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
  // L'aéronef au repos, entier, sur son aire (retouche 1), sans départ ; ses parures, aucune posée (GD-25).
  expect(scene.world!.setNef).toHaveBeenCalledWith(3);
  expect(scene.world!.setParures).toHaveBeenCalledWith(0);
  expect([...scene.closed].sort()).toEqual(['alpages', 'cirque', 'prairies']);
});

test('une mission du Belvédère, construit au lot du Versant, se joue dans sa scénette', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  act(() => scene.options!.onArrive('belvedere'));
  const sheet = await screen.findByRole('dialog', { name: 'Le Belvédère' });
  const rows = within(sheet).getByRole('list', { name: 'Missions au Belvédère' });
  await userEvent.setup().click(within(rows).getAllByRole('button')[0]);
  await vi.waitFor(() => expect(document.querySelector('.world-question')).not.toBeNull());
  expect(document.querySelector('.world-question.ecran-habituel')).toBeNull();
});

test('toucher l’aéronef ouvre la fiche de la Nef et de ses parures (GD-25), jamais « Partir »', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-3e-geometry': 6 } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.options!.onNef).toBeDefined();
  act(() => scene.options!.onNef!());
  const sheet = await screen.findByRole('dialog', { name: 'La Nef' });
  expect(sheet.querySelectorAll('.nef-pastille')).toHaveLength(3);
  expect(within(sheet).queryByRole('button', { name: /Partir/ })).toBeNull();
  await userEvent.setup().click(within(sheet).getByRole('button', { name: /Poser/ }));
  // La figure de proue posée : elle descend sur l'aéronef.
  await vi.waitFor(() => expect(scene.world!.setParures).toHaveBeenLastCalledWith(1));
  expect(within(sheet).getByRole('status').textContent).toBe('La figure de proue est posée.');
});

test('la pastille de la Nef au 3e (GD-25) : le marbre de la figure de proue tant qu’on peut le poser ; la toucher ouvre la fiche des parures ; la pose faite, elle se retire', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-3e-geometry': 6 } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  // La scène la pose au-dessus de la Nef, à l'écran : elle se montre, son nom lu.
  act(() => scene.options!.onSigns!([{ place: 'nef', x: 200, y: 120, shown: true }]));
  const sign = screen.getByRole('button', { name: 'La Nef : on peut poser' });
  expect(sign.dataset.lieu).toBe('nef');
  expect(sign).not.toHaveClass('suggested');
  expect(sign.textContent).toBe('');
  expect(vi.mocked(scene.world!.setSigns).mock.lastCall?.[0]).toEqual(['nef']);
  await userEvent.setup().click(sign);
  expect(scene.world!.goToPort).toHaveBeenLastCalledWith('quai');
  const sheet = await screen.findByRole('dialog', { name: 'La Nef' });
  await userEvent.setup().click(within(sheet).getByRole('button', { name: /Poser/ }));
  await vi.waitFor(() => expect(scene.world!.setParures).toHaveBeenLastCalledWith(1));
  expect(document.querySelector('.open-world-sign[data-lieu="nef"]')).toBeNull();
  expect(vi.mocked(scene.world!.setSigns).mock.lastCall?.[0]).toEqual([]);
});

test('au 3e, sans marbre ni quartz à poser, pas de pastille de la Nef', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-3e-statistics': 4 } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  // Le quartz du pavois attend la figure de proue : « Poser » n'est pas actif.
  expect(document.querySelector('.open-world-sign[data-lieu="nef"]')).toBeNull();
});

test('la phrase de la restauration du Fanal, cachée pendant la vue finale, revient à sa fin et reste écrite toute sa durée', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    act(() => {
      scene.options!.onRestored!('fanal');
      scene.options!.onCameraScript!(true);
    });
    const box = document.querySelector('.open-world-said')!;
    // La vue finale dure plus longtemps que la phrase : elle n'est jamais écrite pendant la vue.
    act(() => vi.advanceTimersByTime(22_000));
    expect(box.getAttribute('data-shown')).toBe('non');
    act(() => scene.options!.onCameraScript!(false));
    expect(box.getAttribute('data-shown')).toBe('oui');
    expect(box.textContent).toMatch(/Fanal/);
    // Deux phrases (l'état, puis la réplique) : 8 s ensemble, ou 4 s chacune sur un petit écran.
    act(() => vi.advanceTimersByTime(7_000));
    expect(box.getAttribute('data-shown')).toBe('oui');
    act(() => vi.advanceTimersByTime(1_500));
    expect(box.getAttribute('data-shown')).toBe('non');
  } finally {
    vi.useRealTimers();
  }
});

test('la vue finale se termine aussi au clavier : Échap, Entrée ou Espace', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  for (const key of ['Escape', 'Enter', ' ']) {
    act(() => scene.options!.onCameraScript!(true));
    const before = vi.mocked(scene.world!.endScript).mock.calls.length;
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });
    expect(vi.mocked(scene.world!.endScript).mock.calls.length).toBe(before + 1);
    act(() => scene.options!.onCameraScript!(false));
  }
  // Hors de la vue finale, ces touches ne la demandent pas.
  const after = vi.mocked(scene.world!.endScript).mock.calls.length;
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  });
  expect(vi.mocked(scene.world!.endScript).mock.calls.length).toBe(after);
});
