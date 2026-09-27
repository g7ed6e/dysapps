import { Link, useParams } from 'react-router-dom';
import { SUBJECTS, appsBySubject, bestScore, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';
import { RecordTag } from '../components/RecordTag';
import { useProgress } from '../core/ProgressContext';
import { NotFoundPage } from './NotFoundPage';
import { biomesOf, type Classe } from '../blocland/biomes';
import { useBlocland } from '../blocland/BloclandContext';
import { Creature } from '../blocland/Creatures';
import { questProgress } from '../blocland/exercises';
import { ARCHIPELAGOS, archipelagoTitle, isArchipelagoReached, isBiomeUnlocked } from '../blocland/world/archipelago';

export function SubjectPage() {
  const { subject } = useParams();
  const { progress } = useProgress();
  const { state } = useBlocland();
  if (!subject || !(subject in SUBJECTS)) return <NotFoundPage />;
  const info = SUBJECTS[subject as Subject];
  const withIslands = ARCHIPELAGOS.filter((a) => biomesOf(subject as Subject).some((b) => b.classe === a.classe));
  const reachedArchipelagos = withIslands.filter((a) => isArchipelagoReached(a.classe, state.village.bridges));
  const laterArchipelagos = withIslands.filter((a) => !isArchipelagoReached(a.classe, state.village.bridges));
  const laterIslands = biomesOf(subject as Subject).filter((b) => laterArchipelagos.some((a) => a.classe === b.classe)).length;

  return (
    <>
      <Link to="/quetes" className="back-link">
        <Icon name="back" /> Quêtes
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
                <RecordTag record={record} />
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

      {/* Une matière sans île dans Blocland (pas encore) : pas de section vide. */}
      {biomesOf(subject as Subject).length > 0 && (
        <>
          <h2 className="section-title">
            <Icon name="map" /> Dans Blocland
          </h2>
          <p className="section-intro">
            Les îles de {info.title.toLowerCase()} de l’aventure, archipel par archipel, de la 6e à la 3e. Chaque quête réussie donne des blocs pour le village.
          </p>
        </>
      )}
      {/* Les archipels atteints d'abord ; les suivants, repliés : un élève de 6e ne voit pas d'un coup toutes les îles
          jusqu'à la 3e. */}
      {reachedArchipelagos.map((a) => (
        <ArchipelagoIslands key={a.classe} classe={a.classe} subject={subject as Subject} />
      ))}
      {laterArchipelagos.length > 0 && (
        <details className="later-archipelagos">
          <summary>
            Plus tard : {laterArchipelagos.length} archipel{laterArchipelagos.length > 1 ? 's' : ''} à rejoindre ({laterIslands} île
            {laterIslands > 1 ? 's' : ''})
          </summary>
          {laterArchipelagos.map((a) => (
            <ArchipelagoIslands key={a.classe} classe={a.classe} subject={subject as Subject} />
          ))}
        </details>
      )}
    </>
  );
}

/** Les îles d'une matière dans un archipel : leur créature, leurs étoiles, ou ce qu'il faut pour y aller. */
function ArchipelagoIslands({ classe, subject }: { classe: Classe; subject: Subject }) {
  const { state } = useBlocland();
  const islands = biomesOf(subject).filter((b) => b.classe === classe);
  const reached = isArchipelagoReached(classe, state.village.bridges);
  return (
    <section aria-labelledby={`matiere-archipel-${classe}`}>
      <h3 id={`matiere-archipel-${classe}`} className="section-subtitle">
        {archipelagoTitle(classe)}
      </h3>
      <ul className="grid apps blocland-islands">
        {islands.map((biome) => {
          const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
          const stars = biome.exercises.reduce((n, x) => n + (questProgress(biome.id, x.id, state.progress)?.stars ?? 0), 0);
          return (
            <li key={biome.id}>
              <Link to={`/aventure/${biome.id}`} className={`panel app-card biome-${biome.id}${unlocked ? '' : ' locked'}`}>
                <span className="app-icon">
                  <Creature biome={biome.id} className="creature-small" />
                </span>
                <span className="app-title">{biome.name}</span>
                <span className="app-desc">{biome.description}</span>
                <span className={`tag${unlocked ? (stars ? ' tag-ok' : ' tag-new') : ''}`}>
                  {unlocked ? (stars ? `${stars} étoile${stars > 1 ? 's' : ''}` : 'Nouveau') : reached ? 'Ouvrage à construire' : 'Archipel à rejoindre'}
                </span>
                <span className="tag tag-classe">Niveau {biome.classe}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
