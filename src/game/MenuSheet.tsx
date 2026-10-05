// Le menu du village (le menu pause de Blocland) : en plein écran par-dessus le monde, qui reste derrière. En tête, le
// rôle et la jauge d'XP (Blocland n'a pas de barre du haut). Puis la dernière mission, les révisions du jour, les
// commandes, l'école, les grands endroits de l'appli et le Tutoriel ; les Réglages tout en bas, à part (mot du
// mainteneur, 4 octobre 2026, qui reprend le brief de l'ancienne #282). La croix ou Échap le referment : plus de
// « Reprendre ». L'aide du village se revoit avec le « ? » de la barre du bas.
import { useEffect, useEffectEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type AnyIconName } from '../components/Icon';
import { XpBar } from '../components/XpBar';
import { useProgress } from '../core/ProgressContext';
import { lastPlace } from '../core/lastPlace';
import { useBlocland } from './BloclandContext';
import { questsToReview } from './review';
import { SCHOOL_PATH, SCHOOL_TITLE } from './School';
import { MONUMENTS_PATH, MONUMENTS_TITLE } from './Monuments';
import { TROPHIES_PATH } from './trophies';
import { ASSEMBLAGE_PATH } from './world/assembly';
import { useTextes } from '../universes';
import { Requests } from './Requests';
import type { BiomeId } from './biomes';
import { Sheet } from './Sheet';

interface Props {
  /** La croix ou Échap : le menu se ferme, on est dans le village. */
  onClose: () => void;
  /** « Y aller » d'une commande : ouvre le panneau de l'île visée, comme un toucher sur l'île (le monde 3D). */
  onAller?: (island: BiomeId, commande?: string) => void;
  /** « Aide du village » : le menu se ferme et les trois bulles du début reviennent (plus de « ? » dans la barre). */
  onAide?: () => void;
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

export function MenuSheet({ onClose, onAller, onAide }: Props) {
  const { state } = useBlocland();
  const { assemblage } = useTextes();
  const { progress } = useProgress();
  const resume = lastPlace();
  const reviews = questsToReview(state.spaced, state.world.links);
  // Échap referme le menu, comme la croix ; la touche est prise à la capture, avant les écouteurs des mots ouverts
  // dessous (baleine, rallumage), qui ne se ferment pas avec lui.
  const toucheEchap = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    onClose();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => toucheEchap(e);
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  return (
    <Sheet id="panneau-menu" className="menu-sheet" titleId="menu-titre" icon="menu" title="Menu" closeLabel="Fermer le menu" autoFocusClose onClose={onClose}>
      <div className="menu-role">
        <XpBar xp={progress.xp} />
      </div>
      {(resume || reviews.length > 0) && (
        <ul className="island-quests menu-list" aria-label="Menu">
          {resume && <Row to={resume.path} icon="play" title="Ma dernière mission" desc={resume.label} />}
          {reviews.length > 0 && (
            <Row
              to={reviews[0].path}
              icon="history"
              title="Mes révisions du jour"
              desc={`${reviews[0].label}${reviews.length > 1 ? `, et ${reviews.length - 1} autre${reviews.length > 2 ? 's' : ''} ensuite` : ''}`}
            />
          )}
        </ul>
      )}
      {/* Les commandes des créatures de l'archipel du bonhomme (GD-7), sous les révisions du jour : « Y aller » seulement,
          dans un pli qui s'ouvre de lui-même quand une commande est prête (directeur artistique). */}
      <Requests className="menu-commandes" fold="menu" onAller={onAller} />
      <ul className="island-quests menu-list" aria-label="Lieux du village">
        <Row to={SCHOOL_PATH} icon="school" title={SCHOOL_TITLE} desc="Français, maths, anglais" />
        <Row to={MONUMENTS_PATH} icon="castle" title={MONUMENTS_TITLE} desc="Bâtis avec tes blocs" />
        <Row to={ASSEMBLAGE_PATH} icon="hammer" title={assemblage.titre} desc="Assemble tes blocs" />
        <Row to="/quetes" icon="dumbbell" title="Missions" desc="Toutes, par matière" />
        <Row to={TROPHIES_PATH} icon="trophy" title="Succès" desc="Ton rôle, tes trophées" />
        <Row to="/app/demo" icon="compass" title="Tutoriel" desc="Prendre les commandes en main" />
        {onAide && (
          <li>
            <button type="button" className="island-quest" onClick={onAide}>
              <span className="island-quest-icon">
                <Icon name="help" />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">Aide du village</span>
                <span className="island-quest-desc">Revois les conseils du début</span>
              </span>
            </button>
          </li>
        )}
      </ul>
      {/* Les Réglages tout en bas, à part, sous un trait. */}
      <ul className="island-quests menu-end" aria-label="Réglages">
        <Row to="/reglages" icon="settings" title="Réglages" />
      </ul>
    </Sheet>
  );
}
