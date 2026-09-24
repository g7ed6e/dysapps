import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { Mascot, type MascotMood } from './Mascot';
import { SpeakButton } from './SpeakButton';

export interface Question {
  id: string;
  /** Consigne ou énoncé, lu à voix haute sur demande. */
  prompt: string;
  choices: string[];
  answer: string;
  /** Indice proposé sur demande, ou après une première erreur. */
  hint?: string;
  /** Explication affichée une fois la question terminée. */
  explanation?: string;
}

interface Props {
  appId: string;
  /** Génère les questions d'une séance (appelé à chaque nouvelle séance). */
  makeQuestions: () => Question[];
  /** Nombre d'essais par question (2 par défaut : un essai + un essai avec indice). */
  maxAttempts?: number;
}

type Phase = 'question' | 'resolved' | 'summary';

const PRAISE = ['Bravo !', 'Super, c’est juste !', 'Excellent !', 'Bien joué !', 'Parfait !'];

/**
 * Moteur de séance d'exercices à choix, sans chronomètre.
 * L'erreur fait partie de l'apprentissage : un indice est donné avant la correction.
 */
export function QuizSession({ appId, makeQuestions, maxAttempts = 2 }: Props) {
  const { answer, completeSession } = useProgress();
  const [questions, setQuestions] = useState(makeQuestions);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [phase, setPhase] = useState<Phase>('question');
  const [points, setPoints] = useState(0); // 1 au premier essai, 0,5 ensuite
  const [xpGained, setXpGained] = useState(0);
  const [mascot, setMascotState] = useState<{ message: string; mood: MascotMood; key: number }>({
    message: 'Prends ton temps, il n’y a pas de chrono. Tu peux écouter la consigne avec le haut-parleur.',
    mood: 'content',
    key: 0,
  });
  // La clé change à chaque intervention de Plume : un message identique est donc relu.
  const setMascot = (next: { message: string; mood: MascotMood }) =>
    setMascotState((prev) => ({ ...next, key: prev.key + 1 }));

  const question = questions[index];
  const finalScore = useMemo(() => Math.round((points / questions.length) * 100), [points, questions.length]);

  const choose = (choice: string) => {
    if (phase !== 'question' || wrongChoices.includes(choice)) return;
    const correct = choice === question.answer;
    // Utiliser l'indice compte comme un second essai (moins de points, aucune autre pénalité).
    const effectiveAttempt = hintUsed ? Math.max(attempt, 2) : attempt;

    if (correct) {
      const update = answer(true, effectiveAttempt);
      setXpGained((x) => x + update.xpGained);
      setPoints((p) => p + (effectiveAttempt === 1 ? 1 : 0.5));
      setPhase('resolved');
      setMascot({ message: `${PRAISE[index % PRAISE.length]} +${update.xpGained} XP`, mood: 'bravo' });
      return;
    }

    setWrongChoices((w) => [...w, choice]);
    // Avec 2 choix, un second essai donnerait la réponse à coup sûr : on corrige directement.
    const attemptsAllowed = Math.min(maxAttempts, question.choices.length - 1);
    if (attempt < attemptsAllowed) {
      setAttempt((a) => a + 1);
      setMascot({
        message: question.hint ? `Pas tout à fait. Un indice : ${question.hint}` : 'Pas tout à fait, essaie encore !',
        mood: 'reflechit',
      });
      if (question.hint) setHintUsed(true);
      return;
    }

    const update = answer(false, effectiveAttempt);
    setXpGained((x) => x + update.xpGained);
    setPhase('resolved');
    setMascot({
      message: `La bonne réponse était « ${question.answer} ». Ce n’est pas grave, tu vas y arriver ! +${update.xpGained} XP pour l’effort.`,
      mood: 'encourage',
    });
  };

  const showHint = () => {
    if (!question.hint) return;
    setHintUsed(true);
    setMascot({ message: `Indice : ${question.hint}`, mood: 'reflechit' });
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAttempt(1);
      setWrongChoices([]);
      setHintUsed(false);
      setPhase('question');
      setMascot({ message: 'Question suivante ! Prends ton temps.', mood: 'content' });
      return;
    }
    const update = completeSession(appId, finalScore);
    setXpGained((x) => x + update.xpGained);
    setPhase('summary');
    setMascot({
      message:
        finalScore === 100
          ? 'Séance parfaite ! Je suis fière de toi !'
          : finalScore >= 60
            ? 'Belle séance, tu progresses !'
            : 'Tu as terminé la séance, c’est ça le plus important. On recommence quand tu veux !',
      mood: 'bravo',
    });
  };

  const restart = () => {
    setQuestions(makeQuestions());
    setIndex(0);
    setAttempt(1);
    setWrongChoices([]);
    setHintUsed(false);
    setPoints(0);
    setXpGained(0);
    setPhase('question');
    setMascot({ message: 'C’est reparti ! Prends ton temps.', mood: 'content' });
  };

  if (phase === 'summary') {
    return (
      <section className="quiz" aria-labelledby="bilan-titre">
        <Mascot message={mascot.message} mood={mascot.mood} speakKey={mascot.key} />
        <div className="card summary">
          <h2 id="bilan-titre">Bilan de la séance</h2>
          <p className="summary-score">{finalScore} %</p>
          <p>
            Tu as gagné <strong>{xpGained} XP</strong>.
          </p>
          <div className="actions">
            <button type="button" className="button primary" onClick={restart}>
              Nouvelle séance
            </button>
            <Link to="/" className="button">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz" aria-labelledby="question-titre">
      <ol className="quiz-steps" aria-label={`Question ${index + 1} sur ${questions.length}`}>
        {questions.map((q, i) => (
          <li key={q.id} className={i < index ? 'done' : i === index ? 'current' : ''} aria-hidden="true" />
        ))}
      </ol>

      <Mascot message={mascot.message} mood={mascot.mood} speakKey={mascot.key} />

      <div className="card question">
        <p className="question-count">
          Question {index + 1} / {questions.length}
        </p>
        <div className="question-prompt">
          <h2 id="question-titre">{question.prompt}</h2>
          <SpeakButton text={question.prompt} label="Écouter la question" />
        </div>

        <div className="choices" role="group" aria-label="Réponses possibles">
          {question.choices.map((choice) => {
            const isWrong = wrongChoices.includes(choice);
            const isAnswer = phase === 'resolved' && choice === question.answer;
            return (
              <button
                key={choice}
                type="button"
                className={`choice${isWrong ? ' wrong' : ''}${isAnswer ? ' right' : ''}`}
                onClick={() => choose(choice)}
                disabled={phase === 'resolved' || isWrong}
              >
                {isAnswer && <span aria-hidden="true">✔ </span>}
                {isWrong && <span aria-hidden="true">✘ </span>}
                {choice}
              </button>
            );
          })}
        </div>

        {phase === 'question' && question.hint && !hintUsed && (
          <button type="button" className="button hint-button" onClick={showHint}>
            <span aria-hidden="true">💡 </span>Un indice ?
          </button>
        )}

        {phase === 'resolved' && (
          <div className="resolution">
            {question.explanation && (
              <p className="explanation">
                <span aria-hidden="true">💡 </span>
                {question.explanation}
              </p>
            )}
            <button type="button" className="button primary" onClick={next} autoFocus>
              {index + 1 < questions.length ? 'Question suivante' : 'Voir mon bilan'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
