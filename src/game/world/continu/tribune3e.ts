// La Tribune (les Alpages du 3e, GD-25, lot 3 ; proposition du consultant d'Archipéo, § 5, relecture des lieux du
// directeur artistique, correction 7, et planche `selection-alpages-v1`, de près graine 2026, de loin graine 42) : « la
// tribune de pierre de l'alpage, où le village débattait et votait ». Sur le gabarit du Kiosque (./kiosque3e.ts), avec le
// kit du 3e (./place3eKit.ts). Trois rangs de gradins de pierre en demi-cercle, étagés dans la pente (un talus d'herbe
// derrière le dernier rang), tournés vers le pic, à l'est (planche : jamais une arène plate et fermée) ; face à eux,
// l'estrade basse de pierre à trois marches ; au sud de l'estrade, la cloche du débat, de fer bruni (correction 7), sous
// un petit auvent d'ardoise à deux pans sur deux piliers de granit ; au nord-est, debout à part, le tableau des votes de
// bois, ses jetons ronds unis sur leurs chevilles, sans chiffre ; les bancs de bois sur les gradins.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : deux gradins du bout sud tombés, leurs
// pierres en pente douce vers l'arène ; l'estrade fendue ; l'auvent tombé, la cloche posée au sol, intacte ; le tableau
// couché, ses jetons en tas dans un panier ; l'herbe sèche. Une seule lumière, la lanterne de la conseillère, au bras d'un
// pilier de l'auvent. Trois parties (1 + 1 + 1) : le corps (les gradins, l'estrade) ; le haut (l'auvent, la cloche, la
// lanterne de l'auvent) ; les abords (le tableau des votes, les bancs, la lanterne du chemin). Une trace par mission, avec
// sa partie. La porte est au sud-ouest, à côté de l'estrade (relecture du Versant, (b) 1) : Kéo s'y arrête, l'estrade à
// sa droite, les gradins devant lui, le pic au bord droit ; rien de haut ne se dresse devant le haut du Fanal (+20°). Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTuft3e, habitant3e, lantern3e, onCircle, postLantern3e, site3e } from './place3eKit';
import { COLORS_3E } from './plan3e';
import { capOf, groundPlane4e, inWorld, once, sceneRight, sceneRise } from './place4eKit';

/**
 * Les couleurs propres à la Tribune, en plus des matières des Passeurs (`C3E`) : l'herbe du talus derrière les gradins
 * (celle du pâturage) ; les jetons du tableau, unis, d'un seul bois clair ; les coussins de laine ; la terre cuite de la
 * cruche ; la veste de la conseillère ; le galet des réponses.
 */
const C = {
  grass: COLORS_3E.grass,
  grassSun: COLORS_3E.grassSun,
  token: 0xc7b48f,
  wool: [0xb59b7e, 0x9ba48a, 0xc9bfa8] as const,
  clay: 0xa8715a,
  coat: 0x6c5f73,
  pebble: 0xb9b4a6,
  pebbleTop: 0xcdc8bb,
} as const;

/** Un point en trois coordonnées. */
type P3 = readonly [number, number, number];

// ---------- Le repère du lieu ----------

const SITE = site3e('tribune');

/** Le plan du sol sous la Tribune : le pâturage, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-9, 9], [-9, 9]);

/** Les gradins : trois rangs en demi-cercle autour du centre (l'estrade), ouverts à l'est ; leurs caps, leurs rayons, leur montée. */
const ROWS = { from: 235, to: 355, segments: 6, r0: 4.4, depth: 0.9, rise: 0.5, count: 3 } as const;

/** Le talus d'herbe derrière le dernier rang, jusqu'au pâturage. */
const BERM = { r: 8.8 } as const;

/** Les deux gradins tombés de la ruine, au bout sud (côté porte) : leur rang et leur tronçon. */
const FALLEN = [
  { row: 2, seg: 0 },
  { row: 1, seg: 1 },
] as const;

/** L'estrade basse de pierre : son milieu, sa largeur (x), sa profondeur (z), sa hauteur ; ses trois marches à l'ouest. */
const STAGE = { x: 1.6, w: 2.4, d: 2.6, h: 0.6, step: 0.3 } as const;

/** L'auvent de la cloche, au sud de l'estrade : ses deux piliers, leur hauteur, le toit. */
const BELL = { z: 3.1, xs: [1.0, 2.4] as const, h: 2.5, roof: { w: 2.1, d: 1.3, rise: 0.45 } } as const;

/** Le tableau des votes, debout à part au nord-est de l'estrade, tourné vers les gradins. */
const BOARD = { x: 3.2, z: -3.4, w: 1.4, h: 1.0, foot: 0.75 } as const;

/** La lanterne du chemin (les abords), à côté de la porte, hors du chemin. */
const PATH_LANTERN = { x: -8.2, z: 8.3, h: 1.4 } as const;

/** L'herbe sèche de la ruine, du côté de la porte. */
const DRY = [
  { x: -2.6, z: 2.4, s: 0.9 },
  { x: -1.4, z: 3.3, s: 0.8 },
  { x: -6.6, z: 8.2, s: 1 },
  { x: -9.2, z: 2.2, s: 0.85 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 5) : au nord-est (41°), de la porte au sud-ouest ; les gradins devant, l'estrade à
 * droite de Kéo, jamais derrière lui (relecture du Versant, (b) 1) ; le haut du Fanal à +20°, derrière l'arête, le pic
 * au bord droit ; le soleil de la droite.
 */
const DOOR_VIEW = capOf(41);

/** La vue d'arrivée plus haute qu'au Kiosque (la hauteur commune) : par-dessus le talus, on voit les rangs et l'arène. */
const DOOR_FRAME = { height: 0, back: 1.5 } as const;

/** Le point du nom sur la Carte, au-dessus de l'estrade, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: STAGE.x,
  get y() {
    return planeY(STAGE.x, 0) + BELL.h + 2.2;
  },
  z: 0,
};

// ---------- Les volumes ----------

/** Le cap d'un point (en degrés) en lacet d'un repère dont le nord local regarde ce cap. */
const yawOf = (deg: number): number => (-deg * Math.PI) / 180;

/** Le sol du milieu de l'estrade : les gradins et l'estrade se posent sur lui. */
const floor = once(() => planeY(0, 0));

/** Le pas d'un tronçon de gradin, en degrés. */
const SEG = (ROWS.to - ROWS.from) / ROWS.segments;

/** Le dessus d'un rang (`row`), au-dessus du sol de l'arène. */
const rowTop = (row: number): number => floor() + ROWS.rise * (row + 1);

/** Le rayon intérieur d'un rang. */
const rowIn = (row: number): number => ROWS.r0 + ROWS.depth * row;

/** Un tronçon de gradin, plein jusqu'au sol, de granit, son dessus un cran plus clair. */
function rowSegment(b: FacetBuilder, row: number, seg: number): void {
  const mid = ROWS.from + SEG * (seg + 0.5);
  const r = rowIn(row) + ROWS.depth / 2;
  const p = onCircle(r, mid);
  const len = 2 * (rowIn(row) + ROWS.depth) * Math.sin((SEG * Math.PI) / 360) + 0.04;
  b.box({ x: p.x, y: floor() + SINK_3E, z: p.z, yaw: yawOf(mid) }, [len, rowTop(row) - floor() - SINK_3E, ROWS.depth + 0.02], C3E.graniteShade, C3E.graniteSun);
}

/** Un quadrilatère tourné vers le dehors (`out`, une direction), quel que soit l'ordre de ses coins. */
function quadOut(b: FacetBuilder, q: readonly [P3, P3, P3, P3], out: P3, color: number): void {
  const [a, c, d] = [q[0], q[1], q[2]];
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.quad(q[0], q[1], q[2], q[3], color);
  else b.quad(q[3], q[2], q[1], q[0], color);
}

/** Le talus d'herbe derrière le dernier rang : de son dessus au pâturage, tronçon par tronçon, ses deux bouts fermés. */
function berm(b: FacetBuilder): void {
  const top = rowTop(ROWS.count - 1);
  const rIn = rowIn(ROWS.count - 1) + ROWS.depth;
  const at = (r: number, deg: number, y: number): P3 => {
    const p = onCircle(r, deg);
    return [p.x, y, p.z];
  };
  const ground = (r: number, deg: number): number => {
    const p = onCircle(r, deg);
    return planeY(p.x, p.z) - 0.05;
  };
  for (let k = 0; k < ROWS.segments; k++) {
    const c0 = ROWS.from + SEG * k,
      c1 = c0 + SEG;
    const mid = onCircle(1, (c0 + c1) / 2);
    quadOut(b, [at(rIn, c0, top), at(rIn, c1, top), at(BERM.r, c1, ground(BERM.r, c1)), at(BERM.r, c0, ground(BERM.r, c0))], [mid.x, 1, mid.z], k % 2 ? C.grass : C.grassSun);
  }
  // Les deux bouts : un coin de talus, de granit, au bout de chaque aile.
  for (const [deg, side] of [
    [ROWS.from, -1],
    [ROWS.to, 1],
  ] as const) {
    const t = onCircle(1, deg + side * 90);
    const lo = (r: number): P3 => at(r, deg, ground(r, deg));
    quadOut(b, [lo(ROWS.r0), at(ROWS.r0, deg, rowTop(0)), at(rIn, deg, top), lo(rIn)], [t.x, 0, t.z], C3E.graniteShade);
    quadOut(b, [lo(rIn), at(rIn, deg, top), lo(BERM.r), lo(BERM.r)], [t.x, 0, t.z], C.grass);
  }
}

/** Les gradins debout, sauf ceux qu'on saute (la ruine). */
function rows(b: FacetBuilder, skip: (row: number, seg: number) => boolean): void {
  for (let row = 0; row < ROWS.count; row++) for (let seg = 0; seg < ROWS.segments; seg++) if (!skip(row, seg)) rowSegment(b, row, seg);
}

const isFallen = (row: number, seg: number): boolean => FALLEN.some((f) => f.row === row && f.seg === seg);

/** Les pierres des deux gradins tombés, en pente douce vers l'arène. */
function fallenStones(b: FacetBuilder): void {
  FALLEN.forEach((f, k) => {
    const mid = ROWS.from + SEG * (f.seg + 0.5);
    for (const [dr, dc, tilt] of [
      [-0.9, -5, 0.25],
      [-1.8, 3, 0.18],
      [-0.2, 6, 0.32],
    ] as const) {
      const r = rowIn(f.row) + dr - k * 0.3;
      const p = onCircle(r, mid + dc);
      b.box({ x: p.x, y: floor() + ROWS.rise * Math.max(0, f.row - 1) - 0.1, z: p.z, yaw: yawOf(mid + dc + 12), pitch: tilt }, [1.0, 0.36, 0.7], C3E.graniteShade, C3E.graniteSun);
    }
  });
}

/** L'estrade : pleine à trois marches, ou fendue en deux (la ruine). */
function stage(b: FacetBuilder, whole: boolean): void {
  const S = STAGE;
  const y = floor();
  if (whole) {
    b.box({ x: S.x, y: y + SINK_3E, z: 0 }, [S.w, S.h - SINK_3E, S.d], C3E.stoneShade, C3E.stone);
    for (let k = 1; k <= 2; k++) {
      const x0 = S.x - S.w / 2 - S.step * k;
      b.box({ x: x0 + S.step / 2, y: y + SINK_3E, z: 0 }, [S.step, S.h - 0.2 * k - SINK_3E, S.d], C3E.stoneShade, C3E.stone);
    }
    return;
  }
  // Fendue : la moitié nord droite, la moitié sud affaissée et décalée, une fente entre elles ; une marche seule.
  b.box({ x: S.x, y: y + SINK_3E, z: -S.d / 4 - 0.1 }, [S.w, S.h - SINK_3E, S.d / 2 - 0.2], C3E.stoneShade, C3E.stone);
  b.box({ x: S.x + 0.15, y: y + SINK_3E, z: S.d / 4 + 0.15, yaw: 0.12, pitch: 0.08 }, [S.w, S.h - 0.18 - SINK_3E, S.d / 2 - 0.2], C3E.stoneShade, C3E.stoneShade);
  b.box({ x: S.x - S.w / 2 - S.step / 2, y: y + SINK_3E, z: -0.5 }, [S.step, S.h - 0.2 - SINK_3E, S.d / 2], C3E.stoneShade, C3E.stone);
}

/** Les deux piliers de granit de l'auvent, toujours debout. */
function pillars(b: FacetBuilder): void {
  for (const x of BELL.xs) b.box({ x, y: planeY(x, BELL.z) + SINK_3E, z: BELL.z }, [0.36, BELL.h - SINK_3E, 0.36], C3E.graniteShade, C3E.granite);
}

/** La cloche de fer bruni, sa bouche en bas (`up`) ou posée de côté au sol (la ruine), dans un repère à son sommet. */
function bell(l: FacetBuilder): void {
  l.prism({ x: 0, y: -0.62, z: 0 }, 0.4, 0.22, 0.5, 8, C3E.iron, C3E.ironTop);
  l.prism({ x: 0, y: -0.12, z: 0 }, 0.22, 0.1, 0.12, 8, C3E.ironTop);
}

/** L'auvent : la poutre de bois sur les deux piliers, le petit toit d'ardoise à deux pans, épais, son dessous de bois. */
function awning(l: FacetBuilder): void {
  const R = BELL.roof;
  const span = BELL.xs[1] - BELL.xs[0];
  l.box({ x: 0, y: 0, z: 0 }, [span + 0.5, 0.22, 0.3], C3E.woodShade, C3E.wood);
  const slope = Math.atan2(R.rise, R.d / 2);
  const run = Math.hypot(R.d / 2, R.rise);
  for (const side of [-1, 1]) l.box({ x: 0, y: 0.22 + R.rise / 2, z: (side * R.d) / 4, pitch: side * slope }, [R.w, 0.12, run], C3E.woodShade, C3E.slate);
}

/** Le tableau des votes, debout, garni (`full`) ou vide ; dans un repère à son pied, tourné vers les gradins (l'ouest). */
function board(l: FacetBuilder, full: boolean): void {
  const B = BOARD;
  for (const s of [-1, 1]) l.box({ x: (s * (B.w - 0.1)) / 2, y: -0.2, z: 0 }, [0.1, B.foot + B.h + 0.25, 0.1], C3E.woodShade);
  l.box({ x: 0, y: B.foot, z: 0 }, [B.w, B.h, 0.08], C3E.woodShade, C3E.wood);
  if (!full) return;
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 3; k++) {
      const x = (k - 1) * 0.42,
        y = B.foot + 0.2 + r * 0.3;
      l.drum({ x, y, z: -0.06, pitch: Math.PI / 2 }, 0.11, 0.05, 6, C3E.woodShade, C.token);
    }
}

/** Le pied du tableau, tourné vers les gradins. */
const boardAt = once(() => ({ x: BOARD.x, y: planeY(BOARD.x, BOARD.z), z: BOARD.z, yaw: yawOf(270) }));

/** Le panier des jetons en tas (la ruine), au pied du tableau couché. */
function basket(b: FacetBuilder): void {
  const x = BOARD.x - 1.1,
    z = BOARD.z + 0.6;
  const y = planeY(x, z);
  b.prism({ x, y: y - 0.05, z }, 0.3, 0.36, 0.34, 8, C3E.newWood, C3E.woodShade);
  b.prism({ x, y: y + 0.27, z }, 0.32, 0.12, 0.14, 6, C.token);
}

/** Un banc de bois sur un tronçon de gradin, au bord de devant. */
function bench(b: FacetBuilder, row: number, seg: number): void {
  const mid = ROWS.from + SEG * (seg + 0.5);
  const p = onCircle(rowIn(row) + 0.32, mid);
  const len = 2 * (rowIn(row) + 0.32) * Math.sin((SEG * Math.PI) / 360) - 0.3;
  b.box({ x: p.x, y: rowTop(row), z: p.z, yaw: yawOf(mid) }, [len, 0.08, 0.34], C3E.woodShade, C3E.wood);
}

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : les gradins debout, le talus derrière ; les deux piliers de l'auvent et, au bras de celui de l'ouest, la
  // lanterne de la conseillère, la seule allumée de la ruine.
  add('ruine', 0, (b) => {
    rows(b, isFallen);
    berm(b);
    pillars(b);
    armLantern3e(b, BELL.xs[0] - 0.18, planeY(BELL.xs[0], BELL.z) + BELL.h - 0.45, BELL.z, -1, 0, true);
  });
  // Le corps relève les pierres des deux gradins tombés et l'estrade fendue.
  add(
    'ruine',
    0,
    (b) => {
      fallenStones(b);
      stage(b, false);
    },
    corps,
  );
  // Le haut relève l'auvent tombé au pied des piliers et la cloche posée au sol, intacte.
  add(
    'ruine',
    0,
    (b) => {
      const x = (BELL.xs[0] + BELL.xs[1]) / 2;
      drawPosed(b, { x: x + 0.3, y: planeY(x, BELL.z + 1.3) + 0.05, z: BELL.z + 1.4, yaw: 0.25, pitch: 1.2 }, awning);
      drawPosed(b, { x: x - 0.9, y: planeY(x - 0.9, BELL.z - 0.2) + 0.62, z: BELL.z - 0.2, yaw: 0 }, bell);
    },
    haut,
  );
  // Les abords relèvent le tableau couché, le panier des jetons et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) => {
      const at = boardAt();
      drawPosed(b, { x: at.x + 0.3, y: at.y + 0.05, z: at.z + 0.3, yaw: at.yaw + 0.4, pitch: -Math.PI / 2 + 0.05 }, (l) => board(l, false));
      basket(b);
      for (const d of DRY) dryTuft3e(b, d.x, planeY(d.x, d.z), d.z, d.s);
    },
    abords,
  );

  // ---- Le corps : les deux gradins remontés, l'estrade refaite à trois marches.
  add(0, 0, (b) => {
    for (const f of FALLEN) rowSegment(b, f.row, f.seg);
    stage(b, true);
  });
  // ---- Le haut : l'auvent relevé sur ses piliers, la cloche pendue ; la lanterne de l'auvent.
  add(1, 0, (b) => {
    const x = (BELL.xs[0] + BELL.xs[1]) / 2;
    const top = planeY(x, BELL.z) + BELL.h;
    drawPosed(b, { x, y: top, z: BELL.z, yaw: 0 }, awning);
    drawPosed(b, { x: x - 0.25, y: top, z: BELL.z, yaw: 0 }, bell);
    lantern3e(b, { x: x + 0.45, y: top, z: BELL.z }, true);
  });
  // ---- Les abords : le tableau des votes debout et ses jetons, les bancs sur les gradins, la lanterne du chemin.
  add(2, 0, (b) => {
    drawPosed(b, boardAt(), (l) => board(l, true));
    for (let row = 0; row < ROWS.count; row++) for (let seg = 0; seg < ROWS.segments; seg++) bench(b, row, seg);
    const p = PATH_LANTERN;
    postLantern3e(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Les places des traces, depuis le centre du lieu, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  cushions: onCircle(rowIn(0) + 0.45, 300),
  jug: { x: STAGE.x + 0.2, z: -STAGE.d / 2 - 1.1 },
  banner: onCircle(rowIn(0) - 0.25, 322),
} as const;

/** Une pile de coussins de laine sur le premier gradin (La Constitution). */
function cushions(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.cushions;
    C.wool.forEach((color, k) => l.box({ x: x + (k % 2) * 0.06, y: rowTop(0) + 0.12 * k, z, yaw: yawOf(300) + k * 0.25 }, [0.5, 0.12, 0.42], color));
  });
}

/** Une cruche de terre cuite et deux gobelets sur une petite table ronde, au nord de l'estrade (S'informer). */
function jug(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.jug;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z }, [0.08, 0.72, 0.08], C3E.woodShade);
    l.prism({ x, y: y + 0.66, z }, 0.32, 0.32, 0.05, 8, C3E.woodShade, C3E.newWood);
    const t = y + 0.71;
    l.prism({ x: x - 0.08, y: t, z }, 0.1, 0.12, 0.18, 8, C.clay);
    l.prism({ x: x - 0.08, y: t + 0.18, z }, 0.12, 0.06, 0.1, 8, C.clay);
    for (const s of [-1, 1]) l.prism({ x: x + 0.16, y: t, z: z + s * 0.12 }, 0.05, 0.06, 0.1, 6, C3E.stoneShade, C3E.stone);
  });
}

/** Une bannière de toile unie, roulée sur sa hampe, debout contre un banc du premier gradin (S'engager). */
function banner(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.banner;
    const y = planeY(x, z);
    const lean = onCircle(0.3, 322);
    l.beam({ x, y: y - 0.05, z }, { x: x + lean.x, y: y + 1.9, z: z + lean.z }, 0.06, C3E.woodShade);
    l.beam({ x: x + lean.x * 0.35, y: y + 0.65, z: z + lean.z * 0.35 }, { x: x + lean.x * 0.85, y: y + 1.6, z: z + lean.z * 0.85 }, 0.17, C3E.canvas);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : le corps, le haut, les abords. */
const TRACES = {
  constitution: { at: TRACE_SPOTS.cushions, lift: 1, stage: 0, row: 0, draw: cushions },
  information: { at: TRACE_SPOTS.jug, lift: 1.1, stage: 1, row: 0, draw: jug },
  'civic-engagement': { at: TRACE_SPOTS.banner, lift: 1.6, stage: 2, row: 0, draw: banner },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la scénette (proposition, § 5, retouchée) : au nord-nord-est, vers l'estrade, le tableau des votes
 * et l'aile nord des gradins ; la caméra se tient du côté ouvert de l'arène, jamais derrière le talus.
 */
const SCENE_START = capOf(15);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers la conseillère). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : au sud de l'estrade, du côté ouvert de l'arène, la cloche à droite. */
const SCENE_SPOT = { dx: 0.2, dz: 5.4, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de la conseillère au milieu de la scène. */
const SCENE_HALF = 2.0;

/** La hauteur du sol de la scène au-dessus de son point : le sol de l'arène. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** Le rebord de pierre des galets : sa hauteur à l'échelle 1 ; un galet choisi se soulève d'un cran. */
const LEDGE = { height: 0.45, lift: 0.3, pebble: 0.16 } as const;

/** Un galet rond et plat, uni ; tous pareils. */
function pebble(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.17 * s, 0.13 * s, 0.13 * s, 7, C.pebble, C.pebbleTop);
}

export const TRIBUNE: PlaceArt = {
  role: 'La conseillère',
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
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x7a6a5a);
  },
  answer: {
    size: { height: LEDGE.height + LEDGE.lift + LEDGE.pebble, half: 0.3 },
    facing: true,
    // Un rebord bas de granit, comme un bout de gradin, sous le rang des galets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + LEDGE.height * s;
      const f = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: f, z }, [span + 0.7, top - f, 0.5 * s], C3E.graniteShade, C3E.graniteSun);
    },
    // Un galet, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      pebble(b, { x: at.x, y: at.y + (LEDGE.height + (picked ? LEDGE.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  exit: { x: SITE.door.x + 0.6, z: SITE.door.z - 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Tribune, pour les tests. */
export const TRIBUNE_LAYOUT = {
  rows: ROWS,
  berm: BERM,
  stage: STAGE,
  bell: BELL,
  board: BOARD,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
} as const;
