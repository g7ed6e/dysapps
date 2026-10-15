// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (le nom de
// son lieu), une flèche au bord de l'écran quand elle est hors champ, la distance en points dessous ; « Y aller »,
// toujours à la même place, y mène d'un coup (piste 1 : le trajet est toujours sauté ; on marche en touchant le monde). À l'arrivée, la mission se joue dans le lieu (lot 4, ./WorldQuestion.tsx), avec le lanceur
// d'exercice commun, dans la scénette du lieu ; « Vue simple » y montre la même question en liste. Les pièces
// durables des lieux se tirent des étoiles gardées : rien de neuf dans la sauvegarde. La Carte des lieux ouverts (piste 1,
// lot 3) s'ouvre du bouton « Carte », comme ailleurs dans le jeu : l'île vue de haut, un lieu ouvert touché y dépose
// Kéo. Chargé à la demande.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { frenchTypography } from '../../../components/math/RichText';
import { useSettings } from '../../../core/SettingsContext';
import { useMoinsDAnimations } from '../../../core/motion';
import { useTextes } from '../../../universes';
import { useBlocland } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import { exercisesOf } from '../../exercises';
import { mesuresDemandees, meterShown } from '../../rendering';
import { SettingsButton, WorldShortcuts } from '../../WorldShortcuts';
import type { PartShape } from '../../world/continu/construction';
import { keepClear, missionOfPlace, nextMission, veiledPlaces, type MarkOnScreen, type Obstacle } from '../../world/continu/mission';
import { PLACES, placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { traceDone } from '../../world/continu/questions';
import { modeleDuMonde } from '../../world/model';
import { gameAsShown } from '../../world/stories';
import { constructionState, placeConstruction, posedShapes } from './constructionParts';
import { MapLabels } from './MapLabels';
import { createOpenWorld, type LockOnScreen, type MapSpotOnScreen, type OpenWorld } from './scene';
import { WorldQuestion } from './WorldQuestion';
import './openWorld.css';

declare global {
  interface Window {
    /** Le monde ouvert, pour les captures et les mesures (en développement, ou avec `?mesures`). */
    __dysappsMondeOuvert?: Pick<OpenWorld, 'goTo' | 'skip' | 'info'>;
  }
}

/** Le titre d'une mission d'une île, pour la dire. */
const missionTitle = (island: string, mission: string) => getBiome(island)?.exercises.find((x) => x.id === mission)?.title ?? '';

export default function OpenWorldPage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const textes = useTextes();
  const { settings, speak } = useSettings();
  const reduceMotion = useMoinsDAnimations();

  // Les missions des quatre lieux et leur état : le modèle du monde, commun aux deux univers. `modeleDuMonde` lit la
  // LV2 par `lv2Courante()`, pas par un argument : `settings.lv2` refait le modèle quand l'élève la change.
  const vu = useMemo(() => gameAsShown(state, textes), [state, textes]);
  // `settings.lv2` n'est pas lu dans le calcul, il le refait (voir plus haut) : la règle le croit inutile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(vu, '6e', textes.archipels, textes.libelles), [vu, textes, settings.lv2]);
  const next = useMemo(() => nextMission(modele.bornes, modele.destination), [modele]);
  const nextPlace = next?.place ?? null;

  // Kéo part devant le lieu de l'adresse (le retour d'une mission), sinon celui de la partie, sinon le Phare.
  const [start] = useState<PlaceId>(() => placeOfIsland(biomeId ?? '')?.id ?? placeOfIsland(state.world.place ?? '')?.id ?? 'phare');

  const host = useRef<HTMLDivElement>(null);
  const world = useRef<OpenWorld | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  // Les cadenas des lieux sous la brume, posés à chaque image par la scène (sans passer par React).
  const locksRef = useRef<HTMLDivElement>(null);
  // Le nombre de scènes faites : 0 avant la première ; refaite (« Réduire les animations » changé), elle reçoit de nouveau
  // la marque, la brume, la Carte et les lieux.
  const [ready, setReady] = useState(0);
  const [walking, setWalking] = useState(false);
  // La mission posée dans un lieu, à l'arrivée de Kéo : la question se joue sur la scène.
  const [asking, setAsking] = useState<{ place: PlaceId; mission: string } | null>(null);
  // La Carte des lieux ouverts (lot 3) : un état de la page, pas une adresse (`/adventure/map` mène à la Carte du
  // monde en grille) ; ses lieux posés à chaque image par la scène, comme les cadenas.
  const [mapOpen, setMapOpen] = useState(false);
  // Ce que les rappels de la scène appellent sur la Carte : poser les étiquettes, choisir un lieu touché dans la 3D.
  const mapPlacer = useRef<((spots: readonly MapSpotOnScreen[]) => void) | null>(null);
  // « Fermé pour l'instant », au toucher d'un lieu fermé sur la Carte : quelques secondes, au-dessus de « Retour ».
  const [closedNote, setClosedNote] = useState(0);
  const showClosed = useCallback(() => setClosedNote((n) => n + 1), []);
  const mapPick = useRef<(place: PlaceId) => void>(() => {});
  const mapButton = useRef<HTMLButtonElement>(null);
  // La distance au prochain lieu, pour la voix (avis du référent dys) : relue à chaque image, mais l'état ne change
  // qu'avec le palier (un, deux ou trois points) : le libellé de la marque n'est refait que là.
  const [far, setFar] = useState<1 | 2 | 3>(1);
  const farRef = useRef(far);

  // Les dimensions que la marque lit à chaque image, relues seulement quand la page, la marque ou un bouton change de
  // taille (jamais une mise en page forcée par image).
  const [layout] = useState(() => ({ width: 0, height: 0, markW: 0, markH: 0, obstacles: [] as Obstacle[] }));
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
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
  }, [layout, next, walking, asking]);

  // Ce que les rappels de la scène lisent au moment où ils sont appelés (la scène n'est pas refaite pour eux).
  const latest = useRef({ next, bornes: modele.bornes });
  latest.current = { next, bornes: modele.bornes };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = createOpenWorld(el, {
      start,
      reduceMotion,
      meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() },
      onDepart: () => setWalking(true),
      onArrive: (placeId) => {
        setWalking(false);
        if (!placeId) return;
        const { next: n, bornes } = latest.current;
        const mission = n?.place.id === placeId ? n.mission : missionOfPlace(placeById(placeId), bornes);
        if (mission) setAsking({ place: placeId, mission });
      },
      onLocks: (locks) => placeLocks(locksRef.current, locks),
      onMapPlaces: (spots) => mapPlacer.current?.(spots),
      onMapPick: (placeId) => mapPick.current(placeId),
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
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsMondeOuvert = { goTo: w.goTo, skip: w.skip, info: w.info };
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

  // La brume sur les lieux dont la mission n'a pas encore été jouée, sauf le prochain (la scène la lève à l'approche).
  const veiled = useMemo(() => veiledPlaces(modele.bornes, next), [modele, next]);
  useEffect(() => {
    world.current?.setVeiled(veiled);
  }, [veiled, ready]);

  // La Carte : les lieux ouverts sont ceux qui ne sont pas sous la brume (déjà joués, ou la prochaine mission).
  const openPlaces = useMemo(() => PLACES.map((p) => p.id).filter((id) => !veiled.includes(id)), [veiled]);
  useEffect(() => {
    world.current?.map(mapOpen && !asking ? openPlaces : null);
  }, [mapOpen, asking, openPlaces, ready]);
  /**
   * Un lieu ouvert choisi sur la Carte : elle se ferme, Kéo y est déposé d'un coup (une coupe franche), et le focus
   * revient sur le bouton de la Carte (consultant UX UI).
   */
  const pickPlace = useCallback((placeId: PlaceId) => {
    setMapOpen(false);
    setClosedNote(0);
    world.current?.map(null);
    world.current?.goTo(placeId, true);
    mapButton.current?.focus();
  }, []);
  // Un lieu touché dans la 3D : ouvert, on y va ; fermé, la Carte le dit.
  useEffect(() => {
    mapPick.current = (placeId) => (openPlaces.includes(placeId) ? pickPlace(placeId) : showClosed());
  }, [openPlaces, pickPlace, showClosed]);
  // Le mot s'efface après quelques secondes (un nouveau toucher le garde), ou avec la Carte.
  useEffect(() => {
    if (!closedNote) return;
    const t = window.setTimeout(() => setClosedNote(0), CLOSED_NOTE_MS);
    return () => window.clearTimeout(t);
  }, [closedNote]);
  // Échap ferme la Carte, comme un panneau.
  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMapOpen(false);
      setClosedNote(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  // La construction de chaque lieu (GD-20, lot 1) : les parties de la grille, mêmes identifiants, même sauvegarde.
  const constructions = useMemo(() => {
    const of = (id: PlaceId) => {
      const biome = getBiome(placeById(id).island);
      return biome ? placeConstruction(biome.id, state.world.parts) : { shapes: [], posed: [] };
    };
    return { phare: of('phare'), quais: of('quais'), filets: of('filets'), ecluses: of('ecluses') } satisfies Record<PlaceId, ReturnType<typeof of>>;
  }, [state.world.parts]);
  // La trace de la scénette de chaque lieu, dès la première réussite de sa mission (les étoiles gardées).
  const traces = useMemo(() => {
    const of = (id: PlaceId): boolean => {
      const p = placeById(id);
      const biome = getBiome(p.island);
      return biome ? traceDone(exercisesOf(biome.id, p.mission).map((e) => state.progress[e.id]?.stars ?? 0)) : false;
    };
    return { phare: of('phare'), quais: of('quais'), filets: of('filets'), ecluses: of('ecluses') } satisfies Record<PlaceId, boolean>;
  }, [state.progress]);
  // Ce que la scène montre déjà, et le lieu de la dernière question : une partie arrivée pendant une question s'y pose
  // après le bilan, sous les yeux de l'élève ; les autres changements (une partie posée dans la grille) sont là, sans
  // pose. Rien ne change pendant une question : la partie attend la fin du bilan.
  const shownBuilt = useRef<Record<PlaceId, readonly PartShape[]> | null>(null);
  const askedPlace = useRef<PlaceId | null>(null);
  useEffect(() => {
    if (asking) askedPlace.current = asking.place;
  }, [asking]);
  useEffect(() => {
    const w = world.current;
    if (!w || asking) return;
    const built: Record<PlaceId, readonly PartShape[]> = {
      phare: posedShapes(constructions.phare),
      quais: posedShapes(constructions.quais),
      filets: posedShapes(constructions.filets),
      ecluses: posedShapes(constructions.ecluses),
    };
    const before = shownBuilt.current;
    const place = askedPlace.current;
    shownBuilt.current = built;
    askedPlace.current = null;
    const fresh = before && place ? built[place].filter((s) => !before[place].includes(s)) : [];
    w.setPlaces({ built, traces }, place && fresh.length ? { place, parts: fresh } : undefined);
  }, [constructions, traces, asking, ready]);
  // L'état de chaque lieu sur la Carte, en icône et en mot (les mots d'état de l'univers).
  const states = useMemo(
    () => ({ phare: constructionState(constructions.phare), quais: constructionState(constructions.quais), filets: constructionState(constructions.filets), ecluses: constructionState(constructions.ecluses) }),
    [constructions],
  );

  const closeQuestion = useCallback(() => setAsking(null), []);
  const goNext = () => {
    if (!next) return;
    const title = missionTitle(next.place.island, next.mission);
    if (settings.autoRead) speak(frenchTypography(`${next.place.name}. ${title}`));
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
        {next && !asking && !mapOpen && (
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
        {/* Un cadenas sur chaque lieu encore sous la brume : une icône sans texte, dite aux lecteurs d'écran (référent dys). */}
        <div ref={locksRef} className="open-world-locks" hidden={Boolean(asking) || mapOpen}>
          {veiled.map((id) => (
            <span key={id} className="open-world-lock" data-lieu={id} role="img" aria-label={`${placeById(id).name} : sous la brume, pas encore ouvert`} hidden>
              <Icon name="lock" />
            </span>
          ))}
        </div>
        {/* La Carte : Kéo, chaque lieu à sa place sur l'île, en étiquettes de la page (rien n'est écrit dans la 3D). */}
        {mapOpen && !asking && <MapLabels openPlaces={openPlaces} states={states} words={textes.etatsDIle} onPick={pickPlace} placer={mapPlacer} onClosed={showClosed} />}
        {/* Les accès directs (décision « Sans Menu », GD-20, lot 1) : la colonne du monde en grille, telle quelle ; les
            commandes délavées tant qu'elles ne se livrent pas dans le monde continu. Masquée pendant une question. */}
        {!asking && <WorldShortcuts a="6e" requestsOpen={false} requestsLater />}
        {!asking && <SettingsButton />}
        {asking && world.current && (
          <WorldQuestion key={`${asking.place}-${asking.mission}`} place={asking.place} mission={asking.mission} world={world.current} onClose={closeQuestion} />
        )}
        {/* La Carte : le même bouton que dans le reste du jeu, dans la barre du bas, à gauche (« Y aller » tient le milieu). */}
        {!asking && (
          <nav className="open-world-bar" aria-label="Monde">
            {/* Au toucher d'un lieu fermé, à une place fixe et libre, juste au-dessus de « Retour », sur fond uni : jamais
                sur la Carte, où il cachait un cadenas ou un nom (relectures dys et UX UI). */}
            {mapOpen && (
              <p className="open-world-map-status" role="status">
                {closedNote ? 'Fermé pour l’instant' : ''}
              </p>
            )}
            {/* Un seul mot, toujours écrit sous l'icône, dans le bouton ; la Carte ouverte, il dit comment en sortir. */}
            <button
              type="button"
              ref={mapButton}
              className="button open-world-map-button"
              data-tuto="carte"
              onClick={() => {
                setMapOpen(!mapOpen);
                setClosedNote(0);
              }}
            >
              <Icon name={mapOpen ? 'back' : 'map'} />
              <span className="open-world-map-word">{mapOpen ? 'Retour' : 'Carte'}</span>
            </button>
          </nav>
        )}
        {!asking && !mapOpen && (
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

/** Le temps où « Fermé pour l'instant » reste écrit, en millisecondes. */
const CLOSED_NOTE_MS = 4000;

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
  const r = keepClear(box, size.obstacles, size.width, size.height, MARK_EDGE, MARK_EDGE);
  mark.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
  if (arrow) arrow.style.transform = m.inside ? '' : `rotate(${m.angle}rad)`;
}
