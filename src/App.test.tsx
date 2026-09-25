import { render, screen } from '@testing-library/react';
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

it('affiche les matières sur l’accueil', () => {
  renderAt('/');
  expect(screen.getByRole('link', { name: /Français/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Maths/ })).toBeInTheDocument();
});

it('liste les activités d’une matière', () => {
  renderAt('/matiere/maths');
  expect(screen.getByText('Fractions')).toBeInTheDocument();
  // Les îles de maths de Blocland, avec leur classe ; la Plaine est ouverte, pas la Rivière.
  expect(screen.getByRole('link', { name: /Plaine des nombres.*Nouveau.*Niveau 6e/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Rivière des fractions.*Pont à construire/ })).toBeInTheDocument();
  expect(screen.queryByText(/Forêt des sons/)).not.toBeInTheDocument();
});

it('applique et sauvegarde les réglages', async () => {
  const user = userEvent.setup();
  renderAt('/reglages');
  await user.click(screen.getByLabelText('Nuit'));
  expect(document.documentElement.dataset.theme).toBe('nuit');
  expect(JSON.parse(localStorage.getItem('dysapps:settings')!).theme).toBe('nuit');
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
  expect(screen.getByText('Record : 90 %')).toBeInTheDocument();
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

it('surligne les syllabes en couleurs alternées quand le réglage est actif', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ syllables: true }));
  const { container } = renderAt('/aventure');
  const syllables = container.querySelectorAll('.syl');
  expect(syllables.length).toBeGreaterThan(10);
  expect(container.querySelectorAll('.syl-0').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.syl-1').length).toBeGreaterThan(0);
});
