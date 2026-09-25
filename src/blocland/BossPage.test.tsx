import { render, screen } from '@testing-library/react';
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

function ready(biomeId: string) {
  const biome = getBiome(biomeId)!;
  const progress: Record<string, unknown> = {};
  for (const type of typesWithContent(biome)) progress[exercisesOf(biome.id, type)[0].id] = { stars: 2, attempts: 1, best: 0.8 };
  return progress;
}

it('la page du biome montre le Gardien verrouillé, puis prêt quand chaque quête a deux étoiles', () => {
  renderAt('/aventure/foret');
  expect(screen.getByText('le Grand Chêne')).toBeInTheDocument();
  expect(screen.getByText(/2 étoiles dans : Abattage syllabique, Chasse au son, Rimes-échelle/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /le Grand Chêne/ })).not.toBeInTheDocument();
});

it('sans les étoiles, le Gardien refuse et renvoie aux quêtes', () => {
  renderAt('/aventure/foret/gardien');
  expect(screen.getByRole('heading', { name: /le Grand Chêne/ })).toBeInTheDocument();
  expect(document.body.textContent).toMatch(/Il te manque encore des étoiles/);
  expect(screen.getByRole('link', { name: /Voir les quêtes/ })).toBeInTheDocument();
});

it('avec les étoiles, le défi démarre : première épreuve avec l’écran de sa quête', () => {
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret');
  expect(screen.getByRole('link', { name: /le Grand Chêne/ })).toBeInTheDocument();
  expect(screen.getByText(/Prêt à t’affronter/)).toBeInTheDocument();
  localStorage.setItem('dysapps:blocland', JSON.stringify({ progress: ready('foret') }));
  renderAt('/aventure/foret/gardien');
  expect(screen.getAllByText(/Épreuve : Abattage syllabique/).length).toBeGreaterThan(0);
  // L'écran de la manche est celui de la quête : un QCM de syllabes.
  expect(screen.getByRole('group', { name: 'Réponses possibles' })).toBeInTheDocument();
});
