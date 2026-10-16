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
import { getBiome } from '../../biomes';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { layoutMapLabels, nameLines, type MapLabel, type MapLabelSpot, type Rect } from '../../world/continu/map';
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
  /**
   * Un lieu ouvert n'a pas la place de son nom près de lui (au plus grand texte, sur un téléphone) : la page demande à la
   * scène une autre vue de départ ; `crowded` compte, pour des points donnés, les lieux ouverts encore sans leur nom près
   * d'eux ou hors de l'écran. Demandé une fois par taille des étiquettes ou de l'écran, jamais à chaque image.
   */
  onCrowded?(crowded: (spots: readonly MapSpotOnScreen[]) => number): void;
}

/**
 * Ce qui manque à une vue de la Carte, pesé (GD-20, « La Carte au plus grand texte ») : un lieu ouvert sans nom (réduit à
 * son icône, ou hors de l'écran) pèse le plus ; puis un nom de lieu ouvert posé loin de son lieu (permis en dernier
 * recours, relecture de L6b) ; puis, sur tablette seulement, un lieu fermé hors de l'écran, puis le nom tu d'un lieu
 * fermé (sur téléphone, un lieu fermé peut rester à son cadenas).
 */
const MISSING = { unnamed: 100, far: 10, offscreen: 2, closed: 1 } as const;
/** Un écran plus bas que tant de pixels est un téléphone couché (la même borne que openWorld.css). */
const LOW_SCREEN = 500;
const missingOf = (items: readonly MapLabel[], spots: readonly MapLabelSpot[], tablet: boolean) =>
  spots.reduce((n, s, i) => {
    const kind = items[i].kind;
    if (kind === 'open') return n + (!s.name ? MISSING.unnamed : s.far ? MISSING.far : 0);
    return n + (kind === 'closed' && tablet && !s.name ? MISSING.closed : 0);
  }, 0);

/** Un nom de lieu ouvert plus long que tant de lettres passe sur deux lignes, même dans sa pastille entière. */
const ONE_LINE = 12;

/**
 * Un nom, en ses deux lignes (`nameLines`), entre deux mots, jamais au milieu d'un mot : l'une sous l'autre dans la
 * forme serrée, et dans la pastille entière d'un lieu ouvert au nom de plus de `ONE_LINE` lettres (avant, une largeur
 * de 12 `ch` : au plus grand texte, l'espacement des lettres d'OpenDyslexic la débordait, et « Le Chantier naval » y
 * passait sur trois lignes) ; à la suite, sur une ligne, sinon (openWorld.css).
 */
function Name({ text, wrap = false }: { text: string; wrap?: boolean }) {
  const lines = nameLines(text);
  return (
    <span className="open-world-map-lines" data-lignes={wrap && text.length > ONE_LINE ? '2' : '1'}>
      {lines.map((line, i) => (
        <span key={i} className="open-world-map-line">
          {i > 0 && !/[’']$/u.test(lines[i - 1]) ? ' ' : ''}
          {line}
        </span>
      ))}
    </span>
  );
}

/** La bande de gauche réservée à la colonne des accès directs, en pixels : aucune étiquette n'y entre. */
const COLUMN_ZONE = 72;

export function MapLabels({ openPlaces, onPick, placer, onClosed, states, words, portName, onCrowded }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<string, { w: number; h: number; narrow?: { w: number; h: number } }>());
  const last = useRef<readonly MapSpotOnScreen[]>([]);
  // Les boutons de la page que les étiquettes évitent, relus au changement de taille seulement.
  const obstacles = useRef<Rect[]>([]);
  const screen = useRef({ width: Infinity, height: Infinity });
  // Les tailles relues (à chaque mesure, un numéro de plus), et la mesure pour laquelle le recul a déjà été demandé.
  const measured = useRef(0);
  const asked = useRef(-1);
  const crowdedRef = useRef(onCrowded);
  crowdedRef.current = onCrowded;

  // Les étiquettes à poser pour des points donnés, avec leurs tailles mesurées (les points cachés ou pas encore mesurés
  // n'en ont pas).
  const itemsOf = useCallback((spots: readonly MapSpotOnScreen[]) => {
    const items: MapLabel[] = [];
    for (const s of spots) {
      const size = sizes.current.get(s.id);
      if (!s.shown || !size) continue;
      const kind = s.id === 'keo' ? 'keo' : s.id === 'port' || openPlaces.includes(s.id) ? 'open' : 'closed';
      items.push({ id: s.id, kind, x: s.x, y: s.y, w: size.w, h: size.h, first: s.id === 'port', ...(size.narrow ? { narrow: size.narrow } : {}) });
    }
    return items;
  }, [openPlaces]);
  // Pour une vue essayée : ce qui y manque (`missingOf`), un lieu hors de l'écran compté comme sans nom.
  const crowded = useCallback((spots: readonly MapSpotOnScreen[]) => {
    const items = itemsOf(spots);
    const tablet = screen.current.height > LOW_SCREEN;
    let gone = 0;
    for (const s of spots) {
      if (s.shown || s.id === 'keo') continue;
      if (s.id === 'port' ? sizes.current.has('port') : openPlaces.includes(s.id)) gone += MISSING.unnamed;
      else if (s.id !== 'port' && tablet) gone += MISSING.offscreen;
    }
    return gone + missingOf(items, layoutMapLabels(items, obstacles.current, screen.current), tablet);
  }, [itemsOf, openPlaces]);

  const place = useCallback((spots: readonly MapSpotOnScreen[]) => {
    last.current = spots;
    const el = root.current;
    if (!el) return;
    for (const s of spots) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${s.id}"]`);
      if (node && node.hidden === s.shown) node.hidden = !s.shown;
    }
    const items = itemsOf(spots);
    // Kéo d'abord, puis l'Escale (elle garde son nom), les autres lieux ouverts, puis les fermés : l'ordre de
    // `layoutMapLabels`.
    const laid = layoutMapLabels(items, obstacles.current, screen.current);
    // La vue de départ se choisit de nouveau à chaque mesure (police, grand texte, taille de l'écran), une fois : la plus
    // proche de l'île entière où chaque lieu ouvert a son nom près de lui (GD-20, « La Carte au plus grand texte »). Une
    // Carte que l'élève a glissée ou pincée ne bouge pas sous ses doigts (la scène en juge).
    if (asked.current !== measured.current && laid.length) {
      asked.current = measured.current;
      crowdedRef.current?.(crowded);
    }
    for (const spot of laid) {
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
  }, [itemsOf, crowded]);

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
    // Une pastille de lieu ouvert, ou un lieu fermé, se mesure entière et serrée, quelle que soit sa forme du moment (sa
    // forme est remise aussitôt, avant que la page se dessine).
    const measure = (node: HTMLElement) => {
      if (!node.classList.contains('open-world-map-place') && !node.classList.contains('open-world-map-closed')) return { w: node.offsetWidth, h: node.offsetHeight };
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
      measured.current++;
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
          <span className="open-world-map-place-name">
            <Name text={portName} wrap />
          </span>
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
            <span className="open-world-map-place-name">
              <Name text={p.name} wrap />
            </span>
            {/* Dans la pastille réduite seulement, l'icône propre du lieu (celle de son île) : deux lieux ouverts réduits ne
                se confondent pas ; l'état y passe en petit insigne, dans son coin (relecture du rivage sud). */}
            <span className="open-world-map-icon" aria-hidden="true">
              <Icon name={getBiome(p.island)?.icon ?? 'map'} />
            </span>
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
              <Name text={p.name} />
            </span>
          </button>
        ),
      )}
    </div>
  );
}
