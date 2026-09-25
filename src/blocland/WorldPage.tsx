import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { Tutorial } from './Tutorial';
import { useAmbience } from './useAmbience';
import { daylight } from './world/daylight';
import { isPlanDone, plansFor } from './world/plans';
import { creaturePlacements, guardianPlacements, worldCubes } from './world/terrain';

/**
 * Blocland en immersion : le monde en 3D occupe tout l'écran. On touche une île : la caméra y vole et son panneau
 * glisse depuis le bas (créature, quêtes, plan, Gardien, chantier) sans quitter le monde. L'URL /aventure/:ile
 * garde le panneau ouvert, pour revenir au même endroit après un exercice.
 */
export function WorldPage() {
  const { biomeId } = useParams();
  const navigate = useNavigate();
  const { settings, speak } = useSettings();
  const { state } = useBlocland();
  const island = biomeId ? getBiome(biomeId) : undefined;
  const cubes = useMemo(() => worldCubes(state.progress, state.village, false), [state.progress, state.village]);
  const creatures = useMemo(
    () => [...creaturePlacements(state.village.bridges), ...guardianPlacements(state.progress, state.village.bridges)],
    [state.progress, state.village.bridges],
  );
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: island?.id ?? null, seq: 0 });
  const [forceDay, setForceDay] = useState(false);
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
  const [replay, setReplay] = useState(0);
  useAmbience(forceDay);

  // L'île de l'URL est cadrée (vol) à chaque changement.
  useEffect(() => {
    setFocus((f) => ({ island: island?.id ?? null, seq: f.seq + 1 }));
    setSaid(null);
  }, [island?.id]);

  if (biomeId && !island) return <NotFoundPage />;
  const night = !forceDay && daylight().light < 0.5;

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
            onPickIsland={(id) => navigate(`/aventure/${id}`)}
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
              'Bienvenue à Blocland ! Le village est en ruine : c’est toi qui le reconstruis. Tu es dans le monde en 3D.',
              'Un doigt pour tourner, deux doigts pour te déplacer et zoomer. Touche une île : la caméra y vole et son panneau s’ouvre en bas.',
              'Dans le panneau : les quêtes de l’île (elles donnent des blocs), le plan à construire et le Gardien. Le bouton Chantier, en bas, sert à poser les blocs des plans.',
              'Deux îles sont ouvertes : la Forêt des sons (français) et la Plaine des nombres (maths). Les îles grises sont fermées : les ponts transparents se construisent avec tes blocs, choisis ta direction.',
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
          <Link to="/aventure/chantier" className="button">
            <Icon name="hammer" /> Chantier
          </Link>
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
      {island && <IslandSheet biome={island} onClose={() => navigate('/aventure')} />}
    </div>
  );
}
