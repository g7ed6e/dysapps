import { Link } from 'react-router-dom';
import { SUBJECTS, appsBySubject, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';

/** L'onglet Missions : les missions du portail, par matière. */
export function QuestsPage() {
  return (
    <>
      <h1 className="page-title">
        <Icon name="dumbbell" /> Missions
      </h1>
      <p className="intro">Des missions courtes pour s’entraîner, matière par matière.</p>
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
              <span className="subject-desc">
                Expédition {subject.expedition} : {subject.description.toLowerCase()}
              </span>
              <span className="subject-count">
                {available} mission{available > 1 ? 's' : ''} dispo <Icon name="play" />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
