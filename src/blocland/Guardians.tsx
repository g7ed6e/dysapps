// Les Gardiens de biome : de grandes créatures originales en cubes, qui réagissent pendant le défi.
import { lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { renduDuMonde } from './rendu';
import { PersonnageCanvas, VoxelCanvas, hasWebGL } from './three';
import { VoxelScene } from './Voxel';
import { GUARDIAN_CUBES } from './world/personnages/gardiens';

/** Le Gardien d'Archipéo en SVG (lot R6, derrière `?rendu=archipeo`), chargé à la demande. */
const PersonnageSvg = lazy(() => import('./PersonnageSvg'));

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
  // Le rendu d'Archipéo (drapeau `?rendu=archipeo`) : le Gardien en sentinelle de pierre, éteinte, rallumée (1) une
  // fois vaincu, d'un coup, sans fondu ; sans le drapeau, en cubes, inchangé.
  const [archipeo] = useState(() => renduDuMonde() === 'archipeo');
  const allumage = mood === 'beaten' ? 1 : 0;
  const enCubes = <VoxelScene cubes={cubes} s={12} pad={6} className="creature guardian-svg" label={label} />;
  // Le temps que la sentinelle arrive : sa place, vide, à sa taille (pas le Gardien en cubes, qui sauterait).
  const place = <span className="creature guardian-svg" role="img" aria-label={label} />;
  const svg = archipeo ? (
    <Suspense fallback={place}>
      <PersonnageSvg kind="guardian" id={biome} allumage={allumage} className="guardian-svg" label={label} />
    </Suspense>
  ) : (
    enCubes
  );
  const troisD = archipeo ? (
    <PersonnageCanvas
      kind="guardian"
      id={biome}
      allumage={allumage}
      reduceMotion={settings.reduceMotion}
      cameraDirection={[-0.55, -0.85]}
      elevation={0.35}
      className="creature-3d guardian-3d"
      label={label}
    />
  ) : (
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
  );
  return (
    <div key={`${mood}-${seq}`} className={`guardian guardian-${mood}`} aria-live="off">
      {settings.worldView !== '3d' || !hasWebGL() ? (
        svg
      ) : (
        <ErrorBoundary fallback={svg}>
          <Suspense fallback={svg}>
            {troisD}
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
