// L'Abri (le Versant du 3e, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 5, relecture des lieux du directeur
// artistique, point 11, et planche `selection-versant-v1`, de près graine 2026, de loin graine 42) : « l'abri à
// instruments : matin et soir, on y relevait le temps qu'il fait au sommet ». Sur le gabarit du Belvédère
// (./belvedere3e.ts), avec le kit du 3e (./place3eKit.ts). Au pied des pentes, un jardin d'instruments clos d'un muret
// bas sur trois côtés, ouvert au sud : l'abri à persiennes blanc cassé sur quatre hauts pieds, son petit toit d'ardoise ; cinq pluviomètres, des
// cylindres droits sur leurs piquets, en rang ; le mât et ses trois manches à air raides, à trois hauteurs, sans bras
// (rien en croix) ; la roue de tirage, un tambour de bois à manivelle sur son socle de pierre, ses boules toutes du même
// bois clair (une couleur ne dit jamais une chance) ; la table de relevés sous son petit toit ; le banc. Ni girouette à
// lettres, ni graduation.
//
// La ruine, d'après le texte : l'abri penché sur un pied cassé, deux persiennes tombées dans l'herbe, sa porte ouverte ;
// trois pluviomètres debout, deux couchés ; le mât debout, ses manches tombées à son pied ; la roue couchée à côté de son
// socle ; le muret affaissé. Une seule lumière, la lanterne de la météorologue, au poteau de son banc. Quatre parties
// (2 + 1 + 1) : l'abri redressé ; les pluviomètres et la roue ; le haut (le mât et ses manches, la table de relevés sous
// son toit, une lanterne) ; les abords (le muret, le banc, la lanterne du chemin). Une trace par mission, avec sa partie.
// Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, habitant3e, lantern3e, postLantern3e, site3e, wallSpan3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once, quadOut, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres à l'Abri, en plus des matières des Passeurs (`C3E`) : le blanc cassé de l'abri à persiennes et
 * l'ombre de ses lames (jamais un blanc plus vif que les nuages) ; le creux de sa porte ; le fer des pluviomètres ; la
 * toile des manches à air, unie ; le bois clair des boules ; la veste de la météorologue (un bleu-gris).
 */
const C = {
  white: 0xdcd8cc,
  louver: 0xb9b5aa,
  hollow: 0x6c645c,
  gauge: 0x8e959f,
  gaugeTop: 0x9fa6b0,
  sock: C3E.canvas,
  ball: 0xc9b38e,
  coat: 0x5f6f86,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('abri');

/** Le plan du sol sous le jardin d'instruments : le pied de la pente, à peine relevé au nord. */
const planeY = groundPlane4e(SITE.ground, [-6, 6], [-5.5, 6]);

/** L'abri à persiennes : son milieu, sa largeur, sa profondeur, sa hauteur ; la hauteur de ses pieds. */
const BOX = { x: -1.6, z: -2.0, w: 1.1, d: 0.8, h: 1.0, legs: 1.15 } as const;

/** Les cinq pluviomètres en rang, d'ouest en est, devant l'abri. */
const GAUGES = {
  xs: [0.2, 0.9, 1.6, 2.3, 3.0] as const,
  z: -0.2,
  post: 0.8,
  r: 0.13,
  h: 0.42,
} as const;

/** Le mât et ses trois manches à air, au nord-est ; toutes vers l'est, raides et immobiles. */
const MAST = {
  x: 2.0,
  z: -3.4,
  h: 4.2,
  socks: [2.4, 3.1, 3.8] as const,
} as const;

/** La roue de tirage sur son socle, à l'ouest : son milieu, son rayon, sa longueur. */
const DRUM = { x: -3.6, z: 0.9, r: 0.42, len: 0.7 } as const;

/** La table de relevés sous son petit toit, à l'est : son milieu, sa longueur (x), sa largeur. */
const TABLE = { x: 4.0, z: 1.4, len: 1.8, w: 0.8, h: 0.8, roof: 2.2 } as const;

/** Le banc, au sud-ouest, face aux instruments, et le poteau de la lanterne de la météorologue à son bout ouest. */
const BENCH = {
  x: -2.8,
  z: 4.1,
  len: 1.6,
  w: 0.42,
  h: 0.42,
  lamp: { x: -4.0, z: 4.1, h: 1.5 },
} as const;

/**
 * Le muret bas qui enclôt les instruments sur trois côtés : ses coins, sa large ouverture au sud (vers la porte et la
 * scène, dont la caméra regarde au nord-nord-ouest : rien de bas entre elle et l'abri), sa hauteur.
 */
const WALL = {
  x0: -5.6,
  x1: 5.6,
  z0: -5.0,
  z1: 4.8,
  gate: [-4.4, 5.0] as const,
  h: 0.6,
  thick: 0.4,
} as const;

/** La lanterne du chemin (les abords), dehors, à côté de l'ouverture, hors du chemin. */
const PATH_LANTERN = { x: 5.0, z: 6.4, h: 1.4 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (proposition, § 5) : 342°, de la porte au sud-sud-est ; l'abri de face, le pic au-delà. */
const DOOR_VIEW = capOf(342);

/** La vue d'arrivée basse, à hauteur de Kéo. */
const DOOR_FRAME = { height: -2.5, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du mât, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return planeY(0, 0) + MAST.h + 1;
  },
  z: -1,
};

// ---------- Les volumes ----------

/** Les quatre pieds de l'abri ; `broken` : le pied sud-est cassé court (la ruine). */
function boxLegs(b: FacetBuilder, broken: boolean): void {
  const g = planeY(BOX.x, BOX.z);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const h = broken && sx > 0 && sz > 0 ? BOX.legs * 0.45 : BOX.legs;
      b.box(
        {
          x: BOX.x + sx * (BOX.w / 2 - 0.08),
          y: g - 0.2,
          z: BOX.z + sz * (BOX.d / 2 - 0.08),
        },
        [0.1, h + 0.2, 0.1],
        C3E.woodShade,
        C3E.wood,
      );
    }
}

/** Les lames des persiennes sur une face (`n` : sa normale, x ou z), des bandes d'ombre en biais, rien à lire. */
function louvers(b: FacetBuilder, y0: number, n: Vec2): void {
  const half = (n.z !== 0 ? BOX.w : BOX.d) / 2 - 0.08;
  const off = (n.z !== 0 ? BOX.d : BOX.w) / 2 + 0.006;
  for (let k = 0; k < 4; k++) {
    const y = y0 + 0.2 + k * 0.2;
    const p = (u: number, yy: number) => (n.z !== 0 ? [BOX.x + u, yy, BOX.z + n.z * off] : [BOX.x + n.x * off, yy, BOX.z + u]) as [number, number, number];
    quadOut(b, p(-half, y), p(half, y), p(half, y + 0.07), p(-half, y + 0.07), [n.x, 0, n.z], C.louver);
  }
}

/** L'abri debout sur ses pieds : sa boîte blanc cassé, ses persiennes, sa porte fermée, son petit toit d'ardoise. */
function boxUp(b: FacetBuilder): void {
  const y = planeY(BOX.x, BOX.z) + BOX.legs;
  b.box({ x: BOX.x, y, z: BOX.z }, [BOX.w, BOX.h, BOX.d], C.white, C.white);
  for (const n of [
    { x: 0, z: 1 },
    { x: 1, z: 0 },
    { x: -1, z: 0 },
  ])
    louvers(b, y, n);
  b.gableRoof({ x: BOX.x, y: y + BOX.h, z: BOX.z }, BOX.w + 0.3, BOX.d + 0.3, 0.35, C3E.slate, C.white);
}

/** L'abri penché sur son pied cassé, sa porte ouverte, deux persiennes tombées dans l'herbe (la ruine). */
function boxFallen(b: FacetBuilder): void {
  const y = planeY(BOX.x, BOX.z) + BOX.legs - 0.3;
  b.box({ x: BOX.x + 0.12, y, z: BOX.z + 0.1, pitch: 0.28, yaw: 0.2 }, [BOX.w, BOX.h, BOX.d], C.white, C.white);
  b.gableRoof(
    {
      x: BOX.x + 0.25,
      y: y + BOX.h - 0.05,
      z: BOX.z + 0.38,
      pitch: 0.28,
      yaw: 0.2,
    },
    BOX.w + 0.3,
    BOX.d + 0.3,
    0.35,
    C3E.slate,
    C.white,
  );
  b.box({ x: BOX.x - 0.75, y: y + 0.1, z: BOX.z + 0.75, yaw: -0.9 }, [0.06, BOX.h * 0.9, BOX.w * 0.7], C.louver, C.white);
  for (const [dx, dz, yaw] of [
    [0.9, 1.0, 0.6],
    [-0.4, 1.5, 2.0],
  ] as const)
    b.box(
      {
        x: BOX.x + dx,
        y: planeY(BOX.x + dx, BOX.z + dz) - 0.02,
        z: BOX.z + dz,
        yaw,
      },
      [0.9, 0.05, 0.32],
      C.louver,
      C.white,
    );
}

/** Un pluviomètre : son piquet de bois, son cylindre de fer droit ; couché (la ruine) s'il est tombé. */
function gauge(b: FacetBuilder, x: number, fallen: boolean): void {
  const z = GAUGES.z;
  const g = planeY(x, z);
  if (fallen) {
    b.prism(
      {
        x: x + 0.3,
        y: g + GAUGES.r,
        z: z + 0.4,
        yaw: 0.7 + x,
        pitch: Math.PI / 2,
      },
      GAUGES.r,
      GAUGES.r,
      GAUGES.h,
      6,
      C.gauge,
      C.gaugeTop,
    );
    return;
  }
  b.box({ x, y: g - 0.2, z }, [0.1, GAUGES.post + 0.2, 0.1], C3E.woodShade, C3E.wood);
  b.prism({ x, y: g + GAUGES.post, z }, GAUGES.r, GAUGES.r, GAUGES.h, 6, C.gauge, C.gaugeTop);
}

/** Le mât de fer bruni, toujours debout. */
function mast(b: FacetBuilder): void {
  const g = planeY(MAST.x, MAST.z);
  b.box({ x: MAST.x, y: g - 0.3, z: MAST.z }, [0.5, 0.45, 0.5], C3E.graniteShade, C3E.granite);
  b.box({ x: MAST.x, y: g, z: MAST.z }, [0.12, MAST.h, 0.12], C3E.iron, C3E.ironTop);
}

/** Une manche à air, un tronc de cône de toile unie, raide, vers l'est ; posée à `y`, son anneau au mât. */
function sock(b: FacetBuilder, y: number, fallen = false, k = 0): void {
  if (fallen) {
    const x = MAST.x + 0.5 + 0.35 * k,
      z = MAST.z + 0.6 - 0.25 * k;
    b.prism({ x, y: planeY(x, z) + 0.12, z, yaw: 1.1 + k, pitch: Math.PI / 2 }, 0.16, 0.08, 0.7, 6, C.sock, C3E.canvasShade);
    return;
  }
  b.prism({ x: MAST.x + 0.06, y, z: MAST.z, yaw: -Math.PI / 2, pitch: Math.PI / 2 }, 0.17, 0.08, 0.75, 6, C.sock, C3E.canvasShade);
}

/** La roue de tirage : son socle de pierre ; le tambour de bois, sa manivelle, et trois boules toutes pareilles dans son auget. */
function drumUp(b: FacetBuilder): void {
  const g = planeY(DRUM.x, DRUM.z);
  b.box({ x: DRUM.x, y: g - 0.2, z: DRUM.z }, [1.0, 0.75, 0.7], C3E.graniteShade, C3E.granite);
  const y = g + 0.55 + DRUM.r;
  b.drum(
    {
      x: DRUM.x - DRUM.len / 2,
      y,
      z: DRUM.z,
      yaw: Math.PI / 2,
      pitch: Math.PI / 2,
    },
    DRUM.r,
    DRUM.len,
    8,
    C3E.newWood,
    C3E.woodShade,
  );
  b.beam({ x: DRUM.x + DRUM.len / 2, y, z: DRUM.z }, { x: DRUM.x + DRUM.len / 2 + 0.15, y: y + 0.32, z: DRUM.z }, 0.06, C3E.iron);
  b.beam({ x: DRUM.x + DRUM.len / 2 + 0.15, y: y + 0.32, z: DRUM.z }, { x: DRUM.x + DRUM.len / 2 + 0.35, y: y + 0.32, z: DRUM.z }, 0.07, C3E.woodShade);
  for (const dx of [-0.25, 0, 0.25]) b.prism({ x: DRUM.x + dx, y: g + 0.55, z: DRUM.z + 0.24 }, 0.07, 0.07, 0.12, 6, C.ball);
}

/** Le socle seul, et le tambour couché à côté, sur son bout (la ruine). */
function drumFallen(b: FacetBuilder): void {
  const g = planeY(DRUM.x, DRUM.z);
  b.box({ x: DRUM.x, y: g - 0.2, z: DRUM.z }, [1.0, 0.75, 0.7], C3E.graniteShade, C3E.granite);
  b.prism(
    {
      x: DRUM.x - 0.4,
      y: planeY(DRUM.x - 0.4, DRUM.z + 1.0) - 0.05,
      z: DRUM.z + 1.0,
      yaw: 0.3,
    },
    DRUM.r,
    DRUM.r,
    DRUM.len,
    8,
    C3E.newWood,
    C3E.woodShade,
  );
}

/** La table de relevés sous son petit toit d'ardoise, sur quatre poteaux, et sa lanterne pendue (le haut). */
function readingTable(b: FacetBuilder): void {
  const T = TABLE;
  const g = planeY(T.x, T.z);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      b.box(
        {
          x: T.x + sx * (T.len / 2 - 0.1),
          y: g - 0.2,
          z: T.z + sz * (T.w / 2 - 0.1),
        },
        [0.1, T.h + 0.2, 0.1],
        C3E.woodShade,
      );
  b.box({ x: T.x, y: g + T.h, z: T.z }, [T.len, 0.08, T.w], C3E.woodShade, C3E.wood);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      b.box(
        {
          x: T.x + sx * (T.len / 2 + 0.1),
          y: g - 0.2,
          z: T.z + sz * (T.w / 2 + 0.15),
        },
        [0.12, T.roof + 0.2, 0.12],
        C3E.woodShade,
        C3E.wood,
      );
  b.gableRoof({ x: T.x, y: g + T.roof, z: T.z }, T.len + 0.6, T.w + 0.7, 0.5, C3E.slate, C3E.woodShade);
  lantern3e(b, { x: T.x + T.len / 2 - 0.1, y: g + T.roof - 0.02, z: T.z + T.w / 2 + 0.15 }, true);
}

/** Les tronçons qui restent debout d'un pan affaissé (la ruine), en part de sa longueur. */
const STANDING: readonly (readonly [number, number])[] = [
  [0, 0.3],
  [0.6, 0.8],
];

/** Le muret bas autour des instruments, entier (les abords) ; affaissé (la ruine) : deux tronçons bas par pan, des pierres dans l'herbe. */
function enclosure(b: FacetBuilder, h: number, broken = false): void {
  const W = WALL;
  const y = Math.max(planeY(W.x0, W.z0), planeY(W.x1, W.z1), planeY(W.x0, W.z1), planeY(W.x1, W.z0)) - 0.05;
  const spans: [Vec2, Vec2][] = [
    [
      { x: W.x0, z: W.z0 },
      { x: W.x1, z: W.z0 },
    ],
    [
      { x: W.x1, z: W.z0 },
      { x: W.x1, z: W.z1 },
    ],
    [
      { x: W.x1, z: W.z1 },
      { x: W.gate[1], z: W.z1 },
    ],
    [
      { x: W.gate[0], z: W.z1 },
      { x: W.x0, z: W.z1 },
    ],
    [
      { x: W.x0, z: W.z1 },
      { x: W.x0, z: W.z0 },
    ],
  ];
  const at = (a: Vec2, c: Vec2, t: number): Vec2 => ({ x: a.x + (c.x - a.x) * t, z: a.z + (c.z - a.z) * t });
  for (const [a, c] of spans) {
    if (!broken) {
      wallSpan3e(b, a, c, y, h, W.thick);
      continue;
    }
    for (const [t0, t1] of STANDING) wallSpan3e(b, at(a, c, t0), at(a, c, t1), y, h, W.thick);
    // Une pierre tombée du côté du dedans, dans la brèche.
    const s = at(a, c, 0.45);
    const inward = { x: -Math.sign(s.x) * (Math.abs(s.x) > W.x1 - 0.1 ? 0.5 : 0), z: -Math.sign(s.z) * (Math.abs(s.x) > W.x1 - 0.1 ? 0 : 0.5) };
    b.box({ x: s.x + inward.x, y: planeY(s.x, s.z) - 0.1, z: s.z + inward.z, yaw: s.x + s.z }, [0.45, 0.28, 0.32], C3E.graniteShade, C3E.granite);
  }
}

/** Le banc de la météorologue, au sud-ouest, face aux instruments (les abords). */
function bench(b: FacetBuilder): void {
  const B = BENCH;
  const g = planeY(B.x, B.z);
  for (const s of [-1, 1]) b.box({ x: B.x + s * (B.len / 2 - 0.15), y: g - 0.1, z: B.z }, [0.18, B.h + 0.1, B.w - 0.08], C3E.graniteShade, C3E.granite);
  b.box({ x: B.x, y: g + B.h, z: B.z }, [B.len, 0.1, B.w], C3E.woodShade, C3E.wood);
}

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : les trois pieds entiers de l'abri (le quatrième cassé, puis refait) ; trois pluviomètres debout ; le
  // mât ; la lanterne de la météorologue sur son poteau, la seule allumée de la ruine.
  add('ruine', 0, (b) => boxLegs(b, true), corps1);
  add('ruine', 0, (b) => {
    for (const x of [GAUGES.xs[0], GAUGES.xs[2], GAUGES.xs[3]]) gauge(b, x, false);
    mast(b);
    const L = BENCH.lamp;
    postLantern3e(b, L.x, planeY(L.x, L.z), L.z, L.h, true);
  });
  // Le corps 1 relève l'abri penché, sa porte ouverte, ses deux persiennes dans l'herbe.
  add('ruine', 0, boxFallen, corps1);
  // Le corps 2 relève les deux pluviomètres couchés et la roue couchée à côté de son socle.
  add(
    'ruine',
    0,
    (b) => {
      gauge(b, GAUGES.xs[1], true);
      gauge(b, GAUGES.xs[4], true);
      drumFallen(b);
    },
    corps2,
  );
  // Le haut relève les trois manches tombées au pied du mât.
  add('ruine', 0, (b) => [0, 1, 2].forEach((k) => sock(b, 0, true, k)), haut);
  // Les abords relèvent le muret affaissé.
  add('ruine', 0, (b) => enclosure(b, 0.3, true), abords);

  // ---- Le corps 1 : l'abri redressé sur ses quatre pieds, ses persiennes remises, sa porte fermée.
  add(0, 0, (b) => {
    boxLegs(b, false);
    boxUp(b);
  });
  // ---- Le corps 2 : les cinq pluviomètres debout en rang ; la roue de tirage sur son socle.
  add(0, 0.5, (b) => {
    gauge(b, GAUGES.xs[1], false);
    gauge(b, GAUGES.xs[4], false);
    drumUp(b);
  });
  // ---- Le haut : les trois manches à air au mât ; la table de relevés sous son toit, sa lanterne.
  add(1, 0, (b) => {
    for (const h of MAST.socks) sock(b, planeY(MAST.x, MAST.z) + h);
    readingTable(b);
  });
  // ---- Les abords : le muret bas refait ; le banc ; la lanterne du chemin.
  add(2, 0, (b) => {
    enclosure(b, WALL.h);
    bench(b);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin. */
const TRACE_SPOTS = {
  stool: { x: BOX.x + 0.1, z: BOX.z + 1.0 },
  bucket: { x: GAUGES.xs[4] + 0.6, z: GAUGES.z },
  scope: { x: -4.0, z: -2.8 },
  ladder: { x: MAST.x - 0.1, z: MAST.z + 0.35 },
} as const;

/** Un tabouret haut et son marchepied, devant l'abri (Moyenne). */
function stool(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.stool;
    const y = planeY(x, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) l.box({ x: x + sx * 0.15, y: y - 0.1, z: z + sz * 0.15 }, [0.06, 0.95, 0.06], C3E.woodShade);
    l.box({ x, y: y + 0.85, z }, [0.42, 0.06, 0.42], C3E.woodShade, C3E.newWood);
    l.box({ x, y: y - 0.05, z: z + 0.45 }, [0.5, 0.3, 0.3], C3E.woodShade, C3E.newWood);
  });
}

/** Un seau de fer posé au bout du rang (Chances). */
function bucket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bucket;
    const y = planeY(x, z);
    l.prism({ x, y, z }, 0.17, 0.21, 0.34, 8, C3E.iron, C.hollow);
    l.beam({ x: x - 0.2, y: y + 0.34, z }, { x, y: y + 0.52, z }, 0.03, C3E.iron);
    l.beam({ x, y: y + 0.52, z }, { x: x + 0.2, y: y + 0.34, z }, 0.03, C3E.iron);
  });
}

/** Une longue-vue de bois sur un trépied bas (Relevés). */
function spyglass(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.scope;
    const y = planeY(x, z);
    const top = { x, y: y + 0.75, z };
    for (const a of [0, 2.1, 4.2]) l.beam({ x: x + 0.3 * Math.cos(a), y, z: z + 0.3 * Math.sin(a) }, top, 0.05, C3E.woodShade);
    l.prism(
      {
        x: x - 0.1,
        y: y + 0.82,
        z: z + 0.25,
        yaw: 0.4,
        pitch: Math.PI / 2 - 0.25,
      },
      0.07,
      0.05,
      0.8,
      6,
      C3E.newWood,
      C3E.iron,
    );
  });
}

/** Une échelle de bois appuyée au mât (Cargaisons). */
function ladder(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.ladder;
    const y = planeY(x, z);
    const lean = 0.7;
    for (const s of [-0.2, 0.2]) l.beam({ x: x + s, y, z: z + lean }, { x: x + s, y: y + 2.3, z: z - 0.02 }, 0.06, C3E.newWood);
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      l.beam({ x: x - 0.2, y: y + 2.3 * t, z: z + lean * (1 - t) }, { x: x + 0.2, y: y + 2.3 * t, z: z + lean * (1 - t) }, 0.04, C3E.newWood);
    }
  });
}

/** Les quatre traces, une par mission, chacune avec sa partie : le corps en deux, le haut, les abords. */
const TRACES = {
  mean: { at: TRACE_SPOTS.stool, lift: 1, stage: 0, row: 0, draw: stool },
  probability: {
    at: TRACE_SPOTS.bucket,
    lift: 1,
    stage: 0,
    row: 0.5,
    draw: bucket,
  },
  data: { at: TRACE_SPOTS.scope, lift: 1, stage: 1, row: 0, draw: spyglass },
  'ratio-sharing': {
    at: TRACE_SPOTS.ladder,
    lift: 1,
    stage: 2,
    row: 0,
    draw: ladder,
  },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 5) : au nord-nord-ouest, vers l'abri et le pic. */
const SCENE_START = capOf(342);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la météorologue). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : devant l'abri, la table de relevés à droite. */
const SCENE_SPOT = {
  dx: 1.2,
  dz: 2.4,
  half: [2.4, 1.2] as [number, number],
} as const;

/** L'écart de Kéo et de la météorologue au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : l'herbe du jardin d'instruments. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** La planche des gobelets : sa hauteur à l'échelle 1 ; un gobelet choisi se soulève d'un cran. */
const PLANK = { height: 0.55, lift: 0.3, cup: 0.22 } as const;

/** Un gobelet de fer, tous pareils, son dedans plus sombre. */
function cup(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.12 * s, 0.14 * s, PLANK.cup * s, 8, C.gauge, C.hollow);
}

export const ABRI: PlaceArt = {
  role: 'La météorologue',
  model,
  traceStage: 0,
  sceneSpot: {
    dx: SCENE_SPOT.dx,
    dz: SCENE_SPOT.dz,
    half: SCENE_SPOT.half,
    fine: true,
  },
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
    habitant: {
      dx: SCENE_RIGHT.x * SCENE_HALF,
      dz: SCENE_RIGHT.z * SCENE_HALF,
    },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (10 * Math.PI) / 180,
    start: SCENE_START,
  },
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat);
  },
  answer: {
    size: { height: PLANK.height + PLANK.lift + PLANK.cup, half: 0.3 },
    facing: true,
    // Une planche de bois gris sur deux pieds de bois, sous la rangée des gobelets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + PLANK.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.42 * s], C3E.woodShade, C3E.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.14, top - 0.08 * s - f, 0.34 * s], C3E.woodShade, C3E.wood);
      }
    },
    // Un gobelet, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      cup(
        b,
        {
          x: at.x,
          y: at.y + (PLANK.height + (picked ? PLANK.lift : 0)) * s,
          z: at.z,
        },
        s,
      );
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.3, z: SITE.door.z - 0.7 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de l'Abri, pour les tests et ses abords. */
export const ABRI_LAYOUT = {
  box: BOX,
  gauges: GAUGES,
  mast: MAST,
  drum: DRUM,
  table: TABLE,
  bench: BENCH,
  wall: WALL,
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
