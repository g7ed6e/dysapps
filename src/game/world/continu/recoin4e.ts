/**
 * Le Détour du Recoin (lot 3 du monde ouvert du 4e, avec la Manufacture ; intention du directeur artistique du 22 octobre
 * 2026, « Le Recoin ») : le Détour du Bastion, sur le mécanisme de l'Épave (./epave4e.ts) : un endroit hors des chemins,
 * que l'élève trouve en marchant ; Kéo s'y arrête, la vue se pose, basse, tournée vers l'angle et la mer du nord,
 * « Le Recoin » s'écrit une fois, et une sente reste tracée pour de bon après la première arrivée. Ni compteur, ni
 * récompense, ni mission.
 *
 * La place : la côte nord du Bastion, à l'est de la Manufacture (./plan4e.ts, `RECOIN_4E`). L'angle de deux murets de
 * brique à hauteur de taille, coiffés de pierre grise, au nord et à l'ouest, ouverts au sud et à l'est, vers la sente ;
 * le long du muret nord, un corps rond de fer rouillé couché sur deux berceaux de pierre, fermé à ses deux bouts, son
 * trou d'homme ouvert sur le dessus ; un figuier en sort, tronc court et coudé, couronne large en deux masses vert olive
 * sec, immobile. Une caisse de bois contre le muret ouest, un siège ; la lanterne d'ocre sur l'angle des murets, allumée
 * dès le départ ; les trois pierres plates de part et d'autre de la sente. Ni cheminée, ni tuyau, ni bouche tournée vers
 * la caméra. Rien à lire. Le dessin reçoit son sol (`ground`). Code pur.
 */
import { SENTE_5E as SENTE } from './creux5e';
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { lantern } from './place4eKit';
import { COLORS_4E, RECOIN_4E } from './plan4e';

/**
 * Le budget du Recoin (intention, « Le coût ») : 175 triangles au plus sans la sente, dans le maillage des lieux ; et sa
 * sente, une fois tracée, au plus `sente` de plus, comme l'Épave.
 */
export const RECOIN_BUDGET = { triangles: 175, sente: 170 } as const;

/** Là où Kéo s'arrête : à l'est de la chaudière, face au nord ; et le repère de l'angle des murets, d'où tout se dessine. */
const AT: Vec2 = { x: RECOIN_4E.at.x, z: RECOIN_4E.at.z };
const CORNER: Vec2 = { x: RECOIN_4E.corner.x, z: RECOIN_4E.corner.z };

/**
 * La vue du Recoin à l'arrivée (captures du 22 octobre 2026 : la vue commune des Détours plongeait presque à la verticale
 * et Kéo, dans l'angle, cachait la chaudière juste derrière lui) : basse et un peu reculée, comme à l'Épave, un cran plus
 * haute pour voir par-dessus les murets ; à peine tournée vers le nord-ouest (`turn`) : Kéo au premier plan, à l'est de
 * la chaudière, elle et le figuier à côté de lui, à gauche, l'angle des murets au fond, la mer du nord derrière.
 */
const RECOIN_VIEW = { height: -2, back: 1.2, turn: 0.15 } as const;

/**
 * Le Recoin, un Détour comme les autres (son nom : le consultant d'Archipéo, « le Recoin », sans élision). `face` va de
 * la mer (au nord) vers Kéo : la caméra regarde à l'opposé, vers le nord (`detourCap`), tournée de `RECOIN_VIEW.turn`.
 */
export const RECOIN: Detour = {
  id: 'recoin',
  land: 'bastion',
  name: 'Le Recoin',
  kind: 'recoin',
  at: AT,
  radius: 3.2,
  foot: { x: RECOIN_4E.foot.x, z: RECOIN_4E.foot.z },
  face: Math.PI / 2,
  sente: [RECOIN_4E.senteFrom, RECOIN_4E.bend, RECOIN_4E.foot, AT].map((p) => ({ x: p.x, z: p.z })),
  view: RECOIN_VIEW,
};

/**
 * Les couleurs : la brique du 4e et la seule pierre grise `#8F8B88` (intention, « La cohérence du Bastion », point 2) ;
 * le fer rouillé du 4e, ses bouts un cran plus sombres, l'ombre du trou d'homme ; l'écorce grise du figuier, sa couronne
 * vert olive sec (`#8A8A4C`) et son dessous ; le bois de la caisse ; les pierres des Détours.
 */
const C = {
  brick: COLORS_4E.brick,
  brickShade: COLORS_4E.brickShade,
  stone: 0x8f8b88,
  iron: COLORS_4E.rust,
  ironEnd: COLORS_4E.rustShade,
  hole: 0x3a2c28,
  bark: 0x8a8076,
  barkShade: 0x746a60,
  leaf: 0x8a8a4c,
  leafShade: 0x6e6e3e,
  wood: COLORS_4E.wood,
  woodTop: COLORS_4E.woodShade,
  // Les trois pierres : celles des Détours du 6e (./detours.ts), comme à l'Épave.
  rock: 0xc9c0ae,
  rockSide: 0xa9a08f,
} as const;

/** Le sol sous un point, jamais sous l'eau. */
type Ground = (x: number, z: number) => number;
type P3 = readonly [number, number, number];

/**
 * Les deux murets, depuis l'angle (`corner`, x vers l'est, z vers le sud) : le nord, de la face intérieure du muret ouest jusqu'à son
 * bout est ; l'ouest, de la face extérieure du muret nord jusqu'à son bout sud. Leur épaisseur, leur hauteur au-dessus du
 * sol le plus haut de leur pied, et de combien ils s'enfoncent sous le plus bas.
 */
export const RECOIN_WALLS = {
  north: { z: -2.65, x0: -2.25, x1: 2.8 },
  west: { x: -2.4, z0: -2.8, z1: 1.6 },
  thick: 0.3,
  high: 0.9,
  sink: 0.15,
} as const;

/** Les deux berceaux de pierre sous la chaudière : leur écart au milieu, leur taille, et de combien elle s'y enfonce. */
const CRADLE = { offset: 0.9, size: [0.36, 0.3, 1.0] as P3, seat: 0.1 } as const;

/** Le trou d'homme, sur le dessus de la chaudière, à l'ouest de son milieu : sa place le long de l'axe, son rayon. */
const MANHOLE = { along: -0.35, r: 0.32 } as const;

/** Le tronc coudé (deux pans, de son pied dans le trou d'homme à son coude, puis à la couronne) et ses rayons. */
const TRUNK = { knee: [-0.55, 1.15, 0.35] as P3, crown: [-0.2, 2.25, 0.15] as P3, r: [0.17, 0.13] } as const;

/**
 * Les deux masses de la couronne, depuis le pied du tronc : leur milieu, leur rayon, leur haut et leur bas (deux cônes à
 * six pans, base contre base), et leur tour : large, elle couvre l'angle des murets.
 */
const CROWN = [
  { at: [-0.5, 2.55, 0.25] as P3, r: 1.55, up: 0.95, down: 0.55, yaw: 0.2 },
  { at: [0.95, 2.3, -0.15] as P3, r: 1.15, up: 0.75, down: 0.45, yaw: 0.7 },
] as const;

/** La caisse de bois, debout contre le muret ouest : sa place depuis l'angle (`corner`), sa taille. */
const CRATE = { x: -1.95, z: 0.35, size: [0.52, 0.5, 0.56] as P3 } as const;

/** Un fût à `sides` pans, tendu entre deux points (le tronc) : 2 × `sides` triangles, sans bouts. */
function limb(b: FacetBuilder, a: P3, c: P3, r0: number, r1: number, sides: number, color: number, shade: number): void {
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const k = d.map((v) => v / len);
  const ref = Math.abs(k[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [k[1] * ref[2] - k[2] * ref[1], k[2] * ref[0] - k[0] * ref[2], k[0] * ref[1] - k[1] * ref[0]];
  const ul = Math.hypot(u[0], u[1], u[2]);
  u = u.map((x) => x / ul);
  const w = [k[1] * u[2] - k[2] * u[1], k[2] * u[0] - k[0] * u[2], k[0] * u[1] - k[1] * u[0]];
  const ring = (p: P3, r: number) =>
    Array.from({ length: sides }, (_, i) => {
      const t = (2 * Math.PI * i) / sides;
      const cx = Math.cos(t) * r,
        cy = Math.sin(t) * r;
      return [p[0] + u[0] * cx + w[0] * cy, p[1] + u[1] * cx + w[1] * cy, p[2] + u[2] * cx + w[2] * cy] as const;
    });
  const A = ring(a, r0),
    B = ring(c, r1);
  for (let i = 0; i < sides; i++) {
    const n = (i + 1) % sides;
    b.quad(A[i], A[n], B[n], B[i], i % 2 ? shade : color);
  }
}

/** Le sol le plus bas et le plus haut sous un rectangle du monde (ses coins et son milieu). */
function groundSpan(ground: Ground, x0: number, x1: number, z0: number, z1: number): [number, number] {
  const ys = [ground(x0, z0), ground(x1, z0), ground(x0, z1), ground(x1, z1), ground((x0 + x1) / 2, (z0 + z1) / 2)];
  return [Math.min(...ys), Math.max(...ys)];
}

/**
 * Les deux murets de brique, coiffés de pierre : le nord sans son bout ouest (dans le muret ouest), l'ouest avec ses deux
 * bouts (le nord fait l'angle dehors) ; jamais de dessous.
 */
function walls(b: FacetBuilder, ground: Ground): void {
  const W = RECOIN_WALLS,
    t = W.thick / 2;
  // Un muret, du sol le plus bas de son pied au-dessus du plus haut : son dessus de pierre, ses faces nord et sud, et ses
  // bouts est, ouest, s'ils se voient.
  const run = (x0: number, x1: number, z0: number, z1: number, east: boolean, west: boolean) => {
    const [lo, hi] = groundSpan(ground, x0, x1, z0, z1);
    const y0 = lo - W.sink,
      y1 = hi + W.high;
    b.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], C.stone);
    b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], C.brick);
    b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], C.brickShade);
    if (east) b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], C.brick);
    if (west) b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], C.brickShade);
  };
  // Le muret nord : son bout ouest est dans le muret ouest.
  run(CORNER.x + W.north.x0, CORNER.x + W.north.x1, CORNER.z + W.north.z - t, CORNER.z + W.north.z + t, true, false);
  // Le muret ouest, le long de z : ses deux bouts (nord, sud) et ses deux faces (est, ouest) se voient.
  run(CORNER.x + W.west.x - t, CORNER.x + W.west.x + t, CORNER.z + W.west.z0, CORNER.z + W.west.z1, true, true);
}

/** Le haut des murets à l'angle (pour la lanterne). */
function cornerTop(ground: Ground): number {
  const W = RECOIN_WALLS;
  const [, hi] = groundSpan(ground, CORNER.x + W.west.x - W.thick / 2, CORNER.x + W.west.x + W.thick / 2, CORNER.z + W.west.z0, CORNER.z + W.west.z1);
  return hi + W.high;
}

/** L'axe de la chaudière, à sa hauteur : posée dans ses berceaux, eux sur le sol le plus bas sous elle. */
function boilerAxis(ground: Ground): number {
  const { boiler: k } = RECOIN_4E;
  const [lo] = groundSpan(ground, k.x - k.half, k.x + k.half, k.z - k.r, k.z + k.r);
  return lo + CRADLE.size[1] + k.r - CRADLE.seat;
}

/**
 * La chaudière : un corps rond couché d'ouest en est, fermé à ses deux bouts (huit pans, un à plat dessus), sur ses deux
 * berceaux de pierre ; son trou d'homme ouvert sur le dessus, une ombre ronde.
 */
function boiler(b: FacetBuilder, ground: Ground): void {
  const { boiler: k } = RECOIN_4E;
  const y = boilerAxis(ground);
  for (const s of [-1, 1]) {
    const x = k.x + s * CRADLE.offset;
    const [lo] = groundSpan(ground, x - CRADLE.size[0] / 2, x + CRADLE.size[0] / 2, k.z - CRADLE.size[2] / 2, k.z + CRADLE.size[2] / 2);
    b.box({ x, y: lo - 0.1, z: k.z }, [CRADLE.size[0], y - k.r + CRADLE.seat - lo + 0.1, CRADLE.size[2]], C.stone);
  }
  // Le corps, à huit pans, son axe le long de x, un pan à plat sur le dessus ; ses deux bouts pleins.
  const ring = (x: number): P3[] =>
    Array.from({ length: 8 }, (_, i) => {
      const t = Math.PI / 8 + (Math.PI * i) / 4;
      return [x, y + Math.sin(t) * k.r, k.z + Math.cos(t) * k.r] as const;
    });
  const W = ring(k.x - k.half),
    E = ring(k.x + k.half);
  for (let i = 0; i < 8; i++) {
    const n = (i + 1) % 8;
    b.quad(W[i], W[n], E[n], E[i], C.iron);
  }
  const mid = (x: number): P3 => [x, y, k.z];
  for (let i = 0; i < 8; i++) {
    const n = (i + 1) % 8;
    b.triangle(mid(k.x + k.half), E[i], E[n], C.ironEnd);
    b.triangle(mid(k.x - k.half), W[n], W[i], C.ironEnd);
  }
  // L'ombre du trou d'homme, sur le pan du dessus (un hexagone plat, à peine au-dessus).
  const top = y + k.r * Math.cos(Math.PI / 8) + 0.02;
  const cx = k.x + MANHOLE.along;
  const rim: P3[] = Array.from({ length: 6 }, (_, i) => {
    const t = (2 * Math.PI * i) / 6;
    return [cx + Math.cos(t) * MANHOLE.r, top, k.z + Math.sin(t) * MANHOLE.r * 0.8] as const;
  });
  for (let i = 1; i < 5; i++) b.triangle(rim[0], rim[i + 1], rim[i], C.hole);
}

/** Le figuier : son tronc coudé, du trou d'homme à la couronne, et ses deux masses. */
function figTree(b: FacetBuilder, ground: Ground): void {
  const { boiler: k } = RECOIN_4E;
  const base: P3 = [k.x + MANHOLE.along, boilerAxis(ground) + k.r * 0.6, k.z];
  const off = (p: P3): P3 => [base[0] + p[0], base[1] + p[1], base[2] + p[2]];
  limb(b, base, off(TRUNK.knee), TRUNK.r[0], TRUNK.r[1], 4, C.bark, C.barkShade);
  limb(b, off(TRUNK.knee), off(TRUNK.crown), TRUNK.r[1], TRUNK.r[1] * 0.8, 4, C.bark, C.barkShade);
  for (const m of CROWN) {
    const c = off(m.at);
    const ring: P3[] = Array.from({ length: 6 }, (_, i) => {
      const t = m.yaw + (2 * Math.PI * i) / 6;
      return [c[0] + Math.cos(t) * m.r, c[1], c[2] + Math.sin(t) * m.r] as const;
    });
    const up: P3 = [c[0], c[1] + m.up, c[2]];
    const down: P3 = [c[0], c[1] - m.down, c[2]];
    for (let i = 0; i < 6; i++) {
      const n = (i + 1) % 6;
      b.triangle(up, ring[n], ring[i], C.leaf);
      b.triangle(down, ring[i], ring[n], C.leafShade);
    }
  }
}

/** La caisse de bois, debout contre le muret ouest, et la lanterne d'ocre sur l'angle des murets, allumée. */
function crateAndLantern(b: FacetBuilder, ground: Ground): void {
  const x = CORNER.x + CRATE.x,
    z = CORNER.z + CRATE.z;
  const [lo] = groundSpan(ground, x - CRATE.size[0] / 2, x + CRATE.size[0] / 2, z - CRATE.size[2] / 2, z + CRATE.size[2] / 2);
  b.box({ x, y: lo - 0.05, z, yaw: 0.12 }, [CRATE.size[0], CRATE.size[1] + 0.05, CRATE.size[2]], C.wood, C.woodTop);
  const W = RECOIN_WALLS;
  lantern(b, { x: CORNER.x + W.west.x, y: cornerTop(ground) + 0.36, z: CORNER.z + W.north.z }, true);
}

/** Les trois pierres plates, autour de Kéo, de part et d'autre de la sente (jamais dessus), depuis l'angle (`corner`). */
export const RECOIN_STONES = [
  { x: 0.3, z: 2.2, r: 0.5 },
  { x: 2.9, z: 2.6, r: 0.52 },
  { x: 3.9, z: 0.9, r: 0.42 },
] as const;

/** Le pied d'une pierre de `RECOIN_STONES`, dans le monde. */
export const recoinStoneAt = (k: number): Vec2 => ({ x: CORNER.x + RECOIN_STONES[k].x, z: CORNER.z + RECOIN_STONES[k].z });

function stones(b: FacetBuilder, ground: Ground): void {
  RECOIN_STONES.forEach((s, k) => {
    const p = recoinStoneAt(k);
    b.prism({ x: p.x, y: Math.max(0, ground(p.x, p.z)) - 0.05, z: p.z, yaw: 0.4 + k }, s.r, s.r * 0.85, 0.22, 4, C.rockSide, C.rock);
  });
}

/** La sente du Recoin, en pointillé : celle du 5e (./creux5e.ts, `SENTE_5E`), un pavé par moitié de tiret, coude après coude. */
function sente(b: FacetBuilder, ground: Ground): void {
  const line = RECOIN.sente;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const dx = (c.x - a.x) / len,
      dz = (c.z - a.z) / len;
    const p = (t: number, o: number): P3 => [a.x + dx * t + dz * o, Math.max(0, ground(a.x + dx * t, a.z + dz * t)) + SENTE.lift, a.z + dz * t - dx * o];
    let s = carry;
    while (s < len) {
      const e = Math.min(len, s + SENTE.dash);
      for (let t = s; t < e - 1e-6; t += 0.7) {
        const t1 = Math.min(e, t + 0.7);
        b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
      }
      s = e + SENTE.gap;
    }
    carry = s - len;
  }
}

/**
 * Le décor du Recoin, tel que la vue l'ajoute au maillage des lieux (aucun appel de plus) : les murets, la chaudière et
 * ses berceaux, le figuier, la caisse, la lanterne, les pierres, et sa sente une fois trouvée (`found`), dans le monde
 * comme sur la Carte. Sans la sente : le plafond de 175 triangles (intention, « Le coût »).
 */
export function recoinFacets(found: boolean, ground: Ground): Facets {
  const b = new FacetBuilder();
  walls(b, ground);
  boiler(b, ground);
  figTree(b, ground);
  crateAndLantern(b, ground);
  stones(b, ground);
  if (found) sente(b, ground);
  return b.build();
}
