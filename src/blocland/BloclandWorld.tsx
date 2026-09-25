import { Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, getBiome, isBiomeUnlocked, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { WorldCanvas, hasWebGL } from './three';
import { Tutorial } from './Tutorial';
import { useAmbience } from './useAmbience';
import { daylight } from './world/daylight';
import { isPlanDone, plansFor } from './world/plans';
import { creaturePlacements, worldCubes } from './world/terrain';

/**
 * Le village en 3D : les cinq îles dans une seule scène. On tourne, on se déplace, on zoome,
 * on vole vers une île avec les boutons, on touche une île pour y entrer, une créature pour l'écouter.
 * La liste des biomes en dessous reste la version accessible.
 */
export function BloclandWorld() {
  const { settings, speak } = useSettings();
  const { state } = useBlocland();
  const navigate = useNavigate();
  const cubes = useMemo(() => worldCubes(state.progress, state.village, false), [state.progress, state.village]);
  const creatures = useMemo(() => creaturePlacements(state.progress), [state.progress]);
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({ island: null, seq: 0 });
  const [forceDay, setForceDay] = useState(false);
  const [said, setSaid] = useState<{ id: BiomeId; text: string } | null>(null);
  const [replay, setReplay] = useState(0);
  useAmbience(forceDay);
  if (!settings.view3d || !hasWebGL()) return null;
  const goTo = (island: BiomeId | null) => setFocus((f) => ({ island, seq: f.seq + 1 }));
  const night = !forceDay && daylight().light < 0.5;
  const onCreature = (id: BiomeId) => {
    const biome = getBiome(id);
    if (!biome) return;
    // Une fois sa maison (premier plan) terminée, la créature en parle une fois sur deux.
    const first = plansFor(id)[0];
    const home = first && isPlanDone(first, state.village.plans);
    const lines = home && Math.random() < 0.5 ? [biome.creature.home] : biome.creature.lines;
    const text = lines[Math.floor(Math.random() * lines.length)];
    setSaid({ id, text });
    if (settings.autoRead) speak(frenchTypography(text));
  };
  return (
    <section className="world" aria-label="Le village en 3D">
      <Tutorial
        id="village"
        replay={replay}
        steps={[
          'Voici le village de Blocland : cinq îles reliées par des ponts. Il est en ruine, et c’est toi qui le reconstruis.',
          'Avec un doigt, tu tournes autour. Avec deux doigts, tu te déplaces et tu zoomes. Les boutons t’emmènent d’une île à l’autre.',
          'Touche une île pour y faire des quêtes et gagner des blocs. Touche une créature pour l’écouter.',
        ]}
      />
      <Suspense fallback={<p className="loading">Chargement du village…</p>}>
        <WorldCanvas
          cubes={cubes}
          creatures={creatures}
          focus={focus}
          reduceMotion={settings.reduceMotion}
          cameraSpeed={settings.cameraSpeed}
          forceDay={forceDay}
          onPickIsland={(id) => navigate(`/aventure/${id}`)}
          onPickCreature={onCreature}
          className="voxel-canvas-world"
          label="Le village de Blocland en 3D : cinq îles reliées par des ponts"
        />
      </Suspense>
      {said && (
        <div className="creature-line" role="status" aria-live="polite">
          <strong>{getBiome(said.id)?.creature.name} :</strong> <Syllabified text={said.text} />
          <SpeakButton text={said.text} />
        </div>
      )}
      <div className="world-nav" role="group" aria-label="Aller à">
        <button type="button" className={`button${focus.island === null ? ' primary' : ''}`} aria-pressed={focus.island === null} onClick={() => goTo(null)}>
          <Icon name="map" /> Vue d’ensemble
        </button>
        {BIOMES.map((b) => {
          const unlocked = isBiomeUnlocked(b.id, state.progress);
          return (
            <button
              key={b.id}
              type="button"
              className={`button${focus.island === b.id ? ' primary' : ''}`}
              aria-pressed={focus.island === b.id}
              onClick={() => goTo(b.id)}
            >
              {!unlocked && <Icon name="lock" />} {b.name}
            </button>
          );
        })}
        {night && (
          <button type="button" className="button" onClick={() => setForceDay(true)}>
            <Icon name="sun" /> Forcer le jour
          </button>
        )}
        {forceDay && (
          <button type="button" className="button" onClick={() => setForceDay(false)}>
            <Icon name="moon" /> Revenir à l’heure réelle
          </button>
        )}
        <button type="button" className="button" onClick={() => setReplay((n) => n + 1)}>
          <Icon name="help" /> Revoir l’aide
        </button>
      </div>
      <p className="view-note">Un doigt pour tourner, deux doigts pour te déplacer et zoomer. Touche une île pour y entrer, une créature pour l’écouter.</p>
    </section>
  );
}
