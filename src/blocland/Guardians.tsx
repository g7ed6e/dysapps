// Les Gardiens de biome : de grandes créatures originales en cubes, qui réagissent pendant le défi.
import { Suspense } from 'react';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { fromLayers } from './Creatures';
import { VoxelCanvas, hasWebGL } from './three';
import { VoxelScene, type VoxelCube } from './Voxel';

// Couches de bas en haut ; ligne = y (le visage est côté y = 0, face à la caméra), colonne = x.
const GRAND_CHENE = fromLayers(
  [
    ['..TTT..', '..TTT..', '..TTT..', '.......'],
    ['..TTT..', '..TtT..', '..TTT..', '.......'],
    ['..TTT..', '..TtT..', '..TTT..', '.......'],
    ['.LLLLL.', 'LLLLLLL', 'LLLLLLL', '.LLLLL.'],
    ['LLLLLLL', 'LLELELL', 'LLLLLLL', 'LLLLLLL'],
    ['.LLLLL.', 'LLLMLLL', 'LLLLLLL', '.LLLLL.'],
    ['..LLL..', '.LLLLL.', '.LLLLL.', '..LLL..'],
  ],
  { T: '#6b4a2e', t: '#8a6a3c', L: '#3f7a2b', E: '#f5d63d', M: '#1f2a1a' },
);

const GOLEM = fromLayers(
  [
    ['.RR.RR.', '.RR.RR.', '.RR.RR.', '.......'],
    ['.RR.RR.', '.RR.RR.', '.RR.RR.', '.......'],
    ['RRRRRRR', 'RrrrrrR', 'RRRRRRR', '.......'],
    ['RRRRRRR', 'RrrrrrR', 'RRRRRRR', '.......'],
    ['R.RRR.R', 'R.RRR.R', 'R.RRR.R', '.......'],
    ['..RRR..', '..ROR..', '..RRR..', '.......'],
    ['..RRR..', '..RRR..', '..RRR..', '.......'],
  ],
  { R: '#7d7d7d', r: '#9c9c9c', O: '#f2c944' },
);

const DUNE = fromLayers(
  [
    ['SSSSSSS', 'SSSSSSS', 'SSSSSSS', 'SSSSSSS', '.SSSSS.'],
    ['.SSSSS.', 'SSSSSSS', 'SSSSSSS', '.SSSSS.', '.......'],
    ['..SSS..', '.SSSSS.', '.SSSSS.', '.......', '.......'],
    ['..SES..', '..SSS..', '.......', '.......', '.......'],
    ['..S.S..', '.......', '.......', '.......', '.......'],
  ],
  { S: '#e8e0b4', E: '#1f1a16' },
);

const TAUREAU = fromLayers(
  [
    ['.B...B.', '.B...B.', '.B...B.', '.......'],
    ['BBBBBBB', 'BBBBBBB', 'BBBBBBB', '.......'],
    ['BBBBBBB', 'BBBBBBB', 'BBBBBBB', '.......'],
    ['.BBBBB.', 'BBBBBBB', '.BBBBB.', '.......'],
    ['..BBB..', '.BEBEB.', '.......', '.......'],
    ['.H...H.', '..HHH..', '.......', '.......'],
    ['H.....H', '.......', '.......', '.......'],
  ],
  { B: '#6e4a2e', E: '#f6f1e6', H: '#f4e6d4' },
);

const CHOUETTE = fromLayers(
  [
    ['..VVV..', '.VVVVV.', '..VVV..', '.......'],
    ['.VVVVV.', 'VVVVVVV', '.VVVVV.', '.......'],
    ['VVVVVVV', 'VVvvvVV', 'VVVVVVV', '.......'],
    ['.VVVVV.', 'VVVVVVV', '.VVVVV.', '.......'],
    ['.VVVVV.', 'VYVOVYV', '.VVVVV.', '.......'],
    ['V.....V', '.VVVVV.', '.......', '.......'],
  ],
  { V: '#a9dbe6', v: '#d6f2f8', Y: '#f5d63d', O: '#e0a33a' },
);

export const GUARDIAN_CUBES: Record<BiomeId, VoxelCube[]> = {
  foret: GRAND_CHENE,
  mine: GOLEM,
  carriere: DUNE,
  ferme: TAUREAU,
  tour: CHOUETTE,
};

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
      {!settings.view3d || !hasWebGL() ? (
        svg
      ) : (
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
      )}
    </div>
  );
}
