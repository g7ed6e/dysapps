// Les Gardiens de biome : de grandes créatures originales en cubes, qui réagissent pendant le défi.
import { lazy, Suspense, useMemo, useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useSettings } from '../core/SettingsContext';
import { useMoinsDAnimations } from '../core/motion';
import type { BiomeId } from './biomes';
import { habillageDuMonde } from './skin';
import { PersonnageCanvas, VoxelCanvas, hasWebGL } from './three';
import { VoxelScene } from './Voxel';
import { GUARDIAN_CUBES } from './world/characters/guardians';
import { gardienEnPartieRallume } from './world/terrain';
import type { Allumage } from './world/characters/sentinel';

/** Le Gardien d'Archipéo en SVG (lot R6, avec l'habillage d'Archipéo, voir skin.ts), chargé à la demande. */
const PersonnageSvg = lazy(() => import('./CharacterSvg'));

export type GuardianMood = 'idle' | 'hit' | 'miss' | 'beaten';

interface Props {
  biome: BiomeId;
  label: string;
  mood?: GuardianMood;
  /** Change à chaque réaction, pour rejouer l'animation. */
  seq?: number;
  /**
   * Le Gardien éteint : son allumage, donné par le défi (lot 6, GD-8), et la durée de son fondu en secondes (la
   * sentinelle d'Archipéo) ; en cubes, ses couleurs reviennent des pieds vers la tête. Sans lui, il s'allume d'un coup
   * quand l'humeur devient « beaten ».
   */
  allumage?: Allumage;
  fondu?: number;
}

/** Le Gardien en 3D (respiration), en SVG sans WebGL ; l'humeur anime le cadre (s'incline, gronde, s'écroule). */
export function Guardian3D({ biome, label, mood = 'idle', seq = 0, allumage: donne, fondu = 0 }: Props) {
  const { settings } = useSettings();
  const reduceMotion = useMoinsDAnimations();
  // En cubes, la part rallumée suit l'allumage donné (la pierre à la victoire, sinon les lueurs) ; sans allumage, en
  // couleurs.
  const part = donne === undefined ? 1 : typeof donne === 'number' ? donne : Math.max(donne.pierre, donne.lueurs);
  const cubes = useMemo(() => gardienEnPartieRallume(GUARDIAN_CUBES[biome], part), [biome, part]);
  // Les figures de l'habillage (skin.ts) : le Gardien en sentinelle de pierre, éteinte, que le défi rallume
  // (lot 6) ou, sans allumage donné, rallumée d'un coup une fois son défi réussi ; sinon en cubes, rallumés des pieds vers la tête (GD-8).
  const [dessine] = useState(() => habillageDuMonde().figures === 'modeles');
  const allumage = donne ?? (mood === 'beaten' ? 1 : 0);
  const enCubes = <VoxelScene cubes={cubes} s={12} pad={6} className="creature guardian-svg" label={label} />;
  // Le temps que la sentinelle arrive : sa place, vide, à sa taille (pas le Gardien en cubes, qui sauterait).
  const place = <span className="creature guardian-svg" role="img" aria-label={label} />;
  const svg = dessine ? (
    <Suspense fallback={place}>
      <PersonnageSvg kind="guardian" id={biome} allumage={allumage} className="guardian-svg" label={label} />
    </Suspense>
  ) : (
    enCubes
  );
  const troisD = dessine ? (
    <PersonnageCanvas
      kind="guardian"
      id={biome}
      allumage={allumage}
      fondu={fondu}
      reduceMotion={reduceMotion}
      cameraDirection={[-0.55, -0.85]}
      elevation={0.35}
      remplir
      className="creature-3d guardian-3d"
      label={label}
    />
  ) : (
    <VoxelCanvas
      cubes={cubes}
      breathe
      interactive={false}
      reduceMotion={reduceMotion}
      cameraDirection={[0.55, -0.85]}
      elevation={0.35}
      remplir
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
