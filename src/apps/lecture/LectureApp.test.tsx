import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../../core/SettingsContext';
import { ProgressProvider } from '../../core/ProgressContext';
import { TEXTS } from './data';
import LectureApp from './LectureApp';

/** Synthèse vocale simulée : on déclenche la fin de chaque énoncé à la main. */
function fakeSpeech() {
  const queue: { text: string; onend?: () => void }[] = [];
  class FakeUtterance {
    text: string;
    lang = '';
    rate = 1;
    voice: unknown = null;
    onend?: () => void;
    onerror?: () => void;
    constructor(text: string) {
      this.text = text;
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    speak: (u: FakeUtterance) => queue.push(u),
    cancel: () => {},
    getVoices: () => [],
  });
  return queue;
}

function renderApp() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <LectureApp />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

it('lit le texte vers par vers en surlignant la ligne lue', async () => {
  const queue = fakeSpeech();
  const user = userEvent.setup();
  renderApp();
  await user.click(screen.getByRole('button', { name: /Le Corbeau et le Renard/ }));
  await user.click(screen.getByRole('button', { name: /Écouter le texte/ }));

  expect(queue[0].text).toBe('Maître Corbeau, sur un arbre perché,');
  expect(screen.getByRole('button', { current: true })).toHaveTextContent('Maître Corbeau');

  act(() => queue[0].onend?.());
  expect(queue[1].text).toBe('Tenait en son bec un fromage.');
  expect(screen.getByRole('button', { current: true })).toHaveTextContent('fromage');

  await user.click(screen.getByRole('button', { name: /Arrêter/ }));
  act(() => queue[1].onend?.());
  expect(queue).toHaveLength(2);
  expect(screen.queryByRole('button', { current: true })).not.toBeInTheDocument();
});

it('enchaîne lecture, questions avec joker et résultat', async () => {
  const user = userEvent.setup();
  renderApp();
  const text = TEXTS.find((t) => t.id === 'chevre')!;
  await user.click(screen.getByRole('button', { name: /La chèvre de monsieur Seguin/ }));
  expect(screen.getByText('Mots difficiles')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /aux questions/ }));

  await user.click(screen.getByRole('button', { name: /Prendre un joker/ }));
  expect(screen.getByText(/Relis/)).toBeInTheDocument();

  for (let i = 0; i < text.questions.length; i++) {
    await user.click(screen.getByRole('button', { name: text.questions[i].answer }));
    await user.click(screen.getByRole('button', { name: i < 4 ? /Suivante/ : /Voir le résultat/ }));
  }
  // Joker à la première question : 4,5 points sur 5.
  expect(screen.getByText('90 %')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Autre texte/ }));
  expect(screen.getByRole('button', { name: /La chèvre de monsieur Seguin.*Record : 90 %/ })).toBeInTheDocument();
});
