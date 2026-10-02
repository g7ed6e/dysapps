// Créatures originales de Blocland, dessinées en cubes. Module pur : les vues (SVG, 3D, 2D, monde) les lisent.
import type { BiomeId } from '../../biomes';
import { fromLayers, type CubeDeModele } from './ascii';

// Mousso : un golem de mousse trapu, ventre de pierre, deux grands yeux, un sourire clair, une fleur sur la tête.
// Couches de bas en haut ; ligne = y (le visage côté y = 0, face à la caméra), colonne = x.
const MOUSSO = fromLayers(
  [
    ['.....', '.M.M.', '.M.M.', '.....'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.SSS.', 'MGGGM', 'MGGGM', '.GGG.'],
    ['.GgG.', 'MGGGM', 'GGGGG', '.GGG.'],
    ['.KGK.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.WGW.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.....', '.GGG.', '.GgG.', '.....'],
    ['.....', '..F..', '.....', '.....'],
  ],
  { G: '#5e9b4a', M: '#4c7a3b', g: '#8fd070', S: '#8c8c8c', W: '#f6f1e6', K: '#1f1a16', F: '#e07aa0' },
);

// Tunel : une taupe brune au ventre clair, museau rose, grosses griffes pâles, casque de mineur à lampe.
const TUNEL = fromLayers(
  [
    ['.C.C.', 'BBBBB', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.bbb.', 'BbbbB', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.bNb.', 'BBBBB', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.EBE.', 'BBBBB', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.BBB.', 'BBBBB', 'BBBBB', '.BBB.', '.....'],
    ['.HHH.', '.HHH.', '.HHH.', '.....', '.....'],
    ['..L..', '.....', '.....', '.....', '.....'],
  ],
  { B: '#7a5236', b: '#a06f4c', N: '#e8a3b8', E: '#1f1a16', C: '#f4e6d4', H: '#f2c944', L: '#fff4a0' },
);

// Rouxel : un renard roux assis, poitrail et bout de queue blancs, museau noir, deux oreilles pointues.
const ROUXEL = fromLayers(
  [
    ['.O.O.', 'OOOOO', 'OOOOO', 'OOOOO', '.OOO.', '..W..'],
    ['.WWW.', 'OWWWO', 'OOOOO', 'OOOOO', '.OOO.', '..O..'],
    ['.OWO.', 'OOOOO', 'OOOOO', '.OOO.', '.....', '.....'],
    ['..N..', 'OOOOO', 'OOOOO', '.....', '.....', '.....'],
    ['.EOE.', 'OOOOO', 'OOOOO', '.....', '.....', '.....'],
    ['.OOO.', 'OOOOO', '.OOO.', '.....', '.....', '.....'],
    ['.O.O.', '.O.O.', '.....', '.....', '.....', '.....'],
  ],
  { O: '#d9772e', W: '#f4e6d4', N: '#1f1a16', E: '#1f1a16' },
);

// Bloquette : une brebis ronde en laine blanche, large tête noire aux yeux clairs, oreilles roses, pattes sombres.
const BLOQUETTE = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.K.K.', '.....'],
    ['.WWW.', 'WWWWW', 'WWWWW', 'WWWWW', '.WWW.'],
    ['KKKKK', 'WWWWW', 'WwWwW', 'WWWWW', '.WWW.'],
    ['KEKEK', 'WWWWW', 'WWWWW', 'WWWWW', '.WWW.'],
    ['KKKKK', 'WWWWW', 'WwWwW', '.WWW.', '.....'],
    ['PWWWP', '.WWW.', '.WWW.', '.....', '.....'],
    ['..W..', '..W..', '.....', '.....', '.....'],
  ],
  { W: '#f6f1e6', w: '#e4dccb', K: '#2a2622', E: '#f6f1e6', P: '#f0b8c4' },
);

// Grimoire : un gros livre debout, couverture violette à coins dorés, tranche de pages crème où s'ouvrent deux yeux,
// un signet rouge qui dépasse, deux petits pieds.
const GRIMOIRE = fromLayers(
  [
    ['.....', '.C.C.', '.....', '.....'],
    ['CPPPC', 'CPPPC', 'CCCCC', '.CCC.'],
    ['CPpPC', 'CPPPC', 'CCCCC', '.CCC.'],
    ['CEPEC', 'CPPPC', 'CCCCC', '.CCC.'],
    ['CPPPC', 'CPPPC', 'CCCCC', '.CCC.'],
    ['GCCCG', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.....', '..B..', '.....', '.....'],
  ],
  { C: '#5a4a8a', P: '#f4f1e4', p: '#e3dcc4', E: '#1f1a16', G: '#e0a33a', B: '#d8402e' },
);

// Coco : une coccinelle ronde, carapace rouge à points noirs, tête noire aux yeux blancs, deux antennes, six pattes.
const COCO = fromLayers(
  [
    ['.....', 'K...K', 'K...K', 'K...K', '.....'],
    ['.KKK.', 'RRRRR', 'RRRRR', 'RRRRR', '.RRR.'],
    ['.EKE.', 'RKRKR', 'RRRRR', 'RKRKR', '.RRR.'],
    ['.KKK.', '.RRR.', '.RKR.', '.RRR.', '.....'],
    ['.A.A.', '.....', '.....', '.....', '.....'],
  ],
  { R: '#d8402e', K: '#1f1a16', E: '#f6f1e6', A: '#1f1a16' },
);

// Nénu : une grenouille verte accroupie, ventre et sourire clairs, deux gros yeux dorés à pupille noire sur la tête.
const NENU = fromLayers(
  [
    ['.....', 'V...V', '.....', 'V...V', '.....'],
    ['.vvv.', 'vvvvv', 'VVVVV', 'VVVVV', '.VVV.'],
    ['.vvv.', 'VVVVV', 'VVVVV', 'VVVVV', '.VVV.'],
    ['.VVV.', 'VVVVV', 'VVVVV', '.VVV.', '.....'],
    ['Y...Y', 'YVVVY', '.....', '.....', '.....'],
    ['K...K', '.....', '.....', '.....', '.....'],
  ],
  { V: '#4f9e3f', v: '#c8e6a0', Y: '#f5d63d', K: '#1f1a16' },
);

// Lavi : une salamandre orange à taches jaunes, corps bas et long, queue derrière, tête relevée aux yeux noirs.
const LAVI = fromLayers(
  [
    ['.OOO.', 'OOOOO', 'OYOYO', 'OOOOO', '.OYO.', '..O..', '..O..'],
    ['.OOO.', 'OYOYO', 'OOOOO', 'OOOOO', '.OOO.', '.....', '.....'],
    ['.EOE.', '.OOO.', '.OYO.', '.....', '.....', '.....', '.....'],
    ['.OOO.', '.OOO.', '.....', '.....', '.....', '.....', '.....'],
  ],
  { O: '#e8742e', Y: '#f5d63d', E: '#1f1a16' },
);

// Frimas : un pingouin dodu, dos noir, ventre blanc, bec et pattes orange, yeux clairs.
const FRIMAS = fromLayers(
  [
    ['.....', '.O.O.', '.....', '.....'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.'],
    ['..O..', 'KWWWK', 'KKKKK', '.KKK.'],
    ['.EKE.', 'KKKKK', 'KKKKK', '.KKK.'],
    ['.KKK.', '.KKK.', '.KKK.', '.....'],
  ],
  { O: '#f28c28', W: '#f6f1e6', K: '#1f1a16', E: '#f6f1e6' },
);

// Bazar : un raton laveur gris au ventre clair, masque noir aux yeux blancs, queue rayée derrière, deux oreilles.
const BAZAR = fromLayers(
  [
    ['.....', 'G...G', '.....', 'G...G', '.....', '.....', '.....'],
    ['.ggg.', 'GgggG', 'GGGGG', 'GGGGG', '.GGG.', '..T..', '..t..'],
    ['.ggg.', 'GGGGG', 'GGGGG', 'GGGGG', '.GGG.', '..t..', '..T..'],
    ['.GNG.', 'GGGGG', 'GGGGG', 'GGGGG', '.GGG.', '.....', '.....'],
    ['KEKEK', 'GGGGG', 'GGGGG', '.GGG.', '.....', '.....', '.....'],
    ['.GGG.', 'GGGGG', '.GGG.', '.....', '.....', '.....', '.....'],
    ['K...K', '.....', '.....', '.....', '.....', '.....', '.....'],
  ],
  { G: '#8c8c8c', g: '#c2c2c2', K: '#1f1a16', E: '#f6f1e6', N: '#1f1a16', T: '#1f1a16', t: '#c2c2c2' },
);

// Sema : un caméléon vert pomme, ventre clair, queue enroulée derrière, deux gros yeux dorés de chaque côté de la tête.
const SEMA = fromLayers(
  [
    ['......', '.V..V.', '......', '.V..V.', '......', '......'],
    ['.vvvv.', 'VvvvvV', 'VVVVVV', 'VVVVVV', '.VVVV.', '..VV..'],
    ['.VVVV.', 'VVVVVV', 'VVVVVV', 'VVVVVV', '.VVVV.', '..V...'],
    ['.vVVv.', 'VVVVVV', '.VVVV.', '......', '......', '......'],
    ['Y.VV.Y', 'YVVVVY', '......', '......', '......', '......'],
    ['K....K', '.VVVV.', '......', '......', '......', '......'],
  ],
  { V: '#7cc24a', v: '#b6e08a', Y: '#f5d63d', K: '#1f1a16' },
);

// Kroa : un triton vert sombre, ventre orange, crête orange sur le dos, longue queue, tête relevée aux yeux dorés.
const KROA = fromLayers(
  [
    ['.OOO.', 'TOOOT', 'TTTTT', 'TTTTT', '.TTT.', '..T..', '..T..'],
    ['.TTT.', 'TTCTT', 'TTCTT', 'TTCTT', '.TTT.', '.....', '.....'],
    ['.EKE.', '.TTT.', '..C..', '..C..', '.....', '.....', '.....'],
    ['.TTT.', '.....', '.....', '.....', '.....', '.....', '.....'],
  ],
  { T: '#3f6b3a', O: '#f28c28', C: '#f28c28', E: '#f5d63d', K: '#1f1a16' },
);

// Braise : un golem trapu de fonte sombre, cœur de braise sur la poitrine, yeux de braise, un marteau à la main.
const BRAISE = fromLayers(
  [
    ['......', '.F.F..', '.F.F..', '......'],
    ['.FFF..', 'FFFFF.', 'FFFFF.', '.FFF..'],
    ['.FOF..', 'FFFFFM', 'FFFFF.', '.FFF..'],
    ['.FFF..', 'FFFFFM', 'FFFFF.', '.FFF..'],
    ['.FFF..', 'FFFFFM', 'FFFFF.', '.FFF..'],
    ['.EFE..', '.FFFHH', '.FFF..', '......'],
    ['.FFF..', '.FFFHH', '.FFF..', '......'],
  ],
  { F: '#4a4a52', O: '#f28c28', E: '#f5d63d', M: '#8a6a3c', H: '#9c9c9c' },
);

// Ixe : un robot cubique crème, écran bleu avec deux yeux, antenne rouge, deux pieds.
const IXE = fromLayers(
  [
    ['.....', '.C.C.', '.....', '.....'],
    ['.CCC.', 'CCCCC', 'CCCCC', '.CCC.'],
    ['CCCCC', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.BBB.', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.XBX.', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.BBB.', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.CCC.', '.CCC.', '.CCC.', '.....'],
    ['..A..', '.....', '.....', '.....'],
  ],
  { C: '#f4f1e4', B: '#3b82f6', X: '#1f1a16', A: '#d8402e' },
);

// Cléa : une chèvre blanche, cornes brunes, museau rose, barbichette, sabots noirs.
const CLEA = fromLayers(
  [
    ['.....', 'K...K', '.....', 'K...K', '.....'],
    ['.WWW.', 'WWWWW', 'WWWWW', 'WWWWW', '.WWW.'],
    ['.WWW.', 'WWWWW', 'WWWWW', 'WWWWW', '.WWW.'],
    ['.WBW.', 'WWWWW', 'WWWWW', '.WWW.', '.....'],
    ['.WNW.', 'WWWWW', '.WWW.', '.....', '.....'],
    ['.EWE.', '.WWW.', '.....', '.....', '.....'],
    ['.WWW.', '.WWW.', '.....', '.....', '.....'],
    ['H...H', '.....', '.....', '.....', '.....'],
    ['H...H', '.....', '.....', '.....', '.....'],
  ],
  { W: '#f6f1e6', K: '#1f1a16', B: '#d8c9b0', N: '#e8a3b8', E: '#1f1a16', H: '#8a6a3c' },
);

// Plume : une pie noire au ventre blanc, longue queue derrière, yeux dorés, un objet doré dans le bec.
const PLUME = fromLayers(
  [
    ['.....', '.O.O.', '.....', '.....', '.....', '.....'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.', '..K..', '..K..'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.', '..K..', '.....'],
    ['.KGK.', 'KKKKK', '.KKK.', '.....', '.....', '.....'],
    ['.EKE.', '.KKK.', '.....', '.....', '.....', '.....'],
    ['.KKK.', '.KKK.', '.....', '.....', '.....', '.....'],
  ],
  { K: '#1f1a16', W: '#f6f1e6', E: '#f5d63d', G: '#f2c944', O: '#f28c28' },
);

// Théo : un héron gris-bleu sur ses longues pattes, long cou, bec jaune, huppe noire.
const THEO = fromLayers(
  [
    ['.....', '.P.P.', '.....', '.....'],
    ['.....', '.P.P.', '.....', '.....'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['..G..', '..G..', '.....', '.....'],
    ['..Y..', '..G..', '.....', '.....'],
    ['.EGE.', '.GGG.', '.....', '.....'],
    ['.GGG.', '.GKG.', '.....', '.....'],
  ],
  { G: '#8c9bb0', P: '#e8a33a', Y: '#f5d63d', E: '#1f1a16', K: '#1f1a16' },
);

// Stat : une chouette mauve au ventre clair, deux grands yeux blancs à pupille noire, bec jaune, aigrettes.
const STAT = fromLayers(
  [
    ['.....', '.Y.Y.', '.....', '.....'],
    ['.mmm.', 'MmmmM', 'MMMMM', '.MMM.'],
    ['.mmm.', 'MmmmM', 'MMMMM', '.MMM.'],
    ['.MYM.', 'MMMMM', 'MMMMM', '.MMM.'],
    ['EKMKE', 'MMMMM', 'MMMMM', '.MMM.'],
    ['EEMEE', 'MMMMM', 'MMMMM', '.MMM.'],
    ['MMMMM', 'MMMMM', '.MMM.', '.....'],
    ['M...M', '.....', '.....', '.....'],
  ],
  { M: '#7a6aa0', m: '#c9b8e8', E: '#f6f1e6', K: '#1f1a16', Y: '#f5d63d' },
);

// Fi : une lampe de phare vivante, socle et chapeau dorés, verre lumineux, un grand œil.
const FI = fromLayers(
  [
    ['.DDD.', 'DDDDD', 'DDDDD', '.DDD.'],
    ['..D..', '.DDD.', '.DDD.', '..D..'],
    ['.LLL.', 'LLLLL', 'LLLLL', '.LLL.'],
    ['.LEL.', 'LLLLL', 'LLLLL', '.LLL.'],
    ['.LLL.', 'LLLLL', 'LLLLL', '.LLL.'],
    ['.DDD.', 'DDDDD', 'DDDDD', '.DDD.'],
    ['..D..', '.DDD.', '..D..', '.....'],
  ],
  { D: '#e0b842', L: '#fff4c2', E: '#1f1a16' },
);

// Astra : une luciole au corps sombre, abdomen lumineux à l'arrière, ailes claires, grands yeux dorés, antennes.
const ASTRA = fromLayers(
  [
    ['.....', 'K...K', '.....', 'K...K', '.....'],
    ['.KKK.', 'KKKKK', 'KLLLK', 'LLLLL', '.LLL.'],
    ['.EKE.', 'KKKKK', 'WLLLW', 'WLLLW', '.LLL.'],
    ['.KKK.', 'WKKKW', 'WWWWW', '.WWW.', '.....'],
    ['A...A', '.....', '.....', '.....', '.....'],
  ],
  { K: '#2a2622', L: '#fff4a0', W: '#e6f2f8', E: '#f5d63d', A: '#2a2622' },
);

// Robin : un rouge-gorge dodu, dos brun, gorge et poitrine orange vif, petit bec sombre, queue relevée derrière.
const ROBIN = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.....', '.....'],
    ['.RRR.', 'BRRRB', 'BBBBB', '.BBB.', '.....'],
    ['.RRR.', 'BRRRB', 'BBBBB', '.BBB.', '..B..'],
    ['.RRR.', 'BRRRB', 'BBBBB', '.BBB.', '..B..'],
    ['.EkE.', 'BBBBB', 'BBBBB', '.BBB.', '.....'],
    ['.....', '.BBB.', '.BBB.', '.....', '.....'],
  ],
  { R: '#e8642e', B: '#8a6a4a', E: '#1f1a16', k: '#3a2a1a', K: '#4a3a2a' },
);

// Tick : un hérisson horloger, piquants bruns sur le dos, museau crème et truffe noire, une petite horloge de laiton sur la tête.
const TICK = fromLayers(
  [
    ['.....', '.F.F.', '.....', '.F.F.', '.....'],
    ['.FFF.', 'SFFFS', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.FKF.', 'SFFFS', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.EFE.', 'SSSSS', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.....', '.SSS.', 'SSSSS', 'SSSSS', '.S.S.'],
    ['.....', '..G..', '.S.S.', '.S.S.', '.....'],
  ],
  { S: '#5a4030', F: '#f0dcb4', K: '#1f1a16', E: '#1f1a16', G: '#c9a24a' },
);

// Pudding : un bouledogue trapu, pelage crème à taches brunes, large mâchoire aux petites dents, oreilles tombantes.
const PUDDING = fromLayers(
  [
    ['.....', 'W...W', '.....', 'W...W', '.....'],
    ['.WWW.', 'WWWWW', 'WWWWW', 'WWWWW', '.BWB.'],
    ['WTKTW', 'WWWWW', 'BWWWB', 'WWWWW', '..W..'],
    ['WKWKW', 'WWWWW', 'WWWWW', 'WWWWW', '.....'],
    ['B...B', 'BWWWB', '.WWW.', '.....', '.....'],
  ],
  { W: '#efe6d8', B: '#a0703c', K: '#1f1a16', T: '#f6f1e6' },
);

// Moustache : un chat noir aux yeux verts, grandes moustaches blanches, nez rose, queue dressée derrière.
const MOUSTACHE = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.K.K.', '.....'],
    ['.KKK.', 'KKKKK', 'KKKKK', 'KKKKK', '..K..'],
    ['.KPK.', 'KKKKK', 'KKKKK', 'KKKKK', '..K..'],
    ['WGKGW', 'KKKKK', 'KKKKK', '.KKK.', '..K..'],
    ['.KKK.', 'KKKKK', 'KKKKK', '.....', '.....'],
    ['K...K', '.....', '.....', '.....', '.....'],
  ],
  { K: '#2a2622', G: '#7ad04a', W: '#f6f1e6', P: '#e8a3b8' },
);

// Puck : un petit lutin souffleur, bonnet vert pointu, oreilles pointues, tunique brune, un rouleau de texte à la main.
const PUCK = fromLayers(
  [
    ['.....', '.B.B.', '.....', '.....'],
    ['.TTT.', 'TTTTT', 'TTTTT', '.TTT.'],
    ['PTTTT', 'TTTTT', 'TTTTT', '.TTT.'],
    ['.SSS.', 'SSSSS', 'SSSSS', '.SSS.'],
    ['ESKSE', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.....', '.GGG.', '.GGG.', '.....'],
    ['.....', '.....', '..G..', '.....'],
  ],
  { T: '#8a6236', B: '#4a3a2a', S: '#e8c8a0', K: '#1f1a16', E: '#e8c8a0', G: '#3f8a4a', P: '#f4f1e4' },
);

// Vapeur : un blaireau gris, masque rayé noir et blanc, casquette de chef de gare rouge à visière noire.
const VAPEUR = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.K.K.', '.....'],
    ['.GGG.', 'GGGGG', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.WKW.', 'GGGGG', 'GGGGG', 'GGGGG', '..G..'],
    ['KWEWK', 'GWWWG', 'GGGGG', 'GGGGG', '.....'],
    ['.KKK.', 'RRRRR', 'RRRRR', '.RRR.', '.....'],
    ['.....', '.RRR.', '.RRR.', '.....', '.....'],
  ],
  { G: '#8c8c8c', W: '#f6f1e6', K: '#1f1a16', E: '#1f1a16', R: '#c0392b' },
);

// Écho : une chauve-souris mauve, grandes ailes sombres ouvertes, yeux dorés, deux petits crocs, grandes oreilles.
const ECHO = fromLayers(
  [
    ['.......', '..P.P..', '.......'],
    ['W.PPP.W', 'WWPPPWW', '..PPP..'],
    ['WWPTPWW', 'WWPPPWW', '..PPP..'],
    ['.WEPEW.', '.WPPPW.', '..PPP..'],
    ['..P.P..', '..P.P..', '.......'],
  ],
  { P: '#6a5a8c', W: '#2e2538', E: '#f5d63d', T: '#f6f1e6' },
);

// Knight : un petit chevalier, heaume d'acier à visière, plumet rouge, tunique bleue à écusson d'or.
const KNIGHT = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.....'],
    ['.BBB.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.BYB.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.SSS.', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.KKK.', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.....', '.SSS.', '.SSS.', '.....'],
    ['.....', '..R..', '..R..', '.....'],
  ],
  { K: '#2a2622', B: '#2f5aa8', Y: '#f2c944', S: '#b8c0c8', R: '#c0392b' },
);

// Lina : une cigogne voyageuse, corps blanc, bouts d'ailes et queue noirs, long bec et hautes pattes orange, sans coiffe.
const LINA = fromLayers(
  [
    ['.....', '.O.O.', '.....', '.....', '.....'],
    ['.....', '.O.O.', '.....', '.....', '.....'],
    ['.WWW.', 'KWWWK', 'KWWWK', '.KWK.', '..K..'],
    ['.WWW.', 'KWWWK', 'KWWWK', '.WWW.', '.....'],
    ['..O..', '..W..', '..W..', '.....', '.....'],
    ['.EOE.', '.WWW.', '.....', '.....', '.....'],
    ['.WWW.', '.WWW.', '.....', '.....', '.....'],
  ],
  { W: '#f6f1e6', K: '#1f1a16', O: '#e8732e', E: '#1f1a16' },
);

// Muscade : un écureuil cuisinier châtain, tablier crème uni, louche de bois à la main, queue en panache qui monte
// derrière la tête, son bout plus clair ; pas de toque. Entre les yeux, le museau clair (nez compris, au ton du museau).
const MUSCADE = fromLayers(
  [
    ['.C.C.', '.CCC.', '.....', '.....', '.....'],
    ['LWWW.', 'CCCCC', '.CCC.', '..T..', '.....'],
    ['LWWW.', 'CCCCC', '.CCC.', '.TTT.', '.....'],
    ['LCCC.', 'CCCCC', '.CCC.', '.TTT.', '..T..'],
    ['.EME.', 'CCCCC', '.CCC.', '.....', '.TTT.'],
    ['.CCC.', 'CCCCC', '.....', '.....', '.TTT.'],
    ['.C.C.', '.....', '.....', '.TTT.', '.ttt.'],
    ['.....', '.....', '..t..', '.tt..', '.....'],
  ],
  { C: '#8a4a26', T: '#9a5a32', t: '#c79a6a', W: '#efe4c8', L: '#8a6236', E: '#1f1a16', M: '#c89a72' },
);

// Timbre : une loutre factrice debout (DA et consultant Blocland, LV2-5), brun-gris (plus sombre que Tunel, plus chaude
// que Vapeur), la tête plate de cinq sur deux couches, sa rangée de devant crème sur les deux couches (les yeux sombres
// s'y détachent, en gris aussi), deux petites oreilles sur les côtés, sans moustaches ; la gorge crème ; une sacoche
// fauve de deux sur deux au côté gauche, sa bandoulière fauve en diagonale sur le devant ; la queue sort de côté, à droite, au ras du sol, en marches de trois, deux et un cubes.
const TIMBRE = fromLayers(
  [
    ['.B.B...', '.BBB...', '.BBBTTT'],
    ['SBCB...', 'SBBB...', '.BBBTT.'],
    ['SLCB...', 'SBBB...', '.BBBT..'],
    ['.BLB...', '.BBB...', '.BBB...'],
    ['CCCCC..', 'BBBBB..', '.BBB...'],
    ['CECEC..', 'OBBBO..', '.BBB...'],
  ],
  { B: '#5e4b3e', T: '#54433a', C: '#e6d8bc', E: '#1f1a16', O: '#4a3b31', S: '#a8703a', L: '#a8703a' },
);

export const CREATURE_CUBES: Record<BiomeId, CubeDeModele[]> = {
  'french-6e-phonology': MOUSSO,
  'french-6e-letter-confusion': TUNEL,
  'french-6e-word-spelling': ROUXEL,
  'french-6e-grammar-spelling': BLOQUETTE,
  'french-6e-reading': GRIMOIRE,
  'maths-6e-calculation': COCO,
  'maths-6e-fractions': NENU,
  'maths-6e-decimals': LAVI,
  'maths-5e-signed-numbers': FRIMAS,
  'maths-5e-proportionality': BAZAR,
  'french-5e-homophones': SEMA,
  'french-5e-conjugation': KROA,
  'maths-4e-powers': BRAISE,
  'maths-4e-algebra': IXE,
  'french-4e-agreement': CLEA,
  'french-4e-vocabulary': PLUME,
  'maths-3e-geometry': THEO,
  'maths-3e-statistics': STAT,
  'maths-3e-functions': FI,
  'french-3e-close-reading': ASTRA,
  'english-6e-vocabulary': ROBIN,
  'english-6e-grammar': TICK,
  'english-5e-vocabulary': PUDDING,
  'english-5e-grammar': MOUSTACHE,
  'lv2-5e-introductions': LINA,
  'lv2-4e-daily-life': MUSCADE,
  'english-4e-comprehension': PUCK,
  'english-4e-grammar': VAPEUR,
  'english-3e-comprehension': ECHO,
  'english-3e-grammar': KNIGHT,
  'lv2-3e-travel': TIMBRE,
};
