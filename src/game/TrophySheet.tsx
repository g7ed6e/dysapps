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
import { Sheet } from './Sheet';

/**
 * `title` : le nom de la salle dans le monde continu (GD-20, lot 2), sinon celui de la grille ; `stayInWorld` : sans
 * le lien qui sort du monde (le monde continu n'a pas de retour depuis la page Succès).
 */
export function TrophySheet({ onClose, title = TROPHIES_TITLE, stayInWorld = false }: { onClose: () => void; title?: string; stayInWorld?: boolean }) {
  const { progress } = useProgress();
  const earned = BADGES.filter((b) => progress.badges[b.id]).length;
  const says = earned
    ? `Chaque succès gagné pose un trophée dans la salle : ${earned} sur ${BADGES.length}. L’or pour tes exploits, le cristal pour tes rôles, le quartz pour les Gardiens, les lentilles pour les voyages.`
    : `La salle est vide pour l’instant. Chaque succès gagné y posera un trophée : il y en a ${BADGES.length} à gagner.`;
  const { settings, speak } = useSettings();
  // Le texte visible (le compte des trophées) est lu à voix haute une fois, à l'entrée ; l'accueil entier est sur
  // « Écouter », dans le pli.
  useEffect(() => {
    if (settings.autoRead) speak(frenchTypography(`${title} : ${earned} trophée${earned > 1 ? 's' : ''} sur ${BADGES.length}.`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Sheet id="panneau-trophees" className="trophy-sheet" titleId="trophees-titre" icon="trophy" title={title} subtitle={<>{earned} / {BADGES.length} trophées</>} onClose={onClose}>
      {/* L'accueil de la salle, écrit dans un pli avec Écouter : les trophées se voient tout de suite. */}
      <details className="sheet-more">
        <summary>En savoir plus</summary>
        <p>
          <Syllabified text={says} />
          <SpeakButton text={says} label="Écouter" compact />
        </p>
      </details>
      <ProgressBody />
      {!stayInWorld && (
        <p className="school-more">
          <Link to="/succes">
            <Icon name="trophy" /> La page Succès, hors du village
          </Link>
        </p>
      )}
    </Sheet>
  );
}
