import { Link } from 'react-router-dom';
import { SUBJECTS, appsBySubject, type Subject } from '../apps/registry';
import { Creature } from '../blocland/Creatures';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { useProgress } from '../core/ProgressContext';
import { lastPlace } from '../core/lastPlace';
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

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{firstTime ? 'Nouvelle partie' : `Rang ${rank.title}`}</p>
        <h1 className="hero-title">{firstTime ? 'Prêt à jouer ?' : 'On reprend ?'}</h1>
        <p className="hero-text">
          <Syllabified text="Choisis ton terrain. Pas de chrono, des jokers si tu bloques, et de l’XP à chaque réponse." />
        </p>
      </section>

      {/* La dernière quête ouverte, pour reprendre en un toucher. */}
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
          <span className="adventure-title">Blocland</span>
          <span className="adventure-desc">
            <Syllabified text="Reconstruis le village bloc par bloc, puis embarque sur le Bloc-Navire vers les autres archipels." />
          </span>
        </span>
        <span className="subject-count">
          Entrer <Icon name="play" />
        </span>
      </Link>

      <h2 className="section-title">Quêtes par matière</h2>
      <div className="grid subjects">
        {(Object.keys(SUBJECTS) as Subject[]).map((key) => {
          const subject = SUBJECTS[key];
          const available = appsBySubject(key).filter((a) => a.status === 'disponible').length;
          return (
            <Link key={key} to={`/matiere/${key}`} className={`panel subject-card subject-${key}`}>
              <span className="subject-icon">
                <Icon name={subject.icon} size="2.2rem" />
              </span>
              <span className="subject-title">{subject.title}</span>
              <span className="subject-desc">{subject.description}</span>
              <span className="subject-count">
                {available} quête{available > 1 ? 's' : ''} dispo <Icon name="play" />
              </span>
            </Link>
          );
        })}
      </div>

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
