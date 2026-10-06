import { Link } from 'react-router-dom';
import { SUBJECTS, subjectInfo, visibleSubjects, type Subject } from '../apps/registry';
import { useBlocland } from '../game/BloclandContext';
import { questsToReview } from '../game/review';
import { VillageStageLine } from '../game/VillageStageLine';
import { archipelagoOf, reachedArchipelagos, ARCHIPELAGOS } from '../game/world/archipelago';
import { lienDeLaDestination, nextDestination } from '../game/world/destination';
import { sansCommandes } from '../game/world/requests';
import { Icon } from '../components/Icon';
import { RoleBadge } from '../components/RoleBadge';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useProgress } from '../core/ProgressContext';
import { lastPlace } from '../core/lastPlace';
import { levelFromXp } from '../core/progress';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/universe';
import { nomDuRole, useTextes } from '../universes';

/** Les expéditions du menu ; la LV2 en dernier, la seule qui peut disparaître (« Pas de LV2 »). */
const EXPEDITIONS: Subject[] = ['maths', 'french', 'english', 'history-geography', 'lv2'];

/**
 * Le menu d'Archipéo, dans l'ordre du dossier : l'identité, ton village, « Reprendre l'aventure » vers la prochaine
 * destination, la progression, puis les Expéditions. Une seule action principale ; sur téléphone, les trois
 * premiers blocs tiennent sans défiler.
 */
export function HomePage() {
  const { settings } = useSettings();
  const { progress } = useProgress();
  const { state } = useBlocland();
  const textes = useTextes();
  const rank = levelFromXp(progress.xp);
  const firstTime = progress.totalAnswers === 0;
  const resume = lastPlace();
  const reviews = questsToReview(state.spaced, state.world.links);
  const here = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  // Les commandes (GD-7) ne se suggèrent que dans un univers qui les montre (`commandes` dans ses textes).
  const destination = nextDestination(textes.commandes ? state : sansCommandes(state), textes.archipels, textes.libelles);
  const destinationText = `Prochaine destination : ${destination.name}. ${destination.text}`;
  const reached = reachedArchipelagos(state.world.links).length;
  const univers = UNIVERS[useUnivers()];

  return (
    <>
      <section className="hero hero-compact home-identity">
        <h1 className="hero-title">{univers.nom}</h1>
        <p className="hero-text">
          <Syllabified text={univers.phrase} />
        </p>
        {firstTime && (
          <p className="hero-text">
            <Syllabified text="Explore les îles, relève les défis et reconstruis l’archipel." />
          </p>
        )}
      </section>

      <section className="panel home-village" aria-labelledby="ton-village">
        <h2 id="ton-village" className="home-heading">
          <Icon name="map" /> Ton village : les {textes.archipels[here]}
        </h2>
        <VillageStageLine village={state.world} archipelago={here} withNext={false} />
      </section>

      {firstTime ? (
        // La première fois, le Tutoriel passe devant tout : quatre questions pour prendre les commandes en main.
        <Link to="/app/demo" className="panel adventure-card start-card">
          <span className="subject-icon">
            <Icon name="compass" size="2.2rem" />
          </span>
          <span className="adventure-text">
            <span className="adventure-kicker">Commencer ici</span>
            <span className="adventure-title">Tutoriel</span>
            <span className="adventure-desc">
              <Syllabified text="Quatre questions pour apprendre les boutons : écouter, répondre, prendre un joker." />
            </span>
          </span>
          <span className="subject-count">
            Essayer <Icon name="play" />
          </span>
        </Link>
      ) : (
        <section className="panel home-resume" aria-label="Reprendre l’aventure">
          <Link to={lienDeLaDestination(destination)} className="button primary home-resume-button">
            <Icon name="play" /> Reprendre l’aventure
          </Link>
          <p className="home-destination">
            <SpeakButton text={destinationText} label="Écouter" compact />
            <span>
              <Syllabified text={destinationText} />
            </span>
          </p>
          {(resume || reviews.length > 0) && (
            <ul className="home-resume-links">
              {/* La dernière mission ouverte, pour reprendre en un toucher. */}
              {resume && (
                <li>
                  <Link to={resume.path}>
                    <Icon name="play" /> Ma dernière mission : {resume.label}
                  </Link>
                </li>
              )}
              {/* Les révisions du jour : les items ratés reviennent (J+1, J+3, J+7, J+15), en tête de leur mission. */}
              {reviews.length > 0 && (
                <li>
                  <Link to={reviews[0].path}>
                    <Icon name="history" /> Mes révisions du jour : {reviews[0].label}
                    {reviews.length > 1 && ` (et ${reviews.length - 1} autre${reviews.length > 2 ? 's' : ''})`}
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      <p className="panel home-progress">
        <RoleBadge tier={rank.tier} className="home-role" />
        <strong>
          {nomDuRole(textes, rank.tier)}, niveau {rank.level}
        </strong>
        <span>
          {reached} archipel{reached > 1 ? 's' : ''} sur {ARCHIPELAGOS.length}
        </span>
        <Link to="/succes">
          <Icon name="trophy" /> Succès
        </Link>
      </p>

      {/* Les Expéditions : une matière chacune, ses missions en deux touchers. */}
      <nav className="grid home-menu" aria-label="Menu principal">
        {EXPEDITIONS.filter((id) => visibleSubjects(settings.lv2).includes(id)).map((id) => (
          <Link key={id} to={`/matiere/${id}`} className={`panel menu-tile subject-card subject-${id}`}>
            <span className="subject-icon">
              <Icon name={SUBJECTS[id].icon} size="2.2rem" />
            </span>
            <span className="menu-tile-text">
              <span className="subject-title">{subjectInfo(id, settings.lv2).title}</span>
              <span className="subject-expedition">Expédition {SUBJECTS[id].expedition}</span>
            </span>
          </Link>
        ))}
      </nav>

      <p className="home-links">
        <Link to="/quetes">
          <Icon name="dumbbell" /> Toutes les missions
        </Link>
        <Link to="/reglages">
          <Icon name="settings" /> Réglages
        </Link>
        {!firstTime && (
          <Link to="/app/demo">
            <Icon name="compass" /> Revoir le tutoriel
          </Link>
        )}
      </p>
    </>
  );
}
