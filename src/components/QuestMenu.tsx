import { useState, type ReactNode } from 'react';
import { useProgress } from '../core/ProgressContext';
import type { Question } from './QuizSession';
import { QuizSession } from './QuizSession';

export interface QuestDef {
  id: string;
  title: string;
  detail: string;
  make: () => Question[];
}

interface Props {
  appId: string;
  intro: ReactNode;
  quests: QuestDef[];
  /** Section supplémentaire sous les quêtes (ex. réviser une table) ; reçoit de quoi lancer une quête libre. */
  extra?: (start: (quest: QuestDef) => void, best: (id: string) => number | undefined) => ReactNode;
}

/** Menu des quêtes d'une activité (cartes numérotées), puis la quête choisie. */
export function QuestMenu({ appId, intro, quests, extra }: Props) {
  const { progress } = useProgress();
  const [current, setCurrent] = useState<QuestDef | null>(null);
  const key = (id: string) => `${appId}:${id}`;
  const best = (id: string) => progress.apps[key(id)]?.bestScore;

  if (current) {
    return (
      <QuizSession
        key={current.id}
        appId={key(current.id)}
        makeQuestions={current.make}
        onExit={() => setCurrent(null)}
        exitLabel="Changer de quête"
      />
    );
  }

  return (
    <section aria-labelledby="choix-quete">
      <p className="intro">{intro}</p>
      <h2 id="choix-quete" className="section-title">
        Quêtes
      </h2>
      <ul className="grid levels">
        {quests.map((quest, i) => {
          const record = best(quest.id);
          return (
            <li key={quest.id}>
              <button type="button" className={`panel level-card level-${(i % 3) + 1}`} onClick={() => setCurrent(quest)}>
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
      {extra?.(setCurrent, best)}
    </section>
  );
}
