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

it('la page du biome montre le Gardien verrouillé, puis prêt quand chaque quête a deux étoiles', () => {
  renderAt('/aventure/foret');
  expect(screen.getByText('Le Grand Chêne')).toBeInTheDocument();
  expect(screen.getByText(/2 étoiles dans : Abattage syllabique, Chasse au son, Rimes-échelle/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Le Grand Chêne/ })).not.toBeInTheDocument();
});

it('sans les étoiles, le Gardien refuse et renvoie aux quêtes', async () => {
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(screen.getByRole('heading', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(document.body.textContent).toMatch(/Il te manque encore des étoiles/);
  expect(screen.getByRole('link', { name: /Voir les quêtes/ })).toBeInTheDocument();
});

it('avec les étoiles, le défi démarre : première épreuve avec l’écran de sa quête', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /Le Grand Chêne/ })).toBeInTheDocument();
  expect(screen.getByText(/Prêt à t’affronter/)).toBeInTheDocument();
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret/gardien');
  await loaded();
  expect(screen.getAllByText(/Épreuve : Abattage syllabique/).length).toBeGreaterThan(0);
  // L'arène : le Gardien et sa jauge de résistance, pleine au départ.
  expect(screen.getByRole('region', { name: /L’arène du Gardien/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /Le Grand Chêne, le Gardien/ })).toBeInTheDocument();
  const gauge = screen.getByRole('progressbar', { name: /Résistance du Gardien/ });
  expect(gauge).toHaveAttribute('aria-valuenow', gauge.getAttribute('aria-valuemax'));
  // L'écran de la manche est celui de la quête : un QCM de syllabes.
  expect(screen.getByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
});

it('à chaque épreuve, la résistance du Gardien baisse et il réagit', async () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
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
