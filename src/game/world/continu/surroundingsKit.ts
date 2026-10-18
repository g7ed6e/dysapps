/**
 * Le kit commun des abords des scénettes (./surroundings.ts) : ce que les lieux partagent, pour que les seize lieux se
 * fassent de la même main. Le sol du monde en un point, un hasard fixe, les couleurs de nature et de pierre, un rocher à
 * facettes, une touffe d'herbe, un petit tas conique (le sel, le sable, la terre) et la maison à colombages au toit
 * d'ardoise (sur un socle de pierre ou sur pilotis, son toit en réparation ou non). Aplats francs, une couleur par
 * facette, rien de presque noir. Code pur, sans Three.js.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { COLORS_6E } from './plan6e';
import { heightAt } from './terrain';

/** Un point du monde, pour les facettes. */
export type P3 = [number, number, number];

/** Un nombre entre 0 et 1, toujours le même pour un même `n` : le décor ne change pas d'une visite à l'autre. */
export function jitter(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Le sol du monde en un point, enfoncé de `sink` : ce qu'on y pose ne flotte jamais au-dessus d'une facette plus basse.
 * Sous l'eau, jamais plus bas que `bottom` (le fond près du bord, où se plantent les pieux).
 */
export function groundAt(x: number, z: number, sink = 0, bottom = -0.6): number {
  return Math.max(heightAt({ x, z }), bottom) - sink;
}

/** Les couleurs de nature communes aux abords : l'herbe et ses bosses, les touffes vertes et sèches, la dune, le bois. */
export const NATURE = {
  grass: COLORS_6E.grass,
  grassLight: 0x90d8a2,
  grassDeep: 0x82cd95,
  /** La roche des flancs (celle des berges de la rivière). */
  rock: COLORS_6E.rock,
  /** Les touffes d'herbe : deux verts plus soutenus que la prairie. */
  tuft: 0x5fae6a,
  tuftDark: 0x4c9a5a,
  /** L'herbe sèche des grèves et des dunes (deux tons). */
  dry: 0xc8b25a,
  dryShade: 0xa89a4a,
  /** Les dunes de sable pâle. */
  dune: 0xead7ae,
  /** Le bois des pieux et des poteaux. */
  pile: 0x7a5538,
  /** L'eau du lagon. */
  water: COLORS_6E.lagoon,
} as const;

/**
 * La pierre des abords (consultant Archipéo, 18 octobre 2026 : plus de gris neutre) : une pierre chaude, un peu sable,
 * deux tons de flanc, un dessus plus clair, deux tons d'arête abattue ; les rochers, un ton plus clair et son ombre.
 */
export const STONE = {
  side: 0xb9ad98,
  sideAlt: 0xaa9e8a,
  top: 0xdcd1bc,
  bevel: 0xccc0aa,
  bevelAlt: 0xc1b49f,
  boulder: 0xc9bca5,
  boulderShade: 0xb1a48e,
} as const;

/** Les tons d'un rocher à facettes : ses deux pans, l'un après l'autre, et ses pointes. */
export interface RockTones {
  light: number;
  shade: number;
  top: number;
}

const ROCK_TONES: RockTones = { light: STONE.boulder, shade: STONE.boulderShade, top: STONE.top };

/**
 * Un rocher à facettes, posé en `at` (son pied un peu enfoncé) : une base à six pans, une ceinture plus étroite, une
 * pointe ; chaque facette de l'un des deux tons. Dix-huit triangles.
 */
export function rock(b: FacetBuilder, at: Vec3, r: number, h: number, seed: number, tones: RockTones = ROCK_TONES): void {
  const n = 6;
  const lo: P3[] = [];
  const hi: P3[] = [];
  for (let k = 0; k < n; k++) {
    const a = ((k + jitter(seed * 7 + k) * 0.4) * 2 * Math.PI) / n;
    const r0 = r * (0.85 + 0.25 * jitter(seed * 11 + k));
    lo.push([at.x + r0 * Math.cos(a), at.y - 0.15, at.z + r0 * Math.sin(a)]);
    const a1 = a + Math.PI / n;
    const r1 = r * (0.55 + 0.25 * jitter(seed * 13 + k));
    hi.push([at.x + r1 * Math.cos(a1), at.y + h * (0.55 + 0.2 * jitter(seed * 17 + k)), at.z + r1 * Math.sin(a1)]);
  }
  const tip: P3 = [at.x + (jitter(seed) - 0.5) * r * 0.4, at.y + h, at.z + (jitter(seed + 3) - 0.5) * r * 0.4];
  for (let k = 0; k < n; k++) {
    const m = (k + 1) % n;
    b.triangle(lo[m], lo[k], hi[k], k % 2 ? tones.light : tones.shade);
    b.triangle(lo[m], hi[k], hi[m], k % 2 ? tones.shade : tones.light);
    b.triangle(tip, hi[m], hi[k], k % 2 ? tones.light : tones.top);
  }
}

/** Les deux tons d'une touffe : l'herbe verte (par défaut) ou l'herbe sèche des grèves. */
export const GREEN_TUFT = [NATURE.tuft, NATURE.tuftDark] as const;
export const DRY_TUFT = [NATURE.dry, NATURE.dryShade] as const;

/** Une touffe d'herbe en `at` : trois brins en pointe, un peu penchés, de deux tons, de taille `s`. Neuf triangles. */
export function tuft(b: FacetBuilder, at: Vec3, seed: number, tones: readonly [number, number] = GREEN_TUFT, s = 1): void {
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3 + jitter(seed + k) * 0.6;
    const h = (0.32 + 0.18 * jitter(seed * 3 + k)) * s;
    b.prism({ x: at.x + 0.09 * s * Math.cos(a), y: at.y, z: at.z + 0.09 * s * Math.sin(a), yaw: a, pitch: 0.25 }, 0.07 * s, 0, h, 3, tones[k % 2]);
  }
}

/** Les tons d'un petit tas conique : son pied (où il touche le sol), son corps, son ombre et son sommet émoussé. */
export interface HeapTones {
  base: number;
  body: number;
  shade: number;
}

/** Le sel : blanc cassé, son ombre gris-bleu, son pied ocre où il touche l'argile (jamais un blanc pur). */
export const SALT: HeapTones = { base: 0xc9a46c, body: 0xe5ebe3, shade: 0xb9c4c8 };

/** Un petit tas conique posé en (x, y, z), de rayon `r` : son pied, son corps, son sommet émoussé (un dessus plat). */
export function heap(b: FacetBuilder, x: number, y: number, z: number, r: number, sides: number, tones: HeapTones = SALT): void {
  b.prism({ x, y: y - 0.08, z }, r * 1.08, r * 1.0, 0.12 + r * 0.06, sides, tones.base, tones.shade);
  b.prism({ x, y: y + 0.04 + r * 0.06, z, yaw: 0.3 }, r, r * 0.22, r * 1.2, sides, tones.body, tones.shade);
}

/** Les couleurs de la maison à colombages : l'enduit crème, les colombages bruns, l'ardoise bleue, les ouvertures. */
const HOUSE_COLORS = {
  wall: 0xf0e6d0,
  timber: 0x9a6e45,
  /** Les fenêtres : un gris-bleu, pas un trou noir. */
  glass: 0x6f8c99,
  door: 0x8a6440,
  /** L'ardoise bleue en deux bandes, le faîtage, le voligeage à nu et ses liteaux neufs (la réparation). */
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  ridge: 0x40608c,
  bare: 0xb98f5c,
  lath: 0xe6c88f,
  /** Les planches de la plate-forme sur pilotis, leur tranche. */
  plank: 0xdcc08f,
  plankSide: 0xb08658,
  chimney: 0xa59c8e,
} as const;

/**
 * Une maison à colombages : son milieu (`x`, `z`), son cap (`yaw`, la façade de la porte vers +z quand il est nul, vers
 * le sud), sa largeur le long de la façade, sa profondeur, la hauteur de ses murs, la pente de son toit. Elle se pose sur
 * un socle de pierre qui rattrape la pente (`stilts` absent) ou sur une plate-forme de planches sur pieux, `stilts`
 * au-dessus du sol, avec son escalier sur le pignon est (à droite vu de la façade). `repair` : sur chaque pan du toit,
 * un morceau d'ardoise déposé, le voligeage à nu et les liteaux neufs. `door` : la couleur de la porte.
 */
export interface HouseSpec {
  x: number;
  z: number;
  yaw?: number;
  width: number;
  depth: number;
  wall: number;
  slope?: number;
  stilts?: number;
  repair?: boolean;
  chimney?: boolean;
  door?: number;
}

/** Le repère d'une maison : du local (u le long de la façade, v en hauteur, w vers la façade) au monde. */
type Local = (u: number, v: number, w: number) => P3;

/**
 * Pose la maison et rend la hauteur de son plancher (le pied des murs). Murs crème et colombages sur les quatre faces,
 * la porte et une fenêtre en façade, une fenêtre au revers et au pignon est ; le toit à deux pans, le faîtage parallèle à
 * la façade.
 */
export function timberHouse(b: FacetBuilder, spec: HouseSpec): number {
  const { x, z, width: W, depth: D, wall } = spec;
  const yaw = spec.yaw ?? 0;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const local = (y0: number): Local => (u, v, w) => [x + u * c + w * s, y0 + v, z - u * s + w * c];
  const at = (u: number, w: number) => ({ x: x + u * c + w * s, z: z - u * s + w * c });
  const floor = spec.stilts === undefined ? stoneFooting(b, spec, at) : stiltFooting(b, spec, at);
  const L = local(floor);
  // Les murs, puis les colombages et les ouvertures des quatre faces.
  b.box({ x, y: floor, z, yaw }, [W, wall, D], HOUSE_COLORS.wall);
  const door = spec.door ?? HOUSE_COLORS.door;
  const win = (u0: number, u1: number, length: number): Opening => ({ u0: u0 * length, u1: u1 * length, v0: 0.475 * wall, v1: 0.85 * wall, fill: HOUSE_COLORS.glass });
  const faces: Face[] = [
    { o: [-W / 2, D / 2], u: [1, 0], n: [0, 1], length: W, openings: [{ u0: 0.24 * W, u1: 0.46 * W, v0: 0, v1: 0.875 * wall, fill: door }, win(0.6, 0.82, W)] },
    { o: [W / 2, -D / 2], u: [-1, 0], n: [0, -1], length: W, openings: [win(0.39, 0.6, W)] },
    { o: [W / 2, D / 2], u: [0, -1], n: [1, 0], length: D, openings: [win(0.37, 0.63, D)] },
    { o: [-W / 2, -D / 2], u: [0, 1], n: [-1, 0], length: D, openings: [] },
  ];
  for (const face of faces) halfTimber(b, L, face, wall);
  roof(b, local(floor + wall), W, D, spec.slope ?? 0.8, spec.repair ?? false);
  if (spec.chimney) {
    const p = at(W * 0.28, -D * 0.2);
    b.box({ x: p.x, y: floor + wall + 0.3, z: p.z, yaw }, [0.32, (spec.slope ?? 0.8) * (D / 2) + 0.3, 0.32], HOUSE_COLORS.chimney);
  }
  return floor;
}

/** Le socle de pierre sous la maison : du plus bas du sol sous elle jusqu'un peu au-dessus du plus haut. */
function stoneFooting(b: FacetBuilder, spec: HouseSpec, at: (u: number, w: number) => { x: number; z: number }): number {
  const { width: W, depth: D } = spec;
  let low = Infinity,
    high = -Infinity;
  for (const [su, sw] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) {
    const p = at((su * W) / 2, (sw * D) / 2);
    const y = groundAt(p.x, p.z, 0.15);
    low = Math.min(low, y);
    high = Math.max(high, y);
  }
  const floor = high + 0.25;
  b.box({ x: spec.x, y: low - 0.2, z: spec.z, yaw: spec.yaw ?? 0 }, [W + 0.2, floor - low + 0.2, D + 0.2], STONE.side, STONE.top);
  return floor;
}

/** La plate-forme de planches sur six pieux, `stilts` au-dessus du plus haut du sol, et ses deux marches à l'est. */
function stiltFooting(b: FacetBuilder, spec: HouseSpec, at: (u: number, w: number) => { x: number; z: number }): number {
  const { width: W, depth: D } = spec;
  const yaw = spec.yaw ?? 0;
  const u0 = -W / 2 - 0.3,
    u1 = W / 2 + 0.3,
    w0 = -D / 2 - 0.3,
    w1 = D / 2 + 0.3;
  let ground = -Infinity;
  for (const u of [u0, u1])
    for (const w of [w0, w1]) {
      const p = at(u, w);
      ground = Math.max(ground, heightAt(p));
    }
  const floor = ground + (spec.stilts ?? 0);
  b.box({ x: spec.x, y: floor - 0.2, z: spec.z, yaw }, [u1 - u0, 0.2, w1 - w0], HOUSE_COLORS.plankSide, HOUSE_COLORS.plank);
  for (const u of [u0 + 0.15, 0, u1 - 0.15])
    for (const w of [w0 + 0.15, w1 - 0.15]) {
      const p = at(u, w);
      const foot = groundAt(p.x, p.z, 0.12);
      b.box({ x: p.x, y: foot, z: p.z, yaw }, [0.22, Math.max(0.05, floor - 0.2 - foot), 0.22], NATURE.pile);
    }
  const landing = at(u1 + 0.7, 0);
  const low = heightAt(landing);
  for (let k = 0; k < 2; k++) {
    const p = at(u1 + 0.16 + k * 0.32, 0);
    const foot = groundAt(p.x, p.z, 0.12);
    const top = floor - ((k + 1) * (floor - low)) / 3;
    b.box({ x: p.x, y: foot, z: p.z, yaw }, [0.32, Math.max(0.08, top - foot), 0.9], HOUSE_COLORS.plankSide, HOUSE_COLORS.plank);
  }
  return floor;
}

interface Opening {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  fill: number;
}

/** Une face de mur, dans le repère de la maison : son coin bas à gauche vu du dehors (`o`), sa droite (`u`), sa normale. */
interface Face {
  o: [number, number];
  u: [number, number];
  n: [number, number];
  length: number;
  openings: Opening[];
}

/** Un point d'une face, `a` le long, `v` en hauteur, un rien devant le mur. */
function onFace(L: Local, f: Face, a: number, v: number, lift = 0.02): P3 {
  return L(f.o[0] + f.u[0] * a + f.n[0] * lift, v, f.o[1] + f.u[1] * a + f.n[1] * lift);
}

function rect(b: FacetBuilder, L: Local, f: Face, a0: number, v0: number, a1: number, v1: number, color: number, lift = 0.02): void {
  b.quad(onFace(L, f, a0, v0, lift), onFace(L, f, a1, v0, lift), onFace(L, f, a1, v1, lift), onFace(L, f, a0, v1, lift), color);
}

/** Une pièce de bois en biais sur une face, de (a0, v0) à (a1, v1), de largeur `w`. */
function brace(b: FacetBuilder, L: Local, f: Face, a0: number, v0: number, a1: number, v1: number, w: number, color: number): void {
  const l = Math.hypot(a1 - a0, v1 - v0) || 1;
  const pa = (-(v1 - v0) / l) * (w / 2),
    pv = ((a1 - a0) / l) * (w / 2);
  b.quad(onFace(L, f, a0 - pa, v0 - pv), onFace(L, f, a1 - pa, v1 - pv), onFace(L, f, a1 + pa, v1 + pv), onFace(L, f, a0 + pa, v0 + pv), color);
}

/**
 * Les colombages d'une face : la sablière basse et la haute, les poteaux d'angle, la lisse à mi-hauteur (coupée par la
 * porte), un poteau de chaque côté des ouvertures, une écharpe dans les panneaux pleins des bouts ; les ouvertures.
 */
function halfTimber(b: FacetBuilder, L: Local, f: Face, h: number): void {
  const t = 0.14,
    len = f.length,
    mid = 0.55 * h;
  const timber = HOUSE_COLORS.timber;
  rect(b, L, f, 0, 0, len, t, timber);
  rect(b, L, f, 0, h - t, len, h, timber);
  rect(b, L, f, 0, t, t, h - t, timber);
  rect(b, L, f, len - t, t, len, h - t, timber);
  const posts = f.openings.flatMap((o) => [o.u0 - t, o.u1]).sort((a, c) => a - c);
  for (const a of posts) rect(b, L, f, a, t, a + t, h - t, timber);
  // La lisse, sauf au droit d'une porte (une ouverture qui part du sol).
  let from = t;
  for (const o of [...f.openings].filter((o) => o.v0 === 0).sort((a, c) => a.u0 - c.u0)) {
    if (o.u0 - t > from) rect(b, L, f, from, mid, o.u0 - t, mid + t, timber);
    from = o.u1 + t;
  }
  if (len - t > from) rect(b, L, f, from, mid, len - t, mid + t, timber);
  // Les écharpes, dans le premier et le dernier panneau, s'ils sont assez larges.
  const first = posts.length ? posts[0] : len / 2;
  const last = posts.length ? posts[posts.length - 1] + t : len / 2;
  if (first - t > 0.5) brace(b, L, f, t, t, first, mid, 0.12, timber);
  if (len - t - last > 0.5) brace(b, L, f, len - t, t, last, mid, 0.12, timber);
  for (const o of f.openings) rect(b, L, f, o.u0, o.v0, o.u1, o.v1, o.fill, 0.03);
}

/**
 * Le toit à deux pans, le faîtage le long de la façade, dans le repère `L` (sa hauteur 0 au haut des murs) : chaque pan
 * en deux bandes d'ardoise, ses pignons crème et leur poinçon, le faîtage plus sombre ; `repair` : sur chaque pan, un
 * morceau d'ardoise déposé, le voligeage à nu et les liteaux neufs posés dessus.
 */
function roof(b: FacetBuilder, L: Local, W: number, D: number, slope: number, repair: boolean): void {
  const over = 0.45,
    side = 0.2;
  const run = D / 2 + over;
  const yE = -slope * over,
    yR = (slope * D) / 2;
  const u0 = -W / 2 - side,
    u1 = W / 2 + side;
  const H = HOUSE_COLORS;
  // Les pignons, dans le plan des murs de bout, et leur poinçon.
  for (const sgn of [-1, 1]) {
    const pu = (sgn * W) / 2;
    b.triangle(L(pu, 0, sgn * (D / 2)), L(pu, 0, -sgn * (D / 2)), L(pu, yR, 0), H.wall);
    const n = sgn * 0.02;
    b.quad(L(pu + n, 0, sgn * 0.07), L(pu + n, 0, -sgn * 0.07), L(pu + n, yR - 0.1, -sgn * 0.07), L(pu + n, yR - 0.1, sgn * 0.07), H.timber);
  }
  const span = u1 - u0;
  for (const sgn of [1, -1]) {
    // `sgn` 1 : le pan de la façade ; -1 : le pan du revers. Un point du pan : `p` le long du faîtage (de gauche à droite
    // vu de son côté), `t` de l'égout (0) au faîtage (1), relevé de `lift` le long de sa normale.
    const len = Math.hypot(run, slope * run);
    const ny = run / len,
      nw = (sgn * slope * run) / len;
    const pt = (p: number, t: number, lift = 0): P3 => L(sgn > 0 ? u0 + p : u1 - p, yE + t * (yR - yE) + ny * lift, sgn * run * (1 - t) + nw * lift);
    const pan = (p0: number, t0: number, p1: number, t1: number, color: number, lift = 0) => b.quad(pt(p0, t0, lift), pt(p1, t0, lift), pt(p1, t1, lift), pt(p0, t1, lift), color);
    pan(0, 0, span, 0.5, H.slate);
    pan(0, 0.5, span, 1, H.slateLight);
    if (!repair) continue;
    // Le morceau à nu : sur le pan de la façade, à gauche, vers le faîtage ; sur le revers, plus petit.
    const [p0, p1] = sgn > 0 ? [0.167 * span, 0.62 * span] : [0.14 * span, 0.45 * span];
    const [t0, t1] = sgn > 0 ? [0.22, 0.9] : [0.35, 0.88];
    pan(p0, t0, p1, t1, H.bare, 0.03);
    const laths = sgn > 0 ? 4 : 3;
    for (let k = 0; k < laths; k++) {
      const t = t0 + ((t1 - t0) * (k + 0.5)) / laths;
      pan(p0 - 0.15, t - 0.025, p1 + 0.15, t + 0.025, H.lath, 0.07);
    }
    const rafters = sgn > 0 ? 3 : 2;
    for (let k = 0; k < rafters; k++) {
      const p = p0 + ((p1 - p0) * (k + 0.5)) / rafters;
      pan(p - 0.035, t0 - 0.04, p + 0.035, t1 + 0.04, H.lath, 0.055);
    }
  }
  const [ax, ay, az] = L(u0 - 0.05, yR, 0),
    [cx, cy, cz] = L(u1 + 0.05, yR, 0);
  b.beam({ x: ax, y: ay, z: az }, { x: cx, y: cy, z: cz }, 0.16, H.ridge);
}
