import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './App';
import { SettingsProvider } from './core/SettingsContext';
import { ProgressProvider } from './core/ProgressContext';
import { BloclandProvider } from './blocland/BloclandContext';
import { TitleScreen } from './components/TitleScreen';
import { rememberPlace } from './core/lastPlace';

// Un appareil qui sait dessiner le monde, et un monde factice (le vrai est testé à part).
vi.mock('./blocland/useImmersive', () => ({ useImmersive: () => true }));
vi.mock('./blocland/WorldPage', () => ({ WorldPage: () => <p>Le village</p> }));

function Where() {
  return <p data-testid="adresse">{useLocation().pathname}</p>;
}

function renderAt(path: string, title = false) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
            {title && <TitleScreen />}
            <Where />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => sessionStorage.clear());

it('l’appli s’ouvre sur le village ; l’ancienne adresse de l’Accueil ouvre le menu du village', () => {
  renderAt('/');
  expect(screen.getByText('Le village')).toBeInTheDocument();
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure');
  document.body.innerHTML = '';
  renderAt('/menu');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure/menu');
  expect(screen.queryByRole('navigation', { name: 'Menu principal' })).not.toBeInTheDocument();
});

it('l’ancien réglage « Au démarrage : le menu » n’ouvre plus l’Accueil : le village', () => {
  localStorage.setItem('dysapps:settings', JSON.stringify({ startIn: 'menu' }));
  renderAt('/');
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure');
});

it('l’écran titre garde « Ma dernière mission » alors que l’accueil a déjà mené au village', () => {
  rememberPlace({ path: '/app/tables', label: 'Tables & calcul mental' });
  renderAt('/', true);
  expect(screen.getByTestId('adresse')).toHaveTextContent('/adventure');
  expect(screen.getByRole('button', { name: 'Ma dernière mission : Tables & calcul mental' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Jouer/ })).toBeInTheDocument();
});
