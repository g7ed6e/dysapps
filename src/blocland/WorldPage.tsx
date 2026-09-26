import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { BIOMES, getBiome, type BiomeId } from './biomes';
import { levelFor } from './engine';
import { pickExercise, questProgress } from './exercises';
import type { QuestMark } from './three/WorldCanvas';
import { useBlocland } from './BloclandContext';
import { IslandSheet } from './IslandSheet';
import { WorldCanvas } from './three';
import { Tutorial, hasSeenTutorial } from './Tutorial';
import { useAmbience } from './useAmbience';
import { VoyagePanel } from './VoyagePanel';
import { daylight } from './world/daylight';
import { isPlanDone, plansFor } from './world/plans';
import {
  avatarHome,
  avatarRoute,
  bridgePath,
  creaturePlacements,
  guardianPlacements,
  islandAt,
  islandCenter,
  islandOrigin,
  questStations,
  worldCubes,
} from './world/terrain';
import {
  KIND_NAME,
  archipelagoOf,
  getArchipelago,
  getBridge,
  isArchipelagoReached,
  isBiomeUnlocked,
  islandsOf,
  remainingPath,
  type ArchipelagoId,
} from './world/archipelago';
import { stageTo } from './world/vehicle';
import { usePlanBuilder, type Burst } from './usePlanBuilder';
import { useVehicleBuilder } from './useVehicleBuilder';

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran, un archipel à la fois (celui où se tient le bonhomme).
 * On touche une île : la caméra y vole et son panneau glisse depuis le bas (créature, quêtes, plan, Gardien, et sur le
 * port le Bloc-Navire) sans quitter le monde. On peut replier le panneau pour regarder l'île, puis le rouvrir, sans la
 * quitter. L'URL /aventure/:ile ouvre le panneau, pour revenir au même endroit après un exercice. /aventure/carte est la
 * Carte : tout l'archipel vu du ciel, un fanion sur le bonhomme ; on touche une île pour y aller. Embarquer sur le
 * Bloc-Navire change d'archipel (et de scène).
 */
export function WorldPage() {
  const { biomeId } = useParams();
  const navigate = useNavigate();
  const { settings, speak } = useSettings();
  const { state, moveTo, launch } = useBlocland();
  const { launchVoyage } = useProgress();
  const mapOpen = biomeId === 'carte';
  const island = biomeId && !mapOpen ? getBiome(biomeId) : undefined;
  // Le bonhomme : où il se tient ; l'archipel affiché est le sien.
  const at = state.village.at ?? 'foret';
  const archipelago = archipelagoOf(at);
  const a: ArchipelagoId = archipelago.classe;
  const cubes = useMemo(() => worldCubes(a, state.progress, state.village, false), [a, state.progress, state.village]);
  const creatures = useMemo(
    () => [...creaturePlacements(a, state.village.bridges), ...guardianPlacements(a, state.progress, state.village.bridges)],
    [a, state.progress, state.village.bridges],
  );
  // Le panneau de l'île ouverte : replié, on reste sur l'île (la caméra aussi) ; il se rouvre à la demande.
  const [sheetOpen, setSheetOpen] = useState(true);
  // Aller sur une île (ou y revenir) : son panneau s'ouvre, même si c'est déjà l'île ouverte.
  const openIsland = (id: BiomeId) => {
    setSheetOpen(true);
    navigate(`/aventure/${id}`);
  };
  // Les bornes de quête des îles de l'archipel, avec leur état : à faire, étoiles gagnées, ou fermée.
  const quests = useMemo<QuestMark[]>(
    () =>
      islandsOf(a).flatMap((b) => {
        const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((x) => x.id === b.id));
        const open = isBiomeUnlocked(b.id, state.village.bridges);
        return questStations(b.id).map((st) => {
          const def = open ? pickExercise(b.id, st.typeId, levelFor(state, st.typeId), state.progress) : undefined;
          const progress = def ? questProgress(b.id, st.typeId, state.progress) : undefined;
          const s: QuestMark['state'] = !def ? 'locked' : progress ? progress.stars : 'new';
          return { id: `${b.id}:${st.typeId}`, biome: b.id, typeId: st.typeId, cell: { x: ox + st.x, y: oy + st.y, z: oz }, state: s };
        });
      }),
    [a, state],
  );
  // Une borne touchée : sa quête si elle est jouable, sinon le panneau de son île (qui explique pourquoi).
  const onPickQuest = (id: BiomeId, typeId: string) => {
    const q = quests.find((m) => m.biome === id && m.typeId === typeId);
    if (q && q.state !== 'locked') navigate(`/aventure/${id}/${typeId}`);
    else openIsland(id);
  };
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: island?.id ?? null, seq: 0 });
  // Tant que le tutoriel n'est pas vu, c'est le jour : une première minute lisible, même à 20 h.
  const [forceDay, setForceDay] = useState(() => !hasSeenTutorial('village-immersif'));
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
  // L'ouvrage touché dans le monde : on ouvre l'île ouverte qu'il touche, sa proposition mise en avant.
  const [highlight, setHighlight] = useState<string | null>(null);
  const onPickBridge = (id: string) => {
    const def = getBridge(id);
    if (!def) return;
    const from = isBiomeUnlocked(def.from, state.village.bridges) ? def.from : isBiomeUnlocked(def.to, state.village.bridges) ? def.to : def.from;
    setHighlight(id);
    openIsland(from);
  };
  // Sur la Carte, l'île fermée touchée : on montre le chemin d'ouvrages qui y mène (balises dans le monde, liste ici).
  const [mapTarget, setMapTarget] = useState<BiomeId | null>(null);
  const remaining = useMemo(() => (mapTarget ? remainingPath(mapTarget, state.village.bridges) : []), [mapTarget, state.village.bridges]);
  const trail = useMemo(() => (remaining.length ? remaining.flatMap((b) => bridgePath(b).map((c) => ({ x: c.x, y: c.y, z: c.z }))) : undefined), [remaining]);
  const [replay, setReplay] = useState(0);
  useAmbience(forceDay);
  // La construction guidée de l'île ouverte : bouton du panneau ou case bleue touchée dans le monde ; et le chantier du
  // Bloc-Navire sur le port.
  const builder = usePlanBuilder(island?.id ?? archipelago.port);
  const ship = useVehicleBuilder(island?.id ?? archipelago.port);
  // Les éclats : ceux du plan ou ceux du navire, le dernier qui a bougé.
  const seqs = useRef({ plan: builder.burst.seq, ship: ship.burst.seq, last: builder.burst as Burst });
  if (ship.burst.seq !== seqs.current.ship) seqs.current = { plan: builder.burst.seq, ship: ship.burst.seq, last: ship.burst };
  else if (builder.burst.seq !== seqs.current.plan) seqs.current = { plan: builder.burst.seq, ship: ship.burst.seq, last: builder.burst };
  const burst = useMemo(() => ({ ...seqs.current.last, seq: builder.burst.seq + ship.burst.seq }), [builder.burst, ship.burst]);

  // Le voyage en cours (le Bloc-Navire) : un écran HTML par-dessus le monde, puis le changement d'archipel.
  const [voyage, setVoyage] = useState<{ to: ArchipelagoId; back: boolean } | null>(null);
  const onBoard = (to: ArchipelagoId, back: boolean) => setVoyage({ to, back });
  const arrive = () => {
    if (!voyage) return;
    const port = getArchipelago(voyage.to).port;
    if (voyage.back) moveTo(port);
    else {
      const stage = stageTo(voyage.to);
      const r = stage ? launch(stage) : null;
      if (stage && r?.ok) launchVoyage(stage.reward.xp);
    }
    setVoyage(null);
    setWalk((w) => ({ route: [avatarHome(port)], seq: w.seq + 1 }));
    openIsland(port);
  };

  // Le bonhomme : où il se tient, et son itinéraire quand on ouvre une autre île ouverte (il y marche).
  const [walk, setWalk] = useState<{ route: { x: number; y: number; z: number }[]; seq: number }>(() => ({ route: [avatarHome(at)], seq: 0 }));
  const avatar = useMemo(() => ({ route: walk.route, seq: walk.seq }), [walk]);

  // L'île de l'URL est cadrée (vol) à chaque changement ; le bonhomme s'y rend si un chemin d'ouvrages y mène.
  // Une île ouverte d'un autre archipel (lien, retour d'exercice) : on y est directement, la scène change sans voyage.
  // Une île d'un archipel pas encore atteint : la scène reste, la caméra cadre le port (le chantier du navire).
  useEffect(() => {
    setSheetOpen(true);
    setSaid(null);
    if (!island) setHighlight(null);
    if (!mapOpen) setMapTarget(null);
    if (island && !isBiomeUnlocked(island.id, state.village.bridges) && archipelagoOf(island.id).classe !== a) {
      setFocus((f) => ({ island: archipelago.port, seq: f.seq + 1 }));
      return;
    }
    setFocus((f) => ({ island: island?.id ?? null, seq: f.seq + 1 }));
    if (island && island.id !== at && isBiomeUnlocked(island.id, state.village.bridges)) {
      const route = avatarRoute(at, island.id, state.village.bridges);
      if (route) setWalk((w) => ({ route, seq: w.seq + 1 }));
      else setWalk((w) => ({ route: [avatarHome(island.id)], seq: w.seq + 1 }));
      moveTo(island.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, mapOpen]);

  if (biomeId && !mapOpen && !island) return <NotFoundPage />;
  const night = !forceDay && daylight().light < 0.5;
  // La flèche « Commence ici » flotte sur la Forêt tant qu'aucune quête n'a été jouée.
  const marker = !island && a === '6e' && Object.keys(state.progress).length === 0 ? 'foret' : null;

  // Toucher une île : on y va (le bonhomme marche si un chemin y mène). Sur la Carte, une île fermée montre son chemin.
  const onIsland = (id: BiomeId) => {
    if (mapOpen && !isBiomeUnlocked(id, state.village.bridges)) return setMapTarget(id);
    openIsland(id);
  };
  const ouvrageLabel = (b: { kind: keyof typeof KIND_NAME; from: BiomeId; to: BiomeId; cost: number }) =>
    `${KIND_NAME[b.kind]} entre ${getBiome(b.from)?.name ?? b.from} et ${getBiome(b.to)?.name ?? b.to} (${b.cost} blocs)`;

  const onCreature = (id: BiomeId, kind: 'creature' | 'guardian') => {
    const biome = getBiome(id);
    if (!biome) return;
    if (kind === 'guardian') return navigate(`/aventure/${id}/gardien`);
    const first = plansFor(id)[0];
    const home = first && isPlanDone(first, state.village.plans);
    const lines = home && Math.random() < 0.5 ? [biome.creature.home] : biome.creature.lines;
    const text = lines[Math.floor(Math.random() * lines.length)];
    setSaid({ id, text });
    if (settings.autoRead) speak(frenchTypography(text));
  };
  const reachedNext = isArchipelagoReached('5e', state.village.bridges);

  return (
    <div className={`world-page${(island && sheetOpen) || voyage ? ' has-sheet' : ''}`}>
      <div className="world-stage">
        <Suspense fallback={<p className="loading world-loading">Chargement du village…</p>}>
          <WorldCanvas
            archipelago={a}
            cubes={cubes}
            creatures={creatures}
            focus={focus}
            reduceMotion={settings.reduceMotion}
            forceDay={forceDay}
            bridges={state.village.bridges}
            marker={marker}
            avatar={avatar}
            map={mapOpen}
            home={at}
            trail={trail}
            quests={quests}
            onPickQuest={onPickQuest}
            onPickIsland={onIsland}
            onPickBridge={onPickBridge}
            build={island ? { onPickFace: (cell) => builder.tryFill(cell) || ship.tryFill(cell) || openIsland(islandAt(a, cell.x, cell.y)) } : undefined}
            burst={burst}
            onPickCreature={onCreature}
            className="voxel-canvas-stage"
            label={`Blocland en 3D : les ${archipelago.name}, l’archipel de ${a}, ses îles reliées par des ouvrages à construire, et le Bloc-Navire au port`}
          />
        </Suspense>
        <div className="world-overlay-top">
          <Tutorial
            id="village-immersif"
            replay={replay}
            steps={[
              'Bienvenue à Blocland ! Le village est en ruine : c’est toi qui le reconstruis, île par île.',
              'Touche la Forêt des sons, sous la flèche jaune : ton bonhomme y va, la caméra le suit et le panneau de l’île s’ouvre. Pour aller ailleurs, touche une île, ou le bouton Carte pour voir tout l’archipel du ciel.',
              'Sur chaque île, les bornes à panneau sont les quêtes : touche une borne pour jouer. Un losange jaune flotte au-dessus d’une quête à faire, des cubes d’or comptent tes étoiles.',
              'Dans le panneau : les quêtes donnent des blocs, les blocs construisent le plan de l’île, et le Gardien t’attend quand tu as des étoiles partout.',
              'Les îles pâles sont fermées. Pour y aller, construis un ouvrage : un pont, un bac ou un sentier coûte des blocs ; un escalier demande un plan terminé, un col un Gardien vaincu. Choisis ta direction.',
              'Au port, sur la Plaine des nombres, le Bloc-Navire attend ses blocs. Quand il est prêt, embarque : l’archipel de 5e t’attend, et tu peux toujours revenir.',
            ]}
          />
          {mapOpen && (
            <div className="creature-line world-line world-map-line" role="status" aria-live="polite">
              {mapTarget && remaining.length ? (
                <>
                  <p>
                    <strong>Pour aller à {getBiome(mapTarget)?.name} :</strong> encore {remaining.length} ouvrage{remaining.length > 1 ? 's' : ''} à construire.
                  </p>
                  <ol className="world-map-path">
                    {remaining.map((b) => (
                      <li key={b.id}>{ouvrageLabel(b)}</li>
                    ))}
                  </ol>
                  <button type="button" className="button" onClick={() => onPickBridge(remaining[0].id)}>
                    <Icon name="hammer" /> Voir le premier ouvrage
                  </button>
                </>
              ) : (
                <p>
                  <strong>La Carte : les {archipelago.name}.</strong> Le fanion jaune, c’est toi. Touche une île pour y aller ; une île pâle est fermée :
                  touche-la pour voir le chemin.{reachedNext || a !== '6e' ? ' Pour changer d’archipel, va au port : le Bloc-Navire t’y attend.' : ''}
                </p>
              )}
            </div>
          )}
          {said && (
            <div className="creature-line world-line" role="status" aria-live="polite">
              <strong>{getBiome(said.id)?.creature.name} :</strong> <Syllabified text={said.text} />
              <SpeakButton text={said.text} compact />
            </div>
          )}
        </div>
        <nav className="world-bar" aria-label="Village">
          {island && !voyage && (
            <button
              type="button"
              className="button"
              aria-pressed={sheetOpen}
              aria-controls={sheetOpen ? `panneau-${island.id}` : undefined}
              onClick={() => setSheetOpen((o) => !o)}
              aria-label={sheetOpen ? `Replier le panneau de ${island.name}` : `Ouvrir le panneau de ${island.name}`}
            >
              <Icon name={island.icon} /> {island.name}
            </button>
          )}
          <button type="button" className="button" aria-pressed={mapOpen} onClick={() => navigate(mapOpen ? '/aventure' : '/aventure/carte')}>
            <Icon name="map" /> Carte
          </button>
          {night && (
            <button type="button" className="button" onClick={() => setForceDay(true)} aria-label="Forcer le jour">
              <Icon name="sun" />
            </button>
          )}
          {forceDay && (
            <button type="button" className="button" onClick={() => setForceDay(false)} aria-label="Revenir à l’heure réelle">
              <Icon name="moon" />
            </button>
          )}
          <button type="button" className="button" onClick={() => setReplay((n) => n + 1)} aria-label="Revoir l’aide">
            <Icon name="help" />
          </button>
        </nav>
      </div>
      {voyage ? (
        <div className="island-sheet voyage-sheet">
          <VoyagePanel to={voyage.to} back={voyage.back} onArrive={arrive} />
        </div>
      ) : (
        island &&
        sheetOpen && (
          <IslandSheet
            biome={island}
            builder={builder}
            ship={ship}
            onBoard={onBoard}
            in3d
            onClose={() => setSheetOpen(false)}
            highlight={highlight}
            onBuilt={(to) => {
              // La fête : des éclats d'or sur l'île qui s'ouvre, puis la caméra y vole et sa créature accueille.
              const c = islandCenter(to);
              builder.celebrate({ x: c.x, y: c.y, z: c.z + 2 }, '#f2c944');
              window.setTimeout(() => navigate(`/aventure/${to}`), 900);
            }}
          />
        )
      )}
    </div>
  );
}
