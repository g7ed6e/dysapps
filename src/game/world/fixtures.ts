// Les petites constructions des commandes (GD-7, points 4 et 5 ; PR 3) : la forme que pose une commande livrée chez la
// créature qui l'a demandée. Liste du consultant de Blocland (docs/contenu/<lieu>.md, « ## Les demandes », note
// « > Forme ») avec les corrections du directeur artistique (3 octobre 2026) : le lavoir de Nénu sous trois toits,
// le parasol de Lavi, la glacière de Pudding en coffre (trois glaces au sol, trois tuiles dessus) ; puis ses retouches sur
// captures : les cubes livrés ne changent jamais, seuls ceux de l'île de la créature qui se perdaient sur son sol
// deviennent un bloc de finition (le puits, la grue, la cabane, le perchoir, la banquette, l'équerre ; puis, sans
// exception, le parasol, la pendule, la vitrine, la serre, le pupitre, l'auvent, le mât de relevés, le banc, le
// haut-parleur et la fontaine), et la grue, le pupitre et les poteaux du puits se voient de travers.
// Les noms (« la pendule », « le potager »…) sont ceux du contenu, choisis par le directeur artistique (3 octobre 2026) :
// les identifiants, et donc la sauvegarde, n'en dépendent pas.
//
// Des données seulement, sans coordonnées du monde : chaque cube est en repère propre (x vers la droite, y vers le fond,
// z vers le haut, z = 0 sur le sol, comme dans architect.ts). La place de la forme sur l'île, à côté de la créature,
// est écrite ici (`PLACES`), calculée par la grille et vérifiée par le test (`calculerLaPlaceDeLaPetiteConstruction`,
// world/terrain/fixtureCheck.ts : lisible dans la vue de l'île panneau ouvert, sans rien cacher ;
// voir docs/rendu/style.md, « Les petites constructions »). Les clés de ces cases (`cellKey`) vont dans la sauvegarde : une commande livrée pose
// toutes les cases de sa forme dans `world.parts`, sous l'identifiant de sa petite construction (`<lieu>-fixture-<n>`),
// sans champ nouveau. C'est l'identifiant qui prouve la livraison, pas les clés : une forme redessinée se relit posée,
// avec son dessin d'aujourd'hui (`sanitizeState`, engine/sanitize.ts).
//
// Les règles (testées) : de 4 à 12 cubes, 9 cases au plus (3 × 3), 3 de haut au plus, rien de penché ; un cube en
// porte-à-faux est tenu par le côté, à 2 cubes au plus d'un appui ; un cube du bloc livré par bloc demandé ; les autres
// cubes dans le bloc de l'île de la créature ou un bloc de finition.
import { BLOC, type BlockId } from '../biomes';
import { cellKey, type PlanCell } from './plans';

/** Une forme écrite rang par rang : `[x, y, z, bloc]`. */
type Cube = readonly [number, number, number, BlockId];

const rangee = (x0: number, x1: number, y: number, z: number, b: BlockId): Cube[] => {
  const out: Cube[] = [];
  for (let x = x0; x <= x1; x++) out.push([x, y, z, b]);
  return out;
};
const colonne = (x: number, y: number, z0: number, z1: number, b: BlockId): Cube[] => {
  const out: Cube[] = [];
  for (let z = z0; z <= z1; z++) out.push([x, y, z, b]);
  return out;
};

/** Les formes, par identifiant de petite construction (`fixture` de requests.json). */
const FORMES: Record<string, Cube[]> = {
  // 6e : les Basses Terres.
  // Mousso, le potager : les jardinières de `yard()`, un rang de bois, la terre dessus.
  'french-6e-phonology-fixture-1': [...rangee(0, 2, 0, 0, BLOC.bois), ...rangee(0, 2, 0, 1, BLOC.terre)],
  // Tunel, le puits : l'anneau de `ring()`, briques au milieu des côtés, toits aux coins (la pierre se perdait sur le
  // sol de pierre de la Mine) ; deux poteaux de porte sur les briques de gauche et de droite, vues de la caméra de l'île,
  // qui regarde la Mine le long des x (retouche du directeur artistique) ; de l'eau au milieu (`EAU`).
  'french-6e-letter-confusion-fixture-1': [
    [0, 0, 0, 'roof'],
    [2, 0, 0, 'roof'],
    [0, 2, 0, 'roof'],
    [2, 2, 0, 'roof'],
    [1, 0, 0, BLOC.brique],
    [0, 1, 0, BLOC.brique],
    [2, 1, 0, BLOC.brique],
    [1, 2, 0, BLOC.brique],
    [1, 0, 1, 'door'],
    [1, 2, 1, 'door'],
  ],
  // Rouxel, la grue : un mât de barrières, la flèche de deux poutres, une caisse de portes sous son bout (le sable se
  // perdait sur le sol de la Carrière). La flèche le long des y : la caméra de l'île regarde la Carrière le long des x,
  // elle la voit de travers (retouche du directeur artistique).
  'french-6e-word-spelling-fixture-1': [...colonne(0, 0, 0, 2, 'fence'), [0, 1, 2, BLOC.poutre], [0, 2, 2, BLOC.poutre], [0, 2, 0, 'door']],
  // Bloquette, le bac à eau : deux poteaux de terre, deux galets entre eux.
  'french-6e-grammar-spelling-fixture-1': [
    ...colonne(0, 0, 0, 1, BLOC.terre),
    ...colonne(3, 0, 0, 1, BLOC.terre),
    [1, 0, 0, BLOC.galet],
    [2, 0, 0, BLOC.galet],
  ],
  // Grimoire, le poteau-lanterne : un socle de deux obsidiennes, un poteau d'obsidienne, la lanterne dessus.
  'french-6e-reading-fixture-1': [
    [0, 0, 0, BLOC.obsidienne],
    [1, 0, 0, BLOC.obsidienne],
    [0, 0, 1, BLOC.obsidienne],
    [0, 0, 2, 'lantern'],
  ],
  // Coco, la boutique : un comptoir de bois devant, deux poteaux de brique derrière, l'auvent rayé.
  'maths-6e-calculation-fixture-1': [
    ...rangee(0, 2, 0, 0, BLOC.bois),
    ...colonne(0, 1, 0, 1, BLOC.brique),
    ...colonne(2, 1, 0, 1, BLOC.brique),
    [0, 1, 2, 'roof'],
    [1, 1, 2, BLOC.brique],
    [2, 1, 2, 'roof'],
  ],
  // Nénu, le lavoir : deux poteaux de pierre au fond, un bassin de deux galets, trois toits (correction du DA).
  'maths-6e-fractions-fixture-1': [
    ...colonne(0, 1, 0, 1, BLOC.pierre),
    ...colonne(2, 1, 0, 1, BLOC.pierre),
    [1, 1, 0, BLOC.galet],
    [1, 0, 0, BLOC.galet],
    ...rangee(0, 2, 1, 2, 'roof'),
  ],
  // Lavi, le parasol (correction du DA) : un mât d'obsidienne au pied de barrière (l'obsidienne se perdait sur le sol
  // d'obsidienne de la Lagune), quatre cabines en croix autour de son sommet.
  'maths-6e-decimals-fixture-1': [
    [1, 1, 0, 'fence'],
    ...colonne(1, 1, 1, 2, BLOC.obsidienne),
    [0, 1, 2, BLOC.cabine],
    [2, 1, 2, BLOC.cabine],
    [1, 0, 2, BLOC.cabine],
    [1, 2, 2, BLOC.cabine],
  ],
  // Robin, la pendule : deux piliers de cabine sur un pied de deux portes (la cabine se perdait sur le sol de cabines),
  // deux cadrans dessus.
  'english-6e-vocabulary-fixture-1': [...rangee(0, 1, 0, 0, 'door'), ...rangee(0, 1, 0, 1, BLOC.cabine), [0, 0, 2, BLOC.cadran], [1, 0, 2, BLOC.cadran]],
  // Tick, la vitrine : un soubassement de portes (les cadrans se perdaient sur le sol de cadrans), trois verres, trois toits.
  'english-6e-grammar-fixture-1': [...rangee(0, 2, 0, 0, 'door'), ...rangee(0, 2, 0, 1, BLOC.verre), ...rangee(0, 2, 0, 2, 'roof')],
  // Silex, le tamis (DA, HG-2) : trois sables en ligne au sol, entre deux poteaux de barrière, symétriques de part et
  // d'autre du milieu de la rangée (consultant Blocland, retouches HG-2).
  'history-6e-antiquity-fixture-1': [...rangee(0, 2, 1, 0, BLOC.sable), [1, 0, 0, 'fence'], [1, 2, 0, 'fence']],
  // Boussole, la placette (DA, HG-2) : quatre mosaïques en carré au sol, une barrière au coin, une lanterne dessus.
  'geography-6e-living-fixture-1': [...rangee(0, 1, 0, 0, BLOC.mosaique), ...rangee(0, 1, 1, 0, BLOC.mosaique), [2, 2, 0, 'fence'], [2, 2, 1, 'lantern']],
  // Fougère, le nichoir (DA, SC-2) : un poteau de barrière, trois chaumes en ligne dessus, un toit au milieu.
  'life-earth-sciences-6e-living-world-fixture-1': [[1, 0, 0, 'fence'], ...rangee(0, 2, 0, 1, BLOC.chaume), [1, 0, 2, 'roof']],
  // Bulle, l'étagère à flacons (DA, SC-2) : un casier de trois cartons au sol, deux montants d'aimant aux bouts, une
  // lanterne entre eux. Le carton remplace le verre, déjà demandé dans l'archipel (docs/contenu, à valider par le DA).
  'physics-chemistry-6e-matter-energy-fixture-1': [...rangee(0, 2, 0, 0, BLOC.carton), [0, 0, 1, BLOC.aimant], [1, 0, 1, 'lantern'], [2, 0, 1, BLOC.aimant]],
  // Pince, l'établi (DA, SC-2) : un plateau de trois cartons sur deux pieds de barrière, la barre de trois aimants
  // dessus. L'aimant remplace le bois, déjà demandé dans l'archipel (docs/contenu, à valider par le DA).
  'technology-6e-objects-fixture-1': [[0, 0, 0, 'fence'], [2, 0, 0, 'fence'], ...rangee(0, 2, 0, 1, BLOC.carton), ...rangee(0, 2, 0, 2, BLOC.aimant)],

  // Les objets posés à la fin des quêtes de 6e (GD-10, consultant Blocland ; docs/contenu/quetes.md).
  // Mousso, la lanterne : un banc de trois bois, une barrière au milieu, la lanterne dessus.
  'french-6e-phonology-fixture-2': [...rangee(0, 2, 0, 0, BLOC.bois), [1, 0, 1, 'fence'], [1, 0, 2, 'lantern']],
  // Bloquette, le portillon de son pré : une porte sur un seuil de galet, entre deux poteaux de galets coiffés d'une
  // barrière (les trois galets donnés à Rouxel, consultant de Blocland).
  'french-6e-grammar-spelling-fixture-2': [
    [0, 0, 0, BLOC.galet],
    [0, 0, 1, 'fence'],
    [1, 0, 0, BLOC.galet],
    [1, 0, 1, 'door'],
    [2, 0, 0, BLOC.galet],
    [2, 0, 1, 'fence'],
  ],
  // Grimoire, l'escalier : trois marches de un à trois de haut, tenues par les trois aimants donnés à Pince (le verre
  // se perdait sur le sol de verre de la Tour ; consultant de Blocland).
  'french-6e-reading-fixture-2': [
    [0, 0, 0, 'stairs'],
    [1, 0, 0, BLOC.aimant],
    [1, 0, 1, 'stairs'],
    [2, 0, 0, BLOC.aimant],
    [2, 0, 1, BLOC.aimant],
    [2, 0, 2, 'stairs'],
  ],

  // 5e : les Collines du Large.
  // Frimas, la cabane : des murs de portes sur deux rangs (la glace se perdait sur le sol de glace du Glacier,
  // retouche du directeur artistique), une porte vide devant à gauche, un toit de tuiles.
  'maths-5e-signed-numbers-fixture-1': [
    [1, 0, 0, 'door'],
    [0, 1, 0, 'door'],
    [1, 1, 0, 'door'],
    [0, 0, 1, 'door'],
    [1, 0, 1, 'door'],
    [0, 1, 1, 'door'],
    [1, 1, 1, 'door'],
    ...rangee(0, 1, 0, 2, BLOC.tuile),
    ...rangee(0, 1, 1, 2, BLOC.tuile),
  ],
  // Bazar, l'étagère : une marche de panneaux devant, deux rangs de toile derrière.
  'maths-5e-proportionality-fixture-1': [...rangee(0, 2, 0, 0, BLOC.panneau), ...rangee(0, 2, 1, 0, BLOC.toile), ...rangee(0, 2, 1, 1, BLOC.toile)],
  // Sema, le poteau indicateur : un poteau de lambris, deux panneaux de part et d'autre de son sommet.
  'french-5e-homophones-fixture-1': [...colonne(1, 0, 0, 2, BLOC.lambris), [0, 0, 2, BLOC.panneau], [2, 0, 2, BLOC.panneau]],
  // Kroa, l'abri : deux poteaux de tourbe au fond, un auvent de 3 × 2 (toile, tourbe, toile) qui déborde devant.
  'french-5e-conjugation-fixture-1': [
    ...colonne(0, 1, 0, 1, BLOC.tourbe),
    ...colonne(2, 1, 0, 1, BLOC.tourbe),
    [0, 0, 2, BLOC.toile],
    [0, 1, 2, BLOC.toile],
    [2, 0, 2, BLOC.toile],
    [2, 1, 2, BLOC.toile],
    [1, 0, 2, BLOC.tourbe],
    [1, 1, 2, BLOC.tourbe],
  ],
  // Pudding, la glacière (correction du DA) : trois glaces au sol, trois tuiles dessus en couvercle.
  'english-5e-vocabulary-fixture-1': [...rangee(0, 2, 0, 0, BLOC.glace), ...rangee(0, 2, 0, 1, BLOC.tuile)],
  // Moustache, la serre : deux portes (le lambris se perdait sur le sol de lambris), deux vitraux, deux toits.
  'english-5e-grammar-fixture-1': [...rangee(0, 1, 0, 0, 'door'), ...rangee(0, 1, 0, 1, BLOC.vitrail), ...rangee(0, 1, 0, 2, 'roof')],

  // Vélin, l'écritoire (HG-3) : un pied de trois tourbes en ligne au sol, le plateau d'enluminure (le bloc de l'île : le
  // bois du contenu n'est ni de l'île ni de finition) sur celle du milieu, la lanterne sur celle du bout.
  'history-5e-middle-ages-fixture-1': [...rangee(0, 2, 0, 0, BLOC.tourbe), [1, 0, 1, BLOC.enluminure], [2, 0, 1, 'lantern']],
  // Sillon, le coffre à graines (HG-3, retouche du consultant Blocland) : quatre enluminures au sol en carré de 2 × 2,
  // la lanterne sur une enluminure du fond ; sans eau.
  'geography-5e-resources-fixture-1': [...rangee(0, 1, 0, 0, BLOC.enluminure), ...rangee(0, 1, 1, 0, BLOC.enluminure), [1, 1, 1, 'lantern']],
  // Les objets posés à la fin des quêtes de 5e (GD-10, directeur artistique et consultant de Blocland ; docs/contenu/quetes.md).
  // Pudding, la tente : un triangle de toile devant, l'entrée au milieu, le faîte qui part vers le fond, tenu par un mât
  // de barrière ; un cube par toile donnée à Bazar (consultant de Blocland), aucune tuile sur le sol de tuile du Comptoir.
  'english-5e-vocabulary-fixture-2': [
    [0, 0, 0, BLOC.toile],
    [1, 0, 0, 'door'],
    [2, 0, 0, BLOC.toile],
    [1, 0, 1, BLOC.toile],
    [1, 1, 0, 'fence'],
    [1, 1, 1, BLOC.toile],
  ],
  // Vélin, le four à pain : deux sur deux, la bouche devant, le conduit au fond ; un cube par tuile donnée à Moustache.
  'history-5e-middle-ages-fixture-2': [[0, 0, 0, 'door'], [1, 0, 0, BLOC.tuile], ...rangee(0, 1, 1, 0, BLOC.tuile), [1, 1, 1, BLOC.tuile]],
  // Frimas, la balise, sœur du phare du large : un socle de deux sur deux, les quatre panneaux donnés à Sema, sur un coin
  // la glace (jamais au sol, le sol du Glacier est de glace), la lanterne au sommet. Le socle en croix du consultant de
  // Blocland, trois sur trois, ne trouve pas de place à côté de Frimas.
  'maths-5e-signed-numbers-fixture-2': [...rangee(0, 1, 0, 0, BLOC.panneau), ...rangee(0, 1, 1, 0, BLOC.panneau), [1, 1, 1, BLOC.glace], [1, 1, 2, 'lantern']],

  // 4e : les Monts de Feu.
  // Braise, le wagonnet : une voie de trois rails, un wagonnet de deux aciers.
  'maths-4e-powers-fixture-1': [...rangee(0, 2, 0, 0, BLOC.rail), [0, 0, 1, BLOC.acier], [1, 0, 1, BLOC.acier]],
  // Ixe, la machine : deux poteaux de calque, deux engrenages empilés entre eux.
  'maths-4e-algebra-fixture-1': [...colonne(0, 0, 0, 1, BLOC.calque), ...colonne(2, 0, 0, 1, BLOC.calque), ...colonne(1, 0, 0, 1, BLOC.engrenage)],
  // Cléa, le perchoir : trois marches de 1, 2 et 3 cubes, l'escalier dessous (l'ardoise se perdait sur le sol d'ardoise
  // de la Falaise, retouche du directeur artistique), un acier sur chaque marche.
  'french-4e-agreement-fixture-1': [
    [0, 0, 0, BLOC.acier],
    [1, 0, 0, 'stairs'],
    [1, 0, 1, BLOC.acier],
    [2, 0, 0, 'stairs'],
    [2, 0, 1, 'stairs'],
    [2, 0, 2, BLOC.acier],
  ],
  // Plume, la banquette : une assise de deux velours devant, un dossier de 2 × 2 portes derrière (le parchemin se perdait
  // sur le sol de parchemin du Cabinet, retouche du directeur artistique).
  'french-4e-vocabulary-fixture-1': [...rangee(0, 1, 0, 0, BLOC.velours), ...rangee(0, 1, 1, 0, 'door'), ...rangee(0, 1, 1, 1, 'door')],
  // Puck, le pupitre du souffleur : un pied d'une barrière (le velours se perdait sur le sol de velours du Théâtre) et
  // d'un velours, une tablette de trois parchemins, le long des y : la caméra de l'île regarde le Théâtre le long des x,
  // elle la voit de travers (retouche du directeur artistique).
  'english-4e-comprehension-fixture-1': [[0, 1, 0, 'fence'], [0, 1, 1, BLOC.velours], [0, 0, 2, BLOC.parchemin], [0, 1, 2, BLOC.parchemin], [0, 2, 2, BLOC.parchemin]],
  // Vapeur, l'auvent : deux poteaux de rail au pied de barrière (le rail se perdait sur le sol de rails de la Gare), un
  // toit de trois calques.
  'english-4e-grammar-fixture-1': [[0, 0, 0, 'fence'], [0, 0, 1, BLOC.rail], [2, 0, 0, 'fence'], [2, 0, 1, BLOC.rail], ...rangee(0, 2, 0, 2, BLOC.calque)],

  // Typo, le réverbère (HG-3) : un mât de deux ardoises, la lanterne au sommet, la troisième ardoise en socle au pied
  // et une barrière de l'autre côté (trois de haut au plus : le contenu en demandait quatre).
  'history-4e-revolutions-fixture-1': [[0, 0, 0, 'fence'], ...colonne(1, 0, 0, 1, BLOC.ardoise), [1, 0, 2, 'lantern'], [2, 0, 0, BLOC.ardoise]],
  // Fret, le treuil (HG-3) : deux poteaux de deux fontes aux bouts, l'axe d'une barrière entre eux en haut (le bois du
  // contenu n'est ni de l'île ni de finition).
  'geography-4e-globalization-fixture-1': [...colonne(0, 0, 0, 1, BLOC.fonte), ...colonne(2, 0, 0, 1, BLOC.fonte), [1, 0, 1, 'fence']],
  // Les îles de sciences de 5e à 3e (SC-3), d'après la forme décidée par le directeur artistique (docs/contenu, « > Forme »).
  // Humus, le composteur : un U de trois bambous au sol (deux bras devant, le fond derrière), une barrière au fond.
  'life-earth-sciences-5e-active-planet-fixture-1': [[0, 0, 0, BLOC.bambou], [2, 0, 0, BLOC.bambou], [1, 1, 0, BLOC.bambou], [1, 2, 0, 'fence']],
  // Perle, le filtre : deux strates sur deux barrières, la troisième au milieu, tenue par les deux autres.
  'physics-chemistry-5e-matter-universe-fixture-1': [[0, 0, 0, 'fence'], [2, 0, 0, 'fence'], ...rangee(0, 2, 0, 1, BLOC.strate)],
  // Rabot, la salière : trois sels en colonne, un toit dessus (DA, relecture des captures : deux sels et le troisième à
  // leur pied ne faisaient pas une salière) ; quatre de haut, la seule à dépasser trois. Sa place est voulue
  // (`WANTED_PLACES`).
  'technology-5e-design-fixture-1': [...colonne(0, 0, 0, 2, BLOC.sel), [0, 0, 3, 'roof']],
  // Nectar, la jardinière : trois lièges en rang (trois cases de large au plus : les barrières se posent sur les lièges
  // des bouts, pas à côté).
  'life-earth-sciences-4e-cells-evolution-fixture-1': [...rangee(0, 2, 0, 0, BLOC.liege), [0, 0, 1, 'fence'], [2, 0, 1, 'fence']],
  // Radar, l'estrade : deux rangs de deux conteneurs, un escalier devant.
  'physics-chemistry-4e-signals-circuits-fixture-1': [...rangee(0, 1, 1, 0, BLOC.conteneur), ...rangee(0, 1, 2, 0, BLOC.conteneur), [0, 0, 0, 'stairs']],
  // Manivelle, le moteur : deux bobines au sol aux bouts, la troisième dessus, au milieu, sur une barrière (quatre
  // cubes au moins).
  'technology-4e-modeling-fixture-1': [[0, 0, 0, BLOC.bobine], [2, 0, 0, BLOC.bobine], [1, 0, 0, 'fence'], [1, 0, 1, BLOC.bobine]],
  // Olive, la veilleuse : deux cires en colonne, une lanterne dessus (sans flamme), un savon à son pied (quatre cubes au
  // moins).
  'life-earth-sciences-3e-human-body-fixture-1': [...colonne(0, 0, 0, 1, BLOC.cire), [0, 0, 2, 'lantern'], [1, 0, 0, BLOC.savon]],
  // Virage, le portique : deux poteaux de deux grès roses, une barrière en travers en haut.
  'physics-chemistry-3e-motion-energy-fixture-1': [...colonne(0, 0, 0, 1, BLOC.gres), ...colonne(2, 0, 0, 1, BLOC.gres), [1, 0, 1, 'fence']],
  // Navette, le carillon : deux ressorts en colonne, un toit de deux cubes dessus, qui déborde d'un côté (quatre cubes au
  // moins).
  'technology-3e-digital-fixture-1': [...colonne(0, 0, 0, 1, BLOC.ressort), [0, 0, 2, 'roof'], [1, 0, 2, 'roof']],

  // 3e : les Îles du Ciel.
  // Théo, l'équerre : une branche debout de trois prismes, une branche couchée de deux portes (le marbre se perdait sur
  // le sol de marbre du Belvédère, retouche du directeur artistique).
  'maths-3e-geometry-fixture-1': [...colonne(0, 0, 0, 2, BLOC.prisme), [1, 0, 0, 'door'], [2, 0, 0, 'door']],
  // Stat, le mât de relevés : un socle de deux marches d'escalier (le quartz se perdait sur le sol de quartz), un mât de
  // deux antennes.
  'maths-3e-statistics-fixture-1': [[0, 0, 0, 'stairs'], [1, 0, 0, 'stairs'], ...colonne(0, 0, 1, 2, BLOC.antenne)],
  // Fi, le réflecteur : un socle de deux prismes, deux miroirs, un cadre de deux prismes.
  'maths-3e-functions-fixture-1': [...rangee(0, 1, 0, 0, BLOC.prisme), ...rangee(0, 1, 0, 1, BLOC.miroir), ...rangee(0, 1, 0, 2, BLOC.prisme)],
  // Astra, le banc : deux pieds de barrière (la lentille se perdait sur le sol de lentilles), une assise de trois pierres
  // de taille.
  'french-3e-close-reading-fixture-1': [[0, 0, 0, 'fence'], [2, 0, 0, 'fence'], ...rangee(0, 2, 0, 1, BLOC.taille)],
  // Écho, le haut-parleur : un caisson de deux portes (l'antenne se perdait sur le sol d'antennes), deux lentilles dessus.
  'english-3e-comprehension-fixture-1': [...rangee(0, 1, 0, 0, 'door'), ...rangee(0, 1, 0, 1, BLOC.lentille)],
  // Knight, la fontaine : un bassin en U de cinq barrières (la pierre de taille se perdait sur le sol de pierre de taille,
  // puis l'escalier beige sur ce sol beige : le bois brun de la barrière, déjà dessiné en 3e, arbitrage du directeur
  // artistique), une colonne de deux marbres au milieu.
  'english-3e-grammar-fixture-1': [[0, 0, 0, 'fence'], [2, 0, 0, 'fence'], ...rangee(0, 2, 1, 0, 'fence'), ...colonne(1, 0, 0, 1, BLOC.marbre)],
  // Mémo, le pupitre (HG-3) : deux quartz côte à côte au fond, un troisième sur l'un d'eux (le plateau), la marche
  // devant (un escalier : le bois du contenu n'est ni de l'île ni de finition), la lanterne à côté.
  'history-3e-twentieth-century-fixture-1': [[0, 1, 0, BLOC.quartz], [1, 1, 0, BLOC.quartz], [1, 1, 1, BLOC.quartz], [1, 0, 0, 'stairs'], [0, 0, 0, 'lantern']],
  // Jalon, la boîte à livres (HG-3, retouches du consultant Blocland et du DA) : trois reliures en rang au sol, comme une
  // étagère, la lanterne sur celle du milieu ; sans eau. Le rang va le long des y : la caméra du Plateau regarde l'île
  // le long des x (`viewYaw`, −40°), elle le voit de face. Sa place est voulue (`WANTED_PLACES`).
  'geography-3e-france-fixture-1': [[0, 0, 0, BLOC.reliure], [0, 1, 0, BLOC.reliure], [0, 2, 0, BLOC.reliure], [0, 1, 1, 'lantern']],
};

/**
 * L'eau d'une petite construction, en repère propre : un cube d'eau du terrain (la texture de l'eau des îles, aucun
 * matériau de plus), posé avec elle, hors de ses cases (il ne compte ni parmi ses cubes ni dans la sauvegarde). Le puits
 * de Tunel, plein jusqu'à la margelle (retouche du directeur artistique).
 */
const EAU: Record<string, readonly (readonly [number, number, number])[]> = {
  'french-6e-letter-confusion-fixture-1': [[1, 1, 0]],
};

/** L'eau d'une petite construction (voir `EAU`), vide sans eau. */
export function eauDeLaPetiteConstruction(id: string): readonly (readonly [number, number, number])[] {
  return EAU[id] ?? [];
}

/** Les cases d'une petite construction, en repère propre, avec leur clé de sauvegarde. */
export type CaseDePetiteConstruction = PlanCell & { key: string };

const CASES = new Map<string, CaseDePetiteConstruction[]>(
  Object.entries(FORMES).map(([id, cubes]) => [id, cubes.map(([x, y, z, block]) => ({ x, y, z, block, key: cellKey(x, y, z) }))]),
);

/** Les identifiants des petites constructions qui ont une forme. */
export const PETITES_CONSTRUCTIONS: readonly string[] = [...CASES.keys()];

/** Les cases d'une petite construction (`<lieu>-fixture-<n>`), ou `undefined` pour un identifiant inconnu. */
export function casesDeLaPetiteConstruction(id: string): readonly CaseDePetiteConstruction[] | undefined {
  return CASES.get(id);
}

/**
 * Une petite construction est posée quand son identifiant a des cases dans `world.parts` : l'identifiant prouve la
 * livraison, et la relecture de la sauvegarde y remet toujours la forme d'aujourd'hui tout entière.
 */
export function estPosee(parts: Record<string, string[]>, id: string): boolean {
  return CASES.has(id) && (parts[id]?.length ?? 0) > 0;
}

/**
 * La place de chaque petite construction sur son île : le coin (x, y) de sa forme, relatif au cœur de l'île. Des données
 * fixes, pour que « Livrer » ne calcule rien : `calculerLaPlaceDeLaPetiteConstruction`
 * (world/terrain/fixtureCheck.ts) les refait et le test les compare, pour chaque LV2 (fixtures.test.ts) ; une île ou une forme qui change les fait changer.
 */
const PLACES: Record<string, readonly [number, number]> = {
  'french-6e-phonology-fixture-1': [-1, 5],
  'french-6e-letter-confusion-fixture-1': [10, 1],
  'french-6e-word-spelling-fixture-1': [1, 12],
  'french-6e-grammar-spelling-fixture-1': [9, 4],
  'french-6e-reading-fixture-1': [7, 9],
  // Les objets des quêtes (GD-10), après la commande de l'île.
  'french-6e-phonology-fixture-2': [3, 19],
  'french-6e-grammar-spelling-fixture-2': [14, 5],
  'french-6e-reading-fixture-2': [10, 3],
  'maths-6e-calculation-fixture-1': [9, 3],
  'maths-6e-fractions-fixture-1': [-1, 11],
  'maths-6e-decimals-fixture-1': [5, 12],
  'maths-5e-signed-numbers-fixture-1': [10, 3],
  'maths-5e-signed-numbers-fixture-2': [6, 12],
  'maths-5e-proportionality-fixture-1': [-1, 4],
  'french-5e-homophones-fixture-1': [10, 4],
  'french-5e-conjugation-fixture-1': [-3, 12],
  'maths-4e-powers-fixture-1': [9, 4],
  'maths-4e-algebra-fixture-1': [5, 19],
  'french-4e-agreement-fixture-1': [4, 11],
  'french-4e-vocabulary-fixture-1': [6, 10],
  'maths-3e-geometry-fixture-1': [10, 3],
  'maths-3e-statistics-fixture-1': [2, 10],
  'maths-3e-functions-fixture-1': [6, 19],
  'french-3e-close-reading-fixture-1': [5, 11],
  'english-6e-vocabulary-fixture-1': [8, 6],
  'english-6e-grammar-fixture-1': [10, 9],
  'history-6e-antiquity-fixture-1': [0, 10],
  'geography-6e-living-fixture-1': [-1, 11],
  'history-5e-middle-ages-fixture-1': [1, 10],
  'history-5e-middle-ages-fixture-2': [5, 10],
  'geography-5e-resources-fixture-1': [2, 10],
  'history-4e-revolutions-fixture-1': [8, 6],
  'geography-4e-globalization-fixture-1': [10, 3],
  'history-3e-twentieth-century-fixture-1': [10, 3],
  'geography-3e-france-fixture-1': [14, 4],
  'life-earth-sciences-6e-living-world-fixture-1': [3, 9],
  'physics-chemistry-6e-matter-energy-fixture-1': [1, 11],
  'technology-6e-objects-fixture-1': [8, 6],
  'english-5e-vocabulary-fixture-1': [4, 11],
  'english-5e-vocabulary-fixture-2': [8, 3],
  'english-5e-grammar-fixture-1': [10, 3],
  'english-4e-comprehension-fixture-1': [7, 9],
  'english-4e-grammar-fixture-1': [8, 9],
  'english-3e-comprehension-fixture-1': [0, 12],
  'english-3e-grammar-fixture-1': [1, 10],
  'life-earth-sciences-5e-active-planet-fixture-1': [1, 10],
  'physics-chemistry-5e-matter-universe-fixture-1': [1, 11],
  'technology-5e-design-fixture-1': [10, 3],
  'life-earth-sciences-4e-cells-evolution-fixture-1': [11, 3],
  'physics-chemistry-4e-signals-circuits-fixture-1': [8, 3],
  'technology-4e-modeling-fixture-1': [2, 11],
  'life-earth-sciences-3e-human-body-fixture-1': [6, 12],
  'physics-chemistry-3e-motion-energy-fixture-1': [-1, 12],
  'technology-3e-digital-fixture-1': [5, 3],
};

/**
 * Les places voulues (relecture des captures) : le calcul (`calculerLaPlaceDeLaPetiteConstruction`) garde celle-ci si
 * elle tient toutes ses règles, avant de chercher. Au Plateau des territoires, la boîte à livres de Jalon se posait
 * derrière la mairie, cachée dans la vue de l'île : le calcul ne voit pas les bâtiments des îles des 5e, 4e et 3e (il
 * ouvre les îles par les ouvrages, sans les voyages ; corrigé, il déplacerait presque toutes leurs petites constructions,
 * à décider à part). Elle se pose donc sur l'herbe dégagée devant Jalon, à plus d'une case de lui, le rang face à la
 * caméra, loin de la façade (consultant Blocland, DA, HG-3).
 */
const WANTED_PLACES: Record<string, readonly [number, number]> = {
  'geography-3e-france-fixture-1': [14, 4],
  // À la Menuiserie des objets (SC-3), la salière de Rabot se posait derrière la scierie, pour la même raison : elle
  // avance sur l'herbe dégagée devant, entre les bornes et l'arbre, vue de la caméra de l'île (DA, relecture des captures).
  'technology-5e-design-fixture-1': [10, 3],
  // À la Ruche des réseaux (SC-3), Navette couchée de profil a changé de place, et le calcul posait le carillon derrière
  // le poste : il se pose devant, sur l'herbe dégagée entre les bornes et la ruche, vu de la caméra de l'île.
  'technology-3e-digital-fixture-1': [5, 3],
  // À la Source du vivant (SC-3), Nectar de profil occupe la place d'avant, et le calcul posait la jardinière derrière
  // lui, aux trois quarts cachée : elle se pose à l'est, sur l'herbe dégagée, entière à l'écran ; ses cases figées au sol
  // y coûtent aussi moins que derrière Nectar (les commandes du 4e restent dans leur enveloppe, budget.ts).
  'life-earth-sciences-4e-cells-evolution-fixture-1': [11, 3],
  // À la Ferme des accords (GD-10), le calcul posait le portillon de Bloquette contre la maison, derrière la commande et
  // les bornes : ses galets disparaissaient derrière les blocs jaunes, la porte sur le mur brun. Il se pose sur l'herbe
  // nue, à gauche du bac de la commande à l'écran, entier, à huit cases de Bloquette (DA et consultant Blocland, relecture des
  // captures). Le calcul ne cherche pas si loin : seule la place voulue l'y met.
  'french-6e-grammar-spelling-fixture-2': [14, 5],
};

/** La place voulue d'une petite construction (voir `WANTED_PLACES`), ou `null`. */
export function wantedPlace(id: string): { x: number; y: number } | null {
  const p = WANTED_PLACES[id];
  return p ? { x: p[0], y: p[1] } : null;
}

/** La place écrite d'une petite construction (voir `PLACES`), ou `null` pour un identifiant inconnu. */
export function placeEcrite(id: string): { x: number; y: number } | null {
  const p = PLACES[id];
  return p ? { x: p[0], y: p[1] } : null;
}
