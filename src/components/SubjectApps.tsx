import { Link } from 'react-router-dom';
import { appsBySubject, bestScore, type Subject } from '../apps/registry';
import { useProgress } from '../core/ProgressContext';
import { Icon } from './Icon';
import { MissionRows } from './MissionRows';
import { RecordTag } from './RecordTag';

/**
 * Les missions du portail d'une matière, en cartes : la page matière et les portes de l'école du village montrent les
 * mêmes. `from` : d'où l'on vient (la mission y ramène par son lien de retour). `compact` (la porte de l'école du monde
 * continu, GD-20, lot 2) : une ligne par mission, l'icône, le titre et l'étiquette, sans la description ; toute la
 * ligne est la cible (`MissionRows`, la même liste que le panneau d'un lieu).
 */
export function SubjectApps({ subject, from, compact = false }: { subject: Subject; from?: string; compact?: boolean }) {
  const { progress } = useProgress();
  const tagOf = (app: ReturnType<typeof appsBySubject>[number]) => {
    const record = bestScore(progress.apps, app.id);
    return app.status === 'bientot' ? <span className="tag">Bientôt</span> : record !== undefined ? <RecordTag record={record} /> : <span className="tag tag-new">Nouveau</span>;
  };
  if (compact)
    return (
      <MissionRows
        rows={appsBySubject(subject).map((app) => ({
          id: app.id,
          icon: app.status === 'bientot' ? 'lock' : app.icon,
          title: app.title,
          tag: tagOf(app),
          className: `subject-${app.subject}`,
          to: app.status === 'disponible' ? { pathname: `/app/${app.id}`, state: from ? { from } : undefined } : undefined,
        }))}
      />
    );
  return (
    <ul className="grid apps">
      {appsBySubject(subject).map((app) => {
        const content = (
          <>
            <span className="app-icon">
              <Icon name={app.status === 'bientot' ? 'lock' : app.icon} size="1.8rem" />
            </span>
            <span className="app-title">{app.title}</span>
            <span className="app-desc">{app.description}</span>
            {tagOf(app)}
          </>
        );
        return (
          <li key={app.id}>
            {app.status === 'disponible' ? (
              <Link to={`/app/${app.id}`} state={from ? { from } : undefined} className={`panel app-card subject-${app.subject}`}>
                {content}
              </Link>
            ) : (
              <div className="panel app-card locked" aria-disabled="true">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
