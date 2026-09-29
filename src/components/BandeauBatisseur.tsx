import { useState } from 'react';
import { useOptionalBlocland } from '../blocland/BloclandContext';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';

export const BANDEAU_BATISSEUR = 'Mode bâtisseur : ta partie n’est pas enregistrée.';

/** Quitter le mode bâtisseur : la page se recharge sur l'accueil, avec la vraie partie (la sauvegarde n'a pas bougé). */
function quitter() {
  window.location.replace('#/');
  window.location.reload();
}

/**
 * La bande du mode bâtisseur, sous l'en-tête tant qu'il est ouvert : un bouton pour en sortir, une croix pour la masquer.
 * Masquée, elle ne revient plus ; relancer l'appli (ou recharger la page) quitte aussi le mode.
 */
export function BandeauBatisseur() {
  const [masque, setMasque] = useState(false);
  if (!useOptionalBlocland()?.batisseur || masque) return null;
  return (
    <div className="update-banner">
      <span>{BANDEAU_BATISSEUR}</span>
      <SpeakButton text={BANDEAU_BATISSEUR} />
      <button type="button" className="button" onClick={quitter}>
        <Icon name="back" /> Quitter le mode bâtisseur
      </button>
      <button
        type="button"
        className="button"
        onClick={() => {
          setMasque(true);
          // Le bouton disparaît : le focus va au contenu plutôt que de retomber au début de la page.
          document.getElementById('contenu')?.focus();
        }}
        aria-label="Masquer ce bandeau"
      >
        <Icon name="close" />
      </button>
    </div>
  );
}
