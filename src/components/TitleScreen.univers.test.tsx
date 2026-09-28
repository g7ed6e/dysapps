import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TitleScreen } from './TitleScreen';
import { SettingsProvider } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';
import { MESSAGE_UNIVERS_KEY } from '../core/univers';

// La bascule du lot 6, essayée d'avance : `UNIVERS_OUVERT` vraie.
vi.mock('../core/univers', async (importOriginal) => ({ ...(await importOriginal<typeof import('../core/univers')>()), UNIVERS_OUVERT: true }));

function Where() {
  const { pathname, state } = useLocation();
  return <p data-testid="ici">{`${pathname} ${JSON.stringify(state)}`}</p>;
}

function renderTitle() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/']}>
        <TitleScreen />
        <Where />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

it('montre le nom de l’univers choisi : Archipéo sur un appareil neuf, sans message', async () => {
  const user = userEvent.setup();
  renderTitle();
  expect(screen.getByRole('dialog', { name: 'Archipéo' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('sur un appareil resté dans Blocland, dit une seule fois le message qui présente Archipéo', async () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  const user = userEvent.setup();
  const { unmount } = renderTitle();
  expect(screen.getByRole('dialog', { name: 'Blocland' })).toHaveTextContent('Chaque bloc construit ton monde.');
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.getByRole('dialog', { name: /Un nouvel univers : Archipéo/ })).toHaveTextContent('Tes étoiles, tes blocs, tes plans et tes missions restent les mêmes.');
  await user.click(screen.getByRole('button', { name: /Voir le réglage/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('ici')).toHaveTextContent('/reglages {"section":"univers"}');
  expect(loadJSON(MESSAGE_UNIVERS_KEY, {})).toEqual({ dit: true });
  unmount();
  // Au lancement suivant, plus de message.
  sessionStorage.clear();
  renderTitle();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('« Rester dans Blocland » va où l’élève allait, sans nouveau toucher', async () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  const user = userEvent.setup();
  renderTitle();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  await user.click(screen.getByRole('button', { name: /Rester dans Blocland/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(loadJSON(MESSAGE_UNIVERS_KEY, {})).toEqual({ dit: true });
});
