// La Maquette (les Alpages du 3e, GD-25, lot 3 ; proposition du consultant d'Archipéo, § 4, relecture des lieux du
// directeur artistique, correction 18, et planche `selection-alpages-v1`, de près graine 42, de loin graine 2026) : « le
// grand relief du pays, en bois peint, sous une halle : on y voyait tout le pays d'un seul regard ». Sur le gabarit du
// Kiosque (./kiosque3e.ts), avec le kit du 3e (./place3eKit.ts). Près de la rive ouest : une longue halle de bois ouverte
// des quatre côtés sur huit forts poteaux, son toit d'ardoise à deux pans, un peu de neige au faîtage ; dessous, sur une
// grande table basse, le relief d'un pays aux formes générales, sans contour reconnaissable (correction 18) : des plaines,
// des collines vertes et brunes, trois montagnes, deux fleuves d'ardoise jusqu'à une côte, les villes en petits cubes de
// bois clair, les routes en fils tendus entre elles ; à côté, la table de travail et ses deux tabourets. Aucun nom.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : la moitié du toit qui regarde l'arrivée
// tombée, son pan glissé du bord du relief dans l'herbe ; les deux poteaux de ce bout cassés ; les villes renversées, les
// deux fleuves décollés ; la table de travail couchée, un tabouret renversé ; l'herbe sèche au bout cassé. Une seule
// lumière, la lanterne de l'urbaniste, sous la moitié du toit restée debout. Trois parties (1 + 1 + 1) : le corps (les
// poteaux, le toit) ; le haut (le relief remis, la lanterne de la halle) ; les abords (les routes, la table de travail et
// ses tabourets, la lanterne du chemin). Une trace par mission, avec sa partie. La porte est au nord-est, loin de la
// halle (relecture du Versant, (b) 1) : Kéo s'y arrête à côté d'elle, jamais devant, la voit de trois quarts et regarde
// vers la rive ouest, la mer de nuages jusqu'à l'horizon (b) 4. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTuft3e, habitant3e, lantern3e, onCircle, pathLantern3e, scene3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once } from './place4eKit';

/**
 * Les couleurs propres à la Maquette, en plus des matières des Passeurs (`C3E`) : le bois peint du relief (la plaine,
 * deux verts de colline, le brun, la montagne et sa neige), la mer au bout du relief, d'un gris bleuté pâle (jamais le
 * bleu vif) ; les villes en bois clair ; le fil des routes ; le papier blanc ; la veste de l'urbaniste ; le pot de
 * peinture.
 */
const C = {
  plain: 0xa9b783,
  plainSide: 0x8f9b6c,
  hill: 0x7f9a5e,
  hillBrown: 0x9c8462,
  mount: 0x988e7f,
  sea: 0x8f9db0,
  town: 0xddd0b6,
  townShade: 0xc2b498,
  thread: 0x8a5a4a,
  paper: 0xe2e0d8,
  paperShade: 0xc9c7bf,
  coat: 0x5e7068,
  pot: 0x8f9a8c,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('maquette');

/** Le plan du sol sous la halle : l'herbe près de la rive ouest, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-8, 8], [-8, 8]);

/**
 * La halle a son propre repère : `a` le long du faîtage, du sud au nord (le bout de la porte, où est la côte du relief),
 * `c` en travers, de l'ouest à l'est (le long côté vu depuis la porte). Un point de la halle dans le repère du lieu.
 */
const HALL_YAW = (-270 * Math.PI) / 180;
const U = onCircle(1, 0);
const W = onCircle(1, 90);
const toLocal = (a: number, c: number): Vec2 => ({ x: a * U.x + c * W.x, z: a * U.z + c * W.z });

/** Le sol de la halle, au milieu : tout se dessine depuis lui ; un point d'ailleurs, depuis lui. */
const base = once(() => planeY(0, 0));
const g = (a: number, c: number): number => {
  const p = toLocal(a, c);
  return planeY(p.x, p.z) - base();
};

/** Les huit poteaux : leurs places le long du faîtage, en travers ; leur hauteur, leur section ; ceux du bout cassé. */
const POSTS = { a: [-4.8, -1.6, 1.6, 4.8] as const, c: 3.0, h: 3.0, w: 0.32, broken: { a: 4.8, h: [1.5, 1.0] as const } } as const;

/** Le toit à deux pans : la demi-largeur, le débord, la montée, l'épaisseur, la demi-longueur ; la neige au faîtage. */
const ROOF = { y: 3.2, half: 3.6, rise: 1.5, thick: 0.16, len: 5.4, snow: 1.0 } as const;

/** La table basse du relief : sa hauteur et son étendue ; la côte (la mer au-delà). */
const TABLE = { h: 0.62, a: 3.8, c: 2.2, coast: 2.4 } as const;

/** Les trois montagnes du relief, au bout du sud : place, rayon, hauteur. */
const MOUNTS = [
  { a: -3.0, c: -1.2, r: 0.55, h: 0.75 },
  { a: -2.4, c: 0.3, r: 0.65, h: 0.95 },
  { a: -3.1, c: 1.4, r: 0.5, h: 0.65 },
] as const;

/** Les collines, vertes ou brunes. */
const HILLS = [
  { a: -1.2, c: -1.5, color: C.hill },
  { a: -0.4, c: 1.5, color: C.hillBrown },
  { a: 0.6, c: -0.4, color: C.hillBrown },
  { a: 1.5, c: 1.6, color: C.hill },
] as const;

/** Les deux fleuves d'ardoise, des montagnes à la côte (sans contour reconnaissable). */
const RIVERS: readonly (readonly [number, number])[][] = [
  [
    [-2.2, 0.6],
    [-1.0, 0.0],
    [0.6, 0.6],
    [TABLE.coast + 0.05, 0.2],
  ],
  [
    [-2.8, -0.7],
    [-0.6, -0.8],
    [1.4, -1.2],
    [TABLE.coast + 0.05, -1.5],
  ],
];

/** Les villes en petits cubes de bois clair : place, côté. */
const TOWNS = [
  { a: -1.6, c: -0.6, s: 0.26 },
  { a: -0.2, c: 0.9, s: 0.22 },
  { a: 0.1, c: -1.6, s: 0.2 },
  { a: 1.1, c: -0.2, s: 0.3 },
  { a: 2.0, c: 1.0, s: 0.22 },
  { a: -1.0, c: 1.9, s: 0.2 },
] as const;

/** Les routes en fils, d'une ville à l'autre (leurs rangs dans `TOWNS`). */
const ROADS = [
  [0, 1],
  [1, 3],
  [3, 4],
  [0, 2],
  [2, 3],
  [1, 5],
] as const;

/** La table de travail et ses deux tabourets, à part, à l'ouest de la halle, au bout du nord. */
const DESK = { a: 3.4, c: -5.0, w: 1.5, d: 0.8, h: 0.78 } as const;

/** La lanterne du chemin (les abords), au repère du lieu : à côté de la porte, hors du chemin. */
const PATH_LANTERN = { x: 7.6, z: -8.3, h: 1.4 } as const;

/** L'herbe sèche de la ruine, au bout cassé, du côté de la porte. */
const DRY = [
  { a: 4.4, c: 4.8, s: 1 },
  { a: 5.9, c: 1.4, s: 0.85 },
  { a: 2.0, c: 5.9, s: 0.9 },
  { a: 6.0, c: -1.8, s: 0.8 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 4) : à l'ouest-sud-ouest (240°), de la porte au nord-est ; la halle de trois quarts,
 * son long côté et son bout du nord, à gauche de Kéo, jamais derrière lui (relecture du Versant, (b) 1) ; au-delà, la
 * rive ouest et la mer de nuages jusqu'à l'horizon (b) 4 ; le soleil de la gauche.
 */
const DOOR_VIEW = capOf(240);

/** La vue d'arrivée un peu plus haute qu'au Kiosque : la rive est loin (58), la mer de nuages se lit jusqu'à l'horizon. */
const DOOR_FRAME = { height: -1.0, back: 1.5 } as const;

/** Le point du nom sur la Carte, au-dessus du faîtage, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + ROOF.y + ROOF.rise + 1.4;
  },
  z: 0,
};

// ---------- Les volumes, dans le repère de la halle ----------

/** Dessine dans le repère de la halle (`a` en x, `c` en z), son sol au milieu en y = 0. */
const hall = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: base(), z: 0, yaw: HALL_YAW }, draw);

/** Un poteau, de son pied enfoncé à `h`. */
function post(l: FacetBuilder, a: number, c: number, h: number): void {
  l.box({ x: a, y: g(a, c) + SINK_3E, z: c }, [POSTS.w, h - g(a, c) - SINK_3E, POSTS.w], C3E.woodShade, C3E.wood);
}

/** Un poteau cassé : le fût court, un éclat penché au-dessus. */
function stump(l: FacetBuilder, a: number, c: number, h: number): void {
  post(l, a, c, h);
  l.box({ x: a + 0.05, y: h - 0.05, z: c, pitch: 0.5 }, [POSTS.w * 0.8, 0.35, POSTS.w * 0.5], C3E.woodShade, C3E.newWood);
}

/**
 * Le pan du toit tombé (la ruine) : de la table (`c` = 0,8) au haut du poteau cassé du côté de la porte (`c` = 3,15),
 * penché vers la halle ; dessus, l'ardoise ; dessous, les planches et trois chevrons, tournés vers la porte.
 */
function fallenPan(l: FacetBuilder): void {
  const lo = { c: 0.8, y: TABLE.h + 0.02 };
  const hi = { c: POSTS.c + 0.15, y: POSTS.broken.h[0] + 0.05 };
  const tilt = Math.atan2(hi.y - lo.y, hi.c - lo.c);
  const run = Math.hypot(hi.c - lo.c, hi.y - lo.y) + 0.5;
  drawPosed(l, { x: 3.0, y: (lo.y + hi.y) / 2, z: (lo.c + hi.c) / 2, yaw: 0, pitch: -tilt }, (k) => {
    k.box({ x: 0, y: 0, z: 0 }, [4.4, ROOF.thick, run], C3E.woodShade, C3E.slate);
    drawPosed(k, { x: 0, y: 0, z: 0, yaw: 0, pitch: Math.PI }, (u) => {
      u.box({ x: 0, y: 0, z: 0 }, [4.3, 0.03, run - 0.1], C3E.woodShade, C3E.wood);
      for (const a of [-1.5, 0, 1.5]) u.box({ x: a, y: 0.03, z: 0 }, [0.14, 0.12, run - 0.2], C3E.woodShade, C3E.newWood);
    });
  });
}

/** Les sablières (le long), les entraits (en travers) et le faîtage, de `a0` à `a1`. */
function frame(l: FacetBuilder, a0: number, a1: number, ties: readonly number[]): void {
  const len = a1 - a0;
  const mid = (a0 + a1) / 2;
  for (const c of [-POSTS.c, POSTS.c]) l.box({ x: mid, y: POSTS.h, z: c }, [len + 0.3, 0.22, 0.26], C3E.woodShade, C3E.wood);
  for (const a of ties) l.box({ x: a, y: POSTS.h, z: 0 }, [0.22, 0.22, 2 * POSTS.c + 0.3], C3E.woodShade, C3E.wood);
  for (const a of ties) l.box({ x: a, y: POSTS.h + 0.22, z: 0 }, [0.16, ROOF.y + ROOF.rise - POSTS.h - 0.4, 0.16], C3E.woodShade);
  l.box({ x: mid, y: ROOF.y + ROOF.rise - 0.2, z: 0 }, [len + 0.3, 0.2, 0.2], C3E.woodShade, C3E.wood);
}

/** Les deux pans d'ardoise de `a0` à `a1`, le dessous de bois, et la neige au faîtage. */
function roof(l: FacetBuilder, a0: number, a1: number): void {
  const R = ROOF;
  const len = a1 - a0;
  const mid = (a0 + a1) / 2;
  const slope = Math.atan2(R.rise, R.half);
  const run = Math.hypot(R.half, R.rise);
  for (const side of [-1, 1]) l.box({ x: mid, y: R.y + R.rise / 2, z: (side * R.half) / 2, pitch: side * slope }, [len, R.thick, run], C3E.woodShade, C3E.slate);
  // Un peu de neige au faîtage, de part et d'autre (comme au Belvédère).
  const top = R.thick / Math.cos(slope);
  l.gableRoof({ x: mid, y: R.y + R.rise * (1 - R.snow / R.half) + top - 0.02, z: 0 }, len - 0.1, 2 * R.snow, (R.rise * R.snow) / R.half + 0.04, C3E.snow, C3E.slateTop);
}

/** La table basse, la plaine peinte dessus, la mer au bout, la côte découpée, les montagnes et les collines. */
function relief(l: FacetBuilder): void {
  const T = TABLE;
  for (const a of [-T.a + 0.3, T.a - 0.3]) for (const c of [-T.c + 0.3, T.c - 0.3]) l.box({ x: a, y: g(a, c) - 0.3, z: c }, [0.16, T.h - 0.1 - g(a, c) + 0.3, 0.16], C3E.woodShade);
  l.box({ x: 0, y: T.h - 0.12, z: 0 }, [2 * T.a, 0.12, 2 * T.c], C3E.woodShade, C3E.wood);
  // La plaine, de la porte à la côte ; la mer, un cran plus bas, au-delà ; deux avancées de terre, pour une côte sans forme connue.
  const land = T.coast + T.a - 0.1;
  l.box({ x: -T.a + 0.05 + land / 2, y: T.h, z: 0 }, [land, 0.08, 2 * T.c - 0.1], C.plainSide, C.plain);
  l.box({ x: (T.coast + T.a) / 2, y: T.h, z: 0 }, [T.a - T.coast - 0.05, 0.03, 2 * T.c - 0.1], C.sea);
  l.box({ x: T.coast + 0.35, y: T.h, z: -1.0, yaw: 0.3 }, [0.8, 0.08, 0.7], C.plainSide, C.plain);
  l.box({ x: T.coast + 0.2, y: T.h, z: 1.2 }, [0.45, 0.08, 0.9], C.plainSide, C.plain);
  const top = T.h + 0.08;
  for (const m of MOUNTS) {
    l.prism({ x: m.a, y: top - 0.02, z: m.c, yaw: m.a }, m.r, 0, m.h, 5, C.mount);
    l.prism({ x: m.a, y: top - 0.02 + m.h * 0.7, z: m.c, yaw: m.a }, m.r * 0.3 + 0.01, 0, m.h * 0.3 + 0.01, 5, C3E.snow);
  }
  for (const h of HILLS) l.prism({ x: h.a, y: top - 0.02, z: h.c, yaw: h.c }, 0.5, 0.18, 0.24, 6, h.color);
}

/** Les deux fleuves d'ardoise, collés à plat sur la plaine. */
function rivers(l: FacetBuilder): void {
  const y = TABLE.h + 0.08;
  for (const river of RIVERS)
    for (let k = 0; k + 1 < river.length; k++) {
      const [a0, c0] = river[k];
      const [a1, c1] = river[k + 1];
      const len = Math.hypot(a1 - a0, c1 - c0);
      l.box({ x: (a0 + a1) / 2, y: y - 0.005, z: (c0 + c1) / 2, yaw: Math.atan2(-(c1 - c0), a1 - a0) }, [len + 0.12, 0.03, 0.16], C3E.slate, C3E.slateTop);
    }
}

/** Les villes, à leur place, ou renversées sur le relief et deux par terre (la ruine). */
function towns(l: FacetBuilder, fallen: boolean): void {
  const y = TABLE.h + 0.08;
  TOWNS.forEach((t, k) => {
    if (!fallen) {
      l.box({ x: t.a, y: y - 0.01, z: t.c }, [t.s, t.s, t.s], C.townShade, C.town);
      return;
    }
    const off = k % 2 === 0 ? 0.35 : -0.3;
    if (k === 1 || k === 4) {
      // Tombées de la table, dans l'herbe, du côté de la porte.
      const c = TABLE.c + 0.5 + k * 0.08;
      l.box({ x: t.a, y: g(t.a, c) - 0.02, z: c, yaw: k, pitch: 0.3 }, [t.s, t.s, t.s], C.townShade, C.town);
      return;
    }
    l.box({ x: t.a + off, y: y + 0.02, z: t.c - off, yaw: k * 0.7, pitch: Math.PI / 4 }, [t.s, t.s, t.s], C.townShade, C.town);
  });
}

/** Les deux fleuves décollés (la ruine) : l'un soulevé de travers sur la plaine, l'autre glissé contre le bord de la table, côté porte. */
function riversLoose(l: FacetBuilder): void {
  const y = TABLE.h + 0.08;
  l.box({ x: -0.4, y: y + 0.02, z: 0.5, yaw: 0.9, pitch: 0.15 }, [0.16, 0.03, 2.6], C3E.slate, C3E.slateTop);
  const c = TABLE.c + 0.4;
  l.box({ x: 0.8, y: g(0.8, c) + 0.3, z: c, yaw: 0.2, pitch: Math.PI / 4 }, [0.16, 0.03, 1.3], C3E.slate, C3E.slateTop);
}

/** Les routes en fils, tendues d'une ville à l'autre. */
function roads(l: FacetBuilder): void {
  const y = TABLE.h + 0.08;
  for (const [i, j] of ROADS) {
    const s = TOWNS[i],
      t = TOWNS[j];
    l.beam({ x: s.a, y: y + s.s * 0.6, z: s.c }, { x: t.a, y: y + t.s * 0.6, z: t.c }, 0.035, C.thread);
  }
}

/** Un tabouret rond à trois pieds, debout ou renversé. */
function stool(l: FacetBuilder, a: number, c: number, up: boolean): void {
  const y = g(a, c);
  if (!up) {
    drawPosed(l, { x: a, y: y + 0.2, z: c, yaw: 0.8, pitch: Math.PI / 2 }, (s) => {
      for (const k of [0, 1, 2]) s.box({ x: 0.13 * Math.sin(k * 2.1), y: -0.3, z: 0.13 * Math.cos(k * 2.1) }, [0.05, 0.62, 0.05], C3E.woodShade);
      s.prism({ x: 0, y: 0.3, z: 0 }, 0.2, 0.2, 0.06, 8, C3E.woodShade, C3E.newWood);
    });
    return;
  }
  for (const k of [0, 1, 2]) l.box({ x: a + 0.13 * Math.sin(k * 2.1), y: y - 0.05, z: c + 0.13 * Math.cos(k * 2.1) }, [0.05, 0.62, 0.05], C3E.woodShade);
  l.prism({ x: a, y: y + 0.55, z: c }, 0.2, 0.2, 0.06, 8, C3E.woodShade, C3E.newWood);
}

/** La table de travail, debout, ou couchée sur le flanc (la ruine). */
function desk(l: FacetBuilder, up: boolean): void {
  const D = DESK;
  const y = g(D.a, D.c);
  const draw = (t: FacetBuilder) => {
    for (const sa of [-1, 1]) for (const sc of [-1, 1]) t.box({ x: (sa * (D.w - 0.2)) / 2, y: -0.05, z: (sc * (D.d - 0.16)) / 2 }, [0.08, D.h, 0.08], C3E.woodShade);
    t.box({ x: 0, y: D.h - 0.07, z: 0 }, [D.w, 0.07, D.d], C3E.woodShade, C3E.newWood);
  };
  if (up) drawPosed(l, { x: D.a, y, z: D.c, yaw: 0 }, draw);
  else drawPosed(l, { x: D.a, y: y + D.d / 2, z: D.c, yaw: 0.3, pitch: Math.PI / 2 }, draw);
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };
  const standing = POSTS.a.filter((a) => a !== POSTS.broken.a);
  const [s0, s1, s2, s3] = POSTS.a;

  // Toujours là : les six poteaux du bout de la rive, leur charpente et la moitié du toit restée debout ; la table et le
  // relief peint, les montagnes, les collines, la mer ; la lanterne de l'urbaniste pendue sous le toit, la seule allumée.
  add('ruine', 0, (b) =>
    hall(b, (l) => {
      for (const a of standing) for (const c of [-POSTS.c, POSTS.c]) post(l, a, c, POSTS.h);
      frame(l, s0, s2, [s0, s1, s2]);
      roof(l, -ROOF.len, 0);
      relief(l);
      l.beam({ x: -3.2, y: ROOF.y + ROOF.rise - 0.2, z: 0 }, { x: -3.2, y: 2.75, z: 0 }, 0.03, C3E.iron);
      lantern3e(l, { x: -3.2, y: 2.78, z: 0 }, true);
    }),
  );
  // Le corps relève les deux poteaux cassés et le pan du toit tombé, glissé du bord du relief dans l'herbe, côté porte.
  add(
    'ruine',
    0,
    (b) =>
      hall(b, (l) => {
        POSTS.broken.h.forEach((h, k) => stump(l, POSTS.broken.a, k === 0 ? POSTS.c : -POSTS.c, h));
        // Le pan (relecture des Alpages, (a) 2) : son bord bas posé sur la table, son bord haut appuyé au poteau cassé du
        // côté de la porte ; penché, il montre son dessous de bois et ses chevrons, jamais un aplat d'ardoise dans l'herbe.
        fallenPan(l);
        l.box({ x: 5.9, y: g(5.9, 3.0) - 0.05, z: 3.0, yaw: -1.2 }, [2.6, 0.2, 0.22], C3E.woodShade, C3E.wood);
      }),
    corps,
  );
  // Le haut relève les villes renversées et les fleuves décollés.
  add(
    'ruine',
    0,
    (b) =>
      hall(b, (l) => {
        towns(l, true);
        riversLoose(l);
      }),
    haut,
  );
  // Les abords relèvent la table de travail couchée, un tabouret renversé et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) =>
      hall(b, (l) => {
        desk(l, false);
        stool(l, DESK.a - 1.2, DESK.c - 0.4, false);
        for (const d of DRY) dryTuft3e(l, d.a, g(d.a, d.c), d.c, d.s);
      }),
    abords,
  );

  // ---- Le corps : les deux poteaux du bout de la porte, leur charpente, l'autre moitié du toit.
  add(0, 0, (b) =>
    hall(b, (l) => {
      for (const c of [-POSTS.c, POSTS.c]) post(l, POSTS.broken.a, c, POSTS.h);
      frame(l, s2, s3, [s3]);
      roof(l, 0, ROOF.len);
    }),
  );
  // ---- Le haut : le relief remis, les fleuves recollés, les villes à leur place ; la lanterne de la halle, au bras du
  // poteau du bout de la porte, dehors (une seule lanterne sous le toit).
  add(1, 0, (b) =>
    hall(b, (l) => {
      rivers(l);
      towns(l, false);
      armLantern3e(l, s3 + POSTS.w / 2, POSTS.h - 0.55, POSTS.c, 1, 0, true);
    }),
  );
  // ---- Les abords : les routes tendues, la table de travail et ses tabourets, la lanterne du chemin.
  add(2, 0, (b) => {
    hall(b, (l) => {
      roads(l);
      desk(l, true);
      stool(l, DESK.a - 0.5, DESK.c + 0.75, true);
      stool(l, DESK.a + 0.5, DESK.c + 0.75, true);
    });
    pathLantern3e(b, PATH_LANTERN, planeY);
  });
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de la halle (`a`, `c`), loin du chemin et de la scène. */
const TRACE_SPOTS = {
  ladder: { a: POSTS.a[2], c: POSTS.c + 0.95 },
  pot: { a: 4.3, c: 1.4 },
  roll: { a: DESK.a, c: DESK.c },
} as const;

/** Le point d'une trace dans le repère du lieu, pour sa levée. */
const traceAt = (s: { a: number; c: number }): Vec2 => toLocal(s.a, s.c);

/** Une échelle de bois appuyée à un poteau, côté porte (Les territoires de la France). */
function ladder(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (w) =>
    hall(w, (l) => {
      const { a, c: cc } = TRACE_SPOTS.ladder;
      const y0 = g(a, cc);
      const top = { c: POSTS.c + POSTS.w / 2 + 0.06, y: 2.6 };
      for (const s of [-0.22, 0.22]) l.beam({ x: a + s, y: y0 - 0.05, z: cc }, { x: a + s, y: top.y, z: top.c }, 0.07, C3E.newWood);
      for (let k = 1; k <= 5; k++) {
        const t = k / 6;
        l.box({ x: a, y: y0 + (top.y - y0) * t, z: cc + (top.c - cc) * t }, [0.44, 0.05, 0.05], C3E.woodShade, C3E.newWood);
      }
    }),
  );
}

/** Deux pinceaux debout dans un pot de peinture, au pied du relief (Aménager le territoire). */
function pot(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (w) =>
    hall(w, (l) => {
      const { a, c: cc } = TRACE_SPOTS.pot;
      const y = g(a, cc);
      l.prism({ x: a, y: y - 0.05, z: cc }, 0.17, 0.17, 0.36, 8, C.pot, C.plain);
      for (const s of [-1, 1]) {
        l.beam({ x: a + s * 0.05, y: y + 0.2, z: cc }, { x: a + s * 0.1, y: y + 0.75, z: cc + s * 0.03 }, 0.035, C3E.newWood);
        l.box({ x: a + s * 0.1, y: y + 0.72, z: cc + s * 0.03 }, [0.07, 0.12, 0.05], C3E.woodShade);
      }
    }),
  );
}

/** Un rouleau de papier blanc fermé, posé sur la table de travail (La France et l'Union européenne). */
function roll(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (w) =>
    hall(w, (l) => {
      const { a, c: cc } = TRACE_SPOTS.roll;
      const y = g(DESK.a, DESK.c) + DESK.h;
      l.drum({ x: a - 0.35, y: y + 0.09, z: cc + 0.1, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.09, 0.7, 8, C.paperShade, C.paper);
    }),
  );
}

/** Les trois traces, une par mission, chacune avec sa partie : le corps, le haut, les abords. */
const TRACES = {
  territories: { at: traceAt(TRACE_SPOTS.ladder), lift: 1.6, stage: 0, row: 0, draw: ladder },
  planning: { at: traceAt(TRACE_SPOTS.pot), lift: 0.9, stage: 1, row: 0, draw: pot },
  'france-eu': { at: traceAt(TRACE_SPOTS.roll), lift: 1.1, stage: 2, row: 0, draw: roll },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 4) : à l'ouest-nord-ouest, vers le relief, la halle de biais, la mer de nuages au-delà. */
const SCENE_START = capOf(300);

/** Le milieu de la scène, depuis le centre du lieu : au bord du relief, côté est, dehors, en face de deux poteaux. */
const SCENE_SPOT = { dx: 5.8, dz: 1.5, half: [2.4, 1.2] as [number, number] } as const;

/** Le rebord de table des pions : sa hauteur à l'échelle 1 ; un pion choisi se soulève d'un cran. */
const LEDGE = { height: 0.55, lift: 0.3, pawn: 0.36 } as const;

/** Un pion de bois en forme de maison, sans écriture : un cube et son toit ; tous pareils. */
function pawn(b: FacetBuilder, at: Vec3, s: number): void {
  b.box({ x: at.x, y: at.y, z: at.z }, [0.22 * s, 0.2 * s, 0.22 * s], C.townShade, C.town);
  b.gableRoof({ x: at.x, y: at.y + 0.2 * s, z: at.z }, 0.26 * s, 0.28 * s, 0.14 * s, C3E.newWood, C.townShade);
}

export const MAQUETTE: PlaceArt = {
  role: 'L’urbaniste',
  model,
  traceStage: 0,
  // La scénette : Kéo et l'urbaniste de part et d'autre de son milieu ; son sol, l'herbe.
  ...scene3e(SITE, { start: SCENE_START, spot: SCENE_SPOT, floor: planeY, top: 3.2, pitch: 10 }),
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x4f4339);
  },
  answer: {
    size: { height: LEDGE.height + LEDGE.lift + LEDGE.pawn, half: 0.3 },
    facing: true,
    // Un rebord de table de bois sur deux pieds, sous le rang des pions.
    base(b, mid, y, z, span, s, ground) {
      const top = y + LEDGE.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.44 * s], C3E.woodShade, C3E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top - 0.08 * s - f, 0.4 * s], C3E.woodShade);
      }
    },
    // Un pion maison, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pawn(b, { x: at.x, y: at.y + (LEDGE.height + (picked ? LEDGE.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x - 0.4, z: SITE.door.z + 0.6 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Maquette, pour les tests. */
export const MAQUETTE_LAYOUT = {
  posts: POSTS,
  roof: ROOF,
  table: TABLE,
  pathLantern: PATH_LANTERN,
  toLocal,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
} as const;
