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
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByText('Le Grand Chêne')).toBeInTheDocument();
  expect(screen.getByText(/2 étoiles dans : Abattage syllabique, Chasse au son, Rimes-échelle/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Le Grand Chêne/ })).not.toBeInTheDocument();
});

it('sans les étoiles, le Gardien refuse et renvoie aux missions', async () => {
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(screen.getByRole('heading', { name: /Grand Chêne/ })).toBeInTheDocument();
  // Ce qu'il attend, jamais ce qui manque (GD-8).
  expect(document.body.textContent).toMatch(/Le Grand Chêne attend son défi : 2 étoiles dans/);
  expect(document.body.textContent).not.toMatch(/manque/);
  expect(screen.getByRole('link', { name: /Voir les missions/ })).toBeInTheDocument();
});

it('avec les étoiles, le défi démarre : première épreuve avec l’écran de sa mission', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByRole('link', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(screen.getByText(/Prêt à rallumer/)).toBeInTheDocument();
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(screen.getAllByText(/Épreuve : Abattage syllabique/).length).toBeGreaterThan(0);
  // Le défi (GD-8) : le Gardien, éteint, et la jauge des épreuves réussies, vide au départ.
  expect(screen.getByRole('region', { name: /Rallumer le Grand Chêne/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Le Grand Chêne, le Gardien/ })).toBeInTheDocument();
  const gauge = screen.getByRole('progressbar', { name: /Épreuves réussies/ });
  expect(gauge).toHaveAttribute('aria-valuenow', '0');
  // L'écran de la manche est celui de la mission : un QCM de syllabes.
  expect(screen.getByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
});

it('devant « Épreuve », la flamme du Gardien à rallumer, dans les deux univers (DA-8, GD-8)', async () => {
  const icone = () => screen.getAllByText(/Épreuve : /)[0].querySelector('svg')?.getAttribute('class') ?? '';
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  const blocland = renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(icone()).toMatch(/flame/);
  blocland.unmount();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(icone()).toMatch(/flame/);
  expect(icone()).not.toMatch(/shield/);
});

it('à chaque épreuve réussie, la jauge monte et le Gardien reprend une part de ses couleurs (GD-8)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  const gauge = () => screen.getByRole('progressbar', { name: /Épreuves réussies/ });
  // Première épreuve : un QCM de syllabes, on répond juste (la bonne réponse est dans les données de l'exercice).
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('french-6e-phonology-syllables-warmup-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item.answer) }));
  expect(gauge()).toHaveAttribute('aria-valuenow', '1');
  expect(document.body.textContent).toMatch(/Un bloc de mon écorce reprend sa couleur/);
});

it('un Gardien déjà rallumé reste ouvert à un nouveau défi, même si une mission de son île n’a pas encore d’étoile', async () => {
  // La victoire, puis une mission sans étoile (comme une mission arrivée après coup sur l'île).
  const progress = { ...ready('french-6e-phonology'), 'french-6e-phonology-challenge': { stars: 2, attempts: 1, best: 0.9 } } as Record<string, unknown>;
  delete progress[exercisesOf('french-6e-phonology', 'rhymes')[0].id];
  localStorage.setItem('dysapps:game', JSON.stringify({ progress }));
  renderAt('/adventure/french-6e-phonology');
  expect(screen.getByRole('link', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  localStorage.setItem('dysapps:game', JSON.stringify({ progress }));
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  expect(document.body.textContent).not.toMatch(/attend son défi/);
  expect(screen.getAllByText(/Épreuve : /).length).toBeGreaterThan(0);
}, 30_000);

it('le nom du Gardien une seule fois, et sa réplique entière au lancement puis repliée en une ligne (DA-34)', async () => {
  localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
  const user = (await import('@testing-library/user-event')).default.setup();
  renderAt('/adventure/french-6e-phonology/challenge');
  await loaded();
  const arene = screen.getByRole('region', { name: /Rallumer le Grand Chêne/ });
  // Le nom dans le titre de l'écran, pas répété dans l'arène.
  expect(screen.getByRole('heading', { level: 1, name: /Rallumer le Grand Chêne/ })).toBeInTheDocument();
  expect(arene.querySelector('.arena-name')).toBeNull();
  expect(Array.from(arene.querySelectorAll('p')).some((p) => p.textContent === 'Le Grand Chêne')).toBe(false);
  // Au lancement : la réplique entière, sans pli.
  const ligne = () => arene.querySelector('.arena-line')!;
  expect(ligne().textContent).toMatch(/Le Grand Chêne/);
  expect(arene.querySelector('.arena-replique')).not.toHaveClass('repliee');
  expect(screen.queryByRole('button', { name: 'Toute la réplique' })).not.toBeInTheDocument();
  // Une épreuve jouée : la nouvelle réplique, repliée en une ligne. Elle a plus d'une phrase (« Crac ! … ») : la suite
  // est coupée, donc le chevron l'ouvre (jsdom ne mesure pas de débordement).
  const { loadExercise } = await import('./exercises');
  const def = (await loadExercise('french-6e-phonology-syllables-warmup-001'))!;
  const prompt = screen.getByRole('group', { name: 'Réponses possibles' }).parentElement!.textContent ?? '';
  const item = def.items.find((i) => prompt.includes(String(i.word)))!;
  await user.click(screen.getByRole('button', { name: String(item.answer) }));
  expect(ligne().textContent).toBe('Crac ! Un bloc de mon écorce reprend sa couleur. Tu as l’oreille fine.');
  expect(arene.querySelector('.arena-replique')).toHaveClass('repliee');
  expect(screen.getByRole('button', { name: 'Toute la réplique' })).toBeInTheDocument();
});

it('la réplique repliée montre sa première phrase, le reste pour le lecteur d’écran, et le chevron l’ouvre (DA-34)', async () => {
  const { gardiens } = (await import('../univers/blocland')).BLOCLAND;
  const says: { hit: string } = gardiens['french-6e-phonology'].guardianSays;
  // Le temps de ce test, une réplique de réussite en deux phrases, dont la première suffit à la ligne repliée.
  const avant = says.hit;
  says.hit = 'Mes branches tremblent jusqu’aux racines. Tu as l’oreille fine.';
  try {
    localStorage.setItem('dysapps:game', JSON.stringify({ progress: ready('french-6e-phonology') }));
    const user = (await import('@testing-library/user-event')).default.setup();
    renderAt('/adventure/french-6e-phonology/challenge');
    await loaded();
    const arene = screen.getByRole('region', { name: /Rallumer le Grand Chêne/ });
    const ligne = () => arene.querySelector('.arena-line')!;
    const { loadExercise } = await import('./exercises');
    const def = (await loadExercise('french-6e-phonology-syllables-warmup-001'))!;
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
