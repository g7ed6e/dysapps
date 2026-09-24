import { useState } from 'react';
import { QuizSession } from '../../components/QuizSession';
import { Icon } from '../../components/Icon';
import { useProgress } from '../../core/ProgressContext';
import { QUESTIONS_PER_QUEST, QUESTS, TABLES, tableQuest } from './generators';

type Mode = { kind: 'quete'; id: string } | { kind: 'table'; table: number };

const APP_ID = 'tables';

function statsKey(mode: Mode): string {
  return mode.kind === 'quete' ? `${APP_ID}:${mode.id}` : `${APP_ID}:table-${mode.table}`;
}

export default function TablesApp() {
  const { progress } = useProgress();
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode) {
    const key = statsKey(mode);
    const quest = mode.kind === 'quete' ? QUESTS.find((q) => q.id === mode.id) : undefined;
    return (
      <QuizSession
        key={key}
        appId={key}
        makeQuestions={() => (mode.kind === 'table' ? tableQuest(mode.table) : quest!.make())}
        onExit={() => setMode(null)}
        exitLabel="Changer de quête"
      />
    );
  }

  const best = (m: Mode) => progress.apps[statsKey(m)]?.bestScore;

  return (
    <section aria-labelledby="choix-quete">
      <p className="intro">
        {QUESTIONS_PER_QUEST} calculs par quête, pas de chrono. Le joker montre une aide visuelle : grille de points, boîte de 10, droite graduée ou
        tableau de numération.
      </p>

      <h2 id="choix-quete" className="section-title">
        Quêtes
      </h2>
      <ul className="grid levels">
        {QUESTS.map((quest, i) => {
          const record = best({ kind: 'quete', id: quest.id });
          return (
            <li key={quest.id}>
              <button type="button" className={`panel level-card level-${(i % 3) + 1}`} onClick={() => setMode({ kind: 'quete', id: quest.id })}>
                <span className="level-number" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="level-title">{quest.title}</span>
                <span className="level-grade">{quest.detail}</span>
                {record !== undefined ? <span className="tag tag-ok">Record : {record} %</span> : <span className="tag tag-new">Jouer</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">
        <Icon name="target" /> Réviser une table
      </h2>
      <p className="intro">Les 10 calculs d’une seule table, dans le désordre.</p>
      <div className="set-row" role="group" aria-label="Tables de multiplication">
        {TABLES.map((table) => {
          const record = best({ kind: 'table', table });
          return (
            <button
              key={table}
              type="button"
              className="set-chip table-chip"
              aria-label={`Table de ${table}${record !== undefined ? `, record ${record} %` : ''}`}
              onClick={() => setMode({ kind: 'table', table })}
            >
              × {table}
              {record !== undefined && <span className="set-record">{record} %</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
