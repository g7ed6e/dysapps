// La rangée de classes du monde (lot 2 de « Toucher le monde », demandée par le mainteneur : changer de classe sans
// fenêtre) : en haut à droite, toujours visible, un bouton par classe dont l'archipel est atteint (6e, 5e…). Un
// toucher y emmène d'un fondu court, sans la cinématique du Bloc-Navire (réservée au premier voyage vers un archipel).
// La classe où l'on est se reconnaît à sa forme (bord épais et coche), pas seulement à sa couleur, et ne se touche pas.
// Rien quand une seule classe est atteinte. Ce qu'il faut pour aller plus loin est dans la fiche du Bloc-Navire.
import { Icon } from '../components/Icon';
import { ARCHIPELAGOS, isArchipelagoReached, type ArchipelagoId } from './world/archipelago';
import { useTextes } from '../universes';

interface Props {
  current: ArchipelagoId;
  bridges: string[];
  /** Aller dans un archipel déjà atteint. */
  onGo: (to: ArchipelagoId) => void;
}

export function ArchipelagoSwitcher({ current, bridges, onGo }: Props) {
  const textes = useTextes();
  const reached = ARCHIPELAGOS.filter((a) => isArchipelagoReached(a.classe, bridges));
  // Une seule classe atteinte : rien à choisir.
  if (reached.length < 2) return null;
  return (
    <ul className="world-archipel" data-couvre="bouton" aria-label="Changer de classe">
      {reached.map((a) =>
        a.classe === current ? (
          <li key={a.classe}>
            <span className="world-archipel-classe ici" aria-current="true">
              <Icon name="check" /> {a.classe}
              <span className="visually-hidden">, les {textes.archipels[a.classe]} : tu es ici</span>
            </span>
          </li>
        ) : (
          <li key={a.classe}>
            <button
              type="button"
              className="button world-archipel-classe"
              aria-label={`Aller en ${a.classe}, les ${textes.archipels[a.classe]}`}
              onClick={() => onGo(a.classe)}
            >
              {a.classe}
            </button>
          </li>
        ),
      )}
    </ul>
  );
}
