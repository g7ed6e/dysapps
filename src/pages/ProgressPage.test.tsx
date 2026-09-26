import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BloclandProvider } from '../blocland/BloclandContext';
import { exercisesOf } from '../blocland/exercises';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressPage } from './ProgressPage';

function renderPage() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={['/succes']}>
            <ProgressPage />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

const subject = (name: string) => screen.getByRole('region', { name });

it('montre la progression de chaque matière, et rien à reprendre au départ', () => {
  renderPage();
  for (const name of ['Français', 'Maths']) {
    const panel = subject(name);
    expect(within(panel).getByRole('progressbar', { name: `Étoiles en ${name}` })).toHaveAttribute('aria-valuenow', '0');
    expect(within(panel).getByText('Rien à reprendre pour l’instant.')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /Voir la matière/ })).toHaveAttribute('href', `/matiere/${name === 'Maths' ? 'maths' : 'francais'}`);
  }
  // Les succès sont toujours là.
  expect(screen.getByRole('heading', { name: /Succès \d+ \/ \d+/ })).toBeInTheDocument();
});

it('propose de reprendre les quêtes faibles d’une matière, avec un lien qui la relance', () => {
  const rimes = exercisesOf('foret', 'rimes')[0].id;
  const chasse = exercisesOf('foret', 'chasse-son')[0].id;
  localStorage.setItem(
    'dysapps:blocland',
    JSON.stringify({ progress: { [rimes]: { stars: 1, attempts: 2, best: 0.5 }, [chasse]: { stars: 3, attempts: 1, best: 1 } } }),
  );
  localStorage.setItem('dysapps:progress', JSON.stringify({ apps: { 'tables:niveau-1': { sessions: 1, bestScore: 40, lastPlayed: null } } }));
  renderPage();

  const francais = subject('Français');
  expect(within(francais).getByRole('progressbar')).toHaveAttribute('aria-valuetext', expect.stringMatching(/^4 étoiles sur \d+$/));
  const redo = within(francais).getAllByRole('link', { name: /^Reprendre/ });
  expect(redo).toHaveLength(1);
  expect(redo[0]).toHaveAccessibleName('Reprendre Rimes-échelle, Forêt des sons');
  expect(redo[0]).toHaveAttribute('href', '/aventure/foret/rimes');

  const maths = subject('Maths');
  // Une quête jamais jouée n'est pas « à reprendre ».
  expect(within(maths).queryByRole('link', { name: /Champ des tables/ })).not.toBeInTheDocument();
  expect(within(maths).getByRole('link', { name: /^Reprendre Tables/ })).toHaveAttribute('href', '/app/tables');
  expect(within(maths).getByText('Record : 40 %')).toBeInTheDocument();
});

it('montre les six rangs : Bronze en cours, les suivants grisés avec leur niveau', () => {
  renderPage();
  const ladder = screen.getByRole('list', { name: 'Rangs' });
  const ranks = within(ladder).getAllByRole('listitem');
  expect(ranks.map((r) => r.querySelector('strong')?.textContent)).toEqual(['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Légende']);
  expect(ranks[0]).toHaveAttribute('aria-current', 'step');
  expect(ranks[0]).toHaveTextContent('Bronze I');
  expect(ranks[1]).not.toHaveAttribute('aria-current');
  expect(ranks[1]).toHaveClass('locked');
  expect(ranks[1]).toHaveTextContent('à partir du niveau 4');
});
