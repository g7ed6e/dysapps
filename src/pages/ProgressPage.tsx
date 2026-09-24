import { BADGES } from '../core/progress';
import { useProgress } from '../core/ProgressContext';
import { Icon } from '../components/Icon';
import { XpBar } from '../components/XpBar';

export function ProgressPage() {
  const { progress } = useProgress();
  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  const rate = progress.totalAnswers ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100) : 0;

  return (
    <>
      <h1 className="page-title">Profil</h1>
      <div className="panel">
        <XpBar xp={progress.xp} large />
        <dl className="stats">
          <div>
            <dt>XP total</dt>
            <dd>{progress.xp}</dd>
          </div>
          <div>
            <dt>Quêtes</dt>
            <dd>{progress.sessionsCompleted}</dd>
          </div>
          <div>
            <dt>Réponses</dt>
            <dd>{progress.totalAnswers}</dd>
          </div>
          <div>
            <dt>Précision</dt>
            <dd>{rate} %</dd>
          </div>
          <div>
            <dt>Meilleur combo</dt>
            <dd>x{progress.bestStreak}</dd>
          </div>
        </dl>
      </div>

      <h2 className="section-title">
        Succès {earned} / {BADGES.length}
      </h2>
      <ul className="grid badges">
        {BADGES.map((b) => {
          const date = progress.badges[b.id];
          return (
            <li key={b.id} className={`panel badge${date ? ' earned' : ''}`}>
              <span className="badge-icon">
                <Icon name={date ? b.icon : 'lock'} size="1.8rem" />
              </span>
              <strong>{b.title}</strong>
              <span>{b.description}</span>
              <span className="visually-hidden">{date ? 'Débloqué' : 'Verrouillé'}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
