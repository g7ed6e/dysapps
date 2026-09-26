import { rankForLevel, rankLadder } from '../core/progress';
import { Icon } from './Icon';

/** Les six rangs, de Bronze à Légende : atteints en couleur, à venir grisés avec leur niveau, le rang actuel encadré. */
export function RankLadder({ level }: { level: number }) {
  const title = rankForLevel(level).title;
  return (
    <ol className="rank-ladder" aria-label="Rangs">
      {rankLadder(level).map((r) => (
        <li key={r.tier} className={r.reached ? 'reached' : 'locked'} aria-current={r.current ? 'step' : undefined}>
          <span className={`rank-shield tier-${r.tier}${r.reached ? '' : ' locked'}`} aria-hidden="true">
            <b className="rank-level">{r.firstLevel}</b>
          </span>
          <strong>{r.name}</strong>
          {r.current ? (
            <span className="rank-ladder-note">
              {title}
              <span className="visually-hidden"> : ton rang actuel</span>
            </span>
          ) : r.reached ? (
            <span className="rank-ladder-note">
              <Icon name="check" />
              <span className="visually-hidden">atteint</span>
            </span>
          ) : (
            <span className="rank-ladder-note">
              <span aria-hidden="true">niv. {r.firstLevel}</span>
              <span className="visually-hidden">à partir du niveau {r.firstLevel}</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
