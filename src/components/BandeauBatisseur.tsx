import { useOptionalBlocland } from '../blocland/BloclandContext';
import { Icon } from './Icon';
import { SpeakButton } from './SpeakButton';

export const BANDEAU_BATISSEUR = 'Mode bâtisseur : ta partie n’est pas enregistrée.';

/** Quitter le mode bâtisseur : la page se recharge sur l'accueil, avec la vraie partie (la sauvegarde n'a pas bougé). */
function quitter() {
  window.location.replace('#/');
  window.location.reload();
}

/** La bande du mode bâtisseur, sous l'en-tête tant qu'il est ouvert, avec un seul bouton pour en sortir. */
export function BandeauBatisseur() {
  if (!useOptionalBlocland()?.batisseur) return null;
  return (
    <div className="update-banner">
      <span>{BANDEAU_BATISSEUR}</span>
      <SpeakButton text={BANDEAU_BATISSEUR} />
      <button type="button" className="button" onClick={quitter}>
        <Icon name="close" /> Quitter le mode bâtisseur
      </button>
    </div>
  );
}
