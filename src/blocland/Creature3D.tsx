import { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { Creature } from './Creatures';
import { CREATURE_CUBES } from './world/personnages/creatures';
import { VoxelCanvas, hasWebGL } from './three';

interface Props {
  biome: BiomeId;
  label: string;
  className?: string;
}

/** Créature en 3D (respiration, rotation lente) ; en SVG hors du monde en 3D, ou si la 3D est indisponible. */
export function Creature3D({ biome, label, className }: Props) {
  const { settings } = useSettings();
  const flat = <Creature biome={biome} label={label} className={className} />;
  if (settings.worldView !== '3d' || !hasWebGL()) return flat;
  // La 3D pas encore chargée, ou impossible à charger : la créature en SVG.
  return (
    <ErrorBoundary fallback={flat}>
      <Suspense fallback={flat}>
        <VoxelCanvas
          cubes={CREATURE_CUBES[biome]}
          breathe
          autoRotate
          interactive={false}
          reduceMotion={settings.reduceMotion}
          className={`creature-3d ${className ?? ''}`.trim()}
          label={label}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
