import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import type { Goal } from './world/goals';

/** Le prochain objectif d'une île : une phrase et une jauge (« 5 sur 16 »), pour savoir d'un coup d'œil où on en est. */
export function GoalLine({ goal, className = '' }: { goal: Goal; className?: string }) {
  const done = Math.min(goal.have, goal.need);
  return (
    <div className={`island-goal${className ? ` ${className}` : ''}`}>
      <p>
        <Icon name="flag" /> <strong>Prochain objectif :</strong> <Syllabified text={goal.text} />
      </p>
      {goal.need > 1 && (
        <div className="goal-gauge" role="img" aria-label={`${done} sur ${goal.need}`}>
          <span className="goal-gauge-fill" style={{ width: `${(100 * done) / goal.need}%` }} />
          <span className="goal-gauge-count" aria-hidden="true">
            {done} / {goal.need}
          </span>
        </div>
      )}
    </div>
  );
}
