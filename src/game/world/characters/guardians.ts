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
const CERF_DE_LAUZE = fromLayers(
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

// Le Cerf des sous-bois (DA, SC-2) : debout, de profil, de la taille du Taureau ; brun roux, le ventre crème, la mousse
// verte sur le dos et au bout des bois ; les bois ramifiés, trois pointes de chaque côté, au-dessus de la tête. Quatre
// couleurs, les yeux sombres compris.
const CERF = fromLayers(
  [
    ['.R....R...', '..........', '..........', '.R....R...'],
    ['.R....R...', '..........', '..........', '.R....R...'],
    ['RCCCCCCR..', 'RCCCCCCR..', 'RCCCCCCR..', 'RCCCCCCR..'],
    ['RRRRRRRR..', 'RRRRRRRR..', 'RRRRRRRR..', 'RRRRRRRR..'],
    ['RRRRRRRR..', 'MMMMMMRR..', 'MMMMMMRR..', 'RRRRRRRR..'],
    ['..........', '......RR..', '......RR..', '..........'],
    ['..........', '......RRRC', '......RRRC', '..........'],
    ['..........', '......RKR.', '......RKR.', '..........'],
    ['.......R..', '.......R..', '.......R..', '.......R..'],
    ['.....RRRRR', '..........', '..........', '.....RRRRR'],
    ['.....R.M.R', '..........', '..........', '.....R.M.R'],
  ],
  { R: '#9a5530', C: '#efe2c4', M: '#5e8a3a', K: '#1f1a16' },
);

// L'Alambic de verre (DA, SC-2) : un ballon presque incolore, des reflets blancs, le liquide bleu lavande dans sa moitié
// basse, posé sur un trépied de bois sombre ; son col monte, puis un long bec courbe descend dans un petit flacon.
// Aucune flamme. Quatre couleurs : les yeux reprennent le bois du trépied.
const ALAMBIC = fromLayers(
  [
    ['.B...B...', '.......LL', '.......LL', '.........', '...B.....'],
    ['.B...B...', '.......VV', '.......VV', '.........', '...B.....'],
    ['.BBBBB...', '.B...B...', '.B...B.V.', '.B...B...', '.BBBBB...'],
    ['.........', '..LLL....', '..LLL..V.', '..LLL....', '.........'],
    ['..LLL....', '.LLLLL...', '.LLLLL.V.', '.LLLLL...', '..LLL....'],
    ['..LLL....', '.LLLLL...', '.LLLLL.V.', '.LLLLL...', '..LLL....'],
    ['..BVB....', '.VVVVV...', '.VVVVV.V.', '.VVVVV...', '..VVV....'],
    ['..WVV....', '.VVVVV...', '.VVVVV.V.', '.VVVVV...', '..VVV....'],
    ['.........', '..VVV....', '..VVV..V.', '..VVV....', '.........'],
    ['.........', '.........', '...V..V..', '.........', '.........'],
    ['.........', '.........', '...VVV...', '.........', '.........'],
  ],
  { V: '#dfe9ee', W: '#ffffff', L: '#9c9ae0', B: '#4a3828' },
);

// L'Automate de laiton (DA, SC-2) : trapu, une tête-cube à deux hublots clairs, trois boutons clairs en colonne sur la
// poitrine, des rivets sombres aux coins, la grande clé de remontage dans le dos ; ni antenne ni visage-écran. Trois
// couleurs. Pour que la tête et les bras se lisent (retouche du DA sur captures, 6 octobre 2026) : un cou sombre d'un
// cube détache la tête du tronc, les bras pendent des épaules, décollés du tronc d'une case et tenus par une
// articulation sombre, et le laiton clair des hublots, des boutons et de la clé est éclairci pour trancher sur le tronc.
const AUTOMATE = fromLayers(
  [
    ['.........', '..AA.AA..', '..AA.AA..', '.........', '.........', '.........'],
    ['.........', '..AA.AA..', '..AA.AA..', '.........', '.........', '.........'],
    ['..SAEAS..', 'A.AAAAA.A', 'A.AAAAA.A', '..AAAAA..', '.........', '.........'],
    ['..AAEAA..', 'A.AAAAA.A', 'A.AAAAA.A', '..AAAAA..', '.........', '...EEE...'],
    ['..AAEAA..', 'A.AAAAA.A', 'A.AAAAA.A', '..AAAAA..', '....A....', '...E.E...'],
    ['..SAAAS..', 'ASAAAAASA', 'ASAAAAASA', '..AAAAA..', '.........', '...EEE...'],
    ['.........', '....S....', '....S....', '.........', '.........', '.........'],
    ['...AAA...', '...AAA...', '...AAA...', '.........', '.........', '.........'],
    ['...EAE...', '...AAA...', '...AAA...', '.........', '.........', '.........'],
    ['...SAS...', '...AAA...', '...AAA...', '.........', '.........', '.........'],
  ],
  { A: '#c9a43c', E: '#f3e09a', S: '#4a3c22' },
);

// La Tortue d'ocre (DA, SC-3) : une tortue terrestre géante debout sur ses quatre pattes, la tête levée au bout d'un cou
// en marches ; la carapace en dôme, en damier d'écailles : des carrés d'ocre de 2 × 2 dans une grille brune, vus d'en
// haut comme de face (retouche du DA et du consultant de Blocland : des bandes la faisaient tonneau). Le bas du dôme,
// brun, la cerne. La tête et les pattes olive. Quatre couleurs, les yeux compris.
const OCRE = '#c8913a';
const CERNE = '#7a5230';
/** Une case de la carapace : brune sur les lignes de la grille (tous les trois cubes, en x et en y) et au bas du dôme. */
const ecaille = (c: CubeDeModele): string => (c.z === 2 || c.x % 3 === 0 || (c.y - 2) % 3 === 0 ? CERNE : OCRE);
const TORTUE = fromLayers(
  [
    ['.........', '.........', 'VV.....VV', 'VV.....VV', '.........', '.........', 'VV.....VV', 'VV.....VV'],
    ['.........', '.........', 'VV.....VV', 'VV.....VV', '.........', '.........', 'VV.....VV', 'VV.....VV'],
    ['.........', '.........', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS'],
    ['.........', '....V....', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS', 'SSSSSSSSS'],
    ['.........', '....V....', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.', '.SSSSSSS.'],
    ['....V....', '.........', '.........', '..SSSSS..', '..SSSSS..', '..SSSSS..', '..SSSSS..', '..SSSSS..'],
    ['....V....', '.........', '.........', '.........', '...SSS...', '...SSS...', '...SSS...', '.........'],
    ['...VVV...', '...VVV...', '.........', '.........', '.........', '.........', '.........', '.........'],
    ['...KVK...', '...VVV...', '.........', '.........', '.........', '.........', '.........', '.........'],
  ],
  { S: OCRE, V: '#7d8a4a', K: '#1f1a16' },
).map((c) => (c.color === OCRE ? { ...c, color: ecaille(c) } : c));

// Le Flamant de sel (DA, SC-3) : debout sur une patte, l'autre repliée sous lui, le cou en S ; le corps rose pâle, les
// ailes rose vif sur ses flancs, leurs pointes relevées derrière ; le bec crème courbé vers le bas, son bout noir ; douze
// cubes de haut. Quatre couleurs, les yeux compris.
const FLAMANT = fromLayers(
  [
    ['.......', '.......', '.......', '....R..', '.......', '.......', '.......'],
    ['.......', '.......', '.......', '....R..', '.......', '.......', '.......'],
    ['.......', '.......', '.......', '....R..', '.......', '.......', '.......'],
    ['.......', '.......', '.......', '....R..', '.......', '....R..', '.......'],
    ['.......', '.......', '.......', '....R..', '....R..', '....R..', '.......'],
    ['.......', '.......', '..RPPPR', '..RPPPR', '..RPPPR', '..RPPPR', '.......'],
    ['.......', '.......', '..RPPPR', '..RPPPR', '..RPPPR', '..RPPPR', '....P..'],
    ['.......', '.......', '..RPPPR', '..RPPPR', '..RPPPR', '..RPPPR', '....P..'],
    ['.......', '....P..', '....P..', '.......', '.......', '...R.R.', '.......'],
    ['.......', '....P..', '....P..', '.......', '.......', '.......', '.......'],
    ['....K..', '.......', '....P..', '.......', '.......', '.......', '.......'],
    ['....C..', '...KPK.', '....P..', '.......', '.......', '.......', '.......'],
  ],
  { P: '#f0b8c0', R: '#e0607e', C: '#efe2c4', K: '#1f1a16' },
);

// Le Cheval à bascule (DA, SC-3) : de profil, ses patins courbes en marches ; la robe crème semée de taches rouges, la
// crinière et la queue brunes (le bois des patins), la selle bleue ; onze cubes de haut. Cinq couleurs, l'œil compris.
// Dans le monde, tourné de flanc vers la caméra de la Menuiserie (`QUARTS_DE_TOUR_DU_GARDIEN`), ses patins vus.
const CHEVAL_A_BASCULE = fromLayers(
  [
    ['..MMMMM..', '.........', '..MMMMM..'],
    ['.MW...WM.', '.........', '.MW...WM.'],
    ['M.W...W.M', '.........', 'M.W...W.M'],
    ['..W...W..', '.........', '..W...W..'],
    ['.WWWTWWW.', 'MWWWWWWW.', '.WWWTWWW.'],
    ['.WTTWWTW.', 'MWWWWWWW.', '.WTTWWTW.'],
    ['.WWTWTWW.', '.WWWWWWW.', '.WWTWTWW.'],
    ['...SS..W.', '...SS.MW.', '...SS..W.'],
    ['.......W.', '......MWW', '.......W.'],
    ['.......WW', '......MWW', '.......WW'],
    ['.......KW', '......MWW', '.......WW'],
  ],
  { W: '#efe2c4', T: '#c0463a', M: '#6b4a2e', S: '#3f6aa8', K: '#1f1a16' },
);

// La Girafe d'ambre (DA, SC-3) : debout, de profil, le cou de 2 × 2 en pile, onze cubes de haut, comme les plus grands
// des autres Gardiens (relecture des captures : à treize, sa tête et son cou emplissaient le premier plan de la vue de
// la Source) ; le fond crème semé de taches carrées d'ambre ; les sabots, la queue et les ossicônes brun sombre. Quatre
// couleurs, l'œil compris.
const GIRAFE = fromLayers(
  [
    ['.D..D...', '.D..D...'],
    ['.C..C...', '.C..C...'],
    ['.A..C...', '.A..C...'],
    ['.C..A...', '.C..A...'],
    ['DC..C...', '.C..C...'],
    ['CACCCA..', 'CACCCA..'],
    ['CCCACC..', 'CCCACC..'],
    ['....CA..', '....CA..'],
    ['....AC..', '....AC..'],
    ['....CCKC', '....CCCC'],
    ['....D...', '....D...'],
  ],
  { C: '#f0dcae', A: '#c8782a', D: '#4e3624', K: '#1f1a16' },
);

// La Cloche de cobalt (DA, SC-3) : une cloche bleu cobalt, ses reflets clairs et ses deux yeux, tenue par un anneau sous
// un portique de bois sombre (deux poteaux, une poutre) ; de la poutre, un fil de cuivre va à une petite lampe sur son
// poteau. La lampe, seule au rang du haut, prend la couleur des lanternes en dernier au rallumage (des pieds vers la
// tête, GD-8), sans lueur ajoutée. Aucun éclair, aucune corde qui pend ; neuf de large, onze de haut.
const CLOCHE = fromLayers(
  [
    ['.........', 'W.....W.W', '.........'],
    ['.........', 'W.....W.W', '.........'],
    ['.........', 'W.....W.W', '.........'],
    ['.BRBBB...', 'WBBBBBW.W', '.BBBBB...'],
    ['.BRBBB...', 'WBBBBBW.W', '.BBBBB...'],
    ['.BRBBB...', 'WBBBBBW.W', '.BBBBB...'],
    ['.RKBKB...', 'WBBBBBW.W', '.BBBBB...'],
    ['..BBB....', 'W.BBB.W.W', '..BBB....'],
    ['.........', 'W..W..W.W', '.........'],
    ['.........', 'WWWWWWWUW', '.........'],
    ['.........', '........L', '.........'],
  ],
  { B: '#2f5aa8', R: '#6f93d6', W: '#4a3828', U: '#c47a3c', L: '#ffd85c', K: '#1f1a16' },
);

// Le Grand-bi d'érable (DA, SC-3) : de profil, la grande roue avant en anneau de neuf cubes et ses rayons, la petite roue
// arrière ; les roues rouge érable, le cadre et les rayons brun sombre, la selle crème, deux yeux sur la plaque crème du
// guidon. Onze de haut ; onze de large (la grande roue et la petite, de profil), dans son îlot. Dans le monde, tourné de
// flanc vers la caméra du Bassin (`QUARTS_DE_TOUR_DU_GARDIEN`) : la grande roue et ses rayons de face.
const GRAND_BI = fromLayers(
  [
    ['...........', '..RRRRR.RRR', '...........'],
    ['...........', '.RR.D.RRRDR', '...........'],
    ['...........', 'RRD.D.DRRRR', '...........'],
    ['...........', 'R..DDD..RD.', '...........'],
    ['...........', 'RDDDDDDDRD.', '...........'],
    ['...........', 'R..DDD..D..', '...........'],
    ['...........', 'RRD.D.DRD..', '...........'],
    ['...........', '.RR.D.RD...', '...........'],
    ['...........', '..RRRRD....', '...........'],
    ['...........', '....DD.....', '...........'],
    ['.KCK.CC....', '..DDDCC....', '...D.CC....'],
  ],
  { R: '#b8452e', D: '#4a3424', C: '#efe2c4', K: '#1f1a16' },
);

// Le Dauphin de turquoise (DA, SC-3) : en bond, le corps arqué au-dessus d'un socle de rocher, la queue qui en part ; le
// dos turquoise, le ventre clair, l'aileron au sommet de l'arc. Quatre couleurs, l'œil compris.
const DAUPHIN = fromLayers(
  [
    ['..GGGGGG.', '..GGGGGG.', '..GGGGGG.'],
    ['..GGGGGG.', '..GGGGGG.', '..GGGGGG.'],
    ['...GGGGVT', '...GGGGVT', '...GGGG..'],
    ['.......V.', '.......V.', '.........'],
    ['......VTT', '......VTT', '.........'],
    ['VVV...V..', 'VVV...V..', '.........'],
    ['.KTVVVT..', '.TTVVVT..', '.........'],
    ['...TTT...', '...TTT...', '.........'],
    ['....T....', '....TT...', '.........'],
  ],
  { T: '#2fa5a0', V: '#cfeee8', G: '#8a8a80', K: '#1f1a16' },
);

// Le Kangourou de rubis (DA, SC-3) : assis sur sa queue, les grands pieds devant, les petites pattes de devant le long
// du ventre, les oreilles hautes ; roux rubis, le ventre et le dedans des oreilles crème, le museau et les pieds sombres.
// Jamais de gants de boxe, jamais en garde. Quatre couleurs, les yeux compris.
const KANGOUROU = fromLayers(
  [
    ['..NN.NN', '..NN.NN', '..NN.NN', '..NNRNN', '....R..', '....R..', '....R..', '....R..'],
    ['.......', '..RRRRR', '..RRRRR', '..RRRRR', '....R..', '....R..', '....R..', '.......'],
    ['.......', '..RCCCR', '..RRRRR', '..RRRRR', '.......', '.......', '.......', '.......'],
    ['.......', '..RCCCR', '..RRRRR', '..RRRRR', '.......', '.......', '.......', '.......'],
    ['...R.R.', '..RCCCR', '..RRRRR', '..RRRRR', '.......', '.......', '.......', '.......'],
    ['...R.R.', '..RCCCR', '..RRRRR', '..RRRRR', '.......', '.......', '.......', '.......'],
    ['.......', '..RRRRR', '..RRRRR', '..RRRRR', '.......', '.......', '.......', '.......'],
    ['...RNR.', '...RRR.', '...RRR.', '.......', '.......', '.......', '.......', '.......'],
    ['...KRK.', '...RRR.', '...RRR.', '.......', '.......', '.......', '.......', '.......'],
    ['...C.C.', '...R.R.', '.......', '.......', '.......', '.......', '.......', '.......'],
    ['.......', '...R.R.', '.......', '.......', '.......', '.......', '.......', '.......'],
  ],
  { R: '#a8402f', C: '#f0dcbc', N: '#4a2a20', K: '#1f1a16' },
);

// L'Abeille de topaze (DA, SC-3) : posée, de profil, sur six pattes ; les rayures topaze et brunes, deux paires d'ailes
// levées, leurs cases très claires, le gris seulement pour leur cerne (relecture des captures), deux antennes. Sans
// dard. Cinq couleurs, l'œil compris. Dans le monde, tournée de flanc vers la caméra de la Ruche
// (`QUARTS_DE_TOUR_DU_GARDIEN`).
const ABEILLE = fromLayers(
  [
    ['........', '..B.B.B.', '........', '..B.B.B.'],
    ['........', '.BTBTBTB', '.BTBTBTB', '.BTBTBTB'],
    ['........', 'BBTBTBTB', 'BBTBTBTB', 'BBTBTBTB'],
    ['........', 'KBTBTBTB', 'BBTBTBTB', 'BBTBTBTB'],
    ['........', 'BBAAAAA.', 'BB......', 'BBAAAAA.'],
    ['........', 'BGAAGAAG', '........', 'BGAAGAAG'],
    ['........', '.GAG.GAG', '........', '.GAG.GAG'],
    ['........', '..G...G.', '........', '..G...G.'],
  ],
  { T: '#e0a83a', B: '#5a3c1e', A: '#eef4f2', G: '#8e989c', K: '#1f1a16' },
);

// L'Hirondelle de nacre (EMC, 6e ; sans flamme, aucun symbole) : posée de profil sur une petite poutre, le long des x,
// la tête vers les x croissants (à gauche de l'écran, loin du nom de l'île, fiche du Gardien ouverte) ; le corps penché,
// la tête petite et ronde, sans rien sur ses côtés, l'œil sur le flanc de la tête, un bec d'un bloc qui dépasse devant ;
// les ailes repliées le long du dos, leur bord d'attaque plus clair, jusqu'au-dessus de la queue ; derrière, la queue
// en V, longue, ses deux brins qui s'écartent à plat : la caméra de l'île, haute, la voit de trois quarts. La nacre
// pâle du dos et des ailes, le ventre blanc, la gorge rose pâle, la pointe des ailes et des brins d'une nacre plus
// soutenue (DA, relecture des captures emc-2, passe 2 : de face, tête large et ailes ouvertes, elle se lisait comme un
// koala). Dix de long, cinq de large, huit de haut. Neuf couleurs, la poutre, les yeux et le bec compris.
const HIRONDELLE = fromLayers(
  [
    ['..........', '..........', '....SS....', '..........', '..........'],
    ['....SS....', '....SS....', '....SS....', '....SS....', '....SS....'],
    ['..........', '.....G....', '..........', '.....G....', '..........'],
    ['D.........', 'DNNNWWW...', '..NNWWW...', 'DNNNWWW...', 'D.........'],
    ['..DNN.....', '...NNWWW..', '...NNWWW..', '...NNWWW..', '..DNN.....'],
    ['....NNL...', '....NNWP..', '....NNWP..', '....NNWP..', '....NNL...'],
    ['.....LL...', '.....NNNP.', '.....NNNPB', '.....NNNP.', '.....LL...'],
    ['..........', '.......NE.', '.......NN.', '.......NE.', '..........'],
  ],
  {
    N: '#c8d3ee',
    L: '#eef2fb',
    W: '#fdfbf6',
    P: '#f2c2c8',
    D: '#8ea4d8',
    // L'œil, sur le flanc de la tête : sombre de côté, le dessus de nacre (vu d'en haut, la tête reste claire).
    E: { color: '#1f1a16', top: '#c8d3ee' },
    B: '#3a3a42',
    G: '#4a4a52',
    S: '#8a6236',
  },
);

// L'Oie d'opale (EMC, 5e ; sans flamme, aucun symbole) : de profil, le long des x, la tête vers les x croissants ;
// debout sur ses deux pattes, le corps ovale, la queue relevée derrière, le long cou dressé, la tête petite, le bec d'un
// bloc qui dépasse devant. L'opale : un blanc laiteux, et sur les ailes, le long des flancs, des plumes aux reflets rose
// et vert pâles, en alternance (ce sont elles qui se rallument). Neuf de long, cinq de large, neuf de haut. Six couleurs,
// les yeux compris (proposition de l'artiste technique 3D).
const OIE = fromLayers(
  [
    ['.........', '...FF....', '.........', '...FF....', '.........'],
    ['.........', '....F....', '.........', '....F....', '.........'],
    ['.........', '.OOOOOO..', '.OOOOOO..', '.OOOOOO..', '.........'],
    ['..OOOO...', 'OOOOOOO..', 'OOOOOOO..', 'OOOOOOO..', '..OOOO...'],
    ['.VPVPV...', '.OOOOOO..', 'OOOOOOO..', '.OOOOOO..', '.VPVPV...'],
    ['.........', '.........', '......O..', '.........', '.........'],
    ['.........', '.........', '......O..', '.........', '.........'],
    ['.........', '......E..', '......OOB', '......E..', '.........'],
    ['.........', '.........', '......OO.', '.........', '.........'],
  ],
  {
    O: '#eef2f4',
    V: '#cfe8da',
    P: '#f0d2de',
    B: '#e2b464',
    F: '#c88a4a',
    E: { color: '#1f1a16', top: '#eef2f4' },
  },
);

// Le Phénix d'argile (latin-grec, 5e ; sans flamme : il « renaît » en se rallumant, sans feu) : de profil, le long des
// x, la tête vers les x croissants ; un oiseau de terre cuite, comme sur un vase, posé dans son nid d'argile sombre ; les
// ailes repliées le long du corps, peintes de plumes noires et ocre en alternance (ce sont elles qui se rallument), la
// longue queue qui descend jusqu'au nid derrière, le cou court, la tête, son bec ocre et une petite huppe sombre couchée
// vers l'arrière. Aucune flamme, aucune pointe dressée. Dix de long, cinq de large, neuf de haut. Six couleurs, les yeux
// compris (proposition de l'artiste technique 3D).
const PHENIX = fromLayers(
  [
    ['..DDDD....', 'ODDDDDD...', '.DDDDDD...', 'ODDDDDD...', '..DDDD....'],
    ['..........', '.OAAAA....', '..AAAA....', '.OAAAA....', '..........'],
    ['..ONONO...', '..AAAAAA..', '..AAAAAA..', '..AAAAAA..', '..ONONO...'],
    ['...ONON...', '..AAAAAA..', '..AAAAAA..', '..AAAAAA..', '...ONON...'],
    ['..........', '......A...', '.....AAA..', '......A...', '..........'],
    ['..........', '..........', '......AA..', '..........', '..........'],
    ['..........', '.......E..', '......AAAO', '.......E..', '..........'],
    ['..........', '..........', '......AAA.', '..........', '..........'],
    ['..........', '..........', '.....DD...', '..........', '..........'],
  ],
  {
    A: '#c4703e',
    D: '#7e3e22',
    O: '#e2a466',
    N: '#2a1c16',
    E: { color: '#1f1a16', top: '#c4703e' },
  },
);

// Le Lynx d'agate (EMC, 4e ; sans flamme, aucun symbole ; vigilant, jamais menaçant) : assis, de profil, le long des
// x, la tête vers les x croissants ; les pattes de devant droites, les pattes claires ; la queue courte, son bout noir ;
// la tête haute, la collerette claire sur les joues, les oreilles à pinceaux noirs. L'agate : un ambre chaud, le
// ventre crème, et sur les flancs des taches en deux tons, brun et rouille, en alternance (ce sont elles qui se
// rallument). Neuf de long, cinq de large, dix de haut. Six couleurs, les yeux compris (proposition de l'artiste
// technique 3D).
const LYNX = fromLayers(
  [
    ['..AAA....', '..AAAAC..', '..AAAA...', '..AAAAC..', '..AAA....'],
    ['..TAU....', '..AAA.A..', '.DAAAA...', '..AAA.A..', '..UAT....'],
    ['...ATA...', '..AAAAA..', '..AAAAC..', '..AAAAA..', '...ATA...'],
    ['...UA....', '...AAAA..', '...AAAC..', '...AAAA..', '...AU....'],
    ['.........', '....AAA..', '....AAC..', '....AAA..', '.........'],
    ['......C..', '.....AAC.', '.....AACD', '.....AAC.', '......C..'],
    ['.........', '.....DAE.', '.....AAA.', '.....DAE.', '.........'],
    ['.........', '.....AA..', '.....AA..', '.....AA..', '.........'],
    ['.........', '.....A...', '.........', '.....A...', '.........'],
    ['.........', '.....D...', '.........', '.....D...', '.........'],
  ],
  {
    A: '#c8864a',
    C: '#efd9b4',
    T: '#6e3e22',
    U: '#b0502e',
    D: '#2a1e18',
    E: { color: '#1f1a16', top: '#c8864a' },
  },
);

// La Cigale d'argile (latin-grec, 4e ; sans flamme, aucun dieu ni symbole) : de profil, le long des x, la tête vers les
// x croissants, posée sur une souche sombre de quatre blocs ; une cigale de terre cuite, comme celles qu'on accroche aux murs : le corps
// ocre rouge, la large tête aux deux gros yeux sur les côtés, les ailes repliées en toit sur le dos, plus longues que
// le corps, d'une terre plus claire, leurs nervures plus sombres en alternance (ce sont elles qui se rallument). Dix de
// long, cinq de large, huit de haut (la souche la hausse : son habitant, Figue, en a neuf, GD-11). Cinq couleurs, les yeux compris (proposition de l'artiste technique 3D).
const CIGALE = fromLayers(
  [
    ['..........', '...DDD....', '...DDD....', '...DDD....', '..........'],
    ['..........', '...DDD....', '...DDD....', '...DDD....', '..........'],
    ['..........', '...DDD....', '...DDD....', '...DDD....', '..........'],
    ['..........', '..DDDDD...', '...DDD....', '..DDDDD...', '..........'],
    ['.......E..', '.AAAAAAAA.', '.AAAAAAAAA', '.AAAAAAAA.', '.......E..'],
    ['WVWVWV.E..', 'WAAAAAAA..', '.AAAAAAAA.', 'WAAAAAAA..', 'WVWVWV.E..'],
    ['..........', 'WVWVWVW...', '.WWWWWWAA.', 'WVWVWVW...', '..........'],
    ['..........', '..........', 'VWVWVWV...', '..........', '..........'],
  ],
  {
    A: '#c4703e',
    W: '#e2a466',
    V: '#9a5030',
    D: '#5a3a24',
    E: { color: '#2a1c16', top: '#c4703e' },
  },
);

// L'Étourneau d'étain (EMC, 3e ; sans flamme, aucun symbole) : perché sur une souche sombre de trois blocs, de profil, le
// bec jaune vers les x croissants ; le corps gris d'étain, les ailes plus sombres, la queue courte. Sur le dos, les plumes
// en damier, sombres et claires (ce sont elles qui se rallument). Neuf de long, cinq de large, neuf de haut. Neuf
// couleurs, les yeux compris (proposition de l'artiste technique 3D).
const ETOURNEAU = fromLayers(
  [
    ['.........', '...DDD...', '...DDD...', '...DDD...', '.........'],
    ['.........', '...DDD...', '...DDD...', '...DDD...', '.........'],
    ['.........', '...DDD...', '...DDD...', '...DDD...', '.........'],
    ['.........', '....L....', '.........', '....L....', '.........'],
    ['.........', '..SSSSS..', '.TSSSSS..', '..SSSSS..', '.........'],
    ['.........', '..WWWWS..', 'TTSSSSS..', '..WWWWS..', '.........'],
    ['.........', '..PQPQSS.', '..QPQPSS.', '..PQPQSS.', '.........'],
    ['.........', '......SE.', '......SSB', '......SE.', '.........'],
    ['.........', '.........', '......SS.', '.........', '.........'],
  ],
  {
    S: '#9aa2aa',
    W: '#4a5058',
    P: '#5c6672',
    Q: '#d0d6dc',
    T: '#3a3e46',
    B: '#e0b030',
    L: '#c07060',
    D: '#5a3a24',
    E: { color: '#1f1a16', top: '#9aa2aa' },
  },
);

// Le Centaure d'argile (latin-grec, 3e ; sans flamme, aucun dieu, aucune arme : ni arc ni lance) : de profil, la tête
// vers les x croissants ; le corps de cheval et le buste de terre cuite, les sabots sombres, la queue et les cheveux
// d'une terre plus foncée ; il tient devant lui un livre ouvert, la couverture de cuir, les pages claires dessus. Sur ses
// flancs, des motifs d'une terre plus claire, en alternance (ce sont eux qui se rallument). Neuf de long, cinq de
// large, dix de haut. Six couleurs, les yeux compris (proposition de l'artiste technique 3D).
const CENTAURE = fromLayers(
  [
    ['.........', '.H...H...', '.........', '.H...H...', '.........'],
    ['.........', '.A...A...', '.........', '.A...A...', '.........'],
    ['.........', '.A...A...', 'R........', '.A...A...', '.........'],
    ['.........', '.AAAAAA..', 'RAAAAAA..', '.AAAAAA..', '.........'],
    ['.........', '.MAMAMA..', 'RAAAAAA..', '.MAMAMA..', '.........'],
    ['.........', '.....AA..', '.....AA..', '.....AA..', '.........'],
    ['.........', '.....AAK.', '.....AAK.', '.....AAK.', '.........'],
    ['.........', '.....AA..', '.....AA..', '.....AA..', '.........'],
    ['.........', '.....AE..', '.....AA..', '.....AE..', '.........'],
    ['.........', '.....RR..', '.....RR..', '.....RR..', '.........'],
  ],
  {
    A: '#c4703e',
    M: '#e2a466',
    H: '#5a3a24',
    R: '#9a5030',
    // Le livre : la couverture de cuir de face, les pages claires dessus.
    K: { color: '#7a4a2a', top: '#f2ead8' },
    E: { color: '#2a1c16', top: '#c4703e' },
  },
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
  'geography-3e-france': CERF_DE_LAUZE,
  'life-earth-sciences-6e-living-world': CERF,
  'physics-chemistry-6e-matter-energy': ALAMBIC,
  'technology-6e-objects': AUTOMATE,
  'civics-6e-democratic-society': HIRONDELLE,
  'life-earth-sciences-5e-active-planet': TORTUE,
  'physics-chemistry-5e-matter-universe': FLAMANT,
  'technology-5e-design': CHEVAL_A_BASCULE,
  'civics-5e-equality-solidarity': OIE,
  'life-earth-sciences-4e-cells-evolution': GIRAFE,
  'physics-chemistry-4e-signals-circuits': CLOCHE,
  'technology-4e-modeling': GRAND_BI,
  'civics-4e-rights-freedoms': LYNX,
  'civics-3e-democratic-life': ETOURNEAU,
  'life-earth-sciences-3e-human-body': DAUPHIN,
  'physics-chemistry-3e-motion-energy': KANGOUROU,
  'technology-3e-digital': ABEILLE,
  'english-5e-vocabulary': REINE,
  'english-5e-grammar': SPECTRE,
  'lv2-5e-introductions': DILIGENCE,
  'lv2-4e-daily-life': SOLEIL,
  'english-4e-comprehension': MASQUE,
  'english-4e-grammar': LOCOMOTIVE,
  'english-3e-comprehension': ANTENNE,
  'english-3e-grammar': DRAGON_G,
  'lv2-3e-travel': PAPILLON,
  'lca-5e-legends': PHENIX,
  'lca-4e-cities': CIGALE,
  'lca-3e-ideas': CENTAURE,
};
