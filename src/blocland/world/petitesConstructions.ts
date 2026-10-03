// Les petites constructions des commandes (GD-7, points 4 et 5 ; PR 3) : la forme que pose une commande livrée chez la
// créature qui l'a demandée. Liste du consultant de Blocland (docs/contenu/<lieu>.md, « ## Les demandes », note
// « > Forme ») avec les corrections du directeur artistique (3 octobre 2026) : le lavoir de Nénu sous trois toits,
// l'abri de Lavi, la glacière de Pudding en coffre (trois glaces au sol, trois tuiles dessus).
//
// Des données seulement, sans coordonnées du monde : chaque cube est en repère propre (x vers la droite, y vers le fond,
// z vers le haut, z = 0 sur le sol, comme dans architect.ts). La place de la forme sur l'île, à côté de la créature,
// est calculée par la grille (`placeDeLaPetiteConstruction`, world/terrain.ts) ; l'artiste technique 3D reprendra la
// place exacte et le dessin. Les clés de ces cases (`cellKey`) sont celles de la sauvegarde : une commande livrée pose
// toutes les cases de sa forme dans `world.parts`, sous l'identifiant de sa petite construction (`<lieu>-fixture-<n>`),
// sans champ nouveau. Elles ne changent donc jamais.
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
  // Mousso, le carré de semis : les jardinières de `yard()`, un rang de bois, la terre dessus.
  'french-6e-phonology-fixture-1': [...rangee(0, 2, 0, 0, BLOC.bois), ...rangee(0, 2, 0, 1, BLOC.terre)],
  // Tunel, le puits : l'anneau de `ring()`, briques au milieu des côtés, pierres aux coins, deux barrières.
  'french-6e-letter-confusion-fixture-1': [
    [0, 0, 0, BLOC.pierre],
    [2, 0, 0, BLOC.pierre],
    [0, 2, 0, BLOC.pierre],
    [2, 2, 0, BLOC.pierre],
    [1, 0, 0, BLOC.brique],
    [0, 1, 0, BLOC.brique],
    [2, 1, 0, BLOC.brique],
    [1, 2, 0, BLOC.brique],
    [0, 1, 1, 'fence'],
    [2, 1, 1, 'fence'],
  ],
  // Rouxel, la grue : un mât de sable, la flèche de deux poutres, une charge de sable sous son bout.
  'french-6e-word-spelling-fixture-1': [...colonne(0, 0, 0, 2, BLOC.sable), [1, 0, 2, BLOC.poutre], [2, 0, 2, BLOC.poutre], [2, 0, 0, BLOC.sable]],
  // Bloquette, l'abreuvoir : deux poteaux de terre, deux galets entre eux.
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
  // Coco, l'étal : un comptoir de bois devant, deux poteaux de brique derrière, l'auvent rayé.
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
  // Lavi, l'abri (correction du DA) : un mât d'obsidienne, quatre cabines en croix autour de son sommet.
  'maths-6e-decimals-fixture-1': [
    ...colonne(1, 1, 0, 2, BLOC.obsidienne),
    [0, 1, 2, BLOC.cabine],
    [2, 1, 2, BLOC.cabine],
    [1, 0, 2, BLOC.cabine],
    [1, 2, 2, BLOC.cabine],
  ],
  // Robin, l'horloge du quai : deux piliers de cabine, deux cadrans dessus.
  'english-6e-vocabulary-fixture-1': [...colonne(0, 0, 0, 1, BLOC.cabine), ...colonne(1, 0, 0, 1, BLOC.cabine), [0, 0, 2, BLOC.cadran], [1, 0, 2, BLOC.cadran]],
  // Tick, la vitrine : un soubassement de cadrans, trois verres, trois toits.
  'english-6e-grammar-fixture-1': [...rangee(0, 2, 0, 0, BLOC.cadran), ...rangee(0, 2, 0, 1, BLOC.verre), ...rangee(0, 2, 0, 2, 'roof')],

  // 5e : les Collines du Large.
  // Frimas, la cabane de pêche : des murs de glace sur deux rangs, une porte vide devant à gauche, un toit de tuiles.
  'maths-5e-signed-numbers-fixture-1': [
    [1, 0, 0, BLOC.glace],
    [0, 1, 0, BLOC.glace],
    [1, 1, 0, BLOC.glace],
    [0, 0, 1, BLOC.glace],
    [1, 0, 1, BLOC.glace],
    [0, 1, 1, BLOC.glace],
    [1, 1, 1, BLOC.glace],
    ...rangee(0, 1, 0, 2, BLOC.tuile),
    ...rangee(0, 1, 1, 2, BLOC.tuile),
  ],
  // Bazar, le présentoir : une marche de panneaux devant, deux rangs de toile derrière.
  'maths-5e-proportionality-fixture-1': [...rangee(0, 2, 0, 0, BLOC.panneau), ...rangee(0, 2, 1, 0, BLOC.toile), ...rangee(0, 2, 1, 1, BLOC.toile)],
  // Sema, le poteau indicateur : un poteau de lambris, deux panneaux de part et d'autre de son sommet.
  'french-5e-homophones-fixture-1': [...colonne(1, 0, 0, 2, BLOC.lambris), [0, 0, 2, BLOC.panneau], [2, 0, 2, BLOC.panneau]],
  // Kroa, l'abri du gué : deux poteaux de tourbe au fond, un auvent de 3 × 2 (toile, tourbe, toile) qui déborde devant.
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
  // Moustache, la serre : deux lambris, deux vitraux, deux toits.
  'english-5e-grammar-fixture-1': [...rangee(0, 1, 0, 0, BLOC.lambris), ...rangee(0, 1, 0, 1, BLOC.vitrail), ...rangee(0, 1, 0, 2, 'roof')],

  // 4e : les Monts de Feu.
  // Braise, le wagonnet : une voie de trois rails, un wagonnet de deux aciers.
  'maths-4e-powers-fixture-1': [...rangee(0, 2, 0, 0, BLOC.rail), [0, 0, 1, BLOC.acier], [1, 0, 1, BLOC.acier]],
  // Ixe, le treuil : deux poteaux de calque, deux engrenages empilés entre eux.
  'maths-4e-algebra-fixture-1': [...colonne(0, 0, 0, 1, BLOC.calque), ...colonne(2, 0, 0, 1, BLOC.calque), ...colonne(1, 0, 0, 1, BLOC.engrenage)],
  // Cléa, le perchoir : trois marches de 1, 2 et 3 cubes, l'ardoise dessous, un acier sur chaque marche.
  'french-4e-agreement-fixture-1': [
    [0, 0, 0, BLOC.acier],
    [1, 0, 0, BLOC.ardoise],
    [1, 0, 1, BLOC.acier],
    [2, 0, 0, BLOC.ardoise],
    [2, 0, 1, BLOC.ardoise],
    [2, 0, 2, BLOC.acier],
  ],
  // Plume, la banquette : une assise de deux velours devant, un dossier de 2 × 2 parchemins derrière.
  'french-4e-vocabulary-fixture-1': [...rangee(0, 1, 0, 0, BLOC.velours), ...rangee(0, 1, 1, 0, BLOC.parchemin), ...rangee(0, 1, 1, 1, BLOC.parchemin)],
  // Puck, le pupitre du souffleur : un pied de deux velours, une tablette de trois parchemins.
  'english-4e-comprehension-fixture-1': [...colonne(1, 0, 0, 1, BLOC.velours), ...rangee(0, 2, 0, 2, BLOC.parchemin)],
  // Vapeur, la marquise du quai : deux poteaux de rail, un toit de trois calques.
  'english-4e-grammar-fixture-1': [...colonne(0, 0, 0, 1, BLOC.rail), ...colonne(2, 0, 0, 1, BLOC.rail), ...rangee(0, 2, 0, 2, BLOC.calque)],

  // 3e : les Îles du Ciel.
  // Théo, l'équerre : une branche debout de trois prismes, une branche couchée de deux marbres.
  'maths-3e-geometry-fixture-1': [...colonne(0, 0, 0, 2, BLOC.prisme), [1, 0, 0, BLOC.marbre], [2, 0, 0, BLOC.marbre]],
  // Stat, le mât de relevés : un socle de deux quartz, un mât de deux antennes.
  'maths-3e-statistics-fixture-1': [[0, 0, 0, BLOC.quartz], [1, 0, 0, BLOC.quartz], ...colonne(0, 0, 1, 2, BLOC.antenne)],
  // Fi, le réflecteur : un socle de deux prismes, deux miroirs, un cadre de deux prismes.
  'maths-3e-functions-fixture-1': [...rangee(0, 1, 0, 0, BLOC.prisme), ...rangee(0, 1, 0, 1, BLOC.miroir), ...rangee(0, 1, 0, 2, BLOC.prisme)],
  // Astra, le banc : deux pieds de lentille, une assise de trois pierres de taille.
  'french-3e-close-reading-fixture-1': [[0, 0, 0, BLOC.lentille], [2, 0, 0, BLOC.lentille], ...rangee(0, 2, 0, 1, BLOC.taille)],
  // Écho, le haut-parleur : un socle de deux antennes, deux lentilles dessus.
  'english-3e-comprehension-fixture-1': [...rangee(0, 1, 0, 0, BLOC.antenne), ...rangee(0, 1, 0, 1, BLOC.lentille)],
  // Knight, la fontaine : un bassin en U de cinq pierres de taille, une colonne de deux marbres au milieu.
  'english-3e-grammar-fixture-1': [[0, 0, 0, BLOC.taille], [2, 0, 0, BLOC.taille], ...rangee(0, 2, 1, 0, BLOC.taille), ...colonne(1, 0, 0, 1, BLOC.marbre)],
};

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

/** Une petite construction est posée quand toutes ses cases sont dans `world.parts`. */
export function estPosee(parts: Record<string, string[]>, id: string): boolean {
  const cases = CASES.get(id);
  if (!cases) return false;
  const posees = new Set(parts[id] ?? []);
  return cases.every((c) => posees.has(c.key));
}
