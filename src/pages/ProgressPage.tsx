import { BADGES } from '../core/progress';
import { useProgress } from '../core/ProgressContext';
import { XpBar } from '../components/XpBar';

export function ProgressPage() {
  const { progress } = useProgress();
  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  const rate = progress.totalAnswers ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100) : 0;

  return (
    <>
      <h1 className="page-title">Ma progression</h1>
      <div className="card">
        <XpBar xp={progress.xp} large />
        <dl className="stats">
          <div>
            <dt>XP total</dt>
            <dd>{progress.xp}</dd>
          </div>
          <div>
            <dt>Séances terminées</dt>
            <dd>{progress.sessionsCompleted}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>{progress.totalAnswers}</dd>
          </div>
          <div>
            <dt>Réussite</dt>
            <dd>{rate} %</dd>
          </div>
          <div>
            <dt>Meilleure série</dt>
            <dd>{progress.bestStreak}</dd>
          </div>
        </dl>
      </div>

      <h2 className="section-title">
        Badges ({earned} / {BADGES.length})
      </h2>
      <ul className="grid badges">
        {BADGES.map((b) => {
          const date = progress.badges[b.id];
          return (
            <li key={b.id} className={`card badge${date ? ' earned' : ''}`}>
              <span className="badge-icon" aria-hidden="true">
                {date ? b.icon : '🔒'}
              </span>
              <strong>{b.title}</strong>
              <span>{b.description}</span>
              <span className="visually-hidden">{date ? 'Obtenu' : 'Pas encore obtenu'}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
