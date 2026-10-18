/**
 * Les abords de la scénette des Quais (d'après le concept du 18 octobre 2026, « scenettes-6e-quais-v2 ») : le quai de
 * planches claires tenu par ses pieux au bord du bassin, une jetée sur pilotis le long de la rive est, la maison à
 * colombages sur pilotis au toit d'ardoise bleue en réparation (ses liteaux posés), des tonneaux, des piles de planches,
 * un voilier amarré au sud-ouest du bassin et des rochers gris à facettes sur les rives. Fini tout autour, puisque la
 * caméra tourne à deux doigts : de face, la maison derrière le quai ; de côté, la jetée et les planches ; de dos, le
 * bassin, le voilier et la rive sud.
 *
 * Tout se tient hors de l'anneau où la rangée des objets-réponses se pose quand la caméra tourne (à moins de 7,5 du
 * point visé, `RING`), sauf ce qui reste au ras du quai (les pieux, les joints des planches) ; rien de haut entre la
 * caméra de face et la scène. Aplats francs, une couleur par facette, jamais presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { QUAY } from './questionScene';
import type { SurroundingsState } from './surroundings';
import { heightAt } from './terrain';

type P3 = [number, number, number];

const C = {
  /** Les planches claires du quai et de la jetée, leur tranche, leurs joints. */
  plank: 0xdcc08f,
  plankSide: 0xb08658,
  seam: 0xb48c5c,
  /** Les pieux (le bois des pieux des pontons, lot commun des scénettes). */
  pile: 0x7a5538,
  /** La maison : l'enduit crème, les colombages, les fenêtres (un gris-bleu, pas un trou noir), la porte. */
  wall: 0xf0e6d0,
  timber: 0x9a6e45,
  glass: 0x6f8c99,
  door: 0x8a6440,
  /** L'ardoise bleue en deux bandes, le faîtage, le voligeage à nu et ses liteaux neufs. */
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  ridge: 0x40608c,
  bare: 0xb98f5c,
  lath: 0xe6c88f,
  /** Les tonneaux : les douelles, le cerclage, le fond. */
  stave: 0x9a6a3e,
  hoop: 0x7f8b90,
  lid: 0xc08c55,
  /** Les rochers gris à facettes, leur dessus plus clair. */
  rock: 0x9aa0a6,
  rockTop: 0xbcc1c4,
  /** Le voilier : sa coque blanche, sa bande bleue, son pont, son mât, sa voile ferlée, ses haubans. */
  hull: 0xf2eee4,
  stripe: 0x4f7fa3,
  boatDeck: 0xc9a26e,
  mast: 0xa57a4f,
  sail: 0xebe2cc,
  rope: 0x8f7a5c,
} as const;

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, le milieu de la bande de devant du quai) : la maison et sa
 * plate-forme (le centre de la maison, sa largeur et sa profondeur), la jetée (son axe, sa largeur, son début et sa fin),
 * le voilier (son milieu), les tas de la rive ouest.
 */
export const QUAIS_SURROUNDINGS = {
  house: { dx: 4.4, dz: -9.8, width: 3.8, depth: 3, wall: 2, stilts: 0.3 },
  jetty: { dx: 9.7, width: 1.6, from: -0.7, to: 8.5, top: 0.78 },
  sailboat: { dx: -5.6, dz: 11.2, length: 4.2, width: 1.3 },
  westPile: { dx: -9.1, dz: -3.3 },
  /** La pile de planches neuves, au pied de la maison, à l'est, au-delà de son escalier. */
  yard: { dx: 8.9, dz: -10.4 },
} as const;

/** La distance au point visé en deçà de laquelle la rangée des réponses peut se poser quand la caméra tourne. */
export const RING = 7.5;

export function quaisSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  quayPiles(b, floor);
  jetty(b, floor);
  house(b, floor);
  westShore(b, floor);
  sailboat(b, floor);
  rocks(b, floor);
}

/** Le sol en un point, un rien enfoncé : un pied posé ne flotte jamais. */
const footAt = (x: number, z: number, sink = 0.12): number => Math.max(heightAt({ x, z }), -0.6) - sink;

/**
 * Le quai de la scène de l'item, vu de l'eau : ses pieux le long du bord (à demi pris dans sa tranche, leur tête au ras
 * du plancher : rien n'y bute) et les joints de ses planches, dans le sens de la profondeur.
 */
function quayPiles(b: FacetBuilder, f: Vec3): void {
  const edge = f.z + QUAY.strip / 2;
  const half = QUAY.width / 2;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = f.x - half + 0.25 + ((2 * half - 0.5) * i) / (n - 1);
    const foot = footAt(x, edge + 0.08);
    b.box({ x, y: foot, z: edge + 0.04 }, [0.22, f.y - 0.02 - foot, 0.22], C.pile);
  }
  // Les joints, de l'ouest du quai jusqu'au docker : au-delà, le pied de la grue et la place d'un aménagement.
  const y = f.y + 0.012;
  for (let k = 1; k < 18; k++) {
    const x = f.x - half + k * 0.6;
    b.quad([x - 0.025, y, edge - 0.02], [x + 0.025, y, edge - 0.02], [x + 0.025, y, edge - QUAY.depth], [x - 0.025, y, edge - QUAY.depth], C.seam);
  }
}

/**
 * La jetée sur pilotis, le long de la rive est du bassin : du rivage, au nord, vers le large ; ses planches en travers,
 * ses pieux par paires, des écharpes sur sa face est, un tonneau au bout.
 */
function jetty(b: FacetBuilder, f: Vec3): void {
  const J = QUAIS_SURROUNDINGS.jetty;
  const x = f.x + J.dx, z0 = f.z + J.from, z1 = f.z + J.to, y = J.top;
  const len = z1 - z0;
  b.box({ x, y: y - 0.16, z: (z0 + z1) / 2 }, [J.width, 0.16, len], C.plankSide, C.plank);
  for (let k = 1; k * 0.7 < len; k++) {
    const z = z0 + k * 0.7;
    b.quad([x - J.width / 2, y + 0.012, z + 0.02], [x + J.width / 2, y + 0.012, z + 0.02], [x + J.width / 2, y + 0.012, z - 0.02], [x - J.width / 2, y + 0.012, z - 0.02], C.seam);
  }
  const rows = 6;
  const zs = Array.from({ length: rows }, (_, i) => z0 + 0.15 + ((len - 0.3) * i) / (rows - 1));
  for (const z of zs)
    for (const side of [-1, 1]) {
      const px = x + side * (J.width / 2 - 0.05);
      const foot = footAt(px, z);
      b.box({ x: px, y: foot, z }, [0.2, y + 0.12 - foot, 0.2], C.pile);
    }
  // Les écharpes sur la face est, de pieu en pieu, au-dessus de l'eau.
  const ex = x + J.width / 2 + 0.06;
  for (let i = 1; i < rows - 1; i++) b.beam({ x: ex, y: 0.05, z: zs[i] }, { x: ex, y: y - 0.2, z: zs[i + 1] }, 0.09, C.pile);
  barrel(b, x - 0.3, y, z1 - 0.5);
}

/**
 * La maison à colombages sur pilotis, derrière le quai, au nord-est : sa plate-forme de planches sur six pieux et son
 * escalier à l'est ; les murs crème et leurs colombages sur les quatre faces, la porte et les fenêtres au sud ; le toit
 * d'ardoise à deux pans, et sur chaque pan un morceau à nu, ses liteaux neufs posés (la réparation en cours). À son pied,
 * à l'est, la pile de planches neuves et deux tonneaux. Le bord sud de la plate-forme reste au nord de la rangée des
 * réponses de dos, et son bord ouest à l'est du regard de la caméra de dos vers le docker.
 */
function house(b: FacetBuilder, f: Vec3): void {
  const H = QUAIS_SURROUNDINGS.house;
  const hx = f.x + H.dx, hz = f.z + H.dz;
  const W = H.width, D = H.depth;
  const px0 = hx - W / 2 - 0.3, px1 = hx + W / 2 + 0.3, pz0 = hz - D / 2 - 0.3, pz1 = hz + D / 2 + 0.3;
  let ground = -Infinity;
  for (const x of [px0, px1]) for (const z of [pz0, pz1]) ground = Math.max(ground, heightAt({ x, z }));
  const yP = ground + H.stilts;
  b.box({ x: (px0 + px1) / 2, y: yP - 0.2, z: (pz0 + pz1) / 2 }, [px1 - px0, 0.2, pz1 - pz0], C.plankSide, C.plank);
  for (const x of [px0 + 0.15, (px0 + px1) / 2, px1 - 0.15])
    for (const z of [pz0 + 0.15, pz1 - 0.15]) {
      const foot = footAt(x, z);
      b.box({ x, y: foot, z }, [0.22, Math.max(0.05, yP - 0.2 - foot), 0.22], C.pile);
    }
  // L'escalier, à l'est : deux marches jusqu'au sol.
  for (let k = 0; k < 2; k++) {
    const x = px1 + 0.16 + k * 0.32;
    const foot = footAt(x, hz);
    const top = yP - ((k + 1) * (yP - heightAt({ x: px1 + 0.7, z: hz }))) / 3;
    b.box({ x, y: foot, z: hz }, [0.32, Math.max(0.08, top - foot), 0.9], C.plankSide, C.plank);
  }
  // Au pied de l'escalier : la pile de planches neuves (trois lits) sur ses cales, et deux tonneaux.
  const Y = QUAIS_SURROUNDINGS.yard;
  const yx = f.x + Y.dx, yz = f.z + Y.dz;
  const yy = heightAt({ x: yx, z: yz }) + 0.1;
  for (const dz of [-0.85, 0.85]) b.box({ x: yx, y: footAt(yx, yz + dz), z: yz + dz }, [1.2, yy - footAt(yx, yz + dz), 0.18], C.pile);
  planks(b, yx, yy, yz, [4, 3, 2], 2.4);
  for (const [dx, dz] of [[-0.2, 1.75], [0.6, 1.9]]) barrel(b, yx + dx, heightAt({ x: yx + dx, z: yz + dz }) - 0.04, yz + dz);
  // Les murs, puis les colombages des quatre faces.
  b.box({ x: hx, y: yP, z: hz }, [W, H.wall, D], C.wall);
  const faces: Face[] = [
    { o: [hx - W / 2, yP, hz + D / 2], u: [1, 0], n: [0, 1], length: W, openings: [{ u0: 0.9, u1: 1.75, v0: 0, v1: 1.75, fill: C.door }, { u0: 2.3, u1: 3.1, v0: 0.95, v1: 1.7, fill: C.glass }] },
    { o: [hx + W / 2, yP, hz - D / 2], u: [-1, 0], n: [0, -1], length: W, openings: [{ u0: 1.5, u1: 2.3, v0: 0.95, v1: 1.7, fill: C.glass }] },
    { o: [hx + W / 2, yP, hz + D / 2], u: [0, -1], n: [1, 0], length: D, openings: [{ u0: 1.1, u1: 1.9, v0: 0.95, v1: 1.6, fill: C.glass }] },
    { o: [hx - W / 2, yP, hz - D / 2], u: [0, 1], n: [-1, 0], length: D, openings: [] },
  ];
  for (const face of faces) halfTimber(b, face, H.wall);
  roof(b, hx, yP + H.wall, hz, W, D);
}

interface Opening {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  fill: number;
}

/** Une face de mur : son coin bas, à gauche vu du dehors (`o`), sa direction vers la droite (`u`, en x et z), sa normale. */
interface Face {
  o: P3;
  u: [number, number];
  n: [number, number];
  length: number;
  openings: Opening[];
}

/** Un point d'une face, `u` le long, `v` en hauteur, un rien devant le mur. */
function onFace(f: Face, u: number, v: number, lift = 0.02): P3 {
  return [f.o[0] + f.u[0] * u + f.n[0] * lift, f.o[1] + v, f.o[2] + f.u[1] * u + f.n[1] * lift];
}

function rect(b: FacetBuilder, f: Face, u0: number, v0: number, u1: number, v1: number, color: number, lift = 0.02): void {
  b.quad(onFace(f, u0, v0, lift), onFace(f, u1, v0, lift), onFace(f, u1, v1, lift), onFace(f, u0, v1, lift), color);
}

/** Une pièce de bois en biais sur une face, de (u0, v0) à (u1, v1), de largeur `w`. */
function brace(b: FacetBuilder, f: Face, u0: number, v0: number, u1: number, v1: number, w: number, color: number): void {
  const l = Math.hypot(u1 - u0, v1 - v0) || 1;
  const pu = (-(v1 - v0) / l) * (w / 2), pv = ((u1 - u0) / l) * (w / 2);
  b.quad(onFace(f, u0 - pu, v0 - pv), onFace(f, u1 - pu, v1 - pv), onFace(f, u1 + pu, v1 + pv), onFace(f, u0 + pu, v0 + pv), color);
}

/**
 * Les colombages d'une face : la sablière basse et la haute, les poteaux d'angle, la lisse à mi-hauteur (coupée par la
 * porte), un poteau de chaque côté des ouvertures, une écharpe dans les panneaux pleins des bouts ; les ouvertures.
 */
function halfTimber(b: FacetBuilder, f: Face, h: number): void {
  const t = 0.14, L = f.length, mid = 1.1;
  rect(b, f, 0, 0, L, t, C.timber);
  rect(b, f, 0, h - t, L, h, C.timber);
  rect(b, f, 0, t, t, h - t, C.timber);
  rect(b, f, L - t, t, L, h - t, C.timber);
  const posts = f.openings.flatMap((o) => [o.u0 - t, o.u1]).sort((a, c) => a - c);
  for (const u of posts) rect(b, f, u, t, u + t, h - t, C.timber);
  // La lisse, sauf au droit d'une porte (une ouverture qui part du sol).
  let from = t;
  for (const o of [...f.openings].filter((o) => o.v0 === 0).sort((a, c) => a.u0 - c.u0)) {
    if (o.u0 - t > from) rect(b, f, from, mid, o.u0 - t, mid + t, C.timber);
    from = o.u1 + t;
  }
  if (L - t > from) rect(b, f, from, mid, L - t, mid + t, C.timber);
  // Les écharpes, dans le premier et le dernier panneau, s'ils sont assez larges.
  const first = posts.length ? posts[0] : L / 2;
  const last = posts.length ? posts[posts.length - 1] + t : L / 2;
  if (first - t > 0.5) brace(b, f, t, t, first, mid, 0.12, C.timber);
  if (L - t - last > 0.5) brace(b, f, L - t, t, last, mid, 0.12, C.timber);
  for (const o of f.openings) rect(b, f, o.u0, o.v0, o.u1, o.v1, o.fill, 0.03);
}

/**
 * Le toit à deux pans, le faîtage le long de x, à `y` le haut des murs : chaque pan en deux bandes d'ardoise, ses pignons
 * crème et leur poinçon, le faîtage plus sombre ; sur chaque pan, un morceau d'ardoise déposé, le voligeage à nu et les
 * liteaux neufs posés dessus.
 */
function roof(b: FacetBuilder, x: number, y: number, z: number, W: number, D: number): void {
  const slope = 0.8, over = 0.45, side = 0.2;
  const run = D / 2 + over;
  const yE = y - slope * over, yR = y + (slope * D) / 2;
  const x0 = x - W / 2 - side, x1 = x + W / 2 + side;
  // Les pignons, dans le plan des murs est et ouest, et leur poinçon.
  for (const s of [-1, 1]) {
    const px = x + (s * W) / 2;
    const a: P3 = [px, y, z + s * (D / 2)], c: P3 = [px, y, z - s * (D / 2)], top: P3 = [px, yR, z];
    b.triangle(a, c, top, C.wall);
    const n = s * 0.02;
    b.quad([px + n, y, z + s * 0.07], [px + n, y, z - s * 0.07], [px + n, yR - 0.1, z - s * 0.07], [px + n, yR - 0.1, z + s * 0.07], C.timber);
  }
  for (const s of [1, -1]) {
    // `s` 1 : le pan sud ; -1 : le pan nord. Un point du pan : `p` le long du faîtage (0 à l'ouest vu du sud), `t` de
    // l'égout (0) au faîtage (1), relevé de `lift` le long de sa normale.
    const ny = run / Math.hypot(run, slope * run), nz = (s * slope * run) / Math.hypot(run, slope * run);
    const at = (p: number, t: number, lift = 0): P3 => [s > 0 ? x0 + p : x1 - p, yE + t * (yR - yE) + ny * lift, z + s * run * (1 - t) + nz * lift];
    const span = x1 - x0;
    const pan = (p0: number, t0: number, p1: number, t1: number, color: number, lift = 0) => b.quad(at(p0, t0, lift), at(p1, t0, lift), at(p1, t1, lift), at(p0, t1, lift), color);
    pan(0, 0, span, 0.5, C.slate);
    pan(0, 0.5, span, 1, C.slateLight);
    // Le morceau à nu : sur le pan sud, à l'ouest, vers le faîtage ; sur le pan nord, plus petit, à l'est vu du nord.
    const [p0, p1] = s > 0 ? [0.7, 2.6] : [0.6, 1.9];
    const [t0, t1] = s > 0 ? [0.22, 0.9] : [0.35, 0.88];
    pan(p0, t0, p1, t1, C.bare, 0.03);
    const laths = s > 0 ? 4 : 3;
    for (let k = 0; k < laths; k++) {
      const t = t0 + ((t1 - t0) * (k + 0.5)) / laths;
      pan(p0 - 0.15, t - 0.025, p1 + 0.15, t + 0.025, C.lath, 0.07);
    }
    const rafters = s > 0 ? 3 : 2;
    for (let k = 0; k < rafters; k++) {
      const p = p0 + ((p1 - p0) * (k + 0.5)) / rafters;
      pan(p - 0.035, t0 - 0.04, p + 0.035, t1 + 0.04, C.lath, 0.055);
    }
  }
  b.beam({ x: x0 - 0.05, y: yR, z }, { x: x1 + 0.05, y: yR, z }, 0.16, C.ridge);
}

/** Un tonneau posé en (x, y, z) : deux troncs de cône de douelles, un cerclage au ventre, le fond clair. */
function barrel(b: FacetBuilder, x: number, y: number, z: number): void {
  const r0 = 0.27, r1 = 0.33, h = 0.38, sides = 7;
  b.prism({ x, y, z }, r0, r1, h, sides, C.stave);
  b.band({ x, y: y + h - 0.06, z }, r1 + 0.01, 0.12, sides, C.hoop);
  b.prism({ x, y: y + h, z }, r1, r0, h, sides, C.stave, C.lid);
}

/** Une pile de planches le long de z, posée en (x, y, z) : des lits de `rows` planches, de `length` de long. */
function planks(b: FacetBuilder, x: number, y: number, z: number, rows: readonly number[], length: number): void {
  const w = 0.24, t = 0.09;
  rows.forEach((n, layer) => {
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * (w + 0.02);
      b.box({ x: px, y: y + layer * t, z: z + (layer % 2 ? 0.15 : 0) }, [w, t, length - layer * 0.25], C.plankSide, C.plank);
    }
  });
}

/** La rive ouest, au-delà du bout du quai : une pile de planches sur ses deux cales, un tonneau. */
function westShore(b: FacetBuilder, f: Vec3): void {
  const P = QUAIS_SURROUNDINGS.westPile;
  const x = f.x + P.dx, z = f.z + P.dz;
  const y = heightAt({ x, z }) + 0.12;
  for (const dz of [-0.8, 0.8]) b.box({ x, y: footAt(x, z + dz), z: z + dz }, [1.1, y - footAt(x, z + dz), 0.18], C.pile);
  planks(b, x, y, z, [3, 2], 2.2);
  barrel(b, x - 1, heightAt({ x: x - 1, z: z - 1 }) - 0.04, z - 1);
}

/**
 * Le voilier amarré au sud-ouest du bassin, loin de la rangée : sa coque blanche à la bande bleue, sa proue en pointe à
 * l'est, son pont et son rouf, le mât, la bôme et sa voile ferlée, l'étai et le pataras ; le pieu où il est amarré.
 */
function sailboat(b: FacetBuilder, f: Vec3): void {
  const S = QUAIS_SURROUNDINGS.sailboat;
  const x = f.x + S.dx, z = f.z + S.dz;
  const body = S.length - S.width / 2;
  const cx = x - S.width / 4;
  b.box({ x: cx, y: -0.25, z }, [body, 0.7, S.width], C.hull, C.boatDeck);
  b.prism({ x: cx + body / 2, y: -0.25, z }, S.width / 2, S.width / 2, 0.7, 4, C.hull, C.boatDeck);
  b.box({ x: cx, y: 0.06, z }, [body + 0.02, 0.12, S.width + 0.02], C.stripe);
  b.box({ x: cx - 0.5, y: 0.45, z }, [1.2, 0.32, 0.8], C.hull, C.boatDeck);
  const mx = cx + 0.45;
  b.beam({ x: mx, y: 0.45, z }, { x: mx, y: 5.4, z }, 0.12, C.mast);
  b.beam({ x: mx, y: 1.35, z }, { x: cx - body / 2 + 0.1, y: 1.45, z }, 0.09, C.mast);
  b.beam({ x: mx - 0.1, y: 1.5, z }, { x: cx - body / 2 + 0.35, y: 1.58, z }, 0.2, C.sail);
  b.beam({ x: mx, y: 5.3, z }, { x: cx + body / 2 + S.width / 2 - 0.1, y: 0.47, z }, 0.035, C.rope);
  b.beam({ x: mx, y: 5.3, z }, { x: cx - body / 2 + 0.05, y: 0.47, z }, 0.035, C.rope);
  // Le pieu d'amarrage, au nord de la proue, et l'amarre.
  const post = { x: cx + body / 2, z: z - S.width / 2 - 0.9 };
  const foot = footAt(post.x, post.z);
  b.box({ x: post.x, y: foot, z: post.z }, [0.22, 1.05 - foot, 0.22], C.pile);
  b.beam({ x: post.x, y: 0.9, z: post.z }, { x: cx + body / 2, y: 0.47, z: z - S.width / 2 + 0.1 }, 0.035, C.rope);
}

/** Les rochers gris à facettes, sur les rives du bassin et derrière le quai : (dx, dz, rayon, hauteur, angle). */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [-11.4, 2.2, 0.9, 0.9, 0.3],
  [-10.6, -2.4, 0.7, 0.6, 1.1],
  [-12.2, 9.8, 1.1, 1.0, 0.7],
  [12.9, 6.6, 1.0, 0.9, 0.2],
  [11.6, 11.4, 0.8, 0.7, 1.4],
  [1.9, 15.4, 1.0, 0.8, 0.9],
  [-2.1, 15.7, 0.8, 0.6, 0.4],
  [-5.2, -10.2, 0.9, 0.8, 1.7],
  [9.6, -12.6, 1.1, 1.0, 0.5],
];

function rocks(b: FacetBuilder, f: Vec3): void {
  for (const [dx, dz, r, h, yaw] of ROCKS) {
    const x = f.x + dx, z = f.z + dz;
    const y = footAt(x, z, 0.2);
    b.prism({ x, y, z, yaw }, r, r * 0.55, h, 5, C.rock, C.rockTop);
  }
}
