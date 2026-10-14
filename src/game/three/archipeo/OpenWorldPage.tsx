// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). On touche
// n'importe où, Kéo rejoint le chemin le plus proche et y va ; une seule marque montre la prochaine mission (son icône et
// le nom du lieu), une flèche au bord de l'écran quand elle est hors champ ; « Y aller », toujours à la même place, y
// mène (le trajet se passe). À l'arrivée, la mission s'ouvre (`MissionInteraction`, l'écran de mission actuel pour
// l'instant). Rien de neuf dans la sauvegarde : la progression des missions reste commune. Chargé à la demande.
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { missionOfPlace, nextMission, type MarkOnScreen } from '../../world/continu/mission';
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

export default function OpenWorldPage() {
  const { biomeId } = useParams();
  const navigate = useNavigate();
  const { state } = useBlocland();
  const textes = useTextes();
  const { settings, speak } = useSettings();
  const reduceMotion = useMoinsDAnimations();

  // Les missions des quatre lieux et leur état : le modèle du monde, commun aux deux univers.
  const vu = useMemo(() => gameAsShown(state, textes), [state, textes]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modele = useMemo(() => modeleDuMonde(vu, '6e', textes.archipels, textes.libelles), [vu, textes, settings.lv2]);
  const next = useMemo(() => nextMission(modele.bornes, modele.destination), [modele]);
  const nextPlace = next?.place ?? null;
  const nextIcon = nextPlace ? (getBiome(nextPlace.island)?.icon ?? 'flag') : 'flag';

  // Kéo part devant le lieu de l'adresse (le retour d'une mission), sinon celui de la partie, sinon le Phare.
  const [start] = useState<PlaceId>(() => placeOfIsland(biomeId ?? '')?.id ?? placeOfIsland(state.world.place ?? '')?.id ?? 'phare');

  const host = useRef<HTMLDivElement>(null);
  const world = useRef<OpenWorld | null>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [walking, setWalking] = useState(false);
  const [status, setStatus] = useState('');

  // Ce que les rappels de la scène lisent au moment où ils sont appelés (la scène n'est pas refaite pour eux).
  const interaction = useMemo(() => missionScreenInteraction(navigate), [navigate]);
  const latest = useRef({ next, bornes: modele.bornes, interaction, autoRead: settings.autoRead, speak });
  latest.current = { next, bornes: modele.bornes, interaction, autoRead: settings.autoRead, speak };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const say = (text: string) => {
      setStatus(text);
      if (latest.current.autoRead) latest.current.speak(frenchTypography(text));
    };
    const w = createOpenWorld(el, {
      start,
      reduceMotion,
      meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() },
      onDepart: () => {
        setWalking(true);
        setStatus('');
      },
      onArrive: (placeId) => {
        setWalking(false);
        if (!placeId) return;
        const { next: n, bornes, interaction: open } = latest.current;
        const place = placeById(placeId);
        const mission = n?.place.id === placeId ? n.mission : missionOfPlace(place, bornes);
        if (mission) open.open(placeId, mission);
        else say(`${place.name} : ce lieu ouvrira plus tard.`);
      },
      onMark: (m) => placeMark(markRef.current, arrowRef.current, m),
    });
    world.current = w;
    setReady(true);
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsMondeOuvert = { goTo: w.goTo, skip: w.skip, info: w.info };
    return () => {
      w.dispose();
      world.current = null;
      if (window.__dysappsMondeOuvert?.info === w.info) delete window.__dysappsMondeOuvert;
    };
    // La scène est faite une fois (et refaite si l'appareil change « Réduire les animations ») ; `start` ne change pas.
  }, [start, reduceMotion]);

  useEffect(() => {
    world.current?.setMark(nextPlace?.id ?? null);
  }, [nextPlace, ready]);

  const goNext = () => {
    if (!next) return;
    const title = missionTitle(next.place.island, next.mission);
    if (settings.autoRead) speak(frenchTypography(`${next.place.name}. ${title}`));
    world.current?.goTo(next.place.id);
  };
  const label = next ? `Prochaine mission : ${missionTitle(next.place.island, next.mission)}, ${next.place.at}` : '';

  return (
    <div className="world-page open-world">
      <p className={status ? 'open-world-status' : 'visually-hidden'} role="status">
        {status}
      </p>
      <div className="world-stage" data-scene>
        <div ref={host} className="open-world-canvas" />
        {!ready && <Loading className="world-loading" text="Chargement du monde…" />}
        {next && (
          <button type="button" ref={markRef} className="open-world-mark" aria-label={`${label}. Y aller`} onClick={goNext}>
            <span ref={arrowRef} className="open-world-arrow" aria-hidden="true">
              <Icon name="nord" />
            </span>
            <Icon name={nextIcon} />
            <span className="open-world-mark-word">{next.place.name}</span>
          </button>
        )}
        <SettingsButton />
        <div className="open-world-go">
          {walking ? (
            <button type="button" className="button" onClick={() => world.current?.skip()}>
              <Icon name="play" /> Passer le trajet
            </button>
          ) : (
            <button type="button" className="button primary" disabled={!next} aria-label={next ? `Y aller : ${label}` : 'Y aller : aucune mission à faire ici'} onClick={goNext}>
              <Icon name="footprints" /> Y aller
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** L'écart minimal entre la marque et le bord de l'écran, en pixels. */
const MARK_EDGE = 8;

/**
 * Pose la marque à l'écran, image par image, sans passer par React : sur son lieu, ou au bord, sa flèche tournée vers
 * lui ; le panneau reste toujours entier à l'écran.
 */
function placeMark(mark: HTMLElement | null, arrow: HTMLElement | null, m: MarkOnScreen | null): void {
  if (!mark) return;
  mark.hidden = !m;
  const parent = mark.parentElement;
  if (!m || !parent) return;
  mark.classList.toggle('hors-champ', !m.inside);
  const hw = mark.offsetWidth / 2 + MARK_EDGE;
  const hh = mark.offsetHeight / 2 + MARK_EDGE;
  const x = Math.min(Math.max(m.x, hw), parent.clientWidth - hw);
  // Sur son lieu, la marque se pose au-dessus du point, comme une étiquette ; au bord, elle s'y centre.
  const y = Math.min(Math.max(m.inside ? m.y - mark.offsetHeight / 2 : m.y, hh), parent.clientHeight - hh);
  mark.style.transform = `translate(${Math.round(x - hw + MARK_EDGE)}px, ${Math.round(y - hh + MARK_EDGE)}px)`;
  if (arrow) arrow.style.transform = m.inside ? '' : `rotate(${m.angle}rad)`;
}
