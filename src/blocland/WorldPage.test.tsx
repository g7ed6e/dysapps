import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider, useProgress } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { WorldPage } from './WorldPage';
import { BADGES } from '../core/progress';
import { demanderMoinsDAnimations } from '../core/mouvement.testing';
import { textesDe } from '../univers';
import { VOL, dureeDuVol } from './volDesBlocs';

// Pas de WebGL dans les tests : un monde factice, qui montre l'île cadrée et laisse toucher une île. Il connaît la
// première case de la cabane de Mousso, dans le repère de l'île (un fantôme du bâtiment, posable à la main avant GD-6).
const caseDeLaCabane = vi.hoisted(() => ({ x: 0, y: 0, z: 0 }));
// Ce que le monde factice a reçu au dernier rendu : les cubes, la pose en vague (GD-6) et son rappel.
const vu = vi.hoisted(() => ({
  cubes: [] as { x: number; y: number; z: number; ghost?: boolean }[],
  pose: null as { seq: number; cubes: { x: number; y: number; z: number }[] } | null,
  onPose: undefined as ((moment: 'couche' | 'finie') => void) | undefined,
  fiche: null as { objet: { genre: string }; seq: number; saut: boolean } | null,
}));
// Le carillon de la fin de pose (GD-6) : compté, sans son.
const carillon = vi.hoisted(() => vi.fn());
vi.mock('./sound', async (original) => ({ ...(await original<typeof import('./sound')>()), playDone: carillon }));
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
    pose = null,
    onPose,
    fiche = null,
  }: {
    focus: { island: string | null; seq: number; spot?: { ile: string; local: { x: number; y: number } } };
    cubes: { x: number; y: number; z: number; ghost?: boolean; place?: string }[];
    onIntent: (i: { genre: string; [k: string]: unknown }) => void;
    vehicle: { port: string; cubes: { ghost?: boolean }[] } | null;
    archipelago: string;
    voyage: { leg: string; stage: number; back: boolean } | null;
    onVueDeplacee?: (deplacee: boolean) => void;
    recentrage?: number;
    forceDay: boolean;
    avatar?: { route: { ile: string; local: { x: number; y: number } }[]; seq: number; flanerie?: boolean; vise?: boolean };
    pose?: { seq: number; cubes: { x: number; y: number; z: number }[] } | null;
    onPose?: (moment: 'couche' | 'finie') => void;
    fiche?: { objet: { genre: string }; seq: number; saut: boolean } | null;
  }) => (
    <div className="voxel-canvas" tabIndex={0} ref={() => void Object.assign(vu, { cubes, pose, onPose, fiche })}>
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
      <button type="button" onClick={() => onIntent({ genre: 'arrivee' })}>
        Toucher le vide pendant la marche
      </button>
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
      <button
        type="button"
        onClick={() => onIntent({ genre: 'face', ile: 'french-6e-phonology', case: { ...caseDeLaCabane }, voisine: { ...caseDeLaCabane, z: caseDeLaCabane.z + 1 } })}
      >
        Toucher une case du bâtiment de la Forêt
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
      <button type="button" onClick={() => onIntent({ genre: 'borne', ile: 'french-6e-phonology', mission: 'syllables' })}>
        Toucher une borne de la Forêt
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'borne', ile: 'french-6e-letter-confusion', mission: 'letter-pairs' })}>
        Toucher une borne de la Mine
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'creature', id: 'french-6e-phonology', gardien: true })}>
        Toucher le Gardien de la Forêt
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'creature', id: 'french-6e-letter-confusion' })}>
        Toucher la créature de la Mine
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'ile', id: 'french-6e-letter-confusion', sol: { ile: 'french-6e-letter-confusion', local: { x: 6, y: 6, z: 0 } } })}>
        Toucher la Mine pâle
      </button>
      <button type="button" onClick={() => onIntent({ genre: 'ouvrage', id: 'french-6e-phonology-french-6e-letter-confusion' })}>
        Toucher le sentier vers la Mine
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
/** Le panneau d'une île ne s'ouvre que par son bouton, dans la barre du bas. */
const ouvrirLePanneau = (user: ReturnType<typeof userEvent.setup>, ile = 'Forêt des sons') =>
  user.click(screen.getByRole('button', { name: `Ouvrir le panneau de ${ile}` }));

it('le panneau d’une île ne s’ouvre que par son bouton, en plein écran par-dessus le monde ; la croix le referme', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  // Arriver sur l'île n'ouvre rien : le monde reste en plein écran, et se touche.
  expect(sheet()).not.toBeInTheDocument();
  expect(document.querySelector('.world-stage')).not.toHaveAttribute('inert');
  const toggle = screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await user.click(toggle);
  expect(sheet()).toBeInTheDocument();
  // Par-dessus le monde, qui ne se touche plus dessous (ni au clavier) : le focus passe sur sa croix.
  expect(document.querySelector('.world-stage')).toHaveAttribute('inert');
  expect(sheet()).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByRole('button', { name: 'Fermer le panneau' })).toHaveFocus();
  // La croix le referme : on reste sur l'île, la caméra aussi ; le focus revient au bouton de l'île.
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(document.querySelector('.world-stage')).not.toHaveAttribute('inert');
  expect(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' })).toHaveFocus();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
});

const vuSansAide = () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
};

it('la créature touchée parle dans sa fiche, qu’on peut fermer ; la bulle du haut n’est plus pour elle', async () => {
  vuSansAide();
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Toucher la créature de la Forêt' }));
  const f = screen.getByRole('dialog', { name: 'Mousso' });
  expect(f).toHaveAttribute('aria-modal', 'false');
  expect(f.querySelector('.world-fiche-phrase')?.textContent).not.toBe('');
  expect(screen.queryAllByRole('status').find((el) => el.classList.contains('world-line'))).toBeUndefined();
  // Le panneau de l'île se replie : une chose à la fois en bas.
  expect(sheet()).not.toBeInTheDocument();
  await user.click(within(f).getByRole('button', { name: 'Fermer la fiche' }));
  expect(screen.queryByRole('dialog', { name: 'Mousso' })).not.toBeInTheDocument();
  // Le focus revient au monde.
  expect(document.activeElement).toHaveClass('voxel-canvas');
});

it('toucher l’île où l’on est : la fiche de sa créature ; une autre île : on y va, sans ouvrir son panneau', async () => {
  vuSansAide();
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  // Toucher l'île (au clavier, sans case du sol) : la fiche de sa créature répond.
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: 'Mousso' })).toBeInTheDocument();
  // Depuis le village sans île, toucher la Forêt y mène ; son panneau reste fermé.
  cleanup();
  renderAt('/adventure');
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(sheet()).not.toBeInTheDocument();
});

it('toucher le sol de l’île où l’on est : le bonhomme y marche, un rond sur le but ; ni le panneau ni la caméra ne bougent', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  const bonhomme = () => screen.getByTestId('bonhomme').textContent ?? '';
  expect(bonhomme()).toMatch(/^se tient .*sans rond french-6e-phonology 1,1$/);
  const cadrages = screen.getByTestId('demandes-de-cadrage').textContent;
  // L'île ouverte est en chantier : le sol touché est une face, qui n'est pas une case d'un plan.
  await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt ouverte' }));
  expect(bonhomme()).toMatch(/^marche sur son île rond french-6e-phonology /);
  expect(bonhomme()).not.toMatch(/french-6e-phonology 1,1$/);
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('demandes-de-cadrage')).toHaveTextContent(cadrages!);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  // Encore : la créature ne parle pas (c'est la marche qui répond).
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
  // Depuis le village sans île : il va à la case touchée, un rond sur le but ; aucun panneau ne s'ouvre.
  cleanup();
  renderAt('/adventure');
  await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(bonhomme()).toMatch(/^marche +rond french-6e-phonology /);
  expect(bonhomme().split(' ').pop()).toBe(ou);
});

it('toucher un fantôme du bâtiment de l’île ne pose rien : le bâtiment se pose tout seul, une partie par mission (GD-6)', async () => {
  const { decalageDesPlans, planCells, plansFor } = await import('./world/plans');
  const [cabane] = plansFor('french-6e-phonology');
  const [c] = planCells(cabane);
  const d = decalageDesPlans(cabane);
  Object.assign(caseDeLaCabane, { x: c.x + d.x, y: c.y + d.y, z: c.z + d.z });
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 40 } }));
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  await user.click(screen.getByRole('button', { name: 'Toucher une case du bâtiment de la Forêt' }));
  const saved = JSON.parse(localStorage.getItem('dysapps:game') ?? '{}');
  expect(saved.stock?.['french-6e-phonology'] ?? 40).toBe(40);
  expect(saved.world?.parts?.[cabane.id] ?? []).toEqual([]);
  // Le panneau ne propose pas non plus de poser à la main.
  await ouvrirLePanneau(user);
  expect(within(sheet()!).queryByRole('button', { name: /Poser le bloc suivant|Poser tout ce que j’ai/ })).not.toBeInTheDocument();
});

it('le Bloc-Navire est amarré au port de l’archipel ; le toucher ouvre sa fiche : l’étape, ce qui manque et où le gagner', async () => {
  vuSansAide();
  const user = userEvent.setup();
  renderAt('/adventure');
  // Sur la Plaine, en chantier : ses cases à poser sont en fantôme.
  expect(screen.getByTestId('navire')).toHaveTextContent(/^maths-6e-calculation \d+$/);
  await user.click(screen.getByRole('button', { name: 'Toucher le Bloc-Navire' }));
  // Pas de panneau : la fiche, sans quitter le monde.
  expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
  expect(screen.queryByRole('dialog', { name: /Plaine des nombres/ })).not.toBeInTheDocument();
  const f = screen.getByRole('dialog', { name: /Le Bloc-Navire\s:\sétape 1 sur 3/ });
  expect(f.textContent).toMatch(/0 blocs posés sur 45\. Il manque 18 blocs de sable, à gagner dans Carrière des mots\./);
  expect(within(f).getByRole('link', { name: 'Carrière des mots' })).toHaveAttribute('href', expect.stringMatching(/^\/adventure\//));
  // Rien à poser : pas de bouton grisé.
  expect(within(f).queryByRole('button', { name: /Poser/ })).not.toBeInTheDocument();
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
  await ouvrirLePanneau(user, 'Plaine des nombres');
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
  // Fin de l'arrivée : on est au port, le monde en plein écran (aucun panneau ne s'ouvre tout seul).
  await user.click(screen.getByRole('button', { name: 'Fin du temps' }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality');
  expect(screen.queryByRole('dialog', { name: /Marché des proportions/ })).not.toBeInTheDocument();
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
  await ouvrirLePanneau(user, 'Plaine des nombres');
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
  // Pas de voyage joué : le voile, puis l'arrivée au port d'en face, le monde en plein écran.
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(document.body.textContent).toContain('Archipel de 5e : les Collines du Large');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality'));
  expect(screen.queryByRole('dialog', { name: /Marché des proportions/ })).not.toBeInTheDocument();
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
  expect(sheet()).not.toBeInTheDocument();
  // La sauvegarde suit l'arrivée : l'attendre, sans supposer qu'elle est déjà écrite quand l'écran change.
  await waitFor(() => expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.place).toBe('french-6e-phonology'));
});

it('quand l’appareil demande moins d’animations, un archipel déjà atteint s’ouvre tout de suite, sans écran du voyage', async () => {
  demanderMoinsDAnimations();
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.queryByRole('dialog', { name: /Le voyage/ })).not.toBeInTheDocument();
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
});

it('la rangée de classes : une par archipel atteint, la sienne marquée ; un toucher change de classe, sans fenêtre', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  // Une seule classe atteinte : pas de rangée.
  expect(screen.queryByRole('list', { name: 'Changer de classe' })).not.toBeInTheDocument();
  cleanup();
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { links: ['passage-5e'], place: 'french-6e-phonology' } }));
  renderAt('/adventure');
  const rangee = screen.getByRole('list', { name: 'Changer de classe' });
  // 6e et 5e, pas les classes fermées ; la classe où l'on est n'est pas un bouton, marquée par sa forme (coche) et en mots.
  expect(within(rangee).getAllByRole('listitem').map((li) => li.textContent?.replace(/,.*/, '').trim())).toEqual(['6e', '5e']);
  const ici = rangee.querySelector('[aria-current="true"]')!;
  expect(ici).toHaveTextContent('6e, les Basses Terres : tu es ici');
  expect(ici.querySelector('svg')).not.toBeNull();
  expect(within(rangee).getAllByRole('button')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: /Les quatre archipels/ })).not.toBeInTheDocument();
  // Un toucher : le fondu court, sans voyage ni liste.
  await user.click(within(rangee).getByRole('button', { name: 'Aller en 5e, les Collines du Large' }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/maths-5e-proportionality'));
  expect(screen.getByRole('list', { name: 'Changer de classe' }).querySelector('[aria-current="true"]')).toHaveTextContent(/^5e/);
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
  expect(screen.getByTestId('cadrage')).toHaveTextContent('maths-6e-calculation');
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

it('la Carte s’ouvre sans encart : ni la prochaine destination, ni « Y aller », ni la liste des îles', async () => {
  vuSansAide();
  renderAt('/adventure/map');
  expect(document.body.textContent).not.toMatch(/Prochaine destination/);
  expect(screen.queryByRole('button', { name: /Y aller/ })).not.toBeInTheDocument();
  expect(screen.queryByText('Les îles et leur état')).not.toBeInTheDocument();
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

it('le bouton Blocs ouvre « Mes blocs » ; une puce mène à l’île (caméra et fiche) ; la croix rend le monde, sur l’île du bonhomme', async () => {
  vuSansAide();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4, 'maths-6e-calculation': 2 } }));
  const user = userEvent.setup();
  renderAt('/adventure/maths-6e-calculation');
  // Le nombre est lu avec le nom (« Mes blocs, 6 »), et écrit dans la pastille.
  const blocs = screen.getByRole('button', { name: 'Mes blocs, 6' });
  expect(blocs.querySelector('.world-bar-count')).toHaveTextContent(/^6$/);
  expect(blocs).toHaveAttribute('aria-pressed', 'false');
  await user.click(blocs);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/stock');
  expect(screen.getByRole('button', { name: 'Mes blocs, 6' })).toHaveAttribute('aria-pressed', 'true');
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).toContain('6 blocs en poche');
  expect(sheet.textContent).toContain('4 blocs de bois');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('aucune');
  // Le bois paie le sentier qui part de la Forêt (après les quatre liaisons de la Plaine, GD-7 : « Tout voir ») : la puce
  // y mène, la caméra cadre la Forêt et la fiche du sentier s'ouvre (le panneau de l'île, non).
  await user.click(screen.getByRole('button', { name: /Tout voir/ }));
  await user.click(screen.getAllByRole('link', { name: /Sentier vers Mine des lettres/ })[0]);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  expect(screen.queryByRole('dialog', { name: /^Forêt des sons/ })).not.toBeInTheDocument();
  expect(document.querySelector('.world-fiche')).toHaveTextContent(/Sentier/);
  // Depuis l'inventaire, la croix rend le monde : on reste sur l'île du bonhomme, sans rouvrir son panneau.
  await user.click(screen.getByRole('button', { name: 'Mes blocs, 6' }));
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
  // Le bois de la coque du Bloc-Navire se gagne sur la Forêt.
  await user.click(within(sheet).getByRole('link', { name: 'Forêt des sons' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  // Le monde en plein écran : l'île et ses bornes, sans panneau.
  expect(screen.queryByRole('dialog', { name: /^Forêt des sons/ })).not.toBeInTheDocument();
});

it('sans île ouverte, pas de panneau ni de bouton de panneau', () => {
  const { container } = renderAt('/adventure');
  expect(container.querySelector('.island-sheet')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /panneau de/ })).not.toBeInTheDocument();
});

it('l’école du village : on la touche dans le monde (plus de bouton École dans la barre), son panneau montre les trois portes', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  // La barre du bas : Carte, Blocs et l'aide (l'île quand une île est ouverte), plus d'École.
  const bar = screen.getByRole('navigation', { name: 'Village' });
  expect(within(bar).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())).toEqual(['Carte', 'Mes blocs, 0', 'Revoir l’aide']);
  expect(within(bar).queryByRole('button', { name: /École/ })).not.toBeInTheDocument();
  await user.click(await screen.findByRole('button', { name: 'Toucher l’école dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /École du village/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/school');
  // La caméra cadre l'île de l'école (la Forêt dans les Premiers Rivages).
  expect(screen.getByTestId('cadrage')).toHaveTextContent('french-6e-phonology');
  await user.click(within(sheet).getByRole('button', { name: /Français/ }));
  expect(within(sheet).getByRole('link', { name: /Homophones/ })).toHaveAttribute('href', '/app/homophones');
  await user.click(within(sheet).getByRole('button', { name: 'Fermer le panneau' }));
  expect(screen.queryByRole('dialog', { name: /École du village/ })).not.toBeInTheDocument();
  // Sur une île ouverte, la barre a le bouton de l'île en tête, puis Carte, Blocs et l'aide.
  cleanup();
  renderAt('/adventure/french-6e-phonology');
  const barre = screen.getByRole('navigation', { name: 'Village' });
  expect(within(barre).getAllByRole('button')).toHaveLength(4);
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
  // En tête, le rôle et la jauge d'XP ; sous Reprendre, Réglages, avant le reste. Plus d'Accueil (la page Accueil n'existe
  // plus en 3D, 4 octobre 2026) : le Tutoriel, qu'elle portait, ferme la liste. Ni « Revoir l’aide du village » : le « ? »
  // de la barre du bas la rouvre.
  expect(within(menu).getByRole('progressbar', { name: /Niveau 1/ })).toBeInTheDocument();
  expect(within(menu).queryByRole('link', { name: /Accueil|Le menu en page/ })).not.toBeInTheDocument();
  expect(within(menu).getByRole('link', { name: /Tutoriel/ })).toHaveAttribute('href', '/app/demo');
  expect(within(menu).queryByRole('button', { name: /Revoir l’aide/ })).not.toBeInTheDocument();
  const ordre = [within(menu).getByRole('button', { name: /Reprendre/ }), ...within(menu).getAllByRole('link')].map((el) => el.textContent!.trim());
  expect(ordre.slice(0, 3)).toEqual(['Reprendre', 'Réglages', expect.stringMatching(/^(Continuer|À revoir|École du village)/)]);
  expect(ordre.at(-1)).toMatch(/^Tutoriel/);
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

it('la Carte fermée rend le monde sur l’île où l’on est, sans panneau', async () => {
  localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true }));
  localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
  const user = userEvent.setup();
  renderAt('/adventure/french-6e-phonology');
  const carte = () => within(screen.getByRole('navigation', { name: 'Village' })).getByRole('button', { name: /Carte/ });
  await user.click(carte());
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/map');
  // Fermer la Carte : retour sur l'île où l'on est, le monde en plein écran.
  await user.click(carte());
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology');
  expect(sheet()).not.toBeInTheDocument();
});

it('au retour d’un exercice (le monde se remonte), aucun panneau ne s’ouvre tout seul', () => {
  renderAt('/adventure/french-6e-phonology');
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' })).toBeInTheDocument();
});

it('le tutoriel du village tient en trois bulles : l’île, les bornes, le bouton Menu', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  const tuto = () => screen.getByRole('dialog', { name: /Bienvenue|bornes|bouton Menu/ });
  expect(tuto()).toHaveTextContent('1/3');
  expect(tuto()).toHaveTextContent(/Bienvenue à Blocland !.*Touche la Forêt des sons, sous la flèche jaune\./);
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  expect(tuto()).toHaveTextContent(/touche une borne, puis Jouer\..*Chaque mission te donne des blocs pour construire l’île\./);
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

describe('la pose d’une partie en vague, après « Voir le bâtiment » (GD-6, Blocland)', () => {
  /** Une mission de la Forêt terminée : la cabane de Mousso, sa première partie, est posée et enregistrée. */
  const preparer = async () => {
    const { partiesDe } = await import('./world/parties');
    const { casesDesPlansDansLeMonde } = await import('./world/terrain');
    const { retenirLaPose, oublierLesPoses } = await import('./poseAMontrer');
    oublierLesPoses();
    const [cabane] = partiesDe('french-6e-phonology');
    const parts = Object.fromEntries(cabane.cases.map((c) => [c.plan.id, c.keys]));
    localStorage.setItem('dysapps:game', JSON.stringify({ world: { parts, log: [], links: [], place: 'french-6e-phonology' } }));
    retenirLaPose('french-6e-phonology', [cabane]);
    const cases = casesDesPlansDansLeMonde(cabane.cases);
    const dansLaPartie = () => vu.cubes.filter((c) => !c.ghost && cases.has(`${c.x},${c.y},${c.z}`)).length;
    return { cases, dansLaPartie };
  };
  // La phrase s'écrit en haut, syllabe par syllabe (des espaces insécables devant les deux-points).
  const phrase = () =>
    screen.queryAllByRole('status').find((el) => el.textContent?.replace(/[\u00a0\u202f]/g, ' ').includes('Partie posée : la cabane de Mousso.')) ?? null;

  it('cache la partie jusqu’à la vague, la donne à poser, puis dit la phrase après le dernier cube', async () => {
    const { cases, dansLaPartie } = await preparer();
    // Ni tutoriel ni mot de la baleine : seuls la pose et le temps de lire la phrase retiennent les bandeaux.
    localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true, 'archipel-6e': true }));
    localStorage.setItem('dysapps:guide-messages', JSON.stringify({ 'baleine-6e-arrivee': true }));
    renderAt('/adventure/french-6e-phonology?worksite=part');
    // Pendant la pose : le monde n'a pas les cases de la partie, la vague les a toutes ; pas encore de phrase.
    await waitFor(() => expect(vu.pose?.cubes).toHaveLength(cases.size));
    expect(dansLaPartie()).toBe(0);
    expect(phrase()).not.toBeInTheDocument();
    // Les bandeaux de récompense attendent la fin de la pose (DA-9).
    expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
    // Une couche posée : rien de plus à lire.
    act(() => vu.onPose?.('couche'));
    expect(phrase()).not.toBeInTheDocument();
    // Le dernier cube posé : la partie est dans le monde, la vague s'arrête, la phrase s'écrit en haut, par-dessus le
    // monde (aucun panneau ne s'ouvre tout seul).
    act(() => vu.onPose?.('finie'));
    expect(vu.pose).toBeNull();
    expect(dansLaPartie()).toBe(cases.size);
    expect(phrase()).toBeInTheDocument();
    expect(sheet()).not.toBeInTheDocument();
    // Le temps de lire la phrase, les bandeaux attendent encore : un message à la fois (DA-9).
    expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
    await waitFor(() => expect(screen.getByTestId('retenus')).toHaveTextContent('non'), { timeout: 6000 });
  }, 10000);

  it('pendant la pose, le compte du bâtiment reste à l’ancien ; la région de la phrase est là, vide', async () => {
    await preparer();
    renderAt('/adventure/french-6e-phonology?worksite=part');
    await waitFor(() => expect(vu.pose).not.toBeNull());
    // Le panneau ouvert par son bouton pendant la pose (un clic, sans toucher la scène).
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' }));
    const panneau = sheet()!;
    // La région annoncée est montée avant la phrase, vide : la phrase y entre ensuite.
    const region = panneau.querySelector('.plan-posee-region')!;
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toBeEmptyDOMElement();
    expect(within(panneau).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(within(panneau).getByText(/Prochaine partie/)).toHaveTextContent('la cabane de Mousso');
    act(() => vu.onPose?.('finie'));
    expect(within(panneau).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(panneau.querySelector('.plan-posee-region')).toBe(region);
    expect(within(region as HTMLElement).getByText('Partie posée : la cabane de Mousso.')).toBeInTheDocument();
  });

  it('Pause pendant la pose ouvre le menu et pose la partie en silence ; au retour, la phrase est là, rien ne se rejoue', async () => {
    const { cases, dansLaPartie } = await preparer();
    carillon.mockClear();
    renderAt('/adventure/french-6e-phonology?worksite=part');
    await waitFor(() => expect(vu.pose).not.toBeNull());
    const pause = screen.getByRole('button', { name: 'Menu' });
    fireEvent.pointerDown(pause);
    fireEvent.click(pause);
    expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/menu');
    expect(vu.pose).toBeNull();
    expect(dansLaPartie()).toBe(cases.size);
    // Retour sur l'île : la phrase est là, sans carillon, et la vague ne reprend pas.
    fireEvent.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
    await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology'));
    await waitFor(() => expect(phrase()).toBeInTheDocument());
    expect(vu.pose).toBeNull();
    await new Promise((r) => setTimeout(r, 50));
    expect(carillon).not.toHaveBeenCalled();
  });

  it('un toucher sur le monde pendant la pose pose tout d’un coup, avec le carillon', async () => {
    const { cases, dansLaPartie } = await preparer();
    renderAt('/adventure/french-6e-phonology?worksite=part');
    await waitFor(() => expect(vu.pose).not.toBeNull());
    carillon.mockClear();
    fireEvent.pointerDown(document.querySelector('.voxel-canvas')!);
    expect(vu.pose).toBeNull();
    expect(dansLaPartie()).toBe(cases.size);
    expect(phrase()).toBeInTheDocument();
    expect(carillon).toHaveBeenCalledTimes(1);
  });

  it('quitter pendant la pose ne perd rien : au retour, la partie est posée, sans rejouer la pose', async () => {
    const { cases, dansLaPartie } = await preparer();
    const { unmount } = renderAt('/adventure/french-6e-phonology?worksite=part');
    await waitFor(() => expect(vu.pose).not.toBeNull());
    unmount();
    renderAt('/adventure/french-6e-phonology?worksite=part');
    await screen.findByTestId('cadrage');
    expect(vu.pose).toBeNull();
    expect(dansLaPartie()).toBe(cases.size);
    expect(phrase()).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.parts['french-6e-phonology-1']).toHaveLength(cases.size);
  });

  it('quand l’appareil demande moins d’animations, la partie est posée d’un coup et la phrase est là', async () => {
    demanderMoinsDAnimations();
    const { cases, dansLaPartie } = await preparer();
    renderAt('/adventure/french-6e-phonology?worksite=part');
    await waitFor(() => expect(phrase()).toBeInTheDocument());
    expect(vu.pose).toBeNull();
    expect(dansLaPartie()).toBe(cases.size);
  });
});

describe('les fiches du monde (lot 2 de « Toucher le monde »)', () => {
  const ficheOuverte = () => document.querySelector<HTMLElement>('.world-fiche');

  it('toucher une borne ouvre sa fiche, pas la mission ; « Jouer » lance la mission', async () => {
    vuSansAide();
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
    const f = screen.getByRole('dialog', { name: 'Abattage syllabique' });
    expect(f).toHaveAttribute('aria-modal', 'false');
    // Le focus va au titre ; la fiche est comptée sur la scène (la vue s'en écarte).
    expect(document.activeElement).toBe(within(f).getByRole('heading', { name: 'Abattage syllabique' }));
    expect(f.closest('[data-couvre="scene"]')).not.toBeNull();
    // Touchée sur l'objet : la vue a déjà fait sauter son signe.
    expect(vu.fiche).toMatchObject({ objet: { genre: 'borne', id: 'french-6e-phonology:syllables' }, saut: false });
    await user.click(within(f).getByRole('link', { name: 'Jouer' }));
    expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology/syllables');
  });

  it('une borne fermée dit pourquoi en une phrase, sans bouton grisé', async () => {
    vuSansAide();
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Mine' }));
    const f = ficheOuverte()!;
    expect(f).toHaveTextContent('Il faut d’abord un chemin jusqu’à cette île.');
    expect(within(f).queryByRole('link')).not.toBeInTheDocument();
    // (Écouter n'existe pas sans synthèse vocale, comme ici.)
    expect(within(f).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Fermer la fiche']);
  });

  it('le Gardien : ce qui manque en une phrase, sans « Défier » tant qu’il n’est pas prêt ; « Défier » quand il l’est', async () => {
    vuSansAide();
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher le Gardien de la Forêt' }));
    const f = screen.getByRole('dialog', { name: 'Le Grand Chêne' });
    expect(f).toHaveTextContent('Pas tout de suite ! le Grand Chêne veut 2 étoiles dans Abattage syllabique, Chasse au son, Rimes-échelle.');
    expect(within(f).queryByRole('link', { name: /Défier/ })).not.toBeInTheDocument();
    cleanup();
    const { getBiome, missionsJouables } = await import('./biomes');
    const { exercisesOf } = await import('./exercises');
    const progress = Object.fromEntries(missionsJouables(getBiome('french-6e-phonology')!).map((m) => [exercisesOf('french-6e-phonology', m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }]));
    localStorage.setItem('dysapps:game', JSON.stringify({ progress }));
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher le Gardien de la Forêt' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Le Grand Chêne' })).getByRole('link', { name: 'Défier' }));
    expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/french-6e-phonology/challenge');
  });

  it('une seule fiche à la fois ; toucher le sol la ferme et le bonhomme marche ; Échap la ferme', async () => {
    vuSansAide();
    const user = userEvent.setup();
    renderAt('/adventure/french-6e-phonology');
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    await user.click(screen.getByRole('button', { name: 'Toucher le Gardien de la Forêt' }));
    expect(document.querySelectorAll('.world-fiche')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Le Grand Chêne' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toucher le sol de la Forêt ouverte' }));
    expect(ficheOuverte()).toBeNull();
    expect(screen.getByTestId('bonhomme').textContent).toMatch(/^marche sur son île rond/);
    await user.click(screen.getByRole('button', { name: 'Toucher la créature de la Forêt' }));
    expect(ficheOuverte()).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(ficheOuverte()).toBeNull();
    expect(document.activeElement).toHaveClass('voxel-canvas');
  });

  it('la Carte, le menu, Blocs ou le panneau de l’île ferment la fiche ; aucune fiche sur la Carte', async () => {
    vuSansAide();
    const user = userEvent.setup();
    renderAt('/adventure/french-6e-phonology');
    const barre = () => screen.getByRole('navigation', { name: 'Village' });
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    // Le panneau de l'île s'est replié ; son bouton le rouvre, et la fiche se ferme.
    await user.click(within(barre()).getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' }));
    expect(sheet()).toBeInTheDocument();
    expect(ficheOuverte()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    await user.click(within(barre()).getByRole('button', { name: /Carte/ }));
    expect(ficheOuverte()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    expect(ficheOuverte()).toBeNull();
    await user.click(within(barre()).getByRole('button', { name: /Carte/ }));
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    await user.click(screen.getByRole('button', { name: /^Mes blocs, \d+$/ }));
    expect(ficheOuverte()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(ficheOuverte()).toBeNull();
  });

  it('la fiche attend la fermeture du tutoriel', async () => {
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    expect(ficheOuverte()).toBeNull();
    await user.click(screen.getByRole('button', { name: /Passer/ }));
    expect(screen.getByRole('dialog', { name: 'Abattage syllabique' })).toBeInTheDocument();
  });

  it('une île pâle : l’indice de sa créature, et « Voir le premier ouvrage » ouvre la fiche de cet ouvrage', async () => {
    vuSansAide();
    localStorage.setItem('dysapps:tutorials', JSON.stringify({ 'village-immersif': true, 'decouverte-ouvrages': true }));
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher la Mine pâle' }));
    // Pas de panneau : la caméra reste, la fiche s'ouvre.
    expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/adventure$/);
    const f = screen.getByRole('dialog', { name: 'Mine des lettres' });
    expect(f).toHaveTextContent(/^Mine des lettres.*Tunel :/);
    await user.click(within(f).getByRole('button', { name: 'Voir le premier ouvrage' }));
    const o = screen.getByRole('dialog', { name: /entre Forêt des sons et Mine des lettres/ });
    expect(o).toHaveTextContent(/\d+ blocs\. Il t’en manque \d+\./);
    expect(document.querySelectorAll('.world-fiche')).toHaveLength(1);
    expect(vu.fiche).toMatchObject({ objet: { genre: 'ouvrage', id: 'french-6e-phonology-french-6e-letter-confusion' }, saut: true });
  });

  it('un ouvrage en fantôme : « Construire » quand on a les blocs ; construit, il ne s’ouvre plus (il se touche comme le sol)', async () => {
    vuSansAide();
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 20 } }));
    const user = userEvent.setup();
    renderAt('/adventure');
    await user.click(screen.getByRole('button', { name: 'Toucher le sentier vers la Mine' }));
    const f = screen.getByRole('dialog', { name: /entre Forêt des sons et Mine des lettres/ });
    await user.click(within(f).getByRole('button', { name: /Construire/ }));
    expect(f).toHaveTextContent(/vers Mine des lettres est tracé/);
    expect(JSON.parse(localStorage.getItem('dysapps:game')!).world.links).toContain('french-6e-phonology-french-6e-letter-confusion');
    await user.click(within(f).getByRole('button', { name: 'Fermer la fiche' }));
    await user.click(screen.getByRole('button', { name: 'Toucher le sentier vers la Mine' }));
    expect(ficheOuverte()).toBeNull();
  });
});

describe('les blocs gagnés volent jusqu’au compteur, au retour d’une mission (P2, PR 2, Blocland)', () => {
  /** Une mission de la Forêt vient de donner 5 blocs de bois : 9 en tout, 4 avant elle. */
  const preparer = async () => {
    const { retenirLesBlocs, oublierLesBlocs } = await import('./volDesBlocs');
    oublierLesBlocs();
    vuSansAide();
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 9 }, world: { parts: {}, log: [], links: [], place: 'french-6e-phonology' } }));
    retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: Date.now() });
  };
  // L'horloge des tests : on avance l'attente puis le vol, sans attendre pour de vrai.
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());
  const avancer = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  const jusquAuVol = () => avancer(VOL.attenteMs + 50);
  const jusquALArrivee = () => avancer(dureeDuVol(5) + 50);
  const pastille = () => document.querySelector('.world-bar-count');
  const blocsQuiVolent = () => document.querySelectorAll('.vol-bloc').length;

  it('trois blocs au plus volent, la caméra posée ; la pastille garde l’ancien chiffre, puis change une fois, avec un rebond', async () => {
    await preparer();
    renderAt('/adventure/french-6e-phonology');
    // Avant l'arrivée : l'ancien chiffre, écrit et lu ; les bandeaux de récompense attendent.
    expect(pastille()).toHaveTextContent(/^4$/);
    expect(screen.getByRole('button', { name: 'Mes blocs, 4' })).toBeInTheDocument();
    expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
    expect(blocsQuiVolent()).toBe(0);
    jusquAuVol();
    expect(blocsQuiVolent()).toBe(3);
    expect(pastille()).toHaveTextContent(/^4$/);
    // Le dernier arrivé : le nouveau chiffre, une fois, et la pastille rebondit.
    jusquALArrivee();
    expect(pastille()).toHaveTextContent(/^9$/);
    expect(blocsQuiVolent()).toBe(0);
    expect(pastille()).toHaveClass('rebondit');
    expect(screen.getByRole('button', { name: 'Mes blocs, 9' })).toBeInTheDocument();
  });

  it('une fois seulement : revenir sur l’île ne rejoue pas le vol', async () => {
    await preparer();
    const premier = renderAt('/adventure/french-6e-phonology');
    jusquAuVol();
    jusquALArrivee();
    expect(pastille()).toHaveTextContent(/^9$/);
    premier.unmount();
    renderAt('/adventure/french-6e-phonology');
    expect(pastille()).toHaveTextContent(/^9$/);
  });

  it('un gain retenu il y a plus d’une minute (mission lancée d’ailleurs) ne vole plus : le chiffre a déjà changé', async () => {
    await preparer();
    const { retenirLesBlocs } = await import('./volDesBlocs');
    retenirLesBlocs({ biome: 'french-6e-phonology', mission: 'syllables', bloc: 'french-6e-phonology', nombre: 5, quand: Date.now() - VOL.gardeMs - 1 });
    renderAt('/adventure/french-6e-phonology');
    expect(pastille()).toHaveTextContent(/^9$/);
    jusquAuVol();
    expect(blocsQuiVolent()).toBe(0);
  });

  it('avec « Réduire les animations » : pas de vol, pas de rebond, le chiffre a déjà changé', async () => {
    await preparer();
    demanderMoinsDAnimations();
    renderAt('/adventure/french-6e-phonology');
    expect(pastille()).toHaveTextContent(/^9$/);
    jusquAuVol();
    expect(blocsQuiVolent()).toBe(0);
    expect(pastille()).not.toHaveClass('rebondit');
  });

  it('jamais par-dessus une fiche : une fiche ouverte avant le départ, le vol n’a pas lieu et le chiffre change', async () => {
    await preparer();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderAt('/adventure/french-6e-phonology');
    expect(pastille()).toHaveTextContent(/^4$/);
    await user.click(screen.getByRole('button', { name: 'Toucher une borne de la Forêt' }));
    expect(document.querySelector('.world-fiche')).toBeInTheDocument();
    expect(pastille()).toHaveTextContent(/^9$/);
    jusquAuVol();
    expect(blocsQuiVolent()).toBe(0);
  });

  it('pendant le tutoriel : pas de vol, le chiffre a déjà changé', async () => {
    await preparer();
    localStorage.removeItem('dysapps:tutorials');
    renderAt('/adventure/french-6e-phonology');
    expect(pastille()).toHaveTextContent(/^9$/);
  });

  it('avant la pose de la partie : la vague attend la fin du vol', async () => {
    const { partiesDe } = await import('./world/parties');
    const { retenirLaPose, oublierLesPoses } = await import('./poseAMontrer');
    await preparer();
    oublierLesPoses();
    const [cabane] = partiesDe('french-6e-phonology');
    const parts = Object.fromEntries(cabane.cases.map((c) => [c.plan.id, c.keys]));
    localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 9 }, world: { parts, log: [], links: [], place: 'french-6e-phonology' } }));
    retenirLaPose('french-6e-phonology', [cabane]);
    renderAt('/adventure/french-6e-phonology?worksite=part');
    expect(vu.pose).toBeNull();
    jusquAuVol();
    expect(blocsQuiVolent()).toBe(3);
    expect(vu.pose).toBeNull();
    jusquALArrivee();
    expect(vu.pose).not.toBeNull();
    expect(pastille()).toHaveTextContent(/^9$/);
    expect(blocsQuiVolent()).toBe(0);
  });
});
