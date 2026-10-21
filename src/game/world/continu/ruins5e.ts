// Treize lieux du 5e en ruines simples (GD-22, lot 2, « toute l'île en grandes masses ») : à leur place, une
// silhouette lisible pour chacun, sans les finir (leurs étapes de chantier viendront avec leur lot). Chaque ruine est
// dessinée dans le repère de son lieu (y = 0 au sol, sous le centre), en quelques volumes de 4 à 6 aplats : la pierre
// des aiguilles (gris chaud moussu), le bois gris de la ruine, l'ocre des Contreforts, la mousse, le bronze éteint ; rien
// de presque noir, rien à lire. Retouche du lot 2 (directeur artistique : « des boîtes génériques ») : chaque ruine a sa
// hauteur et son contour propres. La Montée, finie au lot 3, a son fichier (./montee5e.ts), comme le Hameau (./hameau5e.ts, lot 5),
// les Radeaux (./radeaux5e.ts, lot 6), la Croisée (./croisee5e.ts, lot 7), les Instants (./instants5e.ts, lot 8), les
// Fumerolles (./fumerolles5e.ts, lot 9), l'Étuve (./etuve5e.ts, lot 10), les Terrasses (./terrasses5e.ts, lot 11),
// l'Auberge (./auberge5e.ts, lot 12), le Donjon (./donjon5e.ts, lot 13a) et l'Oracle (./oracle5e.ts, lot 13b). Code pur.
import type { FacetBuilder } from './facets';
import { COLORS_5E, type BuiltPlace5e, type PlaceId5e } from './plan5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente. */
const SINK = -0.8;

const C = {
  stone: COLORS_5E.stone,
  shade: COLORS_5E.stoneShade,
  sun: COLORS_5E.stoneSun,
  moss: COLORS_5E.plateauMoss,
  ochre: COLORS_5E.ochre,
  // Le bois gris de la ruine et son ombre (comme au 6e : délavé, jamais sombre).
  wood: 0x9f9279,
  woodShade: 0x86775f,
  // Le bronze éteint.
  bronze: 0x9c8452,
} as const;

/** Un tas de blocs tombés, au pied d'un mur : trois pavés de travers. */
function rubble(b: FacetBuilder, x: number, z: number, s: number, color: number, top: number): void {
  b.box({ x, y: SINK, z, yaw: 0.4 }, [s, s * 0.7 - SINK, s * 0.8], color, top);
  b.box({ x: x + s * 0.8, y: SINK, z: z + s * 0.3, yaw: 1.1 }, [s * 0.6, s * 0.45 - SINK, s * 0.6], color, top);
  b.box({ x: x - s * 0.5, y: SINK, z: z + s * 0.7, yaw: 2.3 }, [s * 0.5, s * 0.35 - SINK, s * 0.7], color, top);
}

/**
 * Un poteau cassé en biais : de section carrée `w`, posé en (`x`, `z`), du sol jusqu'à `low` d'un côté et `high` de
 * l'autre (une coupe nette, jamais une dent ni une équerre).
 */
function brokenPost(b: FacetBuilder, x: number, z: number, w: number, low: number, high: number): void {
  b.extrude(
    { x, y: 0, z: z - w / 2 },
    [
      [-w / 2, SINK],
      [w / 2, SINK],
      [w / 2, low],
      [-w / 2, high],
    ],
    w,
    C.wood,
    C.woodShade,
  );
}

/**
 * Le Sémaphore : un mât de bois sur un socle de pierre, cassé en biais à mi-hauteur ; son haut et ses deux bras tombés au
 * sol, au pied du socle. Rien en équerre en haut d'un poteau, rien qui pende (directeur artistique, retouche 1 du lot
 * 13a : les chaussées y mènent ; le lot 14 le remplace).
 */
function semaphore(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [4, 2 - SINK, 4], C.shade, C.stone);
  brokenPost(b, 0, 0, 0.9, 7.2, 8.4);
  b.box({ x: 3.6, y: SINK, z: -0.6, yaw: 1.3 }, [5.5, 0.6 - SINK, 0.8], C.woodShade, C.wood);
  b.box({ x: 2.8, y: SINK, z: 2.5, yaw: 0.9 }, [4, 0.5 - SINK, 0.6], C.woodShade, C.wood);
  b.box({ x: -2.6, y: SINK, z: -2.6, yaw: 2.2 }, [3.2, 0.45 - SINK, 0.6], C.woodShade, C.wood);
  rubble(b, -3, 2.2, 1.2, C.shade, C.moss);
}

/** Le Gaillard : le pont haut d'un vieux navire échoué sur le plateau, sur ses étais de pierre, son garde-corps cassé. */
function gaillard(b: FacetBuilder): void {
  for (const [x, z] of [[-3.5, -2], [3.5, -2], [-3.5, 2], [3.5, 2]] as const) b.box({ x, y: SINK, z }, [1.4, 3.2 - SINK, 1.4], C.shade, C.stone);
  b.box({ x: 0, y: 3.2, z: 0, pitch: 0.06 }, [10, 0.8, 6], C.woodShade, C.wood);
  // L'étrave : un coin relevé vers l'est.
  b.prism({ x: 5.4, y: 3.2, z: 0, yaw: 0 }, 3, 0.4, 2.2, 3, C.woodShade, C.wood);
  for (let k = 0; k < 4; k++) b.box({ x: -4 + k * 2.2, y: 4, z: 2.8 }, [0.4, k === 2 ? 0.5 : 1.6, 0.4], C.wood);
  b.box({ x: -1, y: 4, z: 2.8 }, [7, 0.35, 0.35], C.wood);
}

/**
 * Les Nacelles : un portique de bois tombé au bord du plateau : un seul poteau debout, cassé en biais ; l'autre poteau et
 * la poutre couchés au sol ; une nacelle tombée. Rien en équerre en haut d'un poteau, rien qui pende (directeur
 * artistique, retouche 1 du lot 13a : les chaussées passent dessous ; le lot 16 le remplace).
 */
function nacelles(b: FacetBuilder): void {
  brokenPost(b, -4, 0, 1.2, 5.6, 7.2);
  b.box({ x: 1.0, y: SINK, z: -2.5, yaw: 0.12 }, [7, 0.8 - SINK, 1.0], C.woodShade, C.wood);
  b.box({ x: 3.4, y: 0.4, z: 0.2, yaw: -0.2 }, [5.5, 0.8, 1.0], C.woodShade, C.wood);
  b.box({ x: 2.5, y: SINK, z: 3, yaw: 0.5, pitch: 0.3 }, [2.6, 1.8 - SINK, 2], C.woodShade, C.bronze);
  b.box({ x: 0, y: SINK, z: 0 }, [10, 0.4 - SINK, 3], C.shade, C.stone);
}

/**
 * La ruine de chaque lieu du 5e pas encore construit (les lieux construits ont leur fichier : ./montee5e.ts, lot 3 ;
 * ./hameau5e.ts, lot 5 ; ./radeaux5e.ts, lot 6 ; ./croisee5e.ts, lot 7 ; ./instants5e.ts, lot 8 ;
 * ./fumerolles5e.ts, lot 9 ; ./etuve5e.ts, lot 10 ; ./terrasses5e.ts, lot 11 ; ./auberge5e.ts, lot 12 ;
 * ./donjon5e.ts, lot 13a ; ./oracle5e.ts, lot 13b), dessinée dans son repère.
 */
export const RUINS_5E: Readonly<Record<Exclude<PlaceId5e, BuiltPlace5e>, (b: FacetBuilder) => void>> = {
  semaphore,
  gaillard,
  nacelles,
};
