import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../core/SettingsContext';
import { useMoinsDAnimations } from '../core/motion';
import type { BiomeId } from './biomes';
import { CreatureCubes } from './Creatures';
import { habillageDuMonde } from './skin';
import { CREATURE_CUBES } from './world/characters/creatures';
import { PersonnageCanvas, VoxelCanvas, hasWebGL } from './three';

/** La créature d'Archipéo en SVG (lot R6, avec l'habillage d'Archipéo, voir skin.ts), chargée à la demande. */
const CharacterSvg = lazy(() => import('./CharacterSvg'));

interface Props {
  biome: BiomeId;
  label: string;
  className?: string;
}

/** Créature en 3D (respiration, rotation lente) ; en SVG hors du monde en 3D, ou si la 3D est indisponible. */
export function Creature3D({ biome, label, className }: Props) {
  const { settings } = useSettings();
  const reduceMotion = useMoinsDAnimations();
  // Les figures de l'habillage (skin.ts) : la créature en facettes, ou en cubes, inchangée.
  const [modeles] = useState(() => habillageDuMonde().figures === 'modeles');
  const cubes = <CreatureCubes biome={biome} label={label} className={className} />;
  // Le temps que la créature en facettes arrive : sa place, vide, à sa taille (pas la créature en cubes, qui sauterait).
  const place = <span className={`creature ${className ?? ''}`.trim()} role="img" aria-label={label} />;
  const flat = modeles ? (
    <Suspense fallback={place}>
      <CharacterSvg kind="creature" id={biome} label={label} className={className} />
    </Suspense>
  ) : (
    cubes
  );
  if (settings.worldView !== '3d' || !hasWebGL()) return flat;
  // La 3D pas encore chargée, ou impossible à charger : la créature en SVG.
  return (
    <ErrorBoundary fallback={flat}>
      <Suspense fallback={flat}>
        {modeles ? (
          <PersonnageCanvas kind="creature" id={biome} autoRotate reduceMotion={reduceMotion} className={`creature-3d ${className ?? ''}`.trim()} label={label} />
        ) : (
          <VoxelCanvas
            cubes={CREATURE_CUBES[biome]}
            breathe
            autoRotate
            interactive={false}
            reduceMotion={reduceMotion}
            className={`creature-3d ${className ?? ''}`.trim()}
            label={label}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
