import { Icon } from '../../components/Icon';
import { QuestMenu } from '../../components/QuestMenu';
import { QUESTIONS_PER_QUEST, QUESTS, TABLES, tableQuest } from './generators';

export default function TablesApp() {
  return (
    <QuestMenu
      appId="tables"
      quests={QUESTS.map((q) => ({ ...q, make: () => q.make() }))}
      intro={
        <>
          {QUESTIONS_PER_QUEST} calculs par quête, pas de chrono. Le joker montre une aide visuelle : grille de points, boîte de 10, droite graduée ou
          tableau de numération.
        </>
      }
      extra={(start, best) => (
        <>
          <h2 className="section-title">
            <Icon name="target" /> Réviser une table
          </h2>
          <p className="intro">Les 10 calculs d’une seule table, dans le désordre.</p>
          <div className="set-row" role="group" aria-label="Tables de multiplication">
            {TABLES.map((table) => {
              const id = `table-${table}`;
              const record = best(id);
              return (
                <button
                  key={table}
                  type="button"
                  className="set-chip table-chip"
                  aria-label={`Table de ${table}${record !== undefined ? `, record ${record} %` : ''}`}
                  onClick={() => start({ id, title: `Table de ${table}`, detail: '', make: () => tableQuest(table) })}
                >
                  × {table}
                  {record !== undefined && <span className="set-record">{record} %</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    />
  );
}
