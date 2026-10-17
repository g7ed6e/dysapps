// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (le nom de
// son lieu), une flèche au bord de l'écran quand elle est hors champ, la distance en points dessous ; « Y aller »,
// toujours à la même place, y mène d'un coup (piste 1 : le trajet est toujours sauté ; on marche en touchant le monde).
// À l'arrivée, le panneau du lieu s'ouvre : toutes les missions de son île (GD-20, point 8, ./PlacePanel.tsx) ; une
// mission choisie se joue dans le lieu (./WorldQuestion.tsx), avec le lanceur d'exercice commun, dans la scénette du lieu
// (« Vue simple » y montre la même question en liste), ou sur l'écran habituel tant que sa scénette n'est pas faite ;
// puis le bilan, la pose de la partie gagnée, et la liste rouverte, le focus sur la ligne jouée. Les pièces
// durables des lieux se tirent des étoiles gardées : rien de neuf dans la sauvegarde. La Carte des lieux ouverts (piste 1,
// lot 3) s'ouvre du bouton « Carte », comme ailleurs dans le jeu : l'île vue de haut, un lieu ouvert touché y dépose
// Kéo. Les liaisons (GD-20, point 3, lot 1 « Relier ») : au départ, comme dans la grille, seuls le Phare et les Quais
// sont ouverts ; un lieu fermé est derrière sa passerelle démontée, sous la brume ; le toucher, ou toucher sa passerelle
// ou son cadenas sur la Carte, ouvre sa fiche (./ClosedPlaceSheet.tsx), où « Relier » paie la liaison de la grille : la
// passerelle est posée d'un coup, un toc de bois, puis « La passerelle est posée. ». Chargé à la demande.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { frenchTypography } from '../../../components/math/RichText';
import { useProgress } from '../../../core/ProgressContext';
import { useSettings } from '../../../core/SettingsContext';
import { useMoinsDAnimations } from '../../../core/motion';
import { useTextes } from '../../../universes';
import { useBlocland } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import { exercisesOf, questProgress } from '../../exercises';
import { mesuresDemandees, meterShown } from '../../rendering';
import { playWoodTap } from '../../sound';
import { SettingsButton, WorldShortcuts } from '../../WorldShortcuts';
import { payableBlocks } from '../../world/archipelago';
import { isLinked, type LinkedPlace } from '../../world/continu/links';
import type { PartShape } from '../../world/continu/construction';
import { bornesDuMondeOuvert, keepClear, missionsOfPlace, nextMission, playsInPlace, type MarkOnScreen, type Obstacle } from '../../world/continu/mission';
import { PLACES, placeById, placeOfIsland, type OpenPlace, type PlaceId, type PortSpot } from '../../world/continu/plan6e';
import { traceDone } from '../../world/continu/questions';
import { modeleDuMonde } from '../../world/model';
import { gameAsShown } from '../../world/stories';
import { SpeakButton } from '../../../components/SpeakButton';
import { ClosedPlaceSheet, afterLabel, linkableLabel } from './ClosedPlaceSheet';
import { constructionState, placeConstruction, posedShapes } from './constructionParts';
import { MapLabels } from './MapLabels';
import { PlacePanel, placeFromParam, placeResume } from './PlacePanel';
import { PLACES_BUTTON_LABEL, PLACES_SHEET_ID, PlacesSheet, placesRows, usePlacesList } from './PlacesSheet';
import { PortPanels, portFromParam, portResume, type PortPanel } from './PortPanels';
import { neighboursFirst, openWorldLinks, payableLink } from './placeLinks';
import { portState } from './portState';
import { createOpenWorld, type LinkLayEvents, type LockOnScreen, type MapSpotOnScreen, type OpenWorld } from './scene';
import { usePlaceAddress, usePoseGuard } from './usePlaceReturn';
import { WorldQuestion } from './WorldQuestion';
import './openWorld.css';

declare global {
  interface Window {
    /** Le monde ouvert, pour les captures et les mesures (en développement, ou avec `?mesures`). */
    __dysappsMondeOuvert?: Pick<OpenWorld, 'goTo' | 'goToPort' | 'assemble' | 'skip' | 'info' | 'portAt'>;
  }
}

/**
 * Les lieux dont la voix a déjà dit le nom depuis le lancement de l'application : à pied, elle le dit à la première
 * arrivée seulement (choix du mainteneur, 17 octobre 2026, « une fois par partie » ; rien en sauvegarde). Depuis la liste
 * des lieux ou la marque, elle le dit déjà au toucher : le lieu compte alors comme nommé. Sans lecture automatique, rien
 * n'est compté.
 */
const named = new Set<PlaceId | 'port'>();

/** Le titre d'une mission d'une île, pour la dire. */
const missionTitle = (island: string, mission: string) => getBiome(island)?.exercises.find((x) => x.id === mission)?.title ?? '';

export default function OpenWorldPage() {
  const { biomeId } = useParams();
  const { state, linkFromOpenWorld } = useBlocland();
  const textes = useTextes();
  const { settings, speak } = useSettings();
  // La voix de l'arrivée, lue par la scène faite une fois (`onArrive`) : le réglage du moment.
  // Rend vrai si la voix l'a dit : lecture automatique coupée, le lieu reste à nommer.
  const arrivalVoice = useRef<(name: string) => boolean>(() => false);
  useEffect(() => {
    arrivalVoice.current = (name) => {
      if (settings.autoRead) speak(frenchTypography(name));
      return settings.autoRead;
    };
  }, [settings.autoRead, speak]);
  const reduceMotion = useMoinsDAnimations();

  // Les missions des quatre lieux et leur état : le modèle du monde, commun aux deux univers. `modeleDuMonde` lit la
  // LV2 par `lv2Courante()`, pas par un argument : `settings.lv2` refait le modèle quand l'élève la change.
  const vu = useMemo(() => gameAsShown(state, textes), [state, textes]);
  // `settings.lv2` n'est pas lu dans le calcul, il le refait (voir plus haut) : la règle le croit inutile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(vu, '6e', textes.archipels, textes.libelles), [vu, textes, settings.lv2]);
  // Les bornes du monde ouvert : une mission réussie ici garde ses étoiles même si son île n'est pas encore reliée par
  // les ponts de la grille (sinon « Nouveau » au retour, la mission reproposée, la brume restée, jusqu'au rechargement).
  const bornes = useMemo(() => bornesDuMondeOuvert(modele.bornes, (ile, m) => questProgress(ile, m, vu.progress)?.stars ?? null), [modele, vu.progress]);
  // Les liaisons (GD-20, point 3) : les lieux fermés, ceux que la grille n'a pas encore reliés (et où l'élève n'a pas
  // encore joué), et la liaison suggérée par la prochaine destination.
  const links = useMemo(() => openWorldLinks(state.world.links, bornes, modele.destination.ouvrage), [state.world.links, bornes, modele.destination.ouvrage]);
  const isClosed = useCallback((id: PlaceId): boolean => isLinked(id) && links.closed.includes(id), [links]);
  // Le voisin à relier d'abord d'un lieu pas encore reliable : le plus proche de Kéo (relu à l'ouverture de la fiche).
  const afterOf = (place: LinkedPlace): OpenPlace | null => {
    if (!links.waiting.includes(place)) return null;
    const n = neighboursFirst(place, state.world.links, links.closed, world.current?.keoAt() ?? placeById(place).center)[0];
    return n ? placeById(n) : null;
  };
  // Le cadenas d'un lieu pas encore reliable, sur la Carte, dit la phrase d'ordre.
  const orderLabel = (place: PlaceId): string | null => {
    if (!isLinked(place)) return null;
    const after = afterOf(place);
    return after ? afterLabel(placeById(place), after) : null;
  };
  // La prochaine mission, jamais celle d'un lieu fermé : aucune ne s'y joue.
  const next = useMemo(() => nextMission(bornes, modele.destination, (id) => !isClosed(id)), [bornes, modele.destination, isClosed]);
  const nextPlace = next?.place ?? null;

  // Kéo part de l'endroit de l'Escale de l'adresse (le retour d'une mission de l'école, `?porte=maths`, ou d'une question
  // d'assemblage), sinon devant le lieu de l'adresse (`?lieu=quais`, GD-20, point 8 ; ou une île, `/adventure/<île>`),
  // sinon au quai de l'Escale, le lieu de départ (GD-20, lot 2).
  const [params] = useSearchParams();
  const location = useLocation();
  const [arrival] = useState(() => ({
    spot: portFromParam(params.get('porte')),
    assembled: Boolean((location.state as { assemble?: string } | null)?.assemble),
  }));
  const lieuParam = placeFromParam(params.get('lieu'));
  const missionParam = params.get('mission');
  const [start] = useState<PlaceId | PortSpot>(() => arrival.spot ?? lieuParam ?? placeOfIsland(biomeId ?? '')?.id ?? 'quai');
  // Le panneau ouvert de l'Escale : sa fiche, une porte, la galerie, le lieu d'assemblage ; un à la fois.
  const [panel, setPanel] = useState<PortPanel | null>(null);
  // Le panneau ouvert d'un lieu (GD-20, point 8) : sa liste de missions, et la ligne qui y prend le focus (celle dont on
  // revient) ; jamais en même temps qu'un panneau de l'Escale.
  const [lieu, setLieu] = useState<{ place: PlaceId; focus: string | null } | null>(null);
  const sheetOpen = Boolean(panel) || Boolean(lieu);
  const panelRef = useRef<HTMLDivElement>(null);
  const { progress } = useProgress();
  const port = useMemo(() => portState(state, progress), [state, progress]);

  const host = useRef<HTMLDivElement>(null);
  const world = useRef<OpenWorld | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  // Les cadenas des lieux fermés, posés à chaque image par la scène (sans passer par React).
  const locksRef = useRef<HTMLDivElement>(null);
  // Le nombre de scènes faites : 0 avant la première ; refaite (« Réduire les animations » changé), elle reçoit de nouveau
  // la marque, la brume, la Carte et les lieux.
  const [ready, setReady] = useState(0);
  const [walking, setWalking] = useState(false);
  // La mission choisie dans le panneau d'un lieu : elle se joue dans sa scénette, ou sur l'écran habituel (`plain`, une
  // mission dont la scénette n'est pas encore faite).
  const [asking, setAsking] = useState<{ place: PlaceId; mission: string; plain: boolean } | null>(null);
  // La mission dont on revient : sa liste se rouvre après le bilan et la pose, le focus sur sa ligne.
  const [backTo, setBackTo] = useState<{ place: PlaceId; mission: string } | null>(null);
  // La Carte des lieux ouverts (lot 3) : un état de la page, pas une adresse (`/adventure/map` mène à la Carte du
  // monde en grille) ; ses lieux posés à chaque image par la scène, comme les cadenas.
  const [mapOpen, setMapOpen] = useState(false);
  // Ce que les rappels de la scène appellent sur la Carte : poser les étiquettes, choisir un lieu touché dans la 3D.
  const mapPlacer = useRef<((spots: readonly MapSpotOnScreen[], moving?: boolean) => void) | null>(null);
  // « La passerelle est posée. », affichée un moment après le toc (et dite, si la voix est active), suivie de la phrase
  // d'un lieu devenu reliable s'il y en a (« La Turbine peut être reliée. ») ; `n` : une autre pose ; `after` : dans
  // combien de millisecondes (jamais en même temps que le toc).
  const [said, setSaid] = useState<{ n: number; lines: readonly string[]; after: number } | null>(null);
  // Les liaisons de la dernière image rendue : la fin d'une pose y lit les lieux devenus reliables.
  const linksNow = useRef(links);
  // L'heure du dernier toc, pour que la phrase vienne après lui.
  const tappedAt = useRef(0);
  // Où va le focus quand la fiche d'un lieu se ferme (le nom d'un lieu qu'on vient de relier, sur la Carte), sinon « Carte ».
  const focusAfter = useRef<string | null>(null);
  // Au plus grand texte, un lieu ouvert sans la place de son nom : la vue de départ de la Carte change (GD-20, « La Carte
  // au plus grand texte »).
  const reframeMap = useCallback((crowded: (spots: readonly MapSpotOnScreen[]) => number) => world.current?.reframeMap(crowded), []);
  const mapPick = useRef<(place: PlaceId | 'port') => void>(() => {});
  const mapButton = useRef<HTMLButtonElement>(null);
  // La distance au prochain lieu, pour la voix (avis du référent dys) : relue à chaque image, mais l'état ne change
  // qu'avec le palier (un, deux ou trois points) : le libellé de la marque n'est refait que là.
  const [far, setFar] = useState<1 | 2 | 3>(1);
  const farRef = useRef(far);
  // Les célébrations (« Succès débloqué ») attendent la fin de la pose de la partie gagnée, pas seulement celle du bilan :
  // retenues dès qu'une question s'ouvre, rendues quand la pose est finie (ou quand rien ne se pose).
  const [posePending, setPosePending] = useState(false);
  // La scénette d'assemblage se joue (GD-20, lot 2) : les célébrations attendent qu'elle finisse, comme pendant une
  // pose ; un panneau ouvert les retient aussi (PortPanels).
  const [assembling, setAssembling] = useState(false);
  useHoldCelebrations(posePending || assembling);

  // Les dimensions que la marque lit à chaque image, relues seulement quand la page, la marque ou un bouton change de
  // taille (jamais une mise en page forcée par image).
  const [layout] = useState(() => ({ width: 0, height: 0, markW: 0, markH: 0, obstacles: [] as Obstacle[] }));
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      // Le bord droit de « Carte » : sur un écran bas, « Y aller » se tient à sa droite, jamais dessus (openWorld.css).
      const carte = stage.querySelector<HTMLElement>('.open-world-map-button')?.getBoundingClientRect();
      const carteRight = carte ? `${Math.round(carte.right - s.left)}px` : '';
      if (stage.style.getPropertyValue('--open-world-carte') !== carteRight) stage.style.setProperty('--open-world-carte', carteRight);
      layout.width = s.width;
      layout.height = s.height;
      layout.markW = markRef.current?.offsetWidth ?? 0;
      layout.markH = markRef.current?.offsetHeight ?? 0;
      // La colonne des accès directs d'abord : une zone réservée du bord gauche jusqu'à elle et un peu dessous, d'où la
      // marque ne sort que par le bas (consultant UX UI : 72 px depuis le bord, jusqu'à 184 + 16 px depuis le haut).
      const column = stage.querySelector<HTMLElement>('.world-shortcuts')?.getBoundingClientRect();
      const reserve: Obstacle[] = column ? [{ left: 0, top: 0, width: Math.max(COLUMN_ZONE.width, column.right - s.left + MARK_EDGE), height: column.bottom - s.top + COLUMN_ZONE.below, below: true }] : [];
      layout.obstacles = [
        ...reserve,
        ...[...stage.querySelectorAll<HTMLElement>('.world-settings, .open-world-go, .open-world-bar')].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
        }),
      ];
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const el of stage.querySelectorAll('.open-world-mark, .world-settings, .world-shortcuts, .open-world-go, .open-world-bar')) observer.observe(el);
    measure();
    return () => observer.disconnect();
    // La marque et « Y aller » changent d'élément avec la prochaine mission et la marche : on les observe de nouveau.
  }, [layout, next, walking, asking, sheetOpen]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = createOpenWorld(el, {
      start,
      reduceMotion,
      meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() },
      onDepart: () => {
        setWalking(true);
        setPanel(null);
        setLieu(null);
      },
      onPort: (spot) => {
        setLieu(null);
        setPanel(spot === 'quai' ? 'fiche' : spot);
      },
      onAssembled: () => {
        setAssembling(false);
        setPanel('chantier');
      },
      // Kéo devant un lieu : son panneau s'ouvre, la liste de ses missions (GD-20, point 8).
      onArrive: (placeId) => {
        setWalking(false);
        if (!placeId) return;
        if (!named.has(placeId) && arrivalVoice.current(placeById(placeId).name)) named.add(placeId);
        setPanel(null);
        setLieu({ place: placeId, focus: null });
      },
      onLocks: (locks) => placeLocks(locksRef.current, locks),
      // Un lieu fermé, ou sa passerelle démontée, touché dans le monde : sa fiche (GD-20, point 3).
      onClosed: (placeId) => {
        setPanel(null);
        setLieu({ place: placeId, focus: null });
      },
      onMapPlaces: (spots, moving) => mapPlacer.current?.(spots, moving),
      onMapPick: (placeId) => mapPick.current(placeId),
      onPosed: () => setPosePending(false),
      onMark: (m) => {
        placeMark(markRef.current, arrowRef.current, m, layout);
        if (m && m.far !== farRef.current) {
          farRef.current = m.far;
          setFar(m.far);
        }
      },
    });
    world.current = w;
    setReady((n) => n + 1);
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsMondeOuvert = { goTo: w.goTo, goToPort: w.goToPort, assemble: w.assemble, skip: w.skip, info: w.info, portAt: w.portAt };
    return () => {
      w.dispose();
      world.current = null;
      if (window.__dysappsMondeOuvert?.info === w.info) delete window.__dysappsMondeOuvert;
    };
    // La scène est faite une fois (et refaite si l'appareil change « Réduire les animations ») ; `start` ne change pas.
  }, [start, reduceMotion, layout]);

  useEffect(() => {
    world.current?.setMark(nextPlace?.id ?? null);
  }, [nextPlace, ready]);

  // L'Escale (GD-20, lot 2) : ses portes, ses trophées, l'état de la région, la pile, tirés de la sauvegarde.
  useEffect(() => {
    world.current?.setPort(port);
  }, [port, ready]);
  // L'adresse d'un lieu (`?lieu=quais&mission=make-ten`, « Ma dernière mission ») : Kéo y est déposé, sa liste s'ouvre, le
  // focus sur la mission de l'adresse si elle est du lieu ; à chaque navigation, même vers la même adresse.
  const jumpTo = useCallback((place: PlaceId) => {
    const w = world.current;
    if (!w) return false;
    w.goTo(place, true);
    return true;
  }, []);
  const openLieu = useCallback((place: PlaceId, focus: string | null) => setLieu({ place, focus }), []);
  usePlaceAddress({ place: lieuParam, mission: missionParam, navigation: location.key, ready, goTo: jumpTo, open: openLieu });
  // Au retour d'une mission de l'école, le panneau de sa porte se rouvre ; au retour d'une question d'assemblage
  // réussie, la scénette se joue d'abord (le bloc posé sur le râtelier), puis le panneau du lieu s'ouvre.
  const arrived = useRef(false);
  useEffect(() => {
    const w = world.current;
    if (!w || arrived.current || !arrival.spot) return;
    arrived.current = true;
    if (arrival.spot === 'chantier' && arrival.assembled) {
      setAssembling(true);
      w.assemble();
    } else setPanel(arrival.spot);
  }, [arrival, ready]);
  // Le panneau ouvert : la caméra garde ce qu'il concerne dans la part de l'écran qu'il laisse (au-dessus de lui sur
  // tablette, à sa droite sur un écran bas), relue quand il change de taille.
  useEffect(() => {
    const w = world.current;
    const stage = stageRef.current;
    const el = panelRef.current;
    if (!w || !stage) return;
    if (!sheetOpen || !el) {
      w.frame(null);
      return;
    }
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // En colonne à gauche (un écran bas) : la part à sa droite ; en bas : la part au-dessus.
      const column = r.top - s.top < 8 && r.width < s.width * 0.8;
      w.frame(column ? { left: r.right - s.left, top: 0, width: s.right - r.right, height: s.height } : { left: 0, top: 0, width: s.width, height: Math.max(1, r.top - s.top) }, lieu?.place);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [panel, lieu, sheetOpen, ready]);
  // Un panneau fermé rend la main au bouton « Carte », comme la Carte (consultant UX UI).
  const hadPanel = useRef(false);
  useEffect(() => {
    if (sheetOpen) hadPanel.current = true;
    else if (hadPanel.current) {
      hadPanel.current = false;
      const after = focusAfter.current;
      focusAfter.current = null;
      const target = after ? stageRef.current?.querySelector<HTMLElement>(`.open-world-map-place[data-lieu="${after}"]`) : null;
      (target ?? mapButton.current)?.focus();
    }
  }, [sheetOpen]);
  const closePanel = useCallback(() => setPanel(null), []);
  const closeLieu = useCallback(() => setLieu(null), []);
  // Une ligne du panneau d'un lieu : la mission s'y joue, dans sa scénette ou sur l'écran habituel.
  const play = useCallback(
    (mission: string) => {
      if (!lieu) return;
      setLieu(null);
      setAsking({ place: lieu.place, mission, plain: !playsInPlace(placeById(lieu.place), mission) });
    },
    [lieu],
  );
  const goPort = useCallback((spot: Exclude<PortSpot, 'quai'>) => {
    setPanel(null);
    world.current?.goToPort(spot);
  }, []);

  // Les liaisons dans la scène : la brume et les passerelles démontées des lieux fermés, les tirets de la Carte ; la pose
  // d'une passerelle annoncée par « Relier » y commence.
  useEffect(() => {
    linksNow.current = links;
    world.current?.setLinks(links);
  }, [links, ready]);

  // La Carte : les lieux ouverts sont ceux qui ne sont pas fermés.
  const openPlaces = useMemo(() => PLACES.map((p) => p.id).filter((id) => !isClosed(id)), [isClosed]);
  useEffect(() => {
    world.current?.map(mapOpen && !asking ? openPlaces : null);
  }, [mapOpen, asking, openPlaces, ready]);
  /**
   * Un lieu ouvert choisi sur la Carte : elle se ferme, Kéo y est déposé d'un coup (une coupe franche), et le focus
   * revient sur le bouton de la Carte (consultant UX UI).
   */
  const pickPlace = useCallback((placeId: PlaceId) => {
    setMapOpen(false);
    world.current?.map(null);
    world.current?.goTo(placeId, true);
    mapButton.current?.focus();
  }, []);
  /** L'Escale choisie sur la Carte : la Carte se ferme, Kéo est déposé au quai, la fiche du Port s'ouvre. */
  const pickPort = useCallback(() => {
    setMapOpen(false);
    world.current?.map(null);
    world.current?.goToPort('quai');
  }, []);
  const pickOnMap = useCallback((id: PlaceId | 'port') => (id === 'port' ? pickPort() : pickPlace(id)), [pickPlace, pickPort]);
  // Un lieu fermé touché sur la Carte (son cadenas) : sa fiche s'ouvre par-dessus, la Carte reste ouverte.
  const openClosed = useCallback((place: PlaceId) => setLieu({ place, focus: null }), []);
  // Un lieu touché dans la 3D : ouvert (l'Escale l'est toujours), on y va ; fermé, sa fiche s'ouvre.
  useEffect(() => {
    mapPick.current = (placeId) => (placeId === 'port' || openPlaces.includes(placeId) ? pickOnMap(placeId) : openClosed(placeId));
  }, [openPlaces, pickOnMap, openClosed]);
  // La liste des lieux ouverts, sur la Carte (bouton « Lieux ») ; Échap ferme la liste d'abord, puis la Carte, comme un
  // panneau.
  const closeMap = useCallback(() => setMapOpen(false), []);
  const list = usePlacesList(mapOpen && !lieu, closeMap);
  const openList = list.open;
  const toggleList = list.toggle;
  /**
   * « Relier » (GD-20, point 3) : la liaison de la grille, payée ; la fiche se ferme, la caméra ne bouge pas, les cinq
   * planches de la passerelle se posent l'une après l'autre, un toc de bois à la dernière, puis la brume du lieu se lève
   * en fondu (lot 2 ; d'un coup avec « Réduire les animations » et sur la Carte, où le cadenas laisse la place au nom et
   * le focus va sur lui). Puis « La passerelle est posée. », jamais en même temps que le toc, et la phrase d'un lieu
   * devenu reliable par cette liaison.
   */
  const relier = useCallback(
    (place: PlaceId) => {
      const bridge = isLinked(place) ? payableLink(place, state.world.links) : null;
      if (!bridge || !isLinked(place)) return;
      const waitingBefore = links.waiting;
      const sounds = settings.sounds;
      const events: LinkLayEvents = {
        tap: () => {
          tappedAt.current = performance.now();
          if (sounds) playWoodTap();
        },
        laid: () => {
          const now = linksNow.current;
          const linkable = waitingBefore.filter((p) => !now.waiting.includes(p) && now.closed.includes(p));
          const after = Math.max(0, SAID_AFTER_MS - (performance.now() - tappedAt.current));
          setSaid((was) => ({ n: (was?.n ?? 0) + 1, lines: [PASSERELLE_POSEE, ...linkable.map((p) => linkableLabel(placeById(p)))], after }));
        },
      };
      const w = world.current;
      // Annoncée avant que les liaisons changent : la scène la pose quand elle les reçoit.
      w?.layLink(place, events);
      if (!linkFromOpenWorld(bridge.id).ok) return;
      if (mapOpen) focusAfter.current = place;
      setLieu(null);
      if (!w) {
        events.tap();
        events.laid();
      }
    },
    [linkFromOpenWorld, links.waiting, mapOpen, settings.sounds, state.world.links],
  );
  // La phrase vient après le toc (jamais en même temps), reste écrite un moment, et se dit si la voix est active.
  const [saidShown, setSaidShown] = useState(false);
  const saidHide = useRef<number | undefined>(undefined);
  // Toucher la phrase ou son haut-parleur la garde écrite encore un moment, pour l'élève qui n'a pas fini de la lire
  // (référent dys).
  const holdSaid = useCallback(() => {
    window.clearTimeout(saidHide.current);
    saidHide.current = window.setTimeout(() => setSaidShown(false), SAID_MS);
  }, []);
  useEffect(() => {
    if (!said) return;
    const show = window.setTimeout(() => {
      setSaidShown(true);
      if (settings.autoRead) speak(said.lines.join(' '));
    }, said.after);
    window.clearTimeout(saidHide.current);
    // Deux phrases restent écrites deux fois plus longtemps.
    saidHide.current = window.setTimeout(() => setSaidShown(false), said.after + SAID_MS * said.lines.length);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(saidHide.current);
    };
    // La voix et son réglage ne relancent pas la phrase : seule une nouvelle pose (`said`) la relance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [said]);
  // Une ligne touchée : comme une pastille de la Carte ; la voix dit le nom du lieu, celui du panneau qui s'ouvre à
  // l'arrivée (référent dys).
  const pickFromList = useCallback(
    (id: PlaceId | 'port') => {
      const name = id === 'port' ? textes.depart?.nom : placeById(id).name;
      if (settings.autoRead && name) {
        speak(frenchTypography(name));
        named.add(id);
      }
      pickOnMap(id);
    },
    [pickOnMap, settings.autoRead, speak, textes.depart],
  );
  const listRef = useRef<HTMLDivElement>(null);
  // La liste ouverte : « Retour » et « Lieux » se tiennent à côté d'elle, jamais dessous (au-dessus du panneau du bas sur
  // tablette, à droite de la colonne sur un écran bas), relus quand elle change de taille, avant que la page se dessine.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const el = listRef.current;
    if (!stage || !el || !openList) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const column = r.top - s.top < 8 && r.width < s.width * 0.8;
      stage.style.setProperty('--lieux-gauche', column ? `${Math.round(r.right - s.left)}px` : '0px');
      stage.style.setProperty('--lieux-bas', column ? '0px' : `${Math.round(s.bottom - r.top)}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(el);
    measure();
    return () => {
      observer.disconnect();
      stage.style.removeProperty('--lieux-gauche');
      stage.style.removeProperty('--lieux-bas');
    };
  }, [openList]);

  // La construction de chaque lieu (GD-20, lot 1) : les parties de la grille, mêmes identifiants, même sauvegarde.
  const constructions = useMemo(() => {
    const of = (id: PlaceId) => {
      const biome = getBiome(placeById(id).island);
      return biome ? placeConstruction(biome.id, state.world.parts) : { shapes: [], posed: [] };
    };
    return {
      phare: of('phare'),
      quais: of('quais'),
      filets: of('filets'),
      ecluses: of('ecluses'),
      saltworks: of('saltworks'),
      engine: of('engine'),
      shipyard: of('shipyard'),
      lookout: of('lookout'),
      archives: of('archives'),
      printworks: of('printworks'),
      mangrove: of('mangrove'),
      ruins: of('ruins'),
      observatory: of('observatory'),
      commons: of('commons'),
      beacons: of('beacons'),
      ferry: of('ferry'),
    } satisfies Record<PlaceId, ReturnType<typeof of>>;
  }, [state.world.parts]);
  // Les traces des scénettes de chaque lieu : une par mission jouée en scénette, dès sa première réussite (les étoiles
  // gardées ; GD-20, point 8).
  const traces = useMemo(() => {
    const of = (id: PlaceId): string[] => {
      const p = placeById(id);
      const biome = getBiome(p.island);
      // Les missions restées sur l'écran habituel (lot L7 : Ascension, le Filon) laissent leur trace aussi.
      return biome ? [...p.scenes, ...(p.panels ?? [])].filter((m) => traceDone(exercisesOf(biome.id, m).map((e) => state.progress[e.id]?.stars ?? 0))) : [];
    };
    return {
      phare: of('phare'),
      quais: of('quais'),
      filets: of('filets'),
      ecluses: of('ecluses'),
      saltworks: of('saltworks'),
      engine: of('engine'),
      shipyard: of('shipyard'),
      lookout: of('lookout'),
      archives: of('archives'),
      printworks: of('printworks'),
      mangrove: of('mangrove'),
      ruins: of('ruins'),
      observatory: of('observatory'),
      commons: of('commons'),
      beacons: of('beacons'),
      ferry: of('ferry'),
    } satisfies Record<PlaceId, string[]>;
  }, [state.progress]);
  // Ce que la scène montre déjà, et le lieu de la dernière question : une partie arrivée pendant une question s'y pose
  // après le bilan, sous les yeux de l'élève ; les autres changements (une partie posée dans la grille) sont là, sans
  // pose. Rien ne change pendant une question : la partie attend la fin du bilan.
  const shownBuilt = useRef<Record<PlaceId, readonly PartShape[]> | null>(null);
  const askedPlace = useRef<PlaceId | null>(null);
  useEffect(() => {
    if (!asking) return;
    askedPlace.current = asking.place;
    setPosePending(true);
  }, [asking]);
  useEffect(() => {
    const w = world.current;
    if (!w || asking) return;
    const built: Record<PlaceId, readonly PartShape[]> = {
      phare: posedShapes(constructions.phare),
      quais: posedShapes(constructions.quais),
      filets: posedShapes(constructions.filets),
      ecluses: posedShapes(constructions.ecluses),
      saltworks: posedShapes(constructions.saltworks),
      engine: posedShapes(constructions.engine),
      shipyard: posedShapes(constructions.shipyard),
      lookout: posedShapes(constructions.lookout),
      archives: posedShapes(constructions.archives),
      printworks: posedShapes(constructions.printworks),
      mangrove: posedShapes(constructions.mangrove),
      ruins: posedShapes(constructions.ruins),
      observatory: posedShapes(constructions.observatory),
      commons: posedShapes(constructions.commons),
      beacons: posedShapes(constructions.beacons),
      ferry: posedShapes(constructions.ferry),
    };
    const before = shownBuilt.current;
    const place = askedPlace.current;
    shownBuilt.current = built;
    askedPlace.current = null;
    const fresh = before && place ? built[place].filter((s) => !before[place].includes(s)) : [];
    if (!w.setPlaces({ built, traces }, place && fresh.length ? { place, parts: fresh } : undefined)) setPosePending(false);
  }, [constructions, traces, asking, ready]);
  // L'état de chaque lieu sur la Carte, en icône et en mot (les mots d'état de l'univers).
  const states = useMemo(
    () => ({
      phare: constructionState(constructions.phare),
      quais: constructionState(constructions.quais),
      filets: constructionState(constructions.filets),
      ecluses: constructionState(constructions.ecluses),
      saltworks: constructionState(constructions.saltworks),
      engine: constructionState(constructions.engine),
      shipyard: constructionState(constructions.shipyard),
      lookout: constructionState(constructions.lookout),
      archives: constructionState(constructions.archives),
      printworks: constructionState(constructions.printworks),
      mangrove: constructionState(constructions.mangrove),
      ruins: constructionState(constructions.ruins),
      observatory: constructionState(constructions.observatory),
      commons: constructionState(constructions.commons),
      beacons: constructionState(constructions.beacons),
      ferry: constructionState(constructions.ferry),
    }),
    [constructions],
  );

  const closeQuestion = useCallback(() => {
    if (asking) setBackTo({ place: asking.place, mission: asking.mission });
    setAsking(null);
  }, [asking]);
  // Le retour d'une mission : après le bilan et la pose de la partie gagnée, la liste du lieu se rouvre, le focus sur la
  // ligne jouée (consultant UX UI).
  // Une pose qui ne dirait jamais sa fin (la scène arrêtée) ne retient ni la liste ni les célébrations.
  const poseOver = useCallback(() => setPosePending(false), []);
  usePoseGuard(posePending && !asking, poseOver);
  useEffect(() => {
    if (!backTo || asking || posePending) return;
    setLieu({ place: backTo.place, focus: backTo.mission });
    setBackTo(null);
  }, [backTo, asking, posePending]);
  const goNext = () => {
    if (!next) return;
    const title = missionTitle(next.place.island, next.mission);
    if (settings.autoRead) {
      speak(frenchTypography(`${next.place.name}. ${title}`));
      named.add(next.place.id);
    }
    world.current?.goTo(next.place.id, true);
  };
  // Court : le nom du lieu, puis la mission (consultant UX UI et référent dys).
  const label = next ? `${next.place.name}, ${missionTitle(next.place.island, next.mission)}` : '';
  // La marque dit aussi la distance, en mots, lue à la demande (jamais à chaque image).
  const markLabel = next ? `${label}, ${DISTANCE_WORDS[far]}` : '';

  return (
    <div className="world-page open-world">
      <div className="world-stage" data-scene ref={stageRef}>
        <div ref={host} className="open-world-canvas" />
        {!ready && <Loading className="world-loading" text="Chargement du monde…" />}
        {next && !asking && !mapOpen && !sheetOpen && (
          <button type="button" ref={markRef} className="open-world-mark" aria-label={markLabel} onClick={goNext}>
            <span className="open-world-arrow-box" aria-hidden="true">
              <span ref={arrowRef} className="open-world-arrow">
                <Icon name="nord" />
              </span>
              {/* La distance en signe, jamais en texte (consultant UX UI) : un, deux ou trois points pleins, de près à loin. */}
              <span className="open-world-distance">
                <i />
                <i />
                <i />
              </span>
            </span>
            {/* Le nom du lieu seul : aucune icône de lieu n'existe encore (le sapin de l'île d'aujourd'hui ne dit pas le Phare). */}
            <span className="open-world-mark-word">{next.place.name}</span>
          </button>
        )}
        {/* Un cadenas sur chaque lieu fermé : une icône sans texte, dite aux lecteurs d'écran (référent dys). */}
        <div ref={locksRef} className="open-world-locks" hidden={Boolean(asking) || mapOpen || sheetOpen}>
          {links.closed.map((id) => (
            <span key={id} className="open-world-lock" data-lieu={id} role="img" aria-label={`${placeById(id).name} : fermé, la passerelle est démontée`} hidden>
              <Icon name="lock" />
            </span>
          ))}
        </div>
        {/* La Carte : Kéo, chaque lieu à sa place sur l'île, en étiquettes de la page (rien n'est écrit dans la 3D). */}
        {mapOpen && !asking && (
          <MapLabels openPlaces={openPlaces} states={states} words={textes.etatsDIle} onPick={pickOnMap} placer={mapPlacer} onClosed={openClosed} orderLabel={orderLabel} portName={textes.depart?.nom} onCrowded={reframeMap} />
        )}
        {/* La liste des lieux ouverts : un voile léger sur la Carte, qu'un toucher ferme sans rien choisir (aucun toucher ne
            le traverse : ni la 3D ni une étiquette ne le reçoivent), et le panneau, en bas sur tablette, en colonne à
            gauche sur un écran bas. */}
        {openList && !asking && (
          <>
            <div className="open-world-voile" aria-hidden="true" onClick={list.close} />
            <div ref={listRef} className="open-world-panel open-world-panel-lieux-ouverts">
              <PlacesSheet rows={placesRows(openPlaces, states, textes.etatsDIle, nextPlace?.id ?? null, textes.depart?.nom)} onPick={pickFromList} onClose={list.close} />
            </div>
          </>
        )}
        {/* Les accès directs (décision « Sans Menu », GD-20, lot 1) : la colonne du monde en grille, telle quelle ; les
            commandes délavées tant qu'elles ne se livrent pas dans le monde continu. Masquée pendant une question. */}
        {!asking && !sheetOpen && <WorldShortcuts a="6e" requestsOpen={false} requestsLater resumeFrom={portResume} resumeAt={placeResume} />}
        {!asking && !sheetOpen && <SettingsButton />}
        {/* Le panneau ouvert de l'Escale (GD-20, lot 2) : comme une question, il masque les accès directs, Réglages, la
            Carte et « Y aller » ; un seul panneau à la fois. */}
        {panel && !asking && textes.depart && (
          <div ref={panelRef} className={`open-world-panel open-world-panel-${panel}`}>
            <PortPanels panel={panel} names={textes.depart} onGo={goPort} onClose={closePanel} />
          </div>
        )}
        {/* Le panneau d'un lieu (GD-20, point 8) : comme celui d'une porte, il masque les accès directs, Réglages, la Carte
            et « Y aller ». */}
        {lieu && !asking && (
          <div ref={panelRef} className="open-world-panel open-world-panel-lieu">
            {isLinked(lieu.place) && isClosed(lieu.place) ? (
              // Un lieu fermé (GD-20, point 3) : sa fiche, « Relier », aucune mission ; pas encore reliable (après un
              // voisin), le voisin à relier d'abord, le plus proche de Kéo, dont le bouton ouvre la fiche.
              <ClosedPlaceSheet
                place={placeById(lieu.place)}
                after={afterOf(lieu.place)}
                onAfter={(n: PlaceId) => setLieu({ place: n, focus: null })}
                price={payableLink(lieu.place, state.world.links)?.cost ?? 0}
                have={payableBlocks(state.stock)}
                suggested={links.suggested === lieu.place}
                onLink={() => relier(lieu.place)}
                onClose={closeLieu}
              />
            ) : (
              <PlacePanel
                place={placeById(lieu.place)}
                missions={missionsOfPlace(placeById(lieu.place), bornes)}
                suggested={next?.place.id === lieu.place ? next.mission : null}
                focus={lieu.focus}
                onPlay={play}
                onClose={closeLieu}
              />
            )}
          </div>
        )}
        {/* La phrase de la passerelle posée, sur fond uni, un moment (GD-20, point 3) : jamais pendant une question. La
            zone reste dans la page, vide le reste du temps, pour que les lecteurs d'écran annoncent la phrase ; le temps
            qu'elle est écrite, un haut-parleur la fait réentendre, et le toucher la garde écrite (référent dys). Sur la Carte, elle se tient en haut,
            hors des noms des lieux du sud. */}
        <div className={`open-world-said${mapOpen ? ' on-map' : ''}`} data-shown={saidShown && !asking ? 'oui' : 'non'} onPointerDown={holdSaid} onFocus={holdSaid}>
          <p role="status">{saidShown && !asking && said ? said.lines.map((line) => <span key={line}>{line}</span>) : ''}</p>
          {saidShown && !asking && said && <SpeakButton text={said.lines.join(' ')} label="Réécouter" compact />}
        </div>
        {asking && world.current && (
          <WorldQuestion key={`${asking.place}-${asking.mission}`} place={asking.place} mission={asking.mission} plain={asking.plain} world={world.current} onClose={closeQuestion} />
        )}
        {/* La Carte : le même bouton que dans le reste du jeu, dans la barre du bas, à gauche (« Y aller » tient le milieu). */}
        {!asking && !sheetOpen && (
          <nav className={`open-world-bar${openList ? ' avec-liste' : ''}`} aria-label="Monde">
            {/* Un seul mot, toujours écrit sous l'icône, dans le bouton ; la Carte ouverte, il dit comment en sortir. */}
            <button
              type="button"
              ref={mapButton}
              className="button open-world-map-button"
              data-tuto="carte"
              onClick={() => setMapOpen(!mapOpen)}
            >
              <Icon name={mapOpen ? 'back' : 'map'} />
              <span className="open-world-map-word">{mapOpen ? 'Retour' : 'Carte'}</span>
            </button>
            {/* « Lieux », sur la Carte seulement, à droite de « Retour », un écart net entre eux : le mot toujours écrit sous
                l'icône ; il ouvre et ferme la liste des lieux ouverts. */}
            {mapOpen && (
              <button
                type="button"
                ref={list.button}
                className="button open-world-map-button open-world-lieux-button"
                aria-label={PLACES_BUTTON_LABEL}
                aria-expanded={openList}
                aria-controls={PLACES_SHEET_ID}
                onClick={toggleList}
              >
                <Icon name="liste" />
                <span className="open-world-map-word">Lieux</span>
              </button>
            )}
          </nav>
        )}
        {!asking && !mapOpen && !sheetOpen && (
          <div className="open-world-go">
            {!next && !walking && <p className="open-world-go-reason">Aucune mission à faire ici pour l’instant.</p>}
            {walking ? (
              <button type="button" className="button" onClick={() => world.current?.skip()}>
                <Icon name="play" /> Passer le trajet
              </button>
            ) : (
              <button type="button" className="button primary" disabled={!next} aria-label={next ? `Y aller : ${label}` : undefined} onClick={goNext}>
                <Icon name="footprints" /> Y aller
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pose les cadenas des lieux sous la brume, image par image, sans passer par React : chacun au-dessus de son lieu
 * quand il se voit, caché sinon (jamais au bord de l'écran : seul le lieu suivant a sa flèche).
 */
function placeLocks(root: HTMLElement | null, locks: readonly LockOnScreen[]): void {
  if (!root) return;
  for (const el of root.children) {
    if (!(el instanceof HTMLElement)) continue;
    const lock = locks.find((l) => l.place === el.dataset.lieu);
    const shown = Boolean(lock?.shown);
    if (el.hidden === shown) el.hidden = !shown;
    if (!lock || !shown) continue;
    // Le style n'est écrit que quand la place change (la caméra arrêtée : rien à refaire).
    const transform = `translate(${Math.round(lock.x)}px, ${Math.round(lock.y)}px)`;
    if (lockTransforms.get(el) === transform) continue;
    lockTransforms.set(el, transform);
    el.style.transform = transform;
  }
}

/** La phrase fixe de la passerelle posée (GD-20, point 3) : la même pour tous les lieux, sans accord à faire. */
const PASSERELLE_POSEE = 'La passerelle est posée.';
/** Elle vient au moins tant de millisecondes après le toc (jamais en même temps), et reste écrite tant de millisecondes par phrase. */
const SAID_AFTER_MS = 450;
const SAID_MS = 4000;

/** La dernière place posée de chaque cadenas. */
const lockTransforms = new WeakMap<HTMLElement, string>();

/** La distance de la marque en mots, pour la voix : un, deux ou trois points. */
const DISTANCE_WORDS = { 1: 'tout près', 2: 'pas loin', 3: 'loin' } as const;

/** L'écart minimal entre la marque et le bord de l'écran ou un bouton, en pixels. */
const MARK_EDGE = 8;

/** La zone de la colonne des accès directs que la marque évite : sa largeur au moins, et sa marge sous la colonne. */
const COLUMN_ZONE = { width: 72, below: 16 } as const;

/**
 * Pose la marque à l'écran, image par image, sans passer par React et sans lire la mise en page (les dimensions sont
 * relues par le `ResizeObserver`) : sur son lieu, au-dessus du point, ou au bord, sa flèche tournée vers lui et la
 * distance en points dessous ; le panneau reste entier à l'écran et hors des boutons Réglages et « Y aller ».
 */
function placeMark(mark: HTMLElement | null, arrow: HTMLElement | null, m: MarkOnScreen | null, size: { width: number; height: number; markW: number; markH: number; obstacles: Obstacle[] }): void {
  if (!mark) return;
  mark.hidden = !m;
  if (!m) return;
  mark.classList.toggle('hors-champ', !m.inside);
  const far = String(m.far);
  if (mark.dataset.loin !== far) mark.dataset.loin = far;
  const { markW: w, markH: h } = size;
  // Hors champ, centrée sur son point ; dans l'écran, au-dessus de lui, ou à sa droite (à côté de la lanterne du Phare).
  const box = !m.inside
    ? { left: m.x - w / 2, top: m.y - h / 2, width: w, height: h }
    : m.beside
      ? { left: m.x + MARK_EDGE, top: m.y - h / 2, width: w, height: h }
      : { left: m.x - w / 2, top: m.y - h, width: w, height: h };
  // Au Port : jamais sous la ligne de toit (ni sur un cartouche ni sur une porte), jamais sur Kéo ; elle remonte.
  if (m.inside) {
    let limit = m.ceiling ?? Infinity;
    if (m.keo && box.left < m.keo.left + m.keo.width && m.keo.left < box.left + w) limit = Math.min(limit, m.keo.top - MARK_EDGE);
    if (box.top + h > limit) box.top = limit - h;
  }
  const r = keepClear(box, size.obstacles, size.width, size.height, MARK_EDGE, MARK_EDGE);
  mark.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
  if (arrow) arrow.style.transform = m.inside ? '' : `rotate(${m.angle}rad)`;
}
