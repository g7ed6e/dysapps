import { Suspense } from 'react';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { CREATURE_CUBES, Creature } from './Creatures';
import { VoxelCanvas, hasWebGL } from './three';

interface Props {
  biome: BiomeId;
  label: string;
  className?: string;
}

/** Créature en 3D (respiration, rotation lente) ; en SVG si la 3D est désactivée ou indisponible. */
export function Creature3D({ biome, label, className }: Props) {
  const { settings } = useSettings();
  if (!settings.view3d || !hasWebGL()) return <Creature biome={biome} label={label} className={className} />;
  return (
    <Suspense fallback={<Creature biome={biome} label={label} className={className} />}>
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
  );
}
