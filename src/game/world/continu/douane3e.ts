// La Douane (les Alpages du 3e, GD-25, lot 3, lieu d'option ; proposition du consultant d'Archipéo, § 6, relecture des
// lieux du directeur artistique, correction 17, et planche `selection-alpages-v1`, de près graine 42, de loin graine
// 2026) : « le poste du col, où passaient les voyageurs venus d'ailleurs ». Sur le gabarit du Kiosque (./kiosque3e.ts) et,
// pour les cinq parties d'un lieu d'option, de la Veillée du 4e (./veillee4e.ts), avec le kit du 3e (./place3eKit.ts). Au
// bord ouest de l'alpage : une maison de pierre basse, son toit d'ardoise et sa cheminée, sa porte et ses volets de bois,
// ses fenêtres éteintes ; contre sa façade, le comptoir du guichet sous un auvent d'ardoise sur deux poteaux, ses tampons
// de bois à poignée ronde en rang ; au mur, la carte du col en relief de bois, sans nom ; le banc des voyageurs et ses
// bagages. Devant, un chemin de dalles, et en travers, la barrière : une lisse basse sur deux poteaux (relecture du
// Versant, (b) 8 : jamais un panneau ni un bras), levée d'un quart, son contrepoids de pierre au bout court. Ni drapeau,
// ni panneau, ni enseigne ; rien le long de la rive.
//
// La ruine, cassée du côté vu depuis la porte (relecture du Versant, (b) 5) : la barrière rompue, sa moitié dans l'herbe ;
// l'auvent penché, le comptoir fendu ; la porte de la maison ouverte, deux volets pendants ; le pan du toit tourné vers
// l'arrivée crevé, la cheminée tombée ; les malles en pile renversée ; l'herbe sèche. Une seule lumière, la lanterne du
// porteur, à la porte. Lieu d'option (comme la Veillée) : cinq parties (3 + 1 + 1) : le corps en trois rangées (la porte et
// les volets ; le comptoir et l'auvent ; la barrière) ; le haut (le toit, la cheminée, la lanterne de l'auvent) ; les
// abords (les bagages rangés, la carte du col, le banc, la lanterne du chemin). Une trace par rang de mission, la même pour
// les deux langues ; la maison ne dit jamais la langue. La porte du lieu est au sud-est, à côté de la maison (relecture du
// Versant, (b) 1) : Kéo s'y arrête, la maison à sa droite, la barrière à sa gauche, la rive et la mer de nuages devant,
// jusqu'à l'horizon (b) 4. Code pur.
import type { Stage } from './construction';
import { drawPosed, type FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C3E, SINK_3E, armLantern3e, dryTufts3e, habitant3e, lantern3e, onCircle, pathLantern3e, scene3e, site3e } from './place3eKit';
import { capOf, groundPlane4e, inWorld, once } from './place4eKit';

/**
 * Les couleurs propres à la Douane, en plus des matières des Passeurs (`C3E`) : la vitre éteinte des fenêtres (un gris
 * bleuté, jamais presque noir) ; le cuir des valises, la toile du sac à dos ; le bois peint de la carte du col (deux
 * verts et le brun, sans nom) ; la veste du porteur.
 */
const C = {
  pane: 0x6a7280,
  hollow: 0x5c5650,
  mapGreen: 0x8fa070,
  mapBrown: 0x9c8462,
  coat: 0x76604c,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site3e('douane');

/** Le plan du sol sous la maison et devant elle : le bord de l'alpage, presque à plat. */
const planeY = groundPlane4e(SITE.ground, [-9, 8], [-6, 10]);

/**
 * La maison a son repère : `x` le long de sa façade, du sud-ouest (−) au nord-est (+) ; `z` du dos (−, vers la rive, au
 * nord-ouest) à la façade (+, au sud-est, vers l'arrivée). Un point de la maison dans le repère du lieu.
 */
const HOUSE_YAW = (-306 * Math.PI) / 180;
const X = onCircle(1, 36);
const Z = onCircle(1, 126);
const toLocal = (x: number, z: number): Vec2 => ({ x: x * X.x + z * Z.x, z: x * X.z + z * Z.z });

/** Le sol du milieu de la maison ; un point d'ailleurs, depuis lui. */
const base = once(() => planeY(0, 0));
const g = (x: number, z: number): number => {
  const p = toLocal(x, z);
  return planeY(p.x, p.z) - base();
};

/** La maison : sa demi-longueur (x), sa demi-profondeur (z), ses murs, son toit à deux pans, sa cheminée. */
const HOUSE = { hx: 2.8, hz: 2.0, wall: 2.3, rise: 1.3, over: 0.35, chimney: { x: -1.6, w: 0.6, top: 4.3 } } as const;

/** Les ouvertures de la façade : la porte, la fenêtre et ses volets, le guichet, la carte du col (le milieu en x). */
const FRONT = { door: { x: -2.0, w: 0.9, h: 1.85 }, map: { x: -0.55, w: 1.1, h: 0.75, y: 1.15 }, window: { x: 0.75, w: 0.75, h: 0.8, y: 1.0 }, wicket: { x: 2.0, w: 1.0, h: 0.75, y: 1.05 } } as const;

/** Le comptoir du guichet et son auvent sur deux poteaux, devant la façade. */
const COUNTER = { x: 2.0, w: 1.4, d: 0.5, h: 0.95 } as const;
const AWNING = { x0: 1.15, x1: 2.85, out: 1.35, low: 1.95 } as const;

/**
 * Le chemin de dalles, à gauche de la maison, qui vient vers l'arrivée (de `z0` à `z1`), et la barrière en travers : ses
 * deux poteaux, de part et d'autre du chemin, la lisse, le contrepoids. La lisse court le long de la façade : depuis la
 * porte, elle se voit de flanc sur toute sa longueur, jamais par le bout (relecture des Prairies, (a) 12).
 */
const TRACK = { x: -7.0, z0: 0.4, z1: 9.6, w: 1.5 } as const;
const GATE = { z: 4.6, pivot: TRACK.x - 1.3, rest: TRACK.x + 1.3, y: 0.95, len: 3.3, raise: 0.42 } as const;

/** Le banc des voyageurs (les abords), sous la carte du col, et les bagages dessus. */
const BENCH = { x: -0.5, z: HOUSE.hz + 0.35, w: 1.4 } as const;

/** La lanterne du chemin (les abords), au repère du lieu : à côté de la porte du lieu, hors du chemin. */
const PATH_LANTERN = { x: 6.7, z: 8.5, h: 1.4 } as const;

/** L'herbe sèche de la ruine, devant la façade et autour de la barrière, au repère de la maison. */
const DRY = [
  { x: -9.4, z: 5.8, s: 1 },
  { x: -9.2, z: 2.2, s: 0.85 },
  { x: -3.2, z: 2.6, s: 0.8 },
  { x: 3.4, z: 2.6, s: 0.9 },
] as const;

// ---------- La vue ----------

/**
 * Le cap d'arrivée (proposition, § 6) : au nord-ouest (306°), le soleil dans le dos ; la maison à droite de Kéo, la
 * barrière à sa gauche, jamais derrière lui (relecture du Versant, (b) 1) ; au milieu, la rive et la mer de nuages
 * jusqu'à l'horizon (b) 4.
 */
const DOOR_VIEW = capOf(306);

/** La vue d'arrivée basse, à hauteur de Kéo, un peu reculée. */
const DOOR_FRAME = { height: -2.2, back: 1.5 } as const;

/** Le point du nom sur la Carte, au-dessus du faîtage, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + HOUSE.wall + HOUSE.rise + 1.4;
  },
  z: 0,
};

// ---------- Les volumes, dans le repère de la maison ----------

/** Dessine dans le repère de la maison, son sol au milieu en y = 0. */
const house = (b: FacetBuilder, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: 0, y: base(), z: 0, yaw: HOUSE_YAW }, draw);

/** Le dessous de la maison : le plus bas de ses quatre coins. */
const foot = once(() => Math.min(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => g(sx * HOUSE.hx, sz * HOUSE.hz)))));

/** Les murs de pierre et leur soubassement de granit ; le dedans sombre derrière les ouvertures de la façade. */
function walls(l: FacetBuilder): void {
  const H = HOUSE;
  l.box({ x: 0, y: SINK_3E, z: 0 }, [2 * H.hx + 0.1, foot() + 0.4 - SINK_3E, 2 * H.hz + 0.1], C3E.graniteShade, C3E.granite);
  l.box({ x: 0, y: foot() + 0.4, z: 0 }, [2 * H.hx, H.wall - foot() - 0.4, 2 * H.hz], C3E.stoneShade, C3E.stone);
  // Les pignons, triangles pleins sous le toit.
  for (const s of [-1, 1]) {
    const x = s * H.hx;
    const a: [number, number, number] = [x, H.wall, -H.hz],
      c: [number, number, number] = [x, H.wall, H.hz],
      t: [number, number, number] = [x, H.wall + H.rise, 0];
    if (s > 0) l.triangle(a, t, c, C3E.stone);
    else l.triangle(c, t, a, C3E.stoneShade);
  }
  // Les ouvertures : la porte et le guichet, le dedans sombre ; la fenêtre, sa vitre éteinte.
  const F = FRONT;
  const z = H.hz + 0.01;
  l.box({ x: F.door.x, y: foot() + 0.4, z }, [F.door.w, F.door.h - 0.4, 0.04], C.hollow);
  l.box({ x: F.wicket.x, y: F.wicket.y, z }, [F.wicket.w, F.wicket.h, 0.04], C.hollow);
  l.box({ x: F.window.x, y: F.window.y, z }, [F.window.w, F.window.h, 0.04], C3E.woodShade, C.pane);
  l.box({ x: F.window.x, y: F.window.y - 0.08, z: z + 0.05 }, [F.window.w + 0.2, 0.08, 0.16], C3E.stoneShade, C3E.stone);
}

/** Le toit à deux pans, épais, son dessous de bois ; le pan de la façade crevé (`whole` faux) ; et la cheminée, debout ou non. */
function roof(l: FacetBuilder, whole: boolean): void {
  const H = HOUSE;
  const half = H.hz + H.over;
  const slope = Math.atan2(H.rise, half);
  const run = Math.hypot(half, H.rise);
  const len = 2 * H.hx + 2 * H.over;
  l.box({ x: 0, y: H.wall + H.rise / 2 - 0.05, z: -half / 2, pitch: -slope }, [len, 0.16, run], C3E.woodShade, C3E.slate);
  if (whole) {
    l.box({ x: 0, y: H.wall + H.rise / 2 - 0.05, z: half / 2, pitch: slope }, [len, 0.16, run], C3E.woodShade, C3E.slate);
    l.box({ x: H.chimney.x, y: H.wall, z: -0.6 }, [H.chimney.w, H.chimney.top - H.wall, H.chimney.w], C3E.graniteShade, C3E.granite);
    l.box({ x: H.chimney.x, y: H.chimney.top, z: -0.6 }, [H.chimney.w + 0.14, 0.12, H.chimney.w + 0.14], C3E.slate, C3E.slateTop);
    return;
  }
  // Crevé : le pan de la façade n'a plus que sa moitié nord-est ; dans le trou, trois chevrons à nu.
  l.box({ x: len / 4, y: H.wall + H.rise / 2 - 0.05, z: half / 2, pitch: slope }, [len / 2, 0.16, run], C3E.woodShade, C3E.slate);
  for (const x of [-2.4, -1.5, -0.6]) l.box({ x, y: H.wall + H.rise / 2 - 0.05, z: half / 2, pitch: slope }, [0.12, 0.12, run], C3E.woodShade, C3E.wood);
}

/** La cheminée tombée (la ruine) : un tronçon bas sur le toit, ses pierres au pied du pignon. */
function chimneyFallen(l: FacetBuilder): void {
  const H = HOUSE;
  l.box({ x: H.chimney.x, y: H.wall, z: -0.6 }, [H.chimney.w, 1.2, H.chimney.w], C3E.graniteShade, C3E.granite);
  for (const [x, z, yaw] of [
    [-H.hx - 0.7, -0.6, 0.3],
    [-H.hx - 1.2, 0.5, -0.5],
  ] as const)
    l.box({ x, y: g(x, z) - 0.08, z, yaw, pitch: 0.2 }, [0.5, 0.32, 0.4], C3E.graniteShade, C3E.granite);
}

/** La porte de bois : fermée dans son cadre, ou ouverte vers le dehors (la ruine). */
function door(l: FacetBuilder, open: boolean): void {
  const D = FRONT.door;
  const z = HOUSE.hz + 0.04;
  if (!open) {
    // Refaite : la porte fermée, son seuil de pierre claire et son linteau de granit.
    l.box({ x: D.x, y: foot() + 0.4, z }, [D.w - 0.06, D.h - 0.42, 0.07], C3E.woodShade, C3E.wood);
    l.box({ x: D.x, y: g(D.x, z + 0.3) - 0.1, z: z + 0.25 }, [D.w + 0.3, foot() + 0.5 - g(D.x, z + 0.3), 0.5], C3E.stoneShade, C3E.stone);
    l.box({ x: D.x, y: D.h, z: z - 0.02 }, [D.w + 0.3, 0.18, 0.12], C3E.graniteShade, C3E.granite);
    return;
  }
  // Ouverte : à plat contre l'air, tournée de trois quarts sur son gond de gauche.
  drawPosed(l, { x: D.x - D.w / 2, y: foot() + 0.4, z: z + 0.04, yaw: -1.1 }, (d) => d.box({ x: D.w / 2 - 0.03, y: 0, z: 0 }, [D.w - 0.06, D.h - 0.42, 0.07], C3E.woodShade, C3E.wood));
}

/** Les deux volets de la fenêtre : rabattus à plat contre le mur, ou pendants de travers (la ruine). */
function shutters(l: FacetBuilder, hanging: boolean): void {
  const W = FRONT.window;
  const z = HOUSE.hz + 0.05;
  for (const s of [-1, 1]) {
    const x = W.x + s * (W.w / 2 + W.w / 4 + 0.03);
    if (hanging) l.box({ x: x + s * 0.06, y: W.y - 0.25, z: z + 0.08, pitch: 0.1, yaw: s * 0.2 }, [W.w / 2, W.h, 0.05], C3E.woodShade, C3E.wood);
    else l.box({ x, y: W.y, z }, [W.w / 2, W.h, 0.05], C3E.woodShade, C3E.newWood);
  }
}

/** Le comptoir du guichet : droit, ses trois tampons en rang ; ou fendu, affaissé (la ruine). */
function counter(l: FacetBuilder, whole: boolean): void {
  const K = COUNTER;
  const z = HOUSE.hz + K.d / 2;
  if (!whole) {
    l.box({ x: K.x - 0.4, y: g(K.x, z) + SINK_3E, z }, [K.w / 2 - 0.1, K.h - SINK_3E, K.d], C3E.woodShade, C3E.wood);
    l.box({ x: K.x + 0.4, y: g(K.x, z) + SINK_3E, z: z + 0.05, pitch: 0.1, yaw: 0.15 }, [K.w / 2 - 0.1, K.h - 0.25 - SINK_3E, K.d], C3E.woodShade, C3E.wood);
    return;
  }
  l.box({ x: K.x, y: g(K.x, z) + SINK_3E, z }, [K.w, K.h - SINK_3E, K.d], C3E.woodShade, C3E.wood);
  l.box({ x: K.x, y: K.h, z: z + 0.02 }, [K.w + 0.12, 0.06, K.d + 0.12], C3E.woodShade, C3E.newWood);
  for (const dx of [-0.4, 0, 0.4]) {
    l.box({ x: K.x + dx, y: K.h + 0.06, z }, [0.16, 0.08, 0.12], C3E.woodShade, C3E.newWood);
    l.beam({ x: K.x + dx, y: K.h + 0.14, z }, { x: K.x + dx, y: K.h + 0.28, z }, 0.04, C3E.woodShade);
    l.prism({ x: K.x + dx, y: K.h + 0.28, z }, 0.055, 0.04, 0.06, 6, C3E.wood);
  }
}

/** L'auvent : son pan d'ardoise du mur à ses deux poteaux, droit, ou penché, un poteau cassé (la ruine). */
function awning(l: FacetBuilder, straight: boolean): void {
  const A = AWNING;
  const z0 = HOUSE.hz,
    z1 = HOUSE.hz + A.out;
  const top = HOUSE.wall - 0.05;
  const slope = Math.atan2(top - A.low, A.out);
  const run = Math.hypot(A.out, top - A.low);
  const mid = (A.x0 + A.x1) / 2;
  if (straight) {
    for (const x of [A.x0 + 0.1, A.x1 - 0.1]) l.box({ x, y: g(x, z1 - 0.1) + SINK_3E, z: z1 - 0.1 }, [0.12, A.low - g(x, z1 - 0.1) - SINK_3E, 0.12], C3E.woodShade);
    l.box({ x: mid, y: (top + A.low) / 2 - 0.06, z: (z0 + z1) / 2, pitch: slope }, [A.x1 - A.x0, 0.12, run], C3E.woodShade, C3E.slate);
    return;
  }
  l.box({ x: A.x0 + 0.1, y: g(A.x0, z1) + SINK_3E, z: z1 - 0.1 }, [0.12, A.low - g(A.x0, z1) - SINK_3E, 0.12], C3E.woodShade);
  l.box({ x: A.x1 - 0.1, y: g(A.x1, z1) + SINK_3E, z: z1 - 0.1 }, [0.12, 0.9 - SINK_3E, 0.12], C3E.woodShade);
  l.box({ x: mid + 0.1, y: (top + A.low) / 2 - 0.4, z: (z0 + z1) / 2 + 0.05, pitch: slope + 0.25, yaw: 0.18 }, [A.x1 - A.x0, 0.12, run], C3E.woodShade, C3E.slate);
}

/** Le chemin de dalles à gauche de la maison, d'un bout à l'autre, des dalles à joints d'herbe. */
function track(l: FacetBuilder): void {
  const T = TRACK;
  const n = 6;
  const step = (T.z1 - T.z0) / n;
  for (let k = 0; k < n; k++) {
    const z = T.z0 + step * (k + 0.5);
    l.box({ x: T.x + (k % 2 ? 0.08 : -0.06), y: g(T.x, z) - 0.06, z, yaw: k % 2 ? 0.05 : -0.04 }, [T.w, 0.1, step - 0.18], C3E.stoneShade, C3E.stone);
  }
}

/** Les deux poteaux de la barrière : celui du pivot, haut d'un mètre ; celui où la lisse se pose, bas, à fourche. */
function gatePosts(l: FacetBuilder, pivotBroken: boolean): void {
  const G = GATE;
  const ph = pivotBroken ? 0.6 : G.y + 0.12;
  l.box({ x: G.pivot, y: g(G.pivot, G.z) + SINK_3E, z: G.z }, [0.32, ph - g(G.pivot, G.z) - SINK_3E, 0.32], C3E.woodShade, C3E.wood);
  const rh = G.y - 0.16;
  l.box({ x: G.rest, y: g(G.rest, G.z) + SINK_3E, z: G.z }, [0.28, rh - g(G.rest, G.z) - SINK_3E, 0.28], C3E.woodShade, C3E.wood);
  for (const s of [-1, 1]) l.box({ x: G.rest, y: rh, z: G.z + s * 0.17 }, [0.2, 0.3, 0.07], C3E.woodShade);
}

/** La lisse levée d'un quart sur son pivot, son contrepoids de pierre au bout court ; basse, jamais un bras. */
function gateRaised(l: FacetBuilder): void {
  const G = GATE;
  drawPosed(l, { x: G.pivot, y: G.y, z: G.z, yaw: Math.PI / 2, pitch: -G.raise }, (r) => {
    // La lisse épaisse de bois clair (relecture des Alpages, (a) 5) ; au bout court, le gros contrepoids de pierre.
    r.box({ x: 0, y: -0.13, z: G.len / 2 - 0.4 }, [0.26, 0.26, G.len + 0.8], C3E.newWood, 0xc2b49e);
    r.box({ x: 0, y: -0.42, z: -0.62 }, [0.62, 0.56, 0.5], C3E.graniteShade, C3E.granite);
  });
  // L'axe de fer du pivot, de part et d'autre du poteau.
  l.drum({ x: G.pivot, y: G.y, z: G.z - 0.22, yaw: 0, pitch: Math.PI / 2 }, 0.07, 0.44, 6, C3E.iron, C3E.ironTop);
}

/** La barrière rompue (la ruine) : la moitié de la lisse dans l'herbe, en travers du chemin de dalles ; le contrepoids au sol. */
function gateBroken(l: FacetBuilder): void {
  const G = GATE;
  l.box({ x: TRACK.x + 0.6, y: g(TRACK.x, G.z) - 0.02, z: G.z + 0.5, yaw: Math.PI / 2 + 0.5 }, [0.26, 0.26, 1.7], C3E.woodShade, C3E.newWood);
  l.box({ x: G.pivot - 0.6, y: g(G.pivot - 0.6, G.z - 0.4) - 0.1, z: G.z - 0.4, yaw: 0.4, pitch: 0.2 }, [0.62, 0.56, 0.5], C3E.graniteShade, C3E.granite);
}

/** Une malle de bois cerclée de fer, couchée ; dans un repère à son pied. */
function trunk(l: FacetBuilder): void {
  l.box({ x: 0, y: 0, z: 0 }, [0.8, 0.45, 0.48], C3E.woodShade, C3E.wood);
  for (const x of [-0.25, 0.25]) l.box({ x, y: -0.01, z: 0 }, [0.06, 0.47, 0.5], C3E.iron, C3E.ironTop);
}

/** Une valise de cuir debout, sa poignée. */
function suitcase(l: FacetBuilder): void {
  l.box({ x: 0, y: 0, z: 0 }, [0.55, 0.62, 0.2], C3E.leather);
  l.box({ x: 0, y: 0.62, z: 0 }, [0.2, 0.06, 0.05], C3E.woodShade);
}

/** Le banc des voyageurs, sous la carte du col. */
function bench(l: FacetBuilder): void {
  const B = BENCH;
  for (const s of [-1, 1]) l.box({ x: B.x + (s * (B.w - 0.2)) / 2, y: g(B.x, B.z) - 0.1, z: B.z }, [0.1, 0.55, 0.36], C3E.woodShade);
  l.box({ x: B.x, y: 0.45, z: B.z }, [B.w, 0.08, 0.42], C3E.woodShade, C3E.newWood);
}

/** La carte du col, en relief de bois peint, sans nom : un cadre, deux verts et un brun, une crête. */
function colMap(l: FacetBuilder): void {
  const M = FRONT.map;
  const z = HOUSE.hz + 0.05;
  l.box({ x: M.x, y: M.y, z }, [M.w, M.h, 0.06], C3E.woodShade, C3E.wood);
  l.box({ x: M.x - 0.18, y: M.y + 0.08, z: z + 0.04 }, [0.6, 0.3, 0.05], C.mapGreen);
  l.box({ x: M.x + 0.22, y: M.y + 0.36, z: z + 0.04 }, [0.5, 0.3, 0.05], C.mapBrown);
  l.prism({ x: M.x + 0.05, y: M.y + 0.2, z: z + 0.07, pitch: Math.PI / 2 }, 0.16, 0, 0.12, 4, C3E.granite);
}

function model(add: AddPiece): void {
  const corps = [0, 1 / 3, 2 / 3].map((row) => ({ stage: 0 as Stage, row }));
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : les murs, les fenêtres éteintes, le pan du dos ; le chemin de dalles et le poteau où la lisse se pose ;
  // la lanterne du porteur, au bras du mur près de la porte, la seule allumée de la ruine.
  add('ruine', 0, (b) =>
    house(b, (l) => {
      walls(l);
      track(l);
      armLantern3e(l, FRONT.door.x + FRONT.door.w / 2 + 0.25, 1.85, HOUSE.hz, 0, 1, true);
    }),
  );
  // Le corps 1 relève la porte ouverte et les deux volets pendants.
  add(
    'ruine',
    0,
    (b) =>
      house(b, (l) => {
        door(l, true);
        shutters(l, true);
      }),
    corps[0],
  );
  // Le corps 2 relève l'auvent penché et le comptoir fendu.
  add(
    'ruine',
    0,
    (b) =>
      house(b, (l) => {
        awning(l, false);
        counter(l, false);
      }),
    corps[1],
  );
  // Le corps 3 relève la barrière rompue, son pivot cassé, sa moitié dans l'herbe.
  add(
    'ruine',
    0,
    (b) =>
      house(b, (l) => {
        gatePosts(l, true);
        gateBroken(l);
      }),
    corps[2],
  );
  // Le haut relève le toit crevé et la cheminée tombée.
  add(
    'ruine',
    0,
    (b) =>
      house(b, (l) => {
        roof(l, false);
        chimneyFallen(l);
      }),
    haut,
  );
  // Les abords relèvent les malles en pile renversée et l'herbe sèche.
  add(
    'ruine',
    0,
    (b) =>
      house(b, (l) => {
        drawPosed(l, { x: -0.9, y: g(-0.9, 3.0), z: 3.0, yaw: 0.5 }, trunk);
        drawPosed(l, { x: -0.5, y: g(-0.5, 3.1) + 0.2, z: 3.1, yaw: -0.3, pitch: 1.3 }, trunk);
        dryTufts3e(l, DRY, g);
      }),
    abords,
  );

  // ---- Le corps 1 sur 3 : la porte refaite, fermée ; les volets droits, rabattus contre le mur.
  add(0, 0, (b) =>
    house(b, (l) => {
      door(l, false);
      shutters(l, false);
    }),
  );
  // ---- Le corps 2 sur 3 : le comptoir et ses tampons, l'auvent sur ses deux poteaux.
  add(0, 1 / 3, (b) =>
    house(b, (l) => {
      counter(l, true);
      awning(l, true);
    }),
  );
  // ---- Le corps 3 sur 3 : la barrière relevée sur son pivot, son contrepoids.
  add(0, 2 / 3, (b) =>
    house(b, (l) => {
      gatePosts(l, false);
      gateRaised(l);
    }),
  );
  // ---- Le haut : le toit d'ardoise refait, la cheminée ; la lanterne de l'auvent, qui s'allume.
  add(1, 0, (b) =>
    house(b, (l) => {
      roof(l, true);
      lantern3e(l, { x: (AWNING.x0 + AWNING.x1) / 2, y: AWNING.low + 0.12, z: HOUSE.hz + AWNING.out - 0.35 }, true);
    }),
  );
  // ---- Les abords : le banc et les bagages rangés, la carte du col au mur, la lanterne du chemin.
  add(2, 0, (b) => {
    house(b, (l) => {
      bench(l);
      colMap(l);
      drawPosed(l, { x: BENCH.x - 0.3, y: 0.53, z: BENCH.z, yaw: 0 }, (s) => s.box({ x: 0, y: 0, z: 0 }, [0.55, 0.36, 0.3], C3E.leather));
      drawPosed(l, { x: BENCH.x + 1.25, y: g(BENCH.x + 1.25, BENCH.z + 0.2), z: BENCH.z + 0.2, yaw: 0.1 }, trunk);
    });
    pathLantern3e(b, PATH_LANTERN, planeY);
  });
}

// ---------- Les traces ----------

/** Les places des traces, dans le repère de la maison, loin du chemin et de la scène. */
const TRACE_SPOTS = {
  suitcase: { x: FRONT.door.x - 0.85, z: HOUSE.hz + 0.35 },
  canes: { x: FRONT.door.x + 0.85, z: HOUSE.hz + 0.3 },
  dolly: { x: HOUSE.hx + 0.35, z: 0.8 },
  trunk: { x: HOUSE.hx + 0.9, z: -0.8 },
  pack: { x: BENCH.x + 0.95, z: BENCH.z + 0.45 },
} as const;

/** Le point d'une trace dans le repère du lieu. */
const traceAt = (s: { x: number; z: number }): Vec2 => toLocal(s.x, s.z);

/** Une trace, dessinée dans le repère de la maison. */
const inHouse = (draw: (l: FacetBuilder) => void) => (b: FacetBuilder, c: Vec3) => inWorld(b, c, (w) => house(w, draw));

/** Rang 1 (raconter au passé) : une valise de cuir debout, près de la porte. */
const tSuitcase = inHouse((l) => {
  const { x, z } = TRACE_SPOTS.suitcase;
  drawPosed(l, { x, y: g(x, z), z, yaw: 0.2 }, suitcase);
});

/** Rang 2 (récits de voyage) : une canne et un parapluie fermé, debout dans un pot de grès. */
const tCanes = inHouse((l) => {
  const { x, z } = TRACE_SPOTS.canes;
  const y = g(x, z);
  l.prism({ x, y: y - 0.05, z }, 0.17, 0.2, 0.45, 8, C3E.stoneShade, C.hollow);
  l.beam({ x: x - 0.05, y: y + 0.2, z }, { x: x - 0.1, y: y + 1.05, z: z + 0.04 }, 0.04, C3E.woodShade);
  l.prism({ x: x + 0.07, y: y + 0.2, z, yaw: 0.3 }, 0.07, 0.03, 0.75, 6, C.mapBrown);
});

/** Rang 3 (pays et villes ; en route) : un diable de porteur, appuyé au pignon du nord-est. */
const tDolly = inHouse((l) => {
  const { x, z } = TRACE_SPOTS.dolly;
  const y = g(x, z);
  for (const s of [-0.2, 0.2]) l.beam({ x: x + 0.3, y: y + 0.1, z: z + s }, { x: x - 0.05, y: y + 1.3, z: z + s }, 0.05, C3E.iron);
  l.box({ x: x + 0.36, y: y - 0.02, z }, [0.3, 0.05, 0.5], C3E.iron, C3E.ironTop);
  for (const s of [-1, 1]) l.drum({ x: x + 0.3, y: y + 0.13, z: z + s * 0.3, pitch: Math.PI / 2, yaw: Math.PI / 2 }, 0.13, 0.06, 8, C3E.iron, C3E.ironTop);
});

/** Rang 4 (les connecteurs) : une malle cerclée de fer, fermée, sur un petit banc, au pignon du nord-est. */
const tTrunk = inHouse((l) => {
  const { x, z } = TRACE_SPOTS.trunk;
  const y = g(x, z);
  for (const s of [-1, 1]) l.box({ x, y: y - 0.1, z: z + s * 0.4 }, [0.4, 0.45, 0.08], C3E.woodShade);
  l.box({ x, y: y + 0.32, z }, [0.5, 0.06, 1.0], C3E.woodShade, C3E.wood);
  drawPosed(l, { x, y: y + 0.38, z, yaw: Math.PI / 2 }, trunk);
});

/** Rang 5 (les médias) : un sac à dos de toile, mou, et un bâton de marche, appuyés au banc des voyageurs. */
const tPack = inHouse((l) => {
  const { x, z } = TRACE_SPOTS.pack;
  const y = g(x, z);
  l.box({ x, y: y - 0.02, z, yaw: 0.2, pitch: -0.15 }, [0.42, 0.52, 0.26], C3E.canvasShade, C3E.canvas);
  l.box({ x: x + 0.02, y: y + 0.42, z: z + 0.04, yaw: 0.2, pitch: -0.3 }, [0.36, 0.1, 0.24], C3E.canvasShade, C3E.canvas);
  l.beam({ x: x + 0.38, y: y - 0.05, z: z + 0.1 }, { x: x + 0.28, y: y + 1.3, z: z - 0.25 }, 0.05, C3E.woodShade);
});

/**
 * Les cinq traces, une par rang de mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les
 * abords) ; la mission de même rang des deux langues porte la même, dessinée une fois.
 */
const RANKS = {
  past: { at: traceAt(TRACE_SPOTS.suitcase), lift: 1.2, stage: 0, row: 0, draw: tSuitcase },
  stories: { at: traceAt(TRACE_SPOTS.canes), lift: 1.4, stage: 0, row: 1 / 3, draw: tCanes },
  countries: { at: traceAt(TRACE_SPOTS.dolly), lift: 1.5, stage: 0, row: 2 / 3, draw: tDolly },
  connectives: { at: traceAt(TRACE_SPOTS.trunk), lift: 1.1, stage: 1, row: 0, draw: tTrunk },
  media: { at: traceAt(TRACE_SPOTS.pack), lift: 1.4, stage: 2, row: 0, draw: tPack },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/** Les missions de chaque rang, dans l'ordre de l'île, en espagnol puis en allemand (au rang 3, « en route »). */
export const DOUANE_RANKS = [
  ['past', 'es-past', 'de-past'],
  ['stories', 'es-stories', 'de-stories'],
  ['countries', 'es-countries', 'de-on-the-road'],
  ['connectives', 'es-connectives', 'de-connectives'],
  ['media', 'es-media', 'de-media'],
] as const;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (proposition, § 6) : au nord-ouest, vers le comptoir, la barrière au bord gauche. */
const SCENE_START = capOf(300);

/** Le milieu de la scène, au repère du lieu : au sud-est du guichet, dehors, le comptoir devant, à gauche. */
const SCENE_SPOT = { dx: 7.4, dz: 2.3, half: [2.4, 1.2] as [number, number] } as const;

/** Le râtelier des clés : la hauteur de sa barre à l'échelle 1 ; une clé choisie se soulève d'un cran. */
const RACK = { height: 1.0, lift: 0.25, key: 0.42 } as const;

/** Une clé de fer, tous pareilles : son anneau, sa tige, son panneton ; pendue sous la barre. */
function key(b: FacetBuilder, at: Vec3, s: number): void {
  b.drum({ x: at.x, y: at.y - 0.1 * s, z: at.z, pitch: Math.PI / 2 }, 0.07 * s, 0.03 * s, 6, C3E.iron, C3E.ironTop);
  b.box({ x: at.x, y: at.y - 0.4 * s, z: at.z }, [0.04 * s, 0.28 * s, 0.04 * s], C3E.iron, C3E.ironTop);
  b.box({ x: at.x + 0.05 * s, y: at.y - 0.4 * s, z: at.z }, [0.08 * s, 0.07 * s, 0.03 * s], C3E.iron, C3E.ironTop);
}

export const DOUANE: PlaceArt = {
  role: 'Le porteur',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3 + 1 + 1).
  traceStage: 0,
  // La scénette : Kéo et le porteur de part et d'autre de son milieu ; son sol, l'herbe.
  ...scene3e(SITE, { start: SCENE_START, spot: SCENE_SPOT, floor: planeY, top: 3.2, pitch: 10 }),
  decor(b, _floor, at, sphere: Sphere, body = true) {
    if (body) habitant3e(b, at, sphere, C.coat, 0x5d6470, 0x6a5444);
  },
  answer: {
    size: { height: RACK.height + RACK.lift, half: 0.3 },
    facing: true,
    // Le râtelier : une barre de bois sur deux montants, les clés pendues dessous.
    base(b, mid, y, z, span, s, ground) {
      const top = y + RACK.height * s;
      b.box({ x: mid, y: top, z }, [span + 0.6, 0.1 * s, 0.1 * s], C3E.woodShade, C3E.wood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.25);
        const f = Math.min(ground, y) - 0.3;
        b.box({ x, y: f, z }, [0.1, top + 0.1 * s - f, 0.12 * s], C3E.woodShade);
      }
    },
    // Une clé, toutes pareilles ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      key(b, { x: at.x, y: at.y + (RACK.height + (picked ? RACK.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: Object.fromEntries(DOUANE_RANKS.flatMap(([rank, es, de]) => [es, de].map((m) => [m, RANKS[rank]]))),
  exit: { x: SITE.door.x - 0.5, z: SITE.door.z - 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Douane, pour les tests. */
export const DOUANE_LAYOUT = {
  house: HOUSE,
  track: TRACK,
  gate: GATE,
  pathLantern: PATH_LANTERN,
  toLocal,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  scene: SCENE_SPOT,
} as const;
