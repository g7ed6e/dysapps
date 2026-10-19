// Les quatorze lieux du 5e en ruines simples (GD-22, lot 2, « toute l'île en grandes masses ») : à leur place, une
// silhouette lisible pour chacun, sans les finir (leurs étapes de chantier viendront avec leur lot). Chaque ruine est
// dessinée dans le repère de son lieu (y = 0 au sol, sous le centre), en quelques volumes de 4 à 6 aplats : la pierre
// des aiguilles (gris chaud moussu), le bois gris de la ruine, l'ocre des Contreforts, la mousse, le bronze éteint ; rien
// de presque noir, rien à lire. La Montée est la plus haute aiguille de l'île, au centre : un pilier à pans, son rail de
// cabine cassé à mi-hauteur, sa lanterne éteinte au sommet. Code pur.
import type { FacetBuilder } from './facets';
import { COLORS_5E, type PlaceId5e } from './plan5e';

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
  // Le bronze éteint de la lanterne de la Montée, et le toit d'ardoise des maisons (un gris-bleu franc).
  bronze: 0x9c8452,
  slate: 0x6f8089,
  // L'enduit passé des murs du Hameau et de l'Auberge.
  wall: 0xb9ae98,
} as const;

/** La hauteur de la Montée au-dessus de son pied : la plus haute aiguille, que l'on voit de toute l'île. */
export const MONTEE_HEIGHT = 46;

/** Le rayon du pied de la Montée. */
const MONTEE_RADIUS = 7;

/** Un tas de blocs tombés, au pied d'un mur : trois pavés de travers. */
function rubble(b: FacetBuilder, x: number, z: number, s: number, color: number, top: number): void {
  b.box({ x, y: SINK, z, yaw: 0.4 }, [s, s * 0.7 - SINK, s * 0.8], color, top);
  b.box({ x: x + s * 0.8, y: SINK, z: z + s * 0.3, yaw: 1.1 }, [s * 0.6, s * 0.45 - SINK, s * 0.6], color, top);
  b.box({ x: x - s * 0.5, y: SINK, z: z + s * 0.7, yaw: 2.3 }, [s * 0.5, s * 0.35 - SINK, s * 0.7], color, top);
}

/** Un mur bas cassé : un pavé dont le haut descend par marches. */
function brokenWall(b: FacetBuilder, x: number, z: number, length: number, height: number, yaw: number, color: number, top: number): void {
  const steps = 3;
  const w = length / steps;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  for (let k = 0; k < steps; k++) {
    const u = -length / 2 + w * (k + 0.5);
    const h = height * (1 - k * 0.3);
    b.box({ x: x + u * c, y: SINK, z: z - u * s, yaw }, [w, h - SINK, 0.8], color, top);
  }
}

/** La Montée : le pilier à pans, sa corniche, la lanterne éteinte, le rail de la cabine cassé, des blocs au pied. */
function montee(b: FacetBuilder): void {
  const H = MONTEE_HEIGHT;
  b.prism({ x: 0, y: SINK, z: 0, yaw: 0.3 }, MONTEE_RADIUS, MONTEE_RADIUS * 0.82, H * 0.55 - SINK, 7, C.stone, C.sun);
  b.prism({ x: 0, y: H * 0.55, z: 0, yaw: 0.75 }, MONTEE_RADIUS * 0.8, MONTEE_RADIUS * 0.6, H * 0.4, 7, C.shade, C.sun);
  // La corniche du sommet, puis la lanterne : quatre montants de bronze éteint, le toit pointu tombé de côté.
  b.prism({ x: 0, y: H * 0.95, z: 0, yaw: 0.3 }, MONTEE_RADIUS * 0.72, MONTEE_RADIUS * 0.72, H * 0.05, 7, C.sun, C.moss);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.4;
    const r = MONTEE_RADIUS * 0.42;
    const h = k === 2 ? 2.2 : 4.5;
    b.box({ x: r * Math.cos(a), y: H, z: r * Math.sin(a), yaw: a }, [0.7, h, 0.7], C.bronze);
  }
  b.prism({ x: -MONTEE_RADIUS * 0.3, y: H, z: MONTEE_RADIUS * 0.35, yaw: 0.2, pitch: 0.5 }, 2.6, 0, 2.6, 6, C.bronze);
  // Le rail de la cabine, côté plateau (au nord-est) : deux tronçons de poutre, le haut cassé, qui pend.
  b.beam({ x: 5.2, y: 1, z: -4.8 }, { x: 5.6, y: H * 0.42, z: -5.2 }, 0.9, C.woodShade);
  b.beam({ x: 5.6, y: H * 0.42, z: -5.2 }, { x: 7.4, y: H * 0.34, z: -6.8 }, 0.8, C.wood);
  rubble(b, -6.5, 5.5, 2.2, C.shade, C.moss);
}

/** Les Radeaux : trois plateformes de rondins, l'une penchée dans l'eau, et leurs pieux. */
function radeaux(b: FacetBuilder): void {
  b.box({ x: -2.5, y: SINK, z: 0, yaw: 0.2 }, [6, 1.2 - SINK, 4.5], C.woodShade, C.wood);
  b.box({ x: 3.5, y: SINK, z: -1.5, yaw: -0.3, pitch: 0.12 }, [5, 0.9 - SINK, 4], C.woodShade, C.wood);
  b.box({ x: 0.5, y: SINK, z: -5, yaw: 0.7 }, [4, 0.7 - SINK, 3], C.woodShade, C.wood);
  for (const [x, z, h] of [[-5.5, -2.5, 4.5], [0.5, 2.5, 3.5], [6.5, -3.5, 4], [-2, -6.5, 3]] as const) b.prism({ x, y: SINK, z }, 0.45, 0.35, h - SINK, 5, C.woodShade);
}

/** La Croisée : la borne de pierre du carrefour, cassée en biseau, sur son dallage en croix. */
function croisee(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [10, 0.35 - SINK, 3], C.shade, C.stone);
  b.box({ x: 0, y: SINK, z: 0 }, [3, 0.35 - SINK, 10], C.shade, C.stone);
  b.prism({ x: 0, y: 0.3, z: 0, yaw: Math.PI / 4 }, 1.6, 1.2, 6.5, 4, C.stone, C.sun);
  b.prism({ x: 0, y: 6.8, z: 0, yaw: Math.PI / 4 }, 1.2, 0.5, 1.4, 4, C.sun);
  b.box({ x: 2.6, y: SINK, z: 3.2, yaw: 0.6 }, [1.2, 0.9 - SINK, 3], C.shade, C.moss);
}

/** Les Instants : un cercle de pierres levées (un cadran), son style cassé, couché au milieu. */
function instants(b: FacetBuilder): void {
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const h = k % 3 === 1 ? 1.6 : 3.4 - (k % 2) * 0.8;
    b.box({ x: 5 * Math.cos(a), y: SINK, z: 5 * Math.sin(a), yaw: -a }, [1, h - SINK, 1.6], C.stone, C.sun);
  }
  b.prism({ x: 0, y: SINK, z: 0 }, 1.6, 1.6, 0.6 - SINK, 8, C.shade, C.moss);
  b.box({ x: 1.2, y: 0.6, z: 0.4, yaw: 0.5 }, [5, 0.8, 0.8], C.stone, C.sun);
}

/** Le Sémaphore : un mât de bois sur un socle de pierre, ses deux bras cassés, l'un tombé au pied. */
function semaphore(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [4, 2 - SINK, 4], C.shade, C.stone);
  b.box({ x: 0, y: 2, z: 0 }, [0.9, 13, 0.9], C.woodShade, C.wood);
  b.beam({ x: 0, y: 12, z: 0 }, { x: 3.4, y: 13.6, z: 0 }, 0.6, C.wood);
  b.beam({ x: 0, y: 9, z: 0 }, { x: -1.6, y: 8.2, z: 0 }, 0.6, C.wood);
  b.box({ x: 2.8, y: SINK, z: 2.5, yaw: 0.9 }, [4, 0.5 - SINK, 0.6], C.woodShade, C.wood);
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

/** Le Donjon : la tour carrée, son haut cassé en dents, une brèche, des blocs au pied. */
function donjon(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [8, 12 - SINK, 8], C.stone, C.sun);
  for (const [x, z, h] of [[-3, -3, 3], [3, -3, 1.6], [-3, 3, 2.2], [3, 3, 3]] as const) b.box({ x, y: 12, z }, [2, h, 2], C.stone, C.sun);
  b.box({ x: 0, y: SINK, z: 4.05 }, [2.2, 4 - SINK, 0.2], C.shade);
  b.box({ x: -4.05, y: 6, z: 0 }, [0.2, 2.5, 2], C.shade);
  rubble(b, 5.5, 3.5, 1.8, C.shade, C.moss);
}

/** Les Terrasses : trois gradins de murets de pierre ocre, le haut écroulé d'un côté. */
function terrasses(b: FacetBuilder): void {
  for (let k = 0; k < 3; k++) {
    const w = 11 - k * 3;
    const d = 9 - k * 2.6;
    const top = (k + 1) * 1.3;
    b.box({ x: 0, y: SINK, z: -k * 0.8 }, [w, top - SINK, d], C.ochre, C.moss);
  }
  rubble(b, 4.5, 3.8, 1.4, C.ochre, C.moss);
}

/** Les Fumerolles : trois bouches de pierre en cône, ouvertes, et la margelle cassée qui les entourait. */
function fumerolles(b: FacetBuilder): void {
  for (const [x, z, r, h] of [[0, 0, 3, 3.5], [-4, 2.5, 2.2, 2.4], [3.6, 3, 1.8, 1.8]] as const) {
    b.prism({ x, y: SINK, z }, r, r * 0.45, h - SINK, 6, C.ochre, C.shade);
  }
  brokenWall(b, -1, -4.5, 7, 1.4, 0.15, C.stone, C.sun);
}

/** L'Étuve : un tambour de pierre bas, sa coupole à pans à demi effondrée, la porte en arc. */
function etuve(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK, z: 0, yaw: 0.2 }, 5, 5, 4 - SINK, 8, C.stone, C.sun);
  b.prism({ x: -0.6, y: 4, z: -0.4, yaw: 0.2 }, 4.6, 1.6, 3, 8, C.shade, C.sun);
  b.box({ x: 0, y: SINK, z: 4.85 }, [2, 3 - SINK, 0.4], C.woodShade);
  rubble(b, 4.5, -2.5, 1.6, C.shade, C.moss);
}

/** Les Nacelles : un portique de bois au bord du plateau, sa poutre cassée, une nacelle tombée. */
function nacelles(b: FacetBuilder): void {
  b.box({ x: -4, y: SINK, z: 0 }, [1.2, 10 - SINK, 1.2], C.woodShade, C.wood);
  b.box({ x: 4, y: SINK, z: 0 }, [1.2, 7 - SINK, 1.2], C.woodShade, C.wood);
  b.beam({ x: -4, y: 9.6, z: 0 }, { x: 1.5, y: 9.2, z: 0 }, 0.8, C.wood);
  b.beam({ x: 1.5, y: 9.2, z: 0 }, { x: 1.5, y: 6.5, z: 0 }, 0.15, C.woodShade);
  b.box({ x: 2.5, y: SINK, z: 3, yaw: 0.5, pitch: 0.3 }, [2.6, 1.8 - SINK, 2], C.woodShade, C.bronze);
  b.box({ x: 0, y: SINK, z: 0 }, [10, 0.4 - SINK, 3], C.shade, C.stone);
}

/** Une maison en ruine : ses murs, un pignon debout, son toit à moitié. */
function house(b: FacetBuilder, x: number, z: number, sx: number, sz: number, h: number, yaw: number, whole: boolean): void {
  b.box({ x, y: SINK, z, yaw }, [sx, h - SINK, sz], C.wall, C.shade);
  if (whole) b.gableRoof({ x, y: h, z, yaw }, sx * 0.55, sz + 0.4, sz * 0.45, C.slate, C.wall);
}

/** Le Hameau : trois maisons basses, une seule a gardé un bout de toit. */
function hameau(b: FacetBuilder): void {
  house(b, -3.5, 0, 5, 4, 3, 0.2, true);
  house(b, 3.5, -2, 4, 3.5, 2.4, -0.4, false);
  house(b, 1.5, 4, 3.5, 3, 1.6, 0.8, false);
}

/** L'Auberge : une grande maison à étage, son toit crevé d'un côté, l'enseigne tombée. */
function auberge(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [9, 6 - SINK, 6], C.wall, C.shade);
  b.gableRoof({ x: -2.2, y: 6, z: 0 }, 4.6, 6.6, 3, C.slate, C.wall);
  b.box({ x: 2.6, y: 6, z: 0 }, [3.6, 1.6, 6], C.wall, C.shade);
  b.box({ x: 0, y: SINK, z: 3.05 }, [1.8, 2.8 - SINK, 0.2], C.woodShade);
  b.box({ x: 5.4, y: SINK, z: 3.5, yaw: 0.4 }, [2.4, 0.4 - SINK, 1.2], C.woodShade, C.wood);
}

/** L'Oracle : un cercle de colonnes sur une estrade, trois debout, deux brisées, un fronton tombé. */
function oracle(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK, z: 0, yaw: 0.1 }, 6, 6, 1 - SINK, 10, C.shade, C.stone);
  const n = 6;
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n + 0.3;
    const h = [7, 2.2, 7, 3.4, 7, 1.2][k];
    b.prism({ x: 4.6 * Math.cos(a), y: 1, z: 4.6 * Math.sin(a) }, 0.75, 0.65, h, 6, C.stone, C.sun);
  }
  b.box({ x: 4, y: SINK, z: -4.5, yaw: 0.7 }, [4.5, 0.9 - SINK, 1.4], C.stone, C.moss);
}

/** La ruine de chaque lieu du 5e, dessinée dans son repère. */
export const RUINS_5E: Readonly<Record<PlaceId5e, (b: FacetBuilder) => void>> = {
  montee,
  radeaux,
  croisee,
  instants,
  semaphore,
  gaillard,
  donjon,
  terrasses,
  fumerolles,
  etuve,
  nacelles,
  hameau,
  auberge,
  oracle,
};
