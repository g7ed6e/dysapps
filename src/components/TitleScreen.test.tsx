import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TitleScreen } from './TitleScreen';
import { rememberPlace } from '../core/lastPlace';
import { SettingsProvider } from '../core/SettingsContext';

function Where() {
  return <p data-testid="ici">{useLocation().pathname}</p>;
}

function renderTitle(path = '/') {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <TitleScreen />
        <Where />
      </MemoryRouter>
    </SettingsProvider>,
  );
}

beforeEach(() => sessionStorage.clear());

it('s’ouvre au lancement ; « Jouer » débloque la voix et ne revient plus de la séance', async () => {
  const speak = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak, cancel: vi.fn(), speaking: false, getVoices: () => [] } });
  vi.stubGlobal('SpeechSynthesisUtterance', class { volume = 1; constructor(public text: string) {} });
  const user = userEvent.setup();
  const { unmount } = renderTitle();
  expect(screen.getByRole('dialog', { name: 'Blocland' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Jouer/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  // Une phrase vide et silencieuse, dite pendant le toucher : la voix est débloquée.
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ volume: 0 }));
  unmount();
  renderTitle();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  vi.unstubAllGlobals();
  delete (window as { speechSynthesis?: unknown }).speechSynthesis;
});

it('propose « Ma dernière mission » vers la dernière mission ouverte', async () => {
  rememberPlace({ path: '/adventure/foret/abattage', label: 'Abattage syllabique · Forêt des sons' });
  const user = userEvent.setup();
  renderTitle();
  await user.click(screen.getByRole('button', { name: 'Ma dernière mission : Abattage syllabique · Forêt des sons' }));
  expect(screen.getByTestId('ici')).toHaveTextContent('/adventure/foret/abattage');
});

it('ouvert sur un lien direct, il ne propose pas de repartir ailleurs', () => {
  rememberPlace({ path: '/app/tables', label: 'Tables & calcul mental' });
  renderTitle('/app/fractions');
  expect(screen.queryByRole('button', { name: /Ma dernière mission/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Jouer/ })).toBeInTheDocument();
});
