import { Link } from 'react-router-dom';
import { SUBJECTS, appsBySubject, type Subject } from '../apps/registry';
import { Mascot } from '../components/Mascot';
import { useProgress } from '../core/ProgressContext';

export function HomePage() {
  const { progress } = useProgress();
  const message =
    progress.totalAnswers === 0
      ? 'Bonjour, je suis Plume ! Choisis une matière pour commencer. Tu peux régler l’affichage dans « Réglages ».'
      : 'Content de te revoir ! Qu’est-ce qu’on travaille aujourd’hui ?';

  return (
    <>
      <Mascot message={message} autoSpeak={false} />
      <h1 className="page-title">Que veux-tu travailler ?</h1>
      <div className="grid subjects">
        {(Object.keys(SUBJECTS) as Subject[]).map((key) => {
          const subject = SUBJECTS[key];
          const available = appsBySubject(key).filter((a) => a.status === 'disponible').length;
          return (
            <Link key={key} to={`/matiere/${key}`} className={`card subject-card subject-${key}`}>
              <span className="subject-icon" aria-hidden="true">
                {subject.icon}
              </span>
              <span className="subject-title">{subject.title}</span>
              <span className="subject-desc">{subject.description}</span>
              <span className="subject-count">
                {available} activité{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
