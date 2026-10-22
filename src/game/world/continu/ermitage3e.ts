// L'Ermitage (les Alpages du 3e, GD-25, lot 3, lieu d'option ; proposition du consultant d'Archipéo, § 7, et planche
// `selection-alpages-v1`, de près graine 42) : « la retraite des penseurs, sous un bois de pins : un cercle de colonnes
// basses, un banc rond et une fontaine ». Sur le gabarit du Kiosque (./kiosque3e.ts) et, pour les rangs d'un lieu du latin
// et du grec, de la Basilique du 4e (./basilique4e.ts), avec le kit du 3e (./place3eKit.ts). Au bord ouest de l'alpage,
// dans une clairière au sol d'aiguilles de pin, entourée de pins en cônes facettés (planche validée) : un cercle de six
// colonnes basses de pierre claire, fûts lisses, chapiteaux carrés et nus, ni cannelure, ni statue, ni inscription, qui
// portent un anneau de linteaux ouvert sur le ciel ; dedans, un banc de pierre en rond autour d'une table ronde ; à côté,
// une fontaine au bassin d'eau sombre et immobile (jamais presque noire). Les colonnes bien dégagées des troncs ; entre les
// troncs, la rive et les nuages.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : les deux colonnes de l'est tombées, couchées
// hors du chemin, deux linteaux à terre ; le banc fendu, la table renversée ; la fontaine sèche ; l'herbe sèche. Les pins
// debout, tous. Une seule lumière, la lanterne de la traductrice, sur un poteau à l'entrée de la clairière. Trois parties
// (1 + 1 + 1) : le corps (les six colonnes, l'anneau de linteaux) ; le haut (le banc rond et sa table, la lanterne de la
// colonnade) ; les abords (la fontaine pleine, le dallage, la lanterne du chemin). Lieu d'option (comme la Basilique) :
// une trace par rang de mission, la même pour le latin et le grec ; rien ne dit Rome ou la Grèce. La porte est au
// nord-est, à côté de la colonnade (relecture du Versant, (b) 1) : Kéo s'y arrête, la colonnade à sa gauche, et regarde
// à l'ouest, entre les troncs, la rive et la mer de nuages. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, dryTuft3e, habitant3e, lantern3e, onCircle, postLantern3e, site3e } from './place3eKit';
import { COLORS_3E } from './plan3e';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres à l'Ermitage, en plus des matières des Passeurs (`C3E`) : les pins des pentes (ceux du 3e) ; le
 * tronc ; le sol d'aiguilles de la clairière ; l'eau sombre et immobile de la fontaine (celle du Jardin) ; la terre des
 * coupes ; les pommes de pin des réponses ; la veste de la traductrice.
 */
const C = {
  pine: COLORS_3E.pine,
  pineShade: COLORS_3E.pineShade,
  trunk: 0x7a6250,
  needles: 0x9a8560,
  water: 0x6d8299,
  clay: 0xa8715a,
  cone: 0x8a6a4a,
  coneTop: 0x9c7c58,
  coat: 0x58707a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('ermitage');

/** Le plan du sol sous la clairière : le bord de l'alpage, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-8, 8], [-8, 8]);

/** Le sol d'aiguilles de la clairière : son rayon. */
const CLEARING = { r: 6.4 } as const;

/** Les six colonnes : leur rayon, leurs caps, leur hauteur, leur fût ; les deux qui tombent dans la ruine, et où elles gisent. */
const COLUMNS = {
  r: 3.2,
  caps: [30, 90, 150, 210, 270, 330] as const,
  h: 2.5,
  shaft: 0.26,
  fallen: [
    { cap: 30, lie: 345 },
    { cap: 90, lie: 150 },
  ] as const,
} as const;

/** Le banc de pierre en rond, ses six tronçons ; la table ronde au milieu. */
const BENCH = { r0: 1.5, r1: 1.95, h: 0.45, segments: 6 } as const;
const TABLE = { r: 0.6, h: 0.75 } as const;

/** La fontaine, à côté de la colonnade, au sud-ouest : son bassin, son pilier. */
const FOUNTAIN = { at: onCircle(5.0, 215), r: 0.95, h: 0.5 } as const;

/** Les pins autour de la clairière : place (rayon, cap), hauteur ; une trouée à l'est (la porte, la scénette) et à l'ouest (la rive). */
const PINES = [
  { r: 9.0, cap: 0, h: 6.2 },
  { r: 8.6, cap: 22, h: 5.4 },
  { r: 9.4, cap: 145, h: 6.4 },
  { r: 8.6, cap: 160, h: 5.2 },
  { r: 9.2, cap: 186, h: 6.0 },
  { r: 9.6, cap: 238, h: 5.6 },
  { r: 8.8, cap: 254, h: 6.3 },
  { r: 9.2, cap: 330, h: 5.9 },
  { r: 8.6, cap: 348, h: 5.3 },
] as const;

/** La lanterne de la traductrice, sur son poteau, à l'entrée nord-est de la clairière, à droite de la porte (toujours là). */
const ENTRY_LANTERN = { x: 5.4, z: -6.6, h: 1.5 } as const;

/** La lanterne du chemin (les abords), à côté de la porte, hors du chemin. */
const PATH_LANTERN = { x: 9.6, z: -3.0, h: 1.4 } as const;

/** L'herbe sèche de la ruine, au bord est de la clairière, du côté de la porte. */
const DRY = [
  { x: 4.6, z: -1.4, s: 0.9 },
  { x: 3.0, z: -4.6, s: 1 },
  { x: -1.6, z: 5.6, s: 0.8 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 7) : à l'ouest (270°), le soleil dans le dos ; la colonnade à gauche de Kéo, jamais
 * derrière lui (relecture du Versant, (b) 1) ; entre les troncs, la rive et la mer de nuages.
 */
const DOOR_VIEW = capOf(270);

/** La vue d'arrivée basse, à hauteur de Kéo, un peu reculée. */
const DOOR_FRAME = { height: -2.2, back: 1.5 } as const;

/** Le point du nom sur la Carte, au-dessus de la colonnade, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return planeY(0, 0) + COLUMNS.h + 2.4;
  },
  z: 0,
};

// ---------- Les volumes ----------

/** Le cap d'un point (en degrés) en lacet d'un repère dont le nord local regarde ce cap. */
const yawOf = (deg: number): number => (-deg * Math.PI) / 180;

/** Le sol de la clairière, au milieu. */
const floor = once(() => planeY(0, 0));

/** Une colonne debout : sa base carrée, son fût lisse à huit pans, son chapiteau carré et nu. */
function column(l: FacetBuilder): void {
  const H = COLUMNS.h;
  l.box({ x: 0, y: SINK_3E, z: 0 }, [0.72, 0.22 - SINK_3E, 0.72], C3E.stoneShade, C3E.stone);
  l.prism({ x: 0, y: 0.2, z: 0, yaw: Math.PI / 8 }, COLUMNS.shaft + 0.02, COLUMNS.shaft - 0.02, H - 0.42, 8, C3E.stone, C3E.stone);
  l.box({ x: 0, y: H - 0.24, z: 0 }, [0.7, 0.24, 0.7], C3E.stoneShade, C3E.stone);
}

/** Une colonne debout à son cap. */
function columnAt(b: FacetBuilder, deg: number): void {
  const p = onCircle(COLUMNS.r, deg);
  drawPosed(b, { x: p.x, y: planeY(p.x, p.z), z: p.z, yaw: yawOf(deg) }, column);
}

/** Une colonne couchée hors du chemin (la ruine) : son pied au sien, son fût vers `lie`, en deux tronçons. */
function columnFallen(b: FacetBuilder, deg: number, lie: number): void {
  const p = onCircle(COLUMNS.r, deg);
  const y = planeY(p.x, p.z);
  b.box({ x: p.x, y: y + SINK_3E, z: p.z, yaw: yawOf(deg) }, [0.72, 0.22 - SINK_3E, 0.72], C3E.stoneShade, C3E.stone);
  for (const [from, len] of [
    [0.5, 1.1],
    [1.75, 1.0],
  ] as const) {
    const q = onCircle(from + len / 2, lie, p);
    drawPosed(b, { x: q.x, y: planeY(q.x, q.z) + COLUMNS.shaft - 0.06, z: q.z, yaw: yawOf(lie) }, (l) =>
      l.prism({ x: 0, y: 0, z: -len / 2, pitch: Math.PI / 2 }, COLUMNS.shaft, COLUMNS.shaft, len, 8, C3E.stoneShade, C3E.stone),
    );
  }
}

/** Le linteau entre deux colonnes voisines (de `a` à `c`, leurs caps), posé sur leurs chapiteaux. */
function lintel(b: FacetBuilder, a: number, c: number): void {
  const p = onCircle(COLUMNS.r, a),
    q = onCircle(COLUMNS.r, c);
  const m = { x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 };
  const len = Math.hypot(q.x - p.x, q.z - p.z) + 0.6;
  b.box({ x: m.x, y: floor() + COLUMNS.h, z: m.z, yaw: Math.atan2(-(q.z - p.z), q.x - p.x) }, [len, 0.32, 0.46], C3E.stoneShade, C3E.stone);
}

/** Les linteaux entre colonnes voisines, sauf ceux qu'on saute. */
function lintels(b: FacetBuilder, keep: (a: number, c: number) => boolean): void {
  const caps = COLUMNS.caps;
  for (let k = 0; k < caps.length; k++) {
    const a = caps[k],
      c = caps[(k + 1) % caps.length];
    if (keep(a, c)) lintel(b, a, c);
  }
}

const isFallen = (deg: number): boolean => COLUMNS.fallen.some((f) => f.cap === deg);

/** Un tronçon du banc rond, droit ou de travers (la ruine). */
function benchSegment(b: FacetBuilder, k: number, tilt = 0, drop = 0): void {
  const step = 360 / BENCH.segments;
  const mid = step * (k + 0.5);
  const p = onCircle((BENCH.r0 + BENCH.r1) / 2, mid);
  const len = 2 * BENCH.r1 * Math.sin((step * Math.PI) / 360) - 0.06;
  b.box({ x: p.x, y: floor() + SINK_3E - drop, z: p.z, yaw: yawOf(mid) + tilt * 0.5, pitch: tilt }, [len, BENCH.h - SINK_3E, BENCH.r1 - BENCH.r0], C3E.stoneShade, C3E.stone);
}

/** La table ronde, debout sur son pied, ou renversée sur le flanc (la ruine). */
function table(b: FacetBuilder, up: boolean): void {
  const y = floor();
  const draw = (l: FacetBuilder) => {
    l.prism({ x: 0, y: -0.1, z: 0 }, 0.18, 0.15, TABLE.h, 6, C3E.stoneShade, C3E.stone);
    l.prism({ x: 0, y: TABLE.h - 0.08, z: 0 }, TABLE.r, TABLE.r, 0.1, 10, C3E.stoneShade, C3E.stone);
  };
  if (up) drawPosed(b, { x: 0, y, z: 0, yaw: 0 }, draw);
  else drawPosed(b, { x: 0.3, y: y + TABLE.r - 0.05, z: -0.2, yaw: 0.6, pitch: Math.PI / 2 }, draw);
}

/** Le bassin de la fontaine et son pilier au bec de fer, toujours là ; dedans, l'eau sombre (pleine) ou rien (sèche). */
function fountainBasin(b: FacetBuilder): void {
  const F = FOUNTAIN;
  const y = planeY(F.at.x, F.at.z);
  b.annulus({ x: F.at.x, y: y - 0.2, z: F.at.z }, F.r - 0.16, F.r, F.h + 0.2, 10, C3E.graniteShade, C3E.graniteSun);
  const pillar = onCircle(F.r - 0.05, 215, F.at);
  b.box({ x: pillar.x, y: y - 0.2, z: pillar.z, yaw: yawOf(215) }, [0.34, 1.3, 0.34], C3E.graniteShade, C3E.granite);
  const spout = onCircle(F.r - 0.38, 215, F.at);
  b.beam({ x: pillar.x, y: y + 0.95, z: pillar.z }, { x: spout.x, y: y + 0.88, z: spout.z }, 0.06, C3E.iron);
}

function fountainInside(b: FacetBuilder, full: boolean): void {
  const F = FOUNTAIN;
  const y = planeY(F.at.x, F.at.z);
  b.prism({ x: F.at.x, y: y - 0.2, z: F.at.z }, F.r - 0.16, F.r - 0.16, (full ? F.h - 0.1 : 0.12) + 0.2, 10, full ? C.water : C3E.dry, full ? C.water : C3E.dryShade);
}

/** Un pin en cônes facettés sur son tronc, posé au sol ; de taille `h`. */
function pine(b: FacetBuilder, at: { x: number; z: number }, h: number): void {
  const y = planeY(at.x, at.z);
  const r = h * 0.26;
  b.prism({ x: at.x, y: y - 0.3, z: at.z }, 0.2, 0.16, 1.2, 5, C.trunk);
  b.prism({ x: at.x, y: y + 0.8, z: at.z, yaw: at.x }, r, r * 0.35, h * 0.5, 7, C.pineShade, C.pine);
  b.prism({ x: at.x, y: y + 0.8 + h * 0.42, z: at.z, yaw: at.z }, r * 0.72, 0, h * 0.58 - 0.8, 7, C.pine, C.pine);
}

/** Le dallage de la clairière, dans le cercle des colonnes, autour du banc. */
function paving(b: FacetBuilder): void {
  b.annulus({ x: 0, y: floor() - 0.04, z: 0 }, BENCH.r1 + 0.1, COLUMNS.r + 0.6, 0.08, 12, C3E.stoneShade, C3E.stone);
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le sol d'aiguilles, les pins, tous debout ; les quatre colonnes debout et les linteaux qui les relient
  // encore ; le bassin de la fontaine ; la lanterne de la traductrice, sur son poteau à l'entrée, la seule allumée.
  add('ruine', 0, (b) => {
    b.prism({ x: 0, y: floor() - 0.08, z: 0, yaw: 0.2 }, CLEARING.r, CLEARING.r, 0.1, 12, C.needles);
    for (const p of PINES) pine(b, onCircle(p.r, p.cap), p.h);
    for (const deg of COLUMNS.caps) if (!isFallen(deg)) columnAt(b, deg);
    lintels(b, (a, c) => !isFallen(a) && !isFallen(c));
    fountainBasin(b);
    const e = ENTRY_LANTERN;
    postLantern3e(b, e.x, planeY(e.x, e.z), e.z, e.h, true);
  });
  // Le corps relève les deux colonnes couchées et les deux linteaux à terre.
  add(
    'ruine',
    0,
    (b) => {
      for (const f of COLUMNS.fallen) columnFallen(b, f.cap, f.lie);
      for (const [deg, yaw] of [
        [60, 0.4],
        [120, -0.9],
      ] as const) {
        const p = onCircle(COLUMNS.r + 1.6, deg);
        b.box({ x: p.x, y: planeY(p.x, p.z) - 0.1, z: p.z, yaw, pitch: 0.12 }, [2.6, 0.32, 0.46], C3E.stoneShade, C3E.stone);
      }
    },
    corps,
  );
  // Le haut relève le banc fendu (un tronçon de travers, un autre enfoncé) et la table renversée.
  add(
    'ruine',
    0,
    (b) => {
      for (let k = 0; k < BENCH.segments; k++) benchSegment(b, k, k === 0 ? 0.22 : 0, k === 1 ? 0.18 : 0);
      table(b, false);
    },
    haut,
  );
  // Les abords relèvent la fontaine sèche et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) => {
      fountainInside(b, false);
      for (const d of DRY) dryTuft3e(b, d.x, planeY(d.x, d.z), d.z, d.s);
    },
    abords,
  );

  // ---- Le corps : les deux colonnes relevées, l'anneau de linteaux reposé.
  add(0, 0, (b) => {
    for (const f of COLUMNS.fallen) columnAt(b, f.cap);
    lintels(b, (a, c) => isFallen(a) || isFallen(c));
  });
  // ---- Le haut : le banc rond refait, sa table ; la lanterne de la colonnade, pendue au linteau de l'ouest.
  add(1, 0, (b) => {
    for (let k = 0; k < BENCH.segments; k++) benchSegment(b, k);
    table(b, true);
    const p = onCircle(COLUMNS.r * Math.cos(Math.PI / 6) - 0.05, 240);
    lantern3e(b, { x: p.x, y: floor() + COLUMNS.h, z: p.z }, true);
  });
  // ---- Les abords : la fontaine pleine, le dallage de la clairière, la lanterne du chemin.
  add(2, 0, (b) => {
    fountainInside(b, true);
    paving(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  lectern: onCircle(COLUMNS.r + 0.75, 330),
  case: onCircle((BENCH.r0 + BENCH.r1) / 2, 300),
  jug: onCircle(FOUNTAIN.r + 0.05, 160, FOUNTAIN.at),
} as const;

/** Rang 1 : un pupitre de bois fermé, au pied d'une colonne. */
function lectern(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.lectern;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z, yaw: yawOf(330) }, [0.14, 0.95, 0.14], C3E.woodShade);
    l.box({ x, y: y + 0.88, z, yaw: yawOf(330), pitch: 0.35 }, [0.62, 0.18, 0.46], C3E.woodShade, C3E.newWood);
  });
}

/** Rang 2 : un rouleau fermé dans son étui de cuir, couché sur le banc. */
function scrollCase(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.case;
    const y = floor() + BENCH.h;
    l.drum({ x: x - 0.3, y: y + 0.09, z, pitch: Math.PI / 2, yaw: Math.PI / 2 + yawOf(300) }, 0.09, 0.6, 8, C3E.leather, C3E.woodShade);
  });
}

/** Rang 3 (l'héritage) : une cruche à deux anses et deux coupes de terre basses, sur la margelle de la fontaine. */
function jug(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.jug;
    const y = planeY(FOUNTAIN.at.x, FOUNTAIN.at.z) + FOUNTAIN.h;
    l.prism({ x, y, z }, 0.09, 0.15, 0.2, 8, C.clay);
    l.prism({ x, y: y + 0.2, z }, 0.15, 0.06, 0.16, 8, C.clay);
    for (const s of [-1, 1]) {
      const q = onCircle(FOUNTAIN.r + 0.02, 160 + s * 18, FOUNTAIN.at);
      l.prism({ x: q.x, y, z: q.z }, 0.06, 0.13, 0.06, 8, C.clay);
    }
  });
}

/** Les trois traces, une par rang de mission, chacune avec sa partie : la même pour le latin et le grec. */
const RANKS = {
  first: { at: TRACE_SPOTS.lectern, lift: 1.2, stage: 0, row: 0, draw: lectern },
  second: { at: TRACE_SPOTS.case, lift: 1, stage: 1, row: 0, draw: scrollCase },
  heritage: { at: TRACE_SPOTS.jug, lift: 1, stage: 2, row: 0, draw: jug },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/** Les missions de chaque rang, en latin et en grec (aux rangs 1 et 2, l'Empire et le mythe, les provinces et le monde grec). */
export const ERMITAGE_RANKS = {
  first: ['la-empire', 'gr-myth-history'],
  second: ['la-provinces', 'gr-greek-world'],
  heritage: ['la-heritage', 'gr-heritage'],
} as const satisfies Record<keyof typeof RANKS, readonly [string, string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 7) : à l'ouest, entre deux colonnes, vers les pins. */
const SCENE_START = capOf(270);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la traductrice). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : à l'est de la colonnade, sur les aiguilles, hors du chemin. */
const SCENE_SPOT = { dx: 6.2, dz: 1.6, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la traductrice au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** Le rebord de pierre des pommes de pin : sa hauteur à l'échelle 1 ; une pomme choisie se soulève d'un cran. */
const LEDGE = { height: 0.45, lift: 0.3, cone: 0.3 } as const;

/** Une pomme de pin, toutes pareilles : deux cônes à sept pans, pointe en haut. */
function pineCone(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.08 * s, 0.13 * s, 0.12 * s, 7, C.cone, C.coneTop);
  b.prism({ x: at.x, y: at.y + 0.12 * s, z: at.z }, 0.13 * s, 0, 0.18 * s, 7, C.cone, C.coneTop);
}

export const ERMITAGE: PlaceArt = {
  role: 'La traductrice',
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
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x4f4339);
  },
  answer: {
    size: { height: LEDGE.height + LEDGE.lift + LEDGE.cone, half: 0.3 },
    facing: true,
    // Un rebord bas de pierre claire, comme un bout de banc, sous le rang des pommes de pin.
    base(b, mid, y, z, span, s, ground) {
      const top = y + LEDGE.height * s;
      const f = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: f, z }, [span + 0.7, top - f, 0.45 * s], C3E.stoneShade, C3E.stone);
    },
    // Une pomme de pin, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pineCone(b, { x: at.x, y: at.y + (LEDGE.height + (picked ? LEDGE.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: Object.fromEntries((Object.keys(ERMITAGE_RANKS) as (keyof typeof ERMITAGE_RANKS)[]).flatMap((rank) => ERMITAGE_RANKS[rank].map((m) => [m, RANKS[rank]]))),
  exit: { x: SITE.door.x - 0.6, z: SITE.door.z + 0.3 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de l'Ermitage, pour les tests. */
export const ERMITAGE_LAYOUT = {
  clearing: CLEARING,
  columns: COLUMNS,
  bench: BENCH,
  fountain: FOUNTAIN,
  pines: PINES,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
} as const;
