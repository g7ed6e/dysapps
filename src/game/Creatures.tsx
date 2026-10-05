// Créatures originales de Blocland, dessinées en cubes (modèles : world/characters/creatures.ts).
import type { BiomeId } from './biomes';
import { VoxelScene } from './Voxel';
import { CREATURE_CUBES } from './world/characters/creatures';

interface Props {
  biome: BiomeId;
  /** Nom lisible par les lecteurs d'écran (sinon décoratif). */
  label?: string;
  className?: string;
}

export function Creature({ biome, label, className }: Props) {
  return <VoxelScene cubes={CREATURE_CUBES[biome]} s={14} pad={6} className={`creature ${className ?? ''}`.trim()} label={label} />;
}
