// La Porte (lot 2 du monde ouvert du 4e, GD-24 ; intention du directeur artistique du 21 octobre 2026, planche
// `selection-fabriques-v1`, rangée 2, validée par le mainteneur le même jour à 20 h 04) : « la grande porte de l'usine,
// ouverte à tous, et derrière elle la salle ronde où l'on décidait ensemble ». Le cœur, sans figure : les deux battants
// ouverts en grand, la cloche du conseil, les bancs en cercle. Le chemin des Fabriques passe par le portail : il arrive
// du sud-est (la Soute) à la porte du lieu, franchit le portail et repart au nord-ouest (la Forge) ; on entre librement.
// Le mur de l'usine, de brique, d'est en ouest, juste au nord de la porte du lieu, son chaperon de pierre (sans créneaux :
// la planche les montre, l'intention les retire) ; le portail, deux piliers de pierre grise des Passeurs à assises, la
// poutre de bois en travers ; derrière lui, au nord-ouest, la salle ronde, basse, son toit conique sous les piliers (le
// dôme de la planche devient le toit de la proposition) ; au nord-est, les bancs en cercle sur la place ; dehors, à l'est
// du portail, l'auvent de la cloche.
// Le signe de l'absence du 4e : sur la face du battant ouest, un support de fer vide, deux goujons nus (le heurtoir de
// bronze est chez les Ferrailleurs). Avant comme après, jamais une étape.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Le mur debout à des hauteurs inégales, une brèche à
// l'ouest ; le pilier est écrêté, deux blocs à son pied ; la poutre couchée au pied du mur ; le battant ouest pend de
// travers, ouvert, l'est est couché à l'intérieur ; la salle ronde, son mur bas fendu, son toit tombé de travers à
// l'intérieur ; la cloche couchée sur le flanc sous son auvent ; trois bancs renversés. Aucun battant n'est jamais fermé,
// ni cadenas, ni serrure, ni verrou. Une seule lumière, la lanterne de l'avocate. Trois parties : le corps (le mur, les
// piliers et leur poutre, les battants ouverts en grand, le mur de la salle), le haut (le toit de la salle, la cloche
// remontée, la lanterne de la salle), les abords (la place pavée, les cinq bancs, la lanterne du chemin). Une trace par
// mission, avec sa partie. Jamais une balance, jamais le mot « loge » ; rien ne bouge. Le fer rouillé brun éteint, le fer
// restauré bruni sombre ; la pierre grise à assises (relecture de la Forge). Code pur (placeArt.ts).
import { drawPosed, FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { inWorld, lantern, localGround4e, slab } from './place4eKit';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs de la Porte : la pierre grise des Passeurs à assises (plus froide que celle du lot 1 : relecture de la
 * Forge), la brique de l'usine, le fer rouillé brun éteint de la ruine et le fer bruni restauré, le bois gris de la ruine
 * et le bois neuf, l'ardoise brune du toit de la salle, le pavé gris de la place, le cuir des seaux.
 */
const C = {
  stone: 0x8f8b88,
  stoneSun: 0xa29d98,
  stoneShade: 0x77736f,
  crack: 0x5a5452,
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  rust: 0x6a483e,
  rustTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  roof: 0x6a5f5a,
  hollow: 0x4f4744,
  paving: 0x9c968f,
  joint: 0x77716b,
  leather: 0x7a5a44,
  leatherTop: 0x5e463a,
  // Les planchettes des réponses : un bois clair, sans rien d'écrit.
  answer: 0xc8ae8e,
  answerTop: 0xd4bc9c,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0x9c8452,
  // L'avocate, en pion (son modèle 3D prend sa place, ./habitants.ts) : chaussures, robe sombre, rabat clair.
  shoes: 0x4f4a48,
  robe: 0x4e4a5a,
  collar: 0xdcd6cc,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'porte')!.center;
const H0 = standingHeight(heightAt4e(CENTER));

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

/** Le pas de la porte du lieu, depuis le centre. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_4E.find((p) => p.id === 'porte')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

// ---------- Le plan ----------

/** Le mur de l'usine : son axe (en `z`), son épaisseur, sa hauteur ; ses deux pans, de part et d'autre du portail. */
const WALL = { z: 7, t: 0.7, h: 2.8, west: [-13, -4.1] as const, east: [2.9, 12] as const } as const;

/**
 * Le portail : le milieu du passage, sa demi-largeur (4 de passage), les piliers (leur côté, leur hauteur), la poutre (sa
 * hauteur) ; les battants (leur largeur, leur hauteur, leur épaisseur), ouverts en grand vers l'intérieur.
 */
const GATE = { x: -0.6, half: 2.0, pillar: 1.5, h: 7, beam: 5.4, leaf: { w: 2.0, h: 4.4, t: 0.16, open: 1.2, ruinOpen: 0.75 } } as const;
const PILLARS = [GATE.x - GATE.half - GATE.pillar / 2, GATE.x + GATE.half + GATE.pillar / 2] as const;
/** Les gonds des battants : au coin intérieur (nord) de chaque pilier. */
const HINGES = [
  { x: GATE.x - GATE.half, z: WALL.z - WALL.t / 2 },
  { x: GATE.x + GATE.half, z: WALL.z - WALL.t / 2 },
] as const;

/**
 * La salle ronde, au nord-ouest : son centre, son rayon, son mur (épaisseur, hauteur), ses pans ; son toit : sa pente
 * (30°), son débord sur le mur, la hauteur de sa rive, et le collier de fer bruni à sa pointe (rayon, hauteur). Un toit
 * de salle d'usine, bas et large, et non le cône raide sans débord d'une case (directeur artistique, relecture des
 * Fabriques, point 3) ; sa pointe reste sous la poutre des piliers.
 */
const HALL = {
  x: -3.2,
  z: -7.0,
  r: 3.4,
  t: 0.4,
  h: 2.4,
  sides: 10,
  pitch: (30 * Math.PI) / 180,
  eave: 0.85,
  fascia: 0.2,
  collar: { r: 0.42, h: 0.34 },
} as const;

/** Le haut du toit de la salle : le dessus de son collier (près de 4,9, sous la poutre des piliers, à 5,4). */
const HALL_APEX = HALL.h + (HALL.r + HALL.eave - HALL.collar.r) * Math.tan(HALL.pitch) - 0.05 + HALL.collar.h;

/** Les bancs en cercle, au nord-est du portail : le centre du cercle, son rayon, le cap de chacun (depuis l'est, vers le sud). */
const BENCHES = { x: 5.0, z: -1.0, r: 3.3, at: [-1.55, -0.45, 0.65, 1.45, 2.95] as const, ruin: [-0.45, 1.45, 2.95] as const } as const;

/** La baie de la salle : tournée vers les bancs. */
const HALL_DOOR = Math.atan2(BENCHES.z - HALL.z, BENCHES.x - HALL.x);

/** L'auvent de la cloche, dehors, contre le mur à l'est du portail : ses bords, sa hauteur au mur et aux poteaux. */
const AWNING = { x0: 3.9, x1: 6.9, z0: WALL.z + WALL.t / 2, z1: 9.1, high: 2.8, low: 2.3 } as const;
const BELL = { x: 6.05, z: 8.4 } as const;

/** La place pavée (les abords) : du portail aux bancs, à l'est du chemin ; ses coins, dans l'ordre du dessus d'un pavé. */
const PAVING: readonly Vec2[] = [
  { x: -1.6, z: -4.8 },
  { x: 0.2, z: WALL.z - WALL.t / 2 - 0.05 },
  { x: 9.8, z: WALL.z - WALL.t / 2 - 0.05 },
  { x: 9.8, z: -4.8 },
];
/** Le dessus de la place, au-dessus du sol plus haut qu'elle. */
const PAVING_TOP = (() => {
  let hi = -Infinity;
  for (let x = -1.6; x <= 9.8; x += 0.5) for (let z = -4.8; z <= 6.3; z += 0.5) hi = Math.max(hi, localGround(x, z));
  return hi + 0.04;
})();

/** La lanterne de l'avocate (au pilier est, côté chemin), celle de la salle, celle du chemin. */
const KEEPER_LANTERN = { x: PILLARS[1], z: WALL.z + GATE.pillar / 2 + 0.4, y: 3.0 } as const;
const PATH_LANTERN = { x: -2.8, z: 9.9, h: 1.35 } as const;

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » : de la porte, au nord-nord-ouest, dans l'axe du chemin qui passe le portail ; la
 * salle ronde au-delà ; à gauche, le fourneau de la Forge et le cône du volcan. Elle regarde vers −(sin cap, cos cap).
 */
const DOOR_LOOK: Vec2 = { x: -6.0, z: -6.5 };
const DOOR_VIEW = Math.atan2(DOOR_AT.x - DOOR_LOOK.x, DOOR_AT.z - DOOR_LOOK.z);

/** La vue d'arrivée, à hauteur de Kéo (correction du mainteneur) : 3 plus bas que la caméra qui suit, un peu reculée. */
const DOOR_FRAME = { height: -3, back: 1.2 } as const;

/** Le point du nom sur la Carte : au-dessus du portail. */
const MAP_POINT: Vec3 = { x: GATE.x, y: GATE.h + 1.5, z: WALL.z };

// ---------- Les petits volumes ----------

/** Un pan du mur de l'usine, de `x0` à `x1`, à la hauteur `h` ; son chaperon de pierre grise s'il est entier. */
function wall(b: FacetBuilder, x0: number, x1: number, h: number, coping: boolean): void {
  b.box({ x: (x0 + x1) / 2, y: SINK, z: WALL.z }, [x1 - x0, h - SINK, WALL.t], C.brickShade, C.brick);
  if (coping) b.box({ x: (x0 + x1) / 2, y: h, z: WALL.z }, [x1 - x0 + 0.1, 0.22, WALL.t + 0.2], C.stoneShade, C.stoneSun);
}

/**
 * Un pilier de pierre grise des Passeurs, à assises (relecture de la Forge) : son socle, trois assises en retrait l'une
 * sur l'autre, leurs faces d'un ton alterné, jusqu'à `top` ; puis, s'il est entier, son chapiteau et sa pointe.
 */
function pillar(b: FacetBuilder, x: number, top: number): void {
  const P = GATE.pillar;
  b.box({ x, y: SINK, z: WALL.z }, [P + 0.3, 1.1 - SINK, P + 0.3], C.stoneShade, C.stoneSun);
  const courses: [number, number, number, number][] = [
    [1.1, 2.7, P, C.stone],
    [2.7, 4.3, P - 0.1, C.stoneShade],
    [4.3, 6.0, P, C.stone],
  ];
  for (const [y0, y1, w, col] of courses) {
    if (y0 >= top) break;
    b.box({ x, y: y0, z: WALL.z }, [w, Math.min(y1, top) - y0, w], col, C.stoneSun);
  }
  if (top < GATE.h) return;
  b.box({ x, y: 6.0, z: WALL.z }, [P + 0.3, 0.45, P + 0.3], C.stoneShade, C.stoneSun);
  b.prism({ x, y: 6.45, z: WALL.z, yaw: Math.PI / 4 }, ((P + 0.3) / 2) * Math.SQRT2, 0, GATE.h - 6.45, 4, C.stoneSun);
}

/**
 * Un battant de bois, dans son repère (le gond en 0, le battant le long de `−z`, sa face extérieure, celle qui regardait
 * la route fermé, du côté `side`) : ses planches, ses deux pentures de fer ; `knocker` : le support vide et ses deux
 * goujons nus, à mi-hauteur, sur sa face extérieure (le signe de l'absence).
 */
function leaf(l: FacetBuilder, side: 1 | -1, knocker: boolean, iron: number): void {
  const L = GATE.leaf;
  l.box({ x: (side * L.t) / 2, y: 0, z: -L.w / 2 }, [L.t, L.h, L.w], C.newShade, C.newWood);
  for (const y of [0.7, L.h - 0.9]) l.box({ x: side * (L.t + 0.02), y, z: -L.w / 2 + 0.05 }, [0.04, 0.16, L.w - 0.2], iron);
  if (!knocker) return;
  l.box({ x: side * (L.t + 0.04), y: 2.0, z: -L.w * 0.62 }, [0.08, 0.46, 0.46], C.rust, C.rustTop);
  for (const dz of [-0.12, 0.12]) l.box({ x: side * (L.t + 0.18), y: 2.19, z: -L.w * 0.62 + dz }, [0.26, 0.08, 0.08], C.ironTop);
}

/** Un battant ouvert, posé à son gond (`yaw` 0 : à angle droit du mur, vers le nord ; positif, vers l'ouest). */
function hungLeaf(b: FacetBuilder, i: 0 | 1, yaw: number, droop: number, knocker: boolean, iron: number): void {
  const h = HINGES[i];
  drawPosed(b, { x: h.x, y: localGround(h.x, h.z) + 0.05, z: h.z, yaw, pitch: droop }, (l) => leaf(l, i === 0 ? 1 : -1, knocker, iron));
}

/**
 * Le toit de la salle ronde : sa rive (un bandeau debout au bout du débord) et son dessous, du mur au bord ; le cône à
 * 30°, coupé sous la pointe ; le collier de fer bruni qui le coiffe.
 */
function hallRoof(b: FacetBuilder): void {
  const yaw = HALL_DOOR - Math.PI / HALL.sides;
  const R = HALL.r + HALL.eave;
  const foot = HALL.h - HALL.fascia;
  const slope = Math.tan(HALL.pitch);
  const at = (y: number) => ({ x: HALL.x, y, z: HALL.z, yaw });
  b.prism(at(foot - 0.02), HALL.r - 0.05, R, 0.02, HALL.sides, C.woodShade);
  b.band(at(foot), R, HALL.fascia, HALL.sides, C.woodShade);
  b.prism(at(HALL.h), R, HALL.collar.r, (R - HALL.collar.r) * slope, HALL.sides, C.roof);
  const top = HALL.h + (R - HALL.collar.r) * slope;
  b.prism(at(top - 0.05), HALL.collar.r + 0.04, HALL.collar.r - 0.08, HALL.collar.h, HALL.sides, C.iron, C.ironTop);
}

/** Un coin du mur de la salle ronde : le pan `k`, au rayon `r`, à la hauteur `y`. */
function hallCorner(k: number, r: number, y: number): P3 {
  const a = HALL_DOOR - Math.PI / HALL.sides + (2 * Math.PI * k) / HALL.sides;
  return [HALL.x + r * Math.cos(a), y, HALL.z + r * Math.sin(a)];
}

/**
 * Le mur de la salle ronde, pan par pan (le pan 0, face aux bancs, est la baie), à la hauteur de chaque pan
 * (`heights[k]`) : son parement, son revers, son dessus ; restauré, le linteau de la baie.
 */
function hallWall(b: FacetBuilder, heights: readonly number[], lintel: boolean): void {
  const n = HALL.sides;
  const ri = HALL.r - HALL.t;
  for (let k = 1; k < n; k++) {
    const h = heights[k];
    const m = k + 1;
    const o0 = hallCorner(k, HALL.r, SINK),
      o1 = hallCorner(m, HALL.r, SINK);
    const i0 = hallCorner(k, ri, SINK),
      i1 = hallCorner(m, ri, SINK);
    const up = (p: P3): P3 => [p[0], h, p[2]];
    b.quad(o1, o0, up(o0), up(o1), C.brick);
    b.quad(i0, i1, up(i1), up(i0), C.brickShade);
    b.quad(up(o0), up(i0), up(i1), up(o1), C.stoneSun);
  }
  if (!lintel) return;
  const p0 = hallCorner(0, HALL.r - HALL.t / 2, 0),
    p1 = hallCorner(1, HALL.r - HALL.t / 2, 0);
  const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
  b.box({ x: (p0[0] + p1[0]) / 2, y: 1.95, z: (p0[2] + p1[2]) / 2, yaw: -Math.atan2(p1[2] - p0[2], p1[0] - p0[0]) }, [len + 0.2, HALL.h - 1.95, HALL.t + 0.04], C.stoneShade, C.stoneSun);
}

/** Un banc de bois, son assise tangente au cercle au cap `a` ; renversé (`upset`), couché à côté de sa place, pieds en l'air. */
function bench(b: FacetBuilder, a: number, upset: boolean): void {
  const r = BENCHES.r + (upset ? 0.4 : 0);
  const x = BENCHES.x + r * Math.cos(a),
    z = BENCHES.z + r * Math.sin(a);
  const yaw = -a - Math.PI / 2 + (upset ? 0.3 : 0);
  const g = localGround(x, z);
  const wood = upset ? C.wood : C.newWood,
    shade = upset ? C.woodShade : C.newShade;
  drawPosed(b, { x, y: upset ? g : Math.max(g, PAVING_TOP), z, yaw }, (l) => {
    if (upset) {
      l.box({ x: 0, y: -0.04, z: 0 }, [1.8, 0.12, 0.42], shade, wood);
      for (const s of [-1, 1]) l.box({ x: s * 0.7, y: 0.08, z: 0 }, [0.12, 0.42, 0.38], shade, wood);
      return;
    }
    l.box({ x: 0, y: 0.38, z: 0 }, [1.8, 0.1, 0.42], shade, wood);
    for (const s of [-1, 1]) l.box({ x: s * 0.7, y: -0.1, z: 0 }, [0.12, 0.48, 0.38], shade, wood);
  });
}

/** La cloche du conseil, de fer : pendue sous l'auvent (restaurée, fer bruni), ou couchée sur le flanc (rouillée). */
function bell(b: FacetBuilder, hung: boolean): void {
  if (hung) {
    const y = localGround(BELL.x, BELL.z) + 1.35;
    b.prism({ x: BELL.x, y, z: BELL.z }, 0.42, 0.2, 0.62, 8, C.iron, C.ironTop);
    // La corde de fer, du haut de la cloche au-dessous du toit de l'auvent (vers 2,5 à son aplomb).
    b.box({ x: BELL.x, y: y + 0.62, z: BELL.z }, [0.08, 2.5 - (y + 0.62), 0.08], C.iron);
    return;
  }
  const x = BELL.x + 0.2,
    z = BELL.z + 0.3;
  drawPosed(b, { x, y: localGround(x, z) + 0.36, z, yaw: 0.6, pitch: Math.PI / 2 - 0.25 }, (l) => l.prism({ x: 0, y: -0.3, z: 0 }, 0.42, 0.2, 0.62, 8, C.rust, C.rustTop));
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const corps = { stage: 0 as const, row: 0 };
  const abords = { stage: 2 as const, row: 0 };

  // Toujours là : le pilier ouest, entier ; l'auvent de la cloche ; la lanterne de l'avocate, au pilier est, la seule
  // allumée de la ruine.
  add('ruine', 0, (b) => {
    pillar(b, PILLARS[0], GATE.h);
    const A = AWNING;
    for (const x of [A.x0 + 0.25, A.x1 - 0.25]) b.box({ x, y: SINK, z: A.z1 - 0.2 }, [0.22, A.low - SINK, 0.22], C.woodShade, C.wood);
    b.box({ x: (A.x0 + A.x1) / 2, y: A.low - 0.25, z: A.z1 - 0.2 }, [A.x1 - A.x0, 0.2, 0.2], C.woodShade, C.wood);
    slab(b, [[A.x0 - 0.2, A.high + 0.1, A.z0], [A.x0 - 0.2, A.low + 0.05, A.z1 + 0.3], [A.x1 + 0.2, A.low + 0.05, A.z1 + 0.3], [A.x1 + 0.2, A.high + 0.1, A.z0]], 0.1, C.woodShade, C.wood);
    const L = KEEPER_LANTERN;
    b.box({ x: L.x, y: L.y + 0.05, z: L.z - 0.25 }, [0.08, 0.08, 0.6], C.iron);
    lantern(b, { x: L.x, y: L.y + 0.02, z: L.z }, true);
  });

  // ---- La ruine ----
  // Le corps la relève : le mur cassé, sa brèche ; le pilier est écrêté et deux blocs ; la poutre couchée ; le battant
  // ouest qui pend de travers (ouvert, son support vide), l'est couché à l'intérieur ; le mur de la salle, fendu, son toit
  // tombé de travers à l'intérieur.
  add(
    'ruine',
    0,
    (b) => {
      wall(b, WALL.west[0], -9.5, 1.4, false);
      wall(b, -9.5, WALL.west[1], 2.6, true);
      wall(b, WALL.east[0], 7.5, WALL.h, true);
      wall(b, 7.5, WALL.east[1], 1.9, false);
      pillar(b, PILLARS[1], 4.6);
      b.box({ x: PILLARS[1], y: 4.3, z: WALL.z, yaw: 0.25, pitch: 0.15 }, [1.3, 0.5, 1.3], C.stone, C.stoneSun);
      for (const [x, z, s, yaw] of [
        [3.3, 5.4, 0.75, 0.4],
        [2.6, 4.5, 0.6, 1.1],
      ] as const)
        b.box({ x, y: localGround(x, z) - 0.2, z, yaw, pitch: 0.1 }, [s, s * 0.7 + 0.2, s], C.stone, C.stoneSun);
      b.box({ x: -7.6, y: localGround(-7.6, 8.4) - 0.05, z: 8.4, yaw: 0.12 }, [5.6, 0.42, 0.5], C.woodShade, C.wood);
      hungLeaf(b, 0, GATE.leaf.ruinOpen, -0.1, true, C.rust);
      const fallen = { x: 3.2, z: 3.0 };
      drawPosed(b, { x: fallen.x, y: localGround(fallen.x, fallen.z) + 0.08, z: fallen.z, yaw: 1.3, pitch: -Math.PI / 2 }, (l) =>
        l.box({ x: 0, y: -GATE.leaf.h / 2, z: 0 }, [GATE.leaf.w, GATE.leaf.h, GATE.leaf.t], C.woodShade, C.wood),
      );
      hallWall(b, [0, 1.1, 1.8, 2.2, 1.4, 0.9, 1.6, 2.0, 1.2, 1.7], false);
      const c = hallCorner(3, HALL.r + 0.01, 0);
      const c2 = hallCorner(4, HALL.r + 0.01, 0);
      const t = (p: P3, q: P3, s: number): [number, number] => [p[0] + (q[0] - p[0]) * s, p[2] + (q[2] - p[2]) * s];
      const [ax, az] = t(c, c2, 0.45),
        [bx, bz] = t(c, c2, 0.58);
      b.quad([bx, 0.2, bz], [ax, 0.2, az], [ax - (bx - ax) * 0.6, 1.4, az - (bz - az) * 0.6], [bx + (bx - ax) * 0.6, 1.4, bz + (bz - az) * 0.6], C.crack);
      b.prism({ x: HALL.x + 0.4, y: 0.2, z: HALL.z - 0.3, yaw: 0.4, pitch: 0.55 }, HALL.r - 0.4, 0, 2.0, HALL.sides, C.roof);
    },
    corps,
  );
  // Les abords la relèvent : trois bancs renversés dans le cercle.
  add(
    'ruine',
    0,
    (b) => {
      for (const a of BENCHES.ruin) bench(b, a, true);
    },
    abords,
  );
  // La cloche tombée, couchée sur le flanc, part avec le haut.
  add('ruine', 0, (b) => bell(b, false), { stage: 1, row: 0 });

  // ---- Le corps : le mur et son chaperon ; le pilier est, entier, et la poutre ; les deux battants ouverts en grand ;
  // le mur de la salle ronde refermé, le linteau de sa baie.
  add(0, 0, (b) => {
    wall(b, WALL.west[0], WALL.west[1], WALL.h, true);
    wall(b, WALL.east[0], WALL.east[1], WALL.h, true);
    pillar(b, PILLARS[1], GATE.h);
    b.box({ x: GATE.x, y: GATE.beam, z: WALL.z }, [PILLARS[1] - PILLARS[0] + 0.4, 0.45, 0.55], C.newShade, C.newWood);
    hungLeaf(b, 0, GATE.leaf.open, 0, true, C.iron);
    hungLeaf(b, 1, -GATE.leaf.open, 0, false, C.iron);
    hallWall(b, Array.from({ length: HALL.sides }, () => HALL.h), true);
  });
  // ---- Le haut : le toit conique de la salle (sous les piliers) ; la cloche remontée sous son auvent ; la lanterne de
  // la salle, à côté de sa baie, allumée dès qu'elle est posée (jamais à une réussite).
  add(1, 0, (b) => {
    hallRoof(b);
    bell(b, true);
    const a = HALL_DOOR + 0.55;
    const x = HALL.x + (HALL.r + 0.2) * Math.cos(a),
      z = HALL.z + (HALL.r + 0.2) * Math.sin(a);
    lantern(b, { x, y: 2.15, z }, true);
  });
  // ---- Les abords : la place pavée et ses joints ; les cinq bancs en cercle ; la lanterne du chemin.
  add(2, 0, (b) => {
    slab(b, PAVING.map((p) => [p.x, PAVING_TOP, p.z] as const), 0.5, C.stoneShade, C.paving);
    const [w0, w1] = PAVING;
    for (const z of [3.2, 0.2, -2.6]) {
      // Du bord ouest de la place (qui suit le chemin, en biais) au bord est.
      const x0 = w0.x + ((w1.x - w0.x) * (z - w0.z)) / (w1.z - w0.z) + 0.3;
      const y = PAVING_TOP + 0.01;
      b.quad([x0, y, z - 0.04], [x0, y, z + 0.04], [9.5, y, z + 0.04], [9.5, y, z - 0.04], C.joint);
    }
    for (const a of BENCHES.at) bench(b, a, false);
    const P = PATH_LANTERN;
    const g = localGround(P.x, P.z);
    b.box({ x: P.x, y: g - 0.3, z: P.z }, [0.12, P.h + 0.3, 0.12], C.iron);
    lantern(b, { x: P.x, y: g + P.h + 0.02, z: P.z }, true, 0.85);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu ; aucune sur le chemin. */
const TRACE_SPOTS = {
  freedoms: { x: -6.4, z: 8.9 },
  justice: { x: 0.9, z: -3.7 },
  'security-defence': { x: 4.75, z: AWNING.z1 - 0.2 },
} as const;

/** Une petite estrade de bois à une marche, devant le mur, à l'ouest du portail (Les libertés). */
function dais(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.freedoms;
    const g = localGround(x, z);
    l.box({ x, y: g - 0.2, z }, [2.2, 0.55, 1.4], C.newShade, C.newWood);
    l.box({ x, y: g - 0.2, z: z + 0.95 }, [1.6, 0.38, 0.5], C.newShade, C.newWood);
  });
}

/**
 * La barre : une rampe de bois basse, quatre balustres, devant les bancs, face à la baie de la salle (L'État de droit et
 * la justice ; jamais une balance : correction 1 du directeur artistique).
 */
function bar(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.justice;
    const g = Math.max(localGround(x, z), PAVING_TOP);
    const yaw = -HALL_DOOR - Math.PI / 2;
    drawPosed(l, { x, y: g, z, yaw }, (q) => {
      q.box({ x: 0, y: 0.82, z: 0 }, [2.2, 0.12, 0.16], C.newShade, C.newWood);
      for (const s of [-1, 1]) q.box({ x: s * 1.05, y: -0.1, z: 0 }, [0.16, 0.92, 0.16], C.newShade, C.newWood);
      for (const dx of [-0.48, -0.16, 0.16, 0.48]) q.box({ x: dx, y: 0.05, z: 0 }, [0.09, 0.77, 0.09], C.newShade);
      q.box({ x: 0, y: 0.05, z: 0 }, [2.1, 0.08, 0.12], C.newShade);
    });
  });
}

/** Trois seaux de cuir pendus côte à côte à un râtelier, sous l'auvent de la cloche (Sécurité et défense). */
function buckets(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS['security-defence'];
    const g = localGround(x, z);
    l.box({ x: x - 0.05, y: g + 1.75, z }, [1.4, 0.1, 0.1], C.iron);
    for (const dx of [-0.45, 0, 0.45]) {
      l.prism({ x: x + dx, y: g + 1.05, z }, 0.17, 0.21, 0.4, 6, C.leather, C.leatherTop);
      l.box({ x: x + dx, y: g + 1.45, z }, [0.03, 0.32, 0.03], C.iron);
    }
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : des objets du lieu, jamais la notion. */
const TRACES = {
  freedoms: { at: TRACE_SPOTS.freedoms, lift: 1, stage: 0, row: 0, draw: dais },
  justice: { at: TRACE_SPOTS.justice, lift: 1, stage: 1, row: 0, draw: bar },
  'security-defence': { at: TRACE_SPOTS['security-defence'], lift: 1, stage: 2, row: 0, draw: buckets },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le milieu de la scène : le centre du cercle des bancs. */
const SCENE_SPOT = { dx: BENCHES.x, dz: BENCHES.z, half: [2.2, 1.0] as [number, number] } as const;

/**
 * Le cap de départ de la caméra de la scénette (intention, § 6) : depuis le nord-est, vers le portail ouvert ; la salle
 * ronde à droite. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = Math.atan2(SCENE_SPOT.dx - GATE.x, SCENE_SPOT.dz - WALL.z);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'avocate). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** L'écart de Kéo et de l'avocate au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène (la place) au-dessus du plus haut du sol sous elle. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return PAVING_TOP - top;
})();

/** L'avocate en pion (son modèle 3D prend sa place) : chaussures, robe sombre, rabat clair. */
function lawyer(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.16, 6, C.shoes);
  b.prism({ x: at.x, y: at.y + 0.14, z: at.z }, 0.32, 0.25, 0.5, 8, C.robe);
  b.prism({ x: at.x, y: at.y + 0.64, z: at.z }, 0.25, 0.22, 0.34, 8, C.robe);
  b.box({ x: at.x, y: at.y + 0.72, z: at.z + 0.22 }, [0.12, 0.2, 0.04], C.collar);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.27, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.33, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.robe);
}

/** Le banc bas sous les planchettes : la hauteur de son assise ; le cran d'une planchette choisie ; une planchette. */
const BOARD = { height: 0.45, lift: 0.3, plank: { w: 0.46, h: 0.36, t: 0.08 } } as const;

export const PORTE: PlaceArt = {
  role: 'L’avocate',
  model,
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse (intention, § 6) : la place est plate, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la place, les bancs, le portail sont au lieu ; les abords (./porteSurroundings.ts) ajoutent deux
  // pierres et une pile de planches. Il reste l'avocate en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) lawyer(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.plank.h, half: BOARD.plank.w / 2 },
    facing: true,
    // Un banc bas sous la rangée des planchettes.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.42 * s], C.woodShade, C.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.14, top - 0.1 * s - foot, 0.38 * s], C.woodShade);
      }
    },
    // Une planchette de bois clair, debout sur le banc ; choisie, elle se soulève d'un cran (jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      const P = BOARD.plank;
      b.box({ x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, [P.w * s, P.h * s, P.t * s], C.answer, C.answerTop);
    },
  },
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, face au portail.
  exit: { x: DOOR_AT.x + 0.9, z: DOOR_AT.z + 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Porte, pour les tests et ses abords. */
export const PORTE_LAYOUT = {
  wall: WALL,
  gate: GATE,
  pillars: PILLARS,
  hinges: HINGES,
  hall: HALL,
  hallApex: HALL_APEX,
  benches: BENCHES,
  awning: AWNING,
  bell: BELL,
  paving: PAVING,
  pavingTop: PAVING_TOP,
  keeperLantern: KEEPER_LANTERN,
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorLook: DOOR_LOOK,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  heightAtCenter: H0,
  /** La pierre grise (ses abords en posent). */
  stone: { light: C.stone, shade: C.stoneShade, top: C.stoneSun },
  wood: { side: C.woodShade, top: C.wood },
} as const;
