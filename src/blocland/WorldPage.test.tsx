import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { BloclandProvider } from './BloclandContext';
import { WorldPage } from './WorldPage';
import { BADGES } from '../core/progress';

// Pas de WebGL dans les tests : un monde factice, qui montre l'île cadrée et laisse toucher une île.
vi.mock('./three', () => ({
  hasWebGL: () => false,
  VoxelCanvas: () => null,
  WorldCanvas: ({
    focus,
    onPickIsland,
    onPickVehicle,
    vehicle,
    archipelago,
    voyage,
    onVoyageLegEnd,
    onPickPlace,
  }: {
    focus: { island: string | null };
    onPickIsland: (id: string) => void;
    onPickVehicle: (port: string) => void;
    vehicle: { port: string; cubes: { ghost?: boolean }[] } | null;
    archipelago: string;
    voyage: { leg: string; stage: number; back: boolean } | null;
    onVoyageLegEnd: () => void;
    onPickPlace: (place: string, island: string) => void;
  }) => (
    <div>
      <p data-testid="cadrage">{focus.island ?? 'aucune'}</p>
      <p data-testid="archipel">{archipelago}</p>
      <p data-testid="voyage">{voyage ? `${voyage.leg} ${voyage.stage} ${voyage.back ? 'retour' : 'aller'}` : 'aucun'}</p>
      <button type="button" onClick={onVoyageLegEnd}>
        Fin du temps
      </button>
      <p data-testid="navire">{vehicle ? `${vehicle.port} ${vehicle.cubes.filter((c) => c.ghost).length}` : 'aucun'}</p>
      <button type="button" onClick={() => onPickIsland('foret')}>
        Toucher la Forêt dans le monde
      </button>
      <button type="button" onClick={() => onPickPlace('ecole', 'foret')}>
        Toucher l’école dans le monde
      </button>
      <button type="button" onClick={() => onPickPlace('trophees', 'foret')}>
        Toucher la salle des trophées dans le monde
      </button>
      <button type="button" onClick={() => vehicle && onPickVehicle(vehicle.port)}>
        Toucher le Bloc-Navire
      </button>
    </div>
  ),
}));

function Where() {
  return <p data-testid="adresse">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/aventure/:biomeId?" element={<WorldPage />} />
            </Routes>
            <Where />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const sheet = () => screen.queryByRole('dialog', { name: /Forêt des sons/ });

it('replie le panneau d’une île et le rouvre, sans quitter l’île', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  expect(sheet()).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' })).toHaveAttribute('aria-pressed', 'true');

  // La croix replie le panneau : on reste sur l'île, la caméra aussi.
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');

  // Le bouton de l'île, dans la barre du bas, le rouvre ; puis le replie.
  const toggle = screen.getByRole('button', { name: 'Ouvrir le panneau de Forêt des sons' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await user.click(toggle);
  expect(sheet()).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Replier le panneau de Forêt des sons' }));
  expect(sheet()).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
});

it('rouvre le panneau replié quand on touche à nouveau l’île dans le monde', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/foret');
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(sheet()).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Toucher la Forêt dans le monde' }));
  expect(sheet()).toBeInTheDocument();
});

it('le Bloc-Navire est amarré au port de l’archipel ; le toucher ouvre le panneau du port sur sa section', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  // Sur la Plaine, en chantier : ses cases à poser sont en fantôme.
  expect(screen.getByTestId('navire')).toHaveTextContent(/^plaine \d+$/);
  await user.click(screen.getByRole('button', { name: 'Toucher le Bloc-Navire' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/plaine');
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
  const progress = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress, village: { plans: { [coque.id]: planCells(coque).map((c) => c.key) }, bridges: ['foret-mine'] } }));
  const user = userEvent.setup();
  renderAt('/aventure/plaine');
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
  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.village.bridges).toContain('voyage-5e');
  expect(saved.village.at).toBe('marche');
  // Fin de l'arrivée : le panneau du port s'ouvre.
  await user.click(screen.getByRole('button', { name: 'Fin du temps' }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/marche');
  expect(screen.getByRole('dialog', { name: /Marché des proportions/ })).toBeInTheDocument();
});

it('avec « Réduire les animations », le voyage est un écran fixe avec un bouton « Arriver »', async () => {
  const { VEHICLE_STAGES } = await import('./world/vehicle');
  const { planCells } = await import('./world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress, village: { plans: { [coque.id]: planCells(coque).map((c) => c.key) }, bridges: ['foret-mine'] } }));
  localStorage.setItem('dysapps:settings', JSON.stringify({ reduceMotion: true }));
  const user = userEvent.setup();
  renderAt('/aventure/plaine');
  await user.click(screen.getByRole('button', { name: /Embarquer vers l’archipel de 5e/ }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(screen.getByRole('dialog', { name: /Le voyage/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Arriver/ }));
  expect(screen.getByTestId('archipel')).toHaveTextContent('5e');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/marche');
});

it('« Aller au port » d’un archipel déjà atteint : un fondu court, sans cinématique, et une ligne qui dit où l’on arrive', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { bridges: ['plaine-riviere', 'voyage-5e'], at: 'riviere' } }));
  const user = userEvent.setup();
  renderAt('/aventure/monde');
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  await user.click(screen.getByRole('button', { name: /Aller au port : Marché des proportions/ }));
  // Pas de voyage joué : le voile, puis l'arrivée au port d'en face, son panneau ouvert.
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(document.body.textContent).toContain('Archipel de 5e : les Collines du Large');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/marche'));
  expect(screen.getByRole('dialog', { name: /Marché des proportions/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).village.at).toBe('marche');
});

it('une île ouverte d’un autre archipel (lien, retour d’exercice) : on y arrive directement, d’un fondu', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { bridges: ['voyage-5e'], at: 'marche' } }));
  renderAt('/aventure/foret');
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  expect(document.body.textContent).toContain('Archipel de 6e : les Basses Terres');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('6e'), { timeout: 2000 });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');
  expect(sheet()).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('dysapps:blocland')!).village.at).toBe('foret');
});

it('avec « Réduire les animations », un archipel déjà atteint s’ouvre tout de suite, sans écran du voyage', async () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ reduceMotion: true }));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { bridges: ['voyage-5e'], at: 'marche' } }));
  renderAt('/aventure/foret');
  expect(screen.queryByRole('dialog', { name: /Le voyage/ })).not.toBeInTheDocument();
  expect(screen.getByTestId('archipel')).toHaveTextContent('6e');
  expect(sheet()).toBeInTheDocument();
});

it('le sélecteur d’archipel : l’archipel où l’on est, et les autres déjà atteints à un toucher', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  // Un seul archipel atteint : pas de sélecteur.
  expect(screen.queryByRole('button', { name: /changer d’archipel/ })).not.toBeInTheDocument();
  document.body.innerHTML = '';
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { bridges: ['voyage-5e'], at: 'foret' } }));
  renderAt('/aventure');
  const button = screen.getByRole('button', { name: /Archipel de 6e, les Basses Terres : changer d’archipel/ });
  await user.click(button);
  const list = screen.getByRole('group', { name: 'Changer d’archipel' });
  expect(within(list).getByRole('button', { name: /6e Les Basses Terres Tu es ici/ })).toBeDisabled();
  expect(within(list).getByRole('button', { name: /4e Les Monts de Feu Fermé/ })).toBeDisabled();
  await user.click(within(list).getByRole('button', { name: /5e Les Collines du Large/ }));
  expect(screen.getByTestId('voyage')).toHaveTextContent('aucun');
  await waitFor(() => expect(screen.getByTestId('archipel')).toHaveTextContent('5e'), { timeout: 2000 });
  await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/marche'));
});

it('la page des quatre archipels : où l’on est, ce qui est ouvert, ce qu’il faut pour aller plus loin', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/monde');
  const sheet = screen.getByRole('dialog', { name: 'Les quatre archipels' });
  expect(sheet).toBeInTheDocument();
  expect(sheet.textContent).toContain('Archipel de 6e — Les Basses Terres');
  expect(sheet.textContent).toContain('Tu es ici');
  expect(sheet.textContent).toContain('Archipel de 5e — Les Collines du Large');
  expect(sheet.textContent).toContain('Le Bloc-Navire se construit sur Plaine des nombres : 0 blocs posés sur');
  expect(sheet.textContent).toContain('Il faut d’abord le Bloc-Navire avec la voile, puis le ballon.');
  // « Voir le chantier » mène au port ; « Aller au port » aussi, pour l'archipel où l'on est.
  await user.click(screen.getAllByRole('button', { name: 'Voir le chantier' })[0]);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/plaine');
  expect(screen.getByRole('dialog', { name: /Plaine des nombres/ })).toBeInTheDocument();
});

it('à la première arrivée dans un archipel, deux bulles d’accueil, une seule fois', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ village: { bridges: ['voyage-5e'], at: 'marche' } }));
  renderAt('/aventure');
  expect(screen.getByTestId('archipel')).toHaveTextContent('5e');
  expect(document.body.textContent).toContain('Bienvenue dans les Collines du Large, l’archipel de 5e !');
  // Déjà vu : plus de bulles.
  localStorage.setItem('dysapps:tutos', JSON.stringify({ 'archipel-5e': true, 'village-immersif': true }));
  document.body.innerHTML = '';
  renderAt('/aventure');
  expect(document.body.textContent).not.toContain('Bienvenue dans les Collines du Large');
});

it('le bouton Blocs ouvre « Mes blocs » ; une puce mène à l’île (caméra et panneau) ; la croix ramène sur l’île du bonhomme', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 4, brique: 2 } }));
  const user = userEvent.setup();
  renderAt('/aventure/plaine');
  const blocs = screen.getByRole('button', { name: 'Mes blocs' });
  expect(blocs).toHaveTextContent('Blocs (6)');
  expect(blocs).toHaveAttribute('aria-pressed', 'false');
  await user.click(blocs);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/blocs');
  expect(screen.getByRole('button', { name: 'Mes blocs' })).toHaveAttribute('aria-pressed', 'true');
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).toContain('6 blocs en poche');
  expect(sheet.textContent).toContain('4 bois');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('aucune');
  // Le bois sert au plan de la Forêt : la puce y mène, la caméra cadre la Forêt et son panneau s'ouvre.
  await user.click(screen.getByRole('link', { name: /Plan de Forêt des sons : encore 12 à gagner/ }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');
  expect(screen.getByRole('dialog', { name: /Forêt des sons/ })).toBeInTheDocument();
  // Depuis l'inventaire, la croix ramène sur l'île où se tient le bonhomme.
  await user.click(screen.getByRole('button', { name: 'Mes blocs' }));
  await user.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/foret');
  expect(screen.getByRole('dialog', { name: /Forêt des sons/ })).toBeInTheDocument();
});

it('« À aller chercher » mène à l’île où gagner le bloc qui manque', async () => {
  const user = userEvent.setup();
  renderAt('/aventure/blocs');
  const sheet = screen.getByRole('dialog', { name: 'Mes blocs' });
  expect(sheet.textContent).toContain('Aucun bloc pour l’instant');
  const brique = within(sheet).getByRole('link', { name: 'Plaine des nombres' });
  await user.click(brique);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/plaine');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('plaine');
  expect(screen.getByRole('dialog', { name: /Plaine des nombres/ })).toBeInTheDocument();
});

it('sans île ouverte, pas de panneau ni de bouton de panneau', () => {
  const { container } = renderAt('/aventure');
  expect(container.querySelector('.island-sheet')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /panneau de/ })).not.toBeInTheDocument();
});

it('l’école du village : on la touche dans le monde (ou « École » dans la barre), son panneau montre les trois portes', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  await user.click(await screen.findByRole('button', { name: 'Toucher l’école dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /École du village/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/ecole');
  // La caméra cadre l'île de l'école (la Forêt dans les Basses Terres).
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');
  await user.click(within(sheet).getByRole('button', { name: /Français/ }));
  expect(within(sheet).getByRole('link', { name: /Homophones/ })).toHaveAttribute('href', '/app/homophones');
  // Le bouton de la barre referme l'école.
  const bar = screen.getByRole('navigation', { name: 'Village' });
  const button = within(bar).getByRole('button', { name: 'École du village' });
  expect(button).toHaveAttribute('aria-pressed', 'true');
  await user.click(button);
  expect(screen.queryByRole('dialog', { name: /École du village/ })).not.toBeInTheDocument();
});

it('le menu du village : le bouton Pause l’ouvre en panneau, « Reprendre » le referme', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  await user.click(await screen.findByRole('button', { name: 'Menu' }));
  const menu = await screen.findByRole('dialog', { name: 'Menu' });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/menu');
  expect(within(menu).getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/aventure/ecole');
  expect(within(menu).getByRole('link', { name: /Quêtes/ })).toHaveAttribute('href', '/quetes');
  expect(within(menu).getByRole('link', { name: /Succès/ })).toHaveAttribute('href', '/aventure/trophees');
  expect(within(menu).getByRole('link', { name: /Réglages/ })).toHaveAttribute('href', '/reglages');
  await user.click(within(menu).getByRole('button', { name: /Reprendre/ }));
  expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent(/^\/aventure$/);
});

it('la salle des trophées : on la touche dans le monde, son panneau montre les succès', async () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 1, badges: { 'premier-pas': '2026-09-27T10:00:00Z' } }));
  const user = userEvent.setup();
  renderAt('/aventure');
  await user.click(await screen.findByRole('button', { name: 'Toucher la salle des trophées dans le monde' }));
  const sheet = await screen.findByRole('dialog', { name: /Salle des trophées/ });
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/trophees');
  expect(screen.getByTestId('cadrage')).toHaveTextContent('foret');
  expect(within(sheet).getByText(`1 / ${BADGES.length} trophées`)).toBeInTheDocument();
  expect(within(sheet).getByRole('heading', { name: `Succès 1 / ${BADGES.length}` })).toBeInTheDocument();
  await user.click(within(sheet).getByRole('button', { name: 'Fermer le panneau' }));
  expect(screen.queryByRole('dialog', { name: /Salle des trophées/ })).not.toBeInTheDocument();
});

it('le bouton retour, dans le village, ouvre le menu du village au lieu de quitter', async () => {
  renderAt('/aventure');
  await screen.findByRole('button', { name: 'Menu' });
  window.history.back();
  expect(await screen.findByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/aventure/menu');
});
