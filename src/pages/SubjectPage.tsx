import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, appsBySubject, bestScore, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';
import { useProgress } from '../core/ProgressContext';
import { NotFoundPage } from './NotFoundPage';

export function SubjectPage() {
  const { subject } = useParams();
  const { progress } = useProgress();
  if (!subject || !(subject in SUBJECTS)) return <NotFoundPage />;
  const info = SUBJECTS[subject as Subject];

  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="back" /> Menu
      </Link>
      <h1 className={`page-title title-${subject}`}>
        <Icon name={info.icon} /> {info.title}
      </h1>
      <ul className="grid apps">
        {appsBySubject(subject as Subject).map((app) => {
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
                <span className="tag tag-ok">Record : {record} %</span>
              ) : (
                <span className="tag tag-new">Nouveau</span>
              )}
            </>
          );
          return (
            <li key={app.id}>
              {app.status === 'disponible' ? (
                <Link to={`/app/${app.id}`} className={`panel app-card subject-${app.subject}`}>
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
    </>
  );
}
