import { useState } from 'react';
import { QuizSession } from '../../components/QuizSession';
import { Icon } from '../../components/Icon';
import { useProgress } from '../../core/ProgressContext';
import { LEVELS, QUESTIONS_PER_QUEST, THEMES, questionsForLevel, questionsForTheme, type Level } from './data';

type Mode = { kind: 'niveau'; level: Level } | { kind: 'theme'; themeId: string };

export const APP_ID = 'vocabulaire';

function statsKey(mode: Mode): string {
  return mode.kind === 'niveau' ? `${APP_ID}:niveau-${mode.level}` : `${APP_ID}:theme-${mode.themeId}`;
}

export default function VocabulaireApp() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode) {
    const key = statsKey(mode);
    return (
      <QuizSession
        key={key}
        appId={key}
        makeQuestions={() => (mode.kind === 'niveau' ? questionsForLevel(mode.level) : questionsForTheme(mode.themeId))}
        onExit={() => setMode(null)}
        exitLabel="Changer de niveau"
      />
    );
  }

  const best = (m: Mode) => progress.apps[statsKey(m)]?.bestScore;

  return (
    <section aria-labelledby="choix-niveau">
      <p className="intro">
        Choisis ton niveau. Chaque quête : {QUESTIONS_PER_QUEST} mots. Le bouton Écouter lit le mot anglais avec une voix anglaise.
      </p>

      <h2 id="choix-niveau" className="section-title">
        Quêtes
      </h2>
      <ul className="grid levels">
        {LEVELS.map(({ level, title, description }) => {
          const record = best({ kind: 'niveau', level });
          return (
            <li key={level}>
              <button type="button" className={`panel level-card level-${level}`} onClick={() => setMode({ kind: 'niveau', level })}>
                <span className="level-number" aria-hidden="true">
                  {level}
                </span>
                <span className="level-title">
                  Niveau {level} · {title}
                </span>
                <span className="level-sets">
                  <span>{description}</span>
                </span>
                {record !== undefined ? <span className="tag tag-ok">Record : {record} %</span> : <span className="tag tag-new">Jouer</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">
        <Icon name="target" /> Un thème
      </h2>
      <p className="intro">Révise un seul thème : chaque mot une fois, de l’anglais au français ou l’inverse.</p>
      <div className="set-row" role="group" aria-label="Thèmes">
        {THEMES.map((theme) => {
          const record = best({ kind: 'theme', themeId: theme.id });
          return (
            <button key={theme.id} type="button" className="set-chip" onClick={() => setMode({ kind: 'theme', themeId: theme.id })}>
              {theme.label}
              {record !== undefined && <span className="set-record">{record} %</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
