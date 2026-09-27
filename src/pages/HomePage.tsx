import { Link } from 'react-router-dom';
import { Creature } from '../blocland/Creatures';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { useProgress } from '../core/ProgressContext';
import { lastPlace } from '../core/lastPlace';
import { questsToReview } from '../blocland/review';
import { levelFromXp } from '../core/progress';
import { useBlocland } from '../blocland/BloclandContext';
import { canLaunch, currentStage } from '../blocland/engine';

export function HomePage() {
  const { progress } = useProgress();
  const { state } = useBlocland();
  const rank = levelFromXp(progress.xp);
  const firstTime = progress.totalAnswers === 0;
  const stage = currentStage(state);
  const shipReady = Boolean(stage && canLaunch(state, stage).ok);
  const resume = lastPlace();
  const reviews = questsToReview(state.spaced, state.village.bridges);

  return (
    <>
      {/* Le menu tient sur un écran : au retour, le bandeau d'accueil se réduit à son titre. */}
      <section className={`hero${firstTime ? '' : ' hero-compact'}`}>
        <p className="hero-kicker">{firstTime ? 'Nouvelle partie' : `Rang ${rank.title}`}</p>
        <h1 className="hero-title">{firstTime ? 'Prêt à jouer\u00a0?' : 'On reprend\u00a0?'}</h1>
        {firstTime && (
          <p className="hero-text">
            <Syllabified text="Choisis ton terrain. Pas de chrono, des jokers si tu bloques, et de l’XP à chaque réponse." />
          </p>
        )}
      </section>

      {/* La dernière mission ouverte, pour reprendre en un toucher. */}
      {!firstTime && resume && (
        <Link to={resume.path} className="panel adventure-card resume-card">
          <span className="subject-icon">
            <Icon name="play" size="2.2rem" />
          </span>
          <span className="adventure-text">
            <span className="adventure-kicker">Continuer</span>
            <span className="adventure-title">{resume.label}</span>
          </span>
          <span className="subject-count">
            Reprendre <Icon name="play" />
          </span>
        </Link>
      )}

      {/* Les révisions du jour : les items ratés reviennent (J+1, J+3, J+7, J+15), en tête de leur mission. */}
      {reviews.length > 0 && (
        <Link to={reviews[0].path} className="panel adventure-card review-card">
          <span className="subject-icon">
            <Icon name="history" size="2.2rem" />
          </span>
          <span className="adventure-text">
            <span className="adventure-kicker">À revoir aujourd’hui</span>
            <span className="adventure-title">{reviews[0].label}</span>
            {reviews.length > 1 && (
              <span className="adventure-desc">
                Et {reviews.length - 1} autre{reviews.length > 2 ? 's' : ''} mission{reviews.length > 2 ? 's' : ''} ensuite.
              </span>
            )}
          </span>
          <span className="subject-count">
            Réviser <Icon name="play" />
          </span>
        </Link>
      )}

      {/* La première fois, le Tutoriel passe devant tout : quatre questions pour prendre les commandes en main. */}
      {firstTime && (
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
      )}

      <Link to="/aventure" className="panel adventure-card">
        <Creature biome="foret" className="creature-small" />
        <span className="adventure-text">
          <span className="adventure-kicker">{shipReady ? 'Le Bloc-Navire est prêt !' : 'Aventure'}</span>
          <span className="adventure-title">Archipéo</span>
          <span className="adventure-desc">
            <Syllabified text="Reconstruis le village bloc par bloc, puis embarque sur le Bloc-Navire vers les autres archipels." />
          </span>
        </span>
        <span className="subject-count">
          Entrer <Icon name="play" />
        </span>
      </Link>

      {/* Le menu principal : trois grosses tuiles, toujours les mêmes, comme l'écran d'accueil d'un jeu. */}
      <nav className="grid home-menu" aria-label="Menu principal">
        <Link to="/quetes" className="panel menu-tile subject-card">
          <span className="subject-icon">
            <Icon name="dumbbell" size="2.2rem" />
          </span>
          <span className="subject-title">Missions</span>
        </Link>
        <Link to="/succes" className="panel menu-tile subject-card">
          <span className="subject-icon">
            <Icon name="trophy" size="2.2rem" />
          </span>
          <span className="subject-title">Succès</span>
        </Link>
        <Link to="/reglages" className="panel menu-tile subject-card">
          <span className="subject-icon">
            <Icon name="settings" size="2.2rem" />
          </span>
          <span className="subject-title">Réglages</span>
        </Link>
      </nav>

      {!firstTime && (
        <p className="home-tutorial">
          <Link to="/app/demo">
            <Icon name="compass" /> Revoir le tutoriel
          </Link>
        </p>
      )}
    </>
  );
}
