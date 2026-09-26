import { Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { IslandSheet } from './IslandSheet';
import { WorldCanvas } from './three';
import { Tutorial, hasSeenTutorial } from './Tutorial';
import { useAmbience } from './useAmbience';
import { daylight } from './world/daylight';
import { isPlanDone, plansFor } from './world/plans';
import { avatarHome, avatarRoute, creaturePlacements, guardianPlacements, islandAt, islandCenter, worldCubes } from './world/terrain';
import { isBiomeUnlocked } from './world/archipelago';
import { usePlanBuilder } from './usePlanBuilder';

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran. On touche une île : la caméra y vole et son panneau
 * glisse depuis le bas (créature, quêtes, plan, Gardien) sans quitter le monde. L'URL /aventure/:ile
 * garde le panneau ouvert, pour revenir au même endroit après un exercice.
 */
export function WorldPage() {
  const { biomeId } = useParams();
  const navigate = useNavigate();
  const { settings, speak } = useSettings();
  const { state, moveTo } = useBlocland();
  const island = biomeId ? getBiome(biomeId) : undefined;
  const cubes = useMemo(() => worldCubes(state.progress, state.village, false), [state.progress, state.village]);
  const creatures = useMemo(
    () => [...creaturePlacements(state.village.bridges), ...guardianPlacements(state.progress, state.village.bridges)],
    [state.progress, state.village.bridges],
  );
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: island?.id ?? null, seq: 0 });
  // Tant que le tutoriel n'est pas vu, c'est le jour : une première minute lisible, même à 20 h.
  const [forceDay, setForceDay] = useState(() => !hasSeenTutorial('village-immersif'));
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
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
    if (island && island.id !== at && isBiomeUnlocked(island.id, state.village.bridges)) {
      const route = avatarRoute(at, island.id, state.village.bridges);
      if (route) {
        setWalk((w) => ({ route, seq: w.seq + 1 }));
        moveTo(island.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [island?.id]);

  if (biomeId && !island) return <NotFoundPage />;
  const night = !forceDay && daylight().light < 0.5;
  // La flèche « Commence ici » flotte sur la Forêt tant qu'aucune quête n'a été jouée.
  const marker = !island && Object.keys(state.progress).length === 0 ? 'foret' : null;

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
            cameraSpeed={settings.cameraSpeed}
            forceDay={forceDay}
            bridges={state.village.bridges}
            marker={marker}
            avatar={avatar}
            onPickIsland={(id) => navigate(`/aventure/${id}`)}
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
              'Touche la Forêt des sons, sous la flèche jaune : la caméra y vole et son panneau s’ouvre. Un doigt pour tourner, deux doigts pour te déplacer et zoomer.',
              'Dans le panneau : les quêtes donnent des blocs, les blocs construisent le plan de l’île, et le Gardien t’attend quand tu as des étoiles partout.',
              'Les îles pâles sont fermées. Pour y aller, construis un ouvrage : un pont ou un bac coûte des blocs, un escalier demande un plan terminé, un tunnel un Gardien vaincu. Choisis ta direction.',
            ]}
          />
          {said && (
            <div className="creature-line world-line" role="status" aria-live="polite">
              <strong>{getBiome(said.id)?.creature.name} :</strong> <Syllabified text={said.text} />
              <SpeakButton text={said.text} compact />
            </div>
          )}
        </div>
        <nav className="world-bar" aria-label="Village">
          <button type="button" className="button" aria-pressed={focus.island === null} onClick={() => navigate('/aventure')}>
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
