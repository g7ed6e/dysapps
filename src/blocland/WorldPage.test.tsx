import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider, useProgress } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { WorldPage } from './WorldPage';
import { BADGES } from '../core/progress';
import { demanderMoinsDAnimations } from '../core/mouvement.testing';
import { textesDe } from '../univers';

// Pas de WebGL dans les tests : un monde factice, qui montre l'île cadrée et laisse toucher une île.
vi.mock('./three', () => ({
  hasWebGL: () => false,
  VoxelCanvas: () => null,
  WorldCanvas: ({
    focus,
    cubes,
    onIntent,
    vehicle,
    archipelago,
    voyage,
    onVueDeplacee,
    recentrage,
    forceDay,
    avatar,
  }: {
    focus: { island: string | null; seq: number; spot?: { ile: string; local: { x: number; y: number } } };
    cubes: { x: number; place?: string }[];
    onIntent: (i: { genre: string; [k: string]: unknown }) => void;
    vehicle: { port: string; cubes: { ghost?: boolean }[] } | null;
    archipelago: string;
    voyage: { leg: string; stage: number; back: boolean } | null;
    onVueDeplacee?: (deplacee: boolean) => void;
    recentrage?: number;
    forceDay: boolean;
    avatar?: { route: { ile: string; local: { x: number; y: number } }[]; seq: number; flanerie?: boolean; vise?: boolean };
  }) => (
    <div className="voxel-canvas" tabIndex={0}>
      <p data-testid="lumiere">{forceDay ? 'jour' : 'heure réelle'}</p>
      <p data-testid="cadrage">{focus.island ?? 'aucune'}</p>
      <p data-testid="demandes-de-cadrage">{focus.seq}</p>
      <p data-testid="salle">{new Set(cubes.filter((c) => c.place === 'trophies').map((c) => c.x)).size} colonnes</p>
      <p data-testid="bonhomme">
        {avatar
          ? `${avatar.route.length > 1 ? 'marche' : 'se tient'} ${avatar.flanerie ? 'sur son île' : ''} ${avatar.vise ? 'rond' : 'sans rond'} ${avatar.route[avatar.route.length - 1].ile} ${avatar.route[avatar.route.length - 1].local.x},${avatar.route[avatar.route.length - 1].local.y}`
          : 'aucun'}
      </p>
      <p data-testid="point">{focus.spot ? `${focus.spot.ile} ${focus.spot.local.x},${focus.spot.local.y}` : 'aucun'}</p>
      <p data-testid="archipel">{archipelago}</p>
      <p data-testid="recentrage">{recentrage ?? 0}</p>
      <button type="button" onClick={() => onVueDeplacee?.(true)}>
        Faire glisser le monde
      </button>
      <button type="button" onClick={() => onVueDeplacee?.(false)}>
        La vue revient à son cadrage
      </button>
      <p data-testid="voyage">{voyage ? `${voyage.leg} ${voyage.stage} ${voyage.back ? 'retour' : 'aller'}` : 'aucun'}</p>
      <button type="button" onClick={() => onIntent({ genre: 'fin-du-voyage' })}>
        Fin du temps
      </button>
      <p data-testid="navire">{vehicle ? `${vehicle.port} ${vehicle.cubes.filter((c) => c.ghost).length}` : 'aucun'}</p>
      <button type="button" onClick={() => onIntent({ genre: 'ile', id: 'french-6e-phonology' })}>
        Toucher la Forêt dans le monde
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'ile', id: 'french-6e-phonology', sol: { ile: 'french-6e-phonology', local: { x: 8, y: 4, z: 0 } } })}>
        Toucher le sol de la Forêt
      </button>
      <button
        type="button"
        onClick={() => onIntent({ genre: 'face', ile: 'french-6e-phonology', case: { x: 8, y: 4, z: -1 }, voisine: { x: 8, y: 4, z: 0 }, sol: { ile: 'french-6e-phonology', local: { x: 8, y: 4, z: 0 } } })}
      >
        Toucher le sol de la Forêt ouverte
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'lieu', id: 'school', ile: 'french-6e-phonology' })}>
        Toucher l’école dans le monde
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'lieu', id: 'monument:landmark-6e-1', ile: 'french-6e-reading' })}>
        Toucher l’observatoire dans le monde
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'lieu', id: 'trophies', ile: 'french-6e-phonology' })}>
        Toucher la salle des trophées dans le monde
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'creature', id: 'french-6e-phonology' })}>
        Toucher la créature de la Forêt
      </button>
      <button type="button" onClick={() => vehicle && onIntent({ genre: 'navire', port: vehicle.port })}>
        Toucher le Bloc-Navire
      </button>
    </div>
  ),
}));

function Where() {
  return <p data-testid="adresse">{useLocation().pathname}</p>;
}

/** Dit si les bandeaux de récompense sont retenus (DA-9). */
function Retenus() {
  return <p data-testid="retenus">{useProgress().celebrationsHeld ? 'oui' : 'non'}</p>;
}

/** Répond juste à une question (pour gagner un succès pendant le test). */
function UneBonneReponse() {
  const { answer } = useProgress();
  return (
    <button type="button" onClick={() => answer(true)}>
      Répondre juste
    </button>
  );
}

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/adventure/:biomeId?" element={<WorldPage />} />
            </Routes>
            <Where />
            <Retenus />
            <UneBonneReponse />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const sheet = () => screen.queryByRole('dialog', { name: /^Forêt des sons/ });

it('replie le panneau d’une île et le rouvre, sans quitter l’île', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  expect(sheet()).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' })).toHaveAttribute('aria-pressed', 'true');

  // La croix replie le panneau : on reste sur l'île, la caméra aussi.
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');

  // Le bouton de l'île, dans la barre du bas, le rouvre ; puis le replie.
  const toggle = screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await user.click(toggle);
  expect(sheet()).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
});

it('la créature touchée parle dans une bulle qu’on peut fermer', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Toucher la créature de la Forêt' }));
  const bulle = () => screen.queryAllByRole('status').find((el) => el.classList.contains('world-line'));
  expect(bulle()).toBeDefined();
  await user.click(within(bulle()!).getByRole('button', { name: 'Fermer' }));
  expect(bulle()).toBeUndefined();
});

it('le panneau replié reste replié quand on touche l’île où l’on est ; une autre île ouvre le sien', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  const bulle = () => screen.queryAllByRole('status').find((el) => el.classList.contains('world-line'));
  expect(bulle()).toBeUndefined();
  // Toucher l'île : sa créature parle (une réponse visible), le panneau reste replié.
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(bulle()).toHaveTextContent(/^Mousso :/);
  // Toucher la créature fait de même.
  await user.click(within(bulle()!).getByRole('button', { name: 'Fermer' }));
  await user.click(screen.getByRole('button', { name: 'Toucher la créature de la Forêt' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(bulle()).toBeDefined();
  // Depuis le village sans île, toucher la Forêt ouvre son panneau.
  cleanup();
  renderAt('/adventure');
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(sheet()).toBeInTheDocument();
});

it('toucher le sol de l’île où l’on est : le bonhomme y marche, un rond sur le but ; ni le panneau ni la caméra ne bougent', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  const bonhomme = () => screen.getByTestId('bonhomme').textContent ?? '';
  expect(bonhomme()).toMatch(/^se tient .*sans rond french-6e-phonology 1,1$/);
  // Panneau ouvert : il reste ouvert.
  const cadrages = screen.getByTestId('demandes-de-cadrage').textContent;
  // L'île ouverte est en chantier : le sol touché est une face, qui n'est pas une case d'un plan.
  await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt ouverte' }));
  expect(bonhomme()).toMatch(/^marche sur son île rond french-6e-phonology /);
  expect(bonhomme()).not.toMatch(/french-6e-phonology 1,1$/);
  expect(sheet()).toBeInTheDocument();
  expect(screen.getByTestId('demandes-de-cadrage')).toHaveTextContent(cadrages!);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  // Panneau replié : il le reste, et la créature ne parle pas (c'est la marche qui répond).
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt ouverte' }));
  // Il y est déjà : il ne marche pas, le rond se pose sur sa case.
  expect(bonhomme()).toMatch(/^se tient sur son île rond french-6e-phonology /);
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.queryAllByRole('status').find((el) => el.classList.contains('world-line'))).toBeUndefined();
  expect(screen.getByTestId('demandes-de-cadrage')).toHaveTextContent(cadrages!);
  // La Carte ouverte puis fermée : il reste là où on l'a envoyé, sans revenir à sa place.
  const ou = bonhomme().split(' ').pop();
  const carte = () => within(screen.getByRole('navigation', { name: 'Village' })).getByRole('button', { name: /Carte/ });
  await user.click(carte());
  await user.click(carte());
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(bonhomme().split(' ').pop()).toBe(ou);
  // Depuis le village sans île : le panneau s'ouvre, et il va à la case touchée, un rond sur le but.
  cleanup();
  renderAt('/adventure');
  await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt' }));
  expect(sheet()).toBeInTheDocument();
  expect(bonhomme()).toMatch(/^marche +rond french-6e-phonology /);
  expect(bonhomme().split(' ').pop()).toBe(ou);
});

it('le Bloc-Navire est amarré au port de l’archipel ; le toucher ouvre le panneau du port sur sa section', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  // Sur la Plaine, en chantier : ses cases à poser sont en fantôme.
  expect(screen.getByTestId('navire')).toHaveTextContent(/^maths-6e-calculation \d+$/);
  await user.click(screen.getByRole('button', { name: 'Toucher le Bloc-Navire' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-6e-calculation');
  expect(screen.getByRole('dialog', { name: /Plaine des nombres/ })).toBeInTheDocument();
  const section = document.querySelector('.ship-section');
  expect(section).not.toBeNull();
  expect(section!.className).toContain('bridge-highlight');
  expect(screen.getByText(/Le Bloc-Navire — Étape 1 \/ 3/)).toBeInTheDocument();
});

it('embarquer joue le voyage en deux temps : le départ, le changement d’archipel sous le voile, l’arrivée au port', async () => {
  const { VEHICLE_STAGES } = await import('./world/vehicle');
  const { planCells } = await import('./world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, world: { parts: { [coque.id]: planCells(coque).map((c) => c.key) }, links: ['french-6e-phonology-french-6e-letter-confusion'] } }));
  const user = userEvent.setup();
  renderAt('/adventure/maths-6e-calculation');
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  await user.click(screen.getByRole('button', { name: /Embarquer vers l’archipel de 5e/ }));
  // Le départ : la phrase du voyage, le bouton « Arriver », le panneau replié.
  expect(screen.getByTestId('voyage')).toHaveTextContent('depart 1 aller');
  expect(document.body.textContent).toContain('Tu embarques sur le Bloc-Navire. Cap sur les Collines du Large !');
  expect(screen.queryByRole('dialog', { name: /Plaine des nombres/ })).not.toBeInTheDocument();
  // Fin du départ : sous le voile, l'archipel change, puis l'arrivée se joue.
  await user.click(screen.getByRole('button', { name: 'Fin du temps' }));
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  await waitFor(() => expect(screen.getByTestId('voyage')).toHaveTextContent('arrivee 1 aller'));
  const saved = JSON.parse(localStorage.getItem('dysapps:game')!);
  expect(saved.world.links).toContain('passage-5e');
  expect(saved.world.place).toBe('maths-5e-proportionality');
  // Fin de l'arrivée : le panneau du port s'ouvre.
  await user.click(screen.getByRole('button', { name: 'Fin du temps' }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality');
  expect(screen.getByRole('dialog', { name: /Marché des proportions/ })).toBeInTheDocument();
});

it('quand l’appareil demande moins d’animations, le voyage est un écran fixe avec un bouton « Arriver »', async () => {
  const { VEHICLE_STAGES } = await import('./world/vehicle');
  const { planCells } = await import('./world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, world: { parts: { [coque.id]: planCells(coque).map((c) => c.key) }, links: ['french-6e-phonology-french-6e-letter-confusion'] } }));
  demanderMoinsDAnimations();
  const user = userEvent.setup();
  renderAt('/adventure/maths-6e-calculation');
  await user.click(screen.getByRole('button', { name: /Embarquer vers l’archipel de 5e/ }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(screen.getByRole('dialog', { name: /Le voyage/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Arriver/ }));
  expect(screen.getByTestId('archipel')).toHaveTextContent('5e');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality');
});

it('« Aller au port » d’un archipel déjà atteint : un fondu court, sans cinématique, et une ligne qui dit où l’on arrive', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['maths-6e-calculation-maths-6e-fractions', 'passage-5e'], place: 'maths-6e-fractions' } }));
  const user = userEvent.setup();
  renderAt('/adventure/world');
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  await user.click(screen.getByRole('button', { name: /Aller au port : Marché des proportions/ }));
  // Pas de voyage joué : le voile, puis l'arrivée au port d'en face, son panneau ouvert.
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(document.body.textContent).toContain('Archipel de 5e : les Collines du Large');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality'));
  expect(screen.getByRole('dialog', { name: /Marché des proportions/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.place).toBe('maths-5e-proportionality');
});

it('une île ouverte d’un autre archipel (lien, retour d’exercice) : on y arrive directement, d’un fondu', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(document.body.textContent).toContain('Archipel de 6e : les Basses Terres');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('6e'), { timeout: 5000 });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  expect(sheet()).toBeInTheDocument();
  // La sauvegarde suit l'arrivée : l'attendre, sans supposer qu'elle est déjà écrite quand l'écran change.
  await waitFor(() => expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.place).toBe('french-6e-phonology'));
});

it('quand l’appareil demande moins d’animations, un archipel déjà atteint s’ouvre tout de suite, sans écran du voyage', async () => {
  demanderMoinsDAnimations();
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.queryByRole('dialog', { name: /Le voyage/ })).not.toBeInTheDocument();
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  expect(sheet()).toBeInTheDocument();
});

it('le sélecteur d’archipel : l’archipel où l’on est, et les autres déjà atteints à un toucher', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  // Un seul archipel atteint : pas de sélecteur.
  expect(screen.queryByRole('button', { name: /changer d’archipel/ })).not.toBeInTheDocument();
  cleanup();
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'french-6e-phonology' } }));
  renderAt('/adventure');
  const button = screen.getByRole('button', { name: /Archipel de 6e, les Basses Terres : changer d’archipel/ });
  await user.click(button);
  const list = screen.getByRole('group', { name: 'Changer d’archipel' });
  expect(within(list).getByRole('button', { name: /6e Les Basses Terres Tu es ici/ })).toBeDisabled();
  expect(within(list).getByRole('button', { name: /4e Les Monts de Feu Fermé/ })).toBeDisabled();
  await user.click(within(list).getByRole('button', { name: /5e Les Collines du Large/ }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality'));
});

it('la page des quatre archipels : où l’on est, ce qui est ouvert, ce qu’il faut pour aller plus loin', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/world');
  const sheet = screen.getByRole('dialog', { name: 'Les quatre archipels' });
  expect(sheet).toBeInTheDocument();
  expect(sheet.textContent).toContain('Archipel de 6e — Les Basses Terres');
  expect(sheet.textContent).toContain('Tu es ici');
  expect(sheet.textContent).toContain('Archipel de 5e — Les Collines du Large');
  expect(sheet.textContent).toContain('Le Bloc-Navire se construit sur Plaine des nombres : 0 blocs posés sur');
  expect(sheet.textContent).toContain('Il faut d’abord le Bloc-Navire avec la voile, puis le ballon.');
  // « Voir le chantier » mène au port ; « Aller au port » aussi, pour l'archipel où l'on est.
  await user.click(screen.getAllByRole('button', { name: 'Voir le chantier' })[0]);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-6e-calculation');
  expect(screen.getByRole('dialog', { name: /Plaine des nombres/ })).toBeInTheDocument();
});

it('à la première arrivée dans un archipel, le mot de la créature de l’île-école, en deux pages, une seule fois', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const user = userEvent.setup();
  renderAt('/adventure');
  expect(screen.getByTestId('archipel')).toHaveTextContent('5e');
  const word = await screen.findByRole('dialog', { name: 'Le mot de Bazar' }, { timeout: 3000 });
  expect(word).toHaveTextContent('Bienvenue dans les Collines du Large');
  await user.click(within(word).getByRole('button', { name: 'Suivant' }));
  expect(word).toHaveTextContent('Le Bloc-Navire reste au port');
  await user.click(within(word).getByRole('button', { name: 'J’ai compris' }));
  expect(screen.queryByRole('dialog', { name: 'Le mot de Bazar' })).not.toBeInTheDocument();
  // Déjà dit : Bazar ne le répète pas.
  cleanup();
  renderAt('/adventure');
  await new Promise((r) => setTimeout(r, 1500));
  expect(screen.queryByRole('dialog', { name: 'Le mot de Bazar' })).not.toBeInTheDocument();
});

it('le mot de l’arrivée en deux pages se ferme dès la première avec « Passer »', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const user = userEvent.setup();
  renderAt('/adventure');
  const word = await screen.findByRole('dialog', { name: 'Le mot de Bazar' }, { timeout: 3000 });
  await user.click(within(word).getByRole('button', { name: 'Passer' }));
  expect(screen.queryByRole('dialog', { name: 'Le mot de Bazar' })).not.toBeInTheDocument();
});

it('les bandeaux de récompense attendent que le mot de l’arrivée soit fermé (DA-9)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const user = userEvent.setup();
  renderAt('/adventure');
  const word = await screen.findByRole('dialog', { name: 'Le mot de Bazar' }, { timeout: 3000 });
  await waitFor(() => expect(screen.getByTestId('retenus')).toHaveTextContent('oui'));
  await user.click(within(word).getByRole('button', { name: 'Suivant' }));
  await user.click(within(word).getByRole('button', { name: 'J’ai compris' }));
  expect(screen.getByTestId('retenus')).toHaveTextContent('non');
});

it('sur la Carte, le panneau de la prochaine destination attend que le mot des grandes étapes soit fermé (DA-25)', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const user = userEvent.setup();
  renderAt('/adventure/map');
  const word = await screen.findByRole('dialog', { name: 'Le mot de Mousso' }, { timeout: 3000 });
  expect(document.body.textContent).not.toMatch(/Prochaine destination/);
  while (within(word).queryByRole('button', { name: 'Suivant' })) await user.click(within(word).getByRole('button', { name: 'Suivant' }));
  await user.click(within(word).getByRole('button', { name: 'J’ai compris' }));
  expect(document.body.textContent).toMatch(/Prochaine destination/);
});

it('les nouveaux noms des archipels, une fois, avant le mot des grandes étapes : un seul panneau à la fois (GD-1)', async () => {
  // Un élève qui jouait déjà, arrivé en 5e : les nouveaux noms d'abord, le mot de Bazar ensuite.
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: { 'foret:sons': { stars: 2 } }, world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const user = userEvent.setup();
  renderAt('/adventure');
  const noms = await screen.findByRole('dialog', { name: /De nouveaux noms/ }, { timeout: 3000 });
  expect(noms).toHaveTextContent('Les Îles Brumeuses s’appellent maintenant les Collines du Large.');
  await new Promise((r) => setTimeout(r, 1500));
  expect(screen.queryByRole('dialog', { name: 'Le mot de Bazar' })).not.toBeInTheDocument();
  await user.click(within(noms).getByRole('button', { name: 'D’accord' }));
  expect(screen.queryByRole('dialog', { name: /De nouveaux noms/ })).not.toBeInTheDocument();
  expect(await screen.findByRole('dialog', { name: 'Le mot de Bazar' }, { timeout: 3000 })).toBeInTheDocument();
  // Vu une fois : il ne revient pas.
  cleanup();
  renderAt('/adventure');
  expect(screen.queryByRole('dialog', { name: /De nouveaux noms/ })).not.toBeInTheDocument();
});

it('marque pour la vue ce qu’elle pose sur la scène : le haut, la barre du bas, Pause, les bulles (DA-10)', () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  renderAt('/adventure');
  const scene = document.querySelector('[data-scene]')!;
  expect(scene.querySelector('[data-couvre="bouton"][data-tuto="menu"]')).not.toBeNull();
  expect(scene.querySelector('.world-overlay-top[data-couvre="scene"]')).not.toBeNull();
  expect(scene.querySelector('.world-overlay-bottom[data-couvre="bulle"]')).not.toBeNull();
  expect(within(scene.querySelector<HTMLElement>('[data-couvre="scene"][aria-label="Village"]')!).getByRole('button', { name: /Carte/ })).toBeInTheDocument();
});

it('les bandeaux de récompense attendent la fin du tutoriel, et de nouveau quand on revoit l’aide (DA-9)', async () => {
  const user = userEvent.setup();
  const premier = renderAt('/adventure');
  expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
  premier.unmount();
  // Tutoriel vu, mot d'arrivée de la baleine déjà dit : plus rien n'est ouvert.
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  renderAt('/adventure/french-6e-phonology');
  await waitFor(() => expect(screen.getByTestId('retenus')).toHaveTextContent('non'));
  await user.click(screen.getByRole('button', { name: 'Revoir l’aide' }));
  expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
});

it('le bouton Blocs ouvre « Mes blocs » ; une puce mène à l’île (caméra et panneau) ; la croix rend le monde, sur l’île du bonhomme', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4, 'maths-6e-calculation': 2 } }));
  const user = userEvent.setup();
  renderAt('/adventure/maths-6e-calculation');
  const blocs = screen.getByRole('button', { name: 'Mes blocs' });
  expect(blocs).toHaveTextContent('Blocs (6)');
  expect(blocs).toHaveAttribute('aria-pressed', 'false');
  await user.click(blocs);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/stock');
  expect(screen.getByRole('button', { name: 'Mes blocs' })).toHaveAttribute('aria-pressed', 'true');
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).toContain('6 blocs en poche');
  expect(sheet.textContent).toContain('4 blocs de bois');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('aucune');
  // Le bois sert au plan de la Forêt : la puce y mène, la caméra cadre la Forêt et son panneau s'ouvre.
  await user.click(screen.getByRole('link', { name: /Plan de Forêt des sons : encore 22 à gagner/ }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  expect(screen.getByRole('dialog', { name: /^Forêt des sons/ })).toBeInTheDocument();
  // Depuis l'inventaire, la croix rend le monde : on reste sur l'île du bonhomme, sans rouvrir son panneau.
  await user.click(screen.getByRole('button', { name: 'Mes blocs' }));
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.queryByRole('dialog', { name: /^(Forêt des sons|Mes blocs)/ })).not.toBeInTheDocument();
  // Le bouton de l'île, dans la barre, rouvre son panneau.
  await user.click(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' }));
  expect(screen.getByRole('dialog', { name: /^Forêt des sons/ })).toBeInTheDocument();
});

it('« À aller chercher » mène à l’île où gagner le bloc qui manque', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/stock');
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).toContain('Aucun bloc pour l’instant');
  const brique = within(sheet).getByRole('link', { name: 'Plaine des nombres' });
  await user.click(brique);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-6e-calculation');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('maths-6e-calculation');
  expect(screen.getByRole('dialog', { name: /Plaine des nombres/ })).toBeInTheDocument();
});

it('sans île ouverte, pas de panneau ni de bouton de panneau', () => {
  const { container } = renderAt('/adventure');
  expect(container.querySelector('.island-sheet')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /panneau de/ })).not.toBeInTheDocument();
});

it('l’école du village : on la touche dans le monde (ou « École » dans la barre), son panneau montre les trois portes', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  await user.click(await screen.findByRole('button', { name: 'Toucher l’école dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /École du village/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/school');
  // La caméra cadre l'île de l'école (la Forêt dans les Premiers Rivages).
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  await user.click(within(sheet).getByRole('button', { name: /Français/ }));
  expect(within(sheet).getByRole('link', { name: /Homophones/ })).toHaveAttribute('href', '/app/homophones');
  // Le bouton de la barre referme l'école.
  const bar = screen.getByRole('navigation', { name: 'Village' });
  const button = within(bar).getByRole('button', { name: 'École du village' });
  expect(button).toHaveAttribute('aria-pressed', 'true');
  await user.click(button);
  expect(screen.queryByRole('dialog', { name: /École du village/ })).not.toBeInTheDocument();
});

it('un monument : on le touche dans le monde, la caméra va sur son îlot, son panneau le construit ; le menu les liste', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  await user.click(await screen.findByRole('button', { name: 'Toucher l’observatoire dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /L’observatoire des baleines/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/landmark-6e-1');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-reading');
  // L'îlot du monument, dans le repère de son île (la case 4, 82 du monde).
  expect(screen.getByTestId('point')).toHaveTextContent('french-6e-reading 7,26');
  expect(within(sheet).getByRole('button', { name: /Poser le bloc suivant/ })).toBeDisabled();
  await user.click(within(sheet).getByRole('link', { name: 'Tous les monuments' }));
  const list = await screen.findByRole('dialog', { name: /Monuments/ });
  expect(within(list).getByRole('link', { name: /Le grand moulin/ })).toHaveAttribute('href', '/adventure/landmark-6e-2');
  await user.click(within(list).getByRole('button', { name: 'Fermer le panneau' }));
  await user.click(await screen.findByRole('button', { name: 'Menu' }));
  expect(within(await screen.findByRole('dialog', { name: 'Menu' })).getByRole('link', { name: /Monuments/ })).toHaveAttribute('href', '/adventure/landmarks');
});

it('le menu du village : le bouton Pause l’ouvre en panneau, « Reprendre » le referme', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  await user.click(await screen.findByRole('button', { name: 'Menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/menu');
  expect(within(menu).getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/adventure/school');
  expect(within(menu).getByRole('link', { name: /Missions/ })).toHaveAttribute('href', '/quetes');
  expect(within(menu).getByRole('link', { name: /Succès/ })).toHaveAttribute('href', '/adventure/trophies');
  expect(within(menu).getByRole('link', { name: /Réglages/ })).toHaveAttribute('href', '/reglages');
  // En tête, le rôle et la jauge d'XP ; sous Reprendre, Réglages et Accueil, avant le reste (plus de « Tutoriel », de
  // « Le menu en page » ni de « Revoir l’aide du village » : le « ? » de la barre du bas la rouvre).
  expect(within(menu).getByRole('progressbar', { name: /Niveau 1/ })).toBeInTheDocument();
  expect(within(menu).getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/menu');
  expect(within(menu).queryByRole('link', { name: /Tutoriel|Le menu en page/ })).not.toBeInTheDocument();
  expect(within(menu).queryByRole('button', { name: /Revoir l’aide/ })).not.toBeInTheDocument();
  const ordre = [within(menu).getByRole('button', { name: /Reprendre/ }), ...within(menu).getAllByRole('link')].map((el) => el.textContent!.trim());
  expect(ordre.slice(0, 4)).toEqual(['Reprendre', 'Réglages', 'Accueil', expect.stringMatching(/^(Continuer|À revoir|École du village)/)]);
  expect(within(menu).getByRole('link', { name: /Monuments/ })).toHaveTextContent('Bâtis avec tes blocs');
  await user.click(within(menu).getByRole('button', { name: /Reprendre/ }));
  expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
});

it('la salle des trophées : on la touche dans le monde, son panneau montre les succès', async () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 1, badges: { 'premier-pas': '2026-09-27T10:00:00Z' } }));
  const user = userEvent.setup();
  renderAt('/adventure');
  await user.click(await screen.findByRole('button', { name: 'Toucher la salle des trophées dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /Salle des trophées/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/trophies');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  expect(within(sheet).getByText(`1 / ${BADGES.length} trophées`)).toBeInTheDocument();
  expect(within(sheet).getByRole('heading', { name: `Succès 1 / ${BADGES.length}` })).toBeInTheDocument();
  await user.click(within(sheet).getByRole('button', { name: 'Fermer le panneau' }));
  expect(screen.queryByRole('dialog', { name: /Salle des trophées/ })).not.toBeInTheDocument();
});

it('le 13e succès : une travée s’ajoute à la salle d’un coup, sans panneau ni caméra imposée, quand l’appareil demande moins d’animations (GD-3)', async () => {
  demanderMoinsDAnimations();
  // Douze succès gagnés, pas encore « Échauffement » (le premier de la liste, gagné à la première réponse).
  expect(BADGES[0].id).toBe('premier-pas');
  const douze = Object.fromEntries(BADGES.slice(1, 13).map((b) => [b.id, '2026-09-27T10:00:00Z']));
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 0, badges: douze }));
  const user = userEvent.setup();
  renderAt('/adventure');
  expect(await screen.findByTestId('salle')).toHaveTextContent('4 colonnes');
  const cadrages = screen.getByTestId('demandes-de-cadrage').textContent;
  await user.click(screen.getByRole('button', { name: 'Répondre juste' }));
  // La travée est là tout de suite, entière : deux colonnes de plus ; la vue ne bouge pas, aucun panneau ne s'ouvre.
  expect(screen.getByTestId('salle')).toHaveTextContent('6 colonnes');
  expect(screen.getByTestId('demandes-de-cadrage').textContent).toBe(cadrages);
  expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
  expect(screen.queryByRole('dialog', { name: /Salle des trophées/ })).not.toBeInTheDocument();
});

it('le bouton retour, dans le village, ouvre le menu du village au lieu de quitter', async () => {
  renderAt('/adventure');
  await screen.findByRole('button', { name: 'Menu' });
  window.history.back();
  expect(await screen.findByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/menu');
});

it('« Recentrer » apparaît quand la vue a glissé, la ramène d’un appui, et disparaît quand elle y est revenue', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  expect(screen.queryByRole('button', { name: 'Recentrer' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Faire glisser le monde' }));
  const recentrer = screen.getByRole('button', { name: 'Recentrer' });
  expect(screen.getByTestId('recentrage')).toHaveTextContent('0');
  await user.click(recentrer);
  expect(screen.getByTestId('recentrage')).toHaveTextContent('1');
  // Le bouton va disparaître : le focus est déjà rendu au monde, il ne tombe pas sur la page.
  expect(document.activeElement).toHaveClass('voxel-canvas');
  // La vue dit qu'elle est revenue à son cadrage : le bouton s'en va.
  await user.click(screen.getByRole('button', { name: 'La vue revient à son cadrage' }));
  expect(screen.queryByRole('button', { name: 'Recentrer' })).not.toBeInTheDocument();
});

it('le panneau replié reste replié après la Carte ; « Y aller » le rouvre', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  const carte = () => within(screen.getByRole('navigation', { name: 'Village' })).getByRole('button', { name: /Carte/ });
  await user.click(carte());
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/map');
  // Fermer la Carte : retour sur l'île où l'on est, son panneau toujours replié.
  await user.click(carte());
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' })).toBeInTheDocument();
  // « Y aller », sur la Carte, ouvre le panneau de la destination.
  await user.click(carte());
  await user.click(screen.getByRole('button', { name: /Y aller/ }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(sheet()).toBeInTheDocument();
});

it('le panneau replié reste replié au retour d’un exercice (le monde se remonte) ; une autre île ouvre le sien', async () => {
  const user = userEvent.setup();
  const premier = renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  premier.unmount();
  // Le retour d'un exercice de la Forêt : le monde revient, le panneau reste replié.
  const second = renderAt('/adventure/french-6e-phonology');
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' })).toBeInTheDocument();
  second.unmount();
  // Vers une autre île, son panneau s'ouvre, et le repli de la Forêt est oublié.
  const troisieme = renderAt('/adventure/maths-6e-calculation');
  expect(screen.getByRole('dialog', { name: /^Plaine des nombres/ })).toBeInTheDocument();
  troisieme.unmount();
  renderAt('/adventure/french-6e-phonology');
  expect(sheet()).toBeInTheDocument();
});

it('le tutoriel du village tient en trois bulles : l’île, les bornes, le bouton Menu', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  const tuto = () => screen.getByRole('dialog', { name: /Bienvenue|bornes|bouton Menu/ });
  expect(tuto()).toHaveTextContent('1/3');
  expect(tuto()).toHaveTextContent(/Bienvenue à Blocland !.*Touche la Forêt des sons, sous la flèche jaune\./);
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  expect(tuto()).toHaveTextContent(/touche une borne pour jouer.*Chaque mission te donne des blocs pour construire l’île\./);
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  expect(tuto()).toHaveTextContent('Le bouton Menu (⏸), en haut à droite, ouvre le menu : missions, succès, réglages, accueil.');
  // La bulle montre le bouton Menu.
  expect(document.querySelector('[data-tuto="menu"]')!.classList.contains('tuto-target')).toBe(true);
  await user.click(screen.getByRole('button', { name: /J’ai compris/ }));
  expect(screen.queryByRole('dialog', { name: /bouton Menu/ })).not.toBeInTheDocument();
});

it('au premier toucher d’une île pâle, sa créature dit ce que sont les ouvrages, une seule fois par appareil', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  const ligne = () => screen.queryAllByRole('status').find((el) => el.classList.contains('world-line') && el.textContent?.includes('Les îles pâles sont fermées'));
  const premier = renderAt('/adventure/french-6e-letter-confusion');
  expect(ligne()).toBeDefined();
  expect(ligne()!.textContent).toContain(textesDe('blocland').libelles.decouverteOuvrages);
  premier.unmount();
  renderAt('/adventure/maths-6e-fractions');
  expect(ligne()).toBeUndefined();
});

it('à la première arrivée au port, sa créature parle du Bloc-Navire, une seule fois par appareil', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  const ligne = () => screen.queryAllByRole('status').find((el) => el.classList.contains('world-line') && el.textContent?.includes('le Bloc-Navire attend ses blocs'));
  const premier = renderAt('/adventure/maths-6e-calculation');
  expect(ligne()).toBeDefined();
  premier.unmount();
  renderAt('/adventure/maths-6e-calculation');
  expect(ligne()).toBeUndefined();
});

it('le soleil et la lune ne sont plus dans la barre : le jour est forcé tant que le tutoriel n’est pas vu, puis le réglage décide', () => {
  const premier = renderAt('/adventure');
  expect(screen.getByTestId('lumiere')).toHaveTextContent('jour');
  expect(screen.queryByRole('button', { name: /Forcer le jour|heure réelle/ })).not.toBeInTheDocument();
  premier.unmount();
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  const second = renderAt('/adventure');
  expect(screen.getByTestId('lumiere')).toHaveTextContent('heure réelle');
  second.unmount();
  localStorage.setItem('dysapps:settings', JSON.stringify({ worldLight: 'day' }));
  renderAt('/adventure');
  expect(screen.getByTestId('lumiere')).toHaveTextContent('jour');
});
