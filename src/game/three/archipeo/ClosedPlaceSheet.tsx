// La fiche d'un lieu fermé du monde continu (GD-20, point 3, lot 1 « Relier » ; consultant UX UI) : le panneau d'un lieu
// (`MissionSheet`, le même que celui d'un lieu ouvert), son icône et son nom entier, et une seule rangée, « Relier », le
// prix en chiffre et l'icône des ressources dans le bouton ; dessous, ce que l'élève a, « 3 / 4 ». Quand il en manque, le
// bouton reste à sa place, inactif par sa forme (délavé, trait en tirets), focalisable et lu par la voix (`aria-disabled`,
// jamais `disabled`) ; aucune phrase d'échec. Il n'est mis en avant que pour la liaison suggérée. Aucune mission d'un lieu
// fermé ne s'y montre ni ne s'y joue. Toucher le lieu fermé, sa passerelle démontée ou son cadenas sur la Carte l'ouvre.
// Un lieu pas encore reliable (après un voisin, choix du mainteneur du 17 octobre 2026 ; avis du consultant UX UI) : ni
// « Relier », ni prix, ni « 3 / 4 » ; le seul cadenas, puis, à la place de la rangée, un bouton secondaire, l'icône et le
// nom entier du voisin à relier d'abord et une flèche, qui ferme cette fiche et ouvre celle du voisin (sans marche) ; la
// voix dit « [Lieu] : relie d'abord [voisin]. ».
import { useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import { getBiome } from '../../biomes';
import type { OpenPlace, PlaceId } from '../../world/continu/plan6e';
import { MissionSheet, useOpenPanel } from './PortPanels';

interface Props {
  place: OpenPlace;
  /** Pas encore reliable : le voisin à relier d'abord (le plus proche de Kéo) ; `null`, le lieu est reliable. */
  after?: OpenPlace | null;
  /** Ouvre la fiche du voisin à relier d'abord. */
  onAfter?(place: PlaceId): void;
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

/** Ce que dit la voix d'un lieu pas encore reliable : « La Turbine : relie d'abord les Écluses. » */
export function afterLabel(place: OpenPlace, neighbour: OpenPlace): string {
  return `${place.name} : relie d'abord ${neighbour.name.charAt(0).toLowerCase()}${neighbour.name.slice(1)}.`;
}

/**
 * La phrase d'un lieu qui devient reliable, son voisin relié (GD-20, point 3, lot 2), accordée à son nom : « La Turbine
 * peut être reliée. », « Le Chantier naval peut être relié. », « Les Écluses peuvent être reliées. »
 */
export function linkableLabel(place: OpenPlace): string {
  const plural = place.agree.endsWith('p');
  const ending = `${place.agree.startsWith('f') ? 'e' : ''}${plural ? 's' : ''}`;
  return `${place.name} ${plural ? 'peuvent' : 'peut'} être relié${ending}.`;
}

export function ClosedPlaceSheet({ place, after, onAfter, price, have, suggested, onLink, onClose }: Props) {
  useOpenPanel(onClose);
  // Le focus va sur le bouton d'action à l'ouverture, et au passage d'une fiche à celle du voisin (consultant UX UI) :
  // « Relier », ou le voisin à relier d'abord.
  const action = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    action.current?.focus();
  }, [place.id, after?.id]);
  const biome = getBiome(place.island);
  const ready = have >= price;
  const className = `place-sheet closed-place-sheet${biome ? ` biome-${biome.id}` : ''}`;
  if (after)
    return (
      <MissionSheet id="panneau-lieu-ferme" className={className} icon={biome?.icon ?? 'map'} title={place.name} onClose={onClose}>
        <div className="closed-place-row">
          {/* Le seul cadenas : un cadenas d'ordre, sans prix ; la phrase est dans la voix du bouton. */}
          <span className="closed-place-lock" aria-hidden="true">
            <Icon name="lock" />
          </span>
          <button ref={action} type="button" className="button closed-place-after" aria-label={afterLabel(place, after)} onClick={() => onAfter?.(after.id)}>
            <Icon name={getBiome(after.island)?.icon ?? 'map'} />
            <span className="closed-place-word">{after.name}</span>
            <Icon name="chevronRight" />
          </button>
        </div>
      </MissionSheet>
    );
  return (
    <MissionSheet id="panneau-lieu-ferme" className={className} icon={biome?.icon ?? 'map'} title={place.name} onClose={onClose}>
      <div className="closed-place-row">
        <button
          ref={action}
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
