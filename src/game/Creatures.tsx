// La créature d'un lieu en petit (commandes, fiche d'île, quêtes…), dans l'habillage de l'univers choisi (skin.ts) :
// en cubes dans Blocland (modèles : world/characters/creatures.ts), en facettes dans Archipéo (CharacterSvg).
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { BiomeId } from './biomes';
import { habillageDuMonde } from './skin';
import { VoxelScene } from './Voxel';
import { CREATURE_CUBES } from './world/characters/creatures';

/** La créature d'Archipéo en SVG, chargée à la demande : les modèles ne pèsent pas sur le monde en blocs. */
const CharacterSvg = lazy(() => import('./CharacterSvg'));

interface Props {
  biome: BiomeId;
  /** Nom lisible par les lecteurs d'écran (sinon décoratif). */
  label?: string;
  className?: string;
}

/** La créature de Blocland, en cubes. */
export function CreatureCubes({ biome, label, className }: Props) {
  return <VoxelScene cubes={CREATURE_CUBES[biome]} s={14} pad={6} className={`creature ${className ?? ''}`.trim()} label={label} />;
}

/** La créature du lieu, dans l'univers choisi. */
export function Creature({ biome, label, className }: Props) {
  if (habillageDuMonde().figures === 'cubes') return <CreatureCubes biome={biome} label={label} className={className} />;
  // Le temps que la créature en facettes arrive, ou si elle ne peut pas : sa place, vide, à sa taille (jamais celle de Blocland).
  const place = <span className={`creature ${className ?? ''}`.trim()} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
  return (
    <ErrorBoundary fallback={place}>
      <Suspense fallback={place}>
        <CharacterSvg kind="creature" id={biome} label={label} className={className} />
      </Suspense>
    </ErrorBoundary>
  );
}
