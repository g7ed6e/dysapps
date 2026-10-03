import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { useVehicleBuilder } from './useVehicleBuilder';
import { planCells, plansFor } from './world/plans';
import { VEHICLE_STAGES } from './world/vehicle';
import { IslandSheet } from './IslandSheet';

const onBoard = vi.fn();

function Sheet({ biomeId, onClose, highlight, in3d }: { biomeId: string; onClose: () => void; highlight?: string; in3d?: boolean }) {
  const biome = getBiome(biomeId)!;
  const ship = useVehicleBuilder(biome.id);
  return <IslandSheet biome={biome} ship={ship} onBoard={onBoard} onClose={onClose} highlight={highlight} in3d={in3d} />;
}

function renderSheet(biomeId: string, onClose = () => {}, highlight?: string, in3d = false) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <Sheet biomeId={biomeId} onClose={onClose} highlight={highlight} in3d={in3d} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('le panneau d’une île ouverte liste ses missions, son Gardien verrouillé et son bâtiment', () => {
  renderSheet('french-6e-phonology');
  expect(screen.getByRole('dialog', { name: /Forêt/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Mousso');
  const quests = screen.getByRole('list', { name: 'Missions de l’île' });
  expect(quests.querySelectorAll('a.island-quest').length).toBeGreaterThanOrEqual(3);
  expect(screen.getAllByText('Nouveau').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText('Le Grand Chêne')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Le Grand Chêne/ })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Le bâtiment : la cabane de Mousso/ })).toBeInTheDocument();
  // Le bâtiment se pose tout seul (GD-6) : aucun bouton pour poser ses blocs à la main.
  expect(screen.queryByRole('button', { name: /Poser le bloc suivant/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Poser tout ce que j’ai/ })).not.toBeInTheDocument();
  // L'inventaire est une page à part : la section du bâtiment y renvoie.
  expect(screen.getByRole('link', { name: /Mes blocs \(0\)/ })).toHaveAttribute('href', '/adventure/stock');
});

it('le panneau 3D replie le bâtiment et les ouvrages quand il n’y a rien à y faire, et ouvre les ouvrages dès que c’est possible', async () => {
  // Rien en poche : bâtiment et ouvrages repliés, chacun avec sa ligne d'état ; les missions restent visibles.
  renderSheet('french-6e-phonology', () => {}, undefined, true);
  const plan = () => document.querySelector<HTMLDetailsElement>('.island-fold-plan')!;
  const ouvrages = () => document.querySelector<HTMLDetailsElement>('.island-fold-ouvrages')!;
  expect(plan()).not.toHaveAttribute('open');
  expect(plan().textContent).toContain('0 partie posée sur 3');
  expect(ouvrages()).not.toHaveAttribute('open');
  // Le pli replié nomme l'ouvrage suggéré, avec les mots de la Carte ; il est en tête de la liste.
  expect(ouvrages().textContent).toContain('Encore 4 blocs pour le sentier vers Mine des lettres');
  expect(ouvrages().querySelector('[data-bridge]')).toHaveAttribute('data-bridge', 'french-6e-phonology-french-6e-letter-confusion');
  expect(screen.getByRole('list', { name: 'Missions de l’île' })).toBeInTheDocument();
  // L'élève ouvre le pli lui-même : son choix tient.
  await userEvent.click(plan().querySelector('summary')!);
  expect(plan()).toHaveAttribute('open');
  // Des blocs en poche : les ouvrages s'ouvrent d'eux-mêmes ; le bâtiment reste replié (rien à y poser à la main).
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4 } }));
  cleanup();
  renderSheet('french-6e-phonology', () => {}, undefined, true);
  expect(plan()).not.toHaveAttribute('open');
  expect(ouvrages()).toHaveAttribute('open');
  expect(screen.getAllByRole('button', { name: /Construire/ }).length).toBeGreaterThan(0);
});

it('les blocs qui manquent renvoient à l’île où les gagner, par un lien', () => {
  renderSheet('maths-6e-calculation', () => {}, undefined, true);
  // La coque du navire demande du bois : lien vers la Forêt (le bâtiment de l'île, lui, ne demande aucun bloc : GD-6).
  const navire = document.querySelector('.island-fold-navire')!;
  expect(navire).not.toHaveAttribute('open');
  expect(navire.textContent).toContain('0 / 45 posés · il manque');
  const links = screen.getAllByRole('link', { name: 'Forêt des sons' });
  expect(links[0]).toHaveAttribute('href', '/adventure/french-6e-phonology');
  expect(document.body.textContent).not.toContain('briques · à gagner ici');
});

it('une île fermée montre ses missions verrouillées et renvoie à l’île précédente', async () => {
  const onClose = vi.fn();
  renderSheet('french-6e-letter-confusion', onClose);
  expect(document.body.textContent).toContain('Pas si vite ! Pour venir ici, construis le sentier depuis Forêt des sons : 4 blocs.');
  // Sans bloc : l'ouvrage est une ligne compacte qui dit ce qu'il manque, sans bouton grisé.
  expect(screen.queryByRole('button', { name: /Construire/ })).not.toBeInTheDocument();
  expect(document.body.textContent).toContain('Sentier vers Forêt des sons');
  expect(document.body.textContent).toContain('Encore 4 blocs (4 en tout)');
  expect(screen.getByRole('list', { name: 'Missions de l’île' }).querySelectorAll('a.island-quest')).toHaveLength(0);
  expect(screen.getAllByText('Verrouillé').length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole('button', { name: 'Fermer le panneau' }));
  expect(onClose).toHaveBeenCalled();
});

it('le bâtiment dit en mots ses parties posées, le nom de la prochaine et comment la poser, puis qu’il est fini', () => {
  // Une partie posée (une mission réussie) sur trois.
  const [cabane] = plansFor('french-6e-phonology');
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { parts: { [cabane.id]: planCells(cabane).map((c) => c.key) } } }));
  renderSheet('french-6e-phonology');
  const section = document.querySelector('.plan-section')!;
  expect(section).toHaveTextContent('1 partie posée sur 3');
  expect(section).toHaveTextContent('Prochaine partie : le toit de la cabane.');
  expect(section).toHaveTextContent('Termine une autre mission de l’île pour la poser.');
  expect(section.textContent).not.toMatch(/manqu/);
  expect(screen.getByRole('progressbar', { name: /Le bâtiment La cabane de Mousso/ })).toHaveAttribute('aria-valuenow', '1');
  // Toutes les parties posées : le bâtiment est fini, la créature le dit.
  cleanup();
  const parts = Object.fromEntries(plansFor('french-6e-phonology').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  localStorage.setItem('dysapps:game', JSON.stringify({ world: { parts } }));
  renderSheet('french-6e-phonology');
  expect(document.querySelector('.plan-done')).toHaveTextContent('Le bâtiment est fini !');
  expect(document.querySelector('.plan-next')).toBeNull();
  // Aucune partie : la première phrase ne dit pas « nouvelle ».
  cleanup();
  localStorage.removeItem('dysapps:game');
  renderSheet('french-6e-phonology');
  expect(document.querySelector('.plan-section')).toHaveTextContent('Prochaine partie : la cabane de Mousso.');
  expect(document.querySelector('.plan-section')).toHaveTextContent('Termine une mission de l’île pour la poser.');
});

it('le port montre le chantier du Bloc-Navire : ses blocs, ses Gardiens, puis le bouton pour embarquer', async () => {
  const [coque] = VEHICLE_STAGES;
  renderSheet('maths-6e-calculation');
  expect(screen.getByText(/Le Bloc-Navire — Étape 1 \/ 3 : La coque et la voile/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Avancement du Bloc-Navire' })).toHaveAttribute('aria-valuenow', '0');
  expect(document.body.textContent).toContain('Gardiens : encore 3 à vaincre dans les Basses Terres pour la voile.');
  expect(screen.queryByRole('button', { name: /Embarquer/ })).not.toBeInTheDocument();
  // Pas de section navire sur une île qui n'est pas un port.
  expect(screen.queryByText(/Le Bloc-Navire —/, { selector: 'h3' })).toBeInTheDocument();
  // Tout posé et trois Gardiens vaincus : on peut embarquer.
  const plans = { [coque.id]: planCells(coque).map((c) => c.key) };
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, world: { parts: plans, links: ['french-6e-phonology-french-6e-letter-confusion'] } }));
  cleanup();
  renderSheet('maths-6e-calculation');
  expect(document.body.textContent).toContain('Gardiens : c’est fait ! 3 sur 3, la voile est là.');
  expect(document.body.textContent).toContain('Le Bloc-Navire est prêt : embarque vers les Collines du Large !');
  await userEvent.click(screen.getByRole('button', { name: /Embarquer vers l’archipel de 5e — Les Collines du Large/ }));
  expect(onBoard).toHaveBeenCalledWith('5e', false);
});

it('une île d’un autre archipel dit ce qu’il manque au Bloc-Navire, sans ouvrage à proposer', () => {
  renderSheet('maths-5e-proportionality');
  expect(document.body.textContent).toContain('Pas si vite ! Mon île est dans les Collines du Large, de l’autre côté de la mer.');
  expect(document.body.textContent).toContain('Finis le Bloc-Navire sur Plaine des nombres');
  expect(screen.queryByText('Ouvrages')).not.toBeInTheDocument();
});

it('l’ouvrage touché dans le monde est mis en avant dans la liste, et son pli s’ouvre', () => {
  renderSheet('french-6e-phonology', () => {}, 'french-6e-phonology-french-6e-letter-confusion', true);
  const item = document.querySelector('[data-bridge="french-6e-phonology-french-6e-letter-confusion"]');
  expect(item).not.toBeNull();
  expect(item!.className).toContain('bridge-highlight');
  expect(document.querySelectorAll('.bridge-highlight')).toHaveLength(1);
  expect(document.querySelector('.island-fold-ouvrages')).toHaveAttribute('open');
  expect(document.querySelector('.island-fold-plan')).not.toHaveAttribute('open');
});

it('le navire touché dans le monde ouvre son pli', () => {
  renderSheet('maths-6e-calculation', () => {}, 'vehicle', true);
  expect(document.querySelector('.island-fold-navire')).toHaveAttribute('open');
  expect(document.querySelector('.ship-section')!.className).toContain('bridge-highlight');
});

it('l’accueil de la créature : une ligne écrite visible, la suite dans un pli « La suite » ; Réécouter lit le tout', () => {
  renderSheet('french-6e-phonology');
  const says = document.querySelector('.island-sheet-says')!;
  const more = document.querySelector<HTMLDetailsElement>('.island-says-more')!;
  expect(more).not.toHaveAttribute('open');
  expect(more.querySelector('summary')).toHaveTextContent('La suite');
  // Rien n'est seulement à l'écoute : la ligne et la suite font tout l'accueil, que le bouton lit d'un coup.
  const speak = says.querySelector('button');
  if (speak) expect(speak.getAttribute('aria-label')).toContain(more.querySelector('p')!.textContent!.trim().slice(0, 20));
  expect(says.textContent!.length).toBeGreaterThan(30);
  expect(says.textContent).not.toContain(more.querySelector('p')!.textContent!.trim());
  // « Réécouter » sur la ligne du nom de la créature, sa phrase dessous.
  expect(says.firstElementChild).toHaveTextContent('Mousso :');
  expect(says.lastElementChild).toHaveClass('island-sheet-says-texte');
  if (speak) expect(says.children[1]).toBe(speak);
});

it('sur l’île-port en 3D, la suite de l’accueil et le pli de l’objectif ont des clés distinctes', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  renderSheet('maths-6e-calculation', () => {}, undefined, true);
  expect(document.querySelector('.island-fold-objectif')).not.toBeNull();
  expect(error.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false);
  error.mockRestore();
});

it('la matière, la classe et l’archipel descendent au pied du panneau ; les missions suivent l’accueil', () => {
  renderSheet('french-6e-phonology');
  const sheet = screen.getByRole('dialog', { name: /Forêt/ });
  expect(sheet.querySelector('.island-sheet-head')!.textContent).not.toContain('Niveau');
  const foot = sheet.lastElementChild!;
  expect(foot).toHaveClass('island-sheet-foot');
  expect(foot.textContent).toContain('Niveau 6e · Les Basses Terres');
  // Rien entre l'accueil et les missions sur une île ouverte (l'objectif vient après le Gardien).
  const heading = screen.getByRole('heading', { name: 'Missions' });
  const quests = screen.getByRole('list', { name: 'Missions de l’île' });
  expect(heading.compareDocumentPosition(document.querySelector('.island-goal')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(quests.compareDocumentPosition(document.querySelector('.island-goal')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('la jauge du prochain objectif se compte tant qu’il manque des blocs, et s’efface quand tout est là', () => {
  renderSheet('french-6e-phonology');
  expect(document.querySelector('.island-goal .goal-gauge')).toHaveTextContent('0 / 4');
  cleanup();
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4 } }));
  renderSheet('french-6e-phonology');
  expect(document.querySelector('.island-goal')).toHaveTextContent('Tu peux construire le sentier');
  // Plus de « 4 / 4 » à côté d'un ouvrage pas encore construit.
  expect(document.querySelector('.island-goal .goal-gauge')).toBeNull();
});

it('sur l’île-port, le prochain objectif et le village sont un seul pli, titré par l’objectif et sa jauge', async () => {
  renderSheet('maths-6e-calculation');
  const fold = document.querySelector<HTMLDetailsElement>('.island-fold-objectif')!;
  expect(fold).not.toHaveAttribute('open');
  const summary = fold.querySelector('summary')!;
  expect(summary.textContent).toContain('Prochain objectif :');
  expect(summary.querySelector('.goal-gauge')).not.toBeNull();
  expect(summary.textContent).not.toContain('Le village :');
  expect(fold.querySelector('.village-stage')).toHaveTextContent('Le village :');
  await userEvent.click(summary);
  expect(fold).toHaveAttribute('open');
  // Une île qui n'est pas un port : l'objectif seul, sans pli.
  cleanup();
  renderSheet('french-6e-phonology');
  expect(document.querySelector('.island-fold-objectif')).toBeNull();
  expect(document.querySelector('.village-stage')).toBeNull();
});

it('le pli Ouvrages : un seul « Construire » principal, celui de l’ouvrage du prochain objectif ; les autres en secondaire', () => {
  // La Plaine, port des Premiers Rivages (GD-7), avec 4 blocs : plusieurs ouvrages se construisent tout de suite.
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4 } }));
  renderSheet('maths-6e-calculation', () => {}, undefined, true);
  const boutons = screen.getAllByRole('button', { name: /Construire/ });
  expect(boutons.length).toBeGreaterThanOrEqual(3);
  const principaux = boutons.filter((b) => b.classList.contains('primary'));
  expect(principaux).toHaveLength(1);
  for (const b of boutons) expect(b).toHaveClass('button');
  // C'est l'ouvrage que nomme le prochain objectif de l'île.
  const ligne = principaux[0].closest('li')!;
  const titre = ligne.querySelector('.island-quest-title')!.textContent!;
  const vers = titre.replace(/^.* vers /, '');
  expect(document.querySelector('.island-goal')!.textContent).toContain(`vers ${vers}`);
  expect(document.querySelector('.island-goal')!.textContent).toMatch(new RegExp(`construire l[e’] ?${titre.split(' vers ')[0].toLowerCase()}`));
});

it('le panneau de l’île de l’école n’a plus l’école, le lieu où l’on assemble ni la salle des trophées : ce sont des lieux du monde', () => {
  renderSheet('french-6e-phonology', () => {}, undefined, true);
  const sheet = screen.getByRole('dialog', { name: /Forêt des sons/ });
  expect(within(sheet).queryByRole('link', { name: /École du village|Salle des trophées|Fabrique|assembl/i })).not.toBeInTheDocument();
  // Il garde le reste : les missions et le Gardien.
  expect(within(sheet).getByRole('list', { name: 'Missions de l’île' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /Le Grand Chêne/ })).toBeInTheDocument();
});
