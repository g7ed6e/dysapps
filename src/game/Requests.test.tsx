// La section « Commandes » (GD-7, PR 3) dans le panneau d'île et la page de l'île, et l'arrivée des commandes dans le
// contexte du jeu, dans Blocland et dans Archipéo (décision du mainteneur du 4 octobre 2026).
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BLOC, getBiome, missionsJouables, type BiomeId } from './biomes';
import { BloclandProvider, useBlocland } from './BloclandContext';
import { exercisesOf } from './exercises';
import { IslandSheet } from './IslandSheet';
import { MenuSheet } from './MenuSheet';
import { getCommande, type Commande } from './world/requests';
import { casesDeLaPetiteConstruction } from './world/fixtures';

const FORET = 'french-6e-phonology';
const PLAINE = 'maths-6e-calculation';
const PONT_FERME = 'french-6e-phonology-french-6e-grammar-spelling';
const MOUSSO = 'french-6e-phonology-request-1';
const COCO = 'maths-6e-calculation-request-1';

const joue = (...iles: BiomeId[]) =>
  Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));

function sauver(game: Record<string, unknown>, univers: 'blocland' | 'archipeo' = 'blocland') {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers, autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 3, ...game }));
}

function Etat() {
  const { state, buildBridge } = useBlocland();
  return (
    <>
      <p data-testid="etat">
        commandes {(state.world.requests ?? []).join(',') || 'aucune'} · terre {state.stock[BLOC.terre] ?? 0} · posée{' '}
        {state.world.parts['french-6e-phonology-fixture-1']?.length ?? 0}
      </p>
      <button type="button" onClick={() => buildBridge(PONT_FERME)}>
        Construire le pont
      </button>
    </>
  );
}

function ouvrir(ile?: BiomeId, highlight?: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            {ile ? <IslandSheet biome={getBiome(ile)!} onClose={() => {}} highlight={highlight} /> : <MenuSheet onClose={() => {}} />}
            <Etat />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const pret = { progress: joue(FORET, PLAINE), stock: { [BLOC.terre]: 4 }, world: { parts: {}, log: [], links: [PONT_FERME], place: FORET, requests: [MOUSSO, COCO] } };

it('dans le panneau de l’île de la créature : « Livrer » pose la petite construction et dit la phrase', async () => {
  sauver(pret);
  ouvrir(FORET);
  const liste = screen.getByRole('list', { name: 'Les commandes des créatures' });
  const lignes = within(liste).getAllByRole('listitem');
  // La plus ancienne en tête ; la phrase de la première fois, tant que rien n'est livré.
  expect(lignes.map((l) => l.getAttribute('data-commande'))).toEqual([MOUSSO, COCO]);
  expect(document.body.textContent).toContain('Une commande, c’est une créature qui te demande des blocs pour une petite construction. Rien ne presse.');
  // Mousso : prête, sur son île : « Livrer ». Coco : pas prête : la phrase dit quoi faire, et « Y aller » vers la Forêt.
  expect(lignes[0].textContent).toContain('3 blocs de terre');
  expect(lignes[0].textContent).toContain('Tu as les blocs de terre\u00a0! Livre-les à Mousso.');
  expect(within(lignes[1]).queryByRole('button', { name: /Livrer/ })).toBeNull();
  // Pas prête : le nom de la créature devant la phrase.
  expect(lignes[1].textContent).toContain('Coco : Il me faut');
  await userEvent.click(within(lignes[0]).getByRole('button', { name: /Livrer/ }));
  // La phrase prend la place de la ligne livrée, et le focus.
  const livree = document.querySelector(`[data-commande="${MOUSSO}"]`) as HTMLElement;
  expect(livree.textContent).toContain('Potager posé chez Mousso\u00a0!');
  expect(within(liste).getAllByRole('listitem').map((l) => l.getAttribute('data-commande'))).toEqual([MOUSSO, COCO]);
  expect(livree.querySelector('.commande-posee')).toHaveFocus();
  expect(within(livree).queryByRole('button', { name: /Livrer/ })).toBeNull();
  const cases = casesDeLaPetiteConstruction(getCommande(MOUSSO)!.fixture)!.length;
  expect(screen.getByTestId('etat').textContent).toBe(`commandes ${COCO} · terre 1 · posée ${cases}`);
});

it('déjà sur l’île qui donne le bloc, « Y aller » mène aux missions de l’île et le dit', async () => {
  sauver(pret);
  ouvrir(FORET);
  const coco = document.querySelector(`[data-commande="${COCO}"]`) as HTMLElement;
  expect(within(coco).queryByRole('link', { name: /Y aller/ })).toBeNull();
  await userEvent.click(within(coco).getByRole('button', { name: /Y aller/ }));
  expect(coco.textContent).toContain('Tu y es : joue une mission ici.');
  expect(screen.getByRole('heading', { name: /Missions/ })).toHaveFocus();
});

it('« Tu y es » se réécoute sur la ligne, se lit en lecture automatique et s’écrit sous le titre « Missions »', async () => {
  const dit: string[] = [];
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  );
  vi.stubGlobal('speechSynthesis', { cancel: () => {}, getVoices: () => [], speak: (u: { text: string }) => dit.push(u.text) });
  try {
    sauver(pret);
    localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'blocland', autoRead: true, sounds: false }));
    ouvrir(FORET);
    const sousMissions = document.querySelector('.commande-ici-missions') as HTMLElement;
    expect(sousMissions.textContent).toBe('');
    const coco = document.querySelector(`[data-commande="${COCO}"]`) as HTMLElement;
    await userEvent.click(within(coco).getByRole('button', { name: /Y aller/ }));
    // Le bouton de lecture de la ligne le relit.
    expect(within(coco).getByRole('button', { name: /Écouter : Coco : Il me faut.*Tu y es : joue une mission ici\./ })).toBeInTheDocument();
    // Lu tout de suite, la lecture automatique étant réglée.
    expect(dit.some((t) => t.includes('Tu y es'))).toBe(true);
    // Sous le titre « Missions », là où le panneau défile, avec son bouton de lecture.
    const titre = screen.getByRole('heading', { name: /Missions/ });
    expect(titre.nextElementSibling).toBe(sousMissions);
    expect(sousMissions).toHaveAttribute('role', 'status');
    expect(sousMissions.textContent).toContain('Tu y es : joue une mission ici.');
    expect(within(sousMissions).getByRole('button', { name: /Écouter : Tu y es/ })).toBeInTheDocument();
  } finally {
    vi.unstubAllGlobals();
  }
});

it('pas prête, avec une partie des blocs : « Tu en as 1 sur 3. » dans la phrase écrite et lue', () => {
  sauver({ ...pret, stock: { [BLOC.terre]: 1 } });
  ouvrir(PLAINE);
  const mousso = document.querySelector(`[data-commande="${MOUSSO}"]`) as HTMLElement;
  expect(mousso.textContent).toContain('Mousso : Il me faut 3 blocs de terre pour mon potager. Joue une mission de la Ferme des accords. Tu en as 1 sur 3.');
  expect(document.body.textContent).not.toContain('(tu en as');
});

it('en 3D, la phrase « posée » attend la fin de la vague de pose', async () => {
  sauver(pret);
  function Panneau() {
    const [enCours, setEnCours] = useState<string | null>(null);
    return (
      <>
        <IslandSheet
          biome={getBiome(FORET)!}
          onClose={() => {}}
          in3d
          onLivree={(c: Commande) => {
            setEnCours(c.id);
            return true;
          }}
          commandeEnCoursDePose={enCours}
        />
        <button type="button" onClick={() => setEnCours(null)}>
          Fin de la vague
        </button>
      </>
    );
  }
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <Panneau />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: /Livrer/ }));
  const livree = document.querySelector(`[data-commande="${MOUSSO}"]`) as HTMLElement;
  expect(livree.textContent).not.toContain('Potager posé chez Mousso\u00a0!');
  expect(livree.querySelector('.commande-posee')).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Fin de la vague' }));
  expect(livree.textContent).toContain('Potager posé chez Mousso\u00a0!');
});

it('une adresse bizarre (`?worksite=`) ne casse rien : la ligne se cherche par son identifiant, pas par un sélecteur', () => {
  sauver(pret);
  Element.prototype.scrollIntoView = () => {};
  try {
    expect(() => ouvrir(FORET, 'a"]')).not.toThrow();
    expect(screen.getByRole('list', { name: 'Les commandes des créatures' })).toBeInTheDocument();
  } finally {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

it('ailleurs, une commande prête mène chez sa créature, sur sa ligne ; jamais de « Livrer » grisé', () => {
  sauver(pret);
  ouvrir(PLAINE);
  const ligne = document.querySelector(`[data-commande="${MOUSSO}"]`) as HTMLElement;
  expect(within(ligne).getByRole('link', { name: /Y aller/ })).toHaveAttribute('href', `/adventure/${FORET}?worksite=${MOUSSO}`);
  expect(screen.queryByRole('button', { name: /Livrer/ })).toBeNull();
});

it('le menu montre la même section, avec « Y aller » seulement, dépliée quand une commande est prête', () => {
  sauver(pret);
  ouvrir();
  const menu = screen.getByRole('dialog', { name: 'Menu' });
  expect(menu.querySelector('#commandes-menu')?.textContent).toBe(' Commandes · 1 prête');
  expect(menu.querySelector('details.island-fold-commandes')).toHaveAttribute('open');
  expect(within(menu).queryByRole('button', { name: /Livrer/ })).toBeNull();
  expect(within(menu).getAllByRole('link', { name: /Y aller/ })).toHaveLength(2);
});

it('au menu, sans commande prête, la section est repliée, le titre et le compte visibles', () => {
  sauver({ ...pret, stock: {} });
  ouvrir();
  const menu = screen.getByRole('dialog', { name: 'Menu' });
  expect(menu.querySelector('#commandes-menu')?.textContent).toBe(' Commandes · 2 en attente');
  expect(menu.querySelector('details.island-fold-commandes')).not.toHaveAttribute('open');
});

it('au menu du monde 3D, « Y aller » ouvre le panneau de l’île visée, comme un toucher sur l’île', async () => {
  sauver(pret);
  const aller = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <MenuSheet onClose={() => {}} onAller={aller} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  const [mousso, coco] = screen.getAllByRole('link', { name: /Y aller/ });
  await userEvent.click(mousso);
  expect(aller).toHaveBeenLastCalledWith(FORET, MOUSSO);
  await userEvent.click(coco);
  expect(aller).toHaveBeenLastCalledWith(FORET, undefined);
});

it('un ouvrage construit fait arriver une commande dans Blocland', async () => {
  sauver({ progress: joue(FORET, PLAINE), stock: { [BLOC.bois]: 9 }, world: { parts: {}, log: [], links: [], place: FORET } });
  ouvrir(FORET);
  expect(screen.getByTestId('etat').textContent).toContain('commandes aucune');
  expect(screen.queryByRole('heading', { name: /Commandes/ })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Construire le pont' }));
  expect(screen.getByTestId('etat').textContent).toContain(`commandes ${MOUSSO}`);
  expect(screen.getByRole('heading', { name: /Commandes/ })).toBeInTheDocument();
});

it('Archipéo (décision du 4 octobre 2026) : les commandes arrivent et s’affichent, avec ses mots', async () => {
  sauver({ progress: joue(FORET, PLAINE), stock: { [BLOC.bois]: 9 }, world: { parts: {}, log: [], links: [], place: FORET, requests: [COCO] } }, 'archipeo');
  ouvrir(FORET);
  expect(screen.getByRole('heading', { name: /Commandes/ })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Les commandes des habitants' })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Un habitant te demande des blocs pour bâtir chez lui. Tu les livres quand tu veux.');
  await userEvent.click(screen.getByRole('button', { name: 'Construire le pont' }));
  // Un ouvrage construit fait arriver la commande de Mousso, comme dans Blocland.
  expect(screen.getByTestId('etat').textContent).toContain(`commandes ${COCO},${MOUSSO} ·`);
});
