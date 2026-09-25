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

// Le Hanneton de bronze : un gros scarabée aux élytres de bronze, six pattes, deux antennes en éventail.
const HANNETON = fromLayers(
  [
    ['P.....P', 'P.....P', 'P.....P', '.......'],
    ['.BBBBB.', 'BBBBBBB', 'BBBBBBB', '.BBBBB.'],
    ['.BBBBB.', 'BbbbbbB', 'BbbbbbB', '.BBBBB.'],
    ['..BBB..', '.BbBbB.', '.BBBBB.', '..BBB..'],
    ['..KKK..', '..KEK..', '..KKK..', '.......'],
    ['.A...A.', '..AAA..', '.......', '.......'],
  ],
  { P: '#3a2a1a', B: '#a8742a', b: '#d19a3f', K: '#3a2a1a', E: '#f5d63d', A: '#3a2a1a' },
);

// Le Brochet d'argent : un long poisson dressé sur sa queue, écailles argentées, nageoires et œil doré.
const BROCHET = fromLayers(
  [
    ['..SSS..', '.SSSSS.', '..SSS..', '.......'],
    ['..SSS..', '..SSS..', '..SSS..', '.......'],
    ['.SSSSS.', '.SsssS.', '.SSSSS.', '.......'],
    ['SSSSSSS', 'SsssssS', 'SSSSSSS', '.......'],
    ['.SSSSS.', '.SsssS.', '.SSSSS.', '.......'],
    ['..SES..', '..SSS..', '..SSS..', '.......'],
    ['..SSS..', '...S...', '.......', '.......'],
  ],
  { S: '#b9c4d1', s: '#dfe6ee', E: '#f5d63d' },
);

// Le Dragon de cendre : un dragon trapu gris cendre, ventre braise, ailes repliées, yeux rouges.
const DRAGON = fromLayers(
  [
    ['.C...C.', '.C...C.', '.C...C.', '.......'],
    ['CCCCCCC', 'CRRRRRC', 'CCCCCCC', '.CCCCC.'],
    ['CCCCCCC', 'CRRRRRC', 'CCCCCCC', '.CCCCC.'],
    ['W.CCC.W', 'W.CRC.W', 'W.CCC.W', '.......'],
    ['W.CCC..', 'W.CEC..', 'W.CCC..', '.......'],
    ['..CCC..', '..CEC..', '..CCC..', '.......'],
    ['.C...C.', '..CCC..', '.......', '.......'],
  ],
  { C: '#6b6670', R: '#e8742e', W: '#4a4550', E: '#e03a2e' },
);

// Le Mammouth de givre : massif, poil brun givré, longues défenses blanches.
const MAMMOUTH = fromLayers(
  [
    ['.M.M.M.', '.......', '.M.M.M.', '.......'],
    ['MMMMMMM', 'MMMMMMM', 'MMMMMMM', '.......'],
    ['MMMMMMM', 'MmmmmmM', 'MMMMMMM', '.......'],
    ['.MMMMM.', 'MMMMMMM', '.MMMMM.', '.......'],
    ['D.MMM.D', '.MEMEM.', '.......', '.......'],
    ['D..M..D', '.......', '.......', '.......'],
    ['...M...', '.......', '.......', '.......'],
  ],
  { M: '#6e4a2e', m: '#a8c8d8', D: '#f6f1e6', E: '#1f1a16' },
);

// Le Colporteur : grand personnage à cape violette, chapeau large, besace de toile.
const COLPORTEUR = fromLayers(
  [
    ['..P.P..', '..P.P..', '.......', '.......'],
    ['..PPP..', '.PPPPP.', '..TTT..', '.......'],
    ['..PPP..', '.PPPPP.', '..TTT..', '.......'],
    ['.PPPPP.', 'PPPPPPP', '.PTTTP.', '.......'],
    ['..SSS..', '.SESES.', '..SSS..', '.......'],
    ['.HHHHH.', 'HHHHHHH', '.HHHHH.', '.......'],
    ['..HHH..', '..HHH..', '.......', '.......'],
  ],
  { P: '#5b3a8a', T: '#e9d9b8', S: '#e8b98a', E: '#1f1a16', H: '#3a2a1a' },
);

export const GUARDIAN_CUBES: Record<BiomeId, VoxelCube[]> = {
  foret: GRAND_CHENE,
  mine: GOLEM,
  carriere: DUNE,
  ferme: TAUREAU,
  tour: CHOUETTE,
  plaine: HANNETON,
  riviere: BROCHET,
  volcan: DRAGON,
  glacier: MAMMOUTH,
  marche: COLPORTEUR,
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
