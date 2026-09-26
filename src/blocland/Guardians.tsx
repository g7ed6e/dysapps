// Les Gardiens de biome : de grandes créatures originales en cubes, qui réagissent pendant le défi.
import { Suspense } from 'react';
import { useSettings } from '../core/SettingsContext';
import type { BiomeId } from './biomes';
import { fromLayers } from './Creatures';
import { VoxelCanvas, hasWebGL } from './three';
import { VoxelScene, type VoxelCube } from './Voxel';

// Couches de bas en haut ; ligne = y (le visage est côté y = 0, face à la caméra), colonne = x.
// Chaque Gardien fait 7 à 9 blocs de large et 9 à 13 de haut : quatre à six fois le bonhomme, un visage lisible de loin,
// deux ou trois couleurs et un attribut (cornes, livre, marteau, chapeau, balance).

// Le Grand Chêne : un tronc à visage (yeux d'or, bouche sombre), des racines, une large couronne en étages.
const GRAND_CHENE = fromLayers(
  [
    ['.TTTTTTT.', '..TTTTT..', '..TTTTT..', '....T....'],
    ['...TTT...', '...TTT...', '...TTT...', '.........'],
    ['...TTT...', '...TTT...', '...TTT...', '.........'],
    ['...TTT...', '...TTT...', '...TTT...', '.........'],
    ['...TMT...', '...TTT...', '...TTT...', '.........'],
    ['...ETE...', '...TTT...', '...TTT...', '.........'],
    ['...TTT...', '...TTT...', '...TTT...', '.........'],
    ['..LLLLL..', '.LLLLLLL.', '.LLLLLLL.', '..LLLLL..'],
    ['.LLLLLLL.', 'LLLLLLLLL', 'LLLLLLLLL', '.LLLLLLL.'],
    ['.LLLLLLL.', 'LLLLLLLLL', 'LLLLLLLLL', '.LLLLLLL.'],
    ['..LLLLL..', '.LLLLLLL.', '.LLLLLLL.', '..LLLLL..'],
    ['...LLL...', '..LLLLL..', '..LLLLL..', '...LLL...'],
    ['.........', '...LLL...', '...LLL...', '.........'],
  ],
  { T: '#6b4a2e', L: '#3f7a2b', E: '#f5d63d', M: '#1f2a1a' },
);

// Le Golem de roche : un colosse de pierre, bras épais, un seul œil d'or, une gemme sur la poitrine.
const GOLEM = fromLayers(
  [
    ['.........', '.RR...RR.', '.RR...RR.', '.........'],
    ['.........', '.RR...RR.', '.RR...RR.', '.........'],
    ['.rrrrrrr.', 'RRRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.'],
    ['.rrrOrrr.', 'RRRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.'],
    ['.rrrrrrr.', 'RRRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.'],
    ['.rrrrrrr.', 'RRRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.'],
    ['..rKKKr..', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..rrOrr..', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..rrrrr..', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['...rrr...', '..RRRRR..', '..RRRRR..', '...RRR...'],
  ],
  { R: '#7d7d7d', r: '#9c9c9c', O: '#f2c944', K: '#3a3a3a' },
);

// La Dune vivante : une montagne de sable qui s'élève en pointe, deux yeux sombres et une bouche dans la pente.
const DUNE = fromLayers(
  [
    ['SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS'],
    ['.SSSSSSS.', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', '.SSSSSSS.'],
    ['..SMMMS..', '.SSSSSSS.', 'SSSSSSSSS', 'SSSSSSSSS', '.SSSSSSS.', '..SSSSS..'],
    ['..SKSKS..', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '..SSSSS..', '.........'],
    ['..SSSSS..', '.SSSSSSS.', '.SSSSSSS.', '..SSSSS..', '.........', '.........'],
    ['...SSS...', '..SSSSS..', '..SSSSS..', '...SSS...', '.........', '.........'],
    ['....s....', '...SSS...', '...SSS...', '....S....', '.........', '.........'],
    ['.........', '....s....', '....s....', '.........', '.........', '.........'],
  ],
  { S: '#e8e0b4', s: '#cfc48f', K: '#4a3a22', M: '#8a7a52' },
);

// Le Taureau de terre : massif, quatre pattes, muselière rose, yeux clairs, grandes cornes blanches.
const TAUREAU = fromLayers(
  [
    ['.........', '.BB...BB.', '.........', '.........', '.BB...BB.', '.........'],
    ['.........', '.BB...BB.', '.........', '.........', '.BB...BB.', '.........'],
    ['.bbbbbbb.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['.bbbbbbb.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['.bbbbbbb.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['.bbbbbbb.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['..bNNNb..', '..BBBBB..', '.BBBBBBB.', '.BBBBBBB.', '.BBBBBBB.', '.........'],
    ['..bEbEb..', '..BBBBB..', '.BBBBBBB.', '.........', '.........', '.........'],
    ['..BBBBB..', '..BBBBB..', '.........', '.........', '.........', '.........'],
    ['HH.....HH', 'H.......H', '.........', '.........', '.........', '.........'],
    ['H.......H', '.........', '.........', '.........', '.........', '.........'],
  ],
  { B: '#5a3a22', b: '#7a5236', H: '#f4e6d4', N: '#e8a3b8', E: '#f6f1e6' },
);

// La Chouette de verre : une chouette translucide bleu pâle, ailes larges, bec d'or, grands yeux cerclés d'or.
const CHOUETTE = fromLayers(
  [
    ['.........', '...O.O...', '.........', '.........', '.........'],
    ['..vvvvv..', '.VvvvvvV.', '.VVVVVVV.', '.VVVVVVV.', '..VVVVV..'],
    ['..vvvvv..', 'VVvvvvvVV', 'VVVVVVVVV', 'VVVVVVVVV', '..VVVVV..'],
    ['..vvvvv..', 'VVvvvvvVV', 'VVVVVVVVV', 'VVVVVVVVV', '..VVVVV..'],
    ['..vvvvv..', 'VVvvvvvVV', 'VVVVVVVVV', 'VVVVVVVVV', '..VVVVV..'],
    ['..vvOvv..', 'VVVVVVVVV', 'VVVVVVVVV', 'VVVVVVVVV', '..VVVVV..'],
    ['.OEEvEEO.', '.VVVVVVV.', '.VVVVVVV.', '.VVVVVVV.', '..VVVVV..'],
    ['.OEKvKEO.', '.VVVVVVV.', '.VVVVVVV.', '.VVVVVVV.', '..VVVVV..'],
    ['.OOOOOOO.', '.VVVVVVV.', '.VVVVVVV.', '..VVVVV..', '.........'],
    ['..VVVVV..', '..VVVVV..', '..VVVVV..', '.........', '.........'],
    ['.V.....V.', '.........', '.........', '.........', '.........'],
  ],
  { V: '#a9dbe6', v: '#d6f2f8', O: '#e0a33a', E: '#f6f1e6', K: '#1f1a16' },
);

// Le Hanneton de bronze : un gros scarabée aux élytres de bronze, tête sombre aux yeux d'or, six pattes, antennes.
const HANNETON = fromLayers(
  [
    ['.........', 'K.......K', '.........', 'K.......K', '.........', 'K.......K', '.........'],
    ['..KKKKK..', '.ZZZZZZZ.', 'ZZZZZZZZZ', 'ZZZZZZZZZ', 'ZZZZZZZZZ', '.ZZZZZZZ.', '..ZZZZZ..'],
    ['..KEKEK..', '.ZzZZZzZ.', 'ZZZZZZZZZ', 'ZZZZZZZZZ', 'ZZZZZZZZZ', '.ZZZZZZZ.', '..ZZZZZ..'],
    ['..KKKKK..', '..ZZZZZ..', '.ZZzZzZZ.', '.ZZZZZZZ.', '.ZZZZZZZ.', '..ZZZZZ..', '.........'],
    ['..A...A..', '...ZZZ...', '..ZZZZZ..', '..ZZZZZ..', '...ZZZ...', '.........', '.........'],
    ['.A.....A.', '.........', '...ZZZ...', '...ZZZ...', '.........', '.........', '.........'],
  ],
  { Z: '#b8742a', z: '#d9954a', K: '#2a2622', E: '#f5d63d', A: '#2a2622' },
);

// Le Brochet d'argent : un long poisson dressé sur sa queue, écailles d'argent, nageoires bleues, œil d'or.
const BROCHET = fromLayers(
  [
    ['.........', '..FFFFF..', '..FFFFF..', '.........', '.........'],
    ['.........', '....A....', '....A....', '.........', '.........'],
    ['...aaa...', '..AAAAA..', '..AAAAA..', '...AAA...', '.........'],
    ['..aaaaa..', '.AAAAAAA.', '.AAAAAAA.', '..AAAAA..', '.........'],
    ['..aaaaa..', 'FAAAAAAAF', '.AAAAAAA.', '..AAAAA..', '.........'],
    ['..aaaaa..', '.AAAAAAA.', '.AAAAAAA.', '..AAAAA..', '.........'],
    ['..aaaaa..', '.AAAAAAA.', '.AAAAAAA.', '..AAAAA..', '.........'],
    ['..aaaaa..', '.AAAAAAA.', '.AAAAAAA.', '..AAAAA..', '.........'],
    ['..aMMMa..', '.AAAAAAA.', '.AAAAAAA.', '..AAFAA..', '.........'],
    ['..aEaEa..', '.AAAAAAA.', '.AAAAAAA.', '..AAFAA..', '.........'],
    ['...aaa...', '..AAAAA..', '..AAAAA..', '...AAA...', '.........'],
  ],
  { A: '#b8c4cc', a: '#dfe6ea', F: '#7f96ad', E: '#f5d63d', M: '#3a3a3a' },
);

/** Un dragon trapu : pattes, ventre clair, ailes repliées, cou, tête cornue aux yeux vifs. */
function dragon(palette: Record<string, string>): VoxelCube[] {
  return fromLayers(
    [
      ['.........', '.CC...CC.', '.........', '.........', '.CC...CC.', '.........', '.........'],
      ['.........', '.CC...CC.', '.........', '.........', '.CC...CC.', '.........', '.........'],
      ['..OOOOO..', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..', '...CC....'],
      ['..OOOOO..', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..', '....C....'],
      ['..OOOOO..', 'WCCCCCCCW', 'WCCCCCCCW', 'WCCCCCCCW', '.CCCCCCC.', '..CCC....', '.........'],
      ['..CCCCC..', 'WCCCCCCCW', 'WCCCCCCCW', 'W.......W', '.........', '.........', '.........'],
      ['..CMMMC..', '..CCCCC..', 'W.......W', 'W.......W', '.........', '.........', '.........'],
      ['..CRCRC..', '..CCCCC..', '.W.....W.', '.........', '.........', '.........', '.........'],
      ['..CCCCC..', '..CCCCC..', '.........', '.........', '.........', '.........', '.........'],
      ['..H...H..', '.........', '.........', '.........', '.........', '.........', '.........'],
    ],
    palette,
  );
}

// Le Dragon de cendre : gris cendre, ventre de braise, ailes sombres, yeux rouges.
const DRAGON = dragon({ C: '#5a5a5a', O: '#f28c28', W: '#3a3a3a', R: '#d8402e', M: '#2a2a2a', H: '#3a3a3a' });

// Le Mammouth de givre : massif, poil brun, dos givré, trompe et longues défenses blanches.
const MAMMOUTH = fromLayers(
  [
    ['.........', '.BB...BB.', '.BB...BB.', '.........', '.BB...BB.', '.BB...BB.', '.........'],
    ['.........', '.BB...BB.', '.BB...BB.', '.........', '.BB...BB.', '.BB...BB.', '.........'],
    ['....B....', '.BB...BB.', '.BB...BB.', '.........', '.BB...BB.', '.BB...BB.', '.........'],
    ['....B....', '.BBBBBBB.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['..T.B.T..', '.BBBBBBB.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['..T.B.T..', '.BBBBBBB.', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '.BBBBBBB.'],
    ['..BBBBB..', '.BBBBBBB.', 'BFFFFFFFB', 'BFFFFFFFB', 'BFFFFFFFB', 'BFFFFFFFB', '.BBBBBBB.'],
    ['..BEBEB..', '.BBBBBBB.', '.BFFFFFB.', '.BFFFFFB.', '.BFFFFFB.', '.BBBBBBB.', '.........'],
    ['..BBBBB..', '.BBBBBBB.', '.........', '.........', '.........', '.........', '.........'],
    ['..FFFFF..', '..FFFFF..', '.........', '.........', '.........', '.........', '.........'],
  ],
  { B: '#6b4a2e', F: '#dff4fb', T: '#f6f1e6', E: '#1f1a16' },
);

// Le Colporteur : un grand personnage à cape violette, besace rouge, chapeau brun à large bord.
const COLPORTEUR = fromLayers(
  [
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', 'TPPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', 'TPPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['...SsS...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['...KSK...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['.HHHHHHH.', 'HHHHHHHHH', 'HHHHHHHHH', '.HHHHHHH.'],
    ['...HHH...', '..HHHHH..', '..HHHHH..', '...HHH...'],
    ['...HHH...', '..HHHHH..', '..HHHHH..', '...HHH...'],
  ],
  { P: '#5a3a8a', T: '#c9463f', S: '#e8b98a', s: '#c98a6a', K: '#1f1a16', H: '#6b4a2e' },
);

/** Un sphinx couché : pattes devant, corps allongé, tête coiffée d'une coiffe rayée, regard d'or. */
function sphinx(palette: Record<string, string>): VoxelCube[] {
  return fromLayers(
    [
      ['.SS...SS.', '.SS...SS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '..SSSSS..'],
      ['.........', '.........', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '..SSSSS..'],
      ['.........', '..SSSSS..', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '..SSSSS..', '.........', '.........'],
      ['.........', '.DSSsSSD.', '.DSSSSSD.', '.DSSSSSD.', '.........', '.........', '.........', '.........'],
      ['.........', '.GSESESG.', '.GSSSSSG.', '.GSSSSSG.', '.........', '.........', '.........', '.........'],
      ['.........', '.DSSSSSD.', '.DSSSSSD.', '.DSSSSSD.', '.........', '.........', '.........', '.........'],
      ['.........', '.GDDDDDG.', '.DDDDDDD.', '.DDDDDDD.', '.........', '.........', '.........', '.........'],
      ['.........', '..DDDDD..', '..DDDDD..', '.........', '.........', '.........', '.........', '.........'],
    ],
    palette,
  );
}

// Le Sphinx des routes : un lion de grès couché, coiffe bleue et or, regard doré.
const SPHINX = sphinx({ S: '#9c8a6a', s: '#7d6e55', D: '#3a4a7a', G: '#e0a33a', E: '#f5d63d' });

// L'Hydre des marais : trois cous verts qui sortent de la vase, trois têtes aux yeux jaunes et à la langue rouge.
const HYDRE = fromLayers(
  [
    ['.MMMMMMM.', 'MMMMMMMMM', 'MMMMMMMMM', '.MMMMMMM.', '.........'],
    ['..VV.VV..', '.VVVVVVV.', '.VVVVVVV.', '..VVVVV..', '.........'],
    ['.........', 'VV..V..VV', 'VV..V..VV', '.........', '.........'],
    ['.........', 'VV..V..VV', 'VV..V..VV', '.........', '.........'],
    ['.........', 'VV..V..VV', 'VV..V..VV', '.........', '.........'],
    ['.........', 'VV..V..VV', 'VV..V..VV', '.........', '.........'],
    ['VRV...VRV', 'VVV.V.VVV', 'VVV...VVV', '.........', '.........'],
    ['EVE...EVE', 'VVV.V.VVV', 'VVV...VVV', '.........', '.........'],
    ['VVV...VVV', 'VVVVVVVVV', 'VVV...VVV', '.........', '.........'],
    ['...VRV...', '...VVV...', '.........', '.........', '.........'],
    ['...EVE...', '...VVV...', '.........', '.........', '.........'],
    ['...VVV...', '...VVV...', '.........', '.........', '.........'],
  ],
  { M: '#4a3a2a', V: '#3f6b3a', E: '#f5d63d', R: '#d8402e' },
);

// Le Titan d'acier : un colosse en plaques d'acier, cœur de forge orange, épaules carrées, yeux rouges.
const TITAN = fromLayers(
  [
    ['.........', '.AA...AA.', '.AA...AA.', '.........', '.........'],
    ['.........', '.AA...AA.', '.AA...AA.', '.........', '.........'],
    ['.........', '.AA...AA.', '.AA...AA.', '.........', '.........'],
    ['..aaaaa..', 'AAAAAAAAA', 'AAAAAAAAA', '..AAAAA..', '.........'],
    ['..aaOaa..', 'AAAAAAAAA', 'AAAAAAAAA', '..AAAAA..', '.........'],
    ['..aaaaa..', 'AAAAAAAAA', 'AAAAAAAAA', '..AAAAA..', '.........'],
    ['aaaaaaaaa', 'AAAAAAAAA', 'AAAAAAAAA', '.AAAAAAA.', '.........'],
    ['aaaaaaaaa', 'AAAAAAAAA', 'AAAAAAAAA', '.AAAAAAA.', '.........'],
    ['..aMMMa..', '..AAAAA..', '..AAAAA..', '.........', '.........'],
    ['..aRaRa..', '..AAAAA..', '..AAAAA..', '.........', '.........'],
    ['..aaaaa..', '..AAAAA..', '..AAAAA..', '.........', '.........'],
  ],
  { A: '#7f8a99', a: '#a9b3bf', O: '#f28c28', R: '#d8402e', M: '#3a3a3a' },
);

// Le Golem des équations : un corps de calque crème, un grand œil bleu, et une balance sur la tête (fléau, deux plateaux d'or).
const GOLEM_EQ = fromLayers(
  [
    ['.........', '..C...C..', '.........', '.........'],
    ['.........', '..C...C..', '.........', '.........'],
    ['..CCCCC..', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['..CCCCC..', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['..CXXXC..', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['..CXKXC..', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['GGCXXXCGG', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['B.CCCCC.B', '.CCCCCCC.', '.CCCCCCC.', '..CCCCC..'],
    ['BBBBBBBBB', '..CCCCC..', '..CCCCC..', '.........'],
    ['....B....', '.........', '.........', '.........'],
  ],
  { C: '#f4f1e4', X: '#3b82f6', K: '#1f1a16', G: '#e0a33a', B: '#8a6a3c' },
);

// Le Bélier de granit : massif, gris rose, museau clair, grandes cornes enroulées de chaque côté de la tête.
const BELIER = fromLayers(
  [
    ['.........', '.GG...GG.', '.........', '.GG...GG.', '.........', '.........'],
    ['.........', '.GG...GG.', '.........', '.GG...GG.', '.........', '.........'],
    ['.ggggggg.', 'GGGGGGGGG', 'GGGGGGGGG', 'GGGGGGGGG', '.GGGGGGG.', '.........'],
    ['.ggggggg.', 'GGGGGGGGG', 'GGGGGGGGG', 'GGGGGGGGG', '.GGGGGGG.', '.........'],
    ['.ggggggg.', 'GGGGGGGGG', 'GGGGGGGGG', 'GGGGGGGGG', '.GGGGGGG.', '.........'],
    ['HHGgggGHH', 'GGGGGGGGG', '.GGGGGGG.', '.GGGGGGG.', '.........', '.........'],
    ['.HGKGKGH.', '.HGGGGGH.', '.GGGGGGG.', '.........', '.........', '.........'],
    ['HHGGGGGHH', 'HHGGGGGHH', '.........', '.........', '.........', '.........'],
    ['HH.....HH', 'HH.....HH', '.........', '.........', '.........', '.........'],
  ],
  { G: '#a89a94', g: '#c4b6b0', H: '#6b5a52', K: '#1f1a16' },
);

// Le Hibou lexicographe : un grand hibou brun au ventre clair, lunettes rondes dorées, un livre rouge sous l'aile.
const HIBOU = fromLayers(
  [
    ['.........', '...Y.Y...', '.........', '.........', '.........'],
    ['..bbbbb..', '.BbbbbbB.', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['..bbbbb..', 'LBbbbbbBB', 'BBBBBBBBB', 'BBBBBBBBB', '..BBBBB..'],
    ['..bbbbb..', 'LBbbbbbBB', 'BBBBBBBBB', 'BBBBBBBBB', '..BBBBB..'],
    ['..bbbbb..', 'BBbbbbbBB', 'BBBBBBBBB', 'BBBBBBBBB', '..BBBBB..'],
    ['..bbbbb..', 'BBBBBBBBB', 'BBBBBBBBB', 'BBBBBBBBB', '..BBBBB..'],
    ['..bbYbb..', '.BBBBBBB.', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.GEEGEEG.', '.BBBBBBB.', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.GEKGKEG.', '.BBBBBBB.', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.GGGGGGG.', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..', '.........'],
    ['..BBBBB..', '..BBBBB..', '..BBBBB..', '.........', '.........'],
    ['.B.....B.', '.........', '.........', '.........', '.........'],
  ],
  { B: '#6b4a2e', b: '#a07850', Y: '#f2c944', G: '#e0a33a', E: '#f6f1e6', K: '#1f1a16', L: '#c9463f' },
);

// Le Sphinx de marbre : le sphinx blanc, coiffe bleue rayée d'or.
const SPHINX_M = sphinx({ S: '#f4f1e4', s: '#dcd8cc', D: '#3a4a7a', G: '#e0a33a', E: '#f5d63d' });

// Le Comptable des étoiles : une haute silhouette violette, robe semée d'étoiles, chapeau pointu à étoile d'or.
const COMPTABLE = fromLayers(
  [
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PYPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPYP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['..pPPPp..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['...SsS...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['...KSK...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['.PPPPPPP.', 'PPPPPPPPP', 'PPPPPPPPP', '.PPPPPPP.'],
    ['..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PPPPP..'],
    ['...PPP...', '..PPPPP..', '..PPPPP..', '...PPP...'],
    ['....Y....', '...PPP...', '...PPP...', '.........'],
  ],
  { P: '#5a3a8a', p: '#7a5aaa', Y: '#f5d63d', S: '#e8b98a', s: '#c98a6a', K: '#1f1a16' },
);

// Le Dragon de lumière : dragon d'or aux ailes de verre, ventre clair, yeux blancs.
const DRAGON_L = dragon({ C: '#e0b842', O: '#fff4c2', W: '#d6f2f8', R: '#f6f1e6', M: '#8a6a1c', H: '#f2d16b' });

// Le Grand Lecteur : une haute silhouette en robe bleue, un livre ouvert tenu devant lui, lunettes rondes, cheveux sombres.
const LECTEUR = fromLayers(
  [
    ['.........', '...K.K...', '...K.K...', '.........', '.........'],
    ['.........', '...K.K...', '...K.K...', '.........', '.........'],
    ['.........', '..BBBBB..', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.........', '..BBBBB..', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.........', '..BBBBB..', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.LLLLLLL.', 'BBBBBBBBB', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.LLLLLLL.', 'BBBBBBBBB', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.........', '..BBBBB..', '.BBBBBBB.', '.BBBBBBB.', '..BBBBB..'],
    ['.........', '...SsS...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['.........', '..GKSKG..', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['.........', '...SSS...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['.........', '...HHH...', '..HHHHH..', '..HHHHH..', '...HHH...'],
  ],
  { B: '#3a4a7a', L: '#f4f1e4', S: '#e8b98a', s: '#c98a6a', K: '#1f1a16', G: '#e0a33a', H: '#2a2622' },
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
