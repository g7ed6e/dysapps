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

// Le Sphinx des routes : un lion de pierre couché, tête coiffée, regard doré.
const SPHINX = fromLayers(
  [
    ['SSSSSSS', 'SSSSSSS', 'SSSSSSS', 'SSSSSSS'],
    ['.SSSSS.', 'SSSSSSS', 'SSSSSSS', '.SSSS..'],
    ['..SSS..', '.SSSSS.', '.SSSS..', '.......'],
    ['..SES..', '..SSS..', '.......', '.......'],
    ['..HHH..', '..HHH..', '.......', '.......'],
  ],
  { S: '#d6c8a0', E: '#f5d63d', H: '#3a4a7a' },
);

// L'Hydre des marais : trois cous verts sortant de la vase, trois têtes aux yeux jaunes.
const HYDRE = fromLayers(
  [
    ['VVVVVVV', 'VVVVVVV', 'VVVVVVV', '.VVVVV.'],
    ['V..V..V', '.VVVVV.', '.......', '.......'],
    ['V..V..V', '.......', '.......', '.......'],
    ['V..V..V', '.......', '.......', '.......'],
    ['E..E..E', 'V..V..V', '.......', '.......'],
    ['V..V..V', '.......', '.......', '.......'],
  ],
  { V: '#3f6b3a', E: '#f5d63d' },
);

// Le Titan d'acier : un colosse en plaques d'acier, yeux rouges, épaules carrées.
const TITAN = fromLayers(
  [
    ['.AA.AA.', '.AA.AA.', '.AA.AA.', '.......'],
    ['.AA.AA.', '.AA.AA.', '.AA.AA.', '.......'],
    ['AAAAAAA', 'AaaaaaA', 'AAAAAAA', '.......'],
    ['AAAAAAA', 'AaaaaaA', 'AAAAAAA', '.......'],
    ['AAAAAAA', 'AAAAAAA', 'AAAAAAA', '.......'],
    ['..AAA..', '..ARA..', '..AAA..', '.......'],
    ['..AAA..', '..AAA..', '..AAA..', '.......'],
  ],
  { A: '#8f9aa6', a: '#c4ccd4', R: '#e03a2e' },
);

// Le Golem des équations : deux plateaux de balance sur un fléau, un corps de calque, un œil.
const GOLEM_EQ = fromLayers(
  [
    ['CCC.CCC', 'CCC.CCC', '.......', '.......'],
    ['...C...', '...C...', '.......', '.......'],
    ['..CCC..', '.CCCCC.', '..CCC..', '.......'],
    ['..CCC..', '.CCCCC.', '..CCC..', '.......'],
    ['CCCCCCC', 'CCCCCCC', '.......', '.......'],
    ['..CCC..', '..CEC..', '..CCC..', '.......'],
    ['..CCC..', '..CCC..', '.......', '.......'],
  ],
  { C: '#dcd6c0', E: '#3b82f6' },
);

// Le Bélier de granit : massif, gris rose, grandes cornes enroulées.
const BELIER = fromLayers(
  [
    ['.G.G.G.', '.......', '.G.G.G.', '.......'],
    ['GGGGGGG', 'GGGGGGG', 'GGGGGGG', '.......'],
    ['GGGGGGG', 'GgggggG', 'GGGGGGG', '.......'],
    ['.GGGGG.', 'GGGGGGG', '.GGGGG.', '.......'],
    ['C.GEG.C', 'CCGGGCC', '.......', '.......'],
    ['CC...CC', '.......', '.......', '.......'],
  ],
  { G: '#8c8088', g: '#b3a8ae', C: '#5c5460', E: '#f5d63d' },
);

// Le Hibou lexicographe : grand hibou brun, lunettes rondes, un livre sous l'aile.
const HIBOU = fromLayers(
  [
    ['..BBB..', '.BBBBB.', '..BBB..', '.......'],
    ['.BBBBB.', 'BBLLLBB', '.BBBBB.', '.......'],
    ['BBBBBBB', 'BBbbbBB', 'BBBBBBB', '.......'],
    ['.BBBBB.', 'BBBBBBB', '.BBBBB.', '.......'],
    ['.BBBBB.', 'BOBYBOB', '.BBBBB.', '.......'],
    ['B.BBB.B', '..BBB..', '.......', '.......'],
  ],
  { B: '#6e4a2e', b: '#a8825a', L: '#e8d8a8', O: '#f6f1e6', Y: '#f5d63d' },
);

// Le Sphinx de marbre : le sphinx blanc, couché, coiffe bleue rayée d'or.
const SPHINX_M = fromLayers(
  [
    ['MMMMMMM', 'MMMMMMM', 'MMMMMMM', 'MMMMMMM'],
    ['.MMMMM.', 'MMMMMMM', 'MMMMMMM', '.MMMM..'],
    ['..MMM..', '.MMMMM.', '.MMMM..', '.......'],
    ['..MEM..', '..MMM..', '.......', '.......'],
    ['.BYBYB.', '..BBB..', '.......', '.......'],
  ],
  { M: '#f1eee8', E: '#3b82f6', B: '#3a4a7a', Y: '#f2c944' },
);

// Le Comptable des étoiles : haute silhouette violette, chapeau pointu, étoiles dorées.
const COMPTABLE = fromLayers(
  [
    ['.VVVVV.', 'VVVVVVV', '.VVVVV.', '.......'],
    ['.VVVVV.', 'VVYVYVV', '.VVVVV.', '.......'],
    ['..VVV..', '.VVVVV.', '..VVV..', '.......'],
    ['..VVV..', '.VYVYV.', '..VVV..', '.......'],
    ['..SES..', '..SSS..', '.......', '.......'],
    ['..VVV..', '..VVV..', '.......', '.......'],
    ['...V...', '.......', '.......', '.......'],
  ],
  { V: '#5b3a8a', Y: '#f2c944', S: '#e8b98a', E: '#1f1a16' },
);

// Le Dragon de lumière : dragon doré aux ailes de verre, yeux blancs.
const DRAGON_L = fromLayers(
  [
    ['.D...D.', '.D...D.', '.D...D.', '.......'],
    ['DDDDDDD', 'DLLLLLD', 'DDDDDDD', '.DDDDD.'],
    ['DDDDDDD', 'DLLLLLD', 'DDDDDDD', '.DDDDD.'],
    ['L.DDD.L', 'L.DLD.L', 'L.DDD.L', '.......'],
    ['L.DDD..', 'L.DED..', 'L.DDD..', '.......'],
    ['..DDD..', '..DED..', '..DDD..', '.......'],
    ['.D...D.', '..DDD..', '.......', '.......'],
  ],
  { D: '#e0b842', L: '#fff4c2', E: '#f6f1e6' },
);

// Le Grand Lecteur : une haute silhouette en robe bleue, un livre ouvert devant lui, lunettes rondes.
const LECTEUR = fromLayers(
  [
    ['.BBBBB.', 'BBBBBBB', '.BBBBB.', '.......'],
    ['.BBBBB.', 'BBBBBBB', '.BBBBB.', '.......'],
    ['LLLLLLL', '.BBBBB.', '..BBB..', '.......'],
    ['LLLLLLL', '.BBBBB.', '..BBB..', '.......'],
    ['..BBB..', '.BBBBB.', '..BBB..', '.......'],
    ['..SSS..', '.SOSOS.', '..SSS..', '.......'],
    ['..BBB..', '..BBB..', '.......', '.......'],
  ],
  { B: '#3a4a7a', L: '#f4f1e4', S: '#e8b98a', O: '#f6f1e6' },
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
  carrefour: SPHINX,
  marais: HYDRE,
  forge: TITAN,
  atelier: GOLEM_EQ,
  falaise: BELIER,
  cabinet: HIBOU,
  belvedere: SPHINX_M,
  donnees: COMPTABLE,
  phare: DRAGON_L,
  textes: LECTEUR,
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
