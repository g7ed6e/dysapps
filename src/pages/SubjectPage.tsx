import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, appsBySubject, bestScore, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';
import { useProgress } from '../core/ProgressContext';
import { NotFoundPage } from './NotFoundPage';
import { biomesOf } from '../blocland/biomes';
import { useBlocland } from '../blocland/BloclandContext';
import { Creature } from '../blocland/Creatures';
import { isBiomeUnlocked } from '../blocland/world/archipelago';

export function SubjectPage() {
  const { subject } = useParams();
  const { progress } = useProgress();
  const { state } = useBlocland();
  if (!subject || !(subject in SUBJECTS)) return <NotFoundPage />;
  const info = SUBJECTS[subject as Subject];

  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="back" /> Menu
      </Link>
      <h1 className={`page-title title-${subject}`}>
        <Icon name={info.icon} /> {info.title}
      </h1>
      <ul className="grid apps">
        {appsBySubject(subject as Subject).map((app) => {
          const record = bestScore(progress.apps, app.id);
          const content = (
            <>
              <span className="app-icon">
                <Icon name={app.status === 'bientot' ? 'lock' : app.icon} size="1.8rem" />
              </span>
              <span className="app-title">{app.title}</span>
              <span className="app-desc">{app.description}</span>
              {app.status === 'bientot' ? (
                <span className="tag">Bientôt</span>
              ) : record !== undefined ? (
                <span className="tag tag-ok">Record : {record} %</span>
              ) : (
                <span className="tag tag-new">Nouveau</span>
              )}
            </>
          );
          return (
            <li key={app.id}>
              {app.status === 'disponible' ? (
                <Link to={`/app/${app.id}`} className={`panel app-card subject-${app.subject}`}>
                  {content}
                </Link>
              ) : (
                <div className="panel app-card locked" aria-disabled="true">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">
        <Icon name="map" /> Dans Blocland
      </h2>
      <p className="section-intro">
        Les îles de {info.title.toLowerCase()} de l’aventure, de la 6e à la 3e. Chaque quête réussie donne des blocs pour le village.
      </p>
      <ul className="grid apps blocland-islands">
        {biomesOf(subject as Subject).map((biome) => {
          const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
          const stars = biome.exercises.reduce(
            (n, x) =>
              n +
              Math.max(
                0,
                ...Object.entries(state.progress)
                  .filter(([id]) => id.startsWith(`${biome.id}-${x.id}`))
                  .map(([, p]) => p.stars),
              ),
            0,
          );
          return (
            <li key={biome.id}>
              <Link to={`/aventure/${biome.id}`} className={`panel app-card biome-${biome.id}${unlocked ? '' : ' locked'}`}>
                <span className="app-icon">
                  <Creature biome={biome.id} className="creature-small" />
                </span>
                <span className="app-title">{biome.name}</span>
                <span className="app-desc">{biome.description}</span>
                <span className={`tag${unlocked ? (stars ? ' tag-ok' : ' tag-new') : ''}`}>
                  {unlocked ? (stars ? `${stars} étoile${stars > 1 ? 's' : ''}` : 'Nouveau') : 'Ouvrage à construire'}
                </span>
                <span className="tag tag-classe">Niveau {biome.classe}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
