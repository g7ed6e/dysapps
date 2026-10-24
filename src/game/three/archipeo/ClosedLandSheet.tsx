// La fiche d'une terre fermée du monde continu (GD-20, point 3, « vraies terres, vrais ponts » ; consultant UX UI) : le
// panneau d'un lieu (`MissionSheet`), le nom entier de la terre pour titre, une rangée des icônes de ses lieux, sans
// phrase (leur nom dessous au grand texte seulement), puis une seule ligne, « Relier », le prix en chiffre et l'icône
// des ressources dans le bouton, et à côté ce que l'élève a, « 8 / 12 » ; au plus grand texte, à 667 × 375, la fiche
// tient sans défiler (référent dys, consultant UX UI, relecture du lot 1). Quand il en manque, le bouton reste à sa place,
// inactif par sa forme (délavé, trait en tirets), focalisable et lu par la voix (`aria-disabled`, jamais `disabled`) ;
// aucune phrase d'échec. Il n'est mis en avant que pour le pont suggéré. Aucune mission d'une terre fermée ne s'y montre
// ni ne s'y joue. Toucher un lieu de la terre, son pont ou son cadenas sur la Carte l'ouvre. Une terre pas encore
// reliable (le Large avant le Couchant, les Crêtes avant le Levant) : ni « Relier », ni prix, ni « 8 / 12 » ; le seul
// cadenas, puis sur la même ligne un bouton secondaire, le nom entier de la terre à relier d'abord et une flèche, qui
// ferme cette fiche et ouvre la sienne (sans marche) ; la voix dit « Le Large : relie d'abord le Couchant. ».
import { useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import { getBiome } from '../../biomes';
import { landById, type LinkedLand } from '../../world/continu/lands';
import { placeById } from '../../world/continu/levelPlan';
import { MissionSheet, useOpenPanel } from './PortPanels';

interface Props {
  land: LinkedLand;
  /** Pas encore reliable : la terre à relier d'abord ; `null`, la terre est reliable. */
  after?: LinkedLand | null;
  /** Ouvre la fiche de la terre à relier d'abord. */
  onAfter?(land: LinkedLand): void;
  /** Le prix de la terre (`landPrice` : 4 ressources par lieu en 6e). */
  price: number;
  /** Les ressources de l'élève qui paient une liaison (`payableBlocks`). */
  have: number;
  /** C'est le pont suggéré : « Relier » est mis en avant (le seul signe mis en avant). */
  suggested: boolean;
  onLink(): void;
  onClose(): void;
}

/** Ce que dit « Relier » à la voix : le prix, ce que l'élève a, et ce qui manque, en mots. */
export function linkLabel(price: number, have: number): string {
  const missing = price - have;
  return `Relier : ${price} ressources. Tu en as ${have}${missing > 0 ? `, il en manque ${missing}` : ''}.`;
}

/** Le nom d'une terre au milieu d'une phrase : son article en minuscule (« le Couchant »). */
const inSentence = (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}`;

/** Ce que dit la voix d'une terre pas encore reliable : « Le Large : relie d'abord le Couchant. » */
export function afterLabel(land: LinkedLand, first: LinkedLand): string {
  return `${landById(land).name} : relie d'abord ${inSentence(landById(first).name)}.`;
}

/** L'action d'une terre fermée qu'on peut relier, dans la bulle du monde quand rien d'autre n'attend : « Relier le Bastion ». */
export const linkActionLabel = (land: LinkedLand): string => `Relier ${inSentence(landById(land).name)}`;

/** La phrase d'une terre qui devient reliable, celle d'avant reliée : « Le pont des Crêtes peut être rebâti. » */
export const linkableLabel = (land: LinkedLand): string => {
  const name = landById(land).bridgeName ?? '';
  // « La cabine de la Montée peut être rebâtie. »
  return `${name} peut être ${name.startsWith('La ') ? 'rebâtie' : 'rebâti'}.`;
};

/**
 * Ce que dit la voix d'une terre fermée, de son cadenas ou d'un de ses lieux : son passage, par son nom (« Le Couchant :
 * fermé, le pont du Couchant est à rebâtir. », « Les Aiguilles : fermé, la cabine de la Montée est à rebâtir. ») ; une
 * terre qui attend une autre terre (`after`), la phrase d'ordre (`afterLabel`), jamais un passage qu'on ne peut pas
 * encore rebâtir (référent dys, relecture des restes du 5e).
 */
export const closedLandLabel = (land: LinkedLand, after: LinkedLand | null = null): string =>
  after ? afterLabel(land, after) : `${landById(land).name} : fermé, ${inSentence(landById(land).bridgeName ?? 'Le pont')} est à rebâtir.`;

export function ClosedLandSheet({ land, after, onAfter, price, have, suggested, onLink, onClose }: Props) {
  useOpenPanel(onClose);
  // Le focus va sur le bouton d'action à l'ouverture, et au passage d'une fiche à l'autre (consultant UX UI) : « Relier »,
  // ou la terre à relier d'abord.
  const action = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    action.current?.focus();
  }, [land, after]);
  const def = landById(land);
  const ready = have >= price;
  const className = 'place-sheet closed-land-sheet';
  // Ses lieux : une icône chacun, leur nom dessous (montré au grand texte seulement, hors d'un écran bas ; toujours lu
  // par la voix, le nom de chaque lieu aussi dans son `aria-label` : référent dys).
  const places = (
    <ul className="closed-land-places">
      {def.places.map((id) => {
        const place = placeById(id);
        return (
          <li key={id} aria-label={place.name}>
            <Icon name={getBiome(place.island)?.icon ?? 'map'} />
            <span className="closed-land-place-name">{place.name}</span>
          </li>
        );
      })}
    </ul>
  );
  if (after)
    return (
      <MissionSheet id="panneau-terre-fermee" className={className} icon="map" title={def.name} onClose={onClose}>
        {places}
        <div className="closed-place-row">
          {/* Le seul cadenas : un cadenas d'ordre, sans prix ; la phrase est dans la voix du bouton. */}
          <span className="closed-place-lock" aria-hidden="true">
            <Icon name="lock" />
          </span>
          <button ref={action} type="button" className="button closed-place-after" aria-label={afterLabel(land, after)} onClick={() => onAfter?.(after)}>
            <span className="closed-place-word">{landById(after).name}</span>
            <Icon name="chevronRight" />
          </button>
        </div>
      </MissionSheet>
    );
  return (
    <MissionSheet id="panneau-terre-fermee" className={className} icon="map" title={def.name} onClose={onClose}>
      {places}
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
        {/* Ce que l'élève a, sur ce que coûte la terre : le manque se lit au chiffre, jamais au rouge seul. */}
        <p className="closed-place-have" aria-hidden="true">
          <Icon name="cube" /> {Math.min(have, price)} / {price}
        </p>
      </div>
    </MissionSheet>
  );
}
