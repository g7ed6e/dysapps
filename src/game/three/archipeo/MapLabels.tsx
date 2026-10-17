// Les étiquettes de la Carte des lieux ouverts (piste 1, lot 3) : Kéo (une pastille unie à sa silhouette et « Toi »), le
// nom de chaque lieu ouvert et l'icône de l'état de sa construction (un bouton qui y mène, GD-20, lot 1 ; le mot de
// l'état, accordé au nom, est dit par le bouton), le cadenas de chaque lieu fermé et son nom atténué dessous (un
// toucher ouvre la fiche du lieu fermé, par-dessus la Carte : GD-20, point 3, lot 1 « Relier »). Rien n'est écrit dans
// la 3D : la scène
// donne les points à l'écran, posés ici sans passer par React ; aucune étiquette n'en recouvre une autre ni ne passe
// sur la colonne des accès directs ou un bouton (`layoutMapLabels`, world/continu/map.ts) ; trop serrée, une pastille
// se serre, son nom sur deux lignes ; sans aucune place près de son lieu, elle se réduit à son icône. Les tailles sont
// relues seulement quand une étiquette change de taille (police, grand texte), jamais à chaque image.
import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { getBiome } from '../../biomes';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { MAP_BAR_ROOM, grown, layoutMapLabels, nameLines, type MapLabel, type MapLabelSpot, type Rect } from '../../world/continu/map';
import { mapStateWord } from './constructionParts';
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
  /**
   * La page y range la fonction qui pose les étiquettes (le rappel `onMapPlaces` de la scène l'appelle) ; `moving` tant
   * que la Carte glisse (sans la reprise des noms fermés, posée à l'arrêt).
   */
  placer: MutableRefObject<((spots: readonly MapSpotOnScreen[], moving?: boolean) => void) | null>;
  /** Un lieu fermé touché (son cadenas) : la page ouvre sa fiche, par-dessus la Carte (GD-20, point 3). */
  onClosed(place: PlaceId): void;
  /**
   * Ce que dit le cadenas d'un lieu pas encore reliable (consultant UX UI) : la phrase d'ordre, « La Turbine : relie
   * d'abord les Écluses. » ; rien, la phrase d'un lieu fermé.
   */
  orderLabel?(place: PlaceId): string | null;
  /**
   * Le lieu de la liaison suggérée (proposition au mainteneur, lot 2 des passerelles) : son cadenas plein, Nuit océan,
   * l'icône claire, avec ses tirets épais ; rien, aucun.
   */
  suggested?: PlaceId | null;
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
 * son icône, ou hors de l'écran) pèse le plus ; puis, sur tablette seulement, un lieu fermé hors de l'écran. Le nom tu
 * d'un lieu fermé ne compte pas : le nom d'un lieu ouvert, près de son lieu, passe avant lui (directeur artistique), et
 * le cadenas reste.
 */
const MISSING = { unnamed: 100, offscreen: 1 } as const;
/** Un écran plus bas que tant de pixels est un téléphone couché (la même borne que openWorld.css). */
const LOW_SCREEN = 500;
const missingOf = (items: readonly MapLabel[], spots: readonly MapLabelSpot[]) => spots.reduce((n, s, i) => n + (items[i].kind === 'open' && !s.name ? MISSING.unnamed : 0), 0);

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

export function MapLabels({ openPlaces, onPick, placer, onClosed, orderLabel, suggested = null, states, words, portName, onCrowded }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<string, { w: number; h: number; narrow?: { w: number; h: number } }>());
  const last = useRef<readonly MapSpotOnScreen[]>([]);
  // La Carte glisse-t-elle (la dernière pose demandée par la scène) : une étiquette qui se montre ou se cache pendant un
  // glisser ne relance pas la reprise.
  const moved = useRef(false);
  // Les boutons de la page que les étiquettes évitent, relus au changement de taille seulement.
  const obstacles = useRef<Rect[]>([]);
  const screen = useRef({ width: Infinity, height: Infinity });
  // Les tailles relues (à chaque mesure qui change une taille, un numéro de plus), la mesure pour laquelle la vue de
  // départ a déjà été demandée, et si la scène y a répondu (les étiquettes se montrent alors : la Carte ne se pose pas
  // une première fois pour changer aussitôt de vue).
  const measured = useRef(0);
  const asked = useRef(-1);
  const answered = useRef(false);
  const crowdedRef = useRef(onCrowded);
  // Les props relues par les poses (appelées par la scène, hors du rendu de React), rangées après chaque rendu.
  useLayoutEffect(() => {
    crowdedRef.current = onCrowded;
  }, [onCrowded]);

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
    // Sans la reprise des noms fermés : seuls les lieux ouverts comptent ici.
    return gone + missingOf(items, layoutMapLabels(items, obstacles.current, screen.current, false));
  }, [itemsOf, openPlaces]);

  const place = useCallback((spots: readonly MapSpotOnScreen[], moving = false) => {
    last.current = spots;
    moved.current = moving;
    const el = root.current;
    if (!el) return;
    for (const s of spots) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${s.id}"]`);
      if (node && node.hidden === s.shown) node.hidden = !s.shown;
    }
    const items = itemsOf(spots);
    // Kéo d'abord, puis l'Escale (elle garde son nom), les autres lieux ouverts, puis les fermés : l'ordre de
    // `layoutMapLabels` ; sur tablette, la Carte à l'arrêt (le geste fini, une taille changée), la reprise des noms
    // fermés tus (sur téléphone, un lieu fermé peut rester à son cadenas ; pendant un glisser, elle coûterait à chaque
    // image : expert frontend).
    const laid = layoutMapLabels(items, obstacles.current, screen.current, !moving && screen.current.height > LOW_SCREEN);
    // La vue de départ se choisit à chaque mesure qui change une taille (police, grand texte, taille de l'écran), une
    // fois : la plus proche de l'île entière où chaque lieu ouvert a son nom près de lui (GD-20, « La Carte au plus grand
    // texte »). Une Carte que l'élève a touchée ne bouge plus (la scène en juge). Les étiquettes restent cachées jusqu'à la
    // réponse de la scène : la pose suivante est celle de la vue choisie (consultant UX UI : la Carte ne « respire » pas à
    // l'ouverture).
    if (asked.current !== measured.current && laid.length) {
      asked.current = measured.current;
      if (crowdedRef.current) crowdedRef.current(crowded);
      else answered.current = true;
    } else if (asked.current === measured.current) answered.current = true;
    if (answered.current && el.dataset.pret !== 'oui') el.dataset.pret = 'oui';
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
      const box = (o: HTMLElement) => {
        const r = o.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top };
      };
      // « Retour » et « Lieux » gardent un écart de plus (`MAP_BAR_ROOM`, relecture de L9) : 16 px au moins jusqu'à un nom.
      const bar = [...stage.querySelectorAll<HTMLElement>('.open-world-bar')].map(box);
      // La colonne des accès directs et « Retour » seulement, sans bande de haut en bas (GD-20, « La Carte au plus grand
      // texte ») : une étiquette peut passer entre eux.
      obstacles.current = [...bar.map((r) => grown(r, MAP_BAR_ROOM)), ...[...stage.querySelectorAll<HTMLElement>('.world-settings, .world-shortcuts')].map(box)];
    };
    // Une pastille de lieu ouvert, ou un lieu fermé, se mesure entière et serrée, quelle que soit sa forme du moment (sa
    // forme est remise aussitôt, avant que la page se dessine).
    const measure = (node: HTMLElement): { w: number; h: number; narrow?: { w: number; h: number } } => {
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
      let changed = false;
      for (const e of entries) {
        const node = e.target as HTMLElement;
        if (!node.dataset.lieu) continue;
        const size = measure(node);
        // Une étiquette cachée n'a pas de taille : elle garde la dernière.
        if (!size.w && !size.h) continue;
        const was = sizes.current.get(node.dataset.lieu);
        if (was && (was.w !== size.w || was.h !== size.h || was.narrow?.w !== size.narrow?.w || was.narrow?.h !== size.narrow?.h)) changed = true;
        sizes.current.set(node.dataset.lieu, size);
      }
      // Seule une taille qui change (police, grand texte) redemande la vue de départ : une étiquette qui se montre pour la
      // première fois, ou se cache, ne la change pas (la Carte ne « respire » pas).
      if (changed) measured.current++;
      measureObstacles();
      // Une taille changée : la pose entière, avec la reprise ; une étiquette montrée ou cachée seulement : comme la Carte.
      place(last.current, !changed && moved.current);
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
      {PLACES.map((p) => {
        const word = mapStateWord(p, states[p.id], words);
        return openPlaces.includes(p.id) ? (
          <button
            key={p.id}
            type="button"
            className="open-world-map-place"
            data-lieu={p.id}
            hidden
            aria-label={`Y aller : ${p.name}${word ? `, ${word.toLowerCase()}` : ''}`}
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
            aria-label={orderLabel?.(p.id) ?? `${p.name} : fermé, la passerelle est démontée`}
            onClick={() => onClosed(p.id)}
          >
            <span className={`open-world-lock${p.id === suggested ? ' suggested' : ''}`} aria-hidden="true">
              <Icon name="lock" />
            </span>
            <span className="open-world-map-closed-name" aria-hidden="true">
              <Name text={p.name} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
