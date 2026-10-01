// La salle des trophées du village : le profil (la page Succès) en panneau, le monde derrière.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { BADGES } from '../core/progress';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { frenchTypography } from '../components/math/RichText';
import { ProgressBody } from '../pages/ProgressPage';
import { TROPHIES_TITLE } from './trophies';

export function TrophySheet({ onClose }: { onClose: () => void }) {
  const { progress } = useProgress();
  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  const says = earned
    ? `Chaque succès gagné pose un trophée dans la salle : ${earned} sur ${BADGES.length}. L’or pour tes exploits, le cristal pour tes rôles, le quartz pour les Gardiens, les lentilles pour les voyages.`
    : `La salle est vide pour l’instant. Chaque succès gagné y posera un trophée : il y en a ${BADGES.length} à gagner.`;
  const { settings, speak } = useSettings();
  // Lu à voix haute une fois, à l'entrée.
  useEffect(() => {
    if (settings.autoRead) speak(frenchTypography(says));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section id="panneau-trophees" className="island-sheet trophy-sheet" role="dialog" aria-labelledby="trophees-titre" aria-modal="false">
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="trophees-titre" className="island-sheet-title">
            <Icon name="trophy" /> {TROPHIES_TITLE}
          </h2>
          <p className="island-sheet-module">
            {earned} / {BADGES.length} trophées
          </p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {/* L'accueil de la salle, écrit dans un pli avec Écouter : les trophées se voient tout de suite. */}
      <details className="sheet-more">
        <summary>En savoir plus</summary>
        <p>
          <Syllabified text={says} />
          <SpeakButton text={says} label="Écouter" compact />
        </p>
      </details>
      <ProgressBody />
      <p className="school-more">
        <Link to="/succes">
          <Icon name="trophy" /> La page Succès, hors du village
        </Link>
      </p>
    </section>
  );
}
