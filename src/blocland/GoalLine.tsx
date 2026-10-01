import { useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import type { Goal } from './world/goals';

/**
 * La jauge d'un objectif (« 5 / 16 »). Rien quand il ne se compte pas, ou quand tout est là : une jauge pleine
 * (« 3 / 3 ») à côté d'un objectif pas encore fait (« Tu peux construire le sentier ») laissait croire qu'il l'était.
 */
export function GoalGauge({ goal }: { goal: Goal }) {
  if (goal.need <= 1 || goal.ready) return null;
  const done = Math.min(goal.have, goal.need);
  return (
    <span className="goal-gauge" role="img" aria-label={`${done} sur ${goal.need}`}>
      <span className="goal-gauge-fill" style={{ width: `${(100 * done) / goal.need}%` }} />
      <span className="goal-gauge-count" aria-hidden="true">
        {done} / {goal.need}
      </span>
    </span>
  );
}

/** Le prochain objectif d'une île : une phrase et une jauge (« 5 sur 16 »), pour savoir d'un coup d'œil où on en est. */
export function GoalLine({ goal, className = '' }: { goal: Goal; className?: string }) {
  return (
    <div className={`island-goal${className ? ` ${className}` : ''}`}>
      <p>
        <Icon name="flag" /> <strong>Prochain objectif :</strong> <Syllabified text={goal.text} />
      </p>
      <GoalGauge goal={goal} />
    </div>
  );
}

/**
 * Le prochain objectif replié avec ce qui l'accompagne (l'état du village, sur l'île-port) : le titre du pli est
 * l'objectif lui-même et sa jauge, lisibles pli fermé ; le détail est dedans. Fermé à l'ouverture du panneau.
 */
export function GoalFold({ goal, children }: { goal: Goal; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="island-fold island-fold-objectif" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="island-fold-summary">
        <span className="island-fold-chevron" aria-hidden="true">
          <Icon name={open ? 'chevronDown' : 'chevronRight'} />
        </span>
        <span className="island-goal">
          <span className="island-goal-text">
            <Icon name="flag" /> <strong>Prochain objectif :</strong> <Syllabified text={goal.text} />
          </span>
          <GoalGauge goal={goal} />
        </span>
      </summary>
      {children}
    </details>
  );
}
