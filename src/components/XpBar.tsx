import { levelFromXp } from '../core/progress';

export function XpBar({ xp, large = false }: { xp: number; large?: boolean }) {
  const info = levelFromXp(xp);
  const percent = Math.round((info.xpIntoLevel / info.xpForLevel) * 100);
  return (
    <div className={`xp${large ? ' xp-large' : ''}`}>
      <span className="xp-level" aria-hidden="true">
        {info.level}
      </span>
      <div className="xp-info">
        <span className="xp-title">
          Niveau {info.level} · {info.title}
        </span>
        <div
          className="xp-track"
          role="progressbar"
          aria-label={`Niveau ${info.level}`}
          aria-valuemin={0}
          aria-valuemax={info.xpForLevel}
          aria-valuenow={info.xpIntoLevel}
          aria-valuetext={`${info.xpIntoLevel} points sur ${info.xpForLevel} pour le niveau suivant`}
        >
          <div className="xp-fill" style={{ width: `${percent}%` }} />
        </div>
        {large && (
          <span className="xp-detail">
            {info.xpIntoLevel} / {info.xpForLevel} XP pour le niveau {info.level + 1}
          </span>
        )}
      </div>
    </div>
  );
}
