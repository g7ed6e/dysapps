// Les Gardiens de biome : de grandes créatures originales en cubes, qui réagissent pendant le défi.
import { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { VoxelCanvas, hasWebGL } from './three';
import { VoxelScene } from './Voxel';
import { GUARDIAN_CUBES } from './world/personnages/gardiens';

export type GuardianMood = 'idle' | 'hit' | 'miss' | 'beaten';

interface Props {
  biome: BiomeId;
  label: string;
  mood?: GuardianMood;
  /** Change à chaque réaction, pour rejouer l'animation. */
  seq?: number;
}

/** Le Gardien en 3D (respiration), en SVG sans WebGL ; l'humeur anime le cadre (s'incline, gronde, s'écroule). */
export function Guardian3D({ biome, label, mood = 'idle', seq = 0 }: Props) {
  const { settings } = useSettings();
  const cubes = GUARDIAN_CUBES[biome];
  const svg = <VoxelScene cubes={cubes} s={12} pad={6} className="creature guardian-svg" label={label} />;
  return (
    <div key={`${mood}-${seq}`} className={`guardian guardian-${mood}`} aria-live="off">
      {settings.worldView !== '3d' || !hasWebGL() ? (
        svg
      ) : (
        <ErrorBoundary fallback={svg}>
          <Suspense fallback={svg}>
            <VoxelCanvas
              cubes={cubes}
              breathe
              interactive={false}
              reduceMotion={settings.reduceMotion}
              cameraDirection={[0.55, -0.85]}
              elevation={0.35}
              fit={1.5}
              className="creature-3d guardian-3d"
              label={label}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
