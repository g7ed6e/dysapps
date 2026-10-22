// Le Gabarit (lot 3 du monde ouvert du 4e, le Bastion, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-bastion-v1` validée par le mainteneur le même jour, rangée 1) : « l'atelier des Passeurs sur la
// pointe : on y traçait chaque pièce en grand, sur un plancher, avant de la tailler, et la grue la soulevait ». Le premier
// lieu fini du Bastion, sur le gabarit de la Forge et de l'Étalon (./forge4e.ts, ./etalon4e.ts) : « forteresse » dit la
// masse, jamais la guerre (ni créneau, ni meurtrière, ni canon). L'atelier de pierre grise des Passeurs, 12 sur 9, son
// arcade de deux arches au sud, son étage de brique à petites fenêtres carrées, sa galerie de bois sur corbeaux ; la tour
// carrée à l'angle nord-est ; la grue, à l'est, au bord de la cour : un seul poteau carré plein, une flèche pleine d'un
// seul côté, au-dessus du plancher de traçage, le contrepoids au pied, le crochet immobile ; jamais une croix ni un
// treillis. Devant l'arcade, la balance à fléau ; au sud-est, le plancher de traçage et ses gabarits courbes ; contre le
// mur ouest, l'abri du géomètre. À droite de l'arcade, à hauteur d'homme, le signe de l'absence du 4e : la ferrure vide à
// deux chevilles nues (le grand compas de traçage, pris par les Ferrailleurs), la même avant et après, jamais une étape.
//
// La ruine, plus forte que la planche (intention, « La ruine ») : le rez-de-chaussée debout, l'arcade de droite à moitié
// tombée, son arc ouvert en biais ; l'étage de brique à moitié tombé, ses fenêtres vides ; les corbeaux nus et une poutre
// de la galerie couchée au pied ; plus de toit ; la tour écrêtée en biais, deux blocs à son pied ; la grue debout, entière,
// un tronçon de flèche en haut, le reste couché en travers du haut des murs ; la balance, son pied debout, le fléau dans
// l'herbe, les plateaux à plat ; le plancher disjoint, un coin affaissé, deux gabarits couchés. Une seule lumière, la
// lanterne de l'abri. Cinq parties (3 + 1 + 1) : le corps en trois (le rez-de-chaussée et la balance ; l'étage et la
// galerie ; la tour), le haut (les toits de terre cuite, la flèche de la grue, la lanterne de l'angle), les abords (le
// plancher, la cour, le muret, la lanterne du chemin). Une trace par mission, avec sa partie. Rien à lire, rien de croisé,
// rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { groundPlane4e, inWorld, lantern, localGround4e, once, quadOut, sheet, wallRun } from './place4eKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs du Gabarit : la pierre grise des Passeurs à grandes facettes, la brique de l'étage, la terre cuite des
 * toits (au seul Gabarit), le fer de la ruine d'un brun éteint (jamais la rouille claire, qui se lit orange au soleil bas),
 * le fer restauré bruni sombre ; le bois gris de la ruine et de la grue, le bois neuf brun ; l'ombre des fenêtres vides ;
 * la fonte du plomb ; le dallage de la cour et ses joints ; le cordeau et la corde, d'un chanvre uni.
 */
const C = {
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  tile: COLORS_4E.terracotta,
  tileUnder: 0x9a5a40,
  rustDull: 0x6a483e,
  rustDullTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  window: 0x4e3a34,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  hemp: 0xb8a27e,
  hempShade: 0x9a8666,
  paving: 0xb0a598,
  joint: 0x8a8078,
  // Le géomètre, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, manteau, chemise.
  boots: 0x55595a,
  coat: 0x6e6a5e,
  shirt: 0x8e8a7a,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'gabarit')!.center;

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/** Le pas de la porte, au bout de son chemin (`bas-3`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'gabarit')!.at);

/**
 * L'atelier : ses bords (x d'ouest en est, z du nord au sud), l'épaisseur de ses murs, le haut du rez-de-chaussée de
 * pierre, celui de l'étage de brique, le faîtage de son toit, le débord du toit.
 */
const ATELIER = { x0: -6, x1: 6, z0: -4.5, z1: 4.5, wall: 0.6, ground: 5.0, upper: 8.0, ridge: 9.6, overhang: 0.4 } as const;

/** Les deux arches de l'arcade, dans la façade sud : leurs bords en x ; la naissance de l'arc ; la largeur du seuil. */
const ARCHES = [
  { x0: -3.4, x1: -0.9 },
  { x0: 0.9, x1: 3.4 },
] as const;
const ARCH = { spring: 2.4, sill: 0.9 } as const;

/** La tour, à l'angle nord-est : ses bords (un peu hors des murs), le haut de sa ruine à ses quatre coins, son haut, son pavillon. */
const TOWER = { x0: 2.7, x1: 6.15, z0: -4.65, z1: -1.2, ruin: [7.4, 10.0, 8.6, 7.0], top: 10.5, roof: 12.0 } as const;

/**
 * La grue (intention : x 9, z 0) : son pied, le côté de son poteau carré plein, sa hauteur ; la flèche, du haut du
 * poteau vers le plancher, son bout (la poulie) ; le bas du crochet ; le contrepoids de pierre au pied.
 */
const CRANE = { x: 9, z: 0, side: 0.6, h: 16, tip: { x: 6.0, y: 17.0, z: 6.6 }, hook: 9.4 } as const;

/** La balance à fléau, devant l'arcade, à droite de la porte : son pied, sa hauteur, la longueur du fléau, ses plateaux. */
const BALANCE = { x: 1.9, z: 6.4, h: 1.8, beam: 2.4, pan: 0.42, hang: 0.9 } as const;

/** Le plancher de traçage, au sud-est : ses bords, le nombre de ses planches (d'ouest en est). */
const FLOOR = { x0: 2.8, x1: 9.6, z0: 6.0, z1: 10.6, planks: 5 } as const;

/** Les corbeaux de la galerie, le long de la façade sud : leurs x ; leur haut ; leur saillie. */
const CORBELS = { at: [-5.2, -2.15, 0, 2.15, 5.2], top: ATELIER.ground, out: 0.7 } as const;

/** L'abri du géomètre, contre le mur ouest, ouvert vers le sud-ouest : ses bords, la hauteur de son toit au mur et devant. */
const SHELTER = { x0: -8.8, x1: ATELIER.x0, z0: -1.6, z1: 3.0, back: 3.0, front: 2.3 } as const;

/** Le signe de l'absence : sur la façade, à droite de l'arcade, à hauteur d'homme. */
const ABSENCE = { x: 4.7, y: 1.6 } as const;

/** La lanterne de l'abri (la seule allumée de la ruine) ; celle de l'angle sud-est (le haut) ; celle du chemin (les abords). */
const LANTERN_SHELTER = { x: SHELTER.x0, z: SHELTER.z1, y: 2.25 } as const;
const LANTERN_CORNER = { x: 5.5, y: 3.3 } as const;
const PATH_LANTERN = { x: -0.8, z: 8.8, h: 1.35 } as const;

/** Le muret de pierre au bord de la pointe (les abords), au nord-est, à l'écart de la grue. */
const MURET = { x: 13.0, z0: -6.5, z1: 4.5, h: 0.8 } as const;

/**
 * La cour dallée des abords, devant l'arcade : ses coins, dans le sens inverse des aiguilles d'une montre vu d'en haut ;
 * elle s'arrête avant la porte et son chemin.
 */
const YARD: readonly Vec2[] = [
  { x: -5.0, z: 6.6 },
  { x: -1.6, z: 7.2 },
  { x: 2.6, z: 7.4 },
  { x: 2.6, z: 4.7 },
  { x: -5.0, z: 4.7 },
];

/**
 * Le plan du sol, ajusté sous l'atelier, la cour, le plancher et l'abri (aux moindres carrés), relevé juste assez pour
 * ne jamais passer sous le sol ; calculé au premier usage (./place4eKit.ts).
 */
const planeY = groundPlane4e(localGround, [-12, 13], [-6, 11]);


/** Le pied de l'atelier : le plan sous son centre (ses murs s'enfoncent de `SINK` sous lui). */
const G = once(() => planeY(0, 0));

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention : de la porte vers le nord-nord-est) : l'atelier près du milieu, son
 * arcade face à la caméra ; la grue entière à droite, la plus haute ; au-delà, la mer. La caméra regarde vers
 * −(sin cap, cos cap). La porte est au sud-sud-ouest, à une douzaine de pas de l'atelier (plan4e.ts) : plus près, la caméra qui
 * suit, tournée vers le nord, entrait dans ses murs, et la grue, trop près, sortait du haut du cadre.
 */
const DOOR_VIEW = (-28 * Math.PI) / 180;

/**
 * La vue d'arrivée (`doorFrame`, basse comme l'Étalon, reculée comme la Forge) : plus basse que la caméra qui suit (la
 * correction « à hauteur de Kéo » du mainteneur) ; la grue y tient entière, le bout de sa flèche compris, sans lever le
 * regard (`arrivalView` n'est pas nécessaire ; son test de cadre, ./gabarit4e.test.ts).
 */
const DOOR_FRAME = { height: -3, back: 1.6 } as const;

/** Le point du nom sur la Carte, depuis le centre du lieu : au-dessus de l'atelier, à gauche de la grue, sans la couvrir. */
const MAP_POINT: Vec3 = {
  x: -1.5,
  get y() {
    return G() + ATELIER.ridge + 1.6;
  },
  z: 0,
};

// ---------- Les petits volumes ----------

/**
 * Un bloc droit de `x0` à `x1` et de `z0` à `z1`, de `y0` jusqu'à `tops` à ses quatre coins (nord-ouest, nord-est,
 * sud-est, sud-ouest) : un haut cassé en biais ; ses quatre faces et son dessus.
 */
function block(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, tops: readonly [number, number, number, number], side: number, top: number): void {
  const lo: P3[] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
  ];
  const hi: P3[] = lo.map(([x, , z], k) => [x, tops[k], z]);
  const mid: P3 = [(x0 + x1) / 2, 0, (z0 + z1) / 2];
  for (let k = 0; k < 4; k++) {
    const m = (k + 1) % 4;
    quadOut(b, lo[k], lo[m], hi[m], hi[k], [(lo[k][0] + lo[m][0]) / 2 - mid[0], 0, (lo[k][2] + lo[m][2]) / 2 - mid[2]], side);
  }
  quadOut(b, hi[0], hi[1], hi[2], hi[3], [0, 1, 0], top);
}

/** Un pan de mur de pierre (rez-de-chaussée) ou de brique (étage), de `y0` à `top0`/`top1` au-dessus du pied de l'atelier. */
function stoneRun(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, y0: number, top0: number, top1: number): void {
  wallRun(b, alongX, at, from, to, ATELIER.wall, G() + y0, G() + top0, G() + top1, C.stoneShade, C.stoneSun);
}
function brickRun(b: FacetBuilder, alongX: boolean, at: number, from: number, to: number, top0: number, top1: number): void {
  wallRun(b, alongX, at, from, to, ATELIER.wall - 0.06, G() + ATELIER.ground - 0.02, G() + top0, G() + top1, C.brickShade, C.brick);
}

const SOUTH = ATELIER.z1 - ATELIER.wall / 2;
const NORTH = ATELIER.z0 + ATELIER.wall / 2;
const WEST = ATELIER.x0 + ATELIER.wall / 2;
const EAST = ATELIER.x1 - ATELIER.wall / 2;

/**
 * Le haut d'une arche (son écoinçon, de chaque côté) : le mur plein entre la naissance et le sommet de l'arc, du côté
 * gauche (`side` −1) ou droit (+1), l'intrados en deux pans. Dans le plan de la façade sud.
 */
function haunch(b: FacetBuilder, a: { x0: number; x1: number }, side: -1 | 1): void {
  const r = (a.x1 - a.x0) / 2;
  const cx = (a.x0 + a.x1) / 2;
  const ys = ARCH.spring;
  const yc = ys + r;
  const edge = side < 0 ? a.x0 : a.x1;
  const mid = cx + side * r * Math.SQRT1_2;
  let outline: [number, number][] = [
    [edge, yc],
    [edge, ys],
    [mid, ys + r * Math.SQRT1_2],
    [cx, yc],
  ];
  // Dans le sens inverse des aiguilles d'une montre vu du sud, le coin d'abord (le dessin part de lui en éventail).
  const area = outline.reduce((s, [x, y], k) => {
    const [nx, ny] = outline[(k + 1) % outline.length];
    return s + x * ny - nx * y;
  }, 0);
  if (area < 0) outline = [outline[0], ...outline.slice(1).reverse()];
  b.extrude({ x: 0, y: G(), z: ATELIER.z1 - ATELIER.wall }, outline, ATELIER.wall, C.stoneShade, C.stoneSun);
}

/** Le linteau plein au-dessus d'une arche, de son sommet au haut du rez-de-chaussée. */
function lintel(b: FacetBuilder, a: { x0: number; x1: number }): void {
  const yc = ARCH.spring + (a.x1 - a.x0) / 2;
  stoneRun(b, true, SOUTH, a.x0, a.x1, yc, ATELIER.ground, ATELIER.ground);
}

/** Une fenêtre carrée de l'étage, vide : son ombre posée sur la face d'un mur (`out` : le dehors). */
function windowAt(b: FacetBuilder, x: number, z: number, out: Vec2): void {
  const y = G() + 6.0;
  const s = 0.42;
  const px = out.x !== 0 ? x + out.x * 0.012 : x;
  const pz = out.z !== 0 ? z + out.z * 0.012 : z;
  const u = out.x !== 0 ? { x: 0, z: -out.x } : { x: out.z, z: 0 };
  quadOut(b, [px - u.x * s, y, pz - u.z * s], [px + u.x * s, y, pz + u.z * s], [px + u.x * s, y + 2 * s, pz + u.z * s], [px - u.x * s, y + 2 * s, pz - u.z * s], [out.x, 0, out.z], C.window);
}

/** Les fenêtres de l'étage restauré : quatre au sud, deux à l'ouest, trois au nord, une à l'est. */
const WINDOWS: readonly { x: number; z: number; out: Vec2 }[] = [
  ...[-4.4, -1.5, 1.5, 4.4].map((x) => ({ x, z: ATELIER.z1, out: { x: 0, z: 1 } })),
  ...[-2.5, 1.5].map((z) => ({ x: ATELIER.x0, z, out: { x: -1, z: 0 } })),
  ...[-4.4, -1.5, 1.2].map((x) => ({ x, z: ATELIER.z0, out: { x: 0, z: -1 } })),
  { x: ATELIER.x1, z: 1.6, out: { x: 1, z: 0 } },
];

/** Une lanterne sur un bras, contre la façade sud, à `y` au-dessus du pied de l'atelier. */
function wallLantern(b: FacetBuilder, x: number, y: number, lit: boolean): void {
  const z = ATELIER.z1;
  b.box({ x, y: G() + y, z: z + 0.22 }, [0.08, 0.08, 0.45], C.iron);
  lantern(b, { x, y: G() + y - 0.02, z: z + 0.42 }, lit);
}

/** Un gabarit courbe : une longue planche cintrée, en deux pans, de `a` à `c`, bombée de `bow` vers le haut (debout) ou de côté (couché). */
function template(b: FacetBuilder, a: Vec3, c: Vec3, bow: Vec3, color: number): void {
  const m = { x: (a.x + c.x) / 2 + bow.x, y: (a.y + c.y) / 2 + bow.y, z: (a.z + c.z) / 2 + bow.z };
  b.beam(a, m, 0.14, color);
  b.beam(m, c, 0.14, color);
}

/** Un plateau de la balance : un disque bas de fer, à plat. */
function pan(b: FacetBuilder, x: number, y: number, z: number, color: number, top: number): void {
  b.prism({ x, y, z }, BALANCE.pan, BALANCE.pan * 0.9, 0.08, 6, color, top);
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const A = ATELIER;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le rez-de-chaussée de pierre (le mur du nord, ceux de l'ouest et de l'est ; la façade, son pied gauche et
  // son pilier du milieu, l'arche de gauche entière, le haut gauche de celle de droite) ; les corbeaux nus ; la grue
  // debout ; le pied de la balance ; le signe de l'absence ; l'abri du géomètre et sa lanterne, la seule allumée.
  add('ruine', 0, (b) => {
    stoneRun(b, true, NORTH, A.x0, A.x1, SINK, A.ground, A.ground);
    stoneRun(b, false, WEST, A.z0 + A.wall, A.z1 - A.wall, SINK, A.ground, A.ground);
    stoneRun(b, false, EAST, A.z0 + A.wall, A.z1 - A.wall, SINK, A.ground, A.ground);
    stoneRun(b, true, SOUTH, A.x0, ARCHES[0].x0, SINK, A.ground, A.ground);
    stoneRun(b, true, SOUTH, ARCHES[0].x1, ARCHES[1].x0, SINK, A.ground, A.ground);
    haunch(b, ARCHES[0], -1);
    haunch(b, ARCHES[0], 1);
    lintel(b, ARCHES[0]);
    haunch(b, ARCHES[1], -1);
    for (const x of CORBELS.at) b.box({ x, y: G() + CORBELS.top - 0.35, z: A.z1 + CORBELS.out / 2 - 0.05 }, [0.4, 0.35, CORBELS.out + 0.1], C.stoneShade, C.stoneSun);
    // La grue : son poteau carré plein, debout, entier.
    const cg = planeY(CRANE.x, CRANE.z);
    b.box({ x: CRANE.x, y: cg + SINK, z: CRANE.z }, [CRANE.side, CRANE.h - SINK, CRANE.side], C.woodShade, C.wood);
    // Le pied de la balance.
    const bg = planeY(BALANCE.x, BALANCE.z);
    b.box({ x: BALANCE.x, y: bg - 0.1, z: BALANCE.z }, [0.5, 0.18, 0.5], C.stoneShade, C.stoneSun);
    b.box({ x: BALANCE.x, y: bg, z: BALANCE.z }, [0.18, BALANCE.h, 0.18], C.woodShade, C.wood);
    // Le signe de l'absence du 4e : la ferrure vide, deux chevilles nues.
    const z = A.z1 + 0.04;
    b.box({ x: ABSENCE.x, y: G() + ABSENCE.y, z: z + 0.1 }, [0.7, 0.12, 0.22], C.rustDull, C.rustDullTop);
    for (const dx of [-0.18, 0.18]) b.box({ x: ABSENCE.x + dx, y: G() + ABSENCE.y + 0.12, z: z + 0.14 }, [0.07, 0.18, 0.07], C.iron);
    shelter(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : le pied droit de la façade cassé en biais, l'arche de droite ouverte ; le fléau couché dans
  // l'herbe, les deux plateaux à plat.
  add(
    'ruine',
    0,
    (b) => {
      stoneRun(b, true, SOUTH, ARCHES[1].x1, A.x1, SINK, 2.6, 4.4);
      const bg = planeY(BALANCE.x, BALANCE.z);
      b.beam({ x: BALANCE.x + 0.4, y: bg + 0.06, z: BALANCE.z + 0.4 }, { x: BALANCE.x + 2.5, y: bg + 0.06, z: BALANCE.z + 1.3 }, 0.12, C.woodShade);
      pan(b, BALANCE.x - 0.8, bg - 0.02, BALANCE.z + 0.9, C.rustDull, C.rustDullTop);
      pan(b, BALANCE.x + 1.5, bg - 0.02, BALANCE.z + 0.2, C.rustDull, C.rustDullTop);
    },
    corps1,
  );
  // Le corps 2 la relève : l'étage de brique à moitié tombé (l'ouest debout, cassé en biais vers le sud et vers l'est),
  // trois fenêtres vides ; une poutre de la galerie couchée au pied de la façade.
  add(
    'ruine',
    0,
    (b) => {
      brickRun(b, false, WEST, A.z0, A.z1, A.upper, 6.2);
      brickRun(b, true, NORTH, A.x0 + A.wall, -1, A.upper, 5.8);
      brickRun(b, true, SOUTH, A.x0 + A.wall, -2.6, 7.0, 5.5);
      windowAt(b, A.x0, -2.5, { x: -1, z: 0 });
      windowAt(b, A.x0, 0.6, { x: -1, z: 0 });
      windowAt(b, -4.4, A.z0, { x: 0, z: -1 });
      const g = planeY(-1, A.z1 + 1.2);
      b.box({ x: -0.6, y: g - 0.06, z: A.z1 + 1.3, yaw: 0.18 }, [4.2, 0.26, 0.3], C.woodShade, C.wood);
    },
    corps2,
  );
  // Le corps 3 la relève : la tour écrêtée en biais vers 10, jamais couronnée ; deux blocs tombés à son pied.
  add(
    'ruine',
    0,
    (b) => {
      const T = TOWER;
      block(b, T.x0, T.x1, T.z0, T.z1, G() + SINK, [G() + T.ruin[0], G() + T.ruin[1], G() + T.ruin[2], G() + T.ruin[3]], C.stoneShade, C.stone);
      for (const [x, z, s, yaw] of [
        [7.2, -3.4, 0.9, 0.5],
        [7.6, -1.6, 0.7, 1.3],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.2, z, yaw }, [s * 1.2, s, s], C.stoneShade, C.stone);
    },
    corps3,
  );
  // Le reste de la flèche, couché en travers du haut des murs, du mur est au pilier du milieu de la façade : l'étage
  // remonté (le corps 2) le relève, sans quoi ses murs le traverseraient.
  add('ruine', 0, (b) => b.beam({ x: 7.2, y: G() + A.ground + 0.22, z: -1.0 }, { x: 0, y: G() + A.ground + 0.22, z: A.z1 + 0.1 }, 0.38, C.woodShade), corps2);
  // Le haut la relève : le tronçon de flèche resté en haut du poteau.
  add(
    'ruine',
    0,
    (b) => {
      const cg = planeY(CRANE.x, CRANE.z);
      b.beam({ x: CRANE.x, y: cg + CRANE.h - 0.4, z: CRANE.z }, { x: CRANE.x - 0.9, y: cg + CRANE.h + 0.1, z: CRANE.z + 1.9 }, 0.36, C.wood);
    },
    haut,
  );
  // Les abords la relèvent : le plancher disjoint (des planches soulevées et gauchies, un coin affaissé), deux gabarits
  // couchés en travers.
  add(
    'ruine',
    0,
    (b) => {
      const F = FLOOR;
      const w = (F.x1 - F.x0) / F.planks;
      const tilts = [0, 0.08, -0.05, 0.12, -0.14];
      const lifts = [0, 0.12, 0, 0.2, -0.12];
      for (let k = 0; k < F.planks; k++) {
        const x = F.x0 + w * (k + 0.5);
        const z = (F.z0 + F.z1) / 2 + (k % 2 ? 0.15 : -0.1);
        b.box({ x, y: planeY(x, z) - 0.06 + lifts[k], z, yaw: k === 3 ? 0.06 : 0, pitch: tilts[k] }, [w - 0.16, 0.12, F.z1 - F.z0 - (k === 4 ? 0.9 : 0)], C.woodShade, C.wood);
      }
      const y = planeY(6, 8) + 0.14;
      template(b, { x: 3.6, y, z: 7.0 }, { x: 7.8, y, z: 9.6 }, { x: 0.6, y: 0, z: -0.6 }, C.woodShade);
      template(b, { x: 5.6, y, z: 6.6 }, { x: 8.8, y, z: 8.0 }, { x: -0.2, y: 0, z: 0.5 }, C.woodShade);
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le rez-de-chaussée refermé, les deux arches nettes et leur seuil ; la balance relevée, le fléau
  // de niveau, les deux plateaux vides à la même hauteur, sans graduation.
  add(0, 0, (b) => {
    stoneRun(b, true, SOUTH, ARCHES[1].x1, A.x1, SINK, A.ground, A.ground);
    haunch(b, ARCHES[1], 1);
    lintel(b, ARCHES[1]);
    for (const a of ARCHES) b.box({ x: (a.x0 + a.x1) / 2, y: G() - 0.1, z: SOUTH }, [a.x1 - a.x0, 0.22, ARCH.sill], C.stoneShade, C.stoneSun);
    const bg = planeY(BALANCE.x, BALANCE.z);
    const top = bg + BALANCE.h;
    b.box({ x: BALANCE.x, y: top, z: BALANCE.z }, [BALANCE.beam, 0.12, 0.12], C.newShade, C.newWood);
    for (const s of [-1, 1]) {
      const x = BALANCE.x + s * (BALANCE.beam / 2 - 0.12);
      b.box({ x, y: top - BALANCE.hang, z: BALANCE.z }, [0.04, BALANCE.hang, 0.04], C.iron);
      pan(b, x, top - BALANCE.hang - 0.08, BALANCE.z, C.iron, C.ironTop);
    }
  });
  // ---- Le corps 2 sur 3 : l'étage de brique et ses petites fenêtres ; la galerie de bois sur ses corbeaux, son
  // garde-corps (aucun échafaudage).
  add(0, 1 / 3, (b) => {
    brickRun(b, false, WEST, A.z0, A.z1, A.upper, A.upper);
    brickRun(b, true, NORTH, A.x0 + A.wall, TOWER.x0, A.upper, A.upper);
    brickRun(b, true, SOUTH, A.x0 + A.wall, A.x1 - A.wall, A.upper, A.upper);
    brickRun(b, false, EAST, TOWER.z1, A.z1, A.upper, A.upper);
    for (const w of WINDOWS) windowAt(b, w.x, w.z, w.out);
    const y = G() + CORBELS.top;
    b.box({ x: 0, y, z: A.z1 + CORBELS.out / 2 - 0.02 }, [A.x1 - A.x0 - 0.4, 0.14, CORBELS.out + 0.08], C.newShade, C.newWood);
    const rail = A.z1 + CORBELS.out - 0.06;
    for (const x of [-5.6, -2.8, 0, 2.8, 5.6]) b.box({ x, y: y + 0.14, z: rail }, [0.1, 0.95, 0.1], C.newShade);
    b.box({ x: 0, y: y + 1.0, z: rail }, [11.4, 0.1, 0.12], C.newShade, C.newWood);
  });
  // ---- Le corps 3 sur 3 : la tour remontée d'aplomb.
  add(0, 2 / 3, (b) => {
    const T = TOWER;
    block(b, T.x0, T.x1, T.z0, T.z1, G() + SINK, [G() + T.top, G() + T.top, G() + T.top, G() + T.top], C.stoneShade, C.stone);
  });
  // ---- Le haut : les toits de terre cuite de l'atelier et de la tour (un pavillon bas) ; la flèche de la grue, pleine,
  // d'un seul côté, au-dessus du plancher, sa poulie, sa corde et son crochet immobile, le contrepoids de pierre au pied ;
  // la lanterne de l'angle sud-est, allumée dès sa pose.
  add(1, 0, (b) => {
    const T = TOWER;
    b.gableRoof({ x: 0, y: G() + A.upper, z: 0 }, A.x1 - A.x0 + 2 * A.overhang, A.z1 - A.z0 + 2 * A.overhang, A.ridge - A.upper, C.tile, C.tileUnder);
    b.prism({ x: (T.x0 + T.x1) / 2, y: G() + T.top, z: (T.z0 + T.z1) / 2, yaw: Math.PI / 4 }, ((T.x1 - T.x0) / 2) * Math.SQRT2 + 0.3, 0, T.roof - T.top, 4, C.tile);
    crane(b);
    wallLantern(b, LANTERN_CORNER.x, LANTERN_CORNER.y, true);
  });
  // ---- Les abords : le plancher de traçage remis à plat, deux grands gabarits courbes dessus ; la cour dallée ; le muret
  // de pierre au bord de la pointe ; la lanterne du chemin, à l'entrée de la cour.
  add(2, 0, (b) => {
    const F = FLOOR;
    const w = (F.x1 - F.x0) / F.planks;
    for (let k = 0; k < F.planks; k++) {
      const x = F.x0 + w * (k + 0.5);
      const z = (F.z0 + F.z1) / 2;
      b.box({ x, y: planeY(x, z) - 0.06, z }, [w - 0.06, 0.16, F.z1 - F.z0], C.newShade, C.newWood);
    }
    const y = planeY(6, 8) + 0.12;
    template(b, { x: 3.6, y, z: 7.2 }, { x: 8.6, y, z: 7.2 }, { x: 0, y: 0, z: -0.7 }, C.newShade);
    template(b, { x: 3.8, y, z: 9.6 }, { x: 8.4, y, z: 9.6 }, { x: 0, y: 0, z: -0.5 }, C.newShade);
    yard(b);
    const M = MURET;
    wallRun(b, false, M.x, M.z0, M.z1, 0.6, planeY(M.x, 0) + SINK, planeY(M.x, M.z0) + M.h, planeY(M.x, M.z1) + M.h, C.stoneShade, C.stoneSun);
    const p = PATH_LANTERN;
    const py = planeY(p.x, p.z);
    b.box({ x: p.x, y: py - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: py + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

/**
 * L'abri du géomètre, contre le mur ouest, ouvert vers le sud-ouest : deux poteaux, un toit de planches à un pan, une table
 * à dessin inclinée, nue ; sa lanterne au poteau du sud, la seule allumée de la ruine.
 */
function shelter(b: FacetBuilder): void {
  const S = SHELTER;
  for (const z of [S.z0, S.z1]) {
    const g = planeY(S.x0, z);
    b.box({ x: S.x0, y: g + SINK, z }, [0.2, S.front - SINK - (g - G()), 0.2], C.woodShade, C.wood);
  }
  sheet(
    b,
    [
      [S.x0 - 0.3, G() + S.front, S.z1 + 0.3],
      [S.x1, G() + S.back, S.z1 + 0.3],
      [S.x1, G() + S.back, S.z0 - 0.3],
      [S.x0 - 0.3, G() + S.front, S.z0 - 0.3],
    ],
    0.1,
    C.wood,
    C.woodShade,
  );
  // La table à dessin, inclinée vers l'ouest, sur son pied plein.
  const tx = S.x1 - 1.3,
    tz = (S.z0 + S.z1) / 2;
  b.box({ x: tx, y: planeY(tx, tz) - 0.1, z: tz }, [0.14, 0.95, 1.1], C.woodShade);
  b.box({ x: tx, y: planeY(tx, tz) + 0.85, z: tz, yaw: Math.PI / 2, pitch: 0.35 }, [1.5, 0.07, 1.0], C.woodShade, C.wood);
  const L = LANTERN_SHELTER;
  b.box({ x: L.x - 0.2, y: G() + L.y + 0.02, z: L.z }, [0.4, 0.07, 0.07], C.woodShade);
  lantern(b, { x: L.x - 0.38, y: G() + L.y, z: L.z }, true);
}

/** La grue restaurée, sans son poteau (toujours là) : la flèche, sa poulie, sa corde, son crochet ; le contrepoids au pied. */
function crane(b: FacetBuilder): void {
  const cg = planeY(CRANE.x, CRANE.z);
  const head = { x: CRANE.x, y: cg + CRANE.h - 0.3, z: CRANE.z };
  const tip = { x: CRANE.tip.x, y: cg + CRANE.tip.y, z: CRANE.tip.z };
  b.beam(head, tip, 0.4, C.newShade);
  b.drum({ x: tip.x, y: tip.y - 0.2, z: tip.z, yaw: Math.atan2(tip.x - head.x, tip.z - head.z) + Math.PI / 2, pitch: Math.PI / 2 }, 0.32, 0.18, 6, C.iron, C.ironTop);
  b.beam({ x: tip.x, y: tip.y - 0.5, z: tip.z }, { x: tip.x, y: cg + CRANE.hook + 0.35, z: tip.z }, 0.05, C.hemp);
  b.box({ x: tip.x, y: cg + CRANE.hook, z: tip.z }, [0.16, 0.36, 0.16], C.iron, C.ironTop);
  b.box({ x: tip.x + 0.1, y: cg + CRANE.hook - 0.06, z: tip.z }, [0.36, 0.1, 0.12], C.iron);
  b.box({ x: CRANE.x + 0.9, y: cg - 0.1, z: CRANE.z - 0.2 }, [1.2, 1.0, 1.2], C.stoneShade, C.stoneSun);
}

/** La cour : la dalle qui suit le plan, son bord, et ses joints en rangs (jamais sur le chemin). */
function yard(b: FacetBuilder): void {
  const top = YARD.map(({ x, z }) => [x, planeY(x, z) + 0.02, z] as P3);
  for (let k = 1; k < top.length - 1; k++) b.triangle(top[0], top[k], top[k + 1], C.paving);
  const cx = YARD.reduce((s, p) => s + p.x, 0) / YARD.length,
    cz = YARD.reduce((s, p) => s + p.z, 0) / YARD.length;
  for (let k = 0; k < top.length; k++) {
    const m = (k + 1) % top.length;
    const out: P3 = [(top[k][0] + top[m][0]) / 2 - cx, 0, (top[k][2] + top[m][2]) / 2 - cz];
    quadOut(b, [top[k][0], top[k][1] - 0.4, top[k][2]], [top[m][0], top[m][1] - 0.4, top[m][2]], top[m], top[k], out, C.stoneShade);
  }
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, planeY(q.x, q.z) + 0.032, q.z + nz * s];
    quadOut(b, p(a, 1), p(c, 1), p(c, -1), p(a, -1), [0, 1, 0], C.joint);
  };
  line({ x: -4.7, z: 5.9 }, { x: 2.3, z: 5.9 });
  for (const x of [-2.4, 0.6]) line({ x, z: 5.0 }, { x, z: 7.0 });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, « Les parties et les traces ») ; aucune sur le chemin. */
const TRACE_SPOTS = {
  rack: { x: -4.7, z: ATELIER.z1 + 0.3 },
  reel: { x: -8.4, z: 4.6 },
  plumb: { x: 0, z: ATELIER.z1 + 0.05 },
  saw: { x: FLOOR.x0 - 0.7, z: 8.6 },
  rope: { x: FLOOR.x1 + 0.3, z: FLOOR.z0 - 0.2 },
} as const;

/** Un râtelier de bois contre la façade, trois gabarits courbes debout côte à côte, de la même forme (Réduire). */
function rack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.rack;
    const y = planeY(x, z);
    l.box({ x, y: y + 1.3, z: z - 0.05 }, [1.7, 0.12, 0.14], C.newShade, C.newWood);
    l.box({ x, y: y - 0.05, z: z + 0.3 }, [1.7, 0.14, 0.3], C.newShade, C.newWood);
    for (const dx of [-0.55, 0, 0.55]) template(l, { x: x + dx, y: y + 0.08, z: z + 0.32 }, { x: x + dx, y: y + 1.75, z: z + 0.02 }, { x: 0, y: 0, z: 0.22 }, C.newWood);
  });
}

/** Un touret de cordeau : une bobine de bois sur son pied, debout près de l'abri (Développer). */
function reel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.reel;
    const y = planeY(x, z);
    for (const s of [-1, 1]) l.box({ x: x + s * 0.3, y: y - 0.05, z }, [0.08, 0.9, 0.3], C.newShade, C.newWood);
    l.drum({ x: x - 0.22, y: y + 0.7, z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.3, 0.44, 7, C.hempShade, C.hemp);
  });
}

/** Un fil à plomb : un gros plomb de fonte au bout d'une corde, pendu à une cheville plantée dans le pilier, contre la pierre (Équilibre). */
function plumbLine(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.plumb;
    const y = G() + 2.7;
    l.box({ x, y, z: z + 0.12 }, [0.08, 0.08, 0.26], C.iron);
    l.box({ x, y: y - 1.15, z: z + 0.2 }, [0.03, 1.15, 0.03], C.hemp);
    l.prism({ x, y: y - 1.15, z: z + 0.2, pitch: Math.PI }, 0.14, 0, 0.32, 6, C.iron);
    l.prism({ x, y: y - 1.2, z: z + 0.2 }, 0.14, 0.12, 0.06, 6, C.iron, C.ironTop);
  });
}

/** Une scie à cadre, debout contre un tréteau bas (jamais un chevalet en X), au bord ouest du plancher (Relatifs et fractions). */
function saw(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.saw;
    const y = planeY(x, z);
    l.box({ x, y: y + 0.55, z }, [0.24, 0.1, 1.4], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.box({ x, y: y - 0.05, z: z + s * 0.55 }, [0.3, 0.62, 0.1], C.newShade);
    // La scie : son cadre de bois (deux montants, la traverse) et sa lame de fer, penchée contre le tréteau.
    const sx = x - 0.32;
    l.beam({ x: sx - 0.08, y: y + 0.02, z: z - 0.4 }, { x: sx + 0.12, y: y + 0.72, z: z - 0.4 }, 0.06, C.newShade);
    l.beam({ x: sx - 0.08, y: y + 0.02, z: z + 0.4 }, { x: sx + 0.12, y: y + 0.72, z: z + 0.4 }, 0.06, C.newShade);
    l.beam({ x: sx + 0.03, y: y + 0.42, z: z - 0.4 }, { x: sx + 0.03, y: y + 0.42, z: z + 0.4 }, 0.05, C.newWood);
    l.beam({ x: sx - 0.06, y: y + 0.08, z: z - 0.38 }, { x: sx - 0.06, y: y + 0.08, z: z + 0.38 }, 0.04, C.iron);
  });
}

/** La corde à nœuds, enroulée en couronne, pendue à une cheville de bois au coin du plancher : nœuds réguliers, sans couleur ni marque (Pythagore). */
function knotRope(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.rope;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.2, z }, [0.16, 1.5, 0.16], C.newShade, C.newWood);
    l.box({ x: x - 0.12, y: y + 1.12, z }, [0.24, 0.07, 0.07], C.newShade);
    l.band({ x: x - 0.28, y: y + 0.82, z: z - 0.2, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.28, 0.4, 8, C.hemp);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      l.box({ x: x - 0.29, y: y + 0.82 + Math.sin(a) * 0.28 - 0.05, z: z + Math.cos(a) * 0.28 }, [0.12, 0.1, 0.1], C.hempShade);
    }
  });
}

/**
 * Les cinq traces, une par mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les abords) ;
 * des objets de l'atelier, jamais la notion ; aucune ne se répète d'un lieu à l'autre.
 */
const TRACES = {
  simplifying: { at: TRACE_SPOTS.rack, lift: 1, stage: 0, row: 0, draw: rack },
  expanding: { at: TRACE_SPOTS.reel, lift: 1, stage: 0, row: 1 / 3, draw: reel },
  equations: { at: TRACE_SPOTS.plumb, lift: 1, stage: 0, row: 2 / 3, draw: plumbLine },
  rationals: { at: TRACE_SPOTS.saw, lift: 1, stage: 1, row: 0, draw: saw },
  'pythagorean-theorem': { at: TRACE_SPOTS.rope, lift: 1, stage: 2, row: 0, draw: knotRope },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention : vers l'est-nord-est) : l'abri, le mur de pierre de l'atelier
 * et, au-dessus du toit, la flèche de la grue ; le volcan derrière la caméra, aucune lave. Elle regarde vers
 * −(sin cap, cos cap).
 */
const SCENE_START = (-67.5 * Math.PI) / 180;

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le géomètre). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : devant l'abri du géomètre, à l'ouest de l'atelier. */
const SCENE_SPOT = { dx: -11.4, dz: 1.0, half: [2.6, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du géomètre au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous elle) : le dessus du plan du sol. */
const sceneRise = once(() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return Math.max(0, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.02 - top);
});

/** Le géomètre en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, manteau, chemise. */
function surveyor(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.25, 0.48, 8, C.coat);
  b.prism({ x: at.x, y: at.y + 0.62, z: at.z }, 0.27, 0.24, 0.38, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.coat);
}

/** Les piquets des réponses : leur hauteur hors du sol, à l'échelle 1, leur tête carrée ; un piquet choisi se soulève d'un cran. */
const STAKE = { height: 0.9, head: 0.22, lift: 0.3 } as const;

export const GABARIT: PlaceArt = {
  role: 'Le géomètre',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRise();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse : la cour est plate, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : l'abri, la table et le mur sont au lieu ; les abords (./gabaritSurroundings.ts) ajoutent ce qui
  // cadre. Il reste le géomètre en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) surveyor(b, at, sphere);
  },
  answer: {
    size: { height: STAKE.height + STAKE.lift + STAKE.head, half: 0.2 },
    facing: true,
    // Le bord de la cour : une longue pierre basse, où les piquets sont plantés.
    base(b, mid, y, z, span, s, ground) {
      const foot = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: foot, z: z + 0.25 * s }, [span + 0.8, y + 0.08 * s - foot, 0.3 * s], C.stoneShade, C.stoneSun);
    },
    // Un piquet de bois à tête carrée, tous de la même taille ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (picked ? STAKE.lift : 0) * s;
      b.box({ x: at.x, y: y - 0.2 * s, z: at.z }, [0.12 * s, (STAKE.height + 0.2) * s, 0.12 * s], C.newShade, C.newWood);
      b.box({ x: at.x, y: y + STAKE.height * s, z: at.z }, [STAKE.head * s, STAKE.head * s, STAKE.head * s], C.newShade, C.newWood);
    },
  },
  // Les cinq missions en R : la cour seule, rien de l'item ; les piquets portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers l'atelier.
  exit: { x: DOOR_AT.x + 0.4, z: DOOR_AT.z - 1.0 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Gabarit, pour les tests et ses abords : l'atelier, la grue, la balance, le plancher, l'abri, la caméra. */
export const GABARIT_LAYOUT = {
  atelier: ATELIER,
  arches: ARCHES,
  tower: TOWER,
  crane: CRANE,
  balance: BALANCE,
  floor: FLOOR,
  shelter: SHELTER,
  absence: ABSENCE,
  muret: MURET,
  yard: YARD,
  planeY,
  get base() {
    return G();
  },
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
