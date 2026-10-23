// La Rampe (le Cirque du 3e, GD-25 ; proposition du consultant d'Archipéo, § 8, relecture des lieux du directeur
// artistique et relecture des Prairies, (b) 3) : « le plan incliné de pierre par où l'on hissait les blocs du Fanal ».
// Sur le gabarit des Ondes (./ondes3e.ts), avec le kit du 3e (./place3eKit.ts). Un long plan incliné de granit, son
// dallage de pierre claire et ses rouleaux de bois, entre deux murets à chaperon d'ardoise, qui monte de l'herbe du creux
// jusqu'au premier gradin du socle du Fanal, à l'ouest ; en haut, le portique de bois et sa poulie, le contrepoids pendu à
// sa chaîne, et le cabestan, sur l'herbe à côté ; à mi-pente, le traîneau chargé d'un bloc, sur ses rouleaux ; au pied, un
// sentier de dalles à hauteur de l'herbe longe la rampe.
//
// Tout se dessine dans le repère de la rampe (`x` le long de la pente, du pied vers le haut ; `z` vers le nord ; posé
// sur l'herbe à son pied, `FOOT`), tourné d'un bloc. La porte du lieu est au sud-est du pied : de là, la rampe se voit de
// trois quarts (relecture des Prairies, (b) 3), son pied à droite, son haut à gauche contre le socle du Fanal, et le Fanal
// entier au-delà (`arrivalView`, son haut cadré, comme l'Oracle du 5e cadre le Donjon).
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : le dallage fendu, les rouleaux épars dans
// l'herbe ; le muret du côté de la porte ouvert en son milieu, ses pierres tombées dans l'herbe, un chaperon d'ardoise
// penché (relecture des Prairies, (b) 2) ; un montant du portique et sa traverse couchés sur la rampe, le contrepoids au
// sol, les barres du cabestan dans l'herbe ; le traîneau renversé au pied, ses patins en l'air ; l'herbe sèche. Une seule
// lumière, la lanterne de la charretière, au pied. Trois parties (1 + 1 + 1) : la rampe (le dallage refermé, le muret
// relevé, les rouleaux) ; le haut (le portique, sa poulie et son contrepoids, les barres du cabestan) ; les abords (le
// sentier, le traîneau chargé, le banc, la lanterne du sentier). Une trace par mission, avec sa partie. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import { FANAL_LAYOUT } from './fanal3e';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, dryTuft3e, habitant3e, postLantern3e, site3e } from './place3eKit';
import { capOf, once, sceneRight, sceneRise, sheet, type P3 } from './place4eKit';
import { PLACES_3E } from './plan3e';

/** Les couleurs propres à la Rampe : le creux d'une fente, un brun d'ombre (jamais presque noir) ; la corde ; la veste de la charretière. */
const C = {
  hollow: 0x5c5650,
  rope: 0xb8a582,
  coat: 0x7c6f5a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('rampe');
const FANAL_SITE = site3e('fanal');

/** Le centre du Fanal, depuis le centre de la Rampe. */
const FANAL_AT: Vec2 = (() => {
  const f = PLACES_3E.find((p) => p.id === 'fanal')!.center;
  return { x: f.x - SITE.center.x, z: f.z - SITE.center.z };
})();

/** Le haut de la rampe : contre la façade est du premier gradin du Fanal, au nord de son milieu (le râtelier des Ferrailleurs est au sud). */
const TOP: Vec2 = { x: FANAL_AT.x + FANAL_LAYOUT.socle.low.x, z: FANAL_AT.z - 3.3 };

/** La longueur de la rampe, et le sens de sa pente (du pied vers le haut), un peu vers le nord-ouest. */
const LENGTH = 14.5;
const ALONG: Vec2 = (() => {
  const a = { x: -0.96, z: -0.28 };
  const n = Math.hypot(a.x, a.z);
  return { x: a.x / n, z: a.z / n };
})();

/** Le pied de la rampe, sur l'herbe. */
const FOOT: Vec2 = { x: TOP.x - ALONG.x * LENGTH, z: TOP.z - ALONG.z * LENGTH };

/** Le lacet du repère de la rampe (`drawPosed`) : son `x` le long de la pente, son `z` vers le nord. */
const YAW = Math.atan2(-ALONG.z, ALONG.x);

/** Un point du repère de la rampe dans le repère du lieu. */
const local = (x: number, z: number): Vec2 => ({
  x: FOOT.x + x * Math.cos(YAW) + z * Math.sin(YAW),
  z: FOOT.z - x * Math.sin(YAW) + z * Math.cos(YAW),
});

/** Le sol sous un point du repère de la rampe, depuis le sol du centre du lieu. */
const groundAt = (x: number, z: number): number => {
  const p = local(x, z);
  return SITE.ground(p.x, p.z);
};

/** Dessine dans le repère de la rampe. */
const posed = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: FOOT.x, y: 0, z: FOOT.z, yaw: YAW }, draw);

/**
 * La rampe : sa largeur entre les murets, la hauteur de son dallage au pied et en haut (le dessus du premier gradin du
 * Fanal), ses murets (épaisseur, hauteur au-dessus du dallage), les joints de son dallage, ses rouleaux.
 */
const RAMP = {
  width: 3.2,
  foot: 0.12,
  get top() {
    return FANAL_SITE.h0 + FANAL_LAYOUT.base() + FANAL_LAYOUT.socle.low.top - SITE.h0 - 0.02;
  },
  wall: 0.45,
  wallH: 0.8,
  joints: [1.8, 3.6, 5.4, 7.2, 9.0, 10.8, 12.6] as const,
  rollers: [1.4, 3.4, 5.4, 7.4, 9.4, 11.4] as const,
  /** Le muret du côté de la porte (au sud), ouvert en son milieu dans la ruine : de `gap[0]` à `gap[1]`, en part de la longueur. */
  gap: [0.36, 0.62] as const,
} as const;

/** La hauteur du dallage à `x` le long de la pente. */
const deckY = (x: number): number => RAMP.foot + ((RAMP.top - RAMP.foot) * x) / LENGTH;

/** Le portique, en haut de la rampe : sa place le long de la pente, sa hauteur au-dessus du dallage, le porte-à-faux de sa traverse au sud. */
const GANTRY = { x: LENGTH - 2.0, h: 3.2, over: 1.5, post: 0.22 } as const;

/** Le contrepoids, pendu au bout de la traverse, au sud, sur l'herbe : sa taille, sa hauteur au-dessus de l'herbe. */
const WEIGHT = { w: 0.6, h: 0.9, y: 1.4 } as const;

/** Le cabestan, sur l'herbe au sud du haut de la rampe : sa place, son tambour, la longueur de ses barres. */
const CAPSTAN = { x: LENGTH - 3.4, z: -(RAMP.width / 2 + 3.2), r: 0.45, h: 1.0, bar: 1.25 } as const;

/** Le traîneau chargé (les abords), sur ses rouleaux à mi-pente ; renversé au pied dans la ruine. */
const SLED = { x: 6.4, len: 2.2, w: 1.6, block: [1.4, 0.9, 1.1] as const, fallen: { x: 1.2, z: -(RAMP.width / 2 + 2.6) } } as const;

/** Le sentier de dalles, à hauteur de l'herbe, le long du côté sud de la rampe ; la lanterne de la charretière, au pied ; celle du sentier, en haut ; le banc. */
const PATH = { z: -(RAMP.width / 2 + 1.5), from: -0.5, to: LENGTH - 4.6, half: 0.55 } as const;
const LAMP = { x: -1.4, z: -(RAMP.width / 2 + 0.9), h: 1.4 } as const;
const PATH_LANTERN = { x: LENGTH - 5.2, z: -(RAMP.width / 2 + 2.3), h: 1.4 } as const;
const BENCH = { x: 3.2, z: -(RAMP.width / 2 + 3.3) } as const;

/** L'herbe sèche de la ruine, au pied des murets. */
const DRY = [
  { x: 2.4, z: -(RAMP.width / 2 + 0.8), s: 0.9 },
  { x: 9.6, z: -(RAMP.width / 2 + 0.9), s: 1 },
  { x: 0.4, z: RAMP.width / 2 + 0.9, s: 0.8 },
] as const;

// ---------- La vue ----------

/** Le cap d'arrivée : au nord-nord-ouest, de la porte au sud-est du pied ; la rampe de trois quarts, le Fanal au-delà. */
const DOOR_CAP = 322;
const DOOR_VIEW = capOf(DOOR_CAP);

/** La vue d'arrivée : le regard levé jusqu'au haut du Fanal, qu'on voit entier au-delà de la rampe. */
const ARRIVAL = (() => {
  const T = FANAL_LAYOUT.tower;
  const look = { x: FANAL_AT.x, z: FANAL_AT.z + T.z };
  return {
    look,
    back: 1.35,
    get top() {
      return FANAL_SITE.h0 - SITE.h0 + FANAL_LAYOUT.base() + T.y1 + 4.2;
    },
  };
})();

// ---------- Les volumes ----------

/** Le point du nom sur la Carte, au-dessus du pied de la rampe, le même en ruine et restauré. */
const MAP_POINT: Vec3 = (() => {
  const p = local(LENGTH * 0.4, 0);
  return { x: p.x, y: 4, z: p.z };
})();

/** Le corps de la rampe : un coin de granit, son dessus de pierre claire, du pied au gradin du Fanal. */
function rampBody(l: FacetBuilder): void {
  const w = RAMP.width;
  l.extrude(
    { x: 0, y: 0, z: -w / 2 },
    [
      [0, groundAt(0, 0) - 0.8],
      [LENGTH, groundAt(LENGTH, 0) - 0.8],
      [LENGTH, deckY(LENGTH)],
      [0, deckY(0)],
    ],
    w,
    C3E.stone,
    C3E.granite,
  );
  for (const x of RAMP.joints) l.beam({ x, y: deckY(x) + 0.005, z: -w / 2 + 0.02 }, { x, y: deckY(x) + 0.005, z: w / 2 - 0.02 }, 0.06, C3E.joint);
}

/** Un pan de muret le long de la rampe, de `x0` à `x1`, du côté `side` (1 : au nord, -1 : au sud), son chaperon d'ardoise. */
function wallRun(l: FacetBuilder, x0: number, x1: number, side: 1 | -1): void {
  const w = RAMP.width;
  const z0 = side > 0 ? w / 2 : -w / 2 - RAMP.wall;
  const g = Math.min(groundAt(x0, side * w), groundAt(x1, side * w));
  l.extrude(
    { x: 0, y: 0, z: z0 },
    [
      [x0, g - 0.8],
      [x1, g - 0.8],
      [x1, deckY(x1) + RAMP.wallH],
      [x0, deckY(x0) + RAMP.wallH],
    ],
    RAMP.wall,
    C3E.granite,
    C3E.graniteShade,
  );
  const y0 = deckY(x0) + RAMP.wallH,
    y1 = deckY(x1) + RAMP.wallH;
  const a = z0 - 0.07,
    c = z0 + RAMP.wall + 0.07;
  const q: P3[] = [
    [x0 - 0.04, y0, c],
    [x1 + 0.04, y1, c],
    [x1 + 0.04, y1, a],
    [x0 - 0.04, y0, a],
  ];
  sheet(l, q, 0.12, C3E.slateTop, C3E.slate);
}

/** Les rouleaux de bois en travers du dallage. */
function rollers(l: FacetBuilder): void {
  const w = RAMP.width;
  for (const x of RAMP.rollers) l.drum({ x, y: deckY(x) + 0.13, z: -w / 2 + 0.3, pitch: Math.PI / 2 }, 0.13, w - 0.6, 6, C3E.wood, C3E.newWood);
}

/** La ruine de la rampe : la fente du dallage, trois rouleaux épars dans l'herbe, les pierres du muret tombées, un chaperon penché. */
function rampBroken(l: FacetBuilder): void {
  const w = RAMP.width;
  const fx = 8.2;
  const crack: P3[] = [
    [fx - 0.25, deckY(fx - 0.25) + 0.02, -w / 2 + 0.1],
    [fx + 0.35, deckY(fx + 0.35) + 0.02, -w / 2 + 0.1],
    [fx + 0.1, deckY(fx + 0.1) + 0.02, w / 2 - 0.2],
    [fx - 0.35, deckY(fx - 0.35) + 0.02, w / 2 - 0.2],
  ];
  sheet(l, crack, 0.02, C.hollow, C.hollow);
  for (const [x, z, yaw] of [
    [-0.6, -(w / 2 + 1.0), 0.4],
    [0.5, -(w / 2 + 1.9), 1.2],
    [-1.6, 0.6, 2.0],
  ] as const)
    l.drum({ x, y: groundAt(x, z) + 0.13, z, yaw, pitch: Math.PI / 2 }, 0.13, 2.4, 6, C3E.wood, C3E.newWood);
  const [g0, g1] = RAMP.gap.map((t) => t * LENGTH);
  for (const [x, dz, s, yaw] of [
    [g0 + 0.6, 0.9, 0.55, 0.5],
    [g0 + 1.7, 1.4, 0.45, 1.4],
    [g1 - 0.7, 0.8, 0.5, 2.3],
  ] as const) {
    const z = -(w / 2 + RAMP.wall + dz);
    l.box({ x, y: groundAt(x, z) - 0.1, z, yaw }, [s * 1.4, s, s], C3E.graniteShade, C3E.granite);
  }
  // Un chaperon tombé, penché contre une pierre, son ardoise tournée vers la porte.
  const cx = (g0 + g1) / 2,
    cz = -(w / 2 + RAMP.wall + 1.2);
  l.box({ x: cx, y: groundAt(cx, cz) + 0.05, z: cz, yaw: 0.25, pitch: -0.5 }, [1.6, 0.12, 0.6], C3E.slate, C3E.slateTop);
}

/** Le portique : un montant (`which` : 1 au nord, -1 au sud) ; la traverse, sa poulie et son porte-à-faux au sud ; ou couchés sur la rampe (la ruine). */
function gantryPost(l: FacetBuilder, side: 1 | -1): void {
  const G = GANTRY;
  const z = side * (RAMP.width / 2 + RAMP.wall / 2);
  const y = deckY(G.x) + RAMP.wallH;
  l.box({ x: G.x, y: y - 0.05, z }, [G.post, G.h - RAMP.wallH + 0.25, G.post], C3E.woodShade, C3E.wood);
}

function gantryBeam(l: FacetBuilder): void {
  const G = GANTRY;
  const w = RAMP.width / 2 + RAMP.wall / 2;
  const y = deckY(G.x) + G.h;
  l.box({ x: G.x, y, z: (w - (w + G.over)) / 2 }, [G.post + 0.04, 0.24, 2 * w + G.over + 0.3], C3E.woodShade, C3E.wood);
  l.drum({ x: G.x - 0.2, y: y - 0.32, z: -0.25, pitch: Math.PI / 2 }, 0.26, 0.5, 8, C3E.iron, C3E.ironTop);
  // La corde, de la poulie au traîneau, au ras du dallage.
  l.beam({ x: G.x - 0.25, y: y - 0.55, z: 0 }, { x: SLED.x + SLED.len / 2, y: deckY(SLED.x + SLED.len / 2) + 0.5, z: 0 }, 0.05, C.rope);
}

/** Le contrepoids pendu à sa chaîne, au bout de la traverse, au-dessus de l'herbe du côté de la porte. */
function weightHung(l: FacetBuilder): void {
  const G = GANTRY;
  const z = -(RAMP.width / 2 + RAMP.wall / 2 + G.over);
  const g = groundAt(G.x, z);
  l.beam({ x: G.x, y: deckY(G.x) + G.h, z }, { x: G.x, y: g + WEIGHT.y + WEIGHT.h, z }, 0.07, C3E.iron);
  l.box({ x: G.x, y: g + WEIGHT.y, z }, [WEIGHT.w, WEIGHT.h, WEIGHT.w], C3E.iron, C3E.ironTop);
}

/** La ruine du haut : le montant sud et la traverse couchés sur la rampe, le contrepoids dans l'herbe, les barres du cabestan à terre. */
function gantryDown(l: FacetBuilder): void {
  const G = GANTRY;
  const x = G.x - 2.2;
  l.beam({ x: x - 1.6, y: deckY(x - 1.6) + 0.15, z: -0.6 }, { x: x + 1.4, y: deckY(x + 1.4) + 0.15, z: 0.9 }, 0.24, C3E.wood);
  l.beam({ x: G.x - 0.2, y: deckY(G.x) + 0.15, z: -1.1 }, { x: G.x - 2.8, y: deckY(G.x - 2.8) + 0.15, z: -0.9 }, 0.22, C3E.woodShade);
  const wz = -(RAMP.width / 2 + RAMP.wall + 1.0);
  l.box({ x: G.x - 0.6, y: groundAt(G.x - 0.6, wz) - 0.1, z: wz, yaw: 0.4 }, [WEIGHT.w, WEIGHT.h * 0.8, WEIGHT.w], C3E.iron, C3E.ironTop);
  const K = CAPSTAN;
  for (const [dx, dz, yaw] of [
    [-1.0, 0.8, 0.3],
    [0.6, -1.2, 1.9],
  ] as const)
    l.box({ x: K.x + dx, y: groundAt(K.x + dx, K.z + dz) + 0.02, z: K.z + dz, yaw }, [K.bar * 1.6, 0.1, 0.1], C3E.woodShade, C3E.wood);
}

/** Le cabestan : son dé de granit et son tambour de bois, debout sur l'herbe. */
function capstan(l: FacetBuilder): void {
  const K = CAPSTAN;
  const g = groundAt(K.x, K.z);
  l.box({ x: K.x, y: g + SINK_3E, z: K.z }, [1.3, 0.4 - SINK_3E, 1.3], C3E.graniteShade, C3E.granite);
  l.prism({ x: K.x, y: g + 0.4, z: K.z }, K.r, K.r * 0.8, K.h, 8, C3E.woodShade, C3E.wood);
  l.prism({ x: K.x, y: g + 0.4 + K.h, z: K.z }, K.r * 1.05, K.r * 1.05, 0.14, 8, C3E.wood, C3E.newWood);
}

/** Les quatre barres du cabestan, en croix, et sa corde vers la poulie du portique. */
function capstanBars(l: FacetBuilder): void {
  const K = CAPSTAN;
  const g = groundAt(K.x, K.z);
  const y = g + 0.4 + K.h - 0.1;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    l.beam({ x: K.x, y, z: K.z }, { x: K.x + Math.cos(a) * K.bar, y, z: K.z + Math.sin(a) * K.bar }, 0.1, C3E.newWood);
  }
  l.beam({ x: K.x, y: g + 0.9, z: K.z }, { x: GANTRY.x - 0.2, y: deckY(GANTRY.x) + GANTRY.h - 0.5, z: -0.5 }, 0.05, C.rope);
}

/** Le traîneau : ses deux patins, son plateau ; chargé d'un bloc de pierre claire (les abords), dessiné dans un repère `k`. */
function sledShape(k: FacetBuilder, loaded: boolean): void {
  const S = SLED;
  for (const s of [-1, 1]) k.box({ x: 0, y: 0, z: s * (S.w / 2 - 0.12) }, [S.len, 0.2, 0.16], C3E.woodShade, C3E.wood);
  k.box({ x: 0, y: 0.2, z: 0 }, [S.len - 0.2, 0.1, S.w], C3E.woodShade, C3E.newWood);
  if (loaded) k.box({ x: 0, y: 0.3, z: 0 }, [...S.block], C3E.stoneShade, C3E.stone);
}

/** Le traîneau chargé sur ses rouleaux, à mi-pente, penché avec elle. */
function sledUp(l: FacetBuilder): void {
  const S = SLED;
  const slope = Math.atan2(RAMP.top - RAMP.foot, LENGTH);
  drawPosed(l, { x: S.x + S.len / 2, y: deckY(S.x + S.len / 2) + 0.26, z: 0, yaw: Math.PI / 2, pitch: -slope }, (k) => drawPosed(k, { x: 0, y: 0, z: 0, yaw: -Math.PI / 2 }, (m) => sledShape(m, true)));
}

/** Le traîneau renversé (la ruine), dans l'herbe au pied, ses patins en l'air. */
function sledDown(l: FacetBuilder): void {
  const { x, z } = SLED.fallen;
  drawPosed(l, { x, y: groundAt(x, z) + 0.35, z, yaw: 0.5, pitch: Math.PI }, (k) => sledShape(k, false));
}

/** Le sentier de dalles, à hauteur de l'herbe, le long du côté sud de la rampe. */
function footpath(l: FacetBuilder): void {
  const n = 5;
  const step = (PATH.to - PATH.from) / n;
  for (let k = 0; k < n; k++) {
    const x = PATH.from + (k + 0.5) * step;
    l.box({ x, y: groundAt(x, PATH.z) - 0.06, z: PATH.z }, [step - 0.1, 0.1, 2 * PATH.half], C3E.joint, k % 2 ? C3E.stone : C3E.stoneShade);
  }
}

/** Le banc de pierre, à planche de bois. */
function bench(l: FacetBuilder): void {
  const { x, z } = BENCH;
  const y = groundAt(x, z);
  for (const s of [-1, 1]) l.box({ x: x + s * 0.55, y: y - 0.1, z }, [0.26, 0.55, 0.38], C3E.graniteShade, C3E.granite);
  l.box({ x, y: y + 0.42, z }, [1.5, 0.1, 0.44], C3E.woodShade, C3E.wood);
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };
  const [g0, g1] = RAMP.gap.map((t) => t * LENGTH);

  // Toujours là : le corps de la rampe, le muret nord, le muret sud de part et d'autre de sa brèche, le montant nord du
  // portique, le cabestan sans ses barres ; la lanterne de la charretière, la seule allumée de la ruine.
  add('ruine', 0, (b) =>
    posed(b, (l) => {
      rampBody(l);
      wallRun(l, 0, LENGTH, 1);
      wallRun(l, 0, g0, -1);
      wallRun(l, g1, LENGTH, -1);
      gantryPost(l, 1);
      capstan(l);
      postLantern3e(l, LAMP.x, groundAt(LAMP.x, LAMP.z), LAMP.z, LAMP.h, true);
    }),
  );
  // La rampe referme sa fente, relève le muret, remet les rouleaux.
  add('ruine', 0, (b) => posed(b, rampBroken), corps);
  // Le haut relève le portique, pend le contrepoids, remet les barres du cabestan.
  add('ruine', 0, (b) => posed(b, gantryDown), haut);
  // Les abords redressent le traîneau et effacent l'herbe sèche.
  add(
    'ruine',
    0,
    (b) =>
      posed(b, (l) => {
        sledDown(l);
        DRY.forEach((d) => dryTuft3e(l, d.x, groundAt(d.x, d.z), d.z, d.s));
      }),
    abords,
  );

  // ---- La rampe : le muret relevé, les rouleaux en travers du dallage.
  add(0, 0, (b) =>
    posed(b, (l) => {
      wallRun(l, g0, g1, -1);
      rollers(l);
    }),
  );
  // ---- Le haut : le montant sud, la traverse et sa poulie, le contrepoids pendu, les barres du cabestan et sa corde.
  add(1, 0, (b) =>
    posed(b, (l) => {
      gantryPost(l, -1);
      gantryBeam(l);
      weightHung(l);
      capstanBars(l);
    }),
  );
  // ---- Les abords : le sentier de dalles, le traîneau chargé sur ses rouleaux, le banc, la lanterne du sentier.
  add(2, 0, (b) =>
    posed(b, (l) => {
      footpath(l);
      sledUp(l);
      bench(l);
      const p = PATH_LANTERN;
      postLantern3e(l, p.x, groundAt(p.x, p.z), p.z, p.h, true);
    }),
  );
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de la rampe, loin du chemin et de la scène. */
const TRACE_SPOTS_P = {
  rope: { x: 0.6, z: -(RAMP.width / 2 + 1.1) },
  gloves: { x: CAPSTAN.x + 0.45, z: CAPSTAN.z - 0.45 },
  basket: { x: BENCH.x, z: BENCH.z },
} as const;

/** Les mêmes, dans le repère du lieu. */
const TRACE_SPOTS = {
  rope: local(TRACE_SPOTS_P.rope.x, TRACE_SPOTS_P.rope.z),
  gloves: local(TRACE_SPOTS_P.gloves.x, TRACE_SPOTS_P.gloves.z),
  basket: local(TRACE_SPOTS_P.basket.x, TRACE_SPOTS_P.basket.z),
} as const;

/** Dessine une trace dans le repère de la rampe, posée au centre du lieu. */
const traceIn = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: c.x + FOOT.x, y: c.y, z: c.z + FOOT.z, yaw: YAW }, draw);

/** Une corde lovée et un maillet de bois, dans l'herbe au pied de la rampe (Mouvements et forces). */
function ropeAndMallet(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.rope;
    const y = groundAt(x, z);
    l.prism({ x, y: y - 0.02, z }, 0.42, 0.38, 0.1, 8, C.rope, C3E.canvasShade);
    l.prism({ x, y: y + 0.08, z }, 0.36, 0.3, 0.1, 8, C.rope, C3E.canvasShade);
    l.box({ x: x + 0.7, y: y - 0.02, z: z + 0.1, yaw: 0.6 }, [0.5, 0.22, 0.22], C3E.woodShade, C3E.newWood);
    l.beam({ x: x + 0.7, y: y + 0.1, z: z + 0.1 }, { x: x + 1.2, y: y + 0.06, z: z - 0.4 }, 0.06, C3E.wood);
  });
}

/** Des gants de cuir et une cruche, posés sur le dé du cabestan (Énergie et puissance). */
function glovesAndJug(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.gloves;
    const y = groundAt(CAPSTAN.x, CAPSTAN.z) + 0.4;
    l.box({ x, y, z, yaw: 0.4 }, [0.28, 0.06, 0.16], C3E.leather);
    l.box({ x: x - 0.05, y: y + 0.06, z: z + 0.05, yaw: 0.9 }, [0.28, 0.06, 0.16], C3E.leather);
    l.prism({ x: x - 0.3, y, z: z + 0.25 }, 0.12, 0.09, 0.3, 8, C3E.stoneShade, C3E.stone);
  });
}

/** Un panier d'osier et une gourde, sur le banc (Acides et bases). */
function basketOnBench(b: FacetBuilder, c: Vec3): void {
  traceIn(b, c, (l) => {
    const { x, z } = TRACE_SPOTS_P.basket;
    const y = groundAt(x, z) + 0.52;
    l.prism({ x: x - 0.3, y, z }, 0.2, 0.24, 0.22, 8, C3E.canvasShade, C3E.canvas);
    l.beam({ x: x - 0.5, y: y + 0.22, z }, { x: x - 0.1, y: y + 0.22, z }, 0.04, C3E.woodShade);
    l.prism({ x: x + 0.35, y, z }, 0.11, 0.11, 0.24, 8, 0x7d8a6e, 0x7d8a6e);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie. */
const TRACES = {
  'motion-forces': { at: TRACE_SPOTS.rope, lift: 1.0, stage: 0, row: 0, draw: ropeAndMallet },
  'energy-power': { at: TRACE_SPOTS.gloves, lift: 1.2, stage: 1, row: 0, draw: glovesAndJug },
  'acids-bases': { at: TRACE_SPOTS.basket, lift: 1.0, stage: 2, row: 0, draw: basketOnBench },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette : au nord-ouest, vers la rampe de trois quarts et le Fanal, jamais vers le pic. */
const SCENE_START = capOf(340);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la charretière). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : sur l'herbe à l'ouest de la porte, au sud de la rampe. */
const SCENE_SPOT = { dx: -4.2, dz: 2.6, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la charretière au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe du creux. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, SITE.ground(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** L'établi des poulies : sa hauteur à l'échelle 1 ; une poulie choisie se soulève d'un cran. */
const PULLEYS = { height: 0.62, lift: 0.3, pulley: 0.42 } as const;

/** Une poulie de fer bruni, sa roue de face, son crochet en haut ; toutes pareilles. */
function pulley(b: FacetBuilder, at: Vec3, s: number): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [0.36 * s, 0.04 * s, 0.14 * s], C3E.woodShade);
  b.drum({ x: at.x, y: at.y + 0.2 * s, z: at.z - 0.04 * s, pitch: Math.PI / 2 }, 0.15 * s, 0.08 * s, 8, C3E.iron, C3E.ironTop);
  b.beam({ x: at.x, y: at.y + 0.33 * s, z: at.z }, { x: at.x, y: at.y + PULLEYS.pulley * s, z: at.z }, 0.05 * s, C3E.iron);
}

export const RAMPE: PlaceArt = {
  role: 'La charretière',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (4 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x6a5444);
  },
  answer: {
    size: { height: PULLEYS.height + PULLEYS.lift + PULLEYS.pulley, half: 0.3 },
    facing: true,
    // Un établi de bois, sous le rang des poulies.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PULLEYS.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.46 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.15);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.08 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Une poulie, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pulley(b, { x: at.x, y: at.y + (PULLEYS.height + (picked ? PULLEYS.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.4 },
  doorView: DOOR_VIEW,
  arrivalView: ARRIVAL,
  mapPoint: MAP_POINT,
};

/** Le plan de la Rampe, pour les tests. */
export const RAMPE_LAYOUT = {
  ramp: RAMP,
  length: LENGTH,
  foot: FOOT,
  top: TOP,
  local,
  deckY,
  gantry: GANTRY,
  capstan: CAPSTAN,
  door: SITE.door,
  doorCap: DOOR_CAP,
  arrival: ARRIVAL,
  fanalAt: FANAL_AT,
  scene: SCENE_SPOT,
  traceSpots: TRACE_SPOTS,
} as const;
