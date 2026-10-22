// Le Jardin (le Versant du 3e, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 6, relecture des lieux du directeur
// artistique, correction 1, et planche `selection-versant-v1`, de près graine 42, de loin graine 2026) : « le jardin des
// simples : des carrés de plantes qui soignent, des arbres greffés contre un mur, la fontaine au milieu ». Sur le gabarit
// de l'Abri (./abri3e.ts), avec le kit du 3e (./place3eKit.ts). Sur la pente la plus douce : le mur des espaliers au nord,
// au soleil, ses trois arbres palissés à plat en éventail ; quatre carrés bordés de granit, leurs touffes basses de
// plusieurs verts et quelques fleurs pâles ; la petite fontaine au bassin rond au milieu, l'eau sombre et immobile ; à
// l'est, le séchoir, un bâti à claies empilées sous un petit toit d'ardoise ; à l'ouest, le mortier de pierre sur son
// billot ; un muret bas sur les côtés, le jardin grand ouvert au sud, vers la porte (correction 1 : la porte au sud, le
// regard au nord, jamais à contre-jour).
//
// La ruine, d'après le texte : la moitié est du mur écroulée (un tronçon bas, trois pierres), ses deux arbres sans appui
// penchés ; les carrés envahis d'herbe haute, leurs bordures déchaussées ; le séchoir couché, ses claies en pile ; la
// fontaine sèche, son bec bouché ; le mortier debout. Une seule lumière, la lanterne du greffeur, sur la partie du mur
// restée debout. Trois parties (1 + 1 + 1) : le corps (les carrés) ; le haut (le mur, les arbres, le séchoir et sa
// lanterne) ; les abords (la fontaine pleine, le banc, le chemin de pierre claire, la lanterne du chemin). Une trace par
// mission, avec sa partie. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, armLantern3e, habitant3e, postLantern3e, site3e, wallSpan3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres au Jardin, en plus des matières des Passeurs (`C3E`) : la terre des carrés ; trois verts des
 * touffes et le vert gris des herbes sur les claies ; l'herbe haute de la ruine ; deux fleurs pâles ; le feuillage des
 * arbres et leur écorce ; l'eau sombre de la fontaine (jamais presque noire) et le fond sec ; la terre cuite des pots ;
 * l'osier ; la veste du greffeur (un vert de mousse éteint).
 */
const C = {
  soil: 0x8a7560,
  greens: [0x6f8f55, 0x7f9a5c, 0x8aa36a] as const,
  herbs: 0x93a07a,
  tall: 0x9fae72,
  grass: 0x7c9856,
  flowers: [0xd9cfe0, 0xe6dcb8] as const,
  leaf: 0x6a8a52,
  bark: 0x7a6656,
  water: 0x6d8299,
  dry: 0x9a8770,
  hollow: 0x6c645c,
  pot: 0xa8755a,
  wicker: 0xb39a6e,
  coat: 0x66744f,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('jardin');

/** Le plan du sol sous le jardin : la pente la plus douce du Versant, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-7, 7], [-6.5, 10]);

/** Le mur des espaliers, au nord : ses bouts, sa ligne, sa hauteur, son épaisseur ; où il s'est écroulé (la ruine). */
const WALL = { x0: -6.2, x1: 6.2, z: -5.6, h: 2.2, thick: 0.5, breach: 0.4 } as const;

/** Le muret bas des côtés, et ses deux bouts au sud, de part et d'autre de la grande ouverture. */
const SIDES = { z1: 6.0, h: 0.55, thick: 0.4, stub: 1.6 } as const;

/** Les trois arbres en espalier, contre la face sud du mur ; le premier, sur la partie restée debout. */
const TREES = { xs: [-3.6, 1.6, 4.4] as const, z: WALL.z + WALL.thick / 2 + 0.12, trunk: 0.9, span: 1.3, top: 1.9 } as const;

/** Les quatre carrés bordés de granit : leurs milieux, leur côté, la hauteur de leur bordure. */
const SQUARES = { at: [
  { x: -3.0, z: -1.8 },
  { x: 3.0, z: -1.8 },
  { x: -3.0, z: 2.8 },
  { x: 3.0, z: 2.8 },
] as const, side: 2.6, h: 0.3 } as const;

/** La petite fontaine au milieu : son bassin rond, son pilier et son bec. */
const FOUNTAIN = { x: 0, z: 0.5, r: 0.95, h: 0.45, pillar: 0.95 } as const;

/** Le séchoir à l'est : son milieu, sa largeur (x), sa profondeur (z), la hauteur de son toit. */
const DRYER = { x: 5.1, z: 0.5, w: 0.9, d: 1.4, h: 1.9 } as const;

/** Le mortier de pierre sur son billot, à l'ouest. */
const MORTAR = { x: -5.1, z: 0.5 } as const;

/** Le banc (les abords), au sud-ouest, face à la fontaine. */
const BENCH = { x: -4.6, z: 4.9, len: 1.5, w: 0.42, h: 0.42 } as const;

/** Les dalles du chemin de pierre claire (les abords), de la porte à la fontaine, hors de la scène. */
const FLAGS: readonly Vec2[] = [
  { x: 0, z: 2.3 },
  { x: 0.1, z: 6.7 },
  { x: -0.1, z: 7.6 },
];

/** La lanterne du chemin (les abords), dehors, à l'est de la porte, hors du chemin. */
const PATH_LANTERN = { x: 1.7, z: 9.8, h: 1.4 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (correction 1) : au nord, de la porte au sud ; le mur des espaliers au soleil, le pic au fond. */
const DOOR_VIEW = capOf(0);

/** La vue d'arrivée basse, à hauteur de Kéo. */
const DOOR_FRAME = { height: -2.5, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du mur, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return planeY(0, WALL.z) + WALL.h + 1.2;
  },
  z: -2,
};

// ---------- Les volumes ----------

/** Le sol du mur des espaliers : le plus bas de ses deux bouts, pour qu'il ne flotte jamais. */
const wallBase = (): number => Math.min(planeY(WALL.x0, WALL.z), planeY(WALL.x1, WALL.z)) - 0.05;

/** Le mur des espaliers entre `x0` et `x1`, à la hauteur `h`. */
function espalierWall(b: FacetBuilder, x0: number, x1: number, h: number): void {
  wallSpan3e(b, { x: x0, z: WALL.z }, { x: x1, z: WALL.z }, wallBase(), h, WALL.thick);
}

/** Le muret bas des côtés et ses deux bouts au sud. */
function sideWalls(b: FacetBuilder): void {
  const y = Math.min(planeY(WALL.x0, SIDES.z1), planeY(WALL.x1, SIDES.z1), wallBase()) - 0.05;
  const spans: [Vec2, Vec2][] = [
    [
      { x: WALL.x0, z: WALL.z },
      { x: WALL.x0, z: SIDES.z1 },
    ],
    [
      { x: WALL.x1, z: SIDES.z1 },
      { x: WALL.x1, z: WALL.z },
    ],
    [
      { x: WALL.x0, z: SIDES.z1 },
      { x: WALL.x0 + SIDES.stub, z: SIDES.z1 },
    ],
    [
      { x: WALL.x1 - SIDES.stub, z: SIDES.z1 },
      { x: WALL.x1, z: SIDES.z1 },
    ],
  ];
  for (const [a, c] of spans) wallSpan3e(b, a, c, y, SIDES.h, SIDES.thick);
}

/**
 * Un arbre en espalier, palissé à plat contre le mur, en éventail : le tronc, quatre branches, leur feuillage au bout ;
 * `lean` : penché en avant, sans appui (la ruine), de cet angle autour de son pied.
 */
function espalierTree(b: FacetBuilder, x: number, lean = 0): void {
  const g = planeY(x, TREES.z);
  const p = (u: number, v: number): Vec3 => ({ x: x + u, y: g + v * Math.cos(lean), z: TREES.z + v * Math.sin(lean) });
  const T = TREES;
  b.beam(p(0, -0.2), p(0, T.trunk), 0.16, C.bark);
  const ends: [number, number][] = [
    [-T.span, T.trunk + 0.35],
    [-T.span * 0.55, T.top],
    [T.span * 0.55, T.top],
    [T.span, T.trunk + 0.35],
  ];
  for (const [u, v] of ends) {
    b.beam(p(0, T.trunk), p(u, v), 0.1, C.bark);
    const k = 0.32 / Math.hypot(u, v - T.trunk);
    b.beam(p(u * (1 - k), v - (v - T.trunk) * k), p(u * (1 + k * 0.6), v + (v - T.trunk) * k * 0.6), 0.34, C.leaf);
  }
}

/** Un carré refait : sa bordure de granit et sa terre ; deux rangs de trois touffes, de plusieurs verts ; deux fleurs pâles. */
function squareUp(b: FacetBuilder, at: Vec2, k: number): void {
  const g = planeY(at.x, at.z);
  b.box({ x: at.x, y: g - 0.2, z: at.z }, [SQUARES.side, SQUARES.h + 0.2, SQUARES.side], C3E.granite, C.soil);
  const top = g + SQUARES.h;
  for (const [r, dz] of [-0.55, 0.55].entries())
    for (const [c, dx] of [-0.8, 0, 0.8].entries()) b.prism({ x: at.x + dx, y: top - 0.02, z: at.z + dz }, 0.3, 0, 0.42, 4, C.greens[(r + c + k) % 3]);
  for (const [i, dx] of [-0.4, 0.4].entries()) b.box({ x: at.x + dx, y: top + 0.25, z: at.z + (i ? -0.55 : 0.55) }, [0.12, 0.08, 0.12], C.flowers[(i + k) % 2]);
}

/** Un carré envahi (la ruine) : la terre basse sous l'herbe, deux pierres de bordure déchaussées, deux touffes d'herbe haute. */
function squareOvergrown(b: FacetBuilder, at: Vec2, k: number): void {
  const g = planeY(at.x, at.z);
  b.box({ x: at.x, y: g - 0.2, z: at.z }, [SQUARES.side - 0.3, 0.32, SQUARES.side - 0.3], C3E.graniteShade, C.grass);
  const s = SQUARES.side / 2;
  b.box({ x: at.x - s + 0.2, y: g - 0.1, z: at.z + (k % 2 ? 0.4 : -0.4), yaw: 0.3, pitch: 0.5 }, [0.25, 0.3, 1.0], C3E.graniteShade, C3E.granite);
  b.box({ x: at.x + 0.3, y: g - 0.1, z: at.z + s - 0.1, yaw: 1.3 + k, pitch: 0.4 }, [0.25, 0.3, 0.9], C3E.graniteShade, C3E.granite);
  for (const [dx, dz] of [
    [-0.5, -0.3],
    [0.5, 0.4],
  ] as const)
    b.prism({ x: at.x + dx, y: g + 0.05, z: at.z + dz, yaw: k }, 0.38, 0, 0.75, 4, C.tall);
}

/** La fontaine : son bassin rond de granit, son pilier et son bec ; toujours là. */
function fountainBasin(b: FacetBuilder): void {
  const F = FOUNTAIN;
  const g = planeY(F.x, F.z);
  b.annulus({ x: F.x, y: g - 0.2, z: F.z }, F.r - 0.18, F.r, F.h + 0.2, 10, C3E.graniteShade, C3E.graniteSun);
  b.box({ x: F.x, y: g - 0.2, z: F.z - F.r + 0.3 }, [0.32, F.pillar + 0.2, 0.32], C3E.graniteShade, C3E.granite);
  b.beam({ x: F.x, y: g + F.pillar - 0.2, z: F.z - F.r + 0.42 }, { x: F.x, y: g + F.pillar - 0.26, z: F.z - F.r + 0.68 }, 0.08, C3E.iron);
}

/** Le dedans du bassin : l'eau sombre et immobile (les abords), ou le fond sec et une pierre dans le bec (la ruine). */
function fountainInside(b: FacetBuilder, full: boolean): void {
  const F = FOUNTAIN;
  const g = planeY(F.x, F.z);
  b.prism({ x: F.x, y: g - 0.2, z: F.z }, F.r - 0.16, F.r - 0.16, (full ? F.h - 0.1 : 0.12) + 0.2, 10, full ? C.water : C.dry);
  if (!full) b.box({ x: F.x, y: g + F.pillar - 0.32, z: F.z - F.r + 0.62 }, [0.14, 0.12, 0.12], C3E.graniteShade, C3E.granite);
}

/** Le séchoir debout : quatre poteaux, quatre claies garnies d'herbes, son petit toit d'ardoise, sa lanterne (le haut). */
function dryerUp(b: FacetBuilder): void {
  const D = DRYER;
  const g = planeY(D.x, D.z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: D.x + sx * (D.w / 2 - 0.05), y: g - 0.2, z: D.z + sz * (D.d / 2 - 0.05) }, [0.1, D.h + 0.2, 0.1], C3E.woodShade, C3E.wood);
  for (let k = 0; k < 4; k++) b.box({ x: D.x, y: g + 0.35 + k * 0.32, z: D.z }, [D.w - 0.1, 0.06, D.d - 0.1], C3E.woodShade, C.herbs);
  b.gableRoof({ x: D.x, y: g + D.h, z: D.z, yaw: Math.PI / 2 }, D.d + 0.4, D.w + 0.4, 0.4, C3E.slate, C3E.woodShade);
  armLantern3e(b, D.x - D.w / 2 + 0.05, g + D.h - 0.25, D.z + D.d / 2 - 0.05, -1, 0, true);
}

/** Le séchoir couché sur le flanc, son toit à côté, et ses claies en pile (la ruine). */
function dryerFallen(b: FacetBuilder): void {
  const D = DRYER;
  const g = planeY(D.x, D.z);
  b.box({ x: D.x - 0.2, y: g - 0.05, z: D.z, pitch: Math.PI / 2, yaw: 0.15 }, [D.w, D.h * 0.9, 0.12], C3E.woodShade, C3E.wood);
  b.box({ x: D.x - 0.9, y: g - 0.05, z: D.z + 0.2, yaw: 0.5 }, [0.9, 0.12, 1.1], C3E.slate, C3E.slateTop);
  for (let k = 0; k < 3; k++) b.box({ x: D.x + 0.1, y: g + 0.12 + k * 0.08, z: D.z - 0.9, yaw: k * 0.2 }, [D.w - 0.1, 0.06, D.d - 0.2], C3E.woodShade, C3E.wood);
}

/** Le mortier de pierre claire sur son billot de bois, son pilon dedans ; toujours debout. */
function mortar(b: FacetBuilder): void {
  const g = planeY(MORTAR.x, MORTAR.z);
  b.prism({ x: MORTAR.x, y: g - 0.2, z: MORTAR.z }, 0.3, 0.3, 0.75, 7, C3E.woodShade, C3E.wood);
  b.prism({ x: MORTAR.x, y: g + 0.55, z: MORTAR.z }, 0.22, 0.28, 0.24, 7, C3E.stone, C.hollow);
  b.beam({ x: MORTAR.x, y: g + 0.7, z: MORTAR.z }, { x: MORTAR.x + 0.16, y: g + 1.05, z: MORTAR.z + 0.08 }, 0.07, C3E.stoneShade);
}

/** La moitié est du mur, écroulée : un tronçon bas et trois pierres dans l'herbe (la ruine). */
function breach(b: FacetBuilder): void {
  espalierWall(b, WALL.breach, WALL.x1, 0.5);
  for (const [x, dz, yaw] of [
    [1.4, 0.9, 0.3],
    [3.2, 1.2, 1.1],
    [5.0, 0.8, 2.0],
  ] as const)
    b.box({ x, y: planeY(x, WALL.z + dz) - 0.12, z: WALL.z + dz, yaw }, [0.55, 0.35, 0.4], C3E.graniteShade, C3E.granite);
}

/** Le banc du greffeur (les abords). */
function bench(b: FacetBuilder): void {
  const B = BENCH;
  const g = planeY(B.x, B.z);
  for (const s of [-1, 1]) b.box({ x: B.x + s * (B.len / 2 - 0.15), y: g - 0.1, z: B.z }, [0.18, B.h + 0.1, B.w - 0.08], C3E.graniteShade, C3E.granite);
  b.box({ x: B.x, y: g + B.h, z: B.z }, [B.len, 0.1, B.w], C3E.woodShade, C3E.wood);
}

/** Les dalles de pierre claire du chemin (les abords). */
function flags(b: FacetBuilder): void {
  for (const [k, f] of FLAGS.entries()) b.box({ x: f.x, y: planeY(f.x, f.z) - 0.1, z: f.z, yaw: 0.2 * (k - 1) }, [0.8, 0.16, 0.6], C3E.stoneShade, C3E.stone);
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : la moitié ouest du mur des espaliers, son arbre palissé et la lanterne du greffeur, la seule allumée de
  // la ruine ; le muret bas des côtés ; le bassin de la fontaine ; le mortier debout.
  add('ruine', 0, (b) => {
    espalierWall(b, WALL.x0, WALL.breach, WALL.h);
    espalierTree(b, TREES.xs[0]);
    armLantern3e(b, -1.2, wallBase() + WALL.h - 0.35, WALL.z + WALL.thick / 2, 0, 1, true);
    sideWalls(b);
    fountainBasin(b);
    mortar(b);
  });
  // Le corps relève les carrés envahis.
  add('ruine', 0, (b) => SQUARES.at.forEach((at, k) => squareOvergrown(b, at, k)), corps);
  // Le haut relève le mur écroulé, ses deux arbres penchés et le séchoir couché.
  add(
    'ruine',
    0,
    (b) => {
      breach(b);
      espalierTree(b, TREES.xs[1], 0.35);
      espalierTree(b, TREES.xs[2], 0.5);
      dryerFallen(b);
    },
    haut,
  );
  // Les abords remplissent la fontaine sèche.
  add('ruine', 0, (b) => fountainInside(b, false), abords);

  // ---- Le corps : les carrés refaits, leurs bordures remises, les plantes en rangs.
  add(0, 0, (b) => SQUARES.at.forEach((at, k) => squareUp(b, at, k)));
  // ---- Le haut : le mur des espaliers relevé, les arbres palissés ; le séchoir debout, ses claies garnies, sa lanterne.
  add(1, 0, (b) => {
    espalierWall(b, WALL.breach, WALL.x1, WALL.h);
    espalierTree(b, TREES.xs[1]);
    espalierTree(b, TREES.xs[2]);
    dryerUp(b);
  });
  // ---- Les abords : la fontaine pleine ; le banc ; le chemin de pierre claire ; la lanterne du chemin.
  add(2, 0, (b) => {
    fountainInside(b, true);
    bench(b);
    flags(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  can: { x: 4.6, z: 4.4 },
  tools: { x: -5.55, z: WALL.z + 0.45 },
  basket: { x: -5.3, z: 2.4 },
} as const;

/** Un arrosoir de fer posé au coin d'un carré (Effort, cerveau et sommeil). */
function wateringCan(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.can;
    const y = planeY(x, z);
    l.prism({ x, y, z }, 0.17, 0.15, 0.3, 8, C3E.iron, C3E.ironTop);
    l.beam({ x: x + 0.12, y: y + 0.1, z }, { x: x + 0.42, y: y + 0.34, z: z - 0.02 }, 0.05, C3E.iron);
    l.beam({ x: x - 0.12, y: y + 0.3, z }, { x: x - 0.02, y: y + 0.44, z }, 0.04, C3E.iron);
    l.beam({ x: x - 0.02, y: y + 0.44, z }, { x: x + 0.08, y: y + 0.3, z }, 0.04, C3E.iron);
  });
}

/** Une bêche et un râteau debout côte à côte contre le mur (Digestion et microbes). */
function tools(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.tools;
    const y = planeY(x, z);
    l.beam({ x: x - 0.18, y: y + 0.3, z: z + 0.15 }, { x: x - 0.18, y: y + 1.35, z: z - 0.08 }, 0.05, C3E.newWood);
    l.box({ x: x - 0.18, y: y - 0.05, z: z + 0.16 }, [0.22, 0.36, 0.04], C3E.iron, C3E.ironTop);
    l.beam({ x: x + 0.18, y: y + 0.1, z: z + 0.15 }, { x: x + 0.18, y: y + 1.45, z: z - 0.08 }, 0.05, C3E.newWood);
    l.box({ x: x + 0.18, y: y + 0.02, z: z + 0.17 }, [0.36, 0.05, 0.06], C3E.iron, C3E.ironTop);
  });
}

/** Un panier d'osier plein de bouquets d'herbes sèches (Puberté et reproduction). */
function basket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.basket;
    const y = planeY(x, z);
    l.prism({ x, y, z }, 0.26, 0.32, 0.26, 8, C.wicker, C.herbs);
    for (const [dx, dz] of [
      [-0.1, 0],
      [0.1, 0.05],
    ] as const)
      l.prism({ x: x + dx, y: y + 0.24, z: z + dz }, 0.1, 0.02, 0.26, 4, C.herbs);
    l.beam({ x: x - 0.26, y: y + 0.26, z }, { x, y: y + 0.55, z }, 0.04, C.wicker);
    l.beam({ x, y: y + 0.55, z }, { x: x + 0.26, y: y + 0.26, z }, 0.04, C.wicker);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : le corps, le haut, les abords. */
const TRACES = {
  'effort-brain': { at: TRACE_SPOTS.can, lift: 1, stage: 0, row: 0, draw: wateringCan },
  'digestion-microbes': { at: TRACE_SPOTS.tools, lift: 1.5, stage: 1, row: 0, draw: tools },
  'puberty-reproduction': { at: TRACE_SPOTS.basket, lift: 1, stage: 2, row: 0, draw: basket },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 6) : au nord, vers le mur des espaliers et le pic. */
const SCENE_START = capOf(0);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le greffeur). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : entre les deux carrés du sud, la fontaine devant. */
const SCENE_SPOT = { dx: 0, dz: 4.8, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du greffeur au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe du jardin. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La margelle des pots : sa hauteur à l'échelle 1 ; un pot choisi se soulève d'un cran. */
const LEDGE = { height: 0.5, lift: 0.3, pot: 0.24 } as const;

/** Un pot de terre cuite, tous pareils, son dedans plus sombre. */
function pot(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.1 * s, 0.14 * s, LEDGE.pot * s, 8, C.pot, C.hollow);
}

export const JARDIN: PlaceArt = {
  role: 'Le greffeur',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x9a948a);
  },
  answer: {
    size: { height: LEDGE.height + LEDGE.lift + LEDGE.pot, half: 0.3 },
    facing: true,
    // Une margelle de granit sur deux pieds de pierre, sous la rangée des pots.
    base(b, mid, y, z, span, s, ground) {
      const top = y + LEDGE.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.44 * s], C3E.graniteShade, C3E.graniteSun);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.22, top - 0.1 * s - f, 0.36 * s], C3E.graniteShade, C3E.granite);
      }
    },
    // Un pot, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pot(b, { x: at.x, y: at.y + (LEDGE.height + (picked ? LEDGE.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z - 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Jardin, pour les tests et ses abords. */
export const JARDIN_LAYOUT = {
  wall: WALL,
  sides: SIDES,
  trees: TREES,
  squares: SQUARES,
  fountain: FOUNTAIN,
  dryer: DRYER,
  mortar: MORTAR,
  bench: BENCH,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  colors: C,
} as const;
