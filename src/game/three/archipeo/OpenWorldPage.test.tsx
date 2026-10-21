// « Relier » dans la page du monde ouvert (GD-20, point 3, « vraies terres, vrais ponts » ; relecture de l'expert
// frontend) : une terre payée, la scène reçoit ses terres fermées sans elle et la pose de son pont ; la phrase vient après
// la fin de la pose, jamais avec le toc, et celle du pont devenu reliable la suit. Et la commande prête dans la suggestion
// (lot L1 « Livrer »). La scène 3D n'est pas là sous jsdom : une scène simulée, qui pose le pont d'un coup (`instant`), ou
// attend qu'on dise le toc et la fin.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { ProgressProvider } from '../../../core/ProgressContext';
import { SettingsProvider } from '../../../core/SettingsContext';
import { BloclandProvider } from '../../BloclandContext';
import { reachableIslands } from '../../world/archipelago';
import { landById, type LinkedLand } from '../../world/continu/lands';
import { placeById } from '../../world/continu/levelPlan';
import { planCells } from '../../world/plans';
import { COMMANDES } from '../../world/requests';
import { VEHICLE_STAGES } from '../../world/vehicle';
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
      question: () => [],
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

test('une commande prête porte la suggestion (GD-20, point 4, lot L1) : sa phrase dans la bulle, « Y aller » vers l’habitant, la marque à son lieu, sa pastille pleine ; jamais « Aucune mission » ; arrivé chez lui, sa pastille se retire', async () => {
  const potager = COMMANDES.find((c) => c.fixture === 'french-6e-phonology-fixture-1')!;
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { [potager.block]: potager.count }, world: { links: [], requests: [potager.id] } }));
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(await screen.findByText('Livre 3 blocs de terre au Phare.')).toBeInTheDocument();
  expect(screen.queryByText(/Aucune mission/)).toBeNull();
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
  // Une seule suggestion : ni la phrase de la commande, ni sa pastille pleine, ni « Aucune mission ».
  expect(screen.queryByText('Livre 3 blocs de terre au Phare.')).toBeNull();
  expect(screen.queryByText(/Aucune mission/)).toBeNull();
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

test('la Nef pas encore prête ne porte pas la marque', async () => {
  renderPage();
  await screen.findByRole('button', { name: /Carte/ });
  expect(scene.world!.setMark).not.toHaveBeenCalledWith('nef');
});

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
