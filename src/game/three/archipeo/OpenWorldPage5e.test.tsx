// La page du monde ouvert du 5e (GD-22, lot 2) : elle donne à la scène le plan du 5e, rien de l'Escale, de la Nef ni des
// Détours, et ses missions passent par l'écran habituel. La scène 3D n'est pas là sous jsdom : une scène simulée.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { degelerSauvegarde } from '../../../core/storage';
import { BloclandProvider, useBlocland } from '../../BloclandContext';
import { getArchipelago, voyageId } from '../../world/archipelago';
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

/** Ouvre le mode bâtisseur depuis le test (`open`). */
const builder = { open: null as (() => void) | null };
function BuilderHook() {
  builder.open = useBlocland().ouvrirBatisseur;
  return null;
}

function renderPage() {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <BuilderHook />
          <MemoryRouter initialEntries={['/adventure']}>
            <OpenWorldPage level="5e" />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

test('le niveau où l’on est, un seul bouton qui déplie les autres niveaux atteints ; « 6e » lance le fondu vers l’Escale ; rien sur la Carte (choix du mainteneur du 23 octobre 2026)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  renderPage();
  const user = userEvent.setup();
  const level = await screen.findByRole('button', { name: /^Changer de niveau\. Tu es en 5e/ });
  expect(level).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('button', { name: /^Aller en 6e/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: /Carte/ }));
  expect(screen.queryByRole('button', { name: /^Changer de niveau/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: /Retour/ }));
  await user.click(screen.getByRole('button', { name: /^Changer de niveau/ }));
  expect(screen.getByRole('button', { name: /^Changer de niveau/ })).toHaveAttribute('aria-expanded', 'true');
  // Déplié : le focus va au premier niveau ; Échap replie et rend le focus au bouton.
  expect(screen.getByRole('button', { name: /^Aller en 6e/ })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('button', { name: /^Aller en 6e/ })).toBeNull();
  expect(screen.getByRole('button', { name: /^Changer de niveau/ })).toHaveFocus();
  // Un toucher ailleurs replie aussi.
  await user.click(screen.getByRole('button', { name: /^Changer de niveau/ }));
  await user.click(document.querySelector('.open-world-canvas')!);
  expect(screen.queryByRole('button', { name: /^Aller en 6e/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: /^Changer de niveau/ }));
  await user.click(screen.getByRole('button', { name: /^Aller en 6e/ }));
  expect(document.querySelector('.open-world-fondu')).toHaveClass('on');
});

test('un seul niveau atteint : pas de bouton du niveau', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(screen.queryByRole('button', { name: /^Changer de niveau/ })).toBeNull();
});

test('en mode bâtisseur, pas de bouton du niveau : la barre du mode a déjà les niveaux', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  renderPage();
  await screen.findByRole('button', { name: /^Changer de niveau/ });
  try {
    act(() => builder.open!());
    expect(screen.queryByRole('button', { name: /^Changer de niveau/ })).toBeNull();
  } finally {
    degelerSauvegarde();
  }
});

test('la scène reçoit le plan du 5e, la Lisière et le dirigeable (lot 4), et ses Détours (lot 6)', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.options!.plan.level).toBe('5e');
  expect(scene.world!.setPort).toHaveBeenCalled();
  expect(scene.world!.setNef).toHaveBeenCalled();
  expect(scene.world!.setDetours).toHaveBeenCalled();
  // Les trois terres qu'on relie sont fermées au départ.
  expect([...scene.closed].sort()).toEqual(['aiguilles', 'contreforts', 'roselieres']);
});

test('sur la Carte, la pastille du lieu que désigne la marque porte seule la marque « suggéré » (seconde relecture du lot 2)', async () => {
  renderPage();
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: /Carte/ }));
  const marked = vi.mocked(scene.world!.setMark).mock.calls.at(-1)?.[0];
  expect(marked).toBeTruthy();
  const suggested = [...document.querySelectorAll<HTMLElement>('.open-world-map-place.suggested')].map((b) => b.dataset.lieu);
  expect(suggested).toEqual([marked]);
  expect(document.querySelector(`[data-lieu="${marked}"]`)).toHaveAttribute('aria-current', 'step');
});

test('la cabine de la Montée : « Monter » à côté de « Y aller » à l’arrêt, « Passer le trajet » pendant le trajet, l’arrivée dite (première relecture du lot 3)', async () => {
  renderPage();
  const user = userEvent.setup();
  await screen.findByRole('button', { name: /Carte/ });
  // Kéo à l'arrêt à la gare du pied : « Y aller » reste le bouton principal, « Monter » s'ajoute à côté.
  act(() => scene.options!.onCabin!({ side: 'bas', riding: null }));
  const monter = screen.getByRole('button', { name: 'Monter' });
  expect(screen.getByRole('button', { name: /Y aller/ })).toHaveClass('primary');
  expect(monter).not.toHaveClass('primary');
  expect(monter).not.toHaveAttribute('aria-disabled');
  await user.click(monter);
  expect(scene.world!.ride).toHaveBeenCalledTimes(1);
  // Le trajet commence : plus de bouton de cabine ; « Passer le trajet », à contraste plein, saute jusqu'à l'arrivée.
  act(() => {
    scene.options!.onDepart();
    scene.options!.onCabin!({ side: null, riding: 'haut' });
  });
  expect(screen.queryByRole('button', { name: 'Monter' })).toBeNull();
  const passer = screen.getByRole('button', { name: /Passer le trajet/ });
  expect(passer).not.toHaveAttribute('aria-disabled');
  await user.click(passer);
  expect(scene.world!.skip).toHaveBeenCalledTimes(1);
  expect(scene.world!.ride).toHaveBeenCalledTimes(1);
  // La caisse arrivée : une phrase courte pour le lecteur d'écran, jamais écrite à la vue.
  act(() => scene.options!.onCabin!({ side: null, riding: null }));
  const said = screen.getAllByRole('status').find((s) => s.textContent === 'Tu es en haut.');
  expect(said).toBeDefined();
  expect(said).toHaveClass('visually-hidden');
  // En haut, à l'arrêt : « Descendre ».
  act(() => {
    scene.options!.onArrive(null);
    scene.options!.onCabin!({ side: 'haut', riding: null });
  });
  expect(screen.getByRole('button', { name: 'Descendre' })).toBeInTheDocument();
});

test('sur un Détour (le Perchoir), « Y aller » repart vers le lieu de la marque : la marque reste, le bouton porte sa flèche, sans mot de plus (relecture du lot 16, consultant UX UI)', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  const go = () => screen.getByRole('button', { name: /^Y aller/ });
  const arrow = () => document.querySelector('.open-world-arrow svg')!.getAttribute('class');
  expect(go().querySelector('svg')!.getAttribute('class')).not.toBe(arrow());
  act(() => scene.options!.onDetour!('perchoir'));
  expect(document.querySelector('.open-world-mark')).not.toBeNull();
  expect(go().querySelector('svg')!.getAttribute('class')).toBe(arrow());
  expect(go()).toHaveTextContent(/^\s*Y aller\s*$/);
  // Reparti du Détour : les pas, comme ailleurs.
  act(() => scene.options!.onDetour!(null));
  expect(go().querySelector('svg')!.getAttribute('class')).not.toBe(arrow());
});
