import { rankLadder } from '../core/progress';
import { Icon } from './Icon';
import { RoleBadge } from './RoleBadge';
import { nomDuRole, useTextes } from '../universes';

/** Les cinq rôles, dans les mots de l'univers affiché (Apprenti à Architecte dans Blocland) : atteints en couleur, à venir en pointillés avec leur niveau, le rôle actuel encadré. */
export function RankLadder({ level }: { level: number }) {
  const textes = useTextes();
  return (
    <ol className="rank-ladder" aria-label="Rôles">
      {rankLadder(level).map((r) => (
        <li key={r.tier} className={r.reached ? 'reached' : 'locked'} aria-current={r.current ? 'step' : undefined}>
          <RoleBadge tier={r.tier} locked={!r.reached} />
          <strong>{nomDuRole(textes, r.tier)}</strong>
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
