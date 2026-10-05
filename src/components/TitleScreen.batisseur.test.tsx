import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TitleScreen } from './TitleScreen';
import { BandeauBatisseur } from './BandeauBatisseur';
import { BloclandProvider, useBlocland } from '../game/BloclandContext';
import { BLOCS_DU_BATISSEUR } from '../game/batisseur';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { degelerSauvegarde, saveJSON } from '../core/storage';

function Inventaire() {
  const { state } = useBlocland();
  return <p data-testid="bois">{state.stock['french-6e-phonology'] ?? 0}</p>;
}

function renderTitle() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <BandeauBatisseur />
            <TitleScreen />
            <Inventaire />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  degelerSauvegarde();
});
afterEach(() => degelerSauvegarde());

const FLECHES = '{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}{ArrowLeft}{ArrowRight}{ArrowLeft}{ArrowRight}';

it('au clavier, la suite ouvre le mode bâtisseur sans toucher la sauvegarde', async () => {
  saveJSON('game', { stock: { 'french-6e-phonology': 3 } });
  const user = userEvent.setup();
  renderTitle();
  const avant = localStorage.getItem('dysapps:game');
  expect(avant).toContain('"french-6e-phonology":3');
  expect(screen.getByTestId('bois')).toHaveTextContent('3');
  await user.keyboard(`${FLECHES}ba`);
  expect(screen.getByTestId('bois')).toHaveTextContent(String(BLOCS_DU_BATISSEUR));
  expect(screen.getAllByText('Mode bâtisseur : ta partie n’est pas enregistrée.')).toHaveLength(2);
  expect(screen.getByRole('button', { name: /Quitter/ })).toBeInTheDocument();
  expect(localStorage.getItem('dysapps:game')).toBe(avant);
});

it('une suite de travers ne fait rien', async () => {
  const user = userEvent.setup();
  renderTitle();
  await user.keyboard(`${FLECHES}ab`);
  expect(screen.queryByRole('button', { name: /Quitter/ })).not.toBeInTheDocument();
});

it('au doigt, huit glissements sur le logo puis deux touchers', () => {
  const { container } = renderTitle();
  const logo = container.querySelector('.title-logo')!;
  const glisser = (dx: number, dy: number) => {
    fireEvent.pointerDown(logo, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(logo, { clientX: 100 + dx, clientY: 100 + dy });
  };
  for (const [dx, dy] of [[0, -80], [0, -80], [0, 80], [0, 80], [-80, 0], [80, 0], [-80, 0], [80, 0], [0, 0], [0, 0]]) glisser(dx, dy);
  expect(screen.getByTestId('bois')).toHaveTextContent(String(BLOCS_DU_BATISSEUR));
});

it('le toucher du logo ne fait pas défiler ni recharger la page', () => {
  const { container } = renderTitle();
  const logo = container.querySelector('.title-logo')!;
  for (const type of ['touchstart', 'touchmove']) {
    const toucher = new Event(type, { bubbles: true, cancelable: true });
    logo.dispatchEvent(toucher);
    expect(toucher.defaultPrevented).toBe(true);
  }
});

it('au doigt, sans glisser : toucher les bords du logo puis deux fois son centre', () => {
  const { container } = renderTitle();
  const logo = container.querySelector('.title-logo')!;
  logo.getBoundingClientRect = () => ({ left: 0, top: 0, width: 160, height: 160, right: 160, bottom: 160, x: 0, y: 0, toJSON: () => ({}) });
  const toucher = (x: number, y: number) => {
    fireEvent.pointerDown(logo, { clientX: x, clientY: y });
    fireEvent.pointerUp(logo, { clientX: x, clientY: y });
  };
  for (const [x, y] of [[80, 10], [80, 10], [80, 150], [80, 150], [10, 80], [150, 80], [10, 80], [150, 80], [80, 80], [80, 80]]) toucher(x, y);
  expect(screen.getByTestId('bois')).toHaveTextContent(String(BLOCS_DU_BATISSEUR));
});

it('la croix masque le bandeau', async () => {
  const user = userEvent.setup();
  renderTitle();
  await user.keyboard(`${FLECHES}ba`);
  document.body.insertAdjacentHTML('beforeend', '<main id="contenu" tabindex="-1"></main>');
  await user.click(screen.getByRole('button', { name: 'Masquer ce bandeau' }));
  expect(document.getElementById('contenu')).toHaveFocus();
  document.getElementById('contenu')?.remove();
  expect(screen.queryByRole('button', { name: /Quitter/ })).not.toBeInTheDocument();
  expect(screen.getByTestId('bois')).toHaveTextContent(String(BLOCS_DU_BATISSEUR));
});
