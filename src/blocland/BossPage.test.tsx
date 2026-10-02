import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { AppRoutes } from '../App';
import { getBiome } from './biomes';
import { BloclandProvider } from './BloclandContext';
import { typesWithContent } from './boss';
import { exercisesOf } from './exercises';

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

/** Attend que le contenu de l'exercice (chargé à la demande) soit là. */
const loaded = () => waitFor(() => expect(screen.queryByText('Chargement…')).not.toBeInTheDocument());

function ready(biomeId: string) {
  const biome = getBiome(biomeId)!;
  const progress: Record<string, unknown> = {};
  for (const type of typesWithContent(biome)) progress[exercisesOf(biome.id, type)[0].id] = { stars: 2, attempts: 1, best: 0.8 };
  return progress;
}

it('la page du biome montre le Gardien verrouillé, puis prêt quand chaque mission a deux étoiles', () => {
  renderAt('/aventure/foret');
  expect(screen.getByText('Le Grand Chêne')).toBeInTheDocument();
  expect(screen.getByText(/2 étoiles dans : Abattage syllabique, Chasse au son, Rimes-échelle/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Le Grand Chêne/ })).not.toBeInTheDocument();
});

it('sans les étoiles, le Gardien refuse et renvoie aux missions', async () => {
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(screen.getByRole('heading', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(document.body.textContent).toMatch(/Il te manque encore des étoiles/);
  expect(screen.getByRole('link', { name: /Voir les missions/ })).toBeInTheDocument();
});

it('avec les étoiles, le défi démarre : première épreuve avec l’écran de sa mission', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(screen.getByText(/Prêt à t’affronter/)).toBeInTheDocument();
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(screen.getAllByText(/Épreuve : Abattage syllabique/).length).toBeGreaterThan(0);
  // L'arène : le Gardien et sa jauge de résistance, pleine au départ.
  expect(screen.getByRole('region', { name: /L’arène du Gardien/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Le Grand Chêne, le Gardien/ })).toBeInTheDocument();
  const gauge = screen.getByRole('progressbar', { name: /Résistance du Gardien/ });
  expect(gauge).toHaveAttribute('aria-valuenow', gauge.getAttribute('aria-valuemax'));
  // L'écran de la manche est celui de la mission : un QCM de syllabes.
  expect(screen.getByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
});

it('devant « Épreuve », un bouclier dans Blocland, la flamme de la sentinelle dans Archipéo (DA-8)', async () => {
  const icone = () => screen.getAllByText(/Épreuve : /)[0].querySelector('svg')?.getAttribute('class') ?? '';
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
  const blocland = renderAt('/aventure/foret/gardien');
  await loaded();
  expect(icone()).toMatch(/shield/);
  blocland.unmount();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(icone()).toMatch(/flame/);
  expect(icone()).not.toMatch(/shield/);
});

it('à chaque épreuve, la résistance du Gardien baisse et il réagit', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/aventure/foret/gardien');
  await loaded();
  const gauge = () => screen.getByRole('progressbar', { name: /Résistance du Gardien/ });
  const max = Number(gauge().getAttribute('aria-valuemax'));
  // Première épreuve : un QCM de syllabes, on répond juste (la bonne réponse est dans les données de l'exercice).
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('foret-echauffement-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item.answer) }));
  expect(gauge()).toHaveAttribute('aria-valuenow', String(max - 1));
  expect(document.body.textContent).toMatch(/Mes branches tremblent/);
});

it('un Gardien déjà vaincu reste ouvert à la revanche, même si une mission de son île n’a pas encore d’étoile', async () => {
  // La victoire, puis une mission sans étoile (comme une mission arrivée après coup sur l'île).
  const progress = { ...ready('foret'), 'foret-gardien': { stars: 2, attempts: 1, best: 0.9 } } as Record<string, unknown>;
  delete progress[exercisesOf('foret', 'rimes')[0].id];
  localStorage.setItem('dysapps:game', JSON.stringify({ progress }));
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  localStorage.setItem('dysapps:game', JSON.stringify({ progress }));
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(document.body.textContent).not.toMatch(/Il te manque encore des étoiles/);
  expect(screen.getAllByText(/Épreuve : /).length).toBeGreaterThan(0);
}, 30_000);

it('le nom du Gardien une seule fois, et sa réplique entière au lancement puis repliée en une ligne (DA-34)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/aventure/foret/gardien');
  await loaded();
  const arene = screen.getByRole('region', { name: /L’arène du Gardien/ });
  // Le nom dans le titre de l'écran, pas répété dans l'arène.
  expect(screen.getByRole('heading', { level: 1, name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(arene.querySelector('.arena-name')).toBeNull();
  expect(Array.from(arene.querySelectorAll('p')).some((p) => p.textContent === 'Le Grand Chêne')).toBe(false);
  // Au lancement : la réplique entière, sans pli.
  const ligne = () => arene.querySelector('.arena-line')!;
  expect(ligne().textContent).toMatch(/Le Grand Chêne/);
  expect(arene.querySelector('.arena-replique')).not.toHaveClass('repliee');
  expect(screen.queryByRole('button', { name: 'Toute la réplique' })).not.toBeInTheDocument();
  // Une épreuve jouée : la nouvelle réplique, repliée en une ligne. Courte (« Mes branches tremblent. Tu as l’oreille
  // fine. »), elle tient : rien n'est coupé, donc pas de chevron (jsdom ne mesure pas de débordement).
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('foret-echauffement-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item.answer) }));
  expect(ligne().textContent).toBe('Mes branches tremblent. Tu as l’oreille fine.');
  expect(arene.querySelector('.arena-replique')).toHaveClass('repliee');
  expect(screen.queryByRole('button', { name: 'Toute la réplique' })).not.toBeInTheDocument();
});

it('la réplique repliée montre sa première phrase, le reste pour le lecteur d’écran, et le chevron l’ouvre (DA-34)', async () => {
  const { gardiens } = (await import('../univers/blocland')).BLOCLAND;
  const says: { hit: string } = gardiens.foret.guardianSays;
  // Le temps de ce test, une réplique de réussite en deux phrases, dont la première suffit à la ligne repliée.
  const avant = says.hit;
  says.hit = 'Mes branches tremblent jusqu’aux racines. Tu as l’oreille fine.';
  try {
    localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('foret') }));
    const user = (await import('@testing-library/user-event')).default.setup();
    renderAt('/aventure/foret/gardien');
    await loaded();
    const arene = screen.getByRole('region', { name: /L’arène du Gardien/ });
    const ligne = () => arene.querySelector('.arena-line')!;
    const { loadExercise } = await import('./exercises');
    const def = (await loadExercise('foret-echauffement-001'))!;
    const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
    const item = def.items.find((i) => prompt.includes(String(i.word)))!;
    await user.click(screen.getByRole('button', { name: String(item.answer) }));
    expect(arene.querySelector('.arena-replique')).toHaveClass('repliee');
    // À l'écran, la première phrase ; la suite, cachée, reste dans la page.
    const cachee = ligne().querySelector('.visually-hidden')!;
    expect(cachee.textContent).toBe(' Tu as l’oreille fine.');
    expect(ligne().textContent!.replace(cachee.textContent!, '')).toBe('Mes branches tremblent jusqu’aux racines.');
    const pli = screen.getByRole('button', { name: 'Toute la réplique' });
    expect(pli).toHaveAttribute('aria-expanded', 'false');
    expect(pli).toHaveAttribute('aria-controls', ligne().id);
    // Le pli l'ouvre en entier, et la referme.
    await user.click(pli);
    expect(pli).toHaveAttribute('aria-expanded', 'true');
    expect(arene.querySelector('.arena-replique')).not.toHaveClass('repliee');
    expect(ligne().querySelector('.visually-hidden')).toBeNull();
    expect(ligne().textContent).toBe('Mes branches tremblent jusqu’aux racines. Tu as l’oreille fine.');
    await user.click(pli);
    expect(arene.querySelector('.arena-replique')).toHaveClass('repliee');
  } finally {
    says.hit = avant;
  }
});
