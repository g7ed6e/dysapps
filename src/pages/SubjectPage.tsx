import { Link, useParams } from 'react-router-dom';
import { subjectInfo, visibleSubjects, type Subject } from '../apps/registry';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { Icon } from '../components/Icon';
import { SubjectApps } from '../components/SubjectApps';
import { NotFoundPage } from './NotFoundPage';
import { UNIVERS } from '../core/univers';
import { biomesOf, missionsJouables, type Classe } from '../blocland/biomes';
import { useBlocland } from '../blocland/BloclandContext';
import { Creature } from '../blocland/Creatures';
import { questProgress } from '../blocland/exercises';
import { ARCHIPELAGOS, archipelagoTitle, isArchipelagoReached, isBiomeUnlocked } from '../blocland/world/archipelago';
import { useTextes } from '../univers';

export function SubjectPage() {
  const { subject } = useParams();
  const { state } = useBlocland();
  const { settings } = useSettings();
  const univers = useUnivers();
  if (!subject || !visibleSubjects(settings.lv2).includes(subject as Subject)) return <NotFoundPage />;
  const info = subjectInfo(subject as Subject, settings.lv2);
  const withIslands = ARCHIPELAGOS.filter((a) => biomesOf(subject as Subject).some((b) => b.classe === a.classe));
  const reachedArchipelagos = withIslands.filter((a) => isArchipelagoReached(a.classe, state.world.links));
  const laterArchipelagos = withIslands.filter((a) => !isArchipelagoReached(a.classe, state.world.links));
  const laterIslands = biomesOf(subject as Subject).filter((b) => laterArchipelagos.some((a) => a.classe === b.classe)).length;

  return (
    <>
      <Link to="/quetes" className="back-link">
        <Icon name="back" /> Missions
      </Link>
      <h1 className={`page-title title-${subject}`}>
        <Icon name={info.icon} /> {info.title}
      </h1>
      <p className="intro">Expédition {info.expedition}.</p>
      <SubjectApps subject={subject as Subject} />

      {/* Une matière sans île dans Blocland (pas encore) : pas de section vide. */}
      {biomesOf(subject as Subject).length > 0 && (
        <>
          <h2 className="section-title">
            <Icon name="map" /> Dans {UNIVERS[univers].nom}
          </h2>
          <p className="section-intro">
            Les îles de {info.title.toLowerCase()} de l’aventure, archipel par archipel, de la 6e à la 3e. Chaque mission réussie donne des blocs pour le village.
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
  const lv2 = useSettings().settings.lv2;
  const { state } = useBlocland();
  const islands = biomesOf(subject).filter((b) => b.classe === classe);
  const reached = isArchipelagoReached(classe, state.world.links);
  const textes = useTextes();
  return (
    <section aria-labelledby={`matiere-archipel-${classe}`}>
      <h3 id={`matiere-archipel-${classe}`} className="section-subtitle">
        {archipelagoTitle(classe, textes.archipels)}
      </h3>
      <ul className="grid apps blocland-islands">
        {islands.map((biome) => {
          const unlocked = isBiomeUnlocked(biome.id, state.world.links);
          const stars = missionsJouables(biome, lv2).reduce((n, x) => n + (questProgress(biome.id, x.id, state.progress)?.stars ?? 0), 0);
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
