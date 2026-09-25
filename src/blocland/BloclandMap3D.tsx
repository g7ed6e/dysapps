import { Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../core/SettingsContext';
import { useBlocland } from './BloclandContext';
import { mapCubes } from './mapScene';
import { VoxelCanvas, hasWebGL } from './three';

/** La carte des biomes en 3D : on tourne autour du monde et on touche une île pour y entrer. La liste en dessous reste la version accessible. */
export function BloclandMap3D() {
  const { settings } = useSettings();
  const { state } = useBlocland();
  const navigate = useNavigate();
  const cubes = useMemo(() => mapCubes(state.progress), [state.progress]);
  if (!settings.view3d || !hasWebGL()) return null;
  return (
    <section className="map3d" aria-label="Carte en 3D">
      <Suspense fallback={<p className="loading">Chargement de la carte…</p>}>
        <VoxelCanvas
          cubes={cubes}
          reduceMotion={settings.reduceMotion}
          sky
          onPickTag={(tag) => navigate(`/aventure/${tag}`)}
          cameraDirection={[0.3, -0.95]}
          elevation={0.5}
          fit={0.85}
          className="voxel-canvas-map"
          label="Carte de Blocland en 3D : cinq îles reliées par des ponts"
        />
      </Suspense>
      <p className="view-note">Glisse pour tourner, pince pour zoomer, touche une île pour y aller.</p>
    </section>
  );
}
