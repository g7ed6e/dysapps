// Créatures originales de Blocland, dessinées en cubes. Module pur : les vues (SVG, 3D, monde) les lisent.
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

// Silex : un ourson fouilleur assis (DA, HG-2), brun, le museau crème et la truffe sombre, deux petites oreilles rondes ;
// à sa patte droite, debout, un pinceau de fouille (un manche clair, une touffe sombre au bout). Trois couleurs : le
// manche reprend le crème du museau, la touffe le sombre des yeux (un appel de dessin par couleur).
const SILEX = fromLayers(
  [
    ['.B.B.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['....P', 'BBBBB', 'BBBBB', '.BBB.'],
    ['....P', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.CCCH', 'BBBBB', 'BBBBB', '.....'],
    ['..N..', 'BEBEB', 'BBBBB', '.....'],
    ['.....', 'BBBBB', 'BBBBB', '.....'],
    ['.....', 'B...B', '.....', '.....'],
  ],
  { B: '#6e4a2c', C: '#efe0c0', N: '#1f1a16', E: '#1f1a16', P: '#efe0c0', H: '#1f1a16' },
);

// Boussole : une tortue géographe (DA, HG-2), la carapace en pavé à marches (un rang large, un rang plus étroit, une case
// au sommet : les marches se lisent à la forme), quatre pattes aux coins, la tête devant aux yeux sombres, une petite
// queue derrière. Trois couleurs.
const BOUSSOLE = fromLayers(
  [
    ['.....', 'L...L', '.....', 'L...L', '.....'],
    ['.HHH.', 'CCCCC', 'CCCCC', 'CCCCC', '..L..'],
    ['.EHE.', '.CCC.', '.CCC.', '.CCC.', '.....'],
    ['.....', '.....', '..C..', '.....', '.....'],
  ],
  { C: '#5e7a3e', H: '#b4a676', L: '#b4a676', E: '#1f1a16' },
);

// Vélin : un lapin enlumineur assis (DA, HG-3), gris-fauve au ventre crème (pas le gris-pierre d'une statue, DA), le museau crème à la truffe rose, deux
// longues oreilles debout, roses dedans ; à sa patte droite, debout, une plume d'enluminure violette à la pointe sombre.
const VELIN = fromLayers(
  [
    ['.B.B.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.CCC.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.CCCK', 'BBBBB', 'BBBBB', '..C..'],
    ['.CPCF', 'BBBBB', 'BBBBB', '.....'],
    ['....F', 'BEBEB', 'BBBBB', '.....'],
    ['.....', 'BBBBB', 'BBBBB', '.....'],
    ['.P.P.', '.B.B.', '.....', '.....'],
    ['.....', '.B.B.', '.....', '.....'],
  ],
  { B: '#a08870', C: '#f6f1e6', P: '#e0a0a8', E: '#1f1a16', K: '#1f1a16', F: '#6a4c9c' },
);

// Sillon : un ibis cultivateur (DA, HG-3), blanc, la queue noire, le cou et la tête noirs, le long bec noir qui se
// courbe vers le bas, perché sur ses deux pattes fines ; un chapeau de paille sur la tête. Trois couleurs.
const SILLON = fromLayers(
  [
    ['.....', '.K.K.', '.....', '.....'],
    ['.....', '.K.K.', '.....', '.....'],
    ['.WWW.', 'WWWWW', 'WWWWW', '.WWW.'],
    ['.WWW.', 'WWWWW', 'WWWWW', '.KKK.'],
    ['.....', '.WWW.', '.WWW.', '.....'],
    ['..K..', '..K..', '.....', '.....'],
    ['..K..', '.KKK.', '.....', '.....'],
    ['.HHH.', 'HHHHH', '.HHH.', '.....'],
    ['.....', '.HHH.', '.....', '.....'],
  ],
  { W: '#f2efe6', K: '#1f1a16', H: '#d8b860' },
);

// Typo : une souris imprimeuse (DA, HG-3), grise, deux grandes oreilles rondes, la truffe et la queue roses, un tablier
// d'encre sombre. Quatre couleurs.
const TYPO = fromLayers(
  [
    ['.G.G.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.AAA.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.AAA.', 'GGGGG', 'GGGGG', '..P..'],
    ['.GPG.', 'GGGGG', 'GGGGG', '...P.'],
    ['.....', 'GEGEG', 'GGGGG', '.....'],
    ['.....', 'GGGGG', 'GGGGG', '.....'],
    ['.....', 'GG.GG', '.....', '.....'],
    ['.....', 'GG.GG', '.....', '.....'],
  ],
  { G: '#8c8a86', A: '#2e2622', P: '#e0a0a8', E: '#1f1a16' },
);

// Fret : un crabe grutier (DA, HG-3), large et bas, rouge, ses deux pinces levées devant, six pattes, deux yeux noirs
// sur leurs tiges et un casque jaune entre eux. Trois couleurs.
const FRET = fromLayers(
  [
    ['.......', 'R.....R', '.R...R.', 'R.....R', '.......'],
    ['R.....R', '.RRRRR.', '.RRRRR.', '.RRRRR.', '.......'],
    ['R.....R', '.RRRRR.', '.RRRRR.', '.RRRRR.', '.......'],
    ['RR...RR', '..RRR..', '..RRR..', '.......', '.......'],
    ['.......', '..RHR..', '...H...', '.......', '.......'],
    ['.......', '..K.K..', '.......', '.......', '.......'],
  ],
  { R: '#c8502e', H: '#f2c944', K: '#1f1a16' },
);

// Mémo : une marmotte bibliothécaire assise (DA, HG-3), brun-gris, le ventre et le museau crème, deux incisives
// blanches ; elle tient contre elle un livre de reliure bleu-vert. La tête, de trois cubes de large, se pose en ressaut
// sur le corps, ses deux petites oreilles rentrées d'une colonne, les yeux au-dessus du museau, vus de la caméra (DA,
// relecture des planches : plus une caisse ouverte). Cinq couleurs.
const MEMO = fromLayers(
  [
    ['.B.B.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.LLL.', 'BCCCB', 'BBBBB', '.BBB.'],
    ['.LLL.', 'BCCCB', 'BBBBB', '.BBB.'],
    ['.....', 'BBBBB', 'BBBBB', '.....'],
    ['.CWC.', '.BBB.', '.BBB.', '.....'],
    ['..N..', '.EBE.', '.BBB.', '.....'],
    ['.....', '.BBB.', '.BBB.', '.....'],
    ['.....', '.B.B.', '.....', '.....'],
  ],
  { B: '#8a7058', C: '#e6d8bc', W: '#f6f1e6', N: '#1f1a16', E: '#1f1a16', L: '#2f6f74' },
);

// Jalon : une fourmi arpenteuse (DA, HG-3), à l'horizontale, ocre sable (DA : plus brun-rouge, la couleur de Pince,
// la fourmi bricoleuse du Hangar des inventions), trois parties à la file (la tête aux deux antennes, le thorax étroit,
// le gros abdomen derrière) sur six pattes d'un brun très sombre, plus doux que le noir des yeux (consultant Blocland,
// HG-3 : en noir, pattes et antennes faisaient une masse plus grande que le corps) ; son jalon d'arpenteur planté, rayé
// blanc et rouge par deux cubes, d'un cube plus haut que ses antennes (DA, relecture des planches : plus une cheminée ni un phare), à côté de son
// abdomen, séparé d'elle d'une case. La caméra du Plateau la regarde de l'est (`viewYaw`, −40°), donc de profil, la
// tête d'un côté, l'abdomen de l'autre ; la mairie se tient plus à l'est et au-delà de l'abdomen (x et y croissants) :
// le jalon est du côté ouest (x = 0 du modèle), celui qui s'éloigne de la mairie, à hauteur de l'abdomen et non plus
// au-delà, pour ne pas se lire comme une cheminée sur le toit de la mairie (consultant Blocland et DA, HG-3) ; il n'est
// jamais entre elle et la caméra. De face (les portraits), derrière elle, à sa gauche.
const JALON = fromLayers(
  [
    ['.......', '..A...A', '..A...A', '..A...A', 'P......', '.......'],
    ['...RRR.', '...ARA.', '...ARA.', '...RRR.', 'P..RRR.', '....R..'],
    ['...ERE.', '....R..', '....R..', '...RRR.', 'Q..RRR.', '...RRR.'],
    ['...A.A.', '.......', '.......', '....R..', 'Q..RRR.', '....R..'],
    ['..A...A', '.......', '.......', '.......', 'P......', '.......'],
    ['.......', '.......', '.......', '.......', 'P......', '.......'],
  ],
  { R: '#c9a066', A: '#3a2a1a', E: '#1f1a16', P: '#f6f1e6', Q: '#d23a2e' },
);

// Fougère : un escargot jardinier (DA, SC-2), tourné vers la droite pour montrer sa coquille : la coquille brun roux et
// sa spirale crème (un « C » ouvert vers le centre), le corps vert sauge sur son pied, deux antennes au bout brun, un
// petit arrosoir crème posé devant lui. Trois couleurs (un appel de dessin par couleur).
const FOUGERE = fromLayers(
  [
    ['GGGGGGGG.', 'GGGGGGGG.', 'GGGGGGGG.'],
    ['.RRR..GGC', 'RRRRR.GG.', '.RRR..GG.'],
    ['RCCCR.GGC', 'RRRRR.GG.', 'RRRRR....'],
    ['RCRRR.GG.', 'RRRRR.GG.', 'RRRRR....'],
    ['RCCCR....', 'RRRRR.GG.', 'RRRRR....'],
    ['.RRR.....', '.RRR..RR.', '.RRR.....'],
  ],
  { G: '#8aa878', R: '#9a5530', C: '#efe2c4' },
);

// Bulle : une goutte d'eau vivante (DA, SC-2), bleu clair et mate, un reflet blanc, deux yeux sombres ; à son côté, une
// éprouvette blanche, le fond bleu. Trois couleurs.
const BULLE = fromLayers(
  [
    ['.BBB..', 'BBBBBB', 'BBBBB.', 'BBBBB.', '.BBB..'],
    ['.BBB..', 'BBBBBW', 'BBBBB.', 'BBBBB.', '.BBB..'],
    ['.KBK..', 'BBBBBW', 'BBBBB.', 'BBBBB.', '.BBB..'],
    ['.BBW..', '.BBB..', '.BBB..', '.BBB..', '......'],
    ['......', '..B...', '..B...', '..B...', '......'],
    ['......', '......', '..B...', '......', '......'],
  ],
  { B: '#8ec8ea', W: '#f6f8fa', K: '#1f1a16' },
);

// Pince : une fourmi bricoleuse debout (DA, SC-2), brun-rouge, trois segments séparés par une taille fine (l'abdomen
// derrière, le thorax et sa bavette de tablier de cuir, la tête), deux antennes coudées ; la clé plate grise levée à
// sa droite. Haute et étroite, elle ne se confond pas avec Coco, ronde et rouge vif. Trois couleurs : les yeux
// reprennent le cuir du tablier.
const BOULON = fromLayers(
  [
    ['.....', '.N.N.', '.....', '.....'],
    ['.....', '.N.N.', '.NNN.', '.NNN.'],
    ['.....', '..N..', 'NNNNN', '.NNN.'],
    ['.TTTM', 'NNNNN', '.NNN.', '.....'],
    ['....M', '..N..', '.....', '.....'],
    ['.NNNM', '.NNN.', '.....', '.....'],
    ['.TNT.', '.NNN.', '.....', '.....'],
    ['.....', '.N.N.', '.....', '.....'],
    ['.....', 'N...N', '.....', '.....'],
  ],
  { N: '#8e3a26', T: '#5a3a22', M: '#9aa2aa' },
);

// Humus : un ver de terre laboureur dressé en S (DA, SC-3), rose-brun, des anneaux plus clairs ; à côté de lui, son
// petit râteau debout, plus court que lui (relecture des captures : un manche de six cubes faisait lampadaire) : les
// deux dents de fer au sol, la traverse, un manche de bois de trois cubes.
const HUMUS = fromLayers(
  [
    ['.......', '....F.F', '.RA....'],
    ['.......', '..R.FFF', '..R....'],
    ['.......', '..A..W.', '.......'],
    ['.......', '.RR..W.', '.......'],
    ['.......', '.AR..W.', '.......'],
    ['..A....', '..R....', '.......'],
    ['.KRK...', '.RRR...', '.......'],
    ['.......', '..R....', '.......'],
  ],
  { R: '#b07468', A: '#d8a49a', W: '#8a6236', F: '#5c6470', K: '#1f1a16' },
);

// Perle : un canard saunier (DA, SC-3), blanc, le bec et les pattes orangés ; son râteau à sel en bois debout à côté,
// la traverse au sol, un manche de trois cubes, plus court que lui (relecture des captures), une colonne vide entre lui
// et le canard : collé à son flanc, on croyait le canard perché sur un poteau (consultant de Blocland).
const PERLE = fromLayers(
  [
    ['......B', '.O.O..B', '......B', '.......', '.......'],
    ['.......', 'WWWWW.B', 'WWWWW..', 'WWWWW..', '.......'],
    ['.......', 'WWWWW.B', 'WWWWW..', 'WWWWW..', '.......'],
    ['.......', 'WWWWW.B', 'WWWWW..', 'WWWWW..', '.WWW...'],
    ['.WOW...', '.WWW...', '.WWW...', '.......', '.......'],
    ['.KWK...', '.WWW...', '.WWW...', '.......', '.......'],
  ],
  { W: '#f2efe6', O: '#e0902a', B: '#8a6236', K: '#1f1a16' },
);

// Rabot : un pic-vert menuisier (DA, SC-3), le dos vert, la crête rouge, un tablier de cuir, son rabot de bois à la main.
const RABOT = fromLayers(
  [
    ['.......', '.K.K...', '.......', '.......', '.......', '.......'],
    ['.TTT...', 'GGGGG..', 'GGGGG..', 'GGGGG..', '..G....', '..G....'],
    ['.TTT.WW', 'GGGGGWW', 'GGGGG..', 'GGGGG..', '..G....', '..G....'],
    ['.TTT.W.', 'GGGGG..', 'GGGGG..', 'GGGGG..', '.......', '.......'],
    ['.......', 'GGGGG..', 'GGGGG..', 'GGGGG..', '.......', '.......'],
    ['.GKG...', '.GGG...', '.GGG...', '.......', '.......', '.......'],
    ['.KGK...', '.GGG...', '.GGG...', '..C....', '.......', '.......'],
    ['.......', '.CCC...', '.CCC...', '.......', '.......', '.......'],
  ],
  { G: '#5e8a3a', C: '#c0392b', T: '#a87a4a', W: '#8a6236', K: '#1f1a16' },
);

// Nectar : un colibri butineur (DA, SC-3), posé, de profil (son flanc côté y = 0, celui de la caméra de la Source) :
// le corps vert, la gorge rose sur le devant, la petite tête et ses yeux sur les flancs, le long bec fin de deux cubes
// brun bois qui avance ; les ailes bleu-vert levées en V au-dessus du dos, la queue derrière. Repris de zéro à la
// relecture des captures (DA, consultant de Blocland) : plus de tête carrée de face, plus de bouche.
const NECTAR = fromLayers(
  [
    ['........', '....B.B.', '........'],
    ['....GGG.', '....GGG.', '....GGG.'],
    ['...PGGG.', '...PGGGG', '...PGGG.'],
    ['...PGGG.', '...PGGG.', '...PGGG.'],
    ['..GG....', 'BBGG.V..', '..GG....'],
    ['..KG....', '..GGV.V.', '..KG....'],
    ['........', '...V...V', '........'],
  ],
  { G: '#3a9a6a', P: '#e07aa0', V: '#3f8fb8', B: '#8a6236', K: '#1f1a16' },
);

// Radar : un suricate guetteur debout (DA, SC-3), couleur sable, le ventre clair plaqué sur le devant du corps (relecture
// des captures : détaché devant lui, il se lisait comme un poteau), le masque et les oreilles sombres, les pattes de
// devant écartées ; la queue au sol, son bout sombre.
const RADAR = fromLayers(
  [
    ['.....', '.S.S.', '.....', '..S..', '..S..', '..S..'],
    ['.....', '.SCS.', '.SSS.', '.....', '.....', '..D..'],
    ['.....', '.SCS.', '.SSS.', '.....', '.....', '.....'],
    ['.....', '.SCS.', '.SSS.', '.....', '.....', '.....'],
    ['S...S', 'SSCSS', '.SSS.', '.....', '.....', '.....'],
    ['.....', '.SCS.', '.SSS.', '.....', '.....', '.....'],
    ['.SDS.', '.SSS.', '.SSS.', '.....', '.....', '.....'],
    ['.DSD.', '.SSS.', '.SSS.', '.....', '.....', '.....'],
    ['.....', '.D.D.', '.....', '.....', '.....', '.....'],
  ],
  { S: '#c8a878', C: '#ece0c4', D: '#5a4030', K: '#1f1a16' },
);

// Manivelle : un lémurien maquettiste (DA, SC-3), gris, le ventre clair, le masque sombre, sa longue queue annelée
// dressée derrière lui ; la manivelle de fer à la main.
const MANIVELLE = fromLayers(
  [
    ['......', '.G.G..', '......', '..W...', '......'],
    ['..W...', '.GGG..', '.GGG..', '..W...', '......'],
    ['..W...', '.GGG..', '.GGG..', '......', '..W...'],
    ['..W..F', '.GGGGF', '.GGG..', '......', '..D...'],
    ['.....F', '.GGG..', '.GGG..', '......', '..W...'],
    ['.GDG..', '.GGG..', '.GGG..', '......', '..D...'],
    ['.KGK..', '.GGG..', '.GGG..', '......', '..W...'],
    ['......', 'D...D.', '......', '......', '..D...'],
  ],
  { G: '#8e8c88', W: '#f2efe6', D: '#2e2c2a', F: '#5c6470', K: '#1f1a16' },
);

// Olive : un koala soigneur (DA, SC-3), gris, les grandes oreilles rondes, la truffe sombre, un tablier blanc ; sa trousse
// de toile à la main, sans croix.
const OLIVE = fromLayers(
  [
    ['......', '.G.G..', '......'],
    ['.WWWTT', '.GGGTT', '.GGG..'],
    ['.WWWTT', '.GGGTT', '.GGG..'],
    ['.WWW..', '.GGG..', '.GGG..'],
    ['.WWW..', '.GGG..', '.GGG..'],
    ['.GNG..', '.GGG..', '.GGG..'],
    ['GKGKG.', 'GGGGG.', 'GGGGG.'],
    ['W...W.', 'G...G.', 'G...G.'],
  ],
  { G: '#9a9a96', W: '#f2f0ea', N: '#3a3634', T: '#c8b48a', K: '#1f1a16' },
);

// Virage : un tatou rouleur (DA, SC-3), sa carapace en bandes, la tête pointue rose, la petite queue derrière.
const VIRAGE = fromLayers(
  [
    ['.....', 'P...P', '.....', 'P...P', '.....', '.....', '..A..'],
    ['APPPA', 'BBBBB', 'AAAAA', 'BBBBB', 'AAAAA', '..A..', '.....'],
    ['AKPKA', 'BBBBB', 'AAAAA', 'BBBBB', 'AAAAA', '.....', '.....'],
    ['.APA.', '.BBB.', '.AAA.', '.BBB.', '.AAA.', '.....', '.....'],
  ],
  { A: '#a8845e', B: '#6e5238', P: '#e0b8a0', K: '#1f1a16' },
);

// Navette : une chenille tisseuse vert tendre (DA, SC-3), couchée de profil (son flanc côté y = 0) : six anneaux au sol,
// clairs et foncés en alternance, la tête relevée de deux cubes au bout, l'œil sur le flanc, deux antennes ; devant elle,
// au ras du sol, sa petite navette de bois et sa bobine de fil (relecture des captures : dressée, elle se lisait comme
// une colonne). Dans le monde, tournée de flanc vers la caméra de la Ruche (`QUARTS_DE_TOUR_DE_LA_CREATURE`).
const NAVETTE = fromLayers(
  [
    ['.WWW.F.', 'VLVLVLV', 'VLVLVLV'],
    ['.......', 'VLVLVLV', 'VLVLVLV'],
    ['.......', 'K......', 'V......'],
    ['.......', 'V......', 'V......'],
    ['.......', 'K......', 'K......'],
  ],
  { V: '#9ac860', L: '#c8e48e', W: '#8a6236', F: '#e8e0cc', K: '#1f1a16' },
);

// Voix : un panda roux délégué, debout sur ses pattes de derrière (jamais assis comme Rouxel, le renard) : roux, le
// masque blanc (les joues, le museau, les sourcils), la truffe et les yeux sombres, deux oreilles rondes bordées de
// blanc, les pattes et le bas du ventre brun sombre ; sa grande queue annelée, roux et fauve, se dresse derrière lui. Il
// lève une patte droite au-dessus de la tête pour prendre la parole, un bloc d'écart avec l'oreille, la paume ouverte,
// fauve, tournée vers l'élève ; devant sa poitrine, il tient son carnet de délégué, sans écharpe ni insigne (DA,
// relecture des captures emc-2, passe 2 : la patte était à l'horizontale, le carnet ne se voyait pas). Le carnet est
// posé à plat, sans rotation : une plaque de deux cubes de large, trois de profondeur, un de haut, la couverture bleu
// nuit sur le dessus, ce que voit la caméra haute, les pages blanc cassé sur ses tranches ; à hauteur de poitrine, deux
// cubes au-dessus du sol, contre le pelage roux, juste sous le masque blanc, sans patte sombre à côté (passe 3 : en bloc
// clair de 2 × 2 au ras du sol, il se lisait comme une pierre ; passe 4 : debout, il se lisait comme un pilier ou une
// porte, la tranche ne se voyait pas, et la nuit il se fondait dans le sol sombre). Il dépasse de trois rangées devant
// le corps, ce qui porte l'emprise de 7 × 5 à 7 × 7 cases ; il ne cache pas la truffe, un cube plus haut. Pas de
// demi-cube ni d'inclinaison dans les créatures de Blocland. Six couleurs.
const VOIX = fromLayers(
  [
    ['.......', '.......', '.......', '.D.D...', '.D.D...', '.......', '.......'],
    ['.......', '.......', '.......', 'DDDD...', '.RRR...', '..R....', '.RRR...'],
    ['.PP....', '.PP....', '.PP....', '.RRRDD.', '.RRR...', '.......', '.LLL...'],
    ['.......', '.......', '.......', 'RWDWR.D', 'RRRRR..', 'RRRRR..', '.RRR...'],
    ['.......', '.......', '.......', 'WDRDW.D', 'RRRRR..', 'RRRRR..', '.LLL...'],
    ['.......', '.......', '.......', 'RWRWR.D', 'RRRRR..', 'RRRRR..', '..R....'],
    ['.......', '.......', '.......', 'W...W.D', 'R...R..', '.......', '.......'],
    ['.......', '.......', '......L', '......D', '.......', '.......', '.......'],
    ['.......', '.......', '......L', '.......', '.......', '.......', '.......'],
  ],
  {
    R: '#b8532c',
    W: '#f2ebe0',
    D: '#3a2622',
    L: '#dca468',
    // Le carnet, à plat : les pages blanc cassé sur les tranches, la couverture bleu nuit sur le dessus.
    P: { color: '#e5ebe3', top: '#142b38' },
  },
);

// Mie : un capybara boulanger, à quatre pattes, de profil, la tête vers les x croissants : le corps en tonneau brun
// roux, la grosse tête carrée au museau sombre, deux petites oreilles, les yeux sur les flancs de la tête ; sa toque
// blanche de boulanger sur la tête et, sur le dos, un pain doré qu'il porte au fournil. Sans tablier ni insigne. Sept de
// long, quatre de large, sept de haut. Cinq couleurs, les yeux compris (proposition de l'artiste technique 3D).
const MIE = fromLayers(
  [
    ['.D..D..', '.......', '.......', '.D..D..'],
    ['BBBBB..', 'BBBBB..', 'BBBBB..', 'BBBBB..'],
    ['BBBBBB.', 'BBBBBBD', 'BBBBBBD', 'BBBBBB.'],
    ['.BBBBEB', '.BBBBBB', '.BBBBBB', '.BBBBEB'],
    ['....D..', '.PP.BB.', '.PP.BB.', '....D..'],
    ['.......', '....TT.', '....TT.', '.......'],
    ['.......', '...TTTT', '...TTTT', '.......'],
  ],
  {
    B: '#8a5c3a',
    D: '#3e2a1e',
    // L'œil, sur le flanc de la tête : sombre de côté, le dessus brun (vu d'en haut, la tête reste unie).
    E: { color: '#1f1a16', top: '#8a5c3a' },
    P: '#d39a4c',
    T: '#f6f2ea',
  },
);

// Lyre : un gecko conteur, debout sur ses pattes de derrière, de face : jaune d'ocre semé de taches brunes, le ventre
// clair, la grosse tête ronde aux yeux sur les côtés ; sa queue épaisse posée au sol derrière lui, en crosse ; les pieds
// sous le corps, les doigts en avant (le corps les touche par une face). Il tient de la main droite sa petite lyre de
// bois, tournée vers l'élève. Carrée, trois sur trois, elle se lisait de face comme un cadre, une porte ou un tableau
// (DA, relecture des captures emc-5e-3) : la caisse étroite en bas, posée dans la main, deux bras plus écartés qui
// montent, la traverse, dont les bouts des bras dépassent comme deux cornes, et entre eux trois cordes de laiton plus
// claires, d'un clair et d'un mi-clair en alternance pour qu'elles se distinguent sans vide entre elles. Ni casque ni
// couronne. Neuf de large, cinq de profond, neuf de haut. Sept couleurs, les yeux compris (proposition de l'artiste
// technique 3D).
const LYRE = fromLayers(
  [
    ['Y..Y.....', 'Y..Y.....', '.........', '.YY......', '..Y......'],
    ['.........', 'YWWY.....', 'YYYY.....', '.Y.......', '.........'],
    ['.........', 'YWWY.....', 'SYYS.....', '.........', '.........'],
    ['...YYLLL.', 'YWWY.....', 'YYYY.....', '.........', '.........'],
    ['....LCKCL', '.YY......', '.SS......', '.........', '.........'],
    ['.YY.LCKCL', 'EYYE.....', 'YSYY.....', '.........', '.........'],
    ['....LCKCL', 'YYYY.....', '.YY......', '.........', '.........'],
    ['....LLLLL', '.........', '.........', '.........', '.........'],
    ['....L...L', '.........', '.........', '.........', '.........'],
  ],
  {
    Y: '#d8aa4a',
    S: '#6e4a26',
    W: '#f0e2b8',
    E: { color: '#1f1a16', top: '#d8aa4a' },
    L: '#8a5a2e',
    // Les cordes : un laiton clair, et la corde du milieu un ton plus soutenu.
    C: '#f6e8b4',
    K: '#e2c27a',
  },
);

// Loquet : un pangolin portier, debout sur ses pattes de derrière (le pangolin marche ainsi), de profil, la tête vers
// les x croissants : le corps couvert d'écailles brun d'olive, un rang sur deux plus clair, le ventre et le museau long
// et fin de peau claire, la queue épaisse posée au sol derrière lui. Il tient de sa patte, du côté de l'élève, la
// grande clé de laiton de la porte, debout, son anneau en haut, son panneton en bas (un outil, jamais une arme). Ni
// casquette ni uniforme ni insigne. Huit de long, quatre de large, neuf de haut. Six couleurs, les yeux compris
// (proposition de l'artiste technique 3D).
const LOQUET = fromLayers(
  [
    ['........', 'SS.DD...', 'SS.DD...', '........'],
    ['........', '.SSSS...', '.SSSS...', '........'],
    ['...LS.KK', '..SSSF..', '..SSSF..', '...LS...'],
    ['...SLDK.', '..LSSF..', '..LSSF..', '...SL...'],
    ['...LS.K.', '..SLSF..', '..SLSF..', '...LS...'],
    ['......KK', '..SSSS..', '..SSSS..', '...SS...'],
    ['........', '...SSFFF', '...SSFFF', '........'],
    ['........', '...LSEF.', '...LSEF.', '........'],
    ['........', '...SL...', '...SL...', '........'],
  ],
  {
    S: '#7e6440',
    L: '#a88a5c',
    F: '#e0bfa0',
    D: '#3e2a1e',
    // L'œil, sur le côté de la tête : sombre de côté, le dessus de peau claire.
    E: { color: '#1f1a16', top: '#e0bfa0' },
    K: '#d6b04a',
  },
);

// Figue : un âne porteur d'eau, à quatre pattes, de profil, la tête vers les x croissants : gris, le museau clair, les
// sabots, la queue et le bout des longues oreilles sombres ; sur le dos, le bât : une sangle sombre et, de chaque côté,
// une jarre de terre cuite, l'eau au col. Sans harnais ni ornement. Neuf de long, quatre de large, neuf de haut. Six
// couleurs, les yeux compris (proposition de l'artiste technique 3D).
const FIGUE = fromLayers(
  [
    ['.........', '.D...D...', '.D...D...', '.........'],
    ['.........', '.G...G...', '.G...G...', '.........'],
    ['..JJ.....', 'DGGGGG...', '.GGGGG...', '..JJ.....'],
    ['..JJ.....', '.GGGGGG..', '.GGGGGG..', '..JJ.....'],
    ['..O......', '..D...G..', '..D...G..', '..O......'],
    ['.........', '......GMM', '......GMM', '.........'],
    ['.........', '......DE.', '......DE.', '.........'],
    ['.........', '......G..', '......G..', '.........'],
    ['.........', '......D..', '......D..', '.........'],
  ],
  {
    G: '#8c8a86',
    M: '#dcd6cc',
    D: '#3e3634',
    E: { color: '#1f1a16', top: '#8c8a86' },
    J: '#c4703e',
    // Le col de la jarre, l'eau dessus.
    O: { color: '#c4703e', top: '#6ea8c8' },
  },
);

// Brio : un macareux orateur, debout, de profil, le bec vers les x croissants : le dos, les ailes et la calotte noirs, le
// plastron et la face blancs, le gros bec orange au bout rouge, les pattes orange. Il se tient droit, prêt à prendre la
// parole, sans pupitre (le pupitre est sa commande) ni insigne. Sept de long, quatre de large, huit de haut. Cinq
// couleurs, les yeux compris (proposition de l'artiste technique 3D).
const BRIO = fromLayers(
  [
    ['.......', '..OOO..', '..OOO..', '.......'],
    ['..KW...', '.KKWW..', '.KKWW..', '..KW...'],
    ['..KW...', '.KKWW..', '.KKWW..', '..KW...'],
    ['.KKW...', '.KKWW..', '.KKWW..', '.KKW...'],
    ['..K....', '.KKWW..', '.KKWW..', '..K....'],
    ['.......', '..KWW..', '..KWW..', '.......'],
    ['.......', '..KWEOR', '..KWEOR', '.......'],
    ['.......', '..KKK..', '..KKK..', '.......'],
  ],
  {
    K: '#2a2a30',
    W: '#f2efe6',
    O: '#e8742a',
    R: '#c8402a',
    // L'œil, sur le côté de la face blanche.
    E: { color: '#1f1a16', top: '#f2efe6' },
  },
);

// Stylet : une huppe scribe, de profil, le bec vers les x croissants : le corps rose orangé, les ailes et la queue
// rayées de noir et de blanc, la huppe orange aux pointes noires, le long bec fin et sombre. Du côté de l'élève, elle
// tient debout sa tablette de cire, la cire claire devant, le cadre de bois dessus. Neuf de long, quatre de large, neuf
// de haut. Huit couleurs, les yeux compris (proposition de l'artiste technique 3D).
const STYLET = fromLayers(
  [
    ['.........', '...D.D...', '...D.D...', '.........'],
    ['.........', '...D.D...', '...D.D...', '.........'],
    ['......T..', '.BBPPP...', '.BBPPP...', '.........'],
    ['..WBWBT..', 'BWBPPPP..', 'BWBPPPP..', '..WBWB...'],
    ['..BWBWT..', '.BWPPPP..', '.BWPPPP..', '..BWBW...'],
    ['.........', '....PPP..', '....PPP..', '.........'],
    ['.........', '....PEPLL', '....PEPLL', '.........'],
    ['.........', '..CCCC...', '..CCCC...', '.........'],
    ['.........', '..BCBC...', '..BCBC...', '.........'],
  ],
  {
    P: '#d89a6a',
    B: '#1f1c1a',
    W: '#f2ece0',
    D: '#4a4440',
    C: '#e08a3a',
    L: '#3a3430',
    // La tablette : la cire de face, le cadre de bois dessus.
    T: { color: '#e0c060', top: '#8a5a34' },
    E: { color: '#1f1a16', top: '#d89a6a' },
  },
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
  'history-6e-antiquity': SILEX,
  'geography-6e-living': BOUSSOLE,
  'history-5e-middle-ages': VELIN,
  'geography-5e-resources': SILLON,
  'history-4e-revolutions': TYPO,
  'geography-4e-globalization': FRET,
  'history-3e-twentieth-century': MEMO,
  'geography-3e-france': JALON,
  'life-earth-sciences-6e-living-world': FOUGERE,
  'physics-chemistry-6e-matter-energy': BULLE,
  'technology-6e-objects': BOULON,
  'civics-6e-democratic-society': VOIX,
  'life-earth-sciences-5e-active-planet': HUMUS,
  'physics-chemistry-5e-matter-universe': PERLE,
  'technology-5e-design': RABOT,
  'civics-5e-equality-solidarity': MIE,
  'life-earth-sciences-4e-cells-evolution': NECTAR,
  'physics-chemistry-4e-signals-circuits': RADAR,
  'technology-4e-modeling': MANIVELLE,
  'civics-4e-rights-freedoms': LOQUET,
  'civics-3e-democratic-life': BRIO,
  'life-earth-sciences-3e-human-body': OLIVE,
  'physics-chemistry-3e-motion-energy': VIRAGE,
  'technology-3e-digital': NAVETTE,
  'english-5e-vocabulary': PUDDING,
  'english-5e-grammar': MOUSTACHE,
  'lv2-5e-introductions': LINA,
  'lv2-4e-daily-life': MUSCADE,
  'english-4e-comprehension': PUCK,
  'english-4e-grammar': VAPEUR,
  'english-3e-comprehension': ECHO,
  'english-3e-grammar': KNIGHT,
  'lv2-3e-travel': TIMBRE,
  'lca-5e-legends': LYRE,
  'lca-4e-cities': FIGUE,
  'lca-3e-ideas': STYLET,
};
