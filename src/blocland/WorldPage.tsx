import { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
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
import { KIND_NAME, getBridge, isBiomeUnlocked, remainingPath } from './world/archipelago';
import { usePlanBuilder } from './usePlanBuilder';

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran. On touche une île : la caméra y vole et son panneau
 * glisse depuis le bas (créature, quêtes, plan, Gardien) sans quitter le monde. L'URL /aventure/:ile
 * garde le panneau ouvert, pour revenir au même endroit après un exercice. /aventure/carte est la Carte :
 * tout le continent vu du ciel, un fanion sur le bonhomme ; on touche une île pour y aller.
 */
export function WorldPage() {
  const { biomeId } = useParams();
  const navigate = useNavigate();
  const { settings, speak } = useSettings();
  const { state, moveTo } = useBlocland();
  const mapOpen = biomeId === 'carte';
  const island = biomeId && !mapOpen ? getBiome(biomeId) : undefined;
  const cubes = useMemo(() => worldCubes(state.progress, state.village, false), [state.progress, state.village]);
  const creatures = useMemo(
    () => [...creaturePlacements(state.village.bridges), ...guardianPlacements(state.progress, state.village.bridges)],
    [state.progress, state.village.bridges],
  );
  // Les bornes de quête de toutes les îles, avec leur état : à faire, étoiles gagnées, ou fermée.
  const quests = useMemo<QuestMark[]>(
    () =>
      BIOMES.flatMap((b, index) => {
        const { ox, oy, oz } = islandOrigin(index);
        const open = isBiomeUnlocked(b.id, state.village.bridges);
        return questStations(b.id).map((st) => {
          const def = open ? pickExercise(b.id, st.typeId, levelFor(state, st.typeId), state.progress) : undefined;
          const progress = def ? questProgress(b.id, st.typeId, state.progress) : undefined;
          const s: QuestMark['state'] = !def ? 'locked' : progress ? progress.stars : 'new';
          return { id: `${b.id}:${st.typeId}`, biome: b.id, typeId: st.typeId, cell: { x: ox + st.x, y: oy + st.y, z: oz }, state: s };
        });
      }),
    [state],
  );
  // Une borne touchée : sa quête si elle est jouable, sinon le panneau de son île (qui explique pourquoi).
  const onPickQuest = (id: BiomeId, typeId: string) => {
    const q = quests.find((m) => m.biome === id && m.typeId === typeId);
    if (q && q.state !== 'locked') navigate(`/aventure/${id}/${typeId}`);
    else navigate(`/aventure/${id}`);
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
    navigate(`/aventure/${from}`);
  };
  // Sur la Carte, l'île fermée touchée : on montre le chemin d'ouvrages qui y mène (balises dans le monde, liste ici).
  const [mapTarget, setMapTarget] = useState<BiomeId | null>(null);
  const remaining = useMemo(() => (mapTarget ? remainingPath(mapTarget, state.village.bridges) : []), [mapTarget, state.village.bridges]);
  const trail = useMemo(() => (remaining.length ? remaining.flatMap((b) => bridgePath(b).map((c) => ({ x: c.x, y: c.y, z: c.z }))) : undefined), [remaining]);
  const [replay, setReplay] = useState(0);
  useAmbience(forceDay);
  // La construction guidée de l'île ouverte : bouton du panneau ou case bleue touchée dans le monde.
  const builder = usePlanBuilder(island?.id ?? 'foret');

  // Le bonhomme : où il se tient, et son itinéraire quand on ouvre une autre île ouverte (il y marche).
  const at = state.village.at ?? 'foret';
  const [walk, setWalk] = useState<{ route: { x: number; y: number; z: number }[]; seq: number }>(() => ({ route: [avatarHome(at)], seq: 0 }));
  const avatar = useMemo(() => ({ route: walk.route, seq: walk.seq }), [walk]);

  // L'île de l'URL est cadrée (vol) à chaque changement ; le bonhomme s'y rend si un chemin d'ouvrages y mène.
  useEffect(() => {
    setFocus((f) => ({ island: island?.id ?? null, seq: f.seq + 1 }));
    setSaid(null);
    if (!island) setHighlight(null);
    if (!mapOpen) setMapTarget(null);
    if (island && island.id !== at && isBiomeUnlocked(island.id, state.village.bridges)) {
      const route = avatarRoute(at, island.id, state.village.bridges);
      if (route) {
        setWalk((w) => ({ route, seq: w.seq + 1 }));
        moveTo(island.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id, mapOpen]);

  if (biomeId && !mapOpen && !island) return <NotFoundPage />;
  const night = !forceDay && daylight().light < 0.5;
  // La flèche « Commence ici » flotte sur la Forêt tant qu'aucune quête n'a été jouée.
  const marker = !island && Object.keys(state.progress).length === 0 ? 'foret' : null;

  // Toucher une île : on y va (le bonhomme marche si un chemin y mène). Sur la Carte, une île fermée montre son chemin.
  const onIsland = (id: BiomeId) => {
    if (mapOpen && !isBiomeUnlocked(id, state.village.bridges)) return setMapTarget(id);
    navigate(`/aventure/${id}`);
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

  return (
    <div className={`world-page${island ? ' has-sheet' : ''}`}>
      <div className="world-stage">
        <Suspense fallback={<p className="loading world-loading">Chargement du village…</p>}>
          <WorldCanvas
            cubes={cubes}
            creatures={creatures}
            focus={focus}
            reduceMotion={settings.reduceMotion}
            forceDay={forceDay}
            bridges={state.village.bridges}
            marker={marker}
            avatar={avatar}
            map={mapOpen}
            trail={trail}
            quests={quests}
            onPickQuest={onPickQuest}
            onPickIsland={onIsland}
            onPickBridge={onPickBridge}
            build={island ? { onPickFace: (cell) => builder.tryFill(cell) || navigate(`/aventure/${islandAt(cell.x, cell.y)}`) } : undefined}
            burst={builder.burst}
            onPickCreature={onCreature}
            className="voxel-canvas-stage"
            label="Le village de Blocland en 3D : un archipel d’îles, la Forêt au centre, reliées par des ponts à construire"
          />
        </Suspense>
        <div className="world-overlay-top">
          <Tutorial
            id="village-immersif"
            replay={replay}
            steps={[
              'Bienvenue à Blocland ! Le village est en ruine : c’est toi qui le reconstruis, île par île.',
              'Touche la Forêt des sons, sous la flèche jaune : ton bonhomme y va, la caméra le suit et le panneau de l’île s’ouvre. Pour aller ailleurs, touche une île, ou le bouton Carte pour voir tout le continent du ciel.',
              'Sur chaque île, les bornes à panneau sont les quêtes : touche une borne pour jouer. Un losange jaune flotte au-dessus d’une quête à faire, des cubes d’or comptent tes étoiles.',
              'Dans le panneau : les quêtes donnent des blocs, les blocs construisent le plan de l’île, et le Gardien t’attend quand tu as des étoiles partout.',
              'Les îles pâles sont fermées. Pour y aller, construis un ouvrage : un pont ou un bac coûte des blocs, un escalier demande un plan terminé, un tunnel un Gardien vaincu. Choisis ta direction.',
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
                  <strong>La Carte.</strong> Le fanion jaune, c’est toi. Touche une île pour y aller ; une île pâle est fermée : touche-la pour voir le chemin.
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
      {island && (
        <IslandSheet
          biome={island}
          builder={builder}
          in3d
          onClose={() => navigate('/aventure')}
          highlight={highlight}
          onBuilt={(to) => {
            // La fête : des éclats d'or sur l'île qui s'ouvre, puis la caméra y vole et sa créature accueille.
            const c = islandCenter(to);
            builder.celebrate({ x: c.x, y: c.y, z: c.z + 2 }, '#f2c944');
            window.setTimeout(() => navigate(`/aventure/${to}`), 900);
          }}
        />
      )}
    </div>
  );
}
