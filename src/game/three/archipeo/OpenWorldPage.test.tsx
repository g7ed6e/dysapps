// « Relier » dans la page du monde ouvert (GD-20, point 3, « vraies terres, vrais ponts » ; relecture de l'expert
// frontend) : une terre payée, la scène reçoit ses terres fermées sans elle et la pose de son pont ; la phrase vient après
// la fin de la pose, jamais avec le toc, et celle du pont devenu reliable la suit. Et la commande prête dans la suggestion
// (lot L1 « Livrer »). La scène 3D n'est pas là sous jsdom : une scène simulée, qui pose le pont d'un coup (`instant`), ou
// attend qu'on dise le toc et la fin.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { reachableIslands } from '../../world/archipelago';
import { toutConstruit } from '../../world/budget';
import { landById, type LinkedLand } from '../../world/continu/lands';
import { placeById } from '../../world/continu/levelPlan';
import { planCells, plansFor } from '../../world/plans';
import { getIle } from '../../biomes';
import { PLACES } from '../../world/continu/plan6e';
import { COMMANDES } from '../../world/requests';
import { VEHICLE_STAGES } from '../../world/vehicle';
import type { BridgeLayEvents, OpenWorld, OpenWorldOptions } from './scene';
import OpenWorldPage from './OpenWorldPage';
import type { Vigil } from '../../world/continu/vigil';
import { FERRY_VIGIL_6E, PHARE_VIGIL_6E } from '../../world/continu/vigils6e';

const scene = vi.hoisted(() => ({
  options: null as OpenWorldOptions | null,
  closed: [] as readonly LinkedLand[],
  world: null as OpenWorld | null,
  instant: true,
  lay: null as { land: LinkedLand; events: BridgeLayEvents } | null,
  // Les veillées demandées à la scène (GD-23, GD-27, lot 3), et si elle les joue (`playVigils`).
  vigils: [] as { vigil: Vigil; done: () => void }[],
  playVigils: false,
}));
vi.mock('./scene', () => ({
  createOpenWorld: (_host: HTMLElement, options: OpenWorldOptions) => {
    scene.options = options;
    scene.closed = [];
    const own: Partial<OpenWorld> = {
      question: () => [],
      onSceneTurn: () => () => {},
      playVigil: (vigil, done) => {
        if (!scene.playVigils) return false;
        scene.vigils.push({ vigil, done });
        return true;
      },
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

// « Reprendre » quand le chargement des exercices échoue (hors ligne) : `revisionPlanOf` rejette une fois.
const plan = vi.hoisted(() => ({ fail: false }));
vi.mock('./revisionOf', async (original) => {
  const m = await original<typeof import('./revisionOf')>();
  return { ...m, revisionPlanOf: (...args: Parameters<typeof m.revisionPlanOf>) => (plan.fail ? Promise.reject(new Error('hors ligne')) : m.revisionPlanOf(...args)) };
});
const pay = vi.hoisted(() => ({ refuse: false, ctx: null as ReturnType<typeof import('../../BloclandContext').useBlocland> | null }));
vi.mock('../../BloclandContext', async (original) => {
  const m = await original<typeof import('../../BloclandContext')>();
  return {
    ...m,
    useBlocland: () => {
      const b = m.useBlocland();
      pay.ctx = b;
      return pay.refuse ? { ...b, linkLand: () => ({ ok: false, reason: 'blocs', missing: 1 }) } : b;
    },
  };
});

// La voile arrivée (GD-21) sans lieux achevés : le kit donné d'office, pour une Nef prête.
const nef = vi.hoisted(() => ({ kit: false }));
vi.mock('./NefSheet', async (original) => {
  const m = await original<typeof import('./NefSheet')>();
  return { ...m, nefSail: (...args: Parameters<typeof m.nefSail>) => (nef.kit ? { kit: true, missing: 0 } : m.nefSail(...args)) };
});

// Les substitutions (matchMedia du petit écran, ResizeObserver) ne passent pas d'un test à l'autre (relecture du code).
afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  pay.refuse = false;
  nef.kit = false;
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
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-letter-confusion': 12 } }));
});

function renderPage() {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/adventure']}>
            <OpenWorldPage level="6e" />
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

test('la pose du pont : la scène la reçoit pour la terre payée ; la phrase attend sa fin, jamais avec le toc', async () => {
  scene.instant = false;
  renderPage();
  await relier('couchant', 'Le Couchant');
  expect(scene.closed).toEqual(['large', 'levant', 'cretes']);
  expect(scene.lay?.land).toBe('couchant');
  vi.useFakeTimers();
  try {
    // Le toc : aucune phrase avec lui, ni pendant que la brume se lève.
    act(() => scene.lay!.events.tap());
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('Le pont est rebâti.')).not.toBeInTheDocument();
    // La fin de la pose : la phrase.
    act(() => scene.lay!.events.laid());
    act(() => vi.advanceTimersByTime(10));
    expect(screen.getByText('Le pont est rebâti.')).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test('un pont posé d’un coup (« Réduire les animations ») : le toc, puis la phrase un moment après, jamais avec lui', async () => {
  scene.instant = false;
  renderPage();
  await relier('couchant', 'Le Couchant');
  vi.useFakeTimers();
  try {
    act(() => {
      scene.lay!.events.tap();
      scene.lay!.events.laid();
    });
    act(() => vi.advanceTimersByTime(10));
    expect(screen.queryByText('Le pont est rebâti.')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('Le pont est rebâti.')).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
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

test('une terre à moitié ouverte en cours de session (un lieu relié par la grille) : le reste de la terre reçoit ses liaisons aussitôt, sans rien débiter (relecture de l’expert frontend)', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  // Du Phare vers un lieu du Couchant, par la grille : une seule liaison, payée 4.
  act(() => {
    expect(pay.ctx!.buildBridge('french-6e-phonology-life-earth-sciences-6e-living-world')).toMatchObject({ ok: true });
  });
  const islands = reachableIslands([...pay.ctx!.state.world.links]);
  for (const id of landById('couchant').places) expect(islands.has(placeById(id).island as never), id).toBe(true);
  expect(pay.ctx!.state.stock['french-6e-letter-confusion']).toBe(8);
  expect(scene.closed).toEqual(['large', 'levant', 'cretes']);
});

test('une commande prête porte la suggestion (GD-20, point 4, lot L1) : sa phrase dans la bulle, « Y aller » vers l’habitant, la marque à son lieu, sa pastille pleine ; une seule bulle ; arrivé chez lui, sa pastille se retire', async () => {
  const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText('Livre 3 blocs de terre au Phare.')).toBeInTheDocument();
  expect(document.querySelectorAll('.open-world-go-reason')).toHaveLength(1);
  const go = screen.getByRole('button', { name: 'Y aller : Le Phare' });
  expect(go).toHaveClass('primary');
  const w = scene.world!;
  expect(w.setMark).toHaveBeenLastCalledWith('phare');
  expect(w.setSigns).toHaveBeenLastCalledWith(['phare']);
  expect(document.querySelector('.open-world-sign[data-lieu="phare"]')).toHaveClass('suggested');
  await userEvent.setup().click(go);
  expect(w.goTo).toHaveBeenLastCalledWith('phare', true);
  // Kéo arrivé au Phare : la pastille de son habitant ne s'affiche plus (elle couvrirait Kéo) ; le panneau s'ouvre.
  act(() => scene.options!.onArrive('phare'));
  expect(w.setSigns).toHaveBeenLastCalledWith([]);
  const sheet = await screen.findByRole('dialog', { name: 'Le Phare' });
  expect(within(sheet).getByRole('group')).toHaveTextContent('Livre 3 blocs de terre au Phare.');
});

test('la Nef prête porte la suggestion, avant une commande prête (GD-21, « Prête ») : la marque sur la Nef, « Y aller » mène au quai et ouvre sa fiche, « Partir »', async () => {
  const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
  const stage = VEHICLE_STAGES[0];
  nef.kit = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id], parts: { [stage.id]: planCells(stage).map((c) => c.key) } } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  const w = scene.world!;
  expect(w.setMark).toHaveBeenLastCalledWith('nef');
  // Une seule suggestion : ni la phrase de la commande, ni sa pastille pleine, ni aucune bulle.
  expect(screen.queryByText('Livre 3 blocs de terre au Phare.')).toBeNull();
  expect(document.querySelector('.open-world-go-reason')).toBeNull();
  expect(document.querySelector('.open-world-sign.suggested')).toBeNull();
  // Kéo au quai, devant la Nef : la marque s'y retire, comme celle d'un lieu (directeur artistique, relecture des restes
  // du 5e) ; Kéo parti marcher ailleurs, elle revient, sans les points de la distance (consultant d'Archipéo).
  expect(document.querySelector('.open-world-mark')).toBeNull();
  act(() => {
    scene.options!.onDepart();
    scene.options!.onArrive(null);
  });
  expect(document.querySelector('.open-world-mark-word')).toHaveTextContent('La Nef');
  expect(document.querySelector('.open-world-mark .open-world-distance')).toBeNull();
  // Comme la scène : Kéo déposé au quai, qui ouvre d'abord la fiche du lieu de départ ; celle de la Nef la remplace.
  vi.mocked(w.goToPort).mockImplementation((spot) => scene.options!.onPort(spot));
  await userEvent.setup().click(screen.getByRole('button', { name: 'Y aller : La Nef' }));
  expect(w.goToPort).toHaveBeenLastCalledWith('quai');
  const sheet = await screen.findByRole('dialog', { name: 'La Nef' });
  expect(within(sheet).getByRole('button', { name: /^Partir/ })).toBeInTheDocument();
  expect(document.querySelector('.open-world-mark')).toBeNull();
});

// La pastille de la Nef (GD-25, sujet 6 des restes du 3e, piste A, choix du mainteneur du 23 octobre 2026).
const nefSign = () => document.querySelector<HTMLButtonElement>('.open-world-sign[data-lieu="nef"]');

test('la pastille de la Nef paraît quand « Poser » serait actif sur sa fiche : l’icône du bloc à poser, jamais pleine, sans texte, « La Nef : on peut poser » ; la toucher mène au quai et ouvre la fiche ; la pose faite, elle se retire', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 2 }, world: { links: [] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  const w = scene.world!;
  expect(vi.mocked(w.setSigns).mock.lastCall?.[0]).toContain('nef');
  // La scène la pose au-dessus de la Nef, à l'écran : elle se montre, son nom lu.
  act(() => scene.options!.onSigns!([{ place: 'nef', x: 200, y: 120, shown: true }]));
  const sign = screen.getByRole('button', { name: 'La Nef : on peut poser' });
  expect(sign.dataset.lieu).toBe('nef');
  expect(sign).not.toHaveClass('suggested');
  expect(sign.textContent).toBe('');
  expect(sign.querySelector('.voxel-icon, svg')).not.toBeNull();
  vi.mocked(w.goToPort).mockImplementation((spot) => scene.options!.onPort(spot));
  fireEvent.click(sign);
  expect(w.goToPort).toHaveBeenLastCalledWith('quai');
  const sheet = await screen.findByRole('dialog', { name: 'La Nef' });
  await userEvent.setup().click(within(sheet).getByRole('button', { name: /Poser/ }));
  // Les deux blocs posés, l'inventaire n'en a plus : « Poser » n'est plus actif, la pastille se retire.
  await vi.waitFor(() => expect(nefSign()).toBeNull());
  expect(vi.mocked(w.setSigns).mock.lastCall?.[0]).not.toContain('nef');
});

test('sans bloc à poser sur la Nef, pas de pastille de la Nef', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'maths-5e-signed-numbers': 4 }, world: { links: [] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(nefSign()).toBeNull();
  expect(vi.mocked(scene.world!.setSigns).mock.lastCall?.[0]).not.toContain('nef');
});

test('la marque de la suggestion sur la Nef prête : pas de pastille de la Nef', async () => {
  const stage = VEHICLE_STAGES[0];
  nef.kit = true;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 2 }, world: { links: [], parts: { [stage.id]: planCells(stage).map((c) => c.key) } } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.world!.setMark).toHaveBeenLastCalledWith('nef');
  expect(nefSign()).toBeNull();
  expect(vi.mocked(scene.world!.setSigns).mock.lastCall?.[0]).not.toContain('nef');
});

test('la Nef pas encore prête ne porte pas la marque', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.world!.setMark).not.toHaveBeenCalledWith('nef');
});

test('une seule bulle à la fois : une phrase du monde (l’état d’un lieu restauré) retire la bulle sous « Y aller », qui revient ensuite (relecture des Fabriques)', async () => {
  const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText('Livre 3 blocs de terre au Phare.')).toBeInTheDocument();
  act(() => scene.options!.onRestored!('phare'));
  const status = await screen.findByText(/est restauré/, {}, { timeout: 2000 });
  expect(status.closest('.open-world-said')).not.toBeNull();
  expect(document.querySelectorAll('.open-world-go-reason')).toHaveLength(0);
  expect(screen.queryByText('Livre 3 blocs de terre au Phare.')).toBeNull();
  // La phrase partie, la bulle de la commande revient.
  expect(await screen.findByText('Livre 3 blocs de terre au Phare.', {}, { timeout: 10_000 })).toBeInTheDocument();
}, 15_000);

test('Kéo au Phare, sa commande prête, une mission du Phare encore nouvelle, la destination du jeu ailleurs : la suggestion est la mission du Phare (le rang 2), jamais « Y aller » vers un autre lieu (avis du directeur artistique, deuxième passe du lot L1)', async () => {
  const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
  // Dans la grille, l'élève se tient aux Quais, où une mission n'a jamais été jouée : la destination du jeu est là.
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id], place: placeById('quais').island } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  const w = scene.world!;
  // Avant l'arrivée, la commande prête porte la suggestion (rang 3, Kéo n'est nulle part).
  expect(screen.getByRole('button', { name: 'Y aller : Le Phare' })).toHaveClass('primary');
  act(() => scene.options!.onArrive('phare'));
  const sheet = await screen.findByRole('dialog', { name: 'Le Phare' });
  // Le panneau met en avant une mission du Phare ; la ligne de l'habitant y est, sans « Livrer » plein.
  expect(sheet.querySelector('[aria-current="step"]')).not.toBeNull();
  const line = within(sheet).getByRole('group');
  expect(line).toHaveTextContent('Livre 3 blocs de terre au Phare.');
  expect(within(line).getByRole('button', { name: /Livrer/ })).not.toHaveClass('primary');
  await userEvent.setup().keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Le Phare' })).toBeNull();
  // La bulle : « Y aller » vers le Phare et sa mission, jamais vers un autre lieu ; ni « Livrer » ni la phrase de la commande.
  const go = screen.getByRole('button', { name: /^Y aller : / });
  expect(go.getAttribute('aria-label')).toMatch(/^Y aller : Le Phare, /);
  expect(screen.queryByText('Livre 3 blocs de terre au Phare.')).toBeNull();
  expect(screen.queryByRole('button', { name: /Livrer/ })).toBeNull();
  expect(w.setMark).toHaveBeenLastCalledWith('phare');
});

test('l’entraide dans la suggestion (lot L2) : « Apporte la lanterne au Phare. », « Y aller », sa pastille pleine ; chez l’habitant, « Apporter » ouvre la remise, l’étape s’écrit une fois à l’état final, puis les 50 XP', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], stories: [{ id: 'story-6e-1', step: 2 }] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText('Apporte la lanterne au Phare.')).toBeInTheDocument();
  const w = scene.world!;
  expect(screen.getByRole('button', { name: 'Y aller : Le Phare' })).toHaveClass('primary');
  expect(w.setMark).toHaveBeenLastCalledWith('phare');
  expect(document.querySelector('.open-world-sign[data-lieu="phare"]')).toHaveClass('suggested');
  expect(document.querySelector('.open-world-sign[data-lieu="phare"]')).toHaveAttribute('aria-label', 'Entraide, la lanterne, au Phare');
  act(() => scene.options!.onArrive('phare'));
  // Arrivé : la marque se retire (la bulle porte le geste).
  expect(document.querySelector('.open-world-mark')).toBeNull();
  const sheet = await screen.findByRole('dialog', { name: 'Le Phare' });
  await userEvent.setup().click(within(within(sheet).getByRole('group')).getByRole('button', { name: /Apporter/ }));
  expect(w.remise).toHaveBeenLastCalledWith({ place: 'phare', amenagement: 'french-6e-phonology-fixture-2', carry: true }, expect.anything());
  expect(pay.ctx!.state.world.stories).toEqual([{ id: 'story-6e-1', step: 2 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
  expect(pay.ctx!.state.world.stories).toBeUndefined();
  expect(pay.ctx!.state.world.parts['french-6e-phonology-fixture-2']).toBeDefined();
  expect(screen.getByLabelText('50 XP')).toBeInTheDocument();
});

test('l’étape « mission » de l’entraide porte la prochaine mission dans son lieu : sa phrase dans la bulle, la marque aux Quais', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], stories: [{ id: 'story-6e-1', step: 0 }] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText('Joue une mission aux Quais.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Y aller : Les Quais, / })).toHaveClass('primary');
  expect(scene.world!.setMark).toHaveBeenLastCalledWith('quais');
});

describe('La bulle au-dessus de « Y aller » : rien, ou l’action (choix du mainteneur, 24 octobre 2026)', () => {
  test('tout construit et relié : aucune bulle au quai, ni devant un lieu restauré ; jamais « Aucune mission »', async () => {
    const { progress, world } = toutConstruit();
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, progress, world }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    expect(screen.getByRole('button', { name: /Y aller/ })).toBeDisabled();
    expect(document.querySelector('.open-world-go-reason')).toBeNull();
    act(() => scene.options!.onArrive('phare'));
    await userEvent.setup().keyboard('{Escape}');
    expect(document.querySelector('.open-world-go-reason')).toBeNull();
    expect(screen.queryByText(/Aucune mission/)).toBeNull();
  });

  test('plus rien à jouer, une terre fermée qu’on peut relier : un bouton dit l’action, l’icône du pont et le nom de la terre, et ouvre sa fiche', async () => {
    const { progress, world } = toutConstruit();
    const islands = landById('large').places.map((id) => placeById(id).island);
    const open = Object.fromEntries(Object.entries(progress).filter(([k]) => !islands.some((i) => k.startsWith(`${i}-`))));
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, progress: open, world: { ...world, links: [] } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    const link = await screen.findByRole('button', { name: 'Relier le Large' });
    expect(link).toHaveClass('open-world-go-reason');
    expect(link).not.toHaveClass('primary');
    expect(link.querySelector('svg')).not.toBeNull();
    expect(screen.queryByText(/Aucune mission/)).toBeNull();
    // Le toucher ouvre la fiche de la terre, la même qu'un de ses lieux touché, son « Relier » en tête.
    await userEvent.setup().click(link);
    const sheet = await screen.findByRole('dialog', { name: 'Le Large' });
    expect(within(sheet).getByRole('button', { name: /Relier/ })).toHaveFocus();
  });
});

describe('« Reprendre » chez l’habitant (GD-20, point 4, lot L3)', () => {
  const due = (ids: string[]) => ids.map((itemId) => ({ itemId, due: '2020-01-01', stage: 0, streak: 0 }));
  function LocationProbe() {
    return <output data-testid="adresse">{`${useLocation().pathname}${useLocation().search}`}</output>;
  }
  function renderWithProbe() {
    render(
      <SettingsProvider>
        <ProgressProvider>
          <BloclandProvider>
            <MemoryRouter initialEntries={['/adventure']}>
              <OpenWorldPage level="6e" />
              <LocationProbe />
            </MemoryRouter>
          </BloclandProvider>
        </ProgressProvider>
      </SettingsProvider>,
    );
  }
  async function reprendreAuxQuais() {
    renderWithProbe();
    await screen.findByRole('button', { name: /Carte/ });
    act(() => scene.options!.onArrive('quais'));
    const sheet = await screen.findByRole('dialog', { name: 'Les Quais' });
    await userEvent.setup().click(within(sheet).getByRole('button', { name: /Reprendre/ }));
  }

  test('Kéo chez un habitant qui a des révisions dues, plus rien à jouer : la bulle dit son rappel ; ailleurs, aucune bulle (relecture des habitants du 5e ; « Rien, ou l’action »)', async () => {
    const { progress, world } = toutConstruit();
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, progress, world: { ...world, links: [] }, spaced: due(['maths-6e-calculation-measures-1:maths-6e-calculation-measures-1-2']) }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    // Ailleurs qu'aux Quais : rien à faire, aucune bulle.
    expect(document.querySelector('.open-world-go-reason')).toBeNull();
    act(() => scene.options!.onArrive('quais'));
    const sheet = await screen.findByRole('dialog', { name: 'Les Quais' });
    expect(within(sheet).getByRole('group')).toHaveTextContent('On revoit quelques questions ensemble.');
    await userEvent.setup().keyboard('{Escape}');
    expect(await screen.findByText('On revoit quelques questions ensemble.', { selector: '.open-world-go-reason' })).toBeInTheDocument();
  });

  test('les questions dues qui se revoient ici : la révision se joue dans la scène des Quais, sans quitter le monde ; un calcul tiré au hasard n’y entre pas', async () => {
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, spaced: due(['maths-6e-calculation-times-tables-1:5x7', 'maths-6e-calculation-measures-1:maths-6e-calculation-measures-1-2']) }));
    await reprendreAuxQuais();
    expect(await screen.findByRole('list', { name: 'Question 1 sur 1' })).toBeInTheDocument();
    expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
  });

  test('un chargement qui échoue (hors ligne) : « Reprendre » retombe sur l’écran habituel, sans rester muet', async () => {
    plan.fail = true;
    try {
      localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, spaced: due(['maths-6e-calculation-measures-1:maths-6e-calculation-measures-1-2']) }));
      await reprendreAuxQuais();
      await vi.waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent(/revision=1/));
    } finally {
      plan.fail = false;
    }
  });

  test('rien qui se revoie ici (les maths générées) : « Reprendre » ouvre l’écran habituel, comme avant (B1)', async () => {
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, spaced: due(['maths-6e-calculation-times-tables-1:5x7']) }));
    await reprendreAuxQuais();
    await vi.waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent(/revision=1/));
    expect(document.querySelector('.quiz-steps-revision')).toBeNull();
  });
});

// Les veillées du 6e (GD-23, « trois veillées par niveau » ; GD-27, lot 3).
describe('Les veillées du 6e', () => {
  const saved = () => (JSON.parse(localStorage.getItem('dysapps:game') ?? '{}') as { world?: { vigils?: string[] } }).world?.vigils ?? [];

  test('à la première entrée dans le monde, au quai : la caméra va au Phare, « Le Phare est éteint. » s’écrit avec son haut-parleur, les boutons se cachent ; à la fin, la ligne s’efface et la veillée est retenue', async () => {
    scene.playVigils = true;
    renderPage();
    await screen.findByText('Le Phare est éteint.');
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].vigil).toBe(PHARE_VIGIL_6E);
    expect(document.querySelector('.open-world-veillee')).toHaveTextContent('Le Phare est éteint.');
    act(() => scene.options!.onCameraScript!(true));
    expect(screen.queryByRole('button', { name: /Carte/ })).toBeNull();
    act(() => {
      scene.vigils[0].done();
      scene.options!.onCameraScript!(false);
    });
    expect(screen.queryByText('Le Phare est éteint.')).toBeNull();
    await screen.findByRole('button', { name: /Carte/ });
    expect(saved()).toEqual(['6e-arrival']);
  });

  test('une veillée vue ne se rejoue pas ; une partie où un lieu est déjà rallumé ne voit jamais l’arrivée, retenue comme vue', async () => {
    scene.playVigils = true;
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], vigils: ['6e-arrival'] } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    expect(scene.vigils).toHaveLength(0);
    cleanup();
    const place = PLACES.find((p) => p.id === 'quais')!;
    const island = getIle(place.island)!;
    const parts = Object.fromEntries(plansFor(island.id).map((p) => [p.id, planCells(p).map((c) => c.key)]));
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], parts } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    expect(scene.vigils).toHaveLength(0);
    expect(saved()).toEqual(['6e-arrival']);
  });

  test('« Partir » : la veillée de départ d’abord, le Phare tel qu’il est, puis la Nef part, par la fin de la veillée ou le toucher qui la passe', async () => {
    scene.playVigils = true;
    const stage = VEHICLE_STAGES[0];
    nef.kit = true;
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], vigils: ['6e-arrival'], parts: { [stage.id]: planCells(stage).map((c) => c.key) } } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    const w = scene.world!;
    vi.mocked(w.goToPort).mockImplementation((spot) => scene.options!.onPort(spot));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Y aller : La Nef' }));
    const sheet = await screen.findByRole('dialog', { name: 'La Nef' });
    await userEvent.setup().click(within(sheet).getByRole('button', { name: /^Partir/ }));
    expect(scene.vigils).toHaveLength(1);
    expect(scene.vigils[0].vigil).toBe(PHARE_VIGIL_6E);
    expect(screen.getByText('Le Phare est éteint.')).toBeInTheDocument();
    expect(w.departNef).not.toHaveBeenCalled();
    act(() => scene.vigils[0].done());
    expect(w.departNef).toHaveBeenCalledTimes(1);
    expect(saved()).toEqual(['6e-arrival', '6e-departure']);
  });

  test('la Gare maritime rallumée sous les yeux de l’élève : la veillée de l’embarquement vient après la pose, « La radio monte à bord. » ; déjà rallumée en arrivant, jamais', async () => {
    scene.playVigils = true;
    const ferry = PLACES.find((p) => p.id === 'ferry')!;
    const island = getIle(ferry.island)!;
    const plans = plansFor(island.id);
    const parts = Object.fromEntries(plans.map((p) => [p.id, planCells(p).map((c) => c.key)]));
    // Déjà rallumée : rien, retenue comme vue.
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], vigils: ['6e-arrival'], parts } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    expect(scene.vigils).toHaveLength(0);
    expect(saved()).toEqual(['6e-arrival', '6e-boarding']);
    cleanup();
    // Rallumée sous les yeux de l'élève : la dernière partie posée pendant la page.
    const last = plans[plans.length - 1];
    const before = { ...parts, [last.id]: planCells(last).map((c) => c.key).slice(0, -1) };
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: {}, world: { links: [], vigils: ['6e-arrival'], parts: before } }));
    renderPage();
    await screen.findByRole('button', { name: /Carte/ });
    expect(scene.vigils).toHaveLength(0);
    act(() => {
      pay.ctx!.chargerPourLesMesures({ ...pay.ctx!.state, world: { ...pay.ctx!.state.world, parts } });
    });
    await screen.findByText('La radio monte à bord.');
    expect(scene.vigils[0].vigil).toBe(FERRY_VIGIL_6E);
    // La partie chargée pour les mesures ne s'écrit pas sur l'appareil : la veillée vue se lit dans l'état.
    expect(pay.ctx!.state.world.vigils).toContain('6e-boarding');
  });
});
