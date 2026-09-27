import { Link } from 'react-router-dom';
import { appsBySubject, bestScore, type Subject } from '../apps/registry';
import { useProgress } from '../core/ProgressContext';
import { Icon } from './Icon';
import { RecordTag } from './RecordTag';

/**
 * Les missions du portail d'une matière, en cartes : la page matière et les portes de l'école du village montrent les
 * mêmes. `from` : d'où l'on vient (la mission y ramène par son lien de retour).
 */
export function SubjectApps({ subject, from }: { subject: Subject; from?: string }) {
  const { progress } = useProgress();
  return (
    <ul className="grid apps">
      {appsBySubject(subject).map((app) => {
        const record = bestScore(progress.apps, app.id);
        const content = (
          <>
            <span className="app-icon">
              <Icon name={app.status === 'bientot' ? 'lock' : app.icon} size="1.8rem" />
            </span>
            <span className="app-title">{app.title}</span>
            <span className="app-desc">{app.description}</span>
            {app.status === 'bientot' ? (
              <span className="tag">Bientôt</span>
            ) : record !== undefined ? (
              <RecordTag record={record} />
            ) : (
              <span className="tag tag-new">Nouveau</span>
            )}
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
