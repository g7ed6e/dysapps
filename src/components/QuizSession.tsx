import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { Feedback, type FeedbackTone } from './Feedback';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';
import { RichText } from './math/RichText';
import { langAttr, type Lang } from '../core/speech';
import { useSheetClearance } from './useSheetClearance';
import { useAnswerKeys } from './useAnswerKeys';
import { useFocusMode } from './FocusMode';
import { Stars } from '../blocland/Stars';
import { starsFor } from '../core/stars';
import { useHoldCelebrations } from './Celebrations';

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
  /** Langue de l'énoncé affiché (français par défaut). */
  promptLang?: Lang;
  /** Langue de l'énoncé lu : par défaut celle de l'énoncé affiché (« le chien » affiché, « dog » lu en anglais). */
  spokenLang?: Lang;
  /** Langue des réponses (français par défaut). */
  choicesLang?: Lang;
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
  /** La suite logique, proposée en premier à la fin (ex. la quête suivante). */
  next?: { label: string; go: () => void };
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

// Peu de mots, courts et connus, en minuscules : un élève dys ne doit pas déchiffrer un mot nouveau à chaque réponse.
const SHOUTS = ['Bravo !', 'Juste !'];
/** Un combo s'affiche à partir de cette série de bonnes réponses. */
const COMBO_FROM = 3;

/**
 * Moteur de quête à choix, sans chrono.
 * L'erreur fait partie du jeu : joker (indice) disponible, puis correction.
 */
export function QuizSession({ appId, makeQuestions, maxAttempts = 2, onExit, exitLabel = 'Retour', next: nextStep, after }: Props) {
  const { answer, completeSession } = useProgress();
  const [questions, setQuestions] = useState(makeQuestions);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [phase, setPhase] = useState<Phase>('question');
  const [points, setPoints] = useState(0); // 1 au premier essai, 0,5 avec joker ou second essai
  // Pour le bilan en mots : trouvées du premier coup, trouvées ensuite (joker ou deuxième essai).
  const [firstTry, setFirstTry] = useState(0);
  const [later, setLater] = useState(0);
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
  // Le bandeau de résultat ne cache ni la bonne réponse ni l'aide.
  useSheetClearance(sectionRef, phase === 'resolved');
  // Les succès gagnés en route s'affichent au bilan, pas sur la question.
  useHoldCelebrations(phase !== 'summary');
  // Touches 1 à 9 pour répondre, Entrée pour la suite.
  useAnswerKeys(sectionRef);
  // Mode concentration pendant la partie ; « Quitter » ramène au choix des quêtes (ou à l'accueil).
  const navigate = useNavigate();
  useFocusMode(phase !== 'summary', () => (onExit ? onExit() : navigate('/')), 'L’XP des réponses déjà données est gardée.');

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
      if (effectiveAttempt === 1) setFirstTry((n) => n + 1);
      else setLater((n) => n + 1);
      setPhase('resolved');
      const streak = update.progress.currentStreak;
      say({
        shout: effectiveAttempt === 1 && streak >= COMBO_FROM ? `${streak} d’affilée !` : SHOUTS[index % SHOUTS.length],
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
        shout: 'Presque !',
        message: question.hint ? `Indice : ${question.hint}` : question.aid ? 'Regarde l’aide, puis réessaie.' : 'Réessaie.',
        tone: 'rate',
      });
      if (hasJoker) setHintUsed(true);
      return;
    }

    const update = answer(false, effectiveAttempt);
    setXpGained((x) => x + update.xpGained);
    setPhase('resolved');
    say({
      shout: 'Pas cette fois',
      message: `La bonne réponse : « ${question.answer} ». +${update.xpGained} XP pour l’effort, tu l’auras la prochaine fois.`,
      tone: 'rate',
    });
  };

  const takeJoker = () => {
    if (!hasJoker) return;
    setHintUsed(true);
    say({ shout: 'Joker', message: question.hint ?? 'Regarde l’aide.', tone: 'indice' });
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
        ? { shout: 'Sans faute !', message: 'Zéro erreur, bravo.', tone: 'bien' }
        : finalScore >= 60
          ? { shout: 'Quête terminée', message: 'Belle partie, tu progresses.', tone: 'bien' }
          : { shout: 'Quête terminée', message: 'Tu as tenu jusqu’au bout, c’est ça qui compte. Relance quand tu veux.', tone: 'info' },
    );
  };

  const restart = () => {
    setQuestions(makeQuestions());
    setIndex(0);
    setAttempt(1);
    setWrongChoices([]);
    setHintUsed(false);
    setPoints(0);
    setFirstTry(0);
    setLater(0);
    setXpGained(0);
    setPhase('question');
    say(null);
  };

  if (phase === 'summary') {
    return (
      <section className="quiz" aria-labelledby="bilan-titre" ref={sectionRef}>
        {feedback && <Feedback {...feedback} speakKey={feedback.key} />}
        {/* Les récompenses arrivent l'une après l'autre (étoiles, puis score, puis XP), comme à la fin d'un niveau. */}
        <div className="panel summary summary-reveal">
          <h2 id="bilan-titre">Résultat</h2>
          {/* En étoiles et en mots, comme dans Blocland : « 88 % » ne parle pas à un élève de 6e. */}
          <Stars count={starsFor(points / questions.length)} size="2.4rem" />
          <p className="summary-score">
            {firstTry} sur {questions.length} du premier coup
          </p>
          {later > 0 && (
            <p className="summary-later">
              et {later} trouvée{later > 1 ? 's' : ''} ensuite, avec le joker ou au deuxième essai
            </p>
          )}
          <p className="summary-xp">
            <Icon name="zap" /> +{xpGained} XP
          </p>
          {/* En premier, la suite logique : la quête suivante, sinon le choix des quêtes, sinon l'accueil. */}
          <div className="actions">
            {nextStep ? (
              <button type="button" className="button primary" onClick={nextStep.go} autoFocus>
                <Icon name="play" /> {nextStep.label}
              </button>
            ) : onExit ? (
              <button type="button" className="button primary" onClick={onExit} autoFocus>
                <Icon name="play" /> {exitLabel}
              </button>
            ) : (
              <Link to="/" className="button primary" autoFocus>
                <Icon name="play" /> Continuer
              </Link>
            )}
            <button type="button" className="button" onClick={restart}>
              <Icon name="replay" /> Rejouer
            </button>
            {nextStep && onExit && (
              <button type="button" className="button" onClick={onExit}>
                <Icon name="back" /> {exitLabel}
              </button>
            )}
            {(nextStep || onExit) && (
              <Link to="/" className="button">
                <Icon name="home" /> Accueil
              </Link>
            )}
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
          <SpeakButton text={question.spokenPrompt ?? question.prompt} label="Écouter" lang={question.spokenLang ?? question.promptLang} />
        </div>
        <h2 id="question-titre" className="question-prompt" lang={langAttr(question.promptLang)}>
          <RichText text={question.prompt} lang={question.promptLang} />
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
                <span lang={langAttr(question.choicesLang)}>
                  <RichText text={choice} lang={question.choicesLang} />
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
