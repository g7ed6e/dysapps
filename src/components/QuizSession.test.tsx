import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { QuizSession, type Question } from './QuizSession';
import { Celebrations } from './Celebrations';
import { BloclandProvider } from '../game/BloclandContext';

const questions: Question[] = [
  { id: 'q1', prompt: 'Combien font 2 + 2 ?', choices: ['3', '4', '5'], answer: '4', hint: 'Compte sur tes doigts.' },
  { id: 'q2', prompt: 'Complète : « Il … faim. »', choices: ['a', 'à'], answer: 'a', explanation: 'Verbe avoir.' },
];

function renderQuiz() {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => questions} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
}

it('donne un indice, puis corrige, puis affiche le bilan', async () => {
  const user = userEvent.setup();
  renderQuiz();

  expect(screen.getByRole('heading', { name: /^Combien font 2 \+ 2\s\?$/ })).toBeInTheDocument();

  // Première erreur : indice et nouvel essai
  await user.click(screen.getByRole('button', { name: '3' }));
  expect(screen.getByText(/Compte sur tes doigts/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /3/ })).toBeDisabled();

  // Bonne réponse au deuxième essai
  await user.click(screen.getByRole('button', { name: '4' }));
  expect(screen.getByText(/\+5 XP/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Suivante/ }));

  // Deux erreurs : la bonne réponse est montrée
  await user.click(screen.getByRole('button', { name: 'à' }));
  expect(screen.getByText('Verbe avoir.')).toBeInTheDocument();
  expect(screen.getByText(/La bonne réponse\s:\s«\sa\s»/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Voir le résultat/ }));
  expect(screen.getByRole('heading', { name: 'Résultat' })).toBeInTheDocument();
  // 0,5 point sur 2 : une étoile ; aucune du premier coup, une trouvée au deuxième essai.
  expect(screen.getByText('0 sur 2 du premier coup')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '1 étoile sur 3' })).toBeInTheDocument();

  const saved = JSON.parse(localStorage.getItem('dysapps:progress')!);
  expect(saved.apps.test.bestScore).toBe(25);
  expect(saved.totalAnswers).toBe(2);
});

it('n’affiche pas de bouton d’indice sans indice', () => {
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => [questions[1], { ...questions[1], id: 'q3' }]} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );

  // Pas d'indice défini pour cette question : pas de bouton
  expect(screen.queryByRole('button', { name: /Prendre un joker/ })).not.toBeInTheDocument();
});

it('affiche l’indice sur demande et compte la réponse comme un second essai', async () => {
  const user = userEvent.setup();
  const binary: Question = { id: 'b', prompt: 'Complète : « Il … là. »', choices: ['est', 'et'], answer: 'est', hint: 'Remplace par « était ».' };
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => [binary]} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );

  await user.click(screen.getByRole('button', { name: /Prendre un joker/ }));
  expect(screen.getByText(/Remplace par « était »/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Prendre un joker/ })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'est' }));
  expect(screen.getByText(/\+5 XP/)).toBeInTheDocument();
});

it('relit un message identique quand la lecture automatique est active', async () => {
  const spoken: string[] = [];
  class FakeUtterance {
    text: string;
    lang = '';
    rate = 1;
    voice: unknown = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    speak: (u: FakeUtterance) => spoken.push(u.text),
    cancel: () => {},
    getVoices: () => [],
  });
  localStorage.setItem('dysapps:settings', JSON.stringify({ autoRead: true }));

  const user = userEvent.setup();
  const qs: Question[] = ['q1', 'q2', 'q3'].map((id) => ({ id, prompt: `Question ${id}`, choices: ['oui', 'non'], answer: 'oui' }));
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => qs} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );

  // Deux erreurs de suite : la même correction doit être relue à chaque fois.
  for (let i = 0; i < 2; i++) {
    await user.click(screen.getByRole('button', { name: 'non' }));
    await user.click(screen.getByRole('button', { name: /Suivante/ }));
  }
  expect(spoken.filter((t) => t.startsWith('Pas cette fois'))).toHaveLength(2);
  vi.unstubAllGlobals();
});

it('affiche le résultat et le bouton pour continuer dans le bandeau fixé en bas', async () => {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => questions} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  expect(screen.queryByRole('region', { name: 'Résultat de la question' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '4' }));
  const sheet = screen.getByRole('region', { name: 'Résultat de la question' });
  expect(within(sheet).getByRole('button', { name: /Suivante/ })).toHaveFocus();
  expect(within(sheet).getByText(/\+10 XP/)).toBeInTheDocument();
});

it('garde les succès gagnés pendant la partie pour le bilan : rien ne tombe sur la question', async () => {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <Celebrations />
          <QuizSession appId="test" makeQuestions={() => questions} />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  // Première réponse : le succès « Échauffement » est gagné, mais pas affiché.
  await user.click(screen.getByRole('button', { name: '4' }));
  expect(screen.queryByText('Succès débloqué')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Suivante/ }));
  await user.click(screen.getByRole('button', { name: 'a' }));
  await user.click(screen.getByRole('button', { name: /Voir le résultat/ }));
  // Au bilan, il apparaît.
  expect(screen.getAllByText('Succès débloqué').length).toBeGreaterThan(0);
  expect(screen.getByText('Échauffement')).toBeInTheDocument();
});

it('se joue au clavier : 1 à 9 pour répondre, Entrée pour la suite', async () => {
  const user = userEvent.setup();
  renderQuiz();
  // « 2 » : la deuxième réponse (4), juste.
  await user.keyboard('2');
  expect(screen.getByText(/\+10 XP/)).toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(screen.getByText('Question 2 / 2')).toBeInTheDocument();
});

it('à la fin, la suite logique vient en premier : « Mission suivante », puis Rejouer', async () => {
  const user = userEvent.setup();
  const go = vi.fn();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter>
          <QuizSession appId="test" makeQuestions={() => [questions[1]]} next={{ label: 'Mission suivante : Comparer', go }} onExit={() => {}} exitLabel="Changer de mission" />
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'a' }));
  await user.click(screen.getByRole('button', { name: /Voir le résultat/ }));
  const actions = screen.getAllByRole('button').map((b) => b.textContent?.trim());
  expect(actions.slice(0, 3)).toEqual(['Mission suivante : Comparer', 'Rejouer', 'Changer de mission']);
  await user.click(screen.getByRole('button', { name: /Mission suivante/ }));
  expect(go).toHaveBeenCalled();
});

it('vibre brièvement à la bonne réponse, sauf si le réglage est coupé', async () => {
  const vibrate = vi.fn();
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
  const user = userEvent.setup();
  const { unmount } = renderQuiz();
  await user.click(screen.getByRole('button', { name: '3' }));
  expect(vibrate).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '4' }));
  expect(vibrate).toHaveBeenCalledWith(25);
  unmount();
  vibrate.mockClear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ haptics: false }));
  renderQuiz();
  await user.click(screen.getByRole('button', { name: '4' }));
  expect(vibrate).not.toHaveBeenCalled();
  delete (navigator as { vibrate?: unknown }).vibrate;
});

it('à l’école du village, une mission finie donne des blocs de son île pour le village', async () => {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>
          <MemoryRouter>
            <QuizSession appId="test" makeQuestions={() => questions} />
          </MemoryRouter>
        </BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>,
  );
  await user.click(screen.getByRole('button', { name: '4' }));
  await user.click(screen.getByRole('button', { name: /Suivante/ }));
  await user.click(screen.getByRole('button', { name: 'a' }));
  await user.click(screen.getByRole('button', { name: /Voir le résultat/ }));
  // Sans faute la première fois : 4 blocs, +2 pour trois étoiles, +2 la première fois.
  expect(screen.getByText(/pour le village/).closest('p')).toHaveTextContent('+8 blocs de bois pour le village (école de Forêt des sons)');
  expect(JSON.parse(localStorage.getItem('dysapps:game')!).stock['french-6e-phonology']).toBe(8);
});
