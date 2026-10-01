import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BloclandProvider } from '../blocland/BloclandContext';
import { exercisesOf } from '../blocland/exercises';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressPage } from './ProgressPage';

afterEach(() => localStorage.clear());

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
  const slugs: Record<string, string> = { Français: 'francais', Maths: 'maths', Anglais: 'anglais' };
  for (const name of Object.keys(slugs)) {
    const panel = subject(name);
    expect(within(panel).getByRole('progressbar', { name: `Étoiles en ${name}` })).toHaveAttribute('aria-valuenow', '0');
    expect(within(panel).getByText('Rien à reprendre pour l’instant.')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /Voir la matière/ })).toHaveAttribute('href', `/matiere/${slugs[name]}`);
  }
  // Les succès sont toujours là.
  expect(screen.getByRole('heading', { name: /Succès \d+ \/ \d+/ })).toBeInTheDocument();
});

it('propose de reprendre les missions faibles d’une matière, avec un lien qui la relance', () => {
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
  // Une mission jamais jouée n'est pas « à reprendre ».
  expect(within(maths).queryByRole('link', { name: /Champ des tables/ })).not.toBeInTheDocument();
  expect(within(maths).getByRole('link', { name: /^Reprendre Tables/ })).toHaveAttribute('href', '/app/tables');
  expect(within(maths).getByRole('img', { name: 'Record : 1 étoile sur 3' })).toBeInTheDocument();
});

it('montre les cinq rôles de Blocland : Apprenti en cours, les suivants à venir avec leur niveau', () => {
  renderPage();
  const ladder = screen.getByRole('list', { name: 'Rôles' });
  const roles = within(ladder).getAllByRole('listitem');
  expect(roles.map((r) => r.querySelector('strong')?.textContent)).toEqual(['Apprenti', 'Maçon', 'Mécanicien', 'Ingénieur', 'Architecte']);
  expect(roles[0]).toHaveAttribute('aria-current', 'step');
  expect(roles[0]).toHaveTextContent('ton rôle actuel, niveau 1');
  expect(roles[1]).not.toHaveAttribute('aria-current');
  expect(roles[1]).toHaveClass('locked');
  expect(roles[1]).toHaveTextContent('à partir du niveau 4');
});

it('dans Blocland, les succès de rôle nomment les métiers et les expliquent ; dans Archipéo, les rôles d’avant', () => {
  renderPage();
  const badges = () => screen.getAllByRole('listitem').filter((li) => li.classList.contains('badge'));
  expect(badges().find((b) => b.textContent?.includes('Devenir Maçon'))).toHaveTextContent('MaçonDevenir Maçon : tu poses les blocs bien droits.');
  expect(document.body.textContent).not.toMatch(/Cartographe|Navigateur/);
  cleanup();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo' }));
  renderPage();
  const roles = within(screen.getByRole('list', { name: 'Rôles' })).getAllByRole('listitem');
  expect(roles.map((r) => r.querySelector('strong')?.textContent)).toEqual(['Explorateur', 'Cartographe', 'Bâtisseur', 'Navigateur', 'Architecte de l’archipel']);
  expect(badges().find((b) => b.textContent?.includes('Devenir Cartographe'))).toHaveTextContent('CartographeDevenir Cartographe.');
});
