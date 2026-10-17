// La fiche d'un lieu fermé du monde continu (GD-20, point 3, lot 1 « Relier » ; consultant UX UI) : le panneau d'un lieu
// (`MissionSheet`, le même que celui d'un lieu ouvert), son icône et son nom entier, et une seule rangée, « Relier », le
// prix en chiffre et l'icône des ressources dans le bouton ; dessous, ce que l'élève a, « 3 / 4 ». Quand il en manque, le
// bouton reste à sa place, inactif par sa forme (délavé, trait en tirets), focalisable et lu par la voix (`aria-disabled`,
// jamais `disabled`) ; aucune phrase d'échec. Il n'est mis en avant que pour la liaison suggérée. Aucune mission d'un lieu
// fermé ne s'y montre ni ne s'y joue. Toucher le lieu fermé, sa passerelle démontée ou son cadenas sur la Carte l'ouvre.
import { Icon } from '../../../components/Icon';
import { getBiome } from '../../biomes';
import type { OpenPlace } from '../../world/continu/plan6e';
import { MissionSheet, useOpenPanel } from './PortPanels';

interface Props {
  place: OpenPlace;
  /** Le prix de la liaison (`LINK_PRICE`, 4 ressources en 6e). */
  price: number;
  /** Les ressources de l'élève qui paient une liaison (`payableBlocks`). */
  have: number;
  /** C'est la liaison suggérée : « Relier » est mis en avant (le seul signe mis en avant). */
  suggested: boolean;
  onLink(): void;
  onClose(): void;
}

/** Ce que dit « Relier » à la voix : le prix, ce que l'élève a, et ce qui manque, en mots. */
export function linkLabel(price: number, have: number): string {
  const missing = price - have;
  return `Relier : ${price} ressources. Tu en as ${have}${missing > 0 ? `, il en manque ${missing}` : ''}.`;
}

export function ClosedPlaceSheet({ place, price, have, suggested, onLink, onClose }: Props) {
  useOpenPanel(onClose);
  const biome = getBiome(place.island);
  const ready = have >= price;
  return (
    <MissionSheet id="panneau-lieu-ferme" className={`place-sheet closed-place-sheet${biome ? ` biome-${biome.id}` : ''}`} icon={biome?.icon ?? 'map'} title={place.name} onClose={onClose}>
      <div className="closed-place-row">
        <button
          type="button"
          className={`button closed-place-link${suggested ? ' primary' : ''}`}
          aria-disabled={ready ? undefined : 'true'}
          aria-label={linkLabel(price, have)}
          onClick={() => {
            if (ready) onLink();
          }}
        >
          <Icon name="ouvrage" />
          <span className="closed-place-word">Relier</span>
          <span className="closed-place-price">
            <Icon name="cube" /> {price}
          </span>
        </button>
        {/* Ce que l'élève a, sur ce que coûte la liaison : le manque se lit au chiffre, jamais au rouge seul. */}
        <p className="closed-place-have" aria-hidden="true">
          <Icon name="cube" /> {Math.min(have, price)} / {price}
        </p>
      </div>
    </MissionSheet>
  );
}
