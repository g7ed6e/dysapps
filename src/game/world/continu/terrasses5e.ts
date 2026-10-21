// Les Terrasses (GD-22, lot 11 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée
// par le mainteneur) : « des rizières en gradins où l'eau descend de marche en marche : on la partage, on la garde, on
// prévoit ses caprices ». Le cœur, sans figure, est l'eau des gradins : un tertre bâti sur la plaine ocre, en trois
// marches nettes de 1,3 (à hauteur de hanche de Kéo), chacune en retrait de 3 vers le nord, larges de 11 ; leurs murets
// de pierre sèche grise et ocre dépassent d'une main au-dessus de l'eau qu'ils retiennent. L'eau descend : le canal haut,
// en bois, arrive par le nord dans le gradin du haut ; une vanne dans chaque muret de façade, au même endroit, donne dans
// le gradin d'en dessous, puis dans le canal bas ; l'aqueduc, un chéneau en U sur trois piles, part du gradin du haut,
// hors du tertre, et tombe sur les pales de la roue. À l'est, le moulin carré de pierre sèche sous son chaume à quatre
// pans, la roue debout dans sa fosse contre sa face sud (six rayons, le moyeu en anneau vide : on voit, à travers, le
// trou rond aux quatre goujons du mur, le signe de l'absence, avant comme après), le mât à l'angle nord-est. Au sud, la
// cour de dalles grises, son aire de battage, le canal bas et son petit pont de pierre. Le tertre est un décor : Kéo
// marche dans la cour.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Une flaque pâle dans le gradin du bas, quelques rangs de riz
// couchés ; la brèche du muret du milieu ; le haut sec et craquelé, son muret effondré à l'est en un tas de pierres glissé
// sur le gradin du milieu ; le canal haut en trois tronçons couchés ; les trois planches de vanne au pied des murets, leurs
// poteaux penchés ; le chéneau en deux morceaux à côté de ses piles, l'une penchée ; le moulin aux murs fendus, la moitié
// de son chaume tombée devant lui ; la roue en morceaux à plat dans sa fosse sèche ; le petit pont brisé sur le canal à
// sec ; quelques dalles inclinées. La seule lumière : la lanterne du riziculteur, sur sa perche à la porte du moulin.
// Trois parties, une par étape ; une trace par mission, posée avec son étape (`stage`) : la jarre de grès (le corps), la
// hotte à deux bretelles (le haut), la rangée de sacs de terre (les abords). Rien ne bouge, rien à lire. Code pur
// (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E } from './plan5e';
import { standingHeight } from './terrain';
import { lowRock } from './monteeSurroundings';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs des Terrasses : la pierre sèche grise du plateau mêlée d'ocre (murets, moulin, cour), la terre des
 * gradins (sèche et craquelée dans la ruine, en facettes brun-ocre, jamais en traits noirs), l'eau mate vert de ciel pâle
 * et son reflet doré sourd, le riz vert olive mat, le chaume, le bois des Passeurs (neuf, usé), le fer, le bronze des
 * seules ferrures, le vert-de-gris du motif des racines ; le grès de la jarre, la vannerie de la hotte, la toile des sacs ;
 * la seule lumière, l'ocre de la lanterne.
 */
const C = {
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  /** La pierre mêlée d'ocre, pour les joints irréguliers des murets. */
  stoneOchre: 0xa8956a,
  stoneWarm: 0x9d9a88,
  ochre: COLORS_5E.ochre,
  /** La fente d'un mur du moulin, dans la ruine : un cran sous la pierre à l'ombre, jamais presque noire. */
  crack: 0x6a6e66,
  earth: 0x9a8660,
  earthDry: 0x8a7552,
  earthLight: 0xa8935f,
  /** Le fond de la fosse sèche, sous la roue tombée : plus sombre que son bois usé. */
  pitFloor: 0x6b5e4a,
  /** Le dessus des murets restaurés et la sous-couche des dalles de la cour : un gris plus sombre que l'eau. */
  wallTop: 0x6f6a60,
  water: 0x9db8a8,
  waterGold: 0xc9c08f,
  rice: 0x8a9a5a,
  riceShade: 0x7a8a4e,
  riceFallen: 0x6e7a4c,
  straw: 0xc2ae78,
  strawShade: 0xab9866,
  ridge: 0x8c766a,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  door: 0x7d6650,
  /** Le dedans du moulin, par la porte : sombre, jamais presque noir. */
  inside: 0x4a4038,
  /** Le trou aux quatre goujons : sombre et peu profond. */
  hole: 0x433c35,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  verdigris: 0x6f9a8a,
  lantern: COLORS_5E.lantern,
  rope: 0xd8c49a,
  stoneware: 0x8c7a66,
  stonewareShade: 0x7a6a58,
  cork: 0x6e5a48,
  wicker: 0xb59a6a,
  wickerShade: 0x9c8257,
  sack: 0xc8b48a,
  sackShade: 0xb09c74,
  /** Le bois des bols de la scénette : un brun chaud et sombre, nettement distinct du banc de pierre. */
  bowl: 0x5c3b22,
  riceGrain: 0xe6dfcc,
  // Le riziculteur, en pion (son modèle 3D prend sa place, ./habitants.ts) : chemise de lin, pantalon brun retroussé,
  // jambes nues, chapeau de paille conique.
  shirt: 0xd3c4a2,
  trousers: 0x6b5a46,
  skin: 0xd9a77f,
  hat: 0xc9b47c,
} as const;

/**
 * Le tertre : trois gradins de la même largeur (de `x0` à `x1`), chacun en retrait de `depth` vers le nord ; la hauteur
 * d'une marche (`step`), la hauteur du haut du muret au-dessus de la terre du gradin (`rim`, 0,15 depuis la retouche 1 :
 * l'eau se voit après le corps), son épaisseur (`wall`), l'eau au-dessus de la terre (`water`), sous le haut du muret.
 */
const TERRACE = { x0: -7.5, x1: 3.5, depth: 3, step: 1.3, rim: 0.15, wall: 0.35, water: 0.08 } as const;

/** Le dessus de la terre du gradin `k` (0 : le bas), au-dessus de la cour. */
const topOf = (k: number): number => TERRACE.step * (k + 1);

/** L'avant du gradin `k` (son muret de façade). */
const frontOf = (k: number): number => -TERRACE.depth * k;

/** Le fond du tertre (le derrière du gradin du haut). */
const BACK = -3 * TERRACE.depth;

/** Le haut du tertre au-dessus de la cour : 3,9. */
export const TERRASSES_TOP = topOf(2);

/** Les vannes : au même endroit sur les trois murets de façade, une planche entre deux poteaux droits. */
const VANNE = { x: -4.6, half: 0.42, plank: 0.5 } as const;

/** Le canal haut : son axe, du fond du tertre jusqu'au rocher ocre du nord où il finit, à niveau. */
const HIGH_CANAL = { x: -2, from: BACK, to: BACK - 6.5 } as const;

/** Le rocher ocre des Contreforts où finit le canal haut : sa place au-delà du bout du canal, son rayon, sa hauteur au-dessus du canal. */
const CANAL_ROCK = { dz: -1.1, r: 1.7, above: 0.5 } as const;

/** Le moulin carré : ses murs (de `x0` à `x1`, de `z0` au nord à `z1` au sud), leur hauteur, sa porte au sud. */
const MILL = { x0: 4.9, x1: 10.3, z0: -6.2, z1: -2.2, wall: 3, ruinWall: 2.4, door: { x: 9.7, half: 0.42, h: 1.95 } } as const;

/** Le chaume à quatre pans : son débord, sa hauteur au-dessus des murs. */
const ROOF = { eave: 0.45, h: 2.3 } as const;

/**
 * Le chaume de la ruine (retouche 1) : le pan nord resté sur les murs, en appentis, son sommet bas (`rise` au-dessus des
 * murs) ; le pan tombé au sud-est, devant le moulin, de biais (`yaw`), un bord au sol, l'autre sur une pierre haute de
 * `stone`.
 */
const THATCH = { rise: 0.75, fallen: { x: 12.3, z: -0.7, yaw: 0.55, width: 3, depth: 1.5, stone: 0.4 } } as const;

/**
 * La roue : son moyeu (en anneau vide, devant le trou du mur, à sa hauteur), le rayon de sa jante (dedans, dehors), sa
 * largeur, ses six rayons, ses huit pales, le bout des pales.
 */
const WHEEL = { x: 5.8, y: 2, z: -1.95, r0: 1.36, r1: 1.6, width: 0.3, hub0: 0.28, hub1: 0.44, spokes: 6, paddles: 8, tip: 1.95 } as const;

/** La fosse de la roue, devant le mur sud du moulin : son contour, la hauteur de sa margelle. */
const PIT = { x0: 3.8, x1: 7.8, z0: MILL.z1, z1: -0.75, rim: 0.32 } as const;

/** Le chéneau de l'aqueduc : du gradin du haut, hors du tertre, jusqu'au-dessus de la jante, dans le plan de la roue. */
const AQUEDUCT = { from: { x: 3.65, y: topOf(2) + 0.12, z: -7.6 }, to: { x: WHEEL.x - 1.05, y: WHEEL.y + 1.75, z: WHEEL.z + WHEEL.width / 2 }, width: 0.5, side: 0.24, piles: [0.18, 0.52, 0.86] } as const;

/** Le mât, contre l'angle nord-est du moulin, du côté opposé à l'aqueduc : sa place, sa hauteur. */
const MAST = { x: MILL.x1 + 0.28, z: MILL.z0 - 0.28, top: 7 } as const;

/** La perche courte de la lanterne du riziculteur, à côté de la porte du moulin. */
const KEEPER_POLE = { x: MILL.x1 + 0.3, z: MILL.z1 + 0.3, top: 1.9 } as const;

/** La cour de dalles grises : son contour ; le canal bas qui la borde (sa demi-largeur), puis tourne vers le sud. */
const COURT = { x0: -7.4, x1: 10.8, z0: 1.15, z1: 6.7, cols: 6, rows: 3 } as const;

/** Le canal bas : le long du pied du muret du bas (`z`), de la fosse (`east`) au coin ouest (`x`), puis vers le sud. */
const LOW_CANAL = { z: 0.5, x: -8.1, east: 7.4, south: 9.8, half: 0.35 } as const;

/** Le petit pont de pierre sur le canal bas, à l'ouest de la cour. */
const BRIDGE = { z: 3.8, half: 0.65, long: 2.4 } as const;

/**
 * L'aire de battage : un disque d'un seul ton, le gris de la cour, à peine surélevé, sans rayons ni cercles, bordé d'un
 * rang de pierres un ton plus clair (retouche 1 : elle se lisait comme une roue).
 */
const THRESHING = { x: -3.6, z: 4.4, r: 1.6, rim: 1.85, h: 0.1 } as const;

/** La lanterne de la cour, sur son piquet, en tête de la cour (au coin du canal), jamais au premier plan. */
const COURT_LANTERN = { x: -7.05, z: 1.55, h: 1.5 } as const;

/** Un point du lieu, son sol, et sa hauteur au-dessus de lui. */
type At = (x: number, z: number) => number;

/**
 * Une face de pierre sèche, verticale, tournée vers le sud (+z) en `z` : deux assises de pierres de largeurs inégales,
 * leurs joints en biais, leurs tons alternés (gris, gris chaud, ocre) : les pierres se lisent par les facettes et les tons.
 */
function stoneFace(b: FacetBuilder, x0: number, x1: number, y0: number, y1: number, z: number, seed: number): void {
  const tones = [C.stone, C.stoneOchre, C.stoneWarm, C.ochre, C.stoneSun];
  const ym = y0 + (y1 - y0) * (0.48 + 0.08 * ((seed % 3) - 1));
  const w = x1 - x0;
  const cuts = (shift: number) => [0, 0.27 + shift, 0.5 - shift / 2, 0.76 + shift / 2, 1].map((t) => x0 + w * t);
  for (const [row, lo, hi] of [
    [0, y0, ym],
    [1, ym, y1],
  ] as const) {
    const xs = cuts(row ? 0.06 : -0.04);
    for (let i = 0; i < 4; i++) {
      // Le joint penche d'un côté puis de l'autre : des pierres de formes différentes, jamais des briques.
      const lean = (i % 2 ? 1 : -1) * 0.18 * (y1 - y0);
      const a = i === 0 ? 0 : lean,
        c = i === 3 ? 0 : -lean;
      const color = tones[(seed + i + row * 2) % tones.length];
      b.quad([xs[i] + a, lo, z], [xs[i + 1] + c, lo, z], [xs[i + 1] - c, hi, z], [xs[i] - a, hi, z], color);
    }
  }
}

/** Un pavé tendu le long d'un segment au sol, de section `w` × `h` (une planche, un chéneau), posé à plat. */
function slab(b: FacetBuilder, a: Vec3, c: Vec3, w: number, h: number, color: number, top = color): void {
  const dx = c.x - a.x,
    dy = c.y - a.y,
    dz = c.z - a.z;
  const horiz = Math.hypot(dx, dz);
  const len = Math.hypot(horiz, dy);
  b.box({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, z: (a.z + c.z) / 2, yaw: Math.atan2(dx, dz), pitch: Math.asin(-dy / len) }, [w, h, len], color, top);
}

/** Le chéneau en U, de `a` à `c` : son fond et ses deux bords, visibles. */
function chute(b: FacetBuilder, a: Vec3, c: Vec3, w: number, side: number, wood: number, shade: number): void {
  slab(b, a, c, w, 0.07, shade, wood);
  const dx = c.x - a.x,
    dz = c.z - a.z;
  const l = Math.hypot(dx, dz) || 1;
  const nx = -dz / l,
    nz = dx / l;
  for (const s of [-1, 1]) {
    const o = (s * (w - 0.06)) / 2;
    slab(b, { x: a.x + nx * o, y: a.y, z: a.z + nz * o }, { x: c.x + nx * o, y: c.y, z: c.z + nz * o }, 0.06, side, shade, wood);
  }
}

/**
 * Une lanterne sur un poteau (la perche du riziculteur, le mât, le piquet de la cour) : sa vitre d'ocre, sans ombre, et
 * son chapeau de bronze, posés au haut du poteau, à l'échelle `s`. Vingt-quatre triangles.
 */
function postLantern(b: FacetBuilder, at: Vec3, s = 1): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.2 * s, 0.2 * s, 0.42 * s, 6, C.lantern);
  b.prism({ x: at.x, y: at.y + 0.42 * s, z: at.z, yaw: Math.PI / 6 }, 0.28 * s, 0, 0.2 * s, 6, C.bronze);
}

/** Une roue debout dans le plan est-ouest (vue de face depuis le sud) : son point au rayon `r`, à l'angle `a`. */
const onWheel = (g: number, r: number, a: number, dz = 0): Vec3 => ({ x: WHEEL.x + r * Math.cos(a), y: g + WHEEL.y + r * Math.sin(a), z: WHEEL.z + dz });

/**
 * La roue, debout dans sa fosse, vue de face : la jante à huit pans, six rayons droits dans son plan, le moyeu en anneau
 * vide (sans aiguille ni marque : elle ne se lit pas comme une horloge), huit pales courtes et régulières, deux étais
 * droits et parallèles sous le moyeu, devant et derrière.
 */
function wheel(b: FacetBuilder, g: number): void {
  const W = WHEEL;
  const at = { x: W.x, y: g + W.y, z: W.z, pitch: Math.PI / 2 };
  b.annulus(at, W.r0, W.r1, W.width, 8, C.newShade, C.newWood);
  b.annulus(at, W.hub0, W.hub1, W.width, 6, C.newShade, C.newWood);
  const mid = W.width / 2;
  for (let k = 0; k < W.spokes; k++) {
    const a = (2 * Math.PI * k) / W.spokes;
    b.beam(onWheel(g, W.hub1 - 0.04, a, mid), onWheel(g, W.r0 + 0.04, a, mid), 0.12, C.newWood);
  }
  for (let k = 0; k < W.paddles; k++) {
    const a = (2 * Math.PI * (k + 0.5)) / W.paddles;
    const p = [onWheel(g, W.r1 - 0.02, a, -0.03), onWheel(g, W.tip, a, -0.03), onWheel(g, W.tip, a, W.width + 0.03), onWheel(g, W.r1 - 0.02, a, W.width + 0.03)] as const;
    const v = p.map((q) => [q.x, q.y, q.z] as const);
    b.quad(v[0], v[1], v[2], v[3], C.newShade);
    b.quad(v[3], v[2], v[1], v[0], C.newShade);
  }
  for (const dz of [-0.12, W.width + 0.12]) b.beam({ x: W.x, y: g + 0.02, z: W.z + dz }, { x: W.x, y: g + W.y - W.hub1 - 0.02, z: W.z + dz }, 0.16, C.newShade);
}

/**
 * Les trois arcs de jante de la roue tombée, à leur vrai rayon (le milieu de la jante), chacun sur deux pans de 35° : le
 * premier penché d'environ 30° contre le mur, au bord nord de la fosse, lisible de face ; les deux autres couchés à plat
 * sur le fond, parallèles, jamais croisés. `x`, `z` : le milieu de la corde ; `lean` : la bascule du plan de l'arc depuis
 * la verticale (contre le mur) ; `turn` : le tour de la corde dans son plan (de l'horizontale).
 */
const FALLEN_ARCS = {
  r: (WHEEL.r0 + WHEEL.r1) / 2,
  pan: (35 * Math.PI) / 180,
  width: 0.18,
  leaning: { x: 4.75, foot: -1.3, lean: (30 * Math.PI) / 180, turn: 1.2 },
  flat: [
    { x: 5.75, z: -1.12 },
    { x: 6.45, z: -1.64 },
  ],
} as const;

/** Les trois points d'un arc de jante, dans son plan : la corde de `-c` à `c` (`t` le long, `n` en travers, vers le creux). */
function arcPoints(): { t: number; n: number }[] {
  const A = FALLEN_ARCS;
  const c = A.r * Math.sin(A.pan);
  const sag = A.r * (1 - Math.cos(A.pan));
  return [
    { t: -c, n: 0 },
    { t: 0, n: sag },
    { t: c, n: 0 },
  ];
}

/** Les lignes du milieu des trois arcs de jante tombés, dans le repère du lieu (pour les tests : jamais croisées). */
export function fallenArcs(g = 0): Vec3[][] {
  const A = FALLEN_ARCS;
  const pts = arcPoints();
  const L = A.leaning;
  // Le premier, penché contre le mur : son plan tourné vers le sud, basculé de `lean` ; sa corde tournée de `turn`.
  const leaning = pts.map(({ t, n }) => {
    const px = t * Math.cos(L.turn) - n * Math.sin(L.turn);
    const py = t * Math.sin(L.turn) + n * Math.cos(L.turn) + A.r * Math.sin(A.pan) * Math.sin(L.turn);
    return { x: L.x + px, y: g + 0.06 + py * Math.cos(L.lean), z: L.foot - py * Math.sin(L.lean) };
  });
  // Les deux autres, à plat, le creux vers le nord.
  const flat = A.flat.map((f) => pts.map(({ t, n }) => ({ x: f.x + t, y: g + 0.04 + A.width / 2, z: f.z - n })));
  return [leaning, ...flat];
}

/**
 * La roue tombée dans sa fosse sèche (retouche 1) : sur un fond plus sombre, ses trois arcs de jante de bois usé clair,
 * deux pales couchées, et l'anneau du moyeu debout contre le mur, sous le trou aux quatre goujons. Rien en pointe, rien
 * de croisé.
 */
function fallenWheel(b: FacetBuilder, g: number): void {
  const W = WHEEL;
  for (const arc of fallenArcs(g)) for (let i = 0; i < 2; i++) b.beam(arc[i], arc[i + 1], FALLEN_ARCS.width, C.wornWood);
  for (const [x, z, yaw] of [
    [7.15, -1.2, 0.3],
    [4.3, -1.95, -0.4],
  ] as const)
    b.box({ x, y: g + 0.02, z, yaw }, [0.3, 0.06, 0.32], C.wornShade, C.wornWood);
  // L'anneau du moyeu, debout contre le mur, posé sur le fond, sous le trou : sa face vers la cour.
  b.annulus({ x: W.x, y: g + 0.04 + W.hub1, z: MILL.z1 + 0.06, pitch: Math.PI / 2 }, W.hub0, W.hub1, 0.08, 6, C.wornShade, C.wornWood, false);
}

/**
 * Le signe de l'absence : un trou rond, sombre et peu profond, dans le mur sud du moulin, à la hauteur du moyeu, et ses
 * quatre goujons de fer courts. Il ne change pas, avant comme après.
 */
function absence(b: FacetBuilder, g: number): void {
  const z = MILL.z1 + 0.012;
  const y = g + WHEEL.y;
  const disc = Array.from({ length: 8 }, (_, k) => [0.27 * Math.cos((Math.PI * k) / 4 + Math.PI / 8), 0.27 * Math.sin((Math.PI * k) / 4 + Math.PI / 8)] as const);
  b.plate({ x: WHEEL.x, y, z }, disc, C.hole);
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    b.box({ x: WHEEL.x + sx * 0.36, y: y + sy * 0.36 - 0.05, z: MILL.z1 + 0.09 }, [0.1, 0.1, 0.18], C.iron);
}

/** La porte du moulin : le dedans sombre ; ouverte, le battant de bois neuf ; dans la ruine, le battant usé, fermé. */
function millDoor(b: FacetBuilder, g: number, worn: boolean): void {
  const D = MILL.door;
  const z = MILL.z1 + 0.014;
  if (worn) {
    b.plate({ x: D.x, y: g, z }, [[-D.half, 0], [D.half, 0], [D.half, D.h], [-D.half, D.h]], C.wornShade);
    b.box({ x: D.x, y: g + D.h, z: MILL.z1 + 0.1 }, [2 * D.half + 0.5, 0.26, 0.24], C.wornShade, C.wornWood);
    return;
  }
  b.plate({ x: D.x, y: g, z }, [[-D.half, 0], [D.half, 0], [D.half, D.h], [-D.half, D.h]], C.inside);
  // Le battant, ouvert vers l'est, contre le chambranle.
  b.box({ x: D.x + D.half + 0.32, y: g, z: MILL.z1 + 0.36, yaw: -1.15 }, [2 * D.half - 0.05, D.h - 0.05, 0.08], C.door);
  // Le linteau de bois neuf, et dessus le motif des racines entrelacées, en vert-de-gris (une onde, sans lettre ni chiffre).
  b.box({ x: D.x, y: g + D.h, z: MILL.z1 + 0.1 }, [2 * D.half + 0.5, 0.26, 0.24], C.newShade, C.newWood);
  const zw = MILL.z1 + 0.24;
  const wave = [-0.5, -0.17, 0.17, 0.5].map((x, i) => ({ x: D.x + x, y: g + D.h + 0.13 + (i % 2 ? 0.06 : -0.02), z: zw }));
  for (let i = 0; i < 3; i++) b.beam(wave[i], wave[i + 1], 0.06, C.verdigris);
}

/**
 * Les murs du moulin jusqu'à `h` au-dessus de son sol `gm`, sans toit : un bloc de pierre sèche dont le dessus est le
 * dedans sombre, bordé du haut des murs, en pierre au soleil (jamais un couvercle gris plein, retouche 1). Vingt
 * triangles : le bloc, et quatre bandes.
 */
function millWalls(b: FacetBuilder, gm: number, h: number): void {
  const M = MILL;
  const w = 0.42;
  const y = gm + h;
  b.box({ x: (M.x0 + M.x1) / 2, y: gm + SINK, z: (M.z0 + M.z1) / 2 }, [M.x1 - M.x0, h - SINK, M.z1 - M.z0], C.stone, C.inside);
  const t = y + 0.01;
  const ring = (x0: number, z0: number, x1: number, z1: number) => b.quad([x0, t, z0], [x0, t, z1], [x1, t, z1], [x1, t, z0], C.stoneSun);
  ring(M.x0, M.z0, M.x1, M.z0 + w);
  ring(M.x0, M.z1 - w, M.x1, M.z1);
  ring(M.x0, M.z0 + w, M.x0 + w, M.z1 - w);
  ring(M.x1 - w, M.z0 + w, M.x1, M.z1 - w);
}

/** Le chaume à quatre pans du moulin, sur ses murs (`y`), et son faîte de bois. */
function roof(b: FacetBuilder, y: number): void {
  const cx = (MILL.x0 + MILL.x1) / 2,
    cz = (MILL.z0 + MILL.z1) / 2;
  const hx = (MILL.x1 - MILL.x0) / 2 + ROOF.eave,
    hz = (MILL.z1 - MILL.z0) / 2 + ROOF.eave;
  const top: [number, number, number] = [cx, y + ROOF.h, cz];
  const corner = (sx: number, sz: number): [number, number, number] => [cx + sx * hx, y, cz + sz * hz];
  const sw = corner(-1, 1),
    se = corner(1, 1),
    ne = corner(1, -1),
    nw = corner(-1, -1);
  b.triangle(sw, se, top, C.straw);
  b.triangle(se, ne, top, C.strawShade);
  b.triangle(ne, nw, top, C.straw);
  b.triangle(nw, sw, top, C.strawShade);
  // Le dessous du débord, vu d'en bas, et l'épaisseur du chaume au bord.
  b.quad(sw, nw, ne, se, C.strawShade);
  b.prism({ x: cx, y: y + ROOF.h - 0.32, z: cz, yaw: Math.PI / 4 }, 0.38, 0, 0.42, 4, C.ridge);
}

/** Un gradin (le cœur de terre, ses murets de côté), sa face de pierre sèche ; le muret de façade vient à part. */
function terrace(b: FacetBuilder, k: number): void {
  const T = TERRACE;
  const front = frontOf(k);
  const top = topOf(k);
  const width = T.x1 - T.x0;
  b.box({ x: (T.x0 + T.x1) / 2, y: SINK, z: (front + BACK) / 2 }, [width, top - SINK, front - BACK], C.stone, C.earth);
  stoneFace(b, T.x0, T.x1, k ? topOf(k - 1) : 0, top, front + 0.012, k * 2 + 1);
  // Les murets de côté, d'un gradin à l'autre : ils descendent en marches.
  for (const x of [T.x0 + T.wall / 2, T.x1 - T.wall / 2]) b.box({ x, y: top - 0.2, z: front - T.depth / 2 }, [T.wall, T.rim + 0.2, T.depth], C.stone, C.stoneSun);
  // Le muret du fond, derrière le gradin du haut.
  if (k === 2) b.box({ x: (T.x0 + T.x1) / 2, y: top - 0.2, z: BACK + T.wall / 2 }, [width, T.rim + 0.2, T.wall], C.stone, C.stoneSun);
}

/**
 * Le fond du tertre, vu de dos (retouche 1) : la pierre sèche de la façade en trois bandes de tons, avec un léger fruit
 * (le pied en avant de `batter` vers le nord). Six triangles.
 */
const BACK_FACE = { batter: 0.3, bands: [C.stoneWarm, C.stoneOchre, C.stone] } as const;

function backFace(b: FacetBuilder, foot: number): void {
  const T = TERRACE;
  const top = TERRASSES_TOP + T.rim;
  const n = BACK_FACE.bands.length;
  const at = (t: number): [number, number] => [foot + (top - foot) * t, BACK - 0.02 - BACK_FACE.batter * (1 - t)];
  for (let i = 0; i < n; i++) {
    const [y0, z0] = at(i / n),
      [y1, z1] = at((i + 1) / n);
    // Vue du nord : de l'est à l'ouest.
    b.quad([T.x1, y0, z0], [T.x0, y0, z0], [T.x0, y1, z1], [T.x1, y1, z1], BACK_FACE.bands[i]);
  }
}

/** Le muret de façade du gradin `k`, de `x0` à `x1` (entier : de bout en bout ; dans la ruine, coupé). */
function frontWall(b: FacetBuilder, k: number, x0: number = TERRACE.x0, x1: number = TERRACE.x1, worn = false): void {
  const T = TERRACE;
  // Restauré, son dessus est d'un gris plus sombre que l'eau qu'il retient : l'eau se détache de lui.
  b.box({ x: (x0 + x1) / 2, y: topOf(k) - 0.2, z: frontOf(k) - T.wall / 2 }, [x1 - x0, T.rim + 0.2, T.wall], worn ? C.stoneShade : C.stone, worn ? C.stone : C.wallTop);
}

/**
 * Le reflet doré : une facette d'eau légèrement inclinée vers le soleil bas de l'ouest-sud-ouest (son bord du fond et son
 * bord est un peu plus hauts que l'eau, toujours sous le haut du muret).
 */
const GLINT = { back: 0.05, east: 0.02 } as const;

/** L'eau d'un gradin restauré : des facettes mates vert de ciel pâle, et le reflet doré sourd sur la bande du fond. */
function terraceWater(b: FacetBuilder, k: number): void {
  const T = TERRACE;
  const y = topOf(k) + T.water;
  const x0 = T.x0 + T.wall,
    x1 = T.x1 - T.wall;
  const z1 = frontOf(k) - T.wall,
    z0 = frontOf(k) - T.depth + (k === 2 ? T.wall : 0.02);
  const zm = z0 + (z1 - z0) * 0.35;
  b.quad([x0, y, zm], [x0, y, z1], [x1, y, z1], [x1, y, zm], C.water);
  // La facette du reflet, plane : plus haute vers le fond (le nord) et vers l'est, tournée vers le soleil.
  const g = (x: number, z: number): number => y + 0.005 + (GLINT.back * (zm - z)) / (zm - z0) + (GLINT.east * (x - x0)) / (x1 - x0);
  b.quad([x0, g(x0, z0), z0], [x0, g(x0, zm), zm], [x1, g(x1, zm), zm], [x1, g(x1, z0), z0], C.waterGold);
}

/**
 * Les rangs d'épis d'un gradin (retouche 1) : deux bandes à facettes, égales, hautes de `h`, de demi-largeur `half`,
 * parallèles à la façade ; le premier rang à `behind` au moins derrière le muret (son bord avant), l'écart entre les deux
 * rangs `gap` : une bande d'eau se voit toujours devant eux.
 */
export const TERRASSES_RICE = { rows: 2, h: 0.28, half: 0.12, behind: 0.9, gap: 0.75 } as const;
const RICE = TERRASSES_RICE;

function riceRows(b: FacetBuilder, k: number): void {
  const T = TERRACE;
  const y = topOf(k) + T.water - 0.02;
  const x0 = T.x0 + T.wall + 0.25,
    x1 = T.x1 - T.wall - 0.25;
  for (let r = 0; r < RICE.rows; r++) {
    const z = frontOf(k) - T.wall - RICE.behind - RICE.half - r * RICE.gap;
    const top = y + RICE.h;
    b.quad([x0, y, z + RICE.half], [x1, y, z + RICE.half], [x1, top, z], [x0, top, z], C.rice);
    b.quad([x1, y, z - RICE.half], [x0, y, z - RICE.half], [x0, top, z], [x1, top, z], C.riceShade);
    b.triangle([x0, y, z - RICE.half], [x0, y, z + RICE.half], [x0, top, z], C.riceShade);
    b.triangle([x1, y, z + RICE.half], [x1, y, z - RICE.half], [x1, top, z], C.riceShade);
  }
}

/** La terre sèche et craquelée d'un gradin (la ruine) : des facettes brun-ocre, les craquelures sont leurs arêtes. */
function crackedEarth(b: FacetBuilder, k: number): void {
  const T = TERRACE;
  const y = topOf(k) + 0.015;
  const x0 = T.x0 + T.wall,
    x1 = T.x1 - T.wall;
  const z1 = frontOf(k) - T.wall,
    z0 = frontOf(k) - T.depth + (k === 2 ? T.wall : 0.02);
  const xs = [x0, x0 + (x1 - x0) * 0.31, x0 + (x1 - x0) * 0.64, x1];
  const zm = (z0 + z1) / 2 + 0.3 * (k - 1.5);
  for (let i = 0; i < 3; i++) {
    const a = xs[i],
      c = xs[i + 1];
    const m = (a + c) / 2 + 0.4 * (i - 1);
    b.triangle([a, y, z1], [c, y, z1], [m, y, zm], i % 2 ? C.earthDry : C.earth);
    b.triangle([a, y, z0], [a, y, z1], [m, y, zm], i % 2 ? C.earthLight : C.earthDry);
    b.triangle([c, y, z1], [c, y, z0], [m, y, zm], i % 2 ? C.earth : C.earthLight);
    b.triangle([c, y, z0], [a, y, z0], [m, y, zm], C.earthDry);
  }
}

/**
 * Une vanne : une planche entre deux poteaux droits et parallèles, contre la face du muret de façade du gradin `k`
 * (devant sa pierre : la planche se voit entre ses poteaux, retouche 1).
 */
function vanne(b: FacetBuilder, k: number): void {
  const face = frontOf(k);
  const top = topOf(k);
  for (const s of [-1, 1]) b.box({ x: VANNE.x + s * VANNE.half, y: top - 0.6, z: face + 0.09 }, [0.15, TERRACE.rim + 1.1, 0.15], C.newShade, C.newWood);
  b.box({ x: VANNE.x, y: top - 0.38, z: face + 0.06 }, [2 * VANNE.half - 0.15, VANNE.plank, 0.08], C.newWood);
}

/** Une vanne tombée : sa planche couchée au pied du muret, ses poteaux penchés, parallèles, jamais croisés. */
function fallenVanne(b: FacetBuilder, k: number, at: At): void {
  const z = frontOf(k) + 0.55;
  const foot = k ? topOf(k - 1) : at(VANNE.x, z);
  b.box({ x: VANNE.x + 0.2, y: foot - 0.02, z, yaw: 0.12 }, [2 * VANNE.half - 0.1, 0.08, VANNE.plank], C.wornShade, C.wornWood);
  for (const s of [-1, 1]) b.box({ x: VANNE.x + s * VANNE.half, y: topOf(k) - 0.3, z: frontOf(k) - 0.1, pitch: 0.5 }, [0.14, 0.75, 0.14], C.wornShade);
}

/** Les tons de la roche ocre des Contreforts (ceux du rocher des abords, ./terrassesSurroundings.ts). */
const OCHRE_ROCK = { light: COLORS_5E.ochre, shade: 0x9c8657, top: 0xc4ad78 } as const;

/**
 * Les volumes des Terrasses, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; la
 * porte est au sud, un peu à l'est, sur le chemin.
 */
function model(add: AddPiece, ground: SiteGround): void {
  const at: At = (x, z) => ground.at(x, z);
  const g = at(WHEEL.x, WHEEL.z);
  const gm = at((MILL.x0 + MILL.x1) / 2, MILL.z1);
  const T = TERRACE;
  // Toujours là : le tertre et ses faces de pierre sèche, les murets de côté, son fond en bandes ; la fosse de la roue et
  // le signe de l'absence ; les bords du canal bas et son lit ; le rocher ocre où finit le canal haut ; et la lanterne du
  // riziculteur, allumée dès la ruine (la seule), sur sa perche courte à la porte du moulin.
  add('ruine', 0, (b) => {
    for (let k = 0; k < 3; k++) terrace(b, k);
    backFace(b, Math.min(at(T.x0, BACK), at(T.x1, BACK)) - 0.1);
  });
  add('ruine', 0, (b) => {
    const P = PIT;
    const y = g - 0.3;
    b.box({ x: (P.x0 + P.x1) / 2, y, z: P.z1 - 0.15 }, [P.x1 - P.x0, P.rim + 0.3, 0.3], C.stone, C.stoneSun);
    for (const x of [P.x0 + 0.15, P.x1 - 0.15]) b.box({ x, y, z: (P.z0 + P.z1) / 2 }, [0.3, P.rim + 0.3, P.z1 - P.z0], C.stone, C.stoneSun);
    b.quad([P.x0 + 0.3, g + 0.02, P.z1 - 0.3], [P.x1 - 0.3, g + 0.02, P.z1 - 0.3], [P.x1 - 0.3, g + 0.02, P.z0], [P.x0 + 0.3, g + 0.02, P.z0], C.pitFloor);
    absence(b, gm);
  });
  add('ruine', 0, (b) => {
    const L = LOW_CANAL;
    const y = at(0, L.z) + 0.02;
    // Le lit, de terre sèche, le long du pied du tertre puis vers le sud ; ses bords de pierre basse côté cour.
    b.quad([L.x - L.half, y, L.z - L.half], [L.x - L.half, y, L.z + L.half], [L.east, y, L.z + L.half], [L.east, y, L.z - L.half], C.earthDry);
    b.quad([L.x - L.half, y, L.z + L.half], [L.x - L.half, y, L.south], [L.x + L.half, y, L.south], [L.x + L.half, y, L.z + L.half], C.earthDry);
    b.box({ x: (L.x + L.half + L.east) / 2 + 0.1, y: y - 0.3, z: L.z + L.half + 0.12 }, [L.east - L.x - L.half - 0.2, 0.48, 0.24], C.stone, C.stoneSun);
    for (const s of [-1, 1]) b.box({ x: L.x + s * (L.half + 0.12), y: y - 0.3, z: (L.z + L.half + L.south) / 2 + (s < 0 ? -0.5 : 0.1) }, [0.24, 0.48, L.south - L.z - L.half + (s < 0 ? 1.2 : 0)], C.stone, C.stoneSun);
  });
  add('ruine', 0, (b) => {
    // Le rocher ocre des Contreforts, aussi haut que le canal qui finit contre lui.
    const x = HIGH_CANAL.x,
      z = HIGH_CANAL.to + CANAL_ROCK.dz;
    const y = at(x, z);
    lowRock(b, { x, y, z }, CANAL_ROCK.r, TERRASSES_TOP + 0.1 + CANAL_ROCK.above - y, 5, OCHRE_ROCK);
  });
  add('ruine', 0, (b) => {
    const K = KEEPER_POLE;
    const y = at(K.x, K.z);
    b.box({ x: K.x, y: y - 0.3, z: K.z }, [0.13, K.top + 0.3, 0.13], C.wornShade);
    postLantern(b, { x: K.x, y: y + K.top, z: K.z });
  });

  // La ruine que le corps relève : les murets de façade (le bas debout, la brèche du milieu, le haut effondré à l'est et son
  // tas de pierres sur le gradin du milieu), la flaque du bas et ses rangs couchés, la terre craquelée du milieu et du
  // haut, le canal haut couché, les vannes tombées, le moulin bas et fendu, la roue dans sa fosse.
  const corps = { stage: 0 as Stage, row: 0 };
  add(
    'ruine',
    0,
    (b) => {
      frontWall(b, 0, T.x0, T.x1, true);
      frontWall(b, 1, T.x0, -1.4, true);
      frontWall(b, 1, -0.2, T.x1, true);
      frontWall(b, 2, T.x0, -0.6, true);
      // Le tas de pierres du muret du haut, glissé sur le gradin du milieu (cinq pierres au plus).
      for (const [x, z, s, yaw] of [
        [0.6, -5.5, 0.7, 0.3],
        [1.5, -5.1, 0.6, 1.1],
        [2.4, -5.6, 0.65, 0.6],
        [1.1, -4.5, 0.5, 1.6],
      ] as const)
        b.box({ x, y: topOf(1) - 0.1, z, yaw, pitch: 0.18 }, [s, s * 0.55, s * 0.8], C.stoneShade, C.stone);
    },
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      // La flaque peu profonde du gradin du bas, pâle, sans reflet doré ; deux rangs de riz couchés, en bandes plates sombres.
      const y = topOf(0) + 0.04;
      b.plate({ x: 0, y, z: 0, pitch: -Math.PI / 2 }, [[-6.6, 0.5], [-1.2, 0.5], [0.6, 1.4], [-0.8, 2.5], [-6.6, 2.4]], C.water);
      for (const [x0, x1, z] of [
        [-5.8, -2.6, -1.1],
        [-4.9, -1.8, -1.8],
      ] as const)
        b.quad([x0, y + 0.02, z + 0.18], [x1, y + 0.02, z + 0.18], [x1, y + 0.02, z - 0.18], [x0, y + 0.02, z - 0.18], C.riceFallen);
      crackedEarth(b, 1);
      crackedEarth(b, 2);
    },
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Le canal haut : trois tronçons de bois couchés à plat sur le gradin du haut, parallèles.
      const y = topOf(2) + 0.02;
      for (const [x, z] of [
        [-2.6, -7.1],
        [-0.4, -7.5],
        [1.8, -7.0],
      ] as const)
        b.box({ x, y, z, yaw: Math.PI / 2 + 0.25 }, [2, 0.14, 0.5], C.wornShade, C.wornWood);
      for (let k = 0; k < 3; k++) fallenVanne(b, k, at);
    },
    corps,
  );
  add(
    'ruine',
    0,
    (b) => {
      // Le moulin : ses murs bas, fendus ; sa porte usée, fermée ; la roue en morceaux dans sa fosse.
      millWalls(b, gm, MILL.ruinWall);
      stoneFace(b, MILL.x0, MILL.x1, gm, gm + MILL.ruinWall - 0.05, MILL.z1 + 0.01, 4);
      // Les fentes des murs : deux longues facettes plus sombres, en biais, sur la face sud et la face ouest.
      b.plate({ x: 7.7, y: gm + 0.5, z: MILL.z1 + 0.016 }, [[0, 0], [0.14, 0], [0.44, 1.8], [0.3, 1.8]], C.crack);
      b.plate({ x: MILL.x0 - 0.016, y: gm + 0.3, z: -3.6, yaw: -Math.PI / 2 }, [[0, 0], [0.14, 0], [-0.2, 1.9], [-0.34, 1.9]], C.crack);
      millDoor(b, gm, true);
      fallenWheel(b, g);
    },
    corps,
  );

  // La ruine que le corps relève aussi : le pan nord du chaume, seul resté sur les murs, en appentis (son sommet bas, le
  // haut des murs ouvert côté sud) ; il part avec le corps, quand les murs remontent.
  add(
    'ruine',
    0,
    (b) => {
      const M = MILL;
      const y = gm + M.ruinWall;
      const e = ROOF.eave;
      const ridge = (M.z0 + M.z1) / 2 - 0.3;
      const nw: [number, number, number] = [M.x0 - e, y - 0.15, M.z0 - e],
        ne: [number, number, number] = [M.x1 + e, y - 0.15, M.z0 - e],
        se: [number, number, number] = [M.x1 + e - 0.4, y + THATCH.rise, ridge],
        sw: [number, number, number] = [M.x0 - e + 0.6, y + THATCH.rise - 0.1, ridge + 0.3];
      // Le dessus de paille, et son dessous, qu'on voit par le haut ouvert des murs.
      b.quad(nw, sw, se, ne, C.straw);
      b.quad(nw, ne, se, sw, C.strawShade);
    },
    corps,
  );
  // La ruine que le haut relève : le pan tombé, de biais au sud-est, devant le moulin, à l'écart du chemin de la porte,
  // un bord au sol, l'autre sur une pierre.
  add(
    'ruine',
    0,
    (b) => {
      const F = THATCH.fallen;
      const y = at(F.x, F.z);
      b.box({ x: F.x - Math.sin(F.yaw) * (F.depth / 2 - 0.3), y: y - 0.2, z: F.z - Math.cos(F.yaw) * (F.depth / 2 - 0.3), yaw: F.yaw }, [0.55, F.stone + 0.2, 0.5], C.stoneShade, C.stone);
      b.box({ x: F.x, y: y + F.stone / 2 - 0.08, z: F.z, yaw: F.yaw, pitch: Math.atan2(F.stone, F.depth) }, [F.width, 0.16, F.depth], C.strawShade, C.straw);
    },
    { stage: 1, row: 0 },
  );
  add(
    'ruine',
    0,
    (b) => {
      // L'aqueduc tombé : le chéneau en deux morceaux couchés à côté de ses piles, l'une d'elles penchée.
      const A = AQUEDUCT;
      const p = (t: number) => ({ x: A.from.x + (A.to.x - A.from.x) * t, z: A.from.z + (A.to.z - A.from.z) * t });
      A.piles.forEach((t, i) => {
        const q = p(t);
        const y = at(q.x, q.z);
        const h = i === 1 ? 1.4 : A.from.y + (A.to.y - A.from.y) * t - 0.1 - (i === 2 ? 0.9 : 0);
        b.box({ x: q.x, y: y - 0.3, z: q.z, pitch: i === 1 ? 0.35 : 0, yaw: 0.2 }, [0.5, h + 0.3, 0.5], C.stone, C.stoneSun);
      });
      for (const [t0, t1, off] of [
        [0.05, 0.47, 0.75],
        [0.55, 0.95, 0.8],
      ] as const) {
        const a = p(t0),
          c = p(t1);
        const ya = at(a.x + off, a.z),
          yc = at(c.x + off, c.z);
        chute(b, { x: a.x + off, y: ya + 0.02, z: a.z }, { x: c.x + off, y: yc + 0.02, z: c.z }, A.width, A.side * 0.8, C.wornWood, C.wornShade);
      }
    },
    { stage: 1, row: 0 },
  );

  // La ruine que les abords relèvent : quelques dalles grises inclinées, le petit pont brisé sur le canal à sec.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw, pitch] of [
        [-1.6, 2.6, 0.2, 0.12],
        [5.6, 4.6, -0.3, -0.1],
        [-5.4, 5.6, 0.5, 0.14],
      ] as const)
        b.box({ x, y: at(x, z) - 0.12, z, yaw, pitch }, [1.4, 0.18, 1.1], C.stoneShade, C.stone);
      const L = LOW_CANAL;
      for (const s of [-1, 1])
        b.box({ x: L.x + s * 0.75, y: at(L.x, BRIDGE.z) - 0.25, z: BRIDGE.z, yaw: Math.PI / 2, pitch: s * 0.28 }, [2 * BRIDGE.half, 0.3, 1.05], C.stoneShade, C.stone);
    },
    { stage: 2, row: 0 },
  );

  // Le corps : les trois murets refaits, l'eau dans les trois gradins, les trois vannes, le canal haut ; puis le moulin
  // jusqu'en haut des murs, sans toit, avec sa porte et son linteau ; la roue neuve, au moyeu vide, debout dans sa fosse.
  add(0, 0, (b) => {
    for (let k = 0; k < 3; k++) {
      frontWall(b, k);
      terraceWater(b, k);
      vanne(b, k);
    }
    const y = topOf(2) + 0.08;
    const H = HIGH_CANAL;
    chute(b, { x: H.x, y, z: H.from + 0.4 }, { x: H.x, y, z: H.to }, 0.55, 0.24, C.newWood, C.newShade);
    for (const z of [H.from - 2.4, H.from - 5]) b.box({ x: H.x, y: at(H.x, z) - 0.3, z }, [0.2, y - at(H.x, z) + 0.3, 0.2], C.newShade);
  });
  add(0, 0.5, (b) => {
    millWalls(b, gm, MILL.wall);
    stoneFace(b, MILL.x0, MILL.x1, gm, gm + MILL.wall - 0.05, MILL.z1 + 0.01, 4);
    millDoor(b, gm, false);
    wheel(b, g);
  });
  // Le haut : le chaume à quatre pans ; l'aqueduc et ses trois piles ; le mât à l'angle nord-est, dont la lanterne
  // s'allume avec cette partie (jamais à une réussite).
  add(1, 0, (b) => roof(b, gm + MILL.wall));
  add(1, 0.5, (b) => {
    const A = AQUEDUCT;
    chute(b, A.from, A.to, A.width, A.side, C.newWood, C.newShade);
    for (const t of A.piles) {
      const x = A.from.x + (A.to.x - A.from.x) * t,
        z = A.from.z + (A.to.z - A.from.z) * t;
      const y = at(x, z);
      const top = A.from.y + (A.to.y - A.from.y) * t - 0.04;
      b.box({ x, y: y - 0.3, z }, [0.45, top - y + 0.3, 0.45], C.stone, C.stoneSun);
    }
    const y = at(MAST.x, MAST.z);
    b.box({ x: MAST.x, y: y - 0.4, z: MAST.z }, [0.24, MAST.top + 0.4, 0.24], C.newShade, C.newWood);
    postLantern(b, { x: MAST.x, y: y + MAST.top, z: MAST.z }, 1.3);
  });
  // Les abords : la cour de dalles grises et son aire de battage ; puis l'eau du canal bas et son petit pont de pierre, les
  // rangs d'épis dans les trois gradins, la lanterne sur piquet en tête de la cour.
  add(2, 0, (b) => {
    const K = COURT;
    // La sous-couche, d'un gris foncé, sous les dalles : leurs joints ne montrent plus le vert du terrain.
    const u = (x: number, z: number): [number, number, number] => [x, at(x, z) + 0.015, z];
    b.quad(u(K.x0, K.z0), u(K.x0, K.z1), u(K.x1, K.z1), u(K.x1, K.z0), C.wallTop);
    const dx = (K.x1 - K.x0) / K.cols,
      dz = (K.z1 - K.z0) / K.rows;
    for (let i = 0; i < K.cols; i++)
      for (let j = 0; j < K.rows; j++) {
        const x0 = K.x0 + i * dx + 0.05,
          x1 = x0 + dx - 0.1;
        const z0 = K.z0 + j * dz + 0.05,
          z1 = z0 + dz - 0.1;
        const y = at((x0 + x1) / 2, (z0 + z1) / 2) + 0.06;
        b.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], (i + j) % 2 ? C.stone : C.stoneSun);
      }
    const R = THRESHING;
    const y = at(R.x, R.z);
    // Le rang de pierres du bord, un ton plus clair, son dessus et son côté ; dedans, un seul ton, le gris de la cour.
    const n = 8;
    const ring = (r: number, h: number) => Array.from({ length: n }, (_, k) => [R.x + r * Math.cos((2 * Math.PI * k) / n + 0.2), y + h, R.z + r * Math.sin((2 * Math.PI * k) / n + 0.2)] as [number, number, number]);
    const inner = ring(R.r, R.h + 0.06),
      outer = ring(R.rim, R.h + 0.06),
      foot = ring(R.rim, -0.1),
      floor = ring(R.r, R.h);
    const mid: [number, number, number] = [R.x, y + R.h, R.z];
    for (let k = 0; k < n; k++) {
      const m = (k + 1) % n;
      b.quad(inner[m], outer[m], outer[k], inner[k], C.stoneSun);
      b.quad(foot[m], foot[k], outer[k], outer[m], C.stoneSun);
      b.triangle(mid, floor[m], floor[k], C.stone);
    }
  });
  add(2, 0.5, (b) => {
    const L = LOW_CANAL;
    const y = at(0, L.z) + 0.12;
    b.quad([L.x - L.half, y, L.z - L.half], [L.x - L.half, y, L.z + L.half], [L.east, y, L.z + L.half], [L.east, y, L.z - L.half], C.water);
    b.quad([L.x - L.half, y, L.z + L.half], [L.x - L.half, y, L.south], [L.x + L.half, y, L.south], [L.x + L.half, y, L.z + L.half], C.water);
    const yb = at(L.x, BRIDGE.z);
    b.box({ x: L.x, y: yb - 0.2, z: BRIDGE.z }, [BRIDGE.long, 0.55, 2 * BRIDGE.half], C.stone, C.stoneSun);
    for (let k = 0; k < 3; k++) riceRows(b, k);
    const P = COURT_LANTERN;
    const yl = at(P.x, P.z);
    b.box({ x: P.x, y: yl - 0.3, z: P.z }, [0.12, P.h + 0.3, 0.12], C.newShade);
    postLantern(b, { x: P.x, y: yl + P.h, z: P.z }, 0.85);
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

/** Où se pose la trace de chaque mission, depuis le centre du lieu : contre le mur sud du moulin, puis au bord du canal. */
const TRACE_SPOTS = {
  population: { x: 7.95, z: MILL.z1 + 0.5 },
  resources: { x: 8.75, z: MILL.z1 + 0.45 },
  risks: { x: -4.3, z: LOW_CANAL.z + LOW_CANAL.half + 0.62 },
} as const;

/**
 * La jarre (Population et développement) : une grande jarre de grès gris-brun, ventrue, lisse et bouchée, à deux anses,
 * contre le mur sud du moulin, entre la roue et la porte (de l'ordre de 1,2 de haut).
 */
function jar(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.population;
    const g = groundNear(c, S.x, S.z);
    l.prism({ x: S.x, y: g - 0.05, z: S.z }, 0.3, 0.46, 0.55, 7, C.stonewareShade, C.stoneware);
    // L'épaule, qui se referme sur le col, et le bouchon de bois (le dessus).
    l.prism({ x: S.x, y: g + 0.5, z: S.z }, 0.46, 0.2, 0.62, 7, C.stoneware, C.cork);
    for (const s of [-1, 1]) l.beam({ x: S.x + s * 0.3, y: g + 1.02, z: S.z }, { x: S.x + s * 0.44, y: g + 0.82, z: S.z }, 0.08, C.stonewareShade);
  });
}

/**
 * La hotte (Des ressources à gérer) : une hotte de vannerie haute (de l'ordre de 1,5), évasée vers le haut, tressée en
 * deux tons, ouverte, à moitié pleine de bûchettes, debout contre le mur à côté de la jarre ; ses deux bretelles se voient
 * de face.
 */
function basket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.resources;
    const g = groundNear(c, S.x, S.z);
    l.band({ x: S.x, y: g, z: S.z }, 0.26, 0.7, 6, C.wickerShade);
    l.prism({ x: S.x, y: g + 0.7, z: S.z }, 0.27, 0.4, 0.75, 6, C.wicker, C.wickerShade);
    // Le dessus ouvert : le dedans plus sombre, d'où dépassent deux bûchettes.
    for (const [dx, dz, lean] of [
      [-0.1, 0.05, 0.2],
      [0.12, -0.06, -0.15],
    ] as const)
      l.beam({ x: S.x + dx, y: g + 1.25, z: S.z + dz }, { x: S.x + dx + lean, y: g + 1.75, z: S.z + dz }, 0.09, C.newShade);
    // Les deux bretelles, tournées vers la cour : de cuir de bois brun, d'un bord du haut au bas de la hotte.
    for (const s of [-1, 1]) {
      const top = { x: S.x + s * 0.16, y: g + 1.38, z: S.z + 0.38 };
      const mid = { x: S.x + s * 0.18, y: g + 0.85, z: S.z + 0.42 };
      const low = { x: S.x + s * 0.15, y: g + 0.4, z: S.z + 0.29 };
      l.beam(top, mid, 0.07, C.door);
      l.beam(mid, low, 0.07, C.door);
    }
  });
}

/**
 * Les sacs de terre (Risques et changement climatique) : une seule rangée basse de cinq sacs ventrus, le col noué (jamais
 * des cônes, retouche 1), sans marque, au bord du canal bas, côté cour (jamais une pile en pyramide).
 */
export const SACKS = 5;

/** Un sac : son ventre (rayons du bas, du plus large, du col), ses hauteurs, son nœud ; cinq pans. Trente-cinq triangles. */
const SACK = { r0: 0.26, r1: 0.34, neck: 0.11, knot: 0.16, belly: 0.18, shoulder: 0.4, tie: 0.47, top: 0.56, sides: 5 } as const;

function sack(l: FacetBuilder, x: number, g: number, z: number, turn: number): void {
  const S = SACK;
  const ring = (r: number, y: number) => Array.from({ length: S.sides }, (_, k) => [x + r * Math.cos((2 * Math.PI * k) / S.sides + turn), g + y, z + r * Math.sin((2 * Math.PI * k) / S.sides + turn)] as [number, number, number]);
  const rings = [ring(S.r0, -0.04), ring(S.r1, S.belly), ring(S.neck, S.shoulder), ring(S.knot, S.tie)];
  const colors = [C.sackShade, C.sack, C.sackShade];
  for (let i = 0; i < 3; i++)
    for (let k = 0; k < S.sides; k++) {
      const m = (k + 1) % S.sides;
      l.quad(rings[i][m], rings[i][k], rings[i + 1][k], rings[i + 1][m], colors[i]);
    }
  // Le haut noué : une petite touffe en pointe au-dessus du col.
  const tip: [number, number, number] = [x, g + S.top, z];
  for (let k = 0; k < S.sides; k++) l.triangle(rings[3][(k + 1) % S.sides], rings[3][k], tip, C.sack);
}

function sacks(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.risks;
    for (let i = 0; i < SACKS; i++) {
      const x = S.x + (i - (SACKS - 1) / 2) * 0.78;
      sack(l, x, groundNear(c, x, S.z), S.z, 0.3 * i);
    }
  });
}

// ---------- La scénette ----------

/** Le plancher de la scène, le pavé gris devant le moulin : sa demi-largeur, sa profondeur, sa hauteur. */
const SCENE_FLOOR = { half: 3.7, depth: 2.4, rise: 0.15 } as const;

/** Le milieu de la scène, depuis le centre du lieu : devant le moulin, sa porte derrière, le bas du tertre à gauche. */
const SCENE_SPOT = { dx: 7.4, dz: 2.6 } as const;

/** Le plancher de la scène : un pavé de dalles grises, à joints nets, sur un socle de pierre. */
function sceneFloor(b: FacetBuilder, floor: Vec3): void {
  const F = SCENE_FLOOR;
  const g = Math.min(standingHeight(heightAt5e({ x: floor.x, z: floor.z })), floor.y - 0.1);
  b.box({ x: floor.x, y: g - 0.3, z: floor.z }, [2 * F.half, floor.y - g + 0.28, F.depth], C.stoneShade, C.stone);
  const n = 4;
  for (let k = 0; k < n; k++)
    for (let j = 0; j < 2; j++) {
      const x0 = floor.x - F.half + (k * 2 * F.half) / n + 0.05,
        x1 = x0 + (2 * F.half) / n - 0.1;
      const z0 = floor.z - F.depth / 2 + (j * F.depth) / 2 + 0.05,
        z1 = z0 + F.depth / 2 - 0.1;
      b.quad([x0, floor.y, z0], [x0, floor.y, z1], [x1, floor.y, z1], [x1, floor.y, z0], (k + j) % 2 ? C.stone : C.stoneSun);
    }
}

/**
 * Le riziculteur en pion (son modèle 3D prend sa place, ./habitants.ts), immobile, le visage nu : ses jambes nues, son
 * pantalon retroussé, sa chemise de lin, son chapeau de paille conique ; les bras le long du corps.
 */
function riceFarmer(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.09, 0.1, 0.24, 6, C.skin);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.24, z: at.z }, 0.13, 0.12, 0.3, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.52, z: at.z }, 0.28, 0.26, 0.48, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.skin);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.42, 0, 0.26, 8, C.hat);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Le long banc de pierre des réponses : sa hauteur, à l'échelle 1 ; un bol choisi se soulève d'un cran. */
const BENCH = { height: 0.5, lift: 0.2 } as const;

/** Un bol de bois rond à l'échelle `s`, un dôme bas de riz clair dessus. Quarante-deux triangles. */
function bowl(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.2 * s, 0.32 * s, 0.16 * s, 7, C.bowl, C.riceGrain);
  b.prism({ x: at.x, y: at.y + 0.16 * s, z: at.z, yaw: 0.45 }, 0.3 * s, 0.12 * s, 0.12 * s, 7, C.riceGrain, C.riceGrain);
}

export const TERRASSES: PlaceArt = {
  role: 'Le riziculteur',
  model,
  // L'étape la plus basse qui porte une trace : la scénette se joue sur le lieu dès que le corps est posé. Chaque trace a
  // la sienne (`stage`) : elle se montre quand sa mission est réussie et que son étape est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [SCENE_FLOOR.half, SCENE_FLOOR.depth / 2], fine: true },
  site: {
    rise: SCENE_FLOOR.rise,
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.2, dz: 0.2 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  decor(b, floor, at, sphere, body = true) {
    sceneFloor(b, floor);
    if (body) riceFarmer(b, at, sphere);
  },
  answer: {
    size: { height: BENCH.height + BENCH.lift + 0.3, half: 0.36 },
    // Le long banc de pierre, sur deux pieds, sous la rangée des bols.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BENCH.height * s;
      b.box({ x: mid, y: top - 0.12 * s, z }, [span + 0.7, 0.12 * s, 0.7 * s], C.stoneShade, C.stoneSun);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.05);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.3, top - 0.12 * s - foot, 0.55 * s], C.stoneShade, C.stone);
      }
    },
    // Un bol de riz posé sur le banc ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      bowl(b, { x: at.x, y: at.y + (BENCH.height + (picked ? BENCH.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les trois missions en R : le pavé seul, rien de l'item ; les bols portent les réponses.
  rest() {},
  traces: {
    population: { at: TRACE_SPOTS.population, lift: 1.2, stage: 0, draw: jar },
    resources: { at: TRACE_SPOTS.resources, lift: 1.5, stage: 1, draw: basket },
    risks: { at: TRACE_SPOTS.risks, lift: 0.8, stage: 2, draw: sacks },
  },
  // Kéo au retour : dans la cour, à l'ouest de la porte, face au tertre.
  exit: { x: 1, z: 6 },
  // Sur la Carte, le nom sous le pied du tertre, au bord de la cour : à côté du tertre et du moulin, jamais dessus.
  mapPoint: { x: 1.5, y: 0, z: COURT.z0 },
};

/** Le plus haut des Terrasses : le haut du mât, au-dessus du sol (il reste bien sous les aiguilles). */
export const TERRASSES_MAST_TOP = MAST.top;

/** Le moyeu de la roue et le trou aux quatre goujons, dans le repère du lieu, au-dessus de son sol : ils sont alignés. */
export const TERRASSES_WHEEL = { hub: { x: WHEEL.x, y: WHEEL.y, z: WHEEL.z }, hole: { x: WHEEL.x, y: WHEEL.y, z: MILL.z1 }, radius: WHEEL.r1, spokes: WHEEL.spokes } as const;

/** Le tertre et le moulin, dans le repère du lieu : pour les tests (le moulin à l'est du tertre, l'aqueduc entre eux). */
export const TERRASSES_LAYOUT = { terrace: { x0: TERRACE.x0, x1: TERRACE.x1, back: BACK, step: TERRACE.step, rim: TERRACE.rim, water: TERRACE.water, depth: TERRACE.depth, wall: TERRACE.wall }, mill: MILL, aqueduct: AQUEDUCT, vanneX: VANNE.x, lowCanal: LOW_CANAL, pit: PIT, court: COURT } as const;

/** Les couleurs des bols de la scénette et du banc, et du dessus des murets : pour les tests (contraste). */
export const TERRASSES_COLORS = { bowl: C.bowl, rice: C.riceGrain, benchTop: C.stoneSun, benchSide: C.stoneShade, wallTop: C.wallTop, water: C.water, wornWood: C.wornWood, pitFloor: C.pitFloor } as const;
