// Le menu du village (le menu pause de Blocland) : un panneau à la place de celui d'une île, le monde reste derrière.
// En tête, le rôle et la jauge d'XP (la barre du haut de l'appli n'est pas sur l'écran du monde). Reprendre, puis les
// Réglages et l'Accueil côte à côte (visibles d'emblée, même sur un téléphone), puis la dernière mission, les révisions
// du jour, l'école et les grands endroits de l'appli. L'aide du village se revoit avec le « ? » de la barre du bas.
import { Link } from 'react-router-dom';
import { Icon, type AnyIconName } from '../components/Icon';
import { XpBar } from '../components/XpBar';
import { useProgress } from '../core/ProgressContext';
import { lastPlace } from '../core/lastPlace';
import { MENU_PATH } from '../core/paths';
import { useBlocland } from './BloclandContext';
import { questsToReview } from './review';
import { SCHOOL_PATH, SCHOOL_TITLE } from './School';
import { MONUMENTS_PATH, MONUMENTS_TITLE } from './Monuments';
import { TROPHIES_PATH } from './trophies';
import { ASSEMBLAGE_PATH } from './world/assemblage';
import { useTextes } from '../univers';
import { Commandes } from './Commandes';
import type { BiomeId } from './biomes';

interface Props {
  /** Reprendre : le panneau se ferme, on est dans le village. */
  onClose: () => void;
  /** « Y aller » d'une commande : ouvre le panneau de l'île visée, comme un toucher sur l'île (le monde 3D). */
  onAller?: (island: BiomeId, commande?: string) => void;
}

function Row({ to, icon, title, desc }: { to: string; icon: AnyIconName; title: string; desc?: string }) {
  return (
    <li>
      <Link to={to} className="island-quest">
        <span className="island-quest-icon">
          <Icon name={icon} />
        </span>
        <span className="island-quest-text">
          <span className="island-quest-title">{title}</span>
          {desc && <span className="island-quest-desc">{desc}</span>}
        </span>
      </Link>
    </li>
  );
}

export function MenuSheet({ onClose, onAller }: Props) {
  const { state } = useBlocland();
  const { assemblage } = useTextes();
  const { progress } = useProgress();
  const resume = lastPlace();
  const reviews = questsToReview(state.spaced, state.world.links);
  return (
    <section id="panneau-menu" className="island-sheet menu-sheet" role="dialog" aria-labelledby="menu-titre" aria-modal="true">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="menu-titre" className="island-sheet-title">
            <Icon name="pause" /> Menu
          </h2>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le menu" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="menu-role">
        <XpBar xp={progress.xp} />
      </div>
      <button type="button" className="button primary menu-resume" onClick={onClose} autoFocus>
        <Icon name="play" /> Reprendre
      </button>
      <ul className="island-quests menu-quick" aria-label="Réglages et accueil">
        <Row to="/reglages" icon="settings" title="Réglages" />
        <Row to={MENU_PATH} icon="home" title="Accueil" />
      </ul>
      {(resume || reviews.length > 0) && (
        <ul className="island-quests menu-list" aria-label="Menu">
          {resume && <Row to={resume.path} icon="play" title="Continuer" desc={resume.label} />}
          {reviews.length > 0 && (
            <Row
              to={reviews[0].path}
              icon="history"
              title="À revoir aujourd’hui"
              desc={`${reviews[0].label}${reviews.length > 1 ? `, et ${reviews.length - 1} autre${reviews.length > 2 ? 's' : ''} ensuite` : ''}`}
            />
          )}
        </ul>
      )}
      {/* Les commandes des créatures de l'archipel du bonhomme (GD-7), sous les révisions du jour : « Y aller » seulement,
          dans un pli qui s'ouvre de lui-même quand une commande est prête (directeur artistique). */}
      <Commandes className="menu-commandes" fold="menu" onAller={onAller} />
      <ul className="island-quests menu-list" aria-label="Lieux du village">
        <Row to={SCHOOL_PATH} icon="school" title={SCHOOL_TITLE} desc="Français, maths, anglais" />
        <Row to={MONUMENTS_PATH} icon="castle" title={MONUMENTS_TITLE} desc="Bâtis avec tes blocs" />
        <Row to={ASSEMBLAGE_PATH} icon="hammer" title={assemblage.titre} desc="Assemble tes blocs" />
        <Row to="/quetes" icon="dumbbell" title="Missions" desc="Toutes, par matière" />
        <Row to={TROPHIES_PATH} icon="trophy" title="Succès" desc="Ton rôle, tes trophées" />
      </ul>
    </section>
  );
}
