import { useState } from 'react';
import { QuizSession } from '../../components/QuizSession';
import { useProgress } from '../../core/ProgressContext';
import { LEVELS, QUESTIONS_PER_QUEST, questionsForLevel, verbsForLevel, type Level } from './data';
import { LevelCard } from '../../components/LevelCard';

const APP_ID = 'irreguliers';

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
        Choisis ton niveau. Chaque mission : {QUESTIONS_PER_QUEST} verbes, au prétérit ou au participe passé. La correction redonne les trois formes (go – went – gone).
      </p>

      <h2 id="choix-niveau" className="section-title">
        Missions
      </h2>
      <ul className="grid levels">
        {LEVELS.map(({ level: l, title }) => {
          const record = progress.apps[statsKey(l)]?.bestScore;
          const verbs = verbsForLevel(l);
          return (
            <LevelCard key={l} tone={l} number={l} title={<>Niveau {l} · {title}</>} lang="en" record={record} onPlay={() => setLevel(l)}>
              {verbs.slice(0, 6).map((v) => (
                <span key={v.base}>{v.base}</span>
              ))}
              <span>…</span>
            </LevelCard>
          );
        })}
      </ul>
    </section>
  );
}
