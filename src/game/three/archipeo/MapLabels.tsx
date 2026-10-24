// Les étiquettes de la Carte des lieux ouverts (piste 1, lot 3) : Kéo (une pastille unie à sa silhouette et « Toi »), le
// nom de chaque lieu ouvert et l'icône de l'état de sa construction (un bouton qui y mène, GD-20, lot 1 ; le mot de
// l'état, accordé au nom, est dit par le bouton) ; depuis « vraies terres, vrais ponts » (GD-20, point 3) : un cadenas
// par pont à rebâtir, sur la coupure du bras de mer (plein pour le pont suggéré seul), et les lieux d'une terre fermée
// en pastilles pâles, au contour en tirets, leur nom lisible, sans cadenas ; un toucher sur l'un ou l'autre ouvre la
// fiche de la terre, par-dessus la Carte. Depuis la piste B du consultant UX UI (« Noms plafonnés, sans trait », choix
// du mainteneur du 24 octobre 2026), la même Carte aux quatre niveaux : les noms à 24 px au plus (openWorld.css), sur une
// ligne, entiers, sans trait ; les lieux d'une terre fermée en pastilles d'icône sans nom, le nom de la terre sous le
// cadenas de son pont ; la pastille de Kéo posée après les noms ouverts. Rien n'est écrit dans la 3D : la scène donne les
// points à l'écran, posés ici sans passer par React ; aucune étiquette n'en recouvre une autre ni ne passe sur la colonne
// des accès directs ou un bouton (`layoutMapLabels`, world/continu/map.ts) ; un nom sans place près de son lieu se tait,
// sa pastille réduite à son icône. Les tailles sont relues seulement quand une étiquette change de taille (police, grand
// texte), jamais à chaque image.
import { useCallback, useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { estLieuDOption, getBiome } from '../../biomes';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { MAP_BAR_ROOM, grown, layoutMapLabels, type MapLabel, type MapLabelSpot, type Rect } from '../../world/continu/map';
import { mapStateWord } from './constructionParts';
import { bridgeSpot, isBridgeSpot, landById, landOf, type LinkedLand } from '../../world/continu/lands';
import { isCabin } from '../../world/continu/bridges';
import type { OpenPlace, PlaceId } from '../../world/continu/levelPlan';
import { closedLandLabel } from './ClosedLandSheet';
import type { MapSpotOnScreen } from './scene';

interface Props {
  /** Les lieux du plan du niveau, dans son ordre. */
  places: readonly OpenPlace[];
  /** Les lieux des terres ouvertes, qu'on peut toucher pour y aller ; les autres sont pâles et ouvrent la fiche de leur terre. */
  openPlaces: readonly PlaceId[];
  /** Les terres fermées : le cadenas de leur pont. */
  closedLands: readonly LinkedLand[];
  /** Un lieu ouvert ou l'Escale (`port`) touché : la page y dépose Kéo. */
  onPick(place: PlaceId | 'port'): void;
  /**
   * Le nom de l'Escale, le lieu de départ (GD-20, lot 2) : toujours ouverte, sans état (rien ne s'y rebâtit) ; rien :
   * pas d'Escale.
   */
  portName?: string;
  /**
   * Les lieux du haut (GD-22 : le plateau du 5e) : un triangle « en haut » collé à leur nom, et sur Kéo quand il y est
   * (`up`, le point que la scène donne) ; rien au 6e.
   */
  upper?: readonly PlaceId[];
  /**
   * La page y range la fonction qui pose les étiquettes (le rappel `onMapPlaces` de la scène l'appelle) ; `moving` tant
   * que la Carte glisse (sans la reprise des noms fermés, posée à l'arrêt).
   */
  placer: MutableRefObject<((spots: readonly MapSpotOnScreen[], moving?: boolean) => void) | null>;
  /** Une terre fermée touchée (le cadenas de son pont, ou l'un de ses lieux) : la page ouvre sa fiche, par-dessus la Carte. */
  onClosed(land: LinkedLand): void;
  /**
   * Ce que dit le cadenas d'une terre pas encore reliable (consultant UX UI) : la phrase d'ordre, « Le Large : relie
   * d'abord le Couchant. » ; rien, la phrase d'une terre fermée.
   */
  orderLabel?(land: LinkedLand): string | null;
  /**
   * La terre du pont suggéré (choix du mainteneur, « Cadenas plein », 17 octobre 2026) : son cadenas plein, Nuit océan,
   * l'icône claire ; rien, aucun.
   */
  suggested?: LinkedLand | null;
  /**
   * Le prochain lieu suggéré (celui que désigne la marque dans le monde : la prochaine mission, ou l'habitant de la commande
   * prête) : sa pastille porte un double contour (consultant UX UI, seconde relecture du lot 2 du 5e : rien ne le
   * distinguait sur la Carte) ; rien, aucun.
   */
  nextPlace?: PlaceId | null;
  /** L'état de chaque lieu ouvert (GD-20, lot 1) : en chantier, achevé, ou rien encore (aucune partie posée). */
  states: Readonly<Partial<Record<PlaceId, 'en-chantier' | 'restauree' | null>>>;
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
 * son icône, ou hors de l'écran), et autant un lieu d'une terre fermée ou le cadenas d'un pont hors de l'écran, sur tout
 * écran (consultant UX UI, relecture du lot 1 des « vraies terres » : la vue de départ garde à l'écran les quatre
 * cadenas et tous les lieux ; avant, sur tablette seulement, et cent fois moins : la Carte se rapprochait des lieux
 * ouverts et la Gare maritime sortait du cadre). À poids égal, la vue la plus proche de l'île entière l'emporte. Le nom
 * tu d'un lieu fermé ne compte pas : le nom d'un lieu ouvert, près de son lieu, passe avant lui (directeur artistique),
 * et le cadenas reste.
 */
const MISSING = { unnamed: 100, offscreen: 100 } as const;
/** Un écran plus bas que tant de pixels est un téléphone couché (la même borne que openWorld.css). */
const LOW_SCREEN = 500;
// Un lieu d'une terre fermée n'a jamais de nom sur la Carte (sa pastille d'icône) : il ne manque pas.
const missingOf = (items: readonly MapLabel[], spots: readonly MapLabelSpot[]) => spots.reduce((n, s, i) => n + (items[i].kind === 'open' && !items[i].pale && !s.name ? MISSING.unnamed : 0), 0);

/**
 * Un nom, entier, sur une ligne (piste B de la Carte : jamais coupé ni sur deux lignes ; s'il ne tient pas près de son
 * lieu, il se tait) ; le triangle « en haut » (GD-22), le fanion d'un lieu d'option collés à lui (openWorld.css).
 */
function Name({ text, up = false, option = false }: { text: string; up?: boolean; option?: boolean }) {
  return (
    <span className="open-world-map-lines">
      {text}
      {/* Collés au nom, qui ne se coupe pas (référent dys : jamais seuls ni sur une autre ligne). */}
      {up && <Up />}
      {option && <OptionFlag />}
    </span>
  );
}

/**
 * L'icône de l'état d'un lieu ouvert, à côté de son nom (dans son coin, dans la pastille réduite). Sa place est gardée dès
 * la ruine, l'icône « à explorer » invisible : aucun nom ne grandit quand son lieu passe en chantier ou est restauré, et
 * son côté reste le même (retouche 3 des Coteaux, consultant UX UI ; aux quatre niveaux depuis la piste B).
 */
const StateIcon = ({ state }: { state: IslandStateId | null }) => (
  <span className="open-world-map-state" data-etat={state ?? 'a-explorer'} aria-hidden="true">
    <Icon name={islandStateIcon(state ?? 'a-explorer')} />
  </span>
);

/** Le triangle « en haut », dessiné en CSS (openWorld.css), jamais une couleur seule : sa forme le dit, le bouton le lit. */
const Up = () => <span className="open-world-map-up" aria-hidden="true" />;

/**
 * Le triangle « en haut » de la pastille réduite à son icône (au plus grand texte, sur un téléphone ; référent dys,
 * relecture du lot 2 : il disparaissait avec le nom) : un insigne collé au coin haut de l'icône, sur un disque uni.
 */
const UpBadge = () => (
  <span className="open-world-map-up-badge" aria-hidden="true">
    <Up />
  </span>
);

/**
 * Le fanion d'un lieu d'option (GD-13 : la LV2, le latin et le grec ; choix du mainteneur, 21 octobre 2026, « Fanion ») :
 * collé à son nom, que l'option soit choisie ou non ; rien qui se lise « à faire » ni en retard (DP-09). Le bouton le dit.
 */
const OptionFlag = () => (
  <span className="open-world-map-option" aria-hidden="true">
    <Icon name="flag" />
  </span>
);

/** Ce que dit un lieu d'option, juste après son nom. */
const OPTION_WORDS = ', en option';

/** Le lieu d'un plan est-il un lieu d'option (l'île de la LV2, ou celle du latin et du grec) ? */
const isOption = (p: OpenPlace): boolean => {
  const biome = getBiome(p.island);
  return biome ? estLieuDOption(biome) : false;
};

/** Ce que dit un lieu du haut, après son nom. */
const UP_WORDS = ', en haut';

/**
 * Ce que dit le cadenas du pont suggéré, après sa phrase (consultant UX UI, seconde relecture du lot 2 du 5e) : la voix
 * dit ce que montrent son plein et son double contour ; la pastille du prochain lieu le dit par `aria-current`.
 */
const SUGGESTED_WORDS = ' Suggéré.';

/** Ce que dit la pastille de Kéo. */
const KEO_LABEL = 'Toi : Kéo est ici';

export function MapLabels({ places, openPlaces, closedLands, onPick, placer, onClosed, orderLabel, suggested = null, nextPlace = null, states, words, portName, upper = [], onCrowded }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<string, { w: number; h: number; stacked?: { w: number; h: number } }>());
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
  const upperRef = useRef(upper);
  const nextRef = useRef(nextPlace);
  // Les props relues par les poses (appelées par la scène, hors du rendu de React), rangées après chaque rendu.
  useLayoutEffect(() => {
    crowdedRef.current = onCrowded;
    upperRef.current = upper;
    nextRef.current = nextPlace;
  }, [onCrowded, upper, nextPlace]);

  // Les étiquettes à poser pour des points donnés, avec leurs tailles mesurées (les points cachés ou pas encore mesurés
  // n'en ont pas).
  const itemsOf = useCallback((spots: readonly MapSpotOnScreen[]) => {
    const items: MapLabel[] = [];
    for (const s of spots) {
      const size = sizes.current.get(s.id);
      if (!s.shown || !size) continue;
      // Un cadenas de pont ; Kéo ; une pastille, celle d'un lieu ouvert ou pâle.
      const kind = s.id === 'keo' ? 'keo' : isBridgeSpot(s.id) ? 'closed' : 'open';
      // Au 5e (des lieux du haut), le nom d'un lieu du bas se pose d'abord sous lui : le plateau reste à découvert.
      // Sauf un lieu dont le repère de loin est au sud, sur l'eau (les Radeaux) : son nom reste de son côté, au-dessus.
      const above = kind === 'open' && s.above === true;
      // Au 4e, le côté du plan validé (`OpenPlace.mapSide`) : dessous, ou d'abord à gauche ou à droite.
      const below = !above && kind === 'open' && ((upperRef.current.length > 0 && s.id !== 'port' && !upperRef.current.includes(s.id as PlaceId)) || s.side === 'below');
      const side = kind === 'open' && (s.side === 'left' || s.side === 'right') ? s.side : undefined;
      // Le lieu suggéré passe le tout premier.
      const next = kind === 'open' && s.id === nextRef.current;
      // Un lieu d'une terre fermée : sa pastille d'icône, sans nom.
      const pale = kind === 'open' && s.id !== 'port' && !openPlaces.includes(s.id as PlaceId);
      const item: MapLabel = { id: s.id, kind, x: s.x, y: s.y, w: size.w, h: size.h, first: s.id === 'port' || next, ...(pale ? { pale: true as const } : {}), ...(below ? { below } : {}), ...(above ? { above } : {}), ...(side ? { side } : {}), ...(kind === 'open' && s.pinned ? { pinned: true as const } : {}), ...(size.stacked ? { stacked: size.stacked } : {}) };
      if (next) items.unshift(item);
      else items.push(item);
    }
    return items;
  }, [openPlaces]);
  // Pour une vue essayée : ce qui y manque (`missingOf`), un lieu hors de l'écran compté comme sans nom.
  const crowded = useCallback((spots: readonly MapSpotOnScreen[]) => {
    const items = itemsOf(spots);
    let gone = 0;
    for (const s of spots) {
      if (s.shown || s.id === 'keo') continue;
      if (s.id === 'port' ? sizes.current.has('port') : !isBridgeSpot(s.id) && openPlaces.includes(s.id)) gone += MISSING.unnamed;
      else if (s.id !== 'port') gone += MISSING.offscreen;
    }
    // Sans la reprise des noms fermés : seules les pastilles comptent ici.
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
      // Kéo sur le plateau (GD-22) : le triangle « en haut » à côté de « Toi », et dit.
      if (node && s.id === 'keo' && s.up !== undefined) {
        const haut = s.up ? 'oui' : 'non';
        if (node.dataset.haut !== haut) {
          node.dataset.haut = haut;
          node.setAttribute('aria-label', `${KEO_LABEL}${s.up ? UP_WORDS : ''}`);
        }
      }
    }
    const items = itemsOf(spots);
    // Kéo d'abord, puis l'Escale (elle garde son nom), les autres pastilles, puis les cadenas des ponts : l'ordre de
    // `layoutMapLabels` ; sur tablette, la Carte à l'arrêt (le geste fini, une taille changée), la reprise des noms
    // fermés tus (sur téléphone, un lieu fermé peut rester à son cadenas ; pendant un glisser, elle coûterait à chaque
    // image : expert frontend).
    // Ce que les étiquettes laissent à découvert, comme les boutons : le repère d'un lieu de loin (les trois radeaux).
    const keep = spots.some((s) => s.shown && s.clear) ? [...obstacles.current, ...spots.flatMap((s) => (s.shown && s.clear ? [s.clear] : []))] : obstacles.current;
    const laid = layoutMapLabels(items, keep, screen.current, !moving && screen.current.height > LOW_SCREEN);
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
      const name = spot.name ? 'oui' : 'non';
      if (node.dataset.nom !== name) node.dataset.nom = name;
      // Le nom d'un lieu fermé glisse sous son cadenas pour rester entier dans l'écran ou laisser la place à un voisin, et
      // descend d'un pas s'il touche le nom du dessus (`shift`, `drop`, layoutMapLabels).
      const shift = `${Math.round(spot.shift ?? 0)}px`;
      if (node.style.getPropertyValue('--nom-decale') !== shift) node.style.setProperty('--nom-decale', shift);
      // « Toi » à gauche de la pastille de Kéo, ou dessous (`toi`) ; à droite sans rien.
      if (spot.id === 'keo' && node.dataset.toi !== spot.toi) {
        if (spot.toi) node.dataset.toi = spot.toi;
        else delete node.dataset.toi;
      }
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
    // Une pastille de lieu ouvert, ou un cadenas, se mesure avec son nom, quelle que soit sa forme du moment (sa forme est
    // remise aussitôt, avant que la page se dessine).
    const measure = (node: HTMLElement): { w: number; h: number; stacked?: { w: number; h: number } } => {
      // Kéo se mesure « Toi » à côté de sa pastille, et dessous (sa forme empilée, `stacked`).
      if (node.classList.contains('open-world-map-keo')) {
        const was = node.dataset.toi;
        delete node.dataset.toi;
        const whole = { w: node.offsetWidth, h: node.offsetHeight };
        node.dataset.toi = 'dessous';
        const stacked = { w: node.offsetWidth, h: node.offsetHeight };
        if (was === undefined) delete node.dataset.toi;
        else node.dataset.toi = was;
        return { ...whole, stacked };
      }
      if (!node.classList.contains('open-world-map-place') && !node.classList.contains('open-world-map-closed')) return { w: node.offsetWidth, h: node.offsetHeight };
      const was = node.dataset.nom;
      node.dataset.nom = 'oui';
      const whole = { w: node.offsetWidth, h: node.offsetHeight };
      if (was === undefined) delete node.dataset.nom;
      else node.dataset.nom = was;
      return whole;
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
        if (was && (was.w !== size.w || was.h !== size.h || was.stacked?.w !== size.stacked?.w || was.stacked?.h !== size.stacked?.h)) changed = true;
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
    // Les boutons évités aussi : une colonne qui grandit après la première pose (un bouton qui s'y ajoute) est relue, et
    // aucune pastille ne reste dessous (relecture des restes du 4e : au 5e, en 390 × 844, une pastille sous la colonne).
    for (const node of stage?.querySelectorAll<HTMLElement>('.open-world-bar, .world-settings, .world-shortcuts') ?? []) observer.observe(node);
    return () => observer.disconnect();
  }, [openPlaces, closedLands, place]);


  return (
    <div ref={root} className="open-world-map-places">
      <span className="open-world-map-keo" data-lieu="keo" role="img" aria-label={KEO_LABEL} hidden>
        <span className="open-world-map-keo-disc" aria-hidden="true">
          <Icon name="toi" />
          {upper.length > 0 && <UpBadge />}
        </span>
        <span className="open-world-map-keo-word" aria-hidden="true">
          Toi
          {upper.length > 0 && <Up />}
        </span>
      </span>
      {/* L'Escale : une pastille comme les lieux, toujours ouverte, sans état ni cadenas (consultant UX UI). */}
      {portName && (
        <button type="button" className="open-world-map-place open-world-map-port" data-lieu="port" hidden aria-label={`Y aller : ${portName}`} onClick={() => onPick('port')}>
          <span className="open-world-map-place-name">
            <Name text={portName} />
          </span>
          <span className="open-world-map-state" aria-hidden="true">
            <Icon name="ancre" />
          </span>
        </button>
      )}
      {places.map((p) => {
        if (!openPlaces.includes(p.id)) {
          // Un lieu d'une terre fermée : sa pastille pâle d'icône, au contour en tirets, sans nom (piste B ; le bouton le dit) ;
          // elle ouvre la fiche de sa terre.
          const land = landOf(p.id) as LinkedLand;
          return (
            <button
              key={p.id}
              type="button"
              className="open-world-map-place open-world-map-pale"
              data-lieu={p.id}
              hidden
              aria-label={`${p.name}${isOption(p) ? OPTION_WORDS : ''}${upper.includes(p.id) ? UP_WORDS : ''}, ${orderLabel?.(land) ?? closedLandLabel(land)}`}
              onClick={() => onClosed(land)}
            >
              <span className="open-world-map-icon" aria-hidden="true">
                <Icon name={getBiome(p.island)?.icon ?? 'map'} />
                {upper.includes(p.id) && <UpBadge />}
              </span>
            </button>
          );
        }
        const word = mapStateWord(p, states[p.id] ?? null, words);
        return (
          <button
            key={p.id}
            type="button"
            className={`open-world-map-place${p.id === nextPlace ? ' suggested' : ''}`}
            data-lieu={p.id}
            hidden
            aria-current={p.id === nextPlace ? 'step' : undefined}
            aria-label={`Y aller : ${p.name}${isOption(p) ? OPTION_WORDS : ''}${upper.includes(p.id) ? UP_WORDS : ''}${word ? `, ${word.toLowerCase()}` : ''}`}
            onClick={() => onPick(p.id)}
          >
            <span className="open-world-map-place-name">
              <Name text={p.name} up={upper.includes(p.id)} option={isOption(p)} />
            </span>
            {/* Dans la pastille réduite seulement, l'icône propre du lieu (celle de son île) : deux lieux ouverts réduits ne
                se confondent pas ; l'état y passe en petit insigne, dans son coin (relecture du rivage sud). */}
            <span className="open-world-map-icon" aria-hidden="true">
              <Icon name={getBiome(p.island)?.icon ?? 'map'} />
              {upper.includes(p.id) && <UpBadge />}
            </span>
            {/* L'état de sa construction, à côté de son nom : une icône, jamais la couleur seule ; son mot, accordé, est dit
                par le bouton. Sans état, l'icône « à explorer » ne se montre que dans la pastille réduite. */}
            <StateIcon state={states[p.id] ?? null} />
          </button>
        );
      })}
      {/* Le cadenas du pont de chaque terre fermée, sur la coupure du bras de mer : plein pour le pont suggéré seul ; dessous,
          le nom de la terre (GD-22, lot 2, retouche : consultant d'Archipéo, « le nom de la terre fermée ne se lit pas sur la
          Carte » ; aux quatre niveaux depuis la piste B), et devant lui l'icône de la cabine pour la terre du haut. */}
      {closedLands.map((land) => (
        <button
          key={land}
          type="button"
          className="open-world-map-closed open-world-map-bridge"
          data-lieu={bridgeSpot(land)}
          hidden
          aria-label={`${orderLabel?.(land) ?? closedLandLabel(land)}${land === suggested ? SUGGESTED_WORDS : ''}`}
          onClick={() => onClosed(land)}
        >
          <span className={`open-world-lock${land === suggested ? ' suggested' : ''}`} aria-hidden="true">
            <Icon name="lock" />
          </span>
          <span className="open-world-map-closed-name" aria-hidden="true">
            {isCabin(land) && <Icon name="cabine" />}
            <Name text={landById(land).name} />
          </span>
        </button>
      ))}
    </div>
  );
}
