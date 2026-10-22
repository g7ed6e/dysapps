// Les lieux du 4e en ruines simples (lot 1 du monde ouvert du 4e, « l'île entière en grandes masses ») : à leur place,
// une silhouette lisible pour chacun, sans les finir ; leurs étapes viennent avec leur lot, un lieu par lot, et un lieu
// construit quitte ce fichier (la Forge, la Soute, la Porte et l'Étalon au lot 2, ./forge4e.ts, ./soute4e.ts, ./porte4e.ts,
// ./etalon4e.ts ; le Gabarit et le Chariot au lot 3, ./gabarit4e.ts, ./chariot4e.ts).
// Chaque ruine est dessinée dans le repère de son lieu (y = 0 au sol, sous le centre ; x vers l'est, z vers le sud), en
// quelques volumes de 4 à 6 aplats de la palette chaude du 4e (./plan4e.ts, `COLORS_4E`) : la brique et la terre cuite
// de l'usine, le fer rouillé et le cuivre, la pierre grise des Passeurs, le bois gris de la ruine, le basalte brun du
// volcan ; rien de presque noir, rien à lire (fiche, § 6 bis : ni chiffre, ni mot, ni cheminée d'usine). Les signatures
// sont celles de la fiche (§ 7), à grands traits : la halle à verrière de la Manufacture, la trémie du Terminus, les colonnes de basalte des Orgues… Code pur.
import type { FacetBuilder } from './facets';
import { COLORS_4E, type BuiltPlace4e, type PlaceId4e } from './plan4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente. */
const SINK = -0.8;

const C = {
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  terracotta: COLORS_4E.terracotta,
  stone: COLORS_4E.stone,
  stoneShade: COLORS_4E.stoneShade,
  stoneSun: COLORS_4E.stoneSun,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  rust: COLORS_4E.rust,
  rustShade: COLORS_4E.rustShade,
  copper: COLORS_4E.copper,
  basalt: COLORS_4E.crust,
  basaltSun: COLORS_4E.rock,
  // Le verre d'une verrière brisée : un gris-bleu clair, mat (jamais un reflet).
  glass: 0x9fb4b8,
  // La vigne de la Veillée, les plantes de l'Herbier : un vert olive sec.
  leaf: 0x8a8a4c,
} as const;

/** Un tas de blocs tombés : trois pavés de travers. */
function rubble(b: FacetBuilder, x: number, z: number, s: number, color: number, top: number): void {
  b.box({ x, y: SINK, z, yaw: 0.4 }, [s, s * 0.7 - SINK, s * 0.8], color, top);
  b.box({ x: x + s * 0.8, y: SINK, z: z + s * 0.3, yaw: 1.1 }, [s * 0.6, s * 0.45 - SINK, s * 0.6], color, top);
  b.box({ x: x - s * 0.5, y: SINK, z: z + s * 0.7, yaw: 2.3 }, [s * 0.5, s * 0.35 - SINK, s * 0.7], color, top);
}

/** Un pan de mur de brique : son milieu, sa longueur, sa hauteur, son cap ; son chaperon de pierre. */
function wall(b: FacetBuilder, x: number, z: number, length: number, height: number, yaw = 0, thick = 0.7): void {
  b.box({ x, y: SINK, z, yaw }, [length, height - SINK, thick], C.brickShade, C.brick);
  b.box({ x, y: height, z, yaw }, [length + 0.1, 0.25, thick + 0.15], C.stoneShade, C.stoneSun);
}

/** Un poteau de bois, cassé ou non. */
const post = (b: FacetBuilder, x: number, z: number, h: number, w = 0.5): void => b.box({ x, y: SINK, z }, [w, h - SINK, w], C.woodShade, C.wood);

/** La Manufacture : une longue halle de brique ouverte, sa charpente de fonte et sa verrière au faîte, à moitié tombée ; aucune cheminée. */
function manufacture(b: FacetBuilder): void {
  wall(b, 0, -4.5, 18, 4.2);
  wall(b, -4, 4.5, 10, 4.2);
  b.box({ x: 6.5, y: SINK, z: 4.5 }, [5, 1.6 - SINK, 0.7], C.brickShade, C.brick);
  for (const x of [-8, -4, 0, 4]) b.beam({ x, y: 4.2, z: -4.5 }, { x, y: 7, z: 0 }, 0.3, C.rust);
  for (const x of [-8, -4]) b.beam({ x, y: 7, z: 0 }, { x, y: 4.2, z: 4.5 }, 0.3, C.rust);
  b.box({ x: -6, y: 6.9, z: -2.2, pitch: -0.55 }, [4, 0.12, 5.2], C.glass);
  b.box({ x: 5, y: SINK, z: 1, yaw: 0.6 }, [3, 1.2 - SINK, 1.6], C.rustShade, C.rust);
}

/** La Loge : le mur du théâtre, haut et sans toit ; les cintres, deux poutres en travers ; un tambour couché ; le rideau tombé. */
function loge(b: FacetBuilder): void {
  wall(b, 0, 3, 11, 8);
  wall(b, -5.2, 0, 6, 6, Math.PI / 2);
  b.box({ x: 1, y: 6.5, z: 0.5 }, [10, 0.4, 0.4], C.woodShade, C.wood);
  b.beam({ x: 4.5, y: 6.5, z: 0.5 }, { x: 5.5, y: 0, z: -2.5 }, 0.4, C.wood);
  b.drum({ x: 2, y: SINK, z: -2.5, pitch: Math.PI / 2 }, 1.3, 0.6, 10, C.wood, C.woodShade);
  b.box({ x: -1.5, y: SINK, z: 0, yaw: 0.1 }, [5, 0.6 - SINK, 2.2], C.brickShade, C.terracotta);
}

/** L'Herbier : la serre de fonte, sa charpente debout, son verre presque tout tombé ; des bacs ; la pompe. */
function herbier(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [12, 0.6 - SINK, 7], C.stoneShade, C.stone);
  for (const x of [-5.5, -2, 1.5, 5]) {
    b.beam({ x, y: 0.6, z: -3.3 }, { x, y: 4.4, z: -1 }, 0.22, C.rust);
    b.beam({ x, y: 4.4, z: -1 }, { x, y: 4.4, z: 1 }, 0.22, C.rust);
    b.beam({ x, y: 4.4, z: 1 }, { x, y: 0.6, z: 3.3 }, 0.22, C.rust);
  }
  b.box({ x: -3.8, y: 4.4, z: 0, pitch: 0 }, [3.6, 0.1, 2], C.glass);
  for (const x of [-4, 0, 4]) b.box({ x, y: 0.6, z: 1.6 }, [2.4, 0.6, 1.2], C.brickShade, C.leaf);
  b.prism({ x: 6.2, y: 0.6, z: -2.5 }, 0.35, 0.3, 1.6, 6, C.copper);
}

/** Les Roches : une salle basse de pierre ouverte sur la pente, sans toit ; des casiers de bois ; la grande table de tri. */
function roches(b: FacetBuilder): void {
  wall(b, 0, -3.5, 10, 3.4, 0, 1);
  wall(b, -4.8, 0, 7, 2.6, Math.PI / 2, 1);
  for (const x of [-3, 0, 3]) b.box({ x, y: SINK, z: -2.4 }, [2.6, 2.4 - SINK, 1], C.woodShade, C.wood);
  b.box({ x: 1, y: SINK, z: 1, yaw: 0.1 }, [5, 1 - SINK, 2.2], C.woodShade, C.wood);
  rubble(b, 3, 3.5, 0.9, C.basalt, C.basaltSun);
}

/** La Jonction : le poste d'aiguillage de bois sans toit ; ses leviers de fer ; la plaque tournante bloquée ; un rail tordu. */
function jonction(b: FacetBuilder): void {
  b.box({ x: -3, y: SINK, z: -2 }, [3.2, 2.8 - SINK, 2.6], C.woodShade, C.wood);
  for (let k = 0; k < 4; k++) b.beam({ x: -4 + k * 0.7, y: 2.8, z: -2 }, { x: -4 + k * 0.7 + 0.3, y: 3.8, z: -1.6 }, 0.12, C.rust);
  b.prism({ x: 3, y: SINK, z: 1, yaw: 0.3 }, 3, 3, 0.4 - SINK, 12, C.stoneShade, C.stone);
  b.box({ x: 3, y: 0.4, z: 1, yaw: 0.6 }, [5.6, 0.14, 0.7], C.rustShade, C.rust);
  b.beam({ x: -1, y: 0.2, z: 3 }, { x: 1.5, y: 1.1, z: 4.2 }, 0.16, C.rust);
  b.box({ x: 0, y: SINK, z: -4, yaw: 0 }, [0.3, 2.2 - SINK, 0.3], C.rustShade);
  b.box({ x: 0, y: 2.2, z: -4 }, [0.5, 0.6, 0.5], C.copper);
}

/** La Veillée : basse, sans verticale haute ; la tonnelle, ses poteaux et sa vigne en partie tombée ; la grande table et ses bancs. */
function veillee(b: FacetBuilder): void {
  for (const x of [-4, 0, 4]) for (const z of [-2.5, 2.5]) post(b, x, z, x === 4 && z === 2.5 ? 1.2 : 3, 0.35);
  b.box({ x: -1.5, y: 3, z: 0 }, [6, 0.3, 5.6], C.leaf);
  b.box({ x: 0, y: SINK, z: 0 }, [6, 1 - SINK, 1.6], C.woodShade, C.wood);
  for (const z of [-1.5, 1.5]) b.box({ x: 0, y: SINK, z }, [5.6, 0.55 - SINK, 0.5], C.woodShade);
  b.prism({ x: 5.5, y: SINK, z: -3, yaw: 0.4 }, 0.8, 0.6, 0.8 - SINK, 7, C.rust, C.rustShade);
}

/** La Basilique : des colonnes de basalte, trois debout, deux couchées ; le pavement ; la vasque de la fontaine, sèche. */
function basilique(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [12, 0.5 - SINK, 8], C.stoneShade, C.stoneSun);
  for (const [x, z, h] of [[-4.5, -3, 6], [-1.5, -3, 6], [1.5, -3, 2.2], [4.5, -3, 6], [-4.5, 3, 1.4]] as const) b.prism({ x, y: 0.5, z }, 0.65, 0.58, h, 6, C.basalt, C.basaltSun);
  b.box({ x: 2, y: 0.5, z: 2, yaw: 1.4, pitch: Math.PI / 2 }, [1.2, 5, 1.2], C.basalt, C.basaltSun);
  b.prism({ x: 0, y: 0.5, z: 0.5 }, 1.4, 1.6, 0.8, 8, C.stone, C.stoneShade);
}

/** Le Terminus : le quai de chargement ; la trémie de bois, haute, sur ses pieds ; la remise sans toit ; une benne couchée. */
function terminus(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 2 }, [12, 1.2 - SINK, 3], C.stoneShade, C.stone);
  for (const [x, z] of [[-2, -3], [2, -3], [-2, 0], [2, 0]] as const) post(b, x, z, 5);
  b.prism({ x: 0, y: 5, z: -1.5, yaw: Math.PI / 4 }, 1.2, 3.4, 3, 4, C.woodShade, C.wood);
  wall(b, 6, -2, 4, 3.2, Math.PI / 2);
  b.box({ x: -5, y: SINK, z: -2, yaw: 0.6, pitch: 0.4 }, [1.8, 1.3 - SINK, 2.6], C.rustShade, C.rust);
}

/** Les Orgues : un front de taille en colonnes de basalte hexagonales, de hauteurs inégales ; des blocs emboîtés ; le palan tombé. */
function orgues(b: FacetBuilder): void {
  const heights = [6, 8.5, 7.2, 9.4, 5.6, 8, 6.8];
  heights.forEach((h, k) => b.prism({ x: -6 + k * 1.9, y: SINK, z: -2.5 + (k % 2) * 0.8 }, 1.1, 1.1, h - SINK, 6, k % 2 ? C.basalt : C.basaltSun, C.basaltSun));
  for (const [x, z, h] of [[-3, 2.5, 1], [0.5, 3, 1.4], [3.5, 2.2, 0.8]] as const) b.prism({ x, y: SINK, z }, 1, 1, h - SINK, 6, C.basalt, C.basaltSun);
  b.beam({ x: 6, y: 0, z: 2 }, { x: 8, y: 0.3, z: -2 }, 0.4, C.wood);
}

/** La Dynamo : un petit poste de pierre, son toit tombé ; la dynamo, un tambour de cuivre ; deux poteaux, l'un debout, l'autre penché. */
function dynamo(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: -1 }, [6, 3.6 - SINK, 5], C.stoneShade, C.stone);
  b.box({ x: 3.6, y: SINK, z: 2, yaw: 0.4, pitch: 0.5 }, [4, 0.3 - SINK, 3], C.rustShade, C.terracotta);
  b.drum({ x: -1, y: 3.6, z: -1, pitch: Math.PI / 2 }, 1.1, 1.6, 10, C.copper, C.rust);
  post(b, -5, 3, 6, 0.35);
  b.beam({ x: 5, y: 0, z: -3 }, { x: 6.8, y: 4.6, z: -3.6 }, 0.35, C.wood);
}

/**
 * La ruine de chaque lieu du 4e pas encore construit, dessinée dans son repère : un lieu construit (./plan4e.ts,
 * `BUILT_PLACES_4E` ; la Forge, la Soute, la Porte et l’Étalon au lot 2, le Gabarit et le Chariot au lot 3) dessine sa ruine dans son fichier, avec ses étapes.
 */
export const RUINS_4E: Readonly<Record<Exclude<PlaceId4e, BuiltPlace4e>, (b: FacetBuilder) => void>> = {
  manufacture,
  loge,
  herbier,
  roches,
  jonction,
  veillee,
  basilique,
  terminus,
  orgues,
  dynamo,
};
