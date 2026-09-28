import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TitleScreen } from './TitleScreen';
import { SettingsProvider } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';
import { MESSAGE_UNIVERS_KEY } from '../core/univers';

// L'écran titre voit le message unique rallumé (`PRESENTER_ARCHIPEO`) ; le premier univers, lui, garde la constante du
// module : il ne note jamais le message.
vi.mock('../core/univers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../core/univers')>()),
  PRESENTER_ARCHIPEO: true,
}));

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

it('montre le nom de l’univers choisi : Blocland sur un appareil neuf, sans message', async () => {
  const user = userEvent.setup();
  renderTitle();
  expect(screen.getByRole('dialog', { name: 'Blocland' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('sur un appareil qui a une progression, ne présente pas Archipéo : il n’est pas mis en avant', async () => {
  saveJSON('progress', { xp: 40, totalAnswers: 10 });
  const user = userEvent.setup();
  renderTitle();
  expect(screen.getByRole('dialog', { name: 'Blocland' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

// Le message unique, éteint (`PRESENTER_ARCHIPEO`) : noté à dire comme s'il était rallumé.
it('rallumé, dit une seule fois le message qui présente Archipéo', async () => {
  saveJSON(MESSAGE_UNIVERS_KEY, { dit: false });
  const user = userEvent.setup();
  const { unmount } = renderTitle();
  expect(screen.getByRole('dialog', { name: 'Blocland' })).toHaveTextContent('Chaque bloc construit ton monde.');
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.getByRole('dialog', { name: /Un nouvel univers\s:\sArchipéo/ })).toHaveTextContent('Tes étoiles, tes blocs, tes plans et tes missions restent les mêmes.');
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

it('rallumé, « Rester dans Blocland » va où l’élève allait, sans nouveau toucher', async () => {
  saveJSON(MESSAGE_UNIVERS_KEY, { dit: false });
  const user = userEvent.setup();
  renderTitle();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  await user.click(screen.getByRole('button', { name: /Rester dans Blocland/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(loadJSON(MESSAGE_UNIVERS_KEY, {})).toEqual({ dit: true });
});
