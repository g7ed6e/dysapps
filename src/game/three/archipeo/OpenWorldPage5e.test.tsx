// La page du monde ouvert du 5e (GD-22, lot 2) : elle donne à la scène le plan du 5e, rien de l'Escale, de la Nef ni des
// Détours, et ses missions passent par l'écran habituel. La scène 3D n'est pas là sous jsdom : une scène simulée.
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { degelerSauvegarde } from '../../../core/storage';
import { BloclandProvider, useBlocland } from '../../BloclandContext';
import { getArchipelago, voyageId } from '../../world/archipelago';
import type { LinkedLand } from '../../world/continu/lands';
import { vigilSeconds, type Vigil } from '../../world/continu/vigil';
import { DEPARTURE_LIT_VIGIL_5E, DEPARTURE_VIGIL_5E, PHARE_GLANCE_5E, SEMAPHORE_VIGIL_5E } from '../../world/continu/vigils5e';
import type { BridgeLayEvents, OpenWorld, OpenWorldOptions } from './scene';
import { LEVEL_PICKER_FOLD_MS } from './LevelPicker';
import OpenWorldPage from './OpenWorldPage';

const scene = vi.hoisted(() => ({
  options: null as OpenWorldOptions | null,
  closed: [] as readonly LinkedLand[],
  world: null as OpenWorld | null,
  instant: true,
  lay: null as { land: LinkedLand; events: BridgeLayEvents } | null,
  // Les veillées demandées à la scène (GD-23, GD-27, lot 3 bis), le voile levé ou non à cet instant, et si elle les joue (`playVigils`).
  vigils: [] as { vigil: Vigil; done: () => void; pass: (() => void) | undefined; veiled: boolean }[],
  playVigils: false,
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
      playVigil: (vigil, done, pass) => {
        if (!scene.playVigils) return false;
        scene.vigils.push({ vigil, done, pass, veiled: document.querySelector('.open-world-fondu')?.classList.contains('on') ?? false });
        return true;
      },
      endScript: () => scene.vigils.at(-1)?.done(),
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
  scene.vigils = [];
  scene.playVigils = false;
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

function renderPage(entry: string | { pathname: string; state: unknown } = '/adventure') {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <BuilderHook />
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route path="/adventure/:biomeId?" element={<OpenWorldPage level="5e" />} />
            </Routes>
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

test('le niveau où l’on est, une seule pastille qui glisse vers les autres niveaux atteints et se replie seule ; « 6e » lance le fondu vers l’Escale ; rien sur la Carte (choix du mainteneur du 23 octobre 2026)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  renderPage();
  const user = userEvent.setup();
  const level = await screen.findByRole('button', { name: /^Changer de niveau\. Tu es en 5e/ });
  expect(level).toHaveAttribute('aria-expanded', 'false');
  // Repliée, les autres niveaux sont là pour glisser, mais hors d'atteinte.
  expect(screen.queryByRole('button', { name: /^Aller en 6e/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: /Carte/ }));
  expect(screen.queryByRole('button', { name: /^Changer de niveau/ })).toBeNull();
  await user.click(screen.getByRole('button', { name: /Retour/ }));
  const toggle = () => screen.getByRole('button', { name: /^Changer de niveau/ });
  await user.click(toggle());
  expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  // Dépliée : le focus va au premier niveau ; Échap replie et rend le focus au bouton.
  expect(screen.getByRole('button', { name: /^Aller en 6e/ })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('button', { name: /^Aller en 6e/ })).toBeNull();
  expect(toggle()).toHaveFocus();
  // Un toucher ailleurs replie aussi.
  await user.click(toggle());
  await user.click(document.querySelector('.open-world-canvas')!);
  expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  // Elle se replie seule après un moment sans geste.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    act(() => vi.advanceTimersByTime(LEVEL_PICKER_FOLD_MS - 500));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    act(() => vi.advanceTimersByTime(1000));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveFocus();
  } finally {
    vi.useRealTimers();
  }
  await user.click(toggle());
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

// Les veillées du 5e (GD-23, GD-27, lot 3 bis) : le Sémaphore est à l'autre bout du niveau, la caméra y coupe sous le voile.
test('à la première entrée au 5e, à la Lisière : le voile couvre un quart de seconde, la caméra coupe au Sémaphore, « Le Sémaphore est éteint. » ; le voile revient pour le retour derrière Kéo ; la veillée est retenue', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    const veil = () => document.querySelector('.open-world-fondu')!;
    act(() => vi.advanceTimersByTime(300));
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].vigil).toBe(SEMAPHORE_VIGIL_5E);
    // La caméra a coupé sous le voile, qui se lève ensuite.
    expect(scene.vigils[0].veiled).toBe(true);
    expect(document.querySelector('.open-world-veillee')).toHaveTextContent('Le Sémaphore est éteint.');
    act(() => vi.advanceTimersByTime(300));
    expect(veil()).not.toHaveClass('on');
    // Un quart de seconde avant la fin, le voile revient.
    act(() => vi.advanceTimersByTime(vigilSeconds(SEMAPHORE_VIGIL_5E) * 1000 - 500));
    expect(veil()).toHaveClass('on');
    act(() => scene.vigils[0].done());
    expect(screen.queryByText('Le Sémaphore est éteint.')).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(veil()).not.toHaveClass('on');
    const saved = JSON.parse(localStorage.getItem('dysapps:game') ?? '{}') as { world?: { vigils?: string[] } };
    expect(saved.world?.vigils).toEqual(['5e-arrival']);
  } finally {
    vi.useRealTimers();
  }
});

test('au retour d’un fondu depuis un autre niveau, l’arrivée ne se joue pas ; une veillée vue ne se rejoue pas', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port, vigils: ['5e-arrival'] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.vigils).toHaveLength(0);
  expect(document.querySelector('.open-world-fondu')).not.toHaveClass('on');
});

test('à l’arrivée par la Nef, la Nef dépose Kéo aux Radeaux, l’île du port de la grille : l’arrivée se joue là aussi, à la première entrée', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    renderPage({ pathname: `/adventure/${getArchipelago('5e').port}`, state: { voyage: 'arrivee' } });
    await screen.findByRole('button', { name: /Carte/ });
    expect(scene.options!.start).toBe('radeaux');
    act(() => vi.advanceTimersByTime(300));
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].vigil).toBe(SEMAPHORE_VIGIL_5E);
    expect(scene.vigils[0].veiled).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

test('« Passer » pendant une veillée qui coupe : le voile couvre d’abord, la caméra revient derrière Kéo un quart de seconde après, le voile se lève ; le toucher sur le monde passe par la page (`pass`)', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    const veil = () => document.querySelector('.open-world-fondu')!;
    act(() => vi.advanceTimersByTime(600));
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].pass).toBeDefined();
    expect(veil()).not.toHaveClass('on');
    const done = vi.spyOn(scene.vigils[0], 'done');
    act(() => scene.options!.onCameraScript!(true));
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Passer' }));
    expect(veil()).toHaveClass('on');
    expect(done).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(done).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Le Sémaphore est éteint.')).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(veil()).not.toHaveClass('on');
    // Le toucher sur le monde, reçu par la scène, fait la même chose.
    cleanup();
    scene.vigils = [];
    localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    act(() => vi.advanceTimersByTime(600));
    expect(scene.vigils).toHaveLength(1);
    const done2 = vi.spyOn(scene.vigils[0], 'done');
    act(() => scene.vigils[0].pass!());
    expect(veil()).toHaveClass('on');
    expect(done2).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(done2).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

test('la scène refuse la veillée après le voile : le voile se lève, rien n’est retenu, la veillée reste à jouer à l’entrée suivante', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port } }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    scene.playVigils = false;
    act(() => vi.advanceTimersByTime(600));
    expect(scene.vigils).toHaveLength(0);
    expect(document.querySelector('.open-world-fondu')).not.toHaveClass('on');
    const saved = JSON.parse(localStorage.getItem('dysapps:game') ?? '{}') as { world?: { vigils?: string[] } };
    expect(saved.world?.vigils ?? []).toEqual([]);
  } finally {
    vi.useRealTimers();
  }
});

// Le départ du 5e commence par la lueur du niveau d'avant (GD-27, lot 5) : la caméra glisse depuis Kéo sans voile ; posée
// sur la lumière du Phare, la boîte écrit « Le Phare », son icône, sans phrase (« Réécouter » n'existe qu'avec une voix,
// absente ici) ; le voile couvre la
// coupe sur le Sémaphore, où la ligne s'écrit ; le voile revient pour le retour.
test('au départ du 5e : rien d’écrit pendant le glissement, « Le Phare » posé, le voile autour de la coupe, « Le Sémaphore est éteint. » après, le voile avant le retour', async () => {
  scene.playVigils = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, stock: {}, world: { links: [voyageId('5e')], place: getArchipelago('5e').port, vigils: ['5e-arrival'] } }));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    const veil = () => document.querySelector('.open-world-fondu')!;
    const box = () => document.querySelector('.open-world-veillee')!;
    let started = false;
    act(() => {
      started = window.__dysappsMondeOuvert!.veillee('departure');
    });
    expect(started).toBe(true);
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].vigil).toBe(DEPARTURE_VIGIL_5E);
    // Aucune coupe au début : la caméra glisse à découvert, la boîte est vide, sans « Passer » (le toucher passe).
    expect(scene.vigils[0].veiled).toBe(false);
    expect(box()).toHaveAttribute('data-shown', 'non');
    expect(box().querySelector('[role="status"]')).toHaveTextContent('');
    expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull();
    // La caméra posée sur la lumière : « Le Phare », hors de l'annonce, avec « Passer ».
    act(() => vi.advanceTimersByTime(PHARE_GLANCE_5E.travel * 1000 + 50));
    expect(box()).toHaveAttribute('data-shown', 'oui');
    expect(box().querySelector('.open-world-veillee-beyond')).toHaveTextContent('Le Phare');
    expect(box().querySelector('[role="status"]')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Passer' })).toBeInTheDocument();
    expect(veil()).not.toHaveClass('on');
    // Un quart de seconde avant la coupe, le voile ; à la coupe, la ligne ; un quart de seconde après, le voile se lève.
    const cut = (PHARE_GLANCE_5E.travel + PHARE_GLANCE_5E.hold) * 1000;
    act(() => vi.advanceTimersByTime(cut - 250 - PHARE_GLANCE_5E.travel * 1000));
    expect(veil()).toHaveClass('on');
    act(() => vi.advanceTimersByTime(300));
    expect(box().querySelector('.open-world-veillee-beyond')).toBeNull();
    expect(box().querySelector('[role="status"]')).toHaveTextContent('Le Sémaphore est éteint.');
    act(() => vi.advanceTimersByTime(300));
    expect(veil()).not.toHaveClass('on');
    // Avant le retour, le voile.
    act(() => vi.advanceTimersByTime(vigilSeconds(DEPARTURE_VIGIL_5E) * 1000 - cut - 400));
    expect(veil()).toHaveClass('on');
    act(() => scene.vigils[0].done());
    expect(screen.queryByText('Le Sémaphore est éteint.')).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(veil()).not.toHaveClass('on');
    const saved = JSON.parse(localStorage.getItem('dysapps:game') ?? '{}') as { world?: { vigils?: string[] } };
    expect(saved.world?.vigils).toEqual(['5e-arrival', '5e-departure']);
    expect(DEPARTURE_LIT_VIGIL_5E.shots[0]).toBe(PHARE_GLANCE_5E);
  } finally {
    vi.useRealTimers();
  }
});
