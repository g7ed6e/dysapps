// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (le nom de
// son lieu), une flèche au bord de l'écran quand elle est hors champ ; « Y aller », toujours à la même place, y
// mène (le trajet se passe). À l'arrivée, la mission s'ouvre (`MissionInteraction`, l'écran de mission actuel pour
// l'instant). Rien de neuf dans la sauvegarde : la progression des missions reste commune. Chargé à la demande.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Loading } from '../../../components/Loading';
import { frenchTypography } from '../../../components/math/RichText';
import { useSettings } from '../../../core/SettingsContext';
import { useMoinsDAnimations } from '../../../core/motion';
import { useTextes } from '../../../universes';
import { useBlocland } from '../../BloclandContext';
import { getBiome } from '../../biomes';
import { mesuresDemandees, meterShown } from '../../rendering';
import { SettingsButton } from '../../WorldShortcuts';
import { CLOSE_UP_INSETS, type GoPanel } from '../../world/continu/camera';
import { keepClear, missionOfPlace, nextMission, placeIsOpen, type MarkOnScreen, type ScreenRect } from '../../world/continu/mission';
import { placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { modeleDuMonde } from '../../world/model';
import { gameAsShown } from '../../world/stories';
import { missionScreenInteraction } from './missionScreen';
import { createOpenWorld, type OpenWorld } from './scene';
import './openWorld.css';

declare global {
  interface Window {
    /** Le monde ouvert, pour les captures et les mesures (en développement, ou avec `?mesures`). */
    __dysappsMondeOuvert?: Pick<OpenWorld, 'goTo' | 'skip' | 'info'>;
  }
}

/** Le titre d'une mission d'une île, pour la dire. */
const missionTitle = (island: string, mission: string) => getBiome(island)?.exercises.find((x) => x.id === mission)?.title ?? '';

/** Le temps où reste affichée la phrase d'un lieu fermé, en millisecondes : le temps de la lire (et de l'entendre). */
const STATUS_MS = 6000;

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
  // Le lieu fermé qu'on vient de toucher : sa phrase s'affiche, puis s'efface d'elle-même.
  const [closed, setClosed] = useState<{ place: PlaceId; seq: number } | null>(null);
  useEffect(() => {
    if (!closed) return;
    const timer = window.setTimeout(() => setClosed(null), STATUS_MS);
    return () => window.clearTimeout(timer);
  }, [closed]);

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
  }, [layout, next, walking, closed]);

  // Ce que les rappels de la scène lisent au moment où ils sont appelés (la scène n'est pas refaite pour eux).
  const interaction = useMemo(() => missionScreenInteraction(navigate), [navigate]);
  const latest = useRef({ next, bornes: modele.bornes, interaction, autoRead: settings.autoRead, speak });
  latest.current = { next, bornes: modele.bornes, interaction, autoRead: settings.autoRead, speak };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = createOpenWorld(el, {
      start,
      reduceMotion,
      meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() },
      onDepart: () => {
        setWalking(true);
        setClosed(null);
      },
      isOpen: (placeId) => placeIsOpen(placeById(placeId), latest.current.bornes),
      onClosed: (placeId) => {
        // Pas de trajet vers un lieu fermé : on le dit tout de suite (et à voix haute avec la lecture automatique).
        setClosed((c) => ({ place: placeId, seq: (c?.seq ?? 0) + 1 }));
        if (latest.current.autoRead) latest.current.speak(frenchTypography(closedSentence(placeId)));
      },
      onArrive: (placeId) => {
        setWalking(false);
        if (!placeId) return;
        const { next: n, bornes, interaction: open } = latest.current;
        const mission = n?.place.id === placeId ? n.mission : missionOfPlace(placeById(placeId), bornes);
        if (mission) open.open(placeId, mission);
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
        {next && (
          <button type="button" ref={markRef} className="open-world-mark" style={MARK_STYLE} aria-label={label} onClick={goNext}>
            <span ref={arrowRef} className="open-world-arrow" aria-hidden="true">
              <Icon name="nord" />
            </span>
            {/* Le nom du lieu seul : aucune icône de lieu n'existe encore (le sapin de l'île d'aujourd'hui ne dit pas le Phare). */}
            <span className="open-world-mark-word">{next.place.name}</span>
          </button>
        )}
        <SettingsButton />
        <p className={closed ? 'open-world-status' : 'visually-hidden'} role="status">
          {closed && (
            <>
              <Icon name="lock" /> {closedSentence(closed.place)}
            </>
          )}
        </p>
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
      </div>
    </div>
  );
}

/** La phrase d'un lieu fermé, avec son nom. */
const closedSentence = (placeId: PlaceId) => `${placeById(placeId).name} : ce lieu est fermé pour l’instant.`;

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
