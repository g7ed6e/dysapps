/**
 * Les abords de la scénette de la Mangrove (reprise lieu par lieu, d'après les concepts du 18 octobre 2026,
 * « scenettes-6e-mangrove ») : une mangrove dans l'eau du lagon, tout autour du platelage où se tiennent Kéo et la
 * botaniste, finie de chaque côté puisque la caméra tourne (« caméra libre »). Dans la moitié droite du cadre de face
 * (directeur artistique) : un ponton de planches qui part du bout est du platelage et file vers le nord, jusqu'à une
 * cabane de bois sur pilotis au toit d'ardoise bleue (sa caisse de jeunes plants sur le perron), une barque amarrée à
 * son pied ; des palétuviers dans l'eau, de part et d'autre, leurs racines en arceaux qui plongent dans l'eau, leur
 * houppier en grosses masses à facettes. De côté, d'autres palétuviers dans le lagon, à l'est ; de dos, au bord de la
 * vasière, de jeunes palétuviers et des rochers de pierre chaude.
 *
 * Les abords suivent l'état du lieu (relecture du 19 octobre 2026) : tant que le carbet n'est pas relevé (`topped` faux,
 * l'étape du haut de places.ts, `MANGROVE`, pas encore posée), le ponton et la cabane sont là, la barque amarrée à son
 * pied. Le carbet bâti, ils s'en vont : le carbet tient leur place, seuls restent les palétuviers, les rochers et la
 * barque, amarrée au petit ponton d'accostage du carbet.
 *
 * Le lieu bâti (places.ts, `MANGROVE`) garde sa passerelle en coude, son carbet et ses trois palétuviers : le ponton
 * longe la passerelle à l'est sans la toucher, la cabane et les palétuviers se tiennent hors de son emprise ; quand le
 * lieu est relevé, la passerelle et le ponton se lisent comme deux bras d'un même réseau de planches. Rien de haut entre
 * la caméra de face et la scène (Kéo, la botaniste, la pirogue de l'item) ; ce qui est haut se tient à plus de 7,5 du
 * point visé (`RING`). Aplats francs, une couleur par facette, jamais presque noir. Code pur, sans Three.js.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { placeById } from './plan6e';
import { MANGROVE } from './places';
import type { SurroundingsState } from './surroundings';
import { NATURE, TIMBER, barque, barqueFloor, groundAt, jitter, pontoon, rock, tuft, type P3 } from './surroundingsKit';

const C = {
  /** Le bois des palétuviers (places.ts, `mangroveWood`), un peu plus chaud au soleil sur les racines. */
  wood: 0x7a6a58,
  woodLight: 0x8c7a63,
  /** Le houppier : le dessous à l'ombre, les flancs en deux verts, le dessus en deux verts clairs (jamais presque noir). */
  leafUnder: 0x3f7a4f,
  leafSide: 0x4f8c58,
  leafSideAlt: 0x5c9a5e,
  leafTop: 0x6eaa66,
  leafTopAlt: 0x7db86f,
  /** La cabane : ses planches, leurs joints, la porte et la vitre (un gris-bleu, pas un trou noir). */
  plank: 0xc98e55,
  plankShade: 0xb98049,
  seam: 0x9a6a3e,
  door: 0x8a6440,
  glass: 0x6f8c99,
  frame: 0xe6c88f,
  /** L'ardoise bleue du toit (celle de la maison du kit), en deux bandes, le faîtage, les pignons de planches. */
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  ridge: 0x40608c,
  /** La caisse de jeunes plants et leurs feuilles. */
  crate: 0xb08658,
  sprout: 0x5fae6a,
  /** L'amarre. */
  rope: 0x8f7a5c,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, le milieu du platelage de la scénette ; x à l'est, z au sud) :
 * le ponton (son départ au bout est du platelage, sa fin au perron de la cabane, sa largeur, son dessus sous le
 * platelage), la cabane (son milieu, sa largeur le long de la façade, sa profondeur, la hauteur de ses murs, la pente
 * de son toit), la barque (le milieu de son fond, sa longueur, sa largeur).
 */
export const MANGROVE_SURROUNDINGS = {
  pontoon: { from: { dx: 5.35, dz: 0.3 }, to: { dx: 4.4, dz: -9.2 }, width: 1.0, drop: 0.06, pairs: 5 },
  cabin: { dx: 3.8, dz: -11.3, width: 3.0, depth: 2.3, wall: 1.6, slope: 0.7, porch: 0.8 },
  barque: { dx: 0.1, dz: -10.7, length: 2.0, width: 0.95 },
} as const;

/** La distance au point visé en deçà de laquelle rien de haut ne se dresse (Kéo, la botaniste, la pirogue). */
export const RING = 7.5;

/**
 * Les palétuviers : x, z depuis le sol de la scène, taille, graine, segments de chaque racine (3 près de la caméra de
 * face, 2 au loin). Hors de l'emprise du lieu bâti (sa passerelle, son carbet et ses palétuviers).
 */
const TREES: readonly (readonly [number, number, number, number, number])[] = [
  [7.4, -9.6, 1.15, 1, 3],
  [1.2, -14.4, 1.1, 2, 3],
  [6.4, -14.8, 1.0, 3, 2],
  [-2.8, -13.6, 1.0, 4, 2],
  [-6.4, -10.2, 1.05, 5, 2],
  [11.4, 1.8, 1.1, 6, 2],
];

/** Les jeunes palétuviers au bord de la vasière (de dos) : x, z, taille. */
const SAPLINGS: readonly (readonly [number, number, number])[] = [
  [-8.0, -4.8, 0.55],
  [-8.2, 5.6, 0.6],
  [-5.9, 9.2, 0.5],
  [7.8, 5.6, 0.5],
];

/** Les rochers de pierre chaude sur la rive (le kit) : x, z, rayon, hauteur, graine. */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [-7.9, 2.6, 0.7, 0.55, 3],
  [-5.2, 7.0, 0.55, 0.45, 8],
  [7.4, 6.8, 0.65, 0.5, 12],
];

export function mangroveSurroundings(b: FacetBuilder, floor: Vec3, state: SurroundingsState): void {
  const X = (dx: number) => floor.x + dx;
  const Z = (dz: number) => floor.z + dz;
  const P = MANGROVE_SURROUNDINGS.pontoon;
  const top = floor.y - P.drop;
  if (state.topped) dockedAtCarbet(b, top);
  else {
    pontoon(b, { from: { x: X(P.from.dx), z: Z(P.from.dz) }, to: { x: X(P.to.dx), z: Z(P.to.dz) }, width: P.width, top, pairs: P.pairs });
    cabin(b, X, Z, top);
    moored(b, X, Z, top);
  }
  for (const [dx, dz, s, seed, segments] of TREES) mangroveTree(b, X(dx), Z(dz), s, seed, segments);
  for (const [dx, dz, s] of SAPLINGS) {
    const x = X(dx),
      z = Z(dz);
    mangroveTree(b, x, z, s, Math.round(dx * 10), 2, groundAt(x, z, 0, 0), true);
  }
  for (const [dx, dz, r, h, seed] of ROCKS) rock(b, { x: X(dx), y: groundAt(X(dx), Z(dz), 0.05), z: Z(dz) }, r, h, seed);
  for (const [k, [dx, dz]] of TUFTS.entries()) tuft(b, { x: X(dx), y: groundAt(X(dx), Z(dz), 0, 0), z: Z(dz) }, k + 70, undefined, 1.1);
}

/** Les touffes d'herbe, sur la rive, autour des rochers et des jeunes palétuviers : x, z. */
const TUFTS: readonly (readonly [number, number])[] = [
  [-8.1, 3.9],
  [-5.6, 7.2],
  [-7.6, -3.4],
  [6.8, 6.0],
];

/** Un triangle tourné à l'opposé de `from` (le cœur d'un volume), quel que soit l'ordre de ses sommets. */
function away(b: FacetBuilder, p: P3, q: P3, r: P3, from: P3, color: number): void {
  const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
  const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const c = [(p[0] + q[0] + r[0]) / 3 - from[0], (p[1] + q[1] + r[1]) / 3 - from[1], (p[2] + q[2] + r[2]) / 3 - from[2]];
  if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] >= 0) b.triangle(p, q, r, color);
  else b.triangle(p, r, q, color);
}

/** Un tronçon à trois pans, de `a` (rayon `r0`) à `c` (rayon `r1`), sans dessus ni dessous : une racine, un tronc. */
function limb(b: FacetBuilder, a: P3, c: P3, r0: number, r1: number, color: number, alt = color): void {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const l = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const n = d.map((v) => v / l);
  const ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u0 = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]];
  const ul = Math.hypot(u0[0], u0[1], u0[2]);
  const u = u0.map((v) => v / ul);
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const ring = (p: P3, r: number): P3[] =>
    [0, 1, 2].map((k) => {
      const t = (2 * Math.PI * k) / 3;
      const [cu, sv] = [Math.cos(t) * r, Math.sin(t) * r];
      return [p[0] + cu * u[0] + sv * v[0], p[1] + cu * u[1] + sv * v[1], p[2] + cu * u[2] + sv * v[2]];
    });
  const lo = ring(a, r0);
  const hi = ring(c, r1);
  const mid: P3 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  for (let k = 0; k < 3; k++) {
    const m = (k + 1) % 3;
    const tone = k === 0 ? alt : color;
    away(b, lo[k], lo[m], hi[m], mid, tone);
    away(b, lo[k], hi[m], hi[k], mid, tone);
  }
}

/**
 * Une masse de feuillage à facettes, centrée en `c`, de rayon `r` et de hauteur `h` : une pointe en dessous, à l'ombre,
 * une ceinture large, un tour plus étroit, tourné d'un demi-pan, et une pointe au-dessus ; chaque facette de son vert.
 * Vingt-quatre triangles.
 */
function leafMass(b: FacetBuilder, c: P3, r: number, h: number, seed: number): void {
  const n = 6;
  const turn = jitter(seed) * Math.PI;
  const belt: P3[] = [];
  const crown: P3[] = [];
  for (let k = 0; k < n; k++) {
    const a = turn + (2 * Math.PI * k) / n;
    const rr = r * (0.9 + 0.2 * jitter(seed * 5 + k));
    belt.push([c[0] + rr * Math.cos(a), c[1] + h * 0.05 * (k % 2), c[2] + rr * Math.sin(a)]);
    const a1 = a + Math.PI / n;
    crown.push([c[0] + 0.7 * r * Math.cos(a1), c[1] + 0.42 * h, c[2] + 0.7 * r * Math.sin(a1)]);
  }
  const under: P3 = [c[0], c[1] - 0.38 * h, c[2]];
  const tip: P3 = [c[0] + 0.1 * r * Math.cos(turn), c[1] + 0.68 * h, c[2] + 0.1 * r * Math.sin(turn)];
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    away(b, belt[k], belt[m], under, c, C.leafUnder);
    away(b, belt[k], belt[m], crown[k], c, k % 2 ? C.leafSide : C.leafSideAlt);
    away(b, crown[k], belt[m], crown[m], c, k % 2 ? C.leafSideAlt : C.leafTop);
    away(b, crown[k], crown[m], tip, c, k % 2 ? C.leafTop : C.leafTopAlt);
  }
}

/**
 * Un palétuvier dans l'eau, son pied en (`x`, `z`), de taille `s` (concepts : « racines en arceaux dans l'eau ») : un
 * tronc court, et cinq racines-échasses qui partent du bas du tronc, montent un peu en s'écartant puis plongent dans
 * l'eau en arceau (`segments` tronçons chacune : 3 près de la caméra, 2 au loin), à des angles inégaux ; au-dessus, le
 * houppier en deux grosses masses à facettes, la petite posée de côté. `foot` : le niveau d'où partent les racines (la
 * surface de l'eau, ou le sol de la rive). `young` : un jeune palétuvier, trois racines et une seule masse.
 */
function mangroveTree(b: FacetBuilder, x: number, z: number, s: number, seed: number, segments: number, foot = 0, young = false): void {
  const bed = groundAt(x, z, 0.1);
  const base = foot + 0.75 * s;
  const crownY = foot + 1.65 * s;
  limb(b, [x, Math.min(bed, foot), z], [x, crownY, z], 0.27 * s, 0.17 * s, C.wood, C.woodLight);
  const roots = young ? 3 : 5;
  for (let k = 0; k < roots; k++) {
    const a = seed * 1.3 + (2 * Math.PI * k) / roots + (jitter(seed * 7 + k) - 0.5) * 0.7;
    const reach = s * (0.9 + 0.3 * jitter(seed * 3 + k));
    const ca = Math.cos(a),
      sa = Math.sin(a);
    const at = (r: number, y: number): P3 => [x + ca * r, y, z + sa * r];
    // L'arceau : du tronc, un peu au-dessus de l'eau, il s'écarte en montant à peine, puis plonge sous la surface.
    const arc: P3[] =
      segments >= 3
        ? [at(0.15 * s, base), at(0.45 * reach, base + 0.1 * s), at(0.82 * reach, foot + 0.38 * s), at(reach, Math.min(bed, foot) - 0.05)]
        : [at(0.15 * s, base), at(0.55 * reach, base + 0.04 * s), at(reach, Math.min(bed, foot) - 0.05)];
    for (let i = 0; i + 1 < arc.length; i++) limb(b, arc[i], arc[i + 1], 0.13 * s, 0.1 * s, i % 2 ? C.woodLight : C.wood);
  }
  leafMass(b, [x, crownY, z], 1.5 * s, 1.7 * s, seed);
  if (young) return;
  const side = seed * 2.1;
  leafMass(b, [x + 0.8 * s * Math.cos(side), crownY + 0.5 * s, z + 0.8 * s * Math.sin(side)], 1.0 * s, 1.2 * s, seed + 11);
}

/**
 * La cabane de bois sur pilotis, au bout du ponton (concepts) : sa plate-forme de planches au niveau du ponton, sur
 * quatre pieux plantés au fond, un perron devant la porte ; les murs de planches et leurs joints, la porte et une
 * fenêtre en façade (au sud, vers la scène), une fenêtre au pignon est ; le toit d'ardoise bleue à deux pans, en deux
 * bandes, le faîtage le long de la façade, les pignons de planches ; sur le perron, la caisse de jeunes plants.
 */
function cabin(b: FacetBuilder, X: (dx: number) => number, Z: (dz: number) => number, top: number): void {
  const K = MANGROVE_SURROUNDINGS.cabin;
  const x = X(K.dx),
    z = Z(K.dz);
  const W = K.width,
    D = K.depth,
    H = K.wall;
  // La plate-forme : la cabane et son perron, au sud.
  const pw = W + 0.5,
    pd = D + 0.3 + K.porch;
  const pz = z + K.porch / 2;
  b.box({ x, y: top - 0.18, z: pz }, [pw, 0.18, pd], TIMBER.plankSide, TIMBER.plank);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const px = x + sx * (pw / 2 - 0.12),
        pz2 = pz + sz * (pd / 2 - 0.12);
      const f = groundAt(px, pz2, 0.12);
      b.box({ x: px, y: f, z: pz2 }, [0.2, top - 0.18 - f, 0.2], NATURE.pile);
    }
  // Les murs de planches, leurs joints en façade et au pignon est, les ouvertures.
  b.box({ x, y: top, z }, [W, H, D], C.plank, C.plankShade);
  const front = z + D / 2 + 0.015;
  const east = x + W / 2 + 0.015;
  for (const u of [-0.95, 0.55, 1.15]) b.quad([x + u - 0.025, top, front], [x + u + 0.025, top, front], [x + u + 0.025, top + H, front], [x + u - 0.025, top + H, front], C.seam);
  const door = { u0: -0.75, u1: -0.05, v: 1.3 };
  b.quad([x + door.u0, top, front + 0.005], [x + door.u1, top, front + 0.005], [x + door.u1, top + door.v, front + 0.005], [x + door.u0, top + door.v, front + 0.005], C.door);
  const win = (u0: number, u1: number, v0: number, v1: number, frame: boolean) => {
    if (frame) b.quad([x + u0 - 0.07, top + v0 - 0.07, front + 0.004], [x + u1 + 0.07, top + v0 - 0.07, front + 0.004], [x + u1 + 0.07, top + v1 + 0.07, front + 0.004], [x + u0 - 0.07, top + v1 + 0.07, front + 0.004], C.frame);
    b.quad([x + u0, top + v0, front + 0.008], [x + u1, top + v0, front + 0.008], [x + u1, top + v1, front + 0.008], [x + u0, top + v1, front + 0.008], C.glass);
  };
  win(0.2, 0.95, 0.75, 1.3, true);
  b.quad([east, top + 0.75, z + 0.4], [east, top + 0.75, z - 0.4], [east, top + 1.3, z - 0.4], [east, top + 1.3, z + 0.4], C.glass);
  // Le toit : deux pans d'ardoise en deux bandes, leur débord ; les pignons de planches ; le faîtage.
  const over = 0.4,
    side = 0.25;
  const run = D / 2 + over;
  const yR = top + H + K.slope * (D / 2);
  const yE = top + H - K.slope * over;
  const x0 = x - W / 2 - side,
    x1 = x + W / 2 + side;
  for (const sgn of [1, -1]) {
    const pt = (px: number, t: number): P3 => [px, yE + t * (yR - yE), z + sgn * run * (1 - t)];
    const heart: P3 = [x, top, z];
    away(b, pt(x0, 0), pt(x1, 0), pt(x1, 0.5), heart, C.slate);
    away(b, pt(x0, 0), pt(x1, 0.5), pt(x0, 0.5), heart, C.slate);
    away(b, pt(x0, 0.5), pt(x1, 0.5), pt(x1, 1), heart, C.slateLight);
    away(b, pt(x0, 0.5), pt(x1, 1), pt(x0, 1), heart, C.slateLight);
  }
  for (const sx of [-1, 1]) {
    const gx = x + (sx * W) / 2;
    away(b, [gx, top + H, z - D / 2], [gx, top + H, z + D / 2], [gx, yR, z], [x, top + H, z], C.plankShade);
  }
  b.beam({ x: x0 - 0.05, y: yR, z }, { x: x1 + 0.05, y: yR, z }, 0.16, C.ridge);
  // Sur le perron, à droite de la porte : la caisse de jeunes plants.
  const cx = x + 1.05,
    cz = z + D / 2 + 0.42;
  b.box({ x: cx, y: top, z: cz }, [0.62, 0.32, 0.42], C.crate, TIMBER.lid);
  for (const [k, dx] of [-0.16, 0.05, 0.2].entries()) b.prism({ x: cx + dx, y: top + 0.32, z: cz + (k % 2 ? 0.08 : -0.06), yaw: k }, 0.09, 0, 0.32, 3, C.sprout);
}

/**
 * Le carbet bâti : la barque amarrée au petit ponton d'accostage du carbet (places.ts, `MANGROVE.pontoon`), à l'ouest de
 * son bout, sa proue vers lui ; son pieu au coin du ponton et son amarre (le pieu tient même avant le ponton).
 */
function dockedAtCarbet(b: FacetBuilder, top: number): void {
  const c = placeById('mangrove').center;
  const P = MANGROVE.pontoon;
  const B = MANGROVE_SURROUNDINGS.barque;
  const at = { x: c.x + P.x - P.w / 2 - 0.25 - B.length / 2, y: 0, z: c.z + P.z };
  barque(b, at, B.length, B.width, { lantern: false, mast: false });
  barqueFloor(b, at, B.length, B.width);
  const post = { x: c.x + P.x - P.w / 2 - 0.12, z: c.z + P.z - P.d / 2 - 0.16 };
  const foot = groundAt(post.x, post.z, 0.12);
  b.box({ x: post.x, y: foot, z: post.z }, [0.18, top + 0.35 - foot, 0.18], NATURE.pile);
  b.beam({ x: post.x, y: top + 0.2, z: post.z }, { x: at.x + B.length / 2, y: 0.42, z: at.z - B.width / 2 + 0.12 }, 0.035, C.rope);
}

/** La barque amarrée au pied de la cabane, à l'ouest du ponton, sa proue vers lui ; son pieu et son amarre. */
function moored(b: FacetBuilder, X: (dx: number) => number, Z: (dz: number) => number, top: number): void {
  const B = MANGROVE_SURROUNDINGS.barque;
  const at = { x: X(B.dx), y: 0, z: Z(B.dz) };
  barque(b, at, B.length, B.width, { lantern: false, mast: false });
  barqueFloor(b, at, B.length, B.width);
  const post = { x: at.x + B.length / 2 + 0.2, z: at.z - B.width / 2 - 0.45 };
  const foot = groundAt(post.x, post.z, 0.12);
  b.box({ x: post.x, y: foot, z: post.z }, [0.18, top + 0.35 - foot, 0.18], NATURE.pile);
  b.beam({ x: post.x, y: top + 0.2, z: post.z }, { x: at.x + B.length / 2, y: 0.42, z: at.z - B.width / 2 + 0.12 }, 0.035, C.rope);
}
