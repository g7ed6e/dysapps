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
