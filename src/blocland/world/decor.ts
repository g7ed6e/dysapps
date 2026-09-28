// Le décor du monde, rangé à part du terrain (./terrain.ts) : les arbres, buissons, fleurs et rochers du paysage, le
// décor propre au cœur de chaque île, les repères (un grand ouvrage par région, visible de loin), les cascades des îles
// en altitude et l'habillage de la mer (rochers qui affleurent, bancs de sable). Générateur pur, sans Three.js : il pose
// des cubes par une fonction `put` que lui donne le terrain, qui décide où ils vont et ce qu'ils ne recouvrent pas.
import { BLOCKS, type BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import { CORE, inCore, isLand, noise, type ArchipelagoId, type Decor, type IslandDef, type LandCell } from './map';

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
export const REED = '#8fae4f';
export const CRYSTAL = '#5cd0c8';
export const FLOWERS = ['#e8557a', '#f2c14e', '#f7f2e8', '#b56cd8'];
export const MUSHROOM = '#d9453f';

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
  foret: (put, h) => {
    for (const [tx, ty, tall] of [
      [8, 2, 2],
      [10, 4, 3],
      [3, 9, 2],
      [1, 10, 3],
    ] as const)
      tree(put, tx, ty, h(tx, ty), tall);
  },
  mine: (put, h) => {
    // Un amas de roche et l'entrée sombre d'une galerie.
    for (const [x, y, z] of [
      [8, 3, 1],
      [9, 3, 1],
      [9, 4, 1],
      [8, 3, 2],
    ] as const)
      put(x, y, h(x, y) + z, BLOCKS.pierre.side);
    for (const [x, y] of [
      [2, 10],
      [3, 10],
    ] as const) {
      put(x, y, h(x, y) + 1, DARK);
      put(x, y, h(x, y) + 2, DARK);
    }
    put(1, 9, h(1, 9) + 1, BLOCKS.pierre.side);
    put(4, 11, h(4, 11) + 1, BLOCKS.pierre.side);
  },
  carriere: (put, h) => {
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS.sable.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.sable.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.sable.side);
  },
  ferme: (put, h) => {
    // Un champ de blé et deux poteaux de barrière.
    for (let dy = 2; dy <= 5; dy++) {
      put(8, dy, h(8, dy) + 1, HAY);
      if (dy % 2) put(9, dy, h(9, dy) + 1, HAY);
    }
    put(6, 1, h(6, 1) + 1, TRUNK);
    put(3, 10, h(3, 10) + 1, TRUNK);
    tree(put, 4, 10, h(4, 10), 2);
  },
  tour: (put, h) => {
    // Une tour de verre avec un sommet en or.
    for (let z = 1; z <= 5; z++)
      for (const [dx, dy] of [
        [8, 4],
        [9, 4],
        [8, 5],
        [9, 5],
      ] as const)
        put(dx, dy, h(dx, dy) + z, BLOCKS.verre.side);
    put(8, 4, h(8, 4) + 6, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.pierre.side);
  },
  plaine: (put, h) => {
    // Un boulier de briques : deux rangées de cinq, séparées (on compte par cinq), et une borne de brique.
    for (let i = 0; i < 5; i++) {
      put(7 + i, 2, h(7 + i, 2) + 1, i < 3 ? BLOCKS.brique.side : BLOCKS.sable.side);
      put(7 + i, 4, h(7 + i, 4) + 1, i < 2 ? BLOCKS.brique.side : BLOCKS.sable.side);
    }
    put(3, 9, h(3, 9) + 1, BLOCKS.brique.side);
    put(3, 9, h(3, 9) + 2, BLOCKS.brique.side);
    tree(put, 1, 10, h(1, 10), 2);
  },
  riviere: (put, h) => {
    // Une mare de verre bordée de galets, un nénuphar, et des roseaux.
    for (const [x, y] of [
      [8, 3],
      [9, 3],
      [8, 4],
      [9, 4],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.verre.side);
    put(9, 4, h(9, 4) + 2, LEAF);
    for (const [x, y] of [
      [7, 2],
      [10, 5],
      [7, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.galet.side);
    put(3, 9, h(3, 9) + 1, TRUNK);
    put(3, 9, h(3, 9) + 2, TRUNK);
    put(3, 9, h(3, 9) + 3, LEAF);
    put(1, 10, h(1, 10) + 1, BLOCKS.galet.side);
  },
  volcan: (put, h) => {
    // Un petit cône de pierre au sommet incandescent, des blocs d'obsidienne épars.
    for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) put(8 + dx, 3 + dy, h(8 + dx, 3 + dy) + 1, BLOCKS.pierre.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.pierre.side);
    put(9, 4, h(9, 4) + 3, HAY);
    put(3, 9, h(3, 9) + 1, BLOCKS.obsidienne.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.obsidienne.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.obsidienne.side);
  },
  glacier: (put, h) => {
    // Des congères de neige et une stalagmite de glace ; un thermomètre de blocs (froid en bas, chaud en haut).
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, SNOW);
    for (let z = 1; z <= 4; z++) put(10, 3, h(10, 3) + z, z <= 2 ? BLOCKS.glace.side : z === 3 ? BLOCKS.verre.side : HAY);
    put(3, 9, h(3, 9) + 1, SNOW);
    put(1, 10, h(1, 10) + 1, BLOCKS.glace.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.glace.side);
  },
  marche: (put, h) => {
    // Un étal à auvent de toile sur des poteaux, des caisses.
    for (const [x, y] of [
      [7, 2],
      [10, 2],
      [7, 5],
      [10, 5],
    ] as const) {
      put(x, y, h(x, y) + 1, TRUNK);
      put(x, y, h(x, y) + 2, TRUNK);
    }
    for (let dx = 7; dx <= 10; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 3, BLOCKS.toile.side);
    put(8, 3, h(8, 3) + 1, BLOCKS.bois.side);
    put(9, 4, h(9, 4) + 1, BLOCKS.bois.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.bois.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.toile.side);
  },
  carrefour: (put, h) => {
    // Un poteau indicateur à trois panneaux, et une borne.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, TRUNK);
    put(8, 3, h(8, 3) + 3, BLOCKS.panneau.side);
    put(10, 3, h(10, 3) + 4, BLOCKS.panneau.side);
    put(9, 4, h(9, 4) + 2, BLOCKS.panneau.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.pierre.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.panneau.side);
    tree(put, 7, 5, h(7, 5), 2);
  },
  marais: (put, h) => {
    // Des flaques de verre, des roseaux, une souche.
    for (const [x, y] of [
      [8, 2],
      [9, 2],
      [8, 3],
      [10, 4],
      [10, 5],
    ] as const)
      put(x, y, h(x, y) + 1, BLOCKS.verre.side);
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
  forge: (put, h) => {
    // Une cheminée de pierre au sommet incandescent, une enclume d'acier, des lingots.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, z === 4 ? HAY : BLOCKS.pierre.side);
    put(8, 5, h(8, 5) + 1, BLOCKS.acier.side);
    put(10, 5, h(10, 5) + 1, BLOCKS.acier.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.or.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.acier.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.acier.side);
  },
  atelier: (put, h) => {
    // Une table à dessin (planches sur pieds) avec un calque, une pile de calques.
    put(8, 3, h(8, 3) + 1, TRUNK);
    put(10, 3, h(10, 3) + 1, TRUNK);
    for (let dx = 8; dx <= 10; dx++) put(dx, 3, h(dx, 3) + 2, BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 3, BLOCKS.calque.side);
    put(9, 5, h(9, 5) + 1, BLOCKS.calque.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.calque.side);
    put(3, 9, h(3, 9) + 2, BLOCKS.calque.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  falaise: (put, h) => {
    // Une paroi d'ardoise en escalier, une corde (barrière) qui pend, un rocher.
    for (let z = 1; z <= 4; z++) for (let dx = 0; dx < 5 - z; dx++) put(7 + dx, 2, h(7 + dx, 2) + z, BLOCKS.ardoise.side);
    put(9, 3, h(9, 3) + 1, BLOCKS.pierre.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.ardoise.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
    put(1, 10, h(1, 10) + 2, BLOCKS.pierre.side);
  },
  cabinet: (put, h) => {
    // Des étagères de bois chargées de parchemins, un pupitre.
    for (const x of [8, 10]) for (let z = 1; z <= 3; z++) put(x, 3, h(x, 3) + z, z === 2 ? BLOCKS.parchemin.side : BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 3, BLOCKS.bois.side);
    put(9, 3, h(9, 3) + 1, BLOCKS.parchemin.side);
    put(8, 5, h(8, 5) + 1, BLOCKS.bois.side);
    put(8, 5, h(8, 5) + 2, BLOCKS.parchemin.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.parchemin.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.bois.side);
  },
  belvedere: (put, h) => {
    // Un kiosque : quatre colonnes de marbre et un toit de marbre, un triangle 3-4-5 au sol.
    for (const [x, y] of [
      [7, 2],
      [10, 2],
      [7, 5],
      [10, 5],
    ] as const)
      for (let z = 1; z <= 3; z++) put(x, y, h(x, y) + z, BLOCKS.marbre.side);
    for (let dx = 7; dx <= 10; dx++) for (let dy = 2; dy <= 5; dy++) put(dx, dy, h(dx, dy) + 4, BLOCKS.marbre.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.marbre.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  donnees: (put, h) => {
    // Un télescope (tronc incliné en escalier) et un dôme de quartz.
    for (let i = 0; i < 4; i++) put(7 + i, 3, h(7 + i, 3) + 1 + i, i === 3 ? BLOCKS.verre.side : TRUNK);
    put(9, 5, h(9, 5) + 1, BLOCKS.quartz.side);
    put(9, 5, h(9, 5) + 2, BLOCKS.quartz.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.quartz.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  phare: (put, h) => {
    // Un phare : tour de pierre, lanterne de prisme au sommet.
    for (let z = 1; z <= 5; z++) put(9, 3, h(9, 3) + z, z === 5 ? BLOCKS.prisme.side : BLOCKS.pierre.side);
    put(9, 3, h(9, 3) + 6, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.prisme.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  textes: (put, h) => {
    // Une lunette d'observation sur son pied, une pile de livres (planches et parchemin), une lentille au sol.
    put(9, 3, h(9, 3) + 1, BLOCKS.pierre.side);
    put(9, 3, h(9, 3) + 2, BLOCKS.pierre.side);
    for (let i = 0; i < 3; i++) put(8 + i, 4, h(8 + i, 4) + 3, i === 2 ? BLOCKS.lentille.side : TRUNK);
    put(7, 2, h(7, 2) + 1, BLOCKS.bois.side);
    put(7, 2, h(7, 2) + 2, BLOCKS.parchemin.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.lentille.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  baie: (put, h) => {
    // Une cabine téléphonique rouge (vitrée, toit sombre), un réverbère, une caisse de cabines au sol.
    for (let z = 1; z <= 3; z++) put(9, 3, h(9, 3) + z, BLOCKS.cabine.side);
    put(9, 3, h(9, 3) + 4, DARK);
    for (let z = 1; z <= 3; z++) put(11, 5, h(11, 5) + z, DARK);
    put(11, 5, h(11, 5) + 4, BLOCKS.lanterne.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.cabine.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  horloge: (put, h) => {
    // Une tour d'horloge de pierre, cadran au sommet et flèche de laiton ; un rouage de cadrans au sol.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, z === 4 ? BLOCKS.cadran.side : BLOCKS.pierre.side);
    put(9, 3, h(9, 3) + 5, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.cadran.side);
    put(4, 9, h(4, 9) + 1, BLOCKS.cadran.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  comptoir: (put, h) => {
    // Un étal : deux poteaux, un auvent de tuiles, une caisse de bois devant ; une pile de tuiles au sol.
    for (const px of [8, 10]) for (let z = 1; z <= 2; z++) put(px, 3, h(px, 3) + z, TRUNK);
    for (let x = 8; x <= 10; x++) put(x, 3, h(x, 3) + 3, BLOCKS.tuile.side);
    put(9, 4, h(9, 4) + 1, BLOCKS.bois.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.tuile.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  manoir: (put, h) => {
    // Une tour de lambris sombre, un toit noir et une bougie au sommet ; un pilier de grille en pierre.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, BLOCKS.lambris.side);
    put(9, 3, h(9, 3) + 5, DARK);
    put(9, 3, h(9, 3) + 6, BLOCKS.lanterne.side);
    for (let z = 1; z <= 2; z++) put(7, 2, h(7, 2) + z, BLOCKS.pierre.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.lambris.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  theatre: (put, h) => {
    // Une petite scène : deux colonnes de rideau pourpre, une frise au-dessus, deux lanternes de rampe devant.
    for (const px of [8, 10]) for (let z = 1; z <= 3; z++) put(px, 3, h(px, 3) + z, BLOCKS.velours.side);
    for (let x = 8; x <= 10; x++) put(x, 3, h(x, 3) + 4, BLOCKS.velours.side);
    put(8, 2, h(8, 2) + 1, BLOCKS.lanterne.side);
    put(10, 2, h(10, 2) + 1, BLOCKS.lanterne.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.velours.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  gare: (put, h) => {
    // Une voie ferrée courte, un signal (poteau et lanterne), une pile de rails au sol.
    for (let x = 6; x <= 11; x++) put(x, 4, h(x, 4) + 1, BLOCKS.rail.side);
    for (let z = 1; z <= 3; z++) put(12, 3, h(12, 3) + z, DARK);
    put(12, 3, h(12, 3) + 4, BLOCKS.lanterne.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.rail.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  studio: (put, h) => {
    // Un mât d'antenne sur un socle de pierre, un voyant au sommet ; une antenne tombée au sol.
    put(9, 3, h(9, 3) + 1, BLOCKS.pierre.side);
    for (let z = 2; z <= 5; z++) put(9, 3, h(9, 3) + z, BLOCKS.antenne.side);
    put(9, 3, h(9, 3) + 6, BLOCKS.lanterne.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.antenne.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
  chateau: (put, h) => {
    // Une tourelle de pierre de taille, deux créneaux, une bannière d'or au sommet ; un bloc de taille au sol.
    for (let z = 1; z <= 4; z++) put(9, 3, h(9, 3) + z, BLOCKS.taille.side);
    put(8, 3, h(8, 3) + 1, BLOCKS.taille.side);
    put(10, 3, h(10, 3) + 1, BLOCKS.taille.side);
    put(9, 3, h(9, 3) + 5, BLOCKS.or.side);
    put(3, 9, h(3, 9) + 1, BLOCKS.taille.side);
    put(1, 10, h(1, 10) + 1, BLOCKS.pierre.side);
  },
};

/** Un élément de décor posé sur une case, au-dessus de son sol (z = 1 juste au-dessus). `r` : grain 0..1 pour varier. */
export function decorate(place: Put, kind: Decor, x: number, y: number, r: number): void {
  const id = `${kind}@${x},${y}`;
  const put: Put = (px, py, pz, color) => place(px, py, pz, color, id);
  switch (kind) {
    case 'arbre':
      tree(place, x, y, 0, r > 0.5 ? 3 : 2);
      break;
    case 'sapin': {
      const tall = r > 0.5 ? 2 : 1;
      for (let z = 1; z <= tall; z++) put(x, y, z, TRUNK);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(x + dx, y + dy, tall + 1, PINE);
      put(x + 1, y, tall + 2, PINE);
      put(x - 1, y, tall + 2, PINE);
      put(x, y + 1, tall + 2, PINE);
      put(x, y - 1, tall + 2, PINE);
      put(x, y, tall + 2, PINE);
      put(x, y, tall + 3, PINE);
      break;
    }
    case 'buisson':
      put(x, y, 1, LEAF);
      if (r > 0.7) put(x + 1, y, 1, LEAF);
      break;
    case 'fleur':
      put(x, y, 1, FLOWERS[Math.floor(r * FLOWERS.length) % FLOWERS.length]);
      break;
    case 'rocher':
      put(x, y, 1, BLOCKS.pierre.side);
      if (r > 0.8) put(x, y, 2, BLOCKS.pierre.side);
      break;
    case 'roseau':
      put(x, y, 1, REED);
      put(x, y, 2, REED);
      break;
    case 'cristal':
      put(x, y, 1, CRYSTAL);
      if (r > 0.6) put(x, y, 2, CRYSTAL);
      break;
    case 'souche':
      put(x, y, 1, TRUNK);
      break;
    case 'champignon':
      put(x, y, 1, MUSHROOM);
      break;
  }
}

export const SMOKE = '#a9a4a0';

/** Les repères : un grand ouvrage par région, visible de loin, posé sur la terre autour du cœur. */
export const REPERES = ['grand-arbre', 'champignon-geant', 'fumee', 'tour-de-guet', 'grand-phare', 'aiguille-de-glace', 'haut-fourneau'] as const;
export type Repere = (typeof REPERES)[number];
const LANDMARK_OF: Partial<Record<BiomeId, Repere>> = {
  foret: 'grand-arbre',
  marais: 'champignon-geant',
  volcan: 'fumee',
  mine: 'tour-de-guet',
  phare: 'grand-phare',
  glacier: 'aiguille-de-glace',
  forge: 'haut-fourneau',
};

/**
 * Le décor bâti : nommé comme le reste du décor (ses cubes se rangent ensemble), mais le sol le porte comme une
 * construction : la marche ne l'enjambe pas et le compte dans la hauteur du sol, la pente ne l'abaisse pas, la 2D le
 * dessine en cubes. Les repères, les cascades et l'habillage de la mer (écueils et bancs).
 */
export const DECOR_BATI: ReadonlySet<string> = new Set<string>([...REPERES, 'cascade', 'ecueil', 'banc']);

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

/**
 * Pose le repère d'une île (s'il en a un). `place` travaille en coordonnées du monde, z relatif au sol de l'île ; le
 * repère porte un nom de décor, « genre@x,y » (sa première case).
 */
export function landmark(def: IslandDef, scenery: LandCell[], place: Put): void {
  const kind = LANDMARK_OF[def.id];
  if (!kind) return;
  let id: string = kind;
  const named = (x: number, y: number) => (id = `${kind}@${x},${y}`);
  const put = (x: number, y: number, z: number, color: string) => place(x, y, z, color, id);
  const backY = def.core.y + CORE + 1;
  switch (kind) {
    case 'grand-arbre': {
      // Un chêne géant : tronc 2 × 2 de six blocs, large couronne en trois étages.
      const s = findSpot(def, scenery, def.core.x - 4, backY, 2);
      if (!s) return;
      named(s.x, s.y);
      for (let z = 1; z <= 6; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, TRUNK);
      for (let dx = -2; dx <= 3; dx++)
        for (let dy = -2; dy <= 3; dy++) if (Math.abs(dx - 0.5) + Math.abs(dy - 0.5) <= 4) put(s.x + dx, s.y + dy, s.h + 7, LEAF);
      for (let dx = -1; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) put(s.x + dx, s.y + dy, s.h + 8, LEAF);
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + 9, LEAF);
      return;
    }
    case 'champignon-geant': {
      // Un champignon géant : pied clair de trois blocs, chapeau rouge à points blancs.
      const s = findSpot(def, scenery, def.core.x + CORE + 2, backY, 1);
      if (!s) return;
      named(s.x, s.y);
      for (let z = 1; z <= 3; z++) put(s.x, s.y, s.h + z, BLOCKS.sable.side);
      for (let dx = -2; dx <= 2; dx++)
        for (let dy = -2; dy <= 2; dy++)
          if (Math.abs(dx) + Math.abs(dy) <= 3) put(s.x + dx, s.y + dy, s.h + 4, (dx + dy) % 2 === 0 && Math.abs(dx) + Math.abs(dy) === 2 ? SNOW : MUSHROOM);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(s.x + dx, s.y + dy, s.h + 5, MUSHROOM);
      put(s.x, s.y, s.h + 6, SNOW);
      return;
    }
    case 'fumee': {
      // Le cône fume : des volutes grises qui montent au-dessus du cratère, décalées comme au vent.
      const lava = scenery.filter((c) => c.ground === 'lave');
      if (!lava.length) return;
      const cx = Math.round(lava.reduce((a, c) => a + c.x, 0) / lava.length);
      const cy = Math.round(lava.reduce((a, c) => a + c.y, 0) / lava.length);
      const top = Math.max(...lava.map((c) => c.h)) + 2;
      named(cx, cy);
      for (const [dx, dy, dz] of PUFFS) put(cx + dx, cy + dy, top + dz, SMOKE);
      return;
    }
    case 'aiguille-de-glace': {
      // Une aiguille de glace : un pilier 2 × 2 de cinq blocs, une pointe de trois, un cristal qui brille au sommet.
      const s = findSpot(def, scenery, def.core.x - 4, backY, 2);
      if (!s) return;
      named(s.x, s.y);
      for (let z = 1; z <= 5; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, BLOCKS.glace.side);
      for (let z = 6; z <= 8; z++) put(s.x, s.y, s.h + z, BLOCKS.glace.side);
      put(s.x, s.y, s.h + 9, CRYSTAL);
      return;
    }
    case 'haut-fourneau': {
      // Le haut-fourneau de la Forge : une cheminée de basalte 2 × 2 de neuf blocs, la lave qui rougeoie au sommet, la fumée au vent.
      const s = findSpot(def, scenery, def.core.x + CORE + 2, backY, 2);
      if (!s) return;
      named(s.x, s.y);
      for (let z = 1; z <= 9; z++) for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + z, BASALT);
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(s.x + dx, s.y + dy, s.h + 10, LAVA);
      for (const [dx, dy, dz] of PUFFS) put(s.x + dx, s.y + dy, s.h + 9 + dz, SMOKE);
      return;
    }
    case 'tour-de-guet': {
      // Une tour de guet de pierre au sommet du pic, sa bannière de toile en haut.
      const peak = scenery.reduce((a, c) => (c.h > a.h && c.ground !== 'lave' ? c : a), scenery[0]);
      named(peak.x, peak.y);
      for (let z = 1; z <= 4; z++) put(peak.x, peak.y, peak.h + z, BLOCKS.pierre.side);
      put(peak.x, peak.y, peak.h + 5, BLOCKS.lanterne.side);
      put(peak.x + 1, peak.y, peak.h + 5, BLOCKS.toile.side);
      put(peak.x + 1, peak.y, peak.h + 4, BLOCKS.toile.side);
      return;
    }
    case 'grand-phare': {
      // Le grand phare : tour de pierre 2 × 2 de huit blocs, lanterne de quatre blocs au sommet, toit de prisme.
      const s = findSpot(def, scenery, def.core.x + CORE + 1, backY, 2);
      if (!s) return;
      named(s.x, s.y);
      for (let z = 1; z <= 10; z++)
        for (let dx = 0; dx < 2; dx++)
          for (let dy = 0; dy < 2; dy++)
            put(s.x + dx, s.y + dy, s.h + z, z === 9 ? BLOCKS.lanterne.side : z === 10 ? BLOCKS.prisme.side : z % 4 === 0 ? SNOW : BLOCKS.pierre.side);
      return;
    }
  }
}

/**
 * Les cascades : d'un lac d'une île en altitude, l'eau déborde au bord le plus proche et tombe jusqu'à la mer. Nom de
 * décor : « cascade@x,y » (la case du bord).
 */
export function cascades(def: IslandDef, scenery: LandCell[], place: Put): void {
  if (def.altitude === 0) return;
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
          put(x, y, -1, BLOCKS.pierre);
          const tall = 1 + Math.floor(n * 4);
          for (let z = 0; z < tall; z++) put(x, y, z, BLOCKS.ardoise);
          if (n > 0.7) put(x + 1, y, -1, BLOCKS.ardoise);
        } else {
          // Un rocher : un galet au ras de l'eau, parfois une pierre par-dessus, parfois un voisin.
          put(x, y, -1, BLOCKS.galet);
          if (n > 0.35) put(x, y, 0, BLOCKS.pierre);
          if (n > 0.6) put(x + 1, y, -1, BLOCKS.galet);
          if (n > 0.8) put(x, y + 1, -1, BLOCKS.pierre);
          if (n > 0.9) put(x, y, 1, BLOCKS.pierre);
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
        const bank = a === '5e' ? BLOCKS.glace : a === '4e' ? BLOCKS.galet : BLOCKS.sable;
        for (const [dx, dy] of cells.slice(0, n)) put(x + dx, y + dy, -1, bank);
      }
    }
  }
  return cubes;
}
