import { useEffect } from 'react';
import { useProgress } from '../core/ProgressContext';
import { Icon } from './Icon';

/** Récompenses (succès, level up) en bandeau « POW » qui se ferme seul. */
export function Celebrations() {
  const { celebrations, dismissCelebration } = useProgress();
  const first = celebrations[0];

  useEffect(() => {
    if (!first) return;
    const timer = window.setTimeout(() => dismissCelebration(first.id), 5000);
    return () => window.clearTimeout(timer);
  }, [first, dismissCelebration]);

  if (!first) return null;
  return (
    <div className={`celebration celebration-${first.kind}`} role="status" aria-live="polite">
      <span className="celebration-icon">
        <Icon name={first.icon} size="1.8rem" />
      </span>
      <div className="celebration-text">
        <p className="celebration-kicker">{first.title}</p>
        <strong>{first.message}</strong>
      </div>
      <button type="button" className="icon-button" onClick={() => dismissCelebration(first.id)} aria-label="Fermer">
        <Icon name="close" />
      </button>
    </div>
  );
}
