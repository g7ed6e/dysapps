// Le pont du ravin (les Coteaux du 4e ; intention du directeur artistique du 22 octobre 2026, § 2, planche
// `selection-coteaux-v3` validée par le mainteneur le même jour) : « le pont de pierre qui porte les rails et le chemin
// au-dessus du lit sec du torrent ». À la place du pont générique du lot 1 (piles maçonnées, tablier de planches), une
// arche de pierre grise basse, en anse de panier, d'une culée pleine à l'autre ; il se distingue du pont du bassin (une
// volée de fer) et de celui de l'Épaule (une grande arche de basalte). Le ravin a peu de creux : l'arche est basse, et
// son tablier se règle sur les deux berges, jamais sur `BRIDGE.deck` (fait pour un bras de mer) : ni le chemin ni les
// rails ne font de marche aux culées ; il se bombe en dos d'âne et ses culées s'avancent dans le lit, pour que l'arche
// se lise de côté (retouche 1).
//
// Tombé : les deux culées, de chaque côté un départ d'arche brisé en dents (plus court côté Coteaux), aucun moignon de
// pile (une arche n'en a pas), trois claveaux couchés dans le lit sec, et les rails de l'embranchement qui s'arrêtent net
// au bord de chaque culée, leurs dernières traverses posées, sans rail tordu (le rail tordu est le signe de la Jonction).
// Ni lanterne ni mât. Relié : l'arche entière, sa voûte un cran plus sombre ; un tablier de quatre unités et demie, les
// rails de la ligne côté nord (du même dessin, dans l'axe de l'embranchement : la ligne se lit d'un seul tenant) et le
// chemin de dalles côté sud ; deux parapets bas de pierre pleine ; quatre lanternes, une à chaque bout de chaque parapet,
// sur un dé (les lanternes communes des ponts, ./bridges.ts). La pose (GD-20, point 3) : les deux moitiés de l'arche montent, puis la clé ; le tablier et ses rails
// s'avancent ; les parapets et les lanternes montent du tablier. Code pur (./bridges.ts le dessine et le pose).
import type { BridgeParts, BridgeSite, LanternPlace } from './bridges';
import { FacetBuilder, type Facets } from './facets';
import type { Vec2 } from './geometry';
import { C4E, quadOut, type P3 } from './place4eKit';
import { COLORS_4E } from './plan4e';
import { RAILS_LOOK_4E } from './paths4e';
import { heightAt4e } from './terrain4e';

/**
 * Le pont du ravin (artiste technique 3D) : de combien son dessus passe au-dessus du sol des berges (comme la rampe d'une
 * culée, ./bridges.ts), et de combien il se bombe au milieu (`hump`, le dos d'âne : retouche 1, l'arche se lit de côté,
 * son intrados creusé à mi-hauteur de Kéo au moins au-dessus du lit sec, que le ravin, peu creux, ne laissait pas) ; son
 * tablier en travers de la ligne (`v` vers le nord : les rails dans l'axe, le dallage au sud) ; l'épaisseur de l'anneau de
 * l'arche ; où l'arche prend appui, en deçà du bord du creux (les culées s'avancent dans le lit : une arche plus courte,
 * qui se lit comme une arche et non comme une poutre) ; ses voussoirs ; les parapets (épaisseur, hauteur au-dessus du
 * tablier) ; le dé des lanternes ; le pied des culées sous le sol.
 */
export const RAVIN_ARCH = {
  lift: 0.08,
  hump: 0.9,
  north: 1.15,
  south: -3.3,
  ballast: RAILS_LOOK_4E.ballast,
  ring: 0.3,
  spring: 1.4,
  voussoirs: 11,
  parapet: { thick: 0.36, height: 0.8 },
  die: { size: 0.5, height: 0.3 },
  foot: 0.5,
} as const;

/** Les couleurs : la pierre grise des Passeurs, ses claveaux au soleil, la voûte un cran plus sombre ; le dallage et ses joints. */
const C = {
  stone: C4E.stone,
  sun: C4E.stoneSun,
  vault: C4E.stoneShade,
  broken: 0x6c6058,
  paving: C4E.paving,
  joint: C4E.joint,
} as const;

/** Un point sur la ligne du pont : `d` depuis `near`, `v` en travers (vers le nord), à la hauteur `y`. */
const pointOf =
  (s: BridgeSite) =>
  (d: number, v: number, y: number): P3 => [s.near.x + s.dir.x * d - s.dir.z * v, y, s.near.z + s.dir.z * d + s.dir.x * v];

/**
 * Le dessus du pont à `d` : d'une berge à l'autre, juste au-dessus du sol au début de chaque culée (ni marche ni cassure),
 * bombé en dos d'âne (une demi-onde de `hump` au milieu : sa pente reste douce, sous 0,2 ; on y marche).
 */
export function ravinDeckAt(s: BridgeSite, d: number): number {
  const u = Math.min(1, Math.max(0, (d - s.abut[0]) / (s.abut[1] - s.abut[0])));
  return s.base[0] + (s.base[1] - s.base[0]) * u + RAVIN_ARCH.lift + RAVIN_ARCH.hump * Math.sin(Math.PI * u);
}

/** Les deux appuis de l'arche, sur la ligne du pont (le bout de chaque culée vers le creux). */
const springsOf = (s: BridgeSite): readonly [number, number] => [s.water[0] + RAVIN_ARCH.spring, s.water[1] - RAVIN_ARCH.spring];

/** Les faces du pont en travers : le nu de chaque parapet, au-dehors. */
const FACE_N = RAVIN_ARCH.north + RAVIN_ARCH.parapet.thick;
const FACE_S = RAVIN_ARCH.south - RAVIN_ARCH.parapet.thick;

/**
 * L'intrados de l'arche à `d` : une anse de panier basse (une demi-ellipse aplatie à la clé), de l'appui, au niveau du
 * lit sec, jusque sous l'anneau à la clé. Le ravin n'est pas creux : sa flèche reste petite (intention, « Je ne demande
 * pas un ravin plus creux »). Calculé à chaque appel (le pont se dessine une fois).
 */
function intrados(s: BridgeSite, d: number): number {
  const [a, c] = springsOf(s);
  const mid = (a + c) / 2;
  const half = (c - a) / 2;
  // L'appui part du lit sec, sous les berges : l'arche s'y enfonce, sa courbe se lit au-dessus du fond.
  let spring = Infinity;
  for (let k = 0; k <= 8; k++) spring = Math.min(spring, heightAt4e(at2(s, a + ((c - a) * k) / 8)));
  spring -= 0.1;
  const crown = ravinDeckAt(s, mid) - RAVIN_ARCH.ring - 0.06;
  const rise = Math.max(0.2, crown - spring);
  const t = Math.min(1, Math.abs(d - mid) / half);
  // L'anse de panier : une superellipse, plus plate à la clé qu'un arc de cercle.
  return crown - rise + rise * Math.pow(1 - Math.pow(t, 2.6), 1 / 2.6);
}

const at2 = (s: BridgeSite, d: number): Vec2 => ({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d });

/** Le pied des culées et des tympans : sous le plus bas du sol entre les deux berges. */
function footOf(s: BridgeSite): number {
  let low = Infinity;
  for (let d = s.abut[0]; d <= s.abut[1]; d += 0.5) low = Math.min(low, heightAt4e(at2(s, d)));
  return low - RAVIN_ARCH.foot;
}

/**
 * Une tranche d'arche, de `d0` à `d1` sur la ligne, de `v0` à `v1` en travers : son intrados (la voûte, plus sombre), son
 * dessus (le tablier, ou la cassure d'un départ), ses faces de tête si elles se voient (`sides`, au sud puis au nord :
 * l'anneau des claveaux, puis le tympan jusqu'au dessus) ; `end` : la face du bout, brisée.
 */
function archSlice(b: FacetBuilder, s: BridgeSite, d0: number, d1: number, v0: number, v1: number, opts: { sides: readonly [boolean, boolean]; end?: 0 | 1; ring: number; top: boolean }): void {
  const p = pointOf(s);
  const lo = (d: number) => intrados(s, d);
  const hi = (d: number) => ravinDeckAt(s, d);
  const mid: P3 = p((d0 + d1) / 2, (v0 + v1) / 2, (lo(d0) + hi(d0)) / 2);
  const out = (q: P3): P3 => [q[0] - mid[0], q[1] - mid[1], q[2] - mid[2]];
  quadOut(b, p(d0, v0, lo(d0)), p(d1, v0, lo(d1)), p(d1, v1, lo(d1)), p(d0, v1, lo(d0)), [0, -1, 0], C.vault);
  if (opts.top) quadOut(b, p(d0, v0, hi(d0)), p(d1, v0, hi(d1)), p(d1, v1, hi(d1)), p(d0, v1, hi(d0)), [0, 1, 0], C.stone);
  [v0, v1].forEach((v, k) => {
    if (!opts.sides[k]) return;
    const o = out(p((d0 + d1) / 2, v, mid[1]));
    const r0 = lo(d0) + RAVIN_ARCH.ring,
      r1 = lo(d1) + RAVIN_ARCH.ring;
    quadOut(b, p(d0, v, lo(d0)), p(d1, v, lo(d1)), p(d1, v, r1), p(d0, v, r0), o, opts.ring);
    if (Math.max(hi(d0) - r0, hi(d1) - r1) > 0.02) quadOut(b, p(d0, v, Math.min(r0, hi(d0))), p(d1, v, Math.min(r1, hi(d1))), p(d1, v, hi(d1)), p(d0, v, hi(d0)), o, C.stone);
  });
  if (opts.end !== undefined) {
    const d = opts.end === 0 ? d0 : d1;
    quadOut(b, p(d, v0, lo(d)), p(d, v1, lo(d)), p(d, v1, hi(d)), p(d, v0, hi(d)), out(p(d, (v0 + v1) / 2, mid[1])), C.broken);
  }
}

/** Les stations des voussoirs, d'un appui à l'autre. */
function stations(s: BridgeSite): number[] {
  const [a, c] = springsOf(s);
  const n = RAVIN_ARCH.voussoirs;
  return Array.from({ length: n + 1 }, (_, k) => a + ((c - a) * k) / n);
}

/** Un voussoir entier, de face à face, ses claveaux alternés au soleil et dans la pierre grise (ils se lisent). */
const voussoir = (b: FacetBuilder, s: BridgeSite, d0: number, d1: number, k: number): void =>
  archSlice(b, s, d0, d1, FACE_S, FACE_N, { sides: [true, true], ring: k % 2 ? C.stone : C.sun, top: false });

/**
 * Une culée pleine, de `d0` à `d1` sur la ligne (vers le creux, sa face de bout ; vers la terre, enterrée) : son dessus
 * qui suit le tablier, ses deux flancs, sa face vers le creux, jusqu'au pied.
 */
function abutment(b: FacetBuilder, s: BridgeSite, d0: number, d1: number, toward: 0 | 1, foot: number): void {
  const p = pointOf(s);
  const y0 = ravinDeckAt(s, d0),
    y1 = ravinDeckAt(s, d1);
  const vs = [FACE_S, FACE_N] as const;
  quadOut(b, p(d0, vs[0], y0), p(d1, vs[0], y1), p(d1, vs[1], y1), p(d0, vs[1], y0), [0, 1, 0], C.stone);
  for (const [k, v] of vs.entries()) {
    const o: P3 = [-s.dir.z * (k ? 1 : -1), 0, s.dir.x * (k ? 1 : -1)];
    quadOut(b, p(d0, v, foot), p(d1, v, foot), p(d1, v, y1), p(d0, v, y0), o, C.stone);
  }
  const d = toward === 1 ? d1 : d0;
  const y = toward === 1 ? y1 : y0;
  const sign = toward === 1 ? 1 : -1;
  quadOut(b, p(d, vs[0], foot), p(d, vs[1], foot), p(d, vs[1], y), p(d, vs[0], y), [s.dir.x * sign, 0, s.dir.z * sign], C.stone);
}

/** Une bande le long de la ligne, de `d0` à `d1`, de `v0` à `v1`, son dessus à `top` au-dessus du tablier, ses flancs jusqu'à `foot` dessous. */
function strip(b: FacetBuilder, s: BridgeSite, d0: number, d1: number, v0: number, v1: number, top: number, foot: number, side: number, face: number): void {
  const p = pointOf(s);
  const y = (d: number) => ravinDeckAt(s, d);
  quadOut(b, p(d0, v0, y(d0) + top), p(d1, v0, y(d1) + top), p(d1, v1, y(d1) + top), p(d0, v1, y(d0) + top), [0, 1, 0], face);
  for (const [k, v] of [v0, v1].entries()) {
    const o: P3 = [-s.dir.z * (k ? 1 : -1), 0, s.dir.x * (k ? 1 : -1)];
    quadOut(b, p(d0, v, y(d0) - foot), p(d1, v, y(d1) - foot), p(d1, v, y(d1) + top), p(d0, v, y(d0) + top), o, side);
  }
}

/**
 * Les rails de la ligne sur le pont, de `d0` à `d1` : le dessin de l'embranchement (./paths4e.ts, `RAILS_LOOK_4E`) posé sur
 * le tablier comme sur le sol des berges (le tablier y passe de `lift` au-dessus) : le ballast, deux rails, et les
 * traverses à leur pas, sur la même suite que celles de la ligne (de `near`, tous les `step`), entre `from` et `to`.
 */
function rails(b: FacetBuilder, s: BridgeSite, d0: number, d1: number, step: number, from: number, to: number): void {
  const R = RAILS_LOOK_4E;
  const base = R.lift - RAVIN_ARCH.lift;
  strip(b, s, d0, d1, -R.ballast, R.ballast, base + R.ballastTop, 0.05, COLORS_4E.ballast, COLORS_4E.ballast);
  for (const side of [-1, 1]) {
    const v = (side * R.gauge) / 2;
    strip(b, s, d0, d1, v - R.rail / 2, v + R.rail / 2, base + R.ballastTop + 0.08 + R.rail, -(base + R.ballastTop + 0.08), COLORS_4E.rustShade, COLORS_4E.rust);
  }
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const p = pointOf(s);
  for (let k = 0; (k + 0.5) * step <= s.length; k++) {
    const d = (k + 0.5) * step;
    if (d < from || d > to) continue;
    const q = p(d, 0, 0);
    b.box({ x: q[0], y: ravinDeckAt(s, d) + base + R.ballastTop, z: q[2], yaw }, [R.sleeperLength, 0.08, 0.32], COLORS_4E.woodShade, COLORS_4E.wood);
  }
}

/**
 * Le pas des traverses et des pans de la ligne sur la liaison du pont (comme ./paths4e.ts, `railLine`) : les rails des
 * culées partent où ceux de la ligne s'arrêtent (le dernier pan entier hors du pont), sans trou ni recouvrement.
 */
function railSteps(s: BridgeSite): { sleeper: number; east: number; west: number } {
  const R = RAILS_LOOK_4E;
  const piece = s.length / Math.max(1, Math.ceil(s.length / R.piece));
  return { sleeper: s.length / Math.max(1, Math.ceil(s.length / R.sleeper)), east: Math.floor(s.abut[0] / piece) * piece, west: Math.ceil(s.abut[1] / piece) * piece };
}

/** Ce qui ne bouge jamais : les deux culées pleines, et sur chacune les rails de la ligne jusqu'à son bord. */
export function ravinRest(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  const [a, c] = springsOf(s);
  const foot = footOf(s);
  abutment(b, s, s.abut[0], a, 1, foot);
  abutment(b, s, c, s.abut[1], 0, foot);
  const st = railSteps(s);
  rails(b, s, st.east, a, st.sleeper, s.abut[0], a - 0.2);
  rails(b, s, c, st.west, st.sleeper, c + 0.2, s.abut[1]);
  return b.build();
}

/**
 * Un départ d'arche brisé, de l'appui `from` vers le creux (`sign`), long de `length` au plus : trois rangs à travers la
 * largeur, chacun à sa longueur (`teeth`, en part de `length`) : le bout cassé en dents, puis le vide franc.
 */
function brokenStart(b: FacetBuilder, s: BridgeSite, from: number, sign: 1 | -1, length: number, teeth: readonly [number, number, number]): void {
  const w = (FACE_N - FACE_S) / 3;
  teeth.forEach((k, i) => {
    const v0 = FACE_S + i * w,
      v1 = v0 + w;
    const end = from + sign * length * k;
    const [d0, d1] = sign > 0 ? [from, end] : [end, from];
    const shorter = (j: number) => j < 0 || j > 2 || teeth[j] < k;
    archSlice(b, s, d0, d1, v0, v1, { sides: [shorter(i - 1), shorter(i + 1)], end: sign > 0 ? 1 : 0, ring: C.stone, top: true });
  });
}

/** Les trois claveaux tombés, couchés sur le sable du fond : leur place (en part du creux, puis en travers), leur taille, leur cap. */
const FALLEN: readonly (readonly [number, number, number, number])[] = [
  [0.42, -0.4, 0.75, 0.5],
  [0.55, -2.4, 0.65, 1.4],
  [0.66, 0.4, 0.6, 2.3],
];

/** Le pont tombé : les culées et leurs rails, les deux départs brisés (plus court côté Coteaux), trois claveaux dans le lit. */
export function ravinFallen(s: BridgeSite): Facets {
  const b = new FacetBuilder();
  b.append(ravinRest(s));
  const [a, c] = springsOf(s);
  const span = c - a;
  brokenStart(b, s, a, 1, span * 0.3, [1, 0.78, 0.58]);
  brokenStart(b, s, c, -1, span * 0.16, [0.62, 0.85, 1]);
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const p = pointOf(s);
  for (const [u, v, size, turn] of FALLEN) {
    const q = p(a + span * u, v, 0);
    b.box({ x: q[0], y: heightAt4e({ x: q[0], z: q[2] }) - 0.12, z: q[2], yaw: yaw + turn }, [size * 1.3, size * 0.7, size], C.stone, C.sun);
  }
  return b.build();
}

/**
 * Où se dressent les lanternes du pont relié (règle commune des ponts du 4e : le pont en ruine n'en a pas ; relié, quatre,
 * allumées d'ocre fixe) : une à chaque bout de chaque parapet (`d`, sur la ligne ; `v`, en travers), sur le dé de pierre
 * qui coiffe le parapet (`foot`, au-dessus du tablier), sur un mât court (`mast`). ./bridges.ts les dessine, avec celles
 * des autres ponts (`lanterns`).
 */
export function ravinLanternPlace(s: BridgeSite): LanternPlace {
  const P = RAVIN_ARCH.parapet;
  return { d: parapetEnds(s), v: [RAVIN_ARCH.north + P.thick / 2, RAVIN_ARCH.south - P.thick / 2], foot: P.height + RAVIN_ARCH.die.height, mast: 0.5 };
}

/** Les deux bouts des parapets, sur la ligne du pont, d'une culée à l'autre. */
const parapetEnds = (s: BridgeSite): readonly [number, number] => [s.abut[0] + 0.4, s.abut[1] - 0.4];

/** Les dés de pierre des lanternes, un à chaque bout de chaque parapet. */
function lanternDice(b: FacetBuilder, s: BridgeSite): void {
  const D = RAVIN_ARCH.die;
  const yaw = Math.atan2(s.dir.x, s.dir.z);
  const { d: ends, v: sides } = ravinLanternPlace(s);
  for (const d of ends)
    for (const v of typeof sides === 'number' ? [-sides, sides] : sides) {
      const p = pointOf(s)(d, v, 0);
      const y = ravinDeckAt(s, d) + RAVIN_ARCH.parapet.height;
      b.box({ x: p[0], y: y - 0.05, z: p[2], yaw }, [D.size, D.height + 0.05, D.size], C.stone, C.sun);
    }
}

/**
 * Le pont relié, en trois temps (GD-20, point 3) : l'arche (sa moitié est, sa moitié ouest, puis la clé), le tablier (le
 * dallage et les rails sur l'arche), puis les parapets et les quatre lanternes.
 */
export function ravinParts(s: BridgeSite): BridgeParts {
  const st = stations(s);
  const n = st.length - 1;
  const key = Math.floor(n / 2);
  const half = (from: number, to: number) => {
    const b = new FacetBuilder();
    for (let k = from; k < to; k++) voussoir(b, s, st[k], st[k + 1], k);
    return b.build();
  };
  const piles = [half(0, key), half(key + 1, n), half(key, key + 1)];
  // Le tablier, sur l'arche, d'un appui à l'autre : le dallage au sud et ses joints, les rails de la ligne au nord.
  const [a, c] = springsOf(s);
  const deck = new FacetBuilder();
  const p = pointOf(s);
  const lo = -RAILS_LOOK_4E.ballast;
  quadOut(deck, p(a, RAVIN_ARCH.south, ravinDeckAt(s, a)), p(c, RAVIN_ARCH.south, ravinDeckAt(s, c)), p(c, lo, ravinDeckAt(s, c)), p(a, lo, ravinDeckAt(s, a)), [0, 1, 0], C.paving);
  for (const v of [-1.85, -2.6]) {
    quadOut(deck, p(a, v - 0.04, ravinDeckAt(s, a) + 0.01), p(c, v - 0.04, ravinDeckAt(s, c) + 0.01), p(c, v + 0.04, ravinDeckAt(s, c) + 0.01), p(a, v + 0.04, ravinDeckAt(s, a) + 0.01), [0, 1, 0], C.joint);
  }
  const steps = railSteps(s);
  rails(deck, s, a, c, steps.sleeper, a - 0.2 + 1e-6, c + 0.2 - 1e-6);
  // Les parapets, d'une culée à l'autre, et les dés de leurs bouts (./bridges.ts y pose les lanternes communes).
  const r = new FacetBuilder();
  const P = RAVIN_ARCH.parapet;
  const [d0, d1] = parapetEnds(s);
  strip(r, s, d0, d1, RAVIN_ARCH.north, FACE_N, P.height, 0, C.stone, C.sun);
  strip(r, s, d0, d1, FACE_S, RAVIN_ARCH.south, P.height, 0, C.stone, C.sun);
  lanternDice(r, s);
  return { piles, deck: deck.build(), rails: r.build() };
}

/**
 * Le dessus du pont du ravin où Kéo se tient, à `d` sur sa ligne et `v` en travers (vers le nord), ou rien : les culées
 * toujours, le tablier seulement relié (`open`).
 */
export function ravinFloor(s: BridgeSite, d: number, v: number, open: boolean): number | null {
  if (d < s.abut[0] || d > s.abut[1] || v > RAVIN_ARCH.north + 0.2 || v < RAVIN_ARCH.south - 0.2) return null;
  const [a, c] = springsOf(s);
  if (d <= a || d >= c || open) return ravinDeckAt(s, d);
  return null;
}
