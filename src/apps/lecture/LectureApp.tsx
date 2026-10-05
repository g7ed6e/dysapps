import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { QuizSession } from '../../components/QuizSession';
import { useProgress } from '../../core/ProgressContext';
import { TEXTS, questionsFor, segmentsOf, type ReadingText } from './data';
import { Reader } from './Reader';
import { LevelCard } from '../../components/LevelCard';

type Step = { text: ReadingText; phase: 'lecture' | 'questions' };

export default function LectureApp() {
  const { progress } = useProgress();
  const [step, setStep] = useState<Step | null>(null);
  const key = (id: string) => `lecture:${id}`;

  // Le texte choisi s'ouvre en haut de l'écran, même si la liste était défilée.
  useEffect(() => {
    if (step?.phase === 'lecture') window.scrollTo?.(0, 0);
  }, [step]);

  if (step?.phase === 'lecture') {
    return (
      <>
        <button type="button" className="back-link link-button" onClick={() => setStep(null)}>
          <Icon name="back" /> Tous les textes
        </button>
        <Reader text={step.text} />
        {/* Toujours visible en bas de l'écran, même au milieu d'un long texte. */}
        <div className="sticky-actions">
          <button type="button" className="button primary" onClick={() => setStep({ text: step.text, phase: 'questions' })}>
            J’ai lu : aux questions ! <Icon name="play" />
          </button>
        </div>
      </>
    );
  }

  if (step?.phase === 'questions') {
    return (
      <QuizSession
        key={step.text.id}
        appId={key(step.text.id)}
        makeQuestions={() => questionsFor(step.text)}
        onExit={() => setStep(null)}
        exitLabel="Autre texte"
        after={
          <details className="reread">
            <summary>
              <Icon name="book" /> Revoir le texte
            </summary>
            <Reader text={step.text} compact />
          </details>
        }
      />
    );
  }

  return (
    <section aria-labelledby="choix-texte">
      <p className="intro">
        Choisis un texte. Écoute-le ou lis-le à ton rythme, puis réponds à 5 questions. Le joker te montre le passage à relire.
      </p>
      <h2 id="choix-texte" className="section-title">
        Textes
      </h2>
      <ul className="grid levels">
        {TEXTS.map((text, i) => {
          const record = progress.apps[key(text.id)]?.bestScore;
          return (
            <LevelCard key={text.id} tone={(i % 3) + 1} number={i + 1} title={text.title} grade={text.author} record={record} playLabel="Lire" onPlay={() => setStep({ text, phase: 'lecture' })}>
              <span>{text.kind === 'vers' ? 'Fable en vers' : 'Récit adapté'}</span>
              <span>
                {segmentsOf(text).length} {text.kind === 'vers' ? 'vers' : 'phrases'}
              </span>
            </LevelCard>
          );
        })}
      </ul>
    </section>
  );
}
