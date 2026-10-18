/**
 * Les abords de la scénette des Balises (reprise lieu par lieu, d'après les concepts du 18 octobre 2026,
 * « scenettes-6e-balises ») : de face, à droite de la cale, le ponton du baliseur qui part vers le large, bordé de bouées
 * rouge et blanc, et à son bout, sur une plate-forme à garde-corps, la cabane de guet au toit d'ardoise bleue et sa
 * longue-vue de laiton tournée vers la passe ; au-delà, le chenal marqué de bouées, deux îlots (l'un à palmier et
 * rocher, l'autre à pins) et un voilier au loin dans le chenal. De côté (vers l'ouest), la mer de la passe, deux roches
 * et un îlot à pin ; de dos, la grève qui monte : des pins, des rochers de pierre chaude, des touffes d'herbe sèche, le
 * dépôt du baliseur (deux bouées de rechange couchées, un tonneau). Le kit commun (./surroundingsKit.ts) pour le ponton,
 * les rochers, les touffes et le tonneau.
 *
 * Rien de haut dans l'anneau où la rangée des objets-réponses se pose quand la caméra tourne (`RING` des Quais, 7,5 du
 * point visé, plus une marge) : le pied du ponton y reste au ras du sol de la scène, ses bouées commencent au-delà. Rien
 * de haut entre la caméra de face et la scène : au sud, ce qui se dresse se tient sur les côtés ou derrière la caméra,
 * et ce qui est sous son regard reste bas (des pierres, des touffes).
 * Aplats francs, une couleur par facette, jamais presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import { FLORA_COLORS } from './flora';
import type { Vec3 } from './geometry';
import { COLORS_6E } from './plan6e';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, NATURE, barrel, groundAt, pontoon, rock, tuft, type P3 } from './surroundingsKit';

const C = {
  /** Les bouées du baliseur : un rouge chaud et un blanc cassé (jamais un blanc pur). */
  red: 0xd0553f,
  white: 0xf2eee4,
  /** La cabane de guet : ses planches, ses montants, sa porte, sa vitre gris-bleu (pas un trou noir). */
  planks: 0xc98e55,
  post: 0x8a6440,
  door: 0x7a5538,
  glass: 0x6f8c99,
  /** Son toit d'ardoise bleue, en deux tons (l'ardoise des maisons du kit), et son épi. */
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  /** La longue-vue : le laiton et sa bague plus sombre. */
  brass: 0xd2a64a,
  brassDark: 0xa9803a,
  /** Les îlots : le sable du rivage, son flanc mouillé, l'herbe et son flanc. */
  sand: NATURE.dune,
  wetSand: COLORS_6E.wetSand,
  grass: NATURE.grass,
  grassSide: NATURE.grassDeep,
  /** Les pins et le palmier : les verts de la flore du monde, le tronc. */
  pine: FLORA_COLORS.pine,
  pineLight: FLORA_COLORS.pineLight,
  palm: FLORA_COLORS.palm,
  palmLight: 0x5cbf80,
  trunk: FLORA_COLORS.trunk,
  /** Le voilier au loin : sa coque brun-rouge, son pont, son mât, ses voiles. */
  hull: 0xb0603e,
  deck: 0xc9a26e,
  mast: 0xa57a4f,
  sail: 0xf2eee4,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (x à l'est, z au sud) : le ponton (son axe, sa largeur, son début et sa
 * fin, le dessus de son plancher), sa plate-forme de bout, la cabane, les îlots, le voilier.
 */
export const BEACONS_SURROUNDINGS = {
  pontoon: { dx: 4.2, width: 1.6, from: -4.4, to: -12.4, top: 0.8 },
  head: { dx: 4.6, width: 3.2, from: -12.4, to: -15.2 },
  hut: { dx: 5.0, dz: -13.9, width: 1.5, depth: 1.3, wall: 1.65 },
  islets: [
    { dx: 1.0, dz: -23.0, r: 2.6, look: 'palm' },
    { dx: -6.0, dz: -19.0, r: 2.3, look: 'pines' },
    { dx: -21.0, dz: 1.0, r: 1.7, look: 'pine' },
  ],
  sailboat: { dx: -3.5, dz: -28.5, length: 3.4, width: 1.1 },
} as const;

/** La distance au point visé en deçà de laquelle la rangée des réponses peut se poser quand la caméra tourne. */
export const RING = 7.5;

export function beaconsSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  jetty(b, floor);
  hut(b, floor);
  channel(b, floor);
  islets(b, floor);
  sailboat(b, floor);
  shore(b, floor);
}

/**
 * Une bouée du baliseur, posée en (x, y, z), à l'échelle `s` : en obus, le corps blanc, une bande rouge au pied, la pointe
 * rouge. Vingt-cinq triangles (deux cerclages et une pointe : la pointe ferme le haut du corps).
 */
function buoy(b: FacetBuilder, x: number, y: number, z: number, s = 1): void {
  b.band({ x, y, z }, 0.2 * s, 0.13 * s, 5, C.red);
  b.band({ x, y: y + 0.13 * s, z }, 0.185 * s, 0.21 * s, 5, C.white);
  b.prism({ x, y: y + 0.34 * s, z }, 0.185 * s, 0, 0.26 * s, 5, C.red);
}

/**
 * Le ponton du baliseur (le ponton du kit commun), à l'est de la cale : du rivage, au sud, vers le large ; ses bouées
 * rouge et blanc en rang sur ses deux bords, au-delà de l'anneau de la rangée ; sa plate-forme de bout, plus large.
 */
function jetty(b: FacetBuilder, f: Vec3): void {
  const P = BEACONS_SURROUNDINGS.pontoon;
  const H = BEACONS_SURROUNDINGS.head;
  const x = f.x + P.dx;
  pontoon(b, { from: { x, z: f.z + P.from }, to: { x, z: f.z + P.to }, width: P.width, top: P.top, pairs: 5 });
  pontoon(b, { from: { x: f.x + H.dx, z: f.z + H.from }, to: { x: f.x + H.dx, z: f.z + H.to }, width: H.width, top: P.top, pairs: 2 });
  for (let k = 0; k < 5; k++) {
    const z = f.z - 7.8 - k * 1.1;
    for (const side of [-1, 1]) buoy(b, x + side * (P.width / 2 - 0.2), P.top, z);
  }
}

/**
 * La cabane de guet, sur la plate-forme du bout du ponton : ses murs de planches et leurs montants d'angle, la porte et
 * une fenêtre au sud (vers la scène), une fenêtre à l'ouest ; son toit d'ardoise bleue en pyramide, ses pans de deux
 * tons ; au nord-ouest de la plate-forme, la longue-vue de laiton sur son poteau, tournée vers la passe ; le garde-corps
 * du côté du large.
 */
function hut(b: FacetBuilder, f: Vec3): void {
  const H = BEACONS_SURROUNDINGS.hut;
  const P = BEACONS_SURROUNDINGS.pontoon;
  const D = BEACONS_SURROUNDINGS.head;
  const x = f.x + H.dx,
    z = f.z + H.dz,
    y = P.top;
  const w = H.width / 2,
    d = H.depth / 2;
  b.box({ x, y, z }, [H.width, H.wall, H.depth], C.planks);
  for (const sx of [-1, 1]) b.box({ x: x + sx * (w - 0.04), y, z: z + d - 0.04 }, [0.12, H.wall, 0.12], C.post);
  // La porte et la fenêtre au sud, la fenêtre à l'ouest.
  const south = z + d + 0.01;
  b.quad([x - 0.5, y, south], [x - 0.05, y, south], [x - 0.05, y + 1.3, south], [x - 0.5, y + 1.3, south], C.door);
  b.quad([x + 0.15, y + 0.75, south], [x + 0.55, y + 0.75, south], [x + 0.55, y + 1.25, south], [x + 0.15, y + 1.25, south], C.glass);
  const west = x - w - 0.01;
  b.quad([west, y + 0.75, z - 0.25], [west, y + 0.75, z + 0.25], [west, y + 1.25, z + 0.25], [west, y + 1.25, z - 0.25], C.glass);
  // Le toit en pyramide, débordant : quatre pans, de deux tons l'un après l'autre.
  const top = y + H.wall,
    over = 0.3;
  const apex: P3 = [x, top + 0.95, z];
  const corners: P3[] = [
    [x - w - over, top - 0.05, z + d + over],
    [x + w + over, top - 0.05, z + d + over],
    [x + w + over, top - 0.05, z - d - over],
    [x - w - over, top - 0.05, z - d - over],
  ];
  for (let k = 0; k < 4; k++) b.triangle(corners[k], corners[(k + 1) % 4], apex, k % 2 ? C.slate : C.slateLight);
  // La longue-vue, au nord-ouest de la plate-forme : son poteau, le tube de laiton levé vers le large, sa bague.
  const px = f.x + D.dx - D.width / 2 + 0.35,
    pz = f.z + D.to + 0.4;
  b.beam({ x: px, y, z: pz }, { x: px, y: y + 1.35, z: pz }, 0.12, C.post);
  b.beam({ x: px + 0.28, y: y + 1.25, z: pz + 0.3 }, { x: px - 0.4, y: y + 1.62, z: pz - 0.45 }, 0.16, C.brass);
  b.beam({ x: px + 0.28, y: y + 1.25, z: pz + 0.3 }, { x: px + 0.4, y: y + 1.19, z: pz + 0.43 }, 0.1, C.brassDark);
  // Le garde-corps du côté du large : deux poteaux, une lisse.
  const rz = f.z + D.to + 0.08;
  const x0 = f.x + D.dx - D.width / 2 + 0.1,
    x1 = f.x + D.dx + D.width / 2 - 0.1;
  for (const rx of [x0 + 0.7, x1]) b.box({ x: rx, y, z: rz }, [0.1, 0.8, 0.1], C.post);
  b.beam({ x: x0 + 0.7, y: y + 0.75, z: rz }, { x: x1, y: y + 0.75, z: rz }, 0.09, C.post);
}

/** Les bouées du chenal, au-delà du bout du ponton, de part et d'autre de la voie du voilier : (dx, dz). */
const CHANNEL_BUOYS: readonly (readonly [number, number])[] = [
  [-4.4, -14.8],
  [-1.0, -16.0],
  [-5.8, -24.0],
  [-1.6, -25.5],
  [-13.5, -12.0],
];

/** Le chenal : ses bouées, plus grandes que celles du ponton, à demi dans l'eau. */
function channel(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz] of CHANNEL_BUOYS) buoy(b, f.x + dx, -0.25, f.z + dz, 1.9);
}

/**
 * Les îlots au large : un socle de sable à flancs mouillés, une butte d'herbe ; sur le premier, dans l'axe de la scène, un
 * rocher et un palmier ; sur le deuxième, à l'ouest du chenal, un rocher et deux pins ; le troisième, à l'ouest dans la
 * passe (de côté), un pin. Deux roches qui affleurent dans la passe.
 */
function islets(b: FacetBuilder, f: Vec3): void {
  for (const [k, I] of BEACONS_SURROUNDINGS.islets.entries()) {
    const x = f.x + I.dx,
      z = f.z + I.dz;
    b.prism({ x, y: -1.6, z, yaw: 0.3 * k }, I.r * 1.12, I.r, 1.9, 7, C.wetSand, C.sand);
    b.prism({ x: x + 0.2, y: 0.25, z: z - 0.3, yaw: 0.5 }, I.r * 0.78, I.r * 0.5, 0.45, 7, C.grassSide, C.grass);
    if (I.look === 'palm') {
      rock(b, { x: x + 0.6, y: 0.55, z: z - 0.8 }, 1.1, 1.6, 4);
      palm(b, { x: x - 1.0, y: 0.6, z: z + 0.2 });
    } else if (I.look === 'pine') {
      pine(b, { x, y: 0.6, z: z - 0.3 }, 1.1);
    } else {
      rock(b, { x: x + 1.1, y: 0.5, z: z + 0.5 }, 0.7, 0.8, 9);
      pine(b, { x: x - 0.5, y: 0.6, z: z - 0.4 }, 1.2);
      pine(b, { x: x + 0.5, y: 0.6, z: z - 0.9 }, 0.9);
    }
  }
  // Deux roches qui affleurent à l'ouest, dans la passe.
  for (const [dx, dz, r, h, seed] of [
    [-15.5, -6.0, 1.0, 0.8, 7],
    [-18.5, -15.5, 1.2, 1.1, 3],
  ] as const)
    rock(b, { x: f.x + dx, y: 0.05, z: f.z + dz }, r, h, seed);
}

/** Un pin : un tronc à quatre pans, trois cônes à six pans, de deux verts ; `s` sa taille. Trente triangles. */
function pine(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y - 0.1, z: at.z }, 0.14 * s, 0.11 * s, 0.7 * s, 4, C.trunk);
  for (let k = 0; k < 3; k++) b.prism({ x: at.x, y: at.y + (0.55 + 0.6 * k) * s, z: at.z, yaw: 0.5 * k }, (0.95 - 0.22 * k) * s, 0, (1.15 - 0.15 * k) * s, 6, k % 2 ? C.pine : C.pineLight);
}

/** Un palmier : un tronc penché en deux pièces, cinq palmes en losange, de deux verts. Trente-quatre triangles. */
function palm(b: FacetBuilder, at: Vec3): void {
  const mid = { x: at.x - 0.2, y: at.y + 1.3, z: at.z };
  const head = { x: at.x - 0.05, y: at.y + 2.5, z: at.z + 0.1 };
  b.beam(at, mid, 0.18, C.trunk);
  b.beam(mid, head, 0.15, C.trunk);
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5 + 0.3;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const tip: P3 = [head.x + 1.2 * c, head.y - 0.45, head.z + 1.2 * s];
    const mid: P3 = [head.x + 0.6 * c, head.y + 0.12, head.z + 0.6 * s];
    const l: P3 = [mid[0] - 0.25 * s, mid[1], mid[2] + 0.25 * c];
    const r: P3 = [mid[0] + 0.25 * s, mid[1], mid[2] - 0.25 * c];
    const h: P3 = [head.x, head.y + 0.05, head.z];
    const color = k % 2 ? C.palm : C.palmLight;
    b.triangle(h, l, tip, color);
    b.triangle(h, tip, r, color);
  }
}

/**
 * Le voilier au loin, dans le chenal, la proue à l'ouest, de flanc pour la caméra de face : sa coque brun-rouge, son
 * pont, son rouf, le mât, la grand-voile et le foc, chacune de ses deux faces.
 */
function sailboat(b: FacetBuilder, f: Vec3): void {
  const S = BEACONS_SURROUNDINGS.sailboat;
  const x = f.x + S.dx,
    z = f.z + S.dz;
  const body = S.length - S.width / 2;
  const cx = x + S.width / 4;
  b.box({ x: cx, y: -0.25, z }, [body, 0.6, S.width], C.hull, C.deck);
  b.prism({ x: cx - body / 2, y: -0.25, z }, S.width / 2, S.width / 2, 0.6, 4, C.hull, C.deck);
  b.box({ x: cx + 0.35, y: 0.35, z }, [0.9, 0.28, 0.7], C.white, C.deck);
  const mx = cx - 0.2;
  b.beam({ x: mx, y: 0.35, z }, { x: mx, y: 4.3, z }, 0.1, C.mast);
  const sail = (pts: P3[]) => {
    b.triangle(pts[0], pts[1], pts[2], C.sail);
    b.triangle(pts[0], pts[2], pts[1], C.sail);
  };
  sail([[mx + 0.08, 0.75, z], [cx + body / 2 - 0.05, 0.8, z], [mx + 0.08, 4.15, z]]);
  sail([[mx - 0.08, 0.7, z], [mx - 0.08, 3.9, z], [cx - body / 2 - S.width / 2 + 0.15, 0.55, z]]);
}

/** Les rochers de la grève, sur les côtés et derrière la caméra de face : (dx, dz, rayon, hauteur, graine). */
const SHORE_ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [-6.8, 7.0, 0.8, 0.7, 11],
  [-6.4, 12.5, 1.0, 0.8, 6],
  [-10.0, -3.0, 1.1, 0.9, 8],
  [6.6, 14.0, 0.9, 0.8, 1],
  [-3.5, 20.5, 1.0, 0.8, 12],
  // Deux pierres basses dans l'herbe, derrière la scène de dos : sous le regard de la caméra de face.
  [1.5, 10.5, 0.7, 0.5, 4],
  [-2.5, 12.5, 0.9, 0.6, 9],
];

/** Les pins de la grève, derrière la caméra de face (de dos, au-delà de Kéo et du pilote) : (dx, dz, taille). */
const SHORE_PINES: readonly (readonly [number, number, number])[] = [
  [-6.5, 17.5, 1.5],
  [5.0, 19.5, 1.7],
  [-1.5, 24.0, 1.8],
];

/** Les touffes d'herbe sèche, éparses autour de la scène, hors de l'anneau et de la bande devant la caméra : (dx, dz). */
const SHORE_TUFTS: readonly (readonly [number, number])[] = [
  [-6.6, 5.6],
  [6.8, 5.8],
  [-7.4, 9.6],
  [5.0, 11.8],
  [2.2, 17.0],
  [-3.0, 15.8],
  [0.0, 9.8],
  [-1.0, 13.8],
  [3.0, 12.8],
];

/**
 * La grève autour de la scène : les rochers de pierre chaude, les pins, les touffes d'herbe sèche ; au sud-est, le dépôt
 * du baliseur : deux bouées de rechange couchées dans l'herbe et un tonneau.
 */
function shore(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz, r, h, seed] of SHORE_ROCKS) {
    const x = f.x + dx,
      z = f.z + dz;
    rock(b, { x, y: groundAt(x, z, 0.05), z }, r, h, seed);
  }
  for (const [dx, dz, s] of SHORE_PINES) {
    const x = f.x + dx,
      z = f.z + dz;
    pine(b, { x, y: groundAt(x, z, 0.05), z }, s);
  }
  for (const [k, [dx, dz]] of SHORE_TUFTS.entries()) {
    const x = f.x + dx,
      z = f.z + dz;
    tuft(b, { x, y: groundAt(x, z, 0.03), z }, k + 1, DRY_TUFT, 1.2);
  }
  // Le dépôt du baliseur, derrière la scène de dos, sous le regard de la caméra de face : deux bouées de rechange couchées, la pointe vers le nord, un tonneau.
  for (const [dx, dz, yaw] of [
    [3.2, 9.6, 0.4],
    [4.0, 10.5, -0.3],
  ] as const) {
    const x = f.x + dx,
      z = f.z + dz;
    const y = groundAt(x, z, 0.02) + 0.18;
    b.prism({ x, y, z, yaw, pitch: -Math.PI / 2 }, 0.2, 0.17, 0.34, 5, C.white);
    b.prism({ x: x - Math.sin(yaw) * 0.34, y, z: z - Math.cos(yaw) * 0.34, yaw, pitch: -Math.PI / 2 }, 0.17, 0, 0.26, 5, C.red);
  }
  const bx = f.x + 4.6,
    bz = f.z + 9.6;
  barrel(b, bx, groundAt(bx, bz, 0.04), bz);
}
