import { rankLadder } from '../core/progress';
import { Icon } from './Icon';
import { RoleBadge } from './RoleBadge';

/** Les cinq rôles, d'Explorateur à Architecte de l'archipel : atteints en couleur, à venir en pointillés avec leur niveau, le rôle actuel encadré. */
export function RankLadder({ level }: { level: number }) {
  return (
    <ol className="rank-ladder" aria-label="Rôles">
      {rankLadder(level).map((r) => (
        <li key={r.tier} className={r.reached ? 'reached' : 'locked'} aria-current={r.current ? 'step' : undefined}>
          <RoleBadge tier={r.tier} locked={!r.reached} />
          <strong>{r.name}</strong>
          {r.current ? (
            <span className="rank-ladder-note">
              <span aria-hidden="true">niv. {level}</span>
              <span className="visually-hidden">ton rôle actuel, niveau {level}</span>
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
