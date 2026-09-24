import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsProvider } from '../core/SettingsContext';
import { ProgressProvider } from '../core/ProgressContext';
import { QuizSession, type Question } from './QuizSession';

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

  expect(screen.getByRole('heading', { name: 'Combien font 2 + 2 ?' })).toBeInTheDocument();

  // Première erreur : indice et nouvel essai
  await user.click(screen.getByRole('button', { name: '3' }));
  expect(screen.getByText(/Compte sur tes doigts/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /3/ })).toBeDisabled();

  // Bonne réponse au deuxième essai
  await user.click(screen.getByRole('button', { name: '4' }));
  expect(screen.getByText(/\+5 XP/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Question suivante' }));

  // Deux erreurs : la bonne réponse est montrée
  await user.click(screen.getByRole('button', { name: 'à' }));
  expect(screen.getByText('Verbe avoir.')).toBeInTheDocument();
  expect(screen.getByText(/La bonne réponse était\s«\sa\s»/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Voir mon bilan' }));
  expect(screen.getByRole('heading', { name: 'Bilan de la séance' })).toBeInTheDocument();
  expect(screen.getByText('25 %')).toBeInTheDocument();

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
  expect(screen.queryByRole('button', { name: /Un indice/ })).not.toBeInTheDocument();
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

  await user.click(screen.getByRole('button', { name: /Un indice/ }));
  expect(screen.getByText(/Remplace par « était »/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Un indice/ })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'est' }));
  expect(screen.getByText(/\+5 XP/)).toBeInTheDocument();
});

it('relit un message identique de Plume quand la lecture automatique est active', async () => {
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

  for (let i = 0; i < 2; i++) {
    await user.click(screen.getByRole('button', { name: 'oui' }));
    await user.click(screen.getByRole('button', { name: 'Question suivante' }));
  }
  expect(spoken.filter((t) => t.startsWith('Question suivante'))).toHaveLength(2);
  vi.unstubAllGlobals();
});
