// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (le nom de
// son lieu), une flèche au bord de l'écran quand elle est hors champ ; « Y aller », toujours à la même place, y
// mène (le trajet se passe). À l'arrivée, la mission se joue dans le lieu (lot 4, ./WorldQuestion.tsx), avec le lanceur
// d'exercice commun ; « Vue simple » rouvre l'écran classique de la même mission (./missionScreen.ts). Les pièces
// durables des lieux se tirent des étoiles gardées : rien de neuf dans la sauvegarde. Chargé à la demande.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { SettingsButton } from '../../WorldShortcuts';
import { CLOSE_UP_INSETS, type GoPanel } from '../../world/continu/camera';
import { keepClear, missionOfPlace, nextMission, type MarkOnScreen, type ScreenRect } from '../../world/continu/mission';
import { placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { piecesOf } from '../../world/continu/questions';
import { modeleDuMonde } from '../../world/model';
import { gameAsShown } from '../../world/stories';
import { missionScreenInteraction } from './missionScreen';
import { createOpenWorld, type OpenWorld } from './scene';
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
  const navigate = useNavigate();
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
  const [ready, setReady] = useState(false);
  const [walking, setWalking] = useState(false);
  // La mission posée dans un lieu, à l'arrivée de Kéo : la question se joue sur la scène.
  const [asking, setAsking] = useState<{ place: PlaceId; mission: string } | null>(null);

  // Les dimensions que la marque lit à chaque image, relues seulement quand la page, la marque ou un bouton change de
  // taille (jamais une mise en page forcée par image).
  const [layout] = useState(() => ({ width: 0, height: 0, markW: 0, markH: 0, obstacles: [] as ScreenRect[], go: null as GoPanel | null }));
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      layout.width = s.width;
      layout.height = s.height;
      layout.markW = markRef.current?.offsetWidth ?? 0;
      layout.markH = markRef.current?.offsetHeight ?? 0;
      layout.obstacles = [...stage.querySelectorAll<HTMLElement>('.world-settings, .open-world-go')].map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
      });
      // « Y aller » pour les cadrages rapprochés : sa demi-largeur depuis le milieu, sa hauteur depuis le bas.
      const goRect = stage.querySelector('.open-world-go')?.getBoundingClientRect();
      if (goRect && goRect.width > 0) {
        layout.go = {
          halfWidth: Math.max(s.left + s.width / 2 - goRect.left, goRect.right - s.left - s.width / 2),
          height: s.bottom - goRect.top,
        };
        world.current?.setGoPanel(layout.go);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const el of stage.querySelectorAll('.open-world-mark, .world-settings, .open-world-go')) observer.observe(el);
    measure();
    return () => observer.disconnect();
    // La marque et « Y aller » changent d'élément avec la prochaine mission et la marche : on les observe de nouveau.
  }, [layout, next, walking, asking]);

  // Ce que les rappels de la scène lisent au moment où ils sont appelés (la scène n'est pas refaite pour eux).
  const interaction = useMemo(() => missionScreenInteraction(navigate), [navigate]);
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
      onMark: (m, beside) => placeMark(markRef.current, arrowRef.current, m, beside, layout),
    });
    world.current = w;
    if (layout.go) w.setGoPanel(layout.go);
    setReady(true);
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

  // Les pièces durables de chaque lieu : une à la première mission réussie, une deuxième à trois étoiles.
  const pieces = useMemo(() => {
    const of = (id: PlaceId): number => {
      const p = placeById(id);
      const biome = getBiome(p.island);
      return biome ? piecesOf(exercisesOf(biome.id, p.mission).map((e) => state.progress[e.id]?.stars ?? 0)) : 0;
    };
    const out: Record<PlaceId, number> = { phare: of('phare'), quais: of('quais'), filets: of('filets'), ecluses: of('ecluses') };
    return out;
  }, [state.progress]);
  useEffect(() => {
    world.current?.setPieces(pieces);
  }, [pieces, ready]);

  const closeQuestion = useCallback(() => setAsking(null), []);
  const simpleView = useCallback(() => {
    if (asking) interaction.open(asking.place, asking.mission);
  }, [asking, interaction]);

  const goNext = () => {
    if (!next) return;
    const title = missionTitle(next.place.island, next.mission);
    if (settings.autoRead) speak(frenchTypography(`${next.place.name}. ${title}`));
    world.current?.goTo(next.place.id);
  };
  // Court : le nom du lieu, puis la mission (consultant UX UI et référent dys).
  const label = next ? `${next.place.name}, ${missionTitle(next.place.island, next.mission)}` : '';

  return (
    <div className="world-page open-world">
      <div className="world-stage" data-scene ref={stageRef}>
        <div ref={host} className="open-world-canvas" />
        {!ready && <Loading className="world-loading" text="Chargement du monde…" />}
        {next && !asking && (
          <button type="button" ref={markRef} className="open-world-mark" style={MARK_STYLE} aria-label={label} onClick={goNext}>
            <span ref={arrowRef} className="open-world-arrow" aria-hidden="true">
              <Icon name="nord" />
            </span>
            {/* Le nom du lieu seul : aucune icône de lieu n'existe encore (le sapin de l'île d'aujourd'hui ne dit pas le Phare). */}
            <span className="open-world-mark-word">{next.place.name}</span>
          </button>
        )}
        {!asking && <SettingsButton />}
        {asking && world.current && (
          <WorldQuestion key={`${asking.place}-${asking.mission}`} place={asking.place} mission={asking.mission} world={world.current} onClose={closeQuestion} onSimpleView={simpleView} />
        )}
        {!asking && (
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
 * La largeur que le cadrage réserve à droite d'une marque posée à côté du sommet d'un lieu (`CLOSE_UP_INSETS`) : la
 * marque n'en prend pas plus et passe à la ligne entre les mots (openWorld.css, `.a-cote`).
 */
const MARK_STYLE = { '--marque-a-cote': `${CLOSE_UP_INSETS.markWidth}px` } as CSSProperties;

/** L'écart minimal entre la marque et le bord de l'écran ou un bouton, en pixels. */
const MARK_EDGE = 8;

/**
 * Pose la marque à l'écran, image par image, sans passer par React et sans lire la mise en page (les dimensions sont
 * relues par le `ResizeObserver`) : sur son lieu, au-dessus du point, ou à sa droite (`beside`, à côté du sommet d'un
 * lieu haut sur un écran bas), ou au bord, sa flèche tournée vers lui ; le panneau reste entier à l'écran et hors des
 * boutons Réglages et « Y aller ».
 */
function placeMark(mark: HTMLElement | null, arrow: HTMLElement | null, m: MarkOnScreen | null, beside: boolean, size: { width: number; height: number; markW: number; markH: number; obstacles: ScreenRect[] }): void {
  if (!mark) return;
  mark.hidden = !m;
  if (!m) return;
  mark.classList.toggle('hors-champ', !m.inside);
  mark.classList.toggle('a-cote', m.inside && beside);
  const { markW: w, markH: h } = size;
  const box = !m.inside
    ? { left: m.x - w / 2, top: m.y - h / 2, width: w, height: h }
    : beside
      ? { left: m.x + CLOSE_UP_INSETS.markGap, top: m.y - h / 2, width: w, height: h }
      : { left: m.x - w / 2, top: m.y - h, width: w, height: h };
  const r = keepClear(box, size.obstacles, size.width, size.height, MARK_EDGE, MARK_EDGE);
  mark.style.transform = `translate(${Math.round(r.left)}px, ${Math.round(r.top)}px)`;
  if (arrow) arrow.style.transform = m.inside ? '' : `rotate(${m.angle}rad)`;
}
