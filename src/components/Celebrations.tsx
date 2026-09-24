import { useEffect } from 'react';
import { useProgress } from '../core/ProgressContext';

/** Affiche les récompenses (badge, niveau) sous forme de bandeaux qui se ferment seuls. */
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
    <div className="celebration" role="status" aria-live="polite">
      <span className="celebration-icon" aria-hidden="true">
        {first.icon}
      </span>
      <div>
        <strong>{first.title}</strong>
        <p>{first.message}</p>
      </div>
      <button type="button" className="icon-button" onClick={() => dismissCelebration(first.id)} aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}
