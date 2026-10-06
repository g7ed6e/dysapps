import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider, useProgress } from './core/ProgressContext';
import { BloclandProvider } from './game/BloclandContext';

/** Dit si les bandeaux de récompense sont retenus (DA-9). */
function Retenus() {
  return <p data-testid="retenus">{useProgress().celebrationsHeld ? 'oui' : 'non'}</p>;
}

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
            <Retenus />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('l’accueil est le menu de Blocland : le village, les Expéditions (la LV2 en dernier), puis Missions et Réglages', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: 'Blocland', level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Ton village : les Basses Terres/ })).toBeInTheDocument();
  const menu = screen.getByRole('navigation', { name: 'Menu principal' });
  expect(within(menu).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/matiere/maths', '/matiere/french', '/matiere/english', '/matiere/lv2', '/matiere/history-geography', '/matiere/life-earth-sciences', '/matiere/physics-chemistry', '/matiere/technology']);
  expect(within(menu).getByRole('link', { name: /Espagnol.*Expédition/ })).toHaveAttribute('href', '/matiere/lv2');
  expect(within(menu).getByRole('link', { name: /Français.*Expédition/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Toutes les missions/ })).toHaveAttribute('href', '/quetes');
  const links = screen.getByRole('link', { name: /Toutes les missions/ }).closest('p')!;
  expect(within(links).getByRole('link', { name: /Réglages/ })).toHaveAttribute('href', '/reglages');
  // La première fois, pas encore de « Reprendre l’aventure ».
  expect(screen.queryByRole('link', { name: /Reprendre l’aventure/ })).not.toBeInTheDocument();
  // La première fois, le Tutoriel passe devant : « Commencer ici ».
  expect(screen.getByRole('link', { name: /Commencer ici.*Tutoriel/ })).toHaveAttribute('href', '/app/demo');
  document.body.innerHTML = '';
  renderAt('/quetes');
  expect(screen.getByRole('link', { name: /Français/ })).toHaveAttribute('href', '/matiere/french');
  expect(screen.getByRole('link', { name: /Maths/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Anglais/ })).toHaveAttribute('href', '/matiere/english');
  // Blocland : plus de barre du haut (4 octobre 2026), seulement le bouton Menu en haut à droite.
  expect(screen.queryByRole('navigation', { name: 'Onglets' })).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
});

it('les révisions du jour ont leur carte sur l’accueil, vers la mission', () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  localStorage.setItem('dysapps:game', JSON.stringify({ spaced: [{ itemId: 'french-6e-phonology-syllables-warmup-001:cabane', due: '2000-01-01', stage: 0, streak: 0 }] }));
  renderAt('/');
  expect(screen.getByRole('link', { name: /Mes révisions du jour.*Abattage syllabique · Forêt des sons/ })).toHaveAttribute('href', '/adventure/french-6e-phonology/syllables');
});

it('une mission ouverte devient « Ma dernière mission » sur l’accueil', () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  renderAt('/app/tables');
  document.body.innerHTML = '';
  renderAt('/');
  expect(screen.getByRole('link', { name: /Ma dernière mission.*Tables & calcul mental/ })).toHaveAttribute('href', '/app/tables');
});

it('le Tutoriel est sur l’accueil, pas dans Français, et son retour mène à l’accueil', () => {
  renderAt('/matiere/french');
  expect(screen.queryByRole('link', { name: /Tutoriel/ })).not.toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/app/demo');
  // Le lien retour et l'onglet Menu mènent au menu.
  for (const link of screen.getAllByRole('link', { name: /^Menu$/ })) expect(link).toHaveAttribute('href', '/menu');
});

it('une matière sans mission du portail ramène au menu', () => {
  for (const path of ['/matiere/history-geography', '/matiere/life-earth-sciences', '/matiere/physics-chemistry', '/matiere/technology', '/matiere/lv2']) {
    document.body.innerHTML = '';
    renderAt(path);
    for (const link of screen.getAllByRole('link', { name: /^Menu$/ })) expect(link).toHaveAttribute('href', '/menu');
  }
});

it('liste les missions d’anglais du portail', () => {
  renderAt('/matiere/english');
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
  const { VEHICLE_STAGES } = await import('./game/world/vehicle');
  const { planCells } = await import('./game/world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, world: { parts: { [coque.id]: planCells(coque).map((c) => c.key) }, links: ['french-6e-phonology-french-6e-letter-confusion'] } }));
  const user = userEvent.setup();
  renderAt('/adventure/passage/5e');
  expect(screen.getByRole('dialog', { name: /Le voyage/ })).toBeInTheDocument();
  expect(document.body.textContent).toContain('Tu embarques sur le Bloc-Navire. Cap sur les Collines du Large !');
  await user.click(screen.getByRole('button', { name: /Arriver/ }));
  expect(screen.getByRole('heading', { name: /Marché des proportions/ })).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem('dysapps:game')!);
  expect(saved.world.links).toContain('passage-5e');
  expect(saved.world.place).toBe('maths-5e-proportionality');
  // Un voyage impossible (rien de construit) : page introuvable.
  localStorage.clear();
  document.body.innerHTML = '';
  renderAt('/adventure/passage/5e');
  expect(screen.getByText(/Zone introuvable/)).toBeInTheDocument();
});

it('applique et sauvegarde les réglages', async () => {
  const user = userEvent.setup();
  renderAt('/reglages');
  await user.click(screen.getByLabelText('Nuit'));
  expect(document.documentElement.dataset.theme).toBe('night');
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).theme).toBe('night');
});

it('les réglages mènent à la documentation et au code, dans un nouvel onglet', () => {
  renderAt('/reglages');
  const docs = screen.getByRole('link', { name: 'La documentation' });
  const code = screen.getByRole('link', { name: 'Le code sur GitHub' });
  expect(docs).toHaveAttribute('href', 'https://g7ed6e.github.io/dysapps/');
  expect(code).toHaveAttribute('href', 'https://github.com/g7ed6e/dysapps');
  for (const link of [docs, code]) expect(link).toHaveAttribute('target', '_blank');
});

it('effacer la progression demande d’écrire « effacer » : un toucher de trop n’efface rien', async () => {
  localStorage.setItem('dysapps:progress', JSON.stringify({ xp: 120 }));
  localStorage.setItem('dysapps:resume', JSON.stringify({ path: '/app/tables', label: 'Tables' }));
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
  // « Ma dernière mission » est oubliée aussi.
  expect(localStorage.getItem('dysapps:resume')).toBeNull();
});

it('redirige l’ancienne adresse de progression vers les succès', () => {
  renderAt('/progression');
  expect(screen.getByRole('heading', { name: /Succès/ })).toBeInTheDocument();
});

it('affiche une page introuvable', () => {
  renderAt('/nimporte-quoi');
  expect(screen.getByText(/Zone introuvable/)).toBeInTheDocument();
});

it('affiche le record d’une mission tous modes confondus', () => {
  localStorage.setItem(
    'dysapps:progress',
    JSON.stringify({
      apps: { 'homophones:niveau-1': { sessions: 1, bestScore: 70, lastPlayed: null }, 'homophones:serie-a': { sessions: 1, bestScore: 90, lastPlayed: null } },
    }),
  );
  renderAt('/matiere/french');
  expect(screen.getByRole('img', { name: 'Record : 3 étoiles sur 3' })).toBeInTheDocument();
});

it('ouvre la carte de Blocland puis un biome, dont la créature donne la mission', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
  // Le nom commence par le nom du biome ; les cartes verrouillées citent aussi le biome précédent.
  await user.click(screen.getByRole('link', { name: /^Forêt des sons/ }));
  expect(screen.getByRole('heading', { name: /Forêt des sons/ })).toBeInTheDocument();
  expect(screen.getByText('Mousso')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Mousso, golem de mousse' })).toBeInTheDocument();
  expect(screen.getByText('Chasse au son')).toBeInTheDocument();
});

it('en vue simple, « Mes blocs » est une page : ce que chaque bloc construit, et où aller chercher ceux qui manquent', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ stock: { 'french-6e-phonology': 4 } }));
  const user = userEvent.setup();
  renderAt('/adventure');
  await user.click(screen.getByRole('link', { name: /Mes blocs \(4\)/ }));
  expect(screen.getByRole('heading', { level: 1, name: /Mes blocs/ })).toBeInTheDocument();
  // Le bois sert au Bloc-Navire, jamais au bâtiment de l'île (il se pose tout seul, GD-6) ; le reste se gagne sur la Forêt.
  expect(screen.getByRole('link', { name: /Bloc-Navire : encore 16 à gagner/ })).toHaveAttribute('href', '/adventure/maths-6e-calculation');
  expect(screen.queryByText(/Plan de /)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Forêt des sons' })).toHaveAttribute('href', '/adventure/french-6e-phonology');
  // D'abord ce qu'on peut faire tout de suite : 4 blocs paient un ouvrage à 3 blocs.
  const now = screen.getByRole('list', { name: /Tu peux construire/ });
  expect(within(now).getByRole('link', { name: /Pont vers la Mine des lettres/ })).toHaveAttribute('href', '/adventure/french-6e-phonology?worksite=french-6e-phonology-french-6e-letter-confusion');
  // Les îles fermées ne sont pas listées une par une, seulement comptées.
  expect(screen.queryByText(/île fermée/)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/sur des îles que tu ouvriras plus tard/)).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /Carte de Blocland/ }));
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
});

it('en vue simple, les bandeaux de récompense attendent que le mot des grandes étapes soit fermé (DA-9)', async () => {
  const user = userEvent.setup();
  renderAt('/adventure/map');
  const word = screen.getByRole('dialog', { name: 'Le mot de Mousso' });
  expect(screen.getByTestId('retenus')).toHaveTextContent('oui');
  while (within(word).queryByRole('button', { name: 'Suivant' })) await user.click(within(word).getByRole('button', { name: 'Suivant' }));
  await user.click(within(word).getByRole('button', { name: 'J’ai compris' }));
  expect(screen.getByTestId('retenus')).toHaveTextContent('non');
});

it('en vue simple, la Carte et la page des quatre archipels renvoient à la liste des îles', () => {
  renderAt('/adventure/map');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Forêt des sons/ })).toBeInTheDocument();
  // Comme la Carte : la prochaine destination, l'état de chaque île en mot, les archipels non atteints dans la brume.
  expect(screen.getByRole('link', { name: /Y aller/ })).toHaveAttribute('href', '/adventure/french-6e-phonology');
  expect(screen.getByRole('link', { name: /^Forêt des sons.*À explorer/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Carrière des mots.*Fermée/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Carte des quatre archipels.*5e, les Collines du Large : dans la brume/ })).toBeInTheDocument();
  // Un élève qui n'a rien joué : Mousso, la créature de l'île de l'école, se présente, une fois.
  expect(screen.getByRole('dialog', { name: 'Le mot de Mousso' })).toHaveTextContent('Moi, c’est Mousso');
  document.body.innerHTML = '';
  renderAt('/adventure/world');
  expect(screen.getByRole('heading', { name: 'Blocland' })).toBeInTheDocument();
  // Deux pages qui dessinent toutes les îles des quatre archipels : environ 4 s en local depuis les sciences (#370),
  // plus que les 5 s par défaut sur la CI.
}, 15_000);

it('l’accueil annonce le Bloc-Navire quand il est prêt à partir', async () => {
  const { VEHICLE_STAGES } = await import('./game/world/vehicle');
  const { planCells } = await import('./game/world/plans');
  const [coque] = VEHICLE_STAGES;
  const progress = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion'].map((id) => [`${id}-challenge`, { stars: 2, attempts: 1, best: 1 }]));
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, world: { parts: { [coque.id]: planCells(coque).map((c) => c.key) }, links: ['french-6e-phonology-french-6e-letter-confusion'] } }));
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  renderAt('/');
  expect(screen.getByRole('link', { name: /Reprendre l’aventure/ })).toHaveAttribute('href', '/adventure/maths-6e-calculation');
  expect(document.querySelector('.home-destination')).toHaveTextContent(/^Prochaine destination : Plaine.*Bloc-Navire/);
});

it('quand la prochaine destination est un ouvrage, « Reprendre l’aventure » et « Y aller » ouvrent son île sur lui, mis en avant', async () => {
  const { getBiome, missionsJouables } = await import('./game/biomes');
  const { exercisesOf } = await import('./game/exercises');
  // La Forêt, la Plaine, la Mine et la Rivière jouées, 4 blocs, le bonhomme sur la Forêt : la liaison de la Forêt vers la Baie, île d’anglais
  // jamais jouée (GD-9 : la suggestion part du lieu relié le plus proche du lieu fermé).
  const iles = ['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion', 'maths-6e-fractions'] as const;
  const progress = Object.fromEntries(iles.flatMap((ile) => missionsJouables(getBiome(ile)!).map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 2, attempts: 1, best: 0.8 }])));
  const world = { place: 'french-6e-phonology', links: ['french-6e-phonology-french-6e-letter-confusion', 'maths-6e-calculation-maths-6e-fractions'] };
  localStorage.setItem('dysapps:game', JSON.stringify({ progress, stock: { 'french-6e-phonology': 4 }, world }));
  localStorage.setItem('dysapps:progress', JSON.stringify({ totalAnswers: 3 }));
  const lien = '/adventure/french-6e-phonology?worksite=french-6e-phonology-english-6e-vocabulary';
  renderAt('/');
  expect(screen.getByRole('link', { name: /Reprendre l’aventure/ })).toHaveAttribute('href', lien);
  document.body.innerHTML = '';
  // La vue simple : la Carte y mène aussi, et la page de l'île met la ligne de l'ouvrage en avant.
  renderAt('/adventure/map');
  expect(screen.getByRole('link', { name: /Y aller/ })).toHaveAttribute('href', lien);
  document.body.innerHTML = '';
  renderAt(lien);
  expect(document.querySelector('[data-bridge="french-6e-phonology-english-6e-vocabulary"]')).toHaveClass('bridge-highlight');
});

it('surligne les syllabes en couleurs alternées quand le réglage est actif', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ syllables: true }));
  const { container } = renderAt('/adventure');
  const syllables = container.querySelectorAll('.syl');
  expect(syllables.length).toBeGreaterThan(10);
  expect(container.querySelectorAll('.syl-0').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.syl-1').length).toBeGreaterThan(0);
});

it('pendant une mission, mode concentration : plus de barre du haut, un bouton Pause qui permet de quitter', async () => {
  const user = userEvent.setup();
  renderAt('/app/fractions');
  expect(screen.getByRole('link', { name: 'Menu' })).toBeInTheDocument();
  await user.click((await screen.findAllByRole('button', { name: /Lire une fraction/ }))[0]);
  // La partie commence : plus de bouton Menu, seulement Pause.
  expect(screen.queryByRole('link', { name: 'Menu' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  const pause = screen.getByRole('dialog', { name: 'Pause' });
  expect(within(pause).getByText(/L’XP des réponses déjà données est gardée/)).toBeInTheDocument();
  // Réglage rapide : la taille du texte.
  await user.click(within(pause).getByRole('button', { name: 'Texte plus grand' }));
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).fontSize).toBe(22);
  await user.click(within(pause).getByRole('button', { name: /Reprendre/ }));
  expect(screen.queryByRole('dialog', { name: 'Pause' })).not.toBeInTheDocument();
  expect(screen.getByText(/Question 1 \/ 8/)).toBeInTheDocument();
  // Quitter : retour au choix des missions, la barre du haut revient.
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  await user.click(screen.getByRole('button', { name: /Quitter la partie/ }));
  expect(await screen.findByRole('heading', { name: 'Missions' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Menu' })).toBeInTheDocument();
});

it('l’école du village : trois portes, les missions de la matière, et le retour à la porte', async () => {
  const user = userEvent.setup();
  renderAt('/adventure');
  expect(screen.getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/adventure/school');
  document.body.innerHTML = '';
  renderAt('/adventure/school');
  expect(screen.getByRole('heading', { name: /École du village/, level: 1 })).toBeInTheDocument();
  const doors = screen.getByRole('list', { name: 'Les trois portes de l’école' });
  expect(within(doors).getAllByRole('button')).toHaveLength(3);
  await user.click(within(doors).getByRole('button', { name: /Maths/ }));
  const fractions = screen.getByRole('link', { name: /Fractions/ });
  expect(fractions).toHaveAttribute('href', '/app/fractions');
  await user.click(fractions);
  expect(await screen.findByRole('link', { name: /École/ })).toHaveAttribute('href', '/adventure/school?door=maths');
  // La Forêt, île de l'école des Basses Terres, y mène aussi.
  document.body.innerHTML = '';
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByRole('link', { name: /École du village/ })).toHaveAttribute('href', '/adventure/school');
  // La salle des trophées, en vue simple : la page Succès.
  expect(screen.getByRole('link', { name: /Salle des trophées/ })).toHaveAttribute('href', '/succes');
  document.body.innerHTML = '';
  renderAt('/adventure/trophies');
  expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/adventure/french-6e-letter-confusion');
  expect(screen.queryByRole('link', { name: /École du village/ })).not.toBeInTheDocument();
});

it('une ancienne adresse (favori, lien d’enseignant) ouvre la même page sous son adresse neutre', () => {
  renderAt('/aventure/foret/chasse-son');
  expect(screen.getByText(/Chasse au son/)).toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/aventure/foret');
  expect(screen.getByRole('heading', { name: /Forêt des sons/ })).toBeInTheDocument();
  document.body.innerHTML = '';
  renderAt('/matiere/francais');
  expect(screen.queryByText(/Zone introuvable/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Forêt des sons/ })).toHaveAttribute('href', '/adventure/french-6e-phonology');
});
