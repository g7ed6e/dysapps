import { levelFromXp } from "../core/progress";
import { RoleBadge } from "./RoleBadge";

/** L'insigne du rôle, le niveau et la barre d'XP. */
export function XpBar({ xp, large = false }: { xp: number; large?: boolean }) {
  const info = levelFromXp(xp);
  const percent = Math.round((info.xpIntoLevel / info.xpForLevel) * 100);
  return (
    <div className={`xp${large ? " xp-large" : ""}`}>
      <RoleBadge tier={info.tier} />
      <div className="xp-info">
        <span className="xp-title">
          <span className="xp-lvl">Niv. {info.level}</span> · {info.title}
        </span>
        <div
          className="xp-track"
          role="progressbar"
          aria-label={`Niveau ${info.level}, rôle ${info.title}`}
          aria-valuemin={0}
          aria-valuemax={info.xpForLevel}
          aria-valuenow={info.xpIntoLevel}
          aria-valuetext={`${info.xpIntoLevel} XP sur ${info.xpForLevel} pour le niveau suivant`}
        >
          <div className="xp-fill" style={{ width: `${percent}%` }} />
        </div>
        {large && (
          <span className="xp-detail">
            {info.xpIntoLevel} / {info.xpForLevel} XP avant le niveau{" "}
            {info.level + 1}
          </span>
        )}
      </div>
    </div>
  );
}
