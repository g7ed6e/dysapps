import { useNavigate } from 'react-router-dom';
import { useOptionalBlocland } from '../game/BloclandContext';
import { ARCHIPELAGOS, archipelagoOf } from '../game/world/archipelago';
import { Icon } from './Icon';

/** Le message du mode bâtisseur, à l'écran titre seulement (./TitleScreen.tsx). */
export const BUILDER_BANNER = 'Mode bâtisseur : ta partie n’est pas enregistrée.';

/** Quitter le mode bâtisseur : la page se recharge sur l'accueil, avec la vraie partie (la sauvegarde n'a pas bougé). */
function quitter() {
  window.location.replace('#/');
  window.location.reload();
}

/**
 * La barre du mode bâtisseur, dans le monde tant qu'il est ouvert : un bouton pour en sortir et, avec `levels` (le monde
 * ouvert, qui n'a pas le sélecteur d'archipel de la grille), un bouton par niveau, qui mène le bonhomme au port de cet
 * archipel (toutes les régions sont reliées dans le bac à sable, ../game/builder.ts).
 */
export function BuilderBar({ levels = false }: { levels?: boolean }) {
  const blocland = useOptionalBlocland();
  const navigate = useNavigate();
  if (!blocland?.batisseur) return null;
  const ici = archipelagoOf(blocland.state.world.place ?? 'french-6e-phonology').classe;
  return (
    <nav className="builder-bar" aria-label="Mode bâtisseur">
      {levels &&
        ARCHIPELAGOS.map((a) => (
          <button
            key={a.classe}
            type="button"
            className={`button${a.classe === ici ? ' primary' : ''}`}
            aria-pressed={a.classe === ici}
            onClick={() => {
              blocland.moveTo(a.port);
              // L'adresse d'une île d'un autre niveau garderait la grille : on revient au monde.
              navigate('/adventure');
            }}
          >
            {a.classe}
          </button>
        ))}
      <button type="button" className="button" onClick={quitter}>
        <Icon name="back" /> Quitter le mode bâtisseur
      </button>
    </nav>
  );
}
