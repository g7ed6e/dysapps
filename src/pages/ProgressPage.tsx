import { Link } from 'react-router-dom';
import { subjectInfo, visibleSubjects } from '../apps/registry';
import { useSettings } from '../core/SettingsContext';
import { useBlocland } from '../blocland/BloclandContext';
import { Stars } from '../blocland/Stars';
import { BADGES, levelFromXp } from '../core/progress';
import { useProgress } from '../core/ProgressContext';
import { subjectProgress, type SubjectProgress } from '../core/subjectProgress';
import { Icon } from '../components/Icon';
import { RecordTag } from '../components/RecordTag';
import { RankLadder } from '../components/RankLadder';
import { XpBar } from '../components/XpBar';
import { useTextes } from '../univers';

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Une matière : sa jauge d'étoiles, ses chiffres, et les missions à retravailler (un lien les relance). */
function SubjectPanel({ data }: { data: SubjectProgress }) {
  const { settings } = useSettings();
  const info = subjectInfo(data.subject, settings.lv2);
  const { earned, max } = data.stars;
  const percent = max ? Math.round((earned / max) * 100) : 0;
  const textes = useTextes();
  const titleId = `matiere-${data.subject}`;
  const more = data.reworkTotal - data.rework.length;
  return (
    <section className={`panel subject-progress subject-${data.subject}`} aria-labelledby={titleId}>
      <h3 id={titleId} className={`subject-progress-title title-${data.subject}`}>
        <Icon name={info.icon} /> {info.title}
      </h3>
      {/* Une matière sans île dans Blocland (pas encore) : seulement ses applis. */}
      {max > 0 && (
        <>
          <div
            className="xp-track"
            role="progressbar"
            aria-label={`Étoiles en ${info.title}`}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={earned}
            aria-valuetext={`${plural(earned, 'étoile')} sur ${max}`}
          >
            <div className="xp-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="subject-progress-detail">
            <Icon name="star" /> {earned} / {max} étoiles dans Archipéo
          </p>
        </>
      )}
      <ul className="subject-progress-facts">
        {max > 0 && (
          <>
            <li className="tag">
              {data.islands.open} / {data.islands.total} îles ouvertes
            </li>
            <li className="tag">
              {textes.libelles.progres(data.guardians.beaten, data.guardians.total)}
            </li>
          </>
        )}
        {data.apps
          .filter((a) => a.record !== undefined)
          .map((a) => (
            <li key={a.id} className="tag tag-ok">
              {a.title} : record {a.record}{' '}%
            </li>
          ))}
      </ul>

      <h4 className="subject-progress-heading">
        <Icon name="replay" /> À retravailler
      </h4>
      {data.rework.length ? (
        <ul className="island-quests" aria-label={`À retravailler en ${info.title}`}>
          {data.rework.map((r) => (
            <li key={r.id}>
              <Link to={r.href} className="island-quest" aria-label={`Reprendre ${r.title}${r.kind === 'quete' ? `, ${r.where}` : ''}`}>
                <span className="island-quest-icon">
                  <Icon name="replay" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{r.title}</span>
                  <span className="island-quest-desc">{r.kind === 'quete' ? r.where : 'Appli'}</span>
                </span>
                {r.kind === 'quete' ? (
                  <Stars count={r.stars} label={`${plural(r.stars, 'étoile')} sur 3`} />
                ) : (
                  <RecordTag record={r.record} className="tag subject-progress-record" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="subject-progress-empty">Rien à reprendre pour l’instant.</p>
      )}
      {more > 0 && <p className="subject-progress-more">Et {more > 1 ? `${more} autres missions` : 'une autre mission'} à reprendre.</p>}
      <Link to={`/matiere/${data.subject}`} className="button subject-progress-link">
        <Icon name={info.icon} /> Voir la matière
      </Link>
    </section>
  );
}

export function ProgressPage() {
  return (
    <>
      <h1 className="page-title">Profil</h1>
      <ProgressBody />
    </>
  );
}

/** Le profil : rôle, chiffres, étoiles par matière, succès. La page Succès et la salle des trophées du village le montrent. */
export function ProgressBody() {
  const { progress } = useProgress();
  const { state } = useBlocland();
  const { settings } = useSettings();
  const subjects = visibleSubjects(settings.lv2).map((s) => subjectProgress(s, progress.apps, state));
  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  const rate = progress.totalAnswers ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100) : 0;

  return (
    <>
      <div className="panel">
        <XpBar xp={progress.xp} large />
        <RankLadder level={levelFromXp(progress.xp).level} />
        <dl className="stats">
          <div>
            <dt>XP total</dt>
            <dd>{progress.xp}</dd>
          </div>
          <div>
            <dt>Missions</dt>
            <dd>{progress.sessionsCompleted}</dd>
          </div>
          <div>
            <dt>Réponses</dt>
            <dd>{progress.totalAnswers}</dd>
          </div>
          <div>
            <dt>Précision</dt>
            <dd>{rate} %</dd>
          </div>
          <div>
            <dt>Meilleur combo</dt>
            <dd>x{progress.bestStreak}</dd>
          </div>
          <div>
            <dt>Bâtiments</dt>
            <dd>{progress.plansCompleted}</dd>
          </div>
        </dl>
      </div>

      <h2 className="section-title">
        <Icon name="target" /> Par matière
      </h2>
      <p className="section-intro">Tes étoiles matière par matière, et les missions à reprendre pour progresser : touche-en une pour la rejouer.</p>
      <div className="grid subject-progress-list">
        {subjects.map((data) => (
          <SubjectPanel key={data.subject} data={data} />
        ))}
      </div>

      <h2 className="section-title">
        Succès {earned} / {BADGES.length}
      </h2>
      <ul className="grid badges">
        {BADGES.map((b) => {
          const date = progress.badges[b.id];
          return (
            <li key={b.id} className={`panel badge${date ? ' earned' : ''}`}>
              <span className="badge-icon">
                <Icon name={date ? b.icon : 'lock'} size="1.8rem" />
              </span>
              <strong>{b.title}</strong>
              <span>{b.description}</span>
              <span className="visually-hidden">{date ? 'Débloqué' : 'Verrouillé'}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
