import { useState } from 'react';
import { QuizSession } from '../../components/QuizSession';
import { Icon } from '../../components/Icon';
import { useProgress } from '../../core/ProgressContext';
import { LEVELS, QUESTIONS_PER_QUEST, questionsForLevel, questionsForSet, setsForLevel, type Level } from './data';

type Mode = { kind: 'niveau'; level: Level } | { kind: 'serie'; setId: string };

export const APP_ID = 'homophones';

function statsKey(mode: Mode): string {
  return mode.kind === 'niveau' ? `${APP_ID}:niveau-${mode.level}` : `${APP_ID}:serie-${mode.setId}`;
}

export default function HomophonesApp() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode) {
    const key = statsKey(mode);
    return (
      <QuizSession
        key={key}
        appId={key}
        makeQuestions={() => (mode.kind === 'niveau' ? questionsForLevel(mode.level) : questionsForSet(mode.setId))}
        onExit={() => setMode(null)}
        exitLabel="Changer de niveau"
      />
    );
  }

  const best = (m: Mode) => progress.apps[statsKey(m)]?.bestScore;

  return (
    <section aria-labelledby="choix-niveau">
      <p className="intro">
        Choisis ton niveau. Chaque quête : {QUESTIONS_PER_QUEST} phrases à compléter. Le joker te donne l’astuce pour trouver le bon mot.
      </p>

      <h2 id="choix-niveau" className="section-title">
        Quêtes
      </h2>
      <ul className="grid levels">
        {LEVELS.map(({ level, title }) => {
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
                  {setsForLevel(level).map((s) => (
                    <span key={s.id}>{s.label}</span>
                  ))}
                </span>
                {record !== undefined ? <span className="tag tag-ok">Record : {record} %</span> : <span className="tag tag-new">Jouer</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">
        <Icon name="target" /> Entraînement ciblé
      </h2>
      <p className="intro">Tu bloques sur une paire ? Entraîne-toi seulement sur elle.</p>
      {LEVELS.map(({ level, title }) => (
        <div key={level} className="set-row" role="group" aria-label={`Niveau ${level} · ${title}`}>
          {setsForLevel(level).map((set) => {
            const record = best({ kind: 'serie', setId: set.id });
            return (
              <button key={set.id} type="button" className="set-chip" onClick={() => setMode({ kind: 'serie', setId: set.id })}>
                {set.label}
                {record !== undefined && <span className="set-record">{record} %</span>}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
