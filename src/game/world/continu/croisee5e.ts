// La Croisée (GD-22, lot 7 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée par
// le mainteneur) : « un carrefour de cordes dans la canopée : deux chemins se ressemblent, il faut prendre le bon ». Le
// cœur, sans figure, est le tronc géant : droit et large, vivant, qui monte au-dessus de sa plateforme ronde et se perd
// dans une couronne de canopée à pans ; à son pied, des racines en arceaux où se loge la cabane de la cordière, sur
// pilotis, au bord d'une eau calme et de roseaux pâles. De la plateforme part la fourche en Y : deux passerelles jumelles
// partent ensemble du bord avant, à un pas l'une de l'autre, s'écartent à 45° de l'axe de la caméra et MONTENT de 2 vers
// deux palétuviers géants qui cadrent le lieu (un Y de la porte comme de près) ; la troisième part de derrière le tronc,
// en sens contraire, vers un tronc du fond. Chacune finit sur un petit palier de planches accroché à son tronc, sous sa
// canopée. Rien ne se croise. Kéo marche en bas (le pont de planches, le rond-point) ;
// la plateforme, l'escalier en spirale et les passerelles sont un décor haut, sur les côtés et derrière le tronc.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier, jamais un portique. La moitié gauche de la plateforme est
// tombée (ses planches et deux morceaux de garde-corps à plat dans l'eau, sous le vide) ; la moitié qui tient s'affaisse
// vers l'avant et montre ses planches couchées, deux planches cassées en travers, les deux ancrages vides du treuil
// (parti chez les Ferrailleurs), un bout de corde qui pend. La passerelle gauche, coupée au ras du bord, pend le long de
// ses cordes comme une échelle de corde molle jusqu'à l'eau, où gît son tablier ; la droite garde la moitié de ses
// planches, qui plongent un peu, son bout pend ; la troisième gît dans les roseaux. Les premières marches de l'escalier
// gisent à côté du pont, coupé d'un trou d'eau ; le haut de la spirale tient au tronc. La cabane penche vers la droite,
// en bois usé, un pan de mur manque à côté de la porte ; la moitié de son toit est affaissée à plat, deux bottes de
// roseaux dessous ; sa lanterne reste allumée (la cordière vit là : la seule lumière de la ruine), deux autres pendent
// éteintes dans les racines ; le poteau à deux flèches est couché.
// Cinq parties, une trace chacune, posée avec sa partie (3+1+1, `row`) : le poteau à deux flèches jumelles, une feuille
// et un poisson (le corps, 1 sur 3) ; le gros nœud tressé pendu à une pile (2 sur 3) ; les deux portillons jumeaux, l'un
// plein, l'autre à barreaux (3 sur 3) ; les trois fanions brique sur le mât (le haut) ; le séchoir et ses écheveaux au
// bord du ponton de roseaux (les abords). Rien à lire dans la 3D. Code pur (placeArt.ts).
import { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { FOREST_COLORS, heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

/**
 * Le roseau des Roselières, une terre, un roseau (le même aux Instants, lot 8) : un paille chaud et pâle, deux tons, loin
 * du bleu-vert de l'eau ; il se lit par sa forme (des touffes droites) et sa place (au bord de l'eau), jamais par sa
 * seule couleur.
 */
export const ROSELIERES_REED = { reed: 0xd3bf86, reedShade: 0xb9a46c } as const;

/**
 * Les couleurs de la Croisée : le bois des Passeurs (neuf, usé), la corde, le tronc vivant et sa couronne (la famille des
 * palétuviers), l'eau calme des Roselières (`#1E5452` au cœur, `#2B6A62` aux rives), le roseau, le bronze des seules
 * ferrures, le vert-de-gris du motif des racines ; les fanions d'un brique sourd et mat ; la seule lumière, l'ocre de la
 * lanterne, et la vitre éteinte `#BFC4B8`.
 */
const C = {
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  /** Le joint des planches usées de la plateforme qui tient : un cran sous le bois usé, pour qu'elles se lisent couchées. */
  wornSeam: 0x8f8269,
  plank: COLORS_5E.plank,
  plankShade: COLORS_5E.plankShade,
  door: 0x7d6650,
  rope: 0xd8c49a,
  ropeShade: 0xbfa97c,
  trunk: 0x7d6e5a,
  root: FOREST_COLORS.root,
  canopy: FOREST_COLORS.canopy,
  canopyTop: FOREST_COLORS.canopyTop,
  water: COLORS_5E.water,
  waterShallow: COLORS_5E.waterShallow,
  reed: ROSELIERES_REED.reed,
  reedShade: ROSELIERES_REED.reedShade,
  bronze: 0xb8954f,
  verdigris: 0x6f9a8a,
  lantern: COLORS_5E.lantern,
  glassOff: 0xbfc4b8,
  flag: 0x9a5b4a,
  // Les pictogrammes des flèches : un brun presque noir, un contraste de valeur fort avec le bois neuf du panneau.
  picto: 0x2e241c,
  // La cordière, en pion (son modèle 3D prend sa place, ./habitants.ts), dans les couleurs de son modèle : tunique verte,
  // manches orangées, pantalon bleu nuit, foulard, bottes.
  shirt: 0x6f9a3e,
  sleeves: 0xc8703c,
  skirt: 0x2f3f5a,
  scarf: 0x8a6a52,
  boots: 0x55595a,
  head: 0xe3b48a,
} as const;

// ---------- Les volumes de base, au plus juste ----------

/** Un point de l'espace, depuis un point et un écart. */
const add3 = (p: Vec3, dx: number, dy: number, dz: number): Vec3 => ({ x: p.x + dx, y: p.y + dy, z: p.z + dz });

/**
 * Une corde (ou une racine, un poteau mince) tendue entre deux points : un tube à trois pans, sans bouts. Six triangles
 * (une poutre en pavé en coûte douze).
 */
function cord(b: FacetBuilder, a: Vec3, c: Vec3, t: number, color: number): void {
  const dx = c.x - a.x,
    dy = c.y - a.y,
    dz = c.z - a.z;
  const len = Math.hypot(dx, dy, dz) || 1e-6;
  const d = [dx / len, dy / len, dz / len];
  const ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u0 = [d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]];
  const ul = Math.hypot(u0[0], u0[1], u0[2]);
  const u = u0.map((v) => v / ul);
  const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const ring = (p: Vec3) =>
    [0, 1, 2].map((k) => {
      const ang = (2 * Math.PI * k) / 3;
      const cu = (Math.cos(ang) * t) / 2,
        sv = (Math.sin(ang) * t) / 2;
      return [p.x + cu * u[0] + sv * v[0], p.y + cu * u[1] + sv * v[1], p.z + cu * u[2] + sv * v[2]] as const;
    });
  const A = ring(a),
    B = ring(c);
  for (let k = 0; k < 3; k++) {
    const n = (k + 1) % 3;
    b.quad(A[k], A[n], B[n], B[k], color);
  }
}

/**
 * Un fût à `sides` pans, de `r0` en bas à `r1` en haut, sans dessus ni dessous (un tronc). `2 × sides` triangles ; sans
 * le pan `skip` s'il est donné (un mur qui manque).
 */
function tube(b: FacetBuilder, x: number, z: number, y0: number, y1: number, r0: number, r1: number, sides: number, color: number, turn = 0, skip = -1): void {
  const ring = (r: number, y: number) => Array.from({ length: sides }, (_, k) => [x + r * Math.cos(turn + (2 * Math.PI * k) / sides), y, z + r * Math.sin(turn + (2 * Math.PI * k) / sides)] as const);
  const lo = ring(r0, y0),
    hi = ring(r1, y1);
  for (let k = 0; k < sides; k++) {
    if (k === skip) continue;
    const n = (k + 1) % sides;
    b.quad(lo[n], lo[k], hi[k], hi[n], color);
  }
}

/**
 * Dessine penché : `draw` dessine droit, puis le tout bascule de `angle` (en radians) autour de l'axe nord-sud qui passe
 * par `pivot` (x, y), le haut vers l'est (+x) ; normales comprises. Pas un triangle de plus.
 */
function leaning(b: FacetBuilder, pivot: { x: number; y: number }, angle: number, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  const f = l.build();
  const c = Math.cos(angle),
    s = Math.sin(angle);
  for (let i = 0; i < f.positions.length; i += 3) {
    const dx = f.positions[i] - pivot.x,
      dy = f.positions[i + 1] - pivot.y;
    f.positions[i] = pivot.x + dx * c + dy * s;
    f.positions[i + 1] = pivot.y - dx * s + dy * c;
    const nx = f.normals[i],
      ny = f.normals[i + 1];
    f.normals[i] = nx * c + ny * s;
    f.normals[i + 1] = -nx * s + ny * c;
  }
  b.append(f);
}

/**
 * Une bande de planches à plat entre deux points (un tablier, un palier, une planche tombée) : son dessus, son dessous et
 * ses deux longs côtés, de largeur `w` et d'épaisseur `t`. Huit triangles : une seule longue facette, jamais latte à latte.
 */
function strip(b: FacetBuilder, a: Vec3, c: Vec3, w: number, t: number, color: number, top: number = color): void {
  const dx = c.x - a.x,
    dz = c.z - a.z;
  const l = Math.hypot(dx, dz) || 1e-6;
  const nx = (-dz / l) * (w / 2),
    nz = (dx / l) * (w / 2);
  const p = (q: Vec3, s: number, dy: number) => [q.x + s * nx, q.y + dy, q.z + s * nz] as const;
  const [a0, a1, c0, c1] = [p(a, -1, 0), p(a, 1, 0), p(c, -1, 0), p(c, 1, 0)];
  const [d0, d1, e0, e1] = [p(a, -1, -t), p(a, 1, -t), p(c, -1, -t), p(c, 1, -t)];
  b.quad(a0, a1, c1, c0, top);
  b.quad(d0, e0, e1, d1, color);
  b.quad(a1, d1, e1, c1, color);
  b.quad(a0, c0, e0, d0, color);
}

/** Le cap d'un pavé dont le grand côté (x) va de `a` vers `b`. */
const yawOf = (a: Vec2, b: Vec2): number => Math.atan2(-(b.z - a.z), b.x - a.x);

/** Le point à l'angle `a` (en radians, 0 vers l'est, π/2 vers le sud) et au rayon `r` d'un centre. */
const around = (c: Vec2, a: number, r: number): Vec2 => ({ x: c.x + r * Math.cos(a), z: c.z + r * Math.sin(a) });

const deg = (d: number): number => (d * Math.PI) / 180;

/**
 * Une lanterne pendue : sa corde, sa vitre à six pans (éteinte, ou d'ocre, sans ombre), son chapeau de bronze, à
 * l'échelle `s`. Trente triangles.
 */
function lantern(b: FacetBuilder, at: Vec3, lit: boolean, s = 1): void {
  const y = at.y - 0.3 - 0.42 * s;
  cord(b, at, { x: at.x, y: y + 0.42 * s, z: at.z }, 0.04, C.rope);
  b.prism({ x: at.x, y, z: at.z }, 0.18 * s, 0.18 * s, 0.42 * s, 6, lit ? C.lantern : C.glassOff);
  b.prism({ x: at.x, y: y + 0.42 * s, z: at.z, yaw: Math.PI / 6 }, 0.26 * s, 0, 0.18 * s, 6, C.bronze);
}

/**
 * Une touffe de roseaux des Roselières, droite : quatre tiges à trois pans, pointues, presque verticales, de deux tons.
 * Douze triangles.
 */
function reedTuft(b: FacetBuilder, at: Vec3, seed: number, s = 1): void {
  for (let k = 0; k < 4; k++) {
    const a = seed * 1.7 + (k * Math.PI) / 2;
    const h = (1.2 + 0.35 * (((seed * 7 + k * 3) % 5) / 4)) * s;
    b.prism({ x: at.x + 0.16 * s * Math.cos(a), y: at.y - 0.1, z: at.z + 0.16 * s * Math.sin(a), yaw: a, pitch: 0.07 }, 0.07 * s, 0, h, 3, k % 2 ? C.reedShade : C.reed);
  }
}

/**
 * Un palétuvier géant des abords, qui porte un palier (de la famille de ceux de la forêt, en moins de triangles) : son
 * fût à cinq pans, trois racines en arceaux (la première à `roots` radians, les autres à un tiers de tour), sa canopée
 * en deux plateaux à pans, dont le dessous est à `crown` au-dessus du sol (6 × `s` d'ordinaire ; plus haut, l'arbre
 * grandit pour couvrir un palier qui monte). Quatre-vingt-deux triangles.
 */
function giantMangrove(b: FacetBuilder, x: number, z: number, s: number, yaw: number, ground: SiteGround, roots = yaw + 0.5, crown = 6.0 * s): void {
  const y = ground.at(x, z);
  tube(b, x, z, y + 0.6 * s, y + crown + 0.4 * s, 0.5 * s, 0.34 * s, 5, FOREST_COLORS.trunk, yaw);
  for (let k = 0; k < 3; k++) {
    const a = roots + (k * 2 * Math.PI) / 3;
    const knee = { x: x + Math.cos(a) * 1.1 * s, y: y + 1.5 * s, z: z + Math.sin(a) * 1.1 * s };
    const foot = { x: x + Math.cos(a) * 2.0 * s, z: z + Math.sin(a) * 2.0 * s };
    cord(b, { x, y: y + 1.9 * s, z }, knee, 0.34 * s, C.root);
    cord(b, knee, { ...foot, y: ground.at(foot.x, foot.z) - 0.4 }, 0.3 * s, C.root);
  }
  b.prism({ x, y: y + crown, z, yaw }, 3.0 * s, 2.3 * s, 1.1 * s, 6, C.canopy, C.canopyTop);
  b.prism({ x: x + 0.5 * s, y: y + crown + 1.1 * s, z: z - 0.3 * s, yaw: yaw + 0.5 }, 2.0 * s, 0.8 * s, 0.9 * s, 6, C.canopy, C.canopyTop);
}

// ---------- Le plan du lieu ----------

/** Le tronc géant, dans le repère du lieu : son pied, son rayon au sol, sous la plateforme, au sommet ; son sommet. */
const TRUNK = { x: 0, z: -3.5, base: 1.45, mid: 1.15, top: 0.85, height: 11.6 } as const;

/** Le centre du tronc, au sol. */
const T: Vec2 = { x: TRUNK.x, z: TRUNK.z };

/** La plateforme ronde : sa hauteur, son rayon, ses dix pans ; le premier centré sur le sud (le bord avant). */
const PLATFORM = { y: 5.4, r: 3.3, sides: 10, thick: 0.2 } as const;

/** L'angle du milieu du pan `k` de la plateforme (le pan 0 regarde le sud, la caméra). */
const segmentMid = (k: number): number => Math.PI / 2 + (k * 2 * Math.PI) / PLATFORM.sides;

/**
 * Les pans de la plateforme qui tiennent dans la ruine : du fond à droite jusqu'au bord avant (vu de face, la moitié
 * droite, et le bord d'où partent les jumelles). Les autres (la moitié gauche) sont tombés.
 */
const HOLDING = [6, 7, 8, 9, 0] as const;

/** Les pans du garde-corps : sans le bord avant (les portillons des jumelles), le fond (la troisième) et l'arrivée de l'escalier. */
const RAILED = [1, 2, 3, 4, 7, 8, 9] as const;

/** La couronne du tronc : deux plateaux de canopée à pans, leur pied, leur rayon, leur hauteur. */
const CROWN = [
  { y: 9.4, r0: 4.4, r1: 3.2, h: 1.8, sides: 7, turn: 0.2 },
  { y: 11.2, r0: 3.1, r1: 1.2, h: 1.6, sides: 6, turn: 0.7 },
] as const;

/** Les racines en arceaux du tronc (leur angle) : la cabane se loge entre les deux de devant. */
const TRUNK_ROOTS = [40, 140, 215, 270, 325] as const;

/** La cabane de la cordière, sur pilotis, au pied du tronc : son centre, son plancher (rayon, hauteur), son mur, son toit. */
const CABIN = { x: 0, z: -0.55, deck: 1.7, floor: 0.55, wall: 1.12, wallTop: 2.0, roof: 1.75, roofH: 1.35 } as const;

/** Le pont de planches, de la rive avant (le rond-point) au plancher de la cabane : sa demi-largeur, ses deux bouts, sa hauteur. */
const BRIDGE = { half: 0.55, from: 1.2, to: 4.8, y: 0.45 } as const;

/** Dans la ruine, le trou d'eau du pont coupé, de 1 : de `from` à `to` (le long de z). */
const BRIDGE_GAP = { from: 2.4, to: 3.4 } as const;

/** Le rond-point des abords, au sol devant le pont, à la porte : son centre, son rayon, sa hauteur. */
const ROUND = { x: 0, z: 6.4, r: 2.6, y: 0.3 } as const;

/** Le ponton de roseaux, du bord ouest du rond-point vers l'eau : ses deux bouts, sa largeur. */
const PONTOON = { from: { x: -2.3, z: 5.4 }, to: { x: -5.0, z: 3.0 }, w: 1.2, y: 0.32 } as const;

/** Les quatre piles de la plateforme (leur angle autour du tronc, à 2,95 du centre). */
const PILES = [135, 45, 225, 315] as const;
const PILE_R = 2.95;

/**
 * Les marches de l'escalier en spirale : neuf, de 0,6 en 0,6, de l'avant gauche (à gauche de la cabane) vers le fond à
 * droite, où elles arrivent à la plateforme. Dans la ruine, les quatre premières sont tombées ; le haut tient.
 */
const STAIRS = { first: 135, step: 22, count: 9, fallen: 4, rise: 0.6, width: 1.0, depth: 0.5 } as const;

/**
 * Une passerelle : l'angle de son départ au bord de la plateforme, son cap, sa portée au sol, ce qu'elle monte jusqu'à
 * son palier ; le palétuvier qui porte le palier (`along` plus loin dans son axe, `off` de côté, vers le fond), l'angle
 * de sa première racine (en degrés) et le dessous de sa canopée au-dessus du sol (rien : celle d'un palétuvier
 * ordinaire).
 */
interface Span {
  start: number;
  dir: Vec2;
  span: number;
  rise: number;
  tree: { along: number; off: number; roots: number; crown?: number };
}

/**
 * Les deux passerelles jumelles, retouche 1 du directeur artistique : à 45° de l'axe de la caméra de part et d'autre,
 * portée 6, et leurs paliers MONTENT de 2 au-dessus de la plateforme : de la porte (caméra de marche) comme de près,
 * chacune monte de son départ à son palier d'environ 20° à l'écran, les deux départs côte à côte au bord avant, et la
 * fourche se lit en Y, plus en T. Leurs palétuviers grandissent (le dessous de la canopée à 8,7) pour couvrir le palier ;
 * les deux s'écartent d'un pas vers le fond, et leurs racines se tournent : celles de droite restent hors du chemin de
 * l'est et de la lanterne du rond-point ; celles de gauche, un peu plus loin dans son axe, hors du ponton, du séchoir et
 * du plancher de la scénette.
 */
const TWIN_TURN = deg(45);
const TWIN = { span: 6, rise: 2, crown: 8.7 } as const;
const TWINS: readonly [Span, Span] = [
  { start: 82, dir: { x: Math.sin(TWIN_TURN), z: Math.cos(TWIN_TURN) }, span: TWIN.span, rise: TWIN.rise, tree: { along: 1.5, off: 0.6, roots: 105, crown: TWIN.crown } },
  { start: 98, dir: { x: -Math.sin(TWIN_TURN), z: Math.cos(TWIN_TURN) }, span: TWIN.span, rise: TWIN.rise, tree: { along: 2, off: 0.6, roots: 40, crown: TWIN.crown } },
];
/** La troisième, de derrière le tronc, en sens contraire, à plat jusqu'à son palier sur le tronc du fond. */
const THIRD: Span = { start: 262, dir: { x: 0.17, z: -0.985 }, span: 8, rise: 0, tree: { along: 1.5, off: 0, roots: 213 } };

/**
 * Dans la ruine, la jumelle gauche : son bout qui tient (0,5 au plus), la hauteur du coude de ses cordes et leur dérive
 * dans son axe (pour pendre hors de la cabane, par-dessus le bord du toit affaissé), ses quatre planches en travers (sur
 * la volée du haut, puis celle du bas), son tablier couché dans l'eau.
 */
const LEFT_HANG = {
  stub: 0.5,
  kneeY: 1.6,
  drift: 1.3,
  rungs: [
    ['top', 'knee', 0.22],
    ['top', 'knee', 0.5],
    ['top', 'knee', 0.78],
    ['knee', 'foot', 0.55],
  ] as const,
  deck: 1.4,
} as const;

/** Dans la ruine, la jumelle droite : 4 de tablier qui plongent de 0,5, son bout qui pend sur 1. */
const RIGHT_HANG = { deck: 4, dip: 0.5, hang: 1 } as const;

/** Le départ d'une passerelle au bord de la plateforme. */
const spanStart = (angle: number): Vec3 => ({ ...around(T, deg(angle), PLATFORM.r), y: PLATFORM.y });

/** L'arrivée d'une passerelle (au palier), à sa portée de son départ, montée de `rise`. */
const spanEnd = (s: Span): Vec3 => {
  const a = spanStart(s.start);
  return { x: a.x + s.dir.x * s.span, y: PLATFORM.y + s.rise, z: a.z + s.dir.z * s.span };
};

/** Le tronc qui porte le palier d'une passerelle : plus loin dans son axe, et de côté vers le fond (`off`). */
const spanTree = (s: Span): Vec2 => {
  const e = spanEnd(s);
  // De côté, vers le fond : la perpendiculaire au cap qui s'éloigne de la caméra (z décroissant).
  const side = s.dir.x >= 0 ? { x: s.dir.z, z: -s.dir.x } : { x: -s.dir.z, z: s.dir.x };
  return { x: e.x + s.dir.x * s.tree.along + side.x * s.tree.off, z: e.z + s.dir.z * s.tree.along + side.z * s.tree.off };
};

/** Le mât de racine, sur la plateforme, au fond à droite vu de face (devant la couronne, jamais devant la fourche). */
const MAST = { angle: -35, r: 2.9, top: 9.9 } as const;
const MAST_FOOT = around(T, deg(MAST.angle), MAST.r);

/** L'eau calme du lieu, autour du tronc : le rayon de sa rive à chaque angle (de l'est, dans le sens du sud). */
const POND: readonly (readonly [number, number])[] = [
  [0, 11],
  [30, 10],
  [60, 8],
  [90, 7.6],
  [120, 8.5],
  [150, 12],
  [180, 12.5],
  [210, 11],
  [240, 9.5],
  [270, 9],
  [300, 9],
  [330, 10],
];

/** La hauteur de l'eau au-dessus du sol du lieu (une eau peu profonde, posée au ras du sol plat des Roselières). */
const WATER_Y = 0.08;

/** Les touffes de roseaux du lieu : au bord de l'eau, jamais sur le pont, le rond-point ni sous la fourche. */
const REEDS = [
  [-9.2, -1.2],
  [-7.6, 1.6],
  [-10.4, -6.4],
  [-3.4, -10.4],
  [4.6, -9.8],
  [8.8, -2.0],
  [-3.0, 2.2],
  [2.6, 2.8],
] as const;

/** Le sol d'eau du lieu : un éventail du tronc à sa rive (le cœur sombre), puis la bande des rives, qui descend au sol. */
function pond(b: FacetBuilder, ground: SiteGround): void {
  const n = POND.length;
  const inner = POND.map(([a, r]) => around(T, deg(a), r * 0.78));
  const outer = POND.map(([a, r]) => around(T, deg(a), r));
  const c: [number, number, number] = [T.x, WATER_Y, T.z];
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    const i0 = inner[k],
      i1 = inner[m],
      o0 = outer[k],
      o1 = outer[m];
    b.triangle(c, [i1.x, WATER_Y, i1.z], [i0.x, WATER_Y, i0.z], C.water);
    const y0 = Math.min(WATER_Y, ground.at(o0.x, o0.z) + 0.02),
      y1 = Math.min(WATER_Y, ground.at(o1.x, o1.z) + 0.02);
    b.quad([i0.x, WATER_Y, i0.z], [i1.x, WATER_Y, i1.z], [o1.x, y1, o1.z], [o0.x, y0, o0.z], C.waterShallow);
  }
}

/** Le pied d'un pieu dans l'eau peu profonde ou le sol : enfoncé. */
const pileFoot = (ground: SiteGround, p: Vec2): number => ground.at(p.x, p.z) - 0.35;

/** Le tronc géant : son pied évasé jusque sous la plateforme, puis son fût jusqu'à la couronne, et ses racines en arceaux. */
function trunk(b: FacetBuilder, ground: SiteGround): void {
  tube(b, T.x, T.z, SINK, PLATFORM.y, TRUNK.base, TRUNK.mid, 8, C.trunk, 0.2);
  tube(b, T.x, T.z, PLATFORM.y, TRUNK.height, TRUNK.mid, TRUNK.top, 8, C.trunk, 0.2);
  for (const r of CROWN) b.prism({ x: T.x, y: r.y, z: T.z, yaw: r.turn }, r.r0, r.r1, r.h, r.sides, C.canopy, C.canopyTop);
  for (const a of TRUNK_ROOTS) {
    const start = around(T, deg(a), TRUNK.base - 0.15);
    const knee = around(T, deg(a), 2.35);
    const foot = around(T, deg(a), 3.4);
    const kneeY = 1.75;
    cord(b, { ...start, y: 1.5 }, { ...knee, y: kneeY }, 0.42, C.root);
    cord(b, { ...knee, y: kneeY }, { ...foot, y: ground.at(foot.x, foot.z) - 0.4 }, 0.38, C.root);
  }
}

/** Le bord intérieur de la plateforme, contre le tronc. */
const INNER_R = TRUNK.mid - 0.05;

/**
 * Dans la ruine, la moitié de plateforme qui tient s'affaisse vers l'avant (la caméra) : son bord avant descend de
 * `RUIN_SAG`, rien contre le tronc. Penchée vers la caméra, qui la voit d'un peu au-dessus, sa surface de planches se lit
 * (à plat, elle ne montrait que sa tranche).
 */
const RUIN_SAG = 0.45;

/** La hauteur du dessus de la plateforme en ruine, à l'angle `a` (radians) et au rayon `r` du tronc. */
const ruinY = (a: number, r: number): number => PLATFORM.y - (RUIN_SAG * Math.max(0, Math.sin(a)) * Math.max(0, r - INNER_R)) / (PLATFORM.r - INNER_R);

/** Un point du dessus de la plateforme en ruine, à l'angle `a` (degrés) et au rayon `r`. */
const ruinAt = (a: number, r: number): Vec3 => ({ ...around(T, deg(a), r), y: ruinY(deg(a), r) });

/**
 * Les pans de la plateforme (leur dessus, leur bord, leur dessous), ou certains seulement. En ruine (`ruin`), affaissés
 * vers l'avant, et leur dessus en trois rangs de planches couchées, d'un ton puis du ton du joint (`C.wornSeam`) : une
 * surface de planches, pas des poutres en rayons.
 */
function platform(b: FacetBuilder, keep: readonly number[], color: number, top: number, ruin = false): void {
  const half = Math.PI / PLATFORM.sides;
  const rings = ruin ? [INNER_R, 1.85, 2.6, PLATFORM.r] : [INNER_R, PLATFORM.r];
  const at = (a: number, r: number) => {
    const p = around(T, a, r);
    return [p.x, ruin ? ruinY(a, r) : PLATFORM.y, p.z] as const;
  };
  const below = (q: readonly [number, number, number]) => [q[0], q[1] - PLATFORM.thick, q[2]] as const;
  for (const k of keep) {
    const a0 = segmentMid(k) - half,
      a1 = segmentMid(k) + half;
    for (let j = 0; j + 1 < rings.length; j++) b.quad(at(a0, rings[j]), at(a1, rings[j]), at(a1, rings[j + 1]), at(a0, rings[j + 1]), j % 2 ? C.wornSeam : top);
    const o0 = at(a0, PLATFORM.r),
      o1 = at(a1, PLATFORM.r);
    b.quad(o0, o1, below(o1), below(o0), color);
    b.quad(below(at(a0, INNER_R)), below(o0), below(o1), below(at(a1, INNER_R)), color);
  }
}

/** Le garde-corps : sa lisse, vue des deux côtés, sur les pans gardés, et un poteau toutes les deux lisses. */
function railing(b: FacetBuilder): void {
  const half = Math.PI / PLATFORM.sides;
  const r = PLATFORM.r - 0.08;
  const y0 = PLATFORM.y + 0.82,
    y1 = PLATFORM.y + 0.94;
  RAILED.forEach((k, i) => {
    const p0 = around(T, segmentMid(k) - half, r),
      p1 = around(T, segmentMid(k) + half, r);
    b.quad([p1.x, y0, p1.z], [p0.x, y0, p0.z], [p0.x, y1, p0.z], [p1.x, y1, p1.z], C.newShade);
    b.quad([p0.x, y0, p0.z], [p1.x, y0, p1.z], [p1.x, y1, p1.z], [p0.x, y1, p0.z], C.newWood);
    // Un poteau au début de chaque course et toutes les deux lisses, et un à la fin de chaque course.
    const runStart = i === 0 || RAILED[i - 1] !== k - 1;
    const runEnd = i === RAILED.length - 1 || RAILED[i + 1] !== k + 1;
    if (runStart || i % 2 === 0) cord(b, { ...p0, y: PLATFORM.y }, { ...p0, y: y1 }, 0.1, C.newShade);
    if (runEnd) cord(b, { ...p1, y: PLATFORM.y }, { ...p1, y: y1 }, 0.1, C.newShade);
  });
}

/** Une marche de l'escalier en spirale, à son rang. */
function stair(b: FacetBuilder, k: number, color: number, top: number): void {
  const S = STAIRS;
  const a = deg(S.first + k * S.step);
  const y = (k + 1) * S.rise - 0.1;
  const r = TRUNK.base - (TRUNK.base - TRUNK.mid) * (y / PLATFORM.y) + S.width / 2 - 0.1;
  const p = around(T, a, r);
  b.box({ x: p.x, y, z: p.z, yaw: -a }, [S.width, 0.12, S.depth], color, top);
}

/**
 * Une passerelle tendue : son tablier en deux longues facettes, un peu creusé au milieu (de `sag`), ses deux mains
 * courantes.
 */
function walkway(b: FacetBuilder, a: Vec3, c: Vec3, sag: number): void {
  const mid = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 - sag, z: (a.z + c.z) / 2 };
  strip(b, a, mid, 0.8, 0.08, C.plankShade, C.plank);
  strip(b, mid, c, 0.8, 0.08, C.plankShade, C.plank);
  const l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
  const nx = (-(c.z - a.z) / l) * 0.42,
    nz = ((c.x - a.x) / l) * 0.42;
  for (const s of [-1, 1]) {
    const hand = (p: Vec3, dy: number) => ({ x: p.x + s * nx, y: p.y + dy, z: p.z + s * nz });
    cord(b, hand(a, 0.85), hand(mid, 0.75), 0.05, C.rope);
    cord(b, hand(mid, 0.75), hand(c, 0.85), 0.05, C.rope);
  }
}

/** Le palier d'une passerelle, accroché à son tronc : son plancher, de l'arrivée au fût, et sa jambe de force. */
function landing(b: FacetBuilder, s: Span, ground: SiteGround): void {
  const e = spanEnd(s);
  const tree = spanTree(s);
  const d = Math.hypot(tree.x - e.x, tree.z - e.z) || 1;
  const stop = 0.35 / d;
  strip(b, e, { x: tree.x - (tree.x - e.x) * stop, y: e.y, z: tree.z - (tree.z - e.z) * stop }, 1.3, 0.12, C.plankShade, C.plank);
  cord(b, { x: tree.x, y: Math.max(ground.at(tree.x, tree.z) + 3.4, e.y - 2), z: tree.z }, { x: e.x, y: e.y - 0.12, z: e.z }, 0.14, C.newShade);
}

/**
 * La cabane de la ruine penche de 8° vers la droite (vue de la porte), plancher, murs et porte ensemble, autour du milieu
 * de son plancher ; ses pilotis suivent. Le pan de mur à gauche de la porte (entre les sommets à 120° et 180°) manque.
 */
const CABIN_LEAN = deg(8);
const CABIN_MISSING_WALL = 2;

/**
 * La cabane : son plancher hexagonal sur trois pilotis, son mur de planches, sa porte ; neuve et droite, ou dans la
 * ruine en bois usé, penchée, un pan de mur en moins (deux triangles de moins, rendus au pont coupé).
 */
function cabin(b: FacetBuilder, ground: SiteGround, worn: boolean): void {
  const K = CABIN;
  const wood = worn ? C.wornWood : C.newWood;
  const shade = worn ? C.wornShade : C.newShade;
  const pivot = { x: K.x, y: K.floor - 0.15 };
  const lean = worn ? CABIN_LEAN : 0;
  leaning(b, pivot, lean, (l) => {
    l.prism({ x: K.x, y: K.floor - 0.15, z: K.z }, K.deck, K.deck, 0.15, 6, shade, worn ? C.wornWood : C.plank);
    tube(l, K.x, K.z, K.floor, K.wallTop, K.wall, K.wall, 6, wood, 0, worn ? CABIN_MISSING_WALL : -1);
    // La porte, sur le pan qui regarde le sud (entre les sommets à 60° et 120°).
    const face = K.z + K.wall * Math.cos(Math.PI / 6) + 0.012;
    l.plate({ x: K.x, y: K.floor, z: face }, [[-0.32, 0], [0.32, 0], [0.32, 1.0], [-0.32, 1.0]], C.door);
  });
  // Les pilotis, jusque sous le plancher, penché ou non.
  for (const a of [30, 150, 270]) {
    const p = around({ x: K.x, z: K.z }, deg(a), K.deck - 0.2);
    const dx = p.x - pivot.x;
    const top = { x: pivot.x + dx * Math.cos(lean), y: pivot.y - dx * Math.sin(lean), z: p.z };
    cord(b, { ...p, y: pileFoot(ground, p) }, top, 0.22, shade);
  }
}

/** Le toit de roseaux entier de la cabane : son cône à huit pans et sa pointe. */
function cabinRoof(b: FacetBuilder): void {
  const K = CABIN;
  b.prism({ x: K.x, y: K.wallTop - 0.05, z: K.z, yaw: 0.2 }, K.roof, 0, K.roofH, 8, C.reed);
  b.prism({ x: K.x, y: K.wallTop + K.roofH - 0.25, z: K.z }, 0.14, 0, 0.45, 4, C.reedShade);
}

/** La potence de la cordière au coin avant droit de la cabane, et sa lanterne, allumée dès la ruine (la seule). */
const CORDIERE_LANTERN = { from: { x: 0.95, z: -0.05 }, to: { x: 1.4, z: 0.4 }, y: 1.95 } as const;

/** Les deux lanternes éteintes pendues dans les racines de devant (la ruine), sous leurs arceaux. */
const DEAD_LANTERNS = [140, 40].map((a) => ({ ...around(T, deg(a), 2.3), y: 1.75 }));

/**
 * Les volumes de la Croisée, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ;
 * `door` : sa porte, au sud, sur le chemin.
 */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const at = (x: number, z: number) => ground.at(x, z);
  // Toujours là : l'eau calme et ses roseaux, le tronc vivant et sa couronne, les trois troncs des paliers, le haut de
  // la spirale accroché au tronc, et la lanterne de la cordière, allumée dès la ruine (la seule).
  add('ruine', 0, (b) => {
    pond(b, ground);
    REEDS.forEach(([x, z], i) => reedTuft(b, { x, y: Math.min(at(x, z), WATER_Y), z }, i + 3, 1.25));
  });
  add('ruine', 0, (b) => trunk(b, ground));
  add('ruine', 0, (b) => {
    for (const s of [...TWINS, THIRD]) {
      const t = spanTree(s);
      giantMangrove(b, t.x, t.z, s === THIRD ? 1.2 : 1.12, 0.6 + s.start * 0.01, ground, deg(s.tree.roots), s.tree.crown);
    }
  });
  add('ruine', 0, (b) => {
    for (let k = STAIRS.fallen; k < STAIRS.count; k++) stair(b, k, C.wornShade, C.wornWood);
  });
  add('ruine', 0, (b) => {
    const L = CORDIERE_LANTERN;
    const tip = { ...L.to, y: L.y };
    cord(b, { ...L.from, y: L.y }, tip, 0.1, C.newShade);
    lantern(b, tip, true);
  });

  // Le corps, 1 sur 3, relève la cabane en bois neuf et refait le pont : la cabane penchée en bois usé, son pont coupé,
  // le poteau couché partent avec lui. Le toit affaissé reste jusqu'au haut.
  const part1 = { stage: 0 as const, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      cabin(b, ground, true);
      // Le pont coupé : le bout de la cabane sur son pieu ; un trou d'eau de 1, qui se voit de la porte ; le bout de la
      // rive, sans pieu, plonge dans l'eau. Deux tabliers et un pieu (le pieu de la rive, tombé, paie le second tablier).
      const G = BRIDGE_GAP;
      strip(b, { x: -0.1, y: BRIDGE.y - 0.08, z: BRIDGE.from }, { x: -0.05, y: BRIDGE.y - 0.16, z: G.from }, 2 * BRIDGE.half, 0.12, C.wornShade, C.wornWood);
      strip(b, { x: 0.12, y: WATER_Y - 0.04, z: G.to }, { x: 0.05, y: BRIDGE.y - 0.14, z: BRIDGE.to - 0.4 }, 2 * BRIDGE.half, 0.12, C.wornShade, C.wornWood);
      cord(b, { x: -0.4, y: pileFoot(ground, { x: -0.4, z: 2.0 }), z: 2.0 }, { x: -0.4, y: BRIDGE.y - 0.2, z: 2.0 }, 0.18, C.wornShade);
      // Le poteau à deux flèches, couché à plat sur la rive, panneaux face au ciel (sans leurs pictogrammes).
      const y = at(-1.6, 4.4) + 0.06;
      b.box({ x: -1.6, y, z: 4.4, yaw: 0 }, [2.3, 0.14, 0.14], C.wornShade);
      for (const [x, s] of [
        [-2.2, -1],
        [-1.2, 1],
      ] as const)
        b.extrude({ x, y: y + 0.14, z: 4.4 - 0.05, pitch: -Math.PI / 2 }, s > 0 ? ARROW : ARROW_LEFT, 0.06, C.wornShade, C.wornWood);
    },
    part1,
  );
  // Le toit affaissé à plat sur la cabane et deux bottes de roseaux dessous, couchées parallèles ; le haut les remplace.
  const top = { stage: 1 as const, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      b.prism({ x: CABIN.x - 0.25, y: CABIN.wallTop - 0.2, z: CABIN.z, pitch: 0.32, yaw: 0.4 }, CABIN.roof * 0.95, 0, 0.55, 6, C.reedShade);
      for (const [x, z] of [
        [-1.35, 0.35],
        [1.45, 0.75],
      ] as const)
        b.box({ x, y: CABIN.floor - 0.02, z, yaw: 0.3 }, [1.0, 0.24, 0.3], C.reedShade, C.reed);
      for (const p of DEAD_LANTERNS) lantern(b, p, false);
    },
    top,
  );

  // Le corps, 2 sur 3 : l'escalier entier (ses premières marches, tombées à côté du pont dans la ruine) et les piles.
  const part2 = { stage: 0 as const, row: 1 / 3 };
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of [
        [-1.4, 2.3, 0.3],
        [-1.75, 3.3, 0.3],
      ] as const)
        b.box({ x, y: WATER_Y - 0.02, z, yaw }, [STAIRS.width, 0.1, STAIRS.depth], C.wornShade, C.wornWood);
    },
    part2,
  );

  // Le corps, 3 sur 3 : la plateforme entière ; dans la ruine, sa moitié qui tient, affaissée vers l'avant, ses planches
  // couchées et deux planches cassées en travers, les deux ancrages vides du treuil et le bout de corde ; dessous, ce
  // qui est tombé (deux planches, deux morceaux de garde-corps) ; les passerelles qui pendent ou gisent.
  const part3 = { stage: 0 as const, row: 2 / 3 };
  add(
    'ruine',
    0,
    (b) => {
      platform(b, HOLDING, C.wornShade, C.wornWood, true);
      // Les deux solives du bord cassé, sous la moitié qui tient.
      for (const a of [108, 288]) cord(b, add3(ruinAt(a, TRUNK.mid), 0, -0.22, 0), add3(ruinAt(a, PLATFORM.r), 0, -0.22, 0), 0.2, C.wornShade);
      // Deux planches cassées, couchées en travers (le long du bord), jamais en rayons.
      for (const [a, r, len] of [
        [48, 2.6, 1.4],
        [-50, 2.1, 1.2],
      ] as const) {
        const p = ruinAt(a, r);
        b.box({ ...p, yaw: -(deg(a) + Math.PI / 2) }, [len, 0.08, 0.3], C.wornShade, C.wornWood);
      }
      for (const a of [18, -22]) b.box({ ...ruinAt(a, 2.35), yaw: -deg(a) }, [0.5, 0.42, 0.5], C.wornShade, C.wornWood);
      const edge = around(T, deg(0), PLATFORM.r - 0.1);
      cord(b, { ...edge, y: PLATFORM.y }, { ...edge, y: PLATFORM.y - 1.9 }, 0.05, C.rope);
    },
    part3,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Sous le vide, à plat dans l'eau : deux planches parallèles, deux morceaux de garde-corps.
      for (const dz of [0, 0.5]) b.box({ x: -4.6, y: WATER_Y - 0.03, z: -1.6 + dz, yaw: 0.25 }, [1.7, 0.1, 0.32], C.wornShade, C.wornWood);
      for (const [x, z] of [
        [-5.6, -4.4],
        [-3.4, -6.8],
      ] as const)
        cord(b, { x, y: WATER_Y + 0.04, z }, { x: x - 1.3, y: WATER_Y + 0.04, z: z - 0.5 }, 0.12, C.wornShade);
      // La jumelle gauche, coupée au ras du bord : un bout de 0,5, puis elle pend le long de ses deux cordes, molles,
      // comme une échelle de corde (quatre planches en travers), par-dessus le bord du toit affaissé, jusqu'à l'eau où
      // gît son tablier. Rien de raide : jamais un panneau plein, jamais un portique avec la droite.
      const [right, left] = TWINS;
      const L = LEFT_HANG;
      const la = ruinAt(left.start, PLATFORM.r);
      const lb = { x: la.x + left.dir.x * L.stub, y: la.y - 0.12, z: la.z + left.dir.z * L.stub };
      strip(b, la, lb, 0.8, 0.08, C.wornShade, C.wornWood);
      const knee = { x: lb.x + left.dir.x * L.drift, y: L.kneeY, z: lb.z + left.dir.z * L.drift };
      const foot = { x: knee.x + left.dir.x * 0.3, y: WATER_Y, z: knee.z + left.dir.z * 0.3 };
      const across = { x: -left.dir.z * 0.38, z: left.dir.x * 0.38 };
      const side = (p: Vec3, s: number): Vec3 => ({ x: p.x + s * across.x, y: p.y, z: p.z + s * across.z });
      const lerp = (p: Vec3, q: Vec3, t: number): Vec3 => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, z: p.z + (q.z - p.z) * t });
      for (const s of [-1, 1]) {
        cord(b, side(lb, s), side(knee, s), 0.06, C.rope);
        cord(b, side(knee, s), side(foot, s), 0.06, C.rope);
      }
      // Les planches pendent debout entre les cordes, leurs deux faces vues (sans épaisseur : quatre triangles).
      for (const [from, to, t] of L.rungs) {
        const p = lerp(from === 'top' ? lb : knee, to === 'knee' ? knee : foot, t);
        const [a0, a1] = [side(p, -1.1), side(p, 1.1)];
        const q = (r: Vec3, dy: number) => [r.x, r.y + dy, r.z] as const;
        b.quad(q(a0, -0.11), q(a1, -0.11), q(a1, 0.11), q(a0, 0.11), C.wornWood);
        b.quad(q(a1, -0.11), q(a0, -0.11), q(a0, 0.11), q(a1, 0.11), C.wornShade);
      }
      strip(b, foot, { x: foot.x + left.dir.x * L.deck, y: WATER_Y - 0.02, z: foot.z + left.dir.z * L.deck }, 0.8, 0.08, C.wornShade, C.wornWood);
      // La jumelle droite garde 4 de ses planches, qui plongent un peu ; seul son bout pend, sur 1.
      const ra = ruinAt(right.start, PLATFORM.r);
      const rb = { x: ra.x + right.dir.x * RIGHT_HANG.deck, y: ra.y - RIGHT_HANG.dip, z: ra.z + right.dir.z * RIGHT_HANG.deck };
      strip(b, ra, rb, 0.8, 0.08, C.wornShade, C.wornWood);
      strip(b, rb, { x: rb.x + 0.1, y: rb.y - RIGHT_HANG.hang, z: rb.z + 0.1 }, 0.8, 0.08, C.wornShade, C.wornWood);
      cord(b, add3(ra, 0.3, 0.85, -0.3), add3(rb, 0.3, 0.2, -0.3), 0.05, C.rope);
      // La troisième, tombée tout entière dans l'eau et les roseaux, derrière le tronc.
      const ta = spanStart(THIRD.start);
      const tb = spanEnd(THIRD);
      strip(b, { x: ta.x - 0.4, y: WATER_Y + 0.05, z: ta.z - 1.2 }, { x: tb.x - 0.3, y: WATER_Y + 0.05, z: tb.z + 2.2 }, 0.8, 0.08, C.wornShade, C.wornWood);
      cord(b, { x: ta.x + 0.1, y: WATER_Y + 0.1, z: ta.z - 1.2 }, { x: tb.x + 0.2, y: WATER_Y + 0.1, z: tb.z + 2.2 }, 0.05, C.rope);
    },
    part3,
  );

  // Le corps, 1 sur 3 : le pont de planches et la cabane redressée en bois neuf, son linteau au motif des racines.
  add(0, 0, (b) => {
    cabin(b, ground, false);
    strip(b, { x: 0, y: BRIDGE.y, z: BRIDGE.from }, { x: 0, y: BRIDGE.y, z: BRIDGE.to }, 2 * BRIDGE.half, 0.14, C.plankShade, C.plank);
    for (const z of [2.3, 3.6]) for (const x of [-BRIDGE.half + 0.1, BRIDGE.half - 0.1]) cord(b, { x, y: pileFoot(ground, { x, z }), z }, { x, y: BRIDGE.y - 0.12, z }, 0.18, C.plankShade);
    // Le motif des racines entrelacées en vert-de-gris sur le linteau : une onde, sans lettre ni chiffre.
    const face = CABIN.z + CABIN.wall * Math.cos(Math.PI / 6) + 0.05;
    const wave = [-0.5, -0.17, 0.17, 0.5].map((x, i) => ({ x, y: CABIN.floor + 1.18 + (i % 2 ? 0.08 : 0), z: face }));
    for (let i = 0; i < 3; i++) cord(b, wave[i], wave[i + 1], 0.07, C.verdigris);
  });
  // Le corps, 2 sur 3 : les premières marches de l'escalier, les quatre piles de la plateforme, la ferrure de bronze qui
  // ceint le tronc sous elle.
  add(0, 1 / 3, (b) => {
    for (let k = 0; k < STAIRS.fallen; k++) stair(b, k, C.newShade, C.newWood);
    for (const a of PILES) {
      const p = around(T, deg(a), PILE_R);
      tube(b, p.x, p.z, pileFoot(ground, p), PLATFORM.y - PLATFORM.thick, 0.16, 0.16, 4, C.newShade, Math.PI / 4);
    }
    b.band({ x: T.x, y: PLATFORM.y - 0.55, z: T.z }, TRUNK.mid + 0.03, 0.3, 8, C.bronze);
  });
  // Le corps, 3 sur 3 : la plateforme ronde, son garde-corps, les trois passerelles tendues et leurs paliers.
  add(0, 2 / 3, (b) => {
    platform(b, Array.from({ length: PLATFORM.sides }, (_, k) => k), C.plankShade, C.plank);
    railing(b);
    for (const s of [...TWINS, THIRD]) {
      // Les jumelles qui montent, moins creusées : une courbe tendue, qui monte dès son départ.
      walkway(b, spanStart(s.start), spanEnd(s), s.rise > 0 ? 0.25 : 0.35);
      landing(b, s, ground);
    }
  });

  // Le haut : le toit de roseaux entier ; le mât de racine sur la plateforme et sa lanterne, allumée dès qu'elle est
  // posée (jamais à une réussite).
  add(1, 0, (b) => cabinRoof(b));
  add(1, 0.5, (b) => {
    const foot = { ...MAST_FOOT, y: PLATFORM.y };
    const knee = { x: MAST_FOOT.x + 0.18, y: PLATFORM.y + 2.2, z: MAST_FOOT.z + 0.12 };
    const head = { ...MAST_FOOT, y: MAST.top };
    cord(b, foot, knee, 0.24, C.root);
    cord(b, knee, head, 0.2, C.root);
    const tip = { x: MAST_FOOT.x + 0.75, y: MAST.top - 0.25, z: MAST_FOOT.z + 0.3 };
    cord(b, { ...MAST_FOOT, y: MAST.top - 0.25 }, tip, 0.1, C.root);
    lantern(b, tip, true, 1.3);
  });
  // Les abords : le rond-point de planches au sol et sa barrière basse, le ponton de roseaux ; la lanterne sur poteau au
  // bord du rond-point.
  add(2, 0, (b) => {
    const R = ROUND;
    b.prism({ x: R.x, y: R.y - 0.4, z: R.z, yaw: Math.PI / 8 }, R.r, R.r, 0.4, 8, C.plankShade, C.plank);
    for (const [a0, a1] of [
      [220, 250],
      [290, 320],
    ] as const) {
      const p0 = around(R, deg(a0), R.r - 0.15),
        p1 = around(R, deg(a1), R.r - 0.15);
      for (const p of [p0, p1]) cord(b, { ...p, y: R.y - 0.1 }, { ...p, y: R.y + 0.75 }, 0.12, C.newShade);
      cord(b, { ...p0, y: R.y + 0.68 }, { ...p1, y: R.y + 0.68 }, 0.08, C.newWood);
    }
  });
  add(2, 0.5, (b) => {
    const P = PONTOON;
    const yaw = yawOf(P.from, P.to);
    const len = Math.hypot(P.to.x - P.from.x, P.to.z - P.from.z);
    const nx = -(P.to.z - P.from.z) / len,
      nz = (P.to.x - P.from.x) / len;
    // Le ponton : quatre bottes de roseaux couchées côte à côte, dans sa longueur.
    for (let k = 0; k < 4; k++) {
      const s = (k - 1.5) * (P.w / 4);
      b.box({ x: (P.from.x + P.to.x) / 2 + nx * s, y: P.y - 0.24, z: (P.from.z + P.to.z) / 2 + nz * s, yaw }, [len, 0.24, P.w / 4 - 0.02], C.reedShade, C.reed);
    }
    for (const t of [0.45, 0.95]) {
      const p = { x: P.from.x + (P.to.x - P.from.x) * t, z: P.from.z + (P.to.z - P.from.z) * t };
      cord(b, { ...p, y: pileFoot(ground, p) }, { ...p, y: P.y - 0.2 }, 0.16, C.newShade);
    }
    const post = { x: 3.6, z: 4.5 };
    const g = at(post.x, post.z);
    cord(b, { ...post, y: g - 0.3 }, { ...post, y: g + 1.55 }, 0.12, C.newShade);
    b.box({ x: post.x, y: g + 1.5, z: post.z }, [0.28, 0.32, 0.28], C.lantern);
    b.prism({ x: post.x, y: g + 1.82, z: post.z, yaw: Math.PI / 4 }, 0.24, 0, 0.2, 4, C.bronze);
  });
}

// ---------- Les traces ----------

/** Le sol d'un point du lieu, depuis son centre posé au sol (`c`), dans le monde. */
const groundNear = (c: Vec3, lx: number, lz: number): number => standingHeight(heightAt5e({ x: c.x + lx, z: c.z + lz })) - c.y;

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  const f = l.build();
  for (let i = 0; i < f.positions.length; i += 3) {
    f.positions[i] += c.x;
    f.positions[i + 1] += c.y;
    f.positions[i + 2] += c.z;
  }
  b.append(f);
}

/** Un panneau-flèche, pointé vers l'est (+x), et son jumeau pointé vers l'ouest : de même taille. */
const ARROW = [
  [-0.55, -0.17],
  [0.38, -0.17],
  [0.62, 0],
  [0.38, 0.17],
  [-0.55, 0.17],
] as const;
const ARROW_LEFT = ARROW.map(([x, y]) => [-x, y] as const).reverse();

/**
 * Les deux pictogrammes, hauts d'environ 60 % du panneau (0,22 sur 0,34), d'un brun presque noir sur le bois neuf (un
 * contraste de valeur, jamais de teinte) ; ils se distinguent par la forme. La feuille : une amande pointue, sa pointe
 * vers le bout de la flèche, et sa tige nette. Le poisson : un losange, et sa queue fourchue en deux lobes, longue de la
 * moitié du corps (0,14 sur 0,28), son échancrure bien ouverte.
 */
const LEAF = [
  [-0.25, 0],
  [-0.1, -0.08],
  [0.04, -0.11],
  [0.16, 0],
  [0.04, 0.11],
  [-0.1, 0.08],
] as const;
const LEAF_STEM = [
  [0.14, -0.025],
  [0.33, -0.025],
  [0.33, 0.025],
  [0.14, 0.025],
] as const;
const FISH = [
  [-0.08, 0],
  [0.05, -0.11],
  [0.2, 0],
  [0.05, 0.11],
] as const;
const FISH_TAIL = [
  [
    [-0.05, 0],
    [-0.22, 0.1],
    [-0.13, 0],
  ],
  [
    [-0.05, 0],
    [-0.13, 0],
    [-0.22, -0.1],
  ],
] as const;

/** Le poteau des deux flèches (Panneaux) : debout sur la rive, à gauche du pont, ses flèches au-dessus de la tête de Kéo. */
const SIGNPOST = { x: -1.1, z: 4.5, h: 2.45, low: 1.78, high: 2.2 } as const;

function signpost(b: FacetBuilder, c: Vec3): void {
  const S = SIGNPOST;
  inWorld(b, c, (l) => {
    const g = groundNear(c, S.x, S.z);
    l.box({ x: S.x, y: g - 0.4, z: S.z }, [0.16, S.h + 0.4, 0.16], C.newShade);
    // La flèche haute vers l'est, son poisson ; la basse vers l'ouest, sa feuille. Jamais croisées.
    for (const [y, east] of [
      [S.high, true],
      [S.low, false],
    ] as const) {
      const dx = east ? 0.28 : -0.28;
      l.extrude({ x: S.x + dx, y: g + y, z: S.z - 0.08 }, east ? ARROW : ARROW_LEFT, 0.07, C.newShade, C.newWood);
      const fz = S.z - 0.08 + 0.075;
      if (east) {
        l.plate({ x: S.x + dx - 0.05, y: g + y, z: fz }, FISH, C.picto);
        for (const lobe of FISH_TAIL) l.plate({ x: S.x + dx - 0.05, y: g + y, z: fz }, lobe, C.picto);
      } else {
        l.plate({ x: S.x + dx + 0.05, y: g + y, z: fz }, LEAF, C.picto);
        l.plate({ x: S.x + dx + 0.05, y: g + y, z: fz }, LEAF_STEM, C.picto);
      }
    }
  });
}

/** Le nœud tressé (Aiguillage) : pendu à la pile avant gauche de la plateforme, à hauteur de main, plein et épais. */
const KNOT = { pile: 135, y: 1.75, r: 0.36 } as const;

function knot(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const p = around(T, deg(KNOT.pile), PILE_R);
    const q = around(T, deg(KNOT.pile), PILE_R + 0.24);
    const g = groundNear(c, q.x, q.z);
    const y = Math.max(g, WATER_Y) + KNOT.y;
    cord(l, { ...p, y: y + 0.9 }, { ...q, y: y + 2 * KNOT.r }, 0.07, C.rope);
    // Deux troncs de cône à six pans dos à dos (la boule du nœud), et sa tresse en travers ; la queue qui pend.
    l.prism({ x: q.x, y, z: q.z }, KNOT.r * 0.45, KNOT.r, KNOT.r, 6, C.rope, C.rope);
    l.prism({ x: q.x, y: y + KNOT.r, z: q.z, yaw: 0.5 }, KNOT.r, KNOT.r * 0.45, KNOT.r, 6, C.ropeShade, C.rope);
    l.band({ x: q.x, y: y + KNOT.r * 0.8, z: q.z, yaw: 0.25 }, KNOT.r * 1.04, KNOT.r * 0.4, 6, C.ropeShade);
    cord(l, { ...q, y: y + 0.02 }, { x: q.x + 0.05, y: y - 0.55, z: q.z + 0.04 }, 0.08, C.rope);
  });
}

/**
 * Les deux portillons (Bifurcation) au bord avant, au départ des jumelles : l'un plein, en bois neuf clair sur toutes ses
 * faces, épais, qui se détache du tronc sombre derrière lui ; l'autre à trois barreaux, plus épais que les poteaux du
 * garde-corps (0,16 contre 0,1), espacés pour que le jour passe entre eux. La forme les distingue, jamais la couleur.
 */
function gates(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const half = Math.PI / PLATFORM.sides;
    const p0 = around(T, segmentMid(0) - half, PLATFORM.r - 0.08);
    const p1 = around(T, segmentMid(0) + half, PLATFORM.r - 0.08);
    const z = (p0.z + p1.z) / 2;
    const y = PLATFORM.y;
    // Le poteau du milieu, entre les deux.
    cord(l, { x: 0, y, z }, { x: 0, y: y + 0.94, z }, 0.1, C.newShade);
    // À droite (vu de face), le portillon plein.
    l.box({ x: 0.5, y: y + 0.1, z }, [0.8, 0.78, 0.1], C.newWood, C.newWood);
    // À gauche, le portillon à trois barreaux, entre deux traverses.
    for (const dy of [0.12, 0.84]) cord(l, { x: -0.1, y: y + dy, z }, { x: -0.9, y: y + dy, z }, 0.1, C.newWood);
    for (const x of [-0.25, -0.5, -0.75]) cord(l, { x, y: y + 0.12, z }, { x, y: y + 0.84, z }, 0.16, C.newWood);
  });
}

/** Les trois fanions (Participes passés) : de même taille, l'un sous l'autre sur le mât, brique sourd, fixes. */
const FLAG = [
  [0, 0.2],
  [0, -0.2],
  [0.55, 0],
] as const;

function flags(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    for (const y of [8.45, 7.9, 7.35]) l.extrude({ x: MAST_FOOT.x + 0.12, y, z: MAST_FOOT.z - 0.02 }, FLAG, 0.04, C.flag);
  });
}

/** Le séchoir (Le sens des mots) au bout du ponton : un râtelier bas et trois écheveaux de corde qui pendent. */
const RACK = { x: -4.65, z: 3.45, w: 1.2, h: 1.1 } as const;

function rack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const R = RACK;
    const yaw = yawOf(PONTOON.from, PONTOON.to);
    const ux = Math.cos(yaw),
      uz = -Math.sin(yaw);
    const y = PONTOON.y;
    const ends = [-1, 1].map((s) => ({ x: R.x + ux * s * (R.w / 2), z: R.z + uz * s * (R.w / 2) }));
    for (const e of ends) cord(l, { ...e, y: y - 0.05 }, { ...e, y: y + R.h }, 0.1, C.newShade);
    cord(l, { ...ends[0], y: y + R.h - 0.05 }, { ...ends[1], y: y + R.h - 0.05 }, 0.08, C.newWood);
    for (const t of [-0.3, 0, 0.3]) {
      const p = { x: R.x + ux * t, z: R.z + uz * t };
      l.prism({ x: p.x, y: y + R.h - 0.72, z: p.z, yaw: 0.4 }, 0.08, 0.13, 0.66, 4, C.rope, C.ropeShade);
    }
  });
}

// ---------- La scénette ----------

/** Le plancher de la scène, sur le rond-point devant le pont : sa demi-largeur, sa profondeur, sa hauteur. */
const SCENE_FLOOR = { half: 4.2, depth: 2.4, rise: 0.45 } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur le rond-point, la cabane et le pied du tronc derrière. */
const SCENE_SPOT = { dx: 0, dz: 5.95 } as const;

/** Le plancher de la scène : des planches en travers sur des pieux, du sol jusqu'à la hauteur de la scène. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const n = 6;
  for (let k = 0; k < n; k++) {
    const x = floor.x - F.half + ((k + 0.5) * 2 * F.half) / n;
    b.box({ x, y: floor.y - 0.16, z: floor.z }, [(2 * F.half) / n - 0.05, 0.16, F.depth], C.plankShade, C.plank);
  }
  for (const dx of [-F.half + 0.25, 0, F.half - 0.25])
    for (const dz of [-F.depth / 2 + 0.2, F.depth / 2 - 0.2]) {
      const x = floor.x + dx,
        z = floor.z + dz;
      const g = Math.min(standingHeight(heightAt5e({ x, z })), floor.y - 0.4);
      b.box({ x, y: g - 0.4, z }, [0.2, floor.y - g + 0.25, 0.2], C.plankShade);
    }
}

/** La cordière en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu. */
function cordiere(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.32, 0.24, 0.42, 8, C.skirt);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.25, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  b.prism({ x: at.x, y: at.y + 0.92, z: at.z }, 0.26, 0.2, 0.08, 8, C.scarf);
  for (const side of [-1, 1]) cord(b, { x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.sleeves);
}

/** La planche à cordes des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; une bobine choisie se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Une bobine de corde à l'échelle `s`, posée à plat : deux joues de bois et son enroulement de corde. Cinquante-quatre triangles. */
function spool(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.3 * s, 0.3 * s, 0.07 * s, 6, C.newShade, C.newWood);
  b.prism({ x: at.x, y: at.y + 0.07 * s, z: at.z, yaw: 0.5 }, 0.22 * s, 0.22 * s, 0.2 * s, 6, C.rope, C.ropeShade);
  b.prism({ x: at.x, y: at.y + 0.27 * s, z: at.z }, 0.3 * s, 0.3 * s, 0.07 * s, 6, C.newShade, C.newWood);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  pairs: { x: SIGNPOST.x, z: SIGNPOST.z },
  choices: around(T, deg(KNOT.pile), PILE_R),
  'homophone-sentences': { x: 0, z: T.z + PLATFORM.r },
  participles: MAST_FOOT,
  'word-meaning': { x: RACK.x, z: RACK.z },
} as const;

export const CROISEE: PlaceArt = {
  role: 'La cordière',
  model,
  // L'étape qui porte la scénette : le corps. Chaque trace a la sienne (`stage`) et, au corps en trois rangées, sa
  // rangée (`row`) : elle se montre quand sa mission est réussie et que sa partie est posée (3+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [SCENE_FLOOR.half, SCENE_FLOOR.depth / 2], fine: true },
  site: {
    rise: SCENE_FLOOR.rise,
    keo: { dx: -2.5, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.2, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.4, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) cordiere(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.35, half: 0.34 },
    // La planche à cordes sur deux tréteaux, sous la rangée des bobines.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Une bobine posée à plat sur la planche ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      spool(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : le plancher seul, rien de l'item ; les bobines portent les réponses.
  rest() {},
  traces: {
    pairs: { at: TRACE_SPOTS.pairs, lift: 1.2, stage: 0, row: 0, draw: signpost },
    choices: { at: TRACE_SPOTS.choices, lift: 1.5, stage: 0, row: 1 / 3, draw: knot },
    'homophone-sentences': { at: TRACE_SPOTS['homophone-sentences'], lift: 5.5, stage: 0, row: 2 / 3, draw: gates },
    participles: { at: TRACE_SPOTS.participles, lift: 7, stage: 1, draw: flags },
    'word-meaning': { at: TRACE_SPOTS['word-meaning'], lift: 1, stage: 2, draw: rack },
  },
  // Kéo au retour : sur le chemin, à l'est de la porte, face au tronc.
  exit: { x: 2.6, z: 9 },
};

/** Le plus haut de la Croisée : le haut de sa couronne, au-dessus de son pied (sous la Montée). */
export const CROISEE_TOP = CROWN[1].y + CROWN[1].h;

/** Le haut du mât de racine, au-dessus du sol du lieu (sous la couronne). */
export const CROISEE_MAST_TOP = MAST.top;

/** Le bas de la couronne du tronc, au-dessus du sol du lieu. */
export const CROISEE_CROWN_BOTTOM = CROWN[0].y;

/** La plateforme : sa hauteur au-dessus du sol du lieu (un décor, au-dessus de la tête de Kéo). */
export const CROISEE_PLATFORM_Y = PLATFORM.y;

/**
 * Les départs et les arrivées des trois passerelles (la jumelle droite, la gauche, la troisième), dans le repère du
 * lieu : pour vérifier qu'elles ne se croisent jamais, et que les jumelles montent à l'écran.
 */
export const CROISEE_SPANS: readonly { from: Vec3; to: Vec3 }[] = [...TWINS, THIRD].map((s) => ({ from: spanStart(s.start), to: spanEnd(s) }));

/** Les palétuviers qui portent les paliers des jumelles (droite, gauche) : leur pied, et le dessous de leur canopée. */
export const CROISEE_TWIN_TREES: readonly { at: Vec2; crown: number }[] = TWINS.map((s) => ({ at: spanTree(s), crown: s.tree.crown ?? 0 }));
