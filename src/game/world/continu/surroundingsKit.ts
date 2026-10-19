/**
 * Le kit commun des abords des scénettes (./surroundings.ts) : ce que les lieux partagent, pour que les seize lieux se
 * fassent de la même main. Le sol du monde en un point, un hasard fixe, les couleurs de nature et de pierre, un rocher à
 * facettes, une touffe d'herbe, un sapin, une facette tournée du bon côté quel que soit l'ordre de ses sommets, un petit tas conique (le sel, le sable, la terre) et la maison à colombages au toit
 * d'ardoise (sur un socle de pierre ou sur pilotis, son toit en réparation ou non) ; le bois de l'eau, venu des Quais :
 * le ponton sur pieux, la barque et son plancher, le tonneau, la pile de planches. Aplats francs, une couleur par facette,
 * rien de presque noir. Code pur, sans Three.js.
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

/** Les verts d'un sapin et son tronc. */
const FIR = { needles: 0x3f8f5a, needlesLight: 0x56a568, trunk: 0x8a5a36 } as const;

/**
 * Un sapin à facettes en (x, z), son pied enfoncé de `sink` dans le sol du monde, tourné de `yaw` : un tronc à quatre
 * pans, trois étages de cônes à six pans, de deux verts, de taille `s`. Trente triangles.
 */
export function fir(b: FacetBuilder, x: number, z: number, s: number, yaw: number, sink = 0): void {
  const y = groundAt(x, z, sink);
  b.prism({ x, y, z, yaw }, 0.16 * s, 0.12 * s, 0.9 * s, 4, FIR.trunk);
  for (let k = 0; k < 3; k++) {
    b.prism({ x, y: y + (0.7 + 0.85 * k) * s, z, yaw: yaw + k * 0.5 }, (1.25 - 0.3 * k) * s, 0, 1.5 * s, 6, k % 2 ? FIR.needlesLight : FIR.needles);
  }
}

/** Où regarde une facette : le long d'une normale, ou à l'opposé d'un point (le cœur du volume qu'elle ferme). */
export type Aim = { normal: P3 } | { awayFrom: P3 };

/** La facette (a, c, d), prise dans cet ordre, regarde-t-elle du côté de `aim` ? `centre` : son milieu. */
function looks(a: P3, c: P3, d: P3, aim: Aim, centre: P3): boolean {
  const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const w = 'normal' in aim ? aim.normal : [centre[0] - aim.awayFrom[0], centre[1] - aim.awayFrom[1], centre[2] - aim.awayFrom[2]];
  return n[0] * w[0] + n[1] * w[1] + n[2] * w[2] >= 0;
}

/** Le milieu de quelques sommets. */
function centreOf(p: readonly P3[]): P3 {
  const c: P3 = [0, 0, 0];
  for (const q of p) for (let i = 0; i < 3; i++) c[i] += q[i] / p.length;
  return c;
}

/** Un triangle tourné vers `aim`, quel que soit l'ordre de ses sommets. */
export function triangleToward(b: FacetBuilder, a: P3, c: P3, d: P3, aim: Aim, color: number): void {
  if (looks(a, c, d, aim, centreOf([a, c, d]))) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/** Un quadrilatère plan tourné vers `aim`, quel que soit le sens de ses sommets (pris dans l'ordre du tour). */
export function quadToward(b: FacetBuilder, q: readonly [P3, P3, P3, P3], aim: Aim, color: number): void {
  if (looks(q[0], q[1], q[2], aim, centreOf(q))) b.quad(q[0], q[1], q[2], q[3], color);
  else b.quad(q[3], q[2], q[1], q[0], color);
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

/**
 * Le bois des pontons, des tonneaux et des piles (les Quais, d'abord) : les planches claires, leur tranche, leurs joints ;
 * les douelles d'un tonneau, son cerclage, son fond.
 */
export const TIMBER = {
  plank: 0xdcc08f,
  plankSide: 0xb08658,
  seam: 0xb48c5c,
  stave: 0x9a6a3e,
  hoop: 0x7f8b90,
  lid: 0xc08c55,
} as const;

/** Un tonneau posé en (x, y, z) : deux troncs de cône de douelles, un cerclage au ventre, le fond clair. */
export function barrel(b: FacetBuilder, x: number, y: number, z: number): void {
  const r0 = 0.27,
    r1 = 0.33,
    h = 0.38,
    sides = 7;
  b.prism({ x, y, z }, r0, r1, h, sides, TIMBER.stave);
  b.band({ x, y: y + h - 0.06, z }, r1 + 0.01, 0.12, sides, TIMBER.hoop);
  b.prism({ x, y: y + h, z }, r1, r0, h, sides, TIMBER.stave, TIMBER.lid);
}

/**
 * Une pile de planches le long de z, posée en (x, y, z) : un lit par nombre de `rows` (de bas en haut, `rows[k]` planches
 * côte à côte), de `length` de long, chaque lit un peu plus court et décalé d'un rien. Sans cales : on les pose à part.
 */
export function plankStack(b: FacetBuilder, x: number, y: number, z: number, rows: readonly number[], length: number): void {
  const w = 0.24,
    t = 0.09;
  rows.forEach((n, layer) => {
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * (w + 0.02);
      b.box({ x: px, y: y + layer * t, z: z + (layer % 2 ? 0.15 : 0) }, [w, t, length - layer * 0.25], TIMBER.plankSide, TIMBER.plank);
    }
  });
}

/**
 * Un ponton sur pieux : son plancher de `from` à `to` (au sol, en x et z), de largeur `width`, son dessus en `top` ; ses
 * planches en travers (un joint tous les 0,7), `pairs` paires de pieux (6 par défaut) plantés jusqu'au fond (`groundAt`,
 * enfoncés de 0,12), et, si `braces` le dit, des écharpes de pieu en pieu sur un flanc : +1 à gauche en allant de
 * `from` à `to` (à l'est pour un ponton qui part vers le sud), −1 à droite, de `braceFoot` (0,05 par défaut, un rien
 * au-dessus de l'eau) jusque sous le plancher.
 */
export interface PontoonSpec {
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
  top: number;
  pairs?: number;
  braces?: -1 | 0 | 1;
  braceFoot?: number;
}

export function pontoon(b: FacetBuilder, spec: PontoonSpec): void {
  const { from, to, width: W, top: y } = spec;
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  const ax = (to.x - from.x) / len,
    az = (to.z - from.z) / len;
  const yaw = Math.atan2(ax, az);
  // Un point du ponton : `t` le long de son axe, depuis `from` ; `u` en travers, vers sa gauche.
  const at = (t: number, u: number) => ({ x: from.x + ax * t + az * u, z: from.z + az * t - ax * u });
  const mid = at(len / 2, 0);
  b.box({ x: mid.x, y: y - 0.16, z: mid.z, yaw }, [W, 0.16, len], TIMBER.plankSide, TIMBER.plank);
  const seam = (t: number, u: number): P3 => {
    const p = at(t, u);
    return [p.x, y + 0.012, p.z];
  };
  for (let k = 1; k * 0.7 < len; k++) {
    const t = k * 0.7;
    b.quad(seam(t + 0.02, -W / 2), seam(t + 0.02, W / 2), seam(t - 0.02, W / 2), seam(t - 0.02, -W / 2), TIMBER.seam);
  }
  const pairs = spec.pairs ?? 6;
  const ts = Array.from({ length: pairs }, (_, i) => 0.15 + ((len - 0.3) * i) / (pairs - 1));
  for (const t of ts)
    for (const side of [-1, 1]) {
      const p = at(t, side * (W / 2 - 0.05));
      const foot = groundAt(p.x, p.z, 0.12);
      b.box({ x: p.x, y: foot, z: p.z, yaw }, [0.2, y + 0.12 - foot, 0.2], NATURE.pile);
    }
  const side = spec.braces ?? 0;
  if (!side) return;
  const low = spec.braceFoot ?? 0.05;
  for (let i = 1; i < pairs - 1; i++) {
    const p = at(ts[i], side * (W / 2 + 0.06)),
      q = at(ts[i + 1], side * (W / 2 + 0.06));
    b.beam({ x: p.x, y: low, z: p.z }, { x: q.x, y: y - 0.2, z: q.z }, 0.09, NATURE.pile);
  }
}

/**
 * Les couleurs de la barque : ses bordés bleus, son fond, son plat-bord clair ; le socle et le toit de sa lanterne, sa
 * vitre éteinte (le gris-bleu de la lanterne du Phare) ; son mât court, plus sombre que ses bancs ; son plancher, ses
 * joints et le bordé vu de l'intérieur.
 */
const BARQUE = {
  hull: 0x4f7fa3,
  hullTop: 0xa9784a,
  wale: 0xc28a52,
  lanternFrame: 0x8f897d,
  glassOff: 0xbfd0d3,
  mast: 0xa57a4f,
  floor: 0xc08c58,
  seam: 0x8a6440,
  inside: 0xd0a26a,
} as const;

/** La hauteur du plancher d'une barque au-dessus de l'eau : un rien, pour que l'eau ne passe jamais au travers. */
export const BARQUE_FLOOR = 0.05;
/** Le côté de la vitre de la lanterne de proue. */
export const LANTERN_GLASS = 0.2;
/** La longueur de la proue, en part de la largeur de la coque : une pointe courte. */
const BOW_SHARE = 0.5;
/** La hauteur du mât court, au-dessus du bas de la coque. */
const BARQUE_MAST = 2.1;

/** La pointe de la proue, le haut de l'étrave et le bas de la vitre de sa lanterne, pour une barque (`barque`). */
export function barqueBow(at: Vec3, length: number, width: number): { tip: Vec3; stemTop: Vec3; lantern: Vec3 } {
  const y = at.y - 0.3;
  const tip = { x: at.x + length / 2 + BOW_SHARE * width, y, z: at.z };
  const stemTop = { x: tip.x + 0.3, y: y + 1.35, z: at.z };
  return { tip, stemTop, lantern: { x: stemTop.x, y: stemTop.y + 0.06, z: at.z } };
}

/**
 * La barque amarrée (les Quais, lot 3, réserve du directeur artistique : reconnaissable) : une coque ouverte, son fond de
 * bois, ses bordés bleus au plat-bord clair, la proue en pointe à l'est, et deux bancs en travers ; sur l'étrave, la
 * lanterne éteinte, et un mât court dans le banc de la poupe (`look.lantern`, `look.mast` : vrais par défaut). `at` : le
 * milieu de son fond, à la surface de l'eau. Sans plancher : `barqueFloor` le pose.
 */
export function barque(b: FacetBuilder, at: Vec3, length: number, width: number, look: { lantern?: boolean; mast?: boolean } = {}): void {
  const wall = 0.22,
    h = 0.75,
    y = at.y - 0.3;
  const K = BARQUE;
  b.box({ x: at.x, y, z: at.z }, [length, 0.2, width], K.hull, K.hullTop);
  for (const side of [-1, 1]) b.box({ x: at.x, y, z: at.z + side * (width / 2 - wall / 2) }, [length, h, wall], K.hull, K.wale);
  b.box({ x: at.x - length / 2 + wall / 2, y, z: at.z }, [wall, h, width], K.hull, K.wale);
  // La proue (directeur artistique) : courte, à la largeur de la coque, ses deux bordés qui se rejoignent en pointe sur
  // un fond en losange bas (creuse, comme le reste de la barque) ; l'étrave monte de la pointe, penchée vers l'avant, et
  // porte la lanterne.
  const bow = barqueBow(at, length, width);
  const end = at.x + length / 2;
  const bowLen = bow.tip.x - end;
  b.prism({ x: end, y, z: at.z }, width / 2, width / 2, 0.2, 4, K.hull, K.hullTop);
  const side = Math.hypot(bowLen, width / 2);
  const angle = Math.atan2(width / 2, bowLen);
  for (const k of [-1, 1]) b.box({ x: end + bowLen / 2, y, z: at.z + (k * width) / 4, yaw: k * angle }, [side + wall / 2, h, wall], K.hull, K.wale);
  b.beam({ x: bow.tip.x - 0.08, y, z: at.z }, bow.stemTop, 0.2, K.hull);
  if (look.lantern ?? true) {
    // La lanterne de proue : son socle et son toit sombres, sa vitre éteinte entre les deux.
    b.box({ x: bow.lantern.x, y: bow.lantern.y - 0.06, z: at.z }, [0.26, 0.06, 0.26], K.lanternFrame);
    b.box({ x: bow.lantern.x, y: bow.lantern.y, z: at.z }, [LANTERN_GLASS, LANTERN_GLASS, LANTERN_GLASS], K.glassOff);
    b.box({ x: bow.lantern.x, y: bow.lantern.y + LANTERN_GLASS, z: at.z }, [0.3, 0.07, 0.3], K.lanternFrame);
  }
  // Deux bancs en travers, à la poupe et à la proue, hors de la place des caisses.
  for (const dx of [-length / 2 + 0.6, length / 2 - 0.6]) b.box({ x: at.x + dx, y: y + 0.42, z: at.z }, [0.34, 0.1, width - 2 * wall], K.wale);
  // Un mât court, planté dans le banc de la poupe (directeur artistique, reprise des abords des Quais) : loin du crochet
  // de la grue et de la place où il descend la caisse, à la proue.
  if (look.mast ?? true) b.beam({ x: at.x - length / 2 + 0.6, y: y + 0.4, z: at.z }, { x: at.x - length / 2 + 0.6, y: y + BARQUE_MAST, z: at.z }, 0.11, K.mast);
}

/**
 * Le plancher d'une barque (`barque`), à fleur d'eau (évaluation du directeur artistique : sans lui, la barque se lisait
 * comme un cadre vide, son fond sous l'eau) : un aplat de bois entre les bordés, jusqu'à un pas de la pointe de la
 * proue, deux joints le long de la coque, et le bordé vu de l'intérieur, en bois (le bleu reste dehors).
 */
export function barqueFloor(b: FacetBuilder, at: Vec3, length: number, width: number): void {
  const wall = 0.22,
    y = at.y + BARQUE_FLOOR;
  const x0 = at.x - length / 2 + wall,
    x1 = at.x + length / 2,
    z0 = at.z - width / 2 + wall,
    z1 = at.z + width / 2 - wall;
  b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], BARQUE.floor);
  b.triangle([x1, y, z1], [x1 + BOW_SHARE * width - 0.3, y, at.z], [x1, y, z0], BARQUE.floor);
  for (const k of [-1, 1]) {
    const z = at.z + (k * (z1 - z0)) / 6;
    b.quad([x0, y + 0.005, z + 0.02], [x1, y + 0.005, z + 0.02], [x1, y + 0.005, z - 0.02], [x0, y + 0.005, z - 0.02], BARQUE.seam);
  }
  const top = at.y - 0.3 + 0.75 - 0.01,
    e = 0.005;
  b.quad([x0, y, z0 + e], [x1, y, z0 + e], [x1, top, z0 + e], [x0, top, z0 + e], BARQUE.inside);
  b.quad([x1, y, z1 - e], [x0, y, z1 - e], [x0, top, z1 - e], [x1, top, z1 - e], BARQUE.inside);
  b.quad([x0 + e, y, z1], [x0 + e, y, z0], [x0 + e, top, z0], [x0 + e, top, z1], BARQUE.inside);
}
