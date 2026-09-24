import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, appsBySubject, type Subject } from '../apps/registry';
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
        ← Accueil
      </Link>
      <h1 className="page-title">
        <span aria-hidden="true">{info.icon} </span>
        {info.title}
      </h1>
      <ul className="grid apps">
        {appsBySubject(subject as Subject).map((app) => {
          const stats = progress.apps[app.id];
          const content = (
            <>
              <span className="app-icon" aria-hidden="true">
                {app.icon}
              </span>
              <span className="app-title">{app.title}</span>
              <span className="app-desc">{app.description}</span>
              {app.status === 'bientot' ? (
                <span className="tag">Bientôt</span>
              ) : stats ? (
                <span className="tag tag-ok">Meilleur score : {stats.bestScore} %</span>
              ) : (
                <span className="tag tag-new">Nouveau</span>
              )}
            </>
          );
          return (
            <li key={app.id}>
              {app.status === 'disponible' ? (
                <Link to={`/app/${app.id}`} className="card app-card">
                  {content}
                </Link>
              ) : (
                <div className="card app-card disabled" aria-disabled="true">
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
