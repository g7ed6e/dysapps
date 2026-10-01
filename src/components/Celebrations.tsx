import { useEffect } from 'react';
import { useProgress } from '../core/ProgressContext';
import { Icon } from './Icon';

/**
 * Pendant une partie, les récompenses gagnées attendent l'écran de fin : un bandeau qui tombe sur la question
 * cacherait la consigne ou le titre au moment où l'élève lit.
 */
export function useHoldCelebrations(active: boolean) {
  const { holdCelebrations } = useProgress();
  useEffect(() => {
    if (!active) return;
    holdCelebrations(true);
    return () => holdCelebrations(false);
  }, [active, holdCelebrations]);
}

/**
 * Récompenses (succès, niveau supérieur) en bandeau qui se ferme seul, sauf un succès de rôle, qui attend le toucher ;
 * retenues pendant une partie.
 */
export function Celebrations() {
  const { celebrations, dismissCelebration, celebrationsHeld } = useProgress();
  const first = celebrationsHeld ? undefined : celebrations[0];

  useEffect(() => {
    if (!first || first.garder) return;
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
