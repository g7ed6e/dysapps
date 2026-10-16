// Les étiquettes de la Carte des lieux ouverts (piste 1, lot 3) : Kéo (une pastille unie à sa silhouette et « Toi »), le
// nom de chaque lieu ouvert et l'icône de l'état de sa construction (un bouton qui y mène, GD-20, lot 1 ; le mot de
// l'état, accordé au nom, est dit par le bouton), le cadenas de chaque lieu fermé et son nom atténué dessous (un
// toucher : la page dit « Fermé pour l'instant », au-dessus de « Retour »). Rien n'est écrit dans la 3D : la scène
// donne les points à l'écran, posés ici sans passer par React ; aucune étiquette n'en recouvre une autre ni ne passe
// sur la colonne des accès directs ou un bouton (`layoutMapLabels`, world/continu/map.ts) ; trop serrée, une pastille
// se serre, son nom sur deux lignes, puis cherche plus loin ; sans aucune place, elle se réduit à son icône. Les tailles
// sont relues seulement quand une étiquette change de taille (police, grand texte), jamais à chaque image.
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { layoutMapLabels, type MapLabel, type Rect } from '../../world/continu/map';
import { stateWord } from './constructionParts';
import { PLACES, type PlaceId } from '../../world/continu/plan6e';
import type { MapSpotOnScreen } from './scene';

interface Props {
  /** Les lieux qu'on peut toucher ; les autres portent leur cadenas. */
  openPlaces: readonly PlaceId[];
  /** Un lieu ouvert ou l'Escale (`port`) touché : la page y dépose Kéo. */
  onPick(place: PlaceId | 'port'): void;
  /**
   * Le nom de l'Escale, le lieu de départ (GD-20, lot 2) : toujours ouverte, sans état (rien ne s'y rebâtit) ; rien :
   * pas d'Escale.
   */
  portName?: string;
  /** La page y range la fonction qui pose les étiquettes (le rappel `onMapPlaces` de la scène l'appelle). */
  placer: MutableRefObject<((spots: readonly MapSpotOnScreen[]) => void) | null>;
  /** Un lieu fermé touché : la page dit « Fermé pour l'instant ». */
  onClosed(place: PlaceId): void;
  /** L'état de chaque lieu ouvert (GD-20, lot 1) : en chantier, achevé, ou rien encore (aucune partie posée). */
  states: Readonly<Record<PlaceId, 'en-chantier' | 'restauree' | null>>;
  /** Les mots des états, ceux de l'univers (« En chantier »). */
  words: Readonly<Record<IslandStateId, string>>;
}

/** La bande de gauche réservée à la colonne des accès directs, en pixels : aucune étiquette n'y entre. */
const COLUMN_ZONE = 72;

export function MapLabels({ openPlaces, onPick, placer, onClosed, states, words, portName }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<string, { w: number; h: number; narrow?: { w: number; h: number } }>());
  const last = useRef<readonly MapSpotOnScreen[]>([]);
  // Les boutons de la page que les étiquettes évitent, relus au changement de taille seulement.
  const obstacles = useRef<Rect[]>([]);
  const screen = useRef({ width: Infinity, height: Infinity });

  const place = useCallback((spots: readonly MapSpotOnScreen[]) => {
    last.current = spots;
    const el = root.current;
    if (!el) return;
    const items: MapLabel[] = [];
    for (const s of spots) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${s.id}"]`);
      if (!node) continue;
      if (node.hidden === s.shown) node.hidden = !s.shown;
      const size = sizes.current.get(s.id);
      if (!s.shown || !size) continue;
      const kind = s.id === 'keo' ? 'keo' : s.id === 'port' || openPlaces.includes(s.id) ? 'open' : 'closed';
      items.push({ id: s.id, kind, x: s.x, y: s.y, w: size.w, h: size.h, first: s.id === 'port', ...(size.narrow ? { narrow: size.narrow } : {}) });
    }
    // Kéo d'abord, puis l'Escale (elle garde son nom), les autres lieux ouverts, puis les fermés : l'ordre de
    // `layoutMapLabels`.
    for (const spot of layoutMapLabels(items, obstacles.current, screen.current)) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${spot.id}"]`);
      if (!node) continue;
      const transform = `translate(${Math.round(spot.left)}px, ${Math.round(spot.top)}px)`;
      if (node.style.transform !== transform) node.style.transform = transform;
      const name = spot.narrow ? 'serre' : spot.name ? 'oui' : 'non';
      if (node.dataset.nom !== name) node.dataset.nom = name;
      // Le nom d'un lieu fermé glisse sous son cadenas pour rester entier dans l'écran ou laisser la place à un voisin, et
      // descend d'un pas s'il touche le nom du dessus (`shift`, `drop`, layoutMapLabels).
      const shift = `${Math.round(spot.shift ?? 0)}px`;
      if (node.style.getPropertyValue('--nom-decale') !== shift) node.style.setProperty('--nom-decale', shift);
      const drop = `${Math.round(spot.drop ?? 0)}px`;
      if (node.style.getPropertyValue('--nom-baisse') !== drop) node.style.setProperty('--nom-baisse', drop);
    }
  }, [openPlaces]);

  useEffect(() => {
    placer.current = place;
    return () => {
      placer.current = null;
    };
  }, [place, placer]);

  // Les tailles des étiquettes, relues quand elles changent ; les étiquettes se reposent alors.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stage = el.parentElement;
    const measureObstacles = () => {
      if (!stage) return;
      const s = el.getBoundingClientRect();
      screen.current = { width: s.width, height: s.height };
      const buttons = [...stage.querySelectorAll<HTMLElement>('.open-world-bar, .world-settings, .world-shortcuts')].map((o) => {
        const r = o.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top };
      });
      // La bande de gauche, de haut en bas, réservée à la colonne des accès directs et à « Retour » (consultant UX UI).
      const column = buttons.reduce((m, b) => (b.left < COLUMN_ZONE ? Math.max(m, b.right) : m), 0);
      obstacles.current = [{ left: 0, top: 0, right: Math.max(COLUMN_ZONE, column), bottom: s.height }, ...buttons];
    };
    // Une pastille de lieu ouvert se mesure entière et serrée, quelle que soit sa forme du moment (sa forme est remise
    // aussitôt, avant que la page se dessine).
    const measure = (node: HTMLElement) => {
      if (!node.classList.contains('open-world-map-place')) return { w: node.offsetWidth, h: node.offsetHeight };
      const was = node.dataset.nom;
      node.dataset.nom = 'oui';
      const whole = { w: node.offsetWidth, h: node.offsetHeight };
      node.dataset.nom = 'serre';
      const narrow = { w: node.offsetWidth, h: node.offsetHeight };
      if (was === undefined) delete node.dataset.nom;
      else node.dataset.nom = was;
      return { ...whole, narrow };
    };
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) {
        const node = e.target as HTMLElement;
        if (node.dataset.lieu) sizes.current.set(node.dataset.lieu, measure(node));
      }
      measureObstacles();
      place(last.current);
    });
    observer.observe(el);
    for (const node of el.querySelectorAll<HTMLElement>('[data-lieu]')) observer.observe(node);
    return () => observer.disconnect();
  }, [openPlaces, place]);


  return (
    <div ref={root} className="open-world-map-places">
      <span className="open-world-map-keo" data-lieu="keo" role="img" aria-label="Toi : Kéo est ici" hidden>
        <span className="open-world-map-keo-disc" aria-hidden="true">
          <Icon name="toi" />
        </span>
        <span className="open-world-map-keo-word" aria-hidden="true">
          Toi
        </span>
      </span>
      {/* L'Escale : une pastille comme les lieux, toujours ouverte, sans état ni cadenas (consultant UX UI). */}
      {portName && (
        <button type="button" className="open-world-map-place open-world-map-port" data-lieu="port" hidden aria-label={`Y aller : ${portName}`} onClick={() => onPick('port')}>
          <span className="open-world-map-place-name">{portName}</span>
          <span className="open-world-map-state" aria-hidden="true">
            <Icon name="ancre" />
          </span>
        </button>
      )}
      {PLACES.map((p) =>
        openPlaces.includes(p.id) ? (
          <button
            key={p.id}
            type="button"
            className="open-world-map-place"
            data-lieu={p.id}
            hidden
            aria-label={`Y aller : ${p.name}${states[p.id] ? `, ${stateWord(states[p.id]!, words, p.agree).toLowerCase()}` : ''}`}
            onClick={() => onPick(p.id)}
          >
            <span className="open-world-map-place-name">{p.name}</span>
            {/* L'état de sa construction, à côté de son nom (dessous dans la pastille serrée) : une icône, jamais la couleur
                seule ; son mot, accordé, est dit par le bouton. Sans état, l'icône « à explorer » ne se montre que dans la pastille
                réduite. */}
            <span className="open-world-map-state" data-etat={states[p.id] ?? 'a-explorer'} aria-hidden="true">
              <Icon name={islandStateIcon(states[p.id] ?? 'a-explorer')} />
            </span>
          </button>
        ) : (
          <button
            key={p.id}
            type="button"
            className="open-world-map-closed"
            data-lieu={p.id}
            hidden
            aria-label={`${p.name} : sous la brume, fermé pour l’instant`}
            onClick={() => onClosed(p.id)}
          >
            <span className="open-world-lock" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <span className="open-world-map-closed-name" aria-hidden="true">
              {p.name}
            </span>
          </button>
        ),
      )}
    </div>
  );
}
