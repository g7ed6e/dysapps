// Le Détour de la Faille (GD-22, lot 11 ; intention du directeur artistique du 20 octobre 2026, « Le Détour de la
// Faille ») : le troisième Détour du 5e, aux Contreforts. On s'arrête au bord d'une fente d'où monte la vapeur, et on
// regarde le pont de racines qui l'enjambe ; on ne le traverse pas. Pas de récompense, pas de compteur, pas de mission ni
// d'étape ; ni lueur rouge ni lave. Sa place, la fente, l'arbre, les racines, la tête du pont et la sente sont au plan
// (./plan5e.ts, `FAILLE_5E`).
//
// La silhouette : la fente court du nord au sud, en travers du regard qui vient du chemin, à l'est ; un fond d'un bleu
// nuit très sombre (jamais noir pur, sans lueur), posé sur le sol, entre la lèvre proche, une dalle de roche ocre au ras du
// sol où Kéo se tient, et la paroi d'en face, plus haute que Kéo, sans palier ni chemin (« les coupures sont vraies ») :
// une section en triangle, sa face côté fente presque droite et à l'ombre, son dos à 45° jusqu'au sol, sa crête en deux
// hauteurs, ses deux bouts qui descendent au sol. Sur la lèvre proche, au nord de la tête du pont, un vieil arbre de roche
// (jamais un palétuvier) : un fût large et noueux, gris-brun, qui monte jusque dans sa couronne basse vert olive sourd à
// deux pans (jamais coupé net). De son fût, à 0,6 de haut, deux grosses racines parallèles, plates sur le dessus,
// s'arquent au-dessus de la fente jusqu'à une encoche de la paroi : pas de tablier. Une lanterne d'ocre à quatre pans pend
// sous la racine du sud, côté caméra, allumée dès le départ, fixe (une lueur qui invite : le geste de « rallumer » est
// celui du cairn). La vapeur : deux panaches de bouffées rondes immobiles, du gris de la pierre au blanc de la brume, le
// premier bas, sous le pont, le second qui monte au sud du pont au-dessus de la crête, jamais devant la lanterne ni devant
// les racines vues du chemin : c'est lui qu'on devine de loin. Dehors, les trois pierres plates des Détours. À l'arrivée,
// la caméra a sa vue propre (`FAILLE.view`, retouche 1). Rien à lire. Code pur.
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { COLORS_5E, FAILLE_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** La vue de la Faille à l'arrivée : sans monter (`height`), reculée (`back`), tournée vers le sud de `turn` radians. */
const FAILLE_VIEW = { height: 0, back: 1.25, turn: -0.75 } as const;

/** Le Détour de la Faille : sur sa terre, les Contreforts ; Kéo arrive à la tête du pont. */
export const FAILLE: Detour = {
  id: 'faille',
  land: 'contreforts',
  name: 'La Faille',
  kind: 'faille',
  at: FAILLE_5E.head,
  radius: 1,
  foot: FAILLE_5E.head,
  face: FAILLE_5E.face,
  sente: FAILLE_5E.sente,
  // La vue à l'arrivée (retouche 1) : derrière Kéo, un peu au-dessus, sans monter, reculée de 1,25 fois (moins de 20° de
  // plongée, comme la caméra qui suit), tournée vers le sud, à l'opposé de l'arbre : la paroi d'en face se voit de profil.
  view: FAILLE_VIEW,
};

/**
 * Les couleurs : le fond de la fente, un bleu nuit très sombre (jamais noir pur) ; la roche ocre de la lèvre ; la paroi
 * d'en face, sa face côté fente à l'ombre et son dos en ocre clair (le dessus qu'on voit sur la Carte) ; l'écorce
 * gris-brun de l'arbre de roche et de ses racines (jamais le vert-de-gris des Passeurs), le dessus des racines un ton plus
 * clair, la couronne vert olive sourd ; la vapeur, du gris de la pierre au blanc de la brume ; les pierres claires des
 * Détours ; la sente, une terre pâle sur l'ocre (3:1 au moins avec le sol des Contreforts, un test le vérifie).
 */
const C = {
  deep: 0x142b38,
  rock: COLORS_5E.ochre,
  rockShade: 0x9c8657,
  rockTop: 0xc4ad78,
  bark: 0x7a6e60,
  barkTop: 0x8f8373,
  crown: 0x6f7a52,
  crownTop: 0x808b5c,
  lantern: COLORS_5E.lantern,
  bronze: 0xb8954f,
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
} as const;

/** La vapeur : du gris de la pierre (en bas du panache) au blanc de la brume (en haut) ; le dessous de chaque bouffée un ton plus sombre. */
export const FAILLE_STEAM = { low: 0xb9b4a8, mist: 0xe5ebe3, shade: 0.88 } as const;

/** Le sol sous un point du monde. */
const groundAt = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Un point de la Faille, depuis le milieu de la fente : `u` vers l'est, `v` vers le sud. */
const local = (u: number, v: number): Vec2 => ({ x: FAILLE_5E.center.x + u, z: FAILLE_5E.center.z + v });

type P3 = [number, number, number];

/** Un point de la Faille, en trois dimensions. */
const at3 = (u: number, v: number, y: number): P3 => {
  const q = local(u, v);
  return [q.x, y, q.z];
};

/** Un triangle tourné vers `out` (sa face se voit de ce côté), quel que soit l'ordre de ses sommets. */
function facing(b: FacetBuilder, a: P3, c: P3, d: P3, color: number, out: P3): void {
  const n = [(c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]), (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]), (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0])];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.triangle(a, c, d, color);
  else b.triangle(a, d, c, color);
}

/**
 * La paroi d'en face (retouche 1 : plus une boîte) : une section en triangle, sa face côté fente presque droite (`lean`
 * de recul au sommet), son dos à 45° jusqu'au sol ; sa crête en deux hauteurs, du nord au sud (`crest`, `v` et la hauteur
 * au-dessus du sol), ses deux bouts qui descendent au sol (`ends`) ; enfoncée de `sink` sous le sol. Dix triangles, comme
 * la boîte d'avant.
 */
const FAILLE_WALL = {
  lean: 0.25,
  sink: 0.3,
  ends: [-FAILLE_5E.half.v - 0.3, FAILLE_5E.half.v + 0.3],
  crest: [
    [-2.9, 3.4],
    [0.2, 3.4],
    [2.3, 2.5],
  ],
} as const;

/** Le recul du pied du dos de la paroi derrière sa face, au plus haut : son emprise vers l'ouest. */
const WALL_DEPTH = FAILLE_WALL.lean + Math.max(...FAILLE_WALL.crest.map(([, h]) => h)) + FAILLE_WALL.sink;

/** L'arbre de roche : le rayon de son fût au pied et en haut, le bas et le haut de sa couronne, sa demi-largeur. */
export const FAILLE_TREE = { r0: 0.95, r1: 0.55, crown: 3.4, top: 4.8, half: 1.7 } as const;

/**
 * Les racines : la hauteur de leur dessus où elles sortent du fût (`root`, et `into` : de combien leur pied entre dans le
 * fût depuis son axe), au haut de l'arc (`arch`) et à l'encoche (`notch`), au-dessus du sol ; l'écart entre leurs lignes
 * du milieu (`gap`), la demi-largeur de leur dessus (`w`), leur épaisseur (`depth`).
 */
const FAILLE_ROOTS = { root: 0.6, into: 0.45, arch: 1.8, notch: 1.5, gap: 0.62, w: 0.3, depth: 0.38 } as const;

/** La lanterne : sous la racine du sud, côté caméra (`side`, depuis la ligne du milieu de la racine), de `below` sous son dessous ; son rayon. */
export const FAILLE_LANTERN = { side: 0.12, below: 0.3, r: 0.3, h: 0.4, cap: 0.14 } as const;

/** La fente : son fond sur le sol, la dalle de la lèvre proche, la paroi d'en face. Vingt-deux triangles. */
function rift(b: FacetBuilder, g: number): void {
  const H = FAILLE_5E.half;
  // Le fond, à peine au-dessus du sol : un bleu nuit sans lueur.
  b.quad(at3(-H.u, -H.v, g + 0.03), at3(-H.u, H.v, g + 0.03), at3(H.u, H.v, g + 0.03), at3(H.u, -H.v, g + 0.03), C.deep);
  // La lèvre proche : une dalle de roche ocre au ras du sol, d'où Kéo regarde.
  const lip = local(H.u + 1.05, 0);
  b.box({ x: lip.x, y: g - 0.25, z: lip.z }, [2.1, 0.37, 2 * H.v - 0.4], C.rockShade, C.rock);
  wall(b, g);
}

function wall(b: FacetBuilder, g: number): void {
  const W = FAILLE_WALL;
  const face = -FAILLE_5E.half.u;
  const crestU = face - W.lean;
  const foot = g - W.sink;
  const [n0, s0] = W.ends;
  const [[v1, h1], [v2, h2], [v3, h3]] = W.crest;
  // Les deux bouts au sol, la crête, le pied de la face (droit), le pied du dos (à 45° sous chaque point de la crête).
  const N = at3(crestU, n0, foot),
    S = at3(crestU, s0, foot);
  const P1 = at3(crestU, v1, g + h1),
    P2 = at3(crestU, v2, g + h2),
    P3 = at3(crestU, v3, g + h3);
  const F1 = at3(face, v1, foot),
    F3 = at3(face, v3, foot);
  const B1 = at3(crestU - h1 - W.sink, v1, foot),
    B3 = at3(crestU - h3 - W.sink, v3, foot);
  const east: P3 = [1, 0.15, 0],
    west: P3 = [-1, 1, 0];
  // La face côté fente, à l'ombre : cinq triangles.
  facing(b, N, F1, P1, C.rockShade, east);
  facing(b, F1, P2, P1, C.rockShade, east);
  facing(b, F1, F3, P2, C.rockShade, east);
  facing(b, F3, P3, P2, C.rockShade, east);
  facing(b, F3, S, P3, C.rockShade, east);
  // Le dos, en ocre clair : cinq triangles.
  facing(b, N, P1, B1, C.rockTop, west);
  facing(b, B1, P1, P2, C.rockTop, west);
  facing(b, B1, P2, B3, C.rockTop, west);
  facing(b, B3, P2, P3, C.rockTop, west);
  facing(b, B3, P3, S, C.rockTop, west);
}

/**
 * L'arbre de roche : un fût noueux à cinq pans qui monte jusque dans la couronne (jamais coupé net), une couronne basse à
 * deux pans et son dessous. Dix-huit triangles.
 */
function tree(b: FacetBuilder, g: number): void {
  const t = FAILLE_5E.tree;
  const n = 5;
  const ring = (r: number, y: number, twist: number) => Array.from({ length: n }, (_, k) => [t.x + r * Math.cos((2 * Math.PI * k) / n + twist), y, t.z + r * Math.sin((2 * Math.PI * k) / n + twist)] as [number, number, number]);
  const lo = ring(FAILLE_TREE.r0, g - 0.4, 0);
  const hi = ring(FAILLE_TREE.r1, g + FAILLE_TREE.crown + 0.6, 0.35);
  for (let k = 0; k < n; k++) b.quad(lo[(k + 1) % n], lo[k], hi[k], hi[(k + 1) % n], C.bark);
  // La couronne à deux pans, son faîte d'est en ouest, et son dessous, qu'on voit d'en bas.
  b.gableRoof({ x: t.x, y: g + FAILLE_TREE.crown, z: t.z, yaw: 0.2 }, 2 * FAILLE_TREE.half + 0.8, 2 * FAILLE_TREE.half, FAILLE_TREE.top - FAILLE_TREE.crown, C.crown, C.crownTop);
  const c = Math.cos(0.2),
    s = Math.sin(0.2);
  const corner = (lx: number, lz: number): [number, number, number] => [t.x + lx * c + lz * s, g + FAILLE_TREE.crown, t.z - lx * s + lz * c];
  const hx = FAILLE_TREE.half + 0.4,
    hz = FAILLE_TREE.half;
  b.quad(corner(-hx, -hz), corner(hx, -hz), corner(hx, hz), corner(-hx, hz), C.crown);
}

/** La ligne du milieu du pont : où les racines sortent du fût, le haut de leur arc, l'encoche ; dans le plan, et leur hauteur. */
function bridgeLine(g: number, gTree: number): { x: number; z: number; y: number }[] {
  const t = FAILLE_5E.tree,
    a = FAILLE_5E.arch,
    n = FAILLE_5E.notch;
  const d = distance(t, a);
  const from = { x: t.x + ((a.x - t.x) / d) * FAILLE_ROOTS.into, z: t.z + ((a.z - t.z) / d) * FAILLE_ROOTS.into };
  return [
    { ...from, y: gTree + FAILLE_ROOTS.root },
    { ...a, y: g + FAILLE_ROOTS.arch },
    { ...n, y: g + FAILLE_ROOTS.notch },
  ];
}

/** Le côté d'un point de la ligne (vers le sud-est, la droite en allant du fût à la paroi) : la moyenne des côtés de ses segments. */
function sideAt(line: readonly Vec2[], i: number): Vec2 {
  let sx = 0,
    sz = 0;
  for (const k of [i - 1, i]) {
    if (k < 0 || k >= line.length - 1) continue;
    const d = distance(line[k], line[k + 1]);
    sx += (line[k + 1].z - line[k].z) / d;
    sz += -(line[k + 1].x - line[k].x) / d;
  }
  const l = Math.hypot(sx, sz);
  // Au coude, l'écart garde sa largeur : divisé par le cosinus du demi-angle.
  const cos = i > 0 && i < line.length - 1 ? l / 2 : 1;
  return { x: sx / l / cos, z: sz / l / cos };
}

/**
 * Les deux racines du pont, parallèles, jamais croisées, sans tablier : elles sortent du fût à 0,6 de haut, montent
 * jusqu'au haut de leur arc, au-dessus de la fente, puis redescendent à l'encoche de la paroi ; plates sur le dessus, un
 * ton plus clair que l'écorce (une section en triangle couché, sa pointe en dessous). Vingt-quatre triangles.
 */
function roots(b: FacetBuilder, g: number, gTree: number): void {
  const mid = bridgeLine(g, gTree);
  const sides = mid.map((_, i) => sideAt(mid, i));
  for (const k of [-1, 1]) {
    const line = mid.map((p, i) => ({ x: p.x + (sides[i].x * k * FAILLE_ROOTS.gap) / 2, z: p.z + (sides[i].z * k * FAILLE_ROOTS.gap) / 2, y: p.y }));
    const w = FAILLE_ROOTS.w;
    for (let i = 0; i < 2; i++) {
      const a = line[i],
        c = line[i + 1];
      const sa = sides[i],
        sc = sides[i + 1];
      const L: P3 = [a.x - sa.x * w, a.y, a.z - sa.z * w];
      const R: P3 = [a.x + sa.x * w, a.y, a.z + sa.z * w];
      const L2: P3 = [c.x - sc.x * w, c.y, c.z - sc.z * w];
      const R2: P3 = [c.x + sc.x * w, c.y, c.z + sc.z * w];
      const D: P3 = [a.x, a.y - FAILLE_ROOTS.depth, a.z];
      const D2: P3 = [c.x, c.y - FAILLE_ROOTS.depth, c.z];
      // Le dessus plat, puis les deux pans du dessous.
      facing(b, L, R, R2, C.barkTop, [0, 1, 0]);
      facing(b, L, R2, L2, C.barkTop, [0, 1, 0]);
      const left: P3 = [-sa.x, -0.5, -sa.z],
        right: P3 = [sa.x, -0.5, sa.z];
      facing(b, L, L2, D2, C.bark, left);
      facing(b, L, D2, D, C.bark, left);
      facing(b, R, D2, R2, C.bark, right);
      facing(b, R, D, D2, C.bark, right);
    }
  }
}

/** Où pend la lanterne : sous la racine du sud, au haut de son arc, côté caméra (vers le sud), le haut de son chapeau sous la racine. */
export function failleLantern(): { x: number; y: number; z: number } {
  const g = groundAt(FAILLE_5E.center.x, FAILLE_5E.center.z);
  const mid = bridgeLine(g, groundAt(FAILLE_5E.tree.x, FAILLE_5E.tree.z));
  const side = sideAt(mid, 1);
  const off = FAILLE_ROOTS.gap / 2 + FAILLE_LANTERN.side;
  const x = mid[1].x + side.x * off,
    z = mid[1].z + side.z * off;
  // Le dessous de la racine à cet écart de sa ligne du milieu (la section en triangle couché).
  const under = mid[1].y - FAILLE_ROOTS.depth * (1 - FAILLE_LANTERN.side / FAILLE_ROOTS.w);
  return { x, y: under - FAILLE_LANTERN.below, z };
}

/**
 * La lanterne d'ocre, à quatre pans (la vitre d'ocre dans un cadre de bronze : un chapeau en pointe qui déborde, un fond
 * en pointe renversée) ; `at` : son milieu. Seize triangles.
 */
function lantern(b: FacetBuilder, at: { x: number; y: number; z: number }): void {
  const L = FAILLE_LANTERN;
  const y0 = at.y - L.h / 2;
  const t = (dx: number, dy: number, dz: number): P3 => [at.x + dx, dy, at.z + dz];
  const corners = (r: number, y: number) => Array.from({ length: 4 }, (_, k) => t(r * Math.cos(Math.PI / 4 + (k * Math.PI) / 2), y, r * Math.sin(Math.PI / 4 + (k * Math.PI) / 2)));
  const lo = corners(L.r * 0.8, y0),
    hi = corners(L.r * 0.8, y0 + L.h),
    brim = corners(L.r * 1.05, y0 + L.h);
  const top = t(0, y0 + L.h + L.cap, 0),
    bottom = t(0, y0 - L.cap * 0.8, 0);
  for (let k = 0; k < 4; k++) {
    const n = (k + 1) % 4;
    const out: P3 = [Math.cos(Math.PI / 4 + (k + 0.5) * (Math.PI / 2)), 0, Math.sin(Math.PI / 4 + (k + 0.5) * (Math.PI / 2))];
    facing(b, lo[k], lo[n], hi[n], C.lantern, out);
    facing(b, lo[k], hi[n], hi[k], C.lantern, out);
    facing(b, brim[k], brim[n], top, C.bronze, [out[0], 1, out[2]]);
    facing(b, lo[k], lo[n], bottom, C.bronze, [out[0], -1, out[2]]);
  }
}

/**
 * Les deux panaches de vapeur, immobiles : des bouffées rondes (une bipyramide aplatie à cinq pans chacune, `r` son
 * rayon, `up` et `down` sa hauteur au-dessus et au-dessous de son milieu `y`), du gris de la pierre au blanc de la brume.
 * Le premier bas, sous le pont ; le second, au sud du pont, monte au-dessus de la crête de la paroi (vers 4), visible du
 * chemin et de la Carte. Quarante triangles. Retouche 2 (directeur artistique et consultant d'Archipéo : les bouffées se
 * lisaient comme des pierres) : plus claires que les pierres plates dès la plus basse, aplaties, de plus en plus petites à
 * mesure qu'elles montent, chacune décalée de la précédente (`PLUME_DRIFT`) pour faire un panache ; la plus haute
 * au-dessus de la crête (3,4).
 */
/** Le décalage d'une bouffée sur la précédente, vers l'ouest et le sud : le panache penche un peu. */
const PLUME_DRIFT = { u: -0.28, v: 0.14 } as const;

const PLUMES = [
  { u: -0.35, v: -1.35, puffs: [{ y: 0.5, r: 0.7, up: 0.3, down: 0.22, tone: 0.6 }] },
  {
    u: -0.25,
    v: 1.7,
    puffs: [
      { y: 1.3, r: 0.8, up: 0.36, down: 0.3, tone: 0.65 },
      { y: 2.85, r: 0.62, up: 0.3, down: 0.24, tone: 0.85 },
      { y: 4.3, r: 0.46, up: 0.24, down: 0.18, tone: 1 },
    ],
  },
] as const;

/** Une teinte entre deux couleurs. */
function mix(a: number, c: number, t: number): number {
  const ch = (x: number, s: number) => (x >> s) & 0xff;
  const m = (s: number) => Math.round(ch(a, s) + (ch(c, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
}

function plumes(b: FacetBuilder, g: number): void {
  const n = 5;
  PLUMES.forEach((plume, j) => {
    plume.puffs.forEach((p, i) => {
      const c = local(plume.u + PLUME_DRIFT.u * i, plume.v + PLUME_DRIFT.v * i);
      const y = g + p.y;
      const turn = 0.5 * i + 0.9 * j;
      const ring = Array.from({ length: n }, (_, k) => [c.x + p.r * Math.cos((2 * Math.PI * k) / n + turn), y, c.z + p.r * Math.sin((2 * Math.PI * k) / n + turn)] as P3);
      const top: P3 = [c.x, y + p.up, c.z],
        bottom: P3 = [c.x, y - p.down, c.z];
      const tone = mix(FAILLE_STEAM.low, FAILLE_STEAM.mist, p.tone);
      const shade = mix(0, tone, FAILLE_STEAM.shade);
      for (let k = 0; k < n; k++) {
        const a = ring[k],
          d = ring[(k + 1) % n];
        const out: P3 = [(a[0] + d[0]) / 2 - c.x, 0, (a[2] + d[2]) / 2 - c.z];
        facing(b, a, d, top, tone, [out[0], 1, out[2]]);
        facing(b, a, d, bottom, shade, [out[0], -1, out[2]]);
      }
    });
  });
}

/** Les trois pierres plates, sur la lèvre proche, de part et d'autre de la tête du pont (jamais dessus). */
function stones(b: FacetBuilder): void {
  const ux = Math.cos(FAILLE_5E.face),
    uz = Math.sin(FAILLE_5E.face);
  const f = FAILLE_5E.head;
  for (const [k, s] of [
    { lat: 1.5, along: 0.9, r: 0.5 },
    { lat: -2.2, along: 1.2, r: 0.45 },
    { lat: 2.6, along: 1.9, r: 0.4 },
  ].entries()) {
    const x = f.x + ux * s.along - uz * s.lat,
      z = f.z + uz * s.along + ux * s.lat;
    b.prism({ x, y: groundAt(x, z) - 0.05, z, yaw: FAILLE_5E.face + k }, s.r, s.r * 0.85, 0.22, 4, C.stoneSide, C.stone);
  }
}

/**
 * La sente de la Faille : de la terre pâle en pointillé, comme celle du Creux, sur l'ocre des Contreforts ; un trait de
 * `dash`, un vide de `gap`, de demi-largeur `half`, posé sur le sol, sur un sol plat (un quad par trait).
 */
export const SENTE_FAILLE = { dash: 1.4, gap: 0.7, half: 0.48, lift: 0.025, color: 0xe6d8b4 } as const;

function sente(b: FacetBuilder): void {
  const [a, c] = FAILLE_5E.sente;
  const d = distance(a, c);
  // La sente s'arrête juste avant la dalle de la lèvre.
  const len = Math.max(0, d - 1);
  const dx = (c.x - a.x) / d,
    dz = (c.z - a.z) / d;
  const H = SENTE_FAILLE.half;
  const p = (t: number, o: number) => [a.x + dx * t + dz * o, groundAt(a.x + dx * t, a.z + dz * t) + SENTE_FAILLE.lift, a.z + dz * t - dx * o] as const;
  for (let s = 0; s < len; s += SENTE_FAILLE.dash + SENTE_FAILLE.gap) {
    const e = Math.min(len, s + SENTE_FAILLE.dash);
    b.quad(p(s, H), p(s, -H), p(e, -H), p(e, H), SENTE_FAILLE.color);
  }
}

/**
 * La Faille : la fente, l'arbre de roche, les deux racines, la lanterne, la vapeur, les trois pierres ; sa sente, si elle
 * est trouvée (`found`). Dans le maillage des lieux : aucun appel de plus.
 */
export function failleFacets(found: boolean): Facets {
  const b = new FacetBuilder();
  const g = groundAt(FAILLE_5E.center.x, FAILLE_5E.center.z);
  rift(b, g);
  const gTree = groundAt(FAILLE_5E.tree.x, FAILLE_5E.tree.z);
  tree(b, gTree);
  roots(b, g, gTree);
  // La lanterne pend sous la racine du sud, côté caméra.
  lantern(b, failleLantern());
  plumes(b, g);
  stones(b);
  if (found) sente(b);
  return b.build();
}

/** Les triangles de la Faille seule (sans sa sente), et avec sa sente : le budget. */
export const failleTriangles = (): { faille: number; withSente: number } => ({ faille: failleFacets(false).triangles, withSente: failleFacets(true).triangles });

/**
 * Ce qu'on ne marche pas à la Faille (./freeWalk.ts) : la fente et la paroi d'en face jusqu'au pied de son dos, une
 * boîte dans le repère de la fente (`u` vers l'est, `v` vers le sud), et le pied de l'arbre de roche. La lèvre proche reste libre : Kéo s'y tient.
 */
export const FAILLE_BLOCKED = {
  rift: { x0: -FAILLE_5E.half.u - WALL_DEPTH, x1: FAILLE_5E.half.u + 0.25, z0: -FAILLE_5E.half.v - 0.3, z1: FAILLE_5E.half.v + 0.3 },
  tree: { x0: FAILLE_5E.tree.x - FAILLE_5E.center.x - FAILLE_TREE.r0 - 0.3, x1: FAILLE_5E.tree.x - FAILLE_5E.center.x + FAILLE_TREE.r0 + 0.3, z0: FAILLE_5E.tree.z - FAILLE_5E.center.z - FAILLE_TREE.r0 - 0.3, z1: FAILLE_5E.tree.z - FAILLE_5E.center.z + FAILLE_TREE.r0 + 0.3 },
} as const;

/**
 * Un toucher sur le pont, dans la fente ou sur la paroi d'en face mène Kéo à la tête du pont, sans phrase d'échec, comme
 * un toucher sur la falaise : le point où il va, ou rien hors de la Faille.
 */
export function failleTapTarget(p: Vec2): Vec2 | null {
  const H = FAILLE_5E.half;
  const u = p.x - FAILLE_5E.center.x,
    v = p.z - FAILLE_5E.center.z;
  const R = FAILLE_BLOCKED.rift;
  if (u >= R.x0 - 0.2 && u <= H.u + 0.05 && v >= R.z0 && v <= R.z1) return FAILLE_5E.head;
  return null;
}
