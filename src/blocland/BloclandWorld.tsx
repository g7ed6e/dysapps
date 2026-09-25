import { Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, isBiomeUnlocked, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { WorldCanvas, hasWebGL } from './three';
import { worldCubes } from './world/terrain';

/**
 * Le village en 3D : les cinq îles dans une seule scène. On tourne, on se déplace, on zoome,
 * on vole vers une île avec les boutons, et on touche une île pour y entrer.
 * La liste des biomes en dessous reste la version accessible.
 */
export function BloclandWorld() {
  const { settings } = useSettings();
  const { state } = useBlocland();
  const navigate = useNavigate();
  const cubes = useMemo(() => worldCubes(state.progress), [state.progress]);
  const [focus, setFocus] = useState<{ island: BiomeId | null; seq: number }>({
    island: null,
    seq: 0,
  });
  if (!settings.view3d || !hasWebGL()) return null;
  const goTo = (island: BiomeId | null) => setFocus((f) => ({ island, seq: f.seq + 1 }));
  return (
    <section className="world" aria-label="Le village en 3D">
      <Suspense fallback={<p className="loading">Chargement du village…</p>}>
        <WorldCanvas
          cubes={cubes}
          focus={focus}
          reduceMotion={settings.reduceMotion}
          onPickIsland={(id) => navigate(`/aventure/${id}`)}
          className="voxel-canvas-world"
          label="Le village de Blocland en 3D : cinq îles reliées par des ponts"
        />
      </Suspense>
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
      </div>
      <p className="view-note">Un doigt pour tourner, deux doigts pour te déplacer et zoomer. Touche une île pour y entrer.</p>
    </section>
  );
}
