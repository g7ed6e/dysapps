import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { Feedback, type FeedbackTone } from './Feedback';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';
import { RichText } from './math/RichText';

export interface Question {
  id: string;
  /** Consigne ou énoncé, lu à voix haute sur demande. */
  prompt: string;
  choices: string[];
  answer: string;
  /** Indice (« joker ») proposé sur demande, ou après une première erreur. */
  hint?: string;
  /** Aide visuelle (grille, droite graduée…) montrée avec le joker et après la correction. */
  aid?: ReactNode;
  /** Version à lire à voix haute quand l'énoncé contient des symboles (« 7 fois 8 »). */
  spokenPrompt?: string;
  /** Figure qui fait partie de l'énoncé (toujours visible). */
  figure?: ReactNode;
  /** Explication affichée une fois la question terminée. */
  explanation?: string;
}

interface Props {
  appId: string;
  /** Génère les questions d'une quête (appelé à chaque nouvelle partie). */
  makeQuestions: () => Question[];
  /** Nombre d'essais par question (2 par défaut). */
  maxAttempts?: number;
  /** Action supplémentaire proposée à la fin (ex. revenir au choix du niveau). */
  onExit?: () => void;
  exitLabel?: string;
  /** Contenu affiché sous la question (ex. « Revoir le texte »). */
  after?: ReactNode;
}

type Phase = 'question' | 'resolved' | 'summary';

interface FeedbackState {
  shout?: string;
  message: string;
  tone: FeedbackTone;
  key: number;
}

const SHOUTS = ['BIEN VU !', 'PROPRE !', 'EXACT !', 'CARTON !', 'IMPARABLE !'];
/** Un combo s'affiche à partir de cette série de bonnes réponses. */
const COMBO_FROM = 3;

/**
 * Moteur de quête à choix, sans chrono.
 * L'erreur fait partie du jeu : joker (indice) disponible, puis correction.
 */
export function QuizSession({ appId, makeQuestions, maxAttempts = 2, onExit, exitLabel = 'Retour', after }: Props) {
  const { answer, completeSession } = useProgress();
  const [questions, setQuestions] = useState(makeQuestions);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [phase, setPhase] = useState<Phase>('question');
  const [points, setPoints] = useState(0); // 1 au premier essai, 0,5 avec joker ou second essai
  const [xpGained, setXpGained] = useState(0);
  const [feedback, setFeedbackState] = useState<FeedbackState | null>(null);
  // La clé change à chaque message : un texte identique est donc relu.
  const say = (next: Omit<FeedbackState, 'key'> | null) =>
    setFeedbackState((prev) => (next ? { ...next, key: (prev?.key ?? 0) + 1 } : null));
  const sectionRef = useRef<HTMLElement>(null);

  // Chaque nouvelle question (et le résultat) s'affiche en haut de l'écran : pas besoin de défiler.
  useEffect(() => {
    sectionRef.current?.scrollIntoView?.({ block: 'start' });
  }, [index, questions, phase === 'summary']);

  const question = questions[index];
  const hasJoker = Boolean(question.hint || question.aid);
  const finalScore = useMemo(() => Math.round((points / questions.length) * 100), [points, questions.length]);

  const choose = (choice: string) => {
    if (phase !== 'question' || wrongChoices.includes(choice)) return;
    const correct = choice === question.answer;
    // Le joker compte comme un second essai (moins d'XP, aucune autre pénalité).
    const effectiveAttempt = hintUsed ? Math.max(attempt, 2) : attempt;

    if (correct) {
      const update = answer(true, effectiveAttempt);
      setXpGained((x) => x + update.xpGained);
      setPoints((p) => p + (effectiveAttempt === 1 ? 1 : 0.5));
      setPhase('resolved');
      const streak = update.progress.currentStreak;
      say({
        shout: effectiveAttempt === 1 && streak >= COMBO_FROM ? `COMBO x${streak} !` : SHOUTS[index % SHOUTS.length],
        message: `+${update.xpGained} XP`,
        tone: 'bien',
      });
      return;
    }

    setWrongChoices((w) => [...w, choice]);
    // Avec 2 choix, un second essai donnerait la réponse à coup sûr : on corrige directement.
    const attemptsAllowed = Math.min(maxAttempts, question.choices.length - 1);
    if (attempt < attemptsAllowed) {
      setAttempt((a) => a + 1);
      say({
        shout: 'RATÉ…',
        message: question.hint ? `Joker : ${question.hint}` : question.aid ? 'Joker : regarde l’aide.' : 'Retente ta chance.',
        tone: 'rate',
      });
      if (hasJoker) setHintUsed(true);
      return;
    }

    const update = answer(false, effectiveAttempt);
    setXpGained((x) => x + update.xpGained);
    setPhase('resolved');
    say({
      shout: 'PAS CETTE FOIS',
      message: `La bonne réponse : « ${question.answer} ». +${update.xpGained} XP pour l’effort, tu l’auras la prochaine fois.`,
      tone: 'rate',
    });
  };

  const takeJoker = () => {
    if (!hasJoker) return;
    setHintUsed(true);
    say({ shout: 'JOKER', message: question.hint ?? 'Regarde l’aide.', tone: 'indice' });
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAttempt(1);
      setWrongChoices([]);
      setHintUsed(false);
      setPhase('question');
      say(null);
      return;
    }
    const update = completeSession(appId, finalScore);
    setXpGained((x) => x + update.xpGained);
    setPhase('summary');
    say(
      finalScore === 100
        ? { shout: 'PERFECT !', message: 'Zéro faute. Respect.', tone: 'bien' }
        : finalScore >= 60
          ? { shout: 'QUÊTE TERMINÉE', message: 'Belle partie, tu progresses.', tone: 'bien' }
          : { shout: 'QUÊTE TERMINÉE', message: 'Tu es allé au bout, c’est ça qui compte. Relance quand tu veux.', tone: 'info' },
    );
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
    say(null);
  };

  if (phase === 'summary') {
    return (
      <section className="quiz" aria-labelledby="bilan-titre" ref={sectionRef}>
        {feedback && <Feedback {...feedback} speakKey={feedback.key} />}
        <div className="panel summary">
          <h2 id="bilan-titre">Résultat</h2>
          <p className="summary-score">{finalScore} %</p>
          <p className="summary-xp">
            <Icon name="zap" /> +{xpGained} XP
          </p>
          <div className="actions">
            <button type="button" className="button primary" onClick={restart}>
              <Icon name="replay" /> Rejouer
            </button>
            {onExit && (
              <button type="button" className="button" onClick={onExit}>
                <Icon name="back" /> {exitLabel}
              </button>
            )}
            <Link to="/" className="button">
              <Icon name="home" /> Menu
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`quiz${phase === 'resolved' ? ' has-sheet' : ''}`} aria-labelledby="question-titre" ref={sectionRef}>
      <ol className="quiz-steps" aria-label={`Question ${index + 1} sur ${questions.length}`}>
        {questions.map((q, i) => (
          <li key={q.id} className={i < index ? 'done' : i === index ? 'current' : ''} aria-hidden="true" />
        ))}
      </ol>

      <div className="panel question">
        <div className="question-head">
          <p className="question-count">
            Question {index + 1} / {questions.length}
          </p>
          <SpeakButton text={question.spokenPrompt ?? question.prompt} label="Écouter" />
        </div>
        <h2 id="question-titre" className="question-prompt">
          <RichText text={question.prompt} />
        </h2>
        {question.figure && <div className="figure">{question.figure}</div>}

        {/* Réponses courtes (nombres, fractions, petits mots) : 2 colonnes, pour tenir dans l'écran. */}
        <div className={`choices${question.choices.every((c) => c.length <= 12) ? ' short' : ''}`} role="group" aria-label="Réponses possibles">
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
                {isAnswer && <Icon name="check" />}
                {isWrong && <Icon name="close" />}
                <span>
                  <RichText text={choice} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Raté ou joker : le message s'affiche juste sous les réponses, sans les repousser vers le bas. */}
        {phase === 'question' && feedback && <Feedback {...feedback} speakKey={feedback.key} />}

        {question.aid && (hintUsed || phase === 'resolved') && <div className="aid">{question.aid}</div>}

        {phase === 'question' && hasJoker && !hintUsed && (
          <button type="button" className="button joker-button" onClick={takeJoker}>
            <Icon name="lightbulb" /> Prendre un joker
          </button>
        )}
      </div>

      {after}

      {phase === 'resolved' && feedback && (
        // Bandeau fixé en bas de l'écran : résultat, correction et bouton pour continuer, toujours visibles.
        <div className={`result-sheet result-${feedback.tone}`} role="region" aria-label="Résultat de la question">
          <div className="result-sheet-inner">
            <div className="result-sheet-body">
              <Feedback {...feedback} speakKey={feedback.key} compact />
              {question.explanation && (
                <p className="explanation">
                  <Icon name="lightbulb" />{' '}
                  <span>
                    <RichText text={question.explanation} />
                  </span>
                </p>
              )}
            </div>
            {/* Hors de la zone qui défile : toujours visible. */}
            <button type="button" className="button primary next-button" onClick={next} autoFocus>
              {index + 1 < questions.length ? (
                <>
                  Suivante <Icon name="play" />
                </>
              ) : (
                <>
                  Voir le résultat <Icon name="flag" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
