// Le Fanal (le Cirque du 3e, GD-25, dernier lot ; proposition du consultant d'Archipéo, § 7, relecture des lieux du
// directeur artistique et relecture des Prairies, (b)) : « la tour de pierre claire qui portait la lumière vers les
// autres archipels », au fond du creux du Cirque, sous le pic. Sur le gabarit des Ondes (./ondes3e.ts), avec le kit du
// 3e (./place3eKit.ts). Un socle de granit en deux gradins, percé de ses salles (une porte ouverte, deux fenêtres) ;
// dessus, la tour de pierre claire ceinte de ses deux seules bandes d'ardoise (`FANAL_TOWER_3E`) ; au sommet, la galerie
// à garde-corps de pierre, la lanterne dans sa cage de fer bruni, le toit d'ardoise en pointe, un peu de neige au faîte.
// Le contrepoids pend à sa chaîne sur la pierre claire de la tour ; la manivelle se tient sur le second gradin, à droite
// de la tour, hors de sa silhouette (relecture des Prairies, (b) 3).
//
// Le lieu se dessine dans le repère du monde (x vers l'est, z vers le sud) : sa porte est au sud, au bout du chemin du
// Cirque, et la vue d'arrivée regarde le nord, la tour entière (`arrivalView`, comme le Donjon du 5e) ; au-delà, l'herbe
// grise du creux puis la mer de nuages jusqu'au ciel (relecture des Prairies, (b) 9). Le pic est dans le dos de Kéo.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : le socle fendu, deux blocs tombés à son
// pied, son escalier réduit à deux marches ; la tour ouverte d'une brèche sur sa face sud, entre ses deux bandes, l'herbe
// sèche dans la brèche et ses pierres sur le gradin ; trois pans du garde-corps de la galerie manquent, l'un tombé sur
// le premier gradin, penché, son chaperon d'ardoise vers la porte (relecture des Prairies, (b) 2) ; la lanterne éteinte,
// trois vitres manquent ; le contrepoids couché au pied de la tour, la manivelle le bras pendant. Une seule lumière, la
// lanterne de l'opticienne, à la porte du socle. Cinq parties (3 + 1 + 1) : le corps (le socle, la tour, la galerie) ; le
// haut (la lanterne allumée, le contrepoids, la manivelle) ; les abords (le seuil dallé, le banc, la lanterne du chemin).
// L'or blanc de la lumière n'est qu'à la lanterne, et seulement quand le haut est posé. Une trace par mission, avec sa
// partie. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, dryTuft3e, habitant3e, postLantern3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, once, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres au Fanal, en plus des matières des Passeurs (`C3E`) : l'or blanc de la lumière, à la seule
 * lanterne ; la vitre éteinte, un gris-bleu mat ; le creux d'une porte, d'une fenêtre ou de la brèche, un brun d'ombre
 * (jamais presque noir) ; le velours de la banquette des verres ; la veste de l'opticienne.
 */
const C = {
  light: 0xffe6a6,
  glass: 0xa9bccc,
  hollow: 0x5c5650,
  velvet: 0x7c6a80,
  coat: 0x7a7f6a,
  blanket: 0x9a8a9e,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('fanal');

/** Le plan du sol sous le socle et ses abords : le fond du creux, à peine penché vers le nord. */
const planeY = groundPlane4e(SITE.ground, [-8, 8], [-7, 8]);

/** Les deux gradins du socle : leurs bords (x, puis z du dos à la façade) et la hauteur de leur dessus. */
const SOCLE = {
  low: { x: 6.5, z0: -5.5, z1: 4.5, top: 2.2 },
  high: { x: 4.25, z0: -4.25, z1: 2.25, top: 4.6 },
  /** La porte ouverte des salles, sur la façade du premier gradin, et la lanterne de l'opticienne à côté. */
  door: { x: -3.6, w: 1.1, h: 1.8 },
  lamp: { x: -2.5, z: 5.0, h: 1.4 },
  /** La porte du second gradin, sous la tour, et ses deux fenêtres. */
  upperDoor: { w: 0.9, h: 1.6 },
  windows: [-2.8, 2.8] as const,
  /** L'escalier du premier gradin, contre sa façade : son milieu, sa largeur, ses marches. */
  stairs: { x: 3.2, w: 1.4, steps: 4, tread: 0.45 },
} as const;

/**
 * La tour du Fanal (relecture des lieux, correction 10, et relecture du Versant, (a) 2) : de pierre claire, du haut du
 * socle (`y0`, rayon `r0`) au pied de la lanterne (`y1`, rayon `r1`), ceinte de deux larges bandes d'ardoise (`bands`,
 * leur bas et leur haut), jamais une troisième : elle se lit par sa forme autant que par sa valeur, de partout, même
 * dans le thème Contraste élevé ; jamais de rayures rouges et blanches, jamais de cobalt. Son axe est en (0, `z`).
 */
export const FANAL_TOWER_3E = { y0: 4.6, y1: 17.0, r0: 2.6, r1: 2.0, z: -1, bands: [[8.0, 10.2], [12.6, 14.8]] as const } as const;

/** Les huit pans de la tour, une face plein sud : le lacet de ses prismes. */
const TOWER_YAW = -Math.PI / 8;
/** Le rayon de la tour à la hauteur `y`. */
const towerR = (y: number): number => {
  const T = FANAL_TOWER_3E;
  return T.r0 + ((T.r1 - T.r0) * (y - T.y0)) / (T.y1 - T.y0);
};
/** La distance de l'axe au milieu d'une face, à la hauteur `y`. */
const apothem = (y: number): number => towerR(y) * Math.cos(Math.PI / 8);

/** Le milieu de la face de cap `deg` (0 : la face est, 90 : la face sud) de la tour, à `y`, avancé de `out`. */
function onFace(deg: number, y: number, out = 0): Vec3 {
  const a = (deg * Math.PI) / 180;
  const d = apothem(y) + out;
  return { x: d * Math.cos(a), y, z: FANAL_TOWER_3E.z + d * Math.sin(a) };
}

/** La galerie du sommet : son plancher (rayon, épaisseur), son garde-corps (hauteur, épaisseur), la lanterne et son toit. */
const GALLERY = {
  r: 2.5,
  deck: 0.3,
  rail: 0.6,
  thick: 0.2,
  /** Les pans du garde-corps qui manquent dans la ruine : les trois tournés vers la porte (sud-est, sud, sud-ouest). */
  missing: [1, 2, 3] as const,
  /** La lanterne, levée de `lift` sur son assise de pierre au-dessus du garde-corps : vue d'en bas, elle reste entière. */
  lantern: { r: 1.75, h: 2.0, lift: 0.45 },
  roof: { r: 2.05, h: 1.3, snow: 0.45 },
} as const;

/** La brèche de la ruine, sur la face sud de la tour, entre ses deux bandes : ses bords, de part et d'autre du milieu de la face. */
const BREACH = { x0: -0.72, x1: 0.78, y0: 10.35, y1: 12.45 } as const;

/** Le contrepoids, sur la face sud-ouest de la tour : sa chaîne, du dessous de la galerie, et son poids, entre les bandes. */
const WEIGHT = { face: 135, top: 17.2, y: 10.7, h: 0.8, w: 0.5 } as const;

/** La manivelle, sur le second gradin, à droite de la tour (vue de la porte), hors de sa silhouette. */
const CRANK = { x: 3.15, z: 1.2, r: 0.42, y: 1.05 } as const;

/** Le seuil dallé, de la façade du socle vers la porte du lieu ; le banc ; la lanterne du chemin. */
const ALLEY = { x: 0, half: 0.8, from: 4.7, to: 7.9 } as const;
const BENCH = { x: 6.4, z: 7.0 } as const;
const PATH_LANTERN = { x: 1.6, z: 7.4, h: 1.4 } as const;

/** L'herbe sèche de la ruine : au pied du socle, et dans la brèche de la tour. */
const DRY = [
  { x: 5.6, z: 5.2, s: 1 },
  { x: -6.2, z: 5.0, s: 0.9 },
  { x: 1.4, z: 5.4, s: 0.8 },
] as const;

// ---------- La vue ----------

/** Le cap d'arrivée : le nord, de la porte au sud ; la tour entière, la mer de nuages au-delà. */
const DOOR_VIEW = capOf(0);

/** La vue d'arrivée : le regard levé jusqu'au haut bâti, au-dessus de l'axe de la tour, la caméra un peu reculée. */
const ARRIVAL = { look: { x: 0, z: FANAL_TOWER_3E.z }, back: 1.6 } as const;

// ---------- Les volumes ----------

/** Le pied du socle : le plus bas du sol sous ses coins. */
const base = once(() => Math.min(...[-SOCLE.low.x, SOCLE.low.x].flatMap((x) => [SOCLE.low.z0, SOCLE.low.z1].map((z) => planeY(x, z)))) - 0.05);

/** La hauteur d'un point du socle, au-dessus de son pied. */
const at = (y: number): number => base() + y;

/** Le point du nom sur la Carte, au-dessus du toit de la lanterne, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return at(FANAL_TOWER_3E.y1 + GALLERY.lantern.h + GALLERY.roof.h + 1.6);
  },
  z: FANAL_TOWER_3E.z,
};

/** Les deux gradins de granit, la porte ouverte des salles, la porte du second gradin et ses fenêtres. */
function socle(b: FacetBuilder): void {
  const { low, high, door, upperDoor } = SOCLE;
  b.box({ x: 0, y: base() + SINK_3E, z: (low.z0 + low.z1) / 2 }, [2 * low.x, low.top - SINK_3E, low.z1 - low.z0], C3E.graniteShade, C3E.granite);
  b.box({ x: 0, y: at(low.top) - 0.02, z: (high.z0 + high.z1) / 2 }, [2 * high.x, high.top - low.top + 0.02, high.z1 - high.z0], C3E.granite, C3E.graniteSun);
  // La porte ouverte des salles, son linteau de pierre claire.
  b.box({ x: door.x, y: base(), z: low.z1 + 0.02 }, [door.w, door.h, 0.06], C.hollow);
  b.box({ x: door.x, y: at(door.h), z: low.z1 + 0.03 }, [door.w + 0.3, 0.18, 0.1], C3E.stoneShade, C3E.stone);
  // La porte du second gradin, sous la tour, et ses deux fenêtres.
  b.box({ x: 0, y: at(low.top), z: high.z1 + 0.02 }, [upperDoor.w, upperDoor.h, 0.06], C.hollow);
  for (const x of SOCLE.windows) b.box({ x, y: at(low.top + 0.9), z: high.z1 + 0.02 }, [0.6, 0.8, 0.06], C.hollow);
}

/** La tour de pierre claire et ses deux bandes d'ardoise, une face plein sud. */
function tower(b: FacetBuilder): void {
  const T = FANAL_TOWER_3E;
  const cuts = [T.y0, ...T.bands.flat(), T.y1];
  for (let k = 1; k < cuts.length; k++) {
    const band = k % 2 === 0;
    b.prism({ x: 0, y: at(cuts[k - 1]), z: T.z, yaw: TOWER_YAW }, towerR(cuts[k - 1]), towerR(cuts[k]), cuts[k] - cuts[k - 1], 8, band ? C3E.slate : C3E.stone, band ? C3E.slateTop : C3E.stone);
  }
}

/** Le plancher de la galerie, en encorbellement sur le haut de la tour. */
function galleryDeck(b: FacetBuilder): void {
  const T = FANAL_TOWER_3E;
  b.prism({ x: 0, y: at(T.y1 - GALLERY.deck - 0.35), z: T.z, yaw: TOWER_YAW }, T.r1 + 0.05, GALLERY.r, 0.35, 8, C3E.stoneShade, C3E.stoneShade);
  b.prism({ x: 0, y: at(T.y1 - GALLERY.deck), z: T.z, yaw: TOWER_YAW }, GALLERY.r, GALLERY.r, GALLERY.deck, 8, C3E.stoneShade, C3E.stone);
}

/** Un pan du garde-corps de la galerie (de 0, la face est, à 7, en tournant par le sud), posé dans le repère `l` à plat. */
function railPiece(l: FacetBuilder): void {
  const len = 2 * GALLERY.r * Math.sin(Math.PI / 8) + 0.04;
  l.box({ x: 0, y: 0, z: 0 }, [len, GALLERY.rail, GALLERY.thick], C3E.stoneShade, C3E.stone);
  l.box({ x: 0, y: GALLERY.rail, z: 0 }, [len + 0.1, 0.12, GALLERY.thick + 0.14], C3E.slate, C3E.slateTop);
}

/** Les pans du garde-corps de numéros `which`, debout au bord de la galerie. */
function rails(b: FacetBuilder, which: readonly number[]): void {
  const T = FANAL_TOWER_3E;
  const d = (GALLERY.r - GALLERY.thick / 2) * Math.cos(Math.PI / 8);
  for (const k of which) {
    const a = (k * Math.PI) / 4;
    drawPosed(b, { x: d * Math.cos(a), y: at(T.y1), z: T.z + d * Math.sin(a), yaw: -a - Math.PI / 2 }, railPiece);
  }
}

/** Le pan du garde-corps tombé (la ruine), couché de biais sur le premier gradin, son chaperon d'ardoise vers la porte. */
function railFallen(b: FacetBuilder): void {
  drawPosed(b, { x: -2.3, y: at(SOCLE.low.top) + 0.12, z: 3.35, yaw: 0.35, pitch: -1.05 }, railPiece);
  b.box({ x: -0.9, y: at(SOCLE.low.top) - 0.05, z: 3.6, yaw: 0.8 }, [0.45, 0.3, 0.35], C3E.stoneShade, C3E.stone);
}

/** La cage de la lanterne : ses huit montants de fer bruni, sur le plancher de la galerie, et son toit d'ardoise sous la neige. */
function lanternCage(b: FacetBuilder): void {
  const T = FANAL_TOWER_3E;
  const L = GALLERY.lantern;
  const z = T.z;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 8;
    const p = { x: (L.r + 0.03) * Math.cos(a), z: z + (L.r + 0.03) * Math.sin(a) };
    b.beam({ x: p.x, y: at(glassY()), z: p.z }, { x: p.x, y: at(glassY() + L.h), z: p.z }, 0.11, C3E.iron);
  }
  // L'assise de pierre de la lanterne, puis son seuil de fer bruni.
  b.prism({ x: 0, y: at(T.y1 - 0.02), z, yaw: TOWER_YAW }, L.r + 0.1, L.r + 0.1, L.lift - 0.15, 8, C3E.stoneShade, C3E.stone);
  b.prism({ x: 0, y: at(glassY() - 0.17), z, yaw: TOWER_YAW }, L.r + 0.14, L.r + 0.14, 0.17, 8, C3E.iron, C3E.ironTop);
  const R = GALLERY.roof;
  const y = at(glassY() + L.h);
  b.prism({ x: 0, y, z, yaw: TOWER_YAW }, R.r, 0.35, R.h, 8, C3E.slate, C3E.slateTop);
  const s = 1 - R.snow;
  b.prism({ x: 0, y: y + R.h * s, z, yaw: TOWER_YAW }, R.r * R.snow + 0.35 * s + 0.03, 0.12, R.h * R.snow + 0.02, 8, C3E.snow, C3E.snow);
  b.prism({ x: 0, y: y + R.h, z }, 0.12, 0, 0.4, 4, C3E.iron);
}

/** Le pied de la vitre de la lanterne, au-dessus du socle. */
const glassY = (): number => FANAL_TOWER_3E.y1 + GALLERY.lantern.lift;

/** Les vitres de la lanterne, une par pan entre deux montants, de numéros `which` : grises et mates, éteintes. */
function panes(b: FacetBuilder, which: readonly number[]): void {
  const T = FANAL_TOWER_3E;
  const L = GALLERY.lantern;
  const d = L.r * Math.cos(Math.PI / 8);
  const w = 2 * L.r * Math.sin(Math.PI / 8);
  for (const k of which) {
    const a = (k * Math.PI) / 4;
    b.box({ x: d * Math.cos(a), y: at(glassY()), z: T.z + d * Math.sin(a), yaw: -a - Math.PI / 2 }, [w - 0.06, L.h - 0.04, 0.06], C.glass);
  }
}

/** Les verres éteints, au cœur de la lanterne (la ruine) : trois tambours empilés, d'un gris pâle. */
function lensOff(b: FacetBuilder): void {
  const T = FANAL_TOWER_3E;
  const y = at(glassY() + 0.1);
  b.prism({ x: 0, y, z: T.z }, 0.55, 0.85, 0.6, 8, C3E.lanternOff);
  b.prism({ x: 0, y: y + 0.6, z: T.z }, 0.85, 0.85, 0.5, 8, C3E.lanternOff);
  b.prism({ x: 0, y: y + 1.1, z: T.z }, 0.85, 0.5, 0.55, 8, C3E.lanternOff);
}

/** La lanterne allumée (le haut) : sa vitre entière, de l'or blanc de la lumière, entre ses montants. */
function lit(b: FacetBuilder): void {
  const T = FANAL_TOWER_3E;
  const L = GALLERY.lantern;
  b.prism({ x: 0, y: at(glassY()), z: T.z, yaw: TOWER_YAW }, L.r - 0.04, L.r - 0.04, L.h - 0.02, 8, C.light, C.light);
}

/** La brèche de la tour (la ruine) : un creux d'ombre irrégulier sur sa face sud, ses pierres en saillie, l'herbe sèche au fond. */
function breach(b: FacetBuilder): void {
  const B = BREACH;
  const yMid = (B.y0 + B.y1) / 2;
  const f = onFace(90, yMid, 0.05);
  b.plate(
    { x: f.x, y: at(0), z: f.z },
    [
      [B.x0 + 0.1, B.y0],
      [B.x1, B.y0 + 0.25],
      [B.x1 - 0.05, B.y1 - 0.5],
      [B.x1 - 0.35, B.y1],
      [B.x0 + 0.25, B.y1 - 0.1],
      [B.x0, B.y0 + 0.7],
    ],
    C.hollow,
  );
  // Les pierres d'angle restées en saillie, au bord de la brèche.
  for (const [dx, y, s] of [
    [B.x1 - 0.05, B.y0 + 0.9, 0.34],
    [B.x0 + 0.05, B.y1 - 0.35, 0.3],
    [B.x0 + 0.35, B.y0 + 0.05, 0.28],
  ] as const)
    b.box({ x: f.x + dx, y: at(y), z: f.z + 0.05, yaw: 0.3 }, [s * 1.4, s, s], C3E.stoneShade, C3E.stone);
  dryTuft3e(b, f.x + 0.1, at(B.y0) + 0.02, f.z + 0.12, 0.6);
  // Les pierres tombées de la brèche, sur le second gradin, au pied de la tour.
  for (const [x, z, s, yaw] of [
    [0.9, 2.0 - 0.15, 0.5, 0.5],
    [-0.4, 1.95, 0.4, 1.3],
    [1.6, 1.85, 0.34, 2.2],
  ] as const)
    b.box({ x, y: at(SOCLE.high.top) - 0.05, z, yaw }, [s * 1.3, s * 0.8, s], C3E.stoneShade, C3E.stone);
}

/** La brèche refermée (la tour) : la pierre claire neuve qui la recouvre, au nu de la face. */
function breachMended(b: FacetBuilder): void {
  const B = BREACH;
  const f = onFace(90, (B.y0 + B.y1) / 2, 0.03);
  b.plate(
    { x: f.x, y: at(0), z: f.z },
    [
      [B.x0 - 0.05, B.y0 - 0.05],
      [B.x1 + 0.05, B.y0 - 0.05],
      [B.x1 + 0.05, B.y1 + 0.05],
      [B.x0 - 0.05, B.y1 + 0.05],
    ],
    C3E.stone,
  );
}

/** La fente du socle (la ruine), sur la façade du premier gradin, deux blocs tombés à son pied et les deux marches restées. */
function socleCracked(b: FacetBuilder): void {
  const z = SOCLE.low.z1 + 0.04;
  b.plate(
    { x: 0, y: base(), z },
    [
      [1.1, 0.1],
      [1.55, 0.1],
      [1.9, 0.9],
      [1.6, 1.5],
      [2.0, 2.15],
      [1.65, 2.15],
      [1.25, 1.5],
      [1.5, 0.9],
    ],
    C.hollow,
  );
  for (const [x, zz, s, yaw] of [
    [-1.7, 5.4, 0.7, 0.4],
    [1.5, 5.6, 0.55, 1.2],
  ] as const)
    b.box({ x, y: planeY(x, zz) + SINK_3E * 0.4, z: zz, yaw }, [s * 1.3, s - SINK_3E * 0.4, s], C3E.graniteShade, C3E.granite);
  stairs(b, 2);
  b.box({ x: SOCLE.stairs.x + 0.9, y: planeY(4.1, 6.2) - 0.1, z: 6.2, yaw: 0.6 }, [1.2, 0.5, 0.45], C3E.graniteShade, C3E.granite);
}

/** La fente refermée (le socle) : le granit neuf qui la couvre, au nu de la façade. */
function socleMended(b: FacetBuilder): void {
  b.plate(
    { x: 0, y: base(), z: SOCLE.low.z1 + 0.03 },
    [
      [1.0, 0.05],
      [2.15, 0.05],
      [2.15, 2.2],
      [1.0, 2.2],
    ],
    C3E.graniteShade,
  );
}

/** Les `n` premières marches de l'escalier du premier gradin, contre sa façade. */
function stairs(b: FacetBuilder, n: number): void {
  const S = SOCLE.stairs;
  const z1 = SOCLE.low.z1;
  const rise = SOCLE.low.top / S.steps;
  for (let k = 0; k < n; k++) {
    const d = (S.steps - k) * S.tread;
    const g = planeY(S.x, z1 + d);
    b.box({ x: S.x, y: g + SINK_3E, z: z1 + d / 2 }, [S.w, base() + rise * (k + 1) - g - SINK_3E, d], C3E.graniteShade, C3E.granite);
  }
}

/** Le contrepoids sur sa chaîne, sur la pierre claire de la face sud-ouest de la tour : `hung` faux, la chaîne courte, le poids couché au pied. */
function weight(b: FacetBuilder, hung: boolean): void {
  const W = WEIGHT;
  const top = onFace(W.face, W.top, 0.25);
  const yaw = -((W.face + 90) * Math.PI) / 180;
  b.box({ ...onFace(W.face, W.top, 0.05), y: at(W.top), yaw }, [0.5, 0.14, 0.4], C3E.iron, C3E.ironTop);
  if (hung) {
    const p = onFace(W.face, W.y, 0.25);
    b.beam({ x: top.x, y: at(W.top), z: top.z }, { x: p.x, y: at(W.y + W.h), z: p.z }, 0.07, C3E.iron);
    b.box({ x: p.x, y: at(W.y), z: p.z, yaw }, [W.w, W.h, 0.34], C3E.iron, C3E.ironTop);
  } else {
    b.beam({ x: top.x, y: at(W.top), z: top.z }, { x: top.x, y: at(W.top - 2.6), z: top.z }, 0.07, C3E.iron);
    b.box({ x: -2.9, y: at(SOCLE.high.top) - 0.04, z: 1.1, yaw: 0.5, pitch: Math.PI / 2 }, [W.w, W.h, 0.34], C3E.iron, C3E.ironTop);
  }
}

/**
 * La manivelle du treuil, vue de flanc depuis la porte (relecture des Prairies, (b) 3) : ses deux montants de fer bruni, son
 * tambour couché, en travers, sa corde enroulée ; au bout, à droite, le bras et sa poignée, levés, ou pendant (la ruine).
 */
function crank(b: FacetBuilder, up: boolean): void {
  const K = CRANK;
  const y = at(SOCLE.high.top);
  for (const dx of [-0.65, 0.65]) b.box({ x: K.x + dx, y: y - 0.02, z: K.z }, [0.14, K.y + 0.25, 0.36], C3E.iron, C3E.ironTop);
  b.drum({ x: K.x - 0.6, y: y + K.y, z: K.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, K.r, 1.2, 8, C3E.canvasShade, C3E.iron);
  const hub = { x: K.x + 0.74, y: y + K.y, z: K.z };
  const end = up ? { x: hub.x + 0.05, y: hub.y + 0.65, z: hub.z + 0.25 } : { x: hub.x + 0.05, y: hub.y - 0.75, z: hub.z + 0.05 };
  b.beam(hub, end, 0.09, C3E.iron);
  b.beam(end, { ...end, x: end.x + 0.3 }, 0.08, C3E.woodShade);
}

/** Le seuil dallé, de la façade du socle vers la porte du lieu. */
function alley(b: FacetBuilder): void {
  const n = 3;
  const step = (ALLEY.to - ALLEY.from) / n;
  for (let k = 0; k < n; k++) {
    const z = ALLEY.from + (k + 0.5) * step;
    b.box({ x: ALLEY.x, y: planeY(ALLEY.x, z) - 0.06, z }, [2 * ALLEY.half, 0.1, step - 0.08], C3E.joint, k % 2 ? C3E.stone : C3E.stoneShade);
  }
}

/** Le banc de pierre, à planche de bois. */
function bench(b: FacetBuilder): void {
  const { x, z } = BENCH;
  const y = planeY(x, z);
  for (const s of [-1, 1]) b.box({ x: x + s * 0.55, y: y - 0.1, z }, [0.26, 0.55, 0.38], C3E.graniteShade, C3E.granite);
  b.box({ x, y: y + 0.42, z }, [1.5, 0.1, 0.44], C3E.woodShade, C3E.wood);
}

function model(add: AddPiece): void {
  const socleRow = { stage: 0 as Stage, row: 0 };
  const towerRow = { stage: 0 as Stage, row: 1 / 3 };
  const galleryRow = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle et ses salles, la tour et ses deux bandes, le plancher de la galerie et ses pans du dos, la cage
  // de la lanterne sous son toit enneigé, les montants de la manivelle ; la lanterne de l'opticienne, la seule allumée de
  // la ruine.
  add('ruine', 0, (b) => {
    socle(b);
    tower(b);
    galleryDeck(b);
    rails(
      b,
      [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => !GALLERY.missing.includes(k as 1)),
    );
    lanternCage(b);
    const L = SOCLE.lamp;
    postLantern3e(b, L.x, planeY(L.x, L.z), L.z, L.h, true);
  });
  // Le socle (corps 1) referme la fente, ôte les blocs tombés, relève l'escalier.
  add('ruine', 0, socleCracked, socleRow);
  // La tour (corps 2) referme la brèche.
  add('ruine', 0, breach, towerRow);
  // La galerie (corps 3) relève le pan tombé.
  add('ruine', 0, railFallen, galleryRow);
  // Le haut rallume la lanterne : ses vitres éteintes et ses verres gris partent, le contrepoids remonte, la manivelle se relève.
  add(
    'ruine',
    0,
    (b) => {
      panes(
        b,
        [0, 1, 2, 3, 4, 5, 6, 7].filter((k) => !GALLERY.missing.includes(k as 1)),
      );
      lensOff(b);
      weight(b, false);
      crank(b, false);
    },
    haut,
  );
  // Les abords effacent l'herbe sèche.
  add('ruine', 0, (b) => DRY.forEach((d) => dryTuft3e(b, d.x, planeY(d.x, d.z), d.z, d.s)), abords);

  // ---- Le socle : la fente refermée, l'escalier entier.
  add(0, 0, (b) => {
    socleMended(b);
    stairs(b, SOCLE.stairs.steps);
  });
  // ---- La tour : la brèche refermée de pierre neuve.
  add(0, 1 / 3, breachMended);
  // ---- La galerie : ses trois pans relevés.
  add(0, 2 / 3, (b) => rails(b, GALLERY.missing));
  // ---- Le haut : la lanterne allumée, d'or blanc ; le contrepoids sur sa chaîne ; la manivelle, son bras levé.
  add(1, 0, (b) => {
    lit(b);
    weight(b, true);
    crank(b, true);
  });
  // ---- Les abords : le seuil dallé, le banc, la lanterne du chemin.
  add(2, 0, (b) => {
    alley(b);
    bench(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, loin du chemin et de la scène, toutes du côté de la porte. */
const TRACE_SPOTS = {
  crate: { x: 5.5, z: 5.4 },
  ladders: { x: 0.9, z: 4.5 },
  bucket: { x: SOCLE.stairs.x, z: SOCLE.low.z1 + SOCLE.stairs.tread * 3.5 },
  case: { x: 4.6, z: 3.3 },
  bench: { x: BENCH.x, z: BENCH.z },
} as const;

/** Dessine une trace dans le repère du lieu, posée au centre du lieu. */
const traceIn = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw: 0 }, draw);

/** Une caisse cerclée de fer, de la paille qui dépasse, au pied du socle (Images). */
function strawCrate(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.crate;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z, yaw: 0.3 }, [0.8, 0.6, 0.6], C3E.woodShade, C3E.newWood);
    for (const dy of [0.12, 0.42]) l.box({ x, y: y + dy, z, yaw: 0.3 }, [0.84, 0.06, 0.64], C3E.iron);
    for (const [dx, dz] of [
      [-0.15, 0],
      [0.18, 0.08],
    ] as const)
      l.prism({ x: x + dx, y: y + 0.52, z: z + dz, yaw: dx }, 0.2, 0, 0.32, 4, C3E.dry);
  });
}

/** Deux échelles de bois côte à côte, appuyées à la façade du premier gradin (Droites). */
function twoLadders(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.ladders;
    for (const dx of [-0.45, 0.45])
      drawPosed(l, { x: x + dx, y: planeY(x + dx, z + 0.7) - 0.05, z: z + 0.7, yaw: 0, pitch: -0.28 }, (k) => {
        for (const s of [-1, 1]) k.box({ x: s * 0.2, y: 0, z: 0 }, [0.07, 2.5, 0.07], C3E.wood);
        for (let r = 0; r < 5; r++) k.box({ x: 0, y: 0.3 + r * 0.48, z: 0 }, [0.4, 0.05, 0.05], C3E.newWood);
      });
  });
}

/** Un seau de fer et une raclette, posés sur une marche de l'escalier (Faisceaux). */
function bucketOnStep(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bucket;
    const y = base() + SOCLE.low.top / SOCLE.stairs.steps;
    l.prism({ x: x - 0.35, y, z }, 0.17, 0.21, 0.32, 8, C3E.iron, C3E.ironTop);
    l.beam({ x: x + 0.2, y: y + 0.02, z: z - 0.05 }, { x: x + 0.45, y: y + 0.95, z: z - 0.15 }, 0.05, C3E.wood);
    l.box({ x: x + 0.2, y, z: z - 0.05 }, [0.4, 0.08, 0.1], C3E.woodShade);
  });
}

/** Un étui de cuir à lentilles, ouvert sur un établi bas, sur le premier gradin (Proportions). */
function lensCase(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.case;
    const y = at(SOCLE.low.top);
    l.box({ x, y: y + 0.5, z }, [1.3, 0.08, 0.6], C3E.woodShade, C3E.newWood);
    for (const s of [-1, 1]) l.box({ x: x + s * 0.55, y: y - 0.02, z }, [0.1, 0.52, 0.5], C3E.woodShade);
    l.box({ x: x - 0.15, y: y + 0.58, z }, [0.6, 0.12, 0.36], C3E.leather);
    for (const dx of [-0.32, -0.15, 0.02]) l.drum({ x: x + dx, y: y + 0.7, z }, 0.07, 0.03, 6, C.glass, C.glass);
  });
}

/** Une couverture pliée, posée sur le banc (Se repérer). */
function blanketOnBench(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bench;
    const y = planeY(x, z) + 0.52;
    l.box({ x: x - 0.25, y, z }, [0.6, 0.12, 0.38], C.blanket);
    l.box({ x: x - 0.25, y: y + 0.12, z }, [0.6, 0.07, 0.38], C3E.canvas);
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie : le corps (3), le haut, les abords. */
const TRACES = {
  images: { at: TRACE_SPOTS.crate, lift: 1.1, stage: 0, row: 0, draw: strawCrate },
  linear: { at: TRACE_SPOTS.ladders, lift: 2.8, stage: 0, row: 1 / 3, draw: twoLadders },
  graphs: { at: TRACE_SPOTS.bucket, lift: 1.6, stage: 0, row: 2 / 3, draw: bucketOnStep },
  proportions: { at: TRACE_SPOTS.case, lift: 3.2, stage: 1, row: 0, draw: lensCase },
  coordinates: { at: TRACE_SPOTS.bench, lift: 1, stage: 2, row: 0, draw: blanketOnBench },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la scénette : au nord, un peu vers l'est, à l'horizontale ; le socle et le pied de la tour à droite, la
 * mer de nuages au fond, jamais le pic (dans le dos).
 */
const SCENE_START = capOf(10);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'opticienne). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : sur l'herbe devant la porte des salles, à l'ouest de la porte du lieu. */
const SCENE_SPOT = { dx: -4.6, dz: 7.0, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de l'opticienne au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe grise du creux. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La banquette des verres : sa hauteur à l'échelle 1 ; un verre choisi se soulève d'un cran. */
const PRISMS = { height: 0.5, lift: 0.3, glass: 0.32 } as const;

/** Un verre taillé, un prisme à trois pans, tous pareils, debout sur la banquette. */
function prismGlass(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z, yaw: Math.PI / 6 }, 0.16 * s, 0.16 * s, PRISMS.glass * s, 3, C.glass, C3E.stone);
}

export const FANAL: PlaceArt = {
  role: 'L’opticienne',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: {
      dx: -SCENE_RIGHT.x * SCENE_HALF,
      dz: -SCENE_RIGHT.z * SCENE_HALF,
      scale: 0.6,
      yaw: Math.PI - 0.4 + SCENE_START,
    },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (4 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x7a6450);
  },
  answer: {
    size: { height: PRISMS.height + PRISMS.lift + PRISMS.glass, half: 0.3 },
    facing: true,
    // Une banquette basse de bois, au dessus de velours.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PRISMS.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.46 * s], C3E.woodShade, C.velvet);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.12, top - 0.1 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Un verre, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      prismGlass(b, { x: at.x, y: at.y + (PRISMS.height + (picked ? PRISMS.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x + 0.6, z: SITE.door.z + 0.4 },
  doorView: DOOR_VIEW,
  arrivalView: ARRIVAL,
  mapPoint: MAP_POINT,
};

/** Le plan du Fanal, pour les tests. */
export const FANAL_LAYOUT = {
  socle: SOCLE,
  tower: FANAL_TOWER_3E,
  gallery: GALLERY,
  breach: BREACH,
  weight: WEIGHT,
  crank: CRANK,
  towerR,
  onFace,
  base,
  planeY,
  door: SITE.door,
  arrival: ARRIVAL,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
