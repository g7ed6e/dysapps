// Les Gardiens, dessinés en cubes. Module pur : les vues (SVG, 3D, monde) les lisent.
import type { BiomeId } from '../../biomes';
import { fromLayers, type CubeDeModele } from './ascii';

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
function dragon(palette: Record<string, string>): CubeDeModele[] {
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
function sphinx(palette: Record<string, string>): CubeDeModele[] {
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

// Le Lion de pierre : le lion couché des places anglaises, pierre grise, crinière plus sombre, regard d'or.
const LION = sphinx({ S: '#b3aea4', s: '#8f8a80', D: '#7d776c', G: '#9c968a', E: '#f5d63d' });

// Le Coucou de bronze : une grande horloge à coucou en bois, cadran crème, toit pointu ; l'oiseau de bronze jaillit de sa porte.
const COUCOU = fromLayers(
  [
    ['..WWWWW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['..WWWWW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['..WFFFW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['..WFKFW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['..WFFKW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['..WWWWW..', '..WWWWW..', '..WWWWW..', '..WWWWW..'],
    ['.BB.B.BB.', '..WBBBW..', '..WWWWW..', '..WWWWW..'],
    ['...BOB...', '..WBBBW..', '..WWWWW..', '..WWWWW..'],
    ['...EBE...', '..WBBBW..', '..WWWWW..', '..WWWWW..'],
    ['.RRRRRRR.', '.RRRRRRR.', '.RRRRRRR.', '.RRRRRRR.'],
    ['..RRRRR..', '..RRRRR..', '..RRRRR..', '..RRRRR..'],
    ['...RRR...', '...RRR...', '...RRR...', '...RRR...'],
    ['.........', '....B....', '....B....', '.........'],
  ],
  { W: '#6f4d2a', F: '#f4ecd6', K: '#2a2018', B: '#b0793a', O: '#e0a33a', E: '#1f1a16', R: '#4a3020' },
);

// La Reine du marché : une reine en robe rouge bordée d'hermine, couronne d'or, un sceptre à la main.
const REINE = fromLayers(
  [
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['.........', '...K.K...', '...K.K...', '.........'],
    ['..RRRRR.G', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..RRRRR.G', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..RRRRR.G', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..RRRRR.G', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..RRRRRRG', '.RRRRRRR.', '.RRRRRRR.', '..RRRRR..'],
    ['..WKWKW.G', '.WWWWWWW.', '.WWWWWWW.', '..WWWWW..'],
    ['...SsS..Y', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['...KSK...', '..SSSSS..', '..SSSSS..', '...SSS...'],
    ['...SSS...', '..HHHHH..', '..HHHHH..', '...HHH...'],
    ['..YYYYY..', '..Y...Y..', '..Y...Y..', '..YYYYY..'],
    ['..Y.Y.Y..', '.........', '.........', '..Y.Y.Y..'],
  ],
  { R: '#b0303a', W: '#f4f1e4', K: '#1f1a16', S: '#e8b98a', s: '#c98a6a', H: '#6b4a2e', Y: '#f2c944', G: '#e0a33a' },
);

// Le Spectre du manoir : un grand drap blanc qui flotte, bas ondulé, bras tendus, deux yeux noirs et une bouche ronde.
const SPECTRE = fromLayers(
  [
    ['.W.W.W.W.', 'W.W.W.W.W', 'W.W.W.W.W', '.W.W.W.W.'],
    ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WwwwwwW.'],
    ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WwwwwwW.'],
    ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['WWWWWWWWW', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['.WWWOWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['.WWWWWWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['.WKKWKKW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['.WKKWKKW.', 'WWWWWWWWW', 'WWWWWWWWW', '.WWWWWWW.'],
    ['..WWWWW..', '.WWWWWWW.', '.WWWWWWW.', '..WWWWW..'],
    ['...WWW...', '..WWWWW..', '..WWWWW..', '...WWW...'],
    ['.........', '...WWW...', '...WWW...', '.........'],
  ],
  { W: '#eef2f6', w: '#c8d0da', K: '#1f1a16', O: '#3a3a46' },
);

// Le Masque : un grand masque de théâtre blanc et or qui flotte, yeux noirs en amande, large sourire, rubans pourpres.
const MASQUE = fromLayers(
  [
    ['.........', '.........', '..PP.PP..', '.........'],
    ['...WWW...', '..WWWWW..', '..PWWWP..', '.........'],
    ['..WWWWW..', '.WWWWWWW.', '.PWWWWWP.', '.........'],
    ['.WKKKKKW.', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['.WWKKKWW.', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['WWWWWWWWW', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['WWWWYWWWW', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['WKKWWWKKW', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['WWKWWWKWW', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['YWWWWWWWY', 'WWWWWWWWW', 'WWWWWWWWW', '.........'],
    ['.YWWWWWY.', '.WWWWWWW.', '.WWWWWWW.', '.........'],
    ['..YYYYY..', '..YYYYY..', '..YYYYY..', '.........'],
  ],
  { W: '#f4f1e4', K: '#1f1a16', Y: '#e0a33a', P: '#7a1f3a' },
);

// La Locomotive de fer : une locomotive à vapeur noire, chaudière ronde, grosses roues rouges, cheminée et panache blanc.
const LOCOMOTIVE = fromLayers(
  [
    ['.R.R.R.R.', '.R.R.R.R.', '.R.R.R.R.', '.R.R.R.R.', '.R.R.R.R.'],
    ['.RKRKRKR.', 'KKKKKKKKK', 'KKKKKKKKK', 'KKKKKKKKK', '.RKRKRKR.'],
    ['.KKKKKKK.', 'KKKKKKKKK', 'KKKKKKKKK', 'KKKKKKKKK', '.KKKKKKK.'],
    ['.KYKKKYK.', 'KKKKKKKKK', 'KKKKKKKKK', 'KKKKKKKKK', '.KKKKKKK.'],
    ['.KKKLKKK.', 'KKKKKKKKK', 'KKKKKKKKK', 'KCCCCCCCK', '.KCCCCCK.'],
    ['..KKKKK..', '.KKKKKKK.', '.KKKKKKK.', 'KCCCCCCCK', '.KCCCCCK.'],
    ['...KKK...', '..KKKKK..', '..KKKKK..', 'KCCCCCCCK', '.KCCCCCK.'],
    ['.........', '...KKK...', '.........', 'KKKKKKKKK', '.KKKKKKK.'],
    ['.........', '...KKK...', '.........', '.........', '.........'],
    ['.........', '...KKK...', '.........', '.........', '.........'],
    ['.........', '..SSSSS..', '...SSS...', '.........', '.........'],
    ['.........', '.SSSSSSS.', '..SSSSS..', '.........', '.........'],
    ['.........', '..SSSSS..', '...SSS...', '.........', '.........'],
  ],
  { K: '#2a2622', R: '#c0392b', Y: '#f2c944', L: '#fff4a0', C: '#6f4d2a', S: '#f4f8fb' },
);

// La Grande Antenne : un grand poste de radio d'acier, grille de haut-parleur pour bouche, deux cadrans jaunes pour yeux,
// et son mât en treillis surmonté d'un voyant rouge.
const ANTENNE = fromLayers(
  [
    ['.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.GKGKGKG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.GKGKGKG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.GEGGGEG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.', '.GGGGGGG.'],
    ['.........', '....M....', '....M....', '.........'],
    ['.........', '....M....', '....M....', '.........'],
    ['.........', '..MMMMM..', '....M....', '.........'],
    ['.........', '....M....', '....M....', '.........'],
    ['.........', '...MMM...', '....M....', '.........'],
    ['.........', '....M....', '.........', '.........'],
    ['.........', '....R....', '.........', '.........'],
  ],
  { G: '#6e7680', K: '#2a2622', E: '#f5d63d', M: '#9aa4ae', R: '#ff4a3a' },
);

// Le Dragon gallois : le dragon rouge du pays de Galles, ventre doré, ailes pourpres.
const DRAGON_G = dragon({ C: '#c0392b', O: '#f2c944', W: '#8a1f1f', R: '#f6f1e6', M: '#4a0e0e', H: '#f4f1e4' });

// La Diligence de cuivre : une diligence de cuivre vue de face, quatre roues sombres, deux lanternes pour yeux, une
// grille pour bouche ; des bagages sur l'impériale, le siège du cocher et sa boussole de laiton, l'aiguille rouge.
const DILIGENCE = fromLayers(
  [
    ['K.......K', 'K.......K', '.........', 'K.......K', 'K.......K'],
    ['K.......K', 'KcccccccK', '.ccccccc.', 'KcccccccK', 'K.......K'],
    ['KCCCCCCCK', 'KCCCCCCCK', '.CCCCCCC.', 'KCCCCCCCK', 'KCCCCCCCK'],
    ['.CCMMMCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.'],
    ['.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.'],
    ['.CECCCEC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.'],
    ['.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.', '.CCCCCCC.'],
    ['ccccccccc', 'ccccccccc', 'ccccccccc', 'ccccccccc', 'ccccccccc'],
    ['..LLLLL..', '..LLLLL..', '..RRRRR..', '..RRRRR..', '.........'],
    ['.........', '..LLLLL..', '..RRRRR..', '.........', '.........'],
    ['....B....', '.........', '.........', '.........', '.........'],
    ['...BNB...', '.........', '.........', '.........', '.........'],
  ],
  { C: '#b87333', c: '#8a5226', K: '#2a2622', E: '#f5d63d', M: '#1f1a16', R: '#6f4d2a', L: '#4a3a2a', B: '#c9a24a', N: '#c0392b' },
);

// Le Soleil de cuivre (DA, LV2-4) : un corps carré de cuivre, huit rayons droits d'un cube (les quatre droits, et les
// quatre en biais, en marches), deux yeux en cubes, sans bouche, ni couronne, ni moustache. Sans pied (il faisait des
// jambes) : posé sur une dalle pleine d'un cube, sous le corps ; les rayons du bas en biais ne touchent pas le sol.
const SOLEIL = fromLayers(
  [
    ['..ccccc..', '..ccccc..', '..ccccc..'],
    ['.........', 'C...C...C', '.........'],
    ['.........', '.C..C..C.', '.........'],
    ['..CCCCC..', '..ccccc..', '..ccccc..'],
    ['..CCCCC..', '..ccccc..', '..ccccc..'],
    ['..CCCCC..', 'CCcccccCC', '..ccccc..'],
    ['..CKCKC..', '..ccccc..', '..ccccc..'],
    ['..CCCCC..', '..ccccc..', '..ccccc..'],
    ['.........', '.C..C..C.', '.........'],
    ['.........', 'C...C...C', '.........'],
  ],
  { C: '#b87333', c: '#8a5226', K: '#2a2622' },
);

/**
 * Les ailes du Papillon de cuivre, de face (x de gauche à droite, z de bas en haut ; `#` : une case d'aile) : l'aile
 * droite, à partir de la colonne voisine du corps. L'aile du haut, plus grande, monte en marches vers le dehors (le V se
 * lit par son bord supérieur) ; une rangée vide la sépare de l'aile du bas, plus petite.
 */
const AILE_DU_PAPILLON = [
  // z = 9 à 1 (de haut en bas) : le bord du haut monte en marches vers le dehors (un V, pas un U) ; en haut, l'aile touche
  // la pointe de l'antenne, sans cube vide entre elles (moins de pointes, pas de chandelier) ; un cube vide de chaque côté
  // de la tête (DA et consultant Blocland, retouches LV2-5).
  '..###',
  '..###',
  '..###',
  '.####',
  '#####',
  '.....',
  '###..',
  '###..',
  '##...',
];

/**
 * Le Papillon de cuivre (DA et consultant Blocland, LV2-5) : deux paires d'ailes pleines d'un cube d'épaisseur, le bord
 * de cuivre clair #b87333, l'intérieur de cuivre sombre #8a5226, un cube vide entre les deux paires ; le corps en colonne,
 * la tête de trois cubes (deux yeux sombres, sans bouche), deux antennes de deux cubes en marche ; posé sur un cube plein.
 * Ni motif orange et noir, ni nervures en rayons ; il ne vole pas : sa seule animation est la respiration commune.
 */
const PAPILLON: CubeDeModele[] = (() => {
  const [BORD, DEDANS, YEUX] = ['#b87333', '#8a5226', '#2a2622'];
  const out: CubeDeModele[] = [];
  const milieu = 5;
  const aile = new Set<string>();
  AILE_DU_PAPILLON.forEach((ligne, i) => [...ligne].forEach((ch, k) => ch === '#' && aile.add(`${k},${AILE_DU_PAPILLON.length - i}`)));
  const estAile = (k: number, z: number) => aile.has(`${k},${z}`);
  for (const cle of aile) {
    const [k, z] = cle.split(',').map(Number);
    // Le bord : une case d'aile dont une voisine (dans le plan de l'aile) n'est pas de l'aile, côté corps excepté.
    const bord = [
      [k + 1, z],
      [k, z + 1],
      [k, z - 1],
    ].some(([a, b]) => !estAile(a, b)) || (k > 0 && !estAile(k - 1, z));
    for (const c of [-1, 1]) out.push({ x: milieu + c * (k + 1), y: 1, z, color: bord ? BORD : DEDANS });
  }
  // Le cube plein qui le porte, le corps en colonne, la tête de trois cubes (les yeux aux deux bouts), les antennes.
  // Tout dans le même plan, d'un cube d'épaisseur, comme les ailes.
  out.push({ x: milieu, y: 1, z: 0, color: DEDANS });
  for (let z = 1; z <= 6; z++) out.push({ x: milieu, y: 1, z, color: BORD });
  out.push({ x: milieu - 1, y: 1, z: 7, color: YEUX }, { x: milieu, y: 1, z: 7, color: BORD }, { x: milieu + 1, y: 1, z: 7, color: YEUX });
  for (const c of [-1, 1]) out.push({ x: milieu + c, y: 1, z: 8, color: DEDANS }, { x: milieu + 2 * c, y: 1, z: 9, color: DEDANS });
  return out;
})();

// L'Amphore peinte (DA, HG-2) : une amphore de terre cuite sur un pied étroit, la panse large, l'épaule, le col et sa
// lèvre, deux anses de l'épaule au haut du col, détachées du col par un vide d'un cube, pour qu'elle se lise de face
// comme une amphore et pas comme un tonneau ; des bandes peintes, sombres et ocre, d'un rang chacune ; deux yeux ocre
// dans la bande sombre de la panse. Trois couleurs. Elle se rallume comme les autres, du pied vers le col (GD-8 ; le DA
// n'a pas retenu l'exception, 6 octobre 2026).
const AMPHORE = fromLayers(
  [
    ['.......', '..TTT..', '..TTT..', '..TTT..', '.......'],
    ['.......', '..KKK..', '..KKK..', '..KKK..', '.......'],
    ['..TTT..', '.TTTTT.', '.TTTTT.', '.TTTTT.', '..TTT..'],
    ['.OOOOO.', 'OOOOOOO', 'OOOOOOO', 'OOOOOOO', '.OOOOO.'],
    ['.TTTTT.', 'TTTTTTT', 'TTTTTTT', 'TTTTTTT', '.TTTTT.'],
    ['.KOKOK.', 'KKKKKKK', 'KKKKKKK', 'KKKKKKK', '.KKKKK.'],
    ['.TTTTT.', 'TTTTTTT', 'TTTTTTT', 'TTTTTTT', '.TTTTT.'],
    ['..TTT..', '.TTTTT.', 'TTTTTTT', '.TTTTT.', '..TTT..'],
    ['.......', '..OOO..', 'T.OOO.T', '..OOO..', '.......'],
    ['.......', '..TTT..', 'T.TTT.T', '..TTT..', '.......'],
    ['.......', '..TTT..', 'TTTTTTT', '..TTT..', '.......'],
    ['.......', '..KKK..', '.KK.KK.', '..KKK..', '.......'],
  ],
  { T: '#b5653a', K: '#2e2622', O: '#d9a441' },
);

// Le Castor de glaise (DA, HG-2) : un castor assis, de glaise ocre, la queue en dalle plate posée derrière lui, deux dents
// blanches sous le museau, la truffe et les yeux sombres, deux petites oreilles. Trois couleurs.
const CASTOR = fromLayers(
  [
    ['.......', '.AA.AA.', '.AAAAA.', '.AAAAA.', '..AAA..', '.AAAAA.', '.AAAAA.', '..AAA..'],
    ['.......', '.AAAAA.', 'AAAAAAA', 'AAAAAAA', '.AAAAA.'],
    ['.......', '.AAAAA.', 'AAAAAAA', 'AAAAAAA', '.AAAAA.'],
    ['.......', '.AAAAA.', 'AAAAAAA', 'AAAAAAA', '.AAAAA.'],
    ['.......', '.AAAAA.', '.AAAAA.', '.AAAAA.', '..AAA..'],
    ['..W.W..', '.AAAAA.', '.AAAAA.', '.AAAAA.', '..AAA..'],
    ['..AKA..', '.AAAAA.', '.AAAAA.', '.AAAAA.', '.......'],
    ['.......', '.AKAKA.', '.AAAAA.', '.AAAAA.', '.......'],
    ['.......', '..AAA..', '.AAAAA.', '..AAA..', '.......'],
    ['.......', '.......', '.A...A.', '.......', '.......'],
  ],
  { A: '#b07a48', W: '#f6f1e6', K: '#2a2622' },
);

// Le Griffon d'émail (DA, HG-3) : un griffon assis, corps de lion et tête d'aigle, d'émail bleu, le bec d'or, les yeux
// sombres, deux aigrettes sur la tête, une touffe d'or au bout de la queue ; ses deux ailes d'or levées s'ouvrent en V
// de part et d'autre du dos, jusqu'aux bords de ses neuf cubes de large, et reculent en montant (DA, relecture des
// planches : de loin, plus un obélisque). Trois couleurs.
const GRIFFON = fromLayers(
  [
    ['.........', '...B.B...', '.........', '..BB.BB..', '.........', '.........'],
    ['.........', '...B.B...', '..BBBBB..', '..BBBBB..', '..BBBBB..', '.........'],
    ['.........', '..BBBBB..', '..BBBBB..', '..BBBBB..', '..BBBBB..', '....B....'],
    ['.........', '..BBBBB..', '..BBBBB..', '..BBBBB..', '...BBB...', '....B....'],
    ['.........', '...BBB...', '.GBBBBBG.', '.GBBBBBG.', '.........', '....G....'],
    ['.........', '...BBB...', 'GG.BBB.GG', 'GG.....GG', '.........', '.........'],
    ['.........', '...BBB...', '...BBB...', 'GG.....GG', 'G.......G', '.........'],
    ['....G....', '...KBK...', '...BBB...', 'G.......G', 'G.......G', '.........'],
    ['.........', '...BBB...', '...BBB...', '.........', 'G.......G', '.........'],
    ['.........', '.........', '...B.B...', '.........', '.........', '.........'],
  ],
  { B: '#3a6ea8', G: '#d9a441', K: '#1f1a16' },
);

// La Libellule de jade (DA, HG-3) : une libellule posée à l'horizontale sur un roseau, la tête aux deux gros yeux sombres
// devant, le thorax, la longue queue derrière ; ses deux paires d'ailes claires étendues à plat sur neuf cubes de large
// (DA, relecture des planches : plus debout sur la pointe de sa queue) ; le roseau a une feuille en biais. Quatre
// couleurs, le roseau compris.
const LIBELLULE = fromLayers(
  [
    ['.........', '....R....', '.........', '.........', '.........', '.........', '.........'],
    ['.........', '....R....', '.........', '.........', '.........', '.........', '.........'],
    ['.........', '....RR...', '.........', '.........', '.........', '.........', '.........'],
    ['.........', '....R.R..', '.........', '.........', '.........', '.........', '.........'],
    ['.........', '....R....', '.........', '.........', '.........', '.........', '.........'],
    ['.........', '....R....', '.........', '.........', '.........', '.........', '.........'],
    ['...JJJ...', '...JJJ...', '....J....', '....J....', '....J....', '....J....', '....J....'],
    ['...K.K...', 'AAAAJAAAA', '.AAAJAAA.', '.........', '.........', '.........', '.........'],
  ],
  { J: '#4fa07a', A: '#cfe8dc', K: '#1f1a16', R: '#7a8a4a' },
);

// Le Paon de faïence (DA, HG-3 ; aucun symbole national) : un paon debout, de faïence bleue et blanche, sa roue
// déployée derrière lui, semée d'yeux d'or ; le bec et la petite crête d'or. Trois couleurs.
const PAON = fromLayers(
  [
    ['.......', '..F.F..', '.......', '...F...'],
    ['.......', '..FFF..', '..FFF..', '..FFF..'],
    ['.......', '..FWF..', '..FFF..', '.FWFWF.'],
    ['.......', '...F...', '..FFF..', 'FOFWFOF'],
    ['.......', '...F...', '.......', 'WFWOWFW'],
    ['...O...', '..FFF..', '.......', 'FOFWFOF'],
    ['.......', '..WFW..', '.......', 'WFWOWFW'],
    ['.......', '...O...', '.......', '.FOFOF.'],
    ['.......', '.......', '.......', '..WFW..'],
  ],
  { F: '#2f5f9e', W: '#f2efe6', O: '#d9a441' },
);

// Le Poulpe de corail (DA, HG-3) : un poulpe de corail posé sur ses bras, qui s'étalent tout autour au sol, leurs bouts
// clairs ; la tête ronde dressée, deux yeux sombres sur le devant. Trois couleurs.
const POULPE = fromLayers(
  [
    ['C.C.C.C', '.......', 'C.....C', '.......', 'C.C.C.C'],
    ['.CPCPC.', 'CC...CC', '.C...C.', 'CC...CC', '.CCCCC.'],
    ['.......', '.CCCCC.', '.CCCCC.', '.CCCCC.', '.......'],
    ['.......', '.CKCKC.', '.CCCCC.', '.CCCCC.', '.......'],
    ['.......', '.CCCCC.', '.CCCCC.', '.CCCCC.', '.......'],
    ['.......', '..CCC..', '.CCCCC.', '..CCC..', '.......'],
    ['.......', '.......', '..CCC..', '..CCC..', '.......'],
    ['.......', '.......', '...C...', '.......', '.......'],
  ],
  { C: '#e0705a', P: '#f2b8a0', K: '#1f1a16' },
);

// La Colombe d'albâtre (DA, HG-3 ; aucune arme) : une colombe posée, d'albâtre, les ailes repliées, la queue relevée
// derrière. Sa tête, plus étroite que le corps, en sort vers l'avant ; le bec d'un cube, gris rosé, sur un côté de la
// tête, les yeux sur ses côtés, dans sa moitié avant (de face, plus de masque, DA). Le rameau, court, d'un seul côté du
// bec et à sa hauteur : une tige d'un cube, deux feuilles, rien sous la poitrine (DA, relecture des planches, HG-3).
// Rallumée, le rameau est vert. Dans le monde, elle se tourne de trois quarts de tour (`QUARTS_DE_TOUR_DU_GARDIEN`) :
// la caméra du Kiosque la voit de flanc, l'œil et le rameau de son côté.
const COLOMBE = fromLayers(
  [
    ['........', '........', '........', '...B.B..', '........', '........', '........'],
    ['........', '........', '..AAA...', '.AAAAA..', '.AAAAA..', '..AAA...', '........'],
    ['........', '........', '.AAAAA..', '.AAAAA..', '.AAAAA..', '.AAAAA..', '..AAA...'],
    ['........', '........', '.AAAAA..', '.AAAAA..', '.AAAAA..', '..AAA...', '..AAA...'],
    ['........', '........', '..AAA...', '.AAAAA..', '..AAA...', '........', '...A....'],
    ['......V.', '..AAA...', '..AAA...', '........', '........', '........', '........'],
    ['....BTV.', '..KAK...', '..AAA...', '........', '........', '........', '........'],
    ['........', '..AAA...', '..AAA...', '........', '........', '........', '........'],
  ],
  { A: '#ece8de', B: '#c9a69a', K: '#1f1a16', V: '#5a9a3e', T: '#4f7a34' },
);

// Le Cerf de lauze (DA, HG-3) : un cerf debout sur quatre pattes fines aux sabots sombres, rallumé au pelage fauve, la
// gorge crème ; le cou court, la tête levée, le museau qui avance, deux oreilles ; ses bois de lauze sombre montent en V,
// en escalier, un andouiller vers l'avant de chaque côté (DA, relecture des planches : plus un lama). Quatre couleurs.
const CERF = fromLayers(
  [
    ['.......', '.......', '..D.D..', '.......', '.......', '..D.D..', '.......'],
    ['.......', '.......', '..L.L..', '.......', '.......', '..L.L..', '.......'],
    ['.......', '.......', '..L.L..', '.......', '.......', '..L.L..', '.......'],
    ['.......', '.......', '..LLL..', '..LLL..', '..LLL..', '..LLL..', '...L...'],
    ['.......', '.......', '..LLL..', '..LLL..', '..LLL..', '..LLL..', '.......'],
    ['.......', '.......', '..LCL..', '.......', '.......', '.......', '.......'],
    ['...K...', '...L...', '..LLL..', '.......', '.......', '.......', '.......'],
    ['.......', '.......', '.LKLKL.', '.......', '.......', '.......', '.......'],
    ['.......', '.......', '..D.D..', '.......', '.......', '.......', '.......'],
    ['.......', '.......', '.D...D.', '.......', '.......', '.......', '.......'],
    ['.......', '.D...D.', 'D.....D', '.......', '.......', '.......', '.......'],
    ['.......', '.......', 'D.....D', '.......', '.......', '.......', '.......'],
  ],
  { L: '#c98f3c', C: '#f0e2c0', D: '#4e4a42', K: '#1f1a16' },
);

export const GUARDIAN_CUBES: Record<BiomeId, CubeDeModele[]> = {
  'french-6e-phonology': GRAND_CHENE,
  'french-6e-letter-confusion': GOLEM,
  'french-6e-word-spelling': DUNE,
  'french-6e-grammar-spelling': TAUREAU,
  'french-6e-reading': CHOUETTE,
  'maths-6e-calculation': HANNETON,
  'maths-6e-fractions': BROCHET,
  'maths-6e-decimals': DRAGON,
  'maths-5e-signed-numbers': MAMMOUTH,
  'maths-5e-proportionality': COLPORTEUR,
  'french-5e-homophones': SPHINX,
  'french-5e-conjugation': HYDRE,
  'maths-4e-powers': TITAN,
  'maths-4e-algebra': GOLEM_EQ,
  'french-4e-agreement': BELIER,
  'french-4e-vocabulary': HIBOU,
  'maths-3e-geometry': SPHINX_M,
  'maths-3e-statistics': COMPTABLE,
  'maths-3e-functions': DRAGON_L,
  'french-3e-close-reading': LECTEUR,
  'english-6e-vocabulary': LION,
  'english-6e-grammar': COUCOU,
  'history-6e-antiquity': AMPHORE,
  'geography-6e-living': CASTOR,
  'history-5e-middle-ages': GRIFFON,
  'geography-5e-resources': LIBELLULE,
  'history-4e-revolutions': PAON,
  'geography-4e-globalization': POULPE,
  'history-3e-twentieth-century': COLOMBE,
  'geography-3e-france': CERF,
  'english-5e-vocabulary': REINE,
  'english-5e-grammar': SPECTRE,
  'lv2-5e-introductions': DILIGENCE,
  'lv2-4e-daily-life': SOLEIL,
  'english-4e-comprehension': MASQUE,
  'english-4e-grammar': LOCOMOTIVE,
  'english-3e-comprehension': ANTENNE,
  'english-3e-grammar': DRAGON_G,
  'lv2-3e-travel': PAPILLON,
};
