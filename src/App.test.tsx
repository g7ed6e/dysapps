import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { BloclandProvider } from './blocland/BloclandContext';

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('l’accueil est un menu principal ; les matières sont dans Quêtes', () => {
  renderAt('/');
  const menu = screen.getByRole('navigation', { name: 'Menu principal' });
  expect(within(menu).getByRole('link', { name: /Quêtes/ })).toHaveAttribute('href', '/quetes');
  expect(within(menu).getByRole('link', { name: /Succès/ })).toHaveAttribute('href', '/succes');
  expect(within(menu).getByRole('link', { name: /Réglages/ })).toHaveAttribute('href', '/reglages');
  expect(screen.getByRole('link', { name: /Blocland/ })).toHaveAttribute('href', '/aventure');
  // La première fois, le Tutoriel passe devant : « Commencer ici ».
  expect(screen.getByRole('link', { name: /Commencer ici.*Tutoriel/ })).toHaveAttribute('href', '/app/demo');
  document.body.innerHTML = '';
  renderAt('/quetes');
  expect(screen.getByRole('link', { name: /Français/ })).toHaveAttribute('href', '/matiere/francais');
  expect(screen.getByRole('link', { name: /Maths/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Anglais/ })).toHaveAttribute('href', '/matiere/anglais');
  // Pas d'onglets : la barre du haut garde les grands endroits (Menu et Réglages sur téléphone).
  expect(screen.queryByRole('navigation', { name: 'Onglets' })).not.toBeInTheDocument();
  const bar = screen.getByRole('navigation', { name: 'Navigation principale' });
  expect(within(bar).getByRole('link', { name: 'Quêtes' })).toHaveAttribute('aria-current', 'page');
  expect(within(bar).getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
  expect(within(bar).getByRole('link', { name: 'Réglages' })).toHaveAttribute('href', '/reglages');
});

it('les révisions du jour ont leur carte sur l’accueil, vers la quête', () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ spaced: [{ itemId: 'foret-echauffement-001:cabane', due: '2000-01-01', stage: 0, streak: 0 }] }));
  renderAt('/');
  expect(screen.getByRole('link', { name: /À revoir aujourd’hui.*Abattage syllabique · Forêt des sons/ })).toHaveAttribute('href', '/aventure/foret/abattage');
});

it('une quête ouverte devient « Continuer » sur l’accueil', () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  renderAt('/app/tables');
  document.body.innerHTML = '';
  renderAt('/');
  expect(screen.getByRole('link', { name: /Continuer.*Tables & calcul mental/ })).toHaveAttribute('href', '/app/tables');
});

it('le Tutoriel est sur l’accueil, pas dans Français, et son retour mène à l’accueil', () => {
  renderAt('/matiere/francais');
  expect(screen.queryByRole('link', { name: /Tutoriel/ })).not.toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/app/demo');
  // Le lien retour et l'onglet Menu mènent au menu.
  for (const link of screen.getAllByRole('link', { name: /^Menu$/ })) expect(link).toHaveAttribute('href', '/menu');
});

it('liste les quêtes d’anglais du portail', () => {
  renderAt('/matiere/anglais');
  expect(screen.getByRole('link', { name: /Vocabulaire/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Verbes irréguliers/ })).toBeInTheDocument();
  // Les îles d'anglais de Blocland, avec leur classe : la Baie et l'Horloge, derrière la Ferme et la Forêt.
  expect(screen.getByRole('heading', { name: /Dans Blocland/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Baie des mots.*Niveau 6e/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Horloge des verbes.*Ouvrage à construire.*Niveau 6e/ })).toBeInTheDocument();
});

it('liste les activités d’une matière', () => {
  renderAt('/matiere/maths');
  expect(screen.getByText('Fractions')).toBeInTheDocument();
  // Les îles de maths de Blocland, avec leur classe ; la Plaine est ouverte, pas la Rivière.
  expect(screen.getByRole('link', { name: /Plaine des nombres.*Nouveau.*Niveau 6e/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Rivière des fractions.*Ouvrage à construire/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Glacier des relatifs.*Archipel à rejoindre.*Niveau 5e/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Archipel de 5e — Les Collines du Large' })).toBeInTheDocument();
  expect(screen.queryByText(/Forêt des sons/)).not.toBeInTheDocument();
  // Les archipels pas encore atteints sont repliés sous « Plus tard ».
  const later = screen.getByText(/^Plus tard : 3 archipels à rejoindre/).closest('details')!;
  expect(later).not.toHaveAttribute('open');
  expect(later).toContainElement(screen.getByRole('heading', { name: 'Archipel de 5e — Les Collines du Large' }));
});

it('en vue simple, le voyage en Bloc-Navire est un écran avec une phrase et un bouton « Arriver », puis le port d’en face', async () => {
  const { VEHICLE_STAGES } = await import('./blocland/world/vehicle');
  const { planCells } = await import('./blocland/world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress, village: { plans: { [coque.id]: planCells(coque).map((c) => c.key) }, bridges: ['foret-mine'] } }));
  const user = userEvent.setup();
  renderAt('/aventure/voyage/5e');
  expect(screen.getByRole('dialog', { name: /Le voyage/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Tu embarques sur le Bloc-Navire. Cap sur les Collines du Large !');
  await user.click(screen.getByRole('button', { name: /Arriver/ }));
  expect(screen.getByRole('heading', { name: /Marché des proportions/ })).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:blocland')!);
  expect(saved.village.bridges).toContain('voyage-5e');
  expect(saved.village.at).toBe('marche');
  // Un voyage impossible (rien de construit) : page introuvable.
  localStorage.clear();
  document.body.innerHTML = '';
  renderAt('/aventure/voyage/5e');
  expect(screen.getByText(/Zone introuvable/)).toBeInTheDocument();
});

it('applique et sauvegarde les réglages', async () => {
  const user = userEvent.setup();
  renderAt('/reglages');
  await user.click(screen.getByLabelText('Nuit'));
  expect(document.documentElement.dataset.theme).toBe('nuit');
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).theme).toBe('nuit');
});

it('effacer la progression demande d’écrire « effacer » : un toucher de trop n’efface rien', async () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 120 }));
  localStorage.setItem('dysapps:reprise', JSON.stringify({ path: '/app/tables', label: 'Tables' }));
  const user = userEvent.setup();
  renderAt('/reglages');
  // Les espacements sont dits en mots.
  expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-valuetext'))).toEqual(['20 px', 'Normal', 'Normal', 'Normal']);
  await user.click(screen.getByRole('button', { name: /Effacer ma progression/ }));
  const erase = screen.getByRole('button', { name: 'Tout effacer' });
  expect(erase).toBeDisabled();
  await user.type(screen.getByRole('textbox'), 'effa');
  expect(erase).toBeDisabled();
  await user.type(screen.getByRole('textbox'), 'cer');
  await user.click(erase);
  expect(JSON.parse(localStorage.getItem('dysapps:progress')!).xp).toBe(0);
  // « Continuer » est oublié aussi.
  expect(localStorage.getItem('dysapps:reprise')).toBeNull();
});

it('redirige l’ancienne adresse de progression vers les succès', () => {
  renderAt('/progression');
  expect(screen.getByRole('heading', { name: /Succès/ })).toBeInTheDocument();
});

it('affiche une page introuvable', () => {
  renderAt('/nimporte-quoi');
  expect(screen.getByText(/Zone introuvable/)).toBeInTheDocument();
});

it('affiche le record d’une quête tous modes confondus', () => {
  localStorage.setItem(
    'dysapps:progress',
    JSON.stringify({
      apps: { 'homophones:niveau-1': { sessions: 1, bestScore: 70, lastPlayed: null }, 'homophones:serie-a': { sessions: 1, bestScore: 90, lastPlayed: null } },
    }),
  );
  renderAt('/matiere/francais');
  expect(screen.getByRole('img', { name: 'Record : 3 étoiles sur 3' })).toBeInTheDocument();
});

it('ouvre la carte de Blocland puis un biome, dont la créature donne la quête', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
  // Le nom commence par le nom du biome ; les cartes verrouillées citent aussi le biome précédent.
  await user.click(screen.getByRole('link', { name: /^Forêt des sons/ }));
  expect(screen.getByRole('heading', { name: /Forêt des sons/ })).toBeInTheDocument();
  expect(screen.getByText('Mousso')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Mousso, golem de mousse' })).toBeInTheDocument();
  expect(screen.getByText('Chasse au son')).toBeInTheDocument();
});

it('en vue simple, « Mes blocs » est une page : ce que chaque bloc construit, et où aller chercher ceux qui manquent', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ inventory: { bois: 4 } }));
  const user = userEvent.setup();
  renderAt('/aventure');
  await user.click(screen.getByRole('link', { name: /Mes blocs \(4\)/ }));
  expect(screen.getByRole('heading', { level: 1, name: /Mes blocs/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Plan de Forêt des sons : encore 22 à gagner/ })).toHaveAttribute('href', '/aventure/foret');
  expect(screen.getByRole('link', { name: 'Plaine des nombres' })).toHaveAttribute('href', '/aventure/plaine');
  // D'abord ce qu'on peut faire tout de suite : 4 blocs paient un ouvrage à 3 blocs.
  const now = screen.getByRole('list', { name: /Tu peux construire/ });
  expect(within(now).getByRole('link', { name: /Sentier vers Mine des lettres/ })).toHaveAttribute('href', '/aventure/foret');
  // Les îles fermées ne sont pas listées une par une, seulement comptées.
  expect(screen.queryByText(/île fermée/)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/sur des îles que tu ouvriras plus tard/)).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /Carte de Blocland/ }));
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
});

it('en vue simple, la Carte et la page des quatre archipels renvoient à la liste des îles', () => {
  renderAt('/aventure/carte');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Forêt des sons/ })).toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/aventure/monde');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
});

it('l’accueil annonce le Bloc-Navire quand il est prêt à partir', async () => {
  const { VEHICLE_STAGES } = await import('./blocland/world/vehicle');
  const { planCells } = await import('./blocland/world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress, village: { plans: { [coque.id]: planCells(coque).map((c) => c.key) }, bridges: ['foret-mine'] } }));
  renderAt('/');
  expect(screen.getByText('Le Bloc-Navire est prêt !')).toBeInTheDocument();
});

it('surligne les syllabes en couleurs alternées quand le réglage est actif', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ syllables: true }));
  const { container } = renderAt('/aventure');
  const syllables = container.querySelectorAll('.syl');
  expect(syllables.length).toBeGreaterThan(10);
  expect(container.querySelectorAll('.syl-0').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.syl-1').length).toBeGreaterThan(0);
});

it('pendant une quête, mode concentration : plus de barre du haut, un bouton Pause qui permet de quitter', async () => {
  const user = userEvent.setup();
  renderAt('/app/fractions');
  expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
  await user.click((await screen.findAllByRole('button', { name: /Lire une fraction/ }))[0]);
  // La partie commence : plus de barre du haut, seulement Pause.
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  const pause = screen.getByRole('dialog', { name: 'Pause' });
  expect(within(pause).getByText(/L’XP des réponses déjà données est gardée/)).toBeInTheDocument();
  // Réglage rapide : la taille du texte.
  await user.click(within(pause).getByRole('button', { name: 'Texte plus grand' }));
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).fontSize).toBe(22);
  await user.click(within(pause).getByRole('button', { name: /Reprendre/ }));
  expect(screen.queryByRole('dialog', { name: 'Pause' })).not.toBeInTheDocument();
  expect(screen.getByText(/Question 1 \/ 8/)).toBeInTheDocument();
  // Quitter : retour au choix des quêtes, la barre du haut revient.
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  await user.click(screen.getByRole('button', { name: /Quitter la partie/ }));
  expect(await screen.findByRole('heading', { name: 'Quêtes' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
});

it('l’école du village : trois portes, les quêtes de la matière, et le retour à la porte', async () => {
  const user = userEvent.setup();
  renderAt('/aventure');
  expect(screen.getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/aventure/ecole');
  document.body.innerHTML = '';
  renderAt('/aventure/ecole');
  expect(screen.getByRole('heading', { name: /École du village/, level: 1 })).toBeInTheDocument();
  const doors = screen.getByRole('list', { name: 'Les trois portes de l’école' });
  expect(within(doors).getAllByRole('button')).toHaveLength(3);
  await user.click(within(doors).getByRole('button', { name: /Maths/ }));
  const fractions = screen.getByRole('link', { name: /Fractions/ });
  expect(fractions).toHaveAttribute('href', '/app/fractions');
  await user.click(fractions);
  expect(await screen.findByRole('link', { name: /École/ })).toHaveAttribute('href', '/aventure/ecole?porte=maths');
  // La Forêt, île de l'école des Basses Terres, y mène aussi.
  document.body.innerHTML = '';
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/aventure/ecole');
  // La salle des trophées, en vue simple : la page Succès.
  expect(screen.getByRole('link', { name: /Salle des trophées/ })).toHaveAttribute('href', '/succes');
  document.body.innerHTML = '';
  renderAt('/aventure/trophees');
  expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/aventure/mine');
  expect(screen.queryByRole('link', { name: /École du village/ })).not.toBeInTheDocument();
});
