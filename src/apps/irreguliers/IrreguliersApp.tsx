import { useState } from 'react';
import { QuizSession } from '../../components/QuizSession';
import { useProgress } from '../../core/ProgressContext';
import { LEVELS, QUESTIONS_PER_QUEST, questionsForLevel, verbsForLevel, type Level } from './data';
import { RecordTag } from '../../components/RecordTag';

export const APP_ID = 'irreguliers';

function statsKey(level: Level): string {
  return `${APP_ID}:niveau-${level}`;
}

export default function IrreguliersApp() {
  const { progress } = useProgress();
  const [level, setLevel] = useState<Level | null>(null);

  if (level) {
    const key = statsKey(level);
    return (
      <QuizSession key={key} appId={key} makeQuestions={() => questionsForLevel(level)} onExit={() => setLevel(null)} exitLabel="Changer de niveau" />
    );
  }

  return (
    <section aria-labelledby="choix-niveau">
      <p className="intro">
        Choisis ton niveau. Chaque quête : {QUESTIONS_PER_QUEST} verbes, au prétérit ou au participe passé. La correction redonne les trois formes (go – went – gone).
      </p>

      <h2 id="choix-niveau" className="section-title">
        Quêtes
      </h2>
      <ul className="grid levels">
        {LEVELS.map(({ level: l, title }) => {
          const record = progress.apps[statsKey(l)]?.bestScore;
          const verbs = verbsForLevel(l);
          return (
            <li key={l}>
              <button type="button" className={`panel level-card level-${l}`} onClick={() => setLevel(l)}>
                <span className="level-number" aria-hidden="true">
                  {l}
                </span>
                <span className="level-title">
                  Niveau {l} · {title}
                </span>
                <span className="level-sets" lang="en">
                  {verbs.slice(0, 6).map((v) => (
                    <span key={v.base}>{v.base}</span>
                  ))}
                  <span>…</span>
                </span>
                {record !== undefined ? <RecordTag record={record} /> : <span className="tag tag-new">Jouer</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
