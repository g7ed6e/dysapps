import { Link } from 'react-router-dom';
import { SUBJECTS, appsBySubject, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';

/** L'onglet Quêtes : les quêtes du portail, par matière. */
export function QuestsPage() {
  return (
    <>
      <h1 className="page-title">
        <Icon name="dumbbell" /> Quêtes
      </h1>
      <p className="intro">Des quêtes courtes pour s’entraîner, matière par matière.</p>
      <div className="grid subjects">
        {(Object.keys(SUBJECTS) as Subject[]).map((key) => {
          const subject = SUBJECTS[key];
          const available = appsBySubject(key).filter((a) => a.status === 'disponible').length;
          return (
            <Link key={key} to={`/matiere/${key}`} className={`panel subject-card subject-${key}`}>
              <span className="subject-icon">
                <Icon name={subject.icon} size="2.2rem" />
              </span>
              <span className="subject-title">{subject.title}</span>
              <span className="subject-desc">{subject.description}</span>
              <span className="subject-count">
                {available} quête{available > 1 ? 's' : ''} dispo <Icon name="play" />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
