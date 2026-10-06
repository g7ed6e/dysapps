// Le décor du monde, rangé à part du terrain (./terrain.ts) : les arbres, buissons, fleurs et rochers du paysage, le
// décor propre au cœur de chaque île, les repères (un grand ouvrage par région, visible de loin), les cascades des îles
// en altitude et l'habillage de la mer (rochers qui affleurent, bancs de sable). Générateur pur, sans Three.js : il pose
// des cubes par une fonction `put` que lui donne le terrain, qui décide où ils vont et ce qu'ils ne recouvrent pas.
import { BLOC, BLOCKS, type BiomeId } from '../biomes';
import type { VoxelCube } from './cube';
import { coeurDe, inCore, isLand, LACS, noise, type ArchipelagoId, type Decor, type IslandDef, type LandCell } from './map';

/** Les couleurs du paysage et du décor (les textures 3D s'en déduisent, voir `TEXTURES` dans ./terrain.ts). */
export const TRUNK = '#6b4a2e';
export const LEAF = '#4e8f36';
export const GRASS = '#6cb33f';
export const DARK = '#3b2d20';
export const HAY = '#e8c66f';
export const SNOW = '#f4f8fb';
export const MOSS = '#4f8a3a';
export const BASALT = '#4a4448';
export const LAVA = '#ff7a1a';
export const WATER = '#4a9be0';
export const PINE = '#2f6b4a';
const REED = '#8fae4f';
export const CRYSTAL = '#5cd0c8';
const FLOWERS = ['#e8557a', '#f2c14e', '#f7f2e8', '#b56cd8'];
const MUSHROOM = '#d9453f';

/**
 * Pose un cube ; `decor` nomme l'élément de décor dont il fait partie (un arbre, un buisson, un repère…), « genre@x,y »,
 * pour ranger ses cubes ensemble (world/props.ts).
 */
export type Put = (x: number, y: number, z: number, color: string, decor?: string) => void;

function tree(put: Put, x: number, y: number, base: number, tall = 2): void {
  const id = `arbre@${x},${y}`;
  for (let z = 1; z <= tall; z++) put(x, y, base + z, TRUNK, id);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(x + dx, y + dy, base + tall + 1, LEAF, id);
  put(x, y, base + tall + 2, LEAF, id);
}

/** Décor propre à chaque biome, en coordonnées relatives à l'île. `h` donne la hauteur du sol d'une case. */
export const DECOR: Record<BiomeId, (put: Put, h: (x: number, y: number) => number) => void> = {
  'french-6e-phonology': (put, h) => {
    // Derrière la salle des trophées, l'arbre de (1, 10) a laissé la place à Mousso, qui s'y tient hors de la vue des
    // lieux du village, avec ses pas, comme les créatures des trois autres îles-écoles (GD-3, directeur artistique).
    // Le grand arbre du plateau a quitté sa place (l'école s'y tient, et le plateau s'arrête à la colonne 11 ; redistribution
    // « Trois bandes », 02/10/2026) : derrière la salle des trophées, en (4, 12) (cœur : (6, 15)), à côté de la zone des
    // plans. Sur le plateau, en (9, 5), il cachait le trophée du bout de la salle (relecture du référent dys, 02/10/2026) ;
    // là, il ne cache ni un trophée, ni une borne, ni le rang avant de la zone des plans (threeBands.test.ts).
    for (const [tx, ty, tall] of [
      [8, 2, 2],
      [4, 12, 3],
      [3, 9, 2],
    ] as const)
      tree(put, tx, ty, h(tx, ty), tall);
  },
  'french-6e-letter-confusion': (put, h) => {
    // Un amas de roche et l'entrée sombre d'une galerie.
    for (const [x, y, z] of [
      [8, 3, 1],
      [9, 3, 1],
      [9, 4, 1],
      [8, 3, 2],
    ] as const)
      put(x, y, h(x, y) + z, BLOCKS[BLOC.pierre].side);
    for (const [x, y] of [
      [2, 10],
      [3, 10],
    ] as const) {
      put(x, y, h(x, y) + 1, DARK);
      put(x, y, h(x, y) + 2, DARK);
    }
    put(1, 9, h(1, 9) + 1, BLOCKS[BLOC.pierre].side);
    put(4, 11, h(4, 11) + 1, BLOCKS[BLOC.pierre].side);
  },
  'french-6e-word-spelling': (put, h) => {
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS[BLOC.sable].side);
    put(9, 4, h(9, 4) + 2, BLOCKS[BLOC.sable].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.sable].side);
  },
  'french-6e-grammar-spelling': (put, h) => {
    // Un champ de blé et deux poteaux de barrière.
    for (let dy = 2; dy <= 5; dy++) {
      put(8, dy, h(8, dy) + 1, HAY);
      if (dy % 2) put(9, dy, h(9, dy) + 1, HAY);
    }
    put(6, 1, h(6, 1) + 1, TRUNK);
    put(3, 10, h(3, 10) + 1, TRUNK);
    tree(put, 4, 10, h(4, 10), 2);
  },
  'french-6e-reading': (put, h) => {
    // Une tour de verre avec un sommet en or.
    for (let z = 1; z <= 5; z++)
      for (const [dx, dy] of [
        [8, 4],
        [9, 4],
        [8, 5],
        [9, 5],
      ] as const)
        put(dx, dy, h(dx, dy) + z, BLOCKS[BLOC.verre].side);
    put(8, 4, h(8, 4) + 6, BLOCKS[BLOC.or].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.pierre].side);
  },
  'maths-6e-calculation': (put, h) => {
    // Un boulier de briques : deux rangées de cinq, séparées (on compte par cinq), et une borne de brique.
    for (let i = 0; i < 5; i++) {
      put(7 + i, 2, h(7 + i, 2) + 1, i < 3 ? BLOCKS[BLOC.brique].side : BLOCKS[BLOC.sable].side);
      put(7 + i, 4, h(7 + i, 4) + 1, i < 2 ? BLOCKS[BLOC.brique].side : BLOCKS[BLOC.sable].side);
    }
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.brique].side);
    put(3, 9, h(3, 9) + 2, BLOCKS[BLOC.brique].side);
    tree(put, 1, 10, h(1, 10), 2);
  },
  'maths-6e-fractions': (put, h) => {
    // Une mare de verre bordée de galets, un nénuphar, et des roseaux.
    for (const [x, y] of [
      [8, 3],
      [9, 3],
      [8, 4],
      [9, 4],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS[BLOC.verre].side);
    put(9, 4, h(9, 4) + 2, LEAF);
    for (const [x, y] of [
      [7, 2],
      [10, 5],
      [7, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS[BLOC.galet].side);
    put(3, 9, h(3, 9) + 1, TRUNK);
    put(3, 9, h(3, 9) + 2, TRUNK);
    put(3, 9, h(3, 9) + 3, LEAF);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.galet].side);
  },
  'maths-6e-decimals': (put, h) => {
    // Un petit cône de pierre au sommet incandescent, des blocs d'obsidienne épars.
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS[BLOC.pierre].side);
    put(9, 4, h(9, 4) + 2, BLOCKS[BLOC.pierre].side);
    put(9, 4, h(9, 4) + 3, HAY);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.obsidienne].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.obsidienne].side);
    put(1, 10, h(1, 10) + 2, BLOCKS[BLOC.obsidienne].side);
  },
  'maths-5e-signed-numbers': (put, h) => {
    // Des congères de neige et une stalagmite de glace ; un thermomètre de blocs (froid en bas, chaud en haut).
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, SNOW);
    for (let z = 1; z <= 4; z++) put(10, 3, h(10, 3) + z, z <= 2 ? BLOCKS[BLOC.glace].side : z === 3 ? BLOCKS[BLOC.verre].side : HAY);
    put(3, 9, h(3, 9) + 1, SNOW);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.glace].side);
    put(1, 10, h(1, 10) + 2, BLOCKS[BLOC.glace].side);
  },
  'maths-5e-proportionality': (put, h) => {
    // Un étal à auvent de toile sur des poteaux, des caisses. L'école se tient maintenant à sa droite (redistribution
    // « Trois bandes », 02/10/2026) : l'étal s'arrête une case plus tôt, trois cases de large au lieu de quatre, sur le
    // plateau rogné. Glissé d'une case vers la gauche, son auvent cachait un trophée du bout de la salle (threeBands.test.ts).
    for (const [x, y] of [
      [7, 2],
      [9, 2],
      [7, 5],
      [9, 5],
    ] as const) {
      put(x, y, h(x, y) + 1, TRUNK);
      put(x, y, h(x, y) + 2, TRUNK);
    }
    for (let dx = 7; dx <= 9; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 3, BLOCKS[BLOC.toile].side);
    put(8, 3, h(8, 3) + 1, BLOCKS[BLOC.bois].side);
    put(9, 4, h(9, 4) + 1, BLOCKS[BLOC.bois].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.bois].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.toile].side);
  },
  'french-5e-homophones': (put, h) => {
    // Un poteau indicateur à trois panneaux, et une borne.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, TRUNK);
    put(8, 3, h(8, 3) + 3, BLOCKS[BLOC.panneau].side);
    put(10, 3, h(10, 3) + 4, BLOCKS[BLOC.panneau].side);
    put(9, 4, h(9, 4) + 2, BLOCKS[BLOC.panneau].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.pierre].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.panneau].side);
    tree(put, 7, 5, h(7, 5), 2);
  },
  'french-5e-conjugation': (put, h) => {
    // Des flaques de verre, des roseaux, une souche.
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 4],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS[BLOC.verre].side);
    for (const [x, y] of [
      [7, 4],
      [9, 5],
      [3, 9],
    ] as const) {
      put(x, y, h(x, y) + 1, TRUNK);
      put(x, y, h(x, y) + 2, TRUNK);
      put(x, y, h(x, y) + 3, HAY);
    }
    put(1, 10, h(1, 10) + 1, TRUNK);
  },
  'maths-4e-powers': (put, h) => {
    // Une cheminée de pierre au sommet incandescent, une enclume d'acier, des lingots.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, z === 4 ? HAY : BLOCKS[BLOC.pierre].side);
    put(8, 5, h(8, 5) + 1, BLOCKS[BLOC.acier].side);
    put(10, 5, h(10, 5) + 1, BLOCKS[BLOC.acier].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.or].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.acier].side);
    put(1, 10, h(1, 10) + 2, BLOCKS[BLOC.acier].side);
  },
  'maths-4e-algebra': (put, h) => {
    // Une table à dessin (planches sur pieds) avec un calque, une pile de calques. L'école se tient à l'ancienne place de
    // la table, sur le bord du plateau rogné (redistribution « Trois bandes », 02/10/2026). Sur la place du village, la
    // table faisait fond à la borne du milieu, vue de la caméra (relectures du 02/10/2026) : elle se pose contre le flanc
    // gauche de la salle des trophées, en long, de (-3, 5) à (-3, 7) (cœur : de (-1, 8) à (-1, 10)), sur un sol plat, hors
    // de l'axe de la caméra vers une borne (threeBands.test.ts). Le calque glisse au milieu du plateau, en (8, 4).
    put(-3, 5, h(-3, 5) + 1, TRUNK);
    put(-3, 7, h(-3, 7) + 1, TRUNK);
    for (let dy = 5; dy <= 7; dy++) put(-3, dy, h(-3, dy) + 2, BLOCKS[BLOC.bois].side);
    put(-3, 6, h(-3, 6) + 3, BLOCKS[BLOC.calque].side);
    put(8, 4, h(8, 4) + 1, BLOCKS[BLOC.calque].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.calque].side);
    put(3, 9, h(3, 9) + 2, BLOCKS[BLOC.calque].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'french-4e-agreement': (put, h) => {
    // Une paroi d'ardoise en escalier, une corde (barrière) qui pend, un rocher.
    for (let z = 1; z <= 4; z++) for (let dx = 0; dx < 5 - z; dx++) put(7 + dx, 2, h(7 + dx, 2) + z, BLOCKS[BLOC.ardoise].side);
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.pierre].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.ardoise].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
    put(1, 10, h(1, 10) + 2, BLOCKS[BLOC.pierre].side);
  },
  'french-4e-vocabulary': (put, h) => {
    // Des étagères de bois chargées de parchemins, un pupitre.
    for (const x of [8, 10]) for (let z = 1; z <= 3; z++) put(x, 3, h(x, 3) + z, z === 2 ? BLOCKS[BLOC.parchemin].side : BLOCKS[BLOC.bois].side);
    put(9, 3, h(9, 3) + 3, BLOCKS[BLOC.bois].side);
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.parchemin].side);
    put(8, 5, h(8, 5) + 1, BLOCKS[BLOC.bois].side);
    put(8, 5, h(8, 5) + 2, BLOCKS[BLOC.parchemin].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.parchemin].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.bois].side);
  },
  'maths-3e-geometry': (put, h) => {
    // Un kiosque : quatre colonnes de marbre et un toit de marbre, un triangle 3-4-5 au sol.
    for (const [x, y] of [
      [7, 2],
      [10, 2],
      [7, 5],
      [10, 5],
    ] as const)
      for (let z = 1; z <= 3; z++) put(x, y, h(x, y) + z, BLOCKS[BLOC.marbre].side);
    for (let dx = 7; dx <= 10; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 4, BLOCKS[BLOC.marbre].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.marbre].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'maths-3e-statistics': (put, h) => {
    // Un télescope (tronc incliné en escalier) et un dôme de quartz.
    for (let i = 0; i < 4; i++) put(7 + i, 3, h(7 + i, 3) + 1 + i, i === 3 ? BLOCKS[BLOC.verre].side : TRUNK);
    put(9, 5, h(9, 5) + 1, BLOCKS[BLOC.quartz].side);
    put(9, 5, h(9, 5) + 2, BLOCKS[BLOC.quartz].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.quartz].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'maths-3e-functions': (put, h) => {
    // Un phare : tour de pierre, lanterne de prisme au sommet.
    for (let z = 1; z <= 5; z++) put(9, 3, h(9, 3) + z, z === 5 ? BLOCKS[BLOC.prisme].side : BLOCKS[BLOC.pierre].side);
    put(9, 3, h(9, 3) + 6, BLOCKS[BLOC.or].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.prisme].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'french-3e-close-reading': (put, h) => {
    // Une lunette d'observation sur son pied, une pile de livres (planches et parchemin), une lentille au sol.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.pierre].side);
    put(9, 3, h(9, 3) + 2, BLOCKS[BLOC.pierre].side);
    for (let i = 0; i < 3; i++) put(8 + i, 4, h(8 + i, 4) + 3, i === 2 ? BLOCKS[BLOC.lentille].side : TRUNK);
    put(7, 2, h(7, 2) + 1, BLOCKS[BLOC.bois].side);
    put(7, 2, h(7, 2) + 2, BLOCKS[BLOC.parchemin].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.lentille].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-6e-vocabulary': (put, h) => {
    // Une cabine téléphonique rouge (vitrée, toit sombre), un réverbère, une caisse de cabines au sol.
    for (let z = 1; z <= 3; z++) put(9, 3, h(9, 3) + z, BLOCKS[BLOC.cabine].side);
    put(9, 3, h(9, 3) + 4, DARK);
    for (let z = 1; z <= 3; z++) put(11, 5, h(11, 5) + z, DARK);
    put(11, 5, h(11, 5) + 4, BLOCKS[BLOC.lanterne].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.cabine].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-6e-grammar': (put, h) => {
    // Une tour d'horloge de pierre, cadran au sommet et flèche de laiton ; un rouage de cadrans au sol.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, z === 4 ? BLOCKS[BLOC.cadran].side : BLOCKS[BLOC.pierre].side);
    put(9, 3, h(9, 3) + 5, BLOCKS[BLOC.or].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.cadran].side);
    put(4, 9, h(4, 9) + 1, BLOCKS[BLOC.cadran].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'history-6e-antiquity': (put, h) => {
    // Sobre (le plus chargé des archipels) : un éclat de sol de mosaïque mis au jour, un tas de sable de fouille, une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.mosaique].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.mosaique].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.sable].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'geography-6e-living': (put, h) => {
    // Sobre : deux bottes de chaume en bord de champ, une borne de pierre au bord du chemin.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.chaume].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.chaume].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  // Les îles d'histoire-géographie de 5e à 3e (HG-3) : un décor sobre, quelques blocs au sol, aucune lanterne.
  'history-5e-middle-ages': (put, h) => {
    // Un pupitre de copiste : un pied de planches, son plateau d'enluminure ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.bois].side);
    put(9, 3, h(9, 3) + 2, BLOCKS[BLOC.enluminure].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'geography-5e-resources': (put, h) => {
    // Deux carrés de rizière au bord du delta, une botte de foin ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.riziere].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.riziere].side);
    put(3, 9, h(3, 9) + 1, HAY);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'history-4e-revolutions': (put, h) => {
    // Deux plaques de fonte empilées (une presse au repos), une caisse de planches ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.fonte].side);
    put(9, 3, h(9, 3) + 2, BLOCKS[BLOC.fonte].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.bois].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'geography-4e-globalization': (put, h) => {
    // Deux conteneurs côte à côte sur le quai, une caisse de planches ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.conteneur].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.conteneur].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.bois].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'history-3e-twentieth-century': (put, h) => {
    // Sobre, rien de ludique (DA, HG-3) : une pile de deux reliures, un banc de pierre ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.reliure].side);
    put(9, 3, h(9, 3) + 2, BLOCKS[BLOC.reliure].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.pierre].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'geography-3e-france': (put, h) => {
    // Une borne de grès rose au bord du chemin, deux blocs de grès ; une pierre.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.gres].side);
    put(9, 3, h(9, 3) + 2, BLOCKS[BLOC.gres].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.gres].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-5e-vocabulary': (put, h) => {
    // Un étal : deux poteaux, un auvent de tuiles, une caisse de bois devant ; une pile de tuiles au sol.
    for (const px of [8, 10]) for (let z = 1; z <= 2; z++) put(px, 3, h(px, 3) + z, TRUNK);
    for (let x = 8; x <= 10; x++) put(x, 3, h(x, 3) + 3, BLOCKS[BLOC.tuile].side);
    put(9, 4, h(9, 4) + 1, BLOCKS[BLOC.bois].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.tuile].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-5e-grammar': (put, h) => {
    // Une tour de lambris sombre, un toit noir et une bougie au sommet ; un pilier de grille en pierre.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, BLOCKS[BLOC.lambris].side);
    put(9, 3, h(9, 3) + 5, DARK);
    put(9, 3, h(9, 3) + 6, BLOCKS[BLOC.lanterne].side);
    for (let z = 1; z <= 2; z++) put(7, 2, h(7, 2) + z, BLOCKS[BLOC.pierre].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.lambris].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'lv2-5e-introductions': (put, h) => {
    // Un poteau indicateur de bois, deux planches à deux hauteurs (deux routes) ; un montoir de dalles ; une botte de foin.
    for (let z = 1; z <= 3; z++) put(9, 3, h(9, 3) + z, TRUNK);
    put(10, 3, h(10, 3) + 3, BLOCKS[BLOC.bois].side);
    put(8, 3, h(8, 3) + 2, BLOCKS[BLOC.bois].side);
    put(11, 5, h(11, 5) + 1, BLOCKS[BLOC.dalle].side);
    put(3, 9, h(3, 9) + 1, HAY);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'lv2-4e-daily-life': (put, h) => {
    // Un carré potager bordé d'osier (des rangs de feuilles dedans), un poteau-lanterne éteint à côté (sa tête d'ardoise :
    // la nuit, le jardin garde ses lueurs sous 3 % de l'image, DA, LV2-4) ; un panier d'osier posé au sol, une pierre.
    for (let x = 8; x <= 11; x++)
      for (let y = 2; y <= 4; y++) {
        const bord = x === 8 || x === 11 || y === 2 || y === 4;
        put(x, y, h(x, y) + 1, bord ? BLOCKS[BLOC.osier].side : LEAF);
      }
    for (let z = 1; z <= 2; z++) put(6, 3, h(6, 3) + z, TRUNK);
    put(6, 3, h(6, 3) + 3, BLOCKS[BLOC.ardoise].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.osier].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-4e-comprehension': (put, h) => {
    // Une petite scène : deux colonnes de rideau pourpre, une frise au-dessus, deux lanternes de rampe devant.
    for (const px of [8, 10]) for (let z = 1; z <= 3; z++) put(px, 3, h(px, 3) + z, BLOCKS[BLOC.velours].side);
    for (let x = 8; x <= 10; x++) put(x, 3, h(x, 3) + 4, BLOCKS[BLOC.velours].side);
    put(8, 2, h(8, 2) + 1, BLOCKS[BLOC.lanterne].side);
    put(10, 2, h(10, 2) + 1, BLOCKS[BLOC.lanterne].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.velours].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-4e-grammar': (put, h) => {
    // Une voie ferrée courte, un signal (poteau et lanterne), une pile de rails au sol.
    for (let x = 6; x <= 11; x++) put(x, 4, h(x, 4) + 1, BLOCKS[BLOC.rail].side);
    for (let z = 1; z <= 3; z++) put(12, 3, h(12, 3) + z, DARK);
    put(12, 3, h(12, 3) + 4, BLOCKS[BLOC.lanterne].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.rail].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-3e-comprehension': (put, h) => {
    // Un mât d'antenne sur un socle de pierre, un voyant au sommet ; une antenne tombée au sol.
    put(9, 3, h(9, 3) + 1, BLOCKS[BLOC.pierre].side);
    for (let z = 2; z <= 5; z++) put(9, 3, h(9, 3) + z, BLOCKS[BLOC.antenne].side);
    put(9, 3, h(9, 3) + 6, BLOCKS[BLOC.lanterne].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.antenne].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'english-3e-grammar': (put, h) => {
    // Une tourelle de pierre de taille, deux créneaux, une bannière d'or au sommet ; un bloc de taille au sol.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, BLOCKS[BLOC.taille].side);
    put(8, 3, h(8, 3) + 1, BLOCKS[BLOC.taille].side);
    put(10, 3, h(10, 3) + 1, BLOCKS[BLOC.taille].side);
    put(9, 3, h(9, 3) + 5, BLOCKS[BLOC.or].side);
    put(3, 9, h(3, 9) + 1, BLOCKS[BLOC.taille].side);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
  'lv2-3e-travel': (put, h) => {
    // Un cœur d'herbe (DA, LV2-5) : une pile de bûches, un banc de pierre de taille, quelques fleurs de
    // prairie, une pierre. Aucune lanterne, même éteinte, ni cloche, ni boîte aux lettres : la nuit, rien n'y luit.
    for (const [x, z] of [
      [9, 1],
      [10, 1],
      [9, 2],
    ] as const)
      put(x, 3, h(x, 3) + z, TRUNK);
    put(11, 5, h(11, 5) + 1, BLOCKS[BLOC.taille].side);
    // Des fleurs blanches et mauves, pas de jaune : la nuit, un jaune vif se lirait comme une lueur.
    for (const [x, y, k] of [
      [8, 5, 2],
      [12, 3, 3],
      [3, 9, 2],
    ] as const)
      put(x, y, h(x, y) + 1, FLOWERS[k], `fleur@${x},${y}`);
    put(1, 10, h(1, 10) + 1, BLOCKS[BLOC.pierre].side);
  },
};

/** La forme en blocs d'un élément de décor du paysage : `put` pose un cube relatif au sol de sa case (z = 1 juste au-dessus). */
type BlocsDuDecor = (put: Put, x: number, y: number, r: number) => void;

/** Les formes en blocs du décor du paysage, par genre (le monde en blocs ; en primitives : `FORMES`, ./decor/shapes.ts). */
const BLOCS_DU_DECOR: Record<Decor, BlocsDuDecor> = {
  arbre: (put, x, y, r) => tree(put, x, y, 0, r > 0.5 ? 3 : 2),
  sapin: (put, x, y, r) => {
    const tall = r > 0.5 ? 2 : 1;
    for (let z = 1; z <= tall; z++) put(x, y, z, TRUNK);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(x + dx, y + dy, tall + 1, PINE);
    put(x + 1, y, tall + 2, PINE);
    put(x - 1, y, tall + 2, PINE);
    put(x, y + 1, tall + 2, PINE);
    put(x, y - 1, tall + 2, PINE);
    put(x, y, tall + 2, PINE);
    put(x, y, tall + 3, PINE);
  },
  buisson: (put, x, y, r) => {
    put(x, y, 1, LEAF);
    if (r > 0.7) put(x + 1, y, 1, LEAF);
  },
  fleur: (put, x, y, r) => put(x, y, 1, FLOWERS[Math.floor(r * FLOWERS.length) % FLOWERS.length]),
  rocher: (put, x, y, r) => {
    put(x, y, 1, BLOCKS[BLOC.pierre].side);
    if (r > 0.8) put(x, y, 2, BLOCKS[BLOC.pierre].side);
  },
  roseau: (put, x, y) => {
    put(x, y, 1, REED);
    put(x, y, 2, REED);
  },
  cristal: (put, x, y, r) => {
    put(x, y, 1, CRYSTAL);
    if (r > 0.6) put(x, y, 2, CRYSTAL);
  },
  souche: (put, x, y) => put(x, y, 1, TRUNK),
  champignon: (put, x, y) => put(x, y, 1, MUSHROOM),
};

/** Un élément de décor posé sur une case, au-dessus de son sol (z = 1 juste au-dessus). `r` : grain 0..1 pour varier. */
export function decorate(place: Put, kind: Decor, x: number, y: number, r: number): void {
  const id = `${kind}@${x},${y}`;
  const put: Put = (px, py, pz, color) => place(px, py, pz, color, id);
  BLOCS_DU_DECOR[kind]?.(put, x, y, r);
}

export const SMOKE = '#a9a4a0';

/** Les repères : un grand ouvrage par région, visible de loin, posé sur la terre autour du cœur. */
export const REPERES = ['grand-arbre', 'champignon-geant', 'fumee', 'tour-de-guet', 'grand-phare', 'aiguille-de-glace', 'haut-fourneau'] as const;
export type Repere = (typeof REPERES)[number];
export const LANDMARK_OF: Partial<Record<BiomeId, Repere>> = {
  'french-6e-phonology': 'grand-arbre',
  'french-5e-conjugation': 'champignon-geant',
  'maths-6e-decimals': 'fumee',
  'french-6e-letter-confusion': 'tour-de-guet',
  'maths-3e-functions': 'grand-phare',
  'maths-5e-signed-numbers': 'aiguille-de-glace',
  'maths-4e-powers': 'haut-fourneau',
};

/**
 * Le décor bâti : nommé comme le reste du décor (ses cubes se rangent ensemble), mais le sol le porte comme une
 * construction : la marche ne l'enjambe pas et le compte dans la hauteur du sol, la pente ne l'abaisse pas. Les repères,
 * les cascades, l'habillage de la mer (écueils et bancs) et le ponton du Jardin des heures.
 */
export const DECOR_BATI: ReadonlySet<string> = new Set<string>([...REPERES, 'cascade', 'ecueil', 'banc', 'ponton']);

/** Le genre d'un élément de décor d'après son nom (« foret/cœur:arbre@8,2 » : un arbre). */
export function kindOf(decor: string): string {
  const name = decor.slice(decor.lastIndexOf('/') + 1).replace(/^cœur:/, '');
  return name.slice(0, name.indexOf('@'));
}

/**
 * Un décor posé sur le sol (un arbre, un buisson, un objet du quai), par son nom ; pas un décor bâti (`DECOR_BATI` :
 * repère, cascade, écueil, banc), que le sol porte comme une construction.
 */
export function decorPose(decor: string | undefined): boolean {
  return decor !== undefined && decor !== '' && !DECOR_BATI.has(kindOf(decor));
}

/** Les volutes d'une fumée, décalées comme au vent. */
export const PUFFS: [number, number, number][] = [
  [0, 0, 2],
  [1, 0, 3],
  [0, 1, 3],
  [1, 1, 4],
  [2, 1, 5],
  [1, 2, 5],
  [2, 2, 6],
  [3, 2, 7],
];

type Spot = { x: number; y: number; h: number };

/** Une place de `size` × `size` cases de terre, hors du cœur, à la même hauteur, la plus proche du point voulu. */
function findSpot(def: IslandDef, scenery: LandCell[], wantX: number, wantY: number, size: number): Spot | null {
  const at = new Map(scenery.map((c) => [`${c.x},${c.y}`, c]));
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const c of scenery) {
    if (c.h < 0 || c.ground === 'eau' || c.ground === 'lave') continue;
    let ok = true;
    for (let dx = 0; dx < size && ok; dx++)
      for (let dy = 0; dy < size && ok; dy++) {
        const o = at.get(`${c.x + dx},${c.y + dy}`);
        if (!o || o.h !== c.h || o.ground === 'eau' || o.ground === 'lave' || inCore(def, c.x + dx, c.y + dy)) ok = false;
      }
    if (!ok) continue;
    const d = Math.hypot(c.x - wantX, c.y - wantY);
    if (d < bestD) {
      bestD = d;
      best = { x: c.x, y: c.y, h: c.h };
    }
  }
  return best;
}

/** Ce que reçoit la forme en blocs d'un repère : son île, son paysage, et `put`, qui pose un cube du repère. */
interface OutilsDuRepereEnBlocs {
  def: IslandDef;
  scenery: LandCell[];
  /** Le rang juste derrière le cœur, où se posent la plupart des repères. */
  backY: number;
  /** Nomme le repère d'après sa première case, « genre@x,y » (avant de poser ses cubes). */
  named: (x: number, y: number) => void;
  put: (x: number, y: number, z: number, color: string) => void;
}

/**
 * Les formes en blocs des repères, par genre (le monde en blocs ; en primitives : `FORMES`, ./decor/shapes.ts). `put`
 * travaille en coordonnées du monde, z relatif au sol de l'île.
 */
const REPERES_EN_BLOCS: Record<Repere, (o: OutilsDuRepereEnBlocs) => void> = {
  'grand-arbre': ({ def, scenery, backY, named, put }) => {
    // Un chêne géant : tronc 2 × 2 de six blocs, large couronne en trois étages. Juste derrière le cœur, deux cases en
    // dedans de son bord gauche : depuis que le cœur de la Forêt a 20 cases (01/10/2026), le replat d'avant, quatre cases
    // à gauche, est au bord de la pente, et le chêne y montrait plus de la moitié de son tronc.
    const s = findSpot(def, scenery, coeurDe(def).x0 + 2, backY, 2);
    if (!s) return;
    named(s.x, s.y);
    for (let z = 1; z <= 6; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, TRUNK);
    for (let dx = -2; dx <= 3; dx++)
      for (let dy = -2; dy <= 3; dy++) if (Math.abs(dx - 0.5) + Math.abs(dy - 0.5) <= 4) put(s.x + dx, s.y + dy, s.h + 7, LEAF);
    for (let dx = -1; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) put(s.x + dx, s.y + dy, s.h + 8, LEAF);
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + 9, LEAF);
  },
  'champignon-geant': ({ def, scenery, backY, named, put }) => {
    // Un champignon géant : pied clair de trois blocs, chapeau rouge à points blancs.
    const s = findSpot(def, scenery, coeurDe(def).x1 + 2, backY, 1);
    if (!s) return;
    named(s.x, s.y);
    for (let z = 1; z <= 3; z++) put(s.x, s.y, s.h + z, BLOCKS[BLOC.sable].side);
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++)
        if (Math.abs(dx) + Math.abs(dy) <= 3) put(s.x + dx, s.y + dy, s.h + 4, (dx + dy) % 2 === 0 && Math.abs(dx) + Math.abs(dy) === 2 ? SNOW : MUSHROOM);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(s.x + dx, s.y + dy, s.h + 5, MUSHROOM);
    put(s.x, s.y, s.h + 6, SNOW);
  },
  fumee: ({ scenery, named, put }) => {
    // Le cône fume : des volutes grises qui montent au-dessus du cratère, décalées comme au vent.
    const lava = scenery.filter((c) => c.ground === 'lave');
    if (!lava.length) return;
    const cx = Math.round(lava.reduce((a, c) => a + c.x, 0) / lava.length);
    const cy = Math.round(lava.reduce((a, c) => a + c.y, 0) / lava.length);
    const top = Math.max(...lava.map((c) => c.h)) + 2;
    named(cx, cy);
    for (const [dx, dy, dz] of PUFFS) put(cx + dx, cy + dy, top + dz, SMOKE);
  },
  'aiguille-de-glace': ({ def, scenery, backY, named, put }) => {
    // Une aiguille de glace : un pilier 2 × 2 de cinq blocs, une pointe de trois, un cristal qui brille au sommet.
    const s = findSpot(def, scenery, coeurDe(def).x0 - 4, backY, 2);
    if (!s) return;
    named(s.x, s.y);
    for (let z = 1; z <= 5; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, BLOCKS[BLOC.glace].side);
    for (let z = 6; z <= 8; z++) put(s.x, s.y, s.h + z, BLOCKS[BLOC.glace].side);
    put(s.x, s.y, s.h + 9, CRYSTAL);
  },
  'haut-fourneau': ({ def, scenery, backY, named, put }) => {
    // Le haut-fourneau de la Forge : une cheminée de basalte 2 × 2 de neuf blocs, la lave qui rougeoie au sommet, la fumée au vent.
    const s = findSpot(def, scenery, coeurDe(def).x1 + 2, backY, 2);
    if (!s) return;
    named(s.x, s.y);
    for (let z = 1; z <= 9; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, BASALT);
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + 10, LAVA);
    for (const [dx, dy, dz] of PUFFS) put(s.x + dx, s.y + dy, s.h + 9 + dz, SMOKE);
  },
  'tour-de-guet': ({ scenery, named, put }) => {
    // Une tour de guet de pierre au sommet du pic, sa bannière de toile en haut.
    const peak = scenery.reduce((a, c) => (c.h > a.h && c.ground !== 'lave' ? c : a), scenery[0]);
    named(peak.x, peak.y);
    for (let z = 1; z <= 4; z++) put(peak.x, peak.y, peak.h + z, BLOCKS[BLOC.pierre].side);
    put(peak.x, peak.y, peak.h + 5, BLOCKS[BLOC.lanterne].side);
    put(peak.x + 1, peak.y, peak.h + 5, BLOCKS[BLOC.toile].side);
    put(peak.x + 1, peak.y, peak.h + 4, BLOCKS[BLOC.toile].side);
  },
  'grand-phare': ({ def, scenery, backY, named, put }) => {
    // Le grand phare : tour de pierre 2 × 2 de huit blocs, lanterne de quatre blocs au sommet, toit de prisme.
    const s = findSpot(def, scenery, coeurDe(def).x1 + 1, backY, 2);
    if (!s) return;
    named(s.x, s.y);
    for (let z = 1; z <= 10; z++)
      for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++)
          put(s.x + dx, s.y + dy, s.h + z, z === 9 ? BLOCKS[BLOC.lanterne].side : z === 10 ? BLOCKS[BLOC.prisme].side : z % 4 === 0 ? SNOW : BLOCKS[BLOC.pierre].side);
  },
};

/**
 * Pose le repère d'une île (s'il en a un). `place` travaille en coordonnées du monde, z relatif au sol de l'île ; le
 * repère porte un nom de décor, « genre@x,y » (sa première case).
 */
export function landmark(def: IslandDef, scenery: LandCell[], place: Put): void {
  const kind = LANDMARK_OF[def.id];
  if (!kind) return;
  let id: string = kind;
  REPERES_EN_BLOCS[kind]({
    def,
    scenery,
    backY: coeurDe(def).y1 + 1,
    named: (x, y) => (id = `${kind}@${x},${y}`),
    put: (x, y, z, color) => place(x, y, z, color, id),
  });
}

/** L'épaisseur de terre sous le sol d'une île, en blocs (`DEPTH` de ./terrain.ts, qui importe ce fichier ; un test les tient ensemble). */
export const DEPTH_DU_SOL = 2;

/** Les îles qui ont un ponton et sa barque, sur leur rivage est (DA, LV2-4 : le Jardin des heures). */
const PONTON_SUR: readonly BiomeId[] = ['lv2-4e-daily-life'];

/**
 * Le ponton et sa barque : sur le rivage est de l'île (+x), au milieu du cœur à trois cases près, une échelle qui
 * descend la falaise jusqu'à l'eau, un tablier de planches au ras de l'eau vers le large, et, à son bout, une barque
 * (son fond, la proue et la poupe relevées). Archipéo le redessine (./decor/4e.ts, `RETOUCHES_4E`). Nom de décor : « ponton@x,y » (la case du rivage). `place` travaille
 * en coordonnées du monde, z relatif au sol de l'île (la mer est à −altitude).
 */
export function pontonEtBarque(def: IslandDef, scenery: LandCell[], place: Put): void {
  if (!PONTON_SUR.includes(def.id)) return;
  const coeur = coeurDe(def);
  const milieu = (coeur.y0 + coeur.y1) / 2;
  const libre = (x: number, y: number) => !isLand(def, x, y);
  let rive: LandCell | null = null;
  for (const c of scenery) {
    if (c.h < 0 || c.ground === 'eau' || c.ground === 'lave' || c.x < coeur.x1 || Math.abs(c.y - milieu) > 3) continue;
    // De l'eau devant (deux cases vers le large, sur quatre rangs) : le tablier et la barque y tiennent.
    let large = true;
    for (let dx = 1; dx <= 2 && large; dx++) for (let dy = 0; dy <= 3; dy++) if (!libre(c.x + dx, c.y + dy)) large = false;
    if (!large) continue;
    if (!rive || c.x > rive.x || (c.x === rive.x && Math.abs(c.y - milieu) < Math.abs(rive.y - milieu))) rive = c;
  }
  if (!rive) return;
  const { x, y, h } = rive;
  const id = `ponton@${x},${y}`;
  const put = (px: number, py: number, pz: number, color: string) => place(px, py, pz, color, id);
  const mer = -def.altitude - 1;
  // L'échelle, de l'eau au haut du rivage, contre la falaise : sous l'île en altitude, qui flotte, un pilier de pierre
  // descend du rivage jusqu'à l'eau, où l'échelle s'appuie sur toute sa hauteur (DA, LV2-4). Le tablier, deux cases au
  // ras de l'eau (dans les deux cases de marge de l'archipel, `worldBounds`).
  for (let z = mer; z < Math.min(0, h) - DEPTH_DU_SOL; z++) put(x, y, z, BLOCKS[BLOC.pierre].side);
  for (let z = mer + 1; z <= h; z++) put(x + 1, y, z, BLOCKS[BLOC.escalier].side);
  for (let dx = 1; dx <= 2; dx++) put(x + dx, y, mer, BLOCKS[BLOC.bois].side);
  // La barque, amarrée au bout du tablier, le long de la falaise : son fond, la proue et la poupe relevées.
  for (let dy = 1; dy <= 3; dy++) put(x + 2, y + dy, mer, TRUNK);
  put(x + 2, y + 1, mer + 1, BLOCKS[BLOC.bois].side);
  put(x + 2, y + 3, mer + 1, BLOCKS[BLOC.bois].side);
}

/**
 * Les cascades : d'un lac d'une île en altitude, l'eau déborde au bord le plus proche et tombe jusqu'à la mer. Nom de
 * décor : « cascade@x,y » (la case du bord). Un lac dessiné (`LACS`, le lac du refuge) reste loin du bord : il ne
 * déborde pas.
 */
export function cascades(def: IslandDef, scenery: LandCell[], place: Put): void {
  if (def.altitude === 0 || LACS[def.id]) return;
  const lakes = scenery.filter((c) => c.ground === 'eau');
  if (!lakes.length) return;
  const isLandAt = (x: number, y: number) => isLand(def, x, y);
  const edges = scenery.filter(
    (c) =>
      c.h >= 0 &&
      c.ground !== 'eau' &&
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => !isLandAt(c.x + dx, c.y + dy)),
  );
  if (!edges.length) return;
  const lake = lakes[0];
  const edge = edges.reduce((a, c) => (Math.hypot(c.x - lake.x, c.y - lake.y) < Math.hypot(a.x - lake.x, a.y - lake.y) ? c : a), edges[0]);
  const out = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].find(([dx, dy]) => !isLandAt(edge.x + dx, edge.y + dy));
  if (!out) return;
  const id = `cascade@${edge.x},${edge.y}`;
  const put = (x: number, y: number, z: number, color: string) => place(x, y, z, color, id);
  // Un filet d'eau sur la case du bord, puis la chute, jusqu'au niveau de la mer.
  put(edge.x, edge.y, edge.h + 1, WATER);
  for (let z = edge.h; z >= -def.altitude; z--) put(edge.x + out[0], edge.y + out[1], z, WATER);
  put(edge.x + 2 * out[0], edge.y + 2 * out[1], -def.altitude, SNOW);
}

/**
 * Où nagent les baleines : quatre ronds dans de larges clairières d'eau, de préférence au large (les îles du bord
 * voient la mer), assez loin de toute terre et de tout îlot pour ne jamais les toucher. Centre et rayon, en grille.

/**
 * L'habillage de la mer, semé au hasard (bruit fixe) sur la grille de l'archipel et au-delà : des rochers qui affleurent
 * (galet et pierre, un à quatre cubes ; des aiguilles d'ardoise dans les Anciens Ateliers) et des bancs de sable au ras
 * de l'eau (de glace dans les Îles Brumeuses, de galets dans les Anciens Ateliers), plus denses au large. `free` dit
 * où l'on peut semer (loin de toute terre, de tout ouvrage, des baleines : voir `seaDecor` dans ./terrain.ts).
 */
export function semerLaMer(
  a: ArchipelagoId,
  b: { minX: number; maxX: number; minY: number; maxY: number },
  free: (x: number, y: number) => boolean,
): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  const used = new Set<string>();
  // Le nom de l'élément en cours : « mer/ecueil@x,y » (un rocher, une aiguille) ou « mer/banc@x,y ».
  let decor = '';
  const put = (x: number, y: number, z: number, block: (typeof BLOCKS)[keyof typeof BLOCKS]) => {
    const key = `${x},${y},${z}`;
    if (used.has(key)) return;
    used.add(key);
    cubes.push({ x, y, z, color: block.side, top: block.top, texture: block.texture, tag: 'mer', decor });
  };
  const MARGIN = 26;
  for (let gx = b.minX - MARGIN; gx <= b.maxX + MARGIN; gx += 4) {
    for (let gy = b.minY - MARGIN; gy <= b.maxY + MARGIN; gy += 4) {
      const x = gx + Math.floor(noise(71, gx, gy) * 4);
      const y = gy + Math.floor(noise(72, gx, gy) * 4);
      // Densité en dégradé : clairsemé entre les îles, de plus en plus fourni à mesure qu'on s'éloigne au large.
      const beyond = Math.max(b.minX - x, x - b.maxX, b.minY - y, y - b.maxY, 0);
      const t = Math.min(1, beyond / 20);
      const pick = noise(73, gx, gy);
      const rockAt = 0.06 + 0.07 * t;
      const sandAt = rockAt + 0.025 + 0.03 * t;
      if (pick >= sandAt || !free(x, y)) continue;
      if (pick < rockAt) {
        decor = `mer/ecueil@${x},${y}`;
        const n = noise(74, gx, gy);
        if (a === '4e') {
          // Les Anciens Ateliers : des aiguilles d'ardoise qui sortent de l'eau, une pierre au pied.
          put(x, y, -1, BLOCKS[BLOC.pierre]);
          const tall = 1 + Math.floor(n * 4);
          for (let z = 0; z < tall; z++) put(x, y, z, BLOCKS[BLOC.ardoise]);
          if (n > 0.7) put(x + 1, y, -1, BLOCKS[BLOC.ardoise]);
        } else {
          // Un rocher : un galet au ras de l'eau, parfois une pierre par-dessus, parfois un voisin.
          put(x, y, -1, BLOCKS[BLOC.galet]);
          if (n > 0.35) put(x, y, 0, BLOCKS[BLOC.pierre]);
          if (n > 0.6) put(x + 1, y, -1, BLOCKS[BLOC.galet]);
          if (n > 0.8) put(x, y + 1, -1, BLOCKS[BLOC.pierre]);
          if (n > 0.9) put(x, y, 1, BLOCKS[BLOC.pierre]);
        }
      } else {
        // Un banc de sable (une plaque de glace dans les Îles Brumeuses) : une petite tache de trois à sept cases au ras de l'eau.
        const cells: [number, number][] = [
          [0, 0],
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
          [1, 1],
          [-1, -1],
        ];
        decor = `mer/banc@${x},${y}`;
        const n = 3 + Math.floor(noise(75, gx, gy) * 5);
        const bank = a === '5e' ? BLOCKS[BLOC.glace] : a === '4e' ? BLOCKS[BLOC.galet] : BLOCKS[BLOC.sable];
        for (const [dx, dy] of cells.slice(0, n)) put(x + dx, y + dy, -1, bank);
      }
    }
  }
  return cubes;
}
