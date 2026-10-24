// L'Herbier (les Coteaux du 4e, GD-24 ; intention du directeur artistique du 22 octobre 2026, § 3, sur la planche
// `selection-coteaux-v3`) : « la serre des Passeurs sur la terre noire du volcan, où chaque plante avait sa place ». Sur
// le gabarit de l'Étalon (./etalon4e.ts), avec le kit commun des Coteaux (./place4eKit.ts). Une longue serre basse d'est
// en ouest, à arceaux de fonte en berceau (jamais deux pans droits : le berceau la distingue des halles de l'Étalon et de
// la Basilique), sur son socle de pierre grise ; sa porte au milieu du long côté nord, face au chemin ; la paillasse de
// pierre dehors, contre le pignon ouest ; la citerne au sud-ouest, et sur sa margelle le socle de la pompe : le signe de
// l'absence du 4e, un support de fer vide et deux goujons nus (la pompe, prise par les Ferrailleurs), avant comme après.
//
// La ruine, d'après le texte et jamais d'après l'image (les vues de Z-Image gardaient le verre) : la charpente de fonte
// d'un brun éteint, les arceaux debout sauf les deux du bout est, qui penchent ; trois vitres en haut, côté ouest, et un
// seul tas de verre au pied du pignon est ; le socle fendu à un angle ; les bacs à moitié vides, deux renversés, leur terre
// coulée en éventail ; la paillasse penchée sur un pied cassé, ses pots de grès gris renversés (jamais de terre cuite) ; la
// citerne sèche, sa margelle ébréchée, la gouttière décrochée qui pend ; des herbes sèches, jamais d'arbre. Une seule
// lumière, la lanterne de l'horticultrice, pendue à l'arceau de la porte. Trois parties (1 + 1 + 1) : le corps (le socle
// réparé, les arceaux redressés, les bacs plantés, la paillasse), le haut (la verrière, le faîtage et son aérateur, la
// lanterne du pignon est), les abords (la gouttière, la citerne pleine, les bacs du dehors aux plantes de formes
// différentes, l'allée de terre noire bordée de pierre, la lanterne du chemin). Une trace par mission, avec sa partie.
// Aucune lueur, rien d'orange, rien à lire, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C4E, SINK, capOf, emptyMount, groundPlane4e, inWorld, lantern, once, postLantern, quadOut, sceneRight, sceneRise, site4e, type P3 } from './place4eKit';

/**
 * Les couleurs propres à l'Herbier, en plus des matières des Passeurs (`C4E`) : le verre clair de la verrière, mat et sans
 * reflet (retouche 1 : le gris-bleu d'avant se lisait comme de la tôle), un vert d'eau pâle, bien plus clair que la
 * fonte, sur le berceau ; un cran plus sombre sur les pieds droits et les pignons, où l'on voit le dedans à travers ; les
 * bacs et leurs pousses devinés derrière les pieds droits, d'un brun et d'un vert passés par le verre ; l'ombre de la
 * porte ; le grès gris des pots et des godets (`C4E`, jamais la terre cuite) ; les
 * verts des pousses et des plantes du dehors, sans fleur vive ; l'herbe sèche de la ruine ; le fond sec de la citerne et
 * son eau sombre, immobile.
 */
const C = {
  glass: 0xaecfcf,
  glassWall: 0x93b5b6,
  glassBac: 0x8a8c78,
  glassLeaf: 0x86a37a,
  hollow: 0x4a423e,
  sprout: 0x7e9050,
  leaf: 0x6a7a44,
  dry: 0x8c8458,
  dryBottom: 0x6e625a,
  water: 0x34505e,
  // L'horticultrice, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier vert-gris, chemise.
  boots: 0x55595a,
  apron: 0x6e7a5c,
  shirt: 0x8e8a7c,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site4e('herbier');

/** Le plan du sol, ajusté sous la serre, la citerne, la paillasse et l'allée : les Coteaux sont presque plats ici (à 0,2 près). */
const planeY = groundPlane4e(SITE.ground, [-10.5, 8.5], [-6.5, 5.5]);

/**
 * La serre : ses pignons (x d'ouest en est), le rayon de son berceau (sa demi-largeur, z du nord au sud), la hauteur de
 * ses pieds droits au-dessus du socle, le socle ; la section d'un arceau (sa profondeur, son épaisseur) ; les six
 * arceaux, dont les deux pignons ; la porte (sa demi-largeur, sa hauteur). Haute de 5,5 au plus, aérateur compris.
 */
const GH = { x0: -6, x1: 6, r: 3, leg: 1.6, socle: 0.4, rib: 0.16, ribT: 0.14, arches: [-6, -3.6, -1.2, 1.2, 3.6, 6], door: 0.6, doorH: 1.5 } as const;

/** Le dessus du socle, plat : le sol de la serre. */
const base = once(() => Math.max(...[GH.x0, GH.x1].flatMap((x) => [-GH.r, GH.r].map((z) => planeY(x, z)))) + GH.socle);

/** Les deux arceaux du bout est penchent dans la ruine (vers l'est, de tant). */
const LEAN = 0.24;

/**
 * Le profil d'un arceau, du pied nord au pied sud (z, y au-dessus du socle) et la normale vers le dehors en chaque
 * point : le pied droit, le berceau en six pans (retouche 2 : en quatre, de face, il se lisait comme une grange à toit
 * brisé), l'autre pied droit.
 */
const PROFILE: readonly { z: number; y: number; nz: number; ny: number }[] = [
  { z: -GH.r, y: 0, nz: -1, ny: 0 },
  ...[0, 30, 60, 90, 120, 150, 180].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { z: -GH.r * Math.cos(a), y: GH.leg + GH.r * Math.sin(a), nz: -Math.cos(a), ny: Math.sin(a) };
  }),
  { z: GH.r, y: 0, nz: 1, ny: 0 },
];

/** Le haut de la serre au-dessus du socle : le berceau, l'arceau, l'aérateur et le faîtage. */
const RIDGE = GH.leg + GH.r + GH.rib;

/** Les bacs du dedans : leur milieu, leur longueur (d'ouest en est), leur largeur, leur hauteur ; deux renversés dans la ruine. */
const BACS_IN = { at: [
  { x: -3.6, z: -1.3 },
  { x: -3.6, z: 1.3 },
  { x: 3.4, z: -1.3 },
  { x: 3.4, z: 1.3 },
] as const, len: 2.8, depth: 1.0, h: 0.5 } as const;

/** Les trois bacs du dehors, au nord, de part et d'autre de la porte : ils se voient à l'arrivée. */
const BACS_OUT = { at: [
  { x: -5.0, z: -4.6 },
  { x: -2.4, z: -4.6 },
  { x: 3.2, z: -4.1 },
] as const, len: 2.0, depth: 0.8, h: 0.45 } as const;

/** La paillasse de pierre, dehors contre le pignon ouest : son milieu, sa largeur (x), sa longueur (z), sa hauteur. */
const PAIL = { x: -7.0, z: 0, w: 0.9, len: 3.2, h: 0.9 } as const;

/** La citerne ronde de pierre, au sud-ouest : son milieu, son rayon, sa hauteur ; le socle de la pompe sur sa margelle. */
const CIT = { x: -8.8, z: 4.2, r: 1.1, h: 0.85, pump: { x: -8.0, z: 3.5 } } as const;

/** L'allée de terre noire, de la porte de la serre vers le pas de la porte du lieu : ses coudes, sa demi-largeur. */
const ALLEE = { path: [
  { x: 0, z: -3.95 },
  { x: 0, z: -5.6 },
  { x: 4.4, z: -5.6 },
] as const, half: 0.4 } as const;

/** La lanterne du chemin (les abords), au nord-est de la serre, hors du chemin. */
const PATH_LANTERN = { x: 7.6, z: -4.4, h: 1.35 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (intention, « Les caps ») : 225°, de la porte au nord-est, la serre de trois quarts, la mer au-delà. */
const DOOR_VIEW = capOf(225);

/** La vue d'arrivée basse, à hauteur de Kéo (comme aux Fabriques). */
const DOOR_FRAME = { height: -3, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du faîtage, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return base() + RIDGE + 1.5;
  },
  z: 0,
};

// ---------- La serre ----------

/** Un point d'un arceau : le point `k` du profil, décalé de `r` vers le dehors, à `x` ; penché vers l'est de `lean`. */
function archPoint(x: number, k: number, r: number, lean = 0): P3 {
  const p = PROFILE[k];
  const y = p.y + p.ny * r;
  return [x + y * Math.sin(lean), base() + y * Math.cos(lean), p.z + p.nz * r];
}

/** La normale vers le dehors du pan `k` du profil (entre ses points `k` et `k + 1`). */
function outOf(k: number): P3 {
  const a = PROFILE[k],
    c = PROFILE[k + 1];
  return [0, a.ny + c.ny, a.nz + c.nz];
}

/** Un arceau de fonte en berceau, à `x` : ses deux flancs, son dessus et son dessous, pan par pan (soixante-quatre triangles). */
function rib(b: FacetBuilder, x: number, color: number, lean = 0): void {
  const t = GH.ribT / 2,
    d = GH.rib;
  for (let k = 0; k < PROFILE.length - 1; k++) {
    const n = outOf(k);
    for (const s of [-1, 1]) quadOut(b, archPoint(x + s * t, k, 0, lean), archPoint(x + s * t, k + 1, 0, lean), archPoint(x + s * t, k + 1, d, lean), archPoint(x + s * t, k, d, lean), [s, 0, 0], color);
    quadOut(b, archPoint(x - t, k, d, lean), archPoint(x + t, k, d, lean), archPoint(x + t, k + 1, d, lean), archPoint(x - t, k + 1, d, lean), n, color);
    quadOut(b, archPoint(x - t, k, 0, lean), archPoint(x + t, k, 0, lean), archPoint(x + t, k + 1, 0, lean), archPoint(x - t, k + 1, 0, lean), [0, -n[1], -n[2]], color);
  }
}

/** Une vitre du berceau, sur le pan `k`, entre `xa` et `xb` ; `both` : ses deux faces (une vitre seule de la ruine). */
function pane(b: FacetBuilder, xa: number, xb: number, k: number, color: number, both = false): void {
  const r = GH.rib / 2;
  const q = [archPoint(xa, k, r), archPoint(xb, k, r), archPoint(xb, k + 1, r), archPoint(xa, k + 1, r)] as const;
  const n = outOf(k);
  quadOut(b, q[0], q[1], q[2], q[3], n, color);
  if (both) quadOut(b, q[0], q[1], q[2], q[3], [0, -n[1], -n[2]], color);
}

/** Un point d'un pied droit (le pan `k`, 0 au nord, `PROFILE.length - 2` au sud), à `x`, à la part `f` de sa hauteur (0 : le socle), décalé de `lift` vers le dehors. */
function legPoint(x: number, k: number, f: number, lift: number): P3 {
  const r = GH.rib / 2 + lift;
  const south = k !== 0;
  const lo = archPoint(x, south ? k + 1 : k, r),
    hi = archPoint(x, south ? k : k + 1, r);
  return [lo[0] + (hi[0] - lo[0]) * f, lo[1] + (hi[1] - lo[1]) * f, lo[2] + (hi[2] - lo[2]) * f];
}

/** Un morceau d'une vitre d'un pied droit `k`, entre `xa` et `xb`, de la part `fa` à la part `fb` de sa hauteur, décalé de `lift` vers le dehors. */
function legPane(b: FacetBuilder, xa: number, xb: number, k: number, fa: number, fb: number, color: number, lift = 0): void {
  quadOut(b, legPoint(xa, k, fa, lift), legPoint(xb, k, fa, lift), legPoint(xb, k, fb, lift), legPoint(xa, k, fb, lift), outOf(k), color);
}

/**
 * La hauteur des bacs et des pousses devinés derrière un pied droit, en part de sa hauteur : le haut du bord des bacs,
 * le haut de la bande des pousses, et la pointe de leurs touffes (trois par bac et par côté).
 */
const LEAF_BAND = { bac: 0.3, top: 0.5, tip: 0.72, tufts: 3 } as const;

/** Les pousses devinées, un rien devant la vitre (jamais deux faces l'une sur l'autre). */
const LEAF_LIFT = 0.004;

/**
 * Une vitre d'un pied droit, entre `xa` et `xb` : le verre du dedans, et devant les bacs, les pousses devinées à travers
 * (une bande verte, ses touffes en dents) : sans transparence ni appel de plus, le verre se lit par ce qu'il laisse voir.
 */
function legGlass(b: FacetBuilder, xa: number, xb: number, k: number): void {
  const B = BACS_IN;
  const spans = B.at
    .filter((at) => (k === 0 ? at.z < 0 : at.z > 0))
    .map((at) => [Math.max(xa, at.x - B.len / 2), Math.min(xb, at.x + B.len / 2)] as const)
    .filter(([a, c]) => c - a > 0.2);
  legPane(b, xa, xb, k, 0, 1, C.glassWall);
  for (const [a, c] of spans) {
    legPane(b, a, c, k, 0, LEAF_BAND.bac, C.glassBac, LEAF_LIFT);
    legPane(b, a, c, k, LEAF_BAND.bac, LEAF_BAND.top, C.glassLeaf, LEAF_LIFT);
    const w = (c - a) / LEAF_BAND.tufts;
    for (let i = 0; i < LEAF_BAND.tufts; i++) {
      const x0 = a + i * w;
      const tip = legPoint(x0 + (0.4 + 0.2 * (i % 2)) * w, k, LEAF_BAND.tip - 0.06 * (i % 2), LEAF_LIFT);
      triOut(b, legPoint(x0 + 0.1 * w, k, LEAF_BAND.top, LEAF_LIFT), legPoint(x0 + 0.9 * w, k, LEAF_BAND.top, LEAF_LIFT), tip, outOf(k), C.glassLeaf);
    }
  }
}

/** Un triangle tourné vers `out`, quel que soit l'ordre de ses coins. */
function triOut(b: FacetBuilder, a: P3, c: P3, d: P3, out: P3, color: number): void {
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
    v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/** Le socle de pierre grise, sauf son angle sud-est (fendu dans la ruine, réparé avec le corps) ; le seuil devant la porte. */
function socle(b: FacetBuilder): void {
  const h = base() - SINK;
  b.box({ x: -0.8, y: SINK, z: 0 }, [10.8, h, 2 * GH.r + 0.4], C4E.stoneShade, C4E.stoneSun);
  b.box({ x: 5.4, y: SINK, z: -1.1 }, [1.6, h, 4.2], C4E.stoneShade, C4E.stoneSun);
  b.box({ x: 0, y: SINK, z: -GH.r - 0.55 }, [1.5, (base() + planeY(0, -3.6)) / 2 - SINK, 0.7], C4E.stoneShade, C4E.stone);
}

/** L'angle sud-est du socle, entier (le corps) ou fendu, affaissé, un éclat tombé à côté (la ruine). */
function socleCorner(b: FacetBuilder, whole: boolean): void {
  const h = base() - SINK;
  if (whole) {
    b.box({ x: 5.4, y: SINK, z: 2.1 }, [1.6, h, 1.8], C4E.stoneShade, C4E.stoneSun);
    return;
  }
  b.box({ x: 5.45, y: SINK - 0.18, z: 2.15, yaw: 0.08, pitch: 0.1 }, [1.5, h, 1.7], C4E.stoneShade, C4E.stone);
  b.box({ x: 6.9, y: planeY(6.9, 3.0) - 0.15, z: 3.0, yaw: 0.7, pitch: 0.3 }, [0.6, 0.4, 0.5], C4E.stoneShade, C4E.stone);
}

/** Le cadre de la porte, au milieu du long côté nord : deux montants et leur linteau, de fer. */
function doorFrame(b: FacetBuilder, color: number): void {
  const z = -GH.r - GH.rib / 2;
  for (const s of [-1, 1]) b.box({ x: s * (GH.door + 0.06), y: base(), z }, [0.12, GH.doorH, 0.2], color);
  b.box({ x: 0, y: base() + GH.doorH, z }, [2 * GH.door + 0.24, 0.1, 0.2], color);
}

/** La lanterne de l'horticultrice, pendue à l'arceau de la porte par une potence de fer : seule allumée dans la ruine. */
function doorLantern(b: FacetBuilder): void {
  const y = base() + GH.leg + 0.06,
    z = -GH.r - GH.rib;
  b.beam({ x: 0, y, z }, { x: 0, y, z: z - 0.5 }, 0.07, C4E.iron);
  lantern(b, { x: 0, y: y - 0.02, z: z - 0.5 }, true);
}

/** La verrière entière : les vitres du berceau, les deux pignons, l'ombre de la porte ouverte. */
function glazing(b: FacetBuilder): void {
  const t = GH.ribT / 2;
  const xs = GH.arches;
  for (let i = 0; i < xs.length - 1; i++)
    for (let k = 0; k < PROFILE.length - 1; k++) {
      const xa = xs[i] + t,
        xb = xs[i + 1] - t;
      // Le pan du pied nord de la travée de la porte : deux vitres, de part et d'autre de la porte.
      if (k === 0 && xa < 0 && xb > 0) {
        legPane(b, xa, -GH.door - 0.12, k, 0, 1, C.glassWall);
        legPane(b, GH.door + 0.12, xb, k, 0, 1, C.glassWall);
      } else if (k === 0 || k === PROFILE.length - 2) legGlass(b, xa, xb, k);
      else pane(b, xa, xb, k, C.glass);
    }
  // Les pignons : le verre du dedans, comme les pieds droits.
  for (const x of [GH.x0, GH.x1]) {
    const pts = PROFILE.map((_, k) => archPoint(x, k, 0));
    for (let k = 1; k < pts.length - 1; k++) triOut(b, pts[0], pts[k], pts[k + 1], [Math.sign(x), 0, 0], C.glassWall);
  }
  // Les pannes de fer, d'un pignon à l'autre, à chaque pli du berceau : la verrière se lit en vitres, et non d'un seul pan.
  for (let k = 1; k < PROFILE.length - 1; k++) {
    const [, y, z] = archPoint(0, k, GH.rib / 2 + 0.03);
    b.beam({ x: GH.x0, y, z }, { x: GH.x1, y, z }, 0.07, C4E.iron);
  }
  const z = -GH.r - GH.rib - 0.01;
  quadOut(b, [-GH.door, base(), z], [GH.door, base(), z], [GH.door, base() + GH.doorH, z], [-GH.door, base() + GH.doorH, z], [0, 0, -1], C.hollow);
}

// ---------- Les bacs, la paillasse, la citerne ----------

/**
 * Un bac de bois plein de terre noire, à `at`, à `y` (son pied) : un cadre de bois clair, pour que la terre sombre s'en
 * détache (restes du monde ouvert du 4e, point 1).
 */
function bac(b: FacetBuilder, at: Vec2, y: number, len: number, depth: number, h: number, wood: number, earth: number): void {
  b.box({ x: at.x, y: y - 0.1, z: at.z }, [len, h + 0.1, depth], wood, earth);
}

/** Des pousses en touffes pointues, en rangs : `rows` rangs de `per` le long d'un bac, à `y` (le dessus de sa terre). */
function tufts(b: FacetBuilder, at: Vec2, y: number, len: number, rows: readonly number[], per: number, h: number, r: number, color: number): void {
  for (const dz of rows) for (let i = 0; i < per; i++) b.prism({ x: at.x - len / 2 + (len * (i + 0.5)) / per, y, z: at.z + dz, yaw: i * 0.7 }, r, 0, h, 3, color);
}

/** La paillasse : la dalle et ses quatre pieds de pierre (le corps), ou penchée sur un pied cassé (la ruine). */
function paillasse(b: FacetBuilder, whole: boolean): void {
  const P = PAIL;
  const g = planeY(P.x, P.z);
  const legs = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const;
  if (whole) {
    for (const [sx, sz] of legs) b.box({ x: P.x + sx * (P.w / 2 - 0.14), y: g - 0.2, z: P.z + sz * (P.len / 2 - 0.25) }, [0.2, P.h + 0.2, 0.2], C4E.stoneShade, C4E.stone);
    b.box({ x: P.x, y: g + P.h, z: P.z }, [P.w, 0.12, P.len], C4E.stoneShade, C4E.stoneSun);
    // Deux pots de grès debout au bout nord.
    for (const dz of [-1.2, -0.75]) b.prism({ x: P.x, y: g + P.h + 0.12, z: P.z + dz }, 0.13, 0.17, 0.24, 5, C4E.stoneware, C4E.earth);
    return;
  }
  // Le pied sud-est cassé : la dalle penche vers le sud, son bord posé sur le moignon.
  for (const [sx, sz] of legs.slice(0, 3)) b.box({ x: P.x + sx * (P.w / 2 - 0.14), y: g - 0.2, z: P.z + sz * (P.len / 2 - 0.25) }, [0.2, (sz < 0 ? P.h : P.h - 0.35) + 0.2, 0.2], C4E.stoneShade, C4E.stone);
  b.box({ x: P.x + P.w / 2 - 0.14, y: g - 0.2, z: P.z + P.len / 2 - 0.25 }, [0.2, 0.5, 0.2], C4E.stoneShade, C4E.stone);
  b.box({ x: P.x, y: g + P.h - 0.2, z: P.z, pitch: 0.2 }, [P.w, 0.12, P.len], C4E.stoneShade, C4E.stoneSun);
  // Les pots de grès gris renversés au pied.
  for (const [dx, dz, yaw] of [
    [-0.8, 1.9, 0.4],
    [0.9, 2.3, 1.9],
  ] as const)
    b.prism({ x: P.x + dx, y: planeY(P.x + dx, P.z + dz) + 0.15, z: P.z + dz, yaw, pitch: Math.PI / 2 }, 0.13, 0.17, 0.24, 5, C4E.stoneware, C4E.stonewareTop);
}

/** La citerne ronde et son fond sec ; le socle de la pompe sur sa margelle, et le signe de l'absence : toujours là. */
function cistern(b: FacetBuilder): void {
  const g = planeY(CIT.x, CIT.z);
  b.prism({ x: CIT.x, y: SINK, z: CIT.z }, CIT.r, CIT.r, g + CIT.h - SINK, 8, C4E.stoneShade, C.dryBottom);
  const P = CIT.pump;
  const top = g + CIT.h;
  b.box({ x: P.x, y: top - 0.05, z: P.z, yaw: 0.6 }, [0.6, 0.4, 0.6], C4E.stoneShade, C4E.stoneSun);
  emptyMount(b, { x: P.x, y: top + 0.35, z: P.z }, 0.6);
}

// ---------- Le modèle ----------

function model(add: AddPiece): void {
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le socle (sauf son angle fendu), le seuil ; la lanterne de l'horticultrice (la seule allumée de la
  // ruine) ; la citerne, le socle de la pompe et le signe de l'absence ; les trois bacs du dehors, vides.
  add('ruine', 0, (b) => {
    socle(b);
    doorLantern(b);
    cistern(b);
    for (const at of BACS_OUT.at) bac(b, at, planeY(at.x, at.z), BACS_OUT.len, BACS_OUT.depth, BACS_OUT.h, C4E.wood, C4E.earth);
  });

  // ---- La ruine ----
  // Le corps la relève : la charpente d'un brun éteint, les deux arceaux du bout est penchés ; le cadre de la porte ; les
  // bacs à moitié vides et leurs herbes sèches, deux renversés, leur terre en éventail ; la paillasse penchée et ses pots ;
  // l'angle du socle fendu.
  add(
    'ruine',
    0,
    (b) => {
      for (const x of GH.arches) rib(b, x, C4E.rustDull, x > 3 ? LEAN : 0);
      doorFrame(b, C4E.rustDull);
      const B = BACS_IN;
      for (const k of [0, 3]) {
        const at = B.at[k];
        bac(b, at, base(), B.len, B.depth, B.h - 0.15, C4E.wood, C4E.earth);
        tufts(b, at, base() + B.h - 0.15, B.len, [0], 2, 0.3, 0.12, C.dry);
      }
      // Renversés sur leur long côté, leur ouverture vers l'allée du milieu ; la terre coulée devant.
      for (const k of [1, 2]) {
        const at = B.at[k];
        const s = Math.sign(at.z);
        b.box({ x: at.x + 0.2, y: base(), z: at.z + s * 0.35, yaw: 0.1 * s }, [B.len, B.depth - 0.05, B.h], C4E.woodShade, C4E.wood);
        const y = base() + 0.02;
        triOut(b, [at.x - 1.0, y, at.z], [at.x + 1.3, y, at.z], [at.x + 0.3, y, at.z - s * 1.1], [0, 1, 0], C4E.earth);
        triOut(b, [at.x - 1.0, y, at.z], [at.x + 0.3, y, at.z - s * 1.1], [at.x - 0.6, y, at.z - s * 0.8], [0, 1, 0], C4E.earthTop);
      }
      paillasse(b, false);
      socleCorner(b, false);
    },
    corps,
  );
  // Le haut la relève : trois vitres en haut, côté ouest (les deux pans du faîte) ; le tas de verre tombé au pied du pignon est.
  add(
    'ruine',
    0,
    (b) => {
      const t = GH.ribT / 2,
        xs = GH.arches;
      pane(b, xs[0] + t, xs[1] - t, 3, C.glass, true);
      pane(b, xs[0] + t, xs[1] - t, 4, C.glass, true);
      pane(b, xs[1] + t, xs[2] - t, 3, C.glassWall, true);
      for (const [dz, yaw, pitch] of [
        [-0.9, 0.3, 0.25],
        [0.1, 1.2, -0.2],
        [0.7, 2.2, 0.35],
      ] as const)
        b.box({ x: 7.2, y: planeY(7.2, dz) - 0.08, z: dz, yaw, pitch }, [0.9, 0.06, 0.6], C.glassWall, C.glass);
    },
    haut,
  );
  // Les abords la relèvent : la gouttière décrochée qui pend ; l'herbe sèche des bacs du dehors ; l'éclat de la margelle.
  add(
    'ruine',
    0,
    (b) => {
      const z = GH.r + GH.rib + 0.1;
      b.beam({ x: GH.x0 - 0.2, y: base() + GH.leg, z }, { x: -3.4, y: planeY(-3.4, z + 0.6) + 0.12, z: z + 0.6 }, 0.12, C4E.rustDull);
      for (const at of BACS_OUT.at) tufts(b, at, planeY(at.x, at.z) + BACS_OUT.h, BACS_OUT.len, [0], 1, 0.3, 0.14, C.dry);
      b.box({ x: CIT.x - 1.4, y: planeY(CIT.x - 1.4, CIT.z + 0.4) - 0.1, z: CIT.z + 0.4, yaw: 0.5, pitch: 0.2 }, [0.5, 0.32, 0.35], C4E.stoneShade, C4E.stone);
    },
    abords,
  );

  // ---- Le corps : l'angle du socle réparé ; les arceaux redressés, en fer bruni, et le cadre de la porte ; les quatre bacs
  // relevés, pleins de terre noire, plantés de pousses en rangs ; la paillasse sur ses quatre pieds, deux pots de grès.
  add(0, 0, (b) => {
    socleCorner(b, true);
    for (const x of GH.arches) rib(b, x, C4E.iron);
    doorFrame(b, C4E.iron);
    const B = BACS_IN;
    for (const at of B.at) {
      bac(b, at, base(), B.len, B.depth, B.h, C4E.newWood, C4E.earth);
      tufts(b, at, base() + B.h, B.len, [-0.25, 0.25], 4, 0.28, 0.09, C.sprout);
    }
    paillasse(b, true);
  });
  // ---- Le haut : la verrière entière ; l'aérateur de verre le long du faîte et le faîtage de fer ; la lanterne du pignon
  // est, allumée dès sa pose.
  add(1, 0, (b) => {
    glazing(b);
    const top = base() + RIDGE;
    b.box({ x: 0, y: top - 0.04, z: 0 }, [10.4, 0.16, 0.7], C.glassWall, C.glass);
    b.box({ x: 0, y: top + 0.12, z: 0 }, [12.2, 0.06, 0.2], C4E.iron, C4E.ironTop);
    const y = base() + GH.leg + 0.9,
      x = GH.x1 + GH.ribT / 2;
    b.beam({ x, y, z: 0 }, { x: x + 0.5, y, z: 0 }, 0.07, C4E.iron);
    lantern(b, { x: x + 0.5, y: y - 0.02, z: 0 }, true);
  });
  // ---- Les abords : la gouttière raccrochée et sa descente dans la citerne ; la citerne pleine d'eau sombre ; les bacs du
  // dehors plantés, chacun d'une forme (touffes basses, tiges hautes, feuilles larges) ; l'allée de terre noire bordée de
  // pierre ; la lanterne du chemin, au nord-est.
  add(2, 0, (b) => {
    const z = GH.r + GH.rib + 0.1;
    b.beam({ x: GH.x0 - 0.2, y: base() + GH.leg, z }, { x: 2, y: base() + GH.leg, z }, 0.12, C4E.iron);
    const g = planeY(CIT.x, CIT.z);
    b.beam({ x: GH.x0 - 0.2, y: base() + GH.leg, z }, { x: CIT.x + 0.75, y: g + CIT.h + 0.3, z: CIT.z - 0.5 }, 0.1, C4E.iron);
    b.plate({ x: CIT.x, y: g + CIT.h + 0.01, z: CIT.z, pitch: -Math.PI / 2 }, Array.from({ length: 8 }, (_, k) => [0.9 * Math.cos((k * Math.PI) / 4), 0.9 * Math.sin((k * Math.PI) / 4)] as const), C.water);
    const [low, tall, broad] = BACS_OUT.at;
    const top = (at: Vec2) => planeY(at.x, at.z) + BACS_OUT.h;
    tufts(b, low, top(low), BACS_OUT.len, [-0.15, 0.15], 2, 0.22, 0.2, C.leaf);
    for (let i = 0; i < 3; i++) {
      const x = tall.x - 0.6 + i * 0.6;
      b.box({ x, y: top(tall), z: tall.z }, [0.06, 0.85 + 0.1 * i, 0.06], C.leaf);
      b.prism({ x, y: top(tall) + 0.85 + 0.1 * i, z: tall.z }, 0.08, 0, 0.18, 3, C.sprout);
    }
    for (const [dx, yaw, pitch] of [
      [-0.55, 0.3, 0.35],
      [0, 1.4, -0.3],
      [0.55, 2.5, 0.4],
    ] as const)
      b.box({ x: broad.x + dx, y: top(broad) + 0.12, z: broad.z, yaw, pitch }, [0.55, 0.04, 0.32], C.leaf, C.sprout);
    allee(b);
    const p = PATH_LANTERN;
    postLantern(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

/** L'allée de terre noire, de la porte de la serre au pas de la porte du lieu, bordée de pierre de part et d'autre. */
function allee(b: FacetBuilder): void {
  const A = ALLEE;
  for (let i = 0; i < A.path.length - 1; i++) {
    const a = A.path[i],
      c = A.path[i + 1];
    const len = Math.hypot(c.x - a.x, c.z - a.z);
    const nx = -(c.z - a.z) / len,
      nz = (c.x - a.x) / len;
    // Un pas de plus au coude, pour que les deux tronçons se rejoignent.
    const ex = ((c.x - a.x) / len) * A.half,
      ez = ((c.z - a.z) / len) * A.half;
    const p = (q: Vec2, s: number, e: number): P3 => [q.x + nx * A.half * s + ex * e, planeY(q.x, q.z) + 0.03, q.z + nz * A.half * s + ez * e];
    quadOut(b, p(a, -1, 0), p(c, -1, i === 0 ? 1 : 0), p(c, 1, i === 0 ? 1 : 0), p(a, 1, 0), [0, 1, 0], C4E.earth);
    for (const s of [-1, 1]) {
      const m = { x: (a.x + c.x) / 2 + nx * (A.half + 0.08) * s, z: (a.z + c.z) / 2 + nz * (A.half + 0.08) * s };
      b.box({ x: m.x, y: planeY(m.x, m.z) - 0.1, z: m.z, yaw: Math.atan2(-(c.z - a.z), c.x - a.x) }, [len + (i === 0 ? A.half : 0), 0.24, 0.16], C4E.stoneShade, C4E.stone);
    }
  }
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 3) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  cells: { x: PAIL.x + 0.1, z: PAIL.z + PAIL.len / 2 + 0.45 },
  heredity: { x: BACS_OUT.at[1].x + 0.5, z: BACS_OUT.at[1].z - BACS_OUT.depth / 2 - 0.22 },
  evolution: { x: GH.x1 + 0.5, z: 0.9 },
} as const;

/** Un arrosoir de fer gris, debout au bout sud de la paillasse (Cellules et nutrition). */
function wateringCan(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.cells;
    const y = planeY(x, z);
    l.prism({ x, y, z }, 0.17, 0.15, 0.32, 6, C4E.iron, C4E.ironTop);
    l.beam({ x: x + 0.12, y: y + 0.1, z }, { x: x + 0.42, y: y + 0.36, z }, 0.06, C4E.iron);
    l.box({ x: x - 0.04, y: y + 0.32, z }, [0.22, 0.12, 0.04], C4E.iron);
  });
}

/** Un sac de toile ouvert, plein de terre noire, adossé au bac du dehors (Reproduction et gènes). */
function soilSack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.heredity;
    l.prism({ x, y: planeY(x, z), z, yaw: 0.3, pitch: 0.12 }, 0.26, 0.22, 0.44, 6, C4E.canvasShade, C4E.earth);
  });
}

/** Une bêche et un râteau debout côte à côte, avec un écart, contre le socle est (Biodiversité et évolution). */
function spadeAndRake(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.evolution;
    const y = planeY(x, z);
    // La bêche : son fer au pied, son manche penché contre le socle.
    l.box({ x, y, z, pitch: 0, yaw: Math.PI / 2 }, [0.26, 0.32, 0.04], C4E.iron, C4E.ironTop);
    l.box({ x: x - 0.06, y: y + 0.3, z, yaw: Math.PI / 2 }, [0.05, 1.0, 0.05], C4E.newShade, C4E.newWood);
    // Le râteau, un pas plus au sud : son manche, sa tête en haut.
    const zr = z + 0.55;
    l.box({ x: x - 0.06, y, z: zr }, [0.05, 1.25, 0.05], C4E.newShade, C4E.newWood);
    l.box({ x: x - 0.06, y: y + 1.25, z: zr }, [0.08, 0.06, 0.42], C4E.iron, C4E.ironTop);
  });
}

/** Les trois traces, une par mission, chacune avec sa partie : le corps, le haut, les abords. */
const TRACES = {
  'cells-nutrition': { at: TRACE_SPOTS.cells, lift: 1, stage: 0, row: 0, draw: wateringCan },
  heredity: { at: TRACE_SPOTS.heredity, lift: 1, stage: 1, row: 0, draw: soilSack },
  'species-evolution': { at: TRACE_SPOTS.evolution, lift: 1, stage: 2, row: 0, draw: spadeAndRake },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (intention, § 3) : au sud-ouest, vers la mer, le cône dans le dos. */
const SCENE_START = capOf(225);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'horticultrice). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : devant la paillasse, au bout ouest ; le bout de la serre à gauche. */
const SCENE_SPOT = { dx: -10.6, dz: -1.6, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de l'horticultrice au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point : la terre, au plan du lieu. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** L'horticultrice en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier vert-gris, chemise. */
function gardener(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.24, 0.42, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** La dalle des godets sur ses deux pieds de pierre : sa hauteur, à l'échelle 1 ; un godet choisi se soulève d'un cran. */
const SLAB = { height: 0.55, lift: 0.3, pot: 0.42 } as const;

/** Un godet de grès gris plein de terre noire, et sa pousse : tous pareils (une forme par réponse se lirait comme un indice). */
function godet(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.15 * s, 0.19 * s, 0.24 * s, 6, C4E.stoneware, C4E.earth);
  b.prism({ x: at.x, y: at.y + 0.24 * s, z: at.z }, 0.07 * s, 0, 0.18 * s, 3, C.sprout);
}

export const HERBIER: PlaceArt = {
  role: 'L’horticultrice',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 1 + 1 + 1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse : la terre est plate, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la serre, la paillasse et les bacs sont au lieu ; les abords (./herbierSurroundings.ts) ajoutent ce
  // qui cadre. Il reste l'horticultrice en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) gardener(b, at, sphere);
  },
  answer: {
    size: { height: SLAB.height + SLAB.lift + SLAB.pot, half: 0.3 },
    facing: true,
    // Une dalle de pierre sur deux pieds, sous la rangée des godets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + SLAB.height * s;
      b.box({ x: mid, y: top - 0.1 * s, z }, [span + 0.7, 0.1 * s, 0.55 * s], C4E.stoneShade, C4E.stoneSun);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.2, top - 0.1 * s - foot, 0.4 * s], C4E.stoneShade, C4E.stone);
      }
    },
    // Un godet planté, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      godet(b, { x: at.x, y: at.y + (SLAB.height + (picked ? SLAB.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les trois missions en R : la terre seule, rien de l'item ; les godets portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers la serre.
  exit: { x: SITE.door.x - 0.7, z: SITE.door.z + 0.7 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de l'Herbier, pour les tests et ses abords : la serre, ses bacs, la paillasse, la citerne, la caméra. */
export const HERBIER_LAYOUT = {
  greenhouse: GH,
  glass: { roof: C.glass, wall: C.glassWall, bac: C.glassBac, leaf: C.glassLeaf },
  get base() {
    return base();
  },
  ridge: RIDGE,
  bacsIn: BACS_IN,
  bacsOut: BACS_OUT,
  paillasse: PAIL,
  cistern: CIT,
  allee: ALLEE,
  planeY,
  pathLantern: PATH_LANTERN,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
