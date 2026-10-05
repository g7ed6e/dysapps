import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';

/**
 * La pause proposée par l'horloge de séance (trois exercices ou dix minutes, questions d'assemblage comprises), à la
 * place des boutons d'un bilan de mission ou du résultat d'une question d'assemblage. Le texte s'écoute ; le focus va à
 * « J'arrête pour aujourd'hui », qui revient à l'aventure sans laisser l'écran dans l'historique.
 */
export function SessionPause({ suite, onContinuer }: { suite?: string; onContinuer: () => void }) {
  const arreter = useRef<HTMLAnchorElement>(null);
  const texte = `Tu as bien travaillé. Ton cerveau retient mieux avec des pauses.${suite ? ` ${suite}` : ''}`;
  // Sans preventScroll : le bouton qui reçoit le focus revient dans l'écran (grands réglages, téléphone).
  useEffect(() => {
    arreter.current?.focus();
  }, []);
  return (
    <div className="pause-panel">
      <p>
        <strong>Belle séance !</strong> {texte}
      </p>
      <SpeakButton text={`Belle séance ! ${texte}`} compact />
      <div className="actions">
        <Link ref={arreter} to="/adventure" replace className="button primary">
          <Icon name="check" /> J’arrête pour aujourd’hui
        </Link>
        <button type="button" className="button" onClick={onContinuer}>
          Encore un peu
        </button>
      </div>
    </div>
  );
}
